# Creative 26: the temple bells (synthesised here, no samples): inharmonic partials with long decays and a slow beat
# between close pairs, a soft strike. bell_soft (each new chaupai) and bell_deep (frame 1 and the loop).
#   python3 pipeline/creative26/bells.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative26"
SR = 44100


def bell(f0, dur, gain=0.5, bright=1.0):
    t = np.arange(int(dur * SR)) / SR
    parts = [(0.5, 1.0, 3.2), (1.0, 0.8, 2.6), (1.19, 0.45, 2.0), (1.56, 0.35, 1.6), (2.0, 0.3 * bright, 1.2),
             (2.51, 0.2 * bright, 0.9), (3.0, 0.12 * bright, 0.7), (4.1, 0.08 * bright, 0.4)]
    x = np.zeros_like(t)
    for ratio, amp, dec in parts:
        f = f0 * ratio
        x += amp * np.exp(-t / dec) * (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * (f + 1.3) * t))   # the slow beat
    strike = np.random.default_rng(7).normal(0, 1, len(t)) * np.exp(-t / 0.004) * 0.25
    x = (x + strike) * np.minimum(1, t / 0.002)
    x = x / np.max(np.abs(x)) * gain
    fade = int(0.3 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)
    return np.stack([x, x], 1).astype(np.float32)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    sf.write(OUT / "bell_soft.wav", bell(660, 4.0, 0.45, 0.7), SR)
    sf.write(OUT / "bell_deep.wav", bell(330, 5.6, 0.6, 0.9), SR)
    sf.write(OUT / "silence.wav", np.zeros((SR, 2), np.float32), SR)
    print("bells written", OUT)
