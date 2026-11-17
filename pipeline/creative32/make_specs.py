# Creative 32 "₹36,000, Said a Free AI. ₹44,000, the Real Cost." (series/scripts/creative32_tenant.md): a nature-documentary
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
    1: ("narrator", "hook", "A free AI said thirty-six thousand. [1] The real cost: forty-four.",
        "ఒక ఫ్రీ చాట్‌బాట్: ముప్పై ఆరు వేలు. [1] అసలు లెక్క: నలభై నాలుగు వేలు."),
    2: ("narrator", "wild", "Here, among the cardboard, the young tenant prepares to migrate. [1] A job in Pune, four months in.",
        "అట్టపెట్టెల మధ్య, మన టెనెంట్ వలసకి సిద్ధమవుతోంది. [1] పూణే లో కొత్త ఉద్యోగం; నాలుగు నెలలే అయ్యాయి."),
    3: ("anusha", "ask", "I may have to move out after four months. [1] What will it cost me?",
        "నాలుగు నెలలకే ఖాళీ చేయాల్సి రావచ్చు. [1] నాకు ఎంత ఖర్చవుతుంది?"),
    4: ("narrator", "reply", "The AI read all fourteen clauses. [1] Thirty-six thousand, it says: the lock-in.",
        "పద్నాలుగు క్లాజులూ చాట్‌బాట్ చదివింది. [1] ముప్పై ఆరు వేలు, అంటోంది: లాక్ ఇన్ పెనాల్టీ."),
    5: ("anusha", "relief", "Fifty-four thousand deposit, minus thirty-six. [1] Well, at least eighteen thousand comes back.",
        "యాభై నాలుగు వేల డిపాజిట్, ముప్పై ఆరు పోతే, [1] సరే, పద్దెనిమిది అయినా వస్తాయి."),
    6: ("narrator", "lurk", "But deep in clause eleven, [1] something waits.",
        "కానీ క్లాజ్ పదకొండు లోతుల్లో, [1] ఏదో దాక్కుని ఉంది."),
    7: ("anusha", "shock", "An eight thousand painting charge?! [1] So ten thousand back, not eighteen?!",
        "ఎనిమిది వేలు పెయింటింగ్ చార్జీనా?! [1] అంటే వచ్చేది పది వేలే, పద్దెనిమిది కాదా?!"),
    8: ("narrator", "test", "We gave a small free AI, offline, a sample agreement we wrote. [1] Thirty-six thousand: ten out of ten. | [2] The painting charge: not once.",
        "ఆఫ్‌లైన్ లో ఒక చిన్న ఫ్రీ చాట్‌బాట్ కి, మేము రాసిన శాంపిల్ అగ్రిమెంట్ ఇచ్చాం. [1] ముప్పై ఆరు వేలు: పదికి పది. | [2] పెయింటింగ్ చార్జీ: ఒక్కసారి కూడా చెప్పలేదు."),
    9: ("narrator", "fix", "Then we asked for every amount, with its clause number. [1] Ten out of ten named the painting charge. | [2] So open those clauses, and add them up yourself.",
        "తర్వాత, ప్రతి రూపాయి క్లాజ్ నంబర్ తో అడిగాం. [1] పదికి పది, పెయింటింగ్ చార్జీ చూపించింది. | [2] అందుకే, ఆ క్లాజులు మీరే చదివి, లెక్క వేసుకోండి."),
    10: ("narrator", "loop", "Meanwhile, next door, [1] another tenant asks the AI the same question...",
         "ఇంతలో, పక్క ఫ్లాట్ లో, [1] ఇంకో టెనెంట్ అదే ప్రశ్న అడుగుతోంది..."),
}
SHOW = {1: "A free AI said ₹36,000. The real cost: ₹44,000.",
        2: "Here, among the cardboard, the young tenant prepares to migrate. A job in Pune, 4 months in.",
        3: "I may have to move out after 4 months. What will it cost me?",
        4: "The AI read all 14 clauses. ₹36,000, it says: the lock-in.",
        5: "₹54,000 deposit, minus ₹36,000. Well, at least ₹18,000 comes back.",
        6: "But deep in clause 11, something waits.",
        7: "An ₹8,000 painting charge?! So ₹10,000 back, not ₹18,000?!",
        8: "We gave a small free AI, offline, a sample agreement we wrote. ₹36,000: 10 out of 10. <pause 0.5> The painting charge: not once.",
        9: "Then we asked for every amount, with its clause number. 10 out of 10 named the painting charge. <pause 0.4> So open those clauses, and add them up yourself.",
        10: "Meanwhile, next door, another tenant asks the AI the same question..."}
SHOW_TE = {
    1: "A free chatbot: ₹36,000. The real figure: ₹44,000.",
    2: "Among the cardboard boxes, our tenant gets ready to migrate. A new job in Pune; only 4 months in.",
    3: "I may have to move out after just 4 months. What will it cost me?",
    4: "The chatbot read all 14 clauses. ₹36,000, it says: the lock-in penalty.",
    5: "₹54,000 deposit, minus ₹36,000: okay, at least ₹18,000 comes back.",
    6: "But deep in clause 11, something is hiding.",
    7: "An ₹8,000 painting charge?! So I get only ₹10,000 back, not ₹18,000?!",
    8: "We gave a small free chatbot, offline, a sample agreement we wrote. ₹36,000: 10 out of 10. <pause 0.5> The painting charge: it never said it once.",
    9: "Then we asked for every rupee, with its clause number. 10 out of 10 showed the painting charge. <pause 0.4> So read those clauses yourself and do the sum.",
    10: "Meanwhile, in the next flat, another tenant is asking the same question...",
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
GAP = {1: 0.3, 2: 0.25, 3: 0.25, 4: 0.25, 5: 0.3, 6: 0.3, 7: 0.35, 8: 0.3, 9: 0.35, 10: 0.0}
FLAGS_TE = {"s_e": {"boost": 2.4, "rise": 2.8}}
YT = {"s_a": "₹36,000 vs ₹44,000", "s_b": "What will it cost?", "s_c": "Clause 11", "s_d": "Our test, the better question", "s_e": "The next flat"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"narrator": "Narrator", "anusha": "Anusha"}, "te": {"narrator": "Narrator", "anusha": "Anusha"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative32te" if te else "creative32v1"
    s = {"id": sid, "title": "₹36,000, Said a Free AI. ₹44,000, the Real Cost. (Creative 32)" + (" (Telugu audio)" if te else ""),
         "label": "", "banner": "", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.14, 0.24], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
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
                  "tempo": 1.12 if te else 1.08}
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
