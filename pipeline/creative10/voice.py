# Creative 10 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Thathayya, Kamala and Sravani = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's way,
# with Parler's English speakers); the AI chat app = the channel narrator (EP29's reference), through the light phone
# sound and judged after it. Telugu on Parler: Thathayya = Kiran (old, shaky, dramatic), Kamala = Lalitha (loud, anxious),
# Sravani = Lalitha (young, dry), the app = Lalitha (calm) through the phone sound. Line 7 reads the English card in both
# reels (the Telugu reel's starts in Telugu). Every take is levelled per sentence (EP36's `level`).
# MUST lists words a take has to contain (a missed word costs 1.5).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative10/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative10/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative10v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "thatha": ("Dinesh speaks English with an Indian accent in a shaky, dramatic and emotional elderly man's voice, like a grandfather "
               "in his seventies, at a slow pace. The recording is very clear, close-up, with no background noise.",
               "Oh God, what is all this? I take my tablets every single day, and still this phone is telling me such terrible things!"),
    "kamala": ("Meera speaks English with an Indian accent in a loud, anxious, high and very expressive voice, like a worried woman in "
               "her forties, at a fast pace. The recording is very clear, close-up, with no background noise.",
               "What happened? Who is shouting like this? Sit down, sit down, I am coming! Did you take your tablets this morning?"),
    "sravani": ("Riya speaks English with an Indian accent in a young, calm, dry and slightly sarcastic voice, like a college student, "
                "at a relaxed pace. The recording is very clear, close-up, with no background noise.",
                "Relax, everyone. Nobody is dying today. Give me the phone, and let me read what it actually says."),
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav",
            "This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
            "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")
VOICE_TE = {
    "thatha": "Kiran speaks in a shaky, dramatic and emotional voice like an old grandfather in his seventies, at a slow pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "kamala": "Lalitha speaks in a loud, anxious, high-pitched and very expressive voice like a worried woman in her forties, at a fast pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "sravani": "Lalitha speaks in a young, calm, dry and slightly sarcastic voice like a college girl, at a relaxed pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
    "aichat": "Lalitha speaks in a calm, clear, polite and friendly voice like a helpful assistant, at a measured pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
APP = {"aichat"}   # the app on his phone: the light phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count). Telugu: Whisper
# writes Telugu in Devanagari (Hindi mode); the Telugu groups start loose and are tightened from the first takes.
LADDU = ("laddus", "laddu", "ladoos", "ladus", "laddoos", "lado", "ladoo", "laddoo", "ladu", "lados", "latus")
MUST = {"en": {1: [("ai",), ("two", "2"), ("three", "3"), ("months", "month")], 2: [("three", "3"), ("months", "month")],
               3: [("give",), ("that",)], 4: [("average",), ("past",), ("months", "month"), ("test",), ("countdown", "count")],
               5: [("haemoglobin", "hemoglobin"), ("shorter",), ("life",), ("expectancy",)],
               6: [("typed", "type"), ("three", "3"), ("doctors", "doctor"), ("reading",)],
               7: [("doctor",), ("type",), ("explain",), ("seventy", "72"), ("grandfather",), ("simple",), ("questions", "question")],
               8: [("report",), ("card",), ("sugar",), ("higher",), ("ideal",), ("doctor",), ("health",)],
               9: [("tested", "test"), ("ten", "10"), ("three", "3"), ("doctor",), ("zero", "0")],
               10: [("ai",), ("explains", "explain")], 11: [("doctor",), ("decides", "decide")], 12: [("dying", "die")],
               13: [("live",), LADDU], 14: [("question",), LADDU]},
        "te": {1: [("नेल", "नेला", "नेलले", "नेलल", "नेले", "नलल", "नलले"), ("टाइम", "टैम", "time", "टेम", "ताईम", "ताइम", "ताईं", "ताइं")],
               2: [("नेल", "नेला", "नेलला", "नेलल")], 3: [("फोन", "फ़ोन", "phone", "फो")],
               4: [("टेस्ट", "टेस", "test", "तेस्ट"), ("काउंट", "कौंट", "count", "कांट", "काउन्ट", "काूंट", "काूं", "कांड", "डाउन", "down")],
               6: [("टाइप", "टैप", "type", "ताइप"), ("डॉक्टर", "डाक्टर", "doctor", "डोक्टर")],
               7: [("explain", "एक्सप्लेन", "एक्सप्लेइन"), ("grandfather", "ग्रैंडफादर", "ग्रांडफादर", "ग्रेंडफादर", "फादर"),
                   ("simple", "सिंपल", "सिम्पल"), ("doctor", "डॉक्टर", "डाक्टर")],
               8: [("रिपोर्ट", "रिपोर्", "report", "रेपोर्ट"), ("डॉक्टर", "डाक्टर", "doctor", "डोक्टर")],
               9: [("टेस्ट", "टेस", "test", "तेस्ट"), ("सुन्ना", "सुन्न", "सुना", "0"), ("डॉक्टर", "डाक्टर", "doctor", "डोक्टर")],
               11: [("डॉक्टर", "डाक्टर", "doctor", "डोक्टर")], 13: [("लड्डू", "लड्डु", "लडू", "लड्ड", "लड्")], 14: [("लड्डू", "लड्डु", "लडू", "लड्ड", "लड्")]}}
# lines whose judge text needs digits (Whisper writes "72", "10")
JUDGE_TEXT = {2: "Three months?! Mavayya!", 3: "Thathayya. Give me that.",
              4: "Average blood sugar over the past two to three months. It's a test, Thathayya. Not a countdown.",
              7: "Before the doctor visit, type this: Explain this to my 72-year-old grandfather in simple words. Then give 3 questions to ask his doctor.",
              9: "I tested a small free AI 10 times. 3 words: doctor-talk every time. With the line: 0."}
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
    out = Path(tempfile.gettempdir()) / "creative10_judge.wav"
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
    sid = "creative10v1" if lang == "en" else "creative10te"
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
    if lang == "en" and who in GATE:
        gate(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
