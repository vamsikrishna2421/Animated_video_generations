"""Original score + sound design for the KingfisherRide reel (36 s), synthesised from scratch: no samples, no licences.

  python3 pipeline/kingfisher_score.py  ->  video/public/kingfisher/score.wav

Story beats (seconds): 0 macro / 2.5 title hit / 5.5 launch / 8.5 chase / 13.5 slow-mo breath / 17 hover tension /
19.5 dive riser / 21.85 silence / 22.0 impact / 24.5 burst out (minor -> major) / 28 landing resolve / 33 end card.
"""
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 36.0
N = int(SR * DUR)
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(26)


def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, sus, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def note(name):
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
    p, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[p] + 12 * (o + 1) - 69) / 12)


def saw(f, d, detune=0.0):
    t = t_(d)
    ph = (f * (1 + detune)) * t + rng.random()
    return 2 * (ph - np.floor(ph + 0.5))


def pad(freqs, d, a=1.2, r=1.5, cut=1800, vol=0.12):
    out = np.zeros(int(d * SR))
    for f in freqs:
        for dt in (-0.004, 0.0, 0.0045):
            out += saw(f, d, dt)
    out = lp(out / (len(freqs) * 3), cut)
    return out * env(len(out), a, r) * vol


def pluck(f, d=1.2, vol=0.25, bright=0.5):
    # Karplus-Strong
    # vectorised one period at a time
    n, p = int(d * SR), max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    chunks = []
    k = 0.994 + 0.004 * bright
    while sum(len(c) for c in chunks) < n:
        chunks.append(buf.copy())
        buf = 0.5 * (buf + np.roll(buf, -1)) * k
    out = np.concatenate(chunks)[:n]
    return out * vol * env(n, 0.002, 0.2)


def taiko(vol=0.9, d=0.9):
    t = t_(d)
    f = 45 + 95 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    skin = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 30) * 0.5
    return np.tanh((body + skin) * 1.6) * vol


def heartbeat(vol=0.6):
    t = t_(0.35)
    return np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t * 30)) / SR) * np.exp(-t * 14) * vol


def hat(vol=0.08):
    t = t_(0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 90) * vol


def boom(vol=1.0, d=3.0):
    t = t_(d)
    sub = np.sin(2 * np.pi * np.cumsum(30 + 40 * np.exp(-t * 3)) / SR) * np.exp(-t * 1.4)
    crash = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 3) * 0.4
    return np.tanh((sub + crash) * 2.2) * vol


def riser(d, vol=0.35):
    t = t_(d)
    u = t / d
    noise = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    seg = int(SR * 0.05)
    for i in range(0, len(t), seg):  # sweeping band
        uu = i / len(t)
        lo = 300 + uu * 5000
        out[i:i + seg] = bp(noise[i:i + seg + 0], lo, lo * 1.6)[: len(out[i:i + seg])]
    tone = saw(1, d) * 0
    ph = np.cumsum(110 * 2 ** (u * 3)) / SR
    tone = 2 * (ph - np.floor(ph + 0.5))
    return (out * 0.7 + lp(tone, 4000) * 0.35) * u ** 2.2 * vol


def whoosh(d=0.9, vol=0.5):
    t = t_(d)
    n = rng.standard_normal(len(t))
    u = t / d
    out = bp(n, 400, 3000) * np.sin(np.pi * u) ** 2
    return lp(out, 6000) * vol


def splash(vol=0.8):
    t = t_(2.0)
    burst = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 5)
    bubbles = np.zeros(len(t))
    for _ in range(40):
        st = int(rng.uniform(0.05, 1.6) * SR)
        dd = int(0.06 * SR)
        f0 = rng.uniform(400, 1400)
        tt = np.arange(dd) / SR
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + tt * 12)) / SR) * np.exp(-tt * 60)
        bubbles[st:st + dd] += b[: len(bubbles[st:st + dd])] * rng.uniform(0.05, 0.15)
    return (burst * 0.9 + bubbles) * vol


def reverb(x, secs=2.6, mix=0.3):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)
    ir = lp(ir, 5000)
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[: len(x)]
    wet /= np.max(np.abs(wet)) + 1e-9
    return x * (1 - mix) + wet * mix * np.max(np.abs(x))


