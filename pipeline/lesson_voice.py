"""Episode narration with Kokoro, synthesised sentence by sentence so that captions and
visual cues land on the words that trigger them.

Narration may contain cue markers like [1], [2]. A marker's time (in frames from scene
start) is exported as scene.cues[n-1]; scene components reveal items on those frames.

Usage: python3 pipeline/lesson_voice.py episodes/ep01.json
Outputs:
  video/public/lessons/<id>/voice_<n>.wav
  video/src/lesson/timelines/<id>.json   (+ regenerated timelines/index.ts)
"""
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
MARK = re.compile(r"\[(\d+)\]")
PAUSE = re.compile(r"<pause ([\d.]+)>")
LEAD_S, TAIL_S, GAP_S, LONG_GAP_S = 0.35, 0.55, 0.16, 0.32

# Pronunciation lexicon: word -> Kokoro phonemes (IPA). Episode JSON can add/override entries
# via a "pronunciations" object. Matching is case-sensitive on whole words.
PRON = {
    "Maastaaru": "mˈɑːsʈɑːɾu",   # Telugu మాస్టారు: retroflex ʈ, tapped ɾ, short final u
    "Namaste": "nəmˈʌsteː",
    "Hyderabad": "hˈaɪdəɹəbˌɑːd",
    # Spelled-out plural acronym: "el-el-emz", not "el-el-em-es".
    "L L Ms": "ˈɛl ˈɛl ˈɛmz",
    "LLMs": "ˌɛlˌɛlˈɛmz",
    "RLHF": "ˈɑːɹ ˈɛl ˈeɪtʃ ˈɛf",
    "pretrained": "pɹˌiːtɹˈeɪnd",
    "pretraining": "pɹˌiːtɹˈeɪnɪŋ",
    "LoRA": "lˈɔːɹə",
    "QLoRA": "kjˈuː lˈɔːɹə",
    "reranker": "ɹiːɹˈæŋkəɹ", "Reranker": "ɹiːɹˈæŋkəɹ", "rerank": "ɹiːɹˈæŋk", "reranking": "ɹiːɹˈæŋkɪŋ", "Reranking": "ɹiːɹˈæŋkɪŋ",
    "pgvector": "pˈiː dʒˈiː vˈɛktəɹ",
    "Qwen": "tʃwˈɛn",
    # Adjective "live" (on air / available) vs verb "live" (reside): fix the adjective by phrase.
    "is live": "ɪz lˈaɪv", "is already live": "ɪz ɔːlɹˈɛdi lˈaɪv", "now live": "nˈaʊ lˈaɪv",
}


def display(text: str) -> str:
    """Spoken spellings -> on-screen spellings."""
    return re.sub(r"\bA I\b", "AI", text)


# American/British voices can't do the retroflex ʈ (it becomes a 'd'), so they get a
# tapped-r version that still sounds like Maastaaru rather than 'Master-roo'.
PRON_EN_VOICES = {"Maastaaru": "mɑːstˈɑːɾuː"}


# Hindi voices voice a sentence-initial k ("quick quiz" -> "guig guiz"); aspirate these.
PRON_HINDI_VOICES = {"Quick": "kʰwˈɪk", "quick": "kʰwˈɪk", "quiz": "kʰwˈɪz", "Cost": "kʰˈɔːst", "cost": "kʰˈɔːst"}


def lexicon_for(voice: str, base: dict) -> dict:
    if voice.startswith(("af_", "am_", "bf_", "bm_")):
        return {**base, **PRON_EN_VOICES}
    if voice.startswith(("hf_", "hm_")):
        return {**PRON_HINDI_VOICES, **base}
    return base


def to_phonemes(kokoro, text: str, lang: str, lex: dict) -> str:
    """Phonemize text with espeak, but splice in lexicon phonemes for known words."""
    if not lex:
        return kokoro.tokenizer.phonemize(text, lang)
    pattern = re.compile(r"\b(" + "|".join(map(re.escape, sorted(lex, key=len, reverse=True))) + r")\b")
    out, pos = [], 0
    for m in pattern.finditer(text):
        before = text[pos: m.start()]
        if before.strip():
            out.append(kokoro.tokenizer.phonemize(before, lang).strip())
        out.append(lex[m.group(1)])
        pos = m.end()
    rest = text[pos:]
    if rest.strip():
        out.append(kokoro.tokenizer.phonemize(rest, lang).strip())
    # Punctuation belongs to the preceding word, with no space before it.
    return re.sub(r"\s+([!,.?;:])", r"\1", " ".join(out))


