import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";

// Creative 10 "The AI gave me three months" (series/scripts/creative10_three_months.md): a Telugu TV-serial parody in a
// living room. Thathayya (72) asked an AI chat app "HbA1c 7.2 meaning" and read "over the past 2 to 3 months" as a
// countdown. Kamala (his daughter-in-law) and Tommy (the dog) get the serial treatment too: three snap zooms, thunder,
// "dhan dhan dhan". Sravani (19) reads it: a report on the past three months, not a countdown; four words got a textbook
// written for doctors; the line to type: "Explain this to my 72-year-old grandfather in simple words. Then give 3
// questions to ask his doctor." The calm reply, the laddus, our test (series/scripts/creative10_demo), the Oxford study
// "AI explains. The doctor decides." He types three words about laddus, the app shows
// "is typing", and the replay opens on his panic (frame 1). The AI's words on the phone are its real replies, shortened.
// One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "shock" | "cry" | "worried" | "calm" | "deadpan" | "smug" | "sheepish" | "happy" | "sus" | "sneaky";
type Arms = "rest" | "phoneUp" | "chest" | "hug" | "type" | "plead" | "ladle" | "cheeks" | "fold" | "phone" | "take" | "point" | "palm";
type Who = "thatha" | "kamala" | "sravani";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", RED = "#dc2626", PURPLE = "#7c3aed", NAVY = "#1e293b";
const LOOK: Record<Who, { skin: string; hair: string; top: string; s: number }> = {
  thatha: { skin: "#a0704c", hair: "#e5e7eb", top: "#f8fafc", s: 1.0 },
  kamala: { skin: "#9b6643", hair: "#18120f", top: "#15803d", s: 0.98 },
  sravani: { skin: "#a8724c", hair: "#0f0c0a", top: "#7c3aed", s: 0.94 },
};
// necks in the living room's wide shot (world = the wide shot)
const AT: Record<Who, Pt> = { thatha: [540, 820], kamala: [205, 760], sravani: [880, 750] };
const TABLE = 1205;   // the coffee table's top edge: it hides Thathayya's lap
const BOX: Pt = [680, 1150];   // the laddu box on the table

