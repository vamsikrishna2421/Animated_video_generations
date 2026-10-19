# Skit 03 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: the chatbot = the channel narrator's reference through the laptop speaker (the light phone sound), Sir and Priya
# = Fish copies of Parler-made reference clips (skit 02's way; `refs` makes them once). Telugu on Parler: Sir = Prakash,
# Priya = Lalitha, the chatbot = Kiran, the strict judge, the light phone sound with the Telugu low cut. The chatbot's
# takes are judged after the filter (what the viewer hears); MUST lists words a take has to contain (EP34: the word-hit
# judge passed "I loan" for "I'll own").
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit03/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit03/voice.py en|te [line numbers ...]
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
from skit01.voice import FISH_REF, FISH_REF_TEXT, judge as judge_en, trim  # noqa: E402
from ep33.voice_te import LO_CUT, judge as judge_te  # noqa: E402
from ep33.voice_rec import phone  # noqa: E402
import ep33.voice_rec as vr  # noqa: E402

REFS = ROOT / "video/public/reel/skit03v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder like skit 02's ref_Jatin.wav)
REF = {
    "sir": ("Dinesh speaks English with an Indian accent in a firm, deep, authoritative voice, like a strict middle-aged "
            "college lecturer, at a moderate pace. The recording is very clear, close-up, with no background noise.",
            "Good morning, class. I have read every one of your essays. Some of you clearly did not write your own work, "
            "and I will find out who."),
    "priya": ("Priya speaks English with an Indian accent in a young, bright, expressive voice, like a college student "
              "pleading her case, at a natural pace. The recording is very clear, close-up, with no background noise.",
              "Sir, I promise, I wrote every word of this myself. I stayed up till two in the morning, and I can explain "
              "every single paragraph to you."),
}
VOICE_TE = {
    "sir": "Prakash speaks in a firm, deep, stern voice like a strict college lecturer, at a moderate pace. "
           "The recording is very clear, close-up, studio quality, with no background noise.",
    "priya": "Lalitha speaks in a young, bright, expressive voice like a college student pleading her case, at a natural pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "ai": "Kiran speaks in a calm, flat, deadpan monotone, slowly and evenly, like a polite voice assistant. "
          "The recording is very clear, close-up, studio quality, with no background noise.",
}
# n: groups of words, one word of each group must be heard (Whisper's words, lower case)
MUST = {"en": {1: [("zero",), ("confessed", "confess")], 2: [("myself",)], 3: [("machines", "machine"), ("lie",)],
               4: [("write",)], 5: [("hometown", "home")], 6: [("chat",), ("paste",)], 7: [("not",)],
               8: [("seconds", "second")], 9: [("check",), ("guess",)], 10: [("denied", "deny"), ("essays", "essay")],
               11: [("know",)], 12: [("version",), ("history",)], 13: [("notes", "note")], 14: [("yes",)],
               15: [("2012", "twenty", "twelve"), ("machines", "machine"), ("lie",)]},
        # Telugu, as the Hindi-decoding judge writes it (line 13's "నువ్వే" came out "नूभे")
        "te": {8: [("नुव", "नूव", "नुभ", "नूभ")], 11: [("एवर", "येवर", "ऐवर", "एवरु"), ("तेलुस", "टेलुस", "तेलूस", "तेलस", "तलुस")]}}


def heard(path, who, lang):
    """The take as it goes into the reel: the chatbot's through the laptop speaker."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "skit03_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, True)
    sf.write(out, x.astype(np.float32), sr)
    return out


def judge(path, text, lang, n):
    ok, score, info = judge_en(path, text, "en") if lang == "en" else judge_te(path, text)
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 0.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


def refs():
    REFS.mkdir(parents=True, exist_ok=True)
    for who, (desc, text) in REF.items():
        out = REFS / f"ref_{who}.wav"
        if out.exists():
            print("have", out)
            continue
        say("en", text, out, voice=desc, pause=0.2)
        trim(out)
        print("made", out, judge_en(out, text, "en")[2])


def main(lang, only):
    sid = "skit03v1" if lang == "en" else "skit03te"
    spec = json.loads((ROOT / f"reels/{sid}.json").read_text())
    src = ROOT / f"video/public/reel/{sid}/src"
    takes = src.parent / "takes"
    src.mkdir(parents=True, exist_ok=True)
    takes.mkdir(parents=True, exist_ok=True)
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n, who = int(line["file"][:2]), line["who"]
            who = "ai" if who == "bot" else who   # "bot" in the spec (its caption tag reads "AI Chat"), the chatbot's voice here
            if only and n not in only:
                continue
            parts = [(line.get("tts") or line["text"], line["file"])] + ([(line["tts2"], line["file2"])] if line.get("file2") else [])
            for raw, fname in parts:
                voice_one(lang, n, who, re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip(), fname, src, takes, only)
    print("VOICE_DONE", flush=True)


def voice_one(lang, n, who, text, fname, src, takes, only):
    """One take for one text (a line, or one half of a line voiced in two takes)."""
    fish = lang == "en"
    voice = f"fish:{who}" if fish else VOICE_TE[who]
    key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
    cached = sorted(takes.glob(f"{key}_*.wav"))
    best = (None, cached[0]) if cached and not only else None
    if best:
        print(f"{n:02d} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, lang), text, lang, n)[2]}", flush=True)
    for k in range(0 if best else 4):
        tmp = takes / f"{key}_{k}.wav"
        try:
            if fish:
                ref, ref_text = (FISH_REF, FISH_REF_TEXT) if who == "ai" else (REFS / f"ref_{who}.wav", REF[who][1])
                fish_say(text, str(tmp), ref=str(ref), ref_text=ref_text)
            else:
                say(lang, text, tmp, voice=voice, pause=0.2)
        except RuntimeError as e:   # Fish's gateway errors can outlast its own retries: count it as a failed try
            print(f"{n:02d} {who} try {k}: failed to voice ({e})", flush=True)
            continue
        trim(tmp)
        ok, score, info = judge(heard(tmp, who, lang), text, lang, n)
        print(f"{n:02d} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
        if best is None or (best[0] is not None and score > best[0]):
            best = (score, tmp)
        if ok:
            break
    if best is None:
        print(f"{n:02d} {who}: NO TAKE (every try failed)", flush=True)
        return
    if best[0] is not None:   # keep only the chosen take in the cache
        for f in takes.glob(f"{key}_*.wav"):
            if f != best[1]:
                f.unlink()
    shutil.copy(heard(best[1], who, lang), src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        main(sys.argv[1], {int(x) for x in sys.argv[2:]})
