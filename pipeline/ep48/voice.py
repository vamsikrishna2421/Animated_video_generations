# EP48 voices, as EP47's (pipeline/ep47/voice.py): one judged take per line, cached by text + voice. English: Ravi on
# Parler "Thoma", the shop AI on Fish (the narrator reference) through the phone sound; Telugu on Parler (Ravi = Prakash,
# the AI = Kiran), the strict judge, the light phone sound. MUST lists words a take has to contain (Whisper's spellings;
# Telugu as Devanagari substrings, digits count); every take is levelled per sentence. Every try is kept in takes/_tries.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep48/voice.py en|te [--keep] [line numbers ...]
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
from skit01.voice import FISH_REF, FISH_REF_TEXT, VOICE as VOICE_EN0, judge as judge_en, trim  # noqa: E402
from ep33.voice_te import VOICE as VOICE_TE0, LO_CUT, judge as judge_te  # noqa: E402
from ep33.voice_rec import phone  # noqa: E402
import ep33.voice_rec as vr  # noqa: E402

VOICE_EN = dict(VOICE_EN0)
VOICE_TE = dict(VOICE_TE0)
LIGHT_EN = set()   # the AI's numbers through the lighter phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count for numbers)
MUST = {"en": {1: [("said",), ("no",), ("label",), ("rule",), ("february",)],
               2: [("asked", "ask"), ("ai",), ("ad", "add"), ("label",), ("no",)],
               3: [("dancing", "dance"), ("people",), ("real",)],
               4: [("exactly",), ("rule",)], "4b": [("twentieth", "20th", "20"), ("february",), ("videos", "video"), ("photos", "photo"), ("voices", "voice"), ("real",), ("clear",), ("label",)],
               5: [("why",), ("say", "said"), ("no",)],
               6: [("small",), ("free",), ("ai",), ("2024", "twenty", "2020"), ("rule",), ("after",)],
               7: [("tested", "test"), ("ai",), ("rules", "rule"), ("twenty", "25"), ("times", "time")], "7b": [("two", "2"), ("right",)],
               8: [("only",), ("two", "2", "too", "to")],
               9: [("answers", "answer"), ("old",), ("wrong",), ("sure",)],
               10: [("europe",), ("ban", "banned", "doesn't"), ("workers", "worker"), ("feelings", "feeling"), ("already",), ("2024", "twenty"), ("law",)], 15: [("like",), ("what",)],
               11: [("who",), ("ask",), ("rules", "rule")],
               12: [("apps", "app"), ("search",), ("web",), ("government", "government's"), ("page",), ("date",)],
               13: [("video",), ("old",), ("november",), ("2026", "twenty", "2020")],
               14: [("made",), ("ai",), ("rice",), ("real",)]},
        "te": {}}


def heard(path, who, n, lang):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep48_judge.wav"
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


def tail(path, keep=0.12, floor=-40.0):
    """Cut a take's silent tail (render review: Fish and the phone sound left 0.6-0.8 s of near-silence inside the line,
    which played as dead air): keep `keep` s after the last 20 ms window above `floor` dB."""
    x, sr = sf.read(path)
    mono = x.mean(1) if x.ndim > 1 else x
    hop = int(sr * 0.02)
    db = [20 * np.log10(np.sqrt(np.mean(mono[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(mono) - hop, hop)]
    last = max((i for i, d in enumerate(db) if d > floor), default=len(db) - 1)
    end = min(len(mono), (last + 1) * hop + int(keep * sr))
    if end < len(mono) - int(0.05 * sr):
        y = x[:end].copy()
        f = min(len(y), int(0.03 * sr))
        y[-f:] *= np.linspace(1, 0, f)[:, None] if y.ndim > 1 else np.linspace(1, 0, f)
        sf.write(path, y.astype(np.float32), sr)


# English lines whose judge text needs digits (Whisper writes numbers as digits)
JUDGE_TEXT = {"4b": "Since the 20th of February, AI videos, photos or voices that look real need a clear label.",
              6: "I'm a small free AI from 2024. This rule came after me.", 7: "They tested me on AI rules, 25 times.",
              "7b": "I got 2 right.", 8: "Only 2?!", 10: "I said Europe doesn't ban AI that reads workers' feelings. That ban was already in its 2024 law.", 13: "And this video gets old too. It's November 2026."}


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
    sid = "ep48v1" if lang == "en" else "ep48te"
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
                tail(src / fname)
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"}, "--keep" in sys.argv)
