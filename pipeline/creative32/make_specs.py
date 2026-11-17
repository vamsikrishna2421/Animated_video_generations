# Creative 32 "₹36,000, Said the AI. ₹44,000, Said Clause 11." (series/scripts/creative32_tenant.md): a nature-documentary
# parody (the format last used by Creative 13, Oct 29): a hushed narrator watches Anusha, a tenant packing for a job in
# Pune, ask an AI what moving out after 4 months will cost. Our test (pipeline/creative32/summary_demo.py, a rental
# agreement we made up): asked that, a small free AI said Rs 36,000 ten times out of ten and never named clause 11's
# Rs 8,000 painting deduction; asked for every amount with its clause number, it named it ten times out of ten.
# Writes reels/creative32v1.json (English) and reels/creative32te.json (Telugu). [n] marks the words the picture waits for;
# " | " = two takes with a beat of silence. Voices: pipeline/creative32/voice.py. Scene: Lease32Crayon.tsx.
#   python3 pipeline/creative32/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("narrator", "hook", "The AI told her moving out would cost thirty-six thousand. [1] Her agreement says forty-four.",
        "చాట్‌బాట్ చెప్పింది: ఇల్లు ఖాళీ చేస్తే ముప్పై ఆరు వేలు. [1] అగ్రిమెంట్ లో మాత్రం: నలభై నాలుగు వేలు."),
    2: ("narrator", "wild", "Here, among the cardboard, the young tenant prepares to migrate. [1] A job in Pune. Four months into an eleven-month agreement.",
        "ఇక్కడ, అట్టపెట్టెల మధ్య, మన టెనెంట్ వలసకి సిద్ధమవుతోంది. [1] పూణే లో కొత్త ఉద్యోగం; పదకొండు నెలల అగ్రిమెంట్ లో, నాలుగు నెలలే అయ్యాయి."),
    3: ("anusha", "ask", "I may have to move out after four months. [1] What will it cost me?",
        "నాలుగు నెలలకే ఖాళీ చేయాల్సి రావచ్చు. [1] నాకు ఎంత ఖర్చవుతుంది?"),
    4: ("narrator", "reply", "The AI has all fourteen clauses. [1] Thirty-six thousand, it says. The lock-in penalty.",
        "చాట్‌బాట్ దగ్గర, పద్నాలుగు క్లాజులూ ఉన్నాయి. [1] ముప్పై ఆరు వేలు, అంటోంది. లాక్ ఇన్ పెనాల్టీ."),
    5: ("anusha", "relief", "Fifty-four thousand deposit, minus thirty-six. [1] Eighteen thousand back. Fine!",
        "యాభై నాలుగు వేల డిపాజిట్, ముప్పై ఆరు పోతే, [1] పద్దెనిమిది వేలు వెనక్కి. పర్లేదు!"),
    6: ("narrator", "lurk", "But deep in clause eleven, [1] something waits.",
        "కానీ క్లాజ్ పదకొండు లోతుల్లో, [1] ఒకటి దాక్కుని ఉంది."),
    7: ("anusha", "shock", "Eight thousand for painting?! [1] So ten thousand back, not eighteen?!",
        "పెయింటింగ్ కి ఎనిమిది వేలా?! [1] అంటే వచ్చేది పది వేలే, పద్దెనిమిది కాదా?!"),
    8: ("narrator", "test", "We asked a small free AI on our computer the same question, ten times. [1] Thirty-six thousand: ten times. | [2] The painting: not once.",
        "మా కంప్యూటర్ లో ఒక చిన్న ఫ్రీ చాట్‌బాట్ ని, ఇదే ప్రశ్న పదిసార్లు అడిగాం. [1] ముప్పై ఆరు వేలు: పదిసార్లూ. | [2] పెయింటింగ్: ఒక్కసారి కూడా లేదు."),
    9: ("narrator", "fix", "So ask it this: list every amount I may pay or lose, with the clause number. [1] Ten out of ten found the painting. | [2] Then open those clauses, and add them up yourself.",
        "అందుకే ఇలా అడగండి: నేను కట్టాల్సిన, కోల్పోయే ప్రతి రూపాయి, క్లాజ్ నంబర్ తో చెప్పు. [1] పదికి పది, పెయింటింగ్ చూపించింది. | [2] ఆ క్లాజులు మీరే చదివి, లెక్క వేసుకోండి."),
    10: ("narrator", "loop", "Meanwhile, in the next flat, [1] another tenant asks the AI what moving out will cost...",
         "ఇంతలో, పక్క ఫ్లాట్ లో, [1] ఇంకో టెనెంట్ చాట్‌బాట్ ని అడుగుతోంది, ఖాళీ చేస్తే ఎంత అవుతుందని..."),
}
SHOW = {1: "The AI told her moving out would cost ₹36,000. Her agreement says ₹44,000.",
        2: "Here, among the cardboard, the young tenant prepares to migrate. A job in Pune. 4 months into an 11-month agreement.",
        3: "I may have to move out after 4 months. What will it cost me?",
        4: "The AI has all 14 clauses. ₹36,000, it says. The lock-in penalty.",
        5: "₹54,000 deposit, minus ₹36,000. ₹18,000 back. Fine!",
        6: "But deep in clause 11, something waits.",
        7: "₹8,000 for painting?! So ₹10,000 back, not ₹18,000?!",
        8: "We asked a small free AI on our computer the same question, 10 times. ₹36,000: 10 times. <pause 0.5> The painting: not once.",
        9: "So ask it this: list every amount I may pay or lose, with the clause number. 10 out of 10 found the painting. <pause 0.4> Then open those clauses, and add them up yourself.",
        10: "Meanwhile, in the next flat, another tenant asks the AI what moving out will cost..."}
