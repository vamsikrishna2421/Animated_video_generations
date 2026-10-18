# Strict per-sentence check of the chosen Telugu takes (te_chunks/cache.json): Whisper hears each sentence alone, with
# and without VAD (whole-line checks miss babble inside long takes). A take fails on a repeated 2-3 letter unit, a
# repeated word pair, or a take too long for its text. Failing sentences are re-voiced (tries 20-25) and the first
# passing take replaces the cached one; if none passes the old take stays (short sentences often fail on length only:
# read the transcripts).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/tools/te_verify.py reels/<id>.json scene [scene ...]
# Then splice the new takes into the lines: python3 pipeline/te_check.py reels/<id>.json <scenes> --force <scenes>
import hashlib
import json
import re
import sys
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from parler_tts_local import say, clean, sentences, chunks  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

m = WhisperModel("small", device="cpu", compute_type="int8")
spec = json.loads(Path(sys.argv[1]).read_text())
D = ROOT / "video/public/reel" / spec["id"] / "te_chunks"
cache = json.loads((D / "cache.json").read_text())
scenes = sys.argv[2:]


def check(p, ch):
    hs = [" ".join(s.text.strip() for s in m.transcribe(str(p), language="hi", beam_size=5, vad_filter=v)[0]) for v in (False, True)]
    rep = any(re.search(r"(\S\S)\1\1", h) or re.search(r"(\S\S\S)\1\1", h) for h in hs)
    w = hs[0].split()
    loop = len(w) > 5 and any(w[i:i + 2] == w[j:j + 2] for i in range(len(w) - 1) for j in range(i + 2, len(w) - 1))
    a, sr = sf.read(str(p))
    dur = len(a) / sr
    ok = bool(hs[0].strip()) and not rep and not loop and dur < max(2.8, len(ch) * 0.11)   # good takes: ~0.07-0.1 s a letter
    return ok, f"{dur:.1f}s | {hs[0][:100]} || {hs[1][:50]}"


for sc in spec["scenes"]:
    if sc["id"] not in scenes:
        continue
    line = sc["lines"][0]
    for key, tkey in (("file", "tts"), ("file2", "tts2")):
        if key not in line:
            continue
        text = line.get(tkey) or clean(line["text"])
        stem = Path(line[key]).stem
        for ch in [c for x in sentences(text) for c in chunks(x)]:
            f = cache.get(ch)
            ok, info = check(D / f, ch) if f and (D / f).exists() else (False, "missing")
            print(f"{sc['id']}/{key} {'OK ' if ok else 'BAD'} {ch[:40]} | {info}", flush=True)
            if ok:
                continue
            h8 = hashlib.md5(ch.encode()).hexdigest()[:8]
            for k in range(20, 26):
                p = D / f"{stem}_{h8}_{k}.wav"
                say("te", ch, p)
                ok, info = check(p, ch)
                print(f"   try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
                if ok:
                    cache[ch] = p.name
                    (D / "cache.json").write_text(json.dumps(cache, ensure_ascii=False, indent=1))
                    break
print("VERIFY_DONE", flush=True)
