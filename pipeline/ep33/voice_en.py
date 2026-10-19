# EP33 English with AI voices, which the user asked for to compare with their own recording (pipeline/ep33/voice_rec.py):
# skit 01's cast, Ravi = Parler "Thoma" (Indian English, loud and fast), the shop AI = Fish with the channel narrator's
# reference, through the recorded version's phone sound (lighter on the numbers). One judged take per line (Whisper word
# hits, speaking rate, no added words; the AI's after the phone filter), up to 4 tries, cached by text + voice.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep33/voice_en.py [line numbers ...]
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
from skit01.voice import FISH_REF, FISH_REF_TEXT, VOICE, judge, trim  # noqa: E402
from ep33.voice_rec import LIGHT, phone  # noqa: E402
import ep33.voice_rec as vr  # noqa: E402

LIGHT_EN = LIGHT | {18}   # "Both" read "Bose" through the full phone sound


def heard(path, who, n):
    """The take as it goes into the reel: the AI's through the phone filter."""
    if who != "ai":
        return path
    a, sr = sf.read(path)
    vr.SR = sr
    out = Path(tempfile.gettempdir()) / "ep33tts_judge.wav"
    sf.write(out, phone(a, n in LIGHT_EN).astype(np.float32), sr)
    return out


def main(only):
    spec = json.loads((ROOT / "reels/ep33tts.json").read_text())
    src = ROOT / "video/public/reel/ep33tts/src"
    takes = src.parent / "takes"
    src.mkdir(parents=True, exist_ok=True)
    takes.mkdir(parents=True, exist_ok=True)
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n = int(line["file"][:2])   # the script's line number (this version skips some lines)
            if only and n not in only:
                continue
            who = line["who"]
            text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]", "", line.get("tts") or line["text"])).strip()
            voice = "fish:narrator" if who == "ai" else VOICE[("en", who)]
            key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
            cached = sorted(takes.glob(f"{key}_*.wav"))
            best = (None, cached[0]) if cached and not only else None
            if best:
                print(f"{n:02d} {who}: cached {cached[0].name} | {judge(heard(cached[0], who, n), text, 'en')[2]}", flush=True)
            for k in range(0 if best else 4):
                tmp = takes / f"{key}_{k}.wav"
                if who == "ai":
                    fish_say(text, str(tmp), ref=str(FISH_REF), ref_text=FISH_REF_TEXT)
                else:
                    say("en", text, tmp, voice=voice, pause=0.2)
                trim(tmp)
                ok, score, info = judge(heard(tmp, who, n), text, "en")
                print(f"{n:02d} {who} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
                if best is None or (best[0] is not None and score > best[0]):
                    best = (score, tmp)
                if ok:
                    break
            if best[0] is not None:   # keep only the chosen take in the cache
                for f in takes.glob(f"{key}_*.wav"):
                    if f != best[1]:
                        f.unlink()
            shutil.copy(heard(best[1], who, n), src / line["file"])
    print("VOICE_DONE", flush=True)


if __name__ == "__main__":
    main({int(x) for x in sys.argv[1:]})
