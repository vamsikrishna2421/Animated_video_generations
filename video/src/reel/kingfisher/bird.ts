import * as THREE from "three";

// Common kingfisher (Alcedo atthis), built from code: no imported models, no textures from disk.
// Units: body length ~1.0. Local frame: +Z forward (bill), +Y up, +X = bird's left.
// Plumage zones follow the real bird: cobalt crown with pale-blue bars, blue malar stripe, orange lores + ear
// coverts, white chin/throat and white neck flash, orange breast and belly, electric-cyan back stripe, blue-green
// wings with pale-blue covert spots, dark-blue tail, black dagger bill, coral-red feet.

const col = (h: string) => new THREE.Color(h);
const P = {
  orange: col("#e0661f"), orangeDeep: col("#b9480f"), orangeLight: col("#f39a4a"),
  white: col("#f6efe2"), buff: col("#f2dcc0"),
  crown: col("#1b5f9e"), crownBar: col("#6fc4f0"), malar: col("#1a5c96"),
  cyan: col("#18d0e6"), cyanDeep: col("#0aa2c4"),
  wing: col("#13708a"), wingDark: col("#0a3446"), wingSpot: col("#6cc9e8"), flight: col("#0c2f40"),
  tail: col("#143f78"), bill: col("#121214"), foot: col("#e2453a"),
};

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerpC = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, Math.max(0, Math.min(1, t)));

// ---------- procedural feather texture (bump + subtle colour breakup), drawn on a canvas ----------
let FEATHER_TEX: THREE.CanvasTexture | null = null;
export const featherTex = () => {
  if (FEATHER_TEX) return FEATHER_TEX;
  const N = 512, c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, N, N);
  // overlapping scale-like feather tips, rows offset like real contour feathers
  const rows = 22, cols = 16;
  for (let r = rows; r >= -1; r--) {
    for (let k = -1; k <= cols; k++) {
      const x = (k + (r % 2) * 0.5) * (N / cols), y = r * (N / rows);
      const w = N / cols * 0.62, h = N / rows * 1.15;
      const grd = g.createRadialGradient(x, y + h * 0.15, 1, x, y, w * 1.25);
      grd.addColorStop(0, "#b4b4b4");
      grd.addColorStop(0.75, "#8a8a8a");
      grd.addColorStop(1, "#505050");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      g.fill();
      // barbs
      g.strokeStyle = "rgba(60,60,60,0.25)";
      g.lineWidth = 1;
      for (let b = -4; b <= 4; b++) {
        g.beginPath();
        g.moveTo(x, y - h * 0.6);
        g.lineTo(x + b * w * 0.2, y + h * 0.7);
        g.stroke();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  FEATHER_TEX = t;
  return t;
};

// Plumage material: vertex colours + feather bump; structural-blue sheen and iridescence only where vBlue > 0.
export const plumage = (opts: { repeat?: [number, number]; bump?: number } = {}) => {
  const tex = featherTex().clone();
  tex.needsUpdate = true;
  tex.repeat.set(...(opts.repeat ?? [6, 10]));
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.62, metalness: 0, bumpMap: tex, bumpScale: opts.bump ?? 1.6,
    sheen: 0.45, sheenColor: col("#3fd8f0"), sheenRoughness: 0.4,
    iridescence: 0.25, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 420],
    clearcoat: 0.18, clearcoatRoughness: 0.55, side: THREE.DoubleSide,
  });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float blue;\nvarying float vBlue;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBlue = blue;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vBlue;")
      .replace("material.sheenColor = sheenColor;", "material.sheenColor = sheenColor * vBlue;")
      .replace("material.iridescence = iridescence;", "material.iridescence = iridescence * vBlue;");
  };
  return m;
};

