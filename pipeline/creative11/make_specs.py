# Creative 11 "The AI confirmed Goa" (an AI summary of a family group chat invents a decision): writes reels/creative11v1.json
# (English) and reels/creative11te.json (Telugu). Lines come from the script (series/scripts/creative11_group_summary.md);
# [n] marks the words the pictures wait for; " | " splits a line into two takes. Voices: pipeline/creative11/voice.py.
# Numbers: our test (series/scripts/creative11_demo).
#   python3 pipeline/creative11/make_specs.py
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
R = ROOT / "reels"

# n: (who, shot, prop, English with cue marks, Telugu). shot: the call ("hook": frame 1, "grid", "spk": the speaker big) or
# an insert ("chat": the group chat, "ask": his question and the summary, "test": our test card, "rule": the copy card,
# "type": he posts the decision, "reply": the summary quoting him). prop: what the line brings on (FamilyCrayon.tsx).
LINES = {
    1: ("prasad", "hook", "hook", "The AI says Goa is confirmed! [1] I've booked twelve tickets!",
        "గోవా కన్ఫర్మ్ అని సమ్మరీ చెప్పింది! [1] పన్నెండు టికెట్లు బుక్ చేశా!"),
    2: ("lakshmi", "spk", "ooty", "Confirmed?! [1] I said Ooty!", "కన్ఫర్మా?! [1] నేను ఊటీ అన్నాను!"),
    3: ("harika", "chat", "poll", "Nobody confirmed anything, mavayya. | [1] We said poll tomorrow.",
        "ఎవరూ ఏమీ కన్ఫర్మ్ చేయలేదు మావయ్య. | [1] రేపు పోల్ అన్నాం."),
    4: ("prasad", "spk", "read", "The AI read the whole chat!", "సమ్మరీ మొత్తం చాట్ చదివింది!"),
    5: ("harika", "ask", "ask", "You asked what we decided. | [1] So it picked one: Goa.",
        "మనం ఏం ఫిక్స్ చేశాం అని అడిగారు. | [1] అందుకే ఒకటి ఫిక్స్ చేసింది: గోవా."),   # script review: "నిర్ణయించాం" sounded like a newsreader
    6: ("harika", "test", "test", "I tested our chat ten times. | [1] Four summaries made up a decision.",
        "మన చాట్ ని పది సార్లు టెస్ట్ చేశా. | [1] నాలుగు సార్లు లేని నిర్ణయం రాసింది."),
    7: ("lakshmi", "spk", "how", "So how do we check?!", "మరి ఎలా చెక్ చేయాలి?!"),
    8: ("harika", "rule", "rule", "Make it quote the message for each decision. | [1] If there's none: not decided.",
        "ప్రతి నిర్ణయానికీ మెసేజ్ కోట్ చేయమని చెప్పండి. | [1] లేకపోతే ఏదీ ఫిక్స్ కాలేదు అనమనండి."),   # render review: "చేయమనండి" squashed "quote" ("cheye-maindi"); four takes of "అనమని చెప్పండి" were worse than the first take
    9: ("harika", "test", "pass", "Ten out of ten: not decided.", "పదికి పది: ఏదీ ఫిక్స్ కాలేదు."),
    10: ("prasad", "type", "quiz", "Fine. [1] I'll decide!", "సరే. [1] నేనే ఫిక్స్ చేస్తా!"),   # the quiz holds after it
    11: ("harika", "reply", "reveal", "Decided: Goa. | [1] Quote: mavayya.", "ఫిక్స్: గోవా. | [1] కోట్: మావయ్య మెసేజ్."),
    12: ("lakshmi", "grid", "yell", "Mavayya!", "అయ్యో, మావయ్యా!"),   # Parler drops a one-word take: a call in front
    13: ("harika", "spk", "who", "A quote shows who said it. | [1] Not that everyone agreed.",
         "కోట్ చెప్పేది ఎవరు అన్నారో మాత్రమే. | [1] అందరూ ఓకే అన్నారని కాదు."),
    14: ("prasad", "spk", "loop", "See? [1] The AI says Goa!", "చూశారా? [1] గోవా కన్ఫర్మ్!"),   # then frame 1 (loops)
}
TTS_EN = {}
SHOW = {1: "The AI says Goa is confirmed! I've booked 12 tickets!", 6: "I tested our chat 10 times... 4 summaries made up a decision.",
        9: "10 out of 10: not decided."}
