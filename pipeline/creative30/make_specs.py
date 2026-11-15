# Creative 30 "₹23,405 or ₹34,713? The AI's EMI": a calm explainer in the Hanuman pilot's shape (quiet narration, one
# picture per beat, a bell between beats, no characters), with a same-item money clash from frame 0. Writes
# reels/creative30v1.json (English) and reels/creative30te.json (Telugu). Lines from series/scripts/creative30_emi.md;
# [n] marks the words the picture waits for; " | " = two takes with a beat of silence. One narrator.
# Voices: pipeline/creative30/voice.py. Scene: Emi30Crayon.tsx. Numbers on screen (data.t) come from our test
# (series/scripts/creative30_demo/emi.json, read by hand: HAND in pipeline/creative30/emi_demo.py).
#   python3 pipeline/creative30/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {
    1: ("hook", "Twenty-three thousand a month, said a small AI. [1] The real EMI on this home loan: thirty-four thousand, seven hundred.",
        "నెలకి ఇరవై మూడు వేలు, అంది ఒక చిన్న చాట్‌బాట్. [1] ఈ హోమ్ లోన్ అసలు నెల వాయిదా: ముప్పై నాలుగు వేల ఏడు వందలు."),
    2: ("gap", "Eleven thousand short, every month. [1] Over twenty years, twenty-seven lakh rupees you never planned for.",
        "ప్రతి నెలా పదకొండు వేలు తక్కువ. [1] ఇరవై ఏళ్ళలో, మీరు లెక్కలో వేసుకోని ఇరవై ఏడు లక్షలు."),
    3: ("steps", "Asked to work it out step by step, it got closer: thirty-three thousand. [1] And it wrote, 'calculated using a calculator.' | [2] It had no calculator.",
        "స్టెప్ బై స్టెప్ అడిగితే, దగ్గరికి వచ్చింది: ముప్పై మూడు వేలు. [1] కాలిక్యులేటర్ తో లెక్కించాం, అని కూడా రాసింది. | [2] దాని దగ్గర కాలిక్యులేటరే లేదు."),
    4: ("why", "A chat AI writes the next likely words. [1] Numbers too: it writes them; it doesn't work them out.",
        "చాట్‌బాట్ తర్వాత రావాల్సిన మాటలు రాస్తుంది. [1] అంకెలు కూడా అంతే: రాస్తుంది, లెక్క వేయదు."),
    5: ("test", "Our test, ten loans: [1] asked plainly, none right. [2] Step by step, none. | [3] As a formula we then worked out: four.",
        "మా టెస్ట్, పది లోన్లు: [1] మామూలుగా అడిగితే, ఒక్కటీ సరిగ్గా లేదు. [2] స్టెప్ బై స్టెప్, ఒక్కటీ లేదు. | [3] ఫార్ములా రాయమని, మేమే లెక్కిస్తే: నాలుగు."),
    6: ("fix", "For money, use a calculator: [1] your bank's EMI calculator, or code you can check.",
        "డబ్బు లెక్కకి, కాలిక్యులేటరే వాడండి: [1] మీ బ్యాంక్ లోన్ కాలిక్యులేటర్, లేదా మీరు చెక్ చేయగలిగే కోడ్."),
    7: ("loop", "So the next time a chat says, twenty-three thousand a month...",
        "ఇంకోసారి ఏదైనా చాట్, నెలకి ఇరవై మూడు వేలు అంటే..."),
}
SHOW = {1: "₹23,000 a month, said a small AI. The real EMI on this home loan: ₹34,700.",
        2: "₹11,000 short, every month. Over 20 years, ₹27 lakh you never planned for.",
        3: "Asked to work it out step by step, it got closer: ₹33,000. And it wrote, 'calculated using a calculator.' <pause 0.6> It had no calculator.",
        5: "Our test, 10 loans: asked plainly, none right. Step by step, none. <pause 0.5> As a formula we then worked out: 4.",
        7: "So the next time a chat says ₹23,000 a month..."}
SHOW_TE = {
    1: "₹23,000 a month, said a small chatbot. This home loan's real monthly instalment: ₹34,700.",
    2: "₹11,000 short every month. Over 20 years, ₹27 lakh you never counted.",
    3: "Asked step by step, it came closer: ₹33,000. It even wrote 'calculated with a calculator'. <pause 0.6> It had no calculator.",
    4: "A chatbot writes the words that should come next. Numbers too: it writes them, it doesn't calculate.",
    5: "Our test, 10 loans: asked plainly, not one right. Step by step, not one. <pause 0.5> Asked for a formula, and we calculated it: 4.",
    6: "For money maths, use a calculator: your bank's loan calculator, or code you can check.",
    7: "The next time any chat says ₹23,000 a month...",
}
SPLIT_PAUSE = {3: 0.6, 5: 0.5}
SPLIT_PAUSE_TE = {3: 0.6, 5: 0.5}
TTS_EN = {}
T = {   # on screen: our test (series/scripts/creative30_demo/emi.json); the loans are ours (made up)
    "loan": "HOME LOAN · ₹40,00,000 · 8.5% · 20 YEARS",
    "ai": "₹23,405", "real": "₹34,713", "short": "₹11,308", "months": 240, "lost": "₹27,13,920",
    "steps": ["r = 8.5 / 1200 = 0.00708333", "n = 20 × 12 = 240", "(1.00708333)^240 ≈ 6.9544",
              "(This value is calculated using a calculator or financial software)", "EMI = 4000000 × 0.04928 / 5.9544",
              "EMI ≈ ₹33,092"],
    "realPow": "real: 5.4412", "stepsEmi": "₹33,092",
    "ask": [1285, 8192, 35709, 23405, 7146, 5385, 18537, 8195, 13475, 3854],
    "true": [3929, 7974, 13572, 34713, 13385, 5387, 24986, 10747, 12792, 4279],
    "codeRight": [True, False, True, False, False, True, False, False, True, False],
    "formula": "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)",
    "apps": "some chat apps can run real code for maths: ask it to, then check the code",   # OpenAI's and Google's pages (caption)
}
# Sound (CLAUDE.md arc, calm): a deep bell on frame 1 (and the loop), a soft bell on every cut, the bed low under the
# voice and up in the gaps; a drop before "It had no calculator"; a lift into the test; a rise into the loop line.
SCENES = [("s_a", (1, 2), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (3, 4), {"boost": 0.8, "drop_at": [[0, 2, 0.4]], "tail": 0.0}),
          ("s_c", (5, 6), {"boost": 1.3, "lift": 0.7, "tail": 0.0}),
          ("s_d", (7,), {"outro": True, "pre": 0.3, "boost": 1.7, "lift": 0.8, "rise": 2.0, "tail": 0.0})]
GAP = {1: 0.45, 2: 0.45, 3: 0.45, 4: 0.45, 5: 0.4, 6: 0.45, 7: 0.0}
FLAGS_TE = {}
YT = {"s_a": "₹23,405 vs ₹34,713", "s_b": "It had no calculator", "s_c": "Our test, and the fix", "s_d": "A calculator, not a chat"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative30te" if te else "creative30v1"
    s = {"id": sid, "title": "₹23,405 or ₹34,713? The AI's EMI (Creative 30)" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.12, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.9, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
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
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw, "maxgap": 0.3, "gap": GAP.get(n, 0.3),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()),
                  "tempo": 1.08 if te else 1.0}
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
            if scid in FLAGS_TE:
                flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_emi30", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
