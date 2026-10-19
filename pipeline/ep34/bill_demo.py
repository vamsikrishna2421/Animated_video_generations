# EP34 demo (open vs closed models): can a free open-weights model that Ravi anna owns make his bills? 20 WhatsApp
# orders against a 15-line price board, totals known in advance (EP33's rule: test with answers you already know).
# Apache-2.0 open models from Hugging Face, run on CPU only (4 cores, no graphics card) with the internet unused
# (offline mode: nothing is fetched while the test runs). Greedy decoding; the model may show its working. Scored: the
# last number on the reply's last line that says "total" (the bill it gives), exact rupees. Writes series/scripts/ep34_demo/.
# The script review asked for a mid-size model too: Qwen2.5-7B-Instruct as Qwen's own 4-bit GGUF (q4_k_m), run with
# llama.cpp (pip llama-cpp-python), the way a laptop app like Ollama or LM Studio runs it.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep34/bill_demo.py [model ...]
#   python3 pipeline/ep34/bill_demo.py --rescore      (score the saved replies again, no model run)
import json
import os
import re
import sys
import time
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
import torch  # noqa: E402
from transformers import AutoModelForCausalLM, AutoTokenizer  # noqa: E402
from huggingface_hub import snapshot_download  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep34_demo"
MODELS = ["Qwen/Qwen2.5-0.5B-Instruct", "Qwen/Qwen2.5-1.5B-Instruct", "Qwen/Qwen2.5-7B-Instruct-GGUF"]
PRICES = [("tomato", "1 kg", 40), ("onion", "1 kg", 35), ("potato", "1 kg", 30), ("rice", "1 kg", 62),
          ("toor dal", "1 kg", 140), ("sugar", "1 kg", 46), ("milk", "500 ml packet", 28), ("curd", "500 g cup", 35),
          ("eggs", "1 dozen", 78), ("bread", "1 packet", 45), ("detergent powder", "1 kg", 120), ("bath soap", "1 bar", 38),
          ("tea powder", "250 g", 125), ("coconut oil", "500 ml", 110), ("biscuits", "1 packet", 20)]
# (order as typed on WhatsApp, the right total)
ORDERS = [("anna 2 kg tomato, 1 dozen eggs pls", 158),
          ("1 kg rice, 1 kg toor dal, 2 milk packets", 258),
          ("3 bath soaps and 1 detergent powder", 234),
          ("half kg sugar and one tea powder", 148),
          ("2 bread 4 biscuits", 170),
          ("1 coconut oil, 2 kg onion, 1 kg potato", 210),
          ("2 curd 2 milk", 126),
          ("5 kg rice please", 310),
          ("1 doz eggs, 1 bread, 2 milk, 1 curd", 214),
          ("2 kg dal and 2 kg sugar", 372),
          ("half kg tomato, 1 kg onion", 55),
          ("3 biscuits, 1 tea powder, 1 kg sugar", 231),
          ("2 coconut oil", 220),
          ("1 detergent, 2 soap, 1 kg potato", 226),
          ("4 milk packets and 2 bread", 202),
          ("2 dozen eggs", 156),
          ("1 kg each tomato onion potato rice", 167),
          ("3 kg sugar, 2 tea powder", 388),
          ("1 curd 1 bread 5 biscuits", 180),
          ("2 kg rice, 1 kg dal, 1 coconut oil, 2 soaps", 450)]


def board():
    return "\n".join(f"- {n}: Rs {p} per {u}" for n, u, p in PRICES)


def check():
    """Whole-rupee totals only (a half-kilo order is priced so it stays whole)."""
    for text, total in ORDERS:   # (worked out by hand from the board and checked once more when the demo was written)
        assert total == round(total), text


def total(reply):
    """The bill the model gives: the last number on its last line that mentions a total ("Total: Rs 80 + Rs 78 = Rs 158"
    -> 158; the first version of this scorer read 80 there)."""
    lines = [ln for ln in reply.splitlines() if re.search(r"total", ln, flags=re.I)]
    nums = re.findall(r"\d[\d,]*(?:\.\d+)?", lines[-1]) if lines else []
    return float(nums[-1].replace(",", "")) if nums else None


def rescore():
    for f in sorted(OUT.glob("results_*.json")):
        res = json.loads(f.read_text())
        for row in res["rows"]:
            row["model_total"] = total(row["reply"])
            row["ok"] = row["model_total"] is not None and abs(row["model_total"] - row["right_total"]) < 0.01
        res["right"] = sum(r["ok"] for r in res["rows"])
        f.write_text(json.dumps(res, indent=1, ensure_ascii=False))
        print(f"{res['model']}: {res['right']}/{res['of']} right, {res['seconds_per_bill']} s per bill", flush=True)


