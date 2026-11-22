# Creative 37 test: does an AI write the same leave email for everyone? Qwen2.5-7B-Instruct (4-bit, llama.cpp, on our
# computer), one fresh chat per run, temperature 0.7 (seeds 1-10), 10 runs per ask:
#   usual: the vague ask most people type;
#   details: Ramya's real reason and details (made up by us), with no instruction about style.
# Counted automatically (stock phrases, blank placeholders, specifics kept) and then read by hand (HAND, filled after).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative37/leave_demo.py
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

OUT = ROOT / "series/scripts/creative37_demo"
ASKS = {
    "usual": "Write a leave email to my manager for 2 days, Thursday and Friday, for a personal reason.",
    "details": ("Write a leave email to my manager Kiran for Thursday and Friday. My sister's engagement is on Friday in "
                "Vijayawada, so I leave Wednesday night and I'm back on Monday. The Monday invoice report is done; "
                "Sravya will cover my support tickets."),
}
STOCK = {
    "hope_well": r"i hope (this (e-?mail|message) finds you well|you are (doing )?well|you're (doing )?well|this finds you well)",
    "unforeseen": r"unforeseen",
    "personal_reasons": r"personal (reason|matter|commitment|circumstance)s?",
    "urgent": r"\burgent\b",
    "placeholder": r"\[[^\]]{2,40}\]",
    "appreciate": r"(appreciate your understanding|thank you for your understanding)",
}
SPECIFIC = {"sister": r"sister", "engagement": r"engagement", "vijayawada": r"vijayawada", "sravya": r"sravya",
            "monday": r"monday", "invoice": r"invoice"}


def counts(t):
    low = t.lower()
    first = next((l.strip() for l in t.splitlines() if l.strip() and not l.lower().startswith(("subject", "dear", "hi ", "hello"))), "")
    return {"stock": {k: bool(re.search(v, low)) for k, v in STOCK.items()},
            "specific": {k: bool(re.search(v, low)) for k, v in SPECIFIC.items()},
            "subject": next((l.strip() for l in t.splitlines() if l.lower().startswith("subject")), ""),
            "first_line": first[:160], "words": len(t.split())}


def call(key, q, seed):
    body = json.dumps({"model": "ai", "messages": [{"role": "user", "content": q}], "temperature": 0.7, "seed": seed,
                       "max_tokens": 400}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


HAND = {   # by hand, after reading all 20 replies in full (Nov 22)
    # usual: every reply opens "I hope this message/email finds you well" (8 message, 2 email: seeds 1 and 6) and is addressed to
    # "[Manager's Name]" (9 "Dear", 1 "Hi"); none has a real reason ("personal reasons/matters" in 8, a bracket to fill in
    # 2, seeds 6 and 7); dates nobody gave in 4 (seeds 3, 6, 10: "October 12th and 13th"; seed 5: "October 13th and 14th");
    # "[Your Name]" in 10. 7 add "if there is any urgent matter".
    "usual": {"opens_hope_well": 10, "manager_placeholder": 10, "no_real_reason": 10, "made_up_dates": 4, "same_oct_12_13": 3},
    # details: all 10 keep the sister's engagement, Vijayawada and Sravya; 9 keep "back on Monday" (seed 4 drops it);
    # still 10 of 10 open "I hope this email finds you well"; 3 give Sravya the wrong job (seeds 4 and 9: the invoice
    # report "which Sravya will handle"; seed 7: "which she can review"); a month nobody gave in all 10 (seed 1 "April 6th";
    # October, March, July, November elsewhere, with [Date] left in 9); seed 8 signs off "Qwen", the AI's own name,
    # above "[Your Name]"; "[Your Name]" in 10.
    "details": {"kept_engagement_vijayawada_sravya": 10, "kept_monday": 9, "opens_hope_well": 10, "wrong_job_for_sravya": 3,
                "made_up_month": 10, "signed_qwen": 1},
}


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
                c = counts(reply)
                rows.append({"ask": ask, "seed": seed, "secs": round(time.time() - t0, 1), "reply": reply, **c})
                print(ask, seed, rows[-1]["secs"], {k: v for k, v in c["stock"].items() if v}, "|", c["first_line"][:90], flush=True)
    finally:
        srv.terminate()
    tot = {ask: {k: sum(1 for r in rows if r["ask"] == ask and r["stock"][k]) for k in STOCK} for ask in ASKS}
    (OUT / "leave.json").write_text(json.dumps({"asks": ASKS, "totals": tot, "rows": rows}, indent=1, ensure_ascii=False))
    print("TOTALS", json.dumps(tot))


if __name__ == "__main__":
    main()
