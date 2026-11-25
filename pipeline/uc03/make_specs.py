# UC03 "$14.50 a Bag" → "₹14.50 a Bag" (how AI meeting notes work): writes reels/uc03v1.json (English) and
# reels/uc03te.json (Telugu). Lines from series/scripts/uc03_meeting_notes.md (v2 after the script review); [n] marks the
# words the pictures wait for; " | " = two takes with a beat. Voices: pipeline/uc03/voice.py (the Creative 21 standard).
# Numbers: our tests (series/scripts/uc03_demo). Scene: Notes03Crayon.tsx.
#   python3 pipeline/uc03/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu)
LINES = {
    1: ("ravi", "hook", "hook", "Fourteen fifty rupees a bag, I said! [1] The AI notes say fourteen rupees fifty! Forty bags for five hundred and eighty?!",
        "బస్తా పధ్నాలుగు యాభై రూపాయలు, అని చెప్పా! [1] సమ్మరీలో, పధ్నాలుగు రూపాయల యాభై పైసలు! నలభై బస్తాలు, ఐదు వందల ఎనభై రూపాయలా?!"),
    2: ("ai", "steps", "steps", "Notes take three steps: [1] ears turn the call into text, [2] names show who said what, [3] then I write the notes. | [4] The ears wrote fourteen point five oh, and in ten runs, seven notes copied it.",
        "సమ్మరీకి మూడు పనులు: [1] చెవులు, కాల్ ని టెక్స్ట్ గా రాస్తాయి. [2] తర్వాత, ఎవరు ఏమన్నారో పేర్లు పెడతాం. [3] చివరగా, నేను సమ్మరీ రాస్తా. | [4] చెవులు, ఫోర్టీన్ పాయింట్ ఫైవ్ జీరో అని రాశాయి. పది సార్లు చేస్తే, ఏడు సమ్మరీలు అదే రాశాయి."),
    3: ("ravi", "ravi", "sacks", "And who keeps Suresh's empty sacks ready?", "మరి సురేష్ ఖాళీ బస్తాలు, ఎవరు రెడీ పెట్టాలి?"),
    4: ("ai", "names", "names", "With no names, six of ten notes gave your job to Suresh. [1] With names, ten of ten got it right. Names fix who, not money.",
        "పేర్లు లేకపోతే, పదిలో ఆరు సమ్మరీలు, సురేష్ అని రాశాయి. [1] పేర్లు పెడితే, పదికి పది మీరే. పేర్లు, ఎవరో సరిచేశాయి. ధర మాత్రం అలాగే తప్పు."),
    5: ("ravi", "ravi", "how", "So how do I say prices?", "మరి ధరలు ఎలా చెప్పాలి?"),
    6: ("ai", "full", "full", "In full: one thousand four hundred and fifty rupees. | [1] Then the ears wrote it right. Seven notes right, none wrong.",
        "పూర్తిగా: వెయ్యి నాలుగు వందల యాభై రూపాయలు. | [1] అప్పుడు చెవులు సరిగ్గా రాశాయి. ఏడు సమ్మరీలు సరిగ్గా, ఒక్కటీ తప్పు లేదు."),
    7: ("ravi", "ravi", "rule", "Say every amount in full, [1] and check the notes before you forward them!",
        "ప్రతి ధర పూర్తిగా చెప్పండి, [1] సమ్మరీ పంపే ముందు చెక్ చేసుకోండి!"),
    8: ("ai", "ai", "loop", "Next call, noted: forty bags, [1] fourteen rupees fifty each.", "తర్వాతి కాల్: నలభై బస్తాలు, [1] ఒక్కోటి పధ్నాలుగు రూపాయల యాభై పైసలు."),
}
SHOW = {1: "₹1,450 a bag, I said! The AI notes say ₹14.50! 40 bags for ₹580?!",
        2: "Notes take 3 steps: ears turn the call into text, names show who said what, then I write the notes. <pause 0.6> The ears wrote 14.50, and in 10 runs, 7 notes copied it.",
        4: "With no names, 6 of 10 notes gave your job to Suresh. With names, 10 of 10 got it right. Names fix who, not money.",
        6: "In full: \"one thousand four hundred and fifty rupees\". <pause 0.6> Then the ears wrote it right. 7 notes right, none wrong.",
        8: "Next call, noted: 40 bags, ₹14.50 each."}
