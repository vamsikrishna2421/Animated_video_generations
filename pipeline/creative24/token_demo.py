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


# Added after the script review (committed before it runs): a viewer asked "what if I type Telugu in English letters?"
# The same five questions as people type them on WhatsApp (Telugu in Latin letters), counted the same way.
TENGLISH = [
    "Ee nela naa current bill enduku inta ekkuva vachindo cheppagalavaa?",
    "Enabhai ellu nindutunna maa ammammaki oka puttinaroju shubhakankshalu raasi ivvu.",
    "Bank account teravadaaniki naaku e patraalu kaavaali?",
    "School nunchi vachina ee uttaram chadivi, nenu em cheyyalo cheppu.",
    "Naa train moodu gantalu late. Naaku refund vastundaa?",
]


# Added after the render review (committed before it runs): "rerun this on current models, not 2024 tokenizers". OpenAI's own
# tiktoken library (v0.14.0) maps its current models (gpt-4o, gpt-4.1, o3, gpt-5) to o200k_base, so the "newer" count
# already covers today's ChatGPT models; the open model we named is from 2024, so the same five pairs are counted with
# the tokenizer of the newer open Qwen3 models (2025, Hugging Face, Qwen/Qwen3-8B). Writes tokens_current.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative24/token_demo.py --current
def current():
    import tiktoken.model as tm
    from transformers import AutoTokenizer
    qt = AutoTokenizer.from_pretrained("Qwen/Qwen3-8B")
    split = lambda t: [qt.decode([i]) for i in qt.encode(t, add_special_tokens=False)]
    rows = [{"en_tokens": len(split(en)), "te_tokens": len(split(te))} for en, te in PAIRS]
    en_sum, te_sum = sum(r["en_tokens"] for r in rows), sum(r["te_tokens"] for r in rows)
    tl = [len(split(t)) for t in TENGLISH]
    res = {"openai_model_map": {m: tm.encoding_name_for_model(m) for m in ("gpt-4", "gpt-3.5-turbo", "gpt-4o", "gpt-4.1", "o3", "gpt-5")},
           "Qwen3": {"rows": rows, "en_total": en_sum, "te_total": te_sum, "ratio": round(te_sum / en_sum, 2),
                     "tenglish_total": sum(tl), "tenglish_ratio": round(sum(tl) / en_sum, 2)}}
    print(json.dumps(res, indent=1))
    (OUT / "tokens_current.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))


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
    res = {"pairs": [{"en": en, "te": te} for en, te in PAIRS], "tenglish": TENGLISH, "tokenizers": {}}
    for name, split in counters().items():
        rows = []
        for en, te in PAIRS:
            e, t = split(en), split(te)
            rows.append({"en_tokens": len(e), "te_tokens": len(t), "en_pieces": e, "te_pieces": t})
        en_sum, te_sum = sum(r["en_tokens"] for r in rows), sum(r["te_tokens"] for r in rows)
        tl = [len(split(t)) for t in TENGLISH]
        res["tokenizers"][name] = {"rows": rows, "en_total": en_sum, "te_total": te_sum, "ratio": round(te_sum / en_sum, 2),
                                   "tenglish_tokens": tl, "tenglish_total": sum(tl), "tenglish_ratio": round(sum(tl) / en_sum, 2)}
        print(name, [(r["en_tokens"], r["te_tokens"]) for r in rows], "total", en_sum, te_sum, "ratio", round(te_sum / en_sum, 2),
              "| tenglish", tl, sum(tl), round(sum(tl) / en_sum, 2))
    (OUT / "tokens.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    import sys
    current() if "--current" in sys.argv else main()
