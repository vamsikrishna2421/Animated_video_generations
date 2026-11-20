# EP57 "Deploy your AI app" test (written and committed before it ran). EP51's shop bot (Ravi's kirana price list, the
# same system prompt) has to answer customers 24x7, not only while Suresh's laptop is on. Two ways to put it online:
#   A. run the model yourself on a rented machine (the 7B model + its server), measured here on 4 and on 2 CPU cores
#      (2 = a free 2-vCPU box such as Hugging Face's free CPU Basic);
#   B. a tiny server that only forwards each WhatsApp message to an AI company's API (the brain runs on their side).
#      Its own size is measured here with the 7B server standing in for the API on this machine; its cost is the API's
#      price per token, from OpenAI's pricing page, times the tokens one shop chat really uses (measured in A).
# Measured: model load time, server memory (VmRSS, MB), reply seconds for the same 5 questions (temperature 0, seed 1,
# max 60 tokens), tokens per chat; the tiny server's memory and start time. Writes series/scripts/ep57_demo/deploy.json.
#   HF_HUB_CACHE=/home/user/hfcache python3 pipeline/ep57/deploy_demo.py
import json
import os
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline/ep51"))
import chatbot_demo as bot  # noqa: E402  (SYSTEM: the shop bot's prompt and price list; REPO, PATTERN)

OUT = ROOT / "series/scripts/ep57_demo"
PORT, THIN_PORT = 8771, 8772
QUESTIONS = ["Toor dal 1 kg entha?", "How much is 5 kg sona masoori rice?", "Is curd available?", "Eggs dozen price?",
             "2 kg sugar and 1 litre sunflower oil, what's my total?"]
THIN = r'''
import json, os, sys, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
API, KEY, SYSTEM = os.environ["API_URL"], os.environ["API_KEY"], os.environ["SYSTEM"]
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        msg = json.loads(self.rfile.read(int(self.headers["Content-Length"])))["text"]
        body = json.dumps({"model": "ai", "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": msg}],
                           "temperature": 0, "seed": 1, "max_tokens": 60}).encode()
        req = urllib.request.Request(API, data=body, headers={"Content-Type": "application/json", "Authorization": "Bearer " + KEY})
        with urllib.request.urlopen(req, timeout=600) as r:
            reply = json.loads(r.read())["choices"][0]["message"]["content"]
        out = json.dumps({"reply": reply}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(out)
    def log_message(self, *a):
        pass
print("READY", flush=True)
HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
'''


def rss_mb(pid):
    for line in Path(f"/proc/{pid}/status").read_text().splitlines():
        if line.startswith("VmRSS:"):
            return round(int(line.split()[1]) / 1024, 1)
    return None


def wait_port(port, limit=600):
    t0 = time.time()
    while time.time() - t0 < limit:
        try:
            socket.create_connection(("127.0.0.1", port), timeout=1).close()
            return time.time() - t0
        except OSError:
            time.sleep(0.2)
    raise RuntimeError("server did not start")


def ask(key, q):
    body = json.dumps({"model": "ai", "messages": [{"role": "system", "content": bot.SYSTEM}, {"role": "user", "content": q}],
                       "temperature": 0, "seed": 1, "max_tokens": 60}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=1200) as r:
        out = json.loads(r.read())
    return time.time() - t0, out["choices"][0]["message"]["content"], out.get("usage", {})


def self_hosted(model, threads, key):
    t0 = time.time()
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model), "--model_alias", "ai", "--api_key", key,
                            "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "2048", "--n_threads", str(threads), "--verbose", "False"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_port(PORT)
        secs, first, _ = ask(key, "Hi")   # the first answer after a cold start (the model loads on start and warms here)
        ready = time.time() - t0
        rows = []
        for q in QUESTIONS:
            s, reply, usage = ask(key, q)
            rows.append({"q": q, "secs": round(s, 1), "reply": reply, "usage": usage})
            print(threads, round(s, 1), usage, reply[:80], flush=True)
        return {"threads": threads, "cold_start_to_first_answer_s": round(ready, 1), "server_rss_mb": rss_mb(srv.pid), "rows": rows}
    finally:
        srv.terminate()
        srv.wait()


def thin_server(model, key):
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model), "--model_alias", "ai", "--api_key", key,
                            "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "2048", "--n_threads", "4", "--verbose", "False"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        wait_port(PORT)
        env = {**os.environ, "API_URL": f"http://127.0.0.1:{PORT}/v1/chat/completions", "API_KEY": key, "SYSTEM": bot.SYSTEM}
        t0 = time.time()
        thin = subprocess.Popen([sys.executable, "-c", THIN, str(THIN_PORT)], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_port(THIN_PORT)
        start = time.time() - t0
        req = urllib.request.Request(f"http://127.0.0.1:{THIN_PORT}/", data=json.dumps({"text": QUESTIONS[0]}).encode(),
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=1200) as r:
            reply = json.loads(r.read())["reply"]
        res = {"thin_start_s": round(start, 2), "thin_rss_mb": rss_mb(thin.pid), "reply_through_thin": reply}
        thin.terminate()
        return res
    finally:
        srv.terminate()
        srv.wait()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    from huggingface_hub import snapshot_download
    model = sorted(Path(snapshot_download(bot.REPO, allow_patterns=[bot.PATTERN])).glob("*.gguf"))[0]
    key = "sk-" + secrets.token_hex(20)
    res = {"model_file_mb": round(model.stat().st_size / 2**20), "cpu": os.cpu_count()}
    res["self_4"] = self_hosted(model, 4, key)
    (OUT / "deploy.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    res["self_2"] = self_hosted(model, 2, key)
    (OUT / "deploy.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    res["thin"] = thin_server(model, key)
    (OUT / "deploy.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("DONE")


if __name__ == "__main__":
    main()
