# Creative 32 test (written and committed before it ran): does a short AI summary of a rental agreement keep the line
# that costs the tenant money? The agreement below is made up by us (no real flat, owner or tenant). Clause 9 lets
# either side leave with one month's notice; clause 10 (a lock-in) says leaving in the first 6 months costs two months'
# rent, Rs 36,000, taken from the deposit. Clause 11: Rs 8,000 painting taken from the deposit.
# The same small free AI as our episodes (Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our computer), one fresh chat per
# run, temperature 0.7 (seeds 1-10, so the 10 runs differ the way real chats do), max 300 tokens.
#   P1 the usual ask:   "Summarise this rental agreement for me in 5 short points."
#   P2 the better ask:  every amount I may pay or lose + every condition on leaving early, with the clause number
#   P3 the real worry:  "I may have to move out after 4 months for a job transfer. What will it cost me?"
# Counted (auto, then every reply read by hand: HAND): mentions the lock-in or the Rs 36,000; mentions the Rs 8,000
# painting; says the tenant can leave with one month's notice without naming the lock-in.
# Writes series/scripts/creative32_demo/summary.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative32/summary_demo.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep52"))
import rag_demo as d  # noqa: E402  (model_file, PORT)

OUT = ROOT / "series/scripts/creative32_demo"
AGREEMENT = """RENTAL AGREEMENT (11 months)
1. Property: Flat 302, a residential flat in Hyderabad, let by the Owner to the Tenant, semi-furnished.
2. Term: 11 months, from 1 December 2026 to 31 October 2027, renewable by mutual consent.
3. Rent: Rs 18,000 per month, payable on or before the 5th of every month by bank transfer.
4. Maintenance: Rs 2,000 per month, payable by the Tenant directly to the residents' association.
5. Security deposit: Rs 54,000, paid on signing, refundable without interest when the Tenant vacates, after deducting
any unpaid rent, unpaid bills and the cost of any damage beyond normal wear and tear.
6. Bills: electricity and water as per the meter readings, paid by the Tenant.
7. Use: for residential use by the Tenant's family only; no sub-letting; pets only with the Owner's written consent.
8. Repairs: minor repairs up to Rs 1,000 each by the Tenant; structural and major repairs by the Owner.
9. Notice: either party may end this agreement by giving one month's written notice to the other.
10. Lock-in: notwithstanding clause 9, the first 6 months are a lock-in period. If the Tenant vacates during the
lock-in period, the Tenant shall pay two months' rent, Rs 36,000, as a penalty, which the Owner may deduct from the
security deposit.
11. Painting: when the Tenant vacates, Rs 8,000 towards repainting shall be deducted from the security deposit.
12. Renewal: on renewal, the rent shall increase by 5%.
13. Access: the Owner may inspect the flat with 24 hours' notice to the Tenant.
14. Keys: the Tenant shall return all keys and access cards when vacating."""
ASKS = {
    "P1": "Summarise this rental agreement for me in 5 short points.",
    "P2": "From this rental agreement, list every amount of money I may have to pay or lose, and every condition on "
          "leaving early. Give the clause number for each.",
    "P3": "I may have to move out after 4 months for a job transfer. What will it cost me?",
}
HAND = {}   # filled after the run, every reply read by hand


def call(key, question, seed):
    msgs = [{"role": "user", "content": AGREEMENT + "\n\n" + question}]
    body = json.dumps({"model": "ai", "messages": msgs, "temperature": 0.7, "seed": seed, "max_tokens": 300}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=900) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"].strip()


def marks(reply):
    t = reply.lower().replace("₹", "rs ")
    lock = bool(re.search(r"lock[- ]?in|36,?000|two months'? rent|2 months'? rent", t))
    paint = bool(re.search(r"8,?000|paint", t))
    notice_only = bool(re.search(r"one month'?s? (written )?notice|1[- ]month'?s? notice|one-month notice", t)) and not lock
    return {"lock_in": lock, "painting": paint, "notice_without_lock_in": notice_only}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
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
        for ask, q in ASKS.items():
            for seed in range(1, 11):
                t0 = time.time()
                reply = call(key, q, seed)
                m = marks(reply)
                rows.append({"ask": ask, "seed": seed, "reply": reply, "secs": round(time.time() - t0, 1), **m})
                print(ask, seed, m, "|", reply.replace("\n", " ")[:160], flush=True)
                (OUT / "summary.json").write_text(json.dumps({"agreement": AGREEMENT, "asks": ASKS, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    for ask in ASKS:
        rr = [r for r in rows if r["ask"] == ask]
        print(ask, "lock-in", sum(r["lock_in"] for r in rr), "painting", sum(r["painting"] for r in rr),
              "notice without lock-in", sum(r["notice_without_lock_in"] for r in rr), "of", len(rr))


if __name__ == "__main__":
    main()
