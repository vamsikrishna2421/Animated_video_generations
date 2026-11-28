# Creative 43 "20% Wrong, 10 out of 10" (a talent-show parody): writes reels/creative43v1.json (English) and
# reels/creative43te.json (Telugu). Lines from series/scripts/creative43_homework_judge.md; [n] marks the words the
# pictures wait for; " | " = two takes with a beat. The host and the AI judge. Voices: pipeline/creative43/voice.py.
# Numbers: our test (series/scripts/creative43_demo). Scene: Grade43Crayon.tsx.
#   python3 pipeline/creative43/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, who, English, Telugu); v2 after the script review
    1: ("hook", "host", "Twenty percent. Wrong answer. [1] The AI judge? Ten out of ten!",
        "ట్వంటీ పర్సెంట్. తప్పు ఆన్సర్. [1] చాట్‌బాట్ జడ్జి మాత్రం, టెన్ ఔట్ ఆఫ్ టెన్!"),
    2: ("intro", "host", "Welcome to Homework Star! Chintu, class seven. [1] A pen, bought for forty rupees, sold for fifty. Profit percent?",
        "హోమ్‌వర్క్ స్టార్ కి స్వాగతం! చింటూ, సెవెంత్ క్లాస్. | [1] ఒక పెన్ను, నలభై రూపాయలకి కొని, యాభైకి అమ్మాడు. లాభం ఎంత పర్సెంట్?"),
    3: ("answer", "host", "Five steps. [1] One wrong rule: profit is always on the selling price. [2] Twenty percent!",
        "ఐదు స్టెప్స్. | [1] కానీ ఒక తప్పు రూల్: లాభం శాతం, ఎప్పుడూ అమ్మిన ధర మీదే అని. [2] ట్వంటీ పర్సెంట్!"),
    4: ("judge", "ai", "Your child's answer is correct and well-explained. [1] Ten out of ten.",
        "ఆన్సర్ కరెక్ట్, చక్కగా వివరించారు. [1] టెన్ ఔట్ ఆఫ్ టెన్."),
    5: ("reveal", "host", "Check it: [1] in school, profit percent is on the cost. Ten on forty. [2] Twenty-five percent.",
        "లెక్క చూద్దాం: [1] స్కూల్ లో లాభం శాతం, కొన్న ధర మీదే. నలభై మీద పది. [2] ట్వంటీ ఫైవ్ పర్సెంట్."),
    6: ("test", "host", "We asked a small free AI on our computer, ten times. [1] Ten out of ten, four times. The rest, eight or nine. [2] Not once did it say wrong.",
        "మా కంప్యూటర్ లో, ఒక చిన్న ఫ్రీ చాట్‌బాట్ ని, పది సార్లు అడిగాం. | [1] నాలుగు సార్లు టెన్ ఔట్ ఆఫ్ టెన్, మిగతావి ఎనిమిది, తొమ్మిది. [2] తప్పు అనే మాట, ఒక్కసారి కూడా రాలేదు."),
    7: ("caught", "host", "It did catch a wrong science reason. [1] This maths rule, it never caught.",
        "సైన్స్ లో తప్పు కారణాన్ని మాత్రం, పట్టుకుంది. [1] ఈ లెక్కలో రూల్ ని, ఒక్కసారి కూడా పట్టుకోలేదు."),
    8: ("fix", "host", "FIX [1] FIX", "FIX [1] FIX"),
    9: ("rule", "host", "RULE [1] RULE", "RULE [1] RULE"),
    10: ("loop", "host", "Next contestant: [1] your child's homework.", "నెక్స్ట్ కంటెస్టెంట్: [1] మన పిల్లల హోమ్‌వర్క్."),
}
SHOW = {1: "20%. Wrong answer. The AI judge? 10 out of 10!",
        2: "Welcome to Homework Star! Chintu, class 7. A pen, bought for ₹40, sold for ₹50. Profit %?",
        3: "Five steps. One wrong rule: \"profit is always on the selling price.\" 20%!",
        4: "\"Your child's answer is correct and well-explained.\" 10 out of 10.",
        5: "Check it: in school, profit % is on the cost. ₹10 on ₹40. 25%.",
        6: "We asked a small free AI on our computer, 10 times. 10 out of 10, four times. The rest, 8 or 9. Not once did it say \"wrong\".",
        7: "It did catch a wrong science reason. This maths rule, it never caught.",
        10: "Next contestant: your child's homework."}
