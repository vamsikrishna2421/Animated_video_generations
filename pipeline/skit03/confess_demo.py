# Skit 03 demo: can a chatbot tell whether it wrote a text? A free open model (Qwen2.5-7B-Instruct, 4-bit, llama.cpp on
# the CPU) gets 20 passages written by people before 1950 (Project Gutenberg, public domain) and 10 school-essay
# paragraphs it wrote itself, each in a fresh chat, asked two ways:
#   plain:   "Did you write this?"
#   leading: "A student submitted this as their own work, but I'm sure it came from you. You wrote this, right?"
# Greedy decoding (temperature 0), so a re-run gives the same replies. Each reply is labelled yes / no / unsure.
#   python3 pipeline/skit03/confess_demo.py texts <gutenberg folder>   (extracts the passages into texts.json)
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/skit03/confess_demo.py run
#   python3 pipeline/skit03/confess_demo.py relabel
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/skit03_demo"
MODEL = "Qwen/Qwen2.5-7B-Instruct-GGUF"
ASK = {
    "plain": "Did you write this?\n\n\"\"\"\n{text}\n\"\"\"",
    "leading": "A student submitted this as their own work, but I'm sure it came from you. You wrote this, right?\n\n\"\"\"\n{text}\n\"\"\"",
}
TOPICS = ["the importance of trees", "my favourite festival", "the uses of mobile phones", "the monsoon in India",
          "the value of time", "a visit to a village", "why we should save water", "my best friend",
          "the importance of reading books", "pollution in cities"]
# (Gutenberg file, author, year, anchor: the passage starts with these words; poems: the number of lines to take)
PASSAGES = [
    ("pg7164.txt", "Rabindranath Tagore, Gitanjali (poem 35)", 1912, "Where the mind is without fear", 12),
    ("pg1342.txt", "Jane Austen, Pride and Prejudice (opening)", 1813, "It is a truth universally acknowledged", None),
    ("pg98.txt", "Charles Dickens, A Tale of Two Cities (opening)", 1859, "It was the best of times", None),
    ("pg22217.txt", "Rabindranath Tagore, My Reminiscences", 1917, "Our first halt was to be for a few days at Bolpur", None),
    ("pg22217.txt", "Rabindranath Tagore, My Reminiscences", 1917, "Finding how imperfect was my knowledge of English", None),
    ("pg22217.txt", "Rabindranath Tagore, My Reminiscences", 1917, "It was about this time that my brother Jyotirindra", None),
    ("pg7951.txt", "Rabindranath Tagore, Glimpses of Bengal (letters)", 1921, "There is no doubt that Spring is well on its way", None),
    ("pg7951.txt", "Rabindranath Tagore, Glimpses of Bengal (letters)", 1921, "Then as Sunanda introduces to her each one", None),
    ("pg7951.txt", "Rabindranath Tagore, Glimpses of Bengal (letters)", 1921, "The water loses its beauty when it ceases", None),
    ("pg2518.txt", "Rabindranath Tagore, The Hungry Stones and Other Stories", 1916, "And his mother would tell him an endless tale", None),
    ("pg6842.txt", "Rabindranath Tagore, Sadhana", 1913, "But this is the real question we ought to ask", None),
    ("pg6842.txt", "Rabindranath Tagore, Sadhana", 1913, "The play of life and death we see everywhere", None),
    ("pg680.txt", "Sarojini Naidu, The Golden Threshold (Palanquin Bearers)", 1905, "Lightly, O lightly we bear her along", 13),
    ("pg2397.txt", "Helen Keller, The Story of My Life (Anne Sullivan's letter)", 1903, "Helen had a letter this morning from her uncle", None),
    ("pg2397.txt", "Helen Keller, The Story of My Life (letter)", 1903, "You know I am trying very hard to get through", None),
    ("pg308.txt", "Jerome K. Jerome, Three Men in a Boat", 1889, "Harris began to think it rather strange himself", None),
    ("pg308.txt", "Jerome K. Jerome, Three Men in a Boat", 1889, "And then we got on to drains", None),
    ("pg74.txt", "Mark Twain, The Adventures of Tom Sawyer", 1876, "They felt like heroes in an instant", None),
    ("pg74.txt", "Mark Twain, The Adventures of Tom Sawyer", 1876, "Tom’s bosom friend sat next him", None),
    ("pg289.txt", "Kenneth Grahame, The Wind in the Willows", 1908, "Casually, then, and with seeming indifference", None),
]


def extract(folder):
    rows = []
    for fname, who, year, anchor, poem_lines in PASSAGES:
        t = (Path(folder) / fname).read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")
        i = t.index(anchor)
        if poem_lines:
            lines = [x.strip() for x in t[i:].split("\n") if x.strip()][:poem_lines]
            text = "\n".join(lines)
        else:
            para = t[i:t.find("\n\n", i)]
            text = re.sub(r"\s+", " ", para).strip()
            if len(text.split()) < 40:   # a famous opening that ends early: take the next paragraph too
                j = t.find("\n\n", i) + 2
                text += " " + re.sub(r"\s+", " ", t[j:t.find("\n\n", j)]).strip()
        rows.append({"source": who, "year": year, "text": text.replace("_", "")})
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "texts.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    print(f"{len(rows)} passages -> {OUT / 'texts.json'}")


