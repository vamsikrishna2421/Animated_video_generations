"""Everything needed to upload: chapters, subtitles on the final timeline, thumbnail options and a description draft.

  python scripts/publish_kit.py <project>/out/final.mp4 [--thumb-text "CHEAPEST WAY TO LOGAN"] [--thumb-text2 "Full guide"]

Reads final.timeline.json (written by render.py), the project's transcripts/ and edit.json. Writes <video>_publish/:
  chapters.txt        YouTube-valid chapter list (starts 0:00, >= 3 chapters, each >= 10 s)
  subtitles.srt       what people say, re-timed onto the final cut (original language; upload it in YouTube Studio)
  frames/cand_N.jpg   best-looking full-res frames (sharp, bright, colourful, spread over the video)
  thumb_N.jpg         1280x720 thumbnail drafts: candidate frame + big text in brand style
  description.md      description draft: hook line, chapters, music credits, placeholders for tips/links/hashtags
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import cards  # noqa: E402
import sheets  # noqa: E402
import vlog  # noqa: E402


def yt_time(t):
    t = int(round(t))
    return f"{t // 3600}:{t % 3600 // 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60}:{t % 60:02d}"


def srt_time(t):
    ms = int(round(max(0, t) * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def chapters(tl, dur):
    ch = [(s["start"], s["chapter"]) for s in tl["segments"] if s.get("chapter")]
    if not ch or ch[0][0] > 0.5:
        ch.insert(0, (0.0, "Intro"))
    ch[0] = (0.0, ch[0][1])
    merged = []
    for t, name in ch:  # YouTube ignores chapters shorter than 10 s
        if merged and t - merged[-1][0] < 10:
            continue
        merged.append((t, name))
    if merged and dur - merged[-1][0] < 10 and len(merged) > 1:
        merged.pop()
    return merged


def subtitles(tl, proj):
    lines = []
    for s in tl["segments"]:
        src, t_in, t_out = s.get("src"), s.get("in"), s.get("out")
        p = proj / "transcripts" / f"{src}.json"
        if t_in is None or not p.exists() or s.get("audio") == "mute":
            continue
        sp = float(s.get("speed", 1) or 1)
        if sp > 1.6:
            continue  # sped-up talk is not worth subtitling
        t_out = t_out if t_out is not None else 1e9
        for seg in vlog.load_json(p)["segments"]:
            a, b = max(seg["start"], t_in), min(seg["end"], t_out)
            if b - a < 0.3:
                continue
            words = [w for w in seg.get("words", []) if w["e"] > t_in and w["s"] < t_out]
            text = "".join(w["w"] for w in words).strip() if words and (seg["start"] < t_in or seg["end"] > t_out) else seg["text"]
            oa, ob = s["start"] + (a - t_in) / sp, s["start"] + (b - t_in) / sp
            lines.append((max(s["start"], oa), min(s["end"], ob), text))
    lines.sort()
    return lines


def pick_frames(video, dur, n=6):
    import numpy as np
    fr = list(vlog.gray_frames(video, fps=1, w=160))
    if not fr:
        return []
    F = np.stack(fr).astype(np.float32)
    bright = F.mean(axis=(1, 2)) / 255
    lap = np.abs(F[:, 1:-1, 1:-1] * 4 - F[:, :-2, 1:-1] - F[:, 2:, 1:-1] - F[:, 1:-1, :-2] - F[:, 1:-1, 2:]).mean(axis=(1, 2))
    contrast = F.std(axis=(1, 2)) / 64
    score = np.clip(lap / (np.percentile(lap, 80) + 1e-6), 0, 1.2) * np.clip(1 - np.abs(bright - 0.5) * 1.6, 0, 1) * np.clip(contrast, 0, 1.2)
    score[: int(min(len(score) * 0.03, 5))] *= 0.5
    score[-int(max(1, min(len(score) * 0.08, 20))):] *= 0.2  # end screen
    picks, gap = [], max(8, dur / (n * 2))
    for i in np.argsort(-score):
        if all(abs(i - j) >= gap for j in picks):
            picks.append(int(i))
        if len(picks) >= n:
            break
    return sorted(picks)


def src_at(tl, t, proj):
    """Final-video time -> (original file, seconds) for footage segments (cards/photos return None)."""
    inv_p = proj / "inventory.json"
    inv = {r["id"]: r for r in vlog.load_json(inv_p)} if inv_p.exists() else {}
    for s in tl["segments"]:
        if s["start"] + 0.3 <= t <= s["end"] - 0.3 and s.get("in") is not None:
            st = float(s["in"]) + (t - s["start"]) * float(s.get("speed", 1) or 1)
            r = inv.get(s["src"])
            if not r:
                p = Path(s["src"])
                return (str(p), st) if p.exists() else None
            for c in r["chapters"]:  # walk chapters to find the file holding that moment
                d = vlog.probe(c)["duration"]
                if st < d:
                    return c, st
                st -= d
    return None


def thumbnail(frame_path, out, brand, text, text2):
    from PIL import Image, ImageDraw, ImageEnhance
    W, H = 1280, 720
    im = Image.open(frame_path).convert("RGB")
    s = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)))
    im = im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
    im = ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.25)).enhance(1.12).convert("RGBA")
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for x in range(W // 2 + 120):
        gd.line([x, 0, x, H], fill=(0, 0, 0, int(170 * (1 - x / (W / 2 + 120)) ** 1.4)))
    im.alpha_composite(grad)
    d = ImageDraw.Draw(im)
    c = brand["colors"]
    P, D, L = cards.rgb(c["primary"]), cards.rgb(c["dark"]), cards.rgb(c["light"])
    words = text.upper().split()
    f = cards.F(brand, 118)
    lines = cards.wrap(d, " ".join(words), f, W * 0.56)
    if len(lines) > 3:
        f = cards.F(brand, 92)
        lines = cards.wrap(d, " ".join(words), f, W * 0.56)
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * 0.98)
    y = int(H / 2 - lh * len(lines) / 2 - (30 if text2 else 0))
    for i, ln in enumerate(lines):
        d.text((54, y + i * lh), ln, font=f, fill=P if i == len(lines) - 1 else L, stroke_width=9, stroke_fill=D)
    if text2:
        f2 = cards.F(brand, 46)
        tw = d.textlength(text2.upper(), font=f2)
        yb = y + len(lines) * lh + 18
        d.rounded_rectangle([54, yb, 54 + tw + 36, yb + 66], 12, fill=P)
        d.text((72, yb + 8), text2.upper(), font=f2, fill=D)
    im.convert("RGB").save(out, quality=92)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--thumb-text", default="")
    ap.add_argument("--thumb-text2", default="")
    ap.add_argument("--frames", type=int, default=6)
    a = ap.parse_args()
    v = Path(a.video)
    tl = vlog.load_json(v.with_suffix(".timeline.json"))
    dur = tl["duration"]
    out = v.with_name(v.stem + "_publish")
    (out / "frames").mkdir(parents=True, exist_ok=True)
    edit_p = next((p for p in [v.parent / "edit.json", v.parent.parent / "edit.json"] if p.exists()), None)
    edit = vlog.load_json(edit_p) if edit_p else {}
    proj = (edit_p.parent / edit.get("project", ".")).resolve() if edit_p else v.parent.parent
    brand = cards.load_brand((edit_p.parent / edit["brand"]) if edit_p and edit.get("brand") else "")
    ch = chapters(tl, dur)
    (out / "chapters.txt").write_text("\n".join(f"{yt_time(t)} {n}" for t, n in ch) + "\n", encoding="utf-8")
    subs = subtitles(tl, proj)
    with open(out / "subtitles.srt", "w", encoding="utf-8") as f:
        for i, (s, e, t) in enumerate(subs, 1):
            f.write(f"{i}\n{srt_time(s)} --> {srt_time(e)}\n{t}\n\n")
    picks = [t for t in pick_frames(v, dur, a.frames * 2) if src_at(tl, t, proj)][: a.frames]
    frames = []
    for k, t in enumerate(picks, 1):
        p = out / "frames" / f"cand_{k}_{int(t)}s.jpg"
        path, st = src_at(tl, t, proj)
        vlog.ff("-ss", st, "-i", path, "-frames:v", "1", "-q:v", "2", p)  # clean full-res frame from the original footage
        frames.append(p)
    if frames:
        from PIL import Image
        ims = [Image.open(p).convert("RGB").resize((320, 180)) for p in frames]
        sheets.grid(ims, [f"cand {k}  {vlog.hms(t)}" for k, t in enumerate(picks, 1)], cols=3, title="thumbnail candidates").save(out / "frames" / "overview.jpg")
    if a.thumb_text:
        for k, p in enumerate(frames, 1):
            thumbnail(p, out / f"thumb_{k}.jpg", brand, a.thumb_text, a.thumb_text2)
    credits = [m.get("credit") or f"Music: {Path(m['file']).stem} (add the licence/attribution line here)" for m in edit.get("music", [])]
    desc = [f"# {tl.get('title') or 'TITLE'}", "", "<!-- First 2 lines show above 'more': say what the viewer gets (route, cost, time, the surprise). -->",
            "HOOK LINE: ...", "WHAT YOU'LL LEARN / SEE: ...", "", "Chapters:", *[f"{yt_time(t)} {n}" for t, n in ch], "",
            "Useful info (prices/times as of the trip date - verify before you go):", "- ...", "",
            "Filmed on GoPro.", *credits, "", f"Subscribe for more: {brand.get('handle', '')}", "", "#travel #vlog #..."]
    (out / "description.md").write_text("\n".join(desc) + "\n", encoding="utf-8")
    print(f"publish kit: {out}  ({len(ch)} chapters, {len(subs)} subtitle lines, {len(frames)} thumbnail frames)")


if __name__ == "__main__":
    main()
