import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";

// Skit 05 "The client list" (series/scripts/skit05_client_list.md): an open-plan office in Hyderabad. Lakshmi (team lead)
// stops Arjun (new joiner) pasting the client list into a free chatbot; two myth/fact cards; the fix (swap the details);
// the rule (paste only what you'd pin on the notice board); Arjun stops Sneha the same way (loops). The chatbot is only
// text on the laptops, no brand. One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "yell" | "shock" | "confused" | "happy" | "sad" | "smug" | "calm" | "panic" | "grin" | "stern";
type Arms = "rest" | "point" | "shrug" | "up" | "type" | "slam" | "chest" | "board";
type Who = "lakshmi" | "arjun" | "sneha";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a";
const DESK = 1010;
const ARJUN: Pt = [400, 870], LAKSHMI: Pt = [790, 700];   // necks (Arjun seated, Lakshmi standing)
const SNEHA: Pt = [470, 880], ARJUN_UP: Pt = [840, 700];  // the loop: Sneha seated, Arjun standing over her laptop
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 820 }, arjun: { z: 1.45, x: 430, y: 600 }, lakshmi: { z: 1.4, x: 760, y: 440 }, sneha: { z: 1.05, x: 620, y: 790 },
};
const POSE: Record<string, Record<number, [Mood, Arms]>> = {
  lakshmi: { 2: ["stern", "rest"], 3: ["shock", "point"], 4: ["stern", "rest"], 5: ["calm", "point"], 6: ["stern", "rest"], 7: ["stern", "point"], 8: ["calm", "rest"], 10: ["smug", "board"] },
  arjun: { 2: ["confused", "shrug"], 3: ["confused", "rest"], 4: ["smug", "chest"], 5: ["shock", "rest"], 6: ["confused", "shrug"], 7: ["shock", "rest"], 8: ["panic", "up"], 10: ["happy", "type"], 11: ["yell", "slam"] },
  sneha: { 11: ["shock", "type"] },
};

