# Creative 07 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Ramya, the HR manager (a man: Telugu has one female voice, kept for Ramya and Divya), Divya and the AI coach
# (gushing, and a second "strict" reference for the line where it turns strict) = Fish copies of Parler-made reference clips
# (`refs` makes them once, skit 02's way, with Parler's English speakers). The coach is an app on her phone: its lines go
# through the light phone sound, and are judged after it. Telugu on Parler: Ramya and Divya = Lalitha (two styles), HR =
# Prakash, the coach = Kiran (bubbly; stern for the strict line); the strict judge. Every take is levelled per sentence
# (EP36's `level`). MUST lists words a take has to contain (a missed word costs 1.5).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative07/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative07/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative07v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "ramya": ("Kavya speaks English with an Indian accent in a young, bright, expressive voice, like a fresh graduate in her early "
              "twenties, at a natural pace. The recording is very clear, close-up, with no background noise.",
              "I have my interview tomorrow at ten, and I have practised my answer twenty times already. I think I am ready."),
    "coach": ("Aakash speaks English with an Indian accent in an extremely cheerful, bubbly, over-the-top enthusiastic voice, like a "
              "motivational coach, at a lively pace. The recording is very clear, close-up, with no background noise.",
              "Wow, that is incredible! You are a superstar! Honestly, that was the best answer I have ever heard, amazing!"),
    "strict": ("Aakash speaks English with an Indian accent in a calm, serious, firm, no-nonsense voice, like a strict examiner, at a "
               "measured pace. The recording is very clear, close-up, with no background noise.",
               "Let us be honest. This answer is weak. It has no example, no numbers, and nothing about the job. Fix it."),
    "hr": ("Dinesh speaks English with an Indian accent in a firm, deep, dry, unimpressed voice, like a senior HR manager in his "
           "fifties, at a measured pace. The recording is very clear, close-up, with no background noise.",
           "Thank you for coming. We have met many candidates today. Please tell me something we have not heard already."),
    "divya": ("Priya speaks English with an Indian accent in a young, hopeful, slightly nervous voice, like a student in her early "
              "twenties, at a natural pace. The recording is very clear, close-up, with no background noise.",
              "Okay, okay, my turn now. I wrote my answer last night. Can you please check it once before I sleep?"),
}
VOICE_TE = {
    "ramya": "Lalitha speaks in a young, bright, expressive voice like a fresh graduate, at a natural pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "divya": "Lalitha speaks in a high-pitched, quick, playful voice like a cheerful teenage girl, at a fast pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",   # not Ramya (same speaker)
    "coach": "Kiran speaks in an extremely cheerful, bubbly, enthusiastic voice like a motivational coach, at a lively pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "strict": "Kiran speaks in a calm, serious, firm voice like a strict examiner, at a measured pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "hr": "Prakash speaks in a firm, dry, unimpressed voice like a senior HR manager, at a measured pace. "
          "The recording is very clear, close-up, studio quality, with no background noise.",
}
VOICE_TE_LINE = {}
APP = {"coach", "strict"}   # the coach is an app on her phone: the light phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("perfect",), ("ten", "10")], 2: [("forty", "40"), ("exact",), ("today",), ("next",)],
               3: [("five", "5"), ("rejections", "rejection"), ("perfect",)], 4: [("believe",), ("yourself", "self")],
               5: [("praise",), ("everything",)], 6: [("thumbs", "thumb"), ("nice",)], 7: [("truth",)],
               8: [("strict",)], 9: [("strict",), ("fair",), ("interviewer",), ("ten", "10"), ("weaknesses", "weakness"), ("first",)],
               10: [("ten", "10"), ("example",), ("hardworking", "hard"), ("job",)], 11: [("ouch",), ("true",)],
               12: [("tell",), ("yourself",)], 13: [("internship",), ("billing",), ("errors", "error"), ("half",)],
               14: [("ai",), ("answer",)]},
        "te": {1: [("पर्फ", "परफ", "पर्फे", "परफे", "perfect"), ("पदिकि", "पदिक", "पदी", "10")],
               2: [("नलभ", "नलब", "नल्भ", "40"), ("नेक्स", "नेक्स्ट", "next")],
               3: [("ऐदु", "अइदु", "5", "ऐडु", "ऐदू", "आइदू", "आइदु", "आईदु"), ("रिजेक्", "रिजक", "रीजेक्", "रिजेक", "रेजेक्", "रेजक", "reject"),
                   ("पर्फ", "परफ", "perfect")],
               4: [("बिली", "बिलि", "believe"), ("सेल्फ", "सेल्फ़", "self", "सेल")],
               5: [("पोगु", "पोगड", "पोगुडु", "पोगड़", "पोगुड़", "पॊगु", "पुगु", "पोगी")],
               6: [("मेच्चु", "मेचु", "मेच", "मॆच्चु", "मच्चु", "मैच"), ("लैक", "लाइक", "like", "लाईक", "लेक")],
               7: [("निजम", "निजं", "निज", "नीजम"), ("तेलु", "तेलुस्", "तेलस", "तॆलु", "तेलि", "थेलि", "थेलु")],
               8: [("स्ट्रिक्ट", "स्ट्रिक", "strict", "स्त्रिक्ट", "स्ट्रिट", "स्ट्रिक्", "स्ट्रेक्ट", "स्त्रिक्त", "स्ट्रिक्त", "स्त्रिक")],
               9: [("स्ट्रिक्ट", "स्ट्रिक", "strict"), ("फेयर", "फेर", "फ़ेयर", "fair"), ("इंटरव्यू", "इंटर्व्यू", "इंटर", "interview")],
               "9b": [("पदिकि", "पदिक", "10"), ("मार्कु", "मार्क", "मार्", "mark"), ("लोपा", "लोप", "लॊपा")],
               10: [("पदिकि", "पदिक", "10"), ("एग्जा", "एग्ज़ा", "example", "इग्जा", "एक्जा")],
               "10b": [("हार्ड", "हर्ड", "hard"), ("जॉब", "जाब", "job", "जोब")],
               11: [("अब्बा", "अबा", "अब्ब", "अभा"), ("निजम", "निजं", "निज", "नीजम")],
               12: [("टेल", "टैल", "tell", "तेल"), ("सेल्फ", "सेल्फ़", "self", "yourself", "सेल")],
               13: [("इंटर्न", "इंटरन", "intern", "इंटर", "इंटन"), ("बिलि", "बिल्लि", "billing", "बिलिं", "बिल्लिं"), ("एरर", "एर्रर", "इरर", "error", "एरार"),
                    ("सगा", "सग", "सघा")],
               14: [("कोच", "coach", "कोछ", "कॊच"), ("आन्स", "आंस", "answer", "आन्सर", "अन्स", "अंस"), ("एला", "येला", "इला", "ऐला")]}}   # Telugu as the judge writes it (Devanagari)
