"""Kingfisher: the 30 s Blender (Cycles) film. Same choreography as the three.js reel, rendered with real light.

  python3 pipeline/blender_film.py --stills 1.2,4,9 --res 0.25 --samples 12     # check shots
  python3 pipeline/blender_film.py --render --res 0.6667 --samples 24          # all frames (resumable)

Frames go to out/local/bk_film/f####.png (existing frames are skipped, so a restart resumes).
The film is 24 fps x 30 s = 720 frames. Shots are authored in the three.js coordinate frame (x, y-up, z) and
converted to Blender (x, -z, y), so the timing and camera moves match the approved reel.
"""
import argparse
import math
import random
import sys
import time
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
import blender_kingfisher as bk  # noqa: E402

FPS, DUR = 24, 30.0
# Cycles + AgX reads the three.js palette darker: lift the structural blues and calm the orange
bk.P.update(cyan=bk.hexc("#2fe6f7"), cyanDeep=bk.hexc("#12b9dc"), wing=bk.hexc("#1a8fae"), crown=bk.hexc("#2277c4"),
            crownBar=bk.hexc("#8fdcff"), malar=bk.hexc("#2070b8"), orange=bk.hexc("#ef8a22"), orangeDeep=bk.hexc("#d96a16"), orangeLight=bk.hexc("#f6a94c"))
NFRAMES = int(FPS * DUR)
OUTDIR = ROOT / "out" / "local" / "bk_film"
C3 = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))  # three.js -> Blender


def B(v):
    return C3 @ Vector(v)


def V(x, y, z):
    return Vector((x, y, z))


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def lerp(a, b, t):
    return a + (b - a) * t


def clamp01(x):
    return max(0.0, min(1.0, x))


class CR:
    """THREE.CatmullRomCurve3 (uniform, open): parametric getPoint/getTangent."""

    def __init__(self, pts):
        self.p = [Vector(q) for q in pts]

    def point(self, t):
        p = self.p
        n = len(p)
        x = (n - 1) * t
        i = min(int(math.floor(x)), n - 2)
        w = x - i
        p0 = p[i - 1] if i > 0 else 2 * p[0] - p[1]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < n else 2 * p[n - 1] - p[n - 2]
        return 0.5 * ((2 * p1) + (-p0 + p2) * w + (2 * p0 - 5 * p1 + 4 * p2 - p3) * w * w + (-p0 + 3 * p1 - 3 * p2 + p3) * w ** 3)

    def tangent(self, t):
        d = 1e-4
        a, b = self.point(max(0, t - d)), self.point(min(1, t + d))
        return (b - a).normalized()


# ---------- scene constants (three.js frame) ----------
RIVER = 11
PERCH = V(-2, 3.05, 6.2)
IMPACT = V(3.5, 0, 0.5)
PERCH_DIR = V(0.15, 0, -1).normalized()
PERCH_BODY = PERCH + V(0, 0.21, 0)
HEADP = PERCH_BODY + V(0.02, 0.36, -0.42)
launch = CR([PERCH_BODY, V(-0.6, 2.2, 3.5), V(3, 1.0, 0.2), V(9, 0.65, -3), V(16, 0.6, -5.5)])
chaseX0, chaseSpeed = 16, 12
hover = V(IMPACT.x - 0.4, 5.6, IMPACT.z + 0.3)
climb = CR([V(IMPACT.x - 9, 1.6, -3), V(IMPACT.x - 4, 3.2, -1.2), V(IMPACT.x - 1.4, 5.0, 0), hover])
emerge = CR([IMPACT + V(0, -0.4, 0), IMPACT + V(-0.6, 1.4, 1.2), V(1.2, 2.7, 3.6), V(-0.8, 3.6, 5.2), PERCH_BODY + V(0.6, 1.1, 0.8)])


def pose(**o):
    d = dict(phase=0, amp=1, folded=0, glide=0, tailSpread=0.4, feetDown=0, billOpen=0, fish=False, lid=False, fishWiggle=0)
    d.update(o)
    return d


def perch_pose(**o):
    return pose(folded=1, amp=0, tailSpread=0.08, feetDown=1, **o)


# shot list: (t0, t1, fn(lt, d)) -> dict(pos, dir, roll, pitch, pose, cam, look, fov, fstop, visible, splashT)
def s_macro(lt, d):
    k = lt / d
    return dict(pos=PERCH_BODY, dir=PERCH_DIR, roll=0, pitch=0.42, pose=perch_pose(),
                cam=HEADP + V(lerp(1.15, 0.95, k), lerp(0.18, 0.12, k), lerp(-1.25, -0.95, k)), look=HEADP + V(0, -0.02, -0.05), fov=30, fstop=2.2)


def s_wide(lt, d):
    k = lt / d
    return dict(pos=PERCH_BODY, dir=PERCH_DIR, roll=0, pitch=0.42, pose=perch_pose(),
                cam=V(lerp(-15, -12.5, k), lerp(1.7, 2.1, k), lerp(-6.5, -5.2, k)), look=V(-0.5, 2.7, 3.5), fov=44, fstop=8)


def s_launch(lt, d):
    k = ease(lt / d * 0.98 + 0.02)
    pos, dr = launch.point(k), launch.tangent(k)
    unfold = clamp01(1 - lt / 0.45)
    return dict(pos=pos, dir=dr, roll=-0.35 * math.sin(k * math.pi), pitch=0, pose=pose(phase=(lt * 2.6) % 1, folded=unfold, feetDown=unfold, tailSpread=0.6),
                cam=pos + V(-1.8 - k * 1.5, 0.5, -3.6 + k * 0.6), look=pos + dr * 0.8, fov=40, fstop=4)


