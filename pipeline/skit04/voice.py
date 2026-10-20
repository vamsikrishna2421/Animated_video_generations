# Skit 04 voices, one judged take per line, cached by text + voice (a changed line only re-voices itself). English on
# Fish: Babu, Raju and Swathi = Fish copies of Parler-made reference clips (`refs` makes them once, skit 02's way).
# Telugu on Parler: Babu = Prakash, Raju = Kiran (lively here), Swathi = Lalitha, the strict judge. No AI voice in this
# reel (the AI is only text on Babu's phone). MUST lists words a take has to contain.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit04/voice.py refs
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit04/voice.py en|te [line numbers ...]
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say  # noqa: E402
from fish_tts import say as fish_say  # noqa: E402
from skit01.voice import judge as judge_en, trim  # noqa: E402
from ep33.voice_te import judge as judge_te  # noqa: E402

REFS = ROOT / "video/public/reel/skit04v1/refs"
# Parler clips that Fish copies (made once by `refs`, kept in the reel folder)
REF = {
    "babu": ("Kabir speaks English with an Indian accent in a warm, slightly hoarse, older man's voice, like a friendly "
             "tea stall owner in his fifties, at a moderate pace. The recording is very clear, close-up, with no background noise.",
             "Good evening, come, come! The ginger tea is ready, very hot. Sit on the bench, I will bring two glasses."),
    "raju": ("Aakash speaks English with an Indian accent in a loud, cheeky, energetic voice, like a street-smart auto "
             "driver joking with a friend, at a quick pace. The recording is very clear, close-up, with no background noise.",
             "Anna, one strong tea, quickly! I have a passenger waiting at the signal, and the traffic is terrible today."),
    "swathi": ("Sneha speaks English with an Indian accent in a young, bright, confident voice, like a college student "
               "explaining something to her father, at a natural pace. The recording is very clear, close-up, with no background noise.",
               "Nanna, listen to me once. It is very simple, I will show you on your phone, just give me two minutes."),
}
VOICE_TE = {
    "babu": "Prakash speaks in a warm, slightly hoarse, older man's voice like a friendly tea stall owner, at a moderate pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "raju": "Kiran speaks in a loud, cheeky, energetic voice like a street-smart auto driver joking with a friend, at a quick pace. "
            "The recording is very clear, close-up, studio quality, with no background noise.",
    "swathi": "Lalitha speaks in a young, bright, confident voice like a college student explaining something to her father, "
              "at a natural pace. The recording is very clear, close-up, studio quality, with no background noise.",
}
# n: groups of words, one word of each group must be heard (Whisper's words, lower case; digits count)
MUST = {"en": {1: [("indulge",), ("costs", "cost"), ("hundred", "200")], 2: [("fifteen", "15"), ("fancy",)], 4: [("simple",), ("lovers", "lover")],
               5: [("tea",), ("lovers", "lover"), ("raju",)], 6: [("show",)], 8: [("paste",), ("three", "3"), ("posts", "post")],
               9: [("ten", "10")], 10: [("last",), ("price",)], 11: [("copies", "copy"), ("posts", "post"), ("price",)],
               12: [("fifteen", "15"), ("fancy",)]},
        "te": {}}

def heard(path, who, lang):
    """The take as it goes into the reel (no phone sound: nobody here is a machine)."""
    return path


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
    sid = "skit04v1" if lang == "en" else "skit04te"
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
    best = (None, cached[0]) if cached and not only else None
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


if __name__ == "__main__":
    if sys.argv[1] == "refs":
        refs()
    else:
        main(sys.argv[1], {int(x) for x in sys.argv[2:]})
