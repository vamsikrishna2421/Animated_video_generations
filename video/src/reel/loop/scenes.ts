import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, ease, easeOut, easeIn, seg, lerp, writeOn } from "./crayon";

export const COL = {
  blue: "#1438e6", deep: "#0b23a8", navy: "#081670", ink: "#050c3d",
  light: "#5d7cff", pale: "#b9c8ff", cream: "#f3ead2", creamShade: "#d9cba6",
  orange: "#f2711c", orangeLight: "#ffa255", red: "#ff4d63", yellow: "#ffd34d", green: "#9dff5c",
};

// ---------- swirl background (shot 1) ----------
export const swirl = (c: Ctx, W: number, H: number, t: number, boil: number) => {
  c.fillStyle = COL.blue; c.fillRect(0, 0, W, H);
  const r = rng(11 + boil);
  const cx = W / 2, cy = H * 0.44;
  const spin = t * 0.35;
  const cols = [COL.deep, COL.navy, COL.light, COL.pale, "#2a4cff"];
  for (let i = 0; i < 260; i++) {
    const rad = 330 + Math.pow(i / 260, 0.8) * 900 + (r() - 0.5) * 30;
    const a0 = r() * Math.PI * 2 + spin * (600 / rad);
    const len = 0.25 + r() * 0.6;
    const pts = circlePts(cx, cy, rad, rad, a0, a0 + len, 14);
    stroke(c, pts, cols[Math.floor(r() * cols.length)], 4 + r() * 7, r, { passes: 2, alpha: 0.5 });
  }
};

// ---------- clock (drawn to its own canvas, then melted) ----------
const clockCanvas: { el?: HTMLCanvasElement } = {};
export const drawClock = (S: number, t: number, boil: number, handSpin: number) => {
  if (!clockCanvas.el) { clockCanvas.el = document.createElement("canvas"); }
  const el = clockCanvas.el; el.width = S; el.height = S;
  const c = el.getContext("2d")!;
  c.clearRect(0, 0, S, S);
  const r = rng(101 + boil);
  const cx = S / 2, cy = S / 2, R = S * 0.42;
  // rim
  c.save(); c.beginPath(); c.arc(cx, cy, R * 1.12, 0, Math.PI * 2); c.fillStyle = COL.deep; c.fill(); c.restore();
  stroke(c, circlePts(cx, cy, R * 1.08, R * 1.08), COL.pale, 16, r, { passes: 3, alpha: 0.6 });
  stroke(c, circlePts(cx, cy, R * 1.13, R * 1.13, -2.6, -0.4, 30), "#ffffff", 7, r, { passes: 2, alpha: 0.7 });
  // face
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = COL.cream; c.fill(); c.clip();
  hatch(c, [cx - R, cy - R, cx + R, cy + R], [COL.creamShade, "#e8dcbc", "#cdbb90"], r, { gap: 10, w: 3, alpha: 0.35 });
  const shade = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R * 1.05);
  shade.addColorStop(0, "rgba(255,255,255,0)"); shade.addColorStop(1, "rgba(120,100,60,0.35)");
  c.fillStyle = shade; c.fillRect(0, 0, S, S);
  c.restore();
  stroke(c, circlePts(cx, cy, R, R), COL.ink, 5, r, { passes: 2, alpha: 0.8 });
  // numbers
  c.fillStyle = "#1b1a2a"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = `${Math.round(S * 0.085)}px 'Patrick Hand'`;
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2 - Math.PI / 2;
    c.fillText(String(n), cx + Math.cos(a) * R * 0.8 + (r() - 0.5) * 3, cy + Math.sin(a) * R * 0.8 + (r() - 0.5) * 3);
  }
  // hands
  const hand = (ang: number, len: number, w: number) => {
    const ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len;
    stroke(c, [[cx, cy], [ex, ey]], "#14131f", w, r, { passes: 3, alpha: 0.85, jit: 2 });
    const ah = w * 3.2, back = ang + Math.PI;
    stroke(c, [[ex + Math.cos(back + 0.45) * ah, ey + Math.sin(back + 0.45) * ah], [ex, ey], [ex + Math.cos(back - 0.45) * ah, ey + Math.sin(back - 0.45) * ah]], "#14131f", w * 0.9, r, { passes: 2, alpha: 0.9, jit: 2 });
  };
  hand(-Math.PI / 2 + handSpin / 12 + 1.9, R * 0.5, 9);
  hand(-Math.PI / 2 + handSpin + 0.4, R * 0.72, 6);
  c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fillStyle = "#14131f"; c.fill();
  return el;
};

