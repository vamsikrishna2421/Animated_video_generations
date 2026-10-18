# EP32 demo (real, run by us): how an AI finds the right page in a document (the "R" in RAG).
# A made-up 45-section phone manual (series/scripts/ep32_demo/manual.md) and 30 everyday questions (questions.json);
# a hit = the retrieved chunk contains that question's answer sentence piece. Compares keyword search (BM25), meaning
# search (embeddings) and meaning search + a reranker, at four chunk sizes. Small free models, CPU only.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep32/rag_demo.py
import json
import math
import re
import time
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from transformers import AutoModel, AutoModelForSequenceClassification, AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / "series/scripts/ep32_demo"
EMB = "BAAI/bge-small-en-v1.5"                    # 33M parameters, MIT licence
RER = "cross-encoder/ms-marco-MiniLM-L-6-v2"      # 22M parameters, Apache-2.0
QPREFIX = "Represent this sentence for searching relevant passages: "   # bge's query instruction
STOP = set("a an the and or of to in on for with is are be it its this that you your my i me can do does how what when "
           "will if at by from as so not no".split())


def parse(md):
    chapters, sections, ch = [], [], None
    for block in re.split(r"\n(?=#)", md.strip()):
        head, _, body = block.partition("\n")
        if head.startswith("## "):
            m = re.match(r"## (\d+)\. (.+)", head)
            sections.append({"n": int(m.group(1)), "title": m.group(2).strip(), "text": body.strip(), "chapter": ch})
        elif head.startswith("# "):
            ch = head[2:].strip()
            chapters.append(ch)
    return chapters, sections


def sentences(text):
    return [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s]


def chunkings(chapters, sections):
    out = {"chapter": [], "section": [], "sentence": [], "window40": []}
    for ch in chapters:
        secs = [s for s in sections if s["chapter"] == ch]
        out["chapter"].append({"text": ch + "\n" + "\n".join(f"{s['title']}. {s['text']}" for s in secs), "secs": [s["n"] for s in secs]})
    for s in sections:
        out["section"].append({"text": f"{s['title']}. {s['text']}", "secs": [s["n"]]})
        for x in sentences(s["text"]):
            out["sentence"].append({"text": x, "secs": [s["n"]]})
    words = [(w, s["n"]) for s in sections for w in f"{s['title']}. {s['text']}".split()]
    for i in range(0, len(words), 40):   # fixed 40-word pieces that ignore sentences and headings
        part = words[i:i + 40]
        out["window40"].append({"text": " ".join(w for w, _ in part), "secs": sorted({n for _, n in part})})
    out["window40_overlap20"] = []   # the same pieces with a 20-word overlap (the usual fix for cut-off sentences)
    for i in range(0, max(1, len(words) - 20), 20):
        part = words[i:i + 40]
        out["window40_overlap20"].append({"text": " ".join(w for w, _ in part), "secs": sorted({n for _, n in part})})
    return out


def norm(t):
    return re.sub(r"\s+", " ", t.lower())


def toks(t):
    return [w for w in re.findall(r"[a-z0-9]+", t.lower()) if w not in STOP]


class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.d = [toks(x) for x in docs]
        self.avg = sum(map(len, self.d)) / len(self.d)
        df = Counter(w for doc in self.d for w in set(doc))
        n = len(self.d)
        self.idf = {w: math.log(1 + (n - f + 0.5) / (f + 0.5)) for w, f in df.items()}
        self.tf = [Counter(doc) for doc in self.d]
        self.k1, self.b = k1, b

    def scores(self, q):
        out = []
        for tf, doc in zip(self.tf, self.d):
            s = 0.0
            for w in toks(q):
                if w in tf:
                    f = tf[w]
                    s += self.idf[w] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(doc) / self.avg))
            out.append(s)
        return np.array(out)


