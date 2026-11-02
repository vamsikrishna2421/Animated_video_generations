# Creative 15 "Ammamma's dream wedding" (a live FM phone-in: a mother calls in because the AI's English wedding card
# married off her own mother): writes reels/creative15v1.json (English) and reels/creative15te.json (Telugu). Lines come
# from the script (series/scripts/creative15_wedding_card.md); [n] marks the words the pictures wait for; " | " splits a
# line into two takes. Voices: pipeline/creative15/voice.py. Numbers: our test (series/scripts/creative15_demo).
#   python3 pipeline/creative15/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: "card" (the English card on her phone), "split" (the studio
# over her living room), "test" (our test card), "rule" (the fill-in-the-blanks card), "home" (her living room, the end).
# prop: what the line brings on (WeddingCrayon.tsx).
LINES = {
    1: ("sarojini", "card", "hook", "RJ garu, the AI turned my daughter's wedding card [1] into my mother's!",
        "ఆర్జే గారూ, | [1] చాట్ బాట్ మా అమ్మకి పెళ్ళి చేసేసింది!"),
    2: ("bunny", "split", "onair", "Your mother's?! [1] What does it say?", "మీ అమ్మకా?! [1] ఏం రాసింది?"),
    3: ("sarojini", "card", "dream", "\"Our mother's dream wedding with Kalyan.\" [1] Where is Swapna?",
        "\"అవర్ మదర్స్ డ్రీమ్ వెడ్డింగ్ విత్ కళ్యాణ్\". | [1] మా స్వప్న ఎక్కడ?"),
    4: ("bunny", "card", "name", "Swapna means dream! [1] The AI translated her name.",
        "స్వప్న అంటే డ్రీమ్ కదా! [1] పేరుని కూడా ట్రాన్స్ లేట్ చేసేసింది."),
    5: ("sarojini", "card", "girl", "And \"our girl\" [1] became \"our mother\"!", "\"మా అమ్మాయి\" ని [1] \"మా అమ్మ\" చేసేసింది!"),
    6: ("bunny", "test", "test", "We tried your card on a small free AI, twenty times. | [1] Swapna: zero. Half the time, Grandma was the bride!",
        "మీ కార్డు ని ఇరవై సార్లు ట్రై చేశాం, ఒక చిన్న ఫ్రీ చాట్ బాట్ తో. | [1] స్వప్న పేరు ఒక్కసారి కూడా రాలేదు! సగం సార్లు అమ్మమ్మే బ్రైడ్!"),
    7: ("sarojini", "split", "keep", "I'll tell it: keep the names exactly!", "పేర్లు మార్చొద్దు అని చెప్తా!"),
    8: ("bunny", "test", "worse", "We did. Worse! | [1] Friday went wrong nine times, and ten-thirty became sunrise!",
        "అదీ చేశాం. ఇంకా దారుణం! | [1] తొమ్మిది సార్లు శుక్రవారం మారిపోయింది. ఉదయం కాస్తా సన్ రైజ్ అయింది!"),
    9: ("bunny", "rule", "rule", "Leave blanks for the names, date and day. | [1] Let the AI do the rest, then fill them in yourself.",
        "పేర్లు, తేదీ, రోజు దగ్గర ఖాళీ వదలండి. | [1] మిగతాది చాట్ బాట్ కి ఇచ్చి, ఖాళీలు మీరే నింపండి."),
    10: ("sarojini", "split", "check", "And Swapna checks it [1] before the family group sees it!",
         "ఫ్యామిలీ గ్రూప్ లో పెట్టే ముందు, | [1] స్వప్న ఒకసారి చదువుతుంది!"),
    11: ("swapna", "home", "loop", "Amma... [1] you already sent it!", "అమ్మా... [1] నువ్వు ఆల్రెడీ పంపేశావ్!"),   # then the family group floods: frame 1 (loops)
}
TTS_EN = {}
SHOW = {6: "We tried your card on a small free AI, 20 times. <pause 0.3> Swapna: 0. Half the time, Grandma was the bride!",
        8: "We did. Worse! <pause 0.3> Friday went wrong 9 times, and 10:30 became sunrise!"}
SHOW_TE = {
    1: "RJ garu, <pause 0.3> the chatbot married off my mother!", 2: "Your mother?! What did it write?",
    3: "\"Our mother's dream wedding with Kalyan.\" <pause 0.3> Where is our Swapna?", 4: "Swapna means dream! It translated even her name.",
    5: "\"Our girl\" became \"our mother\"!", 6: "We tried your card 20 times, on a small free chatbot. <pause 0.3> Swapna's name: not once! Half the time, Ammamma was the bride!",
    7: "I'll tell it: don't change the names!", 8: "We did that too. Even worse! <pause 0.3> Friday changed 9 times. Morning (udayam) became sunrise!",
    9: "Leave blanks at the names, date and day. <pause 0.3> Give the rest to the chatbot, fill the blanks yourself.",
    10: "Before it goes to the family group, <pause 0.3> Swapna reads it once!", 11: "Amma... you already sent it!",
}
NOCAP = set()
PAUSES = {}
SPLIT_PAUSE = {6: 0.6, 8: 0.5}   # the stop before "Swapna: zero" and before the day
TEMPO_EN = {"sarojini": 1.08, "bunny": 1.12, "swapna": 1.08}
TEMPO_TE = {"sarojini": 1.0, "bunny": 1.0, "swapna": 1.0}   # Telugu speed-ups swallowed words in EP42 and Creative 14
TEMPO_LINE_EN = {}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a phone ring and a hit on frame 1, an ON AIR sting when the studio comes in, a record-scratch
# glitch on "my mother's"; a ding on "dream"; the bed out before "Swapna: zero", a boom on it; a buzz on "worse"; claps
# and a boom on the rule; hats building through the last scene; message pings piling up on the flood; the slam to frame 1.
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 0.95, "tail": 0.0}),
          ("s_b", (6, 7, 8), {"boost": 1.2, "drop_at": [[0, 1]], "tail": 0.0}),   # the bed out before "Swapna: zero"
          ("s_c", (9, 10, 11), {"lift": 1.0, "pre": 0.3, "outro": True, "boost": 1.6, "rise": 1.3, "tail": 0.0})]
GAP = {1: 0.3, 2: 0.25, 3: 0.3, 4: 0.3, 5: 0.4, 6: 0.5, 7: 0.25, 8: 0.6, 9: 2.2, 10: 0.3, 11: 0.3}   # 9: the rule card holds 3 s+
GAP_TE = {9: 1.0}   # render review: 1.3 s of dead air after the rule
FLAGS_TE = {"s_c": {"boost": 1.4, "rise": 1.15}}   # a louder last-scene bed buries Telugu words (EP40, Creative 13, EP42)
YT = {"s_a": "Ammamma's dream wedding", "s_b": "Our test", "s_c": "Fill the blanks yourself"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative15te" if te else "creative15v1"
    s = {"id": sid, "title": "Ammamma's dream wedding (Creative 15: AI translation)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI translations", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.5, 0.66], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.0, "captionMode": "phrase",
         "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 1.2, "musicEndRamp": [0.85, 6.0],
         "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28,
                  "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_LINE_EN.get(n, TEMPO_EN[who])}
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:
                p1, p2 = ln["text"].split(" | ")
                pz = SPLIT_PAUSE.get(n, 0.3)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            ln["gain_db"] = 0.5
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
            flags = {**flags, **FLAGS_TE.get(scid, {})}
        scenes.append({"id": scid, "type": "sk_card", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
