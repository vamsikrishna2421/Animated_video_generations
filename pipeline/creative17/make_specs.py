# Creative 17 "Same Answer, Two Marks": writes reels/creative17v1.json (English) and reels/creative17te.json (Telugu). Lines
# come from the script (series/scripts/creative17_same_answer.md); [n] marks the words the pictures wait for; " | " splits
# a line into two takes. Voices: pipeline/creative17/voice.py. Numbers: our test (series/scripts/creative17_demo).
#   python3 pipeline/creative17/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the tuition room ("wide", "hook") or an insert ("wheel":
# how a chat AI answers, "test": our test). prop: what the line brings on (CaseCrayon.tsx).
LINES = {
    1: ("varsha", "wide", "hook", "He copied my answer word for word... [1] he gets nine, I get seven?!",
        "నా ఆన్సర్ అక్షరం అక్షరం కాపీ కొట్టాడు... [1] వాడికి తొమ్మిది, నాకు ఏడేనా?!"),   # script review: "ఏడా" heard "ఏడ" (where) / "ఏడ్చా"
    2: ("akhil", "wide", "machine", "Sir's AI marked it. [1] Machines don't play favourites!", "సార్ ఫోన్ లో యాప్ మార్కులు వేసింది. [1] మెషీన్ ఎవరికీ ఫేవర్ చేయదు!"),   # "పక్షపాతం" is one sound from "పక్షవాతం" (paralysis)
    3: ("srinivas", "wide", "impossible", "Same answer, two marks? [1] Impossible.", "ఒకే ఆన్సర్ కి రెండు మార్కులా? [1] కుదరదు."),
    4: ("varsha", "wheel", "wheel", "Possible, sir. It rolls a dice for every word. [1] Ask again, you can get a new mark.",   # render review: a new mark came up about half the time   # script review: "a little chance" read as "an opportunity"
        "అవుతుంది సార్. అది ప్రతి మాటకీ డైస్ వేస్తుంది. [1] ఇంకోసారి అడిగితే, ఇంకో మార్కు."),   # the longer line came out garbled 4 of 4
    5: ("akhil", "wide", "prove", "Prove it!", "ప్రూవ్ చెయ్!"),
    6: ("varsha", "test", "test", "We had a small free AI mark one answer, ten times. [1] Mostly eight. But seven and nine both came up!",   # script review: the bars say mostly 8
        "ఒక చిన్న ఫ్రీ యాప్ తో, ఒకే ఆన్సర్ కి పది సార్లు మార్కులు వేయించాం. [1] ఎక్కువ సార్లు ఎనిమిది. కానీ ఏడూ వచ్చింది, తొమ్మిదీ వచ్చింది!"),
    7: ("srinivas", "test", "scheme0", "Then I'll give it my marking scheme!", "అయితే, ఏ పాయింట్ కి ఎన్ని మార్కులో దానికి చెప్తా!"),   # "మార్కింగ్ స్కీమ్" came out "markent scheme" 4 of 4
    8: ("varsha", "test", "scheme", "We tried that. Even less steady! And three times, it gave my first line... | [1] a zero!",   # render review: "jumped more" wasn't what the tiles show; a stop and a hit before "zero"
        "అదీ చేశాం: ఇంకా ఎక్కువ తేడా! మూడు సార్లు, నా ఫస్ట్ లైన్ కి... | [1] సున్నా!"),   # "మొదటి" was heard "mudde", near "ముద్దు" (kiss)
    9: ("akhil", "test", "lottery", "So it's a lottery?!", "అంటే ఇది లాటరీనా?!"),
    10: ("varsha", "wide", "rule", "So the AI flags the lines. [1] A person checks them and gives the marks.",   # script review: "points to lines" right after it misread one
         "యాప్ లైన్లు మాత్రమే చూపించాలి. [1] మనిషి చూసి, మార్కులు వేయాలి."),   # render review: "అందుకే ... చూపిస్తుంది" sounded like what it already does
    11: ("akhil", "wide", "loop", "Sir, mark mine again, I'll get ten! | [1] ...Seven?!", "సార్, నాకు ఇంకోసారి మార్కులు వేయించండి, పది వస్తుంది! | [1] ...ఏడేనా?!"),   # render review: a stop and a hit before "Seven?!"   # script review: why would he ask with a 9?
}
TTS_EN = {}   # spoken forms
SHOW = {1: "He copied my answer word for word... he gets 9, I get 7?!", 6: "We had a small free AI mark one answer, 10 times. Mostly 8. But 7 and 9 both came up!",
        8: "We tried that. Even less steady! And 3 times, it gave my first line... a zero!", 11: "Sir, mark mine again, I'll get 10! ...7?!"}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "He copied my answer word for word... he gets 9, and I get only 7?!", 2: "The app on sir's phone gave the marks. A machine favours nobody!",
    3: "Two marks for the same answer? Not possible.", 4: "It can happen, sir. It rolls a dice for every word. Ask once more, another mark.",
    5: "Prove it!", 6: "We had a small free app mark one answer 10 times. Mostly 8. But 7 came, and 9 came too!", 7: "Then I'll tell it how many marks for each point!",
    8: "We did that too: even more difference! 3 times, my first line got... zero!", 9: "So this is a lottery?!",
    10: "The app should only show the lines. A person must look, and give the marks.", 11: "Sir, get mine marked once more, I'll get 10! ...only 7?!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"varsha": 1.1, "akhil": 1.12, "srinivas": 1.08}
TEMPO_TE = {"varsha": 1.0, "akhil": 1.05, "srinivas": 1.0}   # EP42 / Creative 14: Telugu speed-ups swallow words
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit, a clap and a buzz on frame 1, a tick and a second hit on "I get seven"; a buzz on
# "Impossible"; the wheel ticks and a ding; pops on the ten tiles, a boom on "Seven, eight, nine"; the bed out before the
# scheme's result, a boom and a glitch on "a zero"; a boom and clap on the rule; hats and claps building through the last
# scene; a riser, a ding on "Seven?!" and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 0.9, "tail": 0.0}),
          ("s_b", (6, 7, 8, 9), {"boost": 1.25, "drop_pre": [[2, 0.0, 0.7]], "drop_at": [[2, 1]], "tail": 0.0}),   # and out again before "zero"   # the bed out for 0.7 s before "We did."
          ("s_c", (10, 11), {"outro": True, "pre": 0.3, "boost": 1.85, "rise": 1.5, "drop_at": [[1, 1]], "tail": 0.0})]   # the bed out before "Seven?!"
GAP = {1: 0.25, 2: 0.2, 3: 0.3, 4: 0.3, 5: 0.25, 6: 0.5, 7: 0.25, 8: 0.5, 9: 0.3, 10: 3.0, 11: 0.0}   # 10: the TEST IT card holds 4 s+   # 10: the rule card holds
GAP_TE = {10: 2.6}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}
YT = {"s_a": "Same answer: 9 vs 7", "s_b": "Our test", "s_c": "A person gives the marks"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative17te" if te else "creative17v1"
    s = {"id": sid, "title": "Same answer, two marks" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "Same answer, two marks", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.6] if not te else [0.66, 0.9],   # under speech / in gaps; round 2: TE bed 11 dB under the voice, EN gaps over it
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 0.0 if not te else 4.0,   # dB in the gaps; render review: EN gaps ~3 dB over the voice, TE 12 dB under "musicEndRamp": [0.86, 7.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
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
                pz = {8: 0.7, 11: 0.7}.get(n, 0.25)   # the stop before the punchline
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
        scenes.append({"id": scid, "type": "sk_case", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
