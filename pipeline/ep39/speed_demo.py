# EP39 demo (inference: speed, latency and cost per token). EP38's 7B brain took 17 s for Ravi anna's WhatsApp reply on
# this machine (4 CPU cores, no graphics card). Where do the seconds go? Two clocks, measured by streaming the reply token
# by token: the wait before the first word (time to first token: the AI reads the whole prompt first) and the writing
# speed after it (tokens per second). Then what moves them, one change at a time, on the same job (EP36's order):
#   reply   : EP36's system prompt and order, as in EP38 (English)
#   short   : the same + "Reply in 2 short lines." (fewer tokens to write)
#   telugu  : the same, asking for the reply in Telugu script (the same message in more tokens)
#   history : the order after a month of earlier chat pasted in front (a long prompt: the first word waits)
# Qwen's own 4-bit GGUF files (Q4_K_M) of Qwen2.5-7B-Instruct and Qwen2.5-1.5B-Instruct, llama.cpp via llama-cpp-python,
# 4 threads, greedy decoding, context 4096, 3 runs per condition (the median is kept), each run from an empty cache.
# Each test runs offline (a new, empty network namespace, as EP38). Token counts of one fixed message in English and in
# Telugu with two tokenizers: Qwen2.5's and OpenAI's o200k_base (GPT-4o's, via tiktoken; fetched before going offline).
# Writes series/scripts/ep39_demo/<size>.json and tokens.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep39/speed_demo.py 7B 1.5B [--force]
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep39/speed_demo.py --recount 7B 1.5B   (token counts of saved results)
import importlib.util
import json
import os
import statistics
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep39_demo"
REPOS = {"1.5B": "Qwen/Qwen2.5-1.5B-Instruct-GGUF", "7B": "Qwen/Qwen2.5-7B-Instruct-GGUF"}
PATTERN = "*q4_k_m*.gguf"
N_CTX = 4096
RUNS = 3
TIKTOKEN_DIR = "/dev/shm/tiktoken"
# one message, the same meaning, written by us in both languages (for the token counts)
MSG_EN = ("Your order of 2 kg rice, 1 litre sunflower oil, 6 eggs and 1 packet of tea powder will reach flat 302 in "
          "30 minutes. Thank you!")
MSG_TE = ("మీ ఆర్డర్: 2 కిలోల బియ్యం, 1 లీటర్ సన్‌ఫ్లవర్ నూనె, 6 గుడ్లు, 1 ప్యాకెట్ టీ పొడి 30 నిమిషాల్లో ఫ్లాట్ 302 కి "
          "వస్తుంది. ధన్యవాదాలు!")


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


EP36 = load(ROOT / "pipeline/ep36/speed_demo.py")   # SYSTEM, ORDER (EP36's WhatsApp job, EP38's 17 s)
EP38 = load(ROOT / "pipeline/ep38/local_demo.py")   # network_check


def history_turns(n=30):
    """A month of earlier chat with the same customer: n past orders and the shop's replies (about 1,800 tokens)."""
    items = ["2 kg rice", "1 litre oil", "6 eggs", "tea powder", "1 kg sugar", "bread", "milk 2 packets", "curd", "dal 1 kg",
             "soap", "salt", "biscuits"]
    msgs = []
    for k in range(n):
        a, b = items[k % len(items)], items[(k * 5 + 3) % len(items)]
        msgs.append({"role": "user", "content": f"Anna, day {k + 1}: please send {a} and {b} to flat 302."})
        msgs.append({"role": "assistant", "content": f"Sure! {a.capitalize()} and {b} will reach flat 302 within 30 minutes. Thank you!"})
    return msgs


CONDITIONS = {
    "reply": lambda: [{"role": "system", "content": EP36.SYSTEM}, {"role": "user", "content": EP36.ORDER}],
    "short": lambda: [{"role": "system", "content": EP36.SYSTEM + " Reply in 2 short lines."}, {"role": "user", "content": EP36.ORDER}],
    "telugu": lambda: [{"role": "system", "content": EP36.SYSTEM.replace("in simple English", "in simple Telugu, in Telugu script")},
                       {"role": "user", "content": EP36.ORDER}],
    "history": lambda: [{"role": "system", "content": EP36.SYSTEM}] + history_turns() + [{"role": "user", "content": EP36.ORDER}],
}
MAX_TOKENS = {"reply": 160, "short": 160, "telugu": 400, "history": 160}


def timed(llm, msgs, max_tokens):
    """One streamed reply from an empty cache: seconds to the first token, total seconds, tokens written, the text."""
    llm.reset()
    t0 = time.perf_counter()
    first, n, text = None, 0, []
    for chunk in llm.create_chat_completion(msgs, temperature=0.0, max_tokens=max_tokens, stream=True):
        delta = chunk["choices"][0].get("delta", {}).get("content")
        if delta:
            if first is None:
                first = time.perf_counter() - t0
            n += 1
            text.append(delta)
    total = time.perf_counter() - t0
    return first or total, total, n, "".join(text).strip()


