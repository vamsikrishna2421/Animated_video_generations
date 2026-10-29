# HOW TO 02 demo, "Make AI reply faster: 3 settings" (written and committed before it ran). EP39 timed the shop's reply
# on this machine and found where the seconds go: the AI reads the whole chat first (the wait before the first word),
# then writes one token at a time. A chat app adds a third clock: a "thinking" mode writes hidden tokens before the
# answer. So: one everyday job, timed with each setting a user can change, one at a time, then all three together.
#   default : thinking on (the brain's default), the job as typed, a fresh chat
#   short   : + "Keep it to 2 short lines." (setting 1: ask for a short reply)
#   long    : the same job at the end of a long chat (a month of use: 90 earlier messages) instead of a fresh one
#             (setting 2, reversed)
#   nothink : thinking off (Qwen3's "/no_think" switch; setting 3: the fast mode instead of the thinking one)
#   all3    : short + thinking off + a fresh chat
# The job (Ravi anna's, a phone job): a WhatsApp message to his customers. Pass mark, fixed before the run: the reply
# says the shop is closed this Sunday AND open again on Monday at 7 am; every reply is read by hand (HAND below).
# Brain: Qwen's own 4-bit GGUF of Qwen3-4B (Q4_K_M, Apache 2.0), llama.cpp via llama-cpp-python, 4 threads, context
# 8192, Qwen's recommended sampling (thinking: temperature 0.6, top_p 0.95, top_k 20; thinking off: 0.7, 0.8, 20),
# seeds 1-3 (3 runs per setting, the median kept), every run from an empty cache, streamed token by token: the wait for
# the first word of the answer (after any thinking), the whole reply, thinking tokens and answer tokens. Offline: each
# run in a new, empty network namespace (EP38's check).
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/howto02/speed_settings.py         (downloads, then reruns itself offline)
#   python3 pipeline/howto02/speed_settings.py --summary
import importlib.util
import json
import statistics
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/howto02_demo"
REPO, PATTERN = "Qwen/Qwen3-4B-GGUF", "Qwen3-4B-Q4_K_M.gguf"
N_CTX = 8192
RUNS = 3
MAX_TOKENS = 2000
JOB = ("Write a WhatsApp message for my shop's customers: the shop is closed this Sunday for a family function, "
       "and open again on Monday at 7 am.")
SHORT = " Keep it to 2 short lines."
NOTHINK = " /no_think"
SAMPLING = {True: {"temperature": 0.6, "top_p": 0.95, "top_k": 20, "min_p": 0.0},
            False: {"temperature": 0.7, "top_p": 0.8, "top_k": 20, "min_p": 0.0}}


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def long_chat(n=45):
    """A month of earlier use of the same chat: 45 jobs and the AI's answers (90 messages; the 15 jobs come round 3 times)."""
    jobs = [("a price board for onions", "Onions: Rs 40 a kg today. Fresh stock in!"),
            ("a thank-you note for Suresh garu", "Thank you, Suresh garu, for shopping with us every week!"),
            ("a reminder about the milk delivery time", "Milk now reaches your door by 6:30 am every morning."),
            ("a Diwali offer", "Diwali offer: 5% off on all sweets and dry fruits this week!"),
            ("a message about the new UPI scanner", "You can now pay by UPI at the counter. Just scan and pay!"),
            ("a note that rice prices went up", "Rice prices have gone up by Rs 2 a kg from the supplier. Sorry!"),
            ("a welcome message for new customers", "Welcome to Ravi Kirana! Order on WhatsApp, delivery in 30 minutes."),
            ("a reply to a late-delivery complaint", "Sorry for the delay today. Your next delivery is free."),
            ("a message about fresh vegetables", "Fresh vegetables arrive every morning at 8 am."),
            ("an ad for the new tea brand", "New tea powder in stock. Try a 250 g packet for Rs 60!"),
            ("a note about the store's new timings", "New timings: 7 am to 10 pm, every day except Sunday afternoons."),
            ("a message for regular customers", "Thank you for being with us. Ask about our monthly bill option!"),
            ("a rain update", "Heavy rain today: deliveries may take an extra 15 minutes."),
            ("a message about gas cylinder bookings", "We now take gas cylinder bookings at the counter."),
            ("a festival greeting", "Happy Sankranti to all our customers and their families!")]
    msgs = []
    for k in range(n):
        job, reply = jobs[k % len(jobs)]
        msgs.append({"role": "user", "content": f"Day {k // 3 + 1}: write a WhatsApp message for my shop's customers: {job}."})
        msgs.append({"role": "assistant", "content": reply})
    return msgs


