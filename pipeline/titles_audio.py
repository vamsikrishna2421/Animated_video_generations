"""Soundtrack + voice for the 15 s cinematic title sequence. Every sound is synthesised:
sub drone, reversed swell, fragment hits, riser, pre-impact silence, braam impact,
sparse piano, final hit, all through a synthetic convolution reverb.
The trailer VO comes from Kokoro.

Outputs:
  video/public/audio/titles_score.wav
  video/public/audio/titles_vo_<n>.wav
  video/src/titles_timeline.json
"""
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SPEC = json.loads((ROOT / "script" / "titles.json").read_text())
OUT = ROOT / "video" / "public" / "audio"
TIMELINE = ROOT / "video" / "src" / "titles_timeline.json"
SR = 48000
rng = np.random.default_rng(11)


def filt(x, hz, kind="low", order=2):
    return sosfilt(butter(order, hz, btype=kind, fs=SR, output="sos"), x)


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def place(buf, clip, at, gain=1.0):
    s = int(at * SR)
    e = min(s + len(clip), len(buf))
    if s < len(buf):
        buf[s:e] += clip[: e - s] * gain


def reverb_ir(seconds=3.2, decay=1.1, seed=0):
    r = np.random.default_rng(seed)
    t = t_(seconds)
    ir = r.standard_normal(t.size) * np.exp(-t / decay * 3)
    ir = filt(ir, 6000)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir**2))


IR_L, IR_R = reverb_ir(seed=1), reverb_ir(seed=2)


def reverb(x, wet=0.35):
    return np.stack([
        x * (1 - wet) + fftconvolve(x, IR_L)[: x.size] * wet,
        x * (1 - wet) + fftconvolve(x, IR_R)[: x.size] * wet,
    ], axis=1)


def drone(total, impact):
    t = t_(total)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t)
    x = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in [(hz(26), 1, 0), (hz(33), 0.6, 1), (hz(38), 0.35, 2)])
    air = filt(filt(rng.standard_normal(t.size), 180, "high"), 900) * 0.25
    env = np.interp(t, [0, 2, impact - 0.3, impact - 0.25, impact, impact + 0.6, total - 1.2, total],
                    [0, 0.6, 1.0, 0.0, 0.0, 0.55, 0.45, 0])
    return (x * lfo + air) * env * 0.35


def reverse_swell(sec=1.6):
    burst = filt(rng.standard_normal(int(0.05 * SR)), 3000)
    tail = fftconvolve(burst, reverb_ir(sec, 0.9, 5))[: int(sec * SR)]
    return tail[::-1] / np.max(np.abs(tail)) * 0.5


def hit(strength=1.0):
    t = t_(0.5)
    body = np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-t * 35)) / SR) * np.exp(-t * 10)
    click = filt(rng.standard_normal(t.size), 2500, "high") * np.exp(-t * 90) * 0.4
    return (body + click) * strength


def riser(sec):
    t = t_(sec)
    p = t / sec
    sweep = filt(rng.standard_normal(t.size), 1500, "high") * p**2 * 0.25
    f = 180 * (8 ** p)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * p**3 * 0.25
    tone += np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * p**3 * 0.12
    return sweep + tone


def braam(sec=4.0):
    t = t_(sec)
    x = np.zeros(t.size)
    for m in (26, 33, 38, 41, 45):  # D1 A1 D2 F2 A2: dark D minor
        for d in (-0.003, 0, 0.004):
            ph = hz(m) * (1 + d) * t + rng.random()
            x += 2 * (ph % 1) - 1
    x /= 15
    cutoff_env = np.exp(-t * 1.6)
    lo = filt(x, 180) * (1 - cutoff_env) + filt(x, 1400) * cutoff_env  # brassy bite that closes
    amp = np.minimum(t / 0.02, 1) * np.exp(-t * 0.9)
    sub = np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.1)
    noise = filt(rng.standard_normal(t.size), 800) * np.exp(-t * 7) * 0.6
    return lo * amp * 1.2 + sub * 0.9 + noise


def piano(m, sec=3.0):
    t = t_(sec)
    f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.8 + k)) for k, a in [(1, 1), (2, 0.4), (3, 0.15), (4, 0.08)])
    return x * np.minimum(t / 0.004, 1)


def build_score():
    total, impact = SPEC["seconds"], SPEC["impact"]
    n = int(total * SR)
    dry = np.zeros(n)
    place(dry, drone(total, impact), 0)
    place(dry, reverse_swell(1.6), 0.4)
    for i, (at, _) in enumerate(SPEC["fragments"]):
        place(dry, hit(0.5 + 0.5 * i / len(SPEC["fragments"])), at, 0.6)
    place(dry, riser(impact - 0.25 - 5.4), 5.4)
    place(dry, braam(), impact, 1.0)
    for at, m in [(9.6, 74), (10.35, 69), (11.1, 77), (12.2, 76), (13.0, 74)]:
        place(dry, piano(m), at, 0.22)
    place(dry, braam(3.0) * 0.45, 14.0)
    out = reverb(dry, wet=0.3)
    out = np.tanh(out * 1.4) / np.tanh(1.4)
    fade = np.ones(n)
    fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR))
    out *= fade[:, None]
    return out / np.max(np.abs(out)) * 0.95


def build_vo():
    kokoro = Kokoro(str(ROOT / "models" / "kokoro-v1.0.onnx"), str(ROOT / "models" / "voices-v1.0.bin"))
    clips = []
    for i, line in enumerate(SPEC["vo"]):
        s, sr = kokoro.create(line["text"], voice=SPEC["voice"], speed=SPEC["speed"], lang=SPEC["lang"])
        idx = np.where(np.abs(s) > 0.01)[0]
        s = s[idx[0]: idx[-1] + int(0.1 * sr)]
        s = s * (10 ** (-15 / 20) / np.sqrt(np.mean(s**2)))
        s = np.tanh(s * 1.1) / np.tanh(1.1)
        # Resample to the score's rate and add a touch of the same room.
        s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
        s = np.concatenate([s, np.zeros(int(1.2 * SR))])
        wet = reverb(s, wet=0.18)
        name = f"titles_vo_{i + 1}.wav"
        sf.write(OUT / name, wet, SR)
        dur = (len(s) / SR) - 1.2
        clips.append({"audio": f"audio/{name}", "at": line["at"], "text": line["text"], "seconds": round(dur, 2)})
        print(f"vo {i + 1}: {line['at']:5.2f}s +{dur:.2f}s  {line['text']}")
    for a, b in zip(clips, clips[1:]):
        assert a["at"] + a["seconds"] <= b["at"], f"VO overlap: {a['text']!r} runs into {b['text']!r}"
    assert clips[-1]["at"] + clips[-1]["seconds"] <= SPEC["seconds"] - 0.5, "last VO line too long"
    return clips


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    vo = build_vo()
    sf.write(OUT / "titles_score.wav", build_score(), SR)
    fps = SPEC["fps"]
    TIMELINE.write_text(json.dumps({
        "fps": fps,
        "totalFrames": SPEC["seconds"] * fps,
        "impact": SPEC["impact"],
        "fragments": SPEC["fragments"],
        "vo": vo,
        "score": "audio/titles_score.wav",
    }, indent=2, ensure_ascii=False))
    print("score + timeline written")


if __name__ == "__main__":
    main()
