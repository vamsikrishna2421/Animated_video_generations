import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// NEW IN AI 01 (series/scripts/new01_sky001.md): Skyfall AI's SKY-001, "the first engineering world model". An
// engineering college CAD lab at 11:40 pm: Meghana (three hours into one wheel hub) and Kiran (believes every viral
// post). Every number on screen is Skyfall's own (skyfall.ai, Oct 19, 2026). One beat per line (s.data.beats); n = the
// script's line number (v2: 16 lines, ends on "Says who?" and loops); the quiz card holds after line 9.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "yell" | "shock" | "confused" | "happy" | "sad" | "smug" | "calm" | "panic" | "grin" | "tired";
type Arms = "rest" | "phoneup" | "point" | "shrug" | "up" | "type" | "fold" | "facepalm";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", ORANGE = "#ea580c", BLUE = "#2563eb";
const DESK = 1060;
const MEG: Pt = [300, 800], KIR: Pt = [835, 880];   // necks
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, meghana: { z: 1.5, x: 330, y: 740 }, kiran: { z: 1.45, x: 820, y: 820 },
};
const POSE: Record<string, Record<number, [Mood, Arms]>> = {
  meghana: { 1: ["tired", "type"], 2: ["tired", "type"], 3: ["confused", "type"], 4: ["smug", "fold"], 5: ["smug", "fold"], 6: ["calm", "fold"],
             8: ["confused", "fold"], 10: ["smug", "point"], 11: ["shock", "fold"], 12: ["happy", "shrug"], 13: ["calm", "fold"], 14: ["smug", "point"],
             15: ["tired", "facepalm"], 16: ["smug", "fold"] },
  kiran: { 1: ["yell", "phoneup"], 2: ["grin", "phoneup"], 3: ["grin", "phoneup"], 4: ["confused", "rest"], 5: ["sad", "shrug"], 6: ["calm", "rest"],
           8: ["calm", "rest"], 10: ["confused", "shrug"], 11: ["calm", "phoneup"], 12: ["sad", "rest"], 13: ["happy", "rest"], 14: ["sad", "rest"],
           15: ["yell", "phoneup"], 16: ["confused", "phoneup"] },
};

// ---------- the lab ----------
const lab = (c: Ctx, r: () => number, f: number) => {
  c.fillStyle = "#dbe4ee"; c.fillRect(-400, 0, 1880, 1300);
  // the night window
  c.fillStyle = "#64748b"; rrect(c, 60, 280, 340, 360, 10); c.fill();
  c.fillStyle = "#0f1b3d"; rrect(c, 76, 296, 308, 328, 6); c.fill();
  c.beginPath(); c.arc(320, 360, 30, 0, 7); c.fillStyle = "#fef9c3"; c.fill();
  [[120, 340], [200, 420], [150, 520], [260, 560], [340, 470]].forEach(([x, y], i) => { c.fillStyle = "#e2e8f0"; c.fillRect(x, y, i % 2 ? 4 : 6, i % 2 ? 4 : 6); });
  stroke(c, [[230, 296], [230, 624]], "#64748b", 8, r, { passes: 1 });
  // the poster and the clock (11:40, the night before the submission)
  c.save(); c.translate(640, 390); c.rotate(0.02);
  c.fillStyle = "#1e3a8a"; rrect(c, -150, -70, 300, 140, 10); c.fill();
  c.font = caveat(46); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("CAD LAB", 0, -8); c.font = caveat(34); c.fillStyle = "#fde047"; c.fillText("Mech Dept", 0, 40);
  c.restore();
  c.beginPath(); c.arc(930, 380, 70, 0, 7); c.fillStyle = "#f8fafc"; c.fill();
  stroke(c, circlePts(930, 380, 70, 70), INK, 6, r, { passes: 2 });
  stroke(c, [[930, 380], [930 - 24, 380 - 30]], INK, 9, r, { passes: 2 });   // hour hand near 11:40
  stroke(c, [[930, 380], [930 - 44, 380 + 26]], INK, 6, r, { passes: 2 });   // minute hand at 40
  c.font = caveat(36); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("11:40 pm", 930, 500);
  void f;
};
const desk = (c: Ctx, r: () => number, f: number, hub: number) => {
  // the monitor with her CAD model
  c.fillStyle = "#1f2937"; rrect(c, 470, 760, 300, 210, 14); c.fill();
  c.fillStyle = "#0b1220"; rrect(c, 482, 772, 276, 170, 8); c.fill();
  c.save(); c.translate(620, 858);
  stroke(c, circlePts(0, 0, 58 * hub + 10, 58 * hub + 10), "#38bdf8", 4, r, { passes: 1 });
  stroke(c, circlePts(0, 0, 22, 22), "#38bdf8", 4, r, { passes: 1 });
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * 40 * hub, Math.sin(a) * 40 * hub, 6, 0, 7); c.strokeStyle = "#38bdf8"; c.lineWidth = 3; c.stroke(); }
  c.restore();
  c.fillStyle = "#374151"; c.fillRect(605, 970, 30, 40); c.fillRect(560, 1004, 120, 14);
  // the bench, the keyboard, a mug, the 3D printer
  c.fillStyle = "#94a3b8"; c.fillRect(-400, DESK, 1880, 40); c.fillStyle = "#64748b"; c.fillRect(-400, DESK + 40, 1880, 600);
  c.fillStyle = "#1f2937"; rrect(c, 520, DESK - 26, 200, 22, 6); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 760, DESK - 70, 54, 64, 10); c.fill(); c.fillStyle = "#7c2d12"; c.fillRect(766, DESK - 62, 42, 12);
  for (let k = 0; k < 2; k++) {   // steam
    const q = ((f / 40 + k / 2) % 1);
    stroke(c, [[778 + k * 16, DESK - 80 - q * 60], [790 + k * 16, DESK - 100 - q * 60]], "#94a3b8", 5, r, { passes: 1, alpha: 0.5 * (1 - q) });
  }
};

