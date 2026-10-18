import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx, robot } from "./DistillCrayon";
import { INK, caveat, handF, label, stamp } from "./WordsCrayon";

// Skit 02 "The call in my own voice" (series/scripts/skit02_code_word.md): a living room in the evening, Amma and her son
// Chinnu on the sofa, a scam call on speaker in Chinnu's cloned voice. One wide sitcom frame with push-ins on the reactions
// (not skit 01's shot/reverse-shot); the call screen sits at the top in screen space, so "Unknown number" reads without
// sound. Each beat (s.data.beats, one per line) sets the poses and brings its prop. World coordinates = the wide shot.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "amma" | "chinnu" | "caller"; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SKIN_A = "#a8693f", SKIN_C = "#bb7b4f", HAIR = "#17110d", SAREE = "#15803d", ZARI = "#facc15", TEE = "#f59e0b";
const WALL = "#d6ebe3", SOFA = "#28466f", FLOOR = "#c49a6c", UI = "#0f172a", SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const AM: Pt = [330, 770], CH: Pt = [760, 780];   // necks
const S = 0.85;                                     // character scale

type Mood = "worried" | "sus" | "shock" | "stern" | "whisper" | "puzzled" | "sweet" | "smug" | "happy" | "chew" | "panic" | "explain";
type Pose = "phone" | "tap" | "mouth" | "rest" | "ear" | "bite" | "plate" | "point" | "open" | "shh" | "thumb";
// [mood, arms, look] per line; look: where the eyes point (-1 left, 0 ahead, 1 right, 2 down at the phone/plate)
const AMMA: Record<number, [Mood, Pose, number]> = {
  1: ["worried", "phone", 2], 2: ["sus", "phone", 1], 3: ["shock", "phone", 2], 4: ["stern", "tap", 2], 5: ["stern", "phone", 2],
  6: ["whisper", "mouth", 1], 7: ["shock", "phone", 1], 8: ["worried", "phone", 1], 9: ["puzzled", "phone", 1], 10: ["puzzled", "phone", 1],
  11: ["sus", "phone", 1], 12: ["sweet", "tap", 2], 13: ["sus", "phone", 2], 14: ["stern", "tap", 0], 15: ["happy", "rest", 1],
  16: ["worried", "rest", 1], 17: ["happy", "rest", 1], 18: ["smug", "ear", 0],
};
const CHINNU: Record<number, [Mood, Pose, number]> = {
  1: ["chew", "bite", 2], 2: ["shock", "bite", -1], 3: ["shock", "plate", -1], 4: ["panic", "point", -1], 5: ["shock", "plate", -1],
  6: ["worried", "plate", -1], 7: ["explain", "open", -1], 8: ["explain", "plate", -1], 9: ["explain", "open", -1], 10: ["sus", "plate", -1],
  11: ["whisper", "shh", -1], 12: ["worried", "plate", -1], 13: ["smug", "plate", -1], 14: ["happy", "thumb", -1], 15: ["explain", "open", -1],
  16: ["explain", "plate", -1], 17: ["explain", "open", -1], 18: ["happy", "plate", -1],
};
// camera per line: "wide", "both", "amma", "chinnu" (push-ins around a face), "insert" (the reels -> voice copy cutaway)
const SHOT: Record<number, string> = {
  1: "wide", 2: "both", 3: "wide", 4: "both", 5: "wide", 6: "amma", 7: "insert", 8: "amma", 9: "chinnu", 10: "amma", 11: "chinnu",
  12: "amma", 13: "both", 14: "amma", 15: "chinnu", 16: "amma", 17: "both", 18: "wide",
};
const CAM: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1, x: 540, y: 960 }, both: { z: 1.18, x: 545, y: 850 }, amma: { z: 1.55, x: AM[0], y: 790 }, chinnu: { z: 1.55, x: CH[0], y: 800 },   // faces clear of the call card
};