_VOWELS = "aeiouɑɐɔəɛɜɪʊʌæɚ"


def indian_english(ph: str) -> str:
    """Hindi-trained Kokoro voices produce unaspirated p/t, which English ears hear as b/d
    ('pause' -> 'bose'). Aspirate word-initial p/t before a vowel, as Hindi does for फ/थ-style
    aspirated stops. (k is left alone: aspirating it made 'code' sound like 'hold'.)"""
    full = _VOWELS.replace("ə", "").replace("ɐ", "").replace("ɚ", "")  # not before schwa: 'today'
    return re.sub(rf"(^|[\s,.!?])([pt])(?=[ˈˌ][{_VOWELS}]|[{full}]|[ɹlwj])", r"\1\2ʰ", ph)


def sentences(text: str):
    """Split on sentence ends, keeping cue markers attached to the text that follows them.
    `<pause N>` becomes its own item (N seconds of silence)."""
    out = []
    for piece in re.split(r"(<pause [\d.]+>)", text.strip()):
        if PAUSE.fullmatch(piece.strip()):
            out.append(piece.strip())
            continue
        parts = re.split(r"(?<=[.!?])\s+(?=\[\d+\]|\S)", piece.strip())
        out += [p for p in parts if MARK.sub("", p).strip()]
    return out


def phrases(words, max_words=5):
    """Break a sentence into short caption chunks, preferring punctuation boundaries."""
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or re.search(r"[,.!?;:]$", w) and len(cur) >= 2:
            out.append(cur)
            cur = []
    if cur:
        if out and len(cur) == 1:
            out[-1].extend(cur)
        else:
            out.append(cur)
    return out


def words_before(sent: str, pos: int) -> int:
    """How many words precede character `pos` of a sentence (markers ignored)."""
    return len(MARK.sub("", sent[:pos]).split())


def synth_flow(kokoro, sents: list[str], voice: str, speed: float, lang: str, lex: dict):
    """Synthesise several sentences as ONE continuous take, so intonation flows across
    them, and use the model's per-phoneme timings to place every word.

    Returns (audio, sr, per_sentence) where per_sentence[i] = (clean_text, word_spans, cue_map);
    word_spans are (start_s, end_s) per display word and cue_map maps cue id -> seconds."""
    cleans, phons = [], []
    lex = lexicon_for(voice, lex)
    for sent in sents:
        clean = re.sub(r"\s+", " ", MARK.sub("", sent)).strip()
        ph = to_phonemes(kokoro, clean, lang, lex)
        if voice.startswith(("hf_", "hm_")):
            ph = indian_english(ph)
        cleans.append(clean)
        phons.append(ph)
    full = " ".join(phons)
    audio, sr, spoken = kokoro.create_timed(
        full, voice, speed, lang, is_phonemes=True, continuous=True, sentence_pause=0.38, clause_pause=0.14
    )
    known = kokoro.tokenizer.known(full)
    if len(spoken) != len(known):
        raise RuntimeError("phoneme timings do not line up with the phoneme string")

    # Trim leading silence and shift timings to match.
    nz = np.where(np.abs(audio) > 0.008)[0]
    cut = max(int(nz[0] - 0.15 * sr), 0) if nz.size else 0  # generous pre-roll: soft onsets (sh, f, h) sit below the threshold
    audio = audio[cut: (nz[-1] + int(0.08 * sr)) if nz.size else None]
    shift = cut / sr
    starts = [t.start - shift for t in spoken]
    ends = [t.end - shift for t in spoken]

    per_sentence, offset = [], 0
    for sent, clean, ph in zip(sents, cleans, phons):
        k = kokoro.tokenizer.known(ph)
        # Phoneme "words" (space separated) with their index range in the full string.
        spans, i = [], 0
        for w in k.split(" "):
            if w:
                spans.append((offset + i, offset + i + len(w) - 1))
            i += len(w) + 1
        offset += len(k) + 1
        words = display(clean).split(" ")
        if len(spans) == len(words):
            ws = [(starts[a], ends[b]) for a, b in spans]
        else:  # number/abbreviation expanded differently: map proportionally by characters
            total = sum(len(w) + 1 for w in words)
            s0, s1 = starts[spans[0][0]], ends[spans[-1][1]]
            ws, acc = [], 0
            for w in words:
                a = s0 + (s1 - s0) * acc / total
                acc += len(w) + 1
                ws.append((a, s0 + (s1 - s0) * acc / total))
        cue_map = {int(m.group(1)): ws[min(words_before(sent, m.start()), len(ws) - 1)][0] for m in MARK.finditer(sent)}
        per_sentence.append((clean, ws, cue_map))

    audio = audio * (10 ** (-16 / 20) / (np.sqrt(np.mean(audio**2)) + 1e-9))
    audio = np.tanh(audio * 1.1) / np.tanh(1.1)
    return audio, sr, per_sentence


