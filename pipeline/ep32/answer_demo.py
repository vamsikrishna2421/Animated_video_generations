# EP32 demo, last step (the "G" in RAG): a small free model writes the answer from the top 3 pieces that meaning search
# + the reranker found, vs. the same model with no pieces. SmolLM2 (Apache-2.0): the 360M model of EP30/EP31 misread
# the right page, so the episode uses the 1.7B sibling; both runs are kept. Writes series/scripts/ep32_demo/answers_<size>.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep32/answer_demo.py [360M|1.7B]
import json
import sys
from pathlib import Path

import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rag_demo import D, QPREFIX, Embedder, Reranker, chunkings, parse  # noqa: E402

SIZE = sys.argv[1] if len(sys.argv) > 1 else "1.7B"
LLM = f"HuggingFaceTB/SmolLM2-{SIZE}-Instruct"
QUESTIONS = ["Will my phone survive a shower?", "Is there a charger in the box?", "Can I give it back if I just don't like it?"]
WITH = "Answer the question using only these pieces of the K7 phone manual. Answer in one or two short sentences.\n\n{ctx}\n\nQuestion: {q}"
WITHOUT = "Answer the question about the K7 phone in one or two short sentences.\n\nQuestion: {q}"


def main():
    chapters, sections = parse((D / "manual.md").read_text())
    pieces = [c["text"] for c in chunkings(chapters, sections)["section"]]
    emb, rer = Embedder(), Reranker()
    pv = emb(pieces)
    tok = AutoTokenizer.from_pretrained(LLM)
    llm = AutoModelForCausalLM.from_pretrained(LLM, torch_dtype=torch.float32).eval()

    def ask(prompt):
        ids = tok.apply_chat_template([{"role": "user", "content": prompt}], add_generation_prompt=True, return_tensors="pt")
        with torch.no_grad():
            out = llm.generate(ids, max_new_tokens=80, do_sample=False, pad_token_id=tok.eos_token_id)
        return tok.decode(out[0, ids.shape[1]:], skip_special_tokens=True).strip()

    rows = []
    for q in QUESTIONS:
        order = list(np.argsort(-(pv @ emb([QPREFIX + q])[0]), kind="stable"))[:10]
        sc = rer(q, [pieces[j] for j in order])
        top3 = [pieces[order[j]] for j in np.argsort(-sc, kind="stable")[:3]]
        row = {"q": q, "pieces": top3, "with_pieces": ask(WITH.format(ctx="\n\n".join(top3), q=q)), "no_pieces": ask(WITHOUT.format(q=q))}
        print(json.dumps(row, ensure_ascii=False, indent=1), flush=True)
        rows.append(row)
    (D / f"answers_{SIZE}.json").write_text(json.dumps({"model": LLM, "prompt_with": WITH, "prompt_without": WITHOUT, "rows": rows},
                                               indent=1, ensure_ascii=False))
    print("wrote", D / f"answers_{SIZE}.json")


if __name__ == "__main__":
    main()
