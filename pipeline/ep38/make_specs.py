# EP38 "Not enough memory" (running AI locally on your laptop): writes reels/ep38v1.json (English) and reels/ep38te.json
# (Telugu). Lines come from the script (series/scripts/ep38_ram_not_storage.md); [n] marks the words the pictures wait
# for; " | " splits a line into two takes. Voices: pipeline/ep38/voice.py (as EP37's). Numbers: our test
# (series/scripts/ep38_demo), the Ollama library's file sizes.
#   python3 pipeline/ep38/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi"), "godown" (the godown
# and counter insert) or "screen" (the phone fills the frame). prop: what the line brings on (LocalCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "Not enough memory?! I paid for five-twelve GB!", "మెమరీ సరిపోలేదా?! ఫైవ్ ట్వెల్వ్ జీబీకి డబ్బులు కట్టా!"),
    2: ("ai", "godown", "godown", "That's storage, anna. [1] The godown.", "అది స్టోరేజ్ అండి. [1] మన గోదాం."),
    3: ("ravi", "ravi", "there", "So? The brain's in there!", "అయితే ఏంటి? బ్రేన్ అందులోనే ఉంది కదా!"),
    4: ("ai", "godown", "counter", "For every word, I use every bag. [1] So they all sit on the counter: RAM.",   # "sack" was heard "stack" in Ravi's lines
        "ప్రతి మాటకీ నేను ప్రతి బస్తా వాడతా. | [1] అందుకే అన్నీ ర్యామ్ అనే కౌంటర్ మీద ఉండాలి."),   # "ర్యామ్ లో ఉండాలి" babbled "lo lo lo"
    5: ("ai", "godown", "nofit", "Your counter: eight GB. [1] My brain: fifteen.", "మీ కౌంటర్ ఎనిమిది జీబీ. [1] నా బ్రేన్ పదిహేను."),
    6: ("ravi", "wide", "sacks", "Fifteen bags on a counter for eight?!", "ఎనిమిది బస్తాల కౌంటర్ మీద పదిహేను బస్తాలా?!"),   # "eight-bag" was heard "8 back"
    7: ("ravi", "ravi", "quiz", "Then the squeezed one: four point seven! [1] How much counter does it need?",
        "అయితే కంప్రెస్ చేసిన బ్రేన్, ఫోర్ పాయింట్ సెవెన్! | [1] దానికి ఎంత కౌంటర్ కావాలి?"),
    8: ("ai", "godown", "fits", "About five GB. [1] The file, plus room to work.", "దాదాపు ఐదు జీబీ. [1] ఫైల్, ప్లస్ పని చేసే చోటు."),
    9: ("ravi", "ravi", "count", "Five bags on a counter for eight! It fits!", "ఎనిమిదిలో ఐదు. సరిపోతుంది!"),
    10: ("ai", "godown", "just", "Barely. [1] Close the other apps first.", "జస్ట్ సరిపోతుంది. [1] ముందు మిగతా యాప్స్ క్లోజ్ చేయండి."),
    11: ("ravi", "ravi", "offline", "And without internet?", "ఇంటర్నెట్ లేకుండా?"),
    12: ("ai", "screen", "test", "We cut the internet. [1] I still wrote this reply: seventeen seconds.",
         "ఇంటర్నెట్ కట్ చేశాం. | [1] అయినా ఈ రిప్లై రాశానండి. పదిహేడు సెకన్లు పట్టింది."),
    13: ("ravi", "ravi", "which", "So which one do I use?", "మరి నేను ఏది వాడాలి?"),
    14: ("ai", "wide", "rule", "Check RAM, not storage. [1] It must hold the brain, room to work, and the computer itself.",
         "స్టోరేజ్ కాదు, ర్యామ్ చూడండి. | [1] బ్రేన్ కి, పని కి, ల్యాప్‌టాప్ కి కూడా చోటు ఉండాలి."),   # "కంప్యూటర్ కి చోటు" came out garbled
    15: ("ravi", "ravi", "where", "Where do I get one?", "ఎక్కడ దొరుకుతుంది?"),
    16: ("ai", "screen", "apps", "Free apps: Ollama or LM Studio. [1] Download once, then it runs offline.",   # "no coding" stays on the card
         "ఫ్రీ యాప్స్: ఓలామా, ఎల్ ఎమ్ స్టూడియో. | [1] ఒక్కసారి తెచ్చుకుంటే చాలు, తర్వాత నెట్ అక్కర్లేదు."),   # "ఆఫ్‌లైన్ లోనే నడుస్తుంది" babbled in every take
    17: ("ravi", "wide", "disk", "I'll buy a two terabyte hard disk! [1] The biggest brain!", "టూ టీబీ హార్డ్ డిస్క్ కొంటా! [1] అన్నిటికంటే పెద్ద బ్రేన్ పెడతా!"),   # "two TB" was heard "two TV" in the mix
    18: ("ai", "wide", "loop", "Bigger godown. [1] Same counter.", "గోదాం పెద్దది, [1] కౌంటర్ అదే అండి."),   # into frame 1 (loops)
}
TTS_EN = {   # English spoken forms
    1: "Not enough memory?! I paid for five twelve G B!",
    5: "Your counter: eight gigabytes. [1] My brain: fifteen.",
    8: "About five gigabytes. [1] The file, plus room to work.",
    16: "Free apps: Ollama or L M Studio. [1] Download once, then it runs offline.",
}
SHOW = {   # captions with digits
    1: "Not enough memory?! I paid for 512 GB!", 5: "Your counter: 8 GB. My brain: 15.", 6: "15 bags on a counter for 8?!",
    7: "Then the squeezed one: 4.7! How much counter does it need?", 8: "About 5 GB. The file, plus room to work.",
    9: "5 bags on a counter for 8! It fits!", 12: "We cut the internet. I still wrote this reply: 17 seconds.",
    17: "I'll buy a 2 TB hard disk! The biggest brain!",
}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "Memory not enough?! I paid for 512 GB!", 2: "That's storage. Our godown.", 3: "So what? The brain is in there!",
    4: "For every word I use every sack. So all of them must sit on the counter called RAM.", 5: "Your counter: 8 GB. My brain: 15.",
    6: "15 sacks on an 8-sack counter?!", 7: "Then the compressed brain, 4.7! How much counter does it need?",
    8: "About 5 GB. The file, plus room to work.", 9: "5 out of 8. It fits!", 10: "It just fits. First close the other apps.",
    11: "Without internet?", 12: "We cut the internet. I still wrote this reply. It took 17 seconds.", 13: "So which one do I use?",
    14: "Not storage, check RAM. Room for the brain, for the work, and for the laptop too.", 15: "Where do I get it?",
    16: "Free apps: Ollama, LM Studio. Get it once, and after that no net needed.",
    17: "I'll buy a 2 TB hard disk! I'll put in the biggest brain!", 18: "The godown got bigger. The counter is the same.",
}
NOCAP = {14}   # the rule chip carries it
PAUSES = {10: {"1": 0.35}}   # render review: "Barely close the other apps" ran together
TEMPO_EN = {"ravi": 1.2, "ai": 1.12}   # 66.6 s at 1.15 / 1.1; the format stays 45-60 s until Bujji's first report
TEMPO_TE = {"ravi": 1.2, "ai": 1.14}   # 66.5 s at 1.15 / 1.1
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit and the error buzz on frame 1; a ding on the godown, pops as the sacks move to the counter,
# a riser, a bonk and a buzz as the 15 sacks land; the quiz's tick-tock 3-2-1 with a riser, the bed out on the 1, the hit
# on "five" (the measured number); a success sting on the offline reply; a snap on the rule; a riser into the 2 TB disk,
# the bed out under "Same counter", the biggest hit as the error slams back in (the loop). Only the last scene rises.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 1.6, "duck_lines": [[1, 0.45]], "tail": 0.1}),   # render review: "the godown" was heard "the good on"
          ("s_b", (7, 8, 9, 10, 11, 12), {"lift": 0.8, "pre": 0.25, "boost": 1.3, "drop_pre": [[1, 0.05, 1.0]], "tail": 0.1}),   # the bed out on the quiz's "1"; quieter middle
          ("s_c", (13, 14, 16, 17, 18), {"lift": 0.9, "pre": 0.3, "outro": True, "boost": 1.4, "rise": 1.35,   # line 15 ("Where do I get one?") cut for time:
                                          "duck_lines": [[3, 0.55], [4, 0.5]],   # 16 follows the rule; "terabyte" and "godown" clear of the bed
                                          "drop_at": [[4, "1", 1.4]], "tail": 0.0})]   # the bed out under "Same counter", the slam after it
