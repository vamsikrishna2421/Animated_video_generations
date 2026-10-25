# Creative 09 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Padma ma'am, Srinivas and Bunny = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's
# way, with Parler's English speakers); the AI chat app = the channel narrator (EP29's reference), through the light phone
# sound and judged after it. Telugu on Parler: ma'am = Lalitha (firm), Srinivas = Kiran (loud father), Bunny = Prakash
# (young), the app = Lalitha (calm) through the phone sound (the filter tells ma'am and the app apart). Line 8 reads the
# English card in both reels (the Telugu reel's starts in Telugu). Every take is levelled per sentence (EP36's `level`).
# MUST lists words a take has to contain (a missed word costs 1.5).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative09/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative09/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative09v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "teacher": ("Swapna speaks English with an Indian accent in a firm, clear, slightly stern but warm voice, like a school maths "
                "teacher in her forties, at a measured pace. The recording is very clear, close-up, with no background noise.",
                "Sit down, both of you. I have seen his homework every day, and I have seen his test. We need to talk about this."),
    "dad": ("Vikas speaks English with an Indian accent in a loud, frustrated and very expressive voice, like a father in his forties, "
            "at a fast pace. The recording is very clear, close-up, with no background noise.",
            "What is this? Every day I ask him, did you finish your homework? And every day he says yes, done, done!"),
    "bunny": ("Jatin speaks English with an Indian accent in a young, high, nervous and cheeky voice, like a thirteen-year-old "
              "schoolboy, at a quick pace. The recording is very clear, close-up, with no background noise.",
              "Sorry, sorry! I didn't think it was a big problem. Everybody in my class does it, I promise, ma'am."),
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav",
            "This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
            "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")
