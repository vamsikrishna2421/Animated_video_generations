import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, label, stamp } from "./WordsCrayon";

// Skit 03 "The AI that confessed" (series/scripts/skit03_confessed.md): a college staff room, seen through the student's
// eyes (POV: the camera is Priya, standing at Sir's desk; her hands come into frame). Sir pasted her essay into a chatbot,
// asked "You wrote this, right?", and it said yes (the Texas case, 2023). Priya has it write an essay, then asks it in a
// new chat: "No, I did not write this." (our test, series/scripts/skit03_demo). The laptop screen opens to full frame for
// the chat; the test is a card. One beat per line (s.data.beats); n = the script's line number.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "sir" | "priya" | "bot"; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SKIN = "#b07246", SKIN_P = "#c58a5c", HAIR = "#1b1511", GREY = "#9ca3af", SHIRT = "#9cc7ef", WALL = "#f4e7c3";
const BOARD = "#1f4d3a", WOOD = "#8b5a2b", DESK = "#a0673a", KURTI = "#0f766e", UI = "#0f172a", BLUE = "#2563eb";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const SERIF = (s: number) => `italic ${s}px Georgia, 'Times New Roman', serif`;
const N: Pt = [430, 1000];   // Sir's neck (the POV shot)
const S = 0.95;
const CAM: Record<string, { z: number; x: number; y: number }> = {
  pov: { z: 1, x: 540, y: 960 }, close: { z: 1.5, x: 470, y: 900 },
};

type Mood = "stern" | "yell" | "smug" | "shock" | "puzzled" | "panic" | "sheepish" | "type" | "calm";
type Arms = "rest" | "slam" | "point" | "fold" | "palms" | "type" | "wipe";
// Sir's face and hands per line; Priya's hands per line (POV); the shot per line ("screen" = the laptop at full frame,
// "phone" = Priya's phone at full frame)
const SIR: Record<number, [Mood, Arms]> = {
  1: ["yell", "slam"], 2: ["stern", "fold"], 3: ["smug", "fold"], 4: ["puzzled", "fold"], 5: ["type", "type"], 6: ["type", "type"],
  7: ["type", "type"], 8: ["shock", "palms"], 9: ["puzzled", "rest"], 10: ["shock", "palms"], 11: ["panic", "palms"],
  12: ["calm", "rest"], 13: ["smug", "fold"], 14: ["shock", "fold"], 15: ["yell", "point"],
};
const HANDS: Record<number, "" | "plead" | "point" | "open"> = { 2: "plead", 4: "point", 11: "open" };
const SHOT: Record<number, string> = {
  1: "pov", 2: "pov", 3: "close", 4: "pov", 5: "screen", 6: "screen", 7: "screen", 8: "close", 9: "why", 10: "pov",
  11: "pov", 12: "phone", 13: "pov", 14: "pov", 15: "pov",
};
const ESSAY = "My hometown is a small, peaceful place surrounded by green fields. Every morning, the temple bells ring and the streets fill with the smell of fresh idlis...";

