# Creative 41 test (written and committed before it ran): ask a small free AI for a 150-word school answer; how many
# words does it write? One made-up Class 8 question, three ways of asking, 10 fresh chats each (seeds 1-10, temperature
# 0.7), every reply counted the way a teacher counts (words split on spaces; numbers and hyphenated words count as one).
#   plain:    "Write a 150-word answer for a Class 8 exam: Why should we save water?"
#   count:    the same, plus "Count your words and make sure the answer is exactly 150 words."
#   sentences: "... in 10 sentences of about 15 words each" (a length you can see: sentences, not a word total)
# "Within the limit" = 135-165 words (10%). Qwen2.5-7B-Instruct (4-bit Q4_K_M, llama.cpp), on our computer, through
# `llama serve`'s chat endpoint. Read by hand afterwards (HAND).
#   LLAMA=/tmp/claude-0/llbuild/bin/llama LLAMA_CACHE=/tmp/claude-0/llama-cache python3 pipeline/creative41/words_demo.py
import json
import os
import re
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative41_demo"
LLAMA = os.environ.get("LLAMA", "llama")
MODEL = "Qwen/Qwen2.5-7B-Instruct-GGUF:Q4_K_M"
PORT = 8093
Q = "Why should we save water?"
ASK = {
    "plain": f"Write a 150-word answer for a Class 8 exam: {Q}",
    "count": f"Write a 150-word answer for a Class 8 exam: {Q} Count your words and make sure the answer is exactly 150 words.",
    "sentences": f"Write an answer for a Class 8 exam in 10 sentences of about 15 words each: {Q}",
}
HAND = {   # by hand, Nov 26: every reply is an on-topic answer; none states a word count
    "plain": "102, 121, 110, 128, 112, 120, 127, 113, 127, 122 words: 0/10 within 135-165, all short (mean 118)",
    "count": "119, 123, 125, 126, 140, 104, 130, 107, 125, 146: 2/10 within (140, 146), none says how many words it wrote",
    "sentences": "85, 67, 81, 101, 62, 71, 72, 90, 74, 8 words; 10 sentences in 8/10 (one 9, one a single 8-word sentence): the sentences came out about half the asked length",
}


def words(t):
    t = re.sub(r"[*#_>`]", " ", t)   # markdown marks are not words
    return len([w for w in t.split() if re.search(r"[A-Za-z0-9]", w)])


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


def ask(q, seed):
    body = json.dumps({"messages": [{"role": "user", "content": q}], "temperature": 0.7, "seed": seed, "max_tokens": 500}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    srv = subprocess.Popen([LLAMA, "serve", "-hf", MODEL, "--offline", "--port", str(PORT), "--host", "127.0.0.1", "-t", "4", "-c", "4096"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        up()
        for setup, q in ASK.items():
            for seed in range(1, 11):
                reply = ask(q, seed)
                n = words(reply)
                rows.append({"setup": setup, "seed": seed, "words": n, "within": 135 <= n <= 165,
                             "sentences": len(re.findall(r"[.!?](\s|$)", reply)), "reply": reply})
                print(setup, seed, n, "|", reply[:80].replace("\n", " "), flush=True)
                (OUT / "words.json").write_text(json.dumps({"model": MODEL, "ask": ASK, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    print("DONE")


if __name__ == "__main__":
    main()