VOICE_TE = {
    "teacher": "Lalitha speaks in a firm, clear, slightly stern but warm voice like a school maths teacher in her forties, at a measured pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
    "dad": "Kiran speaks in a loud, frustrated and very expressive voice like an angry father, at a fast pace. "
           "The recording is very clear, close-up, studio quality, with no background noise.",
    "bunny": "Prakash speaks in a young, nervous, cheeky and expressive voice like a schoolboy, at a quick pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "aichat": "Lalitha speaks in a calm, clear, polite and friendly voice like a helpful assistant, at a measured pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
APP = {"aichat"}   # the app on his phone: the light phone sound
X = ("x", "ex", "eggs", "axe", "ax", "next")   # Whisper's spellings of the letter x
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("homework",), ("ten", "10"), ("every",), ("test",), ("two", "2"), ("twenty", "20")],
               2: [("two", "2", "to", "too"), ("bunny", "bunnie", "bunni", "buddy", "bonnie", "bony", "funny")],
               3: [("ai",), ("homework",), ("copied", "copy")], 4: [("ai",), ("passed", "pass")],
               5: [("more", "no"), ("phone",)], 6: [("ban",), ("change",), ("types", "type")],
               7: [("types", "type"), ("solve",), ("answer",)],
               8: [("type",), ("answer",), ("teach",), ("one", "1"), ("question",), ("time",)],
               9: [("sure",), ("first",), X, ("alone",)], 10: [("five", "5"), ("away",)],
               11: [("three", "3", "3x"), ("fifteen", "15"), ("next",)],
               12: [("divide", "divided"), ("three", "3"), ("five", "5"), ("got",)],
               13: [("tested", "test"), ("ten", "10"), ("solve",), ("answers", "answer"), ("line",), ("zero", "0"), ("questions", "question")],
               14: [("study",), ("thousand", "1000", "1,000"), ("answers", "answer"), ("exam",), ("seventeen", "17"), ("hints", "hint"), ("drop",)],
               15: [("tell",), ("answer",)], 16: [("sure",), ("equals", "equal", "is"), ("five", "5")],
               17: [("explain",), ("step",), ("one", "1"), ("bunny", "bunnie", "bunni", "buddy", "bonnie", "bony", "funny")],
               18: [("step",), ("one", "1"), ("ask",), ("ai",)]},
        "te": {1: [("होम", "हों", "होंव", "homework"), ("पदिकि", "पदकि", "पदिक", "पदि", "10"), ("टेस्ट", "टेस", "test"), ("इरवै", "इरव", "इर्व", "20"),
                   ("रेंडु", "रेंड", "रेण्डु", "रेन्डु", "2")],
               2: [("रेंडा", "रेंड", "रेण्ड", "रेन्ड"), ("बन्नी", "बनी", "बन्नि", "बनि", "बुन्नी")],
               3: [("होम", "हों", "homework"), ("आई", "एआई", "ऐआई", "ai", "ए.आई"), ("कापी", "कॉपी", "copy", "काफी")],
               4: [("आई", "एआई", "ऐआई", "ai", "ए.आई"), ("पास", "pass"), ("फेल", "फैल", "fail", "फेयल")],
               5: [("फोन", "फ़ोन", "phone"), ("बंद", "बन्द", "बांद")],
               6: [("बैन", "बेन", "ban", "बान"), ("टाइप", "टैप", "type"), ("मार्च", "मार्चं", "मारच")],
               7: [("सॉल्व", "सोल्व", "सॉल्फ", "solve", "साल्व", "सौल्व", "सल्व"), ("टाइप", "टैप", "type"), ("आन्सर", "आंसर", "answer", "ऑन्सर", "अन्सर")],
               8: [("टाइप", "टैप", "type"), ("आन्सर", "आंसर", "answer", "ऑन्सर", "अन्सर"), ("टीच", "teach", "टिच"),
                   ("क्वेश्चन", "क्वेस्चन", "question", "क्वेश्टन", "क्वेशन")],
               9: [("सरे", "सरी", "सरै"), ("एक्स", "एक्श", "x"), ("मुंदु", "मुन्दु", "मुंद")],
               10: [("ऐदु", "अइदु", "आइदु", "ऐदू", "5"), ("तीसे", "तीस", "तिसे", "थीसे")],
               11: [("करेक्ट", "करेक्त", "correct", "कोरेक्ट"), ("मूडु", "मूडू", "मुडु", "मूड", "3"), ("पदिहे", "पदहे", "पदिए", "15")],
               12: [("मूडु", "मूडू", "मुडु", "मूड", "3"), ("भागि", "भाग"), ("ऐदु", "अइदु", "आइदु", "ऐदू", "5"), ("वच्चे", "वचे", "वच्च")],
               13: [("टेस्ट", "टेस", "test"), ("सॉल्व", "सोल्व", "सॉल्फ", "solve", "साल्व", "सौल्व", "सल्व"), ("लैन", "लाइन", "line", "लाईन"),
                    ("सुन्ना", "सुन्न", "सुना", "0"), ("प्रश्न", "प्रशन", "प्रष्न", "प्रस्न")],
               14: [("स्टडी", "स्टडि", "study"), ("वेय्यि", "वेयि", "वेइ", "1000"), ("आन्सर", "आंसर", "answer", "ऑन्सर", "अन्सर"),
                    ("पदिहे", "पदहे", "पदिए", "17"), ("हिंट", "हिन्ट", "hint")],
               15: [("आन्सर", "आंसर", "answer", "ऑन्सर", "अन्सर"), ("चाल", "चालु", "चालू")],
               16: [("सरे", "सरी", "सरै"), ("एक्स", "एक्श", "x"), ("ऐदु", "अइदु", "आइदु", "ऐदू", "5")],
               17: [("स्टेप", "स्टैप", "step"), ("एक्सप्ले", "एक्सप्लै", "explain", "एक्स्प्ले"), ("बन्नी", "बनी", "बन्नि", "बनि")],
               18: [("स्टेप", "स्टैप", "step"), ("आई", "एआई", "ऐआई", "ai", "ए.आई"), ("अडग", "अडिग", "अडुग", "अड़ग", "अदग")]}}
# lines whose judge text needs digits (Whisper writes "10/10", "3x", "17%")
JUDGE_TEXT = {1: "Homework: 10 out of 10, every day. Class test: 2 out of 20!", 11: "Yes! Now 3x is 15. What next?",
              12: "Divide by 3... x is 5! I got it!", 13: "I tested 10 sums. Solve: 10 answers. With the line: 0. Only questions.",
              14: "A study of 1000 students found the same: AI that gave answers cut exam marks 17%. Hints? No drop.",
              16: "Sure! x equals 5."}
TELUGU = re.compile(r"[ఀ-౿]")
KEEP = False


def heard(path, who, lang):
    """The take as it goes into the reel: the app's lines through the light phone sound."""
    if who not in APP:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "creative09_judge.wav"
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
    sid = "creative09v1" if lang == "en" else "creative09te"
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
