import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, rrectPts, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { wrap } from "./MannersCrayon";

// Creative 13 "Just the amount" (series/scripts/creative13_split_the_bill.md): a nature-documentary parody at a biryani
// place. Arjun asked an AI chat for "just the amount" of the bill split four ways: ₹1,059 each; Sneha's calculator says
// ₹822.07. A whispering narrator watches the ritual through the leaves. Asked for just the number, a small AI guesses;
// our test (a tiny offline AI, Qwen 3B, series/scripts/creative13_demo): 10 answers, ₹220 to ₹1,139, not one right; made
// to show its working: 9 of 10. The AI writes the steps, the calculator checks each line. The young male pays; the
// dessert bill comes, "AI, just the amount!", his phone flashes ₹1,059 each: frame 1 (loops). One beat per line.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "happy" | "shock" | "angry" | "calm" | "deadpan" | "worried" | "smug" | "excited";
type Arms = "rest" | "up" | "phone" | "calc" | "five" | "fiveL" | "pay" | "fold" | "shrug";
type Who = "arjun" | "sneha" | "nikhil" | "meghana" | "rani" | "vasudha" | "charan" | "harsha" | "sarojini" | "swapna" | "bunny" | "thathayya" | "harish" | "bindu" | "varsha" | "akhil" | "srinivas" | "ramesh" | "keerthi" | "sunny" | "meena" | "rohit" | "kumar";   // rani: EP42's customer (FairCrayon.tsx); vasudha, charan: Creative 14 (LinksCrayon.tsx)

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 600) => `${w} ${s}px "Courier New", monospace`;
const SERIF = (s: number, w = 700) => `${w} ${s}px Georgia, "Times New Roman", serif`;
const GREEN = "#15803d", RED = "#dc2626", BLUE = "#2563eb";
const LOOK: Record<Who, { skin: string; hair: string; top: string }> = {
  arjun: { skin: "#a26d47", hair: "#1c1410", top: "#2563eb" },
  sneha: { skin: "#b07a52", hair: "#120d0a", top: "#be185d" },
  nikhil: { skin: "#8d5a3b", hair: "#1c1410", top: "#15803d" },
  meghana: { skin: "#9c6a45", hair: "#2b1a10", top: "#d97706" },
  rani: { skin: "#8d5a3b", hair: "#120d0a", top: "#0d9488" },
  vasudha: { skin: "#b07a52", hair: "#3f3f46", top: "#7c3aed" },
  charan: { skin: "#9c6a45", hair: "#1c1410", top: "#f97316" },
  harsha: { skin: "#a26d47", hair: "#0f0a08", top: "#0ea5e9" },
  sarojini: { skin: "#a26d47", hair: "#1c1410", top: "#be123c" },   // Creative 15 (WeddingCrayon.tsx): the bride's mother, a silk saree
  swapna: { skin: "#b07a52", hair: "#120d0a", top: "#f59e0b" },   // the bride
  bunny: { skin: "#9c6a45", hair: "#0f0a08", top: "#111827" },   // RJ Bunny, a black tee
  thathayya: { skin: "#8d5a3b", hair: "#e5e7eb", top: "#f8fafc" },   // Creative 16 (CakeCrayon.tsx): turning 60, white hair, a white kurta
  harish: { skin: "#a26d47", hair: "#1c1410", top: "#7c3aed" },   // his son, who asked the AI for the cake message
  bindu: { skin: "#b07a52", hair: "#120d0a", top: "#ec4899" },   // the niece, 13, who counts on her fingers
  varsha: { skin: "#9c6a45", hair: "#120d0a", top: "#0ea5e9" },   // Creative 17 (CaseCrayon.tsx): wrote the answer, a school uniform blue
  akhil: { skin: "#b07a52", hair: "#1c1410", top: "#16a34a" },   // copied it word for word
  srinivas: { skin: "#8d5a3b", hair: "#3f3f46", top: "#f5f5f4" },   // the tuition teacher, a cream shirt, grey hair
  ramesh: { skin: "#9c6a45", hair: "#9ca3af", top: "#b45309" },   // Creative 18 (TatkalCrayon.tsx): Babai, 55, grey hair, a mustard shirt
  keerthi: { skin: "#b07a52", hair: "#120d0a", top: "#7c3aed" },   // his niece, 24
  sunny: { skin: "#a26d47", hair: "#1c1410", top: "#dc2626" },   // his nephew, 15, reads the rules
  meena: { skin: "#9c6a45", hair: "#120d0a", top: "#0d9488" },   // EP46 (PosterCrayon.tsx): drew her poster by hand
  rohit: { skin: "#b07a52", hair: "#1c1410", top: "#f97316" },   // made his with AI
  kumar: { skin: "#8d5a3b", hair: "#52525b", top: "#1e3a8a" },   // Kumar sir, the fest judge
};
const SEATS: Partial<Record<Who, number>> = { arjun: 190, nikhil: 425, meghana: 660, sneha: 895 };
// our test, "just the amount" (3B, tries 1-10) and its working (3B, show the working, try 3, shortened)
const GUESSES = ["220.23", "965.63", "241.25", "1,059", "220.23", "1,068.25", "1,028.64", "1,138.88", "849.00", "886.50"];
const STEPS: [string, string][] = [["GST: 2,847 × 0.05", "142.35"], ["2,847 + 142.35", "2,989.35"], ["tip: 2,989.35 × 0.10", "298.94"],
  ["2,989.35 + 298.94", "3,288.29"], ["3,288.29 ÷ 4", "822.07"]];
