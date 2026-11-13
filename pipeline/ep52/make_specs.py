# EP52 "Build RAG over your PDFs, Part 1" (Season 6, a screen tutorial): writes reels/ep52v1.json (English) and
# reels/ep52te.json (Telugu). Lines from series/scripts/ep52_rag_pdf_part1.md (v2); [n] marks the words the picture
# waits for; " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep52/voice.py. Scene:
# Rag52Crayon.tsx. Texts on screen (data.t) come from our test (series/scripts/ep52_demo/).
#   python3 pipeline/ep52/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). v2 (script review): the real hook question and reply; "might pay for a repair that's
# covered"; why the cover won; "nine right, seven with the right page"; the habit (open the page it gives, every time);
# Part 2 "too big to send with every question"; the fixed bot's real answer before the loop; Telugu: no bare "చెప్పు"
LINES = {
    1: ("hook", "Five years of warranty, or fourteen hundred and fifty rupees? [1] We asked our first PDF bot about a mixer's motor. It said: not in the document.",
        "ఐదేళ్ళ వారంటీయా, లేక పద్నాలుగు వందల యాభై రూపాయలా? [1] మిక్సీ మోటార్ గురించి మా ఫస్ట్ పీడీఎఫ్ బాట్ ని అడిగాం. డాక్యుమెంట్ లో లేదు అంది."),
    2: ("cover", "Page three says: covered for five years. [1] Trust the bot, and you'd pay fourteen hundred and fifty rupees. It had read the cover page.",   # render review: say the stake
        "మూడో పేజీలో ఉంది: మోటార్ కి ఐదేళ్ళ వారంటీ. | [1] దాన్ని నమ్మితే, పద్నాలుగు వందల యాభై కట్టేవాళ్ళం. అది చదివింది కవర్ పేజీ."),
    3: ("title", "Let's build it right: [1] a bot that answers from your own PDF, and shows the page.",
        "సరిగ్గా తయారు చేద్దాం: [1] మీ సొంత పీడీఎఫ్ నుంచి జవాబు చెప్పి, పేజీ చూపించే బాట్."),
    4: ("step1", "Step one: read the PDF, page by page. [1] Three lines of code.",
        "స్టెప్ వన్: పీడీఎఫ్ ని పేజీ పేజీగా చదవండి. [1] మూడు లైన్ల కోడ్."),
    5: ("step2", "Our first try searched for the best page, [1] and picked the cover nine times out of ten.",
        "మా ఫస్ట్ ట్రై బెస్ట్ పేజీ కోసం వెతికింది, [1] పదిలో తొమ్మిది సార్లు కవర్ పేజీనే తీసుకుంది."),
    6: ("step2b", "Step two, for a short PDF: don't search. [1] Send every page, numbered.",
        "స్టెప్ టూ, చిన్న పీడీఎఫ్ అయితే: వెతకొద్దు. [1] ప్రతి పేజీని నంబర్ తో పంపండి."),
    7: ("step3", "Step three: give it the rules. [1] Answer only from the document, say the page, and if it isn't there, say so.",
        "స్టెప్ త్రీ: దానికి ఇలా చెప్పండి: | [1] డాక్యుమెంట్ లో ఉన్నదే చెప్పాలి, పేజీ నంబర్ తో; లేకపోతే లేదు అనాలి."),
    8: ("test", "Our test, ten questions. [1] No PDF: zero. First search: one. | [2] All five pages: nine right, seven with the right page.",
        "మా టెస్ట్, పది ప్రశ్నలు. [1] పీడీఎఫ్ లేకుండా: సున్నా. ఫస్ట్ సెర్చ్: ఒకటి. | [2] ఐదు పేజీలూ ఇస్తే: తొమ్మిది సరైనవి, ఏడింటిలో పేజీ కూడా సరైనదే."),
    9: ("miss", "One said not in the document, but page four had it. [1] So open the page it gives, and when it says it's not there, check the PDF.",
        "ఒక జవాబు డాక్యుమెంట్ లో లేదు అంది, కానీ నాలుగో పేజీలో ఉంది. | [1] అందుకే, అది చెప్పిన పేజీ ఓపెన్ చేసి చెక్ చేయండి; లేదు అంటే, పీడీఎఫ్ మీరే చెక్ చేయండి."),
    10: ("loop", "A three-hundred-page manual is too big to send with every question: Part 2 searches it by meaning. [1] And the motor question now? Five years, page three.",
         "మూడొందల పేజీల మాన్యువల్ ని ప్రతి ప్రశ్నకీ పంపలేం: రెండో భాగంలో, అర్థం బట్టి వెతుకుదాం. | [1] ఇప్పుడు మోటార్ ప్రశ్న? ఐదేళ్ళు, మూడో పేజీ."),
}
SHOW = {1: "5 years of warranty, or ₹1,450? We asked our first PDF bot about a mixer's motor. It said: not in the document.",
        2: "Page 3 says: covered for 5 years. Trust the bot, and you'd pay ₹1,450. It had read the cover page.",
        8: "Our test, 10 questions. No PDF: 0. First search: 1. <pause 0.6> All 5 pages: 9 right, 7 with the right page.",
        10: "A 300-page manual is too big to send with every question: Part 2 searches it by meaning. And the motor question now? 5 years, page 3."}
