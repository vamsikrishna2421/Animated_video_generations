# EP44 "Privacy: what happens to your data": writes reels/ep44v1.json (English) and reels/ep44te.json (Telugu). Lines come
# from the script (series/scripts/ep44_privacy.md); [n] marks the words the pictures wait for; " | " splits a line into
# two takes. Voices: pipeline/ep44/voice.py. Numbers: our test (series/scripts/ep44_demo, read by hand).
#   python3 pipeline/ep44/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
RESULT = {"full": 8, "blank": 10}   # named food delivery as the thing to cut, read by hand, strictly (series/scripts/ep44_demo)

# n: (who, shot, prop, English with cue marks, Telugu). shot: the living room ("wide", "amma", "chinnu", "hook") or an
# insert ("where": where your chat goes, "test": our test). prop: what the line brings on (PrivacyCrayon.tsx).
LINES = {
    1: ("chinnu", "wide", "hook", "One tap to delete, Amma... [1] but if Gemini's reviewers read it, it can stay three years!",   # script review: the qualifier in the voice; render review: "which person? someone at home?"
        "అమ్మా, ఒక్క ట్యాప్ తో డిలీట్ చేశావు... [1] కానీ గూగుల్ వాళ్ళు చదివుంటే, ఆ కాపీ మూడేళ్ళ దాకా ఉండొచ్చు!"),
    2: ("amma", "amma", "ring", "With my account number? [1] And my PAN?!",
        "నా అకౌంట్ నంబరూ? [1] పాన్ కార్డ్ నంబరూ?!"),
    3: ("chinnu", "where", "where", "Reviewers at the company read some chats, to improve the AI. [1] That copy isn't deleted when you delete yours.",   # script review: "their copy: whose?"
        "కొన్ని చాట్లని కంపెనీ మనుషులు చదువుతారు, చాట్ బాట్ ని బెటర్ చేయడానికి. [1] నువ్వు డిలీట్ చేసినా, ఆ కాపీ పోదు."),
    4: ("amma", "amma", "salary", "I only asked where my salary goes!", "నా జీతం ఎక్కడికి పోతుందో అడిగానంతే!"),
    5: ("chinnu", "wide", "quote", "Gemini's own privacy page says: [1] don't type what you wouldn't want a reviewer to see.",   # script review: "which app?"
        "జెమినీ సొంత పేజీలోనే ఉంది: [1] ఎవరైనా చదివితే నీకు ఇబ్బంది అనిపించేది టైప్ చేయొద్దు."),   # render review: "ప్రైవసీ" was heard "ప్రవాసి" (a migrant)   # "చూడకూడనిది" is said of adult content
    6: ("amma", "amma", "needs", "But it needs my details to help me!", "కానీ నా వివరాలు లేకపోతే, అది ఎలా సాయం చేస్తుంది?"),
    7: ("chinnu", "test", "test", "We tested it. Your statement, ten times with your numbers, | [1] ten times with them blanked out.",
        "మేం టెస్ట్ చేశాం. నీ స్టేట్మెంట్, పది సార్లు నీ నంబర్లతో, | [1] పది సార్లు అవి తీసేసి."),
    8: ("amma", "test", "and", "And?", "ఏమైంది?"),
    9: ("chinnu", "test", "result", "With or without your numbers, it found the food orders. [1] It never needed your PAN.",   # script review: 8 vs 10 is a tie, not "blanked is smarter"
        "నంబర్లు ఉన్నా, లేకపోయినా, ఫుడ్ డెలివరీ తగ్గించమంది! [1] దానికి నీ పాన్ కార్డ్ అక్కర్లేదు."),
    10: ("amma", "amma", "blank", "So I just blank them out?", "అయితే తీసేస్తే సరిపోతుందా?"),
    11: ("chinnu", "wide", "rule", "Your name, your account number, your PAN: [1] blank them out before you paste. | [2] And in Gemini, switch off Keep Activity.",   # "PAN" in a list was heard "pen"; render review: the switch-off tip said out loud and held
         "నీ పేరు, నంబర్లు: [1] అవి తీసేశాకే పేస్ట్ చెయ్. | [2] జెమినీ లో, కీప్ యాక్టివిటీ ఆఫ్ చెయ్."),   # the three-item list came out blurred in 8 of 8 tries; the card lists them   # render review: "ముందే" was heard with a hard ḍ, near a slur
    12: ("amma", "wide", "photo", "Done! [1] And I'll send the passbook photo too!", "తీసేశా! [1] పాస్ బుక్ ఫోటో కూడా పంపిస్తా!"),
    13: ("chinnu", "wide", "loop", "Amma, the photo has your account numb—", "అమ్మా, ఆ ఫోటోలో నీ అకౌంట్ నంబ—"),
}
TTS_EN = {}   # spoken forms
SHOW = {1: "One tap to delete, Amma... but if Gemini's reviewers read it, it can stay 3 years!"}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "Amma, you deleted it in one tap... but if Google's people read it, that copy can stay up to 3 years!", 2: "My account number? My PAN card number?!",
    3: "People at the company read some chats, to make the chatbot better. Even if you delete it, that copy stays.",
    4: "I only asked where my salary goes!", 5: "It's on Gemini's own page: don't type anything you'd mind someone reading.",
    6: "But without my details, how will it help?", 7: "We tested it. Your statement, 10 times with your numbers, 10 times without them.",
    8: "What happened?", 9: "With or without the numbers, it said: cut food delivery! It doesn't need your PAN card.", 10: "So removing them is enough?",
    11: "Your name, your numbers: paste only after removing them. In Gemini, switch off Keep Activity.", 12: "Removed! I'll send the passbook photo too!",
    13: "Amma, that photo has your account numb—",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"amma": 1.1, "chinnu": 1.12}
