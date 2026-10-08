import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, page, hand, arrow, fade, HAND } from "./AttentionCrayon";

// "How cheap AI is made": knowledge distillation, drawn in the crayon style of EP27.
// A giant teacher robot (the big model) and a small student robot (the small model).
// Content band: y 270..1400 (banner above, karaoke captions below; YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

// ---------- robots ----------
type RobotOpts = { body: string; accent: string; glasses?: boolean; eyes?: "open" | "happy" | "wide"; look?: number; mouth?: "smile" | "o" | "flat" | "grin"; fan?: number; arms?: "down" | "point" | "write" | "up" | "thumb"; bob?: number };
const fillBlob = (c: Ctx, path: () => void, color: string, shade: string[], r: () => number) => {
  c.save(); path(); c.fillStyle = color; c.fill(); c.clip();
  hatch(c, [-400, -500, 400, 100], shade, r, { gap: 9, w: 3, alpha: 0.35, angle: -0.8 });
  c.restore();
};
const rrect = (c: Ctx, x: number, y: number, w: number, h: number, rad: number) => {
  c.beginPath(); c.moveTo(x + rad, y); c.lineTo(x + w - rad, y); c.quadraticCurveTo(x + w, y, x + w, y + rad); c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); c.lineTo(x + rad, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rad); c.lineTo(x, y + rad); c.quadraticCurveTo(x, y, x + rad, y); c.closePath();
};
const rrectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

const robot = (c: Ctx, x: number, y: number, s: number, boil: number, seed: number, o: RobotOpts) => {
  const r = rng(seed * 17 + boil);
  c.save(); c.translate(x, y + (o.bob ?? 0)); c.scale(s, s);
  const shade = [o.accent, COL.ink, "#ffffff"];
  // legs
  [-40, 40].forEach((lx) => { fillBlob(c, () => rrect(c, lx - 18, -70, 36, 70, 12), COL.navy, [COL.ink], r); stroke(c, rrectPts(lx - 18, -70, 36, 70), COL.ink, 4, r, { passes: 2 }); });
  // arms
  const sh: Pt[] = [[-88, -190], [88, -190]];
  const tips: Record<string, [Pt, Pt]> = {
    down: [[-110, -95], [110, -95]], point: [[-110, -95], [200, -310]], write: [[-110, -95], [70, -110]], up: [[-170, -320], [170, -320]], thumb: [[-110, -95], [150, -250]],
  };
  const [tl, tr] = tips[o.arms ?? "down"];
  [[sh[0], tl], [sh[1], tr]].forEach(([a, b]) => {
    stroke(c, [a, b], o.body, 22, r, { passes: 2, alpha: 0.95, jit: 2 });
    stroke(c, [a, b], COL.ink, 4, r, { passes: 1, alpha: 0.6 });
    c.beginPath(); c.arc(b[0], b[1], 16, 0, 7); c.fillStyle = o.accent; c.fill();
  });
  if (o.arms === "thumb") stroke(c, [[150, -262], [150, -300]], o.accent, 14, r, { passes: 2 });
  // body
  fillBlob(c, () => rrect(c, -90, -220, 180, 160, 28), o.body, shade, r);
  stroke(c, rrectPts(-90, -220, 180, 160), COL.ink, 5, r, { passes: 2 });
  c.save(); rrect(c, -55, -195, 110, 70, 12); c.fillStyle = "#0b1020"; c.fill(); c.restore();
  stroke(c, [[-40, -160], [-10, -175], [15, -150], [40, -168]], o.accent, 5, r, { passes: 2 }); // chest screen squiggle
  // fan (the expensive one)
  if (o.fan !== undefined) {
    c.save(); c.translate(-90, -150);
    c.beginPath(); c.arc(0, 0, 38, 0, 7); c.fillStyle = "#334155"; c.fill();
    for (let k = 0; k < 3; k++) { const a = o.fan + (k * Math.PI * 2) / 3; c.beginPath(); c.ellipse(Math.cos(a) * 17, Math.sin(a) * 17, 18, 8, a + 0.5, 0, 7); c.fillStyle = "#cbd5e1"; c.fill(); }
    c.beginPath(); c.arc(0, 0, 7, 0, 7); c.fillStyle = COL.ink; c.fill();
    c.restore();
  }
  // head
  fillBlob(c, () => rrect(c, -75, -340, 150, 115, 30), o.body, shade, r);
  stroke(c, rrectPts(-75, -340, 150, 115), COL.ink, 5, r, { passes: 2 });
  stroke(c, [[0, -340], [0, -380]], COL.ink, 5, r, { passes: 2 });
  c.beginPath(); c.arc(0, -388, 12, 0, 7); c.fillStyle = o.accent; c.fill();
  // eyes
  const lk = (o.look ?? 0) * 7;
  [-32, 32].forEach((ex) => {
    if (o.eyes === "happy") { stroke(c, circlePts(ex, -280, 16, 14, Math.PI * 1.1, Math.PI * 1.9, 10), COL.ink, 6, r, { passes: 2 }); return; }
    const er = o.eyes === "wide" ? 22 : 18;
    c.beginPath(); c.arc(ex, -282, er, 0, 7); c.fillStyle = "#fff"; c.fill();
    c.beginPath(); c.arc(ex + lk, -282, er * 0.45, 0, 7); c.fillStyle = COL.ink; c.fill();
    stroke(c, circlePts(ex, -282, er, er), COL.ink, 3, r, { passes: 1 });
  });
  if (o.glasses) { [-32, 32].forEach((ex) => stroke(c, circlePts(ex, -282, 27, 25), COL.ink, 5, r, { passes: 2 })); stroke(c, [[-5, -284], [5, -284]], COL.ink, 5, r, { passes: 1 }); }
  // mouth
  const m = o.mouth ?? "smile";
  if (m === "smile") stroke(c, circlePts(0, -258, 22, 12, 0.2, Math.PI - 0.2, 10), COL.ink, 5, r, { passes: 2 });
  if (m === "grin") { c.beginPath(); c.ellipse(0, -250, 26, 14, 0, 0, Math.PI); c.fillStyle = "#fff"; c.fill(); stroke(c, circlePts(0, -250, 26, 14, 0, Math.PI, 10), COL.ink, 4, r, { passes: 2 }); }
  if (m === "o") { c.beginPath(); c.ellipse(0, -248, 10, 13, 0, 0, 7); c.fillStyle = COL.ink; c.fill(); }
  if (m === "flat") stroke(c, [[-18, -250], [18, -250]], COL.ink, 5, r, { passes: 2 });
  c.restore();
};
const TEACHER: RobotOpts = { body: "#1d3fa8", accent: COL.orange, glasses: true };
const STUDENT: RobotOpts = { body: COL.orange, accent: COL.yellow };

