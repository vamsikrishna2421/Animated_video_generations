# HOW TO 02 "Make AI reply faster: 3 settings": writes reels/howto02v1.json (English) and reels/howto02te.json (Telugu).
# Script: series/scripts/howto02_faster_replies.md (v2). Ravi anna's phone job: his AI app takes 71 s for a two-line
# WhatsApp message; the shop AI walks him through three settings. Every number on screen comes from our run
# (series/scripts/howto02_demo/results.json, the summary's medians), read here and passed to FasterCrayon.tsx.
# Voices: pipeline/howto02/voice.py. [n] marks the words a picture waits for; " | " splits a line into two takes.
#   python3 pipeline/howto02/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = json.loads((ROOT / "series/scripts/howto02_demo/results.json").read_text())["summary"]
NUMS = {k: {"whole": v["whole_s"], "reading": v["reading_s"], "ready": v["ready_to_send"]} for k, v in DEMO.items()}

# Each line: (who, shot, prop, English, Telugu, English caption for the Telugu reel). shot: "wide"/"ravi" (the shop) or
# "app" (his phone's AI app fills the frame). prop: what the line brings on (FasterCrayon.tsx).
L = [
    ("ravi", "app", "hook", "Seventy-one seconds [1] for a two-line WhatsApp message?!",
     "రెండు లైన్ల వాట్సాప్ మెసేజ్ కి [1] డెబ్బై ఒక్క సెకన్లా?!", "71 seconds for a two-line WhatsApp message?!"),
    ("ai", "wide", "three", "With three settings, [1] the same message took five seconds.",
     "మూడు చిన్న మార్పులతో, [1] అదే మెసేజ్ ఐదు సెకన్లలో వచ్చింది.", "With three small changes, the same message came in 5 seconds."),   # "సెట్టింగ్స్" was heard "sticks" in four takes
    ("ai", "app", "step1", "One: [2] less thinking. [1] Seventy-one seconds, down to fifteen.",
     "ఒకటి: [2] థింకింగ్ తగ్గించండి. | [1] టైం: డెబ్బై ఒక్క సెకన్ల నుంచి [3] పదిహేను సెకన్లకి.",
     "One: less thinking. <pause 0.25> Time: from 71 seconds to 15."),   # Telugu: "మొదటిది" can be heard with a doubled d (a vulgar word): "ఒకటి"   # the first setting's number by ~10 s (Bujji); the menus next
    ("ai", "app", "step1m", "Instant on ChatGPT, Flash on Gemini, [1] low effort on Claude.",
     "చాట్ జీపీటీ: ఇన్స్టంట్. జెమిని: ఫ్లాష్. [1] క్లాడ్: తక్కువ ఆలోచన.", "ChatGPT: Instant. Gemini: Flash. Claude: Effort Low."),   # render review: the pause fell after "లో", pairing Instant with Gemini   # the voice can't say "ఎఫర్ట్" (8 takes: "apt", "apwart"): it says "less thinking", the screen and caption name the tap
    ("ravi", "ravi", "thinking", "All that thinking, [1] just for \"shop closed\"?!",
     "\"షాప్ బంద్\" కి [1] అంత ఆలోచనా?!", "All that thinking, for \"shop closed\"?!"),
    ("ai", "app", "step2", "Two: [2] ask for a short reply. \"Keep it to two short lines.\" [1] Fifteen seconds, down to five.",
     "రెండో సెట్టింగ్: చిన్న రిప్లై. ఇలా రాయండి: | [1] తెర మీద ఉన్న లైన్. పదిహేను సెకన్ల నుంచి ఐదు సెకన్లకి.",
     "Second setting: a short reply. Type this: <pause 0.25> the line on the screen. From 15 seconds to 5."),   # said alone, the first half rushed "రిప్లై" (3 takes)   # the English line in Telugu script came out as babble; the screen shows it
    ("ai", "app", "step3", "Three: [2] new topic, new chat. [1] In a month-long chat, the same job took [3] over two minutes.",
     "మూడోది: కొత్త విషయానికి కొత్త చాట్. | [1] నెల రోజుల చాట్ లో, అదే పనికి [3] డబుల్ టైం పట్టింది.",
     "Third: a new topic, a new chat. <pause 0.25> In a month-long chat, the same job took double the time."),   # "రెండు నిమిషాలు" was lost in the mix (the voice can't say "నిమిషాలు"); the card: 71 s vs 132 s
    ("ravi", "ravi", "oldname", "But the old chat [1] knew my shop's name!",
     "కానీ పాత చాట్ కి [1] నా షాప్ పేరు తెలుసు!", "But the old chat knew my shop's name!"),
    ("ai", "app", "typename", "So type it in the new chat. [1] One line beats a month of chat.",
     "కొత్త చాట్ లో పేరు రాయండి. [1] ఒక్క లైన్ చాలు.", "Type the name in the new chat. One line is enough."),
    ("ai", "wide", "hard", "Thinking is for hard problems, like maths. [1] For a WhatsApp message, fast is enough.",
     "లెక్కల లాంటి కష్టమైన పనులకే థింకింగ్. | [1] వాట్సాప్ మెసేజ్ కి, తక్కువ థింకింగ్ చాలు.",   # the voice says "ఫాస్ట్" as "past"/"fos" (8 takes)
     "Thinking is only for hard jobs like maths. <pause 0.25> For a WhatsApp message, less thinking is enough."),
    ("ravi", "wide", "save", "Chintu! [1] Save this!", "చింటూ! [1] ఇది సేవ్ చెయ్!", "Chintu! Save this!"),
]
TTS_EN = {"step1m": "Instant on Chat G P T, Flash on Gemini, [1] low effort on Claude.",
          "thinking": "All that thinking, [1] just for shop closed!"}   # the quotes and "?!" came out as a made-up word in two takes
