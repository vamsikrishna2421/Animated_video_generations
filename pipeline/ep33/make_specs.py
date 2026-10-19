# EP33 "We don't sell headaches" (RAG part 3: hybrid search and measuring it): writes reels/ep33v1.json (English) and
# reels/ep33te.json (Telugu: the user recorded English only, so Telugu is voiced on Parler by pipeline/ep33/voice_te.py),
# and reels/ep33tts.json: English with AI voices, skit 01's cast (pipeline/ep33/voice_en.py), which the user asked for
# to compare with their recording.
# The first episode voiced by the user (recorded-voice trial): pipeline/tools/cut_takes.py cut the recording into lines,
# pipeline/ep33/voice_rec.py edited them into video/public/reel/ep33v1/src/NN_<who>.wav. Lines and their order come from
# the script (series/scripts/ep33_hybrid_search.md, v2.1); [n] marks the words the pictures wait for.
#   python3 pipeline/ep33/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks). shot: camera in the shop ("wide", "ravi", "ai", "book") or "screen"
# (the phone fills the frame: the search pictures). prop: what the line brings on (StockCrayon.tsx).
LINES = {
    1: ("ravi", "wide", "hook", 'AI! [1] You told him "out of stock"?! [2] The batteries are right there!'),
    2: ("ai", "screen", "pages", "E-1203 wasn't on [1] the three pages I read."),
    3: ("ravi", "ravi", "", "Which three pages?!"),
    4: ("ai", "screen", "meaning", "The three closest to the order. [1] I search by meaning."),
    5: ("ravi", "ravi", "codes", "A code has no meaning! [1] It has to match exactly!"),
    6: ("ai", "screen", "keyword", "Then use keyword search. [1] Exact words only."),
    7: ("ravi", "ravi", "thumb", "Good. Only that from now on."),
    8: ("ai", "ai", "order", 'Next order: [1] "something for a headache."'),
    9: ("ai", "ai", "zero", "No match. [1] We don't sell headaches."),
    10: ("ravi", "wide", "balm", "The pain balm is right there!"),
    11: ("ai", "screen", "words", 'He never said [1] "balm".'),
    12: ("ravi", "ravi", "which", "So which search do I use?!"),
    13: ("ai", "screen", "hybrid", "Both. [1] Merge the two lists. [2] Still three pages."),
    14: ("ravi", "ravi", "fold", "And how do I know it works?"),
    15: ("ai", "screen", "delivery", "Test me like a new delivery boy."),
    16: ("ai", "screen", "sheet", "Twenty orders you already know the answers to."),
    17: ("ai", "screen", "bars", "Meaning only: fifteen out of twenty. [1] Keyword only: thirteen."),
    18: ("ai", "screen", "both", "Both: [1] eighteen."),
    19: ("ravi", "ravi", "lost", "Eighteen. [1] So two customers went home empty-handed. [2] Which two?"),
    20: ("ai", "screen", "rows", '"Something to wash vessels." [1] And "Ramesh garu\'s usual."'),
    21: ("ravi", "wide", "street", "Everyone knows those!"),
    22: ("ai", "screen", "booksearch", "Everyone except your stock book."),
    23: ("ravi", "book", "write", "Written. [1] Test again."),
    24: ("ai", "screen", "stamp", "Twenty out of twenty."),
    25: ("ravi", "ravi", "smug", "Super! [1] Why two? [2] Switch one off."),
    26: ("ai", "wide", "switchoff", "Okay. [1] Keyword off. [2] Next order: E-1203."),
}
SHOW = {n: t.replace("[1] ", "").replace("[2] ", "") for n, (_, _, _, t) in LINES.items()}
# Sound (CLAUDE.md arc): the slam's hit in the first second, a lift into each search picture, the bed up under the
# joke, a drop right before "eighteen" with a hit on it, the bed up for the fix, a riser into the last "E-1203".
SCENES = [("st_a", 1, 3, {"rise": 1.25, "tail": 0.1}),
          ("st_b", 4, 7, {"lift": 0.6, "pre": 0.35, "boost": 0.55, "tail": 0.1}),   # bed lower: it masked "Then use keyword search"
          ("st_c", 8, 12, {"boost": 0.55, "tail": 0.1}),   # boost < 1 = a quieter bed: a dip under the joke
          ("st_d", 13, 16, {"lift": 0.35, "pre": 0.45, "boost": 0.8, "tail": 0.1}),   # the lift rang over "Merge"
          ("st_e", 17, 18, {"drop_at": [[1, 1]], "tail": 0.5}),   # the drop right before "eighteen" (drop_cue reads the scene's first line)
          ("st_f", 19, 24, {"boost": 1.25, "tail": 0.15}),
          ("st_g", 25, 26, {"outro": True, "boost": 1.35, "rise": 1.4, "tail": 0.0})]   # first cut: the last quarter was the quietest
