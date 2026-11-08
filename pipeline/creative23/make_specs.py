# Creative 23 "Three Lakhs on the Screen": writes reels/creative23v1.json (English) and reels/creative23te.json (Telugu).
# Lines from series/scripts/creative23_profit_bot.md (v2); [n] marks the words the pictures wait for. Voices:
# pipeline/creative23/voice.py. Scene: video/src/reel/loop/ProfitCrayon.tsx.
#   python3 pipeline/creative23/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the living room ("wide", "hook") or an insert ("app", "calc", "peel",
# "crore", "popup", "cases", "rule", "chat"). prop: ProfitCrayon.tsx.
LINES = {
    1: ("sastry", "hook", "hook", "Three lakhs on the screen, [1] and I can't take out one rupee!",
        "స్క్రీన్ మీద మూడు లక్షలు, [1] చేతికి ఒక్క రూపాయి కూడా రాదు!"),
    2: ("pallavi", "wide", "verdict", "Nanna, it's a scam. [1] No real trading makes a profit every single day. AI or not.",   # script review: FDs do pay fixed interest
        "నాన్నా, ఇది మోసం. [1] ఏ ట్రేడింగ్ కూడా రోజూ లాభం ఇవ్వదు. ఏ ఐ అయినా సరే."),
    3: ("sastry", "app", "app", "Two lakhs, fifteen days ago. [1] Three percent profit, every single day!",   # script review: whose money, when
        "పదిహేను రోజుల క్రితం రెండు లక్షలు పెట్టా. [1] రోజూ మూడు శాతం లాభం!"),
    4: ("pallavi", "app", "trick", "Fifteen days, and not one bad day? [1] Real markets fall some days. That's the trick.",   # script review: the proof
        "పదిహేను రోజుల్లో, ఒక్క రోజు కూడా నష్టం లేదా? [1] నిజమైన మార్కెట్ కొన్ని రోజులు పడుతుంది. అదే ట్రిక్."),
    5: ("pallavi", "calc", "calc", "Two lakhs, plus three percent, fifteen times: [1] exactly your screen.",   # script review: no long number spoken
        "రెండు లక్షలకి, రోజూ మూడు శాతం, పదిహేను సార్లు కలిపితే: [1] స్క్రీన్ మీద ఉన్న నంబరే వస్తుంది."),
    6: ("sastry", "wide", "same", "To the rupee?!", "రూపాయితో సహా?!"),
    7: ("pallavi", "peel", "peel", "It's not trading, Nanna. [1] It's a calculator, painted green.",
        "ఇది ట్రేడింగ్ కాదు నాన్నా. [1] కాలిక్యులేటర్ కి గ్రీన్ కలర్ వేశారు, అంతే."),
    8: ("pallavi", "crore", "crore", "If three percent a day were real, [1] your two lakhs would be nine hundred and seventy crore in a year.",
        "రోజూ మూడు శాతం నిజమైతే, [1] మీ రెండు లక్షలు, ఏడాదిలో దాదాపు వెయ్యి కోట్లు అయ్యేవి."),
    9: ("sastry", "popup", "fee", "Then why does it want fifty-six thousand from me?!", "మరి నా దగ్గర యాభై ఆరు వేలు ఎందుకు అడుగుతోంది?!"),
    10: ("pallavi", "cases", "cases", "Real tax goes to the government, not to the app. [1] No real broker holds your money until you pay.",
         "నిజమైన టాక్స్ గవర్నమెంట్ కి కడతాం, యాప్ కి కాదు. [1] ఏ నిజమైన బ్రోకర్ కూడా, డబ్బు ఆపి టాక్స్ అడగడు."),
    11: ("pallavi", "rule", "rule", "Don't pay more. Call one nine three zero now. [1] And before you invest, check SEBI's site.",   # script review: 1930 first
         "ఇంకేమీ కట్టకండి. ఇప్పుడే వన్ నైన్ త్రీ జీరో కి కాల్ చేయండి. [1] పెట్టుబడి పెట్టే ముందు, సెబీ సైట్ లో చెక్ చేయండి."),
    12: ("sastry", "chat", "loop", "AI app, just cut the tax from my three lakhs! [1] \"Must be paid separately\"?!",   # "bot" was heard "bought" (as EP47)
         "ఏ ఐ యాప్, టాక్స్ నా మూడు లక్షల్లోంచే తీసుకో! [1] విడిగా కట్టాలా?!"),
}
SHOW = {1: "₹3 lakh on the screen, and I can't take out one rupee!", 3: "₹2 lakh, 15 days ago. 3% profit, every single day!",
        5: "₹2 lakh, plus 3%, 15 times: exactly your screen.", 8: "If 3% a day were real, your ₹2 lakh would be ₹970 crore in a year.",
        9: "Then why does it want ₹56,000 from me?!", 11: "Don't pay more. Call 1930 now. And before you invest, check SEBI's site.",
        12: "AI app, just cut the tax from my ₹3 lakh! \"Must be paid separately\"?!"}
