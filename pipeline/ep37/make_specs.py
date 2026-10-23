# EP37 "The squeezed brain" (quantization: big models on small devices): writes reels/ep37v1.json (English) and
# reels/ep37te.json (Telugu). Lines come from the script (series/scripts/ep37_quantization.md); [n] marks the words the
# pictures wait for; " | " splits a line into two takes. Voices: pipeline/ep37/voice.py (as EP36's). Numbers: our test
# (series/scripts/ep37_demo) and Qwen's own files.
#   python3 pipeline/ep37/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: camera in the shop ("wide", "ravi") or "screen" (the phone
# fills the frame). prop: what the line brings on (SqueezeCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", "My wife says \"lunch is ready\", and you made it an ORDER?!", "మా ఆవిడ \"భోజనం రెడీ\" అంటే, అది కూడా ఆర్డర్ అనుకున్నావా?!"),   # render review: "went in as" read flat, like an announcement
    2: ("ai", "screen", "squeeze", "Your phone was full. [1] So I squeezed my brain from four bits to two.",
        "ఫోన్ నిండిపోయింది. | [1] అందుకే నా బ్రేన్ ని ఫోర్ బిట్ నుంచి టూ బిట్ కి కంప్రెస్ చేశాను."),   # 4 -> 2: it was 4-bit since EP35 (script review)
    3: ("ravi", "ravi", "what", "You squeezed it?!", "కంప్రెస్ చేశావా?!"),
    4: ("ai", "screen", "round", "It's called quantization: [1] rounding every number in my brain.",
        "దీని పేరు Quantization. | [1] నా బ్రేన్ లో ప్రతి నంబర్ ని రౌండ్ చేయడం."),   # "rounding" said out loud (script review)
    5: ("ravi", "ravi", "prices", "Rounding? Like my prices?", "రౌండ్ చేయడమా? నా రేట్ల లాగానా?"),
    6: ("ai", "board", "board4", "Full size: right down to the paisa. [1] Four-bit: the nearest ten rupees.",   # "exact to" lost its "to"
        "అసలు సైజ్ లో పైసా కూడా లెక్కే. | [1] ఫోర్ బిట్ లో బియ్యం అరవై రూపాయలు."),
    7: ("ravi", "ravi", "two", "And two-bit?", "మరి టూ బిట్?"),
    8: ("ai", "board", "board2", "Four prices per shelf. [1] Biscuits: free.", "ఒక్కో ర్యాక్ కి నాలుగే రేట్లు. [1] బిస్కెట్లు ఫ్రీ!"),   # per shelf: each block has its own scale
    9: ("ravi", "ravi", "quiz", "Full size got one wrong out of forty. [1] How many will four-bit get wrong?",   # "does" was heard "thus"
        "అసలు సైజ్ కి నలభైలో ఒక్కటే తప్పు. | [1] ఫోర్ బిట్ కి ఎన్ని తప్పులు?"),   # mistakes in both languages, as the cards
    10: ("ai", "screen", "test", "Just one. [1] A third of the size, twice as fast.", "ఒక్కటే తప్పు! | [1] మూడో వంతు సైజ్, డబుల్ స్పీడ్."),   # 3.4 s vs 7.5 s a reply (measured)
    11: ("ravi", "ravi", "which", "So which one do I download?", "మరి ఏ ఫైల్ తీసుకోవాలి?"),   # Telugu: "డౌన్‌లోడ్" garbled in four takes
    12: ("ai", "wide", "rule", "The one with Q4 in its name. [1] Going back to it now.", "పేరులో క్యూ ఫోర్ ఉన్నది. | [1] నేనూ మళ్ళీ దానికే వెళ్తున్నా."),
    13: ("ravi", "wide", "full", "Phone's full again! [1] Fifty-two good-morning photos!", "ఫోన్ మళ్ళీ నిండింది! | [1] యాభై రెండు గుడ్ మార్నింగ్ ఫోటోలు!"),
    14: ("ai", "screen", "choice", "Delete the photos, [1] or I squeeze to two-bit.", "ఫోటోలు డిలీట్ చేయండి, [1] లేకపోతే నేను టూ బిట్ కి వెళ్తా."),   # the AI says మీరు to Ravi anna
    15: ("ravi", "ravi", "fine", "Fine... squeeze.", "సరే... కంప్రెస్ చెయ్."),
    16: ("ai", "wide", "loop", "Lunch is ready: [1] ORDER.", "భోజనం రెడీ: [1] ఆర్డర్ అండి."),   # into frame 1 (loops)
}
TTS_EN = {   # English spoken forms: no capitals to spell out, "Q four"
    1: "My wife says \"lunch is ready\", and you made it an order?!",
    12: "The one with Q four in its name. [1] Going back to it now.",
    13: "Phone's full again! [1] Fifty-two good morning photos!",
    16: "Lunch is ready: [1] order.",
}
SHOW = {   # captions with digits
    2: "Your phone was full. So I squeezed my brain from 4 bits to 2.", 6: "Full size: right down to the paisa. 4-bit: the nearest ₹10.",
    8: "4 prices per shelf. Biscuits: free.", 9: "Full size got 1 wrong out of 40. How many will 4-bit get wrong?",
    10: "Just 1. A third of the size, twice as fast.", 13: "Phone's full again! 52 good-morning photos!", 14: "Delete the photos, or I squeeze to 2-bit.",
}
SHOW_TE = {   # English captions on the Telugu reel, close to the Telugu
    1: "My wife says \"lunch is ready\", and you thought that was an ORDER too?!", 2: "The phone filled up. So I compressed my brain from 4-bit to 2-bit.",
    3: "You compressed it?!", 4: "Its name is quantization: rounding every number in my brain.", 5: "Rounding? Like my prices?",
    6: "Original size: every paisa counts. 4-bit: rice becomes ₹60.", 7: "And 2-bit?", 8: "Only 4 prices per rack. Biscuits free!",
    9: "Original size: just 1 wrong out of 40. How many wrong for 4-bit?", 10: "Just 1 wrong! A third of the size, double speed.",
    11: "So which file do I take?", 13: "Phone's full again! 52 good-morning photos!", 14: "Delete the photos, or I go to 2-bit.",
    15: "Fine... compress it.", 16: "Lunch is ready: ORDER, sir.",
}
NOCAP = {12}   # the rule chip carries it
PAUSES = {16: {"1": 0.35}}   # a beat before the last "ORDER" for its hit (render review: the hit on the word read "ready to order")
TEMPO_EN = {"ravi": 1.15, "ai": 1.1}
TEMPO_TE = {"ravi": 1.15, "ai": 1.1}
TEMPO_LINE_TE = {1: 1.0}   # the hook's "అనుకున్నావా" smeared at 1.15x (clean in the raw take)
# Sound (CLAUDE.md arc; fewer sounds after the script review): a hit and two pings on frame 1; a squish as the vice closes;
# a lift into the rounding insert; a ding on the 4-bit prices, a bonk on "Biscuits: free"; the quiz's tick-tock 3-2-1 with
# a riser, the bed out on the 1, the big hit on "Just one"; a snap on the rule; the bed out under "Lunch is ready", a
# glitch and the biggest hit on "ORDER", into the loop. Only the last scene rises (ramps stay on after their window).
SCENES = [("s_a", (1, 2, 3), {"boost": 1.7, "tail": 0.1}),   # a louder bed under the hook
          ("s_b", (4, 5, 6, 7, 8), {"lift": 0.8, "pre": 0.35, "boost": 1.45, "tail": 0.1}),
          ("s_c", (9, 10, 11, 12), {"pre": 0.3, "boost": 1.45, "drop_pre": [[1, 0.05, 1.0]], "tail": 0.1}),   # the bed out on the quiz's "1"
          ("s_d", (13, 14, 15, 16), {"lift": 0.5, "pre": 0.45, "outro": True, "boost": 1.6, "rise": 1.4,   # render review: the quarters sat within 2 dB
                                     "drop_pre": [[3, -0.5, 1.0]], "drop_at": [[3, "1", 0.8]], "tail": 0.0})]   # silence under "Lunch is ready", the hit on "ORDER"
