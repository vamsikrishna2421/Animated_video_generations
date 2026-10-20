# NEW IN AI 01 (SKY-001, Skyfall AI's "first engineering world model"): writes reels/new01v1.json (English) and
# reels/new01te.json (Telugu). Script: series/scripts/new01_sky001.md (v2). Two students in a CAD lab (Meghana, Kiran);
# every number on screen is Skyfall's own (skyfall.ai, Oct 19, 2026). Voices: pipeline/new01/voice.py. n = the script's
# line number; the quiz card holds after line 9.
#   python3 pipeline/new01/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: "wide", a person's close shot, or "card" (a full-frame insert).
# Telugu " | " = a line voiced as two takes (joined with a short pause). [9] on line 5 marks its start (the music drop).
LINES = {
    1: ("kiran", "wide", "hook", "Meghana, stop! [1] A new AI designs a part in four seconds!",
        "మేఘన, ఆపు! [1] కొత్త ఏఐ నాలుగు సెకన్లలో ఒక పార్ట్ డిజైన్ చేసేస్తుంది!"),
    2: ("meghana", "meghana", "hours", "Four seconds? This one hub took me three hours!", "నాలుగు సెకన్లా? ఈ ఒక్క హబ్ కి నాకు మూడు గంటలు పట్టింది!"),
    3: ("kiran", "card", "launch", "It's SKY-001. [1] It says fifty-one times faster than GPT-6 Astra, and a hundred and fifty times cheaper!",
        "దాని పేరు స్కై జీరో జీరో వన్. | [1] జీపీటీ సిక్స్ ఆస్ట్రా కంటే యాభై ఒక్క రెట్లు ఫాస్ట్, నూట యాభై రెట్లు తక్కువ ఖర్చు అంట!"),
    4: ("meghana", "meghana", "who", "Says who?", "ఎవరు చెప్పారు?"),
    5: ("kiran", "card", "own", "[9] Um... the company. [1] Their own test.", "[9] అదీ, ఆ కంపెనీనే. [1] వాళ్ళ సొంత టెస్ట్."),
    6: ("meghana", "meghana", "how", "Okay. How is it so fast?", "సరే. అంత ఫాస్ట్ ఎలా?"),
    7: ("kiran", "card", "split", "It says it imagines the shape first. That's the world model. [1] Then it splits it into parts, down to the screws.",
        "ముందు షేప్ మొత్తం ఊహిస్తుందంట, అదే వరల్డ్ మోడల్. | [1] తర్వాత స్క్రూల దాకా పార్టులుగా విడదీస్తుంది."),
    8: ("meghana", "meghana", "each", "And each part?", "మరి ఒక్కో పార్ట్?"),
    9: ("kiran", "card", "sketch", "Drawn like you do: [1] sketch, stretch, cut. [2] And it's more accurate than all of them!",
        "నువ్వు గీసినట్టే: [1] స్కెచ్ వేసి, పైకి లాగి, కట్. | [2] పైగా అన్నిటికంటే కరెక్ట్ అంట!"),
    10: ("meghana", "card", "same", "Point six apart? [1] That's a tie. Their real claim is [2] speed and cost.",
         "పాయింట్ సిక్స్ తేడానా? [1] అది సేమ్. [2] వాళ్ళ అసలు క్లెయిమ్ స్పీడ్, ఖర్చు."),
    11: ("kiran", "card", "plan", "On floor plans, it matched forty-four percent. [1] GPT-6 Astra got even less.",
         "ఫ్లోర్ ప్లాన్స్ లో నలభై నాలుగు శాతమే మ్యాచ్ అయింది. | [1] జీపీటీ సిక్స్ ఆస్ట్రా కి ఇంకా తక్కువ."),
    12: ("meghana", "meghana", "house", "Less than half? [1] I'm not living in any of those houses!", "సగం కూడా లేదా? [1] ఆ ఇళ్ళలో దేంట్లోనూ నేను ఉండను!"),
    13: ("kiran", "kiran", "tonight", "Can we try it tonight?", "ఈ రాత్రే ట్రై చేద్దామా?"),
    14: ("meghana", "wide", "rule", "Waitlist only. No price yet. [1] Ask any launch three things. One: who tested it? Two: against what? Three: can I use it today?",
         "వెయిట్‌లిస్ట్ మాత్రమే. ధర కూడా చెప్పలేదు. | [1] ఏ లాంచ్ అయినా ఈ మూడు అడుగు. ఒకటి, ఎవరు టెస్ట్ చేశారు? రెండు, దేనితో పోల్చారు? మూడు, ఇప్పుడు వాడగలనా?"),
    15: ("kiran", "wide", "again", "Wait! [1] Another AI, a thousand times faster!", "ఆగు! [1] ఇంకో ఏఐ, వెయ్యి రెట్లు ఫాస్ట్ అంట!"),
    16: ("meghana", "meghana", "who", "Says who?", "ఎవరు చెప్పారు?"),   # the loop: back to "Meghana, stop!"
}
TTS_EN = {3: "It's Sky zero zero one. [1] It says fifty-one times faster than G P T six Astra, and a hundred and fifty times cheaper!",
          11: "On floor plans, it matched forty-four percent. [1] G P T six Astra got even less."}
# Sound (CLAUDE.md arc): a hit on frame 1; the bed builds under the claims and drops out before "Um... the company";
# a lift into how it works; the quiz's 3-2-1 over the bed; a hit on the cut to the numbers and a drop before "That's a
# tie"; a swell under the floor plan joke; a rise into the loop.
SCENES = [("n1_a", (1, 2, 3, 4, 5), {"boost": 1.15, "rise": 1.3, "drop_at": [[4, 9]], "tail": 0.1}),
          ("n1_b", (6, 7, 8, 9), {"lift": 0.5, "pre": 0.35, "boost": 0.85, "tail": 0.1}),
          ("n1_c", (10, 11, 12), {"pre": 0.35, "drop_cue": 1, "boost": 1.0, "swell": [2, 1, 1.3], "tail": 0.1}),   # pre: the hit on the cut hid "Point"
          ("n1_d", (13, 14, 15, 16), {"outro": True, "boost": 1.5, "rise": 1.7, "tail": 0.0})]
GAP = {1: 0.2, 3: 0.3, 4: 0.5, 7: 0.3, 9: 4.3, 10: 0.4, 11: 0.3, 14: 1.2, 15: 0.2}   # 4: a beat before "Um"; 9: the quiz; 14: the rule card
GAIN = {"meghana": 0.5, "kiran": 0.0}
GAIN_LINE = {10: 1.0, 15: 1.0}
TEMPO = {"en": 1.1, "te": 1.06}
TEMPO_WHO = {"en": {"kiran": 1.2, "meghana": 1.14}}   # Fish takes run long (73 s at 1.1): Kiran is breathless anyway
YT = {"n1_a": "The launch", "n1_b": "How it works", "n1_c": "The numbers", "n1_d": "How to check any launch"}
MARK = re.compile(r"\[\d+\]\s*")


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
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": MARK.sub("", en).strip(),
                  "maxgap": 0.3 if te else 0.2, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if who in TEMPO_WHO.get(lang, {}):
                ln["tempo"] = TEMPO_WHO[lang][who]
            if not te and n in TTS_EN:   # cues are placed by the spoken letters, so the text is the spoken form too
                ln["text"] = ln["tts"] = TTS_EN[n]
            if te and " | " in tel:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = tel.split(" | ")
                ln.update({"text": f"{p1} <pause 0.3> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": 0.3})
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
