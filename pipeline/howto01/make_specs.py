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

# Each line: (who, shot, prop, spoken text, English caption or None). shot: "wide" or "ravi" (the shop) or "laptop" (the
# laptop screen fills the frame). prop: what the line brings on (HowtoCrayon.tsx). The Telugu reel opens on the Telugu
# voice and plays the English demo at step 3 (script review: the Telugu voice came at 0:45 with no steps behind it).
OFFER = "రవి కిరాణా లో దీపావళి ఆఫర్! ప్రతి కొనుగోలు మీద పది శాతం తగ్గింపు."
HELLO = "Hello! This voice was made on a computer, with no internet."
OFFER_SHOW = "\"Diwali offer at Ravi Kirana! 10% off every purchase.\""
L_EN = [
    ("laptop", "wide", "hook", HELLO, None),
    ("ravi", "ravi", "who", "Who's talking? The Wi-Fi is off!", None),
    ("ai", "wide", "nobody", "Kokoro: a free voice model, running on Chintu's laptop.", None),
    ("ravi", "ravi", "pay", "Free? I pay an app every month for my announcements!", None),
    ("ai", "laptop", "install", "Step one: install it. Only two commands.", None),   # "two install commands" was heard "to install commands"
    ("ravi", "ravi", "type", "Type them?! I type with one finger!", None),
    ("ai", "laptop", "code", "Then copy them from the caption. Five lines. [1] Your words go here.", "Then copy them from the caption. 5 lines. Your words go here."),
    ("ai", "laptop", "run", "Run it. The first time, it downloads the voice: 313 MB.", None),
    ("ravi", "ravi", "after", "And after that, no internet?", None),
    ("ai", "laptop", "offline", "None. Once it's loaded: [1] about one second for a four-second line.", "None. Once it's loaded: about 1 second for a 4-second line."),
    ("ravi", "ravi", "telugu", "But my customers speak Telugu!", None),
    ("ai", "laptop", "parler", "For Telugu: Indic Parler TTS. Free login, accept the terms, [1] then describe the voice in words.", None),
    ("ravi", "ravi", "parlour", "Parler? Like beauty parlour?", None),
    ("ai", "laptop", "french", "French, for \"to speak\". Listen.", None),
    ("laptop", "laptop", "tedemo", OFFER, OFFER_SHOW),
    ("ravi", "ravi", "myoffer", "That's my Diwali offer! How long did it take?", None),
    ("ai", "laptop", "slow", "About thirty seconds a line, [1] and almost five GB of memory.", "About 30 seconds a line, and almost 5 GB of memory."),
    ("ravi", "ravi", "cancel", "Slow, but free! That app is cancelled!", None),
    ("ai", "laptop", "verdict", "English: Kokoro. Telugu: Indic Parler. Eight GB of RAM, no graphics card.", "English: Kokoro. Telugu: Indic Parler. 8 GB of RAM, no graphics card."),   # "any computer" overclaimed one test machine (render review)
    ("ravi", "wide", "save", "Chintu! Save this!", None),
]
L_TE = [
    ("laptop", "wide", "hook", OFFER, OFFER_SHOW),
    ("ravi", "ravi", "who", "నా ఆఫర్ ఎవరు చెప్తున్నారు?! వైఫై కూడా ఆఫ్!", "Who's announcing my offer?! The Wi-Fi is off!"),
    ("ai", "wide", "nobody", "చింటూ ల్యాప్‌టాప్ అండి. | తెలుగుకి ఇండిక్ పార్లర్, ఇంగ్లీష్ కి కోకోరో. రెండూ ఫ్రీ.", "Chintu's laptop. <pause 0.25> Indic Parler for Telugu, Kokoro for English. Both free."),   # two takes: Parler dropped the first sentence, then "ఫ్రీ వాయిస్ మోడల్స్" (Ravi answers "free?!", so it goes last)
    ("ravi", "ravi", "pay", "ఫ్రీనా?! నేను ప్రతి నెలా ఒక యాప్ కి కడుతున్నా!", "Free?! I pay an app every month!"),
    ("ai", "laptop", "install", "ముందు ఇంగ్లీష్ ది. పైథాన్ ఉంటే, రెండు ఇన్‌స్టాల్ కమాండ్లు.", "First the English one. If you have Python: two install commands."),   # not "సులువు" (easy): both render viewers (not on Windows; the sticky says Python first)
    ("ravi", "ravi", "type", "టైప్ చెయ్యాలా?! నేను ఒక్క వేలితో టైప్ చేస్తా!", "Type them?! I type with one finger!"),
    ("ai", "laptop", "code", "క్యాప్షన్ లో నుంచి కాపీ చేయండి. ఐదు లైన్లు. [1] చెప్పాల్సింది ఇక్కడ రాయండి.", "Copy them from the caption. 5 lines. Write your words here."),
    ("ai", "laptop", "run", "రన్ చేయండి. మొదటిసారి వాయిస్ డౌన్‌లోడ్ అవుతుంది: మూడు వందల పదమూడు ఎంబీ.", "Run it. The first time, it downloads the voice: 313 MB."),
    ("laptop", "laptop", "endemo", HELLO, None),
    ("ravi", "ravi", "after", "ఆ తర్వాత ఇంటర్నెట్ అక్కర్లేదా?", "And after that, no internet?"),
    ("ai", "laptop", "offline", "అక్కర్లేదండి. లోడ్ అయ్యాక, [1] నాలుగు సెకన్ల లైన్ కి దాదాపు ఒక్క సెకను.", "None. Once it's loaded: about 1 second for a 4-second line."),
    ("ravi", "ravi", "telugu", "మరి నా తెలుగు ఆఫర్?", "And my Telugu offer?"),
    ("ai", "laptop", "parler", "తెలుగుకి ఇండిక్ పార్లర్. ఫ్రీ లాగిన్, షరతులు ఒప్పుకోండి, [1] గొంతు ఎలా ఉండాలో మాటల్లో రాయండి.", "For Telugu: Indic Parler. Free login, accept the terms, then describe the voice in words."),
    ("ravi", "ravi", "parlour", "పార్లర్? బ్యూటీ పార్లరా?", "Parler? Like beauty parlour?"),
    ("ai", "laptop", "french", "కాదండి. ఫ్రెంచ్ లో పార్లర్ అంటే మాట్లాడటం.", "No. Parler means \"to speak\" in French."),
    ("ravi", "ravi", "myoffer", "సరే, ఎంత టైం పడుతుంది?", "Okay, how long does it take?"),
    ("ai", "laptop", "slow", "ముప్పై సెకన్లు, ఒక్కో లైన్ కి. [1] దాదాపు ఐదు జీబీ ర్యామ్.", "30 seconds a line. Almost 5 GB of RAM."),   # the number right after the drop; RAM, not "మెమరీ" (heard as storage)
    ("ravi", "ravi", "cancel", "నెమ్మది... కానీ ఫ్రీ! ఆ యాప్ కట్!", "Slow... but free! That app is cancelled!"),
    ("ai", "laptop", "verdict", "తెలుగుకి ఇండిక్ పార్లర్, ఇంగ్లీష్ కి కోకోరో. | ఎనిమిది జీబీ ర్యామ్, గ్రాఫిక్స్ కార్డ్ అక్కర్లేదు.", "Telugu: Indic Parler. English: Kokoro. <pause 0.25> 8 GB of RAM, no graphics card."),   # Telugu first: mid-sentence, four takes said "తిలుగుకి"
    ("ravi", "wide", "save", "చింటూ! ఇది సేవ్ చెయ్!", "Chintu! Save this!"),
]
DEMO = {HELLO: "series/scripts/howto01_demo/0.wav", OFFER: "series/scripts/howto01_demo/offer_1.wav"}
# English spoken forms (by prop)
TTS_EN = {"run": "Run it. The first time, it downloads the voice: three hundred and thirteen megabytes.",
          "parler": "For Telugu: Indic Parlay T T S. Free login, accept the terms, [1] then describe the voice in words.",   # "Parler" was heard "Indikpala"; parler is French, "par-lay"
          "slow": "About thirty seconds a line, [1] and almost five gigabytes of memory.",
          "verdict": "English: Kokoro. Telugu: Indic Parlay. Eight gigabytes of RAM, no graphics card."}