GAP = {1: 0.25, 8: 0.6, 9: 2.6, 10: 1.1, 12: 0.8, 15: 0.35}   # 9: render review, "the silent countdown runs long" (was 3.2)   # 9: the quiz holds for its 3-2-1; 10: the test card; 12: the rule chip
GAIN = {2: 0.6, 3: -0.5, 4: 0.4, 5: -1.5, 7: -4.5, 11: -4.0, 13: 1.0, 14: 1.9, 15: 1.9}
GAIN_TE = {2: 0.5, 3: 0.5, 4: 0.4, 5: -1.5, 7: -5.0, 11: -1.5, 13: 1.0, 14: 2.8, 15: 1.6}
FLAGS_TE = {"s_b": {"duck_lines": [[3, 1.6]]}}   # Telugu line 7 falls in a quiet bar of the bed: lift the bed under it   # Telugu takes measured on their own (8-12 dB over the bed)   # measured: Ravi's short shouts sat 13-18 dB over the bed, 14-15 under 8
YT = {"s_a": "Lunch is ready: ORDER", "s_b": "Quantization = rounding", "s_c": "Our test: 16 vs 4 vs 2 bits", "s_d": "Full again"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "ep37te" if te else "ep37v1"
    s = {"id": sid, "title": "The squeezed brain (EP37: Quantization)" + (" (Telugu audio)" if te else ""), "label": "EP37",
         "banner": "Quantization", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.46, 0.9], "musicFade": 0.05, "endPad": 0.6, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]],
         "musicPad": True, "musicGapGain": 3.0, "hardCuts": True, "beatSnap": True, "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else TTS_EN.get(n, en),
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": GAP.get(n, 0.16),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = 0.3
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = (-1.0 if who == "ai" else 0.5) + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_squeeze", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
