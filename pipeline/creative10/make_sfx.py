# Creative 10: the TV-serial sounds, made here (no library clips): thunder (a crack and a rolling rumble), "dhan" (one
# orchestra-style hit: a low drum, a tom, a cymbal wash and a minor brass stab), dhan3 (the triple zoom: three hits 0.17 s
# apart, each a step higher), a dog's whimper (Tommy's zoom), and a tremolo-strings sting (the suspense under the panic).
# Writes video/public/reel/creative10v1/{thunder,dhan,dhan3,whimper,sting}.wav (both reels use them).
#   python3 pipeline/creative10/make_sfx.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative10v1"
SR = 44100
rng = np.random.default_rng(10)


def t_(sec):
    return np.arange(int(SR * sec)) / SR


def lp(x, a):   # one-pole low-pass, a in (0, 1): smaller = darker
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def hp(x, k=0.95, n=2):
    for _ in range(n):
        x = np.r_[x[0], x[1:] - k * x[:-1]]
    return x


def norm(x, peak=0.9):
    return x / (np.abs(x).max() + 1e-9) * peak


def bp(x, lo_a, hi_a):   # crude band-pass: two one-pole low-passes subtracted
    return lp(lp(x, hi_a), hi_a) - lp(lp(x, lo_a), lo_a)


def thunder():
    t = t_(3.2)
    crack = bp(rng.standard_normal(len(t)), 0.12, 0.6) * np.exp(-t / 0.06)   # about 1-5 kHz: the crack a phone can play
    rumble = bp(rng.standard_normal(len(t)), 0.012, 0.09)   # about 90-650 Hz: the roll (phone speakers barely play 30-60 Hz)
    rolls = 1 + 0.6 * np.sin(2 * np.pi * 1.7 * t + 0.5) * np.sin(2 * np.pi * 0.6 * t)   # the roll comes and goes
    rumble *= rolls * np.clip(t / 0.08, 0, 1) * np.exp(-t / 1.1)
    return norm(0.6 * norm(crack) + norm(rumble))


CLAP = None


def dhan(pitch=1.0):
    global CLAP
    if CLAP is None:
        CLAP, _ = sf.read(ROOT / "video/public/reel/creative09v1/clap.wav")
    t = t_(1.2)
    f = 58 * pitch * (1 + 0.6 * np.exp(-t / 0.03))   # a pitch drop: the drum's thump (felt on headphones)
    drum = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    tom = np.sin(2 * np.pi * 196 * pitch * t) * np.exp(-t / 0.12)
    stab = np.zeros(len(t))
    for fr in (293.7, 349.2, 440.0, 587.3):   # D minor, a brass-ish saw an octave up: what a phone speaker plays
        ph = (fr * pitch * t) % 1.0
        stab += (2 * ph - 1)
    stab = lp(stab, 0.3) * np.exp(-t / 0.25) * np.clip(t / 0.006, 0, 1)
    clap = np.zeros(len(t))
    clap[: len(CLAP)] = CLAP[: len(t)]
    return norm(0.5 * norm(drum) + 0.4 * norm(tom) + 0.8 * norm(stab) + 0.45 * norm(clap))


def dhan3():
    out = np.zeros(int(SR * 1.8))
    for k, p in enumerate((1.0, 1.06, 1.12)):
        h = dhan(p) * (0.75 + 0.12 * k)
        i = int(k * 0.17 * SR)
        j = min(len(out), i + len(h))
        out[i:j] += h[: j - i]
    return norm(out)


def whimper():
    out = np.zeros(int(SR * 1.3))
    for start, dur, f0, f1 in ((0.0, 0.42, 950, 1350), (0.55, 0.6, 1150, 780)):
        t = t_(dur)
        f = np.linspace(f0, f1, len(t)) * (1 + 0.025 * np.sin(2 * np.pi * 7 * t))
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.8
        breath = hp(rng.standard_normal(len(t)), 0.9, 1) * 0.05
        x = (tone * env + breath * env)
        i = int(start * SR)
        out[i:i + len(x)] += x
    return norm(lp(out, 0.5), 0.8)


def sting():
    t = t_(1.6)
    x = np.zeros(len(t))
    for fr in (110.0, 130.8, 164.8, 220.0, 261.6):   # A minor, low strings
        ph = (fr * (1 + 0.002 * rng.standard_normal()) * t) % 1.0
        x += 2 * ph - 1
    trem = 0.55 + 0.45 * np.sin(2 * np.pi * 14 * t)
    env = np.clip(t / 1.2, 0, 1) ** 1.5 * np.exp(-np.clip(t - 1.35, 0, None) / 0.08)
    return norm(lp(x, 0.12) * trem * env, 0.8)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, x in (("thunder", thunder()), ("dhan", dhan()), ("dhan3", dhan3()), ("whimper", whimper()), ("sting", sting())):
        fade = np.ones(len(x))
        k = int(0.02 * SR)
        fade[-k:] = np.linspace(1, 0, k)
        sf.write(OUT / f"{name}.wav", (x * fade).astype(np.float32), SR)
        print("wrote", OUT / f"{name}.wav", round(len(x) / SR, 2), "s")


if __name__ == "__main__":
    main()
