# Creative 13 "Just the amount" (a nature-documentary parody: four friends split a biryani bill with an AI): writes
# reels/creative13v1.json (English) and reels/creative13te.json (Telugu). Lines come from the script
# (series/scripts/creative13_split_the_bill.md); [n] marks the words the pictures wait for; " | " splits a line into two
# takes. Voices: pipeline/creative13/voice.py. Numbers: our test (series/scripts/creative13_demo).
#   python3 pipeline/creative13/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: "hook" (frame 1: the table, the phone vs the calculator),
# "doc" (the documentary frame: leaves, REC, a slow push-in), "phone" (Arjun's chat), "test" (our test card), "working" (the
# reply with its working), "check" (Sneha's calculator and the rule), "loop" (the dessert bill). prop: what the line brings
# on (BillCrayon.tsx).
LINES = {
    1: ("sneha", "hook", "hook", "One thousand fifty-nine each? [1] My calculator says eight twenty-two!",
        "ఒక్కొక్కరికి వెయ్యి యాభై తొమ్మిదా?! | [1] నా కాలిక్యులేటర్ లో, ఎనిమిది వందల, ఇరవై రెండు!"),   # Telugu: "ఇరవై రెండు" was lost or heard "तुम्मिदु" (29) in 9 one-take tries: two takes
    2: ("narrator", "doc", "doc", "Observe. The urban jungle's most dangerous ritual: [1] splitting the bill.",
        "గమనించండి. నగర అడవిలో అతి ప్రమాదకరమైన ఆచారం: [1] బిల్లు పంచుకోవడం."),
    3: ("arjun", "phone", "ask", "The AI is never wrong. [1] I told it: just the amount.",
        "ఆ యాప్ ఎప్పుడూ తప్పు చెప్పదు. [1] ఆన్సర్ మాత్రమే చెప్పు అన్నాను."),
    4: ("narrator", "phone", "guess", "When you ask for just the number, this small AI doesn't calculate. [1] It guesses.",   # render review 2: "Asked" was heard "Ask" (advice, the opposite)
        "నంబర్ మాత్రమే అడిగితే, ఈ చిన్న యాప్ లెక్క వేయదు. [1] ఊహించి చెబుతుంది."),
    5: ("narrator", "test", "test", "In our test, a tiny offline AI split this bill ten times. [1] Ten answers. | [2] Not a single one right.",   # "Not one right" was heard "Not run right"; "Not. One. Right." came out as a question
        "మా టెస్ట్ లో, ఇంటర్నెట్ లేని ఒక చిన్న యాప్ ఈ బిల్లును పది సార్లు పంచింది. [1] పది జవాబులు. | [2] ఒక్కటీ సరైనది కాదు."),   # render review 2: the stop before "Not one right" is the silence between two takes (a pause inside a take was ~0.3-0.45 s)
    6: ("sneha", "phone", "type", "So make it show its working.", "అయితే లెక్క మొత్తం చూపించమని అడుగు."),
    7: ("narrator", "working", "working", "Made to show its working, the creature becomes careful. [1] Nine out of ten right.",   # "grows" was heard "draws"
        "లెక్క చూపించమంటే, ఈ జీవి జాగ్రత్తగా మారుతుంది. [1] పదిలో తొమ్మిది సరైనవి."),
    8: ("sneha", "check", "rule", "It writes the steps. [1] I check each line on my calculator.",
        "అది లెక్క రాస్తుంది. [1] ప్రతి లైన్ నేను కాలిక్యులేటర్ లో చెక్ చేస్తా."),
    9: ("narrator", "doc", "pay", "The young male [1] accepts defeat.", "ఈ కుర్రాడు [1] ఓటమిని అంగీకరించాడు."),   # Telugu: "ఒప్పుకున్నాడు" was heard "अपकूँनादू", one slip from a swear word; "యువకుడు" was lost in 5 takes ("यो कुड")
    10: ("arjun", "loop", "loop", "Ice cream bill! [1] AI, just the amount!", "ఐస్ క్రీమ్ బిల్లు! [1] ఆన్సర్ మాత్రమే చెప్పు!"),   # Telugu: "స్వీట్" didn't match the ICE CREAM slip   # render review: "Dessert bill!" was heard "Desert Bill", then "The desired bill"
}
TTS_EN = {}   # spoken forms
SHOW = {1: "₹1,059 each? My calculator says ₹822!", 5: "In our test, a tiny offline AI split this bill 10 times. 10 answers. <pause 0.9> Not a single one right.",
        7: "Made to show its working, the creature becomes careful. 9 out of 10 right."}
