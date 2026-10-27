# Creative 11 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself), as
# Creative 10's (pipeline/creative10/voice.py). English on Fish: Prasad, Lakshmi and Harika = Fish copies of Parler-made
# reference clips (`refs` makes them once with Parler's English speakers). Telugu on Parler: Prasad = Kiran (loud,
# excited), Lakshmi = Lalitha (loud, shocked), Harika = Lalitha (young, calm, dry). The AI summary is text only. Every take
# is levelled per sentence (EP36's `level`). MUST lists words a take has to contain (a missed word costs 1.5).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative11/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative11/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative11v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "prasad": ("Jatin speaks English with an Indian accent in a loud, excited, booming and very expressive voice, like a proud uncle in "
               "his fifties, at a fast pace. The recording is very clear, close-up, with no background noise.",
               "Listen, listen everyone! I have done it! Everything is booked and everything is ready. Get ready, all of you!"),
    "lakshmi": ("Sneha speaks English with an Indian accent in a loud, shocked, high and very expressive voice, like an aunt in her late "
                "forties, at a fast pace. The recording is very clear, close-up, with no background noise.",
                "What? Who said that? Nobody asked me! I clearly told everyone in the group that we are going to Ooty!"),
    "harika": ("Kavya speaks English with an Indian accent in a young, calm, dry and slightly sarcastic voice, like a college student, "
               "at a relaxed pace. The recording is very clear, close-up, with no background noise.",
               "Okay, everyone, relax. Nobody decided anything. Let me open the chat and read what we actually said."),
}
VOICE_TE = {
    "prasad": "Kiran speaks in a loud, excited, booming and very expressive voice like a proud uncle in his fifties, at a fast pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "lakshmi": "Lalitha speaks in a loud, shocked, high-pitched and very expressive voice like an aunt in her late forties, at a fast pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
    "harika": "Lalitha speaks in a young, calm, dry and slightly sarcastic voice like a college girl, at a relaxed pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused: the AI summary is text only
APP = set()
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count). Telugu groups
# (Whisper writes Telugu in Devanagari) start empty and are filled from the first takes.
MUST = {"en": {1: [("ai",), ("goa",), ("confirmed", "confirm"), ("booked", "book"), ("twelve", "12"), ("tickets", "ticket")],
               2: [("confirmed",), ("ooty", "ooti", "uti", "oo")],   # render review: "Confirm?" heard
               3: [("nobody",), ("confirmed", "confirm"), ("anything",)], "3b": [("poll", "pole"), ("tomorrow",)],
               4: [("ai",), ("read",), ("whole",), ("chat",)],
               5: [("asked",), ("decided", "decide")], "5b": [("picked", "pick"), ("goa",)],
               6: [("tested", "test"), ("chat",), ("ten", "10")], "6b": [("four", "4"), ("summaries", "summary"), ("decision",)],
               7: [("how",), ("check",)],
               8: [("quote",), ("message",), ("decision",)], "8b": [("none",), ("decided", "decide")],
               9: [("ten", "10"), ("decided", "decide")],
               10: [("fine",), ("decide",)],
               11: [("decided", "decide"), ("goa",)], "11b": [("quote",)],
               13: [("quote",), ("who",), ("said",)], "13b": [("everyone",), ("agreed", "agree")],
               14: [("see",), ("ai",), ("goa",)]},
        "te": {1: [("गोवा", "गोआ", "गोवाः"), ("चेप्पिं", "चेपिं", "चप्पिं", "चेप्प"), ("पन्नें", "पन्ने", "पनें", "पन्नेन"), ("बुक",)],   # the first takes: "चब लिए", "पनन्द"
               11: [("फिक्स", "फिक्", "पिक्स", "फ़िक्स"), ("गोवा", "गोआ")],   # "प्च्छ गोवा"
               "13b": [("ओके", "ओक", "ओखे", "okay", "ok", "ओकेय"), ("कादु", "कादू", "काधु", "काद")],   # "ఒప్పుకున్నారని" smeared in four takes: "ఓకే అన్నారని"
               14: [("चूसा", "चूशा", "चुसा", "चूस", "चूशा", "चूसार", "चूशे"), ("गोवा", "गोआ"), ("कनफम", "कन्फम", "कन्फर्म", "कनफर्म", "कन्फ़र्म")],   # render review: "कनफर्प" clipped
               8: [("कोट", "कोर्ट", "कोठ"), ("चेप", "चप्प", "चेब")], "8b": [("फिक्स", "पिक्स", "फिक्"), ("काले", "कालें"), ("चेप", "चप्प", "चेब")]}}   # "जूवा कनफर्म"
# lines whose judge text needs digits (Whisper writes "72", "10")
JUDGE_TEXT = {1: "The AI says Goa is confirmed! I've booked 12 tickets!", 6: "I tested our chat 10 times.", "6b": "4 summaries made up a decision.",
              9: "10 out of 10: not decided."}
TELUGU = re.compile(r"[ఀ-౿]")
KEEP = False
GATE = set()   # characters whose Fish takes carry a hum between words (filled from the first takes)


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
    out = Path(tempfile.gettempdir()) / "creative11_judge.wav"
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
    sid = "creative11v1" if lang == "en" else "creative11te"
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
