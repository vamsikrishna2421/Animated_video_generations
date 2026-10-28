# Creative 12 sound effects, made here (no recorded or copyrighted audio): a stadium crowd roar (band-passed noise in
# swelling layers with scattered claps and a whistle) and a review siren (two tones sweeping). Writes
# video/public/reel/creative12v1/crowd.wav and siren.wav (both reels use them).
#   python3 pipeline/creative12/sfx.py
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative12v1"
SR = 44100
rng = np.random.default_rng(12)


def band(x, lo, hi):
    return sosfilt(butter(4, [lo, hi], btype="band", fs=SR, output="sos"), x)


def crowd(sec=2.6):
    n = int(sec * SR)
    t = np.arange(n) / SR
    env = np.clip(t / 0.25, 0, 1) * np.exp(-np.clip(t - 1.2, 0, None) * 1.4)   # a fast swell, a long fall
    roar = sum(band(rng.standard_normal(n), lo, hi) * g for lo, hi, g in ((250, 900, 1.0), (700, 2200, 0.7), (1800, 4200, 0.35)))
    roar *= env * (1 + 0.25 * np.sin(2 * np.pi * 3.1 * t + rng.uniform(0, 6)))   # voices rising and falling
    claps = np.zeros(n)
    for _ in range(140):   # scattered claps
        i = int(rng.uniform(0.05, sec - 0.1) * SR)
        k = int(0.012 * SR)
        claps[i:i + k] += rng.standard_normal(k) * np.exp(-np.arange(k) / (0.003 * SR)) * rng.uniform(0.3, 1.0)
    claps = band(claps, 1000, 6000) * env
    whistle = np.zeros(n)
    a, b = int(0.5 * SR), int(1.1 * SR)
    f = 2600 + 400 * np.sin(np.linspace(0, np.pi, b - a))
    whistle[a:b] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(b - a) * 0.12
    x = roar / np.max(np.abs(roar)) * 0.7 + claps / max(1e-9, np.max(np.abs(claps))) * 0.35 + whistle
    return x / np.max(np.abs(x)) * 0.9


def siren(sec=1.3):
    n = int(sec * SR)
    t = np.arange(n) / SR
    f = np.where((t * 2.4) % 1 < 0.5, 760, 990).astype(float)   # two tones
    f = np.convolve(f, np.ones(400) / 400, mode="same")   # glide between them
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    x *= np.clip(t / 0.05, 0, 1) * np.clip((sec - t) / 0.2, 0, 1)
    return x / np.max(np.abs(x)) * 0.6


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, x in (("crowd", crowd()), ("siren", siren())):
        sf.write(OUT / f"{name}.wav", np.stack([x, x], 1).astype(np.float32), SR)
        print("wrote", OUT / f"{name}.wav")