// ---------- the office ----------
const office = (c: Ctx, r: () => number, f: number) => {
  c.fillStyle = "#e7eef6"; c.fillRect(-400, -200, 1900, 1300);
  c.fillStyle = "#f8fafc"; [[180, 70], [700, 70]].forEach(([x, y]) => { rrect(c, x, y, 300, 34, 10); c.fill(); });   // ceiling lights
  // the window: late afternoon over the city
  const g = c.createLinearGradient(0, 180, 0, 660); g.addColorStop(0, "#93c5fd"); g.addColorStop(1, "#fde68a");
  c.fillStyle = g; c.fillRect(620, 180, 440, 480);
  const rr = rng(77);
  for (let k = 0; k < 7; k++) {   // towers with lit windows
    const x = 630 + k * 62, h = 140 + rr() * 220, y = 660 - h;
    c.fillStyle = ["#64748b", "#475569", "#94a3b8"][k % 3]; c.fillRect(x, y, 52, h);
    c.fillStyle = "rgba(254,240,138,0.85)";
    for (let wy = y + 14; wy < 650; wy += 26) for (let wx = x + 8; wx < x + 46; wx += 16) if (rr() > 0.45) c.fillRect(wx, wy, 8, 10);
  }
  stroke(c, [[620, 180], [1060, 180], [1060, 660], [620, 660], [620, 180]], "#94a3b8", 14, r, { passes: 2 });
  stroke(c, [[840, 180], [840, 660]], "#94a3b8", 10, r, { passes: 1 });
  noticeBoard(c, r);
  // a plant in the corner
  c.fillStyle = "#b45309"; rrect(c, 470, 820, 90, 100, 14); c.fill();
  [[-40, -90], [0, -130], [40, -96], [-70, -40], [70, -50]].forEach(([dx, dy], k) => {
    c.save(); c.translate(515, 830); c.rotate(dx * 0.008 + Math.sin(f / 40 + k) * 0.02);
    c.fillStyle = k % 2 ? "#15803d" : "#22c55e"; c.beginPath(); c.ellipse(dx * 0.5, dy * 0.6, 22, 60, dx * 0.01, 0, 7); c.fill(); c.restore();
  });
};
const noticeBoard = (c: Ctx, r: () => number) => {
  c.fillStyle = "#c08a5a"; rrect(c, 40, 200, 420, 360, 14); c.fill();
  stroke(c, [[40, 200], [460, 200], [460, 560], [40, 560], [40, 200]], "#7c4a2b", 10, r, { passes: 2 });
  const notes: [number, number, number, number, string, string, number][] = [
    [64, 222, 190, 120, "#fff", "TEAM LUNCH\nFRIDAY 1 PM", -0.04], [272, 230, 168, 130, "#fde047", "Happy\nbirthday\nRamesh!", 0.05],
    [76, 370, 170, 150, "#fbcfe8", "Fire drill\nThursday\n4 pm", 0.03], [268, 384, 172, 140, "#bbf7d0", "Parking:\nB2 only", -0.05],
  ];
  notes.forEach(([x, y, w, h, col, t, rot]) => {
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot);
    c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h);
    c.font = SANS(24); c.fillStyle = INK; c.textAlign = "center";
    t.split("\n").forEach((s, k, a) => c.fillText(s, 0, -((a.length - 1) * 28) / 2 + k * 28 + 8));
    c.beginPath(); c.arc(0, -h / 2 + 10, 7, 0, 7); c.fillStyle = COL.red; c.fill(); c.restore();
  });
};
// a laptop seen from the front of the desk (we see the back of its lid); `shut` 0 = open, 1 = slammed shut
const laptopBack = (c: Ctx, x: number, r: () => number, shut = 0) => {
  const h = 150 * (1 - 0.88 * easeOut(shut));
  c.fillStyle = "#475569"; c.beginPath(); c.moveTo(x - 150, DESK); c.lineTo(x + 150, DESK); c.lineTo(x + 140, DESK - h); c.lineTo(x - 140, DESK - h); c.closePath(); c.fill();
  stroke(c, [[x - 150, DESK], [x - 140, DESK - h], [x + 140, DESK - h], [x + 150, DESK]], INK, 5, r, { passes: 2, alpha: 0.6 });
  c.fillStyle = "#94a3b8"; c.fillRect(x - 170, DESK - 6, 340, 12);
};
const desk = (c: Ctx, r: () => number) => {
  c.fillStyle = "#d6b98c"; c.fillRect(-300, DESK, 1700, 40);
  c.fillStyle = "#b08d5b"; c.fillRect(-300, DESK + 40, 1700, 600);
  stroke(c, [[-300, DESK], [1400, DESK]], INK, 6, r, { passes: 2, alpha: 0.6 });
  c.fillStyle = "#fff"; c.save(); c.translate(160, DESK + 6); c.rotate(-0.05); c.fillRect(-60, -40, 120, 34); c.restore();   // a coffee mug's coaster
  c.fillStyle = "#f8fafc"; rrect(c, 120, DESK - 70, 64, 70, 10); c.fill(); stroke(c, circlePts(196, DESK - 38, 16, 18, -1.4, 1.4, 8), "#f8fafc", 8, r, { passes: 1 });
};

