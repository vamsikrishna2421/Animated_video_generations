# Creative 07 "Ten out of ten" (series/scripts/creative07_flattery.md, script v2): writes reels/creative07v1.json
# (English) and reels/creative07te.json (Telugu). Practice vs the real interview as a split screen; Ramya, her AI coach
# (gushing, then strict), the HR manager, her roommate Divya; it ends on Divya's question and the loop's first line answers
# it. Scene component: video/src/reel/loop/InterviewCrayon.tsx (sk_interview). Voices: pipeline/creative07/voice.py.
# Numbers: our test (series/scripts/creative07_demo): the test card, the strict coach's score (the TYPE THIS prompt's
# average, rounded) and her new answer's score.
#   python3 pipeline/creative07/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/creative07_demo/results.json"

# n: (who, shot, prop, English, Telugu). who: ramya / coach / strict (the coach told to be strict) / hr / divya.
# " | " splits a line into two takes (Telugu 9 and 10: Parler drops a long line's first sentence).
# shot: split (practice above, the real interview below), home (Ramya's room), phone (the coach's chat, full frame).
LINES = {
    1: ("coach", "split", "hook", "Perfect answer! Ten out of ten!", "పర్ఫెక్ట్ ఆన్సర్! పదికి పది!"),
    2: ("hr", "split", "next", "Forty people gave that exact answer today. Next!", "ఈ రోజు నలభై మంది సరిగ్గా ఇదే చెప్పారు. నెక్స్ట్!"),
    3: ("ramya", "home", "five", "Five rejections, and you call it perfect?!", "ఐదు రిజెక్షన్లు, నువ్వేమో పర్ఫెక్ట్ అంటావా?!"),
    4: ("coach", "phone", "amazing", "Believe in yourself!", "బిలీవ్ ఇన్ యువర్ సెల్ఫ్!"),   # v3: a non-answer, shorter
    5: ("ramya", "home", "why", "Why do you praise everything?!", "ప్రతిదానికీ ఎందుకు పొగుడుతావ్?!"),
    6: ("coach", "phone", "thumbs", "People tap thumbs-up when I'm nice.", "నేను మెచ్చుకుంటే జనం లైక్ కొడతారు."),   # the screen adds "so I learned: be nice"
    7: ("ramya", "home", "truth", "Then how do I get the truth?", "మరి నిజం ఎలా తెలుస్తుంది?"),
    8: ("coach", "phone", "strict", "Tell me to be strict.", "స్ట్రిక్ట్ గా ఉండమని చెప్పు."),
    9: ("ramya", "phone", "typing", "Act as a strict but fair interviewer. Rate it out of ten. Weaknesses first.",
        "స్ట్రిక్ట్ కానీ ఫెయిర్ ఇంటర్వ్యూయర్ లా ఉండు. | పదికి మార్కులు ఇవ్వు. ముందు నా లోపాలు చెప్పు."),
    10: ("strict", "phone", "critique", "{N_EN} out of ten. [1] No example. Everyone says hardworking. Nothing about this job.",
         "పదికి {N_TE}. [1] ఒక్క ఎగ్జాంపుల్ కూడా లేదు. | హార్డ్ వర్కింగ్ అని అందరూ అంటారు. ఈ జాబ్ గురించి ఒక్క మాటా లేదు."),
    11: ("ramya", "home", "ouch", "Ouch. But true.", "అబ్బా... కానీ నిజమే."),
    12: ("hr", "split", "again", "Tell me about yourself.", "టెల్ మీ అబౌట్ యువర్ సెల్ఫ్."),   # Telugu too: HR asks in English
    13: ("ramya", "split", "specific", "In my internship, I cut billing errors by half.", "నా ఇంటర్న్‌షిప్‌లో బిల్లింగ్ ఎర్రర్స్ సగానికి తగ్గించాను."),
    14: ("divya", "split", "divya", "AI, how's my answer?", "ఏఐ, నా ఆన్సర్ ఎలా ఉంది?"),   # the end: the loop's line 1 answers her
}
NUM_EN = {1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five"}
NUM_TE = {1: "ఒకటి", 2: "రెండు", 3: "మూడు", 4: "నాలుగు", 5: "ఐదు"}
TTS_EN = {}
SHOW = {1: "Perfect answer! 10 out of 10!", 2: "40 people gave that exact answer today. Next!", 3: "5 rejections, and you call it perfect?!",
        10: "{N} out of 10. No example. Everyone says hardworking. Nothing about this job."}
SHOW_TE = {1: "Perfect answer! 10 out of 10!", 2: "40 people said exactly this today. Next!", 3: "5 rejections, and you say perfect?!",
           4: "Believe in yourself!", 5: "Why do you praise everything?!", 6: "When I praise, people hit like.",
           7: "Then how do I find the truth?", 8: "Tell me to be strict.",
           9: "Be a strict but fair interviewer. Give it marks out of 10. My flaws first.",
           10: "{N} out of 10. Not one example. Everyone says hardworking. Not a word about this job.", 11: "Ouch... but it's true.",
           12: "Tell me about yourself.", 13: "In my internship, I cut billing errors by half.", 14: "AI, how's my answer?"}
NOCAP = {9}   # the TYPE THIS card carries line 9
# a: the hook and the slap; b: why it flatters, the fix; c: the second interview and the loop
SCENES = [("i_a", (1, 2, 3), {"pre": 0.25, "boost": 1.7, "tail": 0.1}),
          ("i_b", (4, 5, 6, 7, 8, 9, 10, 11), {"lift": 0.7, "pre": 0.35, "boost": 1.45, "drop_pre": [[6, 0.0, 0.6]],
                                                "drop_at": [[6, "1", 0.3]], "tail": 0.15}),   # silence into the score, a beat after it
          ("i_c", (12, 13, 14), {"lift": 0.8, "pre": 0.35, "outro": True, "boost": 1.5, "rise": 1.3, "drop_pre": [[1, 0.0, 0.5]],
                                 "tail": 0.0})]   # a hush before her real answer, then the rise into the loop
GAP = {2: 0.35, 9: 0.8, 11: 2.0, 13: 0.6}   # 9: the TYPE THIS card holds; 11: the test card's second number and its note
GAIN = {"ramya": 0.3, "coach": 0.0, "strict": 0.0, "hr": 0.3, "divya": 0.3}
GAIN_LINE = {}
GAIN_TE = {}
PAUSES = {"en": {10: {"1": 0.35}}, "te": {10: {"1": 0.35}}}   # a beat after the score
TEMPO = {"en": 1.08, "te": 1.08}
YT = {"i_a": "Ten out of ten?", "i_b": "Why AI flatters, and the fix", "i_c": "The real interview"}
MARK = re.compile(r"\[\d+\]\s*")


def demo_numbers():
    """From our test, every reply read by hand (flattery_demo.py HAND): the card's two averages as whole numbers (her weak
    answer asked "How is it?" vs the TYPE THIS prompt), her strong answer's average under the same prompt, the strict
    coach's score (the TYPE THIS average, rounded) and how many "How is it?" replies scored only their own rewrite."""
    d = json.loads(DEMO.read_text()) if DEMO.exists() else {}
    sm = {w: d.get(f"summary_{w}") or {} for w in ("plain", "strict", "typed", "good_typed")}
    whole = lambda w: f"{round(sm[w]['mean_score'])}/10" if sm[w].get("mean_score") is not None else "?/10"
    n = round(sm["typed"]["mean_score"]) if sm["typed"].get("mean_score") is not None else 2
    k = sm["plain"].get("rated_only_own_rewrite", 0)
    return {"plain": whole("plain"), "strict": whole("strict"), "typed": whole("typed"), "good": whole("good_typed"),
            "say": f"{n}/10", "n": n, "rewrites": f"{k} other replies scored only their own rewrite" if k else "",
            "note": "Neither said 10/10: our cartoon exaggerates. The gap is real."}


def spec(lang):
    te = lang == "te"
    sid = "creative07te" if te else "creative07v1"
    s = {"id": sid, "title": "Ten out of ten" + (" (Telugu audio)" if te else ""), "label": "SKIT", "banner": "Ten out of ten",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15, "music": "lofi", "musicVol": [0.42, 0.82], "musicFade": 0.05,
         "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500,
         "musicGapGain": 3.0}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    demo = demo_numbers()
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            en, tel = en.replace("{N_EN}", NUM_EN[demo["n"]]), tel.replace("{N_TE}", NUM_TE[demo["n"]])
            show = (SHOW_TE.get(n, MARK.sub("", en)) if te else SHOW.get(n, MARK.sub("", en))).replace("{N}", str(demo["n"]))
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            if n in NOCAP:
                ln["nocap"] = True
            g = GAIN[who] + GAIN_LINE.get(n, 0) + (GAIN_TE.get(n, 0) if te else 0)
            if g:
                ln["gain_db"] = g
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.3> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.3})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "demo": demo, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_interview", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
