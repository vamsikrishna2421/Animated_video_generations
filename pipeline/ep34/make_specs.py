# EP34 "Rent a brain or own one?" (open vs closed models): writes reels/ep34v1.json (English) and reels/ep34te.json
# (Telugu). Lines and their order come from the script (series/scripts/ep34_open_vs_closed.md, v2.1); [n] marks the words
# the pictures wait for. Voices: pipeline/ep34/voice.py (English as EP33's published cut, Telugu on Parler).
#   python3 pipeline/ep34/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks). shot: camera in the shop ("wide", "ravi") or "screen" (the phone fills the
# frame). prop: what the line brings on (OwnCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "AI! Customers waiting and you've gone SILENT?!"),   # Parler said "Then customers" in every take
    2: ("ai", "screen", "rented", "No internet. You rent me, anna."),
    3: ("ravi", "ravi", "ownshop", "Rent?! I rented this shop twenty years, then I bought it!"),
    4: ("ai", "screen", "cloud", "My brain is on a company's computers. [1] Your orders go there too. [2] Closed model: pay per question."),
    5: ("ravi", "ravi", "buy", "Then I'll buy my own brain!"),
    6: ("ai", "screen", "open", "Some give theirs away: open models."),
    7: ("ravi", "ravi", "free", "What, free?!"),
    8: ("ai", "screen", "skull", "The brain is free. [1] The skull is sold separately."),
    9: ("ravi", "ravi", "bills", "Arey, can a free brain make my bills?"),
    10: ("ai", "screen", "test", "We tested three free ones. [1] Twenty WhatsApp orders, internet off."),
    11: ("ravi", "ravi", "guess", "Twenty! It's a computer!"),
    12: ("ai", "screen", "bars", "One gigabyte: one right. [1] Three gigabytes: nine. [2] It added tomatoes nobody ordered."),
    13: ("ravi", "ravi", "biggest", "And the bigger one?"),
    14: ("ai", "screen", "eighteen", "Almost five gigabytes: [1] eighteen."),
    15: ("ravi", "ravi", "told", "Two wrong bills?!"),
    16: ("ai", "wide", "stopwatch", "One bill: ₹566 instead of ₹231."),
    17: ("ravi", "ravi", "laptop", "Then you come into my laptop."),
    18: ("ai", "screen", "nodelivery", "Rented brains don't do home delivery."),
    19: ("ravi", "ravi", "which", "So which one do I use?!"),
    20: ("ai", "wide", "rule", "Rent needs internet. [1] Own works offline, data stays home, but you buy the computer."),
    21: ("ai", "wide", "calc", "Your bills? Rent, and test it first. [1] Net down? Calculator."),
    22: ("ravi", "wide", "own", "I don't RENT! I'll own the biggest free brain!"),
    23: ("ai", "screen", "gpu", "The big ones run on a twenty-five-lakh graphics card."),
    24: ("ravi", "ravi", "rentpc", "Then I'll rent a big computer."),
    25: ("ai", "wide", "again", "So... [1] renting again."),
}
SHOW = {n: t.replace("[1] ", "").replace("[2] ", "") for n, (_, _, _, t) in LINES.items()}
# English spoken forms: capitals and hyphens out; a lone first word kept inside its sentence (Parler drops one-word
# sentences: skit 01's lesson)
TTS_EN = {1: "AI! Customers waiting and you've gone silent?!", 9: "Arre, can a free brain make my bills?", 11: "Twenty, it's a computer!",
          16: "One bill: five sixty six, instead of two thirty one.",
          22: "I don't rent! I will own the biggest free brain!", 23: "The big ones run on a twenty five lakh graphics card.",
          25: "So. Renting again."}   # 22: "I'll own" read "I loan"; 25: the deadpan AI shouted "RENTING AGAIN!"
# lines whose key word or number must not blur at the reel's tempo (EP33: 1.2x read "Keyword off" as "Keyword on")
PAUSES = {14: {"1": 0.6}, 25: {"1": 0.6}}   # render review: no room before "eighteen" or after "So..."
TEMPO_EN = {12: 1.1, 14: 1.0, 16: 1.1, 23: 1.1, 1: 1.25, 3: 1.1, 4: 1.05, 5: 1.25, 9: 1.25, 22: 1.25, 24: 1.25}   # Parler's Ravi is slow; 3 "Rent" read "Wrench" and 4 "pay per" read "paper" when faster
# Sound (CLAUDE.md arc): the slam's hit in the first second, a lift into each insert, the bed dips while Ravi guesses and
# drops out right before "eighteen" with a hit on it, a sting after the tomatoes, the bed up for the rule, a riser into
# the last line, which loops into the opening slam.
SCENES = [("st_a", 1, 3, {"rise": 1.25, "tail": 0.1}),
          ("st_b", 4, 5, {"lift": 0.6, "pre": 0.35, "boost": 0.6, "tail": 0.1}),
          ("st_c", 6, 9, {"lift": 0.5, "pre": 0.35, "boost": 0.8, "tail": 0.1}),
          ("st_d", 10, 13, {"lift": 0.4, "pre": 0.35, "boost": 0.7, "tail": 0.1}),
          ("st_e", 14, 16, {"drop_cue": 1, "boost": 1.0, "tail": 0.2}),
          ("st_f", 17, 21, {"boost": 1.2, "tail": 0.15}),
          ("st_g", 22, 25, {"outro": True, "boost": 1.35, "rise": 1.4, "tail": 0.0})]