# English lines inside the Telugu reel (judged by the English judge)
MUST_TE_EN = {4: [("believe",), ("yourself", "self")], 9: [("strict",), ("fair",), ("interviewer",)], 12: [("tell",), ("yourself",)]}
# line 10's score is our test's average, rounded (make_specs): its word joins the MUST list from the spec's text
NUM_MUST = {"en": {"one": ("one", "1"), "two": ("two", "2"), "three": ("three", "3"), "four": ("four", "4"), "five": ("five", "5")},
            "te": {"ఒకటి": ("ओकटि", "ओकटी", "1"), "రెండు": ("रेंडु", "रेंडू", "रेण्डु", "2"), "మూడు": ("मूडु", "मूडू", "मुडु", "3"),
                   "నాలుగు": ("नालुगु", "नालगु", "नालुग", "4"), "ఐదు": ("ऐदु", "अइदु", "ऐडु", "5")}}


def must(lang, n, text, te_en=False):
    groups = list(MUST_TE_EN.get(n, []) if te_en else MUST[lang].get(n, []))
    if n == 10:   # whole words only: "one" is inside "everyone"
        toks = set(re.findall(r"\w+", text.lower() if lang == "en" else text))
        groups += [g for word, g in NUM_MUST[lang].items() if word in toks]
    return groups


KEEP = False


def heard(path, who, lang, n=None):
    """The take as it goes into the reel: the coach's lines through the light phone sound."""
    if who not in APP:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "creative07_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, True)
    sf.write(out, x.astype(np.float32), sr)
    return out


