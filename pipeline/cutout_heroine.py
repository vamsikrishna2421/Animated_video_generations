"""Cut the Sol-generated heroine (user-supplied art) into puppet layers for 2D cutout animation.

  python3 pipeline/cutout_heroine.py   ->  video/public/yesh/sol/{skirt,upper,head,armL_up,armL_lo,armR_up,armR_lo}.png

All layers keep the source canvas (800 x 1024 crop of the left half), so the joint pivots below are shared with
the renderer (video/src/reel/SolHeroine.tsx). Arms are cut as capsules along the bones; the holes they leave in the
body are inpainted so nothing shows through when an arm swings away. The head is cut above the neck, the upper
body above the waist, and the skirt below it, with overlap bands so rotations never open seams.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/root/.claude/uploads/7ea2d19a-71c8-572f-b129-56653959cecf/597597d4-image.png")
OUT = ROOT / "video/public/yesh/sol"

# joints in source pixels (full-image coordinates; the crop starts at x = 0)
J = {
    "neck": (497, 214), "waist": (500, 442),
    "shL": (366, 312), "elL": (316, 425), "wrL": (287, 512), "tipL": (240, 590),
    "shR": (598, 314), "elR": (640, 422), "wrR": (662, 505), "tipR": (702, 585),
}


def capsule(mask, a, b, r):
    cv2.line(mask, tuple(map(int, a)), tuple(map(int, b)), 255, int(2 * r))
    cv2.circle(mask, tuple(map(int, a)), int(r), 255, -1)
    cv2.circle(mask, tuple(map(int, b)), int(r), 255, -1)


def main():
    im = np.array(Image.open(SRC).convert("RGBA"))[:, :800]
    H, W = im.shape[:2]
    alpha = im[:, :, 3] > 10
    layers = {}

    def take(mask):
        m = (mask > 0) & alpha
        out = np.zeros_like(im)
        out[m] = im[m]
        return out, m

    arm_masks = {}
    for s in "LR":
        up = np.zeros((H, W), np.uint8)
        lo = np.zeros((H, W), np.uint8)
        capsule(up, J["sh" + s], J["el" + s], 37)
        capsule(lo, J["el" + s], J["wr" + s], 36)
        capsule(lo, J["wr" + s], J["tip" + s], 46)
        layers["arm%s_up" % s], mu = take(up)
        layers["arm%s_lo" % s], ml = take(lo)
        arm_masks[s] = mu | ml

    # body without arms: fill only the holes that lie *inside* the body (between the outermost remaining body
    # pixels on that row), e.g. braid and waist hidden behind the arms; everything else becomes transparent
    body = im.copy()
    hole = arm_masks["L"] | arm_masks["R"]
    rest = alpha & ~hole
    fill = np.zeros_like(hole)
    for y in range(H):
        xs = np.where(rest[y])[0]
        if len(xs) > 1:
            fill[y, xs[0]:xs[-1] + 1] = hole[y, xs[0]:xs[-1] + 1]
    rgb = cv2.inpaint(np.ascontiguousarray(body[:, :, :3]), (fill * 255).astype(np.uint8), 9, cv2.INPAINT_TELEA)
    body[:, :, :3] = rgb
    body[hole & ~fill] = 0
    body[fill, 3] = 255

    # head: everything above the neck cut line, inside a box around the face (the braid stays on the body)
    head = np.zeros((H, W), np.uint8)
    cv2.ellipse(head, (500, 128), (118, 118), 0, 0, 360, 255, -1)
    cv2.rectangle(head, (470, 150), (530, 232), 255, -1)  # neck overlap band
    layers["head"], _ = take(head)
    layers["head"][:, :, :3] = np.where(layers["head"][:, :, 3:] > 0, im[:, :, :3], 0)

    yy = np.arange(H)[:, None]
    upper = body.copy()
    upper[(yy > J["waist"][1] + 22).repeat(W, 1)] = 0  # overlap band below the waist
    skirt = body.copy()
    skirt[(yy < J["waist"][1] - 18).repeat(W, 1)] = 0
    hm = np.zeros((H, W), np.uint8)  # the head lives only on its own layer (no ghost head when it tilts)
    cv2.ellipse(hm, (500, 128), (112, 112), 0, 0, 360, 255, -1)
    upper[(hm > 0) & (yy < 200).repeat(W, 1)] = 0
    layers["upper"], layers["skirt"] = upper, skirt

    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in layers.items():
        Image.fromarray(v).save(OUT / f"{k}.png", optimize=True)
    print("wrote", sorted(layers), "to", OUT)


# ---------- male lead (right half of the same sheet), with legs ----------
JM = {
    "neck": (1055, 195), "hipL": (990, 530), "hipR": (1112, 530), "knL": (955, 720), "knR": (1195, 720),
    "anL": (902, 895), "anR": (1268, 895), "toeL": (840, 975), "toeR": (1330, 975),
    "shL": (927, 250), "elL": (880, 420), "wrL": (832, 545), "tipL": (845, 612),
    "shR": (1188, 250), "elR": (1245, 415), "wrR": (1293, 540), "tipR": (1300, 605),
}


def male():
    im = np.array(Image.open(SRC).convert("RGBA"))
    H, W = im.shape[:2]
    im[:, :760] = 0
    alpha = im[:, :, 3] > 10
    L = {}

    def take(mask):
        m = (mask > 0) & alpha
        out = np.zeros_like(im)
        out[m] = im[m]
        return out, m

    used = np.zeros((H, W), bool)
    for s in "LR":
        up = np.zeros((H, W), np.uint8); lo = np.zeros((H, W), np.uint8)
        capsule(up, JM["sh" + s], JM["el" + s], 50)
        capsule(lo, JM["el" + s], JM["wr" + s], 40)
        capsule(lo, JM["wr" + s], JM["tip" + s], 48)
        L["arm%s_up" % s], a = take(up); L["arm%s_lo" % s], b = take(lo); used |= a | b
        th = np.zeros((H, W), np.uint8); sh = np.zeros((H, W), np.uint8)
        capsule(th, JM["hip" + s], JM["kn" + s], 62)
        capsule(sh, JM["kn" + s], JM["an" + s], 56)
        cv2.ellipse(sh, ((JM["an" + s][0] + JM["toe" + s][0]) // 2, 940), (90, 60), 0, 0, 360, 255, -1)
        L["leg%s_th" % s], a = take(th); L["leg%s_sh" % s], b = take(sh); used |= a | b
    # torso: whatever is left (jacket, shirt, neck), with the head cut out separately
    head = np.zeros((H, W), np.uint8)
    cv2.ellipse(head, (1055, 100), (118, 112), 0, 0, 360, 255, -1)
    cv2.rectangle(head, (1010, 150), (1100, 215), 255, -1)
    L["head"], hm = take(head)
    yy = np.arange(H)[:, None].repeat(W, 1)
    rest = alpha & ~used & (yy <= 560)
    rest = cv2.morphologyEx(rest.astype(np.uint8), cv2.MORPH_OPEN, np.ones((13, 13), np.uint8)) > 0  # drop slivers and halos
    n, lab, st, _ = cv2.connectedComponentsWithStats(rest.astype(np.uint8))
    rest = lab == (1 + np.argmax(st[1:, cv2.CC_STAT_AREA]))
    fill = np.zeros_like(rest)  # holes inside the torso (behind the arms) get painted in from the jacket
    for y in range(H):
        xs = np.where(rest[y])[0]
        if len(xs) > 1:
            fill[y, xs[0]:xs[-1] + 1] = ~rest[y, xs[0]:xs[-1] + 1]
    torso = im.copy()
    torso[:, :, :3] = cv2.inpaint(np.ascontiguousarray(im[:, :, :3]), (fill * 255).astype(np.uint8), 9, cv2.INPAINT_TELEA)
    keep = rest | fill
    torso[~keep] = 0
    torso[keep, 3] = 255
    torso[hm & (yy < 185)] = 0
    L["torso"] = torso
    out = ROOT / "video/public/yesh/solm"
    out.mkdir(parents=True, exist_ok=True)
    for k, v in L.items():
        Image.fromarray(v[:, 760:1440]).save(out / f"{k}.png", optimize=True)  # 680-wide canvas, x offset 760
    print("wrote", sorted(L), "to", out)


if __name__ == "__main__":
    main()
    male()
