# EP36 "The Diwali rush" (GPUs and AI chips: why hardware decides AI): writes reels/ep36v1.json (English) and
# reels/ep36te.json (Telugu). Lines come from the script (series/scripts/ep36_gpus.md); [n] marks the words the pictures
# wait for; " | " splits a line into two takes. Voices: pipeline/ep36/voice.py (as EP35's). Numbers: our test
# (series/scripts/ep36_demo) and NVIDIA's spec page.
#   python3 pipeline/ep36/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi") or "screen" (the phone
# fills the frame). prop: what the line brings on (GpuCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "Twenty orders waiting, and you're still typing ONE reply?!",
        "ఇరవై ఆర్డర్లు వెయిట్ చేస్తున్నాయి, నువ్వింకా ఒక్క రిప్లై టైప్ చేస్తున్నావా?!"),
    2: ("ai", "screen", "billion", "Every word I write [1] takes over a billion multiplications.",
        "నేను రాసే ప్రతి పదానికి [1] వంద కోట్లకు పైగా మల్టిప్లికేషన్లు."),
    3: ("ravi", "ravi", "box", "Then hurry up! This phone has eight cores!", "అయితే త్వరగా చెయ్! ఈ ఫోన్ లో ఎనిమిది కోర్లు ఉన్నాయి!"),
    4: ("ai", "screen", "workers", "Eight workers, a billion sums. [1] I need thousands.",
        "ఎనిమిది మంది పనివాళ్ళు, వంద కోట్ల లెక్కలు. [1] నాకు వేలమంది కావాలి."),
    5: ("ravi", "ravi", "shelves", "Thousands?! Like Diwali stock-taking, every kid counting one shelf?",
        "వేలమందా?! దీపావళి స్టాక్ లెక్కలో పిల్లలందరూ తలో అర లెక్కపెట్టినట్టా?"),
    6: ("ai", "screen", "gpu", "Exactly. A graphics card, a GPU: [1] thousands of small cores, all at once.",
        "అదే. గ్రాఫిక్స్ కార్డ్, అంటే జీపీయూ: [1] వేల చిన్న కోర్లు, అన్నీ ఒకేసారి."),
    7: ("ravi", "ravi", "quiz", "But a reply comes word by word. [1] Can more cores make even ONE reply faster?",
        "కానీ రిప్లై ఒక్కో పదంగా వస్తుంది కదా. | [1] ఎక్కువ కోర్లతో ఒక్క రిప్లై అయినా ఫాస్ట్ అవుతుందా?"),
    8: ("ai", "screen", "test", "Our test. One core: eleven and a half seconds. [1] Four cores: under four.",
        "మా టెస్ట్. ఒక్క కోర్: పదకొండున్నర సెకన్లు. [1] నాలుగు కోర్లు: నాలుగు లోపే."),
    9: ("ravi", "ravi", "three", "Three times faster! [1] Then thousands of cores...", "మూడు రెట్లు ఫాస్ట్! [1] మరి వేల కోర్లు అంటే..."),
    10: ("ai", "screen", "card", "A gaming laptop's graphics card has over three thousand.",
         "గేమింగ్ ల్యాప్‌టాప్ గ్రాఫిక్స్ కార్డ్ లో మూడు వేలకు పైగా కోర్లు."),
    11: ("ravi", "wide", "sunny", "Sunny! Bring your gaming laptop!", "సన్నీ! నీ గేమింగ్ ల్యాప్‌టాప్ తీసుకురా!"),
    12: ("ai", "wide", "rule", "For AI, count the workers, not their speed. [1] And check the card's memory.",
         "ఏఐ కి పనివాళ్ళ స్పీడ్ కాదు, సంఖ్య ముఖ్యం. [1] కార్డ్ మెమరీ కూడా చూడు."),
    13: ("ravi", "ravi", "big", "Now put in the big brain! The full one!", "ఇప్పుడు పెద్ద బ్రేన్ పెట్టు! ఫుల్ ది!"),
    14: ("ai", "screen", "memory", "Full size, it's fifteen GB. [1] The card holds eight.", "ఫుల్ సైజ్ పదిహేను జీబీ. [1] కార్డ్ లో ఎనిమిదే పడతాయి."),
    15: ("ravi", "ravi", "so", "So?", "అయితే?"),
    16: ("ai", "screen", "slow", "So the rest runs on the slow side. [1] Typing...", "మిగతాది స్లో సైడ్ లో నడుస్తుంది. [1] టైపింగ్..."),
}
# English spoken forms: numbers and units in words, capitals out
TTS_EN = {1: "Twenty orders waiting, and you're still typing one reply?!", 6: "Exactly. A graphics card, a G P U: [1] thousands of small cores, all at once.",
          7: "But a reply comes word by word. [1] Can more cores make even one reply faster?",
          14: "Full size, it's fifteen gigabytes. [1] The card holds eight."}
# captions with digits
SHOW = {8: "Our test. 1 core: 11.5 seconds. 4 cores: under 4.", 10: "A gaming laptop's graphics card has over 3,000.",
        14: "Full size, it's 15 GB. The card holds 8.", 1: "20 orders waiting, and you're still typing ONE reply?!"}
TEMPO_EN = {"ravi": 1.2, "ai": 1.12}
TEMPO_TE = {"ravi": 1.12, "ai": 1.08}
# Sound (CLAUDE.md arc): a hit and order pings in the first second; a lift into the workers insert; the quiz's 3-2-1
# over the bed; the bed drops out before "Four cores: under four" with a hit; a success sting as the gaming laptop
# clears the queue; a snap on the rule; a riser into the overflow and a hit on "Typing...", into the loop. Ramps
# (rise/swell) stay on after their window, so only the last scene rises.
SCENES = [("g_a", (1, 2, 3), {"boost": 1.1, "tail": 0.1}),
          ("g_b", (4, 5, 6, 7), {"lift": 0.5, "pre": 0.35, "boost": 1.2, "tail": 0.1}),
          ("g_c", (8, 9, 10, 11), {"pre": 0.3, "drop_cue": 1, "boost": 1.25, "tail": 0.1}),
          ("g_d", (12, 13, 14, 15, 16), {"lift": 0.5, "pre": 0.3, "outro": True, "boost": 1.2, "rise": 1.5, "drop_at": [[4, 1]], "tail": 0.0})]
GAP = {1: 0.2, 7: 3.6, 8: 0.4, 11: 0.3, 12: 0.9, 14: 0.25}   # 7: the quiz holds for its 3-2-1; 12: the rule card
YT = {"g_a": "Twenty orders, one reply", "g_b": "Workers: CPU vs GPU", "g_c": "Our test: 1 vs 4 cores", "g_d": "Memory: the big brain"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep36te" if te else "ep36v1"
    s = {"id": sid, "title": "The Diwali rush (EP36: GPUs and AI chips)" + (" (Telugu audio)" if te else ""), "label": "EP36",
         "banner": "Why AI runs on GPUs", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.4, 0.8], "musicFade": 0.05, "endPad": 0.6, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.12 if te else 1.15, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else TTS_EN.get(n, en),
                  "show": SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": GAP.get(n, 0.16),
                  "tempo": (TEMPO_TE if te else TEMPO_EN)[who]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                ln.update({"text": f"{p1} <pause 0.3> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.3})
            # loudness: Ravi a little above the AI; the test result and the last line lifted
            g = (-1.0 if who == "ai" else 1.5) + {8: 1.5, 16: 1.0}.get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_gpu", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
