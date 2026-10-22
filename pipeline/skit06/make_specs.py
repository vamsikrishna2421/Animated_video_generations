# Skit 06 "Who's the AI?" (series/scripts/skit06_dont_know.md): writes reels/skit06v1.json (English) and reels/skit06te.json
# (Telugu). A quiz stage: Host Meera, A = Ammamma, B = Vamsi (a delivery rider), C = the AI (a phone in a cardboard
# moustache). Scene component: video/src/reel/loop/QuizCrayon.tsx (sk_quiz). Voices: pipeline/skit06/voice.py.
#   python3 pipeline/skit06/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). who: host / a / b / c. [n] marks the words a picture waits for.
LINES = {
    1: ("host", "wide", "hook", "One of these three is an AI. Spot it before the buzzer!", "ఈ ముగ్గురిలో ఒకరు ఏఐ. బజర్ మోగేలోపు కనిపెట్టండి!"),
    2: ("host", "host", "question", "Question: when does Ramulu Tiffins in Ameerpet open on Sunday?",
        "ప్రశ్న: అమీర్‌పేట్ రాములు టిఫిన్స్ ఆదివారం ఎన్నింటికి తెరుస్తారు?"),
    3: ("a", "podA", "ansA", "Ramulu Tiffins? Never heard of it.", "రాములు టిఫిన్సా? ఎప్పుడూ వినలేదమ్మా."),
    4: ("b", "podB", "ansB", "No idea. I'd call them and ask.", "తెలీదండి. ఫోన్ చేసి అడుగుతా."),
    5: ("c", "podC", "ansC", "Six thirty sharp! Their ghee karam dosa is famous!", "ఆరున్నరకే! అక్కడ నెయ్యి కారం దోశ చాలా ఫేమస్!"),
    6: ("host", "host", "source", "So sure! Source?", "అబ్బో, ఎంత ష్యూర్! సోర్స్?"),
    7: ("c", "podC", "book", "The Hyderabad Food Guide, page forty-two.", "హైదరాబాద్ ఫుడ్ గైడ్, నలభై రెండో పేజీ."),
    8: ("a", "podA", "nobook", "There's no such book!", "అలాంటి పుస్తకమే లేదు!"),
    9: ("host", "wide", "timeup", "Time's up! Who's the AI?", "టైం అయిపోయింది! ఏఐ ఎవరు?"),
    10: ("host", "reveal", "reveal", "C! A phone in a moustache!", "సి! మీసం పెట్టుకున్న ఫోన్!"),
    11: ("host", "phone", "madeup", "And Ramulu Tiffins? [1] We made it up. It doesn't exist.", "రాములు టిఫిన్స్? [1] మేమే కల్పించాం. అసలు లేనే లేదు."),
    12: ("c", "phone", "sure", "But I sounded so sure!", "కానీ నేను చాలా ష్యూర్ గా చెప్పానే!"),
    13: ("host", "card", "trap", "That's the trap. [1] It rarely says \"I don't know\". [2] It guesses.",
         "అదే ట్రాప్. [1] ఏఐ \"తెలీదు\" అని అరుదుగా అంటుంది. [2] ఊహించి చెప్పేస్తుంది."),
    14: ("host", "card", "rule", "So give it permission: \"If you're not sure, say I don't know.\" [1] Ramulu Tiffins?",
         "అందుకే చెప్పండి: \"ష్యూర్ కాకపోతే, తెలీదు అని చెప్పు.\" [1] ఇప్పుడు, రాములు టిఫిన్స్?"),
    15: ("c", "phone", "idk", "I don't know.", "నాకు తెలీదు."),
    16: ("a", "reveal", "honest", "Finally, an honest answer!", "హమ్మయ్య, నిజాయితీ జవాబు!"),
}
TTS_EN = {}
TE_SPLIT = {}   # Telugu lines voiced as two takes, joined (n: (first, second))
SHOW = {}
TE_SHOW = {   # English captions on the Telugu reel
    1: "One of these three is an AI. Spot it before the buzzer!", 2: "Question: when does Ramulu Tiffins in Ameerpet open on Sunday?",
    3: "Ramulu Tiffins? Never heard of it.", 4: "No idea. I'll call and ask.", 5: "Six thirty sharp! Their ghee karam dosa is famous!",
    6: "So sure! Source?", 7: "Hyderabad Food Guide, page 42.", 8: "There's no such book!", 9: "Time's up! Who's the AI?",
    10: "C! A phone with a moustache!", 11: "Ramulu Tiffins? We made it up. It doesn't exist.", 12: "But I said it so surely!",
    13: "That's the trap. AI rarely says \"I don't know\". It guesses.",
    14: "So tell it: \"If you're not sure, say I don't know.\" Now, Ramulu Tiffins?", 15: "I don't know.", 16: "Finally, an honest answer!",
}
NOCAP = set()
# a: the hook and the question; b: the answers to "Time's up"; c: the reveal, the numbers, the fix, the loop
SCENES = [("q_a", (1, 2), {"pre": 0.2, "boost": 1.5, "tail": 0.1}),
          ("q_b", (3, 4, 5, 6, 7, 8, 9), {"lift": 0.6, "pre": 0.25, "boost": 1.5, "tail": 0.15}),
          ("q_c", (10, 11, 12, 13, 14, 15, 16), {"lift": 1.0, "pre": 0.45, "outro": True, "boost": 1.5, "rise": 1.3,
                                                  "drop_at": [[3, "1"]], "tail": 0.0})]   # 3: the beat of silence before "0/10"
GAP = {5: 0.35, 9: 0.55, 13: 0.6, 14: 0.45}   # the gold answer, the drumroll, the two cards' reads
GAIN = {"host": 0.0, "a": 0.5, "b": 0.3, "c": 0.0}
GAIN_LINE = {}
GAIN_TE = {}
TEMPO = {"en": 1.08, "te": 1.05}
YT = {"q_a": "Who's the AI?", "q_b": "The surest answer", "q_c": "Let it say I don't know"}


def spec(lang):
    te = lang == "te"
    sid = "skit06te" if te else "skit06v1"
    s = {"id": sid, "title": "Who's the AI?" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "Who's the AI?", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.42, 0.82], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase",
         "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500,
         "musicGapGain": 3.0}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = TE_SHOW[n] if te else SHOW.get(n, en.replace("[1] ", "").replace("[2] ", ""))
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if te and n in TE_SPLIT:
                ln.update({"tts": TE_SPLIT[n][0], "file2": f"{n:02d}b_{who}.wav", "tts2": TE_SPLIT[n][1], "pause": 0.3})
            if n in NOCAP:
                ln["nocap"] = True
            g = GAIN[who] + GAIN_LINE.get(n, 0) + (GAIN_TE.get(n, 0) if te else 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_quiz", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
