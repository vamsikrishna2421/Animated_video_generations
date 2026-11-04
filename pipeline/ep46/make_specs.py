# EP46 "Copyright & AI": writes reels/ep46v1.json (English) and reels/ep46te.json (Telugu). Lines come from the script
# (series/scripts/ep46_copyright.md); [n] marks the words the pictures wait for; " | " splits a line into two takes.
# Voices: pipeline/ep46/voice.py.
#   python3 pipeline/ep46/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the corridor ("wide") or a card ("card"). prop: what the line
# brings on (PosterCrayon.tsx).
LINES = {
    1: ("meena", "wide", "hook", "Forty hours of drawing... [1] lost to forty seconds of AI?!", "నలభై గంటలు గీశాను... [1] నలభై సెకన్లలో రోబో గీసిన బొమ్మకి ఓడిపోయానా?!"),
    2: ("rohit", "wide", "rules", "The rules said original! [1] The AI made it brand new!", "రూల్స్ లో ఒరిజినల్ అని ఉంది! [1] రోబో కొత్తగా గీసింది!"),
    3: ("kumar", "wide", "who", "Who wins is the contest's rule. [1] Who owns it is the law's. So whose poster is it?",   # script review: contest rules vs copyright
        "ఎవరు గెలవాలో పోటీ రూల్స్ చెప్తాయి. [1] ఎవరిదో చట్టం చెప్తుంది. ఆ పోస్టర్ ఎవరిది?"),
    4: ("rohit", "wide", "mine", "Mine! I typed the prompt!", "నాదే! ప్రాంప్ట్ టైప్ చేసింది నేనే!"),
    5: ("meena", "card", "allen", "An American's AI picture won an art contest, with six hundred and twenty-four prompts. | [1] The Copyright Office refused it: he claimed the AI's part too.",   # render review: "the US refused" sounded final (he is suing)
        "అమెరికాలో ఒక ఆర్టిస్ట్ ఆరొందల ఇరవై నాలుగు ప్రాంప్ట్ లతో బహుమతి గెలిచాడు. | [1] రోబో చేసిన భాగం కూడా తనదే అన్నాడు; కాపీరైట్ ఆఫీస్ ఒప్పుకోలేదు."),   # "ప్రైజ్" was heard "price"
    6: ("rohit", "wide", "copy", "So anyone can copy my poster?!", "అంటే నా పోస్టర్ ఎవరైనా కాపీ చేయొచ్చా?!"),
    7: ("kumar", "card", "us", "In America, typing prompts doesn't make it yours. Not even six hundred. [1] The parts you made yourself, you can own.",   # render review: say the prompt rule out loud
        "అమెరికాలో, టైప్ చేసినంత మాత్రాన నీది కాదు. [1] నువ్వు సొంతంగా చేసింది మాత్రం నీది."),
    8: ("meena", "wide", "india", "And in India?", "మరి మన దేశంలో?"),
    9: ("kumar", "card", "india", "Our law says: the person who causes it. That could be you. [1] But no court has tested that on AI.",   # script review: say what the law says; render review: "is it Rohit's or not?"
        "మన చట్టం, చేయించిన వాళ్ళదే అంటుంది. [1] కానీ రోబో మీద ఏ కోర్టూ తేల్చలేదు."),
    10: ("meena", "card", "learned", "And it learned from artists like me, [1] for free!", "ఆ రోబో నాలాంటి ఆర్టిస్టుల బొమ్మల నుంచే నేర్చుకుంది, [1] ఫ్రీగా!"),
    11: ("rohit", "wide", "cant", "So I can't use AI at all?", "అయితే రోబోని వాడకూడదా?"),
    12: ("kumar", "wide", "rule", "Use it, and say so. | [1] Add your own drawing, and keep your drafts as proof.", "వాడుకో, వాడానని చెప్పు. | [1] నీ చేత్తో కొంచెం గీయి, డ్రాఫ్టులు ప్రూఫ్ గా దాచుకో."),   # script review: "వాడు" sounded like "that fellow"; "చేయి వెయ్" like touching someone
    13: ("meena", "wide", "notice", "Hand-drawn, first prize: ten thousand. [1] Mine!", "చేత్తో గీసిన వాటిలో మొదటి బహుమతి: పది వేలు! [1] నాదే!"),   # render review: make Meena's win heard
    14: ("rohit", "wide", "loop", "A prize just for AI posters? I'm the only entry: [1] I win again!", "రోబో పోస్టర్లకి వేరే బహుమతా? ఉన్నది నేనొక్కడినే: [1] బహుమతి నాదే!"),   # "An AI-only" was heard "And AI only"
}
TTS_EN = {5: "An American's A.I. picture won an art contest, with six hundred and twenty-four prompts. | [1] The Copyright Office refused it: he claimed the A.I.'s part too.",
          1: "Forty hours of drawing... [1] lost to forty seconds of A.I.?!"}