// Melt: slice the clock into 2px columns, stretch each downward by a drip profile.
export const meltClock = (c: Ctx, src: HTMLCanvasElement, x0: number, y0: number, m: number, seed: number) => {
  const S = src.width;
  if (m <= 0.001) { c.drawImage(src, x0, y0); return { pool: 0 }; }
  const r = rng(seed);
  const drips: { x: number; w: number; h: number }[] = [];
  for (let i = 0; i < 14; i++) drips.push({ x: 0.12 + r() * 0.76, w: 0.012 + r() * 0.035, h: 0.4 + r() * 0.9 });
  const SEGS = 18;
  for (let x = 0; x < S; x += 2) {
    const u = x / S;
    let d = 0.18 + 0.12 * Math.sin(u * 9 + seed);
    for (const dp of drips) d += dp.h * Math.exp(-Math.pow((u - dp.x) / dp.w, 2));
    const D = easeIn(m) * d * S * 0.62;
    const top = D * 0.06;
    for (let s = 0; s < SEGS; s++) {
      const a = s / SEGS, b = (s + 1) / SEGS;
      const ya = a * S + top + D * Math.pow(a, 2.4), yb = b * S + top + D * Math.pow(b, 2.4);
      c.drawImage(src, x, a * S, 2, S / SEGS + 0.5, x0 + x, y0 + ya, 2, yb - ya + 0.8);
    }
  }
  return { pool: easeIn(m) };
};

// ---------- storm cloud ----------
// One fluffy silhouette: union of bumps, hatched inside, light rims on the top
// of each bump and dark creases underneath (no per-bump outlines = no "balls").
export const cloud = (c: Ctx, cx: number, cy: number, w: number, h: number, boil: number, seed: number) => {
  if (w < 4) return;
  const r = rng(seed * 31 + boil);
  const L = rng(seed);
  const bumps: { x: number; y: number; rr: number }[] = [];
  // bottom row: wide, flat-ish base
  for (let i = 0; i < 7; i++) bumps.push({ x: cx + ((i + 0.5) / 7 - 0.5) * w * 0.92, y: cy + h * 0.22, rr: w * (0.08 + L() * 0.03) });
  // middle row
  for (let i = 0; i < 6; i++) bumps.push({ x: cx + ((i + 0.5) / 6 - 0.5) * w * 0.8 + (L() - 0.5) * w * 0.04, y: cy + (L() - 0.5) * h * 0.1, rr: w * (0.1 + L() * 0.04) });
  // top crowns
  for (let i = 0; i < 4; i++) bumps.push({ x: cx + ((i + 0.5) / 4 - 0.5) * w * 0.6 + (L() - 0.5) * w * 0.06, y: cy - h * 0.22 + (L() - 0.5) * h * 0.08, rr: w * (0.11 + L() * 0.05) });
  const xs = bumps.map((b) => b.x), ys = bumps.map((b) => b.y);
  const box: [number, number, number, number] = [Math.min(...xs) - w * 0.2, Math.min(...ys) - w * 0.2, Math.max(...xs) + w * 0.2, Math.max(...ys) + w * 0.2];
  const silhouette = () => { c.beginPath(); for (const b of bumps) { c.moveTo(b.x + b.rr, b.y); c.arc(b.x, b.y, b.rr, 0, Math.PI * 2); } };
  // dark outline: silhouette drawn slightly larger in ink
  c.save(); c.translate(0, 0);
  c.fillStyle = COL.ink; c.beginPath();
  for (const b of bumps) { c.moveTo(b.x + b.rr + 5, b.y); c.arc(b.x, b.y, b.rr + 5, 0, Math.PI * 2); }
  c.fill();
  silhouette(); c.fillStyle = COL.navy; c.fill();
  silhouette(); c.clip();
  // vertical shading: lighter top, darker belly
  const vg = c.createLinearGradient(0, box[1], 0, box[3]);
  vg.addColorStop(0, "#2c4be0"); vg.addColorStop(0.55, COL.deep); vg.addColorStop(1, COL.ink);
  c.fillStyle = vg; c.fillRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
  hatch(c, box, [COL.navy, "#2a48d8", COL.ink, COL.light], r, { gap: 7, w: 2.6, alpha: 0.5, angle: -0.6, wobble: 3 });
  // per-bump: soft light on the upper-left, crease shadow along the lower edge
  const order = [...bumps].sort((p, q) => p.y - q.y);
  for (const b of order) {
    const lg = c.createRadialGradient(b.x - b.rr * 0.35, b.y - b.rr * 0.45, 0, b.x - b.rr * 0.2, b.y - b.rr * 0.3, b.rr);
    lg.addColorStop(0, "rgba(130,160,255,0.45)"); lg.addColorStop(1, "rgba(130,160,255,0)");
    c.fillStyle = lg; c.beginPath(); c.arc(b.x, b.y, b.rr, 0, Math.PI * 2); c.fill();
    stroke(c, circlePts(b.x, b.y, b.rr * 0.97, b.rr * 0.97, Math.PI * 0.15, Math.PI * 0.85, 14), COL.ink, Math.max(2, b.rr * 0.07), r, { passes: 2, alpha: 0.55 });
  }
  c.restore();
  // light rims only on the outer edge: keep rim points not inside another bump
  const inside = (x: number, y: number, self: typeof bumps[0]) => bumps.some((o) => o !== self && Math.hypot(x - o.x, y - o.y) < o.rr - 2);
  for (const b of order) {
    let run: Pt[] = [];
    const pts = circlePts(b.x, b.y, b.rr - 3, b.rr - 3, Math.PI * 1.0, Math.PI * 2.0, 28);
    const flush = () => { if (run.length > 3) stroke(c, run, COL.pale, Math.max(2, b.rr * 0.045), r, { passes: 2, alpha: 0.65 }); run = []; };
    for (const q of pts) { if (inside(q[0], q[1], b)) flush(); else run.push(q); }
    flush();
  }
};

