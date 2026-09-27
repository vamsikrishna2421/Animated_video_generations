"""Pronunciation QA: transcribe each scene's narration with offline Whisper and list script
words the recogniser did not hear. Run after lesson_voice.py.

Usage: python3 pipeline/voice_qa.py <whisper_model_dir> ep01 [ep02 ...]
"""
import json
import re
import sys
from pathlib import Path

import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
import asr_check  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
# Words Whisper writes differently (digits, US spelling, brand casing) or that are expected
# to differ (Telugu name). Not pronunciation problems.
IGNORE = {"maastaaru", "chatgpt", "recognising", "recognises", "behaviour", "neighbours", "three", "four", "five",
          "seven", "twenty", "eighty", "fifteen", "thousand", "hundred", "seventy", "percent", "quarters", "believ",
          "sixteen", "forty", "claude"}


def us(w: str) -> str:
    """Fold British spellings to American so 'colours' matches 'colors'."""
    for a, b in (("our", "or"), ("isation", "ization"), ("ise", "ize"), ("ising", "izing"), ("lling", "ling"), ("practis", "practic"), ("tre", "ter")):
        if w.endswith(a) or a in w:
            w = w.replace(a, b)
    return w


def words(t: str):
    return [us(w) for w in re.findall(r"[a-z0-9]+", t.lower().replace("’", "'"))]


def main() -> None:
    rec = asr_check.recognizer(Path(sys.argv[1]))
    for ep in sys.argv[2:]:
        spec = json.loads((ROOT / "episodes" / f"{ep}.json").read_text())
        issues = []
        for i, sc in enumerate(spec["scenes"]):
            a, sr = sf.read(ROOT / "video" / "public" / "lessons" / ep / f"voice_{i + 1:02d}.wav")
            heard_text = asr_check.transcribe(rec, a, sr)
            heard = set(words(heard_text))
            said = words(re.sub(r"\[\d+\]|<pause [\d.]+>", "", sc["text"]))
            miss = [w for w in dict.fromkeys(said) if len(w) > 3 and w not in heard and w not in IGNORE]
            if miss:
                issues.append(f"  s{i + 1} {sc['type']}: missed {miss}\n      heard: {heard_text[:160]}")
        print(f"{ep}: {'OK' if not issues else str(len(issues)) + ' scene(s) to review'}")
        print("\n".join(issues))


if __name__ == "__main__":
    main()