SHOW = {1: "40 hours of drawing... lost to 40 seconds of AI?!", 5: "An American's AI picture won an art contest, with 624 prompts. The Copyright Office refused it: he claimed the AI's part too.", 7: "In America, typing prompts doesn't make it yours. Not even 600. The parts you made yourself, you can own.", 13: "Hand-drawn, first prize: ₹10,000. Mine!"}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu ("AI" on screen, as the cards: render review)
    1: "I drew for 40 hours... and lost to a picture the AI drew in 40 seconds?!", 2: "The rules said original! The AI drew a new one!",
    3: "The contest rules say who wins. The law says whose it is. Whose poster is it?", 4: "Mine! I'm the one who typed the prompt!",
    5: "In America an artist won a prize with 624 prompts. He said the AI's part was his too; the Copyright Office said no.",
    6: "So anyone can copy my poster?!", 7: "In America, just typing doesn't make it yours. What you made yourself is yours.", 8: "And in our country?",
    9: "Our law says: whoever had it made. But no court has tested it on AI.", 10: "That AI learned from artists like me, for free!",
    11: "So I can't use AI?", 12: "Use it, and say you used it. Draw a little yourself, keep your drafts as proof.",
    13: "Hand-drawn, first prize: ₹10,000! Mine!", 14: "A separate prize for AI posters? I'm the only one: the prize is mine!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"meena": 1.1, "rohit": 1.12, "kumar": 1.06}
TEMPO_TE = {"meena": 1.0, "rohit": 1.05, "kumar": 1.0}
TEMPO_LINE_TE = {}
# Sound: a buzzer and a hit on the board (frame 1), a second hit on "forty seconds"; a ding on "original"; the bed out
# before "six hundred and twenty-four", a boom on "refused"; a drop under "no court has tested that", a lift into the
# rule; a clap on the rule; a riser and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 0.9, "drop_at": [[4, 1]], "tail": 0.0}),
          ("s_b", (7, 8, 9, 10, 11), {"boost": 1.3, "lift": 0.5, "drop_at": [[2, 1]], "tail": 0.0}),   # render review: Q2-Q3 flat
          ("s_c", (12, 13, 14), {"outro": True, "pre": 0.3, "boost": 1.9, "lift": 0.6, "rise": 1.5, "tail": 0.0})]
GAP = {1: 0.3, 2: 0.2, 3: 0.3, 4: 0.2, 5: 0.4, 6: 0.2, 7: 0.35, 8: 0.2, 9: 0.4, 10: 0.25, 11: 0.2, 12: 2.0, 13: 0.3, 14: 0.0}   # 12: the rule card holds
GAP_TE = {12: 2.0}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}
YT = {"s_a": "40 hours vs 40 seconds", "s_b": "Who owns AI art?", "s_c": "Say so, add your own hand"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep46te" if te else "ep46v1"
    s = {"id": sid, "title": "40 hours vs 40 seconds (EP46: Copyright & AI)" + (" (Telugu audio)" if te else ""), "label": "EP46",
         "banner": "Copyright & AI: who owns it?", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.6] if not te else [0.5, 0.75],   # EP45 render review: TE music only 5 dB under the voice   # under speech / in gaps; round 2: TE bed 11 dB under the voice, EN gaps over it
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 2.5 if not te else 2.0,   # EP46 render review: EN music 14 dB under in the gaps   # dB in the gaps; render review: EN gaps ~3 dB over the voice, TE 12 dB under "musicEndRamp": [0.86, 7.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})   # Creative 13: the opening hit swallowed the first Telugu word
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = {5: 0.6, 12: 0.4}.get(n, 0.25)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = 0.5 + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_poster", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