# by prop: groups of words, one of each group must be heard (English: Whisper's words; Telugu: substrings of its Devanagari)
MUST_EN = {"who": [("talking",), ("wi", "wifi", "wi-fi"), ("off",)], "nobody": [("kokoro", "cocoro", "kokorro", "cocorro"), ("free",), ("voice",), ("laptop",)],
           "pay": [("free",), ("app",), ("month",), ("announcements", "announcement")], "install": [("step",), ("install",), ("only",), ("commands", "command")],
           "type": [("type",), ("finger",)], "code": [("copy",), ("caption",), ("five", "5"), ("words", "word")],
           "run": [("run",), ("first",), ("downloads", "download"), ("three", "313"), ("megabytes", "megabyte", "mb")], "after": [("after",), ("internet",)],
           "offline": [("none",), ("loaded", "load"), ("second", "seconds"), ("four", "4"), ("line",)], "telugu": [("customers", "customer"), ("telugu",)],
           "parler": [("telugu",), ("parler", "parlor", "parla", "parlour", "parlay", "parle", "parley", "palay", "palae", "pale"), ("login", "log"), ("terms", "term"), ("describe",), ("voice",)],
           "parlour": [("parlour", "parlor", "parler"), ("beauty",)], "french": [("french",), ("speak",), ("listen",)],
           "myoffer": [("diwali",), ("offer",), ("long",)], "slow": [("thirty", "30"), ("line",), ("five", "5"), ("memory",)],
           "cancel": [("slow",), ("free",), ("app",), ("cancelled", "canceled", "cancel")],
           "verdict": [("english",), ("kokoro", "cocoro"), ("telugu",), ("parler", "parlor", "parla", "parlay", "parle", "parley", "palay", "palae", "pale"), ("eight", "8", "8gb"), ("ram", "graphics")], "save": [("chintu",), ("save",)]}
