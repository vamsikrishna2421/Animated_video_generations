import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, ease, easeOut, seg, lerp, writeOn } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";

// EP27 "Attention", drawn in the crayon style. Content lives in the band y 270..1400
// (banner above, karaoke captions below; the YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HAND = "'Patrick Hand'";
type WordBox = { w: string; x: number; y: number; wd: number; size: number };

// ---------- shared drawing ----------
const background = (c: Ctx, W: number, H: number, boil: number, tint = COL.blue) => {
  c.fillStyle = tint; c.fillRect(0, 0, W, H);
  const r = rng(40);
  hatch(c, [0, 0, W, H], [COL.deep, COL.navy, "#2a4cff", COL.light], r, { angle: -0.75, gap: 16, w: 5, alpha: 0.35, wobble: 4 });
};

const page = (c: Ctx, x: number, y: number, w: number, h: number, boil: number, rot = -0.012) => {
  const r = rng(60);
  c.save();
  c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(4,8,40,0.45)"; c.fillRect(14, 18, w, h);
  c.beginPath(); c.rect(0, 0, w, h); c.fillStyle = COL.cream; c.fill();
  c.save(); c.clip();
  hatch(c, [0, 0, w, h], ["#e9dfc4", "#ffffff", COL.creamShade], r, { angle: 0.04, gap: 10, w: 3, alpha: 0.3 });
  c.strokeStyle = "rgba(90,120,230,0.25)"; c.lineWidth = 2;
  for (let ly = 90; ly < h; ly += 96) { c.beginPath(); c.moveTo(0, ly + 18); c.lineTo(w, ly + 18); c.stroke(); }
  c.strokeStyle = "rgba(240,90,90,0.35)"; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, h); c.stroke();
  c.restore();
  stroke(c, [[0, 0], [w, 0], [w, h], [0, h], [0, 0]], COL.ink, 4, r, { passes: 2, alpha: 0.6 });
  c.restore();
};

const layout = (c: Ctx, text: string, x: number, y: number, maxW: number, size: number, lineH = 1.35): WordBox[] => {
  c.font = `${size}px ${HAND}`;
  const space = c.measureText(" ").width;
  const out: WordBox[] = [];
  let cx = x, cy = y;
  for (const w of text.split(" ")) {
    const wd = c.measureText(w).width;
    if (cx + wd > x + maxW && cx > x) { cx = x; cy += size * lineH; }
    out.push({ w, x: cx, y: cy, wd, size });
    cx += wd + space;
  }
  return out;
};

const ctr = (b: WordBox): Pt => [b.x + b.wd / 2, b.y - b.size * 0.3];
const top = (b: WordBox): Pt => [b.x + b.wd / 2, b.y - b.size * 0.78];

const drawWords = (c: Ctx, words: WordBox[], boil: number, opts: { reveal?: number; color?: (i: number) => string; alpha?: (i: number) => number; hide?: Set<number> } = {}) => {
  const r = rng(80 + boil);
  const n = opts.reveal ?? words.length;
  words.forEach((b, i) => {
    if (opts.hide?.has(i)) return;
    const p = clamp(n - i);
    if (p <= 0) return;
    c.save();
    c.font = `${b.size}px ${HAND}`;
    c.globalAlpha = (opts.alpha?.(i) ?? 1) * p;
    c.fillStyle = opts.color?.(i) ?? "#16152a";
    c.fillText(b.w, b.x + (r() - 0.5) * 1.5, b.y + (r() - 0.5) * 1.5);
    c.restore();
  });
};

