# Creative 20 demo (written and committed before it ran): asked the day of the week for a date, does a chat AI count or
# guess? 20 dates from December 2026 to June 2027 (after the model's training, so nothing to remember), the right day from
# Python's calendar. Two ways, one try per date:
#   plain  : "What day of the week is <date>? Answer with just the day."
#   counted: the same, plus "Work it out step by step from 1 January 2026, which was a Thursday. End with: Answer: <day>"
# and the family's date (Wednesday 16 December 2026) asked the plain way 10 times (seeds 1-10).
# Added after the plain answers came in (committed before these ran): the plain way got 16 December right, and called
# 8 March 2027 (a Monday) a Sunday, so the reel's date is 8 March 2027: asked the plain way 9 more times (seeds 2-10).
# Scored automatically (the last weekday name in the reply), then every reply read by hand (HAND below wins).
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct, llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# max 500 tokens, offline (a new, empty network namespace, EP38's check). Writes series/scripts/creative20_demo/days_7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative20/weekday_demo.py run <model folder>
#   python3 pipeline/creative20/weekday_demo.py --summary
import datetime as dt
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative20_demo"
PATTERN = "*q4_k_m*.gguf"
DATES = [dt.date(2026, 12, 16), dt.date(2026, 12, 25), dt.date(2027, 1, 9), dt.date(2027, 1, 26), dt.date(2027, 2, 3),
         dt.date(2027, 2, 14), dt.date(2027, 2, 27), dt.date(2027, 3, 8), dt.date(2027, 3, 21), dt.date(2027, 3, 30),
         dt.date(2027, 4, 4), dt.date(2027, 4, 17), dt.date(2027, 4, 29), dt.date(2027, 5, 6), dt.date(2027, 5, 15),
         dt.date(2027, 5, 23), dt.date(2027, 5, 31), dt.date(2027, 6, 7), dt.date(2027, 6, 19), dt.date(2027, 6, 28)]
FAMILY = dt.date(2026, 12, 16)
MARCH8 = dt.date(2027, 3, 8)
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
assert DAYS[dt.date(2026, 1, 1).weekday()] == "Thursday"


def say(d):
    return f"{d.day} {d.strftime('%B')} {d.year}"


def ask(d, way):
    q = f"What day of the week is {say(d)}?"
    if way == "plain":
        return q + " Answer with just the day."
    return q + " Work it out step by step from 1 January 2026, which was a Thursday. End with: Answer: <day>"


HAND = {}  # (way, date iso, seed): {"day": str|None, "note": str} after reading the reply by hand


def picked(reply):
    found = re.findall(r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", reply.lower())
    return found[-1].capitalize() if found else None


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def offline_run(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=2048, n_threads=4, n_threads_batch=4, verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "days_7B.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": "Qwen/Qwen2.5-7B-Instruct-GGUF (q4_k_m)", "network": net,
        "settings": "temperature 0.7, top_p 0.9, max 500 tokens, a fresh chat per question", "rows": []}
    jobs = [("plain", d, 1) for d in DATES] + [("counted", d, 1) for d in DATES] + [("plain", FAMILY, s) for s in range(2, 11)] + [("plain", MARCH8, s) for s in range(2, 11)]
    done = {(r["way"], r["date"], r["seed"]) for r in res["rows"]}
    for way, d, seed in jobs:
        if (way, d.isoformat(), seed) in done:
            continue
        t0 = time.time()
        out = llm.create_chat_completion([{"role": "user", "content": ask(d, way)}], temperature=0.7, top_p=0.9, max_tokens=500, seed=seed)
        reply = out["choices"][0]["message"]["content"].strip()
        truth = DAYS[d.weekday()]
        got = picked(reply)
        res["rows"].append({"way": way, "date": d.isoformat(), "seed": seed, "truth": truth, "reply": reply, "auto_day": got,
                            "auto_right": got == truth, "seconds": round(time.time() - t0, 1)})
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print(way, d, seed, truth, got, flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "days_7B.json").read_text())
    for way in ("plain", "counted"):
        rows = [r for r in res["rows"] if r["way"] == way and r["seed"] == 1]
        right = [HAND.get((way, r["date"], 1), {}).get("day", r["auto_day"]) == r["truth"] for r in rows]
        print(way, f"right {sum(right)} of {len(rows)}")
    fam = [r for r in res["rows"] if r["way"] == "plain" and r["date"] == FAMILY.isoformat()]
    print("16 Dec 2026 (a Wednesday), plain, 10 asks:", [HAND.get(("plain", r["date"], r["seed"]), {}).get("day", r["auto_day"]) for r in fam])
    m8 = [r for r in res["rows"] if r["way"] == "plain" and r["date"] == MARCH8.isoformat()]
    print("8 Mar 2027 (a Monday), plain, 10 asks:", [HAND.get(("plain", r["date"], r["seed"]), {}).get("day", r["auto_day"]) for r in m8])


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
