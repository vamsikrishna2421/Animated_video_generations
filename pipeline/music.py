"""Procedural background music + UI sound effects, no samples, no services.

A warm, upbeat bed (pads, plucked arpeggio, soft kick/hats, side-chain pump) sized
to the timeline, with an intro swell and a resolving final chord.

Outputs:
  video/public/audio/music.wav
  video/public/audio/sfx_pop.wav     (checklist tick)
  video/public/audio/sfx_success.wav (ITR filed)
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = ROOT / "video" / "src" / "timeline.json"
OUT = ROOT / "video" / "public" / "audio"
SR = 44100
rng = np.random.default_rng(7)


def midi_hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, btype="low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, btype="high", fs=SR, output="sos"), x)


def adsr(n, a, d, s, r):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sustain = max(n - a - d - r, 0)
    env = np.concatenate([
        np.linspace(0, 1, a, endpoint=False),
        np.linspace(1, s, d, endpoint=False),
        np.full(sustain, s),
        np.linspace(s, 0, r),
    ])
    return np.pad(env, (0, max(n - env.size, 0)))[:n]


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (freq * (1 + detune)) * t + rng.random()
    return 2 * (ph % 1) - 1


def pad_chord(notes, seconds):
    n = int(seconds * SR)
    out = np.zeros(n)
    for note in notes:
        f = midi_hz(note)
        for d in (-0.004, 0.0, 0.005):
            out += saw(f, n, d)
    out = lowpass(out / (len(notes) * 3), 1400)
    return out * adsr(n, 0.4, 0.3, 0.8, 0.6)


def pluck(note, seconds=0.45):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = midi_hz(note)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    return tone * np.exp(-t * 9)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    freq = 45 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9)


def hat():
    n = int(0.06 * SR)
    return highpass(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR * 70) * 0.25


def place(buf, clip, start):
    s = int(start * SR)
    if s >= buf.size:
        return
    e = min(s + clip.size, buf.size)
    buf[s:e] += clip[: e - s]


def build_music(seconds, bpm):
    beat = 60 / bpm
    bar = beat * 4
    n = int(seconds * SR)
    pads, arp, drums, bass = (np.zeros(n) for _ in range(4))

    # Fmaj7 - Dm9 - Bbmaj7 - C6  (bright, optimistic, never resolves too early)
    prog = [
        [53, 57, 60, 64],
        [50, 57, 60, 64],
        [46, 53, 57, 62],
        [48, 55, 57, 64],
    ]
    bass_roots = [41, 38, 34, 36]
    arp_pattern = [0, 2, 1, 3, 2, 1, 3, 2]

    bars = int(np.ceil(seconds / bar))
    for b in range(bars):
        chord = prog[b % 4]
        t0 = b * bar
        place(pads, pad_chord(chord, bar + 0.5), t0)
        place(bass, pluck(bass_roots[b % 4], bar * 0.9) * 0.9, t0)
        place(bass, pluck(bass_roots[b % 4], beat * 0.9) * 0.5, t0 + beat * 2.5)
        if b >= 1:  # arpeggio enters after the first bar
            for i, idx in enumerate(arp_pattern):
                place(arp, pluck(chord[idx] + 12, 0.4) * 0.35, t0 + i * beat / 2)
        if b >= 2:  # drums enter on bar 3
            for q in range(4):
                if q in (0, 2):
                    place(drums, kick() * 0.8, t0 + q * beat)
                place(drums, hat(), t0 + q * beat + beat / 2)

    # Side-chain style pump on pads keyed to each beat.
    t = np.arange(n) / SR
    pump = 1 - 0.35 * np.exp(-((t % beat) / beat) * 6)
    pads *= pump

    bass = lowpass(bass, 400)
    mix = 0.55 * pads + 0.5 * arp + 0.45 * drums + 0.6 * bass

    # Stereo: arp ping-pong, pads wide via short delay.
    left = mix + 0.12 * np.roll(arp, int(0.011 * SR))
    right = mix + 0.12 * np.roll(pads, int(0.017 * SR))
    stereo = np.stack([left, right], axis=1)

    # Intro swell and outro fade.
    env = np.ones(n)
    fi, fo = int(1.5 * SR), int(2.5 * SR)
    env[:fi] = np.linspace(0, 1, fi) ** 2
    env[-fo:] = np.linspace(1, 0, fo) ** 1.5
    stereo *= env[:, None]
    return stereo / np.max(np.abs(stereo)) * 0.9


def sfx_pop():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 900 + 700 * np.exp(-t * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    return x * 0.6


def sfx_success():
    out = np.zeros(int(1.6 * SR))
    for i, note in enumerate([72, 76, 79, 84]):
        place(out, pluck(note, 1.2) * 0.45, i * 0.09)
    return out / np.max(np.abs(out)) * 0.7


def sfx_whoosh():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    env = np.sin(np.pi * t / t[-1]) ** 2
    x = np.random.default_rng(99).standard_normal(n)  # fixed seed: identical file every build
    lo = lowpass(x, 900)
    hi = highpass(x, 2500)
    mix = np.where(t < t[-1] / 2, lo, 0.6 * lo + 0.4 * hi)
    return mix * env * 0.5


def sfx_tick():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120) * 0.5


def main():
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--timeline", type=Path, default=TIMELINE)
    ap.add_argument("--out", type=Path, default=OUT / "music.wav")
    args = ap.parse_args()
    timeline = json.loads(args.timeline.read_text())
    seconds = timeline["totalFrames"] / timeline["fps"] + 0.5
    args.out.parent.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    sf.write(args.out, build_music(seconds, timeline["music"]["bpm"]), SR)
    sf.write(OUT / "sfx_pop.wav", sfx_pop(), SR)
    sf.write(OUT / "sfx_success.wav", sfx_success(), SR)
    sf.write(OUT / "sfx_whoosh.wav", sfx_whoosh(), SR)
    sf.write(OUT / "sfx_tick.wav", sfx_tick(), SR)
    print(f"music: {seconds:.2f}s @ {timeline['music']['bpm']} bpm -> {args.out}")


if __name__ == "__main__":
    main()
