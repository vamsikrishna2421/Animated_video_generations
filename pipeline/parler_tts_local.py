"""Free, local text-to-speech with AI4Bharat Indic Parler-TTS (Apache-2.0), for Telugu and Indian English.

Weights come from an ungated mirror whose model.safetensors is byte-identical to ai4bharat/indic-parler-tts
(sha256 is checked after download).

  python3 pipeline/parler_tts_local.py say te "తెలుగు వాక్యం" out.wav
  python3 pipeline/parler_tts_local.py script reels/<id>.json      # fill missing line "file" takes from "tts" text

Spec keys for "script": "parler_lang" ("te" | "en"), optional "parler_voice" (speaker description).
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
REPO = "RXD03/indic-parler-tts"  # mirror of ai4bharat/indic-parler-tts
SHA = "c68daecb60f80c8f"  # prefix of the official model.safetensors sha256
VOICES = {
    # Named speakers the model was trained with; the description steers pace, tone and recording quality.
    # User's pick: energetic Kiran (morning-show RJ) + radio processing (see radio()). Lalitha rejected.
    "te": "Kiran speaks with very high energy, like an excited FM radio host on a morning show: loud, fast and enthusiastic, "
          "with big variation in pitch and a smiling voice. The recording is very clear, close-up, studio quality, with no background noise.",
    "en": "Mary speaks in a clear, warm and friendly tone with an Indian English accent at a moderate, unhurried pace, "
          "like a good teacher. The recording is very clear, close-up, with no background noise.",
}
# Named characters (series/VOICES.md). A line picks one with "cast": "<name>"; "post" is an ffmpeg filter.
CAST = {
    "narrator_te": {"lang": "te", "voice": None, "radio": True},
    "rj_young": {"lang": "te", "voice": "Kiran speaks like a young, friendly radio host chatting with listeners: casual, cheerful and expressive, "
                 "at a lively but clear pace. The recording is very clear, close-up, studio quality, with no background noise."},
    "sidekick": {"lang": "te", "voice": "Kiran speaks in a very excited, high-pitched, animated and expressive voice, fast and bouncy, "
                 "like a funny cartoon character. The recording is very clear, close-up, with no background noise.",
                 "post": "asetrate=44100*1.32,aresample=44100,atempo=0.9"},
    "narrator_en": {"lang": "en", "voice": None},
}
_M = {}


def load():
    if _M:
        return _M
    import torch
    from huggingface_hub import hf_hub_download
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    torch.set_num_threads(4)
    weights = hf_hub_download(REPO, "model.safetensors")
    h = hashlib.sha256()
    with open(weights, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 24), b""):
            h.update(chunk)
    if not h.hexdigest().startswith(SHA):
        raise SystemExit(f"weights hash mismatch: {h.hexdigest()}")
    model = ParlerTTSForConditionalGeneration.from_pretrained(REPO).eval()
    _M.update(model=model, tok=AutoTokenizer.from_pretrained(REPO),
              dtok=AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path), torch=torch)
    return _M


def sentences(text):
    # Split on sentence ends, but never inside initialisms like "A.I." or "L.L.M." (a capital letter + period).
    parts = re.split(r"(?<=[.!?।])(?<![A-Z]\.)\s+", text.strip())
    return [s for s in parts if re.search(r"\w", s)]


EN_FIX = [(r"\bGenAI\b", "Gen A.I."), (r"\bAI\b", "A.I."), (r"\bLLMs\b", "L.L.M.s"), (r"\bLLM\b", "L.L.M."), (r"\bMCP\b", "M.C.P.")]


def say(lang, text, out: Path, voice=None, pause=0.35):
    """Synthesize sentence by sentence (the model is best on short inputs) and join with short pauses."""
    if lang == "en":
        for a, b in EN_FIX:
            text = re.sub(a, b, text)
    m = load()
    torch = m["torch"]
    desc = m["dtok"](voice or VOICES[lang], return_tensors="pt")
    sr = m["model"].config.sampling_rate
    parts = []
    for s in sentences(text):
        p = m["tok"](s, return_tensors="pt")
        with torch.no_grad():
            a = m["model"].generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask,
                                    prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
        parts += [np.atleast_1d(a.cpu().numpy().squeeze()), np.zeros(int(pause * sr))]
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, np.concatenate(parts).astype(np.float32), sr)
    return out


def radio(path: Path, tempo=1.1):
    """FM-radio polish the user liked: high-pass, presence lift, soft compression, 10% faster (pitch kept)."""
    from scipy.signal import butter, sosfilt
    a, sr = sf.read(path)
    hp = sosfilt(butter(2, 120, "hp", fs=sr, output="sos"), a)
    x = hp + 0.6 * sosfilt(butter(2, [2500, 6000], "bp", fs=sr, output="sos"), hp)
    x = np.tanh(x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.25 * 2.2) / np.tanh(2.2)
    sf.write(path, (x * 0.9).astype(np.float32), sr)
    post(path, f"atempo={tempo}")


def post(path: Path, filt: str):
    """Apply an ffmpeg audio filter in place (e.g. pitch-up for the cartoon sidekick)."""
    import os
    import subprocess
    ff = ROOT / "video" / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
    tmp = path.with_suffix(".post.wav")
    subprocess.run([str(ff), "-y", "-loglevel", "error", "-i", str(path), "-af", filt, str(tmp)], check=True,
                   env={**os.environ, "LD_LIBRARY_PATH": str(ff.parent)})
    tmp.replace(path)


def clean(text):
    return re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", text)).strip()


def script(spec_path: Path):
    spec = json.loads(spec_path.read_text())
    src = ROOT / "video" / "public" / "reel" / spec["id"] / "src"
    lang, voice = spec["parler_lang"], spec.get("parler_voice")
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            for key, tkey in (("file", "tts"), ("file2", "tts2")):
                text = line.get(tkey) or (clean(line["text"]) if key == "file" and "file2" not in line else None)
                if line.get(key) and text and not (src / line[key]).exists():
                    print("synth", line[key], flush=True)
                    cast = CAST.get(line.get("cast") or ("narrator_te" if lang == "te" else ""), {})
                    out = src / line[key]
                    say(cast.get("lang", lang), text, out, cast.get("voice") or voice)
                    if cast.get("post"):
                        post(out, cast["post"])
                    if cast.get("radio"):
                        radio(out)


if __name__ == "__main__":
    if sys.argv[1] == "say":
        print(say(sys.argv[2], sys.argv[3], Path(sys.argv[4])))
    elif sys.argv[1] == "script":
        script(Path(sys.argv[2]))