// ---------- swept tube along a spine with elliptical rings ----------
type Ring = { c: THREE.Vector3; rx: number; ry: number };
const sweep = (rings: Ring[], seg: number, color: (s: number, th: number, p: THREE.Vector3) => [THREE.Color, number], capEnds = true) => {
  const pos: number[] = [], cl: number[] = [], bl: number[] = [], uv: number[] = [], idx: number[] = [];
  const n = rings.length;
  for (let i = 0; i < n; i++) {
    const r = rings[i];
    const nx = rings[Math.min(n - 1, i + 1)].c, pv = rings[Math.max(0, i - 1)].c;
    const fwd = nx.clone().sub(pv).normalize();
    const side = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(fwd, side).normalize().multiplyScalar(-1);
    if (up.y < 0) up.negate();
    const s = i / (n - 1);
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const p = r.c.clone().addScaledVector(side, Math.cos(th) * r.rx).addScaledVector(up, Math.sin(th) * r.ry);
      pos.push(p.x, p.y, p.z);
      const [c, b] = color(s, th, p);
      cl.push(c.r, c.g, c.b);
      bl.push(b);
      uv.push(j / seg, s);
    }
  }
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j, b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  if (capEnds) {
    for (const end of [0, n - 1]) {
      const ci = pos.length / 3, c = rings[end].c;
      pos.push(c.x, c.y, c.z);
      const cc = new THREE.Color(cl[end * (seg + 1) * 3], cl[end * (seg + 1) * 3 + 1], cl[end * (seg + 1) * 3 + 2]);
      cl.push(cc.r, cc.g, cc.b);
      bl.push(bl[end * (seg + 1)]);
      uv.push(0.5, end ? 1 : 0);
      for (let j = 0; j < seg; j++) {
        const a = end * (seg + 1) + j;
        if (end) idx.push(a, ci, a + 1);
        else idx.push(a + 1, ci, a);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
  g.setAttribute("blue", new THREE.Float32BufferAttribute(bl, 1));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

// body + head as ONE smooth surface (no seam at the neck)
const spine = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.06, -0.22), new THREE.Vector3(0, 0.01, -0.1), new THREE.Vector3(0, -0.005, 0.04),
  new THREE.Vector3(0, 0.05, 0.18), new THREE.Vector3(0, 0.15, 0.34), new THREE.Vector3(0, 0.2, 0.5), new THREE.Vector3(0, 0.2, 0.635),
]);
const prof: [number, number, number][] = [ // s, half-width, half-height
  [0, 0.045, 0.04], [0.06, 0.115, 0.1], [0.18, 0.175, 0.17], [0.35, 0.205, 0.21], [0.5, 0.195, 0.205], [0.62, 0.165, 0.18],
  [0.7, 0.145, 0.158], [0.78, 0.162, 0.166], [0.86, 0.16, 0.16], [0.93, 0.128, 0.12], [0.975, 0.075, 0.07], [1, 0.042, 0.042],
];
const profAt = (s: number) => {
  // Catmull-Rom through the profile keys: no flat steps, so the silhouette is one smooth curve
  let i = 0;
  while (i < prof.length - 2 && s > prof[i + 1][0]) i++;
  const k0 = prof[Math.max(0, i - 1)], k1 = prof[i], k2 = prof[i + 1], k3 = prof[Math.min(prof.length - 1, i + 2)];
  const u = Math.max(0, Math.min(1, (s - k1[0]) / (k2[0] - k1[0])));
  const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(k0[1], k1[1], k2[1], k3[1]), cr(k0[2], k1[2], k2[2], k3[2])];
};

export const EYE = { s: 0.885, pos: new THREE.Vector3(0.118, 0.232, 0.585) };

