# Creative 10 demo (asking an AI about a blood test): one lab value, asked to a small free AI (Qwen2.5-7B-Instruct,
# Qwen's own 4-bit GGUF, llama.cpp on this machine's CPU) in a network namespace with no internet. Two ways, ten replies
# each, temperature 0.7, the same seed per try:
#   plain : "HbA1c 7.2 meaning"                      (the four words Thathayya types)
#   line  : the copy card's line, then the value
# and one reply to "laddu sugar patient" (the loop: he types three words again).
# Per reply: words, a reading grade (Flesch-Kincaid, vowel-group syllables), the complications it names, jargon, whether it
# gives questions for the doctor. Every reply is also read by hand (HAND below); the hand reading wins.
# Writes series/scripts/creative10_demo/results.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative10/report_demo.py           (downloads, then reruns itself offline)
#   python3 pipeline/creative10/report_demo.py --summary                            (the card's numbers, after the hand check)
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative10_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
VALUE = "HbA1c 7.2%"
PLAIN = "HbA1c 7.2 meaning"
LINE = "Explain this to my 72-year-old grandfather in simple words. Then give 3 questions to ask his doctor."
TRIES = 10
LADDU = "laddu sugar patient"
# complication -> regex (what a scared reader takes away)
SCARY = {
    "amputation": r"amputat",
    "blindness": r"\bblind|vision loss|loss of vision|lose (?:his |your )?(?:eye)?sight|retinopathy",
    "kidney": r"kidney (?:failure|disease|damage|problems)|nephropathy",
    "heart": r"heart (?:attack|disease|problems)|cardiovascular",
    "stroke": r"\bstroke",
    "nerves": r"nerve damage|neuropathy|nerve problems",
    "death": r"\bdeath\b|\bdie\b|fatal|life-threatening",
}
JARGON = r"glycated|glycosylated|hemoglobin|haemoglobin|glyc(?:a)?emic|hyperglyc|mg/dl|mmol|insulin resistance|erythrocyte"


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def grade(text):
    words = re.findall(r"[A-Za-z][A-Za-z'-]*", text)
    sents = max(1, len(re.findall(r"[.!?]+(?:\s|$)", text)) + text.count("\n- ") + len(re.findall(r"\n\d+\.", text)))
    if not words:
        return 0.0
    return round(0.39 * len(words) / sents + 11.8 * sum(map(syllables, words)) / len(words) - 15.59, 1)


def measure(text):
    low = text.lower()
    return {"words": len(text.split()), "grade": grade(text),
            "scary": [k for k, rx in SCARY.items() if re.search(rx, low)],
            "jargon": sorted(set(m.group(0) for m in re.finditer(JARGON, low))),
            "doctor_questions": len(re.findall(r"\?", text)) >= 3 and "doctor" in low}


def chat(llm, prompt, seed, max_tokens=700):
    out = llm.create_chat_completion([{"role": "user", "content": prompt}], temperature=0.7, top_p=0.9,
                                     max_tokens=max_tokens, seed=seed)
    ch = out["choices"][0]
    return ch["message"]["content"].strip(), ch.get("finish_reason")


def offline_run(folder):
    from llama_cpp import Llama
    import socket
    try:
        socket.create_connection(("1.1.1.1", 443), timeout=3).close()
        sys.exit("network reachable: not an offline run")
    except OSError as e:
        net = f"no network ({e})"
    parts = sorted(Path(folder).glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=4096, verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "results.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} (q4_k_m)", "network": net, "prompts": {"plain": PLAIN, "line": f"{LINE}\n\n{VALUE}"}, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for n in range(1, TRIES + 1):
        for way, prompt in (("plain", PLAIN), ("line", f"{LINE}\n\n{VALUE}")):
            if (way, n) in done:
                continue
            t0 = time.time()
            text, fin = chat(llm, prompt, seed=n)
            row = {"way": way, "try": n, "reply": text, "finish": fin, "auto": measure(text), "seconds": round(time.time() - t0, 1)}
            res["rows"].append(row)
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, row["auto"], row["seconds"], flush=True)
    if "laddu" not in res:   # the loop's phone: his three words about laddus, one reply (seed 1)
        text, fin = chat(llm, LADDU, seed=1)
        res["laddu"] = {"prompt": LADDU, "reply": text, "finish": fin, "auto": measure(text)}
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print("laddu", res["laddu"]["auto"], flush=True)


# Read by hand (every reply in results.json): {(way, try): {key: value}}; keys as in "auto". The number check matched
# every reply: all ten three-word replies open on "glycated hemoglobin" (with ADA targets, "hypoglycemia", "mmol/mol",
# "comorbidities" or "a shorter life expectancy" in most) and say "over the past 2 to 3 months"; none asks anything of the
# doctor. With the line, none uses those words ("blood sugar (glucose)" in tries 3 and 7 is a gloss, not doctor-talk) and
# all ten end on three numbered questions for the doctor, the first always "What does an HbA1c of 7.2% mean for my
# grandfather's health?".
HAND = {}


def summarize():
    dest = OUT / "results.json"
    res = json.loads(dest.read_text())
    out = {}
    for way in ("plain", "line"):
        rows = [{**r["auto"], **HAND.get((way, r["try"]), {})} for r in res["rows"] if r["way"] == way]
        words = sorted(r["words"] for r in rows)
        out[way] = {"n": len(rows), "median_words": words[len(words) // 2] if words else 0,
                    "median_grade": sorted(r["grade"] for r in rows)[len(rows) // 2] if rows else 0,
                    "with_complications": sum(bool(r["scary"]) for r in rows),
                    "complications": {k: sum(k in r["scary"] for r in rows) for k in SCARY},
                    "with_jargon": sum(bool(r["jargon"]) for r in rows),
                    "doctor_questions": sum(r["doctor_questions"] for r in rows)}
    res["summary"] = out
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    if sys.argv[1:2] == ["--summary"]:
        summarize()
    elif sys.argv[1:2] == ["--offline"]:
        offline_run(sys.argv[2])
    else:
        from huggingface_hub import snapshot_download
        folder = snapshot_download(REPO, allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", folder], check=True)