// ---------- the room ----------
const room = (c: Ctx, r: () => number, day: boolean) => {
  c.fillStyle = WALL; c.fillRect(-600, -200, 2300, 1400);
  hatch(c, [-400, 0, 1500, 1180], ["#c4e0d6", "#e6f4ee"], r, { gap: 16, w: 3, alpha: 0.35 });
  // the window between them: evening (or the next morning)
  c.fillStyle = "#7a4a26"; rrect(c, 430, 500, 230, 250, 10); c.fill();
  const g = c.createLinearGradient(0, 512, 0, 738);
  if (day) { g.addColorStop(0, "#7dd3fc"); g.addColorStop(1, "#e0f2fe"); } else { g.addColorStop(0, "#4c1d95"); g.addColorStop(1, "#fb923c"); }
  c.fillStyle = g; rrect(c, 444, 514, 202, 222, 6); c.fill();
  if (day) { c.beginPath(); c.arc(600, 560, 26, 0, 7); c.fillStyle = "#fde047"; c.fill(); }
  else { c.beginPath(); c.arc(600, 560, 20, 0, 7); c.fillStyle = "#fef3c7"; c.fill(); c.beginPath(); c.arc(610, 553, 18, 0, 7); c.fillStyle = "#5b21b6"; c.fill(); }
  c.fillStyle = "#7a4a26"; c.fillRect(540, 514, 10, 222); c.fillRect(444, 620, 202, 10);
  // curtains
  c.fillStyle = "#e11d48"; c.beginPath(); c.moveTo(420, 490); c.quadraticCurveTo(450, 640, 418, 780); c.lineTo(400, 780); c.lineTo(400, 490); c.fill();
  c.beginPath(); c.moveTo(670, 490); c.quadraticCurveTo(640, 640, 672, 780); c.lineTo(690, 780); c.lineTo(690, 490); c.fill();
  // the family photo (left) and the clock (right)
  c.fillStyle = "#92400e"; rrect(c, 40, 520, 170, 140, 8); c.fill(); c.fillStyle = "#fef9c3"; c.fillRect(54, 534, 142, 112);
  [[95, 600, 22, SAREE], [150, 606, 18, TEE]].forEach(([x, y, rad, col]) => {
    c.beginPath(); c.arc(x as number, (y as number) - 28, (rad as number) * 0.7, 0, 7); c.fillStyle = SKIN_A; c.fill();
    c.fillStyle = col as string; c.fillRect((x as number) - (rad as number), (y as number) - 12, (rad as number) * 2, 40);
  });
  c.beginPath(); c.arc(985, 590, 56, 0, 7); c.fillStyle = "#fff"; c.fill();
  stroke(c, circlePts(985, 590, 56, 56), INK, 5, r, { passes: 2 });
  stroke(c, [[985, 590], [985 + (day ? 30 : -24), 590 + (day ? -8 : -28)]], INK, 6, r, { passes: 1 });
  stroke(c, [[985, 590], [985 + (day ? -4 : 38), 590 + (day ? -40 : 12)]], INK, 4, r, { passes: 1 });
  // floor and the sofa
  c.fillStyle = FLOOR; c.fillRect(-600, 1180, 2300, 900);
  hatch(c, [-400, 1185, 1500, 1920], ["#a87d52", "#d8b48a"], r, { angle: 0.02, gap: 30, w: 4, alpha: 0.35 });
  c.fillStyle = SOFA; rrect(c, 90, 830, 900, 260, 60); c.fill();
  hatch(c, [100, 840, 980, 1080], ["#1e3a5f", "#35588a"], r, { angle: -0.6, gap: 22, w: 3, alpha: 0.4 });
};
const sofaFront = (c: Ctx, r: () => number) => {
  c.fillStyle = "#33598c"; rrect(c, 110, 1060, 860, 110, 30); c.fill();
  c.fillStyle = SOFA; rrect(c, 60, 940, 90, 240, 36); c.fill(); rrect(c, 930, 940, 90, 240, 36); c.fill();
  stroke(c, [[130, 1168], [950, 1168]], INK, 5, r, { passes: 2, alpha: 0.5 });
  // the coffee table with a steel tumbler and the chutney bowl
  c.fillStyle = "#8b5a2b"; rrect(c, 230, 1240, 620, 46, 10); c.fill();
  c.fillStyle = "#6b4423"; c.fillRect(260, 1286, 26, 90); c.fillRect(794, 1286, 26, 90);
  c.fillStyle = "#cbd5e1"; rrect(c, 330, 1180, 46, 62, 6); c.fill();
  c.beginPath(); c.ellipse(700, 1232, 56, 16, 0, 0, 7); c.fillStyle = "#e2e8f0"; c.fill();
  c.beginPath(); c.ellipse(700, 1226, 40, 9, 0, 0, 7); c.fillStyle = "#f8fafc"; c.fill();
};

// ---------- people ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number) => {
  stroke(c, pts, col, 40, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, extra?: "point" | "thumb" | "shh") => {
  c.beginPath(); c.arc(x, y, 24, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, 24, 24), INK, 3, r, { passes: 1, alpha: 0.6 });
  if (extra === "point") stroke(c, [[x, y], [x + 40, y - 18]], skin, 14, r, { passes: 2 });
  if (extra === "thumb") stroke(c, [[x, y - 14], [x + 2, y - 50]], skin, 14, r, { passes: 2 });
  if (extra === "shh") stroke(c, [[x, y - 10], [x, y - 54]], skin, 14, r, { passes: 2 });
};
const phoneProp = (c: Ctx, x: number, y: number, rot: number, glow: boolean) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "#111827"; rrect(c, -30, -52, 60, 104, 10); c.fill();
  c.fillStyle = glow ? "#38bdf8" : "#334155"; rrect(c, -24, -44, 48, 86, 6); c.fill();
  c.restore();
};
const plate = (c: Ctx, x: number, y: number, bitten: boolean) => {
  c.save(); c.translate(x, y); c.scale(1.3, 1.3); c.translate(-x, -y);   // big enough to read as dosa on a phone
  c.beginPath(); c.ellipse(x, y, 84, 22, 0, 0, 7); c.fillStyle = "#cbd5e1"; c.fill();
  c.beginPath(); c.ellipse(x, y - 4, 70, 15, 0, 0, 7); c.fillStyle = "#e2e8f0"; c.fill();
  // a folded dosa
  c.beginPath(); c.moveTo(x - 66, y - 6); c.quadraticCurveTo(x, y - 46, x + 66, y - 6); c.closePath(); c.fillStyle = "#d97706"; c.fill();
  c.beginPath(); c.moveTo(x - 58, y - 8); c.quadraticCurveTo(x, y - 36, x + 58, y - 8); c.closePath(); c.fillStyle = "#f59e0b"; c.fill();
  if (bitten) { c.beginPath(); c.arc(x + 58, y - 14, 14, 0, 7); c.fillStyle = "#e2e8f0"; c.fill(); }
  c.restore();
};

