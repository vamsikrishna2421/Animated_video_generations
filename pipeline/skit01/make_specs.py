# Skit 01 "The AI that remembered the wrong price": writes reels/skit01v1.json (English) and reels/skit01te.json (Telugu).
# Script: series/scripts/skit01_wrong_price.md (viewer-reviewed v2). Two characters, each line its own take
# (pipeline/skit01/voice.py); three scenes so the music can drop before "Everyone." and lift into the punchline.
#   python3 pipeline/skit01/make_specs.py
import json
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "reels"

# (who, shot, prop, English, Telugu). shot: which camera ("ravi", "ai", "wide"); prop: what the line brings on screen.
LINES = [
    ("ravi", "wide", "slam", "AI! The whole colony is calling me a cheat!", "ఏ ఐ, కాలనీ మొత్తం నన్ను మోసగాడు అంటోంది!"),
    ("ai", "ai", "", "Strange. I charged everyone the right price.", "విచిత్రం. నేను అందరికీ సరైన ధరే వేశాను."),
    ("ravi", "ravi", "", "Tomatoes?", "టమాటాలు?"),
    ("ai", "ai", "bill", "Sixty.", "కిలో అరవై."),
    ("ravi", "ravi", "board", "They're FORTY this week!", "ఈ వారం కిలో నలభై!"),
    ("ai", "ai", "", "Not in my notes.", "నా నోట్స్ లో అలా లేదు."),
    ("ravi", "ravi", "", "What notes?", "ఏ నోట్స్?"),
    ("ai", "ai", "notes", "The notes your nephew trained into me. In June.", "మీ మేనల్లుడు నాకు ట్రైన్ చేసిన నోట్స్. జూన్ లో."),
    ("ravi", "ravi", "", "JUNE?!", "జూన్ ఆ?!"),
    ("ai", "wide", "flashback", "You told him, train it once, it'll remember.", "మీరే అన్నారు, ఒక్కసారి ట్రైన్ చెయ్, గుర్తుంచుకుంటుంది అని."),
    ("ravi", "ravi", "", "How many customers got June prices?", "జూన్ ధరలు ఎంతమందికి వేశావు?"),
    ("ai", "ai", "bills", "Since June? [1] Everyone.", "జూన్ నుంచి? [1] అందరికీ."),
    ("ravi", "ravi", "", "Fix it.", "సరి చెయ్."),
    ("ai", "ai", "mondays", "Retrain me every Monday. I might still say sixty.", "ప్రతి సోమవారం నన్ను మళ్ళీ ట్రైన్ చేయండి. అయినా అరవై అనొచ్చు."),
    ("ravi", "ravi", "", "Or?", "లేదంటే?"),
    ("ai", "wide", "pin", "Show me the price board. I'll read it before every bill.", "ధరల బోర్డు ఫోటో పిన్ చేయండి. ప్రతి బిల్లుకు ముందు చదువుతాను."),
    ("ai", "ai", "refunds", "Tomatoes forty. [1] Four months of refunds to go.", "టమాటాలు నలభై. [1] ఇంకా నాలుగు నెలల రిఫండ్లు ఉన్నాయి."),
    ("ravi", "ravi", "toss", "Fine. Now mug it up.", "సరే. ఇప్పుడు ఇది రట్టా కొట్టు."),
    ("ai", "ai", "training", "Training new notes. Tomatoes forty. [1] Forever.", "కొత్త నోట్స్ ట్రైన్ అవుతున్నాయి. టమాటాలు నలభై. [1] ఎప్పటికీ."),
    ("ravi", "wide", "freeze", "No, no, no, [1] NOOOO!", "వద్దు! వద్దు! [1] వద్దు!"),
]
# Render review v1 -> v2: a lift into "Since June?" and a louder middle; the end builds from "mug it up" (rise), drops out
# before "Forever." (hit on the word), and stops hard 0.3 s after the scream so the loop snaps back to "AI!".
SCENES = [("sk_a", 0, 11, {}), ("sk_b", 11, 17, {"drop_cue": 1, "lift": True, "boost": 1.25, "tail": 0.0}),
          ("sk_c", 17, 20, {"lift": True, "outro": True, "tail": 0.0, "drop_at": [[1, 1]], "rise": 1.8})]
# comic beats: silence before "Everyone.", before "Four months of refunds", and before "Forever." (Telugu: longer)
PAUSES = {"en": {12: {"1": 0.55}, 17: {"1": 0.3}, 19: {"1": 0.75}}, "te": {12: {"1": 0.8}, 17: {"1": 0.4}, 19: {"1": 0.75}}}
TTS_EN = {3: "Tomaatoes?", 9: "June?!", 20: "No, no, no, NOOOOOOOO!", 5: "They're forty this week!"}   # spoken forms: caps, and "Tomatoes" (Parler said "Tune in to us")
# Line 20 (English) is two Parler takes joined: three short "no"s, then one long "NOOOO" (Parler alone gave short ones);
# the freeze frame lands on its [1] cue.
YT = {"sk_a": "Who trained the shop AI?", "sk_b": "Everyone got June prices", "sk_c": "Mug it up"}


def spec(lang):
    te = lang == "te"
    sid = "skit01te" if te else "skit01v1"
    s = {"id": sid, "title": "The AI that remembered the wrong price" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The AI that remembered the wrong price", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.2,
         "music": "lofi", "musicVol": [0.45, 1.1], "musicFade": 0.05, "endPad": 0.3, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": 1.05 if te else 1.1, "parler_lang": lang}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for i in range(a, b):
            who, shot, prop, en, tel = LINES[i]
            gap = 0.05 if i == len(LINES) - 1 else 0.24 if te else 0.14   # Telugu gets room to breathe
            ln = {"who": who, "file": f"{i + 1:02d}_{who}.wav", "text": tel if te else en, "show": en, "maxgap": 0.3 if te else 0.25, "gap": gap}
            if not te and (i + 1) in TTS_EN:
                ln["tts"] = TTS_EN[i + 1]
            if (i + 1) in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][i + 1]
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": i + 1})
        data = {"beats": beats, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if scid == "sk_c":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        scenes.append({"id": scid, "type": "sk_shop", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
