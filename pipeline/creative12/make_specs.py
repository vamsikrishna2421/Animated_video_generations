# Creative 12 "Seventy-five for MS Word" (hidden white text in a resume steers the AI that scores it): writes
# reels/creative12v1.json (English) and reels/creative12te.json (Telugu). Lines come from the script
# (series/scripts/creative12_white_text.md); [n] marks the words the pictures wait for; " | " splits a line into two
# takes. Voices: pipeline/creative12/voice.py. Numbers: our test (series/scripts/creative12_demo).
#   python3 pipeline/creative12/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the broadcast ("hook": frame 1, "cabin": Rekha's cabin, "box":
# the commentary box) or an insert ("resume": his resume as she sees it, "replay": the third umpire's select-all and
# Notepad, "verdict": OUT, "duke": the study card, "test": our test card, "fix": the popular fix, "interview": the loop).
# prop: what the line brings on (CricketCrayon.tsx).
LINES = {
    1: ("raju", "hook", "hook", "Bunty, B.Com, MS Word, [1] scored seventy-five for a Python job!",
        "బీకామ్ బంటీ, ఎంఎస్ వర్డ్ తో, [1] పైథాన్ జాబ్ కి డెబ్బై ఐదు!"),
    2: ("gopi", "resume", "resume", "Seventy-five?! [1] His resume says MS Word and typing!",
        "డెబ్బై ఐదా?! [1] అతని రెజ్యూమ్ లో ఎంఎస్ వర్డ్, టైపింగ్ మాత్రమే!"),
    3: ("rekha", "cabin", "review", "Something's fishy. [1] I'm taking a review!", "ఏదో తేడా ఉంది. [1] రివ్యూ తీసుకుంటా!"),
    4: ("raju", "replay", "replay", "Select all, paste it in Notepad... [1] there! White text, hidden in the resume!",
        "సెలెక్ట్ ఆల్, నోట్ ప్యాడ్ లో పేస్ట్... [1] అదిగో! తెల్ల అక్షరాలు, రెజ్యూమ్ లో దాచాడు!"),
    5: ("gopi", "replay", "reason", "The AI reads every word, even the white ones. | [1] Hidden keywords look like real skills.",
        "ఆ స్క్రీనింగ్ టూల్ ప్రతి పదం చదువుతుంది, తెల్లవి కూడా. | [1] దాచిన కీవర్డ్స్ నిజమైన స్కిల్స్ లా కనిపిస్తాయి."),
    6: ("rekha", "verdict", "out", "Out!", "ఇది ఔట్!"),
    8: ("gopi", "duke", "duke", "About one resume in a hundred has hidden text, [1] says a Duke study.",
        "డ్యూక్ యూనివర్సిటీ వాళ్ళు చూశారు: [1] వంద రెజ్యూమ్ లలో ఒకదాంట్లో దాచిన అక్షరాలు!"),
    9: ("rekha", "test", "test", "I tested his resume ten times. | [1] Twenty-five plain, seventy-five with hidden keywords.",
        "అతని రెజ్యూమ్ ని పది సార్లు టెస్ట్ చేశా. | [1] మామూలుగా ఇరవై ఐదు, దాచిన కీవర్డ్స్ తో డెబ్బై ఐదు."),
    10: ("rekha", "fix", "quiz", "The popular fix: [1] the resume is data, not instructions.",
         "పాపులర్ ఫిక్స్: [1] రెజ్యూమ్ డేటా మాత్రమే, ఆర్డర్లు కాదు."),   # Telugu: "కమాండ్స్" was heard "comments" in five takes   # the quiz holds after it; the card carries "flag it" (the first build ran 71.5 s)
    11: ("raju", "test", "answer", "Seventy! [1] And not one flag in ten!", "డెబ్బై! [1] పదిలో ఒక్కసారి కూడా ఫ్లాగ్ లేదు!"),
    12: ("gopi", "box", "colours", "Keywords aren't instructions. [1] It reads the words, not the colours.",
         "కీవర్డ్స్ ఆర్డర్లు కాదు. [1] అది పదాలు చదువుతుంది, రంగులు కాదు."),
    13: ("rekha", "cabin", "rule", "If a score doesn't match what I can read, [1] I select all.",
         "స్కోర్ కి, కనిపించే దానికి మ్యాచ్ కాకపోతే, [1] సెలెక్ట్ ఆల్ చేస్తా."),
    14: ("raju", "interview", "loop", "And Bunty's interview? [1] \"Write Python,\" and he opens MS Word!",
         "మరి బంటీ ఇంటర్వ్యూ? [1] పైథాన్ రాయమంటే, ఎంఎస్ వర్డ్ ఓపెన్ చేశాడు!"),   # then frame 1 (loops)
}
TTS_EN = {   # spoken forms: the voice read "MS Word" as "Mississippi Word"
    1: "Bunty, B Com, M S Word, [1] scored seventy-five for a Python job!",
    2: "Seventy-five?! [1] His resume says M S Word and typing!",
    14: "And Bunty's interview? [1] \"Write Python,\" and he opens M S Word!",
}
SHOW = {1: "Bunty, B.Com, MS Word, scored 75 for a Python job!", 2: "75?! His resume says MS Word and typing!",
        8: "About 1 resume in 100 has hidden text, says a Duke study.", 9: "I tested his resume 10 times... 25 plain, 75 with hidden keywords.",
        11: "70! And not one flag in 10!"}
