# EP41 demo (how to choose the right model): the shop's three squeezed brains (EP37-EP40: Qwen's own 4-bit GGUF files
# of Qwen2.5-1.5B/3B/7B-Instruct, llama.cpp, 4 CPU cores, greedy, offline in an empty network namespace) on Ravi's
# WhatsApp job, with the pass mark written down BEFORE the run (OpenAI's model-selection guide: "Choose acceptance
# criteria before comparing models"; then "keep the lightest setting that meets your quality bar").
#   replies : EP34's 20 orders as typed on WhatsApp; the reply prompt is EP36's plus EP39's "Reply in 2 short lines."
#             Scored per reply: every item with its quantity (checked by hand, HAND below), and the seconds to the
#             whole reply (from the request to the last token).
#   telugu  : the same 20 orders typed the way Telugu customers type them in English letters ("2 kg biyyam, 1 dozen
#             guddlu"), the same prompt and scoring (an item may be named in English or in Telugu).
# The bills job is EP38's run (series/scripts/ep38_demo): right totals out of 20, the same brains and settings.
# One brain is downloaded at a time into HF_HUB_CACHE (RAM), tested offline, saved, deleted.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep41/choose_demo.py 1.5B 3B 7B [--force]
#   python3 pipeline/ep41/choose_demo.py --score      (score the saved replies again, no model run)
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep41_demo"
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "3B": "Qwen/Qwen2.5-3B-Instruct-GGUF",
         "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PATTERN = "*q4_k_m*.gguf"
N_CTX = 4096

# The pass marks, fixed before any brain ran (Oct 28, 2026):
PASS = {
    "replies": "every item with its right quantity in at least 19 of the 20 replies, and every reply finished in under "
               "10 seconds (EP39: the customer gave up at 17 s)",
    "bills": "the right total on all 20 bills (it is money: no wrong bill)",
}
SYSTEM = ("You are the WhatsApp assistant of a small grocery shop (a kirana shop in Hyderabad). Reply to the customer "
          "politely in simple English: confirm each item and say it will be delivered within 30 minutes. No prices. "
          "Reply in 2 short lines.")
