# EP31 follow-up checks on the same 30 test orders (pipeline/ep31/lora_demo.py):
#  1. "Did you try a better prompt first?": the untrained model with two worked examples in the prompt (few-shot).
#  2. The skill file in 16-bit (the model file is 16-bit too, so the sizes compare like for like): save the LoRA weights
#     as bfloat16, reload them, and score again.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep31/extra_checks.py
import json
import random
import sys
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lora_demo import MODEL, OUT, PROMPT, evaluate, make  # noqa: E402


def few_shot_chat(shots):
    def chat(tok, msg, ans=None):
        m = []
        for smsg, sans in shots:
            m += [{"role": "user", "content": PROMPT.format(msg=smsg)}, {"role": "assistant", "content": json.dumps(sans, ensure_ascii=False)}]
        m.append({"role": "user", "content": PROMPT.format(msg=msg)})
        return tok.apply_chat_template(m, tokenize=False, add_generation_prompt=True)
    return chat


def main():
    torch.manual_seed(0)
    torch.set_num_threads(4)
    rng_train, rng_test = random.Random(31), random.Random(3100)
    train = [make(rng_train) for _ in range(240)]
    seen = {m for m, _ in train}
    test = []
    while len(test) < 30:
        m, g = make(rng_test)
        if m not in seen:
            test.append((m, g))
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32)
    res = json.loads((OUT / "results.json").read_text())

    import lora_demo
    shots = [train[0], train[1]]   # two worked examples from the training set, same instruction
    lora_demo.chat = few_shot_chat(shots)
    fs_rows, fs_tot = evaluate(model, tok, test, "few-shot prompt, untrained")
    res["few_shot_untrained"] = fs_tot
    res["few_shot_examples"] = [{"msg": m, "ans": a} for m, a in shots]
    lora_demo.chat = few_shot_chat([])   # back to the plain prompt

    from peft import PeftModel
    pm = PeftModel.from_pretrained(model, OUT / "adapter")
    for n, p in pm.named_parameters():
        if "lora_" in n:
            p.data = p.data.to(torch.bfloat16).to(torch.float32)   # the values a 16-bit file holds
    d16 = OUT / "adapter16"
    pm.save_pretrained(d16)
    from safetensors.torch import load_file, save_file
    f = d16 / "adapter_model.safetensors"
    save_file({k: v.to(torch.bfloat16) for k, v in load_file(str(f)).items()}, str(f))
    del pm, model
    base = AutoModelForCausalLM.from_pretrained(MODEL, torch_dtype=torch.float32)
    pm = PeftModel.from_pretrained(base, d16)
    rows16, tot16 = evaluate(pm, tok, test, "after, 16-bit skill file")
    res["after_16bit"] = tot16
    res["adapter16_mb"] = round(sum(x.stat().st_size for x in d16.glob("*.safetensors")) / 1e6, 1)
    (OUT / "results.json").write_text(json.dumps(res, indent=1))
    (OUT / "samples_extra.json").write_text(json.dumps({"few_shot": fs_rows[:10], "after_16bit_misses": [r for r in rows16 if not r["score"]["all"]]}, ensure_ascii=False, indent=1))
    print("EXTRA", json.dumps({k: res[k] for k in ("few_shot_untrained", "after_16bit", "adapter16_mb")}), flush=True)


if __name__ == "__main__":
    main()
