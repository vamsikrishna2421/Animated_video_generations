import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// Creative 08 "Ask me first" (series/scripts/creative08_ask_first.md, script v2): take 1 / take 2. Kavya and her brother
// Teja, on their building's terrace at night, ask an AI to plan their parents' 25th anniversary surprise. Told nothing,
// it plans a 3-lakh party (a hall, catering, a band: what our test AI's generic plans looked like, priced by us).
// Rewind, TAKE 2: she reads out the line she types, "Before you plan, ask me 3 questions." (the TYPE THIS card); it asks
// our test AI's three most common questions, Teja answers (and adds the budget it never asked), the new plan costs
// 4,800, our test card, Amma and Nanna are moved, then Teja asks for his birthday without the line, the 3-lakh plan slams
// in and Kavya yells: frame 1 again. The AI is an unbranded chat app ("AI chat").
// One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "happy" | "grin" | "shock" | "sad" | "calm" | "yell" | "confused" | "smug" | "moved";
type Arms = "rest" | "phone" | "type" | "tea" | "sip" | "typetea" | "up" | "shrug" | "point" | "plate" | "album" | "palm";
type Who = "kavya" | "teja" | "amma" | "nanna";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number) => `700 ${s}px "Space Mono", "DejaVu Sans Mono", monospace`;
const GREEN = "#16a34a", RED = "#dc2626", NAVY = "#1e293b", PURPLE = "#7c3aed", PINK = "#ec4899";
const LOOK: Record<Who, { skin: string; hair: string; top: string; s: number }> = {
  kavya: { skin: "#b07650", hair: "#1a120e", top: "#be185d", s: 1.0 },
  teja: { skin: "#9c6844", hair: "#0f0f12", top: "#2563eb", s: 0.97 },
  amma: { skin: "#a36b47", hair: "#27272a", top: "#15803d", s: 0.98 },
  nanna: { skin: "#8d5b3b", hair: "#3f3f46", top: "#f1f5f9", s: 1.03 },
};
// where the two of them stand in a terrace two-shot, and in the hook (frame 1, and the loop's last frame)
const TWO: Record<"kavya" | "teja", [Pt, number]> = { kavya: [[320, 1250], 0.95], teja: [[770, 1262], 0.95] };
const HOOK: Record<"kavya" | "teja", [Pt, number]> = { kavya: [[300, 1410], 0.92], teja: [[780, 1422], 0.92] };

// ---------- props ----------
const teaGlass = (c: Ctx, x: number, y: number, s: number, r: () => number, level = 0.7) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const hw = (yy: number) => 26 - 6 * (yy + 40) / 80, top = 40 - 80 * level;
  c.beginPath(); c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(20, 40); c.lineTo(-20, 40); c.closePath();
  c.fillStyle = "rgba(226,232,240,0.35)"; c.fill();
  c.beginPath(); c.moveTo(-hw(top), top); c.lineTo(hw(top), top); c.lineTo(hw(40), 40); c.lineTo(-hw(40), 40); c.closePath();
  c.fillStyle = "#b8742e"; c.fill();
  stroke(c, [[-26, -40], [-20, 40], [20, 40], [26, -40]], "#e2e8f0", 4, r, { passes: 1, alpha: 0.9 });
  [-12, 0, 12].forEach((gx) => stroke(c, [[gx, -34], [gx * 0.85, 34]], "#fff", 2, r, { passes: 1, alpha: 0.35 }));
  c.restore();
};
const phoneProp = (c: Ctx, x: number, y: number, s: number, rot: number) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "#111827"; rrect(c, -48, -86, 96, 172, 16); c.fill();
  c.fillStyle = "#c4b5fd"; rrect(c, -40, -76, 80, 152, 10); c.fill();
  c.fillStyle = "rgba(255,255,255,0.5)"; rrect(c, -30, -60, 60, 16, 6); c.fill(); rrect(c, -30, -34, 44, 16, 6); c.fill();
  c.restore();
};
const plateProp = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 0, 150, 46, 0, 0, 7); c.fillStyle = "#cbd5e1"; c.fill();
  stroke(c, circlePts(0, 0, 150, 46), "#64748b", 4, r, { passes: 1, alpha: 0.7 });
  c.beginPath(); c.moveTo(-110, 6); c.quadraticCurveTo(0, -70, 110, 6); c.quadraticCurveTo(0, 30, -110, 6); c.closePath();   // the pesarattu, folded
  c.fillStyle = "#a3a83a"; c.fill();
  const rs = rng(4); for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(-80 + rs() * 160, -18 + rs() * 22, 4, 0, 7); c.fillStyle = "#65742b"; c.fill(); }
  c.beginPath(); c.ellipse(118, -10, 26, 12, 0, 0, 7); c.fillStyle = "#f8fafc"; c.fill();   // a little chutney
  c.restore();
};
const albumProp = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#991b1b"; rrect(c, -150, -96, 300, 192, 10); c.fill();
  c.fillStyle = "#fef9c3"; c.fillRect(-140, -86, 136, 172); c.fillRect(4, -86, 136, 172);
  [[-72, -20], [72, -20]].forEach(([px, py], i) => {   // a wedding photo on each page: two heads
    c.fillStyle = i ? "#fde68a" : "#e7e5e4"; c.fillRect(px - 52, py - 52, 104, 96);
    c.beginPath(); c.arc(px - 18, py - 10, 16, 0, 7); c.arc(px + 18, py - 8, 16, 0, 7); c.fillStyle = "#78350f"; c.fill();
    c.fillStyle = "#b91c1c"; c.fillRect(px - 38, py + 8, 76, 36);
  });
  c.font = caveat(34); c.fillStyle = INK; c.textAlign = "center"; c.fillText("2001", -72, 70); c.fillText("our day", 72, 70);
  stroke(c, rrectPts(-150, -96, 300, 192), INK, 3, r, { passes: 1, alpha: 0.5 });
  c.restore();
};
const spray = (c: Ctx, x: number, y: number, k: number) => {
  if (k <= 0 || k >= 1) return;
  const rs = rng(31);
  c.save();
  for (let i = 0; i < 28; i++) {
    const a = -Math.PI * (0.55 + 0.42 * rs()), d = (50 + rs() * 320) * easeOut(k), sz = 5 + rs() * 10;
    c.globalAlpha = clamp(1.3 - k); c.fillStyle = i % 3 ? "#b8742e" : "#d6a165";
    c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + 160 * k * k, sz, 0, 7); c.fill();
  }
  c.restore();
};

