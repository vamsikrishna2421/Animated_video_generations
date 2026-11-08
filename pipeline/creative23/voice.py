# Creative 23 voices, as Creative 22's (pipeline/creative22/voice.py): one judged take per line, cached by text + voice.
# English on Fish: Sastry garu and Pallavi = Fish copies of Indian-English reference clips made on our machine with Parler.
# Telugu on Parler: Sastry = Prakash, Pallavi = Lalitha. MUST groups: Whisper's spellings, digits included. Every take's
# silent tail is cut to 0.12 s (EP48 render review: Fish left 0.6-0.8 s of dead air inside lines).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative23/voice.py refs | en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative23v1/refs"
REF = {   # (Parler description, the text in the reference clip)
    "sastry": ("Thoma speaks English with an Indian accent in a warm, slightly anxious voice, like a retired school headmaster of "
               "sixty-two, at a moderate pace. The recording is very clear, close-up, with no background noise.",
               "Thirty-two years I ran a school in this town, and now my own phone is giving me homework. Tell me, is this good or bad?"),
    "pallavi": ("Mary speaks English with an Indian accent in a clear, calm and firm voice, like a young chartered accountant "
                "explaining a bill, at a moderate pace. The recording is very clear, close-up, with no background noise.",
                "Look at the numbers with me, Nanna. Every rupee has to come from somewhere, and every rupee has to go somewhere."),
}
VOICE_TE = {
    "sastry": "Prakash speaks in a warm, slightly anxious and expressive voice, like a retired headmaster, at a moderate pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "pallavi": "Lalitha speaks in a clear, calm and firm voice, like a young chartered accountant, at a moderate pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused
APP = set()
MUST = {"en": {1: [("three", "3"), ("lakhs", "lakh"), ("screen",), ("rupee",)], 2: [("scam",), ("trading",), ("profit",), ("every",), ("day",), ("ai",)],
               3: [("two", "2"), ("lakhs", "lakh"), ("fifteen", "15"), ("three", "3"), ("profit",), ("every",)],
               4: [("fifteen", "15"), ("bad",), ("trick",)],
               5: [("two", "2"), ("lakhs", "lakh"), ("three", "3"), ("fifteen", "15"), ("times",), ("screen",)], 6: [("rupee",)],
               7: [("trading",), ("calculator",), ("painted",), ("green",)],
               8: [("three", "3"), ("real",), ("two", "2"), ("lakhs", "lakh"), ("year",)], "8b": [("nine", "970"), ("seventy", "970"), ("crore", "crores")],
               9: [("fifty", "56"), ("thousand", "000")],
               10: [("platform",), ("pay",), ("tax",), ("withdraw",), ("scam",)],
               11: [("pay",), ("one", "1930", "1"), ("nine", "1930", "9"), ("zero", "1930", "0"), ("invest",), ("held", "hold"), ("regulator",)],
               12: [("ai",), ("tax",), ("three", "3"), ("lakhs", "lakh"), ("paid",), ("separately",)]},
        "te": {}}
JUDGE_TEXT = {1: "3 lakhs on the screen, and I can't take out 1 rupee!", 3: "2 lakhs, 15 days ago. 3% profit, every single day!",
              4: "15 days, and not one bad day? That's the trick.",
              5: "2 lakhs, plus 3%, 15 times: exactly your screen.", 8: "If 3% a day were real, your 2 lakhs, in a year, would be...", "8b": "970 crore.",
              9: "Then why does it want 56,000 from me?!", 11: "Don't pay more. Call 1930 now: report fast, and the money may still be held. Before you invest, check SEBI, the market regulator.",
              12: "AI app, just cut the tax from my 3 lakhs! Must be paid separately?!"}

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


def tail(path, keep=0.12, floor=-40.0):
    """Cut a take's silent tail to `keep` s after the last 20 ms window above `floor` dB (EP48's fix for dead air)."""
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


def heard(path, who, lang):
    """The take as it goes into the reel: the app's lines through the light phone sound."""
    if who not in APP:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "creative23_judge.wav"
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
        if desc.startswith("kokoro"):
            continue
        say("en", text, out, voice=desc, pause=0.2)
        trim(out)
        print("made", out, judge_en(out, text, "en")[2])


def main(lang, only):
    sid = "creative23v1" if lang == "en" else "creative23te"
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
    tail(src / fname)
    if lang == "en" and who in GATE:
        gate(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
