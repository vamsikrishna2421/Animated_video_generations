# HOW TO 03 "Test 3 AIs on your question before you pay": writes reels/howto03v1.json (English) and reels/howto03te.json
# (Telugu). Script: series/scripts/howto03_test_before_you_pay.md (v2). The same bill, two free AIs, ₹428 and ₹518; the
# shop AI walks Ravi anna through four steps. Every number on screen comes from our run (series/scripts/howto03_demo/,
# the hand marks), read here and passed to TestCrayon.tsx. Voices: pipeline/howto03/voice.py. [n] marks the words a
# picture waits for; " | " splits a line into two takes.
#   python3 pipeline/howto03/make_specs.py
import json
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/howto03_demo"


def board():
    out = []
    for ai, size, gb, lic in [("1.5B", "SMALL", 1.1, "Qwen2.5 1.5B · Apache 2.0"), ("phi3", "MIDDLE", 2.4, "Phi-3 mini · MIT"), ("7B", "BIG", 4.7, "Qwen2.5 7B · Apache 2.0")]:
        res = json.loads((DEMO / f"{ai}.json").read_text())
        per = {}
        for r in res["rows"]:
            per[r["q"]] = per.get(r["q"], 0) + int(r["hand_pass"])
        out.append({"name": size, "gb": gb, "lic": lic, "per": per, "right": sum(per.values()),
                    "sec": statistics.median(r["seconds"] for r in res["rows"])})
    return out


BOARD = board()
assert [a["right"] for a in BOARD] == [8, 12, 12], BOARD

# Each line: (who, shot, prop, English, Telugu, English caption for the Telugu reel). shot: "wide"/"ravi" (the shop) or
# "app" (a screen fills the frame). prop: what the line brings on (TestCrayon.tsx).
L = [
    ("ravi", "app", "hook", "Four twenty-eight, or five eighteen?! [1] Same bill!",
     "నాలుగొందల ఇరవై ఎనిమిదా? ఐదొందల పద్దెనిమిదా?! [1] ఒకే బిల్లు!", "₹428? ₹518?! The same bill!"),   # script review: contracted, both numbers by 2 s
    ("ai", "app", "title", "Before you buy an AI plan, [1] test it on your own questions. Four steps.",
     "ఏ చాట్ బాట్ ప్లాన్ కైనా డబ్బులు కట్టేలోపు, [1] మీ సొంత ప్రశ్నలతో టెస్ట్ చేయండి. నాలుగు స్టెప్స్.",
     "Before you pay for any chatbot plan, test it with your own questions. Four steps."),   # "కట్టే ముందు": the banned root
    ("ai", "app", "step1", "One: [2] five questions from your work. [1] Write the right answers first, and which ones it can't get wrong.",
     "ఒకటి: [2] మీ పనిలోంచి ఐదు ప్రశ్నలు. [1] సరైన జవాబులు మొదట రాసి పెట్టుకోండి, ఏవి తప్పు కాకూడదో కూడా.",
     "One: five questions from your work. Write the right answers first, and which ones must not be wrong."),   # script review: the pass rule first
    ("ai", "app", "step2", "Two: [2] the same words to each AI, [1] three times, a new chat each time.",
     "రెండు: [2] ప్రతి చాట్ బాట్ కీ అవే మాటలు, [1] మూడు సార్లు, ప్రతిసారీ కొత్త చాట్ లో.",
     "Two: the same words to each chatbot, three times, a new chat each time."),   # script review: where 15 and 9 come from
    ("ai", "app", "step3", "Three: [2] mark every answer yourself. [1] Right or wrong.",
     "మూడు: [2] ప్రతి జవాబుకీ మీరే మార్కులు వేయండి. [1] కరెక్టా, తప్పా.", "Three: mark every answer yourself. Right or wrong."),
    ("ravi", "ravi", "small", "The small one did every step right... [1] and added it wrong, three times!",
     "చిన్నది ప్రతి స్టెప్ కరెక్ట్ గా చేసింది... [1] టోటల్ మాత్రం మూడు సార్లూ తప్పు!", "The small one did every step right... but the total was wrong all three times!"),
    ("ai", "app", "telugu", "And the Telugu message? [1] These small free ones: zero of nine. | The big one even added an English \"translation\" its Telugu doesn't say.",
     "మరి తెలుగు మెసేజ్? [1] ఈ చిన్న ఫ్రీ చాట్ బాట్లు: తొమ్మిదికి సున్నా. | పెద్దది పైగా, దాని తెలుగులో లేనిదే ఇంగ్లీష్ ట్రాన్స్లేషన్ గా రాసింది.",
     "And the Telugu message? These small free chatbots: 0 of 9. <pause 0.3> The big one even wrote, as an English translation, what its Telugu doesn't say."),
    ("ravi", "ravi", "biggest", "So, the big one wins?", "అంటే, పెద్దదే గెలుస్తుందా?", "So, the big one wins?"),
    ("ai", "app", "step4", "Four: [2] keep the one that passes. | [1] For bills and stock, the middle one tied the big one. For Telugu, none passed.",
     "నాలుగు: [2] మీ టెస్ట్ పాస్ అయినదే ఉంచుకోండి. | [1] బిల్లులకి, స్టాక్ కి, మధ్యది పెద్దదానితో సమానం. తెలుగుకి, ఏదీ పాస్ కాలేదు.",
     "Four: keep the one that passes your test. <pause 0.3> For bills and stock, the middle one equals the big one. For Telugu, none passed."),   # script review: v1's step 4 picked nothing
    ("ai", "wide", "save", "So take your Telugu question to the free apps. | [1] Pay only if none passes, and test the paid one the same way.",
     "ఆ తెలుగు ప్రశ్న ఫ్రీ యాప్స్ ని అడగండి. | [1] ఫ్రీ యాప్ ఒక్కటీ పాస్ కాకపోతేనే డబ్బులు కట్టండి, పెయిడ్ దాన్ని కూడా ఇలాగే టెస్ట్ చేయండి.",
     "Ask that Telugu question to the free apps. <pause 0.3> Pay only if not one free app passes, and test the paid one the same way."),
    ("ravi", "ravi", "which", "Wait... which brain are YOU?", "ఒక్క నిమిషం... నీది ఏ బ్రెయిన్?", "Wait a minute... which brain is yours?"),
    ("ai", "wide", "loop", "The small one. [1] Four twenty-eight.", "చిన్నదే. [1] నాలుగొందల ఇరవై ఎనిమిది.", "The small one. ₹428."),
]
TTS_EN = {"hook": "Four twenty-eight, or five eighteen?! [1] Same bill!", "telugu": "And the Telugu message? [1] These small free ones: zero of nine. | The big one even added an English translation its Telugu doesn't say.",
          "title": "Before you buy an A.I. plan, [1] test it on your own questions. Four steps.", "step2": "Two: [2] the same words to each A.I., [1] three times, a new chat each time.",
          "which": "Wait... which brain are you?"}
