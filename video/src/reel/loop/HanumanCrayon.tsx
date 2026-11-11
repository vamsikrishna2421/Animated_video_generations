import React, { useLayoutEffect, useState } from "react";
import { Audio, Sequence, continueRender, delayRender, staticFile } from "remotion";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, ease, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { cueAt } from "./SkitCrayon";

// Creative 26 "Hanuman Chalisa, Part 1: See His Form" (series/scripts/creative26_hanuman_chalisa_part1.md): a calm
// devotional explainer, the pilot Vamsi asked for (Bujji's [STRATEGY] Nov 9). Per chaupai: a bell, the line on screen
// (Devanagari + Roman) chanted in Hindi; its meaning (EN or TE narrator) while the picture shows exactly that line;
// "picture him...". No music bed. THE LOCKED HANUMAN: `hanuman()` below is the one design for every scene and every
// later part (design sheet: series/scripts/creative26_design/hanuman_sheet.jpg); only the pose and scale change.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

// ---------- the locked design: colours never change ----------
export const HC = {
  skin: "#e9b44c", skinShade: "#c98f2e", muzzle: "#f8dfa6", hair: "#1d140f", hairHi: "#4a3426", crown: "#f5c542",
  crownDk: "#b7791f", gem: "#c0262d", dhoti: "#f28a1c", dhotiDk: "#c8640f", border: "#f6d36b", sash: "#b91c1c",
  thread: "#e9dcae", flag: "#ff8a1f", pole: "#6b4423", ink: "#2a1a10", tilak: "#d7261e",
};
export type Pose = "stand" | "fly" | "kneel" | "raise";
type Arm = [Pt, Pt];   // elbow, hand (local units; the figure stands about 1150 tall, origin at the navel)
const POSES: Record<Pose, { mace: Arm; flag: Arm; legs: [Pt, Pt, Pt, Pt] | null; maceAng: number; poleAng: number; ground: number }> = {
  // mace arm on the viewer's left (his right hand), flag arm on the viewer's right
  stand: { mace: [[-215, -45], [-160, -150]], flag: [[218, -40], [238, 110]], legs: [[-68, 330], [-78, 540], [68, 330], [78, 540]], maceAng: -1.78, poleAng: -Math.PI / 2, ground: 560 },
  raise: { mace: [[-255, -255], [-235, -380]], flag: [[218, -40], [238, 110]], legs: [[-80, 330], [-105, 540], [80, 330], [105, 540]], maceAng: -2.1, poleAng: -Math.PI / 2, ground: 560 },
  fly: { mace: [[-200, -330], [-170, -480]], flag: [[205, -40], [190, 90]], legs: [[-60, 330], [-60, 540], [80, 310], [40, 470]], maceAng: -1.6, poleAng: 2.06, ground: 9999 },
  kneel: { mace: [[-175, -40], [-35, -130]], flag: [[175, -40], [35, -130]], legs: null, maceAng: 0, poleAng: -Math.PI / 2, ground: 345 },
};

const thick = (c: Ctx, pts: Pt[], w: number, col: string) => {   // a limb: an ink edge, then the fill
  c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = HC.ink; c.lineWidth = w + 9; c.stroke();
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
};
const ol = (c: Ctx, pts: Pt[], r: () => number, w = 5, a = 0.8) => stroke(c, pts, HC.ink, w, r, { passes: 1, alpha: a });
const blob = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 5) => {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.fill();
  ol(c, [...pts, pts[0]], r, w);
};
const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, col: string, r: () => number, w = 5, a = 0.8) => {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = col; c.fill();
  if (w) stroke(c, circlePts(x, y, rx, ry), HC.ink, w, r, { passes: 1, alpha: a });
};

