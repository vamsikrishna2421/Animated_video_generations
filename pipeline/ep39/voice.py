# EP39 voices, as EP38's (pipeline/ep38/voice.py): one judged take per line, cached by text + voice. English: Ravi on
# Parler "Thoma", the shop AI on Fish (the narrator reference) through the phone sound; Telugu on Parler (Ravi = Prakash,
# the AI = Kiran), the strict judge, the light phone sound. The AI's takes are judged after the phone filter, MUST lists
# words a take has to contain (a missed word costs 1.5, more than the length flag: skit 05), and every take is levelled
# per sentence (EP36's `level`).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep39/voice.py en|te [--keep] [line numbers ...]
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

LIGHT_EN = {2, 6, 10, 12, 16}   # the AI's numbers through the lighter phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count for numbers)
MUST = {"en": {1: [("seventeen", "17"), ("seconds", "second"), ("reply",), ("cancelled", "canceled", "cancel")],
               2: [("four", "4"), ("read",), ("order",), ("thirteen", "13"), ("write",), ("reply",)],
               3: [("thirteen", "13"), ("seconds", "second"), ("write",)],
               4: [("token", "tokens"), ("time",), ("word",), ("piece",)],
               5: [("pieces", "piece"), ("faster",)],
               6: [("every",), ("token",), ("five", "5"), ("bags", "bag"), ("laptop",), ("four", "4"), ("tokens", "token")],
               7: [("online",), ("replies", "reply"), ("one", "1"), ("second",)],
               8: [("graphics",), ("cards", "card"), ("hundred", "200"), ("online",), ("token",), ("money",)],
               9: [("money",), ("message",), ("reply",)],
               10: [("both",), ("token",), ("writes", "write"), ("four", "4"), ("eight", "8"), ("times",), ("more",)],
               11: [("write",), ("less",), ("two", "2"), ("short",), ("lines", "line")],
               12: [("thirty", "35"), ("tokens", "token"), ("twelve", "12"), ("seconds", "second"), ("online",), ("smaller",), ("bill",)],
               13: [("better",), ("old",), ("chats", "chat"), ("first",), ("know",)],
               14: [("whole",), ("month",), ("read",), ("first",), ("word",)],
               15: [("how",), ("long",)],
               16: [("ninety", "92"), ("two", "92"), ("seconds", "second")],
               17: [("two", "2"), ("line", "lines"), ("note",), ("whole",), ("month",)]},
        "te": {}}   # Telugu as the judge writes it (Devanagari): filled from the first takes


def heard(path, who, n, lang):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep39_judge.wav"
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
JUDGE_TEXT = {1: "17 seconds for one reply?! He cancelled!", 2: "4 seconds to read his order. 13 to write the reply.",
              3: "13 seconds to write that?!", 6: "For every token, I lift all 5 bags. On this laptop: 4 tokens a second.",
              7: "The online AI replies in 1 second!", 8: "Big graphics cards: 200 tokens a second. But online, every token costs money.",
              10: "Both, and a token it writes costs 4 to 8 times more.", 11: "Then write less! 2 short lines!",
              12: "35 tokens. 12 seconds here. Online, a smaller bill.", 16: "92 seconds."}


def judge(path, text, lang, n):
    ok, score, info = judge_en(path, JUDGE_TEXT.get(n, text), "en") if lang == "en" else judge_te(path, text)
    if lang == "te" and "LONG" in info and "BABBLE" not in info:   # EP33's length limit (0.11 s a letter) was set for a flat
        a, sr = sf.read(path)                                      # AI voice; shouted and paused takes need 0.15 (creative 08)
        m = re.search(r"dev ([\d.]+) rate ([\d.]+)", info)
        if m and float(m.group(1)) >= 0.85 and 9 <= float(m.group(2)) <= 23 and len(a) / sr <= max(2.8, len(re.sub(r"\s", "", text)) * 0.15):
            ok, score, info = True, score + 1, info.replace("LONG ", "")
    heard_text = info.split("|", 1)[1].lower()
    if lang == "te":   # a stutter the judge lets through ("राई राईटाने": a word said twice in a row)
        toks = [w.strip(".,!?।") for w in heard_text.split()]
        if any(len(a) >= 2 and (a == b or b.startswith(a)) for a, b in zip(toks, toks[1:])):
            ok, score, info = False, score - 1.0, info + " | STUTTER"
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    # English: whole words; Telugu (written in Devanagari by the judge): a substring will do
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
    return ok and not miss, score - 1.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


def main(lang, only, keep=False):
    sid = "ep39v1" if lang == "en" else "ep39te"
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
