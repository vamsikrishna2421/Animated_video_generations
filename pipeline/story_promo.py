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


def kick808(freq=48.0, seconds=0.9, drive=2.5):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = freq + 170 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (3.2 / seconds))
    click = highpass(np.random.default_rng(1).standard_normal(n), 2000) * np.exp(-t * 400) * 0.4
    return np.tanh((x + click) * drive) / np.tanh(drive)


def clap(seconds=0.35):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    noise = np.random.default_rng(21).standard_normal(n)
    body = highpass(lowpass(noise, 6000), 900)
    env = np.zeros(n)
    for d in (0.0, 0.011, 0.022):  # three hand-claps smeared together
        k = int(d * SR)
        env[k:] += np.exp(-(t[: n - k]) * 38)
    tail = np.exp(-t * 11) * 0.45
    snare_tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.6
    x = body * np.maximum(env, tail) + snare_tone
    return np.tanh(x * 1.8) * 0.9


def hat_tick(seconds=0.06, open_=False):
    n = int((0.22 if open_ else seconds) * SR)
    t = np.arange(n) / SR
    x = highpass(np.random.default_rng(31).standard_normal(n), 7000)
    return x * np.exp(-t * (14 if open_ else 70)) * 0.35


def bass808(note, seconds, glide_from=None):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f1 = 440 * 2 ** ((note - 69) / 12)
    f = f1 if glide_from is None else f1 + (440 * 2 ** ((glide_from - 69) / 12) - f1) * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR)
    env = np.minimum(1, t / 0.005) * np.exp(-t * 1.6)
    return np.tanh(x * env * 2.2) * 0.8


def keys(note, seconds):
    """Dark detuned bell-piano for the loop."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = 440 * 2 ** ((note - 69) / 12)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.003 * t) * np.exp(-t * 4) + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 7)
    return lowpass(x * np.exp(-t * 2.4) * np.minimum(1, t / 0.004), 3200) * 0.22


def scratch(seconds=0.35):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rate = 1 + 0.9 * np.sin(2 * np.pi * t / seconds * 2)
    x = np.random.default_rng(41).standard_normal(n)
    x = lowpass(x, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(300 * rate) / SR))
    return highpass(x, 400) * np.sin(np.pi * t / seconds) * 0.5


def tape_stop(clip, seconds):
    """Pitch/speed down to a stop, like a record being halted."""
    n = int(seconds * SR)
    speed = np.linspace(1, 0.05, n) ** 1.5
    pos = np.cumsum(speed)
    pos = pos[pos < len(clip) - 1]
    return np.interp(pos, np.arange(len(clip)), clip) * np.linspace(1, 0, len(pos))


def score(starts, total):
    n = int(total * SR)
    drums, bass, music = np.zeros(n), np.zeros(n), np.zeros(n)
    s = dict(starts)
    bpm = 94
    beat = 60 / bpm
    step = beat / 4
    # A minor: Am - F - G - Em, two beats... one bar per chord
    roots = [45, 41, 43, 40]
    chords = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]
    kick_pat = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0]  # boom . . boom-boom (bap on 2 and 4)
    kicks = []

    def bar_at(t0, b, full=True, hats=True):
        ch = chords[b % 4]
        for i in range(16):
            ts = t0 + i * step
            if kick_pat[i] and full:
                place(drums, kick808() * 0.95, ts)
                kicks.append(ts)
            if i in (4, 12) and full:
                place(drums, clap(), ts)
            if hats:
                roll = (b % 2 == 1 and i >= 12)
                if roll:  # trap roll: 32nd notes
                    for r in range(2):
                        place(drums, hat_tick() * (0.6 + 0.2 * r), ts + r * step / 2)
                else:
                    place(drums, hat_tick(open_=(i == 14)) * (0.9 if i % 2 == 0 else 0.55), ts)
        if full:
            place(bass, bass808(roots[b % 4] - 12, beat * 3.6, glide_from=roots[(b - 1) % 4] - 12 if b else None), t0)
        for k, note in enumerate([ch[0], ch[1], ch[2], ch[1], ch[0] + 12, ch[2], ch[1], ch[2]]):
            place(music, keys(note, beat), t0 + k * beat / 2)

    # Intro (fast): filtered keys + hats only, kick hits on the first word slams.
    t0, b = 0.0, 0
    while t0 < s["flood"] - 0.01:
        bar_at(t0, b, full=False, hats=True)
        t0 += beat * 4
        b += 1
    place(drums, kick808(40, 1.4, 3.5) * 1.0, 0.0)
    place(drums, scratch(), s["flood"] - 0.4)
    # Flood: full bashing beat.
    t0 = s["flood"]
    while t0 < s["lost"] - 0.01:
        bar_at(t0, b)
        t0 += beat * 4
        b += 1
    # Lost: tape-stop the beat, silence, riser.
    seg = np.array(drums[int((s["lost"] - beat * 2) * SR): int(s["lost"] * SR)] + music[int((s["lost"] - beat * 2) * SR): int(s["lost"] * SR)])
    ts_clip = tape_stop(np.concatenate([seg, seg]), 1.0)
    for arr in (drums, bass, music):
        arr[int(s["lost"] * SR): int(s["reveal"] * SR)] = 0
    place(music, ts_clip * 0.9, s["lost"])
    place(music, riser(s["reveal"] - s["lost"] - 0.3) * 0.6, s["lost"] + 0.3)
    # Reveal: huge 808 + clap stack, then the beat drops back in.
    place(drums, kick808(36, 2.0, 4.0) * 1.1, s["reveal"])
    place(drums, clap() * 1.2, s["reveal"])
    place(drums, boom() * 0.6, s["reveal"])
    t0 = s["reveal"] + beat * 2
    while t0 < total - 1.5:
        bar_at(t0, b)
        t0 += beat * 4
        b += 1
    place(drums, scratch(), s["cta"] - 0.35)
    # Ending stop hit.
    end = total - 1.6
    for arr in (drums, bass, music):
        arr[int(end * SR):] = 0
    place(drums, kick808(36, 1.5, 4.0), end)
    place(drums, clap() * 1.1, end)
    for note in (57, 64, 69):
        place(music, keys(note, 1.5) * 1.5, end)

    # Sidechain the keys to the kick for pump.
    t = np.arange(n) / SR
    duck = np.ones(n)
    for k in kicks:
        i0 = int(k * SR)
        m = min(n - i0, int(0.25 * SR))
        duck[i0: i0 + m] = np.minimum(duck[i0: i0 + m], 1 - 0.55 * np.exp(-t[:m] * 14))
    music *= duck
    mix = 1.0 * drums + 0.8 * bass + 0.9 * music
    left = mix + 0.08 * np.roll(music, int(0.013 * SR))
    right = mix + 0.08 * np.roll(music, int(0.021 * SR))
    st = np.stack([left, right], axis=1)
    st = np.tanh(st / np.max(np.abs(st)) * 1.6) / np.tanh(1.6)  # glue + loudness
    fo = int(0.5 * SR)
    st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return st * 0.95


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
