# EP35 "The brain that didn't fit" (model size & small language models): writes reels/ep35v1.json (English) and
# reels/ep35te.json (Telugu). Lines come from the script (series/scripts/ep35_small_models.md, v2); [n] marks the words
# the pictures wait for. Voices: pipeline/ep35/voice.py (as EP34's). Numbers: our test (series/scripts/ep35_demo).
#   python3 pipeline/ep35/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks). shot: camera in the shop ("wide", "ravi") or "screen" (the phone fills the
# frame). prop: what the line brings on (SizeCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "AI! The free brain won't fit in my phone!"),
    2: ("ai", "screen", "storage", "It's 4.7 GB. [1] You have 1 GB free."),
    3: ("ravi", "ravi", "blessings", "Those are blessings! Get a smaller brain!"),
    4: ("ai", "screen", "jars", "A brain is made of numbers: parameters. [1] Phone-size ones are small language models."),
    5: ("ravi", "ravi", "tiny", "Then the tiniest! Half a GB!"),
    6: ("ai", "screen", "test", "We tested all three on forty of your messages. [1] Tiny one: fourteen right."),
    7: ("ravi", "ravi", "fourteen", "Fourteen?! Out of forty?!"),
    8: ("ai", "screen", "diwali", "It filed \"Happy Diwali\" as an order."),
    9: ("ravi", "ravi", "quiz", "How much per kilo is Diwali?! [1] And the medium one?"),
    10: ("ai", "screen", "bars", "[1] Thirty-nine. [2] Same as the big one. [3] Four times faster."),   # [1]: the music drops out before it
    11: ("ravi", "ravi", "medium", "Medium it is! It'll do my bills too!"),
    12: ("ai", "screen", "bills", "Bills? [1] Medium: nine wrong. [2] Big: two wrong."),
    13: ("ravi", "ravi", "which", "So which one do I use?!"),
    14: ("ai", "wide", "rule", "Sorting? One miss is okay: medium. [1] Bills? No misses allowed: calculator."),
    15: ("ravi", "screen", "delete", "Medium is 1.1. I have 1! [1] Fine, delete the good-morning photos."),
    16: ("ai", "screen", "installed", "Done. Medium brain installed."),
    17: ("ravi", "wide", "flood", "Who sent fifty-two good mornings?!"),
    18: ("ai", "screen", "full", "Those go in OTHER. [1] Storage full."),   # "Filed under" was heard "field under"
}
SHOW = {n: t.replace("[1] ", "").replace("[2] ", "").replace("[3] ", "") for n, (_, _, _, t) in LINES.items()}
# English spoken forms: numbers and units in words, capitals out
TTS_EN = {1: "AI! The free brain won't fit in my phone!", 2: "It's four point seven gigabytes. [1] You have one gigabyte free.",
          5: "Then the tiniest! Half a gigabyte!", 15: "Medium is one point one. I have one! [1] Fine, delete the good morning photos.",
          18: "Those go in other. [1] Storage full."}
PAUSES = {10: {"2": 0.3}}   # a beat after "Thirty-nine"
TEMPO_EN = {2: 1.1, 6: 1.1, 10: 1.0, 12: 1.0, 14: 1.1, 1: 1.25, 3: 1.2, 5: 1.25, 7: 1.2, 9: 1.2, 11: 1.25, 13: 1.25, 15: 1.2, 17: 1.2}
# Sound (CLAUDE.md arc): the storage pop-up's hit in the first second, a lift into each insert, the quiz holds, the bed
# drops out right before "Thirty-nine" with a hit on it, up for the rule, rising into the 52 pings and "Storage full".
SCENES = [("sz_a", 1, 3, {"rise": 1.25, "tail": 0.1}),
          ("sz_b", 4, 5, {"lift": 0.6, "pre": 0.35, "boost": 0.6, "tail": 0.1}),
          ("sz_c", 6, 9, {"lift": 0.5, "pre": 0.35, "boost": 0.8, "tail": 0.1}),
          ("sz_d", 10, 13, {"drop_cue": 1, "boost": 1.0, "tail": 0.15}),
          ("sz_e", 14, 15, {"lift": 0.5, "pre": 0.35, "boost": 1.15, "tail": 0.1}),
          ("sz_f", 16, 18, {"outro": True, "boost": 1.35, "rise": 1.4, "tail": 0.0})]