// Curved crayon arrow from a to b, drawn up to progress p; lift < 0 bends upward.
const arrow = (c: Ctx, a: Pt, b: Pt, lift: number, color: string, w: number, p: number, r: () => number, head = true) => {
  if (p <= 0) return;
  const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) + lift;
  const pts: Pt[] = [];
  const N = 30, M = Math.max(2, Math.round(N * clamp(p)));
  for (let i = 0; i <= M; i++) {
    const t = i / N;
    pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1]]);
  }
  stroke(c, pts, color, w, r, { passes: 3, alpha: 0.85, jit: 2 });
  if (head && p >= 0.98) {
    const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[pts.length - 3];
    const ang = Math.atan2(y1 - y0, x1 - x0), L = 18 + w * 1.5;
    stroke(c, [[x1 - Math.cos(ang - 0.5) * L, y1 - Math.sin(ang - 0.5) * L], [x1, y1], [x1 - Math.cos(ang + 0.5) * L, y1 - Math.sin(ang + 0.5) * L]], color, w, r, { passes: 2, alpha: 0.9, jit: 2 });
  }
};

const ring = (c: Ctx, b: WordBox, color: string, p: number, r: () => number, w = 6) => {
  if (p <= 0) return;
  const [cx, cy] = ctr(b);
  stroke(c, circlePts(cx, cy, b.wd / 2 + 26, b.size * 0.62, -2.2, -2.2 + Math.PI * 2.15 * clamp(p), 40), color, w, r, { passes: 3, alpha: 0.85, jit: 2 });
};

const scribble = (c: Ctx, b: WordBox, p: number, r: () => number) => {
  if (p <= 0) return;
  const pts: Pt[] = [];
  const n = Math.round(12 * clamp(p));
  for (let i = 0; i <= n; i++) pts.push([b.x - 6 + (b.wd + 12) * (i / 12), b.y - b.size * (i % 2 ? 0.65 : 0.05)]);
  stroke(c, pts, COL.red, 6, r, { passes: 2, alpha: 0.85, jit: 2 });
};

const hand = (c: Ctx, text: string, x: number, y: number, size: number, color: string, p: number, r: () => number, rot = 0, align: "left" | "center" = "left") => {
  if (p <= 0) return;
  if (align === "center") { c.font = `700 ${size}px Caveat`; x -= c.measureText(text).width / 2; }
  writeOn(c, text, x, y, size, color, p, r, rot);
};

// Glowing attention string between two words; weight 0..1 sets thickness and glow.
const thread = (c: Ctx, a: Pt, b: Pt, wgt: number, p: number, r: () => number, color = COL.orange) => {
  if (p <= 0 || wgt <= 0.01) return;
  c.save();
  c.shadowColor = color; c.shadowBlur = 10 + 30 * wgt;
  arrow(c, a, b, -60 - Math.abs(a[0] - b[0]) * 0.25, color, 2 + 14 * wgt, p, r, false);
  c.restore();
};

const fade = (f: number, a: number, len = 8) => clamp((f - a) / len);

// little crayon person (whisper line)
const kid = (c: Ctx, x: number, y: number, s: number, boil: number, seed: number, mouth = false) => {
  const r = rng(seed * 13 + boil);
  c.save();
  c.beginPath(); c.ellipse(x, y + 1.25 * s, 0.75 * s, 0.95 * s, 0, Math.PI, 0); c.lineTo(x + 0.75 * s, y + 2.2 * s); c.lineTo(x - 0.75 * s, y + 2.2 * s); c.closePath();
  c.fillStyle = COL.orange; c.fill();
  c.clip(); hatch(c, [x - s, y, x + s, y + 2.3 * s], [COL.orangeLight, "#d9561a"], r, { gap: 6, w: 2.5, alpha: 0.5 }); c.restore();
  c.save(); c.beginPath(); c.arc(x, y, 0.5 * s, 0, Math.PI * 2); c.fillStyle = "#f2c79b"; c.fill(); c.restore();
  stroke(c, circlePts(x, y - 0.12 * s, 0.52 * s, 0.42 * s, Math.PI * 1.02, Math.PI * 1.98, 12), COL.ink, 0.22 * s, r, { passes: 2, alpha: 0.9 });
  c.fillStyle = COL.ink;
  c.beginPath(); c.arc(x + 0.18 * s, y + 0.02 * s, 0.05 * s, 0, 7); c.arc(x - 0.12 * s, y + 0.02 * s, 0.05 * s, 0, 7); c.fill();
  if (mouth) { c.beginPath(); c.ellipse(x + 0.12 * s, y + 0.25 * s, 0.08 * s, 0.06 * s, 0, 0, 7); c.fill(); }
};

