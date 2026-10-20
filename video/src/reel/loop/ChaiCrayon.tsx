import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// Skit 04 "The fancy chai" (series/scripts/skit04_fancy_chai.md): a roadside chai stall at dusk. Babu (the owner, behind
// the counter), Raju (an auto driver, his regular, in front) and Swathi (Babu's daughter, from line 6). The AI is only
// text on Babu's phone: the posts are copied from our test (series/scripts/skit04_demo/results.json). One beat per line
// (s.data.beats); n = the line number in the script (7 is the challenge card, held after line 6).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "yell" | "shock" | "confused" | "happy" | "sad" | "smug" | "hurt" | "calm" | "panic" | "grin";
type Arms = "rest" | "phoneup" | "point" | "shrug" | "up" | "kettle" | "books" | "type" | "fist" | "chest" | "facepalm";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a";
const COUNTER = 1010;
const BABU: Pt = [600, 742], RAJU: Pt = [250, 905], SWATHI: Pt = [858, 900];   // necks
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, babu: { z: 1.55, x: 600, y: 690 }, raju: { z: 1.45, x: 380, y: 850 }, swathi: { z: 1.5, x: 820, y: 840 },
};
// mood and arms per line, for whoever is on screen (the speaker's own entry rules)
const POSE: Record<string, Record<number, [Mood, Arms]>> = {
  babu: { 1: ["hurt", "kettle"], 2: ["hurt", "chest"], 3: ["sad", "kettle"], 5: ["sad", "kettle"], 6: ["confused", "kettle"], 9: ["happy", "kettle"],
          10: ["panic", "up"], 11: ["sad", "kettle"], 12: ["smug", "type"] },
  raju: { 1: ["shock", "phoneup"], 2: ["confused", "rest"], 3: ["yell", "point"], 5: ["confused", "shrug"], 6: ["confused", "rest"], 9: ["grin", "fist"],
          10: ["grin", "fist"], 11: ["confused", "rest"], 12: ["shock", "rest"] },
  swathi: { 6: ["calm", "point"], 8: ["calm", "books"], 9: ["calm", "books"], 10: ["calm", "books"], 11: ["smug", "point"], 12: ["sad", "facepalm"] },
};

