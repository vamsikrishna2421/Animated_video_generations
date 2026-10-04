"""Motion capture from a reference video -> pose track for the Fumble rig (Mr. Fumble / Heroine).

  python3 pipeline/mocap.py <video> --start 10 --end 25 --name test [--person left|right|largest] [--people 2]

  -> video/src/reel/mocap/<name>.json   {fps, frames, tracks: [{x: [...], poses: [FPose...]}...]}
  -> video/public/mocap/<name>.mp4      the cut reference clip (for side-by-side checks only; never published)

Model (git-ignored, ~30 MB): curl -sSL -o pipeline/models/pose_landmarker_heavy.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
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
GRANULAR = True  # lighter smoothing: keeps sharp hits and small accents
MODEL = ROOT / "pipeline/models/pose_landmarker_heavy.task"  # offline: accuracy over speed
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


def look(fr, a):
    """Hue/saturation histogram of the torso-to-knee box: a cheap 'what are they wearing' signature."""
    pts = a[[11, 12, 23, 24, 25, 26], :2]
    x0, y0 = np.maximum(pts.min(0).astype(int), 0)
    x1, y1 = pts.max(0).astype(int)
    if x1 - x0 < 6 or y1 - y0 < 6:
        return None
    patch = cv2.cvtColor(fr[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([patch], [0, 1], None, [18, 8], [0, 180, 0, 256])
    return cv2.normalize(h, h).flatten()


def detect_follow(video, start, end, seeds, fps_out=30, win_w=0.42, up=2.5, jump=0.18, reseed=None):
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
    worlds = [[] for _ in seeds]  # MediaPipe 3D skeleton (metres, hip-centred) for the same detections
    app = [None] * len(seeds)  # clothing colour histogram per dancer
    reseed = sorted(reseed or [])  # [(time, [(x, y), ...]), ...]: re-point the targets after camera cuts
    for k in range(int((end - start) * fps_out)):
        t = start + k / fps_out
        while reseed and t >= reseed[0][0]:
            last = [np.array([x * W, y * H]) for x, y in reseed.pop(0)[1]]
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        # 1) gather candidate dancers around every target (retrying other zoom levels when a window comes up empty)
        cands = []  # (image landmarks, world landmarks, hip centre, clothing histogram)
        for c in last:
            for ww_k, up_k in ((win_w, up), (win_w * 0.7, up * 1.4), (min(0.9, win_w * 1.5), up * 0.8)):
                ww = int(W * ww_k)
                x0 = int(np.clip(c[0] - ww / 2, 0, W - ww))
                crop = cv2.resize(fr[:, x0:x0 + ww], None, fx=up_k, fy=up_k, interpolation=cv2.INTER_CUBIC)
                r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)))
                hit = False
                for li, lm in enumerate(r.pose_landmarks):
                    a_ = np.array([[x0 + p.x * ww, p.y * H, p.visibility] for p in lm])
                    hc = (a_[23, :2] + a_[24, :2]) / 2
                    hit |= np.linalg.norm(hc - c) < W * jump
                    if all(np.linalg.norm(hc - q[2]) > W * 0.03 for q in cands):
                        cands.append((a_, np.array([[q.x, q.y, q.z] for q in r.pose_world_landmarks[li]]), hc, look(fr, a_)))
                if hit:
                    break
        # 2) joint assignment: each target takes a distinct candidate; cost = distance moved + how unlike that
        #    target's outfit it looks, *relative* to the other target's outfit (robust to lighting changes per cut)
        n = len(last)
        def cost(j, ci):
            a_, _, hc, h = cands[ci]
            d = np.linalg.norm(hc - last[j]) / (W * jump)
            if d > 1:
                return np.inf
            if h is None or app[j] is None:
                return d
            mine = cv2.compareHist(app[j], h, cv2.HISTCMP_BHATTACHARYYA)
            others = [cv2.compareHist(app[o], h, cv2.HISTCMP_BHATTACHARYYA) for o in range(n) if o != j and app[o] is not None]
            if others and mine > min(others) + 0.04:
                return np.inf  # looks more like the other dancer
            return d + 2.0 * mine
        import itertools
        best_combo, best_cost = [None] * n, np.inf
        opts = list(range(len(cands))) + [None]
        for combo in itertools.product(opts, repeat=n):
            used = [c_ for c_ in combo if c_ is not None]
            if len(used) != len(set(used)):
                continue
            tot = sum(cost(j, c_) if c_ is not None else 1.2 for j, c_ in enumerate(combo))
            if tot < best_cost:
                best_combo, best_cost = list(combo), tot
        for j, ci in enumerate(best_combo):
            if ci is None:
                tracks[j].append(None)
                worlds[j].append(None)
                continue
            a_, wl_, hc, h = cands[ci]
            tracks[j].append(a_)
            worlds[j].append(wl_)
            last[j] = hc
            if app[j] is None and h is not None:
                app[j] = h  # remember this dancer's clothing colours from the first lock
    det.close()
    detect_follow.worlds = worlds  # 3D skeletons ride along without changing the return shape
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


def fill(track, hold=12, mask=None):
    """Interpolate short gaps; across long gaps (scene cuts, occlusion) hold the last good pose instead of
    inventing motion. Returns an (F, 33, 3) array or None when the person is barely seen."""
    ok = mask if mask is not None else [good(p) for p in track]
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


# ---------- landmark cleanup (before any angle is computed) ----------
PAIRS = [(11, 12), (13, 14), (15, 16), (17, 18), (19, 20), (21, 22), (23, 24), (25, 26), (27, 28), (29, 30), (31, 32)]
BONES = [(11, 13), (13, 15), (12, 14), (14, 16), (23, 25), (25, 27), (24, 26), (26, 28)]  # (parent, child)
# One Euro per joint: (min_cutoff Hz, beta). Torso calm, extremities keep their accents (research notes, item 1).
OE = {**{j: (0.9, 0.5) for j in (0, 2, 5, 7, 8, 9, 10, 11, 12, 23, 24)}, **{j: (1.2, 0.7) for j in (13, 14, 25, 26)},
      **{j: (1.8, 1.5) for j in (15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32)}}


def one_euro(x, fps=30.0, min_cutoff=1.0, beta=0.5, d_cutoff=1.0):
    """Speed-adaptive low-pass: heavy smoothing when a joint is slow (no shimmer), light when it moves fast (no lag)."""
    al = lambda fc: 1.0 / (1.0 + fps / (2 * math.pi * fc))  # noqa: E731
    y, dx = np.empty_like(x), 0.0
    y[0] = x[0]
    for i in range(1, len(x)):
        dx = dx + al(d_cutoff) * ((x[i] - x[i - 1]) * fps - dx)
        y[i] = y[i - 1] + al(min_cutoff + beta * abs(dx)) * (x[i] - y[i - 1])
    return y


def zero_phase(x, **kw):
    """Forward and backward passes averaged: no lag, so hits land where they happened."""
    return 0.5 * (one_euro(x, **kw) + one_euro(x[::-1], **kw)[::-1])


def hampel(x, w=3, k=3.0):
    """Indices that sit more than k robust sigmas from their 2w+1 rolling median (tracker spikes)."""
    bad = np.zeros(len(x), bool)
    for i in range(len(x)):
        seg = x[max(0, i - w): i + w + 1]
        med = np.median(seg)
        mad = 1.4826 * np.median(np.abs(seg - med)) + 1e-6
        bad[i] = abs(x[i] - med) > k * mad and abs(x[i] - med) > 0.04
    return bad


def clean(arr, shots, coords=2):
    """(F,33,>=2) landmarks -> left/right swaps fixed, spikes and limb snaps removed, then zero-phase One Euro.
    Works shot by shot so nothing is smoothed across a camera cut. Coordinates are normalised by torso length so the
    filter settings mean the same thing for wide and close shots."""
    a = arr.copy()
    F = len(a)
    for s0, s1 in zip(shots, list(shots[1:]) + [F]):
        seg = a[s0:s1]
        n = len(seg)
        if n < 6:
            continue
        torso = np.median(np.linalg.norm((seg[:, 11, :coords] + seg[:, 12, :coords]) / 2 - (seg[:, 23, :coords] + seg[:, 24, :coords]) / 2, axis=1)) + 1e-6
        for t in range(1, n):  # a pair whose members trade places for a frame is a tracker swap, not a dance move
            for i, j in PAIRS:
                keep = np.linalg.norm(seg[t, i, :coords] - seg[t - 1, i, :coords]) + np.linalg.norm(seg[t, j, :coords] - seg[t - 1, j, :coords])
                swap = np.linalg.norm(seg[t, j, :coords] - seg[t - 1, i, :coords]) + np.linalg.norm(seg[t, i, :coords] - seg[t - 1, j, :coords])
                if swap < 0.6 * keep:
                    seg[t, [i, j]] = seg[t, [j, i]]
        miss = np.zeros((n, 33), bool)
        for j in range(33):
            for d in range(coords):
                miss[:, j] |= hampel(seg[:, j, d] / torso)
        for p_, c_ in BONES:  # limb snapped to a wrong length: drop the child joint for that frame
            ln = np.linalg.norm(seg[:, c_, :coords] - seg[:, p_, :coords], axis=1)
            miss[:, c_] |= np.abs(ln - np.median(ln)) > 0.25 * np.median(ln) * 1.6  # foreshortening is real, so be lenient
        idx = np.arange(n)
        for j in range(33):
            ok = ~miss[:, j]
            if ok.sum() >= 2 and (~ok).any():
                for d in range(coords):
                    seg[:, j, d] = np.interp(idx, idx[ok], seg[ok, j, d])
            mc, b = OE.get(j, (1.2, 0.7))
            for d in range(coords):
                seg[:, j, d] = zero_phase(seg[:, j, d] / torso, min_cutoff=mc, beta=b) * torso
        a[s0:s1] = seg
    return a


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


def to_rig3d(img, world, shots, normalize=False):
    """Depth-aware retarget. img: (F,33,3) image landmarks (for stage position); world: (F,33,3) 3D skeleton.
    Each camera shot is turned so the dancer's average facing points at our audience (the film's angle changes
    every cut, ours should not); rotations inside a shot are kept. Bones are projected orthographically: angles
    come from the projection, foreshortening = projected / true length, and depth decides front/behind.
    Hybrid (default): limb directions come from the 2D image (the silhouette the audience actually sees; the 3D
    estimate is weakest on legs), while the 3D skeleton supplies only what 2D cannot know: foreshortening, which
    limb is in front, and chest-vs-hip twist. normalize=True turns each shot to face the camera (all-3D mode)."""
    F = len(world)
    W3 = world.copy()
    for a, b in (zip(shots, shots[1:] + [F]) if normalize else []):
        seg = W3[a:b]
        hv = seg[:, 23] - seg[:, 24]
        th = np.median(np.arctan2(hv[:, 2], hv[:, 0]))
        c, s_ = np.cos(th), np.sin(th)
        x, z = seg[..., 0].copy(), seg[..., 2].copy()
        seg[..., 0], seg[..., 2] = x * c + z * s_, -x * s_ + z * c
        W3[a:b] = seg
    mid = lambda i, j: (W3[:, i] + W3[:, j]) / 2  # noqa: E731
    P, S = mid(23, 24), mid(11, 12)
    deg = np.degrees
    IM = img[:, :, :2]
    def a2(v, i=None, j=None):
        if not normalize and i is not None:  # direction from the image silhouette
            d = IM[:, j] - IM[:, i]
            return np.array([ang(x, y) for x, y in d])
        return np.array([ang(x, y) for x, y in v[:, :2]])
    def sc(v, i=None, j=None):
        if not normalize and i is not None:
            # foreshortening measured in the picture: this segment's on-screen length vs its own longest length in
            # the clip (self-calibrating, no depth guess). Smoothed later.
            L = np.linalg.norm(IM[:, j] - IM[:, i], axis=1)
            return np.clip(L / (np.percentile(L, 92) + 1e-6), 0.5, 1.0)
        return np.clip(np.linalg.norm(v[:, :2], axis=1) / (np.linalg.norm(v, axis=1) + 1e-6), 0.3, 1.0)
    V = lambda i, j: W3[:, j] - W3[:, i]  # noqa: E731
    torso = S - P
    t2 = torso[:, :2] if normalize else (IM[:, 11] + IM[:, 12]) / 2 - (IM[:, 23] + IM[:, 24]) / 2
    lean = np.array([deg(math.atan2(x, -y)) for x, y in t2])
    yaw = lambda i, j: deg(np.arctan2((W3[:, i] - W3[:, j])[:, 2], (W3[:, i] - W3[:, j])[:, 0]))  # noqa: E731
    yp, yc, yh = yaw(23, 24), yaw(11, 12), yaw(7, 8)
    o = {}
    o["lean"] = lean
    o["spineS"] = sc(torso) if normalize else np.clip(np.linalg.norm((IM[:, 11] + IM[:, 12]) / 2 - (IM[:, 23] + IM[:, 24]) / 2, axis=1) / (np.percentile(np.linalg.norm((IM[:, 11] + IM[:, 12]) / 2 - (IM[:, 23] + IM[:, 24]) / 2, axis=1), 92) + 1e-6), 0.85, 1.0)
    V2 = (lambda i, j: IM[:, j] - IM[:, i]) if not normalize else (lambda i, j: V(i, j)[:, :2])  # noqa: E731
    o["hipTilt"] = np.array([deg(math.atan2(v[1], v[0])) for v in V2(24, 23)])
    o["rel"] = np.array([deg(math.atan2(v[1], v[0])) for v in V2(12, 11)]) - lean
    for nm, (s_, e_, w_, ix_) in {"aL": (12, 14, 16, 20), "aR": (11, 13, 15, 19)}.items():
        up, lo = a2(V(s_, e_), s_, e_) - lean, a2(V(e_, w_), e_, w_) - lean
        hand = a2(V(w_, ix_), w_, ix_) - lean
        o[nm + "w"] = np.clip((hand - lo + 180) % 360 - 180, -70, 70)  # wrist bend: hand direction vs forearm
        o[nm + "u"], o[nm + "e"] = up, lo - up
        o[nm + "s0"], o[nm + "s1"] = sc(V(s_, e_), s_, e_), sc(V(e_, w_), e_, w_)
        o[nm + "back"] = (W3[:, w_, 2] > S[:, 2] + 0.06).astype(float)
    for nm, (h_, k_, a_) in {"lL": (24, 26, 28), "lR": (23, 25, 27)}.items():
        th_, sh_ = a2(V(h_, k_), h_, k_), a2(V(k_, a_), k_, a_)
        o[nm + "t"], o[nm + "k"] = th_, sh_ - th_
        # legs stay full length: in a frontal dance they move mostly in the picture plane, and their measured
        # on-screen length is too noisy at low resolution to be worth trusting
        # thighs: a squat points them at the camera, so their on-screen shortening *is* the crouch depth;
        # shins stay full length (their measured length is mostly noise at low resolution)
        o[nm + "s0"], o[nm + "s1"] = (sc(V(h_, k_), h_, k_), sc(V(k_, a_), k_, a_)) if normalize else (np.clip(sc(V(h_, k_), h_, k_), 0.6, 1.0), np.ones(F))
    o["legLFront"] = (W3[:, 26, 2] < W3[:, 25, 2]).astype(float)
    for nm, (an_, he_, ft_) in {"tL": (28, 30, 32), "tR": (27, 29, 31)}.items():  # toe lift from heel -> toe tip
        d = IM[:, ft_] - IM[:, he_]
        o[nm] = np.clip(-np.degrees(np.arctan2(d[:, 1], np.abs(d[:, 0]) + 1e-6)), -40, 40)
    o["turn"] = np.clip(np.sin(np.radians(yh)) * 1.3, -1, 1)
    o["twist"] = np.clip(np.sin(np.radians(yc - yp)) * 1.6, -1, 1)
    o["bodyTurn"] = np.clip(np.sin(np.radians((yc + yp) / 2)), -1, 1)
    o["tilt"] = np.array([deg(math.atan2(v[1], v[0])) for v in V2(8, 7)]) - lean
    out = {}
    for k, v in o.items():
        v = np.degrees(np.unwrap(np.radians(v))) if k in ("lean", "hipTilt", "rel", "tilt") or k[-1] in "uetk" and k[:2] in ("aL", "aR", "lL", "lR") else v
        out[k] = smooth(medfilt(v, 5 if k.endswith("s0") else 3), 9 if k.endswith("s0") else (5 if GRANULAR else 7)) if not k.endswith("back") and k != "legLFront" else (medfilt(v, 5) > 0.5).astype(float)
    hip = (img[:, 23, :2] + img[:, 24, :2]) / 2
    s_px = LS / np.median(np.linalg.norm((img[:, 11, :2] + img[:, 12, :2]) / 2 - hip, axis=1))
    out["x"] = smooth((hip[:, 0] - hip[0, 0]) * s_px)
    drop = lambda t, k, s0, s1: L1 * s0 * np.cos(np.radians(t)) + L2 * s1 * np.cos(np.radians(t + k))  # noqa: E731
    out["hipY"] = smooth(395 - np.maximum(drop(out["lLt"], out["lLk"], out["lLs0"], out["lLs1"]), drop(out["lRt"], out["lRk"], out["lRs0"], out["lRs1"])))
    return out


def medfilt(v, k=3):
    from scipy.signal import medfilt as mf
    return mf(np.asarray(v, dtype=float), k) if len(v) >= k else v


def poses3d(o):
    r1 = lambda v: round(float(v), 1)  # noqa: E731
    r2 = lambda v: round(float(v), 2)  # noqa: E731
    for k in ("aLu", "aLe", "aRu", "aRe", "lLt", "lLk", "lRt", "lRk"):
        o[k] = (np.asarray(o[k]) + 180) % 360 - 180  # one turn only, so blends never spin a limb the long way round
    res = []
    for i in range(len(o["lean"])):
        rel = float(o["rel"][i])
        res.append({
            "still": True, "hipY": r1(o["hipY"][i]), "lean": r1(np.clip(o["lean"][i], -40, 40)), "spineS": r2(o["spineS"][i]),
            "hipTilt": r1(np.clip(o["hipTilt"][i], -20, 20)), "shrugL": r2(np.clip(rel / 25, -0.4, 1)), "shrugR": r2(np.clip(-rel / 25, -0.4, 1)),
            "turn": r2(o["turn"][i] * 0.8), "bodyTurn": r2(o["bodyTurn"][i] * 0.8), "twist": r2(o["twist"][i]), "tilt": r1(np.clip(o["tilt"][i], -30, 30)),
            "armL": [r1(o["aLu"][i]), r1(o["aLe"][i])], "armR": [r1(o["aRu"][i]), r1(o["aRe"][i])],
            "armLs": [r2(o["aLs0"][i]), r2(o["aLs1"][i])], "armRs": [r2(o["aRs0"][i]), r2(o["aRs1"][i])],
            "armLBack": bool(o["aLback"][i]), "armRBack": bool(o["aRback"][i]),
            "legL": [r1(o["lLt"][i]), r1(o["lLk"][i])], "legR": [r1(o["lRt"][i]), r1(o["lRk"][i])],
            "legLs": [r2(o["lLs0"][i]), r2(o["lLs1"][i])], "legRs": [r2(o["lRs0"][i]), r2(o["lRs1"][i])], "legLFront": bool(o["legLFront"][i]),
            "wristL": r1(o["aLw"][i]), "wristR": r1(o["aRw"][i]), "toeL": r1(o["tL"][i]), "toeR": r1(o["tR"][i]),
            "smile": 0.5, "mw": 0.6, "handL": "open", "handR": "open",
        })
    return res


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
    ap.add_argument("--flat", action="store_true", help="2D-only retarget (ignore the 3D skeleton)")
    ap.add_argument("--raw", action="store_true", help="skip landmark cleanup (old behaviour, for A/B checks)")
    ap.add_argument("--reseed", help='after cuts: "72.5=0.5,0.7;0.3,0.7|75.5=..." (same order as --follow)')
    a = ap.parse_args()
    if a.follow:
        seeds = [tuple(float(v) for v in s_.split(",")) for s_ in a.follow.split(";")]
        rs = [(float(b.split("=")[0]), [tuple(float(v) for v in q.split(",")) for q in b.split("=")[1].split(";")]) for b in a.reseed.split("|")] if a.reseed else None
        raw, W, H = detect_follow(a.video, a.start, a.end, seeds, reseed=rs)
        frames = raw[0]
    else:
        frames, W, H = detect(a.video, a.start, a.end, a.people)
        raw = assign(frames, a.people)
    tracks = []
    worlds = getattr(detect_follow, "worlds", None) if a.follow else None
    shots = [0] + ([int((t - a.start) * 30) for t, _ in rs] if a.follow and rs else [])
    for ti, tr in enumerate(raw):
        arr = fill(tr)
        if arr is not None and not a.raw:
            arr = clean(arr, [0] + ([int((t - a.start) * 30) for t, _ in rs] if a.follow and rs else []))
        if arr is None:  # keep the slot so track indices always match the --follow order
            tracks.append({"x": [], "poses": [], "found": sum(good(p) for p in tr)})
            continue
        if worlds is not None and not a.flat:
            mask = [good(p) for p in tr]
            wtr = [w if (w is not None and m) else None for w, m in zip(worlds[ti], mask)]
            warr = fill([np.c_[w, np.ones(33)] if w is not None else None for w in wtr], mask=[w is not None for w in wtr])[:, :, :3]
            if not a.raw:
                warr = clean(warr, shots, coords=3)
            o = to_rig3d(arr, warr, shots)
            tracks.append({"x": [round(float(v), 1) for v in o["x"]], "poses": poses3d(o), "found": sum(mask)})
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
