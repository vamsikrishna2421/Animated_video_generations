"""Contact sheets so Claude can *see* footage: a grid of frames with timestamps burned in.

  python scripts/sheets.py <project_dir> [--ids GX0123,GX0124] [--frames 40]        overview of every recording
  python scripts/sheets.py <project_dir> --id GX0123 --from 62 --to 70 --step 0.25   fine strip around a moment
  python scripts/sheets.py --video out/preview.mp4 --every 10 --out review/sheet     any video file

Overview sheets go to <project_dir>/sheets/<id>_<n>.jpg (about 40 frames each, 5 columns). Read them with the image
viewer tool; the timestamp on each tile is seconds into that recording (chapters joined).
"""
import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import vlog  # noqa: E402


def frames_at(path, times, w=320):
    from PIL import Image
    h = int(round(w * 9 / 16 / 2) * 2)
    out = []
    for t in times:
        cmd = [vlog.FFMPEG, "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(path), "-frames:v", "1",
               "-vf", f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
        b = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout
        out.append(Image.frombytes("RGB", (w, h), b) if len(b) == w * h * 3 else Image.new("RGB", (w, h), (40, 0, 0)))
    return out


def grid(images, labels, cols=5, title=""):
    from PIL import Image, ImageDraw
    w, h = images[0].size
    rows = (len(images) + cols - 1) // cols
    top = 34 if title else 0
    sheet = Image.new("RGB", (cols * w + (cols + 1) * 4, top + rows * (h + 4) + 4), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    f = vlog.font(18)
    if title:
        d.text((8, 6), title, fill=(255, 255, 255), font=vlog.font(20))
    for i, (im, lab) in enumerate(zip(images, labels)):
        x, y = 4 + (i % cols) * (w + 4), top + 4 + (i // cols) * (h + 4)
        sheet.paste(im, (x, y))
        tw = d.textlength(lab, font=f)
        d.rectangle([x, y, x + tw + 10, y + 24], fill=(0, 0, 0))
        d.text((x + 5, y + 2), lab, fill=(255, 220, 0), font=f)
    return sheet


def sheet_set(path, dur, out_prefix, title, n_frames=40, t0=0.0, t1=None, step=None, w=320, cols=5):
    t1 = dur if t1 is None else min(t1, dur)
    if step:
        times = [t0 + i * step for i in range(int((t1 - t0) / step) + 1)]
    else:
        k = max(1, n_frames)
        times = [t0 + (t1 - t0) * (i + 0.5) / k for i in range(k)]
    times = [t for t in times if t < dur - 0.05]
    per = 40 if not step else 60
    outs = []
    for s in range(0, len(times), per):
        chunk = times[s:s + per]
        ims = frames_at(path, chunk, w=w if not step else 256)
        labs = [f"{t:.2f}s" if step and step < 1 else vlog.hms(t) for t in chunk]
        o = Path(f"{out_prefix}_{s // per + 1}.jpg")
        o.parent.mkdir(parents=True, exist_ok=True)
        grid(ims, labs, cols=cols if not step else 6, title=f"{title}  [{vlog.hms(chunk[0])} - {vlog.hms(chunk[-1])}]").save(o, quality=82)
        outs.append(str(o))
    return outs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", nargs="?")
    ap.add_argument("--ids", default="")
    ap.add_argument("--id", default="")
    ap.add_argument("--frames", type=int, default=0, help="frames per recording (default: 1 per ~8 s, 12..80)")
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--step", type=float)
    ap.add_argument("--video")
    ap.add_argument("--every", type=float, default=0)
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    vlog.need_ffmpeg()
    if a.video:
        d = vlog.probe(a.video)["duration"]
        step = a.step or (a.every if a.every else None)
        outs = sheet_set(a.video, d, a.out or Path(a.video).with_suffix("").as_posix() + "_sheet", Path(a.video).name,
                         n_frames=a.frames or 40, t0=a.t0, t1=a.t1, step=step)
        print("\n".join(outs))
        return
    proj = Path(a.project)
    inv = {r["id"]: r for r in vlog.load_json(proj / "inventory.json")}
    ids = [a.id] if a.id else ([x for x in a.ids.split(",") if x] or list(inv))
    for i in ids:
        r = inv[i]
        src = r.get("proxy") or r["chapters"][0]
        n = a.frames or int(min(80, max(12, r["duration"] / 8)))
        tag = f"_{a.t0:g}-{a.t1:g}" if a.step else ""
        outs = sheet_set(src, r["duration"], proj / "sheets" / f"{i}{tag}", f"{i}  {r['shot_at'][:16]}  {', '.join(r.get('flags', []))}",
                         n_frames=n, t0=a.t0, t1=a.t1, step=a.step)
        print(i, "->", ", ".join(outs), flush=True)


if __name__ == "__main__":
    main()
