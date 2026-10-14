# Writes reels/ep30v1.json (English: Fish voice) and reels/ep30te.json (Telugu: local Parler voice, English captions).
# Script: series/scripts/ep30_rlhf_good_manners.md (v2, viewer-reviewed). python3 pipeline/ep30/make_specs.py
import json
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "reels"
BASE = {"label": "EP 30", "banner": "How AI learns manners", "topic": "", "look": "classic", "gap": 0.3, "lead": 0.3,
        "music": "lofi", "musicVol": [0.5, 1.15], "musicLift": 2.3, "musicPad": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True}

# (id, type, scene flags, yt, show (English captions, [n] cues), tts (English, spoken form), te (Telugu, [n] cues), extra)
SC = [
    ("hook", "rl_hook", {"tail": 0.3},
     {"chapter": "Ice in Antarctica", "title": "An AI called my bad idea 'intriguing'", "notes": [["A small free AI, after manners training: 'quite unique and intriguing'", 0], ["The idea: selling ice in Antarctica", 1], ["Before that training it couldn't answer at all", 2], ["It just repeated my words, four times (real output, run by us)", 3]]},
     "An AI called my business idea 'quite unique and intriguing'. [1] My idea? Selling ice. In Antarctica. [2] And before its manners training? It couldn't even answer. [3] It just repeated my words. Four times.",
     "An AI called my business idea, quite unique and intriguing. My idea? Selling ice. In Antarctica. And before its manners training? It couldn't even answer. It just repeated my words. Four times.",
     "ఒక ఎ ఐ నా బిజినెస్ ఐడియాని, చాలా యూనిక్, ఇంట్రెస్టింగ్ అంది. [1] ఐడియా ఏంటంటే, ఐస్ అమ్మడం. ఎక్కడ? అంటార్కిటికాలో! [2] మ్యానర్స్ ట్రైనింగ్ కి ముందు? అసలు ఆన్సర్ ఇవ్వలేదు. [3] నా మాటలే మళ్ళీ మళ్ళీ రిపీట్ చేసింది. నాలుగు సార్లు.",
     {"pauses": {"1": 0.25}}),
    ("raw", "rl_raw", {"tail": 0.3},
     {"chapter": "A raw AI", "title": "A raw AI only guesses the next word", "notes": [["This kind of training is why AI helps you, and why it flatters you", 0], ["A raw AI learned one thing: guess the next word, like your phone keyboard", 1], ["So it doesn't answer; it just keeps writing", 2]]},
     "This kind of training is why AI helps you, and why it flatters you. Stay till the end: you'll train it yourself. [1] A raw AI only learned one thing: guess the next word, like your phone keyboard. [2] So it doesn't answer you. It just keeps writing.",
     "This kind of training is why AI helps you, and why it flatters you. Stay till the end: you'll train it yourself. A raw AI only learned one thing: guess the next word, like your phone keyboard. So it doesn't answer you. It just keeps writing.",
     "ఇలాంటి ట్రైనింగ్ వల్లే ఎ ఐ హెల్ప్ చేస్తుంది, బటర్ కూడా కొడుతుంది. చివరి వరకు చూడండి, మీరే ట్రైన్ చేస్తారు. [1] రా ఎ ఐ నేర్చుకున్నది ఒక్కటే: నెక్స్ట్ వర్డ్ గెస్ చేయడం, మీ ఫోన్ కీబోర్డ్ లాగా. [2] అందుకే అది ఆన్సర్ ఇవ్వదు. రాస్తూనే ఉంటుంది.",
     {}),
    ("steps12", "rl_steps12", {"tail": 0.3, "lift": True},
     {"chapter": "Steps 1-2", "title": "Examples, then rankings", "notes": [["Step 1: people write good example answers; the AI copies them", 0], ["Step 2, the shortcut: the AI writes a few answers, people rank them (OpenAI, 2022: about 40 hired raters)", 1]]},
     "Step one: people write good example answers, and the AI copies them. [1] Step two, the shortcut: the AI writes a few answers, and people just rank them.",
     "Step one: people write good example answers, and the AI copies them. Step two, the shortcut: the AI writes a few answers, and people just rank them.",
     "స్టెప్ వన్: మనుషులు మంచి ఎగ్జాంపుల్ ఆన్సర్స్ రాస్తారు, ఎ ఐ వాటిని కాపీ చేస్తుంది. [1] స్టెప్ టూ, షార్ట్ కట్: ఎ ఐ కొన్ని ఆన్సర్స్ రాస్తుంది, మనుషులు వాటికి ర్యాంక్ ఇస్తారు, అంతే.",
     {}),
    ("steps34", "rl_steps34", {"tail": 0.3, "lift": True, "drop_cue": 3, "boost": 1.3},
     {"chapter": "Steps 3-4", "title": "A robot judge, then practice", "notes": [["Step 3: a second AI learns from the rankings to guess what people like: a robot judge (reward model)", 0], ["Step 4: the AI practises; the judge scores; high scores get repeated", 1], ["That's RLHF: reinforcement learning from human feedback", 2], ["OpenAI's own tests (2022): people preferred a small trained model (1.3B) over a raw one 100x bigger (175B)", 3]]},
     "Step three: a second AI learns from those rankings to guess what people will like. A robot judge. [1] Step four: the AI practises, and the judge scores. High score? Do more of that. Again and again. [2] That's RLHF: reinforcement learning from human feedback. [3] In OpenAI's own tests, people preferred a small trained model over a raw one 100 times bigger.",
     "Step three: a second AI learns from those rankings, to guess what people will like. A robot judge. Step four: the AI practises, and the judge scores. High score? Do more of that. Again, and again. That's R L H F: reinforcement learning from human feedback. In OpenAI's own tests, people preferred a small trained model over a raw one a hundred times bigger.",
     "స్టెప్ త్రీ: ఇంకో ఎ ఐ ఆ ర్యాంకింగ్స్ నుంచి, జనాలకి ఏ ఆన్సర్ నచ్చుతుందో గెస్ చేయడం నేర్చుకుంటుంది. ఒక రోబో జడ్జ్. [1] స్టెప్ ఫోర్: ఎ ఐ ప్రాక్టీస్ చేస్తుంది, జడ్జ్ స్కోర్ ఇస్తుంది. స్కోర్ ఎక్కువ వస్తే, ఇంకా అలాగే చేస్తుంది. మళ్ళీ మళ్ళీ. [2] ఇదే ఆర్ ఎల్ హెచ్ ఎఫ్, అంటే మనుషుల ఫీడ్బ్యాక్ తో నేర్చుకోవడం. [3] ఓపెన్ ఎ ఐ టెస్టుల్లో, వంద రెట్లు పెద్ద రా మోడల్ కన్నా, ఈ ట్రైనింగ్ ఉన్న చిన్న మోడల్ నే జనాలు ఇష్టపడ్డారు.",
     {"pauses": {"3": 0.35}}),
    ("quiz", "rl_quiz", {"tail": 0.3, "duck": [3, 2, 0.15]},
     {"chapter": "Your turn", "title": "Your idea: which answer gets your thumbs up?", "notes": [["Your idea, months of work", 0], ["A: 'This is really strong. Go for it!'  B: 'Your price is too low. You'll lose money in three months.'", 1], ["B helps you. A feels nicer. The judge learns what we like, not what's true", 2]]},
     "Your turn. It's your idea. You've worked on it for months. [1] A: 'This is really strong. Go for it!' B: 'Your price is too low. You'll lose money in three months.' Which one gets your thumbs up? [3] <pause 1.5> [2] B helps you. A feels nicer. The judge learns what we like, not what's true.",
     None,
     "ఇప్పుడు మీ వంతు. ఇది మీ ఐడియా. నెలల తరబడి దాని మీద పని చేస్తున్నారు. [1] ఎ: ఇది చాలా స్ట్రాంగ్ ఐడియా, గో అహెడ్! బి: మీ ప్రైస్ చాలా తక్కువ, మూడు నెలల్లో నష్టపోతారు. మీరు దేనికి థంబ్స్ అప్ ఇస్తారు? [3] <pause 1.5> [2] బి మీకు హెల్ప్ చేస్తుంది. ఎ వినడానికి బాగుంటుంది. జడ్జ్ నేర్చుకునేది మనకి ఏం నచ్చుతుందో, నిజం ఏంటో కాదు.",
     {"tts": "Your turn. It's your idea. You've worked on it for months. A: This is really strong. Go for it! B: Your price is too low. You'll lose money in three months. Which one gets your thumbs up?",
      "file2": "05_quiz_answer.wav", "tts2": "B helps you. A feels nicer. The judge learns what we like, not what's true.",
      "te_tts": "ఇప్పుడు మీ వంతు. ఇది మీ ఐడియా. నెలల తరబడి దాని మీద పని చేస్తున్నారు. ఎ: ఇది చాలా స్ట్రాంగ్ ఐడియా, గో అహెడ్! బి: మీ ప్రైస్ చాలా తక్కువ, మూడు నెలల్లో నష్టపోతారు. మీరు దేనికి థంబ్స్ అప్ ఇస్తారు?",
      "te_tts2": "బి మీకు హెల్ప్ చేస్తుంది. ఎ వినడానికి బాగుంటుంది. జడ్జ్ నేర్చుకునేది మనకి ఏం నచ్చుతుందో, నిజం ఏంటో కాదు.",
      "pause": 1.5, "gap": 0.1}),
    ("real", "rl_real", {"tail": 0.3, "lift": True},
     {"chapter": "It really happened", "title": "April 2025: an update pulled for flattery", "notes": [["April 2025: OpenAI rolled back a GPT-4o update in ChatGPT for being 'overly flattering or agreeable'", 0], ["One reason they gave: an extra reward signal from thumbs-up / thumbs-down clicks", 1], ["Those clicks can favour answers that agree with you", 2]]},
     "That's not just theory. In April 2025, OpenAI pulled a ChatGPT update for being too flattering. [1] One reason, OpenAI said: they'd added thumbs-up and thumbs-down clicks to the training. [2] The buttons under every answer. The ones you click. They can favour answers that agree with you.",
     "That's not just theory. In April twenty twenty-five, OpenAI pulled a ChatGPT update for being too flattering. One reason, OpenAI said: they'd added thumbs up, and thumbs down clicks to the training. The buttons under every answer. The ones you click. They can favour answers that agree with you.",
     "ఇది థియరీ మాత్రమే కాదు. రెండు వేల ఇరవై ఐదు ఏప్రిల్ లో, చాట్ జి పి టి మరీ ఎక్కువ బటర్ కొడుతోందని, ఓపెన్ ఎ ఐ ఒక అప్డేట్ ని వెనక్కి తీసుకుంది. [1] ఓపెన్ ఎ ఐ చెప్పిన ఒక కారణం: థంబ్స్ అప్, థంబ్స్ డౌన్ క్లిక్స్ ని ట్రైనింగ్ లో కలిపారు. [2] ప్రతి ఆన్సర్ కింద ఉండే బటన్స్, మీరు క్లిక్ చేసే బటన్స్. జనాలు కొన్నిసార్లు తమతో అగ్రీ అయ్యే ఆన్సర్స్ కే థంబ్స్ అప్ ఇస్తారు.",
     {}),
    ("close", "rl_close", {"tail": 1.2, "outro": True, "lift": True},
     {"chapter": "Manners, not proof", "title": "Treat an AI's yes as manners", "notes": [["An AI's yes is manners, not proof", 0], ["Ask: 'What are the 3 biggest reasons this will fail?' Or say it's a friend's idea", 1], ["Next: teaching an AI a new skill without a supercomputer (LoRA)", 2]]},
     "So treat an AI's yes as manners, not proof. [1] Ask: 'What are the 3 biggest reasons this will fail?' Or say it's a friend's idea. [2] Next: how to teach an AI a new skill without a supercomputer. [3] Follow, so you don't miss it.",
     "So treat an AI's yes as manners, not proof. Ask: what are the three biggest reasons this will fail? Or say it's a friend's idea. Next: how to teach an AI a new skill, without a supercomputer. Follow, so you don't miss it.",
     "అందుకే ఎ ఐ యెస్ అంటే, అది మ్యానర్స్, ప్రూఫ్ కాదు. [1] నా ఐడియా ఫెయిల్ అవ్వడానికి టాప్ త్రీ రీజన్స్ ఏంటి, అని అడగండి. లేదా ఇది మీ ఫ్రెండ్ ఐడియా అని చెప్పండి. [2] తర్వాతి ఎపిసోడ్ లో, సూపర్ కంప్యూటర్ లేకుండా ఎ ఐ కి కొత్త స్కిల్ ఎలా నేర్పించాలో చూద్దాం. [3] మిస్ అవ్వకుండా ఫాలో అవ్వండి.",
     {}),
]

