"""Motion capture from a reference video -> pose track for the Fumble rig (Mr. Fumble / Heroine).

  python3 pipeline/mocap.py <video> --start 10 --end 25 --name test [--person left|right|largest] [--people 2]

  -> video/src/reel/mocap/<name>.json   {fps, frames, tracks: [{x: [...], poses: [FPose...]}...]}
  -> video/public/mocap/<name>.mp4      the cut reference clip (for side-by-side checks only; never published)

Model (git-ignored, ~9 MB): curl -sSL -o pipeline/models/pose_landmarker_full.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
Needs: pip install mediapipe; apt-get install libegl1 libgles2.

MediaPipe Pose (33 landmarks) per frame, people kept apart by where their hips are, then mapped onto rig
controls: torso lean, pelvis tilt, shoulder lift, spine bend, both arms (shoulder + elbow), both legs (thigh +
knee), head tilt and turn, stage position. Angles are unwrapped and smoothed (Savitzky-Golay); short dropouts
are interpolated. The pelvis height is solved so the lower foot stays on the floor (no floating or sinking).
Screen-left limbs on the rig are the dancer's right limbs (the dancer faces the camera).
"""
import argparse
import json
import math
import os
import subprocess
from pathlib import Path

import cv2
import numpy as np
from scipy.signal import savgol_filter

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "pipeline/models/pose_landmarker_full.task"
FF = ROOT / "video/node_modules/@remotion/compositor-linux-x64-gnu"
L1, L2, LS = 200, 195, 300  # rig thigh, shin, spine


def ang(dx, dy):
    """Rig angle of a screen vector: 0 = pointing down, + = toward screen-left."""
    return math.degrees(math.atan2(-dx, dy))


def detect(video, start, end, people, fps_out=30):
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=str(MODEL)), running_mode=vision.RunningMode.VIDEO, num_poses=people,
        min_pose_detection_confidence=0.4, min_tracking_confidence=0.4))
    cap = cv2.VideoCapture(str(video))
    W, H = cap.get(3), cap.get(4)
    out = []
    for k in range(int((end - start) * fps_out)):
        t = start + k / fps_out
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        r = det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)), int(t * 1000))
        out.append([np.array([[p.x * W, p.y * H, p.visibility] for p in lm]) for lm in r.pose_landmarks])
    det.close()
    return out, W, H


def detect_follow(video, start, end, seeds, fps_out=30, win_w=0.42, up=2.5, jump=0.18):
    """Follow specific dancers through a crowd. seeds: [(x, y), ...] normalised start positions (hip centre).
    Each frame, a window around each target's last position is cropped, upscaled and searched; the pose whose
    hips are nearest the last position wins (within `jump` of the frame width), otherwise the frame is missing."""
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision
    det = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=str(MODEL)), running_mode=vision.RunningMode.IMAGE, num_poses=3,
        min_pose_detection_confidence=0.3))
    cap = cv2.VideoCapture(str(video))
    W, H = cap.get(3), cap.get(4)
    last = [np.array([x * W, y * H]) for x, y in seeds]
    tracks = [[] for _ in seeds]
    for k in range(int((end - start) * fps_out)):
        cap.set(cv2.CAP_PROP_POS_MSEC, (start + k / fps_out) * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        for j, c in enumerate(last):
            ww = int(W * win_w)
            x0 = int(np.clip(c[0] - ww / 2, 0, W - ww))
            crop = cv2.resize(fr[:, x0:x0 + ww], None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
            r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)))
            best, bd = None, W * jump
            for lm in r.pose_landmarks:
                a = np.array([[x0 + p.x * ww, p.y * H, p.visibility] for p in lm])
                d = np.linalg.norm((a[23, :2] + a[24, :2]) / 2 - c)
                if d < bd:
                    best, bd = a, d
            tracks[j].append(best)
            if best is not None:
                last[j] = (best[23, :2] + best[24, :2]) / 2
    det.close()
    return tracks, W, H