const ASK = "Food ₹2,847. Add 5% GST, then a 10% tip on the total. 4 friends, split equally. Just the amount.";
const SHOWW = "Show the working step by step.";
const MOODS: Record<number, Partial<Record<Who, [Mood, Arms]>>> = {
  1: { sneha: ["shock", "calc"], arjun: ["smug", "phone"], nikhil: ["shock", "rest"], meghana: ["worried", "rest"] },
  2: { sneha: ["angry", "calc"], arjun: ["smug", "phone"], nikhil: ["deadpan", "fold"], meghana: ["worried", "rest"] },
  9: { sneha: ["smug", "fiveL"], arjun: ["worried", "pay"], nikhil: ["happy", "up"], meghana: ["happy", "five"] },
  10: { sneha: ["deadpan", "fold"], arjun: ["excited", "phone"], nikhil: ["shock", "rest"], meghana: ["worried", "rest"] },
};
const JUNGLE = "reel/creative13v1/jungle.wav", WAH = "reel/creative13v1/wahwah.wav", CLAP = "reel/creative09v1/clap.wav";

// ---------- people (head and shoulders at a neck point; units as Creative 12's) ----------
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
  c.fillStyle = L.hair;
  if (who === "sneha" || who === "rani" || who === "swapna" || who === "bindu" || who === "varsha" || who === "keerthi" || who === "meena") { c.beginPath(); c.ellipse(0, hy + 10, 116, 140, 0, 0, 7); c.fill(); rrect(c, -116, hy, 232, 200, 40); c.fill(); }   // long hair behind
  if (who === "meghana") { c.beginPath(); c.ellipse(0, hy + 6, 114, 124, 0, 0, 7); c.fill(); }   // a bob
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "vasudha" || who === "sarojini") {   // a bun, pulled back, grey streak
    c.ellipse(0, hy - 118, 46, 40, 0, 0, 7); c.moveTo(100, hy - 30); c.ellipse(0, hy - 56, 100, 70, 0, Math.PI, 0); c.lineTo(100, hy - 20); c.lineTo(-100, hy - 20);
  } else if (who === "nikhil" || who === "charan" || who === "akhil" || who === "rohit") {   // curly
    for (let q = 0; q < 7; q++) { const a = Math.PI * (1.05 + q * 0.15); c.moveTo(Math.cos(a) * 92 + 30, hy - 40 + Math.sin(a) * 84); c.arc(Math.cos(a) * 92, hy - 40 + Math.sin(a) * 84, 30, 0, 7); }
  } else if (who === "sneha" || who === "rani" || who === "swapna" || who === "bindu" || who === "varsha" || who === "keerthi" || who === "meena") {   // parted in the middle
    c.ellipse(0, hy - 56, 100, 70, 0, Math.PI, 0); c.lineTo(100, hy + 4); c.quadraticCurveTo(52, hy - 58, 4, hy - 80); c.lineTo(-4, hy - 80); c.quadraticCurveTo(-52, hy - 58, -100, hy + 4);
  } else if (who === "meghana") {   // a fringe
    c.ellipse(0, hy - 56, 100, 66, 0, Math.PI, 0); c.lineTo(100, hy - 30); c.lineTo(-100, hy - 30);
  } else {   // arjun: neat, side parting
    c.ellipse(0, hy - 60, 100, 62, 0, Math.PI, 0); c.lineTo(100, hy - 20); c.quadraticCurveTo(40, hy - 70, -30, hy - 86); c.quadraticCurveTo(-70, hy - 60, -100, hy - 20);
  }
  c.closePath(); c.fill();
  const brow = m === "worried" ? [-180, -160] : m === "shock" || m === "excited" ? [-186, -184] : m === "deadpan" ? [-158, -158] : m === "angry" ? [-152, -172] : [-164, -164];
  [-1, 1].forEach((sx) => {
    let [yi, yo] = brow;
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "excited") {
      c.beginPath(); c.ellipse(ex, ey, 19, 22, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 3, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "deadpan") {
      c.beginPath(); c.arc(ex, ey + 4, 9, 0, 7); c.fillStyle = INK; c.fill();
      c.fillStyle = L.skin; c.fillRect(ex - 16, ey - 16, 32, 15); stroke(c, [[ex - 16, ey - 1], [ex + 16, ey - 1]], INK, 5, r, { passes: 1 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (who === "nikhil" || who === "vasudha" || who === "thathayya" || who === "srinivas" || who === "ramesh" || who === "kumar") {   // glasses
    [-36, 36].forEach((ex) => stroke(c, rrectPts(ex - 30, hy - 26, 60, 44), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#6b3f25", 6, r, { passes: 2 });
  const my = hy + 80, open = talk || m === "shock" || m === "excited";
  if (open) {
    const w = m === "shock" ? 26 : m === "excited" ? 30 : 21, h = m === "shock" ? 24 : m === "excited" ? 20 : 13;
    c.beginPath(); c.ellipse(0, my + 4, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "calm" ? 22 : 34, m === "calm" ? 10 : 18, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "worried" || m === "angry") stroke(c, [[-18, my + 6], [0, my], [18, my + 6]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (who === "sneha" || who === "meghana" || who === "rani" || who === "vasudha") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 28, 8, 0, 7); c.fillStyle = "#facc15"; c.fill(); });   // earrings
  if (who === "rani") { c.beginPath(); c.arc(0, hy - 62, 9, 0, 7); c.fillStyle = RED; c.fill(); }   // a bindi
};
const heldPhone = (c: Ctx, x: number, y: number) => {
  c.save(); c.translate(x, y); c.rotate(-0.12);
  c.fillStyle = "#111827"; rrect(c, -34, -64, 68, 120, 12); c.fill();
  c.fillStyle = "#c7d2fe"; rrect(c, -27, -55, 54, 100, 8); c.fill();
  c.restore();
};
const heldCalc = (c: Ctx, x: number, y: number) => {
  c.save(); c.translate(x, y); c.rotate(0.1);
  c.fillStyle = "#334155"; rrect(c, -50, -70, 100, 136, 12); c.fill();
  c.fillStyle = "#bbf7d0"; rrect(c, -38, -58, 76, 30, 5); c.fill();
  c.fillStyle = "#cbd5e1"; for (let q = 0; q < 9; q++) { rrect(c, -36 + (q % 3) * 26, -18 + Math.floor(q / 3) * 26, 20, 18, 4); c.fill(); }
  c.restore();
};
export type BillWho = Who;
export type BillMood = Mood;
export type BillArms = Arms;
export const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(sc, sc);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.quadraticCurveTo(178, 330, 192, 780); c.lineTo(-192, 780);
  c.quadraticCurveTo(-178, 330, -140, 34); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "arjun") { c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(-46, 30); c.lineTo(0, 110); c.lineTo(46, 30); c.closePath(); c.fill(); }   // a collar
  if (who === "sneha") { c.fillStyle = "#fbcfe8"; c.fillRect(-200, 300, 400, 22); }   // a kurta's border
  if (who === "sarojini") { c.fillStyle = "#fde047"; c.fillRect(-200, 300, 400, 22); c.fillStyle = "#fecdd3"; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-60, 30); c.lineTo(190, 560); c.lineTo(110, 640); c.closePath(); c.fill(); }   // a silk saree's zari border and pallu
  if (who === "swapna") { c.fillStyle = "#fef3c7"; c.fillRect(-200, 300, 400, 22); }   // a kurta's border
  if (who === "thathayya") { c.fillStyle = "#d4d4d8"; c.fillRect(-6, 30, 12, 260); [80, 150, 220].forEach((y) => { c.beginPath(); c.arc(0, y, 9, 0, 7); c.fillStyle = "#a1a1aa"; c.fill(); }); }   // kurta buttons
  if (who === "bindu") { c.fillStyle = "#fbcfe8"; c.fillRect(-200, 300, 400, 22); }
  if (who === "rani") { c.fillStyle = "#facc15"; c.fillRect(-200, 300, 400, 22); c.fillStyle = "#99f6e4"; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-60, 30); c.lineTo(190, 560); c.lineTo(110, 640); c.closePath(); c.fill(); }   // a saree's border and pallu
  if (who === "nikhil") { c.fillStyle = "#bbf7d0"; c.beginPath(); c.arc(0, 220, 54, 0, 7); c.fill(); }   // a T-shirt print
  c.restore();
  stroke(c, [[-140, 34], [-180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-150, 380]], rr: Pt[] = [[178, 230], [150, 380]];
  if (a === "up") { l = [[-200, 120], [-170, -60]]; rr = [[200, 120], [170, -60]]; }
  else if (a === "phone") rr = [[210, 150], [170, -20]];
  else if (a === "calc") l = [[-200, 200], [-120, 80]];
  else if (a === "five") rr = [[210, 40], [250, -200]];
  else if (a === "fiveL") l = [[-210, 40], [-250, -200]];
  else if (a === "pay") rr = [[170, 230], [70, 160]];   // the note held up in front of him (out to the side it went behind Nikhil)
  else if (a === "shrug") { l = [[-215, 170], [-270, 110]]; rr = [[215, 170], [270, 110]]; }
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  face(c, who, m, talk, r);
  limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r);
  limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r);
  if (a === "phone") heldPhone(c, rr[1][0] - 10, rr[1][1] - 40);
  if (a === "calc") heldCalc(c, l[1][0] + 10, l[1][1] - 50);
  if (a === "pay") {   // a note held out
    c.save(); c.translate(rr[1][0], rr[1][1] - 70); c.rotate(-0.15);
    c.fillStyle = "#86efac"; rrect(c, -110, -50, 220, 100, 10); c.fill(); c.font = SANS(58, 900); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText("₹822", 0, 20);
    c.restore();
  }
  c.restore();
};

// ---------- the set ----------
const restaurant = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#f6d7a7"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#b45309"; c.fillRect(0, 980, W, 200);   // the wood panel
  c.fillStyle = "#92400e"; c.fillRect(0, 980, W, 14);
  c.fillStyle = "#1e3a8a"; rrect(c, 760, 300, 250, 300, 10); c.fill();   // a window onto the night
  c.fillStyle = "#fde68a"; [[800, 350], [900, 420], [960, 340], [840, 520]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); });
  c.strokeStyle = "#fef3c7"; c.lineWidth = 10; c.beginPath(); c.moveTo(885, 300); c.lineTo(885, 600); c.stroke();
  c.fillStyle = "#7c2d12"; rrect(c, 90, 330, 260, 200, 10); c.fill();   // a framed picture: a biryani pot
  c.fillStyle = "#fde68a"; rrect(c, 104, 344, 232, 172, 6); c.fill();
  c.fillStyle = "#b45309"; c.beginPath(); c.ellipse(220, 450, 80, 46, 0, 0, 7); c.fill(); c.fillStyle = "#92400e"; c.fillRect(140, 400, 160, 26);
  [[300, 0], [640, 0]].forEach(([x]) => {   // hanging lamps
    c.strokeStyle = "#451a03"; c.lineWidth = 4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 170); c.stroke();
    c.fillStyle = "#78350f"; c.beginPath(); c.moveTo(x - 60, 230); c.lineTo(x - 26, 168); c.lineTo(x + 26, 168); c.lineTo(x + 60, 230); c.closePath(); c.fill();
    c.save(); c.globalAlpha = 0.25; c.fillStyle = "#fef08a"; c.beginPath(); c.ellipse(x, 260, 120, 60, 0, 0, 7); c.fill(); c.restore();
  });
};
const table = (c: Ctx, W: number, y: number, r: () => number, bill = true) => {
  c.fillStyle = "#fff7ed"; c.fillRect(0, y, W, 420);
  c.save(); c.globalAlpha = 0.28; c.fillStyle = RED;   // a checked cloth
  for (let q = 0; q < 14; q++) c.fillRect(q * 80, y, 36, 420);
  for (let q = 0; q < 6; q++) c.fillRect(0, y + q * 80, W, 36);
  c.restore();
  stroke(c, [[0, y], [W, y]], INK, 5, r, { passes: 1, alpha: 0.5 });
  c.fillStyle = "#b45309"; c.beginPath(); c.ellipse(540, y + 40, 120, 54, 0, 0, 7); c.fill();   // the biryani handi
  c.fillStyle = "#facc15"; c.beginPath(); c.ellipse(540, y + 10, 104, 30, 0, 0, 7); c.fill();
  c.fillStyle = "#92400e"; c.beginPath(); c.ellipse(540, y + 6, 40, 12, 0, 0, 7); c.fill();
  [190, 895].forEach((x) => { c.fillStyle = "#f8fafc"; c.beginPath(); c.ellipse(x, y + 70, 110, 40, 0, 0, 7); c.fill(); stroke(c, circlePts(x, y + 70, 110, 40), "#94a3b8", 3, r, { passes: 1 }); });
  if (bill) { c.fillStyle = "#111827"; c.save(); c.translate(330, y + 110); c.rotate(-0.08); rrect(c, -70, -26, 140, 60, 6); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, -60, -40, 120, 30, 4); c.fill(); c.restore(); }
};
const friends = (c: Ctx, n: number, neck: number, sc: number, talker: string, talking: boolean, r: () => number) => {
  (["arjun", "nikhil", "meghana", "sneha"] as Who[]).forEach((w) => {
    const [m, a] = MOODS[n]?.[w] ?? ["calm", "rest"];
    person(c, w, [SEATS[w] ?? 0, neck], sc, m, a, talker === w && talking, r);
  });
};
// the viewfinder over the inserts (render review: keep the documentary going through the middle): corners, REC, timecode
const viewfinder = (c: Ctx, f: number) => {
  c.save(); c.strokeStyle = "#ffffff"; c.lineWidth = 6; c.globalAlpha = 0.8;
  [[30, 290, 1, 1], [1050, 290, -1, 1], [30, 1500, 1, -1], [1050, 1500, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * 50); c.lineTo(x, y); c.lineTo(x + sx * 50, y); c.stroke();
  });
  c.restore();
  c.fillStyle = "rgba(0,0,0,0.55)"; rrect(c, 44, 1440, 150, 52, 14); c.fill(); rrect(c, 744, 1440, 292, 52, 14); c.fill();
  if (Math.floor(f / 15) % 2 === 0) { c.beginPath(); c.arc(72, 1466, 14, 0, 7); c.fillStyle = "#ef4444"; c.fill(); }
  c.font = SANS(32, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("REC", 96, 1478);
  c.font = MONO(30, 700); c.textAlign = "right"; c.fillText(timecode(f), 1024, 1477);
};
const timecode = (f: number) => { const t = 7 * 30 + f; return `00:13:${String(Math.floor(t / 30)).padStart(2, "0")}:${String(t % 30).padStart(2, "0")}`; };
// the documentary look: leaves in the foreground, a viewfinder (corners, REC, timecode), a lower third
const docFrame = (c: Ctx, W: number, H: number, f: number, title: string, sub: string, k: number, r: () => number) => {
  c.save(); c.fillStyle = "#14532d"; c.globalAlpha = 0.92;
  [[-30, 1260, 150, 260, 0.5], [60, 1420, 120, 200, 0.9], [1090, 240, 160, 250, -0.6], [1010, 160, 110, 190, -0.2], [-20, 220, 110, 200, 0.3]].forEach(([x, y, rx, ry, rot]) => {
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill();
  });
  c.restore();
  c.save(); c.strokeStyle = "#ffffff"; c.lineWidth = 7; c.globalAlpha = 0.85;
  [[70, 310, 1, 1], [1010, 310, -1, 1], [70, 1460, 1, -1], [1010, 1460, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * 70); c.lineTo(x, y); c.lineTo(x + sx * 70, y); c.stroke();
  });
  c.restore();
  c.fillStyle = "rgba(0,0,0,0.55)"; rrect(c, 96, 336, 156, 58, 14); c.fill(); rrect(c, 700, 336, 300, 58, 14); c.fill();
  if (Math.floor(f / 15) % 2 === 0) { c.beginPath(); c.arc(126, 365, 15, 0, 7); c.fillStyle = "#ef4444"; c.fill(); }
  c.font = SANS(34, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("REC", 152, 377);
  c.font = MONO(32, 700); c.textAlign = "right"; c.fillText(timecode(f), 984, 376);
  lowerThird(c, title, sub, k, r);
};
const lowerThird = (c: Ctx, title: string, sub: string, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(-40 * (1 - easeOut(k)), 0);
  c.fillStyle = "rgba(10,20,12,0.82)"; rrect(c, 40, 1290, 820, sub ? 160 : 110, 14); c.fill();
  c.fillStyle = "#84cc16"; c.beginPath(); c.ellipse(100, 1345, 22, 38, 0.6, 0, 7); c.fill();   // a leaf
  stroke(c, [[84, 1372], [116, 1318]], "#365314", 4, r, { passes: 1 });
  c.font = SERIF(56); c.fillStyle = "#f7fee7"; c.textAlign = "left"; c.fillText(title, 150, 1366);
  if (sub) { c.font = SERIF(38, 400); c.fillStyle = "#d9f99d"; c.fillText(sub, 150, 1424); }
  c.restore();
};
// the AI chat card of frame 1 (and of the last frame: the loop)
const guessCard = (c: Ctx, k: number, pop: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(285, 540); c.rotate(-0.04); c.scale(1 + 0.08 * pop, 1 + 0.08 * pop);
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -222, -232, 460, 480, 34); c.fill();
  c.fillStyle = "#111827"; rrect(c, -232, -244, 460, 480, 34); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, -214, -226, 424, 444, 22); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, -214, -226, 424, 70, 22); c.fill(); c.fillRect(-214, -186, 424, 30);
  c.font = SANS(36); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", -186, -178);
  c.font = SANS(34, 900); c.fillStyle = "#4338ca"; c.textAlign = "center"; c.fillText("tiny offline AI", 0, -112);   // render review: which AI? (24 px in the header went unread)
  c.fillStyle = "#e5e7eb"; rrect(c, -190, -84, 380, 236, 26); c.fill();
  c.font = SANS(104, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("₹1,059", 0, 30);
  c.font = SANS(60, 800); c.fillText("each", 0, 112);
  c.restore();
};
const calcCard = (c: Ctx, x: number, y: number, s: number, val: string, rot = 0.04) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -200, -232, 420, 480, 34); c.fill();
  c.fillStyle = "#334155"; rrect(c, -210, -244, 420, 480, 34); c.fill();
  c.fillStyle = "#bbf7d0"; rrect(c, -180, -214, 360, 120, 14); c.fill();
  let fs = 96; c.font = MONO(fs, 800); while (c.measureText(val).width > 330 && fs > 40) { fs -= 4; c.font = MONO(fs, 800); }
  c.fillStyle = "#052e16"; c.textAlign = "right"; c.fillText(val, 166, -120);
  const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "=", "+"];
  keys.forEach((t, q) => {
    const kx = -176 + (q % 4) * 90, ky = -70 + Math.floor(q / 4) * 72;
    c.fillStyle = q % 4 === 3 || t === "=" ? "#f59e0b" : "#e2e8f0"; rrect(c, kx, ky, 78, 60, 12); c.fill();
    c.font = SANS(36, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, kx + 39, ky + 44);
  });
  c.restore();
};
// Arjun's phone (screen space): the chat
const PH = { x: 140, y: 300, w: 800, h: 1130 };
const phoneFrame = (c: Ctx) => {
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, PH.x + 12, PH.y + 14, PH.w, PH.h, 60); c.fill();
  c.fillStyle = "#111827"; rrect(c, PH.x, PH.y, PH.w, PH.h, 60); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, PH.x + 22, PH.y + 22, PH.w - 44, PH.h - 44, 42); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, PH.x + 22, PH.y + 22, PH.w - 44, 110, 42); c.fill(); c.fillRect(PH.x + 22, PH.y + 90, PH.w - 44, 42);
  c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", PH.x + 70, PH.y + 100);
  c.font = SANS(38, 800); c.fillStyle = "#e0e7ff"; c.textAlign = "right"; c.fillText("tiny offline AI", PH.x + PH.w - 60, PH.y + 100);
};
const userBubble = (c: Ctx, text: string, y: number, typed = 1, hl = "") => {
  c.font = SANS(40, 600);
  const shown = text.slice(0, Math.round(text.length * typed));
  const ls = wrap(c, shown || " ", 560);
  const h = ls.length * 54 + 40, x1 = PH.x + PH.w - 50;
  c.fillStyle = BLUE; rrect(c, x1 - 610, y, 610, h, 30); c.fill();
  ls.forEach((t, q) => {
    const yy = y + 58 + q * 54;
    if (hl && t.includes(hl.split(" ")[0]) && q === ls.length - 1) {   // highlight the last words ("Just the amount.")
      const i = t.indexOf(hl.split(" ")[0]); const pre = c.measureText(t.slice(0, i)).width, w = c.measureText(t.slice(i)).width;
      c.fillStyle = "#fde047"; c.fillRect(x1 - 590 + pre - 4, yy - 40, w + 8, 52);
      c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(t.slice(0, i), x1 - 590, yy); c.fillStyle = INK; c.fillText(t.slice(i), x1 - 590 + pre, yy);
    } else { c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(t, x1 - 590, yy); }
  });
  return y + h;
};
const tagS = (c: Ctx, t: string, x: number, y: number, s: number, bg: string, fg: string, k: number, rot = 0) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); c.scale(1 + 0.3 * (1 - easeOut(k)), 1 + 0.3 * (1 - easeOut(k)));
  c.font = SANS(s); const w = c.measureText(t).width;
  c.fillStyle = bg; rrect(c, -w / 2 - 26, -s * 0.95, w + 52, s * 1.4, 18); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, 0, s * 0.05); c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.88)"; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.fill();
  c.strokeStyle = col; c.lineWidth = 12; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
