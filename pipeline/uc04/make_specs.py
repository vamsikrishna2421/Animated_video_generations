# UC04 "1 Video, 9 of 10" (how YouTube and Netflix recommend videos): writes reels/uc04v1.json (English) and
# reels/uc04te.json (Telugu). Lines from series/scripts/uc04_up_next.md (v2 after the script review); [n] marks the
# words the pictures wait for; " | " = two takes with a beat. Voices: pipeline/uc04/voice.py (the Creative 21 standard).
# Numbers and lists: our test (series/scripts/uc04_demo/feed3.json). Scene: Up04Crayon.tsx.
#   python3 pipeline/uc04/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
D3 = json.loads((ROOT / "series/scripts/uc04_demo/feed3.json").read_text())
D1 = json.loads((ROOT / "series/scripts/uc04_demo/feed.json").read_text())

# n: (who, shot, prop, English, Telugu)
LINES = {
    1: ("ravi", "hook", "hook", "One video my friend sent, [1] and nine of the next ten are get-rich trading!",
        "ఫ్రెండ్ పంపిన ఒక్క వీడియో చూశా. [1] తర్వాతి పదిలో తొమ్మిది, ట్రేడింగ్ తో డబ్బులు సంపాదించే వీడియోలే!"),
    2: ("ai", "map", "map", "To the app, every video is a point on a map, [1] and trading videos sit close together. [2] Up next shows the ten closest to what's playing.",
        "యాప్ కి ప్రతి వీడియో, మ్యాప్ మీద ఒక చుక్క. [1] ట్రేడింగ్ వీడియోలు, అన్నీ పక్క పక్కనే ఉంటాయి. [2] అప్ నెక్స్ట్ లో, ప్లే అవుతున్న వీడియోకి దగ్గరి పది వస్తాయి."),
    3: ("ravi", "ravi", "ask", "And autoplay just keeps on going?", "ఆటోప్లే అలా ఆగకుండా వెళ్తూనే ఉంటుందా?"),
    4: ("ai", "chain", "chain", "We tested a small app like it: ten autoplays in a row. [1] Eight were trading.",
        "మేం ఇలాంటి చిన్న యాప్ తో, వరుసగా పది ఆటోప్లే చేసి చూశాం. [1] ఎనిమిది, ట్రేడింగ్."),
    5: ("ravi", "ravi", "panic", "So my whole phone is trading now?!", "అయితే నా ఫోన్ మొత్తం, ట్రేడింగేనా?!"),
    6: ("ai", "home", "home", "Your home page mixes in your whole history. After those ten, home showed... | [1] two of ten.",
        "హోమ్ పేజీ, మీ పూర్తి హిస్టరీని కలిపి చూస్తుంది. ఆ పది చూశాక కూడా, హోమ్ లో ట్రేడింగ్... | [1] పదిలో రెండే."),
    7: ("ravi", "ravi", "why", "Only two? Why?", "రెండేనా? ఎందుకు?"),
    8: ("ai", "avg", "avg", "Cricket, food and prayer videos pull it back. | [1] To the app, you're roughly the average of everything you watch.",
        "క్రికెట్, వంట, భక్తి వీడియోలు, దాన్ని వెనక్కి లాగుతాయి. | [1] యాప్ కి, మీరు చూసిన అన్నింటి దాదాపు సగటే, మీరు."),
    9: ("ravi", "rulecard", "rule", "So: switch autoplay off, [1] and tap \"Not interested\" in Up next!",
        "అంటే: ఆటోప్లే ఆపేయాలి. [1] అప్ నెక్స్ట్ లో, నాట్ ఇంట్రెస్టెడ్, అంటే వద్దు, అని నొక్కాలి!"),
    10: ("ravi", "ravi", "safe", "And I'll watch one on trading scams, to be safe.", "ముందు జాగ్రత్తగా, ట్రేడింగ్ స్కామ్ ల గురించి ఒక వీడియో చూస్తా."),
    11: ("ai", "twist", "loop", "Up next: [1] nine of ten, trading tips.", "అప్ నెక్స్ట్: [1] పదిలో తొమ్మిది, ట్రేడింగ్ వీడియోలే."),
}
SHOW = {1: "One video my friend sent, and 9 of the next 10 are get-rich trading!",
        2: "To the app, every video is a point on a map, and trading videos sit close together. Up next shows the 10 closest to what's playing.",
        4: "We tested a small app like it: 10 autoplays in a row. 8 were trading.",
        6: "Your home page mixes in your whole history. After those 10, home showed... <pause 0.8> 2 of 10.",
        9: "So: switch autoplay off, and tap \"Not interested\" in Up next!",
        8: "Cricket, food and prayer videos pull it back. <pause 0.6> To the app, you're roughly the average of everything you watch.",
        11: "Up next: 9 of 10, trading tips."}
