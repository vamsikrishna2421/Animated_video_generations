# EP52 third run (written and committed before it ran). Both searches picked the cover page: plain keyword search 9 of
# 10 times (rag_demo.py), and rare-word search too (rag_fix.py), because the product name "MG-750" is only on the cover,
# so it counts as rare. For a short PDF there is a simpler step 2: don't search; send all the pages, each marked
# "--- page N ---" (the 5 pages are a few hundred tokens). Same PDF, questions, AI and settings; the prompt asks for
# the page number. Searching is for PDFs too big to send whole: that is Part 2.
# Writes series/scripts/ep52_demo/rag_full.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep52/rag_full.py
import json
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rag_demo as d  # noqa: E402

SYSTEM_ALL = ("Answer the question only from the document below. If the answer is not in it, say \"Not in the "
              "document.\" Keep it to one or two short lines, and end with the page number, like (page 3).")
HAND = {}   # id: (right?, page right?, note), filled after the run


def main():
    pages = d.read_pdf()
    doc = "\n\n".join(f"--- page {i + 1} ---\n{p}" for i, p in enumerate(pages))
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
            msgs = [{"role": "system", "content": SYSTEM_ALL}, {"role": "user", "content": f"Document:\n{doc}\n\nQuestion: {q}"}]
            reply, usage = d.call(key, msgs)
            rows.append({"mode": "all_pages", "id": qid, "q": q, "reply": reply, "auto": d.auto(reply, right), "prompt_tokens": usage.get("prompt_tokens")})
            print("all ", qid, usage.get("prompt_tokens"), d.auto(reply, right), "|", reply.replace("\n", " ")[:200], flush=True)
        (d.OUT / "rag_full.json").write_text(json.dumps({"system": SYSTEM_ALL, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)


if __name__ == "__main__":
    main()
