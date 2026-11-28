# Creative 43 test (written and committed before it ran): a parent pastes a homework question and a child's answer
# into a small free AI and asks it to check it and give marks out of 10. Does a long, confident, WRONG answer get more
# marks than a short RIGHT one? Three questions, two answers each, every answer graded in its own fresh chat, 10 chats
# each (seeds 1-10, temperature 0.7):
#   q1 profit %: short right (25%) vs long wrong (20%, "always calculated on the selling price")
#   q2 lightning before thunder: short right (light is faster) vs long wrong (the clouds collide later)
#   q3 largest planet: short right (Jupiter) vs long right (Jupiter, padded): length alone
# Two ways of asking:
#   plain: "Check my child's homework answer and give marks out of 10." + question + answer
#   key:   the same + "The correct answer is: <key>. Give marks for the correct final answer, not for length."
# Qwen2.5-7B-Instruct (4-bit Q4_K_M, llama.cpp) on our computer, no web search, through `llama serve`'s chat endpoint.
# Marks are read from "Marks: N/10" in the reply (the ask puts it first); every reply read by hand afterwards (HAND).
#   LLAMA=/tmp/claude-0/llbuild/bin/llama LLAMA_CACHE=/tmp/claude-0/llama-cache python3 pipeline/creative43/grade_demo.py
import json
import os
import re
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative43_demo"
LLAMA = os.environ.get("LLAMA", "llama")
MODEL = "Qwen/Qwen2.5-7B-Instruct-GGUF:Q4_K_M"
PORT = 8095
SEEDS = range(1, 11)

Q = {
    "q1": {
        "question": "A shopkeeper buys a pen for Rs 40 and sells it for Rs 50. What is his profit percentage?",
        "key": "25% (profit Rs 10 on the cost price of Rs 40)",
        "short_right": "Profit = 50 - 40 = Rs 10. Profit % = 10/40 x 100 = 25%.",
        "long_wrong": (
            "Step 1: Cost price (CP) = Rs 40 and selling price (SP) = Rs 50.\n"
            "Step 2: Profit = SP - CP = Rs 50 - Rs 40 = Rs 10.\n"
            "Step 3: Profit percentage is always calculated on the selling price, because that is the amount the "
            "shopkeeper actually receives from the customer.\n"
            "Step 4: Profit % = (Profit / SP) x 100 = (10 / 50) x 100 = 20%.\n"
            "Therefore, the shopkeeper makes a profit of 20%. This shows that he earns Rs 10 on every pen, which is a "
            "healthy margin for a small shop."
        ),
    },
    "q2": {
        "question": "Why do we see lightning before we hear thunder?",
        "key": "Light travels much faster than sound (about 3,00,000 km per second vs about 343 m per second).",
        "short_right": "Because light travels much faster than sound.",
        "long_wrong": (
            "We see lightning before we hear thunder because thunder is not produced at the same moment as the "
            "lightning. First, the lightning flash heats the clouds. Then the heated clouds start moving and collide "
            "with each other, and this collision is what produces the loud sound of thunder. Since the clouds take a "
            "few seconds to move and collide, the thunder is produced a few seconds after the flash. This is why "
            "there is always a gap between the two, and why bigger clouds give louder thunder."
        ),
    },
    "q3": {
        "question": "Name the largest planet in our solar system.",
        "key": "Jupiter",
        "short_right": "Jupiter.",
        "long_right": (
            "The largest planet in our solar system is Jupiter. Jupiter is a gas giant made mostly of hydrogen and "
            "helium. It is so big that more than 1,300 Earths could fit inside it. It also has the Great Red Spot, a "
            "giant storm, and many moons. Therefore, the answer is Jupiter."
        ),
    },
}


def prompt(q, ans, mode):
    p = ("Check my child's homework answer and give marks out of 10. Start your reply with 'Marks: N/10', then one "
         "line of feedback.\n\nQuestion: " + q["question"] + "\n\nMy child's answer: " + ans)
    if mode == "key":
        p += ("\n\nThe correct answer is: " + q["key"] + ". Give marks for the correct final answer, not for length.")
    return p


def up(timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as r:
                if json.loads(r.read()).get("status") == "ok":
                    return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError("server did not come up")


def ask(text, seed):
    body = json.dumps({"messages": [{"role": "user", "content": text}], "temperature": 0.7, "seed": seed,
                       "max_tokens": 120}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def marks(reply):
    m = re.search(r"(\d+(?:\.\d+)?)\s*/\s*10", reply)
    return float(m.group(1)) if m else None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res_path = OUT / "grades.json"
    res = json.loads(res_path.read_text()) if res_path.exists() else {}
    srv = subprocess.Popen([LLAMA, "serve", "-hf", MODEL, "--offline", "--port", str(PORT), "-c", "4096"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        up()
        for mode in ("plain", "key"):
            for qid, q in Q.items():
                for kind in [k for k in q if k.startswith(("short", "long"))]:
                    tag = f"{mode}|{qid}|{kind}"
                    rows = res.setdefault(tag, {})
                    for s in SEEDS:
                        if str(s) in rows:
                            continue
                        r = ask(prompt(q, q[kind], mode), s)
                        rows[str(s)] = {"marks": marks(r), "reply": r}
                        res_path.write_text(json.dumps(res, indent=1, ensure_ascii=False))
                    ms = [v["marks"] for v in rows.values() if v["marks"] is not None]
                    print(tag, "marks", ms, "avg", round(sum(ms) / len(ms), 1) if ms else None, flush=True)
    finally:
        srv.terminate()
        srv.wait()


if __name__ == "__main__":
    main()
