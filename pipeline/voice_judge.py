"""Objective audio QA for a reel: flags robotic delivery with numbers, per line.

Metrics (per line):
  range  pitch spread in semitones (10th-90th percentile). Lively human speech ~7-12; < 5 sounds flat.
  wps    words per second. Natural energetic reel speech ~2.6-3.6.
  gap    longest pause inside the line (s). > 0.45 mid-sentence sounds broken.
  loud   RMS level (dB) vs the reel median; jumps > 3 dB between speakers feel uneven.
  start  time from the start of the reel to the first spoken word.
Usage: python3 pipeline/voice_judge.py video/src/reel/timelines/ep23v2.json
"""
import json
import sys
from pathlib import Path

import numpy as np
import parselmouth
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent


def analyse(path: Path, words):
    a, sr = sf.read(path)
    if a.ndim > 1:
        a = a.mean(axis=1)
    snd = parselmouth.Sound(a, sampling_frequency=sr)
    f0 = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=500).selected_array["frequency"]
    f0 = f0[f0 > 0]
    st = 12 * np.log2(f0 / np.median(f0)) if f0.size > 10 else np.zeros(1)
    rng = float(np.percentile(st, 90) - np.percentile(st, 10))
    dur = len(a) / sr
    fr = int(0.02 * sr)
    env = np.array([np.sqrt(np.mean(a[i:i + fr] ** 2)) for i in range(0, len(a) - fr, fr)])
    voiced = env > 0.1 * env.max()
    idx = np.where(voiced)[0]
    gaps, run = [], 0
    for v in voiced[idx[0]: idx[-1] + 1] if idx.size else []:
        run = 0 if v else run + 1
        gaps.append(run)
    gap = max(gaps) * 0.02 if gaps else 0
    db = 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
    return rng, len(words) / max(dur, 0.1), gap, db, dur


def main(tl_path: Path) -> None:
    tl = json.loads(tl_path.read_text())
    rows = []
    for sc in tl["scenes"]:
        for l in sc["lines"]:
            rng, wps, gap, db, dur = analyse(ROOT / "video" / "public" / l["audio"], l["words"])
            rows.append((sc["id"], l["who"], " ".join(w["w"] for w in l["words"])[:48], rng, wps, gap, db))
    med = np.median([r[6] for r in rows])
    first = min(sc["from"] + l["words"][0]["from"] for sc in tl["scenes"] for l in sc["lines"] if l["words"]) / tl["fps"]
    print(f"first word at {first:.2f}s   (target < 0.3s)\n")
    print(f"{'scene':8} {'who':11} {'range':>5} {'wps':>5} {'gap':>5} {'loud':>5}  flags / text")
    counts = {}
    for sid, who, text, rng, wps, gap, db in rows:
        flags = []
        if rng < 5 and who not in ("filmy",):
            flags.append("FLAT")
        if wps < 2.3:
            flags.append("SLOW")
        if wps > 3.9:
            flags.append("RUSHED")
        if gap > 0.45 and "<pause" not in text:
            flags.append("GAP")
        if abs(db - med) > 3:
            flags.append("LEVEL")
        for fl in flags:
            counts[fl] = counts.get(fl, 0) + 1
        print(f"{sid:8} {who:11} {rng:5.1f} {wps:5.2f} {gap:5.2f} {db - med:+5.1f}  {' '.join(flags) or 'ok':12} {text}")
    by_who = {}
    for r in rows:
        by_who.setdefault(r[1], []).append(r[3])
    print("\npitch range by speaker:", {k: round(float(np.mean(v)), 1) for k, v in by_who.items()})
    print("flag totals:", counts or "none")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
