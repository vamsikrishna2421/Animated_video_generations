# HOW TO 04 "What to never paste into an AI chat": writes reels/howto04v1.json (English) and reels/howto04te.json
# (Telugu). Lines from series/scripts/howto04_never_paste.md; [n] marks the words the picture waits for; " | " = two
# takes with a beat of silence. One narrator. Voices: pipeline/howto04/voice.py. Scene: NeverPasteCrayon.tsx. The
# quotes on screen (data.t) are copied from the companies' own pages, read Nov 12, 2026.
#   python3 pipeline/howto04/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu). v2 (script review): Gemini named in frame 1, "even if you delete them", no Microsoft
    # line, the Gemini path from Google's help page (web), ChatGPT's temporary chat, an honest line 8, the ending asks ON/OFF
    1: ("hook", "Three years, or seventy-two hours. [1] Ravi just pasted his customers' dues list into Gemini.",
        "మూడేళ్లు, లేదా డెబ్బై రెండు గంటలు. [1] రవి అన్న, కస్టమర్ల బాకీల లిస్ట్ ని, జెమిని లో పేస్ట్ చేశాడు."),
    2: ("review", "Google's own page: a person may read some chats, [1] and keeps those up to three years, even if you delete them. | [2] With the Keep Activity switch off: seventy-two hours.",
        "కొన్ని చాట్ లను మనుషులు చదవొచ్చు అని, గూగల్ పేజీయే చెప్తోంది. | [1] అలా చదివిన చాట్ లు, డిలీట్ చేసినా, మూడేళ్ల దాకా ఉంటాయి. [2] కీప్ యాక్టివిటీ ఆఫ్ చేస్తే: డెబ్బై రెండు గంటలు."),
    4: ("never", "Never paste passwords or OTPs, [1] Aadhaar, PAN or bank numbers, [2] or other people's details: phone numbers, dues, medical reports.",
        "పాస్‌వర్డ్‌లు, ఓటీపీలు, [1] ఆధార్, పాన్, బ్యాంక్ నంబర్లు, | [2] ఇతరుల వివరాలు: ఫోన్ నంబర్లు, బాకీలు, మెడికల్ రిపోర్టులు. ఇవి ఎప్పుడూ పేస్ట్ చేయకండి."),
    6: ("gemini", "Gemini, on the website: Settings and help, then Activity. [1] Click the word On, then Turn off. [2] Your history stops saving. Or use a temporary chat.",
        "జెమిని వెబ్‌సైట్ లో: సెట్టింగ్స్ అండ్ హెల్ప్, తర్వాత యాక్టివిటీ. | [1] ఆన్ అనే బటన్ నొక్కి, ఆఫ్ చేయండి. [2] హిస్టరీ సేవ్ అవ్వదు. లేదా టెంపరరీ చాట్ వాడండి."),   # render review: the path is the website's; "టర్న్ ఆఫ్ నొక్కండి" was heard as "tannuk"
    7: ("chatgpt", "In ChatGPT: Settings, Data controls, [1] turn off \"Improve the model for everyone\". It's on by default. [2] Temporary Chat works there too.",
        "చాట్ జీపీటీ లో: సెట్టింగ్స్, డేటా కంట్రోల్స్, | [1] ఇంప్రూవ్ ద మోడల్ ఫర్ ఎవ్రీవన్ ఆఫ్ చేయండి. మొదటి నుంచీ అది ఆన్ లోనే ఉంటుంది. [2] అక్కడ కూడా టెంపరరీ చాట్ ఉంది."),
    8: ("delete", "The switch covers new chats, and a chat already reviewed stays. [1] So the real fix: paste \"Customer 1\", never names or phone numbers.",
        "ఈ స్విచ్ ఇకపై చేసే చాట్ లకే. ఇప్పటికే చదివిన చాట్ పోదు. | [1] కాబట్టి అసలు ఫిక్స్: పేర్లు, ఫోన్ నంబర్లకి బదులు కస్టమర్ వన్ అని రాయండి."),   # "కొత్త చాట్" was heard as "kutta chat"
    9: ("loop", "Open your settings now: [1] ON, or OFF?", "ఇప్పుడే మీ సెట్టింగ్ చూడండి: [1] ఆన్ లో ఉందా, ఆఫ్ లో ఉందా?"),
}
TTS_EN = {7: "In Chat G P T: Settings, Data controls, turn off \"Improve the model for everyone\". It's on by default. Temporary Chat works there too."}
SHOW = {1: "3 years, or 72 hours. Ravi just pasted his customers' dues list into Gemini.",
        2: "Google's own page: a person may read some chats, and keeps those up to 3 years, even if you delete them. <pause 0.5> With the Keep Activity switch off: 72 hours."}
