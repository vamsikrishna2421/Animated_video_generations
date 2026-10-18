# Writes reels/ep32v1.json (English: Fish voice) and reels/ep32te.json (Telugu: local Parler voice, English captions).
# Script: series/scripts/ep32_rag_right_page.md. Demo numbers come from our run (series/scripts/ep32_demo/results.json,
# answers_1.7B.json, rerank_examples.json; pipeline/ep32/rag_demo.py, answer_demo.py).   python3 pipeline/ep32/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/ep32_demo"
RES = json.loads((DEMO / "results.json").read_text())
RUN = RES["runs"]

N = {"kw": RUN["section/keyword"]["hit1"], "mean": RUN["section/meaning"]["hit1"], "rr": RUN["section/meaning+rerank"]["hit1"],
     "test": RUN["section/keyword"]["of"], "w40": RUN["window40/meaning"]["hit1"], "w40o": RUN["window40_overlap20/meaning"]["hit1"],
     "sent": RUN["sentence/meaning"]["hit1"], "sec": RUN["section/meaning"]["hit1"], "top3": RUN["section/meaning"]["hit3"],
     "chap": RUN["chapter/meaning"]["hit1"], "ratio": round(RUN["chapter/meaning"]["avg_words_top3"] / RUN["section/meaning"]["avg_words_top3"]),
     "rrms": round(RUN["section/meaning+rerank"]["ms_per_question"])}
N["missm"] = N["test"] - N["mean"]
N["wchap"], N["wsec"] = round(RUN["chapter/meaning"]["avg_words_top3"]), round(RUN["section/meaning"]["avg_words_top3"])
N["miss"] = N["test"] - N["rr"]


def hook_data():   # the hook's question and the two pages it can land on (keyword search vs meaning search), from the run
    row = next(x for x in RES["examples"]["section/keyword"] if "shower" in x["q"])
    good = next(x for x in RES["examples"]["section/meaning"] if "shower" in x["q"])
    assert not row["hit1"] and good["hit1"] and row["top1_secs"] == [19] and good["top1_secs"] == [34]
    return {"q": row["q"],
            "wrong": {"title": "Meteor shower mode", "body": "for photographing the night sky… records the streaks of shooting stars."},
            "right": {"title": "Water and dust resistance", "body": "It is not waterproof. Do not take it into the shower…"}}


def cut_data():   # what each way of cutting looks like (real pieces from the run)
    return {"w40": "…never put it under running water. If the phone gets wet, dry it with a soft cloth and do not charge it until the port is",
            "sent": "It is not waterproof.",
            "sec": "Water and dust resistance. The K7 is rated IP54: it is protected against dust and light splashes… Do not take it into the shower…"}


def rerank_data():   # the re-ranker examples and the answers (real runs)
    ex = json.loads((DEMO / "rerank_examples.json").read_text())
    q, g = "Can I give it back if I just don't like it?", "How long is the guarantee?"
    ans = json.loads((DEMO / "answers_1.7B.json").read_text())
    row = next(x for x in ans["rows"] if x["q"] == q)
    assert ex[q]["reranked"][0] == "Returns and replacements" and ex[q]["meaning"][0] != ex[q]["reranked"][0]
    assert ex[g]["meaning"][0] == "Returns and replacements" and ex[g]["reranked"][0] == "Warranty period"
    return {"q": q, "quick": ex[q]["meaning"], "reranked": ex[q]["reranked"], "model": ans["model"].split("/")[-1],
            "answer": {"with": row["with_pieces"], "without": row["no_pieces"]},
            "manual": "Phones without a defect cannot be returned once they are opened.",
            "g": {"q": g, "quick": ex[g]["meaning"], "reranked": ex[g]["reranked"]}}


BASE = {"label": "EP 32", "banner": "How AI finds the right page", "topic": "", "look": "classic", "gap": 0.3, "lead": 0.3,
        "music": "lofi", "musicVol": [0.36, 1.2], "musicEndGain": [0.74, 5], "musicEQ": [[260, -4, 0.9]], "musicLift": 2.3, "musicPad": True, "hardCuts": True,
        "beatSnap": True, "hideTimerInHook": True, "hideTimer": True}

EN_NUM = {0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
          11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen",
          19: "nineteen", 20: "twenty", 30: "thirty"}
