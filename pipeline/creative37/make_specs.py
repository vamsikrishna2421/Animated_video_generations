# Creative 37 "5 Reasons, 1 Email": writes reels/creative37v1.json (English) and reels/creative37te.json (Telugu).
# Lines from series/scripts/creative37_leave_email.md (v2 after the script review); [n] marks the words the picture
# waits for; " | " = two takes with a beat of silence. One narrator. Voices: pipeline/creative37/voice.py. Scene:
# Leave37Crayon.tsx. Every count and every mini email on screen comes from our test (series/scripts/creative37_demo,
# read by hand). Ramya, Kiran and Sravya are made up.
#   python3 pipeline/creative37/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "Five leave emails for the same Friday. Their manager can approve two. | [1] All five asked an AI, and all five say \"personal reasons.\" [2] Ramya's is her sister's engagement. [3] All five are put on hold.",
        "ఒకే శుక్రవారానికి, ఐదు లీవ్ మెయిల్స్. మేనేజర్ కిరణ్ ఇద్దరికే ఇవ్వగలరు. | [1] ఐదుగురూ చాట్‌బాట్ తో రాయించారు; ఐదింట్లోనూ ఒకటే మాట: పర్సనల్ రీజన్స్. [2] రమ్యది తన చెల్లి ఎంగేజ్‌మెంట్. [3] ఐదుగురి లీవ్ హోల్డ్ లో పడింది."),
    2: ("test", "We typed the same vague ask into a free AI, ten times. [1] Ten of ten opened with \"I hope this... finds you well.\" [2] Not one had a real reason. [3] Four invented dates nobody gave it.",
        "మేము కూడా అలాగే, ఒక ఫ్రీ చాట్‌బాట్ ని పది సార్లు అడిగాం. [1] పదింటిలోనూ ఒకే మొదలు: ఐ హోప్ దిస్ ఫైండ్స్ యు వెల్. [2] ఒక్కదాంట్లో కూడా అసలు కారణం లేదు. [3] నాలుగు, ఎవరూ చెప్పని తేదీలు రాశాయి."),
    3: ("facts", "With Ramya's facts: [1] sister's engagement in Vijayawada, back Monday, report done, Sravya covers her support tickets. [2] Almost all came through. | [3] But all ten invented a month, [4] three gave Sravya the invoice report, [5] and one signed it with the AI's own name.",
        "రమ్య వివరాలతో అడిగాం. [1] చెల్లి ఎంగేజ్‌మెంట్. సోమవారం తిరిగి వస్తుంది. రిపోర్ట్ అయిపోయింది. సపోర్ట్ టికెట్లు శ్రావ్య చూసుకుంటుంది. [2] దాదాపు అన్నీ వచ్చాయి. | [3] కానీ పదింటిలోనూ నెల ఊహించి రాశాయి; [4] మూడింట్లో, అయిపోయిన రిపోర్ట్ ని శ్రావ్యకి అప్పగించాయి. [5] ఒకటి, చాట్‌బాట్ పేరుతోనే సంతకం పెట్టింది."),
    4: ("rule", "So give it three things: [1] the reason you're comfortable sharing, [2] your dates and return day, [3] and who covers your work. | [4] Before you send, check every bracket, date and name.",
        "మూడు విషయాలు చెప్పండి: [1] చెప్పడానికి ఇబ్బంది లేని కారణం, [2] ఎప్పటి నుంచి ఎప్పటి వరకు, [3] మీ పని ఎవరు చూసుకుంటారు. | [4] పంపే ముందు, ప్రతి బ్రాకెట్, ప్రతి తేదీ, ప్రతి పేరు చూసుకోండి."),   # TE take review: "చెక్ చేసుకోండి" came out "check check"
    5: ("payoff", "Ramya added her facts and checked it. [1] Back Monday, Sravya covers: her manager approved hers first.",
        "రమ్య వివరాలు పెట్టి, సరిచూసి పంపింది. [1] కిరణ్ అందరికంటే ముందు రమ్యకే లీవ్ ఇచ్చారు."),
    6: ("loop", "Five reasons, [1] one email?", "ఐదు కారణాలు, [1] ఒకటే మెయిల్?"),
}
TTS_EN = {2: "We typed the same vague ask into a free AI, ten times. Ten of ten opened with: I hope this, finds you well. Not one had a real reason. Four invented dates nobody gave it."}
SHOW = {2: "We typed the same vague ask into a free AI, ten times. Ten of ten opened with \"I hope this... finds you well.\" Not one had a real reason. Four invented dates nobody gave it."}
SHOW_TE = {   # the Telugu cut's English captions say what the Telugu voice says
    1: "Five leave emails for the same Friday. Their manager Kiran can approve only two. All five had a chatbot write them; all five say the same thing: personal reasons. Ramya's is her sister's engagement. All five leaves: on hold.",
    2: "We did the same: asked a free chatbot ten times. All ten opened the same way: \"I hope this... finds you well.\" Not one had a real reason. Four wrote dates nobody gave it.",
    3: "With Ramya's details: sister's engagement, back on Monday, report done, Sravya handles the support tickets. Almost all of it came through. But all ten guessed a month; three handed the finished report to Sravya. One signed with the chatbot's own name.",
    4: "Tell it three things: a reason you're comfortable sharing, from when to when, who covers your work. Before you send, check every bracket, every date, every name.",
    5: "Ramya put in her details, checked it and sent it. Kiran gave Ramya leave before anyone else.",
    6: "Five reasons, one email?",
}
SPLIT_PAUSE = {1: 0.35, 3: 0.85, 4: 0.35}   # render review: the beat before the bad news was under 0.5 s   # 3: the silence before the bad news   # voice review: "made up dates" was heard "made updates", "guessed" as "guests": "invented"
SPLIT_PAUSE_TE = {1: 0.2, 3: 0.5, 4: 0.2}
TEMPO_TE = {1: 1.18, 3: 1.13, 4: 1.13}   # TE render review: the facts and the rule were rushed at 1.16
T = {
    "bar": "SAME FRIDAY OFF · ONLY 2 GET LEAVE", "leftLab": "5 PEOPLE ASKED AN AI", "leftVal": "5 REASONS", "leftSub": "engagement · exam · ...",
    "rightLab": "THE AI WROTE", "rightVal": "1 EMAIL", "rightSub": "\"...due to personal reasons\"",
    "inboxHead": "Leave requests · Friday", "senders": ["Ramya", "Arjun", "Meena", "Sai", "Divya"],
    "vague": "...due to personal reasons.", "realTag": "Ramya's real reason: her sister's engagement", "realNot": "NOT IN HER EMAIL",
    "hold": "ALL 5 ON HOLD", "story": "a story · our test is real",
    "testHead": "OUR TEST · 10 FRESH CHATS", "model": "a small free AI on our computer (Qwen 7B)",
    "askLab": "the vague ask, 10 fresh chats:", "ask": "Write a leave email to my manager for 2 days, Thursday and Friday, for a personal reason.",
    "minis": [   # the test's own lines (usual, seeds 1-10): greeting, opening, reason, a date nobody gave
        ["Dear [Manager's Name],", "I hope this email finds you well.", "...due to personal reasons.", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "The reason is [briefly state the personal reason]", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "...for personal reasons.", "Oct 12th & 13th"],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "The reason for my absence is personal", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "...due to personal matters.", "Oct 13th & 14th"],
        ["Dear [Manager's Name],", "I hope this email finds you well.", "The reason is [briefly explain your reason]", "Oct 12th & 13th"],
        ["Hi [Manager's Name],", "I hope this message finds you well.", "The reason is [briefly explain your personal reason]", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "...due to personal reasons.", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "...for some personal matters.", ""],
        ["Dear [Manager's Name],", "I hope this message finds you well.", "...for personal reasons.", "Oct 12th & 13th"]],
    "cOpen": ["10/10", "open \"I hope this... finds you well\""], "cReason": ["0/10", "a real reason: we gave none"],
    "cDate": ["4/10", "made up dates (we gave none)"],
    "factsHead": "THE SAME AI, WITH RAMYA'S FACTS", "facts": [["sister's engagement", "10/10"], ["Vijayawada", "10/10"], ["back Monday", "9/10"],
                                                           ["invoice report done", "10/10"], ["Sravya covers her support tickets", "10/10"]],
    "monthN": "10/10", "monthLab": "guessed a month", "monthSub": "April, March, July, October, November: we gave no month",
    "wrongN": "3/10", "wrongLab": "gave Sravya the wrong job", "wrongQuote": "\"I have completed the invoice report, which Sravya will handle.\"",
    "wrongSub": "the report was done; Sravya covers the tickets",
    "signName": "Qwen", "signTag": "THE AI'S OWN NAME",
    "ruleHead": "GIVE IT 3 THINGS", "three": ["the reason you're OK sharing", "your dates + return day", "who covers your work"],
    "checkHead": "BEFORE YOU SEND, CHECK", "checks": ["every [bracket]", "every date", "every name"],
    "payHead": "RAMYA'S EMAIL: HER FACTS, CHECKED", "mine": "Sister's engagement · back Monday · Sravya covers",
    "mail": [["To", "Kiran (manager)"], ["Leave", "Thursday 26 and Friday 27 November"], ["Why", "my sister's engagement, Vijayawada"], ["Back", "Monday 30 November"], ["Cover", "Sravya: my support tickets"]],
    "approved": "APPROVED", "payWhy": "back Monday · work covered",
}
# Sound (CLAUDE.md arc): a boom and clap on frame 1, a buzz on "on hold"; pops on the counters; a success under "came
# through", then a drop and a beat of silence before "But all ten guessed a month"; a bonk on the invoice report, a ding
# on the AI's name; a lift into the rule, a success under the approval, a riser and the slam back to frame 1.
SCENES = [("s_a", (1,), {"boost": 2.2, "drop_at": [[0, 3, 0.3]], "tail": 0.3}),
          ("s_b", (2,), {"boost": 1.5, "lift": 0.7, "swell": [0, 3, 1.6], "tail": 0.2}),   # render review: Q2 dipped 1.7 dB
          ("s_c", (3,), {"boost": 1.4, "lift": 0.6, "drop_at": [[0, 3, 0.7]], "tail": 0.1}),
          ("s_d", (4,), {"boost": 2.4, "lift": 0.8, "rise": 1.8, "tail": 0.4}),
          ("s_e", (5, 6), {"outro": True, "pre": 0.2, "boost": 3.2, "lift": 0.8, "rise": 3.4, "tail": 0.0})]
