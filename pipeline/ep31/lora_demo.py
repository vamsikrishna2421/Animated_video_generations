# EP31 demo (real, run by us): teach a small free model a new skill with LoRA on a laptop-class CPU.
# Skill: turn a messy WhatsApp order into an order slip (JSON: name, phone, items [item, qty], address).
# Same model family as EP30 (HuggingFaceTB/SmolLM2-360M-Instruct, Apache-2.0). Synthetic orders, seeded.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep31/lora_demo.py [--train N] [--test N] [--epochs E]
import argparse
import json
import random
import re
import time
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep31_demo"
MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct"
PROMPT = "Turn this WhatsApp order into an order slip: JSON with name, phone, items (item, qty) and address.\n\nOrder: {msg}"

NAMES = ["Ravi", "Priya", "Sandeep", "Lakshmi", "Arjun", "Kavya", "Suresh", "Anjali", "Kiran", "Meena", "Rahul", "Divya",
         "Vikram", "Sneha", "Ajay", "Pooja", "Naveen", "Swathi", "Harish", "Deepa", "Manoj", "Keerthi", "Srinivas", "Bhavana",
         "Rajesh", "Lavanya", "Venkat", "Sirisha", "Prakash", "Madhavi", "Imran", "Fatima", "Joseph", "Mary", "Gopal", "Usha"]
ITEMS = [("tomatoes", ["1 kg", "2 kg", "500 g"]), ("onions", ["1 kg", "2 kg", "3 kg"]), ("eggs", ["1 dozen", "2 dozen", "30"]),
         ("milk", ["1 L", "2 L", "500 ml"]), ("rice", ["5 kg", "10 kg", "25 kg"]), ("atta", ["5 kg", "10 kg"]),
         ("curd", ["500 g", "1 kg"]), ("bananas", ["1 dozen", "2 dozen"]), ("chicken biryani", ["2 plates", "5 plates", "10 plates"]),
         ("samosas", ["10", "20", "50"]), ("paneer", ["250 g", "500 g", "1 kg"]), ("coriander", ["1 bunch", "2 bunches"]),
         ("potatoes", ["1 kg", "2 kg"]), ("sugar", ["1 kg", "2 kg"]), ("bread", ["1 packet", "2 packets"]), ("idli batter", ["1 kg", "2 kg"]),
         ("green chillies", ["100 g", "250 g"]), ("oil", ["1 L", "5 L"]), ("dal", ["1 kg", "2 kg"]), ("apples", ["1 kg", "2 kg"])]
UNITS = ["flat 302", "flat 1104", "H.No 4-12", "H.No 8-3-214", "plot 18", "door 7", "flat 5B", "villa 21", "room 9", "flat 207"]
BUILDINGS = ["Sai Residency", "Lakshmi Towers", "Green Park Apts", "Sri Krishna Nilayam", "Royal Heights", "Vasavi Enclave",
             "Sunrise Homes", "Balaji Complex", "Ganga Apartments", "My Home Avatar"]
AREAS = ["Kukatpally", "Ameerpet", "Madhapur", "Dilsukhnagar", "Gachibowli", "Miyapur", "Kondapur", "Begumpet", "Vijayawada",
         "Guntur", "Warangal", "Tirupati"]
FILL = ["bro", "anna", "sir", "akka", "", "", "ji"]
TEMPLATES = [
    "hi {fill} pls send {items} to {addr}. {name} {phone}",
    "{name} here. need {items}. address: {addr}. ph {phone}",
    "order: {items} | deliver to {addr} | contact {name} {phone} | thanks",
    "{fill} {items} kavali, {addr}, call {phone} - {name}",
    "Good morning! Can you deliver {items} by 7pm? {addr}. Name: {name}, mobile {phone}",
    "{phone} {name} {addr} -- {items} asap",
    "Hello, this is {name} ({phone}). Please send {items}. Address {addr}",
    "{items} to {addr} pls. {name}, {phone}. cash on delivery",
]


def phone_variants(rng, p):
    return rng.choice([p, p[:5] + " " + p[5:], "+91 " + p[:5] + " " + p[5:], "+91" + p, "0" + p])