SHOW_TE = {
    1: "I watched one video a friend sent. 9 of the next 10: make-money-with-trading videos!",
    2: "To the app, every video is a dot on a map. Trading videos all sit side by side. Up next shows the 10 closest to the video playing.",
    3: "And autoplay just keeps going without stopping?",
    4: "We tried a small app like it: 10 autoplays in a row. 8: trading.",
    5: "So my whole phone is just trading now?!",
    6: "The home page looks at your whole history together. Even after those 10, trading on home... <pause 0.8> only 2 of 10.",
    7: "Only two? Why?",
    8: "Cricket, cooking and devotional videos pull it back. <pause 0.6> To the app, you are roughly the average of everything you watched.",
    9: "So: stop autoplay. And in Up next, tap \"Not interested\", meaning no!",
    10: "To be careful, I'll watch one video about trading scams.",
    11: "Up next: 9 of 10, trading videos.",
}
TEMPO_EN = {"ravi": 1.04, "ai": 1.04}   # UC03 length (47.8 s): the one variable is frame 1
TEMPO_TE = {"ravi": 1.1, "ai": 1.12}
LINE_TEMPO_EN = {8: 0.95}
LINE_TEMPO_TE = {11: 1.0}   # its take ran fast (rate 21)   # its Fish takes ran fast (rate 18-20 vs ~15)
FRIEND = "Turn ₹5,000 into ₹50,000 in one week: my trading trick"
HIST = D3["U3"]["history"]   # his 12 + the friend's video + the 10 autoplays
TOPIC = {t: c for c, ts in D1["catalogue"].items() for t in ts}
T = {
    "leftLab": "HE WATCHED", "leftVal": "1 VIDEO", "rightLab": "UP NEXT · TRADING", "rightVal": "9 OF 10",
    "story": "our test app, not YouTube",
    "friend": FRIEND, "upHead": "Up next",
    "upList": [{"title": x["title"], "topic": x["topic"]} for x in D3["U1"]["up_next"]],
    "mapHead": "HOW THE APP SEES VIDEOS", "food": "FOOD", "mapSub": ["simplified · our test app: close = similar titles"],
    "close": "TRADING VIDEOS SIT CLOSE TOGETHER", "upNine": "UP NEXT: THE 10 CLOSEST · 9 TRADING",
    "chainHead": "AUTOPLAY: 10 IN A ROW", "chainSub": ["our test app · 144 made-up videos", "the idea in Google's 2016 YouTube paper"],
    "chain": [{"title": x["title"], "topic": x["topic"]} for x in D3["U2"]["played"]], "chainStat": "8 OF 10 TRADING",
    "homeHead": "UP NEXT vs HOME", "homeSub": ["our test app · Home: after the 10 autoplays"],
    "upCol": "UP NEXT", "upColSub": "follows the video on screen", "upStat": "9 OF 10",
    "homeCol": "HOME", "homeColSub": "mixes in your whole history", "homeStat": "2 OF 10",
    "home": [{"title": x["title"], "topic": x["topic"]} for x in D3["U3"]["home_recent"]],
    "rule1": "UP NEXT FOLLOWS THE VIDEO ON SCREEN", "rule2": "⋮ → NOT INTERESTED", "rule3": "AUTOPLAY SWITCH: OFF",
    "warnChip": "▶ \"Trading tip scams: how fake gurus take your money\"",
    "warning": D1["warning"], "warnList": [{"title": x["title"], "topic": x["topic"]} for x in D3["U5"]["up_next"]],
    "warnStat": "9 OF 10 TRADING TIPS", "ourTest": "OUR TEST APP · it matches titles · real apps may differ",
    "history": [TOPIC.get(h, "trading") for h in HIST],
    "avgHead": "WHY HOME ISN'T ALL TRADING", "avgSub": ["\"you\" = the average of your watch history", "(the idea in Google's 2016 YouTube paper)"],
    "histLab": "HIS HISTORY", "youLab": "YOU", "avgStat": "YOU ≈ THE AVERAGE OF ALL YOU WATCH", "avgNote": "nearer his usual videos · recent ones count a bit more (Netflix's help page)",
    "avgWords": {"cricket": "cricket", "food": "cooking", "prayer": "devotional", "క్రికెట్": "cricket", "వంట": "cooking", "భక్తి": "devotional"},
    "ruleHead": "WHAT TO DO", "ruleA": "AUTOPLAY", "ruleASub": "the switch on the video player (YouTube Help)",
    "ruleB": "⋮ → NOT INTERESTED", "ruleBSub": "on the ones you don't want, right in Up next",
    "twLeftLab": "HE WATCHED", "twLeftVal": "A SCAM WARNING", "twRightLab": "UP NEXT · TRADING TIPS", "twRightVal": "9 OF 10",
}
assert sum(v["topic"] == "trading" for v in T["upList"]) == 9 and sum(v["topic"] == "trading" for v in T["chain"]) == 8
assert sum(v["topic"] == "trading" for v in T["home"]) == 2 and sum(v["topic"] == "trading" for v in T["warnList"]) == 9
# Sound (CLAUDE.md arc, fewer effects after the script review): a boom, a chime and a buzz on frame 1; a whoosh into the
# map, a pop on the trading island, a short tick run on the ten lines and a hit; quiet ticks on the autoplay tiles, a
# hit and a buzz on "8"; a buzz on Up next's 9, a drop, then a hit on home's 2; a clap and a lift into the rule; a riser
# on "to be safe", a buzz on the nine tips and the slam back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 1.8, "lift": 0.9, "tail": 0.0}),
          ("s_b", (3, 4), {"boost": 2.4, "lift": 0.8, "tail": 0.0}),
          ("s_c", (5, 6), {"boost": 2.0, "lift": 0.7, "drop_at": [[1, "1", 0.0]], "tail": 0.0}),   # the bed out in the beat before home's 2
          ("s_d", (7, 8), {"boost": 1.6, "lift": 0.6, "tail": 0.0}),
          ("s_e", (9, 10, 11), {"outro": True, "pre": 0.3, "boost": 2.4, "lift": 0.9, "rise": 2.2, "tail": 0.0})]
