# Voice EP30 English with Fish (free model), steered by the channel narrator (an EP29 line as the reference clip).
# Each take is checked by Whisper against key phrases; up to 4 takes per line, best kept.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep30/voice_en.py [scene ...]
import json
import re
import sys
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from fish_tts import say  # noqa: E402

REF = ROOT / "video/public/reel/ep29v1/src/01_hook.wav"
REF_TEXT = ("This dog is a banana, says this AI, 99.99% sure. Before we touched it: golden retriever. "
            "We changed its colours by a shade you can't see. It only sees numbers, and we pushed them the right way.")
PATS = {
    ("hook", "file"): [r"business idea", r"unique and intriguing", r"selling ice", r"antarctica", r"manners training", r"couldn'?t even answer", r"repeated my words", r"four times"],
    ("raw", "file"): [r"helps you", r"flatters you", r"stay till the end", r"train it yourself", r"raw (ai|a\.i\.)", r"next word", r"phone keyboard", r"keeps writing"],
    ("steps12", "file"): [r"step one", r"example answers", r"copies them", r"step two", r"shortcut", r"rank them"],
    ("steps34", "file"): [r"step three", r"rankings", r"robot judge", r"step four", r"practi[sc]es", r"high score", r"again and again", r"r\.? ?l\.? ?h\.? ?f|rlhf", r"human feedback", r"open ?ai", r"hundred times bigger|100 times bigger"],
    ("quiz", "file"): [r"your turn", r"your idea", r"months", r"really strong", r"go for it", r"price is too low", r"lose money", r"three months|3 months", r"thumbs up"],
    ("quiz", "file2"): [r"helps you", r"feels nicer", r"what we like", r"what'?s true"],
    ("real", "file"): [r"just theory", r"april", r"twenty[- ]?five|2025", r"open ?ai", r"chat ?gpt|chat g\.?p\.?t", r"too flattering", r"thumbs[- ]up", r"thumbs[- ]down", r"buttons", r"agree with you"],
    ("close", "file"): [r"manners,? not proof", r"three biggest reasons|3 biggest reasons", r"fail", r"friend'?s idea", r"new skill", r"supercomputer", r"follow"],
}
ASR = None


def heard(path):
    global ASR
    if ASR is None:
        from faster_whisper import WhisperModel
        ASR = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    segs, _ = ASR.transcribe(str(path), language="en", vad_filter=False)
    return " ".join(s.text.strip() for s in segs)


def main(only):
    spec = json.loads((ROOT / "reels/ep30v1.json").read_text())
    src = ROOT / "video/public/reel" / spec["id"] / "src"
    src.mkdir(parents=True, exist_ok=True)
    for sc in spec["scenes"]:
        if only and sc["id"] not in only:
            continue
        line = sc["lines"][0]
        for key, tkey in (("file", "tts"), ("file2", "tts2")):
            if key not in line:
                continue
            text, pats, out = line[tkey], PATS[(sc["id"], key)], src / line[key]
            best = None
            for k in range(4):
                tmp = out.with_suffix(f".try{k}.wav")
                say(text, str(tmp), ref=str(REF), ref_text=REF_TEXT)
                h = heard(tmp)
                a, sr = sf.read(tmp)
                ok = sum(bool(re.search(p, h, re.I)) for p in pats)
                print(f"{sc['id']}/{key} take {k}: {ok}/{len(pats)} {len(a) / sr:.1f}s | {h}", flush=True)
                if best is None or ok > best[0]:
                    if best:
                        best[1].unlink(missing_ok=True)
                    best = (ok, tmp)
                else:
                    tmp.unlink(missing_ok=True)
                if ok == len(pats):
                    break
            best[1].replace(out)
            print(f"KEPT {sc['id']}/{key} {best[0]}/{len(pats)}", flush=True)
    print("EN_DONE", flush=True)


if __name__ == "__main__":
    main(set(sys.argv[1:]))