const tag = (c: Ctx, text: string, x: number, y: number, size: number, bg: string, fg: string, rot: number, p: number) => {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(easeOut(p), easeOut(p));
  c.font = `700 ${size}px Caveat`; const w = c.measureText(text).width;
  c.fillStyle = bg; rrect(c, -w / 2 - 20, -size * 0.85, w + 40, size * 1.2, 14); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(text, 0, size * 0.1); c.restore();
};

// ---------- little doodles ----------
const catFace = (c: Ctx, x: number, y: number, s: number, r: () => number, color = "#9ca3af", stripes = false) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  [[-1], [1]].forEach(([d]) => { c.beginPath(); c.moveTo(d * 30, -40); c.lineTo(d * 52, -86); c.lineTo(d * 62, -30); c.fillStyle = color; c.fill(); });
  c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fillStyle = color; c.fill();
  if (stripes) [-30, 0, 30].forEach((sx) => stroke(c, [[sx - 6, -58], [sx + 4, -30]], COL.ink, 7, r, { passes: 2 }));
  [-22, 22].forEach((ex) => { c.beginPath(); c.ellipse(ex, -8, 9, 12, 0, 0, 7); c.fillStyle = "#16a34a"; c.fill(); c.beginPath(); c.ellipse(ex, -8, 3, 10, 0, 0, 7); c.fillStyle = COL.ink; c.fill(); });
  c.beginPath(); c.moveTo(-8, 14); c.lineTo(8, 14); c.lineTo(0, 24); c.fillStyle = "#f472b6"; c.fill();
  [-1, 1].forEach((d) => [0, 10].forEach((dy) => stroke(c, [[d * 18, 22 + dy], [d * 70, 14 + dy * 1.6]], COL.ink, 2.5, r, { passes: 1 })));
  c.restore();
};
const dogFace = (c: Ctx, x: number, y: number, s: number, r: () => number, wolf = false) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const col = wolf ? "#94a3b8" : "#d6a46b";
  if (wolf) [[-1], [1]].forEach(([d]) => { c.beginPath(); c.moveTo(d * 26, -44); c.lineTo(d * 46, -100); c.lineTo(d * 62, -34); c.fillStyle = col; c.fill(); });
  else [[-1], [1]].forEach(([d]) => { c.beginPath(); c.ellipse(d * 58, -6, 20, 46, d * 0.3, 0, 7); c.fillStyle = "#8b5a2b"; c.fill(); });
  c.beginPath(); c.ellipse(0, 0, 58, 62, 0, 0, 7); c.fillStyle = col; c.fill();
  c.beginPath(); c.ellipse(0, 26, 30, 24, 0, 0, 7); c.fillStyle = "#f1f5f9"; c.fill();
  [-22, 22].forEach((ex) => { c.beginPath(); c.arc(ex, -12, 8, 0, 7); c.fillStyle = COL.ink; c.fill(); });
  c.beginPath(); c.ellipse(0, 14, 12, 9, 0, 0, 7); c.fillStyle = COL.ink; c.fill();
  c.restore();
};
const car = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); rrect(c, -70, -30, 140, 40, 12); c.fillStyle = "#ef4444"; c.fill();
  c.beginPath(); rrect(c, -40, -58, 80, 32, 10); c.fillStyle = "#ef4444"; c.fill();
  [-40, 40].forEach((wx) => { c.beginPath(); c.arc(wx, 12, 15, 0, 7); c.fillStyle = COL.ink; c.fill(); });
  c.restore();
};