# Telugu voice: numbers said in English, written in Telugu script (the model misreads Latin letters inside Telugu)
TE_EN = {5: "ఫైవ్", 3: "త్రీ", 10: "టెన్", 13: "థర్టీన్", 16: "సిక్స్టీన్", 18: "ఎయిటీన్", 25: "ట్వెంటీ ఫైవ్", 27: "ట్వెంటీ సెవెన్", 30: "థర్టీ",
         28: "ట్వెంటీ ఎయిట్", 26: "ట్వెంటీ సిక్స్", 24: "ట్వెంటీ ఫోర్", 23: "ట్వెంటీ త్రీ", 15: "ఫిఫ్టీన్", 11: "ఎలెవెన్", 20: "ట్వెంటీ"}


def en_num(n):
    if n in EN_NUM:
        return EN_NUM[n]
    t, u = divmod(n, 10)
    return f"{EN_NUM[t * 10]}-{EN_NUM[u]}"


KEYS = ["KW", "MEAN", "RR", "TEST", "W40", "W40O", "SENT", "SEC", "MISS", "MISSM", "TOP3", "CHAP", "RATIO", "RRMS"]


def vals():
    return {"KW": N["kw"], "MEAN": N["mean"], "RR": N["rr"], "TEST": N["test"], "W40": N["w40"], "W40O": N["w40o"], "SENT": N["sent"],
            "SEC": N["sec"], "MISS": N["miss"], "MISSM": N["missm"], "TOP3": N["top3"], "CHAP": N["chap"], "RATIO": N["ratio"], "RRMS": N["rrms"]}


def fill(s, mode="digits"):
    if s is None:
        return None
    v = vals()
    for k in sorted(KEYS, key=len, reverse=True):
        rep = str(v[k]) if mode == "digits" or k in ("RRMS", "TOP3", "CHAP") or (k == "RATIO" and mode == "te") else en_num(v[k]) if mode == "spoken" else TE_EN[v[k]]
        s = s.replace("{" + k + "}", rep)
    return s


def fill_spoken(s):
    t = re.sub(r"([.?!] )([a-z])", lambda g: g.group(1) + g.group(2).upper(), fill(s, "spoken")).replace(" 40 ", " forty ")
    return t[:1].upper() + t[1:]


