# Creative 09: the percussion layer (hi-hats and claps on the lofi bed's 88 BPM grid) that builds from the push to the
# punchline, and one bright clap laid over the bass booms (render review: phone speakers barely play 30-60 Hz, and the
# last quarter didn't build). Writes video/public/reel/creative09v1/perc.wav and clap.wav (both reels use them).
#   python3 pipeline/creative09/make_perc.py
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "video/public/reel/creative09v1"
SR = 44100
BEAT = 60 / 88   # reel_build's beatSnap grid: scene cuts land on it, so a layer started at a cut is on the beat
rng = np.random.default_rng(9)


def hp(x, k=0.95, n=3):
    for _ in range(n):
        x = np.r_[x[0], x[1:] - k * x[:-1]]
    return x


def hat(decay):
    n = int(SR * (decay * 6))
    t = np.arange(n) / SR
    return hp(rng.standard_normal(n)) * np.exp(-t / decay)


def clap():
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for d in (0.0, 0.009, 0.019):   # three quick hands, then the room
        i = int(d * SR)
        m = int(0.006 * SR)
        x[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (0.0015 * SR))
    i = int(0.019 * SR)
    x[i:] += rng.standard_normal(n - i) * np.exp(-(t[i:] - t[i]) / 0.11) * 0.6
    x = hp(x, 0.9, 2)
    x = np.convolve(x, np.ones(4) / 4, mode="same")   # take the fizz off: the body sits around 1-3 kHz
    return x


def place(buf, s, at, gain):
    i = int(at * SR)
    j = min(len(buf), i + len(s))
    buf[i:j] += s[: j - i] * gain


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    length = 20.0
    buf = np.zeros(int(SR * length))
    c = clap()
    c = c / np.abs(c).max()
    t = 0.0
    k = 0
    while t < length - 1:
        beat_i, half = divmod(k, 2)
        in_bar = beat_i % 4
        if half == 0:
            place(buf, hat(0.022), t, 0.55)
            if in_bar in (1, 3):
                place(buf, c, t, 0.9)
        else:
            place(buf, hat(0.11 if in_bar == 3 else 0.022), t, 0.45 if in_bar == 3 else 0.35)
        t += BEAT / 2
        k += 1
    buf = buf / (np.abs(buf).max() + 1e-9) * 0.9
    sf.write(OUT / "perc.wav", buf.astype(np.float32), SR)
    sf.write(OUT / "clap.wav", (c * 0.9).astype(np.float32), SR)
    print("wrote", OUT / "perc.wav", OUT / "clap.wav")


if __name__ == "__main__":
    main()