export const mace = (c: Ctx, x: number, y: number, ang: number, r: () => number, len = 300) => {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, bx = x - Math.cos(ang) * 40, by = y - Math.sin(ang) * 40;
  thick(c, [[bx, by], [ex, ey]], 22, "#d9a441");
  [0.25, 0.55, 0.85].forEach((t) => { const px = bx + (ex - bx) * t, py = by + (ey - by) * t; c.beginPath(); c.arc(px, py, 14, 0, 7); c.fillStyle = HC.crownDk; c.fill(); });
  c.save(); c.translate(ex + Math.cos(ang) * 58, ey + Math.sin(ang) * 58); c.rotate(ang + Math.PI / 2);
  ell(c, 0, 0, 62, 72, HC.crown, r, 6);
  [-36, -12, 12, 36].forEach((dx) => { c.beginPath(); c.ellipse(dx, 0, 7, 62 - Math.abs(dx) * 0.6, 0, 0, 7); c.fillStyle = HC.crownDk; c.fill(); });
  c.beginPath(); c.moveTo(-16, -66); c.lineTo(0, -108); c.lineTo(16, -66); c.closePath(); c.fillStyle = HC.crown; c.fill(); ol(c, [[-16, -66], [0, -108], [16, -66]], r, 4);
  ell(c, 0, 0, 13, 13, HC.gem, r, 3);
  c.restore();
};
export const flag = (c: Ctx, x: number, y: number, ang: number, f: number, r: () => number, len = 760) => {
  const tx = x + Math.cos(ang) * (len - 140), ty = y + Math.sin(ang) * (len - 140), bx = x - Math.cos(ang) * 140, by = y - Math.sin(ang) * 140;
  thick(c, [[bx, by], [tx, ty]], 12, HC.pole);
  const nx = -Math.sin(ang), ny = Math.cos(ang);   // the cloth hangs off the pole's top, waving
  const pts: Pt[] = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, wave = Math.sin(f / 7 + t * 4) * 16 * t;
    pts.push([tx + Math.cos(ang) * (-t * 20) + nx * (t * 200) + Math.cos(ang) * wave * 0.4 + ny * 0, ty + Math.sin(ang) * (-t * 20) + ny * (t * 200) - nx * 0 + Math.sin(ang) * wave * 0.4 + wave]);
  }
  const back: Pt[] = [];
  for (let k = 10; k >= 0; k--) {
    const t = k / 10, wave = Math.sin(f / 7 + t * 4 + 0.8) * 16 * t;
    back.push([tx - Math.cos(ang) * (150 - t * 70) + nx * (t * 200) + wave * 0.2, ty - Math.sin(ang) * (150 - t * 70) + ny * (t * 200) + wave]);
  }
  blob(c, [...pts, ...back], HC.flag, r, 5);
  ell(c, tx, ty, 11, 11, HC.crown, r, 3);
};

