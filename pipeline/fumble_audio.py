"""Audio kit for Mr. Fumble, the page's silent-comedy character. Everything is synthesised (no samples):

  hums     fumble_hum_q (rising "hm?"), fumble_hum_smug ("hm-hm!"), fumble_hmph, fumble_giggle, fumble_gasp
  foley    fumble_tip0..3 (tiptoe pizzicato plinks), fumble_clunk (stiff step), fumble_slide_up/down (slide whistle)
  music    fumble_sneak.wav  sneaky staccato bassoon + pizzicato bass loop, 104 BPM

  python3 pipeline/fumble_audio.py   ->  video/public/fumble/audio/
"""
from pathlib import Path

import numpy as np
import soundfile as sf

from brand_audio import SR, bp, hp, hz, lp, norm, place, t_

OUT = Path(__file__).resolve().parent.parent / "video" / "public" / "fumble" / "audio"
BPM = 104
BEAT = 60 / BPM
rng = np.random.default_rng(7)


def glottal(f0, sec):
    """Voice source: a pulse train following the pitch curve f0 (array or float), with a little vibrato."""
    t = t_(sec)
    f = np.broadcast_to(np.asarray(f0, dtype=float), t.shape) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))
    ph = np.cumsum(f) / SR % 1
    return (ph < 0.35) * np.sin(np.pi * ph / 0.35) - 0.2


def hum(f0, sec, open_=0.0):
    """A closed-mouth hum ("mmm"); open_ > 0 lets an "uh" vowel through."""
    src = glottal(f0, sec)
    x = lp(src, 700) * 1.0 + bp(src, 220, 320) * 1.5
    if open_:
        x += open_ * (bp(src, 550, 800) * 1.2 + bp(src, 1000, 1300) * 0.6)
    t = t_(sec)
    env = np.minimum(1, t / 0.03) * np.minimum(1, (sec - t) / 0.06)
    return x * env


def curve(points, sec):
    t = t_(sec)
    xs, ys = zip(*points)
    return np.interp(t / sec, xs, ys)


def hum_q():
    return norm(hum(curve([(0, 150), (0.55, 150), (1, 240)], 0.55), 0.55), 0.8)


def hum_smug():
    a = hum(curve([(0, 200), (1, 175)], 0.2), 0.2)
    b = hum(curve([(0, 150), (0.4, 215), (1, 205)], 0.32), 0.32, open_=0.3)
    out = np.zeros(int(0.62 * SR))
    place(out, a, 0)
    place(out, b, 0.27)
    return norm(out, 0.8)


def hmph():
    s = hum(curve([(0, 210), (1, 120)], 0.3), 0.3)
    s[: int(0.04 * SR)] += hp(rng.standard_normal(int(0.04 * SR)), 2000) * 0.3
    return norm(s, 0.8)


def giggle():
    out = np.zeros(int(0.8 * SR))
    for i in range(5):
        place(out, hum(230 + i * 18, 0.09, open_=0.5), i * 0.13)
    return norm(out, 0.75)


def gasp():
    t = t_(0.35)
    n = bp(rng.standard_normal(len(t)), 900, 3200) * np.sin(np.pi * t / 0.35) ** 0.6
    v = hum(curve([(0, 260), (1, 330)], 0.35), 0.35, open_=1.0) * 0.3
    return norm(n + v, 0.7)


def pizz(m, sec=0.4, bright=0.5):
    """Karplus-Strong plucked string."""
    p = int(SR / hz(m))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(int(sec * SR))
    for i in range(len(out)):
        out[i] = buf[i % p]
        buf[i % p] = (bright * buf[i % p] + (1 - bright) * buf[(i + 1) % p]) * 0.996
    return out * np.exp(-t_(sec) * 6)


def clunk():
    t = t_(0.18)
    x = np.sin(2 * np.pi * 180 * (1 + 0.6 * np.exp(-t * 40)) * t) * np.exp(-t * 28)
    x += bp(rng.standard_normal(len(t)), 300, 1200) * np.exp(-t * 60) * 0.5
    return norm(x, 0.8)


def slide(up=True, sec=0.45):
    f = curve([(0, 500), (1, 1500)] if up else [(0, 1500), (1, 420)], sec)
    t = t_(sec)
    ph = np.cumsum(f * (1 + 0.02 * np.sin(2 * np.pi * 7 * t))) / SR
    x = np.sin(2 * np.pi * ph) + 0.08 * bp(rng.standard_normal(len(t)), 800, 4000)
    return norm(x * np.minimum(1, t / 0.02) * np.minimum(1, (sec - t) / 0.05), 0.6)


def bassoon(m, sec):
    t = t_(sec)
    ph = (t * hz(m)) % 1
    src = 2 * ph - 1
    x = bp(src, 380, 620) * 1.4 + bp(src, 950, 1300) * 0.8 + lp(src, 300) * 0.5
    return x * np.minimum(1, t / 0.015) * np.exp(-t * 7) * 0.5


def brush(sec=0.12):
    t = t_(sec)
    return bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t * 30) * 0.12


# Sneaky tune (E minor), 8 bars of 8th notes; None = rest. Original melody.
MEL = [64, None, 67, None, 69, 70, 71, None, 71, None, 69, None, 67, None, 64, None,
       64, None, 67, None, 69, 70, 71, None, 74, None, 72, 71, 69, None, None, None,
       71, None, 72, None, 74, 75, 76, None, 76, None, 74, None, 72, None, 71, None,
       69, None, 71, 69, 67, None, 66, None, 64, None, None, None, 59, None, 64, None]
BASS = [40, 47, 40, 47, 45, 52, 47, 54, 40, 47, 40, 47, 45, 50, 47, 52]  # one note per beat (pizz)


def sneak(bars=8):
    beats = bars * 4
    n = int((beats + 4) * BEAT * SR)
    out = np.zeros(n)
    for rep in range(2):
        for i, m in enumerate(MEL):
            at = (rep * 32 + i) * BEAT / 2
            if at >= (beats + 4) * BEAT or m is None:
                continue
            place(out, bassoon(m - 12, BEAT * 0.45), at)
        for b in range(32):
            at = (rep * 32 + b) * BEAT
            place(out, pizz(BASS[b % len(BASS)], 0.5, 0.3) * 0.5, at)
            place(out, brush(), at + BEAT / 2)
            if b % 2 == 1:
                place(out, brush(0.2) * 1.4, at)
    L = int(beats * BEAT * SR)
    xf = int(0.05 * SR)
    y = out[:L].copy()
    y[:xf] = y[:xf] * np.linspace(0, 1, xf) + out[L:L + xf] * np.linspace(1, 0, xf)
    return norm(np.tanh(y * 1.2) / np.tanh(1.2), 0.85)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    items = {"hum_q": hum_q(), "hum_smug": hum_smug(), "hmph": hmph(), "giggle": giggle(), "gasp": gasp(),
             "clunk": clunk(), "slide_up": slide(True), "slide_down": slide(False), "sneak": sneak()}
    for i, m in enumerate((76, 79, 81, 83)):
        items[f"tip{i}"] = norm(pizz(m, 0.3, 0.6), 0.6)
    for k, v in items.items():
        sf.write(OUT / f"fumble_{k}.wav", np.asarray(v, dtype=np.float32), SR)
    print("wrote", len(items), "files to", OUT)
