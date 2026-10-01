"""Build an AI-news episode: narration per segment (free local TTS), word timings for karaoke captions and
fact-card cues, and a timeline the NewsReel composition renders.

  python3 pipeline/news_build.py news/2026-10-01.json [en|te]
  -> video/public/news/<id>/<lang>/seg_*.wav  +  video/src/news/timelines/<id>-<lang>.json

Spec: hook / stories[] / outro, each with `text` (shown, captions) and `tts` (spoken); Telugu specs add
`tts_te`. Story cards cue on a word index of `text` (`at`).
"""
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
from parler_tts_local import radio, say  # noqa: E402
from reel_build import stretch, tighten, voiced_spans  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TEMPO = {"en": 1.18, "te": 1.0}  # Telugu narrator already gets +10% in radio()


def take(text, lang, out_dir):
    """Synthesise once per distinct text (cached by hash), then trim and tighten pauses."""
    h = hashlib.sha1(f"{lang}|{text}".encode()).hexdigest()[:10]
    raw = out_dir / f"raw_{h}.wav"
    if not raw.exists():
        say(lang, text, raw)
        if lang == "te":
            radio(raw)
    a, sr = sf.read(raw)
    a = a.mean(axis=1) if a.ndim > 1 else a
    nz = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.12 * sr)]
    a = tighten(a, sr, 0.45)
    a = stretch(a, sr, TEMPO[lang])
    return a * (10 ** (-16 / 20) / (np.sqrt(np.mean(a ** 2)) + 1e-9)), sr


def word_times(a, sr, text, lead):
    """Spread the shown words over the voiced time by length (captions follow the real delivery)."""
    words = text.split()
    spans = voiced_spans(a, sr) or [(0, len(a) / sr)]
    total = sum(e - s for s, e in spans)

    def at(x):
        need = x * total
        for s0, e0 in spans:
            if need < e0 - s0:
                return s0 + need
            need -= e0 - s0
        return spans[-1][1]
    wts = [len(w) + 1 for w in words]
    acc, out = 0, []
    for w, k in zip(words, wts):
        s, e = at(acc / sum(wts)), at((acc + k) / sum(wts))
        out.append({"w": w, "s": lead + round(s * FPS), "e": lead + round(e * FPS)})
        acc += k
    return out


def build(spec_path, lang="en"):
    spec = json.loads(Path(spec_path).read_text())
    out_dir = ROOT / "video" / "public" / "news" / spec["id"] / lang
    out_dir.mkdir(parents=True, exist_ok=True)
    key = "tts" if lang == "en" else "tts_te"
    segs = [("hook", spec["hook"])] + [(f"story{i + 1}", s) for i, s in enumerate(spec["stories"])] + [("outro", spec["outro"])]
    timeline = {**{k: spec[k] for k in ("id", "date", "range", "edition")}, **{k: spec[k] for k in ("kicker", "title", "recap") if k in spec}, "lang": lang, "segments": []}
    lead, tail = {"hook": 4, "outro": 6}, {"hook": 14, "outro": 150}
    for name, seg in segs:
        a, sr = take(seg[key], lang, out_dir)
        f = out_dir / f"{name}.wav"
        sf.write(f, a.astype(np.float32), sr)
        ld = lead.get(name, 8)  # story: room for the cut + headline before the voice
        frames = ld + math.ceil(len(a) / sr * FPS) + tail.get(name, 10)
        words = word_times(a, sr, seg["text"], ld)
        entry = {"name": name, "audio": f"news/{spec['id']}/{lang}/{name}.wav", "lead": ld, "frames": frames, "words": words}
        if name.startswith("story"):
            entry.update({k: v for k, v in seg.items() if k not in ("text", "tts", "tts_te", "cards")})
            for c in seg["cards"]:  # a card cues on a word index ("at") or on the first word containing "cue"
                if "cue" in c:
                    c["at"] = next((i for i, w in enumerate(words) if c["cue"].lower() in w["w"].lower()), 0)
            entry["cards"] = [{**c, "f": words[min(c["at"], len(words) - 1)]["s"]} for c in seg["cards"]]
        if name == "hook":
            entry["lines"] = seg["lines"]
        timeline["segments"].append(entry)
        print(name, f"{len(a) / sr:.1f}s", flush=True)
    timeline["frames"] = sum(s["frames"] for s in timeline["segments"])
    tl = ROOT / "video" / "src" / "news" / "timelines" / f"{spec['id']}-{lang}.json"
    tl.parent.mkdir(parents=True, exist_ok=True)
    tl.write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
    print("timeline", tl, timeline["frames"] / FPS, "s")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "en")