# seconds after line n (default 0.18). Render review: no room for the payoffs -> a beat after "We don't sell
# headaches" (9), before "Both: eighteen" (17), either side of "Everyone except your stock book" (21, 22); 24: 20/20 holds
GAP = {1: 0.25, 8: 0.3, 9: 0.7, 17: 0.75, 21: 0.45, 22: 0.7, 24: 0.55}
# Telugu: the script's Telugu table with the same cue marks; "tts" = what Parler is given (codes and English words in
# Telugu letters, no one-word sentences: Parler drops them, skit 01's lesson)
TE = {
    1: ("ఏఐ, [1] స్టాక్ లేదని చెప్పావా?! [2] బ్యాటరీలు ఇక్కడే ఉన్నాయి!", None),   # "ఏ ఐ" was heard as "ye ye"
    2: ("E-1203 [1] నేను చదివిన మూడు పేజీల్లో లేదండి.", "ఈ ట్వెల్వ్ జీరో త్రీ, నేను చదివిన మూడు పేజీల్లో లేదండి."),
    3: ("ఏ మూడు పేజీలు?!", None),
    4: ("ఆర్డర్ కి దగ్గరగా ఉన్న మూడు. [1] నేను అర్థం బట్టి వెతుకుతాను.", None),
    5: ("కోడ్ కి అర్థం ఏముంది?! [1] అది ఎగ్జాక్ట్ గా మ్యాచ్ అవ్వాలి!", None),
    6: ("అయితే keyword search. [1] అదే word ఉంటేనే దొరుకుతుంది.", "అయితే కీవర్డ్ సెర్చ్. అదే వర్డ్ ఉంటేనే దొరుకుతుంది."),
    7: ("సూపర్, ఇకనుంచి అదే.", None),
    8: ("తర్వాతి ఆర్డర్: [1] తలనొప్పికి ఏదైనా.", None),
    9: ("నో మ్యాచ్ అండి. [1] మనం తలనొప్పులు అమ్మం.", None),   # never "దొరకలేదు": through the phone it was heard as a slur
    10: ("పెయిన్ బామ్ ఇక్కడే ఉంది కదా!", None),
    11: ("ఆయన [1] బామ్ అనలేదు కదండీ.", None),
    12: ("మరి ఏ సెర్చ్ వాడాలి?!", None),
    13: ("రెండూ వాడండి. [1] లిస్టులు కలిపేస్తా. [2] అయినా చదివేది మూడు పేజీలే.", None),   # "రెండూ, రెండు" sounded like a stutter
    14: ("పని చేస్తుందని నాకెలా తెలుస్తుంది?", None),
    15: ("నన్ను కొత్త డెలివరీ బాయ్ లాగా టెస్ట్ చేయండి.", None),
    16: ("జవాబు తెలిసిన ఇరవై ఆర్డర్లు.", None),   # 16 and 19 cut: 39-56 s dragged
    17: ("Meaning search మాత్రమే: ఇరవైకి పదిహేను. [1] Keyword మాత్రమే: పదమూడు.", "మీనింగ్ సెర్చ్ మాత్రమే, ఇరవైకి పదిహేను. కీవర్డ్ మాత్రమే, పదమూడు."),
    18: ("రెండూ కలిపి: [1] పద్దెనిమిది.", "రెండూ కలిపి, పద్దెనిమిది."),
    19: ("పద్దెనిమిది. [1] అంటే ఇద్దరు కస్టమర్లు ఉత్త చేతులతో వెళ్ళారు. [2] ఏ రెండు?!", None),
    20: ("గిన్నెలు కడగడానికి ఏదైనా. [1] ఇంకా రమేష్ గారు ఎప్పుడూ తీసుకునేది.", None),
    21: ("అవి అందరికీ తెలుసు!", None),
    22: ("మీ స్టాక్ బుక్ కి తప్ప.", None),
    23: ("రాశా, [1] మళ్ళీ టెస్ట్ చెయ్.", None),
    24: ("ఇరవైకి ఇరవై.", None),
    25: ("సూపర్, [1] రెండు ఎందుకు? [2] ఒకటి ఆపెయ్.", None),
    26: ("సరేనండి. [1] Keyword ఆఫ్. <pause 0.3> [2] తర్వాతి ఆర్డర్: E-1203.", "సరేనండి. కీవర్డ్ ఆఫ్."),
}
TE_PART2 = {26: "తర్వాతి ఆర్డర్, ఈ ట్వెల్వ్ జీరో త్రీ."}   # in one take Parler looped the line (7.6 s): two takes, joined
PAUSES_TE = {18: {"1": 0.45}}   # the beat before "eighteen" (the English take had it inserted in the edit)
SHOW_TE = {7: "Super. Only that from now on."}   # he says "సూపర్" here and again at 25 (the callback)
GAP_TE = {11: 0.45}   # render review: air after the "balm" punchline too
GAIN_TE = {9: 1.0, 22: 2.5}   # the joke's payoff, and "మీ స్టాక్ బుక్ కి తప్ప" (clean alone, masked in the mix)
# English with AI voices: spoken forms for the code, "Good" kept inside the phrase (Parler drops one-word sentences);
# 1: the quoted "?!" made Parler add a word; 10: "pain balm" came out "paint bomb" in six takes (even as "baam"), so
# this version says the stock book's "pain relief balm" (a "headache balm" would match a keyword search for "headache")
TTS_EN = {1: "AI! You told him out of stock? The batteries are right there!", 2: "E twelve zero three wasn't on the three pages I read.",
          7: "Good, only that from now on.", 10: "The pain relief balm is right there!",
          26: "Okay. Keyword off. Next order: E twelve zero three."}