// ---------- 1 HOOK ----------
const S1 = "The animal didn't cross the street because it was too tired.";
const AtHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(200 + boil);
      page(c, 70, 300, 940, 760, boil);
      const words = layout(c, S1, 160, 470, 790, 92, 1.45);
      const iIt = 7, iAnimal = 1, iStreet = 5, iTired = 10;
      const swapped = f >= c2;
      drawWords(c, words, boil, { reveal: f / 3.2, hide: swapped ? new Set([iTired]) : undefined, color: (i) => (i === iIt && f >= c1 ? COL.red : "#16152a") });
      if (swapped) {
        const b = words[iTired];
        const t = { ...b, w: "tired." };
        drawWords(c, [t], boil, { alpha: () => 0.5 });
        scribble(c, b, seg(f, c2, c2 + 10), r);
        hand(c, "wide.", b.x + 4, b.y + 96, 96, COL.red, seg(f, c2 + 8, c2 + 20), r, -0.05);
      }
      ring(c, words[iIt], COL.red, seg(f, c1 - 6, c1 + 8), r);
      // arrow to the animal, then swings to the street
      const target = f < c3 ? words[iAnimal] : words[iStreet];
      const p = f < c3 ? seg(f, c1, c1 + 12) : seg(f, c3, c3 + 10);
      arrow(c, top(words[iIt]), top(target), -150, COL.orange, 9, p, r);
      const label = f < c3 ? "the animal" : "the street";
      if (f >= c1) hand(c, `it = ${label}`, W / 2, 960, 92, COL.orange, f < c3 ? seg(f, c1 + 8, c1 + 22) : seg(f, c3 + 6, c3 + 20), r, -0.03, "center");
      // big question at the end
      const q = seg(f, c3 + 40, c3 + 52);
      if (q > 0) hand(c, "How does an AI know?", W / 2, 1270, 100, COL.cream, q, rng(9 + boil), -0.03, "center");
    }} />
  );
};

// ---------- 2 OLD WAY ----------
const AtOld: React.FC<SP> = ({ cue, s }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(300 + boil);
      hand(c, "one word at a time...", W / 2, 360, 84, COL.cream, seg(f, 4, 22), r, -0.02, "center");
      // conveyor of words read one by one
      const words = S1.split(" ");
      const k = Math.min(words.length, Math.floor(f / 5));
      c.font = `64px ${HAND}`;
      const shown = words.slice(Math.max(0, k - 4), k).join(" ");
      if (f < c1 + 10) {
        c.globalAlpha = 1 - fade(f, c1, 10);
        c.fillStyle = COL.cream; c.textAlign = "center"; c.fillText(shown, W / 2, 470); c.textAlign = "left"; c.globalAlpha = 1;
      }
      // whisper line
      const n = 6;
      const xs = (i: number) => lerp(170, 900, i / (n - 1));
      const ys = (i: number) => lerp(960, 680, i / (n - 1));
      const sz = (i: number) => lerp(150, 90, i / (n - 1));
      for (let i = n - 1; i >= 0; i--) kid(c, xs(i), ys(i), sz(i), boil, i, false);
      const trip = seg(f, c1, Math.max(c1 + 40, c2 + 10));
      const pos = trip * (n - 1);
      const bi = Math.min(n - 1, Math.floor(pos)), bt = pos - bi;
      const bx = lerp(xs(bi), xs(Math.min(n - 1, bi + 1)), bt), by = lerp(ys(bi), ys(Math.min(n - 1, bi + 1)), bt) - sz(bi) * 1.4;
      const bcx = clamp(bx, 280, 800);
      if (f >= c1 - 6) {
        const blur = trip * 9;
        c.save();
        c.beginPath(); c.ellipse(bcx, by - 70, 230, 80, 0, 0, Math.PI * 2); c.fillStyle = COL.cream; c.globalAlpha = 0.95; c.fill();
        c.globalAlpha = 1;
        stroke(c, circlePts(bcx, by - 70, 230, 80), COL.ink, 4, r, { passes: 2, alpha: 0.6 });
        c.filter = `blur(${blur.toFixed(1)}px)`;
        c.font = `46px ${HAND}`; c.fillStyle = "#16152a"; c.textAlign = "center";
        c.globalAlpha = 1 - 0.55 * trip;
        c.fillText("The animal didn't", bcx, by - 82);
        c.fillText("cross the street...", bcx, by - 36);
        c.restore();
      }
      if (f >= c2) hand(c, "the start fades away", W / 2, 1320, 80, COL.orangeLight, seg(f, c2 + 4, c2 + 22), r, -0.03, "center");
    }} />
  );
};

