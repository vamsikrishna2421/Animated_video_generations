# Creative 25 "Which Wish Did the AI Write?" (a one-question challenge): writes reels/creative25v1.json (English) and
# reels/creative25te.json (Telugu). Lines from series/scripts/creative25_which_wish.md; [n] marks the words the pictures
# wait for. One narrator. Voices: pipeline/creative25/voice.py. Scene: video/src/reel/loop/GuessCrayon.tsx. Texts and
# numbers: our test (series/scripts/creative25_demo/7B.json).
#   python3 pipeline/creative25/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (prop, English, Telugu). prop: GuessCrayon.tsx. " | " = two takes (a beat of silence before the second).
LINES = {
    1: ("hook", "Ammamma turns eighty. [1] Teja typed his wish for ten minutes. Sai tapped an AI once.",
        "అమ్మమ్మకి ఎనభై ఏళ్లు. [1] తేజ పది నిమిషాలు టైప్ చేశాడు. సాయి, చాట్ బాట్ ని ఒక్కసారి అడిగాడు."),
    2: ("quiz", "Which one did the AI write? [1] One, or two?", "ఏది చాట్ బాట్ రాసింది? [1] ఒకటా, రెండా?"),
    3: ("reveal", "Two. [1] It could go to any grandmother on earth.", "రెండు. [1] ఇది ప్రపంచంలో, ఏ అమ్మమ్మకైనా పంపొచ్చు."),
    4: ("tells", "One has her running behind his cycle, and her pulihora. [1] Only her family knows those.",
        "ఒకటిలో, సైకిల్ వెనకాల పరిగెత్తిన అమ్మమ్మ, ఆమె పులిహోర ఉన్నాయి. [1] అవి వాళ్ళ ఫ్యామిలీకి మాత్రమే తెలుసు."),
    5: ("test", "We asked a small free AI the same thing, ten times. [1] Ten out of ten: \"May this special day\". Not one thing only she'd know.",
        "మేము ఒక చిన్న ఫ్రీ చాట్ బాట్ ని, ఇదే పది సార్లు అడిగాం. [1] పదికి పది, ఒకే మాటతో మొదలయ్యాయి. ఆమెకి మాత్రమే తెలిసిన ఒక్క విషయం కూడా లేదు."),
    6: ("twist", "Then we gave it the two real details. [1] It used both, every time. But six times it added \"I miss you\"... and Sai lives next door.",
        "తర్వాత, ఆ రెండు నిజమైన విషయాలు ఇచ్చాం. [1] ప్రతిసారీ రెండూ వాడింది. కానీ ఆరు సార్లు, మిస్ అవుతున్నా అని రాసింది. సాయి పక్కింట్లోనే ఉంటాడు."),
    7: ("rule", "So let it write, the right way: two real details, [1] cut what isn't true, and sign it yourself.",
        "అందుకే: రెండు నిజమైన విషయాలు ఇవ్వండి, [1] నిజం కానిది తీసేయండి, మీ పేరుతో మీరే పంపండి."),
    8: ("loop", "Ammamma replied to only one of them. [1] Guess which.", "అమ్మమ్మ, ఒక్కరికే రిప్లై ఇచ్చింది. [1] ఎవరికో గెస్ చేయండి."),
}
SHOW = {1: "Ammamma turns 80. Teja typed his wish for 10 minutes. Sai tapped an AI once.",
        5: "We asked a small free AI the same thing, 10 times. 10 out of 10: \"May this special day\". Not one thing only she'd know.",
        6: "Then we gave it the 2 real details. It used both, every time. But 6 times it added \"I miss you\"... and Sai lives next door.",
        7: "So let it write, the right way: 2 real details, cut what isn't true, and sign it yourself."}
SHOW_TE = {
    1: "Ammamma turns 80. Teja typed for 10 minutes. Sai asked a chatbot once.", 2: "Which one did the chatbot write? 1, or 2?",
    3: "2. This could be sent to any grandmother in the world.", 4: "1 has Ammamma running behind the cycle, and her pulihora. Only their family knows those.",
    5: "We asked a small free chatbot the same thing, 10 times. 10 out of 10 began with the same words. Not one thing only she'd know.",
    6: "Then we gave it the 2 real details. It used both, every time. But 6 times it wrote \"I miss you\". Sai lives next door.",
    7: "So: give it 2 real details, cut what isn't true, send it in your own name.", 8: "Ammamma replied to only one. Guess who.",
}
TEXTS = {   # on screen, English on both pages (from series/scripts/creative25_demo/7B.json)
    "a": "Happy 80th, Ammamma! Still remember you running behind my cycle, holding the seat. Keep the pulihora ready, coming at 7! - Teja",
    "b": "Happy 80th birthday, Grandma! May this special day be filled with love, joy, and all the happiness you deserve. Here's to another wonderful chapter in your life! 🎉🎂💖",
    "d": "", "made": "Your pulihora is still the best in the family, and I miss you dearly.",
    "aDetails": ["running behind my cycle", "pulihora"], "bStock": ["May this special day", "filled with", "wonderful chapter"], "dStock": [],
}
NUMS = {"stock": "10/10", "specific": "0/10", "both": "10/10", "made": "6/10"}
SPLIT_PAUSE = {}
# Sound (CLAUDE.md arc): a boom and pops on frame 1; three pops on the countdown in the hold; a boom and clap on "Two", a
# buzz on the stock phrases; a ding on the real details; a boom on "ten out of ten"; a ding into the twist, a buzz on
# "I miss you"; a clap and boom into the rule; a riser and the slam back to frame 1.
SCENES = [("s_a", (1, 2, 3, 4), {"boost": 1.0, "drop_pre": [[2, 0.0, 2.4]], "tail": 0.0}),   # the bed out under the countdown
          ("s_b", (5, 6), {"boost": 1.3, "lift": 0.6, "tail": 0.0}),
          ("s_c", (7, 8), {"outro": True, "pre": 0.5, "boost": 1.6, "lift": 0.7, "rise": 1.6, "tail": 0.0})]
GAP = {1: 0.3, 2: 2.6, 3: 0.3, 4: 0.5, 5: 0.4, 6: 0.6, 7: 0.4, 8: 0.0}
GAP_TE = {}
TEMPO_TE = {}
FLAGS_TE = {"s_c": {"boost": 1.5, "rise": 1.5}}
YT = {"s_a": "Which wish is the AI's?", "s_b": "Our test", "s_c": "Let it write, the right way"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative25te" if te else "creative25v1"
    s = {"id": sid, "title": "Which Wish Did the AI Write?" + (" (Telugu audio)" if te else ""), "label": "", "banner": "", "topic": "",
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
        data = {"beats": beats, "captionTop": 1500, "texts": TEXTS, "nums": NUMS, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_guess", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
