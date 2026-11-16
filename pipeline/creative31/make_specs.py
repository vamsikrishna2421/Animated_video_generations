# Creative 31 "Written by AI: 0. Flagged as AI: 89." (POV, a calm narrator; no other characters): writes
# reels/creative31v1.json (English) and reels/creative31te.json (Telugu). Lines from series/scripts/creative31_detector.md;
# [n] marks the words the picture waits for; " | " = two takes with a beat of silence. Voices: pipeline/creative31/voice.py.
# Scene: Detector31Crayon.tsx. Facts: Stanford HAI (May 15, 2023: 7 detectors, 91 TOEFL essays, 61.22% flagged, 89 of 91
# flagged by at least one, "near-perfect" on US-born eighth-graders); OpenAI's note on its AI classifier (withdrawn July 20,
# 2023, low accuracy); Turnitin's guidance (its AI score not the sole basis for action). Our test:
# series/scripts/creative31_demo/detector.json.
#   python3 pipeline/creative31/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Ninety-one essays, all written by students. [1] Written by AI: zero. Flagged as AI: eighty-nine.",
        "తొంభై ఒక్క వ్యాసాలు, అన్నీ పిల్లలు రాసినవే. [1] మెషీన్ రాసినవి: సున్నా. మెషీన్ రాసింది అని ముద్ర పడ్డవి: ఎనభై తొమ్మిది."),
    2: ("pov", "POV: you wrote yours yourself, in English, your second language. [1] The detector says: AI.",
        "ఊహించండి: మీ వ్యాసం మీరే రాశారు, ఇంగ్లీష్ మీ రెండో భాష. [1] డిటెక్టర్ మాత్రం, మెషీన్ రాసింది అంటోంది."),
    3: ("why", "Detectors hunt for plain, predictable words. [1] Careful, simple English looks predictable too.",
        "డిటెక్టర్లు, ఊహించగలిగే సాదా మాటల కోసం వెతుకుతాయి. [1] జాగ్రత్తగా రాసిన సింపుల్ ఇంగ్లీష్ కూడా, అలాగే కనిపిస్తుంది."),
    4: ("study", "Stanford researchers, 2023, seven detectors. [1] Students writing English as a second language: sixty-one percent flagged. | [2] U.S.-born students: near-perfect.",
        "స్టాన్ఫర్డ్ రీసెర్చర్లు, ఏడు డిటెక్టర్లతో టెస్ట్ చేశారు. [1] ఇంగ్లీష్ రెండో భాషగా రాసిన పిల్లలు: అరవై ఒక్క శాతం మీద ముద్ర. | [2] అమెరికాలో పుట్టిన పిల్లల మీద: దాదాపు లేదు."),
    5: ("ours", "We tried two free detectors. [1] OpenAI's older one called the 1776 Declaration of Independence AI, | [2] and called two of three real AI texts human.",
        "మేము రెండు ఫ్రీ డిటెక్టర్లు ట్రై చేశాం. [1] ఒక పాత డిటెక్టర్, పదిహేడు వందల డెబ్భై ఆరులో రాసిన అమెరికా డిక్లరేషన్ ని, మెషీన్ రాసింది అంది. | [2] నిజంగా మెషీన్ రాసిన మూడింట్లో రెండు, మనుషులు రాసినవి అంది."),
    6: ("makers", "Even the makers warn: OpenAI shut its 2023 detector for low accuracy, [1] and Turnitin says its score shouldn't be the only proof.",
        "తయారు చేసినవాళ్ళే హెచ్చరిస్తున్నారు: [1] ఈ స్కోర్ ఒక్కటే రుజువు కాదు."),
    7: ("fix", "So if it's your child: keep the drafts, the notes, the version history. [1] Ask them to judge the work, not the score.",
        "మీ పిల్లల మీద ఈ ముద్ర పడితే: డ్రాఫ్ట్స్, నోట్స్, వెర్షన్ హిస్టరీ దాచండి. [1] స్కోర్ కాదు, పని చూడమని అడగండి."),
    8: ("loop", "Because remember: [1] ninety-one essays, all written by students...",
        "ఎందుకంటే గుర్తుంచుకోండి: [1] తొంభై ఒక్క వ్యాసాలు, అన్నీ పిల్లలు రాసినవే..."),
}
SHOW = {1: "91 essays, all written by students. Written by AI: 0. Flagged as AI: 89.",
        4: "Stanford researchers, 2023, 7 detectors. Students writing English as a second language: 61% flagged. <pause 0.5> U.S.-born students: near-perfect.",
        5: "We tried 2 free detectors. OpenAI's older one called the 1776 Declaration of Independence AI, <pause 0.4> and called 2 of 3 real AI texts human.",
        8: "Because remember: 91 essays, all written by students..."}
