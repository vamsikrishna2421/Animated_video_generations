# Creative 24 "The Same Question, 101 Tokens" (the 3D-textbook test): writes reels/creative24v1.json (English) and
# reels/creative24te.json (Telugu). Lines from series/scripts/creative24_tokens_book.md (v2); one narrator; [n] marks the
# words the pictures wait for. Voices: pipeline/creative24/voice.py. Scene: video/src/reel/loop/BookScene.tsx (Three.js;
# render with GL=swangle). Numbers: our test (series/scripts/creative24_demo/tokens.json).
#   python3 pipeline/creative24/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). prop: BookScene.tsx.
LINES = {
    1: ("hook", "Thirteen tokens in English. [1] A hundred and one in Telugu.", "ఇంగ్లీష్ లో పదమూడు టోకెన్లు. [1] తెలుగులో, అదే ప్రశ్నకి నూట ఒకటి."),
    2: ("chunks", "The same question. [1] An AI reads tokens: chunks of text, not words.", "ఒకే ప్రశ్న. [1] ఏ ఐ పదాలు చదవదు: టోకెన్లు చదువుతుంది, అంటే టెక్స్ట్ ముక్కలు."),
    3: ("telugu", "The word \"current\": one chunk in English. [1] In Telugu letters: twelve tiny pieces.",
        "కరెంట్ అనే పదం, ఇంగ్లీష్ లో ఒక్క ముక్క. [1] తెలుగు అక్షరాల్లో రాస్తే, పన్నెండు ముక్కలు."),
    4: ("why", "Why? [1] These counters were built mostly from English text.", "ఎందుకు? [1] ఇవి ఎక్కువగా ఇంగ్లీష్ టెక్స్ట్ తోనే తయారయ్యాయి."),
    5: ("memory", "In your app, tokens are the AI's memory. [1] A long Telugu chat runs out of room sooner.",
        "మీ యాప్ లో, టోకెన్లే ఏ ఐ మెమరీ. [1] పెద్ద తెలుగు చాట్ కి, చోటు త్వరగా అయిపోతుంది."),
    6: ("cost", "And developers pay per token: [1] the same Telugu question costs more.",
        "డెవలపర్లు ప్రతి టోకెన్ కి డబ్బు కడతారు. [1] అదే తెలుగు ప్రశ్నకి, ఖర్చు ఎక్కువ."),
    7: ("newer", "The good news: the newer ChatGPT counts that question in twenty-three. [1] Over five questions: from seven times down to under two.",
        "మంచి వార్త: కొత్త చాట్ జీపీటీ, అదే ప్రశ్నని ఇరవై మూడుగా లెక్కపెడుతుంది. [1] ఐదు ప్రశ్నల్లో: ఏడు రెట్ల నుంచి, రెండు రెట్ల లోపుకి."),
    8: ("fair", "But a popular free open model: still six times. [1] Getting fairer. Not fair yet.",
        "కానీ ఒక పాపులర్ ఫ్రీ ఓపెన్ మోడల్ లో, ఇంకా ఆరు రెట్లు. [1] కొంచెం మెరుగైంది. ఇంకా సమానం కాదు."),
    9: ("loop", "Long Telugu work? Use a newer app. [1] Paying per token? Count your Telugu tokens first.",
        "పెద్ద తెలుగు పనికి, కొత్త యాప్ వాడండి. [1] టోకెన్ కి డబ్బు కడితే, ముందే తెలుగు టోకెన్లు లెక్కపెట్టండి."),
}
SHOW = {1: "13 tokens in English. 101 in Telugu.", 3: "The word \"current\": 1 chunk in English. In Telugu letters: 12 tiny pieces.",
        7: "The good news: the newer ChatGPT counts that question in 23. Over 5 questions: from 7 times down to under 2.",
        8: "But a popular free open model: still 6 times. Getting fairer. Not fair yet."}
SHOW_TE = {
    1: "13 tokens in English. In Telugu, for the same question, 101.", 2: "The same question. An AI doesn't read words: it reads tokens, chunks of text.",
    3: "The word \"current\": 1 chunk in English. Written in Telugu letters, 12 pieces.", 4: "Why? These were made mostly from English text.",
    5: "In your app, tokens are the AI's memory. A long Telugu chat runs out of room sooner.",
    6: "Developers pay for every token. The same Telugu question costs more.",
    7: "Good news: the newer ChatGPT counts that question as 23. Over 5 questions: from 7 times down to under 2.",
    8: "But in a popular free open model, still 6 times. A little better. Not equal yet.",
    9: "For long Telugu work, use a newer app. If you pay per token, count your Telugu tokens first.",
}
# Sound (CLAUDE.md arc; script review: a page flip and a hit on every turn, drops before "a hundred and one" and "not fair
# yet"): a boom on frame 1 and on "a hundred and one" (the bed out before it); a glitch as "current" bursts; a page turn
# into each spread; a buzz as the Telugu memory fills; a cash sound on the cost; a ding as 101 becomes 23, a boom on the
# bars; the bed out before "not fair yet", a ding; the flip back to frame 1 and its boom.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 0.9, "drop_at": [[0, 1, 0.2]], "tail": 0.0}),
          ("s_b", (5, 6, 7, 8), {"boost": 1.2, "lift": 0.5, "drop_at": [[3, 1, 0.3]], "tail": 0.0}),
          ("s_c", (9,), {"outro": True, "pre": 0.5, "boost": 1.6, "lift": 0.7, "rise": 1.5, "tail": 0.0})]
GAP = {1: 0.35, 2: 0.3, 3: 0.35, 4: 0.6, 5: 0.35, 6: 0.6, 7: 0.35, 8: 0.6, 9: 0.0}
GAP_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.4}}
YT = {"s_a": "13 vs 101 tokens", "s_b": "Memory, cost, our test", "s_c": "What you can do"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative24te" if te else "creative24v1"
    s = {"id": sid, "title": "The Same Question, 101 Tokens" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
         "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.3, 0.55], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[260, -6, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,
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
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).strip()), "maxgap": 0.3,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.3)), "tempo": 1.0 if te else 1.04}
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
