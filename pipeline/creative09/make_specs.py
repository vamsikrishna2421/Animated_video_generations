# Creative 09 "Teach me, don't tell me" (series/scripts/creative09_teach_me.md, script v2): writes reels/creative09v1.json
# (English) and reels/creative09te.json (Telugu). A parent-teacher meeting in Class 8-B: Padma ma'am, the dad and his son
# Kittu, the AI chat app on Kittu's phone. It ends on Kittu pushing the AI for the answer on a new sum, ma'am telling the
# dad to ask for step one, not the answer, the dad asking, and "Step one is... ask the AI?"; the replay's first frame (the
# papers slamming down) is the payoff. Scene component:
# video/src/reel/loop/PtmCrayon.tsx (sk_ptm). Voices: pipeline/creative09/voice.py. Numbers: our test
# (series/scripts/creative09_demo, every reply read by hand: pipeline/creative09/tutor_demo.py HAND).
#   python3 pipeline/creative09/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/creative09_demo/results.json"

# n: (who, shot, prop, English, Telugu). who: teacher / dad / kittu / aichat (the app, through the phone sound).
# shot: wide (frame 1), teacher / dad / kittu (close in the classroom), phone (the chat on Kittu's phone, full frame).
# [n] marks a cue (a card, a stamp or a row pops on the word after it).
# v2 (script review): the study backs "don't ban it" (lines 6-7), so the test card stands alone; he pushes on a new sum
# (15% of 240, our test's own reply) and the dad asks for step one: the check is the parent's, the trick isn't magic.
LINES = {
    1: ("teacher", "wide", "hook", "Homework: ten out of ten, every day. Class test: two out of twenty!",
        "హోంవర్క్: రోజూ పదికి పది. క్లాస్ టెస్ట్: ఇరవైకి రెండు!"),
    2: ("dad", "dad", "two", "Two?! Kittu!", "రెండా?! కిట్టూ!"),
    3: ("kittu", "phone", "copied", "The AI did my homework. I just [1] copied.", "హోంవర్క్ ఏఐ చేసింది. నేను [1] కాపీ కొట్టానంతే."),   # "ఏ.ఐ." babbled
                                                                                                       # (the dots stretch the vowel)
    4: ("teacher", "teacher", "passed", "So the AI passed. [1] You didn't.", "అంటే ఏఐ పాస్, [1] నువ్వు ఫెయిల్."),
    5: ("dad", "dad", "ban", "That's it! No more phone!", "అంతే! ఇక ఫోన్ బంద్!"),
    6: ("teacher", "teacher", "study1", "Don't ban it. Kids who got AI answers did [1] seventeen percent worse than kids with no AI.",
        "బంద్ వద్దండి. ఆన్సర్లు కాపీ కొట్టిన పిల్లలకి, ఏఐ లేని పిల్లల కంటే [1] పదిహేడు పర్సెంట్ తక్కువ మార్కులు."),   # the chip: the study;
        # one ఏఐ, before a consonant: "ఏఐ ఆన్సర్లు" ran into "ee-aansarlu" and two ఏఐ in one long line came out "yeh yeh"
    7: ("teacher", "teacher", "study2", "Hints? [1] No drop. So change what he types.", "హింట్స్ తో? [1] తగ్గలేదు. అందుకే, టైప్ చేసేది మార్చండి."),
    8: ("teacher", "teacher", "type", "Type this: [1] Don't give me the answer. Teach me one question at a time.",
        "ఇది టైప్ చెయ్యి: [1] Don't give me the answer. Teach me one question at a time."),   # Telugu too: she reads the English card
    9: ("aichat", "phone", "ask", "Sure! What should we do first?", "సరే! ముందు ఏం చేయాలి?"),   # the bubble has the rest
    10: ("kittu", "phone", "answer1", "Take away the five... three x is fifteen?", "ఫైవ్ తీసేస్తే... త్రీ ఎక్స్ ఫిఫ్టీన్?"),   # he does the step
    11: ("aichat", "phone", "ask2", "Great! What next?", "సూపర్! తర్వాత?"),
    12: ("kittu", "phone", "solved", "Divide by three... x is five! [1] I got it!", "త్రీ తో డివైడ్ చేస్తే... ఎక్స్ ఫైవ్! [1] వచ్చేసింది!"),
    13: ("teacher", "teacher", "test", "I tested ten sums. \"Solve\": ten answers. With the line: [1] zero.",   # the card names the AI
         "నేను పది లెక్కలు టెస్ట్ చేశా. సాల్వ్ అంటే పది ఆన్సర్లు. ఈ లైన్ తో [1] సున్నా."),   # Latin "Solve" was read "salva"
    14: ("kittu", "phone", "push", "Just tell me the answer.", "ఆన్సర్ చెప్పెయ్, చాలు!"),
    15: ("aichat", "phone", "caved", "Fifteen percent of two forty is thirty-six.", "రెండు వందల నలభై లో పదిహేను పర్సెంట్, ముప్పై ఆరు."),
    16: ("teacher", "teacher", "check", "It gives in seven times in ten. So don't check answers, sir. [1] Ask step one.",
         "గట్టిగా అడిగితే, పదిలో ఏడు సార్లు చెప్పేసింది. అందుకే సార్, ఆన్సర్ కాదు, [1] స్టెప్ వన్ అడగండి."),   # "చెప్పేస్తుంది" garbled
    17: ("dad", "dad", "explain", "Kittu. Explain step one.", "కిట్టూ. స్టెప్ వన్ ఎక్స్ప్లెయిన్ చెయ్యి."),
    18: ("kittu", "kittu", "loop", "Step one is... ask the AI?", "స్టెప్ వన్... ఏయ్ ఐ ని అడగడం?"),   # Prakash says "ఏఐ ని" as "ee-ni"
}
TTS_EN = {2: "Two?! Kit-too!", 17: "Kit-too. Explain step one."}   # "Kittu" came out "key two" (a long ee); the hyphen keeps it short
# captions: English in both reels (the Telugu reel's captions follow the Telugu voice through the cues)
SHOW = {1: "Homework: 10/10, every day. Class test: 2/20!",
        6: "Don't ban it. Kids who got AI answers did [1] 17% worse than kids with no AI.",
        10: "Take away the 5... 3x = 15?", 12: "Divide by 3... x = 5! [1] I got it!",
        13: "I tested 10 sums. \"Solve\": 10 answers. With the line: [1] zero.",
        15: "15% of 240 is 36.", 16: "It gives in 7 times in 10. So don't check answers, sir. [1] Ask step one."}