# (order as typed, the same order typed in Telugu words, the items: [(quantity words accepted, item names accepted)])
Q = lambda *a: a   # noqa: E731
ORDERS = [
    ("anna 2 kg tomato, 1 dozen eggs pls", "anna 2 kg tomatolu, 1 dozen guddlu pls",
     [(Q("2 kg", "two kg", "2kg", "2 kilo"), Q("tomato")), (Q("1 dozen", "one dozen", "12"), Q("egg", "guddu", "guddlu"))]),
    ("1 kg rice, 1 kg toor dal, 2 milk packets", "1 kg biyyam, 1 kg kandi pappu, 2 paala packets",
     [(Q("1 kg", "one kg", "1kg", "1 kilo"), Q("rice", "biyyam")), (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("dal", "pappu")),
      (Q("2", "two"), Q("milk", "paala", "paalu"))]),
    ("3 bath soaps and 1 detergent powder", "3 sabbulu and 1 surf podi",
     [(Q("3", "three"), Q("soap", "sabbu")), (Q("1", "one", "a "), Q("detergent", "surf"))]),
    ("half kg sugar and one tea powder", "ara kilo panchadara and okati tea podi",
     [(Q("half", "0.5", "500 g", "500g", "1/2", "ara kilo"), Q("sugar", "panchadara")), (Q("1", "one", "a ", "okati"), Q("tea"))]),
    ("2 bread 4 biscuits", "2 bread 4 biscuits",
     [(Q("2", "two"), Q("bread")), (Q("4", "four"), Q("biscuit"))]),
    ("1 coconut oil, 2 kg onion, 1 kg potato", "1 kobbari nune, 2 kg ullipayalu, 1 kg bangaladumpa",
     [(Q("1", "one", "a "), Q("coconut oil", "kobbari")), (Q("2 kg", "two kg", "2kg", "2 kilo"), Q("onion", "ullipaya", "ulli")),
      (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("potato", "bangaladumpa", "aloo", "alu"))]),
    ("2 curd 2 milk", "2 perugu 2 paalu",
     [(Q("2", "two"), Q("curd", "perugu", "yogurt", "yoghurt")), (Q("2", "two"), Q("milk", "paalu"))]),
    ("5 kg rice please", "5 kg biyyam please",
     [(Q("5 kg", "five kg", "5kg", "5 kilo"), Q("rice", "biyyam"))]),
    ("1 doz eggs, 1 bread, 2 milk, 1 curd", "1 doz guddlu, 1 bread, 2 paalu, 1 perugu",
     [(Q("1 doz", "one doz", "12"), Q("egg", "guddu", "guddlu")), (Q("1", "one", "a "), Q("bread")),
      (Q("2", "two"), Q("milk", "paalu")), (Q("1", "one", "a "), Q("curd", "perugu", "yogurt", "yoghurt"))]),
    ("2 kg dal and 2 kg sugar", "2 kg pappu and 2 kg panchadara",
     [(Q("2 kg", "two kg", "2kg", "2 kilo"), Q("dal", "pappu")), (Q("2 kg", "two kg", "2kg", "2 kilo"), Q("sugar", "panchadara"))]),
    ("half kg tomato, 1 kg onion", "ara kilo tomatolu, 1 kg ullipayalu",
     [(Q("half", "0.5", "500 g", "500g", "1/2", "ara kilo"), Q("tomato")), (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("onion", "ullipaya", "ulli"))]),
    ("3 biscuits, 1 tea powder, 1 kg sugar", "3 biscuits, 1 tea podi, 1 kg panchadara",
     [(Q("3", "three"), Q("biscuit")), (Q("1", "one", "a "), Q("tea")), (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("sugar", "panchadara"))]),
    ("2 coconut oil", "2 kobbari nune",
     [(Q("2", "two"), Q("coconut oil", "kobbari"))]),
    ("1 detergent, 2 soap, 1 kg potato", "1 surf, 2 sabbulu, 1 kg bangaladumpa",
     [(Q("1", "one", "a "), Q("detergent", "surf")), (Q("2", "two"), Q("soap", "sabbu")),
      (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("potato", "bangaladumpa", "aloo", "alu"))]),
    ("4 milk packets and 2 bread", "4 paala packets and 2 bread",
     [(Q("4", "four"), Q("milk", "paala", "paalu")), (Q("2", "two"), Q("bread"))]),
    ("2 dozen eggs", "2 dozen guddlu",
     [(Q("2 dozen", "two dozen", "24"), Q("egg", "guddu", "guddlu"))]),
    ("1 kg each tomato onion potato rice", "tomatolu ullipayalu bangaladumpa biyyam tala okka kilo",
     [(Q("1 kg", "one kg", "1kg", "1 kilo", "each"), Q("tomato")), (Q("1 kg", "one kg", "1kg", "1 kilo", "each"), Q("onion", "ullipaya", "ulli")),
      (Q("1 kg", "one kg", "1kg", "1 kilo", "each"), Q("potato", "bangaladumpa", "aloo", "alu")),
      (Q("1 kg", "one kg", "1kg", "1 kilo", "each"), Q("rice", "biyyam"))]),
    ("3 kg sugar, 2 tea powder", "3 kg panchadara, 2 tea podi",
     [(Q("3 kg", "three kg", "3kg", "3 kilo"), Q("sugar", "panchadara")), (Q("2", "two"), Q("tea"))]),
    ("1 curd 1 bread 5 biscuits", "1 perugu 1 bread 5 biscuits",
     [(Q("1", "one", "a "), Q("curd", "perugu", "yogurt", "yoghurt")), (Q("1", "one", "a "), Q("bread")), (Q("5", "five"), Q("biscuit"))]),
    ("2 kg rice, 1 kg dal, 1 coconut oil, 2 soaps", "2 kg biyyam, 1 kg pappu, 1 kobbari nune, 2 sabbulu",
     [(Q("2 kg", "two kg", "2kg", "2 kilo"), Q("rice", "biyyam")), (Q("1 kg", "one kg", "1kg", "1 kilo"), Q("dal", "pappu")),
      (Q("1", "one", "a "), Q("coconut oil", "kobbari")), (Q("2", "two"), Q("soap", "sabbu"))]),
]
# Every reply read by hand: (job, brain, order number 1-20) -> True (every item with its quantity) / False, where the
# word check below reads it wrong. Filled after the run.
HAND = {}


def auto_ok(reply, items):
    """A first pass for the hand reading: each item is named, with one of its quantities in the 30 characters before the
    name (or right after it, "eggs: 2 dozen")."""
    r = " " + re.sub(r"\s+", " ", reply.lower()) + " "
    for qtys, names in items:
        hit = False
        for nm in names:
            for m in re.finditer(re.escape(nm), r):
                ctx = r[max(0, m.start() - 30):m.start()] + " | " + r[m.end():m.end() + 16]
                if any(re.search(r"(?<![\d.])" + re.escape(q.strip()) + (r"(?![\d.])" if q.strip()[-1].isdigit() else ""), ctx) for q in qtys):
                    hit = True
        if not hit:
            return False
    return True


