# UC03 follow-up (written and committed before it ran). notes_demo.py found: speech-to-text wrote "fourteen fifty a
# bag" (Rs 1,450) as "$14 .50" and "fourteen thousand" as "$14,000", and most notes then priced the order at "$580";
# and many notes wrote the literal word "Owner:" (our format), so who-does-what was unclear. This test:
#   ears_rupees:  the same call re-voiced with "rupees" said after both amounts (turns 2 and 3), same voices;
#   ears_hint:    the original recording, with a hint to speech-to-text (initial_prompt): "A shop call in India.
#                 Prices are in Indian rupees: fourteen fifty means one thousand four hundred and fifty rupees.";
#   notes, with a clearer format ("Ravi: ..." / "Suresh: ...", the person's name first), on the original transcript:
#       plain:    no speaker names in the transcript;   speakers: each turn labelled with who said it.
# Qwen2.5-7B-Instruct as before (seeds 1-10, temperature 0.7). Scored by the name at the start of each action line,
# then read by hand (HAND).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc03/notes_demo2.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/uc03"))
import notes_demo as n  # noqa: E402

TURNS_RUPEES = list(n.TURNS)
TURNS_RUPEES[1] = ("Suresh", "Forty bags, fine. Fourteen fifty rupees a bag. I can deliver on Friday morning.")
TURNS_RUPEES[2] = ("Ravi", "Fourteen fifty is okay. I'll send fourteen thousand rupees as advance by Thursday.")
HINT = ("A shop call in India. Prices are in Indian rupees: fourteen fifty means one thousand four hundred and fifty "
        "rupees.")
ASK2 = ("Here is the transcript of a phone call. Write the meeting notes: a 2-line summary, then the action items, one "
        "per line, each starting with the name of the person who will do it, like 'Ravi: task (amount, date)' or "
        "'Suresh: task (amount, date)'.\n\nTranscript:\n{t}")
HAND = None   # filled in by hand after reading all 20 replies


def transcribe(path, prompt=None):
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(str(path), language="en", beam_size=5, word_timestamps=True, initial_prompt=prompt)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]


def record(turns, out):
    from kokoro_onnx import Kokoro
    k = Kokoro(str(ROOT / "models/kokoro-v1.0-timed.onnx"), str(ROOT / "models/voices-v1.0.bin"))
    parts = []
    for who, text in turns:
        s, sr = k.create(text, voice=n.VOICE[who], speed=1.0, lang="en-us")
        parts += [s.astype(np.float32), np.zeros(int(0.35 * sr), dtype=np.float32)]
    sf.write(out, np.concatenate(parts), sr)


def names(reply):
    """For each action item: the name at the start of its line (Ravi / Suresh / none)."""
    lines = [re.sub(r"^[\s*\-•\d.]+", "", l).replace("**", "").strip() for l in reply.splitlines() if l.strip()]
    res = {}
    for item, (truth, pat) in n.ITEMS.items():
        hit = [l for l in lines if re.search(pat, l, re.I) and re.match(r"(ravi|suresh)\b", l, re.I)]
        if not hit:
            res[item] = "no line with a name"
            continue
        who = "Ravi" if hit[-1].lower().startswith("ravi") else "Suresh"
        res[item] = "right" if who == truth else "wrong"
    return res


def main():
    old = json.loads((n.OUT / "notes.json").read_text())
    record(TURNS_RUPEES, n.OUT / "call_rupees.wav")
    ears = {"ears_rupees": " ".join(w for w, s, e in transcribe(n.OUT / "call_rupees.wav")),
            "ears_hint": " ".join(w for w, s, e in transcribe(n.OUT / "call.wav", HINT))}
    for k, v in ears.items():
        print(k, "|", v, flush=True)
    texts = old["texts"]
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(n.d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(n.d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", n.d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for setup in ("plain", "speakers"):
            for seed in range(1, 11):
                body = json.dumps({"model": "ai", "messages": [{"role": "system", "content": n.SYSTEM},
                                                               {"role": "user", "content": ASK2.format(t=texts[setup])}],
                                   "temperature": 0.7, "seed": seed, "max_tokens": 320}).encode()
                import urllib.request
                req = urllib.request.Request(f"http://127.0.0.1:{n.d.PORT}/v1/chat/completions", data=body,
                                             headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
                with urllib.request.urlopen(req, timeout=1200) as r:
                    reply = json.loads(r.read())["choices"][0]["message"]["content"]
                o = names(reply)
                rows.append({"setup": setup, "seed": seed, "reply": reply, "names": o})
                print(setup, seed, o, flush=True)
                (n.OUT / "notes2.json").write_text(json.dumps({"turns_rupees": TURNS_RUPEES, "hint": HINT, "ears": ears,
                                                              "ask": ASK2, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
