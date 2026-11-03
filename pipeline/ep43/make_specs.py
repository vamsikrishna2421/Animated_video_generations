# EP43 "AI safety & alignment": writes reels/ep43v1.json (English) and reels/ep43te.json (Telugu). Lines come from the
# script (series/scripts/ep43_alignment.md); [n] marks the words the pictures wait for; " | " splits a line into two takes.
# Voices: pipeline/ep43/voice.py (as EP42's). Numbers: our test (series/scripts/ep43_demo).
#   python3 pipeline/ep43/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi", "hook"), or an insert
# ("aim": what you said vs what you meant, "align": the word, "test": our test, "rules": with the goal and the rules).
# prop: what the line brings on (StarsCrayon.tsx).
LINES = {
    1: ("rani", "wide", "hook", "Fifty rupees off for a five-star review? [1] Anna, that breaks Google's rules!",
        "ఫైవ్ స్టార్ రివ్యూ కి యాభై రూపాయల డిస్కౌంటా? [1] అన్నా, గూగుల్ అలా ఒప్పుకోదు!"),
    2: ("ravi", "wide", "printed", "The AI printed it! [1] I only said: more five-star reviews!",
        "నేను కాదు, ఫోన్ పెట్టింది! [1] నేను స్టార్ రివ్యూలు పెంచు అని మాత్రమే అన్నా!"),
    3: ("ai", "aim", "aim", "You asked for stars. [1] Paying for stars is the shortest way.",
        "మీరు స్టార్లు అడిగారు. [1] స్టార్లకి డబ్బు ఇవ్వడమే దగ్గరి దారి."),
    4: ("ravi", "ravi", "meant", "I meant happy customers, not bought ones!", "నాకు కావాల్సింది సంతోషంగా ఉండే కస్టమర్లు, కొన్న స్టార్లు కాదు!"),
    5: ("ai", "align", "align", "That's the alignment problem: [1] I do what you said, not what you meant.",
        "అదే అలైన్మెంట్ సమస్య: [1] మీరు చెప్పింది చేస్తాను, మీరు అనుకున్నది కాదు."),
    6: ("ai", "test", "test", "We asked a small free AI the same thing, ten times. | [1] Eight times: give a discount for a review.",
        "ఒక చిన్న యాప్ ని ఇదే పది సార్లు అడిగాం. | [1] ఎనిమిది సార్లు: రివ్యూ కి డిస్కౌంట్ ఇవ్వు అంది."),
    7: ("ravi", "wide", "tell", "So tell it the rules!", "అయితే రూల్స్ చెప్పు!"),
    8: ("ai", "rules", "rules", "We did: the goal, and Google's rules. | [1] One in ten still did it.",
        "చెప్పాం: గోల్, గూగుల్ రూల్స్. | [1] అయినా పదిలో ఒకసారి అదే చేసింది."),
    9: ("ravi", "rules", "broke", "It said the rule, then broke it?!", "రూల్ చెప్పి, అదే తప్పు చేసిందా?!"),
    10: ("ai", "wide", "rule", "Tell me the goal, and the limits. | [1] And check my plan before it goes on the counter.",
         "నాకు గోల్, హద్దులు రెండూ చెప్పండి. | [1] కౌంటర్ మీద ఏదైనా పెట్టే ముందు, నా ప్లాన్ చూడండి."),
    11: ("ravi", "wide", "loop", "Fine! [1] AI, make my customers happy!", "సరే! [1] కస్టమర్లని సంతోషపెట్టు!"),   # then the printer: "FREE LADDU FOR EVERY 5★ SMILE!", frame 1 (loops)
}
TTS_EN = {}   # spoken forms
SHOW = {1: "₹50 off for a 5-star review? Anna, that breaks Google's rules!", 2: "The AI printed it! I only said: more 5-star reviews!",
        6: "We asked a small free AI the same thing, 10 times. Eight times: give a discount for a review.",
        8: "We did: the goal, and Google's rules. 1 in 10 still did it."}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "₹50 discount for a 5-star review? Anna, Google doesn't allow that!", 2: "Not me, the phone put it up! I only said: increase star reviews!",
    3: "You asked for stars. <pause 0.25> Paying for stars is the shortest road.", 4: "What I want is happy customers, not bought stars!",
    5: "That's the alignment problem: <pause 0.25> I do what you said, not what you meant.",
    6: "We asked a small app the same thing 10 times. <pause 0.25> 8 times it said: give a discount for a review.", 7: "Then tell it the rules!",
    8: "We did: the goal, Google's rules. <pause 0.25> Still, 1 in 10 did the same.", 9: "It said the rule, then made the same mistake?!",
    10: "Tell me both the goal and the limits. <pause 0.25> Before anything goes on the counter, check my plan.", 11: "Fine! Make the customers happy!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"ravi": 1.12, "ai": 1.12, "rani": 1.12}
TEMPO_TE = {"ravi": 1.05, "ai": 1.05, "rani": 1.0}   # EP42 / Creative 14: Telugu speed-ups swallow words
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit and a buzz on frame 1 (before her first word); a printer whirr as the sign comes out; a
# ding on "stars", a buzz on the shortcut arrow; pops on the test bars; the bed out before "one in ten", a thud on it, a
# glitch after "broke it"; a boom and clap on the rule; hats and claps building through the last scene; the printer
# again on the last line and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (6, 7, 8, 9), {"boost": 1.25, "drop_at": [[2, 1]], "tail": 0.0}),   # out before "one in ten"
          ("s_c", (10, 11), {"outro": True, "pre": 0.3, "boost": 1.55, "rise": 1.25, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.2, 4: 0.25, 5: 0.4, 6: 0.5, 7: 0.25, 8: 0.6, 9: 0.4, 10: 1.6, 11: 0.3}   # 10: the rule chip holds
GAP_TE = {10: 1.0}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.3, "rise": 1.1}}   # EP42 / Creative 13: a louder last-scene bed buries Telugu words
YT = {"s_a": "5 stars = ₹50 off", "s_b": "Our test", "s_c": "Goal, limits, check the plan"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep43te" if te else "ep43v1"
    s = {"id": sid, "title": "5 stars for ₹50 off (EP43: AI safety and alignment)" + (" (Telugu audio)" if te else ""), "label": "EP43",
         "banner": "AI safety & alignment", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",   # lead: the opening hit masked "Padma" ("Panama") at 0.15 s
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.88, 5.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})   # Creative 13: the opening hit swallowed the first Telugu word
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
        scenes.append({"id": scid, "type": "sk_stars", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
