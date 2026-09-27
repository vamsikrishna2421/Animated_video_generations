"""Channel promo for Instagram Stories (saved highlight): voice-over + trailer soundtrack + timeline.

Writes video/public/story/{vo_*.wav, score.wav} and video/src/story/story_timeline.json.
Run: python3 pipeline/story_promo.py
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from lesson_voice import PRON, lexicon_for, to_phonemes  # noqa: E402
from music import SR, highpass, lowpass, pluck, place, hat, kick  # noqa: E402

OUT = ROOT / "video" / "public" / "story"
TL = ROOT / "video" / "src" / "story" / "story_timeline.json"
FPS, VOICE, SPEED = 30, "af_heart", 1.0

# Beat id, voice line, minimum on-screen seconds.
BEATS = [
    ("fast", "AI changes, every single day.", 3.2),
    ("flood", "New models. New tools. New words, every week.", 3.8),
    ("lost", "Feeling left behind?", 2.6),
    ("reveal", "Meet AI Maastaaru.", 3.4),
    ("pillars", "Learn AI from scratch. See how real apps use it. And stay up to date with the latest in AI.", 7.4),
    ("cta", "Follow AI Maastaaru. Your one place for AI.", 5.2),
]


def voice_lines():
    kokoro = Kokoro(str(ROOT / "models" / "kokoro-v1.0.onnx"), str(ROOT / "models" / "voices-v1.0.bin"))
    lex = lexicon_for(VOICE, PRON)
    clips = []
    for bid, text, _ in BEATS:
        ph = to_phonemes(kokoro, text, "en-us", lex)
        a, sr = kokoro.create(ph, voice=VOICE, speed=SPEED, lang="en-us", is_phonemes=True)
        idx = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
        a = a / (np.sqrt(np.mean(a ** 2)) + 1e-9) * 10 ** (-15 / 20)
        a = np.tanh(a * 1.2) / np.tanh(1.2)
        sf.write(OUT / f"vo_{bid}.wav", a.astype(np.float32), sr)
        clips.append((bid, text, len(a) / sr))
    return clips


# ---- soundtrack pieces -------------------------------------------------------
def boom(seconds=2.2):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = 38 + 90 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    noise = highpass(np.random.default_rng(3).standard_normal(n), 3000) * np.exp(-t * 5) * 0.25
    return (sub + noise) * 0.9


def riser(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    x = np.random.default_rng(5).standard_normal(n)
    x = highpass(x, 1200) * (t / t[-1]) ** 2.5
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * (t / t[-1]) ** 2) / SR) * (t / t[-1]) ** 3 * 0.35
    return (x * 0.35 + tone)


def glitch():
    n = int(0.12 * SR)
    x = np.random.default_rng(11).standard_normal(n)
    x = np.sign(x) * (np.abs(x) > 0.7) * np.exp(-np.arange(n) / SR * 30)
    return highpass(x, 1500) * 0.35


def bass_pulse(note, seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = 440 * 2 ** ((note - 69) / 12)
    x = 2 * ((t * f) % 1) - 1
    return lowpass(x, 500) * np.exp(-t * 7) * 0.6


def score(starts, total):
    n = int(total * SR)
    mix = np.zeros(n)
    bpm = 120
    beat = 60 / bpm
    s = dict(starts)
    # fast + flood: tension pulse, 8th-note bass, ticking hats, glitch hits
    for k in range(int((s["lost"]) / (beat / 2))):
        t0 = k * beat / 2
        place(mix, bass_pulse(33 if (k // 8) % 2 == 0 else 36, beat / 2), t0)
        if t0 >= s["flood"]:
            place(mix, hat() * 0.7, t0 + beat / 4)
        if k % 2 == 0:
            place(mix, kick() * (0.5 if t0 < s["flood"] else 0.8), t0)
    for g in np.arange(s["flood"], s["lost"], beat / 1.5):
        place(mix, glitch(), g)
    # lost: drop out, then riser into the reveal
    rise = s["reveal"] - s["lost"]
    place(mix, riser(rise) * 0.9, s["lost"])
    # reveal: impact + shimmer chord
    place(mix, boom() * 1.1, s["reveal"])
    for i, note in enumerate([65, 69, 72, 76, 81]):
        place(mix, pluck(note, 2.5) * 0.25, s["reveal"] + 0.05 * i)
    # pillars + cta: full groove, four on the floor, arpeggio
    prog = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]]
    t0 = s["reveal"] + beat * 2
    b = 0
    while t0 < total - 1.2:
        chord = prog[(b // 8) % 4]
        place(mix, kick() * 0.9, t0)
        place(mix, hat() * 0.8, t0 + beat / 2)
        place(mix, bass_pulse(chord[0] - 12, beat * 0.9) * 0.9, t0)
        place(mix, pluck(chord[b % 4] + 12, 0.35) * 0.22, t0)
        place(mix, pluck(chord[(b + 2) % 4] + 12, 0.35) * 0.18, t0 + beat / 2)
        t0 += beat
        b += 1
    place(mix, boom() * 0.8, s["cta"])
    place(mix, boom(2.8) * 0.9, total - 2.0)
    for i, note in enumerate([57, 64, 69, 73, 76]):
        place(mix, pluck(note, 2.2) * 0.25, total - 2.0 + 0.04 * i)
    left = mix + 0.1 * np.roll(mix, int(0.012 * SR))
    right = mix + 0.1 * np.roll(mix, int(0.019 * SR))
    st = np.stack([left, right], axis=1)
    fo = int(0.8 * SR)
    st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return st / np.max(np.abs(st)) * 0.9


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    TL.parent.mkdir(parents=True, exist_ok=True)
    clips = voice_lines()
    beats, t = [], 0.0
    for (bid, text, dur), (_, _, mn) in zip(clips, BEATS):
        length = max(mn, dur + 0.9)
        beats.append({"id": bid, "text": text, "from": round(t * FPS), "frames": round(length * FPS),
                      "voiceFrom": round((t + 0.2) * FPS), "voiceFrames": round(dur * FPS), "audio": f"story/vo_{bid}.wav"})
        t += length
    total = t
    sf.write(OUT / "score.wav", score([(b["id"], b["from"] / FPS) for b in beats], total).astype(np.float32), SR)
    TL.write_text(json.dumps({"fps": FPS, "totalFrames": round(total * FPS), "music": "story/score.wav", "beats": beats}, indent=1) + "\n")
    print(f"total {total:.1f}s", [(b["id"], round(b["frames"] / FPS, 1)) for b in beats])


if __name__ == "__main__":
    main()