MUST_TE = {"who": [("फर", "offer"), ("फाइ", "फाई", "फ़ाइ", "फै")], "nobody": [("चिं", "चिन", "चीं")],
           "nobody2": [("पार", "पाल", "parl"), ("कोक", "कोको", "koko"), ("फ्र", "फिर", "free")],
           "pay": [("फ्र", "free"), ("याप", "यॉप", "ऐप", "एप", "याब")], "install": [("इंग", "इन्ग", "इंगि"), ("पै", "पाइ", "पाय", "pyth", "पेथ"), ("स्टा", "स्टॉ", "stal")],
           "type": [("टैप", "टाइप", "ताइप", "टाईप", "टेप")], "code": [("प्श", "प्ष", "caption"), ("कॉप", "काप", "कोप", "copy")],
           "run": [("डाउ", "डौ", "down"), ("बी", "mb")], "after": [("टर", "टार")], "offline": [("लोड", "लोड़", "लोर"), ("सेक", "सैक")],
           "telugu": [("तेल", "टेल"), ("फर", "offer")], "parler": [("पार", "पाल"), ("लॉग", "लोग", "लाग", "login")],
           "parlour": [("पार", "पाल"), ("ब्यू", "बियू", "बू", "ब्यु")], "french": [("फ्रें", "फ्रैं", "फ्रेन", "फ़्रें", "french")],
           "myoffer": [("टैम", "टाइम", "टाईम", "टेम")], "slow": [("मुप", "मुब", "मूप", "मोप", "30"), ("जी", "gb"), ("याम", "राम", "रैम", "रेम", "ram")],
           "cancel": [("फ्र", "free"), ("याप", "यॉप", "ऐप", "एप", "याब")], "verdict": [("तेल", "टेल"), ("पार", "पाल"), ("कोक", "को को", "कोको")], "verdict2": [("र्याम", "रैम", "राम", "ram"), ("ग्रा", "ग्रॅ", "graph")],
           "save": [("चिं", "चिन", "चीं"), ("सेव", "सेफ", "सेब", "save")]}   # short substrings: Whisper's Devanagari for Telugu varies (EP36, skit05);
# "Telugu" itself must be heard "तेल"/"टेल": takes heard "थिलगो"/"तिलगु" said "తిల్గో" (second render review)
TEMPO = {"ravi": 1.2, "ai": 1.16, "laptop": 1.0}
TEMPO_PROP_TE = {"telugu": 1.0}   # "మరి నా తెలుగు ఆఫర్?" at its own speed: sped up 1.2x, "తెలుగు" was heard "తిల్గో"
# Sound (CLAUDE.md arc): a hit and a pop with the laptop's voice on frame 1; keyboard ticks under the terminal screens;
# a lift into each step; a hit on the offline number; a riser into the Telugu demo with the bed down under it (the
# payoff); a success sting on "That's my offer!"; a rise into "Save this!" and a hit on the checklist.
SCENES = {"en": [("h_a", 0, 4, {"boost": 1.5, "tail": 0.1}), ("h_b", 4, 10, {"lift": 0.6, "pre": 0.3, "boost": 1.4, "tail": 0.1}),
                 ("h_c", 10, 20, {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.42, "rise": 1.26, "drop_pre": [[6, 0.0, 0.5]], "tail": 0.0})],   # 6: the beat of silence before "About thirty seconds"
          "te": [("h_a", 0, 4, {"boost": 1.5, "tail": 0.1}), ("h_b", 4, 11, {"lift": 0.6, "pre": 0.3, "boost": 1.4, "tail": 0.1}),
                 ("h_c", 11, 20, {"lift": 1.0, "pre": 0.7, "outro": True, "boost": 1.42, "rise": 1.4, "drop_pre": [[5, 0.0, 0.5]], "tail": 0.0})]}   # pre 0.7: the hit
