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

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.6 }) => (
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
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
    <Sfx at={0} src="audio/sfx_chaching.wav" vol={0.7} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1000 + boil);
      // the numbers first: legible on frame 0 (cover frame), stamped down from slightly larger
      const k1 = 1 + 0.2 * (1 - easeOut(fade(f, 0, 6))), k2 = 1 + 0.12 * (1 - easeOut(fade(f, 1, 6)));
      c.save(); c.translate(300, 560); c.scale(k1, k1); stopwatch(c, 0, 0, 150, f / 30, "< 30 min", r); c.restore();
      c.save(); c.translate(745, 600); c.scale(k2, k2); c.translate(-745, -600); tag(c, "under ₹5,000", 745, 600, 104, COL.yellow, COL.ink, 0.07, 1); c.restore();
      if (f >= c1 && f < c3 + 12) {
        // the maths-test card slides away when the word DISTILLATION arrives
        c.save(); c.translate(-1200 * Math.pow(seg(f, c3, c3 + 10), 2), 0);
        page(c, 120, 820, 840, 250, boil, -0.015);
        hand(c, "maths test", 200, 910, 64, COL.ink, seg(f, c1, c1 + 8), r, -0.02);
        hand(c, "beat an OpenAI reasoning model*", 200, 1000, 60, "#15803d", seg(f, c1 + 6, c1 + 22), r, -0.02);
        hand(c, "*o1-preview, competition maths, researchers' report (s1, 2025)", W / 2, 1120, 36, COL.pale, seg(f, c1 + 14, c1 + 26), r, -0.01, "center");
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
          hand(c, "hidden lessons:", W / 2, 1100, 66, COL.yellow, seg(f, c3 + 4, c3 + 16), r, -0.02, "center");
          hand(c, "a bit like a tiger, nothing like a car", W / 2, 1190, 56, COL.cream, seg(f, c3 + 12, c3 + 28), r, -0.02, "center");
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
    <>
    <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.5} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(1300 + boil);
      hand(c, "does it work?", W / 2, 360, 92, COL.cream, seg(f, 2, 14), r, -0.03, "center");
      badge(c, 540, 600, "97%", "of the score", "#86efac", seg(f, c1 - 2, c1 + 8), r);
      badge(c, 260, 820, "40%", "smaller", COL.orangeLight, seg(f, c2, c2 + 10), r);
      badge(c, 820, 820, "60%", "faster", COL.yellow, seg(f, c2 + 10, c2 + 20), r);
      hand(c, "DistilBERT (2019)", W / 2, 1000, 50, COL.pale, seg(f, c1 + 6, c1 + 18), r, -0.02, "center");
      if (f >= c3) {
        c.save(); rrect(c, 90, 1060, 900, 250, 26); c.fillStyle = "rgba(255,255,255,0.12)"; c.fill(); c.restore();
        hand(c, "Gemini Pro", 300, 1170, 70, COL.cream, seg(f, c3, c3 + 10), r, -0.02, "center");
        arrow(c, [450, 1150], [620, 1150], -40, COL.orange, 8, seg(f, c3 + 6, c3 + 16), r);
        hand(c, "Flash", 790, 1170, 76, COL.yellow, seg(f, c3 + 12, c3 + 22), r, -0.02, "center");
        hand(c, "Google said Flash learned from Pro (Gemini 1.5, 2024)", W / 2, 1270, 40, COL.pale, seg(f, c3 + 18, c3 + 34), r, -0.01, "center");
      }
    }} />
    </>
  );
};