def s_chase(lt, d):
    x = chaseX0 + lt * chaseSpeed
    z = -6.2 + math.sin(lt * 0.9) * 1.6
    y = 0.62 + math.sin(lt * 2.3) * 0.08
    dz = math.cos(lt * 0.9) * 1.6 * 0.9 / chaseSpeed
    dr = V(1, 0, dz).normalized()
    pos = V(x, y, z)
    shake = V(math.sin(lt * 13) * 0.02, math.sin(lt * 17) * 0.02, 0)
    return dict(pos=pos, dir=dr, roll=-dz * 6, pitch=0, pose=pose(phase=(lt * 3.2) % 1, tailSpread=0.35),
                cam=pos + V(-3.4, 0.45, 1.5) + shake, look=pos + V(2.2, 0.1, -0.3), fov=48, fstop=4)


def s_orbit(lt, d):
    k = lt / d
    pos = V(chaseX0 + 3.5 * chaseSpeed + lt * 2.5, 1.1, -5.5)
    ang = lerp(2.5, 1.05, ease(k))
    return dict(pos=pos, dir=V(1, 0.04, 0), roll=0.12, pitch=0, pose=pose(phase=(lt * 0.95) % 1, tailSpread=0.55),
                cam=pos + V(math.cos(ang) * 3.7, lerp(1.3, 0.45, ease(k)), math.sin(ang) * 3.7), look=pos + V(0.15, 0.08, 0), fov=32, fstop=2.8)


def s_hover(lt, d):
    k = clamp01(lt / (d * 0.62))
    pos = climb.point(ease(k)) if k < 1 else hover + V(0, math.sin(lt * 9) * 0.03, 0)
    dr = climb.tangent(ease(k)) if k < 1 else V(0.3, 0, -1).normalized()
    hv = clamp01((lt - d * 0.55) / 0.3)
    return dict(pos=pos, dir=dr, roll=0, pitch=0.75 * hv, pose=pose(phase=(lt * (2.6 + hv * 1.6)) % 1, tailSpread=0.4 + hv * 0.5),
                cam=IMPACT + V(-14, 1.0, 3.5), look=pos + V(1.5, -1.2, 0), fov=34, fstop=5.6)


def s_dive(lt, d):
    k = clamp01(lt / d)
    pos = hover.lerp(IMPACT + V(0, 0.1, 0), k ** 1.8)
    tuck = clamp01(lt / 0.5)
    return dict(pos=pos, dir=V(0.25, -1, 0).normalized(), roll=0, pitch=0, pose=pose(phase=0.3, amp=1 - tuck, folded=tuck, glide=tuck, tailSpread=0.1, lid=k > 0.86),
                cam=V(pos.x - 0.6, max(0.5, pos.y + 0.4), pos.z + 3.4), look=pos.lerp(IMPACT, 0.2), fov=40, fstop=4)


def s_splash(lt, d):
    return dict(pos=IMPACT + V(0, -2, 0), dir=V(0, -1, 0), roll=0, pitch=0, pose=pose(folded=1), visible=False,
                cam=IMPACT + V(3.4 - lt * 0.3, 0.32, 3.2 - lt * 0.2), look=IMPACT + V(0, 0.9, 0), fov=40, fstop=4, splashT=lt * 0.42)


def s_emerge(lt, d):
    k = ease(clamp01(lt / d))
    pos, dr = emerge.point(k), emerge.tangent(k)
    op = clamp01(lt / 0.35)
    return dict(pos=pos, dir=dr, roll=0.2 * math.sin(k * 3), pitch=0, pose=pose(phase=(lt * 3) % 1, folded=1 - op, fish=True, fishWiggle=lt, tailSpread=0.6),
                cam=V(5.6, 1.5, 7.6), look=pos.lerp(V(0.75, 1.6, 3.2), 0.35), fov=46, fstop=4, splashT=1.05 + lt * 0.6)


def s_land(lt, d):
    land = clamp01(lt / 1.1)
    frm = PERCH_BODY + V(0.6, 1.1, 0.8)
    pos = frm.lerp(PERCH_BODY, ease(land))
    settle = clamp01((lt - 1.0) / 0.4)
    dr = PERCH_DIR.lerp(V(-0.6, 0, -1), 1 - ease(land)).normalized()
    return dict(pos=pos, dir=dr, roll=0, pitch=lerp(-0.2, 0.42, settle),
                pose=pose(phase=(lt * 3.4) % 1, amp=1 - settle, folded=settle, feetDown=clamp01(lt / 0.6), tailSpread=lerp(0.8, 0.08, settle), fish=True, fishWiggle=lt),
                cam=PERCH_BODY + V(-4.3, lerp(0.85, 0.55, ease(lt / 5)), lerp(-2.0, -1.0, ease(lt / 5))), look=PERCH_BODY + V(0, 0.2, -0.32), fov=36, fstop=2.8)


SHOTS = [(0, 2.5, s_macro), (2.5, 5.0, s_wide), (5.0, 7.5, s_launch), (7.5, 11.0, s_chase), (11.0, 14.0, s_orbit),
         (14.0, 16.0, s_hover), (16.0, 18.3, s_dive), (18.3, 20.5, s_splash), (20.5, 23.5, s_emerge), (23.5, 30.0, s_land)]
