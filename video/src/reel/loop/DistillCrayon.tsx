import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
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
export type RobotOpts = { body: string; accent: string; glasses?: boolean; eyes?: "open" | "happy" | "wide"; look?: number; mouth?: "smile" | "o" | "flat" | "grin"; fan?: number; arms?: "down" | "point" | "write" | "up" | "thumb"; bob?: number };
const fillBlob = (c: Ctx, path: () => void, color: string, shade: string[], r: () => number) => {
  c.save(); path(); c.fillStyle = color; c.fill(); c.clip();
  hatch(c, [-400, -500, 400, 100], shade, r, { gap: 9, w: 3, alpha: 0.35, angle: -0.8 });
  c.restore();
};
export const rrect = (c: Ctx, x: number, y: number, w: number, h: number, rad: number) => {
  c.beginPath(); c.moveTo(x + rad, y); c.lineTo(x + w - rad, y); c.quadraticCurveTo(x + w, y, x + w, y + rad); c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); c.lineTo(x + rad, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rad); c.lineTo(x, y + rad); c.quadraticCurveTo(x, y, x + rad, y); c.closePath();
};
export const rrectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

export const robot = (c: Ctx, x: number, y: number, s: number, boil: number, seed: number, o: RobotOpts) => {
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
export const TEACHER: RobotOpts = { body: "#1d3fa8", accent: COL.orange, glasses: true };
export const STUDENT: RobotOpts = { body: COL.orange, accent: COL.yellow };

export const tag = (c: Ctx, text: string, x: number, y: number, size: number, bg: string, fg: string, rot: number, p: number) => {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(easeOut(p), easeOut(p));
  c.font = `700 ${size}px Caveat`; const w = c.measureText(text).width;
  c.fillStyle = bg; rrect(c, -w / 2 - 20, -size * 0.85, w + 40, size * 1.2, 14); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(text, 0, size * 0.1); c.restore();
};

// ---------- little doodles ----------
export const catFace = (c: Ctx, x: number, y: number, s: number, r: () => number, color = "#9ca3af", stripes = false) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  [[-1], [1]].forEach(([d]) => { c.beginPath(); c.moveTo(d * 30, -40); c.lineTo(d * 52, -86); c.lineTo(d * 62, -30); c.fillStyle = color; c.fill(); });
  c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fillStyle = color; c.fill();
  if (stripes) [-30, 0, 30].forEach((sx) => stroke(c, [[sx - 6, -58], [sx + 4, -30]], COL.ink, 7, r, { passes: 2 }));
  [-22, 22].forEach((ex) => { c.beginPath(); c.ellipse(ex, -8, 9, 12, 0, 0, 7); c.fillStyle = "#16a34a"; c.fill(); c.beginPath(); c.ellipse(ex, -8, 3, 10, 0, 0, 7); c.fillStyle = COL.ink; c.fill(); });
  c.beginPath(); c.moveTo(-8, 14); c.lineTo(8, 14); c.lineTo(0, 24); c.fillStyle = "#f472b6"; c.fill();
  [-1, 1].forEach((d) => [0, 10].forEach((dy) => stroke(c, [[d * 18, 22 + dy], [d * 70, 14 + dy * 1.6]], COL.ink, 2.5, r, { passes: 1 })));
  c.restore();
};
export const dogFace = (c: Ctx, x: number, y: number, s: number, r: () => number, wolf = false) => {
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
export const car = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
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

export const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);
const stopwatch = (c: Ctx, x: number, y: number, R: number, t: number, label: string, r: () => number) => {
  c.beginPath(); c.arc(x, y, R, 0, 7); c.fillStyle = COL.cream; c.fill();
  stroke(c, circlePts(x, y, R, R), COL.ink, 8, r, { passes: 2 });
  c.fillStyle = COL.ink; c.fillRect(x - 14, y - R - 28, 28, 22);
  stroke(c, [[x, y], [x + Math.sin(t * 3) * R * 0.75, y - Math.cos(t * 3) * R * 0.75]], COL.red, 8, r, { passes: 2 });
  c.font = `700 ${Math.round(R * 0.46)}px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText(label, x, y + R * 0.62);
};

// ---------- 1 HOOK ----------
const DsHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const tEnd = Math.max(240, c1 + 60);   // the teaser stays fully on screen until about 8 s
  return (
    <>
    <Sfx at={0} src="reel/sfx_boom.wav" vol={0.85} />
    <Sfx at={0} src="audio/sfx_chaching.wav" vol={0.75} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1000 + boil);
      // frame 0 (cover): the claim in big words + the two numbers, readable with the sound off.
      // At cue 4 ("and at the end: which one you should use") the claim makes way for the promise.
      const swap = seg(f, c4 - 6, c4 + 4);
      c.save(); c.translate(-1200 * swap * swap, 0);
      hand(c, "An AI beat OpenAI's", W / 2, 350, 86, COL.cream, 1, r, -0.02, "center");
      hand(c, "o1-preview at math", W / 2, 445, 86, COL.yellow, 1, r, -0.02, "center");
      c.restore();
      if (f >= c4) {
        tag(c, "which one should YOU use?", W / 2, 360, 76, COL.yellow, COL.ink, -0.03, fade(f, c4, 8));
        hand(c, "answer at the end", W / 2, 455, 54, COL.cream, seg(f, c4 + 6, c4 + 18), r, -0.02, "center");
      }
      const k1 = 1 + 0.2 * (1 - easeOut(fade(f, 0, 6))), k2 = 1 + 0.12 * (1 - easeOut(fade(f, 1, 6)));
      c.save(); c.translate(290, 680); c.scale(k1, k1); stopwatch(c, 0, 0, 140, f / 30, "< 30 min", r); c.restore();
      c.save(); c.translate(745, 690); c.scale(k2, k2); c.translate(-745, -690); tag(c, "under $50", 745, 690, 110, COL.yellow, COL.ink, 0.07, 1); c.restore();
      // teaser for the payoff: headline-size, fully on screen from ~1.5 s to ~8 s
      if (f >= 40 && f < tEnd + 10) {
        const out = seg(f, tEnd, tEnd + 10);
        c.save(); c.translate(-1200 * out * out, 0);
        const k = easeOut(fade(f, 40, 8));
        c.save(); c.translate(W / 2, 960); c.scale(k, k); c.translate(-W / 2, -960);
        hand(c, "...and which model", W / 2, 935, 80, COL.orangeLight, 1, r, -0.02, "center");
        hand(c, "should YOU use?", W / 2, 1025, 80, COL.orangeLight, 1, r, -0.02, "center");
        hand(c, "(answer at the end)", W / 2, 1095, 50, COL.cream, 1, r, -0.01, "center");
        c.restore(); c.restore();
      }
      if (f >= tEnd && f < c3 + 12) {
        // the fine print, then it slides away when the word DISTILLATION arrives
        c.save(); c.translate(-1200 * Math.pow(seg(f, c3, c3 + 10), 2), 0);
        page(c, 110, 860, 860, 210, boil, -0.015);
        hand(c, "OpenAI's 2024 model · competition math", 150, 935, 50, COL.ink, seg(f, tEnd, tEnd + 12), r, -0.02);
        hand(c, "built on an existing open model", 150, 1010, 50, "#15803d", seg(f, tEnd + 8, tEnd + 22), r, -0.02);
        hand(c, "researchers' report (s1, 2025)", W / 2, 1125, 46, COL.pale, seg(f, tEnd + 16, tEnd + 28), r, -0.01, "center");
        c.restore();
      }
      if (f >= c2) robot(c, 230, 1420, 0.85, boil, 1, { ...TEACHER, look: 0.6, mouth: "smile", arms: "point" });
      if (f >= c2 + 8) robot(c, 860, 1420, 0.5, boil, 2, { ...STUDENT, look: -0.6, eyes: f >= c3 ? "happy" : "open", mouth: f >= c3 ? "grin" : "smile" });
      if (f >= c3) {
        for (let k = 0; k < 12; k++) {
          const u = ((f - c3) / 26 + k / 12) % 1;
          const px = lerp(330, 820, u), py = lerp(1170, 1250, u) - Math.sin(u * Math.PI) * 140;
          c.beginPath(); c.arc(px, py, 9, 0, 7); c.fillStyle = COL.yellow; c.globalAlpha = 0.9 * fade(f, c3, 6); c.fill(); c.globalAlpha = 1;
        }
        hand(c, "DISTILLATION", W / 2, 990, 116, COL.yellow, seg(f, c3 + 8, c3 + 24), rng(5 + boil), -0.04, "center");
      }
    }} />
    </>
  );
};

// ---------- 2 TEACHER & STUDENT ----------
const DsClass: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1100 + boil);
      c.save(); rrect(c, 60, 300, 960, 300, 24); c.fillStyle = "#0b2a1f"; c.fill(); c.clip();
      hatch(c, [60, 300, 1020, 600], ["#123d2d", "#0f3326"], r, { gap: 12, alpha: 0.5 }); c.restore();
      stroke(c, rrectPts(60, 300, 960, 300), "#8b5a2b", 14, r, { passes: 2 });
      hand(c, "the idea", W / 2, 390, 70, "#e2e8f0", seg(f, 2, 12), r, -0.02, "center");
      if (f >= c1) { hand(c, "big", 130, 500, 64, COL.yellow, seg(f, c1, c1 + 6), r, -0.03); hand(c, "slow", 290, 500, 64, "#fca5a5", seg(f, c1 + 4, c1 + 10), r, 0.02); hand(c, "expensive", 460, 500, 64, "#fca5a5", seg(f, c1 + 8, c1 + 16), r, -0.02); }
      if (f >= c2) hand(c, "-> small + fast", 700, 500, 64, "#86efac", seg(f, c2, c2 + 12), r, -0.02);
      robot(c, 300, 1330, 1.5, boil, 1, { ...TEACHER, arms: "point", look: 0.5 });
      c.save(); rrect(c, 640, 1150, 340, 40, 8); c.fillStyle = "#8b5a2b"; c.fill(); c.restore();
      robot(c, 810, 1150, 0.85, boil, 2, { ...STUDENT, arms: "write", look: -0.6, mouth: f >= c2 ? "grin" : "smile" });
      c.save(); rrect(c, 690, 1105, 120, 50, 6); c.fillStyle = COL.cream; c.fill(); c.restore();
      if (f >= c2) {
        for (let k = 0; k < 4; k++) {
          const u = clamp((f - c2 - k * 6) / 18);
          if (u <= 0 || u >= 1) continue;
          const px = lerp(460, 740, u), py = lerp(820, 1110, u) - Math.sin(u * Math.PI) * 180;
          c.save(); c.translate(px, py); c.rotate(u * 3); c.fillStyle = COL.cream; c.fillRect(-40, -28, 80, 56);
          c.font = `700 40px Caveat`; c.fillStyle = COL.ink; c.textAlign = "center"; c.fillText("A", 0, 14); c.restore();
        }
      }
    }} />
  );
};

// ---------- 3 THE CLEVER PART ----------
const DsSoft: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <>
    <Sfx at={c3} src="audio/sfx_success.wav" vol={0.45} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1200 + boil);
      const words = f >= c4;
      if (!words) {
        page(c, 90, 330, 330, 290, boil, -0.03);
        catFace(c, 255, 490, 1.15, r);
        // the answer key: just "cat"
        c.save(); rrect(c, 520, 340, 470, 140, 18); c.fillStyle = COL.cream; c.fill(); c.restore();
        hand(c, "answer key: cat", 755, 430, 64, COL.ink, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) robot(c, 935, 1050, 0.6, boil, 1, { ...TEACHER, mouth: "o", look: -0.8 });
        if (f >= c2) {
          bars(c, 300, 720, 420, [["cat", 0.9, COL.orange], ["tiger", 0.09, COL.yellow], ["car", 0.01, COL.light]], seg(f, c2, c2 + 30), r, 60);
          if (f >= c2 + 10) catFace(c, 120, 820, 0.4, r, COL.orange, true);
          if (f >= c2 + 20) car(c, 120, 905, 0.5, r);
        }
        if (f >= c3) {
          stroke(c, circlePts(190, 810, 110, 44, -2, -2 + Math.PI * 2.1 * seg(f, c3, c3 + 14), 30), COL.red, 7, r, { passes: 2 });
          c.save(); c.globalAlpha = fade(f, c3, 5);
          hand(c, "hidden lessons:", W / 2, 1110, 76, COL.yellow, 1, r, -0.02, "center");
          hand(c, "a bit like a tiger,", W / 2, 1205, 66, COL.cream, 1, r, -0.02, "center");
          hand(c, "nothing like a car", W / 2, 1285, 66, COL.cream, 1, r, -0.02, "center");
          c.restore();
        }
      } else {
        // chatbots: the same idea with words
        hand(c, "chatbots do it with words", W / 2, 380, 76, COL.orangeLight, seg(f, c4, c4 + 12), r, -0.02, "center");
        page(c, 100, 440, 880, 160, boil, -0.01);
        hand(c, "The cat sat on the ...", 160, 545, 72, COL.ink, seg(f, c4 + 4, c4 + 16), r, -0.02);
        bars(c, 330, 720, 420, [["mat", 0.62, COL.orange], ["sofa", 0.21, COL.yellow], ["moon", 0.01, COL.light]], seg(f, c4 + 10, c4 + 36), r, 60);
        robot(c, 880, 1330, 0.55, boil, 2, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "write" });
        hand(c, "the student copies these weights", W / 2, 1100, 58, COL.cream, seg(f, c4 + 30, c4 + 46), r, -0.02, "center");
      }
    }} />
    </>
  );
};

// ---------- 4 WHO USES IT ----------
const DsResults: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1300 + boil);
      hand(c, "big companies do this", W / 2, 370, 84, COL.cream, seg(f, 0, 12), r, -0.03, "center");
      robot(c, 300, 1250, 1.45, boil, 1, { ...TEACHER, arms: "point", look: 0.6, mouth: f >= c1 ? "o" : "smile" });
      robot(c, 820, 1250, 0.75, boil, 2, { ...STUDENT, arms: f >= c1 + 20 ? "write" : "down", look: -0.6, eyes: f >= c1 + 20 ? "happy" : "open", mouth: "grin" });
      tag(c, "Gemini Pro", 300, 1340, 66, COL.cream, "#1d3fa8", -0.04, fade(f, c1, 8));
      tag(c, "Gemini Flash", 820, 1340, 60, COL.yellow, COL.ink, 0.04, fade(f, c1 + 8, 8));
      if (f >= c1) {
        for (let k = 0; k < 10; k++) {
          const u = ((f - c1) / 30 + k / 10) % 1;
          const px = lerp(470, 760, u), py = lerp(760, 980, u) - Math.sin(u * Math.PI) * 160;
          c.beginPath(); c.arc(px, py, 10, 0, 7); c.fillStyle = COL.yellow; c.globalAlpha = 0.9 * fade(f, c1, 8); c.fill(); c.globalAlpha = 1;
        }
        hand(c, "Google said Flash learned from Pro (Gemini 1.5, 2024)", W / 2, 470, 46, COL.pale, seg(f, c1 + 10, c1 + 28), r, -0.01, "center");
      }
    }} />
  );
};

// ---------- 5 THE MATHS MODEL: copying written answers ----------
const DsCheap: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const tX = Math.round(c1 * 0.3), tW = Math.round(c1 * 0.5), tD = Math.round(c1 * 0.72);
  return (
    <>
    <Sfx at={c2} src="audio/sfx_chaching.wav" vol={0.4} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1400 + boil);
      hand(c, "that math model?", W / 2, 360, 88, COL.orangeLight, seg(f, 0, 12), r, -0.03, "center");
      // left: the teacher's percentages, crossed out ("it got no percentages")
      c.save(); rrect(c, 60, 430, 450, 420, 26); c.fillStyle = "rgba(255,255,255,0.08)"; c.fill(); c.restore();
      hand(c, "percentages", 285, 500, 58, COL.cream, seg(f, 4, 16), r, -0.02, "center");
      bars(c, 240, 600, 170, [["cat", 0.9, COL.orange], ["tiger", 0.09, COL.yellow], ["car", 0.01, COL.light]], seg(f, 6, 26), r, 46);
      if (f >= tX) {
        const q = seg(f, tX, tX + 10), q2 = seg(f, tX + 10, tX + 20);
        stroke(c, [[90, 460], [90 + 390 * q, 460 + 360 * q]], COL.red, 12, r, { passes: 2, alpha: 0.9 });
        if (q >= 1) stroke(c, [[480, 460], [480 - 390 * q2, 460 + 360 * q2]], COL.red, 12, r, { passes: 2, alpha: 0.9 });
      }
      // right: written answers ("just written answers"), then 1,000 solved examples at cue 1
      if (f >= tW) { c.save(); c.globalAlpha = fade(f, tW, 6); rrect(c, 570, 430, 450, 420, 26); c.fillStyle = "rgba(255,255,255,0.08)"; c.fill(); c.restore(); }
      hand(c, "written answers", 795, 500, 58, COL.cream, seg(f, tW, tW + 12), r, -0.02, "center");
      if (f >= tW + 8) stroke(c, [[960, 470], [985, 500], [1015, 450]], "#22c55e", 10, r, { passes: 2, alpha: seg(f, tW + 8, tW + 12) });
      if (f >= c1) {
        const n = Math.round(12 * seg(f, c1, c1 + 20));
        for (let k = 0; k < n; k++) { c.save(); c.translate(795 + (k % 2) * 6 - 3, 760 - k * 12); c.rotate((k % 3 - 1) * 0.03); c.fillStyle = k % 2 ? COL.cream : "#e9dfc4"; c.fillRect(-150, -18, 300, 34); c.restore(); }
        hand(c, "1,000 solved examples", 795, 820, 50, COL.yellow, seg(f, c1 + 10, c1 + 24), r, -0.02, "center");
      }
      if (f >= c1 + 14) tag(c, "from a smarter AI", 795, 930, 56, COL.cream, "#1d3fa8", -0.03, fade(f, c1 + 14, 8));
      // "and that still counts as distillation"
      if (f >= tD) {
        page(c, 110, 1010, 860, 150, boil, -0.01);
        hand(c, "still counts as distillation", W / 2, 1105, 64, "#15803d", seg(f, tD, tD + 14), r, -0.02, "center");
      }
      if (f >= c2) tag(c, "$50 = only this last step", W / 2, 1250, 66, COL.yellow, COL.ink, -0.03, fade(f, c2, 8));
      hand(c, "s1: Stanford, UW, Ai2 (2025) · already-trained open model", W / 2, 1360, 44, COL.pale, seg(f, c1 + 20, c1 + 36), r, -0.01, "center");
    }} />
    </>
  );
};

// ---------- 6 THE CATCH ----------
const DsCatch: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1500 + boil);
      hand(c, "the catch", W / 2, 360, 96, COL.orangeLight, seg(f, 0, 12), r, -0.03, "center");
      robot(c, 300, 1000, 1.0, boil, 1, { ...TEACHER, mouth: "smile" });
      robot(c, 800, 1000, 0.7, boil, 2, { ...STUDENT, mouth: f >= c1 + 12 ? "o" : "smile" });
      if (f >= c1) {
        tag(c, "2 + 2 = 5", 300, 520, 76, COL.cream, COL.red, -0.05, fade(f, c1 + 2, 8));
        tag(c, "2 + 2 = 5", 800, 640, 70, COL.cream, COL.red, 0.05, fade(f, c1 + 12, 8));
        arrow(c, [420, 560], [700, 620], -60, COL.pale, 5, seg(f, c1 + 6, c1 + 16), r);
        hand(c, "mistakes get copied too", W / 2, 1110, 64, COL.cream, seg(f, c1 + 16, c1 + 32), r, -0.02, "center");
      }
      if (f >= c2) {
        page(c, 200, 1150, 680, 220, boil, -0.02);
        hand(c, "Terms of use", 280, 1230, 56, COL.ink, seg(f, c2, c2 + 8), r, -0.02);
        tag(c, "DON'T TRAIN A RIVAL", 560, 1310, 70, COL.red, "#fff", -0.1, fade(f, c2 + 10, 6));
      }
    }} />
  );
};

// ---------- 7 WHICH ONE DO I USE ----------
const DsPick: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <>
    <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.45} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1600 + boil);
      hand(c, "which one do I use?", W / 2, 360, 86, COL.cream, seg(f, 0, 12), r, -0.03, "center");
      const col = (x: number, title: string, subs: string[], items: string[], tint: string, p: number) => {
        c.save(); rrect(c, x, 420, 490, 530, 30); c.fillStyle = "rgba(255,255,255,0.1)"; c.fill(); c.restore();
        tag(c, title, x + 245, 492, 62, tint, COL.ink, -0.03, 1);
        subs.forEach((sb, i) => hand(c, sb, x + 245, 585 + i * 54, 48, tint, 1, r, -0.01, "center"));
        items.forEach((it, i) => hand(c, it.startsWith(" ") ? it : "• " + it, x + 30, 700 + i * 70, 46, COL.cream, clamp(p * 3 - i * 0.5), r, -0.01));
      };
      col(40, "SMALL", ["Flash · Flash-Lite · mini"], ["emails", "summaries", "pulling out data"], COL.yellow, seg(f, c1, c1 + 24));
      col(550, "BIGGER", ["Gemini Pro", "(usually paid)"], ["multi-step tasks", "Excel formula the", "   small one gets wrong"], COL.orangeLight, seg(f, c2, c2 + 24));
      if (f >= c3) {
        page(c, 80, 975, 920, 235, boil, -0.012);
        hand(c, "developers: Pro ≈ 3x Flash per use", W / 2, 1052, 64, COL.ink, seg(f, c3, c3 + 12), r, -0.02, "center");
        hand(c, "Google API prices, Oct 2026: Gemini 3.8 Flash vs 3.1 Pro", W / 2, 1120, 40, "#475569", seg(f, c3 + 10, c3 + 24), r, -0.01, "center");
        hand(c, "(Flash price valid till Dec 31, 2026)", W / 2, 1172, 40, "#475569", seg(f, c3 + 16, c3 + 30), r, -0.01, "center");
      }
      if (f >= c4) {
        tag(c, "test 20 real emails first", W / 2, 1300, 66, "#86efac", COL.ink, -0.02, fade(f, c4, 8));
      }
    }} />
    </>
  );
};

// ---------- 8 YOUR TURN + CTA ----------
const DsAsk: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1700 + boil);
      hand(c, "YOUR TURN", W / 2, 370, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
      // a stack of 500 complaints, one flagged
      const n = Math.round(10 * seg(f, 2, 20));
      for (let k = 0; k < n; k++) { c.save(); c.translate(540 + (k % 2) * 8 - 4, 690 - k * 15); c.rotate((k % 3 - 1) * 0.04); c.fillStyle = k % 2 ? COL.cream : "#e9dfc4"; c.fillRect(-170, -50, 340, 100); c.restore(); }
      if (f >= 22) {
        const p = easeOut(fade(f, 22, 8));
        c.save(); c.translate(760, 560); c.scale(p, p);
        c.beginPath(); c.moveTo(0, -70); c.lineTo(66, 50); c.lineTo(-66, 50); c.closePath(); c.fillStyle = COL.red; c.fill();
        c.font = "700 90px Caveat"; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("!", 0, 38); c.restore();
      }
      hand(c, "500 customer complaints", W / 2, 830, 64, COL.cream, seg(f, 6, 20), r, -0.02, "center");
      hand(c, "which could become legal trouble?", W / 2, 905, 54, COL.orangeLight, seg(f, 18, 34), r, -0.02, "center");
      if (f >= c1) {
        tag(c, "FLASH?", 215, 1030, 80, COL.yellow, COL.ink, -0.06, fade(f, c1, 8));
        tag(c, "PRO?", 540, 1030, 80, COL.orangeLight, COL.ink, 0.04, fade(f, c1 + 5, 8));
        tag(c, "BOTH?", 860, 1030, 80, "#86efac", COL.ink, -0.04, fade(f, c1 + 10, 8));
        hand(c, "comment your pick", W / 2, 1140, 62, COL.cream, seg(f, c1 + 14, c1 + 28), r, -0.02, "center");
      }
      if (f >= c2) {
        const hp = easeOut(fade(f, c2, 10));
        c.save(); c.globalAlpha = hp;
        c.fillStyle = "rgba(5,10,40,0.6)"; c.fillRect(0, 1170, W, 250);
        c.font = `700 ${handle.length > 16 ? 80 : 96}px Caveat`; c.textAlign = "center"; c.fillStyle = COL.yellow;
        c.fillText(handle, W / 2, 1275);
        c.font = `52px ${HAND}`; c.fillStyle = COL.cream; c.fillText("Follow for more AI, explained simply", W / 2, 1365);
        c.restore();
      }
    }} />
  );
};

export const DISTILL_SCENES = { ds_hook: DsHook, ds_class: DsClass, ds_soft: DsSoft, ds_results: DsResults, ds_cheap: DsCheap, ds_catch: DsCatch, ds_pick: DsPick, ds_ask: DsAsk };
