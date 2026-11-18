# EP56 "Can a Free Voice Assistant Understand Telugu? Build a Voice Assistant" (Season 6, a screen tutorial): writes
# reels/ep56v1.json (English) and reels/ep56te.json (Telugu). Lines from series/scripts/ep56_voice_assistant.md; [n] marks
# the words the picture waits for; " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep56/voice.py.
# Scene: Voice56Crayon.tsx. The one variable vs EP53-55 (Bujji's EP53 48h read): frame 1 is a question the viewer already
# has, not a number clash; the middle stays EP54's one code line per step. Texts on screen (data.t) come from our test
# (series/scripts/ep56_demo/voice.json, questions.json).
# Render review: "zero" first in line 1; it answers in English, said; ఉచిత for ఫ్రీ (heard prī); music between lines 0.22 -> 0.15.
#   python3 pipeline/ep56/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Can a free voice assistant understand Telugu? [1] We built one. In Telugu, it got zero order numbers right. | [2] In English: seven of ten.",
        "ఉచిత వాయిస్ అసిస్టెంట్ కి తెలుగు అర్థమవుతుందా? [1] మేం ఒకటి తయారు చేశాం. తెలుగులో, సరైన ఆర్డర్ నంబర్: పదికి సున్నా. | [2] ఇంగ్లీష్ లో: పదికి ఏడు."),
    2: ("pieces", "Three pieces, one line of code each: [1] ears turn the voice into text, the brain is last episode's bot, | [2] and a mouth reads the answer out.",
        "మూడు భాగాలు, ఒక్కోదానికి ఒక్క లైన్: [1] మాటని టెక్స్ట్ గా మార్చే చెవులు, పోయిన ఎపిసోడ్ బాట్ మెదడు, | [2] జవాబు చదివి చెప్పే నోరు."),
    3: ("test", "Our test: ten customers, in computer voices. [1] English: three numbers came out like prices. | [2] Telugu, small free model: Telugu words, in Hindi letters.",
        "మా టెస్ట్: పది మంది కస్టమర్లు, కంప్యూటర్ వాయిస్ లలో. [1] ఇంగ్లీష్: మూడు నంబర్లు ప్రైస్ లా వచ్చాయి. | [2] తెలుగు, చిన్న ఉచిత మోడల్: తెలుగు మాట, హిందీ అక్షరాల్లో."),
    4: ("madeup", "When it couldn't read the number, [1] the AI made one up: one, two, three, four, five. Eight times in fifty tries.",
        "నంబర్ అర్థం కానప్పుడు, [1] చాట్‌బాట్ తనే ఒక నంబర్ పెట్టేసింది: ఒకటి, రెండు, మూడు, నాలుగు, ఐదు. యాభై ప్రయత్నాల్లో ఎనిమిదిసార్లు."),
    5: ("fix", "Best free result: a bigger model, translating to English first. [1] Five of ten, and it answers in English. | [2] About thirty-five seconds an answer on our computer, and twenty of that is the mouth.",
        "బెస్ట్ ఉచిత రిజల్ట్: పెద్ద మోడల్, ముందు ఇంగ్లీష్ లోకి ట్రాన్స్‌లేట్ చేస్తే. [1] పదిలో ఐదు; జవాబు ఇంగ్లీష్ లోనే. | [2] ఒక్క జవాబుకి దాదాపు ముప్పై ఐదు సెకన్లు; అందులో ఇరవై సెకన్లు, నోరే."),
    6: ("loop", "These were computer voices, so try it with yours. [1] Until it's better, have it read the number back, or let customers type it. | [2] Next: deploy your AI app.",
        "ఇవి కంప్యూటర్ వాయిస్ లు; మీ గొంతుతో ట్రై చేసుకోండి. [1] అప్పటిదాకా, నంబర్ తిరిగి చదివి చెప్పించండి, లేదా నంబర్ ని టైప్ లో తీసుకోండి. | [2] తర్వాత: మీ యాప్ ని లైవ్ కి తీసుకెళ్ళడం."),
}
SHOW = {1: "Can a free voice assistant understand Telugu? We built one. In Telugu, it got 0 order numbers right. <pause 0.5> In English: 7 of 10.",
        3: "Our test: 10 customers, in computer voices. English: 3 numbers came out like prices. <pause 0.5> Telugu, small free model: Telugu words, in Hindi letters.",
        4: "When it couldn't read the number, the AI made one up: 1, 2, 3, 4, 5. 8 times in 50 tries.",
        5: "Best free result: a bigger model, translating to English first. 5 of 10, and it answers in English. <pause 0.5> About 35 seconds an answer on our computer, and 20 of that is the mouth.",
        6: "These were computer voices, so try it with yours. Until it's better, have it read the number back, or let customers type it. <pause 0.4> Next: deploy your AI app."}
