# UC02 "₹168, With a Link" (how an AI answers with web search): writes reels/uc02v1.json (English) and
# reels/uc02te.json (Telugu). Lines from series/scripts/uc02_web_search.md (v2 after the script review); [n] marks the
# words the pictures wait for; " | " = two takes with a beat. Voices: pipeline/uc02/voice.py (the Creative 21 standard).
# Numbers: our test (series/scripts/uc02_demo). Scene: Search02Crayon.tsx.
#   python3 pipeline/uc02/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the shop ("hook", "wide", "ravi", "ai") or an insert ("steps", "test",
# "quiz", "study"). prop: Search02Crayon.tsx.
LINES = {
    1: ("ravi", "hook", "hook", "One sixty-eight a kilo, with a link! [1] The market today: one forty-two! Thirteen hundred rupees gone!",
        "కిలో నూట అరవై ఎనిమిది అని, లింక్ కూడా ఇచ్చింది! [1] మార్కెట్ లో ఈరోజు నూట నలభై రెండు! పదమూడు వందలు పోయాయి!"),
    2: ("ai", "ai", "real", "The link is real. [1] That page does say one sixty-eight.",
        "లింక్ నిజమే. [1] ఆ పేజీలో నూట అరవై ఎనిమిదే ఉంది."),
    3: ("ravi", "ravi", "how", "Then how is it wrong?!", "మరి తప్పెలా అయింది?!"),
    4: ("ai", "steps", "steps", "I searched: [1] the top page said \"today\". [2] I read it: no date anywhere. [3] I answered with the link. | [4] But this app never told me today's date.",
        "నేను వెతికాను: [1] పైన వచ్చిన పేజీలో ఈరోజు అని ఉంది. [2] చదివాను: ఎక్కడా తేదీ లేదు. [3] లింక్ తో జవాబు ఇచ్చాను. | [4] కానీ ఈ యాప్, ఈరోజు తేదీ నాకు చెప్పలేదు."),
    5: ("ravi", "ravi", "phone", "Doesn't every phone know the date?!", "ప్రతి ఫోన్ కి తేదీ తెలుసు కదా?!"),
    6: ("ai", "test", "test", "The phone does. I only know what the app tells me. [1] Without the date: one sixty-eight, ten out of ten. [2] Given the date, by the app or in your question: today's page, one forty-two, ten out of ten.",
        "ఫోన్ కి తేదీ తెలుసు. యాప్ చెప్తేనే, నాకు తెలుస్తుంది. | [1] తేదీ చెప్పకపోతే, పది సార్లూ నూట అరవై ఎనిమిది. [2] తేదీ చెప్తే, పది సార్లూ ఈరోజు పేజీ, నూట నలభై రెండు."),
    7: ("ravi", "quiz", "quiz", "So what do I do? [1] A, trust the link. [2] B, ask again. [3] C, open the link.",
        "మరి నేనేం చేయాలి? [1] ఒకటి, లింక్ ని నమ్మడం. [2] రెండు, మళ్ళీ అడగడం. [3] మూడు, లింక్ తెరిచి చూడటం."),
    8: ("ai", "quiz", "answer", "C! | [1] Asked again in new chats: one sixty-eight, every time. [2] A link shows where I read it, not when.",
        "మూడోది! | [1] కొత్త చాట్ లో మళ్ళీ అడిగినా, ప్రతిసారీ నూట అరవై ఎనిమిదే. [2] లింక్ తో, ఎక్కడ చదివానో తెలుస్తుంది. ఆ పేజీ పాతదో కొత్తదో తెలియదు."),
    9: ("ravi", "ravi", "big", "And the big apps?", "పెద్ద యాప్స్ సంగతి?"),
    10: ("ai", "study", "study", "A different slip: in a 2025 test, [1] eight AI search tools, together, got the source wrong in over sixty percent of answers.",
         "ఇది వేరే తప్పు. పోయిన ఏడాది ఒక టెస్ట్ జరిగింది. [1] ఎనిమిది సెర్చ్ యాప్స్ కలిపి, వందలో అరవై సార్లకి పైగా తప్పు సోర్స్ చూపించాయి."),
    11: ("ravi", "ravi", "rule", "Open the link. [1] \"Today\" is not a date. [2] No date? Type today's date, and ask again!",
         "లింక్ ఓపెన్ చేసి చూడు. [1] టుడే అని ఉంటే సరిపోదు. డేట్ ఉండాలి. [2] డేట్ లేకపోతే, ఈరోజు డేట్ టైప్ చేసి అడుగు!"),
    12: ("ai", "ai", "loop", "Today's price: one sixty-eight, [1] with a link!", "ఈరోజు ధర: నూట అరవై ఎనిమిది, [1] లింక్ కూడా ఉంది!"),
}
SHOW = {1: "₹168 a kilo, with a link! The market today: ₹142! ₹1,300 gone!",
        2: "The link is real. That page does say ₹168.",
        6: "The phone does. I only know what the app tells me. Without the date: ₹168, 10 out of 10. Given the date, by the app or in your question: today's page, ₹142, 10 out of 10.",
        8: "C! <pause 0.8> Asked again in new chats: ₹168, every time. A link shows where I read it, not when.",
        10: "A different slip: in a 2025 test, 8 AI search tools, together, got the source wrong in over 60% of answers.",
        12: "Today's price: ₹168, with a link!"}
