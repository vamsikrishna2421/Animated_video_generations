# Phone sounds for skit 02, synthesised here (original, no samples): a ringtone, a vibration buzz, a digital glitch
# for the cloned voice failing, and the hang-up beep.
#   python3 pipeline/skit02/sfx.py  -> video/public/reel/sfx_{ring,ring1,buzz,glitch,hangup}.wav
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parents[2] / "video/public/reel"


def env(n, a=0.005, r=0.08):
    e = np.ones(n)
    ka, kr = int(a * SR), int(r * SR)
    e[:ka] = np.linspace(0, 1, ka)
    e[-kr:] *= np.linspace(1, 0, kr)
    return e


def tone(f, dur, decay=6.0):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return x * np.exp(-decay * t) * env(len(t))


def ring():   # a bright two-bar marimba-style ringtone, about 1.3 s
    notes = [(1318.5, 0.0), (1568.0, 0.11), (1975.5, 0.22), (1568.0, 0.33), (1318.5, 0.66), (1568.0, 0.77), (1975.5, 0.88), (2349.3, 0.99)]
    x = np.zeros(int(1.35 * SR))
    for f, t0 in notes:
        n = tone(f, 0.3, decay=11)
        i = int(t0 * SR)
        x[i:i + len(n)] += n
    return x / np.abs(x).max() * 0.8


def ring1():   # the ringtone's first bar only (0.4 s): the caller's "Amma!" has to land by 0.5 s (viewer note)
    return ring()[: int(0.42 * SR)] * np.linspace(1, 0.2, int(0.42 * SR))


def buzz():   # two vibration pulses
    t = np.arange(int(0.75 * SR)) / SR
    carrier = np.sin(2 * np.pi * 165 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 330 * t))
    gate = ((t % 0.38) < 0.26).astype(float)
    gate = np.convolve(gate, np.ones(220) / 220, mode="same")
    return carrier * gate * 0.8


def glitch():   # bit-crushed stutter + static, 0.7 s
    rng = np.random.default_rng(7)
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 220 * t * (1 + 0.5 * np.sin(2 * np.pi * 9 * t)))) * 0.35
    x += rng.normal(0, 0.25, n)
    chop = (np.floor(t * 28) % 3 != 0).astype(float)
    x = np.round(x * 6) / 6 * chop
    return x * env(n, 0.002, 0.1) * 0.8


def hangup():   # a short descending beep
    t = np.arange(int(0.28 * SR)) / SR
    f = np.linspace(880, 440, len(t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.06)
    return x * 0.7


if __name__ == "__main__":
    for name, fn in [("ring", ring), ("ring1", ring1), ("buzz", buzz), ("glitch", glitch), ("hangup", hangup)]:
        sf.write(OUT / f"sfx_{name}.wav", fn().astype(np.float32), SR)
        print("wrote", OUT / f"sfx_{name}.wav")
