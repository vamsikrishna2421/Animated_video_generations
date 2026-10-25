# EP38 voices, as EP37's (pipeline/ep37/voice.py): one judged take per line, cached by text + voice. English: Ravi on
# Parler "Thoma", the shop AI on Fish (the narrator reference) through the phone sound; Telugu on Parler (Ravi = Prakash,
# the AI = Kiran), the strict judge, the light phone sound. The AI's takes are judged after the phone filter, MUST lists
# words a take has to contain (a missed word costs 1.5, more than the length flag: skit 05), and every take is levelled
# per sentence (EP36's `level`).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep38/voice.py en|te [--keep] [line numbers ...]
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

LIGHT_EN = {5, 8, 10, 12, 16}   # the AI's numbers and names through the lighter phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count for numbers)
COUNTER_TE = ("कौंट", "काउंट", "कौन्ट", "कांट", "कौंड", "काउन्ट", "कोंट", "कौट", "कुंट", "कुवंट", "कौँट", "खाूंट")
RAM_TE = ("र्याम", "रैम", "राम", "रेम", "रयाम", "र्यम")
MUST = {"en": {1: [("enough",), ("memory",), ("paid", "pay"), ("five", "512", "5"), ("twelve", "12", "512")],
               2: [("storage",), ("godown", "down", "godowns")], 3: [("brain", "brain's", "brains"), ("there",)],
               4: [("every",), ("word",), ("bag", "bags"), ("counter",), ("ram", "rem", "rams")],
               5: [("counter",), ("eight", "8"), ("brain",), ("fifteen", "15")],
               6: [("fifteen", "15"), ("bags", "bag"), ("counter",), ("eight", "8")],
               7: [("squeezed", "squeeze"), ("four", "4", "4.7"), ("seven", "7", "4.7"), ("counter",), ("need",)],
               8: [("five", "5"), ("file",), ("room",), ("work",)], 9: [("five", "5"), ("bags", "bag"), ("counter",), ("eight", "8"), ("fits", "fit")],
               10: [("barely",), ("close",), ("apps", "app"), ("first",)], 11: [("without",), ("internet",)],
               12: [("cut",), ("internet",), ("wrote",), ("reply",), ("seventeen", "17"), ("seconds", "second")],
               13: [("which",), ("use",)], 14: [("ram", "rem"), ("storage",), ("brain",), ("room",), ("work",), ("computer",)],
               15: [("where",), ("get",)],
               16: [("free",), ("ollama", "olama", "llama", "alama", "olamma"), ("studio",), ("download",), ("offline",)],
               17: [("two", "2"), ("terabyte", "terabytes", "tb"), ("hard",), ("disk", "disc"), ("biggest",), ("brain",)], 18: [("bigger",), ("godown", "down"), ("same",), ("counter",)]},
        "te": {1: [("मेम", "मेंम", "मैम", "मिम", "मेंव", "memory"), ("फाइव", "फैव", "फ़ाइव", "फाईव", "पाइव", "फीव", "512", "five"), ("डब्ब", "डब", "दब्ब", "दब", "धब")],
               2: [("स्टोर", "स्टॉर", "स्तोर", "श्टोर", "स्तूर", "स्टूर", "storage"), ("गोद", "गोध", "गोड", "गौद", "गो दा", "godam")],
               3: [("ब्रेन", "ब्रैन", "ब्रेइन", "ब्रीन", "brain"), ("अंदु", "अन्दु", "अंधु", "अंदू")],
               4: [("प्रति", "प्रती", "प्रथि", "प्रत"), ("बस्त", "बस्ट", "बास्त", "बश्त")],
               "4b": [COUNTER_TE, RAM_TE + ("ram",)],
               5: [COUNTER_TE, ("निमि", "नमि", "निमी", "8"), ("पदि", "पदह", "पधि", "15")],
               6: [("बस्त", "बस्ट", "बास्त", "बश्त"), ("पदि", "पदह", "पधि", "15")],
               7: [("कंप्र", "कम्प्र", "कंपर", "कॉम्प", "कोंप", "खमप्र", "खंप्र", "कमप्र", "खम्प", "compress"), ("फोर", "फ़ोर", "4"), ("सेवन", "सेवेन", "सेव", "7")],
               "7b": [COUNTER_TE, ("कावा", "कावालि", "कावाली", "कावल")],
               8: [("ऐद", "अइद", "ऐध", "आइद", "आएद", "आईद", "आयद", "5"), ("चोट", "छोट", "चॊट")],
               9: [("निमि", "नमि", "निमी", "8"), ("ऐद", "अइद", "ऐध", "आइद", "आएद", "आईद", "5"), ("सरि", "सरी", "शरी", "शरि")],
               10: [("जस", "जेस", "जष", "just"), ("याप", "ऐप", "एप", "app"), ("क्लो", "close")],
               11: [("इंटर", "इन्टर", "इंतर", "internet"), ("लेकुं", "लेकु", "लेखुं", "लेकों")],
               12: [("इंटर", "इन्टर", "इंतर", "internet"), ("कट", "cut")],
               "12b": [("रिप्ल", "रिपल", "रिप्लै", "रिप्लाई", "reply"), ("पदि", "पदह", "पधि", "17"), ("पट्", "पटि", "पत्ति", "पटी")],
               13: [("एदि", "एदी", "येदि", "एधि", "एडि", "येदी"), ("वाड", "वाद", "वाढ")],
               14: [("स्टोर", "स्टॉर", "स्तोर", "श्टोर", "स्तूर", "स्टूर", "storage"), RAM_TE + ("ram",)],
               "14b": [("ब्रेन", "ब्रैन", "ब्रेइन", "ब्रीन", "brain"), ("लैप", "ल्याप", "लाप", "लेप", "laptop"), ("चोट", "छोट", "चॊट")],
               16: [("फ्री", "फ़्री", "फ्रि", "प्री", "free"), ("ओला", "ओल्ला", "ओलमा", "उला", "ओलामा", "वला", "ollama"), ("स्टू", "स्टु", "स्तू", "studio")],
               "16b": [("ओक्क", "वक्क", "ओक", "उक्क", "वोक"), ("चाल", "चाले", "छाल"), ("नेट", "नेत", "net")],
               17: [("टीबी", "टी बी", "टीवी", "टीभी", "ती भी", "टी भी", "tb", "2"), ("हार्ड", "हार्द", "हाड", "हाद", "hard"), ("दिस", "डिस", "disk")],
               18: [("गोद", "गोध", "गोड", "गौद", "गो दा", "godam"), COUNTER_TE, ("अदे", "अधे", "अदी", "अदि")]}}   # Telugu as the judge writes it (Devanagari)


