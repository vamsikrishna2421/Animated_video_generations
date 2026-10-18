# Skit 02 "The call in my own voice": writes reels/skit02v1.json (English) and reels/skit02te.json (Telugu).
# Script: series/scripts/skit02_code_word.md (viewer-reviewed v2). Three characters, each line its own take
# (pipeline/skit02/voice.py); three scenes so the music can build under the scam, drop before "Kanna..." and lift into
# the plan.
#   python3 pipeline/skit02/make_specs.py
import json
from pathlib import Path

R = Path(__file__).resolve().parents[2] / "reels"

# (who, prop, English, Telugu). prop: what the line brings on screen (HomeCrayon.tsx).
LINES = [
    ("caller", "ring", "Amma! It's me, Chinnu! I lost my phone, this is a friend's!", "అమ్మా! నేనే, చిన్నుని! నా ఫోన్ పోయింది, ఫ్రెండ్ ఫోన్ నుంచి చేస్తున్నా!"),
    ("amma", "turn", "Chinnu?", "చిన్నూ?"),
    ("caller", "money", "I had an accident! I need fifty thousand, right now!", "యాక్సిడెంట్ అయ్యింది! అర్జెంట్ గా యాభై వేలు కావాలి!"),
    ("chinnu", "mute", "Amma, that's not me!", "అమ్మా, అది నేను కాదు!"),
    ("caller", "flags", "Don't tell Nanna! Send it to this number!", "నాన్నకి చెప్పకు! ఈ నంబర్ కి పంపించు!"),
    ("amma", "whisper", "But it's YOUR voice!", "అచ్చం నీ గొంతే!"),
    ("chinnu", "reels", "AI copied it. From my reels.", "ఏ ఐ నా గొంతు కాపీ చేసింది. నా రీల్స్ నుంచి."),
    ("amma", "", "Then how will I ever know it's you?", "మరి నువ్వే అని నాకు ఎలా తెలుస్తుంది?"),
    ("chinnu", "", "Ask for our code word.", "మన కోడ్ వర్డ్ అడుగు."),
    ("amma", "", "We have a code word?", "మనకి కోడ్ వర్డ్ ఉందా?"),
    ("chinnu", "", "Just pretend!", "ఉన్నట్టే అడుగు!"),
    ("amma", "unmute", "[1] Kanna... what's our code word?", "[1] కన్నా... మన కోడ్ వర్డ్ ఏంటి?"),
    ("caller", "glitch", "Code word? [1] Amma, no time! Just send it!", "కోడ్ వర్డ్? [1] అమ్మా, టైం లేదు! డబ్బులు పంపించు!"),
    ("amma", "hangup", "Wrong answer.", "రాంగ్ ఆన్సర్!"),
    ("chinnu", "plan", "Tonight we pick a real one. Not in the family group!", "ఈ రాత్రే అసలు కోడ్ వర్డ్ పెట్టుకుందాం. ఫ్యామిలీ గ్రూప్ లో మాత్రం పెట్టొద్దు!"),
    ("amma", "", "And if I forget it?", "మర్చిపోతే?"),
    ("chinnu", "saved", "Hang up. Call my saved number.", "కట్ చేసి, నా సేవ్ చేసిన నంబర్ కి కాల్ చెయ్."),
    ("amma", "nextday", "Code word?", "కోడ్ వర్డ్?"),
]
# Sound: a hit with the first ring; the bed builds under the scam (rise), drops out before "Kanna..." (drop_at), the
# biggest hit on "Wrong answer." (the scene's own boom), a lift into the plan, a hard stop after the last "Code word?"
SCENES = [("sk2_a", 0, 6, {"rise": 1.35, "tail": 0.1}),
          ("sk2_b", 6, 11, {"lift": True, "tail": 0.1}),
          ("sk2_c", 11, 14, {"boost": 0.45, "drop_cue": 1, "tail": 0.15}),   # the bluff: quiet, the bed drops out before "Kanna..."
          ("sk2_d", 14, 18, {"outro": True, "boost": 1.2, "tail": 0.0})]   # no lift boom here: "Wrong answer." stays the biggest hit
PAUSES = {"en": {13: {"1": 0.45}}, "te": {13: {"1": 0.55}}}   # the caller hesitates after "Code word?"
TTS_EN = {}
YT = {"sk2_a": "A call in his own voice", "sk2_b": "AI copied it", "sk2_c": "The code word", "sk2_d": "Next day"}


def spec(lang):
    te = lang == "te"
    sid = "skit02te" if te else "skit02v1"
    s = {"id": sid, "title": "The call in my own voice" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The call in my own voice", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.42, 1.1], "musicFade": 0.05, "endPad": 0.3, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.05 if te else 1.08, "parler_lang": lang}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for i in range(a, b):
            who, prop, en, tel = LINES[i]
            last = i == len(LINES) - 1
            gap = 0.05 if last else (0.26 if te else 0.16)
            if i == 13:
                gap = 0.6 if te else 0.5   # a beat after "Wrong answer." and the hang-up
            if i == 16:
                gap = 1.2   # NEXT DAY: the card, then the buzz, before the last "Code word?"
            ln = {"who": who, "file": f"{i + 1:02d}_{who}.wav", "text": tel if te else en, "show": en, "maxgap": 0.3 if te else 0.25, "gap": gap}
            if not te and (i + 1) in TTS_EN:
                ln["tts"] = TTS_EN[i + 1]
            if (i + 1) in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][i + 1]
            lines.append(ln)
            beats.append({"who": who, "prop": prop, "n": i + 1})
        data = {"beats": beats, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if scid == "sk2_d":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        sc = {"id": scid, "type": "sk_home", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
              "data": data, "lines": lines}
        scenes.append(sc)
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