SHOW_EN = {"hook": "71 seconds for a two-line WhatsApp message?!", "three": "With three settings, the same message took 5 seconds.",
           "step1": "One: less thinking. 71 seconds, down to 15.", "step2": "Two: ask for a short reply. \"Keep it to 2 short lines.\" 15 seconds, down to 5.",
           "step3": "Three: new topic, new chat. In a month-long chat, the same job took over 2 minutes."}
# by prop: groups of words, one of each group must be heard (English: Whisper's words; Telugu: substrings of its Devanagari)
MUST_EN = {"hook": [("seventy", "71"), ("seconds", "second"), ("whatsapp",), ("message",)],
           "three": [("three", "3"), ("settings", "setting"), ("five", "5"), ("seconds", "second")],
           "step1": [("less",), ("thinking",), ("seventy", "71"), ("fifteen", "15")],
           "step1m": [("instant",), ("chatgpt", "chat", "gpt"), ("flash",), ("gemini",), ("low",), ("claude", "cloud", "clod")], "thinking": [("thinking",), ("shop",), ("closed", "close")],
           "step2": [("short",), ("reply",), ("lines", "line"), ("fifteen", "15"), ("five", "5")],
           "step3": [("new",), ("chat",), ("month", "monthlong"), ("two", "2"), ("minutes", "minute")],
           "oldname": [("old",), ("chat",), ("shop", "shops"), ("name",)], "typename": [("type",), ("new",), ("line",), ("month",)],
           "hard": [("thinking",), ("hard",), ("maths", "math"), ("whatsapp",), ("fast",)], "save": [("chintu", "chintoo"), ("save",)]}
MUST_TE = {"hook": [("सेक", "सैक", "सकन")], "three": [("मार्प", "मार्पु", "मारपु", "मार्फ"), ("आइदु", "आईदू", "आएदू", "ऐदु", "5")], "step1": [("थिं", "थीं", "थिन", "तिं", "टिं"), ("ओक", "ओका", "वोक", "उक")],
           "step12": [("पदि", "15")], "step1m": [("इन्स", "इंस", "instant"), ("फ्ला", "फ्लै", "फ्लो", "flash"), ("लोच", "लोचन", "आलो")],
           "thinking": [("बंद", "बन्द", "बांद")], "step2": [("रिप्ल", "रिप्लै", "रिफल", "reply")], "step22": [("तेर", "तेरा", "तैर"), ("पदि", "15")],
           "step3": [("चाट", "चैट", "chat")], "step32": [("नेल", "नेला", "नल"), ("डबल", "डबुल", "दबल", "double"), ("टैम", "टाइम", "ताइम", "time")], "oldname": [("पेरु", "पेरू", "पेर")],
           "typename": [("पेरु", "पेरू", "पेर"), ("ओक्क", "वोक्क", "उक्क", "ओका", "वोका"), ("लैन", "लाइन", "लाईन")], "hard": [("थिं", "थीं", "थिन", "तिं", "टिं")], "hard2": [("तक्", "तक"), ("थिं", "तिं", "टिं", "थीं")],
           "save": [("चिं", "चिन", "चीं"), ("सेव", "सेफ", "सेब", "save")]}
