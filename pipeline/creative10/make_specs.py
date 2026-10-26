# Creative 10 "The AI gave me three months" (series/scripts/creative10_three_months.md, script v2): writes
# reels/creative10v1.json (English) and reels/creative10te.json (Telugu). A Telugu TV-serial parody in a living room:
# Thathayya read the AI's "over the past 2 to 3 months" (next to "a shorter life expectancy") as a countdown; Kamala and
# Tommy get the triple zoom too; Sravani reads it, gives the line to type, the AI answers simply, our test, "AI explains /
# the doctor decides", "You'll live. Your laddus won't.", and he types three words about laddus: the replay's first frame
# (his panic) is the payoff. Scene component: video/src/reel/loop/SerialCrayon.tsx (sk_serial). Voices:
# pipeline/creative10/voice.py. Numbers: our test (series/scripts/creative10_demo, every reply read by hand:
# pipeline/creative10/report_demo.py HAND).
#   python3 pipeline/creative10/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
DEMO = ROOT / "series/scripts/creative10_demo/results.json"

# n: (who, shot, prop, English, Telugu). who: thatha / kamala / sravani / aichat (the app, through the phone sound).
# shot: thatha / kamala / sravani (close in the living room), wide, phone (the chat on his phone, full frame).
# [n] marks a cue (a highlight, a card or a row pops on the word after it).
# v2 (script review): "three words" (his "HbA1c 7.2 meaning" is three); the study moved to the caption (two stat beats in
# a row dragged, and it tested symptoms, not reports); the rule comes before the reassurance, the laughs come last.
LINES = {
    1: ("thatha", "thatha", "hook", "The AI gave me two to three months!", "ఏ ఐ నాకు రెండు మూడు నెలలే టైం ఇచ్చింది!"),
    2: ("kamala", "kamala", "shock", "Three months?! Mavayya!", "మూడు నెలలా?! మావయ్యా!"),
    3: ("sravani", "wide", "enter", "Thathayya. Give me that.", "తాతయ్యా, ఫోన్ ఇటివ్వు."),
    4: ("sravani", "phone", "past", "\"Average blood sugar over the [1] past two to three months.\" It's a test, Thathayya. Not a countdown.",
        "గత రెండు మూడు నెలల షుగర్ [1] సగటు అని రాసుంది. ఇది టెస్ట్ తాతయ్యా, కౌంట్ డౌన్ కాదు."),
    5: ("thatha", "phone", "jargon", "Then what's \"glycated haemoglobin\"? And \"shorter life expectancy\"?!",
        "మరి గ్లైకేటెడ్ హీమోగ్లోబిన్ ఏంటి? షార్టర్ లైఫ్ ఎక్స్పెక్టెన్సీ ఏంటి?!"),
    6: ("sravani", "sravani", "who", "You typed three words, so it wrote for doctors. Tell it who's reading.",
        "నువ్వు మూడు మాటలే టైప్ చేశావ్, అందుకే డాక్టర్ల కోసం రాసింది. ఎవరు చదువుతున్నారో చెప్పాలి."),
    7: ("sravani", "sravani", "type", "Before the doctor visit, type this: [1] Explain this to my seventy-two-year-old grandfather in simple words. "
        "Then give three questions to ask his doctor.",
        "డాక్టర్ దగ్గరికి వెళ్ళే ముందు, ఇలా టైప్ చేయాలి: [1] Explain this to my seventy-two-year-old grandfather in simple words. "
        "Then give three questions to ask his doctor."),   # Telugu too: she reads the English card
    8: ("aichat", "phone", "calm", "It's like a report card for his sugar: higher than ideal, but not extremely high. [1] Ask his doctor: what does it mean for his health?",
        "ఇది షుగర్ కి రిపోర్ట్ కార్డ్ లాంటిది. ఉండాల్సిన దానికంటే ఎక్కువ, కానీ మరీ ఎక్కువ కాదు. [1] డాక్టర్ ని అడగండి: దీని అర్థం ఆయన ఆరోగ్యానికి ఏంటి?"),
    9: ("sravani", "wide", "test", "I tested a small free AI ten times. Three words: doctor-talk every time. With the line: [1] zero.",
        "ఆఫ్లైన్ లో ఒక చిన్న ఫ్రీ ఏ ఐ ని పది సార్లు టెస్ట్ చేశా. మూడు మాటలకి: ప్రతిసారీ డాక్టర్ భాష. ఈ లైన్ తో: [1] సున్నా."),   # the card's
        # third row (3 questions for the doctor, 10/10) is read, not said: the first cut ran 64 s
    10: ("kamala", "kamala", "rule1", "So the AI explains...", "అంటే, ఏ ఐ వివరిస్తుంది..."),
    11: ("sravani", "sravani", "rule2", "...and the doctor decides.", "డాక్టర్ నిర్ణయిస్తారు."),
    12: ("thatha", "thatha", "alive", "So... I'm not dying?", "అంటే... నేను బతుకుతానా?"),
    13: ("sravani", "sravani", "laddus", "You'll live. Your laddus won't.", "నువ్వు బతుకుతావ్. నీ లడ్డూలే బతకవు."),
    14: ("thatha", "thatha", "loop", "Just one small question... [1] about laddus.", "ఒక్క చిన్న ప్రశ్న... [1] లడ్డూల గురించి."),
}
TTS_EN = {2: "Three months?! Maa-vayya!", 3: "Tatayya. Give me that.",   # the names as said at home ("Taata-yya" came out "Tata, yeah")
          4: "\"Average blood sugar over the past two to three months.\" It's a test, Tatayya. Not a countdown.",
          13: "You'll live. Your laddoos won't.", 14: "Just one small question... about laddoos."}   # "laddus" was heard "ladders"