# seconds after line n (default 0.16): the quiz card's hold after 9; the rule card on its own after 14
GAP = {1: 0.2, 8: 0.35, 9: 1.5, 10: 0.35, 12: 0.4, 14: 1.0, 16: 0.3, 17: 0.25}
TE = {
    1: "ఏఐ, ఫ్రీ బ్రెయిన్ నా ఫోన్ లో పట్టట్లేదు!",
    2: "అది ఫోర్ పాయింట్ సెవెన్ జీబీ. [1] మీ దగ్గర ఖాళీ వన్ జీబీనే.",
    3: "అవి దీవెనలు! చిన్న బ్రెయిన్ పెట్టు!",
    4: "బ్రెయిన్ అంతా నంబర్లే, పారామీటర్లు. [1] ఫోన్ సైజువి స్మాల్ లాంగ్వేజ్ మోడల్స్.",
    5: "అయితే అన్నిటికంటే చిన్నది! హాఫ్ జీబీ!",
    6: "మూడింటినీ మీ నలభై మెసేజ్ ల మీద టెస్ట్ చేశాం. [1] చిన్నది: పద్నాలుగే కరెక్ట్.",   # Telugu numbers: "ఫోర్టీనా" was heard "fortyna"
    7: "పద్నాలుగా?! నలభైలో?!",
    8: "హ్యాపీ దీపావళి ని ఆర్డర్ అనుకుంది.",
    9: "దీపావళి కేజీ ఎంత?! [1] మరి మీడియం?",
    10: "[1] ముప్పై తొమ్మిది. [2] పెద్దది కూడా అంతే. [3] కానీ నాలుగు రెట్లు ఫాస్ట్.",
    11: "మీడియమే! నా బిల్లులు కూడా వేస్తుంది!",
    12: "బిల్లులా? [1] మీడియం: తొమ్మిది తప్పులు. [2] పెద్దది: రెండు తప్పులు.",
    13: "మరి ఏది వాడాలి?!",
    14: "మెసేజ్ లకి ఒక్క తప్పు ఓకే: మీడియం. [1] బిల్లులకి ఒక్క తప్పూ కుదరదు: కాలిక్యులేటర్.",
    15: "మీడియం వన్ పాయింట్ వన్. నా దగ్గర వన్ ఏ! [1] సరే, గుడ్ మార్నింగ్ ఫోటోలు డిలీట్ చెయ్.",
    16: "అయిపోయింది. మీడియం బ్రెయిన్ ఇన్స్టాల్ అయింది.",
    17: "యాభై రెండు గుడ్ మార్నింగ్ లు ఎవరు పంపారు?!",
    18: "అవి అదర్ లో పెట్టాను. [1] స్టోరేజ్ ఫుల్.",
}
# long Telugu lines voiced as two takes, joined (EP34, skit 03): 12 babbled in all four tries, 14 lost its first half
TE_PART2 = {12: ("బిల్లులా? మీడియం: తొమ్మిది తప్పులు.", "పెద్దది: రెండు తప్పులు."),
            14: ("మెసేజ్ లకి ఒక్క తప్పు ఓకే: మీడియం.", "బిల్లులకి ఒక్క తప్పూ కుదరదు: కాలిక్యులేటర్.")}
YT = {"sz_a": "The brain won't fit", "sz_b": "Small language models", "sz_c": "Our test: 40 messages", "sz_d": "Medium vs big",
      "sz_e": "Which one to use", "sz_f": "Storage full again"}


def spec(lang="en"):
    te = lang == "te"
    sid = "ep35te" if te else "ep35v1"
    s = {"id": sid, "title": "The brain that didn't fit (EP35: small language models)" + (" (Telugu audio)" if te else ""), "label": "EP35",
         "banner": "The brain that didn't fit", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.4, 0.8], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": False, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.12 if te else 1.2, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for n in range(a, b + 1):
            who, shot, prop, text = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": TE[n] if te else text, "show": SHOW[n],
                  "maxgap": 0.28, "gap": GAP.get(n, 0.16)}
            if te and n in TE_PART2:
                ln.update({"tts": TE_PART2[n][0], "file2": f"{n:02d}b_{who}.wav", "tts2": TE_PART2[n][1], "pause": 0.3})
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if not te and n in TEMPO_EN:
                ln["tempo"] = TEMPO_EN[n]
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            # loudness: Ravi a little above the AI; the reveal and the last line lifted
            g = (-1.0 if who == "ai" else 1.5) + {10: 2.0, 18: 1.5}.get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_size", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