// ---------- 3 ATTENTION ----------
const WEIGHTS_TIRED = [0.05, 0.75, 0.05, 0.08, 0.03, 0.2, 0.06, 0.9, 0.15, 0.1];
const WEIGHTS_WIDE = [0.05, 0.15, 0.05, 0.1, 0.03, 0.85, 0.06, 0.9, 0.15, 0.1];
const AtAttn: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(400 + boil);
      page(c, 70, 300, 940, 1060, boil, 0.008);
      const words = layout(c, S1, 150, 760, 800, 84, 1.6);
      const iIt = 7, iAnimal = 1, iStreet = 5, iTired = 10;
      const wide = f >= c4;
      // reading head sweeps left to right, drawing faint strings back to earlier words
      const head = f < c2 ? Math.min(iTired, Math.floor(seg(f, c1, c2) * (iTired + 1))) : iTired;
      if (f >= c1 && f < c2) {
        for (let j = 0; j < head; j++) thread(c, top(words[head]), top(words[j]), 0.12, 1, r, COL.light);
      }
      const W8 = wide ? WEIGHTS_WIDE : WEIGHTS_TIRED;
      const grow = f < c4 ? seg(f, c2 + 6, c3) : 1;
      if (f >= c2) {
        for (let j = 0; j < iTired; j++) {
          if (j === iIt) continue;
          thread(c, top(words[iTired]), top(words[j]), W8[j] * 0.6 * grow, seg(f, c2, c2 + 14), r);
        }
        thread(c, top(words[iTired]), top(words[iIt]), 0.8 * grow, seg(f, c2, c2 + 14), r, COL.red);
      }
      // the it -> referent link (the payoff)
      const ref = wide ? iStreet : iAnimal;
      const linkP = wide ? seg(f, c4 + 10, c4 + 24) : seg(f, c3, c3 + 14);
      if (f >= c3) {
        c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 40;
        arrow(c, [ctr(words[iIt])[0], words[iIt].y + 18], [ctr(words[ref])[0], words[ref].y + 18], 170, COL.orange, 12, linkP, r);
        c.restore();
      }
      drawWords(c, words, boil, {
        hide: wide ? new Set([iTired]) : undefined,
        color: (i) => (i === iTired && f >= c2 ? COL.red : i === iIt && f >= c3 ? COL.orange : i === ref && f >= c3 && linkP > 0.9 ? "#d9561a" : "#16152a"),
      });
      if (wide) {
        const b = words[iTired];
        drawWords(c, [{ ...b, w: "wide." }], boil, { color: () => COL.red });
      }
      // reading head marker
      if (f >= c1 && f < c2 + 6) {
        const b = words[head];
        stroke(c, [[b.x, b.y + 22], [b.x + b.wd, b.y + 22]], COL.orange, 8, r, { passes: 2 });
      }
      hand(c, "each word looks back", W / 2, 470, 86, COL.ink, seg(f, c1, c1 + 16), r, -0.02, "center");
      hand(c, "& picks what matters", W / 2, 570, 86, COL.ink, seg(f, c1 + 12, c1 + 28), r, -0.02, "center");
    }} />
  );
};