CUTS = [s[0] for s in SHOTS[1:]]


def frame_at(T):
    for t0, t1, fn in SHOTS:
        if t0 <= T < t1:
            return fn(T - t0, t1 - t0)
    t0, t1, fn = SHOTS[-1]
    return fn(min(T, t1) - t0, t1 - t0)


def orient3(dr, roll, pitch):
    z = dr.normalized()
    x = V(0, 1, 0).cross(z)
    if x.length < 1e-6:
        x = V(1, 0, 0)
    x.normalize()
    y = z.cross(x)
    M = Matrix((x, y, z)).transposed()
    M = M @ Matrix.Rotation(roll, 3, "Z") @ Matrix.Rotation(-pitch, 3, "X")
    return M


# ---------- flight pose (ported from bird.ts) ----------
def flap_pose(phase, amp=1, folded=0, glide=0):
    a = phase * math.pi * 2
    down = math.cos(a)
    up = max(0, math.sin(a))
    fly = dict(elev=(0.15 + 0.85 * down * amp) * (1 - glide) + 0.08 * glide, sweep=0.15 * math.sin(a) * amp,
               twist=(-0.15 + 0.35 * math.sin(a + 0.6)) * amp * (1 - glide), elbow=0.25 + up * 0.55 * amp * (1 - glide),
               wrist=0.15 + up * 0.8 * amp * (1 - glide), spread=1 - up * 0.45 * amp * (1 - glide), fold=0)
    fold = dict(elev=0.22, sweep=1.25, twist=-0.05, elbow=2.55, wrist=2.6, spread=0, fold=1)
    return {k: fly[k] + (fold[k] - fly[k]) * folded for k in fly}


def Rz(a):
    return Matrix.Rotation(a, 4, "Z")


def Ry(a):
    return Matrix.Rotation(a, 4, "Y")


def Rx(a):
    return Matrix.Rotation(a, 4, "X")


class Wing:
    def __init__(self, side, mat, col):
        self.side = side
        self.root = bpy.data.objects.new("WingRoot%d" % side, None)
        col.objects.link(self.root)
        self.shoulder = bpy.data.objects.new("Shoulder%d" % side, None)
        self.elbow = bpy.data.objects.new("Elbow%d" % side, None)
        self.wrist = bpy.data.objects.new("Wrist%d" % side, None)
        for o in (self.shoulder, self.elbow, self.wrist):
            col.objects.link(o)
            o.rotation_mode = "QUATERNION"
        self.shoulder.parent = self.root
        self.elbow.parent = self.shoulder
        self.elbow.location = B((0.2 * side, 0, 0))
        self.wrist.parent = self.elbow
        self.wrist.location = B((0.25 * side, 0, 0))
        self.feathers = []
        P = bk.P

        def add(parent, bone, length, width, x, y, z, baseYaw, spreadYaw, lift, t, base, tip, edge=None, spot=None):
            f = bk.feather_obj("F%d_%d" % (side, len(self.feathers)), length, width, base, tip, mat, spot)
            col.objects.link(f) if f.name not in col.objects else None
            f.parent = parent
            f.location = B((x * side, y, z))
            f.rotation_mode = "QUATERNION"
            self.feathers.append(dict(ob=f, bone=bone, t=t, baseYaw=baseYaw, spreadYaw=spreadYaw, lift=lift))

        for i in range(9):
            u = i / 8
            add(self.elbow, "arm", 0.41 - u * 0.03, 0.1, 0.01 + u * 0.23, -0.004, 0.0, -0.12 + u * 0.18, 0.05, 0, u, P["flight"], P["wingDark"])
        for i in range(9):
            u = i / 8
            add(self.elbow, "arm", 0.21, 0.085, 0.015 + u * 0.23, 0.012, 0.01, -0.1 + u * 0.16, 0.04, 0.01, u, P["wing"], P["wing"])
        for row in range(2):
            for i in range(11):
                u = i / 10
                spot = P["wingSpot"] if bk.h2(i * 3.1, row * 7.7) > 0.55 else None
                add(self.elbow if row else self.shoulder, "arm" if row else "sh", 0.11 - row * 0.015, 0.06,
                    (0.0 + u * 0.24) if row else (0.02 + u * 0.18), 0.022 + row * 0.006, 0.02 - row * 0.005, -0.15 + u * 0.2, 0.03, 0.015, u, P["wing"], P["wing"], spot=spot)
        for i in range(3):
            add(self.shoulder, "sh", 0.31, 0.09, 0.04 + i * 0.035, 0.006, -0.01, -0.35 + i * 0.08, 0.02, 0, i / 2, P["wing"], P["wingDark"])
        for i in range(10):
            u = i / 9
            add(self.wrist, "hand", 0.41 + u * 0.08 - u ** 3 * 0.08, 0.09, 0.005 + u * 0.16, -0.003 - u * 0.002, 0.0, 0.05 + u * 0.25, 0.55 * u + 0.15, 0, u, P["flight"], P["wingDark"])
        for i in range(7):
            u = i / 6
            add(self.wrist, "hand", 0.18, 0.075, 0.01 + u * 0.14, 0.012, 0.01, 0.1 + u * 0.25, 0.4 * u, 0.01, u, P["wing"], P["wing"])
        add(self.wrist, "hand", 0.09, 0.04, 0.0, 0.02, 0.03, -0.5, 0.0, 0.02, 0, P["wing"], P["wingDark"])

    def set(self, p):
        s = self.side
        self.shoulder.rotation_quaternion = (Rz(p["sweep"] * s) @ Ry(-p["elev"] * s) @ Rx(p["twist"])).to_quaternion()
        self.elbow.rotation_quaternion = Rz(-p["elbow"] * s).to_quaternion()
        self.wrist.rotation_quaternion = Rz(p["wrist"] * s).to_quaternion()
        total = dict(sh=p["sweep"], arm=p["sweep"] - p["elbow"], hand=p["sweep"] - p["elbow"] + p["wrist"])
        for f in self.feathers:
            ext = -(f["baseYaw"] * (0.4 + 0.6 * p["spread"]) + f["spreadYaw"] * p["spread"])
            fold = -total[f["bone"]] - 0.04 * f["t"]
            rot = ext + (fold - ext) * p["fold"]
            f["ob"].rotation_quaternion = (Rz(rot * s) @ Rx(-f["lift"])).to_quaternion()

    def objects(self):
        return [self.shoulder, self.elbow, self.wrist] + [f["ob"] for f in self.feathers]


