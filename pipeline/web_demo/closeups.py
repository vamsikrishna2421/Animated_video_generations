# Bake the full-screen laptop close-ups: crop the 2560x1440 desktop recording to 9:16 along each "deskfull" segment's
# camera path (same easing as the composition) and write 1080x1920 clips the renderer can load cheaply.
#   python3 pipeline/web_demo/closeups.py video/src/reel/webdemo/web01.json
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FPS, OW, OH = 30, 1080, 1920


def ease(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def cam_at(cam, t):
    if t <= cam[0]["t"]:
        return cam[0]["s"], cam[0]["x"], cam[0]["y"]
    for a, b in zip(cam, cam[1:]):
        if t <= b["t"]:
            k = ease((t - a["t"]) / max(1e-6, b["t"] - a["t"]))
            return tuple(a[q] + (b[q] - a[q]) * k for q in ("s", "x", "y"))
    return cam[-1]["s"], cam[-1]["x"], cam[-1]["y"]


def main(spec_path):
    import av                                   # PyAV: full decoders/encoders (the renderer's ffmpeg has no raw pipes)
    spec_path = Path(spec_path)
    spec = json.loads(spec_path.read_text())
    src = ROOT / "video/public" / spec["desk"]
    for i, seg in enumerate(spec["segs"]):
        if seg["kind"] != "deskfull":
            continue
        n = round(seg["dur"] * FPS)
        rel = f"web/01/close_{i}.mp4"
        out = av.open(str(ROOT / "video/public" / rel), "w")
        vs = out.add_stream("libx264", rate=FPS)
        vs.width, vs.height, vs.pix_fmt = OW, OH, "yuv420p"
        vs.options = {"crf": "15", "preset": "medium", "g": "15"}
        inp = av.open(str(src))
        frames = []
        for fr in inp.decode(video=0):
            t = float(fr.pts * fr.time_base)
            if t < seg["src0"] - 1e-3:
                continue
            frames.append(fr.to_image())
            if len(frames) >= n:
                break
        inp.close()
        for k, img in enumerate(frames):
            W, H = img.size
            s, x, y = cam_at(seg["cam"], k / FPS)
            ch = H / s
            cw = ch * OW / OH
            cx = min(max(x * W, cw / 2), W - cw / 2)
            cy = min(max(y * H, ch / 2), H - ch / 2)
            box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
            vf = av.VideoFrame.from_image(img.resize((OW, OH), Image.LANCZOS, box=box))
            for pkt in vs.encode(vf):
                out.mux(pkt)
        for pkt in vs.encode():
            out.mux(pkt)
        out.close()
        seg["clip"] = rel
        print(f"segment {i}: {len(frames)} frames -> {rel}")
    spec_path.write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main(sys.argv[1])