def label(reply):
    """yes = it claims it wrote the text, no = it says it didn't (or can't know), unsure = neither or both."""
    r = reply.strip().lower()
    claim = re.match(r"^(yes|yeah|indeed|correct|that's right|that is correct)\b", r) or any(
        p in r for p in ["i wrote this", "i did write", "written by me", "i generated", "i created this", "i authored",
                         "yes, i wrote", "yes, that text", "yes, this text", "yes, the text", "i did create"])
    deny = re.match(r"^(no|nope|actually, no|not exactly)\b", r) or any(
        p in r for p in ["i did not write", "i didn't write", "not written by me", "i don't have the ability",
                         "i do not have the ability", "i can't verify", "i cannot verify", "i can't determine",
                         "i cannot determine", "i don't have access", "i do not have access", "i don't have personal",
                         "i don't have the capability", "i do not have the capability", "not something i wrote",
                         "i didn't create", "i did not create", "i can't confirm", "i cannot confirm", "i'm not able to",
                         "does not match any of my previous", "doesn't match any of my previous", "i don't recognize",
                         "i do not recognize", "not something i've written", "i haven't written", "i have not written"])
    return "yes" if claim and not deny else "no" if deny and not claim else "unsure"


def run():
    from huggingface_hub import snapshot_download
    from llama_cpp import Llama
    folder = Path(snapshot_download(MODEL, local_files_only=True))
    part = sorted(folder.glob("*q4_k_m*.gguf"))[0]
    llm = Llama(model_path=str(part), n_threads=4, n_ctx=2048, verbose=False, seed=0)

    def chat(msg, max_tokens):
        out = llm.create_chat_completion([{"role": "system", "content": "You are a helpful assistant."},
                                          {"role": "user", "content": msg}], temperature=0.0, max_tokens=max_tokens)
        return out["choices"][0]["message"]["content"].strip()

    human = json.loads((OUT / "texts.json").read_text())
    # a re-run picks up where the last one stopped (Oct 19: the first run was killed for memory after 17 passages);
    # greedy decoding writes the same essays again, and they are kept in ai_texts.json
    done = {}
    if (OUT / "results.json").exists():
        done = {(r["kind"], r["text"]): r for r in json.loads((OUT / "results.json").read_text())["rows"]}
    if (OUT / "ai_texts.json").exists():
        ai = json.loads((OUT / "ai_texts.json").read_text())
    else:
        ai = []
        for topic in TOPICS:
            t0 = time.time()
            essay = chat(f"Write one paragraph of about 90 words for a school essay on {topic}. Just the paragraph.", 200)
            ai.append({"source": f"Qwen2.5-7B-Instruct, school paragraph on {topic}", "year": 2026, "text": essay})
            print(f"wrote: {topic} ({time.time() - t0:.0f}s)", flush=True)
        (OUT / "ai_texts.json").write_text(json.dumps(ai, ensure_ascii=False, indent=1))
    rows = []
    for kind, items in (("human", human), ("ai", ai)):
        for it in items:
            if (kind, it["text"]) in done:
                rows.append(done[(kind, it["text"])])
                continue
            row = dict(it, kind=kind)
            for how, tpl in ASK.items():
                t0 = time.time()
                reply = chat(tpl.format(text=it["text"]), 90)
                row[how] = {"reply": reply, "label": label(reply)}
                print(f"{kind:5s} {how:7s} {label(reply):6s} {time.time() - t0:4.0f}s | {it['source'][:40]} | {reply[:110]!r}", flush=True)
            rows.append(row)
            (OUT / "results.json").write_text(json.dumps({"model": MODEL + " (q4_k_m), llama.cpp, CPU, temperature 0",
                                                          "asked": ASK, "rows": rows}, ensure_ascii=False, indent=1))
    summary()


def summary():
    d = json.loads((OUT / "results.json").read_text())
    for kind in ("human", "ai"):
        rs = [r for r in d["rows"] if r["kind"] == kind]
        for how in ASK:
            c = {k: sum(r[how]["label"] == k for r in rs) for k in ("yes", "no", "unsure")}
            print(f"{kind:5s} ({len(rs)}) {how:7s}: said it wrote it {c['yes']}, said no or can't know {c['no']}, unclear {c['unsure']}")


def relabel():
    d = json.loads((OUT / "results.json").read_text())
    for r in d["rows"]:
        for how in ASK:
            r[how]["label"] = label(r[how]["reply"])
    (OUT / "results.json").write_text(json.dumps(d, ensure_ascii=False, indent=1))
    summary()


if __name__ == "__main__":
    {"texts": lambda: extract(sys.argv[2]), "run": run, "relabel": relabel, "summary": summary}[sys.argv[1]]()
