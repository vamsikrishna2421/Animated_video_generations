"""Sound for the watch assembly: a precise metallic click (parts seating) and a dark cinematic bed with a
faint escapement tick, synthesised from scratch.

  python3 pipeline/watch_sfx.py  ->  video/public/audio/watch_{click,score}.wav
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "video" / "public" / "audio"
rng = np.random.default_rng(11)


def click():
    t = np.arange(int(0.25 * SR)) / SR
    ping = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in ((3150, 1, 60), (5230, 0.6, 90), (7800, 0.3, 120)))
    tap = sosfilt(butter(2, 1800, "hp", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t * 300)
    x = ping * 0.6 + tap
    return (x / np.abs(x).max() * 0.8).astype(np.float32)


def score(sec=26.0):
    n = int(sec * SR)
    t = np.arange(n) / SR
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bed = np.zeros(n)
    chords = [[38, 50, 57, 62], [34, 46, 53, 58], [41, 53, 60, 65], [36, 48, 55, 64]]  # Dm Bb F C
    seg = sec / len(chords)
    for i, ch in enumerate(chords):
        a, b = int(i * seg * SR), int((i + 1) * seg * SR)
        tt = t[: b - a]
        env = np.minimum(1, tt / 2.0) * np.minimum(1, (tt[::-1]) / 2.0)
        for m in ch:
            for det in (-0.08, 0.08):
                bed[a:b] += np.sin(2 * np.pi * hz(m + det) * tt) * env * (0.5 if m < 45 else 0.25)
    bed = sosfilt(butter(2, 1400, "lp", fs=SR, output="sos"), bed)
    tick = np.zeros(n)
    k = click() * 0.12
    for s in np.arange(0.5, sec, 1 / 3):  # 3 Hz escapement, very quiet
        i = int(s * SR)
        tick[i:i + len(k)] += k[: n - i]
    x = bed / np.abs(bed).max() * 0.55 + tick
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (sec - t) / 2.5)
    return (x * fade).astype(np.float32)


if __name__ == "__main__":
    sf.write(OUT / "watch_click.wav", click(), SR)
    sf.write(OUT / "watch_score.wav", score(), SR)
    print("ok")
