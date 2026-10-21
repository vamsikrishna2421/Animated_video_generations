# EP36 voices, as EP35's (pipeline/ep35/voice.py): one judged take per line, cached by text + voice. English: Ravi on
# Parler "Thoma", the shop AI on Fish (the narrator reference) through the phone sound; Telugu on Parler (Ravi = Prakash,
# the AI = Kiran), the strict judge, the light phone sound. The AI's takes are judged after the phone filter, and MUST
# lists words a take has to contain.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep36/voice.py en|te [--keep] [line numbers ...]
import hashlib
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say  # noqa: E402
from fish_tts import say as fish_say  # noqa: E402
from skit01.voice import FISH_REF, FISH_REF_TEXT, VOICE as VOICE_EN, judge as judge_en, trim  # noqa: E402
from ep33.voice_te import VOICE as VOICE_TE, LO_CUT, judge as judge_te  # noqa: E402
from ep33.voice_rec import phone  # noqa: E402
import ep33.voice_rec as vr  # noqa: E402

LIGHT_EN = {2, 8, 10, 14}   # the AI's numbers through the lighter phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count for numbers)
MUST = {"en": {1: [("twenty",), ("three", "23"), ("orders", "order"), ("typing",), ("reply",)], 2: [("billion",), ("multiplications", "multiplication")],
               3: [("eight", "8"), ("cores", "core")], 4: [("eight", "8"), ("thousands", "thousand")], 5: [("diwali",), ("rack",)],
               6: [("graphics",), ("games", "game"), ("thousands", "thousand"), ("once",)], 7: [("helpers", "helper"), ("bill",), ("cores", "core"), ("reply",)],
               8: [("laptop",), ("eleven", "11", "11.5"), ("half",), ("four", "4"), ("under",), ("split",)], 9: [("minute",), ("half",), ("graphics",)],
               10: [("chatgpt", "chat", "gpt"), ("theirs",), ("gaming",), ("three", "3000", "3,000")], 11: [("sunny",), ("laptop",)],
               12: [("workers", "worker"), ("speed",)], 13: [("brain",), ("squeezed", "squeeze"), ("full",)], 14: [("fifteen", "15"), ("eight", "8")],
               15: [("so",)], 16: [("workers", "worker"), ("typing",)]},
        "te": {2: [("मल्टि", "मल्टी", "मल्ति")], 8: [("पदकों", "पदको", "पद्को", "11", "ग्यारह")], 10: [("मूडु", "मुडु", "3000")],
               14: [("पदिहे", "पदहे", "15")]}}   # Telugu as the judge writes it (Devanagari)


def heard(path, who, n, lang):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep36_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, n in LIGHT_EN)
    sf.write(out, x.astype(np.float32), sr)
    return out


def judge(path, text, lang, n):
    ok, score, info = judge_en(path, text, "en") if lang == "en" else judge_te(path, text)
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    # English: whole words; Telugu (written in Devanagari by the judge): a substring will do
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 0.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


def main(lang, only, keep=False):
    sid = "ep36v1" if lang == "en" else "ep36te"
    spec = json.loads((ROOT / f"reels/{sid}.json").read_text())
    src = ROOT / f"video/public/reel/{sid}/src"
    takes = src.parent / "takes"
    src.mkdir(parents=True, exist_ok=True)
    takes.mkdir(parents=True, exist_ok=True)
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n, who = int(line["file"][:2]), line["who"]
            if only and n not in only:
                continue
            parts = [(line.get("tts") or line["text"], line["file"])] + ([(line["tts2"], line["file2"])] if line.get("file2") else [])
            for raw, fname in parts:
                text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
                fish = lang == "en" and who == "ai"
                voice = "fish:narrator" if fish else VOICE_EN[("en", who)] if lang == "en" else VOICE_TE[who]
                key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
                cached = sorted(takes.glob(f"{key}_*.wav"))
                best = (None, cached[0]) if cached and (keep or not only) else None   # --keep: a part whose text is unchanged keeps its take
                if best:
                    print(f"{n:02d} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, n, lang), text, lang, n)[2]}", flush=True)
                for k in range(0 if best else 4):
                    tmp = takes / f"{key}_{k}.wav"
                    try:
                        if fish:
                            fish_say(text, str(tmp), ref=str(FISH_REF), ref_text=FISH_REF_TEXT)
                        else:
                            say(lang, text, tmp, voice=voice, pause=0.2)
                    except RuntimeError as e:   # Fish's gateway errors outlast its own retries some evenings: count it as a failed try
                        print(f"{n:02d} {who} try {k}: failed to voice ({e})", flush=True)
                        continue
                    trim(tmp)
                    ok, score, info = judge(heard(tmp, who, n, lang), text, lang, n)
                    print(f"{n:02d} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
                    if best is None or (best[0] is not None and score > best[0]):
                        best = (score, tmp)
                    if ok:
                        break
                if best is None:
                    print(f"{n:02d} {who}: NO TAKE (every try failed)", flush=True)
                    continue
                if best[0] is not None:   # keep only the chosen take in the cache
                    for f in takes.glob(f"{key}_*.wav"):
                        if f != best[1]:
                            f.unlink()
                shutil.copy(heard(best[1], who, n, lang), src / fname)
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"}, "--keep" in sys.argv)