GAP = {1: 0.3, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.25, 6: 0.0}   # the first cut ran 64.3 s
GAP_TE = {1: 0.15, 2: 0.15, 3: 0.15, 4: 0.15, 5: 0.15, 6: 0.0}
FLAGS_TE = {"s_a": {"tail": 0.05}, "s_b": {"boost": 2.0, "tail": 0.1}, "s_c": {"tail": 0.05, "boost": 1.8}, "s_d": {"tail": 0.05}, "s_e": {"boost": 3.0, "rise": 3.2, "pre": 0.1}}
YT = {"s_a": "5 reasons, 1 email", "s_b": "Our test: the vague ask", "s_c": "With her facts", "s_d": "Give it 3 things", "s_e": "Approved"}
NAMES = {"en": {"storyteller": ""}, "te": {"storyteller": ""}}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative37te" if te else "creative37v1"
    s = {"id": sid, "title": "5 Reasons, 1 Email (Creative 37)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.16, "lead": 0.3, "music": "lofi",
         "musicVol": [0.16, 0.28], "musicDuckRamp": 9, "musicFade": 0.05, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1440, "endPad": 0.4}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.25, "endPad": 0.2, "musicVol": [0.18, 0.24]})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.18 if te else 0.3,
                  "gap": (GAP_TE if te else GAP).get(n, 0.3), "tempo": TEMPO_TE.get(n, 1.16) if te else 1.15}   # TE 1.16: the first Telugu cut ran 69.6 s
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
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
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_leave37", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