// ---------- people ----------
const LOOK: Record<Who, { skin: string; hair: string; shirt: string; s: number }> = {
  lakshmi: { skin: "#a86d47", hair: "#1c1410", shirt: "#0f766e", s: 1.0 },
  arjun: { skin: "#8d5a3b", hair: "#1c1410", shirt: "#93c5fd", s: 0.94 },
  sneha: { skin: "#b97a52", hair: "#1c1410", shirt: "#f59e0b", s: 0.9 },
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
  const L = LOOK[who], hy = -130, girl = who !== "arjun";
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  if (who === "sneha") {   // a ponytail behind
    c.fillStyle = L.hair; c.beginPath(); c.ellipse(80, hy + 40, 40, 110, 0.35, 0, 7); c.fill();
  }
  if (who === "lakshmi") { c.fillStyle = L.hair; c.beginPath(); c.arc(0, hy - 110, 46, 0, 7); c.fill(); }   // her bun
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "arjun") { c.ellipse(0, hy - 64, 98, 58, 0, Math.PI, 0); c.lineTo(96, hy - 40); c.lineTo(60, hy - 58); c.lineTo(10, hy - 46); c.lineTo(-60, hy - 58); c.lineTo(-96, hy - 40); }
  else { c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(40, hy - 70, 0, hy - 76); c.quadraticCurveTo(-40, hy - 70, -98, hy - 10); }
  c.closePath(); c.fill();
  if (girl) { c.beginPath(); c.arc(0, hy - 46, 7, 0, 7); c.fillStyle = "#dc2626"; c.fill(); }   // bindi
  [-1, 1].forEach((sx) => {   // brows
    let yi = -164, yo = -164;
    if (m === "yell" || m === "panic" || m === "stern") { yi = -152; yo = -170; }
    if (m === "shock" || m === "confused") { yi = -182; yo = -180; }
    if (m === "sad") { yi = -180; yo = -160; }
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {   // eyes
    const ey = hy - 4;
    if (m === "shock" || m === "panic" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "grin") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 3, ey + 4, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
    if (girl) stroke(c, [[ex - 16, ey - 10], [ex - 24, ey - 16]], INK, 3, r, { passes: 1 });
  });
  if (who === "lakshmi") {   // her glasses
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 26), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  const my = hy + 80, open = talk || m === "yell" || m === "panic" || m === "shock";
  if (open) {
    const w = m === "yell" || m === "panic" ? 32 : talk ? 21 : 15, h = m === "yell" || m === "panic" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "grin" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "grin" ? 32 : 24, m === "grin" ? 18 : 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "sad") stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (m === "panic") { c.beginPath(); c.moveTo(88, hy - 66); c.quadraticCurveTo(108, hy - 36, 88, hy - 26); c.quadraticCurveTo(72, hy - 36, 88, hy - 66); c.fillStyle = "#7dd3fc"; c.fill(); }
};
const person = (c: Ctx, who: Who, at: Pt, m: Mood, a: Arms, talk: boolean, f: number, r: () => number, enter = 1) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0] + (1 - easeOut(enter)) * 520, at[1]); c.scale(L.s, L.s);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.lineTo(178, 560); c.lineTo(-178, 560); c.closePath();
  c.fillStyle = L.shirt; c.fill(); c.clip();
  if (who === "lakshmi") { c.fillStyle = "#fbbf24"; c.beginPath(); c.moveTo(60, 30); c.lineTo(150, 30); c.lineTo(80, 560); c.lineTo(-20, 560); c.closePath(); c.fill(); }   // dupatta
  if (who === "arjun") { c.fillStyle = "#60a5fa"; c.fillRect(-4, 40, 8, 520); }   // the shirt's placket
  c.restore();
  stroke(c, [[-140, 34], [-178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [178, 560]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  if (who === "arjun") { c.fillStyle = "#dbeafe"; c.beginPath(); c.moveTo(-50, 14); c.lineTo(0, 70); c.lineTo(50, 14); c.lineTo(28, 4); c.lineTo(0, 40); c.lineTo(-28, 4); c.closePath(); c.fill(); }
  // the office ID on a lanyard
  stroke(c, [[-40, 20], [-12, 210]], who === "lakshmi" ? "#1d4ed8" : "#dc2626", 8, r, { passes: 1 }); stroke(c, [[40, 20], [12, 210]], who === "lakshmi" ? "#1d4ed8" : "#dc2626", 8, r, { passes: 1 });
  c.fillStyle = "#fff"; rrect(c, -36, 206, 72, 92, 8); c.fill(); c.fillStyle = "#cbd5e1"; c.fillRect(-24, 218, 48, 40);
  c.font = SANS(16); c.fillStyle = INK; c.textAlign = "center"; c.fillText(who === "lakshmi" ? "LEAD" : "NEW", 0, 284);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-140, 340]], rr: Pt[] = [[178, 230], [140, 340]], rp = false;
  if (a === "point") { rr = [[220, 30], [320, -110]]; rp = true; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  else if (a === "up") { l = [[-220, -20], [-190, -170]]; rr = [[220, -20], [190, -170]]; }
  else if (a === "type") { l = [[-150, 210], [-60, 170]]; rr = [[150, 210], [60, 170]]; }
  else if (a === "slam") { rr = [[-60, 200], [-260, 330]]; }
  else if (a === "chest") { rr = [[150, 200], [30, 110]]; }
  else if (a === "board") { l = [[-230, 20], [-360, -120]]; }
  limb(c, [S, l[0], l[1]], L.shirt, r); palm(c, l[1][0], l[1][1], L.skin, r, a === "board");
  limb(c, [R, rr[0], rr[1]], L.shirt, r); palm(c, rr[1][0], rr[1][1], L.skin, r, rp);
  face(c, who, m, talk, r);
  c.restore();
  void f;
};

// ---------- the laptop, full frame: the chat box ----------
const ROWS: [string, string][] = [["Ramesh Kumar", "98480 2xx41"], ["Anitha Reddy", "99490 7xx18"], ["Suresh Babu", "90000 4xx62"], ["Kavya Rao", "87120 6xx05"]];
const FAKE: [string, string][] = [["client a", "90000 00001"], ["CLIENT b", "9000000002"], ["Client  c", "90 000 00003"]];
const SALARY: [string, string][] = [["Ramesh Kumar", "₹ 6x,xxx"], ["Anitha Reddy", "₹ 8x,xxx"], ["Suresh Babu", "₹ 5x,xxx"], ["Kavya Rao", "₹ 7x,xxx"]];
const laptopScreen = (c: Ctx, W: number, f: number, r: () => number, mode: "paste" | "fake" | "salary", k: number, reply: number) => {
  c.fillStyle = "#0b1220"; rrect(c, 70, 190, W - 140, 1010, 40); c.fill();                       // the lid
  c.fillStyle = "#f8fafc"; rrect(c, 98, 218, W - 196, 954, 22); c.fill();                        // the screen
  c.fillStyle = "#334155"; c.beginPath(); c.moveTo(40, 1210); c.lineTo(W - 40, 1210); c.lineTo(W + 10, 1330); c.lineTo(-10, 1330); c.closePath(); c.fill();   // the base
  c.fillStyle = "#7c3aed"; rrect(c, 126, 246, 70, 70, 18); c.fill();
  c.font = SANS(40); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 214, 280);
  c.font = SANS(26, 600); c.fillStyle = "#64748b"; c.fillText("free plan", 214, 312);
  stroke(c, [[116, 336], [W - 116, 336]], "#cbd5e1", 3, r, { passes: 1 });
  // my message: the prompt, the file chip and the pasted rows
  if (mode === "paste" || mode === "salary") {
    const sal = mode === "salary";
    c.fillStyle = "#dcfce7"; rrect(c, 230, 370, W - 360, 470, 26); c.fill();
    c.font = SANS(36, 600); c.fillStyle = INK; c.fillText(sal ? "summarise this sheet" : "make this list neat", 262, 420);
    c.fillStyle = "#fff"; rrect(c, 262, 444, 470, 60, 14); c.fill();
    c.font = SANS(28); c.fillStyle = GREEN; c.fillText(sal ? "SALARY_SHEET.xlsx · 48 rows" : "CLIENTS_FINAL.xlsx · 200 rows", 282, 484);
    (sal ? SALARY : ROWS).forEach(([name, num], q) => { c.font = SANS(32, 600); c.fillStyle = INK; c.fillText(name, 262, 560 + q * 62); c.fillText(num, 620, 560 + q * 62); });
    c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.fillText(sal ? "+ 44 more rows" : "+ 196 more rows", 262, 810);
  } else {   // three made-up rows, typed in, and the question
    c.fillStyle = "#dcfce7"; rrect(c, 230, 370, W - 360, 400, 26); c.fill();
    c.font = SANS(32, 600); c.fillStyle = INK; c.fillText("3 made-up rows, messy like mine:", 262, 418);
    FAKE.forEach(([name, num], q) => { const kk = seg(k, q * 0.2, q * 0.2 + 0.3); c.globalAlpha = kk; c.font = `600 32px "Courier New", monospace`; c.fillText(name, 262, 480 + q * 56); c.fillText(num, 560, 480 + q * 56); c.globalAlpha = 1; });
    c.globalAlpha = seg(k, 0.6, 0.9); c.font = SANS(32, 600); c.fillText("Excel formula to make them neat?", 262, 690); c.globalAlpha = 1;
    tag(c, "fake data", W - 230, 400, 34, "#fef3c7", INK, 0.05, seg(k, 0, 0.2));
  }
  if (reply > 0) {   // the AI's answer: a formula, run on the real list in Excel, on his own laptop
    c.save(); c.globalAlpha = reply;
    c.fillStyle = "#fff"; rrect(c, 130, 800, W - 330, 250, 26); c.fill(); stroke(c, [[130, 800], [W - 200, 800], [W - 200, 1050], [130, 1050], [130, 800]], "#cbd5e1", 3, r, { passes: 1 });
    c.font = SANS(36); c.fillStyle = INK; c.fillText("Names:  =PROPER(TRIM(A2))", 160, 860);
    c.fillText("Numbers:  =SUBSTITUTE(B2,\" \",\"\")", 160, 924);
    c.font = SANS(34, 600); c.fillText("Then sort A to Z.", 160, 986);
    c.restore();
  }
  // the input box and the SEND button
  c.fillStyle = "#e2e8f0"; rrect(c, 116, 1084, W - 380, 70, 20); c.fill();
  c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.fillText("Message AI chat...", 140, 1130);
  c.fillStyle = mode === "fake" ? GREEN : COL.red; rrect(c, W - 250, 1084, 140, 70, 20); c.fill();
  c.font = SANS(32); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SEND", W - 180, 1131);
  void f;
};
// the stakes, big and bold in the top third (frame 1 and the loop)
const stakes = (c: Ctx, W: number, a: string, b: string) => {
  c.save(); c.translate(W / 2, 300); c.rotate(-0.015);
  c.fillStyle = COL.red; rrect(c, -470, -100, 940, 200, 26); c.fill();
  c.font = SANS(64); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(a, 0, -14); c.fillText(b, 0, 66);
  c.restore();
};
// a hand slams the laptop shut: t0 = the frame it starts; the lid folds down to its hinge, impact lines, STOP!
const slamShot = (c: Ctx, W: number, f: number, t0: number, r: () => number, mode: "paste" | "salary", sleeve: string, skin: string, a: string, b: string) => {
  const slam = seg(f, t0, t0 + 5), shake = slam > 0 && slam < 1 ? 14 : f < t0 + 12 && slam >= 1 ? 8 : 0;
  c.save(); c.translate((r() - 0.5) * shake, (r() - 0.5) * shake);
  const fold = 1 - 0.86 * easeOut(slam);
  c.save(); c.translate(0, 1210); c.scale(1, fold); c.translate(0, -1210);
  laptopScreen(c, W, f, r, mode, 0, 0);
  if (slam < 0.3) cursor(c, W - 200, 1104);
  c.restore();
  if (slam >= 1) { c.fillStyle = "#0b1220"; rrect(c, 70, 1210 - 1010 * fold, W - 140, 1010 * fold, 20); c.fill(); }   // shut: only the lid's back shows
  const top = 1210 - 1010 * fold, hx = 640, hy = 160 + (top - 60 - 160) * easeOut(slam);
  limb(c, [[1250, -120], [1000, hy - 220], [hx, hy]], sleeve, r, 96);
  c.fillStyle = "#facc15"; c.beginPath(); c.ellipse(hx + 40, hy - 44, 26, 18, -0.6, 0, 7); c.fill();   // a bangle
  c.beginPath(); c.ellipse(hx, hy + 10, 70, 46, 0, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(hx, hy + 10, 70, 46), INK, 5, r, { passes: 2, alpha: 0.6 });
  if (slam >= 1 && f < t0 + 16) {   // impact lines
    const k = 1 - seg(f, t0 + 5, t0 + 16);
    [[-1, -0.3], [-1, 0.3], [1, -0.3], [1, 0.3], [0, -1]].forEach(([dx, dy]) => stroke(c, [[hx + dx * 110, hy + dy * 70], [hx + dx * 190, hy + dy * 130]], INK, 10, r, { passes: 1, alpha: k }));
  }
  c.restore();
  stakes(c, W, a, b);
  if (f >= t0 + 4) stamp(c, "STOP!", 540, 780, 180, COL.red, seg(f, t0 + 4, t0 + 10), r, -0.06);
};
// the cursor arrow over SEND
const cursor = (c: Ctx, x: number, y: number) => {
  c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 64); c.lineTo(x + 16, y + 50); c.lineTo(x + 30, y + 80); c.lineTo(x + 42, y + 74); c.lineTo(x + 28, y + 46); c.lineTo(x + 48, y + 46); c.closePath(); c.fill(); c.stroke();
};

