# Creative 16 demo, "the cake message" (written and committed before it ran): a chat AI reads text in chunks (tokens),
# not letters, so it can't see how many letters it wrote. A small free AI, offline, ten replies each way:
#   write : "Write a message for my father's 60th birthday cake. The cake is small: it fits only 15 letters, so the message
#            must be 15 letters or fewer (spaces don't count). Reply with just the message."
#   count : "How many letters are in "HAPPY 60TH BIRTHDAY NANNA"? Don't count spaces. Reply with just the number."
#            (the truth: 22 characters without spaces, digits included; 20 if digits don't count)
#   spell : "Spell "HAPPY 60TH BIRTHDAY NANNA" one character per line, numbered, skipping spaces. Then give the total."
#            (the fix people try: does writing it out make the count right?)
# Scored automatically, then every reply read by hand (HAND below wins):
#   write : the message's characters without spaces (letters, digits, punctuation, emoji each count 1); "fits" = 15 or fewer
#   count : the first number in the reply; right = 22 (20 also accepted, if it says digits aren't letters)
#   spell : the total it gives; right = 22; and whether its numbered list itself is right (every character, in order)
# Brain: Qwen's own 4-bit GGUF (q4_k_m) of Qwen2.5-7B-Instruct (EP42's), llama.cpp, 4 threads, temperature 0.7, top_p 0.9,
# seed = try number, generated offline (a new, empty network namespace, EP38's check).
# Writes series/scripts/creative16_demo/7B.json.
#   HF_HUB_CACHE=/dev/shm/hf unshare -rn python3 pipeline/creative16/cake_demo.py run <model folder>
#   python3 pipeline/creative16/cake_demo.py --summary
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative16_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
MSG = "HAPPY 60TH BIRTHDAY NANNA"
WAYS = {
    "write": ("Write a message for my father's 60th birthday cake. The cake is small: it fits only 15 letters, so the message "
              "must be 15 letters or fewer (spaces don't count). Reply with just the message."),
    "count": f"How many letters are in \"{MSG}\"? Don't count spaces. Reply with just the number.",
    "spell": f"Spell \"{MSG}\" one character per line, numbered, skipping spaces. Then give the total.",
}
TRUTH = len(MSG.replace(" ", ""))   # 22
TRIES = 10
HAND = {}  # (way, try): {"value": ..., "ok": bool, "note": str} after reading the reply by hand


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def message(reply):
    """The cake message: the first non-empty line, without quotes or a label."""
    line = next((l for l in reply.splitlines() if l.strip()), "")
    line = re.sub(r'^(message|cake message)\s*:\s*', "", line.strip(), flags=re.I)
    return line.strip().strip('"“”*')


def score(way, reply):
    if way == "write":
        m = message(reply)
        n = len(re.sub(r"\s", "", m))
        return {"message": m, "chars": n, "fits": n <= 15}
    nums = [int(x) for x in re.findall(r"\b\d+\b", reply)]
    if way == "count":
        v = nums[0] if nums else None
        return {"value": v, "ok": v in (TRUTH, 20)}
    tot = re.findall(r"total[^\d]{0,40}(\d+)", reply, flags=re.I)
    v = int(tot[-1]) if tot else (nums[-1] if nums else None)
    items = re.findall(r"^\s*(\d+)[.):]?\s+(\S)\s*$", reply, flags=re.M)
    listed = "".join(ch for _, ch in items)
    return {"value": v, "ok": v == TRUTH, "list": listed, "list_ok": listed.upper() == MSG.replace(" ", "")}


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
        "prompts": WAYS, "truth": TRUTH, "rows": []}
    done = {(r["way"], r["try"]) for r in res["rows"]}
    for way, text in WAYS.items():
        for n in range(1, TRIES + 1):
            if (way, n) in done:
                continue
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": text}], temperature=0.7, top_p=0.9, max_tokens=400, seed=n)
            reply = out["choices"][0]["message"]["content"].strip()
            res["rows"].append({"way": way, "try": n, "reply": reply, "score": score(way, reply), "seconds": round(time.time() - t0, 1)})
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(way, n, res["rows"][-1]["score"], flush=True)
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summary():
    res = json.loads((OUT / "7B.json").read_text())
    for way in WAYS:
        rows = [dict(r["score"], **HAND.get((way, r["try"]), {})) for r in res["rows"] if r["way"] == way]
        if way == "write":
            print(way, "fits", sum(r["fits"] for r in rows), "of", len(rows), "chars", [r["chars"] for r in rows])
        else:
            print(way, "right", sum(bool(r["ok"]) for r in rows), "of", len(rows), "values", [r["value"] for r in rows])


if __name__ == "__main__":
    if sys.argv[1] == "run":
        offline_run(sys.argv[2])
    else:
        summary()
