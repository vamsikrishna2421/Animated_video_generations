# Creative 33 "Which One Is Really Kittu?" (series/scripts/creative33_voice_clone.md): a one-question challenge (the
# format last used by Creative 25, Nov 10; not a dialogue skit, as agreed with Bujji for Nov 18-19). Amma's phone: two
# voice notes from "Kittu", and a payment screen for ₹50,000. Which one is really him? Voice note 2 is a copy made by a
# voice-cloning service from 13 seconds of his voice note (our test: pipeline/creative33/clone_demo.py). Kittu is a
# computer voice too; nobody real was cloned. The two voice notes are the test's own audio (clip1, clip2: no TTS).
# Script review: both notes say the same neutral line (the guess is about the voice); the scam line plays after the
# reveal; the score is against another sentence Kittu said; 1930 spoken; McAfee moved to the caption.
# Writes reels/creative33v1.json and reels/creative33te.json. [n] marks the words the picture waits for; " | " = two takes.
#   python3 pipeline/creative33/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("storyteller", "hook", "One of these voice notes is really Kittu. [1] The other is an AI copy of his voice. Can you tell?",
        "ఈ రెండు వాయిస్ నోట్స్ లో, ఒక్కటే నిజంగా కిట్టుది. [1] ఇంకోటి, కంప్యూటర్ చేసిన అతని గొంతు కాపీ. మీరు చెప్పగలరా?"),
    2: ("clip1", "clip1", "Amma, did you take your tablets today?", "అమ్మా, ఈరోజు టాబ్లెట్లు వేసుకున్నావా?"),
    3: ("clip2", "clip2", "Amma, did you take your tablets today?", "అమ్మా, ఈరోజు టాబ్లెట్లు వేసుకున్నావా?"),
    4: ("storyteller", "guess", "Which one is Kittu? [1] Three, two, one.", "నిజమైన కిట్టు ఎవరు? [1] మూడు, రెండు, ఒకటి."),
    5: ("storyteller", "reveal", "Two is the copy, made from thirteen seconds of his voice note. [1] Here's what a scammer makes it say.",
        "రెండోది కాపీ; కిట్టు వాయిస్ నోట్ లోని పదమూడున్నర సెకన్లతో చేసింది. [1] స్కామర్ దానితో ఇలా చెప్పిస్తాడు."),
    6: ("clip3", "clip3", "I had a small accident. Please send fifty thousand rupees to this number.",
        "చిన్న యాక్సిడెంట్ అయింది. ఈ నంబర్ కి యాభై వేలు పంపు, ఇప్పుడే."),
    7: ("storyteller", "score", "A voice-matching program scored them. [1] Original Kittu: sixty-two. | [2] The copy: sixty-two. A stranger: seven.",
        "వాయిస్ మ్యాచ్ ప్రోగ్రామ్ స్కోర్ చేసింది. [1] అసలు కిట్టు: యాభై నాలుగు. | [2] కాపీ: యాభై ఎనిమిది. బయటి వ్యక్తి: పదహారు."),
    8: ("storyteller", "twist", "And note one? A computer voice too. [1] We didn't copy a real person, on purpose. Scammers do, from your reels.",
        "మరి ఒకటో వాయిస్ నోట్? అదీ కంప్యూటర్ వాయిస్ నే. [1] నిజమైన మనిషిని మేము కావాలనే కాపీ చేయలేదు; స్కామర్లు మీ రీల్స్ నుంచి చేస్తారు."),
    10: ("storyteller", "rule", "So set a family code word, in person. [1] A money call or voice note: cut it, call his saved number, ask the code word. | [2] Report it on 1930.",
         "అందుకే, ఇంట్లో వాళ్ళకే తెలిసిన ఒక కోడ్ వర్డ్ పెట్టుకోండి. [1] డబ్బులు అడిగితే: కట్ చేసి, సేవ్ చేసిన నంబర్ కి ఫోన్ చేసి, కోడ్ వర్డ్ అడగండి. | [2] ఒకటి, తొమ్మిది, మూడు, సున్నా కి చెప్పండి."),
    11: ("storyteller", "loop", "A new voice note from Kittu. [1] This time, Amma types back: what's our code word?",
         "కిట్టు నుంచి కొత్త వాయిస్ నోట్. [1] ఈసారి అమ్మ రిప్లై: మన కోడ్ వర్డ్ చెప్పు?"),
}
SHOW = {7: "A voice-matching program scored them. Original Kittu: 62. <pause 0.7> The copy: 62. A stranger: 7.",
        4: "Which one is Kittu? 3, 2, 1.",
        5: "2 is the copy, made from 13 seconds of his voice note. Here's what a scammer makes it say.",
        10: "So set a family code word, in person. A money call or voice note: cut it, call his saved number, ask the code word. <pause 0.4> Report it on 1930."}