// ---------- the staff room ----------
const fan = (c: Ctx, f: number, r: () => number) => {
  stroke(c, [[540, -40], [540, 70]], "#475569", 12, r, { passes: 1 });
  c.save(); c.translate(540, 92); c.scale(1, 0.28);
  for (let k = 0; k < 3; k++) {
    c.save(); c.rotate(f * 0.55 + k * (Math.PI * 2 / 3));
    c.fillStyle = "#cbd5e1"; c.beginPath(); c.ellipse(150, 0, 140, 26, 0, 0, 7); c.fill();
    c.restore();
  }
  c.restore();
  c.beginPath(); c.ellipse(540, 92, 44, 22, 0, 0, 7); c.fillStyle = "#64748b"; c.fill();
};
const room = (c: Ctx, f: number, r: () => number, board: boolean) => {
  c.fillStyle = WALL; c.fillRect(-500, -300, 2100, 1600);
  hatch(c, [-400, 0, 1500, 1260], ["#ead8a8", "#f8efd6"], r, { gap: 16, w: 3, alpha: 0.35 });
  fan(c, f, r);
  if (board) {   // the blackboard with today's essay topic
    c.fillStyle = WOOD; rrect(c, 140, 250, 820, 410, 10); c.fill();
    c.fillStyle = BOARD; c.fillRect(158, 268, 784, 374);
    hatch(c, [160, 270, 940, 640], ["#2b5e48", "#173d2d"], r, { gap: 22, w: 4, alpha: 0.35 });
    c.font = handF(54); c.fillStyle = "rgba(255,255,255,0.88)"; c.textAlign = "left";
    c.fillText("B.A. English · II year", 200, 350);
    c.fillText("Essay: \"My Hometown\"", 200, 440);
    c.font = handF(46); c.fillText("Submit TODAY", 200, 530);
    stroke(c, [[200, 548], [470, 552]], "rgba(255,255,255,0.8)", 5, r, { passes: 1 });
    c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(620, 470, 260, 120);   // an old smudge
  }
  // the clock (10:10) and the notice board
  c.beginPath(); c.arc(985, 760, 52, 0, 7); c.fillStyle = "#fff"; c.fill();
  stroke(c, circlePts(985, 760, 52, 52), INK, 5, r, { passes: 2 });
  stroke(c, [[985, 760], [960, 738]], INK, 6, r, { passes: 1 }); stroke(c, [[985, 760], [1012, 728]], INK, 4, r, { passes: 1 });
  c.fillStyle = "#b45309"; rrect(c, 18, 720, 150, 250, 8); c.fill();
  c.fillStyle = "#c2884a"; c.fillRect(28, 730, 130, 230);
  [[40, 744, "#fef9c3", "TIME TABLE"], [52, 832, "#e0f2fe", "NO MOBILES"], [36, 900, "#fce7f3", "EXAMS 3 NOV"]].forEach(([x, y, col, t]) => {
    c.fillStyle = col as string; c.fillRect(x as number, y as number, 112, 58);
    c.font = handF(18); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t as string, (x as number) + 6, (y as number) + 34);
    c.beginPath(); c.arc((x as number) + 56, (y as number) + 4, 5, 0, 7); c.fillStyle = "#dc2626"; c.fill();
  });
};
// the desk and what is on it (drawn after Sir: it covers his lap)
const deskBase = (c: Ctx, r: () => number) => {
  c.fillStyle = DESK; c.beginPath(); c.moveTo(-80, 1200); c.lineTo(1160, 1200); c.lineTo(1300, 1470); c.lineTo(-220, 1470); c.closePath(); c.fill();
  hatch(c, [-200, 1200, 1300, 1470], ["#8a5530", "#b67a48"], r, { angle: 0.02, gap: 26, w: 4, alpha: 0.35 });
  c.fillStyle = "#6f4322"; c.fillRect(-300, 1470, 1700, 600);
  hatch(c, [-300, 1475, 1400, 2000], ["#5c371b", "#7e4f2a"], r, { angle: -0.02, gap: 34, w: 5, alpha: 0.35 });
  stroke(c, [[-220, 1470], [1300, 1470]], INK, 5, r, { passes: 2, alpha: 0.5 });
};
const deskItems = (c: Ctx, r: () => number, o: { zero: number; laptop: "back" | "front" | "none"; chat?: number }) => {
  // the nameplate, the tea glass, the stack of essays
  c.fillStyle = "#1e293b"; rrect(c, 330, 1214, 260, 50, 8); c.fill();
  c.font = SANS(26); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("DEPT. OF ENGLISH", 460, 1248);
  c.fillStyle = "rgba(219,234,254,0.85)"; rrect(c, 600, 1200, 52, 76, 6); c.fill();
  c.fillStyle = "#b45309"; c.fillRect(604, 1226, 44, 46);
  c.fillStyle = "#f8fafc"; [0, 1, 2].forEach((k) => { c.save(); c.translate(870, 1250 - k * 10); c.rotate(0.05 - k * 0.04); c.fillRect(-90, -30, 180, 60); c.restore(); });
  // her essay with the red zero
  c.save(); c.translate(200, 1300); c.rotate(-0.07);
  c.fillStyle = "#fff"; c.fillRect(-150, -90, 300, 220);
  stroke(c, [[-150, -90], [150, -90], [150, 130], [-150, 130], [-150, -90]], INK, 3, r, { passes: 1, alpha: 0.5 });
  c.font = handF(24); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Priya · B.A. II", -130, -56);
  for (let k = 0; k < 6; k++) stroke(c, [[-130, -24 + k * 24], [120 - (k % 3) * 30, -24 + k * 24]], "#64748b", 3, r, { passes: 1, alpha: 0.6 });
  if (o.zero > 0) {
    const q = easeOut(o.zero);
    c.save(); c.translate(80, -40); c.scale(q, q);
    c.font = caveat(96); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("0", 0, 30);
    stroke(c, circlePts(0, 0, 58, 54), COL.red, 7, r, { passes: 2 });
    c.restore();
  }
  c.restore();
  // the laptop: its back to us while Sir types, or turned round to show the chat
  if (o.laptop === "back") {
    c.fillStyle = "#94a3b8"; c.beginPath(); c.moveTo(660, 1215); c.lineTo(990, 1215); c.lineTo(1010, 930); c.lineTo(640, 930); c.closePath(); c.fill();
    stroke(c, [[660, 1215], [990, 1215], [1010, 930], [640, 930], [660, 1215]], INK, 4, r, { passes: 2, alpha: 0.6 });
    c.beginPath(); c.arc(825, 1060, 30, 0, 7); c.fillStyle = "#facc15"; c.fill();   // a sticker
    c.font = SANS(22); c.fillStyle = INK; c.textAlign = "center"; c.fillText("NSS", 825, 1068);
  }
  if (o.laptop === "front") {
    c.fillStyle = "#334155"; rrect(c, 620, 900, 400, 300, 14); c.fill();
    c.fillStyle = "#f8fafc"; rrect(c, 636, 914, 368, 262, 8); c.fill();
    c.fillStyle = "#cbd5e1"; c.beginPath(); c.moveTo(600, 1200); c.lineTo(1040, 1200); c.lineTo(1070, 1240); c.lineTo(570, 1240); c.closePath(); c.fill();
    // a tiny copy of the chat, so the big card above reads as this screen
    c.fillStyle = BLUE; rrect(c, 800, 940, 190, 40, 14); c.fill();
    c.fillStyle = "#e5e7eb"; rrect(c, 650, 1000, 220, 40, 14); c.fill();
    if ((o.chat ?? 0) > 0) { c.fillStyle = "#16a34a"; rrect(c, 650, 1060, 160, 40, 14); c.fill(); }
  }
};

