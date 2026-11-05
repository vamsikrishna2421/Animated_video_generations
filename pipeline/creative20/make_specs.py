# Creative 20 "200 cards say Sunday": writes reels/creative20v1.json (English) and reels/creative20te.json (Telugu). Lines
# come from the script (series/scripts/creative20_sunday_wednesday.md, v2); [n] marks the words the pictures wait for;
# " | " splits a line into two takes. Voices: pipeline/creative20/voice.py. Numbers: our test
# (series/scripts/creative20_demo/days_7B.json, read by hand).
#   python3 pipeline/creative20/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the living room ("wide") or an insert ("test", "how", "rule").
LINES = {
    1: ("tarun", "wide", "hook", "The AI said Sunday... | [1] the calendar says Wednesday!", "చాట్ బాట్ ఆదివారం అంది... | [1] క్యాలెండర్ లో బుధవారం!"),   # script review: the AI in line 1
    2: ("vijaya", "wide", "hall", "We picked the sixteenth because it said Sunday! [1] Twenty-five thousand, non-refundable, for a Wednesday!",
        "ఆదివారం అందనే పదహారో తారీఖు పెట్టాం! [1] బుధవారానికి ఇరవై ఐదు వేలు కట్టేశా, తిరిగి రావు!"),   # script review: what did they lose?
    3: ("mohan", "wide", "asked", "I asked it myself! [1] \"Sixteenth December: Sunday.\"", "నేనే అడిగాను! [1] \"డిసెంబర్ పదహారో తారీఖు: ఆదివారం\" అంది."),
    4: ("tarun", "test", "test", "We tested a small offline AI, ten times. | [1] Sunday: seven. Tuesday: two. Wednesday: once.",   # script review: "that AI" was false; render review: "free" read as free ChatGPT
        "ఇంటర్నెట్ లేని చిన్న చాట్ బాట్ తో పది సార్లు టెస్ట్ చేశాం. | [1] ఆదివారం ఏడు సార్లు. మంగళవారం రెండు. బుధవారం ఒక్కసారే."),   # render review: "చాట్ బాట్ ని" came out near a vulgar word
    5: ("vijaya", "wide", "shock", "It can't even say what day the sixteenth is?!", "ఒక తేదీ ఏ రోజో కూడా చెప్పలేదా?!"),
    6: ("tarun", "how", "how", "It doesn't look at a calendar. [1] It writes the day that sounds right.", "అది క్యాలెండర్ చూడదు. [1] తోచిన రోజు పేరు రాసేస్తుంది."),   # "సరిపోయే" read as "the correct day"
    7: ("mohan", "wide", "count", "Then I'll tell it to count properly!", "అయితే సరిగ్గా లెక్కపెట్టమని చెప్తా!"),
    8: ("tarun", "test", "worse", "We told it to count. [1] It got worse: six out of twenty became two.", "మేము లెక్కపెట్టమన్నాం. | [1] ఇంకా ఘోరం: ఆరు కరెక్ట్ నుంచి, రెండు కరెక్ట్."),   # script review: one punchline, two numbers   # render review: "six right" was heard "sixth right"
    9: ("vijaya", "wide", "what", "So what do we do now?!", "మరి ఇప్పుడు ఏం చేయాలి?!"),
    10: ("tarun", "rule", "rule", "For any date, [1] open your phone's calendar. The calendar counts. The AI guesses.",
         "ఏ తేదీ అయినా, [1] ఫోన్ లో క్యాలెండర్ తెరవండి. క్యాలెండర్ లెక్కపెడుతుంది, చాట్ బాట్ గెస్ కొడుతుంది."),
    11: ("mohan", "wide", "loop", "Fine, let me ask it once more... | [1] Sunday, it says!", "సరే, ఇంకోసారి అడుగుతా... | [1] ఆదివారమే అంటోంది!"),
}
TTS_EN = {1: "The A.I. said Sunday... | [1] the calendar says Wednesday!", 4: "We tested a small offline A.I., ten times. | [1] Sunday: seven. Tuesday: two. Wednesday: once.",
          10: "For any date, [1] open your phone's calendar. The calendar counts. The A.I. guesses."}
