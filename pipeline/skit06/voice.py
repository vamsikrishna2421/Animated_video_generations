# Skit 06 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Host Meera, Ammamma, Vamsi and the AI = Fish copies of Parler-made reference clips (`refs` makes them once, skit
# 02's way); the AI sounds like a person until the reveal (it has to pass for a contestant), then goes through the phone
# sound. Telugu on Parler: the host and Ammamma = Lalitha (bright TV host / slow, warm grandmother), Vamsi = Kiran, the
# AI = Prakash; the strict judge. Every take is levelled per sentence (EP36's `level`). MUST lists words a take has to
# contain.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit06/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit06/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/skit06v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "host": ("Nisha speaks English with an Indian accent in a bright, energetic, playful voice, like a TV quiz show host in her "
             "thirties, at a lively pace. The recording is very clear, close-up, with no background noise.",
             "Welcome back to the show! Our contestants are ready, the clock is ticking, and tonight one of them is not human!"),
    "a": ("Swapna speaks English with an Indian accent in a warm, slightly shaky, elderly woman's voice, like a grandmother in her "
          "seventies, at a slow, relaxed pace. The recording is very clear, close-up, with no background noise.",
          "Arey, in our days we asked the neighbours, not the phone. Come, sit, have some coffee first, then we will see."),
    "b": ("Raghav speaks English with an Indian accent in a young, casual, friendly voice, like a delivery rider in his twenties, "
          "at a natural pace. The recording is very clear, close-up, with no background noise.",
          "Sir, I have your order, but the gate is closed. Can you come down? I have three more deliveries after this."),
    "c": ("Vikas speaks English with an Indian accent in a smooth, confident, polished voice, like a know-it-all who always has "
          "an answer, at a brisk pace. The recording is very clear, close-up, with no background noise.",
          "Of course I know! The best biryani in the city is two streets from here, they open at eleven, ask for the special."),
}
VOICE_TE = {
    "host": "Lalitha speaks in a bright, energetic, playful voice like a TV quiz show host, at a lively pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "a": "Lalitha speaks in a low, warm, slow, slightly shaky voice like an elderly grandmother, at a slow pace. "
         "The recording is very clear, close-up, studio quality, with no background noise.",
    "b": "Kiran speaks in a young, casual, friendly voice like a delivery rider, at a natural pace. "
         "The recording is very clear, close-up, studio quality, with no background noise.",
    "c": "Prakash speaks in a smooth, confident, polished voice like a know-it-all, at a brisk pace. "
         "The recording is very clear, close-up, studio quality, with no background noise.",
}
VOICE_TE_LINE = {}
AFTER_REVEAL = {12, 15}   # the AI's lines once it is a phone on a stool: the phone sound
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("ai",), ("spot",), ("buzzer",)], 2: [("ramulu", "ramu", "ramulus", "ramallu"), ("tiffins", "tiffin"), ("sunday",)],
               3: [("never",), ("heard",)], 4: [("idea",), ("call",)], 5: [("six", "6"), ("thirty", "30"), ("dosa", "dosai", "dosas"), ("famous",)],
               6: [("sure",), ("source",)], 7: [("hyderabad",), ("guide",), ("forty", "42")], 8: [("book",)], 9: [("time",), ("ai",)],
               10: [("phone",), ("moustache", "mustache")], 11: [("made",), ("exist", "exists")], 12: [("sure",)],
               13: [("trap",), ("know",), ("guesses", "guess")], 14: [("permission",), ("sure",), ("know",), ("tiffins", "tiffin")],
               15: [("know",)], 16: [("honest",), ("answer",)]},
        "te": {2: [("टिफ", "तिफ", "टिप", "tiff")], 5: [("दोश", "दोस", "दोष", "दोसा")], 7: [("गाइ", "गैड", "गईड", "गाइड", "guide")],
               11: [("लेद", "लेदु", "लेनी", "लेने")], 13: [("लीद", "लिद", "लीदु")], 14: [("लीद", "लिद", "लीदु")], 15: [("लीद", "लिद", "लीदु")]}}   # Telugu as the judge writes it (Devanagari)

KEEP = False


def heard(path, who, lang, n=None):
    """The take as it goes into the reel: the AI's lines after the reveal through the phone sound."""
    if who != "c" or n not in AFTER_REVEAL:
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "skit06_judge.wav"
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


def judge(path, text, lang, n):
    """n: the line number (int), or "<n>b" for the second take of a two-take line."""
    ok, score, info = judge_en(path, text, "en") if lang == "en" else judge_te(path, text)
    heard_text = info.split("|", 1)[1].lower()
    words = set(re.findall(r"[a-z0-9]+", heard_text))
    miss = [g[0] for g in MUST[lang].get(n, []) if not any((w in words) if lang == "en" else (w in heard_text) for w in g)]
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
    sid = "skit06v1" if lang == "en" else "skit06te"
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
