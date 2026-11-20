# Creative 35 "30 Days or 30 Weeks?": writes reels/creative35v1.json (English) and reels/creative35te.json (Telugu).
# Lines from series/scripts/creative35_policy_telugu.md; [n] marks the words the picture waits for; " | " = two takes
# with a beat of silence. One narrator. Voices: pipeline/creative35/voice.py. Scene: Policy35Crayon.tsx. The Telugu on
# screen is copied from our test's replies (series/scripts/creative35_demo/translate.json); the rule is IRDAI's
# Master Circular on Protection of Policyholders' Interests, Sep 5, 2024 (Business Standard, TeamLease, Angel One).
#   python3 pipeline/creative35/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu). v2 (script review): "imagine" labels the story; the myth is what the test showed
    # (the number stays, the unit and the "not" change), so big apps don't contradict it; "Customer Information Sheet"
    # said, who to ask, a card to screenshot; honest counts ("once"); the real "not covered" flip
    1: ("hook", "Imagine Sarojini garu's policy: claim within thirty days. | [1] Her AI's Telugu said thirty weeks. She thought she had time. Rejected.",
        "ఒకవేళ సరోజిని గారి పాలసీలో: ముప్పై రోజుల్లో క్లెయిమ్ పెట్టాలి. | [1] చాట్‌బాట్ తెలుగులో మాత్రం: ముప్పై వారాలు. టైం ఉందనుకుంది; క్లెయిమ్ రిజెక్ట్."),
    2: ("myth", "Myth: if the numbers match, the translation is right. [1] Fact: in our test, the number stayed and the unit changed.",
        "అపోహ: నంబర్ సరిగ్గా ఉంటే, ట్రాన్స్‌లేషన్ సరైనదే. [1] నిజం: నంబర్ అలాగే ఉంది; రోజులు, వారాలు అయ్యాయి."),
    # v3 (render review): the three findings as short sentences, the big apps named as not tested, "will be settled" was
    # one reply, the better ask also asked for every "not", and the check needs someone who reads both languages
    3: ("test", "We tested a small free AI five times, not ChatGPT or Google Translate. [1] Thirty days was right only once. Once, it said thirty weeks. [2] Two years once became two weeks. [3] And one reply turned maternity 'not covered' into 'will be settled'.",
        "ఒక చిన్న ఫ్రీ చాట్‌బాట్, ఐదు సార్లు; చాట్‌జీపీటీ, గూగుల్ ట్రాన్స్‌లేట్ కాదు. | [1] ముప్పై రోజులు, ఒక్కసారే సరిగ్గా వచ్చింది. [2] రెండు సంవత్సరాలు, ఒకసారి రెండు వారాలు అయింది. [3] ఒక రిప్లై లో, మెటర్నిటీ కవర్ కాదు అనేది, సెటిల్ చేస్తారు అని మారింది."),
    4: ("better", "Telling it to keep every number and every 'not' fixed thirty days: four of five. | [1] But 'not covered' still never survived.",
        "ప్రతి నంబర్, ప్రతి కాదు ఉంచు అని చెప్తే, ముప్పై రోజులు ఐదులో నాలుగు సార్లు వచ్చింది. | [1] కానీ కవర్ కాదు అనేది, ఒక్కసారి కూడా రాలేదు."),
    5: ("rule", "So for money papers, ask your agent or customer care for the Customer Information Sheet in Telugu. [1] Since 2024, insurers must give it when you ask. [2] With any app, get someone who reads both languages to check every unit and every 'not'.",
        "అందుకే డబ్బు పేపర్లకి, మీ ఏజెంట్ ని గానీ కస్టమర్ కేర్ ని గానీ, కస్టమర్ ఇన్ఫర్మేషన్ షీట్ తెలుగులో అడగండి. | [1] అడిగితే ఇవ్వాలని ఇన్సూరెన్స్ రెగ్యులేటర్ రూల్. [2] ఎలాంటి యాప్ వాడినా, రోజులా వారాలా, కవర్ కాదా, తెలిసిన వాళ్ళతో చదివించుకోండి."),
    6: ("loop", "Thirty days, [1] or thirty weeks?", "ముప్పై రోజులా, [1] ముప్పై వారాలా?"),
}
TTS_EN = {}
SHOW = {}
SHOW_TE = {}
SPLIT_PAUSE = {1: 0.4, 4: 0.7}   # 4: the silence before "never survived"
SPLIT_PAUSE_TE = {1: 0.35, 3: 0.2, 4: 0.5, 5: 0.25}
TEMPO_TE = {5: 1.13}   # v3 ran 61.5 s; the ask line has no numbers to cram   # TE 3 and 5 split: Parler garbled 3 and ran 5 to 21 s as one take
T = {
    "bill": "₹48,000 hospital claim", "policy": "30 DAYS", "ai": "30 WEEKS", "aiGloss": "30 వారాల = 30 weeks",
    "teLine": "30 వారాల మీద", "story": "a story · our test is real",
    "myth": "If the numbers match, the translation is right.", "fact": "The number stayed. The unit changed.",
    "factPic": ["30 days", "30 వారాల (weeks)"],
    "model": "a small free AI on our computer · 5 tries · not Google Translate",
    "ask": "Translate this into Telugu for my mother:", "askSub": "+ a 10-line health policy we wrote",
    "tiles": [["\"claim within 30 days\"", "30 వారాల మీద ...", "= on 30 weeks (one reply)", "right 1 of 5", False],
              ["\"covered only after 2 years\"", "2 వారాల ...", "= 2 weeks (one reply)", "right 1 of 5", False],
              ["\"maternity: not covered\"", "జనన ఖర్చులు పరిష్కరించబడతాయి", "= birth expenses will be settled (one reply)", "kept 0 of 5", False]],
    "betterAsk": "+ \"KEEP EVERY NUMBER AND EVERY 'NOT'\"", "betterNum": "4 of 5", "betterNumLab": "\"30 days\" kept", "betterNumSub": "\"2 years\": still only 2 of 5", "betterNot": "0 of 5", "betterLesson": "it helped some numbers, never the \"not\"",
    "card": "Please send my policy's Customer Information Sheet in Telugu.",
    "cardSrc": "IRDAI rule since Sep 2024: insurers must give it when you ask",
    "cardNote": "it's a summary: the policy wording stays the reference",
    "checkLab": "WITH ANY APP: SOMEONE WHO READS BOTH CHECKS", "check": "days · weeks · months · every \"not\"",
}
SCENES = [("s_a", (1,), {"boost": 2.2, "drop_at": [[0, 1, 0.5]], "tail": 0.6}),   # tail: the REJECTED stamp holds
          ("s_b", (2, 3), {"boost": 0.9, "lift": 0.6, "swell": [1, 3, 1.7], "tail": 0.2}),
          ("s_c", (4,), {"boost": 1.4, "lift": 0.6, "drop_at": [[0, 1, 0.8]], "tail": 0.2}),
          ("s_d", (5,), {"boost": 2.6, "lift": 0.8, "rise": 1.8, "tail": 0.9}),   # the ask builds
          ("s_e", (6,), {"outro": True, "pre": 0.3, "boost": 3.4, "lift": 0.8, "rise": 3.6, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.4, 6: 0.0}
GAP_TE = {1: 0.2, 2: 0.2, 3: 0.2, 4: 0.2, 5: 0.2, 6: 0.0}   # the Telugu cut ran 62.5 s: tighter gaps keep it under 60
FLAGS_TE = {"s_a": {"tail": 0.2}, "s_d": {"tail": 0.5}, "s_e": {"boost": 3.2, "rise": 3.4}}
YT = {"s_a": "30 days or 30 weeks?", "s_b": "Myth vs fact, our test", "s_c": "A better prompt?", "s_d": "What to ask for", "s_e": "30 days or 30 weeks?"}
NAMES = {"en": {"storyteller": ""}, "te": {"storyteller": ""}}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative35te" if te else "creative35v1"
    s = {"id": sid, "title": "30 Days or 30 Weeks? (Creative 35)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.28], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1440}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.35, "endPad": 0.5, "musicVol": [0.18, 0.24]})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.22 if te else 0.3,
                  "gap": (GAP_TE if te else GAP).get(n, 0.3), "tempo": TEMPO_TE.get(n, 1.1) if te else 1.12}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1440, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_policy35", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
