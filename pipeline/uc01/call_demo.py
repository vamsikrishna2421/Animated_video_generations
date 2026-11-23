# UC01 test (written and committed before it ran): how long does a caller wait in silence when the shop's phone AI
# answers? One phone order, spoken by a computer voice (Kokoro, on our computer), goes through the three stages of a
# phone AI, all on our computer (4 CPU threads, no GPU):
#   ears:  faster-whisper small (int8) turns the caller's audio into text;
#   brain: a Qwen2.5-Instruct model (4-bit, llama.cpp) writes the reply, streamed token by token;
#   mouth: Kokoro turns the reply into speech.
# The silence the caller hears = ears + brain + mouth, measured with a stopwatch (time.perf_counter) per run:
#   A "wait for all":   ears + the whole reply written + the whole reply spoken (made into audio);
#   B "first sentence": ears + the reply's first sentence written + that sentence made into audio (the rest is
#                       written and spoken while the first sentence plays);
#   C  B with a short-reply instruction;  D  B with the 1.5B model instead of the 7B.
# Each brain config runs 6 times (seeds 1-6, temperature 0.7, a fresh chat each time); run 0 warms the model up and is
# not counted. Ears run 6 times on the same clip. Every reply is checked: the right total is ₹1,928 (a 25 kg rice bag
# ₹1,450 + 2 litres of oil at ₹155 + 2 dozen eggs at ₹84, from the made-up price list below). Writes
# series/scripts/uc01_demo/calls.json and caller.wav.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/uc01/call_demo.py
import gc
import json
import re
import statistics as st
import time
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/uc01_demo"
CALLER = ("Hello, is this Ravi anna's shop? I want one twenty-five kilo bag of sona masoori rice, two litres of sunflower "
          "oil, and two dozen eggs. Please deliver by six.")
PRICES = "Sona masoori rice, 25 kg bag: Rs 1450. Sunflower oil: Rs 155 a litre. Eggs: Rs 84 a dozen. Delivery is free."
SYSTEM = ("You are the phone assistant of Ravi's kirana shop in Hyderabad. Price list: " + PRICES + " Answer the caller: "
          "confirm the items, give the total in rupees, and confirm the delivery time.")
SHORT = " Reply in at most two short sentences."
RIGHT = 1928
MODELS = {"7B": ("Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"), "1.5B": ("Qwen/Qwen2.5-1.5B-Instruct-GGUF", "*q4_k_m*.gguf")}
CONFIGS = [("A", "7B", False), ("C", "7B", True), ("D", "1.5B", False)]   # B uses A's runs (the same replies, timed to the first sentence)
SEEDS = range(0, 7)   # 0 = warm-up, not counted
SENT_END = re.compile(r"[.!?](\s|$)")


def gguf(repo, pat):
    from huggingface_hub import snapshot_download
    return str(sorted(Path(snapshot_download(repo, allow_patterns=[pat])).glob("*.gguf"))[0])


def kokoro():
    from kokoro_onnx import Kokoro
    return Kokoro(str(ROOT / "models/kokoro-v1.0.onnx" if (ROOT / "models/kokoro-v1.0.onnx").exists() else ROOT / "models/kokoro-v1.0-timed.onnx"),
                  str(ROOT / "models/voices-v1.0.bin"))


def speak(k, text, voice="af_heart"):
    t0 = time.perf_counter()
    audio, sr = k.create(text, voice=voice, speed=1.0, lang="en-us")
    return time.perf_counter() - t0, audio, sr


def total_ok(text):
    nums = [int(x.replace(",", "")) for x in re.findall(r"(?:Rs\.?|₹|INR)\s*([\d,]{3,6})", text)]
    nums += [int(x.replace(",", "")) for x in re.findall(r"\b([\d,]{4,6})\s*(?:rupees|Rs)", text, re.I)]
    return RIGHT in nums, sorted(set(nums))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    k = kokoro()
    _, audio, sr = speak(k, CALLER, voice="am_adam")
    sf.write(OUT / "caller.wav", audio, sr)
    res = {"caller": CALLER, "system": SYSTEM, "short": SHORT, "right_total": RIGHT, "ears": [], "brain": {}, "mouth": {}}

    from faster_whisper import WhisperModel
    ears = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=4)
    for i in SEEDS:
        t0 = time.perf_counter()
        segs, _ = ears.transcribe(str(OUT / "caller.wav"), language="en", beam_size=1)
        heard = " ".join(s.text.strip() for s in segs)
        res["ears"].append({"run": i, "secs": round(time.perf_counter() - t0, 3), "heard": heard})
        print("ears", i, res["ears"][-1]["secs"], heard[:80], flush=True)
    heard = res["ears"][-1]["heard"]
    del ears
    gc.collect()

    from llama_cpp import Llama
    for name, (repo, pat) in MODELS.items():
        llm = Llama(model_path=gguf(repo, pat), n_ctx=2048, n_threads=4, verbose=False)
        for cid, mname, short in CONFIGS:
            if mname != name:
                continue
            rows = []
            for seed in SEEDS:
                msgs = [{"role": "system", "content": SYSTEM + (SHORT if short else "")}, {"role": "user", "content": heard}]
                t0 = time.perf_counter()
                first_tok = first_sent = None
                text = ""
                for ch in llm.create_chat_completion(messages=msgs, temperature=0.7, seed=seed, max_tokens=160, stream=True):
                    d = ch["choices"][0]["delta"].get("content") or ""
                    if d and first_tok is None:
                        first_tok = time.perf_counter() - t0
                    text += d
                    if first_sent is None and SENT_END.search(text):
                        first_sent = time.perf_counter() - t0
                done = time.perf_counter() - t0
                m = SENT_END.search(text)
                sent1 = text[:m.end()].strip() if m else text.strip()
                ok, nums = total_ok(text)
                rows.append({"seed": seed, "first_token": round(first_tok or done, 3), "first_sentence": round(first_sent or done, 3),
                             "all": round(done, 3), "words": len(text.split()), "reply": text.strip(), "sentence1": sent1,
                             "total_right": ok, "rupee_numbers": nums})
                print(cid, seed, rows[-1]["first_sentence"], rows[-1]["all"], ok, nums, "|", sent1[:70], flush=True)
            res["brain"][cid] = rows
        del llm
        gc.collect()

    for cid, rows in res["brain"].items():   # the mouth: the whole reply and the first sentence, each made into audio
        for r in rows:
            r["mouth_all"] = round(speak(k, r["reply"])[0], 3)
            r["mouth_first"] = round(speak(k, r["sentence1"])[0], 3)

    med = lambda xs: round(st.median(xs), 2)   # noqa: E731
    ears_s = med([e["secs"] for e in res["ears"][1:]])
    summary = {"ears": ears_s}
    for cid, rows in res["brain"].items():
        rr = rows[1:]
        summary[cid] = {"brain_first_sentence": med([r["first_sentence"] for r in rr]), "brain_all": med([r["all"] for r in rr]),
                        "mouth_first": med([r["mouth_first"] for r in rr]), "mouth_all": med([r["mouth_all"] for r in rr]),
                        "silence_wait_all": med([ears_s + r["all"] + r["mouth_all"] for r in rr]),
                        "silence_first_sentence": med([ears_s + r["first_sentence"] + r["mouth_first"] for r in rr]),
                        "total_right": sum(r["total_right"] for r in rr), "runs": len(rr)}
    res["summary"] = summary
    (OUT / "calls.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("SUMMARY", json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