SHOW_TE = {
    1: "It said ₹168 a kilo, and even gave a link! In the market today, ₹142! ₹1,300 gone!",
    2: "The link is real. That page does say ₹168.",
    3: "Then how did it go wrong?!",
    4: "I searched: the page on top said \"today\". I read it: no date anywhere. I answered with the link. <pause 0.6> But this app never told me today's date.",
    5: "Every phone knows the date, right?!",
    6: "The phone knows. I only know it if the app tells me. <pause 0.6> Without the date: all 10 times ₹168. With the date: all 10 times today's page, ₹142.",   # Parler garbled the one-take line
    7: "So what should I do? One, trust the link. Two, ask again. Three, open the link and look.",
    8: "The third one! <pause 0.6> Asked again in a new chat, still ₹168 every time. A link tells you where I read it. Not whether the page is old or new.",
    9: "What about the big apps?",
    10: "This is a different mistake. A test last year: 8 search apps, together, showed the wrong source more than 60 times in 100.",
    11: "Open the link and look. \"Today\" is not enough, there must be a date. No date? Type today's date and ask!",
    12: "Today's price: ₹168, there's a link too!",
}
TTS_EN = {}
TEMPO_EN = {"ravi": 1.1, "ai": 1.09}   # render review added ~6 s; a touch faster
TEMPO_TE = {"ravi": 1.07, "ai": 1.08}
T = {
    "leftLab": "SHOP AI, WITH A LINK", "leftVal": "₹168/kg", "rightLab": "BEGUM BAZAR TODAY", "rightVal": "₹142/kg",
    "stake": "50 kg · ₹1,300 extra", "story": "Ravi and the shop are made up · our test is real",
    "oldUrl": "hyderabad-prices.example/toor-dal-wholesale-price-hyderabad-today",
    "oldTitle": "Toor dal wholesale price in Hyderabad today", "oldLine": "₹168 per kg at Begum Bazar", "noDate": "no date on the page",
    "reallySays": "✓ the page really says ₹168",
    "stepsHead": "HOW IT ANSWERED, STEP BY STEP", "stepsSub": "our test · a made-up mini web of 6 pages",
    "step1": "SEARCH", "topResult": "top result: \"...price in Hyderabad today\"", "step2": "READ", "step3": "ANSWER + LINK",
    "noToday": "today's date? the app never told it",
    "testHead": "OUR TEST · 10 FRESH CHATS EACH", "testSub": "the shop AI = a small free AI on our computer",
    "aLab": "NOT GIVEN TODAY'S DATE", "aBig": "₹168", "aSub": "10 of 10 · cited the old page",
    "bLab": "GIVEN TODAY'S DATE", "bBig": "₹142", "bSub": "by the app: 10 of 10 · typed in the question: 10 of 10",
    "builder1": "BUILDING AN AI APP?", "builder2": "put today's date in its instructions",
    "quizHead": "SO WHAT DO YOU DO?", "quizSub": "you decide",
    "opts": [["A", "trust the link"], ["B", "ask again"], ["C", "open the link"]],
    "askAgain": "asked again in 10 new chats: ₹168 every time", "whereNotWhen": "a link shows WHERE it read, not WHEN",
    "studyHead": "\"AND THE BIG APPS?\"", "studySub": "Columbia Journalism Review (Tow Center), March 2025",
    "studyRows": ["a different slip: the source itself", "8 AI search tools · 1,600 questions"], "studyBig": "60%+", "studyLab": "wrong source, all 8 together",
    "studySpread": "best tool 37% wrong · worst 94%",
    "rule1": "OPEN THE LINK", "rule2": "\"TODAY\" IS NOT A DATE", "rule3": "NO DATE? TYPE TODAY'S DATE, ASK AGAIN",
}
T_TE = {"opts": [["1", "trust the link"], ["2", "ask again"], ["3", "open the link"]]}
# Sound (CLAUDE.md arc): a boom, clap and cash-register on frame 1, a buzz under "gone"; a ding on "the page says ₹168";
# pops on each step box, a buzz on "no date"; a buzz on ₹168 and a success on ₹142 in the test; a pop on the quiz and a
# clock tick in its hold; the bed out before "B!", a boom and ding; a bonk on "60%"; a lift into the rule; a riser and
# the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.4, "drop_at": [[3, "4", 0.3]], "tail": 0.0}),   # the bed out before the twist
          ("s_b", (5, 6, 7, 8), {"boost": 1.8, "lift": 0.6, "drop_at": [[1, "1", 0.2]], "drop_pre": [[3, 0.9, 1.0]], "tail": 0.0}),   # before ₹168 10/10; before "C!"
          ("s_c", (9, 10, 11, 12), {"outro": True, "pre": 0.3, "boost": 1.9, "lift": 0.8, "rise": 1.7, "tail": 0.0})]
GAP = {1: 0.2, 2: 0.2, 3: 0.2, 4: 0.3, 5: 0.2, 6: 0.3, 7: 3.0, 8: 0.3, 9: 0.2, 10: 0.4, 11: 0.4, 12: 0.0}   # 7: the quiz holds
GAP_TE = {7: 2.6}   # render review: the quiz hold was too short to guess
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.45}}
YT = {"s_a": "₹168, with a link", "s_b": "Why, and what to do", "s_c": "No date, no trust"}
NAMES = {}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "uc02te" if te else "uc02v1"
    s = {"id": sid, "title": "₹168, With a Link (UC02: how an AI answers with web search)" + (" (Telugu audio)" if te else ""),
         "label": "UC02", "banner": "How AI web search works", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35,
         "music": "lofi", "names": NAMES, "musicVol": [0.2, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2,
         "captionMode": "phrase", "musicEQ": [[250, -12, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0 if not te else 1.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            ln["gain_db"] = -1.0 if who == "ai" else 0.5
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = 0.6 if te else 0.8
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": {**T, **T_TE} if te else T, "tagSide": {"ravi": "right", "ai": "right"},
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_search02", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