export const rain = (c: Ctx, x0: number, x1: number, y0: number, y1: number, t: number, amt: number, seed: number) => {
  if (amt <= 0) return;
  const r = rng(seed);
  const n = Math.floor(160 * amt);
  c.save(); c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), sp = 1500 + r() * 700, ph = r();
    const y = y0 + (((t * sp) / (y1 - y0) + ph) % 1) * (y1 - y0);
    c.strokeStyle = r() < 0.5 ? COL.pale : "#e9eeff";
    c.globalAlpha = 0.35 + r() * 0.4;
    c.lineWidth = 2 + r() * 2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 34 + r() * 20); c.stroke();
  }
  c.restore();
};

export const lightning = (c: Ctx, x: number, y0: number, y1: number, seed: number, a: number) => {
  if (a <= 0) return;
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) pts.push([x + (r() - 0.5) * 50, lerp(y0, y1, i / 10)]);
  c.save(); c.globalAlpha = a;
  stroke(c, pts, COL.red, 6, r, { passes: 3, alpha: 0.9, jit: 2 });
  c.restore();
};

// ---------- shot 1: clock spins and melts, a cloud lands on it ----------
export const shotClock = (c: Ctx, W: number, H: number, t: number, boil: number) => {
  swirl(c, W, H, t, boil);
  const S = 860;
  const spin = t * 2 + Math.pow(seg(t, 0.2, 2.0), 2) * 40;
  const el = drawClock(S, t, boil, spin);
  const x0 = (W - S) / 2, y0 = H * 0.44 - S / 2;
  const m = ease(seg(t, 1.0, 3.0));
  // puddle under the clock
  const pool = easeIn(m);
  if (pool > 0.35) {
    const r = rng(300 + boil);
    const py = y0 + S * (0.98 + 0.62 * pool);
    c.save(); c.beginPath(); c.ellipse(W / 2, py, S * (0.22 + 0.22 * pool), 30 + 34 * pool, 0, 0, Math.PI * 2);
    c.fillStyle = COL.cream; c.fill(); c.clip();
    hatch(c, [0, py - 100, W, py + 100], [COL.creamShade, "#ffffff"], r, { angle: 0, gap: 8, alpha: 0.4 });
    c.restore();
    stroke(c, circlePts(W / 2, py, S * (0.22 + 0.22 * pool), 30 + 34 * pool, 0, Math.PI, 30), COL.pale, 6, r, { passes: 2 });
  }
  meltClock(c, el, x0, y0, m, 5);
  // cloud slams down at 2.75 s
  const drop = easeOut(seg(t, 2.75, 3.0));
  if (drop > 0) {
    const cy = lerp(-300, y0 + 40, drop);
    cloud(c, W / 2, cy, 760, 300, boil, 3);
    lightning(c, W / 2 + 60, cy + 120, cy + 700, 9 + boil, seg(t, 2.95, 3.0));
  }
};

