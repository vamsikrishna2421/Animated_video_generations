# Creative 21 "Not On The List" (.NET vs dotnet): writes reels/creative21v1.json (English, American voices) and
# reels/creative21te.json (Telugu). Lines from series/scripts/creative21_dotnet.md (v2); [n] marks the words the pictures
# wait for; " | " splits a line into two takes. Voices: pipeline/creative21/voice.py. Numbers: our test
# (series/scripts/creative21_demo).
#   python3 pipeline/creative21/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the door ("wide", "hook") or an insert ("hand": the hand-drawn whiteboard,
# "letters", "test", "ai", "rule"). prop: BouncerCrayon.tsx.
LINES = {
    1: ("shalini", "hook", "hook", "Eight months open. [1] Zero hires. [2] Where are the .NET developers?!",
        "ఎనిమిది నెలలు! [1] ఒక్కరినీ తీసుకోలేదు! [2] డాట్ నెట్ డెవలపర్స్ ఎక్కడ?!"),   # script review: "జాయిన్ అవలేదు" sounded like dropouts
    2: ("bouncer", "wide", "stamp", "Rejected. [1] Not on the list.", "రిజెక్టెడ్. [1] లిస్ట్ లో లేదు."),
    3: ("naveen", "wide", "resume", "Five years of dotnet! [1] I'm exactly who you need!",
        "ఐదేళ్ళుగా డాట్ నెట్ లోనే పని చేస్తున్నా! [1] మీకు కావాల్సింది నేనే!"),
    4: ("bouncer", "hand", "hand", "The list says dot, N, E, T. [1] You wrote D, O, T, N, E, T.",   # script review: by ear both are "dot net": spell them
        "లిస్ట్ లో చుక్క, ఎన్, ఈ, టీ. [1] నువ్వు రాసింది డీ, ఓ, టీ, ఎన్, ఈ, టీ."),
    5: ("shalini", "wide", "same", "It's the same skill!", "రెండూ ఒకటే కదా!"),
    6: ("bouncer", "letters", "letters", "I match letters, [1] not meaning.", "నేను అక్షరాలు చూస్తా, [1] అర్థం చూడను."),
    7: ("naveen", "test", "test", "I tested a filter like yours. [1] Twenty ways to write .NET. [2] Eleven bounced.",   # script review: ways, not people
        "మీలాంటి ఫిల్టర్ తో టెస్ట్ చేశా. [1] డాట్ నెట్ ని ఇరవై రకాలుగా రాశా. [2] పదకొండు రిజెక్ట్."),
    8: ("shalini", "wide", "eleven", "Eleven?! [1] And everyone here writes dotnet!", "పదకొండా?! [1] ఇక్కడ అందరూ అలాగే రాస్తారు!"),   # script review: why zero hires
    9: ("naveen", "test", "fakes", "And \"Not familiar with .NET\"? [1] It let that one in.",
        "\"నాకు డాట్ నెట్ తెలియదు\" అని రాసినవాడు? [1] లోపలికి వెళ్ళిపోయాడు."),
    10: ("shalini", "wide", "smart", "Then let an AI read the meaning!", "అయితే అర్థం చేసుకునే బాట్ పెడదాం!"),
    11: ("naveen", "ai", "ai", "I tried a small one. Nobody without .NET got in. | [1] But \"DotNet\"? Bounced, three times out of three.",
         "చిన్న బాట్ తో ట్రై చేశా. డాట్ నెట్ రానివాళ్ళు ఒక్కరూ లోపలికి రాలేదు. | [1] కానీ కలిపి రాసిన డాట్ నెట్? మూడుకి మూడు సార్లు రిజెక్ట్."),
    12: ("shalini", "wide", "pile", "So for eight months, [1] nobody read the reject pile?", "అంటే ఎనిమిది నెలలు, [1] రిజెక్ట్ అయినవి ఎవరూ చదవలేదా?"),
    13: ("bouncer", "wide", "asked", "Nobody asked.", "ఎవరూ అడగలేదు."),
    14: ("naveen", "rule", "seek", "Job hunting? [1] Copy the job post's exact words, letter for letter.",   # script review: a rule for every skill
         "ఉద్యోగం వెతుకుతున్నారా? [1] జాబ్ పోస్ట్ లో ఉన్న మాటలే, అక్షరం మార్చకుండా రాయండి."),
    15: ("shalini", "rule", "hire", "Hiring? [1] Read twenty rejects every week, and add every spelling to the list.",
         "రిక్రూట్ చేస్తున్నారా? [1] ప్రతి వారం ఇరవై రిజెక్ట్ లు మనిషి చదవాలి, ప్రతి స్పెల్లింగ్ లిస్ట్ లో పెట్టాలి."),
    16: ("shalini", "wide", "question", "A bot that reads you in one second... [1] or a human, in three weeks?",   # script review: a two-sided closer
         "ఒక్క సెకనులో చదివే బాట్ కావాలా... [1] మూడు వారాలు తీసుకునే మనిషా?"),
    17: ("bouncer", "wide", "loop", "Next! [1] Rejected.", "నెక్స్ట్! [1] రిజెక్టెడ్."),
}
TTS_EN = {4: "The list says dot, N, E, T. [1] You wrote D, O, T, N, E, T."}
SHOW = {1: "8 months open. Zero hires. Where are the .NET developers?!", 3: "5 years of dotnet! I'm exactly who you need!",
        4: "The list says .NET (dot, N, E, T). You wrote d-o-t-n-e-t.", 7: "I tested a filter like yours. 20 ways to write .NET. 11 bounced.",
        8: "11?! And everyone here writes dotnet!", 11: "I tried a small one. Nobody without .NET got in. But \"DotNet\"? Bounced, 3 times out of 3.",
        12: "So for 8 months, nobody read the reject pile?", 15: "Hiring? Read 20 rejects every week, and add every spelling to the list.",
        16: "A bot that reads you in 1 second... or a human, in 3 weeks?"}