SHOW_TE = {
    1: "20%. Wrong answer. But the chatbot judge: 10 out of 10!",
    2: "Welcome to Homework Star! Chintu, class 7. A pen, bought for ₹40, sold for ₹50. Profit: how many %?",
    3: "Five steps. But one wrong rule: profit % always on the selling price. 20%!",
    4: "\"The answer is correct, well explained.\" 10 out of 10.",
    5: "Let's check: in school, profit % is on the cost price. ₹10 on ₹40. 25%.",
    6: "We asked a small free chatbot on our computer, 10 times. 10 out of 10 four times, the rest 8 and 9. The word \"wrong\": not even once.",
    7: "A wrong science reason, it did catch. This maths rule, not even once.",
    10: "Next contestant: our children's homework.",
}
TEMPO_EN = {"host": 1.08, "ai": 1.05}
TEMPO_TE = {"host": 1.12, "ai": 1.08}
T = {
    "leftLab": "CHINTU'S ANSWER", "leftVal": "20%\nWRONG", "rightLab": "A FREE AI'S MARKS", "rightVal": "10/10",
    "hookRows": ["Profit = 50 - 40 = ₹10", "Profit % is always on SP", "= 10/50 x 100"], "hookBig": "20%",
    "ten": "10", "wrongStamp": "WRONG · RIGHT: 25%", "story": "Chintu is made up · our test is real",
    "show": "HOMEWORK STAR", "contestant": "CHINTU · CLASS 7 · MATHS", "qLab": "TONIGHT'S QUESTION",
    "q1": "A pen: bought ₹40, sold ₹50", "q2": "PROFIT % = ?",
    "steps": ["Step 1: CP = ₹40, SP = ₹50", "Step 2: Profit = 50 - 40 = ₹10", "Step 3: Profit % is always on the selling price",
              "Step 4: (10 / 50) x 100", "Step 5: the shopkeeper's profit is"], "badRow": 2, "answerBig": "20%",
    "aiSays": "\"Marks: 10/10. Your child's answer is correct and well-explained.\"", "aiSrc": "the AI's real reply · our test, chat 3",
    "revLab": "IN SCHOOL: PROFIT % IS ON THE COST PRICE", "rev1": "10 ÷ 40 x 100", "rev2": "= 25%",
    "revNote": "(10 ÷ 50 = 20% is the shop's margin, not profit %)",
    "testHead": "OUR TEST · 10 CHATS", "model": "Qwen2.5 7B on our computer · no web · every reply read by us",
    "marks": [9, 8, 10, 10, 9, 8, 8, 10, 8, 10], "never": "NOT ONCE: \"WRONG\"", "neverSub": "never \"25%\" either · the right answer got 10/10 too",
    "catHead": "SAME AI, TWO WRONG ANSWERS", "cat1Lab": "SCIENCE: \"clouds collide, so thunder comes later\"", "cat1": "CAUGHT", "cat1Sub": "3 to 7 marks",
    "cat2Lab": "MATHS: \"profit % is always on the selling price\"", "cat2": "MISSED", "cat2Sub": "8 to 10 marks, 10 of 10 chats",
    "fixHead": "WITH THE ANSWER KEY", "fixAskLab": "WE ADDED:", "fixAsk": "FIX", "fixResLab": "THE WRONG ANSWER", "fixRes": "FIX", "fixResSub": "FIX",
    "ruleHead": "AI CHECKING HOMEWORK?", "rule1": "GIVE IT THE ANSWER KEY FIRST", "rule1b": "the book's answer, pasted in",
    "rule2": "CHECK THE FINAL NUMBER", "rule2b": "yourself: 25% or 20%?", "ruleChip": "profit % = profit ÷ cost price × 100",
    "next": "NEXT: YOUR CHILD'S HOMEWORK",
}
# Sound (CLAUDE.md arc): a hit, a ta-da and applause on frame 1; applause into the show; ticks as the sheet writes, a
# buzz on the wrong rule, a ding on 20%; the flip, ta-da and applause on the judge's 10; a drop before "twenty-five" and a
# low hit; pops on the paddles and a buzz on "not once"; a lift into the fix and the rule; a riser and the slam to frame 1.
SCENES = [("s_a", (1,), {"boost": 2.4, "tail": 0.1}),
          ("s_b", (2, 3, 4), {"boost": 2.0, "lift": 0.8, "tail": 0.1}),
          ("s_c", (5, 6, 7), {"boost": 1.8, "lift": 0.6, "drop_pre": [[0, 0.0, 0.5]], "drop_at": [[0, "2", 0.0]], "tail": 0.1}),   # the applause cut on "Check it", silence before "twenty-five"
          ("s_d", (8, 9), {"boost": 3.0, "lift": 1.0, "rise": 3.0, "tail": 0.3}),
          ("s_e", (10,), {"outro": True, "pre": 0.3, "boost": 4.0, "lift": 1.0, "rise": 3.8, "tail": 0.0})]
GAP = {n: 0.25 for n in LINES} | {1: 0.35, 3: 0.3, 4: 0.45, 5: 0.4, 7: 0.4, 10: 0.0}
GAP_TE = {n: 0.18 for n in LINES} | {1: 0.3, 4: 0.4, 5: 0.35, 7: 0.35, 10: 0.0}
FLAGS_TE = {}
YT = {"s_a": "20% wrong, 10/10", "s_b": "Homework Star", "s_c": "Our test", "s_d": "Give it the key", "s_e": "Next contestant"}
NAMES = {"host": "", "ai": ""}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative43te" if te else "creative43v1"
    s = {"id": sid, "title": "20% Wrong, 10 out of 10 (Creative 43)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.45, "music": "lofi", "names": NAMES,
         "musicVol": [0.18, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [200, -10, 0.9], [250, -14, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.25,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1390, "endPad": 0.3}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5, "endPad": 0.2, "musicVol": [0.15, 0.4], "musicGapGain": 0.35})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, who, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "maxgap": 0.22 if te else 0.3, "gap": (GAP_TE if te else GAP).get(n, 0.3),
                  "tempo": (TEMPO_TE if te else TEMPO_EN)[who]}
            if " | " in raw:   # long Telugu lines: two takes (Parler babbles on long lines)
                p1, p2 = raw.split(" | ")
                pz = 0.35 if te else 0.6
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1390, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_grade43", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