// ---------- 4 HOW IT PICKS ----------
const TAGS: [string, string, number][] = [["animal", "living thing", 0.92], ["street", "a place", 0.25], ["cross", "an action", 0.1], ["didn't", "a 'no'", 0.05]];
const AtHow: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(500 + boil);
      // "it" card
      const itX = W / 2, itY = 420;
      const pop = easeOut(fade(f, 0, 10));
      c.save(); c.translate(itX, itY); c.scale(pop, pop);
      c.fillStyle = f >= c4 + 20 ? COL.orangeLight : COL.cream; c.fillRect(-120, -70, 240, 140);
      stroke(c, [[-120, -70], [120, -70], [120, 70], [-120, 70], [-120, -70]], COL.orange, 8, r);
      c.font = `110px ${HAND}`; c.fillStyle = "#16152a"; c.textAlign = "center"; c.fillText("it", 0, 36); c.textAlign = "left";
      c.restore();
      // question bubble
      if (f >= c1) {
        const q = easeOut(fade(f, c1, 10));
        c.save(); c.globalAlpha = q;
        c.beginPath(); c.ellipse(itX, 260, 420, 66, 0, 0, Math.PI * 2); c.fillStyle = COL.cream; c.fill();
        stroke(c, circlePts(itX, 260, 420, 66), COL.ink, 4, r, { passes: 2, alpha: 0.6 });
        c.restore();
        hand(c, "who am I talking about?", itX, 282, 72, COL.red, seg(f, c1 + 2, c1 + 20), r, 0, "center");
      }
      // word cards with name tags in an arc below
      TAGS.forEach(([w, tag, score], i) => {
        const x = 170 + i * 247, y = 820 + (i % 2) * 60;
        const p = easeOut(fade(f, c2 + i * 6, 10));
        if (p <= 0) return;
        c.save(); c.translate(x, y); c.scale(p, p);
        const best = i === 0 && f >= c3;
        c.fillStyle = best ? "#ffe2bf" : COL.cream; c.fillRect(-105, -55, 210, 110);
        stroke(c, [[-105, -55], [105, -55], [105, 55], [-105, 55], [-105, -55]], best ? COL.orange : COL.ink, best ? 8 : 4, r);
        c.font = `64px ${HAND}`; c.fillStyle = "#16152a"; c.textAlign = "center"; c.fillText(w, 0, 20);
        // tag on a string
        stroke(c, [[0, 55], [0, 110]], COL.pale, 3, r, { passes: 1 });
        c.fillStyle = COL.yellow; c.fillRect(-112, 110, 224, 70);
        c.font = `700 46px Caveat`; c.fillStyle = "#16152a"; c.fillText(tag, 0, 158);
        c.textAlign = "left";
        c.restore();
        // match meter
        const m = seg(f, c3, c3 + 18) * score;
        if (f >= c3) {
          const bx = x - 90, by = y + 230;
          c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(bx, by, 180, 26);
          c.fillStyle = i === 0 ? COL.orange : COL.light; c.fillRect(bx, by, 180 * m, 26);
          stroke(c, [[bx, by], [bx + 180, by], [bx + 180, by + 26], [bx, by + 26], [bx, by]], COL.cream, 3, r, { passes: 1 });
        }
        // attention string to "it", thickness by score
        if (f >= c3) thread(c, [x, y - 60], [itX, itY + 75], score * 0.8 * seg(f, c3, c3 + 14), 1, r);
      });
      // meaning flows from animal into it
      if (f >= c4) {
        const ax = 170, ay = 760;
        for (let k = 0; k < 14; k++) {
          const t = ((f - c4) / 30 + k / 14) % 1;
          const x = lerp(ax, itX, t), y = lerp(ay, itY + 70, t) - Math.sin(t * Math.PI) * 120;
          c.beginPath(); c.arc(x, y, 9, 0, 7); c.fillStyle = COL.orangeLight; c.globalAlpha = 0.9 * fade(f, c4, 8); c.fill(); c.globalAlpha = 1;
        }
        hand(c, "borrows meaning", itX + 150, 560, 64, COL.orangeLight, seg(f, c4 + 4, c4 + 20), r, -0.05);
      }
      // engineer labels, big
      const lab = c4 + 50;
      if (f >= lab) {
        hand(c, "QUERY", 120, 1270, 84, COL.red, seg(f, lab, lab + 10), r, -0.04);
        hand(c, "KEY", 470, 1290, 84, COL.yellow, seg(f, lab + 10, lab + 20), r, 0.02);
        hand(c, "VALUE", 720, 1270, 84, COL.orangeLight, seg(f, lab + 20, lab + 30), r, -0.03);
      }
    }} />
  );
};

