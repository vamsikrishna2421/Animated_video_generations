# EP53 "Build RAG over your PDFs, Part 2" (Season 6, a screen tutorial): writes reels/ep53v1.json (English) and
# reels/ep53te.json (Telugu). Lines from series/scripts/ep53_rag_pdf_part2.md; [n] marks the words the picture waits for;
# " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep53/voice.py. Scene: Rag53Crayon.tsx. Texts on
# screen (data.t) come from our test (series/scripts/ep53_demo/meaning.json, hybrid.json).
#   python3 pipeline/ep53/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Over fifteen thousand tokens, or two hundred and forty-seven? [1] One question, a 300-page manual: the whole thing didn't fit our small AI. [2] Three pages answered it: page 141.",
        "పదిహేను వేల టోకెన్లా, రెండు వందల నలభై ఏడు టోకెన్లా? [1] మూడొందల పేజీల మాన్యువల్ కి ఒకే ప్రశ్న: మొత్తం మాన్యువల్ మా చిన్న మోడల్ కి పట్టలేదు. [2] మూడు పేజీలతో, పేజీ నూట నలభై ఒకటి నుంచి జవాబు వచ్చింది."),
    2: ("part1", "Part 1 sent every page. [1] That's sixty-two times the tokens, every question, and you pay for every one.",
        "పార్ట్ వన్ లో ప్రతి పేజీ పంపాం. [1] అది అరవై రెండు రెట్లు టోకెన్లు, ప్రతి ప్రశ్నకీ; ప్రతి టోకెన్ కీ ఖర్చే."),
    3: ("title", "Part 2: send only the pages that answer, [1] found by meaning.",
        "పార్ట్ టూ: జవాబు ఉన్న పేజీలే పంపండి. [1] వాటిని అర్థం బట్టి వెతకండి."),
    4: ("step1", "Step one: turn every page into numbers, once. [1] Three hundred pages: three seconds.",
        "స్టెప్ వన్: ప్రతి పేజీని ఒక్కసారే నంబర్లుగా మార్చండి. [1] మూడొందల పేజీలకి మూడు సెకన్లు, మా కంప్యూటర్ లోనే."),
    5: ("step2", "Step two: do the same to the question, and take the three closest pages. [1] 'Banging' found 'knocking': different words, same meaning.",
        "స్టెప్ టూ: ప్రశ్నని కూడా నంబర్లుగా మార్చి, దగ్గరగా ఉన్న మూడు పేజీలు తీసుకోండి. | [1] ప్రశ్నలో ఒక మాట, పేజీలో వేరే మాట; అర్థం ఒకటే, అందుకే పేజీ దొరికింది."),
    6: ("step3", "Step three: send those pages, [1] with their page numbers and Part 1's rules.",
        "స్టెప్ త్రీ: ఆ పేజీలని, [1] పేజీ నంబర్లతో, పార్ట్ వన్ రూల్స్ తో పంపండి."),
    7: ("test", "Ten questions: right page in the top three? | [1] By meaning, eight. [2] Word search, seven. [3] Both mixed, the simple way: six.",
        "పది ప్రశ్నలు: సరైన పేజీ టాప్ త్రీ లో ఉందా? | [1] అర్థం బట్టి, ఎనిమిది. [2] మాటల సెర్చ్, ఏడు. [3] రెండూ మామూలుగా కలిపితే: ఆరు."),
    8: ("miss", "It missed two. The child lock: [1] 'not in the document', but it's on page 96. [2] 'Not there'? Check the PDF.",
        "రెండు తప్పాయి. చైల్డ్ లాక్ ప్రశ్నకి, | [1] డాక్యుమెంట్ లో లేదు అంది; కానీ అది పేజీ తొంభై ఆరులో ఉంది. [2] లేదు అంటే, పీడీఎఫ్ మీరే చూసుకోండి."),
    9: ("habit", "A few pages? Send it whole, like Part 1. [1] Long? Search by meaning. [2] No code? Upload it to a chat app. Either way, test ten questions you know the page for.",
        "కొన్ని పేజీలేనా? పార్ట్ వన్ లా మొత్తం పంపండి. [1] పెద్దదా? అర్థం బట్టి వెతకండి. | [2] కోడ్ రాదా? చాట్ యాప్ లో అప్‌లోడ్ చేసుకోండి. ఏదైనా, పేజీ తెలిసిన పది ప్రశ్నలతో పరీక్షించండి."),
    10: ("loop", "And the drain question? | [1] Clean the drain filter, page 141. [2] Next: an agent with tools.",
         "మరి డ్రెయిన్ ప్రశ్న? | [1] డ్రెయిన్ ఫిల్టర్ క్లీన్ చేసుకోండి, పేజీ నూట నలభై ఒకటి. [2] తర్వాత: టూల్స్ ఉన్న ఏజెంట్."),
}
SHOW = {1: "Over 15,000 tokens, or 247? One question, a 300-page manual: the whole thing didn't fit our small AI. Three pages answered it: page 141.",
        2: "Part 1 sent every page. That's 62 times the tokens, every question, and you pay for every one.",
        4: "Step 1: turn every page into numbers, once. 300 pages: 3 seconds.",
        5: "Step 2: do the same to the question, and take the 3 closest pages. 'Banging' found 'knocking': different words, same meaning.",
        6: "Step 3: send those pages, with their page numbers and Part 1's rules.",
        7: "10 questions: right page in the top 3? <pause 0.6> By meaning, 8. Word search, 7. Both mixed, the simple way: 6.",
        8: "It missed 2. The child lock: 'not in the document', but it's on page 96. 'Not there'? Check the PDF.",
        9: "A few pages? Send it whole, like Part 1. Long? Search by meaning. No code? Upload it to a chat app. Either way, test 10 questions you know the page for.",
        10: "And the drain question? <pause 0.6> Clean the drain filter, page 141. Next: an agent with tools."}
