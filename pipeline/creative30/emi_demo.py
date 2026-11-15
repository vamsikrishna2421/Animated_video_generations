# Creative 30 demo (written and committed before it ran): can a small AI work out a loan EMI?
# A chat AI writes the next words; unless it is given a calculator, it does not run the sum. Ten loans of the kind a
# family takes (amounts, rates and tenures picked by us), the EMI from the standard formula
#     EMI = P * r * (1 + r)^n / ((1 + r)^n - 1),  r = annual rate / 12 / 100,  n = months
# against the AI's answer. Three ways of asking, one fresh chat each, temperature 0.2, seed 1:
#   ask  : "What is the monthly EMI ...? Reply with only the EMI in rupees."
#   steps: the same, "Work it out step by step", the EMI on the last line ("EMI: Rs N")
#   code : "Don't calculate it yourself: write one arithmetic expression (numbers only) that computes the EMI with the
#          standard formula"; we then compute that expression on our computer (a safe evaluator: numbers and + - * / **
#          and brackets only, nothing else runs).
# Right = within Rs 1 of the formula. For each answer: the error a month and over the whole loan (error x months).
# The same small free AI as EP51-EP53 (Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on this computer, no tools, no web).
# Every reply is also read by hand (HAND). Writes series/scripts/creative30_demo/emi.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative30/emi_demo.py
import ast
import json
import operator
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

OUT = ROOT / "series/scripts/creative30_demo"
LOANS = [   # (what, principal Rs, annual rate %, years)
    ("bike loan", 120000, 11.0, 3),
    ("personal loan", 300000, 12.5, 4),
    ("car loan", 650000, 9.25, 5),
    ("home loan", 4000000, 8.5, 20),
    ("education loan", 800000, 10.25, 7),
    ("phone on EMI", 60000, 14.0, 1),
    ("home loan", 2500000, 8.75, 15),
    ("personal loan", 500000, 10.5, 5),
    ("tractor loan", 700000, 9.5, 6),
    ("two-wheeler loan", 90000, 13.0, 2),
]
HAND = {}   # filled in after the run, from the replies in emi.json


def emi(p, rate, years):
    r, n = rate / 12 / 100, years * 12
    return p * r * (1 + r) ** n / ((1 + r) ** n - 1)


def rs(x):
    return f"Rs {x:,}"


def question(p, rate, years):
    return f"What is the monthly EMI for a loan of {rs(p)} at {rate}% annual interest for {years} years?"


PROMPTS = {
    "ask": lambda q: q + " Reply with only the EMI in rupees.",
    "steps": lambda q: q + " Work it out step by step, then give the EMI on the last line as 'EMI: Rs N'.",
    "code": lambda q: q + (" Don't calculate it yourself. Write one arithmetic expression, using only numbers (no variable "
                           "names), that computes the EMI with the standard EMI formula. Reply with the expression only."),
}
MAXTOK = {"ask": 60, "steps": 700, "code": 150}

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow,
       ast.USub: operator.neg, ast.UAdd: operator.pos}


def safe_eval(text):
    """Numbers, + - * / ** and brackets only; anything else (names, calls) -> None."""
    m = re.search(r"`{3}(?:python)?\s*(.*?)`{3}", text, re.S)
    expr = (m.group(1) if m else text).strip().strip("`").strip()
    expr = expr.split("\n")[-1] if "\n" in expr and "=" not in expr.split("\n")[-1] else expr
    expr = expr.split("=")[-1].strip() if "=" in expr else expr

    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)):
            return float(n.value)
        if isinstance(n, ast.BinOp) and type(n.op) in OPS:
            a, b = ev(n.left), ev(n.right)
            if isinstance(n.op, ast.Pow) and abs(b) > 1000:
                raise ValueError("exponent too big")
            return OPS[type(n.op)](a, b)
        if isinstance(n, ast.UnaryOp) and type(n.op) in OPS:
            return OPS[type(n.op)](ev(n.operand))
        raise ValueError(f"not allowed: {type(n).__name__}")
    try:
        return ev(ast.parse(expr.replace(",", ""), mode="eval")), expr
    except Exception as e:  # noqa: BLE001
        return None, f"{expr}  [{type(e).__name__}: {e}]"


def number(text, mode):
    t = text.replace("₹", "Rs ")
    if mode == "steps":
        m = re.findall(r"EMI\s*[:=]\s*(?:Rs\.?|INR)?\s*([\d,]+(?:\.\d+)?)", t)
        if m:
            return float(m[-1].replace(",", ""))
    nums = [float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*(?:\.\d+)?", t)]
    return nums[-1] if nums else None


def call(key, text, mode):
    body = json.dumps({"model": "ai", "messages": [{"role": "user", "content": text}], "temperature": 0.2, "seed": 1,
                       "max_tokens": MAXTOK[mode]}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=900) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"].strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for mode in ("ask", "steps", "code"):
            for i, (what, p, rate, years) in enumerate(LOANS, 1):
                true = emi(p, rate, years)
                reply = call(key, PROMPTS[mode](question(p, rate, years)), mode)
                if mode == "code":
                    got, expr = safe_eval(reply)
                else:
                    got, expr = number(reply, mode), None
                err = None if got is None else round(got - true)
                rows.append({"mode": mode, "loan": i, "what": what, "principal": p, "rate": rate, "years": years,
                             "emi": round(true, 2), "got": got, "expr": expr, "err_month": err,
                             "err_total": None if err is None else err * years * 12, "right": err is not None and abs(got - true) <= 1,
                             "reply": reply})
                print(mode, i, what, "true", round(true), "got", got, "err", err, "|", reply.replace("\n", " ")[:150], flush=True)
                (OUT / "emi.json").write_text(json.dumps({"loans": LOANS, "prompts": {k: v("<question>") for k, v in PROMPTS.items()},
                                                          "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    for mode in ("ask", "steps", "code"):
        rr = [r for r in rows if r["mode"] == mode]
        print(mode, "right", sum(r["right"] for r in rr), "of", len(rr))


if __name__ == "__main__":
    main()