SHOW_TE = {
    1: "Can a free voice assistant understand Telugu? We built one. In Telugu, right order numbers: 0 of 10. <pause 0.5> In English: 7 of 10.",
    2: "3 parts, one line each: ears that turn speech into text, last episode's bot as the brain, <pause 0.4> a mouth that reads the answer.",
    3: "Our test: 10 customers, in computer voices. English: 3 numbers came out like prices. <pause 0.5> Telugu, small free model: Telugu words, in Hindi letters.",
    4: "When it couldn't understand the number, the chatbot put in a number of its own: 1, 2, 3, 4, 5. 8 times in 50 tries.",
    5: "Best free result: a bigger model, translating to English first. 5 of 10; the answer comes in English. <pause 0.5> About 35 seconds an answer; 20 seconds of that is the mouth alone.",
    6: "These were computer voices; try it with your own voice. Until then, have it read the number back, or take the number by typing. <pause 0.4> Next: taking your app live.",
}
SPLIT_PAUSE = {1: 0.5, 2: 0.4, 3: 0.5, 5: 0.5, 6: 0.4}
SPLIT_PAUSE_TE = {1: 0.5, 2: 0.4, 3: 0.5, 5: 0.5, 6: 0.4}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/ep56_demo/); the shop, orders and customers are made up; computer voices
    "question": "CAN A FREE VOICE ASSISTANT UNDERSTAND TELUGU?",
    "said": "ఆర్డర్ నలభై నాలుగు పదిహేడు, నా ఇయర్‌ఫోన్స్ రిటర్న్ చేశాను. నా రిఫండ్ వచ్చిందా?",
    "saidEn": "\"Order 4417, I returned my earphones. Has my refund come?\"",
    "heardHi": "आल्डर नालभाई, नालगु पदिहेडु, ना एर फोंस रिटन चेसानु।",
    "ears": "text = ears.transcribe(\"q.wav\")",
    "earsFix": "ears.transcribe(\"q.wav\", task=\"translate\")",
    "brain": "answer = bot.ask(text)",
    "mouth": "voice.say(answer)",
    "gloss": "\"Order 4417, I returned my earphones. Has my refund come?\"",
    "enBad": ["\"Order 42.90\"", "\"order 46.11\"", "\"or a $44.17\""],
    "madeup": "{\"tool\": \"get_order\", \"args\": {\"order_id\": \"12345\"}}",
    "heardE": "\"I cancelled order 4611. Where is my money?\"",
    "orders": ["4417", "4502", "4388", "4290", "4611", "4475", "4533", "4362", "4588", "4650"],
    "times": [["ears", 5.4], ["brain", 9.5], ["mouth", 20.2]],
    "full": "full code: in the pinned comment",
}
SCENES = [("s_a", (1,), {"boost": 1.8, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_b", (2,), {"boost": 0.8, "lift": 0.5, "tail": 0.0}),
          ("s_c", (3, 4, 5), {"boost": 1.35, "lift": 0.7, "drop_at": [[1, 1, 0.45], [2, 1, 0.5]], "swell": [2, 2, 1.9], "tail": 0.0}),
          ("s_d", (6,), {"outro": True, "pre": 0.4, "boost": 2.6, "lift": 0.8, "rise": 3.0, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.35, 3: 0.35, 4: 0.4, 5: 0.4, 6: 0.0}
FLAGS_TE = {"s_c": {"boost": 1.2}, "s_d": {"boost": 2.8, "rise": 3.2}}
YT = {"s_a": "Can it understand Telugu?", "s_b": "Ears, brain, mouth", "s_c": "Our test, the best free result", "s_d": "Try it with your voice"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep56te" if te else "ep56v1"
    s = {"id": sid, "title": "Can a Free Voice Assistant Understand Telugu? (EP56)" + (" (Telugu audio)" if te else ""), "label": "EP56",
         "banner": "Build a voice assistant", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.12, 0.15], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1360}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.1 if te else 1.08}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1360, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_voice56", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
