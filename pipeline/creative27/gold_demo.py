# Creative 27 demo (written and committed before it ran): what does a chat AI with no web search say when you ask
# today's gold price? The same small free AI as EP51 (Qwen's 4-bit GGUF of Qwen2.5-7B-Instruct on llama.cpp's
# OpenAI-compatible server, on this computer, no internet), temperature 0.7, a fresh chat each time, 10 tries each:
#   plain : "What is the price of 10 grams of 22-carat gold in India today?"
#   dated : the same + "Before you answer, tell me the date your information is from."
#   today : "What is today's date?"
# Right behaviour (fixed before the run): it says it can't know today's price (or gives a dated, sourced figure) and
# points to a live source. `auto` pulls the rupee amounts and flags words like "real-time", "as of", "my knowledge",
# "cutoff", "check"; every reply is also read by hand (HAND, filled after the run).
# The real price that day (Nov 12, 2026), for the reel: 22-carat ₹1,28,150 per 10 g (Groww, Goodreturns; 5paisa
# ₹1,30,140); 24-carat ₹1,39,800 (Groww, Goodreturns; 5paisa ₹1,41,970).
# Writes series/scripts/creative27_demo/gold.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative27/gold_demo.py
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
OUT = ROOT / "series/scripts/creative27_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
PORT = 8767
ASKS = {
    "plain": "What is the price of 10 grams of 22-carat gold in India today?",
    "dated": "What is the price of 10 grams of 22-carat gold in India today? Before you answer, tell me the date your information is from.",
    "today": "What is today's date?",
}
TRIES = 10
FLAGS = ["real-time", "real time", "as of", "my knowledge", "cutoff", "cut-off", "last update", "check", "may vary", "fluctuat", "latest"]
HAND = {   # read by hand after the run (series/scripts/creative27_demo/gold.json)
    "plain": "9 of 10 gave no price (need real-time data, check a dealer); try 8: 'as of my last update in October 2023' ... "
             "'INR 450 to INR 500' a gram, '10 grams would be approximately INR 4,500 ... INR 5,000', 'illustrative'",
    "dated": "8 of 10 no price, several 'my last update was in 2023'; try 8 'INR 350,000 - INR 400,000'; try 5 '₹[Price]'",
    "today": "9 of 10 'Today's date is [current date]' (or '[today's date]'); 1 of 10 'I don't have real-time capabilities'",
}


def model_file():
    from huggingface_hub import snapshot_download
    return sorted(Path(snapshot_download(REPO, allow_patterns=[PATTERN])).glob("*.gguf"))[0]


def call(key, text, seed):
    body = json.dumps({"model": "ai", "messages": [{"role": "user", "content": text}], "temperature": 0.7, "seed": seed, "max_tokens": 200}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"].strip()


def amounts(t):
    return [a.replace(",", "") for a in re.findall(r"(?:₹|Rs\.?|INR)\s?([\d,]{4,})", t)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "2048",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for ask, text in ASKS.items():
            for k in range(TRIES):
                reply = call(key, text, 100 + k)
                rows.append({"ask": ask, "try": k, "reply": reply, "amounts": amounts(reply),
                             "flags": [w for w in FLAGS if w in reply.lower()]})
                print(ask, k, amounts(reply), "|", reply.replace("\n", " ")[:220], flush=True)
        (OUT / "gold.json").write_text(json.dumps({"asks": ASKS, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)


if __name__ == "__main__":
    main()
