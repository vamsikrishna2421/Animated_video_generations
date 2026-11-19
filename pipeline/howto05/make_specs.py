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

LINES = {   # n: (prop, English, Telugu)
    1: ("hook", "Two thousand rupees asked, for a video made in four and a half minutes. [1] We made this flood video ourselves, with a free AI.",
        "రెండు వేల రూపాయలు అడుగుతోంది; ఈ వీడియో చేయడానికి పట్టింది నాలుగున్నర నిమిషాలు. [1] ఈ వరద వీడియో, మేమే ఒక ఫ్రీ టూల్ తో, కంప్యూటర్ లో చేశాం."),
    2: ("pause", "Check one: pause it. [1] We asked for a sign that says Ameerpet. In all forty-eight frames, it's not a word. [2] And here, one umbrella turns into two.",
        "ఒకటో చెక్: పాజ్ చేసి చూడండి. [1] అమీర్‌పేట్ అని బోర్డ్ అడిగాం. నలభై ఎనిమిది ఫ్రేముల్లోనూ, అది ఒక్క పదం కూడా కాదు. [2] ఇక్కడ, ఒక గొడుగు రెండు అవుతుంది."),
    3: ("label", "Check two: look for an AI label. [1] Our file carries no AI tag, so Instagram or YouTube label it only if their own systems catch it. [2] No label doesn't mean real.",
        "రెండో చెక్: కంప్యూటర్ చేసిందని లేబుల్ ఉందా చూడండి. [1] మా ఫైల్ లో అలాంటి ట్యాగ్ లేదు; ఇన్స్టాగ్రామ్, యూట్యూబ్ సొంతంగా పట్టుకుంటేనే లేబుల్ వస్తుంది. [2] లేబుల్ లేదంటే, నిజమని కాదు."),
    4: ("ask", "Check three: before you forward or pay, [1] send it to PIB Fact Check on WhatsApp: eight seven nine nine seven, one one two five nine.",
        "మూడో చెక్: ఫార్వర్డ్ చేసే ముందు, డబ్బులు పంపే ముందు, [1] పీఐబీ ఫ్యాక్ట్ చెక్ వాట్సాప్ కి పంపండి: ఎనిమిది ఏడు తొమ్మిది తొమ్మిది ఏడు, ఒకటి ఒకటి రెండు ఐదు తొమ్మిది."),
    5: ("loop", "Paid tools make cleaner fakes, with less to pause on. So do all three: [1] pause, label, ask.",
        "డబ్బులు కట్టే టూల్స్ ఇంకా శుభ్రమైన ఫేక్ లు చేస్తాయి. అందుకే మూడూ చేసుకోండి: [1] పాజ్, లేబుల్, అడగడం."),
}
TTS_EN = {}
SHOW = {}
SHOW_TE = {}
SPLIT_PAUSE = {}
SPLIT_PAUSE_TE = {}
T = {
    "scan": [["Content Credentials (C2PA)", "none"], ["AI tag (IPTC)", "none"], ["SynthID watermark", "none"]],
    "when": ["the maker says it's AI", "the file carries a tag like C2PA", "their own systems catch it"],
    "whenSrc": "YouTube Help, \"Disclosing use of altered or synthetic content\"; Meta's labelling post",
    "pib": "+91 87997 11259", "pibShort": "PIB Fact Check · WhatsApp +91 87997 11259",
}
SCENES = [("s_a", (1,), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (2,), {"boost": 1.1, "lift": 0.5, "tail": 0.3}),
          ("s_c", (3,), {"boost": 1.2, "lift": 0.5, "drop_at": [[0, 2, 0.6]], "tail": 0.3}),
          ("s_d", (4,), {"boost": 1.4, "lift": 0.6, "tail": 0.5}),
          ("s_e", (5,), {"outro": True, "pre": 0.3, "boost": 2.0, "lift": 0.7, "rise": 2.0, "tail": 0.0})]
GAP = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.0}
FLAGS_TE = {"s_e": {"boost": 1.8, "rise": 1.8}}
YT = {"s_a": "₹2,000 for a 4.5-minute fake", "s_b": "Check 1: pause it", "s_c": "Check 2: look for a label", "s_d": "Check 3: ask PIB Fact Check", "s_e": "Pause, label, ask"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "howto05te" if te else "howto05v1"
    s = {"id": sid, "title": "HOW TO 05: Fake-Video Check" + (" (Telugu audio)" if te else ""), "label": "HOW TO 05",
         "banner": "Fake-video check", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.14, 0.24], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.6, "captionMode": "phrase",
         "musicEQ": [[120, -4, 0.7], [240, -10, 0.8], [2400, -5, 1.0]], "musicPad": True, "musicGapGain": 0.0,
         "musicEndRamp": [0.9, 3.0], "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1440}
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
                  "gap": GAP.get(n, 0.3), "tempo": 1.08 if te else 1.08}
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
