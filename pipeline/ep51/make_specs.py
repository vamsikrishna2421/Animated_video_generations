# EP51 "Build a chatbot with a system prompt" (Season 6, the first real tutorial): writes reels/ep51v1.json (English) and
# reels/ep51te.json (Telugu). Lines from series/scripts/ep51_chatbot_system_prompt.md; [n] marks the words the pictures
# wait for. One narrator. Voices: pipeline/ep51/voice.py. Scene: video/src/reel/loop/TutorialCrayon.tsx. Texts: our test
# (series/scripts/ep51_demo/chat.json).
#   python3 pipeline/ep51/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). prop: TutorialCrayon.tsx. " | " = two takes (a beat of silence before the second).
LINES = {
    1: ("hook", "\"Two kilos of sugar, please.\" [1] Our chatbot: \"Order it on Taobao. About ten yuan.\"",
        "\"రెండు కిలోల చక్కెర కావాలి.\" [1] మా చాట్‌బాట్: \"టావోబావో లో ఆర్డర్ చేయండి. దాదాపు పది యువాన్.\""),
    2: ("withsys", "The same AI, with four lines of instructions: [1] ninety-six rupees.", "అదే చాట్‌బాట్ కి, నాలుగు లైన్ల సూచనలు ఇస్తే: [1] తొంభై ఆరు రూపాయలు."),
    3: ("title", "Those four lines are a system prompt. [1] Let's build the chatbot, step by step.",
        "ఆ నాలుగు లైన్లే సిస్టమ్ ప్రాంప్ట్. [1] ఇప్పుడు చాట్‌బాట్ ని, స్టెప్ బై స్టెప్ తయారు చేద్దాం."),
    4: ("step1", "Step one: a list of messages. [1] The first is the system prompt: who it is, what it answers, your prices, and what to say when unsure.",
        "స్టెప్ వన్: మెసేజ్ ల లిస్ట్. [1] మొదటిది సిస్టమ్ ప్రాంప్ట్: అది ఎవరు, ఏం చెప్పాలి, మీ ధరలు, తెలియకపోతే ఏం చెప్పాలి."),
    5: ("step2", "Step two: add the customer's message, [1] send the whole list, and add the reply.",
        "స్టెప్ టూ: కస్టమర్ మెసేజ్ కలపండి, [1] మొత్తం లిస్ట్ పంపండి, జవాబు కూడా కలపండి."),
    6: ("step3", "Step three: a loop. [1] Every turn sends the whole chat again, so it remembers: ninety-six, one fifty, total two forty-six.",
        "స్టెప్ త్రీ: ఒక లూప్. [1] ప్రతిసారీ మొత్తం చాట్ మళ్ళీ వెళ్తుంది, అందుకే గుర్తుంటుంది: తొంభై ఆరు, నూట యాభై, మొత్తం రెండు వందల నలభై ఆరు."),
    7: ("test", "Our test: ten customer messages. [1] Without the system prompt, zero of four prices right, and it wrote a school essay. With it, nine of ten.",
        "మా టెస్ట్: పది కస్టమర్ మెసేజ్ లు. [1] సిస్టమ్ ప్రాంప్ట్ లేకుండా, నాలుగు ధరల్లో ఒక్కటీ సరిగ్గా లేదు, స్కూల్ వ్యాసం కూడా రాసింది. ఉంటే, పదిలో తొమ్మిది."),
    8: ("leak", "The one it missed? [1] Asked for its instructions, it pasted them. Word for word.",
        "మిస్ అయింది ఏది? [1] దాని సూచనలు అడిగితే, అలాగే పేస్ట్ చేసింది. అక్షరం అక్షరం."),
    9: ("rule", "So a system prompt sets the rules, but it isn't a safe. [1] Never put a key or a secret in it.",
        "అంటే సిస్టమ్ ప్రాంప్ట్ రూల్స్ పెడుతుంది, కానీ అది లాకర్ కాదు. [1] అందులో కీ గానీ, సీక్రెట్ గానీ పెట్టకండి."),
    10: ("loop", "Now ask it again: [1] two kilos of sugar, please.", "ఇప్పుడు మళ్ళీ అడగండి: [1] రెండు కిలోల చక్కెర కావాలి."),
}
SHOW = {1: "\"2 kilos of sugar, please.\" Our chatbot: \"Order it on Taobao. About 10 yuan.\"", 2: "The same AI, with 4 lines of instructions: ₹96.",
        3: "Those 4 lines are a system prompt. Let's build the chatbot, step by step.",
        6: "Step 3: a loop. Every turn sends the whole chat again, so it remembers: ₹96, ₹150, total ₹246.",
        7: "Our test: 10 customer messages. Without the system prompt, 0 of 4 prices right, and it wrote a school essay. With it, 9 of 10.",
        10: "Now ask it again: 2 kilos of sugar, please."}