// ---------- the street and the stall ----------
const street = (c: Ctx, r: () => number) => {
  const g = c.createLinearGradient(0, 100, 0, 1000);
  g.addColorStop(0, "#7c3aed"); g.addColorStop(0.45, "#f97316"); g.addColorStop(1, "#fde68a");
  c.fillStyle = g; c.fillRect(-400, 0, 1880, 1250);
  // the city behind: flat blocks with lit windows
  const blocks = [[-300, 560, 220], [-60, 610, 170], [130, 520, 200], [960, 580, 230], [1180, 640, 180]];
  blocks.forEach(([x, y, w], i) => {
    c.fillStyle = i % 2 ? "#5b4b8a" : "#4c3d78"; c.fillRect(x, y, w, 700);
    c.fillStyle = "#fde047";
    for (let yy = y + 40; yy < 1000; yy += 70) for (let xx = x + 24; xx < x + w - 30; xx += 56) if ((xx + yy + i) % 3) c.fillRect(xx, yy, 22, 30);
  });
  // footpath and road
  c.fillStyle = "#d6d3d1"; c.fillRect(-400, 1180, 1880, 90);
  c.fillStyle = "#6b7280"; c.fillRect(-400, 1270, 1880, 700);
  hatch(c, [-300, 1290, 1380, 1900], ["#4b5563", "#9ca3af"], r, { angle: 0.02, gap: 30, w: 3, alpha: 0.35 });
  for (let x = -300; x < 1400; x += 260) { c.fillStyle = "#f8fafc"; c.fillRect(x, 1600, 140, 18); }
};
const auto = (c: Ctx, r: () => number) => {   // an auto-rickshaw parked behind Raju (no brand)
  c.save(); c.translate(70, 1000);
  c.fillStyle = "#111827"; c.beginPath(); c.moveTo(-160, 160); c.lineTo(-150, -40); c.quadraticCurveTo(-60, -170, 160, -150); c.lineTo(190, 160); c.closePath(); c.fill();
  c.fillStyle = "#facc15"; c.beginPath(); c.moveTo(-150, -40); c.quadraticCurveTo(-60, -170, 160, -150); c.lineTo(170, -90); c.quadraticCurveTo(-40, -110, -140, -10); c.closePath(); c.fill();
  c.fillStyle = "#16a34a"; c.fillRect(-150, 40, 340, 60);
  [[-110, 170], [150, 170]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 44, 0, 7); c.fillStyle = "#1f2937"; c.fill(); c.beginPath(); c.arc(x, y, 16, 0, 7); c.fillStyle = "#9ca3af"; c.fill(); });
  stroke(c, [[-150, -40], [-160, 160]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.restore();
};
const stall = (c: Ctx, r: () => number, f: number) => {
  // poles and the striped tarpaulin roof
  [[352, 470], [968, 470]].forEach(([x, y]) => { c.fillStyle = "#57534e"; c.fillRect(x - 9, y, 18, COUNTER - y); });
  c.save(); c.beginPath(); c.moveTo(300, 470); c.lineTo(1020, 470); c.lineTo(990, 380); c.lineTo(330, 380); c.closePath(); c.clip();
  for (let x = 300; x < 1030; x += 60) { c.fillStyle = Math.floor((x - 300) / 60) % 2 ? "#dc2626" : "#f8fafc"; c.fillRect(x, 370, 60, 110); }
  c.restore();
  for (let x = 300; x < 1020; x += 40) { c.beginPath(); c.arc(x + 20, 470, 20, 0, Math.PI); c.fillStyle = Math.floor((x - 300) / 60) % 2 ? "#dc2626" : "#f8fafc"; c.fill(); }
  // the board: the price stays ₹15 all through
  c.save(); c.translate(660, 545); c.rotate(-0.02);
  c.fillStyle = "#1f3a2e"; rrect(c, -230, -58, 460, 116, 12); c.fill();
  stroke(c, [[-230, -58], [230, -58], [230, 58], [-230, 58], [-230, -58]], "#a16207", 6, r, { passes: 1, alpha: 0.9 });
  c.font = caveat(50); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("BABU TEA STALL", 0, -6);
  c.font = caveat(44); c.fillStyle = "#fde047"; c.fillText("TEA ₹15", 0, 42);
  c.restore();
  void f;
};
const counter = (c: Ctx, r: () => number, f: number) => {
  c.fillStyle = "#1d4ed8"; c.fillRect(330, COUNTER, 660, 300);
  c.fillStyle = "#93c5fd"; c.fillRect(330, COUNTER, 660, 26);
  hatch(c, [340, COUNTER + 30, 980, COUNTER + 300], ["#1e40af", "#3b82f6"], r, { angle: 0.05, gap: 24, w: 4, alpha: 0.4 });
  c.font = caveat(46); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("Chai · Bajji · Biscuit", 660, COUNTER + 120);
  // the kettle on the stove, steaming
  c.fillStyle = "#374151"; c.fillRect(800, COUNTER - 30, 140, 30);
  c.save(); c.translate(870, COUNTER - 100);
  c.fillStyle = "#cbd5e1"; c.beginPath(); c.ellipse(0, 0, 70, 66, 0, 0, 7); c.fill();
  c.fillStyle = "#94a3b8"; c.fillRect(-40, -78, 80, 18); stroke(c, circlePts(0, -82, 46, 34, Math.PI, Math.PI * 2, 10), "#64748b", 8, r, { passes: 1 });
  stroke(c, [[-60, -10], [-118, -48]], "#94a3b8", 16, r, { passes: 2 });
  c.restore();
  for (let k = 0; k < 3; k++) {   // steam
    const q = ((f / 40 + k / 3) % 1);
    stroke(c, [[860 + k * 14, COUNTER - 190 - q * 120], [880 + k * 14 + Math.sin(q * 6 + k) * 18, COUNTER - 230 - q * 120], [866 + k * 14, COUNTER - 270 - q * 120]],
      "#ffffff", 8, r, { passes: 1, alpha: 0.5 * (1 - q) });
  }
  // glass tumblers of chai on a tray
  c.fillStyle = "#9ca3af"; c.fillRect(400, COUNTER - 12, 210, 12);
  for (let k = 0; k < 5; k++) {
    const x = 418 + k * 40;
    c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(x, COUNTER - 66, 28, 54);
    c.fillStyle = "#b45309"; c.fillRect(x + 2, COUNTER - 50, 24, 38);
  }
};

// ---------- people ----------
type Who = "babu" | "raju" | "swathi";
const LOOK: Record<Who, { skin: string; hair: string; shirt: string; s: number }> = {
  babu: { skin: "#a86b45", hair: "#9ca3af", shirt: "#f5f0dc", s: 0.92 },
  raju: { skin: "#8d5a3b", hair: "#1c1410", shirt: "#c2a26b", s: 1.0 },
  swathi: { skin: "#b5764f", hair: "#1c1410", shirt: "#db2777", s: 0.9 },
};
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 44) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, point = false) => {
  c.beginPath(); c.arc(x, y, 25, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, 25, 25), INK, 3, r, { passes: 1, alpha: 0.55 });
  if (point) stroke(c, [[x + 6, y - 16], [x + 26, y - 50]], skin, 15, r, { passes: 2 });
};
const handPhone = (c: Ctx, x: number, y: number, rot: number, glow: boolean) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "#111827"; rrect(c, -40, -70, 80, 140, 12); c.fill();
  c.fillStyle = glow ? "#e0f2fe" : "#334155"; rrect(c, -32, -60, 64, 118, 8); c.fill();
  c.restore();
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  if (who === "swathi") {   // hair falling behind, the braid over her shoulder
    c.fillStyle = L.hair; c.beginPath(); c.ellipse(0, hy + 10, 106, 128, 0, 0, 7); c.fill();
    for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(78 + k * 4, hy + 120 + k * 34, 20, 22, 0.3, 0, 7); c.fill(); }
  }
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  // hair on top
  c.fillStyle = L.hair; c.beginPath();
  if (who === "babu") { c.ellipse(0, hy - 70, 92, 46, 0, Math.PI, 0); c.lineTo(80, hy - 50); c.lineTo(-80, hy - 50); }   // grey, thinning
  else if (who === "raju") { c.ellipse(0, hy - 62, 98, 62, 0, Math.PI, 0); c.lineTo(96, hy - 34); c.lineTo(70, hy - 52); c.lineTo(-70, hy - 52); c.lineTo(-96, hy - 34); }
  else { c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(40, hy - 70, 0, hy - 74); c.quadraticCurveTo(-40, hy - 70, -98, hy - 10); }
  c.closePath(); c.fill();
  if (who === "swathi") { c.beginPath(); c.arc(0, hy - 46, 7, 0, 7); c.fillStyle = "#dc2626"; c.fill(); }   // bindi
  // brows
  const browCol = who === "babu" ? "#6b7280" : L.hair;
  [-1, 1].forEach((sx) => {
    let yi = -164, yo = -164;
    if (m === "yell" || m === "panic") { yi = -150; yo = -172; }
    if (m === "shock" || m === "confused") { yi = -182; yo = -180; }
    if (m === "sad" || m === "hurt") { yi = -180; yo = -160; }
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], browCol, 12, r, { passes: 2 });
  });
  // eyes
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "panic" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "grin") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 3, ey + 4, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else {
      c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill();
    }
    if (who === "swathi") stroke(c, [[ex - 16, ey - 10], [ex - 24, ey - 16]], INK, 3, r, { passes: 1 });   // lashes
  });
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  // mustaches: Babu's thick grey one, Raju's thin black one
  if (who !== "swathi") {
    const mc = who === "babu" ? "#d1d5db" : L.hair, mw = who === "babu" ? 62 : 46, mh = who === "babu" ? 1 : 0.6;
    c.beginPath(); c.moveTo(-mw, hy + 64); c.quadraticCurveTo(-30, hy + 64 - 26 * mh, 0, hy + 52); c.quadraticCurveTo(30, hy + 64 - 26 * mh, mw, hy + 64);
    c.quadraticCurveTo(30, hy + 60, 0, hy + 64); c.quadraticCurveTo(-30, hy + 60, -mw, hy + 64); c.fillStyle = mc; c.fill();
  }
  const my = hy + 84;
  const open = talk || m === "yell" || m === "panic" || m === "shock";
  if (open) {
    const w = m === "yell" || m === "panic" ? 32 : talk ? 21 : 15, h = m === "yell" || m === "panic" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "grin" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "grin" ? 32 : 24, m === "grin" ? 18 : 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
    if (m === "grin") { c.fillStyle = "#fff"; c.fillRect(-22, my - 2, 44, 8); }
  } else if (m === "smug") {
    stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  } else if (m === "sad" || m === "hurt") {
    stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  } else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (m === "panic" || m === "hurt") {   // a sweat drop
    c.beginPath(); c.moveTo(88, hy - 66); c.quadraticCurveTo(108, hy - 36, 88, hy - 26); c.quadraticCurveTo(72, hy - 36, 88, hy - 66); c.fillStyle = "#7dd3fc"; c.fill();
  }
};
const person = (c: Ctx, who: Who, at: Pt, m: Mood, a: Arms, talk: boolean, p: number, f: number, r: () => number, enter = 1) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0] + (1 - easeOut(enter)) * 520, at[1]); c.scale(L.s, L.s);
  // torso
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.lineTo(178, 520); c.lineTo(-178, 520); c.closePath();
  c.fillStyle = L.shirt; c.fill(); c.clip();
  if (who === "raju") { c.fillStyle = "#a8875a"; c.fillRect(30, 90, 70, 70); }                       // a pocket
  if (who === "swathi") { c.fillStyle = "#facc15"; c.beginPath(); c.moveTo(-140, 40); c.lineTo(-20, 40); c.lineTo(120, 520); c.lineTo(20, 520); c.closePath(); c.fill(); }   // dupatta
  c.restore();
  stroke(c, [[-140, 34], [-178, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [178, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  if (who !== "swathi") { c.fillStyle = who === "raju" ? "#a8875a" : "#e7e1c8"; c.beginPath(); c.moveTo(-50, 14); c.lineTo(0, 70); c.lineTo(50, 14); c.lineTo(28, 4); c.lineTo(0, 40); c.lineTo(-28, 4); c.closePath(); c.fill(); }
  if (who === "babu") {   // the checked towel over his shoulder
    c.save(); c.fillStyle = "#fef2f2"; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-60, 26); c.lineTo(-90, 300); c.lineTo(-170, 300); c.closePath(); c.fill(); c.clip();
    for (let y = 30; y < 300; y += 36) { c.fillStyle = "rgba(220,38,38,0.55)"; c.fillRect(-180, y, 140, 10); }
    for (let x = -170; x < -50; x += 36) { c.fillStyle = "rgba(220,38,38,0.4)"; c.fillRect(x, 20, 10, 290); }
    c.restore();
  }
  // arms
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 220], [-140, 330]], rr: Pt[] = [[178, 220], [140, 330]], lp = false, rp = false;
  if (a === "phoneup") { rr = [[200, 40], [150, -150]]; }
  else if (a === "point") { rr = [[220, 30], [320, -110]]; rp = true; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  else if (a === "up") { l = [[-220, -20], [-190, -170]]; rr = [[220, -20], [190, -170]]; }
  else if (a === "kettle") { rr = [[200, 170], [260, 250]]; }
  else if (a === "books") { l = [[-150, 210], [40, 230]]; rr = [[150, 210], [-40, 250]]; }
  else if (a === "type") { l = [[-150, 200], [-30, 150]]; rr = [[150, 200], [30, 150]]; }
  else if (a === "fist") { rr = [[210, 60], [200 + 10 * Math.sin(f * 1.2), -100]]; }
  else if (a === "chest") { rr = [[150, 200], [30, 110]]; }
  else if (a === "facepalm") { rr = [[170, 120], [40, -150]]; l = [[-150, 210], [40, 230]]; }
  if (a === "books" || a === "facepalm") {   // the college books held to her chest
    [["#2563eb", 0], ["#16a34a", 30], ["#f59e0b", 60]].forEach(([col, dy]) => { c.fillStyle = col as string; rrect(c, -110, 150 + (dy as number), 220, 30, 6); c.fill(); });
  }
  limb(c, [S, l[0], l[1]], L.shirt, r); palm(c, l[1][0], l[1][1], L.skin, r, lp);
  if (a !== "facepalm") { limb(c, [R, rr[0], rr[1]], L.shirt, r); palm(c, rr[1][0], rr[1][1], L.skin, r, rp); }
  if (a === "phoneup") handPhone(c, 150, -230, 0.15, true);
  if (a === "type") handPhone(c, 0, 120, 0, true);
  face(c, who, m, talk, r);
  if (a === "facepalm") { limb(c, [R, rr[0], rr[1]], L.shirt, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  c.restore();
  void p;
};

// ---------- the phone, full frame ----------
const wrap = (c: Ctx, t: string, w: number) => {
  const out: string[] = []; let cur = "";
  t.split(" ").forEach((word) => { const nx = cur ? cur + " " + word : word; if (c.measureText(nx).width > w && cur) { out.push(cur); cur = word; } else cur = nx; });
  if (cur) out.push(cur);
  return out;
};
const sparkle = (c: Ctx, x: number, y: number, s: number, col = "#f59e0b") => {
  c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? s * 0.35 : s; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
};
const phoneFrame = (c: Ctx, W: number, title: string, r: () => number) => {
  c.fillStyle = "#0b1220"; rrect(c, 62, 150, W - 124, 1330, 64); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 88, 178, W - 176, 1274, 44); c.fill();
  c.fillStyle = "#7c3aed"; rrect(c, 118, 210, 80, 80, 20); c.fill(); sparkle(c, 158, 250, 26, "#fff");
  c.font = SANS(44); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 220, 246);
  c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.fillText(title, 220, 282);
  stroke(c, [[110, 310], [W - 110, 310]], "#cbd5e1", 3, r, { passes: 1 });
};
// a chat bubble: mine (right, green) or the AI's (left, white); returns its bottom; `box` gets the highlighted word's box
const chatBubble = (c: Ctx, W: number, y: number, text: string, mine: boolean, k: number, size = 38, hl?: string, box?: number[], under?: string) => {
  if (k <= 0) return y;
  c.font = SANS(size, 600);
  const maxW = W - 330, lines = text.split("\n").flatMap((t) => wrap(c, t, maxW));
  const lh = size * 1.28, h = lines.length * lh + 40, w = Math.min(maxW, Math.max(...lines.map((t) => c.measureText(t).width))) + 48;
  const x = mine ? W - 120 - w : 120;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = mine ? "#dcfce7" : "#ffffff"; rrect(c, x, y, w, h, 26); c.fill();
  if (!mine) { c.strokeStyle = "#cbd5e1"; c.lineWidth = 3; c.stroke(); }
  c.fillStyle = INK; c.textAlign = "left";
  lines.forEach((t0, i) => {
    const t = t0.replace(/\u00a0/g, " ");   // a no-break space keeps "Rs 10" on one line
    const ty = y + 20 + size + i * lh - size * 0.18;
    if (hl && t.includes(hl)) {   // a highlighted word (the price)
      const pre = t.slice(0, t.indexOf(hl)), px = x + 24 + c.measureText(pre).width, hw = c.measureText(hl).width;
      c.fillStyle = "rgba(220,38,38,0.18)"; c.fillRect(px - 4, ty - size * 0.85, hw + 8, size * 1.05); c.fillStyle = INK;
      if (box && !box.length) box.push(px, ty - size * 0.85, hw, size * 1.05);
    }
    c.fillText(t, x + 24, ty);
    if (under && t.includes(under) && k >= 1) {   // underline each occurrence (the old prices)
      let from = 0;
      while (t.indexOf(under, from) >= 0) {
        const at = t.indexOf(under, from), ux = x + 24 + c.measureText(t.slice(0, at)).width, uw = c.measureText(under).width;
        c.fillStyle = COL.red; c.fillRect(ux, ty + 6, uw, 5); c.fillStyle = INK; from = at + under.length;
      }
    }
  });
  c.restore();
  return y + h + 26;
};
// the stall's post as it went out (frame 1): the photo, the caption, the hearts
const postCard = (c: Ctx, x: number, y: number, w: number, k: number, r: () => number, f: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "#0b1220"; rrect(c, x - 22, y - 22, w + 44, 1040, 48); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, 996, 30); c.fill();
  c.beginPath(); c.arc(x + 54, y + 52, 30, 0, 7); c.fillStyle = "#b45309"; c.fill();
  c.font = SANS(32); c.fillStyle = INK; c.textAlign = "left"; c.fillText("babu_tea_stall", x + 100, y + 64);
  // the photo: a glass of chai with steam on a warm background
  c.fillStyle = "#fde68a"; c.fillRect(x, y + 104, w, 360);
  c.fillStyle = "rgba(255,255,255,0.7)"; rrect(c, x + w / 2 - 60, y + 210, 120, 200, 14); c.fill();
  c.fillStyle = "#b45309"; rrect(c, x + w / 2 - 52, y + 250, 104, 152, 10); c.fill();
  for (let kk = 0; kk < 3; kk++) stroke(c, [[x + w / 2 - 30 + kk * 30, y + 196], [x + w / 2 - 14 + kk * 30, y + 160], [x + w / 2 - 30 + kk * 30, y + 124]], "#ffffff", 7, r, { passes: 1, alpha: 0.8 });
  [[x + 70, y + 160], [x + w - 80, y + 190], [x + w - 120, y + 400], [x + 110, y + 380]].forEach(([sx, sy], i) => sparkle(c, sx, sy, 22 + (i % 2) * 10 + 4 * Math.sin(f / 6 + i)));
  // the caption, copied from the test (fancy, try 5)
  c.font = SANS(46); c.fillStyle = INK;
  wrap(c, "Indulge in the Spice of Life!", w - 60).forEach((t, i) => c.fillText(t, x + 30, y + 536 + i * 56));
  c.font = SANS(34, 500); c.fillStyle = "#334155";
  wrap(c, "Situated in the heart of Hyderabad, our roadside tea stall offers a taste of tradition and a touch of modern flair...", w - 60)
    .forEach((t, i) => c.fillText(t, x + 30, y + 666 + i * 44));
  c.font = SANS(30, 600); c.fillStyle = "#e11d48"; c.fillText("♥ 3 likes", x + 30, y + 960);
  c.restore();
};

