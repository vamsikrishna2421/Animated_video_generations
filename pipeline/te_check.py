# Check Telugu Parler takes (Whisper in Devanagari: script share, babble, speaking rate) and re-voice only the lines
# that fail, one sentence at a time (good sentences kept, failing ones re-rolled up to 3 times).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/te_check.py reels/ep30te.json [scene ...]
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say, clean, sentences, chunks  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

ASR = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)


def judge(path, text):
    a, sr = sf.read(str(path))
    dur = len(a) / sr
    segs, _ = ASR.transcribe(str(path), language="hi", vad_filter=True)
    h = " ".join(s.text.strip() for s in segs)
    letters = [ch for ch in h if ch.isalpha()]
    dev = sum("ऀ" <= ch <= "ॿ" for ch in letters) / max(1, len(letters))
    rate = len(re.sub(r"\s", "", text)) / max(dur, 0.1)
    doubles = lambda t: len(re.findall(r"(?:^|\s)(\S{2,})\s+\1(?=\s|$)", re.sub(r"[.,!?।]", " ", t)))
    babble = bool(re.search(r"([^\s.,!?।])\1\1", h)) or doubles(h) > doubles(text)
    ok = bool(h) and dev >= 0.9 and not babble and 7.0 <= rate <= 14.5
    return ok, (ok, dev, -abs(rate - 12.0)), f"dev {dev:.2f} rate {rate:.1f} {'BABBLE ' if babble else ''}| {h[:140]}"


def revoice(out, text, tmp_dir):
    parts = [c for x in sentences(text) for c in chunks(x)]
    sr, pieces = None, []
    for i, ch in enumerate(parts):
        best = None
        for k in range(3):
            tmp = tmp_dir / f"{out.stem}_{i:02d}_{k}.wav"
            say("te", ch, tmp)
            ok, score, info = judge(tmp, ch)
            print(f"  chunk {i} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
            if best is None or score > best[0]:
                best = (score, tmp)
            if ok:
                break
        a, sr = sf.read(str(best[1]))
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.08 * sr)] if len(nz) else a
        pieces += [a, np.zeros(int(0.35 * sr))]
    sf.write(out, np.concatenate(pieces).astype(np.float32), sr)


def main(spec_path, only):
    spec = json.loads(Path(spec_path).read_text())
    src = ROOT / "video/public/reel" / spec["id"] / "src"
    tmp_dir = src.parent / "te_chunks"
    tmp_dir.mkdir(exist_ok=True)
    for sc in spec["scenes"]:
        if only and sc["id"] not in only:
            continue
        line = sc["lines"][0]
        for key, tkey in (("file", "tts"), ("file2", "tts2")):
            if key not in line:
                continue
            text = line.get(tkey) or clean(line["text"])
            out = src / line[key]
            ok, _, info = judge(out, text)
            print(f"{sc['id']}/{key}: {'OK' if ok else 'FAIL'} {info}", flush=True)
            if not ok:
                revoice(out, text, tmp_dir)
                ok2, _, info2 = judge(out, text)
                print(f"{sc['id']}/{key} after re-voice: {'OK' if ok2 else 'still weak'} {info2}", flush=True)
    print("TE_CHECK_DONE", flush=True)


if __name__ == "__main__":
    main(sys.argv[1], set(sys.argv[2:]))
