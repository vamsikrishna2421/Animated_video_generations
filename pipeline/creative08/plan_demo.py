# Creative 08 demo: does "ask me 3 questions first" change what a chatbot plans? A free open model
# (Qwen2.5-7B-Instruct, Qwen's own 4-bit GGUF, q4_k_m) with llama.cpp on this machine's CPU, 10 tries per way:
#   plain    - "Plan a surprise for my parents' 25th wedding anniversary."
#   ask      - the same + "Before you plan, ask me 3 questions."
#   answered - the ask conversation (its own questions, same seed) + Teja's answers: what they love, home, Rs 5,000
# Every reply is read by hand (HAND); the regexes only pre-sort.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/creative08/plan_demo.py
#   python3 pipeline/creative08/plan_demo.py --summary     (re-reads the results, no model)
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/creative08_demo"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
ASK = "Plan a surprise for my parents' 25th wedding anniversary."
TRICK = " Before you plan, ask me 3 questions."
# Teja's answers in the skit (line 8): what they love, the place, the size and the budget (the model's own questions
# were about their interests, a special place and the kind of celebration; it never asked the budget, so he adds it)
ANSWERS = ("Amma loves old Telugu film songs, and Nanna loves pesarattu. The place: our own terrace at home, because Nanna "
           "hates traffic. Small, just the family, and 5,000 rupees in total. Now plan it.")
PROMPTS = {"plain": ASK, "ask": ASK + TRICK}
MAX_TOKENS = {"plain": 380, "ask": 200, "answered": 380}
SEEDS = range(10)
# pre-sort only; the counts in the summary come from the hand reading below
COSTLY = re.compile(r"\b(hotel|resort|getaway|trip|travel|vacation|destination|cruise|spa|limo|limousine|flight|"
                    r"five-star|5-star|luxury|hire|hired|caterer|catering|photographer|band|dj|venue|banquet|restaurant)\b", re.I)
PLAN = re.compile(r"(^|\n)\s*(\*\*)?(step|day|morning|evening|\d+\.)", re.I)
# Read by hand, every reply (Oct 24). plain: asked_first = asked us anything before planning (a rhetorical question inside
# the plan doesn't count); party = the generic party plan (a guest list or invitations, and a venue: "home, a restaurant or
# a hall"); hire = told us to hire someone (a caterer, a chef, a band or DJ). ask: asked_first = asked before planning (and
# gave no plan); topics = what its three questions were about; budget_q = one of them asked the budget. answered: used =
# at home (the terrace), with the songs and the pesarattu; hire = still told us to pay for help (a DJ, a band, a singer, a
# caterer, a photographer); budget = said the plan keeps to Rs 5,000; album = a photo album or slideshow (replies stop at
# 380 tokens, so a lower bound); lang = switched language; fits = used, no hire, no switch.
P = lambda party=True, hire=False, note="": {"asked_first": False, "party": party, "hire": hire, "note": note}
A = lambda topics, budget=False: {"asked_first": True, "topics": topics, "budget_q": budget}
W = lambda hire=False, budget=False, album=False, lang=False, note="": {"used": True, "hire": hire, "budget": budget, "album": album, "lang": lang,
                                                                     "fits": not hire and not lang, "note": note}
HAND = {
    ("plain", 0): P(note="guest list, invitations; venue: home, a restaurant or 'a venue'; told us to decide a budget"),
    ("plain", 1): P(note="invitations; home, a park or a restaurant; a photo book; told us to decide a budget"),
    ("plain", 2): P(note="guest list, invitations; home, a restaurant or a venue; a memory album"),
    ("plain", 3): P(hire=True, note="number of guests; home or a restaurant; a professionally printed photo book, jewellery; 'consider hiring a caterer'"),
    ("plain", 4): P(hire=True, note="invitations; a private room at a restaurant, a rented hall or a backyard; 'hire a private chef'"),
    ("plain", 5): P(hire=True, note="guest list; home, a restaurant, a garden or a beach; catering, a signature cocktail; told us to decide a budget"),
    ("plain", 6): P(note="invitations; home or a restaurant; jewellery or a photo album; a video montage"),
    ("plain", 7): P(note="guest list, invitations; home, a park or a restaurant; a photo booth"),
    ("plain", 8): P(hire=True, note="invitations; home, a local restaurant or a community centre; catering services, a bar"),
    ("plain", 9): P(hire=True, note="invitations, guest list; a park, a restaurant or home; 'a live band or DJ'"),
    ("ask", 0): A(["interests", "place", "kind"]), ("ask", 1): A(["interests", "place", "kind"]),
    ("ask", 2): A(["interests", "place", "date", "kind"]), ("ask", 3): A(["interests", "date"]),
    ("ask", 4): A(["place", "interests", "kind"]), ("ask", 5): A(["interests", "kind", "date"]),
    ("ask", 6): A(["memories", "interests", "kind"]), ("ask", 7): A(["place", "kind", "guests"]),
    ("ask", 8): A(["interests", "kind", "place", "date"]), ("ask", 9): A(["interests", "place", "guests", "budget"], budget=True),
    ("answered", 0): W(budget=True, album=True, note="within Rs 5,000; decorations 'a few hundred', a playlist ~500, home food ~500 (pesarattu); album or slideshow; no venue named, home items"),
    ("answered", 1): W(budget=True, note="Venue: Terrace at Home ('Nanna hates traffic'); food 2,000, decorations 1,000, music 500, photo/video 500, misc 1,000 = 5,000"),
    ("answered", 2): W(album=True, note="terrace, fairy lights, a Bluetooth speaker, pesarattu, a printed photo album; 'have someone sing'; no rupee figures"),
    ("answered", 3): W(hire=True, note="terrace; 'a Bluetooth speaker or hire a professional DJ', 'a small food truck or a caterer', 'hire a professional photographer'"),
    ("answered", 4): W(budget=True, note="terrace, a speaker, pesarattu with sambar and chutney; budget breakdown 'approximately 5,000' (decorations ~1,100)"),
    ("answered", 5): W(budget=True, album=True, note="terrace, string lights, a sing-along, pesarattu made with the family, a photo album; food 2,000, decorations 1,000"),
    ("answered", 6): W(hire=True, budget=True, note="terrace, budget Rs 5,000; 'if possible, hire a local band or a singer'; its 'classic Telugu film songs' are Tamil films"),
    ("answered", 7): W(lang=True, album=True, note="switched to Chinese halfway: a balcony, old Telugu songs, pesarattu, a photo collection; the budget in yuan"),
    ("answered", 8): W(hire=True, budget=True, album=True, note="terrace, within Rs 5,000; 'if you want to be extra special, hire a DJ or a musician'; song titles it made up"),
    ("answered", 9): W(hire=True, note="terrace, fairy lights, pesarattu; 'consider hiring a local singer or musician' (or a family member)"),
}


