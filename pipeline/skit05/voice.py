# Skit 05 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Lakshmi, Arjun and Sneha = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's way).
# Telugu on Parler: Lakshmi and Sneha = Lalitha (firm and calm / young and startled), Arjun = Kiran, the strict judge.
# No AI voice (the chatbot is only text on the laptops). Every take is levelled per sentence (EP36's `level`). MUST lists
# words a take has to contain.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit05/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit05/voice.py en|te [--keep] [line numbers ...]
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say  # noqa: E402
from fish_tts import say as fish_say  # noqa: E402
from skit01.voice import judge as judge_en, trim  # noqa: E402
from ep33.voice_te import judge as judge_te  # noqa: E402

REFS = ROOT / "video/public/reel/skit05v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "lakshmi": ("Meera speaks English with an Indian accent in a firm, calm, confident voice, like a team lead in her thirties "
                "explaining a rule to a new colleague, at a moderate pace. The recording is very clear, close-up, with no background noise.",
                "Listen to me once. Before you send anything to a client, check it twice, and ask me if you are not sure."),
    "arjun": ("Tarun speaks English with an Indian accent in a young, eager, slightly defensive voice, like a new office joiner "
              "in his twenties, at a quick pace. The recording is very clear, close-up, with no background noise.",
              "Ma'am, I finished the report already! I just need to format the table, it will take two minutes, promise."),
    "sneha": ("Kavya speaks English with an Indian accent in a young, bright voice, like a new joiner in an office, at a natural "
              "pace. The recording is very clear, close-up, with no background noise.",
              "Hi, I am new here. Can somebody tell me where the printer is? I need to print the joining form."),
}
VOICE_TE = {
    "lakshmi": "Lalitha speaks in a firm, calm, confident voice like a team lead explaining a rule to a new colleague, at a moderate pace. "
               "The recording is very clear, close-up, studio quality, with no background noise.",
    "arjun": "Kiran speaks in a young, eager, slightly defensive voice like a new office joiner, at a quick pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
    "sneha": "Lalitha speaks in a young, bright, startled voice like a new office joiner, at a natural pace. "
             "The recording is very clear, close-up, studio quality, with no background noise.",
}
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("arjun",), ("stop",), ("send",)], 2: [("client",), ("list",), ("asking", "ask"), ("neat",)], 3: [("hundred", "200"), ("numbers", "number"), ("chatbot", "chat")],
               4: [("relax",), ("only",), ("see",)], 5: [("chats", "chat"), ("train",), ("read",), ("people",)], 6: [("delete",)],
               7: [("person",), ("reviewed",), ("google", "google's"), ("three", "3"), ("years", "year"), ("delete",)], 8: [("three", "3"), ("years", "year"), ("use",)],
               9: [("fake",), ("rows", "row"), ("formula",), ("real",), ("list",)], 10: [("paste",), ("put",), ("notice",), ("board",)], 11: [("sneha",), ("stop",), ("send",)]},
        "te": {1: [("अर्ज", "आर्ज"), ("सेंड", "सेंद", "सेन्ड", "सेंट", "सेन्द")], 3: [("रेंड", "रेंडो", "रेनडो")],
               5: [("टाइप", "टैप", "ताइप", "टाईप", "type"), ("चदु", "चदू", "चदव"), ("ट्रेनि", "ट्रैनि", "त्रेनि", "त्रैनि", "ट्राइनि", "ट्रीनि", "ट्रेनिं", "trai")],
               7: [("मूडे", "मुडे", "मूडेल")], 8: [("मूडे", "मुडे")],
               9: [("वाडो", "वाड़ो", "वाडोच", "वाड उ", "वाडच", "वाड़ु", "वाडु"), ("फेक", "फ़ेक", "फेख", "fake"), ("फार्मु", "फॉर्मु", "फार्मू", "फार्मला", "फाम्ला", "formul")],
               11: [("स्नेह", "सनेह", "स्नेहा"), ("सेंड", "सेंद", "सेन्ड", "सेंट", "सेन्द")]}}   # Telugu as the judge writes it (Devanagari)

KEEP = False


def heard(path, who, lang):
    """The take as it goes into the reel (no phone sound: nobody here is a machine)."""
    return path


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
    return ok and not miss, score - 0.5 * len(miss), info + (f" | MISSING {miss}" if miss else "")


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
    sid = "skit05v1" if lang == "en" else "skit05te"
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
    voice = f"fish:{who}" if fish else VOICE_TE[who]
    key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
    cached = sorted(takes.glob(f"{key}_*.wav"))
    best = (None, cached[0]) if cached and (KEEP or not only) else None   # --keep: an unchanged part keeps its take
    if best:
        print(f"{tag} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, lang), text, lang, n)[2]}", flush=True)
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
        ok, score, info = judge(heard(tmp, who, lang), text, lang, n)
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
    shutil.copy(heard(best[1], who, lang), src / fname)
    level(src / fname)


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        KEEP = "--keep" in sys.argv
        main(sys.argv[1], {int(x) for x in sys.argv[2:] if x != "--keep"})
