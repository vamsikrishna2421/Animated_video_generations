"""Build audio + timeline for a v2 'entertainment' reel: multiple speakers, memes, karaoke captions.

Spec (reels/<id>.json):
  {"id": "ep23v2", "title": ..., "scenes": [{"id", "type", "data", "lines": [{"who", "text"}]}]}
Speakers: maastaaru (host), chintu (funny student), commentator (cricket radio), trailer (movie voice),
filmy (Hindi mass-hero dialogue; add "sub" with the English subtitle).
Text supports [n] cue markers and <pause N>.

Writes video/public/reel/<id>/line_XX.wav, score.wav and video/src/reel/timelines/<id>.json.
Run: python3 pipeline/reel_build.py reels/ep23v2.json
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from lesson_voice import MARK, PAUSE, PRON, display, sentences, synth_flow  # noqa: E402
from music import SR as MSR, place  # noqa: E402
from story_promo import bass808, boom, clap, hat_tick, keys, kick808, riser, scratch  # noqa: E402

FPS = 30
SPEAKERS = {
    "maastaaru": dict(voice="af_heart", speed=1.0, lang="en-us", name="Maastaaru", color="#F59E0B"),
    "chintu": dict(voice="hm_psi", speed=1.08, lang="en-us", name="Chintu", color="#22D3EE"),
    "commentator": dict(voice="bm_george", speed=1.1, lang="en-gb", name="Commentary", color="#34D399", fx="radio"),
    "trailer": dict(voice="am_onyx", speed=0.9, lang="en-us", name="", color="#F43F5E", fx="trailer"),
    "filmy": dict(voice="hm_omega", speed=0.95, lang="hi", name="Filmy mode", color="#F43F5E", fx="trailer"),
}
GAP = 0.12  # fast, reel-style pacing between lines


def bandpass(x, lo, hi, sr):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=sr, output="sos"), x)


def fx(a, sr, kind):
    if kind == "radio":  # cricket radio commentary
        a = bandpass(a, 350, 3600, sr) * 1.6
        return np.tanh(a * 2.2) / np.tanh(2.2) * 0.8
    if kind == "trailer":  # deep, big-room movie voice
        low = sosfilt(butter(2, 180, btype="low", fs=sr, output="sos"), a)
        a = a + 0.6 * low
        ir = np.random.default_rng(2).standard_normal(int(0.9 * sr)) * np.exp(-np.arange(int(0.9 * sr)) / sr * 5)
        wet = np.convolve(a, ir)[: len(a) + int(0.5 * sr)] * 0.018
        a = np.concatenate([a, np.zeros(len(wet) - len(a))]) + wet
        return a / (np.max(np.abs(a)) + 1e-9) * 0.9
    return a


def synth_line(kokoro, line, sp):
    """Returns (audio, words[(w, s, e)], cues{n: s})."""
    text = line["text"]
    if sp["lang"] == "hi":  # no timed phonemes for Hindi: spread the subtitle words evenly
        a, sr = kokoro.create(MARK.sub("", text), voice=sp["voice"], speed=sp["speed"], lang="hi")
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - int(0.05 * sr)): nz[-1] + int(0.1 * sr)]
        a = a * (10 ** (-15 / 20) / (np.sqrt(np.mean(a ** 2)) + 1e-9))
        shown = line.get("show", text).split()
        d = len(a) / sr
        words = [(w, d * i / len(shown), d * (i + 1) / len(shown)) for i, w in enumerate(shown)]
        return a, sr, words, {}
    chunks, words, cues, t, sr = [], [], {}, 0.0, 24000
    for part in re.split(r"(<pause [\d.]+>)", text):
        if not part.strip():
            continue
        if PAUSE.fullmatch(part.strip()):
            sec = float(re.findall(r"[\d.]+", part)[0])
            chunks.append(np.zeros(int(sec * sr)))
            t += sec
            continue
        sents = sentences(part)
        a, sr, per = synth_flow(kokoro, sents, sp["voice"], sp["speed"], sp["lang"], PRON)
        for clean, ws, cm in per:
            for w, (s, e) in zip(display(clean).split(" "), ws):
                words.append((w, t + s, t + e))
            for k, v in cm.items():
                cues[k] = t + v
        chunks.append(a)
        t += len(a) / sr
    return np.concatenate(chunks), sr, words, cues


def score(total, scene_starts, drops):
    """Hip-hop bed: bars of 808 + clap + hats + dark keys; silent 'drops' for dramatic moments."""
    n = int(total * MSR)
    drums, bass, music = np.zeros(n), np.zeros(n), np.zeros(n)
    bpm, beat = 96, 60 / 96
    step = beat / 4
    roots = [45, 41, 43, 40]
    chords = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]
    pat = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    t0, b = 0.0, 0
    while t0 < total:
        ch = chords[b % 4]
        for i in range(16):
            ts = t0 + i * step
            if pat[i]:
                place(drums, kick808() * 0.9, ts)
            if i in (4, 12):
                place(drums, clap() * 0.8, ts)
            roll = b % 4 == 3 and i >= 12
            for r in range(2 if roll else 1):
                place(drums, hat_tick(open_=(i == 14 and not roll)) * (0.8 if i % 2 == 0 else 0.5), ts + r * step / 2)
        place(bass, bass808(roots[b % 4] - 12, beat * 3.6), t0)
        for k, note in enumerate([ch[0], ch[1], ch[2], ch[1], ch[0] + 12, ch[2], ch[1], ch[2]]):
            place(music, keys(note, beat), t0 + k * beat / 2)
        t0 += beat * 4
        b += 1
    mix = drums + 0.8 * bass + 0.8 * music
    for a, e in drops:  # dramatic silence, then a big hit
        mix[int(a * MSR): int(e * MSR)] *= 0.05
        place(mix, riser(max(0.3, e - a)) * 0.5, a)
        place(mix, kick808(36, 1.6, 4) + boom(1.6) * 0.6, e)
    for s in scene_starts[1:]:
        place(mix, scratch() * 0.5, max(0, s - 0.3))
    st = np.stack([mix, np.roll(mix, int(0.015 * MSR))], axis=1)
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.5) / np.tanh(1.5)
    fo = int(0.6 * MSR)
    st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return st * 0.9


def main(spec_path: Path) -> None:
    spec = json.loads(spec_path.read_text())
    rid = spec["id"]
    out = ROOT / "video" / "public" / "reel" / rid
    out.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(ROOT / "models" / "kokoro-v1.0-timed.onnx"), str(ROOT / "models" / "voices-v1.0.bin"))
    t, n, scenes = 0.25, 0, []
    for si, sc in enumerate(spec["scenes"]):
        s_from = 0.0 if si == 0 else t  # first scene is on screen from frame 0
        lines = []
        for line in sc["lines"]:
            sp = SPEAKERS[line["who"]]
            a, sr, words, cues = synth_line(kokoro, line, sp)
            a = fx(a, sr, sp.get("fx"))
            n += 1
            sf.write(out / f"line_{n:02d}.wav", a.astype(np.float32), sr)
            dur = len(a) / sr
            lines.append({
                "who": line["who"], "name": sp["name"], "color": sp["color"], "sub": line.get("sub"),
                "audio": f"reel/{rid}/line_{n:02d}.wav", "from": round((t - s_from) * FPS), "frames": round(dur * FPS),
                "words": [{"w": w, "from": round((t - s_from + s) * FPS), "to": round((t - s_from + e) * FPS)} for w, s, e in words],
                "cues": {str(k): round((t - s_from + v) * FPS) for k, v in cues.items()},
            })
            t += dur + line.get("gap", GAP)
        t += sc.get("tail", 0.25)
        scenes.append({"id": sc["id"], "type": sc["type"], "data": sc.get("data", {}), "from": round(s_from * FPS),
                       "frames": round((t - s_from) * FPS), "lines": lines})
    total = t + 0.4
    drops = [(scenes[i]["from"] / FPS - 1.2, scenes[i]["from"] / FPS) for i, sc in enumerate(spec["scenes"]) if sc.get("drop")]
    sf.write(out.parent / "sfx_boom.wav", (boom(1.4) * 0.9).astype(np.float32), MSR)
    sf.write(out / "score.wav", score(total, [s["from"] / FPS for s in scenes], drops).astype(np.float32), MSR)
    tl = {"id": rid, "title": spec["title"], "handle": "@ai_maastaaru", "label": spec.get("label", ""), "fps": FPS,
          "totalFrames": round(total * FPS), "music": f"reel/{rid}/score.wav", "scenes": scenes}
    tdir = ROOT / "video" / "src" / "reel" / "timelines"
    tdir.mkdir(parents=True, exist_ok=True)
    (tdir / f"{rid}.json").write_text(json.dumps(tl, indent=1, ensure_ascii=False) + "\n")
    ids = sorted(p.stem for p in tdir.glob("*.json"))
    (tdir / "index.ts").write_text("".join(f'import t{i} from "./{x}.json";\n' for i, x in enumerate(ids)) +
                                   "export const reels = [" + ", ".join(f"t{i}" for i in range(len(ids))) + "];\n")
    print(f"{rid}: {total:.1f}s, {n} lines")
    for s in scenes:
        print(f"  {s['id']:>10} {s['frames'] / FPS:5.1f}s", [l["who"] for l in s["lines"]])


if __name__ == "__main__":
    main(Path(sys.argv[1]))