// ---------- 5 THE CATCH ----------
const net = (c: Ctx, cx: number, cy: number, R: number, n: number, p: number, r: () => number, col: string) => {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  const pairs: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
  const k = Math.floor(pairs.length * clamp(p));
  c.save(); c.lineCap = "round";
  for (let q = 0; q < k; q++) {
    const [i, j] = pairs[q];
    c.strokeStyle = col; c.globalAlpha = 0.35 + 0.3 * r(); c.lineWidth = 2 + r() * 1.5;
    c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[j][0], pts[j][1]); c.stroke();
  }
  c.restore();
  pts.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 14, 0, 7); c.fillStyle = COL.cream; c.fill(); stroke(c, circlePts(x, y, 14, 14, 0, 7, 10), COL.ink, 3, r, { passes: 1 }); });
};
const AtCost: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(600 + boil);
      hand(c, "the catch", W / 2, 360, 100, COL.orangeLight, seg(f, 2, 16), r, -0.03, "center");
      const big = f >= c2;
      if (!big) {
        net(c, W / 2, 760, 260, 8, seg(f, c1, c1 + 30), r, COL.pale);
        if (f >= c1) hand(c, "8 words → 64 checks", W / 2, 1150, 80, COL.cream, seg(f, c1 + 14, c1 + 30), r, -0.02, "center");
      } else {
        net(c, W / 2, 760, 330, 16, seg(f, c2, c2 + 30), r, COL.orangeLight);
        hand(c, "16 words → 256 checks", W / 2, 1150, 80, COL.cream, seg(f, c2 + 10, c2 + 26), r, -0.02, "center");
        hand(c, "2× the words = 4× the work", W / 2, 1260, 72, COL.yellow, seg(f, c2 + 30, c2 + 46), r, -0.03, "center");
      }
      if (f >= c3) {
        // hourglass + LIMIT stamp
        const p = easeOut(fade(f, c3, 10));
        c.save(); c.translate(860, 470); c.scale(p, p); c.rotate(0.15);
        c.fillStyle = COL.red; c.fillRect(-120, -48, 240, 96);
        c.font = `700 70px Caveat`; c.fillStyle = COL.cream; c.textAlign = "center"; c.fillText("LIMIT", 0, 22); c.textAlign = "left";
        c.restore();
        hand(c, "long chats: slow + capped", W / 2, 1340, 62, COL.pale, seg(f, c3 + 6, c3 + 22), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 6 ORIGIN ----------
const AtOrigin: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(700 + boil);
      page(c, 140, 300, 800, 560, boil, -0.03);
      hand(c, "Attention Is", W / 2, 470, 96, "#16152a", seg(f, 2, 16), r, -0.03, "center");
      hand(c, "All You Need", W / 2, 570, 96, "#16152a", seg(f, 12, 26), r, -0.03, "center");
      hand(c, "Google research paper, 2017", W / 2, 680, 54, "#4a4a6a", seg(f, 22, 36), r, -0.03, "center");
      if (f >= c1) {
        hand(c, "the TRANSFORMER", W / 2, 790, 84, COL.orange, seg(f, c1, c1 + 14), r, -0.03, "center");
        c.font = `700 84px Caveat`; const tw = c.measureText("the TRANSFORMER").width;
        stroke(c, circlePts(W / 2, 770, tw / 2 + 30, 62, -2, -2 + Math.PI * 2.1 * seg(f, c1 + 12, c1 + 24), 40), COL.red, 6, r);
      }
      if (f >= c2) {
        const p = easeOut(fade(f, c2, 10));
        c.save(); c.translate(W / 2, 1110); c.scale(p, p);
        c.font = `150px ${HAND}`; c.textAlign = "center";
        c.fillStyle = COL.cream; c.fillText("ChatGP", -50, 50);
        c.shadowColor = COL.orange; c.shadowBlur = 40; c.fillStyle = COL.orange;
        const w = c.measureText("ChatGP").width;
        c.fillText("T", w / 2 - 50 + 40, 50);
        c.restore();
        hand(c, "Generative Pre-trained Transformer", W / 2, 1260, 58, COL.pale, seg(f, c2 + 14, c2 + 30), r, -0.02, "center");
      }
    }} />
  );
};

