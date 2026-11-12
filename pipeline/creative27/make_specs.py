# Creative 27 "₹5,000 for 10 Grams, Says the AI": writes reels/creative27v1.json (English) and reels/creative27te.json
# (Telugu). Lines from series/scripts/creative27_gold_rate.md (v2); [n] marks the words the picture waits for; " | " =
# two takes with a beat of silence. Mom/Amma, Chinnu, the AI on the phone (English on both pages). Voices:
# pipeline/creative27/voice.py. Scene: GoldCrayon.tsx. The AI's words on screen come from our test (data.t).
#   python3 pipeline/creative27/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, prop, English, Telugu). v2 (script review): the AI named (a small free AI, no web search); its real first
# line ("check a local gold dealer") and its date line; the 1-in-10; the payoff a live rate with today's date
LINES = {
    1: ("amma", "hook", "Five thousand rupees for ten grams, says the AI! [1] And your board says one lakh twenty-eight thousand?!",
        "పది గ్రాములకి ఐదు వేలు అంటోంది చాట్‌బాట్! [1] మీ బోర్డు మీద లక్షా ఇరవై ఎనిమిది వేలా?!"),
    2: ("chinnu", "plain", "Mom, it's Divya's wedding necklace, not a fight. [1] Show me.",
        "అమ్మా, ఇది దివ్య పెళ్ళి నెక్లెస్, గొడవ కాదు. [1] ఫోన్ ఇవ్వమ్మా."),
    3: ("chinnu", "chat1", "Its first line: [1] \"check a local gold dealer.\" You're at one.",
        "మొదటి లైనే చూడు: [1] దగ్గర్లో బంగారం షాప్ లో కనుక్కోండి, అంటోంది. నువ్వు ఉన్నది అక్కడే."),
    4: ("amma", "chat2", "But then it says [1] five thousand!",
        "కానీ తర్వాత [1] ఐదు వేలు అంది కదా!"),
    5: ("chinnu", "compare", "\"As of my last update in October 2023.\" [1] Even then, ten grams was about fifty-five thousand. | [2] A zero short!",
        "అది అక్టోబర్ రెండు వేల ఇరవై మూడు నాటి లెక్క. [1] అప్పుడు కూడా పది గ్రాములు యాభై ఐదు వేలు. | [2] ఒక సున్నా తక్కువ!"),
    6: ("amma", "plain", "Then ask it today's date!", "మరి ఈరోజు తేదీ ఎంతో అడుగు!"),
    7: ("ai", "date", "Today's date is: [1] current date.", "Today's date is: [1] current date."),
    8: ("chinnu", "label", "This one's a small free AI with no internet: [1] no calendar, no live rates.",
        "ఇది ఇంటర్నెట్ లేని చిన్న ఫ్రీ చాట్‌బాట్: [1] క్యాలెండర్ లేదు, లైవ్ రేట్లు లేవు."),
    9: ("chinnu", "test", "We asked it ten times. [1] Nine times: \"check today's rate.\" Once, it guessed. | [2] You got the once.",
        "పది సార్లు అడిగాం. [1] తొమ్మిది సార్లు, ఈరోజు రేట్ చూసుకోండి అంది. ఒక్కసారే ఊహించింది. | [2] నీకు వచ్చింది అదే."),
    10: ("chinnu", "rule", "\"As of my last update\" means a memory, not a price. [1] Check a live rate with today's date: it matches the board.",
         "లాస్ట్ అప్‌డేట్ అంటే, అది పాత లెక్క, ఈరోజు ధర కాదు. | [1] ఈరోజు తేదీ ఉన్న లైవ్ రేట్ చూడు: బోర్డు తో సరిపోతుంది."),
    11: ("amma", "loop", "Fine. [1] But let me ask it once more...", "సరేలే. [1] కానీ ఇంకోసారి అడిగి చూస్తా..."),
}
TTS_EN = {1: "Five thousand rupees for ten grams, says the AI! And your board says one laakh, twenty-eight thousand?!"}   # "lakh" came out "lack"
SHOW = {1: "₹5,000 for 10 grams, says the AI! And your board says ₹1,28,150?!",
        5: "\"As of my last update in October 2023.\" Even then, 10 grams was about ₹55,000. <pause 0.5> A zero short!",
        9: "We asked it 10 times. 9 times: \"check today's rate.\" Once, it guessed. <pause 0.4> You got the once.",
        7: "Today's date is: [current date]."}