SHOW_TE = {
    1: "15,373 tokens, or 247? One question to a 300-page manual: the whole manual didn't fit our small model. With 3 pages, the answer came from page 141.",
    2: "In Part 1 we sent every page. That's 62 times the tokens, every question; every token costs.",
    3: "Part 2: send only the pages with the answer. Find them by meaning.",
    4: "Step 1: turn every page into numbers, just once. 300 pages: 3 seconds, on our own computer.",
    5: "Step 2: turn the question into numbers too, and take the 3 closest pages. <pause 0.4> One word in the question, another on the page; same meaning, so the page was found.",
    6: "Step 3: send those pages, with their page numbers and Part 1's rules.",
    7: "10 questions: is the right page in the top 3? <pause 0.6> By meaning, 8. Word search, 7. Both mixed, the plain way: 6.",
    8: "2 missed. The child lock question: <pause 0.3> it said 'not in the document', but it's on page 96. If it says 'not there', check the PDF yourself.",
    9: "Just a few pages? Send it whole, like Part 1. Big? Search by meaning. <pause 0.4> No code? Upload it to a chat app. Either way, test with 10 questions whose page you know.",
    10: "And the drain question? <pause 0.6> Clean the drain filter, page 141. Next: an agent with tools.",
}
SPLIT_PAUSE = {7: 0.6, 10: 0.6}
SPLIT_PAUSE_TE = {5: 0.4, 7: 0.6, 8: 0.3, 9: 0.4, 10: 0.6}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/ep53_demo/), the manual is ours (made up)
    "q": "Water is not going out of my machine. What do I check?",
    "reply": "Check if the drain pump filter is blocked; open the small door at the bottom right, unscrew the filter slowly over a towel, clean it, and close it. (page 141)",
    "qMiss": "How do I stop my child from changing the wash settings?",
    "missReply": "Not in the document. (page 13)",
    "q5": "The machine is jumping and banging when it spins. Why?",
    "p48": "If they are left in, the machine shakes, moves and makes loud knocking noises during the spin.",
    "hits": [False, True, True, True, True, True, True, False, True, True],   # meaning_hit, meaning.json
    "whole": "15,373", "top3": "247", "ctx": "4,096", "ratio": "62",
    "code": ["pages = read_pdf(\"manual.pdf\")   # Part 1, step 1",
             "embed = embedder()   # all-MiniLM-L6-v2",
             "page_vecs = embed(pages)   # 300 pages, once",
             "q_vec = embed([question])[0]",
             "scores = (page_vecs @ q_vec).tolist()",
             "top3 = sorted(range(len(pages)),",
             "              key=lambda i: -scores[i])[:3]",
             "doc = \"\\n\\n\".join(f\"--- page {i+1} ---\\n{pages[i]}\"",
             "                  for i in top3)",
             "messages = [{\"role\": \"system\", \"content\": RULES},",
             "  {\"role\": \"user\",",
             "   \"content\": f\"Document:\\n{doc}\\n\\nQuestion: {question}\"}]"],
}
# Sound (CLAUDE.md arc): a boom on frame 1; a thud on "fifteen thousand"; pops as the code types; a whoosh on the match;
# a beat of silence and a boom on "eight"; a buzz on "six"; a ding on "it didn't guess"; a riser and the slam.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.2, "tail": 0.0}),
          ("s_b", (4, 5, 6), {"boost": 0.85, "lift": 0.5, "tail": 0.0}),
          ("s_c", (7, 8), {"boost": 1.4, "lift": 0.7, "drop_at": [[0, 1, 0.3]], "tail": 0.0}),
          ("s_d", (9, 10), {"outro": True, "pre": 0.4, "boost": 1.9, "lift": 0.8, "rise": 2.0, "tail": 0.0})]   # render review: Q4 had no rise
GAP = {1: 0.4, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.35, 6: 0.3, 7: 0.4, 8: 0.35, 9: 0.4, 10: 0.0}
FLAGS_TE = {"s_d": {"boost": 1.7, "rise": 1.7}}
YT = {"s_a": "15,373 tokens or 247?", "s_b": "Search by meaning: 3 steps", "s_c": "Our test", "s_d": "Which one for your PDF"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep53te" if te else "ep53v1"
    s = {"id": sid, "title": "15,373 Tokens or 247? Build RAG Over Your PDFs, Part 2 (EP53)" + (" (Telugu audio)" if te else ""), "label": "EP53",
         "banner": "Build RAG over your PDFs, Part 2", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.12 if te else 1.1}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_rag53", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
