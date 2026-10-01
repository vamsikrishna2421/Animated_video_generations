"""Two-pass loudness normalisation for finished videos (EBU R128 via ffmpeg's loudnorm).

Instagram, YouTube, X and LinkedIn all normalise playback loudness (about -14 LUFS), so a mix that is too
quiet sounds weak next to other posts and one that is too loud gets turned down and squashed. Normalising
every render to -14 LUFS / -1.5 dBTP keeps all our videos at the same level. Video is copied untouched.

  python3 pipeline/loudnorm.py in.mp4 [out.mp4] [--lufs -14]     (no out = replace in place)
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FF_DIR = ROOT / "video" / "node_modules" / "@remotion" / "compositor-linux-x64-gnu"
FF = str(FF_DIR / "ffmpeg")
ENV = {**os.environ, "LD_LIBRARY_PATH": str(FF_DIR)}


def measure(path, target=-14.0, tp=-1.5, lra=11):
    r = subprocess.run([FF, "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af",
                        f"loudnorm=I={target}:TP={tp}:LRA={lra}:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, env=ENV)
    m = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m:
        raise SystemExit(f"loudnorm measure failed for {path}:\n{r.stderr[-800:]}")
    return json.loads(m[-1])


def normalise(src, dst=None, target=-14.0, tp=-1.5, lra=11):
    src = Path(src)
    m = measure(src, target, tp, lra)
    af = (f"loudnorm=I={target}:TP={tp}:LRA={lra}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    out = Path(dst) if dst else Path(tempfile.mktemp(suffix=src.suffix, dir=src.parent))
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-c:v", "copy", "-af", af,
                    "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)], check=True, env=ENV)
    if not dst:
        out.replace(src)
        out = src
    after = measure(out, target, tp, lra)
    print(f"{src.name}: {float(m['input_i']):6.1f} LUFS -> {float(after['input_i']):6.1f} LUFS (peak {float(after['input_tp']):.1f} dBTP)")
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lufs = float(sys.argv[sys.argv.index("--lufs") + 1]) if "--lufs" in sys.argv else -14.0
    if lufs in [float(a) for a in args if re.fullmatch(r"-?\d+(\.\d+)?", a)]:
        args = [a for a in args if not re.fullmatch(r"-?\d+(\.\d+)?", a)]
    normalise(args[0], args[1] if len(args) > 1 else None, lufs)
