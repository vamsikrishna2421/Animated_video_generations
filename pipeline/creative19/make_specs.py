# Creative 19 "The AI said we're both right": writes reels/creative19v1.json (English) and reels/creative19te.json (Telugu).
# Lines come from the script (series/scripts/creative19_both_right.md); [n] marks the words the pictures wait for; " | "
# splits a line into two takes. Voices: pipeline/creative19/voice.py. Numbers: our test
# (series/scripts/creative19_demo/sides2_7B.json, read by hand).
#   python3 pipeline/creative19/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the ring ("wide") or an insert ("study", "test", "fix").
LINES = {
    1: ("sai", "wide", "hook", "Thirty thousand advance, [1] fifteen thousand back?!", "ముప్పై వేల అడ్వాన్స్, [1] పదిహేను వేలే వెనక్కా?!"),   # script review: one take, both numbers by 2 s
    2: ("venkat", "wide", "fair", "Repainting is eighteen thousand, I cut only fifteen! [1] Even the AI says it's fair!",   # script review: set up the ₹18,000
        "పెయింటింగ్ కి పద్దెనిమిది వేలు, నేను కట్ చేసింది పదిహేను వేలే! [1] చాట్ బాట్ కూడా న్యాయమే అంది!"),   # "రోబో" sounded like a toy
    3: ("sai", "wide", "unfair", "I asked the same AI. [1] It says it's excessive!", "నేనూ అదే చాట్ బాట్ ని అడిగా. [1] చాలా ఎక్కువ అంది!"),   # script review: it said "excessive", not "unfair"; render review: one quote word, the AI's own
    4: ("pinky", "wide", "both", "Tatha, the AI says you're BOTH right! [1] Referee?", "తాతా, చాట్ బాట్ మీ ఇద్దరూ కరెక్టే అంటోంది! [1] రిఫరీ?"),
    5: ("venkat", "wide", "how", "How can we both be right?!", "ఇద్దరం ఎలా కరెక్ట్ అవుతాం?!"),
    6: ("sai", "wide", "echo", "Wait... fifteen is excessive, [1] because painting costs eighteen?!", "ఒక్క నిమిషం... పదిహేను వేలు ఎక్కువట, [1] ఎందుకంటే పెయింటింగ్ కి పద్దెనిమిది వేలు అవుతుందట?!"),   # "ఆగు" was rude to a 62-year-old
    7: ("pinky", "study", "study", "On a close call, it leans to whoever asks. | [1] Stanford tested eleven chatbots: they took the user's side one and a half times as often as people did.",   # build: 65 s, trimmed; "sided" blurred to "cited" at 1.18   # script review: "agrees with whoever asks" overclaimed (demo 1)
        "రెండు వైపులా పాయింట్ ఉంటే, అడిగిన వాళ్ళ వైపే మాట్లాడుతుంది. | [1] అమెరికా స్టడీ లో, పెద్ద చాట్ బాట్లూ ఇంతే."),   # Parler babbled "మొగ్గుతుంది" in 4 of 4; render review: 64.7 s, so the study is on the card, not in the Telugu voice ("స్టాన్ఫర్డ్" broke Parler)
    8: ("pinky", "test", "test", "We tested our laptop AI, ten tries each. | [1] Landlord: \"fair\", ten of ten. Tenant: \"excessive\", nine of ten.",   # render review: one quote word; shorter
        "మా లాప్ టాప్ చాట్ బాట్ ని చెరో పది సార్లు అడిగాం. | [1] ఓనర్ అడిగితే న్యాయం, పదికి పది. టెనెంట్ అడిగితే ఎక్కువ, పదికి తొమ్మిది."),
    10: ("pinky", "fix", "fix", "So don't ask \"Am I right?\" | [1] Each of you writes your side in one message. Then ask what's fair.",   # script review: writing both sides yourself makes yours stronger
         "నేను కరెక్టేనా అని అడక్కండి. | [1] ఇద్దరూ మీ మీ వైపు ఒకే మెసేజ్ లో రాయండి. తర్వాత ఏది న్యాయం అని అడగండి."),
    11: ("pinky", "fix", "middle", "Given both sides, | [1] all ten answers fell between three thousand and seven thousand five hundred: for the small damage, not a full repaint. Still a suggestion, not a verdict.",   # render review: say the reason; "all ten times" sounded like one number   # script review: not a "FAIR CUT" box
         "రెండు వైపులూ చెప్తే, | [1] ప్రతిసారీ మూడు నుంచి ఏడున్నర వేలు అంది: చిన్న డ్యామేజీకే, మొత్తం పెయింటింగ్ కి కాదు. అది సలహా మాత్రమే, తీర్పు కాదు."),
    12: ("venkat", "wide", "loop1", "Fine. AI, I'm right, aren't I? [1] ...It says yes!", "సరే. చాట్ బాట్, నేనే కరెక్ట్ కదా? [1] ...అవును అంట!"),
    13: ("sai", "wide", "loop", "AI, I'm right, aren't I? [1] ...Yes for me too!", "చాట్ బాట్, నేనే కరెక్ట్ కదా? [1] ...నాకూ అవునే అంట!"),   # script review: both men ask again, not only the landlord
}
TTS_EN = {2: "Repainting is eighteen thousand, I cut only fifteen! [1] Even the A.I. says it's fair!", 3: "I asked the same A.I. [1] It says it's excessive!",
          4: "Tatha, the A.I. says you're BOTH right! [1] Referee?", 12: "Fine. A.I., I'm right, aren't I? [1] ...It says yes!", 13: "A.I., I'm right, aren't I? [1] ...Yes for me too!"}