SHOW_TTS = {10: "The pain relief balm is right there!"}
# render review of the AI-voiced cut: line 15 goes (39-51 s was four AI lines in a row in both versions); the joke's bed
# no longer dips (TTS pauses have no room sound, so the gaps felt empty), the joke lines louder; line 20's "wash
# vessels" was lost under the st_f bed; line 18's "Both" read "Boss"; the hook's first seconds sat below average
TTS_CUT = {15}
SCENE_TTS = {"st_c": {"boost": 0.85}}
GAIN_TTS = {1: 1.5, 9: 1.0, 18: 2.5, 20: 2.0}
PAUSES_TTS = {18: {"1": 0.45}}   # the beat before "eighteen" (the recording had it inserted in the edit)
# AI voices at 1.1x ran 82 s against the recording's 75 s (Parler's Ravi is slower than the user): 1.2x, tighter pauses,
# except lines whose key word blurred at 1.2x in the mix ("which search" -> "such", "Both" -> "Bose", "Test" -> "just",
# "Keyword off" -> "Keyword on"); at 1.0 they all read right
TEMPO_TTS = {10: 1.0, 12: 1.0, 13: 1.0, 18: 1.0, 23: 1.0, 26: 1.0}   # 10: "pain relief" -> "paint relief"
YT = {"st_a": "Out of stock?", "st_b": "Meaning vs keyword", "st_c": "We don't sell headaches", "st_d": "Both, still 3 pages",
      "st_e": "Our test: 15, 13, 18", "st_f": "Write it down", "st_g": "One is enough?"}


def spec(lang="en"):
    te, tts = lang == "te", lang == "tts"
    sid = {"en": "ep33v1", "te": "ep33te", "tts": "ep33tts"}[lang]
    s = {"id": sid, "title": "We don't sell headaches (EP33: hybrid search)" + {"te": " (Telugu audio)", "tts": " (AI voices)"}.get(lang, ""), "label": "EP33",
         "banner": "Why the AI said OUT OF STOCK",
         "topic": "", "look": "classic", "gap": 0.18, "lead": 0.15, "music": "lofi", "musicVol": [0.4, 0.75], "musicFade": 0.05,
         "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.05 if te else 1.2 if tts else 1.0, "captionTop": 1500}
    if te:
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te"})
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for n in range(a, b + 1):
            if tts and n in TTS_CUT:
                continue
            who, shot, prop, text = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": TE[n][0] if te else text, "show": SHOW_TE.get(n, SHOW[n]) if te else SHOW_TTS.get(n, SHOW[n]) if tts else SHOW[n], "maxgap": 0.3 if te else 0.28 if tts else 0.35,
                  "gap": 0.05 if n == 26 else (te and GAP_TE.get(n)) or GAP.get(n, 0.22 if te else 0.18)}
            if te and TE[n][1]:
                ln["tts"] = TE[n][1]
            if te and n in PAUSES_TE:
                ln["pauses"] = PAUSES_TE[n]
            if tts and n in TTS_EN:
                ln["tts"] = TTS_EN[n]
            if tts and n in PAUSES_TTS:
                ln["pauses"] = PAUSES_TTS[n]
            if tts and n in TEMPO_TTS:
                ln["tempo"] = TEMPO_TTS[n]
            if te and n in TE_PART2:
                ln.update({"file2": f"{n:02d}b_{who}.wav", "tts2": TE_PART2[n], "pause": 0.3})
            # loudness arc (the first cut's quarters were within 1 dB): the joke sits a little lower, the test lifts,
            # the fix and the twist build to the loudest stretch
            # Telugu: no dip for the AI in the joke (its lines 8, 9, 11 were the quietest in the mix)
            g = (-1.0 if who == "ai" else 1.5) + (-1.0 if 8 <= n <= 12 and not ((te or tts) and who == "ai") else 0.0) + (1.0 if 21 <= n <= 24 else 0.0) + (0.6 if n >= 19 else 0.0)   # Ravi's shouts sat level with the AI
            g += {18: 2.0, 25: 1.0, 26: 2.0}.get(n, 0.0) + (GAIN_TE.get(n, 0.0) if te else GAIN_TTS.get(n, 0.0) if tts else 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if tts:
            flags = {**flags, **SCENE_TTS.get(scid, {})}
        scenes.append({"id": scid, "type": "sk_stock", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
    spec("tts")
