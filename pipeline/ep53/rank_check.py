# EP53 follow-up (render review: "would top 5 catch the misses?"): where the right page ranks when searching by meaning.
# No AI call, only the embedding model; same PDF, questions and model as rag_meaning.py. First run by hand in the shell
# on Nov 15 with this same code; result (deterministic): q1 page 69 ranked 88th, q8 page 96 ranked 15th, so taking the
# top 5 (or top 10) would not have caught either miss. The other 8 ranked 1st or 2nd.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep53/rank_check.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rag_meaning as m  # noqa: E402

_, right = m.make_pages()
pages = m.read_pdf()
embed = m.embedder()
page_vecs = embed(pages)
for qid, q, _ in m.QS:
    order, _ = m.search_meaning(page_vecs, embed([q])[0], k=len(pages))
    print(qid, "right page", right[qid], "rank", order.index(right[qid] - 1) + 1, "top5", [p + 1 for p in order[:5]])
