# Creative 04 demo (few-shot prompting): a tea stall's post written by a free open model three ways, 10 tries each.
#   fancy:    "Make it fancy."
#   simple:   "Keep it simple and friendly."
#   examples: three of the owner's own old posts first, then "write today's post like these" (no price given).
#   examples_mix: the same, asking for "the same style and the same Telugu-English mix" (no price given).
#   examples_price: the same as examples_mix, with today's price in the prompt (Rs 15).
# Counted per try: fancy words (indulge, elixir, artisanal...), the owner's words (his Telugu-in-English phrases), and
# whether the post carries last year's price from his examples (Rs 10; the tea is Rs 15 now and the prompt never says).
# Qwen2.5-7B-Instruct (Apache 2.0), Qwen's own 4-bit GGUF, llama.cpp on the laptop CPU, temperature 0.8, seeds 1-10.
# Writes series/scripts/skit04_demo/results.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit04/caption_demo.py [prompt keys ...]
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/skit04_demo"
REPO = "Qwen/Qwen2.5-7B-Instruct-GGUF"
OLD_POSTS = [
    "Morning 6 ki stall open! Hot hot allam tea Rs 10 only. Office ki velle mundu oka cup taagi vellandi",
    "Varsham padutundi. Mirchi bajji + tea combo Rs 30. Fast ga randi, bajji ayipotundi!",
    "Sunday special: Irani chai Rs 10. Friends tho randi, bench ready",
]
BASE = "Write an Instagram post for my roadside tea stall in Hyderabad. Today's special: ginger tea."
PROMPTS = {
    "fancy": BASE + " Make it fancy.",
    "simple": BASE + " Keep it simple and friendly.",
    "examples": ("Here are three posts I wrote before for my roadside tea stall in Hyderabad:\n"
                 + "\n".join(f"{i + 1}. {p}" for i, p in enumerate(OLD_POSTS))
                 + "\n\nWrite today's post like these. Today's special: ginger tea."),
}
_SHOW = ("Here are three posts I wrote before for my roadside tea stall in Hyderabad:\n"
         + "\n".join(f"{i + 1}. {p}" for i, p in enumerate(OLD_POSTS)))
PROMPTS["examples_mix"] = _SHOW + ("\n\nWrite today's post in the same style and the same Telugu-English mix as these. "
                                   "Today's special: ginger tea.")
PROMPTS["examples_price"] = _SHOW + ("\n\nWrite today's post in the same style and the same Telugu-English mix as these. "
                                     "Today's special: ginger tea, Rs 15.")
FANCY = ["indulge", "elixir", "artisanal", "symphony", "exquisite", "embrace", "aromatic", "divine", "delight", "savor",
         "savour", "luxur", "decadent", "enchant", "magical", "bliss", "sublime", "infused", "experience the"]
HIS = ["ki ", " ga ", "randi", " tho ", "oka ", "padutundi", "vellandi", "taagi", "ayipotundi", "allam", "hot hot", "ready"]
OLD_PRICE = re.compile(r"(rs\.?\s*10\b|₹\s*10\b|\b10\s*(rs|rupees|/-))", re.I)
NEW_PRICE = re.compile(r"(rs\.?\s*15\b|₹\s*15\b|\b15\s*(rs|rupees|/-))", re.I)


def main(keys):
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    folder = Path(snapshot_download(REPO, allow_patterns=["*q4_k_m*.gguf"]))
    parts = sorted(folder.glob("*q4_k_m*.gguf"))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_ctx=2048, verbose=False, seed=0)
    OUT.mkdir(parents=True, exist_ok=True)
    old = OUT / "results.json"
    res = json.loads(old.read_text()) if old.exists() else {"runs": {}}   # resume: keeps the prompts already run
    res.update({"model": REPO + " (q4_k_m)", "temperature": 0.8, "tries": 10, "old_posts": OLD_POSTS, "prompts": PROMPTS})
    for key, prompt in PROMPTS.items():
        if keys and key not in keys:
            continue
        rows = []
        for seed in range(1, 11):
            t0 = time.time()
            out = llm.create_chat_completion([{"role": "user", "content": prompt}], temperature=0.8, max_tokens=160, seed=seed)
            text = out["choices"][0]["message"]["content"].strip()
            low = " " + text.lower() + " "
            rows.append({"seed": seed, "text": text, "seconds": round(time.time() - t0, 1),
                         "fancy_words": [w for w in FANCY if w in low], "his_words": [w.strip() for w in HIS if w in low],
                         "old_price": bool(OLD_PRICE.search(text)), "new_price": bool(NEW_PRICE.search(text))})
            r = rows[-1]
            print(f"{key:8s} {seed:2d} fancy={len(r['fancy_words'])} his={len(r['his_words'])} old={r['old_price']} | {text[:90]!r}", flush=True)
        res["runs"][key] = {"rows": rows,
                            "with_fancy_words": sum(bool(r["fancy_words"]) for r in rows),
                            "with_his_words_2plus": sum(len(r["his_words"]) >= 2 for r in rows),
                            "with_old_price": sum(r["old_price"] for r in rows),
                            "with_new_price": sum(r["new_price"] for r in rows)}
        (OUT / "results.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    for k, v in res["runs"].items():
        print(k, {kk: vv for kk, vv in v.items() if kk != "rows"})


if __name__ == "__main__":
    main(set(sys.argv[1:]))
