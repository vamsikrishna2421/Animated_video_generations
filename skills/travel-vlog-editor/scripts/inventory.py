"""Scan a trip's footage folder: group GoPro chapters into recordings, probe them, build light proxies, and score every
half-second (brightness, sharpness, motion, shake, loudness, speech-likelihood, scene cuts).

  python scripts/inventory.py <footage_dir> <project_dir> [--no-proxy] [--proxy-height 360] [--only GX0123]

Writes, inside <project_dir>:
  inventory.json          one entry per recording (id, chapters, duration, fps, resolution, time shot, flags)
  inventory.md            the same as a readable table, sorted by time shot
  proxies/<id>.mp4        low-res copy for fast analysis and contact sheets (GoPro .LRV files are reused when present)
  analysis/<id>.json      per-0.5 s curves + candidate highlight windows
Source files are never modified, moved or deleted.
"""
import argparse
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import vlog  # noqa: E402

GOPRO_NEW = re.compile(r"^G([A-Z])(\d{2})(\d{4})$", re.I)    # GX010123 / GH010123 / GS010123 (HERO6+ / MAX)
GOPRO_OLD = re.compile(r"^(GOPR|GP(\d{2}))(\d{4})$", re.I)   # GOPR0123 (first) / GP010123 (next chapters)


def recording_key(p):
    s = p.stem
    m = GOPRO_NEW.match(s)
    if m and s[:2].upper() != "GL":
        return f"{s[:2].upper()}{m.group(3)}", int(m.group(2)), "gopro"
    m = GOPRO_OLD.match(s)
    if m:
        ch = 0 if m.group(1).upper() == "GOPR" else int(m.group(2))
        return f"GOPR{m.group(3)}", ch, "gopro"
    return re.sub(r"[^A-Za-z0-9_-]+", "_", s), 0, "other"


def lrv_for(p):
    s = p.stem
    cands = [p.with_suffix(".LRV"), p.with_suffix(".lrv")]
    if GOPRO_NEW.match(s):
        cands += [p.with_name("GL" + s[2:] + ".LRV"), p.with_name("GL" + s[2:] + ".lrv")]
    return next((c for c in cands if c.exists()), None)


def concat_list(paths, out):
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(f"file '{Path(x).resolve().as_posix()}'\n" for x in paths), encoding="utf-8")
    return out


def make_proxy(rec, proj, height):
    out = proj / "proxies" / f"{rec['id']}.mp4"
    if out.exists() and out.stat().st_mtime > max(Path(c).stat().st_mtime for c in rec["chapters"]):
        return out
    lrvs = [lrv_for(Path(c)) for c in rec["chapters"]]
    if all(lrvs):
        src = concat_list(lrvs, proj / "proxies" / f"{rec['id']}.lrv.txt")
        try:
            vlog.ff("-f", "concat", "-safe", "0", "-i", src, "-c", "copy", "-movflags", "+faststart", out)
            return out
        except RuntimeError:
            pass
    src = concat_list(rec["chapters"], proj / "proxies" / f"{rec['id']}.txt")
    fps = min(30, rec["fps"] or 30)
    vlog.ff("-f", "concat", "-safe", "0", "-i", src, "-vf", f"scale=-2:{height},fps={fps}", "-c:v", "libx264", "-preset", "ultrafast",
            "-crf", "30", "-c:a", "aac", "-b:a", "64k", "-ac", "1", "-movflags", "+faststart", out)
    return out