def folded_shell(side, mat):
    """Feathered shell hugging the body (folded wing), ported from bird.ts foldedWingGeometry."""
    P = bk.P
    NZ, NA = 60, 22
    bm = bmesh.new()
    col = bm.loops.layers.color.new("Col")
    grid = []
    for i in range(NZ + 1):
        u = i / NZ
        z = 0.3 + (-0.5 - 0.3) * u
        best, sB = 9, 0
        for k in range(61):
            ss = k / 60
            dd = abs(bk.catmull(bk.SPINE, ss).z - z)
            if dd < best:
                best, sB = dd, ss
        c = bk.catmull(bk.SPINE, sB)
        rx, ry = bk.prof_at(sB)
        pad = 0.018 + 0.02 * math.sin(u * math.pi)
        beyond = max(0, (-0.22 - z) / 0.28)
        a0, a1 = -0.15 + beyond * 0.9, 1.25 - beyond * 0.1
        row = []
        for j in range(NA + 1):
            v = j / NA
            th = a0 + (a1 - a0) * v
            R = 1 - beyond * 0.75
            x = (math.cos(th) * (rx + pad) * R + beyond * 0.03) * side
            y = c.y + math.sin(th) * (ry + pad) * max(0.35, R) + beyond * 0.06
            n = bk.h2(round(u * 70), round(v * 30))
            cc = bk.mix(P["wing"], P["cyanDeep"], (n - 0.5) * 0.3)
            if u < 0.35 and v > 0.35 and n > 0.9:
                cc = bk.mix(cc, P["wingSpot"], 0.55)
            flight = bk.smooth(0.45, 0.6, u)
            scal = 0.5 + 0.5 * math.sin(v * 38 + u * 6)
            cc = bk.mix(cc, bk.mix(P["flight"], P["wingDark"], scal), flight)
            row.append((bm.verts.new(B((x, y, z))), cc))
        grid.append(row)
    for i in range(NZ):
        for j in range(NA):
            vs = (grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])
            f = bm.faces.new([q[0] for q in vs])
            for loop, src in zip(f.loops, vs):
                loop[col] = src[1]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("Folded%d" % side)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new("Folded%d" % side, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    return ob


def build_fish():
    bm = bmesh.new()
    prof = [(math.sin((i / 20) ** 0.8 * math.pi) * 0.035 * (1 - i / 20 * 0.4), i / 20 * 0.22 - 0.11) for i in range(21)]
    rings = []
    for r, y in prof:
        ring = []
        for j in range(16):
            a = j / 16 * math.pi * 2
            ring.append(bm.verts.new((math.cos(a) * r * 0.55, y, math.sin(a) * r)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for j in range(16):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % 16], rings[i + 1][(j + 1) % 16], rings[i + 1][j]))
    v0 = bm.verts.new((0, -0.11 - 0.05, 0.035))
    v1 = bm.verts.new((0, -0.11 - 0.05, -0.035))
    v2 = bm.verts.new((0, -0.105, 0))
    bm.faces.new((v0, v1, v2))
    me = bpy.data.meshes.new("Fish")
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new("Fish", me)
    bpy.context.collection.objects.link(ob)
    m = bk.simple_mat("FishSkin", bk.srgb("#c9d6dc"), rough=0.22, metal=0.85, coat=1.0)
    ob.data.materials.append(m)
    return ob


