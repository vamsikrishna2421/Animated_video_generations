# UC02 second follow-up (written and committed before it ran). search_demo2.py: with the old page undated, the AI not
# told today's date answered ₹168 from the old page 10/10; told the date in its instructions (the system prompt, the
# app's side), ₹142 from today's page 10/10. The viewers asked what a USER can do. This test: the same undated old
# page, the same search and model, NO date in the system prompt, and the user types today's date into the question:
#   date_in_question: "Today is Tuesday, 24 November 2026. What is today's wholesale price of toor dal in Hyderabad?"
# Seeds 1-10, max 220 tokens, scored as in search_demo.py, then read by hand.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc02/search_demo3.py
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
SYSTEM = "You are the phone assistant of Ravi's kirana shop in Hyderabad."   # no date, as in "undated_nodate"
PREFIX = f"Today is {s.TODAY}. "
INSTR = s.ASKS["search"]
HAND = "10/10 Rs 142 from today's page (Nov 24, read by hand): 8 cite its link, 2 name it by its title without the link; none cite the old page."


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
        for seed in range(1, 11):
            user = f"{PREFIX}{s.QUESTION}\n\nSearch results:\n{s.results_text(res)}\n\n{INSTR}"
            reply = s.call(key, [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}], seed)
            rows.append({"ask": "date_in_question", "seed": seed, "reply": reply, **s.score(reply)})
            r = rows[-1]
            print("date_in_question", seed, r["price"], r["cited"], r["page_says_it"], r["right"], "|", reply[:90].replace("\n", " "), flush=True)
            (s.OUT / "search3.json").write_text(json.dumps({"p2_text": s.PAGES["P2"][2], "system": SYSTEM, "prefix": PREFIX,
                                                            "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
