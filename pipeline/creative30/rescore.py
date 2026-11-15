# Creative 30: a re-score of the saved "code" replies (written and committed before it ran; no new AI calls).
# emi_demo.py asked for "one arithmetic expression, numbers only"; all 10 replies came back in maths notation ("^" for a
# power, 3 of them with pow(a, b)), which the demo's evaluator (Python operators only) refused, so all 10 scored None.
# Here the same replies are read the way they were written: "^" as a power, pow(a, b) allowed, normal precedence
# (so "(1 + r)^12*7" is (1 + r)^12 times 7, exactly as written). Adds `rescore` to each code row of emi.json.
#   python3 pipeline/creative30/rescore.py
import ast
import json
import math
import operator
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
F = ROOT / "series/scripts/creative30_demo/emi.json"
OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow,
       ast.USub: operator.neg, ast.UAdd: operator.pos}


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
    if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "pow" and len(n.args) == 2 and not n.keywords:
        a, b = ev(n.args[0]), ev(n.args[1])
        if abs(b) > 1000:
            raise ValueError("exponent too big")
        return math.pow(a, b)
    raise ValueError(f"not allowed: {type(n).__name__}")


def main():
    data = json.loads(F.read_text())
    right = 0
    for r in data["rows"]:
        if r["mode"] != "code":
            continue
        expr = r["reply"].strip().strip("`").strip().replace(",", "").replace("^", "**")
        try:
            got = ev(ast.parse(expr, mode="eval"))
        except Exception as e:  # noqa: BLE001
            got = None
            print(r["loan"], "unreadable:", e)
        ok = got is not None and abs(got - r["emi"]) <= 1
        right += ok
        r["rescore"] = {"got": None if got is None else round(got, 2), "err_month": None if got is None else round(got - r["emi"]),
                        "right": ok}
        print(r["loan"], r["what"], "true", round(r["emi"]), "got", None if got is None else round(got, 2), "right" if ok else "WRONG")
    F.write_text(json.dumps(data, indent=1, ensure_ascii=False))
    print("code (re-scored) right", right, "of 10")


if __name__ == "__main__":
    main()
