# EP39 "The 17-second reply" (inference: speed, latency and cost per token): writes reels/ep39v1.json (English) and
# reels/ep39te.json (Telugu). Lines come from the script (series/scripts/ep39_17_second_reply.md); [n] marks the words
# the pictures wait for; " | " splits a line into two takes. Voices: pipeline/ep39/voice.py (as EP38's). Numbers: our
# test (series/scripts/ep39_demo), the OpenAI and Google price lists, Artificial Analysis.
#   python3 pipeline/ep39/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi"), or an insert
# ("clock": the READ/WRITE bar, "tokens": the token chips, "bags": the counter, "cloud": the online AI, "price": the
# price list, "screen": the phone's test card, "wait": the READ bar growing). prop: what the line brings on (SpeedCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "Seventeen seconds for one reply?! [1] He cancelled!", "ఒక్క రిప్లైకి పదిహేడు సెకన్లా?! [1] ఆర్డర్ క్యాన్సిల్ చేశారు!"),
    2: ("ai", "clock", "clock", "Four seconds to read his order. [1] Thirteen to write the reply.",
        "ఆర్డర్ చదవడానికి నాలుగు సెకన్లు. | [1] రిప్లై రాయడానికి పదమూడు."),
    3: ("ravi", "ravi", "reply", "Thirteen seconds to write that?!", "అది రాయడానికి పదమూడు సెకన్లా?!"),
    4: ("ai", "tokens", "tokens", "I write one token at a time, anna. [1] A word, or a piece of one.",
        "నేను ఒక్కో టోకెన్ రాస్తానండి. | [1] ఒక మాట, లేదా మాటలో చిన్న ముక్క."),   # "ఒక ముక్క" smeared into "okham mukham"
    5: ("ravi", "ravi", "faster", "Pieces?! [1] Write faster!", "ముక్కలా?! [1] స్పీడ్ గా రాయి!"),
    6: ("ai", "bags", "bags", "For every token, I lift all five bags. [1] On this laptop: four tokens a second.",
        "ప్రతి టోకెన్ కీ ఐదు బస్తాలూ ఎత్తుతా. | [1] ఈ ల్యాప్టాప్ లో సెకనుకు నాలుగు టోకెన్లు."),   # no zero-width joiners: Parler trips on them
    7: ("ravi", "ravi", "online", "The online AI replies in one second!", "ఆన్లైన్ లో అయితే ఒక్క సెకనులోనే రిప్లై వస్తుంది!"),   # "ఏయ్ ఐ" stretched to "aaa-ee ai"; "దాంట్లో" sounded off
    8: ("ai", "cloud", "cloud", "Big graphics cards: two hundred tokens a second. [1] But online, every token costs money.",
        "పెద్ద గ్రాఫిక్స్ కార్డులు, సెకనుకు రెండొందల టోకెన్లు. | [1] కానీ ఆన్లైన్ లో ప్రతి టోకెన్ కీ డబ్బులు."),
    9: ("ravi", "ravi", "money", "Money?! [1] For my message, or its reply?", "డబ్బులా?! [1] నా మెసేజ్ కా, దాని రిప్లై కా?"),
    10: ("ai", "price", "price", "Both. [1] A token it writes costs four to eight times more.",   # render review: 4-8x is per token (per reply 2.5-5x)
         "రెండిటికీ. | [1] అది రాసే ప్రతి టోకెన్ కీ నాలుగు నుంచి ఎనిమిది రెట్లు ఎక్కువ."),
    11: ("ravi", "wide", "rule", "Then write less! [1] Two short lines!", "అయితే తక్కువ రాయి! [1] రెండు చిన్న లైన్లు!"),
    12: ("ai", "screen", "test", "Thirty-five tokens. [1] Twelve seconds here. Online, a smaller bill.",
         "ముప్పై ఐదు టోకెన్లు. | [1] ఇక్కడ పన్నెండు సెకన్లు, ఆన్లైన్ లో బిల్లు తక్కువ."),
    13: ("ravi", "wide", "history", "Better! [1] Now read all his old chats first, so you know him!",
         "బాగుంది! [1] ఇప్పుడు ఆయన పాత మెసేజ్లన్నీ ముందు చదువు, ఆయన గురించి తెలుస్తుంది!"),
    14: ("ai", "wait", "wait", "A whole month? [1] I read it all before my first word.", "నెల మొత్తమా? | [1] అదంతా చదివాకే నా మొదటి మాట."),
    15: ("ravi", "wait", "quiz", "How long?!", "ఎంతసేపు?!"),   # the quiz holds after it
    16: ("ai", "wait", "reveal", "Ninety-two seconds.", "తొంభై రెండు సెకన్లు."),
    17: ("ai", "wait", "loop", "Give me a two-line note about him, [1] not the whole month.",   # render review 2: the fix flashed past unsaid
         "ఆయన గురించి రెండు లైన్ల నోట్ ఇవ్వండి, | [1] నెల మొత్తం కాదు."),   # into frame 1 (loops)
}
TTS_EN = {10: "Both, [1] and a token it writes costs four to eight times more."}   # English spoken forms ("Both." alone was dropped in 4 of 4 takes)
SHOW = {   # captions with digits; "..." keeps a key number off screen until it is said
    1: "17 seconds for one reply?! He cancelled!", 2: "4 seconds to read his order... 13 to write the reply.",
    3: "13 seconds to write that?!", 4: "I write one token at a time. A word, or a piece of one.",   # "time, anna." left "anna." alone on screen
    6: "For every token, I lift all 5 bags. On this laptop: 4 tokens a second.",
    7: "The online AI replies in 1 second!", 8: "Big graphics cards: 200 tokens a second. But online, every token costs money.",
    10: "Both... A token it writes costs 4 to 8 times more.", 11: "Then write less! 2 short lines!",
    12: "35 tokens... 12 seconds here. Online, a smaller bill.", 16: "92 seconds.", 17: "Give me a 2-line note about him, not the whole month.",
}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "17 seconds for one reply?! The order got cancelled!", 2: "4 seconds to read the order... 13 to write the reply.",
    3: "13 seconds to write that?!", 4: "I write one token at a time. One word, or a small piece of a word.", 5: "Pieces?! Write fast!",
    6: "For every token I lift all 5 sacks. On this laptop, 4 tokens a second.", 7: "Online, the reply comes in 1 second!",
    8: "Big graphics cards, 200 tokens a second. But online, every token costs money.", 9: "Money?! For my message, or its reply?",
    10: "For both... Each token it writes costs 4 to 8 times more.", 11: "Then write less! 2 short lines!",
    12: "35 tokens... Here 12 seconds, online a smaller bill.", 13: "Good! Now first read all his old messages, you'll know him!",
    14: "The whole month? Only after reading it all, my first word.", 15: "How long?!", 16: "92 seconds.",
    17: "Give me a 2-line note about him, not the whole month.",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"ravi": 1.15, "ai": 1.1}