// ---------- Sir ----------
const sirHead = (c: Ctx, m: Mood, talk: boolean, r: () => number, f: number) => {
  const hy = -135;
  c.save();
  if (m === "sheepish") c.rotate(-0.06);
  [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 98, hy + 5, 17, 26, 0, 0, 7); c.fillStyle = SKIN; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 100, 118, 0, 0, 7); c.fillStyle = SKIN; c.fill();
  stroke(c, circlePts(0, hy, 100, 118), INK, 4, r, { passes: 2, alpha: 0.6 });
  // greying hair at the sides, a thin top (a receding line)
  [-1, 1].forEach((sx) => {
    c.beginPath(); c.moveTo(sx * 70, hy - 92); c.quadraticCurveTo(sx * 112, hy - 70, sx * 104, hy - 6); c.lineTo(sx * 90, hy - 4); c.quadraticCurveTo(sx * 92, hy - 60, sx * 56, hy - 84); c.closePath();
    c.fillStyle = "#4b5563"; c.fill();
  });
  c.beginPath(); c.ellipse(0, hy - 104, 60, 16, 0, Math.PI, 0); c.fillStyle = "#374151"; c.fill();
  stroke(c, [[-50, hy - 110], [50, hy - 112]], GREY, 5, r, { passes: 1, alpha: 0.7 });
  // brows
  const brow = (sx: number) => {
    let yi = -172, yo = -170;
    if (m === "stern" || m === "yell" || m === "smug") { yi = -158; yo = -180; }
    if (m === "shock" || m === "puzzled" || m === "panic") { yi = -192; yo = -186; }
    if (m === "sheepish") { yi = -182; yo = -164; }
    if (m === "puzzled" && sx > 0) { yi = -170; yo = -166; }
    if (m === "smug" && sx < 0) { yi = -176; yo = -176; }
    stroke(c, [[sx * 18, hy + (yi + 135)], [sx * 70, hy + (yo + 135)]], "#374151", 11, r, { passes: 2 });
  };
  brow(-1); brow(1);
  // eyes behind big glasses
  const look = m === "type" || m === "sheepish" ? [m === "sheepish" ? 9 : 4, 7] : [0, 0];
  [-40, 40].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "panic") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 7, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "smug" || m === "stern") {
      stroke(c, [[ex - 15, ey - 2], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 2, ey + 5, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "calm") {
      stroke(c, circlePts(ex, ey + 6, 14, 10, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else {
      c.beginPath(); c.arc(ex + look[0], ey + look[1], 8, 0, 7); c.fillStyle = INK; c.fill();
    }
    c.save(); c.lineWidth = 6; c.strokeStyle = "#111827"; rrect(c, ex - 34, ey - 28, 68, 54, 16); c.stroke(); c.restore();
    c.fillStyle = "rgba(255,255,255,0.18)"; rrect(c, ex - 30, ey - 24, 24, 16, 6); c.fill();
  });
  stroke(c, [[-6, hy - 6], [6, hy - 6]], "#111827", 6, r, { passes: 1 });   // the bridge
  stroke(c, [[2, hy + 10], [12, hy + 36], [-6, hy + 42]], "#7c4422", 6, r, { passes: 2 });
  // the moustache
  c.beginPath(); c.moveTo(-52, hy + 66); c.quadraticCurveTo(0, hy + 40, 52, hy + 66); c.quadraticCurveTo(0, hy + 58, -52, hy + 66); c.fillStyle = "#1f2937"; c.fill();
  // mouth
  const my = hy + 84;
  if (talk || m === "shock" || m === "panic" || m === "yell") {
    const w = m === "yell" || m === "panic" ? 28 : talk ? 20 : 14, h = m === "yell" || m === "panic" ? 22 : talk ? 12 : 16;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "smug") {
    stroke(c, [[-22, my], [6, my], [26, my - 12]], INK, 6, r, { passes: 2 });
  } else if (m === "calm") {
    stroke(c, circlePts(0, my - 8, 24, 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "sheepish") {   // a crooked, guilty grin
    stroke(c, [[-24, my + 4], [-4, my - 2], [12, my + 2], [26, my - 6]], INK, 6, r, { passes: 2 });
  } else {
    stroke(c, [[-16, my + 2], [16, my + 2]], INK, 6, r, { passes: 2 });
  }
  if (m === "panic" || m === "sheepish" || m === "shock") {   // sweat
    [[96, hy - 70], [-100, hy - 40]].forEach(([x, y], k) => {
      if (k === 1 && m !== "sheepish") return;
      const d = (f % 30) / 30 * (m === "sheepish" ? 22 : 0);
      c.beginPath(); c.moveTo(x, y + d); c.quadraticCurveTo(x + 18, y + 30 + d, x, y + 40 + d); c.quadraticCurveTo(x - 16, y + 30 + d, x, y + d); c.fillStyle = "#7dd3fc"; c.fill();
    });
  }
  c.restore();
};
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number) => {
  stroke(c, pts, col, 40, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, point?: Pt) => {
  c.beginPath(); c.arc(x, y, 25, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, 25, 25), INK, 3, r, { passes: 1, alpha: 0.6 });
  if (point) stroke(c, [[x, y], [x + point[0], y + point[1]]], skin, 14, r, { passes: 2 });
};
const sir = (c: Ctx, m: Mood, arms: Arms, talk: boolean, f: number, r: () => number, pass: "body" | "hands" = "body") => {
  const onDesk = arms === "slam" || arms === "rest";   // these hands lie on the desk: drawn after it
  if (pass === "hands" && !onDesk) return;
  c.save();
  if (pass === "body") { c.beginPath(); c.rect(-600, -400, 2400, 1605); c.clip(); }
  c.translate(N[0], N[1]); c.scale(S, S);
  if (pass === "hands") {
    const lh: Pt[] = arms === "slam" ? [[-250, 200], [-250, 320 + (f < 6 ? -70 + f * 12 : 0)]] : [[-170, 250], [-90, 300]];
    const rh: Pt[] = arms === "slam" ? [[175, 240], [110, 300]] : [[170, 250], [90, 300]];
    [[lh, -1], [rh, 1]].forEach(([pts]) => { const q = pts as Pt[]; limb(c, [[q[0][0] * 0.9, q[0][1]], q[0], q[1]], SHIRT, r); palm(c, q[1][0], q[1][1], SKIN, r); });
    c.restore(); return;
  }
  // shirt: half sleeves, a pocket with a pen
  c.beginPath(); c.moveTo(-160, 35); c.quadraticCurveTo(0, 5, 160, 35); c.lineTo(185, 420); c.lineTo(-185, 420); c.closePath(); c.fillStyle = SHIRT; c.fill();
  stroke(c, [[0, 30], [0, 420]], "#7aa9d6", 4, r, { passes: 1 });
  [40, 120, 200].forEach((y) => { c.beginPath(); c.arc(0, y, 5, 0, 7); c.fillStyle = "#f8fafc"; c.fill(); });
  c.fillStyle = "#86b6e3"; c.fillRect(40, 90, 70, 60);
  stroke(c, [[70, 60], [70, 110]], "#dc2626", 9, r, { passes: 1 });   // the red pen
  c.beginPath(); c.moveTo(-40, 30); c.lineTo(0, 76); c.lineTo(40, 30); c.fillStyle = "#e0efff"; c.fill();   // the collar
  c.fillStyle = SKIN; c.fillRect(-34, -30, 68, 50);
  // arms
  const L: Pt = [-145, 70], R: Pt = [145, 70];
  let l: Pt[] = [[-185, 230], [-120, 300]], rr: Pt[] = [[185, 230], [120, 300]];
  let lp: Pt | undefined, rp: Pt | undefined;
  if (onDesk) { l = [[-175, 180], [-175, 200]]; rr = [[175, 180], [175, 200]]; }   // the forearms come in the hands pass
  if (arms === "point") { rr = [[240, 150], [330, 110]]; rp = [60, -10]; }   // at the laptop on his left
  if (arms === "fold") { l = [[-150, 180], [90, 160]]; rr = [[150, 180], [-90, 175]]; }
  if (arms === "palms") { l = [[-230, 160], [-290, 40]]; rr = [[230, 160], [290, 40]]; }
  if (arms === "type") { l = [[-120, 260], [180, 300 + 6 * Math.sin(f * 1.3)]]; rr = [[220, 240], [330, 300 + 6 * Math.cos(f * 1.1)]]; }
  if (arms === "wipe") { rr = [[180, 140], [70, -170]]; }
  limb(c, [L, l[0], l[1]], SHIRT, r); if (!onDesk) palm(c, l[1][0], l[1][1], SKIN, r, lp);
  limb(c, [R, rr[0], rr[1]], SHIRT, r); if (!onDesk) palm(c, rr[1][0], rr[1][1], SKIN, r, rp);
  if (arms === "wipe") { c.fillStyle = "#f8fafc"; rrect(c, 40, -230, 80, 64, 10); c.fill(); }   // a hanky at the brow
  sirHead(c, m, talk, r, f);
  c.restore();
};

// ---------- Priya's hands (POV, from the bottom edge) ----------
const hands = (c: Ctx, kind: string, p: number, f: number, r: () => number) => {
  if (!kind) return;
  const up = easeOut(seg(p, 0, 0.18));
  const dy = (1 - up) * 400;
  const arm = (a: Pt, b: Pt, point?: Pt) => {
    stroke(c, [[a[0], a[1] + dy], [b[0], b[1] + dy + 40]], KURTI, 110, r, { passes: 2, alpha: 1, jit: 1.5 });
    stroke(c, [[b[0] - 46, b[1] + dy + 70], [b[0] + 46, b[1] + dy + 64]], "#facc15", 14, r, { passes: 1 });   // bangles
    stroke(c, [[b[0] - 46, b[1] + dy + 92], [b[0] + 46, b[1] + dy + 86]], "#dc2626", 10, r, { passes: 1 });
    c.beginPath(); c.ellipse(b[0], b[1] + dy - 10, 62, 72, 0, 0, 7); c.fillStyle = SKIN_P; c.fill();
    stroke(c, circlePts(b[0], b[1] + dy - 10, 62, 72), INK, 4, r, { passes: 1, alpha: 0.5 });
    if (point) stroke(c, [[b[0], b[1] + dy - 30], [b[0] + point[0], b[1] + dy - 30 + point[1]]], SKIN_P, 34, r, { passes: 2 });
  };
  const shake = kind === "plead" ? Math.sin(f * 0.9) * 8 : 0;
  if (kind === "plead") { arm([250, 2050], [430 + shake, 1690]); arm([830, 2050], [650 - shake, 1690]); }
  if (kind === "point") { arm([840, 2050], [740, 1680], [120, -150]); }
  if (kind === "open") { arm([200, 2050], [330, 1700]); arm([880, 2050], [750, 1700]); }
};

// ---------- the laptop screen at full frame ----------
const bubbleT = (c: Ctx, t: string, x: number, y: number, maxW: number, side: "me" | "ai", size: number, k: number, bg?: string) => {
  if (k <= 0) return y;
  c.save(); c.font = SANS(size, 600);
  const words = t.split(" "), lines: string[] = [];
  let cur = "";
  words.forEach((w) => { const tryL = cur ? cur + " " + w : w; if (c.measureText(tryL).width > maxW - 60 && cur) { lines.push(cur); cur = w; } else cur = tryL; });
  if (cur) lines.push(cur);
  const w = Math.min(maxW, Math.max(...lines.map((l) => c.measureText(l).width)) + 60), h = lines.length * size * 1.25 + 34;
  const bx = side === "me" ? x + maxW - w : x;
  const e = easeOut(k);
  c.globalAlpha = clamp(k * 1.6);
  c.translate(side === "me" ? bx + w : bx, y); c.scale(e, e); c.translate(-(side === "me" ? bx + w : bx), -y);
  c.fillStyle = bg ?? (side === "me" ? BLUE : "#e5e7eb"); rrect(c, bx, y, w, h, 28); c.fill();
  c.fillStyle = side === "me" || bg ? "#fff" : INK; c.textAlign = "left";
  lines.forEach((l, i) => c.fillText(l, bx + 30, y + 17 + size + i * size * 1.25 - size * 0.18));
  c.restore();
  return y + h;
};
const typing = (c: Ctx, x: number, y: number, f: number) => {
  c.fillStyle = "#e5e7eb"; rrect(c, x, y, 150, 70, 30); c.fill();
  [0, 1, 2].forEach((k) => { c.beginPath(); c.arc(x + 42 + k * 33, y + 35 - 8 * Math.max(0, Math.sin(f * 0.5 - k)), 10, 0, 7); c.fillStyle = "#6b7280"; c.fill(); });
};
// a pasted text as an attachment card: title, who wrote it and when, the first words
const docCard = (c: Ctx, x: number, y: number, w: number, d: { title: string; who: string; year: string; snippet: string }, k: number, hl = false) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 1.6);
  const h = 250;
  c.fillStyle = "#fffdf5"; rrect(c, x, y, w, h, 18); c.fill();
  c.save(); c.lineWidth = hl ? 6 : 3; c.strokeStyle = hl ? COL.red : "#cbd5e1"; rrect(c, x, y, w, h, 18); c.stroke(); c.restore();
  c.font = SERIF(38); c.fillStyle = INK; c.textAlign = "left";
  const sn = d.snippet.length > 46 ? d.snippet.slice(0, 44) + "..." : d.snippet;
  c.fillText("“" + sn + "”", x + 26, y + 70);
  c.font = SANS(34); c.fillStyle = "#334155"; c.fillText(d.title, x + 26, y + 136);
  c.font = SANS(32, 500); c.fillStyle = "#64748b"; c.fillText(d.who, x + 26, y + 184);
  c.fillStyle = COL.red; rrect(c, x + w - 196, y + 150, 170, 70, 35); c.fill();
  c.font = SANS(42); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(d.year, x + w - 111, y + 199);
  c.restore();
  return y + h;
};
const laptopFrame = (c: Ctx, W: number, H: number, r: () => number) => {
  c.fillStyle = "#e7dcc0"; c.fillRect(0, 0, W, H);
  hatch(c, [0, 0, W, H], ["#d8caa6"], r, { gap: 20, w: 3, alpha: 0.4 });
  c.fillStyle = "#1f2937"; rrect(c, 30, 340, W - 60, 1220, 40); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 60, 370, W - 120, 1160, 22); c.fill();
  c.fillStyle = "#cbd5e1"; c.beginPath(); c.moveTo(0, 1560); c.lineTo(W, 1560); c.lineTo(W, 1660); c.lineTo(0, 1660); c.fill();
  // the chat app's header
  c.fillStyle = "#eef2ff"; rrect(c, 60, 370, W - 120, 120, 22); c.fill(); c.fillRect(60, 450, W - 120, 40);
  c.beginPath(); c.arc(140, 430, 38, 0, 7); c.fillStyle = "#334155"; c.fill();
  [128, 152].forEach((ex) => { c.beginPath(); c.arc(ex, 424, 7, 0, 7); c.fillStyle = "#67e8f9"; c.fill(); });
  stroke(c, [[126, 444], [154, 444]], "#67e8f9", 4, r, { passes: 1 });
  c.font = SANS(46); c.fillStyle = UI; c.textAlign = "left"; c.fillText("AI Chat", 200, 436);
  c.font = SANS(26, 500); c.fillStyle = "#64748b"; c.fillText("free chatbot", 202, 472);
};

