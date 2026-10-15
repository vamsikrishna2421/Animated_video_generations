# Hook test variants of the laptop demo reel (template 01): the same shots in a shorter, payoff-first order, three
# different openings. Writes video/src/reel/webdemo/web01_hook{A,B,C}.json and pipeline/web_demo/cues_hook{A,B,C}.json,
# then the soundtracks: python3 pipeline/web_demo/make_hooks.py
import copy
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = json.loads((ROOT / "video/src/reel/webdemo/web01_laptop.json").read_text())
LX, LY, LW, LH = 80, 700, 920, 518


def K(t, s, u=None, v=None):
    x, y = (0.5, 0.47) if u is None else ((LX + LW * u) / 1080, (LY + LH * v) / 1920)
    return {"t": t, "s": s, "x": round(x, 4), "y": round(y, 4)}


# Shots: recordings are web/01/deskflow.mp4 (intro -> profiles click 5.81 s -> home -> card hover 9.47-10.87 ->
# numbered row -> card click 17.95 s -> pop-up), deskintro_yourname.mp4 / deskintro_priya.mp4 (the name intro;
# letters land by 1.0 s, zoom-through from 2.1 s).
SHOT = {
    "yourname": {"kind": "laptop", "src": "web/01/deskintro_yourname.mp4", "src0": 0.6, "dur": 2.4,
                 "lcam": [K(0, 1.4), K(2.4, 1.9)], "sting": 0.0},
    "priya": {"kind": "laptop", "src": "web/01/deskintro_priya.mp4", "src0": 1.0, "dur": 2.4,
              "lcam": [K(0, 1.3), K(2.4, 1.6)], "sting": 0.0},
    "profiles": {"kind": "laptop", "src0": 4.6, "dur": 2.4,
                 "lcam": [K(0, 2.3, 0.5, 0.46), K(0.6, 2.3, 0.5, 0.46), K(0.95, 2.7, 0.33, 0.5), K(2.4, 2.7, 0.33, 0.5)],
                 "callouts": [{"t0": 1.15, "t1": 2.35, "text": "RECRUITER", "sub": "their name on the rows", "u": 0.313, "v": 0.47, "y": 1170, "lineUntil": 2.3}],
                 "clicks": [5.81 - 4.6]},
    "hover": {"kind": "laptop", "src0": 9.6, "dur": 2.4, "scrim": 1,
              "lcam": [K(0, 2.35, 0.32, 0.68), K(1.4, 2.6, 0.32, 0.71), K(2.4, 2.6, 0.32, 0.71)]},
    "popup": {"kind": "laptop", "src0": 17.4, "dur": 2.4,
              "lcam": [K(0, 2.4, 0.88, 0.29), K(0.55, 2.4, 0.88, 0.29), K(1.2, 1.5, 0.5, 0.64), K(2.4, 1.55, 0.5, 0.66)],
              "callouts": [{"t0": 1.0, "t1": 2.35, "text": "YOUR PROJECT", "sub": "story, tags, links", "u": 0.35, "v": 0.69, "y": 1290}],
              "clicks": [17.95 - 17.4]},
    # config.js: codeT0 0.5 starts the delete at 0.2 s; typing 1.1-1.55 s; saved at 1.9 s
    "code": {"kind": "laptopcode", "dur": 2.4, "codeT0": 0.5,
             "lcam": [K(0, 1.9, 0.34, 0.27), K(2.4, 1.95, 0.34, 0.27)],
             "callouts": [{"t0": 0.1, "t1": 2.3, "text": "YOUR NAME", "u": 0.42, "v": 0.245, "y": 600}],
             "rattle": [0.2, 0.85], "clicks": [1.1, 1.19, 1.28, 1.37, 1.46, 1.9]},
    "prompt": {"kind": "laptopchat", "dur": 2.4,
               "chat": {"prompt": "Make me a Netflix-style portfolio site. Open with my name in that red font, then \"Who's watching?\", then my projects as rows of shows.",
                        "reply": "On it: the name intro, the profile picker, the rows"},
               "lcam": [K(0, 1.22, 0.5, 0.42), K(2.4, 1.32, 0.5, 0.42)], "rattle": [0.1, 1.5], "clicks": [1.6]},
    "end": {"kind": "end", "dur": 3.0},
}