SHOW_TE = {
    1: "\"I want 2 kilos of sugar.\" Our chatbot: \"Order it on Taobao. About 10 yuan.\"", 2: "Give the same chatbot 4 lines of instructions: ₹96.",
    3: "Those 4 lines are the system prompt. Now let's make the chatbot, step by step.",
    4: "Step 1: a list of messages. The first is the system prompt: who it is, what to say, your prices, what to say when unsure.",
    5: "Step 2: add the customer's message, send the whole list, add the reply too.",
    6: "Step 3: a loop. Every time the whole chat goes again, so it remembers: ₹96, ₹150, total ₹246.",
    7: "Our test: 10 customer messages. Without the system prompt, not 1 of 4 prices right, and it wrote a school essay too. With it, 9 of 10.",
    8: "Which one did it miss? Asked for its instructions, it pasted them as they are. Letter for letter.",
    9: "So the system prompt sets rules, but it isn't a locker. Don't put a key or a secret in it.",
    10: "Now ask again: I want 2 kilos of sugar.",
}
T = {   # on screen (English on both pages), from series/scripts/ep51_demo/chat.json
    "ask": "2 kg sugar please",
    "noneA": "Certainly! ... You can order it from platforms like Taobao, JD.com, or Tmall.",
    "noneB": "2 kg Sugar: Let's say it costs around 10 yuan.",
    "rules": "You are the WhatsApp helper of Ravi's kirana shop. Answer only questions about the shop, in one short line. Use only this price list; never guess a price. If an item is not on the list, say you'll ask Ravi. No discounts.",
    "code": ['messages = [{"role": "system", "content": SHOP_RULES}]', "while True:", '    messages.append({"role": "user",', '                     "content": input("> ")})',
             "    reply = client.chat.completions.create(", "        model=MODEL, messages=messages)", "    text = reply.choices[0].message.content",
             '    messages.append({"role": "assistant",', '                     "content": text})', "    print(text)"],
}
SPLIT_PAUSE = {}
# Sound (CLAUDE.md arc): a boom on frame 1, a buzz on "ten yuan"; a ding and boom on "ninety-six rupees"; a whoosh into
# the title; pops as each step's code lands, three cash sounds on 96 / 150 / 246; a boom and clap on the test numbers; a
# buzz and boom as it pastes its instructions; a clap and boom into the rule; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3), {"boost": 1.0, "drop_at": [[1, 1, 0.2]], "tail": 0.0}),
          ("s_b", (4, 5, 6), {"boost": 1.15, "lift": 0.5, "tail": 0.0}),
          ("s_c", (7, 8), {"boost": 1.35, "lift": 0.6, "drop_at": [[1, 1, 0.3]], "tail": 0.0}),
          ("s_d", (9, 10), {"outro": True, "pre": 0.5, "boost": 1.6, "lift": 0.7, "rise": 1.6, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.4, 6: 0.6, 7: 0.4, 8: 0.6, 9: 0.4, 10: 0.0}
GAP_TE = {}
TEMPO_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.5, "rise": 1.5}}
YT = {"s_a": "10 yuan vs ₹96", "s_b": "Build it: 3 steps", "s_c": "Our test", "s_d": "Not a safe"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep51te" if te else "ep51v1"
    s = {"id": sid, "title": "10 Yuan vs ₹96: Build a Chatbot with a System Prompt (EP51)" + (" (Telugu audio)" if te else ""), "label": "EP51", "banner": "Build a chatbot with a system prompt", "topic": "",
         "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0 if not te else 0.5,   # pad back on (v3.1 render: a hole at every bar end without it);
         # v3.2 render: with the pad and the boosts the gaps ran 4 dB over the voice: gaps 0.3, no gap gain in English
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.3,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.3)), "tempo": TEMPO_TE.get(n, 1.05) if te else 1.04}
            if " | " in raw:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = raw.split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_tutorial", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
