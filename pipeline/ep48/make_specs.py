# EP48 "AI laws" (a two-character conversation, no music bed: Bujji taste note #4): writes reels/ep48v1.json (English)
# and reels/ep48te.json (Telugu). Lines from series/scripts/ep48_ai_laws.md; [n] marks the words the pictures wait for;
# " | " splits a line into two takes. Voices: pipeline/ep48/voice.py. Numbers: our test (series/scripts/ep48_demo).
#   python3 pipeline/ep48/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the shop ("wide", "ravi", "ai") or an insert ("hook", "chat", "law", "date",
# "test", "rows", "eu", "adlabel"). prop: LawCrayon.tsx.
LINES = {
    1: ("ravi", "hook", "hook", "You said no label?! [1] It's the rule since February!",   # render review: said flat, "No label needed." meant the opposite
        "లేబుల్ అక్కర్లేదా?! [1] ఫిబ్రవరి నుంచే రూల్ ఉంది!"),
    2: ("ai", "chat", "chat", "You asked if your AI ad needs a label. [1] I said no.", "మీ ఏఐ యాడ్ కి లేబుల్ కావాలా అని అడిగారు. [1] నేను అక్కర్లేదు అన్నాను."),
    3: ("ravi", "wide", "panic", "That's not even me dancing! [1] People will think it's real!", "ఆ డాన్స్ నాది కాదు! [1] చూసేవాళ్ళు నిజమే అనుకుంటారు!"),   # "చేసేది" stuttered 4 of 4
    4: ("ai", "law", "law", "That's exactly the rule. | Since the twentieth of February, [1] AI videos, photos or voices that look real need a clear label.",
        "అదే రూల్. ఫిబ్రవరి ఇరవై నుంచి, [1] నిజంలా కనిపించే ఏఐ వీడియో, ఫోటో, వాయిస్ కి, క్లియర్ లేబుల్ పెట్టాలి."),   # render review: "ఉండాలి" heard "unadi"
    5: ("ravi", "ravi", "why", "Then why did you say no?!", "మరి ఎందుకు అక్కర్లేదు అన్నావు?!"),
    6: ("ai", "date", "date", "I'm a small free AI from 2024. [1] This rule came after me.",
        "నేను ఒక చిన్న ఫ్రీ ఏఐ ని, పాతదాన్ని. [1] ఈ రూల్ నా తర్వాత వచ్చింది."),   # Parler dropped the year (2024 is on the timeline)
    7: ("ai", "test", "test", "They tested me on AI rules, twenty-five times. | [1] I got two right.",
        "నన్ను ఏఐ రూల్స్ మీద ఇరవై ఐదు సార్లు టెస్ట్ చేశారు. | [1] రెండే కరెక్ట్."),
    8: ("ravi", "ravi", "two", "Only two?!", "రెండా?!"),   # render review: "Two." came out flat
    9: ("ai", "rows", "rows", "Some answers were old. [1] Some were just wrong, and I sounded sure.",
        "కొన్ని జవాబులు పాతవి. [1] కొన్ని తప్పు. నాకు మాత్రం అన్నీ కరెక్ట్ అనిపించాయి."),   # render review: "చెప్పాను" garbled; "గట్టిగా" = loudly; "పక్కాగా" doubled; "చెప్పా" at the end garbled 3 of 3
    15: ("ravi", "ravi", "like", "Like what?!", "ఏం చెప్పావు?!"),   # render review (TE): break the AI's solo with a reaction
    10: ("ai", "eu", "eu", "I said Europe doesn't ban AI that reads workers' feelings. [1] That ban was already in its 2024 law.",   # render review: "since
         "యూరప్, ఉద్యోగుల ఫీలింగ్స్ చదివే ఏఐ ని బ్యాన్ చేయలేదు అని చెప్పా. [1] ఆ బ్యాన్ అప్పటికే చట్టంలో ఉంది."),   # 2025" after "from 2024" sounded old, not wrong   # "does not explicitly ban", not "allows"; release date isn't training cutoff
    11: ("ravi", "wide", "who", "So who do I ask about rules?", "మరి రూల్స్ గురించి ఎవర్ని అడగాలి?"),
    12: ("ai", "wide", "rule", "Apps that search the web can look it up. [1] Make them show the government's page, and its date.",
         "వెబ్ లో వెతికే యాప్స్ చూసి చెప్తాయి. [1] కానీ గవర్నమెంట్ సైట్, దాని డేట్ చూపించమనండి."),   # render review: "ప్రభుత్వ పేజీ" bookish
    13: ("ai", "wide", "honest", "And this video gets old too. [1] It's November 2026.", "ఈ వీడియో కూడా పాతబడుతుంది. [1] ఇది ఈ నవంబర్ లో చేసిన వీడియో."),   # the year came out garbled (the stamp shows NOV 2026)
    14: ("ravi", "adlabel", "loop", "Made with AI. [1] The rice is real.", "లేబుల్: ఏఐ తో చేసింది. [1] బియ్యం మాత్రం నిజం."),   # "మేడ్ విత్" came out "mert pit"
}
TTS_EN = {6: "I'm a small free AI from twenty twenty-four. [1] This rule came after me.",
          13: "And this video gets old too. [1] It's November, twenty twenty-six."}