const bodyColor = (s: number, th: number): [THREE.Color, number] => {
  const top = Math.sin(th), side = Math.abs(Math.cos(th));
  const n = hash(Math.round(s * 160), Math.round(th * 30));
  // underside: orange, deeper on the flanks, lighter on the belly centre
  let c = lerpC(P.orange, P.orangeDeep, smooth(0.2, 0.9, side) * 0.5 + (n - 0.5) * 0.12);
  c = lerpC(c, P.orangeLight, smooth(-0.6, -1, top) * 0.35);
  let blue = 0;
  // upperparts
  const upper = smooth(-0.05, 0.3, top);
  if (upper > 0) {
    // back: electric cyan stripe along the midline, blue-green to the sides
    const stripe = smooth(0.62, 0.86, top) * smooth(0.6, 0.1, s);
    let u = lerpC(P.wing, P.cyan, stripe);
    u = lerpC(u, P.cyanDeep, (n - 0.5) * 0.25);
    c = lerpC(c, u, upper);
    blue = upper;
  }
  // head (s > 0.66)
  const head = smooth(0.64, 0.7, s);
  if (head > 0) {
    let h = c.clone(), hb = blue;
    const crown = smooth(0.2, 0.42, top);
    // crown: cobalt with pale-blue bars across it
    const bar = (Math.sin(s * 210 + Math.cos(th * 9) * 1.5) > 0.55 ? 1 : 0) * (n > 0.35 ? 1 : 0);
    const crownC = lerpC(P.crown, P.crownBar, bar * 0.75);
    // face band: orange lores / ear coverts on the sides, between eye-line and malar stripe
    const faceBand = smooth(0.52, 0.7, side) * smooth(-0.22, -0.05, top) * (1 - smooth(0.3, 0.45, top)) * smooth(0.74, 0.8, s);
    const malar = smooth(0.45, 0.65, side) * smooth(-0.62, -0.42, top) * (1 - smooth(-0.24, -0.12, top)) * smooth(0.76, 0.82, s);
    const throat = smooth(-0.55, -0.75, top) * smooth(0.76, 0.82, s);
    const neckFlash = smooth(0.5, 0.8, side) * (1 - smooth(0.55, 1.0, Math.hypot((s - 0.735) / 0.045, (top - 0.17) / 0.2)));
    h = lerpC(h, crownC, crown);
    hb = Math.max(hb, crown);
    h = lerpC(h, P.orange, faceBand);
    hb *= 1 - faceBand;
    h = lerpC(h, P.malar, malar);
    hb = Math.max(hb, malar * 0.8);
    h = lerpC(h, P.white, throat);
    hb *= 1 - throat;
    h = lerpC(h, P.buff, neckFlash);
    hb *= 1 - neckFlash;
    c = lerpC(c, h, head);
    blue = (blue * (1 - head) + hb * head) * (1 - smooth(0.93, 0.98, s));
  }
  return [c, blue];
};

export const bodyGeometry = () => {
  const N = 150, rings: Ring[] = [];
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const [rx, ry] = profAt(s);
    rings.push({ c: spine.getPoint(s), rx, ry });
  }
  return sweep(rings, 96, bodyColor);
};

// dagger bill: upper and lower mandible, so it can open
export const billGeometry = (lower: boolean) => {
  const base = new THREE.Vector3(0, 0.196, 0.6), tip = new THREE.Vector3(0, 0.155, 0.95);
  const N = 40, rings: Ring[] = [];
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1);
    const c = base.clone().lerp(tip, s);
    c.y += Math.sin(s * Math.PI) * 0.012; // slight culmen curve
    const w = 0.05 * Math.pow(1 - s, 1.05) + 0.0015, h = 0.058 * Math.pow(1 - s, 0.95) + 0.0015;
    c.y += lower ? -h * 0.42 : h * 0.42;
    rings.push({ c, rx: w, ry: h * (lower ? 0.5 : 0.6) });
  }
  return sweep(rings, 24, () => [lower ? col("#1b1416") : P.bill, 0]);
};

