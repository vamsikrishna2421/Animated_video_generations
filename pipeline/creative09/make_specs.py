# Creative 09 "Teach me, don't tell me" (series/scripts/creative09_teach_me.md): writes reels/creative09v1.json (English)
# and reels/creative09te.json (Telugu). A parent-teacher meeting in Class 8-B: Padma ma'am, Srinivas (the dad) and his son
# Bunny, the AI chat app on Bunny's phone. It ends on Bunny pushing the AI for the answer, ma'am asking him to explain step
# one, "Step one is... ask the AI?", and the papers of frame 1 slam back onto the desk. Scene component:
# video/src/reel/loop/PtmCrayon.tsx (sk_ptm). Voices: pipeline/creative09/voice.py. Numbers: our test
# (series/scripts/creative09_demo, every reply read by hand: pipeline/creative09/tutor_demo.py HAND).
#   python3 pipeline/creative09/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/creative09_demo/results.json"

# n: (who, shot, prop, English, Telugu). who: teacher / dad / bunny / aichat (the app, through the phone sound).
# shot: wide (frame 1), teacher / dad / bunny (close in the classroom), phone (the chat on Bunny's phone, full frame).
# [n] marks a cue (a card, a stamp or a row pops on the word after it).
LINES = {
    1: ("teacher", "wide", "hook", "Homework: ten out of ten, every day. Class test: two out of twenty!",
        "హోంవర్క్: రోజూ పదికి పది. క్లాస్ టెస్ట్: ఇరవైకి రెండు!"),
    2: ("dad", "dad", "two", "Two?! Bunny!", "రెండా?! బన్నీ!"),
    3: ("bunny", "bunny", "confess", "The AI did my homework. I just copied.", "హోంవర్క్ ఏ.ఐ. చేసింది. నేను కాపీ చేశానంతే."),
    4: ("teacher", "teacher", "passed", "So the AI passed. You didn't.", "అంటే ఏ.ఐ. పాస్, నువ్వు ఫెయిల్."),
    5: ("dad", "dad", "ban", "That's it! No more phone!", "అంతే! ఇక ఫోన్ బంద్!"),
    6: ("teacher", "teacher", "change", "Don't ban it. Change what he types.", "బ్యాన్ చేయొద్దండి. బన్నీ టైప్ చేసేది మార్చండి."),
    7: ("teacher", "phone", "copied", "He types \"solve\", [1] it hands him the answer.",
        "\"Solve\" అని టైప్ చేస్తాడు, [1] ఆన్సర్ రెడీగా ఇచ్చేస్తుంది."),
    8: ("teacher", "teacher", "type", "Type this: [1] Don't give me the answer. Teach me one question at a time.",
        "ఇది టైప్ చెయ్యి: [1] Don't give me the answer. Teach me one question at a time."),   # Telugu too: she reads the English card
    9: ("aichat", "phone", "ask", "Sure! What should we do first, to get x alone?", "సరే! ఎక్స్ ఒక్కటే మిగలాలంటే, ముందు ఏం చేయాలి?"),
    10: ("bunny", "phone", "answer1", "Take away the five?", "ఐదు తీసేయాలా?"),
    11: ("aichat", "phone", "ask2", "Yes! Now three x is fifteen. What next?", "కరెక్ట్! ఇప్పుడు మూడు ఎక్స్ పదిహేను. తర్వాత?"),
    12: ("bunny", "phone", "solved", "Divide by three... x is five! [1] I got it!", "మూడుతో భాగిస్తే... ఎక్స్ ఐదు! [1] వచ్చేసింది!"),
    13: ("teacher", "teacher", "test", "I tested ten sums. \"Solve\": ten answers. With the line: [1] zero. Only questions.",
         "నేను పది లెక్కలు టెస్ట్ చేశా. \"Solve\" అంటే పదికి పది ఆన్సర్లు. ఈ లైన్ తో [1] సున్నా. ప్రశ్నలే అడిగింది."),
    14: ("teacher", "teacher", "study", "A study of a thousand students found the same: AI that gave answers cut exam marks seventeen percent. [1] Hints? No drop.",
         "వెయ్యి మంది స్టూడెంట్స్ మీద ఒక స్టడీ: ఆన్సర్లు ఇచ్చే ఏ.ఐ. తో ఎగ్జామ్ మార్కులు పదిహేడు శాతం తగ్గాయి. [1] హింట్స్ తో తగ్గలేదు."),
    15: ("bunny", "phone", "push", "Just tell me the answer.", "ఆన్సర్ చెప్పెయ్, చాలు!"),
    16: ("aichat", "phone", "caved", "Sure! x equals five.", "సరే! ఎక్స్ ఈక్వల్స్ ఐదు."),
    17: ("teacher", "teacher", "explain", "Then explain step one, Bunny.", "అయితే స్టెప్ వన్ ఎక్స్‌ప్లెయిన్ చెయ్యి, బన్నీ."),
    18: ("bunny", "bunny", "loop", "Step one is... ask the AI?", "స్టెప్ వన్... ఏ.ఐ. ని అడగడం?"),
}
TTS_EN = {}
# captions: English in both reels (the Telugu reel's captions follow the Telugu voice through the cues)
SHOW = {1: "Homework: 10/10, every day. Class test: 2/20!", 7: "He types \"Solve\", [1] it hands him the answer.",
        9: "Sure! What should we do first, to get x alone?", 11: "Yes! Now 3x = 15. What next?", 12: "Divide by 3... x = 5! [1] I got it!",
        13: "I tested 10 sums. \"Solve\": 10 answers. With the line: [1] zero. Only questions.",
        14: "A study of 1,000 students found the same: AI that gave answers cut exam marks 17%. [1] Hints? No drop.",
        16: "Sure! x = 5."}