class Bird:
    def __init__(self):
        col = bpy.data.collections.new("Kingfisher")
        bpy.context.scene.collection.children.link(col)
        bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children[col.name]
        self.root = bpy.data.objects.new("BirdRoot", None)
        col.objects.link(self.root)
        self.root.rotation_mode = "QUATERNION"
        rings = [(bk.catmull(bk.SPINE, i / 149), *bk.prof_at(i / 149), i / 149) for i in range(150)]
        body = bk.sweep_mesh("Body", rings, 72, bk.body_color)
        body.data.materials.append(bk.plumage_mat("Plumage"))
        body.parent = self.root
        cards = bk.plumage_cards(rows=112, per=124)
        cards.data.materials.append(bk.plumage_mat("PlumeCards", rough=0.45, sheen=0.25, coat=0.3, bump=0.03))
        cards.parent = self.root
        billm = bk.simple_mat("Bill", bk.srgb("#121214"), rough=0.25, coat=0.7)
        self.lower = None
        for lower in (False, True):
            br = []
            base, tip = Vector((0, 0.196, 0.6)), Vector((0, 0.155, 0.95))
            for i in range(40):
                s = i / 39
                c = base.lerp(tip, s)
                c.y += math.sin(s * math.pi) * 0.012
                w = 0.05 * (1 - s) ** 1.05 + 0.0015
                h = 0.058 * (1 - s) ** 0.95 + 0.0015
                c.y += -h * 0.42 if lower else h * 0.42
                br.append((c, w, h * (0.5 if lower else 0.6), s))
            b = bk.sweep_mesh("BillLower" if lower else "BillUpper", br, 20, lambda s, th: bk.P["bill"])
            b.data.materials.append(billm)
            b.parent = self.root
            if lower:
                self.lower = b
        eyem = bk.simple_mat("Eye", (0.003, 0.003, 0.004, 1), rough=0.03, coat=1.0)
        lidm = bk.simple_mat("Lid", bk.srgb("#cfe2ea"), rough=0.3)
        self.lids = []
        for sd in (1, -1):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, location=B((0.118 * sd, 0.232, 0.585)), segments=32, ring_count=16)
            e = bpy.context.active_object
            e.data.materials.append(eyem)
            bpy.ops.object.shade_smooth()
            e.parent = self.root
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0258, location=B((0.118 * sd, 0.232, 0.585)), segments=24, ring_count=12)
            lid = bpy.context.active_object
            lid.data.materials.append(lidm)
            lid.parent = self.root
            lid.hide_render = True
            self.lids.append(lid)
        featm = bk.plumage_mat("Feather", rough=0.5, sheen=0.7, coat=0.1, bump=0.15)
        self.wings = []
        for sd in (1, -1):
            w = Wing(sd, featm, col)
            w.root.parent = self.root
            w.root.location = B((0.1 * sd, 0.12, 0.13))
            self.wings.append(w)
        foldm = bk.plumage_mat("FoldedWing", rough=0.5, sheen=0.7, coat=0.15, bump=0.2)
        self.shells = [folded_shell(sd, foldm) for sd in (1, -1)]
        for s in self.shells:
            s.parent = self.root
        self.tailroot = bpy.data.objects.new("TailRoot", None)
        col.objects.link(self.tailroot)
        self.tailroot.parent = self.root
        self.tailroot.location = B((0, 0.05, -0.19))
        self.tail = []
        for i in range(10):
            u = i / 9 - 0.5
            f = bk.feather_obj("Tail%d" % i, 0.27 - abs(u) * 0.06, 0.065, bk.P["tail"], bk.hexc("#0d2f5c"), featm)
            f.parent = self.tailroot
            f.location = B((u * 0.07, -abs(u) * 0.01, 0))
            f.rotation_mode = "QUATERNION"
            self.tail.append((f, u))
        footm = bk.simple_mat("Foot", bk.srgb("#e2453a"), rough=0.45, coat=0.4)
        self.feet = []
        for sd in (1, -1):
            g = bpy.data.objects.new("Foot%d" % sd, None)
            col.objects.link(g)
            g.parent = self.root
            g.location = B((0.05 * sd, -0.14, 0.05))
            g.rotation_mode = "QUATERNION"
            bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.06, location=(0, 0, -0.03))
            t = bpy.context.active_object
            t.data.materials.append(footm)
            t.parent = g
            for yaw, ln in ((0.25, 0.07), (0, 0.08), (-0.3, 0.06), (math.pi, 0.04)):
                bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=ln, location=(math.sin(yaw) * ln * 0.5, -math.cos(yaw) * ln * 0.5, -0.065), rotation=(math.pi / 2, 0, -yaw))
                toe = bpy.context.active_object
                toe.data.materials.append(footm)
                toe.parent = g
            self.feet.append(g)
        self.fish = build_fish()
        self.fish.parent = self.root
        self.fish.rotation_mode = "QUATERNION"
        self.fish.location = B((0, 0.12, 0.86))
        self.fish.scale = (1.6, 1.6, 1.6)

    def set(self, p):
        fp = flap_pose(p["phase"], p["amp"], p["folded"], p["glide"])
        shell = p["folded"] > 0.85
        for w in self.wings:
            w.set(fp)
            for o in w.objects():
                o.hide_render = shell
        for s in self.shells:
            s.hide_render = not shell
        for f, u in self.tail:
            f.rotation_quaternion = (Rz(u * 1.4 * p["tailSpread"]) @ Rx(0.05 + 0.1 * math.sin(p["phase"] * math.pi * 2) * p["amp"] * (1 - p["folded"]))).to_quaternion()
        for g in self.feet:
            g.rotation_quaternion = Rx(-1.25 * (1 - p["feetDown"])).to_quaternion()
        self.lower.rotation_euler = (p["billOpen"] * 0.35, 0, 0)
        self.fish.hide_render = not p["fish"]
        wig = p["fishWiggle"]
        # crosswise near the bill tip, angled to read from the side (three: rotation (0.25+.., 1.05, ..) XYZ)
        self.fish.rotation_quaternion = (Rx(0.25 + math.sin(wig * 12) * 0.08) @ Rz(1.05 + math.pi / 2) @ Ry(-math.sin(wig * 9) * 0.15)).to_quaternion()
        for lid in self.lids:
            lid.hide_render = not p["lid"]

    def animated(self):
        obs = [self.root, self.tailroot, self.fish] + self.feet + [f for f, _ in self.tail]
        for w in self.wings:
            obs += w.objects()
        return obs


