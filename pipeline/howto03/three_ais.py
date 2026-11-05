# HOW TO 03 "Test 3 AIs on your question before you pay": the real run (written and committed before it ran). Ravi anna's
# own five shop questions, the right answer written down first (PASS below), asked word for word to three free AIs, each
# in a fresh chat, 3 tries each; every answer timed and then read by hand (HAND below wins over the automatic mark).
#   Q1 bill   : 3 kg rice at Rs 62 a kg, 2 litres oil at Rs 145 a litre, 6 eggs at Rs 7 each -> Rs 518
#   Q2 GST    : Rs 1,180 including 18% GST -> Rs 1,000 before GST, Rs 180 GST
#   Q3 reorder: rice 12 kg, sugar 3 kg, oil 8 litres, dal 2 kg, salt 15 packets, reorder below 5 -> sugar and dal, only
#   Q4 Telugu : a 2-line Telugu WhatsApp message: closed this Sunday, open Monday 7 am -> Telugu script, Sunday, Monday, 7
#   Q5 honest : "How much did my shop sell last Tuesday?" -> says it can't know (no figure)
# The three AIs (free, open weights, the makers' own 4-bit files): Qwen2.5-1.5B-Instruct (Apache 2.0), Phi-3-mini-4k-
# instruct (Microsoft, MIT), Qwen2.5-7B-Instruct (Apache 2.0); llama.cpp, 4 threads, temperature 0.7, top_p 0.9, seed =
# try number, max 400 tokens, offline (a new, empty network namespace, EP38's check). Rows save one by one; a re-run
# skips the done ones. Writes series/scripts/howto03_demo/<ai>.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/howto03/three_ais.py run 1.5B|phi3|7B
#   python3 pipeline/howto03/three_ais.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/howto03_demo"
AIS = {"1.5B": ("Qwen/Qwen2.5-1.5B-Instruct-GGUF", "*q4_k_m*.gguf", "Qwen2.5 1.5B"),
       "phi3": ("microsoft/Phi-3-mini-4k-instruct-gguf", "*q4.gguf", "Phi-3 mini"),
       "7B": ("Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf", "Qwen2.5 7B")}
QUESTIONS = {
    "bill": "A customer buys 3 kg rice at Rs 62 a kg, 2 litres oil at Rs 145 a litre and 6 eggs at Rs 7 each. What is the total?",
    "gst": "An item costs Rs 1,180 including 18% GST. What is the price before GST, and how much is the GST?",
    "reorder": "My stock: rice 12 kg, sugar 3 kg, oil 8 litres, dal 2 kg, salt 15 packets. I reorder anything below 5. What do I reorder?",
    "telugu": "Write a 2-line WhatsApp message in Telugu for my shop's customers: the shop is closed this Sunday, and open again on Monday at 7 am.",
    "honest": "How much did my shop sell last Tuesday?",
}
TRIES = 3
HAND = {}  # (ai, question, try): {"pass": bool, "note": str} after reading the answer by hand
TELUGU = re.compile(r"[ఀ-౿]")


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def nums(text):
    return [int(x.replace(",", "")) for x in re.findall(r"\d[\d,]*", text)]


def auto_pass(q, reply):
    low = reply.lower()
    if q == "bill":
        return 518 in nums(reply)
    if q == "gst":
        n = nums(reply)
        return 1000 in n and 180 in n
    if q == "reorder":
        last = low[low.rfind("reorder"):] if "reorder" in low else low
        return "sugar" in low and "dal" in low and not re.search(r"reorder[^.]*\b(rice|oil|salt)\b", last)
    if q == "telugu":
        return bool(TELUGU.search(reply)) and "ఆదివారం" in reply and "సోమవారం" in reply and ("7" in reply or "ఏడు" in reply)
    if q == "honest":
        return not re.search(r"(rs\.?|₹|inr)\s*\d", low) and bool(re.search(r"(don't|do not|can't|cannot|not able|unable|no access|don’t|can’t)", low))
    return False


def offline_run(ai):
    from llama_cpp import Llama
    from huggingface_hub import snapshot_download
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    repo, pat, name = AIS[ai]
    folder = Path(snapshot_download(repo, allow_patterns=[pat], local_files_only=True))
    gguf = sorted(folder.glob(pat))[0]
    t0 = time.time()
    llm = Llama(model_path=str(gguf), n_ctx=2048, n_threads=4, n_threads_batch=4, verbose=False, seed=0)
    load_s = round(time.time() - t0, 1)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{ai}.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "ai": name, "repo": repo, "file": gguf.name, "file_gb": round(gguf.stat().st_size / 1e9, 2), "load_s": load_s,
        "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 400 tokens, a fresh chat per question",
        "questions": QUESTIONS, "rows": []}
    done = {(r["q"], r["try"]) for r in res["rows"]}
    for n in range(1, TRIES + 1):
        for q, text in QUESTIONS.items():
            if (q, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=400, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"q": q, "try": n, "reply": reply, "auto_pass": auto_pass(q, reply), "seconds": round(time.time() - t0, 1),
                                "tokens": out["usage"]["completion_tokens"]})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(ai, q, n, res["rows"][-1]["auto_pass"], res["rows"][-1]["seconds"], flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    for ai in AIS:
        f = OUT / f"{ai}.json"
        if not f.exists():
            continue
        res = json.loads(f.read_text())
        rows = res["rows"]
        mark = lambda r: HAND.get((ai, r["q"], r["try"]), {}).get("pass", r["auto_pass"])
        per_q = {q: sum(mark(r) for r in rows if r["q"] == q) for q in QUESTIONS}
        secs = sorted(r["seconds"] for r in rows)
        print(f'{res["ai"]:13s} {res["file_gb"]} GB | right {sum(mark(r) for r in rows)} of {len(rows)} | per question (of 3) {per_q} | '
              f'median {secs[len(secs) // 2]} s per answer')


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
