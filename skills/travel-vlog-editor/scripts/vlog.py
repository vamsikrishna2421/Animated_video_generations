"""Shared helpers for the travel-vlog-editor scripts: find ffmpeg/ffprobe, probe media, read frames/audio as numpy.

Only depends on ffmpeg (+ ffprobe if present), numpy and Pillow, so it runs on macOS, Windows and Linux.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".avi", ".mts", ".360", ".insv"}
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"}


def _find(name):
    env = os.environ.get(name.upper())
    if env and Path(env).exists():
        return env
    p = shutil.which(name)
    if p:
        return p
    for d in ("/opt/homebrew/bin", "/usr/local/bin", "C:/ffmpeg/bin", str(Path.home() / "ffmpeg/bin")):
        for ext in ("", ".exe"):
            c = Path(d) / f"{name}{ext}"
            if c.exists():
                return str(c)
    return None


FFMPEG = _find("ffmpeg")
FFPROBE = _find("ffprobe")


def need_ffmpeg():
    if not FFMPEG:
        sys.exit("ffmpeg not found. Run scripts/setup_check.py for install steps (or set FFMPEG=/path/to/ffmpeg).")


def run(cmd, quiet=True, check=True):
    """Run a command list; raise with the tail of stderr on failure."""
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and r.returncode != 0:
        tail = r.stderr.decode(errors="replace")[-2500:]
        raise RuntimeError(f"command failed ({r.returncode}): {' '.join(map(str, cmd[:6]))} ...\n{tail}")
    return r


def ff(*args):
    need_ffmpeg()
    return run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *map(str, args)])


def has_filter(name):
    need_ffmpeg()
    out = run([FFMPEG, "-hide_banner", "-filters"]).stdout.decode(errors="replace")
    return re.search(rf"^\s*\S+\s+{re.escape(name)}\s", out, re.M) is not None


def probe(path):
    """Return dict: duration, width, height, fps, vcodec, has_audio, creation_time, rotation, bit_depth."""
    path = str(path)
    if FFPROBE:
        r = run([FFPROBE, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path], check=False)
        if r.returncode == 0:
            j = json.loads(r.stdout or b"{}")
            v = next((s for s in j.get("streams", []) if s.get("codec_type") == "video" and s.get("disposition", {}).get("attached_pic", 0) == 0), None)
            a = next((s for s in j.get("streams", []) if s.get("codec_type") == "audio"), None)
            fmt = j.get("format", {})
            fps = 0.0
            if v:
                num, _, den = (v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1").partition("/")
                fps = float(num) / float(den or 1) if float(den or 1) else 0.0
            rot = 0
            if v:
                rot = int(float(v.get("tags", {}).get("rotate", 0) or 0))
                for sd in v.get("side_data_list", []) or []:
                    if "rotation" in sd:
                        rot = int(sd["rotation"])
            tags = {**fmt.get("tags", {}), **(v or {}).get("tags", {})}
            return {
                "duration": float(fmt.get("duration") or (v or {}).get("duration") or 0),
                "width": int(v["width"]) if v else 0,
                "height": int(v["height"]) if v else 0,
                "fps": round(fps, 3),
                "vcodec": (v or {}).get("codec_name", ""),
                "pix_fmt": (v or {}).get("pix_fmt", ""),
                "has_audio": a is not None,
                "creation_time": tags.get("creation_time", ""),
                "rotation": rot,
                "bit_depth": 10 if "10" in (v or {}).get("pix_fmt", "") else 8,
            }
    # fallback: parse `ffmpeg -i` banner
    need_ffmpeg()
    err = run([FFMPEG, "-hide_banner", "-i", path], check=False).stderr.decode(errors="replace")
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    dur = int(d.group(1)) * 3600 + int(d.group(2)) * 60 + float(d.group(3)) if d else 0.0
    vm = re.search(r"Stream #.*Video: (\w+).*?, (\d{2,5})x(\d{2,5})", err)
    fm = re.search(r"([\d.]+) fps", err)
    ct = re.search(r"creation_time\s*:\s*(\S+)", err)
    return {
        "duration": dur,
        "width": int(vm.group(2)) if vm else 0,
        "height": int(vm.group(3)) if vm else 0,
        "fps": float(fm.group(1)) if fm else 0.0,
        "vcodec": vm.group(1) if vm else "",
        "pix_fmt": "yuv420p10le" if "10le" in err else "",
        "has_audio": "Audio:" in err,
        "creation_time": ct.group(1) if ct else "",
        "rotation": 0,
        "bit_depth": 10 if "10le" in err else 8,
    }


def gray_frames(path, fps=2.0, w=96, start=None, dur=None):
    """Yield small grayscale frames (numpy uint8 HxW) sampled at `fps`."""
    import numpy as np
    need_ffmpeg()
    h = int(round(w * 9 / 16 / 2) * 2)
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(path)]
    if dur is not None:
        cmd += ["-t", str(dur)]
    cmd += ["-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    n = w * h
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w)
    p.wait()


def audio_mono(path, sr=16000, start=None, dur=None):
    """Return mono float32 audio at `sr` (empty array if no audio)."""
    import numpy as np
    need_ffmpeg()
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", str(path)]
    if dur is not None:
        cmd += ["-t", str(dur)]
    cmd += ["-vn", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"]
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    return np.frombuffer(r.stdout, np.int16).astype(np.float32) / 32768.0


def font(size, brand=None, bold=True):
    """Pick a TTF: brand font_file first, then common bold system fonts, then Pillow's default."""
    from PIL import ImageFont
    cands = []
    if brand and brand.get("font_file"):
        cands.append(brand["font_file"])
    if bold:
        cands += ["Montserrat-ExtraBold.ttf", "Montserrat-Bold.ttf", "Poppins-Bold.ttf", "Arial Bold.ttf", "arialbd.ttf",
                  "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
                  "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf",
                  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
    cands += ["Arial.ttf", "arial.ttf", "/System/Library/Fonts/Helvetica.ttc", "C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    for c in cands:
        try:
            return ImageFont.truetype(c, size)
        except OSError:
            continue
    return ImageFont.load_default(size) if hasattr(ImageFont, "load_default") else ImageFont.load_default()


def hms(t):
    t = max(0.0, float(t))
    return f"{int(t // 3600):d}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}" if t >= 3600 else f"{int(t // 60):d}:{t % 60:05.2f}"


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_json(p, obj):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