// confidence bars: [label, value 0..1, color]
const bars = (c: Ctx, x: number, y: number, w: number, items: [string, number, string][], p: number, r: () => number, size = 54) => {
  items.forEach(([label, v, col], i) => {
    const yy = y + i * (size + 30);
    const q = clamp(p * items.length - i);
    c.save(); c.globalAlpha = q > 0 ? 1 : 0;
    c.font = `700 ${size}px Caveat`; c.fillStyle = COL.cream; c.textAlign = "right"; c.fillText(label, x - 18, yy + size * 0.35);
    c.textAlign = "left";
    c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(x, yy - size * 0.45, w, size * 0.9);
    c.fillStyle = col; c.fillRect(x, yy - size * 0.45, w * v * easeOut(q), size * 0.9);
    stroke(c, rrectPts(x, yy - size * 0.45, w, size * 0.9), COL.cream, 3, r, { passes: 1, alpha: 0.6 });
    c.font = `700 ${size}px Caveat`; c.fillStyle = COL.yellow; c.fillText(`${Math.round(v * 100 * easeOut(q))}%`, x + w + 14, yy + size * 0.35);
    c.restore();
  });
};

const speedLines = (c: Ctx, x: number, y: number, n: number, r: () => number, a = 1) => {
  c.save(); c.globalAlpha = a;
  for (let k = 0; k < n; k++) stroke(c, [[x + 30 + k * 6, y - 120 + k * 50], [x + 160 + k * 12, y - 120 + k * 50]], COL.pale, 5, r, { passes: 1, alpha: 0.7 });
  c.restore();
};

