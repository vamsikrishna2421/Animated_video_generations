# YouTube chapter list for a reel timeline: python3 pipeline/tools/chapters.py <timeline id> ; chapters under 10 s merge into the previous one.
import json, sys
from pathlib import Path

tl = json.loads((Path(__file__).resolve().parents[2] / "video/src/reel/timelines" / f"{sys.argv[1]}.json").read_text())
fps, total = tl["fps"], tl["totalFrames"] / tl["fps"]
ch = [(sc["from"] / fps, sc["data"].get("yt", {}).get("chapter", sc["id"])) for sc in tl["scenes"]]
out = []
for i, (t, name) in enumerate(ch):
    end = ch[i + 1][0] if i + 1 < len(ch) else total
    if out and end - t < 10:
        out[-1] = (out[-1][0], out[-1][1] + " + " + name)
    else:
        out.append((t, name))
for i, (t, name) in enumerate(out):
    t = 0 if i == 0 else int(t)
    print(f"{t // 60}:{t % 60:02d} {name}")
print(f"(total {total:.1f} s)")
