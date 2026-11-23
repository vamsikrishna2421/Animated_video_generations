# UC01 "42 Seconds of Silence" (how an AI phone-call assistant works): writes reels/uc01v1.json (English) and
# reels/uc01te.json (Telugu). Lines from series/scripts/uc01_phone_call_assistant.md (v2 after the script review); [n]
# marks the words the pictures wait for; " | " = two takes with a beat. Voices: pipeline/uc01/voice.py (the Creative 21
# standard + a caller). Numbers: our test (series/scripts/uc01_demo). Scene: Call01Crayon.tsx.
#   python3 pipeline/uc01/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: the shop ("hook", "wide", "ravi", "ai") or an insert ("stages", "quiz",
# "short", "small"). prop: Call01Crayon.tsx.
LINES = {
    1: ("ravi", "hook", "hook", "She hung up! An almost-two-thousand-rupee order, [1] after forty-two seconds of silence!",
        "ఫోన్ పెట్టేసింది! దాదాపు రెండు వేల రూపాయల ఆర్డర్, [1] నలభై రెండు సెకన్లు మాటే లేదు!"),
    2: ("ai", "ai", "why", "I was answering! [1] On this small computer, I hear, then think, then speak, one after the other.",
        "నేను జవాబు చెప్తూనే ఉన్నా! [1] ఈ చిన్న కంప్యూటర్ లో, ముందు వింటా, తర్వాత ఆలోచిస్తా, తర్వాత మాట్లాడతా."),
    3: ("ravi", "ravi", "what", "Forty-two seconds of thinking?!", "నలభై రెండు సెకన్లు ఆలోచిస్తూ కూర్చున్నావా?!"),
    4: ("ai", "stages", "stages", "Hearing her: two seconds. [1] Writing my whole reply: thirty. [2] Turning it into speech: ten. [3] Even big apps took three to five seconds for these three steps.",
        "ఆవిడ మాట వినడానికి రెండు సెకన్లు. [1] మొత్తం జవాబు రాయడానికి ముప్పై. [2] మాటగా మార్చడానికి పది. [3] పెద్ద యాప్స్ కూడా, ఈ మూడు పనులకి మూడు నుంచి ఐదు సెకన్లు తీసుకున్నాయి."),
    5: ("ravi", "quiz", "quiz", "So how do I make you fast? [1] A, shorter answers. [2] B, a smaller model. [3] C, talk while thinking.",
        "మరి నిన్ను ఫాస్ట్ ఎలా చేయాలి? [1] షార్ట్ జవాబా? [2] చిన్న మోడల్ పెట్టాలా? [3] లేక ఆలోచిస్తూనే మాట్లాడటమా?"),
    6: ("ai", "short", "short", "Shorter: seven seconds, [1] but the total was wrong every time. [2] I do the sum by writing it out.",
        "షార్ట్ జవాబు: ఏడు సెకన్లు, [1] కానీ టోటల్ ప్రతిసారీ తప్పు. [2] నేను లెక్క రాస్తూనే చేస్తా."),
    7: ("ravi", "ravi", "smaller", "Then a smaller model!", "అయితే చిన్న మోడల్ పెట్టు!"),
    8: ("ai", "small", "small", "Faster, [1] but right only once. Three times, it charged only for the rice.",
        "ఫాస్ట్ గానే ఉంది, [1] కానీ ఒక్కసారే కరెక్ట్ అయింది. మూడు సార్లు బియ్యానికి మాత్రమే బిల్లు వేసింది."),
    9: ("ai", "quiz", "answer", "C! | I say one sentence while I write the rest. [1] She hears me in two and a half seconds, [2] and the total is right every time.",
        "మూడోది! | మిగతాది రాస్తూనే, ముందు ఒక వాక్యం చెప్పేస్తా. [1] రెండున్నర సెకన్లలో ఆవిడకి నా మాట వినిపిస్తుంది, [2] టోటల్ కూడా ప్రతిసారీ కరెక్ట్."),
    10: ("ravi", "ravi", "rule", "Talk while thinking, but never cut the maths!", "ఆలోచిస్తూనే మాట్లాడు, లెక్క మాత్రం కట్ చేయకు!"),
    11: ("ai", "ai", "twist", "Hello! One bag of rice, twenty-five kilos, [1] two litres of oil, two dozen eggs, delivery by six.",
         "హలో! బియ్యం బస్తా, ఇరవై ఐదు కిలోలు, ఒకటి. [1] రెండు లీటర్ల నూనె, రెండు డజన్ల గుడ్లు, ఆరింటికి డెలివరీ."),
    12: ("caller", "ai", "caller", "Wait, make it three dozen eggs!", "ఆగండి, గుడ్లు మూడు డజన్లు!"),   # render review: she cuts in while the AI reads on (a negative gap)
    14: ("ravi", "ravi", "loop", "You're not listening! [1] She'll hang up again!", "నువ్వు వినట్లేదు! [1] మళ్ళీ ఫోన్ పెట్టేస్తుంది!"),
}
SHOW = {1: "She hung up! A ₹1,928 order, after 42 seconds of silence!", 12: "(the caller, over the AI) Wait, make it 3 dozen eggs!",
        4: "Hearing her: 2 seconds. Writing my whole reply: 30. Turning it into speech: 10. Even big apps took 3 to 5 seconds for these 3 steps.",
        6: "Shorter: 7 seconds, but the total was wrong every time. I do the sum by writing it out.",
        9: "C! <pause 0.8> I say one sentence while I write the rest. She hears me in 2.5 seconds, and the total is right every time.",
        11: "Hello! One bag of rice, 25 kilos, 2 litres of oil, 2 dozen eggs, delivery by 6."}
