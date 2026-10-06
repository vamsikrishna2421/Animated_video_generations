"""Kingfisher in Blender (Cycles): the same code-built bird, rendered with real light.

  python3 pipeline/blender_kingfisher.py --still out/local/bk_test.png --frame 40 [--samples 64] [--res 0.5]
  python3 pipeline/blender_kingfisher.py --frames 1 120 --outdir out/local/bk_frames      # PNG sequence

What Blender adds over the three.js version: path-traced light (soft shadows, bounce light, true reflections),
a fur/feather coat grown as hair curves over the body (that soft "plush" look), depth of field, motion blur,
a physical Nishita sky, volumetric haze, and a transmissive water surface. Everything is still generated from code.
"""
import argparse
import math
import random
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector, Matrix, Euler

ROOT = Path(__file__).resolve().parent.parent
NO: set = set()
YES: set = set()
random.seed(26)

# ---------- palette (linear-ish sRGB; Blender converts) ----------
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1.0,)


def hexc(h):
    """Raw sRGB (0..1) for byte vertex colours: Blender linearises those itself."""
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


P = dict(orange=hexc("#e0661f"), orangeDeep=hexc("#b9480f"), orangeLight=hexc("#f39a4a"), white=hexc("#f6efe2"), buff=hexc("#f2dcc0"),
         crown=hexc("#1b5f9e"), crownBar=hexc("#6fc4f0"), malar=hexc("#1a5c96"), cyan=hexc("#18d0e6"), cyanDeep=hexc("#0aa2c4"),
         wing=hexc("#13708a"), wingDark=hexc("#0a3446"), wingSpot=hexc("#6cc9e8"), flight=hexc("#0c2f40"), tail=hexc("#143f78"),
         bill=hexc("#121214"), foot=hexc("#e2453a"))


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def h2(x, y):
    s = math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return s - math.floor(s)


# ---------- body: same spine + profile as the three.js model ----------
SPINE = [Vector(p) for p in [(0, 0.06, -0.22), (0, 0.01, -0.1), (0, -0.005, 0.04), (0, 0.05, 0.18), (0, 0.15, 0.34), (0, 0.2, 0.5), (0, 0.2, 0.635)]]
PROF = [(0, 0.045, 0.04), (0.06, 0.115, 0.1), (0.18, 0.175, 0.17), (0.35, 0.205, 0.21), (0.5, 0.195, 0.205), (0.62, 0.165, 0.18),
        (0.7, 0.145, 0.158), (0.78, 0.162, 0.166), (0.86, 0.16, 0.16), (0.93, 0.128, 0.12), (0.975, 0.075, 0.07), (1, 0.042, 0.042)]


def catmull(pts, u):
    n = len(pts) - 1
    x = u * n
    i = min(int(x), n - 1)
    t = x - i
    p0, p1, p2, p3 = pts[max(0, i - 1)], pts[i], pts[i + 1], pts[min(n, i + 2)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)


def prof_at(s):
    i = 0
    while i < len(PROF) - 2 and s > PROF[i + 1][0]:
        i += 1
    k0, k1, k2, k3 = PROF[max(0, i - 1)], PROF[i], PROF[i + 1], PROF[min(len(PROF) - 1, i + 2)]
    u = max(0, min(1, (s - k1[0]) / (k2[0] - k1[0])))
    cr = lambda a, b, c, d: 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u ** 3)  # noqa: E731
    return cr(k0[1], k1[1], k2[1], k3[1]), cr(k0[2], k1[2], k2[2], k3[2])


