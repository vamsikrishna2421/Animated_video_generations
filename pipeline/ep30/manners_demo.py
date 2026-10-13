# Plain greedy decoding (no repetition penalty) for the hook quotes; 3 sampled runs too. python3 manners_demo2.py
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
Q = "Is my business idea good? I want to sell ice to people in Antarctica."
for name in ("HuggingFaceTB/SmolLM2-360M", "HuggingFaceTB/SmolLM2-360M-Instruct"):
    tok = AutoTokenizer.from_pretrained(name)
    m = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.float32)
    if "nstruct" in name:
        ids = tok.apply_chat_template([{"role": "user", "content": Q}], add_generation_prompt=True, return_tensors="pt")
    else:
        ids = tok(Q + "\n", return_tensors="pt").input_ids
    att = torch.ones_like(ids)
    out = m.generate(ids, attention_mask=att, max_new_tokens=60, do_sample=False, pad_token_id=tok.eos_token_id)
    print(f"=== {name} | plain greedy\n{tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True).strip()}\n", flush=True)
    for s in range(3):
        torch.manual_seed(s)
        out = m.generate(ids, attention_mask=att, max_new_tokens=40, do_sample=True, temperature=0.7, top_p=0.9, pad_token_id=tok.eos_token_id)
        print(f"--- sample seed {s}: {tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True).strip()[:220]}", flush=True)
    print()
