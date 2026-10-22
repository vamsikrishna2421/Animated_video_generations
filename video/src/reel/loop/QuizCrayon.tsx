import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK, caveat, stamp } from "./WordsCrayon";

// Skit 06 "Who's the AI?" (series/scripts/skit06_dont_know.md): a TV quiz stage. Host Meera asks three contestants behind
// frosted screens when "Ramulu Tiffins" opens (we made it up). A = Ammamma, B = Vamsi (a delivery rider), C = the AI: a
// phone on a stool behind a cardboard cutout, in a cardboard moustache, with the surest answer. The screens drop; the real
// numbers from our test; the fix ("If you're not sure, say I don't know"); loops to frame 1. One beat per line
// (s.data.beats); visuals key on the beat's prop, so the English and Telugu reels share them.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; from?: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "talk" | "shock" | "happy" | "smug" | "calm" | "laugh" | "stern";
type Arms = "rest" | "point" | "up" | "card" | "aim" | "wag" | "shrug";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", GOLD = "#facc15", RED = "#dc2626";
const PX: Record<string, number> = { a: 420, b: 665, c: 905 };   // podium centres (world)
const SCR = { w: 226, top: 630, bot: 1140 };                      // the frosted screens
const POD = { top: 1140, bot: 1400 };
const HOST: Pt = [118, 960];                                     // the host's neck
const NECK = 970;                                                 // the contestants' necks
const BOARD_Y = 440;                                              // the LED board (wide shots only)
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.08, x: 560, y: 920 }, reveal: { z: 1.08, x: 560, y: 920 }, card: { z: 1.08, x: 560, y: 920 },
  host: { z: 1.7, x: 200, y: 800 },
  podA: { z: 1.6, x: 420, y: 930 }, podB: { z: 1.6, x: 665, y: 930 }, podC: { z: 1.6, x: 905, y: 930 },
  phone: { z: 1.08, x: 560, y: 920 },   // drawn as its own close-up (phoneClose)
};
// on-screen text per prop (English on both reels)
const SAY: Record<string, [string, string?]> = {
  ansA: ["Never heard of it."], ansB: ["No idea. I'd call."], ansC: ["6:30 SHARP!", "Famous ghee dosa!"],
  source: ["Source?"], book: ["\"Hyderabad Food Guide,", "page 42\""], nobook: ["No such book!"],
};

