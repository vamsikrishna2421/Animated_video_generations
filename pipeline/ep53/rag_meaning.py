# EP53 demo, "Build RAG over your PDFs, Part 2" (written and committed before it ran). Part 1's PDF was 5 pages, so we
# sent every page. This one is 300 pages: too big to send with every question. So step 2 becomes: find the few pages
# that answer the question, and send only those.
# The PDF: a user manual we wrote for a made-up washing machine ("WM-900", Sample Appliances; every detail invented),
# 300 pages: cover, contents, safety, installation, programs, error codes E01-E80, care, parts and prices, warranty.
# Ten questions in everyday words, different from the manual's words ("my clothes smell bad" vs "odour"); the right page
# for each is fixed before the run (RIGHT).
#   words  : Part 1's search: shared words, rare words count more (rag_fix.py's score)
#   meaning: each page turned into a list of numbers by a small open embedding model (sentence-transformers'
#            all-MiniLM-L6-v2 through transformers, mean pooling, on this computer); the question too; the pages whose
#            numbers point the same way as the question's (cosine similarity) come first
# Score: is the right page in the top 3? Then the same small free AI as EP51/EP52 (Qwen2.5-7B-Instruct, 4-bit, llama.cpp,
# on this computer, no web search), temperature 0.2, answers each question from the top 3 "meaning" pages, each marked
# "--- page N ---", with Part 1's rules; every answer read by hand (HAND). Token counts: the whole manual vs one question's
# prompt, with the AI's own tokenizer.
# Writes series/scripts/ep53_demo/wm900_manual.pdf and series/scripts/ep53_demo/meaning.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep53/rag_meaning.py
import json
import math
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep53_demo"
PDF = OUT / "wm900_manual.pdf"
QWEN, QPAT = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
EMB = "sentence-transformers/all-MiniLM-L6-v2"
PORT = 8769
PROGRAMS = [("Cotton", "40°C", "1200 rpm", "everyday cotton clothes, towels and bed sheets"), ("Synthetic", "30°C", "800 rpm", "polyester and mixed fabrics"),
            ("Delicates and Wool", "30°C", "600 rpm", "silk, wool and other delicate fabrics; use a mild detergent"), ("Quick 15", "20°C", "800 rpm", "a small, lightly soiled load in 15 minutes"),
            ("Baby Care", "60°C", "1000 rpm", "baby clothes, with an extra rinse"), ("Heavy Soil", "60°C", "1200 rpm", "work clothes with mud or oil"),
            ("Bedding", "40°C", "800 rpm", "blankets and quilts that fit the drum"), ("Rinse and Spin", "-", "1000 rpm", "a rinse and a spin only"),
            ("Tub Clean", "90°C", "400 rpm", "run once a month with the drum empty to remove odour, mould and detergent residue")]
ERRORS = {21: ("Drain fault", "Water does not drain out of the drum. The drain pump filter may be blocked. Open the small door at the bottom right, "
                              "unscrew the filter slowly over a towel, clean it, and close it."),
          35: ("Door lock fault", "The door is not locked. Close the door firmly until it clicks. If the code stays, call service."),
          12: ("Water inlet fault", "Water does not fill. Check that the tap is open and the inlet hose is not bent.")}
SPECIAL = {   # page number -> (title, text): the pages that answer the questions
    48: ("Before first use: transit bolts", "Remove the four transit bolts at the back before the first wash. If they are left in, "
                                            "the machine shakes, moves and makes loud knocking noises during the spin."),
    96: ("Child lock", "To stop children from changing the program, press and hold Temp and Spin together for 3 seconds. "
                       "Do the same to unlock."),
    104: ("Detergent", "Use only front-load (HE) detergent. Never use dishwashing liquid or hand-wash soap: it makes too much foam "
                       "and can leak and damage the machine."),
    262: ("Spare parts and prices (2)", "Door gasket (the rubber seal around the door): Rs 1,250. Drain pump: Rs 1,800. "
                                        "Drum belt: not used (direct drive). Control panel: Rs 4,600."),
    284: ("Warranty", "The inverter motor is covered for 10 years from the date of purchase. All other parts are covered for 2 years."),
    291: ("Service and repairs", "For a repair, call 1800 000 0000 (a sample number) or send a WhatsApp message with a photo of "
                                 "the bill. A technician visits within 48 hours in the cities on our list."),
}
QS = [   # (id, question in everyday words, the right page)
    ("q1", "My clothes smell bad after washing. What should I do?", None),   # the Tub Clean page (filled in make_pages)
    ("q2", "Water is not going out of my machine. What do I check?", None),   # E21
    ("q3", "Can I wash my silk saree in it?", None),   # Delicates and Wool
    ("q4", "How much does a new rubber seal for the door cost?", 262),
    ("q5", "The machine is jumping and banging when it spins. Why?", 48),
    ("q6", "For how many years is the motor guaranteed?", 284),
    ("q7", "My screen shows E35. What does it mean?", None),   # E35
    ("q8", "How do I stop my child from changing the wash settings?", 96),
    ("q9", "Can I use the liquid I wash dishes with?", 104),
    ("q10", "Who do I call to get it repaired?", 291),
]
RULES = ("Answer the question only from the document below. If the answer is not in it, say \"Not in the document.\" "
         "Keep it to one or two short lines, and end with the page number, like (page 3).")
