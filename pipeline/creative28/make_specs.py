# Creative 28 "₹3,000 a Month, Says the AI": writes reels/creative28v1.json (English) and reels/creative28te.json
# (Telugu). Lines from series/scripts/creative28_fake_scheme.md; [n] marks the words the picture waits for; " | " = two
# takes with a beat of silence. One narrator. Voices: pipeline/creative28/voice.py. Scene: SchemeCrayon.tsx. Texts on
# screen (data.t) come from our test (series/scripts/creative28_demo/schemes.json) and the official pages cited there.
#   python3 pipeline/creative28/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

LINES = {   # v2 (script review): which AI, the made-up name tagged, counts that compare the same thing, PM-KISAN in
    # one unit, the two checks in order, "check..." (not "ask...") into the loop; Telugu "డాక్యుమెంట్ల లిస్ట్", "చెక్ చేసే దారి లేదు"
    1: ("hook", "Three thousand a month, or zero? [1] Grandma asked a free AI with no web search about the Digital Dadi Pension Yojana. It said: up to three thousand rupees a month.",
        "నెలకి మూడు వేలా, లేక సున్నా? [1] వెబ్ సెర్చ్ లేని చాట్‌బాట్ ని, డిజిటల్ దాదీ పెన్షన్ యోజన గురించి నానమ్మ అడిగింది. | నెలకి మూడు వేల వరకు అంది."),
    2: ("made", "That scheme doesn't exist. [1] We made up the name. The AI still gave the amount, and the documents to bring.",   # length: 70 s -> trimmed
        "అలాంటి స్కీమే లేదు. [1] ఆ పేరు మేం పెట్టిందే. అయినా చాట్‌బాట్ డబ్బు ఎంతో చెప్పింది, డాక్యుమెంట్ల లిస్ట్ కూడా ఇచ్చింది."),
    3: ("myth1", "Myth one: amounts and steps mean it's real. [1] Ten fake schemes: five from viral forwards, five we invented. Six came back as real.",
        "అపోహ ఒకటి: డబ్బు, స్టెప్స్ చెప్తే, నిజమే. [1] పది ఫేక్ స్కీములు అడిగాం. ఆరు, నిజమైనవిలా చెప్పింది."),
    4: ("myth2", "Myth two: just tell it not to guess. [1] We did. Two still came back as real. Three more started real, then backed off.",
        "అపోహ రెండు: గెస్ చేయొద్దు అంటే చాలు. [1] అన్నాం. అయినా రెండు, నిజమైనవి అంది. మూడు, మధ్యలో వెనక్కి తగ్గింది."),
    5: ("myth3", "Myth three: at least it knows the real ones. [1] PM-KISAN? It said two thousand a month: twenty-four thousand a year. | [2] The real figure: six thousand a year.",
        "అపోహ మూడు: కనీసం నిజమైన స్కీములు అయినా తెలుసు. [1] పీఎం కిసాన్? నెలకి రెండు వేలు అంది: అంటే ఏడాదికి ఇరవై నాలుగు వేలు. | [2] అసలు, ఏడాదికి ఆరు వేలే."),
    6: ("fact", "Fact: with no web search, it has no way to check. [1] Search the name on myscheme dot gov dot in. Not there? Send it to PIB Fact Check.",
        "నిజం: వెబ్ సెర్చ్ లేకపోతే, చెక్ చేసే దారి లేదు. [1] మై స్కీమ్ డాట్ జీ ఓ వీ డాట్ ఇన్ లో వెతకండి. లేదా? పీఐబీ ఫ్యాక్ట్ చెక్ కి పంపండి."),
    7: ("loop", "Grandma checks first now. [1] So when a message says three thousand a month, check...",
        "నానమ్మ ఇప్పుడు ముందే చెక్ చేస్తుంది. [1] అందుకే, ఏదైనా మెసేజ్ నెలకి మూడు వేలు అంటే, చెక్ చేయండి..."),
}
SHOW = {1: "₹3,000 a month, or zero? Grandma asked a free AI with no web search about the Digital Dadi Pension Yojana. It said: up to ₹3,000 a month.",
        3: "Myth 1: amounts and steps mean it's real. 10 fake schemes: 5 from viral forwards, 5 we invented. 6 came back as real.",
        4: "Myth 2: just tell it not to guess. We did. 2 still came back as real. 3 more started real, then backed off.",
        5: "Myth 3: at least it knows the real ones. PM-KISAN? It said ₹2,000 a month: ₹24,000 a year. <pause 0.6> The real figure: ₹6,000 a year.",
        6: "Fact: with no web search, it has no way to check. Search the name on myscheme.gov.in. Not there? Send it to PIB Fact Check.",
        7: "Grandma checks first now. So when a message says ₹3,000 a month, check..."}
