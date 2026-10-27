import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";

// Creative 11 "The AI confirmed Goa" (series/scripts/creative11_group_summary.md): a family video call. Prasad mavayya
// asked the chat app's AI summary "What did we decide?" about a trip chat in which nothing was decided, read "confirmed
// that Goa would be the chosen destination", and booked twelve tickets. Lakshmi pinni wanted Ooty; Harika reads the chat:
// "Poll tomorrow". Our test (series/scripts/creative11_demo): 4 of 10 summaries made up a decision; with "Quote the message
// for each decision. If nothing was decided, say 'not decided'": 10 of 10 not decided. Then Prasad posts "OK DECIDED:
// Goa, 14th. Everyone agreed." and the same line gives "Decided: Goa" quoting him, 10 of 10 (the quiz): a quote shows
// who said it, not that everyone agreed. He says "See? The AI says Goa!" and the replay opens on frame 1. The AI's words
// on screen are its real replies (try 1 and the loop's), shortened. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "happy" | "proud" | "shock" | "angry" | "calm" | "deadpan" | "worried" | "smug";
type Arms = "rest" | "tickets" | "up" | "facepalm" | "point" | "phone" | "type" | "fold" | "palm";
type Who = "prasad" | "lakshmi" | "harika";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", RED = "#dc2626", WA = "#075e54", CHATBG = "#ece5dd";
const LOOK: Record<Who, { skin: string; hair: string; top: string; name: string; bg: string }> = {
  prasad: { skin: "#9c6a45", hair: "#2a2522", top: "#d97706", name: "Prasad mavayya", bg: "#d9f2e3" },
  lakshmi: { skin: "#a87450", hair: "#140f0c", top: "#9f1239", name: "Lakshmi pinni", bg: "#dbeafe" },
  harika: { skin: "#a26d47", hair: "#0d0a08", top: "#0f766e", name: "Harika", bg: "#fde7c7" },
};
const HOLD = 10;   // frames after the last line before the snap back to frame 1
const CLAP = "reel/creative09v1/clap.wav";   // a bright clap over the booms (phone speakers barely play 30-60 Hz)
// the AI summary's reply, try 1 of our test, word for word (shortened)
const SUMMARY = ["...The budget was set at 40,000", "rupees per family.", "...The last message confirmed", "that Goa would be the chosen", "destination."];
const MOODS: Record<number, Partial<Record<Who, [Mood, Arms]>>> = {
  1: { prasad: ["proud", "tickets"], lakshmi: ["shock", "up"], harika: ["deadpan", "facepalm"] },
  2: { prasad: ["proud", "tickets"], lakshmi: ["angry", "point"], harika: ["deadpan", "fold"] },
  3: { prasad: ["worried", "tickets"], lakshmi: ["angry", "fold"], harika: ["calm", "phone"] },
  4: { prasad: ["angry", "point"], lakshmi: ["angry", "fold"], harika: ["deadpan", "phone"] },
  5: { prasad: ["worried", "rest"], lakshmi: ["smug", "fold"], harika: ["calm", "palm"] },
  6: { prasad: ["shock", "rest"], lakshmi: ["smug", "fold"], harika: ["calm", "palm"] },
  7: { prasad: ["worried", "rest"], lakshmi: ["worried", "palm"], harika: ["calm", "phone"] },
  8: { prasad: ["worried", "rest"], lakshmi: ["calm", "fold"], harika: ["calm", "palm"] },
  9: { prasad: ["worried", "rest"], lakshmi: ["happy", "fold"], harika: ["smug", "palm"] },
  10: { prasad: ["smug", "type"], lakshmi: ["worried", "fold"], harika: ["worried", "phone"] },
  11: { prasad: ["proud", "rest"], lakshmi: ["shock", "up"], harika: ["deadpan", "phone"] },
  12: { prasad: ["proud", "tickets"], lakshmi: ["angry", "up"], harika: ["deadpan", "facepalm"] },
  13: { prasad: ["proud", "tickets"], lakshmi: ["angry", "fold"], harika: ["calm", "palm"] },
  14: { prasad: ["proud", "tickets"], lakshmi: ["shock", "up"], harika: ["deadpan", "facepalm"] },
};