// ---------- a single feather: tapered vane with a rachis, gently curved ----------
export const featherGeometry = (len: number, wid: number, opts: { asym?: number; curl?: number; base: THREE.Color; tip: THREE.Color; edge?: THREE.Color; spot?: THREE.Color | null; blue?: number }) => {
  const segL = 14, segW = 6, pos: number[] = [], cl: number[] = [], bl: number[] = [], uv: number[] = [], idx: number[] = [];
  const asym = opts.asym ?? 0.35, curl = opts.curl ?? 0.15;
  for (let i = 0; i <= segL; i++) {
    const u = i / segL;
    // width profile: narrow quill, full vane, rounded tip
    const w = wid * (0.25 + 0.75 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.5)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - 0.72) / 0.28), 2)));
    for (let j = 0; j <= segW; j++) {
      const v = j / segW * 2 - 1; // -1 outer vane .. +1 inner vane
      const half = v < 0 ? w * (1 - asym) : w * (1 + asym * 0.4);
      const x = v * half * 0.5;
      const z = -u * len;
      const y = curl * len * u * u * 0.6 - Math.abs(v) * wid * 0.06; // curve down + slight cup
      pos.push(x, y, z);
      let c = lerpC(opts.base, opts.tip, smooth(0.45, 1, u));
      if (opts.edge) c = lerpC(c, opts.edge, smooth(0.75, 1, Math.abs(v)) * 0.6);
      if (Math.abs(v) < 0.12) c = c.clone().multiplyScalar(0.7); // rachis
      if (opts.spot && Math.abs(v) < 0.3 && u > 0.76 && u < 0.9) c = lerpC(c, opts.spot, 0.7);
      cl.push(c.r, c.g, c.b);
      bl.push(opts.blue ?? 1);
      uv.push((v + 1) / 2, u);
    }
  }
  for (let i = 0; i < segL; i++)
    for (let j = 0; j < segW; j++) {
      const a = i * (segW + 1) + j, b = a + segW + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
  g.setAttribute("blue", new THREE.Float32BufferAttribute(bl, 1));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

// ---------- wing rig ----------
type Feather = { mesh: THREE.Mesh; bone: "sh" | "arm" | "hand"; t: number; baseYaw: number; spreadYaw: number; lift: number };
export type Wing = { root: THREE.Group; shoulder: THREE.Group; elbow: THREE.Group; wrist: THREE.Group; feathers: Feather[]; side: 1 | -1 };

const buildWing = (side: 1 | -1, mat: THREE.Material): Wing => {
  const root = new THREE.Group();
  const shoulder = new THREE.Group(), elbow = new THREE.Group(), wrist = new THREE.Group();
  root.add(shoulder);
  shoulder.add(elbow);
  elbow.position.set(0.2 * side, 0, 0);
  elbow.add(wrist);
  wrist.position.set(0.25 * side, 0, 0);
  const feathers: Feather[] = [];
  const add = (parent: THREE.Group, bone: "sh" | "arm" | "hand", geo: THREE.BufferGeometry, x: number, y: number, z: number, baseYaw: number, spreadYaw: number, lift: number, t: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x * side, y, z);
    m.castShadow = true;
    parent.add(m);
    feathers.push({ mesh: m, bone, t, baseYaw, spreadYaw, lift });
  };
  // flesh of the arm (covered by marginal coverts): a soft tapered sweep
  // secondaries along the forearm (pointing back), then greater coverts on top, then lesser coverts with spots
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    add(elbow, "arm", featherGeometry(0.41 - u * 0.03, 0.1, { base: P.flight, tip: P.wingDark, edge: P.wing, curl: 0.12 }), 0.01 + u * 0.23, -0.004, 0.0, -0.12 + u * 0.18, 0.05, 0, u);
  }
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    add(elbow, "arm", featherGeometry(0.21, 0.085, { base: P.wing, tip: P.wing, edge: P.cyanDeep, curl: 0.1 }), 0.015 + u * 0.23, 0.012, 0.01, -0.1 + u * 0.16, 0.04, 0.01, u);
  }
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 11; i++) {
      const u = i / 10;
      add(row ? elbow : shoulder, row ? "arm" : "sh", featherGeometry(0.11 - row * 0.015, 0.06, { base: P.wing, tip: P.wing, spot: hash(i * 3.1, row * 7.7) > 0.55 ? P.wingSpot : null, curl: 0.08 }),
        row ? 0.0 + u * 0.24 : 0.02 + u * 0.18, 0.022 + row * 0.006, 0.02 - row * 0.005, -0.15 + u * 0.2, 0.03, 0.015, u);
    }
  // tertials near the body
  for (let i = 0; i < 3; i++) add(shoulder, "sh", featherGeometry(0.31, 0.09, { base: P.wing, tip: P.wingDark, curl: 0.1 }), 0.04 + i * 0.035, 0.006, -0.01, -0.35 + i * 0.08, 0.02, 0, i / 2);
  // primaries fanning off the hand
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    add(wrist, "hand", featherGeometry(0.41 + u * 0.08 - Math.pow(u, 3) * 0.08, 0.09, { base: P.flight, tip: P.wingDark, edge: P.wing, asym: 0.5, curl: 0.1 }),
      0.005 + u * 0.16, -0.003 - u * 0.002, 0.0, 0.05 + u * 0.25, 0.55 * u + 0.15, 0, u);
  }
  // primary coverts + alula
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    add(wrist, "hand", featherGeometry(0.18, 0.075, { base: P.wing, tip: P.wing, edge: P.cyanDeep }), 0.01 + u * 0.14, 0.012, 0.01, 0.1 + u * 0.25, 0.4 * u, 0.01, u);
  }
  add(wrist, "hand", featherGeometry(0.09, 0.04, { base: P.wing, tip: P.wingDark }), 0.0, 0.02, 0.03, -0.5, 0.0, 0.02, 0);
  return { root, shoulder, elbow, wrist, feathers, side };
};