SHOW_TE = {
    1: "She hung up! An order of almost ₹2,000, and 42 seconds without a word!",
    2: "I was answering! On this small computer, I listen first, then think, then speak.",
    3: "You sat thinking for 42 seconds?!",
    4: "2 seconds to hear her. 30 to write the whole reply. 10 to turn it into speech. Even big apps took 3 to 5 seconds for these 3 steps.",
    5: "So how do I make you fast? A short answer? Put in a small model? Or talk while thinking?",
    6: "Short answer: 7 seconds, but the total was wrong every time. I do the sum while writing it.",
    7: "Then put in a small model!", 8: "It is fast, but it was right only once. 3 times it billed only the rice.",
    9: "The third one! <pause 0.8> While writing the rest, I say one sentence first. She hears me in 2.5 seconds, and the total is right every time.",
    10: "Talk while thinking, but don't cut the maths!",
    11: "Hello! A rice bag, 25 kilos, one. 2 litres of oil, 2 dozen eggs, delivery at 6.",
    12: "(the caller, over the AI) Wait, eggs: 3 dozen!", 14: "You're not listening! She'll hang up again!",
}
TTS_EN = {1: "She hung up! An almost two-thousand rupee order, [1] after forty-two seconds of silence!"}
TEMPO_EN = {"ravi": 1.08, "ai": 1.06, "caller": 1.08}
TEMPO_TE = {"ravi": 1.07, "ai": 1.08, "caller": 1.07}
T = {
    "leftLab": "PEOPLE REPLY IN", "leftVal": "0.2 s", "rightLab": "SHOP AI REPLIED IN", "rightVal": "42 s",
    "stake": "₹1,928 ORDER · SHE HUNG UP", "ended": "CALL ENDED", "story": "Ravi and the shop are made up · our test is real",
    "stagesHead": "ONE PHONE TURN, STEP BY STEP", "stagesSub": "our test · a small computer, no GPU · medians of 6 calls",
    "stages": [["EARS", "her voice → text", 1.8, "#38bdf8"], ["BRAIN", "writes the whole reply", 29.6, "#f87171"],
               ["MOUTH", "the reply → speech", 10.1, "#c084fc"]],
    "silence": "1.8 + 29.6 + 10.1 = 41.5 s of silence",
    "bigApps": "big apps: 3-step voice 2.8-5.4 s · GPT-4o 0.32 s (OpenAI, 2024)",
    "people": "people: about 0.2 s between turns (a 10-language study, PNAS 2009)",
    "quizHead": "HOW DO WE MAKE IT FAST?", "quizSub": "you decide",
    "opts": [["A", "shorter answers"], ["B", "a smaller model"], ["C", "talk while thinking"]],
    "shortHead": "A: \"REPLY IN TWO SHORT SENTENCES\"", "shortSub": "the same 7B model, 6 calls", "shortFast": "42 s → 7.4 s",
    "shortVals": [2259, 2450, 2156, 2159, 2259, 2359], "shortScore": "0 of 6 right", "shortNote": "no working written = no sum done",
    "smallHead": "B: A SMALLER MODEL (1.5B)", "smallSub": "the same full ask, 6 calls", "smallFast": "42 s → 12.2 s",
    "smallVals": [1450, 1605, 1760, 1450, 1928, 1450], "smallScore": "1 of 6 right", "smallNote": "₹1,450 = the rice alone",
    "streamHead": "C: TALK WHILE THINKING", "waitLab": "wait for the whole reply", "firstLab": "say the first sentence, write the rest",
    "restLab": "...the rest is written as she listens", "streamScore": "total right: 6 of 6",
    "streamNote": "1.8 + 0.4 + 0.3 = 2.5 s (added up from our timings)", "streamNote2": "still slower than a person (0.2 s), but she hears you",
    "rule1": "TALK WHILE THINKING", "rule2": "NEVER CUT THE MATHS",
    "callerLab": "the caller, while the AI is still reading:", "callerLine": "\"Wait, make it 3 dozen eggs!\"",
    "next": "NEXT PROBLEM: INTERRUPTIONS", "overTalk": "SHE'S TALKING · IT ISN'T LISTENING",
}
# Sound (CLAUDE.md arc): a boom, clap and the hang-up on frame 1, a buzz on the silence; pops on each step box and a
# clock tick under the silence bar; a pop on the quiz options; one buzz on "0 of 6" and one on "1 of 6"; the bed out
# before C, a ding on C, a success on "right every time"; a lift into the rule; a ring into the new call, a pop on the
# caller's bubble; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.4, "tail": 0.0}),   # render review: the hook sat ~1 dB under the rest
          ("s_b", (5, 6, 7, 8, 9), {"boost": 1.5, "lift": 0.6, "drop_pre": [[1, 1.8, 1.6], [4, 0.9, 1.0]], "tail": 0.0}),   # holds after the quiz and before C
          ("s_c", (10, 11, 12, 14), {"outro": True, "pre": 0.3, "boost": 1.9, "lift": 0.8, "rise": 1.7, "tail": 0.0})]
