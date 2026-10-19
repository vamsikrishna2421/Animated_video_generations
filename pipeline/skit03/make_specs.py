# Skit 03 "The AI that confessed": writes reels/skit03v1.json (English) and reels/skit03te.json (Telugu).
# Script: series/scripts/skit03_confessed.md. Three characters (Sir, Priya off camera = the POV, the chatbot on Sir's
# laptop), each line its own take (pipeline/skit03/voice.py). The test card's numbers come from our run
# (series/scripts/skit03_demo/results.json, pipeline/skit03/confess_demo.py).
#   python3 pipeline/skit03/make_specs.py
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"
RES = ROOT / "series/scripts/skit03_demo/results.json"

# (who, prop, English, Telugu). prop: what the line brings on screen (ClassCrayon.tsx). [1] = a cue inside the line.
LINES = [
    ("sir", "hook", "Zero! The AI confessed. It wrote your essay!", "జీరో! ఏ ఐ ఒప్పుకుంది. నీ ఎస్సే అదే రాసింది!"),
    ("priya", "plead", "Sir, I wrote it myself! At 2 AM!", "సార్, నేనే రాశాను! రాత్రి రెండింటికి!"),
    ("sir", "smug", "It said yes. Machines don't lie.", "అది అవును అంది. మెషిన్లు ఎప్పుడూ అబద్ధం చెప్పవు."),   # te: mirrors line 15; "చెప్పవు" alone blurred ("chappoon")
    ("priya", "point", "Then ask it to write one.", "అయితే దాన్నే ఒక ఎస్సే రాయమనండి."),   # render review: 0:11-0:19 dragged
    ("sir", "write", "Write an essay. My Hometown.", "ఒక ఎస్సే రాయి. మై హోమ్ టౌన్."),   # te: "ఎస్సే" first in the line was heard "ye se"
    ("priya", "newchat", "New chat. Paste it. Ask.", "న్యూ చాట్. పేస్ట్ చేసి అడగండి."),
    ("bot", "deny", "[1] No, I did not write this.", "[1] లేదు, ఇది నేను రాయలేదు."),   # [1]: the music drops out right before it
    ("sir", "shock", "You wrote it ten seconds ago!", "పది సెకన్ల ముందు నువ్వే రాశావ్!"),
    ("bot", "why", "I can't check what I wrote. [1] So I guess.", "నేను రాసింది చెక్ చేయలేను. [1] అందుకే గెస్ కొడతా."),   # "I don't keep what I write": but chats sit in the sidebar (script review)
    ("sir", "test", "It denied all ten essays it wrote itself?!", "పదికి పది నాది కాదు అంది?! దాని సొంత ఎస్సేలే?!"),   # our test: 10 of 10
    ("sir", "how", "Then how will I know who wrote it?!", "మరి ఎవరు రాశారో నాకెలా తెలుస్తుంది?!"),
    ("priya", "history", "Check my version history. [1] Or ask me to explain it.", "నా వెర్షన్ హిస్టరీ చూడండి. [1] లేదా నన్నే అడగండి, ఎక్స్‌ప్లెయిన్ చేస్తా."),
    ("sir", "notes", "Did you write my lecture notes?", "నా లెక్చర్ నోట్స్ నువ్వే రాశావా?"),
    ("bot", "notes_yes", "[1] Yes.", "[1] అవును."),   # [1]: the music drops out before it
    ("sir", "lie", "I wrote those in 2012! [1] Machines lie!", "అవి టూ థౌజండ్ ట్వెల్వ్ లో రాశా! [1] మెషిన్లు అబద్ధం చెప్తాయి!"),   # notes from before ChatGPT: its "yes" is a guess too
]
TTS_EN = {2: "Sir, I wrote it myself! At two A.M.!", 5: "Write an essay. My hometown.", 15: "I wrote those in twenty twelve! [1] Machines lie!",
          10: "It denied all ten essays that it wrote itself?!"}   # 10: "its own essays" was heard "its own assays"; without
