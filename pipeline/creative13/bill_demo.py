# Creative 13 demo, "split the bill" (written and committed before it ran): a chat AI writes numbers the way it writes
# words, one token at a time, so a sum can slip. One restaurant bill, split by a small free AI, three ways, ten replies
# each, on each of two brains:
#   plain : the bill and "Reply with just the amount each person pays."
#   steps : the same + "Show the working step by step, then the amount each person pays."
#   expr  : the same + "Don't calculate. Write the whole sum as one calculator expression I can type."
#           (the calculator does the arithmetic: we type the expression it wrote into Python's calculator)
# The bill: food ₹2,847, 5% GST on it, then a 10% tip on the total with GST, split equally between 4 friends:
#   2847 × 1.05 = 2989.35; × 1.10 = 3288.285; ÷ 4 = 822.07 (each).
# Pass mark (fixed before the run): plain and steps: the amount each person pays, as the reply states it, within ₹1 of
# ₹822.07; expr: the expression, typed into a calculator, gives within ₹1 of ₹822.07. Every reply is read by hand (HAND
# below; the hand reading wins over the first-pass regex).
# Brains: Qwen's own 4-bit GGUFs (q4_k_m) of Qwen2.5-1.5B-Instruct and Qwen2.5-3B-Instruct (EP40's), llama.cpp, 4
# threads, temperature 0.7, top_p 0.9, seed = try number, offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative13_demo/<size>.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative13/bill_demo.py 1.5B 3B    (downloads, then reruns itself offline)
#   python3 pipeline/creative13/bill_demo.py --summary
import ast
import importlib.util
import json
import operator
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative13_demo"
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "3B": "Qwen/Qwen2.5-3B-Instruct-GGUF"}
PATTERN = "*q4_k_m*.gguf"
TRIES = 10
RIGHT = 2847 * 1.05 * 1.10 / 4   # 822.07
BILL = ("Our restaurant bill: food ₹2,847. Add 5% GST on it, then a 10% tip on the total with GST. "
        "We are 4 friends and we split it equally.")
WAYS = {
    "plain": BILL + " Reply with just the amount each person pays.",
    "steps": BILL + " Show the working step by step, then the amount each person pays.",
    "expr": BILL + " Don't calculate. Write the whole sum as one calculator expression I can type.",
}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def amounts(text):
    """Every rupee-like number in the reply (commas dropped), in order."""
    return [float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*\.?\d*", text)]


OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv}


def calc(expr):
    """A calculator: + - × ÷ and brackets only (no names, no calls)."""
    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return n.value
        if isinstance(n, ast.BinOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub):
            return -ev(n.operand)
        raise ValueError("not a calculator expression")
    return ev(ast.parse(expr, mode="eval"))


def expressions(text):
    """Candidate calculator expressions in the reply: runs of digits, operators, brackets and spaces."""
    t = text.replace("×", "*").replace("x", "*").replace("÷", "/").replace("₹", "").replace(",", "")
    t = re.sub(r"(\d)\s*%", r"\1/100", t)
    out = []
    for m in re.findall(r"[\d\.\s\(\)\+\-\*/]{7,}", t):
        m = m.strip()
        if re.search(r"\d", m) and re.search(r"[\+\-\*/]", m):
            try:
                out.append((m, calc(m)))
            except Exception:
                pass
    return out


def measure(way, text):
    if way == "expr":
        ex = expressions(text)
        best = max(ex, key=lambda e: len(e[0])) if ex else None
        val = best[1] if best else None
        return {"expression": best[0] if best else None, "value": round(val, 2) if val is not None else None,
                "pass": val is not None and abs(val - RIGHT) <= 1.0}
    nums = amounts(text)
    last = nums[-1] if nums else None   # the first pass reads the last number as the answer; HAND corrects it
    return {"amount": last, "pass": last is not None and abs(last - RIGHT) <= 1.0}


