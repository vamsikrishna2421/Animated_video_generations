# Creative 16 "Happy Dad 60th Bir" (a family cake reveal: the AI's cake message didn't fit): writes reels/creative16v1.json
# (English) and reels/creative16te.json (Telugu). Lines come from the script (series/scripts/creative16_cake.md); [n] marks
# the words the pictures wait for; " | " splits a line into two takes. Voices: pipeline/creative16/voice.py. Numbers: our
# test (series/scripts/creative16_demo).
#   python3 pipeline/creative16/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: "cake" (the party around the cake), "phone" (his AI chat),
# "chunks" (what the AI sees), "test" (our test card), "rule" (the rule card). prop: what the line brings on (CakeCrayon.tsx).
LINES = {
    1: ("bindu", "cake", "hook", "Happy Dad sixtieth Bir... [1] BIR?!", "హ్యాపీ డాడ్ సిక్స్టీయత్ బర్... [1] బర్?!"),
    2: ("harish", "phone", "told", "I told the AI: fifteen letters! [1] It gave me this!", "పదిహేను అక్షరాలే కావాలని చాట్ బాట్ కి చెప్పా! [1] ఇది ఇచ్చింది!"),   # script review: it never said 15; he told it 15
    3: ("thathayya", "cake", "bir", "Sixty years old, [1] and I'm a Bir.", "అరవై ఏళ్ళకి, [1] బర్ అయిపోయానా?"),
    4: ("bindu", "cake", "counted", "Mama, it's twenty-one! [1] I counted!", "మామా, అవి ఇరవై ఒక్కటి! [1] నేను లెక్కపెట్టా!"),   # 21 characters (18 letters, two digits, a "!")
    5: ("harish", "cake", "better", "But the AI counts better than me!", "నాకంటే చాట్ బాట్ బాగా లెక్కపెడుతుంది కదా!"),
    6: ("bindu", "chunks", "chunks", "It doesn't see letters. [1] To it, I-R-T-H is one sticker.", "అది పదాల్ని ముక్కలుగా చూస్తుంది, అక్షరాలుగా కాదు. [1] దానికి ఇర్త్ ఒకే స్టిక్కర్."),   # script review: one concrete picture
    7: ("bindu", "test", "test", "I asked a small free AI for a fifteen-letter message, ten times. | [1] Zero fit.",
        "ఒక చిన్న ఫ్రీ చాట్ బాట్ ని పది సార్లు అడిగా, పదిహేను అక్షరాల మెసేజ్ ఇవ్వమని. | [1] ఒక్కటి కూడా పట్టలేదు."),
    8: ("harish", "test", "count", "Then I'll make it count them!", "అయితే లెక్కపెట్టమని చెప్తా!"),
    9: ("bindu", "test", "count2", "Tried that: it said fourteen or fifteen. | [1] It's twenty-two. And it spelled birth-ar-day!",
        "అదీ చేశా: పద్నాలుగు, పదిహేను అంది. | [1] అసలు లెక్క ఇరవై రెండు. బర్తార్డే అని స్పెల్లింగ్ కూడా రాసింది!"),   # script review: 6 of 10 said 15, 4 said 14; three tests in a row dragged: two beats
    10: ("thathayya", "rule", "rule", "Ask the AI for the words. | [1] Count the letters yourself.", "మాటలు చాట్ బాట్ ని అడుగు. | [1] అక్షరాలు నువ్వే లెక్కపెట్టు."),
    11: ("thathayya", "cake", "loop", "Now, cut the cake! [1] Bindu, read it again!", "సరే, కేక్ కట్ చేద్దాం. [1] బిందూ, ఇంకోసారి చదువు!"),   # then frame 1 (loops): script review: no repeated reading before the cut
}
TTS_EN = {1: "Happy Dad sixtieth Burr... [1] burr?!", 3: "Sixty years old, [1] and I'm a Burr."}   # "Bir" was heard "Bill", "beer"; render review: "BIR?!" as one word in both lines
SHOW = {1: "Happy Dad 60th Bir... BIR?!", 2: "I told the AI: 15 letters! It gave me this!", 4: "Mama, it's 21! I counted!",
        6: "It doesn't see letters. To it, IRTH is one sticker.",
        7: "I asked a small free AI for a 15-letter message, 10 times. <pause 0.3> Zero fit.",
        9: "Tried that: it said 14 or 15. <pause 0.3> It's 22. And it spelled BIRTHARDAY!"}
SHOW_TE = {
    1: "Happy Dad 60th Bir... BIR?!", 2: "I told the chatbot: only 15 letters! It gave this!", 3: "At sixty, I became a Bir?",
    4: "Mama, that's 21! I counted!", 5: "The chatbot counts better than me, no?",
    6: "It sees words in pieces, not letters. To it, IRTH is one sticker.",
    7: "I asked a small free chatbot 10 times for a 15-letter message. <pause 0.3> Not one fit.", 8: "Then I'll tell it to count!",
    9: "Did that: it said 14, 15. <pause 0.3> The real count is 22. It even spelled BIRTHARDAY!",
    10: "Ask the chatbot for the words. <pause 0.3> Count the letters yourself.", 11: "OK, let's cut the cake. Bindu, read it once more!",
}
NOCAP = set()
PAUSES = {}
SPLIT_PAUSE = {7: 0.8, 9: 0.6}   # the stop before "Zero fit" and before the real count
TEMPO_EN = {"thathayya": 1.05, "harish": 1.1, "bindu": 1.1}
TEMPO_TE = {"thathayya": 1.0, "harish": 1.0, "bindu": 1.0}   # Telugu speed-ups swallowed words (EP42, Creative 14, 15)
TEMPO_LINE_EN = {}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): party claps and a horn under frame 1, a hit on "BIR?!"; a ding on the phone; finger ticks on
# "I counted"; pops as the chunks land; the bed out before "Zero fit" and a thud on it; a buzz on "birth-ar-day"; a boom
# and clap on the rule; claps building into the last line; the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (6, 7, 8, 9), {"boost": 1.25, "drop_at": [[1, 1]], "tail": 0.0}),   # the bed out before "Zero fit"
          ("s_c", (10, 11), {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.55, "rise": 1.3, "tail": 0.0})]
GAP = {1: 0.3, 2: 0.25, 3: 0.3, 4: 0.3, 5: 0.3, 6: 0.5, 7: 0.5, 8: 0.25, 9: 0.6, 10: 1.8, 11: 0.2}   # 10: the rule card holds
GAP_TE = {10: 1.2}
FLAGS_TE = {"s_c": {"boost": 1.35, "rise": 1.15}}
YT = {"s_a": "Happy Dad 60th Bir", "s_b": "Our test", "s_c": "Count it yourself"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative16te" if te else "creative16v1"
    s = {"id": sid, "title": "Happy Dad 60th Bir (Creative 16: AI can't count letters)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI and letter counts", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.66], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[260, -8, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 1.2, "musicEndRamp": [0.85, 6.0],
         "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
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
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.3)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            ln["gain_db"] = 0.5
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            flags = {**flags, **FLAGS_TE.get(scid, {})}
        scenes.append({"id": scid, "type": "sk_cake", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