def qty_variant(rng, q):   # how people type quantities ("2kg", "2 kgs", "1doz")
    return rng.choice([q, q.replace(" ", ""), q.replace("kg", "kgs"), q.replace("dozen", "doz"), q])


def make(rng):
    name = rng.choice(NAMES)
    phone = str(rng.choice("6789")) + "".join(str(rng.randint(0, 9)) for _ in range(9))
    picks = rng.sample(ITEMS, rng.randint(1, 3))
    items = [(it, rng.choice(qs)) for it, qs in picks]
    addr = f"{rng.choice(UNITS)}, {rng.choice(BUILDINGS)}, {rng.choice(AREAS)}"
    parts = []
    for it, q in items:
        qv = qty_variant(rng, q)
        parts.append(rng.choice([f"{qv} {it}", f"{it} {qv}", f"{it} - {qv}"]))
    items_txt = parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + rng.choice([" and ", ", ", " + "]) + parts[-1]
    msg = rng.choice(TEMPLATES).format(fill=rng.choice(FILL), items=items_txt, addr=addr, name=name, phone=phone_variants(rng, phone))
    msg = re.sub(r"\s+", " ", msg).strip()
    if rng.random() < 0.3:
        msg = msg.lower()
    ans = {"name": name, "phone": phone, "items": [{"item": it, "qty": q} for it, q in items], "address": addr}
    return msg, ans


def first_json(text):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    s = m.group(0)
    for end in range(len(s), 0, -1):   # trim trailing chatter after the object
        try:
            return json.loads(s[:end])
        except Exception:
            continue
    return None


def score(pred, gold):
    norm = lambda x: re.sub(r"\s+", " ", str(x)).strip().lower()
    if not isinstance(pred, dict):
        return {"valid": 0, "name": 0, "phone": 0, "address": 0, "items": 0, "all": 0}
    digits = re.sub(r"\D", "", str(pred.get("phone", "")))[-10:]
    try:
        pitems = {(norm(i.get("item")), norm(i.get("qty")).replace(" ", "")) for i in pred.get("items", [])}
    except Exception:
        pitems = set()
    gitems = {(norm(i["item"]), norm(i["qty"]).replace(" ", "")) for i in gold["items"]}
    r = {"valid": 1, "name": int(norm(pred.get("name")) == norm(gold["name"])), "phone": int(digits == gold["phone"]),
         "address": int(norm(pred.get("address")) == norm(gold["address"])), "items": int(pitems == gitems)}
    r["all"] = int(all(r[k] for k in ("name", "phone", "address", "items")))
    return r


def chat(tok, msg, ans=None):
    m = [{"role": "user", "content": PROMPT.format(msg=msg)}]
    p = tok.apply_chat_template(m, tokenize=False, add_generation_prompt=True)
    return p if ans is None else (p, json.dumps(ans, ensure_ascii=False) + tok.eos_token)


