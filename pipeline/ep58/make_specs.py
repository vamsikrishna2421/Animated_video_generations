# EP58 "+1% or +19%? Your AI Career Roadmap" (Season 6 finale, a screen tutorial): writes reels/ep58v1.json (English) and
# reels/ep58te.json (Telugu). Lines from series/scripts/ep58_career_roadmap.md (v2 after the script review); [n] marks the
# words the picture waits for; " | " = two takes. One narrator. Voices: pipeline/ep58/voice.py. Scene: Career58Crayon.tsx.
# Numbers: Naukri JobSpeak Sep 2026; EP51's and EP54's tests; today's filter (series/scripts/ep58_demo/train.json).
#   python3 pipeline/ep58/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "Hiring for freshers this September: up one percent on last year. [1] Fresher AI and ML hiring: up nineteen. [2] Three AI jobs, one with no code; we tried each one here.",
        "ఫ్రెషర్ల హైరింగ్, పోయిన ఏడాది కన్నా ఒక్క శాతమే పెరిగింది. [1] ఫ్రెషర్ల ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ఉద్యోగాలు, పంతొమ్మిది శాతం పెరిగాయి. [2] మూడు ఉద్యోగాలు, ఒకదానికి కోడ్ అక్కర్లేదు; మూడూ చేసి చూశాం."),
    2: ("prompt", "Job one, prompt engineer: writes and tests the instructions for an AI; no code. [1] Our shop chatbot, ten customer questions, no instructions: four right. [2] With rules and the price list: nine.",
        "ఉద్యోగం ఒకటి, ప్రాంప్ట్ ఇంజనీర్: చాట్‌బాట్ కి సూచనలు రాసి, టెస్ట్ చేస్తారు; కోడ్ అక్కర్లేదు. [1] మా షాప్ బాట్, పది కస్టమర్ ప్రశ్నలు, సూచనలు లేకుండా: నాలుగు సరైనవి. [2] రూల్స్, ప్రైస్ లిస్ట్ ఇస్తే: తొమ్మిది."),
    3: ("aieng", "Job two, AI engineer: connects the AI to real data, and puts it live. [1] Guessing order status: three of ten right, by luck. [2] With one lookup tool: ten of ten.",
        "ఉద్యోగం రెండు, ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ఇంజనీర్: చాట్‌బాట్ ని షాప్ డేటా కి కలిపి, లైవ్ లో పెడతారు. [1] ఊహించి చెప్తే: పదిలో మూడే సరైనవి, అదీ అదృష్టం వల్ల. [2] చూసి చెప్పే ఒక్క టూల్ ఇస్తే: పదికి పది."),
    4: ("ml", "Job three, machine-learning engineer: builds the model itself. [1] We trained a scam-SMS filter here; the computer took two seconds. [2] In its own test, it caught nine out of ten scams.",
        "ఉద్యోగం మూడు, మెషిన్ లెర్నింగ్ ఇంజనీర్: మోడల్ నే తయారు చేస్తారు. [1] ఇక్కడే స్కామ్ మెసేజ్ ఫిల్టర్ ని ట్రెయిన్ చేశాం; కంప్యూటర్ కి రెండు సెకన్లు పట్టింది. [2] దాని టెస్ట్ లో, పదిలో తొమ్మిది స్కామ్ లు పట్టుకుంది."),
    5: ("twist", "Then three scam texts we wrote, Indian style. [1] It caught the lottery one. | [2] Missed KYC and parcel. [3] It learned from old UK texts: the real work is the data.",
        "తర్వాత, మేము రాసిన మూడు ఇండియన్ స్కామ్ మెసేజ్ లు. [1] లాటరీ మెసేజ్ ని పట్టుకుంది. | [2] కే వై సీ, పార్సెల్ మెసేజ్ లు వదిలేసింది. [3] అది నేర్చుకుంది పాత యూకే మెసేజ్ ల నుంచి: అసలు పని డేటా తోనే."),
    6: ("road", "This week. Prompt engineer: rules for one shop, ten test questions. [1] AI engineer: run our episode fifty-four code. [2] ML engineer: add twenty Indian scam texts to our filter. [3] Put your before-and-after score on your résumé.",
        "ఈ వారం: ప్రాంప్ట్ ఇంజనీర్ కి, ఒక షాప్ రూల్స్ రాసి, పది ప్రశ్నలతో టెస్ట్ చేసుకోండి. [1] ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ఇంజనీర్ కి, ఎపిసోడ్ యాభై నాలుగు కోడ్ రన్ చేసి చూడండి. | [2] మెషిన్ లెర్నింగ్ కి, మా ఫిల్టర్ కి ఇరవై ఇండియన్ స్కామ్ లు కలపండి. [3] ముందు, తర్వాత స్కోర్, రెజ్యూమ్ లో పెట్టండి."),
    7: ("loop", "Plus one, or plus nineteen? [1] More hiring, not easier hiring. Pick one job, and start.",
        "ఒక్క శాతమా, పంతొమ్మిదా? [1] ఎక్కువ ఉద్యోగాలు, కానీ సులభం కాదు. ఒక ఉద్యోగం ఎంచుకుని, మొదలుపెట్టండి."),
}
SHOW = {}
SHOW_TE = {   # the Telugu cut's English captions say what the Telugu voice says
    1: "Fresher hiring grew just one percent over last year. Fresher AI jobs grew nineteen percent. Three jobs, one needs no code; we tried all three.",
    2: "Job one, prompt engineer: writes instructions for a chatbot and tests them; no code needed. Our shop bot, ten customer questions, no instructions: four right. With rules and the price list: nine.",
    3: "Job two, AI engineer: connects the chatbot to the shop's data and puts it live. Guessing: only three of ten right, and that by luck. Given one tool that looks it up: ten of ten.",
    4: "Job three, ML engineer: builds the model itself. We trained a scam-message filter right here; the computer took two seconds. In its test, it caught nine scams in ten.",
    5: "Then three Indian scam messages we wrote. It caught the lottery message; it let the KYC and parcel messages through. It learned from old UK messages: the real work is the data.",
    6: "This week: prompt engineer, write one shop's rules and test with ten questions. AI engineer, run episode 54's code. ML, add twenty Indian scams to our filter. Put your before-and-after score on your résumé.",
    7: "One percent, or nineteen? More jobs, but not easier. Pick one job and start.",
}
SPLIT_PAUSE, SPLIT_PAUSE_TE = {5: 0.5}, {5: 0.5, 6: 0.3}   # 5: a beat before "missed KYC" (render review); TE 6 ran 22.5 s as one take
T = {
    "hookHead": "FRESHER JOBS · SEP 2026 vs SEP 2025", "blockA": "FRESHER HIRING (ALL JOBS)", "valA": "+1%",
    "blockB": "FRESHER AI/ML HIRING", "valB": "+19%", "src1": "Naukri JobSpeak (job postings) · Sep 2026 vs Sep 2025",
    "resume": "RÉSUMÉ", "jobsChip": "3 AI JOBS · 1 NEEDS NO CODE · EACH TRIED HERE",
    "p1Head": "JOB 1 · PROMPT ENGINEER", "p1Sub": "writes and tests the instructions for an AI · no code",
    "p1Label": "the shop bot's instructions (system prompt)",
    "p1Prompt": ["You are Ravi's kirana shop assistant.", "Answer only from this price list:", "Sugar 1 kg ₹48 · Oil 1 L ₹150 · ...", "Not on the list? Say so."],
    "p1BarA": "no instructions · 10 customer questions", "p1BarB": "rules + the price list", "p1Src": "our test (episode 51) · works in any chat app",
    "p1Task": "THIS WEEK: rules for one shop · test 10 questions · no code",
    "p2Head": "JOB 2 · AI ENGINEER", "p2Sub": "connects the AI to real data · puts it live",
    "p2Ask": "Is the refund for order 4417 done?", "p2Tool": "get_order(4417)", "p2Rec": "record: refund not started",
    "p2BarA": "guessing · 10 order questions (3 by luck)", "p2BarB": "one lookup tool", "p2Src": "our test (episode 54)",
    "p2Task": "THIS WEEK: run episode 54's code (in its post) · Python",
    "p3Head": "JOB 3 · ML ENGINEER", "p3Sub": "builds and trains the model itself",
    "term": ["$ python train.py", "5,574 real texts (UCI SMS Spam set)", "trained in 1.86 s · 4 CPU cores", "scams caught 135/149 · genuine flagged 1/966"],
    "mlBig": "135/149", "mlBigSub": "scams caught in its own test: 9 in 10",
    "p3Task": "THIS WEEK: add 20 Indian scam texts to our filter (pinned)",
    "twHead": "3 SCAM TEXTS WE WROTE", "twSub": "Indian style · made up by us",
    "sms": [["LOTTERY", "You have won Rs 25,00,000 in the lucky draw. Call now to claim", "CAUGHT ✓", True],
            ["KYC", "Your KYC is pending. Update today or your bank account will be blocked", "MISSED ✗", False],
            ["PARCEL", "Your parcel is on hold. Pay Rs 25 now to release it", "MISSED ✗", False]],
    "twBig": "THE REAL WORK IS THE DATA", "twNote": "it learned from UK texts, about 2012",
    "roadHead": "THIS WEEK",
    "road": [["PROMPT ENGINEER · no code", "rules for one shop · test 10 questions"],
             ["AI ENGINEER · Python", "run episode 54's code (in its post)"],
             ["ML ENGINEER · Python + maths", "20 Indian scam texts → our filter (pinned)"]],
    "roadFoot": "ON YOUR RÉSUMÉ: your 10 questions + before → after", "loopChip": "MORE HIRING, NOT EASIER HIRING",
}
SCENES = [("s_a", (1,), {"boost": 2.4, "drop_at": [[0, 1, 0.4]], "tail": 0.0}),
          ("s_b", (2,), {"boost": 1.8, "lift": 0.6, "tail": 0.1}),
          ("s_c", (3,), {"boost": 1.8, "lift": 0.6, "tail": 0.1}),
          ("s_d", (4, 5), {"boost": 1.8, "lift": 0.6, "drop_at": [[1, 2, 0.3]], "tail": 0.2}),   # the drop lands before "missed KYC"
          ("s_e", (6,), {"boost": 2.2, "lift": 0.7, "rise": 1.6, "tail": 0.6}),
          ("s_f", (7,), {"outro": True, "pre": 0.2, "boost": 3.0, "lift": 0.8, "rise": 3.2, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.35, 3: 0.35, 4: 0.3, 5: 0.35, 6: 0.35, 7: 0.0}
FLAGS_TE = {"s_f": {"boost": 2.8, "rise": 3.0}}
YT = {"s_a": "+1% or +19%?", "s_b": "Job 1: prompt engineer", "s_c": "Job 2: AI engineer", "s_d": "Job 3: ML engineer",
      "s_e": "This week", "s_f": "Pick one"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"storyteller": ""}, "te": {"storyteller": ""}}


def spec(lang="en"):
    te = lang == "te"
    sid = "ep58te" if te else "ep58v1"
    s = {"id": sid, "title": "+1% or +19%? Your AI Career Roadmap (EP58)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.16, 0.26], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1440}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.45, "musicVol": [0.18, 0.26]})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "maxgap": 0.25 if te else 0.3, "gap": GAP.get(n, 0.3), "tempo": 1.1 if te else 1.12}
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1440, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_career58", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