def main(spec_path: Path) -> None:
    spec = json.loads(spec_path.read_text())
    ep, fps = spec["id"], spec["fps"]
    audio_dir = ROOT / "video" / "public" / "lessons" / ep
    tl_dir = ROOT / "video" / "src" / "lesson" / "timelines"
    audio_dir.mkdir(parents=True, exist_ok=True)
    tl_dir.mkdir(parents=True, exist_ok=True)
    flow = spec.get("flow") == "continuous"
    model = ROOT / "models" / ("kokoro-v1.0-timed.onnx" if flow else "kokoro-v1.0.onnx")
    kokoro = Kokoro(str(model), str(ROOT / "models" / "voices-v1.0.bin"))
    lex = {**PRON, **spec.get("pronunciations", {})}

    scenes, cursor = [], 0
    for si, scene in enumerate(spec["scenes"]):
        voice = scene.get("voice", spec["voice"])
        speed = scene.get("speed", spec["speed"])
        chunks, cues, captions = [], {}, []
        t = 0.0
        sr = 24000
        if flow:
            # The whole scene is ONE continuous take (so no sentence ever starts a fresh take,
            # which weakens its first sound). <pause N> silence is spliced in afterwards,
            # between the two sentences, using the word timings.
            sents, pause_after = [], {}
            for sent in sentences(scene["text"]):
                if m := PAUSE.fullmatch(sent):
                    if sents:
                        pause_after[len(sents) - 1] = pause_after.get(len(sents) - 1, 0) + float(m.group(1))
                else:
                    sents.append(sent)
            audio, sr, per = synth_flow(kokoro, sents, voice, speed, spec["lang"], lex)
            shift = 0.0
            pieces, prev_cut = [], 0
            for si2, (clean, ws, cue_map) in enumerate(per):
                for cid, sec in cue_map.items():
                    cues[cid] = t + sec + shift
                words = display(clean).split(" ")
                i = 0
                for ph in phrases(words):
                    a, b = ws[i][0] + shift, ws[i + len(ph) - 1][1] + shift
                    captions.append({"text": " ".join(ph), "from": round((LEAD_S + t + a) * fps), "to": round((LEAD_S + t + b) * fps)})
                    i += len(ph)
                if si2 in pause_after and si2 + 1 < len(per):
                    # split halfway through the natural gap between this sentence and the next
                    split = (ws[-1][1] + per[si2 + 1][1][0][0]) / 2
                    cut_at = int(split * sr)
                    pieces += [audio[prev_cut:cut_at], np.zeros(int(pause_after[si2] * sr))]
                    prev_cut = cut_at
                    shift += pause_after[si2]
            pieces.append(audio[prev_cut:])
            audio = np.concatenate(pieces)
            chunks += [audio, np.zeros(int(0.3 * sr))]
            t += len(audio) / sr + 0.3
        for sent in ([] if flow else sentences(scene["text"])):
            if m := PAUSE.fullmatch(sent):
                chunks.append(np.zeros(int(float(m.group(1)) * sr)))
                t += float(m.group(1))
                continue
            clean = MARK.sub("", sent)
            clean = re.sub(r"\s+", " ", clean).strip()
            phon = to_phonemes(kokoro, clean, spec["lang"], lex)
            if voice.startswith(("hf_", "hm_")):
                phon = indian_english(phon)
            samples, sr = kokoro.create(phon, voice=voice, speed=speed, lang=spec["lang"], is_phonemes=True)
            idx = np.where(np.abs(samples) > 0.008)[0]
            samples = samples[max(idx[0] - int(0.03 * sr), 0): idx[-1] + int(0.06 * sr)]
            samples = samples * (10 ** (-16 / 20) / (np.sqrt(np.mean(samples**2)) + 1e-9))
            samples = np.tanh(samples * 1.1) / np.tanh(1.1)
            dur = len(samples) / sr

            # Cue markers: position within the sentence by character offset.
            stripped, offset = "", 0
            for m in MARK.finditer(sent):
                stripped += sent[offset: m.start()]
                pos = len(re.sub(r"\s+", " ", stripped).lstrip())
                cues[int(m.group(1))] = t + dur * pos / max(len(clean), 1)
                offset = m.end()

            # Captions: word chunks timed proportionally by characters.
            words = display(clean).split(" ")
            total = sum(len(w) + 1 for w in words)
            acc = 0
            for ph in phrases(words):
                n = sum(len(w) + 1 for w in ph)
                captions.append({
                    "text": " ".join(ph),
                    "from": round((LEAD_S + t + dur * acc / total) * fps),
                    "to": round((LEAD_S + t + dur * (acc + n) / total) * fps),
                })
                acc += n

            gap = LONG_GAP_S if clean.endswith(("?", "!")) else GAP_S
            chunks += [samples, np.zeros(int(gap * sr))]
            t += dur + gap

        wav = np.concatenate(chunks)
        name = f"voice_{si + 1:02d}.wav"
        sf.write(audio_dir / name, wav, sr)
        voice_frames = math.ceil(len(wav) / sr * fps)
        duration = round(LEAD_S * fps) + voice_frames + round(TAIL_S * fps)
        n_cues = max(cues) if cues else 0
        img = audio_dir / f"img_{si + 1:02d}.png"
        scenes.append({
            "type": scene["type"],
            "data": scene.get("data", {}),
            "from": cursor,
            "durationInFrames": duration,
            "voiceFrom": round(LEAD_S * fps),
            "audio": f"lessons/{ep}/{name}",
            "cues": [round((LEAD_S + cues[i]) * fps) if i in cues else None for i in range(1, n_cues + 1)],
            "captions": captions,
            "image": f"lessons/{ep}/{img.name}" if img.exists() else None,
        })
        print(f"{si + 1:02d} {scene['type']:>10}: {len(wav) / sr:5.1f}s  cues={scenes[-1]['cues']}")
        cursor += duration

    timeline = {
        "id": ep,
        "episode": spec["episode"],
        "series": spec["series"],
        "handle": spec["handle"],
        "title": spec["title"],
        "host": spec.get("host", "male"),
        "label": spec.get("label"),
        "fps": fps,
        "totalFrames": cursor,
        "music": {**spec["music"], "audio": f"lessons/{ep}/music.wav"},
        "scenes": scenes,
    }
    (tl_dir / f"{ep}.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False))
    ids = sorted(p.stem for p in tl_dir.glob("*.json"))
    (tl_dir / "index.ts").write_text(
        "// Generated by pipeline/lesson_voice.py\n"
        + "".join(f'import {i} from "./{i}.json";\n' for i in ids)
        + "\nexport const timelines = [" + ", ".join(ids) + "];\n"
    )
    print(f"total {cursor / fps:.1f}s ({cursor} frames)")
    if cursor / fps > 180:
        sys.exit(f"ERROR: {ep} is {cursor / fps:.1f}s; Instagram Reels cap is 180s. Trim the script.")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
