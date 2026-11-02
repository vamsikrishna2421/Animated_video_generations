# Creative 14 "Three references, three dead links" (a B.Com class; the lecturer opens a student's AI-given references on
# the projector): writes reels/creative14v1.json (English) and reels/creative14te.json (Telugu). Lines come from the
# script (series/scripts/creative14_dead_links.md); [n] marks the words the pictures wait for; " | " splits a line into
# two takes. Voices: pipeline/creative14/voice.py. Numbers: our test (series/scripts/creative14_demo).
#   python3 pipeline/creative14/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: "class" (the projector, ma'am, Charan, the heads), "phone"
# (Charan's AI chat), "typing" (how the AI writes a link), "domain" (the fake address vs RBI's), "test" (our test card),
# "study" (the 2025 study). prop: what the line brings on (LinksCrayon.tsx).
LINES = {
    1: ("vasudha", "class", "hook", "Three references, [1] and all three are dead!",   # "three dead links" was heard "three deadlings" in the mix
        "మూడు రిఫరెన్సులు. [1] మూడూ పనిచేయని లింకులు!"),
    2: ("charan", "phone", "phone", "But madam, [1] the AI gave me those!", "కానీ మేడమ్, [1] ఆ చాట్ బాట్ ఇచ్చిందే!"),
    3: ("vasudha", "typing", "typing", "It writes links like sentences. [1] They only look right.",
        "అది లింక్ ని కూడా ఊహించి రాస్తుంది. | [1] చూడటానికే కరెక్ట్ గా ఉంటాయి."),
    4: ("harsha", "domain", "domain", "Reserve Bank of India dot org? [1] RBI is R B I dot org dot in!",
        "రిజర్వ్ బ్యాంక్ ఆఫ్ ఇండియా డాట్ ఆర్గా? | [1] ఆర్బీఐ వెబ్ సైట్ ఆర్బీఐ డాట్ ఆర్గ్ డాట్ ఇన్!"),   # render review: the Telugu letters were mush; 04b: try 1 kept by hand (Whisper wrote it in English, "RBI website rbi.org.in", so the Telugu judge scored it 0)
    5: ("harsha", "test", "test", "I tested a small AI, offline: a hundred and fifty links. | [1] Seventy-two were blocked, so I checked seventy-eight.",
        "ఇంటర్నెట్ లేని ఒక చిన్న చాట్ బాట్ తో టెస్ట్ చేశా: నూట యాభై లింకులు. | [1] డెబ్బై రెండు బ్లాక్ అయ్యాయి, డెబ్బై ఎనిమిది చూశా."),   # "లేకుండా" and "చెక్ చేశా" stuttered in the takes   # render review: say the 150 / 72 / 78 path out loud
    6: ("harsha", "test", "test2", "Sixty-four dead, twelve wrong pages, | [1] and only two right.",
        "అరవై నాలుగు పనిచేయలేదు, పన్నెండు వేరే పేజీలు, | [1] రెండే కరెక్ట్."),
    7: ("charan", "phone", "sure", "I told it: only links you're sure about!", "నేను చెప్పా: ఖచ్చితంగా ఉన్న లింకులే ఇవ్వు అని!"),
    8: ("harsha", "phone", "sure2", "Already tried that. [1] It never said 'not sure'. No better.",   # "Tried that" was heard "Try that" (advice)
        "అదీ ట్రై చేశా. | [1] ఒక్కసారి కూడా తెలీదు అనలేదు. ఏమీ మారలేదు."),
    9: ("vasudha", "study", "study", "Big chatbots do it too: in a 2025 study, [1] only one reference in four was fully right.",   # "Big chatbots too" was heard "Big chat was too"
        "పెద్ద చాట్ బాట్లు కూడా: పోయిన ఏడాది ఒక స్టడీ లో, | [1] నాలుగింట్లో ఒకటే సరిగ్గా ఉంది."),   # Telugu: the year was heard "2005"; "ఒక్కటే పూర్తిగా" garbled
    10: ("vasudha", "class", "rule", "Ask for the report's name and who published it. | [1] Search it yourself, and open every link.",
         "రిపోర్ట్ పేరు, ఎవరు పబ్లిష్ చేశారో అడగండి. | [1] మీరే వెతకండి, ప్రతి లింక్ ఓపెన్ చేయండి."),
    11: ("charan", "class", "loop", "Reference four is fine, madam, [1] I promise!", "రిఫరెన్స్ నంబర్ నాలుగు బాగుంది మేడమ్, [1] ప్రామిస్!"),   # Telugu: "నాలుగో" was heard "ఆదిగో"   # then the click, a 404: frame 1 (loops)
}
TTS_EN = {}
SHOW = {1: "3 references, and all 3 are dead!", 5: "I tested a small AI, offline: 150 links. <pause 0.3> 72 were blocked, so I checked 78.",
        6: "64 dead, 12 wrong pages, <pause 0.8> and only 2 right.",   # render review: "and only 2 right" was up before the stop
        8: "Already tried that. It never said 'not sure'. No better.", 9: "Big chatbots do it too: in a 2025 study, only 1 reference in 4 was fully right.",
        4: "reservebankofindia.org? RBI is rbi.org.in!"}