SHOW = {2: "We picked the 16th because it said Sunday! ₹25,000, non-refundable, for a Wednesday!", 3: "I asked it myself! \"16th December: Sunday.\"",
        4: "We tested a small offline AI, 10 times. Sunday: 7. Tuesday: 2. Wednesday: once.", 8: "We told it to count. It got worse: 6 out of 20 became 2."}
SHOW_TE = {1: "The chatbot said Sunday... the calendar says Wednesday!", 2: "We fixed the 16th because it said Sunday! I paid ₹25,000 for a Wednesday, no refund!",
           3: "I asked it myself! \"16th December: Sunday,\" it said.", 4: "We tested a small chatbot with no internet, 10 times. Sunday 7 times. Tuesday twice. Wednesday just once.",
           5: "It can't even say what day a date is?!", 6: "It doesn't look at a calendar. It writes whatever day comes to it.", 7: "Then I'll tell it to count properly!",
           8: "We told it to count. <pause 0.3> Even worse: from 6 right, to 2 right.", 9: "So what do we do now?!",
           10: "For any date, <pause 0.3> open the calendar on your phone. The calendar counts, the chatbot guesses.", 11: "OK, let me ask once more... Sunday, it still says!"}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"tarun": 1.15, "vijaya": 1.12, "mohan": 1.12}
TEMPO_TE = {"tarun": 1.05, "vijaya": 1.0, "mohan": 1.0}
TEMPO_LINE_TE = {}
TEMPO_LINE_EN = {}
# Sound: the news sting at 0 and a hit on "Wednesday"; a ding on his phone; a whoosh and a boom into the test tiles; a
# glitch on "got worse"; a success sting on the rule; a stop before "Sunday, it says!", the sting and the slam to frame 1.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.0, "drop_at": [[0, 1]], "tail": 0.0}),
          ("s_b", (4, 5, 6, 7, 8), {"boost": 1.45, "lift": 0.8, "drop_pre": [[0, 0.0, 0.6]], "tail": 0.0}),   # render review: Q2 the quietest
          ("s_c", (9, 10, 11), {"outro": True, "pre": 0.3, "boost": 2.0, "lift": 0.8, "rise": 1.5, "drop_at": [[2, 1]], "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.3, 4: 0.9, 5: 0.15, 6: 0.6, 7: 0.15, 8: 0.7, 9: 0.15, 10: 0.5, 11: 0.0}   # render review: 10's gap read as the end   # 4, 8: the test cards; 10: the rule card
GAP_TE = {}
GAIN = {}
GAIN_TE = {1: 1.5}   # render review: the Telugu hook quieter than Q1
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.3}}
MAXGAP = {}
YT = {"s_a": "The AI said Sunday", "s_b": "Our test", "s_c": "Open the calendar"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative20te" if te else "creative20v1"
    s = {"id": sid, "title": "200 cards say Sunday" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The AI said Sunday", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.42, 0.6] if not te else [0.6, 0.9],   # render review: the English bed further under the voice   # under speech / in gaps; round 2: TE bed 11 dB under the voice, EN gaps over it
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.3 if not te else 1.0, "captionMode": "phrase", "musicEQ": [[180, -4, 1.0], [260, -9, 0.9], [2400, -5, 1.0]],   # render review: a steady 200-300 Hz band under the voice (a drone; it also hid the Telugu voice from the recogniser)
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
                pz = {1: 0.05, 4: 0.35, 11: 0.7}.get(n, 0.25)   # 11: the stop before "Sunday, it says!"   # the stop before the punchline
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
        scenes.append({"id": scid, "type": "sk_news", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