// ---------- people (head and shoulders, drawn at a neck point; units as Creative 10's) ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, rad = 24) => {
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, rad, rad), INK, 3, r, { passes: 1, alpha: 0.55 });
};
const phoneProp = (c: Ctx, x: number, y: number, s: number, rot: number) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "#111827"; rrect(c, -48, -86, 96, 172, 16); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, -40, -76, 80, 152, 10); c.fill();
  c.fillStyle = "rgba(7,94,84,0.6)"; rrect(c, -30, -64, 60, 14, 5); c.fill();
  c.fillStyle = "rgba(15,23,42,0.25)"; [-36, -16, 4, 24].forEach((yy) => { rrect(c, -30, yy, 60, 10, 4); c.fill(); });
  c.restore();
};
// the fan of twelve printed tickets
const tickets = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let q = 0; q < 5; q++) {
    c.save(); c.rotate(-0.5 + q * 0.25);
    c.fillStyle = q === 4 ? "#fef3c7" : "#fffdf5"; rrect(c, -40, -230, 80, 220, 8); c.fill();
    stroke(c, rrectPts(-40, -230, 80, 220), INK, 3, r, { passes: 1, alpha: 0.5 });
    c.fillStyle = "#0ea5e9"; c.fillRect(-40, -230, 80, 34);
    if (q === 4) {
      c.font = SANS(20, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("GOA", 0, -206);
      c.font = SANS(16, 700); c.fillStyle = INK; c.fillText("14 DEC", 0, -170); c.fillText("x12", 0, -146);
    }
    c.restore();
  }
  c.restore();
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  if (who === "lakshmi") {   // a long braid over her right shoulder
    c.fillStyle = L.hair; c.beginPath(); c.moveTo(70, hy - 40); c.quadraticCurveTo(140, hy + 80, 110, hy + 260); c.lineTo(80, hy + 250); c.quadraticCurveTo(100, hy + 80, 40, hy - 20); c.closePath(); c.fill();
    for (let q = 0; q < 5; q++) stroke(c, [[84 + q * 4, hy + 40 + q * 40], [110 + q * 2, hy + 60 + q * 40]], "#2a2018", 4, r, { passes: 1, alpha: 0.6 });
  }
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "prasad") {   // short hair parted on the side, grey at the temples
    c.ellipse(0, hy - 60, 100, 62, 0, Math.PI, 0); c.lineTo(100, hy - 20); c.quadraticCurveTo(40, hy - 70, -30, hy - 86); c.quadraticCurveTo(-70, hy - 60, -100, hy - 20);
  } else if (who === "lakshmi") {   // parted in the middle, pulled back
    c.ellipse(0, hy - 56, 100, 72, 0, Math.PI, 0); c.lineTo(100, hy + 4); c.quadraticCurveTo(52, hy - 58, 4, hy - 80); c.lineTo(-4, hy - 80); c.quadraticCurveTo(-52, hy - 58, -100, hy + 4);
  } else {   // a short bob to the jaw
    c.ellipse(0, hy - 50, 112, 80, 0, Math.PI, 0); c.lineTo(112, hy + 70); c.lineTo(84, hy + 70); c.quadraticCurveTo(80, hy - 40, 20, hy - 70); c.quadraticCurveTo(-60, hy - 50, -84, hy + 70); c.lineTo(-112, hy + 70);
  }
  c.closePath(); c.fill();
  if (who === "prasad") [-1, 1].forEach((sx) => { c.fillStyle = "#cbd5e1"; c.beginPath(); c.ellipse(sx * 94, hy - 26, 10, 22, 0, 0, 7); c.fill(); });   // grey temples
  if (who === "lakshmi") { c.beginPath(); c.arc(0, hy - 46, 9, 0, 7); c.fillStyle = RED; c.fill(); }   // a bindi
  const brow = m === "worried" ? [-180, -160] : m === "shock" ? [-186, -184] : m === "deadpan" ? [-158, -158] : m === "angry" ? [-152, -172] : [-164, -164];
  [-1, 1].forEach((sx) => {
    let [yi, yo] = brow;
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock") {
      c.beginPath(); c.ellipse(ex, ey, 19, 22, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 3, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "proud") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "deadpan") {
      c.beginPath(); c.arc(ex, ey + 4, 9, 0, 7); c.fillStyle = INK; c.fill();
      c.fillStyle = L.skin; c.fillRect(ex - 16, ey - 16, 32, 15); stroke(c, [[ex - 16, ey - 1], [ex + 16, ey - 1]], INK, 5, r, { passes: 1 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
    } else if (m === "worried") {
      c.beginPath(); c.arc(ex + 4, ey + 4, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (who === "harika") {   // round specs
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 27), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  if (who === "prasad") {   // reading glasses pushed up on his forehead
    [-30, 30].forEach((ex) => stroke(c, circlePts(ex, hy - 74, 24, 14), "#7c2d12", 5, r, { passes: 1 }));
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#6b3f25", 6, r, { passes: 2 });
  if (who === "prasad") { c.fillStyle = L.hair; c.beginPath(); c.ellipse(-22, hy + 56, 32, 13, 0.2, 0, 7); c.ellipse(22, hy + 56, 32, 13, -0.2, 0, 7); c.fill(); }   // a thick moustache
  const my = hy + 80, open = talk || m === "shock";
  if (open) {
    const w = m === "shock" ? 26 : m === "proud" ? 28 : 21, h = m === "shock" ? 24 : 13;
    c.beginPath(); c.ellipse(0, my + (who === "prasad" ? 6 : 0), w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "proud" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "calm" ? 22 : 30, m === "calm" ? 10 : 16, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "worried" || m === "angry") stroke(c, [[-18, my + 6], [0, my], [18, my + 6]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (m === "worried" || m === "shock") { c.beginPath(); c.moveTo(92, hy - 70); c.quadraticCurveTo(112, hy - 40, 92, hy - 30); c.quadraticCurveTo(76, hy - 40, 92, hy - 70); c.fillStyle = "#7dd3fc"; c.fill(); }
  if (who === "lakshmi") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 28, 8, 0, 7); c.fillStyle = "#facc15"; c.fill(); });
};
const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(sc, sc);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.quadraticCurveTo(178, 330, 192, 780); c.lineTo(-192, 780);
  c.quadraticCurveTo(-178, 330, -140, 34); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "prasad") {   // a mustard shirt with a pocket and buttons
    stroke(c, [[0, 30], [0, 400]], "#92400e", 4, r, { passes: 1 }); [90, 170, 250].forEach((y) => { c.beginPath(); c.arc(10, y, 6, 0, 7); c.fillStyle = "#fef3c7"; c.fill(); });
    stroke(c, rrectPts(-110, 120, 70, 70), "#92400e", 4, r, { passes: 1 });
  }
  if (who === "lakshmi") {   // a maroon kurta with a dupatta across
    c.fillStyle = "#fbbf24"; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-60, 30); c.lineTo(190, 560); c.lineTo(110, 640); c.closePath(); c.fill();
  }
  if (who === "harika") {   // a striped T-shirt, headphones round her neck
    for (let y = 80; y < 780; y += 70) { c.fillStyle = "#99f6e4"; c.fillRect(-200, y, 400, 22); }
  }
  c.restore();
  stroke(c, [[-140, 34], [-180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  if (who === "harika") stroke(c, circlePts(0, 34, 70, 34, 0, Math.PI, 14), "#334155", 14, r, { passes: 2 });   // headphones on her neck
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-150, 380]], rr: Pt[] = [[178, 230], [150, 380]];
  if (a === "tickets") rr = [[180, 40], [170, -110]];
  else if (a === "up") { l = [[-200, 120], [-170, -60]]; rr = [[200, 120], [170, -60]]; }
  else if (a === "facepalm") rr = [[150, 60], [40, -150]];
  else if (a === "point") rr = [[220, 30], [300, -60]];
  else if (a === "phone") rr = [[182, 220], [118, 120]];
  else if (a === "type") { l = [[-150, 230], [-50, 160]]; rr = [[150, 230], [50, 160]]; }
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  else if (a === "palm") rr = [[200, 120], [240, -10]];
  const front = a === "facepalm" || a === "fold";
  if (!front) { limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r); limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  if (a === "tickets") tickets(c, 170, -110, 1.2, r);
  if (a === "phone" || a === "type") phoneProp(c, a === "type" ? 0 : 126, a === "type" ? 150 : 60, 1, a === "type" ? 0 : -0.1);
  face(c, who, m, talk, r);
  if (front) {
    if (a === "fold") { limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r); limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
    else { limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r); limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r, 30); }
  }
  c.restore();
};

// ---------- the video call ----------
type Box = [number, number, number, number];
// a tile's room behind the person
const roomBg = (c: Ctx, who: Who, b: Box, r: () => number) => {
  const [x, y, w, h] = b, L = LOOK[who];
  c.fillStyle = L.bg; c.fillRect(x, y, w, h);
  if (who === "prasad") {   // a wall calendar, a framed photo
    c.fillStyle = "#fff"; rrect(c, x + w * 0.66, y + h * 0.08, w * 0.24, h * 0.22, 6); c.fill();
    c.fillStyle = RED; c.fillRect(x + w * 0.66, y + h * 0.08, w * 0.24, h * 0.06);
    c.font = SANS(Math.round(w * 0.05), 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("DEC", x + w * 0.78, y + h * 0.24);
    c.fillStyle = "#a16207"; rrect(c, x + w * 0.08, y + h * 0.1, w * 0.18, h * 0.16, 6); c.fill();
    c.fillStyle = "#fde68a"; rrect(c, x + w * 0.1, y + h * 0.12, w * 0.14, h * 0.12, 4); c.fill();
  } else if (who === "lakshmi") {   // kitchen tiles and a steel shelf
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 3;
    for (let q = 1; q < 8; q++) { c.beginPath(); c.moveTo(x, y + (q * h) / 8); c.lineTo(x + w, y + (q * h) / 8); c.stroke(); c.beginPath(); c.moveTo(x + (q * w) / 8, y); c.lineTo(x + (q * w) / 8, y + h); c.stroke(); }
    c.fillStyle = "#94a3b8"; c.fillRect(x + w * 0.05, y + h * 0.28, w * 0.9, 8);
    [0.12, 0.3, 0.75].forEach((px) => { c.fillStyle = "#cbd5e1"; rrect(c, x + w * px, y + h * 0.17, w * 0.1, h * 0.11, 6); c.fill(); });
  } else {   // a hostel pinboard and fairy lights
    c.fillStyle = "#b45309"; rrect(c, x + w * 0.62, y + h * 0.08, w * 0.3, h * 0.22, 6); c.fill();
    ["#fef08a", "#bfdbfe", "#fecdd3"].forEach((col, q) => { c.fillStyle = col; c.fillRect(x + w * (0.65 + q * 0.08), y + h * (0.11 + (q % 2) * 0.06), w * 0.07, h * 0.07); });
    for (let q = 0; q < 9; q++) { c.beginPath(); c.arc(x + w * (0.06 + q * 0.06), y + h * 0.1 + Math.sin(q) * 8, 7, 0, 7); c.fillStyle = q % 2 ? "#fde047" : "#fb7185"; c.fill(); }
  }
};
// one person's tile: their room, them, a name tag; `live` = speaking (a green border, as video calls show it)
const tile = (c: Ctx, who: Who, b: Box, m: Mood, a: Arms, talk: boolean, live: boolean, r: () => number, f: number) => {
  const [x, y, w, h] = b;
  c.save(); rrect(c, x, y, w, h, 22); c.clip();
  roomBg(c, who, b, r);
  const sc = Math.min(w / 560, h / 640) * 1.05;
  person(c, who, [x + w / 2, y + h * 0.56], sc, m, a, talk, r);
  c.restore();
  stroke(c, rrectPts(x, y, w, h), live ? "#22c55e" : "rgba(15,23,42,0.6)", live ? 9 : 4, r, { passes: 1 });
  const fs = Math.max(22, Math.round(w * 0.055));
  c.font = SANS(fs, 700); const tw = c.measureText(LOOK[who].name).width;
  c.fillStyle = "rgba(15,23,42,0.75)"; rrect(c, x + 14, y + h - fs * 1.8, tw + 30 + fs, fs * 1.4, 10); c.fill();
  c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(LOOK[who].name, x + 28 + fs * 0.8, y + h - fs * 0.75);
  c.beginPath(); c.arc(x + 30, y + h - fs * 1.1, fs * 0.28, 0, 7); c.fillStyle = live && Math.floor(f / 4) % 2 ? "#22c55e" : "#e2e8f0"; c.fill();
};
// the group chat (screen space), messages from the bottom up; `hl` rings one message
type Msg = { from: string; text: string; me?: boolean; ai?: boolean };
const CHAT_MORE: Msg[] = [   // the chat our test used (series/scripts/creative11_demo), from 7:12 pm
  { from: "Prasad", text: "Goa flights are cheap on the 14th." }, { from: "Srinu", text: "I can do 14th." },
  { from: "Bhavani", text: "I said I have a function on the 14th" }, { from: "Kiran", text: "Budget per family?" },
  { from: "Prasad", text: "40k max." }, { from: "Lakshmi", text: "40k for Ooty is plenty." }, { from: "Kiran", text: "Goa 40k is tight." },
  { from: "Harika", text: "Can we vote? Poll tomorrow?" }, { from: "Srinu", text: "Goa" }, { from: "Bhavani", text: "Let me ask amma first." },
];
const CHAT_TAIL: Msg[] = [
  { from: "Prasad", text: "Goa it is then?" }, { from: "Lakshmi", text: "No! Ooty." },
  { from: "Harika", text: "Not decided yet mavayya. Poll tomorrow." }, { from: "Kiran", text: "ok poll tomorrow" },
  { from: "Prasad", text: "Fine. Good night all" },
];
const groupChat = (c: Ctx, b: Box, msgs: Msg[], k: number, hl: number, ring: number, r: () => number, title = "Trip plan 2026") => {
  if (k <= 0) return;
  const [x, y, w, h] = b, s = w / 1000;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.save(); rrect(c, x, y, w, h, 26); c.clip();
  c.fillStyle = CHATBG; c.fillRect(x, y, w, h);
  c.fillStyle = WA; c.fillRect(x, y, w, 96 * s);
  c.font = SANS(Math.round(44 * s)); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(title, x + 34 * s, y + 62 * s);
  let yy = y + h - 30 * s;
  for (let i = msgs.length - 1; i >= 0 && yy > y + 110 * s; i--) {
    const mg = msgs[i], fs = Math.round((mg.ai ? 34 : 38) * s);
    c.font = SANS(fs, mg.ai ? 600 : 500);
    const lines = mg.text.split("\n"), lw = Math.max(...lines.map((t) => c.measureText(t).width), 200 * s);
    const bh = (lines.length * fs * 1.25 + fs * 1.5), bw = Math.min(w - 60 * s, lw + 50 * s);
    const bx = mg.me ? x + w - bw - 24 * s : x + 24 * s, by = yy - bh;
    c.fillStyle = mg.ai ? "#ede9fe" : mg.me ? "#dcf8c6" : "#fff"; rrect(c, bx, by, bw, bh, 18 * s); c.fill();
    c.font = SANS(Math.round(fs * 0.72), 700); c.fillStyle = mg.ai ? "#6d28d9" : "#0f766e"; c.fillText(mg.from, bx + 22 * s, by + fs * 0.95);
    c.font = SANS(fs, mg.ai ? 600 : 500); c.fillStyle = INK;
    lines.forEach((t, q) => c.fillText(t, bx + 22 * s, by + fs * 1.95 + q * fs * 1.25));
    if (i === hl && ring > 0) stroke(c, circlePts(bx + bw / 2, by + bh / 2, bw / 2 + 24 * s, bh / 2 + 22 * s, 0, Math.PI * 2 * clamp(ring), 48), RED, 8 * s, r, { passes: 2 });
    yy = by - 18 * s;
  }
  c.restore(); c.restore();
};
// frame 1's summary card (screen space, y 225-640): the AI summary, "confirmed ... Goa" circled
const summaryCard = (c: Ctx, W: number, k: number, ring: number, r: () => number, loop = false) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 60, y = 228, w = W - 120, h = 400;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#f5f3ff"; rrect(c, x, y, w, h, 26); c.fill();
  c.fillStyle = "#6d28d9"; rrect(c, x, y, w, 70, 26); c.fill(); c.fillRect(x, y + 40, w, 30);
  c.font = SANS(34); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI summary · Trip plan 2026", x + 30, y + 48);
  c.font = SANS(38, 600); c.fillStyle = INK;
  const rows = loop ? ["We decided to go to Goa on the 14th.", "Quote: Prasad: \"OK DECIDED: Goa, 14th.", "Everyone agreed.\""] : SUMMARY;
  rows.forEach((t, i) => c.fillText(t, x + 34, y + 128 + i * 52));
  if (ring > 0 && !loop) stroke(c, circlePts(x + w * 0.42, y + 128 + 2.5 * 52 - 12, w * 0.44, 64, 0, Math.PI * 2 * clamp(ring), 48), RED, 8, r, { passes: 2 });
  c.restore();
};
const SANS_TAG = (c: Ctx, t: string, x: number, y: number, s: number, bg: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(s); const w = c.measureText(t).width;
  c.fillStyle = bg; rrect(c, x - w / 2 - 26, y - s * 0.95, w + 52, s * 1.4, 18); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, x, y + s * 0.05); c.restore();
};
// the quiz card (screen space), held in the gap after the line; its 3-2-1 ends QEND frames before the answer
const QEND = 42;   // a real stop after the count (EP40: 34 frames left the riser's tail in it)
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 830); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -440, 940, 830, 30); c.fill();
  c.font = SANS(46); c.fillStyle = RED; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -366);
  c.font = SANS(50); c.fillStyle = INK; c.fillText("He asks with the quote line.", 0, -290); c.fillText("The AI says?", 0, -228);
  [["A", "not decided"], ["B", "decided: Goa"], ["C", "it catches him"]].forEach(([l, t], i) => {
    const yy = -180 + i * 150;
    c.fillStyle = "#e0e7ff"; rrect(c, -400, yy, 800, 128, 22); c.fill();
    c.font = SANS(62); c.fillStyle = INK; c.textAlign = "left"; c.fillText(l, -360, yy + 84);
    c.font = SANS(56, 600); c.fillText(t, -250, yy + 84);
  });
  c.font = SANS(42, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A, B or C", 0, 330);
  const t = f - (next - QEND - 72), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(0, 470); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? RED : "#2563eb"; c.fill();
    c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
  }
  c.restore();
};
const panel = (c: Ctx, W: number, H: number, bg: string, title: string) => {
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (title) { c.font = SANS(52); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 300); }
};
const card = (c: Ctx, b: Box, bg: string) => { const [x, y, w, h] = b; c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 28); c.fill(); c.fillStyle = bg; rrect(c, x, y, w, h, 28); c.fill(); };
const testRow = (c: Ctx, y: number, lab: string, val: string, col: string, bg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, 110, y - 80, 860, 150, 22); c.fill();
  c.font = SANS(38, 600); c.fillStyle = "#334155"; c.textAlign = "left"; c.fillText(lab, 140, y - 20);
  c.font = SANS(60); c.fillStyle = col; c.fillText(val, 140, y + 44);
  c.restore();
};

