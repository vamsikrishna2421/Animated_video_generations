# UC02 test (written and committed before it ran): how an AI answers with web search (search -> read pages -> cite),
# and where it goes wrong. A small made-up "web" of six dated pages (every page, URL and price below is made up by us);
# a keyword search tool (BM25 over the pages) that returns the top 3 results; the same small free AI as our episodes
# (Qwen2.5-7B-Instruct, 4-bit, llama.cpp, on our computer), one fresh chat per run, temperature 0.7, seeds 1-10.
# The question: "What is today's wholesale price of toor dal in Hyderabad?" Today = Tuesday, 24 November 2026.
# The right answer: ₹142 a kg, from the page dated today (P1). The top search result is an old page with a search-friendly
# title (P2: ₹168, November 2025), as happens on the real web.
#   none:   no search, the question alone;
#   search: the top 3 results (title, link, text) pasted in as the tool's output; "answer and cite the link";
#   check:  the same + "use only a page dated today; quote the exact line with the price, then give the link".
# Counted automatically and then read by hand (HAND): the price stated, the link cited, whether the cited page really
# says that price, and whether the answer is right (₹142 from P1).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc02/search_demo.py
import json
import math
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

OUT = ROOT / "series/scripts/uc02_demo"
TODAY = "Tuesday, 24 November 2026"
PAGES = {
    "P1": ("https://begumbazar-rates.example/today", "Today's wholesale rates in Hyderabad: Begum Bazar, Tuesday 24 November 2026",
           "Updated Tuesday 24 November 2026, 7 AM. Wholesale rates per kg at Begum Bazar, Hyderabad: toor dal ₹142, "
           "chana dal ₹88, moong dal ₹118, urad dal ₹126. Sona masoori rice, 25 kg bag: ₹1,450."),
    "P2": ("https://hyderabad-prices.example/toor-dal-wholesale-price-hyderabad-today", "Toor dal wholesale price in Hyderabad today",
           "Toor dal wholesale price in Hyderabad today: ₹168 per kg at Begum Bazar. Check the toor dal price before you buy. "
           "Last updated 12 November 2025."),
    "P3": ("https://kitchen-blog.example/why-dal-prices-keep-rising", "Why dal prices keep rising",
           "October 2026. Our readers in Hyderabad say retail toor dal now costs ₹150 to ₹155 a kg in their local shops."),
    "P4": ("https://agri-portal.example/monthly-wholesale-averages", "Monthly average wholesale prices, October 2026",
           "October 2026 averages. Toor dal, Hyderabad wholesale: ₹146 a kg. Chana dal: ₹90 a kg."),
    "P5": ("https://rice-news.example/sona-masoori-prices", "Sona masoori rice prices this week",
           "Sona masoori rice in Hyderabad: ₹1,450 for a 25 kg bag at wholesale, November 2026."),
    "P6": ("https://recipes.example/simple-toor-dal", "Simple toor dal recipe",
           "Wash one cup of toor dal and cook it with turmeric. Add tamarind, tomato and a tempering of mustard seeds."),
}
QUESTION = "What is today's wholesale price of toor dal in Hyderabad?"
SYSTEM = f"You are the phone assistant of Ravi's kirana shop in Hyderabad. Today is {TODAY}."
ASKS = {
    "none": None,
    "search": "Answer the question using the search results. Give the price and cite the link you used.",
    "check": ("Answer the question using the search results. Use only a page dated today. Quote the exact line with the "
              "price from that page, then give the price and the link."),
}
RIGHT = 142
HAND = {}   # filled after the run, by reading every reply in full


def tokens(t):
    return re.findall(r"[a-z0-9]+", t.lower())


def search(q, k=3):
    """BM25 over the six pages (title + text); returns the top k as (id, url, title, text, score)."""
    docs = {pid: tokens(title + " " + text) for pid, (url, title, text) in PAGES.items()}
    n, avg = len(docs), sum(len(v) for v in docs.values()) / len(docs)
    qt = tokens(q)
    out = []
    for pid, dt in docs.items():
        s = 0.0
        for t in set(qt):
            df = sum(1 for v in docs.values() if t in v)
            if df == 0:
                continue
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            tf = dt.count(t)
            s += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * len(dt) / avg))
        out.append((pid, *PAGES[pid], round(s, 3)))
    return sorted(out, key=lambda r: -r[4])[:k]


def results_text(res):
    return "\n\n".join(f"[{i + 1}] {title}\n{url}\n{text}" for i, (pid, url, title, text, s) in enumerate(res))


def score(reply):
    nums = [int(x.replace(",", "")) for x in re.findall(r"₹\s*([\d,]{2,5})", reply)]
    price = next((x for x in nums if 50 <= x <= 400), None)
    links = re.findall(r"https?://[^\s\)\]>,]+", reply)
    cited = next((pid for pid, (url, _, _) in PAGES.items() for l in links if l.rstrip(".") == url), None)
    page_has = bool(cited and price and f"₹{price}" in PAGES[cited][2].replace(",", ""))
    return {"price": price, "cited": cited, "page_says_it": page_has, "right": price == RIGHT and cited == "P1"}


def call(key, messages, seed):
    body = json.dumps({"model": "ai", "messages": messages, "temperature": 0.7, "seed": seed, "max_tokens": 220}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{d.PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = search(QUESTION)
    print("SEARCH", [(r[0], r[4]) for r in res], flush=True)
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
        for ask, instr in ASKS.items():
            for seed in range(1, 11):
                user = QUESTION if instr is None else f"{QUESTION}\n\nSearch results:\n{results_text(res)}\n\n{instr}"
                t0 = time.time()
                reply = call(key, [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}], seed)
                rows.append({"ask": ask, "seed": seed, "secs": round(time.time() - t0, 1), "reply": reply, **score(reply)})
                r = rows[-1]
                print(ask, seed, r["secs"], r["price"], r["cited"], r["page_says_it"], r["right"], "|", reply[:90].replace("\n", " "), flush=True)
                (OUT / "search.json").write_text(json.dumps({"pages": PAGES, "question": QUESTION, "search": [r[:1] + r[4:] for r in res],
                                                             "asks": ASKS, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
    print("DONE")


if __name__ == "__main__":
    main()
