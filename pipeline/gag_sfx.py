"""Cartoon SFX + a bouncy comedy tune for the silent gag reel, synthesised from scratch (no samples).

  python3 pipeline/gag_sfx.py   ->  video/public/audio/gag_{whistle,bonk,boing,pop,ding,squish,music}.wav
"""
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "video" / "public" / "audio"
rng = np.random.default_rng(3)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(a * SR), min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def glide(f0, f1, sec, shape=np.sin):
    freq = np.geomspace(f0, f1, int(sec * SR))
    return shape(2 * np.pi * np.cumsum(freq) / SR)


def norm(x, peak=0.8):
    return x / (np.abs(x).max() + 1e-9) * peak


def whistle():
    notes = [(1568, 0.18), (1760, 0.18), (1976, 0.12), (1760, 0.12), (1568, 0.3), (1319, 0.3), (1568, 0.4)]
    out = []
    for fq, d in notes:
        x = t(d)
        vib = 1 + 0.012 * np.sin(2 * np.pi * 6 * x)
        s = np.sin(2 * np.pi * np.cumsum(fq * vib) / SR) + 0.03 * rng.standard_normal(len(x))
        out.append(s * env(len(x), 0.02, 0.05))
    return norm(np.concatenate(out), 0.5)


def bonk():
    x = t(0.45)
    body = glide(420, 90, 0.45) * np.exp(-x * 9)
    click = rng.standard_normal(len(x)) * np.exp(-x * 60)
    return norm(body + 0.4 * click)


def boing():
    x = t(0.6)
    fq = 180 + 260 * np.exp(-x * 5) * (1 + 0.5 * np.sin(2 * np.pi * 14 * x))
    return norm(np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.exp(-x * 4))


def pop():
    x = t(0.12)
    return norm(glide(900, 300, 0.12) * np.exp(-x * 40), 0.6)


def ding():
    x = t(1.2)
    s = sum(a * np.sin(2 * np.pi * f * x) for f, a in ((1320, 1), (2640, 0.4), (3960, 0.15)))
    return norm(s * np.exp(-x * 3.5), 0.6)


def squish():
    x = t(0.5)
    noise = rng.standard_normal(len(x))
    wob = np.sin(2 * np.pi * np.cumsum(120 + 80 * np.sin(2 * np.pi * 9 * x)) / SR)
    return norm((0.5 * noise * np.exp(-x * 8) + wob * np.exp(-x * 5)) * env(len(x), 0.01, 0.2))


def music(sec=30.0):
    """Oom-pah comedy bounce in C major, 132 bpm: tuba-ish bass on the beat, plucked chords off the beat, a
    clarinet-like tune on top."""
    bpm, n = 132, int(sec * SR)
    beat = 60 / bpm
    out = np.zeros(n)
    prog = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (43, [59, 62, 65])]
    tune = [72, 74, 76, 72, 76, 77, 79, None, 79, 77, 76, 74, 72, 74, 71, None]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)

    def put(sig, at):
        i = int(at * SR)
        if i < n:
            out[i:i + len(sig)] += sig[: n - i]

    b = 0
    while b * beat < sec:
        root, chord = prog[(b // 4) % 4]
        x = t(beat * 0.9)
        if b % 2 == 0:  # tuba: square-ish, low
            s = np.sign(np.sin(2 * np.pi * hz(root - 12) * x)) * 0.5 + np.sin(2 * np.pi * hz(root - 12) * x)
            put(0.25 * s * env(len(x), 0.01, 0.15) * np.exp(-x * 3), b * beat)
        else:  # pluck chord
            s = sum(np.sin(2 * np.pi * hz(m) * x) for m in chord)
            put(0.12 * s * np.exp(-x * 9), b * beat)
        m = tune[b % len(tune)]
        if m:
            x = t(beat * 0.8)
            s = sum(a * np.sin(2 * np.pi * hz(m) * k * x) for k, a in ((1, 1), (3, 0.35), (5, 0.15)))
            put(0.13 * s * env(len(x), 0.03, 0.1), b * beat)
        b += 1
    return norm(out, 0.7) * env(n, 0.3, 1.5)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (("whistle", whistle), ("bonk", bonk), ("boing", boing), ("pop", pop), ("ding", ding), ("squish", squish), ("music", music)):
        sf.write(OUT / f"gag_{name}.wav", fn().astype(np.float32), SR)
        print("wrote", name)
