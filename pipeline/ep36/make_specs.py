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
    1: ("ravi", "wide", "hook", "Twenty-three orders waiting, and you're still typing a single reply?!",   # "ONE reply" was heard "Wondreply"
        "ఇరవై మూడు ఆర్డర్లు వెయిట్ చేస్తున్నాయి, నువ్వింకా ఒక్క రిప్లై టైప్ చేస్తున్నావా?!"),
    2: ("ai", "screen", "billion", "Every word I write [1] takes over a billion multiplications.",
        "నేను రాసే ప్రతి పదానికి [1] నూట యాభై కోట్ల మల్టిప్లికేషన్లు."),   # one number with the screen and line 4 (render review)
    3: ("ravi", "ravi", "box", "Then hurry up! This phone has eight cores!", "అయితే త్వరగా చెయ్! ఈ ఫోన్ లో ఎనిమిది కోర్లు ఉన్నాయి!"),
    4: ("ai", "screen", "workers", "Eight workers, a billion calculations. [1] I need thousands.",   # "sums" was heard "sons"
        "ఎనిమిది మంది పనివాళ్ళు, నూట యాభై కోట్ల లెక్కలు. [1] నాకు వేలమంది కావాలి."),   # the counter says 150 crore
    5: ("ravi", "ravi", "shelves", "Like my Diwali stock count? Every kid counting one rack?",
        "దీపావళి స్టాక్ లెక్కలో పిల్లలందరూ తలో ర్యాక్ లెక్కపెట్టినట్టా?"),
    6: ("ai", "screen", "gpu", "Exactly. A GPU: the graphics card from games. [1] Thousands of small cores, all at once.",
        "అచ్చం అలాగే! జీపీయూ, గేమ్స్ కి వాడే గ్రాఫిక్స్ కార్డ్: [1] వేల చిన్న కోర్లు, అన్నీ ఒకేసారి."),
    7: ("ravi", "ravi", "quiz", "But ten helpers can't write one bill faster. [1] Can more cores speed up a single reply?",
        "కానీ పది మంది కలిసినా ఒక్క బిల్లు త్వరగా అవ్వదు. | [1] ఎక్కువ కోర్లతో ఒక్క రిప్లై కూడా త్వరగా వస్తుందా?"),   # "రాయలేరు" was heard "రాలేరు"
    8: ("ai", "screen", "test", "On our laptop: one core, eleven and a half seconds. | [1] Four cores: under four seconds. [2] Each word's work gets split.",   # two takes: a real beat before the reveal
        "మా ల్యాప్‌టాప్ టెస్ట్ లో: ఒక్క కోర్, పదకొండున్నర సెకన్లు. | [1] నాలుగు కోర్లు: నాలుగు సెకన్ల లోపే. [2] ఒక్కో పదం లెక్కల్ని కోర్లన్నీ పంచుకుంటాయి."),
    9: ("ravi", "ravi", "buy", "Twenty-three orders? Still almost a minute and a half! [1] Do I buy a graphics card?",
        "ఇరవై మూడు ఆర్డర్లు? ఇంకా నిమిషమున్నర! [1] గ్రాఫిక్స్ కార్డ్ కొనాలా?"),   # the 83 s said out loud (render review)
    10: ("ai", "screen", "card", "For ChatGPT, no. That runs on theirs. [1] For me, here: a gaming laptop's GPU, over three thousand cores.",
         "చాట్ జీపీటీ కి అక్కర్లేదు, అది వాళ్ళ కార్డ్స్ మీద నడుస్తుంది. | [1] నేను ఇక్కడ నడవాలంటే: గేమింగ్ ల్యాప్‌టాప్ జీపీయూ, మూడు వేలకు పైగా కోర్లు."),
    11: ("ravi", "wide", "sunny", "Sunny! Bring your gaming laptop! | [1] Done already?!", "సన్నీ! నీ గేమింగ్ ల్యాప్‌టాప్ తీసుకురా! | [1] అప్పుడే అయిపోయిందా?!"),   # the queue empties in the beat
    12: ("ai", "wide", "rule", "For AI, count the workers, not their speed.", "ఏఐ కి పనివాళ్ళ స్పీడ్ కాదు, ఎంతమంది అన్నదే ముఖ్యం."),
    13: ("ravi", "ravi", "big", "Now the big brain! Not the squeezed copy, the full one!", "ఇప్పుడు పెద్ద బ్రేన్ పెట్టు! కంప్రెస్ చేసింది కాదు, ఫుల్ సైజ్ ది!"),
    14: ("ai", "screen", "memory", "Full size, it's fifteen GB. [1] The card holds eight.", "ఫుల్ సైజ్ పదిహేను జీబీ. [1] కార్డ్ లో ఎనిమిదే పడతాయి."),
    15: ("ravi", "ravi", "so", "So?", "అయితే?"),
    16: ("ai", "screen", "slow", "It has to fit to be fast. [1] The rest goes back to the CPU's few workers. | [2] Typing...",
         "వేగంగా కావాలంటే కార్డ్ లో పట్టాలి. [1] మిగతాది మళ్ళీ సీపీయూ లో కొద్దిమంది పనివాళ్ళకే. | [2] టైపింగ్..."),   # a line to repeat; "Typing..." after a beat
}
# English spoken forms: numbers and units in words, capitals out
TTS_EN = {1: "Twenty-three orders waiting, and you're still typing a single reply?!",
          6: "Exactly. A G P U: the graphics card from games. [1] Thousands of small cores, all at once.",   # ran together as "games use thousands"
          7: "But ten helpers can't write one bill faster. [1] Can more cores speed up a single reply?",
          10: "For Chat G P T, no. That runs on theirs. [1] For me, here: a gaming laptop's G P U, over three thousand cores.",
          14: "Full size, it's fifteen gigabytes. [1] The card holds eight."}
