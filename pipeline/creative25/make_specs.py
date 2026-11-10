# Creative 25 "Which Wish Did the AI Write?" (a one-question challenge): writes reels/creative25v1.json (English) and
# reels/creative25te.json (Telugu). Lines from series/scripts/creative25_which_wish.md; [n] marks the words the pictures
# wait for. One narrator. Voices: pipeline/creative25/voice.py. Scene: video/src/reel/loop/GuessCrayon.tsx. Texts and
# numbers: our test (series/scripts/creative25_demo/7B.json).
#   python3 pipeline/creative25/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). prop: GuessCrayon.tsx. " | " = two takes (a beat of silence before the second).
LINES = {   # v2 (script review): the AI wish used the real details, so you have to look; "next door" planted in line 1
    1: ("hook", "Ammamma turns eighty. Both grandsons live next door. [1] One typed his wish for ten minutes. One tapped an AI.",
        "అమ్మమ్మకి ఎనభై ఏళ్లు. మనవళ్ళు ఇద్దరూ పక్కింట్లోనే ఉంటారు. [1] ఒకడు పది నిమిషాలు టైప్ చేశాడు. ఇంకొకడు చాట్‌బాట్‌ని ఒక్క ట్యాప్ తో అడిగాడు."),
    2: ("quiz", "Which one did the AI write? [1] One, or two?", "ఏది చాట్‌బాట్ రాసింది? [1] ఒకటా, రెండా?"),
    3: ("reveal", "Two. [1] \"I miss you dearly\"... from next door?", "రెండు. [1] పక్కింట్లో ఉండి, నిన్ను మిస్ అవుతున్నా అంటాడా?"),
    4: ("tells", "The AI used both real details. [1] Then it guessed the rest.", "చాట్‌బాట్, రెండు నిజమైన విషయాలు వాడింది. [1] మిగతాదంతా ఊహించింది."),
    5: ("test", "We tested a small free AI on our laptop, not ChatGPT. With no details, ten tries: [1] all ten said \"May this special day\". One even began, \"Of course! Here's a sweet birthday wish\".",
        "మేం మా ల్యాప్‌టాప్ లో, ఒక చిన్న ఫ్రీ చాట్‌బాట్‌ని టెస్ట్ చేశాం, చాట్ జీపీటీ కాదు. వివరాలు లేకుండా, పది సార్లు: [1] పదికి పది, ఒకే మాట: మే దిస్ స్పెషల్ డే. ఒకసారైతే, ఆఫ్ కోర్స్ అని మొదలుపెట్టింది."),
    6: ("twist", "With the two details, it used both, every time. [1] But five times, it guessed \"I miss you\".",
        "రెండు వివరాలు ఇస్తే, ప్రతిసారీ రెండూ వాడింది. [1] కానీ ఐదు సార్లు, నిన్ను మిస్ అవుతున్నా అని ఊహించింది."),
    7: ("rule", "So tell it the facts that matter, [1] read every line, and fix what isn't true.",
        "అందుకే, ముఖ్యమైన నిజాలు చెప్పండి, [1] ప్రతి లైన్ చదవండి, నిజం కానిది సరిచేయండి."),
    8: ("loop", "Ammamma's reply: [1] \"Miss me? You're ten steps away. Come and eat!\"",
        "అమ్మమ్మ రిప్లై: [1] మిస్ అవుతున్నావా? పది అడుగుల దూరంలో ఉన్నావ్, వచ్చి తిను!"),
}
TTS_EN = {}   # filled below if a word needs a spelling for the voice
SHOW = {1: "Ammamma turns 80. Both grandsons live next door. One typed his wish for 10 minutes. One tapped an AI.",
        5: "We tested a small free AI on our laptop, not ChatGPT. With no details, 10 tries: all 10 said \"May this special day\". One even began, \"Of course! Here's a sweet birthday wish\".",
        6: "With the 2 details, it used both, every time. But 5 times, it guessed \"I miss you\".",
        8: "Ammamma's reply: \"Miss me? You're 10 steps away. Come and eat!\""}
SHOW_TE = {
    1: "Ammamma turns 80. Both grandsons live next door. One typed for 10 minutes. The other asked a chatbot with 1 tap.",
    2: "Which one did the chatbot write? 1, or 2?", 3: "2. He lives next door, and says \"I miss you\"?",
    4: "The chatbot used the 2 real details. It guessed all the rest.",
    5: "We tested a small free chatbot on our laptop, not ChatGPT. No details, 10 times: 10 out of 10, the same words: \"May this special day\". Once it even began \"Of course\".",
    6: "Given 2 details, it used both every time. But 5 times it guessed \"I miss you\".",
    7: "So: tell it the facts that matter, read every line, fix what isn't true.",
    8: "Ammamma's reply: \"Missing me? You're 10 steps away, come and eat!\"",
}
TEXTS = {   # on screen, English on both pages (2 and the test lines are from series/scripts/creative25_demo/7B.json)
    "a": "Happy 80th, Ammamma! Still remember you running behind my cycle, holding the seat. Keep the pulihora ready, coming at 7!",
    "b": "Happy 80th birthday, Grandma! Thank you for teaching me to ride a bicycle all those years ago. Your pulihora is still the best in the family, and I miss you dearly. Wishing you a day filled with love and joy! 🎉🎂",
    "of": "Of course! Here's a sweet birthday wish for your grandmother:",
    "made": "", "aDetails": ["running behind my cycle", "pulihora"], "bDetails": ["ride a bicycle", "pulihora"],
    "bGuess": ["Grandma", "I miss you dearly", "filled with love and joy"], "bStock": [], "dStock": [],
}
NUMS = {"stock": "10/10", "both": "10/10", "miss": "5/10"}
SPLIT_PAUSE = {}
# Sound (CLAUDE.md arc): a boom and pops on frame 1; three pops on the countdown in the hold; a boom and clap on "Two", a
# buzz on the stock phrases; a ding on the real details; a boom on "ten out of ten"; a ding into the twist, a buzz on
# "I miss you"; a clap and boom into the rule; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.0, "drop_pre": [[2, 0.0, 2.4]], "tail": 0.0}),   # the bed out under the countdown
          ("s_b", (5, 6), {"boost": 1.3, "lift": 0.6, "tail": 0.0}),
          ("s_c", (7, 8), {"outro": True, "pre": 0.5, "boost": 1.6, "lift": 0.7, "rise": 1.6, "tail": 0.0})]
GAP = {1: 0.3, 2: 2.6, 3: 0.4, 4: 0.4, 5: 0.4, 6: 0.6, 7: 0.4, 8: 0.0}
GAP_TE = {}
TEMPO_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.5}}
YT = {"s_a": "Which wish is the AI's?", "s_b": "Our test", "s_c": "Let it write, the right way"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative25te" if te else "creative25v1"
    s = {"id": sid, "title": "Which Wish Did the AI Write?" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0 if not te else 0.5,   # pad back on (v3.1 render: a hole at every bar end without it);
         # v3.2 render: with the pad and the boosts the gaps ran 4 dB over the voice: gaps 0.3, no gap gain in English
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.3,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.3)), "tempo": TEMPO_TE.get(n, 1.05) if te else 1.04}
            if " | " in raw:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = raw.split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "texts": TEXTS, "nums": NUMS, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_guess", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