export type WingPose = { elev: number; sweep: number; twist: number; elbow: number; wrist: number; spread: number; fold: number };
// Angles are written for the left wing (+X); the right wing mirrors them (Y and Z rotations flip sign).
// sweep > 0 swings the humerus back, elbow > 0 swings the forearm forward, wrist > 0 swings the hand back.
export const poseWing = (w: Wing, p: WingPose) => {
  const s = w.side;
  w.shoulder.rotation.set(p.twist, p.sweep * s, p.elev * s, "YZX");
  w.elbow.rotation.set(0, -p.elbow * s, 0);
  w.wrist.rotation.set(0, p.wrist * s, 0);
  const total = { sh: p.sweep, arm: p.sweep - p.elbow, hand: p.sweep - p.elbow + p.wrist };
  for (const f of w.feathers) {
    const ext = -(f.baseYaw * (0.4 + 0.6 * p.spread) + f.spreadYaw * p.spread); // negative = fans outward
    const fold = -total[f.bone] - 0.04 * f.t; // folded: feathers pivot to lie back along the body, slightly stacked
    const rot = ext + (fold - ext) * p.fold;
    f.mesh.rotation.set(-f.lift, rot * s, 0, "YXZ");
  }
};

// flight cycle, phase 0..1 (0 = top of upstroke), folded = 0..1, glide = 0..1
export const flapPose = (phase: number, amp = 1, folded = 0, glide = 0): WingPose => {
  const a = phase * Math.PI * 2;
  const down = Math.cos(a); // 1 top, -1 bottom
  const upstroke = Math.max(0, Math.sin(a)); // wing folding on the way up
  const fly: WingPose = {
    elev: (0.15 + 0.85 * down * amp) * (1 - glide) + 0.08 * glide,
    sweep: 0.15 * Math.sin(a) * amp,
    twist: (-0.15 + 0.35 * Math.sin(a + 0.6)) * amp * (1 - glide),
    elbow: 0.25 + upstroke * 0.55 * amp * (1 - glide),
    wrist: 0.15 + upstroke * 0.8 * amp * (1 - glide),
    spread: 1 - upstroke * 0.45 * amp * (1 - glide),
    fold: 0,
  };
  const fold: WingPose = { elev: 0.22, sweep: 1.25, twist: -0.05, elbow: 2.55, wrist: 2.6, spread: 0.0, fold: 1 };
  const k = folded;
  return {
    elev: fly.elev + (fold.elev - fly.elev) * k, sweep: fly.sweep + (fold.sweep - fly.sweep) * k, twist: fly.twist + (fold.twist - fly.twist) * k,
    elbow: fly.elbow + (fold.elbow - fly.elbow) * k, wrist: fly.wrist + (fold.wrist - fly.wrist) * k, spread: fly.spread + (fold.spread - fly.spread) * k,
    fold: k,
  };
};