SHOW = {7: "They tested me on AI rules, 25 times. I got 2 right."}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "No label needed?! It's the rule since February!", 2: "You asked if your AI ad needs a label. I said no need.",
    3: "That dance isn't mine! People will think it's real!",
    4: "That's the rule. From 20 February, AI video, photo or voice that looks real needs a clear label.",
    5: "Then why did you say no?!", 6: "I'm a small free AI, an old one. This rule came after me.",
    7: "They tested me 25 times on AI rules. Only 2 correct.", 8: "Two?!",
    9: "Some answers were old. Some were wrong. To me, they all felt right.",
    10: "I said Europe doesn't ban AI that reads employees' feelings. That ban was already in the law.", 15: "What did you say?!",
    11: "So who should I ask about rules?", 12: "Apps that search the web can look it up. But make them show the government site and its date.",
    13: "This video will get old too. It was made this November (2026).", 14: "Label: made with AI. The rice, though, is real.",
}
TEMPO_EN = {"ravi": 1.1, "ai": 1.07}   # a conversation, not a rush (taste note #4); first build ran 63 s
TEMPO_TE = {"ravi": 1.0, "ai": 1.0}   # EP42 / Creative 14: Telugu speed-ups swallow words
# No music bed (the one variable: taste note #4). The bed is generated as usual but played at zero, so the timing tools
# stay the same; the scene's own few sounds (LawCrayon.tsx) and the voices are all you hear.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"tail": 0.0}),
          ("s_b", (7, 8, 9, 15, 10), {"tail": 0.0}),
          ("s_c", (11, 12, 13, 14), {"outro": True, "pre": 0.2, "tail": 0.0})]
GAP = {15: 0.15, 1: 0.1, 2: 0.1, 3: 0.2, 4: 0.25, 5: 0.15, 6: 0.25, 7: 0.4, 8: 0.25, 9: 0.2, 10: 0.25, 11: 0.15, 12: 0.3, 13: 0.25, 14: 0.0}   # render review: 0.7-1.0 s of dead air felt like a freeze
GAP_TE = {}
YT = {"s_a": "No label needed?", "s_b": "Our test: 2 of 25", "s_c": "Ask for the page and its date"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep48te" if te else "ep48v1"
    s = {"id": sid, "title": "\"No label needed\" (EP48: AI laws)" + (" (Telugu audio)" if te else ""), "label": "EP48",
         "banner": "AI rules: India and the EU", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.0, 0.0], "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase",
         "hardCuts": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.22,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            if " | " in ln["text"]:   # two takes; the stop before the number is the drop (no bed to cut)
                p1, p2 = ln["text"].split(" | ")
                pz = {7: 0.4 if te else 0.7}.get(n, 0.2)   # render review: the Telugu stop measured 1.4 s
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            elif not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            g = (-1.0 if who == "ai" else 0.5) + (1.5 if n == 1 else 0.0)   # render review: the first 3 s sat under the voice
            ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_law", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
