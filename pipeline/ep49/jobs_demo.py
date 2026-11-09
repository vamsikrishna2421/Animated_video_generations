# EP49 demo, "Suresh's paper work" (written and committed before it ran): AI and jobs through the shop. Suresh, Ravi's
# helper, does the shop's paper work every day; Ravi wonders if a free AI app could do it instead. A small free AI,
# offline, gets the five paper tasks from a shop helper's day, five tries each, with right answers fixed before the run:
#   total   : "Add up this shop order and give only the total in rupees: 2 kg sugar at ₹48 per kg, 1 litre oil at ₹150,
#              3 packets of biscuits at ₹20 each, 5 kg rice at ₹60 per kg."  -> right: ₹606
#   gst     : "A bill of ₹1,180 includes 18% GST. What was the price before GST? Give only the amount."  -> right: ₹1,000
#   reorder : "Shop stock: sugar 3 kg (reorder when below 10 kg), oil 12 litres (reorder below 5 litres), toor dal 2 kg
#              (reorder below 8 kg), salt 20 packets (reorder below 10 packets). List only the items that need
#              reordering."  -> right: sugar and toor dal, nothing else
#   offer   : "Write a short WhatsApp message (2 lines) for my kirana shop: 10% off on rice this Sunday only."  -> right
#              (usable as sent): says 10%, rice and Sunday, adds no other offer, price or date
#   reply   : "A customer messaged that 3 of the 12 eggs we delivered were broken. Write a polite 2-line reply offering
#              to replace them today."  -> right (usable as sent): polite, replaces the 3 broken eggs today, no wrong
#              number or extra promise
# total/gst/reorder are scored by the rule above (the number, or exactly the two items); offer/reply by hand. Every reply
# is read by hand (HAND below wins; the hand read goes into the result file).
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, max 160 tokens, a fresh chat each time, generated offline (EP38's check).
# Writes series/scripts/ep49_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/ep49/jobs_demo.py run <model folder>
#   python3 pipeline/ep49/jobs_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep49_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
TRIES = 5
ASKS = {
    "total": "Add up this shop order and give only the total in rupees: 2 kg sugar at ₹48 per kg, 1 litre oil at ₹150, "
             "3 packets of biscuits at ₹20 each, 5 kg rice at ₹60 per kg.",
    "gst": "A bill of ₹1,180 includes 18% GST. What was the price before GST? Give only the amount.",
    "reorder": "Shop stock: sugar 3 kg (reorder when below 10 kg), oil 12 litres (reorder below 5 litres), toor dal 2 kg "
               "(reorder below 8 kg), salt 20 packets (reorder below 10 packets). List only the items that need reordering.",
    "offer": "Write a short WhatsApp message (2 lines) for my kirana shop: 10% off on rice this Sunday only.",
    "reply": "A customer messaged that 3 of the 12 eggs we delivered were broken. Write a polite 2-line reply offering "
             "to replace them today.",
}
HAND = {  # (ask, try): (right?, note), after reading every reply by hand
    **{("total", k): (False, "worked it out step by step; cut off by our 160-token cap before the final sum (partial sums right)") for k in (1, 2, 3, 4)},
    ("reorder", 1): (True, "cut off at 'Sugar, Toor' by our cap; its list says sugar and toor dal"),
    ("reorder", 3): (False, "cut off by our cap before its final list (its reasoning had sugar and toor dal)"),
    **{("reorder", k): (True, "final list: sugar, toor dal (oil and salt named only as 'no need')") for k in (2, 4, 5)},
    ("offer", 1): (False, "a good draft; '[Your Shop Name]' left to fill in"),
    ("offer", 2): (False, "a good draft; '[Your Shop Name]' to fill in and a stray 'ice' at the end"),
    ("offer", 3): (False, "a good draft; a stray 'ice' at the end"),
    ("offer", 4): (False, "a good draft; '[Your Shop Name]' to fill in and a stray 'ice'"),
    ("offer", 5): (False, "a good draft; a stray 'ice-bin:10%off' and '[insert date]'"),
    ("reply", 1): (False, "polite, offers today's replacement; '[Customer's Name]' left to fill in"),
}
# Added after the first run (committed before it runs): 4 of the 5 "total" replies worked it out step by step and were cut
# off by OUR 160-token cap before the final sum (every partial sum right). The same ask again, 5 tries, max 400 tokens,
# scored by the same rule: ask "total_long".
LONG = {"total_long": (ASKS["total"], 400)}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def nums(text):
    return [float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*(?:\.\d+)?", text)]


def auto(ask, reply):
    r = reply.lower()
    if ask == "total":   # the last number it states is its answer
        n = nums(reply)
        return bool(n) and abs(n[-1] - 606) < 0.5
    if ask == "gst":
        n = nums(reply)
        return bool(n) and abs(n[-1] - 1000) < 0.5
    if ask == "reorder":
        return "sugar" in r and "dal" in r and "oil" not in r and "salt" not in r
    if ask == "offer":
        return "10%" in reply and "rice" in r and "sunday" in r
    if ask == "reply":
        return "replace" in r and "today" in r
    return False


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=2048, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "7B.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 160 tokens",
        "asks": ASKS, "rows": []}
    done = {(r["ask"], r["try"]) for r in res["rows"]}
    for ask, text in ASKS.items():
        for k in range(1, TRIES + 1):
            if (ask, k) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=160, seed=k)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"ask": ask, "try": k, "reply": reply, "auto_right": auto(ask, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(ask, k, auto(ask, reply), reply[:140].replace("\n", " "), flush=True)
    for ask, (text, cap) in LONG.items():
        for k in range(1, TRIES + 1):
            if (ask, k) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=cap, seed=k)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"ask": ask, "try": k, "reply": reply, "auto_right": auto("total", reply), "max_tokens": cap,
                                "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(ask, k, auto("total", reply), reply[-120:].replace("\n", " "), flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for r in res["rows"]:
        h = HAND.get((r["ask"], r["try"]))
        r["hand"] = {"right": h[0], "note": h[1]} if h else {"right": r["auto_right"]}
    (OUT / "7B.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    for ask in list(ASKS) + list(LONG):
        rows = [r for r in res["rows"] if r["ask"] == ask]
        print(ask, f"{sum(1 for r in rows if r['hand']['right'])}/{len(rows)} right")


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
