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
    ("hook", "file"): [r"tiny free (ai|a\.i\.)", r"whatsapp orders", r"neat slips", r"copied them back", r"zero out of thirty|0 out of 30", r"better prompt", r"two examples", r"sixteen|16", r"trained it on", r"two hundred (and )?forty|240", r"made[- ]up orders", r"fourteen minutes|14 minutes", r"no graphics card", r"twenty[- ]seven|27", r"new orders,? it never saw"],
    ("why", "file"): [r"why not just ask", r"chat ?gpt|chat g\.?p\.?t", r"free", r"own computer", r"customer details", r"never leave"],
    ("hard", "file"): [r"normal training", r"every one of its", r"three hundred (and )?sixty million|360 million", r"numbers", r"every new skill", r"whole new copy"],
    ("trick", "file"): [r"called (lora|laura|lorra|lara)", r"freeze the original", r"new numbers on top", r"sticky notes", r"textbook", r"train only the notes", r"own (nine|9)[- ]megabyte file|9 ?mb file", r"whatsapp video", r"seven hundred (and )?twenty[- ]four|724", r"movie", r"apple says", r"iphone (ai|a\.i\.)", r"skill file per feature"],
    ("quiz", "file"): [r"your turn", r"prices change every week", r"(lora|laura|lorra|lara) notes", r"this week'?s prices", r"price list with every question", r"which one"],
    ("quiz", "file2"): [r"answer is (b|bee)\b", r"give it the list", r"(lora|laura|lorra|lara) notes", r"retraining every week", r"misremember a price"],
    ("close", "file"): [r"prompt first", r"facts that keep changing", r"put them in the prompt", r"can'?t nail", r"small (lora|laura|lorra|lara)", r"check its work", r"three wrong|3 wrong", r"right page", r"documents", r"follow"],
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
                words = lambda t: re.findall(r"[a-z']+", t.lower())
                hw = words(h)
                rep = any(hw[i:i + 3] == hw[i + 3:i + 6] for i in range(len(hw) - 5))   # a phrase said twice in a row
                if rep or len(hw) > len(words(text)) + 2:
                    ok -= 3   # repeats or extra words: never keep over a clean take
                slow = len(words(text)) / (len(a) / sr) < 2.0   # words per second before the 1.2x tempo (good takes: 2.2-2.9)
                if slow:
                    ok -= 2
                print(f"{sc['id']}/{key} take {k}: {ok}/{len(pats)}{' REPEAT' if rep else ''}{' SLOW' if slow else ''} {len(a) / sr:.1f}s | {h}", flush=True)
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
