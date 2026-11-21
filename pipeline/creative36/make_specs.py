# Creative 36 "Enhance!": writes reels/creative36v1.json (English) and reels/creative36te.json (Telugu).
# Lines from series/scripts/creative36_enhance.md (v2 after the script review); [n] marks the words the picture waits for;
# " | " = two takes. Voices: pipeline/creative36/voice.py. Scene: Enhance36Crayon.tsx. Every plate image on screen is a real
# input or output of our test (series/scripts/creative36_demo, pipeline/creative36/enhance_demo.py).
#   python3 pipeline/creative36/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (who, prop, English, Telugu)
    1: ("vijaya", "hook", "Mohan garu! Someone dented my car, and AI enhance read the CCTV: nine-zero-zero-zero. Your scooter!",
        "మోహన్ అన్నయ్యా! నా కారుకి సొట్ట పడింది; సీసీటీవీ ఫోటోని యాప్ తో క్లియర్ చేస్తే, | తొమ్మిది, సున్నా, సున్నా, సున్నా: మీ స్కూటరే!"),
    2: ("mohan", "again", "Nine-zero-zero-zero is my plate, yes. [1] Press enhance again.",
        "తొమ్మిది సున్నా సున్నా సున్నా, నా నంబరే. [1] ఇంకోసారి ఎన్‌హాన్స్ నొక్కండి."),
    3: ("app", "app", "Enhanced.", "Enhanced."),
    4: ("vijaya", "changed", "Now it says nine, zero, one, zero?! It changed!", "ఇప్పుడు తొమ్మిది సున్నా ఒకటి సున్నా?! మారిపోయింది!"),
    5: ("mohan", "draws", "Because this kind of AI enhance doesn't read the blur. [1] It draws a sharp plate that looks right.",
        "ఎందుకంటే ఇలాంటి ఎన్‌హాన్స్, మసకగా ఉన్నది చదవదు. [1] క్లియర్‌గా కనిపించే నంబర్, కొత్తగా గీస్తుంది."),
    6: ("mohan", "test", "Ten blurry plates, three tries each: [1] twenty sharp plates. | [2] The last four digits right: once.",
        "పది మసక ప్లేట్లు, ఒక్కోదానికి మూడు సార్లు: [1] ఇరవై సార్లు క్లియర్‌గా కనిపించే ప్లేట్. | [2] చివరి నాలుగు అంకెలు సరిగ్గా వచ్చాయి: ఒక్కసారే."),
    7: ("mohan", "court", "Even a US court refused AI-enhanced video as evidence.", "అమెరికాలో ఒక కోర్టు కూడా, ఎన్‌హాన్స్ చేసిన వీడియోని ఒప్పుకోలేదు."),
    8: ("vijaya", "real", "The gate camera, same car: | [1] five, six, six, zero. [2] A guest's car. [3] Sorry, Mohan garu!",
        "గేట్ కెమెరాలో అదే కారు: | [1] ఐదు ఆరు ఆరు సున్నా. [2] ఎవరో గెస్ట్ కారు. [3] సారీ, అన్నయ్యా!"),
    9: ("mohan", "rule", "Next time: a second camera, the watchman. [1] Never blame anyone from an enhanced picture.",
        "ఇకపై: ఇంకో కెమెరా చూడండి, వాచ్‌మన్ ని అడగండి. [1] ఎన్‌హాన్స్ చేసిన ఫోటో చూసి, ఎవరి మీదా నింద వేయొద్దు."),
    10: ("vijaya", "loopask", "One more enhance?", "ఇంకొక్కసారి ఎన్‌హాన్స్?"),
    11: ("app", "loop", "Enhanced.", "Enhanced."),
}
TTS_EN = {}
SHOW = {}
SHOW_TE = {   # the Telugu cut's English captions say what the Telugu voice says
    1: "Mohan anna! My car got dented, and I cleared the CCTV photo with an app: nine-zero-zero-zero. Your scooter!",
    2: "Nine-zero-zero-zero, that's my number. Press enhance once more.",
    4: "Now it's nine-zero-one-zero?! It changed!",
    5: "Because this kind of enhance can't read what's blurry. It draws a clear-looking number, new.",
    6: "Ten blurry plates, three tries each: twenty times a clear-looking plate. The last four digits right: once.",
    7: "Even a court in the US refused an AI-enhanced video.",
    8: "In the gate camera, the same car: five-six-six-zero. Some guest's car. Sorry, anna!",
    9: "From now on: check another camera, ask the watchman. Don't blame anyone from an enhanced photo.",
    10: "One more enhance?",
}
SPLIT_PAUSE = {6: 0.5, 8: 0.5}   # render review: a breath before "once" and before the real plate
SPLIT_PAUSE_TE = {1: 0.25, 6: 0.5, 8: 0.5}   # TE line 1: the digits in their own take (Parler dropped a zero)
T = {
    "blurLab": "SAME CCTV BLUR", "enhLab": "AI ENHANCE", "tryA": "TRY 1", "tryB": "TRY 2", "numA": "…9000", "numB": "…9010",
    "dent": "DENTED", "blamed": "BLAMED", "matchLab": "AI ENHANCE, TRY 1 = HIS PLATE", "plateHis": "TS 06 BA 9000", "story": "a story · the plates and AI outputs are real",
    "appName": "AI ENHANCE", "changed": "IT CHANGED!", "numC": "streaks", "tryC": "TRY 3",
    "drawsHead": "IT DRAWS. IT DOESN'T READ.", "drawsSub": "same blur, 3 tries:",
    "drawsNote": "tested: a free AI upscaler on our computer · not phone apps",
    "testHead": "OUR TEST", "testSub": "10 blurry plates × 3 tries · a free AI upscaler on our computer",
    "sharpN": "20", "sharpLab": "sharp-looking plates", "rightN": "1", "rightLab": "last 4 digits right",
    "testNote": "the other 10 tries: just streaks", "testNote2": "clearer photos: 9 of 30 got a character changed",
    "court": ["2024 · KING COUNTY, WASHINGTON (US)", "AI-enhanced video barred from a murder trial",
              "\"visual data not in the original\": a forensic video analyst"],
    "courtSrc": "NBC News · Bloomberg Law · Gizmodo",
    "court2": ["A US COURT, 2024", "refused AI-enhanced video", "\"visual data not in the original\""],
    "origLab": "THE GATE CAMERA · SAME CAR", "numReal": "…5660", "realLab": "look again: the blur said …5660 too", "register": "the watchman's register: Flat 4B's guest",
    "sorry": "SORRY, MOHAN GARU!", "ruleHead": "NEXT TIME", "rule": ["check a second camera", "ask the watchman"],
    "ruleX": "blame from an enhanced picture", "again": "ONE MORE ENHANCE?",
}
# Sound (CLAUDE.md arc): a boom and a clap on frame 1; a bonk on "my plate"; a glitch on "Enhanced."; a boom on "It
# changed!"; a whoosh into the explanation; pops and a boom on the test counters; a bonk on the court card; a beat of
# silence before the real plate, a ding on "Sorry"; a success on the rule; the riser, the streaks and the slam back.
SCENES = [("s_a", (1,), {"boost": 2.0, "tail": 0.0}),
          ("s_b", (2,), {"boost": 1.6, "tail": 0.0}),
          ("s_c", (3, 4), {"boost": 1.3, "lift": 0.5, "tail": 0.1}),
          ("s_d", (5, 6), {"boost": 1.5, "lift": 0.6, "drop_at": [[1, 2, 0.3]], "tail": 1.1}),   # hold "once"
          ("s_e", (7, 8), {"boost": 2.0, "lift": 0.7, "drop_at": [[1, 1, 0.2]], "tail": 0.1}),   # silence before the digits
          ("s_f", (9, 10, 11), {"outro": True, "pre": 0.2, "boost": 2.6, "lift": 0.8, "rise": 2.8, "tail": 0.0})]
GAP = {1: 0.3, 2: 0.25, 3: 0.2, 4: 0.3, 5: 0.25, 6: 0.3, 7: 0.3, 8: 0.3, 9: 0.3, 10: 0.2, 11: 0.0}
FLAGS_TE = {"s_f": {"boost": 2.4, "rise": 2.6}}
YT = {"s_a": "Enhance! Your scooter?", "s_b": "My plate", "s_c": "Enhance again", "s_d": "It draws, it doesn't read", "s_e": "The real plate", "s_f": "Next time"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"vijaya": "Vijaya", "mohan": "Mohan", "app": "the app"}, "te": {"vijaya": "Vijaya", "mohan": "Mohan", "app": "the app"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative36te" if te else "creative36v1"
    s = {"id": sid, "title": "Enhance! (Creative 36)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.16, 0.24], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1520}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.4, "musicVol": [0.18, 0.28]})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw, "maxgap": 0.25 if te else 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.08 if te and who != "app" else 1.06}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1520, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_enh36", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