// ---------- people ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, rad = 24) => {
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, rad, rad), INK, 3, r, { passes: 1, alpha: 0.55 });
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  if (who === "kavya") { c.fillStyle = L.hair; c.beginPath(); c.ellipse(108, hy + 70, 30, 112, -0.25, 0, 7); c.fill(); }   // her ponytail
  if (who === "amma") {   // a bun with a string of jasmine
    c.fillStyle = L.hair; c.beginPath(); c.arc(86, hy + 92, 42, 0, 7); c.fill();
    for (let q = 0; q < 9; q++) { const a = -0.7 + q * 0.33; c.beginPath(); c.arc(86 + Math.cos(a) * 46, hy + 92 + Math.sin(a) * 46, 8, 0, 7); c.fillStyle = "#fff"; c.fill(); }
  }
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "teja") {   // short, spiky
    c.ellipse(0, hy - 58, 100, 64, 0, Math.PI, 0); c.lineTo(96, hy - 30); c.quadraticCurveTo(40, hy - 72, 0, hy - 74); c.quadraticCurveTo(-40, hy - 72, -96, hy - 30);
    c.closePath(); c.fill(); c.beginPath();
    for (let k = -3; k <= 3; k++) { const x = k * 26; c.moveTo(x - 20, hy - 96); c.lineTo(x + 4, hy - 150 - (k % 2 ? 0 : 14)); c.lineTo(x + 22, hy - 96); }
  } else if (who === "amma") {   // parted in the middle
    c.ellipse(0, hy - 56, 100, 72, 0, Math.PI, 0); c.lineTo(100, hy + 14); c.quadraticCurveTo(52, hy - 58, 4, hy - 80); c.lineTo(-4, hy - 80); c.quadraticCurveTo(-52, hy - 58, -100, hy + 14);
  } else if (who === "nanna") {   // going bald on top, grey at the sides
    c.ellipse(-86, hy - 24, 20, 54, 0.1, 0, 7); c.ellipse(86, hy - 24, 20, 54, -0.1, 0, 7); c.ellipse(0, hy - 104, 56, 14, 0, Math.PI, 0);
  } else {
    c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(30, hy - 76, -20, hy - 78); c.quadraticCurveTo(-60, hy - 66, -98, hy - 10);
  }
  c.closePath(); c.fill();
  if (who === "amma") { stroke(c, [[0, hy - 110], [0, hy - 82]], RED, 6, r, { passes: 1 }); stroke(c, [[-60, hy - 84], [-90, hy - 20]], "#a1a1aa", 6, r, { passes: 1, alpha: 0.8 }); }   // sindoor, a grey streak
  if (who === "nanna") { c.fillStyle = "#a1a1aa"; [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 90, hy - 8, 10, 26, 0, 0, 7); c.fill(); }); }
  if (who === "kavya") { c.beginPath(); c.arc(0, hy - 48, 6, 0, 7); c.fillStyle = "#7f1d1d"; c.fill(); }
  if (who === "amma") { c.beginPath(); c.arc(0, hy - 46, 10, 0, 7); c.fillStyle = RED; c.fill(); }
  const brow = m === "sad" || m === "moved" ? [-180, -160] : m === "yell" ? [-152, -170] : m === "shock" || m === "confused" ? [-182, -180] : [-164, -164];
  [-1, 1].forEach((sx) => {
    let [yi, yo] = brow;
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    if (m === "confused" && sx < 0) { yi = -160; yo = -158; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], who === "nanna" ? "#52525b" : L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "grin" || m === "moved") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (m === "moved") [-50, 50].forEach((tx) => { c.beginPath(); c.moveTo(tx, hy + 10); c.quadraticCurveTo(tx + 10, hy + 30, tx, hy + 36); c.quadraticCurveTo(tx - 10, hy + 30, tx, hy + 10); c.fillStyle = "#7dd3fc"; c.fill(); });
  if (who === "nanna") {
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 26), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  if (who === "nanna") { c.fillStyle = "#3f3f46"; c.beginPath(); c.ellipse(-20, hy + 56, 26, 11, 0.2, 0, 7); c.ellipse(20, hy + 56, 26, 11, -0.2, 0, 7); c.fill(); }   // a thick moustache
  if (who === "teja") { c.fillStyle = "rgba(15,15,18,0.35)"; c.beginPath(); c.ellipse(0, hy + 58, 30, 6, 0, 0, 7); c.fill(); }   // a first moustache
  const my = hy + 80, open = talk || m === "yell" || m === "shock";
  if (open) {
    const w = m === "yell" ? 32 : talk ? 21 : 15, h = m === "yell" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "grin" || m === "calm" || m === "moved") {
    stroke(c, circlePts(0, my - 8, m === "grin" ? 32 : 24, m === "grin" ? 18 : 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "sad") stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  else if (m === "confused") stroke(c, [[-16, my + 4], [0, my - 2], [16, my + 4]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (who === "kavya") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 40, 8, 0, 7); c.fillStyle = "#facc15"; c.fill(); c.beginPath(); c.arc(sx * 94, hy + 58, 12, Math.PI, 0); c.fill(); });   // jhumkas
  if (who === "amma") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 28, 7, 0, 7); c.fillStyle = "#facc15"; c.fill(); });
};
type PersonOpts = { headDy?: number; spray?: number };
const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number, o: PersonOpts = {}) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(L.s * sc, L.s * sc);
  c.save();
  const belly = who === "nanna" ? 24 : 0;
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.quadraticCurveTo(178 + belly, 330, 192, 780); c.lineTo(-192, 780);
  c.quadraticCurveTo(-178 - belly, 330, -140, 34); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "kavya") {   // kurti with little white dots, a yellow dupatta over one shoulder
    c.fillStyle = "rgba(255,255,255,0.55)";
    for (let y = 70; y < 780; y += 54) for (let x = -180 + ((y / 54) % 2) * 27; x < 190; x += 54) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
    c.fillStyle = "#facc15"; c.beginPath(); c.moveTo(-150, 28); c.lineTo(-78, 28); c.lineTo(30, 780); c.lineTo(-70, 780); c.closePath(); c.fill();
  }
  if (who === "teja") { c.fillStyle = "#f8fafc"; c.fillRect(-200, 150, 400, 30); c.fillStyle = "#facc15"; c.beginPath(); c.moveTo(20, 230); c.lineTo(-24, 320); c.lineTo(6, 320); c.lineTo(-12, 400); c.lineTo(40, 300); c.lineTo(10, 300); c.closePath(); c.fill(); }
  if (who === "amma") {   // the saree's pallu with a gold border, the blouse at one shoulder
    c.fillStyle = "#b91c1c"; c.beginPath(); c.moveTo(60, 20); c.lineTo(150, 30); c.lineTo(170, 160); c.lineTo(90, 120); c.closePath(); c.fill();
    c.fillStyle = "#166534"; c.beginPath(); c.moveTo(-150, 24); c.lineTo(-40, 24); c.lineTo(200, 600); c.lineTo(80, 780); c.closePath(); c.fill();
    stroke(c, [[-40, 24], [200, 600]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 }); stroke(c, [[-150, 24], [80, 780]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 });
  }
  if (who === "nanna") {   // a checked shirt, a pocket and a pen
    c.strokeStyle = "rgba(96,165,250,0.45)"; c.lineWidth = 4;
    for (let x = -200; x < 210; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 780); c.stroke(); }
    for (let y = 20; y < 780; y += 40) { c.beginPath(); c.moveTo(-210, y); c.lineTo(210, y); c.stroke(); }
    stroke(c, rrectPts(40, 120, 72, 70), "#94a3b8", 4, r, { passes: 1 }); stroke(c, [[60, 96], [60, 150]], "#1d4ed8", 7, r, { passes: 1 });
    [90, 190, 290, 390].forEach((y) => { c.beginPath(); c.arc(0, y, 6, 0, 7); c.fillStyle = "#94a3b8"; c.fill(); });
  }
  c.restore();
  stroke(c, [[-140, 34], [-180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-150, 380]], rr: Pt[] = [[178, 230], [150, 380]];
  if (a === "phone") rr = [[182, 220], [118, 120]];
  else if (a === "type") { l = [[-150, 230], [-50, 160]]; rr = [[150, 230], [50, 160]]; }
  else if (a === "tea") rr = [[178, 220], [120, 130]];
  else if (a === "sip") rr = [[172, 170], [44, -16]];
  else if (a === "typetea") { l = [[-280, 150], [-420, 100]]; rr = [[178, 220], [120, 130]]; }
  else if (a === "up") { l = [[-220, -20], [-112, -196]]; rr = [[220, -20], [112, -196]]; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  else if (a === "point") rr = [[220, 30], [320, -110]];
  else if (a === "plate") { l = [[-170, 230], [-60, 200]]; rr = [[170, 230], [60, 200]]; }
  else if (a === "album") { l = [[-170, 240], [-120, 170]]; rr = [[170, 240], [120, 170]]; }
  else if (a === "palm") rr = [[176, 110], [22, -150]];
  limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r);
  const front = a === "sip" || a === "palm";   // a hand in front of the face is drawn after it
  if (!front) { limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  if (a === "phone") phoneProp(c, 126, 60, 1, -0.1);
  if (a === "tea" || a === "typetea") teaGlass(c, 120, 92, 1, r);
  if (a === "plate") plateProp(c, 0, 186, 1, r);
  if (a === "album") albumProp(c, 0, 140, 1, r);
  c.save(); c.translate(0, o.headDy ?? 0); face(c, who, m, talk, r); c.restore();
  if (front) {
    limb(c, [R, rr[0], rr[1]], L.top, r);
    if (a === "sip") { teaGlass(c, 34, -56, 1, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
    else palm(c, rr[1][0], rr[1][1], L.skin, r, 40);
  }
  spray(c, -10, -46, o.spray ?? 0);
  c.restore();
};

// ---------- the terrace at night ----------
const bulbs = (c: Ctx, pts: Pt[], f: number, n: number, seed: number) => {
  c.save(); c.strokeStyle = "#1f2937"; c.lineWidth = 3; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); c.stroke();
  const cols = ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#fb923c"];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (1 - t) * (1 - t) * pts[0][0] + 2 * (1 - t) * t * pts[1][0] + t * t * pts[2][0];
    const y = (1 - t) * (1 - t) * pts[0][1] + 2 * (1 - t) * t * pts[1][1] + t * t * pts[2][1] + 10;
    const on = 0.55 + 0.45 * Math.sin(f / 6 + i * 2.1 + seed);
    c.globalAlpha = 0.35 * on; c.fillStyle = cols[(i + seed) % cols.length]; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill();
    c.globalAlpha = 0.6 + 0.4 * on; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill();
  }
  c.restore();
};
const terrace = (c: Ctx, W: number, H: number, f: number, r: () => number, deco = 0) => {
  const g = c.createLinearGradient(0, 0, 0, 1450);
  g.addColorStop(0, "#060a22"); g.addColorStop(0.55, "#1b1847"); g.addColorStop(1, "#43217a");
  c.fillStyle = g; c.fillRect(0, 0, W, 1460);
  const rs = rng(77);
  for (let i = 0; i < 70; i++) {
    const x = rs() * W, y = rs() * 980, z = rs();
    c.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(f / 10 + i * 1.7)) * z; c.fillStyle = "#fff";
    c.beginPath(); c.arc(x, y, 1.2 + z * 2.4, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  const mg = c.createRadialGradient(860, 300, 40, 860, 300, 200); mg.addColorStop(0, "rgba(254,240,190,0.35)"); mg.addColorStop(1, "rgba(254,240,190,0)");
  c.fillStyle = mg; c.fillRect(660, 100, 400, 400);
  c.beginPath(); c.arc(860, 300, 66, 0, 7); c.fillStyle = "#fef3c7"; c.fill();
  c.fillStyle = "rgba(202,180,120,0.45)"; [[840, 286, 12], [884, 320, 9], [876, 272, 6]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fill(); });
  const city = (base: number, col: string, seed: number, hMin: number, hMax: number, lit: number) => {
    const rc = rng(seed); let x = -20;
    while (x < W + 20) {
      const w = 70 + rc() * 120, h = hMin + rc() * (hMax - hMin);
      c.fillStyle = col; c.fillRect(x, base - h, w, h + 6);
      for (let wy = base - h + 18; wy < base - 16; wy += 30) for (let wx = x + 12; wx < x + w - 16; wx += 26) {
        if (rc() < lit) { c.globalAlpha = 0.75; c.fillStyle = rc() < 0.8 ? "#fde68a" : "#fdba74"; c.fillRect(wx, wy, 12, 14); c.globalAlpha = 1; }
      }
      x += w + 6 + rc() * 20;
    }
  };
  city(1440, "#2a2360", 3, 200, 420, 0.25);
  city(1460, "#15123a", 5, 80, 240, 0.35);
  if (Math.floor(f / 20) % 2 === 0) { c.fillStyle = "#ef4444"; c.beginPath(); c.arc(612, 1030, 7, 0, 7); c.fill(); }   // a tower light, blinking
  // the water tank on its stand, left
  c.fillStyle = "#57534e"; c.fillRect(10, 1240, 210, 330);
  c.fillStyle = "#18181b"; rrect(c, -10, 860, 240, 390, 34); c.fill();
  [960, 1060, 1160].forEach((y) => stroke(c, [[-10, y], [230, y]], "#3f3f46", 6, r, { passes: 1 }));
  c.beginPath(); c.ellipse(110, 860, 120, 26, 0, 0, 7); c.fillStyle = "#27272a"; c.fill();
  // the clothesline: a towel and a shirt
  stroke(c, [[230, 900], [640, 940], [1080, 905]], "#cbd5e1", 3, r, { passes: 1, alpha: 0.7 });
  c.fillStyle = "#ea580c"; c.fillRect(905, 912, 96, 150); c.fillStyle = "#fdba74"; c.fillRect(905, 1030, 96, 12);
  // fairy lights
  bulbs(c, [[0, 760], [540, 880], [1080, 740]], f, 14, 0);
  // the parapet and the floor
  c.fillStyle = "#6b7280"; c.fillRect(0, 1440, W, 140); c.fillStyle = "#a8a29e"; c.fillRect(0, 1426, W, 24);
  [[120, 1500], [520, 1530], [860, 1490]].forEach(([x, y]) => { c.fillStyle = "rgba(41,37,36,0.25)"; c.beginPath(); c.ellipse(x, y, 70, 22, 0, 0, 7); c.fill(); });
  const fg = c.createLinearGradient(0, 1580, 0, H); fg.addColorStop(0, "#57534e"); fg.addColorStop(1, "#292524");
  c.fillStyle = fg; c.fillRect(0, 1580, W, H - 1580);
  for (let k = 1; k < 6; k++) { const y = 1580 + k * k * 14; stroke(c, [[0, y], [W, y]], "#44403c", 3, r, { passes: 1, alpha: 0.6 }); }
  for (let k = -6; k <= 6; k++) stroke(c, [[540 + k * 60, 1580], [540 + k * 260, H]], "#44403c", 3, r, { passes: 1, alpha: 0.5 });
  // a tulsi pot on the parapet, right
  c.fillStyle = "#c2410c"; c.beginPath(); c.moveTo(930, 1426); c.lineTo(1050, 1426); c.lineTo(1030, 1340); c.lineTo(950, 1340); c.closePath(); c.fill();
  [[990, 1290, 40], [960, 1310, 30], [1020, 1312, 30], [990, 1250, 28]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = "#15803d"; c.fill(); });
  if (deco > 0) {   // the surprise: more lights, marigold garlands, "25" balloons, a speaker playing their song
    c.save(); c.globalAlpha = clamp(deco);
    bulbs(c, [[0, 560], [540, 690], [1080, 560]], f, 16, 2);
    bulbs(c, [[0, 1000], [540, 1110], [1080, 990]], f, 14, 4);
    for (let sw = 0; sw < 4; sw++) for (let q = 0; q <= 10; q++) {
      const t = q / 10, x = sw * 270 + t * 270, y = 1430 + Math.sin(t * Math.PI) * 50;
      c.beginPath(); c.arc(x, y, 15, 0, 7); c.fillStyle = q % 2 ? "#f97316" : "#facc15"; c.fill();
    }
    [["2", 170, 330], ["5", 300, 350]].forEach(([t, x, y]) => {
      const bx = Number(x), by = Number(y) + Math.sin(f / 15 + bx) * 8;
      stroke(c, [[bx, by + 90], [bx + 20, by + 380]], "#e5e7eb", 2, r, { passes: 1, alpha: 0.7 });
      c.font = SANS(200, 900); c.fillStyle = "#f59e0b"; c.textAlign = "center"; c.fillText(String(t), bx, by + 70);
      c.lineWidth = 6; c.strokeStyle = "#fde68a"; c.strokeText(String(t), bx, by + 70);
    });
    c.fillStyle = "#111827"; rrect(c, 60, 760, 110, 100, 16); c.fill();
    c.beginPath(); c.arc(115, 810, 30, 0, 7); c.fillStyle = "#374151"; c.fill();
    for (let q = 0; q < 4; q++) {
      const t = ((f / 40) + q / 4) % 1;
      c.globalAlpha = clamp(deco) * (1 - t); c.font = SANS(60); c.fillStyle = "#fde68a"; c.textAlign = "center";
      c.fillText(q % 2 ? "♪" : "♫", 130 + t * 160 + Math.sin(t * 6 + q) * 30, 740 - t * 300);
    }
    c.restore();
  }
};

