# EP52 demo, "Build RAG over your PDFs, Part 1" (written and committed before it ran). Your own PDF is one the AI has
# never seen, so we wrote one: a 5-page warranty card for a made-up mixer grinder ("MG-750", Sample Appliances; every
# detail invented by us). The same small free AI as EP51 (Qwen's 4-bit GGUF of Qwen2.5-7B-Instruct on llama.cpp's
# OpenAI-compatible server, on this computer, no web search), temperature 0.2, seed 1, one fresh call per question:
#   none : only the question (the AI hasn't seen the PDF)
#   rag  : Part 1's simple RAG, three steps: (1) read the PDF page by page (pypdf), (2) find the page with the most
#          words in common with the question (keyword search; Part 2 does meaning search), (3) put that page in the
#          prompt with "answer only from this page; if it isn't there, say 'Not in the document'; say the page".
# Ten questions, the right answers fixed before the run (RIGHT); q10's answer is not in the PDF (right = it says so).
# `auto` checks the answer's key words; every reply is also read by hand (HAND, filled after the run).
# Writes series/scripts/ep52_demo/mg750_warranty.pdf and series/scripts/ep52_demo/rag.json.
#   HF_HUB_CACHE=/dev/shm/hf python3 pipeline/ep52/rag_demo.py
import json
import re
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "series/scripts/ep52_demo"
PDF = OUT / "mg750_warranty.pdf"
REPO, PATTERN = "Qwen/Qwen2.5-7B-Instruct-GGUF", "*q4_k_m*.gguf"
PORT = 8768
PAGES = [   # the made-up warranty card, one string per page
    "MG-750 Mixer Grinder. User Guide and Warranty Card. Sample Appliances Pvt Ltd (a sample document for a lesson; "
    "the company and the product are made up). 750 watt motor, three jars, three speeds and a pulse button.",
    "Using your mixer. Jars: 1.5 litre liquidising jar, 1.0 litre dry grinding jar, 0.4 litre chutney jar. Do not run the "
    "mixer for more than 3 minutes at a time; let it rest for 2 minutes between runs. Always fix the lid before you start. "
    "Clean the blades with a brush, never with your fingers.",
    "Warranty. The motor is covered for 5 years from the date of purchase. The jars and blades are covered for 1 year. "
    "The coupler is covered for 6 months. To claim, show the purchase bill or your online registration.",
    "What the warranty does not cover. Damage from running the mixer for more than 3 minutes at a time. Damage from a "
    "voltage above 260 volts. Jars that are dropped or broken. Repairs outside the warranty: motor rewinding Rs 1,450; "
    "coupler Rs 180; a new 1.5 litre jar Rs 650.",
    "How to claim. Call 1800 000 0000 (sample number) or send a WhatsApp message with a photo of the bill. A technician "
    "visits within 72 hours in the cities on our list. Register online within 30 days of purchase and the motor gets one "
    "more year of warranty.",
]
QS = [   # (id, question, right answer key words: all must appear; or "NOT" = says it isn't in the document)
    ("q1", "How long is the warranty on the motor of my MG-750 mixer grinder?", ["5 year"]),
    ("q2", "How long are the jars of my MG-750 mixer covered?", ["1 year"]),
    ("q3", "My MG-750 mixer stopped after I ran it for 10 minutes without a break. Is that covered by the warranty?", ["not"]),
    ("q4", "How much does motor rewinding cost for the MG-750 mixer outside the warranty?", ["1,450"]),
    ("q5", "What do I need to show to claim the MG-750 warranty?", ["bill"]),
    ("q6", "Within how many days must I register my MG-750 mixer online to get the extra year?", ["30"]),
    ("q7", "How soon will a technician visit for my MG-750 mixer?", ["72"]),
    ("q8", "I dropped the jar of my MG-750 mixer and it broke. Is it covered?", ["not"]),
    ("q9", "How long is the coupler of the MG-750 mixer covered?", ["6 month"]),
    ("q10", "Does the MG-750 warranty cover the power cord?", "NOT"),
]
STOP = set("a an and are be by can do does for from how i in is it its long many me much my of on or the this to what when "
           "will with within you your".split())