# (id, type, scene flags, yt, show (English captions, [n] cues), tts (English, spoken form), te (Telugu, [n] cues), extra)
SC = [
    ("hook", "rg_hook", {"tail": 0.2, "boost": 1.3},
     {"chapter": "“Will my phone survive a shower?”", "title": "Keyword search found meteor shower mode", "notes": [["Our test: an AI helper over a made-up 45-section phone manual (the K7), with 30 everyday questions", 0], ["Keyword search matched the word “shower” and returned the camera's meteor shower mode: the word, not the meaning", 1]]},
     "We gave an AI our phone's manual: “Will my phone survive a shower?” Its search pulled up the camera's meteor shower mode. [1] It matched the word, not the meaning.",
     None,
     "మేము మా ఫోన్ మాన్యువల్ ని ఒక ఏఐ కి ఇచ్చి, \"నా ఫోన్ షవర్ లో తడిస్తే పాడవుతుందా?\" అని సెర్చ్ లో టైప్ చేశాం. దాని సెర్చ్ కెమెరా లోని మీటియర్ షవర్ మోడ్ ని తెచ్చింది. [1] అది మాటని పట్టుకుంది, అర్థాన్ని కాదు.",
     {}),
    ("score", "rg_score", {"tail": 1.0, "drop_cue": 2, "boost": 1.2},
     {"chapter": "Keyword {KW}/{TEST}, meaning {MEAN}/{TEST}", "title": "Right page first, out of {TEST}", "notes": [["Right page first: keyword search (BM25) {KW}/{TEST}", 1], ["Meaning search (embeddings, bge-small by BAAI) {MEAN}/{TEST}", 2]]},
     "{TEST} everyday questions. Right page first: keyword search, [1] {KW}. [3] Meaning search, [2] {MEAN}.",
     None,
     "ముప్పై మామూలు ప్రశ్నలు. సరైన పేజీ మొదట వచ్చింది: కీవర్డ్ సెర్చ్ లో, [1] {KW}. [3] అర్థంతో వెతికితే, [2] {MEAN}.",
     {"pauses": {"2": 0.3}}),
    ("guess", "rg_guess", {"tail": 0.2, "lift": True},
     {"chapter": "Why it matters: no page, it guesses", "title": "A made-up refund policy", "notes": [["With no manual given, our small free AI (SmolLM2-1.7B) answered “Can I give it back if I just don't like it?” with “Yes ... for a refund or exchange”", 1], ["The manual: phones without a defect cannot be returned once they are opened", 2]]},
     "Why it matters: with no page, AI guesses. [1] “Can I give it back if I just don't like it?” [3] Our small AI: [4] “Yes, for a refund.” [2] The manual says no. [5] Stick around: one trick for your own PDFs.",
     None,
     "ఇది ఎందుకు ముఖ్యం? పేజీ ఇవ్వకపోతే, ఏఐ ఊహించి చెప్తుంది. [1] \"నచ్చకపోతే తిరిగి ఇవ్వచ్చా?\" అని అడిగితే, [3] మా చిన్న ఏఐ, [4] \"ఇవ్వచ్చు, రిఫండ్ వస్తుంది\" అంది. [2] మాన్యువల్ మాత్రం కుదరదు అంటోంది. [5] చివర్లో, మీ పీడీఎఫ్ ల కోసం ఒక ట్రిక్ ఉంది.",
     {"pauses": {"3": 0.5}}),
    ("why", "rg_why", {"tail": 1.0},
     {"chapter": "Why not paste the whole manual?", "title": "A short one, sure", "notes": [["A short document: just paste it into the chat", 0], ["Real manuals run to hundreds of pages. In our test, whole chapters found the right page as often as headings ({CHAP}/{TEST}) but sent {RATIO}x the text with every question (paid tools charge by the token)", 1], ["Also: models often miss facts in the middle of long inputs (“Lost in the Middle”, Liu et al., 2023)", 1]]},
     "Why not paste the whole manual? A short one, sure. [1] Real ones run hundreds of pages. In our test, whole chapters also scored {CHAP}, but sent {RATIO} times the text, and AI services charge by the word.",
     None,
     "మొత్తం మాన్యువల్ నే ఎందుకు ఇవ్వకూడదు? చిన్నదైతే ఇవ్వచ్చు. [1] కానీ నిజమైన మాన్యువల్స్ వందల పేజీలు. మా టెస్ట్ లో, మొత్తం చాప్టర్లకీ ట్వెంటీ ఫైవ్ వచ్చింది, కానీ ఆరు రెట్లు ఎక్కువ టెక్స్ట్ వెళ్ళింది. ఏఐ సర్వీసుల్లో ప్రతి పదానికీ డబ్బు కట్టాలి.",
     {}),
    ("cut", "rg_cut", {"tail": 0.8, "lift": True, "layer": 3, "boost": 1.3},
     {"chapter": "Step 1: cut it into pieces", "title": "Cut at headings", "notes": [["Chunking: cut the document into pieces the search can return", 0], ["Every 40 words, even mid-sentence: meaning search found the right piece first {W40}/{TEST}", 1], ["The same 40-word pieces with a 20-word overlap: {W40O}/{TEST}", 2], ["A heading with its paragraph: {SEC}/{TEST} (single sentences: {SENT}/{TEST}; they lose what “it” refers to)", 3]]},
     "Step one: cut it into pieces. Every 40 words, even mid-sentence: [1] {W40} out of {TEST}. Overlap them: [2] {W40O}. Cut at headings: [3] {SEC}.",
     None,
     "మొదటి స్టెప్: ముక్కలుగా కట్ చేయండి. ప్రతి నలభై పదాలకి, వాక్యం మధ్యలో అయినా కట్ చేస్తే, [1] ముప్పై లో {W40}. ముక్కలు కొంచెం ఓవర్ ల్యాప్ అయితే, [2] {W40O}. హెడింగ్ దగ్గర కట్ చేస్తే, [3] {SEC}.",
     {"pauses": {"3": 0.3}}),
    ("shelf", "rg_shelf", {"tail": 0.2, "lift": True, "rise": 1.3},
     {"chapter": "Step 2: a vector database", "title": "A library sorted by meaning", "notes": [["Each piece is stored as numbers that capture its meaning (an embedding, EP 06) in a vector database: a library sorted by meaning", 0], ["Your question becomes numbers too, and the nearest pieces come out (vector databases like FAISS by Meta search millions)", 1]]},
     "Step two: store each piece as numbers for its meaning, in a vector database, a library sorted by meaning. [1] Your question becomes numbers too, and the nearest pieces come out.",
     None,
     "రెండో స్టెప్: ప్రతి ముక్క అర్థం నంబర్లుగా మారి, ఒక వెక్టర్ డేటాబేస్ లో ఉంటుంది, అర్థం ప్రకారం సర్దిన లైబ్రరీ లాగా. [1] మీ ప్రశ్న కూడా నంబర్లుగా మారుతుంది, దగ్గరగా ఉన్న ముక్కలు బయటకి వస్తాయి.",
     {}),
    ("rerank", "rg_rerank", {"tail": 1.2, "lift": True, "boost": 0.8, "duck": [2, 3, 0.3]},
     {"chapter": "Step 3: re-rank", "title": "First-place misses: {MISSM} -> {MISS}", "notes": [["A re-ranker (a cross-encoder) reads the question beside each top piece and re-orders them: slower (about 80 ms a question on a CPU vs under 1 ms)", 1], ["First-place misses: {MISSM} -> {MISS} out of {TEST} (a small test). If the AI reads the top three, meaning search alone already had the right page there {TOP3}/{TEST}", 2]]},
     "Step three: a re-ranker [1] reads your question beside each top piece, and reorders them. First-place misses: [2] {MISSM} became {MISS}. [3]",
     None,
     "మూడో స్టెప్: రీ ర్యాంకర్. [1] అది మీ ప్రశ్న పక్కన ప్రతి టాప్ ముక్క ని చదివి, వరుస మారుస్తుంది. మొదటి స్థానంలో తప్పులు, [2] ఐదు నుంచి మూడు కి తగ్గాయి. [3]",
     {"pauses": {"2": 0.25}}),
    ("quiz", "rg_quiz", {"tail": 0.2, "pre": 0.35, "duck": [3, 2, 0.05], "layer": 2, "lift": True},
     {"chapter": "Your turn", "title": "Right page keeps coming second", "notes": [["Your AI reads only the first piece, and the right page keeps coming second", 0], ["What helps more: a bigger AI, or a re-ranker?", 1], ["The re-ranker: a bigger AI still reads the wrong page. Ours moved “How long is the guarantee?” from the returns page to the warranty page", 2]]},
     "Now, your turn. Your AI reads only the first piece, and the right page keeps coming second. [1] What helps more: a bigger AI, or a re-ranker? [3] <pause 2.0> [2] The re-ranker. Why? A bigger AI still reads the wrong page. Ours [4] moved “guarantee” from the returns page to the warranty page.",
     None,
     "ఇప్పుడు మీ వంతు. మీ ఏఐ మొదటి ముక్క ఒక్కటే చదువుతుంది, సరైన పేజీ ఎప్పుడూ రెండో స్థానంలో వస్తోంది. [1] ఏది ఎక్కువ సాయం చేస్తుంది: ఇంకా పెద్ద మోడలా, రీ ర్యాంకరా? [3] <pause 2.0> [2] రీ ర్యాంకర్. పెద్ద మోడల్ అయినా తప్పు పేజీ నే చదువుతుంది. మా రీ ర్యాంకర్, \"గ్యారెంటీ ఎంత కాలం?\" అనే ప్రశ్నకి, [4] రిటర్న్స్ పేజీ ని కిందకి దించి, వారంటీ పేజీ ని పైకి పెట్టింది.",
     {"tts": "Now, your turn. Your AI reads only the first piece, and the right page keeps coming second. What helps more: a bigger AI, or a re-ranker?",
      "file2": "08_quiz_answer.wav", "tts2": "The re-ranker. Why? A bigger AI still reads the wrong page. Ours moved \"guarantee\" from the returns page to the warranty page.",
      "te_tts": "ఇప్పుడు మీ వంతు. మీ ఏఐ మొదటి ముక్క ఒక్కటే చదువుతుంది, సరైన పేజీ ఎప్పుడూ రెండో స్థానంలో వస్తోంది. ఏది ఎక్కువ సాయం చేస్తుంది: ఇంకా పెద్ద మోడలా, రీ ర్యాంకరా?",
      "te_tts2": "రీ ర్యాంకర్. పెద్ద మోడల్ అయినా తప్పు పేజీ నే చదువుతుంది. మా రీ ర్యాంకర్, \"గ్యారెంటీ ఎంత కాలం?\" అనే ప్రశ్నకి, రిటర్న్స్ పేజీ ని కిందకి దించి, వారంటీ పేజీ ని పైకి పెట్టింది.",
      "pause": 2.0, "gap": 0.1}),
    ("close", "rg_close", {"tail": 1.0, "outro": True, "lift": True, "boost": 1.5, "duck": [3, 2, 0.4], "swell": [0, 2, 1.2]},
     {"chapter": "Paste, cut, search, re-rank", "title": "Make your AI find the right page", "notes": [["Short document? Paste it. Big one? Cut at headings, search by meaning, re-rank if your bot reads one piece", 0], ["Using a chatbot with your PDF? Ask it to quote the lines it used", 0], ["Next: when meaning search misses exact codes (hybrid search) and how to test your search (RAG, part 3)", 1]]},
     "So: short document? Paste it. Big one? Cut at headings, search by meaning, re-rank if it reads one piece. [3] Using a chatbot with your PDF? Ask it to quote the lines it used. [1] Next: why meaning search misses exact error codes. [2] Follow, so you don't miss it.",
     None,
     "అంటే: చిన్న డాక్యుమెంట్? మొత్తం పేస్ట్ చేయండి. పెద్దదైతే? హెడింగ్స్ దగ్గర కట్ చేయండి, అర్థంతో వెతకండి, బాట్ ఒక్క ముక్కే చదివితే రీ ర్యాంక్ చేయండి. [3] మీ పీడీఎఫ్ తో చాట్ బాట్ వాడుతుంటే, అది వాడిన లైన్స్ ని చూపించమని అడగండి. [1] తర్వాతి ఎపిసోడ్ లో: అర్థంతో వెతికే సెర్చ్, ఎర్రర్ కోడ్స్ ని ఎందుకు మిస్ అవుతుందో చూద్దాం. [2] మిస్ అవ్వకుండా ఫాలో అవ్వండి.",
     {}),
]