VARIANTS = {
    # A: the payoff first (Meta's note): the "YOUR NAME" letters landing on frame 1, framed as a result
    "A": [("yourname", "Make recruiters\nbinge your work", "free Netflix-style portfolio"),
          ("profiles", "Recruiters get\na welcome", None),
          ("hover", "Your projects,\nas shows", "hover on a laptop, tap on a phone"),
          ("popup", "One click: the\nwhole project", None),
          ("code", "Type your name...", None),
          ("priya", "...now it's\nyour intro", None),
          ("end", None, None)],
    # B: the magic moment first (the swap every viewer panel liked): typing a name, then that name's intro
    "B": [("code", "Type your name...", None),
          ("priya", "...get a Netflix-\nstyle intro", "free portfolio template"),
          ("profiles", "Recruiters get\na welcome", None),
          ("hover", "Your projects,\nas shows", "hover on a laptop, tap on a phone"),
          ("popup", "One click: the\nwhole project", None),
          ("end", None, None)],
    # C: the page's own angle, shown honestly: the request typed to an AI assistant, then what it built
    "C": [("prompt", "I asked AI for a\nNetflix portfolio...", None),
          ("hover", "...it built this", "free to use"),
          ("yourname", "The intro is\nyour name", None),
          ("profiles", "Recruiters get\na welcome", None),
          ("code", "Edit one file", None),
          ("priya", "Free template", "link in bio"),
          ("end", None, None)],
}


def build(name, plan):
    segs, cues, t = [], {"stings": [], "cuts": [], "clicks": [], "rattle": [], "snaps": True, "hold_end": True}, 0.0
    for i, (shot, title, sub) in enumerate(plan):
        s = copy.deepcopy(SHOT[shot])
        sting, clicks, rattle = s.pop("sting", None), s.pop("clicks", []), s.pop("rattle", None)
        if title:
            s["title"], s["pos"] = title, "top"
        if sub:
            s["sub"] = sub
        if s["kind"] == "laptop" and "src" not in s:
            s["src"] = BASE["desk"]
        segs.append(s)
        if sting is not None:   # the name intro lands on a boom (the swell starts just before the cut)
            cues["stings"].append({"start": max(0.0, t - (1.8 if i == 1 else 0.6)), "hit": round(t + 0.04, 3), "shimmer": round(t + 0.4, 3),
                                   "zoom": round(t + 1.1, 3), "land": round(t + s["dur"], 3), **({"floor": 0.6} if t == 0 else {})})
        elif i > 0 and s["kind"] != "end":
            cues["cuts"].append(round(t, 3))
        cues["clicks"] += [round(t + c, 3) for c in clicks]
        if rattle:
            cues["rattle"] += [round(t + rattle[0], 3), round(t + rattle[1], 3)]
        t = round(t + s["dur"], 3)
    end_at = round(t - segs[-1]["dur"], 3)
    first_bed = 0.0 if SHOT[plan[0][0]].get("sting") is None else segs[0]["dur"]
    # the bed drops out for the 0.6 s swell before each later name intro (a pause before the payoff), and a cut that
    # coincides with a sting's landing impact is not doubled
    beds, a = [], first_bed
    for st in cues["stings"]:
        if st["hit"] <= a + 0.1:      # the opening name intro: the bed starts after it
            continue
        if st["start"] > a + 1.0:     # play the bed up to the swell (skip windows under 1 s)
            beds.append([a, st["start"]])
        a = round(st["hit"] - 0.04, 3)
    beds += [[a, round(end_at - 0.2, 3)], [end_at, t]]
    lands = [st["land"] for st in cues["stings"]]
    cues["cuts"] = [c for c in cues["cuts"] if all(abs(c - x) > 0.05 for x in lands)]
    cues.update({"total": t, "end": end_at, "stab": round(end_at + 2.0, 3), "beds": beds,
                 "steps": [[first_bed, round(first_bed + (end_at - first_bed) / 2, 3)]],
                 "lifts": [[round(first_bed + (end_at - first_bed) / 2, 3), end_at - 0.2], [end_at, t]],
                 "lift_gain": [1.2, 1.4], "bed_gain": 0.9, "step_gain": 1.05, "risers": [[round(end_at - 1.2, 3), end_at]]})
    if first_bed == 0.0:   # no name intro to open on: a hit in the first second anyway
        cues["cuts"].insert(0, 0.02)
    demo = copy.deepcopy(BASE)
    demo["segs"], demo["audio"] = segs, f"web/01/sound_hook{name}.wav"
    (ROOT / f"video/src/reel/webdemo/web01_hook{name}.json").write_text(json.dumps(demo, ensure_ascii=False, indent=2))
    cf = ROOT / f"pipeline/web_demo/cues_hook{name}.json"
    cf.write_text(json.dumps(cues, indent=1))
    subprocess.run(["python3", str(ROOT / "pipeline/web_demo/sound.py"), str(ROOT / f"video/public/web/01/sound_hook{name}.wav"), str(cf)], check=True)
    print(name, f"{t:.1f} s", [x[0] for x in plan])


for k, v in VARIANTS.items():
    build(k, v)
