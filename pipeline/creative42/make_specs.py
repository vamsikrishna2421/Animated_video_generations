# Creative 42 "₹18,400 and a Date" (myth vs fact): writes reels/creative42v1.json (English) and reels/creative42te.json
# (Telugu). Lines from series/scripts/creative42_itr_deadline.md (v2 after the script review); [n] marks the words the
# pictures wait for; " | " = two takes with a beat. One narrator. Voices: pipeline/creative42/voice.py.
# Numbers: our test (series/scripts/creative42_demo). Scene: Itr42Crayon.tsx.
#   python3 pipeline/creative42/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "Last date for Kiran's tax refund: December thirty-first. [1] An AI told him: no fixed deadline.",
        "కిరణ్ టాక్స్ రీఫండ్ కి చివరి తేదీ, డిసెంబర్ ముప్పై ఒకటో తేదీ. [1] ఒక చాట్‌బాట్ మాత్రం, డెడ్‌లైన్ అసలు లేదు అని చెప్పింది."),
    2: ("myth", "Myth: missed July? An AI will tell you the new last date. [1] Fact: we asked a small AI with no internet, thirty times. The right answer: zero times.",
        "అపోహ: జూలై మిస్ అయితే, కొత్త తేదీ చాట్‌బాట్ చెప్తుంది. | [1] నిజం: ఇంటర్నెట్ లేని ఒక చిన్న చాట్‌బాట్ ని, ముప్పై సార్లు అడిగాం. ముప్పైకి ముప్పై, తప్పు సమాధానమే."),
    3: ("test", "Even told today's date, it was still wrong, ten out of ten. [1] And nine times, it made up a late fee, like half a percent of your tax a day.",
        "ఈరోజు తేదీ చెప్పినా, పదికి పది తప్పే. | [1] తొమ్మిది సార్లు, లేట్ ఫీజు కూడా తనే తయారు చేసింది. ఉదాహరణకి, రోజుకి టాక్స్ లో అర శాతం."),
    4: ("fact", "The tax department's own site: file by December thirty-first. [1] Late fee: one thousand rupees for Kiran, five thousand if you earn over five lakh.",
        "ఇన్‌కమ్ టాక్స్ సైట్ ప్రకారం: డిసెంబర్ ముప్పై ఒకటో తేదీ వరకు ఫైల్ చేయొచ్చు. | [1] లేట్ ఫీజు: కిరణ్ కి వెయ్యి. ఐదు లక్షల పైన ఆదాయం అయితే, ఐదు వేలు."),
    5: ("after", "After that, you can still file, but not to get the refund. [1] Kiran's eighteen thousand would need a special request, and it can be refused.",
        "అది దాటితే, రీఫండ్ చేజారిపోతుంది. | [1] కిరణ్ పద్దెనిమిది వేలకి, ప్రత్యేక రిక్వెస్ట్ ఒక్కటే మిగులుతుంది. అదీ రిజెక్ట్ కావచ్చు."),
    6: ("rule", "Apps that search the web may get it right. [1] Still, ask for the link, and take the date from the tax department's site.",
        "వెబ్ సెర్చ్ చేసే యాప్ లు, సరిగ్గా చెప్పొచ్చు. [1] అయినా, లింక్ అడగాలి. తేదీ, ఇన్‌కమ్ టాక్స్ సైట్ నుంచే తీసుకోవాలి."),
    7: ("loop", "Don't let a chatbot tell you [1] there's no deadline.", "చాట్‌బాట్ డెడ్‌లైన్ లేదు అన్నా, [1] తేదీ ఉంది."),
}
SHOW = {1: "Last date for Kiran's tax refund: December 31. An AI told him: no fixed deadline.",
        2: "Myth: missed July? An AI will tell you the new last date. Fact: we asked a small AI with no internet, 30 times. The right answer: 0 times.",
        3: "Even told today's date, it was still wrong, 10 out of 10. And 9 times, it made up a late fee, like 0.5% of your tax a day.",
        4: "The tax department's own site: file by December 31. Late fee: ₹1,000 for Kiran, ₹5,000 if you earn over ₹5 lakh.",
        5: "After that, you can still file, but not to get the refund. Kiran's ₹18,400 would need a special request, and it can be refused."}