# ---------- world ----------
def tree_mesh(name, seed):
    rnd = random.Random(seed)
    bm = bmesh.new()
    tiers = 9
    for k in range(tiers):
        u = k / tiers
        r = (1 - u) * 1.0 + 0.08
        h = 0.32
        z0 = 0.12 + u * 0.88
        ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=r, radius2=0.02, depth=h)
        for v in ret["verts"]:
            v.co.z += z0 + h / 2
            v.co.x += (rnd.random() - 0.5) * 0.06 * r
            v.co.y += (rnd.random() - 0.5) * 0.06 * r
            if v.co.z < z0 + 0.01:
                v.co.z -= rnd.random() * 0.06
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.05, radius2=0.03, depth=0.2)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def build_world():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Sky")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "NISHITA"
    sky.sun_elevation = math.radians(5)
    sky.sun_rotation = math.radians(SUN_ROT)
    sky.altitude = 30
    sky.air_density = 1.4
    sky.dust_density = 4.0
    sky.sun_size = math.radians(1.6)
    bg = nt.nodes["Background"]
    bg.inputs["Strength"].default_value = 0.32
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 4.5
    sun.angle = math.radians(1.5)
    sun.color = (1.0, 0.78, 0.55)
    so = bpy.data.objects.new("Sun", sun)
    sc.collection.objects.link(so)
    so.rotation_mode = "QUATERNION"
    so.rotation_quaternion = B((1, math.tan(math.radians(5)), 0)).normalized().to_track_quat("Z", "Y")
    # water
    bpy.ops.mesh.primitive_plane_add(size=900, location=(0, 0, 0))
    water = bpy.context.active_object
    wm = bpy.data.materials.new("Water")
    wm.use_nodes = True
    n = wm.node_tree
    b = n.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = bk.srgb("#0b2629")
    b.inputs["Roughness"].default_value = 0.02
    b.inputs["IOR"].default_value = 1.33
    b.inputs["Specular IOR Level"].default_value = 0.6
    tc = n.nodes.new("ShaderNodeTexCoord")
    mp = n.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1, 3, 1)
    n.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    wave = n.nodes.new("ShaderNodeTexNoise")
    wave.inputs["Scale"].default_value = 0.9
    wave.inputs["Detail"].default_value = 6
    n.links.new(mp.outputs["Vector"], wave.inputs["Vector"])
    bp = n.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.06
    bp.inputs["Distance"].default_value = 0.4
    n.links.new(wave.outputs["Fac"], bp.inputs["Height"])
    n.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    water.data.materials.append(wm)
    # banks, with reed beds along the water's edge
    bankm = bk.simple_mat("Bank", bk.srgb("#38431f"), rough=0.95)
    for side in (1, -1):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=200, y_subdivisions=40, size=1, location=B((0, -0.25, side * (RIVER + 60))))
        bank = bpy.context.active_object
        bank.scale = (900, 120, 1)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        for v in bank.data.vertices:
            gy = abs(v.co.y + bank.location.y) - RIVER  # distance inland (Blender y is -z_three)
            v.co.z += min(1, max(0, gy) / 6) * (1.0 + bk.h2(round(v.co.x / 9), round(v.co.y / 9)) * 2.5)
        bank.data.materials.append(bankm)
        bpy.ops.mesh.primitive_plane_add(size=1, location=B((0, -0.2, side * (RIVER + 1.6))))
        strip = bpy.context.active_object
        strip.scale = (330, 4.2, 1)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        reedm = bpy.data.materials.new("Reed%d" % side)
        reedm.use_nodes = True
        rn = reedm.node_tree
        rb = rn.nodes["Principled BSDF"]
        rb.inputs["Roughness"].default_value = 0.7
        hi = rn.nodes.new("ShaderNodeHairInfo")
        ramp = rn.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = bk.srgb("#4f5f22")
        ramp.color_ramp.elements[1].color = bk.srgb("#c4ab5c")
        rn.links.new(hi.outputs["Random"], ramp.inputs["Fac"])
        rn.links.new(ramp.outputs["Color"], rb.inputs["Base Color"])
        strip.data.materials.append(reedm)
        ps = strip.modifiers.new("reeds", "PARTICLE_SYSTEM").particle_system
        st = ps.settings
        st.type = "HAIR"
        st.count = 14000
        st.use_advanced_hair = False
        st.radius_scale = 0.01
        st.root_radius = 2.2
        st.tip_radius = 0.2
        st.length_random = 0.55
        st.material_slot = reedm.name
        st.hair_length = 3.0
    # tree lines: real conifer silhouettes (instanced), haze turns them blue-grey with distance
    trm = bk.simple_mat("Trees", bk.srgb("#1f2b1c"), rough=1)
    rnd = random.Random(5)
    meshes = [tree_mesh("Tree%d" % i, i) for i in range(6)]
    for m in meshes:
        m.materials.append(trm)
    for i in range(420):
        side = 1 if rnd.random() > 0.5 else -1
        x, z = rnd.uniform(-320, 320), side * (RIVER + 30 + rnd.random() ** 0.8 * 200)
        hgt = rnd.uniform(16, 36)
        ob = bpy.data.objects.new("T%d" % i, meshes[i % len(meshes)])
        bpy.context.collection.objects.link(ob)
        ob.location = B((x, -0.3, z))
        ob.scale = (hgt * 0.19, hgt * 0.19, hgt)
        ob.rotation_euler = (0, 0, rnd.random() * 6.28)
    # branch over the river
    pts = [V(-4, 1.0, 16), V(-3.2, 2.2, 11.5), V(-2.4, 2.85, 8.2), V(-2, 2.86, 6.2), V(-1.6, 2.75, 3.6)]
    cu = bpy.data.curves.new("Branch", "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        q = B(p)
        sp.points[i].co = (q.x, q.y, q.z, 1)
        sp.points[i].radius = 1.8 - i * 0.3
    sp.use_endpoint_u = True
    cu.bevel_depth = 0.13
    cu.bevel_resolution = 4
    br = bpy.data.objects.new("Branch", cu)
    bpy.context.collection.objects.link(br)
    barkm = bpy.data.materials.new("Bark")
    barkm.use_nodes = True
    bn = barkm.node_tree
    bb = bn.nodes["Principled BSDF"]
    bb.inputs["Base Color"].default_value = bk.srgb("#6b5238")
    bb.inputs["Roughness"].default_value = 0.9
    nz = bn.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 30
    nz.inputs["Detail"].default_value = 8
    bpb = bn.nodes.new("ShaderNodeBump")
    bpb.inputs["Strength"].default_value = 0.6
    bn.links.new(nz.outputs["Fac"], bpb.inputs["Height"])
    bn.links.new(bpb.outputs["Normal"], bb.inputs["Normal"])
    br.data.materials.append(barkm)
    # haze: a thin, sun-tinted volume (light shafts, depth) + low river mist
    for (h, dens, colr) in ((40, 0.0011, (1.0, 0.86, 0.72, 1)), (1.6, 0.012, (1.0, 0.93, 0.85, 1))):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, h / 2))
        box = bpy.context.active_object
        box.scale = (700, 700 if h > 5 else RIVER * 2, h)
        vm = bpy.data.materials.new("Haze%d" % h)
        vm.use_nodes = True
        vn = vm.node_tree
        vn.nodes.remove(vn.nodes["Principled BSDF"])
        vol = vn.nodes.new("ShaderNodeVolumePrincipled")
        vol.inputs["Density"].default_value = dens
        vol.inputs["Color"].default_value = colr
        vol.inputs["Anisotropy"].default_value = 0.65
        vn.links.new(vol.outputs["Volume"], vn.nodes["Material Output"].inputs["Volume"])
        box.data.materials.append(vm)
    return water


