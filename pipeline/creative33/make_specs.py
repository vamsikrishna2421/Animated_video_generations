# Creative 33 "Which One Is Really Kittu?" (series/scripts/creative33_voice_clone.md): a one-question challenge (the
# format last used by Creative 25, Nov 10; not a dialogue skit, as agreed with Bujji for Nov 18-19). Amma's phone: two
# voice notes from "Kittu", and a payment screen for ₹50,000. Which one is really him? Voice note 2 is a copy made by a
# voice-cloning service from 13 seconds of his voice note (our test: pipeline/creative33/clone_demo.py). Kittu is a
# computer voice too; nobody real was cloned. The two voice notes are the test's own audio (clip1, clip2: no TTS).
# Writes reels/creative33v1.json and reels/creative33te.json. [n] marks the words the picture waits for; " | " = two takes.
#   python3 pipeline/creative33/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("storyteller", "hook", "One of these voice notes is really Kittu. [1] The other wants fifty thousand rupees from his mother.",
        "ఈ రెండు వాయిస్ నోట్స్ లో, ఒక్కటే నిజమైన కిట్టు. [1] ఇంకోటి, వాళ్ళ అమ్మ దగ్గర యాభై వేలు అడుగుతోంది."),
    2: ("clip1", "clip1", "Hi Amma, I reached the hostel.", "అమ్మా, హాస్టల్ కి చేరుకున్నాను."),
    3: ("clip2", "clip2", "Amma, it's me, Kittu. I had a small accident.", "అమ్మా, నేను కిట్టుని. చిన్న యాక్సిడెంట్ అయింది."),
    4: ("storyteller", "guess", "Which one is Kittu? [1] Three, two, one.", "నిజమైన కిట్టు ఎవరు? [1] మూడు, రెండు, ఒకటి."),
    5: ("storyteller", "reveal", "Voice note two is a copy. [1] A voice-cloning service made it from thirteen seconds of his voice note, in under ten seconds.",
        "రెండో వాయిస్ నోట్, ఒక కాపీ. [1] వాయిస్ క్లోనింగ్ సర్వీస్, అతని వాయిస్ నోట్ లోని పదమూడు సెకన్లతో, పది సెకన్ల లోపే దీన్ని తయారు చేసింది."),
    6: ("storyteller", "score", "A voice-matching program scored them. [1] Kittu against his own voice: sixty-two. The copy: sixty-two. | [2] Someone else: seven.",
        "వాయిస్ మ్యాచ్ చేసే ప్రోగ్రామ్ తో స్కోర్ చేశాం. [1] కిట్టు, తన గొంతుతో: యాభై నాలుగు. కాపీ: యాభై ఎనిమిది. | [2] వేరే వ్యక్తి: పదహారు."),
    7: ("storyteller", "twist", "And voice note one? Also a computer voice. [1] Kittu isn't a real person: we made both, to show you how easy it is.",
        "మరి ఒకటో వాయిస్ నోట్? అది కూడా కంప్యూటర్ వాయిస్. [1] కిట్టు నిజమైన మనిషి కాదు; ఎంత సులువో చూపించడానికి, రెండూ మేమే చేశాం."),
    8: ("storyteller", "fact", "In McAfee's survey, [1] forty-seven percent of Indians had faced an AI voice scam, or knew someone who had.",
        "మెకఫీ సర్వే లో, [1] నలభై ఏడు శాతం భారతీయులు, వాయిస్ క్లోన్ స్కామ్ ని ఎదుర్కొన్నారు, లేదా ఎదుర్కొన్నవాళ్ళు తెలుసు."),
    9: ("storyteller", "rule", "So set a family code word today. [1] Any call asking for money: hang up, and call back on the number you saved.",
        "అందుకే ఈరోజే, ఇంట్లో ఒక కోడ్ వర్డ్ పెట్టుకోండి. [1] డబ్బులు అడిగే కాల్ వస్తే: పెట్టేసి, సేవ్ చేసిన నంబర్ కి మీరే తిరిగి కాల్ చేసుకోండి."),
    10: ("storyteller", "loop", "Amma's phone buzzes again. [1] A new voice note from Kittu...",
         "అమ్మ ఫోన్ మళ్ళీ మోగింది. [1] కిట్టు నుంచి, కొత్త వాయిస్ నోట్..."),
}
SHOW = {1: "One of these voice notes is really Kittu. The other wants ₹50,000 from his mother.",
        4: "Which one is Kittu? 3, 2, 1.",
        5: "Voice note 2 is a copy. A voice-cloning service made it from 13 seconds of his voice note, in under 10 seconds.",
        6: "A voice-matching program scored them. Kittu against his own voice: 62. The copy: 62. <pause 0.5> Someone else: 7.",
        7: "And voice note 1? Also a computer voice. Kittu isn't a real person: we made both, to show you how easy it is.",
        8: "In McAfee's survey, 47% of Indians had faced an AI voice scam, or knew someone who had."}