SHOW_TE = {
    1: "The last date for Kiran's tax refund: December 31. But a chatbot said there's no deadline at all.",
    2: "Myth: miss July and a chatbot will tell you the new date. Fact: we asked a small chatbot with no internet, 30 times. 30 of 30: wrong answers.",
    3: "Even told today's date: 10 of 10 wrong. 9 times it made up a late fee too. For example: 0.5% of your tax a day.",
    4: "The income tax site: you can file until December 31. Late fee: ₹1,000 for Kiran. Income over ₹5 lakh: ₹5,000.",
    5: "Miss it, and the refund slips away. For Kiran's ₹18,400, only a special request is left. That can be refused too.",
    6: "Apps that search the web may get it right. Still, ask for the link. Take the date from the income tax site.",
    7: "Even if a chatbot says no deadline, there is a date.",
}
TEMPO_EN = {"storyteller": 1.14}
TEMPO_TE = {"storyteller": 1.15}
T = {
    "refund": "KIRAN'S TAX REFUND: ₹18,400", "leftLab": "REAL LAST DATE", "leftVal": "31 DEC\n2026",
    "rightLab": "AN AI SAID", "rightVal": "NO\nDEADLINE",
    "askShort": "I missed July. By when can I file?",
    "aiLine": "\"There is no fixed deadline for filing late returns after July 31\"",
    "story": "Kiran is made up · our test is real",
    "myth": "Missed July? An AI will tell you the new last date.",
    "factLine": "a small AI, no internet, asked 30 times", "zero": "0 OF 30", "zeroSub": "THE RIGHT ANSWER",
    "model": "Qwen2.5 7B on our computer · no web search · every reply read by us",
    "testHead": "OUR TEST · 30 CHATS",
    "tiles": [["TOLD TODAY'S DATE", "'end of September' · '31 October' · no date", "0/10"],
              ["ASKED 'I MISSED JULY'", "'There is no fixed deadline'", "2/10"],
              ["A MADE-UP LATE FEE", "'0.5% of the tax a day, up to 25%'", "9/30"]],
    "feeChip": "the real fee is a flat ₹1,000 or ₹5,000 (below)",
    "siteHead": "incometax.gov.in · e-filing help", "siteSub": "income from April 2025 to March 2026",
    "belatedLab": "MISSED JULY 31? A LATE (BELATED) RETURN:", "belatedVal": "BY 31 DEC 2026",
    "feeLab": "LATE FEE", "fee1": "₹1,000 if income is up to ₹5 lakh (Kiran)", "fee2": "₹5,000 above ₹5 lakh",
    "siteSrc": "Income Tax Department, e-filing help: Income Tax Returns FAQ (AY 2026-27)",
    "afterHead": "KIRAN'S ₹18,400", "p1": "31 JUL", "p1sub": "the usual date: missed",
    "p2": "31 DEC", "p2sub": "late return: the refund still comes", "p3": "AFTER", "p3sub": "you can still file, but not for a refund",
    "afterStamp": "A SPECIAL REQUEST · MAY BE REFUSED",
    "ruleHead": "WHAT TO DO", "rule1": "APPS THAT SEARCH THE WEB MAY GET IT RIGHT", "rule1b": "we tested one small AI with no internet",
    "rule2": "ASK FOR THE LINK · NO LINK, NO DATE", "rule2b": "the date: incometax.gov.in",
    "ruleChip": "belated return, income Apr 2025-Mar 2026: by 31 Dec 2026",
}
# Sound (CLAUDE.md arc, few effects after the script review): a hit and a cash-register on frame 1, a buzz after
# "deadline"; a bonk on MYTH and a hit on "0 OF 30"; two pops on the tiles; a ding on the official card; a drop before
# "but not to get the refund" and a low hit; a lift into the rule; a riser and the slam back to frame 1.
SCENES = [("s_a", (1,), {"boost": 2.4, "tail": 0.1}),
          ("s_b", (2, 3), {"boost": 1.6, "lift": 0.7, "drop_at": [[0, "1", 0.0]], "tail": 0.1}),
          ("s_c", (4, 5), {"boost": 1.6, "lift": 0.6, "drop_at": [[1, "1", 0.0]], "tail": 0.1}),
          ("s_d", (6,), {"boost": 3.0, "lift": 1.0, "rise": 2.6, "tail": 0.3}),
          ("s_e", (7,), {"outro": True, "pre": 0.3, "boost": 3.2, "lift": 0.8, "rise": 3.2, "tail": 0.0})]
GAP = {n: 0.25 for n in LINES} | {1: 0.35, 2: 0.3, 6: 0.5, 7: 0.0}
GAP_TE = {n: 0.18 for n in LINES} | {1: 0.3, 6: 0.45, 7: 0.0}
FLAGS_TE = {}
YT = {"s_a": "₹18,400, 31 Dec", "s_b": "0 of 30", "s_c": "The real date and fee", "s_d": "Ask for the link", "s_e": "No deadline?"}
NAMES = {"storyteller": ""}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative42te" if te else "creative42v1"
    s = {"id": sid, "title": "₹18,400 and a Date (Creative 42)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.45, "music": "lofi", "names": NAMES,
         "musicVol": [0.18, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [200, -10, 0.9], [250, -14, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.6,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1390, "endPad": 0.3}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.45, "endPad": 0.2, "musicVol": [0.15, 0.4], "musicGapGain": 0.35})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "maxgap": 0.22 if te else 0.3, "gap": (GAP_TE if te else GAP).get(n, 0.3),
                  "tempo": TEMPO_TE["storyteller"] if te else TEMPO_EN["storyteller"]}
            if " | " in raw:   # Telugu lines 2-5: two takes (Parler babbled on the long line 2)
                p1, p2 = raw.split(" | ")
                pz = 0.35
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": "storyteller", "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1390, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_itr42", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