SHOW_EN = {"hook": "₹428, or ₹518?! Same bill!", "small": "The small one did every step right... and added it wrong, 3 times!",
           "telugu": "And the Telugu message? These small free ones: 0 of 9. <pause 0.3> The big one even added an English \"translation\" its Telugu doesn't say.",
           "step2": "Two: the same words to each AI, 3 times, a new chat each time.", "loop": "The small one. ₹428."}
# by prop: groups of words, one of each group must be heard (English: Whisper's words; Telugu: substrings of its Devanagari)
MUST_EN = {"hook": [("four", "428"), ("five", "518"), ("bill",)], "title": [("plan",), ("test",), ("questions", "question"), ("four", "4")],
           "step1": [("five", "5"), ("questions", "question"), ("answers", "answer"), ("wrong",)], "step2": [("same",), ("three", "3"), ("new",), ("chat",)],
           "step3": [("mark",), ("yourself",), ("wrong",)], "small": [("small",), ("step",), ("wrong",), ("three", "3")],
           "telugu": [("telugu",), ("zero", "0"), ("nine", "9")], "telugu2": [("english",), ("translation",), ("telugu",)],
           "biggest": [("big",), ("wins", "win")], "step4": [("four", "4"), ("passes", "pass")], "step42": [("bills", "bill"), ("middle",), ("tied",), ("telugu",), ("none",)],
           "save": [("telugu",), ("free",), ("apps", "app")], "save2": [("pay",), ("none",), ("paid",), ("same",)],
           "which": [("which",), ("brain",)], "loop": [("small",), ("four", "428"), ("twenty", "428", "28")]}