const tick = (c: Ctx, x: number, y: number, k: number, r: () => number) => {
  if (k <= 0) return;
  stroke(c, [[x - 22, y - 4], [x - 6, y + 14], [x + 26, y - 26]].slice(0, k > 0.5 ? 3 : 2) as Pt[], GREEN, 10, r, { passes: 2 });
};
const ruleChip = (c: Ctx, W: number, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(W / 2, y + 60 * (1 - easeOut(k)));
  c.fillStyle = "rgba(15,23,42,0.95)"; rrect(c, -500, -120, 1000, 430, 30); c.fill();
  c.font = SANS(50, 900); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("MONEY MATHS WITH AI", 0, -34);
  c.fillStyle = "#fef3c7"; rrect(c, -460, 10, 920, 120, 22); c.fill();
  c.font = SANS(40, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText("1. Type: \"Show the working", -430, 60); c.fillText("    step by step.\"", -430, 110);
  c.fillStyle = "#dcfce7"; rrect(c, -460, 150, 920, 120, 22); c.fill();
  c.fillStyle = "#14532d"; c.fillText("2. Check each line", -430, 200); c.fillText("    on a calculator ✓", -430, 250);
  c.restore();
};

// ---------- the scene ----------
const StBill: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  const beds: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (i > 0 && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("p")} at={1} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "doc" || b.prop === "pay") {   // the documentary: birds and insects under the narrator, a camera click
      sfx.push(<Sfx key={k("c")} at={at - 4} src="audio/sfx_snap.wav" vol={0.3} />);
      beds.push(<Sequence key={k("j")} from={Math.max(0, at - 6)} durationInFrames={nx - at + 6} layout="none">
        <Audio src={staticFile(JUNGLE)} volume={(fr) => (te ? 0.1 : 0.22) * clamp(fr / 8) * clamp((nx - at + 6 - fr) / 8)} />
      </Sequence>);
    }
    if (b.prop === "ask") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 2} src="audio/gag_ding.wav" vol={0.16} />);
    if (b.prop === "guess") sfx.push(<Sfx key={k("n")} at={end + 1} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.55} />, <Sfx key={k("z")} at={end + 2} src="reel/sfx_buzz.wav" vol={0.2} />);   // after "It guesses", in the gap
    if (b.prop === "test") {   // a pop on each amount; the bed is out before "Not one right"; the hit after it
      const c1 = cue(i, 1, 0.6);
      GUESSES.forEach((_, q) => sfx.push(<Sfx key={k("p" + q)} at={popAt(l.from, c1, q)} src="audio/sfx_pop.wav" vol={0.14} />));
      const c2 = cue(i, 2, 0.8);   // render review: a dead stop (the bed out, 0.6 s of silence), then a thud just before the words
      sfx.push(<Sfx key={k("n")} at={c2 - 8} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.55} />, <Sfx key={k("z")} at={end + 2} src="reel/sfx_buzz.wav" vol={0.25} />);
    }
    if (b.prop === "type") [0, 1, 2, 3, 4, 5, 6, 7].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * Math.round(l.frames * 0.7 / 8)} src="audio/sfx_tick.wav" vol={0.12} />));
    if (b.prop === "working") {   // after the bed's drop, a thud before "nine" (Telugu: it buried "పదిలో"); the sting after the line
      if (!te) sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.6) - 3} src="reel/sfx_boom.wav" vol={0.55} />);
      sfx.push(<Sfx key={k("s")} at={end + 1} src="audio/sfx_success.wav" vol={0.6} />, <Sfx key={k("c")} at={end + 2} src={CLAP} vol={0.35} />);   // render review 2: nothing stood out at "nine"
    }
    if (b.prop === "rule") {
      const c1 = cue(i, 1, 0.35);
      STEPS.forEach((_, q) => sfx.push(<Sfx key={k("t" + q)} at={tickAt(c1, end, q)} src="audio/sfx_tick.wav" vol={te ? 0.1 : 0.3} />));   // Telugu: the ticks made "చెక్ చేస్తా" sound like "chek chekh chestaa"
      sfx.push(<Sfx key={k("h")} at={l.from + l.frames + 2} src="reel/sfx_boom.wav" vol={0.4} />);   // after her last word (at the card it landed on "చేస్తా")
    }
    if (b.prop === "pay") sfx.push(<Sfx key={k("v")} at={end + 1} src={WAH} vol={0.4} />);
    if (b.prop === "loop") {   // a rise into the last line; the bill lands; his phone's guess flashes, the glitch back to frame 1
      if (!te) sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 32)} src="reel/sfx_riser.wav" vol={0.35} />);   // Telugu: the riser and the ding hid "ఐస్ క్రీమ్ బిల్లు"
      sfx.push(<Sfx key={k("d")} at={te ? at - 8 : at + 6} src="audio/gag_ding.wav" vol={0.18} />,
        <Sfx key={k("o")} at={end + 1} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("g")} at={s.frames - 10} src="reel/sfx_glitch.wav" vol={0.35} />);
    }
  });
  return (
    <>
      {sfx}
      {beds}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4300 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        if (b.shot === "hook") {
          // ---------- frame 1: the AI's ₹1,059 vs the calculator's 822.07 ----------
          restaurant(c, W, H);
          friends(c, n, 1000, 0.6, b.who, talking, r);
          table(c, W, 1170, r);
          guessCard(c, 1, 0);
          calcCard(c, 800, 540, 1, "822.07");
          stroke(c, [[400, 785], [300, 870]], "#4338ca", 8, r, { passes: 2 });   // whose is whose
          stroke(c, [[830, 785], [880, 870]], "#334155", 8, r, { passes: 2 });
          lowerThird(c, "WILD HYDERABAD", "", 1, r);
        } else if (b.shot === "doc") {
          // ---------- the documentary: through the leaves, a slow push-in ----------
          const z = 1 + 0.09 * clamp((f - ln.from) / Math.max(1, next - ln.from));
          c.save(); c.translate(W / 2, 1000); c.scale(z, z); c.translate(-W / 2, -1000);
          restaurant(c, W, H);
          friends(c, n, 1010, 0.58, b.who, talking, r);
          table(c, W, 1170, r);
          c.restore();
          const pay = b.prop === "pay";
          docFrame(c, W, H, f + ((s as any).from ?? 0), pay ? "THE YOUNG MALE" : "WILD HYDERABAD", pay ? "paid ₹822.07 · accepts defeat" : "four friends · one bill",
            pay ? seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6) : seg(f, ln.from + 2, ln.from + 10), r);
        } else if (b.shot === "phone") {
          // ---------- Arjun's phone: the chat ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          phoneFrame(c);
          if (b.prop === "type") {   // Sneha's line: he types the working line
            const y1 = userBubble(c, ASK, PH.y + 170, 1);
            c.fillStyle = "#e5e7eb"; rrect(c, PH.x + 50, y1 + 30, 440, 130, 28); c.fill();
            c.font = SANS(62, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("₹1,059 each", PH.x + 76, y1 + 118);
            stamp(c, "A GUESS", PH.x + 620, y1 + 96, 44, RED, 1, -0.1);
            const ty = seg(f, ln.from + 2, ln.from + Math.round(ln.frames * 0.8));
            c.fillStyle = "#e2e8f0"; rrect(c, PH.x + 50, PH.y + PH.h - 190, PH.w - 100, 110, 30); c.fill();
            c.font = SANS(40, 600); c.fillStyle = INK; c.textAlign = "left";
            const shown = SHOWW.slice(0, Math.round(SHOWW.length * ty));
            c.fillText(shown + (Math.floor(f / 8) % 2 ? "▍" : ""), PH.x + 80, PH.y + PH.h - 120);
            if (f > endL - 4) {   // sent; the AI is typing
              userBubble(c, SHOWW, y1 + 230, 1);
              c.fillStyle = "#e5e7eb"; rrect(c, PH.x + 50, y1 + 380, 200, 90, 28); c.fill();
              [0, 1, 2].forEach((q) => { c.beginPath(); c.arc(PH.x + 100 + q * 50, y1 + 425 - (Math.floor(f / 6) % 3 === q ? 10 : 0), 12, 0, 7); c.fillStyle = "#64748b"; c.fill(); });
            }
          } else {
            const hl = b.prop === "ask" && f >= cu(1, 0.5) - 2;
            const y1 = userBubble(c, ASK, PH.y + 170, 1, hl ? "Just the amount." : "");
            c.save(); c.globalAlpha = b.prop === "ask" ? seg(f, ln.from + 6, ln.from + 12) : 1;
            c.fillStyle = "#e5e7eb"; rrect(c, PH.x + 50, y1 + 30, 520, 210, 28); c.fill();
            c.font = SANS(100, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("₹1,059", PH.x + 86, y1 + 150);
            c.font = SANS(50, 800); c.fillText("each", PH.x + 86, y1 + 212);
            c.restore();
            if (b.prop === "guess") {
              tagS(c, "replied in 1 second · no working", W / 2, y1 + 330, 40, "#fef3c7", INK, seg(f, ln.from + 4, ln.from + 10));
              tagS(c, "4 × ₹1,059 = ₹4,236 for a ₹3,288 bill", W / 2, y1 + 450, 44, "#fee2e2", "#991b1b", seg(f, ln.from + 30, ln.from + 36));   // render review 2: the overpay
              stamp(c, "A GUESS", PH.x + 600, y1 + 130, 56, RED, seg(f, endL - 1, endL + 5), -0.14);
            }
          }
          viewfinder(c, f + ((s as any).from ?? 0));
        } else if (b.shot === "test") {
          // ---------- our test: "just the amount", 10 times ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(60, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST", W / 2, 350);
          c.font = SANS(38, 700); c.fillStyle = "#e2e8f0";
          c.fillText("a tiny AI (Qwen 3B) · a laptop · no internet", W / 2, 420);
          c.fillText("\"just the amount\" · the same bill · 10 times", W / 2, 472);
          const c1 = cu(1, 0.6), c2 = cu(2, 0.8);
          GUESSES.forEach((g, q) => {
            const kq = seg(f, popAt(ln.from, c1, q), popAt(ln.from, c1, q) + 5);
            if (kq <= 0) return;
            const x = q % 2 ? 770 : 310, y = 540 + Math.floor(q / 2) * 104;
            c.save(); c.globalAlpha = clamp(kq * 3); c.translate(x, y); const z = 1.3 - 0.3 * easeOut(kq); c.scale(z, z);
            c.fillStyle = "#fee2e2"; rrect(c, -210, -8, 420, 88, 18); c.fill();
            c.font = SANS(56, 900); c.fillStyle = "#991b1b"; c.textAlign = "center"; c.fillText("₹" + g, 0, 58);
            c.restore();
          });
          stamp(c, "0 of 10 RIGHT", W / 2, 1146, 100, RED, seg(f, c2 - 2, c2 + 4), -0.06);
          tagS(c, "right answer: ₹822.07", W / 2, 1266, 54, "#dcfce7", "#14532d", seg(f, c2 + 6, c2 + 12));
          c.save(); c.globalAlpha = seg(f, c2 + 8, c2 + 14);   // render review: grey 36 px for ~1 s went unread
          c.font = SANS(42, 800); c.fillStyle = "#ffffff"; c.textAlign = "center"; c.fillText("Big apps usually do better (not tested here).", W / 2, 1350);
          c.fillStyle = "#fde68a"; c.fillText("This habit helps on any app:", W / 2, 1404);
          c.restore();
          viewfinder(c, f + ((s as any).from ?? 0));
        } else if (b.shot === "working" || b.shot === "check") {
          // ---------- made to show its working; then the calculator checks each line on the same card ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          phoneFrame(c);
          const chk = b.shot === "check";
          const y1 = userBubble(c, SHOWW, PH.y + 160, 1);
          c.font = SANS(30, 700); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("its reply, shortened (try 3 of 10)", PH.x + 60, y1 + 40);
          c.fillStyle = "#e5e7eb"; rrect(c, PH.x + 40, y1 + 54, PH.w - 80, 560, 28); c.fill();
          const c1 = cu(1, chk ? 0.35 : 0.6);
          let lit = -1;
          STEPS.forEach(([a, v], q) => {
            const kq = chk ? 1 : seg(f, ln.from + 4 + q * 10, ln.from + 10 + q * 10);
            if (kq <= 0) return;
            const yy = y1 + 118 + q * 86;
            c.save(); c.globalAlpha = kq;
            c.font = MONO(34, 700); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`${q + 1}. ${a}`, PH.x + 70, yy);
            c.font = MONO(34, 800); c.fillStyle = "#1e40af"; c.fillText(`= ${v}`, PH.x + 120, yy + 40);
            c.restore();
            if (chk) { const kt = seg(f, tickAt(c1, endL, q), tickAt(c1, endL, q) + 6); if (kt > 0) { tick(c, PH.x + 400, yy + 30, kt, r); lit = q; } }   // after the value
          });
          const kf = chk ? 1 : seg(f, ln.from + 56, ln.from + 62);
          if (kf > 0) { c.save(); c.globalAlpha = kf; c.font = SANS(52, 900); c.fillStyle = GREEN; c.textAlign = "left"; c.fillText("Each pays ₹822.07", PH.x + 70, y1 + 574); c.restore(); }
          if (!chk) {
            stamp(c, "9 of 10 RIGHT", W / 2, PH.y + PH.h - 130, 80, GREEN, seg(f, c1 - 2, c1 + 4), -0.05);
            tagS(c, "slower: ~50 s, not 1 s", W / 2, PH.y + PH.h - 34, 46, "#fef3c7", INK, seg(f, c1 + 8, c1 + 14));   // render review 2: 34 px was too small
          } else {
            calcCard(c, 862, y1 + 420, 0.5, lit >= 0 ? STEPS[lit][1] : "0", 0.05);   // Sneha's calculator beside the steps
            ruleChip(c, W, 520, seg(f, ruleAt(ln), ruleAt(ln) + 8));   // over the lines already ticked
          }
          viewfinder(c, f + ((s as any).from ?? 0));
        } else if (b.shot === "loop") {
          // ---------- the dessert bill; his phone's guess again: frame 1 ----------
          restaurant(c, W, H);
          friends(c, n, 1000, 0.6, b.who, talking, r);
          table(c, W, 1170, r, false);
          const kb = easeOut(seg(f, ln.from - 6, ln.from + 10));   // the waiter's hand brings the dessert bill
          c.save(); c.translate(1300 - 640 * kb, 1222);
          c.fillStyle = "#f8fafc"; rrect(c, 140, -40, 400, 90, 30); c.fill(); c.fillStyle = INK; c.fillRect(140, -40, 40, 90);
          palm(c, 120, 0, "#8d5a3b", r, 34);
          c.fillStyle = "#111827"; c.save(); c.rotate(-0.06); rrect(c, -150, -60, 230, 120, 8); c.fill();
          c.font = SANS(30, 800); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("ICE CREAM", -35, -12); c.font = SANS(40, 900); c.fillText("₹480", -35, 36);
          c.restore(); c.restore();
          const kc = seg(f, endL - 6, endL + 2);   // his phone's guess flashes: the card of frame 1
          if (kc > 0) {
            c.save(); c.globalAlpha = 0.5 * (1 - seg(f, endL + 2, endL + 10)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore();
            guessCard(c, kc, 1 - clamp((f - endL) / 10));
            lowerThird(c, "WILD HYDERABAD", "", kc, r);
          }
        }
      }} />
    </>
  );
};
// the ten amounts pop in from ~25% of the line to just before "Ten answers"
const popAt = (from: number, c1: number, q: number) => Math.round(from + (c1 - from) * (0.2 + 0.07 * q));
// the ticks: one a line, from "I check" to near the end of the line
const tickAt = (c1: number, end: number, q: number) => Math.round(c1 + (end - c1) * (0.05 + 0.13 * q));
const ruleAt = (l: Line) => l.from + l.frames - 2;   // render review 2: on its own after her line (it came in under it)

export const BILL_SCENES = { sk_bill: StBill };
