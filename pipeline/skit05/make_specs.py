# Skit 05 "The client list" (what you paste into a free chatbot isn't private): writes reels/skit05v1.json (English)
# and reels/skit05te.json (Telugu). Script: series/scripts/skit05_client_list.md. An office: Lakshmi (team lead), Arjun
# (new joiner), Sneha (new joiner, last beat); the chatbot is only text on the laptops. Each line its own take
# (pipeline/skit05/voice.py). n = the script's line number.
#   python3 pipeline/skit05/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English, Telugu). shot: "wide", a person's close shot, "laptop" (the screen fills the frame) or
# "sneha" (the loop's desk). prop: what the line brings on screen (OfficeCrayon.tsx). [1] = a cue inside the line.
LINES = {
    1: ("lakshmi", "laptop", "hook", "Arjun, STOP! Don't press send!", "అర్జున్, ఆగు! సెండ్ నొక్కకు!"),
    2: ("arjun", "arjun", "neat", "It's just our client list! [1] I'm asking the AI to make it neat.",
        "మన క్లయింట్ లిస్టే కదా! [1] నీట్ గా చెయ్యమని ఏఐ ని అడుగుతున్నా."),
    3: ("lakshmi", "lakshmi", "numbers", "Two hundred phone numbers... [1] into a free chatbot?!", "రెండొందల ఫోన్ నంబర్లు... [1] ఫ్రీ చాట్‌బాట్ లోకా?!"),
    4: ("arjun", "arjun", "myth1", "Relax! Only me and the AI see it.", "రిలాక్స్ మేడమ్. నేను, ఏఐ తప్ప ఎవరూ చూడరు."),   # "Relax, ma'am" was heard "Relax mom"
    5: ("lakshmi", "lakshmi", "fact1", "Your chats can train the AI. [1] And some are read by real people.",
        "మన చాట్స్ ని ఏఐ ట్రైనింగ్ కి వాడుకోవచ్చు. [1] కొన్నిటిని నిజంగా మనుషులే చదువుతారు."),   # not "free": paid personal plans work the same
    6: ("arjun", "arjun", "myth2", "Okay, okay! I'll delete the chat after.", "సరే సరే! తర్వాత చాట్ డిలీట్ చేస్తా."),
    7: ("lakshmi", "lakshmi", "fact2", "If a person reviewed your chat, Google keeps it [1] up to three years. Even after you delete it.",
        "మనుషులు చదివిన చాట్ ని గూగుల్ [1] మూడేళ్ల వరకు ఉంచుతుంది. డిలీట్ చేసినా సరే."),
    8: ("arjun", "arjun", "shock", "Three years?! [1] So I can't use AI at all?", "మూడేళ్లా?! [1] అయితే ఏఐ వాడకూడదా?"),
    9: ("lakshmi", "laptop", "swap", "Use it! Paste three fake rows, ask for the formula. [1] Your real list stays with you.",
        "వాడొచ్చు! మూడు ఫేక్ లైన్లు పెట్టి ఫార్ములా అడుగు. [1] అసలు లిస్ట్ నీ దగ్గరే."),   # a fix that still gets the list done (script review)
    10: ("lakshmi", "wide", "rule", "Paste only what you'd pin on the notice board.", "నోటీస్ బోర్డ్ మీద పెట్టేదే పేస్ట్ చెయ్."),
    11: ("arjun", "sneha", "loop", "Sneha, STOP! Don't press send!", "స్నేహా, ఆగు! సెండ్ నొక్కకు!"),
}
TTS_EN = {}
TE_SPLIT = {}   # Telugu lines voiced as two takes, joined (long Telugu lines babble or lose a half in one take)
TE_SHOW = {}
# Sound (CLAUDE.md arc): a slam on frame 1 with the shout; the bed builds under the argument; a riser and a boing into
# each MYTH card, a ding on each FACT flip; the bed drops out before "three years" with a hit on it; pops as the names
# turn into Client A, B, C and a success sting on the neat table; a snap on the rule; a rise into the second slam.
SCENES = [("of_a", (1, 2, 3), {"pre": 0.35, "boost": 1.2, "tail": 0.1}),   # the slam lands before "Arjun"
          ("of_b", (4, 5, 6, 7, 8), {"lift": 0.5, "pre": 0.3, "boost": 1.0, "drop_at": [[3, "1"]], "tail": 0.1}),
          ("of_c", (9, 10, 11), {"pre": 0.3, "outro": True, "boost": 1.35, "rise": 1.6, "tail": 0.0})]
# seconds after line n (default 0.16 EN / 0.24 TE): the fact cards' read, the neat table's read
GAP = {1: 0.2, 5: 0.5, 7: 0.6, 9: 0.6, 10: 0.5}
PAUSES = {"en": {7: {"1": 0.45}}, "te": {7: {"1": 0.5}}}   # the beat before "three years" (the drop sits in it)
GAIN = {"lakshmi": 0.0, "arjun": 0.5, "sneha": 0.0}
GAIN_LINE = {7: 1.0, 11: 1.0}
TEMPO = {"en": 1.08, "te": 1.05}
YT = {"of_a": "The client list", "of_b": "Myth vs fact", "of_c": "Fake rows, real list"}


def spec(lang):
    te = lang == "te"
    sid = "skit05te" if te else "skit05v1"
    s = {"id": sid, "title": "The client list" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The client list", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.42, 0.82], "musicFade": 0.05, "endPad": 0.45, "captionMode": "phrase",
         "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": False, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang, "captionTop": 1500}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    scenes = []
    last = max(LINES)
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            show = TE_SHOW[n] if te and n in TE_SHOW else en.replace("[1] ", "")
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": show,
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if n == last else GAP.get(n, 0.24 if te else 0.16)}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if te and n in TE_SPLIT:
                ln.update({"tts": TE_SPLIT[n][0], "file2": f"{n:02d}b_{who}.wav", "tts2": TE_SPLIT[n][1], "pause": 0.3})
            if n in PAUSES[lang]:
                ln["pauses"] = PAUSES[lang][n]
            g = GAIN[who] + GAIN_LINE.get(n, 0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        scenes.append({"id": scid, "type": "sk_office", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
                       "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
