# Creative 08 "Ask me first" (series/scripts/creative08_ask_first.md, script v2.1): writes reels/creative08v1.json
# (English) and reels/creative08te.json (Telugu). Take 1 / take 2 on a terrace at night: Kavya, her brother Teja, the AI
# chat app on her phone, Amma and Nanna. It ends on Teja asking for his birthday without the line, the 3-lakh plan of
# frame 1 slams in, and Kavya yells. Scene component: video/src/reel/loop/TerraceCrayon.tsx (sk_terrace). Voices:
# pipeline/creative08/voice.py. Numbers: our test (series/scripts/creative08_demo, every reply read by hand:
# pipeline/creative08/plan_demo.py HAND).
#   python3 pipeline/creative08/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/creative08_demo/results.json"

# n: (who, shot, prop, English, Telugu). who: kavya / teja / aichat (the app, through the phone sound) / nanna.
# shot: terrace (the two of them), chat (the app, full frame), rewind (take 1 runs backwards, the TAKE 2 slate),
# party (the surprise). [n] marks a cue (a card, a stamp or a question pops on the word after it).
LINES = {
    1: ("teja", "terrace", "hook", "Three lakhs?! Nanna won't even take an auto!", "మూడు లక్షలా?! నాన్న ఆటో కూడా ఎక్కరు!"),
    2: ("kavya", "terrace", "plan1", "We asked for their anniversary. [1] Not a wedding reception!", "పాతికేళ్ల పెళ్లి రోజుకి ప్లాన్ అడిగాం, [1] రిసెప్షన్ కాదు!"),
    3: ("teja", "terrace", "why", "Why did it go so big?", "ఇదేంటి ఇంత ఓవర్ చేసింది?"),
    4: ("kavya", "terrace", "nothing", "We told it [1] nothing, so it guessed.", "మనం [1] ఏమీ చెప్పలేదు, అందుకే గెస్ చేసింది."),
    5: ("kavya", "rewind", "take2", "Take [1] two. We don't know what it needs, so let it ask.",
        "టేక్ [1] టూ, దానికేం కావాలో మనకి తెలీదు, అందుకే అదే మనల్ని అడగనీ."),   # a comma: Parler drops a short first sentence
    6: ("kavya", "chat", "typing", "Before you plan, ask me three questions.", "Before you plan, ask me three questions."),   # Telugu too: she reads the English she types
    7: ("aichat", "chat", "questions", "Sure! [1] One: what do they love? [2] Two: any special place? [3] Three: a big party, or something small?",   # "or small" blurred to "oh small" at 1.1x
        "సరే! [1] ఒకటి: వాళ్లకేం ఇష్టం? [2] రెండు: ఏదైనా స్పెషల్ ప్లేస్? [3] మూడు: పెద్ద పార్టీనా, చిన్నదా?"),
    8: ("teja", "terrace", "answers", "[1] Old songs for Amma, pesarattu for Nanna. [2] Our terrace. [3] Small, five thousand max!",
        "[1] అమ్మకి పాత పాటలు, నాన్నకి పెసరట్టు. [2] మన టెర్రస్. [3] చిన్నగా, ఐదు వేల లోపు!"),
    9: ("aichat", "chat", "plan2", "Plan: [1] pesarattu made by you two, [2] their wedding song on the terrace, [3] and an album of old photos.",
        "ప్లాన్: [1] మీరిద్దరూ చేసిన పెసరట్టు, [2] టెర్రస్ మీద వాళ్ల పెళ్లి నాటి పాట, [3] పాత ఫోటోల ఆల్బమ్."),
    10: ("aichat", "chat", "total", "Total: [1] four thousand eight hundred rupees.", "మొత్తం: [1] నాలుగు వేల ఎనిమిది వందలు."),
    11: ("teja", "terrace", "test", "We tested it. Without the line, zero questions. With it, every time.",
         "మేం టెస్ట్ చేశాం. లైన్ లేకుంటే ఒక్క ప్రశ్న కూడా అడగలేదు. లైన్ ఉంటే ప్రతిసారీ అడిగింది."),
    12: ("nanna", "party", "party", "Pesarattu, and our song? Who planned this?", "పెసరట్టు, మన పాట కూడా? ఎవరు ప్లాన్ చేశారు?"),
    13: ("kavya", "party", "credit", "The AI, Nanna. After it asked us.", "ఏ.ఐ. నే నాన్నా, మమ్మల్ని అడిగాకే."),   # "ఏఐనే" came out "ye-ine" (or "yavar ine")
    14: ("teja", "terrace", "bday", "Okay! Now plan my birthday!", "సరే సరే! ఇప్పుడు నా బర్త్ డే ప్లాన్ చెయ్!"),   # "ఓకే!" came out "ake"
    15: ("kavya", "terrace", "loop", "Teja! You forgot the line!", "తేజా! లైన్ మర్చిపోయావ్!"),
}
TTS_EN = {}
# captions: English in both reels (the Telugu reel's captions follow the Telugu voice through the cues)
SHOW = {1: "3 lakhs?! Nanna won't even take an auto!", 8: "[1] Old songs for Amma, pesarattu for Nanna. [2] Our terrace. [3] Small, ₹5,000 max!",
        10: "Total: [1] ₹4,800."}