def score(res, job):
    rows = res[job]["rows"]
    for i, row in enumerate(rows, 1):
        row["auto_ok"] = auto_ok(row["reply"], ORDERS[i - 1][2])
        row["ok"] = HAND.get((job, res["size"], i), row["auto_ok"])
    secs = [r["seconds"] for r in rows]
    res[job].update({"right": sum(r["ok"] for r in rows), "of": len(rows), "slowest_s": max(secs),
                     "median_s": sorted(secs)[len(secs) // 2], "under_10s": sum(s < 10 for s in secs)})
    return res


def network_check():
    import socket
    res = {}
    for name, fn in (("dns_huggingface.co", lambda: socket.getaddrinfo("huggingface.co", 443)),
                     ("connect_1.1.1.1:443", lambda: socket.create_connection(("1.1.1.1", 443), timeout=3).close())):
        try:
            fn()
            res[name] = "reachable (network is ON)"
        except OSError as e:
            res[name] = f"failed: {e}"
    res["offline"] = all(v.startswith("failed") for v in res.values())
    return res


def run_offline(size, folder):
    from llama_cpp import Llama
    net = network_check()
    print(f"{size}: network check {net}", flush=True)
    if not net["offline"]:
        sys.exit("network still reachable: not an offline test")
    parts = sorted(Path(folder).glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=N_CTX, verbose=False, seed=0)
    dest = OUT / f"{size}.json"
    res = json.loads(dest.read_text()) if dest.exists() else {}
    res.update({"model": f"{REPOS[size]} (q4_k_m)", "size": size, "network": net, "pass": PASS, "system": SYSTEM,
                "decoding": "greedy (temperature 0), max 80 tokens, llama.cpp via llama-cpp-python, 4 threads, context 4096"})
    llm.create_chat_completion([{"role": "system", "content": SYSTEM}, {"role": "user", "content": ORDERS[0][0]}],
                               temperature=0.0, max_tokens=4)   # warm-up (pages the weights in)
    for job, col in (("replies", 0), ("telugu", 1)):
        rows = []
        for o in ORDERS:
            llm.reset()
            t0 = time.perf_counter()
            out = llm.create_chat_completion([{"role": "system", "content": SYSTEM}, {"role": "user", "content": o[col]}],
                                             temperature=0.0, max_tokens=80)
            dt = time.perf_counter() - t0
            rows.append({"order": o[col], "reply": out["choices"][0]["message"]["content"].strip(), "seconds": round(dt, 2),
                         "tokens": out["usage"]["completion_tokens"]})
            print(f"{size} {job} {len(rows):2d} {dt:5.1f}s | {rows[-1]['reply'][:110]!r}", flush=True)
        res[job] = {"rows": rows}
        score(res, job)
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print(f"{size} {job}: {res[job]['right']}/20 auto, slowest {res[job]['slowest_s']} s, under 10 s {res[job]['under_10s']}/20", flush=True)
    res["network_after"] = network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def main(sizes, force):
    from huggingface_hub import snapshot_download
    OUT.mkdir(parents=True, exist_ok=True)
    for size in sizes:
        dest = OUT / f"{size}.json"
        if dest.exists() and "telugu" in json.loads(dest.read_text()) and not force:
            print(f"{size}: done already", flush=True)
            continue
        folder = snapshot_download(REPOS[size], allow_patterns=[PATTERN])   # online: the one-time download
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", size, folder], check=True)
        cache = Path(os.environ.get("HF_HUB_CACHE", Path.home() / ".cache/huggingface/hub")) / ("models--" + REPOS[size].replace("/", "--"))
        shutil.rmtree(cache, ignore_errors=True)   # one brain in RAM at a time


if __name__ == "__main__":
    if sys.argv[1:2] == ["--offline"]:
        run_offline(sys.argv[2], sys.argv[3])
    elif sys.argv[1:2] == ["--score"]:
        for f in sorted(OUT.glob("*.json")):
            res = json.loads(f.read_text())
            for job in ("replies", "telugu"):
                if job in res:
                    score(res, job)
                    print(f.stem, job, res[job]["right"], "/ 20 · slowest", res[job]["slowest_s"], "s · under 10 s", res[job]["under_10s"])
            f.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    else:
        main([a for a in sys.argv[1:] if not a.startswith("--")], "--force" in sys.argv)