// ---------- folded wing: a feathered shell that hugs the body side (used when perched / diving) ----------
export const foldedWingGeometry = (side: 1 | -1) => {
  const NZ = 60, NA = 22, pos: number[] = [], cl: number[] = [], bl: number[] = [], uv: number[] = [], idx: number[] = [];
  const z0 = 0.3, z1 = -0.5; // shoulder .. wing tip (crosses over the rump onto the tail base)
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ, z = z0 + (z1 - z0) * u;
    // body ring under this z (search the spine), padded outward
    let sB = 0, best = 9;
    for (let k = 0; k <= 60; k++) {
      const ss = k / 60, d = Math.abs(spine.getPoint(ss).z - z);
      if (d < best) { best = d; sB = ss; }
    }
    const c = spine.getPoint(sB);
    const [rx, ry] = profAt(sB);
    const pad = 0.018 + 0.02 * Math.sin(u * Math.PI);
    const beyond = Math.max(0, (-0.22 - z) / 0.28); // past the end of the body: taper to the tip
    const a0 = -0.15 + beyond * 0.9, a1 = 1.25 - beyond * 0.1; // angle band: flank .. near the back midline
    for (let j = 0; j <= NA; j++) {
      const v = j / NA, th = a0 + (a1 - a0) * v;
      const R = 1 - beyond * 0.75;
      const x = (Math.cos(th) * (rx + pad) * R + beyond * 0.03) * side;
      const y = c.y + Math.sin(th) * (ry + pad) * Math.max(0.35, R) + beyond * 0.06;
      pos.push(x, y, z);
      // colour: lesser coverts (spotted) at the front/top, coverts, then dark flight feathers with scallops at the rear
      const n = hash(Math.round(u * 70), Math.round(v * 30));
      let cc = lerpC(P.wing, P.cyanDeep, (n - 0.5) * 0.3);
      if (u < 0.35 && v > 0.35 && n > 0.9) cc = lerpC(cc, P.wingSpot, 0.55);
      const flight = smooth(0.45, 0.6, u);
      const scallop = 0.5 + 0.5 * Math.sin(v * 38 + u * 6);
      cc = lerpC(cc, lerpC(P.flight, P.wingDark, scallop), flight);
      cc = lerpC(cc, P.wingDark, smooth(0.05, 0.0, v) * 0.6); // lower edge shadow line
      cl.push(cc.r, cc.g, cc.b);
      bl.push(1);
      uv.push(v, u);
    }
  }
  for (let i = 0; i < NZ; i++)
    for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j, b = a + NA + 1;
      if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
      else idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3));
  g.setAttribute("blue", new THREE.Float32BufferAttribute(bl, 1));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

// ---------- tail, feet, eye ----------
const buildTail = (mat: THREE.Material) => {
  const g = new THREE.Group();
  const feathers: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const u = i / 9 - 0.5;
    const m = new THREE.Mesh(featherGeometry(0.27 - Math.abs(u) * 0.06, 0.065, { base: P.tail, tip: col("#0d2f5c"), edge: P.crown, curl: 0.05, asym: 0.1 }), mat);
    m.position.set(u * 0.07, 0.0 + Math.abs(u) * -0.01, 0);
    m.userData.u = u;
    g.add(m);
    feathers.push(m);
  }
  return { g, feathers };
};