# seconds after line n (default 0.18): room after each joke and before the stopwatch
GAP = {1: 0.2, 8: 0.4, 12: 0.45, 15: 0.25, 18: 0.4, 21: 0.3, 23: 0.35}   # the first cut ran 93 s: lines trimmed, gaps tighter, 1.2x
TE = {
    1: ("అరే ఏఐ, పది మంది కస్టమర్లు వెయిటింగ్, నువ్వు మాట్లాడవేంటి?!", None),
    2: ("ఇంటర్నెట్ లేదండి. మీరు నన్ను అద్దెకు తీసుకున్నారు.", None),
    3: ("ఏంటీ, అద్దెకా?! ఇరవై ఏళ్లు ఈ షాప్ అద్దెకు ఉన్నా. తర్వాత కొనేశా!", None),
    4: ("నా బ్రెయిన్ ఒక కంపెనీ కంప్యూటర్లలో ఉంటుందండి. [1] మీ ఆర్డర్లు అక్కడికే వెళ్తాయి. [2] క్లోజ్డ్ మోడల్, క్వశ్చన్ కి ఇంత.", None),
    5: ("అయితే నేనే సొంత బ్రెయిన్ కొంటా!", None),
    6: ("కొన్ని కంపెనీలు ఫ్రీగా ఇస్తాయండి, ఓపెన్ మోడల్స్.", None),   # ChatGPT's maker: on screen only (render review)
    7: ("ఫ్రీగా ఇస్తారా?!", None),
    8: ("యాప్ ఫ్రీ అండి. [1] ఫోన్ మీరే కొనుక్కోవాలి.", None),   # a SIM means network and recharge: renting
    9: ("అరే, ఫ్రీ బ్రెయిన్ నా బిల్లులు వేస్తుందా?", None),
    10: ("మూడు ఫ్రీ బ్రెయిన్లు టెస్ట్ చేశామండి. [1] ఇరవై వాట్సాప్ ఆర్డర్లు, ఇంటర్నెట్ ఆఫ్, మామూలు కంప్యూటర్.", None),
    11: ("ఇరవై, కంప్యూటర్ కదా!", None),
    12: ("వన్ జీబీ, ఒక్కటే. [1] త్రీ జీబీ, తొమ్మిది. <pause 0.3> [2] ఎవరూ అడగని టమాటాలు కూడా బిల్లులో వేసింది.", "వన్ జీబీ, ఒక్కటే. త్రీ జీబీ, తొమ్మిది."),
    13: ("మరి పెద్దది?", None),
    14: ("దాదాపు ఫైవ్ జీబీ, [1] పద్దెనిమిది.", None),
    15: ("రెండు తప్పు బిల్లులా?!", None),
    16: ("ఒక బిల్లు, టూ థర్టీ వన్ కి ఫైవ్ సిక్స్టీ సిక్స్ వేసింది.", None),   # the queue time is on screen
    17: ("అయితే నువ్వే నా ల్యాప్‌టాప్ లోకి రా.", "అయితే నువ్వే నా ల్యాప్ టాప్ లోకి రా."),
    18: ("అద్దె బ్రెయిన్ కి హోమ్ డెలివరీ లేదు.", None),   # -ండి dropped on 12, 16, 18: in every line it sounded like a call centre
    19: ("మరి నేను ఏది వాడాలి?!", None),
    20: ("అద్దెకైతే నెట్ కావాలి. [1] సొంతమైతే నెట్ అక్కర్లేదు, డేటా ఇంట్లోనే, కానీ కంప్యూటర్ మీరే కొనుక్కోవాలి.", None),
    21: ("మీ బిల్లులకి అద్దె బ్రెయినే, ముందు టెస్ట్ చేసి. [1] నెట్ పోతే, కాలిక్యులేటర్.", None),
    22: ("నేను అద్దెకు తీసుకోను! పెద్ద ఫ్రీ బ్రెయిన్ నేనే పెట్టుకుంటా!", None),
    23: ("పెద్దవి పాతిక లక్షల గ్రాఫిక్స్ కార్డ్ మీద నడుస్తాయండి.", None),
    24: ("అయితే పెద్ద కంప్యూటర్ అద్దెకు తీసుకుంటా.", None),
    25: ("అంటే... [1] మళ్ళీ అద్దెకేనండి.", None),
}
TE_PART2 = {12: "ఎవరూ అడగని టమాటాలు కూడా బిల్లులో వేసింది."}   # in one take Parler babbled all four tries: two takes, joined
YT = {"st_a": "He rents his AI", "st_b": "Closed: a rented brain", "st_c": "Open: a free brain", "st_d": "Our bill test",
      "st_e": "18 out of 20: two wrong bills", "st_f": "Rent or own?", "st_g": "Renting again"}


def spec(lang="en"):
    te = lang == "te"
    sid = "ep34te" if te else "ep34v1"
    s = {"id": sid, "title": "Rent a brain or own one? (EP34: open vs closed models)" + (" (Telugu audio)" if te else ""), "label": "EP34",
         "banner": "Rent a brain or own one?", "topic": "", "look": "classic", "gap": 0.18, "lead": 0.15, "music": "lofi",
         "musicVol": [0.4, 0.75], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.05 if te else 1.2, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for n in range(a, b + 1):
            who, shot, prop, text = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": TE[n][0] if te else text, "show": SHOW[n],
                  "maxgap": 0.28, "gap": GAP.get(n, 0.2 if te else 0.14)}
            if te and TE[n][1]:
                ln["tts"] = TE[n][1]
            if te and n in TE_PART2:
                ln.update({"file2": f"{n:02d}b_{who}.wav", "tts2": TE_PART2[n], "pause": 0.3})
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if not te and n in TEMPO_EN:
                ln["tempo"] = TEMPO_EN[n]
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            # loudness: Ravi's shouts a little above the AI; the result and the last line lifted
            g = (-1.0 if who == "ai" else 1.5) + {14: 2.0, 25: 1.5}.get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_own", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
