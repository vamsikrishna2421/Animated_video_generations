"""Optional sound-effects layer for Mr. Fumble's half of the "Navarasalu rapid fire" recreation.

The stacked post plays the reference clip's own audio; this adds soft, synthesised accents for Fumble's moments
(teaser pops, warm-up, knuckle crack, a pop on each face, tongue raspberry, wrong-rasa buzzer + fix, moustache shing,
shy giggle, laugh) so Fumble's half is not silent. Timings follow video/src/reel/navarasa/FumbleBrahmi.tsx.

  python3 pipeline/brahmi_fumble_sfx.py   ->  out/brahmi_fumble_sfx.m4a (full) + out/brahmi_fumble_sfx_fast.m4a (trimmed cut)
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from brand_audio import SR, bp, hp, hz, norm, place, t_  # noqa: E402
from fumble_audio import giggle, hum, curve, slide, clunk  # noqa: E402
from gag_sfx import boing, pop, ding  # noqa: E402

TOTAL = 54.67
TRIM_A, TRIM_B = 2.9, 10.6
CUTS = [11.8, 15.1, 18.5, 21.53, 26.7, 30.13, 34.07, 37.83, 44.53, 50.1]
rng = np.random.default_rng(9)


def blip(m, sec=0.12):
    t = t_(sec)
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 28)


def crack():
    out = np.zeros(int(0.5 * SR))
    for k in range(3):
        t = t_(0.03)
        place(out, hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 160) * 0.9, 0.05 + k * 0.11)
    return out


def raspberry():
    t = t_(0.6)
    f = 90 + 20 * np.sin(2 * np.pi * 31 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + bp(rng.standard_normal(len(t)), 300, 1500) * 0.4
    return bp(x, 80, 1800) * np.minimum(1, t / 0.03) * np.minimum(1, (0.6 - t) / 0.1)


def buzzer():
    t = t_(0.4)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.6 + np.sign(np.sin(2 * np.pi * 116 * t)) * 0.4
    return bp(x, 100, 2500) * np.minimum(1, t / 0.01) * np.minimum(1, (0.4 - t) / 0.05)


def shing():
    t = t_(0.7)
    f = 1200 + 1600 * np.minimum(1, t / 0.25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)) * np.exp(-t * 4) * 0.5


def puff():
    t = t_(0.35)
    return bp(rng.standard_normal(len(t)), 400, 2500) * np.sin(np.pi * t / 0.35) * 0.5


def main():
    out = np.zeros(int((TOTAL + 0.5) * SR))
    for i, at in enumerate([0.4, 0.8, 1.2, 1.6, 2.0]):  # teaser faces
        place(out, blip(72 + [0, 4, 7, 12, 16][i]) * 0.6, at)
    place(out, slide(True, 0.5) * 0.5, 4.9)          # mouth stretch
    place(out, puff(), 5.7)                          # cheek puff
    place(out, boing() * 0.35, 6.5)                  # brow wiggle
    place(out, crack(), 8.25)                        # knuckle crack
    for c in CUTS:                                   # a soft pop on every face
        place(out, pop() * 0.45, c)
    place(out, raspberry() * 0.7, 23.6)              # tongue out
    place(out, ding() * 0.35, 26.75)                 # wonder sparkle
    place(out, buzzer() * 0.6, 30.2)                 # wrong rasa
    place(out, ding() * 0.45, 30.85)                 # fixed
    place(out, shing(), 39.05)                       # moustache appears
    place(out, ding() * 0.3, 42.25)                  # heroic shine
    place(out, giggle() * 0.5, 45.6)                 # shy
    place(out, giggle() * 0.6, 50.2)                 # laugh
    place(out, giggle() * 0.5, 50.9)
    place(out, clunk() * 0.4, 52.9)                  # proud nod
    full = norm(out[: int(TOTAL * SR)], 0.6)
    fast = np.concatenate([full[: int(TRIM_A * SR)], full[int(TRIM_B * SR):]])
    for name, x in (("brahmi_fumble_sfx", full), ("brahmi_fumble_sfx_fast", fast)):
        wav = ROOT / "out" / "local" / f"{name}.wav"
        wav.parent.mkdir(parents=True, exist_ok=True)
        sf.write(wav, np.stack([x, x], 1).astype(np.float32), SR)
        m4a = ROOT / "out" / f"{name}.m4a"
        ff = shutil.which("ffmpeg") or "ffmpeg"
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "160k", str(m4a)], check=True)
        print("wrote", m4a, f"{len(x) / SR:.2f}s")


if __name__ == "__main__":
    main()