// ---------- the AI chat app (unbranded) ----------
const aiAvatar = (c: Ctx, x: number, y: number, s: number, f: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-40, -40, 40, 40); g.addColorStop(0, "#8b5cf6"); g.addColorStop(1, "#ec4899");
  c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fillStyle = g; c.fill();
  c.rotate(f / 40); c.fillStyle = "#fff"; c.beginPath();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, q = k % 2 ? 7 : 24; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.fill(); c.restore();
};
const PLAN1 = ["🏛️ hall for 200 guests", "🍛 catering + sweets", "🎧 DJ + live band"];
const PLAN2 = ["🥞 pesarattu, made by you two", "🎵 their wedding song + lights", "📸 an album of old photos"];
const PRICE2 = ["₹400", "₹1,400", "₹3,000"];   // adds up to the total, 4,800
// the AI's plan as a card: frame 1 (the 3-lakh plan), the chat (both plans), the loop's slam
const planCard = (c: Ctx, x: number, y: number, w: number, h: number, f: number, r: () => number,
  o: { title: string; items: string[]; ks: number[]; total: string; totalK: number; totalCol: string; size?: number; strike?: string; note?: string; shake?: number;
    prices?: string[]; head?: boolean; hideTotal?: boolean }) => {
  const sz = o.size ?? 50, top = o.head === false ? -70 : 0;
  c.save();
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 14, w, h, 36); c.fill();
  c.fillStyle = "#fff"; rrect(c, x, y, w, h, 36); c.fill();
  stroke(c, rrectPts(x, y, w, h), "#cbd5e1", 4, r, { passes: 1 });
  if (o.head !== false) {
    aiAvatar(c, x + 70, y + 70, 0.75, f);
    c.font = SANS(34, 700); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("AI chat", x + 116, y + 82);
  }
  c.font = SANS(sz + 4, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText(o.title, x + w / 2, y + 150 + top);
  o.items.forEach((t, i) => {
    const k = o.ks[i] ?? 1; if (k <= 0) return;
    const ly = y + 150 + top + sz + 40 + i * (sz + 30), dx = (1 - easeOut(clamp(k * 2))) * 40;
    c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(sz, 600); c.fillStyle = INK; c.textAlign = "left";
    c.fillText(t, x + 40 + dx, ly);
    if (o.prices?.[i]) { c.font = SANS(sz, 800); c.fillStyle = "#334155"; c.textAlign = "right"; c.fillText(o.prices[i], x + w - 40 + dx, ly); }
    c.restore();
  });
  const ty = y + h - 50, top2 = o.strike ? 110 : 0;   // with a struck-out old total, the total block is taller
  if (o.hideTotal) { c.restore(); return; }
  stroke(c, [[x + 40, ty - 140 - top2], [x + w - 40, ty - 140 - top2]], "#e2e8f0", 4, r, { passes: 1 });
  c.font = SANS(40, 700); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("TOTAL", x + 50, ty - 92 - top2);
  if (o.strike) {   // the old plan's total, big and struck out
    c.font = SANS(84, 900); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(o.strike, x + w / 2, ty - 120);
    const sw = c.measureText(o.strike).width; stroke(c, [[x + w / 2 - sw / 2 - 16, ty - 140], [x + w / 2 + sw / 2 + 16, ty - 158]], RED, 12, r, { passes: 2 });
  }
  if (o.totalK > 0) {
    const q = easeOut(clamp(o.totalK)), sh = (o.shake ?? 0) * Math.sin(f * 2.3) * 8;
    c.save(); c.translate(x + w / 2 + sh, ty); c.scale(1.5 - 0.5 * q, 1.5 - 0.5 * q); c.globalAlpha = clamp(o.totalK * 3);
    c.font = SANS(118, 900); c.fillStyle = o.totalCol; c.textAlign = "center"; c.fillText(o.total, 0, 0); c.restore();
  }
  if (o.note && o.totalK > 0) { c.font = SANS(38, 800); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText(o.note, x + w - 50, ty - 92 - top2); }
  c.restore();
};
// frame 1 and the loop's last frame: the chat on Kavya's phone, the request (two lines in both, so the plan sits in the
// same place) and the 3-lakh plan
const hookPhone = (c: Ctx, W: number, f: number, r: () => number, ask: Ln, shake: number) => {
  c.save();
  c.fillStyle = "rgba(4,8,40,0.45)"; rrect(c, 52, 222, W - 92, 904, 64); c.fill();
  c.fillStyle = "#0b0b12"; rrect(c, 40, 206, W - 80, 904, 60); c.fill();
  c.fillStyle = "#f1f5f9"; rrect(c, 60, 226, W - 120, 864, 46); c.fill();
  aiAvatar(c, 126, 276, 0.7, f);
  c.font = caveat(50); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 168, 292);
  const y = msg(c, W, 316, ask, true, 1, r, 36);
  planCard(c, 84, y - 8, W - 168, 1076 - y, f, r, { title: "YOUR SURPRISE PLAN ✨", items: PLAN1, ks: [1, 1, 1], total: "₹3,00,000", totalK: 1,
    totalCol: RED, size: 56, shake, head: false });
  c.restore();
};
const BDAY: [string, boolean][] = [["Plan my birthday", false], ["party! 🎂", false]];
type Ln = [string, boolean][];   // a message's lines: [text, highlighted]
const msg = (c: Ctx, W: number, y: number, lines: Ln, me: boolean, k: number, r: () => number, size = 40, col?: string) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const w = Math.max(...lines.map(([t]) => c.measureText(t).width)) + 60, h = lines.length * (size + 16) + 34;
  const x = me ? W - 116 - w : 116;
  c.fillStyle = col ?? (me ? "#dcf8c6" : "#fff"); rrect(c, x, y, w, h, 26); c.fill();
  stroke(c, rrectPts(x, y, w, h), "#cbd5e1", 2, r, { passes: 1 });
  lines.forEach(([t, hi], i) => {
    const ly = y + 30 + size + i * (size + 16) - 8;
    if (hi) { c.fillStyle = "#fde047"; c.fillRect(x + 22, ly - size + 2, c.measureText(t).width + 16, size + 12); }
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, x + 30, ly);
  });
  c.restore();
  return y + h + 26;
};
const phoneScreen = (c: Ctx, W: number, H: number, f: number, r: () => number, sub = "online") => {
  const g = c.createRadialGradient(W / 2, 800, 100, W / 2, 800, 1200); g.addColorStop(0, "#312e81"); g.addColorStop(1, "#0b0a24");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "#0b0b12"; rrect(c, 52, 112, W - 104, 1370, 70); c.fill();
  c.fillStyle = "#f1f5f9"; rrect(c, 76, 136, W - 152, 1322, 50); c.fill();
  aiAvatar(c, 160, 286, 0.9, f);
  c.font = caveat(56); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 218, 290);
  c.font = handF(30); c.fillStyle = "#64748b"; c.fillText(sub, 220, 326);
  stroke(c, [[96, 352], [W - 96, 352]], "#cbd5e1", 3, r, { passes: 1 });
};
const ASK1: Ln = [["Plan a surprise for our", false], ["parents' 25th anniversary.", false]];
const TRICK: Ln = [["Before you plan,", true], ["ask me 3 questions.", true]];
const typeBox = (c: Ctx, W: number, r: () => number, k: number, f: number) => {
  const full = "Before you plan, ask me 3 questions.", t = full.slice(0, Math.floor(full.length * clamp(k)));
  // what she types, big, for sound-off viewers
  c.font = SANS(40, 700); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("Kavya adds one line:", W / 2, 520);
  c.font = SANS(80, 800); c.textAlign = "left";
  const put = (txt: string, yy: number) => {   // two fixed lines: "Before you plan," | "ask me 3 questions."
    if (!txt.trim()) return;
    const w = c.measureText(txt.trim()).width, x0 = (W - c.measureText(yy < 700 ? "Before you plan," : "ask me 3 questions.").width) / 2;
    c.fillStyle = "#fde047"; c.fillRect(x0 - 12, yy - 70, w + 24, 92); c.fillStyle = INK; c.fillText(txt.trim(), x0, yy);
  };
  put(t.slice(0, 17), 660); put(t.slice(17), 780);
  // the message box
  c.fillStyle = "#fff"; rrect(c, 96, 1200, W - 192, 230, 30); c.fill();
  stroke(c, rrectPts(96, 1200, W - 192, 230), PURPLE, 4, r, { passes: 1 });
  c.font = SANS(36, 600); c.textAlign = "left"; c.fillStyle = INK;
  c.fillText("Plan a surprise for our parents' 25th", 126, 1252); c.fillText("anniversary.", 126, 1298);
  const tw = c.measureText("anniversary. ").width, a = t.slice(0, 17).trimEnd(), b = t.slice(17);   // "Before you plan," | "ask me 3 questions."
  if (a) { c.fillStyle = "#fde047"; c.fillRect(126 + tw - 4, 1266, c.measureText(a).width + 8, 44); c.fillStyle = INK; c.fillText(a, 126 + tw, 1298); }
  if (b) { c.fillStyle = "#fde047"; c.fillRect(122, 1312, c.measureText(b).width + 8, 44); c.fillStyle = INK; c.fillText(b, 126, 1344); }
  if (Math.floor(f / 8) % 2 === 0 && k < 1) { const cx = b ? 130 + c.measureText(b).width : 126 + tw + c.measureText(a).width + 4; c.fillStyle = PURPLE; c.fillRect(cx, b ? 1312 : 1266, 4, 44); }
  c.beginPath(); c.arc(W - 160, 1380, 34, 0, 7); c.fillStyle = PURPLE; c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.moveTo(W - 174, 1362); c.lineTo(W - 142, 1380); c.lineTo(W - 174, 1398); c.closePath(); c.fill();
};
const typeThis = (c: Ctx, W: number, r: () => number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#0f172a"; rrect(c, 70, 380, W - 140, 760, 34); c.fill();
  stroke(c, rrectPts(70, 380, W - 140, 760), "#facc15", 6, r, { passes: 1 });
  c.font = SANS(58, 800); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("TYPE THIS 📋", W / 2, 480);
  c.font = SANS(38, 600); c.fillStyle = "#cbd5e1"; c.fillText("after any \"plan ...\" request:", W / 2, 560);
  c.font = SANS(76, 800); c.fillStyle = "#fff"; c.fillText("\u201cBefore you plan,", W / 2, 700); c.fillText("ask me 3 questions.\u201d", W / 2, 800);
  c.font = SANS(40, 800); c.fillStyle = "#e2e8f0"; c.fillText("works in ChatGPT, Gemini, Claude too", W / 2, 910);
  c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; c.fillText("copy it from the caption ↓", W / 2, 1060);
  c.restore();
};
type ChatMode = "plan1" | "questions" | "plan2" | "total" | "typing";
const chat = (c: Ctx, W: number, H: number, f: number, r: () => number, mode: ChatMode, k: number[]) => {
  phoneScreen(c, W, H, f, r, mode === "typing" ? "new chat · TAKE 2" : "online");
  if (mode === "plan1") {
    const y = msg(c, W, 386, ASK1, true, 1, r, 40);
    planCard(c, 110, y, W - 220, 1440 - y - 20, f, r, { title: "YOUR SURPRISE PLAN ✨", items: PLAN1, ks: [1, 1, 1], total: "₹3,00,000", totalK: 1, totalCol: RED, size: 54 });
    if ((k[0] ?? 0) > 0) stamp(c, "RECEPTION?!", W / 2, 1090, 120, RED, k[0], r, -0.08);
  }
  if (mode === "questions") {
    let y = msg(c, W, 386, [...ASK1, ...TRICK], true, 1, r, 40);
    y = msg(c, W, y, [["Sure! First, 3 questions:", false]], false, k[0] ?? 1, r, 42);
    const qs = ["1. What do they love? ❤️", "2. Any special place? 📍", "3. A big party, or small? 🎉"];
    qs.forEach((t, i) => { y = msg(c, W, y, [[t, false]], false, k[i + 1] ?? 0, r, 50, "#ede9fe"); });
    if ((k[4] ?? 0) > 0) tag(c, "our test AI asked these", W / 2, Math.min(1400, y + 70), 66, "#0f172a", "#facc15", -0.02, k[4]);
  }
  if (mode === "plan2" || mode === "total") {
    const y = msg(c, W, 386, [["Old songs for Amma, pesarattu for", false], ["Nanna. Our terrace. Small, ₹5,000 max!", false]], true, 1, r, 36);
    planCard(c, 100, y, W - 200, 1440 - y - 20, f, r, { title: "YOUR PLAN 💛", items: PLAN2, ks: mode === "total" ? [1, 1, 1] : k.slice(0, 3), total: "₹4,800",
      totalK: mode === "total" ? (k[0] ?? 0) : 0, totalCol: GREEN, size: 44, strike: mode === "total" ? "₹3,00,000" : undefined, note: "budget ₹5,000 ✓",
      prices: PRICE2, hideTotal: mode !== "total" });
  }
  if (mode === "typing") { typeBox(c, W, r, k[0] ?? 0, f); typeThis(c, W, r, k[1] ?? 0); }
};

