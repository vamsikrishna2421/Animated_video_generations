# EP36 demo (GPUs and AI chips): the same small AI writing the same WhatsApp reply on 1, 2 and 4 CPU cores of this
# machine (no graphics card). The model is EP35's medium brain (Qwen2.5-1.5B-Instruct, Qwen's own 4-bit GGUF, q4_k_m)
# with llama.cpp. Greedy decoding and a fixed 80-token cap, so every run writes the same reply. Per core count, three runs
# (the context reset each time, so the prompt is read again); the median counts. Measured: seconds to read the prompt,
# seconds for the whole reply, words per second while writing. Writes series/scripts/ep36_demo/results.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep36/speed_demo.py
import json
import os
import platform
import statistics
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep36_demo"
REPO, PATTERN = "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "*q4_k_m*.gguf"
SYSTEM = ("You are the WhatsApp assistant of a small grocery shop (a kirana shop in Hyderabad). Reply to the customer "
          "politely in simple English: confirm each item and say it will be delivered within 30 minutes. No prices.")
ORDER = "Anna, please send 2 kg rice, 1 litre sunflower oil, 6 eggs and 1 packet of tea powder to flat 302."
# (no prices or totals: the first run asked for a total and the small model wrote 357 for 432; EP34's lesson, not this one)
CORES = (1, 2, 4)
RUNS = 3


def main():
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    folder = Path(snapshot_download(REPO, allow_patterns=[PATTERN]))
    path = sorted(folder.glob(PATTERN))[0]
    msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": ORDER}]
    rows = []
    for n in CORES:
        llm = Llama(model_path=str(path), n_threads=n, n_threads_batch=n, n_ctx=1024, verbose=False, seed=0)
        llm.create_chat_completion(msgs, temperature=0.0, max_tokens=4)   # warm-up (page in the weights)
        reads, totals, out = [], [], None
        for _ in range(RUNS):
            llm.reset()
            t0 = time.perf_counter()
            llm.create_chat_completion(msgs, temperature=0.0, max_tokens=1)
            reads.append(time.perf_counter() - t0)
            llm.reset()
            t0 = time.perf_counter()
            out = llm.create_chat_completion(msgs, temperature=0.0, max_tokens=80)
            totals.append(time.perf_counter() - t0)
        reply = out["choices"][0]["message"]["content"].strip()
        read, total = statistics.median(reads), statistics.median(totals)
        words = len(reply.split())
        row = {"cores": n, "prompt_tokens": out["usage"]["prompt_tokens"], "reply_tokens": out["usage"]["completion_tokens"],
               "reply_words": words, "read_prompt_s": round(read, 2), "whole_reply_s": round(total, 2),
               "writing_words_per_s": round(words / max(1e-6, total - read), 2), "runs_whole_reply_s": [round(x, 2) for x in totals],
               "reply": reply}
        print(json.dumps({k: v for k, v in row.items() if k != "reply"}), flush=True)
        rows.append(row)
        del llm
    base = rows[0]["whole_reply_s"]
    for r in rows:
        r["speedup_vs_1_core"] = round(base / r["whole_reply_s"], 2)
        r["read_speedup_vs_1_core"] = round(rows[0]["read_prompt_s"] / r["read_prompt_s"], 2)
    OUT.mkdir(parents=True, exist_ok=True)
    res = {"model": f"{REPO} ({path.name})", "machine": f"{platform.machine()}, {os.cpu_count()} CPU cores, no graphics card",
           "decoding": "greedy, max 80 tokens, context reset before every run, median of 3", "system": SYSTEM, "order": ORDER,
           "rows": rows}
    (OUT / "results.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("wrote", OUT / "results.json")


if __name__ == "__main__":
    main()