// ---------- the scene ----------
const wordAt = (ln: Line, re: RegExp, fb: number) => {
  const w = (ln.words ?? []).find((x) => re.test(x.w.replace(/[^\w]/g, "")));
  return w ? w.from : fb;
};
const cueAt = (ln: Line, n: number, fb: number) => ln.cues?.[String(n)] ?? fb;
// the quiz, as a chip under the reel's title bar from the end of "Machines don't lie" (3) to the test card (10); its NO
// lights up with the why's banner (script review: a held quiz card was gone before one viewer could read it, and the
// other would swipe if it were any longer)
const quiz = (c: Ctx, W: number, n: number, f: number, ln: Line, r: () => number) => {
  const endL = ln.from + ln.frames;
  if (n < 3 || n > 10 || (n === 3 && f < endL - 4)) return;
  const k = n === 3 ? easeOut(seg(f, endL - 4, endL + 4)) : 1;
  const ans = n === 10 ? 1 : n === 9 ? easeOut(seg(f, cueAt(ln, 1, ln.from + Math.round(ln.frames * 0.5)) + 14, cueAt(ln, 1, ln.from + Math.round(ln.frames * 0.5)) + 22)) : 0;
  c.save(); c.globalAlpha = k; c.translate(W / 2, 252); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "rgba(15,23,42,0.95)"; rrect(c, -470, -58, 940, 128, 24); c.fill();
  c.fillStyle = COL.yellow; rrect(c, -446, -40, 120, 44, 12); c.fill();
  c.font = SANS(28); c.fillStyle = INK; c.textAlign = "center"; c.fillText("QUIZ", -386, -8);
  c.font = SANS(34); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Can a chatbot tell if it wrote something?", -310, -6);
  [["YES", -120, "#16a34a"], ["NO", 120, COL.red]].forEach(([t, x, col]) => {
    const isNo = t === "NO", on = isNo ? ans : 0;
    c.save(); c.globalAlpha = k * (isNo ? 1 : 1 - 0.6 * ans);
    c.fillStyle = on > 0 ? (col as string) : "rgba(255,255,255,0.08)"; rrect(c, (x as number) - 90, 14, 180, 46, 23); c.fill();
    c.save(); c.lineWidth = 4; c.strokeStyle = col as string; rrect(c, (x as number) - 90, 14, 180, 46, 23); c.stroke(); c.restore();
    c.font = SANS(32); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(isNo && on > 0.5 ? "NO ✓" : (t as string), x as number, 49);
    c.restore();
  });
  c.restore();
  void r;
};

