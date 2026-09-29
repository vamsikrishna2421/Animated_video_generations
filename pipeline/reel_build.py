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
import os
import subprocess
import tempfile
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
    "maastaaru": dict(voice="af_heart", speed=1.0, lang="en-us", name="Teacher", color="#F59E0B"),
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


VOICES_FILE = ROOT / "reels" / "voices.json"


def eleven_line(line, who):
    """ElevenLabs take for one line. Uses line['el'] (text with audio tags like [excited]) when present.
    Cue markers [n] land on the word they precede; <pause N> inserts exact silence."""
    from eleven import tts
    cfg = json.loads(VOICES_FILE.read_text())[who]
    raw = line.get("el", line["text"])
    chunks, words, cues, t, sr = [], [], {}, 0.0, 44100
    for part in re.split(r"(<pause [\d.]+>)", raw):
        if not part.strip():
            continue
        if PAUSE.fullmatch(part.strip()):
            sec = float(re.findall(r"[\d.]+", part)[0])
            chunks.append(np.zeros(int(sec * sr), dtype=np.float32))
            t += sec
            continue
        marks, n_words = {}, 0
        for tok in part.split():
            m = re.fullmatch(r"\[(\d+)\]", tok)
            if m:
                marks[n_words] = int(m.group(1))
            elif not re.fullmatch(r"\[[^\]]*\]", tok):
                n_words += 1
        text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]", "", part)).strip()
        a, sr, ws = tts(text, cfg["voice_id"], cfg.get("model", "eleven_v3"), cfg.get("settings"), cfg.get("language"))
        nz = np.where(np.abs(a) > 0.01)[0]
        if nz.size:  # trim the model's leading/trailing air
            cut = max(0, nz[0] - int(0.04 * sr))
            a = a[cut: nz[-1] + int(0.12 * sr)]
            ws = [(w, s - cut / sr, e - cut / sr) for w, s, e in ws]
        for i, n in marks.items():
            if ws:
                cues[n] = t + ws[min(i, len(ws) - 1)][1]
        words += [(w, t + s, t + e) for w, s, e in ws]
        chunks.append(a)
        t += len(a) / sr
    a = np.concatenate(chunks)
    if "show" in line:  # e.g. Hindi audio with transliterated captions spread over the take
        shown, d = line["show"].split(), len(a) / sr
        words = [(w, d * i / len(shown), d * (i + 1) / len(shown)) for i, w in enumerate(shown)]
    a = a * (10 ** (-15 / 20) / (np.sqrt(np.mean(a ** 2)) + 1e-9))
    return a, sr, words, cues


def voiced_spans(a, sr, gap=0.12):
    """Speech regions [(start_s, end_s)] from a 10 ms energy envelope."""
    fr = int(0.01 * sr)
    env = np.array([np.sqrt(np.mean(a[i:i + fr] ** 2)) for i in range(0, len(a) - fr, fr)])
    on = env > max(0.02, 0.12 * env.max())
    spans, start, quiet = [], None, 0
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * 0.01 >= gap:
                spans.append((start * 0.01, (i - quiet + 1) * 0.01))
                start, quiet = None, 0
    if start is not None:
        spans.append((start * 0.01, len(on) * 0.01))
    return spans


def tighten(a, sr, maxgap):
    """Shorten long silences inside a take to `maxgap` seconds (20 ms crossfade), keeping reel pace."""
    spans = voiced_spans(a, sr)
    if len(spans) < 2:
        return a
    out, prev_end, fade = [], 0, int(0.02 * sr)
    for i, (s0, e0) in enumerate(spans):
        s_i, e_i = int(s0 * sr), int(e0 * sr)
        if i == 0:
            out.append(a[:e_i])
        else:
            gap = s_i - prev_end
            keep = min(gap, int(maxgap * sr))
            half = keep // 2
            seg = np.concatenate([a[prev_end: prev_end + half], a[s_i - (keep - half): e_i]])
            if out and len(seg) > fade:
                seg[:fade] *= np.linspace(0, 1, fade)
            out.append(seg)
        prev_end = e_i
    out.append(a[prev_end:])
    return np.concatenate(out)


TEMPO = 1.0  # spec-level "tempo" overrides; >1 = faster delivery, pitch kept


def stretch(a, sr, tempo):
    """Pitch-preserving speed change (ffmpeg atempo) to remove drag from slow takes."""
    if abs(tempo - 1) < 1e-3:
        return a
    ff = ROOT / "video" / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
    env = {**os.environ, "LD_LIBRARY_PATH": str(ff.parent)}
    with tempfile.TemporaryDirectory() as d:
        i, o = Path(d) / "i.wav", Path(d) / "o.wav"
        sf.write(i, a.astype(np.float32), sr)
        subprocess.run([str(ff), "-y", "-loglevel", "error", "-i", str(i), "-filter:a", f"atempo={tempo}", str(o)], check=True, env=env)
        b, _ = sf.read(o)
    return b.mean(axis=1) if b.ndim > 1 else b


