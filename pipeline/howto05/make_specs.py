# HOW TO 05 "Fake-video check": writes reels/howto05v1.json (English) and reels/howto05te.json (Telugu). Lines from
# series/scripts/howto05_fake_video_check.md; [n] marks the words the picture waits for; " | " = two takes with a beat
# of silence. One narrator. Voices: pipeline/howto05/voice.py. Scene: FakeCheckCrayon.tsx. The clip on screen is our
# own fake (pipeline/howto05/fake_demo.py); the label rules are YouTube's and Meta's own pages, the number PIB's.
#   python3 pipeline/howto05/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # n: (prop, English, Telugu). v2 (script review): the umbrella first, "every frame" (only shot 1 asked for the
    # sign), check two fits a WhatsApp forward (Meta's labels name Facebook, Instagram and Threads), PIB as "the
    # government's", the number on screen not read out, paid tools as the reason check three matters, "if you do one thing"
    1: ("hook", "Two thousand rupees per family, for a flood video made in four and a half minutes. [1] We made this fake ourselves.",
        "రెండు వేలు అడిగే వరద వీడియో; చేసింది నాలుగున్నర నిమిషాల్లో. [1] ఈ ఫేక్ ని, మేమే చేశాం."),
    2: ("pause", "Check one: pause it. [1] One umbrella turns into two. [2] And the sign we asked to say Ameerpet? In every frame, not a word.",
        "ఒకటో చెక్: వీడియో ఆపి చూడండి. [1] ఒక గొడుగు, రెండు అవుతుంది. [2] అమీర్‌పేట్ అని రాసిన బోర్డ్ అడిగాం; ప్రతి ఫ్రేమ్ లోనూ, అది అసలు పదమే కాదు."),
    3: ("label", "Check two: look for an AI label. [1] If it says AI, it's AI. But our fake carried no AI tag at all. | [2] So no label? Still maybe fake.",
        "రెండో చెక్: కంప్యూటర్ వీడియో అని లేబుల్ ఉందా చూడండి. [1] ఉంటే, అది కంప్యూటర్ వీడియోనే. కానీ మా ఫేక్ లో, అలాంటి ట్యాగ్ అసలు లేదు. | [2] లేబుల్ లేకపోయినా, ఫేక్ అవ్వొచ్చు."),   # render review: a step, not a rule about apps; WhatsApp Channels now test AI labels, so no WhatsApp claim
    4: ("ask", "Paid AI leaves fewer clues, so check three matters most. [1] Before you forward or pay, send the video to the government's PIB Fact Check, on WhatsApp. [2] Screenshot the number.",
        "డబ్బులు పెట్టి వాడే టూల్స్, ఇంకా నిజంలా కనిపించే ఫేక్‌లు చేస్తాయి. అందుకే మూడో చెక్ ముఖ్యం. | [1] ఫార్వర్డ్ చేసే ముందు, డబ్బులు పంపే ముందు, ఆ వీడియోని, కేంద్ర ప్రభుత్వ పీఐబీ ఫ్యాక్ట్ చెక్ కి, వాట్సాప్ లో పంపండి. [2] నంబర్ స్క్రీన్‌షాట్ తీసుకోండి."),
    5: ("loop", "And never pay a UPI ID that came in a forward. [1] Pause, label, ask PIB.",
        "ఇంకా, ఫార్వర్డ్ లో వచ్చిన యూపీఐ ఐడీ కి, ఎప్పుడూ డబ్బులు పంపకండి. [1] ఆపి చూడటం, లేబుల్, పీఐబీ."),   # render review: two "one things" clashed
}
TTS_EN = {2: "Check one: pause it. One umbrella turns into two. And the sign we asked to say Aameer-pet? In every frame, not a word."}   # render review: "a mearpet"
SHOW = {}
SHOW_TE = {}
SPLIT_PAUSE = {3: 0.6}
SPLIT_PAUSE_TE = {3: 0.6, 4: 0.3}   # line 4 in two takes: the long line slurred "పంపండి"
T = {
    "pib": "+91 87997 11259", "pibShort": "PIB Fact Check · WhatsApp +91 87997 11259",
}
SCENES = [("s_a", (1,), {"boost": 1.5, "tail": 0.0}),   # render review: the hook was no louder than the body
          ("s_b", (2,), {"boost": 0.9, "lift": 0.5, "tail": 0.3}),   # render v1: quarters 2-4 flat; a dip here
          ("s_c", (3,), {"boost": 1.2, "lift": 0.5, "drop_at": [[0, 2, 0.6]], "tail": 0.3}),   # a drop before "So no label?"
          ("s_d", (4,), {"boost": 1.8, "lift": 0.7, "pre": 0.35, "swell": [0, 1, 1.4], "tail": 0.8}),   # pre: the whoosh masked "Paid"   # review: lift under the number card, hold it 3 s+
          ("s_e", (5,), {"outro": True, "pre": 0.3, "boost": 2.6, "lift": 0.7, "rise": 2.8, "tail": 0.0})]   # render v1: the end did not rise
GAP = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.0}
FLAGS_TE = {"s_e": {"boost": 2.4, "rise": 2.6}}
YT = {"s_a": "₹2,000 for a 4.5-minute fake", "s_b": "Check 1: pause it", "s_c": "Check 2: look for a label", "s_d": "Check 3: ask PIB Fact Check", "s_e": "Pause, label, ask"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto05te" if te else "howto05v1"
    s = {"id": sid, "title": "HOW TO 05: Fake-Video Check" + (" (Telugu audio)" if te else ""), "label": "HOW TO 05",
         "banner": "Fake-video check", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.14, 0.2], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 1.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1440}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "lead": 0.5, "musicVol": [0.16, 0.22]})   # render review (TE): bare between lines
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            prop, en, tel = LINES[n]
            raw = tel if te else en
            ln = {"who": "storyteller", "file": f"{n:02d}_storyteller.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.3,
                  "gap": GAP.get(n, 0.3), "tempo": 1.08 if te else (1.12 if n == 2 else 1.08)}   # render review: "Check one." "Pause it." were slow
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if " | " in raw:
                p1, p2 = raw.split(" | ")
                pz = (SPLIT_PAUSE_TE if te else SPLIT_PAUSE).get(n, 0.4)
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_storyteller.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            lines.append(ln)
            beats.append({"prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1440, "t": T, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_fakecheck", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
