# Skit 04 "The fancy chai" (few-shot prompting): writes reels/skit04v1.json (English) and reels/skit04te.json (Telugu).
# Script: series/scripts/skit04_fancy_chai.md (v2). Three people at a chai stall (Babu, Raju, Swathi); the AI is only
# text on Babu's phone, copied from our test (pipeline/skit04/caption_demo.py, series/scripts/skit04_demo/results.json).
# Each line its own take (pipeline/skit04/voice.py). n = the script's line number (7 is the challenge card, held after 8).
#   python3 pipeline/skit04/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: "wide", a person's close shot, or "phone" (the phone fills the frame).
# prop: what the line brings on screen (ChaiCrayon.tsx). [1] = a cue inside the line.
LINES = {
    1: ("raju", "raju", "fancy", "\"Indulge in the Spice of Life\"?! [1] Babu anna, tea costs two hundred rupees now?!",
        "\"స్పైస్ ఆఫ్ లైఫ్\" అంట! [1] బాబు అన్నా, టీ రెండొందలా ఇప్పుడు?!"),
    2: ("babu", "babu", "price", "Same fifteen rupees! [1] I only told the AI: make it fancy.",
        "అదే పదిహేను రూపాయలు! [1] ఏఐ కి ఫ్యాన్సీగా రాయమన్నా, అంతే."),
    3: ("raju", "raju", "normal", "Then tell it: normal!", "మామూలుగా రాయమను!"),
    4: ("babu", "phone", "simple", "\"Keep it simple\"... [1] \"Hey there, tea lovers!\"", "సింపుల్ గా రాయమన్నా... [1] \"టీ లవర్స్\" అంట!"),
    5: ("raju", "raju", "lovers", "Who says \"tea lovers\"?! You call me \"Oi, Raju\"!", "టీ లవర్సా?! నువ్వు నన్ను \"ఒరేయ్ రాజు\" అంటావ్!"),   # en: a bare "Tea" first was lost in 6 takes
    6: ("swathi", "wide", "show", "Nanna, don't tell it how to write. [1] Show it.", "నాన్నా, ఎలా రాయాలో చెప్పకు. [1] చూపించు."),
    8: ("swathi", "phone", "paste", "Paste three of your old posts. [1] Say: write like these, same Telugu-English mix.",
        "నీ పాత పోస్టులు మూడు పెట్టు. [1] ఇలాగే, తెలుగు-ఇంగ్లీష్ కలిపి రాయి అను."),
    9: ("raju", "phone", "ten", "Now that's Babu anna! [1] Ten rupees?! Give me ten!", "ఇప్పుడు బాబు అన్నే! [1] పది రూపాయలా?! పది టీలు ఇవ్వు!"),
    10: ("babu", "babu", "lastyear", "That's last year's price!", "అది పోయిన సంవత్సరం రేటు!"),
    11: ("swathi", "phone", "copies", "It copies your old posts, old prices too. [1] Put today's price in.",
         "పాత పోస్టుల్ని కాపీ కొడుతుంది, పాత రేట్లతో సహా. [1] ఈరోజు రేటు కూడా చెప్పు."),   # render review: "copies everything" vs 5 of 10
    12: ("babu", "wide", "loop", "Fifteen. Perfect! [1] Now... make it fancy!", "పదిహేను. పర్ఫెక్ట్! [1] ఇప్పుడు... ఫ్యాన్సీగా రాయి!"),
}
TTS_EN = {1: "Indulge in the spice of life?! [1] Babu anna, tea costs two hundred rupees now?!"}   # "is tea two hundred" was heard "is T200"
# Telugu lines voiced as two takes, joined (EP34, skit 03, EP35: long Telugu lines babble or lose a half in one take)
TE_SPLIT = {8: ("నీ పాత పోస్టులు మూడు పెట్టు.", "ఇలాగే, తెలుగు-ఇంగ్లీష్ కలిపి రాయి అను."),
            11: ("పాత పోస్టుల్ని కాపీ కొడుతుంది, పాత రేట్లతో సహా.", "ఈరోజు రేటు కూడా చెప్పు.")}
TE_SHOW = {5: "Tea lovers?! You call me \"Orey Raju\"!"}   # the Telugu line says "ఒరేయ్ రాజు"
# Sound (CLAUDE.md arc): a hit and a bonk on frame 1; the bed builds under the bad posts; a lift into the old posts; the
# card's 3-2-1 over the bed; a ding as the reply lands ("Now that's Babu anna!"), then the bed drops out in a short pause
# and a hit lands on "Ten rupees" (the ding and the drop kept apart: script review); up for the fix; a rise into the loop.
SCENES = [("ch_a", (1, 2, 3), {"boost": 1.15, "rise": 1.3, "tail": 0.1}),
          ("ch_b", (4, 5, 6), {"lift": 0.5, "pre": 0.35, "boost": 0.8, "tail": 0.1}),
          ("ch_c", (8, 9, 10), {"lift": 0.5, "pre": 0.35, "boost": 0.9, "drop_at": [[1, "1"]], "tail": 0.1}),
          ("ch_d", (11, 12), {"outro": True, "boost": 1.6, "rise": 1.8, "tail": 0.0})]   # render review: rise into the loop (round 2: still level with the start)
# seconds after line n (default 0.16 EN / 0.24 TE): the card's hold after 8; the fixed post's read after 11
GAP = {1: 0.2, 5: 0.25, 8: 3.9, 9: 0.3, 11: 2.0}   # render review: the card's 2.6 s and the Rs 15 post's 1.8 s were too short to read
PAUSES = {"en": {9: {"1": 0.45}}, "te": {9: {"1": 0.5}}}   # the beat before "Ten rupees" (the drop sits in it)
GAIN = {"babu": 0.5, "raju": 0.5, "swathi": 0.0}
GAIN_LINE = {9: 1.5, 12: 1.0}
TEMPO = {"en": 1.1, "te": 1.06}
YT = {"ch_a": "The fancy post", "ch_b": "Keep it simple", "ch_c": "His old posts", "ch_d": "Today's price"}


def spec(lang):
    te = lang == "te"
    sid = "skit04te" if te else "skit04v1"
    s = {"id": sid, "title": "The fancy chai" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The fancy chai", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.4, 0.78], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase",
         "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": False, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = TE_SHOW[n] if te and n in TE_SHOW else en.replace("[1] ", "")
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if te and n in TE_SPLIT:
                ln.update({"tts": TE_SPLIT[n][0], "file2": f"{n:02d}b_{who}.wav", "tts2": TE_SPLIT[n][1], "pause": 0.3})
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            g = GAIN[who] + GAIN_LINE.get(n, 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_chai", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
