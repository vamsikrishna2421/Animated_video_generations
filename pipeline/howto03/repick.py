# HOW TO 03: pick a line's take again from every try kept in takes/_tries, with the judge as it is now (the first Telugu
# pass's spelling lists rejected good takes). No new voicing: it re-judges the tries of the line's current text and
# copies the best one into src/ (through the same filter and levelling).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/howto03/repick.py te <line numbers ...>
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "pipeline/howto03"))
import voice as V  # noqa: E402


def main(lang, only):
    sid = "howto03v1" if lang == "en" else "howto03te"
    spec = json.loads((ROOT / f"reels/{sid}.json").read_text())
    src = ROOT / f"video/public/reel/{sid}/src"
    tries = src.parent / "takes/_tries"
    for sc in spec["scenes"]:
        for line in sc["lines"]:
            n, who = int(line["file"][:2]), line["who"]
            if n not in only:
                continue
            parts = [(line.get("tts") or line["text"], line["file"], line.get("must", []), "")] + \
                    ([(line["tts2"], line["file2"], line.get("must2", []), "b")] if line.get("file2") else [])
            for raw, fname, must, b in parts:
                text = re.sub(r"\s+", " ", re.sub(r"\[\d+\]|<pause [\d.]+>", "", raw)).strip()
                fish = lang == "en" and who == "ai"
                voice = "fish:narrator" if fish else V.VOICE_EN[("en", who)] if lang == "en" else V.VOICE_TE[who]
                key = hashlib.md5(f"{voice}|{text}".encode()).hexdigest()[:10]
                best = None
                for f in sorted(tries.glob(f"{n:02d}{b}_{key}_*.wav")):
                    ok, score, info = V.judge(V.heard(f, who, n, lang), text, lang, must)
                    print(f"{n:02d}{b} {f.name}: {'OK' if ok else 'bad'} {score:.2f} {info}", flush=True)
                    if best is None or (ok, score) > best[:2]:
                        best = (ok, score, f)
                if best:
                    shutil.copy(V.heard(best[2], who, n, lang), src / fname)
                    V.level(src / fname)
                    print(f"{n:02d}{b}: kept {best[2].name}", flush=True)
                else:
                    print(f"{n:02d}{b}: no tries for this text", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], {int(x) for x in sys.argv[2:]})
