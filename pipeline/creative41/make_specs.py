# Creative 41 "Asked for 150 Words" (a one-question challenge): writes reels/creative41v1.json (English) and
# reels/creative41te.json (Telugu). Lines from series/scripts/creative41_150_words.md (v2 after the script review); [n]
# marks the words the pictures wait for; " | " = two takes with a beat. One narrator. Voices: pipeline/creative41/voice.py.
# Numbers: our test (series/scripts/creative41_demo). Scene: Words41Crayon.tsx.
#   python3 pipeline/creative41/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "Asked for a hundred and fifty words. [1] A free AI wrote a hundred and two.",
        "నూట యాభై వర్డ్స్ అడిగాం. [1] ఒక ఫ్రీ చాట్‌బాట్ రాసింది, నూట రెండు."),
    2: ("tries", "One small model on our laptop, ten tries: [1] a hundred and two to a hundred and twenty-eight. Short, every time.",
        "మా లాప్‌టాప్ లోని చిన్న మోడల్, పది సార్లు: [1] నూట రెండు నుంచి, నూట ఇరవై ఎనిమిది. ప్రతిసారీ, తక్కువే."),
    3: ("count", "Told to count its words: [1] two of ten landed within fifteen.",
        "వర్డ్స్ లెక్కపెట్టమని చెప్పాం: [1] పదిలో రెండు మాత్రమే, దగ్గరికి వచ్చాయి."),
    4: ("question", "You'd just tell it the real count, right? We did. | [1] Spot on? Still short? Or...",
        "అసలు లెక్క చెబితే సరిపోతుంది కదా? చెప్పాం. | [1] సరిగ్గా వచ్చిందా? ఇంకా తక్కువా? లేక..."),
    5: ("reveal", "[1] A hundred and eighty-five. [2] Once, two hundred and thirty-four. Nine of ten went over.",
        "[1] నూట ఎనభై ఐదు! ముప్పై ఐదు ఎక్కువ. [2] ఒకసారి, రెండొందల ముప్పై నాలుగు. తక్కువైందన్నామని, ఏకంగా ఎక్కువ రాసేసింది!"),
    6: ("why", "It writes in tokens, not words: those hundred and two words were a hundred and twenty-four tokens. [1] Told it was short, it just guessed long.",
        "ఇది వర్డ్స్ లో కాదు, టోకెన్లలో రాస్తుంది: ఆ నూట రెండు వర్డ్స్, నూట ఇరవై నాలుగు టోకెన్లు. [1] తక్కువ అన్నాం, అందుకే ఊహించి ఎక్కువ రాసింది."),
    7: ("rule", "Any word limit, a form, an essay, a post: [1] paste it into Google Docs or Word, check the count, and fix the last lines yourself.",
        "ఫామ్ అయినా, వ్యాసం అయినా, పోస్ట్ అయినా: [1] డాక్స్ లో గానీ, వర్డ్ లో గానీ పేస్ట్ చేసి, వర్డ్స్ ఎన్నో చూడండి. ఎక్కువైతే చివరి లైన్ తీసేయండి, తక్కువైతే ఒక లైన్ మీరే రాయండి."),
    8: ("loop", "Asked for a hundred and fifty. [1] Got a hundred and two.", "నూట యాభై అడిగాం. [1] వచ్చింది, నూట రెండు."),
}
SHOW = {1: "Asked for 150 words. A free AI wrote 102.", 2: "One small model on our laptop, 10 tries: 102 to 128. Short, every time.",
        3: "Told to count its words: 2 of 10 landed within 15.", 4: "You'd just tell it the real count, right? We did. <pause 0.6> Spot on? Still short? Or...",
        5: "185. Once, 234. 9 of 10 went over.",
        6: "It writes in tokens, not words: those 102 words were 124 tokens. Told it was short, it just guessed long.",
        8: "Asked for 150. Got 102."}
SHOW_TE = {
    1: "We asked for 150 words. A free chatbot wrote 102.",
    2: "A small model on our laptop, 10 times: 102 to 128. Short, every time.",
    3: "We told it to count its words: only 2 of 10 came close.",
    4: "Just tell it the real count, right? We did. <pause 0.6> Spot on? Still short? Or...",
    5: "185! 35 too many. Once, 234. Told it was short, it wrote far too much!",
    6: "It writes in tokens, not words: those 102 words were 124 tokens. We said short, so it guessed long.",
    7: "A form, an essay, a post: paste it into Docs or Word and see how many words. Too many? Cut the last line. Too few? Write a line yourself.",
    8: "We asked for 150. We got 102.",
}
TEMPO_EN = {"storyteller": 1.1}
TEMPO_TE = {"storyteller": 1.2}
ANSWER = ("Water conservation is essential for several reasons. Firstly, water is a finite resource, and its availability is "
          "decreasing due to population growth, climate change, and pollution...")   # the opening of try 1 (102 words)
