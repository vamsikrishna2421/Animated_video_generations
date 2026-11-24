# UC02 follow-up test (written and committed before it ran). In search_demo.py the AI picked the page dated today 10/10,
# because the old page said "Last updated 12 November 2025". Many real pages say "today" with no date. Same six pages
# and the same search, but the old page (P2) loses its date line; same model and settings (seeds 1-10, max 220 tokens):
#   undated:        P2 undated, the AI told today's date (as before);
#   undated_nodate: P2 undated, the AI NOT told today's date.
# Scored as in search_demo.py (price, link cited, does that page say it, right = ₹142 from P1), then read by hand.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc02/search_demo2.py
import json
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/uc02"))
import search_demo as s  # noqa: E402

url, title, text = s.PAGES["P2"]
s.PAGES["P2"] = (url, title, text.replace(" Last updated 12 November 2025.", ""))
SYSTEMS = {"undated": s.SYSTEM, "undated_nodate": "You are the phone assistant of Ravi's kirana shop in Hyderabad."}
INSTR = s.ASKS["search"]


def main():
    res = s.search(s.QUESTION)
    print("SEARCH", [(r[0], r[4]) for r in res], flush=True)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(s.d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(s.d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", s.d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for ask, system in SYSTEMS.items():
            for seed in range(1, 11):
                user = f"{s.QUESTION}\n\nSearch results:\n{s.results_text(res)}\n\n{INSTR}"
                reply = s.call(key, [{"role": "system", "content": system}, {"role": "user", "content": user}], seed)
                rows.append({"ask": ask, "seed": seed, "reply": reply, **s.score(reply)})
                r = rows[-1]
                print(ask, seed, r["price"], r["cited"], r["page_says_it"], r["right"], "|", reply[:90].replace("\n", " "), flush=True)
                (s.OUT / "search2.json").write_text(json.dumps({"p2_text": s.PAGES["P2"][2], "systems": SYSTEMS, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
