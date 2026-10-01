"""Brand audio kit, synthesised from scratch (no samples, no licences):

  sonic logo   brand_sting.wav    whoosh -> impact -> two-note school bell ("Maastaaru" = teacher) -> sparkle
  SFX          brand_{whoosh,pop,click,type,enter,stamp,tick,swipe,chime,heart,riser,impact,bell}.wav
  music        brand_bed_120.wav  120 BPM bed laid out on the showreel beat map (drop on the logo at beat 56)
               brand_loop_120.wav 8-bar seamless loop for any template

  python3 pipeline/brand_audio.py   ->  video/public/brand/audio/
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
OUT = Path(__file__).resolve().parent.parent / "video" / "public" / "brand" / "audio"
rng = np.random.default_rng(2026)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def norm(x, peak=0.9):
    return x / (np.abs(x).max() + 1e-9) * peak


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(buf, clip, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n]


# ---------- SFX ----------
def whoosh(sec=0.55, up=True):
    t = t_(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    steps = 24
    for k in range(steps):  # moving band-pass = air sweeping past
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        c = 300 * (12 ** ((k / steps) if up else 1 - k / steps))
        out[a:b] = bp(n, c * 0.7, min(c * 1.6, 18000))[a:b]
    env = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 1.5
    return norm(out * env, 0.7)


def pop():
    t = t_(0.14)
    f = 900 * np.exp(-t * 18) + 380
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32), 0.7)


def click():
    t = t_(0.06)
    x = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 400) + 0.5 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 250)
    return norm(x, 0.6)


def key(seed=0):
    r = np.random.default_rng(seed)
    t = t_(0.05)
    x = bp(r.standard_normal(len(t)), 1500 + r.random() * 1200, 7000) * np.exp(-t * (300 + r.random() * 120))
    return norm(x, 0.35 + 0.1 * r.random())


def enter():
    t = t_(0.12)
    x = bp(rng.standard_normal(len(t)), 600, 4000) * np.exp(-t * 90) + 0.6 * np.sin(2 * np.pi * 220 * t) * np.exp(-t * 60)
    return norm(x, 0.6)


def stamp():
    t = t_(0.35)
    body = np.sin(2 * np.pi * (110 * np.exp(-t * 9) + 50) * t) * np.exp(-t * 14)
    paper = bp(rng.standard_normal(len(t)), 800, 6000) * np.exp(-t * 45)
    return norm(body + 0.55 * paper, 0.85)


def tick():
    t = t_(0.03)
    return norm(np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300), 0.35)


def swipe():
    return whoosh(0.3, up=False) * 0.8


def bell_tone(f0, sec=2.2):
    t = t_(sec)
    partials = ((1, 1.0, 1.6), (2.0, 0.55, 2.4), (2.76, 0.4, 3.0), (5.4, 0.22, 4.5), (8.93, 0.12, 6.0))
    x = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in partials)
    return x * np.minimum(1, t / 0.002)


def chime():
    a = bell_tone(hz(88), 1.2) * 0.6
    b = np.zeros_like(a)
    place(b, bell_tone(hz(93), 1.0) * 0.6, 0.09)
    return norm(a + b, 0.6)


def heart():
    t = t_(0.25)
    f = 500 + 900 * (t / 0.25)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * np.minimum(1, t / 0.01), 0.6)


def riser(sec=2.0):
    t = t_(sec)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    steps = 40
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        c = 200 * (40 ** (k / steps))
        out[a:b] = bp(n, c * 0.8, min(c * 1.3, 18000))[a:b]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / sec)) / SR) * 0.25
    return norm((out + tone) * (t / sec) ** 2, 0.7)


def impact():
    t = t_(1.2)
    sub = np.sin(2 * np.pi * (60 * np.exp(-t * 3) + 32) * t) * np.exp(-t * 3.5)
    crack = hp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 25)
    return norm(sub + 0.35 * crack, 0.95)


def bell():
    return norm(bell_tone(hz(88), 2.4), 0.7)


def sting():
    """Sonic logo, 2.8 s: whoosh in, impact on the squircle pop, school-bell "ding-DING" when the cap lands."""
    out = np.zeros(int(2.8 * SR))
    place(out, whoosh(0.5) * 0.7, 0.0)
    place(out, impact() * 0.55, 0.45)
    place(out, bell_tone(hz(88), 2.0) * 0.55, 1.0)   # E6
    place(out, bell_tone(hz(93), 1.8) * 0.65, 1.22)  # A6, a rising fourth
    for k in range(10):  # sparkle on the wordmark
        tt = t_(0.08)
        place(out, np.sin(2 * np.pi * (2500 + 2500 * rng.random()) * tt) * np.exp(-tt * 40) * 0.12, 1.5 + k * 0.06)
    fade = np.minimum(1, (2.8 - t_(2.8)) / 0.6)
    return norm(out * fade, 0.9)


# ---------- music ----------
def kick():
    t = t_(0.35)
    return np.sin(2 * np.pi * (48 + 110 * np.exp(-t * 28)) * t) * np.exp(-t * 9) + 0.1 * hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 200)


def clap():
    t = t_(0.25)
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    env = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, 0.011, 0.022)) + np.exp(-t * 18) * 0.4
    return n * env * 0.5


def hat(open_=False):
    t = t_(0.22 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if open_ else 90)) * 0.35


def saw(f, sec, det=0.0):
    t = t_(sec)
    ph = (t * f * (1 + det)) % 1
    return 2 * ph - 1


def pad(notes, sec):
    x = sum(saw(hz(m), sec, d) for m in notes for d in (-0.004, 0.004))
    env = np.minimum(1, t_(sec) / 0.08) * np.minimum(1, (sec - t_(sec)) / 0.12)
    return lp(x, 1800) * env * 0.06


def bass(m, sec):
    t = t_(sec)
    x = saw(hz(m), sec) * 0.6 + np.sin(2 * np.pi * hz(m) * t) * 0.6
    return lp(x, 420) * np.minimum(1, t / 0.005) * np.exp(-t * 2.5) * 0.5


def pluck(m, sec=0.25):
    t = t_(sec)
    return (np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(4 * np.pi * hz(m) * t)) * np.exp(-t * 14) * 0.18


PROG = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [67, 71, 74])]  # Am F C G


def music(beats, drop=None, breakdown=None):
    """`beats` long. Sections: groove with kick/hats/bass/pad; `breakdown` = (b0, b1) strips drums + riser;
    `drop` = beat where everything returns with an impact."""
    n = int(beats * BEAT * SR) + SR
    drums, music_, side = np.zeros(n), np.zeros(n), np.ones(n)
    for b in range(beats):
        at = b * BEAT
        in_break = breakdown and breakdown[0] <= b < breakdown[1]
        bar = b // 4
        root, chord = PROG[bar % 4]
        if b % 4 == 0:
            music_[int(at * SR):int(at * SR) + int(4 * BEAT * SR)] += pad(chord, 4 * BEAT)[: n - int(at * SR)]
        if not in_break:
            place(drums, kick() * 0.9, at)
            i = int(at * SR)
            dur = int(0.22 * SR)  # sidechain duck after each kick
            side[i:i + dur] = np.minimum(side[i:i + dur], 0.35 + 0.65 * (np.arange(min(dur, n - i)) / dur))
            if b % 2 == 1:
                place(drums, clap(), at)
            for k in range(2):
                place(drums, hat(open_=(k == 1 and b % 2 == 1)), at + k * BEAT / 2 + (0.012 if k else 0))
            place(music_, bass(root - 12, BEAT * 0.9), at)
            place(music_, bass(root - 12, BEAT * 0.4), at + BEAT * 0.75)
        for k in range(4):  # 16th arp
            m = chord[(b * 4 + k) % 3] + (12 if (b + k) % 7 == 0 else 0)
            place(music_, pluck(m) * (0.5 if in_break else 1), at + k * BEAT / 4)
    if breakdown:
        place(music_, riser((breakdown[1] - breakdown[0]) * BEAT) * 0.5, breakdown[0] * BEAT)
    if drop is not None:
        place(drums, impact() * 0.8, drop * BEAT)
    mix = drums + music_ * side
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    t = np.arange(n) / SR
    total = beats * BEAT
    mix *= np.minimum(1, t / 0.3) * np.clip((total + 0.9 - t) / 0.9, 0, 1)
    return norm(mix, 0.85)


def loop(bars=8):
    """Seamless loop: render 1 extra bar, crossfade the tail into the head."""
    beats = bars * 4
    x = music(beats + 4)
    L = int(beats * BEAT * SR)
    xf = int(0.05 * SR)
    y = x[:L].copy()
    y[:xf] = y[:xf] * np.linspace(0, 1, xf) + x[L:L + xf] * np.linspace(1, 0, xf)
    return norm(y, 0.85)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    items = {"sting": sting(), "whoosh": whoosh(), "pop": pop(), "click": click(), "enter": enter(), "stamp": stamp(),
             "tick": tick(), "swipe": swipe(), "chime": chime(), "heart": heart(), "riser": riser(), "impact": impact(),
             "bell": bell(), "bed_120": music(72, drop=56, breakdown=(48, 56)), "loop_120": loop()}
    for i in range(6):
        items[f"type{i}"] = key(i)
    for k, v in items.items():
        sf.write(OUT / f"brand_{k}.wav", np.asarray(v, dtype=np.float32), SR)
    print("wrote", len(items), "files to", OUT)