const head = (c: Ctx, who: "amma" | "chinnu", m: Mood, talk: boolean, look: number, r: () => number, f: number) => {
  const skin = who === "amma" ? SKIN_A : SKIN_C, hy = -135;
  const tilt = look === 1 ? 0.08 : look === -1 ? -0.08 : 0;
  c.save(); c.rotate(tilt);
  if (who === "amma") {   // the bun behind the head
    c.beginPath(); c.arc(0, hy - 112, 46, 0, 7); c.fillStyle = HAIR; c.fill();
    c.beginPath(); c.arc(-14, hy - 120, 8, 0, 7); c.fillStyle = "#e5e7eb"; c.fill();   // a jasmine bud
    c.beginPath(); c.arc(6, hy - 128, 8, 0, 7); c.fill();
  }
  [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 98, hy + 5, 17, 26, 0, 0, 7); c.fillStyle = skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 100, 116, 0, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(0, hy, 100, 116), INK, 4, r, { passes: 2, alpha: 0.6 });
  if (who === "amma") {   // hair parted in the middle, a grey streak, earrings and a bindi
    c.beginPath(); c.ellipse(0, hy - 60, 104, 66, 0, Math.PI, 0); c.lineTo(100, hy - 20); c.quadraticCurveTo(60, hy - 70, 0, hy - 70); c.quadraticCurveTo(-60, hy - 70, -100, hy - 20); c.closePath();
    c.fillStyle = HAIR; c.fill();
    stroke(c, [[-6, hy - 124], [-30, hy - 76]], "#9ca3af", 6, r, { passes: 1 });
    [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 100, hy + 40, 9, 0, 7); c.fillStyle = ZARI; c.fill(); });
    c.beginPath(); c.arc(0, hy - 44, 9, 0, 7); c.fillStyle = "#dc2626"; c.fill();
  } else {   // messy hair
    c.beginPath(); c.ellipse(0, hy - 64, 106, 64, 0, Math.PI, 0); c.closePath(); c.fillStyle = HAIR; c.fill();
    for (let k = 0; k < 7; k++) {
      const x = -84 + k * 28;
      c.beginPath(); c.moveTo(x - 16, hy - 92); c.lineTo(x + 6, hy - 150 + (k % 2) * 16); c.lineTo(x + 20, hy - 92); c.fill();
    }
    c.fillRect(-100, hy - 70, 200, 20);
  }
  // brows
  const brow = (sx: number) => {
    let yi = -170, yo = -170;
    if (m === "stern" || m === "sus" || m === "panic") { yi = -156; yo = -178; }
    if (m === "shock" || m === "puzzled" || m === "sweet") { yi = -188; yo = -184; }
    if (m === "worried") { yi = -184; yo = -164; }
    if (m === "puzzled" && sx > 0) { yi = -172; yo = -168; }
    if (m === "smug" && sx < 0) { yi = -178; yo = -176; }
    stroke(c, [[sx * 16, hy + (yi + 135)], [sx * 66, hy + (yo + 135)]], HAIR, who === "amma" ? 9 : 12, r, { passes: 2 });
  };
  brow(-1); brow(1);
  // eyes, looking where the beat says
  const lx = look === 1 ? 7 : look === -1 ? -7 : 0, ly = look === 2 ? 6 : 0;
  [-38, 38].forEach((ex) => {
    const ey = hy - 2;
    if (m === "shock" || m === "panic") {
      c.beginPath(); c.ellipse(ex, ey, 19, 21, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex + lx, ey + 2 + ly, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "sus" || m === "smug" || m === "stern") {
      stroke(c, [[ex - 16, ey - (m === "stern" ? 4 : 0)], [ex + 16, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 2 + lx, ey + 5 + ly, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "sweet") {
      stroke(c, circlePts(ex, ey + 6, 15, 12, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else {
      c.beginPath(); c.arc(ex + lx, ey + ly, 9, 0, 7); c.fillStyle = INK; c.fill();
    }
  });
  stroke(c, [[2, hy + 8], [12, hy + 34], [-6, hy + 40]], who === "amma" ? "#7c4422" : "#8a4f2c", 6, r, { passes: 2 });
  // mouth
  const my = hy + 74;
  const chewing = m === "chew" && Math.floor(f / 5) % 2 === 0;
  if (talk || m === "shock" || m === "panic") {
    const w = m === "panic" ? 30 : talk ? 21 : 15, h = m === "panic" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "chew") {
    c.beginPath(); c.ellipse(0, my, chewing ? 18 : 14, chewing ? 8 : 5, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
    c.beginPath(); c.arc(46, my - 12, 13, 0, 7); c.fillStyle = skin; c.fill();   // a full cheek
  } else if (m === "smug") {
    stroke(c, [[-22, my + 2], [6, my + 2], [24, my - 10]], INK, 6, r, { passes: 2 });
  } else if (m === "happy" || m === "sweet" || m === "explain") {
    stroke(c, circlePts(0, my - 8, 26, 14, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "worried" || m === "stern") {
    stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  } else if (m === "whisper") {
    c.beginPath(); c.ellipse(0, my, 10, 7, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else {
    stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  }
  if (m === "panic" || m === "worried" || m === "shock") {   // a sweat drop
    c.beginPath(); c.moveTo(92, hy - 70); c.quadraticCurveTo(112, hy - 40, 92, hy - 30); c.quadraticCurveTo(76, hy - 40, 92, hy - 70); c.fillStyle = "#7dd3fc"; c.fill();
  }
  c.restore();
};

const person = (c: Ctx, who: "amma" | "chinnu", m: Mood, pose: Pose, look: number, talk: boolean, p: number, f: number, r: () => number, o: { bite?: boolean; glow?: boolean } = {}) => {
  const [nx, ny] = who === "amma" ? AM : CH;
  const skin = who === "amma" ? SKIN_A : SKIN_C, cloth = who === "amma" ? SAREE : TEE;
  c.save(); c.translate(nx, ny); c.scale(S, S);
  // a seated torso
  c.beginPath(); c.moveTo(-150, 35); c.quadraticCurveTo(0, 5, 150, 35); c.lineTo(175, 380); c.lineTo(-175, 380); c.closePath();
  c.fillStyle = cloth; c.fill();
  if (who === "amma") {   // the saree's pallu across the chest, with a zari border
    c.save(); c.clip();
    c.beginPath(); c.moveTo(-160, 20); c.lineTo(60, 20); c.lineTo(180, 380); c.lineTo(-40, 380); c.closePath(); c.fillStyle = "#166534"; c.fill();
    stroke(c, [[-150, 26], [60, 26], [182, 384]], ZARI, 14, r, { passes: 2 });
    c.restore();
  } else {
    c.save(); c.clip(); hatch(c, [-190, 0, 190, 400], ["#fbbf24"], r, { angle: 0, gap: 30, w: 3, alpha: 0.4 }); c.restore();
  }
  stroke(c, [[-150, 35], [-175, 380]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[150, 35], [175, 380]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = skin; c.fillRect(-32, -28, 64, 46);
  // arms
  const L: Pt = [-135, 60], R: Pt = [135, 60];
  let l: Pt[] = [[-170, 210], [-110, 290]], rr: Pt[] = [[170, 210], [110, 290]], lx: "point" | "thumb" | "shh" | undefined, rx: "point" | "thumb" | "shh" | undefined;
  let phoneAt: Pt | null = null, plateAt: Pt | null = null;
  if (who === "amma") {
    if (pose === "phone" || pose === "tap") { l = [[-170, 190], [-60, 170]]; phoneAt = [-50, 120]; }
    if (pose === "tap") { rr = [[160, 190], [10, 130 + 6 * Math.sin(f * 0.9)]]; rx = "point"; }
    if (pose === "mouth") { l = [[-170, 190], [-60, 170]]; phoneAt = [-50, 120]; rr = [[150, 120], [62, -60]]; }
    if (pose === "ear") { l = [[-190, 60], [-110, -100]]; phoneAt = [-104, -150]; }
  } else {
    if (pose === "bite") { l = [[-170, 200], [-60, 250]]; rr = [[165, 120], [70, -40]]; plateAt = [-40, 262]; }
    if (pose === "plate" || pose === "point" || pose === "shh" || pose === "thumb") { l = [[-170, 200], [-60, 250]]; rr = [[170, 200], [60, 250]]; plateAt = [0, 250]; }
    if (pose === "point") { l = [[-215, 60], [-330, -20]]; lx = "point"; plateAt = [60, 250]; rr = [[170, 200], [90, 250]]; }
    if (pose === "open") { l = [[-210, 170], [-260, 100]]; rr = [[210, 170], [260, 100]]; }
    if (pose === "shh") { l = [[-150, 120], [-40, -40]]; lx = "shh"; plateAt = [60, 250]; rr = [[170, 200], [90, 250]]; }
    if (pose === "thumb") { rr = [[200, 120], [215, -30]]; rx = "thumb"; plateAt = [-20, 250]; l = [[-170, 200], [-60, 250]]; }
  }
  if (plateAt) plate(c, plateAt[0], plateAt[1], !!o.bite);
  limb(c, [L, l[0], l[1]], cloth, r); palm(c, l[1][0], l[1][1], skin, r, lx === "point" ? undefined : lx);
  if (lx === "point") stroke(c, [[l[1][0], l[1][1]], [l[1][0] - 44, l[1][1] - 14]], skin, 14, r, { passes: 2 });
  limb(c, [R, rr[0], rr[1]], cloth, r); palm(c, rr[1][0], rr[1][1], skin, r, rx);
  if (who === "chinnu" && pose === "bite") {   // a piece of dosa in his hand, at his mouth
    c.beginPath(); c.moveTo(48, -46); c.quadraticCurveTo(84, -76, 112, -40); c.closePath(); c.fillStyle = "#f59e0b"; c.fill();
  }
  if (phoneAt) phoneProp(c, phoneAt[0], phoneAt[1], who === "amma" && pose === "ear" ? -0.4 : -0.15, !!o.glow);
  head(c, who, m, talk, look, r, f);
  c.restore();
};

// ---------- the call screen (screen space, top) ----------
type Call = { mode: "ring" | "call" | "ended" | "contact" | "incoming"; secs: number; muted: boolean; talk: number; banner: number; flags: number; glitch: number; shake: number; mutePop?: number; unmute?: boolean };
const callCard = (c: Ctx, W: number, f: number, k: Call, r: () => number) => {
  const x = 110, y = 215, w = W - 220, h = 270 + (k.banner > 0 ? 84 * easeOut(k.banner) : 0);
  c.save();
  if (k.shake > 0) c.translate((r() - 0.5) * 24 * k.shake, (r() - 0.5) * 16 * k.shake);
  c.save(); c.shadowColor = "rgba(0,0,0,0.35)"; c.shadowBlur = 24; c.fillStyle = UI; rrect(c, x, y, w, h, 34); c.fill(); c.restore();
  if (k.mode === "contact") {
    c.beginPath(); c.arc(x + 110, y + 135, 66, 0, 7); c.fillStyle = TEE; c.fill();
    c.font = SANS(64); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("C", x + 110, y + 158);
    c.textAlign = "left"; c.font = SANS(58); c.fillText("Chinnu", x + 210, y + 118);
    c.font = SANS(34, 600); c.fillStyle = "#86efac"; c.fillText("✓ saved · my number", x + 212, y + 170);
    c.font = SANS(30, 500); c.fillStyle = "#94a3b8"; c.fillText("disconnect, call back here", x + 212, y + 214);
    c.fillStyle = "#dc2626"; rrect(c, x + 30, y + h + 20, w - 60, 104, 20); c.fill();   // forwards lose the caption: the helpline in the video
    c.font = SANS(40); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("Already sent money? Call 1930", x + w / 2, y + h + 66);
    c.font = SANS(28, 600); c.fillText("(cyber crime helpline)", x + w / 2, y + h + 104); c.textAlign = "left";
    c.restore(); return;
  }
  const ring = k.mode === "ring" || k.mode === "incoming";
  c.beginPath(); c.arc(x + 100, y + 112, 58, 0, 7); c.fillStyle = "#475569"; c.fill();
  c.font = SANS(66); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("?", x + 100, y + 136);
  if (ring) {   // the ring pulse
    const q = (f % 24) / 24;
    stroke(c, circlePts(x + 100, y + 112, 58 + 26 * q, 58 + 26 * q), "#38bdf8", 6, r, { passes: 1, alpha: 1 - q });
  }
  c.textAlign = "left"; c.font = SANS(58); c.fillStyle = "#fff"; c.fillText("Unknown number", x + 190, y + 100);
  c.font = SANS(30, 500); c.fillStyle = "#94a3b8";
  const sub = ring ? "incoming call · +91 ••••• ••742" : k.mode === "ended" ? "call ended" : `on speaker · 00:${String(Math.floor(k.secs)).padStart(2, "0")}`;
  c.fillText(sub, x + 192, y + 146);
  if (k.muted) { c.fillStyle = "#dc2626"; rrect(c, x + w - 236, y + 112, 206, 62, 31); c.fill(); c.font = SANS(36); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("🔇 MUTED", x + w - 133, y + 155); c.textAlign = "left"; }   // beside the status line, clear of the title
  // the caller's sound wave (red and jagged when the cloned voice breaks)
  const bars = k.mode === "incoming" ? 20 : 34;   // room for the answer / decline buttons
  for (let i = 0; i < bars; i++) {
    const bx = x + 60 + i * ((w - 120) / bars);
    const base = k.mode === "call" ? 0.12 + 0.88 * k.talk * Math.abs(Math.sin(f * 0.6 + i * 1.7) * Math.cos(f * 0.23 + i)) : 0.06;
    const amp = k.glitch > 0 ? (r() > 0.5 ? 1 : 0.15) : base;
    const bh = 8 + 62 * amp;
    c.fillStyle = k.glitch > 0 ? "#ef4444" : k.mode === "ended" ? "#334155" : "#38bdf8";
    rrect(c, bx, y + 214 - bh / 2, (w - 120) / bars - 6, bh, 4); c.fill();
  }
  if (k.mode === "ended") { c.fillStyle = "rgba(15,23,42,0.6)"; rrect(c, x, y, w, h, 34); c.fill(); c.font = SANS(56); c.fillStyle = "#f87171"; c.textAlign = "center"; c.fillText("CALL ENDED", x + w / 2, y + 160); c.textAlign = "left"; }
  if (k.mode === "incoming") {   // answer / decline buttons
    [[x + w - 200, "#dc2626"], [x + w - 90, "#16a34a"]].forEach(([bx, col]) => { c.beginPath(); c.arc(bx as number, y + 212, 40, 0, 7); c.fillStyle = col as string; c.fill(); });
  }
  if (k.glitch > 0) {   // static over the card
    c.save(); c.globalAlpha = 0.5 * k.glitch;
    for (let i = 0; i < 26; i++) { c.fillStyle = r() > 0.5 ? "#fff" : "#ef4444"; c.fillRect(x + r() * w, y + r() * h, 30 + r() * 120, 4 + r() * 8); }
    c.restore();
  }
  c.restore();
  const mp = k.mutePop ?? 0;
  if (mp > 0 && mp < 1) {   // the tap: a big MUTED pops over the card, then settles in the corner
    const q = Math.sin(Math.PI * mp);
    c.save(); c.translate(W / 2, y + h / 2); c.scale(0.7 + 0.5 * q, 0.7 + 0.5 * q); c.globalAlpha = Math.min(1, q * 1.6);
    c.fillStyle = "#dc2626"; rrect(c, -230, -62, 460, 124, 62); c.fill();
    c.font = SANS(76); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(k.unmute ? "UNMUTED" : "🔇 MUTED", 0, 26);
    c.restore();
  }
  if (k.banner > 0) {   // inside the card, under the sound wave (it covered faces as a floating banner)
    const q = easeOut(k.banner);
    c.save(); c.globalAlpha = q; c.fillStyle = "#dc2626"; rrect(c, x + 40, y + 262, w - 80, 70, 16); c.fill();
    c.font = SANS(50); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SEND ₹50,000 NOW", x + w / 2, y + 314); c.restore();
  }
  if (k.flags > 0) {   // the red flags at the bottom of the frame, over the table (not over anyone's face)
    ["new number", "urgent", "secret", "money now"].forEach((t, i) => {
      const q = clamp(k.flags - i);
      if (q <= 0) return;
      const cx = 290 + (i % 2) * 500, cy = 1300 + Math.floor(i / 2) * 84, k2 = easeOut(q);
      c.save(); c.translate(cx, cy); c.rotate((i % 2 ? 1 : -1) * 0.02); c.scale(k2, k2);
      c.fillStyle = "#dc2626"; rrect(c, -220, -36, 440, 72, 36); c.fill();
      c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(`🚩 ${t}`, 0, 15);
      c.restore();
    });
  }
};

// ---------- the cutaway: his reels -> a voice copy ----------
const insert = (c: Ctx, W: number, H: number, p: number, f: number, r: () => number, boil: number) => {
  c.fillStyle = "#fdf6e3"; c.fillRect(0, 0, W, H);
  hatch(c, [0, 0, W, H], ["#f5e6c8"], r, { gap: 18, w: 3, alpha: 0.4 });
  // his phone with three reels
  c.save(); c.translate(250, 860); c.rotate(-0.06);
  c.fillStyle = "#111827"; rrect(c, -170, -330, 340, 660, 40); c.fill();
  c.fillStyle = "#1e293b"; rrect(c, -150, -300, 300, 600, 26); c.fill();
  ["dance", "food", "rant"].forEach((t, i) => {
    const yy = -280 + i * 196;
    c.fillStyle = ["#f472b6", "#fbbf24", "#60a5fa"][i]; rrect(c, -132, yy, 264, 176, 16); c.fill();
    c.beginPath(); c.arc(-60, yy + 70, 34, 0, 7); c.fillStyle = SKIN_C; c.fill();
    c.font = handF(34); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`🎤 ${t}`, -20, yy + 80);
  });
  c.restore();
  label(c, "his reels", 250, 1290, 76, INK, caveat, seg(p, 0, 0.15));
  // sound waves pulled across into the copy machine
  const pull = seg(p, 0.1, 0.7);
  for (let k = 0; k < 3; k++) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, xx = 420 + t * 300 * pull, yy = 700 + k * 120 - t * (k - 1) * 60 + Math.sin(t * 12 + f * 0.5 + k) * 22;
      pts.push([xx, yy]);
    }
    if (pull > 0) stroke(c, pts, ["#ec4899", "#f59e0b", "#3b82f6"][k], 9, r, { passes: 1, alpha: 0.9 });
  }
  robot(c, 860, 900, 0.9, boil, 9, { body: "#e2e8f0", accent: "#ef4444", eyes: "open" } as any);
  label(c, "voice copier", 840, 1290, 76, INK, caveat, seg(p, 0.25, 0.4));
  if (p > 0.6) {
    const q = easeOut(seg(p, 0.6, 0.8));
    c.save(); c.translate(W / 2, 470); c.rotate(-0.04); c.scale(q, q);
    c.fillStyle = "#0f172a"; rrect(c, -330, -90, 660, 180, 26); c.fill();
    c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("VOICE COPY: Chinnu", 0, -20);
    for (let i = 0; i < 22; i++) { const bh = 10 + 40 * Math.abs(Math.sin(i * 1.3 + f * 0.4)); c.fillStyle = "#38bdf8"; rrect(c, -280 + i * 26, 40 - bh / 2, 16, bh, 4); c.fill(); }
    c.restore();
  }
};

const wordFrame = (ln: Line, re: RegExp, fallback: number) => {
  const w = (ln.words ?? []).find((x) => re.test(x.w.replace(/[^\w]/g, "")));
  return w ? w.from : fallback;
};
const cueAt = (ln: Line, n: number, re: RegExp, fallback: number) => ln.cues?.[String(n)] ?? wordFrame(ln, re, fallback);

// ---------- the scene (all four parts of the skit use it) ----------
const SkHome: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const end = (l: Line) => l.from + l.frames;
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from;
    if (b.prop === "ring") sfx.push(<Sfx key={"a" + i} at={0} src="reel/sfx_ring1.wav" vol={0.3} />, <Sfx key={"b" + i} at={0} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "turn") sfx.push(<Sfx key={"a" + i} at={at - 4} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "money") sfx.push(<Sfx key={"a" + i} at={at + Math.round(l.frames * 0.55)} src="audio/sfx_chaching.wav" vol={0.35} />);
    if (b.prop === "mute" || b.prop === "unmute") sfx.push(<Sfx key={"a" + i} at={at - (b.prop === "mute" ? 12 : 6)} src="audio/sfx_tick.wav" vol={0.55} />);
    if (b.prop === "flags") [0, 1, 2, 3].forEach((k) => sfx.push(<Sfx key={"f" + i + k} at={at + 4 + k * Math.round(l.frames / 5)} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "reels") sfx.push(<Sfx key={"a" + i} at={at - 14} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={"b" + i} at={at + Math.round(l.frames * 0.62)} src="audio/sfx_snap.wav" vol={0.5} />);
    if (b.prop === "glitch") { const g = cueAt(l, 1, /^Amma$/i, at + Math.round(l.frames * 0.3)); sfx.push(<Sfx key={"a" + i} at={g - 14} src="reel/sfx_glitch.wav" vol={0.4} />); }
    if (b.prop === "hangup") sfx.push(<Sfx key={"a" + i} at={end(l) + 2} src="reel/sfx_hangup.wav" vol={0.7} />, <Sfx key={"b" + i} at={end(l) + 2} src="reel/sfx_boom.wav" vol={1} />,
      <Sfx key={"c" + i} at={end(l) + 2} src="audio/gag_bonk.wav" vol={0.6} />);   // the biggest hit of the skit
    if (b.prop === "plan") sfx.push(<Sfx key={"a" + i} at={at + 6} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "saved") sfx.push(<Sfx key={"a" + i} at={at + Math.round(l.frames * 0.4)} src="audio/sfx_success.wav" vol={0.22} />);
    if (b.prop === "nextday") sfx.push(<Sfx key={"a" + i} at={at - 53} src="audio/sfx_whoosh.wav" vol={0.4} />, <Sfx key={"b" + i} at={at - 22} src="reel/sfx_buzz.wav" vol={0.6} />,
      <Sfx key={"c" + i} at={end(l)} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={"d" + i} at={end(l)} src="audio/sfx_snap.wav" vol={0.5} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f0, boil0) => {
        let i = idx(f0);
        const lastB = beats[beats.length - 1], lastL = ls[ls.length - 1];
        const freezeAt = lastB.prop === "nextday" ? end(lastL) : Infinity;
        const f = Math.min(f0, freezeAt), boil = f0 >= freezeAt ? 0 : boil0;
        i = idx(f);
        const b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const n = b.n;
        const r = rng(8200 + boil);
        const talkOf = (who: string) => b.who === who && (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        // the voice's level for the caller's sound wave
        const callerTalk = b.who === "caller" && (ln.words ?? []).some((w) => f >= w.from && f <= w.to) ? 1 : 0;
        if (SHOT[n] === "insert") {
          insert(c, W, H, p, f, r, boil);
          return;
        }
        // camera: a push-in per line around a face; the hook punches in on the slow turn; shake when the voice breaks
        let cam = CAM[SHOT[n]] ?? CAM.wide;
        const prev = n > 1 ? CAM[SHOT[n - 1]] ?? CAM.wide : cam;
        if (n === 2) { const q = easeOut(seg(p, 0, 0.6)); cam = { z: prev.z + (cam.z - prev.z) * q, x: prev.x + (cam.x - prev.x) * q, y: prev.y + (cam.y - prev.y) * q }; }
        if (n === 14) { const q = easeOut(seg(p, 0.1, 0.3)); cam = { ...cam, z: cam.z * (1 + 0.12 * q) }; }
        const z = cam.z * (1 + 0.03 * p);
        const gAt = n === 13 ? cueAt(ln, 1, /^Amma$/i, ln.from + ln.frames * 0.3) : 0;   // the caller's voice breaks in the pause, before "Amma, no time!"
        const glitchOn = n === 13 ? seg(f, gAt - 14, gAt - 2) : 0;
        const shake = glitchOn > 0 && glitchOn < 1 ? 8 : (n === 14 && p > 0.9 ? 10 : 0) + (f0 >= freezeAt ? Math.max(0, 1 - (f0 - freezeAt) / 10) * 12 : 0);
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        const lastIsNext = lastB.prop === "nextday";
        const nextAt = lastIsNext && ls.length > 1 ? end(ls[ls.length - 2]) + 4 : Infinity;   // after "Call my saved number."
        const next = f >= nextAt;
        const day = next;
        c.fillStyle = WALL; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(540 + sx, 960 + sy); c.scale(z, z); c.translate(-cam.x, -cam.y);
        room(c, r, day);
        const muteLine = ls[beats.findIndex((x) => x.prop === "mute")];
        const muteAt = muteLine ? muteLine.from - 12 : Infinity;   // she taps MUTE in the caller's last beat, before Chinnu speaks
        const [am, ap, alook] = next && n !== 18 ? ["sus", "phone", 2] as [Mood, Pose, number] : n === 3 && f >= muteAt ? ["stern", "tap", 2] as [Mood, Pose, number] : AMMA[n] ?? ["worried", "phone", 0];
        const [cm, cp, clook] = CHINNU[n] ?? ["worried", "plate", -1];
        const amLook = n === 2 ? (p > 0.25 ? 1 : 2) : alook;
        person(c, "amma", am, ap, amLook, talkOf("amma"), p, f, r, { glow: n <= 14 || n === 18 });
        const chMood = n === 1 ? (p > 0.42 ? "shock" : "chew") : n === 2 && p < 0.25 ? "shock" : cm;   // he freezes mid-bite on "It's me, Chinnu!"
        person(c, "chinnu", chMood as Mood, cp, n === 1 && p > 0.42 ? -1 : clook, talkOf("chinnu"), p, f, r, { bite: n >= 2 });
        sofaFront(c, r);
        c.restore();
        // the call screen
        const secs = ((s as any).from ?? 0) / 30 + f / 30;
        if (n <= 14) {
          const muted = (n >= 4 && n <= 11) || (n === 12 && p < 0.15) || (n === 3 && f >= muteAt);
          const g13 = n === 13 ? glitchOn * (1 - seg(f, gAt + 20, gAt + 30)) : 0;
          const ended = n === 14 && f >= end(ln) + 2;   // the hang-up lands just after "Wrong answer."
          callCard(c, W, f, {
            mode: n === 1 && f < 4 ? "ring" : ended ? "ended" : "call", secs, muted, talk: callerTalk,
            mutePop: n === 3 || n === 4 ? seg(f, muteAt, muteAt + 28) : n === 12 ? seg(f, ln.from - 4, ln.from + 18) : 0, unmute: n === 12,
            banner: n === 3 ? seg(p, 0.45, 0.6) : n >= 4 && n <= 6 ? 1 : 0,
            flags: n === 5 ? seg(p, 0.05, 0.95) * 4 : n === 6 ? 4 : 0,
            glitch: g13 > 0 && g13 < 1 ? 1 : n === 13 && g13 >= 1 ? 0.6 : 0, shake: g13 > 0 && g13 < 1 ? 1 : 0,
          }, r);
        } else if (next) {
          const answered = n === 18 && p > 0.1;
          callCard(c, W, f, { mode: answered ? "call" : "incoming", secs: answered ? p * 2 : 0, muted: false, talk: 0, banner: 0, flags: 0, glitch: 0, shake: answered ? 0 : 0.6 }, r);
        } else if (n === 17) {
          callCard(c, W, f, { mode: "contact", secs: 0, muted: false, talk: 0, banner: 0, flags: 0, glitch: 0, shake: 0 }, r);
        }
        // the hook, readable with the sound off
        if (s.id === "sk2_a" && n <= 2) {
          const out = n === 2 ? 1 - seg(p, 0.6, 0.9) : 1;
          c.save(); c.globalAlpha = out;
          const q = easeOut(seg(f, 0, 5));
          c.save(); c.translate(660, 560); c.rotate(-0.03); c.scale(q, q);
          c.fillStyle = COL.yellow; rrect(c, -300, -66, 600, 132, 22); c.fill();
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center";
          c.fillText("Her son CHINNU is", 0, -12); c.fillText("sitting RIGHT HERE ↓", 0, 40);
          c.restore();
          c.restore();
        }
        if (n === 14 && f >= end(ln) + 2) {   // the punchline stays readable through the hit (the caption is gone by then)
          const q = seg(f, end(ln) + 2, end(ln) + 6);
          stamp(c, "WRONG ANSWER.", W / 2, 1180, 110, COL.red, q, r, -0.06);
        }
        if (n === 15) {   // the plan, on a sticky note
          const q = seg(p, 0.05, 0.2);
          c.save(); c.translate(250, 1350); c.rotate(-0.05); c.globalAlpha = q;
          c.fillStyle = "#fde68a"; c.fillRect(-150, -70, 300, 140);
          c.font = handF(34); c.fillStyle = INK; c.textAlign = "center";
          c.fillText("TONIGHT: a real", 0, -18); c.fillText("code word", 0, 22); c.font = handF(24); c.fillText("(not in the family group!)", 0, 56);
          c.restore();
        }
        if (next) {   // NEXT DAY
          const l18 = ls[ls.length - 1];
          const q = seg(f, nextAt, nextAt + 5) * (1 - seg(f, nextAt + 32, nextAt + 38));   // a second on screen, then the buzz
          if (q > 0) {
            c.save(); c.globalAlpha = 0.35 * q; c.fillStyle = "#fff7e6"; c.fillRect(0, 0, W, H); c.restore();
            stamp(c, "NEXT DAY", W / 2, 820, 170, COL.red, q, r, -0.08);
          }
          void l18;
        }
        if (f0 >= freezeAt) {   // the freeze frame, then the loop snaps back to the ring
          c.save(); c.globalAlpha = 0.25; c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H); c.restore();
          const k = easeOut(seg(f0, freezeAt, freezeAt + 6));
          c.save(); c.translate(W / 2, 760); c.rotate(-0.06); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
          c.font = caveat(170); c.textAlign = "center"; c.lineWidth = 14; c.strokeStyle = INK; c.strokeText("Code word?", 0, 0);
          c.fillStyle = COL.yellow; c.fillText("Code word?", 0, 0);
          c.restore();
          c.save(); c.globalAlpha = k; c.fillStyle = "#dc2626"; rrect(c, 120, 1290, W - 240, 112, 22); c.fill();
          c.font = SANS(40); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("Already sent money? Call 1930", W / 2, 1338);
          c.font = SANS(28, 600); c.fillText("(cyber crime helpline)", W / 2, 1378); c.restore();
        }
      }} />
    </>
  );
};

export const HOME_SCENES = { sk_home: SkHome };
