# EP44 voices, as Creative 16's (pipeline/creative16/voice.py): one judged take per line, cached by text + voice (a changed
# line only re-voices itself). English on Fish: Amma and Chinnu = Fish copies of Parler-made reference clips (`refs` makes
# them once with Parler's English speakers). Telugu on Parler: Amma = Lalitha (a mother), Chinnu = Kiran (a teenage son).
# The AI chat is text only. Every take is levelled per sentence (EP36's `level`). MUST lists words a take has to contain
# (a missed word costs 1.5); every Telugu line gets some (Creative 15: a babble passed without them).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep44/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep44/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/ep44v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "amma": ("Sneha speaks English with an Indian accent in a warm, worried and very expressive voice, like a mother in her "
             "forties at home who has just found out she made a mistake, at a moderate pace. The recording is very clear, "
             "close-up, with no background noise.",
             "Wait, wait, what did I do? I only wanted to know where my salary goes every month, that is all I asked!"),
    "chinnu": ("Aakash speaks English with an Indian accent in a young, quick and alarmed voice, like a fifteen-year-old boy "
               "telling his mother something urgent, at a fast pace. The recording is very clear, close-up, with no "
               "background noise.",
               "Amma, listen to me, this is important, okay? Don't paste your bank details into that app again, please!"),
}
VOICE_TE = {
    "amma": "Lalitha speaks in a warm, worried and very expressive voice like a mother at home, at a moderate pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "chinnu": "Kiran speaks in a young, quick and alarmed voice like a teenage boy, at a moderate pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused: the AI chat is text only
APP = set()
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count). Telugu groups in
# Devanagari (Whisper writes Telugu so).
MUST = {"en": {1: [("tap",), ("delete",), ("gemini", "gemini's", "geminis"), ("reviewers", "reviewer"), ("three", "3"), ("years",)],
               2: [("account",), ("number",), ("pan",)],
               3: [("reviewers", "reviewer"), ("company",), ("read",), ("improve",)], "3b": [("copy",), ("deleted",), ("delete",)],
               4: [("asked",), ("salary",)],
               5: [("gemini", "gemini's", "geminis"), ("privacy",), ("type",), ("reviewer",), ("see",)],
               6: [("needs", "need"), ("details",), ("help",)],
               7: [("tested", "test"), ("statement",), ("ten", "10"), ("numbers", "number")], "7b": [("ten", "10"), ("blanked", "blank")],
               8: [("and",)],
               9: [("without",), ("numbers", "number"), ("found",), ("food",), ("orders", "order"), ("never",), ("pan",)],
               10: [("blank",)],
               11: [("name",), ("account",), ("pan",), ("blank",), ("paste",)], "11b": [("gemini", "gemini's"), ("switch",), ("keep",), ("activity",)],
               12: [("done",), ("passbook", "pass"), ("photo",)],
               13: [("amma", "mama", "ama"), ("photo",), ("account",)]},
        "te": {1: [("डिलीट", "डिलिट", "दिलिट"), ("गूगुल", "गुगुल", "गूगल", "गुगल", "गॉगल", "गुएगल", "गूग", "गुग"), ("मूडे", "मुडे", "मुडय", "मूडय", "मूडेल", "मुडिय")],   # Whisper's spellings, from the first run
               2: [("अकौंट", "अकाउंट", "अकोंट", "एकाउन्त", "अकोंत", "अक्कों"), ("नंबरू", "नम्वरू", "नंबर")],
               3: [("चाट",), ("कंपनी", "कम्पनी", "कमपनी", "कंपनि")], "3b": [("कापी", "कॉपी", "खापी", "कोपी", "अपी")],
               4: [("जीत", "जित")], 5: [("जेमि", "जमिनी", "जेमीनी", "जमनी", "जेमनी", "जेविन"), ("टैप", "टाइप", "ताइप", "दैप", "ताइ", "टाई"), ("चेयकु", "चेयकू", "चेकु", "चेयक", "चेक", "चाएक", "चेखु")],
               6: [("साय", "सायं", "सायम")], 7: [("पदि", "पद्दि", "बदि")], "7b": [("पदि", "पद्दि", "पादि")],
               9: [("डेलिवरी", "डेलीवरी", "डेलवरी", "डिलिवरी", "डेलिवरि"), ("पां", "पान", "पों")], 10: [("सरिपो", "सरीपो")],
               11: [("पेस्ट", "पेष्ट", "पेश्ट", "पैषट"), ("तीसे", "तिसे", "ठीसे"), ("नंबर", "नम्बर", "नमबर", "नम्वर", "नुमबर", "नमपर")], "11b": [("कीप", "कीब", "किप"), ("आफ", "ऑफ", "आफ़", "अफ")], 12: [("फोटो", "फ़ोटो"), ("पास",)], 13: [("फोटो", "फ़ोटो", "पोटो", "फोट")]}}
JUDGE_TEXT = {1: "One tap to delete, Amma... but if Gemini's reviewers read it, it can stay 3 years!", 7: "We tested it. Your statement, 10 times with your numbers,",
              "7b": "10 times with them blanked out.", }
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
    out = Path(tempfile.gettempdir()) / "ep44_judge.wav"
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
    sid = "ep44v1" if lang == "en" else "ep44te"
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