SHOW_TE = {
    1: "The summary said Goa is confirmed! I've booked 12 tickets!", 2: "Confirmed?! I said Ooty!",
    3: "Nobody confirmed anything, mavayya. We said poll tomorrow.", 4: "The summary read the whole chat!",
    5: "You asked what we fixed. So it fixed one: Goa.", 6: "I tested our chat 10 times... 4 times it wrote a decision that didn't exist.",
    7: "So how do we check?!", 8: "Tell it to quote the message for each decision. Otherwise: nothing was fixed.",
    9: "10 out of 10: nothing was fixed.", 10: "Fine. I'll fix it myself!", 11: "Fixed: Goa. Quote: mavayya's message.",
    12: "Ayyo, mavayya!", 13: "A quote shows who said it. Not that everyone said OK.",   # render review 2: "it." was left alone on a line 14: "See? Goa confirmed!",
}
NOCAP = {8}   # the copy card carries its words
PAUSES = {}
TEMPO_EN = {"prasad": 1.1, "lakshmi": 1.12, "harika": 1.08}
TEMPO_TE = {"prasad": 1.1, "lakshmi": 1.1, "harika": 1.08}
TEMPO_LINE_TE = {}
# Sound (CLAUDE.md arc): a boom, a clap and a pop on frame 1 and a ding as the summary's "confirmed" is circled; a boom on
# "Confirmed?!"; a ding on "Poll tomorrow"; a snap as his question is underlined; a drop before "Four" and a cha-ching on
# the test card; a snap on the copy card, a success sting on "ten out of ten"; his message pops in, the quiz's tick-tock
# 3-2-1 with a riser, the bed out after the count; a boom and clap after "Quote: mavayya"; a buzz on "Mavayya!"; hats and
# claps build through the last scene; the snap back to frame 1 is the biggest hit. The scenes step up.
# Render review 1 (both viewers): the sound never lifted when he gets caught, the middle and the end sat at one level. The
# middle sits lower now; the reveal is its own scene: the bed out after the quiz count, a boom on the cut to the answer, the
# brighter bed layer and the hats and claps from there, and the bed rising into "See? The AI says Goa!".
SCENES = [("s_a", (1, 2, 3, 4, 5), {"boost": 1.25, "tail": 0.1}),
          ("s_b", (6, 7, 8, 9), {"lift": 0.8, "pre": 0.35, "boost": 1.15, "drop_at": [[0, "1", 0.2]], "tail": 0.1}),   # silence before "Four"
          ("s_c", (10,), {"lift": 0.9, "pre": 0.35, "boost": 1.15, "tail": 0.0}),   # he posts it; the quiz holds after it
          ("s_d", (11, 12, 13, 14), {"outro": True, "boost": 1.5, "rise": 1.25,
                                     "drop_pre": [[0, 0.0, 1.4]], "tail": 0.0})]   # the bed out after the quiz count, before "Decided: Goa"
GAP = {1: 0.15, 2: 0.15, 3: 0.2, 5: 0.35, 6: 0.4, 8: 0.45, 9: 0.35, 10: 4.8, 11: 0.4, 12: 0.6, 13: 1.0}   # 10: the quiz holds 4.8 s (render review: 3.4 s was read too fast); 12: a beat after "Mavayya!"; 13: the riser into his last line sits in the gap (over "చూశారా?" it smeared the word)
GAP_TE = {}
GAIN = {14: 1.5}   # render review 2: "See? The AI says Goa!" a little louder
GAIN_TE = {}
FLAGS_TE = {"s_d": {"boost": 1.5, "duck_lines": [[3, 0.6]]}}   # EP40: a louder last-scene bed buried Telugu words; the rising bed
# masked the last word "కన్ఫర్మ్" (the take alone reads clean): the bed dips under that line, the slam after it stays
YT = {"s_a": "The AI confirmed Goa", "s_b": "Quote the message", "s_c": "He decides", "s_d": "Who said it?"}
MARK = re.compile(r"\[\d+\]\s*")


def spec(lang="en"):
    te = lang == "te"
    sid = "creative11te" if te else "creative11v1"
    s = {"id": sid, "title": "The AI confirmed Goa (Creative 11: AI summaries)" + (" (Telugu audio)" if te else ""), "label": "SKIT",
         "banner": "AI chat summaries", "topic": "", "look": "classic", "gap": 0.16, "lead": 0.15, "music": "lofi",
         "musicVol": [0.5, 0.66],   # under speech / in gaps (EP39's levels)
         "musicDuckRamp": 9,   # ease the bed up and down over 0.3 s around each line
         "musicFade": 0.05, "endPad": 0.5, "captionMode": "phrase", "musicEQ": [[260, -5, 0.9], [2400, -5, 1.0]],
         "musicPad": True, "musicGapGain": 1.5, "musicEndRamp": [0.93, 4.0], "hardCuts": True, "beatSnap": True,   # the end swell into the slam
         "hideTimerInHook": True, "hideTimer": True,
         "tempo": 1.0, "captionTop": 1500}
    if te:   # render review 2: the music in the Telugu gaps sat ~12 dB under the voice (English ~3): louder gaps
        s.update({"handle": "@ai_maastaaru_telugu", "parler_lang": "te", "musicGapGain": 3.0})
    scenes = []
    for scid, ns, flags in SCENES:
        lines, beats = [], []
        for n in ns:
            who, shot, prop, en, tel = LINES[n]
            raw = tel if te else TTS_EN.get(n, en)
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": raw,
                  "show": (SHOW_TE.get(n) if te else None) or SHOW.get(n, MARK.sub("", en).replace(" | ", " ").strip()), "maxgap": 0.28, "gap": (GAP_TE if te else {}).get(n, GAP.get(n, 0.16)),
                  "tempo": TEMPO_LINE_TE.get(n, TEMPO_TE[who]) if te else TEMPO_EN[who]}
            if not te and n in TTS_EN:
                ln["tts"] = MARK.sub("", TTS_EN[n]).strip()
            if n in NOCAP:
                ln["nocap"] = True
            if n in PAUSES:
                ln["pauses"] = PAUSES[n]
            if " | " in ln["text"]:   # two takes; the text keeps its cues, split where the second take starts
                p1, p2 = ln["text"].split(" | ")
                pz = 0.25
                ln.update({"text": f"{p1} <pause {pz}> {p2}", "tts": MARK.sub("", p1).strip(), "file2": f"{n:02d}b_{who}.wav",
                           "tts2": MARK.sub("", p2).strip(), "pause": pz})
            g = 0.5 + (GAIN_TE if te else GAIN).get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        if te:
            data["handle"] = "@ai_maastaaru_telugu"
        if te and scid in FLAGS_TE:
            flags = {**flags, **FLAGS_TE[scid]}
        scenes.append({"id": scid, "type": "sk_family", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / f"{sid}.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec("en")
    spec("te")