// ---------- 7 QUIZ ----------
const trophy = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-70, -90); c.lineTo(70, -90); c.quadraticCurveTo(70, 10, 0, 30); c.quadraticCurveTo(-70, 10, -70, -90); c.fillStyle = COL.yellow; c.fill();
  c.fillRect(-14, 28, 28, 40); c.fillRect(-50, 66, 100, 22);
  stroke(c, circlePts(-78, -50, 28, 30, Math.PI * 0.5, Math.PI * 1.5, 12), COL.yellow, 12, r, { passes: 2 });
  stroke(c, circlePts(78, -50, 28, 30, -Math.PI * 0.5, Math.PI * 0.5, 12), COL.yellow, 12, r, { passes: 2 });
  stroke(c, [[-50, -70], [-40, -10]], "#fff6c8", 8, r, { passes: 2 });
  c.restore();
};
const suitcase = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  stroke(c, circlePts(0, -70, 40, 30, Math.PI, Math.PI * 2, 12), COL.ink, 10, r, { passes: 2 });
  c.fillStyle = "#b5541c"; c.fillRect(-110, -70, 220, 150);
  c.save(); c.beginPath(); c.rect(-110, -70, 220, 150); c.clip(); hatch(c, [-110, -70, 110, 80], ["#8a3c12", COL.orange], r, { gap: 8, alpha: 0.5 }); c.restore();
  stroke(c, [[-110, -70], [110, -70], [110, 80], [-110, 80], [-110, -70]], COL.ink, 5, r, { passes: 2 });
  stroke(c, [[-60, -70], [-60, 80]], COL.yellow, 6, r, { passes: 2 }); stroke(c, [[60, -70], [60, 80]], COL.yellow, 6, r, { passes: 2 });
  c.restore();
};
const S2 = "The trophy didn't fit in the suitcase because it was too big.";
const AtQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(800 + boil);
      hand(c, "YOUR TURN", W / 2, 350, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
      page(c, 70, 400, 940, 380, boil, 0.01);
      const words = layout(c, S2, 140, 500, 820, 76, 1.4);
      const iIt = 8, iBig = 11, iTrophy = 1, iSuit = 6;
      const small = f >= c1;
      drawWords(c, words, boil, { reveal: f / 2.5, hide: small ? new Set([iBig]) : undefined, color: (i) => (i === iIt ? COL.red : "#16152a") });
      if (small) {
        const b = words[iBig];
        drawWords(c, [{ ...b, w: "big." }], boil, { alpha: () => 0.45 });
        scribble(c, b, seg(f, c1, c1 + 10), r);
        hand(c, "small.", b.x + b.wd + 24, b.y, 84, COL.red, seg(f, c1 + 6, c1 + 18), r, -0.05);
      }
      ring(c, words[iIt], COL.red, seg(f, 6, 20), r, 5);
      trophy(c, 300, 1080, 1.4, r);
      suitcase(c, 760, 1090, 1.3, r);
      // pause-and-answer countdown ring
      if (f >= c1 + 12 && f < c2) {
        const p = seg(f, c1 + 12, c2);
        hand(c, "pause & answer", W / 2, 1360, 70, COL.cream, seg(f, c1 + 12, c1 + 24), r, -0.02, "center");
        stroke(c, circlePts(W / 2, 1210, 60, 60, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p), 40), COL.yellow, 10, r, { passes: 2 });
      }
      if (f >= c2) {
        hand(c, "big → trophy", 150, 1320, 74, COL.yellow, seg(f, c2, c2 + 14), r, -0.03);
        hand(c, "small → suitcase", 560, 1320, 74, COL.orangeLight, seg(f, c2 + 16, c2 + 30), r, -0.03);
        c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 30;
        arrow(c, [ctr(words[iIt])[0], words[iIt].y + 20], [300, 960], 40, COL.yellow, 7, seg(f, c2, c2 + 12), r);
        arrow(c, [ctr(words[iIt])[0], words[iIt].y + 20], [760, 980], 40, COL.orangeLight, 7, seg(f, c2 + 16, c2 + 28), r);
        c.restore();
      }
    }} />
  );
};

