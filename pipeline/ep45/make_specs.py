# EP45 "Deepfakes and how to spot them": writes reels/ep45v1.json (English) and reels/ep45te.json (Telugu). Lines come from
# the script (series/scripts/ep45_deepfakes.md); [n] marks the words the pictures wait for; " | " splits a line into two
# takes. Voices: pipeline/ep45/voice.py (EP44's Amma and Chinnu).
#   python3 pipeline/ep45/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the living room ("wide", "amma", "chinnu") or the insert
# ("how": how a deepfake is made). prop: what the line brings on (DeepfakeCrayon.tsx).
LINES = {
    1: ("amma", "wide", "hook", "Your phone money, twenty-two thousand... [1] for five and a half lakh in a WEEK?!",
        "నీ ఫోన్ డబ్బులు, ఇరవై రెండు వేలు... [1] వారంలో ఐదున్నర లక్షలకా?!"),
    2: ("chinnu", "wide", "video", "The Finance Minister said it! [1] It's on video!", "ఫైనాన్స్ మినిస్టరే చెప్పారు! [1] వీడియో ఉంది!"),
    3: ("amma", "amma", "deepfake", "Nobody gives lakhs in a week, kanna. [1] That's a deepfake.", "వారంలో లక్షలు ఎవరూ ఇవ్వరు రా. [1] అది డీప్ ఫేక్."),
    4: ("chinnu", "wide", "lips", "But look, her lips match! [1] It's really her!", "కానీ చూడు, పెదాలు సరిగ్గా కదులుతున్నాయి! [1] అచ్చం ఆవిడే!"),
    5: ("amma", "how", "how", "New fakes get the lips right too. | [1] An AI copied her face and voice from her real speeches, and made her say this.",   # "AI learnt" was heard "I learned"
        "కొత్త ఫేక్ లలో పెదాలు కూడా సరిగ్గానే ఉంటాయి. | [1] ఆవిడ ముఖం, గొంతు కంప్యూటర్ తో కాపీ చేసి, ఆవిడ అనని మాటలు అనిపించారు."),
    6: ("chinnu", "chinnu", "spot", "Then how do I ever spot one?", "మరి ఎలా గుర్తుపట్టాలి?"),
    7: ("amma", "wide", "tests", "First, the money: quick, sure, huge returns? A scam, whatever the face. | [1] Then the source: her verified page, or PIB Fact Check.",
        "మొదట, డబ్బు. తొందరగా, గ్యారంటీగా పెద్ద లాభం అంటే మోసమే. | [1] తర్వాత, ఎవరు పెట్టారో చూడు: బ్లూ టిక్ ఉన్న అసలు పేజీ, లేదా పీ ఐ బీ ఫ్యాక్ట్ చెక్."),
    8: ("chinnu", "wide", "pib", "PIB Fact Check says fake! [1] So my twenty-two thousand?!", "గవర్నమెంట్ ఫ్యాక్ట్ చెక్: ఫేక్! [1] మరి నా డబ్బులు?!"),   # "పీ ఐ బీ" and "ఇరవై రెండు వేలు" came out garbled 4 of 4 (PIB stays on the card)
    9: ("amma", "wide", "call", "Call 1930. [1] Right now.", "వన్ నైన్ త్రీ జీరో కి కాల్ చెయ్. [1] ఇప్పుడే."),
    10: ("chinnu", "wide", "loop", "Amma, now the RBI Governor says double your money! [1] ...Money test: fake!",
         "అమ్మా, ఇప్పుడు ఆర్ బీ ఐ గవర్నర్ గారు డబ్బు డబుల్ చేస్తారంట! [1] ...మనీ టెస్ట్: ఫేక్!"),
}
TTS_EN = {9: "Call one nine three zero. [1] Right now.", 5: "New fakes get the lips right too. | [1] An A.I. copied her face and voice from her real speeches, and made her say this."}   # the helpline as people say it   # spoken forms
SHOW = {1: "Your phone money, ₹22,000... for ₹5.5 lakh in a WEEK?!", 8: "PIB Fact Check says fake! So my ₹22,000?!", 9: "Call 1930. Right now."}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "Your phone money, ₹22,000... for ₹5.5 lakh in a week?!", 2: "The Finance Minister herself said it! There's a video!",
    3: "Nobody gives lakhs in a week. That's a deepfake.", 4: "But look, the lips move right! It's exactly her!",
    5: "In new fakes, the lips are right too. They copied her face and voice with a computer and made her say what she never said.",
    6: "Then how do I recognise one?", 7: "First, the money: quick, guaranteed, huge profit means a scam. Then see who posted it: the real page with the blue tick, or PIB Fact Check.",
    8: "The government fact check: fake! Then my money?!", 9: "Call 1930. Right now.", 10: "Amma, now the RBI Governor will double the money, it seems! ...Money test: fake!",
}
NOCAP = set()
PAUSES = {}
TEMPO_EN = {"amma": 1.1, "chinnu": 1.12}
TEMPO_TE = {"amma": 1.0, "chinnu": 1.05}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a UPI ting, then a hit, a clap and a buzz on frame 1, a second hit on "a WEEK"; a glitch on
# "deepfake"; a riser into the insert; dings on the two tests; the bed out before "PIB Fact Check says fake!", a boom
# and a buzz on it; a boom and clap on 1930; hats and claps building through the last scene; a buzz on "fake!" and the
# slam back to frame 1. The scenes step up.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 0.9, "tail": 0.0}),
          ("s_b", (6, 7, 8), {"boost": 1.25, "drop_pre": [[2, 0.0, 0.7]], "tail": 0.0}),   # the bed out for 0.7 s before the verdict
          ("s_c", (9, 10), {"outro": True, "pre": 0.3, "boost": 1.75, "rise": 1.45, "tail": 0.0})]
GAP = {1: 0.25, 2: 0.2, 3: 0.3, 4: 0.25, 5: 0.4, 6: 0.25, 7: 1.4, 8: 0.35, 9: 0.9, 10: 0.0}   # 7: the tests card holds; 9: 1930 holds
GAP_TE = {7: 1.0}
GAIN = {}
GAIN_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.3}}
YT = {"s_a": "₹22,000 for ₹5.5 lakh a week?", "s_b": "Two tests", "s_c": "Call 1930"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep45te" if te else "ep45v1"
    s = {"id": sid, "title": "₹22,000 for ₹5.5 lakh a week (EP45: Deepfakes)" + (" (Telugu audio)" if te else ""), "label": "EP45",
         "banner": "Deepfakes: how to spot them", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.6] if not te else [0.66, 0.9],   # under speech / in gaps; round 2: TE bed 11 dB under the voice, EN gaps over it
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 0.0 if not te else 4.0,   # dB in the gaps; render review: EN gaps ~3 dB over the voice, TE 12 dB under "musicEndRamp": [0.86, 7.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
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
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_deepfake", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