// ---------- the studio ----------
const studio = (c: Ctx, r: () => number, f: number) => {
  const g = c.createLinearGradient(0, -200, 0, 1400); g.addColorStop(0, "#0b0a2e"); g.addColorStop(1, "#3b1c6e");
  c.fillStyle = g; c.fillRect(-800, -500, 2700, 1900);
  for (let k = -7; k < 17; k++) {   // light strips on the back wall
    c.fillStyle = k % 2 ? "rgba(147,51,234,0.22)" : "rgba(59,130,246,0.2)"; c.fillRect(k * 110 + 20, 520, 24, 860);
  }
  [[170, 0.4], [540, -0.3], [900, 1.1]].forEach(([x, ph]) => {   // three spotlights, slowly sweeping
    const a = Math.sin(f / 46 + ph * 3) * 0.1;
    c.save(); c.translate(x, -80); c.rotate(a);
    const cg = c.createLinearGradient(0, 0, 0, 1460); cg.addColorStop(0, "rgba(255,255,255,0.28)"); cg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = cg; c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.lineTo(250, 1460); c.lineTo(-250, 1460); c.closePath(); c.fill();
    c.restore();
  });
  c.fillStyle = "#120f2e"; c.fillRect(-800, 1380, 2700, 800);   // the floor
  c.fillStyle = "rgba(250,204,21,0.1)"; c.beginPath(); c.ellipse(640, 1440, 600, 64, 0, 0, 7); c.fill();
  stroke(c, [[-800, 1380], [1900, 1380]], "#a78bfa", 6, r, { passes: 2, alpha: 0.6 });
};
// the LED board: the title and the clock (null = no clock)
const board = (c: Ctx, f: number, secs: number | null, title: string, alarm: boolean) => {
  c.save(); c.translate(560, BOARD_Y);
  c.fillStyle = "#05040f"; rrect(c, -430, -130, 860, 250, 28); c.fill();
  c.strokeStyle = "#7c3aed"; c.lineWidth = 8; rrect(c, -430, -130, 860, 250, 28); c.stroke();
  for (let k = 0; k < 15; k++) [-130, 120].forEach((y, q) => {   // chasing bulbs
    const on = (Math.floor(f / 4) + k + q) % 2 === 0;
    c.beginPath(); c.arc(-392 + k * 56, y, 9, 0, 7); c.fillStyle = on ? GOLD : "#6b4e00"; c.fill();
  });
  c.textAlign = "center"; c.font = SANS(84, 900); c.fillStyle = GOLD; c.shadowColor = GOLD; c.shadowBlur = 26;
  c.fillText(title, 0, secs === null ? 28 : -10);
  if (secs !== null) {
    const red = alarm || secs <= 5;
    c.font = SANS(70, 900); c.fillStyle = red ? "#f87171" : "#fecaca"; c.shadowColor = red ? "#ef4444" : "#fca5a5";
    c.fillText(alarm ? "TIME'S UP!" : `0:${String(Math.max(0, Math.ceil(secs))).padStart(2, "0")}`, 0, 84);
  }
  c.shadowBlur = 0; c.restore();
};
const podium = (c: Ctx, x: number, letter: string, lit: boolean, r: () => number) => {
  c.fillStyle = "#1e3a8a"; c.beginPath(); c.moveTo(x - 118, POD.top); c.lineTo(x + 118, POD.top); c.lineTo(x + 102, POD.bot); c.lineTo(x - 102, POD.bot); c.closePath(); c.fill();
  c.fillStyle = "#312e81"; rrect(c, x - 130, POD.top - 20, 260, 28, 8); c.fill();
  c.beginPath(); c.arc(x, POD.top + 122, 64, 0, 7); c.fillStyle = lit ? GOLD : "#f8fafc"; c.fill();
  stroke(c, circlePts(x, POD.top + 122, 64, 64), INK, 5, r, { passes: 2, alpha: 0.6 });
  c.font = SANS(80, 900); c.fillStyle = "#1e1b4b"; c.textAlign = "center"; c.fillText(letter, x, POD.top + 150);
  c.beginPath(); c.ellipse(x + 92, POD.top - 26, 28, 13, 0, 0, 7); c.fillStyle = lit ? "#ef4444" : "#7f1d1d"; c.fill();   // the buzzer
};
// what the frosted glass shows: a soft dark shape (a bun, a helmet, a cardboard man)
const silhouette = (c: Ctx, x: number, who: string, bob: number) => {
  c.fillStyle = "rgba(15,23,42,0.9)";
  const hy = NECK - 120 + bob;
  c.beginPath(); c.ellipse(x, hy, 60, 72, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(x - 104, SCR.bot); c.quadraticCurveTo(x - 100, NECK + 8, x, NECK - 4 + bob); c.quadraticCurveTo(x + 100, NECK + 8, x + 104, SCR.bot); c.closePath(); c.fill();
  if (who === "a") { c.beginPath(); c.arc(x + 6, hy - 76, 30, 0, 7); c.fill(); }
  if (who === "b") { c.beginPath(); c.ellipse(x, hy - 34, 80, 62, 0, Math.PI, 0); c.fill(); }
  if (who === "c") { c.fillRect(x - 58, hy - 80, 116, 22); }
};
const screenPanel = (c: Ctx, x: number, who: string, up: number, lit: boolean, bob: number, r: () => number) => {
  if (up <= 0) return;
  const h = (SCR.bot - SCR.top) * up, y = SCR.bot - h;
  c.save(); c.beginPath(); c.rect(x - SCR.w / 2, y, SCR.w, h); c.clip();
  c.fillStyle = "#cbd5e1"; c.fillRect(x - SCR.w / 2, y, SCR.w, h);
  silhouette(c, x, who, bob);
  c.fillStyle = lit ? "rgba(224,242,254,0.55)" : "rgba(226,232,240,0.62)"; c.fillRect(x - SCR.w / 2, y, SCR.w, h);
  c.fillStyle = "rgba(255,255,255,0.18)"; for (let k = 0; k < 5; k++) c.fillRect(x - SCR.w / 2 + 16 + k * 46, y, 10, h);   // frosted streaks
  c.restore();
  stroke(c, [[x - SCR.w / 2, y], [x + SCR.w / 2, y], [x + SCR.w / 2, SCR.bot], [x - SCR.w / 2, SCR.bot], [x - SCR.w / 2, y]], lit ? GOLD : "#e2e8f0", 7, r, { passes: 2, alpha: 0.85 });
};

// ---------- people ----------
type Look = { skin: string; hair: string; top: string; s: number; style: "bob" | "bun" | "short"; glasses?: boolean; bindi?: boolean; old?: boolean; helmet?: string };
const LOOK: Record<string, Look> = {
  host: { skin: "#a86d47", hair: "#1c1410", top: "#be185d", s: 0.92, style: "bob", bindi: true },
  a: { skin: "#9a6342", hair: "#d4d4d8", top: "#7f1d1d", s: 0.86, style: "bun", glasses: true, bindi: true, old: true },
  b: { skin: "#8d5a3b", hair: "#1c1410", top: "#0f766e", s: 0.86, style: "short", helmet: "#2563eb" },
};
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, point = false) => {
  c.beginPath(); c.arc(x, y, 24, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, 24, 24), INK, 3, r, { passes: 1, alpha: 0.55 });
  if (point) stroke(c, [[x + 6, y - 16], [x + 24, y - 48]], skin, 14, r, { passes: 2 });
};
const face = (c: Ctx, L: Look, m: Mood, talk: boolean, r: () => number) => {
  const hy = -130, girl = L.style !== "short";
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  if (L.style === "bun") { c.fillStyle = L.hair; c.beginPath(); c.arc(8, hy - 112, 44, 0, 7); c.fill(); }
  if (L.style === "bob") { c.fillStyle = L.hair; c.beginPath(); c.ellipse(0, hy - 10, 116, 128, 0, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(112, hy + 54); c.lineTo(-112, hy + 54); c.closePath(); c.fill(); }
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (L.style === "short") { c.ellipse(0, hy - 64, 98, 58, 0, Math.PI, 0); c.lineTo(96, hy - 40); c.lineTo(60, hy - 58); c.lineTo(10, hy - 46); c.lineTo(-60, hy - 58); c.lineTo(-96, hy - 40); }
  else { c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(40, hy - 70, 0, hy - 76); c.quadraticCurveTo(-40, hy - 70, -98, hy - 10); }
  c.closePath(); c.fill();
  if (L.helmet) {   // a rider's helmet pushed up on the head
    c.fillStyle = L.helmet; c.beginPath(); c.ellipse(0, hy - 92, 112, 70, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = "#93c5fd"; c.beginPath(); c.ellipse(0, hy - 96, 88, 22, 0, Math.PI, 0); c.closePath(); c.fill();
  }
  if (L.bindi) { c.beginPath(); c.arc(0, hy - 46, 7, 0, 7); c.fillStyle = RED; c.fill(); }
  [-1, 1].forEach((sx) => {   // brows
    let yi = -164, yo = -164;
    if (m === "stern") { yi = -152; yo = -170; }
    if (m === "shock") { yi = -184; yo = -182; }
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.old ? "#a1a1aa" : L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {   // eyes
    const ey = hy - 4;
    if (m === "shock") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "laugh") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 3, ey + 4, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
    if (girl) stroke(c, [[ex - 16, ey - 10], [ex - 24, ey - 16]], INK, 3, r, { passes: 1 });
  });
  if (L.glasses) {
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 26), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  if (L.old) [-1, 1].forEach((sx) => stroke(c, [[sx * 58, hy + 30], [sx * 50, hy + 48]], "#7c4a2b", 3, r, { passes: 1, alpha: 0.7 }));   // laugh lines
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  const my = hy + 80;
  if (m === "laugh") { c.beginPath(); c.ellipse(0, my - 2, 30, 22, 0, 0, Math.PI); c.fillStyle = "#3b0d0d"; c.fill(); }
  else if (talk || m === "shock") {
    const w = talk ? 21 : 15, h = talk ? 13 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "calm") stroke(c, circlePts(0, my - 8, 24, 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
};
const person = (c: Ctx, who: string, at: Pt, m: Mood, a: Arms, talk: boolean, f: number, r: () => number) => {
  const L = LOOK[who];
  const bob = talk ? Math.sin(f * 0.9) * 3 : 0;
  c.save(); c.translate(at[0], at[1] + bob); c.scale(L.s, L.s);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.lineTo(178, 560); c.lineTo(-178, 560); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "host") {   // a sequinned blazer over a white top
    c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-40, 20); c.lineTo(40, 20); c.lineTo(20, 560); c.lineTo(-20, 560); c.closePath(); c.fill();
    const rr = rng(31); c.fillStyle = "rgba(255,255,255,0.55)"; for (let k = 0; k < 60; k++) { c.beginPath(); c.arc(-170 + rr() * 340, 40 + rr() * 520, 3, 0, 7); c.fill(); }
  }
  if (who === "a") { c.fillStyle = "#f59e0b"; c.beginPath(); c.moveTo(60, 30); c.lineTo(150, 30); c.lineTo(80, 560); c.lineTo(-20, 560); c.closePath(); c.fill(); }   // the saree's border
  if (who === "b") { c.fillStyle = "#e2e8f0"; c.fillRect(-180, 200, 360, 22); c.fillRect(-180, 300, 360, 22); }   // reflective stripes
  c.restore();
  stroke(c, [[-140, 34], [-178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-140, 340]], rr: Pt[] = [[178, 230], [140, 340]], rp = false;
  if (a === "point") { rr = [[230, 20], [330, -110]]; rp = true; }
  else if (a === "aim") { rr = [[240, 120], [360, 60]]; rp = true; }
  else if (a === "up") { l = [[-220, -20], [-190, -170]]; rr = [[220, -20], [190, -170]]; }
  else if (a === "card") { rr = [[200, 180], [120, 110]]; }
  else if (a === "wag") { rr = [[210, 0], [170, -140]]; rp = true; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r);
  if (who === "host") {   // the handheld mic in her left hand
    c.save(); c.translate(l[1][0] + 10, l[1][1] - 30); c.rotate(-0.3);
    c.fillStyle = "#111827"; rrect(c, -12, -10, 24, 90, 8); c.fill(); c.beginPath(); c.arc(0, -22, 24, 0, 7); c.fillStyle = "#9ca3af"; c.fill(); c.restore();
  }
  limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r, rp);
  if (a === "card") { c.save(); c.translate(rr[1][0] + 20, rr[1][1] - 40); c.rotate(0.15); c.fillStyle = "#1d4ed8"; rrect(c, -44, -60, 88, 120, 10); c.fill(); c.fillStyle = GOLD; c.font = SANS(40, 900); c.textAlign = "center"; c.fillText("?", 0, 14); c.restore(); }
  face(c, L, m, talk, r);
  c.restore();
};
// the AI: a phone on a stool, a cardboard moustache and paper glasses taped on its screen; the cardboard man behind it
const aiPhone = (c: Ctx, x: number, f: number, talk: boolean, mood: "smile" | "sad" | "idk", fall: number, r: () => number) => {
  c.save(); c.translate(x + 60, 1130); c.rotate(-1.35 * easeOut(fall));   // the cutout tips over after the reveal
  c.fillStyle = "#b08d5b"; c.beginPath(); c.ellipse(-60, -250, 56, 68, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(-160, 0); c.quadraticCurveTo(-156, -150, -60, -166); c.quadraticCurveTo(36, -150, 40, 0); c.closePath(); c.fill();
  stroke(c, circlePts(-60, -250, 56, 68), "#7c5a2b", 5, r, { passes: 1, alpha: 0.7 });
  c.restore();
  stroke(c, [[x - 70, 1130], [x - 50, 990]], "#92400e", 14, r, { passes: 2 }); stroke(c, [[x + 70, 1130], [x + 50, 990]], "#92400e", 14, r, { passes: 2 });   // the stool
  c.fillStyle = "#b45309"; rrect(c, x - 90, 970, 180, 30, 12); c.fill();
  stroke(c, [[x, 970], [x, 930]], "#334155", 10, r, { passes: 1 });   // the phone stand
  c.save(); c.translate(x, 840 + (talk ? Math.sin(f * 0.9) * 2 : 0));
  c.fillStyle = "#0f172a"; rrect(c, -64, -110, 128, 210, 18); c.fill();
  c.fillStyle = mood === "sad" ? "#1e293b" : "#1e3a8a"; rrect(c, -54, -98, 108, 186, 12); c.fill();
  if (mood === "idk") {
    c.fillStyle = "#f8fafc"; c.font = SANS(22, 800); c.textAlign = "center"; c.fillText("I don't", 0, 4); c.fillText("know.", 0, 30);
    c.beginPath(); c.arc(0, -48, 22, 0, 7); c.fillStyle = GREEN; c.fill();
    stroke(c, [[-10, -48], [-2, -38], [12, -58]], "#fff", 5, r, { passes: 1 });
  } else {
    c.fillStyle = "#e0f2fe";   // its eyes
    [-24, 24].forEach((ex) => { c.beginPath(); if (mood === "sad") c.ellipse(ex, -36, 9, 5, 0, 0, 7); else c.arc(ex, -38, 9, 0, 7); c.fill(); });
    if (talk) { c.beginPath(); c.ellipse(0, 36, 18, 10 + Math.abs(Math.sin(f * 0.8)) * 6, 0, 0, 7); c.fillStyle = "#e0f2fe"; c.fill(); }
    else if (mood === "sad") stroke(c, circlePts(0, 48, 18, 9, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), "#e0f2fe", 5, r, { passes: 1 });
    else stroke(c, circlePts(0, 26, 20, 10, 0.25, Math.PI - 0.25, 10), "#e0f2fe", 5, r, { passes: 1 });
  }
  // the cardboard disguise: paper glasses and a moustache (it droops when it's caught)
  [-26, 26].forEach((ex) => stroke(c, circlePts(ex, -38, 22, 18), "#fef3c7", 5, r, { passes: 1, alpha: 0.9 }));
  c.save(); c.translate(0, 8); c.rotate(mood === "sad" ? 0.35 : 0);
  c.fillStyle = "#3f2a1d"; c.beginPath(); c.moveTo(0, -4);
  c.quadraticCurveTo(-30, -16, -52, 4); c.quadraticCurveTo(-30, 2, 0, 8); c.quadraticCurveTo(30, 2, 52, 4); c.quadraticCurveTo(30, -16, 0, -4); c.fill();
  c.restore();
  c.fillStyle = "rgba(255,255,255,0.75)"; c.fillRect(-60, -6, 18, 8); c.fillRect(42, -6, 18, 8);   // tape
  c.restore();
};

// the AI's close-up (its own drawing: the phone big on its stool under a spotlight)
const phoneClose = (c: Ctx, W: number, f: number, r: () => number, mood: "smile" | "sad" | "idk", talk: boolean) => {
  const g = c.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, "#0b0a2e"); g.addColorStop(1, "#3b1c6e");
  c.fillStyle = g; c.fillRect(0, 0, W, 1920);
  const cg = c.createLinearGradient(0, 0, 0, 1500); cg.addColorStop(0, "rgba(255,255,255,0.3)"); cg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = cg; c.beginPath(); c.moveTo(W / 2 - 40, 0); c.lineTo(W / 2 + 40, 0); c.lineTo(W / 2 + 420, 1500); c.lineTo(W / 2 - 420, 1500); c.closePath(); c.fill();
  c.fillStyle = "#b45309"; rrect(c, W / 2 - 300, 1250, 600, 70, 24); c.fill();   // the stool's seat
  stroke(c, [[W / 2 - 220, 1320], [W / 2 - 260, 1700]], "#92400e", 30, r, { passes: 2 }); stroke(c, [[W / 2 + 220, 1320], [W / 2 + 260, 1700]], "#92400e", 30, r, { passes: 2 });
  stroke(c, [[W / 2, 1190], [W / 2, 1250]], "#334155", 26, r, { passes: 1 });
  const bob = talk ? Math.sin(f * 0.9) * 5 : 0;
  c.save(); c.translate(W / 2, 840 + bob);
  c.fillStyle = "#0f172a"; rrect(c, -200, -350, 400, 700, 50); c.fill();
  c.fillStyle = mood === "sad" ? "#1e293b" : mood === "idk" ? "#0f3d2a" : "#1e3a8a"; rrect(c, -176, -320, 352, 640, 34); c.fill();
  if (mood === "idk") {
    c.beginPath(); c.arc(0, -120, 70, 0, 7); c.fillStyle = GREEN; c.fill();
    stroke(c, [[-32, -120], [-6, -90], [38, -152]], "#fff", 16, r, { passes: 2 });
    c.fillStyle = "#f8fafc"; c.font = SANS(70, 900); c.textAlign = "center"; c.fillText("I don't", 0, 60); c.fillText("know.", 0, 140);
  } else {
    c.fillStyle = "#e0f2fe";
    [-80, 80].forEach((ex) => { c.beginPath(); if (mood === "sad") c.ellipse(ex, -110, 30, 14, 0, 0, 7); else c.arc(ex, -120, 28, 0, 7); c.fill(); });
    if (talk) { c.beginPath(); c.ellipse(0, 120, 56, 26 + Math.abs(Math.sin(f * 0.8)) * 22, 0, 0, 7); c.fill(); }
    else if (mood === "sad") stroke(c, circlePts(0, 160, 56, 26, Math.PI + 0.3, Math.PI * 2 - 0.3, 12), "#e0f2fe", 12, r, { passes: 1 });
    else stroke(c, circlePts(0, 90, 62, 30, 0.25, Math.PI - 0.25, 12), "#e0f2fe", 12, r, { passes: 1 });
    [-82, 82].forEach((ex) => stroke(c, circlePts(ex, -118, 66, 54), "#fef3c7", 12, r, { passes: 1, alpha: 0.9 }));   // paper glasses
    stroke(c, [[-16, -120], [16, -120]], "#fef3c7", 10, r, { passes: 1 });
  }
  if (mood !== "idk") {   // the cardboard moustache (it slips when it's caught)
    c.save(); c.translate(mood === "sad" ? 18 : 0, mood === "sad" ? 44 : 20); c.rotate(mood === "sad" ? 0.3 : 0); c.scale(2.8, 2.8);
    c.fillStyle = "#3f2a1d"; c.beginPath(); c.moveTo(0, -4);
    c.quadraticCurveTo(-30, -16, -52, 4); c.quadraticCurveTo(-30, 2, 0, 8); c.quadraticCurveTo(30, 2, 52, 4); c.quadraticCurveTo(30, -16, 0, -4); c.fill();
    c.restore();
    c.fillStyle = "rgba(255,255,255,0.75)"; c.fillRect(-190, 10, 54, 22); c.fillRect(136, 10, 54, 22);   // tape
  }
  c.restore();
  if (mood === "idk") {   // the moustache, fallen on the stool
    c.save(); c.translate(W / 2 + 170, 1262); c.rotate(0.15); c.scale(2.2, 2.2);
    c.fillStyle = "#3f2a1d"; c.beginPath(); c.moveTo(0, -4);
    c.quadraticCurveTo(-30, -16, -52, 4); c.quadraticCurveTo(-30, 2, 0, 8); c.quadraticCurveTo(30, 2, 52, 4); c.quadraticCurveTo(30, -16, 0, -4); c.fill();
    c.restore();
  }
};
// the clock in the corner of the close shots (the LED board is out of frame there)
const hudClock = (c: Ctx, W: number, secs: number, alarm: boolean) => {
  c.save(); c.translate(W - 130, 270);
  c.fillStyle = "rgba(5,4,15,0.85)"; rrect(c, -100, -50, 200, 96, 18); c.fill();
  c.strokeStyle = "#7c3aed"; c.lineWidth = 5; rrect(c, -100, -50, 200, 96, 18); c.stroke();
  const red = alarm || secs <= 5;
  c.font = SANS(alarm ? 34 : 56, 900); c.textAlign = "center"; c.fillStyle = red ? "#f87171" : "#fecaca"; c.shadowColor = "#ef4444"; c.shadowBlur = red ? 18 : 6;
  c.fillText(alarm ? "TIME'S UP" : `0:${String(Math.max(0, Math.ceil(secs))).padStart(2, "0")}`, 0, alarm ? 12 : 20);
  c.shadowBlur = 0; c.restore();
};

// ---------- cards (screen space) ----------
const sayBubble = (c: Ctx, W: number, t: [string, string?], k: number, gold = false, y = 470) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, y); c.scale(0.8 + 0.2 * easeOut(k), 0.8 + 0.2 * easeOut(k));
  const size = gold ? 84 : 70;
  c.font = caveat(size);
  const w = Math.max(...t.filter(Boolean).map((s) => c.measureText(s as string).width)) + 90, h = size * (t[1] ? 2.4 : 1.5);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -w / 2 + 8, -h / 2 + 10, w, h, 40); c.fill();
  c.fillStyle = gold ? GOLD : "#fff"; rrect(c, -w / 2, -h / 2, w, h, 40); c.fill();
  c.beginPath(); c.moveTo(-26, h / 2 - 4); c.lineTo(-6, h / 2 + 46); c.lineTo(26, h / 2 - 4); c.closePath(); c.fill();
  c.fillStyle = INK; c.textAlign = "center";
  if (t[1]) { c.fillText(t[0], 0, -size * 0.25); c.fillText(t[1], 0, size * 0.85); } else c.fillText(t[0], 0, size * 0.32);
  c.restore();
};
const questionCard = (c: Ctx, W: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, 1230); c.rotate(-0.02); c.scale(0.9 + 0.1 * easeOut(k), 0.9 + 0.1 * easeOut(k));
  c.fillStyle = "#1d4ed8"; rrect(c, -470, -150, 940, 300, 30); c.fill();
  c.strokeStyle = GOLD; c.lineWidth = 8; rrect(c, -470, -150, 940, 300, 30); c.stroke();
  c.font = SANS(40, 800); c.fillStyle = GOLD; c.textAlign = "center"; c.fillText("QUESTION", 0, -88);
  c.font = SANS(54, 800); c.fillStyle = "#fff"; c.fillText("When does RAMULU TIFFINS", 0, -10); c.fillText("(Ameerpet) open on Sunday?", 0, 64);
  c.restore();
};
const nameTag = (c: Ctx, x: number, y: number, t: string, k: number, gold = false) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.scale(easeOut(k), easeOut(k));
  c.font = SANS(gold ? 46 : 34, 900); const w = c.measureText(t).width + 40;
  c.fillStyle = gold ? GOLD : "#f8fafc"; rrect(c, -w / 2, -34, w, 52, 14); c.fill();
  c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, 0, 6); c.restore();
};
const statCard = (c: Ctx, W: number, k: number, k1: number, k2: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(5,4,15,0.55)"; c.fillRect(0, 0, W, 1920);
  c.translate(W / 2, 860); c.scale(0.92 + 0.08 * easeOut(k), 0.92 + 0.08 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -480, -380, 960, 700, 32); c.fill();
  c.font = SANS(56, 900); c.fillStyle = "#7c3aed"; c.textAlign = "center"; c.fillText("OUR TEST", 0, -296);
  c.font = SANS(34, 700); c.fillStyle = "#475569"; c.fillText("a free AI model, offline · asked 10 times", 0, -244);
  c.fillText("\"When does Ramulu Tiffins open on Sunday?\"", 0, -200);
  const rows: [string, string, number][] = [["Said \"never heard of it\"", "0/10", k1], ["Named an opening time", "8/10", k2]];
  rows.forEach(([lab, val, kk], q) => {
    if (kk <= 0) return;
    const y = -90 + q * 170;
    c.save(); c.globalAlpha = clamp(kk * 2);
    c.fillStyle = "#fee2e2"; rrect(c, -440, y - 62, 880, 136, 22); c.fill();
    c.font = SANS(44, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(lab, -410, y + 18);
    c.font = SANS(88, 900); c.fillStyle = RED; c.textAlign = "right"; c.fillText(val, 410, y + 32);
    c.restore();
  });
  if (k2 > 0) { c.font = SANS(32, 700); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("Ramulu Tiffins doesn't exist. We made it up.", 0, 270); }
  c.restore();
};
const ruleCard = (c: Ctx, W: number, k: number, k2: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(5,4,15,0.55)"; c.fillRect(0, 0, W, 1920);
  c.translate(W / 2, 820); c.scale(0.92 + 0.08 * easeOut(k), 0.92 + 0.08 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -480, -330, 960, 640, 32); c.fill();
  c.font = SANS(46, 900); c.fillStyle = GREEN; c.textAlign = "center"; c.fillText("ADD THIS TO YOUR QUESTION", 0, -250);
  c.fillStyle = "#f1f5f9"; rrect(c, -430, -190, 860, 230, 26); c.fill();
  c.strokeStyle = "#94a3b8"; c.lineWidth = 4; rrect(c, -430, -190, 860, 230, 26); c.stroke();
  c.font = caveat(70); c.fillStyle = INK; c.fillText("\"If you're not sure,", 0, -104); c.fillText("say I don't know.\"", 0, -20);
  if (k2 > 0) {
    c.save(); c.globalAlpha = clamp(k2 * 2);
    c.fillStyle = "#dcfce7"; rrect(c, -430, 90, 860, 150, 22); c.fill();
    c.font = SANS(44, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Then it said \"I don't know\"", -400, 180);
    c.font = SANS(80, 900); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("10/10", 410, 196);
    c.restore();
  }
  c.restore();
};

// ---------- the scene ----------
const POSE_HOST: Record<string, [Mood, Arms]> = {
  hook: ["happy", "aim"], question: ["calm", "card"], source: ["smug", "card"], timeup: ["shock", "up"], reveal: ["laugh", "up"],
  madeup: ["smug", "rest"], trap: ["stern", "rest"], rule: ["happy", "point"], honest: ["laugh", "rest"],
};
const StQuiz: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const abs0 = s.from ?? 0;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cu = (ln: Line, k: number, frac: number) => ln.cues?.[String(k)] ?? ln.from + Math.round(ln.frames * frac);
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`;
    if (b.prop === "hook") { sfx.push(<Sfx key={k("h")} at={1} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("d")} at={2} src="audio/gag_ding.wav" vol={0.35} />); }
    if (["ansA", "ansB", "ansC", "book"].includes(b.prop)) sfx.push(<Sfx key={k("p")} at={at - 3} src="audio/sfx_pop.wav" vol={0.32} />);
    if (b.prop === "ansC") sfx.push(<Sfx key={k("g")} at={at + Math.round(l.frames * 0.35)} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "nobook") sfx.push(<Sfx key={k("b")} at={at + 2} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "timeup") sfx.push(<Sfx key={k("b")} at={at + 2} src="reel/sfx_buzz.wav" vol={0.5} />, <Sfx key={k("r")} at={at + l.frames - 26} src="reel/sfx_riser.wav" vol={0.55} />);
    if (b.prop === "reveal") sfx.push(<Sfx key={k("h")} at={at - 2} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("s")} at={at - 2} src="audio/sfx_snap.wav" vol={0.6} />);
    if (b.prop === "madeup") sfx.push(<Sfx key={k("s")} at={cu(l, 1, 0.55) - 2} src="audio/sfx_snap.wav" vol={0.55} />);
    if (b.prop === "sure") sfx.push(<Sfx key={k("g")} at={at} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "trap") [0.45, 0.62].forEach((fr, q) => sfx.push(<Sfx key={k("p" + q)} at={cu(l, q + 1, fr)} src="audio/sfx_pop.wav" vol={0.34} />));
    if (b.prop === "trap" || b.prop === "rule") sfx.push(<Sfx key={k("w")} at={at - 4} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("s")} at={cu(l, 1, 0.55)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "idk") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.45} />);
  });
  // the countdown's ticks: once a second until "Time's up" (scenes before the reveal)
  const upAt = beats.findIndex((b) => b.prop === "timeup");
  const preReveal = !beats.some((b) => ["reveal", "madeup", "sure", "trap", "rule", "idk", "honest"].includes(b.prop));
  if (preReveal) {
    const end = upAt >= 0 ? ls[upAt].from : s.frames;
    for (let t = 30 - ((abs0 % 30) || 30); t < end; t += 30) if (t > 2) sfx.push(<Sfx key={`tk${t}`} at={t} src="audio/sfx_tick.wav" vol={0.13} />);
  }
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9100 + boil);
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to);
        const mouth = talking && Math.floor(f / 3) % 2 === 0;
        const revealed = !preReveal;
        const revealBeat = beats.findIndex((x) => x.prop === "reveal");
        const drop = revealed ? (revealBeat >= 0 ? seg(f, ls[revealBeat].from - 2, ls[revealBeat].from + 8) : 1) : 0;   // the screens fall
        const secs = 30 - (abs0 + f) / 30;
        const sh = SHOTS[b.shot] ?? SHOTS.wide;
        const z = sh.z * (1 + 0.025 * p);
        const wideShot = ["wide", "reveal", "card"].includes(b.shot);
        const alarm = upAt >= 0 && i >= upAt;
        const speak = (w: string) => b.who === w && talking;
        const cMood = b.prop === "idk" ? "idk" : ["sure", "madeup", "trap"].includes(b.prop) ? "sad" : "smile";
        if (b.shot === "phone") phoneClose(c, W, f, r, cMood, speak("c"));
        else {
          c.save(); c.translate(W / 2, 840); c.scale(z, z); c.translate(-sh.x, -sh.y);
          studio(c, r, f);
          if (wideShot) board(c, f, revealed ? null : secs, revealed ? "C = THE AI" : "WHO'S THE AI?", alarm);
          // contestants (behind their screens until the reveal)
          const am: Mood = b.prop === "honest" ? "laugh" : b.prop === "nobook" ? "stern" : revealed ? "shock" : "calm";
          person(c, "a", [PX.a, NECK], am, b.prop === "nobook" ? "wag" : "rest", speak("a") && mouth, f, r);
          person(c, "b", [PX.b, NECK], revealed ? (b.prop === "honest" ? "happy" : "shock") : "calm", b.prop === "ansB" ? "shrug" : "rest", speak("b") && mouth, f, r);
          aiPhone(c, PX.c, f, speak("c"), cMood, revealed ? seg(f, (revealBeat >= 0 ? ls[revealBeat].from : 0) + 10, (revealBeat >= 0 ? ls[revealBeat].from : 0) + 30) : 0, r);
          (["a", "b", "c"] as const).forEach((w) => {
            screenPanel(c, PX[w], w, 1 - drop, b.who === w && !revealed, speak(w) ? Math.sin(f * 0.9) * 3 : 0, r);
            podium(c, PX[w], w.toUpperCase(), b.who === w, r);
          });
          const [hm, ha] = POSE_HOST[b.prop] ?? ["calm", "rest"];
          person(c, "host", HOST, hm, ha, b.who === "host" && mouth, f, r);
          if (revealed) {   // who was behind each screen, on the podiums
            const t0 = revealBeat >= 0 ? ls[revealBeat].from : -99;
            nameTag(c, PX.a, POD.top + 222, "AMMAMMA", seg(f, t0 + 6, t0 + 14));
            nameTag(c, PX.b, POD.top + 222, "VAMSI", seg(f, t0 + 9, t0 + 17));
            nameTag(c, PX.c, POD.top + 222, "THE AI!", seg(f, t0 + 12, t0 + 20), true);
          }
          c.restore();
          if (!wideShot && !revealed) hudClock(c, W, secs, alarm);
        }
        // ---------- screen-space text ----------
        if (b.prop === "question") questionCard(c, W, seg(p, 0.05, 0.18));
        if (SAY[b.prop]) sayBubble(c, W, SAY[b.prop], seg(p, 0.04, 0.16), b.prop === "ansC");
        if (b.prop === "madeup") stamp(c, "RAMULU TIFFINS: MADE UP", W / 2, 1290, 74, RED, seg(f, cu(ln, 1, 0.55) - 2, cu(ln, 1, 0.55) + 8), r, -0.06);
        if (b.prop === "trap") statCard(c, W, seg(p, 0.0, 0.08), seg(f, cu(ln, 1, 0.45) - 2, cu(ln, 1, 0.45) + 6), seg(f, cu(ln, 2, 0.62) - 2, cu(ln, 2, 0.62) + 6));
        if (b.prop === "rule") ruleCard(c, W, seg(p, 0.0, 0.08), seg(f, cu(ln, 1, 0.55) - 2, cu(ln, 1, 0.55) + 6));
        void H;
      }} />
    </>
  );
};

export const QUIZ_SCENES = { sk_quiz: StQuiz };
