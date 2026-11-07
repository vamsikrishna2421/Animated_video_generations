# Creative 22 "The Meter Photo" (story mode): writes reels/creative22v1.json (English) and reels/creative22te.json
# (Telugu). Lines from series/scripts/creative22_meter.md; [n] marks the words the pictures wait for; " | " splits a line
# into two takes. Voices: pipeline/creative22/voice.py. Numbers: our test (series/scripts/creative22_demo).
#   python3 pipeline/creative22/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: her room ("wide", "hook") or an insert ("phone", "meter", "segs", "test",
# "rule"). prop: MeterCrayon.tsx.
LINES = {
    1: ("storyteller", "hook", "hook", "Kamala amma's power bill is usually nine hundred and sixty rupees. [1] This month: one lakh, sixty thousand.",
        "ఎప్పుడూ తొమ్మిది వందల అరవై రూపాయలు. [1] ఈ నెల, లక్షా అరవై వేలు! కమలమ్మ కరెంట్ బిల్లు."),
    2: ("kamala", "wide", "shock", "One lakh? [1] For one fan and one fridge?", "లక్ష రూపాయలా? [1] ఒక ఫ్యాన్, ఒక ఫ్రిజ్ కి?"),
    3: ("storyteller", "phone", "app", "Every month, she photographs her meter, [1] and an app reads it for her.",
        "ప్రతి నెలా ఆమె మీటర్ ఫోటో తీస్తుంది, [1] ఒక యాప్ దాన్ని చదువుతుంది."),
    4: ("storyteller", "phone", "read", "This time, the app read: [1] eight, six, one, one, one.", "ఈసారి యాప్ చదివింది: [1] ఎనిమిది, ఆరు, ఒకటి, ఒకటి, ఒకటి."),
    5: ("storyteller", "meter", "meter", "Her meter said [1] six, six, one, one, four.", "మీటర్ లో ఉన్నది: [1] ఆరు, ఆరు, ఒకటి, ఒకటి, నాలుగు."),
    6: ("storyteller", "segs", "segs", "On a meter, a six is an eight [1] with one line missing.", "మీటర్ మీద, ఆరు అంటే, [1] ఒక గీత తక్కువ ఎనిమిది."),
    7: ("storyteller", "test", "test", "We gave a small free AI that reads photos twenty-four meter photos. [1] It read zero right.",
        "ఫోటోలు చదివే ఒక చిన్న ఫ్రీ ఏ ఐ కి, ఇరవై నాలుగు మీటర్ ఫోటోలు ఇచ్చాం. [1] ఒక్కటి కూడా సరిగ్గా చదవలేదు."),
    8: ("storyteller", "test", "printed", "The same numbers, printed plainly? [1] Twelve out of twelve.", "అవే నంబర్లు, మామూలుగా ప్రింట్ చేస్తే? [1] పన్నెండుకి పన్నెండు."),
    9: ("kamala", "wide", "teacher", "Thirty-five years, [1] I corrected answer sheets.", "ముప్పై ఐదేళ్ళు, [1] పేపర్లు దిద్దాను."),
    10: ("storyteller", "wide", "pen", "So she did what she always did. [1] She took out her red pen.", "అందుకే, ఎప్పుడూ చేసేదే చేసింది. [1] ఎర్ర పెన్ను తీసింది."),
    11: ("storyteller", "rule", "rule", "Before you pay a bill an app read for you, [1] match the reading to your meter, [2] digit by digit.",
         "యాప్ చదివిన బిల్లు కట్టే ముందు, [1] బిల్లులో రీడింగ్, మీటర్ రీడింగ్, [2] ఒక్కో అంకె సరిపోల్చండి."),
    12: ("kamala", "wide", "loop", "Wrong answer. [1] See me.", "తప్పు. [1] నన్ను వచ్చి కలువు."),
}
TTS_EN = {}
SHOW = {1: "Kamala amma's power bill is usually ₹960. This month: ₹1,60,936.", 4: "This time, the app read: 8-6-1-1-1.",
        5: "Her meter said 6-6-1-1-4.", 7: "We gave a small free AI that reads photos 24 meter photos. It read 0 right.",
        8: "The same numbers, printed plainly? 12 out of 12.", 9: "35 years, I corrected answer sheets."}
SHOW_TE = {
    1: "Always ₹960. This month: ₹1,60,000! Kamala amma's power bill.", 2: "One lakh rupees? For one fan and one fridge?",
    3: "Every month she photographs the meter; an app reads it.", 4: "This time the app read: 8, 6, 1, 1, 1.",
    5: "What the meter shows: 6, 6, 1, 1, 4.", 6: "On a meter, a 6 is an 8 with one line less.",
    7: "We gave a small free AI that reads photos 24 meter photos. It didn't read even one right.",
    8: "The same numbers, printed normally? 12 out of 12.", 9: "35 years, I corrected papers.",
    10: "So she did what she always did. She took out the red pen.",
    11: "Before you pay a bill an app read: the bill's reading, the meter's reading, compare each digit.",
    12: "Wrong. Come and see me.",
}
TEMPO_EN = {"storyteller": 1.0, "kamala": 1.0}   # story mode: calm, no speed-up
TEMPO_TE = {"storyteller": 1.0, "kamala": 0.98}
# Sound (CLAUDE.md arc, story mode: a warm, quieter bed): a soft hit on frame 1 and on "one lakh"; a shutter tick, a ding
# on the app's reading; a buzz on her real reading; a pop as the missing line lights; the bed out before "zero", a boom;
# a ding on "twelve out of twelve"; a riser into the red pen, the pen's ticks; a clap into the rule; a hit on "See me"
# and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 0.85, "tail": 0.0}),
          ("s_b", (7, 8, 9), {"boost": 1.1, "lift": 0.5, "drop_at": [[0, 1]], "tail": 0.0}),
          ("s_c", (10, 11, 12), {"outro": True, "pre": 0.3, "boost": 1.5, "lift": 0.6, "rise": 1.5, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.3, 4: 0.35, 5: 0.4, 6: 0.45, 7: 0.4, 8: 0.5, 9: 0.4, 10: 0.5, 11: 1.0, 12: 0.0}
GAP_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.35, "rise": 1.3}}
YT = {"s_a": "₹960 → ₹1,60,936", "s_b": "Our test", "s_c": "Digit by digit"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative22te" if te else "creative22v1"
    s = {"id": sid, "title": "The Meter Photo" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.18, "lead": 0.35, "music": "lofi",
         "musicVol": [0.34, 0.6], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase",
         "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,
         "musicEndRamp": [0.88, 5.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.32,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.18)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.3> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.3})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "tagLeft": True, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_meter", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
