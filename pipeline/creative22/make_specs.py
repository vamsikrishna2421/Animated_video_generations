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
        "ఎప్పుడూ తొమ్మిది వందల అరవై రూపాయలు. [1] ఈ నెల, ఒక లక్షా, అరవై వేలు! కమలమ్మ కరెంట్ బిల్లు."),   # render review: "వేలు" swallowed
    2: ("kamala", "wide", "shock", "One lakh? [1] For one fan and one fridge?", "లక్ష రూపాయలా? [1] ఒక ఫ్యాన్, ఒక ఫ్రిజ్ కి?"),
    3: ("storyteller", "phone", "app", "Every month, she photographs her meter, [1] and an app reads it for her.",
        "ప్రతి నెలా కమలమ్మ మీటర్ ఫోటో తీస్తుంది, [1] ఒక యాప్ దాన్ని చదువుతుంది."),   # script review: "ఆమె" bookish
    4: ("storyteller", "phone", "read", "This time, the app read her six [1] as an eight.", "ఈసారి యాప్, ఆరుని [1] ఎనిమిదిగా చదివింది."),   # script review: ten digits by ear lost them
    5: ("storyteller", "meter", "meter", "Two digits wrong: [1] twenty thousand extra units.", "రెండు అంకెలు తప్పు: [1] ఇరవై వేల యూనిట్లు ఎక్స్ ట్రా."),
    6: ("storyteller", "segs", "segs", "On a meter, a six is an eight [1] with one line missing.", "ఎనిమిదిలో ఒక గీత తీసేస్తే, [1] అదే ఆరు."),
    7: ("storyteller", "test", "test", "We tried a small free AI on twenty-four meter photos we drew. [1] It got zero right.",
        "మేము గీసిన ఇరవై నాలుగు మీటర్ ఫోటోలు, ఒక చిన్న ఫ్రీ ఏ ఐ కి ఇచ్చాం. [1] ఒక్కటి కూడా సరిగ్గా చదవలేదు."),
    8: ("storyteller", "test", "printed", "The same twelve numbers, printed plainly? [1] Twelve out of twelve.", "అవే పన్నెండు నంబర్లు, మామూలుగా ప్రింట్ చేస్తే? [1] పన్నెండుకి పన్నెండు."),
    9: ("storyteller", "rule", "rule", "So when the app shows a reading, [1] check it against your meter, [2] digit by digit, before you tap OK.",   # script review: at the app moment
        "అందుకే, యాప్ రీడింగ్ చూపిస్తే, [1] ఓకే నొక్కే ముందు, [2] మీటర్ తో ప్రతి అంకె చూడండి."),   # render review: the muddiest Telugu line
    10: ("kamala", "wide", "teacher", "Thirty-five years, [1] I corrected answer sheets.", "ముప్పై ఐదు సంవత్సరాలు, [1] పేపర్లు దిద్దాను."),
    11: ("storyteller", "wide", "pen", "So she did what she always did. [1] She took out her red pen.", "అందుకే, ఎప్పుడూ చేసేదే చేసింది. [1] ఎర్ర పెన్ను తీసింది."),
    12: ("kamala", "wide", "loop", "Wrong answer. [1] See me.", "తప్పు జవాబు. [1] స్టాఫ్ రూమ్ కి రా."),   # render review: "కలువు" came out "kaalu"
}
TTS_EN = {}
SHOW = {1: "Kamala amma's power bill is usually ₹960. This month: ₹1,60,936.", 4: "This time, the app read her 6 as an 8.",
        5: "Two digits wrong: 20,000 extra units.", 7: "We tried a small free AI on 24 meter photos we drew. It got 0 right.",
        8: "The same 12 numbers, printed plainly? 12 out of 12.", 10: "35 years, I corrected answer sheets."}
SHOW_TE = {
    1: "Always ₹960. This month: ₹1,60,936! Kamala amma's power bill.", 2: "One lakh rupees? For one fan and one fridge?",
    3: "Every month Kamala amma photographs the meter; an app reads it.", 4: "This time the app read her 6 as an 8.",
    5: "Two digits wrong: 20,000 extra units.", 6: "Take one line out of an 8, and it's a 6.",
    7: "We gave 24 meter photos we drew to a small free AI. It didn't read even one right.",
    8: "The same 12 numbers, printed normally? 12 out of 12.",
    9: "So when the app shows a reading, before you press OK, look at each digit against the meter.",
    10: "35 years, I corrected papers.", 11: "So she did what she always did. She took out the red pen.",
    12: "Wrong answer. Come to the staff room.",
}
TEMPO_EN = {"storyteller": 1.0, "kamala": 1.0}   # story mode: calm, no speed-up
TEMPO_TE = {"storyteller": 1.0, "kamala": 0.98}
# Sound (CLAUDE.md arc, story mode: a warm, quieter bed): a soft hit on frame 1 and on "one lakh"; a shutter tick, a ding
# on the app's reading; a buzz on her real reading; a pop as the missing line lights; the bed out before "zero", a boom;
# a ding on "twelve out of twelve"; a riser into the red pen, the pen's ticks; a clap into the rule; a hit on "See me"
# and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 0.85, "tail": 0.0}),
          ("s_b", (7, 8, 9), {"boost": 1.0, "lift": 0.4, "drop_at": [[0, 1]], "tail": 0.0}),   # render review: the rule card was louder than the reveal
          ("s_c", (10, 11, 12), {"outro": True, "pre": 0.3, "boost": 1.8, "lift": 0.7, "rise": 1.7, "drop_pre": [[2, 0.0, 0.6]], "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.3, 4: 0.35, 5: 0.4, 6: 0.45, 7: 0.4, 8: 0.4, 9: 0.45, 10: 0.4, 11: 0.35, 12: 0.0}   # script review: 11 -> 12 unbroken
GAP_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.5}}
YT = {"s_a": "₹960 → ₹1,60,936", "s_b": "Our test", "s_c": "Digit by digit"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative22te" if te else "creative22v1"
    s = {"id": sid, "title": "The Meter Photo" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.18, "lead": 0.35, "music": "lofi",
         "musicVol": [0.32, 0.5], "musicDuckRamp": 9,   # render review: the bed pumped up to voice level between lines
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase",
         "musicEQ": [[260, -8, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0 if not te else 1.0,
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