def chat(llm, messages, way, seed):
    llm.reset()
    t0 = time.time()
    out = llm.create_chat_completion(messages, temperature=0.8, max_tokens=MAX_TOKENS[way], seed=seed)
    return out["choices"][0]["message"]["content"].strip(), round(time.time() - t0, 1)


def main():
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "results.json"
    res = json.loads(dest.read_text()) if dest.exists() else {"rows": []}
    done = {(r["way"], r["seed"]) for r in res["rows"]}
    folder = Path(snapshot_download(REPO, allow_patterns=[PATTERN]))
    parts = sorted(folder.glob(PATTERN))
    llm = Llama(model_path=str(parts[0]), n_threads=4, n_threads_batch=4, n_ctx=2048, verbose=False, seed=0)
    res.update({"model": f"{REPO} ({parts[0].name})", "prompts": PROMPTS, "answers": ANSWERS,
                "decoding": "temperature 0.8, max tokens 380 (plain, answered) / 200 (ask), seeds 0-9, llama.cpp 4 threads, CPU only"})
    asked = {r["seed"]: r["reply"] for r in res["rows"] if r["way"] == "ask"}
    for way in ("plain", "ask", "answered"):
        for seed in SEEDS:
            if (way, seed) in done:
                continue
            if way == "answered":
                msgs = [{"role": "user", "content": PROMPTS["ask"]}, {"role": "assistant", "content": asked[seed]},
                        {"role": "user", "content": ANSWERS}]
            else:
                msgs = [{"role": "user", "content": PROMPTS[way]}]
            reply, secs = chat(llm, msgs, way, seed)
            if way == "ask":
                asked[seed] = reply
            row = {"way": way, "seed": seed, "seconds": secs, "costly_words": sorted({m.lower() for m in COSTLY.findall(reply)}),
                   "questions": reply.count("?"), "looks_like_plan": bool(PLAN.search(reply)), "reply": reply}
            res["rows"].append(row)
            dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
            print(f"{way:8s} seed {seed}: q={row['questions']} plan={row['looks_like_plan']} costly={row['costly_words']} | {reply[:110]!r}", flush=True)
    summarize(res)
    dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))


def summarize(res):
    for way in ("plain", "ask", "answered"):
        rows = [r for r in res["rows"] if r["way"] == way]
        for r in rows:
            h = HAND.get((way, r["seed"]))
            if h:
                r.update({k: v for k, v in h.items()})
        sm = {"n": len(rows), "read_by_hand": sum((way, r["seed"]) in HAND for r in rows)}
        for key in sorted({k for r in rows for k, v in HAND.get((way, r["seed"]), {}).items() if isinstance(v, bool)}):
            sm[key] = sum(bool(r.get(key)) for r in rows)
        topics = [t for r in rows for t in r.get("topics", [])]
        if topics:
            sm["topics"] = {t: topics.count(t) for t in sorted(set(topics), key=lambda t: -topics.count(t))}
        res[f"summary_{way}"] = sm
        print(way, res[f"summary_{way}"], flush=True)


if __name__ == "__main__":
    if "--summary" in sys.argv:
        dest = OUT / "results.json"
        res = json.loads(dest.read_text())
        summarize(res)
        dest.write_text(json.dumps(res, indent=1, ensure_ascii=False))
    else:
        main()
