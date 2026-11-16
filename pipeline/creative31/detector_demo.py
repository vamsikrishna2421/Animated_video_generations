# Creative 31 demo (written and committed before it ran): do free AI-text detectors call human writing "AI"?
# Two detectors anyone can download from Hugging Face (no account):
#   D1 openai-community/roberta-base-openai-detector  (OpenAI's 2019 detector for GPT-2 text; labels Real / Fake)
#   D2 Hello-SimpleAI/chatgpt-detector-roberta         (trained on ChatGPT answers, 2023; labels Human / ChatGPT)
# Human texts, all written long before chat AIs (public domain):
#   H1 the Preamble to the Constitution of India as adopted on 26 Nov 1949 (the original wording, before 1976)
#   H2 Rabindranath Tagore, "Where the mind is without fear" (Gitanjali 35, English, 1912)
#   H3 the opening of the US Declaration of Independence (1776)
#   H4 Aesop, "The Fox and the Grapes" (George Fyler Townsend's translation, 1867): plain, simple English
# AI texts (controls): real replies a small free AI (Qwen2.5-7B-Instruct) wrote in our own earlier tests, saved in this
# repo, the first 600 characters of each: A1-A3 its step-by-step EMI working (series/scripts/creative30_demo/emi.json).
# For each text and detector: the probability the detector gives for "AI" (Fake / ChatGPT). Called "AI" if over 0.5.
# Writes series/scripts/creative31_demo/detector.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative31/detector_demo.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative31_demo"
HUMAN = {
    "H1 Preamble of India (1949)": (
        "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN DEMOCRATIC REPUBLIC and to "
        "secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith "
        "and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of "
        "the individual and the unity of the Nation; IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do "
        "HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION."),
    "H2 Tagore, Where the mind is without fear (1912)": (
        "Where the mind is without fear and the head is held high; Where knowledge is free; Where the world has not been "
        "broken up into fragments by narrow domestic walls; Where words come out from the depth of truth; Where tireless "
        "striving stretches its arms towards perfection; Where the clear stream of reason has not lost its way into the "
        "dreary desert sand of dead habit; Where the mind is led forward by thee into ever-widening thought and action; Into "
        "that heaven of freedom, my Father, let my country awake."),
    "H3 US Declaration of Independence (1776)": (
        "When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have "
        "connected them with another, and to assume among the powers of the earth, the separate and equal station to which the "
        "Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should "
        "declare the causes which impel them to the separation. We hold these truths to be self-evident, that all men are "
        "created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, "
        "Liberty and the pursuit of Happiness."),
    "H4 Aesop, The Fox and the Grapes (1867)": (
        "A famished fox saw some clusters of ripe black grapes hanging from a trellised vine. She resorted to all her tricks to "
        "get at them, but wearied herself in vain, for she could not reach them. At last she turned away, hiding her "
        "disappointment and saying: \"The Grapes are sour, and not ripe as I thought.\""),
}
DETECTORS = {"D1": ("openai-community/roberta-base-openai-detector", "Fake"),
             "D2": ("Hello-SimpleAI/chatgpt-detector-roberta", "ChatGPT")}
HAND = {}   # filled in after the run


def ai_texts():
    rows = json.loads((ROOT / "series/scripts/creative30_demo/emi.json").read_text())["rows"]
    steps = [r for r in rows if r["mode"] == "steps"]
    return {f"A{i + 1} small AI's EMI working ({steps[k]['what']})": steps[k]["reply"][:600] for i, k in enumerate((0, 3, 7))}


def main():
    from transformers import pipeline
    OUT.mkdir(parents=True, exist_ok=True)
    texts = {**HUMAN, **ai_texts()}
    rows = []
    for dk, (name, ai_label) in DETECTORS.items():
        clf = pipeline("text-classification", model=name, top_k=None, truncation=True)
        for tk, t in texts.items():
            scores = {d["label"]: round(float(d["score"]), 4) for d in clf(t)[0]}
            p_ai = scores.get(ai_label, 0.0)
            rows.append({"detector": dk, "model": name, "text": tk, "human": tk.startswith("H"), "p_ai": p_ai,
                         "called_ai": p_ai > 0.5, "scores": scores, "chars": len(t)})
            print(dk, tk, "p_ai", p_ai, "AI" if p_ai > 0.5 else "human", flush=True)
    (OUT / "detector.json").write_text(json.dumps({"texts": texts, "detectors": DETECTORS, "rows": rows}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