MUST_TE = {"hook": [("नालुग", "नालग", "नालुगों", "नालुगो"), ("ऐदों", "ऐदो", "ऐदॊ", "आइदों", "ऐदु"), ("बिल्ल", "बिल")], "title": [("प्लान", "प्लैन"), ("टेस्ट", "टेस्त")],
           "step1": [("ऐदु", "आइदु", "5"), ("प्रश्न", "प्रश", "प्रष"), ("जवाब", "जवब")], "step2": [("मूडु", "मूड", "मुडु"), ("चाट", "चैट", "चार्ट", "चात")],
           "step3": [("मार्कु", "मार्क", "मारकु")], "small": [("चिन्न", "चिन"), ("टोटल", "टोटल्", "टोतल")],
           "telugu": [("तेलुगु", "तेलगु", "तेलुग"), ("तोम्मि", "तॊम्मि", "तम्मि", "तोमि", "तुम्मि", "9"), ("सुन्न", "सुना", "सून्न")], "telugu2": [("ट्रान्स", "ट्रांस", "ट्रैन्स", "ट्रान"), ("इंग्ली", "इंग्लि", "इंगली")],
           "biggest": [("पेद्द", "पेद", "पॆद्द")], "step4": [("पास",)], "step42": [("मध्य", "मद्य", "मद्ध"), ("तेलुगु", "तेलगु", "तेलुग")],
           "save": [("तेलुगु", "तेलगु", "तेलुग"), ("फ्री", "फ्रि")], "save2": [("पेड", "पेयि", "पेइड"), ("टेस्ट", "टेस्त")],
           "which": [("ब्रेन", "ब्रैन", "ब्रेयिन", "ब्रेइन")], "loop": [("चिन्न", "चिन"), ("नालुग", "नालग", "नालुगों", "नालुगो")]}
TEMPO = {"ravi": 1.18, "ai": 1.15}
TEMPO_TE = {"ravi": 1.05, "ai": 1.05}
# Sound (CLAUDE.md arc): a hit on frame 1; a lift into each step; ticks as the marks come in; a hit and a boing on 428;
# a drop before "zero of nine" and a hit on it; a success sting on the tie; a rise into the save card; the slam back.
SCENES = [("h_a", 0, 2, {"boost": 1.4, "tail": 0.1}),
          ("h_b", 2, 7, {"lift": 0.6, "pre": 0.3, "boost": 1.2, "drop_at": [[4, 1]], "tail": 0.1}),   # the drop before "zero of nine"
          ("h_c", 7, 12, {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.5, "rise": 1.3, "tail": 0.0})]
PAUSES = {}
GAP = {"hook": 0.25, "title": 0.5, "step1": 1.2, "step2": 0.6, "step3": 1.3, "small": 0.4, "telugu": 0.9, "biggest": 0.25, "step4": 1.0,
       "save": 1.6, "which": 0.2}   # step1, step3: the screens hold; save: the card holds
GAIN_PROP = {"save": 0.5}
GAIN_PROP_TE = {"hook": 1.0}
END_GAIN_EN = [0.9, 5.0]
END_GAIN_TE = [0.92, 5.0]
YT = {"h_a": "₹428 or ₹518? Same bill", "h_b": "The four steps", "h_c": "Which one to keep"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto03te" if te else "howto03v1"
    s = {"id": sid, "title": "HOW TO 03: test 3 AIs before you pay" + (" (Telugu audio)" if te else ""), "label": "HOW TO 03",
         "banner": "Test AIs before you pay", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35 if not te else 0.5, "music": "lofi",
         "musicVol": [0.44, 0.75] if not te else [0.6, 0.9], "musicFade": 0.05, "endPad": 0.4, "captionMode": "phrase",
         "musicEQ": [[180, -4, 1.0], [260, -8, 0.9], [2400, -3, 1.0]],   # Creative 19: a steady 200-300 Hz band read as a drone
         "musicPad": True, "musicGapGain": 2.0 if not te else 4.0,
         "musicEndRamp": END_GAIN_TE if te else END_GAIN_EN, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for k in range(a, b):
            n = k + 1
            who, shot, prop, en, tel, show_te = L[k]
            text = tel if te else TTS_EN.get(prop, en)
            show = show_te if te else SHOW_EN.get(prop, MARK.sub("", en).replace(" | ", " ").strip())
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": text, "show": show, "maxgap": 0.28,
                  "gap": GAP.get(prop, 0.16), "tempo": (TEMPO_TE if te else TEMPO)[who], "must": (MUST_TE if te else MUST_EN).get(prop, [])}
            if " | " in ln["text"]:   # two takes (Parler drops a long line's first sentence), joined by a short pause
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.3> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.3, "must2": (MUST_TE if te else MUST_EN).get(prop + "2", [])})
            elif not te and prop in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[prop]).strip()
            g = (-1.0 if who == "ai" else 0.5) + GAIN_PROP.get(prop, 0.0) + (GAIN_PROP_TE.get(prop, 0.0) if te else 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "board": BOARD, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_test", "tail": flags.get("tail", 0.2), **{k2: v for k2, v in flags.items() if k2 != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