@torch.no_grad()
def evaluate(model, tok, test, tag):
    model.eval()
    rows, t0 = [], time.time()
    for msg, gold in test:
        ids = tok(chat(tok, msg), return_tensors="pt")
        out = model.generate(**ids, max_new_tokens=170, do_sample=False, pad_token_id=tok.eos_token_id)
        text = tok.decode(out[0, ids["input_ids"].shape[1]:], skip_special_tokens=True)
        rows.append({"msg": msg, "gold": gold, "out": text, "score": score(first_json(text), gold)})
    tot = {k: sum(r["score"][k] for r in rows) for k in ("valid", "name", "phone", "address", "items", "all")}
    print(f"[{tag}] {tot} of {len(rows)} ({time.time() - t0:.0f} s)", flush=True)
    return rows, tot


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", type=int, default=300)
    ap.add_argument("--test", type=int, default=30)
    ap.add_argument("--epochs", type=int, default=2)
    ap.add_argument("--rank", type=int, default=8)
    ap.add_argument("--bs", type=int, default=2)        # micro-batch; gradients accumulate to 8 examples per step
    ap.add_argument("--accum", type=int, default=4)
    ap.add_argument("--gc", type=int, default=0)        # 1 = gradient checkpointing (less memory, slower)
    a = ap.parse_args()
    torch.manual_seed(0)
    torch.set_num_threads(4)
    OUT.mkdir(parents=True, exist_ok=True)
    rng_train, rng_test = random.Random(31), random.Random(3100)
    train = [make(rng_train) for _ in range(a.train)]
    seen = {m for m, _ in train}
    test = []
    while len(test) < a.test:
        m, g = make(rng_test)
        if m not in seen:
            test.append((m, g))
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32)
    n_base = sum(p.numel() for p in model.parameters())
    before, tot_before = evaluate(model, tok, test, "before")

    from peft import LoraConfig, get_peft_model
    cfg = LoraConfig(r=a.rank, lora_alpha=2 * a.rank, lora_dropout=0.05, task_type="CAUSAL_LM",
                     target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
    if a.gc:
        model.gradient_checkpointing_enable()
        model.enable_input_require_grads()
    model = get_peft_model(model, cfg)
    n_train = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"base params {n_base:,}; LoRA trainable {n_train:,} = {100 * n_train / n_base:.2f}%", flush=True)

    # loss only on the answer tokens
    bs = a.bs
    enc = []
    for msg, ans in train:
        p, full = chat(tok, msg, ans)
        pi = tok(p, add_special_tokens=False)["input_ids"]
        ai = tok(full, add_special_tokens=False)["input_ids"]
        enc.append((pi + ai, [-100] * len(pi) + ai))
    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=2e-4)
    model.train()
    t0, step, losses, micro = time.time(), 0, [], 0
    for ep in range(a.epochs):
        random.Random(ep).shuffle(enc)
        for i in range(0, len(enc), bs):
            chunk = enc[i:i + bs]
            L = max(len(x) for x, _ in chunk)
            ids = torch.tensor([x + [tok.eos_token_id] * (L - len(x)) for x, _ in chunk])
            lab = torch.tensor([y + [-100] * (L - len(y)) for _, y in chunk])
            att = torch.tensor([[1] * len(x) + [0] * (L - len(x)) for x, _ in chunk])
            loss = model(input_ids=ids, attention_mask=att, labels=lab).loss
            (loss / a.accum).backward()
            micro += 1
            if micro % a.accum:
                continue
            opt.step()
            opt.zero_grad()
            step += 1
            losses.append(round(loss.item(), 4))
            if step % 5 == 0:
                print(f"epoch {ep + 1} step {step} loss {loss.item():.3f} ({time.time() - t0:.0f} s)", flush=True)
    train_s = time.time() - t0
    if a.gc:
        model.gradient_checkpointing_disable()
    after, tot_after = evaluate(model, tok, test, "after")
    adir = OUT / "adapter"
    model.save_pretrained(adir)
    a_bytes = sum(f.stat().st_size for f in adir.glob("*.safetensors"))
    from huggingface_hub import snapshot_download
    mdir = Path(snapshot_download(MODEL, allow_patterns=["*.safetensors"]))
    m_bytes = sum(f.stat().st_size for f in mdir.glob("*.safetensors"))
    res = {"model": MODEL, "train_examples": len(train), "test_examples": len(test), "epochs": a.epochs, "rank": a.rank,
           "steps": step, "train_seconds": round(train_s), "cpu_threads": 4, "base_params": n_base, "trainable_params": n_train,
           "trainable_pct": round(100 * n_train / n_base, 3), "adapter_mb": round(a_bytes / 1e6, 1), "model_mb": round(m_bytes / 1e6, 1),
           "before": tot_before, "after": tot_after, "losses": losses}
    (OUT / "results.json").write_text(json.dumps(res, indent=1))
    (OUT / "samples.json").write_text(json.dumps({"before": before[:10], "after": after[:10]}, ensure_ascii=False, indent=1))
    print("RESULTS", json.dumps({k: v for k, v in res.items() if k != "losses"}), flush=True)


if __name__ == "__main__":
    main()