SHOW_TE = {
    1: "3 years, or 72 hours. Ravi anna pasted his customers' dues list into Gemini.",
    2: "Google's own page says people may read some chats. <pause 0.3> Chats read like that stay up to 3 years, even if you delete them. With Keep Activity off: 72 hours.",
    4: "Passwords, OTPs, Aadhaar, PAN, bank numbers, <pause 0.3> other people's details: phone numbers, dues, medical reports. Never paste these.",
    6: "On the Gemini website: Settings & help, then Activity. <pause 0.3> Click the On button, turn it off. History stops saving. Or use a temporary chat.",
    7: "In ChatGPT: Settings, Data controls, <pause 0.3> turn off \"Improve the model for everyone\". It is on from the start. Temporary Chat is there too.",
    8: "This switch is only for chats from now on; a chat already read stays. <pause 0.3> So the real fix: write \"Customer 1\" instead of names and phone numbers.",
    9: "Check your setting now: is it ON or OFF?",
}
SPLIT_PAUSE = {2: 0.5}
SPLIT_PAUSE_TE = {2: 0.3, 4: 0.3, 6: 0.3, 7: 0.3, 8: 0.3}
T = {   # on screen; the quotes copied from the pages (series/scripts/howto04_never_paste.md)
    "rows": [["Lakshmi", "98480 •••••", "₹4,200"], ["Suresh", "99120 •••••", "₹1,850"], ["Anwar", "90003 •••••", "₹650"], ["Padma", "97010 •••••", "₹3,100"]],
    "anon": [["Customer 1", "", "₹4,200"], ["Customer 2", "", "₹1,850"], ["Customer 3", "", "₹650"], ["Customer 4", "", "₹3,100"]],
    "gReview": "Human reviewers (including trained reviewers from our service providers) review some of the data",
    "gYears": "Reviewed chats are retained for up to three years.",
    "gNever": "Please don't enter confidential information that you wouldn't want a reviewer to see",
}
# Sound (CLAUDE.md arc): a boom on frame 1, a pop as the list lands; a buzz under the reviewer's eye and a ding on "72
# hours" after a beat of silence; whooshes into the title, the list and the quotes, a pop per item, a boom under
# Google's own words; clicks on the switches; a ding on delete; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 1.0, "drop_at": [[1, 2, 0.5]], "tail": 0.0}),   # render review: no title card, no repeated Google line
          ("s_b", (4,), {"boost": 1.0, "lift": 0.5, "tail": 0.0}),
          ("s_c", (6, 7, 8), {"boost": 1.45, "lift": 0.6, "tail": 0.0}),   # render: the quarters were flat; a dip under the list, a rise through the steps
          ("s_d", (9,), {"outro": True, "pre": 0.4, "boost": 2.0, "lift": 0.7, "rise": 2.0, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.5, 3: 0.4, 4: 0.5, 5: 0.5, 6: 0.4, 7: 0.5, 8: 0.4, 9: 0.0}
FLAGS_TE = {"s_d": {"boost": 1.8, "rise": 1.8}}
YT = {"s_a": "3 years vs 72 hours", "s_b": "Never paste these", "s_c": "The switch in each app", "s_d": "Your last chat"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto04te" if te else "howto04v1"
    s = {"id": sid, "title": "HOW TO 04: What to Never Paste into an AI Chat" + (" (Telugu audio)" if te else ""), "label": "HOW TO 04",
         "banner": "What to never paste into AI", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,   # render review: the Telugu gaps ran 1.2 dB over the voice
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
                  "gap": GAP.get(n, 0.3), "tempo": 1.05 if te else 1.04}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_neverpaste", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