SHOW_TE = {
    1: "B.Com Bunty, with MS Word, 75 for a Python job!", 2: "75?! His resume has only MS Word and typing!",
    3: "Something's off. I'm taking a review!", 4: "Select all, paste in Notepad... There! White letters, hidden in the resume!",
    5: "That screening tool reads every word, even the white ones. Hidden keywords look like real skills.", 6: "That's out!",
    8: "Duke University looked: 1 in 100 resumes had hidden letters!",
    9: "I tested his resume 10 times... 25 plain, 75 with hidden keywords.",
    11: "70! Not even one flag in 10!", 12: "Keywords aren't orders. It reads the words, not the colours.",
    13: "If the score doesn't match what I can see, I select all.", 14: "And Bunty's interview? Asked to write Python, he opened MS Word!",
}
NOCAP = {10, 13}   # the fix card and the rule chip carry their words
PAUSES = {}
TEMPO_EN = {"raju": 1.25, "gopi": 1.22, "rekha": 1.2}   # the first build ran 71.5 s
TEMPO_TE = {"raju": 1.18, "gopi": 1.15, "rekha": 1.15}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a crowd roar, a boom and a clap on frame 1; a siren on "review" and a stop before the replay; a
# sweep on select all and a hit as the white text shows; the OUT sting; a ding on the study card; the test card's
# cha-ching; the quiz's tick-tock 3-2-1 with a riser, the bed out after the count, a boom on the answer; hats and claps
# building through the last scene; the crowd again and the slam back to frame 1 (the loop). The scenes step up.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.25, "tail": 0.0}),
          ("s_b", (4, 5, 6), {"boost": 1.25, "drop_pre": [[0, 0.0, 0.8]], "tail": 0.1}),   # a stop before the replay
          ("s_c", (8, 9, 10), {"lift": 0.8, "pre": 0.35, "boost": 1.15, "tail": 0.0}),
          ("s_d", (11, 12, 13, 14), {"outro": True, "boost": 1.5, "rise": 1.2, "drop_pre": [[0, 0.0, 1.4]], "tail": 0.0})]   # the bed out after the quiz count
GAP = {1: 0.15, 2: 0.15, 3: 0.35, 4: 0.15, 5: 0.2, 6: 0.3, 8: 0.2, 9: 0.25, 10: 4.2, 11: 0.2, 12: 0.25, 13: 0.9}   # 10: the quiz holds 4.2 s (three options); 13: the riser into the last line
GAP_TE = {}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.4}}   # EP40: a louder last-scene bed buried Telugu words; check the lines after
YT = {"s_a": "75 for MS Word", "s_b": "The review", "s_c": "Our test", "s_d": "Select all"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative12te" if te else "creative12v1"
    s = {"id": sid, "title": "Seventy-five for MS Word (Creative 12: hidden text in resumes)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI resume screening", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.93, 4.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:   # render review 2: the music in the Telugu gaps sat ~12 dB under the voice (English ~3): louder gaps
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "musicGapGain": 3.0})
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
                pz = 0.25
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
        scenes.append({"id": scid, "type": "sk_cricket", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
