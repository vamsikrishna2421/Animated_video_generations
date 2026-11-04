# Creative 18 demo, "the deposit clause" (written and committed before it ran): asked to explain a contract "in simple
# words", a chat AI can drop the condition that matters. A small free AI, offline, the same rent-agreement clause ten
# times each way:
#   short : "Explain this clause of my rent agreement in simple words, in 2 lines." + the clause
#   list  : "Explain this clause of my rent agreement. List every condition I must meet to get my deposit back, and
#            what happens if I don't." + the clause (the fix: ask for the conditions, not a summary)
# The clause (written by us, in the usual Indian rental-agreement wording): Rs 50,000 deposit, refunded without interest
# at the end of the tenancy, PROVIDED an 11-month lock-in is completed AND one month's written notice is given; leaving
# before the lock-in forfeits the entire deposit.
# Scored automatically, then every reply read by hand (HAND below wins):
#   lockin  : it says the 11 months (lock-in) is a condition for the refund
#   forfeit : it says leaving early loses the deposit (forfeit / lose / not refunded / no refund)
#   notice  : it mentions the one month's written notice
#   safe    : lockin and forfeit both (a tenant reading only the reply would know she loses Rs 50,000 by leaving at 10 months)
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative18_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative18/clause_demo.py run <model folder>
#   python3 pipeline/creative18/clause_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative18_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
CLAUSE = ("7. Security deposit: The Tenant has paid a security deposit of Rs. 50,000 (Rupees Fifty Thousand only) to the "
          "Owner. The deposit shall be refunded without interest at the end of the tenancy, provided the Tenant has "
          "completed a minimum lock-in period of eleven (11) months and has given one (1) month's written notice. If the "
          "Tenant vacates the premises before completing the lock-in period, the entire deposit shall be forfeited.")
WAYS = {"short": f"Explain this clause of my rent agreement in simple words, in 2 lines.\n\n{CLAUSE}",
        "list": ("Explain this clause of my rent agreement. List every condition I must meet to get my deposit back, and "
                 f"what happens if I don't.\n\n{CLAUSE}")}
TRIES = 10
HAND = {}  # (way, try): {"lockin": bool, "forfeit": bool, "notice": bool, "note": str} after reading the reply by hand
# Read by hand after the run (Nov 4): the hypothesis failed. "short" tries 1 and 2 said "the entire deposit will be kept"
# / "the deposit is kept by the owner" (the automatic flag missed "kept"): forfeiture, said plainly -> safe 10 of 10;
# "list": 10 of 10. This model kept the lock-in condition and the loss in every 2-line summary. Not used for a reel.
HAND = {("short", 1): {"forfeit": True, "note": "\"the entire deposit will be kept\""}, ("short", 2): {"forfeit": True, "note": "\"kept by the owner\""}}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def score(way, reply):
    low = reply.lower()
    lockin = bool(re.search(r"(11|eleven)[ -]?months?|lock[- ]?in", low))
    forfeit = bool(re.search(r"forfeit|lose|lost|won'?t get|will not get|not (be )?refund|no refund|keep (the|your) (entire )?deposit", low))
    notice = bool(re.search(r"notice", low))
    return {"lockin": lockin, "forfeit": forfeit, "notice": notice, "safe": lockin and forfeit}


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=2048, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "7B.json"
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
    res = json.loads((OUT / "7B.json").read_text())
    for way in WAYS:
        rows = [dict(r["score"], **HAND.get((way, r["try"]), {})) for r in res["rows"] if r["way"] == way]
        for r in rows:
            r["safe"] = bool(r["lockin"]) and bool(r["forfeit"])
        print(way, len(rows), "replies |", " | ".join(f"{k} {sum(bool(r[k]) for r in rows)}" for k in ("lockin", "forfeit", "notice", "safe")))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
