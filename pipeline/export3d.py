"""Export the cleaned 3D world skeleton of a whole-body capture for the 3D robot (video/src/reel/Robot3D.tsx).

  python3 pipeline/export3d.py --name bj   -> video/src/reel/mocap/<name>_3d.json

Per frame: 33 joints in metres, three.js axes (x right, y up, z toward the camera), feet on the floor (y = 0), plus
stage travel from the image track. Finger curls come from <name>.json (fullbody_rig.py) if present.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from scipy.ndimage import uniform_filter1d

ROOT = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True)
    a = ap.parse_args()
    z = np.load(ROOT / "pipeline/raw" / f"{a.name}.npz")
    w = z["wldc"].astype(float)  # (F,33,3) metres, hip-centred, MediaPipe axes: x image-right, y down, z away
    img = z["imgc"]
    P = np.stack([w[..., 0], -w[..., 1], -w[..., 2]], -1)  # three.js: y up, z toward camera
    # turn the whole clip so the dancer's typical facing points at the camera (turns inside the clip are kept)
    right = (P[:, 23] - P[:, 24]) + (P[:, 11] - P[:, 12])
    fwd = np.cross(right, np.array([0.0, 1.0, 0.0]))
    yaw = np.arctan2(fwd[:, 0], fwd[:, 2])
    y0 = np.arctan2(np.median(np.sin(yaw)), np.median(np.cos(yaw)))
    c, s_ = np.cos(-y0), np.sin(-y0)
    x, zz = P[..., 0].copy(), P[..., 2].copy()
    P[..., 0], P[..., 2] = c * x + s_ * zz, -s_ * x + c * zz
    print("median facing", round(float(np.degrees(y0)), 1), "deg -> turned to face the camera")
    feet = P[:, [27, 28, 29, 30, 31, 32], 1].min(1)  # lowest foot point per frame
    floor = uniform_filter1d(feet, 5)
    P[..., 1] -= floor[:, None]  # standing on y = 0
    # stage travel: hip x in the image, in torso lengths -> metres (torso ~0.52 m)
    hip = (img[:, 23, :2] + img[:, 24, :2]) / 2
    torso = np.median(np.linalg.norm((img[:, 11, :2] + img[:, 12, :2]) / 2 - hip, axis=1))
    tx = uniform_filter1d((hip[:, 0] - np.median(hip[:, 0])) / torso * 0.52, 9)
    tz = np.zeros_like(tx)
    rig = ROOT / "video/src/reel/mocap" / f"{a.name}.json"
    fing = None
    if rig.exists():
        R = json.load(open(rig))["tracks"][0]["poses"]
        fing = [[p.get("fingR", [0.3] * 5), p.get("fingL", [0.3] * 5)] for p in R]  # dancer's left hand = rig screen-right
    out = {"fps": 30, "frames": len(P), "joints": [[round(float(v), 3) for v in P[i].ravel()] for i in range(len(P))],
           "tx": [round(float(v), 3) for v in tx], "tz": [round(float(v), 3) for v in tz]}
    if fing:
        out["fing"] = [[[round(float(c), 2) for c in h] for h in f] for f in fing]
    dst = ROOT / "video/src/reel/mocap" / f"{a.name}_3d.json"
    dst.write_text(json.dumps(out, separators=(",", ":")))
    print(dst, len(P), "frames", f"{dst.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
