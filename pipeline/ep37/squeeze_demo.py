# EP37 demo (quantization: big models on small devices): the same brain stored with fewer bits per number. Qwen's own
# GGUF files of Qwen2.5-1.5B-Instruct (EP35's medium brain: 16-bit fp16, 8-bit q8_0, 4-bit q4_k_m, 3-bit q3_k_m, 2-bit
# q2_k) and Qwen2.5-7B-Instruct (the big brain: 8, 4, 3 and 2 bits; its 16-bit file is 15.2 GB, more than this machine's
# memory), run with llama.cpp on this machine's CPU (4 threads, no graphics card), greedy decoding. Three jobs the shop
# already knows, with the right answers written down before (EP33's rule):
#   sort  : EP35's 40 WhatsApp messages -> ORDER / PAYMENT / COMPLAINT / OTHER (right out of 40)
#   bills : EP34's 20 orders against the 15-line price board (exact total, right out of 20)
#   reply : EP36's WhatsApp reply (80-token cap, median of 3 runs): seconds and words per second, and the reply itself
# One file is downloaded at a time into HF_HUB_CACHE (RAM), tested, saved, and deleted. A run resumes: a finished
# (model, bits, job) is skipped unless --force. Writes series/scripts/ep37_demo/<size>_<quant>.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep37/squeeze_demo.py 1.5B:q4_k_m 1.5B:q2_k ... [--jobs sort,bills,reply]
import ast
import importlib.util
import json
import os
import platform
import shutil
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep37_demo"
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PARAMS = {"1.5B": 1.54e9, "7B": 7.61e9}   # from each model card
BITS = {"fp16": 16, "q8_0": 8, "q4_k_m": 4, "q3_k_m": 3, "q2_k": 2}   # the name's bits (k-quants keep some parts at more)


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


SORT = load(ROOT / "pipeline/ep35/sort_demo.py")      # MESSAGES, SYSTEM, label()
REPLY = load(ROOT / "pipeline/ep36/speed_demo.py")    # SYSTEM, ORDER


def bill_parts():
    """EP34's price board, orders and scorer, taken from pipeline/ep34/bill_demo.py without importing it (its import
    switches Hugging Face to offline mode and loads torch)."""
    src = (ROOT / "pipeline/ep34/bill_demo.py").read_text()
    tree = ast.parse(src)
    ns = {"re": __import__("re")}
    for node in tree.body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", None) in ("PRICES", "ORDERS"):
            ns[node.targets[0].id] = ast.literal_eval(node.value)
        elif isinstance(node, ast.FunctionDef) and node.name in ("board", "total", "system_prompt"):
            exec(compile(ast.Module([node], []), "bill_demo.py", "exec"), ns)
    return ns


BILL = bill_parts()


def job_sort(llm):
    rows, right, secs = [], 0, 0.0
    for text, want in SORT.MESSAGES:
        t0 = time.perf_counter()
        out = llm.create_chat_completion([{"role": "system", "content": SORT.SYSTEM}, {"role": "user", "content": text}],
                                         temperature=0.0, max_tokens=6)
        dt = time.perf_counter() - t0
        reply = out["choices"][0]["message"]["content"].strip()
        got = SORT.label(reply)
        ok = got == want
        right += ok
        secs += dt
        rows.append({"message": text, "right_label": want, "model_label": got, "reply": reply, "ok": ok})
        print(f"    {'OK ' if ok else 'BAD'} {want:9s} -> {got} | {text} | {reply!r}", flush=True)
    return {"right": right, "of": len(rows), "seconds_per_message": round(secs / len(rows), 2), "rows": rows}