def file_line(line, rid):
    """Pre-generated take(s) (e.g. ElevenLabs via the connector). Words are spread over the voiced
    audio by character length, so captions follow the real delivery, pauses included."""
    src = ROOT / "video" / "public" / "reel" / rid / "src"
    parts = [line["file"]] + ([line["file2"]] if line.get("file2") else [])
    audio, sr = [], None
    for k, f in enumerate(parts):
        a, sr = sf.read(src / f)
        a = a.mean(axis=1) if a.ndim > 1 else a
        if k == 0 and line.get("start"):  # drop an unwanted opening word (e.g. a name) from the take
            a = a[int(line["start"] * sr):]
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.1 * sr)]
        a = tighten(a, sr, line.get("maxgap", 0.3))
        a = stretch(a, sr, line.get("tempo", TEMPO))
        audio.append(a)
        if k == 0 and len(parts) > 1:
            audio.append(np.zeros(int(line.get("pause", 3.0) * sr)))
    a = np.concatenate(audio)
    a = a * (10 ** (-15 / 20) / (np.sqrt(np.mean(a ** 2)) + 1e-9))
    text = line["text"]
    toks = [t for t in re.sub(r"<pause [\d.]+>", " ", text).split()]
    marks, words = {}, []
    for t in toks:
        m = re.fullmatch(r"\[(\d+)\]", t)
        if m:
            marks[len(words)] = int(m.group(1))
        else:
            words.append(t)
    shown = line.get("show", " ".join(words)).split()
    spans = voiced_spans(a, sr)
    total = sum(e - s for s, e in spans) or len(a) / sr
    weights = [len(w) + 1 for w in shown]
    wsum = sum(weights)
    out, acc = [], 0.0

    def at(x):  # map a fraction of voiced time onto the real timeline
        need = x * total
        for s, e in spans:
            if need <= e - s:
                return s + need
            need -= e - s
        return spans[-1][1] if spans else x * len(a) / sr
    for w, wt in zip(shown, weights):
        s0 = at(acc / wsum)
        acc += wt
        out.append((w, s0, at(acc / wsum)))
    cues = {n: out[min(i, len(out) - 1)][1] for i, n in marks.items()} if out else {}
    return a, sr, out, cues


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


def lofi(total, scene_starts):
    """Calm lo-fi bed for 'decent' reels: soft kick + rim, mellow keys, no scratches or drops."""
    n = int(total * MSR)
    mix = np.zeros(n)
    beat = 60 / 88
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]]
    t0, b = 0.0, 0
    while t0 < total:
        for i in range(4):
            ts = t0 + i * beat
            if i in (0, 2):
                place(mix, kick808(45, 0.4, 1.5) * 0.45, ts)
            if i in (1, 3):
                place(mix, hat_tick() * 0.35, ts)
            place(mix, hat_tick() * 0.18, ts + beat / 2)
        for k, note in enumerate(chords[b % 4]):
            place(mix, keys(note, beat * 3.5) * 0.5, t0 + k * 0.03)
        place(mix, keys(chords[b % 4][3] + 12, beat) * 0.3, t0 + beat * 2.5)
        t0 += beat * 4
        b += 1
    st = np.stack([mix, np.roll(mix, int(0.02 * MSR))], axis=1)
    st = np.tanh(st / (np.max(np.abs(st)) + 1e-9) * 1.2) / np.tanh(1.2)
    fo = int(0.8 * MSR)
    st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return st * 0.8


def main(spec_path: Path) -> None:
    global TEMPO, GAP
    spec = json.loads(spec_path.read_text())
    TEMPO = spec.get("tempo", 1.0)
    GAP = spec.get("gap", GAP)
    rid = spec["id"]
    out = ROOT / "video" / "public" / "reel" / rid
    out.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(ROOT / "models" / "kokoro-v1.0-timed.onnx"), str(ROOT / "models" / "voices-v1.0.bin"))
    t, n, scenes = spec.get("lead", 0.25), 0, []
    for si, sc in enumerate(spec["scenes"]):
        s_from = 0.0 if si == 0 else t  # first scene is on screen from frame 0
        lines = []
        for line in sc["lines"]:
            sp = SPEAKERS[line["who"]]
            if "file" in line:
                a, sr, words, cues = file_line(line, rid)
            elif spec.get("engine") == "eleven":
                a, sr, words, cues = eleven_line(line, line["who"])
            else:
                a, sr, words, cues = synth_line(kokoro, line, sp)
            a = fx(a, sr, sp.get("fx"))
            a = np.tanh(a * (10 ** (-15 / 20) / (np.sqrt(np.mean(a ** 2)) + 1e-9)) * 1.2) / np.tanh(1.2)  # equal loudness after effects
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
    starts = [s["from"] / FPS for s in scenes]
    bed = lofi(total, starts) if spec.get("music") == "lofi" else score(total, starts, drops)
    sf.write(out / "score.wav", bed.astype(np.float32), MSR)
    tl = {"id": rid, "look": spec.get("look", "rays"), "topic": spec.get("topic", ""), "banner": spec.get("banner", ""), "musicVol": spec.get("musicVol", [0.22, 0.55]), "title": spec["title"], "handle": "@ai_maastaaru", "label": spec.get("label", ""), "fps": FPS,
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