GAP = {1: 0.2, 2: 0.25, 3: 0.2, 4: 0.3, 5: 2.0, 6: 0.25, 7: 0.2, 8: 0.9, 9: 0.3, 10: 0.4, 11: -2.4, 12: 0.4, 14: 0.0}   # 5: the quiz holds (render review: 2 s); 8: a beat before C; 11: the caller cuts in over the last 2.4 s
GAP_TE = {5: 1.6, 4: 0.2, 6: 0.2, 8: 0.8, 11: -2.6}
FLAGS_TE = {"s_c": {"boost": 1.6, "rise": 1.45}}
YT = {"s_a": "42 s of silence", "s_b": "Fast and right?", "s_c": "Talk while thinking"}
NAMES = {"caller": "Caller"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "uc01te" if te else "uc01v1"
    s = {"id": sid, "title": "42 Seconds of Silence (UC01: how an AI phone-call assistant works)" + (" (Telugu audio)" if te else ""),
         "label": "UC01", "banner": "How an AI phone assistant works", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35,
         "music": "lofi", "names": NAMES, "musicVol": [0.2, 0.42], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.2,
         "captionMode": "phrase", "musicEQ": [[250, -12, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0 if not te else 1.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.25,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.2)), "tempo": TEMPO_TE[who] if te else TEMPO_EN[who]}
            ln["gain_db"] = {11: -6.0, 12: 4.0}.get(n, -1.0 if who == "ai" else 0.5)   # render check: the caller was masked by the AI reading on; she sits on top, it reads on underneath
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = 0.6 if te else 0.8
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "tagSide": {"ravi": "right", "ai": "right", "caller": "left"},
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_call01", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
