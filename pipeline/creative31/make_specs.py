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

LINES = {   # v2 (script review): "at least one detector" said; 61% = each detector's average; "almost none"; our test cut
    # from the video (a 2019 detector vs today's AI was a strawman; it lives in the pinned comment); the ending stays "you"
    1: ("hook", "Ninety-one student essays. [1] Written by AI: zero. Flagged as AI, by at least one detector: eighty-nine.",
        "తొంభై ఒక్క స్టూడెంట్స్ వ్యాసాలు. [1] మెషీన్ రాసినవి: సున్నా. కనీసం ఒక్క డిటెక్టర్, మెషీన్ అని ముద్ర వేసినవి: ఎనభై తొమ్మిది."),
    2: ("pov", "POV: you wrote yours yourself, in English, your second language. [1] The detector says: AI.",
        "ఊహించండి: మీ వ్యాసం మీరే రాశారు, ఇంగ్లీష్ మీ రెండో భాష. [1] డిటెక్టర్ మాత్రం, మెషీన్ రాసింది అంటోంది."),
    3: ("why", "Detectors hunt for plain, predictable words. [1] Careful, simple English looks predictable too.",
        "డిటెక్టర్లు, ఊహించగలిగే సాదా మాటల కోసం వెతుకుతాయి. [1] జాగ్రత్తగా రాసిన సింపుల్ ఇంగ్లీష్ కూడా, అలాగే అనిపిస్తుంది."),
    4: ("study", "That's a Stanford study from 2023, seven detectors. [1] Each one, on average, flagged six in ten of those essays. Essays by U.S.-born students? | [2] Almost none flagged.",
        "అది రెండు వేల ఇరవై మూడు స్టాన్ఫర్డ్ స్టడీ: ఏడు డిటెక్టర్లు. [1] ఒక్కో డిటెక్టర్, సగటున పదింట్లో ఆరు వ్యాసాలకు ముద్ర వేసింది. | [2] అమెరికాలో పుట్టిన స్టూడెంట్స్ రాసిన వ్యాసాలకు: దాదాపు సున్నా."),
    5: ("makers", "Even the makers warn: OpenAI shut its own detector for low accuracy, [1] and Turnitin says its score shouldn't be the only proof.",
        "తయారు చేసినవాళ్ళే హెచ్చరిస్తున్నారు: [1] ఈ స్కోర్ ఒక్కటే రుజువు కాదు."),
    6: ("fix", "So keep your drafts and version history from day one. [1] If you're flagged, show them. And offer to explain your essay out loud.",
        "అందుకే, ముందు నుంచే డ్రాఫ్ట్స్, వెర్షన్ హిస్టరీ సేవ్ చేసి ఉంచండి. | [1] ముద్ర పడితే, అవి చూపించండి; మీ వ్యాసం నోటితో వివరిస్తానని చెప్పండి."),
    7: ("teachers", "And teachers: [1] a score is a reason to talk, not proof.",
        "టీచర్లకి: [1] స్కోర్, మాట్లాడటానికి ఒక కారణం; రుజువు కాదు."),
    8: ("loop", "Because remember: [1] ninety-one student essays...",
        "ఎందుకంటే గుర్తుంచుకోండి: [1] తొంభై ఒక్క స్టూడెంట్స్ వ్యాసాలు..."),
}
SHOW = {1: "91 student essays. Written by AI: 0. Flagged as AI, by at least one detector: 89.",
        4: "That's a Stanford study from 2023, 7 detectors. Each one, on average, flagged 6 in 10 of those essays. Essays by U.S.-born students? <pause 0.7> Almost none flagged.",
        8: "Because remember: 91 student essays..."}
SHOW_TE = {
    1: "91 student essays. Written by a machine: 0. Stamped 'machine' by at least one detector: 89.",
    2: "Imagine: you wrote your essay yourself; English is your second language. The detector says a machine wrote it.",
    3: "Detectors look for plain, predictable words. Carefully written simple English looks the same way.",
    4: "That's a 2023 Stanford study: 7 detectors. Each detector, on average, stamped 6 in 10 essays. <pause 0.5> Essays by US-born students: almost zero.",
    5: "Even the makers warn: this score alone is not proof.",
    6: "So save your drafts and version history from the start. <pause 0.4> If you're stamped, show them, and say you'll explain your essay out loud.",
    7: "To teachers: a score is a reason to talk; it is not proof.",
    8: "Because remember: 91 student essays...",
}
SPLIT_PAUSE = {4: 0.7}
SPLIT_PAUSE_TE = {4: 0.5, 6: 0.4}
TTS_EN = {}
T = {   # on screen: Stanford HAI (May 15, 2023); OpenAI's note; Turnitin's guidance (quoted by universities)
    "src": "Stanford study, 2023 · 7 detectors · flagged by at least one",
    "makers": [["OpenAI", "shut its 2023 AI classifier: 'low rate of accuracy'"], ["Turnitin", "its AI score shouldn't be the sole basis for action"]],
    "keep": ["drafts", "version history"],
}
# Sound (CLAUDE.md arc): a boom on frame 1 and a buzz on "eighty-nine"; a soft tick per red dot; a drop before
# "near-perfect"; a buzz on the 1776 stamp; a ding on "judge the work"; a riser and the slam into the loop.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.2, "tail": 0.0}),
          ("s_b", (4, 5), {"boost": 1.1, "lift": 0.6, "drop_at": [[0, 2, 0.3]], "tail": 0.0}),
          ("s_c", (6, 7), {"boost": 1.8, "lift": 0.8, "tail": 0.0}),   # render review: the end never lifted
          ("s_d", (8,), {"outro": True, "pre": 0.3, "boost": 2.5, "lift": 0.9, "rise": 2.9, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.35, 3: 0.35, 4: 0.4, 5: 0.4, 6: 0.35, 7: 0.4, 8: 0.0}
FLAGS_TE = {"s_b": {"boost": 1.2}, "s_c": {"boost": 2.0}, "s_d": {"boost": 2.6, "rise": 3.0}}
YT = {"s_a": "Written by AI: 0. Flagged: 89.", "s_b": "The study, and the makers", "s_c": "What to do", "s_d": "91 essays"}
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