GAP = {1: 0.2, 5: 0.35, 7: 2.45, 8: 0.35, 9: 0.3, 10: 0.35, 11: 0.25, 12: 0.85, 13: 0.3, 14: 0.85, 16: 0.45, 17: 0.3}   # more air in 0:32-0:58 (render review)   # 7: the quiz holds for its 3-2-1; 12: the test card; 14: the rule chip
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {}
YT = {"s_a": "512 GB, not enough memory", "s_b": "How much RAM does it need?", "s_c": "Check RAM, not storage"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep38te" if te else "ep38v1"
    s = {"id": sid, "title": "Not enough memory (EP38: Running AI on your laptop)" + (" (Telugu audio)" if te else ""), "label": "EP38",
         "banner": "AI on your laptop", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.36, 0.9],   # under speech / in gaps: the bed sat 3-8 dB under the voice (CLAUDE.md: 8-12)
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],   # more room for the voice: the bed's steady low notes blurred "godown" and "TB"
         "musicPad": True, "musicGapGain": 3.0, "musicEndRamp": [0.82, 2.5], "hardCuts": True, "beatSnap": True,   # the end swell: into the twist and the loop
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else TTS_EN.get(n, en),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": GAP.get(n, 0.16),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = 0.25   # the pause between a two-take line's takes (0.3 made the Telugu cut 66 s)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = (-1.0 if who == "ai" else 0.5) + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_local", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
