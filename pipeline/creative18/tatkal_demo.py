# Creative 18 demo 2, "the Tatkal refund" (written and committed before it ran; demo 1, the deposit clause, found no
# failure and is not used): asked a money rule, a chat AI answers from memory, with a number. A small free AI, offline:
#   plain  : "I booked 4 Tatkal tickets in 3AC, total fare Rs 6,200, all 4 confirmed. I want to cancel them 2 days before
#             the journey. How much refund will I get? Give the amount."
#   source : the same, plus "Answer only from the official Indian Railways refund rules. If you are not sure of the exact
#             rule, say so and tell me where to check."
# The truth (Indian Railways refund rules, repeated by IRCTC and the press): no refund on cancelling a confirmed Tatkal
# ticket (Rs 0); refunds apply only to waitlisted/RAC Tatkal tickets or when the train is cancelled.
# Scored automatically, then every reply read by hand (HAND below wins):
#   zero   : it says no refund / Rs 0 for the confirmed Tatkal tickets
#   amount : it gives a positive refund amount (the first rupee figure it says you get back)
#   check  : it tells you to check IRCTC / the official rules / the railway
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative18_demo/tatkal_7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative18/tatkal_demo.py run <model folder>
#   python3 pipeline/creative18/tatkal_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative18_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
ASK = ("I booked 4 Tatkal tickets in 3AC, total fare Rs 6,200, all 4 confirmed. I want to cancel them 2 days before the "
       "journey. How much refund will I get? Give the amount.")
WAYS = {"plain": ASK,
        "source": ASK + (" Answer only from the official Indian Railways refund rules. If you are not sure of the exact rule, "
                         "say so and tell me where to check.")}
TRIES = 10
HAND = {}  # (way, try): {"zero": bool, "amount": int|None, "check": bool, "note": str} after reading the reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def score(way, reply):
    low = reply.lower()
    zero = bool(re.search(r"no refund|not (be )?(eligible|entitled) (for|to) (a |any )?refund|refund (is|will be) (nil|zero|rs\.? ?0)|rs\.? ?0\b|₹ ?0\b|non-refundable", low))
    amounts = [int(x.replace(",", "")) for x in re.findall(r"(?:rs\.?|₹|inr)\s*([\d,]{2,})", low)]
    amounts = [a for a in amounts if a not in (6200,)]   # the fare it repeats back
    check = bool(re.search(r"irctc|official|check with|railway (website|enquiry)|indian railways website|139", low))
    return {"zero": zero, "amount": amounts[-1] if amounts and not zero else None, "check": check}


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=2048, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "tatkal_7B.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 350 tokens",
        "prompts": WAYS, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for n in range(1, TRIES + 1):
        for way, text in WAYS.items():
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=350, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"way": way, "try": n, "reply": reply, "score": score(way, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, res["rows"][-1]["score"], flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "tatkal_7B.json").read_text())
    for way in WAYS:
        rows = [dict(r["score"], **HAND.get((way, r["try"]), {})) for r in res["rows"] if r["way"] == way]
        print(way, len(rows), "replies | right (no refund)", sum(bool(r["zero"]) for r in rows), "| gave an amount",
              sum(r["amount"] is not None for r in rows), [r["amount"] for r in rows], "| said check", sum(bool(r["check"]) for r in rows))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