def offline_run(size, folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=2048, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{size}.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPOS[size]} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 400 tokens",
        "right_answer": round(RIGHT, 2), "pass_mark": "within ₹1 of ₹822.07 (expr: the expression typed into a calculator)",
        "prompts": WAYS, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for way, text in WAYS.items():
        for n in range(1, TRIES + 1):
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=400, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            row = {"way": way, "try": n, "reply": reply, "auto": measure(way, reply), "seconds": round(time.time() - t0, 1)}
            res["rows"].append(row)
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(size, way, n, row["auto"], row["seconds"], flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


# Read by hand (every reply): the hand reading wins. "cap" = the reply hit the 400-token cap before it stated the amount.
HAND = {   # (size, way, try): {"pass": bool, "amount": float or None, "why": str}
    ("1.5B", "plain", 1): {"pass": False, "amount": 818.26, "why": "the tip on the food only (not on the total with GST)"},
    ("1.5B", "plain", 2): {"pass": True, "amount": 822.0, "why": "worked it out anyway, rounded to ₹822"},
    ("1.5B", "plain", 3): {"pass": True, "amount": 822.07, "why": "worked it out anyway"},
    ("1.5B", "plain", 4): {"pass": True, "amount": 822.07, "why": "worked it out anyway"},
    ("1.5B", "plain", 5): {"pass": True, "amount": 822.07, "why": "worked it out anyway"},
    ("1.5B", "plain", 6): {"pass": False, "amount": 823.17, "why": "2847 × 1.05 written as 2,993.35 (it is 2,989.35)"},
    ("1.5B", "plain", 7): {"pass": False, "amount": 849.57, "why": "a wrong total (3,398.29)"},
    ("1.5B", "plain", 8): {"pass": False, "amount": 825.0, "why": "a wrong total (3,300.39)"},
    ("1.5B", "plain", 9): {"pass": True, "amount": 822.07, "why": "worked it out anyway"},
    ("1.5B", "plain", 10): {"pass": True, "amount": 822.0, "why": "worked it out anyway, rounded"},
    ("1.5B", "steps", 1): {"pass": False, "amount": None, "why": "cap: right working (3,288.285), cut off before the amount"},
    ("1.5B", "steps", 2): {"pass": False, "amount": None, "why": "cap: cut off before the amount"},
    ("1.5B", "steps", 3): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "steps", 4): {"pass": True, "amount": 822.07, "why": "'Each person pays ₹822.07 approximately'"},
    ("1.5B", "steps", 5): {"pass": False, "amount": 849.57, "why": "2,847 + 142.35 written as 3,089.35"},
    ("1.5B", "steps", 6): {"pass": False, "amount": None, "why": "cap: right total (3,288.285), cut off before the amount"},
    ("1.5B", "steps", 7): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "steps", 8): {"pass": True, "amount": 822.0, "why": "rounded"},
    ("1.5B", "steps", 9): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "steps", 10): {"pass": True, "amount": 822.07, "why": "822.071"},
    ("1.5B", "expr", 1): {"pass": True, "amount": 822.07, "why": "2847 × 1.05 × 1.10 / 4, written as a fraction"},
    ("1.5B", "expr", 2): {"pass": False, "amount": 3288.29, "why": "the total, no ÷ 4"},
    ("1.5B", "expr", 3): {"pass": True, "amount": 822.07, "why": "((2847 × 1.05) × 1.10) / 4"},
    ("1.5B", "expr", 4): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "expr", 5): {"pass": False, "amount": 818.51, "why": "the tip on the food only"},
    ("1.5B", "expr", 6): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "expr", 7): {"pass": True, "amount": 822.07, "why": ""},
    ("1.5B", "expr", 8): {"pass": False, "amount": 818.51, "why": "the tip on the food only"},
    ("1.5B", "expr", 9): {"pass": False, "amount": 3288.29, "why": "the total, no ÷ 4"},
    ("1.5B", "expr", 10): {"pass": False, "amount": None, "why": "× 4 on the tip only: a wrong expression"},
    ("3B", "plain", 1): {"pass": False, "amount": 220.23, "why": "just a number"},
    ("3B", "plain", 2): {"pass": False, "amount": 965.63, "why": "just a number"},
    ("3B", "plain", 3): {"pass": False, "amount": 241.25, "why": "just a number"},
    ("3B", "plain", 4): {"pass": False, "amount": 1059.0, "why": "just a number"},
    ("3B", "plain", 5): {"pass": False, "amount": 220.23, "why": "just a number"},
    ("3B", "plain", 6): {"pass": False, "amount": 1068.25, "why": "just a number"},
    ("3B", "plain", 7): {"pass": False, "amount": 1028.64, "why": "just a number"},
    ("3B", "plain", 8): {"pass": False, "amount": 1138.88, "why": "just a number"},
    ("3B", "plain", 9): {"pass": False, "amount": 849.0, "why": "just a number"},
    ("3B", "plain", 10): {"pass": False, "amount": 886.5, "why": "just a number"},
    ("3B", "steps", 1): {"pass": True, "amount": 822.0, "why": "cap at '₹822' (within ₹1)"},
    ("3B", "steps", 2): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 3): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 4): {"pass": True, "amount": 822.07, "why": "the summary after it repeats the total"},
    ("3B", "steps", 5): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 6): {"pass": False, "amount": None, "why": "cap: right total (3,288.29), cut off before the amount"},
    ("3B", "steps", 7): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 8): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 9): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "steps", 10): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "expr", 1): {"pass": True, "amount": 822.07, "why": "has the / 4 (LaTeX brackets fooled the first pass)"},
    ("3B", "expr", 2): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "expr", 3): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "expr", 4): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "expr", 5): {"pass": True, "amount": 822.07, "why": ""},
    ("3B", "expr", 6): {"pass": True, "amount": 822.07, "why": "as try 1, in LaTeX brackets"},
    ("3B", "expr", 7): {"pass": False, "amount": None, "why": "a garbled expression that adds the tip twice"},
    ("3B", "expr", 8): {"pass": False, "amount": 750.90, "why": "the tip on the GST only (a bracket in the wrong place)"},
    ("3B", "expr", 9): {"pass": False, "amount": None, "why": "not a calculator expression; the tip on the GST"},
    ("3B", "expr", 10): {"pass": False, "amount": 12583.74, "why": "× 4 where it says it divides by 4"},
}


def summarize():
    for size in REPOS:
        dest = OUT / f"{size}.json"
        if not dest.exists():
            continue
        res = json.loads(dest.read_text())
        out = {}
        for way in WAYS:
            rows = [r for r in res["rows"] if r["way"] == way]
            passed = [HAND.get((size, way, r["try"]), {}).get("pass", r["auto"]["pass"]) for r in rows]
            out[way] = {"n": len(rows), "right": sum(passed), "hand_read": all((size, way, r["try"]) in HAND for r in rows)}
        res["summary"] = out
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print(size, json.dumps(out))


if __name__ == "__main__":
    if sys.argv[1:2] == ["--summary"]:
        summarize()
    elif sys.argv[1:2] == ["--offline"]:
        offline_run(sys.argv[2], sys.argv[3])
    else:
        from huggingface_hub import snapshot_download
        for size in [a for a in sys.argv[1:] if not a.startswith("--")]:
            folder = snapshot_download(REPOS[size], allow_patterns=[PATTERN])
            subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", size, folder], check=True)
