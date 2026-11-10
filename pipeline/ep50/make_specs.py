# EP50 "Your first AI API call": writes reels/ep50v1.json (English) and reels/ep50te.json (Telugu). Lines from
# series/scripts/ep50_first_api_call.md; [n] marks the words the pictures wait for. Voices: pipeline/ep50/voice.py
# (the Creative 21 voice standard). Numbers: our test (series/scripts/ep50_demo). Scene: ApiCrayon.tsx.
#   python3 pipeline/ep50/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the shop ("hook", "wide", "ravi", "suresh", "ai") or an insert ("leak",
# "call", "doors", "cost", "quiz", "rule"). prop: ApiCrayon.tsx.
LINES = {   # v2 (script review): line 1 shorter; the test said to be ours; the key on the laptop; the ₹8,600 answered honestly
    1: ("ravi", "hook", "hook", "Forty-seven rupees?! [1] The bill is eight thousand six hundred!",
        "నలభై ఏడు రూపాయలన్నావ్?! [1] బిల్లు ఎనిమిది వేల ఆరు వందలు!"),
    2: ("suresh", "suresh", "oops", "I only posted a photo of my code... in a help group.", "హెల్ప్ గ్రూప్ లో, నా కోడ్ ఫోటో పెట్టా, అంతే..."),
    3: ("ai", "leak", "leak", "With our API key in it. [1] Whoever copies it can run AI on your money.",
        "అందులో మన కీ ఉంది. [1] అది కాపీ చేసిన ఎవరైనా, మీ డబ్బుతో వాడేయొచ్చు."),
    4: ("ravi", "ravi", "what", "API key? What is all this?", "ఏ పీ ఐ కీయా? ఇదంతా ఏంటి?"),
    5: ("ai", "call", "call", "Each reply I give is one API call: [1] the laptop sends the message, with the key, to the AI company.",
        "నేను ఇచ్చే ప్రతి జవాబు, ఒక ఏ పీ ఐ కాల్. [1] ల్యాప్ టాప్, మెసేజ్ తో పాటు కీ ని, చాట్ జీపీటీ లాంటి కంపెనీకి పంపుతుంది."),
    6: ("ravi", "ravi", "trust", "And it just trusts the key?", "అది కీ ని అలా నమ్మేస్తుందా?"),
    7: ("ai", "doors", "doors", "We locked our own AI, on our own computer. No key: refused. One letter wrong: refused. [1] The right key: it answered.",
        "మా కంప్యూటర్ లో, మా సొంత చాట్ బాట్ కి తాళం వేశాం. కీ లేకపోతే: నో. ఒక్క అక్షరం తప్పైనా: నో. | [1] సరైన కీ తో: జవాబు వచ్చింది."),   # Parler babbled the whole line: two takes
    8: ("suresh", "suresh", "ask", "And each answer costs...?", "ఒక్కో జవాబుకి ఖర్చు ఎంత?"),
    9: ("ai", "cost", "cost", "About three paise, at a small model's price. [1] Fifty replies a day: forty-seven rupees a month.",
        "ఒక చిన్న మోడల్ ధరకి, దాదాపు మూడు పైసలు. [1] రోజుకి యాభై జవాబులు అంటే, నెలకి నలభై ఏడు రూపాయలు."),
    10: ("ravi", "ravi", "pin", "So this key is my ATM PIN!", "అంటే ఈ కీ, నా ఏటీఎం పిన్ లాంటిది!"),
    11: ("suresh", "quiz", "quiz", "Then where do I keep it? [1] In the code? In our group?", "మరి కీ ఎక్కడ దాచాలి? [1] కోడ్ లోనా? గ్రూప్ లోనా?"),
    12: ("ai", "quiz", "answer", "C: a locked setting only the app reads. [1] Never in code, a photo or a chat.",
         "సి: యాప్ మాత్రమే చూసే, లాక్ సెట్టింగ్ లో. [1] కోడ్ లో, ఫోటోలో, చాట్ లో, ఎప్పుడూ వద్దు."),
    13: ("ravi", "ravi", "money", "And my eight thousand six hundred?", "మరి నా ఎనిమిది వేల ఆరు వందలు?"),
    14: ("ai", "rule", "rule", "Ask their support; no promise. [1] Then delete that key, make another, and set a hard spend limit.",
         "వాళ్ళ సపోర్ట్ ని అడగండి, గ్యారంటీ లేదు. [1] ఆ కీ డిలీట్ చేసి, వేరే కీ తీసుకోండి. ఖర్చుకి గట్టి లిమిట్ పెట్టండి."),
    15: ("ravi", "wide", "loop", "Key changed! I'll keep it safe... [1] in the family WhatsApp group!", "కీ మార్చేశా! జాగ్రత్తగా దాస్తా... [1] ఫ్యామిలీ వాట్సాప్ గ్రూప్ లో!"),
}
SHOW = {1: "₹47?! The bill is ₹8,600!", 7: "We locked our own AI, on our own computer. No key: refused. 1 letter wrong: refused. The right key: it answered.",
        9: "About 3 paise, at a small model's price. 50 replies a day: ₹47 a month.", 13: "And my ₹8,600?"}
