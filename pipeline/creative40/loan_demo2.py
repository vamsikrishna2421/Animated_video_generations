# Creative 40 follow-up (written and committed before it ran): loan_demo.py found the same facts rated LOW risk in
# 5/10 runs in polished English, 0/10 in simple English or Telugu-English, and 1/10 with the builder's "ignore the
# language" fix. Does the viewer need fancy English, or just the facts laid out?
#   list: the same facts as a plain list, no greeting, no polish (the kind anyone can type):
#         "Salary: 45000 per month / Job: store supervisor, 4 years / Bike EMI: 6000 per month, never missed /
#          Loan: 2 lakh, 24 months / For: sister's wedding"
# Same model, settings, system prompt and ask as loan_demo.py (seeds 1-10). Counted, then read by hand.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative40/loan_demo2.py
import json
import secrets
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/creative40"))
import loan_demo as t  # noqa: E402

LIST = ("Salary: 45000 per month\nJob: store supervisor, 4 years\nBike EMI: 6000 per month, never missed\n"
        "Loan: 2 lakh, 24 months\nFor: sister's wedding")
HAND = None   # filled in by hand after reading all 10 replies


def main():
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(t.d.model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(t.d.PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", t.d.PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for seed in range(1, 11):
            reply = t.call(key, t.SYSTEM, t.ASK.format(m=LIST), seed)
            rows.append({"setup": "list", "seed": seed, "rating": t.rating(reply), "reply": reply})
            print("list", seed, rows[-1]["rating"], "|", reply[:110].replace("\n", " "), flush=True)
            (t.OUT / "loan2.json").write_text(json.dumps({"list": LIST, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
