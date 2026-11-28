# Creative 43 test 2 (written and committed before it ran, after the script review asked "what if I have no answer
# key?"): the same profit question and the same two answers as grade_demo.py, with a third way of asking, no key:
#   solve: "First solve this question yourself, step by step. Then compare your answer with my child's final answer and
#           give marks out of 10. End your reply with 'Marks: N/10'."
# 10 fresh chats each (seeds 1-10, temperature 0.7), same model and server; up to 500 tokens (it works the sum first).
# Results go into grades.json under "solve|q1|...". Every reply read by hand afterwards.
#   LLAMA=/tmp/claude-0/llbuild/bin/llama LLAMA_CACHE=/tmp/claude-0/llama-cache python3 pipeline/creative43/grade_demo2.py
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import grade_demo as g  # noqa: E402


def prompt(q, ans):
    return ("First solve this question yourself, step by step. Then compare your answer with my child's final answer and "
            "give marks out of 10. End your reply with 'Marks: N/10'.\n\nQuestion: " + q["question"] + "\n\nMy child's answer: " + ans)


def ask(text, seed):
    body = json.dumps({"messages": [{"role": "user", "content": text}], "temperature": 0.7, "seed": seed,
                       "max_tokens": 500}).encode()
    req = g.urllib.request.Request(f"http://127.0.0.1:{g.PORT}/v1/chat/completions", data=body,
                                   headers={"Content-Type": "application/json"})
    with g.urllib.request.urlopen(req, timeout=1200) as r:
        return json.loads(r.read())["choices"][0]["message"]["content"]


def marks(reply):   # the last "N/10" in the reply (it ends with the marks)
    m = re.findall(r"(\d+(?:\.\d+)?)\s*/\s*10", reply)
    return float(m[-1]) if m else None


def main():
    res_path = g.OUT / "grades.json"
    res = json.loads(res_path.read_text())
    srv = subprocess.Popen([g.LLAMA, "serve", "-hf", g.MODEL, "--offline", "--port", str(g.PORT), "-c", "4096"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        g.up()
        q = g.Q["q1"]
        for kind in ("long_wrong", "short_right"):
            tag = f"solve|q1|{kind}"
            rows = res.setdefault(tag, {})
            for s in g.SEEDS:
                if str(s) in rows:
                    continue
                r = ask(prompt(q, q[kind]), s)
                rows[str(s)] = {"marks": marks(r), "reply": r}
                res_path.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            ms = [v["marks"] for v in rows.values() if v["marks"] is not None]
            print(tag, "marks", ms, "avg", round(sum(ms) / len(ms), 1) if ms else None, flush=True)
    finally:
        srv.terminate()
        srv.wait()


if __name__ == "__main__":
    main()