def deep_fill(o):
    if isinstance(o, str):
        return fill(o)
    if isinstance(o, list):
        return [deep_fill(x) for x in o]
    if isinstance(o, dict):
        return {k: deep_fill(v) for k, v in o.items()}
    return o


def spec(lang):
    te = lang == "te"
    s = {"id": "ep32te" if te else "ep32v1", "title": "How AI finds the right page (RAG part 2)" + (" (Telugu audio)" if te else ""), **BASE,
         "tempo": 1.15 if te else 1.25, "parler_lang": lang}
    if te:
        s.update({"captionMode": "phrase", "handle": "@ai_maastaaru_telugu"})
    scenes = []
    for i, (sid, typ, flags, yt, show, tts, tel, extra) in enumerate(SC):
        line = {"who": "maastaaru", "maxgap": 0.28 if te else 0.3, "file": f"{i + 1:02d}_{sid}.wav"}
        ex = dict(extra)
        te_tts, te_tts2 = ex.pop("te_tts", None), ex.pop("te_tts2", None)
        show_f = fill(show)
        if te:
            line.update({"text": fill(tel, "te"), "show": show_f, "sentence_cues": True})
            if "file2" in ex:
                ex["tts"], ex["tts2"] = fill(te_tts, "te"), fill(te_tts2, "te")
        else:
            line.update({"text": fill(show, "spoken").replace("“", "\"").replace("”", "\""), "show": show_f})
            line["tts"] = fill_spoken(tts if tts else re.sub(r"\[\d+\]\s*|<pause [\d.]+>\s*", "", show)).replace("“", "\"").replace("”", "\"")
            if "tts" in ex:
                ex["tts"] = fill_spoken(ex["tts"])
            if "tts2" in ex:
                ex["tts2"] = fill_spoken(ex["tts2"])
        line.update(ex)
        data = {"yt": deep_fill(yt), "n": N, "captionSide": 110}
        if sid in ("hook", "score", "shelf"):
            data.update(hook_data())
        if sid == "cut":
            data["cut"] = cut_data()
        if sid in ("guess", "rerank", "quiz"):
            data["rr"] = rerank_data()
        if sid == "close":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        if sid == "close" and not te:   # English cue 2 is letter-timed and lands on "codes": hold the duck to "Follow"
            flags = {**flags, "duck": [3, 2, 0.4, 0.55]}
        scenes.append({"id": sid, "type": typ, **flags, "data": data, "lines": [line]})
    s["scenes"] = scenes
    out = R / f"{s['id']}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
