"""Build a review pack for a rendered video, so Claude (and a simulated viewer) can check it before the human watches.

  python scripts/review_pack.py out/final_preview.mp4 [--every 8]

Writes <video>_review/:
  hook.jpg     first 12 s at 0.5 s steps (does something happen in the first second? is the promise clear by 5 s?)
  sheet_N.jpg  the whole video every --every seconds, timestamps burned in
  audio.png    loudness curve with segment boundaries (blue), chapters (yellow) and quarter averages
  pack.md      measured loudness / true peak, black or frozen stretches, silent gaps, flat-audio warning,
               chapter list, all on-screen text in order, and the review checklist
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sheets  # noqa: E402
import vlog  # noqa: E402


def loudness(path):
    r = vlog.run([vlog.FFMPEG, "-hide_banner", "-nostats", "-i", str(path), "-vn", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"], check=False)
    t = r.stderr.decode(errors="replace")
    t = t[t.rfind("Parsed_loudnorm"):] if "Parsed_loudnorm" in t else t
    try:
        return json.loads(t[t.find("{"): t.rfind("}") + 1])
    except ValueError:
        return {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--every", type=float, default=0)
    a = ap.parse_args()
    import numpy as np
    from PIL import Image, ImageDraw
    vlog.need_ffmpeg()
    v = Path(a.video)
    out = v.with_name(v.stem + "_review")
    out.mkdir(exist_ok=True)
    info = vlog.probe(v)
    dur = info["duration"]
    tl_p = v.with_suffix(".timeline.json")
    if not tl_p.exists():
        alt = v.with_name(v.stem.replace("_preview", "") + ".timeline.json")
        tl_p = alt if alt.exists() else tl_p
    tl = vlog.load_json(tl_p) if tl_p.exists() else {"segments": []}
    every = a.every or max(4.0, round(dur / 60))
    sheets.sheet_set(v, dur, out / "hook", "HOOK (first 12 s)", t0=0, t1=min(12, dur), step=0.5)
    sheet_files = sheets.sheet_set(v, dur, out / "sheet", v.name, n_frames=int(dur / every))
    # picture checks at 2 fps
    fr = list(vlog.gray_frames(v, fps=2, w=96))
    F = np.stack(fr).astype(np.float32) if fr else np.zeros((1, 54, 96))
    bright = F.mean(axis=(1, 2)) / 255
    diff = np.r_[1, np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))]

    def runs(mask, min_len):
        res, start = [], None
        for i, m in enumerate(list(mask) + [False]):
            if m and start is None:
                start = i
            if not m and start is not None:
                if (i - start) / 2 >= min_len:
                    res.append((start / 2, i / 2))
                start = None
        return res
    black = runs(bright < 0.03, 0.5)
    frozen = runs(diff < 0.15, 2.5)
    # audio curve
    au = vlog.audio_mono(v, 16000)
    m = 8000
    na = len(au) // m
    db = 20 * np.log10(np.sqrt((au[: na * m].reshape(na, m) ** 2).mean(axis=1)) + 1e-9) if na else np.array([-90.0])
    silent = runs(db < -45, 1.5)
    q = [float(np.mean(db[int(len(db) * k / 4): int(len(db) * (k + 1) / 4)])) for k in range(4)] if len(db) >= 4 else [float(db.mean())] * 4
    flat = max(q) - min(q) < 1.5
    W, H = 1600, 360
    img = Image.new("RGB", (W, H), (16, 18, 24))
    d = ImageDraw.Draw(img)
    f = vlog.font(16)
    y = lambda x: H - 30 - (max(-60, min(0, x)) + 60) / 60 * (H - 60)  # noqa: E731
    for g in (-10, -20, -30, -40, -50):
        d.line([0, y(g), W, y(g)], fill=(40, 44, 52))
        d.text((4, y(g) - 18), f"{g} dB", fill=(110, 110, 120), font=f)
    for s in tl.get("segments", []):
        x = s["start"] / max(dur, 1e-6) * W
        d.line([x, 20, x, H - 30], fill=(40, 90, 170) if not s.get("chapter") else (255, 200, 60), width=1 if not s.get("chapter") else 2)
        if s.get("chapter"):
            d.text((x + 3, 22), s["chapter"][:22], fill=(255, 200, 60), font=f)
    pts = [(i / max(1, len(db) - 1) * W, y(val)) for i, val in enumerate(db)]
    if len(pts) > 1:
        d.line(pts, fill=(80, 220, 160), width=2)
    for k in range(4):
        d.line([W * k / 4, y(q[k]), W * (k + 1) / 4, y(q[k])], fill=(255, 90, 90), width=3)
    for t in range(0, int(dur) + 1, max(10, int(dur / 12) // 10 * 10 or 10)):
        d.text((t / max(dur, 1e-6) * W + 2, H - 24), vlog.hms(t)[:-3], fill=(160, 160, 170), font=f)
    img.save(out / "audio.png")
    L = loudness(v)
    texts = [(x["abs_at"], x.get("kind", ""), x.get("text", ""), x.get("sub", "")) for s in tl.get("segments", []) for x in s.get("text", [])]
    md = [f"# Review pack: {v.name}", "", f"- length {vlog.hms(dur)}, {info['width']}x{info['height']} @ {info['fps']:g} fps",
          f"- integrated loudness {L.get('input_i', '?')} LUFS (target -14 +-1), true peak {L.get('input_tp', '?')} dBTP (must be <= -1.0), LRA {L.get('input_lra', '?')}",
          f"- quarter loudness (dB RMS): {', '.join(f'{x:.1f}' for x in q)}" + ("  **FLAT: give the music an arc**" if flat else ""),
          f"- black stretches: {black or 'none'}", f"- frozen stretches (>2.5 s, check they are intentional): {frozen or 'none'}",
          f"- silent gaps (>1.5 s): {silent or 'none'}", "", "## Chapters"]
    md += [f"- {vlog.hms(s['start'])} {s['chapter']}" for s in tl.get("segments", []) if s.get("chapter")] or ["- (none marked)"]
    md += ["", "## On-screen text, in order (spell-check every line)"]
    md += [f"- {vlog.hms(t)} [{k}] {tx}" + (f" / {sb}" if sb else "") for t, k, tx, sb in sorted(texts)] or ["- (none)"]
    md += ["", "## Files", "- hook_1.jpg (first 12 s)", *[f"- {Path(x).name}" for x in sheet_files], "- audio.png", "",
           "## Checklist (answer each with a timestamp)",
           "1. First second: is there motion, a face, or a striking image? By 5 s, do I know what this video gives me?",
           "2. Any stretch over ~6 s with no new information, no new angle and no speech? (cut, speed up or add a step/tip card)",
           "3. Are places, prices, times and names on screen spelled right and correct for the trip date?",
           "4. Does the music rise into reveals and the ending, dip under speech (8-12 dB below the voice), and swell in gaps?",
           "5. Any wind roar, clipping, or a jump in loudness between clips?",
           "6. Horizon tilted, shaky or too dark shots that could be swapped for a better take?",
           "7. Does the end screen have 20 s with nothing important under the two video slots?",
           "8. Would a first-time viewer know where they are at every chapter change (location tag / chapter card)?"]
    (out / "pack.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"review pack: {out}")


if __name__ == "__main__":
    main()
