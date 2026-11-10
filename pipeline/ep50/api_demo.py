# EP50 demo, "Ravi's first API call" (written and committed before it ran). A real AI API on this computer: llama.cpp's
# OpenAI-compatible server (llama-cpp-python) running Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, 4 threads,
# locked with an API key and reached over HTTP the way an app calls an AI company. What we measure:
#   1. the key: the same request with no key, with a wrong key (its last letter changed) and with the right key; the
#      HTTP status each gets back.
#   2. the price of one shop reply: 20 customer WhatsApp questions, one API call each, with the shop's price list (25
#      lines) in the system message; temperature 0.2, seed 1, max 80 reply tokens, a fresh call each time. For each call:
#      the tokens the server reports (usage), the same messages counted with OpenAI's tokenizer for its current models
#      (o200k_base, tiktoken: gpt-4o to gpt-5 per tiktoken's own model map; message overhead counted as tiktoken's
#      cookbook does: 3 tokens a message, 3 for the reply), and the cost at OpenAI's published price for gpt-5.4-mini
#      ($0.75 per 1M input tokens, $4.50 per 1M output tokens, standard tier; developers.openai.com/api/docs/pricing,
#      read Nov 10, 2026) at RUPEES_PER_DOLLAR. Per reply, and for a month of 50 replies a day (1,500 calls).
#   3. every reply read by hand (HAND below wins): the right price and in-stock answer for the item asked, no made-up item.
# The key is made fresh for the run and never written to a file (the result keeps only its length and last 4 letters).
# Writes series/scripts/ep50_demo/api.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep50/api_demo.py run
#   python3 pipeline/ep50/api_demo.py --summary
import json
import secrets
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep50_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
PORT = 8765
PRICE_IN, PRICE_OUT = 0.75, 4.50   # US$ per 1M tokens, gpt-5.4-mini, standard (developers.openai.com/api/docs/pricing)
RUPEES_PER_DOLLAR = 95.25          # RBI reference rate, Nov 6, 2026 (rounded): MSEI's archive of RBI reference rates
PER_DAY, DAYS = 50, 30

PRICES = [  # Ravi's price list: item, price (₹), in stock?
    ("Toor dal 1 kg", 165, True), ("Moong dal 1 kg", 140, True), ("Chana dal 1 kg", 110, False),
    ("Sona masoori rice 5 kg", 340, True), ("Basmati rice 1 kg", 120, True), ("Wheat atta 5 kg", 285, True),
    ("Sugar 1 kg", 48, True), ("Salt 1 kg", 28, True), ("Sunflower oil 1 litre", 150, True),
    ("Groundnut oil 1 litre", 190, False), ("Tea powder 250 g", 135, True), ("Coffee powder 100 g", 95, True),
    ("Milk 500 ml", 30, True), ("Curd 500 g", 40, False), ("Eggs (12)", 84, True), ("Bread", 45, True),
    ("Biscuits (Marie) packet", 30, True), ("Bath soap", 38, True), ("Washing powder 1 kg", 110, True),
    ("Toothpaste 150 g", 95, False), ("Red chilli powder 200 g", 70, True), ("Turmeric powder 100 g", 35, True),
    ("Tamarind 500 g", 90, True), ("Jaggery 1 kg", 75, True), ("Agarbatti packet", 25, True),
]
QUESTIONS = [  # (customer's message, item it asks about or None for an item we don't sell)
    ("Anna toor dal 1 kg entha?", "Toor dal 1 kg"),
    ("Is sunflower oil available? How much for 1 litre?", "Sunflower oil 1 litre"),
    ("5 kg sona masoori rice price please", "Sona masoori rice 5 kg"),
    ("Do you have curd today?", "Curd 500 g"),
    ("How much is a dozen eggs?", "Eggs (12)"),
    ("Groundnut oil undha?", "Groundnut oil 1 litre"),
    ("Sugar 1 kg rate?", "Sugar 1 kg"),
    ("Need wheat atta 5 kg, price?", "Wheat atta 5 kg"),
    ("Tea powder 250 g available?", "Tea powder 250 g"),
    ("Is there chana dal?", "Chana dal 1 kg"),
    ("Toothpaste price?", "Toothpaste 150 g"),
    ("Milk packet 500 ml how much", "Milk 500 ml"),
    ("Do you sell basmati rice? price for 1 kg", "Basmati rice 1 kg"),
    ("Washing powder 1 kg entha", "Washing powder 1 kg"),
    ("Jaggery undha? 1 kg", "Jaggery 1 kg"),
    ("How much is turmeric powder?", "Turmeric powder 100 g"),
    ("Do you have paneer?", None),
    ("Bread available now?", "Bread"),
    ("Red chilli powder 200 g price", "Red chilli powder 200 g"),
    ("Do you have ice cream?", None),
]
SYSTEM = ("You answer WhatsApp messages for Ravi's kirana shop. Reply in one short line: the price and whether it is in "
          "stock. Use only this price list; if the item is not on it, say we don't sell it.\n" +
          "\n".join(f"- {n}: ₹{p} ({'in stock' if s else 'out of stock'})" for n, p, s in PRICES))
