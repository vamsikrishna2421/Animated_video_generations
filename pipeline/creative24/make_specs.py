# Creative 24 "The Same Question, 101 Tokens" (the 3D-textbook test): writes reels/creative24v1.json (English) and
# reels/creative24te.json (Telugu). Lines from series/scripts/creative24_tokens_book.md (v3); one narrator; [n] marks the
# words the pictures wait for. Voices: pipeline/creative24/voice.py. Scene: video/src/reel/loop/BookScene.tsx (Three.js;
# render with GL=swangle). Numbers: our test (series/scripts/creative24_demo/tokens.json).
#   python3 pipeline/creative24/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). prop: BookScene.tsx. " | " = two takes (a beat of silence before the second).
# v3 (render review): the good news before why-it-matters (the memory bars at the real ratios, no contradiction), the
# developer line cut, the tips name what to do, "Not fair yet" on its own take after a beat; Telugu fixes as in the script.
LINES = {
    1: ("hook", "Thirteen tokens in English. [1] A hundred and one in Telugu.", "ఇంగ్లీష్ లో పదమూడు టోకెన్లు. తెలుగులో, అదే ప్రశ్నకి, | [1] నూట ఒకటి టోకెన్లు."),
    2: ("chunks", "The same question. [1] An AI reads tokens, chunks of text, and it can only hold so many.",
        "చాట్ బాట్ పదాలు చదవదు: [1] టోకెన్లు చదువుతుంది, అంటే టెక్స్ట్ ముక్కలు. అది కొన్ని టోకెన్లు మాత్రమే గుర్తుంచుకోగలదు."),
    3: ("telugu", "The word \"current\": one chunk in English. [1] In Telugu letters: twelve tiny pieces.",
        "కరెంట్ అనే పదం, ఇంగ్లీష్ లో ఒక్క ముక్క. [1] తెలుగు అక్షరాల్లో రాస్తే, పన్నెండు ముక్కలు."),
    4: ("why", "Why? [1] Its chunk list was built mostly from English text.", "ఎందుకు? [1] దాని ముక్కల లిస్ట్, ఎక్కువగా ఇంగ్లీష్ టెక్స్ట్ తోనే తయారైంది."),
    5: ("newer", "The good news: today's ChatGPT counts that question in twenty-three. [1] Over five questions: from seven times down to under two.",
        "గుడ్ న్యూస్: ఇప్పటి చాట్ జీపీటీ లో, అదే ప్రశ్నకి ఇరవై మూడు టోకెన్లే. [1] ఐదు ప్రశ్నల్లో: ఏడు రెట్లు ఉండేది, ఇప్పుడు రెండు కంటే తక్కువ."),
    6: ("fair", "But a popular free open model: still six times. [1] Getting fairer. | [2] Not fair yet.",
        "కానీ ఉచితంగా దొరికే ఒక ఓపెన్ మోడల్ లో, ఇంకా, ఆరు రెట్లు. [1] మెరుగవుతోంది. | [2] ఇంకా సమానం కాదు."),
    7: ("memory", "Why it matters: Telugu uses up that limit faster. [1] So in a long Telugu chat, the AI forgets the start sooner.",
        "ఇది ఎందుకు ముఖ్యం అంటే: టోకెన్లు ఎక్కువైతే, ఆ లిమిట్ త్వరగా అయిపోతుంది. [1] అందుకే పెద్ద చాట్ లో, మొదట చెప్పింది త్వరగా మర్చిపోతుంది."),
    8: ("loop", "Long Telugu chat forgetting what you said? [1] Ask for a short summary, and paste it into a new chat. [2] Building with AI? Count your Telugu tokens on the model you'll use.",
        "పెద్ద చాట్ లో ముందు చెప్పింది మర్చిపోతుంటే? [1] చిన్న సమ్మరీ అడిగి, ఇంకో చాట్ లో పేస్ట్ చేయండి. [2] యాప్ తయారు చేస్తుంటే, మీరు వాడే మోడల్ లోనే తెలుగు టోకెన్లు లెక్కపెట్టండి."),
}
SHOW = {1: "13 tokens in English. 101 in Telugu.", 3: "The word \"current\": 1 chunk in English. In Telugu letters: 12 tiny pieces.",
        5: "The good news: today's ChatGPT counts that question in 23. Over 5 questions: from 7 times down to under 2.",
        6: "But a popular free open model: still 6 times. Getting fairer. <pause 0.5> Not fair yet."}
SHOW_TE = {
    1: "13 tokens in English. In Telugu, for the same question, <pause 0.45> 101 tokens.", 2: "A chatbot doesn't read words: it reads tokens, chunks of text. It can only remember so many.",
    3: "The word \"current\": 1 chunk in English. Written in Telugu letters, 12 pieces.", 4: "Why? Its list of chunks was made mostly from English text.",
    5: "Good news: on today's ChatGPT, the same question is just 23 tokens. Over 5 questions: it was 7 times, now under 2.",
    6: "But in an open model you can get for free, still 6 times. Getting better. <pause 0.5> Not equal yet.",
    7: "Why it matters: more tokens use up that limit faster. So in a long Telugu chat, it forgets what you said first, sooner.",
    8: "Long Telugu chat forgetting what you said earlier? Ask for a short summary, paste it into another chat. Building an app? Count Telugu tokens on the model you'll use.",
}
SPLIT_PAUSE = {1: 0.45, 6: 0.5}
# Sound (CLAUDE.md arc; render review: the music sat at the voice's level with a pad hum in its range, no lift on the good
# news, no drop before "not fair yet", the frame-1 hit no bigger than the kick): the bed lower under speech and no pad, a
# low cut; a boom on frame 1 and on "a hundred and one" (the bed out before it); a page turn on every turn; a lift and a
# boost into the good news; the bed out for the beat before "Not fair yet"; the memory buzz; a rise into the tips and the
# flip back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 0.9, "drop_at": [[0, 1, 0.2]], "tail": 0.0}),
          ("s_b", (5,), {"lift": 1.0, "boost": 1.8, "tail": 0.0}),   # render review 2: a lift on 101 -> 23
          ("s_c", (6,), {"boost": 1.4, "duck": [1, 2, 0.35, 0.1], "tail": 0.0}),   # a dip, not the bed out (script review 2:
          ("s_d", (7,), {"boost": 1.3, "tail": 0.0}),                            # a full stop there played like the ending)
          ("s_e", (8,), {"outro": True, "pre": 0.5, "boost": 1.6, "lift": 0.7, "rise": 1.6, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.35, 4: 0.6, 5: 0.35, 6: 0.6, 7: 0.5, 8: 0.0}
GAP_TE = {}
TEMPO_TE = {7: 1.07, 8: 1.07}
# render review 2: Parler said "పెద్ద తెలుగు చాట్" as "థెలుక్" on every take (lines 7-8); the Telugu page's chat is Telugu
# already, so those two lines say "పెద్ద చాట్"   # v3 ran 66 s in Telugu; the two longest lines a touch quicker
FLAGS_TE = {"s_e": {"boost": 1.5, "rise": 1.5}}
YT = {"s_a": "13 vs 101 tokens", "s_b": "Today's ChatGPT: 23", "s_c": "Not fair yet", "s_d": "Why it matters", "s_e": "What you can do"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative24te" if te else "creative24v1"
    s = {"id": sid, "title": "The Same Question, 101 Tokens" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.5], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,   # pad back on (v3.1 render: a hole at every bar end without it)
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
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_book", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