// ---------- 1 HOOK ----------
const DsHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1000 + boil);
      // the giant, expensive teacher
      const heat = 0.5 + 0.5 * Math.sin(f / 4);
      robot(c, 330, 1330, 2.3, boil, 1, { ...TEACHER, fan: f * 0.6, mouth: "flat", look: 0.6 });
      for (let k = 0; k < 4; k++) stroke(c, [[150 + k * 60, 470], [170 + k * 60, 430 - 20 * heat], [150 + k * 60, 390]], "#fca5a5", 5, r, { passes: 1, alpha: 0.6 });
      tag(c, "$$$ per answer", 330, 330, 70, COL.red, "#fff", -0.08, fade(f, 4, 10));
      // the tiny student zips in
      if (f >= c1 - 4) {
        const x = lerp(1250, 830, easeOut(seg(f, c1 - 4, c1 + 10)));
        robot(c, x, 1300, 0.9, boil, 2, { ...STUDENT, mouth: f >= c2 ? "grin" : "smile", eyes: f >= c2 ? "happy" : "open", bob: -10 * Math.abs(Math.sin(f / 4)) });
        speedLines(c, x, 1200, 4, r, 1 - seg(f, c1 + 10, c1 + 20));
        tag(c, "mini / flash", x, 870, 64, COL.yellow, COL.ink, 0.06, fade(f, c1 + 6, 8));
        if (f >= c2) hand(c, "cheap... and smart?", 760, 760, 70, COL.cream, seg(f, c2, c2 + 14), r, -0.04, "center");
      }
      if (f >= c3) {
        // knowledge flows from the big one to the small one
        for (let k = 0; k < 12; k++) {
          const u = ((f - c3) / 26 + k / 12) % 1;
          const px = lerp(420, 800, u), py = lerp(650, 1000, u) - Math.sin(u * Math.PI) * 160;
          c.beginPath(); c.arc(px, py, 10, 0, 7); c.fillStyle = COL.yellow; c.globalAlpha = 0.9 * fade(f, c3, 6); c.fill(); c.globalAlpha = 1;
        }
        hand(c, "DISTILLATION", W / 2, 1420, 120, COL.yellow, seg(f, c3 + 4, c3 + 20), rng(5 + boil), -0.04, "center");
      }
    }} />
  );
};