// ---------- 5 IT CAN BE CHEAP ----------
const DsCheap: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
    <Sfx at={c3} src="audio/sfx_chaching.wav" vol={0.55} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1400 + boil);
      hand(c, "that maths model?", W / 2, 360, 88, COL.orangeLight, seg(f, 2, 14), r, -0.03, "center");
      if (f >= c1) {
        const n = Math.round(14 * seg(f, c1, c1 + 20));
        for (let k = 0; k < n; k++) { c.save(); c.translate(250 + (k % 2) * 6, 760 - k * 14); c.rotate((k % 3 - 1) * 0.03); c.fillStyle = k % 2 ? COL.cream : "#e9dfc4"; c.fillRect(-120, -16, 240, 30); c.restore(); }
        hand(c, "1,000 worked", 250, 830, 64, COL.cream, seg(f, c1 + 8, c1 + 20), r, -0.03, "center");
        hand(c, "solutions", 250, 900, 64, COL.cream, seg(f, c1 + 14, c1 + 26), r, -0.03, "center");
        hand(c, "from a smarter AI", 250, 970, 46, COL.pale, seg(f, c1 + 20, c1 + 32), r, -0.03, "center");
      }
      if (f >= c2) stopwatch(c, 760, 640, 130, (f - c2) / 30, "< 30 min", r);
      if (f >= c3) {
        tag(c, "under ₹5,000", 760, 900, 100, COL.yellow, COL.ink, 0.07, fade(f, c3, 8));
        hand(c, "(under $50 of cloud compute)", 760, 990, 42, COL.pale, seg(f, c3 + 6, c3 + 18), r, -0.02, "center");
      }
      hand(c, "s1: Stanford, UW, Ai2 (2025), built on an existing open model", W / 2, 1180, 38, COL.pale, seg(f, c1 + 10, c1 + 26), r, -0.01, "center");
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
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(1600 + boil);
      hand(c, "which one do I use?", W / 2, 370, 86, COL.cream, seg(f, 2, 14), r, -0.03, "center");
      const col = (x: number, title: string, items: string[], tint: string, p: number) => {
        if (p <= 0) return;
        c.save(); c.globalAlpha = easeOut(p); rrect(c, x, 440, 450, 560, 30); c.fillStyle = "rgba(255,255,255,0.1)"; c.fill(); c.restore();
        tag(c, title, x + 225, 520, 64, tint, COL.ink, -0.03, p);
        items.forEach((it, i) => hand(c, "• " + it, x + 40, 640 + i * 95, 52, COL.cream, clamp(p * 3 - i * 0.6), r, -0.01));
      };
      col(60, "MINI / FLASH", ["emails", "summaries", "pulling out data"], COL.yellow, seg(f, c1, c1 + 20));
      col(570, "PRO", ["multi-step", "reasoning", "when mini slips"], COL.orangeLight, seg(f, c2, c2 + 20));
      if (f >= c3) {
        page(c, 140, 1060, 800, 170, boil, -0.01);
        hand(c, "test on 20 real examples first", W / 2, 1165, 60, "#15803d", seg(f, c3, c3 + 16), r, -0.02, "center");
      }
      if (f >= c1) robot(c, 940, 1420, 0.42, boil, 2, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "thumb" });
    }} />
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
      // a stack of 500 emails
      const n = Math.round(10 * seg(f, 4, 24));
      for (let k = 0; k < n; k++) { c.save(); c.translate(540 + (k % 2) * 8 - 4, 700 - k * 16); c.rotate((k % 3 - 1) * 0.04); c.fillStyle = k % 2 ? COL.cream : "#e9dfc4"; c.fillRect(-170, -50, 340, 100); stroke(c, [[-170, -50], [0, 10], [170, -50]], "#94a3b8", 3, r, { passes: 1 }); c.restore(); }
      hand(c, "500 office emails to summarise", W / 2, 840, 60, COL.cream, seg(f, 10, 26), r, -0.02, "center");
      if (f >= c1) {
        tag(c, "PRO?", 330, 990, 96, COL.orangeLight, COL.ink, -0.06, fade(f, c1, 8));
        tag(c, "FLASH?", 750, 990, 96, COL.yellow, COL.ink, 0.06, fade(f, c1 + 6, 8));
        hand(c, "comment your pick", W / 2, 1120, 64, COL.cream, seg(f, c1 + 10, c1 + 24), r, -0.02, "center");
      }
      if (f >= c2) {
        const hp = easeOut(fade(f, c2, 10));
        c.save(); c.globalAlpha = hp;
        c.fillStyle = "rgba(5,10,40,0.6)"; c.fillRect(0, 1160, W, 260);
        c.font = `700 ${handle.length > 16 ? 80 : 96}px Caveat`; c.textAlign = "center"; c.fillStyle = COL.yellow;
        c.fillText(handle, W / 2, 1270);
        c.font = `52px ${HAND}`; c.fillStyle = COL.cream; c.fillText("Follow for more AI, explained simply", W / 2, 1360);
        c.restore();
      }
    }} />
  );
};

export const DISTILL_SCENES = { ds_hook: DsHook, ds_class: DsClass, ds_soft: DsSoft, ds_results: DsResults, ds_cheap: DsCheap, ds_catch: DsCatch, ds_pick: DsPick, ds_ask: DsAsk };
