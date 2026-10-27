# EP40 "73 in maths" (benchmarks & evaluations: how models are compared): writes reels/ep40v1.json (English) and
# reels/ep40te.json (Telugu). Lines come from the script (series/scripts/ep40_benchmarks.md); [n] marks the words the
# pictures wait for; " | " splits a line into two takes. Voices: pipeline/ep40/voice.py (as EP39's). Numbers: our test
# (series/scripts/ep40_demo, the bills from series/scripts/ep38_demo), Qwen's own chart.
#   python3 pipeline/ep40/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi"), or an insert
# ("paper": the exam paper and the robots at desks, "screen": the phone's test card, "sizes": the full-size brain vs the
# squeezed one, "leak": contamination and the copy check, "bills": the bill test card, "study": the post going into what
# AIs learn from). prop: what the line brings on (BenchCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "Seventy-three in maths, [1] and you got nine of my twenty bills wrong?!",
        "మ్యాథ్స్ లో డెబ్బై మూడు, [1] నా ఇరవై బిల్లుల్లో తొమ్మిది తప్పా?!"),
    2: ("ai", "paper", "paper", "That's the famous maths exam, anna. [1] The same paper for every AI.",
        "అది ఫేమస్ మ్యాథ్స్ ఎగ్జామ్ అండి. | [1] ప్రతి బ్రెయిన్ కీ అదే పేపర్."),
    3: ("ravi", "ravi", "quiz", "Then write it here! [1] Thirty questions!", "అయితే ఇక్కడే రాయి! [1] ముప్పై లెక్కలు!"),   # the quiz holds after it; "ముప్పై ప్రశ్నలు" babbled in three Parler takes
    4: ("ai", "screen", "reveal", "Eighteen out of thirty. [1] Sixty percent.", "ముప్పై లో పద్దెనిమిది. | [1] అరవై శాతం."),
    5: ("ravi", "ravi", "not73", "Not seventy-three?!", "డెబ్బై మూడు కాదా?!"),
    6: ("ai", "sizes", "sizes", "Seventy-three was my full-size brain, on my maker's test. | [1] You run me squeezed, on yours.",
        "డెబ్బై మూడు, నా అసలు సైజ్ బ్రెయిన్ కి, మా కంపెనీ టెస్ట్. | [1] మీ దగ్గర కంప్రెస్ చేసిన బ్రెయిన్, మీ టెస్ట్."),
    7: ("ravi", "ravi", "copied", "Even that sixty could be copied! [1] That paper's online!", "అరవై కూడా కాపీ ఏమో! [1] ఆ పేపర్ ఆన్ లైన్ లో ఉంది!"),
    8: ("ai", "leak", "leak", "It happens. [1] So: the same questions, new names and numbers.",
        "అవును, అలా జరుగుతుంది. | [1] అందుకే అవే లెక్కలు, కొత్త పేర్లు, కొత్త నంబర్లతో."),
    9: ("ai", "leak", "nocopy", "Sixty-seven percent. [1] No drop: no sign of copying.", "అరవై ఏడు శాతం. | [1] తగ్గలేదు. కాపీ చేసినట్టు లేదు."),
    10: ("ravi", "wide", "trust", "So which number do I trust?!", "మరి ఏ నంబర్ ని నమ్మాలి?!"),
    11: ("ai", "wide", "rule", "Yours. [1] Give each brain your twenty bills, with the right totals written down.",
         "మీ నంబరే నమ్మండి. | [1] ప్రతి బ్రెయిన్ కీ మీ ఇరవై బిల్లులు ఇవ్వండి, సరైన టోటల్స్ రాసి పెట్టి."),   # Parler drops a one-word take ("మీదే.")
    12: ("ai", "bills", "bills", "On your bills, [1] the big brain got eighteen of twenty.",
         "మీ బిల్లుల్లో, [1] పెద్ద బ్రెయిన్ కి ఇరవై లో పద్దెనిమిది."),
    13: ("ravi", "wide", "post", "Super! [1] I'll post my test online, for every shop!", "సూపర్! [1] నా టెస్ట్ ని ఆన్ లైన్ లో పెడతా, అన్ని షాపులకీ!"),
    14: ("ai", "study", "study", "Then the next brains can study it. | [1] Keep your test to yourself.",
         "అప్పుడు తర్వాతి బ్రెయిన్లు దాన్ని చదివేయొచ్చు. | [1] మీ టెస్ట్ మీ దగ్గరే ఉంచుకోండి."),
    15: ("ravi", "wide", "loop", "A hundred percent? [1] It studied MY paper!", "వంద శాతమా? [1] నా పేపర్ చదివేసింది!"),   # then frame 1 (loops)
}
TTS_EN = {15: "A hundred percent? [1] It studied my paper!"}   # spoken forms (the caps are for the caption)
SHOW = {   # captions with digits; "..." keeps a key number off screen until it is said
    1: "73 in maths, and you got 9 of my 20 bills wrong?!", 3: "Then write it here! 30 questions!",
    4: "18 out of 30... 60%.", 5: "Not 73?!", 6: "73 was my full-size brain, on my maker's test. You run me squeezed, on yours.", 7: "Even that 60 could be copied! That paper's online!",
    9: "67%... No drop: no sign of copying.", 11: "Yours. Give each brain your 20 bills, with the right totals written down.",
    12: "On your bills, the big brain got 18 of 20.", 15: "100%? It studied MY paper!",
}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "73 in maths, and 9 of my 20 bills wrong?!", 2: "That's the famous maths exam. The same paper for every brain.",
    3: "Then write it right here! 30 sums!", 4: "18 out of 30... 60%.", 5: "Not 73?!",
    6: "73 is my full-size brain, my company's test. With you: the compressed brain, your test.",
    7: "Maybe even that 60 is copied! That paper is online!", 8: "Yes, that happens. So: the same sums, new names, new numbers.",
    9: "67%... It didn't drop. No sign of copying.", 10: "Then which number do I trust?!",
    11: "Trust your own number. Give every brain your 20 bills, with the right totals written down.",
    12: "In your bills, the big brain got 18 of 20.", 13: "Super! I'll put my test online, for all the shops!",
    14: "Then the next brains may study it. Keep your test to yourself.", 15: "100%? It studied MY paper!",
}
NOCAP = {11}   # the rule chip carries its words (creative 05: chip + subtitle + tag = three text blocks)
PAUSES = {}
TEMPO_EN = {"ravi": 1.15, "ai": 1.1}
TEMPO_TE = {"ravi": 1.15, "ai": 1.1}
TEMPO_LINE_TE = {7: 1.05, 11: 1.05, 13: 1.05}   # render review: "ఆన్లైన్" smeared at 1.15; "మీ నంబరే నమ్మండి" blurred at 1.1
# Sound (CLAUDE.md arc): a hit, the error buzz and a red-pen scratch on frame 1; a bell as the exam paper lands; the
# quiz's tick-tock 3-2-1 with a riser, the bed out on the 1, "Eighteen out of thirty" out of silence, a hit after it; a
# whoosh into each insert; a stamp on "online"; a ding on the copy check's swap; a success sting on "No copying"; a snap
# on the rule; a cha-ching on the bill card; a riser under the post flying off, the bed out before the last line, the
# biggest hit on the 100% chart, and the slam back to frame 1 (the loop). The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.25, "drop_pre": [[3, 0.0, 1.3]], "tail": 0.1}),   # render review: a real dead stop (1.1 s) after the count, before the answer
          ("s_b", (6, 7, 8, 9), {"lift": 0.8, "pre": 0.35, "boost": 1.35, "tail": 0.1}),
          ("s_c", (10, 11, 12, 13, 14, 15), {"lift": 0.9, "pre": 0.35, "outro": True, "boost": 1.8,   # render review: Q4 never built (1.6 still flat in English; the voice sat 9.6 dB over the bed)
                                             "drop_pre": [[5, -2.6, 3.5]], "tail": 0.0})]   # the bed out from 0.9 s before "A hundred percent?" through the line ("my paper" read "by paper" when it came back mid-line)
GAP = {1: 0.15, 2: 0.2, 3: 3.4, 4: 0.45, 6: 0.3, 8: 0.15, 9: 0.35, 11: 0.4, 12: 0.45, 13: 0.2, 14: 0.75}   # 3: the quiz holds 3.4 s: its 3-2-1, then 1.1 s of silence (render review: the card was up 2.2 s); 14: a real pause before the last line
GAP_TE = {4: 0.35, 6: 0.2, 9: 0.25, 11: 0.25, 12: 0.2, 13: 0.12, 14: 0.35}   # the Telugu re-voices ran 61.5 s: shorter holds, the quiz kept
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "tail": 0.3}}   # render review 2: at 1.6 the Telugu rule line lost "ఇరవై" and "ఇవ్వండి" under the bed
YT = {"s_a": "73 in maths, 9 wrong bills", "s_b": "Did it copy the exam?", "s_c": "Your own test"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep40te" if te else "ep40v1"
    s = {"id": sid, "title": "73 in maths (EP40: benchmarks and evaluations)" + (" (Telugu audio)" if te else ""), "label": "EP40",
         "banner": "AI benchmarks", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
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
        scenes.append({"id": scid, "type": "sk_bench", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
