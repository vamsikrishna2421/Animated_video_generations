# EP56 "Can a Free Voice Assistant Understand Telugu? Build a Voice Assistant" (Season 6, a screen tutorial): writes
# reels/ep56v1.json (English) and reels/ep56te.json (Telugu). Lines from series/scripts/ep56_voice_assistant.md; [n] marks
# the words the picture waits for; " | " = two takes with a beat of silence. One narrator. Voices: pipeline/ep56/voice.py.
# Scene: Voice56Crayon.tsx. The one variable vs EP53-55 (Bujji's EP53 48h read): frame 1 is a question the viewer already
# has, not a number clash; the middle stays EP54's one code line per step. Texts on screen (data.t) come from our test
# (series/scripts/ep56_demo/voice.json, questions.json).
#   python3 pipeline/ep56/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Can a free voice assistant understand Telugu? [1] We built one. English: seven of ten. | [2] Telugu: zero.",
        "ఫ్రీ వాయిస్ అసిస్టెంట్ కి తెలుగు అర్థమవుతుందా? [1] మేం ఒకటి తయారు చేశాం. ఇంగ్లీష్: పదిలో ఏడు. | [2] తెలుగు: సున్నా."),
    2: ("what", "A voice assistant is three pieces: [1] ears turn speech into text, a brain answers, and a mouth says it.",
        "వాయిస్ అసిస్టెంట్ లో మూడు భాగాలు: [1] మాటని టెక్స్ట్ గా మార్చే చెవులు, జవాబిచ్చే మెదడు, అది చెప్పే నోరు."),
    3: ("who", "The ears: Whisper, OpenAI's speech model, free and open since 2022. [1] It runs on our own computer.",
        "చెవులు: విస్పర్, ఓపెన్ సోర్స్ స్పీచ్ మోడల్, రెండు వేల ఇరవై రెండు నుంచి ఫ్రీ. [1] మా కంప్యూటర్ లోనే నడుస్తుంది."),
    4: ("steps", "Step one, the ears: one line turns the customer's voice into text. [1] Step two, the brain: last episode's bot and order server, unchanged.",
        "స్టెప్ వన్, చెవులు: ఒక్క లైన్, కస్టమర్ మాటని టెక్స్ట్ గా మారుస్తుంది. [1] స్టెప్ టూ, మెదడు: పోయిన ఎపిసోడ్ బాట్, ఆర్డర్ సర్వర్, మార్పు లేకుండా."),
    5: ("mouth", "Step three, the mouth: [1] a computer voice reads the answer out.",
        "స్టెప్ త్రీ, నోరు: [1] కంప్యూటర్ వాయిస్ జవాబు చదివి చెబుతుంది."),
    6: ("test", "Our test: ten customers' questions, spoken by computer voices. [1] English: seven right; three numbers came out like prices. | [2] Telugu, small ears: Hindi letters. Zero.",
        "మా టెస్ట్: పది మంది కస్టమర్ల ప్రశ్నలు, కంప్యూటర్ వాయిస్ లతో. [1] ఇంగ్లీష్: ఏడు కరెక్ట్; మూడు నంబర్లు ధరల్లా వచ్చాయి. | [2] తెలుగు, చిన్న చెవులు: హిందీ అక్షరాలు. సున్నా."),
    7: ("madeup", "And when it couldn't read the number, [1] the AI made one up: one, two, three, four, five.",
        "నంబర్ అర్థం కానప్పుడు, [1] చాట్‌బాట్ ఒకటి సృష్టించింది: ఒకటి, రెండు, మూడు, నాలుగు, ఐదు."),
    8: ("fix", "Bigger ears, translating to English first: [1] five of ten. | [2] And on our computer, one answer took about thirty-five seconds.",
        "పెద్ద చెవులు, ముందు ఇంగ్లీష్ లోకి అనువదిస్తే: [1] పదిలో ఐదు. | [2] మా కంప్యూటర్ లో, ఒక్క జవాబుకి దాదాపు ముప్పై ఐదు సెకన్లు."),
    9: ("loop", "So test it in your language, with real numbers, and make it read the number back before it acts. [1] Next: deploy your AI app.",
        "అందుకే మీ భాషలో, నిజమైన నంబర్లతో టెస్ట్ చేసుకోండి; పని చేసే ముందు, నంబర్ తిరిగి చదివి చెప్పేలా చేసుకోండి. | [1] తర్వాత: మీ యాప్ ని లైవ్ కి తీసుకెళ్ళడం."),
}
SHOW = {1: "Can a free voice assistant understand Telugu? We built one. English: 7 of 10. <pause 0.5> Telugu: 0.",
        6: "Our test: 10 customers' questions, spoken by computer voices. English: 7 right; 3 numbers came out like prices. <pause 0.5> Telugu, small ears: Hindi letters. 0.",
        7: "And when it couldn't read the number, the AI made one up: 1, 2, 3, 4, 5.",
        8: "Bigger ears, translating to English first: 5 of 10. <pause 0.5> And on our computer, one answer took about 35 seconds.",
        3: "The ears: Whisper, OpenAI's speech model, free and open since 2022. It runs on our own computer."}