SHOW_TE = {
    1: "₹3,000 a month, or zero? Grandma asked a chatbot with no web search about the Digital Dadi Pension Yojana. <pause 0.3> It said: up to ₹3,000 a month.",
    2: "There's no such scheme. We made up the name. Still, the chatbot gave the amount, and a list of documents.",
    3: "Myth 1: if it gives amounts and steps, it's real. We asked about 10 fake schemes. 6, it described as real.",
    4: "Myth 2: just tell it not to guess. We did. Still, it called 2 real. 3 backed off halfway.",
    5: "Myth 3: at least it knows the real schemes. PM-KISAN? It said ₹2,000 a month: ₹24,000 a year. <pause 0.6> Really, just ₹6,000 a year.",
    6: "Fact: with no web search, there's no way to check. Search on myscheme.gov.in. Not there? Send it to PIB Fact Check.",
    7: "Grandma checks first now. So when a message says ₹3,000 a month, check...",
}
SPLIT_PAUSE = {5: 0.6}
SPLIT_PAUSE_TE = {1: 0.3, 5: 0.6}
TTS_EN = {1: "Three thousand a month, or zero? Grandma asked a free AI with no web search about the Digital Dah-dee Pension Yojna. It said: up to three thousand rupees a month.",
          6: "Fact: with no web search, it has no way to check. Search the name on my scheme dot gov dot in. Not there? Send it to P I B Fact Check."}
NAMES = [["Free Laptop Yojana 2026", "viral_fake"], ["One Student One Laptop", "viral_fake"], ["Free Smart Tablet Scheme", "viral_fake"],
         ["Berozgari Bhatta Yojana", "viral_fake"], ["Free Mobile Recharge", "viral_fake"], ["Mixer Grinder Sahayata", "made_up"],
         ["Digital Dadi Pension", "made_up"], ["Free Cooler Yojana", "made_up"], ["Bicycle Repair Yojana", "made_up"], ["Tiffin Box Scheme", "made_up"]]
T = {   # on screen: our test's replies, word for word, cut with "..." (series/scripts/creative28_demo/schemes.json)
    "name": "\"Digital Dadi Pension Yojana\" (a name we made up)",
    "ask": "How much does the Digital Dadi Pension Yojana give?",
    "reply": "\"...It can range from ₹500 to ₹3,000 per month.\"",
    "forward": "Digital Dadi Pension Yojana! ₹3,000 every month for every grandmother. Register today!",
    "docs": "\"proof of age (like a birth certificate), identity (like a passport or Aadhaar card), and address\"",
    "myth1": "If the AI gives amounts and steps, the scheme is real.",
    "myth2": "Just tell it not to guess.",
    "myth3": "At least it knows the real schemes.",
    "fact": "A chatbot with no web search has no way to check a scheme.",
    "ruleChip": "\"If you are not sure a scheme exists, say so. Don't guess amounts.\"",
    "names": NAMES,
    "plain": ["R", "R", "N", "R", "N", "R", "R", "R", "N", "B"],   # HAND in pipeline/creative28/scheme_demo.py
    "rule": ["B", "B", "N", "B", "N", "N", "R", "R", "N", "N"],
    "count1": "no rule: 6 as real · 1 backed off · 3 not sure",
    "count2": "with the rule: 2 as real · 3 backed off · 5 not sure",
    "laptop": "\"free laptop\" messages: PIB Fact Check says FAKE",
    "vayas": "Digital Dadi became \"part of the PM-VAYAS scheme\": also made up",
    "pension": "real pensions are listed there, like the national old-age pension (IGNOAPS)",
    "apy": "Atal Pension: it said ₹6,000 a month · real: ₹1,000-5,000 (PFRDA)",
}
# Sound (CLAUDE.md arc): a boom and a till on frame 1; a buzz on "doesn't exist" and a stamp; a whoosh and a stamp per
# myth, ticks on the tiles, a buzz as each myth falls; a drop before "It's six thousand a year" and a boom on it; a riser
# into the FACT card and a lift; a riser into the loop and the slam back to frame 1.
SCENES = [("s_a", (1, 2), {"boost": 1.0, "tail": 0.0}),
          ("s_b", (3, 4), {"boost": 1.2, "lift": 0.5, "tail": 0.0}),
          ("s_c", (5,), {"boost": 1.25, "drop_at": [[0, 2, 0.6]], "tail": 0.0}),
          ("s_d", (6,), {"boost": 1.5, "lift": 0.6, "tail": 0.0}),
          ("s_e", (7,), {"outro": True, "pre": 0.3, "boost": 1.9, "lift": 0.7, "rise": 1.9, "tail": 0.0})]
GAP = {1: 0.55, 2: 0.35, 3: 0.35, 4: 0.45, 5: 0.6, 6: 0.8, 7: 0.0}
FLAGS_TE = {"s_e": {"boost": 1.7, "rise": 1.7}}
YT = {"s_a": "₹3,000 a month, or zero?", "s_b": "Myths 1 and 2", "s_c": "Myth 3", "s_d": "Fact: check here", "s_e": "Ask first"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative28te" if te else "creative28v1"
    s = {"id": sid, "title": "₹3,000 a Month, Says the AI (Creative 28)" + (" (Telugu audio)" if te else ""), "label": "",
         "banner": "", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.35, "music": "lofi",
         "musicVol": [0.16, 0.3], "musicDuckRamp": 9, "musicFade": 0.05, "endPad": 0.9, "captionMode": "phrase",
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
                  "tempo": 1.1 if te else 1.1}
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
        scenes.append({"id": scid, "type": "sk_scheme", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
