# EP49 voices: the Creative 21 standard (Vamsi via Bujji, Nov 8): English on Fish with Creative 21's own American reference
# clips (Kokoro): Ravi = am_michael (the bouncer's clip), Suresh = am_puck (Naveen's), the shop AI = af_heart (Shalini's)
# through the phone sound. Telugu on Parler: Ravi = Prakash, Suresh = Kiran, the AI = Lalitha (the light phone sound).
# One judged take per line, cached by text + voice; MUST groups in Whisper's spellings; silent tails cut to 0.12 s.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep49/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative21v1/refs"
REFFILE = {"ravi": "bouncer", "suresh": "naveen", "ai": "shalini"}
REF = {   # the text in Creative 21's reference clips
    "ravi": ("am_michael", "Rejected. Not on the list. I don't make the rules, I just read them, letter by letter. If it isn't written exactly like the list, it doesn't come in. Next."),
    "suresh": ("am_puck", "Come on, I've been writing this stuff for five years! I built the payment system, I fixed the login bugs, I'm literally the person you're looking for. Just read it!"),
    "ai": ("af_heart", "Eight months! Eight whole months and not one single hire. I have read every report, I have called every agency, and still nobody gets through that door. Something is very wrong here."),
}
VOICE_TE = {
    "ravi": "Prakash speaks loudly and expressively, like a shopkeeper in his shop, at a moderate pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "suresh": "Kiran speaks in a worried, indignant and expressive voice, like a shop helper defending his job, at a moderate pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "ai": "Lalitha speaks in a calm, clear and even voice, like a polite voice assistant, at a moderate pace. "
          "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused
APP = {"ai"}   # the shop AI through the phone sound
MUST = {"en": {1: [("fifteen", "15"), ("thousand", "000"), ("eight", "8"), ("years",), ("free",), ("app",), ("job",)],
               2: [("relax",), ("tested", "test"), ("paper",), ("work",)], 3: [("twenty", "25"), ("tries",), ("paper",), ("eighteen", "18"), ("right",)],
               4: [("eighteen", "18")], 5: [("sums", "sum"), ("gst",), ("ten", "10"), ("offer",), ("message",), ("fix",), ("sending",)],
               6: [("fixes", "fix"), ("me",)], 7: [("ai",), ("job",)],
               8: [("paper",), ("sacks", "sack"), ("deliveries", "delivery"), ("pays",), ("late",)],
               9: [("worldwide",), ("one",), ("four", "4"), ("exposure",), ("change",), ("vanish",)],
               10: [("job",), ("paper",)], 11: [("changes", "change"), ("most",), ("clerks", "clerk")],
               12: [("drafts", "draft"), ("adds", "add"), ("checks", "check"), ("sends", "send"), ("hands",), ("people",)],
               13: [("stay",), ("teach",), ("app",)], 14: [("fifteen", "15"), ("thousand", "000"), ("month",)]},
        "te": {1: [("पद", "15")], 3: [("इरव", "25"), ("पद्द", "18", "पदे", "पद्दे")], 5: [("पदि", "10", "पदी")], 14: [("पद", "15")]}}
JUDGE_TEXT = {1: "15,000 a month, 8 years... and a free app takes my job?!", 3: "25 tries at Suresh's paper work. 18 right.", 4: "18?!",
              5: "Sums and GST: 10 out of 10. But every offer message needed a fix before sending.",
              9: "Worldwide, 1 job in 4 has some AI exposure. Most will change, not vanish.", 14: "15,000 a month."}

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
    out = Path(tempfile.gettempdir()) / "ep49_judge.wav"
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
    sid = "ep49v1" if lang == "en" else "ep49te"
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
                ref, ref_text = REFS / f"ref_{REFFILE[who]}.wav", REF[who][1]
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