SHOW_TE = {
    1: "3 references. All 3 dead links!", 2: "But ma'am, that chatbot gave them!", 3: "It guesses even the link. <pause 0.3> They only look right.",
    4: "Reserve Bank of India dot org? <pause 0.3> RBI is rbi.org.in!", 5: "I tested a small offline chatbot: 150 links. <pause 0.3> 72 were blocked, I checked 78.",
    6: "64 didn't work, 12 wrong pages, <pause 0.8> only 2 right.", 7: "I told it: give only links you're sure of!",
    8: "Tried that too. <pause 0.3> Not once did it say 'I don't know'. Nothing changed.",
    9: "Big chatbots too: in a study last year (2025), <pause 0.3> only 1 in 4 was right.",
    10: "Ask the report's name and who published it. <pause 0.3> Search it yourselves, open every link.", 11: "Reference number 4 is fine, madam, promise!",
}
NOCAP = set()
PAUSES = {}
SPLIT_PAUSE = {6: 0.8}   # the stop before "and only two right"
TEMPO_EN = {"vasudha": 1.1, "charan": 1.12, "harsha": 1.1}
TEMPO_TE = {"vasudha": 1.05, "charan": 1.05, "harsha": 1.05}
TEMPO_LINE_EN = {4: 1.25}   # Harsha read the addresses slowly (6 s)
TEMPO_LINE_TE = {3: 1.0, 5: 1.0}   # the 1.05 speed-up made "లేకుండా" stutter ("lek lek") and smeared line 3
# Sound (CLAUDE.md arc): a hit and a buzz on frame 1 (the 404) before her first word; a pop as the phone comes up; ticks
# as the AI types a link; a buzz on the fake address and a ding on the real one; the bed out before "and only two right",
# a thud, a buzz and a clap after; a glitch on "no better"; a ding on the study; a boom and clap on the rule; hats and
# claps building through the last scene; a riser into the last line, the click and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 0.95, "tail": 0.0}),   # render review: quarters within 0.7 dB: the scenes step up harder
          ("s_b", (5, 6, 7, 8), {"boost": 1.2, "drop_at": [[1, 1]], "tail": 0.0}),   # the bed out before "and only two right"
          ("s_c", (9, 10, 11), {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.65, "rise": 1.3, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.25, 3: 0.3, 4: 0.4, 5: 0.3, 6: 1.0, 7: 0.3, 8: 0.6, 9: 0.4, 10: 2.2, 11: 0.3}   # 10: the rule card holds 3 s+
GAP_TE = {10: 1.6}   # render review: 1.5 s of quiet bed before the punchline
FLAGS_TE = {"s_c": {"boost": 1.45, "rise": 1.15}}   # a louder last-scene bed buries Telugu words (EP40, Creative 13, EP42)
YT = {"s_a": "Three dead links", "s_b": "Our test", "s_c": "Name and publisher"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative14te" if te else "creative14v1"
    s = {"id": sid, "title": "Three references, three dead links (Creative 14: AI-made links)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI and fake links", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.66], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.85, 6.0],
         "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
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
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_LINE_EN.get(n, TEMPO_EN[who])}
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.3)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            ln["gain_db"] = 0.5
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            flags = {**flags, **FLAGS_TE.get(scid, {})}
        scenes.append({"id": scid, "type": "sk_links", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