def count(llm, text):
    """Tokens in the reply as the brain's own tokenizer splits it."""
    return len(llm.tokenize(text.encode(), add_bos=False))


def recount(size, folder):
    """Re-count the saved replies' tokens (vocab only, no test re-run) and the writing speed from them."""
    from llama_cpp import Llama
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), vocab_only=True, verbose=False)
    path = OUT / f"{size}.json"
    res = json.loads(path.read_text())
    for name in CONDITIONS:
        r = res[name]
        n = count(llm, r["reply"])
        if n != r["reply_tokens"]:
            print(f"  {size} {name}: {r['reply_tokens']} stream chunks -> {n} tokens", flush=True)
        r["reply_tokens"] = n
        r["writing_tokens_per_s"] = round((n - 1) / max(1e-6, r["whole_reply_s"] - r["first_token_s"]), 2)
    path.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def run_offline(size, folder):
    from llama_cpp import Llama
    res = {"model": f"{REPOS[size]} (q4_k_m)", "size": size, "network": EP38.network_check(),
           "machine": "x86_64, 4 CPU cores, no graphics card", "decoding": "greedy, llama.cpp via llama-cpp-python, 4 threads",
           "context_tokens": N_CTX, "runs": RUNS}
    if not res["network"].get("offline"):
        sys.exit("network reachable: not an offline run")
    parts = sorted(Path(folder).glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_ctx=N_CTX, n_threads=4, n_threads_batch=4, verbose=False, seed=0)
    llm.create_chat_completion(CONDITIONS["reply"](), temperature=0.0, max_tokens=4)   # warm-up (pages the weights in)
    for name, make in CONDITIONS.items():
        msgs = make()
        rows = [timed(llm, msgs, MAX_TOKENS[name]) for _ in range(RUNS)]
        first = statistics.median(r[0] for r in rows)
        total = statistics.median(r[1] for r in rows)
        text = rows[-1][3]
        n = count(llm, text)   # the stream's chunks undercount: one chunk can hold several tokens (Telugu letters)
        # the prompt's size in tokens, as the model reads it (chat template applied)
        try:
            from llama_cpp.llama_chat_format import format_chatml   # Qwen2.5 uses ChatML
            prompt = format_chatml(msgs).prompt
            prompt_tokens = len(llm.tokenize(prompt.encode(), add_bos=False, special=True))
        except Exception:
            prompt_tokens = None
        res[name] = {"first_token_s": round(first, 2), "whole_reply_s": round(total, 2), "reply_tokens": n,
                     "writing_tokens_per_s": round((n - 1) / max(1e-6, total - first), 2), "prompt_tokens": prompt_tokens,
                     "runs": [[round(r[0], 2), round(r[1], 2), r[2]] for r in rows], "reply": text}
        print(f"  {size} {name}: first {first:.2f} s, whole {total:.2f} s, {n} tokens, "
              f"{res[name]['writing_tokens_per_s']} tok/s, prompt {prompt_tokens} | {text[:90]!r}", flush=True)
    res["tokens_msg"] = {"en": len(llm.tokenize(MSG_EN.encode(), add_bos=False)), "te": len(llm.tokenize(MSG_TE.encode(), add_bos=False))}
    res["network_after"] = EP38.network_check()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{size}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("wrote", OUT / f"{size}.json", flush=True)


def tokens_online():
    """OpenAI's o200k_base tokenizer (GPT-4o's) on the same two messages; tiktoken fetches it once (online)."""
    os.environ["TIKTOKEN_CACHE_DIR"] = TIKTOKEN_DIR
    import tiktoken
    enc = tiktoken.get_encoding("o200k_base")
    res = {"o200k_base": {"en": len(enc.encode(MSG_EN)), "te": len(enc.encode(MSG_TE))},
           "msg_en": MSG_EN, "msg_te": MSG_TE, "words_en": len(MSG_EN.split()), "words_te": len(MSG_TE.split())}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tokens.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("tokens", res["o200k_base"], flush=True)


def main(sizes, force):
    from huggingface_hub import snapshot_download
    tokens_online()
    for size in sizes:
        if (OUT / f"{size}.json").exists() and not force:
            print("have", size)
            continue
        folder = snapshot_download(REPOS[size], allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", size, folder], check=True)


if __name__ == "__main__":
    if sys.argv[1:2] == ["--offline"]:
        run_offline(sys.argv[2], sys.argv[3])
    elif sys.argv[1:2] == ["--recount"]:   # --recount 7B 1.5B: fix the token counts of saved results
        from huggingface_hub import snapshot_download
        for size in sys.argv[2:]:
            recount(size, snapshot_download(REPOS[size], allow_patterns=[PATTERN]))
    else:
        main([a for a in sys.argv[1:] if not a.startswith("--")], "--force" in sys.argv)