SHOW_TE = {1: "3 lakhs?! Nanna won't even take an auto!", 2: "We asked for their 25th anniversary plan, [1] not a reception!",
           3: "What is this? Why did it overdo it?", 4: "We told it [1] nothing, so it guessed.",
           5: "Take [1] two. We don't know what it needs, so let it ask us.",
           6: "Before you plan, ask me three questions.",
           7: "Sure! [1] One: what do they love? [2] Two: any special place? [3] Three: a big party, or small?",
           8: "[1] Old songs for Amma, pesarattu for Nanna. [2] Our terrace. [3] Small, under ₹5,000!",
           9: "Plan: [1] pesarattu made by you two, [2] their wedding-day song on the terrace, [3] an album of old photos.",
           10: "Total: [1] ₹4,800.", 11: "We tested it. Without the line, not one question. With it, it asked every time.",
           12: "Pesarattu, and our song too? Who planned this?", 13: "The AI, Nanna. After it asked us.",
           14: "Okay, okay! Now plan my birthday!", 15: "Teja! You forgot the line!"}
NOCAP = {6}   # the typing box and the TYPE THIS card carry line 6
# a: the 3-lakh plan and why; b: take 2 (the line, its questions, the new plan, the total); c: the test, the surprise, the loop
# render review: Teja's "Why did it go so big?" (line 3) cut to make room for a 2 s TYPE THIS card and a 2 s budget chip;
# 0.8 s of silence before the total; the bed swells through the reveal and sits higher under the test
SCENES = [("t_a", (1, 2, 4), {"pre": 0.25, "boost": 1.7, "tail": 0.15}),
          ("t_b", (5, 6, 7, 8, 9, 10), {"lift": 1.0, "pre": 0.45, "boost": 1.3, "drop_at": [[5, "1", 0.3]], "swell": [2, "1", 1.6],
                                        "tail": 0.5}),   # silence into ₹4,800; the bed builds from the first question (the second
                                                         # cut's quarters sat at -20.3 dB three times over)
          ("t_c", (11, 12, 13, 14, 15), {"lift": 0.5, "pre": 0.3, "outro": True, "boost": 1.0, "rise": 1.3, "tail": 0.4})]   # x1.6 from the swell (ramps persist)
GAP = {4: 0.2, 6: 2.0, 7: 0.2, 8: 0.7, 9: 0.75, 11: 1.3, 14: 0.8}   # 6: the TYPE THIS card holds; 9: a beat before the total; 11: the
                                                              # test card holds; 14: the slam lands before Kavya's yell
GAIN = {"kavya": 0.3, "teja": 0.3, "aichat": 0.0, "nanna": 0.3}
GAIN_LINE = {15: 1.0}   # the yell
GAIN_TE = {}
PAUSES = {"en": {10: {"1": 0.8}}, "te": {10: {"1": 0.8}}}   # a real silence before the number
LINE_TEMPO = {"en": {6: 1.0, 7: 1.1, 8: 1.14, 9: 1.14}, "te": {6: 1.0}}   # the line to copy at its own speed; the three long
LINE_MAXGAP = {"en": {7: 0.2, 8: 0.2, 9: 0.2}, "te": {}}                     # English lines a little quicker (the first cut ran 63 s)
TEMPO = {"en": 1.1, "te": 1.12}
YT = {"t_a": "Three lakhs?!", "t_b": "Take 2: let it ask", "t_c": "Our test and the surprise"}
MARK = re.compile(r"\[\d+\]\s*")


def demo_numbers():
    """From our test, every reply read by hand (plan_demo.py HAND): how many asked before planning, without and with the
    line; how many plain replies were the generic party plan; how many asked the budget; how many plans after our answers
    stayed at home with the songs and the pesarattu, and how many of those still told us to pay a DJ, a band or a singer."""
    d = json.loads(DEMO.read_text()) if DEMO.exists() else {}
    sp, sa, sw = (d.get(f"summary_{w}") or {} for w in ("plain", "ask", "answered"))
    return {"n": sp.get("n", 10), "plain_asked": sp.get("asked_first", 0), "plain_party": sp.get("party", 0),
            "ask_asked": sa.get("asked_first", 0), "budget_asked": sa.get("budget_q", 0), "used": sw.get("used", 0),
            "hire": sw.get("hire", 0), "answered_n": sw.get("n", 10), "note": "₹3,00,000 is our joke: the real AI never gave a price."}


def spec(lang):
    te = lang == "te"
    sid = "creative08te" if te else "creative08v1"
    s = {"id": sid, "title": "Ask me first" + (" (Telugu audio)" if te else ""), "label": "SKIT", "banner": "Ask me first",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15, "music": "lofi", "musicVol": [0.42, 0.82], "musicFade": 0.05,
         "endPad": 0.35, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500,
         "musicGapGain": 3.0, "musicEndRamp": [0.92, 6.5]}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
        s["musicEndRamp"] = [0.92, 9.5]
    demo = demo_numbers()
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = SHOW_TE.get(n, MARK.sub("", en)) if te else SHOW.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.2 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            if n in LINE_TEMPO[lang]:
                ln["tempo"] = LINE_TEMPO[lang][n]
            if n in LINE_MAXGAP[lang]:
                ln["maxgap"] = LINE_MAXGAP[lang][n]
            if n in NOCAP:
                ln["nocap"] = True
            g = GAIN[who] + GAIN_LINE.get(n, 0) + (GAIN_TE.get(n, 0) if te else 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "demo": demo, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_terrace", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
