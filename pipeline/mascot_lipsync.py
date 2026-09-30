"""Lip-sync data for the mascot: per-frame mouth openness/width from the voice take, plus sentence start times.

  python3 pipeline/mascot_lipsync.py te en    ->  video/src/reel/mascot_{lang}.json
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
SUBS = {  # English on-screen lines, one per spoken sentence (Telugu audio keeps English subtitles)
    "te": ["Hi friends!", "Want to learn AI the easy way?", "Follow AI Maastaaru!", "Learn AI from scratch.",
           "Stay updated with the latest AI topics and news!",
           "My name is {name}.", "This is how I look!"],
    "en": ["Hey friends!", "Want to learn AI the easy way?", "Follow AI Maastaaru!",
           "Learn AI from scratch, and stay updated with the latest AI topics and news!",
           "And me, I'm {name}.", "This is how I look!"],
}


def build(lang, name="Bittu", wav_dir=None, out_dir=None):
    wav = Path(wav_dir or ROOT / "video" / "public" / "mascot") / f"cta_{lang}.wav"
    a, sr = sf.read(wav)
    a = a.mean(axis=1) if a.ndim > 1 else a
    hop = sr // FPS
    n = len(a) // hop
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    zcr = np.array([np.mean(np.abs(np.diff(np.sign(a[i * hop:(i + 1) * hop])))) / 2 for i in range(n)])
    ref = np.percentile(rms, 95) + 1e-9
    raw = np.clip((rms / ref - 0.08) / 0.8, 0, 1)
    op, cur = [], 0.0
    for v in raw:  # fast attack, slower release: mouths snap open and ease shut
        cur = v if v > cur else cur * 0.55 + v * 0.45
        op.append(round(float(cur), 3))
    wid = np.clip((zcr - zcr.min()) / (np.ptp(zcr) + 1e-9), 0, 1)  # hissy sounds -> wide mouth, vowels -> round
    # Sentence starts: speech after a pause of >= 0.25 s (say() puts ~0.35 s between sentences).
    voiced = rms > ref * 0.06
    starts, quiet = [], 99
    for i, v in enumerate(voiced):
        if v and quiet >= int(0.25 * FPS):
            starts.append(i)
        quiet = 0 if v else quiet + 1
    subs = [x.format(name=name) for x in SUBS[lang]]
    if len(starts) != len(subs):  # fall back to spreading lines by text length
        total = sum(len(s) for s in subs)
        first, last = starts[0] if starts else 0, n
        acc, starts = 0, []
        for s in subs:
            starts.append(int(first + (last - first) * acc / total))
            acc += len(s)
    data = {"frames": n, "open": op, "wide": [round(float(x), 2) for x in wid], "starts": starts, "subs": subs}
    out = Path(out_dir or ROOT / "video" / "src" / "reel") / f"mascot_{lang}.json"
    out.write_text(json.dumps(data))
    print(lang, "frames", n, "starts", starts)


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("langs", nargs="*", default=["te", "en"])
    ap.add_argument("--name", default="Bittu")
    ap.add_argument("--wav-dir")
    ap.add_argument("--out-dir")
    a = ap.parse_args()
    for lang in a.langs:
        build(lang, a.name, a.wav_dir, a.out_dir)