// ---------- 8 OUTRO ----------
const AtOutro: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1);
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(900 + boil);
      hand(c, "Attention:", W / 2, 420, 110, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
      hand(c, "each word looks back", W / 2, 540, 84, COL.cream, seg(f, 8, 24), r, -0.02, "center");
      hand(c, "& decides what matters", W / 2, 640, 84, COL.cream, seg(f, 20, 36), r, -0.02, "center");
      if (f >= c1) {
        hand(c, "NEXT:", W / 2, 820, 80, COL.orangeLight, seg(f, c1, c1 + 10), r, -0.02, "center");
        // word turning into numbers
        const t = seg(f, c1 + 10, c1 + 40);
        const txt = t < 0.5 ? "animal" : "[0.21, -0.7, 0.93]";
        c.save(); c.globalAlpha = t < 0.5 ? 1 - t * 2 * 0.3 : (t - 0.5) * 2;
        c.font = `${t < 0.5 ? 110 : 76}px ${HAND}`; c.fillStyle = COL.cream; c.textAlign = "center"; c.fillText(txt, W / 2, 960); c.restore();
        hand(c, "words → numbers", W / 2, 1070, 76, COL.pale, seg(f, c1 + 30, c1 + 46), r, -0.02, "center");
        const hp = easeOut(fade(f, c1 + 50, 12));
        if (hp > 0) {
          c.save(); c.globalAlpha = hp;
          c.font = `700 ${handle.length > 16 ? 76 : 92}px Caveat`; c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24;
          c.fillText(handle, W / 2, 1250);
          c.shadowBlur = 0; c.font = `56px ${HAND}`; c.fillStyle = COL.cream; c.fillText("Follow for the next episode", W / 2, 1330);
          c.restore();
        }
      }
    }} />
  );
};

export const ATTN_SCENES = { at_hook: AtHook, at_old: AtOld, at_attn: AtAttn, at_how: AtHow, at_cost: AtCost, at_origin: AtOrigin, at_quiz: AtQuiz, at_outro: AtOutro };
