# EP33 "We don't sell headaches" (RAG part 3: hybrid search and measuring it): writes reels/ep33v1.json (English).
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
YT = {"st_a": "Out of stock?", "st_b": "Meaning vs keyword", "st_c": "We don't sell headaches", "st_d": "Both, still 3 pages",
      "st_e": "Our test: 15, 13, 18", "st_f": "Write it down", "st_g": "One is enough?"}


def spec():
    s = {"id": "ep33v1", "title": "We don't sell headaches (EP33: hybrid search)", "label": "EP33", "banner": "Why the AI said OUT OF STOCK",
         "topic": "", "look": "classic", "gap": 0.18, "lead": 0.15, "music": "lofi", "musicVol": [0.4, 0.75], "musicFade": 0.05,
         "endPad": 0.45, "captionMode": "phrase", "musicEQ": [[260, -4, 0.9], [2400, -3, 1.0]], "musicPad": True, "hardCuts": True,
         "beatSnap": True, "hideTimerInHook": True, "hideTimer": True, "tempo": 1.0, "captionTop": 1500}
    scenes = []
    for scid, a, b, flags in SCENES:
        lines, beats = [], []
        for n in range(a, b + 1):
            who, shot, prop, text = LINES[n]
            ln = {"who": who, "file": f"{n:02d}_{who}.wav", "text": text, "show": SHOW[n], "maxgap": 0.35,
                  "gap": 0.05 if n == 26 else GAP.get(n, 0.18)}
            # loudness arc (the first cut's quarters were within 1 dB): the joke sits a little lower, the test lifts,
            # the fix and the twist build to the loudest stretch
            g = (-1.0 if who == "ai" else 1.5) + (-1.0 if 8 <= n <= 12 else 0.0) + (1.0 if 21 <= n <= 24 else 0.0) + (0.6 if n >= 19 else 0.0)   # Ravi's shouts sat level with the AI
            g += {18: 2.0, 25: 1.0, 26: 2.0}.get(n, 0.0)
            if g:
                ln["gain_db"] = g
            lines.append(ln)
            beats.append({"who": who, "shot": shot, "prop": prop, "n": n})
        data = {"beats": beats, "captionTop": 1500, "yt": {"chapter": YT[scid], "title": YT[scid], "notes": []}}
        scenes.append({"id": scid, "type": "sk_stock", "tail": flags.get("tail", 0.2),
                       **{k: v for k, v in flags.items() if k != "tail"}, "data": data, "lines": lines})
    s["scenes"] = scenes
    out = R / "ep33v1.json"
    out.write_text(json.dumps(s, ensure_ascii=False, indent=1))
    print("wrote", out)


if __name__ == "__main__":
    spec()