def assign(frames, n):
    """Keep identities stable by hip-centre distance to each track's last position."""
    tracks = [[None] * len(frames) for _ in range(n)]
    last = [None] * n
    for i, ps in enumerate(frames):
        ps = sorted(ps, key=lambda p: (p[23, 0] + p[24, 0]) / 2)
        if all(l is None for l in last):
            for j, p in enumerate(ps[:n]):
                tracks[j][i], last[j] = p, (p[23, :2] + p[24, :2]) / 2
            continue
        used = set()
        for p in ps:
            c = (p[23, :2] + p[24, :2]) / 2
            j = min((j for j in range(n) if j not in used), key=lambda j: np.inf if last[j] is None else np.linalg.norm(last[j] - c), default=None)
            if j is None:
                continue
            used.add(j)
            tracks[j][i], last[j] = p, c
    return tracks


def good(p):
    """A detection is usable when the torso joints are confidently seen and the torso is roughly upright."""
    if p is None or min(p[i, 2] for i in (11, 12, 23, 24)) < 0.5:
        return False
    v = (p[11, :2] + p[12, :2]) / 2 - (p[23, :2] + p[24, :2]) / 2
    return abs(math.degrees(math.atan2(v[0], -v[1]))) < 70


def fill(track, hold=12):
    """Interpolate short gaps; across long gaps (scene cuts, occlusion) hold the last good pose instead of
    inventing motion. Returns an (F, 33, 3) array or None when the person is barely seen."""
    ok = [good(p) for p in track]
    idx = [i for i, g in enumerate(ok) if g]
    if len(idx) < max(5, len(track) * 0.3):
        return None
    arr = np.zeros((len(track), 33, 3))
    for d in range(3):
        for j in range(33):
            arr[:, j, d] = np.interp(np.arange(len(track)), idx, [track[i][j, d] for i in idx])
    for a, b in zip(idx, idx[1:]):  # long gap: freeze on the frame before it
        if b - a > hold:
            arr[a + 1:b] = arr[a]
    return arr


def smooth(x, w=9):
    x = np.asarray(x, dtype=float)
    w = min(w, len(x) - (1 - len(x) % 2))
    return savgol_filter(x, w, 2) if w >= 5 else x


def to_rig(a):
    """(F, 33, 3) landmarks -> per-frame rig controls."""
    mid = lambda i, j: (a[:, i, :2] + a[:, j, :2]) / 2  # noqa: E731
    hip, sh = mid(23, 24), mid(11, 12)
    torso_px = np.median(np.linalg.norm(sh - hip, axis=1))
    s = LS / torso_px  # pixels -> rig units
    V = lambda i, j: a[:, j, :2] - a[:, i, :2]  # noqa: E731
    lean = np.array([math.degrees(math.atan2(v[0], -v[1])) for v in (sh - hip)])  # torso up-vector; rig lean + = top toward screen-right
    hip_tilt = np.array([math.degrees(math.atan2(v[1], v[0])) for v in V(24, 23)])  # dancer's right hip (screen-left) -> left hip
    sh_tilt = np.array([math.degrees(math.atan2(v[1], v[0])) for v in V(12, 11)])
    rel = sh_tilt - lean  # shoulder line relative to the torso: + = screen-left shoulder higher
    # arms: screen-left arm = dancer's right (12, 14, 16)
    def arm(s_, e_, w_):
        up = np.array([ang(*v) for v in V(s_, e_)]) - lean
        lo = np.array([ang(*v) for v in V(e_, w_)]) - lean
        return up, lo - up
    def leg(h_, k_, a_):
        th = np.array([ang(*v) for v in V(h_, k_)])
        sh_ = np.array([ang(*v) for v in V(k_, a_)])
        return th, sh_ - th
    aLu, aLe = arm(12, 14, 16)
    aRu, aRe = arm(11, 13, 15)
    lLt, lLk = leg(24, 26, 28)
    lRt, lRk = leg(23, 25, 27)
    ears = V(8, 7)
    tilt = np.array([math.degrees(math.atan2(v[1], v[0])) for v in ears]) - lean
    ear_mid = mid(7, 8)
    turn = np.clip((a[:, 0, 0] - ear_mid[:, 0]) / (np.linalg.norm(ears, axis=1) * 0.5 + 1e-6), -1, 1)
    x = (hip[:, 0] - hip[0, 0]) * s
    ch = lambda v: smooth(np.degrees(np.unwrap(np.radians(v))))  # noqa: E731
    out = {k: ch(v) for k, v in dict(lean=lean, hipTilt=hip_tilt, rel=rel, aLu=aLu, aLe=aLe, aRu=aRu, aRe=aRe, lLt=lLt, lLk=lLk, lRt=lRt, lRk=lRk, tilt=tilt).items()}
    out["turn"], out["x"] = smooth(turn), smooth(x)
    # pelvis height: lower ankle on the floor (rig hip sits at -410 + hipY; ankle at hip + leg drop; floor ankle = -15)
    drop = lambda t, k: L1 * np.cos(np.radians(t)) + L2 * np.cos(np.radians(t + k))  # noqa: E731
    lowest = np.maximum(drop(out["lLt"], out["lLk"]), drop(out["lRt"], out["lRk"]))
    out["hipY"] = smooth(395 - lowest)
    return out


