# Creative 43 sound effects, made here (no recorded or copyrighted audio): studio applause (hundreds of short band-passed
# noise claps in a swell), a "ta-da" (a bright three-note synth chord with a quick swell) and a score-card flip (a short
# filtered click). Writes video/public/reel/creative43v1/{applause,tada,flip}.wav.
#   python3 pipeline/creative43/sfx.py
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative43v1"
SR = 48000
rng = np.random.default_rng(43)


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def applause(dur=2.4, claps=900):
    n = int(dur * SR)
    out = np.zeros(n)
    env_t = np.linspace(0, 1, n)
    swell = np.clip(env_t / 0.18, 0, 1) * np.clip((1 - env_t) / 0.45, 0, 1)   # quick rise, long fade
    for _ in range(claps):
        t = rng.uniform(0, dur - 0.03)
        if rng.uniform() > swell[int(t * SR)]:
            continue
        L = int(rng.uniform(0.006, 0.014) * SR)
        burst = rng.standard_normal(L) * np.exp(-np.linspace(0, 6, L))
        lo = rng.uniform(700, 1400)
        burst = bp(burst, lo, lo * rng.uniform(2.2, 3.5), 2)
        i = int(t * SR)
        out[i:i + L] += burst * rng.uniform(0.3, 1.0)
    out += bp(rng.standard_normal(n), 900, 4000) * 0.04 * swell   # the room
    return out / np.max(np.abs(out)) * 0.7


def tada(dur=1.3):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k, (f, at) in enumerate([(523.25, 0.0), (659.25, 0.07), (783.99, 0.14), (1046.5, 0.14)]):
        tt = np.clip(t - at, 0, None)
        env = np.clip(tt / 0.02, 0, 1) * np.exp(-tt * 2.2) * (t >= at)
        saw = sum(np.sin(2 * np.pi * f * h * tt) / h for h in range(1, 7))
        out += saw * env * (0.8 if k < 3 else 0.5)
    out = sosfilt(butter(2, 5000, btype="low", fs=SR, output="sos"), out)
    return out / np.max(np.abs(out)) * 0.6


def flip():
    L = int(0.09 * SR)
    x = rng.standard_normal(L) * np.exp(-np.linspace(0, 9, L))
    x = bp(x, 1500, 6000, 2) + 0.5 * np.sin(2 * np.pi * 180 * np.arange(L) / SR) * np.exp(-np.linspace(0, 12, L))
    return x / np.max(np.abs(x)) * 0.6


OUT.mkdir(parents=True, exist_ok=True)
for name, x in [("applause", applause()), ("tada", tada()), ("flip", flip())]:
    sf.write(OUT / f"{name}.wav", np.stack([x, x], 1).astype(np.float32), SR)
    print("wrote", OUT / f"{name}.wav", round(len(x) / SR, 2), "s")
