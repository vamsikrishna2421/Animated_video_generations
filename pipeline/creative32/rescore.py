# Creative 32: a fix to summary_demo.py's automatic marks, written after the run (summary_demo.py stays as committed).
# Its painting check, r"8,?000|paint", also matched the "8,000" inside "18,000" (the rent), so every reply that named the
# rent counted as naming the painting. Here: Rs 8,000 not preceded by a digit, or the word painting/repaint; and two more
# marks for the real question (P3): did the reply give Rs 44,000 (36,000 + 8,000), and did it name Rs 36,000 as the
# cost while leaving the Rs 8,000 out. Prints the counts; every reply was also read by hand (summary_demo.py HAND).
#   python3 pipeline/creative32/rescore.py
import json
import re
from pathlib import Path

D = Path(__file__).resolve().parents[2] / "series/scripts/creative32_demo/summary.json"


def norm(t):
    return t.lower().replace("₹", "rs ").replace("\\ ", " ")


def marks(reply):
    t = norm(reply)
    paint = bool(re.search(r"(?<![\d,])8,?000\b|repaint|painting", t))
    lock = bool(re.search(r"lock[- ]?in|36,?000|two months'? rent|2 months'? rent", t))
    total44 = bool(re.search(r"44,?000", t))
    refund10 = bool(re.search(r"(?<![\d,])10,?000\b", t))
    return {"lock_in": lock, "painting": paint, "total_44000": total44, "refund_10000": refund10,
            "36000_without_painting": bool(re.search(r"36,?000", t)) and not paint}


if __name__ == "__main__":
    d = json.loads(D.read_text())
    for ask in d["asks"]:
        rr = [marks(r["reply"]) for r in d["rows"] if r["ask"] == ask]
        print(ask, {k: sum(m[k] for m in rr) for k in rr[0]}, "of", len(rr))
        for r in d["rows"]:
            if r["ask"] == ask:
                print("  ", r["seed"], marks(r["reply"]))