STOP = set("a an and are be by can do does for from how i in is it its me my of on or the this to what when will with you your".split())
HAND = {   # read by hand after the run (series/scripts/ep53_demo/meaning.json)
    "search": "right page in the top 3: words 7 of 10 (missed q1 smell/odour, q5 banging/knocking, q10 repair/service); "
              "meaning 8 of 10 (missed q1 and q8 child lock: it ranked the safety page 'do not let children play' first)",
    "answers (meaning top 3)": "q2 the drain filter (page 141), q4 Rs 1,250 (262), q5 the transit bolts (48), q6 10 years (284), q7 E35 door "
                               "lock (155), q9 no dish soap (104), q10 the service number (291): right with the right page; q3 right but cited "
                               "page 117 (a later page of the same Delicates and Wool program, same text); q1 and q8 'Not in the document' "
                               "(the right page wasn't retrieved: no guess). About 200-250 prompt tokens a question; the whole manual 15,373",
}


def make_pages():
    pages = [("WM-900 Front-Load Washing Machine", "User Manual. Sample Appliances Pvt Ltd (a sample document for a lesson; the company "
                                                    "and the product are made up). 9 kg, inverter motor, 15 programs.")]
    for i in range(4):
        pages.append((f"Contents ({i + 1})", "Safety, installation, programs, error codes, care and cleaning, spare parts, warranty and service."))
    for i in range(15):
        pages.append((f"Safety ({i + 1})", f"Safety note {i + 1}: keep the machine away from water spray and direct sun; unplug it before cleaning; "
                                           "do not let children play with the machine; do not wash clothes stained with petrol."))
    for i in range(40):
        pages.append((f"Installation ({i + 1})", f"Installation step {i + 1}: place the machine on a firm, level floor; adjust the feet; "
                                                 "connect the inlet hose to a cold water tap and the drain hose to a drain at least 60 cm high."))
    prog_pages = {}
    for i in range(60):
        name, temp, spin, use = PROGRAMS[i % len(PROGRAMS)]
        if i < len(PROGRAMS):
            prog_pages[name] = None
        pages.append((f"Program: {name} ({i // len(PROGRAMS) + 1})", f"{name} program: {temp}, up to {spin}. For {use}. Do not overload the drum."))
    for code in range(1, 81):
        title, text = ERRORS.get(code, (f"Error E{code:02d}", f"Error E{code:02d}: a sensor or board fault. Switch off for 10 minutes; if the code returns, call service."))
        pages.append((f"Error E{code:02d}: {title}" if code in ERRORS else title, f"E{code:02d}: {text}" if code in ERRORS else text))
    for i in range(40):
        pages.append((f"Care and cleaning ({i + 1})", f"Care tip {i + 1}: wipe the door and the detergent drawer after use; leave the door open for an hour so the drum dries."))
    for i in range(40):
        pages.append((f"Spare parts and prices ({i + 3})", f"Parts list {i + 3}: knob Rs 150; foot Rs 90; inlet hose Rs 450; drain hose Rs 380; detergent drawer Rs 520."))
    while len(pages) < 300:
        pages.append((f"Notes ({len(pages)})", "Write your purchase date, the serial number and the dealer's phone number here."))
    pages = pages[:300]
    for n, (t, x) in SPECIAL.items():
        pages[n - 1] = (t, x)
    # fill the right pages for the questions whose page depends on the layout
    right = {}
    for qid, q, pg in QS:
        right[qid] = pg
    tub = next(i + 1 for i, (t, x) in enumerate(pages) if t.startswith("Program: Tub Clean"))
    silk = next(i + 1 for i, (t, x) in enumerate(pages) if t.startswith("Program: Delicates and Wool"))
    e21 = next(i + 1 for i, (t, x) in enumerate(pages) if t.startswith("Error E21"))
    e35 = next(i + 1 for i, (t, x) in enumerate(pages) if t.startswith("Error E35"))
    right.update({"q1": tub, "q2": e21, "q3": silk, "q7": e35})
    return pages, right


