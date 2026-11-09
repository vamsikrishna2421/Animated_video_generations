# EP49 "AI and jobs": writes reels/ep49v1.json (English) and reels/ep49te.json (Telugu). Lines from
# series/scripts/ep49_ai_jobs.md (v2); [n] marks the words the pictures wait for. Voices: pipeline/ep49/voice.py
# (the Creative 21 voice standard). Numbers: our test (series/scripts/ep49_demo). Scene: JobsCrayon.tsx.
#   python3 pipeline/ep49/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the shop ("hook", "wide", "ravi", "suresh", "ai") or an insert ("test",
# "rows", "day", "ilo", "clerks"). prop: JobsCrayon.tsx.
LINES = {
    1: ("suresh", "hook", "hook", "Fifteen thousand a month, eight years... [1] and a free app takes my job?!",
        "పదిహేను వేల జీతం, ఎనిమిదేళ్లు... [1] ఫ్రీ యాప్ వల్ల నా పని పోతుందా?!"),   # script review: "ఉద్యోగం తీసుకుంటుందా" word for word
    2: ("ravi", "wide", "relax", "Relax! I only tested it on your paper work.", "టెన్షన్ పడకురా! నీ పేపర్ పని మీదే టెస్ట్ చేశా."),   # render review: "కంగారు" heard "kandaaru"
    3: ("ai", "test", "test", "Twenty-five tries at Suresh's paper work. | [1] Nineteen right.",   # render review: a real stop before the number; one rule
        "సురేష్ పేపర్ పని, ఇరవై ఐదు సార్లు. | [1] పందొమ్మిది కరెక్ట్."),   # for answers our cap cut off: 18 -> 19 (the reorder task re-run with room too)
    4: ("suresh", "test", "eighteen", "Nineteen?! That's most of it!", "పందొమ్మిదా?! చాలా వరకు!"),   # the 19/25 card holds through his reaction
    5: ("ai", "rows", "rows", "Sums, GST and stock lists: fifteen out of fifteen. [1] But every offer message had a blank or a slip to fix.",
        "లెక్కలు, జీ ఎస్ టీ, స్టాక్ లిస్ట్: పదిహేనుకి పదిహేను. [1] కానీ ప్రతి ఆఫర్ మెసేజ్ లో, ఒక ఖాళీ, లేదా ఒక తప్పు ఉంది."),
    6: ("suresh", "suresh", "me", "Nobody told it the shop's name! [1] And who checks it? Me!",   # script review: the blanks were our prompt's fault
        "షాప్ పేరు దానికి ఎవరూ చెప్పలేదు! [1] చెక్ చేసేది ఎవరు? నేనే!"),
    7: ("ravi", "ravi", "ask", "So does it take his job, or not?", "మరి సురేష్ పని పోతుందా, లేదా?"),   # render review: echo line 1; "ఏఐ" came out "ye"
    8: ("ai", "day", "day", "I can draft most of the paper part. [1] Not the sacks, the deliveries, or knowing the regulars.",   # script review: L64 claimed too much
        "పేపర్ పనిలో చాలా వరకు, నేను డ్రాఫ్ట్ చేయగలను. [1] బస్తాలు, డెలివరీ, రెగ్యులర్ కస్టమర్లని గుర్తుపట్టడం, నా వల్ల కాదు."),
    9: ("ai", "ilo", "ilo", "Worldwide, one job in four has tasks an AI could do. [1] Most of those jobs change, not vanish.",   # script review: "exposure" is jargon
        "ప్రపంచంలో, నాలుగు ఉద్యోగాల్లో ఒకదాంట్లో, ఇలాంటి యాప్ చేయగలిగే పనులు ఉన్నాయి. [1] చాలా ఉద్యోగాలు పోవు, మారతాయి."),
    10: ("suresh", "suresh", "allpaper", "And a job that's all paper work?", "మరి మొత్తం పేపర్ పనే ఉన్న ఉద్యోగం?"),
    11: ("ai", "clerks", "clerks", "That one changes the most. [1] Be the one who checks the AI, and learn the tool.",   # script review: advice, not "clerks first"
         "అదే ఎక్కువ మారుతుంది. [1] యాప్ చేసిన పని చెక్ చేసేది నువ్వే అవ్వాలి, టూల్ నేర్చుకోవాలి."),   # render review: "అవ్వండి" lectured the audience
    12: ("ravi", "wide", "rule", "So: the AI drafts, you check. [1] Hands and people: yours.",
         "అంటే: యాప్ రాస్తుంది, నువ్వు సరి చూస్తావ్. [1] బస్తాలు, కస్టమర్లు: నీవే."),   # render review: "చెక్ చెక్ చెక్"
    13: ("ravi", "wide", "stay", "Fine, you stay. [1] And you run the app.", "సరే, నువ్వే ఉంటావ్. [1] యాప్ కూడా నువ్వే నడుపు."),   # script review: "teach me" was backwards
    14: ("suresh", "wide", "loop", "Then it's [1] twenty thousand a month.", "అయితే అన్నా, [1] నెలకి ఇరవై వేలు!"),   # render review: flip ₹15,000 to ₹20,000 on the number
}
SHOW = {1: "₹15,000 a month, 8 years... and a free app takes my job?!", 3: "25 tries at Suresh's paper work. 19 right.",
        4: "19?! That's most of it!", 5: "Sums, GST and stock lists: 15 out of 15. But every offer message had a blank or a slip to fix.",
        9: "Worldwide, 1 job in 4 has tasks an AI could do. Most of those jobs change, not vanish.", 14: "Then it's ₹20,000 a month."}