SHOW_TE = {
    1: "Can a free voice assistant understand Telugu? We built one. English: 7 of 10. <pause 0.5> Telugu: 0.",
    2: "A voice assistant has 3 parts: ears that turn speech into text, a brain that answers, a mouth that says it.",
    3: "The ears: Whisper, an open-source speech model, free since 2022. It runs on our own computer.",
    4: "Step 1, the ears: one line turns the customer's speech into text. Step 2, the brain: last episode's bot and order server, unchanged.",
    5: "Step 3, the mouth: a computer voice reads the answer out.",
    6: "Our test: 10 customers' questions, in computer voices. English: 7 right; 3 numbers came out like prices. <pause 0.5> Telugu, small ears: Hindi letters. 0.",
    7: "When it couldn't understand the number, the chatbot made one up: 1, 2, 3, 4, 5.",
    8: "Bigger ears, translating to English first: 5 of 10. <pause 0.5> On our computer, one answer took about 35 seconds.",
    9: "So test it in your language, with real numbers; make it read the number back before it acts. <pause 0.4> Next: taking your app live.",
}
SPLIT_PAUSE = {1: 0.5, 6: 0.5, 8: 0.5}
SPLIT_PAUSE_TE = {1: 0.5, 6: 0.5, 8: 0.5, 9: 0.4}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/ep56_demo/); the shop, orders and customers are made up; computer voices
    "question": "CAN A FREE VOICE ASSISTANT UNDERSTAND TELUGU?",
    "said": "ఆర్డర్ నలభై నాలుగు పదిహేడు, నా ఇయర్‌ఫోన్స్ రిటర్న్ చేశాను. నా రిఫండ్ వచ్చిందా?",
    "saidEn": "\"Order 4417, I returned my earphones. Has my refund come?\"",
    "heardHi": "आल्डर नालभाई, नालगु पदिहेडु, ना एर फोंस रिटन चेसानु।",
    "ears": "text = ears.transcribe(\"question.wav\")",
    "brain": "answer = bot.ask(text)",
    "mouth": "voice.say(answer)",
    "enBad": ["\"Order 42.90\"", "\"order 46.11\"", "\"or a $44.17\""],
    "madeup": "{\"tool\": \"get_order\", \"args\": {\"order_id\": \"12345\"}}",
    "heardE": "\"I cancelled order 4611. Where is my money?\"",
    "times": [["ears", 5.4], ["brain", 9.5], ["mouth", 20.2]],
    "full": "full code: in the pinned comment",
}
SCENES = [("s_a", (1, 2, 3), {"boost": 1.7, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_b", (4, 5), {"boost": 0.8, "lift": 0.5, "tail": 0.0}),
          ("s_c", (6, 7, 8), {"boost": 1.1, "lift": 0.7, "drop_at": [[1, 1, 0.45], [2, 1, 0.4]], "swell": [2, 1, 1.9], "tail": 0.0}),
          ("s_d", (9,), {"outro": True, "pre": 0.4, "boost": 2.6, "lift": 0.8, "rise": 3.0, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.3, 3: 0.35, 4: 0.3, 5: 0.35, 6: 0.35, 7: 0.4, 8: 0.4, 9: 0.0}
FLAGS_TE = {"s_c": {"boost": 1.2}, "s_d": {"boost": 2.8, "rise": 3.2}}
YT = {"s_a": "Can it understand Telugu?", "s_b": "Ears, brain, mouth", "s_c": "Our test", "s_d": "Next: deploy your AI app"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep56te" if te else "ep56v1"
    s = {"id": sid, "title": "Can a Free Voice Assistant Understand Telugu? (EP56)" + (" (Telugu audio)" if te else ""), "label": "EP56",
         "banner": "Build a voice assistant", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.12, 0.22], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2, "captionMode": "phrase",
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