GAP = {n: 0.22 for n in LINES} | {6: 0.3, 9: 1.1, 10: 0.6, 11: 0.0}   # 9: hold the rule card
GAP_TE = {n: 0.16 for n in LINES} | {6: 0.25, 9: 1.0, 10: 0.55, 11: 0.0}   # 10: a beat before the twist
FLAGS_TE = {"s_e": {"boost": 2.2, "rise": 2.0}}
YT = {"s_a": "1 video, 9 of 10", "s_b": "Autoplay", "s_c": "Up next vs Home", "s_d": "You = your average", "s_e": "Not interested, autoplay off"}
NAMES = {}
MARK = re.compile(r"\[\d+\]\s*")
PZ = {6: 0.8}   # render review: a longer drop before "two of ten"


def spec(lang="en"):
    te = lang == "te"
    sid = "uc04te" if te else "uc04v1"
    s = {"id": sid, "title": "1 Video, 9 of 10 (UC04: how YouTube and Netflix recommend videos)" + (" (Telugu audio)" if te else ""),
         "label": "UC04", "banner": "How video recommendations work", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35,
         "music": "lofi", "names": NAMES, "musicVol": [0.2, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0,
         "captionMode": "phrase", "musicEQ": [[120, -4, 0.7], [200, -10, 0.9], [250, -14, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.45 if not te else 0.3,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1420}
    s["lead"] = 0.55   # render review: the frame-1 hit before the first word
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5, "musicVol": [0.14, 0.4]})   # review: the bed fought the Telugu voice
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else GAP).get(n, 0.2), "tempo": LINE_TEMPO_TE.get(n, TEMPO_TE[who]) if te else LINE_TEMPO_EN.get(n, TEMPO_EN[who]),
                  "gain_db": -1.0 if who == "ai" else 0.5}
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = PZ.get(n, 0.6)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1420, "t": T, "tagSide": {"ravi": "right", "ai": "right"},
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_up04", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