// ---------- the myth/fact card (screen space, above the faces) ----------
// k: in; flip 0 = MYTH side, 1 = FACT side (turns over through edge-on at 0.5)
const mythCard = (c: Ctx, W: number, y: number, myth: string, fact: string[], src: string, k: number, flip: number, big?: string, note?: string) => {
  if (k <= 0) return;
  const side = flip < 0.5 ? "myth" : "fact", sx = Math.max(0.02, Math.abs(Math.cos(flip * Math.PI)));
  c.save(); c.globalAlpha = k; c.translate(W / 2, y); c.scale(sx * (0.9 + 0.1 * k), 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -190, 940, 380, 30); c.fill();
  c.lineWidth = 6; c.strokeStyle = side === "myth" ? COL.red : GREEN; rrect(c, -470, -190, 940, 380, 30); c.stroke();
  c.fillStyle = side === "myth" ? COL.red : GREEN; rrect(c, -470, -190, 940, 92, 30); c.fill(); c.fillRect(-470, -130, 940, 32);
  c.font = SANS(60); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(side === "myth" ? "MYTH" : "FACT", 0, -122);
  if (side === "myth") {
    c.font = SANS(58); c.fillStyle = INK; c.fillText(myth, 0, 20);
    c.font = SANS(40, 600); c.fillStyle = "#64748b"; c.fillText("(what most of us think)", 0, 96);
  } else {
    if (big) { c.font = SANS(110); c.fillStyle = GREEN; c.fillText(big, 0, 10); }
    c.font = SANS(big ? 46 : 54); c.fillStyle = INK;
    fact.forEach((t, q) => c.fillText(t, 0, (big ? 74 : -14) + q * (big ? 52 : 64)));
    if (note) { c.font = SANS(32); c.fillStyle = "#166534"; c.fillText(note, 0, 128); }
    c.font = SANS(26, 600); c.fillStyle = "#64748b"; c.fillText(src, 0, 172);
  }
  c.restore();
};
// the rule, as a chip above the captions (line 10 to the end)
const rule = (c: Ctx, W: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = k; c.translate(W / 2, 1370); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#0f172a"; rrect(c, -480, -70, 960, 140, 30); c.fill();
  c.font = SANS(42); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("PASTE ONLY WHAT YOU'D PUT UP", 0, -12);
  c.fillText("ON THE NOTICE BOARD", 0, 42);
  c.restore();
};

