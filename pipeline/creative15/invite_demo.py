# Creative 15 demo, "the wedding card" (written and committed before it ran): an AI translating a Telugu wedding
# invitation into English for relatives abroad. Telugu names are often also words (స్వప్న = "dream", కళ్యాణ్ is
# also "wedding", శాంతి = "peace"), and the card carries a date, a day, a time and a hall: the parts that matter.
# A small free AI, offline, ten replies each way:
#   plain : "Translate this wedding invitation into English:" + the card
#   rule  : the same + "Keep every name, date, time and place exactly as written. Write the names in English letters;
#            don't translate them."
#   back  : the plain reply of the same try, translated back into Telugu ("Translate this into Telugu:"), to see if a
#           back-translation shows the mistake to someone who reads only Telugu
# Scored, as fixed before the run (automatic checks, then every reply read by hand; HAND below wins):
#   names  : Swapna, Kalyan, Sarojini and Ramana each appear in English letters (a name rendered as its meaning, like
#            "Dream" or "Peace", or left out, is a miss)
#   date   : 20 November 2026 (any common format) and Friday
#   time   : 10:30 in the morning (10:30 AM / 10:30 a.m. / morning); PM or night or a different time is a miss
#   place  : Sri Lakshmi Kalyana Mandapam (or Kalyana Mandapam / wedding hall named Sri Lakshmi) and Kukatpally
#   all    : every check right
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative15_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative15/invite_demo.py run <model folder>
#   python3 pipeline/creative15/invite_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative15_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
CARD = ("శ్రీ వేంకటేశ్వర స్వామి కృపతో, మా అమ్మాయి చి.ల.సౌ. స్వప్న వివాహం చి. కళ్యాణ్ తో, 20-11-2026 శుక్రవారం "
        "ఉదయం 10:30 గంటలకు, శ్రీ లక్ష్మి కళ్యాణ మండపం, కూకట్ పల్లి, హైదరాబాద్ లో జరుగును. మీరు తప్పక విచ్చేసి "
        "వధూవరులను ఆశీర్వదించగలరు. - సరోజినీ, రమణ")
PLAIN = "Translate this wedding invitation into English:\n\n" + CARD
RULE = PLAIN + ("\n\nKeep every name, date, time and place exactly as written. Write the names in English letters; "
                "don't translate them.")
BACK = "Translate this into Telugu:\n\n{text}"
TRIES = 10
HAND = {}  # (way, try): {check: True/False, "note": ...} after reading the reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def score(text):
    t = text.lower()
    names = {n: bool(re.search(rf"\b{n}", t)) for n in ("swapna", "kalyan", "sarojini", "ramana")}
    date = bool(re.search(r"\b20(th)?[\s\-/.]*(nov|11)", t) or re.search(r"nov\w*\s+20", t)) and "2026" in t
    day = "friday" in t
    time_ok = bool(re.search(r"10[:.]30\s*(a\.?m|in the morning)", t) or ("10:30" in t and "morning" in t)) and not re.search(r"10[:.]30\s*p\.?m", t)
    place = ("kalyana mandapam" in t or ("lakshmi" in t and ("hall" in t or "mandapam" in t))) and "kukatpally" in t
    s = {"names": all(names.values()), "missing_names": [n for n, ok in names.items() if not ok], "date": date and day,
         "time": time_ok, "place": place}
    s["all"] = s["names"] and s["date"] and s["time"] and s["place"]
    return s


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
        "model": f"{REPO} (q4_k_m)", "network": net, "settings": "temperature 0.7, top_p 0.9, seed = try number, max 400 tokens",
        "card": CARD, "prompts": {"plain": PLAIN, "rule": RULE, "back": BACK}, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}

    def ask(text, n):
        out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=400, seed=n)
        return out["choices"][0]["message"]["content"].strip()
    for way in ("plain", "rule", "back"):
        for n in range(1, TRIES + 1):
            if (way, n) in done:
                continue
            t0 = time.time()
            if way == "back":
                src = next(r["reply"] for r in res["rows"] if r["way"] == "plain" and r["try"] == n)
                reply = ask(BACK.format(text=src), n)
                row = {"way": way, "try": n, "reply": reply}
            else:
                reply = ask(PLAIN if way == "plain" else RULE, n)
                row = {"way": way, "try": n, "reply": reply, "score": score(reply)}
            row["seconds"] = round(time.time() - t0, 1)
            res["rows"].append(row)
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, row.get("score", {}).get("all"), flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for way in ("plain", "rule"):
        rows = [r for r in res["rows"] if r["way"] == way]
        sc = [dict(r["score"], **HAND.get((way, r["try"]), {})) for r in rows]
        print(way, len(rows), {k: sum(1 for s in sc if s.get(k)) for k in ("names", "date", "time", "place", "all")})
        miss = {}
        for s in sc:
            for n in s.get("missing_names", []):
                miss[n] = miss.get(n, 0) + 1
        print("   names missed:", miss)


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