def job_bills(llm):
    rows, right, secs, toks = [], 0, 0.0, 0
    system = BILL["system_prompt"]()
    for text, want in BILL["ORDERS"]:
        t0 = time.perf_counter()
        out = llm.create_chat_completion([{"role": "system", "content": system}, {"role": "user", "content": text}],
                                         temperature=0.0, max_tokens=220)
        dt = time.perf_counter() - t0
        reply = out["choices"][0]["message"]["content"]
        got = BILL["total"](reply)
        ok = got is not None and abs(got - want) < 0.01
        right += ok
        secs += dt
        toks += out["usage"]["completion_tokens"]
        rows.append({"order": text, "right_total": want, "model_total": got, "ok": ok, "seconds": round(dt, 1), "reply": reply})
        print(f"    {'OK ' if ok else 'BAD'} {text!r}: {got} (right {want}) {dt:.1f}s", flush=True)
    return {"right": right, "of": len(rows), "seconds_per_bill": round(secs / len(rows), 1),
            "tokens_per_second": round(toks / secs, 2), "rows": rows}


def job_reply(llm, runs=3):
    msgs = [{"role": "system", "content": REPLY.SYSTEM}, {"role": "user", "content": REPLY.ORDER}]
    llm.create_chat_completion(msgs, temperature=0.0, max_tokens=4)   # warm-up (pages the weights in)
    reads, totals, out = [], [], None
    for _ in range(runs):
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
    res = {"read_prompt_s": round(read, 2), "whole_reply_s": round(total, 2), "reply_tokens": out["usage"]["completion_tokens"],
           "reply_words": len(reply.split()), "tokens_per_s_writing": round((out["usage"]["completion_tokens"] - 1) / max(1e-6, total - read), 2),
           "words_per_s_writing": round(len(reply.split()) / max(1e-6, total - read), 2),
           "runs_whole_reply_s": [round(x, 2) for x in totals], "reply": reply}
    print(f"    reply: {total:.2f} s, {res['tokens_per_s_writing']} tokens/s | {reply!r}", flush=True)
    return res


def cache_dir(repo):
    return Path(os.environ.get("HF_HUB_CACHE", Path.home() / ".cache/huggingface/hub")) / ("models--" + repo.replace("/", "--"))


def run(size, quant, jobs, force):
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{size}_{quant}.json"
    res = json.loads(dest.read_text()) if dest.exists() else {}
    todo = [j for j in jobs if force or j not in res]
    if not todo:
        print(f"{size} {quant}: done already", flush=True)
        return
    repo = REPOS[size]
    pattern = f"*-{quant}*.gguf"
    t0 = time.time()
    folder = Path(snapshot_download(repo, allow_patterns=[pattern]))
    parts = sorted(folder.glob(pattern))
    dl = time.time() - t0
    size_gb = sum(p.resolve().stat().st_size for p in parts) / 1e9
    t0 = time.time()
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=2048, verbose=False, seed=0)
    res.update({"model": f"{repo} ({quant})", "size": size, "quant": quant, "bits": BITS[quant], "parameters": PARAMS[size],
                "file_gb": round(size_gb, 2), "files": [p.name for p in parts], "load_seconds": round(time.time() - t0, 1),
                "download_seconds": round(dl, 1), "machine": f"{platform.machine()}, {os.cpu_count()} CPU cores, no graphics card",
                "decoding": "greedy (temperature 0), llama.cpp via llama-cpp-python, 4 threads"})
    print(f"{size} {quant}: {size_gb:.2f} GB, loaded in {res['load_seconds']} s", flush=True)
    for j in todo:
        print(f"  job {j}", flush=True)
        res[j] = {"sort": job_sort, "bills": job_bills, "reply": job_reply}[j](llm)
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        if j != "reply":
            print(f"  {size} {quant} {j}: {res[j]['right']}/{res[j]['of']}", flush=True)
    del llm
    shutil.rmtree(cache_dir(repo), ignore_errors=True)   # one model file in RAM at a time


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    jobs = ["sort", "bills", "reply"]
    for a in sys.argv[1:]:
        if a.startswith("--jobs="):
            jobs = a.split("=", 1)[1].split(",")
    force = "--force" in sys.argv
    for spec in args:
        size, quant = spec.split(":")
        run(size, quant, jobs, force)
