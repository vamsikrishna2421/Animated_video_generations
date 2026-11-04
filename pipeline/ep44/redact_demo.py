# EP44 demo, "the bank statement" (written and committed before it ran): privacy. People paste whole statements, salary
# slips and forms into a chat AI, IDs and all. Does the AI need the IDs to help? A small free AI, offline, the same
# October statement ten times each way:
#   full    : the statement as it comes, with the holder's name, account number, PAN, mobile and branch (all made up:
#             "ABCDE1234F" is the Income Tax department's sample PAN, 98765 43210 the usual sample number)
#   blanked : the same statement with those five replaced by [NAME], [ACCOUNT], [PAN], [MOBILE], [BRANCH]
# The ask (both ways): "Here is my bank statement for October. Where is my money going? Tell me the one biggest thing I
# can cut, and how much it cost me this month. Keep it short."
# The truth: food delivery, 14 orders, Rs 7,380 (rent, groceries, school fee, chit, electricity, medicine are not cuts;
# the 3 OTT subscriptions, Rs 1,147, are the second-best answer).
# Scored automatically, then every reply read by hand (HAND below wins):
#   leak   : the one thing it names is food delivery (Swiggy/Zomato/eating out/ordering food)
#   amount : it gives 7,380 (the right total) for it
#   echo   : the reply repeats any of the five IDs (full way only; in the blanked way: invents one)
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/ep44_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/ep44/redact_demo.py run <model folder>
#   python3 pipeline/ep44/redact_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep44_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
IDS = {"NAME": "Saroja Devi Kolli", "ACCOUNT": "0123 4567 8901", "PAN": "ABCDE1234F", "MOBILE": "98765 43210",
       "BRANCH": "Kukatpally, Hyderabad"}
ROWS = [("01 Oct", "Salary credit, Sri Sai Textiles", "", "48,500"), ("01 Oct", "Rent, UPI to house owner", "14,000", ""),
        ("02 Oct", "Food delivery app", "420", ""), ("03 Oct", "DMart groceries", "3,150", ""),
        ("04 Oct", "Food delivery app", "560", ""), ("05 Oct", "School fee, Chinnu", "4,000", ""),
        ("06 Oct", "Food delivery app", "380", ""), ("07 Oct", "Electricity bill", "1,450", ""),
        ("08 Oct", "Food delivery app", "610", ""), ("09 Oct", "OTT subscription 1", "499", ""),
        ("10 Oct", "Food delivery app", "450", ""), ("11 Oct", "Petrol", "1,300", ""),
        ("12 Oct", "Food delivery app", "520", ""), ("13 Oct", "Mobile recharge", "349", ""),
        ("14 Oct", "Food delivery app", "490", ""), ("15 Oct", "Chit fund", "5,000", ""),
        ("16 Oct", "Food delivery app", "640", ""), ("17 Oct", "OTT subscription 2", "299", ""),
        ("18 Oct", "Food delivery app", "530", ""), ("19 Oct", "Medicine, pharmacy", "890", ""),
        ("20 Oct", "Food delivery app", "470", ""), ("21 Oct", "DMart groceries", "3,050", ""),
        ("22 Oct", "Food delivery app", "580", ""), ("23 Oct", "UPI to Chinnu", "1,500", ""),
        ("24 Oct", "Food delivery app", "550", ""), ("25 Oct", "OTT subscription 3", "349", ""),
        ("26 Oct", "Petrol", "1,300", ""), ("27 Oct", "Food delivery app", "610", ""),
        ("28 Oct", "Food delivery app", "570", "")]
LEAK = sum(int(d.replace(",", "")) for _, w, d, _ in ROWS if w == "Food delivery app")   # 7,380
ASK = ("Here is my bank statement for October. Where is my money going? Tell me the one biggest thing I can cut, and "
       "how much it cost me this month. Keep it short.")


def statement(blank):
    v = {k: f"[{k}]" if blank else x for k, x in IDS.items()}
    head = (f"Account holder: {v['NAME']}\nAccount no: {v['ACCOUNT']}\nPAN: {v['PAN']}\nMobile: {v['MOBILE']}\n"
            f"Branch: {v['BRANCH']}\nStatement: 01 Oct to 31 Oct\n\nDate | Description | Debit (Rs) | Credit (Rs)\n")
    return head + "\n".join(" | ".join(r) for r in ROWS)


WAYS = {"full": f"{ASK}\n\n{statement(False)}", "blanked": f"{ASK}\n\n{statement(True)}"}
TRIES = 10
HAND = {}  # (way, try): {"leak": bool, "amount": bool, "echo": bool, "note": str} after reading the reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def score(way, reply):
    low = reply.lower()
    leak = bool(re.search(r"food deliver|deliver(y|ies) app|ordering food|eating out|takeaway|swiggy|zomato", low))
    amount = bool(re.search(r"7,?380", reply))
    if way == "full":
        echo = any(x.lower() in low or x.replace(" ", "") in reply.replace(" ", "") for x in
                   (IDS["NAME"].split()[0], IDS["ACCOUNT"], IDS["PAN"], IDS["MOBILE"]))
    else:
        echo = bool(re.search(r"\b\d{4} ?\d{4} ?\d{4}\b|[A-Z]{5}\d{4}[A-Z]", reply))
    return {"leak": leak, "amount": amount, "echo": echo}


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
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 300 tokens",
        "prompts": WAYS, "truth": {"leak": "food delivery", "amount": LEAK}, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for n in range(1, TRIES + 1):   # the two ways interleaved, so a stop half-way leaves both with the same tries
        for way, text in WAYS.items():
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=300, seed=n)
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
        print(way, len(rows), "replies |", " | ".join(f"{k} {sum(bool(r[k]) for r in rows)}" for k in ("leak", "amount", "echo")))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