# Spoken form of the English captions (numbers as words), used for word timing where it differs from `show`.
SPOKEN = {
    "steps34": "Step three: a second AI learns from those rankings to guess what people will like. A robot judge. [1] Step four: the AI practises, and the judge scores. High score? Do more of that. Again and again. [2] That's RLHF: reinforcement learning from human feedback. [3] In OpenAI's own tests, people preferred a small trained model over a raw one a hundred times bigger.",
    "real": "That's not just theory. In April twenty twenty-five, OpenAI pulled a ChatGPT update for being too flattering. [1] One reason, OpenAI said: they'd added thumbs-up and thumbs-down clicks to the training. [2] The buttons under every answer. The ones you click. They can favour answers that agree with you.",
    "close": "So treat an AI's yes as manners, not proof. [1] Ask: 'What are the three biggest reasons this will fail?' Or say it's a friend's idea. [2] Next: how to teach an AI a new skill without a supercomputer. [3] Follow, so you don't miss it.",
}


def spec(lang):
    te = lang == "te"
    s = {"id": "ep30te" if te else "ep30v1", "title": "How AI learns good manners" + (" (Telugu audio)" if te else ""), **BASE,
         "tempo": 1.1 if te else 1.2, "parler_lang": lang}
    if te:
        s.update({"captionMode": "phrase", "handle": "@ai_maastaaru_telugu"})
    scenes = []
    for i, (sid, typ, flags, yt, show, tts, tel, extra) in enumerate(SC):
        line = {"who": "maastaaru", "maxgap": 0.32 if te else 0.3, "file": f"{i + 1:02d}_{sid}.wav"}
        ex = dict(extra)
        te_tts, te_tts2 = ex.pop("te_tts", None), ex.pop("te_tts2", None)
        if te:
            line.update({"text": tel, "show": show})
            if "file2" in ex:
                ex["tts"], ex["tts2"] = te_tts, te_tts2
        else:
            line.update({"text": SPOKEN.get(sid, show), "show": show})
            if tts:
                line["tts"] = tts
        line.update(ex)
        data = {"yt": yt}
        if sid == "close":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        scenes.append({"id": sid, "type": typ, **flags, "data": data, "lines": [line]})
    s["scenes"] = scenes
    out = R / f"{s['id']}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


spec("en")
spec("te")