// ---------- people ----------
type Who = "meghana" | "kiran";
const LOOK: Record<Who, { skin: string; hair: string; shirt: string; s: number }> = {
  meghana: { skin: "#a86d47", hair: "#1c1410", shirt: "#0d9488", s: 0.9 },
  kiran: { skin: "#94603f", hair: "#1c1410", shirt: "#dc2626", s: 0.98 },
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
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  if (who === "meghana") {   // hair to her shoulders: behind the head and down both sides, clear of the chin (a full oval read as a beard)
    c.fillStyle = L.hair; c.beginPath(); c.ellipse(0, hy - 14, 110, 118, 0, 0, 7); c.fill();
    [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 92, hy + 70, 34, 118, sx * 0.06, 0, 7); c.fill(); });
  } else [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "kiran") {   // spiky
    c.moveTo(-96, hy - 30); c.lineTo(-92, hy - 80); c.lineTo(-60, hy - 130); c.lineTo(-40, hy - 104); c.lineTo(-10, hy - 142); c.lineTo(10, hy - 108);
    c.lineTo(44, hy - 140); c.lineTo(58, hy - 102); c.lineTo(92, hy - 118); c.lineTo(96, hy - 30); c.lineTo(70, hy - 60); c.lineTo(-70, hy - 60);
  } else { c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(10, hy - 80, -98, hy - 30); }
  c.closePath(); c.fill();
  [-1, 1].forEach((sx) => {
    let yi = -164, yo = -164;
    if (m === "yell" || m === "panic") { yi = -150; yo = -172; }
    if (m === "shock" || m === "confused") { yi = -182; yo = -180; }
    if (m === "sad" || m === "tired") { yi = -180; yo = -160; }
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
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
    } else if (m === "tired") {
      stroke(c, [[ex - 14, ey + 2], [ex + 14, ey + 2]], INK, 6, r, { passes: 2 });
      stroke(c, circlePts(ex, ey + 16, 14, 6, 0.3, Math.PI - 0.3, 8), "#7c4a2b", 3, r, { passes: 1, alpha: 0.6 });   // bags under the eyes
    } else {
      c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill();
    }
    if (who === "meghana") stroke(c, circlePts(ex, ey, 30, 26), INK, 5, r, { passes: 2 });   // her glasses
  });
  if (who === "meghana") stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  const my = hy + 80;
  const open = talk || m === "yell" || m === "panic" || m === "shock";
  if (open) {
    const w = m === "yell" || m === "panic" ? 32 : talk ? 21 : 15, h = m === "yell" || m === "panic" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "grin" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "grin" ? 32 : 24, m === "grin" ? 18 : 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
    if (m === "grin") { c.fillStyle = "#fff"; c.fillRect(-22, my - 2, 44, 8); }
  } else if (m === "smug") {
    stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  } else if (m === "sad" || m === "tired") {
    stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  } else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
};
const handPhone = (c: Ctx, x: number, y: number, rot: number) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "#111827"; rrect(c, -40, -70, 80, 140, 12); c.fill();
  c.fillStyle = "#e0f2fe"; rrect(c, -32, -60, 64, 118, 8); c.fill();
  c.restore();
};
const person = (c: Ctx, who: Who, at: Pt, m: Mood, a: Arms, talk: boolean, f: number, r: () => number) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(L.s, L.s);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.lineTo(178, 560); c.lineTo(-178, 560); c.closePath();
  c.fillStyle = L.shirt; c.fill(); c.clip();
  if (who === "kiran") { c.fillStyle = "#fde047"; c.beginPath(); c.arc(0, 200, 46, 0, 7); c.fill(); c.fillStyle = L.shirt; c.font = SANS(44); c.textAlign = "center"; c.fillText("?", 0, 216); }   // a T-shirt print
  if (who === "meghana") { c.fillStyle = "#99f6e4"; c.fillRect(-14, 30, 28, 140); }   // the kurta placket
  c.restore();
  stroke(c, [[-140, 34], [-178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 220], [-140, 330]], rr: Pt[] = [[178, 220], [140, 330]], rp = false;
  if (a === "phoneup") { rr = [[200, 40], [150, -150]]; }
  else if (a === "point") { rr = [[220, 30], [320, -110]]; rp = true; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  else if (a === "up") { l = [[-220, -20], [-190, -170]]; rr = [[220, -20], [190, -170]]; }
  else if (a === "type") { l = [[-150, 210], [-20, 270]]; rr = [[150, 210], [40, 270]]; }
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  else if (a === "facepalm") { rr = [[170, 120], [40, -150]]; }
  limb(c, [S, l[0], l[1]], L.shirt, r); palm(c, l[1][0], l[1][1], L.skin, r);
  if (a !== "facepalm") { limb(c, [R, rr[0], rr[1]], L.shirt, r); palm(c, rr[1][0], rr[1][1], L.skin, r, rp); }
  if (a === "phoneup") handPhone(c, 150, -230, 0.15);
  face(c, who, m, talk, r);
  if (a === "facepalm") { limb(c, [R, rr[0], rr[1]], L.shirt, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  c.restore();
  void f;
};

// ---------- inserts ----------
const card = (c: Ctx, W: number, title: string, r: () => number) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#fffdf5"; rrect(c, 70, 220, W - 140, 1240, 40); c.fill();
  c.font = SANS(40); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText(title, W / 2, 300);
  stroke(c, [[120, 330], [W - 120, 330]], "#cbd5e1", 3, r, { passes: 1 });
};
// a wheel, exploded by `e` (0 = assembled, 1 = parts apart)
const wheel = (c: Ctx, x: number, y: number, s: number, e: number, r: () => number, parts = 1) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const sh = (k: number) => (k - 1.5) * 150 * e;
  if (parts > 0) { c.beginPath(); c.arc(sh(0), 0, 150, 0, 7); c.arc(sh(0), 0, 108, 0, 7, true); c.fillStyle = "#1f2937"; c.fill(); }   // the tyre
  if (parts > 0.25) { c.beginPath(); c.arc(sh(1), 0, 106, 0, 7); c.arc(sh(1), 0, 60, 0, 7, true); c.fillStyle = "#94a3b8"; c.fill(); stroke(c, circlePts(sh(1), 0, 106, 106), INK, 4, r, { passes: 1 }); }   // the rim
  if (parts > 0.5) { c.beginPath(); c.arc(sh(2), 0, 58, 0, 7); c.fillStyle = "#cbd5e1"; c.fill(); stroke(c, circlePts(sh(2), 0, 58, 58), INK, 4, r, { passes: 1 });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; c.beginPath(); c.arc(sh(2) + Math.cos(a) * 36, Math.sin(a) * 36, 7, 0, 7); c.fillStyle = INK; c.fill(); } }   // the hub
  if (parts > 0.75) for (let k = 0; k < 5; k++) { c.fillStyle = "#facc15"; rrect(c, sh(3) - 10 + (k - 2) * 26 * (1 + e), -24 + (k % 2) * 30 * e, 20, 46, 4); c.fill(); }   // bolts
  c.restore();
};
// one hub drawn the CAD way: a sketched circle, stretched into a disc, bolt holes cut (k: 0 -> 1)
const hubPart = (c: Ctx, x: number, y: number, s: number, k: number, r: () => number) => {
  const k1 = clamp(k * 3), k2 = clamp(k * 3 - 1), k3 = clamp(k * 3 - 2), sq = 1 - 0.55 * k2;
  c.save(); c.translate(x, y); c.scale(s, s);
  if (k2 > 0) {
    c.fillStyle = "#93c5fd"; c.beginPath(); c.ellipse(0, 34 * k2, 120, 120 * sq, 0, 0, 7); c.fill();
    c.fillStyle = "#bfdbfe"; c.beginPath(); c.ellipse(0, 0, 120, 120 * sq, 0, 0, 7); c.fill();
  }
  if (k1 > 0) stroke(c, circlePts(0, 0, 120, 120 * sq, 0, Math.PI * 2 * k1, 40), BLUE, 7, r, { passes: 2 });
  if (k3 > 0) {
    c.globalAlpha = k3; c.fillStyle = "#0f172a";
    for (let q = 0; q < 5; q++) { const a = (q / 5) * Math.PI * 2; c.beginPath(); c.ellipse(Math.cos(a) * 72, Math.sin(a) * 72 * sq, 15, 15 * sq, 0, 0, 7); c.fill(); }
    c.beginPath(); c.ellipse(0, 0, 32, 32 * sq, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  }
  c.restore();
};
const rule = (c: Ctx, W: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, 1270);
  c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, -480, -200, 960, 400, 28); c.fill();
  c.font = SANS(46); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("NEW AI LAUNCH? ASK:", 0, -120);
  c.textAlign = "left"; c.font = SANS(48); c.fillStyle = "#f8fafc";
  ["1  Who tested it?", "2  Against what, on which task?", "3  Can I use it today?"].forEach((t, i) => c.fillText(t, -420, -40 + i * 78));
  c.restore();
};

