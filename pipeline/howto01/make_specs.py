# HOW TO 01 "Make an AI voice on your laptop, free and offline": writes reels/howto01v1.json (English) and
# reels/howto01te.json (Telugu). Script: series/scripts/howto01_local_tts.md. Ravi anna's shop: Chintu's laptop talks with
# the Wi-Fi off, the shop AI walks Ravi through it. The laptop's lines are our real demo files (series/scripts/howto01_demo),
# untouched (tempo 1, no gap squeeze). Voices: pipeline/howto01/voice.py. [n] marks the words a picture waits for.
#   python3 pipeline/howto01/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: "wide" or "ravi" (the shop) or "laptop" (the laptop screen fills the
# frame). prop: what the line brings on (HowtoCrayon.tsx).
LINES = {
    1: ("laptop", "wide", "hook", "Hello! This voice was made on a laptop, with no internet.", "Hello! This voice was made on a laptop, with no internet."),
    2: ("ravi", "ravi", "who", "Who's inside Chintu's laptop?! The Wi-Fi is off!", "చింటూ ల్యాప్‌టాప్ లో ఎవరున్నారు?! వైఫై కూడా ఆఫ్!"),
    3: ("ai", "wide", "nobody", "Nobody. A free voice model, running on the laptop itself.", "ఎవరూ లేరు. ఫ్రీ వాయిస్ మోడల్, ల్యాప్‌టాప్ లోనే నడుస్తుంది."),
    4: ("ravi", "ravi", "pay", "Free? I pay an app every month for my offer announcements!", "ఫ్రీ నా? నా ఆఫర్ అనౌన్స్‌మెంట్ల కోసం ప్రతి నెలా ఒక యాప్ కి కడుతున్నా!"),
    5: ("ai", "laptop", "install", "Step one: install it.", "మొదటి స్టెప్: ఇన్‌స్టాల్ చెయ్."),
    6: ("ravi", "ravi", "type", "Type it?! I type with one finger!", "టైప్ చెయ్యాలా?! నేను ఒక్క వేలితో టైప్ చేస్తా!"),
    7: ("ai", "laptop", "code", "Then copy this. Seven lines. [1] Your sentence goes here.", "అయితే ఇది కాపీ చెయ్. ఏడు లైన్లు. [1] నీ మాట ఇక్కడ పెట్టు."),
    8: ("ravi", "ravi", "then", "And then?", "తర్వాత?"),
    9: ("ai", "laptop", "run", "Run it. The first time, it downloads the voice: 313 MB.", "రన్ చెయ్. మొదటిసారి వాయిస్ డౌన్‌లోడ్ అవుతుంది: మూడు వందల పదమూడు ఎంబీ."),
    10: ("ravi", "ravi", "after", "And after that, no internet?", "ఆ తర్వాత ఇంటర్నెట్ అక్కర్లేదా?"),
    11: ("ai", "laptop", "offline", "Wi-Fi off: one point four seconds for a four-second sentence.", "వైఫై ఆఫ్. నాలుగు సెకన్ల మాటకి, ఒకటిన్నర సెకన్ల లోపే."),
    12: ("ravi", "ravi", "telugu", "But my customers speak Telugu!", "కానీ నా కస్టమర్లు తెలుగు మాట్లాడతారు!"),
    13: ("ai", "laptop", "parler", "This one doesn't. For Telugu: Indic Parler TTS. [1] You describe the voice in words.",
         "ఇది తెలుగు మాట్లాడదు. తెలుగుకి ఇండిక్ పార్లర్ టీటీఎస్. [1] గొంతు ఎలా ఉండాలో మాటల్లో చెప్తావు."),
    14: ("laptop", "laptop", "tedemo", "నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది.", "నమస్కారం! ఈ గొంతు ఇంటర్నెట్ లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది."),
    15: ("ravi", "ravi", "howlong", "Telugu! How long did that take?", "తెలుగు! ఎంత టైం పట్టింది?"),
    16: ("ai", "laptop", "slow", "Twenty-eight seconds a sentence, and five GB of memory. Still free, still offline.",
         "ఒక్కో వాక్యానికి ఇరవై ఎనిమిది సెకన్లు, ఐదు జీబీ మెమరీ. అయినా ఫ్రీ, ఆఫ్‌లైన్."),
    17: ("ravi", "wide", "save", "Chintu! Save this!", "చింటూ! ఇది సేవ్ చెయ్!"),
}
DEMO = {1: "series/scripts/howto01_demo/0.wav", 14: "series/scripts/howto01_demo/parler_run1.wav"}
# English spoken forms
TTS_EN = {9: "Run it. The first time, it downloads the voice: three hundred and thirteen megabytes.",
          13: "This one doesn't. For Telugu: Indic Parler T T S. [1] You describe the voice in words.",
          16: "Twenty-eight seconds a sentence, and five gigabytes of memory. Still free, still offline."}
# captions with digits; the Telugu demo line shows its English meaning
SHOW = {9: "Run it. The first time, it downloads the voice: 313 MB.", 11: "Wi-Fi off: 1.4 seconds for a 4-second sentence.",
        14: "\"Namaskaram! This voice was made on a laptop, with no internet.\"", 16: "28 seconds a sentence, and 5 GB of memory. Still free, still offline."}
SHOW_TE = {2: "Who's inside Chintu's laptop?! The Wi-Fi is off!", 3: "Nobody. A free voice model, running on the laptop itself.",
           4: "Free? I pay an app every month for my offer announcements!", 5: "Step one: install it.", 6: "Type it?! I type with one finger!",
           7: "Then copy this. 7 lines. Your sentence goes here.", 8: "And then?", 10: "And after that, no internet?",
           11: "Wi-Fi off: under 1.5 seconds for a 4-second sentence.", 12: "But my customers speak Telugu!",
           13: "This one doesn't speak Telugu. For Telugu: Indic Parler TTS. You describe the voice in words.",
           15: "Telugu! How long did that take?", 16: "28 seconds a sentence, 5 GB of memory. Still free, offline.", 17: "Chintu! Save this!"}