music, drums, fx = np.zeros(N), np.zeros(N), np.zeros(N)


def put(bus, sig, at):
    i = int(at * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    bus[i:j] += sig[: j - i]


# ---- harmony ----
Dm = ["D3", "F3", "A3", "D4"]
Bb = ["Bb2", "D3", "F3", "Bb3"]
F_ = ["F2", "C3", "F3", "A3"]
C_ = ["C3", "E3", "G3", "C4"]
D_ = ["D3", "F#3", "A3", "D4"]
A_ = ["A2", "E3", "A3", "C#4"]
Bm = ["B2", "D3", "F#3", "B3"]
G_ = ["G2", "D3", "G3", "B3"]
fr = lambda ch: [note(n) for n in ch]  # noqa: E731

# intro + title + launch + chase: Dm Bb F C (2.25 s per chord from 2.5)
put(music, pad(fr(Dm), 2.6, a=1.8, r=0.6, cut=900, vol=0.10), 0.0)
prog = [Dm, Bb, F_, C_]
tt = 2.5
k = 0
while tt < 13.5:
    put(music, pad(fr(prog[k % 4]), 2.4, a=0.3, r=0.6, cut=1400 + min(1, (tt - 2.5) / 6) * 1600, vol=0.13), tt)
    tt += 2.25
    k += 1
# slow-mo breath: long Bb -> F swell, high shimmer
put(music, pad(fr(Bb) + [note("F5")], 2.0, a=0.6, r=1.0, cut=2600, vol=0.13), 13.5)
put(music, pad(fr(F_) + [note("C5")], 2.0, a=0.6, r=1.2, cut=2600, vol=0.13), 15.3)
for i, nm in enumerate(["A5", "F5", "D5", "C6", "A5", "F5", "E5", "C6"] * 2):
    put(music, pluck(note(nm), 1.4, vol=0.06, bright=0.9), 13.5 + i * 0.22)
# hover tension: Dm with rising cutoff
put(music, pad(fr(Dm), 2.5, a=0.8, r=0.2, cut=1200, vol=0.12), 17.0)
put(music, pad(fr(Bb), 2.4, a=0.3, r=0.1, cut=2400, vol=0.13), 19.5)
# impact: low chord swell (slow motion)
put(music, pad([note("D2"), note("A2"), note("D3"), note("F3")], 2.6, a=0.2, r=1.2, cut=900, vol=0.16), 22.0)
# burst out: D major lift, D A Bm G
for i, ch in enumerate([D_, A_, Bm, G_]):
    put(music, pad(fr(ch) + [fr(ch)[1] * 2], 2.0, a=0.15, r=0.5, cut=3200, vol=0.15), 24.5 + i * 1.75 * 0 + i * 0.875)
# landing resolve: G A D (warm), end chord
put(music, pad(fr(G_), 2.2, a=0.3, r=0.6, cut=2600, vol=0.15), 28.0)
put(music, pad(fr(A_), 2.2, a=0.3, r=0.6, cut=2600, vol=0.15), 30.0)
put(music, pad(fr(D_) + [note("F#4"), note("A4")], 5.0, a=0.4, r=3.0, cut=2400, vol=0.16), 32.0)
# ostinato plucks (eighths at 120 bpm) through launch + chase, back for hover + burst
arp_m = ["D4", "A4", "F4", "A4", "D5", "A4", "F4", "A4"]
arp_M = ["D4", "A4", "F#4", "A4", "D5", "A4", "F#4", "A4"]
for i in range(int((13.5 - 5.5) / 0.25)):
    put(music, pluck(note(arp_m[i % 8]), 0.8, vol=0.09 + 0.03 * ((i % 8) == 0)), 5.5 + i * 0.25)
for i in range(int((21.8 - 17.0) / 0.25)):
    put(music, pluck(note(arp_m[i % 8]), 0.6, vol=0.05 + 0.06 * i / 19), 17.0 + i * 0.25)
for i in range(int((28.0 - 24.5) / 0.25)):
    put(music, pluck(note(arp_M[i % 8]), 0.8, vol=0.1), 24.5 + i * 0.25)
# melody over the landing
for at, nm, d in [(28.0, "A4", 0.9), (28.9, "D5", 0.9), (29.8, "E5", 0.9), (30.7, "F#5", 1.4), (32.1, "E5", 0.7), (32.8, "D5", 3.0)]:
    put(music, pluck(note(nm), d + 0.6, vol=0.16, bright=0.8), at)

# ---- drums ----
for b in [0.4, 1.0, 1.6, 2.2]:  # heartbeat under the macro
    put(drums, heartbeat(0.5), b)
put(drums, taiko(1.0, 1.2), 2.5)
for i in range(16):  # chase pattern (120 bpm)
    bt = 8.5 + i * 0.5
    if bt >= 13.5:
        break
    put(drums, taiko(0.75 if i % 2 == 0 else 0.45, 0.6), bt)
    put(drums, hat(0.07), bt + 0.25)
for i in range(10):  # launch: lighter
    put(drums, taiko(0.4, 0.5), 5.5 + i * 0.3 if 5.5 + i * 0.3 < 8.5 else 99)
# hover heartbeat accelerating into the dive, then a roll
hb = 17.0
gap = 0.55
while hb < 19.5:
    put(drums, heartbeat(0.55), hb)
    hb += gap
    gap = max(0.2, gap * 0.9)
rt, gap = 19.5, 0.22
while rt < 21.8:
    put(drums, taiko(0.25 + 0.5 * (rt - 19.5) / 2.3, 0.35), rt)
    rt += gap
    gap = max(0.06, gap * 0.9)
# burst out: driving again
for i in range(7):
    put(drums, taiko(0.85 if i % 2 == 0 else 0.5, 0.6), 24.5 + i * 0.5)
    put(drums, hat(0.08), 24.75 + i * 0.5)
put(drums, taiko(0.7, 1.0), 28.0)
put(drums, taiko(0.5, 1.2), 32.0)

# ---- sound design ----
put(fx, boom(0.7, 2.5), 2.5)
put(fx, whoosh(0.9, 0.35), 5.45)
put(fx, whoosh(0.6, 0.25), 8.45)
put(fx, whoosh(0.7, 0.3), 12.2)
put(fx, riser(2.3, 0.33), 17.2)
put(fx, riser(2.33, 0.45), 19.5)
put(fx, boom(1.0, 3.0), 22.0)
put(fx, splash(0.75), 22.0)
put(fx, splash(0.5), 24.5)
put(fx, whoosh(0.8, 0.5), 25.9)
put(fx, boom(0.45, 2.0), 24.5)

# ---- mix: silence before impact, reverb, arc, master ----
music = reverb(music, 2.8, 0.35)
drums = reverb(drums, 1.6, 0.15)
mix = music * 1.0 + drums * 0.55 + fx * 0.6
cut0, cut1 = int(21.85 * SR), int(22.0 * SR)
mix[cut0:cut1] *= np.linspace(0.15, 0.0, cut1 - cut0)  # the breath before the splash
arc = np.interp(np.arange(N) / SR, [0, 2.5, 8.5, 13.5, 17, 21.8, 22.0, 24.5, 28, 33, 36], [0.7, 0.85, 1.0, 0.8, 0.9, 1.1, 1.1, 1.15, 1.05, 1.0, 0.0])
mix *= arc
mix = hp(mix, 30)
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 10 ** (-1.2 / 20) / (np.max(np.abs(mix)) + 1e-9)
# stereo: slight width from a short delay on the music bus
d = int(0.011 * SR)
left = mix
right = np.concatenate([mix[:d], mix[:-d]]) * 0.15 + mix * 0.85
out = np.stack([left, right], 1).astype(np.float32)
dst = ROOT / "video" / "public" / "kingfisher" / "score.wav"
dst.parent.mkdir(parents=True, exist_ok=True)
import soundfile as sf  # noqa: E402

sf.write(dst, out, SR)
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
print(f"wrote {dst} ({DUR:.0f} s, RMS {rms:.1f} dBFS)")