// ---------- people ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, rad = 24) => {
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, rad, rad), INK, 3, r, { passes: 1, alpha: 0.55 });
};
// a phone in a hand; big = Thathayya's, the font at maximum ("2 to 3 months" fills it)
const phoneProp = (c: Ctx, x: number, y: number, s: number, rot: number, big = false) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "#111827"; rrect(c, -48, -86, 96, 172, 16); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, -40, -76, 80, 152, 10); c.fill();
  if (big) { c.font = SANS(17, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("2 to 3", 0, -14); c.fillText("months", 0, 8); stroke(c, circlePts(0, -4, 36, 22), RED, 3, () => 0.5, { passes: 1 }); }
  else { c.fillStyle = "rgba(124,58,237,0.5)"; rrect(c, -30, -50, 60, 12, 5); c.fill(); c.fillStyle = "rgba(15,23,42,0.25)"; [-26, -8, 10, 28].forEach((yy) => { rrect(c, -30, yy, 60, 8, 4); c.fill(); }); }
  c.restore();
};
const ladle = (c: Ctx, x: number, y: number, rot: number, r: () => number) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  stroke(c, [[0, 0], [0, -150]], "#78716c", 12, r, { passes: 2 });
  c.beginPath(); c.ellipse(0, -172, 34, 26, 0, 0, 7); c.fillStyle = "#a8a29e"; c.fill();
  stroke(c, circlePts(0, -172, 34, 26), INK, 3, r, { passes: 1, alpha: 0.6 });
  c.restore();
};
// the laddu box (a pink sweet-shop box, lid open, six laddus)
const laddus = (c: Ctx, x: number, y: number, s: number, r: () => number, glow = 0) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (glow > 0) { c.globalAlpha = glow; c.beginPath(); c.arc(0, -20, 150, 0, 7); c.fillStyle = "rgba(250,204,21,0.45)"; c.fill(); c.globalAlpha = 1; }
  c.fillStyle = "#f9a8d4"; rrect(c, -95, -40, 190, 70, 10); c.fill();
  c.fillStyle = "#fbcfe8"; c.beginPath(); c.moveTo(-95, -40); c.lineTo(-80, -110); c.lineTo(110, -110); c.lineTo(95, -40); c.closePath(); c.fill();
  stroke(c, rrectPts(-95, -40, 190, 70), INK, 3, r, { passes: 1, alpha: 0.6 });
  [-58, 0, 58].forEach((lx) => [-46, -14].forEach((ly, k) => {
    c.beginPath(); c.arc(lx + (k ? 0 : 0), ly, 26, 0, 7); c.fillStyle = "#f59e0b"; c.fill();
    for (let d = 0; d < 6; d++) { c.beginPath(); c.arc(lx - 12 + (d % 3) * 12, ly - 8 + Math.floor(d / 3) * 14, 3, 0, 7); c.fillStyle = "#b45309"; c.fill(); }
  }));
  c.font = SANS(22, 900); c.fillStyle = "#9d174d"; c.textAlign = "center"; c.fillText("SWEETS", 0, 18);
  c.restore();
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  if (who === "kamala") { c.fillStyle = L.hair; c.beginPath(); c.arc(-70, hy - 70, 44, 0, 7); c.fill(); }   // a bun at the back
  if (who === "sravani") {   // a ponytail swinging out on her left
    c.fillStyle = L.hair; c.beginPath(); c.moveTo(70, hy - 90); c.quadraticCurveTo(170, hy - 60, 150, hy + 80); c.quadraticCurveTo(120, hy - 20, 60, hy - 50); c.closePath(); c.fill();
  }
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "thatha") {   // bald on top, white tufts over the ears
    [-1, 1].forEach((sx) => { c.moveTo(sx * 96, hy - 10); c.quadraticCurveTo(sx * 108, hy - 70, sx * 64, hy - 92); c.quadraticCurveTo(sx * 80, hy - 40, sx * 80, hy - 4); });
  } else if (who === "kamala") {   // parted in the middle, pulled back
    c.ellipse(0, hy - 56, 100, 72, 0, Math.PI, 0); c.lineTo(100, hy + 4); c.quadraticCurveTo(52, hy - 58, 4, hy - 80); c.lineTo(-4, hy - 80); c.quadraticCurveTo(-52, hy - 58, -100, hy + 4);
  } else {   // a fringe swept to one side
    c.ellipse(0, hy - 58, 102, 70, 0, Math.PI, 0); c.lineTo(100, hy - 10); c.quadraticCurveTo(30, hy - 50, -20, hy - 96); c.quadraticCurveTo(-70, hy - 40, -100, hy - 6);
  }
  c.closePath(); c.fill();
  if (who === "thatha") [-34, -14, 6].forEach((dy, k) => stroke(c, [[-40 + k * 6, hy - 70 + dy * 0.2], [40 - k * 6, hy - 70 + dy * 0.2]], "#7c4a2b", 3, r, { passes: 1, alpha: 0.5 }));   // forehead lines
  if (who === "kamala") { c.beginPath(); c.arc(0, hy - 46, 9, 0, 7); c.fillStyle = RED; c.fill(); }   // a bindi
  const browCol = who === "thatha" ? "#d4d4d8" : L.hair;
  const brow = m === "sheepish" || m === "cry" || m === "worried" ? [-180, -160] : m === "shock" ? [-186, -184] : m === "deadpan" ? [-158, -158] : [-164, -164];
  [-1, 1].forEach((sx) => {
    let [yi, yo] = brow;
    if (m === "smug" || m === "sus" || m === "sneaky") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], browCol, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "cry") {
      c.beginPath(); c.ellipse(ex, ey, 19, 22, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 3, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "deadpan") {   // half-lidded: unimpressed
      c.beginPath(); c.arc(ex, ey + 4, 9, 0, 7); c.fillStyle = INK; c.fill();
      c.fillStyle = L.skin; c.fillRect(ex - 16, ey - 16, 32, 15); stroke(c, [[ex - 16, ey - 1], [ex + 16, ey - 1]], INK, 5, r, { passes: 1 });
    } else if (m === "smug" || m === "sus" || m === "sneaky") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
      if (m === "sneaky") { c.beginPath(); c.arc(ex + 9, ey + 4, 6, 0, 7); c.fillStyle = INK; c.fill(); }
    } else if (m === "sheepish" || m === "worried") {
      c.beginPath(); c.arc(ex + 4, ey + 4, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (who === "thatha") {   // round glasses
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 31, 27), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  if (who === "thatha") { c.fillStyle = "#f4f4f5"; c.beginPath(); c.ellipse(-22, hy + 56, 30, 12, 0.25, 0, 7); c.ellipse(22, hy + 56, 30, 12, -0.25, 0, 7); c.fill(); }   // a white moustache
  const my = hy + 80, open = talk || m === "shock" || m === "cry";
  if (open) {
    const w = m === "cry" ? 30 : m === "shock" ? 26 : 21, h = m === "cry" ? 20 : m === "shock" ? 24 : 12;
    c.beginPath(); c.ellipse(0, my + (who === "thatha" ? 6 : 0), w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "happy" ? 30 : 22, m === "happy" ? 16 : 10, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug" || m === "sus" || m === "sneaky") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "sheepish" || m === "worried") stroke(c, [[-18, my + 6], [0, my], [18, my + 6]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (m === "cry") [-1, 1].forEach((sx) => {   // serial tears: two streams
    c.fillStyle = "#7dd3fc"; c.beginPath(); c.moveTo(sx * 40, hy + 18); c.quadraticCurveTo(sx * 52, hy + 70, sx * 44, hy + 110); c.quadraticCurveTo(sx * 30, hy + 70, sx * 40, hy + 18); c.fill();
  });
  if (m === "sheepish" || m === "shock" || m === "worried") { c.beginPath(); c.moveTo(92, hy - 70); c.quadraticCurveTo(112, hy - 40, 92, hy - 30); c.quadraticCurveTo(76, hy - 40, 92, hy - 70); c.fillStyle = "#7dd3fc"; c.fill(); }   // a sweat drop
  if (who === "kamala") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 28, 8, 0, 7); c.fillStyle = "#facc15"; c.fill(); });
  if (who === "sravani") {   // one earphone in, its wire down to the hoodie pocket
    c.beginPath(); c.arc(-94, hy + 8, 10, 0, 7); c.fillStyle = "#fff"; c.fill(); stroke(c, [[-94, hy + 18], [-104, hy + 120], [-80, hy + 300]], "#f8fafc", 4, r, { passes: 1 });
  }
};
const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number, ladleDrop = 0) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(L.s * sc, L.s * sc);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.quadraticCurveTo(178, 330, 192, 780); c.lineTo(-192, 780);
  c.quadraticCurveTo(-178, 330, -140, 34); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "thatha") {   // a white kurta with a button placket and a beige shawl over one shoulder
    stroke(c, [[0, 30], [0, 300]], "#cbd5e1", 4, r, { passes: 1 }); [80, 150, 220].forEach((y) => { c.beginPath(); c.arc(8, y, 6, 0, 7); c.fillStyle = "#cbd5e1"; c.fill(); });
    c.fillStyle = "#d6c7a1"; c.beginPath(); c.moveTo(60, 24); c.lineTo(150, 24); c.lineTo(200, 700); c.lineTo(110, 700); c.closePath(); c.fill();
  }
  if (who === "kamala") {   // a green saree, a gold-bordered pallu over the shoulder
    c.fillStyle = "#166534"; c.beginPath(); c.moveTo(-150, 24); c.lineTo(-30, 24); c.lineTo(200, 640); c.lineTo(70, 780); c.closePath(); c.fill();
    stroke(c, [[-30, 24], [200, 640]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 }); stroke(c, [[-150, 24], [70, 780]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 });
  }
  if (who === "sravani") {   // a purple hoodie: the hood behind the neck, a pocket, drawstrings
    c.fillStyle = "#6d28d9"; c.beginPath(); c.ellipse(0, 40, 120, 40, 0, 0, 7); c.fill();
    stroke(c, [[-30, 50], [-34, 170]], "#f8fafc", 5, r, { passes: 1 }); stroke(c, [[30, 50], [34, 170]], "#f8fafc", 5, r, { passes: 1 });
    stroke(c, rrectPts(-110, 330, 220, 110), "#5b21b6", 6, r, { passes: 1 });
  }
  c.restore();
  stroke(c, [[-140, 34], [-180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  if (who === "kamala" || who === "thatha") {   // a thin gold chain / a sacred thread line
    stroke(c, circlePts(0, 30, 54, 60, 0.15, Math.PI - 0.15, 14), who === "kamala" ? "#eab308" : "#fef3c7", 4, r, { passes: 1 });
  }
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  const sleeve = who === "kamala" ? "#15803d" : L.top;
  let l: Pt[] = [[-178, 230], [-150, 380]], rr: Pt[] = [[178, 230], [150, 380]];
  if (a === "phoneUp") rr = [[150, -20], [118, -150]];   // the phone beside his face, screen to us
  else if (a === "chest") { l = [[-120, 200], [-30, 120]]; rr = [[170, 40], [150, -120]]; }   // a hand on his heart, the phone up
  else if (a === "hug") { l = [[-150, 240], [40, 300]]; rr = [[150, 240], [-40, 290]]; }
  else if (a === "type") { l = [[-150, 230], [-50, 160]]; rr = [[150, 230], [50, 160]]; }
  else if (a === "plead") { l = [[-200, 120], [-130, -20]]; rr = [[200, 120], [130, -20]]; }
  else if (a === "ladle") rr = [[210, 40], [250, -120]];
  else if (a === "cheeks") { l = [[-170, 120], [-96, -100]]; rr = [[170, 120], [96, -100]]; }
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  else if (a === "phone") rr = [[182, 220], [118, 120]];
  else if (a === "take") l = [[-180, 60], [-236, -120]];   // reaching for his phone
  else if (a === "point") rr = [[220, 30], [320, -110]];
  else if (a === "palm") rr = [[200, 120], [250, -20]];
  const front = a === "cheeks" || a === "hug";
  if (!front) { limb(c, [S, l[0], l[1]], sleeve, r); palm(c, l[1][0], l[1][1], L.skin, r); limb(c, [R, rr[0], rr[1]], sleeve, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  if (a === "phoneUp") phoneProp(c, 120, -190, 1.45, 0.08, who === "thatha");
  if (a === "chest") phoneProp(c, 150, -160, 1.3, 0.1, true);
  if (a === "phone" || a === "type") phoneProp(c, a === "type" ? 0 : 126, a === "type" ? 150 : 60, 1, a === "type" ? 0 : -0.1);
  if (a === "ladle") ladle(c, 250, -110, 0.15, r);
  face(c, who, m, talk, r);
  if (front) {
    if (a === "hug") laddus(c, 0, 250, 1.3, r);
    limb(c, [S, l[0], l[1]], sleeve, r); palm(c, l[1][0], l[1][1], L.skin, r); limb(c, [R, rr[0], rr[1]], sleeve, r); palm(c, rr[1][0], rr[1][1], L.skin, r);
  }
  c.restore();
  if (ladleDrop > 0) {   // the ladle she dropped, falling past her and clattering on the floor
    const q = easeOut(clamp(ladleDrop)), x = at[0] + 260 * L.s * sc, y0 = at[1] - 110, y1 = 1420;
    ladle(c, x + 40 * q, y0 + (y1 - y0) * q * q, 0.15 + 1.4 * q, r);
  }
};

// ---------- the living room ----------
const room = (c: Ctx, W: number, f: number, r: () => number, bolt: number) => {
  c.fillStyle = "#f3dfb0"; c.fillRect(-400, -200, W + 800, 2400);
  c.fillStyle = "#e9cf97"; c.fillRect(-400, 640, W + 800, 30);   // a dado line
  // the window: evening sky, curtains; lightning when the thunder hits
  c.fillStyle = bolt > 0 ? `rgba(226,232,240,${0.6 + 0.4 * bolt})` : "#1e3a8a"; rrect(c, 70, 230, 300, 330, 10); c.fill();
  if (bolt > 0) stroke(c, [[230, 240], [190, 330], [240, 340], [180, 460], [215, 470], [170, 560]], "#facc15", 10, r, { passes: 2, alpha: bolt });
  stroke(c, rrectPts(70, 230, 300, 330), "#78350f", 10, r, { passes: 2 }); stroke(c, [[220, 230], [220, 560]], "#78350f", 7, r, { passes: 1 });
  c.fillStyle = "#b91c1c"; c.beginPath(); c.moveTo(50, 210); c.quadraticCurveTo(110, 400, 70, 590); c.lineTo(40, 590); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(390, 210); c.quadraticCurveTo(330, 400, 370, 590); c.lineTo(400, 590); c.closePath(); c.fill();
  // a ceiling fan turning
  stroke(c, [[540, -60], [540, 90]], "#57534e", 8, r, { passes: 1 }); c.beginPath(); c.arc(540, 100, 24, 0, 7); c.fillStyle = "#57534e"; c.fill();
  for (let k = 0; k < 3; k++) { const a = f / 4 + (k * Math.PI * 2) / 3; c.save(); c.translate(540, 100); c.scale(1, 0.25); c.rotate(a); c.fillStyle = "#78716c"; rrect(c, 0, -14, 200, 28, 12); c.fill(); c.restore(); }
  // a family photo, a calendar
  c.fillStyle = "#92400e"; rrect(c, 600, 250, 190, 150, 8); c.fill(); c.fillStyle = "#fde68a"; rrect(c, 614, 264, 162, 122, 4); c.fill();
  [650, 700, 745].forEach((x, k) => { c.beginPath(); c.arc(x, 310 + (k === 1 ? -6 : 0), 16, 0, 7); c.fillStyle = "#a16207"; c.fill(); c.fillRect(x - 18, 328, 36, 40); });
  c.fillStyle = "#fff"; rrect(c, 860, 250, 150, 200, 6); c.fill(); c.fillStyle = RED; c.fillRect(860, 250, 150, 50);
  c.font = SANS(30, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("OCT", 935, 286);
  c.font = SANS(64, 900); c.fillStyle = INK; c.fillText("26", 935, 380); c.font = SANS(22, 700); c.fillText("2026", 935, 425);
  // the sofa (teal), its back behind Thathayya
  c.fillStyle = "#0f766e"; rrect(c, 150, 700, 780, 330, 60); c.fill();
  c.fillStyle = "#115e59"; rrect(c, 110, 860, 120, 280, 40); c.fill(); rrect(c, 850, 860, 120, 280, 40); c.fill();
  c.fillStyle = "#f59e0b"; rrect(c, 230, 800, 120, 110, 24); c.fill(); c.fillStyle = "#e11d48"; rrect(c, 740, 800, 120, 110, 24); c.fill();
  // the floor: tiles
  c.fillStyle = "#d6d3d1"; c.fillRect(-400, 1290, W + 800, 1200);
  c.strokeStyle = "rgba(120,113,108,0.35)"; c.lineWidth = 3;
  for (let x = -400; x < W + 400; x += 150) { c.beginPath(); c.moveTo(x, 1290); c.lineTo(x - 120, 2400); c.stroke(); }
  [1400, 1560, 1760].forEach((y) => { c.beginPath(); c.moveTo(-400, y); c.lineTo(W + 400, y); c.stroke(); });
};
const sofaSeat = (c: Ctx) => { c.fillStyle = "#14b8a6"; rrect(c, 200, 1080, 680, 130, 30); c.fill(); };
const table = (c: Ctx, W: number, r: () => number, f: number, glow: number, box = true) => {
  c.fillStyle = "#7c2d12"; c.fillRect(250, TABLE, 580, 34);
  c.fillStyle = "#9a3412"; c.fillRect(270, TABLE + 34, 540, 120);
  stroke(c, [[250, TABLE], [830, TABLE]], INK, 5, r, { passes: 2, alpha: 0.6 });
  [290, 790].forEach((x) => { c.fillStyle = "#7c2d12"; c.fillRect(x - 12, TABLE + 150, 24, 130); });
  // the report on the table: a lab sheet with a red H
  c.save(); c.translate(400, TABLE - 8); c.rotate(-0.06); c.fillStyle = "#fff"; rrect(c, -90, -40, 180, 44, 4); c.fill();
  c.font = SANS(15, 800); c.fillStyle = NAVY; c.textAlign = "left"; c.fillText("HbA1c  7.2 %", -80, -12); c.fillStyle = RED; c.fillText("H", 60, -12); c.restore();
  if (box) laddus(c, BOX[0], BOX[1], 0.62, r, glow);   // off the table while he hugs it
  void W; void f;
};
// Tommy, lying on the floor at the front; sad = ears down, eyes up (the serial zoom's third victim)
const tommy = (c: Ctx, x: number, y: number, s: number, sad: boolean, f: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#b45309"; c.beginPath(); c.ellipse(70, 30, 120, 50, 0, 0, 7); c.fill();   // the body
  const wag = sad ? 0 : Math.sin(f / 2) * 0.4;
  c.save(); c.translate(185, 10); c.rotate(-0.6 + wag); c.fillStyle = "#b45309"; rrect(c, 0, -8, 70, 16, 8); c.fill(); c.restore();
  c.beginPath(); c.ellipse(-60, -20, 62, 56, 0, 0, 7); c.fill();   // the head
  c.beginPath(); c.ellipse(-110, 0, 34, 24, 0, 0, 7); c.fillStyle = "#d97706"; c.fill();   // the snout
  c.beginPath(); c.arc(-136, -6, 10, 0, 7); c.fillStyle = INK; c.fill();
  [-1, 1].forEach((sx) => {   // ears: up when happy, flat when sad
    c.save(); c.translate(-60 + sx * 40, -60); c.rotate(sad ? sx * 1.2 : sx * 0.3);
    c.fillStyle = "#78350f"; c.beginPath(); c.ellipse(0, sad ? 30 : 10, 20, 40, 0, 0, 7); c.fill(); c.restore();
  });
  [-82, -44].forEach((ex) => {
    c.beginPath(); c.arc(ex, -30, sad ? 13 : 9, 0, 7); c.fillStyle = sad ? "#fff" : INK; c.fill();
    if (sad) { c.beginPath(); c.arc(ex, -36, 8, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (sad) stroke(c, [[-96, -52], [-74, -46]], INK, 5, r, { passes: 1 });
  [-20, 60, 130].forEach((px) => { c.beginPath(); c.ellipse(px - 40, 72, 26, 14, 0, 0, 7); c.fillStyle = "#92400e"; c.fill(); });
  c.restore();
};

// ---------- serial effects ----------
// the triple zoom: three snaps 5 frames apart (dhan3.wav's hits are 0.17 s apart), then a hold with a tremble
const TRIPLE = [1.0, 1.2, 1.42, 1.62];
const triple = (f: number, at: number) => {
  const d = f - at;
  if (d < 0) return { z: 1, step: -1 };
  const step = Math.min(3, Math.floor(d / 5) + 1);
  return { z: TRIPLE[step], step };
};
const flashOver = (c: Ctx, W: number, H: number, f: number, at: number, r: () => number) => {
  const d = f - at;
  if (d < 0 || d > 22) return;
  const step = Math.floor(d / 5);
  const fresh = d % 5 < 3 && step < 3;
  if (fresh) { c.fillStyle = step % 2 ? "rgba(37,99,235,0.28)" : "rgba(220,38,38,0.3)"; c.fillRect(0, 0, W, H); }
  const k = clamp(1 - d / 22);
  c.save(); c.globalAlpha = 0.55 * k;   // speed lines from the edges toward the face
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + (r() - 0.5) * 0.05, r0 = 520 + r() * 120, r1 = 1300;
    c.strokeStyle = i % 2 ? "#fff" : INK; c.lineWidth = 6 + r() * 6;
    c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, H * 0.42 + Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * r1, H * 0.42 + Math.sin(a) * r1); c.stroke();
  }
  c.restore();
};
const thunderFlash = (c: Ctx, W: number, H: number, f: number, at: number) => {
  const d = f - at;
  if (d < 0 || d > 6) return;
  c.fillStyle = `rgba(255,255,255,${0.45 * (1 - d / 6)})`; c.fillRect(0, 0, W, H);
};
const epTag = (c: Ctx, W: number) => {   // the serial's channel bug: a running gag, top right
  c.save(); c.globalAlpha = 0.9; c.fillStyle = "rgba(127,29,29,0.85)"; rrect(c, W - 330, 222, 290, 58, 12); c.fill();
  c.font = SANS(30, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("EPISODE 1,247", W - 185, 262); c.restore();
};

// ---------- the phone ----------
const aiAvatar = (c: Ctx, x: number, y: number, s: number, f: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-40, -40, 40, 40); g.addColorStop(0, "#8b5cf6"); g.addColorStop(1, "#ec4899");
  c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fillStyle = g; c.fill();
  c.rotate(f / 40); c.fillStyle = "#fff"; c.beginPath();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, q = k % 2 ? 7 : 24; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.fill(); c.restore();
};
const phoneScreen = (c: Ctx, W: number, H: number, f: number, r: () => number, sub: string) => {
  const g = c.createRadialGradient(W / 2, 800, 100, W / 2, 800, 1200); g.addColorStop(0, "#7f1d1d"); g.addColorStop(1, "#1c0a0a");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "#0b0b12"; rrect(c, 52, 222, W - 104, 1260, 70); c.fill();
  c.fillStyle = "#f1f5f9"; rrect(c, 76, 246, W - 152, 1212, 50); c.fill();
  aiAvatar(c, 160, 320, 0.9, f);
  c.font = caveat(56); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 218, 326);
  c.font = handF(30); c.fillStyle = "#64748b"; c.fillText(sub, 220, 362);
  stroke(c, [[96, 392], [W - 96, 392]], "#cbd5e1", 3, r, { passes: 1 });
};
type Ln = [string, boolean][];
const msg = (c: Ctx, W: number, y: number, lines: Ln, me: boolean, k: number, r: () => number, size = 42, col?: string) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const w = Math.max(...lines.map(([t]) => c.measureText(t).width)) + 60, h = lines.length * (size + 14) + 34;
  const x = me ? W - 116 - w : 106;
  c.fillStyle = col ?? (me ? "#dcf8c6" : "#fff"); rrect(c, x, y, w, h, 26); c.fill();
  stroke(c, rrectPts(x, y, w, h), "#cbd5e1", 2, r, { passes: 1 });
  lines.forEach(([t, hi], i) => {
    const ly = y + 30 + size + i * (size + 14) - 8;
    if (hi) { c.fillStyle = "#fde047"; c.fillRect(x + 22, ly - size + 2, c.measureText(t).width + 16, size + 12); }
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, x + 30, ly);
  });
  c.restore();
  return y + h + 24;
};
// the four-word reply (results.json, plain try 1), shortened where marked "..."; marks: [line, from, to] word spans
const WALL: string[] = [
  "The term “HbA1c” refers to glycated",
  "hemoglobin, which is a form of",
  "hemoglobin that has glucose attached",
  "to it. It is a measure used to",
  "determine the average blood sugar",
  "levels over the past 2 to 3 months.",
  "...the American Diabetes Association",
  "(ADA) and the European Association",
  "for the Study of Diabetes (EASD)...",
  "- with a history of hypoglycemia",
  "  (low blood sugar), less than 7.5%",
  "- with a shorter life expectancy or",
  "  significant comorbidities...",
];
const JARGON = ["glycated", "hemoglobin,", "glucose", "hypoglycemia", "(EASD)...", "comorbidities...", "shorter life expectancy"];   // the last: the note explains it
const wall = (c: Ctx, W: number, y0: number, past: number, circles: number, r: () => number, note = 0) => {
  const size = 36, lh = 52, x = 128;
  c.fillStyle = "#fff"; rrect(c, 106, y0, W - 212, WALL.length * lh + 44, 26); c.fill();
  stroke(c, rrectPts(106, y0, W - 212, WALL.length * lh + 44), "#cbd5e1", 2, r, { passes: 1 });
  c.font = SANS(size, 500); c.textAlign = "left";
  WALL.forEach((t, i) => {
    const ly = y0 + 30 + size + i * lh - 6;
    if (past > 0 && (i === 4 || i === 5)) {   // the sentence he misread
      const span = i === 4 ? t.indexOf("average") : 0, txt = i === 4 ? t.slice(span) : t.slice(0, t.indexOf("months") + 7);
      const x0 = x + c.measureText(t.slice(0, span)).width;
      c.globalAlpha = clamp(past * 3); c.fillStyle = "#fde047"; c.fillRect(x0 - 4, ly - size + 4, c.measureText(txt).width + 8, size + 10); c.globalAlpha = 1;
    }
    c.fillStyle = INK; c.fillText(t, x, ly);
    if (past > 0 && i === 5) {   // PAST underlined in red
      const a = t.indexOf("past"), x0 = x + c.measureText(t.slice(0, a)).width, w = c.measureText("past").width;
      stroke(c, [[x0, ly + 10], [x0 + w * clamp(past * 2), ly + 10]], RED, 7, r, { passes: 2 });
    }
    if (circles > 0) JARGON.forEach((jw, k) => {
      const a = t.indexOf(jw);
      if (a < 0 || circles < (k + 1) / JARGON.length - 0.001) return;
      const x0 = x + c.measureText(t.slice(0, a)).width, w = c.measureText(jw).width;
      stroke(c, circlePts(x0 + w / 2, ly - size * 0.32, w / 2 + 16, size * 0.78), RED, 5, r, { passes: 2 });
    });
  });
  if (note > 0) {   // the answer to "shorter life expectancy" (render review: it was circled and never explained)
    const ny = y0 + 30 + 12.6 * lh;   // below the phrase it explains (line 11 of the wall), over "comorbidities"
    c.save(); c.globalAlpha = clamp(note * 3); c.translate(W - 110, ny); c.rotate(-0.04); c.scale(0.9 + 0.1 * easeOut(note), 0.9 + 0.1 * easeOut(note));
    c.fillStyle = "rgba(4,8,40,0.25)"; rrect(c, -500, -36, 486, 250, 14); c.fill();
    c.fillStyle = "#fde047"; rrect(c, -508, -46, 486, 250, 14); c.fill();
    c.font = SANS(34, 800); c.fillStyle = INK; c.textAlign = "left";
    ["↑ = patients who get a", "looser sugar target.", "NOT a forecast.", "His target? Ask the doctor."].forEach((t, i) => c.fillText(t, -486, 2 + i * 50));
    c.restore();
  }
  return y0 + WALL.length * lh + 68;
};
// with the line (results.json, line try 1), shortened where marked "..."
const LINE: Ln = [["Explain this to my 72-year-old", true], ["grandfather in simple words. Then", true], ["give 3 questions to ask his doctor.", true], ["HbA1c 7.2%", false]];
const CALM: Ln = [["HbA1c ... It's like a report card", false], ["for his diabetes. A level of 7.2%", false], ["means his blood sugar has been", false],
  ["higher than ideal, but not extremely", false], ["high. ...needs to be watched closely.", false]];
const QS: Ln = [["Questions to ask his doctor:", false], ["1. What does 7.2% mean for", false], ["    my grandfather's health?", false],
  ["2. What changes can help improve it?", false], ["3. How often should we check it?", false]];
type ChatMode = "wall" | "line" | "laddu";
type Demo = { n: number; plain_jargon: number; line_jargon: number; line_questions: number; plain_questions: number; plain_words: number; line_words: number };
const chat = (c: Ctx, W: number, H: number, f: number, r: () => number, mode: ChatMode, k: number[], D: Demo) => {
  phoneScreen(c, W, H, f, r, "Thathayya's phone");
  if (mode === "wall") {
    const y = msg(c, W, 420, [["HbA1c 7.2 meaning", false]], true, 1, r, 46);
    wall(c, W, y, k[0] ?? 0, k[1] ?? 0, r, k[2] ?? 0);
  }
  if (mode === "line") {
    let y = msg(c, W, 420, LINE, true, 1, r, 36);
    y = msg(c, W, y, CALM, false, k[0] ?? 0, r, 36, "#ede9fe");
    msg(c, W, y, QS, false, k[1] ?? 0, r, 36, "#dcfce7");
  }
  if (mode === "laddu") {   // the loop: three words again, and it's typing (we cut before any reply: its real reply to these
    const y = msg(c, W, 420, [["laddu sugar patient", false]], true, 1, r, 46);   // three words was a request to clarify)
    if ((k[0] ?? 0) > 0) {
      c.save(); c.globalAlpha = clamp(k[0] * 3); c.fillStyle = "#fff"; rrect(c, 106, y, 220, 96, 30); c.fill();
      stroke(c, rrectPts(106, y, 220, 96), "#cbd5e1", 2, r, { passes: 1 });
      [0, 1, 2].forEach((d) => { const up = Math.sin(f / 3 - d) > 0.3 ? 8 : 0; c.beginPath(); c.arc(166 + d * 50, y + 48 - up, 13, 0, 7); c.fillStyle = "#64748b"; c.fill(); });
      c.font = handF(46); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("AI chat is typing...", 116, y + 160);
      c.restore();
    }
  }
};
// the line to copy: up for the whole line; "change the who" comes in late (k2)
const typeThis = (c: Ctx, W: number, r: () => number, k: number, k2: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#0f172a"; rrect(c, 60, 290, W - 120, 1000, 34); c.fill();
  stroke(c, rrectPts(60, 290, W - 120, 1000), "#facc15", 6, r, { passes: 1 });
  c.font = SANS(58, 800); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("TYPE THIS 📋", W / 2, 386);
  c.font = SANS(36, 600); c.fillStyle = "#cbd5e1"; c.fillText("before the doctor visit:", W / 2, 452);
  c.font = SANS(60, 800); c.fillStyle = "#fff";
  ["“Explain this to my", "72-year-old grandfather", "in simple words.", "Then give 3 questions", "to ask his doctor.”"].forEach((t, i) => c.fillText(t, W / 2, 566 + i * 88));
  c.fillStyle = "#1e293b"; rrect(c, 250, 1000, W - 500, 70, 16); c.fill();
  c.font = SANS(40, 800); c.fillStyle = "#86efac"; c.fillText("+ HbA1c 7.2%", W / 2, 1050);
  c.font = SANS(34, 700); c.fillStyle = "#cbd5e1"; c.fillText("then the report's numbers (hide the name)", W / 2, 1116);
  if (k2 > 0) { c.globalAlpha = clamp(k * 3) * clamp(k2 * 3); c.font = SANS(44, 800); c.fillStyle = "#fde68a"; c.fillText("change the who: Amma, me, a 10-year-old", W / 2, 1214); }
  c.restore();
};
const testCard = (c: Ctx, W: number, r: () => number, k: number, rows: number[], D: Demo) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(15,23,42,0.55)"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "rgba(255,253,245,0.98)"; rrect(c, 56, 250, W - 112, 1040, 30); c.fill();
  c.font = SANS(58, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 334);
  c.font = SANS(36, 800); c.fillStyle = NAVY; c.fillText(`a small free AI (Qwen 7B), offline · ${D.n} tries each`, W / 2, 392);
  const row = (y: number, head: string, big: string, col: string, ink: string, tail: string, q: number) => {
    if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 3);
    c.fillStyle = col; rrect(c, 90, y, W - 180, 270, 26); c.fill();
    c.font = SANS(44, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(head, 130, y + 66);
    c.font = SANS(118, 900); c.fillStyle = ink; c.fillText(big, 130, y + 210);
    c.font = SANS(44, 900); c.fillStyle = INK; c.textAlign = "right";
    tail.split("|").forEach((t, j) => c.fillText(t, W - 130, y + 160 + j * 52));
    c.restore();
  };
  row(430, "“HbA1c 7.2 meaning” (3 words)", `${D.plain_jargon} of ${D.n}`, "#fee2e2", RED, "replies in|doctor-talk", rows[0] ?? 0);
  row(730, "+ the TYPE THIS line", `${D.line_jargon} of ${D.n}`, "#dcfce7", GREEN, "in doctor-|talk", rows[1] ?? 0);
  if ((rows[1] ?? 0) > 0) {
    c.save(); c.globalAlpha = clamp(rows[1] * 3); c.font = SANS(44, 900); c.fillStyle = GREEN; c.textAlign = "center";
    c.fillText(`+ 3 questions for the doctor: ${D.line_questions} of ${D.n}`, W / 2, 1080); c.restore();
  }
  c.font = SANS(30, 700); c.fillStyle = "#475569"; c.textAlign = "center";
  c.fillText("doctor-talk = “glycated hemoglobin”, “hypoglycemia”...", W / 2, 1220);
  c.restore();
  void r;
};
const POSE: Record<number, Partial<Record<Who, [Mood, Arms]>>> = {
  1: { thatha: ["cry", "chest"], kamala: ["shock", "ladle"], sravani: ["deadpan", "phone"] },
  2: { thatha: ["cry", "chest"], kamala: ["shock", "cheeks"], sravani: ["deadpan", "phone"] },
  3: { thatha: ["cry", "phoneUp"], kamala: ["worried", "cheeks"], sravani: ["deadpan", "take"] },
  6: { thatha: ["worried", "rest"], kamala: ["worried", "fold"], sravani: ["calm", "palm"] },
  7: { thatha: ["worried", "rest"], kamala: ["sus", "fold"], sravani: ["calm", "phone"] },
  9: { thatha: ["sheepish", "rest"], kamala: ["calm", "fold"], sravani: ["calm", "palm"] },
  10: { thatha: ["sheepish", "rest"], kamala: ["happy", "point"], sravani: ["calm", "fold"] },
  11: { thatha: ["sheepish", "rest"], kamala: ["happy", "fold"], sravani: ["smug", "point"] },
  12: { thatha: ["sheepish", "plead"], kamala: ["calm", "fold"], sravani: ["smug", "fold"] },
  13: { thatha: ["sheepish", "plead"], kamala: ["happy", "fold"], sravani: ["smug", "point"] },
  14: { thatha: ["sneaky", "type"], kamala: ["calm", "fold"], sravani: ["calm", "fold"] },
};
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 0.78, x: 540, y: 900 }, thatha: { z: 1.75, x: 540, y: 760 }, kamala: { z: 1.75, x: 230, y: 690 }, sravani: { z: 1.75, x: 860, y: 680 },
  dog: { z: 2.3, x: 190, y: 1420 }, laddu: { z: 1.55, x: 560, y: 940 },
};
const SHOCK = new Set(["hook", "shock"]);
const LAD = 12;   // 0.4 s of silence after "Your laddus won't." (the bed drops), then the laddu thunder

// ---------- the scene ----------
const StSerial: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const D: Demo = { n: 10, plain_jargon: 10, line_jargon: 0, line_questions: 10, plain_questions: 0, plain_words: 190, line_words: 140,
    ...((s.data as { demo?: object }).demo ?? {}) };
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cueOf = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const end = (i: number) => ls[i].from + ls[i].frames;
  const sfx: React.ReactNode[] = [];
  const S10 = "reel/creative10v1/";
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (b.shot === "phone" && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("t")} at={1} src={S10 + "thunder_short.wav"} vol={1.0} />, <Sfx key={k("d")} at={0} src={S10 + "dhan3.wav"} vol={0.9} />,
      <Sfx key={k("s")} at={12} src={S10 + "sting.wav"} vol={0.3} />);   // the loudest hits, before his line (they masked it)
    if (b.prop === "shock") {   // Kamala's zoom, then Tommy's in the gap after her line
      sfx.push(<Sfx key={k("d")} at={at} src={S10 + "dhan3.wav"} vol={0.7} />, <Sfx key={k("c")} at={at + 14} src="audio/gag_bonk.wav" vol={0.35} />);
      sfx.push(<Sfx key={k("dg")} at={end(i) + 2} src={S10 + "dhan.wav"} vol={0.55} />, <Sfx key={k("wh")} at={end(i) + 6} src={S10 + "whimper.wav"} vol={0.5} />);
    }
    if (b.prop === "past") sfx.push(<Sfx key={k("d")} at={cueOf(i, 1, 0.35)} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "jargon") [0.25, 0.5, 0.75].forEach((q, j) => sfx.push(<Sfx key={k("b" + j)} at={at + Math.round(l.frames * q)} src="audio/gag_bonk.wav" vol={0.22} />));
    if (b.prop === "type") sfx.push(<Sfx key={k("d")} at={cueOf(i, 1, 0.25)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "calm") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("q")} at={cueOf(i, 1, 0.7)} src="audio/sfx_pop.wav" vol={0.28} />);
    if (b.prop === "laddus") sfx.push(<Sfx key={k("t")} at={end(i) + LAD + 1} src={S10 + "thunder_short.wav"} vol={1.0} />, <Sfx key={k("d")} at={end(i) + LAD + 2} src={S10 + "dhan3.wav"} vol={0.9} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("r")} at={at - 30} src="reel/sfx_riser.wav" vol={0.3} />, <Sfx key={k("h")} at={cueOf(i, 1, 0.55)} src="reel/sfx_boom.wav" vol={0.5} />,
      <Sfx key={k("c")} at={cueOf(i, 1, 0.55)} src="reel/creative09v1/clap.wav" vol={0.5} />);
    if (b.prop === "rule1") sfx.push(<Sfx key={k("d")} at={at - 3} src="audio/gag_ding.wav" vol={0.3} />);   // on the cut, before she speaks:
    // 20% in, it sat on "ఇది" and the Telugu mix's speech-to-text heard "yeh yeh yeh"
    if (b.prop === "rule2") sfx.push(<Sfx key={k("h")} at={end(i) + 1} src="reel/sfx_boom.wav" vol={0.55} />,   // after the line: on its
      <Sfx key={k("c")} at={end(i) + 1} src="reel/creative09v1/clap.wav" vol={0.5} />);                          // first word it hid "డాక్టర్"
    if (b.prop === "loop") {
      [4, 9, 14].forEach((d, j) => sfx.push(<Sfx key={k("t" + j)} at={at + d} src="audio/sfx_tick.wav" vol={0.3} />));   // no sting: the
      void nx;                                                                                                       // replay's thunder
    }
    if (b.prop === "test") {   // the build: hats and claps from the test card to the end
      const dur = Math.max(30, s.frames - at - 10);
      sfx.push(<Sequence key={k("perc")} from={at} durationInFrames={dur} layout="none">
        <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(q: number) => 0.14 + 0.3 * Math.min(1, q / dur)} />
      </Sequence>);
    }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(10100 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const after = f >= end(i);
        const dogBeat = b.prop === "shock" && after;          // Tommy's zoom in the gap after Kamala's line
        const ladduBeat = b.prop === "laddus" && f >= end(i) + LAD;   // the laddu zoom after a beat of silence
        const loopPhone = b.prop === "loop" && f >= cu(1, 0.85);   // the app starts typing as the line ends
        // reaction cutaways in the phone stretch (render review: 0:07-0:47 played like a screen recording)
        let face: { m: Mood; a: Arms; snap: number } | null = null;
        if (b.prop === "past" && p > 0.72) face = { m: "sheepish", a: "rest", snap: -999 };   // "Not a countdown."
        if (b.prop === "jargon" && p < 0.4) face = { m: "shock", a: "plead", snap: ln.from };   // "Then what's glycated...?!"
        if (b.prop === "calm" && p > 0.22 && p < 0.52) face = { m: "calm", a: "rest", snap: -999 };   // listening to the answer
        const whoPhone = b.prop === "who" && p < 0.45;   // line 6 opens on the phone: the note answers "shorter life expectancy"
        const te = (s.data as { handle?: string }).handle === "@ai_maastaaru_telugu";
        const qAt = cu(1, 0.7) + (te ? 10 : 0);   // Telugu: the questions came up while she was still on "not too high"
        if (((b.shot === "phone" && !dogBeat) || loopPhone || whoPhone) && !face) {
          if (loopPhone) chat(c, W, H, f, r, "laddu", [seg(f, cu(1, 0.85) + 4, cu(1, 0.85) + 12)], D);
          else if (b.prop === "past") chat(c, W, H, f, r, "wall", [seg(f, cu(1, 0.35) - 2, cu(1, 0.35) + 10), 0], D);
          else if (b.prop === "jargon") chat(c, W, H, f, r, "wall", [1, seg(p, 0.42, 0.9), seg(p, 0.72, 0.82)], D);
          else if (whoPhone) chat(c, W, H, f, r, "wall", [1, 1, 1], D);
          else chat(c, W, H, f, r, "line", [seg(f, ln.from + 2, ln.from + 10), seg(f, qAt - 2, qAt + 8)], D);
        } else {
          // ---------- the living room ----------
          const shotKey = dogBeat ? "dog" : ladduBeat ? "laddu" : n === 1 || face ? "thatha" : b.shot;
          const sh = SHOTS[shotKey] ?? SHOTS.wide;
          const zAt = dogBeat ? end(i) + 1 : ladduBeat ? end(i) + LAD + 1 : face ? face.snap : SHOCK.has(b.prop) ? ln.from : -999;
          const tz = triple(f, zAt);
          const z = sh.z * (tz.step >= 0 ? tz.z : 1 + 0.03 * p);
          const shake = tz.step === 3 ? 5 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          const thunderAt = n === 1 ? 2 : ladduBeat ? end(i) + LAD + 1 : -999;   // frame 0 stays readable: the flash comes 2 frames in
          const bolt = thunderAt >= 0 ? clamp(1 - (f - thunderAt) / 10) : 0;
          c.save(); c.translate(W / 2 + sx, 960 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          room(c, W, f, r, bolt);
          const pose = (who: Who): [Mood, Arms] => POSE[n]?.[who] ?? POSE[Math.max(...Object.keys(POSE).map(Number).filter((q) => q <= n))]?.[who] ?? ["calm", "rest"];
          const [tm, ta] = ladduBeat ? (["shock", "hug"] as [Mood, Arms]) : face ? ([face.m, face.a] as [Mood, Arms]) : pose("thatha");
          person(c, "thatha", AT.thatha, 1, tm, ta, b.who === "thatha" && talking, r);
          sofaSeat(c);
          const [km, ka] = pose("kamala");
          person(c, "kamala", AT.kamala, 1, km, ka, b.who === "kamala" && talking, r, b.prop === "shock" ? seg(f, ln.from + 2, ln.from + 16) : 0);
          const [sm, sa] = pose("sravani");
          if (n >= 3) person(c, "sravani", AT.sravani, 1, sm, sa, b.who === "sravani" && talking, r);   // she walks in on line 3
          table(c, W, r, f, n >= 12 && n <= 13 ? 0.6 : 0, !ladduBeat && n !== 14);
          tommy(c, 170, 1440, 0.9, n <= 3 || dogBeat, f, r);
          c.restore();
          if (tz.step >= 0) flashOver(c, W, H, f, zAt, r);
          if (thunderAt >= 0) thunderFlash(c, W, H, f, thunderAt);
          epTag(c, W);
          if (n === 1) {   // frame 1: his phone, big, in front: the two phrases he put together (both in its real reply)
            c.save(); c.translate(W * 0.5, 1190); c.rotate(-0.05);
            c.fillStyle = "#0b0b12"; rrect(c, -330, -250, 660, 500, 50); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, -308, -228, 616, 456, 34); c.fill();
            c.textAlign = "center";
            c.font = SANS(40, 800); c.fillStyle = INK; c.fillText("...a shorter life expectancy...", 0, -150);
            stroke(c, circlePts(0, -163, 290, 42), RED, 7, r, { passes: 2 });
            c.font = SANS(40, 600); c.fillStyle = "#475569"; c.fillText("...blood sugar over the past", 0, -58);
            c.font = SANS(88, 900); c.fillStyle = RED; c.fillText("2 to 3 months", 0, 52);
            stroke(c, circlePts(0, 22, 290, 74), RED, 9, r, { passes: 2 });
            c.font = SANS(30, 700); c.fillStyle = "#64748b"; c.fillText("AI chat · his phone, font: HUGE", 0, 182);
            c.restore();
          }
          if (b.prop === "past") tag(c, "a report on the PAST 3 months, not a countdown", W / 2, 380, 52, "#fef3c7", INK, -0.02, 1);
          if (b.prop === "who") tag(c, "3 words → it wrote for doctors", W / 2, 400, 80, "#0f172a", "#facc15", -0.02, seg(p, 0.05, 0.2));
          if (b.prop === "type") typeThis(c, W, r, seg(f, cu(1, 0.25) - 4, cu(1, 0.25) + 4), seg(f, ln.from + Math.round(ln.frames * 0.5), ln.from + Math.round(ln.frames * 0.5) + 6));
          if (b.prop === "test") testCard(c, W, r, seg(f, ln.from, ln.from + 8), [seg(f, ln.from + 4, ln.from + 12), seg(f, cu(1, 0.85) - 3, cu(1, 0.85) + 5)], D);
          if (b.prop === "rule1") tag(c, "AI EXPLAINS.", W / 2, 420, 72, "#0f172a", "#facc15", -0.02, seg(f, ln.from - 3, ln.from + 4));
          if (b.prop === "rule2") tag(c, "AI EXPLAINS. THE DOCTOR DECIDES.", W / 2, 420, 66, "#0f172a", "#facc15", -0.02, seg(p, 0.1, 0.25) * 0.4 + 0.6);
          if (b.prop === "alive") tag(c, "AI EXPLAINS. THE DOCTOR DECIDES.", W / 2, 400, 54, "#0f172a", "#facc15", -0.02, 1);   // still up
          if (ladduBeat) tag(c, "😱", W / 2 + 230, 520, 90, "rgba(0,0,0,0)", INK, 0, 1);
        }
        void PURPLE; void easeOut;
      }} />
    </>
  );
};

export const SERIAL_SCENES = { sk_serial: StSerial };
