# Voice EP32 English with Fish (free model), steered by the channel narrator (an EP29 line as the reference clip).
# Each take is checked by Whisper against key phrases; up to 4 takes per line, best kept.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep32/voice_en.py [scene | scene:file2 ...]
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
    ("hook", "file"): [r"gave an (ai|a\.i\.)", r"phone'?s manual", r"survive a shower", r"pulled up", r"meteor shower mode", r"matched the word", r"not the meaning"],
    ("score", "file"): [r"thirty everyday questions|30 everyday questions", r"right page first", r"keyword search", r"eighteen|18", r"meaning search", r"twenty[- ]five|25"],
    ("guess", "file"): [r"why it matters", r"no page", r"guesses", r"give it back", r"don'?t like it", r"small (ai|a\.i\.)", r"for a refund", r"manual says no"],
    ("why", "file"): [r"paste the whole manual", r"short one", r"hundreds of pages", r"in our test", r"whole chapters", r"as often", r"six times|6 times", r"the text"],
    ("cut", "file"): [r"step (one|1)", r"cut it into pieces", r"every forty words|every 40 words", r"mid-?sentence", r"thirteen out of thirty|13 out of 30", r"overlap them", r"twenty|20", r"cut at headings", r"twenty[- ]five|25"],
    ("shelf", "file"): [r"step two", r"numbers for its meaning", r"vector database", r"library sorted by meaning", r"question becomes numbers", r"nearest pieces"],
    ("rerank", "file"): [r"step (three|3)", r"re-?ranker", r"beside each top piece", r"re-?orders them", r"first[- ]place misses", r"five|5", r"three|3"],
    ("quiz", "file"): [r"your turn", r"first piece", r"keeps coming second", r"what helps more", r"bigger (ai|a\.i\.)", r"re-?ranker"],
    ("quiz", "file2"): [r"^\W*the re-?ranker\W+why", r"bigger (ai|a\.i\.),? still reads the wrong page", r"guarantee", r"returns page", r"warranty page"],
    ("close", "file"): [r"short document", r"paste it", r"big one", r"cut at headings", r"search by meaning", r"re-?rank if it reads one piece", r"chatbot with your pdf|chat ?bot with your p\.?d\.?f", r"quote the lines", r"exact codes", r"follow"],
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
    spec = json.loads((ROOT / "reels/ep32v1.json").read_text())
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