const SkClass: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const D = s.data.demo ?? {};
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const end = (l: Line) => l.from + l.frames;
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from;
    // fewer effects than v1 (script review: "a hit on almost every line turns into a soundboard"); the two laughs, "No"
    // and "Yes.", get a silence before them (the spec's music drops) and one sound each
    if (b.prop === "hook") sfx.push(<Sfx key={"a" + i} at={0} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={"b" + i} at={1} src="audio/gag_bonk.wav" vol={0.5} />,
      <Sfx key={"c" + i} at={Math.round(l.frames * 0.45)} src="audio/sfx_snap.wav" vol={0.45} />);
    if (b.prop === "smug") sfx.push(<Sfx key={"a" + i} at={end(l) - 4} src="audio/sfx_pop.wav" vol={0.3} />);   // the quiz chip
    if (b.prop === "write") sfx.push(<Sfx key={"a" + i} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.28} />);
    if (b.prop === "newchat") sfx.push(<Sfx key={"a" + i} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "deny") sfx.push(<Sfx key={"a" + i} at={at - 4} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "shock") sfx.push(<Sfx key={"a" + i} at={at - 8} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "why") sfx.push(<Sfx key={"a" + i} at={at - 12} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "test") sfx.push(<Sfx key={"a" + i} at={at - 26} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "history") sfx.push(<Sfx key={"a" + i} at={cueAt(l, 1, at + Math.round(l.frames * 0.5)) - 6} src="audio/sfx_success.wav" vol={0.28} />);
    if (b.prop === "notes_yes") sfx.push(<Sfx key={"a" + i} at={at + 2} src="audio/gag_ding.wav" vol={0.45} />);
    if (b.prop === "lie") {
      const c1 = cueAt(l, 1, at + Math.round(l.frames * 0.55));
      sfx.push(<Sfx key={"a" + i} at={c1 - 8} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={"b" + i} at={end(l) + 1} src="audio/sfx_snap.wav" vol={0.45} />);
    }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f0, boil0) => {
        const lastL = ls[ls.length - 1], lastB = beats[beats.length - 1];
        const freezeAt = lastB.prop === "lie" ? end(lastL) : Infinity;
        const f = Math.min(f0, freezeAt), boil = f0 >= freezeAt ? 0 : boil0;
        const i = idx(f);
        const b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const n = b.n;
        const r = rng(9300 + boil);
        const talking = (who: string) => b.who === who && (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const shot = SHOT[n] ?? "pov";

        // ----- full-frame inserts -----
        if (shot === "screen") {
          laptopFrame(c, W, H, r);
          const x = 100, w = W - 200;
          const typed = (t: string, k: number) => (k >= 1 ? t : t.slice(0, Math.floor(t.length * k)) + "|");
          if (b.prop === "write") {   // Sir asks for an essay; it writes one in seconds
            let y = 520;
            y = bubbleT(c, "Write an essay: My Hometown", x, y, w, "me", 54, seg(f, ln.from - 4, ln.from + 8)) + 30;
            const q = seg(f, ln.from + Math.round(ln.frames * 0.45), end(ln) + 2);
            if (q <= 0) typing(c, x, y, f);
            else {
              c.save(); c.fillStyle = "#e5e7eb"; rrect(c, x, y, w - 60, 520, 28); c.fill();
              c.font = SANS(40, 500); c.fillStyle = INK; c.textAlign = "left";
              const t = typed(ESSAY, q), words = t.split(" "); let line = "", yy = y + 66;
              words.forEach((wd) => { const tl = line ? line + " " + wd : wd; if (c.measureText(tl).width > w - 120) { c.fillText(line, x + 30, yy); yy += 54; line = wd; } else line = tl; });
              c.fillText(line, x + 30, yy); c.restore();
              label(c, "written in 3 seconds", W / 2, 1290, 60, COL.red, caveat, seg(f, end(ln) - 6, end(ln) + 4));
            }
          }
          if (b.prop === "newchat" || b.prop === "deny") {   // a NEW chat (it can't see the old one), the same essay pasted in
            const k0 = b.prop === "newchat" ? easeOut(seg(f, ln.from, ln.from + 8)) : 1;
            c.save(); c.fillStyle = "#f8fafc"; c.fillRect(60, 490, W - 120, 1030); c.restore();
            c.save(); c.translate(W - 330, 440); c.scale(0.9 + 0.1 * k0, 0.9 + 0.1 * k0);
            c.fillStyle = b.prop === "newchat" && p < 0.3 ? COL.yellow : "#e0e7ff"; rrect(c, -10, -40, 260, 64, 32); c.fill();
            c.font = SANS(32); c.fillStyle = UI; c.textAlign = "left"; c.fillText("+ New chat", 18, 4); c.restore();
            let y = 530;
            const pk = b.prop === "newchat" ? seg(f, ln.from + Math.round(ln.frames * 0.3), ln.from + Math.round(ln.frames * 0.45)) : 1;
            y = docCard(c, x + 120, y, w - 120, { title: "pasted: the essay it just wrote", who: "written by this chatbot", year: "10 sec", snippet: ESSAY.slice(0, 40) }, pk) + 26;
            const ak = b.prop === "newchat" ? seg(f, ln.from + Math.round(ln.frames * 0.65), ln.from + Math.round(ln.frames * 0.8)) : 1;
            y = bubbleT(c, "Did you write this?", x, y, w, "me", 56, ak) + 40;
            if (b.prop === "deny") {
              const no = seg(f, ln.from - 2, ln.from + 5);
              if (no <= 0) typing(c, x, y, f); else bubbleT(c, "No, I did not write this.", x, y, w, "ai", 62, no, COL.red);
            } else if (ak >= 1) typing(c, x, y, f);
          }
          quiz(c, W, n, f, ln, r);
          return;
        }
        if (shot === "why") {   // why it says yes: it keeps no copy of what it wrote; "right?" steers the answer
          c.fillStyle = "#fdf6e3"; c.fillRect(0, 0, W, H);
          hatch(c, [0, 0, W, H], ["#f5e6c8"], r, { gap: 18, w: 3, alpha: 0.4 });
          const c1 = cueAt(ln, 1, ln.from + Math.round(ln.frames * 0.5));
          const k1 = easeOut(seg(f, ln.from - 6, ln.from + 10)), k2 = easeOut(seg(f, c1 - 6, c1 + 10));
          // left: a cabinet of "everything I ever wrote", empty
          c.save(); c.globalAlpha = clamp(k1 * 1.5);
          c.fillStyle = "#94a3b8"; rrect(c, 120, 330, 380, 470, 18); c.fill();
          [0, 1, 2].forEach((j) => { c.fillStyle = "#cbd5e1"; rrect(c, 145, 355 + j * 150, 330, 130, 10); c.fill(); c.fillStyle = "#475569"; rrect(c, 270, 405 + j * 150, 80, 22, 8); c.fill(); });
          label(c, "everything", 310, 880, 60, INK, caveat);
          label(c, "it ever wrote", 310, 940, 60, INK, caveat);
          c.restore();
          stamp(c, "CAN'T CHECK", 310, 600, 70, COL.red, seg(f, ln.from + 8, ln.from + 14), r, -0.12);
          // right: so every answer is a coin toss
          c.save(); c.globalAlpha = clamp(k2 * 1.5);
          const spin = Math.cos(f * 0.3), face = spin > 0;   // never edge-on: it read as a blank line in the stills
          c.save(); c.translate(770, 600); c.scale(0.45 + 0.55 * Math.abs(spin), 1);
          c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fillStyle = face ? "#16a34a" : COL.red; c.fill();
          stroke(c, circlePts(0, 0, 150, 150), INK, 8, r, { passes: 2 });
          c.font = SANS(80); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(face ? "YES" : "NO", 0, 28);
          c.restore();
          label(c, "so it guesses", 770, 880, 64, INK, caveat);
          c.restore();
          // the bottom line, big
          const k3 = easeOut(seg(f, c1 + 14, c1 + 24));
          if (k3 > 0) {
            c.save(); c.globalAlpha = k3; c.translate(W / 2, 1150); c.rotate(-0.02);
            c.fillStyle = UI; rrect(c, -460, -100, 920, 200, 26); c.fill();
            c.font = SANS(52); c.fillStyle = "#fff"; c.textAlign = "center";
            c.fillText("A chatbot CAN'T tell", 0, -16); c.fillText("if it wrote something", 0, 52);
            c.restore();
            label(c, "And her essay? It never even saw her laptop.", W / 2, 1310, 46, INK, caveat, k3);
          }
          quiz(c, W, n, f, ln, r);
          return;
        }
        if (shot === "phone") {   // Priya's phone: the essay's version history
          c.fillStyle = "#e7dcc0"; c.fillRect(0, 0, W, H);
          hatch(c, [0, 0, W, H], ["#d8caa6"], r, { gap: 20, w: 3, alpha: 0.4 });
          const up = easeOut(seg(p, 0, 0.12));
          c.save(); c.translate(0, (1 - up) * 500);
          c.fillStyle = "#111827"; rrect(c, 210, 230, 660, 1240, 60); c.fill();
          c.fillStyle = "#f8fafc"; rrect(c, 236, 262, 608, 1176, 40); c.fill();
          c.font = SANS(40); c.fillStyle = UI; c.textAlign = "left"; c.fillText("Version history", 276, 350);
          c.font = SANS(28, 500); c.fillStyle = "#64748b"; c.fillText("My Hometown (essay)", 276, 396);
          const rows: [string, string, number][] = [["Today, 2:04 AM", "final read", 1], ["Today, 1:31 AM", "paragraph 3", 0.75], ["Yesterday, 11:48 PM", "paragraph 2", 0.55], ["Yesterday, 10:15 PM", "started", 0.35]];
          rows.forEach(([t, what, w], k) => {
            const y = 470 + k * 190, q = seg(p, 0.08 + k * 0.08, 0.16 + k * 0.08);
            if (q <= 0) return;
            c.save(); c.globalAlpha = q;
            c.fillStyle = k === 0 ? "#dcfce7" : "#f1f5f9"; rrect(c, 266, y, 548, 160, 18); c.fill();
            c.font = SANS(36); c.fillStyle = UI; c.fillText(t, 296, y + 56);
            c.font = SANS(28, 500); c.fillStyle = "#475569"; c.fillText(`Priya · ${what}`, 296, y + 104);
            c.fillStyle = "#16a34a"; rrect(c, 296, y + 124, 480 * w, 12, 6); c.fill();
            c.restore();
          });
          c.restore();
          // the student's thumbs at the phone's edges
          [[200, 1240], [880, 1260]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y + (1 - up) * 500, 46, 70, 0, 0, 7); c.fillStyle = SKIN_P; c.fill(); });
          // the rule, as a big chip over the bottom (sound-off viewers)
          const c1 = cueAt(ln, 1, ln.from + Math.round(ln.frames * 0.45));
          const kr = easeOut(seg(f, c1 - 4, c1 + 8));
          if (kr > 0) {
            c.save(); c.globalAlpha = kr; c.translate(W / 2, 1150); c.scale(0.9 + 0.1 * kr, 0.9 + 0.1 * kr);
            c.fillStyle = "#fef08a"; rrect(c, -480, -180, 960, 370, 26); c.fill();
            c.save(); c.lineWidth = 6; c.strokeStyle = INK; rrect(c, -480, -180, 960, 370, 26); c.stroke(); c.restore();
            c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("Chatbot says \"I wrote it\" = NOT proof", 0, -104);
            c.font = SANS(44); c.fillStyle = INK; c.fillText("Proof: drafts + version history", 0, -30);
            c.fillText("+ explain it in your own words", 0, 40);
            c.font = SANS(34, 600); c.fillStyle = "#166534"; c.fillText("Tip: write in Docs or Word, they save your history", 0, 132);
            c.restore();
          }
          return;
        }

        // ----- the staff room (POV) -----
        let cam = CAM[shot] ?? CAM.pov;
        if (n === 1) { const q = easeOut(seg(p, 0.35, 0.55)); cam = { z: 1 + 0.08 * q, x: 520, y: 980 }; }   // a punch-in on "confessed"
        const z = cam.z * (1 + 0.025 * p);
        const shake = n === 1 && f < 8 ? 10 : n === 6 && p < 0.15 ? 8 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.fillStyle = WALL; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(540 + sx, 960 + sy); c.scale(z, z); c.translate(-cam.x, -cam.y);
        const chatUp = n <= 3 || n >= 13;
        room(c, f, r, !chatUp);
        const [m, a] = SIR[n] ?? ["stern", "rest"];
        const sm = n === 1 && p < 0.1 ? "stern" : m;
        deskBase(c, r);
        sir(c, sm, a, talking("sir"), f - ln.from, r);
        deskItems(c, r, { zero: 1, laptop: chatUp ? "front" : "back", chat: 1 });
        sir(c, sm, a, false, f - ln.from, r, "hands");
        c.restore();
        hands(c, HANDS[n] ?? "", p, f, r);

        // the chat from the laptop, big at the top (frame 1 reads without sound)
        if (chatUp) {
          c.save(); c.fillStyle = "rgba(15,23,42,0.93)"; rrect(c, 70, 300, W - 140, 420, 34); c.fill();
          c.font = SANS(30, 600); c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText("SIR'S LAPTOP · AI Chat", 110, 350);
          c.restore();
          if (n <= 3) {
            bubbleT(c, "You wrote this essay, right?", 110, 378, W - 220, "me", 52, 1);
            bubbleT(c, "Yes, I wrote this essay.", 110, 506, W - 220, "ai", 58, 1, "#16a34a");
          } else {   // the twist: his own notes, from 2012 (ten years before ChatGPT)
            bubbleT(c, "Did you write my lecture notes?", 110, 378, W - 220, "me", 50, n === 13 ? seg(p, 0.05, 0.2) : 1);
            c.save(); c.globalAlpha = n === 13 ? seg(p, 0.2, 0.35) : 1;
            c.fillStyle = "#fffdf5"; rrect(c, 430, 490, 540, 76, 16); c.fill();
            c.font = SANS(32); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Unit3_notes.docx", 452, 540);
            c.fillStyle = COL.red; rrect(c, 790, 502, 164, 52, 26); c.fill();
            c.font = SANS(32); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("2012", 872, 540);
            c.restore();
            if (n >= 14) bubbleT(c, "Yes.", 110, 600, W - 220, "ai", 64, n === 14 ? seg(f, ln.from, ln.from + 5) : 1, "#16a34a");
          }
          stroke(c, [[860, 720], [820, 900]], "rgba(15,23,42,0.6)", 6, r, { passes: 1 });   // to the laptop on the desk
        }
        if (n <= 2) {   // the POV line, under the reel's title bar (it was hidden behind it)
          c.save(); c.translate(W / 2, 246); c.rotate(-0.015);
          c.fillStyle = COL.yellow; rrect(c, -380, -42, 760, 84, 20); c.fill();
          c.font = SANS(48); c.fillStyle = INK; c.textAlign = "center"; c.fillText("POV: you wrote it yourself", 0, 16);
          c.restore();
        }
        if (n <= 3) stamp(c, "AI COPY", 230, 1180, 84, COL.red, 1, r, -0.12);
        if (n === 2) {   // "At 2 AM": the clock she wrote it by
          const q = easeOut(seg(p, 0.45, 0.6));
          c.save(); c.globalAlpha = q; c.translate(890, 1250); c.rotate(0.04);
          c.fillStyle = COL.yellow; rrect(c, -150, -56, 300, 112, 20); c.fill();
          c.font = SANS(64); c.fillStyle = INK; c.textAlign = "center"; c.fillText("2:04 AM", 0, 22);
          c.restore();
        }
        if (n === 10) {   // our test, as a card: one row, its OWN essays, and OpenAI's own words (script review: one thing to read)
          const k = easeOut(seg(f, ln.from - 28, ln.from - 14));
          c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
          c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k);
          c.fillStyle = "#fffdf5"; rrect(c, -480, -440, 960, 860, 30); c.fill();
          c.font = SANS(60); c.fillStyle = INK; c.textAlign = "center"; c.fillText("WE TESTED IT", 0, -350);
          c.font = SANS(32, 500); c.fillStyle = "#475569"; c.fillText("a free AI chatbot · a new chat each time", 0, -296);
          c.font = SANS(42); c.fillStyle = INK; c.fillText("10 essays IT wrote, minutes before:", 0, -200);
          const kk = easeOut(seg(f, ln.from - 10, ln.from + 12));
          c.fillStyle = "#e2e8f0"; rrect(c, -420, -160, 840, 110, 20); c.fill();
          c.fillStyle = COL.red; rrect(c, -420, -160, 840 * ((D.own_no ?? 0) / (D.n_own ?? 10)) * kk, 110, 20); c.fill();
          c.font = SANS(56); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("\"Not mine\"", -390, -86);
          c.textAlign = "right"; c.fillText(`${Math.round((D.own_no ?? 0) * kk)}/${D.n_own ?? 10}`, 400, -86);
          const kq = easeOut(seg(f, ln.from + 14, ln.from + 26));
          c.save(); c.globalAlpha = kq; c.fillStyle = UI; rrect(c, -440, 10, 880, 330, 24); c.fill();
          c.font = SANS(36, 600); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("OpenAI's own FAQ for teachers (2023):", 0, 76);
          c.font = SANS(40); c.fillStyle = "#fff";
          c.fillText("ChatGPT's answers to", 0, 150); c.fillText("\"did you write this?\"", 0, 206);
          c.font = SANS(56); c.fillStyle = "#facc15"; c.fillText("are \"random\"", 0, 288);
          c.restore();
          c.restore();
        }
        if (n === 11 || n === 12) {   // (12 is the phone insert; 11 keeps the room)
          // nothing extra
        }
        quiz(c, W, n, f, ln, r);
        if (f0 >= freezeAt) {   // a short freeze on his face, then the loop snaps back to the zero
          c.save(); c.globalAlpha = 0.2; c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H); c.restore();
        }
        void Math.max;
      }} />
    </>
  );
};

export const CLASS_SCENES = { sk_class: SkClass };