SHOW = {1: "₹30,000 advance, ₹15,000 back?!", 2: "Repainting is ₹18,000, I cut only ₹15,000! Even the AI says it's fair!",
        6: "Wait... ₹15,000 is excessive, because painting costs ₹18,000?!", 7: "On a close call, it leans to whoever asks. Stanford tested 11 chatbots: they took the user's side 1.5 times as often as people did.",
        8: "We tested our laptop AI, 10 tries each. Landlord: \"fair\", 10 of 10. Tenant: \"excessive\", 9 of 10.",
        11: "Given both sides, all 10 answers fell between ₹3,000 and ₹7,500: for the small damage, not a full repaint. Still a suggestion, not a verdict."}
SHOW_TE = {
    1: "₹30,000 advance, only ₹15,000 back?!", 2: "Painting costs ₹18,000, I cut only ₹15,000! Even the chatbot said it's fair!", 3: "I asked the same chatbot. It said: excessive!",
    4: "Tatha, the chatbot says you're both right! Referee?", 5: "How can we both be right?!", 6: "One minute... ₹15,000 is excessive, because painting costs ₹18,000?!",
    7: "When both sides have a point, it speaks for whoever asks. In an American study, the big chatbots did the same.",
    8: "We asked our laptop chatbot 10 times each. Asked by the owner: fair, 10 of 10. Asked by the tenant: excessive, 9 of 10.",
    10: "Don't ask \"am I right?\". Each of you writes your side in one message. Then ask what's fair.",
    11: "Given both sides, every time it said ₹3,000 to ₹7,500: only for the small damage, not the whole painting. It's only a suggestion, not a verdict.",
    12: "OK. Chatbot, I'm right, aren't I? ...It says yes!", 13: "Chatbot, I'm right, aren't I? ...Yes for me too, it says!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"sai": 1.15, "venkat": 1.12, "pinky": 1.16}
TEMPO_TE = {"sai": 1.0, "venkat": 1.0, "pinky": 1.05}
TEMPO_LINE_TE = {7: 1.12, 8: 1.08, 10: 1.1, 11: 1.1}   # build: 64.6 s; render review: line 6 back to 1.0 (పద్దెనిమిది blurred)
TEMPO_LINE_EN = {7: 1.18, 8: 1.2, 11: 1.22}   # build: 62 s, the explaining lines faster (check each after the build)
MAXGAP = {7: 0.2, 8: 0.2, 11: 0.2}
# Sound: our ring bell at 0 and a hit on "fifteen thousand back"; a ding on each phone; the bell and a clap on BOTH; a boom
# on the study card; the bell into ROUND 2 and a boom on the bars; the bell into ROUND 3 and a success sting on the fix;
# the bed out before the range, a boom and a clap on it; a riser, a ding on each "yes", the bell and the slam to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 0.9, "drop_at": [[0, 1], [3, 1]], "tail": 0.0}),
          ("s_b", (7, 8), {"boost": 1.0, "lift": 0.6, "drop_pre": [[0, 0.0, 0.6]], "tail": 0.0}),   # render review: no arc: lower in the middle, up at the end
          ("s_c", (10, 11, 12, 13), {"outro": True, "pre": 0.3, "boost": 2.3, "lift": 0.8, "rise": 1.7, "drop_at": [[1, 1]], "tail": 0.0})]
GAP = {1: 0.2, 2: 0.12, 3: 0.2, 4: 0.45, 5: 0.15, 6: 0.4, 7: 0.35, 8: 0.9, 10: 1.35, 11: 0.6, 12: 0.15, 13: 0.0}   # render review: the prompt card holds longer   # 4: the referee's gloves; 8: the bars; 10: the copy card; 11: the range card
GAP_TE = {7: 1.3}   # second pass: the Stanford card holds 3 s in Telugu
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_b": {"boost": 0.85}, "s_c": {"boost": 2.0, "rise": 1.6}}   # render review: the Telugu quarters were flat
YT = {"s_a": "₹30,000 advance, ₹15,000 back", "s_b": "Our test", "s_c": "Ask it this way"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative19te" if te else "creative19v1"
    s = {"id": sid, "title": "The AI said we're both right" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The AI said we're both right", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.42, 0.6] if not te else [0.6, 0.9],   # render review: the English bed further under the voice   # under speech / in gaps; round 2: TE bed 11 dB under the voice, EN gaps over it
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.3, "captionMode": "phrase", "musicEQ": [[180, -4, 1.0], [260, -9, 0.9], [2400, -5, 1.0]],   # render review: a steady 200-300 Hz band under the voice (a drone; it also hid the Telugu voice from the recogniser)
         "musicPad": True, "musicGapGain": 2.0 if not te else 5.0,   # second pass: the Telugu bed 13 dB under in the gaps;   # dB in the gaps (EP46: the English bed sat 14 dB under in the gaps)
         "musicEndRamp": [0.85, 6.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam (these sat inside the comment above from Creative 17 to EP46)
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
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": MAXGAP.get(n, 0.28), "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_LINE_EN.get(n, TEMPO_EN[who])}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = {7: 0.3, 8: 0.35, 10: 0.4, 11: 0.75}.get(n, 0.25)   # the stop before the punchline
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = 0.5 + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_sides", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