// the rule, as a chip above the captions (line 11 to the end)
const rule = (c: Ctx, W: number) => {
  c.save(); c.translate(W / 2, 1390);
  c.fillStyle = "#facc15"; rrect(c, -440, -66, 880, 132, 24); c.fill();
  c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.fillText("SHOW 3 old posts", 0, -8);
  c.font = SANS(38, 600); c.fillText("+ say today's facts", 0, 42);
  c.restore();
};

// ---------- the scene ----------
const StChai: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.shot === "phone") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "fancy") sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.75} />, <Sfx key={k("b")} at={at + 2} src="audio/gag_bonk.wav" vol={0.5} />);
    if (b.prop === "price") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.45) + 2} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "simple") { [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * 5} src="audio/sfx_tick.wav" vol={0.2} />)); sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.4} />); }
    if (b.prop === "lovers") sfx.push(<Sfx key={k("o")} at={at + Math.round(l.frames * 0.55)} src="audio/gag_boing.wav" vol={0.35} />);
    if (b.prop === "show") sfx.push(<Sfx key={k("e")} at={at - 8} src="audio/sfx_whoosh.wav" vol={0.35} />);
    if (b.prop === "paste") {
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("s" + q)} at={at + 4 + q * 7} src="audio/sfx_pop.wav" vol={0.3} />));
      sfx.push(<Sfx key={k("r")} at={end - 30} src="reel/sfx_riser.wav" vol={0.3} />);
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("q" + q)} at={end + 6 + q * 24} src="audio/sfx_tick.wav" vol={0.4} />));   // the challenge's 3-2-1
    }
    if (b.prop === "ten") sfx.push(<Sfx key={k("d")} at={at + 1} src="audio/gag_ding.wav" vol={0.42} />, <Sfx key={k("h")} at={cue(i, 1, 0.55) - 8} src="reel/sfx_boom.wav" vol={0.85} />);
    if (b.prop === "lastyear") sfx.push(<Sfx key={k("o")} at={at + 3} src="audio/gag_boing.wav" vol={0.35} />);
    if (b.prop === "copies") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) + 4} src="audio/sfx_success.wav" vol={0.38} />, <Sfx key={k("c")} at={cue(i, 1, 0.5) + 16} src="audio/sfx_snap.wav" vol={0.35} />);
    if (b.prop === "loop") [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 6 + q * 6} src="audio/sfx_tick.wav" vol={0.2} />));
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4400 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        if (b.shot === "phone") {
          // ---------- Babu's phone, full frame: the prompt and the AI's reply ----------
          c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 316); c.scale(0.94, 0.94); c.translate(-W / 2, -160);
          phoneFrame(c, W, n === 12 ? "a new chat" : "writing your post", r);
          if (n === 4) {
            let y = chatBubble(c, W, 350, "Write an Instagram post for my roadside tea stall in Hyderabad. Today's special: ginger tea. Keep it simple and friendly.", true, seg(p, 0, 0.12), 34);
            const c1 = cu(1, 0.5);
            y = chatBubble(c, W, y, "[Hyderabad's Hidden Gem]\nHey there, tea lovers!\nToday, we're sipping on something special from our roadside tea stall in the heart of Hyderabad - GINGER TEA!", false, seg(f, c1 - 6, c1 + 6), 40);
            if (f > c1 + 14) stamp(c, "WHO IS THIS?", 540, Math.min(y + 70, 1340), 70, COL.red, seg(f, c1 + 14, c1 + 22), r, -0.06);
          }
          if (n === 8 || n === 9 || n === 11) {
            const posts = "Here are three posts I wrote before:\n1. Morning 6 ki stall open! Hot hot allam tea Rs 10 only...\n2. Varsham padutundi. Mirchi bajji + tea combo Rs 30...\n3. Sunday special: Irani chai Rs 10. Friends tho randi...";
            const ask = "Write today's post in the same style and the same Telugu-English mix. Today's special: ginger tea";
            if (n === 8) {
              let y = chatBubble(c, W, 350, posts.replace("tea Rs 10 only", "tea Rs\u00a010 only"), true, seg(p, 0, 0.18), 32, undefined, undefined, p > 0.22 ? "Rs 10" : undefined);
              if (p > 0.22) { const k = seg(p, 0.22, 0.3); tag(c, "his old price: Rs 10", 760, y + 4, 44, "#fee2e2", "#991b1b", 0.03, k); y += 60 * k; }
              const c1 = cu(1, 0.4);
              y = chatBubble(c, W, y, ask + ".", true, seg(f, c1 - 2, c1 + 8), 32);
              chatBubble(c, W, y, "...", false, f > c1 + 12 ? 1 : 0, 44);   // typing...
            } else if (n === 9) {
              let y = chatBubble(c, W, 350, "(my 3 old posts)\n" + ask + ".", true, 1, 30);
              const box: number[] = [];
              y = chatBubble(c, W, y, "Today special: Ginger tea Rs 10 only. Hot hot vellandi, immunity boostandi. Friends tho randi, ginger tea ready!", false, seg(p, 0, 0.08), 46, "Rs 10", box);
              tag(c, "our test: 9 of 10 used Babu's words", 540, Math.min(y + 64, 1240), 54, "#dcfce7", "#14532d", -0.02, seg(p, 0.08, 0.18));
              const c1 = cu(1, 0.55);
              if (f >= c1 - 4 && box.length) {
                const k = seg(f, c1 - 4, c1 + 6);
                stroke(c, circlePts(box[0] + box[2] / 2, box[1] + box[3] / 2, box[2] / 2 + 34, box[3] / 2 + 24), COL.red, 8, r, { passes: 2, alpha: k });
                tag(c, "5 of 10 tries copied last year's ₹10", 540, Math.min(y + 164, 1340), 54, "#fee2e2", "#991b1b", 0.02, k);
              }
            } else {
              let y = chatBubble(c, W, 350, "(my 3 old posts)\n" + ask + ", Rs 15.", true, 1, 30, "Rs 15");
              const c1 = cu(1, 0.5);
              const box: number[] = [];
              y = chatBubble(c, W, y, "Goodmorning! Today's special: Ginger tea Rs 15. Zing zing allam paani, vellandi! Friends tho randi, bench ready!", false, seg(f, c1 - 4, c1 + 6), 46, "Rs 15", box);
              if (f >= c1 + 4 && box.length) {
                const k = seg(f, c1 + 4, c1 + 12);
                stroke(c, circlePts(box[0] + box[2] / 2, box[1] + box[3] / 2, box[2] / 2 + 34, box[3] / 2 + 24), GREEN, 8, r, { passes: 2, alpha: k });
                tag(c, "our test: 10 of 10 said ₹15", 540, Math.min(y + 64, 1250), 54, "#dcfce7", "#14532d", -0.02, k);
              }
            }
          }
          c.restore();
          if (n === 8 && f > endL + 1) {   // the challenge, held after the line: the twist's question and a 3-2-1
            const k = easeOut(seg(f, endL + 1, endL + 7));
            c.save(); c.globalAlpha = 0.6 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
            c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
            c.fillStyle = "#fffdf5"; rrect(c, -480, -380, 960, 760, 30); c.fill();
            c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("ONE QUESTION", 0, -300);
            c.font = SANS(44, 600); c.fillStyle = INK;
            c.fillText("His old posts say Rs 10.", 0, -220); c.fillText("Today's tea is Rs 15 (he didn't type it).", 0, -160);
            c.font = SANS(52); c.fillText("What price will the AI write?", 0, -80);
            c.textAlign = "left"; c.font = SANS(60);
            c.fillStyle = "#dcfce7"; rrect(c, -420, -30, 390, 120, 22); c.fill(); c.fillStyle = INK; c.fillText("A) ₹15", -370, 50);
            c.fillStyle = "#fee2e2"; rrect(c, 30, -30, 390, 120, 22); c.fill(); c.fillStyle = INK; c.fillText("B) ₹10", 80, 50);
            const t = f - endL - 6, q = 3 - Math.floor(t / 24);
            if (t >= 0 && q >= 1) {
              const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
              c.save(); c.translate(0, 240); c.scale(pop, pop);
              c.beginPath(); c.arc(0, 0, 70, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
              c.font = SANS(92); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 33); c.restore();
            }
            c.restore();
          }
          if (n === 11) rule(c, W);
        } else {
          // ---------- the stall ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.12) || (n === 10 && p < 0.15) ? 8 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = "#fde68a"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          street(c, r); auto(c, r); stall(c, r, f);
          const pose = (who: Who): [Mood, Arms] => POSE[who][n] ?? ["calm", "rest"];
          const [bm, ba] = pose("babu");
          person(c, "babu", BABU, bm, ba, b.who === "babu" && talking, p, f, r);
          counter(c, r, f);
          const [rm, ra] = pose("raju");
          person(c, "raju", RAJU, rm, ra, b.who === "raju" && talking, p, f, r);
          if (n >= 6) {
            const [sm, sa] = pose("swathi");
            person(c, "swathi", SWATHI, sm, sa, b.who === "swathi" && talking, p, f, r, n === 6 ? seg(p, 0, 0.22) : 1);
          }
          c.restore();
          // screen-space props
          if (n === 1) {   // frame 1: the post in Raju's hand, readable
            postCard(c, 570, 240, 470, 1, r, f);
            if (f >= ln.from + 26) bubble(c, 260, 520, "₹200?!", 96, seg(f, ln.from + 26, ln.from + 34), "#fee2e2", "#991b1b");
          }
          if (n === 2) {
            const c1 = cu(1, 0.45);
            if (f >= c1 - 4) {
              const k = easeOut(seg(f, c1 - 4, c1 + 6));
              c.save(); c.globalAlpha = k; c.translate(W / 2, 330); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
              c.fillStyle = "#dcfce7"; rrect(c, -430, -70, 860, 140, 28); c.fill();
              c.font = SANS(40, 600); c.fillStyle = INK; c.textAlign = "center"; c.fillText("Babu: \"...ginger tea. Make it fancy.\"", 0, 14);
              c.restore();
              if (f >= c1 + 14) tag(c, "our test: 8 of 10 tries came out 5-star", W / 2, 470, 46, "#fef3c7", INK, -0.02, seg(f, c1 + 14, c1 + 22));
            }
          }
          if (n === 5 && p > 0.35) tag(c, "our test: 0 of 10 used Babu's words", W / 2, 380, 46, "#fef3c7", INK, -0.02, seg(p, 0.35, 0.45));
          if (n === 10) bubble(c, 640, 330, "LAST YEAR'S PRICE!", 64, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 12) {   // Babu types his next prompt; the rule stays on screen into the loop
            const typed = "...ginger tea, Rs 15. Now make it fancy!";
            const c1 = cu(1, 0.45);
            const chars = Math.round(typed.length * clamp((f - ln.from) / Math.max(1, c1 + 24 - ln.from)));
            c.save(); c.fillStyle = "#0b1220"; rrect(c, 120, 240, W - 240, 210, 34); c.fill();
            c.fillStyle = "#dcfce7"; rrect(c, 140, 260, W - 280, 170, 24); c.fill();
            c.font = SANS(44, 600); c.fillStyle = INK; c.textAlign = "left";
            wrap(c, typed.slice(0, Math.max(1, chars)) + (Math.floor(f / 8) % 2 ? "|" : ""), W - 340).forEach((t, k) => c.fillText(t, 170, 328 + k * 56));
            c.restore();
            rule(c, W);
          }
        }
        void handF; void hatch;
      }} />
    </>
  );
};

export const CHAI_SCENES = { sk_chai: StChai };