TEMPO_TE = {"amma": 1.0, "chinnu": 1.05}   # EP42 / Creative 14: Telugu speed-ups swallow words
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a hit, a clap and a buzz on frame 1 (before his first word); a ding as her account number and PAN
# are circled; a pop as the chat splits, a boom on "Deleting doesn't delete their copy"; a ding on the quote; the bed out
# before "Ten out of ten" with a boom on it and a clap; a boom and clap on the rule; hats and claps building through the
# last scene; a riser into the photo and the slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5, 6), {"boost": 0.9, "tail": 0.0}),   # render review: no arc (quarters within 1 dB): lower start, higher end
          ("s_b", (7, 8, 9, 10), {"boost": 1.25, "drop_pre": [[2, 0.0, 0.8]], "tail": 0.0}),   # the bed out for 0.8 s before the result
          ("s_c", (11, 12, 13), {"outro": True, "pre": 0.3, "boost": 1.75, "rise": 1.45, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.3, 4: 0.2, 5: 0.35, 6: 0.25, 7: 0.25, 8: 0.6, 9: 0.4, 10: 0.2, 11: 1.6, 12: 0.15, 13: 0.0}   # 8: the stop before the result; 11: the rule card holds
GAP_TE = {11: 1.2}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}   # EP42 / Creative 13: a louder last-scene bed buries Telugu words
YT = {"s_a": "Deleted in 1 tap, kept 3 years", "s_b": "Our test", "s_c": "Blank it before you paste"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep44te" if te else "ep44v1"
    s = {"id": sid, "title": "Deleted in 1 tap, kept 3 years (EP44: Privacy)" + (" (Telugu audio)" if te else ""), "label": "EP44",
         "banner": "Privacy: where your data goes", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 0.95 if not te else 4.0,   # dB in the gaps; render review: EN gaps ~3 dB over the voice, TE 12 dB under "musicEndRamp": [0.88, 5.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})   # Creative 13: the opening hit swallowed the first Telugu word
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
                pz = 0.6 if n == 11 else 0.25
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = 0.5 + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "result": RESULT, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_privacy", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