SHOW_TE = {1: "Homework: 10/10, every day. Class test: 2/20!", 2: "Two?! Kittu!", 3: "The AI did the homework. I just [1] copied it.",
           4: "So the AI passed, [1] you failed.", 5: "That's it! No more phone!",
           6: "No ban, sir. Kids who copied the answers got [1] 17% lower marks than kids with no AI.",
           7: "With hints? [1] No drop. So change what he types.",
           9: "Sure! What should we do first?", 10: "Take away five... 3x = 15?", 11: "Super! What next?",
           12: "Divide by 3... x = 5! [1] I got it!",
           13: "I tested 10 sums. \"Solve\": 10 answers. With this line: [1] zero.",
           14: "Just tell me the answer!", 15: "15% of 240: 36.",
           16: "Push it, and it tells 7 times out of 10. So don't ask for the answer, sir: [1] ask for step one.",
           17: "Kittu. Explain step one.", 18: "Step one... asking the AI?"}
NOCAP = {8}   # the TYPE THIS card carries line 8
# a: the case (the papers, the confession, the ban, the study); b: the line, the lesson, our test; c: the push, the check, the loop
SCENES = [("p_a", (1, 2, 3, 4, 5, 6, 7), {"pre": 0.2, "boost": 1.6, "drop_at": [[5, "1", 0.3]], "tail": 0.1}),   # the bed drops out
          ("p_b", (8, 9, 10, 11, 12, 13), {"lift": 0.9, "pre": 0.35, "boost": 1.3, "drop_at": [[5, "1", 0.4]], "tail": 0.15}),   # before
          ("p_c", (14, 15, 16, 17, 18), {"lift": 0.8, "pre": 0.3, "outro": True, "boost": 1.2, "rise": 1.3, "drop_pre": [[4, 0.05, 0.9]],
                                         "tail": 0.2})]   # 17%, before "zero" and before "Step one is..."
GAP = {1: 0.2, 2: 0.15, 3: 0.2, 7: 0.25, 8: 0.85, 12: 0.5, 13: 0.75, 15: 0.85, 16: 0.25, 17: 0.3}   # 8: TYPE THIS holds ~4.5 s; 13: the
                                                                                                   # card holds; 15: the give-in chip
GAIN = {"teacher": 0.3, "dad": 0.3, "kittu": 0.3, "aichat": 0.0}
GAIN_LINE = {2: 0.8, 5: 0.8}   # the dad's yells
GAIN_TE = {}
PAUSES = {"en": {6: {"1": 0.3}, 13: {"1": 0.45}}, "te": {6: {"1": 0.3}, 13: {"1": 0.45}}}   # a beat before 17% and before "zero"
LINE_TEMPO = {"en": {6: 1.18, 8: 1.05, 9: 1.2, 10: 1.2, 11: 1.2, 13: 1.2, 15: 1.2, 16: 1.18}, "te": {8: 1.0}}   # the line to copy near its own speed; the narrator's
                                                                          # AI lines run slow (the first cut ran 70.8 s)
LINE_MAXGAP = {"en": {}, "te": {}}
TEMPO = {"en": 1.15, "te": 1.12}
YT = {"p_a": "Homework 10/10, test 2/20", "p_b": "Teach me one question at a time", "p_c": "It gives in: ask step one"}
MARK = re.compile(r"\[\d+\]\s*")
# the phone's AI bubbles: the sample chat's real replies (results.json "sample", problem 1), shortened: "What should we do
# first to isolate the term with x?" and "Great! ... you get 3x = 15. Now, what should we do next to solve for x?"
PHONE = {"q1a": "What should we do first", "q1b": "to get 3x alone? 🤔", "q2a": "Great! You're on the right track.", "q2b": "What should we do next?"}


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
