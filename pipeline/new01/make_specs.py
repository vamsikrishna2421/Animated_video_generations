# NEW IN AI 01 (SKY-001, Skyfall AI's "first engineering world model"): writes reels/new01v1.json (English) and
# reels/new01te.json (Telugu). Script: series/scripts/new01_sky001.md. Two students in a CAD lab (Meghana, Kiran); every
# number on screen is Skyfall's own (skyfall.ai, Oct 19, 2026). Voices: pipeline/new01/voice.py. n = the script's line
# number; the quiz card holds after line 9.
#   python3 pipeline/new01/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: "wide", a person's close shot, or "card" (a full-frame insert).
LINES = {
    1: ("kiran", "wide", "hook", "Meghana, stop! [1] A new AI designs a whole wheel in four seconds!",
        "మేఘన, ఆపు! [1] కొత్త ఏఐ నాలుగు సెకన్లలో మొత్తం వీల్ డిజైన్ చేస్తుంది!"),
    2: ("meghana", "meghana", "hours", "Four seconds? This one hub took me three hours!", "నాలుగు సెకన్లా? ఈ ఒక్క హబ్ కి నాకు మూడు గంటలు పట్టింది!"),
    3: ("kiran", "card", "launch", "It's SKY-001. [1] Fifty-one times faster than GPT-6 Astra. A hundred and fifty times cheaper!",
        "దాని పేరు స్కై జీరో జీరో వన్. [1] జీపీటీ సిక్స్ ఆస్ట్రా కంటే యాభై ఒక్క రెట్లు ఫాస్ట్. నూట యాభై రెట్లు చీప్!"),
    4: ("meghana", "meghana", "who", "Says who?", "ఎవరు చెప్పారు?"),
    5: ("kiran", "card", "own", "Um... the company. [1] Their own test.", "అదీ... ఆ కంపెనీనే. [1] వాళ్ళ సొంత టెస్ట్."),
    6: ("meghana", "meghana", "how", "Okay. How is it so fast?", "సరే. అంత ఫాస్ట్ ఎలా?"),
    7: ("kiran", "card", "split", "It doesn't type CAD code like a chatbot. [1] It imagines the shape, then splits it into parts, down to the screws.",
        "చాట్‌బాట్ లాగా కోడ్ రాయదు. [1] ముందు షేప్ ఊహిస్తుంది, తర్వాత స్క్రూల దాకా పార్టులుగా విడదీస్తుంది."),
    8: ("meghana", "meghana", "each", "And each part?", "మరి ఒక్కో పార్ట్?"),
    9: ("kiran", "card", "sketch", "Drawn like you do: [1] sketch, extrude, cut. They call it a world model.",
        "నువ్వు గీసినట్టే: [1] స్కెచ్, ఎక్స్‌ట్రూడ్, కట్. దాన్ని వరల్డ్ మోడల్ అంటారు."),
    10: ("meghana", "card", "same", "Point six apart? [1] That's the same. The win is speed and cost.",
         "పాయింట్ సిక్స్ తేడానా? [1] అది సేమ్. గెలుపు స్పీడ్ లో, ఖర్చులో."),
    11: ("kiran", "card", "plan", "On floor plans, it matched forty-four percent.", "ఫ్లోర్ ప్లాన్స్ లో నలభై నాలుగు శాతమే మ్యాచ్ అయింది."),
    12: ("meghana", "meghana", "house", "Less than half? [1] I'm not living in that house!", "సగం కూడా లేదా? [1] ఆ ఇంట్లో నేను ఉండను!"),
    13: ("kiran", "kiran", "tonight", "Can we try it tonight?", "ఈ రాత్రే ట్రై చేద్దామా?"),
    14: ("meghana", "wide", "rule", "Waitlist only. [1] Ask every launch: who tested it, against what, can I use it today?",
         "వెయిట్‌లిస్ట్ మాత్రమే. [1] ప్రతి లాంచ్ ని అడుగు: ఎవరు టెస్ట్ చేశారు, దేనితో పోల్చారు, ఇప్పుడు వాడగలనా?"),
    15: ("kiran", "wide", "again", "Wait! Another AI, a thousand times faster! [1] Meghana, stop!", "ఆగు! ఇంకో ఏఐ, వెయ్యి రెట్లు ఫాస్ట్! [1] మేఘన, ఆపు!"),
}
TTS_EN = {3: "It's Sky zero zero one. [1] Fifty-one times faster than G P T six Astra. A hundred and fifty times cheaper!",
          10: "Point six apart? [1] That's the same. The win is speed and cost."}
# long Telugu lines voiced as two takes, joined
TE_SPLIT = {3: ("దాని పేరు స్కై జీరో జీరో వన్.", "జీపీటీ సిక్స్ ఆస్ట్రా కంటే యాభై ఒక్క రెట్లు ఫాస్ట్. నూట యాభై రెట్లు చీప్!"),
            7: ("చాట్‌బాట్ లాగా కోడ్ రాయదు.", "ముందు షేప్ ఊహిస్తుంది, తర్వాత స్క్రూల దాకా పార్టులుగా విడదీస్తుంది."),
            14: ("వెయిట్‌లిస్ట్ మాత్రమే.", "ప్రతి లాంచ్ ని అడుగు: ఎవరు టెస్ట్ చేశారు, దేనితో పోల్చారు, ఇప్పుడు వాడగలనా?")}
# Sound (CLAUDE.md arc): a hit on frame 1; the bed builds under the claims; a lift into how it works; the quiz's 3-2-1
# over the bed and a drop before "Point six apart?" with a hit; up for the floor plan joke; a rise into the loop.
SCENES = [("n1_a", (1, 2, 3, 4, 5), {"boost": 1.15, "rise": 1.3, "tail": 0.1}),
          ("n1_b", (6, 7, 8, 9), {"lift": 0.5, "pre": 0.35, "boost": 0.85, "tail": 0.1}),
          ("n1_c", (10, 11, 12), {"drop_cue": 0, "boost": 1.0, "tail": 0.1}),
          ("n1_d", (13, 14, 15), {"outro": True, "boost": 1.5, "rise": 1.7, "tail": 0.0})]
GAP = {1: 0.2, 3: 0.3, 7: 0.3, 9: 3.9, 10: 0.5, 11: 0.3, 14: 1.2}   # 9: the quiz; 10: the bars; 14: the rule card
GAIN = {"meghana": 0.5, "kiran": 0.0}
GAIN_LINE = {10: 1.0, 15: 1.0}
TEMPO = {"en": 1.1, "te": 1.06}
YT = {"n1_a": "The launch", "n1_b": "How it works", "n1_c": "The numbers", "n1_d": "How to check any launch"}


def spec(lang):
    te = lang == "te"
    sid = "new01te" if te else "new01v1"
    s = {"id": sid, "title": "SKY-001: the first engineering world model?" + (" (Telugu audio)" if te else ""), "label": "NEW IN AI",
         "banner": "SKY-001: AI that designs parts", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.4, 0.8], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase",
         "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": False, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": en.replace("[1] ", ""),
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if te and n in TE_SPLIT:
                ln.update({"tts": TE_SPLIT[n][0], "file2": f"{n:02d}b_{who}.wav", "tts2": TE_SPLIT[n][1], "pause": 0.3})
            g = GAIN[who] + GAIN_LINE.get(n, 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_lab", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