def conditions():
    return {
        "default": ([{"role": "user", "content": JOB}], True),
        "short": ([{"role": "user", "content": JOB + SHORT}], True),
        "long": (long_chat() + [{"role": "user", "content": JOB}], True),
        "nothink": ([{"role": "user", "content": JOB + NOTHINK}], False),
        "all3": ([{"role": "user", "content": JOB + SHORT + NOTHINK}], False),
    }


def timed(llm, msgs, think, seed):
    """One streamed reply from an empty cache: the answer's first word, the whole reply, thinking and answer tokens."""
    llm.reset()
    t0 = time.perf_counter()
    first_any, first_answer, text = None, None, ""
    for chunk in llm.create_chat_completion(msgs, max_tokens=MAX_TOKENS, stream=True, seed=seed, **SAMPLING[think]):
        delta = chunk["choices"][0].get("delta", {}).get("content")
        if not delta:
            continue
        now = time.perf_counter() - t0
        if first_any is None:
            first_any = now
        text += delta
        answer = text.split("</think>", 1)[1] if "</think>" in text else ("" if "<think>" in text else text)
        if first_answer is None and answer.strip():
            first_answer = now
    total = time.perf_counter() - t0
    thinking = text.split("</think>", 1)[0].replace("<think>", "").strip() if "</think>" in text else ""
    answer = text.split("</think>", 1)[1].strip() if "</think>" in text else text.strip()
    return {"first_token_s": round(first_any or total, 2), "first_answer_word_s": round(first_answer or total, 2),
            "whole_reply_s": round(total, 2), "thinking": thinking, "answer": answer,
            "thinking_tokens": len(llm.tokenize(thinking.encode(), add_bos=False)) if thinking else 0,
            "answer_tokens": len(llm.tokenize(answer.encode(), add_bos=False)),
            "hit_cap": len(llm.tokenize(text.encode(), add_bos=False)) >= MAX_TOKENS - 2}


def prompt_tokens(llm, msgs):
    """The prompt's size in tokens as the brain reads it (its own chat template)."""
    from llama_cpp.llama_chat_format import Jinja2ChatFormatter
    tmpl = llm.metadata.get("tokenizer.chat_template")
    fmt = Jinja2ChatFormatter(template=tmpl, eos_token="<|im_end|>", bos_token="")
    prompt = fmt(messages=msgs).prompt   # the formatter adds the generation prompt itself
    return len(llm.tokenize(prompt.encode(), add_bos=False, special=True))


def run_offline(folder):
    from llama_cpp import Llama
    ep38 = load(ROOT / "pipeline/ep38/local_demo.py")
    net = ep38.network_check()
    if not net["offline"]:
        sys.exit(f"network reachable: not an offline run {net}")
    llm = Llama(model_path=str(sorted(Path(folder).glob(PATTERN))[0]), n_ctx=N_CTX, n_threads=4, n_threads_batch=4,
                verbose=False, seed=0)
    llm.create_chat_completion([{"role": "user", "content": "Hi /no_think"}], max_tokens=4)   # warm-up (pages the weights in)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "results.json"
    res = json.loads(dest.read_text()) if dest.exists() else {
        "model": f"{REPO} ({PATTERN})", "licence": "Apache 2.0", "network": net,
        "machine": "x86_64, 4 CPU cores, no graphics card", "engine": "llama.cpp via llama-cpp-python, 4 threads",
        "context_tokens": N_CTX, "max_tokens": MAX_TOKENS, "sampling": {"thinking": SAMPLING[True], "no_thinking": SAMPLING[False]},
        "job": JOB, "pass_mark": "says closed this Sunday AND open again Monday at 7 am (read by hand)", "rows": {}}
    for name, (msgs, think) in conditions().items():
        if name in res["rows"] and len(res["rows"][name]["runs"]) == RUNS:
            continue
        runs = []
        for seed in range(1, RUNS + 1):
            r = timed(llm, msgs, think, seed)
            runs.append(r)
            print(f"  {name} seed {seed}: answer word at {r['first_answer_word_s']} s, whole {r['whole_reply_s']} s, "
                  f"thinking {r['thinking_tokens']}, answer {r['answer_tokens']}{' CAP' if r['hit_cap'] else ''} | {r['answer'][:80]!r}", flush=True)
        res["rows"][name] = {"thinking_on": think, "prompt_tokens": prompt_tokens(llm, msgs), "messages_in_chat": len(msgs),
                             "runs": runs}
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    res["network_after"] = ep38.network_check()
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("wrote", dest, flush=True)


