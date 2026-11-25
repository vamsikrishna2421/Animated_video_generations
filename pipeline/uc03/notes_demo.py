# UC03 test (written and committed before it ran): how AI meeting notes work, and where they go wrong.
# A made-up phone call (every name, price and item made up by us): Ravi (the shop) orders rice from Suresh (a supplier),
# 8 turns, voiced by two computer voices (Kokoro am_michael for Ravi, am_onyx for Suresh) and joined into one recording.
#   step 1, ears: speech-to-text (faster-whisper small, int8, on our computer) turns the recording into text;
#   step 2, who spoke: two setups for the same text:
#       plain:    the transcript as one block, no speaker names (what you get when the app can't tell the voices apart,
#                 or from a phone-call recording);
#       speakers: each turn labelled with who said it (the true turns, from our own recording: the ideal case);
#   step 3, notes: Qwen2.5-7B-Instruct (4-bit, llama.cpp, on our computer) writes the notes and the action items,
#                 "Owner: task", one fresh chat per run, temperature 0.7, seeds 1-10, 10 runs per setup.
# Scored automatically (for each of 6 action items: the owner named on its line) and then read by hand (HAND).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc03/notes_demo.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
import rag_demo as d  # noqa: E402  (model_file, PORT)

OUT = ROOT / "series/scripts/uc03_demo"
TURNS = [
    ("Ravi", "Hello Suresh garu, Ravi from the shop. I need forty bags of sona masoori rice for next week."),
    ("Suresh", "Forty bags, fine. Fourteen fifty a bag. I can deliver on Friday morning."),
    ("Ravi", "Fourteen fifty is okay. I'll send fourteen thousand as advance by Thursday."),
    ("Suresh", "Good. And I'll take care of the transport, five hundred rupees, don't worry about that."),
    ("Ravi", "Thank you. Please send the bill by Wednesday, I want to check it first."),
    ("Suresh", "I'll send it. Also, keep three empty sacks ready, I'll take them back."),
    ("Ravi", "Okay, I'll keep them ready. And the balance, I'll pay on delivery."),
    ("Suresh", "Done. Friday morning, then."),
]
VOICE = {"Ravi": "am_michael", "Suresh": "am_onyx"}
# the six action items and their true owners; each found on a line of the notes by its keywords
ITEMS = {
    "deliver 40 bags Friday": ("Suresh", r"deliver|delivery of|40 bags|forty bags"),
    "advance Rs 14,000 by Thursday": ("Ravi", r"advance|14,?000|fourteen thousand"),
    "transport Rs 500": ("Suresh", r"transport"),
    "send the bill by Wednesday": ("Suresh", r"\bbill\b"),
    "keep 3 empty sacks": ("Ravi", r"sack"),
    "pay the balance on delivery": ("Ravi", r"balance"),
}
SYSTEM = "You write meeting notes for a small shop."
ASK = ("Here is the transcript of a phone call. Write the meeting notes: a 2-line summary, then the action items, one "
       "per line, as 'Owner: task (amount, date)'.\n\nTranscript:\n{t}")
HAND = None   # filled in by hand after reading all 20 replies


def record():
    from kokoro_onnx import Kokoro
    k = Kokoro(str(ROOT / "models/kokoro-v1.0-timed.onnx"), str(ROOT / "models/voices-v1.0.bin"))
    parts, spans, t = [], [], 0.0
    for who, text in TURNS:
        s, sr = k.create(text, voice=VOICE[who], speed=1.0, lang="en-us")
        gap = np.zeros(int(0.35 * sr), dtype=np.float32)
        parts += [s.astype(np.float32), gap]
        spans.append((who, round(t, 2), round(t + len(s) / sr, 2)))
        t += (len(s) + len(gap)) / sr
    audio = np.concatenate(parts)
    sf.write(OUT / "call.wav", audio, sr)
    return spans


def ears():
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8")
    t0 = time.time()
    segs, _ = m.transcribe(str(OUT / "call.wav"), language="en", beam_size=5, word_timestamps=True)
    words = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    return words, round(time.time() - t0, 1)


def labelled(words, spans):
    """Each word goes to the turn its middle falls in: the true speaker for every turn (the ideal 'who spoke')."""
    out = []
    for who, a, b in spans:
        ws = [w for w, s, e in words if a - 0.2 <= (s + e) / 2 <= b + 0.2]
        out.append(f"{who}: {' '.join(ws)}")
    return "\n".join(out)


def owners(reply):
    lines = [l for l in reply.splitlines() if l.strip()]
    res = {}
    for item, (truth, pat) in ITEMS.items():
        hit = [l for l in lines if re.search(pat, l, re.I) and re.search(r"ravi|suresh", l, re.I)]
        if not hit:
            res[item] = "missing"
            continue
        l = hit[-1]   # the action-item line comes after the summary
        head = l.split(":")[0].lower()
        who = "Ravi" if "ravi" in head else "Suresh" if "suresh" in head else ("Ravi" if re.search(r"ravi", l, re.I) and not re.search(r"suresh", l, re.I) else "Suresh" if re.search(r"suresh", l, re.I) and not re.search(r"ravi", l, re.I) else "unclear")
        res[item] = "right" if who == truth else ("wrong" if who in ("Ravi", "Suresh") else "unclear")
    return res


def call(key, user, seed):
    body = json.dumps({"model": "ai", "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}],
                       "temperature": 0.7, "seed": seed, "max_tokens": 320}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    spans = record()
    words, secs = ears()
    plain = " ".join(w for w, s, e in words)
    texts = {"plain": plain, "speakers": labelled(words, spans)}
    print("EARS", secs, "s |", plain, flush=True)
    print(texts["speakers"], flush=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for setup in ("plain", "speakers"):
            for seed in range(1, 11):
                reply = call(key, ASK.format(t=texts[setup]), seed)
                o = owners(reply)
                rows.append({"setup": setup, "seed": seed, "reply": reply, "owners": o})
                print(setup, seed, {k: v for k, v in o.items()}, flush=True)
                (OUT / "notes.json").write_text(json.dumps({"turns": TURNS, "spans": spans, "ears_secs": secs, "texts": texts,
                                                           "items": {k: v[0] for k, v in ITEMS.items()}, "rows": rows},
                                                          indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
