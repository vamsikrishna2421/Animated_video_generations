# EP52 follow-up demo (written and committed before it ran), after rag_demo.py's first try: the keyword search picked
# the cover page for 9 of 10 questions (every question says "MG-750 mixer", and so does the cover), so the AI said "Not
# in the document" 9 times. The fix, still Part 1 (no embeddings): don't count words that are on every page; a word
# counts more the fewer pages it is on (score = sum of log(pages / pages with the word) over the shared words: the
# idea behind BM25). Same PDF, questions, prompt, AI and settings as rag_demo.py; only step 2 changes.
# Writes series/scripts/ep52_demo/rag_fix.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep52/rag_fix.py
import json
import math
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rag_demo as d  # noqa: E402

HAND = {}   # id: (right?, note), filled after the run


def search_rare(pages, q):   # step 2, fixed: rare words count more, words on every page count 0
    pw = [d.words(p) for p in pages]
    n = len(pages)
    idf = {w: math.log(n / sum(1 for s in pw if w in s)) for s in pw for w in s}
    scores = [round(sum(idf.get(w, 0) for w in d.words(q) & s), 2) for s in pw]
    best = max(range(n), key=lambda i: scores[i])
    return best, scores


def main():
    pages = d.read_pdf()
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
        for qid, q, right in d.QS:
            best, scores = search_rare(pages, q)
            msgs = [{"role": "system", "content": d.RAG_SYSTEM}, {"role": "user", "content": f"Document page {best + 1}:\n{pages[best]}\n\nQuestion: {q}"}]
            reply, usage = d.call(key, msgs)
            rows.append({"mode": "rag_rare", "id": qid, "q": q, "page": best + 1, "scores": scores, "reply": reply,
                         "auto": d.auto(reply, right), "prompt_tokens": usage.get("prompt_tokens")})
            print("rare", qid, f"p{best + 1}", scores, d.auto(reply, right), "|", reply.replace("\n", " ")[:200], flush=True)
        (d.OUT / "rag_fix.json").write_text(json.dumps({"rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)


if __name__ == "__main__":
    main()
