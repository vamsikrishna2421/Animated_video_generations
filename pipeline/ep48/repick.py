# EP48 (as EP47): pick a line's take again from every try kept in takes/_tries, with the judge as it is now (the first Telugu run's
# MUST groups used spellings Whisper doesn't write, so good takes were scored as misses). No new voicing: it re-judges
# the tries of the line's current text and copies the best one into src/ (through the same filter and levelling).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep48/repick.py te <line numbers ...>
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "pipeline/ep48"))
import voice as V  # noqa: E402


def main(lang, only):
    sid = "ep48v1" if lang == "en" else "ep48te"
    spec = json.loads((ROOT / f"reels/{sid}.json").read_text())
    src = ROOT / f"video/public/reel/{sid}/src"
    tries = src.parent / "takes/_tries"
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n, who = int(line["file"][:2]), line["who"]
            if n not in only:
                continue
            parts = [(line.get("tts") or line["text"], line["file"], n)] + ([(line["tts2"], line["file2"], f"{n}b")] if line.get("file2") else [])
            for raw, fname, mk in parts:
                text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
                voice = ("fish:narrator" if who == "ai" else V.VOICE_EN[("en", who)]) if lang == "en" else V.VOICE_TE[who]
                key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
                tagn = f"{n:02d}" if isinstance(mk, int) else f"{n:02d}b"
                best = None
                for f in sorted(tries.glob(f"{tagn}_{key}_*.wav")):
                    ok, score, info = V.judge(V.heard(f, who, n, lang), text, lang, mk)
                    print(f"{tagn} {f.name}: {'OK' if ok else 'bad'} {score:.2f} {info}", flush=True)
                    if best is None or (ok, score) > best[:2]:
                        best = (ok, score, f)
                if best:
                    shutil.copy(V.heard(best[2], who, n, lang), src / fname)
                    V.level(src / fname)
                    print(f"{tagn}: kept {best[2].name}", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:]})
