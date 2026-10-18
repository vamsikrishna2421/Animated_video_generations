# Voice skit 02, one take per line, three characters. English on Fish: Amma = the channel narrator (EP29 reference),
# Chinnu and the scam caller = one young male voice (a Parler "Jatin" clip as the Fish reference), so the cloned caller
# really sounds like Chinnu. Telugu on local Indic Parler: Amma = Kiran, Chinnu and the caller = Prakash. The caller
# comes out of a phone speaker (a light band-limit: the voice must still read as Chinnu's). Each take is checked by
# Whisper; up to 4 tries; takes are cached by text + voice, so a changed line only re-voices itself.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit02/voice.py en|te [line numbers ...]
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

NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav",
            "This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
            "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")
# made once with Parler (pipeline/parler_tts_local.say, "Jatin ... young, casual, friendly"); kept in the reel folder
SON = (ROOT / "video/public/reel/skit02v1/takes/ref_Jatin.wav",
       "Hey, it's me. I'm at home eating dosa with Amma. Honestly, this is the best part of my day. No work, no traffic, just good food.")
FISH = {"amma": NARRATOR, "chinnu": SON, "caller": SON}
VOICE = {
    ("te", "amma"): "Kiran speaks in a warm, sharp, expressive voice like a clever mother at home, at a natural pace. "
                    "The recording is very clear, close-up, studio quality, with no background noise.",
    ("te", "chinnu"): "Prakash speaks in a young, casual, expressive voice like a college student at home, at a natural pace. "
                      "The recording is very clear, close-up, studio quality, with no background noise.",
    ("te", "caller"): "Prakash speaks in a young, panicked, urgent and breathless voice, fast, like someone in trouble begging for help. "
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
        # Whisper writes the Telugu words its own way ("Amma" -> "Hama", "Kanna" -> "Kana"): count them as heard
        norm = lambda t: re.sub(r"\b(h?amma|mama|ama|uma|hama)\b", "amma", re.sub(r"\b(kana|ganna|kanna|kannah)\b", "kanna",
                                re.sub(r"\b(chinu|chenu|chinna|chin yu)\b", "chinnu", t.lower().replace("codeword", "code word"))))
        words = lambda t: re.findall(r"[a-z]+", norm(t))
        tw, hw = words(text), set(words(h))
        hit = sum(w in hw for w in tw) / max(1, len(tw))
        ok = hit >= 0.75 and 7 <= rate <= 24 and len(words(h)) <= len(tw) + 3
        if "code word" in norm(text) and "code word" not in norm(h):
            ok = False   # the caller's "Code word?" was swallowed once: the line is pointless without it
        ask = text.rstrip().endswith("?") and h.rstrip().endswith("?")   # Whisper's "?" = it sounded like a question
        return ok, hit - abs(rate - 13) / 40 + (0.1 if ask else 0), f"hit {hit:.2f} rate {rate:.1f} | {h}"
    letters = [ch for ch in h if ch.isalpha()]
    dev = sum("ऀ" <= ch <= "ॿ" for ch in letters) / max(1, len(letters))
    toks = h.split()
    babble = (any(toks.count(t) >= 3 for t in set(toks) if len(t) >= 2) or bool(re.search(r"([^\s.,!?।])\1\1\1", h))
              or bool(re.search(r"(\S\S)\1\1", h) or re.search(r"(\S\S\S)\1\1", h))
              or (len(toks) > 5 and any(toks[i:i + 2] == toks[j:j + 2] for i in range(len(toks) - 1) for j in range(i + 2, len(toks) - 1))))
    # (pipeline/tools/te_verify.py's rules: line 10 looped "బూద బూద బూద" and passed the old check)
    ok = bool(h) and dev >= 0.85 and not babble and 9 <= rate <= 23
    return ok, (1 if ok else 0) + dev - abs(rate - 15) / 40, f"dev {dev:.2f} rate {rate:.1f} {'BABBLE ' if babble else ''}| {h[:120]}"


def phone(path):
    """The caller comes out of a phone speaker: band-limited 300-4000 Hz with a little saturation (still Chinnu's
    voice, but the two Chinnus must be told apart: render review)."""
    from scipy.signal import butter, sosfilt
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    x = sosfilt(butter(2, [300, 4000], "bp", fs=sr, output="sos"), a)
    x = x + 0.3 * sosfilt(butter(2, [1500, 3200], "bp", fs=sr, output="sos"), x)
    x = np.tanh(x / (np.abs(x).max() + 1e-9) * 1.5) / np.tanh(1.5)
    sf.write(path, (x * 0.9).astype(np.float32), sr)


def trim(path):
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz):
        a = a[max(0, nz[0] - int(0.06 * sr)): nz[-1] + int(0.1 * sr)]
    sf.write(path, (a / (np.abs(a).max() + 1e-9) * 0.9).astype(np.float32), sr)


def main(lang, only):
    spec = json.loads((ROOT / "reels" / ("skit02v1.json" if lang == "en" else "skit02te.json")).read_text())
    src = ROOT / "video/public/reel" / spec["id"] / "src"
    src.mkdir(parents=True, exist_ok=True)
    cache_dir = src.parent / "takes"
    cache_dir.mkdir(parents=True, exist_ok=True)
    n = 0
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n += 1
            if only and n not in only:
                continue
            who, text = line["who"], re.sub(r"\s+", " ", re.sub(r"\[\d+\]", "", line.get("tts") or line["text"])).strip()
            fish = lang == "en"
            voice = f"fish:{who}" if fish else VOICE[(lang, who)]
            key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
            best = None
            cached = sorted(cache_dir.glob(f"{key}_*.wav"))
            if cached and not only:
                best = (None, cached[0])
                print(f"{n:02d} {who}: cached {cached[0].name}", flush=True)
            for k in range(0 if best else 4):
                tmp = cache_dir / f"{key}_{k}.wav"
                if fish:
                    ref, ref_text = FISH[who]
                    fish_say(text, str(tmp), ref=str(ref), ref_text=ref_text)
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
            if who == "caller":
                phone(out)
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:]})
