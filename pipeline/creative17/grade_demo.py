# Creative 17 demo, "the same answer, two marks" (written and committed before it ran): a chat AI's reply is a sample,
# not a fixed answer: ask it to grade the same answer twice and the mark can change. A small free AI, offline, the same
# Class 9 answer graded ten times each way:
#   plain  : "You are a Class 9 science teacher. Mark this answer out of 10. Reply with just the mark." + the answer
#   rubric : the same, plus a 4-point marking scheme, "mark each point, then give the total"
# The answer (written by us, a decent answer with one slip: it says sound travels at 3,000 m/s; the real figure is about
# 340 m/s in air). The question: "Why do we see lightning before we hear thunder? (10 marks)".
# Scored automatically (the mark out of 10 it gives; for rubric: the total), then every reply read by hand (HAND wins):
#   spread : the lowest and the highest mark across the ten tries, and how many tries gave each mark
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative17_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative17/grade_demo.py run <model folder>
#   python3 pipeline/creative17/grade_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative17_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
QUESTION = "Why do we see lightning before we hear thunder? (10 marks)"
ANSWER = ("Lightning and thunder happen at the same time in the cloud. But light travels much faster than sound. Light "
          "travels at about 3 lakh km per second, but sound travels at only about 3,000 m/s in air. So the light of the "
          "lightning reaches our eyes almost at once, and the sound of the thunder reaches our ears later. For example, if "
          "the thunder comes 3 seconds after the lightning, the lightning was about 1 km away.")
RUBRIC = ("Marking scheme: (a) both happen at the same time: 2 marks; (b) light travels faster than sound: 3 marks; "
          "(c) the speeds: light about 3 x 10^8 m/s, sound about 340 m/s in air: 3 marks; (d) an example or a distance "
          "worked out from the gap: 2 marks.")
BASE = f"You are a Class 9 science teacher. Mark this answer out of 10.\n\nQuestion: {QUESTION}\n\nStudent's answer: {ANSWER}\n\n"
WAYS = {"plain": BASE + "Reply with just the mark.",
        "rubric": BASE + RUBRIC + "\nMark each point (a) to (d), then give the total out of 10 on the last line as: Total: X/10"}
TRIES = 10
HAND = {}  # (way, try): {"mark": float, "note": str} after reading the reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def score(way, reply):
    if way == "rubric":
        m = re.findall(r"total[^\d]{0,20}(\d+(?:\.\d+)?)\s*/\s*10", reply, flags=re.I)
        if m:
            return {"mark": float(m[-1])}
    m = re.findall(r"(\d+(?:\.\d+)?)\s*(?:/|out of)\s*10", reply, flags=re.I) or re.findall(r"\b(\d+(?:\.\d+)?)\b", reply)
    return {"mark": float(m[-1 if way == "rubric" else 0]) if m else None}


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
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 300 tokens",
        "prompts": WAYS, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for n in range(1, TRIES + 1):   # the two ways interleaved, so a stop half-way leaves both with the same tries
        for way, text in WAYS.items():
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=300, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"way": way, "try": n, "reply": reply, "score": score(way, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, res["rows"][-1]["score"], flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for way in WAYS:
        marks = [dict(r["score"], **HAND.get((way, r["try"]), {}))["mark"] for r in res["rows"] if r["way"] == way]
        ok = [m for m in marks if m is not None]
        print(way, len(marks), "replies | marks", marks, "| low", min(ok) if ok else None, "high", max(ok) if ok else None,
              "| counts", dict(sorted(Counter(ok).items())))


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
