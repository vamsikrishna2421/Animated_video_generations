"""Original 117 BPM pop-funk groove for the King of Pop moves reel (no samples, no existing melody or bassline).

  python3 pipeline/groove_117.py out.wav [--dur 42.6] [--first 0.2] [--hits 3,4.5,...] [--end 40.1]

Beat grid = first + k * 60/117 s (the same grid the dance accents are snapped to). Arc: impact on frame 1, two bars
of drums + bass, then chord stabs and claps; a crash + whoosh on every step change; a breakdown bar before the last
section; a riser into the end card, a final hit, then a held chord under the follow card.
"""
import argparse

import numpy as np
import soundfile as sf

SR = 44100
rng = np.random.default_rng(7)


def env(n, a=0.002, d=0.15):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def kick(n=int(0.35 * SR)):
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18) * 0.95


def snare(n=int(0.25 * SR)):
    t = np.arange(n) / SR
    return (0.55 * rng.standard_normal(n) * env(n, 0.001, 0.07) + 0.35 * np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.05))


def clap(n=int(0.22 * SR)):
    x = rng.standard_normal(n) * env(n, 0.001, 0.06)
    for d in (0.008, 0.016):
        k = int(d * SR)
        x[k:] += rng.standard_normal(n - k) * env(n - k, 0.001, 0.05) * 0.7
    return x * 0.45


def hat(n=int(0.06 * SR), open_=False):
    if open_:
        n = int(0.25 * SR)
    x = rng.standard_normal(n)
    x = np.diff(np.concatenate([[0], x]))  # crude high-pass
    return x * env(n, 0.0005, 0.12 if open_ else 0.018) * 0.22


def crash(n=int(1.6 * SR)):
    x = np.diff(np.concatenate([[0], rng.standard_normal(n)]))
    return x * env(n, 0.002, 0.6) * 0.28


def tone(freq, dur, kind="saw", a=0.004, d=0.25, amp=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = (freq * t) % 1
    w = {"saw": 2 * ph - 1, "sq": np.sign(np.sin(2 * np.pi * freq * t)), "sin": np.sin(2 * np.pi * freq * t)}[kind]
    return w * env(n, a, d) * amp


def lowpass(x, k=6):
    y = np.copy(x)
    for _ in range(k):
        y[1:] = 0.5 * (y[1:] + y[:-1])
    return y


def place(buf, x, t):
    i = int(t * SR)
    if i >= len(buf) or i < 0:
        return
    m = min(len(x), len(buf) - i)
    buf[i:i + m] += x[:m]


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--dur", type=float, default=42.6)
    ap.add_argument("--first", type=float, default=0.2)
    ap.add_argument("--hits", default="3,4.5,9,12,15,18,21,24,27,30,33,36,39")
    ap.add_argument("--end", type=float, default=40.1)
    a = ap.parse_args()
    B = 60 / 117
    N = int(a.dur * SR)
    drums, bass, keys, fx = (np.zeros(N) for _ in range(4))
    nb = int((a.end - a.first) / B)
    brk = int((33.0 - a.first) / B) - 2  # one-bar breakdown before the last sections
    # original progression in E minor: Em | C | D | Bm  (bass root notes, 16th-note syncopated pattern)
    roots = [40, 36, 38, 35]
    chords = [[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 62, 66]]
    bass_pat = [0, None, 0, 12, None, 0, 7, None, 0, None, 10, 12, None, 7, 5, None]  # own pattern, in 16ths
    for k in range(nb):
        t = a.first + k * B
        bar, beat = divmod(k, 4)
        quiet = brk <= k < brk + 2
        root = roots[bar % 4]
        if not quiet:
            place(drums, kick(), t)
            if beat in (1, 3):
                place(drums, snare(), t)
                if k >= 8:
                    place(drums, clap(), t)
            for s in range(2):
                place(drums, hat(open_=(s == 1 and bar % 2 == 1 and k >= 16)), t + s * B / 2)
            for s in range(4):
                iv = bass_pat[(beat * 4 + s) % 16]
                if iv is not None:
                    place(bass, lowpass(tone(note(root + iv), B / 4 * 0.9, "saw", 0.003, 0.09, 0.42), 8), t + s * B / 4)
            if k >= 8 and beat in (0, 2):  # offbeat chord stabs
                for m in chords[bar % 4]:
                    place(keys, lowpass(tone(note(m), 0.22, "sq", 0.002, 0.08, 0.07), 3), t + B / 2)
        else:
            for m in chords[bar % 4]:
                place(keys, tone(note(m), B, "sin", 0.05, 0.6, 0.06), t)
    # impact on frame 1, crash + whoosh on every step change
    place(fx, kick() * 1.2, 0.0)
    place(fx, crash() * 1.4, 0.0)
    for h in [float(x) for x in a.hits.split(",") if x]:
        place(fx, crash(), h)
        n = int(0.4 * SR)
        place(fx, lowpass(rng.standard_normal(n), 3) * np.linspace(0, 1, n) ** 2 * 0.25, h - 0.4)
    # riser into the end card, final hit, held chord under the follow card
    rs = int(1.6 * SR)
    t = np.arange(rs) / SR
    place(fx, np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / 1.6) ** 2) / SR) * (t / 1.6) ** 2 * 0.25 + rng.standard_normal(rs) * (t / 1.6) ** 3 * 0.15, a.end - 1.6)
    place(fx, kick() * 1.3, a.end)
    place(fx, crash() * 1.5, a.end)
    for m in [52, 64, 67, 71]:
        place(keys, tone(note(m), a.dur - a.end, "saw", 0.02, 1.4, 0.07), a.end)
    mix = drums * 0.9 + bass * 1.0 + keys * 1.0 + fx * 0.9
    tt = np.arange(N) / SR  # lift: the last sections and the end card play louder than the opening
    mix *= np.interp(tt, [0, 30.0, 34.0, a.end, a.dur], [0.8, 0.8, 1.0, 1.15, 1.05])
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.9
    sf.write(a.out, np.stack([mix, mix], 1).astype(np.float32), SR)
    print(a.out, f"{a.dur:.1f}s", nb, "beats")


if __name__ == "__main__":
    main()