def body_color(s, th):
    top, side = math.sin(th), abs(math.cos(th))
    n = h2(round(s * 160), round(th * 30))
    c = mix(P["orange"], P["orangeDeep"], smooth(0.2, 0.9, side) * 0.5 + (n - 0.5) * 0.12)
    c = mix(c, P["orangeLight"], smooth(-0.6, -1, top) * 0.35)
    upper = smooth(-0.05, 0.3, top)
    if upper > 0:
        stripe = smooth(0.62, 0.86, top) * smooth(0.6, 0.1, s)
        u = mix(mix(P["wing"], P["cyan"], stripe), P["cyanDeep"], (n - 0.5) * 0.25)
        c = mix(c, u, upper)
    head = smooth(0.64, 0.7, s)
    if head > 0:
        h = c
        crown = smooth(0.2, 0.42, top)
        bar = (1 if math.sin(s * 210 + math.cos(th * 9) * 1.5) > 0.55 else 0) * (1 if n > 0.35 else 0)
        h = mix(h, mix(P["crown"], P["crownBar"], bar * 0.75), crown)
        face = smooth(0.52, 0.7, side) * smooth(-0.22, -0.05, top) * (1 - smooth(0.3, 0.45, top)) * smooth(0.74, 0.8, s)
        malar = smooth(0.45, 0.65, side) * smooth(-0.62, -0.42, top) * (1 - smooth(-0.24, -0.12, top)) * smooth(0.76, 0.82, s)
        throat = smooth(-0.55, -0.75, top) * smooth(0.76, 0.82, s)
        flash = smooth(0.5, 0.8, side) * (1 - smooth(0.55, 1.0, math.hypot((s - 0.735) / 0.045, (top - 0.17) / 0.2)))
        h = mix(h, P["orange"], face)
        h = mix(h, P["malar"], malar)
        h = mix(h, P["white"], throat)
        h = mix(h, P["buff"], flash)
        c = mix(c, h, head)
    return c


def sweep_mesh(name, rings, seg, colfn, cap=True):
    """rings: [(center Vector, rx, ry, s)] along a mostly +Z spine. Builds a smooth-shaded mesh with a 'Col' attribute."""
    bm = bmesh.new()
    verts = []
    for i, (c, rx, ry, s) in enumerate(rings):
        nx = rings[min(len(rings) - 1, i + 1)][0]
        pv = rings[max(0, i - 1)][0]
        fwd = (nx - pv).normalized()
        side = Vector((1, 0, 0))
        up = fwd.cross(side).normalized() * -1
        if up.y < 0:
            up = -up
        row = []
        for j in range(seg):
            th = j / seg * math.pi * 2
            p = c + side * math.cos(th) * rx + up * math.sin(th) * ry
            row.append((bm.verts.new((p.x, -p.z, p.y)), colfn(s, th)))  # three.js (x, y-up, z-fwd) -> Blender (x, -y fwd? z-up)
        verts.append(row)
    col = bm.loops.layers.color.new("Col")
    for i in range(len(rings) - 1):
        for j in range(seg):
            a, b = verts[i][j], verts[i][(j + 1) % seg]
            c2, d = verts[i + 1][(j + 1) % seg], verts[i + 1][j]
            f = bm.faces.new((a[0], d[0], c2[0], b[0]))
            for loop, src in zip(f.loops, (a, d, c2, b)):
                loop[col] = src[1]
    if cap:
        for end in (0, len(rings) - 1):
            ring = verts[end]
            f = bm.faces.new([v[0] for v in (ring if end else ring[::-1])])
            for loop in f.loops:
                loop[col] = ring[0][1]
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ---------- contour feathers: thousands of overlapping cards laid over the body surface ----------
def surf(s_, th):
    rx, ry = prof_at(s_)
    c = catmull(SPINE, s_)
    e = 1e-3
    fwd = (catmull(SPINE, min(1, s_ + e)) - catmull(SPINE, max(0, s_ - e))).normalized()
    side = Vector((1, 0, 0))
    up = fwd.cross(side).normalized() * -1
    if up.y < 0:
        up = -up
    return c + side * math.cos(th) * rx + up * math.sin(th) * ry


def to_bl(v):
    return Vector((v.x, -v.z, v.y))