// ---------- the scene ----------
const StOffice: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - (beats[k]?.prop === "loop" ? 14 : 2)) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.shot === "laptop" && b.prop !== "hook") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={4} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("b")} at={4} src="audio/sfx_snap.wav" vol={1.0} />, <Sfx key={k("c")} at={5} src="audio/gag_bonk.wav" vol={0.6} />);
    if (b.prop === "numbers") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.45) - 2} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "myth1" || b.prop === "myth2") sfx.push(<Sfx key={k("m")} at={at + Math.round(l.frames * 0.3)} src="audio/sfx_whoosh.wav" vol={0.32} />);
    if (b.prop === "fact1") sfx.push(<Sfx key={k("f")} at={at + 4} src="audio/gag_bonk.wav" vol={0.38} />, <Sfx key={k("e")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.32} />);
    if (b.prop === "fact2") sfx.push(<Sfx key={k("f")} at={cue(i, 1, 0.45) - 4} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("h")} at={cue(i, 1, 0.45) - 2} src="reel/sfx_boom.wav" vol={0.8} />);
    if (b.prop === "shock") sfx.push(<Sfx key={k("o")} at={at + 2} src="audio/gag_boing.wav" vol={0.3} />);
    if (b.prop === "swap") { [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("s" + q)} at={at + 6 + q * 9} src="audio/sfx_tick.wav" vol={0.3} />)); sfx.push(<Sfx key={k("v")} at={cue(i, 1, 0.55)} src="audio/sfx_success.wav" vol={0.4} />); }
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 6)} src="audio/sfx_snap.wav" vol={0.4} />);
    if (b.prop === "loop") sfx.push(<Sfx key={k("r")} at={at - 50} src="reel/sfx_riser.wav" vol={0.5} />, <Sfx key={k("a")} at={at - 9} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("b")} at={at - 9} src="audio/sfx_snap.wav" vol={1.0} />,
      <Sfx key={k("c")} at={at - 8} src="audio/gag_bonk.wav" vol={0.6} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(5500 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        if (b.shot === "laptop") {
          // ---------- Arjun's laptop, full frame ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          // frame 1: the client list pasted, the cursor on SEND, her hand slams the lid (before her voice)
          if (n === 1) slamShot(c, W, f, 1, r, "paste", LOOK.lakshmi.shirt, LOOK.lakshmi.skin, "200 CLIENT PHONE NUMBERS", "→ AN AI CHATBOT");
          // the loop: Sneha's salary sheet, Arjun's hand, the same frame
          if (n === 11) slamShot(c, W, f, ln.from - 12, r, "salary", LOOK.arjun.shirt, LOOK.arjun.skin, "SALARY SHEET, 48 ROWS", "→ AN AI CHATBOT");
          if (n === 9) {   // the fix: three fake rows and a question; the AI's formula; the real list never leaves his laptop
            const c1 = cu(1, 0.55);
            laptopScreen(c, W, f, r, "fake", seg(p, 0.02, 0.4), seg(f, c1 - 20, c1 - 10));
            if (f >= c1) tag(c, "his 200 real rows: neat in Excel, never pasted ✓", W / 2, 1370, 50, "#dcfce7", "#166534", -0.02, seg(f, c1, c1 + 8));
          }
        } else {
          // ---------- the office ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.025 * p);
          const shake = (n === 8 && p < 0.12) || (n === 11 && f < ln.from + 10) ? 8 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = "#e7eef6"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          office(c, r, f);
          const pose = (who: Who): [Mood, Arms] => POSE[who][n] ?? ["calm", "rest"];
          if (n === 11) {   // the loop: Arjun stops Sneha the same way
            const [sm, sa] = pose("sneha");
            person(c, "sneha", SNEHA, sm, sa, false, f, r);
            const [am, aa] = pose("arjun");
            person(c, "arjun", ARJUN_UP, am, aa, b.who === "arjun" && talking, f, r);
            desk(c, r);
            laptopBack(c, SNEHA[0], r, seg(f, ln.from + 2, ln.from + 7));
          } else {
            const [lm, la] = pose("lakshmi");
            person(c, "lakshmi", LAKSHMI, lm, la, b.who === "lakshmi" && talking, f, r);
            const [am, aa] = pose("arjun");
            person(c, "arjun", ARJUN, am, aa, b.who === "arjun" && talking, f, r);
            desk(c, r);
            laptopBack(c, ARJUN[0], r, n <= 8 ? 0.5 : 0);   // half shut since the slam, open again for the fix
          }
          c.restore();
          // screen-space props
          if (n === 2) tag(c, "\"make this list neat\"", W / 2, 300, 62, "#dcfce7", "#166534", -0.02, seg(p, 0.45, 0.55));
          if (n === 3) {
            const c1 = cu(1, 0.45);
            tag(c, "200 phone numbers", W / 2, 260, 66, "#fee2e2", "#991b1b", -0.02, seg(p, 0.05, 0.15));
            if (f >= c1) tag(c, "→ a free chatbot?!", W / 2, 380, 66, "#fff", INK, 0.02, seg(f, c1, c1 + 8));
          }
          // the cards: card 1 on lines 4-5, card 2 on lines 6-8
          const m1 = n === 4 ? seg(p, 0.3, 0.42) : n === 5 ? 1 : 0;
          if (m1 > 0) {
            const flip = n === 5 ? seg(p, 0, 0.12) : 0, c1 = n === 5 ? cu(1, 0.5) : 0;
            mythCard(c, W, 520, "\"Only me and the AI see it\"",
              n === 5 && f >= c1 ? ["Chats can train the AI.", "Some are read by real people."] : ["Chats can train the AI."],
              "sources: Google's Gemini privacy page · OpenAI help center", easeOut(m1), flip, undefined,
              n === 5 && f >= c1 + 20 ? "Off switch: ChatGPT \"Improve the model\" · Gemini \"Keep Activity\"" : undefined);
          }
          const m2 = n === 6 ? seg(p, 0.3, 0.42) : n === 7 || n === 8 ? 1 : 0;
          if (m2 > 0) {
            const c1 = n === 7 ? cu(1, 0.45) : 0, flip = n === 7 ? seg(f, c1 - 4, c1 + 4) : n === 8 ? 1 : 0;
            mythCard(c, W, 520, "\"Delete it and it's gone\"", ["Gemini chats a person reviewed:", "kept, even after you delete"],
              "Google's Gemini privacy page, Oct 2026", easeOut(m2) * (n === 8 ? 1 - seg(p, 0.7, 0.95) : 1), flip, "UP TO 3 YEARS");
          }
          if (n === 10) { rule(c, W, seg(p, 0.05, 0.18)); tag(c, "At work? Use the company's AI account", W / 2, 300, 50, "#e0f2fe", "#075985", -0.02, seg(p, 0.4, 0.5)); }
        }
      }} />
    </>
  );
};

export const OFFICE_SCENES = { sk_office: StOffice };