// ---------- the scene ----------
const StLab: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.shot === "card") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.55} />, <Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "launch") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_snap.wav" vol={0.4} />);
    if (b.prop === "own") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) - 2} src="audio/gag_bonk.wav" vol={0.4} />);
    if (b.prop === "split") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.5) + q * 8} src="audio/sfx_pop.wav" vol={0.28} />));
    if (b.prop === "sketch") {
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={cue(i, 1, 0.4) + q * 10} src="audio/sfx_tick.wav" vol={0.3} />));
      sfx.push(<Sfx key={k("r")} at={end - 30} src="reel/sfx_riser.wav" vol={0.28} />);
      const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("q" + q)} at={nx - 100 + q * 30} src="audio/sfx_tick.wav" vol={0.4} />));   // the quiz's 3-2-1
    }
    if (b.prop === "who") sfx.push(<Sfx key={k("b")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "same") sfx.push(<Sfx key={k("h")} at={at - 14} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("t")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "house") sfx.push(<Sfx key={k("o")} at={cue(i, 1, 0.5)} src="audio/gag_boing.wav" vol={0.4} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.4)} src="audio/sfx_snap.wav" vol={0.4} />);
    if (b.prop === "again") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("n" + q)} at={cue(i, 1, 0.2) + Math.round(q * 6 * (1 - q * 0.08))} src="audio/sfx_pop.wav" vol={0.3} />));
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(5200 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        if (b.shot === "card") {
          // ---------- full-frame inserts ----------
          if (n === 3 || n === 5) {
            card(c, W, "the launch post (Oct 19, 2026)", r);
            c.font = SANS(44, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("Skyfall AI", W / 2, 420);
            c.font = SANS(110); c.fillStyle = INK; c.fillText("SKY-001", W / 2, 560);
            c.font = handF(46); c.fillStyle = "#334155"; c.fillText("\"the first engineering world model\"", W / 2, 640);
            wheel(c, W / 2, 870, 0.9, 0.6 + 0.4 * Math.sin(f / 18), r, 1);
            const c1 = n === 3 ? cu(1, 0.4) : ln.from - 40;
            if (f >= c1 - 4) {
              const k = seg(f, c1 - 4, c1 + 8);
              tag(c, "51x faster", 330, 1150, 80, "#dcfce7", "#14532d", -0.04, k);
              tag(c, "150x cheaper", 760, 1150, 80, "#fef3c7", INK, 0.04, k);
              c.save(); c.globalAlpha = k; c.font = SANS(40, 600); c.fillStyle = "#475569"; c.textAlign = "center";
              c.fillText("than GPT-6 Astra, on design tasks", W / 2, 1270); c.restore();
            }
            if (n === 5) { const c2 = cu(1, 0.5); if (f >= c2 - 4) stamp(c, "THEIR OWN TEST", W / 2, 1000, 96, "#334155", seg(f, c2 - 4, c2 + 6), r, -0.08); }
          }
          if (n === 7 || n === 9) {
            card(c, W, "how it works, per Skyfall", r);
            const c1 = cu(1, 0.45);
            c.textAlign = "left"; c.font = SANS(42); c.fillStyle = BLUE;
            if (n === 7) {
              c.fillText("1  picture or text → rough 3D shapes", 120, 420);
              [0, 1, 2].forEach((q) => { const k = seg(f, ln.from + q * 6, ln.from + q * 6 + 10); if (k > 0) { c.save(); c.globalAlpha = k; wheel(c, 230 + q * 310, 600, 0.55, 0, r, [1, 0.6, 0.3][q]); c.restore(); } });
              const cw = c1 - 26;   // "That's the world model", just before the cue
              if (f >= cw) tag(c, "world model = imagines the shape first", W / 2, 775, 62, "#fef3c7", INK, -0.02, seg(f, cw, cw + 8));
              if (f >= c1 - 4) {
                c.textAlign = "left"; c.font = SANS(42); c.fillStyle = BLUE; c.fillText("2  split into parts, down to screws", 120, 880);
                wheel(c, W / 2, 1110, 0.75, easeOut(seg(f, c1, c1 + 24)), r, 1);
                c.font = handF(40); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("tyre · rim · hub · bolts", W / 2, 1350);
              }
            } else {
              c.fillText("3  each part drawn like a designer:", 120, 420);
              const k1 = seg(f, c1 - 4, c1 + 6), k2 = seg(f, c1 + 10, c1 + 22), k3 = seg(f, c1 + 26, c1 + 38);
              c.save(); c.translate(W / 2, 740);
              if (k1 > 0) { stroke(c, circlePts(0, 0, 150 * k1 + 1, 150 * k1 + 1, 0, Math.PI * 2 * k1, 40), BLUE, 8, r, { passes: 2 }); c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.fillText("sketch", -300, -170); }
              if (k2 > 0) { c.fillStyle = "#93c5fd"; c.beginPath(); c.ellipse(0, 40 * k2, 150, 150 * (1 - 0.6 * k2), 0, 0, 7); c.fill(); c.fillStyle = "#bfdbfe"; c.beginPath(); c.ellipse(0, 0, 150, 150 * (1 - 0.6 * k2), 0, 0, 7); c.fill(); c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.fillText("stretch", 300, -170); }
              if (k3 > 0) for (let q = 0; q < 5; q++) { const a = (q / 5) * Math.PI * 2; c.save(); c.globalAlpha = k3; c.beginPath(); c.ellipse(Math.cos(a) * 90, Math.sin(a) * 36, 20, 12, 0, 0, 7); c.fillStyle = "#0f172a"; c.fill(); c.restore(); }
              if (k3 > 0) { c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.globalAlpha = k3; c.fillText("cut", 0, 280); c.globalAlpha = 1; }
              c.restore();
              const c2 = cu(2, 0.7);   // the post's own claim, read out: the quiz asks about it
              if (f >= c2 - 4) {
                const k = seg(f, c2 - 4, c2 + 6);
                c.save(); c.globalAlpha = k; c.textAlign = "center";
                c.font = SANS(38, 600); c.fillStyle = "#64748b"; c.fillText("the post also says:", W / 2, 1220);
                c.font = handF(60); c.fillStyle = COL.red; c.fillText("\"more accurate than all of them!\"", W / 2, 1310);
                c.restore();
              }
            }
          }
          if (n === 10) {   // the numbers, their test: the shape match first (a tie), then the speed and the cost
            card(c, W, "Skyfall's own test · 3D CAD parts", r);
            const c1 = cu(1, 0.35), c2 = cu(2, 0.6);
            const rows: [string, string, string, number, number, string, number, number][] = [
              ["shape match", "79.7%", "79.1%", 0.797, 0.791, "a tie", ln.from, c1],
              ["time per design", "3.9 s", "199 s", 3.9 / 199, 1, "51x faster", c2 - 8, c2 + 2],
              ["cost per design", "$0.005", "$0.75", 0.005 / 0.75, 1, "150x cheaper", c2 + 4, c2 + 14]];
            rows.forEach(([lab, a, bb, va, vb, note, t0, tt], q) => {
              const y = 430 + q * 330, k = seg(f, t0, t0 + 10);
              if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 2);
              c.font = SANS(46); c.fillStyle = INK; c.textAlign = "left"; c.fillText(lab, 130, y);
              c.font = SANS(36, 600); c.fillStyle = GREEN; c.fillText("SKY-001", 130, y + 70); c.fillStyle = ORANGE; c.fillText("GPT-6 Astra", 130, y + 160);
              c.fillStyle = GREEN; rrect(c, 390, y + 36, Math.max(14, 400 * va * easeOut(k)), 46, 10); c.fill();
              c.fillStyle = ORANGE; rrect(c, 390, y + 126, Math.max(14, 400 * vb * easeOut(k)), 46, 10); c.fill();
              c.font = SANS(40); c.fillStyle = INK; c.textAlign = "right"; c.fillText(a, W - 110, y + 72); c.fillText(bb, W - 110, y + 162);
              if (f >= tt) tag(c, note, 640, y + 245, 68, q === 0 ? "#e0e7ff" : "#dcfce7", INK, -0.02, seg(f, tt, tt + 8));
              c.restore();
            });
          }
          if (n === 11) {   // the shape match on a floor plan
            card(c, W, "Skyfall's own test · floor plans", r);
            const c1 = cu(1, 0.6), tA = ln.from + Math.round((c1 - ln.from) * 0.5);
            const k = easeOut(seg(f, ln.from, tA));
            c.save(); c.translate(W / 2 - 40, 740);
            c.fillStyle = "rgba(37,99,235,0.18)"; c.fillRect(-260, -220, 440, 390); stroke(c, [[-260, -220], [180, -220], [180, 170], [-260, 170], [-260, -220]], BLUE, 8, r, { passes: 2 });
            const ox = -100 + 170 * k, oy = -130 + 100 * k;
            c.fillStyle = "rgba(234,88,12,0.18)"; c.fillRect(ox, oy, 360, 340); stroke(c, [[ox, oy], [ox + 360, oy], [ox + 360, oy + 340], [ox, oy + 340], [ox, oy]], ORANGE, 8, r, { passes: 2 });
            c.restore();
            c.font = SANS(40, 600); c.textAlign = "left"; c.fillStyle = BLUE; c.fillText("the right plan", 130, 1110); c.fillStyle = ORANGE; c.fillText("the AI's plan", 600, 1110);
            if (f >= tA) tag(c, "SKY-001: 44% match", W / 2, 1200, 62, "#fee2e2", "#991b1b", -0.02, seg(f, tA, tA + 8));
            if (f >= c1 - 4) tag(c, "GPT-6 Astra: 41%", W / 2, 1300, 54, "#ffedd5", "#9a3412", 0.02, seg(f, c1 - 4, c1 + 6));
            c.font = SANS(30, 600); c.fillStyle = "#64748b"; c.textAlign = "center";
            c.fillText("match = how much of the plan lines up", W / 2, 1385); c.fillText("their test: 43.6% vs 40.6%", W / 2, 1428);
          }
        } else {
          // ---------- the lab ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.12) || (n === 15 && f >= cu(1, 0.2) && f < cu(1, 0.2) + 8) ? 8 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = "#dbe4ee"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          lab(c, r, f);
          const pose = (who: Who): [Mood, Arms] => POSE[who][n] ?? ["calm", "rest"];
          const [mm, ma] = pose("meghana");
          person(c, "meghana", MEG, mm, ma, b.who === "meghana" && talking, f, r);
          desk(c, r, f, 0.7 + 0.3 * Math.sin(f / 50));
          const [km, ka] = pose("kiran");
          person(c, "kiran", KIR, km, ka, b.who === "kiran" && talking, f, r);
          c.restore();
          // screen-space props
          if (n === 1) {   // frame 1 (sound off too): the headline, and his phone with a hub drawing itself
            c.save(); c.fillStyle = "rgba(15,23,42,0.94)"; rrect(c, 150, 262, 780, 210, 30); c.fill();
            c.font = SANS(76); c.textAlign = "center"; c.fillStyle = "#4ade80"; c.fillText("AI: 4 SECONDS", W / 2, 350);
            c.fillStyle = "#fca5a5"; c.fillText("HER: 3 HOURS", W / 2, 442); c.restore();
            const c1 = cu(1, 0.3), pop = 1 + 0.12 * (1 - clamp(Math.abs(f - c1) / 6));
            c.save(); c.translate(800, 1240); c.rotate(0.04); c.scale(pop, pop);
            c.fillStyle = "#0b1220"; rrect(c, -150, -190, 300, 380, 36); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, -134, -174, 268, 348, 26); c.fill();
            hubPart(c, 0, 40, 0.85, f < c1 - 2 ? 1 : easeOut(seg(f, c1 - 2, c1 + 28)), r);
            c.font = SANS(40); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("4 SECONDS!", 0, -118);
            c.restore();
          }
          if (n === 2) {
            tag(c, "hub_v7_FINAL_final.cad", W / 2, 330, 64, "#fee2e2", "#991b1b", -0.02, seg(p, 0.03, 0.12));
            tag(c, "3 h 02 min", W / 2, 445, 64, "#fee2e2", "#991b1b", 0.02, seg(p, 0.3, 0.4));
          }
          if (b.prop === "who") bubble(c, 380, 520, "Says who?", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 12) bubble(c, 380, 520, "Less than half?!", 72, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 13) bubble(c, 700, 520, "Tonight?", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 14) {
            tag(c, "waitlist only · no price yet", W / 2, 325, 60, "#fef3c7", INK, -0.02, seg(f, ln.from + 2, ln.from + 10));
            tag(c, "no outside test yet", W / 2, 435, 60, "#fef3c7", INK, 0.02, seg(f, ln.from + 10, ln.from + 18));
            rule(c, W, seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 6));
          }
          if (n === 15) {   // the next viral post: the loop
            const c1 = cu(1, 0.2), k = easeOut(seg(f, c1 - 2, c1 + 6));
            c.save(); c.globalAlpha = k; c.translate(W / 2, 330);
            c.fillStyle = "#111827"; rrect(c, -420, -80, 840, 160, 30); c.fill();
            c.font = SANS(56); c.fillStyle = "#fde047"; c.textAlign = "center"; c.fillText("NEW AI: 1000x FASTER!!!", 0, 20);
            c.restore();
          }
        }
        // the quiz card, held after line 9 (screen space, over the insert); its 3-2-1 ends as the card leaves
        if (n === 9 && f > endL + 10) {
          const next = ls[i + 1] ? ls[i + 1].from : s.frames;
          const k = easeOut(seg(f, endL + 10, endL + 16)) * (1 - seg(f, next - 10, next - 2));
          c.save(); c.globalAlpha = 0.6 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
          c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
          c.fillStyle = "#fffdf5"; rrect(c, -480, -400, 960, 800, 30); c.fill();
          c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -320);
          c.font = SANS(54); c.fillStyle = INK; c.fillText("Shape match, their test:", 0, -235);
          c.font = SANS(60); c.fillStyle = GREEN; c.fillText("SKY-001  79.7%", 0, -152); c.fillStyle = ORANGE; c.fillText("GPT-6 Astra  79.1%", 0, -76);
          c.textAlign = "left"; c.font = SANS(56);
          c.fillStyle = "#e0e7ff"; rrect(c, -420, -30, 840, 100, 22); c.fill(); c.fillStyle = INK; c.fillText("A)  more accurate", -380, 40);
          c.fillStyle = "#e0e7ff"; rrect(c, -420, 90, 840, 100, 22); c.fill(); c.fillStyle = INK; c.fillText("B)  a tie", -380, 160);
          c.font = SANS(44, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A or B", 0, 252);
          const t = f - (next - 100), q = 3 - Math.floor(t / 30);
          if (t >= 0 && q >= 1) {
            const pop = 1 + 0.25 * (1 - clamp((t % 30) / 6));
            c.save(); c.translate(0, 330); c.scale(pop, pop);
            c.beginPath(); c.arc(0, 0, 52, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
            c.font = SANS(70); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 25); c.restore();
          }
          c.restore();
        }
        void caveat;
      }} />
    </>
  );
};

export const LAB_SCENES = { sk_lab: StLab };