# decays before "మరి నా తెలుగు ఆఫర్?" (it blurred "తెలుగు"); rise 1.4 and END_GAIN_TE: the bed builds into the save card (render review)
GAP = {"hook": 0.25, "install": 0.6, "code": 0.5, "run": 0.4, "endemo": 0.4, "offline": 0.7, "parler": 0.4, "tedemo": 0.4, "myoffer": 0.5, "slow": 0.6, "verdict": 0.8}   # the screens' reads
GAIN_PROP = {"parler": 0.3, "french": 1.0, "slow": 1.4, "verdict": 1.0, "save": 0.8}   # the rising last scene: 6.8-7.4 dB over the bed
GAIN_PROP_TE = {"hook": 3.0, "install": 0.5, "telugu": 1.3, "cancel": 0.5, "verdict": 1.5, "save": 2.0}   # Telugu: 8+ dB over the bed; the hook's
# demo voice up 3 dB (the first 3 s were the quietest of the reel)
END_GAIN_TE = [0.93, 7.0]   # [fraction of the reel, dB]: the bed swells from the end of the verdict line into the save card
DUCK_DEMO = 0.1   # the bed under the laptop's demo lines (the voice is the point; 0.25 didn't read as a drop)
DUCK_HOOK_TE = 0.6   # the Telugu hook (a demo line) on a soft bed: at 0.1 it opened on near-silence (render review)
DUCK_PROP_TE = {"save": 0.85}   # "Save this!" stays 8 dB over the swelling bed
YT = {"h_a": "The laptop talks, no internet", "h_b": "Kokoro: install, code, run", "h_c": "Telugu: Indic Parler-TTS"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto01te" if te else "howto01v1"
    L = L_TE if te else L_EN
    s = {"id": sid, "title": "HOW TO 01: an AI voice on your laptop, free and offline" + (" (Telugu audio)" if te else ""), "label": "HOW TO 01",
         "banner": "AI voice on your laptop, offline", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.46, 0.9], "musicFade": 0.05, "endPad": 2.6, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "musicGapGain": 3.0, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.12 if te else 1.15, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "musicEndRamp": END_GAIN_TE})
    scenes = []
    for scid, a, b, flags in SCENES[lang]:
        lines, beats = [], []
        for k in range(a, b):
            n = k + 1
            who, shot, prop, text, show = L[k]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": text, "show": show or MARK.sub("", text).strip(), "maxgap": 0.28,
                  "gap": GAP.get(prop, 0.16), "tempo": TEMPO[who]}
            if who == "laptop":   # the demo file as it came out: no squeeze, no tempo
                ln.update({"demo": DEMO[text], "maxgap": 2.0, "tempo": 1.0})
                if te and prop == "endemo":   # the card already shows the quote (second review: on screen twice)
                    ln["nocap"] = True
            else:
                ln["must"] = (MUST_TE if te else MUST_EN).get(prop, [])
            if te and prop in TEMPO_PROP_TE:
                ln["tempo"] = TEMPO_PROP_TE[prop]
            if not te and prop in TTS_EN:
                ln["tts"] = TTS_EN[prop]
            if " | " in ln["text"]:   # two takes (Parler drops a long line's first sentence), joined by a short pause
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.25> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.25, "must2": (MUST_TE if te else MUST_EN).get(prop + "2", [])})
            g = (-1.0 if who == "ai" else 0.5 if who == "ravi" else 0.0) + GAIN_PROP.get(prop, 0.0) + (GAIN_PROP_TE.get(prop, 0.0) if te else 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        sc = {"id": scid, "type": "sk_howto", "tail": flags.get("tail", 0.2), **{k2: v for k2, v in flags.items() if k2 != "tail"},
              "data": data, "lines": lines}
        demo_i = [i for i, ln in enumerate(lines) if ln["who"] == "laptop"]
        if demo_i:   # the bed sits low under the demo voice
            sc["duck_lines"] = [[i, DUCK_HOOK_TE if te and beats[i]["prop"] == "hook" else DUCK_DEMO] for i in demo_i]
        if te:
            sc["duck_lines"] = sc.get("duck_lines", []) + [[i, DUCK_PROP_TE[b["prop"]]] for i, b in enumerate(beats) if b["prop"] in DUCK_PROP_TE]
        scenes.append(sc)
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
