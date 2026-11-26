# HOW TO 06 real run (written and committed before it ran): a free open-weight LLM on a laptop-class CPU with llama.cpp.
# The model: Qwen2.5-1.5B-Instruct, 4-bit (Q4_K_M, 1.12 GB, Apache 2.0), fetched by llama.cpp itself with -hf.
#   1. `llama serve -hf Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M --port 8090`: the first start downloads the model (timed).
#   2. Four questions a student or a shop would ask, one fresh chat each, temperature 0.2, seed 1, through the server's
#      OpenAI-style endpoint; the server's own timings give tokens a second; words a second are counted on the reply.
#   3. Peak RAM: the server process's VmHWM from /proc.
#   4. A second start with the model already downloaded (timed): what a viewer sees every day after the first.
# Every reply is read by hand afterwards (HAND). This machine: 4 CPU cores, no graphics card (like a basic laptop).
#   LLAMA=/dev/shm/llbuild/bin/llama LLAMA_CACHE=/dev/shm/llama-cache python3 pipeline/howto06/run_demo.py
import json
import os
import re
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/howto06_demo"
LLAMA = os.environ.get("LLAMA", "llama")
MODEL = "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"
PORT = 8090
QUESTIONS = {
    "leave": "Write a 2-line leave message to my manager. I have fever today and will be back tomorrow.",
    "emi": "Explain what a loan EMI is, in 3 simple lines, for a college student.",
    "maths": "What is 23 multiplied by 47? Give only the number.",
    "telugu": "Introduce yourself in Telugu, in 2 short lines.",
}
HAND = {   # by hand, Nov 26
    "leave": "good: a polite 3-line message, the facts kept",
    "emi": "right: Equated Monthly Installment, principal plus interest; fine for a student",
    "maths": "right: 1081",
    "telugu": "useless: grammatical-looking Telugu that means nothing ('we should research questions more'), repeated; it does not introduce itself",
}


def up(timeout):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as r:
                if json.loads(r.read()).get("status") == "ok":
                    return time.time() - t0
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("server did not come up")


def ask(q):
    body = json.dumps({"messages": [{"role": "user", "content": q}], "temperature": 0.2, "seed": 1, "max_tokens": 200}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body, headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=600) as r:
        d = json.loads(r.read())
    wall = time.time() - t0
    text = d["choices"][0]["message"]["content"]
    tm = d.get("timings", {})
    return {"reply": text, "wall_s": round(wall, 2), "tokens": tm.get("predicted_n"), "tok_per_s": tm.get("predicted_per_second"),
            "prompt_tok_per_s": tm.get("prompt_per_second"), "words": len(re.findall(r"\S+", text)),
            "words_per_s": round(len(re.findall(r"\S+", text)) / max(0.01, (tm.get("predicted_ms") or wall * 1000) / 1000), 1)}


def peak_mb(pid):
    for line in Path(f"/proc/{pid}/status").read_text().splitlines():
        if line.startswith("VmHWM"):
            return round(int(line.split()[1]) / 1024)


def serve(log):
    return subprocess.Popen([LLAMA, "serve", "-hf", MODEL, "--port", str(PORT), "--host", "127.0.0.1", "-t", "4"],
                            stdout=log, stderr=subprocess.STDOUT)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {"model": MODEL, "machine": "4 CPU cores, no graphics card", "cpu": subprocess.run(["sh", "-c", "grep -m1 'model name' /proc/cpuinfo"], capture_output=True, text=True).stdout.strip(),
           "llama_version": subprocess.run([LLAMA, "version"], capture_output=True, text=True).stdout.strip()}
    with open(OUT / "serve_first.log", "w") as log:
        t0 = time.time()
        p = serve(log)
        try:
            res["first_start_s"] = round(up(3600) + 0, 1)
            res["first_start_wall_s"] = round(time.time() - t0, 1)
            res["answers"] = {}
            for k, q in QUESTIONS.items():
                res["answers"][k] = {"question": q, **ask(q)}
                print(k, res["answers"][k]["tok_per_s"], "|", res["answers"][k]["reply"][:100].replace("\n", " "), flush=True)
            res["peak_ram_mb"] = peak_mb(p.pid)
        finally:
            p.terminate()
            p.wait(timeout=30)
    with open(OUT / "serve_second.log", "w") as log:
        t0 = time.time()
        p = serve(log)
        try:
            up(600)
            res["second_start_s"] = round(time.time() - t0, 1)
        finally:
            p.terminate()
            p.wait(timeout=30)
    cache = Path(os.environ.get("LLAMA_CACHE", str(Path.home() / ".cache/llama.cpp")))
    res["model_files"] = {str(f.relative_to(cache)): f.stat().st_size for f in cache.rglob("*.gguf")}
    (OUT / "run.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps({k: v for k, v in res.items() if k != "answers"}, indent=1))
    print("DONE")


if __name__ == "__main__":
    main()
