"""Facial expression capture -> rig face controls (Fumble / Heroine).

  python3 pipeline/face_capture.py <video> --start 51 --end 54.3 --seed 0.3 --name yesh_face_k1 [--up 3]

MediaPipe Face Landmarker (52 ARKit-style blendshapes + head pose) on an upscaled frame; the face nearest the
seed x (normalised) is followed. Output: video/src/reel/mocap/<name>.json  {fps, frames, found, face: [...]}
with smile, mo (jaw open), lid (blink), squint, browL/browR, knit, pucker, skew (lopsided smile), lookX/lookY,
tilt (head roll) and turn (head yaw). Missing frames are interpolated (short gaps) or held; then smoothed.
Screen-left = the actor's right side, so MediaPipe's "Right" blendshapes drive the rig's screen-left controls.
Model (git-ignored): pipeline/models/face_landmarker.task from storage.googleapis.com/mediapipe-models.
"""
import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from scipy.signal import savgol_filter

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "pipeline/models/face_landmarker.task"


def capture(video, start, end, seed, up=3.0, fps=30):
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=str(MODEL)), output_face_blendshapes=True,
        output_facial_transformation_matrixes=True, num_faces=4, min_face_detection_confidence=0.3,
        running_mode=vision.RunningMode.IMAGE))
    cap = cv2.VideoCapture(str(video))
    last, out = seed, []
    for k in range(int((end - start) * fps)):
        cap.set(cv2.CAP_PROP_POS_MSEC, (start + k / fps) * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        big = cv2.resize(fr, None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(big, cv2.COLOR_BGR2RGB)))
        best, bd = None, 0.12
        for lm, bs, mt in zip(r.face_landmarks, r.face_blendshapes, r.facial_transformation_matrixes):
            x = float(np.mean([p.x for p in lm]))
            if abs(x - last) < bd:
                best, bd = ({b.category_name: b.score for b in bs}, np.array(mt), x), abs(x - last)
        if best is not None:
            last = best[2]
        out.append(best)
    det.close()
    return out


def to_face(seq):
    keys = ["smile", "mo", "lid", "squint", "browL", "browR", "knit", "pucker", "skew", "lookX", "lookY", "tilt", "turn"]
    F = len(seq)
    vals = {k: np.full(F, np.nan) for k in keys}
    for i, s in enumerate(seq):
        if s is None:
            continue
        b, m, _ = s
        g = b.get
        sm = (g("mouthSmileLeft", 0) + g("mouthSmileRight", 0)) / 2
        vals["smile"][i] = np.clip(sm * 1.5 - 0.1 - 0.5 * (g("mouthFrownLeft", 0) + g("mouthFrownRight", 0)), -0.6, 1)
        vals["mo"][i] = np.clip(g("jawOpen", 0) * 1.7, 0, 1)
        vals["lid"][i] = np.clip((g("eyeBlinkLeft", 0) + g("eyeBlinkRight", 0)) / 2 * 1.1, 0, 1)
        vals["squint"][i] = np.clip((g("eyeSquintLeft", 0) + g("eyeSquintRight", 0)) / 2 * 1.5, 0, 1)
        up_r = g("browOuterUpRight", 0) * 0.6 + g("browInnerUp", 0) * 0.6 - g("browDownRight", 0)
        up_l = g("browOuterUpLeft", 0) * 0.6 + g("browInnerUp", 0) * 0.6 - g("browDownLeft", 0)
        vals["browL"][i], vals["browR"][i] = np.clip(up_r * 1.6, -1, 1), np.clip(up_l * 1.6, -1, 1)
        vals["knit"][i] = np.clip((g("browDownLeft", 0) + g("browDownRight", 0)) / 2 * 1.5, 0, 1)
        vals["pucker"][i] = np.clip(g("mouthPucker", 0) * 1.3, 0, 1)
        vals["skew"][i] = np.clip((g("mouthSmileLeft", 0) - g("mouthSmileRight", 0)) * 1.5, -1, 1)
        vals["lookX"][i] = np.clip((g("eyeLookOutRight", 0) - g("eyeLookInRight", 0) + g("eyeLookInLeft", 0) - g("eyeLookOutLeft", 0)) / 2 * -1.6, -1, 1)
        vals["lookY"][i] = np.clip(((g("eyeLookDownLeft", 0) + g("eyeLookDownRight", 0)) - (g("eyeLookUpLeft", 0) + g("eyeLookUpRight", 0))) / 2 * 1.4, -1, 1)
        R = m[:3, :3]
        vals["tilt"][i] = np.clip(math.degrees(math.atan2(R[1, 0], R[1, 1])) * -1, -30, 30)
        vals["turn"][i] = np.clip(math.degrees(math.atan2(-R[2, 0], math.hypot(R[2, 1], R[2, 2]))) / 45, -1, 1)
    idx = np.where(~np.isnan(vals["smile"]))[0]
    if len(idx) < 3:
        return None, 0
    res = {}
    for k, v in vals.items():
        v = np.interp(np.arange(F), idx, v[idx])
        for a, b in zip(idx, idx[1:]):  # long gaps: hold instead of inventing
            if b - a > 15:
                v[a + 1:b] = v[a]
        w = min(7 if k != "lid" else 3, F - (1 - F % 2))
        res[k] = savgol_filter(v, w, 2) if w >= 3 and k != "lid" else v
    frames = [{k: round(float(np.clip(res[k][i], -30 if k == "tilt" else -1, 30 if k == "tilt" else 1)), 2) for k in keys} for i in range(F)]
    return frames, len(idx)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--start", type=float, required=True)
    ap.add_argument("--end", type=float, required=True)
    ap.add_argument("--seed", type=float, required=True, help="normalised x of the face to follow")
    ap.add_argument("--name", required=True)
    ap.add_argument("--up", type=float, default=3.0)
    a = ap.parse_args()
    seq = capture(a.video, a.start, a.end, a.seed, a.up)
    face, n = to_face(seq)
    out = ROOT / "video/src/reel/mocap" / f"{a.name}.json"
    out.write_text(json.dumps({"fps": 30, "frames": len(seq), "found": n, "face": face or []}))
    print(out, len(seq), "frames,", n, "with a face")


if __name__ == "__main__":
    main()