SHOW_TE = {
    1: "₹15,000 salary, 8 years... and I lose my work because of a free app?!", 2: "Don't stress! I tested it only on your paper work.",
    3: "Suresh's paper work, 25 times. 19 correct.", 4: "19?! Most of it!",
    5: "Sums, GST, stock lists: 15 out of 15. But every offer message had a blank or a mistake.",
    6: "Nobody told it the shop's name! Who checks it? Me!", 7: "So does Suresh lose his work, or not?",
    8: "Most of the paper work, I can draft. Sacks, deliveries, knowing the regular customers: I can't.",
    9: "Worldwide, 1 job in 4 has work an app like this can do. Most jobs don't go, they change.",
    10: "And a job that's all paper work?", 11: "That one changes the most. You must be the one who checks the app's work, and learn the tool.",
    12: "So: the app writes, you check. Sacks, customers: yours.", 13: "Fine, you stay. And you run the app too.",
    14: "Then, anna, ₹20,000 a month!",
}
TEMPO_EN = {"ravi": 1.08, "ai": 1.06, "suresh": 1.08}
TEMPO_TE = {"ravi": 1.06, "ai": 1.06, "suresh": 1.06}   # render review v2: 66 s
# Sound (CLAUDE.md arc; script review: a hit on "Eighteen", a stop before "0/5", a lift into "you stay"): a boom, clap and
# buzz on frame 1; the bed out before "Eighteen right", a boom; a ding on "Eighteen?!"; pops on the rows, the bed out
# before the offer messages, a buzz; a clap on "Me!"; a pop as the two columns land; a boom on "change, not vanish"; a
# clap and boom into the rule; the bed lifts into "you stay"; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6, 7), {"boost": 1.0, "drop_at": [[2, 1, 0.3], [4, 1, 0.3]], "tail": 0.0}),   # render review: the drops ran under 0.5 s
          ("s_b", (8, 9, 10, 11, 12), {"boost": 1.3, "lift": 0.5, "tail": 0.0}),
          ("s_c", (13, 14), {"outro": True, "pre": 0.6, "boost": 1.8, "lift": 0.8, "rise": 1.6, "tail": 0.0})]   # render review: the lift lands on "you stay"
GAP = {1: 0.2, 2: 0.2, 3: 0.3, 4: 0.3, 5: 0.3, 6: 0.25, 7: 0.2, 8: 0.3, 9: 0.3, 10: 0.2, 11: 0.4, 12: 0.4, 13: 0.3, 14: 0.0}
GAP_TE = {11: 0.3, 12: 0.3, 13: 0.2}
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.45}}
YT = {"s_a": "₹15,000 vs a free app", "s_b": "Tasks, not jobs", "s_c": "AI drafts, you check"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep49te" if te else "ep49v1"
    s = {"id": sid, "title": "₹15,000 vs a free app (EP49: AI and jobs)" + (" (Telugu audio)" if te else ""), "label": "EP49",
         "banner": "AI and jobs: what really changes", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.34, 0.6], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.5, "captionMode": "phrase",
         "musicEQ": [[250, -8, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,   # render review: a steady pad at 200-300 Hz on the male voices
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,   # render review: the tail 5 dB over the voice
         "tempo": 1.0, "captionTop": 1500}
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
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            ln["gain_db"] = -1.0 if who == "ai" else 0.5
            if " | " in ln["text"]:   # two takes; the stop before the number (render review: 0.7 s or more)
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.8> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.8})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "tagSide": {"suresh": "left", "ravi": "right", "ai": "right"},   # render review: "Ravi anna" sat beside Suresh
                 "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_jobs", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
