# EP41 "The biggest brain" (how to choose the right model): writes reels/ep41v1.json (English) and reels/ep41te.json
# (Telugu). Lines come from the script (series/scripts/ep41_choose_model.md); [n] marks the words the pictures wait for;
# " | " splits a line into two takes. Voices: pipeline/ep41/voice.py (as EP40's). Numbers: our test
# (series/scripts/ep41_demo; the bills from series/scripts/ep38_demo).
#   python3 pipeline/ep41/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi"), or an insert ("pass":
# the pass-mark notepad, "test": the test card, "chat": the shop's WhatsApp, "telugu": the Telugu-typed orders card).
# prop: what the line brings on (ChooseCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "Same reply, order after order?! [1] I'm putting in the biggest brain!",
        "ఆర్డర్ ఆర్డర్ కీ ఒకటే రిప్లై?! [1] అన్నిటికన్నా పెద్ద బ్రెయిన్ పెడతా!"),   # render review: "every order" clashed with its 8 of 20
    2: ("ai", "pass", "pass", "Biggest for which job, anna? [1] Write the pass mark first.",
        "ఏ పనికి పెద్దది అన్నా? | [1] ముందు పాస్ మార్క్ రాయండి."),
    3: ("ravi", "pass", "marks", "Nineteen of twenty orders right! [1] And every reply under ten seconds!",   # render review: "right, every reply" was heard "write every reply"
        "ఇరవై లో పందొమ్మిది ఆర్డర్లు కరెక్ట్, [1] ప్రతి రిప్లై పది సెకన్ల లోపు!"),
    4: ("ai", "test", "test", "Then all three brains take one test: [1] your twenty orders.",
        "అయితే మూడు బ్రెయిన్లకీ ఒకే టెస్ట్. | [1] మీ ఇరవై ఆర్డర్లు."),
    5: ("ravi", "ravi", "quiz", "Easy! The biggest one wins!", "ఈజీ! పెద్దదే గెలుస్తుంది!"),   # the quiz holds after it
    6: ("ai", "test", "reveal", "The middle one passed. [1] Nineteen of twenty, all under five seconds.",
        "మధ్యలో ఉన్నది పాస్. | [1] ఇరవై లో పందొమ్మిది, ఐదు సెకన్ల లోపే."),
    7: ("ravi", "ravi", "notbig", "Not the biggest?!", "పెద్దది కాదా?!"),
    8: ("ai", "test", "curd", "Sixteen of twenty: it turned two curds into two litres! | [1] And one reply took eleven seconds.",
        "ఇరవై లో పదహారు. రెండు పెరుగు కప్పులని రెండు లీటర్లు చేసింది! | [1] ఒక రిప్లై కి పదకొండు సెకన్లు."),
    9: ("ravi", "ravi", "cups", "Two litres of curd?!", "లీటర్ల పెరుగా?!"),   # "Litres of curd?!" came out "lighters of curd" in four Parler takes
    10: ("ai", "wide", "rule", "Keep the smallest one that passes: [1] it's faster and needs less memory.",
         "పాస్ అయిన వాటిలో చిన్నదే ఉంచండి. | [1] అది ఫాస్ట్, మెమరీ కూడా తక్కువ."),
    11: ("ravi", "wide", "done", "The middle one, forever!", "ఇక మధ్యదే, ఎప్పటికీ!"),
    12: ("ravi", "chat", "sugar", "Half a kilo became a kilo! [1] It doubled the sugar!", "అర కిలో అడిగితే కిలో రాసింది! [1] పంచదార డబుల్!"),
    13: ("ai", "telugu", "none", "Telugu words are a new job, anna. | [1] And none of the three passed it.",
         "తెలుగు పదాలతో కూడా టైప్ చేస్తారు అన్నా. | [1] దానికి ఒక్కటి కూడా పాస్ అవ్వలేదు."),
    14: ("ravi", "ravi", "eggs", "Perugu became eggs?! [1] So now what?!", "పెరుగు ఎగ్స్ అయిందా?! [1] ఇప్పుడేం చేయాలి?!"),
    15: ("ai", "wide", "fix", "Fix the prompt, or try another brain. [1] Then test again.",
         "ప్రాంప్ట్ మార్చండి, లేదా వేరే బ్రెయిన్ ట్రై చేయండి. | [1] తర్వాత మళ్ళీ టెస్ట్."),
    16: ("ravi", "wide", "loop", "Test again?! [1] Then which brain do I keep?!", "మళ్ళీ టెస్టా?! [1] మరి ఏ బ్రెయిన్ ఉంచాలి?!"),   # then frame 1 (loops)
}
TTS_EN = {9: "Two liters of curd?!"}   # spoken forms (Parler reads "liters" more cleanly)
SHOW = {   # captions with digits
    3: "19 of 20 orders right! And every reply under 10 seconds!", 4: "Then all three brains take one test: your 20 orders.",
    6: "The middle one passed. 19 of 20, all under 5 seconds.", 8: "16 of 20: it turned 2 curds into 2 litres! And one reply took 11 seconds.",
}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "The same reply, order after order?! I'll put in the biggest brain!", 2: "Big for which job, anna? First write the pass mark.",
    3: "19 of 20 orders correct, every reply under 10 seconds!", 4: "Then one test for all three brains. Your 20 orders.",
    5: "Easy! The big one wins!", 6: "The middle one passes. 19 of 20, under 5 seconds.", 7: "Not the big one?!",
    8: "16 of 20. It made 2 curd cups into 2 litres! 11 seconds for one reply.", 9: "Litres of curd?!",
    11: "The middle one from now on, forever!", 12: "I asked for half a kilo, it wrote a kilo! Double sugar!",
    13: "They type in Telugu words too, anna. Not even one passed that.", 14: "Curd became eggs?! What do I do now?!",
    15: "Change the prompt, or try another brain. Then test again.", 16: "Test again?! Then which brain do I keep?!",
}
NOCAP = {10}   # the rule chip carries its words
PAUSES = {}
TEMPO_EN = {"ravi": 1.15, "ai": 1.15}   # first build ran 64 s
TEMPO_TE = {"ravi": 1.15, "ai": 1.15}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit, the error buzz and three message pops on frame 1; a pen scratch as the pass mark is
# written; the quiz's tick-tock 3-2-1 with a riser, the bed out after the count, a boom and clap on the cut to the
# answer; a buzz on the curd reply and a hit on "two litres"; a snap on the rule; a WhatsApp ding and a buzz on the
# sugar; a glitch on "none passes"; hats and claps building through the last scene; a riser into the last line and the
# slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.25, "tail": 0.0}),
          ("s_b", (6, 7, 8, 9), {"boost": 1.15, "drop_pre": [[0, 0.0, 1.4]], "tail": 0.1}),   # the bed out after the quiz count
          ("s_c", (10, 11), {"lift": 0.8, "pre": 0.35, "boost": 1.15, "tail": 0.1}),
          ("s_e", (12,), {"pre": 0.9, "boost": 1.15, "drop_pre": [[0, 0.4, 0.5]], "tail": 0.1}),   # render review: the sugar reply got no hit: the order
          # comes up on the cut, the bed stops, the reply lands with a hit, then Ravi
          ("s_d", (13, 14, 15, 16), {"lift": 0.9, "pre": 0.35, "outro": True, "boost": 1.5, "rise": 1.2,
                                     "drop_pre": [[3, 0.0, 0.8]], "tail": 0.0})]   # render review: no lift into the loop line: the bed out under the riser
GAP = {1: 0.15, 2: 0.2, 3: 0.2, 4: 0.2, 5: 4.8, 6: 0.25, 7: 0.15, 8: 0.25, 9: 0.25, 10: 0.35, 11: 0.45, 12: 0.25, 13: 0.2, 14: 0.2, 15: 1.0}   # 5: the quiz holds 4.8 s (Creative 11); 15: the riser into the last line sits in the gap
GAP_TE = {}
GAIN = {16: 1.0}
GAIN_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.4}}   # EP40: a louder last-scene bed buried Telugu words; check the lines after
YT = {"s_a": "Which brain do I keep?", "s_b": "Not the biggest", "s_c": "The smallest that passes", "s_e": "Half a kilo", "s_d": "New job, new test"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep41te" if te else "ep41v1"
    s = {"id": sid, "title": "The biggest brain (EP41: how to choose the right model)" + (" (Telugu audio)" if te else ""), "label": "EP41",
         "banner": "Choosing an AI model", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.95, 3.5], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = 0.25
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = (-1.0 if who == "ai" else 0.5) + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_choose", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