SHOW_TE = {
    1: "₹3 lakh on the screen, not one rupee in my hand!", 2: "Nanna, this is a scam. No trading gives profit every day. AI or not.",
    3: "I put in ₹2 lakh 15 days ago. 3% profit every day!", 4: "In 15 days, not one day of loss? Real markets fall some days. That's the trick.",
    5: "₹2 lakh, add 3% a day, 15 times: you get the number on your screen.", 6: "Down to the rupee?!",
    7: "This isn't trading, Nanna. They painted a calculator green, that's all.",
    8: "If 3% a day were real, your ₹2 lakh would be almost ₹1,000 crore in a year.",
    9: "Then why is it asking me for ₹56,000?!", 10: "Real tax is paid to the government, not to an app. No real broker holds your money and asks for tax.",
    11: "Don't pay anything more. Call 1930 now. Before you invest, check on SEBI's site.",
    12: "AI app, take the tax from my ₹3 lakh! Pay it separately?!",
}
TEMPO_EN = {"sastry": 1.08, "pallavi": 1.08}
TEMPO_TE = {"sastry": 1.04, "pallavi": 1.04}   # first TE build ran 65.5 s
# Sound (CLAUDE.md arc): a boom, clap and buzz on frame 1; a ding on "scam"; ticks as the balance climbs; a pop on the
# perfect curve; ticks as the calculator multiplies, a boom on "exactly your screen", a ding on "to the rupee"; a glitch as
# the paint comes off; the bed OUT before "970 crore" (both viewers asked for the drop), a riser and a boom; a buzz on the
# pop-up; a clap and boom into the rule card; a pop and buzz on the reply, the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 0.9, "tail": 0.0}),
          ("s_b", (5, 6, 7, 8, 9), {"boost": 1.2, "lift": 0.5, "drop_at": [[3, 1]], "tail": 0.0}),
          ("s_c", (10, 11, 12), {"outro": True, "pre": 0.3, "boost": 1.7, "lift": 0.6, "rise": 1.5, "tail": 0.0})]
GAP = {1: 0.2, 2: 0.25, 3: 0.2, 4: 0.3, 5: 0.25, 6: 0.25, 7: 0.3, 8: 0.45, 9: 0.25, 10: 0.3, 11: 1.8, 12: 0.0}   # 11: the rule card holds (script review)
GAP_TE = {11: 1.4}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}
YT = {"s_a": "₹3 lakh on screen, ₹0 in hand", "s_b": "The calculator trick", "s_c": "Don't pay: call 1930"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative23te" if te else "creative23v1"
    s = {"id": sid, "title": "Three Lakhs on the Screen" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.32, 0.55], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase",
         "musicEQ": [[260, -6, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,
         "musicEndRamp": [0.85, 5.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
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
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "tagLeft": True, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_profit", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
