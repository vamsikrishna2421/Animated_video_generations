# Creative 18 "₹3,100 back? ₹0.": writes reels/creative18v1.json (English) and reels/creative18te.json (Telugu). Lines come
# from the script (series/scripts/creative18_tatkal.md); [n] marks the words the pictures wait for; " | " splits a line
# into two takes. Voices: pipeline/creative18/voice.py. Numbers: our test (series/scripts/creative18_demo/tatkal_7B.json).
#   python3 pipeline/creative18/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the room ("wide") or an insert ("how", "test").
LINES = {
    1: ("keerthi", "wide", "hook", "The AI said three thousand one hundred back... | [1] IRCTC gave zero?!",   # script review: a stop before "zero"
        "రోబో మూడు వేల వంద వస్తాయంది... | [1] రైల్వే వాళ్ళు ఒక్క రూపాయి కూడా ఇవ్వలేదా?!"),   # "యాప్" read as IRCTC's own app; "ఏ ఐ" came out "yeh yeh"
    2: ("ramesh", "wide", "asked", "I asked it before cancelling! [1] Half of six thousand two hundred, it said!", "క్యాన్సిల్ చేసే ముందే అడిగా! [1] ఆరు వేల రెండు వందల్లో సగం అంది!"),   # script review: show the fare so the numbers add up
    3: ("sunny", "wide", "irctc", "Babai, confirmed Tatkal tickets get no refund. [1] It's on IRCTC's own page.", "బాబాయ్, కన్ఫర్మ్ అయిన తత్కాల్ టికెట్ కి రీఫండ్ ఉండదు. [1] రైల్వే సైట్ లోనే రాసుంది."),
    4: ("ramesh", "wide", "announce", "Passengers, kindly note: Ramesh garu's refund... [1] zero rupees!", "ప్రయాణికులకు విజ్ఞప్తి: రమేష్ గారి రీఫండ్... [1] సున్నా రూపాయలు!"),   # script review: the announcer joke, once
    5: ("keerthi", "how", "how", "It didn't check anything. [1] It made up a rule that sounds real.", "అది ఎక్కడా చెక్ చేయలేదు. [1] నిజం రూల్ లా అనిపించేది ఒకటి ఊహించి చెప్పేసింది."),
    6: ("sunny", "test", "test", "We asked a small free AI the same thing, ten times. [1] Nine times, it made up a rule!", "ఒక చిన్న ఫ్రీ రోబో ని పది సార్లు అడిగాం. [1] తొమ్మిది సార్లు రూల్ సొంతంగా తయారు చేసింది!"),
    7: ("ramesh", "test", "again", "A different refund every time?!", "ప్రతిసారీ ఒక్కో లెక్కా?!"),
    8: ("keerthi", "test", "official", "Then we said: only the official rule, and say if you're not sure. | [1] Better: eight of ten. But one still said three thousand one hundred!",   # script review: say the misses
        "అప్పుడు, అఫీషియల్ రూల్ మాత్రమే చెప్పు, తెలీకపోతే తెలీదని చెప్పు అన్నాం. | [1] పదిలో ఎనిమిది సార్లు రీఫండ్ లేదంది. కానీ ఒకటి ఇంకా మూడు వేల వంద అంది!"),
    9: ("sunny", "wide", "rule", "So for money rules: [1] ask where it's written, and open that page.", "డబ్బు విషయంలో రూల్ అయితే: [1] ఎక్కడ రాసుందో అడిగి, ఆ పేజీ తెరిచి చూడు."),
    10: ("ramesh", "wide", "loop", "Fine. AI, are you sure? | [1] ...Three thousand one hundred, it says!", "సరే రోబో, నిజమేనా? | [1] ...మూడు వేల వంద, ష్యూర్ అంట!"),   # script review: "are you sure?" runs into frame 1's ₹3,100
}
TTS_EN = {3: "Babai, confirmed Tatkal tickets get no refund. [1] It's on I.R.C.T.C.'s own page.", 1: "The A.I. said three thousand one hundred back... | [1] I.R.C.T.C. gave zero?!",
          10: "Fine. A.I., are you sure? | [1] ...Three thousand one hundred, it says!"}
SHOW = {1: "The AI said ₹3,100 back... IRCTC gave ₹0?!", 2: "I asked it before cancelling! Half of ₹6,200, it said!", 4: "Passengers, kindly note: Ramesh garu's refund... ₹0!",
        6: "We asked a small free AI the same thing, 10 times. 9 times, it made up a rule!",
        8: "Then we said: only the official rule, and say if you're not sure. Better: 8 of 10. But one still said ₹3,100!", 10: "Fine. AI, are you sure? ...₹3,100, it says!"}
SHOW_TE = {
    1: "The AI said ₹3,100 comes back... the railway didn't give a single rupee?!", 2: "I asked before cancelling! It said half of ₹6,200!",
    3: "Babai, a confirmed Tatkal ticket has no refund. It's written on the railway site itself.", 4: "Passengers, please note: Ramesh garu's refund... zero rupees!",
    5: "It didn't check anywhere. It guessed something that sounds like a real rule.", 6: "We asked a small free AI 10 times. 9 times it made up the rule itself!",
    7: "A different amount every time?!", 8: "Then we said: tell only the official rule, and say so if you don't know. 8 out of 10 said no refund. But one still said ₹3,100!",
    9: "If it's a money rule: ask where it's written, then open that page.", 10: "Fine, AI, is it true? ...₹3,100, sure, it says!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"keerthi": 1.1, "ramesh": 1.08, "sunny": 1.12}
TEMPO_TE = {"keerthi": 1.0, "ramesh": 1.0, "sunny": 1.05}
TEMPO_LINE_TE = {}
# Sound: the station chime and a hit on "zero" in frame 1; a ding on "Fifty percent"; the chime before IRCTC's words; a
# boom and a glitch on "made up a rule"; a success sting on "Eight of ten"; the chime and a clap on the rule board; a
# riser, a ding on "Fifty percent, it says!", the chime and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 0.9, "drop_at": [[0, 1], [3, 1]], "tail": 0.0}),   # the bed out before "zero" (line 1) and "zero rupees" (line 4)
          ("s_b", (6, 7, 8), {"boost": 1.25, "drop_pre": [[0, 0.0, 0.6]], "tail": 0.0}),
          ("s_c", (9, 10), {"outro": True, "pre": 0.3, "boost": 1.85, "rise": 1.5, "drop_at": [[1, 1]], "tail": 0.0})]
GAP = {1: 0.3, 2: 0.2, 3: 0.4, 4: 0.25, 5: 0.35, 6: 0.4, 7: 0.25, 8: 0.6, 9: 2.4, 10: 0.0}   # 9: the rule board holds
GAP_TE = {9: 2.0}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}
YT = {"s_a": "₹3,100 back? ₹0", "s_b": "Our test", "s_c": "Where is it written?"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative18te" if te else "creative18v1"
    s = {"id": sid, "title": "₹3,100 back? ₹0." + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "₹3,100 back? ₹0.", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
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
                pz = {1: 0.5, 8: 0.6, 10: 0.7}.get(n, 0.25)   # the stop before the punchline
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
        scenes.append({"id": scid, "type": "sk_tatkal", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
