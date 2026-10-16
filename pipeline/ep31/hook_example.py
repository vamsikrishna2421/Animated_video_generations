# The order shown in EP31's hook: one more order through the same models (plain prompt, untrained vs. the 16-bit LoRA skill
# file), with a phone number no real phone can have (Indian mobiles start with 6-9) and an address that exists as a pattern
# only. Writes series/scripts/ep31_demo/hook_example.json.   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep31/hook_example.py
import json
import sys
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lora_demo import MODEL, OUT, chat, first_json, score  # noqa: E402

MSG = "hi pls send onions 1kg, milk 1 L to flat 302, Sai Residency, Kukatpally. Arjun 55555 01234"
GOLD = {"name": "Arjun", "phone": "5555501234", "items": [{"item": "onions", "qty": "1 kg"}, {"item": "milk", "qty": "1 L"}],
        "address": "flat 302, Sai Residency, Kukatpally"}


@torch.no_grad()
def run(model, tok):
    ids = tok(chat(tok, MSG), return_tensors="pt")
    out = model.generate(**ids, max_new_tokens=170, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0, ids["input_ids"].shape[1]:], skip_special_tokens=True)


torch.set_num_threads(4)
tok = AutoTokenizer.from_pretrained(MODEL)
base = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32)
before = run(base, tok)
from peft import PeftModel  # noqa: E402
after = run(PeftModel.from_pretrained(base, OUT / "adapter16"), tok)
res = {"msg": MSG, "gold": GOLD, "before": before, "after": after,
       "score_before": score(first_json(before), GOLD), "score_after": score(first_json(after), GOLD)}
(OUT / "hook_example.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
print(json.dumps(res, ensure_ascii=False, indent=1))