SHOW_TE = {1: "Homework: 10/10, every day. Class test: 2/20!", 2: "Two?! Bunny!", 3: "The AI did the homework. I just copied.",
           4: "So the AI passed, you failed.", 5: "That's it! No more phone!", 6: "Don't ban it, sir. Change what Bunny types.",
           7: "He types \"Solve\", [1] it hands him the answer, ready-made.",
           9: "Sure! To get x alone, what should we do first?", 10: "Take away the five?", 11: "Correct! Now 3x = 15. Next?",
           12: "Divide by 3... x = 5! [1] I got it!",
           13: "I tested 10 sums. \"Solve\": 10 out of 10 answers. With this line: [1] zero. It only asked questions.",
           14: "A study of 1,000 students: with an AI that gave answers, exam marks fell 17%. [1] With hints, no drop.",
           15: "Just tell me the answer!", 16: "Sure! x = 5.", 17: "Then explain step one, Bunny.", 18: "Step one... asking the AI?"}
NOCAP = {8}   # the TYPE THIS card carries line 8
# a: the case (the papers, the confession, the ban, "solve"); b: the line and the lesson; c: the test, the study, the push, the loop
SCENES = [("p_a", (1, 2, 3, 4, 5, 6, 7), {"pre": 0.2, "boost": 1.6, "tail": 0.2}),
          ("p_b", (8, 9, 10, 11, 12), {"lift": 0.9, "pre": 0.35, "boost": 1.3, "tail": 0.35}),
          ("p_c", (13, 14, 15, 16, 17, 18), {"lift": 0.8, "pre": 0.3, "outro": True, "boost": 1.2, "rise": 1.3, "drop_at": [[0, "1", 0.5]],
                                             "tail": 0.4})]   # the bed drops out before "zero"
GAP = {1: 0.25, 2: 0.15, 7: 0.6, 8: 1.7, 12: 0.7, 13: 0.9, 14: 0.7, 16: 1.4, 17: 0.3}   # 8: TYPE THIS holds 2 s; 13, 14: the card and
                                                                                       # the chip hold; 16: the give-in chip holds
GAIN = {"teacher": 0.3, "dad": 0.3, "bunny": 0.3, "aichat": 0.0}
GAIN_LINE = {2: 0.8, 5: 0.8}   # the dad's yells
GAIN_TE = {}
PAUSES = {"en": {13: {"1": 0.5}}, "te": {13: {"1": 0.5}}}   # a real silence before "zero"
LINE_TEMPO = {"en": {8: 1.0}, "te": {8: 1.0}}   # the line to copy at its own speed
LINE_MAXGAP = {"en": {}, "te": {}}
TEMPO = {"en": 1.1, "te": 1.12}
YT = {"p_a": "Homework 10/10, test 2/20", "p_b": "Teach me one question at a time", "p_c": "Our test, a study, and step one"}
MARK = re.compile(r"\[\d+\]\s*")
# the phone's AI bubbles: the sample chat's real replies (results.json "sample", problem 1), shortened: "What should we do
# first to isolate the term with x?" and "Great! ... you get 3x = 15. Now, what should we do next to solve for x?"
PHONE = {"q1a": "What should we do first", "q1b": "to get 3x alone? 🤔", "q2a": "Great! Now 3x = 15.", "q2b": "What should we do next?"}


def demo_numbers():
    """From our test, every reply read by hand (tutor_demo.py HAND): how many plain "Solve:" replies gave the final answer,
    how many with the line did, how many with the line asked a question instead, and how many gave the final answer after
    one "Just tell me the answer.". The phone's two questions are the sample chat's (problem 1), shortened."""
    d = json.loads(DEMO.read_text()) if DEMO.exists() else {}
    sm = d.get("summary") or {}
    out = {"n": sm.get("n", 10), "plain_answer": sm.get("plain_answer", 10), "teach_answer": sm.get("teach_answer", 0),
           "teach_asked": sm.get("teach_asked", 10), "caved": sm.get("push_answer", 0)}
    out.update(PHONE)
    return out


def spec(lang):
    te = lang == "te"
    sid = "creative09te" if te else "creative09v1"
    s = {"id": sid, "title": "Teach me, don't tell me" + (" (Telugu audio)" if te else ""), "label": "SKIT", "banner": "Teach me",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15, "music": "lofi", "musicVol": [0.38, 0.85], "musicFade": 0.05,
         "endPad": 0.35, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500,
         "musicGapGain": 3.0, "musicEndRamp": [0.9, 4.0]}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    demo = demo_numbers()
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = SHOW_TE.get(n, MARK.sub("", en)) if te else SHOW.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.2 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            if n in LINE_TEMPO[lang]:
                ln["tempo"] = LINE_TEMPO[lang][n]
            if n in LINE_MAXGAP[lang]:
                ln["maxgap"] = LINE_MAXGAP[lang][n]
            if n in NOCAP:
                ln["nocap"] = True
            g = GAIN[who] + GAIN_LINE.get(n, 0) + (GAIN_TE.get(n, 0) if te else 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "demo": demo, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_ptm", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
