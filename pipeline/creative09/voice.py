# Creative 09 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Padma ma'am, the dad and Kittu = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's
# way, with Parler's English speakers); the AI chat app = the channel narrator (EP29's reference), through the light phone
# sound and judged after it. Telugu on Parler: ma'am = Lalitha (firm), the dad = Kiran (loud father), Kittu = Prakash
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
    "kittu": ("Jatin speaks English with an Indian accent in a young, high, nervous and cheeky voice, like a thirteen-year-old "
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
    "kittu": "Prakash speaks in a young, nervous, cheeky and expressive voice like a schoolboy, at a quick pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "aichat": "Lalitha speaks in a calm, clear, polite and friendly voice like a helpful assistant, at a measured pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
APP = {"aichat"}   # the app on his phone: the light phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count). Telugu: Whisper
# writes Telugu in Devanagari (Hindi mode) and spells ḍ as द as often as ड, so both are listed.
KITTU = ("kittu", "kitu", "kittoo", "kitty", "kitto", "kito", "keto", "kidu", "kiddo", "kitoo", "ketu", "kit")   # "Kit-too" is heard "kit too"
KITTU_TE = ("किट्टू", "किट्टु", "कित्तु", "किट्ट", "किटू", "किट्टो", "कीटू", "किटु", "किट", "कि तु")
AI_TE = ("आई", "एआई", "ऐआई", "ai", "ए.आई", "एआइ", "ए आई", "आइ")
ANS_TE = ("आन्सर", "आंसर", "answer", "ऑन्सर", "अन्सर", "आनसर")
TYPE_TE = ("टाइप", "टैप", "type", "ताइप", "ताएप", "टाएब", "ताएट", "टाएप")
STEP_TE = ("स्टेप", "स्टैप", "step", "स्टेब", "स्तेप", "स्टप")
MUST = {"en": {1: [("homework",), ("ten", "10"), ("every",), ("test",), ("two", "2"), ("twenty", "20")],
               2: [("two", "2", "to", "too"), KITTU], 3: [("ai",), ("homework",), ("copied", "copy")], 4: [("ai",), ("passed", "pass")],
               5: [("more", "no"), ("phone",)], 6: [("ban",), ("answers", "answer"), ("seventeen", "17"), ("worse",)],
               7: [("hints", "hint"), ("drop",), ("change",), ("types", "type")],
               8: [("type",), ("answer",), ("teach",), ("one", "1"), ("question",), ("time",)],
               9: [("sure",), ("first",)], 10: [("five", "5"), ("away",), ("fifteen", "15")],
               11: [("great",), ("next",)], 12: [("divide", "divided"), ("three", "3"), ("five", "5"), ("got",)],
               13: [("tested", "test"), ("ten", "10"), ("solve",), ("answers", "answer"), ("line",), ("zero", "0")],
               14: [("tell",), ("answer",)], 15: [("fifteen", "15"), ("forty", "240"), ("thirty", "36")],
               16: [("seven", "7"), ("ten", "10"), ("check",), ("answers", "answer"), ("step",), ("one", "1")],
               17: [KITTU, ("explain",), ("step",)], 18: [("step",), ("one", "1"), ("ask",), ("ai",)]},
        "te": {1: [("होम", "हों", "होंव", "homework"), ("पदिक", "पदक", "पदि", "10"), ("टेस्ट", "टेस", "test"), ("इरव", "इर्व", "एरव", "येरव", "20"),
                   ("रेंडु", "रेंड", "रेण्डु", "रेन्डु", "रेंदु", "रेंदू", "रेन्दु", "2")],
               2: [("रेंडा", "रेंड", "रेण्ड", "रेन्ड", "रेंदा", "रेन्दा", "रेंद"), KITTU_TE],
               3: [("होम", "हों", "homework", "कोम"), AI_TE, ("कापी", "कॉपी", "copy", "काफी"), ("कोट्ट", "कोट", "कोठ", "कट्ट", "कोत्त")],
               4: [AI_TE, ("पास", "pass"), ("फेल", "फैल", "fail", "फेयल")],
               5: [("फोन", "फ़ोन", "phone", "फोल"), ("बंद", "बन्द", "बांद", "बन्त", "बंत", "banth", "bandh", "बान्द")],   # "bandh" is heard "bant"
               6: [("बंद", "बन्द", "बांद", "बन्त"), ANS_TE, ("पदिहे", "पदहे", "पदिए", "17", "पदेए", "पदि हे", "पादिज"),
                   ("पर्सेंट", "परसेंट", "percent", "पर्सेन्ट", "पर्सेंट्", "पर्सें", "परसें", "परसन")],
               7: [("हिंट", "हिन्ट", "hint", "इंस", "इंट", "हिंस", "इन्स", "इंचि"), ("तग्ग", "तगल", "तग", "थग्ग"), TYPE_TE, ("मार्च", "मार्चं", "मारच", "मरच")],
               8: [TYPE_TE, ANS_TE, ("टीच", "teach", "टिच", "तीच", "तीज", "टीज", "पीच"),
                   ("क्वेश्चन", "क्वेस्चन", "question", "क्वेश्टन", "क्वेशन", "कुस्चन", "ख्वस्टन", "क्वेस्ट", "कुस्च", "क्वेस्च")],
               9: [("सरे", "सरी", "सरै"), ("मुंदु", "मुन्दु", "मुंद", "मुंडु")],
               10: [("ऐदु", "अइदु", "आइदु", "ऐदू", "अयिदु", "5"), ("तीसे", "तीस", "तिसे", "थीसे", "सीस्ते", "सीसे"), ("फिफ्ट", "फिफ्टीन", "15", "fifteen", "टीन")],
               11: [("सूपर", "सुपर", "super", "सूपर्"), ("तर्वात", "तरवात", "तर्वाता", "तर्वा", "तरुवात")],
               12: [("त्री", "थ्री", "three", "3", "तरी", "त्रि"), ("डिवाइड", "डिवैड", "divide", "दिवाइड", "डिवाईड", "दिवेट", "दिवर्ट", "दिवैट", "डिवेट"),
                    ("ऐदु", "अइदु", "आइदु", "ऐदू", "अयिदु", "5"), ("वच्चे", "वचे", "वच्च", "वच्छे")],
               13: [("टेस्ट", "टेस", "test", "तेस्ट", "तस्ट"), ("सॉल्व", "सोल्व", "सॉल्फ", "solve", "साल्व", "सौल्व", "सल्व", "साल"), ("लैन", "लाइन", "line", "लाईन", "लैं", "लाईं", "लाइं"),
                    ("सुन्ना", "सुन्न", "सुना", "0")],
               14: [ANS_TE, ("चाल", "चालु", "चालू")],
               15: [("पदिहे", "पदहे", "पदिए", "15", "पदिख", "पादिख", "पदि हे", "पदिहें"), ("पर्सेंट", "परसेंट", "percent", "पर्सेन्ट", "पर्सें"),
                    ("मुप्प", "मुप्पै", "मुप्पइ", "मुप्पय", "36", "मोप्प", "मुपप")],
               16: [("एडु", "येडु", "एडू", "येडू", "एदु", "7", "येड", "एड"), STEP_TE, ("अडगंड", "अडगण्ड", "अडग", "अदगंड", "अडिगं", "अदग")],
               17: [KITTU_TE, STEP_TE, ("चेप्पु", "चप्पु", "चेप्पू", "चेपु", "चप्प", "चेप्प")],
               18: [STEP_TE, AI_TE, ("अडग", "अडिग", "अडुग", "अड़ग", "अदग", "अटेक", "अड़क")]}}
# lines whose judge text needs digits (Whisper writes "10/10", "3x", "17%")
JUDGE_TEXT = {1: "Homework: 10 out of 10, every day. Class test: 2 out of 20!", 2: "Two?! Kit too!", 17: "Kit too. Explain step one.",
              6: "Don't ban it. Kids who got AI answers did 17% worse than kids with no AI.", 10: "Take away the 5... 3x is 15?",
              12: "Divide by 3... x is 5! I got it!", 13: "I tested 10 sums. Solve: 10 answers. With the line: 0.",
              15: "15% of 240 is 36.", 16: "It gave in 7 times in 10. So don't check answers, sir. Ask step one."}
TELUGU = re.compile(r"[ఀ-౿]")
KEEP = False


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
        (takes / "_tries").mkdir(exist_ok=True)   # every try kept aside: the picker can keep a worse take than the ear would
        shutil.copy(tmp, takes / "_tries" / f"{n:02d}_{tmp.name}")
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
    if lang == "en" and who == "dad":
        gate(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
