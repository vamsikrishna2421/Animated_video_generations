# Creative 25 demo, "which wish did the AI write?" (written and committed before it ran). A small free AI, offline,
# writes a birthday wish for a grandmother turning 80, ten tries each way, with everything we count fixed before the run:
#   bare    : "Write a short WhatsApp birthday wish (3 lines) for my grandmother, who turns 80 today."
#   details : the same, plus two real details: "She taught me to ride a bicycle when I was 8, and her pulihora is the
#             best in the family. Don't add any other memories."
# Counted per reply (auto, then every reply read by hand; HAND below wins):
#   stock   : how many of these stock phrases it uses: "filled with", "cherish", "blessed", "blessing", "joy", "warmth",
#             "may your", "wonderful", "special day", "heartfelt", "laughter", "love and", "memories"
#   both    : (details only) names both the bicycle and the pulihora
#   made_up : (by hand) adds a memory, habit or fact about her that we never gave (e.g. "your garden", "your stories")
#   specific: (by hand, bare only) says anything only this grandmother's family would know (expected: none)
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, max 160 tokens, a fresh chat each time, generated offline (EP38's check).
# Writes series/scripts/creative25_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative25/wish_demo.py run <model folder>
#   python3 pipeline/creative25/wish_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative25_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
TRIES = 10
BASE = "Write a short WhatsApp birthday wish (3 lines) for my grandmother, who turns 80 today."
ASKS = {
    "bare": BASE,
    "details": BASE + " Use these two real details: she taught me to ride a bicycle when I was 8, and her pulihora is the "
                      "best in the family. Don't add any other memories.",
}
STOCK = ["filled with", "cherish", "blessed", "blessing", "joy", "warmth", "may your", "wonderful", "special day",
         "heartfelt", "laughter", "love and", "memories"]
HAND = {}  # (ask, try): {"made_up": bool, "specific": bool, "note": str}, after reading every reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def auto(ask, reply):
    r = reply.lower()
    out = {"stock": [p for p in STOCK if p in r]}
    if ask == "details":
        out["both"] = bool(re.search(r"bicycle|\bcycle|bike", r)) and "pulihora" in r
    return out


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
        "asks": ASKS, "stock_phrases": STOCK, "rows": []}
    done = {(r["ask"], r["try"]) for r in res["rows"]}
    for ask, text in ASKS.items():
        for k in range(1, TRIES + 1):
            if (ask, k) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=160, seed=k)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"ask": ask, "try": k, "reply": reply, "auto": auto(ask, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(ask, k, auto(ask, reply), reply[:160].replace("\n", " "), flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for r in res["rows"]:
        r["hand"] = HAND.get((r["ask"], r["try"]), {})
    (OUT / "7B.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    for ask in ASKS:
        rows = [r for r in res["rows"] if r["ask"] == ask]
        n = len(rows)
        any_stock = sum(1 for r in rows if r["auto"]["stock"])
        avg = sum(len(r["auto"]["stock"]) for r in rows) / max(1, n)
        line = f"{ask}: {n} replies; with a stock phrase {any_stock}/{n}; stock phrases a reply {avg:.1f}"
        if ask == "details":
            line += f"; both details {sum(1 for r in rows if r['auto'].get('both'))}/{n}"
            line += f"; made-up memory (hand) {sum(1 for r in rows if r['hand'].get('made_up'))}/{n}"
        else:
            line += f"; anything specific (hand) {sum(1 for r in rows if r['hand'].get('specific'))}/{n}"
        print(line)


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
