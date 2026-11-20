# Creative 35 test (written and committed before it ran): myth vs fact, "an AI translation is safe for your money
# papers". A health-insurance summary we wrote (10 lines; no real insurer or policy) is pasted into a small free AI
# (Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our computer) to translate into Telugu, the way someone would for a parent.
# 5 fresh chats per ask, temperature 0.7, seeds 1-5, max 900 tokens.
#   P1 the usual ask:  "Translate this into Telugu for my mother:" + the 10 lines.
#   P2 the better ask: the same + "Keep every number, and every 'not', 'only' and 'unless', exactly. After the
#                      translation, list each number and each condition in English."
# Counted per line (50 lines per ask): a NUMBER error when a number from the line (36, 5,000, 20, 60, 2, 30, 2,000) is
# missing or changed in the Telugu (auto, then checked by hand); a MEANING flip when the Telugu says the opposite or
# drops a condition ("not covered" read as covered, "only after" dropped, "unless" dropped), read by hand (HAND).
# Writes series/scripts/creative35_demo/translate.json.
#   HF_HUB_CACHE=/home/user/hfcache python3 pipeline/creative35/translate_demo.py
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
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
import rag_demo as d  # noqa: E402  (model_file, PORT)

OUT = ROOT / "series/scripts/creative35_demo"
POLICY = [
    ("Pre-existing diseases are not covered for the first 36 months.", ["36"]),
    ("Room rent is covered up to ₹5,000 per day.", ["5,000"]),
    ("A co-payment of 20% applies to every claim after age 60.", ["20", "60"]),
    ("Cataract surgery is covered only after a waiting period of 2 years.", ["2"]),
    ("Claims must be filed within 30 days of discharge.", ["30"]),
    ("Maternity expenses are not covered.", []),
    ("The policy does not cover treatment outside India.", []),
    ("Ambulance charges are covered up to ₹2,000 per hospitalisation.", ["2,000"]),
    ("If you miss the renewal date by more than 30 days, the policy lapses.", ["30"]),
    ("Cosmetic surgery is not covered unless it is needed after an accident.", []),
]
TEXT = "\n".join(f"{i}. {t}" for i, (t, _) in enumerate(POLICY, 1))
ASKS = {
    "usual": "Translate this into Telugu for my mother:\n\n" + TEXT,
    "better": ("Translate this into Telugu for my mother. Keep every number, and every 'not', 'only' and 'unless', exactly. "
               "After the translation, list each number and each condition in English.\n\n" + TEXT),
}
HAND = {}   # filled in by hand after reading every Telugu line: (ask, seed, line) -> note of a meaning flip or number error


def numbers_kept(reply):
    """Auto hint: which of the policy's numbers appear in the reply (digits, any comma style)."""
    flat = reply.replace(",", "")
    out = {}
    for i, (_, nums) in enumerate(POLICY, 1):
        out[i] = {n: n.replace(",", "") in flat for n in nums}
    return out


def call(key, q, seed):
    body = json.dumps({"model": "ai", "messages": [{"role": "user", "content": q}], "temperature": 0.7, "seed": seed, "max_tokens": 900}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=1800) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(d.model_file()), "--model_alias", "ai", "--api_key", key,
                            "--host", "127.0.0.1", "--port", str(d.PORT), "--n_ctx", "4096", "--n_threads", "4", "--verbose", "False"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for ask, q in ASKS.items():
            for seed in range(1, 6):
                t0 = time.time()
                reply = call(key, q, seed)
                rows.append({"ask": ask, "seed": seed, "secs": round(time.time() - t0, 1), "reply": reply, "numbers": numbers_kept(reply)})
                print(ask, seed, rows[-1]["secs"], flush=True)
                (OUT / "translate.json").write_text(json.dumps({"policy": POLICY, "asks": ASKS, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
