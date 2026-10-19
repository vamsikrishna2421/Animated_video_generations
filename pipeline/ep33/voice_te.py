# EP33 Telugu voice on local Indic Parler (the user recorded English only): one judged take per line, two characters as
# in skit 01 (Ravi = Prakash, loud and fast; the shop AI = Kiran, calm and flat). Each take is checked with Whisper the
# strict way (pipeline/tools/te_verify.py's rules: no looped syllables or repeated words, a sane speaking rate) and
# re-rolled up to 4 times; takes are cached by text + voice, so a changed line only re-voices itself. The AI's lines get
# the phone-speaker sound, lighter on the numbers, like the English version.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep33/voice_te.py [line numbers ...]
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
from ep33.voice_rec import phone  # noqa: E402

VOICE = {
    "ravi": "Prakash speaks loudly and angrily, very expressive and fast, like a frustrated shopkeeper shouting at "
            "his phone. The recording is very clear, close-up, studio quality, with no background noise.",
    "ai": "Kiran speaks in a calm, flat, deadpan monotone, slowly and evenly, like a polite voice assistant. "
          "The recording is very clear, close-up, studio quality, with no background noise.",
}
LIGHT = {17, 24}
ASR = None


def asr(path):
    global ASR
    if ASR is None:
        from faster_whisper import WhisperModel
        ASR = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    segs, _ = ASR.transcribe(str(path), language="hi", vad_filter=True)
    return " ".join(s.text.strip() for s in segs)


def judge(path, text):
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    hop = int(0.02 * sr)
    rms = np.sqrt((a[:len(a) // hop * hop].reshape(-1, hop) ** 2).mean(axis=1))
    voiced = max(0.1, (rms > 0.03 * np.percentile(rms, 95)).sum() * 0.02)
    h = asr(path)
    rate = len(re.sub(r"\s", "", text)) / voiced
    letters = [ch for ch in h if ch.isalpha()]
    dev = sum("ऀ" <= ch <= "ॿ" for ch in letters) / max(1, len(letters))
    toks = h.split()
    babble = (any(toks.count(t) >= 3 for t in set(toks) if len(t) >= 2) or bool(re.search(r"([^\s.,!?।])\1\1\1", h))
              or bool(re.search(r"(\S\S)\1\1", h) or re.search(r"(\S\S\S)\1\1", h))
              or (len(toks) > 5 and any(toks[i:i + 2] == toks[j:j + 2] for i in range(len(toks) - 1) for j in range(i + 2, len(toks) - 1))))
    long = len(a) / sr > max(2.8, len(re.sub(r"\s", "", text)) * 0.11)
    ok = bool(h) and dev >= 0.85 and not babble and not long and 9 <= rate <= 23
    return ok, (1 if ok else 0) + dev - abs(rate - 15) / 40, f"dev {dev:.2f} rate {rate:.1f} {'BABBLE ' if babble else ''}{'LONG ' if long else ''}| {h[:110]}"


def trim(path):
    a, sr = sf.read(path)
    a = a.mean(axis=1) if a.ndim > 1 else a
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz):
        a = a[max(0, nz[0] - int(0.06 * sr)): nz[-1] + int(0.1 * sr)]
    sf.write(path, (a / (np.abs(a).max() + 1e-9) * 0.9).astype(np.float32), sr)


def main(only):
    spec = json.loads((ROOT / "reels/ep33te.json").read_text())
    src = ROOT / "video/public/reel/ep33te/src"
    takes = src.parent / "takes"
    src.mkdir(parents=True, exist_ok=True)
    takes.mkdir(parents=True, exist_ok=True)
    n = 0
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n += 1
            if only and n not in only:
                continue
            who = line["who"]
            parts = [(line.get("tts") or line["text"], line["file"])] + ([(line["tts2"], line["file2"])] if line.get("file2") else [])
            for raw, fname in parts:
                voice_part(n, who, raw, fname, takes, src, only)
    print("VOICE_DONE", flush=True)


def voice_part(n, who, raw, fname, takes, src, only):
    if True:
        if True:
            text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
            key = hashlib.md5(f"{VOICE[who]}|{text}".encode()).hexdigest()[:10]
            cached = sorted(takes.glob(f"{key}_*.wav"))
            best = (None, cached[0]) if cached and not only else None
            if best:
                print(f"{n:02d} {who}: cached {cached[0].name}", flush=True)
            for k in range(0 if best else 4):
                tmp = takes / f"{key}_{k}.wav"
                say("te", text, tmp, voice=VOICE[who], pause=0.2)
                trim(tmp)
                ok, score, info = judge(tmp, text)
                print(f"{n:02d} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
                if best is None or (best[0] is not None and score > best[0]):
                    best = (score, tmp)
                if ok:
                    break
            if best[0] is not None:
                for f in takes.glob(f"{key}_*.wav"):
                    if f != best[1]:
                        f.unlink()
            out = src / fname
            shutil.copy(best[1], out)
            if who == "ai":
                a, sr = sf.read(out)
                import ep33.voice_rec as vr
                vr.SR = sr
                sf.write(out, phone(a, n in LIGHT).astype(np.float32), sr)


if __name__ == "__main__":
    main({int(x) for x in sys.argv[1:]})
