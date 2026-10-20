# EP35 demo (model size & small language models): a small job for a kirana shop, sorting the shop's WhatsApp messages
# into ORDER / PAYMENT / COMPLAINT / OTHER, done by three sizes of the same free model family (Qwen2.5-Instruct 0.5B,
# 1.5B and 7B, each as Qwen's own 4-bit GGUF, q4_k_m) with llama.cpp on the laptop CPU (4 threads, no graphics card).
# 40 messages with the right label written down first (EP33's rule: test with answers you already know). Greedy
# decoding; the first label word in the reply counts. Measured per model: right answers, seconds per message (prompt +
# answer), file size. EP34's bill test (the same three sizes on 20 bills: 1, 9 and 18 right) is the hard job beside it.
# Writes series/scripts/ep35_demo/.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep35/sort_demo.py [0.5B 1.5B 7B]
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep35_demo"
MODELS = {"0.5B": "Qwen/Qwen2.5-0.5B-Instruct-GGUF", "1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PARAMS = {"0.5B": 0.49e9, "1.5B": 1.54e9, "7B": 7.61e9}   # from each model card
LABELS = ["ORDER", "PAYMENT", "COMPLAINT", "OTHER"]
SYSTEM = ("You sort the WhatsApp messages that a small grocery shop (a kirana shop in Hyderabad) receives. Reply with "
          "exactly one word: ORDER (the customer wants to buy items), PAYMENT (about money paid, owed or how to pay), "
          "COMPLAINT (something was wrong), or OTHER (anything else).")
MESSAGES = [
    ("anna 2 kg rice and 1 litre oil pls", "ORDER"),
    ("send 6 eggs and 1 bread to flat 302", "ORDER"),
    ("1 packet tea powder, 2 milk packets", "ORDER"),
    ("can you deliver 5 kg atta by evening", "ORDER"),
    ("need 1 kg sugar urgently", "ORDER"),
    ("2 dozen bananas and 1 coconut please", "ORDER"),
    ("same as last week order, send by 7", "ORDER"),
    ("half kg toor dal, 1 detergent", "ORDER"),
    ("pack 3 soaps and 1 toothpaste, i will collect", "ORDER"),
    ("add 2 curd to my order", "ORDER"),
    ("1 kg onions 1 kg tomatoes", "ORDER"),
    ("send one gas lighter and a matchbox", "ORDER"),
    ("sent 450 on UPI, pls check", "PAYMENT"),
    ("paid last month balance anna", "PAYMENT"),
    ("UPI failed, will pay cash in evening", "PAYMENT"),
    ("how much do I owe you this month?", "PAYMENT"),
    ("transferred 1200, screenshot attached", "PAYMENT"),
    ("can I pay on Friday? salary not come", "PAYMENT"),
    ("money sent to your number, 780", "PAYMENT"),
    ("please send me this month's bill amount", "PAYMENT"),
    ("paid 300 cash to your son", "PAYMENT"),
    ("QR code not working, what is your UPI id?", "PAYMENT"),
    ("the milk you sent yesterday was sour", "COMPLAINT"),
    ("eggs were broken, 3 of them", "COMPLAINT"),
    ("you gave me wrong change, 50 short", "COMPLAINT"),
    ("rice has small stones", "COMPLAINT"),
    ("delivery boy came 2 hours late", "COMPLAINT"),
    ("biscuits packet was expired", "COMPLAINT"),
    ("oil packet was leaking all over my bag", "COMPLAINT"),
    ("you sent sugar instead of salt", "COMPLAINT"),
    ("bread had fungus, very bad", "COMPLAINT"),
    ("your boy was rude to my mother", "COMPLAINT"),
    ("are you open on Sunday?", "OTHER"),
    ("happy diwali anna and family", "OTHER"),
    ("is the shop open till 10 tonight?", "OTHER"),
    ("can I park my bike near your shop for 1 hour?", "OTHER"),
    ("come home, lunch is ready", "OTHER"),
    ("do you have a job for my nephew?", "OTHER"),
    ("what time does the milk van come?", "OTHER"),
    ("thank you anna, see you tomorrow", "OTHER"),
]


def label(reply):
    m = re.search(r"\b(ORDER|PAYMENT|COMPLAINT|OTHER)\b", reply.upper())
    return m.group(1) if m else None


def run(size):
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    folder = Path(snapshot_download(MODELS[size], allow_patterns=["*q4_k_m*.gguf"]))
    parts = sorted(folder.glob("*q4_k_m*.gguf"))
    t0 = time.time()
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_ctx=1024, verbose=False, seed=0)
    load = time.time() - t0
    rows, right, secs = [], 0, 0.0
    for text, want in MESSAGES:
        t1 = time.time()
        out = llm.create_chat_completion([{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}],
                                         temperature=0.0, max_tokens=6)
        dt = time.time() - t1
        reply = out["choices"][0]["message"]["content"].strip()
        got = label(reply)
        ok = got == want
        right += ok
        secs += dt
        rows.append({"message": text, "right_label": want, "model_label": got, "reply": reply, "ok": ok, "seconds": round(dt, 2)})
        print(f"  {'OK ' if ok else 'BAD'} {size:4s} {dt:4.1f}s {want:9s} -> {got} | {text}", flush=True)
    size_gb = sum(f.resolve().stat().st_size for f in parts) / 1e9
    res = {"model": MODELS[size] + " (q4_k_m)", "size": size, "parameters": PARAMS[size], "file_gb": round(size_gb, 2),
           "right": right, "of": len(MESSAGES), "seconds_per_message": round(secs / len(MESSAGES), 2),
           "load_seconds": round(load, 1), "cpu_threads": 4, "rows": rows}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"results_{size}.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print(f"{size}: {right}/{len(MESSAGES)} right, {res['seconds_per_message']} s per message, {res['file_gb']} GB", flush=True)
    del llm


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "messages.json").write_text(json.dumps([{"message": m, "label": l} for m, l in MESSAGES], ensure_ascii=False, indent=1))
    for s in (sys.argv[1:] or list(MODELS)):
        run(s)