SHOW_TE = {
    1: "I said fourteen fifty a bag! In the summary: ₹14 and 50 paise! 40 bags, ₹580?!",
    2: "A summary has 3 jobs: the ears write the call as text. Then we add names for who said what. Last, I write the summary. <pause 0.6> The ears wrote 14.50. In 10 runs, 7 summaries wrote the same.",
    3: "So who keeps Suresh's empty sacks ready?",
    4: "With no names, 6 of 10 summaries wrote Suresh. With names, 10 of 10: you. The names fixed who. The price stayed wrong.",
    5: "So how should I say prices?",
    6: "In full: \"one thousand four hundred and fifty rupees\". <pause 0.6> Then the ears wrote it right. 7 summaries right, none wrong.",
    7: "Say every price in full, and check the summary before you send it!",
    8: "Next call: 40 bags, ₹14.50 each.",
}
TEMPO_EN = {"ravi": 1.08, "ai": 1.08}
TEMPO_TE = {"ravi": 1.1, "ai": 1.12}
T = {
    "leftLab": "THE CALL", "leftVal": "₹1,450 A BAG", "rightLab": "THE AI NOTES", "rightVal": "₹14.50 A BAG",
    "stake": "40 BAGS: ₹58,000 → ₹580", "story": "Ravi and the shop are made up · our test is real",
    "stepsHead": "HOW AI NOTES ARE MADE", "stepsSub": "our test: Ravi ↔ Suresh (supplier) · a small free AI on our computer",
    "steps": [["EARS", "the call → text", "14 .50 rupees a bag, I can deliver..."],
              ["WHO SAID WHAT", "names on the lines (added by us)", "Ravi: ...   Suresh: ..."],
              ["NOTES", "the summary + who does what", "14.50 rupees per bag · total 580 rupees"]],
    "circleX0": 285, "circleX2": 285,
    "copied": "7/10 notes: ₹14.50 a bag · 5/10: total ₹580",
    "namesHead": "WHO KEEPS THE EMPTY SACKS READY?", "namesSub": "the right answer: Ravi · names added by us: the best case",
    "noNames": "NO NAMES ON WHO SAID WHAT", "noNamesLines": ["Suresh: deliver 40 bags", "Ravi: send the advance", "Suresh: keep 3 sacks ready", "Ravi: pay the balance"],
    "withNames": "WITH NAMES", "withNamesLines": ["Suresh: deliver 40 bags", "Ravi: send the advance", "Ravi: keep 3 sacks ready", "Ravi: pay the balance"],
    "noNamesStat": "6/10 said Suresh", "withNamesStat": "10/10 said Ravi",
    "fullHead": "SAY IT IN FULL", "fullSub": "the same call, the amount said in full",
    "full1Head": "THE CALL SAID", "full1Rows": ["\"one thousand four hundred", "and fifty rupees a bag\""],
    "full2Head": "THE EARS WROTE: 1,450 rupees a bag", "full2Rows": ["right price: 7/10 · wrong: 0/10", "no price given: 3/10"], "zeroWrong": "0 WRONG",
    "rule1": "SAY EVERY AMOUNT IN FULL", "rule2": "CHECK THE NOTES BEFORE YOU FORWARD",
    "builder": "app makers: a \"rupees\" hint took the $ away, but 8/10 notes still wrote 14.50",
}
# Sound (CLAUDE.md arc): a boom, clap and cash-register on frame 1, a buzz under "fourteen rupees fifty"; pops on the
# three steps, a hit and a buzz on the miss; a drop before "six of ten"; a buzz and a success on the two note cards; a
# pop on each card of the fix; a clap and a lift into the rule; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 1.6, "tail": 0.0}),   # a beat before the miss
          ("s_b", (3, 4), {"boost": 2.0, "lift": 0.7, "tail": 0.0}),
          ("s_c", (5, 6), {"boost": 2.0, "lift": 0.7, "drop_at": [[1, "1", 0.0]], "tail": 0.0}),   # a beat before the payoff
          ("s_d", (7, 8), {"outro": True, "pre": 0.3, "boost": 2.2, "lift": 0.8, "rise": 2.0, "tail": 0.0})]
GAP = {n: 0.22 for n in LINES} | {7: 0.5, 8: 0.0}
GAP_TE = {n: 0.16 for n in LINES} | {7: 0.4, 8: 0.0}
FLAGS_TE = {"s_d": {"boost": 2.0, "rise": 1.8}}
YT = {"s_a": "₹14.50 a bag", "s_b": "Who does what", "s_c": "Say it in full", "s_d": "Check before you forward"}
NAMES = {}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "uc03te" if te else "uc03v1"
    s = {"id": sid, "title": "₹14.50 a Bag (UC03: how AI meeting notes work)" + (" (Telugu audio)" if te else ""),
         "label": "UC03", "banner": "How AI meeting notes work", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35,
         "music": "lofi", "names": NAMES, "musicVol": [0.2, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0,
         "captionMode": "phrase", "musicEQ": [[250, -12, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.25 if not te else 0.6,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1420}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else GAP).get(n, 0.2), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who],
                  "gain_db": -1.0 if who == "ai" else 0.5}
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = 0.6
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1420, "t": T, "tagSide": {"ravi": "right", "ai": "right"},
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_notes03", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