SHOW_TE = {
    1: "Of these 2 voice notes, only one is the real Kittu. The other is asking his mother for ₹50,000.",
    2: "(voice note 1) \"Amma, I reached the hostel.\"",
    3: "(voice note 2) \"Amma, it's me, Kittu. I had a small accident.\"",
    4: "Who is the real Kittu? 3, 2, 1.",
    5: "Voice note 2 is a copy. A voice-cloning service made it from 13 seconds of his voice note, in under 10 seconds.",
    6: "We scored them with a voice-matching program. Kittu against his own voice: 54. The copy: 58. <pause 0.5> Someone else: 16.",
    7: "And voice note 1? Also a computer voice. Kittu isn't a real person; we made both, to show how easy it is.",
    8: "In McAfee's survey, 47% of Indians had faced a voice-clone scam, or knew someone who had.",
    9: "So set a family code word today. Any call asking for money: hang up, and call back yourself on the number you saved.",
    10: "Amma's phone rings again. A new voice note from Kittu...",
}
SHOW_EN_CLIPS = {2: "(voice note 1) \"Hi Amma, I reached the hostel.\"", 3: "(voice note 2) \"Amma, it's me, Kittu. I had a small accident.\""}
SPLIT_PAUSE = {6: 0.5}
SPLIT_PAUSE_TE = {6: 0.5}
CLIPS = {   # the test's own audio, trimmed at the pauses (series/scripts/creative33_demo/audio): (file, start s, end s)
    ("en", 2): ("en_note_00.wav", 0.0, 3.57), ("en", 3): ("en_clone10s_scam.wav", 0.0, 4.4),
    ("te", 2): ("te_note_00.wav", 0.0, 2.23), ("te", 3): ("te_clone10s_scam.wav", 0.0, 3.5),
}
T = {   # on screen (English in both versions); the scores are the language's own test (series/scripts/creative33_demo/clone.json)
    "contact": "Kittu ❤",
    "pay": "₹50,000",
    "scores": {"en": [["Kittu vs his own voice", 62], ["the copy (from 13 s)", 62], ["a copy from 3.6 s", 50], ["someone else", 7]],
               "te": [["Kittu vs his own voice", 54], ["the copy (from 13.6 s)", 58], ["someone else", 16]]},
    "refSecs": {"en": "13 s", "te": "13.6 s"},
    "mcafee": "47% of Indians faced an AI voice scam or know someone who did",
    "mcafeeSrc": "McAfee survey, 1,010 adults in India, May 2023",
}
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.6, "duck_lines": [[1, 0.0], [2, 0.0]], "tail": 0.0}),
          ("s_b", (5, 6, 7), {"boost": 1.0, "lift": 0.6, "drop_at": [[1, 2, 0.45]], "tail": 0.0}),
          ("s_c", (8, 9), {"boost": 1.3, "lift": 0.5, "tail": 0.0}),
          ("s_d", (10,), {"outro": True, "pre": 0.3, "boost": 2.2, "lift": 0.7, "rise": 2.6, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.6, 3: 0.6, 4: 0.5, 5: 0.35, 6: 0.4, 7: 0.4, 8: 0.35, 9: 0.4, 10: 0.0}
FLAGS_TE = {"s_d": {"boost": 2.4, "rise": 2.8}}
YT = {"s_a": "Which one is really Kittu?", "s_b": "A copy from 13 seconds", "s_c": "A family code word", "s_d": "A new voice note"}
MARK = re.compile(r"\[\d+\]\s*")
NAMES = {"en": {"storyteller": "", "clip1": "Voice note 1", "clip2": "Voice note 2"}, "te": {"storyteller": "", "clip1": "Voice note 1", "clip2": "Voice note 2"}}


def spec(lang="en"):
    te = lang == "te"
    sid = "creative33te" if te else "creative33v1"
    s = {"id": sid, "title": "Which One Is Really Kittu? (Creative 33)" + (" (Telugu audio)" if te else ""), "label": "", "banner": "",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.3, "music": "lofi", "names": NAMES[lang],
         "musicVol": [0.13, 0.16], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.9, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1370}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.4})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, prop, en, tel = LINES[n]
            raw = tel if te else en
            show = (SHOW_TE.get(n) if te else None) or SHOW.get(n) or SHOW_EN_CLIPS.get(n) or MARK.sub("", en).replace(" | ", " ").strip()
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3), "show": show,
                  "tempo": 1.0 if who.startswith("clip") else (1.1 if te else 1.06)}
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1370, "t": {**T, "scores": T["scores"][lang], "refSecs": T["refSecs"][lang]},
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
