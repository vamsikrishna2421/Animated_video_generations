# Creative 08 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Kavya, Teja and Nanna = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's way, with
# Parler's English speakers); the AI chat app = the channel narrator (EP29's reference), through the light phone sound and
# judged after it. Telugu on Parler: Kavya = Lalitha, Teja = Prakash (young), Nanna = Kiran (deep, older), the app =
# Lalitha (calm) through the phone sound (Telugu has one female voice; the filter tells them apart). Line 6 is English in
# both reels (she reads what she types) and gets the English judge. Every take is levelled per sentence (EP36's `level`).
# MUST lists words a take has to contain (a missed word costs 1.5).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative08/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative08/voice.py en|te [--keep] [line numbers ...]
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
from skit01.voice import judge as judge_en, trim  # noqa: E402
from ep33.voice_te import LO_CUT, judge as judge_te  # noqa: E402
from ep33.voice_rec import phone  # noqa: E402
import ep33.voice_rec as vr  # noqa: E402
from creative07.voice import level  # noqa: E402

REFS = ROOT / "video/public/reel/creative08v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "kavya": ("Tisha speaks English with an Indian accent in a young, bright, confident and expressive voice, like a woman in her "
              "mid-twenties, at a natural pace. The recording is very clear, close-up, with no background noise.",
              "Okay, listen to me. I have planned everything for Sunday, the food, the lights and the music. Nobody tells Amma anything."),
    "teja": ("Yash speaks English with an Indian accent in a young, excited, dramatic and expressive voice, like a teenage boy, at a "
             "fast pace. The recording is very clear, close-up, with no background noise.",
             "Are you serious? That is way too much! Nobody in this house spends that kind of money, trust me."),   # the clip lost "What?"
    "nanna": ("Raghav speaks English with an Indian accent in a warm, deep, slightly husky voice, like a gentle father in his "
              "fifties, at a relaxed pace. The recording is very clear, close-up, with no background noise.",
              "Arre, what is all this? Who did all this? I did not expect anything, really. You two are too much."),
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav",
            "This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
            "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")
VOICE_TE = {
    "kavya": "Lalitha speaks in a young, bright, confident and expressive voice like a woman in her twenties, at a natural pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "teja": "Prakash speaks in a young, excited, dramatic and expressive voice like a teenage boy, at a fast pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "nanna": "Kiran speaks in a warm, deep, slow and gentle voice like a father in his fifties, at a relaxed pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "aichat": "Lalitha speaks in a calm, clear, polite and friendly voice like a helpful assistant, at a measured pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
APP = {"aichat"}   # the app on her phone: the light phone sound
PES = ("pesar", "pessar", "pesor", "pesur", "pizar", "pisar", "pesra", "pesar")   # "pesarattu", however Whisper spells it
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("three", "3"), ("lakhs", "lakh", "lacs", "lac", "lux", "lacks", "lack", "lakes"), ("auto",)],
               2: [("anniversary",), ("wedding",), ("reception",)], 3: [("why",), ("big",)], 4: [("nothing",), ("guessed", "guess")],
               5: [("take",), ("two", "2"), ("needs", "need"), ("ask",)],
               6: [("before",), ("plan",), ("ask",), ("three", "3"), ("questions", "question")],
               7: [("sure",), ("love",), ("special",), ("place",), ("party",), ("small",)],
               8: [("songs", "song"), PES, ("terrace",), ("small",), ("five", "5", "5000"), ("max", "maximum")],
               9: [("plan",), PES, ("wedding",), ("song",), ("terrace",), ("album",), ("photos", "photo")],
               10: [("total",), ("four", "4", "4800"), ("eight", "800", "4800"), ("rupees", "rupee", "rs")],   # Whisper writes "Rs 4,800"
               11: [("tested", "test"), ("without",), ("line",), ("zero", "0"), ("questions", "question"), ("every",), ("time",)],
               12: [PES, ("song",), ("who",), ("planned", "plan")], 13: [("ai",), ("nanna", "nana", "nanaa", "naana"), ("after",), ("asked", "ask")],
               14: [("okay", "ok"), ("plan",), ("birthday",)],
               15: [("teja", "tejah", "tejaa", "theja", "taja", "tija", "tega"), ("forgot", "forget"), ("line",)]},
        "te": {1: [("मूडु", "मूडू", "मुडु", "मूड", "मुदु", "मुड़", "3"), ("लक्ष", "लक्श", "लख", "लक्ष्"), ("आटो", "ऑटो", "आतो", "अटो", "अट्व", "auto")],
               2: [("पातिक", "पाटिक", "पातीक", "पातिके", "पातके", "पाति", "पार्तिक"), ("रिसेप", "रिसप", "रेसेप", "रिशेप", "reception")],
               3: [("ओवर", "ओवेर", "over", "ओव्हर", "वोर")], 4: [("एमी", "येमी", "एमि", "ईमी"), ("गेस", "गैस", "गेश", "guess")],
               5: [("टेक", "टैक", "तेक", "तेख", "take"), ("टू", "two", "2", "तू"), ("अडग", "अडिग", "अडुग", "अड़ग", "अड़िग", "आदग", "अदग")],
               7: [("सरे", "सरी", "सरै"), ("इष्ट", "इश्ट", "इष्टं", "इस्ट", "मिस्त"), ("स्पेशल", "स्पेषल", "स्पेसल", "स्पर्ष", "special"),
                   ("पार्टी", "पार्टि", "party", "पारटी")],
               8: [("अम्म", "अमा", "अम्मा"), ("पेसर", "पेसार", "पेसरट", "पेस्सर", "पेसरत", "पसर"), ("टेरस", "टेर्रस", "टेरेस", "टैरस", "terrace"),
                   ("ऐदु", "अइदु", "आइदु", "ऐदू", "5")],
               9: [("प्लान", "प्लैन", "plan"), ("पेसर", "पेसार", "पेसरट", "पेस्सर", "पसर"), ("पेल्ल", "पेळ्ळ", "पेलि", "पेल्लि", "पेली", "पेळ"),
                   ("पाट", "पात"), ("आल्बम", "एल्बम", "अल्बम", "album", "आलबम")],   # the first take's "pelli" came out "पिल्लि" (pilli: a cat)
               10: [("मोत्त", "मुत्त", "मोत", "मोट्ट"), ("नालुगु", "नालगु", "नालुग", "4"), ("एनिमि", "एनमि", "एनिमिदि", "इनिमि", "8")],
               11: [("टेस्ट", "टेस", "test"), ("लैन", "लाइन", "line", "लाईन"), ("प्रश्न", "प्रशन", "प्रष्न", "प्रस्न"), ("प्रति", "प्रती")],
               12: [("पेसर", "पेसार", "पेसरट", "पसर"), ("पाट", "पात"), ("प्लान", "प्लैन", "plan")],
               13: [("आई", "आए", "एआई", "ऐआई", "ai"), ("नान्न", "नाना", "नान", "नन्ना"), ("अडिगा", "अडगा", "अडिग", "अड़िगा", "अडिके", "अदिगा")],
               14: [("सरे",), ("बर्थ", "बर्त", "birth", "बर्थडे", "बरत"), ("प्लान", "प्लैन", "plan", "प्लें")],
               15: [("तेजा", "तेज", "तेझा", "तेजाः", "तेजः"), ("लैन", "लाइन", "line", "लाईन"), ("मर्चि", "मरचि", "मर्ची", "मर्च", "मरची")]}}