SHOW_TE = {
    1: "₹1,059 each?! <pause 0.3> My calculator says ₹822!", 2: "Observe. The city jungle's most dangerous ritual: splitting the bill.",
    3: "That app never gets it wrong. I told it: just the answer.", 4: "Asked for just the number, this small app doesn't calculate. It guesses.",
    5: "In our test, a small app with no internet split this bill 10 times. 10 answers. <pause 0.9> Not one right.",
    6: "Then ask it to show the whole working.", 7: "Asked to show its working, this creature turns careful. 9 of 10 right.",
    8: "It writes the working. I check each line on my calculator.", 9: "This young male accepts defeat.",
    10: "Ice cream bill! Just the answer!",
}
NOCAP = set()
PAUSES = {7: {"1": 0.35}}   # a beat before "nine"
SPLIT_PAUSE = {5: 0.9}   # the dead stop before "Not one right" (the silence between its two takes)
TEMPO_EN = {"narrator": 1.05, "arjun": 1.15, "sneha": 1.15}
TEMPO_TE = {"narrator": 1.05, "arjun": 1.12, "sneha": 1.12}
TEMPO_LINE_EN = {}
TEMPO_LINE_TE = {1: 1.0, 3: 1.0}   # 1: the 1.12 speed-up swallowed "రెండు" (the raw take has it); 3: Kiran rushes this line (18-20 letters a second)
# Sound (CLAUDE.md arc): a boom and a record scratch-free "dun" on frame 1; birds and insects under the narrator (the
# documentary); a pop on each of the ten amounts, the bed out before "Not one right" (a dead stop), a hit on it; a lift into
# the working and a sting on "nine out of ten"; ticks on each checked line; the end rises into the dessert bill and the
# slam back to frame 1 (the loop). The scenes step up.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.05, "tail": 0.0}),   # render review: the quarters were flat (-19.4, -20.8, -21.4, -20.6): the scenes step up
          ("s_b", (4, 5, 6), {"boost": 1.2, "drop_at": [[1, 2]], "tail": 0.0}),   # the bed out 0.8 s before "Not one right"
          ("s_c", (7, 8), {"lift": 0.9, "pre": 0.3, "boost": 1.35, "drop_at": [[0, 1]], "swell": [0, 1, 1.35], "tail": 0.0}),   # the lift into the working; out before "nine", a swell after it
          ("s_d", (9, 10), {"outro": True, "pre": 0.3, "boost": 1.7, "rise": 1.3, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.3, 3: 0.3, 4: 0.5, 5: 1.5, 6: 0.3, 7: 0.6, 8: 3.0, 9: 0.5, 10: 1.3}   # 5: "0 of 10" and the big-apps line hold 2 s+; 8: the rule card holds ~3 s; 10: the phone's guess on the dessert bill holds
GAP_TE = {1: 0.5}   # the shot-change whoosh landed on "రెండు అంటోంది" (heard "तुम्मिधा")
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.4, "rise": 1.15}}   # the Telugu mix: the 1.7 bed and the forest blurred "యువకుడు" (EP40: a louder last-scene bed buries Telugu words)
YT = {"s_a": "Just the amount", "s_b": "Our test", "s_c": "Show the working", "s_d": "Dessert"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative13te" if te else "creative13v1"
    s = {"id": sid, "title": "Just the amount (Creative 13: an AI splits the bill)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI and money maths", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 3.0, "musicEndRamp": [0.85, 6.0], "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})   # render review 2: the opening hit swallowed "ఒక్కొక్కరికి" at 0.15 s
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_LINE_EN.get(n, TEMPO_EN[who])}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.3)
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
        scenes.append({"id": scid, "type": "sk_bill", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