SHOW_TE = {
    1: "8 months! Not one hired! Where are the .NET developers?!", 2: "Rejected. Not on the list.",
    3: "I've worked on .NET for 5 years! I'm the one you need!", 4: "The list says dot, N, E, T. You wrote D, O, T, N, E, T.",
    5: "Both are the same!", 6: "I look at letters, not meaning.", 7: "I tested with a filter like yours. I wrote .NET 20 ways. 11 rejected.",
    8: "11?! Everyone here writes it that way!", 9: "The one who wrote \"I don't know .NET\"? He walked right in.",
    10: "Then let's put in a bot that understands meaning!", 11: "I tried a small bot. Not one person without .NET got in. But \"DotNet\" written joined? Rejected 3 times out of 3.",
    12: "So for 8 months, nobody read the rejected ones?", 13: "Nobody asked.", 14: "Job hunting? Write the job post's own words, without changing a letter.",
    15: "Recruiting? Every week a human reads 20 rejects; every spelling goes on the list.", 16: "A bot that reads you in one second... or a human who takes three weeks?",
    17: "Next! Rejected.",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"shalini": 1.06, "naveen": 1.08, "bouncer": 1.0}
TEMPO_TE = {"shalini": 1.0, "naveen": 1.04, "bouncer": 0.98}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): frame 1 a boom, clap and buzz with the stamp, a second hit on "Zero hires"; the stamp hits on
# every REJECTED; marker squeaks (ticks) as the whiteboard draws, a boom on its stamp; a buzz on "not meaning"; the bed out
# before "Eleven bounced", a boom; a glitch on "Eleven?!"; a ding on "let that one in"; three buzzes on NO NO NO; the bed
# out before "three times out of three"; claps into the rules; a riser into the question; the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (7, 8, 9, 10, 11, 12, 13), {"boost": 1.35, "lift": 0.5, "drop_at": [[0, 2], [4, 1]], "tail": 0.0}),
          ("s_c", (14, 15, 16, 17), {"outro": True, "pre": 0.3, "boost": 1.8, "lift": 0.6, "rise": 1.5, "drop_pre": [[2, 0.0, 0.8]], "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.25, 4: 0.5, 5: 0.2, 6: 0.4, 7: 0.3, 8: 0.25, 9: 0.3, 10: 0.2, 11: 0.4, 12: 0.2, 13: 0.4,
       14: 0.8, 15: 1.0, 16: 0.4, 17: 0.0}   # 14-15: the rule cards hold
GAP_TE = {}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.25}}   # EP42: a louder last-scene bed buries Telugu words
YT = {"s_a": "Rejected: .NET vs dotnet", "s_b": "Our test", "s_c": "Copy the job post's words"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative21te" if te else "creative21v1"
    s = {"id": sid, "title": "Not On The List: .NET vs dotnet" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.36, 0.66],   # under speech / in gaps (EP47's render review: ~10 dB under the voice)
         "musicDuckRamp": 9,
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 2.5 if not te else 2.0, "musicEndRamp": [0.88, 5.0], "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = {11: 0.6}.get(n, 0.25)   # a stop before "But DotNet?"
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_bouncer", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