SHOW_TE = {
    1: "91 essays, all written by students. Written by a machine: 0. Stamped 'machine-written': 89.",
    2: "Imagine: you wrote your essay yourself; English is your second language. The detector says a machine wrote it.",
    3: "Detectors look for plain, predictable words. Carefully written simple English looks the same way.",
    4: "Stanford researchers tested 7 detectors. Students writing English as a second language: 61% stamped. <pause 0.5> Students born in the US: almost none.",
    5: "We tried 2 free detectors. An old detector said the American Declaration written in 1776 was machine-written. <pause 0.4> Of 3 texts a machine really wrote, it called 2 human.",
    6: "Even the makers warn: this score alone is not proof.",
    7: "If your child gets this stamp: keep the drafts, notes, version history. Ask them to judge the work, not the score.",
    8: "Because remember: 91 essays, all written by students...",
}
SPLIT_PAUSE = {4: 0.5, 5: 0.4}
SPLIT_PAUSE_TE = {4: 0.5, 5: 0.4}
TTS_EN = {}
T = {   # on screen: Stanford HAI (May 15, 2023) and our test (series/scripts/creative31_demo/detector.json)
    "src": "Stanford study, 2023 · 7 detectors · flagged by at least one",
    "study": {"esl": "61%", "us": "near-perfect", "atLeastOne": "89 of 91", "unanimous": "18 of 91"},
    "ours": [["the 1776 Declaration of Independence (human)", "AI · 55%", "#f87171"], ["a small AI's real text #2", "human · 34% AI", "#f87171"],
             ["a small AI's real text #3", "human · 3% AI", "#f87171"], ["India's Preamble, 1949 (human)", "human", "#4ade80"]],
    "d1": "OpenAI's 2019 detector (free download)", "d2": "a 2023 open detector: got our 7 short texts right",
    "makers": [["OpenAI", "shut its 2023 AI classifier: 'low rate of accuracy'"], ["Turnitin", "its AI score shouldn't be the sole basis for action"]],
    "keep": ["drafts", "notes", "version history"],
}
# Sound (CLAUDE.md arc): a boom on frame 1 and a buzz on "eighty-nine"; a soft tick per red dot; a drop before
# "near-perfect"; a buzz on the 1776 stamp; a ding on "judge the work"; a riser and the slam into the loop.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.2, "tail": 0.0}),
          ("s_b", (4, 5), {"boost": 1.3, "lift": 0.6, "drop_at": [[0, 2, 0.3]], "tail": 0.0}),
          ("s_c", (6, 7), {"boost": 1.4, "lift": 0.7, "tail": 0.0}),
          ("s_d", (8,), {"outro": True, "pre": 0.3, "boost": 2.1, "lift": 0.9, "rise": 2.4, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.35, 3: 0.35, 4: 0.4, 5: 0.4, 6: 0.35, 7: 0.4, 8: 0.0}
FLAGS_TE = {"s_c": {"boost": 1.6}, "s_d": {"boost": 2.3, "rise": 2.7}}
YT = {"s_a": "Written by AI: 0. Flagged: 89.", "s_b": "The study and our test", "s_c": "What to do", "s_d": "91 essays"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative31te" if te else "creative31v1"
    s = {"id": sid, "title": "Written by AI: 0. Flagged as AI: 89. (Creative 31)" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.14, 0.4], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.9, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.1 if te else 1.04}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_detector31", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