def analyse(path, dur, step=0.5):
    import numpy as np
    fr = list(vlog.gray_frames(path, fps=1 / step, w=128))
    n = len(fr)
    if n == 0:
        return {}
    F = np.stack(fr).astype(np.float32)
    bright = F.mean(axis=(1, 2)) / 255
    lap = np.abs(F[:, 1:-1, 1:-1] * 4 - F[:, :-2, 1:-1] - F[:, 2:, 1:-1] - F[:, 1:-1, :-2] - F[:, 1:-1, 2:])
    sharp = lap.mean(axis=(1, 2))
    diff = np.r_[0, np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))]
    # global shift between frames (phase correlation on a coarse grid) -> camera motion; its jitter -> shake
    shift = np.zeros(n)
    for i in range(1, n):
        a, b = F[i - 1] - F[i - 1].mean(), F[i] - F[i].mean()
        X = np.fft.fft2(a) * np.conj(np.fft.fft2(b))
        r = np.fft.ifft2(X / (np.abs(X) + 1e-6)).real
        y, x = np.unravel_index(np.argmax(r), r.shape)
        y = y - r.shape[0] if y > r.shape[0] // 2 else y
        x = x - r.shape[1] if x > r.shape[1] // 2 else x
        shift[i] = np.hypot(x, y)
    k = 5
    smooth = np.convolve(shift, np.ones(k) / k, mode="same")
    shake = np.abs(shift - smooth)
    med = np.median(diff[1:]) if n > 2 else 0
    cuts = [round(i * step, 2) for i in range(1, n) if diff[i] > max(25, 4 * med) and diff[i] > 2 * diff[i - 1]]
    # audio: RMS dB per step and a crude speech score (energy in 300-3400 Hz with 2-8 Hz syllable modulation)
    au = vlog.audio_mono(path, 16000)
    m = int(16000 * step)
    na = min(n, len(au) // m) if len(au) else 0
    rms = np.full(n, -90.0)
    speech = np.zeros(n)
    if na:
        A = au[: na * m].reshape(na, m)
        rms[:na] = 20 * np.log10(np.sqrt((A ** 2).mean(axis=1)) + 1e-9)
        S = np.abs(np.fft.rfft(A * np.hanning(m), axis=1))
        f = np.fft.rfftfreq(m, 1 / 16000)
        band = S[:, (f > 300) & (f < 3400)].sum(axis=1) / (S.sum(axis=1) + 1e-9)
        sub = 160
        env = np.abs(A).reshape(na, -1, sub).mean(axis=2)  # 100 Hz envelope
        E = np.abs(np.fft.rfft(env - env.mean(axis=1, keepdims=True), axis=1))
        fe = np.fft.rfftfreq(env.shape[1], sub / 16000)
        mod = E[:, (fe >= 2) & (fe <= 8)].sum(axis=1) / (E.sum(axis=1) + 1e-9)
        depth = env.std(axis=1) / (env.mean(axis=1) + 1e-9)  # speech comes in syllables: the envelope pulses
        speech[:na] = np.clip((band - 0.45) * 2.5, 0, 1) * np.clip(mod * 2, 0, 1) * np.clip((depth - 0.25) * 3, 0, 1) * (rms[:na] > -45)
    # highlight score per step: usable (not dark/blurry/shaky) and interesting (motion, loud moments, scene change)
    usable = np.clip((bright - 0.08) * 6, 0, 1) * np.clip(sharp / (np.percentile(sharp, 75) + 1e-6), 0, 1) * np.clip(1 - shake / 6, 0, 1)
    interest = 0.5 * np.clip(diff / (np.percentile(diff, 90) + 1e-6), 0, 1) + 0.3 * np.clip((rms + 40) / 25, 0, 1) + 0.2 * speech
    score = usable * (0.4 + interest)
    win = int(4 / step)
    cand = []
    if n > win:
        ws = np.convolve(score, np.ones(win) / win, mode="valid")
        used = np.zeros(len(ws), bool)
        for i in np.argsort(-ws):
            if used[max(0, i - win): i + win].any() or ws[i] < 0.25:
                continue
            used[i] = True
            cand.append({"start": round(i * step, 2), "end": round((i + win) * step, 2), "score": round(float(ws[i]), 3)})
            if len(cand) >= max(3, int(dur / 30)):
                break
        cand.sort(key=lambda c: c["start"])
    r3 = lambda a: [round(float(x), 3) for x in a]  # noqa: E731
    return {"step": step, "brightness": r3(bright), "sharpness": r3(sharp), "motion": r3(diff), "shake": r3(shake),
            "loudness_db": r3(rms), "speech": r3(speech), "score": r3(score), "scene_cuts": cuts, "highlights": cand,
            "summary": {"dark": float((bright < 0.12).mean()), "shaky": float((shake > 4).mean()), "speech": float((speech > 0.3).mean()),
                        "loud": float((rms > -20).mean()), "mean_score": float(score.mean())}}


def flags(rec, a):
    f = []
    if rec["duration"] < 2:
        f.append("very short")
    if rec["fps"] >= 100:
        f.append(f"high-fps {rec['fps']:.0f} -> slow motion available")
    if rec["fps"] and rec["fps"] < 20:
        f.append("timelapse/low fps")
    if rec["bit_depth"] == 10:
        f.append("10-bit")
    s = a.get("summary", {})
    if s.get("dark", 0) > 0.4:
        f.append("mostly dark")
    if s.get("shaky", 0) > 0.3:
        f.append("shaky")
    if s.get("speech", 0) > 0.2:
        f.append("talking")
    if not rec["has_audio"]:
        f.append("no audio")
    return f


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("footage")
    ap.add_argument("project")
    ap.add_argument("--no-proxy", action="store_true", help="analyse the originals directly (slow for 4K)")
    ap.add_argument("--proxy-height", type=int, default=360)
    ap.add_argument("--only", default="", help="comma list of recording ids to (re)process")
    a = ap.parse_args()
    root, proj = Path(a.footage), Path(a.project)
    proj.mkdir(parents=True, exist_ok=True)
    groups = defaultdict(list)
    kinds = {}
    for p in sorted(root.rglob("*")):
        if p.suffix.lower() in vlog.VIDEO_EXT and not p.name.startswith("._"):
            key, ch, kind = recording_key(p)
            if kind == "other":
                key = f"{p.parent.name}_{key}" if p.parent != root else key
            groups[key].append((ch, p))
            kinds[key] = kind
    only = {x.strip() for x in a.only.split(",") if x.strip()}
    inv_path = proj / "inventory.json"
    old = {r["id"]: r for r in vlog.load_json(inv_path)} if inv_path.exists() else {}
    recs = []
    for i, (key, chs) in enumerate(sorted(groups.items())):
        chs.sort()
        paths = [str(p) for _, p in chs]
        if key in old and not (only and key in only) and old[key]["chapters"] == paths:
            recs.append(old[key])
            continue
        if only and key not in only:
            continue
        pr = [vlog.probe(p) for p in paths]
        rec = {"id": key, "kind": kinds[key], "chapters": paths, "duration": round(sum(x["duration"] for x in pr), 3),
               "width": pr[0]["width"], "height": pr[0]["height"], "fps": pr[0]["fps"], "vcodec": pr[0]["vcodec"],
               "bit_depth": pr[0]["bit_depth"], "rotation": pr[0]["rotation"], "has_audio": pr[0]["has_audio"],
               "shot_at": pr[0]["creation_time"] or datetime.fromtimestamp(Path(paths[0]).stat().st_mtime).isoformat(timespec="seconds")}
        print(f"[{i + 1}/{len(groups)}] {key}: {len(paths)} chapter(s), {rec['duration']:.0f}s, {rec['width']}x{rec['height']}@{rec['fps']}", flush=True)
        src = Path(paths[0]) if a.no_proxy and len(paths) == 1 else make_proxy(rec, proj, a.proxy_height)
        rec["proxy"] = str(src)
        an = analyse(src, rec["duration"])
        vlog.save_json(proj / "analysis" / f"{key}.json", an)
        rec["flags"] = flags(rec, an)
        rec["highlights"] = an.get("highlights", [])
        recs.append(rec)
    recs.sort(key=lambda r: r["shot_at"])
    vlog.save_json(inv_path, recs)
    tot = sum(r["duration"] for r in recs)
    lines = [f"# Footage inventory\n\n{len(recs)} recordings, {tot / 60:.1f} min total.\n",
             "| # | id | shot at | length | format | flags | highlight windows (s) |", "|---|---|---|---|---|---|---|"]
    for n, r in enumerate(recs, 1):
        hl = ", ".join(f"{h['start']:.0f}-{h['end']:.0f}" for h in r.get("highlights", [])[:6])
        lines.append(f"| {n} | {r['id']} | {r['shot_at'][:16].replace('T', ' ')} | {vlog.hms(r['duration'])} | {r['width']}x{r['height']}@{r['fps']:g} "
                     f"{r['vcodec']} | {', '.join(r.get('flags', []))} | {hl} |")
    (proj / "inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nwrote {inv_path} and inventory.md ({len(recs)} recordings, {tot / 60:.1f} min)")


if __name__ == "__main__":
    main()