# captions with digits
SHOW_TE = {2: "Every word I write takes 150 crore multiplications.", 4: "8 workers, 150 crore calculations. I need thousands."}
SHOW = {1: "23 orders waiting, and you're still typing a single reply?!", 4: "8 workers, a billion calculations. I need thousands.", 8: "On our laptop: 1 core, 11.5 seconds. 4 cores: under 4 seconds. Each word's work gets split.",
        9: "23 orders? Still almost a minute and a half! Do I buy a graphics card?", 10: "For ChatGPT, no. That runs on theirs. For me, here: a gaming laptop's GPU, over 3,000 cores.",
        14: "Full size, it's 15 GB. The card holds 8."}
TEMPO_EN = {"ravi": 1.2, "ai": 1.16}
TEMPO_TE = {"ravi": 1.2, "ai": 1.16}   # Telugu ran 78.9 s at 1.12 / 1.08
# Sound (CLAUDE.md arc): a hit and order pings in the first second; a lift into the workers insert; the quiz's 3-2-1
# over the bed; the bed drops out before "Four cores: under four" with a hit; a success sting as the gaming laptop
# clears the queue; a snap on the rule; a riser into the overflow and a hit on "Typing...", into the loop. Ramps
# (rise/swell) stay on after their window, so only the last scene rises.
SCENES = [("g_a", (1, 2, 3), {"boost": 1.5, "tail": 0.1}),   # music 8-12 dB under the voice (it measured 13-15 here)
          ("g_b", (4, 5, 6, 7), {"lift": 0.8, "pre": 0.35, "boost": 1.35, "tail": 0.1}),
          ("g_c", (8, 9, 10, 11), {"pre": 0.3, "drop_cue": 1, "boost": 1.45, "tail": 0.1}),
          ("g_d", (12, 13, 14, 15, 16), {"lift": 0.5, "pre": 0.3, "outro": True, "boost": 1.3, "rise": 1.5, "swell": [2, 1, 1.15], "drop_at": [[4, 2]], "tail": 0.0})]   # the drop: before "Typing..."
GAP = {1: 0.2, 7: 3.2, 8: 0.5, 10: 0.3, 11: 0.4, 12: 0.6, 14: 0.25}   # 7: the quiz holds for its 3-2-1; 12: the rule card
YT = {"g_a": "23 orders, one reply", "g_b": "Workers: CPU vs GPU", "g_c": "Our test: 1 vs 4 cores", "g_d": "Memory: the big brain"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep36te" if te else "ep36v1"
    s = {"id": sid, "title": "The Diwali rush (EP36: GPUs and AI chips)" + (" (Telugu audio)" if te else ""), "label": "EP36",
         "banner": "Why AI runs on GPUs", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.46, 0.9], "musicFade": 0.05, "endPad": 0.6, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
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
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": GAP.get(n, 0.16),
                  "tempo": (TEMPO_TE if te else TEMPO_EN)[who]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                m2 = re.match(r"\[\d+\]", p2.strip())
                if te and m2 and m2.group(0) in en:   # the caption breaks at the same cue in the English line
                    a0 = MARK.sub("", en.split(m2.group(0))[0]).replace(" | ", " ").strip()
                    b0 = MARK.sub("", m2.group(0).join(en.split(m2.group(0))[1:])).replace(" | ", " ").strip()
                    if n not in SHOW:
                        ln["show"] = f"{a0} <pause 0.3> {b0}"
                    else:   # captions with digits: break after the sentence the first take ends on
                        brk = {8: "11.5 seconds.", 10: "on theirs."}.get(n)
                        if brk and brk in ln["show"]:
                            ln["show"] = ln["show"].replace(brk, brk + " <pause 0.3>", 1)
                pz = {8: 0.7, 11: 0.9, 16: 0.6}.get(n, 0.3)   # 8, 16: the music drops out in this beat, then the hit ("Four cores", "Typing..."); 11: the queue empties
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            # loudness: Ravi a little above the AI; the test result and the last line lifted
            g = (-1.0 if who == "ai" else 0.5) + {8: 1.0, 11: -1.0, 16: 1.8}.get(n, 0.0)   # measured against the bed: 8-12 dB over it
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