# lines whose judge text needs digits (Whisper writes "4,800", "5,000", "3 lakhs")
JUDGE_TEXT = {1: "3 lakhs?! Nanna won't even take an auto!", 8: "Old songs for Amma, pesarattu for Nanna. Our terrace. Small, 5000 max!",
              10: "Total: 4800."}
TELUGU = re.compile(r"[ఀ-౿]")
KEEP = False


def heard(path, who, lang):
    """The take as it goes into the reel: the app's lines through the light phone sound."""
    if who not in APP:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "creative08_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, True)
    sf.write(out, x.astype(np.float32), sr)
    return out


def judge(path, text, lang, n):
    """English lines (and line 6 of the Telugu reel, which is English) get the English judge, against the line with digits
    where Whisper writes digits; MUST words are checked on the transcript (and "pesarattu" as a part of a word)."""
    jl = "en" if lang == "en" or not TELUGU.search(text) else "te"
    ref = JUDGE_TEXT.get(n, text) if jl == "en" and lang == "en" else text
    ok, score, info = judge_en(path, ref, "en") if jl == "en" else judge_te(path, text)
    if jl == "te" and "LONG" in info and "BABBLE" not in info:   # EP33's length limit (0.11 s a letter) was set for a flat
        a, sr = sf.read(path)                                      # AI voice; these characters shout and pause: 0.15
        m = re.search(r"dev ([\d.]+) rate ([\d.]+)", info)
        if m and float(m.group(1)) >= 0.85 and 9 <= float(m.group(2)) <= 23 and len(a) / sr <= max(2.8, len(re.sub(r"\s", "", text)) * 0.15):
            ok, score, info = True, score + 1, info.replace("LONG ", "")
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    flat = re.sub(r"[^a-z0-9]", "", heard_text)
    groups = MUST["en"].get(n, []) if jl == "en" else MUST["te"].get(n, [])
    if lang == "te" and jl == "en":   # line 6 in the Telugu reel
        groups = MUST["en"].get(n, [])
    miss = [g[0] for g in groups if not any(((w in words) or (g is PES and w in flat)) if jl == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 1.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


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
    sid = "creative08v1" if lang == "en" else "creative08te"
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
            text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", line.get("tts") or line["text"])).strip()
            voice_one(lang, n, who, text, line["file"], src, takes, only)
    print("VOICE_DONE", flush=True)


def voice_one(lang, n, who, text, fname, src, takes, only):
    fish = lang == "en"
    voice = f"fish:{who}" if fish else VOICE_TE[who]
    key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
    cached = sorted(takes.glob(f"{key}_*.wav"))
    best = (None, cached[0]) if cached and (KEEP or not only) else None   # --keep: an unchanged line keeps its take
    if best:
        print(f"{n:02d} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, lang), text, lang, n)[2]}", flush=True)
    for k in range(0 if best else 4):
        tmp = takes / f"{key}_{k}.wav"
        try:
            if fish:
                ref, ref_text = (NARRATOR if who == "aichat" else (REFS / f"ref_{who}.wav", REF[who][1]))
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
    level(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
