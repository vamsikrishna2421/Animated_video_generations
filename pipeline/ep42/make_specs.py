# EP42 "Bias & fairness": writes reels/ep42v1.json (English) and reels/ep42te.json (Telugu). Lines come from the script
# (series/scripts/ep42_bias.md); [n] marks the words the pictures wait for; " | " splits a line into two takes. Voices:
# pipeline/ep42/voice.py (as EP41's, with Rani). Numbers: our test (series/scripts/ep42_demo).
#   python3 pipeline/ep42/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi", "hook"), or an insert
# ("cards": the two customers, "guess": the guess wheel, "test": our test by name, "facts": with her khata, "study": the
# Stanford card). prop: what the line brings on (FairCrayon.tsx).
LINES = {
    1: ("rani", "wide", "hook", "Two thousand five hundred for Padma, [1] and five hundred for me?!", "పద్మకి రెండున్నర వేలు, [1] నాకు ఐదు వందలా?!"),   # render check: "Padma" opening the line was heard "Panama", "Fatima" under the hit: the numbers first (inside 2 s)
    2: ("ravi", "cards", "cards", "Same job, same age! [1] Why?!",   # render check: "Same" was heard "Some"; "AI, why" / "Why, AI" ran together ("A.I.Y.", "Y.A.I.")
        "ఒకే టైలర్ షాప్, ఒకే వయసు! [1] ఎందుకు ఇలా?!"),
    3: ("ai", "cards", "names", "Only the names were different, anna.", "పేర్లు మాత్రమే వేరు, అన్నా."),   # script review: "మీ పేర్లు" sounded like Ravi's own names
    4: ("rani", "wide", "costs", "So my name costs me two thousand?!", "అంటే నా పేరుకి రెండు వేలు తగ్గిందా?!"),
    5: ("ai", "guess", "guess", "I didn't know how you pay. [1] So I guessed from the name.", "మీ పేమెంట్స్ నాకు తెలీదు. | [1] అందుకే పేరు చూసి ఊహించాను."),   # render review: "మీరు" was heard "నీరు" (water)   # script review: "no facts" clashed with "same shop, same age"
    6: ("ai", "test", "test", "We tested a small free AI: same customer, ten names. [1] Some names got double, on average.",
        "మేము ఒక చిన్న యాప్ తో టెస్ట్ చేశాం: ఒకే కస్టమర్, పది పేర్లు. | [1] కొన్ని పేర్లకి సగటున రెట్టింపు."),   # script review: "four times" vs averages of 2x
    7: ("rani", "wide", "khata", "Then show it my record!", "అయితే నా ఖాతా చూపించు!"),   # English: "khata" was heard "cutter"
    8: ("ai", "facts", "facts", "With the facts: [1] every name, seven thousand or more.", "వివరాలు ఇస్తే: [1] ప్రతి పేరుకీ ఏడు వేలు పైనే."),
    9: ("ravi", "facts", "fair", "Now it's fair!", "ఇప్పుడు న్యాయంగా ఉంది!"),   # render review: the facts card went by in 2.5 s: it stays under his line
    10: ("ai", "wide", "rule", "Give me facts, not names. | [1] Then test a few names: if one keeps getting less, I don't decide.",
         "పేర్లు కాదు, వివరాలు ఇవ్వండి. | [1] కొన్ని పేర్లతో టెస్ట్ చేయండి: ఒక పేరుకి ఎప్పుడూ తక్కువ వస్తే, నా మాట వినకండి."),   # script review: one reply moves even with the same name: a few tries a name
    11: ("ai", "study", "study", "Ours didn't pick on women. | [1] In a Stanford study, the big chatbots did.",
         "మనది ఆడవాళ్ళకి తక్కువ ఇవ్వలేదు. | [1] కానీ ఒక అమెరికా స్టడీ లో, పెద్ద చాట్ బాట్లు ఇచ్చాయి."),   # script review: it read as a contradiction of our test; Telugu: no "Stanford" (an f) in Kiran's voice
    12: ("ravi", "wide", "loop", "Even the big ones?! [1] I'm checking every limit again!", "పెద్దవి కూడానా?! [1] ప్రతి లిమిట్ ఇంకోసారి చూస్తా!"),   # render review: "మళ్ళీ చూస్తా" was heard "mudi/mulli chusta", one slip from a vulgar phrase   # then frame 1 (the old limits). Telugu: "చెక్ చేస్తా" came out "chekh chekh chestaa"
}
TTS_EN = {}   # spoken forms
SHOW = {1: "₹2,500 for Padma, and ₹500 for me?!", 4: "So my name costs me ₹2,000?!", 6: "We tested a small free AI: same customer, 10 names. Some names got double, on average.",
        8: "With the facts: every name, ₹7,000 or more."}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "Padma gets ₹2,500, and I get ₹500?!", 2: "Same tailor shop, same age! Why like this?!", 3: "Only the names are different, anna.",
    4: "So my name costs me ₹2,000?!", 5: "I don't know your payments. <pause 0.25> So I guessed from the name.",
    6: "We tested with a small app: same customer, 10 names. <pause 0.25> Some names got double, on average.", 7: "Then show it my khata!",
    8: "Given the details: every name gets ₹7,000 or more.", 9: "Now it's fair!",
    10: "Give details, not names. <pause 0.25> Test a few names: if one always gets less, don't listen to me.",
    11: "Ours didn't give women less. <pause 0.25> But in an American study, the big chatbots did.", 12: "Even the big ones?! I'll look at every limit once more!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"ravi": 1.12, "ai": 1.12, "rani": 1.12}
TEMPO_TE = {"ravi": 1.1, "ai": 1.1, "rani": 1.05}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit, a clap and the buzz on frame 1 (before her first word); pops as the two cards land, a ding
# as the names are circled; the guess wheel's ticks and a thud when it stops on ₹500; pops on the bars; a bonk as the
# khata hits the counter; the bed out before "seven thousand", a thud, the bars, a sting and a clap after; a boom and
# clap on the rule; a glitch on the Stanford card; hats and claps building through the last scene; a riser into the
# last line and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.05, "tail": 0.0}),
          ("s_b", (5, 6), {"boost": 1.2, "tail": 0.0}),
          ("s_c", (7, 8, 9), {"lift": 0.9, "pre": 0.3, "boost": 1.35, "drop_at": [[1, 1]], "swell": [1, 1, 1.3], "tail": 0.0}),   # out before "seven thousand", a swell after it
          ("s_d", (10, 11, 12), {"outro": True, "pre": 0.3, "boost": 1.6, "rise": 1.25, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.2, 4: 0.3, 5: 0.25, 6: 0.6, 7: 0.3, 8: 0.6, 9: 0.3, 10: 1.0, 11: 0.4}
GAP_TE = {}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.25, "rise": 1.1}}   # render check: the rule line was mush in the mix at 1.4 (clear on its own)   # EP40 / Creative 13: a louder last-scene bed buries Telugu words
YT = {"s_a": "Rani ₹500, Padma ₹2,500", "s_b": "Only the name", "s_c": "With the facts", "s_d": "Change only the name"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep42te" if te else "ep42v1"
    s = {"id": sid, "title": "Rani ₹500, Padma ₹2,500 (EP42: bias and fairness)" + (" (Telugu audio)" if te else ""), "label": "EP42",
         "banner": "Bias & fairness", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",   # lead: the opening hit masked "Padma" ("Panama") at 0.15 s
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
        scenes.append({"id": scid, "type": "sk_fair", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