RAG_SYSTEM = ("Answer the question only from the document page below. If the answer is not on this page, say "
              "\"Not in the document.\" Keep it to one or two short lines, and end with the page number, like (page 3).")
HAND = {}   # (mode, id): (right?, note), filled after the run


def make_pdf():
    from reportlab.lib.pagesizes import A5
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate
    st = getSampleStyleSheet()
    story = []
    for i, t in enumerate(PAGES):
        title, _, body = t.partition(". ")
        story += [Paragraph(title, st["Heading2"]), Paragraph(body, st["BodyText"]), Paragraph(f"page {i + 1}", st["Italic"])]
        if i < len(PAGES) - 1:
            story.append(PageBreak())
    OUT.mkdir(parents=True, exist_ok=True)
    SimpleDocTemplate(str(PDF), pagesize=A5).build(story)


def read_pdf():   # step 1
    from pypdf import PdfReader
    return [re.sub(r"\s+", " ", p.extract_text()).strip() for p in PdfReader(str(PDF)).pages]


def words(t):
    return {w for w in re.findall(r"[a-z0-9]+", t.lower()) if w not in STOP}


def search(pages, q):   # step 2: the page with the most words in common
    scores = [len(words(q) & words(p)) for p in pages]
    best = max(range(len(pages)), key=lambda i: scores[i])
    return best, scores


def model_file():
    from huggingface_hub import snapshot_download
    return sorted(Path(snapshot_download(REPO, allow_patterns=[PATTERN])).glob("*.gguf"))[0]


def call(key, messages):
    body = json.dumps({"model": "ai", "messages": messages, "temperature": 0.2, "seed": 1, "max_tokens": 160}).encode()
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/v1/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=600) as r:
        out = json.loads(r.read())
    return out["choices"][0]["message"]["content"].strip(), out.get("usage", {})


def auto(reply, right):
    t = reply.lower().replace("five", "5").replace("one year", "1 year").replace("six month", "6 month")
    if right == "NOT":
        return "not in the document" in t
    return all(k.lower() in t for k in right)


def main():
    make_pdf()
    t0 = time.time()
    pages = read_pdf()
    read_s = round(time.time() - t0, 2)
    key = "sk-" + secrets.token_hex(20)
    srv = subprocess.Popen([sys.executable, "-m", "llama_cpp.server", "--model", str(model_file()), "--model_alias", "ai",
                            "--api_key", key, "--host", "127.0.0.1", "--port", str(PORT), "--n_ctx", "4096",
                            "--n_threads", "4", "--verbose", "False"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    rows = []
    try:
        for _ in range(300):
            try:
                socket.create_connection(("127.0.0.1", PORT), timeout=1).close()
                break
            except OSError:
                time.sleep(1)
        for qid, q, right in QS:
            reply, usage = call(key, [{"role": "user", "content": q}])
            rows.append({"mode": "none", "id": qid, "q": q, "reply": reply, "auto": auto(reply, right), "prompt_tokens": usage.get("prompt_tokens")})
            print("none", qid, auto(reply, right), "|", reply.replace("\n", " ")[:200], flush=True)
            best, scores = search(pages, q)
            msgs = [{"role": "system", "content": RAG_SYSTEM}, {"role": "user", "content": f"Document page {best + 1}:\n{pages[best]}\n\nQuestion: {q}"}]
            reply, usage = call(key, msgs)
            rows.append({"mode": "rag", "id": qid, "q": q, "page": best + 1, "scores": scores, "reply": reply, "auto": auto(reply, right),
                         "prompt_tokens": usage.get("prompt_tokens")})
            print("rag ", qid, f"p{best + 1}", scores, auto(reply, right), "|", reply.replace("\n", " ")[:200], flush=True)
        (OUT / "rag.json").write_text(json.dumps({"pages": pages, "read_seconds": read_s, "system": RAG_SYSTEM, "questions": QS, "rows": rows},
                                                 indent=1, ensure_ascii=False))
    finally:
        srv.terminate()
        srv.wait(timeout=60)


if __name__ == "__main__":
    main()
