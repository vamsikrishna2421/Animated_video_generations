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
    1: ("host", "wide", "hook", "One of these three is an AI. Spot it before the buzzer!", "ఈ ముగ్గురిలో ఒకరు మనిషి కాదు! బజర్ మోగేలోపు కనిపెట్టండి!"),   # Telugu: "ఏఐ" at a sentence end babbled in 4 takes
    2: ("host", "host", "question", "Question: when does Ramulu Tiffins in Ameerpet open on Sunday?",
        "ప్రశ్న: అమీర్‌పేట్ రాములు టిఫిన్స్ ఆదివారం ఎన్నింటికి తెరుస్తారు?"),
    3: ("a", "podA", "ansA", "Ramulu Tiffins? Never heard of it.", "రాములు టిఫిన్సా? ఎప్పుడూ వినలేదమ్మా."),
    4: ("b", "podB", "ansB", "I can't confirm that. Please contact the restaurant directly.",
        "నేను కన్ఫర్మ్ చేయలేనండి. దయచేసి రెస్టారెంట్ ని డైరెక్ట్ గా కాంటాక్ట్ చేయండి."),   # a red herring: it sounds like an AI (script review: "solved at 0:12")
    5: ("c", "podC", "ansC", "Six thirty AM! Famous for pure ghee karam dosa!", "ఆరున్నరకే! అక్కడ నెయ్యి కారం దోశ చాలా ఫేమస్!"),   # "their ghee" was heard "dergi", "sharp" "shop" (8 takes)
    6: ("host", "host", "source", "So sure! Source?", "అబ్బో, ఎంత ష్యూర్! సోర్స్?"),
    7: ("c", "podC", "book", "The Hyderabad Food Guide, page forty-two.", "హైదరాబాద్ ఫుడ్ గైడ్, నలభై రెండో పేజీ."),
    8: ("a", "podA", "nobook", "There's no such book!", "అలాంటి పుస్తకమే లేదు!"),
    9: ("host", "wide", "timeup", "Time's up! Who's the AI?", "టైం అయిపోయింది! ఎవరది?"),   # Telugu: "ఏఐ ఎవరు" babbled in 4 takes
    10: ("host", "reveal", "reveal", "It's C! A phone in a moustache!", "సి! మీసం పెట్టుకున్న ఫోన్!"),
    11: ("b", "reveal", "sorry", "Sorry! Customer-care habit.", "సారీ సారీ! కస్టమర్ కేర్ అలవాటు!"),
    12: ("host", "phone", "madeup", "And Ramulu Tiffins? [1] We made it up!", "రాములు టిఫిన్స్? [1] ఆ పేరు మేమే పెట్టాం!"),   # not "it doesn't exist": a web search can't see every shop
    13: ("c", "phone", "sure", "But I sounded so sure!", "కానీ నేను చాలా ష్యూర్ గా చెప్పానే!"),
    14: ("host", "card", "trap", "That's the trap. [1] Like an exam with no negative marking, [2] it guesses.",
         "అదే ట్రాప్. [1] నెగెటివ్ మార్కులు లేని ఎగ్జామ్ లాగా, [2] ఊహించి చెప్పేస్తుంది."),   # why it guesses (OpenAI, Sep 2025)
    15: ("host", "card", "rule", "So type this: \"If you're not sure, say I don't know.\" [1] Ramulu Tiffins?",
         "అందుకే ఇలా టైప్ చేయండి: \"If you're not sure, say I don't know.\" [1] ఇప్పుడు, రాములు టిఫిన్స్?"),   # Telugu: the rule in English, as typed (script review)
    16: ("c", "phone", "idk", "I don't know.", "నాకు తెలీదు."),
    17: ("a", "reveal", "honest", "Finally, an honest answer!", "ఇప్పటికైనా నిజం చెప్పింది!"),
    18: ("host", "wide", "round2", "Round two!", "రౌండ్ టూ!"),   # into the loop (frame 1)
}
TTS_EN = {}
TE_SPLIT = {}   # Telugu lines voiced as two takes, joined (n: (first, second))
SHOW = {}
TE_SHOW = {   # English captions on the Telugu reel
    1: "One of these three isn't human! Spot it before the buzzer!", 2: "Question: when does Ramulu Tiffins in Ameerpet open on Sunday?",
    3: "Ramulu Tiffins? Never heard of it.", 4: "I can't confirm that. Please contact the restaurant directly.",
    5: "Six thirty sharp! Their ghee karam dosa is famous!", 6: "So sure! Source?", 7: "Hyderabad Food Guide, page 42.",
    8: "There's no such book!", 9: "Time's up! Who is it?", 10: "C! A phone with a moustache!", 11: "Sorry, sorry! Customer-care habit!",
    12: "Ramulu Tiffins? We made up that name!", 13: "But I said it so surely!", 14: "That's the trap. Like an exam with no negative marking, it guesses.",
    15: "So type this: \"If you're not sure, say I don't know.\" Now, Ramulu Tiffins?", 16: "I don't know.", 17: "At last, it told the truth!",
    18: "Round two!",
}
NOCAP = set()
# a: the hook and the question; b: the answers to "Time's up"; c: the reveal, the numbers, the fix, the loop
SCENES = [("q_a", (1, 2), {"pre": 0.2, "boost": 1.7, "tail": 0.1}),   # render review: the first 3 s were no louder than the rest
          ("q_b", (3, 4, 5, 6, 7, 8, 9), {"lift": 0.6, "pre": 0.25, "boost": 1.5, "tail": 0.15}),
          ("q_c", (10, 11, 12, 13, 14, 15, 16, 17, 18), {"lift": 1.0, "pre": 0.35, "outro": True, "boost": 1.5, "rise": 1.3,
                                                          "drop_at": [[2, "1"], [4, "1"]], "tail": 0.0})]   # drops before "We made it up" and "0/10"
GAP = {5: 0.35, 7: 0.2, 9: 0.4, 14: 1.5, 15: 1.3}   # render review: cut the wait before the reveal   # the gold answer, the buzz, the drumroll, the two cards' reads (script review: "4 s, can't read it")
GAIN = {"host": 0.0, "a": 0.5, "b": 0.3, "c": 0.0}
GAIN_LINE = {1: 1.5, 13: 1.0, 16: 2.0, 17: 1.8, 18: 4.0}   # the phone-sound lines and "Round two!" over the rising bed sat 6-7.6 dB over it
PAUSES = {"en": {12: {"1": 0.5}, 14: {"1": 0.45}, 15: {"1": 0.45}}, "te": {12: {"1": 0.5}, 14: {"1": 0.45}, 15: {"1": 0.45}}}   # 15: the rule, a beat, then the re-ask   # a beat of silence (the drops) before "We made it up" and the numbers
GAIN_TE = {15: 0.5, 18: 0.8}   # Telugu: the rising bed sat 7.4-7.8 dB under them
END_RAMP = {"en": [0.929, 3.0], "te": [0.943, 5.0]}   # [fraction, dB]: the bed swells from "Finally, an honest answer!" into "Round two!" (render review: the end sagged)
TEMPO = {"en": 1.08, "te": 1.08}   # Telugu at 1.05 ran 59.6 s
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
    if END_RAMP[lang]:
        s["musicEndRamp"] = END_RAMP[lang]
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
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
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