def poses(o):
    F = len(o["lean"])
    res = []
    for i in range(F):
        rel = float(o["rel"][i])
        res.append({
            "still": True, "hipY": round(float(o["hipY"][i]), 1), "lean": round(float(o["lean"][i]), 1),
            "hipTilt": round(float(np.clip(o["hipTilt"][i], -20, 20)), 1), "bend": 0,
            "shrugL": round(float(np.clip(rel / 25, -0.4, 1)), 2), "shrugR": round(float(np.clip(-rel / 25, -0.4, 1)), 2),
            "armL": [round(float(o["aLu"][i]), 1), round(float(o["aLe"][i]), 1)], "armR": [round(float(o["aRu"][i]), 1), round(float(o["aRe"][i]), 1)],
            "legL": [round(float(o["lLt"][i]), 1), round(float(o["lLk"][i]), 1)], "legR": [round(float(o["lRt"][i]), 1), round(float(o["lRk"][i]), 1)],
            "tilt": round(float(np.clip(o["tilt"][i], -30, 30)), 1), "turn": round(float(o["turn"][i]) * 0.5, 2),
            "smile": 0.5, "mw": 0.6, "handL": "open", "handR": "open",
        })
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--start", type=float, default=0)
    ap.add_argument("--end", type=float, required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--people", type=int, default=1)
    ap.add_argument("--follow", help='follow dancers from normalised hip positions, e.g. "0.5,0.7;0.33,0.75"')
    a = ap.parse_args()
    if a.follow:
        seeds = [tuple(float(v) for v in s_.split(",")) for s_ in a.follow.split(";")]
        raw, W, H = detect_follow(a.video, a.start, a.end, seeds)
        frames = raw[0]
    else:
        frames, W, H = detect(a.video, a.start, a.end, a.people)
        raw = assign(frames, a.people)
    tracks = []
    for tr in raw:
        arr = fill(tr)
        if arr is None:
            continue
        o = to_rig(arr)
        tracks.append({"x": [round(float(v), 1) for v in o["x"]], "poses": poses(o), "found": sum(good(p) for p in tr)})
    out = ROOT / "video/src/reel/mocap" / f"{a.name}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"fps": 30, "frames": len(frames), "src": {"w": W, "h": H}, "tracks": tracks}))
    clip = ROOT / "video/public/mocap" / f"{a.name}.mp4"
    clip.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(FF / "ffmpeg"), "-y", "-loglevel", "error", "-ss", str(a.start), "-t", str(a.end - a.start), "-i", a.video, "-an", "-r", "30", "-c:v", "libx264", "-crf", "24", str(clip)],
                   check=True, env=dict(os.environ, LD_LIBRARY_PATH=str(FF)))
    print(out, len(frames), "frames,", len(tracks), "tracks", [t["found"] for t in tracks])


if __name__ == "__main__":
    main()
