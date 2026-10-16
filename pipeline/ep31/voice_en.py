# Voice EP31 English with Fish (free model), steered by the channel narrator (an EP29 line as the reference clip).
# Each take is checked by Whisper against key phrases; up to 4 takes per line, best kept.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep31/voice_en.py [scene | scene:file2 ...]
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
    ("hook", "file"): [r"free (ai|a\.i\.)", r"whatsapp order", r"order slip", r"zero out of", r"taught it", r"minutes", r"(four|4) ordinary cpu|cpu cores", r"no gpu|no g\.?p\.?u", r"perfect", r"the trick"],
    ("hard", "file"): [r"normally", r"every number", r"three hundred and sixty million|360 million", r"hundreds of billions", r"servers full of", r"seven billion|7 billion|7-billion", r"(a )?hundred gigabytes|100 gigabytes|100 ?gb", r"chip memory"],
    ("trick", "file"): [r"(lora|laura|lorra)'?s trick", r"freeze the original", r"thin strips", r"sticky notes", r"textbook", r"train only those", r"one point two percent|1\.2 ?(%|percent)", r"small file", r"megabytes?", r"megabyte model"],
    ("quiz", "file"): [r"your turn", r"prices change every week", r"(lora|laura|lorra)", r"this week'?s price list", r"price list with every question", r"which one"],
    ("quiz", "file2"): [r"^\s*b\b|\bb\.", r"bake in old prices", r"skills and style", r"facts that change", r"give them to the (ai|a\.i\.)", r"each time"],
    ("swap", "file"): [r"one model", r"many skill files", r"orders", r"shop'?s tone", r"class notes", r"swap them in a second"],
    ("real", "file"): [r"lab trick", r"apple says", r"phone (ai|a\.i\.)", r"small adapters", r"one per feature", r"drawing style", r"small file", r"cousin", r"q ?(lora|laura|lorra)|cue lora|q-lora", r"sixty[- ]five billion|65[- ]billion", r"single gpu|single g\.?p\.?u"],
    ("close", "file"): [r"before you train anything", r"good prompt", r"facts that change", r"each time", r"skill or a style", r"small (lora|laura|lorra)", r"right page", r"documents", r"follow"],
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
    spec = json.loads((ROOT / "reels/ep31v1.json").read_text())
    src = ROOT / "video/public/reel" / spec["id"] / "src"
    src.mkdir(parents=True, exist_ok=True)
    for sc in spec["scenes"]:
        if only and sc["id"] not in {o.split(":")[0] for o in only}:
            continue
        line = sc["lines"][0]
        for key, tkey in (("file", "tts"), ("file2", "tts2")):
            if key not in line or (only and sc["id"] not in only and f"{sc['id']}:{key}" not in only):
                continue   # "quiz:file2" re-voices only the second take of that scene
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
