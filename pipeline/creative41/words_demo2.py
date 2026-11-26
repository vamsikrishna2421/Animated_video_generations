# Creative 41 follow-up (written and committed before it ran). words_demo.py: asked for 150 words, the AI wrote 102-128
# (0/10 within 135-165); "count your words, exactly 150" 2/10; "10 sentences of about 15 words" 62-101 words. The fix a
# student can do: count the words yourself (any word counter) and tell the AI the real number.
#   feedback: for each of the 10 "plain" answers, a second turn in the same chat: "Your answer has N words. I need 150
#             words. Rewrite it to 150 words." (N = our count). Counted the same way.
# Same model and settings as words_demo.py (seeds 1-10). Read by hand afterwards.
#   LLAMA=/tmp/claude-0/llbuild/bin/llama LLAMA_CACHE=/tmp/claude-0/llama-cache python3 pipeline/creative41/words_demo2.py
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/creative41"))
import words_demo as w  # noqa: E402

FOLLOW = "Your answer has {n} words. I need 150 words. Rewrite it to 150 words."
HAND = "told the real count: 102->185, 121->167, 110->181, 128->162, 112->234, 120->174, 127->197, 113->173, 127->205, 122->183; 1/10 within 135-165 (162); it swung from too short to too long (Nov 26, read by hand)"


def chat(messages, seed):
    body = json.dumps({"messages": messages, "temperature": 0.7, "seed": seed, "max_tokens": 500}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{w.PORT}/v1/chat/completions", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def main():
    prev = [r for r in json.loads((w.OUT / "words.json").read_text())["rows"] if r["setup"] == "plain"]
    srv = subprocess.Popen([w.LLAMA, "serve", "-hf", w.MODEL, "--offline", "--port", str(w.PORT), "--host", "127.0.0.1", "-t", "4", "-c", "4096"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        w.up()
        for r in prev:
            msgs = [{"role": "user", "content": w.ASK["plain"]}, {"role": "assistant", "content": r["reply"]},
                    {"role": "user", "content": FOLLOW.format(n=r["words"])}]
            reply = chat(msgs, r["seed"])
            n = w.words(reply)
            rows.append({"setup": "feedback", "seed": r["seed"], "before": r["words"], "words": n, "within": 135 <= n <= 165, "reply": reply})
            print("feedback", r["seed"], r["words"], "->", n, "|", reply[:70].replace("\n", " "), flush=True)
            (w.OUT / "words2.json").write_text(json.dumps({"follow": FOLLOW, "rows": rows}, indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    print("DONE")


if __name__ == "__main__":
    main()
