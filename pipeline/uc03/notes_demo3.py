# UC03 second follow-up (written and committed before it ran), asked for at the script review: what do the NOTES say
# when the call says "rupees", when speech-to-text gets the rupee hint, and when the amount is said in full?
#   rupees:  the notes_demo2.py transcript of the call with "fourteen fifty rupees a bag" (heard as "14 .50 rupees");
#   hint:    the notes_demo2.py transcript of the original call with the rupee hint (amounts in words, no dollar sign);
#   full:    a new recording, same voices, with the amount said in full: "One thousand four hundred and fifty rupees a
#            bag" and "fourteen thousand rupees", then speech-to-text with no hint.
# Notes with the names-first format (notes_demo2.ASK2), no names on the turns, Qwen2.5-7B-Instruct as before,
# seeds 1-10, temperature 0.7. Counted: the price per bag and the order total each reply gives, then read by hand.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc03/notes_demo3.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/uc03"))
import notes_demo as n  # noqa: E402
import notes_demo2 as n2  # noqa: E402

TURNS_FULL = list(n.TURNS)
TURNS_FULL[1] = ("Suresh", "Forty bags, fine. One thousand four hundred and fifty rupees a bag. I can deliver on Friday morning.")
TURNS_FULL[2] = ("Ravi", "One thousand four hundred and fifty is okay. I'll send fourteen thousand rupees as advance by Thursday.")
HAND = None   # filled in by hand after reading all 30 replies


def money(reply):
    t = reply.replace(",", "")
    per = re.findall(r"([$₹]|rs\.?\s?|inr\s?|usd\s?)?\s?(\d+(?:\.\d+)?)\s?(rupees|usd|dollars)?\s?(?:per|/|each|a)\s?bag", t, re.I)
    tot = re.findall(r"(?:total|order)[^\n]{0,40}?([$₹]|rs\.?\s?|inr\s?)?\s?(\d{3,6}(?:\.\d+)?)", t, re.I)
    return {"per_bag": [" ".join(x for x in m if x).strip() for m in per], "total": [" ".join(x for x in m if x).strip() for m in tot]}


def main():
    prev = json.loads((n.OUT / "notes2.json").read_text())
    n2.record(TURNS_FULL, n.OUT / "call_full.wav")
    ears = {"rupees": prev["ears"]["ears_rupees"], "hint": prev["ears"]["ears_hint"],
            "full": " ".join(w for w, s, e in n2.transcribe(n.OUT / "call_full.wav"))}
    print("full |", ears["full"], flush=True)
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
        for setup in ("rupees", "hint", "full"):
            for seed in range(1, 11):
                body = json.dumps({"model": "ai", "messages": [{"role": "system", "content": n.SYSTEM},
                                                               {"role": "user", "content": n2.ASK2.format(t=ears[setup])}],
                                   "temperature": 0.7, "seed": seed, "max_tokens": 320}).encode()
                req = urllib.request.Request(f"http://127.0.0.1:{n.d.PORT}/v1/chat/completions", data=body,
                                             headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
                with urllib.request.urlopen(req, timeout=1200) as r:
                    reply = json.loads(r.read())["choices"][0]["message"]["content"]
                rows.append({"setup": setup, "seed": seed, "reply": reply, **money(reply)})
                print(setup, seed, rows[-1]["per_bag"], rows[-1]["total"], flush=True)
                (n.OUT / "notes3.json").write_text(json.dumps({"turns_full": TURNS_FULL, "ears": ears, "rows": rows},
                                                             indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
