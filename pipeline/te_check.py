# Check Telugu Parler takes (Whisper in Devanagari: script share, babble, speaking rate) and re-voice only the lines
# that fail, one sentence at a time (good sentences kept, failing ones re-rolled up to 3 times).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/te_check.py reels/ep30te.json [scene ...] [--force scene[:file2] ...]
# --force re-voices a line whose text changed (the old take would be judged against the new text). Chosen sentence
# takes are cached by text (te_chunks/cache.json), so an edited line only re-voices the sentences that changed.
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
    a = a.mean(axis=1) if a.ndim > 1 else a
    hop = int(0.02 * sr)
    rms = np.sqrt((a[:len(a) // hop * hop].reshape(-1, hop) ** 2).mean(axis=1))
    dur = max(0.1, (rms > 0.03 * np.percentile(rms, 95)).sum() * 0.02)   # voiced time: pauses can't hide a dropped sentence
    segs, _ = ASR.transcribe(str(path), language="hi", vad_filter=True)
    h = " ".join(s.text.strip() for s in segs)
    letters = [ch for ch in h if ch.isalpha()]
    dev = sum("ऀ" <= ch <= "ॿ" for ch in letters) / max(1, len(letters))
    rate = len(re.sub(r"\s", "", text)) / max(dur, 0.1)
    doubles = lambda t: len(re.findall(r"(?:^|\s)(\S{2,})\s+\1(?=\s|$)", re.sub(r"[.,!?।]", " ", t)))
    toks = h.split()
    babble = (bool(re.search(r"([^\s.,!?।])\1\1", h)) or doubles(h) > doubles(text)
              or any(toks.count(t) >= 4 for t in set(toks) if len(toks) >= 4))   # e.g. a run of one hallucinated token
    ok = bool(h) and dev >= 0.9 and not babble and 11.0 <= rate <= 21.0   # chars per voiced second (good takes: ~16-19)
    return ok, (ok, dev, -abs(rate - 17.5)), f"dev {dev:.2f} rate {rate:.1f} {'BABBLE ' if babble else ''}| {h[:140]}"


def revoice(out, text, tmp_dir):
    parts = [c for x in sentences(text) for c in chunks(x)]
    cache_f = tmp_dir / "cache.json"
    cache = json.loads(cache_f.read_text()) if cache_f.exists() else {}
    sr, pieces = None, []
    for i, ch in enumerate(parts):
        best = None
        if ch in cache and (tmp_dir / cache[ch]).exists():
            print(f"  chunk {i}: reused {cache[ch]}", flush=True)
            best = (None, tmp_dir / cache[ch])
        for k in range(0 if best else 3):
            tmp = tmp_dir / f"{out.stem}_{i:02d}_{k}.wav"
            say("te", ch, tmp)
            ok, score, info = judge(tmp, ch)
            print(f"  chunk {i} try {k}: {'OK' if ok else 'bad'} {info}", flush=True)
            if best is None or score > best[0]:
                best = (score, tmp)
            if ok:
                break
        cache[ch] = best[1].name
        cache_f.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
        a, sr = sf.read(str(best[1]))
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - int(0.03 * sr)): nz[-1] + int(0.08 * sr)] if len(nz) else a
        pieces += [a, np.zeros(int(0.35 * sr))]
    sf.write(out, np.concatenate(pieces).astype(np.float32), sr)


def main(spec_path, only, force):
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
            forced = sc["id"] in force or f"{sc['id']}:{key}" in force
            if forced or not out.exists():
                ok, info = False, "forced (text changed)"
            else:
                ok, _, info = judge(out, text)
            print(f"{sc['id']}/{key}: {'OK' if ok else 'FAIL'} {info}", flush=True)
            if not ok:
                revoice(out, text, tmp_dir)
                ok2, _, info2 = judge(out, text)
                print(f"{sc['id']}/{key} after re-voice: {'OK' if ok2 else 'still weak'} {info2}", flush=True)
    print("TE_CHECK_DONE", flush=True)


if __name__ == "__main__":
    args = sys.argv[2:]
    force = set(args[args.index("--force") + 1:]) if "--force" in args else set()
    only = set(args[:args.index("--force")] if "--force" in args else args)
    main(sys.argv[1], only | {f.split(":")[0] for f in force} if only else only, force)