// ---------- shot 2: blank page on a desk, storm grows over it ----------
export const shotPage = (c: Ctx, W: number, H: number, t: number, boil: number) => {
  // t is local (0 at shot start)
  const r = rng(500 + boil);
  c.fillStyle = COL.navy; c.fillRect(0, 0, W, H);
  // desk surface with hatching
  c.save(); c.beginPath(); c.rect(0, H * 0.5, W, H * 0.5); c.clip();
  c.fillStyle = COL.deep; c.fillRect(0, H * 0.5, W, H);
  hatch(c, [0, H * 0.5, W, H], [COL.navy, COL.blue, COL.ink], r, { angle: -0.2, gap: 10, w: 4, alpha: 0.5 });
  c.restore();
  // window light wedge behind
  c.save(); c.globalAlpha = 0.5;
  hatch(c, [0, 0, W, H * 0.5], [COL.deep, COL.blue, COL.light], r, { angle: 1.2, gap: 12, w: 5, alpha: 0.5 });
  c.restore();
  const push = 1 + 0.07 * ease(t / 4);
  c.save(); c.translate(W / 2, H * 0.62); c.scale(push, push); c.translate(-W / 2, -H * 0.62);
  // page (perspective trapezoid)
  const page: Pt[] = [[W * 0.24, H * 0.5], [W * 0.76, H * 0.5], [W * 0.92, H * 0.8], [W * 0.08, H * 0.8]];
  c.save(); c.beginPath(); page.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = COL.cream; c.fill(); c.clip();
  hatch(c, [0, H * 0.5, W, H * 0.8], ["#e9dfc4", "#ffffff", COL.creamShade], r, { angle: 0.05, gap: 9, w: 3, alpha: 0.35 });
  c.restore();
  stroke(c, [...page, page[0]], COL.orange, 7, r, { passes: 3, alpha: 0.7 });
  stroke(c, [[W * 0.08, H * 0.805], [W * 0.92, H * 0.805]], COL.ink, 6, r, { passes: 2 });
  // warm lamp glow on the page, pencil lying on it
  const lamp = c.createRadialGradient(W * 0.85, H * 0.48, 0, W * 0.85, H * 0.48, W * 0.7);
  lamp.addColorStop(0, "rgba(255,170,80,0.35)"); lamp.addColorStop(1, "rgba(255,170,80,0)");
  c.fillStyle = lamp; c.fillRect(0, H * 0.5, W, H * 0.4);
  {
    const p0: Pt = [W * 0.6, H * 0.74], p1: Pt = [W * 0.86, H * 0.68];
    stroke(c, [p0, p1], COL.orange, 22, r, { passes: 3, alpha: 0.85, jit: 2 });
    stroke(c, [p0, [p0[0] - 30, p0[1] + 8]], COL.creamShade, 18, r, { passes: 2, alpha: 0.9, jit: 1 });
    stroke(c, [[p0[0] - 30, p0[1] + 8], [p0[0] - 42, p0[1] + 11]], COL.ink, 8, r, { passes: 2, alpha: 0.9, jit: 1 });
    stroke(c, [[p0[0] + 4, p0[1] - 5], [p1[0], p1[1] - 5]], COL.orangeLight, 5, r, { passes: 2, alpha: 0.7, jit: 1 });
  }
  // steam from the page, before the cloud
  const steamA = 1 - seg(t, 0.9, 1.3);
  if (steamA > 0) {
    c.save(); c.globalAlpha = steamA;
    for (let k = 0; k < 3; k++) {
      const pts: Pt[] = [];
      const bx = W * (0.42 + k * 0.08);
      for (let i = 0; i <= 20; i++) {
        const v = i / 20;
        pts.push([bx + Math.sin(v * 8 + t * 5 + k) * 22, H * 0.6 - v * 420 * (0.4 + 0.6 * seg(t, 0, 0.8))]);
      }
      stroke(c, pts, COL.pale, 5, r, { passes: 2, alpha: 0.6 });
    }
    c.restore();
  }
  c.restore();
  // cloud grows from small to filling the top
  const g = easeOut(seg(t, 0.8, 2.2));
  if (g > 0) {
    const cw = lerp(260, 1500, g), ch = lerp(110, 720, g);
    const cy = lerp(H * 0.45, H * 0.3, g);
    cloud(c, W / 2, cy, cw, ch, boil, 21);
  }
  // rain
  rain(c, 0, W, H * 0.35, H, t, seg(t, 1.9, 2.6), 77 + boil);
  // feelings written on the cloud
  writeOn(c, "boring", W * 0.14, H * 0.22, 120, COL.red, seg(t, 2.4, 2.9), rng(900 + boil), -0.08);
  writeOn(c, "frustrating", W * 0.42, H * 0.15, 120, COL.red, seg(t, 2.9, 3.5), rng(901 + boil), 0.05);
  writeOn(c, "ugh", W * 0.38, H * 0.33, 96, COL.red, seg(t, 3.4, 3.7), rng(902 + boil), -0.03);
};
