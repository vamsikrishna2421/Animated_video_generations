"""Whole-body capture for a single dancer: body (33 points, heavy model) + both hands (21 points each), every frame.

  python3 pipeline/fullbody.py <video> --name boss [--start 0 --end 36] [--cuts "4.6,5.93,..."]

  -> pipeline/raw/<name>.npz   raw + cleaned landmarks (git-ignored; re-retarget without re-detecting)
  -> prints a ranking of which body points move most (the "moving parts" survey)

Hands are matched to the body by distance from each detected hand's wrist to the pose wrists, so left/right never
swaps even when MediaPipe's handedness label flips. Landmarks are cleaned shot by shot (mocap.clean: L/R swap fix,
spike rejection, zero-phase One Euro) before anything is derived from them.
"""
import argparse
import sys
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mocap import clean, hampel, zero_phase  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
M = ROOT / "pipeline/models"
NAMES = ["nose", "eyeInL", "eyeL", "eyeOutL", "eyeInR", "eyeR", "eyeOutR", "earL", "earR", "mouthL", "mouthR",
         "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "pinkyL", "pinkyR", "indexL", "indexR",
         "thumbL", "thumbR", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR", "heelL", "heelR", "toeL", "toeR"]


def detect(video, start, end):
    V = mp.tasks.vision
    base = mp.tasks.BaseOptions
    pose = V.PoseLandmarker.create_from_options(V.PoseLandmarkerOptions(
        base_options=base(model_asset_path=str(M / "pose_landmarker_heavy.task")), running_mode=V.RunningMode.VIDEO,
        num_poses=2, min_pose_detection_confidence=0.5, min_tracking_confidence=0.5))
    # hands are small in a full-body shot: detect each one in an upscaled crop around its wrist (image mode)
    hands = V.HandLandmarker.create_from_options(V.HandLandmarkerOptions(
        base_options=base(model_asset_path=str(M / "hand_landmarker.task")), running_mode=V.RunningMode.IMAGE,
        num_hands=1, min_hand_detection_confidence=0.3, min_hand_presence_confidence=0.3))
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    cap.set(cv2.CAP_PROP_POS_MSEC, start * 1000)
    img, wld, hnd, hok = [], [], [], []
    t = start
    while t < end:
        ok, fr = cap.read()
        if not ok:
            break
        ms = int(t * 1000)
        im = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
        r = pose.detect_for_video(im, ms)
        p = np.full((33, 4), np.nan)
        w = np.full((33, 3), np.nan)
        if r.pose_landmarks:
            # the dancer = the biggest skeleton (ignores the painted mural behind him)
            k = max(range(len(r.pose_landmarks)), key=lambda i: np.ptp([l.y for l in r.pose_landmarks[i]]))
            p = np.array([[l.x * W, l.y * H, l.z * W, l.visibility] for l in r.pose_landmarks[k]])
            w = np.array([[l.x, l.y, l.z] for l in r.pose_world_landmarks[k]])
        h = np.full((2, 21, 3), np.nan)
        got = np.zeros(2, bool)
        if not np.isnan(p).all():
            torso = np.linalg.norm((p[11, :2] + p[12, :2]) / 2 - (p[23, :2] + p[24, :2]) / 2)
            for s_, (wi, ei, ii) in enumerate(((15, 13, 19), (16, 14, 20))):
                # centre a bit past the wrist along the forearm (the hand), box ~ 0.9 torso
                c = p[wi, :2] + 0.35 * (p[ii, :2] - p[wi, :2]) + 0.15 * (p[wi, :2] - p[ei, :2])
                half = max(40, 0.45 * torso)
                x0, y0 = int(max(0, c[0] - half)), int(max(0, c[1] - half))
                x1, y1 = int(min(W, c[0] + half)), int(min(H, c[1] + half))
                if x1 - x0 < 20 or y1 - y0 < 20:
                    continue
                crop = cv2.resize(cv2.cvtColor(fr[y0:y1, x0:x1], cv2.COLOR_BGR2RGB), (256, 256), interpolation=cv2.INTER_CUBIC)
                rh = hands.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(crop)))
                if rh.hand_landmarks:
                    lm = rh.hand_landmarks[0]
                    a = np.array([[x0 + l.x * (x1 - x0), y0 + l.y * (y1 - y0), l.z * (x1 - x0)] for l in lm])
                    if np.linalg.norm(a[0, :2] - p[wi, :2]) < 0.6 * torso:  # it is this arm's hand
                        h[s_], got[s_] = a, True
        img.append(p)
        wld.append(w)
        hnd.append(h)
        hok.append(got)
        t += 1 / fps
    return np.array(img), np.array(wld), np.array(hnd), np.array(hok), fps, W, H


