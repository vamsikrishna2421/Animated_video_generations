# Creative 24 demo, "the same question, more tokens" (written and committed before it ran): an AI reads text as tokens
# (chunks), and many tokenizers cut Telugu into far more pieces than English. Five everyday questions, each in English
# and in Telugu (the same meaning), counted with three real tokenizers, fixed before the run:
#   cl100k_base : the open tokenizer of an older OpenAI model family (tiktoken)
#   o200k_base  : the open tokenizer of a newer OpenAI model family (tiktoken)
#   Qwen2.5     : the tokenizer of the open Qwen2.5 models (Hugging Face, Qwen/Qwen2.5-7B-Instruct)
# For each tokenizer: tokens per sentence, and the Telugu / English ratio over all five. Plain counting, no AI answers.
# Writes series/scripts/creative24_demo/tokens.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative24/token_demo.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative24_demo"
PAIRS = [
    ("Can you explain why my electricity bill is so high this month?",
     "ఈ నెల నా కరెంట్ బిల్లు ఎందుకు ఇంత ఎక్కువ వచ్చిందో చెప్పగలవా?"),
    ("Please write a birthday wish for my grandmother who is turning eighty.",
     "ఎనభై ఏళ్లు నిండుతున్న మా అమ్మమ్మకి ఒక పుట్టినరోజు శుభాకాంక్ష రాసి ఇవ్వు."),
    ("What documents do I need to open a bank account?",
     "బ్యాంక్ అకౌంట్ తెరవడానికి నాకు ఏ పత్రాలు కావాలి?"),
    ("Read this letter from the school and tell me what I have to do.",
     "స్కూల్ నుంచి వచ్చిన ఈ ఉత్తరం చదివి, నేను ఏం చేయాలో చెప్పు."),
    ("My train is late by three hours. Can I get a refund?",
     "నా ట్రైన్ మూడు గంటలు లేటు. నాకు రిఫండ్ వస్తుందా?"),
]


def counters():
    import tiktoken
    from transformers import AutoTokenizer
    out = {}
    for name in ("cl100k_base", "o200k_base"):
        enc = tiktoken.get_encoding(name)
        out[name] = (lambda e: (lambda t: [e.decode([i]) for i in e.encode(t)]))(enc)
    qt = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct")
    out["Qwen2.5"] = lambda t: [qt.decode([i]) for i in qt.encode(t, add_special_tokens=False)]
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    res = {"pairs": [{"en": en, "te": te} for en, te in PAIRS], "tokenizers": {}}
    for name, split in counters().items():
        rows = []
        for en, te in PAIRS:
            e, t = split(en), split(te)
            rows.append({"en_tokens": len(e), "te_tokens": len(t), "en_pieces": e, "te_pieces": t})
        en_sum, te_sum = sum(r["en_tokens"] for r in rows), sum(r["te_tokens"] for r in rows)
        res["tokenizers"][name] = {"rows": rows, "en_total": en_sum, "te_total": te_sum, "ratio": round(te_sum / en_sum, 2)}
        print(name, [(r["en_tokens"], r["te_tokens"]) for r in rows], "total", en_sum, te_sum, "ratio", round(te_sum / en_sum, 2))
    (OUT / "tokens.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