EYES3 = [Vector((0.118, 0.232, 0.585)), Vector((-0.118, 0.232, 0.585))]


def plumage_cards(name="Plumage", rows=78, per=96):
    bm = bmesh.new()
    col = bm.loops.layers.color.new("Col")
    rng = random.Random(7)
    L_SEG, W_SEG = 4, 3
    for i in range(rows):
        for j in range(per):
            s_ = (i + rng.random() * 0.8) / rows * 0.965 + 0.02
            th = (j + (i % 2) * 0.5 + rng.random() * 0.4) / per * math.pi * 2
            p = surf(s_, th)
            if any((p - e).length < 0.034 for e in EYES3):
                continue
            # local frame: normal n, tangent t pointing to the tail, bitangent b
            ps, pt = surf(min(1, s_ + 0.004), th), surf(s_, th + 0.01)
            t = (surf(max(0, s_ - 0.004), th) - ps).normalized()
            b = (pt - p).normalized()
            n = t.cross(b).normalized()
            if n.dot(p - catmull(SPINE, s_)) < 0:
                n = -n
            head = smooth(0.66, 0.75, s_)
            size = (0.04 - 0.022 * head) * (0.88 + rng.random() * 0.24)
            L, W = size * 1.15, size
            base_c = body_color(s_, th)
            k = 0.97 + rng.random() * 0.06
            base_c = tuple(min(1, c * k) for c in base_c[:3]) + (1,)
            grid = []
            for a in range(L_SEG + 1):
                u = a / L_SEG
                w = W * (0.55 + 0.45 * math.sin(min(1, u * 1.3) * math.pi / 2)) * math.sqrt(max(0, 1 - max(0, (u - 0.6) / 0.4) ** 2))
                row = []
                for c_ in range(W_SEG + 1):
                    v = c_ / W_SEG * 2 - 1
                    lift = 0.0025 + 0.06 * L * u * u - 0.01 * L * v * v  # tips lie close to the body, barely cupped
                    q = p - t * (L * 0.25) + t * (u * L) + b * (v * w * 0.5) + n * lift
                    shade = 0.9 + 0.1 * smooth(0.0, 0.6, u)  # slightly darker base, lit tip
                    cc = tuple(x * shade for x in base_c[:3]) + (1,)
                    row.append((bm.verts.new(to_bl(q)), cc))
                grid.append(row)
            for a in range(L_SEG):
                for c_ in range(W_SEG):
                    vs = (grid[a][c_], grid[a + 1][c_], grid[a + 1][c_ + 1], grid[a][c_ + 1])
                    f = bm.faces.new([x[0] for x in vs])
                    for loop, src in zip(f.loops, vs):
                        loop[col] = src[1]
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ---------- materials ----------
def plumage_mat(name, rough=0.55, sheen=0.6, coat=0.15, bump=0.25):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Col"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Sheen Weight"].default_value = sheen
    bsdf.inputs["Sheen Roughness"].default_value = 0.35
    bsdf.inputs["Sheen Tint"].default_value = (0.4, 0.9, 1.0, 1)
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Subsurface Weight"].default_value = 0.05
    # feather micro-relief: voronoi scales -> bump
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 140
    vor.feature = "F1"
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    nt.links.new(vor.outputs["Distance"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def simple_mat(name, color, rough=0.4, metal=0.0, coat=0.0, trans=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Transmission Weight"].default_value = trans
    if emit:
        b.inputs["Emission Color"].default_value = emit[0]
        b.inputs["Emission Strength"].default_value = emit[1]
    return m


def hair_coat(ob, mat, count=90000, length=0.01):
    """Short feather/fur coat as a particle hair system, coloured from the body's vertex colours."""
    ps = ob.modifiers.new("coat", "PARTICLE_SYSTEM").particle_system
    st = ps.settings
    st.type = "HAIR"
    st.count = count
    st.hair_length = length
    st.use_advanced_hair = False
    st.child_type = "INTERPOLATED"
    st.child_percent = 3
    st.rendered_child_count = 6
    st.radius_scale = 0.01   # diameter scale (m)
    st.root_radius = 0.35
    st.tip_radius = 0.05
    st.effector_weights.gravity = 0.0
    # strand length/direction come from the emission velocity: short, leaning back along the body (+Y = tail)
    st.normal_factor = 0.004
    st.object_align_factor[1] = 0.009
    st.object_align_factor[2] = 0.001
    st.factor_random = 0.04
    st.material_slot = mat.name
    st.hair_length = length  # set last: changing hair modes resets it
    return ps


# ---------- bird ----------
def build_bird():
    col = bpy.data.collections.new("Kingfisher")
    bpy.context.scene.collection.children.link(col)
    lay = bpy.context.view_layer.layer_collection.children[col.name]
    bpy.context.view_layer.active_layer_collection = lay
    rig = bpy.data.objects.new("BirdRoot", None)
    col.objects.link(rig)
    rings = []
    for i in range(150):
        s = i / 149
        rx, ry = prof_at(s)
        rings.append((catmull(SPINE, s), rx, ry, s))
    body = sweep_mesh("Body", rings, 72, body_color)
    pm = plumage_mat("Plumage")
    body.data.materials.append(pm)
    hair_mat = plumage_mat("Coat", rough=0.65, sheen=0.8, coat=0.0, bump=0.0)
    body.data.materials.append(hair_mat)
    if "hair" in YES:
        hair_coat(body, hair_mat)
    if "cards" not in NO:
        cards = plumage_cards()
        cards.data.materials.append(plumage_mat("PlumeCards", rough=0.42, sheen=0.9, coat=0.25, bump=0.08))
        cards.parent = rig
    body.parent = rig
    # bill (two mandibles)
    billm = simple_mat("Bill", srgb("#121214"), rough=0.25, coat=0.7)
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
        b = sweep_mesh("BillLower" if lower else "BillUpper", br, 20, lambda s, th: P["bill"])
        b.data.materials.append(billm)
        b.parent = rig
    # eyes
    eyem = simple_mat("Eye", (0.003, 0.003, 0.004, 1), rough=0.03, coat=1.0)
    for sd in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, location=(0.118 * sd, -0.585, 0.232), segments=32, ring_count=16)
        e = bpy.context.active_object
        e.data.materials.append(eyem)
        bpy.ops.object.shade_smooth()
        e.parent = rig
    # wings: individual feathers (same layout idea as three.js), here posed for a glide / partial flap
    featm = plumage_mat("Feather", rough=0.5, sheen=0.7, coat=0.1, bump=0.15)
    wings = []
    for sd in (1, -1):
        w = build_wing(sd, featm, col)
        w.parent = rig
        w.location = (0.1 * sd, -0.13, 0.12)
        wings.append(w)
    # tail
    for i in range(10):
        u = i / 9 - 0.5
        f = feather_obj("Tail%d" % i, 0.27 - abs(u) * 0.06, 0.065, P["tail"], hexc("#0d2f5c"), featm)
        f.parent = rig
        f.location = (u * 0.07, 0.19, 0.05)
        f.rotation_euler = (0.05, 0, u * 1.0)
    return rig, wings


def feather_obj(name, length, width, base, tip, mat, spot=None):
    bm = bmesh.new()
    col = bm.loops.layers.color.new("Col")
    L, W = 12, 5
    grid = []
    for i in range(L + 1):
        u = i / L
        w = width * (0.25 + 0.75 * math.sin(min(1, u * 1.15) * math.pi * 0.5)) * math.sqrt(max(0, 1 - max(0, (u - 0.72) / 0.28) ** 2))
        row = []
        for j in range(W + 1):
            v = j / W * 2 - 1
            x = v * w * 0.5
            y = u * length  # feathers point along +Y (backward in Blender, since forward is -Y)
            z = 0.12 * length * u * u - abs(v) * width * 0.06
            c = mix(base, tip, smooth(0.45, 1, u))
            if abs(v) < 0.15:
                c = tuple(x_ * 0.7 for x_ in c[:3]) + (1,)
            if spot and abs(v) < 0.3 and 0.76 < u < 0.9:
                c = mix(c, spot, 0.7)
            row.append((bm.verts.new((x, y, z)), c))
        grid.append(row)
    for i in range(L):
        for j in range(W):
            vs = (grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])
            f = bm.faces.new([v[0] for v in vs])
            for loop, src in zip(f.loops, vs):
                loop[col] = src[1]
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    sol = ob.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = 0.002
    return ob


def build_wing(sd, mat, col):
    root = bpy.data.objects.new("Wing%d" % sd, None)
    col.objects.link(root)
    # glide pose: arm straight out along +/-X, feathers trailing back (+Y) and fanning outward at the hand
    def add(name, length, width, x, z, yaw, base, tip, spot=None):
        f = feather_obj(name, length, width, base, tip, mat, spot)
        f.parent = root
        f.location = (x * sd, 0, z)
        f.rotation_euler = (0, 0, -yaw * sd)
        return f
    for i in range(9):
        u = i / 8
        add("Sec%d" % i, 0.41 - u * 0.03, 0.1, 0.01 + u * 0.43, -0.004, -0.12 + u * 0.23, P["flight"], P["wingDark"])
    for i in range(9):
        u = i / 8
        add("GC%d" % i, 0.21, 0.085, 0.015 + u * 0.43, 0.012, -0.1 + u * 0.2, P["wing"], P["wing"])
    for row in range(2):
        for i in range(11):
            u = i / 10
            add("LC%d_%d" % (row, i), 0.11 - row * 0.015, 0.06, 0.02 + u * 0.42, 0.022 + row * 0.006, -0.15 + u * 0.23, P["wing"], P["wing"], P["wingSpot"] if h2(i * 3.1, row * 7.7) > 0.55 else None)
    for i in range(10):
        u = i / 9
        add("Pri%d" % i, 0.41 + u * 0.08 - u ** 3 * 0.08, 0.09, 0.45 + u * 0.16, -0.003, 0.2 + u * 0.8, P["flight"], P["wingDark"])
    for i in range(7):
        u = i / 6
        add("PC%d" % i, 0.18, 0.075, 0.46 + u * 0.14, 0.012, 0.25 + u * 0.65, P["wing"], P["wing"])
    return root


# ---------- world ----------
def build_world():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Sky")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "NISHITA"
    sky.sun_elevation = math.radians(5)
    sky.sun_rotation = math.radians(90)
    sky.altitude = 50
    sky.air_density = 1.2
    sky.dust_density = 3.0
    bg = nt.nodes["Background"]
    bg.inputs["Strength"].default_value = 0.35
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    # sun lamp matching the sky
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 4.0
    sun.angle = math.radians(1.2)
    sun.color = (1.0, 0.82, 0.62)
    so = bpy.data.objects.new("Sun", sun)
    sc.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(85), 0, math.radians(90 + 180)))
    # water: large plane, transmissive dark water with wave displacement (bump), true reflections from Cycles
    bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 0, 0))
    water = bpy.context.active_object
    wm = bpy.data.materials.new("Water")
    wm.use_nodes = True
    n = wm.node_tree
    b = n.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb("#0c2a2c")
    b.inputs["Roughness"].default_value = 0.03
    b.inputs["IOR"].default_value = 1.33
    b.inputs["Transmission Weight"].default_value = 0.6
    wave = n.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 6
    wave.inputs["Distortion"].default_value = 6
    wave.inputs["Detail"].default_value = 4
    noise = n.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40
    add = n.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    n.links.new(wave.outputs["Fac"], add.inputs[0])
    n.links.new(noise.outputs["Fac"], add.inputs[1])
    bp = n.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.08
    n.links.new(add.outputs[0], bp.inputs["Height"])
    n.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    water.data.materials.append(wm)
    # banks with reeds (hair particles on a ground strip), far tree silhouettes as soft cones
    for side in (1, -1):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, side * (11 + 40), -0.3))
        bank = bpy.context.active_object
        bank.scale = (600, 80, 1)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bank.data.materials.append(simple_mat("Bank%d" % side, srgb("#3a4420"), rough=0.95))
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, side * 12.5, -0.2))
        strip = bpy.context.active_object
        strip.scale = (300, 4, 1)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        reedm = simple_mat("Reed%d" % side, srgb("#8a8a3e"), rough=0.7)
        strip.data.materials.append(reedm)
        ps = strip.modifiers.new("reeds", "PARTICLE_SYSTEM").particle_system
        st = ps.settings
        st.type = "HAIR"
        st.count = 9000
        st.hair_length = 2.6
        st.radius_scale = 0.01
        st.root_radius = 2.0
        st.tip_radius = 0.3
        st.factor_random = 0.25
        st.use_advanced_hair = False
        st.length_random = 0.5
        st.material_slot = reedm.name
        st.hair_length = 2.6
    tm = simple_mat("Trees", srgb("#22301f"), rough=1)
    for i in range(240):
        side = 1 if random.random() > 0.5 else -1
        x, y = random.uniform(-250, 250), side * (45 + random.random() ** 0.8 * 180)
        hgt = random.uniform(18, 38)
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=hgt * 0.17, depth=hgt, location=(x, y, hgt / 2))
        bpy.context.active_object.data.materials.append(tm)
    if "haze" in NO:
        return water
    # volumetric haze in a big box (golden-hour atmosphere, light shafts)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 15))
    box = bpy.context.active_object
    box.scale = (500, 500, 32)
    vm = bpy.data.materials.new("Haze")
    vm.use_nodes = True
    vn = vm.node_tree
    vn.nodes.remove(vn.nodes["Principled BSDF"])
    vol = vn.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.004
    vol.inputs["Color"].default_value = (1.0, 0.85, 0.7, 1)
    vol.inputs["Anisotropy"].default_value = 0.6
    vn.links.new(vol.outputs["Volume"], vn.nodes["Material Output"].inputs["Volume"])
    box.data.materials.append(vm)
    return water


