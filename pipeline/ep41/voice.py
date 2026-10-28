# EP41 voices, as EP40's (pipeline/ep40/voice.py): one judged take per line, cached by text + voice. English: Ravi on
# Parler "Thoma", the shop AI on Fish (the narrator reference) through the phone sound; Telugu on Parler (Ravi = Prakash,
# the AI = Kiran), the strict judge, the light phone sound. The AI's takes are judged after the phone filter, MUST lists
# words a take has to contain (a missed word costs 1.5, more than the length flag: skit 05), and every take is levelled
# per sentence (EP36's `level`).
# Every try is kept in takes/_tries (the picker can keep a worse take than the ear would: Creative 11).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep41/voice.py en|te [--keep] [line numbers ...]
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

LIGHT_EN = {6, 8}   # the AI's numbers through the lighter phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count for numbers)
MUST = {"en": {1: [("same",), ("reply",), ("order",), ("after",), ("biggest",), ("brain",)],
               2: [("biggest",), ("which",), ("job",), ("pass",), ("mark",), ("first",)],
               3: [("nineteen", "19"), ("twenty", "20"), ("orders", "order"), ("right",), ("reply",), ("ten", "10"), ("seconds", "second")],
               4: [("three", "3"), ("brains", "brain"), ("test",), ("twenty", "20"), ("orders",)],
               5: [("easy",), ("biggest",), ("wins", "win")],
               6: [("middle",), ("passed", "pass"), ("nineteen", "19"), ("twenty", "20"), ("five", "5"), ("seconds",)],
               7: [("not",), ("biggest",)],
               8: [("sixteen", "16"), ("twenty", "20"), ("curds", "curd"), ("litres", "liters", "litre", "liter")],
               "8b": [("one",), ("reply",), ("eleven", "11"), ("seconds",)],
               9: [("two", "2"), ("litres", "liters", "litre", "liter"), ("curd",)],
               10: [("smallest",), ("passes",), ("faster",), ("memory",)],
               11: [("middle",), ("forever",)],
               12: [("half",), ("kilo",), ("doubled",), ("sugar",)],
               13: [("telugu",), ("words",), ("new",), ("job",)], "13b": [("none",), ("three", "3"), ("passed",)],
               14: [("perugu", "peru", "paruga", "perugo", "peragu"), ("eggs",), ("now",)],
               15: [("prompt",), ("another",), ("brain",), ("test",), ("again",)],
               16: [("test",), ("again",), ("which",), ("brain",), ("keep",)]},
        "te": {1: [("रिप्ला", "रिप्लै", "रिप्लाई"), ("पेड", "पॆड", "पेट", "पीड", "पेद", "पड़त", "पेत")],   # render check: "పెడతా" was heard "प्रत्ता"
               "13b": [("लेदु", "लेदू", "लेद", "लेडु", "लेडू")]}}   # render check: "అవ్వలేదు" was heard "अवलगदू"


def heard(path, who, n, lang):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep41_judge.wav"
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


# English lines whose judge text needs digits (Whisper writes numbers as digits)
JUDGE_TEXT = {3: "19 of 20 orders right, every reply under 10 seconds!", 4: "Then all three brains take one test: your 20 orders.",
              6: "The middle one passed. 19 of 20, all under 5 seconds.", 8: "16 of 20: it turned 2 curds into 2 litres!",
              "8b": "And one reply took 11 seconds."}


def judge(path, text, lang, n):
    ok, score, info = judge_en(path, JUDGE_TEXT.get(n, text), "en") if lang == "en" else judge_te(path, text)   # n: 8 or "8b"
    if lang == "te" and "LONG" in info and "BABBLE" not in info:   # EP33's length limit (0.11 s a letter) was set for a flat
        a, sr = sf.read(path)                                      # AI voice; shouted and paused takes need 0.15 (creative 08)
        m = re.search(r"dev ([\d.]+) rate ([\d.]+)", info)
        if m and float(m.group(1)) >= 0.85 and 9 <= float(m.group(2)) <= 23 and len(a) / sr <= max(2.8, len(re.sub(r"\s", "", text)) * 0.15):
            ok, score, info = True, score + 1, info.replace("LONG ", "")
    heard_text = info.split("|", 1)[1].lower()
    if lang == "te":   # a stutter the judge lets through ("राई राईटाने": a word said twice in a row)
        toks = [w.strip(".,!?।") for w in heard_text.split()]
        if any((len(a) >= 2 and (a == b or b.startswith(a))) or (len(a) == 1 and b.startswith(a)) for a, b in zip(toks, toks[1:])):   # "उ उको" too
            ok, score, info = False, score - 1.0, info + " | STUTTER"
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    # English: whole words; Telugu (written in Devanagari by the judge): a substring will do
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 1.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


def main(lang, only, keep=False):
    sid = "ep41v1" if lang == "en" else "ep41te"
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
                    (takes / "_tries").mkdir(exist_ok=True)
                    shutil.copy(tmp, takes / "_tries" / f"{n:02d}{'b' if pk else ''}_{tmp.name}")
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