def make_pdf(pages):
    from reportlab.lib.pagesizes import A5
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate
    st = getSampleStyleSheet()
    story = []
    for i, (t, x) in enumerate(pages):
        story += [Paragraph(t, st["Heading2"]), Paragraph(x, st["BodyText"]), Paragraph(f"page {i + 1}", st["Italic"])]
        if i < len(pages) - 1:
            story.append(PageBreak())
    OUT.mkdir(parents=True, exist_ok=True)
    SimpleDocTemplate(str(PDF), pagesize=A5).build(story)


def read_pdf():   # step 1, as in Part 1
    from pypdf import PdfReader
    return [re.sub(r"\s+", " ", p.extract_text()).strip() for p in PdfReader(str(PDF)).pages]


def words(t):
    return {w for w in re.findall(r"[a-z0-9]+", t.lower()) if w not in STOP}


def search_words(pages, q, k=3):   # Part 1's fixed search: rare shared words count more
    pw = [words(p) for p in pages]
    n = len(pages)
    df = {}
    for s in pw:
        for w in s:
            df[w] = df.get(w, 0) + 1
    scores = [sum(math.log(n / df[w]) for w in words(q) & s) for s in pw]
    return sorted(range(n), key=lambda i: -scores[i])[:k]


def embedder():
    import torch
    from transformers import AutoModel, AutoTokenizer
    tok, model = AutoTokenizer.from_pretrained(EMB), AutoModel.from_pretrained(EMB)

    def embed(texts):
        out = []
        for i in range(0, len(texts), 32):
            b = tok(texts[i:i + 32], padding=True, truncation=True, max_length=256, return_tensors="pt")
            with torch.no_grad():
                h = model(**b).last_hidden_state
            m = b["attention_mask"].unsqueeze(-1).float()
            v = (h * m).sum(1) / m.sum(1)
            out.append(torch.nn.functional.normalize(v, dim=1))
        return torch.cat(out)
    return embed


def search_meaning(page_vecs, qvec, k=3):
    sims = (page_vecs @ qvec).tolist()
    return sorted(range(len(sims)), key=lambda i: -sims[i])[:k], sims


def model_file():
    from huggingface_hub import snapshot_download
    return sorted(Path(snapshot_download(QWEN, allow_patterns=[QPAT])).glob("*.gguf"))[0]


def call(key, messages):
    body = json.dumps({"model": "ai", "messages": messages, "temperature": 0.2, "seed": 1, "max_tokens": 120}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=600) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip(), out.get("usage", {})


def main():
    pages_src, right = make_pages()
    make_pdf(pages_src)
    pages = read_pdf()
    embed = embedder()
    t0 = time.time()
    page_vecs = embed(pages)
    embed_s = round(time.time() - t0, 1)
    rows = []
    for qid, q, _ in QS:
        top_w = search_words(pages, q)
        top_m, sims = search_meaning(page_vecs, embed([q])[0])
        rows.append({"id": qid, "q": q, "right_page": right[qid], "words_top3": [p + 1 for p in top_w], "meaning_top3": [p + 1 for p in top_m],
                     "words_hit": (right[qid] - 1) in top_w, "meaning_hit": (right[qid] - 1) in top_m})
        print(qid, "right", right[qid], "words", [p + 1 for p in top_w], "meaning", [p + 1 for p in top_m], flush=True)
    from llama_cpp import Llama
    vocab = Llama(model_path=str(model_file()), vocab_only=True, verbose=False)
    whole = "\n\n".join(f"--- page {i + 1} ---\n{p}" for i, p in enumerate(pages))
    whole_tokens = len(vocab.tokenize(whole.encode()))
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for r in rows:
            doc = "\n\n".join(f"--- page {p} ---\n{pages[p - 1]}" for p in r["meaning_top3"])
            reply, usage = call(key, [{"role": "system", "content": RULES}, {"role": "user", "content": f"Document:\n{doc}\n\nQuestion: {r['q']}"}])
            r.update({"reply": reply, "prompt_tokens": usage.get("prompt_tokens")})
            print(r["id"], usage.get("prompt_tokens"), "|", reply.replace("\n", " ")[:200], flush=True)
    finally:
        srv.terminate()
        srv.wait(timeout=60)
    (OUT / "meaning.json").write_text(json.dumps({"pages": len(pages), "embed_seconds": embed_s, "whole_manual_tokens": whole_tokens,
                                                  "rules": RULES, "rows": rows}, indent=1, ensure_ascii=False))
    print("whole manual tokens", whole_tokens, "embed s", embed_s,
          "words hits", sum(r["words_hit"] for r in rows), "meaning hits", sum(r["meaning_hit"] for r in rows))


if __name__ == "__main__":
    main()
