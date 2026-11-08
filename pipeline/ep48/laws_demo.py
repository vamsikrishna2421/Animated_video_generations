# EP48 demo, "the law the AI hasn't heard of" (written and committed before it ran): AI laws through the shop AI. A chat
# AI learns the world up to its training date; laws keep changing. A small free AI, offline, asked about AI rules whose
# answers we know as of Nov 2026 (checked against the rules' own text and 2+ law-firm summaries; see the script file):
#   label : "In India, must AI-generated videos posted on social media carry a label saying they are AI-generated?
#            Answer YES or NO first, then one sentence."  (10 asks)  -> right: YES (IT Amendment Rules 2026, in force
#            20 Feb 2026)
#   emo   : "Under the EU AI Act, is it banned to use AI to recognise employees' emotions at work? Answer YES or NO first,
#            then one sentence."  (5 asks)  -> right: YES (prohibited since 2 Feb 2025)
#   hours : "In India, within how many hours must a social media platform take down unlawful content after a court order
#            or a government notice? One sentence."  (5 asks)  -> right: 3 hours (same 2026 rules; it was 36 before)
#   date  : "Under the EU AI Act, from what date do the rules for high-risk AI systems such as hiring tools apply? One
#            sentence."  (5 asks)  -> right: 2 December 2027 (the 2026 Digital Omnibus; it was 2 August 2026 before)
# Scored, as fixed before the run: label: right only if it says YES; emo: right only if YES; hours: right only if it
# gives 3 hours (36 = out of date); date: right only if it gives December 2027 (August 2026 = out of date). Every reply read by hand
# (HAND below wins; the hand read goes into the result file).
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, max 120 tokens, a fresh chat each time, generated offline (EP38's check).
# Writes series/scripts/ep48_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/ep48/laws_demo.py run <model folder>
#   python3 pipeline/ep48/laws_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep48_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
ASKS = {
    "label": ("In India, must AI-generated videos posted on social media carry a label saying they are AI-generated? "
              "Answer YES or NO first, then one sentence.", 10),
    "emo": ("Under the EU AI Act, is it banned to use AI to recognise employees' emotions at work? Answer YES or NO first, "
            "then one sentence.", 5),
    "hours": ("In India, within how many hours must a social media platform take down unlawful content after a court "
              "order or a government notice? One sentence.", 5),
    "date": ("Under the EU AI Act, from what date do the rules for high-risk AI systems such as hiring tools apply? "
             "One sentence.", 5),
}
HAND = {  # (ask, try): (right?, note), after reading every reply by hand; the rest read as the automatic score
    ("label", 4): (True, "says YES (right by the rule fixed before the run), then calls a label only 'advisable'"),
    ("label", 10): (False, "NO, 'unless specified by local regulations or social media platforms'"),
    ("emo", 2): (False, "NO, 'could be subject to restrictions'"),
    ("date", 2): (False, "'February 7, 2024': a date that was never right"),
}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def auto(ask, reply):
    r = reply.strip().lower()
    if ask in ("label", "emo"):
        return r.startswith("yes")
    if ask == "hours":
        return bool(re.search(r"\b(3|three)[ -]hours?\b", r))
    if ask == "date":
        return "2027" in r and "dec" in r
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
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 120 tokens",
        "asks": {k: v[0] for k, v in ASKS.items()}, "rows": []}
    done = {(r["ask"], r["try"]) for r in res["rows"]}
    for ask, (text, n) in ASKS.items():
        for k in range(1, n + 1):
            if (ask, k) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=120, seed=k)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"ask": ask, "try": k, "reply": reply, "auto_right": auto(ask, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(ask, k, auto(ask, reply), reply[:120].replace("\n", " "), flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for r in res["rows"]:
        h = HAND.get((r["ask"], r["try"]))
        r["hand"] = {"right": h[0], "note": h[1]} if h else {"right": r["auto_right"]}
    (OUT / "7B.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    for ask in ASKS:
        rows = [r for r in res["rows"] if r["ask"] == ask]
        print(ask, f"{sum(1 for r in rows if r['hand']['right'])}/{len(rows)} right")


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
