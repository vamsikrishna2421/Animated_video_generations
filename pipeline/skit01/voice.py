# Voice skit 01, one take per line, two characters (local Indic Parler-TTS; free). The shop AI speaks through a phone
# speaker (band-limited), so the two voices never blur. Each take is checked by Whisper; up to 4 tries; takes are cached
# by text + voice, so a changed line only re-voices itself.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit01/voice.py en|te [line numbers ...]
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say  # noqa: E402
from fish_tts import say as fish_say  # noqa: E402

# English AI lines: Fish (the channel narrator's voice, steered by an EP29 line) through the phone filter; Parler's
# English garbled short lines ("Pin the price board" was lost, "Tomatoes" came out as "Tanejo's").
FISH_REF = ROOT / "video/public/reel/ep29v1/src/01_hook.wav"
FISH_REF_TEXT = ("This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
                 "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")

VOICE = {
    ("en", "ravi"): "Thoma speaks English with an Indian accent, loud, angry and very expressive, fast, like a frustrated "
                    "shopkeeper shouting at his phone. The recording is very clear, close-up, with no background noise.",
    ("en", "ai"): "Mary speaks in a calm, flat, deadpan monotone, slowly and evenly, like a polite voice assistant. "
                  "The recording is very clear, close-up, with no background noise.",
    ("te", "ravi"): "Prakash speaks loudly and angrily, very expressive and fast, like a frustrated shopkeeper shouting at "
                    "his phone. The recording is very clear, close-up, studio quality, with no background noise.",
    ("te", "ai"): "Kiran speaks in a calm, flat, deadpan monotone, slowly and evenly, like a polite voice assistant. "
                  "The recording is very clear, close-up, studio quality, with no background noise.",
}
ASR = None


def asr(path, lang):
    global ASR
    if ASR is None:
        from faster_whisper import WhisperModel
        ASR = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    segs, _ = ASR.transcribe(str(path), language="en" if lang == "en" else "hi", vad_filter=True)
    return " ".join(s.text.strip() for s in segs)


def judge(path, text, lang):
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    hop = int(0.02 * sr)
    rms = np.sqrt((a[:len(a) // hop * hop].reshape(-1, hop) ** 2).mean(axis=1))
    voiced = max(0.1, (rms > 0.03 * np.percentile(rms, 95)).sum() * 0.02)
    h = asr(path, lang)
    rate = len(re.sub(r"\s", "", text)) / voiced   # characters per voiced second (pipeline/te_check.py's measure)
    if lang == "en":
        words = lambda t: re.findall(r"[a-z]+", t.lower())
        tw, hw = words(text), set(words(h))
        hit = sum(w in hw for w in tw) / max(1, len(tw))
        ok = hit >= 0.75 and 7 <= rate <= 24 and len(words(h)) <= len(tw) + 3
        return ok, hit - abs(rate - 13) / 40, f"hit {hit:.2f} rate {rate:.1f} | {h}"
    letters = [ch for ch in h if ch.isalpha()]
    dev = sum("ऀ" <= ch <= "ॿ" for ch in letters) / max(1, len(letters))
    toks = h.split()
    babble = any(toks.count(t) >= 4 for t in set(toks)) or bool(re.search(r"([^\s.,!?।])\1\1\1", h))
    ok = bool(h) and dev >= 0.85 and not babble and 9 <= rate <= 22   # the deadpan AI is meant to be slow-ish
    return ok, (1 if ok else 0) + dev - abs(rate - 15) / 40, f"dev {dev:.2f} rate {rate:.1f} {'BABBLE ' if babble else ''}| {h[:120]}"


def phone(path):
    """The AI comes out of a phone speaker: band-limited 320-3600 Hz with a little saturation."""
    from scipy.signal import butter, sosfilt
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    x = sosfilt(butter(3, [320, 3600], "bp", fs=sr, output="sos"), a)
    x = x + 0.35 * sosfilt(butter(2, [1500, 3200], "bp", fs=sr, output="sos"), x)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.6) / np.tanh(1.6)
    sf.write(path, (x * 0.9).astype(np.float32), sr)


def trim(path):
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz):
        a = a[max(0, nz[0] - int(0.06 * sr)): nz[-1] + int(0.1 * sr)]
    sf.write(path, (a / (np.abs(a).max() + 1e-9) * 0.9).astype(np.float32), sr)


def main(lang, only):
    spec = json.loads((ROOT / "reels" / ("skit01v1.json" if lang == "en" else "skit01te.json")).read_text())
    src = ROOT / "video/public/reel" / spec["id"] / "src"
    cache_dir = src.parent / "takes"
    cache_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n += 1
            if only and n not in only:
                continue
            who, text = line["who"], re.sub(r"\s+", " ", re.sub(r"\[\d+\]", "", line.get("tts") or line["text"])).strip()
            fish = lang == "en" and who == "ai"
            voice = "fish:narrator" if fish else VOICE[(lang, who)]
            key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
            best = None
            cached = sorted(cache_dir.glob(f"{key}_*.wav"))
            if cached and not only:
                best = (None, cached[0])
                print(f"{n:02d} {who}: cached {cached[0].name}", flush=True)
            for k in range(0 if best else 4):
                tmp = cache_dir / f"{key}_{k}.wav"
                if fish:
                    fish_say(text, str(tmp), ref=str(FISH_REF), ref_text=FISH_REF_TEXT)
                else:
                    say(lang, text, tmp, voice=voice, pause=0.2)
                trim(tmp)
                ok, sc_, info = judge(tmp, text, lang)
                print(f"{n:02d} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
                if best is None or (best[0] is not None and sc_ > best[0]):
                    best = (sc_, tmp)
                if ok:
                    break
            if best[0] is not None:   # keep only the chosen take in the cache
                for f in cache_dir.glob(f"{key}_*.wav"):
                    if f != best[1]:
                        f.unlink()
            out = src / line["file"]
            shutil.copy(best[1], out)
            if who == "ai":
                phone(out)
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:]})