HAND = {  # question index: (right?, note), after reading every reply by hand (all 20 match the price list)
    **{i: (True, "right price and stock answer") for i in range(16)}, 16: (True, "paneer: 'We don't sell it.'"),
    17: (True, "right price and stock answer"), 18: (True, "right price and stock answer"),
    19: (True, "ice cream: 'We don't sell ice cream.'"),
}


def model_file():
    from huggingface_hub import snapshot_download
    folder = Path(snapshot_download(REPO, allow_patterns=[PATTERN]))
    return sorted(folder.glob("*.gguf"))[0]   # a split GGUF loads from its first part


def call(key, messages, max_tokens=80):
    body = json.dumps({"model": "shop-ai", "messages": messages, "temperature": 0.2, "seed": 1, "max_tokens": max_tokens}).encode()
    headers = {"Content-Type": "application/json", **({"Authorization": f"Bearer {key}"} if key is not None else {})}
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return r.status, json.loads(r.read()), round(time.time() - t0, 2)
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode(errors="replace")[:300]}, round(time.time() - t0, 2)


def o200k(messages, reply):
    import tiktoken
    enc = tiktoken.get_encoding("o200k_base")
    n_in = sum(3 + len(enc.encode(m["content"])) + 1 for m in messages) + 3   # 3 a message (+1 for its role) and 3 for the reply
    return n_in, len(enc.encode(reply))


def run():
    OUT.mkdir(parents=True, exist_ok=True)
    key = "sk-" + secrets.token_hex(20)
    wrong = key[:-1] + ("a" if key[-1] != "a" else "b")
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model_file()), "--model_alias", "shop-ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(300):   # wait for the server to listen
            try:
                socket.create_connection(("127.0.0.1", PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        probe = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": QUESTIONS[0][0]}]
        res = {"key": {"length": len(key), "last4": key[-4:]}, "doors": {}}
        for name, k in (("no key", None), ("wrong key", wrong), ("right key", key)):
            st, body, sec = call(k, probe)
            res["doors"][name] = {"status": st, "seconds": sec, "reply": body.get("choices", [{}])[0].get("message", {}).get("content") if st == 200 else body.get("error")}
            print(name, st, sec, flush=True)
        rows = []
        for i, (q, item) in enumerate(QUESTIONS):
            msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": q}]
            st, body, sec = call(key, msgs)
            reply = body["choices"][0]["message"]["content"] if st == 200 else ""
            u = body.get("usage", {})
            oi, oo = o200k(msgs, reply)
            rows.append({"q": q, "item": item, "status": st, "seconds": sec, "reply": reply,
                         "server_prompt_tokens": u.get("prompt_tokens"), "server_reply_tokens": u.get("completion_tokens"),
                         "o200k_in": oi, "o200k_out": oo})
            print(i, st, sec, u, oi, oo, "|", reply.replace("\n", " ")[:120], flush=True)
        res["rows"] = rows
        (OUT / "api.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    summary()


def summary():
    res = json.loads((OUT / "api.json").read_text())
    rows = res["rows"]
    n = len(rows)
    oi = sum(r["o200k_in"] for r in rows) / n
    oo = sum(r["o200k_out"] for r in rows) / n
    usd = (oi * PRICE_IN + oo * PRICE_OUT) / 1e6
    month = usd * PER_DAY * DAYS
    for i, r in enumerate(rows):
        if i in HAND:
            r["right"], r["hand_note"] = HAND[i]
    res["summary"] = {
        "doors": {k: v["status"] for k, v in res["doors"].items()},
        "calls": n, "avg_o200k_in": round(oi, 1), "avg_o200k_out": round(oo, 1),
        "avg_server_in": round(sum(r["server_prompt_tokens"] or 0 for r in rows) / n, 1),
        "avg_server_out": round(sum(r["server_reply_tokens"] or 0 for r in rows) / n, 1),
        "avg_seconds": round(sum(r["seconds"] for r in rows) / n, 2),
        "usd_per_reply": usd, "paise_per_reply": round(usd * RUPEES_PER_DOLLAR * 100, 3),
        "rupees_per_month": round(month * RUPEES_PER_DOLLAR, 2), "per_day": PER_DAY, "days": DAYS,
        "price": {"in": PRICE_IN, "out": PRICE_OUT, "model": "gpt-5.4-mini", "rupees_per_dollar": RUPEES_PER_DOLLAR},
        "right_by_hand": f"{sum(1 for r in rows if r.get('right'))}/{n}" if HAND else "not read yet",
    }
    (OUT / "api.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(res["summary"], indent=1))


if __name__ == "__main__":
    summary() if "--summary" in sys.argv else run()
