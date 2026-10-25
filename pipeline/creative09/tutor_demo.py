# Creative 09 demo (AI as a tutor, not an answer machine): ten Class 7-9 homework problems with known answers, asked
# to a small free AI (Qwen2.5-7B-Instruct, Qwen's own 4-bit GGUF, llama.cpp on this machine's CPU) in a network
# namespace with no internet. Two ways, one reply each, temperature 0.7, the same seed per problem:
#   plain : "Solve: <problem>"
#   teach : "Don't give me the answer. Teach me one question at a time. <problem>"
# Then, in the teach chat, the student pushes back once: "Just tell me the answer." Every reply is saved; whether a reply
# gives the final answer is read by hand (HAND below), with a number check as a first pass. One sample chat (problem 1)
# is played out with correct student answers for the phone screen. Writes series/scripts/creative09_demo/results.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative09/tutor_demo.py           (downloads, then reruns itself offline)
#   python3 pipeline/creative09/tutor_demo.py --summary                            (the card's numbers, after the hand check)
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative09_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
TEACH = "Don't give me the answer. Teach me one question at a time."
PUSH = "Just tell me the answer."
# (problem, the final answer as it would be written, a regex that finds it in a reply)
PROBLEMS = [
    ("Solve for x: 3x + 5 = 20", "x = 5", r"x\s*=\s*5\b"),
    ("A shirt costs Rs 800 and is on a 25% discount. What is the sale price?", "Rs 600", r"\b600\b"),
    ("What is 3/4 + 1/6?", "11/12", r"11\s*/\s*12|\\frac\{11\}\{12\}"),
    ("A rectangle is 12 cm long and 5 cm wide. What is its area?", "60 square cm", r"\b60\b"),
    ("If 4 pens cost Rs 60, how much do 7 pens cost?", "Rs 105", r"\b105\b"),
    ("What is 15% of 240?", "36", r"\b36\b"),
    ("Find the average of 12, 15, 18 and 23.", "17", r"\b17\b"),
    ("A train covers 180 km in 3 hours. What is its speed?", "60 km/h", r"\b60\b"),
    ("Simplify: 2(x + 4) - 3x", "8 - x", r"8\s*-\s*x|-\s*x\s*\+\s*8"),
    ("What is the perimeter of a square with side 9 cm?", "36 cm", r"\b36\b"),
]


def chat(llm, msgs, seed, max_tokens=320):
    out = llm.create_chat_completion(msgs, temperature=0.7, top_p=0.9, max_tokens=max_tokens, seed=seed)
    return out["choices"][0]["message"]["content"].strip()


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
    res = json.loads(dest.read_text()) if dest.exists() else {"model": f"{REPO} (q4_k_m)", "network": net, "rows": []}
    done = {r["n"] for r in res["rows"]}
    for n, (q, ans, rx) in enumerate(PROBLEMS, 1):
        if n in done:
            continue
        t0 = time.time()
        plain = chat(llm, [{"role": "user", "content": f"Solve: {q}"}], seed=n)
        teach_msgs = [{"role": "user", "content": f"{TEACH} {q}"}]
        teach = chat(llm, teach_msgs, seed=n)
        push = chat(llm, teach_msgs + [{"role": "assistant", "content": teach}, {"role": "user", "content": PUSH}], seed=n)
        row = {"n": n, "problem": q, "answer": ans, "plain": plain, "teach": teach, "push": push,
               "auto": {"plain_has_answer": bool(re.search(rx, plain)), "teach_has_answer": bool(re.search(rx, teach)),
                        "teach_asks": teach.rstrip().endswith("?") or "?" in teach[-200:], "push_has_answer": bool(re.search(rx, push))},
               "seconds": round(time.time() - t0, 1)}
        res["rows"].append(row)
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print(n, row["auto"], row["seconds"], flush=True)
    if "sample" not in res:   # problem 1 played out with right answers from the student
        q = PROBLEMS[0][0]
        msgs = [{"role": "user", "content": f"{TEACH} {q}"}]
        turns = []
        for student in ("Subtract 5 from both sides. So 3x = 15.", "Divide both sides by 3. x = 5!"):
            a = chat(llm, msgs, seed=101)
            turns.append({"ai": a})
            msgs += [{"role": "assistant", "content": a}, {"role": "user", "content": student}]
            turns.append({"student": student})
        turns.append({"ai": chat(llm, msgs, seed=101)})
        res["sample"] = turns
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print("sample done", flush=True)


# Read by hand (every reply in results.json): where the number check above was wrong, the hand reading wins.
# {problem: {key: bool}}; keys as in "auto". Push replies that did every step but left the last sum to him (3, 5) or only
# set up the sum (7) did not give the final answer.
HAND = {}


def summarize():
    """The card's numbers, from the hand-checked rows: final answer given (plain, with the line, after one push) and how
    many replies with the line asked him a question."""
    dest = OUT / "results.json"
    res = json.loads(dest.read_text())
    rows = [{**r["auto"], **HAND.get(r["n"], {})} for r in res["rows"]]
    res["hand"] = {r["n"]: {**r["auto"], **HAND.get(r["n"], {})} for r in res["rows"]}
    res["summary"] = {"n": len(rows), "plain_answer": sum(r["plain_has_answer"] for r in rows),
                      "teach_answer": sum(r["teach_has_answer"] for r in rows), "teach_asked": sum(r["teach_asks"] for r in rows),
                      "push_answer": sum(r["push_has_answer"] for r in rows)}
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(res["summary"])


if __name__ == "__main__":
    if sys.argv[1:2] == ["--summary"]:
        summarize()
    elif sys.argv[1:2] == ["--offline"]:
        offline_run(sys.argv[2])
    else:
        from huggingface_hub import snapshot_download
        folder = snapshot_download(REPO, allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", folder], check=True)