def clean_hand(h, shots):
    """(F,21,3) hand -> spikes removed and zero-phase One Euro, shot by shot, in palm-size units (fingertips keep snap)."""
    a = h.copy()
    F = len(a)
    for s0, s1 in zip(shots, list(shots[1:]) + [F]):
        seg = a[s0:s1]
        if len(seg) < 6:
            continue
        palm = np.nanmedian(np.linalg.norm(seg[:, 9, :2] - seg[:, 0, :2], axis=1)) + 1e-6
        idx = np.arange(len(seg))
        for j in range(21):
            for d in range(2):
                bad = hampel(seg[:, j, d] / palm)
                if bad.any() and (~bad).sum() >= 2:
                    seg[:, j, d] = np.interp(idx, idx[~bad], seg[~bad, j, d])
                mc, b = (1.2, 0.7) if j == 0 else (1.8, 1.5)
                seg[:, j, d] = zero_phase(seg[:, j, d] / palm, min_cutoff=mc, beta=b) * palm
        a[s0:s1] = seg
    return a


def fill_nan(a):
    """Linear-interpolate NaN runs along time for every channel (holds the ends)."""
    a = a.copy()
    flat = a.reshape(len(a), -1)
    idx = np.arange(len(a))
    for c in range(flat.shape[1]):
        v = flat[:, c]
        ok = ~np.isnan(v)
        if ok.sum() >= 2:
            flat[:, c] = np.interp(idx, idx[ok], v[ok])
    return flat.reshape(a.shape)


def survey(img, hands, fps, shots):
    """Rank body points by how much they move (speed relative to torso length, summed over the clip), so the rig and
    the keying effort go where the dance actually happens."""
    torso = np.nanmedian(np.linalg.norm((img[:, 11, :2] + img[:, 12, :2]) / 2 - (img[:, 23, :2] + img[:, 24, :2]) / 2, axis=1))
    hip = (img[:, 23, :2] + img[:, 24, :2]) / 2
    rel = img[:, :, :2] - hip[:, None, :]  # moves relative to the pelvis (dancing, not travelling)
    cutset = set(shots)
    v = np.linalg.norm(np.diff(rel, axis=0), axis=2) / torso * fps
    v[[i for i in range(len(v)) if (i + 1) in cutset]] = 0
    out = sorted(((float(np.nansum(v[:, j]) / fps), NAMES[j]) for j in range(33) if j not in (1, 3, 4, 6, 9, 10)), reverse=True)
    hv = []
    for s, side in ((0, "L"), (1, "R")):
        fingers = hands[:, s, 1:, :2] - hands[:, s, :1, :2]  # finger shape relative to the wrist
        hv.append((float(np.nansum(np.linalg.norm(np.diff(fingers, axis=0), axis=2).mean(axis=1)) / torso), f"fingers{side}"))
    return out, hv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--name", required=True)
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, default=1e9)
    ap.add_argument("--cuts", default="", help="shot cuts in seconds (clip time), comma separated")
    a = ap.parse_args()
    cache = ROOT / "pipeline/raw" / f"{a.name}.det.npz"
    if cache.exists():  # detection is the slow part: reuse it while tuning the cleanup/retarget
        z = np.load(cache)
        img, wld, hnd, hok, fps, W, H = z["img"], z["wld"], z["hnd"], z["hok"], float(z["fps"]), float(z["W"]), float(z["H"])
    else:
        img, wld, hnd, hok, fps, W, H = detect(a.video, a.start, a.end)
        cache.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(cache, img=img, wld=wld, hnd=hnd, hok=hok, fps=fps, W=W, H=H)
    shots = [0] + [int(round((float(c) - a.start) * fps)) for c in a.cuts.split(",") if c]
    found = ~np.isnan(img[:, 11, 0])
    imgc = clean(fill_nan(img[:, :, :3]), shots, coords=2)
    wldc = clean(fill_nan(wld), shots, coords=3)
    hndc = np.stack([clean_hand(fill_nan(hnd[:, s]), shots) for s in (0, 1)], axis=1)
    out = ROOT / "pipeline/raw"
    out.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(out / f"{a.name}.npz", img=img, wld=wld, hnd=hnd, hok=hok, imgc=imgc, wldc=wldc, hndc=hndc,
                        fps=fps, W=W, H=H, start=a.start, shots=np.array(shots))
    rank, hv = survey(imgc, hndc, fps, shots)
    print(f"{len(img)} frames, body found {found.mean():.0%}, left hand {hok[:, 0].mean():.0%}, right hand {hok[:, 1].mean():.0%}")
    print("motion (torso-lengths travelled relative to the pelvis):")
    for v, n in rank:
        print(f"  {n:10s} {v:6.1f}")
    for v, n in hv:
        print(f"  {n:10s} {v:6.1f}  (finger shape change)")


if __name__ == "__main__":
    main()