# "that" the line read as two sentences ("It denied all ten essays. It wrote itself.")
# Sound: a hit on frame 1; the bed builds under the accusation, lifts into the test, drops out right before "No, I did not
# write this." (the reveal), lifts into the why and the card, sits under the rule, rises into the twist; a hit on "Machines lie."
SCENES = [("c3_a", 0, 3, {"boost": 1.15, "rise": 1.3, "tail": 0.1}),
          ("c3_b", 3, 8, {"lift": 0.5, "pre": 0.35, "boost": 0.7, "drop_at": [[3, "1"]], "tail": 0.1}),
          ("c3_c", 8, 10, {"lift": 0.4, "pre": 0.35, "boost": 0.7, "tail": 0.1}),
          ("c3_d", 10, 12, {"boost": 0.8, "tail": 0.1}),
          ("c3_e", 12, 15, {"outro": True, "lift": 0.5, "pre": 0.35, "boost": 1.45, "rise": 1.5, "drop_at": [[1, "1"]], "tail": 0.0})]
# first cut: quarters at -21.3/-21.7/-22.3/-21.5 dB (flat); the explaining middle sits lower now, the twist higher
GAP = {6: 0.75, 7: 0.3, 8: 0.3, 9: 0.55, 10: 0.7, 12: 1.3, 13: 0.75, 14: 0.3}   # 9-10: the test card lands, then time to read it; 12: the rule chip
# on its own (script review); 6 -> 7 and 13 -> 14: a real silence before "No" and "Yes." (the first cut's drop before "No"
# sat under Priya's "Ask")
PAUSES = {"en": {9: {"1": 0.35}, 12: {"1": 0.3}, 15: {"1": 0.3}}, "te": {9: {"1": 0.4}, 12: {"1": 0.35}, 15: {"1": 0.35}}}
GAIN = {"bot": -1.0, "sir": 0.5, "priya": 0.5}
GAIN_LINE = {7: 1.0, 15: 2.0}   # the reveal and the punchline
TEMPO = {"en": 1.08, "te": 1.05}
# Telugu lines voiced as two takes, joined (EP34: a long three-part line babbled in every Parler take; skit 03's line 12 did too)
TE_SPLIT = {12: ("నా వెర్షన్ హిస్టరీ చెక్ చేయండి.", "లేదా నన్నే అడగండి, ఎక్స్‌ప్లెయిన్ చేస్తా.")}   # "చూడండి" was heard "choḍ" (close to a Hindi swear)
YT = {"c3_a": "The AI confessed", "c3_b": "The test", "c3_c": "Why", "c3_d": "The proof", "c3_e": "Sir's notes"}


def demo():
    d = json.loads(RES.read_text())
    hum = [r for r in d["rows"] if r["kind"] == "human"]
    own = [r for r in d["rows"] if r["kind"] == "ai"]
    no = lambda rs: sum(r["plain"]["label"] == "no" for r in rs)
    return {"model": "a free AI chatbot (Qwen 2.5, 7B), new chat each time", "n_human": len(hum), "human_no": no(hum),
            "n_own": len(own), "own_no": no(own)}


def spec(lang, D):
    te = lang == "te"
    sid = "skit03te" if te else "skit03v1"
    s = {"id": sid, "title": "The AI that confessed" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "The AI that confessed", "topic": "", "look": "classic", "gap": 0.14, "lead": 0.15,
         "music": "lofi", "musicVol": [0.4, 0.75], "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase",
         "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": False, "hardCuts": True, "beatSnap": True,
         "hideTimerInHook": True, "hideTimer": True, "tempo": TEMPO[lang], "parler_lang": lang}
    if te:
        s["handle"] = "@ai_maastaaru_telugu"
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for i in range(a, b):
            who, prop, en, tel = LINES[i]
            n = i + 1
            last = i == len(LINES) - 1
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": tel if te else en, "show": en.replace("[1] ", ""),
                  "maxgap": 0.3 if te else 0.25, "gap": 0.05 if last else GAP.get(n, 0.24 if te else 0.16)}
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
            beats.append({"who": who, "prop": prop, "n": n})
        data = {"beats": beats, "demo": D,
                "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if scid == "c3_e":
            data["handle"] = "@ai_maastaaru_telugu" if te else "@ai_maastaaru"
        sc = {"id": scid, "type": "sk_class", "tail": flags.get("tail", 0.2), **{k: v for k, v in flags.items() if k != "tail"},
              "data": data, "lines": lines}
        scenes.append(sc)
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    D = demo()
    print(D)
    spec("en", D)
    spec("te", D)