def level(path, under=4.0, cap=12.0):
    """Parler voices each sentence on its own and one can come out far quieter (EP36's Telugu line 16: the second
    sentence 11 dB under the first). A voiced stretch (0.3 s or longer) more than `under` dB below the take's loudest
    stretch is raised to 2 dB under it, at most `cap` dB, with 20 ms ramps."""
    x, sr = sf.read(path)
    mono = x.mean(1) if x.ndim > 1 else x
    hop = int(sr * 0.02)
    db = np.array([20 * np.log10(np.sqrt(np.mean(mono[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(mono) - hop, hop)])
    voiced, spans, i = db > -45, [], 0
    while i < len(db):   # a stretch ends after 0.16 s under -45 dB
        if not voiced[i]:
            i += 1
            continue
        j, quiet = i, 0
        while j < len(db) and quiet < 8:
            quiet = quiet + 1 if not voiced[j] else 0
            j += 1
        spans.append((i * hop, (j - quiet) * hop))
        i = j
    spans = [(a, b) for a, b in spans if b - a >= int(0.3 * sr)]
    lv = [20 * np.log10(np.sqrt(np.mean(mono[a:b] ** 2)) + 1e-9) for a, b in spans]
    if len(spans) < 2:
        return
    ref = max(lv)   # not the median: when most stretches are the quiet ones, the median is quiet too
    gain = np.ones(len(mono))
    for (a, b), l in zip(spans, lv):
        if l < ref - under:
            g = 10 ** (min(cap, ref - 2 - l) / 20)
            ramp = min(hop, (b - a) // 4)
            env = np.full(b - a, g)
            env[:ramp] = np.linspace(1, g, ramp)
            env[len(env) - ramp:] = np.linspace(g, 1, ramp)
            gain[a:b] = env
    if np.all(gain == 1):
        return
    y = x * (gain[:, None] if x.ndim > 1 else gain)
    peak = np.max(np.abs(y))
    if peak > 0.98:
        y *= 0.98 / peak
    sf.write(path, y.astype(np.float32), sr)


DIGITS = {"one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "nine": "9", "ten": "10", "forty": "40"}


TELUGU = re.compile(r"[\u0C00-\u0C7F]")


def judge(path, text, lang, n):
    """n: the line number (int), or "<n>b" for the second take of a two-take line. English: Whisper writes "10" for
    "ten", so the judge compares against the line with digits (line 1 failed four clean takes at hit 0.67 without).
    An English line inside the Telugu reel (4, 12) gets the English judge: the Telugu one heard a clean "Believe in
    yourself." as "बीलीग यो स्वफ"."""
    jl = "en" if lang == "en" or not TELUGU.search(text) else "te"
    if jl == "en":
        text = re.sub(r"\b(" + "|".join(DIGITS) + r")\b", lambda m: DIGITS[m.group(1).lower()], text, flags=re.I)
    ok, score, info = judge_en(path, text, "en") if jl == "en" else judge_te(path, text)
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    miss = [g[0] for g in must(jl, n, text, te_en=lang == "te" and jl == "en") if not any((w in words) if jl == "en" else (w in heard_text) for w in g)]
    # a missed word costs more than the judge's own pass (+1): a take with every word a hair over the length limit
    # beats one that passed but lost a word (Telugu line 1 kept "Ajjun" over a clean, 2.85 s "Arjun")
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
    sid = "creative07v1" if lang == "en" else "creative07te"
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
            for k, (raw, fname) in enumerate(parts):
                voice_one(lang, n if k == 0 else f"{n}b", who, re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip(),
                          fname, src, takes, only)
    print("VOICE_DONE", flush=True)


def voice_one(lang, n, who, text, fname, src, takes, only):
    """One take for one text (a line, or one half of a line voiced in two takes)."""
    tag = f"{n:02d}" if isinstance(n, int) else str(n)
    fish = lang == "en"
    voice = f"fish:{who}" if fish else VOICE_TE_LINE.get(n, VOICE_TE[who]) if isinstance(n, int) else VOICE_TE[who]
    key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
    cached = sorted(takes.glob(f"{key}_*.wav"))
    best = (None, cached[0]) if cached and (KEEP or not only) else None   # --keep: an unchanged part keeps its take
    if best:
        print(f"{tag} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, lang, n), text, lang, n)[2]}", flush=True)
    for k in range(0 if best else 4):
        tmp = takes / f"{key}_{k}.wav"
        try:
            if fish:
                ref, ref_text = REFS / f"ref_{who}.wav", REF[who][1]
                fish_say(text, str(tmp), ref=str(ref), ref_text=ref_text)
            else:
                say(lang, text, tmp, voice=voice, pause=0.2)
        except RuntimeError as e:   # Fish's gateway errors can outlast its own retries: count it as a failed try
            print(f"{tag} {who} try {k}: failed to voice ({e})", flush=True)
            continue
        trim(tmp)
        ok, score, info = judge(heard(tmp, who, lang, n), text, lang, n)
        print(f"{tag} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
        if best is None or (best[0] is not None and score > best[0]):
            best = (score, tmp)
        if ok:
            break
    if best is None:
        print(f"{tag} {who}: NO TAKE (every try failed)", flush=True)
        return
    if best[0] is not None:   # keep only the chosen take in the cache
        for f in takes.glob(f"{key}_*.wav"):
            if f != best[1]:
                f.unlink()
    shutil.copy(heard(best[1], who, lang, n), src / fname)
    level(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