# ---------- splash ----------
class Splash:
    def __init__(self):
        self.mat = bk.simple_mat("Spray", bk.srgb("#ffffff"), rough=0.0, trans=1.0)
        self.ob = None
        r = random.Random(7)
        self.v = []
        for _ in range(160):
            a = r.random() * math.pi * 2
            up, out = 1.5 + r.random() ** 2 * 4.2, 0.6 + r.random() * 2.2
            self.v.append(V(math.cos(a) * out, up, math.sin(a) * out))
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1, depth=1, end_fill_type="NOTHING")
        self.crown = bpy.context.active_object
        self.crown.data.materials.append(bk.simple_mat("Crown", bk.srgb("#eef8ff"), rough=0.05, trans=0.95))
        self.rings = []
        for i in range(4):
            bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.0035, major_segments=128, minor_segments=5)
            t = bpy.context.active_object
            t.data.materials.append(bk.simple_mat("Ripple%d" % i, bk.srgb("#cfd8dc"), rough=0.08, metal=0.3))
            self.rings.append(t)

    def set(self, t):
        vis = -0.05 < t < 6
        if self.ob:
            me = self.ob.data
            bpy.data.objects.remove(self.ob, do_unlink=True)
            bpy.data.meshes.remove(me)
            self.ob = None
        for o in [self.crown] + self.rings:
            o.hide_render = not vis
        if not vis:
            return
        bm = bmesh.new()
        g = 9.8
        for i, v in enumerate(self.v):
            tt = max(0, t - (i % 5) * 0.03)
            p = V(v.x * tt, v.y * tt - 0.5 * g * tt * tt, v.z * tt)
            if tt <= 0 or p.y < -0.05:
                continue
            sc = 0.008 + (i % 7) * 0.0022
            ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=sc)
            stretch = 1 + min(3, abs(v.y - g * tt) * 0.35)
            for vv in ret["verts"]:
                q = B((IMPACT.x + p.x + vv.co.x, p.y + vv.co.z * stretch, IMPACT.z + p.z + vv.co.y))
                vv.co = q
        # crown: a ring of thin water fingers leaning outward, rising then collapsing
        ct = max(0, t)
        if ct < 1.0:
            hgt = math.sin(min(1, ct / 1.0) * math.pi) * 0.42
            r0 = 0.2 + ct * 0.9
            rr = random.Random(11)
            for k in range(120):
                a_ = k / 120 * math.pi * 2 + rr.random() * 0.04
                hk = hgt * (0.55 + rr.random() * 0.6)
                if hk < 0.02:
                    continue
                ret = bmesh.ops.create_cone(bm, cap_ends=False, segments=6, radius1=0.0065, radius2=0.0015, depth=hk)
                lean = 0.55 + rr.random() * 0.3
                for vv in ret["verts"]:
                    lx, ly, lz = vv.co.x, vv.co.y, vv.co.z + hk / 2  # 0..hk
                    rad = r0 + lz * math.sin(lean)
                    px = math.cos(a_) * rad + lx
                    pz = math.sin(a_) * rad + ly
                    vv.co = B((IMPACT.x + px, lz * math.cos(lean), IMPACT.z + pz))
                tip = B((IMPACT.x + math.cos(a_) * (r0 + hk * math.sin(lean)), hk * math.cos(lean) + 0.02, IMPACT.z + math.sin(a_) * (r0 + hk * math.sin(lean))))
                bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.011, matrix=Matrix.Translation(tip))
        me = bpy.data.meshes.new("Drops")
        bm.to_mesh(me)
        bm.free()
        self.ob = bpy.data.objects.new("Drops", me)
        bpy.context.collection.objects.link(self.ob)
        self.ob.data.materials.append(self.mat)
        ct = max(0, t)
        self.crown.hide_render = True
        for i, ring in enumerate(self.rings):
            rt = ct - i * 0.35
            ring.hide_render = rt <= 0 or rt > 3.5
            R = 0.4 + max(0, rt) * 2.6
            ring.location = B((IMPACT.x, 0.01, IMPACT.z))
            ring.scale = (R, R, 1)