SHOW_TE = {
    1: "5 years of warranty, or ₹1,450? We asked our first PDF bot about a mixie's motor. It said: not in the document.",
    2: "Page 3 has it: the motor has a 5-year warranty. <pause 0.3> Trust it, and we'd pay ₹1,450. It read the cover page.",
    3: "Let's make it right: a bot that answers from your own PDF and shows the page.",
    4: "Step 1: read the PDF page by page. 3 lines of code.",
    5: "Our first try searched for the best page, took the cover page 9 times out of 10.",
    6: "Step 2, for a short PDF: don't search. Send every page with its number.",
    7: "Step 3: tell it this: <pause 0.3> answer only from the document, with the page number; otherwise say it isn't there.",
    8: "Our test, 10 questions. No PDF: 0. First search: 1. <pause 0.6> All 5 pages: 9 right, the page right in 7.",
    9: "One answer said not in the document, but page 4 had it. <pause 0.3> So open the page it gives and check; if it says not there, check the PDF yourself.",
    10: "A 300-page manual can't be sent with every question: search by meaning, in Part 2. <pause 0.3> The motor question now? 5 years, page 3.",
}
SPLIT_PAUSE = {8: 0.6}
SPLIT_PAUSE_TE = {2: 0.3, 7: 0.3, 8: 0.6, 9: 0.3, 10: 0.3}
TTS_EN = {}
T = {   # on screen, from series/scripts/ep52_demo/ (rag.json, rag_full.json) and the PDF we wrote
    "q1": "How long is the warranty on the motor of my MG-750 mixer grinder?",
    "firstReply": "Not in the document. (page 1)",
    "fixedReply": "The motor is covered for 5 years from the date of purchase. (page 3)",
    "q3": "My MG-750 mixer stopped after I ran it for 10 minutes without a break. Is that covered by the warranty?",
    "pages": [["MG-750 Mixer Grinder", "User Guide and Warranty Card", "750 watt motor, three jars"],
              ["Using your mixer", "Do not run it for more than 3 minutes at a time."],
              ["Warranty", "The motor is covered for 5 years from the date of purchase.", "Jars and blades: 1 year. Coupler: 6 months."],
              ["Not covered", "Damage from running the mixer for more than 3 minutes at a time.", "Jars that are dropped or broken."],   # confirmation pass: no second ₹1,450 on screen
              ["How to claim", "A technician visits within 72 hours.", "Register within 30 days: one more year."]],
    "code": ["from pypdf import PdfReader", "reader = PdfReader(\"warranty.pdf\")", "pages = [p.extract_text() for p in reader.pages]",
             "doc = \"\".join(f\"--- page {i+1} ---\\n{t}\\n\"", "              for i, t in enumerate(pages))",
             "rules = (\"Answer only from the document. \"", "         \"Say the page. If it isn't there, \"",
             "         \"say: Not in the document.\")", "messages = [{\"role\": \"system\", \"content\": rules},",
             "  {\"role\": \"user\", \"content\": doc + question}]"],
}
# Sound (CLAUDE.md arc): a boom on frame 1 and a buzz on "not in the document"; a ding on page 3; pops as the code
# types; a beat of silence and a boom + clap on "nine right"; a buzz and a ding on the miss; a riser and the slam.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.0, "drop_at": [[1, 1, 0.3]], "tail": 0.0}),
          ("s_b", (4, 5, 6, 7), {"boost": 1.2, "lift": 0.5, "drop_at": [[2, 1, 0.3]], "tail": 0.0}),   # render review: the code stretch was flat
          ("s_c", (8, 9), {"boost": 1.4, "lift": 0.6, "drop_at": [[0, 2, 0.6]], "tail": 0.0}),
          ("s_d", (10,), {"outro": True, "pre": 0.4, "boost": 1.9, "lift": 0.7, "rise": 1.9, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.35, 3: 0.3, 4: 0.3, 5: 0.35, 6: 0.8, 7: 0.4, 8: 0.4, 9: 0.4, 10: 0.0}
FLAGS_TE = {"s_d": {"boost": 1.7, "rise": 1.7}}
YT = {"s_a": "Not in the document?", "s_b": "Build it: 3 steps", "s_c": "Our test", "s_d": "Part 2 next"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep52te" if te else "ep52v1"
    s = {"id": sid, "title": "5 Years or ₹1,450? Build RAG Over Your PDFs, Part 1 (EP52)" + (" (Telugu audio)" if te else ""), "label": "EP52",
         "banner": "Build RAG over your PDFs, Part 1", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
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
                  "tempo": 1.05 if te else 1.04}
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
        scenes.append({"id": scid, "type": "sk_rag52", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
