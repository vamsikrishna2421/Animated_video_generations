# EP53 follow-up demo (written and committed before it ran). rag_meaning.py: on the 300-page manual, search by meaning
# put the right page in the top 3 for 8 of 10 questions, Part 1's word search for 7 of 10, and they missed different
# questions (words missed q1 "smell" and q5 "banging"; meaning missed q1 and q8 "child"). Real RAG systems often combine
# the two ("hybrid search"). Here: reciprocal rank fusion (each page scores 1/(60 + its rank) in each list, summed), the
# usual way to merge two rankings. Same PDF, questions, embedding model, AI, rules and settings as rag_meaning.py; only
# step 2 changes. Every answer read by hand (HAND).
# Writes series/scripts/ep53_demo/hybrid.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep53/rag_hybrid.py
import json
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rag_meaning as m  # noqa: E402

HAND = {"hybrid": "worse: the right page in the top 3 for 6 of 10 (lost q5 and q10, which meaning had found; q1 and q8 still "
                  "missed); answers: q5 'Not in the document', q10 'call service (page 125)', a generic line from an error page. "
                  "Fusing two full rankings let the word list's many ties push weak pages up: test a mix before you trust it"}


def rank_words(pages, q):
    return m.search_words(pages, q, k=len(pages))


def rank_meaning(page_vecs, qvec):
    return m.search_meaning(page_vecs, qvec, k=len(page_vecs))[0]


def fuse(*rankings, k=60):
    score = {}
    for r in rankings:
        for pos, p in enumerate(r):
            score[p] = score.get(p, 0) + 1 / (k + pos + 1)
    return sorted(score, key=lambda p: -score[p])


def main():
    _, right = m.make_pages()
    pages = m.read_pdf()   # the PDF rag_meaning.py wrote
    embed = m.embedder()
    page_vecs = embed(pages)
    rows = []
    for qid, q, _ in m.QS:
        top = fuse(rank_words(pages, q), rank_meaning(page_vecs, embed([q])[0]))[:3]
        rows.append({"id": qid, "q": q, "right_page": right[qid], "hybrid_top3": [p + 1 for p in top], "hybrid_hit": (right[qid] - 1) in top})
        print(qid, "right", right[qid], "hybrid", [p + 1 for p in top], flush=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(m.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(m.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", m.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for r in rows:
            doc = "\n\n".join(f"--- page {p} ---\n{pages[p - 1]}" for p in r["hybrid_top3"])
            reply, usage = m.call(key, [{"role": "system", "content": m.RULES}, {"role": "user", "content": f"Document:\n{doc}\n\nQuestion: {r['q']}"}])
            r.update({"reply": reply, "prompt_tokens": usage.get("prompt_tokens")})
            print(r["id"], usage.get("prompt_tokens"), "|", reply.replace("\n", " ")[:200], flush=True)
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    (m.OUT / "hybrid.json").write_text(json.dumps({"rows": rows}, indent=1, ensure_ascii=False))
    print("hybrid hits", sum(r["hybrid_hit"] for r in rows))


if __name__ == "__main__":
    main()
