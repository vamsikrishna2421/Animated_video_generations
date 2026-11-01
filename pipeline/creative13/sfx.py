# Creative 13 sound effects, made here (no recorded or copyrighted audio): a documentary's forest bed (bird calls as
# sweeping tones, crickets as fast-pulsed high tones, a soft wind) and a "wah-wah" for the young male's defeat (three
# falling brassy notes and a long wobbling fourth). Writes video/public/reel/creative13v1/jungle.wav and wahwah.wav (both
# reels use them).
#   python3 pipeline/creative13/sfx.py
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative13v1"
SR = 44100
rng = np.random.default_rng(13)


def band(x, lo, hi):
    return sosfilt(butter(4, [lo, hi], btype="band", fs=SR, output="sos"), x)


def jungle(sec=8.0):
    n = int(sec * SR)
    t = np.arange(n) / SR
    wind = band(rng.standard_normal(n), 150, 700) * (0.5 + 0.3 * np.sin(2 * np.pi * 0.15 * t)) * 0.25
    crickets = np.sin(2 * np.pi * 4700 * t) * (np.sin(2 * np.pi * 32 * t) > 0.3) * (np.sin(2 * np.pi * 0.9 * t) > -0.2) * 0.05
    birds = np.zeros(n)
    for _ in range(14):   # short chirps: a fast upward or downward sweep, in twos and threes
        t0 = rng.uniform(0.1, sec - 0.6)
        f0, f1 = rng.uniform(2200, 3400), rng.uniform(3000, 5200)
        for k in range(int(rng.integers(2, 4))):
            a = int((t0 + k * 0.13) * SR)
            m = int(0.08 * SR)
            if a + m >= n:
                break
            f = np.linspace(f0, f1, m) if k % 2 == 0 else np.linspace(f1, f0, m)
            birds[a:a + m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(m) * rng.uniform(0.15, 0.3)
    x = wind + crickets + birds
    fade = np.clip(t / 0.3, 0, 1) * np.clip((sec - t) / 0.5, 0, 1)
    return x * fade / np.max(np.abs(x)) * 0.8


def wahwah():
    out = []
    for f, d in ((392, 0.32), (370, 0.32), (349, 0.32), (330, 1.0)):
        m = int(d * SR)
        t = np.arange(m) / SR
        vib = 1 + (0.03 * np.sin(2 * np.pi * 6 * t) if d > 0.5 else 0)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        x = sum(np.sin(k * ph) / k for k in range(1, 8))   # a brassy saw
        env = np.clip(t / 0.03, 0, 1) * np.clip((d - t) / 0.08, 0, 1) * (1 - 0.6 * (t / d) if d > 0.5 else 1)
        wah = 0.5 + 0.5 * np.sin(2 * np.pi * (1.2 if d > 0.5 else 3.0) * t - np.pi / 2)   # the mute opening and closing
        out.append(sosfilt(butter(2, 2500, fs=SR, output="sos"), x * env) * (0.6 + 0.4 * wah))
    x = np.concatenate(out)
    return x / np.max(np.abs(x)) * 0.7


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, x in (("jungle", jungle()), ("wahwah", wahwah())):
        sf.write(OUT / f"{name}.wav", np.stack([x, x], 1).astype(np.float32), SR)
        print("wrote", OUT / f"{name}.wav")