SHOW_TE = {
    1: "The chatbot said: moving out costs ₹36,000. The agreement says: ₹44,000.",
    2: "Here, among the cardboard boxes, our tenant gets ready to migrate. A new job in Pune; 4 months into an 11-month agreement.",
    3: "I may have to move out after just 4 months. What will it cost me?",
    4: "The chatbot has all 14 clauses. ₹36,000, it says. The lock-in penalty.",
    5: "₹54,000 deposit, minus ₹36,000: ₹18,000 back. That's fine!",
    6: "But deep in clause 11, something is hiding.",
    7: "₹8,000 for painting?! So I get only ₹10,000 back, not ₹18,000?!",
    8: "We asked a small free chatbot on our computer the same question 10 times. ₹36,000: all 10 times. <pause 0.5> The painting: not even once.",
    9: "So ask it like this: tell me every rupee I must pay or lose, with the clause number. 10 out of 10 showed the painting. <pause 0.4> Read those clauses yourself and do the sum.",
    10: "Meanwhile, in the next flat, another tenant is asking the chatbot what moving out will cost...",
}
SPLIT_PAUSE = {8: 0.5, 9: 0.4}
SPLIT_PAUSE_TE = {8: 0.5, 9: 0.4}
T = {   # on screen: our test (series/scripts/creative32_demo/summary.json); the agreement, flat and people are made up
    "ask": "I may have to move out after 4 months for a job transfer. What will it cost me?",
    "reply": "So, if you need to move out after 4 months for a job transfer, you will have to pay Rs 36,000 as a penalty according to the agreement.",
    "lit": "you will have to pay Rs 36,000",
    "c10": "10. Lock-in: ... If the Tenant vacates during the lock-in period, the Tenant shall pay two months' rent, Rs 36,000, as a penalty, which the Owner may deduct from the security deposit.",
    "c11": "11. Painting: when the Tenant vacates, Rs 8,000 towards repainting shall be deducted from the security deposit.",
    "better": "List every amount of money I may have to pay or lose, and every condition on leaving early. Give the clause number for each.",
    "found": "Cost towards Repainting when Vacating: Rs 8,000 deducted from the security deposit (Clause 11)",
}
# Sound (CLAUDE.md arc): jungle bed and a boom on frame 1; a pop on the question; a ding on "Fine!"; the bed drops out
# before "something waits" and a low boom on clause 11; a buzz on "ten thousand"; ticks on the test tiles, a drop before
# "not once"; a ding on "ten out of ten"; a riser into the loop and the slam.
SCENES = [("s_a", (1, 2), {"boost": 1.5, "drop_at": [[0, 1, 0.3]], "tail": 0.0}),
          ("s_b", (3, 4, 5), {"boost": 0.9, "tail": 0.0}),
          ("s_c", (6, 7), {"boost": 1.2, "lift": 0.6, "drop_at": [[0, 1, 0.6]], "tail": 0.0}),
          ("s_d", (8, 9), {"boost": 1.1, "lift": 0.5, "drop_at": [[0, 2, 0.45]], "swell": [1, 1, 1.8], "tail": 0.0}),
          ("s_e", (10,), {"outro": True, "pre": 0.3, "boost": 2.2, "lift": 0.7, "rise": 2.6, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.35, 6: 0.3, 7: 0.4, 8: 0.35, 9: 0.4, 10: 0.0}
FLAGS_TE = {"s_e": {"boost": 2.4, "rise": 2.8}}
YT = {"s_a": "₹36,000 vs ₹44,000", "s_b": "What will it cost?", "s_c": "Clause 11", "s_d": "Our test, the better question", "s_e": "The next flat"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"narrator": "Narrator", "anusha": "Anusha"}, "te": {"narrator": "Narrator", "anusha": "Anusha"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative32te" if te else "creative32v1"
    s = {"id": sid, "title": "₹36,000, Said the AI. ₹44,000, Said Clause 11. (Creative 32)" + (" (Telugu audio)" if te else ""),
         "label": "", "banner": "", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.14, 0.24], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.4, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1370}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.4})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.08 if te else 1.04}
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1370, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_lease32", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