TEMPO_TE = {"ravi": 1.15, "ai": 1.1}
TEMPO_LINE_TE = {7: 1.05, 8: 1.15, 12: 1.15}   # 7: it sounded rushed at 1.15   # the Telugu cut ran 60.3 s: its middle scene a beat shorter
# Sound (CLAUDE.md arc): a hit, the error buzz and the stopwatch's ticks on frame 1; a ding as WRITE starts; pops as the
# tokens land; a bonk on each token the bags lift (4 a second); a cha-ching on the bill; a drop before "four to eight" and
# a cha-ching on the price list; a snap on the rule; a success sting on our test; a riser into the twist, the clock
# ticking while it reads, the quiz's tick-tock 3-2-1 with a riser, the bed out on the 1, the hit on "Ninety-two", the
# biggest hit as the chat slams back in (the loop). Only the last scene rises.
SCENES = [("s_a", (1, 2, 3, 4, 6), {"boost": 1.25, "tail": 0.05}),   # 5 ("Pieces?! Write faster!") cut for the fix line (render review 2)   # 0.05: the scene ends a beat earlier (beatSnap)   # render review: the bed never built; the scenes now step up
          ("s_b", (7, 8, 9, 10, 11, 12), {"lift": 0.8, "pre": 0.25, "boost": 1.35, "drop_at": [[3, "1", 0.3]], "tail": 0.1}),   # a drop before "four to eight"
          ("s_c", (13, 14, 15, 16, 17), {"lift": 0.9, "pre": 0.3, "outro": True, "boost": 1.5,   # 1.2 felt flat (render review 2); 1.55 + a rise had buried the lines
                                     "drop_pre": [[3, 0.05, 1.0]], "tail": 0.0})]   # the bed out on the quiz's "1", silence before "Ninety-two"; 1.2 s held on 1:32, then the slam
GAP = {1: 0.12, 2: 0.2, 4: 0.2, 6: 0.0, 8: 0.2, 10: 0.45, 11: 0.3, 12: 0.4, 13: 0.25, 14: 0.2, 15: 2.45, 16: 0.3}   # 10: room to read the price chip; 11: the rule chip; 12: the test card; 15: the quiz holds for its 3-2-1
GAP_TE = {12: 0.3}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_b": {"tail": 0.0}}   # with GAP_TE, the Telugu middle scene ends a beat earlier (60.3 -> 59.7 s)
YT = {"s_a": "17 seconds for one reply", "s_b": "Which tokens cost more?", "s_c": "The wait before the first word"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep39te" if te else "ep39v1"
    s = {"id": sid, "title": "The 17-second reply (EP39: speed, latency and cost per token)" + (" (Telugu audio)" if te else ""), "label": "EP39",
         "banner": "AI speed and cost", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps: 0.36 sat 12-18 dB under the voice (CLAUDE.md: 8-12); 0.9 in gaps pumped
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line (the hard switch sounded choppy)
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.93, 3.5], "hardCuts": True, "beatSnap": True,   # the end swell: after "Ninety-two seconds", under the held 1:32, into the slam
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
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = 0.25
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
        scenes.append({"id": scid, "type": "sk_speed", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
