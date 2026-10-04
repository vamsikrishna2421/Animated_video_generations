"""Retarget a whole-body capture (pipeline/raw/<name>.npz from fullbody.py) onto the Fumble rig, with the small parts:

  python3 pipeline/fullbody_rig.py --name boss [--clip <video>]

Besides the usual body controls (mocap.to_rig3d: arms, legs, lean, pelvis, twist, head, depth order) every frame gets
  footL/footR   [screen angle of heel->toe (deg, 0 = pointing screen-right, y down), projected/true length]
  wristL/wristR wrist bend (deg) = hand direction - forearm direction
  fingL/fingR   [index, middle, ring, pinky, thumb] curl 0 (straight) .. 1 (fully bent)
  palmL/palmR   -1 back of the hand to camera .. 1 palm to camera
  phoneL/phoneR 0..1 a bright phone screen is in that hand
Screen-left rig limbs are the dancer's right limbs (he faces the camera), as everywhere else in the pipeline.
Output: video/src/reel/mocap/<name>.json (same shape as mocap.py: {fps, frames, src, tracks:[{x, poses}]}).
"""
import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mocap import FF, ang, medfilt, poses3d, smooth, to_rig3d  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TIPS, PIPS, MCPS = (8, 12, 16, 20), (6, 10, 14, 18), (5, 9, 13, 17)


def finger_curl(h):
    """(F,21,2) -> (F,5) curl per finger from how far each fingertip folds back toward the wrist."""
    F = len(h)
    out = np.zeros((F, 5))
    palm = np.linalg.norm(h[:, 9] - h[:, 0], axis=1) + 1e-6
    for k, (t, p, m) in enumerate(zip(TIPS, PIPS, MCPS)):
        straight = np.linalg.norm(h[:, m] - h[:, 0], axis=1) + np.linalg.norm(h[:, t] - h[:, m], axis=1)
        reach = np.linalg.norm(h[:, t] - h[:, 0], axis=1)
        out[:, k] = np.clip(1.6 * (1 - reach / straight), 0, 1)
    thumb = np.linalg.norm(h[:, 4] - h[:, 5], axis=1) / palm  # thumb tip to index knuckle: small = tucked
    out[:, 4] = np.clip(1.3 - thumb * 1.4, 0, 1)
    return out


def palm_facing(h, side):
    """Sign of the palm's normal in image space: + palm to camera. side 0 = dancer's left hand, 1 = right."""
    a = h[:, 5] - h[:, 0]
    b = h[:, 17] - h[:, 0]
    cz = a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0]
    n = np.linalg.norm(a, axis=1) * np.linalg.norm(b, axis=1) + 1e-6
    v = cz / n  # -1..1; mirrored for the other hand
    return np.clip((v if side == 1 else -v) * 2.2, -1, 1)


