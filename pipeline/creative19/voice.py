# Creative 19 voices, as Creative 18's (pipeline/creative18/voice.py): one judged take per line, cached by text + voice.
# English on Fish: Sai, Venkat Rao garu and Pinky = Fish copies of Parler-made reference clips (`refs`). Telugu on Parler:
# Sai = Kiran, Venkat Rao garu = Prakash, Pinky = Lalitha. The AI chat is text only. MUST groups: Whisper's real
# spellings, as short substrings (ROUTINE, Nov 4).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative19/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative19/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative19v1/refs"
REF = {
    "sai": ("Raghav speaks English with an Indian accent in a frustrated, quick and indignant young voice, like a man of thirty "
            "who has just lost half his deposit, at a fast pace. The recording is very clear, close-up, with no background noise.",
            "Half of my money, just like that? I paid every month on time, and this is what I get back!"),
    "venkat": ("Vikas speaks English with an Indian accent in a loud, proud and stubborn voice, like a landlord of sixty-two who is "
               "sure he is right, at a moderate pace. The recording is very clear, close-up, with no background noise.",
               "I gave you a fresh flat, young man. Look at these walls now. Who will pay for all this painting?"),
    "pinky": ("Riya speaks English with an Indian accent in a bright, loud and playful voice, like a fourteen-year-old girl "
              "announcing a boxing match, at a fast pace. The recording is very clear, close-up, with no background noise.",
              "Ladies and gentlemen, in the red corner, my grandfather! And in the blue corner, our tenant!"),
}
VOICE_TE = {
    "sai": "Kiran speaks in a frustrated, quick and indignant voice, at a moderate pace. "
           "The recording is very clear, close-up, studio quality, with no background noise.",
    "venkat": "Prakash speaks in a loud, proud and stubborn voice, at a moderate pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "pinky": "Lalitha speaks in a bright, loud and playful voice, at a fast pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused: the AI chat is text only
APP = set()
CK = ("करेक्ट", "करेक", "करेट", "करैक्ट", "कारेक्ट", "करक्त", "करिक्त", "करेक्त", "करक", "करिक", "करट", "करेक्ते")
MUST = {"en": {1: [("thirty", "30", "30,000", "30000"), ("advance",), ("fifteen", "15", "15,000", "15000"), ("back",)],
               2: [("repainting", "painting"), ("eighteen", "18", "18,000", "18000"), ("fifteen", "15"), ("fair",)],
               3: [("asked",), ("same",), ("excessive",)], 4: [("tatha", "thatha", "tata", "tha", "taa"), ("both",), ("right",), ("referee", "refree")],
               5: [("both",), ("right",)], 6: [("wait",), ("fifteen", "15"), ("excessive",), ("painting",), ("eighteen", "18")],
               7: [("close",), ("leans", "lean"), ("whoever",)], "7b": [("stanford",), ("eleven", "11"), ("chatbots", "chatbot"), ("took",), ("side",), ("half", "1.5", "5"), ("people",)],
               8: [("tested",), ("laptop",), ("ten", "10"), ("tries",)], "8b": [("landlord",), ("fair",), ("tenant",), ("excessive",), ("nine", "9")],
               10: [("right",)], "10b": [("side",), ("message",), ("fair",)], 11: [("both",), ("sides",)],
               "11b": [("every",), ("three", "3", "3,000", "3000"), ("seven", "7", "7,500", "7500"), ("small",), ("repaint",), ("suggestion",), ("verdict",)],
               12: [("fine",), ("right",), ("yes",)], 13: [("right",), ("yes",), ("too",)]},
        "te": {1: [("मुप्प", "मुपै", "मुप", "30"), ("पदि", "पद्", "पदहे", "15")], 2: [("पेंटिं", "पेइंटिं", "पैंटिं", "पेटिं", "पेन्टि", "पेंटि", "पैन्टि"), ("पद्दे", "पदे", "पद्दॆ", "पद्द", "18"), ("न्याय", "न्या", "नाय", "नयम", "न्यम")],
               3: [("चाट", "चैट", "चाड", "चार्ट", "चात"), ("एक्कुव", "एक्कव", "एकुव", "एक्कु", "येक्कु", "एको", "एक्को")], 4: [("ताता", "तात", "थाता"), CK, ("रिफरी", "रेफरी", "रिफ्री", "रेफ्री", "रफरी", "रिफ़री", "रेफ़री")],
               5: [("इद्दर", "इदर", "इद्ध", "इद्द", "इत्ट"), CK], 6: [("निमिष", "निमि", "नमिष"), ("पदि", "पद्", "15"), ("पेंटिं", "पेइंटिं", "पैंटिं", "पेटिं", "पेन्टि", "पेंटि", "पैन्टि")],
               7: [("पाइंट", "पॉइंट", "पोइंट", "पायिंट", "पॉंट", "पोईंट", "पाईंट"), ("माट्ला", "मात्ला", "माट्ल", "मातला", "माटला")], "7b": [("पेद्द", "पेद", "पॆद्द", "पेड्ड", "पट्द", "प्यद"), ("इंते", "इन्ते", "इंत", "इते", "इंटे")],
               8: [("लाप", "लैप", "लॅप", "लेप", "लब्ट", "लाव्ट"), ("चाट", "चैट", "चाड", "चार्ट", "चात", "चार्द"), ("चेरो", "चॆरो", "चेरु", "चेर")], "8b": [("ओनर", "ओनार", "ओनर्", "ऑनर", "ूनर", "ोूनर"), ("टेनें", "टेनेन", "टेनं", "टैनें", "टेनॆं", "तनें", "तेनें", "तेनें"), ("तोम्मि", "तॊम्मि", "तम्मि", "तोमि", "तुम्मि", "9")],
               10: [CK], "10b": [("मेसेज", "मैसेज", "मेसज", "मॆसेज"), ("न्याय", "न्या", "नाय")], 11: [("रेंडु", "रेंड", "रेडु", "रॆंडु", "रेंद"), ("चेप्ते", "चप्ते", "चेबते", "चबते", "चेप्त")],
               "11b": [("प्रति", "प्रत", "परति"), ("मूडु", "मूड", "मुडु", "मुड", "3"), ("एडुन", "येडुन", "एडन", "एडुं", "7"), ("डैमे", "डेमे", "डामे", "ड्यामे", "डॅमे", "दामे"), ("सलहा", "सलाह", "सलह"), ("तीर्प", "तीरपु", "तीर्पु", "तिर्प")],
               12: [CK, ("अवुन", "अउन", "अवन", "अवुं")], 13: [CK, ("अवुने", "अवुन", "अउने", "अवने", "अवुं")]}}
JUDGE_TEXT = {1: "30,000 advance, 15,000 back?!", 2: "Repainting is 18,000, I cut only 15,000! Even the AI says it's fair!",
              8: "We tested our laptop AI, 10 tries each.",
              "8b": 'Landlord: "fair", 10 of 10. Tenant: "excessive", 9 of 10.', "11b": "every try said 3,000 to 7,500: for the small damage, not a full repaint. Still a suggestion, not a verdict.", 6: "Wait... 15 is excessive, because painting costs 18?!", "7b": "Stanford tested 11 chatbots: they took the user's side one and a half times as often as people did."}
TELUGU = re.compile(r"[ఀ-౿]")
KEEP = False
GATE = set()   # characters whose Fish takes carry a hum between words (none so far)


def gate(path, floor_db=-40.0):
    """Silence the pauses inside a take (20 ms frames under floor_db, with 10 ms fades): the English dad's Fish takes
    carry a steady ~150 Hz tone (about -45 dBFS) between words (Priya, render review)."""
    a, sr = sf.read(path)
    mono = a.mean(axis=1) if a.ndim > 1 else a
    hop = int(0.02 * sr)
    n = len(mono) // hop
    rms = np.sqrt((mono[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    g = (20 * np.log10(rms) > floor_db).astype(float)
    g = np.maximum(g, np.maximum(np.r_[g[1:], 0], np.r_[0, g[:-1]]))   # keep a frame either side of speech
    env = np.repeat(g, hop)
    env = np.r_[env, np.full(len(mono) - len(env), env[-1] if len(env) else 1.0)]
    k = max(1, int(0.01 * sr))
    env = np.convolve(env, np.ones(k) / k, mode="same")
    out = a * (env[:, None] if a.ndim > 1 else env)
    sf.write(path, out.astype(np.float32), sr)


def heard(path, who, lang):
    """The take as it goes into the reel: the app's lines through the light phone sound."""
    if who not in APP:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "creative19_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, True)
    sf.write(out, x.astype(np.float32), sr)
    return out


def judge(path, text, lang, n):
    """English lines get the English judge, against the line with digits where Whisper writes digits; Telugu lines (line 8
    of the Telugu reel too: it starts in Telugu) get EP33's Telugu judge with creative 08's length limit; MUST words are
    checked on the transcript."""
    jl = "en" if lang == "en" or not TELUGU.search(text) else "te"
    ref = JUDGE_TEXT.get(n, text) if jl == "en" and lang == "en" else text
    ok, score, info = judge_en(path, ref, "en") if jl == "en" else judge_te(path, text)
    if jl == "te" and "LONG" in info and "BABBLE" not in info:   # EP33's length limit (0.11 s a letter) was set for a flat
        a, sr = sf.read(path)                                      # AI voice; these characters shout and pause: 0.15
        m = re.search(r"dev ([\d.]+) rate ([\d.]+)", info)
        if m and float(m.group(1)) >= 0.85 and 9 <= float(m.group(2)) <= 23 and len(a) / sr <= max(2.8, len(re.sub(r"\s", "", text)) * 0.15):
            ok, score, info = True, score + 1, info.replace("LONG ", "")
    heard_text = info.split("|", 1)[1].lower()
    if jl == "te":   # a stutter the judge lets through (EP41's check: a word said twice in a row)
        toks = [w.strip(".,!?।") for w in heard_text.split()]
        if any((len(x) >= 2 and (x == y or y.startswith(x))) for x, y in zip(toks, toks[1:])):
            ok, score, info = False, score - 1.0, info + " | STUTTER"
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    groups = MUST[jl].get(n, [])
    miss = [g[0] for g in groups if not any((w in words) if jl == "en" else (w in heard_text) for w in g)]
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
    sid = "creative19v1" if lang == "en" else "creative19te"
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
            parts = [(line.get("tts") or line["text"], line["file"], n)] + ([(line["tts2"], line["file2"], f"{n}b")] if line.get("file2") else [])
            for raw, fname, mk in parts:   # a two-take line: the second take has its own MUST entry ("3b")
                text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
                voice_one(lang, mk, who, text, fname, src, takes, only)
    print("VOICE_DONE", flush=True)


def voice_one(lang, n, who, text, fname, src, takes, only):
    tagn = f"{n:02d}" if isinstance(n, int) else f"{int(n[:-1]):02d}b"
    fish = lang == "en"
    voice = f"fish:{who}" if fish else VOICE_TE[who]
    key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
    cached = sorted(takes.glob(f"{key}_*.wav"))
    best = (None, cached[0]) if cached and (KEEP or not only) else None   # --keep: an unchanged line keeps its take
    if best:
        print(f"{tagn} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, lang), text, lang, n)[2]}", flush=True)
    for k in range(0 if best else 4):
        tmp = takes / f"{key}_{k}.wav"
        try:
            if fish:
                ref, ref_text = (NARRATOR if who == "aichat" else (REFS / f"ref_{who}.wav", REF[who][1]))
                fish_say(text, str(tmp), ref=str(ref), ref_text=ref_text)
            else:
                say(lang, text, tmp, voice=voice, pause=0.2)
        except RuntimeError as e:   # Fish's gateway errors can outlast its own retries: count it as a failed try
            print(f"{tagn} {who} try {k}: failed to voice ({e})", flush=True)
            continue
        trim(tmp)
        (takes / "_tries").mkdir(exist_ok=True)   # every try kept aside: the picker can keep a worse take than the ear would
        shutil.copy(tmp, takes / "_tries" / f"{tagn}_{tmp.name}")
        ok, score, info = judge(heard(tmp, who, lang), text, lang, n)
        print(f"{tagn} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
        if best is None or (best[0] is not None and score > best[0]):
            best = (score, tmp)
        if ok:
            break
    if best is None:
        print(f"{tagn} {who}: NO TAKE (every try failed)", flush=True)
        return
    if best[0] is not None:   # keep only the chosen take in the cache
        for f in takes.glob(f"{key}_*.wav"):
            if f != best[1]:
                f.unlink()
    shutil.copy(heard(best[1], who, lang), src / fname)
    level(src / fname)
    if lang == "en" and who in GATE:
        gate(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