// The one Hanuman. (x, y) = the navel on screen, s = scale, rot = body rotation (flying), f = frame (the flag and the
// glow move), glow = 0..1 the golden aura.
export const hanuman = (c: Ctx, x: number, y: number, s: number, pose: Pose, f: number, r: () => number, o: { rot?: number; glow?: number; shine?: number } = {}) => {
  const P = POSES[pose], glow = o.glow ?? 0.6;
  c.save(); c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(s, s);
  // the aura behind the head
  if (glow > 0) {
    const g = c.createRadialGradient(0, -340, 40, 0, -340, 330);
    g.addColorStop(0, `rgba(255,226,140,${0.75 * glow})`); g.addColorStop(0.55, `rgba(255,190,80,${0.35 * glow})`); g.addColorStop(1, "rgba(255,170,60,0)");
    c.fillStyle = g; c.beginPath(); c.arc(0, -340, 330, 0, 7); c.fill();
  }
  // the tail, behind everything: out from the waist on his left, curling up
  c.lineCap = "round";
  const tail: Pt[] = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24, sway = Math.sin(f / 18 + t * 2) * 10 * t;
    tail.push([70 + 260 * Math.sin(t * 1.9) + sway, 70 - 520 * t + 60 * Math.sin(t * 3)]);
  }
  const curl = circlePts(tail[24][0] - 34, tail[24][1], 34, 34, 0, -Math.PI * 1.6, 10);
  thick(c, [...tail, ...curl], 30, HC.skin);
  // the flag pole and the mace behind the arms
  const fh = P.flag[1], mh = P.mace[1];
  if (pose === "kneel") { flag(c, 330, 330, -Math.PI / 2, f, r, 900); mace(c, -330, 300, -1.95, r, 280); }
  else { flag(c, fh[0], fh[1], P.poleAng, f, r); mace(c, mh[0], mh[1], P.maceAng, r); }
  // the head's frame: 0.9 of the old size (the sheet read big-headed), kept upright while he flies
  const headRot = pose === "fly" ? -(o.rot ?? 0) * 0.8 : 0;
  const headT = () => { c.translate(0, -245); c.rotate(headRot); c.scale(0.9, 0.9); c.translate(0, 245); };
  // the hair: a dark curly mass behind the head, down to the shoulders
  c.save(); headT();
  const hairPts: Pt[] = [];
  for (let k = 0; k <= 26; k++) {
    const a = Math.PI * (0.92 + 1.16 * (k / 26)), rr = 150 + Math.sin(k * 2.3) * 6;
    hairPts.push([Math.cos(a) * rr * 0.92, -360 + Math.sin(a) * rr * (a > Math.PI * 1.5 ? 0.62 : 0.62)]);
  }
  c.beginPath(); c.moveTo(-150, -190); hairPts.forEach(([hx, hy]) => c.lineTo(hx, hy)); c.lineTo(150, -190); c.quadraticCurveTo(0, -150, -150, -190);
  c.fillStyle = HC.hair; c.fill();
  for (let k = 0; k < 18; k++) {   // the curls along the edge ("kunchit kesa")
    const side = k < 9 ? -1 : 1, t = (k % 9) / 8;
    const cx = side * (118 + 30 * Math.sin(t * Math.PI)), cy = -430 + t * 235;
    c.beginPath(); c.arc(cx, cy, 25, 0, 7); c.fillStyle = HC.hair; c.fill();
    stroke(c, circlePts(cx, cy, 14, 14, 0.4, 5.2, 10), HC.hairHi, 4, r, { passes: 1, alpha: 0.9 });
  }
  c.restore();
  // the legs (the dhoti covers the thighs)
  if (P.legs) {
    const [k1, f1, k2, f2] = P.legs;
    thick(c, [[-60, 300], k1, f1], 52, HC.skin); thick(c, [[60, 300], k2, f2], 52, HC.skin);
    [f1, f2].forEach(([fx, fy]) => { ell(c, fx + (fx < 0 ? -10 : 10), fy + 18, 40, 18, HC.skin, r, 4); c.fillStyle = HC.crown; c.fillRect(fx - 26, fy - 18, 52, 9); });
  } else {   // kneeling: the right knee down, the left knee up
    thick(c, [[-60, 240], [-85, 330]], 52, HC.skin); ell(c, -88, 336, 34, 18, HC.skin, r, 4);   // the right knee on the ground
    thick(c, [[60, 240], [135, 205], [148, 330]], 52, HC.skin); ell(c, 166, 343, 42, 16, HC.skin, r, 4);   // the left knee up
  }
  // the dhoti: saffron, pleated, a gold border; the red sash
  const hem = pose === "kneel" ? 250 : 335;
  blob(c, [[-100, 28], [100, 28], [128, hem], [-128, hem]], HC.dhoti, r, 6);
  c.save(); c.beginPath(); c.moveTo(-100, 28); c.lineTo(100, 28); c.lineTo(128, hem); c.lineTo(-128, hem); c.closePath(); c.clip();
  hatch(c, [-140, 20, 140, hem + 10], [HC.dhotiDk], r, { angle: Math.PI / 2, gap: 26, w: 4, alpha: 0.35 });
  c.fillStyle = HC.border; c.fillRect(-140, hem - 26, 280, 16);
  c.restore();
  c.fillStyle = HC.sash; c.fillRect(-104, 22, 208, 30); ol(c, [[-104, 22], [104, 22]], r, 4); ol(c, [[-104, 52], [104, 52]], r, 4);
  blob(c, [[-14, 50], [14, 50], [24, 150], [-6, 150]], HC.sash, r, 4);
  // the torso
  const torso: Pt[] = [[-150, -205], [-122, -120], [-98, 30], [98, 30], [122, -120], [150, -205], [60, -232], [-60, -232]];
  c.beginPath(); c.moveTo(torso[0][0], torso[0][1]); c.quadraticCurveTo(-138, -160, -122, -120); c.quadraticCurveTo(-104, -40, -98, 30); c.lineTo(98, 30);
  c.quadraticCurveTo(104, -40, 122, -120); c.quadraticCurveTo(138, -160, 150, -205); c.quadraticCurveTo(80, -240, 0, -236); c.quadraticCurveTo(-80, -240, -150, -205);
  c.fillStyle = HC.skin; c.fill(); ol(c, torso.concat([torso[0]]).filter((_, i) => i !== 6 && i !== 7), r, 5, 0.55);
  stroke(c, [[-100, -150], [-60, -112], [-8, -112]], HC.skinShade, 6, r, { passes: 1, alpha: 0.8 }); stroke(c, [[100, -150], [60, -112], [8, -112]], HC.skinShade, 6, r, { passes: 1, alpha: 0.8 });
  stroke(c, [[0, -100], [0, 10]], HC.skinShade, 4, r, { passes: 1, alpha: 0.5 }); [-30, 30].forEach((dx) => stroke(c, [[dx, -60], [dx, 0]], HC.skinShade, 3, r, { passes: 1, alpha: 0.35 }));
  // the munj thread over his left shoulder to the right hip (Part 2's chaupai 5; it is part of the locked design)
  [0, 7].forEach((d) => stroke(c, [[118 + d, -210], [-96 + d, 30]], HC.thread, 5, r, { passes: 1, alpha: 0.95 }));
  for (let k = 1; k < 9; k++) { const t = k / 9; const px = 118 - 214 * t, py = -210 + 240 * t; stroke(c, [[px - 4, py - 4], [px + 10, py + 6]], "#b8a774", 3, r, { passes: 1, alpha: 0.9 }); }
  // the necklace
  stroke(c, [[-82, -214], [-40, -168], [0, -152], [40, -168], [82, -214]], HC.crown, 9, r, { passes: 1 });
  ell(c, 0, -140, 15, 17, HC.gem, r, 3); ell(c, 0, -140, 6, 7, HC.crown, r, 0);
  // the arms, with gold armlets and bracelets
  const sh: Pt[] = [[-140, -200], [140, -200]];
  ([[sh[0], ...P.mace], [sh[1], ...P.flag]] as Pt[][]).forEach(([s0, e, h]) => {
    thick(c, [s0, e, h], 50, HC.skin);
    const ax = s0[0] + (e[0] - s0[0]) * 0.62, ay = s0[1] + (e[1] - s0[1]) * 0.62;
    c.save(); c.translate(ax, ay); c.rotate(Math.atan2(e[1] - s0[1], e[0] - s0[0]) + Math.PI / 2); c.fillStyle = HC.crown; c.fillRect(-28, -7, 56, 14); c.restore();
    const bx = e[0] + (h[0] - e[0]) * 0.8, by = e[1] + (h[1] - e[1]) * 0.8;
    c.save(); c.translate(bx, by); c.rotate(Math.atan2(h[1] - e[1], h[0] - e[0]) + Math.PI / 2); c.fillStyle = HC.crown; c.fillRect(-25, -6, 50, 12); c.restore();
    ell(c, h[0], h[1], 30, 28, HC.skin, r, 5);
  });
  if (pose === "kneel") { ell(c, 0, -150, 26, 44, HC.skin, r, 4); stroke(c, [[0, -190], [0, -110]], HC.ink, 3, r, { passes: 1, alpha: 0.6 }); }   // folded hands
  // the neck and the head
  c.fillStyle = HC.skin; c.fillRect(-34, -262, 68, 40);
  c.save(); headT();
  [-1, 1].forEach((sd) => { ell(c, sd * 88, -330, 22, 28, HC.skin, r, 4); ell(c, sd * 88, -330, 10, 14, HC.skinShade, r, 0); });
  ell(c, 0, -330, 88, 98, HC.skin, r, 6);
  stroke(c, circlePts(0, -330, 80, 90, 0.2, Math.PI - 0.2, 14), HC.skinShade, 6, r, { passes: 1, alpha: 0.35 });
  ell(c, 0, -290, 60, 46, HC.muzzle, r, 3, 0.5);
  ell(c, 0, -314, 11, 7, "#5a3418", r, 0);
  stroke(c, circlePts(0, -296, 26, 16, 0.35, Math.PI - 0.35, 10), HC.ink, 5, r, { passes: 1, alpha: 0.85 });   // a gentle smile
  [-1, 1].forEach((sd) => {   // calm, kind eyes: almond-shaped, the lids half lowered (the sheet's round eyes read like spectacles)
    const ex = sd * 34;
    const almond = () => { c.beginPath(); c.moveTo(ex - 23, -350); c.quadraticCurveTo(ex, -368, ex + 23, -350); c.quadraticCurveTo(ex, -338, ex - 23, -350); c.closePath(); };
    almond(); c.fillStyle = "#fffaf0"; c.fill();
    c.save(); almond(); c.clip();
    c.beginPath(); c.arc(ex, -349, 9, 0, 7); c.fillStyle = "#3b2414"; c.fill();
    c.beginPath(); c.arc(ex - 2.5, -352, 2.6, 0, 7); c.fillStyle = "#fff"; c.fill();
    c.fillStyle = HC.skin; c.fillRect(ex - 26, -372, 52, 15);   // the lowered lid
    c.restore();
    stroke(c, [[ex - 25, -350], [ex - 12, -358], [ex + 12, -358], [ex + 25, -350]], HC.ink, 5, r, { passes: 1 });
    stroke(c, [[ex - 14, -343], [ex + 14, -343]], HC.ink, 2, r, { passes: 1, alpha: 0.35 });
    stroke(c, [[ex - 26, -380], [ex, -388], [ex + 24, -382]], HC.ink, 3.5, r, { passes: 1, alpha: 0.65 });   // a thin brow, high
  });
  stroke(c, [[0, -414], [0, -380]], HC.tilak, 8, r, { passes: 1 });   // the red tilak
  // the crown
  blob(c, [[-84, -404], [84, -404], [76, -446], [-76, -446]], HC.crown, r, 5);
  blob(c, [[-72, -444], [-50, -530], [-24, -500], [0, -600], [24, -500], [50, -530], [72, -444]], HC.crown, r, 5);
  stroke(c, [[-66, -462], [66, -462]], HC.crownDk, 5, r, { passes: 1 });
  ell(c, 0, -425, 11, 11, HC.gem, r, 3); [-48, 48].forEach((gx) => ell(c, gx, -425, 7, 7, HC.gem, r, 2)); ell(c, 0, -520, 10, 12, HC.gem, r, 3);
  // the earrings ("kanan kundal"), hanging below the ears
  [-1, 1].forEach((sd) => { ell(c, sd * 94, -282, 19, 19, HC.crown, r, 4); ell(c, sd * 94, -282, 7, 7, HC.gem, r, 0); });
  c.restore();
  // shine: a light sweep across him (the golden colour, the clothes)
  if (o.shine && o.shine > 0 && o.shine < 1) {
    const sx = -300 + 600 * o.shine;
    const g = c.createLinearGradient(sx - 90, 0, sx + 90, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,248,220,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(-320, -620, 640, 1000);
  }
  c.restore();
};