def phone_in_hand(video, start, fps, img, hand, side, F):
    """A phone screen is the brightest compact blob right at the hand: mean brightness of the top 8% pixels near it."""
    cap = cv2.VideoCapture(str(video))
    torso = np.median(np.linalg.norm((img[:, 11, :2] + img[:, 12, :2]) / 2 - (img[:, 23, :2] + img[:, 24, :2]) / 2, axis=1))
    vals = np.zeros(F)
    wi = 15 + side
    for i in range(F):
        cap.set(cv2.CAP_PROP_POS_MSEC, (start + i / fps) * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        c = hand[i, 9, :2] if not np.isnan(hand[i, 9, 0]) else img[i, wi, :2]
        r = int(0.35 * torso)
        x0, y0 = int(max(0, c[0] - r)), int(max(0, c[1] - r))
        g = cv2.cvtColor(fr[y0:int(c[1] + r), x0:int(c[0] + r)], cv2.COLOR_BGR2GRAY) if r > 4 else None
        if g is None or g.size == 0:
            continue
        vals[i] = (g > 245).mean()  # share of near-white pixels: the lit screen
    from scipy.ndimage import maximum_filter1d, minimum_filter1d
    on = (vals > 0.004).astype(float)
    on = minimum_filter1d(maximum_filter1d(on, 61), 61)  # the screen only faces the camera now and then: close 2 s gaps
    return smooth(on, 9).clip(0, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True)
    ap.add_argument("--clip", help="source video (phone detection + the side-by-side reference clip)")
    a = ap.parse_args()
    z = np.load(ROOT / "pipeline/raw" / f"{a.name}.npz")
    img, wld, hnd, hok = z["imgc"], z["wldc"], z["hndc"], z["hok"]
    fps, W, H, start, shots = float(z["fps"]), float(z["W"]), float(z["H"]), float(z["start"]), [int(s) for s in z["shots"]]
    F = len(img)
    o = to_rig3d(img, wld, shots)
    # bending toward the camera (hands on knees) shortens the torso far more than mocap.py allows (0.85): let it read
    tl = np.linalg.norm((img[:, 11, :2] + img[:, 12, :2]) / 2 - (img[:, 23, :2] + img[:, 24, :2]) / 2, axis=1)
    o["spineS"] = smooth(np.clip(tl / (np.percentile(tl, 92) + 1e-6), 0.5, 1.0), 7)
    poses = poses3d(o)
    rnd = lambda v, d=1: round(float(v), d)  # noqa: E731

    # feet: screen angle and foreshortening of heel -> toe (dancer's right foot = rig screen-left)
    feet = {}
    for rig, (he, to) in (("L", (30, 32)), ("R", (29, 31))):
        v = img[:, to, :2] - img[:, he, :2]
        angd = np.degrees(np.arctan2(v[:, 1], v[:, 0]))
        ln = np.linalg.norm(v, axis=1)
        full = np.percentile(ln, 95) + 1e-6
        feet[rig] = (np.degrees(np.unwrap(np.radians(angd))), np.clip(ln / full, 0.35, 1))
    # hands: wrist bend from the hand's own axis when the hand model saw it, else from the pose's finger points
    hands = {}
    for rig, side in (("L", 1), ("R", 0)):
        wi, ei, ii, pi_ = 15 + side, 13 + side, 19 + side, 17 + side
        fore = np.array([ang(*v) for v in img[:, wi, :2] - img[:, ei, :2]])
        h = hnd[:, side, :, :2]
        ok = hok[:, side].astype(bool)
        axis_h = h[:, 9] - h[:, 0]
        axis_p = (img[:, ii, :2] + img[:, pi_, :2]) / 2 - img[:, wi, :2]
        hand_dir = np.array([ang(*(axis_h[i] if ok[i] else axis_p[i])) for i in range(F)])
        bend = ((hand_dir - fore + 180) % 360) - 180
        curl = finger_curl(h)
        curl[~ok] = np.nan
        palm = palm_facing(h, side)
        palm[~ok] = np.nan
        idx = np.arange(F)

        def interp(x):
            x = x.copy()
            for c in range(x.shape[1] if x.ndim > 1 else 1):
                col = x[:, c] if x.ndim > 1 else x
                good = ~np.isnan(col)
                if good.sum() >= 2:
                    col[:] = np.interp(idx, idx[good], col[good])
                else:
                    col[:] = 0.3
            return x
        hands[rig] = (smooth(medfilt(np.clip(bend, -80, 80), 3), 5), interp(curl), interp(palm), side, h)
    phone = {"L": np.zeros(F), "R": np.zeros(F)}
    if a.clip:
        for rig in ("L", "R"):
            phone[rig] = phone_in_hand(a.clip, start, fps, img, hands[rig][4], hands[rig][3], F)
        keep = max(phone, key=lambda k: phone[k].sum())  # one phone: the hand that shows the screen most holds it
        phone = {k: (v if k == keep else np.zeros(F)) for k, v in phone.items()}

    for i, p in enumerate(poses):
        for rig in ("L", "R"):
            fa, fl = feet[rig]
            p[f"foot{rig}"] = [rnd(fa[i]), rnd(fl[i], 2)]
            bend, curl, palm, _, _ = hands[rig]
            p[f"wrist{rig}"] = rnd(bend[i])
            p[f"fing{rig}"] = [rnd(c, 2) for c in curl[i]]
            p[f"palm{rig}"] = rnd(palm[i], 2)
            if phone[rig][i] > 0.05:
                p[f"phone{rig}"] = rnd(phone[rig][i], 2)
    out = ROOT / "video/src/reel/mocap" / f"{a.name}.json"
    out.write_text(json.dumps({"fps": 30, "frames": F, "src": {"w": W, "h": H}, "tracks": [{"x": [rnd(v) for v in o["x"]], "poses": poses, "found": int(F)}]}))
    if a.clip:
        clip = ROOT / "video/public/mocap" / f"{a.name}.mp4"
        clip.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([str(FF / "ffmpeg"), "-y", "-loglevel", "error", "-ss", str(start), "-t", str(F / fps), "-i", str(a.clip), "-an", "-r", "30", "-c:v", "libx264", "-crf", "24", str(clip)],
                       check=True, env=dict(os.environ, LD_LIBRARY_PATH=str(FF)))
    on = {k: float((v > 0.5).mean()) for k, v in phone.items()}
    print(out, F, "frames; phone in hand (screen-left/right):", {k: f"{v:.0%}" for k, v in on.items()})


if __name__ == "__main__":
    main()