# ---------- camera + render ----------
SUN_ROT = 90.0


def setup(res, samples):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 4
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 4
    sc.cycles.volume_bounces = 0
    sc.cycles.volume_step_rate = 4.0
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1920
    sc.render.resolution_percentage = max(1, int(round(res * 100)))
    sc.render.fps = FPS
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 95
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.view_settings.exposure = 0.15
    cam_d = bpy.data.cameras.new("Cam")
    cam_d.sensor_fit = "VERTICAL"
    cam_d.dof.use_dof = True
    cam = bpy.data.objects.new("Cam", cam_d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_mode = "QUATERNION"
    return cam


def apply(bird, splash, cam, T):
    F = frame_at(T)
    vis = F.get("visible", True) is not False
    for o in bird.root.children_recursive:
        if o.type == "MESH":
            o.hide_render = not vis
    if vis:
        bird.set(F["pose"])  # re-applies the per-pose visibility (wing rig vs folded shell, fish, lids)
    bird.root.location = B(F["pos"])
    M3 = orient3(F["dir"], F["roll"], F["pitch"])
    bird.root.rotation_quaternion = (C3 @ M3 @ C3.inverted()).to_quaternion()
    splash.set(F.get("splashT", -1))
    cp, lk = B(F["cam"]), B(F["look"])
    cam.location = cp
    cam.rotation_quaternion = (lk - cp).to_track_quat("-Z", "Y")
    cam.data.angle_y = math.radians(F["fov"])
    cam.data.dof.focus_distance = (lk - cp).length
    cam.data.dof.aperture_fstop = F["fstop"]
    return F


def key_all(objs, cam, frame):
    for o in objs + [cam]:
        o.keyframe_insert("location", frame=frame)
        o.keyframe_insert("rotation_quaternion", frame=frame)


def render_frame(bird, splash, cam, f, path):
    """Pose at f-1, f+1 (motion-blur keys, clamped inside the same shot) and f, then render."""
    sc = bpy.context.scene
    objs = bird.animated()
    for o in objs + [cam]:
        o.animation_data_clear()
    T = f / FPS
    shot_t0 = max([c for c in [0] + CUTS if c <= T])
    nxt = [c for c in CUTS if c > T]
    shot_t1 = nxt[0] if nxt else DUR
    for ff in (f - 1, f + 1, f):
        tt = min(max(ff / FPS, shot_t0), shot_t1 - 1e-4)  # no blur across a cut
        apply(bird, splash, cam, tt)
        key_all(objs, cam, ff)
    sc.frame_set(f)
    apply(bird, splash, cam, T)
    sc.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    global SUN_ROT
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", default="")
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--res", type=float, default=0.25)
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=NFRAMES - 1)
    ap.add_argument("--sunrot", type=float, default=90.0)
    ap.add_argument("--outdir", default=str(OUTDIR))
    a = ap.parse_args()
    SUN_ROT = a.sunrot
    bpy.ops.wm.read_factory_settings(use_empty=True)
    t0 = time.time()
    bird = Bird()
    build_world()
    splash = Splash()
    cam = setup(a.res, a.samples)
    print(f"scene built in {time.time() - t0:.0f} s", flush=True)
    out = Path(a.outdir)
    out.mkdir(parents=True, exist_ok=True)
    if a.stills:
        for s in a.stills.split(","):
            T = float(s)
            p = out / f"still_{T:05.2f}.jpg"
            t1 = time.time()
            render_frame(bird, splash, cam, int(round(T * FPS)), p)
            print(f"still {T} -> {p} ({time.time() - t1:.0f} s)", flush=True)
    if a.render:
        for f in range(a.start, a.end + 1):
            p = out / f"f{f:04d}.jpg"
            if p.exists() and p.stat().st_size > 0:
                continue
            t1 = time.time()
            tmp = out / f"tmp_{f:04d}.jpg"
            render_frame(bird, splash, cam, f, tmp)
            tmp.rename(p)
            print(f"frame {f} ({time.time() - t1:.0f} s)", flush=True)


if __name__ == "__main__":
    main()
