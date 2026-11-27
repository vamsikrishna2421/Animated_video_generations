# Creative 42 test (written and committed before it ran): ask a small free AI the deadline a taxpayer asks in late
# November: "I missed the July date; can I still file my income tax return, and by when?" What date and year does it
# give, and does it say it's too late? Three ways of asking, 10 fresh chats each (seeds 1-10, temperature 0.7):
#   plain:  "What is the last date to file a belated income tax return in India this year?"
#   missed: "I missed the July deadline for my income tax return in India. Can I still file it now? By when?"
#   dated:  "Today is 27 November 2026." + the missed ask
# Qwen2.5-7B-Instruct (4-bit Q4_K_M, llama.cpp) on our computer, no web search, through `llama serve`'s chat endpoint.
# Every reply read by hand afterwards (HAND): the date and year it gives, "too late / can't file" or not, the late fee
# it names, whether it says to check the official site. The true answer comes from the Income Tax Department's pages
# (series/scripts/creative42_demo/README.md).
#   LLAMA=/tmp/claude-0/llbuild/bin/llama LLAMA_CACHE=/tmp/claude-0/llama-cache python3 pipeline/creative42/itr_demo.py
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative42_demo"
LLAMA = os.environ.get("LLAMA", "llama")
MODEL = "Qwen/Qwen2.5-7B-Instruct-GGUF:Q4_K_M"
PORT = 8094
MISSED = "I missed the July deadline for my income tax return in India. Can I still file it now? By when?"
ASK = {
    "plain": "What is the last date to file a belated income tax return in India this year?",
    "missed": MISSED,
    "dated": "Today is 27 November 2026. " + MISSED,
}
HAND = {   # by hand, Nov 27 (every reply read in full; the true answer: a belated return by 31 Dec 2026, fee Rs 5,000 or
            # Rs 1,000 if total income is up to Rs 5 lakh; after that only an updated return, which cannot claim a refund)
    "plain": "0/10 right. 10/10 answer for FY 2022-23. Last dates given: 31 Aug (2023 or 2024) 4, 30 Jun 2024 2, 31 Mar 1, "
             "30 Oct 2023 1, 30 Sep 2023 1, none (check the site) 1",
    "missed": "0/10 right. 'No fixed deadline' / 'no specific latest date' 2 (seeds 2, 3); 30 Sep 1, 15 Nov 1, 31 Oct 1, "
              "'before 31 Aug no penalty' 1, ~6 months grace 1, past years' 31 Jul only 3. Invented fees: 0.5% a day up to "
              "25% of the tax (5, 6), 0.5% a month (3, 7), 1% a month (2)",
    "dated": "0/10 right. Uses FY 2025-26 / 31 Jul 2026 as the missed date 9/10, then: end of September 2 (9, 10), 31 Mar 2027 1, "
             "31 Oct 1, 31 Dec as a 'no late-fee' date with six more months after it 1 (8: wrong), no last date 5. Invented "
             "fees: 0.5% a month up to 25% (1, 2), 0.5% a day up to 25% (4), 0.1% a day (6)",
}


def up(timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as r:
                if json.loads(r.read()).get("status") == "ok":
                    return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError("server did not come up")


def ask(q, seed):
    body = json.dumps({"messages": [{"role": "user", "content": q}], "temperature": 0.7, "seed": seed, "max_tokens": 400}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    srv = subprocess.Popen([LLAMA, "serve", "-hf", MODEL, "--offline", "--port", str(PORT), "--host", "127.0.0.1", "-t", "4", "-c", "4096"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        up()
        for setup, q in ASK.items():
            for seed in range(1, 11):
                reply = ask(q, seed)
                rows.append({"setup": setup, "seed": seed, "reply": reply})
                print(setup, seed, "|", reply[:160].replace("\n", " "), flush=True)
                (OUT / "itr.json").write_text(json.dumps({"model": MODEL, "ask": ASK, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    print("DONE")


if __name__ == "__main__":
    main()