SHOW_TE = {
    1: "Of these 2 voice notes, only one is really Kittu's. The other is a computer-made copy of his voice. Can you tell?",
    2: "(voice note 1) \"Amma, did you take your tablets today?\"",
    3: "(voice note 2) \"Amma, did you take your tablets today?\"",
    4: "Who is the real Kittu? 3, 2, 1.",
    5: "Number 2 is the copy, made from 13.5 seconds of Kittu's voice note. This is what a scammer makes it say.",
    6: "(the copy) \"I had a small accident. Send ₹50,000 to this number, right now.\"",
    7: "A voice-matching program scored them. Original Kittu: 54. <pause 0.7> The copy: 58. A stranger: 16.",
    8: "And voice note 1? That's a computer voice too. We didn't copy a real person, on purpose; scammers do it from your reels.",
    10: "So set a code word only your family knows. If they ask for money: cut it, call the saved number, ask the code word. <pause 0.4> Report on 1930.",
    11: "A new voice note from Kittu. This time Amma replies: tell me our code word?",
}
SHOW_EN_CLIPS = {2: "(voice note 1) \"Amma, did you take your tablets today?\"", 3: "(voice note 2) \"Amma, did you take your tablets today?\"",
                 6: "(the copy) \"I had a small accident. Please send ₹50,000 to this number.\""}
SPLIT_PAUSE = {7: 0.7, 10: 0.4}
SPLIT_PAUSE_TE = {7: 0.7, 10: 0.4}
CLIPS = {   # the test's own audio (series/scripts/creative33_demo/audio): (file, start s, end s); notes 1 and 2 say the same
    ("en", 2): ("en_kittu_held_0.wav", 0.0, 3.64), ("en", 3): ("en_clone10s_held_0.wav", 0.0, 3.16), ("en", 6): ("en_clone10s_scam.wav", 2.5, 8.05),
    ("te", 2): ("te_kittu_held_0.wav", 0.0, 3.57), ("te", 3): ("te_clone10s_held_0.wav", 0.0, 2.41), ("te", 6): ("te_clone10s_scam.wav", 2.3, 6.5),
}
T = {   # on screen (English in both versions); the scores are the language's own test (series/scripts/creative33_demo/clone.json)
    "contact": "Kittu ❤",
    "pay": "₹50,000",
    "scores": {"en": [["original Kittu", 62], ["the copy (from 13 s of his voice)", 62], ["a stranger", 7]],
               "te": [["original Kittu", 54], ["the copy (from 13.5 s of his voice)", 58], ["a stranger", 16]]},
    "refSecs": {"en": "13 s", "te": "13.5 s"},
    "made": {"en": "made in 8 seconds", "te": "made in 9 seconds"},
    "mcafee": "47% of Indians faced an AI voice scam or know someone who did",
    "mcafeeSrc": "McAfee survey, 1,010 adults in India, May 2023",
}
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 2.0, "duck_lines": [[1, 0.0], [2, 0.0]], "tail": 0.0}),
          ("s_b", (5, 6, 7, 8), {"boost": 1.1, "lift": 0.6, "duck_lines": [[1, 0.0]], "drop_at": [[2, 2, 0.7]], "tail": 0.0}),
          ("s_c", (10,), {"boost": 1.8, "lift": 0.6, "rise": 2.2, "tail": 0.0}),   # render check: the arc was flat into the end
          ("s_d", (11,), {"outro": True, "pre": 0.2, "boost": 2.6, "lift": 0.7, "rise": 3.0, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.4, 3: 0.35, 4: 0.7, 5: 0.3, 6: 0.4, 7: 0.35, 8: 0.35, 10: 0.35, 11: 0.0}
GAP_TE = {**GAP, 1: 0.25, 3: 0.25, 6: 0.3, 8: 0.25, 10: 0.25}   # render v2: TE ran 60.9 s
FLAGS_TE = {"s_c": {"boost": 2.0, "rise": 2.4}, "s_d": {"boost": 2.8, "rise": 3.2}}
YT = {"s_a": "Which one is really Kittu?", "s_b": "A copy from 13 seconds", "s_c": "A family code word", "s_d": "What's our code word?"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"storyteller": "", "clip1": "Voice note 1", "clip2": "Voice note 2", "clip3": "The copy"}, "te": {"storyteller": "", "clip1": "Voice note 1", "clip2": "Voice note 2", "clip3": "The copy"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative33te" if te else "creative33v1"
    s = {"id": sid, "title": "Which One Is Really Kittu? (Creative 33)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.13, 0.2], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.3, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1370}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.4, "endPad": 0.1})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, prop, en, tel = LINES[n]
            raw = tel if te else en
            show = (SHOW_TE.get(n) if te else None) or SHOW.get(n) or SHOW_EN_CLIPS.get(n) or MARK.sub("", en).replace(" | ", " ").strip()
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw, "maxgap": 0.3, "gap": (GAP_TE if te else GAP).get(n, 0.3), "show": show,
                  "tempo": 1.0 if who.startswith("clip") else (1.16 if te else 1.12)}
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1370, "t": {**T, "scores": T["scores"][lang], "refSecs": T["refSecs"][lang], "made": T["made"][lang]},
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_clone33", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