const buildFoot = (side: 1 | -1) => {
  const m = new THREE.MeshPhysicalMaterial({ color: P.foot, roughness: 0.45, clearcoat: 0.4 });
  const g = new THREE.Group();
  const tarsus = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), m);
  tarsus.position.y = -0.03;
  g.add(tarsus);
  const toes = new THREE.Group();
  toes.position.y = -0.065;
  g.add(toes);
  for (const [yaw, len] of [[0.25, 0.07], [0, 0.08], [-0.3, 0.06], [Math.PI, 0.04]] as [number, number][]) {
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, len, 4, 8), m);
    t.rotation.set(Math.PI / 2, 0, 0);
    t.position.set(Math.sin(yaw) * len * 0.5, 0, Math.cos(yaw) * len * 0.5);
    const holder = new THREE.Group();
    holder.add(t);
    toes.add(holder);
  }
  g.position.set(0.05 * side, -0.14, 0.05);
  return { g, toes };
};

// ---------- the whole bird ----------
export type Bird = {
  root: THREE.Group; body: THREE.Group; head: THREE.Group; upperBill: THREE.Mesh; lowerBill: THREE.Mesh;
  wings: [Wing, Wing]; folded: THREE.Mesh[]; tail: { g: THREE.Group; feathers: THREE.Mesh[] }; feet: { g: THREE.Group; toes: THREE.Group }[]; fish: THREE.Group; nictitating: THREE.Mesh[];
};

export const buildFish = () => {
  const g = new THREE.Group();
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    pts.push(new THREE.Vector2(Math.sin(Math.pow(u, 0.8) * Math.PI) * 0.035 * (1 - u * 0.4), u * 0.22 - 0.11));
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), new THREE.MeshPhysicalMaterial({ color: "#c9d6dc", metalness: 0.85, roughness: 0.25, iridescence: 0.8, clearcoat: 1 }));
  body.scale.set(0.55, 1, 1);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  const back = new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x * 1.02, p.y)), 24, Math.PI * 0.15, Math.PI * 0.7), new THREE.MeshPhysicalMaterial({ color: "#3f5a52", metalness: 0.4, roughness: 0.35 }));
  back.scale.set(0.55, 1, 1);
  back.rotation.set(Math.PI / 2, 0, 0);
  g.add(back);
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(0.05, 0.035);
  fin.lineTo(0.04, 0);
  fin.lineTo(0.05, -0.035);
  fin.lineTo(0, 0);
  const tailFin = new THREE.Mesh(new THREE.ShapeGeometry(fin), new THREE.MeshPhysicalMaterial({ color: "#9fb2b8", metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  tailFin.rotation.set(0, Math.PI / 2, 0);
  tailFin.position.z = -0.11;
  g.add(tailFin);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), new THREE.MeshStandardMaterial({ color: "#111" }));
  eye.position.set(0.016, 0.008, 0.085);
  g.add(eye);
  g.userData.tail = tailFin;
  return g;
};