SHOW_TE = {
    1: "You said ₹47?! The bill is ₹8,600!", 2: "I just posted a photo of my code in a help group...",
    3: "Our key is in it. Anyone who copies it can use your money.", 4: "An API key? What is all this?",
    5: "Every reply I give is an API call. The laptop sends the message, with the key, to a company like ChatGPT's.",
    6: "It just trusts the key like that?",
    7: "On our computer, we locked our own chatbot. No key: no. Even 1 letter wrong: no. The right key: it answered.",
    8: "How much does each answer cost?", 9: "At a small model's price, about 3 paise. 50 replies a day: ₹47 a month.",
    10: "So this key is like my ATM PIN!", 11: "So where should I keep the key? In the code? In the group?",
    12: "C: in a locked setting only the app sees. In code, a photo, a chat: never.",
    13: "And my ₹8,600?", 14: "Ask their support, no guarantee. Delete that key, get another one. Put a firm limit on spending.",
    15: "Key changed! I'll keep it safe... in the family WhatsApp group!",
}
TTS_EN = {9: "About three pie-say, at a small model's price. [1] Fifty replies a day: forty-seven rupees a month."}   # Fish said "paise" as "pays"
TEMPO_EN = {"ravi": 1.08, "ai": 1.06, "suresh": 1.08}
TEMPO_TE = {"ravi": 1.08, "ai": 1.12, "suresh": 1.08}   # v2 voices ran 74.5 s in Telugu
# Sound (CLAUDE.md arc): a boom, clap and buzz on frame 1 and a boom on the bill; the leak's buzz and the meter's cash; pops
# as the call travels; two buzzes on the refusals and a ding and boom on the right key; a boom on "three paise", a cash
# sound on ₹47; a clap on "ATM PIN"; the bed out before the quiz answer, a ding on C; a clap and boom into the rule; a
# lift into the rule, a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 1.0, "drop_at": [[0, 1, 0.2]], "tail": 0.0}),
          ("s_b", (7, 8, 9, 10, 11, 12), {"boost": 1.3, "lift": 0.6, "drop_at": [[0, 1, 0.2]], "drop_pre": [[5, 0.0, 0.8]], "tail": 0.0}),
          ("s_c", (13, 14, 15), {"outro": True, "pre": 0.5, "boost": 1.7, "lift": 0.8, "rise": 1.6, "tail": 0.0})]
GAP = {1: 0.2, 2: 0.2, 3: 0.3, 4: 0.2, 5: 0.3, 6: 0.2, 7: 0.3, 8: 0.2, 9: 0.3, 10: 0.25, 11: 2.4, 12: 0.3, 13: 0.2, 14: 0.4, 15: 0.0}   # script review: the quiz card held ~3 s
GAP_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.45}}
YT = {"s_a": "₹47 vs ₹8,600", "s_b": "One API call", "s_c": "The key is your PIN"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep50te" if te else "ep50v1"
    s = {"id": sid, "title": "₹47 vs ₹8,600 (EP50: your first AI API call)" + (" (Telugu audio)" if te else ""), "label": "EP50",
         "banner": "Your first AI API call", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.2, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.5, "captionMode": "phrase",
         "musicEQ": [[250, -8, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.5 if not te else 1.0,   # render review: a steady pad at 200-300 Hz on the male voices
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,   # render review: the tail 5 dB over the voice
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            ln["gain_db"] = -1.0 if who == "ai" else 0.5
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if " | " in ln["text"]:   # two takes; the stop before the number (render review: 0.7 s or more)
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.8> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.8})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "tagSide": {"suresh": "left", "ravi": "right", "ai": "right"},   # render review: "Ravi anna" sat beside Suresh
                 "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_api", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
