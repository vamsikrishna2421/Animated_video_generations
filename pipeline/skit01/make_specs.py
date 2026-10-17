# Skit 01 "The AI that remembered the wrong price": writes reels/skit01v1.json (English) and reels/skit01te.json (Telugu).
# Script: series/scripts/skit01_wrong_price.md (viewer-reviewed v2). Two characters, each line its own take
# (pipeline/skit01/voice.py); three scenes so the music can drop before "Everyone." and lift into the punchline.
#   python3 pipeline/skit01/make_specs.py
import json
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "reels"

# (who, shot, prop, English, Telugu). shot: which camera ("ravi", "ai", "wide"); prop: what the line brings on screen.
LINES = [
    ("ravi", "wide", "slam", "AI! The whole colony is calling me a cheat!", "ఎ ఐ! కాలనీ మొత్తం నన్ను మోసగాడు అంటోంది!"),
    ("ai", "ai", "", "Strange. I billed everyone the right price.", "విచిత్రం. నేను అందరికీ సరైన ధరే వేశాను."),
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
    ("ai", "wide", "pin", "Pin the price board. I'll read it before every bill.", "ధరల బోర్డు ఫోటో పిన్ చేయండి. ప్రతి బిల్లుకు ముందు చదువుతాను."),
    ("ai", "ai", "refunds", "Tomatoes forty. Four months of refunds to go.", "టమాటాలు నలభై. ఇంకా నాలుగు నెలల రిఫండ్లు ఉన్నాయి."),
    ("ravi", "ravi", "", "Fine. Now mug it up.", "సరే. ఇప్పుడు ఇది రట్టా కొట్టు."),
    ("ai", "ai", "training", "Training new notes. Tomatoes forty. [1] Forever.", "కొత్త నోట్స్ ట్రైన్ అవుతున్నాయి. టమాటాలు నలభై. [1] ఎప్పటికీ."),
    ("ravi", "wide", "freeze", "NOOOO!", "వద్దు! వద్దు! వద్దు!"),
]
SCENES = [("sk_a", 0, 11, {}), ("sk_b", 11, 17, {"drop_cue": 1}), ("sk_c", 17, 20, {"lift": True, "outro": True, "tail": 0.9, "music_stop": 0.45})]
PAUSES = {12: {"1": 0.55}, 19: {"1": 0.35}}   # comic beats: silence before "Everyone." and before "Forever."
TTS_EN = {9: "June?!", 20: "No! No! Noooo!", 5: "They're forty this week!"}   # spoken form where the caption shouts in caps
YT = {"sk_a": "Who trained the shop AI?", "sk_b": "Everyone got June prices", "sk_c": "Mug it up"}


def spec(lang):
    te = lang == "te"
    sid = "skit01te" if te else "skit01v1"
    s = {"id": sid, "title": "The AI that remembered the wrong price" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The AI that remembered the wrong price", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.2,
         "music": "lofi", "musicVol": [0.34, 1.1], "musicEQ": [[260, -4, 0.9]], "musicPad": True, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": 1.05 if te else 1.1, "parler_lang": lang}
    if te:
        s.update({"captionMode": "phrase", "handle": "@ai_maastaaru_telugu"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for i in range(a, b):
            who, shot, prop, en, tel = LINES[i]
            ln = {"who": who, "file": f"{i + 1:02d}_{who}.wav", "text": tel if te else en, "show": en, "maxgap": 0.25, "gap": 0.14}
            if not te and (i + 1) in TTS_EN:
                ln["tts"] = TTS_EN[i + 1]
            if (i + 1) in PAUSES:
                ln["pauses"] = PAUSES[i + 1]
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
