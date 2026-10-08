"""Soundtrack for "AI NAVARASALU" (Mr. Fumble's nine emotions). Everything is synthesised (no samples, no film audio).

Reads the beat timing from video/src/reel/navarasa/timeline.json and writes video/public/navarasa/audio.wav:
  - an oom-pah comedy bed in C major, 120 BPM, that builds beat by beat
  - a hit on frame 0, nine ascending blips under the face flicker
  - a whoosh into every snap and an emotion sting on it (gasp, heartbeat, giggle, dun-dun-DUN, slide whistle,
    thunder + steam, sad trombone, fanfare, bell), music ducked under each sting
  - a tape-stop and half a second of silence before the last emotion, then a calm pad
  - the groove back for the end card, a riser and a final hit

  python3 pipeline/navarasa_audio.py
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from brand_audio import SR, bp, hp, hz, lp, norm, place, t_, whoosh  # noqa: E402
from fumble_audio import curve, gasp, giggle, hmph, hum, pizz  # noqa: E402
from gag_sfx import boing, squish  # noqa: E402

TL = json.loads((ROOT / "video" / "src" / "reel" / "navarasa" / "timeline.json").read_text())
OUT = ROOT / "video" / "public" / "navarasa" / "audio.wav"
BEAT = 60 / TL["bpm"]
rng = np.random.default_rng(27)


def env(sec, a=0.005, r=0.1):
    t = t_(sec)
    return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, sec - t) / r)


# ---------- instruments ----------
def brass(m, sec, bright=0.6, vib=0.0):
    t = t_(sec)
    f = hz(m) * (1 + vib * np.sin(2 * np.pi * 5.5 * t))
    ph = np.cumsum(f) / SR
    x = (2 * (ph % 1) - 1) + 0.6 * (2 * ((ph * 1.004) % 1) - 1)
    cut = 400 + 2600 * bright * np.minimum(1, t / 0.06)
    y = np.zeros_like(x)  # time-varying low-pass via short blocks
    blk = 512
    for i in range(0, len(x), blk):
        y[i:i + blk] = lp(x[max(0, i - blk):i + blk], float(cut[min(i, len(cut) - 1)]))[-len(x[i:i + blk]):]
    return y * env(sec, 0.02, 0.08) * 0.5


def keys(m, sec):
    t = t_(sec)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t * 5) + 0.2 * np.sin(2 * np.pi * 3.0 * f * t) * np.exp(-t * 8)
    return x * np.exp(-t * 6) * env(sec, 0.003, 0.05) * 0.25


def bell(m, sec=2.5):
    t = t_(sec)
    f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * d) for k, a, d in ((1, 1, 1.6), (2.76, 0.5, 3), (5.4, 0.25, 6), (8.93, 0.12, 9)))
    return x * env(sec, 0.002, 0.3) * 0.5


def pad(notes, sec):
    t = t_(sec)
    x = sum(np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.002 * t) for m in notes)
    return x * np.minimum(1, t / 0.6) * np.minimum(1, (sec - t) / 0.8) * 0.12


def clap(sec=0.3):
    t = t_(sec)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for d in (0.0, 0.011, 0.022):
        k = int(d * SR)
        e[k:] += np.exp(-t[: len(t) - k] * 38)
    return np.tanh(hp(lp(n, 6000), 900) * np.maximum(e, np.exp(-t * 11) * 0.4) * 1.6) * 0.5


def hat(sec=0.05):
    t = t_(sec)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70) * 0.18


def boom(sec=1.6):
    t = t_(sec)
    f = 40 + 90 * np.exp(-t * 9)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 6) * 0.25) * 0.9


def riser(sec):
    t = t_(sec)
    u = t / sec
    return hp(rng.standard_normal(len(t)), 1500) * u ** 2.5 * 0.3 + np.sin(2 * np.pi * np.cumsum(300 + 900 * u ** 2) / SR) * u ** 3 * 0.25


def blip(m):
    t = t_(0.12)
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 30) * 0.5


def tape_stop(clip, sec):
    speed = np.linspace(1, 0.05, int(sec * SR)) ** 1.5
    pos = np.cumsum(speed)
    pos = pos[pos < len(clip) - 1]
    return np.interp(pos, np.arange(len(clip)), clip) * np.linspace(1, 0, len(pos))


# ---------- emotion stings ----------
def st_wonder():
    out = np.zeros(int(1.6 * SR))
    for i, m in enumerate([72, 76, 79, 84, 88, 91, 96]):
        place(out, pizz(m, 0.9, 0.85) * 0.5, i * 0.045)
    t = t_(1.3)
    shimmer = sum(np.sin(2 * np.pi * hz(m) * t) for m in (96, 100, 103)) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.exp(-t * 2.2) * 0.08
    place(out, shimmer, 0.25)
    place(out, gasp() * 0.8, 0.0)
    return out


def st_love():
    out = np.zeros(int(1.8 * SR))
    for k in range(2):
        for d, a in ((0.0, 1.0), (0.22, 0.7)):
            t = t_(0.25)
            place(out, np.sin(2 * np.pi * (55 + 30 * np.exp(-t * 30)) * t) * np.exp(-t * 18) * a, k * 0.75 + d)
    for i, m in enumerate([67, 71, 74, 79, 83]):
        place(out, pizz(m, 0.8, 0.8) * 0.35, 0.1 + i * 0.06)
    place(out, hum(curve([(0, 300), (0.5, 330), (1, 230)], 0.7), 0.7, open_=0.6) * 0.5, 0.3)
    return out


def st_laugh():
    out = np.zeros(int(1.4 * SR))
    place(out, boing() * 0.7, 0.0)
    place(out, giggle() * 0.9, 0.12)
    place(out, giggle() * 0.7, 0.62)
    return out


def st_fear():
    out = np.zeros(int(2.0 * SR))
    place(out, brass(36, 0.28, 0.5), 0.0)
    place(out, brass(36, 0.28, 0.5), 0.33)
    place(out, brass(37, 1.3, 0.7, vib=0.01) * 1.2, 0.66)
    t = t_(1.3)
    trem = sum(np.sin(2 * np.pi * hz(m) * t) for m in (61, 64, 68)) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.minimum(1, t / 0.2) * np.exp(-t * 1.2) * 0.08
    place(out, trem, 0.66)
    place(out, boom(1.2) * 0.6, 0.66)
    return out


def st_disgust():
    out = np.zeros(int(1.3 * SR))
    t = t_(0.6)
    f = curve([(0, 1300), (1, 380)], 0.6)
    slide = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.03 * np.sin(2 * np.pi * 8 * t))) / SR) * env(0.6, 0.02, 0.1) * 0.45
    place(out, slide, 0.0)
    place(out, squish() * 0.6, 0.45)
    place(out, hmph() * 0.8, 0.55)
    return out


def st_anger():
    out = np.zeros(int(2.0 * SR))
    place(out, boom(1.6), 0.0)
    t = t_(1.6)
    thunder = lp(rng.standard_normal(len(t)), 300) * (np.exp(-t * 2) + 0.5 * np.exp(-((t - 0.25) ** 2) / 0.01)) * 2.2
    crack = hp(rng.standard_normal(int(0.08 * SR)), 2500) * np.exp(-t_(0.08) * 50) * 0.6
    place(out, thunder, 0.02)
    place(out, crack, 0.0)
    t2 = t_(0.9)
    steam = (bp(rng.standard_normal(len(t2)), 2500, 5000) * 0.6 + np.sin(2 * np.pi * np.cumsum(2600 + 500 * t2) / SR) * 0.25) * env(0.9, 0.05, 0.25) * 0.5
    place(out, steam, 0.55)
    return out


def st_sorrow():
    out = np.zeros(int(2.4 * SR))
    notes = [(58, 0.32), (57, 0.32), (56, 0.32), (55, 1.1)]  # wah-wah-wah-waaah
    at = 0.0
    for m, d in notes:
        place(out, brass(m, d, 0.35, vib=0.0 if d < 1 else 0.025) * 0.9, at)
        at += d + 0.04
    return out


def st_courage():
    out = np.zeros(int(2.0 * SR))
    for i, m in enumerate([60, 64, 67]):
        place(out, brass(m, 0.16, 0.9) * 0.8, i * 0.11)
    for m in (60, 64, 67, 72):
        place(out, brass(m, 1.1, 0.85) * 0.45, 0.33)
    t = t_(0.9)
    roll = lp(rng.standard_normal(len(t)), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 16 * t)) * np.minimum(1, t / 0.5) * 0.25
    place(out, roll, 0.0)
    t3 = t_(1.4)
    cym = hp(rng.standard_normal(len(t3)), 5000) * np.exp(-t3 * 2.2) * 0.25
    place(out, cym, 0.33)
    return out


def st_peace():
    out = np.zeros(int(3.0 * SR))
    place(out, bell(84, 2.6) * 0.8, 0.0)
    place(out, bell(79, 2.2) * 0.4, 0.35)
    place(out, hum(curve([(0, 180), (1, 160)], 1.2), 1.2, open_=0.4) * 0.35, 0.15)
    return out


STINGS = {"adbhuta": st_wonder, "shringara": st_love, "hasya": st_laugh, "bhayanaka": st_fear, "bibhatsa": st_disgust,
          "raudra": st_anger, "karuna": st_sorrow, "veera": st_courage, "shanta": st_peace}
GAIN = {"adbhuta": 0.8, "shringara": 0.85, "hasya": 0.9, "bhayanaka": 0.95, "bibhatsa": 0.85, "raudra": 0.9, "karuna": 0.9, "veera": 0.9, "shanta": 0.8}
CHORDS = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]  # C  G/B  Am  F
TUNE = [72, None, 76, 74, 72, None, 67, None, 69, None, 72, 71, 69, None, 67, None]  # original bouncy line, 8ths


def groove(t0, t1, level, layers):
    """Oom-pah bed from t0 to t1. layers: set of 'bass', 'stab', 'hat', 'clap', 'tune'."""
    out = np.zeros(int((t1 - t0 + 2) * SR))
    beat = 0
    while t0 + beat * BEAT < t1 - 1e-6:
        bar, pos = divmod(beat, 4)
        root, chord = CHORDS[bar % 4]
        at = beat * BEAT
        if "bass" in layers and pos in (0, 2):
            place(out, pizz(root if pos == 0 else root + 7, 0.45, 0.55) * 0.9, at)
        if "stab" in layers and pos in (1, 3):
            for m in chord:
                place(out, keys(m, 0.25), at)
        if "clap" in layers and pos in (1, 3):
            place(out, clap() * 0.6, at)
        if "hat" in layers:
            place(out, hat(), at + BEAT / 2)
        if "tune" in layers:
            for e in range(2):
                m = TUNE[(beat * 2 + e) % len(TUNE)]
                if m:
                    place(out, brass(m, BEAT / 2 * 0.9, 0.55) * 0.25, at + e * BEAT / 2)
        beat += 1
    return out[: int((t1 - t0) * SR)] * level


def main():
    total = TL["total"]
    n = int((total + 0.5) * SR)
    music = np.zeros(n)
    fx = np.zeros(n)
    beats = TL["beats"]
    drop0, drop1 = TL["drop"]
    end0 = TL["endcard"][0]

    # hook: hit on frame 0, blips under the flicker, the bed starts under the title
    place(fx, boom(1.6) * 0.9, 0.0)
    for m in (60, 64, 67, 72):
        place(fx, brass(m, 0.5, 0.9) * 0.35, 0.0)
    for k in range(9):
        place(fx, blip(72 + [0, 2, 4, 5, 7, 9, 11, 12, 14][k]), (3 + 5 * k) / TL["fps"])
    place(music, groove(0.0, 2.0, 0.55, {"bass", "stab"}), 0.0)

    # beats: the bed builds layer by layer
    for i, b in enumerate(beats):
        if b["key"] == "shanta":
            continue
        layers = {"bass", "stab"} | ({"hat"} if i >= 2 else set()) | ({"clap"} if i >= 4 else set()) | ({"tune"} if i >= 6 else set())
        seg = groove(b["start"] - 0.0, b["end"], 0.55 + 0.05 * i, layers)
        if b["end"] >= drop0 - 1e-6:  # tape-stop into the drop
            k = int((drop0 - 0.5 - b["start"]) * SR)
            seg = np.concatenate([seg[:k], tape_stop(seg[k:], 0.5)])
        place(music, seg, b["start"])
        place(fx, whoosh(0.35, True) * 0.35, b["snap"] - 0.3)
        place(fx, STINGS[b["key"]]() * GAIN[b["key"]], b["snap"])
        # soft typing clicks / notification while the screen fills
        for c in range(6):
            t = t_(0.03)
            place(fx, hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120) * 0.12, b["start"] + 0.12 + c * 0.09)

    # the last emotion: calm pad, no drums
    pz = [b for b in beats if b["key"] == "shanta"][0]
    place(music, pad([48, 55, 60, 64, 67], pz["end"] - pz["start"]) * 1.6, pz["start"])
    place(fx, whoosh(0.35, True) * 0.2, pz["snap"] - 0.3)
    place(fx, STINGS["shanta"]() * GAIN["shanta"], pz["snap"])
    for c in range(4):
        t = t_(0.03)
        place(fx, hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 120) * 0.1, pz["start"] + 0.12 + c * 0.09)

    # end card: full groove back, riser, final hit
    place(music, groove(end0, total, 1.05, {"bass", "stab", "hat", "clap", "tune"}), end0)
    for i in range(9):
        t = t_(0.1)
        place(fx, np.sin(2 * np.pi * (700 + 60 * i) * t) * np.exp(-t * 40) * 0.25, end0 + (6 + i * 3) / TL["fps"])
    place(fx, riser(31.6 - (end0 + 1.5)) * 1.1, end0 + 1.5)
    place(fx, boom(1.0) * 0.9, 31.6)
    for m in (60, 64, 67, 72):
        place(fx, brass(m, 0.8, 0.9) * 0.35, 31.6)

    # duck the bed under every sting (about -6 dB for 0.7 s), keep the drop silent
    duck = np.ones(n)
    for b in beats:
        a, z = int(b["snap"] * SR), int((b["snap"] + 0.7) * SR)
        r = int(0.15 * SR)
        duck[a:z] = np.minimum(duck[a:z], 0.5)
        duck[z:z + r] = np.minimum(duck[z:z + r], np.linspace(0.5, 1, len(duck[z:z + r])))
    music *= duck
    music[int(drop0 * SR):int(drop1 * SR)] = 0
    fx[int(drop0 * SR):int(drop1 * SR)] *= 0.0

    mixd = music * 0.7 + fx
    mixd = np.tanh(mixd * 1.1) / np.tanh(1.1)
    mixd = norm(mixd[: int(total * SR)], 0.89)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUT, np.stack([mixd, mixd], 1).astype(np.float32), SR)
    print("wrote", OUT, f"{total:.1f}s")


if __name__ == "__main__":
    main()
