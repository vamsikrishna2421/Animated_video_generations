"""Judged retakes for a news narration part: voice it up to N times, transcribe each take with Whisper and keep the first
whose transcript contains every required word, as the cached take news_build.py will use.

  HF_HUB_CACHE=/dev/shm/hf python3 pipeline/tools/news_retake.py news/<spec>.json en "<part text>" "word1|word2" [tries]

Required words are matched in the transcript with spaces and punctuation removed ("open ai" matches "openai"). Then
run news_build.py again: it finds the cached take and rebuilds the segment and the timeline.
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import radio, say  # noqa: E402


def norm(t):
    return re.sub(r"[^a-z0-9ऀ-ॿ]", "", t.lower())


def main(spec_path, lang, text, must, tries=4):
    spec = json.loads(Path(spec_path).read_text())
    out_dir = ROOT / "video" / "public" / "news" / spec["id"] / lang
    h = hashlib.sha1(f"{lang}|{text}".encode()).hexdigest()[:10]
    target = out_dir / f"raw_{h}.wav"
    words = [w for w in must.split("|") if w]
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    best = None
    for i in range(int(tries)):
        f = out_dir / f"take_{h}_{i}.wav"
        say(lang, text, f)
        if lang == "te":
            radio(f)
        segs, _ = m.transcribe(str(f), language="en" if lang == "en" else "hi")
        heard = " ".join(s.text.strip() for s in segs)
        miss = [w for w in words if norm(w) not in norm(heard)]
        print(f"take {i}: missing {miss or 'none'} | {heard}", flush=True)
        if best is None or len(miss) < best[0]:
            best = (len(miss), f)
        if not miss:
            break
    shutil.copy(best[1], target)
    for f in out_dir.glob(f"take_{h}_*.wav"):
        f.unlink()
    print("kept", target.name, "missing", best[0], flush=True)


if __name__ == "__main__":
    main(*sys.argv[1:])