# n: groups of words, one of each group must be heard (English: Whisper's words; Telugu: substrings of its Devanagari)
MUST_EN = {2: [("chintu", "chintu's"), ("laptop",), ("wi", "wifi", "wi-fi"), ("off",)], 3: [("nobody",), ("free",), ("voice",), ("laptop",)],
           4: [("free",), ("app",), ("month",), ("offer",)], 5: [("step",), ("install",)], 6: [("type",), ("finger",)],
           7: [("copy",), ("seven", "7"), ("lines", "line"), ("sentence",)], 8: [("then",)], 9: [("run",), ("first",), ("downloads", "download"), ("three", "313"), ("megabytes", "megabyte", "mb")],
           10: [("after",), ("internet",)], 11: [("wi", "wifi", "wi-fi"), ("off",), ("point", "1.4"), ("four", "4"), ("seconds", "second", "sentence")],
           12: [("customers", "customer"), ("telugu",)], 13: [("telugu",), ("parler", "parlor", "parla"), ("describe",), ("voice",), ("words", "word")],
           15: [("telugu",), ("long",)], 16: [("twenty", "28"), ("eight", "28"), ("gigabytes", "gigabyte", "gb"), ("free",), ("offline",)],
           17: [("chintu",), ("save",)]}
MUST_TE = {2: [("चिंट", "चिन्ट", "चींट", "चिंटू"), ("वाइफ", "वाईफ", "वैफ", "वायफ")], 3: [("फ्री", "फ्रि", "free"), ("वाइस", "वॉइस", "वायस", "voice")],
           4: [("ऑफर", "आफर", "ओफर", "offer"), ("यॉप", "याप", "ऐप", "एप")], 5: [("इंस्ट", "इन्स्ट", "इनस्ट", "install")], 6: [("टैप", "टाइप", "ताइप", "टाईप")],
           7: [("कॉपी", "कापी", "copy"), ("लाइन", "लैन", "लाईन")], 9: [("डाउन", "डौन", "down"), ("एंबी", "एम्बी", "एमबी", "mb")],
           10: [("इंटर", "इन्टर", "अंटर")], 11: [("वाइफ", "वाईफ", "वैफ", "वायफ"), ("सेकन", "सेकें", "सेकंड")], 12: [("तेलुग", "तेलगु", "टेलुग")],
           13: [("तेलुग", "तेलगु", "टेलुग"), ("पार्ल", "पारल", "पार्लर", "पालर")], 15: [("तेलुग", "तेलगु", "टेलुग")],
           16: [("इरवै", "इरवई", "इर्वै"), ("जीबी", "जी बी", "gb"), ("फ्री", "फ्रि", "free")], 17: [("चिंट", "चिन्ट", "चींट"), ("सेव", "सेफ", "save")]}
TEMPO = {"ravi": 1.2, "ai": 1.16, "laptop": 1.0}
# Sound (CLAUDE.md arc): a light hit and a pop with the laptop's voice on frame 1; keyboard ticks under the terminal
# screens; a lift into each step; a hit on the offline number; a riser into the Telugu demo with the bed dropped out
# under it (the payoff); a success sting on Ravi's "Telugu!"; a rise into "Save this!" and a hit on the checklist.
SCENES = [("h_a", (1, 2, 3, 4), {"boost": 1.5, "tail": 0.1}),
          ("h_b", (5, 6, 7, 8, 9, 10, 11), {"lift": 0.6, "pre": 0.3, "boost": 1.4, "tail": 0.1}),
          ("h_c", (12, 13, 14, 15, 16, 17), {"lift": 0.6, "pre": 0.3, "outro": True, "boost": 1.45, "rise": 1.3, "tail": 0.0})]
GAP = {1: 0.25, 5: 0.6, 7: 0.5, 9: 0.6, 11: 0.7, 13: 0.4, 14: 0.4, 16: 0.7}   # the screens' reads
DUCK_DEMO = 0.25   # the bed under the laptop's demo lines (the voice is the point)
YT = {"h_a": "The laptop talks, no internet", "h_b": "Kokoro: install, code, run", "h_c": "Telugu: Indic Parler-TTS"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto01te" if te else "howto01v1"
    s = {"id": sid, "title": "HOW TO 01: an AI voice on your laptop, free and offline" + (" (Telugu audio)" if te else ""), "label": "HOW TO 01",
         "banner": "AI voice on your laptop, offline", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.46, 0.9], "musicFade": 0.05, "endPad": 0.8, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "musicGapGain": 3.0, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.12 if te else 1.15, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            text = tel if te else en
            show = (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).strip())
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": text, "show": show, "maxgap": 0.28, "gap": GAP.get(n, 0.16),
                  "tempo": TEMPO[who]}
            if who == "laptop":   # the demo file as it came out: no squeeze, no tempo
                ln.update({"demo": DEMO[n], "maxgap": 2.0, "tempo": 1.0})
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            g = (-1.0 if who == "ai" else 0.5 if who == "ravi" else 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        sc = {"id": scid, "type": "sk_howto", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
              "data": data, "lines": lines}
        demo_i = [i for i, n in enumerate(ns) if LINES[n][0] == "laptop"]
        if demo_i:   # the bed sits low under the demo voice (a duck between the line's start and end cues)
            sc["duck_lines"] = [[i, DUCK_DEMO] for i in demo_i]
        scenes.append(sc)
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