TEMPO = {"ravi": 1.2, "ai": 1.16}
# Sound (CLAUDE.md arc): a hit and a pop on frame 1 with the stamp; a stop before "five seconds"; a lift into each step;
# a whoosh on each step card; a stop before each step's number; a rise into "Save this!" and a hit on the checklist.
SCENES = [("h_a", 0, 2, {"boost": 1.5, "tail": 0.1}),
          ("h_b", 2, 6, {"lift": 0.6, "pre": 0.3, "boost": 1.4, "drop_pre": [[0, 0.0, 0.5]], "tail": 0.1}),   # the beat before "One: less thinking. Seventy-one seconds, down to fifteen"
          ("h_c", 6, 11, {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.42, "rise": 1.26, "drop_at": [[0, 3]], "tail": 0.0})]   # the drop before the long chat's number
PAUSES = {"three": {"1": 0.3}, "step1": {"2": 0.25, "3": 0.3}, "step2": {"2": 0.25}, "step3": {"2": 0.25, "3": 0.35}}   # a beat before
# "the same message took five seconds"; render review: a beat after "One / Two / Three", a breath before 15 (Telugu) and before
# the long chat's number (the drop and the hit land in it)
GAP = {"hook": 0.2, "three": 0.35, "step1": 0.5, "step1m": 1.5, "thinking": 0.25, "step2": 0.6, "step3": 0.55, "oldname": 0.4,
       "typename": 0.4, "hard": 1.0}   # hard: the riser into "Chintu! Save this!" sits in the gap
GAIN_PROP = {"hard": 0.5, "save": 0.8}
GAIN_PROP_TE = {"hook": 1.0, "save": 2.0}
END_GAIN_TE = [0.93, 6.0]
END_GAIN_EN = [0.9, 5.0]   # render review: the English last quarter dipped (-20.3 dB after -19.3): the bed swells into the save card
YT = {"h_a": "71 s for a WhatsApp message", "h_b": "Less thinking, short replies", "h_c": "New chat · save this"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto02te" if te else "howto02v1"
    s = {"id": sid, "title": "HOW TO 02: make AI reply faster, 3 settings" + (" (Telugu audio)" if te else ""), "label": "HOW TO 02",
         "banner": "Make AI reply faster", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.46, 0.9], "musicFade": 0.05, "endPad": 4.0, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "musicGapGain": 3.0, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.12 if te else 1.15, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "musicEndRamp": END_GAIN_TE})
    else:
        s["musicEndRamp"] = END_GAIN_EN
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for k in range(a, b):
            n = k + 1
            who, shot, prop, en, tel, show_te = L[k]
            text = tel if te else TTS_EN.get(prop, en)
            show = show_te if te else SHOW_EN.get(prop, MARK.sub("", en).strip())
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": text, "show": show, "maxgap": 0.28,
                  "gap": GAP.get(prop, 0.16), "tempo": TEMPO[who], "must": (MUST_TE if te else MUST_EN).get(prop, [])}
            if not te and prop in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[prop]).strip()
            if prop in PAUSES:
                ln["pauses"] = PAUSES[prop]
            if " | " in ln["text"]:   # two takes (Parler drops a long line's first sentence), joined by a short pause
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.25> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.25, "must2": (MUST_TE if te else MUST_EN).get(prop + "2", [])})
            g = (-1.0 if who == "ai" else 0.5) + GAIN_PROP.get(prop, 0.0) + (GAIN_PROP_TE.get(prop, 0.0) if te else 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "nums": NUMS, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_faster", "tail": flags.get("tail", 0.2), **{k2: v for k2, v in flags.items() if k2 != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