SHOW_TE = {
    1: "₹5,000 for 10 grams, says the chatbot! And your board says ₹1,28,150?!",
    2: "Amma, this is Divya's wedding necklace, not a fight. Give me the phone.",
    3: "Look at its first line: \"check at a gold shop near you\". That's where you are.",
    4: "But then it said ₹5,000!",
    5: "That's an October 2023 figure. Even then, 10 grams was ₹55,000. <pause 0.5> One zero short!",
    6: "Then ask it today's date!",
    7: "Today's date is: [current date].",
    8: "This is a small free chatbot with no internet: no calendar, no live rates.",
    9: "We asked 10 times. 9 times it said: check today's rate. Only once it guessed. <pause 0.4> You got that one.",
    10: "\"Last update\" means an old figure, not today's price. <pause 0.3> Check a live rate with today's date: it matches the board.",
    11: "Fine. But let me ask it once more...",
}
SPLIT_PAUSE = {5: 0.5, 9: 0.4}
SPLIT_PAUSE_TE = {5: 0.5, 9: 0.4, 10: 0.3}
T = {   # on screen: the AI's reply (try 8 of our test, word for word, cut with "..."), today's rate (Groww, Goodreturns)
    "ask": "What is the price of 10 grams of 22-carat gold in India today?",
    "chunks": ["The price of gold can fluctuate daily ... I recommend checking a local or online gold dealer in India.",
               "However, as of my last update in October 2023, the price per gram of 22-carat gold in India is typically around INR 450 to INR 500",
               "10 grams would be approximately INR 4,500 ... INR 5,000.",
               "Please note that these prices are illustrative and may not reflect current market values."],
    "dateReply": "Today's date is [current date].",
    "rate": "₹1,28,150", "date": "12 NOV 2026",
}
# Sound (CLAUDE.md arc): a boom and a till on frame 1; whooshes and pops as the chat lines light up; a boom under the
# 2023 card and a beat of silence before "a zero short"; the bed drops out for "[current date]" (a buzz); pops on the
# test tiles and a beat before "you got the once"; a ding on the board; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (3, 4, 5), {"boost": 1.2, "lift": 0.5, "drop_at": [[2, 2, 0.4]], "tail": 0.0}),
          ("s_c", (6, 7, 8), {"boost": 1.0, "duck_lines": [[1, 0.0]], "tail": 0.0}),
          ("s_d", (9, 10), {"boost": 1.45, "lift": 0.6, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_e", (11,), {"outro": True, "pre": 0.3, "boost": 1.9, "lift": 0.7, "rise": 1.9, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.35, 4: 0.3, 5: 0.4, 6: 0.3, 7: 0.6, 8: 0.35, 9: 0.4, 10: 0.4, 11: 0.0}
FLAGS_TE = {"s_e": {"boost": 1.7, "rise": 1.7}}
YT = {"s_a": "₹5,000 vs ₹1,28,150", "s_b": "Read the AI's own lines", "s_c": "Today's date: [current date]", "s_d": "Our test", "s_e": "Once more"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"amma": "Mom", "chinnu": "Chinnu", "ai": "the AI"}, "te": {"amma": "Amma", "chinnu": "Chinnu", "ai": "the AI"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative27te" if te else "creative27v1"
    s = {"id": sid, "title": "₹5,000 for 10 Grams, Says the AI (Creative 27)" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.4, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1520}
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
                  "tempo": 1.05 if te and who != "ai" else 1.04}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1520, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_gold", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