// ---------- the scene ----------
const StFamily: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["grid", "spk", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") {
      sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.45} />,
        <Sfx key={k("p")} at={4} src="audio/sfx_pop.wav" vol={0.3} />);
      sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.4) - 10} src="audio/gag_ding.wav" vol={0.18} />);
    }
    if (b.prop === "ooty") sfx.push(<Sfx key={k("b")} at={at - 6} src="reel/sfx_boom.wav" vol={0.4} />);
    if (b.prop === "poll") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) + 2} src="audio/gag_ding.wav" vol={0.22} />);
    if (b.prop === "ask") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) - 6} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("c")} at={end + 1} src="audio/sfx_chaching.wav" vol={0.22} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 15)} src={CLAP} vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 16)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "pass") sfx.push(<Sfx key={k("s")} at={end + 1} src="audio/sfx_success.wav" vol={0.24} />);
    if (b.prop === "quiz") {   // his message pops in; the count's ticks and riser stop on its "1", then silence
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("k" + q)} at={at + 14 + q * 5} src="audio/sfx_pop.wav" vol={0.14} />));
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - QEND - 72 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - QEND - 36} src="reel/sfx_riser.wav" vol={0.45} />);
    }
    if (b.prop === "reveal") sfx.push(<Sfx key={k("n")} at={end + 1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("m")} at={end + 1} src={CLAP} vol={0.55} />);
    if (b.prop === "yell") sfx.push(<Sfx key={k("z")} at={at - 6} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "who") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 8} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "loop") {   // after "See? The AI says Goa!": the snap back to frame 1, the biggest hit
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.65} />, <Sfx key={k("s")} at={slam} src="audio/sfx_success.wav" vol={0.3} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 24 : 0;
  return (
    <>
      {sfx}
      {first("quiz") === 0 && percEnd > 30 && (   // the last scene builds: hats and claps on the bed's grid, ramping up
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => 0.14 + 0.36 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const r = rng(4100 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const mood = (who: Who): [Mood, Arms] => (loopOn ? MOODS[1][who] : MOODS[n]?.[who]) ?? ["calm", "rest"];
        const spkWho = (b.who as Who);
        const talk = (who: Who) => b.who === who && talking && !loopOn;
        const hookLayout = b.shot === "hook" || loopOn;
        if (hookLayout) {
          // ---------- frame 1: the summary on top, Prasad big with the tickets, the other two small ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          const [m1, a1] = mood("prasad");
          tile(c, "prasad", [40, 650, 1000, 820], m1, a1, talk("prasad"), b.who === "prasad" && !loopOn, r, f);
          const [m2, a2] = mood("lakshmi"), [m3, a3] = mood("harika");
          tile(c, "lakshmi", [620, 1000, 200, 250], m2, a2, false, false, r, f);
          tile(c, "harika", [830, 1000, 200, 250], m3, a3, false, false, r, f);
          summaryCard(c, W, 1, loopOn ? 1 : seg(f, cu(1, 0.4) - 12, cu(1, 0.4) + 4), r);
          SANS_TAG(c, "12 tickets booked!", 270, 1330, 50, "#fef3c7", INK, 1);
        } else if (b.shot === "grid" || b.shot === "spk") {
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          const big: Who = b.shot === "spk" ? spkWho : "prasad";
          if (b.shot === "grid") {
            const boxes: Record<Who, Box> = { prasad: [30, 230, 500, 600], lakshmi: [550, 230, 500, 600], harika: [30, 850, 500, 600] };
            (["prasad", "lakshmi", "harika"] as Who[]).forEach((w) => { const [m, a] = mood(w); tile(c, w, boxes[w], m, a, talk(w), b.who === w, r, f); });
            groupChat(c, [550, 850, 500, 600], CHAT_TAIL, 1, -1, 0, r);
          } else {
            const [m, a] = mood(big);
            tile(c, big, [30, 230, 1020, 860], m, a, talk(big), true, r, f);
            const others = (["prasad", "lakshmi", "harika"] as Who[]).filter((w) => w !== big);
            others.forEach((w, q) => { const [mo, ao] = mood(w); tile(c, w, [30 + q * 520, 1110, 500, 350], mo, ao, false, false, r, f); });
          }
          if (b.prop === "who") SANS_TAG(c, "check WHO said it", W / 2, 330, 66, "#fee2e2", "#991b1b", seg(f, cu(1, 0.5) - 6, cu(1, 0.5) + 2));
          if (b.prop === "ooty") SANS_TAG(c, "\"I said OOTY!\"", W / 2, 330, 66, "#fef3c7", INK, seg(f, ln.from + 2, ln.from + 8));
          if (b.prop === "yell") SANS_TAG(c, "MAVAYYA!", W / 2, 850, 96, "#fee2e2", "#991b1b", seg(f, ln.from, ln.from + 5));
        } else if (b.shot === "chat") {
          // ---------- the end of the chat: "Not decided yet mavayya. Poll tomorrow." ----------
          panel(c, W, H, "#1e293b", "");
          groupChat(c, [70, 230, 940, 1230], [...CHAT_MORE, ...CHAT_TAIL], 1, CHAT_MORE.length + 2, seg(f, cu(1, 0.4), cu(1, 0.4) + 12), r);
        } else if (b.shot === "ask") {
          // ---------- what he asked, and what it gave him ----------
          panel(c, W, H, "#1e293b", "WHAT MAVAYYA ASKED");
          const c1 = cu(1, 0.45);
          card(c, [70, 340, 940, 170], "#dcf8c6");
          c.font = SANS(44, 600); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Summarize this chat.", 110, 410); c.fillText("What did we decide?", 110, 466);
          stroke(c, [[110, 482], [560, 482]], RED, 6, r, { passes: 1, alpha: seg(f, ln.from + 4, ln.from + 12) });
          card(c, [70, 560, 940, 420], "#ede9fe");
          c.font = SANS(30, 700); c.fillStyle = "#6d28d9"; c.fillText("✦ AI summary (our test, try 1)", 110, 616);
          c.font = SANS(40, 600); c.fillStyle = INK;
          SUMMARY.forEach((t, q) => c.fillText(t, 110, 680 + q * 56));
          if (f >= c1 - 4) stroke(c, circlePts(420, 806, 360, 70, 0, Math.PI * 2 * seg(f, c1 - 4, c1 + 8), 48), RED, 7, r, { passes: 2 });
          SANS_TAG(c, "nobody confirmed Goa", W / 2, 1090, 56, "#fee2e2", "#991b1b", seg(f, c1 + 4, c1 + 12));
          SANS_TAG(c, "you asked for a decision: it found one", W / 2, 1230, 46, "#fef3c7", INK, seg(f, c1 + 12, c1 + 20));
        } else if (b.shot === "test") {
          // ---------- our test ----------
          panel(c, W, H, "#0f172a", "OUR REAL TEST");
          c.font = SANS(34, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("our made-up chat · a free AI model on our computer,", W / 2, 360); c.fillText("offline · 10 tries each", W / 2, 404);
          const c1 = cu(1, 0.4);
          const pass = b.prop === "pass";
          testRow(c, 520, "\"What did we decide?\"", "4 of 10 made one up", RED, "#fee2e2", pass ? 1 : seg(f, c1 - 2, c1 + 6));
          if (f >= c1 + 10 || pass) {   // script review: do real apps do this too?
            c.save(); c.globalAlpha = pass ? 1 : seg(f, c1 + 10, c1 + 18);
            card(c, [110, 1020, 860, 170], "#1e293b");
            c.font = SANS(40, 600); c.fillStyle = "#fde68a"; c.textAlign = "center";
            c.fillText("Apple paused its AI news summaries", W / 2, 1092); c.fillText("over false headlines (Jan 2025)", W / 2, 1148);
            c.restore();
          }
          if (pass) testRow(c, 760, "with the quote line", "10 of 10: not decided", GREEN, "#dcfce7", seg(f, ln.from, ln.from + 8));
          c.font = SANS(28, 600); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText("Qwen2.5 7B, 4-bit, every reply read by hand", W / 2, 1400);
        } else if (b.shot === "rule") {
          // ---------- the line to copy ----------
          panel(c, W, H, "#0f172a", "BEFORE YOU ACT ON A SUMMARY");
          const kk = seg(f, ln.from, ln.from + 8);
          c.save(); c.globalAlpha = clamp(kk * 2);
          card(c, [70, 380, 940, 560], "#fef9c3");
          c.font = SANS(34, 700); c.fillStyle = "#854d0e"; c.textAlign = "left"; c.fillText("TYPE THIS", 110, 446);
          c.font = SANS(52, 700); c.fillStyle = INK;
          ["What did we decide?", "Quote the message for", "each decision. If nothing", "was decided, say", "\"not decided\"."].forEach((t, q) => c.fillText(t, 110, 530 + q * 70));
          c.restore();
          SANS_TAG(c, "no message = no decision", W / 2, 1060, 60, "#dcfce7", "#14532d", seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
        } else if (b.shot === "type") {
          // ---------- he posts the decision himself ----------
          panel(c, W, H, "#1e293b", "");
          const typed = "OK DECIDED: Goa, 14th. Everyone agreed.";
          const shown = Math.floor(typed.length * seg(f, ln.from + 10, endL - 4));
          const msgs: Msg[] = [...CHAT_MORE, ...CHAT_TAIL, { from: "Prasad · Mon 9:40 am", text: shown >= typed.length ? "OK DECIDED: Goa, 14th.\nEveryone agreed." : typed.slice(0, shown) + "▍", me: true }];
          groupChat(c, [70, 230, 940, 1230], msgs, 1, msgs.length - 1, seg(f, endL - 4, endL + 8), r);
        } else if (b.shot === "reply") {
          // ---------- the same line, after his message: "Decided: Goa", quoting him ----------
          panel(c, W, H, "#1e293b", "THE SAME QUOTE LINE");
          const c1 = cu(1, 0.45);
          card(c, [70, 360, 940, 420], "#ede9fe");
          c.font = SANS(30, 700); c.fillStyle = "#6d28d9"; c.textAlign = "left"; c.fillText("✦ AI summary (our test)", 110, 416);
          c.font = SANS(44, 600); c.fillStyle = INK;
          ["We decided to go to Goa", "on the 14th.", "Quote: Prasad: \"OK DECIDED:", "Goa, 14th. Everyone agreed.\""].forEach((t, q) => c.fillText(t, 110, 486 + q * 62));
          if (f >= c1 - 2) stroke(c, circlePts(240, 672, 150, 40, 0, Math.PI * 2 * seg(f, c1 - 2, c1 + 8), 40), RED, 7, r, { passes: 2 });
          SANS_TAG(c, "B ✓  10 of 10 tries", W / 2, 900, 72, "#fee2e2", "#991b1b", seg(f, ln.from + 2, ln.from + 8));
          SANS_TAG(c, "the quote is mavayya's own message", W / 2, 1040, 46, "#fef3c7", INK, seg(f, c1 + 4, c1 + 12));
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
      }} />
    </>
  );
};

export const FAMILY_SCENES = { sk_family: StFamily };