# Smoke test before the run (not recorded): the template, "/no_think" (an empty <think></think>, then the answer) and the
# prompt counter (a fresh chat 43 tokens; the 30-message chat 677, so the long chat became 90 messages).
# Read by hand (every answer in results.json): {(condition, seed): {"pass": bool, "why": str}}
HAND = {   # all 15 say closed (this) Sunday and open again Monday at 7 am: all pass. Noted while reading (not a pass mark
           # fixed before the run): ready to send as written, no placeholder, no "Subject:" line, no note about the message
    ("default", 1): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; a Subject line, [Your Shop Name], a note about the message"},
    ("default", 2): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; a Subject line, placeholders, a note about the message"},
    ("default", 3): {"pass": True, "why": "this Sunday, Monday at 7:00 AM; a Subject line, placeholders, a note about the message"},
    ("short", 1): {"pass": True, "why": "closed Sunday, 7 am Monday; ready to send"},
    ("short", 2): {"pass": True, "why": "closed this Sunday, 7 am Monday; ready to send"},
    ("short", 3): {"pass": True, "why": "closed this Sunday, Monday at 7 am; ready to send"},
    ("long", 1): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; signed 'Ravi Kirana Team' (the name came from the old chat); ready to send"},
    ("long", 2): {"pass": True, "why": "closed on Sunday, Monday at 7 am; [Your Shop Name]"},
    ("long", 3): {"pass": True, "why": "closed on Sunday, Monday at 7 am; signed 'Ravi Kirana'; a note about the message"},
    ("nothink", 1): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; 'Sure! Here's...', placeholders, 'Let me know...'"},
    ("nothink", 2): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; 'Sure! Here's...', [Your Shop Name], 'Let me know...'"},
    ("nothink", 3): {"pass": True, "why": "closed on Sunday, Monday at 7:00 AM; 'Sure! Here's...', [Your Shop Name], 'Let me know...'"},
    ("all3", 1): {"pass": True, "why": "closed this Sunday, Monday at 7 am; ready to send"},
    ("all3", 2): {"pass": True, "why": "closed this Sunday, 7 AM Monday; ready to send"},
    ("all3", 3): {"pass": True, "why": "closed this Sunday, 7 am Monday; ready to send"},
}
READY = {"default": 0, "short": 3, "long": 1, "nothink": 0, "all3": 3}   # of 3, ready to send as written (noted while reading)


def summarize():
    dest = OUT / "results.json"
    res = json.loads(dest.read_text())
    out = {}
    for name, row in res["rows"].items():
        runs = row["runs"]
        med = lambda k: statistics.median(r[k] for r in runs)
        passed = [HAND.get((name, i + 1), {}).get("pass") for i in range(len(runs))]
        out[name] = {"answer_word_s": round(med("first_answer_word_s"), 1), "whole_s": round(med("whole_reply_s"), 1),
                     "thinking_tokens": med("thinking_tokens"), "answer_tokens": med("answer_tokens"),
                     "reading_s": round(med("first_token_s"), 1), "ready_to_send": f"{READY.get(name, 0)}/{len(runs)}",
                     "whole_range_s": [min(r["whole_reply_s"] for r in runs), max(r["whole_reply_s"] for r in runs)],
                     "prompt_tokens": row["prompt_tokens"], "passed": f"{sum(p is True for p in passed)}/{len(runs)}"
                     if all(p is not None for p in passed) else "not read yet"}
    res["summary"] = out
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    if sys.argv[1:2] == ["--summary"]:
        summarize()
    elif sys.argv[1:2] == ["--offline"]:
        run_offline(sys.argv[2])
    else:
        from huggingface_hub import snapshot_download
        folder = snapshot_download(REPO, allow_patterns=[PATTERN])
        subprocess.run(["unshare", "-n", sys.executable, __file__, "--offline", folder], check=True)
