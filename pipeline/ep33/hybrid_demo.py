# EP33 demo (real, run by us): hybrid search and measuring it. Ravi anna's made-up 114-line stock book
# (series/scripts/ep33_demo/stock_book.tsv) and 20 test orders whose right item we know (questions.json): item codes,
# local names, orders that describe the thing, a few mixed, and one whose answer is written nowhere in the book.
# A hit = a right item comes first. Compares keyword search (BM25), meaning search (embeddings) and both merged with
# reciprocal rank fusion (RRF, k = 60). Same small free models and code as EP32, CPU only.
# Two ways to cut the book (EP32: RAG retrieves pieces): one item per piece, or notebook pages of 8 lines in book order
# (a hit = the page holding a right item comes first; the AI then reads that page).
# --fixed writes the two facts the test found missing into the book first (the episode's last lesson).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep33/hybrid_demo.py [page size, default 1] [--fixed]
import csv
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
from ep32.rag_demo import BM25, EMB, QPREFIX, Embedder, toks  # noqa: E402

D = ROOT / "series/scripts/ep33_demo"
K_RRF, DEPTH = 60, 10   # RRF constant from Cormack et al. 2009; each search hands over its top 10
WRITTEN = {"H-9901": "Dishwash bar (for washing vessels)", "R-1724": "Sona Masoori rice (Ramesh garu's usual)"}


def line(r):
    return f"{r['code']} | {r['item']}, {r['pack']} | Rs {r['price']}"


def rrf(*orders):
    score = {}
    for order in orders:
        for rank, j in enumerate(order[:DEPTH]):
            score[j] = score.get(j, 0.0) + 1.0 / (K_RRF + rank + 1)
    return sorted(score, key=lambda j: -score[j])


def main():
    rows = list(csv.DictReader((D / "stock_book.tsv").open(), delimiter="\t"))
    fixed = "--fixed" in sys.argv
    if fixed:
        for r in rows:
            r["item"] = WRITTEN.get(r["code"], r["item"])
    args = [a for a in sys.argv[1:] if a != "--fixed"]
    qs = json.loads((D / "questions.json").read_text())
    codes = [r["code"] for r in rows]
    for q in qs:
        assert all(c in codes for c in q["right"]), q
    size = int(args[0]) if args else 1
    pages = [rows[i:i + size] for i in range(0, len(rows), size)]
    texts = ["\n".join(line(r) for r in pg) for pg in pages]
    holds = [{r["code"] for r in pg} for pg in pages]
    bm, emb = BM25(texts), Embedder()
    cv, qv = emb(texts), emb([QPREFIX + q["q"] for q in qs])
    out = {"embedder": EMB, "items": len(rows), "page_size": size, "fixed": fixed, "pieces": len(pages), "questions": len(qs), "hit1": {}, "hit3": {}, "by_kind": {}, "orders": []}
    for m in ("keyword", "meaning", "hybrid"):
        out["hit1"][m] = out["hit3"][m] = 0
    for i, q in enumerate(qs):
        s_kw = bm.scores(q["q"])
        kw = [j for j in np.argsort(-s_kw, kind="stable") if s_kw[j] > 0]   # keyword search returns only real matches
        mean = list(np.argsort(-(cv @ qv[i]), kind="stable"))
        hyb = rrf(kw, mean)
        row = {"q": q["q"], "kind": q["kind"], "right": q["right"], "query_words": toks(q["q"])}
        for m, order in (("keyword", kw), ("meaning", mean), ("hybrid", hyb)):
            top = list(order[:3])
            h1 = bool(top) and bool(holds[top[0]] & set(q["right"]))
            h3 = any(holds[j] & set(q["right"]) for j in top)
            out["hit1"][m] += h1
            out["hit3"][m] += h3
            k = out["by_kind"].setdefault(q["kind"], {}).setdefault(m, [0, 0])
            k[0] += h1
            k[1] += 1
            row[m] = {"top3": [texts[j] for j in top], "hit1": h1}
        out["orders"].append(row)
    (D / f"results_page{size}{'_fixed' if fixed else ''}.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(f"{len(rows)} items in {len(pages)} pieces of {size}, {len(qs)} orders; right piece first:")
    for m in ("meaning", "keyword", "hybrid"):
        print(f"  {m:8s} {out['hit1'][m]:2d}/{len(qs)}   (in the top 3: {out['hit3'][m]}/{len(qs)})")
    for kind, v in out["by_kind"].items():
        print(f"  {kind:22s} " + "  ".join(f"{m} {a}/{n}" for m, (a, n) in v.items()))
    for r in out["orders"]:
        print(f"\n{r['q']!r} ({r['kind']}) right: {r['right']}")
        for m in ("meaning", "keyword", "hybrid"):
            first = r[m]['top3'][0].split(chr(10)) if r[m]['top3'] else ['(no match)']
            print(f"  {m:8s} {'OK ' if r[m]['hit1'] else 'X  '} {first[0]}{' ... ' + first[-1] if len(first) > 1 else ''}")


if __name__ == "__main__":
    main()
