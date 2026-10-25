# EP38 demo (running AI locally on your laptop): Qwen's own 4-bit GGUF files ("the squeezed brains" of EP37) of
# Qwen2.5-7B-Instruct, -3B-Instruct and -1.5B-Instruct, run with llama.cpp on this machine's CPU (4 threads, no graphics
# card) with the network cut: each test runs in a new, empty network namespace (`unshare -n`), and the script first
# shows that the internet cannot be reached (a DNS lookup and a direct connection to 1.1.1.1 both fail). Measured per
# brain: load seconds, RAM used (the process's peak resident memory, VmHWM: weights + context + working memory), and
# the shop jobs EP37 already ran, with the right answers written down before (EP33's rule):
#   bills : EP34's 20 orders against the 15-line price board (exact total, right out of 20), seconds per bill
#   reply : EP36's WhatsApp reply (80-token cap, median of 3 runs): seconds and words per second
# RAM: the jobs run with the file memory-mapped from RAM (/dev/shm), where the process's peak counts the file twice
# (the mapped pages, plus llama.cpp's repacked copy of most weights: the 7B run's peak read 7.9 GB). So the RAM a brain
# needs is measured in a fresh offline process with mmap off (every weight loaded once into the process's own memory),
# a short reply written to allocate the working buffers, then the peak (VmHWM): ram_needed_gb.
# Context window 4096 tokens (Ollama's default, docs.ollama.com/faq). Greedy decoding. One file is downloaded at a time
# into HF_HUB_CACHE (RAM), tested offline, saved, deleted. A finished brain is skipped unless --force.
# Writes series/scripts/ep38_demo/<size>_q4_k_m.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep38/local_demo.py 7B 3B 1.5B [--force]
import importlib.util
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep38_demo"
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "3B": "Qwen/Qwen2.5-3B-Instruct-GGUF",
         "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PATTERN = "*q4_k_m*.gguf"
N_CTX = 4096


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def cache_dir(repo):
    return Path(os.environ.get("HF_HUB_CACHE", Path.home() / ".cache/huggingface/hub")) / ("models--" + repo.replace("/", "--"))


def mem_status():
    st = {}
    for line in Path("/proc/self/status").read_text().splitlines():
        k, _, v = line.partition(":")
        if k in ("VmHWM", "VmRSS", "RssAnon", "RssFile", "RssShmem"):
            st[k] = round(int(v.split()[0]) / 1e6, 2)   # kB -> GB
    return st


def network_check():
    """Proof the test runs with no internet: both attempts must fail."""
    res = {}
    try:
        socket.getaddrinfo("huggingface.co", 443)
        res["dns_huggingface.co"] = "resolved (network is ON)"
    except OSError as e:
        res["dns_huggingface.co"] = f"failed: {e}"
    try:
        socket.create_connection(("1.1.1.1", 443), timeout=3).close()
        res["connect_1.1.1.1:443"] = "connected (network is ON)"
    except OSError as e:
        res["connect_1.1.1.1:443"] = f"failed: {e}"
    # /proc/net/dev belongs to the namespace (/sys/class/net would list the parent's, as the 7B run's record does)
    res["interfaces"] = sorted(l.split(":")[0].strip() for l in Path("/proc/net/dev").read_text().splitlines()[2:])
    res["offline"] = all(v.startswith("failed") for k, v in res.items() if k != "interfaces")
    return res


def run_offline(size, folder):
    """Runs inside `unshare -n` (no network)."""
    from llama_cpp import Llama
    ep37 = load(ROOT / "pipeline/ep37/squeeze_demo.py")   # job_bills, job_reply (EP34 bills, EP36 reply)
    net = network_check()
    print(f"{size}: network check {net}", flush=True)
    if not net["offline"]:
        sys.exit("network still reachable: not an offline test")
    parts = sorted(Path(folder).glob(PATTERN))
    size_gb = sum(p.resolve().stat().st_size for p in parts) / 1e9
    t0 = time.time()
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=N_CTX, verbose=False, seed=0)
    res = {"model": f"{REPOS[size]} (q4_k_m)", "size": size, "file_gb": round(size_gb, 2), "files": [p.name for p in parts],
           "load_seconds": round(time.time() - t0, 1), "network": net, "context_tokens": N_CTX,
           "machine": f"{platform.machine()}, {os.cpu_count()} CPU cores, no graphics card",
           "decoding": "greedy (temperature 0), llama.cpp via llama-cpp-python, 4 threads",
           "ram_after_load_gb": mem_status()}
    print(f"{size}: {size_gb:.2f} GB, loaded in {res['load_seconds']} s, {res['ram_after_load_gb']}", flush=True)
    res["bills"] = ep37.job_bills(llm)
    print(f"{size} bills: {res['bills']['right']}/{res['bills']['of']}, {res['bills']['seconds_per_bill']} s a bill", flush=True)
    res["reply"] = ep37.job_reply(llm)
    res["ram_peak_gb"] = mem_status()   # VmHWM = the most RAM the process held at once
    res["network_after"] = network_check()
    dest = OUT / f"{size}_q4_k_m.json"
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(f"{size}: peak RAM {res['ram_peak_gb']['VmHWM']} GB -> {dest}", flush=True)


def ram_needed(size, folder):
    """Runs inside `unshare -n`, in a fresh process: the RAM the brain needs with every weight loaded once."""
    from llama_cpp import Llama
    ep36 = load(ROOT / "pipeline/ep36/speed_demo.py")   # SYSTEM, ORDER
    net = network_check()
    if not net["offline"]:
        sys.exit("network still reachable: not an offline test")
    parts = sorted(Path(folder).glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=N_CTX, verbose=False, seed=0, use_mmap=False)
    out = llm.create_chat_completion([{"role": "system", "content": ep36.SYSTEM}, {"role": "user", "content": ep36.ORDER}],
                                     temperature=0.0, max_tokens=40)
    st = mem_status()
    dest = OUT / f"{size}_q4_k_m.json"
    res = json.loads(dest.read_text())
    res["ram_needed_gb"] = st["VmHWM"]
    res["ram_needed"] = {"how": "fresh process, mmap off, context 4096, one 40-token reply, then the peak resident memory (VmHWM)",
                         "status_gb": st, "network": net, "reply": out["choices"][0]["message"]["content"].strip()}
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(f"{size}: RAM needed {st['VmHWM']} GB (file {res['file_gb']} GB) {st}", flush=True)


def main(sizes, force):
    from huggingface_hub import snapshot_download
    OUT.mkdir(parents=True, exist_ok=True)
    for size in sizes:
        if (OUT / f"{size}_q4_k_m.json").exists() and not force:
            print(f"{size}: done already", flush=True)
            continue
        repo = REPOS[size]
        folder = snapshot_download(repo, allow_patterns=[PATTERN])   # online: the one-time download
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", size, folder], check=True)
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--ram", size, folder], check=True)
        shutil.rmtree(cache_dir(repo), ignore_errors=True)   # one brain in RAM at a time


if __name__ == "__main__":
    if sys.argv[1:2] == ["--offline"]:
        run_offline(sys.argv[2], sys.argv[3])
    elif sys.argv[1:2] == ["--ram"]:   # also by hand: unshare -n python3 pipeline/ep38/local_demo.py --ram 7B <snapshot folder>
        ram_needed(sys.argv[2], sys.argv[3])
    else:
        main([a for a in sys.argv[1:] if not a.startswith("--")], "--force" in sys.argv)