export const buildBird = (): Bird => {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mat = plumage({ repeat: [10, 22], bump: 0.55 });
  const featherMat = plumage({ repeat: [2, 3], bump: 0.6 });
  const bodyMesh = new THREE.Mesh(bodyGeometry(), mat);
  bodyMesh.castShadow = true;
  body.add(bodyMesh);
  // head group pivots at the neck so the head can bob / look down
  const head = new THREE.Group();
  head.position.set(0, 0.15, 0.36);
  body.add(head);
  const billMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const upperBill = new THREE.Mesh(billGeometry(false), billMat);
  const lowerBill = new THREE.Mesh(billGeometry(true), billMat);
  for (const b of [upperBill, lowerBill]) {
    b.position.set(0, -0.15, -0.36);
    head.add(b);
  }
  // re-parent the head part of the body surface? Kept on the body mesh for a seamless neck; the bill + eyes
  // ride the head pivot, and head motion stays small (bobs, tilts) so the surface reads as one bird.
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: "#050506", roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
  const lidMat = new THREE.MeshPhysicalMaterial({ color: "#cfe2ea", roughness: 0.3, transparent: true, opacity: 0.85 });
  const nictitating: THREE.Mesh[] = [];
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 24, 18), eyeMat);
    e.position.set(EYE.pos.x * s, EYE.pos.y - 0.15, EYE.pos.z - 0.36);
    head.add(e);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 8, 24), new THREE.MeshStandardMaterial({ color: "#2a1a10", roughness: 0.8 }));
    ring.position.copy(e.position);
    ring.rotation.y = (Math.PI / 2) * s;
    head.add(ring);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0255, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
    lid.position.copy(e.position);
    lid.rotation.set(0, 0, (-Math.PI / 2) * s);
    lid.visible = false;
    head.add(lid);
    nictitating.push(lid);
  }
  const wings: [Wing, Wing] = [buildWing(1, featherMat), buildWing(-1, featherMat)];
  wings.forEach((w) => {
    w.root.position.set(0.1 * w.side, 0.12, 0.13);
    body.add(w.root);
  });
  const foldMat = plumage({ repeat: [5, 9], bump: 0.9 });
  const folded = ([1, -1] as const).map((sd) => {
    const m = new THREE.Mesh(foldedWingGeometry(sd), foldMat);
    m.castShadow = true;
    body.add(m);
    return m;
  });
  const tail = buildTail(featherMat);
  tail.g.position.set(0, 0.05, -0.19);
  body.add(tail.g);
  const feet = [buildFoot(1), buildFoot(-1)];
  feet.forEach((f) => body.add(f.g));
  const fish = buildFish();
  fish.position.set(0, -0.005, 0.47);
  fish.rotation.set(0, Math.PI / 2, 0);
  fish.visible = false;
  head.add(fish);
  return { root, body, head, upperBill, lowerBill, wings, folded, tail, feet, fish, nictitating };
};

export type BirdPose = {
  phase: number; amp: number; folded: number; glide: number; tailSpread: number; feetDown: number;
  headPitch: number; headYaw: number; billOpen: number; fish: boolean; lid: boolean; fishWiggle?: number;
};

export const poseBird = (b: Bird, p: BirdPose) => {
  // rig for flight, shell for the folded wing; they swap over the last part of the fold
  const showShell = p.folded > 0.85;
  b.wings.forEach((w) => {
    poseWing(w, flapPose(p.phase, p.amp, p.folded, p.glide));
    w.root.visible = !showShell;
  });
  b.folded.forEach((m) => (m.visible = showShell));
  b.tail.feathers.forEach((m) => {
    const u = m.userData.u as number;
    m.rotation.set(0.05 + 0.1 * Math.sin(p.phase * Math.PI * 2) * p.amp * (1 - p.folded), u * 1.4 * p.tailSpread, 0, "YXZ");
  });
  b.feet.forEach((f) => {
    f.g.rotation.set(-1.25 * (1 - p.feetDown), 0, 0);
    f.g.visible = p.feetDown > 0.02 || true;
  });
  b.head.rotation.set(p.headPitch, p.headYaw, 0, "YXZ");
  b.lowerBill.rotation.x = p.billOpen * 0.35;
  b.fish.visible = p.fish;
  if (p.fish) {
    b.fish.rotation.set(0, Math.PI / 2, Math.sin((p.fishWiggle ?? 0) * 12) * 0.25);
    (b.fish.userData.tail as THREE.Mesh).rotation.y = Math.PI / 2 + Math.sin((p.fishWiggle ?? 0) * 18) * 0.5;
  }
  b.nictitating.forEach((l) => (l.visible = p.lid));
};