// ---------- 2 TEACHER & STUDENT ----------
const DsClass: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1100 + boil);
      // chalkboard
      c.save(); rrect(c, 60, 300, 960, 360, 24); c.fillStyle = "#0b2a1f"; c.fill(); c.clip();
      hatch(c, [60, 300, 1020, 660], ["#123d2d", "#0f3326"], r, { gap: 12, alpha: 0.5 }); c.restore();
      stroke(c, rrectPts(60, 300, 960, 360), "#8b5a2b", 14, r, { passes: 2 });
      hand(c, "teacher = BIG model", 110, 390, 64, "#e2e8f0", seg(f, 4, 18), r, -0.02);
      if (f >= c1) {
        hand(c, "brilliant", 140, 480, 56, COL.yellow, seg(f, c1, c1 + 8), r, -0.03);
        hand(c, "slow", 420, 480, 56, "#fca5a5", seg(f, c1 + 6, c1 + 12), r, 0.02);
        hand(c, "expensive", 620, 480, 56, "#fca5a5", seg(f, c1 + 10, c1 + 18), r, -0.02);
      }
      if (f >= c2) hand(c, "student = small model", 110, 600, 64, "#e2e8f0", seg(f, c2, c2 + 14), r, -0.02);
      robot(c, 300, 1330, 1.55, boil, 1, { ...TEACHER, arms: "point", look: 0.5 });
      // student at a desk
      c.save(); rrect(c, 640, 1150, 340, 40, 8); c.fillStyle = "#8b5a2b"; c.fill(); c.restore();
      robot(c, 810, 1150, 0.85, boil, 2, { ...STUDENT, arms: "write", look: -0.6, mouth: f >= c3 ? "grin" : "smile" });
      c.save(); rrect(c, 690, 1105, 120, 50, 6); c.fillStyle = COL.cream; c.fill(); c.restore();
      if (f >= c3) {
        // answer cards fly from the teacher to the student's notebook
        for (let k = 0; k < 4; k++) {
          const u = clamp((f - c3 - k * 8) / 22);
          if (u <= 0 || u >= 1) continue;
          const px = lerp(460, 740, u), py = lerp(820, 1110, u) - Math.sin(u * Math.PI) * 180;
          c.save(); c.translate(px, py); c.rotate(u * 3);
          c.fillStyle = COL.cream; c.fillRect(-40, -28, 80, 56);
          c.font = `700 40px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText("A", 0, 14); c.restore();
        }
        hand(c, "learns from the teacher's answers", W / 2, 1420, 66, COL.cream, seg(f, c3 + 6, c3 + 24), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 3 THE CLEVER PART ----------
const DsSoft: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1200 + boil);
      hand(c, "the clever part", W / 2, 360, 90, COL.orangeLight, seg(f, 2, 14), r, -0.03, "center");
      // a photo of a cat
      page(c, 100, 420, 340, 300, boil, -0.03);
      catFace(c, 270, 590, 1.2, r);
      robot(c, 830, 760, 0.85, boil, 1, { ...TEACHER, mouth: "o", look: -0.8 });
      if (f >= c1 && f < c2) {
        tag(c, '"cat."', 760, 470, 76, COL.cream, COL.ink, 0.04, fade(f, c1, 6));
      }
      if (f >= c2) {
        bars(c, 330, 860, 470, [["cat", 0.9, COL.orange], ["tiger", 0.09, COL.yellow], ["car", 0.01, COL.light]], seg(f, c2, c2 + 30), r, 60);
        if (f >= c2 + 10) catFace(c, 960, 960, 0.45, r, COL.orange, true);
        if (f >= c2 + 20) car(c, 960, 1060, 0.55, r);
      }
      if (f >= c3) {
        stroke(c, circlePts(210, 950, 110, 44, -2, -2 + Math.PI * 2.1 * seg(f, c3, c3 + 14), 30), COL.red, 7, r, { passes: 2 });
        hand(c, "a cat looks a bit like a tiger", W / 2, 1230, 64, COL.cream, seg(f, c3 + 8, c3 + 24), r, -0.02, "center");
        hand(c, "...and nothing like a car", W / 2, 1310, 64, COL.cream, seg(f, c3 + 22, c3 + 36), r, -0.02, "center");
      }
      if (f >= c4) {
        robot(c, 160, 1330, 0.55, boil, 2, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "thumb" });
        hand(c, "the student learns ALL of it", 640, 1400, 60, COL.yellow, seg(f, c4, c4 + 16), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 4 DOES IT WORK ----------
const badge = (c: Ctx, x: number, y: number, big: string, small: string, col: string, p: number, r: () => number) => {
  if (p <= 0) return;
  c.save(); c.translate(x, y); const s = easeOut(p) * (1 + 0.15 * (1 - easeOut(p))); c.scale(s, s); c.rotate(-0.04);
  c.beginPath(); c.arc(0, 0, 135, 0, 7); c.fillStyle = col; c.fill();
  stroke(c, circlePts(0, 0, 135, 135), COL.cream, 6, r, { passes: 2 });
  c.font = `700 104px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText(big, 0, 18);
  c.font = `700 46px Caveat`; c.fillText(small, 0, 72);
  c.restore();
};
const DsResults: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1300 + boil);
      hand(c, "does it work?", W / 2, 360, 92, COL.cream, seg(f, 2, 14), r, -0.03, "center");
      hand(c, "DistilBERT (2019)", W / 2, 470, 76, COL.yellow, seg(f, 6, 20), r, -0.02, "center");
      badge(c, 250, 700, "40%", "smaller", COL.orangeLight, seg(f, c1 - 4, c1 + 6), r);
      badge(c, 540, 650, "60%", "faster", COL.yellow, seg(f, c1 + 10, c1 + 20), r);
      badge(c, 830, 700, "97%", "skill kept", "#86efac", seg(f, c2, c2 + 10), r);
      if (f >= c3) {
        c.save(); rrect(c, 90, 960, 900, 330, 26); c.fillStyle = "rgba(255,255,255,0.12)"; c.fill(); c.restore();
        hand(c, "Gemini 1.5 Pro", 300, 1080, 70, COL.cream, seg(f, c3, c3 + 10), r, -0.02, "center");
        arrow(c, [470, 1060], [620, 1060], -40, COL.orange, 8, seg(f, c3 + 6, c3 + 16), r);
        hand(c, "1.5 Flash", 790, 1080, 70, COL.yellow, seg(f, c3 + 12, c3 + 22), r, -0.02, "center");
        hand(c, "learned from it this way (Google, 2024)", W / 2, 1200, 50, COL.pale, seg(f, c3 + 18, c3 + 34), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 5 IT CAN BE CHEAP ----------
const DsCheap: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1400 + boil);
      hand(c, "it can be cheap", W / 2, 360, 92, COL.orangeLight, seg(f, 2, 14), r, -0.03, "center");
      if (f >= c1) {
        // a stack of 1,000 answer sheets
        const n = Math.round(14 * seg(f, c1, c1 + 20));
        for (let k = 0; k < n; k++) { c.save(); c.translate(250 + (k % 2) * 6, 760 - k * 14); c.rotate((k % 3 - 1) * 0.03); c.fillStyle = k % 2 ? COL.cream : "#e9dfc4"; c.fillRect(-120, -16, 240, 30); c.restore(); }
        hand(c, "1,000 answers", 250, 830, 70, COL.cream, seg(f, c1 + 8, c1 + 20), r, -0.03, "center");
        hand(c, "from a bigger model", 250, 900, 50, COL.pale, seg(f, c1 + 16, c1 + 28), r, -0.03, "center");
      }
      if (f >= c2) {
        // stopwatch + price tag
        const sw = (f - c2) / 30;
        c.beginPath(); c.arc(720, 610, 120, 0, 7); c.fillStyle = COL.cream; c.fill();
        stroke(c, circlePts(720, 610, 120, 120), COL.ink, 8, r, { passes: 2 });
        stroke(c, [[720, 610], [720 + Math.sin(sw * 3) * 90, 610 - Math.cos(sw * 3) * 90]], COL.red, 8, r, { passes: 2 });
        c.font = `700 56px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText("< 30 min", 720, 690);
        tag(c, "under $50", 760, 840, 88, COL.yellow, COL.ink, 0.08, fade(f, c2 + 12, 8));
      }
      if (f >= c3) {
        page(c, 150, 990, 780, 300, boil, 0.01);
        hand(c, "maths test:", 230, 1080, 64, COL.ink, seg(f, c3, c3 + 10), r, -0.02);
        hand(c, "close to the top models", 230, 1170, 64, "#15803d", seg(f, c3 + 8, c3 + 22), r, -0.02);
        hand(c, "(s1, Stanford + UW, 2025; built on an existing open model)", W / 2, 1360, 40, COL.pale, seg(f, c3 + 18, c3 + 30), r, -0.01, "center");
      }
    }} />
  );
};

// ---------- 6 THE CATCH ----------
const DsCatch: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1500 + boil);
      hand(c, "the catch", W / 2, 360, 96, COL.orangeLight, seg(f, 2, 14), r, -0.03, "center");
      if (f >= c1) {
        robot(c, 300, 1000, 1.0, boil, 1, { ...TEACHER, mouth: "smile" });
        robot(c, 800, 1000, 0.7, boil, 2, { ...STUDENT, mouth: "smile" });
        tag(c, "2 + 2 = 5", 300, 520, 76, COL.cream, COL.red, -0.05, fade(f, c1 + 2, 8));
        tag(c, "2 + 2 = 5", 800, 640, 70, COL.cream, COL.red, 0.05, fade(f, c1 + 12, 8));
        arrow(c, [420, 560], [700, 620], -60, COL.pale, 5, seg(f, c1 + 6, c1 + 16), r);
        hand(c, "only as good as its teacher", W / 2, 1110, 62, COL.cream, seg(f, c1 + 16, c1 + 32), r, -0.02, "center");
      }
      if (f >= c2) {
        page(c, 200, 1150, 680, 220, boil, -0.02);
        hand(c, "Terms of use", 280, 1230, 56, COL.ink, seg(f, c2, c2 + 8), r, -0.02);
        tag(c, "DON'T TRAIN A RIVAL", 560, 1310, 70, COL.red, "#fff", -0.1, fade(f, c2 + 10, 6));
      }
    }} />
  );
};

// ---------- 7 SO WHAT ----------
const DsPick: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1600 + boil);
      hand(c, "your move", W / 2, 360, 92, COL.cream, seg(f, 2, 14), r, -0.03, "center");
      // phone with a model picker
      c.save(); rrect(c, 300, 420, 480, 760, 50); c.fillStyle = "#0b1020"; c.fill(); c.restore();
      c.save(); rrect(c, 330, 470, 420, 660, 30); c.fillStyle = COL.cream; c.fill(); c.restore();
      c.font = `700 52px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText("choose a model", 540, 550);
      const pick = seg(f, 10, 22);
      [["PRO", 0], ["MINI / FLASH", 1]].forEach(([lab, i]) => {
        const y = 640 + (i as number) * 150, on = i === 1 && pick > 0.5;
        c.save(); rrect(c, 370, y, 340, 110, 22); c.fillStyle = on ? COL.yellow : "#e2e8f0"; c.fill(); c.restore();
        stroke(c, rrectPts(370, y, 340, 110), on ? COL.orange : "#94a3b8", on ? 8 : 4, r, { passes: 2 });
        c.font = `700 60px Caveat`; c.fillStyle = COL.ink; c.fillText(lab as string, 540, y + 74);
      });
      if (pick > 0) { c.beginPath(); c.arc(lerp(900, 640, easeOut(pick)), lerp(1100, 860, easeOut(pick)), 26, 0, 7); c.fillStyle = "rgba(255,200,120,0.85)"; c.fill(); }
      hand(c, "for everyday tasks: try first", 540, 1080, 50, COL.ink, seg(f, 16, 30), r, -0.02, "center");
      if (f >= c1) {
        robot(c, 880, 1330, 0.6, boil, 2, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "thumb", bob: -14 * Math.abs(Math.sin((f - c1) / 5)) });
        hand(c, "faster · cheaper · good enough", W / 2, 1400, 62, COL.yellow, seg(f, c1 + 4, c1 + 22), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 8 QUIZ + CTA ----------
const DsQuiz: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1700 + boil);
      hand(c, "QUICK QUIZ", W / 2, 360, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
      dogFace(c, 220, 560, 0.9, r);
      bars(c, 380, 520, 470, [["dog", 0.7, COL.orange], ["wolf", 0.25, COL.yellow], ["cat", 0.05, COL.light]], seg(f, 6, 30), r, 58);
      if (f >= c1 && f < c2) {
        hand(c, "what did it learn about wolves?", W / 2, 920, 62, COL.cream, seg(f, c1, c1 + 16), r, -0.02, "center");
        const p = seg(f, c1 + 16, c2);
        stroke(c, circlePts(W / 2, 1060, 56, 56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p), 40), COL.yellow, 10, r, { passes: 2 });
        hand(c, "pause & answer", W / 2, 1180, 56, COL.pale, seg(f, c1 + 10, c1 + 20), r, -0.02, "center");
      }
      if (f >= c2 && f < c3 + 4) {
        dogFace(c, 360, 1040, 0.9, r);
        dogFace(c, 720, 1040, 0.9, r, true);
        hand(c, "≈", 540, 1060, 120, COL.yellow, seg(f, c2, c2 + 6), r, 0, "center");
        hand(c, "wolves look a lot like dogs!", W / 2, 1240, 66, COL.yellow, seg(f, c2 + 4, c2 + 20), r, -0.02, "center");
      }
      if (f >= c3) {
        const hp = easeOut(fade(f, c3, 10));
        c.save(); c.globalAlpha = hp;
        c.fillStyle = "rgba(5,10,40,0.55)"; c.fillRect(0, 880, W, 520);
        c.font = `700 ${handle.length > 16 ? 84 : 100}px Caveat`; c.textAlign = "center"; c.fillStyle = COL.yellow;
        c.fillText(handle, W / 2, 1080);
        c.font = `56px ${HAND}`; c.fillStyle = COL.cream; c.fillText("Follow for more AI, explained simply", W / 2, 1180);
        c.restore();
        robot(c, 540, 1400, 0.45, boil, 2, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "up" });
      }
    }} />
  );
};

export const DISTILL_SCENES = { ds_hook: DsHook, ds_class: DsClass, ds_soft: DsSoft, ds_results: DsResults, ds_cheap: DsCheap, ds_catch: DsCatch, ds_pick: DsPick, ds_quiz: DsQuiz };