class Embedder:
    def __init__(self):
        self.tok = AutoTokenizer.from_pretrained(EMB)
        self.m = AutoModel.from_pretrained(EMB).eval()

    @torch.no_grad()
    def __call__(self, texts, bs=32):
        vs = []
        for i in range(0, len(texts), bs):
            enc = self.tok(texts[i:i + bs], padding=True, truncation=True, max_length=512, return_tensors="pt")
            v = self.m(**enc).last_hidden_state[:, 0]   # CLS pooling, as bge recommends
            vs.append(torch.nn.functional.normalize(v, dim=-1).numpy())
        return np.concatenate(vs)


class Reranker:
    def __init__(self):
        self.tok = AutoTokenizer.from_pretrained(RER)
        self.m = AutoModelForSequenceClassification.from_pretrained(RER).eval()

    @torch.no_grad()
    def __call__(self, q, texts):
        enc = self.tok([q] * len(texts), texts, padding=True, truncation=True, max_length=512, return_tensors="pt")
        return self.m(**enc).logits[:, 0].numpy()


def main():
    chapters, sections = parse((D / "manual.md").read_text())
    qs = json.loads((D / "questions.json").read_text())
    for q in qs:
        assert norm(q["answer"]) in norm(next(s["text"] for s in sections if s["n"] == q["section"])), q
    ck = chunkings(chapters, sections)
    emb, rer = Embedder(), Reranker()
    t0 = time.time()
    qv = emb([QPREFIX + q["q"] for q in qs])
    results = {"models": {"embedder": EMB, "reranker": RER}, "manual": {"sections": len(sections), "chapters": len(chapters),
               "words": sum(len(f"{s['title']}. {s['text']}".split()) for s in sections)}, "runs": {}, "examples": {}}
    for name, chunks in ck.items():
        texts = [c["text"] for c in chunks]
        bm = BM25(texts)
        t1 = time.time()
        cv = emb(texts)
        t_index = time.time() - t1
        for method in ("keyword", "meaning", "meaning+rerank"):
            hit1 = hit3 = 0
            words3, lat, rows = [], [], []
            for i, q in enumerate(qs):
                t2 = time.time()
                if method == "keyword":
                    order = list(np.argsort(-bm.scores(q["q"]), kind="stable"))
                else:
                    order = list(np.argsort(-(cv @ qv[i]), kind="stable"))
                    if method == "meaning+rerank":
                        top = order[:10]
                        sc = rer(q["q"], [texts[j] for j in top])
                        order = [top[j] for j in np.argsort(-sc, kind="stable")] + order[10:]
                lat.append(time.time() - t2)
                got = [norm(q["answer"]) in norm(texts[j]) for j in order[:3]]
                hit1 += got[0]
                hit3 += any(got)
                words3.append(sum(len(texts[j].split()) for j in order[:3]))
                rows.append({"q": q["q"], "hit1": bool(got[0]), "top1": texts[order[0]][:300], "top1_secs": chunks[order[0]]["secs"]})
            results["runs"][f"{name}/{method}"] = {"chunks": len(chunks), "hit1": hit1, "hit3": hit3, "of": len(qs),
                                                   "avg_words_top3": round(float(np.mean(words3)), 1),
                                                   "ms_per_question": round(1000 * float(np.mean(lat)), 1),
                                                   "index_seconds": round(t_index, 2) if method != "keyword" else None}
            results["examples"][f"{name}/{method}"] = rows
            r = results["runs"][f"{name}/{method}"]
            print(f"{name:9s} {method:15s} chunks {len(chunks):3d}  top-1 {hit1:2d}/30  top-3 {hit3:2d}/30  "
                  f"words sent (top 3) {r['avg_words_top3']:6.1f}  {r['ms_per_question']:6.1f} ms/question", flush=True)
    results["total_seconds"] = round(time.time() - t0, 1)
    (D / "results.json").write_text(json.dumps(results, indent=1, ensure_ascii=False))
    print("wrote", D / "results.json")


if __name__ == "__main__":
    main()