# captions: English in both reels (the Telugu reel's captions follow the Telugu voice through the cues)
SHOW = {1: "The AI gave me 2 to 3 months!", 4: "\"Average blood sugar over the [1] PAST 2 to 3 months.\" It's a test, Thathayya. Not a countdown.",
        7: "Before the doctor visit, type this:",
        9: "I tested a small free AI 10 times. 3 words: doctor-talk every time. With the line... [1] zero."}
SHOW_TE = {1: "The AI gave me only 2-3 months!", 2: "Three months?! Mavayya!", 3: "Thathayya, give me the phone.",
           4: "It says your average sugar over the [1] PAST 2-3 months. It's a test, Thathayya, not a countdown.",
           5: "Then what's \"glycated haemoglobin\"? What's \"shorter life expectancy\"?!",
           6: "You typed just 3 words, so it wrote for doctors. Tell it who's reading.",
           7: "Before the doctor visit, type this:",
           8: "It's like a report card for sugar: higher than ideal, but not too high. [1] Ask the doctor: what does it mean for his health?",
           9: "I tested a small free AI offline 10 times. 3 words: doctor-talk every time. With this line... [1] zero.",
           10: "So the AI explains...", 11: "...the doctor decides.", 12: "So... I'll live?", 13: "You'll live. Your laddus won't.",
           14: "One small question... [1] about laddus."}
NOCAP = set()
# a: the panic and the misread; b: the line, the answer, our test; c: the rule, the laughs, the loop
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.6, "drop_pre": [[2, 0.05, 0.6]], "tail": 0.1}),   # the serial bed stops as Sravani walks in
          ("s_b", (6, 7, 8, 9), {"lift": 0.9, "pre": 0.3, "boost": 1.5, "drop_at": [[3, "1", 0.4]], "tail": 0.05}),   # margins 8-12 dB   # a drop before "zero"
          ("s_c", (10, 11, 12, 13, 14), {"lift": 0.8, "pre": 0.25, "outro": True, "boost": 1.55, "rise": 1.4, "tail": 0.1})]
GAP = {1: 0.15, 2: 0.95, 3: 0.2, 4: 0.3, 5: 0.25, 7: 0.5, 8: 0.35, 9: 1.4, 10: 0.05, 11: 0.35, 12: 0.2, 13: 1.05}   # 2: Tommy's zoom;
                                                                                         # 13: the laddu zoom; 9: the card holds
GAIN = {"thatha": 0.3, "kamala": 0.3, "sravani": 0.3, "aichat": 0.0}
GAIN_LINE = {1: 0.8, 2: 0.8}   # the serial yells
GAIN_TE = {}
PAUSES = {"en": {9: {"1": 0.35}}, "te": {9: {"1": 0.3}}}   # a beat before "zero"
LINE_TEMPO = {"en": {4: 1.18, 7: 1.1, 8: 1.2, 9: 1.15}, "te": {7: 1.0, 8: 1.15}}   # the line to copy near its own speed
LINE_MAXGAP = {"en": {}, "te": {}}
TEMPO = {"en": 1.12, "te": 1.14}
YT = {"s_a": "The AI gave me three months", "s_b": "Tell it who's reading", "s_c": "AI explains, the doctor decides"}
MARK = re.compile(r"\[\d+\]\s*")


def demo_numbers():
    """From our test, every reply read by hand (report_demo.py HAND): replies in doctor-talk (three words / the line), the
    median words back, replies with three questions for the doctor."""
    d = json.loads(DEMO.read_text()) if DEMO.exists() else {}
    sm = d.get("summary") or {}
    pl, li = sm.get("plain", {}), sm.get("line", {})
    out = {"n": pl.get("n", 10), "plain_jargon": pl.get("with_jargon", 10), "line_jargon": li.get("with_jargon", 0),
           "plain_questions": pl.get("doctor_questions", 0), "line_questions": li.get("doctor_questions", 10),
           "plain_words": int(round(pl.get("median_words", 190), -1)), "line_words": int(round(li.get("median_words", 140), -1))}
    return out


def spec(lang):
    te = lang == "te"
    sid = "creative10te" if te else "creative10v1"
    s = {"id": sid, "title": "The AI gave me three months" + (" (Telugu audio)" if te else ""), "label": "SKIT", "banner": "AI and your report",
         "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15, "music": "lofi", "musicVol": [0.38, 0.85], "musicFade": 0.05,
         "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500,
         "musicGapGain": 3.0, "musicEndRamp": [0.9, 4.0], "musicDuckRamp": 9}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    demo = demo_numbers()
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = SHOW_TE.get(n, MARK.sub("", en)) if te else SHOW.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.2 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            if n in LINE_TEMPO[lang]:
                ln["tempo"] = LINE_TEMPO[lang][n]
            if n in LINE_MAXGAP[lang]:
                ln["maxgap"] = LINE_MAXGAP[lang][n]
            if n in NOCAP:
                ln["nocap"] = True
            g = GAIN[who] + GAIN_LINE.get(n, 0) + (GAIN_TE.get(n, 0) if te else 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "demo": demo, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_serial", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
