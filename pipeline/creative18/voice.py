# Creative 18 voices, as EP44's (pipeline/ep44/voice.py): one judged take per line, cached by text + voice. English on
# Fish: Keerthi, Ramesh babai and Sunny = Fish copies of Parler-made reference clips (`refs`). Telugu on Parler: Keerthi =
# Lalitha, Sunny = Kiran, Ramesh babai = Prakash. The AI marker is text only. MUST groups: Whisper's real spellings, as
# short substrings (ROUTINE, Nov 4).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative18/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative18/voice.py en|te [--keep] [line numbers ...]
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

REFS = ROOT / "video/public/reel/creative18v1/refs"
REF = {
    "keerthi": ("Sneha speaks English with an Indian accent in a bright, quick and exasperated voice, like a young woman of "
                "twenty-four arguing with her uncle at home, at a fast pace. The recording is very clear, close-up, with no background noise.",
                "Babai, I told you to check first, didn't I? Now look what happened, nothing came back at all!"),
    "ramesh": ("Vikas speaks English with an Indian accent in a loud, indignant and slightly dramatic voice, like a man of fifty-five "
               "who feels cheated, at a moderate pace. The recording is very clear, close-up, with no background noise.",
               "What is this? I asked properly, I did everything correctly, and still they are giving me nothing!"),
    "sunny": ("Aakash speaks English with an Indian accent in a calm, matter-of-fact young voice, like a fifteen-year-old boy who "
              "has read the rules, at a moderate pace. The recording is very clear, close-up, with no background noise.",
              "It is written right here on the website, Babai. You just have to read the rules before you cancel."),
}
VOICE_TE = {
    "keerthi": "Lalitha speaks in a bright, quick and exasperated voice, at a moderate pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
    "ramesh": "Prakash speaks in a loud, indignant and slightly dramatic voice, at a moderate pace. "
              "The recording is very clear, close-up, studio quality, with no background noise.",
    "sunny": "Kiran speaks in a calm, matter-of-fact young voice, at a moderate pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
}
NARRATOR = (ROOT / "video/public/reel/ep29v1/src/01_hook.wav", "")   # unused: the AI chat is text only
APP = set()
MUST = {"en": {1: [("ai", "a.i"), ("three", "3", "3,100", "3100"), ("hundred", "3,100", "3100")], "1b": [("zero", "0")],
               2: [("asked",), ("cancelling", "canceling"), ("half",), ("six", "6", "6,200", "6200")],
               3: [("confirmed",), ("tatkal", "tatkaal", "tatkar"), ("refund",)], 4: [("passengers", "passenger"), ("note",), ("ramesh",), ("refund",), ("zero", "0")],
               5: [("check", "checked"), ("made",), ("rule",), ("real",)], 6: [("small",), ("free",), ("ten", "10"), ("nine", "9"), ("rule",)],
               7: [("different",), ("refund",)], 8: [("official",), ("rule",), ("sure",)], "8b": [("better",), ("eight", "8"), ("ten", "10"), ("three", "3", "3,100", "3100")],
               9: [("money",), ("rules", "rule"), ("written",), ("page",)], 10: [("fine",), ("sure",)], "10b": [("three", "3", "3,100", "3100"), ("hundred", "3,100", "3100")]},
        "te": {1: [("रोबो", "रोबोट", "रोबू"), ("मूडु", "मूड", "मुडु", "मुड")], "1b": [("रूपाई", "रुपाई", "रूपायि", "रुपायि", "रूपा", "रुपा")], 2: [("कैंसिल", "क्यान्सिल", "कैन्सिल", "क्यांसिल", "कान्सिल"), ("सगं", "सगम", "सगन", "सग")],
               3: [("तत्काल", "ततकाल", "तत्कल"), ("रीफंड", "रिफंड", "रीफन्ड")], 4: [("रमेश", "रमेष", "रामेश"), ("सुन्न", "सुना", "सून्न", "सुन")], 5: [("चेक", "चैक"), ("रूल", "रुल")],
               6: [("पदि", "पद्दि", "बदि"), ("तोम्मि", "तॊम्मि", "तम्मि", "तोमि", "तुम्मि")], 7: [("लेक्का", "लेक", "लैक")],
               8: [("रूल", "रुल"), ("फिशियल", "फीशियल", "फ़िशियल", "फिषियल")], "8b": [("एनिमि", "एनमि", "येनिमि"), ("रीफंड", "रिफंड", "रीफन्ड"), ("मूडु", "मूड", "मुडु", "मुड")], 9: [("डब्बु", "दब्बु", "डबु", "दबु"), ("पेजी", "पेज")],
               10: [("निजमे", "निजम", "नीजमे")], "10b": [("मूडु", "मूड", "मुडु", "मुड"), ("श्यूर", "स्यूर", "शुअर", "श्योर", "श्युर")]}}
JUDGE_TEXT = {1: "The AI said 3,100 back...", "1b": "IRCTC gave zero?!", 2: "I asked it before cancelling! Half of 6,200, it said!", 4: "Passengers, kindly note: Ramesh garu's refund... zero rupees!",
              6: "We asked a small free AI the same thing, 10 times. 9 times, it made up a rule!", "8b": "Better: 8 of 10. But one still said 3,100!", "10b": "...3,100, it says!"}
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
    out = Path(tempfile.gettempdir()) / "creative18_judge.wav"
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
    sid = "creative18v1" if lang == "en" else "creative18te"
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