// ---------- the reel ----------
const DEVA = (s: number) => `700 ${s}px "Noto Serif Deva", serif`;
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const useDevaFont = () => {
  const [handle] = useState(() => delayRender("devanagari font"));
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const ff = new FontFace("Noto Serif Deva", `url(${staticFile("fonts/noto-serif-devanagari-devanagari-700-normal.woff2")})`, { weight: "700" });
    ff.load().then((l) => { document.fonts.add(l); setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};
const Bell: React.FC<{ at: number; deep?: boolean; vol?: number }> = ({ at, deep, vol = 0.5 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={deep ? 170 : 120} layout="none"><Audio src={staticFile(`reel/creative26/${deep ? "bell_deep" : "bell_soft"}.wav`)} volume={vol} /></Sequence>
);
const sparkle = (c: Ctx, x: number, y: number, k: number, size = 26) => {
  if (k <= 0 || k >= 1) return;
  const a = Math.sin(k * Math.PI);
  c.save(); c.translate(x, y); c.rotate(k * 1.5); c.globalAlpha = a; c.fillStyle = "#fffbe6";
  c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? size * 0.25 : size; const an = (i / 8) * Math.PI * 2; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fill();
  c.restore();
};
const chip = (c: Ctx, t: string, x: number, y: number, k: number, size = 38) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.font = SANS(size, 800); const w = c.measureText(t).width + 44;
  c.fillStyle = "rgba(20,12,4,0.72)"; c.beginPath(); c.roundRect(x - w / 2, y - size * 0.95, w, size * 1.45, 18); c.fill();
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(t, x, y + 2); c.restore();
};
const cloud = (c: Ctx, x: number, y: number, s: number, col: string, a = 1) => {
  c.save(); c.globalAlpha = a; c.fillStyle = col;
  [[0, 0, 70], [70, -20, 85], [150, 0, 70], [60, 30, 75], [-60, 20, 55], [210, 25, 50]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, 0, 7); c.fill(); });
  c.restore();
};
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)]; const k = clamp(t);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(",")})`;
};
const sky = (c: Ctx, W: number, H: number, top: string, bot: string) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
};

const StHanuman: React.FC<SP> = ({ s }) => {
  const ready = useDevaFont();
  const ls = s.lines, d = s.data, part: number = d.part;
  const L0 = ls[0], L1 = ls[1] ?? ls[0];
  const cue = (n: number, frac: number) => cueAt(L1, n, /^$/, L1.from + Math.round(L1.frames * frac));
  const bells = (
    <>
      <Bell at={0} deep={part === 1} vol={part === 1 ? 0.7 : 0.55} />
      {part === 4 ? <Bell at={s.frames - 10} deep vol={0.6} /> : null}
    </>
  );
  if (!ready) return bells;
  return (
    <>
      {bells}
      <CrayonCanvas grainAmt={0.12} vig={0.5} draw={(c, W, H, f, boil) => {
        const r = rng(2600 + part * 31 + boil);
        const tM = L1.from, c1 = cue(1, 0.45), c2 = cue(2, 0.8), end = s.frames;
        // ---- the picture ----
        if (part === 1) {   // the ocean of wisdom; the three worlds lit
          sky(c, W, H, "#0b1030", "#1b2a5a");
          const lit = (k: number) => clamp(k);
          const kSky = seg(f, c1 - 4, c1 + 10), kEarth = seg(f, c1 + 8, c1 + 22), kBelow = seg(f, c1 + 20, c1 + 34);
          for (let i = 0; i < 40; i++) { const sx = (i * 263) % W, sy = 470 + ((i * 131) % 330); c.globalAlpha = 0.35 + 0.65 * lit(kSky) * (0.6 + 0.4 * Math.sin(f / 9 + i)); c.fillStyle = "#ffe9a8"; c.beginPath(); c.arc(sx, sy, 3 + (i % 3), 0, 7); c.fill(); }
          c.globalAlpha = 1;
          // the earth: hills on the horizon
          c.fillStyle = `rgba(${40 + 140 * kEarth},${50 + 110 * kEarth},${60 + 40 * kEarth},1)`;
          c.beginPath(); c.moveTo(0, 1180); [[120, 1090], [300, 1140], [480, 1070], [700, 1150], [880, 1080], [1080, 1130]].forEach(([hx, hy]) => c.lineTo(hx, hy)); c.lineTo(W, 1200); c.lineTo(0, 1200); c.fill();
          // the sea: dark, turning to light as the meaning begins
          const kSea = seg(f, tM - 6, tM + 30);
          const g = c.createLinearGradient(0, 1170, 0, H);   // still water: a gold sheen at the horizon, blue below (v1 read as sand)
          g.addColorStop(0, mix("#1e3266", "#e8b85a", kSea)); g.addColorStop(0.3, mix("#16285a", "#3f6ea6", kSea)); g.addColorStop(1, mix("#0b1433", "#4b3f86", kBelow));
          c.fillStyle = g; c.fillRect(0, 1170, W, H - 1170);
          for (let k = 0; k < 9; k++) { const wy = 1200 + k * 34; const pts: Pt[] = []; for (let x = -20; x <= W + 20; x += 40) pts.push([x, wy + Math.sin(x / 70 + f / 12 + k) * 6]); stroke(c, pts, kSea > 0.3 ? "#fff1b8" : "#6b86c9", 3, r, { passes: 1, alpha: 0.35 + 0.4 * kSea }); }
          if (kSky > 0) chip(c, "the sky", 190, 560, kSky, 30); if (kEarth > 0) chip(c, "the earth", 880, 1040, kEarth, 30); if (kBelow > 0) chip(c, "the world below", 540, 1440, kBelow, 30);
          // the rock and Hanuman, glowing more as the line goes on
          c.fillStyle = "#3b3226"; c.beginPath(); c.ellipse(540, 1215, 210, 50, 0, 0, 7); c.fill();
          const glow = 0.5 + 0.5 * seg(f, tM, c2);
          hanuman(c, 540, 860, 0.62, "stand", f, r, { glow });
          if (f > c2) { c.save(); c.globalAlpha = 0.25 * seg(f, c2, c2 + 20); c.fillStyle = "#ffd86b"; c.fillRect(0, 440, W, 1060); c.restore(); }
        } else if (part === 2) {   // Ram's messenger, son of the Wind: flying
          sky(c, W, H, "#7dc3f0", "#f7d9a0");
          for (let i = 0; i < 5; i++) cloud(c, ((i * 300 - f * (2 + i % 2)) % 1500 + 1500) % 1500 - 200, 620 + i * 170, 0.9, "#ffffff", 0.85);
          const t = seg(f, 0, end), bob = Math.sin(f / 10) * 14;
          const hx = 280 + 520 * ease(t), hy = 980 + bob - 80 * t;
          const kW = seg(f, c1 - 6, c1 + 14);   // the wind wraps around him
          for (let k = 0; k < 4; k++) {
            const pts = circlePts(hx - 40, hy - 10, 230 + k * 40, 120 + k * 22, f / 8 + k, f / 8 + k + 4.2 * Math.max(0.15, kW), 28);
            stroke(c, pts, "#ffffff", 7 - k, r, { passes: 1, alpha: 0.35 + 0.5 * kW });
          }
          hanuman(c, hx, hy, 0.5, "fly", f, r, { rot: 1.42, glow: 0.45 + 0.35 * seg(f, tM, tM + 30) });
          chip(c, "Ram's messenger", 540, 560, seg(f, tM, tM + 10) * (1 - seg(f, c1 - 4, c1 + 2)), 40);
          chip(c, "son of Anjani · son of the Wind", 540, 560, seg(f, c1, c1 + 10), 36);
        } else if (part === 3) {   // the thunderbolt body; bad thoughts driven away, good ones kept
          const clear = seg(f, c2 - 10, c2 + 30);
          sky(c, W, H, clear > 0 ? `rgb(${40 + 150 * clear},${40 + 150 * clear},${70 + 160 * clear})` : "#28283f", clear > 0 ? `rgb(${120 + 120 * clear},${90 + 110 * clear},${90 + 60 * clear})` : "#4a3a40");
          const drift = seg(f, c1, c1 + 60);
          for (let i = 0; i < 5; i++) { const cx = -60 - drift * 800 + (i % 2) * 120, cy = 540 + i * 120; cloud(c, cx, cy + 18, 1.25, "#231d2e", 0.96 * (1 - drift)); cloud(c, cx, cy, 1.25, "#6a6380", 0.96 * (1 - drift)); }   // storm clouds lighter than the sky, dark undersides
          if (drift < 0.9) chip(c, "bad thoughts", 260 - drift * 520, 1010, seg(f, tM + 20, tM + 30) * (1 - drift), 34);
          // the lamp (good thoughts), brighter as he stays with it
          const lk = 0.4 + 0.6 * seg(f, c1 + 10, c1 + 40);
          c.fillStyle = "#8a5a2b"; c.fillRect(838, 1080, 24, 160); c.beginPath(); c.ellipse(850, 1075, 70, 22, 0, 0, 7); c.fillStyle = "#b8742e"; c.fill();
          const lg = c.createRadialGradient(850, 1010, 5, 850, 1010, 200 * lk); lg.addColorStop(0, "rgba(255,230,150,0.9)"); lg.addColorStop(1, "rgba(255,200,80,0)");
          c.fillStyle = lg; c.beginPath(); c.arc(850, 1010, 200 * lk, 0, 7); c.fill();
          c.fillStyle = "#ffcf4a"; c.beginPath(); c.ellipse(850, 1035 - 6 * Math.sin(f / 4), 16, 34 * (0.7 + lk * 0.4), 0, 0, 7); c.fill();
          chip(c, "good thoughts", 850, 1300, seg(f, c1 + 14, c1 + 24), 32);
          c.fillStyle = "#3b3226"; c.fillRect(0, 1240, W, 260);
          const pose: Pose = f > c1 - 4 ? "raise" : "stand";
          hanuman(c, 500, 930, 0.52, pose, f, r, { glow: 0.55 + 0.3 * clear });
          const fl = seg(f, tM, tM + 4) * (1 - seg(f, tM + 6, tM + 16));   // the thunderbolt flash
          if (fl > 0) {
            c.save(); c.globalAlpha = fl; stroke(c, [[640, 420], [520, 640], [600, 660], [450, 900], [530, 910], [380, 1150]], "#fffbe0", 16, r, { passes: 2 });
            c.fillStyle = `rgba(255,250,220,${0.35 * fl})`; c.fillRect(0, 0, W, H); c.restore();
          }
          chip(c, "strong as a thunderbolt", 540, 560, seg(f, tM + 4, tM + 14) * (1 - seg(f, c1 - 6, c1)), 38);
        } else {   // the portrait: golden colour, fine clothes, earrings, curly hair
          sky(c, W, H, "#3a1d06", "#9a5a12");
          const hg = c.createRadialGradient(540, 860, 60, 540, 860, 640); hg.addColorStop(0, "rgba(255,214,120,0.85)"); hg.addColorStop(1, "rgba(255,170,60,0)");
          c.fillStyle = hg; c.fillRect(0, 0, W, H);
          const z = 1.3 + 0.28 * ease(seg(f, 0, end - 20));
          const ny = 900 + 330 * z;   // keep the face near y 900 as he grows
          hanuman(c, 540, ny, z, "stand", f, r, { glow: 0.9, shine: seg(f, tM + 6, tM + 50) });
          const k1 = seg(f, c1 - 2, c1 + 18), k2 = seg(f, c1 + 14, c1 + 34);
          [-1, 1].forEach((sd) => sparkle(c, 540 + sd * 94 * z, ny - 282 * z, k1, 34));
          [[-125, -420], [130, -380], [-140, -300], [122, -250]].forEach(([hx, hy], i) => sparkle(c, 540 + hx * z, ny + hy * z, seg(f, c1 + 14 + i * 4, c1 + 30 + i * 4), 24));
          if (k2 >= 1) void 0;
        }
        // ---- the line band at the top (the chant) ----
        const kb = seg(f, 2, 14);
        c.save(); c.globalAlpha = kb;
        const bg = c.createLinearGradient(0, 120, 0, 470); bg.addColorStop(0, "rgba(12,6,2,0.78)"); bg.addColorStop(1, "rgba(12,6,2,0.0)");
        c.fillStyle = bg; c.fillRect(0, 110, W, 360);
        c.font = SANS(28, 800); c.fillStyle = "#f6c453"; c.textAlign = "center"; c.fillText(`HANUMAN CHALISA · CHAUPAI ${part} OF 4`, W / 2, 172);
        const dv: string[] = d.deva, ro: string[] = d.roman;
        dv.forEach((t, i) => { let fs = 64; c.font = DEVA(fs); while (c.measureText(t).width > W - 90 && fs > 40) { fs -= 2; c.font = DEVA(fs); } c.fillStyle = "#fff4d6"; c.fillText(t, W / 2, 256 + i * 82); });
        ro.forEach((t, i) => { let fs = 34; c.font = `italic ${SANS(fs, 600)}`; while (c.measureText(t).width > W - 90 && fs > 24) { fs -= 2; c.font = `italic ${SANS(fs, 600)}`; } c.fillStyle = "#e7d7b6"; c.fillText(t, W / 2, 404 + i * 42); });
        c.restore();
        if (part === 1 && d.hook) chip(c, d.hook, W / 2, 1600, seg(f, 4, 14) * (1 - seg(f, tM - 8, tM)), 40);   // frame 1's question, while the chant plays
        void L0;
      }} />
    </>
  );
};

// The design sheet (a still): standing, flying, kneeling, the giant form, with the locked colours.
const StHanumanSheet: React.FC<SP> = () => {
  const ready = useDevaFont();
  if (!ready) return null;
  return (
    <CrayonCanvas grainAmt={0.08} vig={0} draw={(c, W, H, f, boil) => {
      const r = rng(77 + boil);
      c.fillStyle = "#fbf3e2"; c.fillRect(0, 0, W, H);
      c.font = SANS(48, 900); c.fillStyle = "#3a2410"; c.textAlign = "center"; c.fillText("THE LOCKED HANUMAN · design sheet", W / 2, 90);
      c.font = SANS(26, 600); c.fillStyle = "#6b4a2a"; c.fillText("one drawing for every scene and every part: only the pose and the scale change", W / 2, 132);
      hanuman(c, 280, 560, 0.4, "stand", 30, r, { glow: 0.5 });
      hanuman(c, 800, 520, 0.36, "fly", 30, r, { rot: 1.42, glow: 0.4 });
      hanuman(c, 280, 1230, 0.42, "kneel", 30, r, { glow: 0.5 });
      // the giant form: tiny trees and a tiny city at his feet
      c.fillStyle = "#cfe3c2"; c.fillRect(560, 1350, 480, 40);
      for (let i = 0; i < 7; i++) { c.fillStyle = "#4d7a3a"; c.beginPath(); c.arc(590 + i * 66, 1345, 12, 0, 7); c.fill(); }
      for (let i = 0; i < 6; i++) { c.fillStyle = "#94a3b8"; c.fillRect(600 + i * 70, 1320 - (i % 3) * 8, 26, 30 + (i % 3) * 8); }
      hanuman(c, 800, 1080, 0.46, "stand", 30, r, { glow: 0.6 });
      c.font = SANS(28, 800); c.fillStyle = "#3a2410";
      [["standing", 280, 840], ["flying", 800, 700], ["kneeling, hands folded", 280, 1440], ["the giant form", 800, 1440]].forEach(([t, x, y]) => c.fillText(String(t), Number(x), Number(y)));
      const sw: [string, string][] = [["golden skin", HC.skin], ["curly hair", HC.hair], ["gold crown", HC.crown], ["saffron dhoti", HC.dhoti], ["munj thread", HC.thread], ["red tilak", HC.tilak], ["saffron flag", HC.flag], ["calm, kind face", HC.muzzle]];
      sw.forEach(([t, col], i) => {
        const x = 70 + (i % 4) * 250, y = 1530 + Math.floor(i / 4) * 90;
        c.fillStyle = col; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); stroke(c, circlePts(x, y, 26, 26), HC.ink, 3, r, { passes: 1 });
        c.font = SANS(24, 700); c.fillStyle = "#3a2410"; c.textAlign = "left"; c.fillText(t, x + 38, y + 8); c.textAlign = "center";
      });
      c.font = `700 40px "Noto Serif Deva", serif`; c.fillStyle = "#7a3f0a"; c.fillText("कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥", W / 2, 1790);
      c.font = SANS(24, 600); c.fillStyle = "#6b4a2a"; c.fillText("Hanuman Chalisa, chaupai 4: golden colour, fine clothes, earrings, curly hair", W / 2, 1840);
      void f; void easeOut;
    }} />
  );
};

export const HANUMAN_SCENES = { sk_hanuman: StHanuman, sk_hanuman_sheet: StHanumanSheet };