// ---------- the TAKE 2 rewind ----------
const vhs = (c: Ctx, W: number, H: number, f: number, k: number) => {
  if (k <= 0) return;
  const rs = rng(f * 13 + 5);
  for (let i = 0; i < 10; i++) {
    const y = Math.floor(rs() * H), h = Math.floor(20 + rs() * 100), dx = (rs() - 0.5) * 160 * k;
    c.drawImage(c.canvas, 0, y, W, h, dx, y, W, h);
  }
  c.fillStyle = `rgba(30,60,170,${0.2 * k})`; c.fillRect(0, 0, W, H);
  c.fillStyle = `rgba(0,0,0,${0.22 * k})`; for (let y = 0; y < H; y += 6) c.fillRect(0, y, W, 2);
  const by = H - ((f * 41) % (H + 200));
  c.fillStyle = `rgba(255,255,255,${0.25 * k})`; c.fillRect(0, by, W, 70);
  for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${0.5 * k * rs()})`; c.fillRect(rs() * W, rs() * H, 2 + rs() * 8, 2); }
  c.save(); c.globalAlpha = clamp(k * 2); c.font = MONO(70); c.textAlign = "left";
  if (Math.floor(f / 6) % 2 === 0) {
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(50, 262, c.measureText("◀◀ REWIND").width + 40, 92);
    c.fillStyle = "#fff"; c.fillText("◀◀ REWIND", 70, 330);
  }
  c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 8; c.fillStyle = "#fff";
  c.font = MONO(48); c.fillText(`00:00:${String(Math.max(0, 9 - Math.floor(f / 3))).padStart(2, "0")}`, 70, 1440);
  c.restore();
};
const slate = (c: Ctx, W: number, f: number, r: () => number, k: number, clap: number) => {
  if (k <= 0) return;
  c.save(); c.translate(W / 2, 980); const q = easeOut(clamp(k)); c.scale(0.6 + 0.4 * q, 0.6 + 0.4 * q); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#111827"; rrect(c, -340, -200, 680, 440, 18); c.fill();
  stroke(c, rrectPts(-340, -200, 680, 440), "#e5e7eb", 4, r, { passes: 1, alpha: 0.6 });
  c.font = SANS(44, 800); c.fillStyle = "#e5e7eb"; c.textAlign = "left"; c.fillText("SCENE: the anniversary plan", -300, -112);
  c.font = caveat(170); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("TAKE 2", 0, 60);
  c.font = SANS(50, 800); c.fillStyle = "#facc15"; c.fillText("this time, it asks first", 0, 170);
  const stick = (yy: number) => {   // the striped clapper stick
    c.fillStyle = "#111827"; c.fillRect(-340, yy - 40, 680, 70);
    c.save(); c.beginPath(); c.rect(-340, yy - 40, 680, 70); c.clip(); c.fillStyle = "#f8fafc";
    for (let x = -360; x < 360; x += 120) { c.beginPath(); c.moveTo(x, yy + 30); c.lineTo(x + 60, yy + 30); c.lineTo(x + 110, yy - 40); c.lineTo(x + 50, yy - 40); c.closePath(); c.fill(); }
    c.restore();
  };
  stick(-200 - 0);
  c.save(); c.translate(-340, -272); c.rotate(-0.42 * (1 - easeOut(clamp(clap)))); c.translate(340, 272); stick(-272); c.restore();
  c.restore();
  void f;
};

// ---------- the "what we told it" card (lines 4 and 7) ----------
const ROWS: [string, string, string][] = [["❤️", "what they love", "Amma: old songs · Nanna: pesarattu"], ["📍", "a special place", "our own terrace"],
  ["🎉", "big or small? budget?", "small · ₹5,000 max"]];
const toldCard = (c: Ctx, W: number, r: () => number, k: number, fills: number[], nothingK: number, head: string) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 80, y = 250, w = W - 160, h = fills.length ? 660 : 400;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 14, w, h, 30); c.fill();
  c.fillStyle = "#fffbeb"; rrect(c, x, y, w, h, 30); c.fill();
  c.fillStyle = "#a16207"; rrect(c, W / 2 - 90, y - 28, 180, 56, 14); c.fill();
  c.font = SANS(50, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText(head, W / 2, y + 104);
  if (fills.length) ROWS.forEach(([e, label, val], i) => {
    const ry = y + 190 + i * 150;
    c.font = SANS(40, 700); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(`${e} ${label}:`, x + 50, ry);
    const q = fills[i] ?? 0;
    if (q > 0) { c.save(); c.globalAlpha = clamp(q * 3); c.font = SANS(val.length > 20 ? 42 : 54, 800); c.fillStyle = GREEN; c.fillText(`✓ ${val}`, x + 50, ry + 62); c.restore(); }
    else { c.font = SANS(70, 900); c.fillStyle = RED; c.fillText("?", x + 60, ry + 70); }
  });
  if (nothingK > 0) stamp(c, "NOTHING", W / 2, y + (fills.length ? 470 : 300), 140, RED, nothingK, r, -0.06);
  c.restore();
};

// ---------- our real test (line 11) ----------
type Demo = { n: number; plain_asked: number; plain_party: number; ask_asked: number; budget_asked: number; used: number; hire: number; answered_n: number; note: string };
const testCard = (c: Ctx, W: number, r: () => number, k: number, rows: number[], D: Demo) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(255,253,245,0.97)"; rrect(c, 56, 224, W - 112, 960, 30); c.fill();
  c.font = SANS(58, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 306);
  c.font = SANS(48, 800); c.fillStyle = NAVY; c.fillText(`a small free AI, offline · ${D.n} tries each`, W / 2, 370);
  const row = (y: number, head: string, big: string, col: string, ink: string, q: number) => {
    if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 3);
    c.fillStyle = col; rrect(c, 90, y, W - 180, 290, 26); c.fill();
    c.font = SANS(46, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(head, 130, y + 70);
    c.font = SANS(160, 900); c.fillStyle = ink; c.fillText(big, 130, y + 238); const bw = c.measureText(big).width;
    c.font = SANS(60, 900); c.fillStyle = INK; c.fillText("asked first", 160 + bw, y + 212);
    c.restore();
  };
  row(404, "just the request", `${D.plain_asked}/${D.n}`, "#fce7f3", PINK, rows[0] ?? 0);
  row(712, "+ \u201cask me 3 questions\u201d", `${D.ask_asked}/${D.n}`, "#ede9fe", PURPLE, rows[1] ?? 0);
  if ((rows[2] ?? 0) > 0) {   // the disclosure, as big as the rows' labels (two lines)
    c.globalAlpha = clamp(rows[2] * 3); c.font = SANS(46, 900); c.fillStyle = RED; c.textAlign = "center";
    const [n1, n2] = D.note.split(": ");
    c.fillText(n2 ? `${n1}:` : D.note, W / 2, 1080); if (n2) { c.font = SANS(40, 800); c.fillStyle = "#334155"; c.fillText(n2, W / 2, 1136); }
  }
  c.restore();
  void r;
};
// the catch our test found: it rarely asks the budget (line 8, held 2 s)
const budgetChip = (c: Ctx, W: number, k: number, D: Demo, r: () => number) => {
  if (k <= 0) return;
  const q = easeOut(clamp(k * 2));
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(W / 2, 1010); c.scale(0.8 + 0.2 * q, 0.8 + 0.2 * q); c.rotate(-0.015);
  c.fillStyle = "#0f172a"; rrect(c, -450, -86, 900, 172, 30); c.fill();
  stroke(c, rrectPts(-450, -86, 900, 172), "#facc15", 6, r, { passes: 1 });
  c.font = SANS(42, 800); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(`Our test AI asked the budget ${D.budget_asked} in ${D.n}`, 0, -16);
  c.font = SANS(60, 900); c.fillStyle = "#facc15"; c.fillText("Always say yours!", 0, 58);
  c.restore();
};

// moods and arms per line: [Kavya, Teja]
const POSE: Record<number, [[Mood, Arms], [Mood, Arms]]> = {
  1: [["shock", "phone"], ["shock", "sip"]], 3: [["calm", "phone"], ["confused", "shrug"]], 4: [["calm", "point"], ["confused", "tea"]],
  5: [["smug", "phone"], ["confused", "tea"]], 8: [["happy", "rest"], ["grin", "phone"]], 11: [["happy", "rest"], ["grin", "point"]],
  14: [["calm", "phone"], ["grin", "typetea"]], 15: [["yell", "point"], ["smug", "sip"]],
};

// ---------- the scene ----------
const StTerrace: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const D: Demo = { n: 10, plain_asked: 0, plain_party: 0, ask_asked: 0, budget_asked: 0, used: 0, hire: 0, answered_n: 10, note: "", ...((s.data as { demo?: object }).demo ?? {}) };
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - (beats[k]?.prop === "loop" ? 14 : 2)) i = k; }); return i; };
  const cueOf = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    if (b.shot === "chat" && b.prop !== "total" && b.prop !== "questions") sfx.push(<Sfx key={k("w")} at={at - 18} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={0} src="audio/sfx_chaching.wav" vol={0.4} />,
      <Sfx key={k("s")} at={3} src="audio/gag_squish.wav" vol={0.45} />);
    if (b.prop === "plan1") sfx.push(<Sfx key={k("b")} at={cueOf(i, 1, 0.55) - 4} src="audio/gag_bonk.wav" vol={0.45} />);
    if (b.prop === "why") sfx.push(<Sfx key={k("b")} at={at + 2} src="audio/gag_boing.wav" vol={0.25} />);
    if (b.prop === "nothing") {
      [4, 10, 16].forEach((d, q) => sfx.push(<Sfx key={k("p" + q)} at={at + d} src="audio/sfx_pop.wav" vol={0.25} />));
      sfx.push(<Sfx key={k("n")} at={cueOf(i, 1, 0.4) - 6} src="audio/sfx_snap.wav" vol={0.55} />, <Sfx key={k("m")} at={cueOf(i, 1, 0.4) - 6} src="reel/sfx_boom.wav" vol={0.4} />);
    }
    if (b.prop === "take2") {
      const clap = cueOf(i, 1, 0.1);
      sfx.push(<Sfx key={k("g")} at={0} src="reel/sfx_glitch.wav" vol={0.5} />, <Sfx key={k("w1")} at={2} src="audio/sfx_whoosh.wav" vol={0.35} />,
        <Sfx key={k("w2")} at={10} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("cl")} at={clap - 8} src="audio/sfx_snap.wav" vol={0.85} />);
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("q" + q)} at={clap + 24 + q * 8} src="audio/sfx_pop.wav" vol={0.25} />));
    }
    if (b.prop === "typing") {
      for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 2 + Math.round(q * l.frames * 0.085)} src="audio/sfx_tick.wav" vol={0.14} />);
      sfx.push(<Sfx key={k("c")} at={end} src="audio/gag_pop.wav" vol={0.45} />, <Sfx key={k("r")} at={nx - 44} src="reel/sfx_riser.wav" vol={0.35} />);
    }
    if (b.prop === "questions") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("q" + n)} at={cueOf(i, n, 0.25 * n) - 4} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "answers") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("d" + n)} at={cueOf(i, n, 0.3 * n - 0.2) + 6} src="audio/gag_ding.wav" vol={0.28} />));
    if (b.prop === "plan2") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("p" + n)} at={cueOf(i, n, 0.3 * n - 0.2) - 4} src="audio/sfx_pop.wav" vol={0.3} />));
    if (b.prop === "total") sfx.push(<Sfx key={k("h")} at={cueOf(i, 1, 0.5) - 5} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={cueOf(i, 1, 0.5) - 5} src="audio/sfx_chaching.wav" vol={0.55} />);
    if (b.prop === "test") [0.15, 0.55].forEach((q, n) => sfx.push(<Sfx key={k("r" + n)} at={at + Math.round(l.frames * q)} src="audio/sfx_pop.wav" vol={0.35 + 0.1 * n} />));
    if (b.prop === "answers") sfx.push(<Sfx key={k("bc")} at={cueOf(i, 3, 0.75) + 2} src="audio/gag_pop.wav" vol={0.5} />);
    if (b.prop === "party") sfx.push(<Sfx key={k("s")} at={Math.max(0, at - 26)} src="audio/sfx_success.wav" vol={0.55} />, <Sfx key={k("w")} at={Math.max(0, at - 28)} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "bday") for (let q = 0; q < 6; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 8 + q * 4} src="audio/sfx_tick.wav" vol={0.15} />);
    if (b.prop === "loop") sfx.push(<Sfx key={k("r")} at={at - 56} src="reel/sfx_riser.wav" vol={0.6} />, <Sfx key={k("a")} at={at - 18} src="reel/sfx_boom.wav" vol={1.0} />,
      <Sfx key={k("c")} at={at - 18} src="audio/sfx_chaching.wav" vol={0.45} />, <Sfx key={k("e")} at={end + 3} src="reel/sfx_boom.wav" vol={0.8} />,
      <Sfx key={k("s")} at={end + 3} src="audio/sfx_snap.wav" vol={0.6} />);   // the slam in the gap before her yell, a hit after it
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9900 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const two = (pos: Record<"kavya" | "teja", [Pt, number]>, poseK: [Mood, Arms], poseT: [Mood, Arms], o: PersonOpts = {}) => {
          person(c, "kavya", pos.kavya[0], pos.kavya[1], poseK[0], poseK[1], b.who === "kavya" && talking, r);
          person(c, "teja", pos.teja[0], pos.teja[1], poseT[0], poseT[1], b.who === "teja" && talking, r, o);
        };
        if (b.shot === "terrace") {
          terrace(c, W, H, f, r);
          const [pk, pt] = POSE[n] ?? [["calm", "phone"], ["calm", "tea"]];
          if (b.prop === "hook") {   // frame 1: the 3-lakh plan, Teja's tea comes out
            two(HOOK, pk, pt, { spray: seg(f, ln.from - 2, ln.from + 22) });
            hookPhone(c, W, f, r, ASK1, f < ln.from + 40 ? 1 : 0);
          } else if (b.prop === "bday" || b.prop === "loop") {   // his birthday without the line; the same plan slams in: frame 1
            const slam = b.prop === "loop" ? seg(f, ln.from - 12, ln.from - 2) : 0;
            two(HOOK, pk, pt);
            if (b.prop === "bday") {
              const t0 = ln.from + Math.round(ln.frames * 0.3);
              msg(c, W, 520, BDAY, true, seg(f, t0, t0 + 6), r, 54);
              tag(c, "no “ask me 3 questions”", W / 2, 820, 60, RED, "#fff", -0.03, seg(f, endL - 10, endL - 2));
            } else { c.save(); c.translate(0, -1000 * (1 - easeOut(slam))); hookPhone(c, W, f, r, BDAY, 0); c.restore(); }
          } else if (b.prop === "test") {   // our real test, over the terrace; Teja under the card
            person(c, "teja", [540, 1500], 0.9, talking ? "grin" : "smug", "point", b.who === "teja" && talking, r);
            c.fillStyle = "rgba(4,8,40,0.35)"; c.fillRect(0, 0, W, 1200);
            const t = (q: number) => ln.from + Math.round(ln.frames * q);
            testCard(c, W, r, 1, [seg(f, t(0.15), t(0.15) + 6), seg(f, t(0.55), t(0.55) + 6), seg(f, endL + 6, endL + 12)], D);
          } else if (b.prop === "plan1") {
            two(TWO, ["yell", "point"], ["shock", "tea"]);
            c.save(); c.translate(540, 560); c.rotate(-0.04); c.scale(0.62, 0.62); c.translate(-540, -560);
            planCard(c, 110, 150, W - 220, 860, f, r, { title: "YOUR SURPRISE PLAN ✨", items: PLAN1, ks: [1, 1, 1], total: "₹3,00,000", totalK: 1, totalCol: RED, size: 56 });
            c.restore();
            const ck = cu(1, 0.55);
            stamp(c, "RECEPTION?!", W / 2, 600, 128, RED, seg(f, ck, ck + 8), r, -0.08);
          } else {
            two(b.prop === "answers" ? HOOK : TWO, pk, pt);
            if (b.prop === "why") bubble(c, 700, 830, "why so BIG?!", 86, seg(p, 0.05, 0.25), "#fef08a");
            if (b.prop === "nothing") toldCard(c, W, r, seg(p, 0.0, 0.1), [], seg(f, cu(1, 0.4), cu(1, 0.4) + 8), "WHAT WE TOLD THE AI:");
            if (b.prop === "answers") {
              toldCard(c, W, r, 1, [1, 2, 3].map((q) => seg(f, cu(q, 0.3 * q - 0.2) + 4, cu(q, 0.3 * q - 0.2) + 10)), 0, "TAKE 2: WHAT WE TOLD IT");
              const tb = cu(3, 0.75) + 4;   // the budget: our test AI almost never asked for it (held through the gap)
              budgetChip(c, W, seg(f, tb, tb + 8), D, r);
            }
          }
        } else if (b.shot === "chat") {
          const ks: number[] = b.prop === "plan1" ? [seg(f, cu(1, 0.55), cu(1, 0.55) + 8)]
            : b.prop === "typing" ? [seg(f, ln.from + 2, ln.from + Math.round(ln.frames * 0.92)), seg(f, endL - 2, endL + 4)]
            : b.prop === "questions" ? [seg(p, 0.0, 0.06), ...[1, 2, 3].map((q) => seg(f, cu(q, 0.25 * q), cu(q, 0.25 * q) + 6)), seg(f, endL - 6, endL + 2)]
            : b.prop === "plan2" ? [1, 2, 3].map((q) => seg(f, cu(q, 0.3 * q - 0.2), cu(q, 0.3 * q - 0.2) + 6))
            : [seg(f, cu(1, 0.5) - 8, cu(1, 0.5))];
          chat(c, W, H, f, r, b.prop as ChatMode, ks);
        } else if (b.shot === "rewind") {
          const clap = cu(1, 0.1);
          if (f < clap - 16) {   // take 1 runs backwards
            terrace(c, W, H, f, r);
            two(HOOK, ["shock", "phone"], ["shock", "sip"]);
            c.save(); c.translate(0, Math.sin(f * 1.7) * 26); hookPhone(c, W, f, r, ASK1, 0); c.restore();
            vhs(c, W, H, f, 1);
          } else if (f < clap + 14) {
            terrace(c, W, H, f, r);
            two(TWO, ["calm", "phone"], ["calm", "tea"]);
            c.fillStyle = "rgba(4,8,40,0.55)"; c.fillRect(0, 0, W, H);
            slate(c, W, f, r, seg(f, clap - 16, clap - 10), seg(f, clap - 10, clap - 6));
            if (f < clap - 12) vhs(c, W, H, f, 1 - seg(f, clap - 16, clap - 12));
          } else {   // "we don't know what it needs, so let it ask": question marks come out of the phone
            terrace(c, W, H, f, r);
            const [pk, pt] = POSE[5];
            two(TWO, pk, pt);
            [[300, 900, "?"], [520, 760, "?"], [760, 880, "?"]].forEach(([x, y, t], q) => {
              const t0 = clap + 24 + q * 8;
              bubble(c, Number(x), Number(y), String(t), 110, seg(f, t0, t0 + 8), "#ede9fe", PURPLE);
            });
            tag(c, "let the AI ask", W / 2, 560, 104, "#facc15", INK, -0.03, seg(f, clap + 40, clap + 48));
          }
        } else {
          // ---------- the surprise on the terrace ----------
          terrace(c, W, H, f, r, b.prop === "party" ? seg(p, 0, 0.15) : 1);
          const moved = b.prop !== "party" || p > 0.5;
          person(c, "kavya", [150, 1090], 0.78, b.prop === "credit" ? "happy" : "grin", b.prop === "credit" ? "phone" : "rest", b.who === "kavya" && talking, r);
          person(c, "teja", [940, 1102], 0.78, "grin", "rest", false, r);
          person(c, "nanna", [400, 1180], 0.92, b.prop === "party" ? (talking ? "shock" : "happy") : "moved", "plate", b.who === "nanna" && talking, r);
          person(c, "amma", [700, 1190], 0.9, moved ? "moved" : "happy", "album", false, r);
          if (b.prop === "party") tag(c, "Amma & Nanna · 25 years", 610, 480, 68, "#fef08a", INK, -0.02, seg(p, 0.1, 0.25));
          if (b.prop === "credit") bubble(c, 330, 740, "it asked us first", 72, seg(p, 0.1, 0.3), "#ede9fe", PURPLE);
        }
      }} />
    </>
  );
};

export const TERRACE_SCENES = { sk_terrace: StTerrace };