def heard(path, who, n, lang):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep38_judge.wav"
    x = phone(a, True, lo_cut=LO_CUT) if lang == "te" else phone(a, n in LIGHT_EN)
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


# English lines whose judge text needs digits (Whisper writes "512 GB", "15", "4.7", "2TB")
JUDGE_TEXT = {1: "Not enough memory?! I paid for 512 GB!", 5: "Your counter: 8 gigabytes. My brain: 15.", 6: "15 bags on a counter for 8?!",
              7: "Then the squeezed one: 4.7! How much counter does it need?", 8: "About 5 gigabytes. The file, plus room to work.",
              9: "5 bags on a counter for 8! It fits!", 12: "We cut the internet. I still wrote this reply: 17 seconds.",
              16: "Free apps: Ollama or LM Studio. Download once, then it runs offline.", 17: "I'll buy a 2 terabyte hard disk! The biggest brain!"}


def judge(path, text, lang, n):
    ok, score, info = judge_en(path, JUDGE_TEXT.get(n, text), "en") if lang == "en" else judge_te(path, text)
    if lang == "te" and "LONG" in info and "BABBLE" not in info:   # EP33's length limit (0.11 s a letter) was set for a flat
        a, sr = sf.read(path)                                      # AI voice; shouted and paused takes need 0.15 (creative 08)
        m = re.search(r"dev ([\d.]+) rate ([\d.]+)", info)
        if m and float(m.group(1)) >= 0.85 and 9 <= float(m.group(2)) <= 23 and len(a) / sr <= max(2.8, len(re.sub(r"\s", "", text)) * 0.15):
            ok, score, info = True, score + 1, info.replace("LONG ", "")
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    # English: whole words; Telugu (written in Devanagari by the judge): a substring will do
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 1.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


def main(lang, only, keep=False):
    sid = "ep38v1" if lang == "en" else "ep38te"
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
            for pk, (raw, fname) in enumerate(parts):
                mk = n if pk == 0 else f"{n}b"   # the second take of a two-take line has its own MUST entry
                text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
                fish = lang == "en" and who == "ai"
                voice = "fish:narrator" if fish else VOICE_EN[("en", who)] if lang == "en" else VOICE_TE[who]
                key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
                cached = sorted(takes.glob(f"{key}_*.wav"))
                best = (None, cached[0]) if cached and (keep or not only) else None   # --keep: a part whose text is unchanged keeps its take
                if best:
                    print(f"{n:02d} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, n, lang), text, lang, mk)[2]}", flush=True)
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
                    ok, score, info = judge(heard(tmp, who, n, lang), text, lang, mk)
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
                level(src / fname)
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"}, "--keep" in sys.argv)
