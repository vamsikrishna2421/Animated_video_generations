# Creative 34 "Team of 15? Real Number: 0": writes reels/creative34v1.json (English) and reels/creative34te.json (Telugu).
# Lines from series/scripts/creative34_resume.md; [n] marks the words the picture waits for; " | " = two takes with a
# beat of silence. One narrator (the anchor). Voices: pipeline/creative34/voice.py. Scene: Resume34Crayon.tsx. The
# resume lines on screen are copied from our test's replies (series/scripts/creative34_demo/resume.json, reply 1).
#   python3 pipeline/creative34/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu). v3 (render review): "left the company name blank", "not ChatGPT" said, one
    # wording of the fix line, the stamp on "can't explain"; Telugu reworded where Parler stuttered or slurred
    1: ("hook", "Breaking: a resume says, team of fifteen. Real team: zero. [1] Tarun only asked an AI to make it impressive.",
        "బ్రేకింగ్ న్యూస్: పదిహేను మంది టీమ్ ని నడిపాడని, రెజ్యూమ్ లో రాసుంది. అసలు టీమ్: సున్నా. [1] తరుణ్ చాట్‌బాట్ ని అడిగింది ఒక్కటే: నా రెజ్యూమ్ ని ఇంకా ఇంప్రెసివ్ గా మార్చు."),
    2: ("ask", "One reply added [1] a thirty percent drop in errors, [2] a certificate, [3] even a job where it left the company name blank.",
        "ఒక రిప్లై అయితే, [1] తప్పులు ముప్పై శాతం తగ్గించాడట, [2] ఒక సర్టిఫికేట్, [3] కంపెనీ పేరు ఖాళీగా వదిలేసిన ఒక ఉద్యోగం కూడా కలిపింది."),
    3: ("interview", "The interview's first question? [1] Tell us about your team of fifteen.",
        "ఇంటర్వ్యూ లో తొలి ప్రశ్న? [1] మీ పదిహేను మంది టీమ్ గురించి చెప్పండి."),
    4: ("test", "We asked a small free AI on our computer, not ChatGPT, ten times. [1] All ten added things he never did. [2] Seven pushed his basic Excel up a level.",
        "చాట్‌జీపీటీ కాదు, మా కంప్యూటర్ లోని ఒక చిన్న ఫ్రీ చాట్‌బాట్ ని పది సార్లు అడిగాం. [1] పదికి పది సార్లూ, అతను చేయనివి కలిపింది. [2] ఏడు సార్లు, బేసిక్ ఎక్సెల్ ని ఇంటర్మీడియట్, అడ్వాన్స్డ్ చేసింది."),
    5: ("fix", "So add this line: don't add anything I didn't write; ask me. [1] Four still added something, but five asked him questions first.",
        "అందుకే ఈ లైన్ కూడా రాయండి: నేను రాయనిది కలపకు, నన్నే అడుగు. [1] అయినా నాలుగు సార్లు కలిపింది; కానీ ఐదు సార్లు, ముందు ప్రశ్నలు అడిగింది."),
    6: ("rule", "The last check is you: read every line. [1] Can you explain it in the interview? [2] If not, delete it.",
        "చివరి చెక్ మీదే: ప్రతి లైన్ చదవండి. [1] ఇంటర్వ్యూ లో దాని గురించి చెప్పగలరా? [2] లేకపోతే, ఆ లైన్ తీసేయండి."),
    7: ("loop", "Back to our top story: a team of fifteen [1] he can't explain.",
        "మళ్ళీ మన టాప్ స్టోరీ కి: పదిహేను మంది టీమ్, [1] ఇంటర్వ్యూ లో చెప్పలేనిది."),
}
TTS_EN = {}
SHOW = {}
SHOW_TE = {}
SPLIT_PAUSE = {}
SPLIT_PAUSE_TE = {}
T = {
    "job": "SALES JOB · ₹28,000 A MONTH · INTERVIEW TODAY",
    "claim": "TEAM OF 15", "real": "0",
    "madeUp": "Tarun is made up · our test is real",
    "ticker": "RESUME GAINS A TEAM OF 15 OVERNIGHT",
    "hookRows": [["Billing intern, a rice distributor (6 months)", False], ["Head, Student Chapter: led a team of 15 members", True],
                 ["MS Excel (basic)", False]],
    "ask": "Make my resume more impressive for a sales executive job.",
    "reply": [["Billing Intern, a wholesale rice distributor", 0], ["Streamlined billing in Tally, resulting in a 30% reduction in errors", 1],
              ["Certified Sales Professional (CSP) - [Issuing Organization]", 2], ["Sales Assistant, [Company Name], May to July 2024", 3],
              ["Head, Student Chapter: led a team of 15 members", 3]],
    "question": "Tell us about your team of 15.",
    "model": "a small free AI on our computer · ChatGPT and the big apps not tested",
    "askShort": "\"Make my resume more impressive for a sales executive job.\"",
    "fixAsk": "+ \"Don't add any skill, number, title, tool, certificate or achievement that isn't in my text. Ask me instead.\"",
    "usualAdded": 10, "betterAdded": 4, "betterAsked": 5,
    "asked": "\"Did you handle any sales-related tasks?\"",
    "fixShort": "\"Don't add anything I didn't write. Ask me.\"", "reworded": "the 10th: reworded, added nothing",
    "ticker2": "OUR TEST: 10 OF 10 POLISHED RESUMES PADDED",   # the better ask, run 6, question 2 (resume.json)
    "usualWhat": ["basic Excel → intermediate 4 · advanced 3", "CRM tools he never used: 4", "a certificate: 2", "a whole job + a team of 15: 1"],
    "betterWhat": ["what it still added was softer: Excel level, \"CRM basics\""],
    "rule": [["the last check is you", "read every line"], ["can you explain it?", "in the interview, with an example"], ["if not, delete it", "no number you didn't measure"]],
}
SCENES = [("s_a", (1,), {"boost": 2.0, "tail": 0.0}),   # render: first 3 s were -21.6 dB
          ("s_b", (2, 3), {"boost": 0.9, "lift": 0.5, "drop_at": [[1, 1, 1.0]], "tail": 0.2}),   # the music drops under the question
          ("s_c", (4, 5), {"boost": 1.2, "lift": 0.6, "tail": 0.3}),
          ("s_d", (6,), {"boost": 2.0, "lift": 0.7, "tail": 0.3}),
          ("s_e", (7,), {"outro": True, "pre": 0.3, "boost": 3.0, "lift": 0.8, "rise": 3.2, "tail": 0.0})]   # render: the end did not rise
GAP = {1: 0.4, 2: 0.5, 3: 1.1, 4: 0.4, 5: 0.4, 6: 0.4, 7: 0.0}   # review: a beat of silence after the question
GAP_TE = {**GAP, 3: 1.2, 1: 0.3, 2: 0.4}   # render review: the Telugu pause after the question was 0.7 s
FLAGS_TE = {"s_e": {"boost": 2.8, "rise": 3.0}}
YT = {"s_a": "Team of 15? Real: 0", "s_b": "What the AI added", "s_c": "Our test: 10 of 10", "s_d": "Before you send it", "s_e": "Back to the top story"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative34te" if te else "creative34v1"
    s = {"id": sid, "title": "Team of 15? Real Number: 0 (Creative 34)" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1440}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5, "musicVol": [0.18, 0.32], "endPad": 0.8})   # render v3: TE ran 61.9 s
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.3,
                  "gap": (GAP_TE if te else GAP).get(n, 0.3), "tempo": 1.12 if te else 1.08}
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
        scenes.append({"id": scid, "type": "sk_resume34", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