T = {
    "q": "Why should we save water?", "qLimit": "(150 words)", "answer": ANSWER, "counter": "102 WORDS",
    "leftLab": "ASKED", "leftVal": "150 WORDS", "rightLab": "A FREE AI WROTE", "rightVal": "102",
    "plain": [102, 121, 110, 128, 112, 120, 127, 113, 127, 122], "count": [119, 123, 125, 126, 140, 104, 130, 107, 125, 146],
    "feedback": [185, 167, 181, 162, 234, 174, 197, 173, 205, 183],
    "triesChip": "1 small free model on our laptop · 10 tries · counted by us", "band": "135-165 = within 15",
    "countNote": "\"Count your words and make sure the answer is exactly 150 words.\"",
    "follow": "Your answer has 102 words. I need 150 words. Rewrite it to 150 words.",
    "choices": ["SPOT ON?", "STILL SHORT?", "OR..."],
    "reveal": "185", "reveal2": "234", "overNote": "9 of 10 went over",
    "tokens": ["Water", " conservation", " is", " essential", " for", " several", " reasons", ".", " Firstly", ",", " water", " is", " a", " finite"],
    "tokLine": "12 WORDS = 14 TOKENS", "tokTotal": "THE WHOLE ANSWER: 102 WORDS = 124 TOKENS",
    "tokSrc": "Qwen's own tokenizer · OpenAI: \"1 token is approximately three-quarters of a word\"",
    "guessLong": "TOLD \"SHORT\" → IT GUESSED LONG",
    "rule1": "ANY WORD LIMIT: A FORM · AN ESSAY · A POST", "rule2": "PASTE IT INTO DOCS OR WORD, CHECK THE COUNT",
    "rule3": "Google Docs: Tools > Word count · Word: the status bar", "rule4": "FIX THE LAST LINES YOURSELF",
}
# Sound (CLAUDE.md arc): a tick and a hit in second 1 (150 vs 102); soft pops on the first bars only; a ding on the two
# close ones; three ticks and a silence before the reveal, then a hit on 185 and a bigger one on 234; a whoosh into the
# tokens; a lift into the rule; a riser and the hit back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 2.6, "tail": 0.1}),
          ("s_b", (3, 4), {"boost": 1.4, "lift": 0.6, "tail": 0.1}),
          ("s_c", (5,), {"boost": 2.2, "lift": 0.8, "drop_pre": [[0, 0.6, 0.6]], "tail": 0.15}),   # the silence before the reveal
          ("s_d", (6,), {"boost": 1.4, "lift": 0.6, "tail": 0.1}),
          ("s_e", (7,), {"boost": 3.6, "lift": 1.2, "rise": 3.4, "tail": 0.4}),
          ("s_f", (8,), {"outro": True, "pre": 0.3, "boost": 3.2, "lift": 0.8, "rise": 3.4, "tail": 0.0})]
GAP = {n: 0.2 for n in LINES} | {7: 0.6, 8: 0.0}
GAP_TE = {n: 0.14 for n in LINES} | {7: 0.5, 8: 0.0}
FLAGS_TE = {"s_e": {"boost": 4.0, "rise": 3.8}}
YT = {"s_a": "Asked 150, got 102", "s_b": "Tell it the count?", "s_c": "185, 234", "s_d": "Tokens, not words", "s_e": "Check the count yourself",
      "s_f": "150 vs 102"}
NAMES = {"storyteller": ""}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative41te" if te else "creative41v1"
    s = {"id": sid, "title": "Asked for 150 Words (Creative 41)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.3, "music": "lofi", "names": NAMES,
         "musicVol": [0.16, 0.4], "musicDuckRamp": 9, "musicFade": 0.05, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1390, "endPad": 0.3}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.3, "endPad": 0.2, "musicVol": [0.2, 0.46], "musicGapGain": 1.0})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "maxgap": 0.22 if te else 0.3, "gap": (GAP_TE if te else GAP).get(n, 0.3),
                  "tempo": TEMPO_TE["storyteller"] if te else TEMPO_EN["storyteller"]}
            if " | " in raw:   # the beat before the choices
                p1, p2 = raw.split(" | ")
                pz = 0.6
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": "storyteller", "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1390, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_words41", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