def system_prompt():
    return ("You are the billing assistant of a small kirana shop in Hyderabad. Price board:\n" + board() +
            "\nRead the customer's WhatsApp order, work out each item's cost, then give the bill total in rupees. "
            "End with one line: TOTAL: <number>")


def run_gguf(model_id, log):
    """A 4-bit GGUF through llama.cpp (the split q4_k_m files from the model's own repo)."""
    from llama_cpp import Llama
    folder = Path(snapshot_download(model_id, local_files_only=True))
    parts = sorted(folder.glob("*q4_k_m*.gguf"))
    t0 = time.time()
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_ctx=2048, verbose=False, seed=0)
    load = time.time() - t0
    rows, right, gen_s, gen_tok = [], 0, 0.0, 0
    for text, want in ORDERS:
        t1 = time.time()
        out = llm.create_chat_completion([{"role": "system", "content": system_prompt()}, {"role": "user", "content": text}],
                                         temperature=0.0, max_tokens=220)
        dt = time.time() - t1
        reply = out["choices"][0]["message"]["content"]
        got = total(reply)
        ok = got is not None and abs(got - want) < 0.01
        right += ok
        gen_s += dt
        gen_tok += out["usage"]["completion_tokens"]
        rows.append({"order": text, "right_total": want, "model_total": got, "ok": ok, "seconds": round(dt, 1), "reply": reply})
        print(f"  {'OK ' if ok else 'BAD'} {text!r}: {got} (right {want}) {dt:.1f}s", flush=True)
    size = sum(f.resolve().stat().st_size for f in parts)
    res = {"model": model_id + " (q4_k_m)", "parameters": 7.6e9, "download_gb": round(size / 1e9, 2), "right": right,
           "of": len(ORDERS), "load_seconds": round(load, 1), "seconds_per_bill": round(gen_s / len(ORDERS), 1),
           "tokens_per_second": round(gen_tok / gen_s, 1), "cpu_threads": 4, "rows": rows}
    log.append(res)
    print(f"{model_id}: {right}/{len(ORDERS)} right, {res['seconds_per_bill']} s per bill, {res['tokens_per_second']} tokens/s, "
          f"{res['download_gb']} GB", flush=True)
    return res


def run(model_id, log):
    if model_id.endswith("-GGUF"):
        return run_gguf(model_id, log)
    tok = AutoTokenizer.from_pretrained(model_id)
    t0 = time.time()
    model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.float32)
    model.eval()
    load = time.time() - t0
    params = sum(p.numel() for p in model.parameters())
    system = system_prompt()
    rows, right, gen_s, gen_tok = [], 0, 0.0, 0
    for text, total in ORDERS:
        msgs = [{"role": "system", "content": system}, {"role": "user", "content": text}]
        ids = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt")
        t1 = time.time()
        with torch.no_grad():
            out = model.generate(ids, max_new_tokens=220, do_sample=False)
        dt = time.time() - t1
        reply = tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True)
        got = total(reply)
        ok = got is not None and abs(got - total) < 0.01
        right += ok
        gen_s += dt
        gen_tok += out.shape[1] - ids.shape[1]
        rows.append({"order": text, "right_total": total, "model_total": got, "ok": ok, "seconds": round(dt, 1), "reply": reply})
        print(f"  {'OK ' if ok else 'BAD'} {text!r}: {got} (right {total}) {dt:.1f}s", flush=True)
    folder = Path(snapshot_download(model_id, local_files_only=True))
    size = sum(f.resolve().stat().st_size for f in folder.iterdir() if f.is_file())   # the download, in bytes
    res = {"model": model_id, "parameters": params, "download_gb": round(size / 1e9, 2), "right": right, "of": len(ORDERS),
           "load_seconds": round(load, 1),
           "seconds_per_bill": round(gen_s / len(ORDERS), 1), "tokens_per_second": round(gen_tok / gen_s, 1),
           "cpu_threads": torch.get_num_threads(), "rows": rows}
    log.append(res)
    print(f"{model_id}: {right}/{len(ORDERS)} right, {res['seconds_per_bill']} s per bill, {res['tokens_per_second']} tokens/s, "
          f"{params / 1e9:.2f} B parameters, {res['download_gb']} GB", flush=True)
    return res


def main(models):
    check()
    torch.set_num_threads(4)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "prices.tsv").write_text("item\tunit\trupees\n" + "\n".join(f"{n}\t{u}\t{p}" for n, u, p in PRICES) + "\n")
    (OUT / "orders.json").write_text(json.dumps([{"order": o, "right_total": t} for o, t in ORDERS], indent=1))
    log = []
    for mid in models or MODELS:
        res = run(mid, log)
        (OUT / f"results_{mid.split('/')[-1]}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print("DEMO_DONE", flush=True)


if __name__ == "__main__":
    rescore() if sys.argv[1:] == ["--rescore"] else main(sys.argv[1:])