def setup_render(res, samples, out):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 6
    sc.cycles.volume_bounces = 1
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1920
    sc.render.resolution_percentage = int(res * 100)
    sc.render.use_motion_blur = True
    sc.render.fps = 30
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.render.filepath = str(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--still")
    ap.add_argument("--frame", type=int, default=1)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--res", type=float, default=0.5)
    ap.add_argument("--no", default="", help="comma list to disable: haze,cards,dof (diagnostics)")
    ap.add_argument("--yes", default="", help="comma list of optional extras: hair")
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    NO.update(x for x in a.no.split(",") if x)
    YES.update(x for x in a.yes.split(",") if x)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig, wings = build_bird()
    build_world()
    # hero framing: bird gliding low over the water, sun behind-left (rim light), shallow depth of field
    rig.location = (0, 0, 1.0)
    rig.rotation_euler = (0, 0, math.radians(-90))  # fly toward +X (toward the sun)
    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 70
    cam_d.dof.use_dof = "dof" not in NO
    cam_d.dof.focus_distance = 4.4
    cam_d.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("Cam", cam_d)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.location = (-2.2, -3.6, 1.35)
    direction = Vector((0, 0, 1.05)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    out = Path(a.still or "out/local/bk_test.png")
    if not out.is_absolute():
        out = ROOT / out
    out.parent.mkdir(parents=True, exist_ok=True)
    setup_render(a.res, a.samples, out)
    bpy.context.scene.frame_set(a.frame)
    import time
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"rendered {out} in {time.time() - t0:.1f} s")


if __name__ == "__main__":
    main()
