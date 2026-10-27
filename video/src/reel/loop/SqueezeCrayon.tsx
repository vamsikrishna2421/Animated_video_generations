import React from "react";
import { Ctx, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, PH, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { headline, bubble, xMark } from "./OwnCrayon";
import { gmGrid, fullDialog } from "./SizeCrayon";

// EP37 "The squeezed brain" (series/scripts/ep37_quantization.md): Ravi anna's shop. His phone filled up again, so the
// shop AI squeezed its own brain (EP35's medium brain) to 2 bits per number, and now it files nearly every WhatsApp
// message as an ORDER, his wife's "lunch is ready" included. A brain is 1.5 billion numbers; quantization stores each
// with fewer bits (16 bits: 65,536 possible values, 4 bits: 16, 2 bits: 4), like rounding the shop's prices. Our test
// (series/scripts/ep37_demo): the same brain at 16 / 8 / 4 / 2 bits sorting 40 messages, 39 / 39 / 39 / 20 right; 4-bit is
// a third of the size and twice as fast. Rule: download the Q4 file, never Q2. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 690 },   // hook: frame 1 and the loop's end, the shop lower
};
const GREEN = "#16a34a", ORANGE = "#ea580c", BLUE = "#2563eb", PURPLE = "#7c3aed", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;

// ---------- pieces ----------
// the AI's sorted messages: [label, message, wrong?]
export const BOOK: [string, string, boolean][] = [
  ["ORDER", "come home, lunch is ready", true], ["ORDER", "the milk you sent yesterday was sour", true],
];
const LABEL_COL: Record<string, string> = { ORDER: "#fee2e2", PAYMENT: "#dbeafe", COMPLAINT: "#fef3c7", OTHER: "#e2e8f0" };
// the order book as a card (screen space): `k` reveals the rows one by one, `ring` circles row 0
const orderBook = (c: Ctx, x: number, y: number, w: number, rows: [string, string, boolean][], k: number, ring: number, r: () => number, title = "Shop AI · sorted messages") => {
  if (k <= 0) return;
  const rh = 104, h = 84 + rows.length * rh;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 30); c.fill();
  c.fillStyle = "#fffdf5"; rrect(c, x, y, w, h, 30); c.fill();
  c.font = SANS(32); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(title, x + 34, y + 52);
  rows.forEach(([lab, msg, wrong], i) => {
    const q = clamp(k * rows.length * 1.2 - i); if (q <= 0) return;
    const yy = y + 80 + i * rh;
    c.save(); c.globalAlpha = q;
    c.fillStyle = LABEL_COL[lab] ?? "#e2e8f0"; rrect(c, x + 26, yy + 12, 210, 76, 20); c.fill();
    c.font = SANS(38); c.fillStyle = wrong ? "#991b1b" : INK; c.textAlign = "center"; c.fillText(lab, x + 131, yy + 64);
    c.font = handF(40); c.fillStyle = INK; c.textAlign = "left";
    let t = msg; while (c.measureText(t).width > w - 300 && t.length > 4) t = t.slice(0, -2);
    c.fillText(t === msg ? msg : t + "…", x + 258, yy + 64);
    c.restore();
  });
  if (ring > 0) {   // a red ring round row 0
    const yy = y + 80 + 50, cx = x + w / 2 + 40;
    const pts: [number, number][] = [];
    for (let a = 0; a <= Math.PI * 2 * ring; a += 0.12) pts.push([cx + Math.cos(a - 2.6) * (w / 2 - 6), yy + Math.sin(a - 2.6) * 66]);
    if (pts.length > 1) stroke(c, pts, RED, 8, r, { passes: 2 });
  }
  c.restore();
};
// a file icon for the brain: purple page, a folded corner, the size under it; `sq` squeezes it flat
export const brainFile = (c: Ctx, x: number, y: number, s: number, sq: number, gb: string, r: () => number) => {
  const w = 230 * (1 - 0.45 * sq), h = 290 * (1 - 0.12 * sq);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#a855f7"; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2 - 50, -h / 2); c.lineTo(w / 2, -h / 2 + 50); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill();
  c.fillStyle = "#d8b4fe"; c.beginPath(); c.moveTo(w / 2 - 50, -h / 2); c.lineTo(w / 2 - 50, -h / 2 + 50); c.lineTo(w / 2, -h / 2 + 50); c.closePath(); c.fill();
  const rr = rng(77);
  c.font = SANS(20); c.fillStyle = "rgba(255,255,255,0.75)"; c.textAlign = "center";
  for (let yy = -h / 2 + 80; yy < h / 2 - 20; yy += 26) c.fillText(Array.from({ length: Math.max(2, Math.floor(w / 26)) }, () => String(Math.floor(rr() * 10))).join(" "), 0, yy);
  stroke(c, [[-w / 2, -h / 2], [w / 2 - 50, -h / 2], [w / 2, -h / 2 + 50], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]], INK, 5, r, { passes: 1, alpha: 0.6 });
  c.font = SANS(48); c.fillStyle = INK; c.fillText(gb, 0, h / 2 + 64);
  c.restore();
};
// a C-clamp vice around the file: `close` 0 (open) .. 1 (jaws at the squeezed file's edges)
export const vice = (c: Ctx, x: number, y: number, s: number, close: number, r: () => number) => {
  const gap = 170 - 70 * easeOut(close);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#64748b";
  rrect(c, -gap - 60, -170, 60, 340, 12); c.fill();          // left jaw
  rrect(c, gap, -170, 60, 340, 12); c.fill();                // right jaw
  c.fillStyle = "#475569"; rrect(c, -gap - 60, 170, 2 * gap + 120 + 120, 44, 10); c.fill();   // the frame under
  c.fillStyle = "#94a3b8"; c.fillRect(gap + 60, -20, 160, 40);   // the screw
  c.fillStyle = "#334155"; rrect(c, gap + 200, -90, 40, 180, 12); c.fill();   // the handle
  stroke(c, [[-gap - 60, -170], [-gap, -170], [-gap, 170], [-gap - 60, 170], [-gap - 60, -170]], INK, 4, r, { passes: 1, alpha: 0.5 });
  stroke(c, [[gap, -170], [gap + 60, -170], [gap + 60, 170], [gap, 170], [gap, -170]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.restore();
};
// a row of bit cells (0/1) for one number: `n` cells, `k` reveals them
const bitCells = (c: Ctx, cx: number, y: number, n: number, k: number, cell = 52, col = BLUE) => {
  const bits = "0011110100110101";
  const w = n * cell;
  for (let i = 0; i < n; i++) {
    const q = clamp(k * n - i); if (q <= 0) continue;
    const x = cx - w / 2 + i * cell;
    c.save(); c.globalAlpha = q;
    c.fillStyle = col; rrect(c, x + 3, y, cell - 6, cell + 12, 8); c.fill();
    c.font = SANS(Math.round(cell * 0.62)); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(bits[i % 16], x + cell / 2, y + cell * 0.8);
    c.restore();
  }
};
// a ruler of possible values: `levels` ticks across `w`; dots snap from their true place to the nearest tick by `snap`
const ruler = (c: Ctx, cx: number, y: number, w: number, levels: number, snap: number, r: () => number, col = BLUE) => {
  const x0 = cx - w / 2;
  stroke(c, [[x0, y], [x0 + w, y]], INK, 6, r, { passes: 1 });
  const ticks = Math.min(levels, 64);
  for (let i = 0; i < ticks; i++) {
    const x = x0 + (w * i) / (ticks - 1);
    c.fillStyle = levels > 64 ? "#94a3b8" : col; c.fillRect(x - (levels > 64 ? 1.5 : 4), y - (levels > 64 ? 16 : 30), levels > 64 ? 3 : 8, levels > 64 ? 32 : 60);
  }
  const vals = [0.07, 0.21, 0.38, 0.55, 0.62, 0.81, 0.93];
  vals.forEach((v, i) => {
    const near = Math.round(v * (levels - 1)) / (levels - 1);
    const vv = v + (near - v) * easeOut(snap);
    const x = x0 + w * vv, yy = y - 70 - (i % 2) * 34;
    c.beginPath(); c.arc(x, yy, 16, 0, 7); c.fillStyle = ORANGE; c.fill();
    if (snap > 0) stroke(c, [[x0 + w * v, yy], [x, yy]], "#94a3b8", 3, r, { passes: 1, alpha: 0.6 });
  });
};
// the shop's price board (a chalkboard): items with the real price, the 2-bit price and the 4-bit price
const PRICES: [string, number][] = [["rice (1 kg)", 61.85], ["milk", 27.6], ["toor dal", 119.75], ["biscuits", 19.5]];   // the shop wall's "rice ₹60, dal ₹120" = the 4-bit column (Telugu review)
const nearest = (v: number, step: number, max = 150) => Math.min(max, Math.round(v / step) * step);
const rs = (v: number) => (Math.abs(v - Math.round(v)) < 0.001 ? `₹${Math.round(v)}` : `₹${v.toFixed(2)}`);
const priceBoard = (c: Ctx, W: number, y: number, k4: number, k2: number, ring: number, r: () => number) => {
  c.save(); c.translate(W / 2, y);
  c.fillStyle = "#7c4a1e"; rrect(c, -500, -90, 1000, 860, 26); c.fill();
  c.fillStyle = "#1f3b2d"; rrect(c, -474, -64, 948, 808, 18); c.fill();
  c.font = caveat(58); c.fillStyle = "#fef9c3"; c.textAlign = "center"; c.fillText("RAVI STORES · PRICE BOARD", 0, 0);
  const cols: [string, string, number, number][] = [["full size", "16-bit · 65,536 steps", -40, 1], ["4-bit", "16 steps", 200, k4], ["2-bit", "4 steps", 390, k2]];
  cols.forEach(([h, sub, x, k]) => {
    if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 3);
    c.font = caveat(52); c.fillStyle = h === "2-bit" ? "#fca5a5" : h === "4-bit" ? "#86efac" : "#f8fafc"; c.fillText(h, x, 96);
    c.font = SANS(26, 600); c.fillStyle = "#cbd5e1"; c.fillText(sub, x, 134);
    c.restore();
  });
  PRICES.forEach(([name, p], i) => {
    const yy = 250 + i * 128;
    c.font = caveat(58); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(name, -440, yy);
    c.textAlign = "center"; c.font = caveat(56); c.fillText(rs(p), -40, yy);
    if (k4 > 0) {
      c.save(); c.globalAlpha = clamp(k4 * 4 - i * 0.6); c.fillStyle = "#86efac"; c.font = caveat(60); c.fillText(rs(nearest(p, 10)), 200, yy); c.restore();
    }
    if (k2 > 0) {
      const v = nearest(p, 50);
      c.save(); c.globalAlpha = clamp(k2 * 4 - i * 0.6); c.fillStyle = Math.abs(v - p) > 15 ? "#fca5a5" : "#fde68a"; c.font = caveat(60); c.fillText(rs(v), 390, yy); c.restore();
    }
  });
  if (ring > 0) {   // the free biscuits
    const yy = 250 + 3 * 128 - 18, pts: [number, number][] = [];
    for (let a = 0; a <= Math.PI * 2 * ring; a += 0.15) pts.push([390 + Math.cos(a - 2.4) * 88, yy + Math.sin(a - 2.4) * 54]);
    if (pts.length > 1) stroke(c, pts, "#f87171", 8, r, { passes: 2 });
  }
  c.font = SANS(28, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center";
  if (k2 > 0) c.fillText("2-bit: every price on a shelf becomes ₹0, 50, 100 or 150", 0, 730);
  else if (k4 > 0) c.fillText("4-bit: rounded to the nearest ₹10", 0, 730);
  c.restore();
};
// the test card: same brain, four sizes, mistakes out of 40 as bars (the measured numbers)
const RESULTS: { bits: string; gb: string; wrong: number; col: string }[] = [
  { bits: "16-bit (full)", gb: "3.6 GB", wrong: 1, col: "#64748b" }, { bits: "8-bit", gb: "1.9 GB", wrong: 1, col: BLUE },
  { bits: "4-bit", gb: "1.1 GB", wrong: 1, col: GREEN }, { bits: "2-bit", gb: "0.75 GB", wrong: 20, col: RED },
];
const testCard = (c: Ctx, y0: number, k: number[], hl: number) => {
  RESULTS.forEach((row, i) => {
    const q = k[i] ?? 0; if (q <= 0) return;
    const y = y0 + i * 170, x0 = 140, wmax = 560;
    c.save(); c.globalAlpha = clamp(q * 3);
    if (i === hl) { c.fillStyle = "#dcfce7"; rrect(c, x0 - 24, y - 74, 852, 168, 22); c.fill(); }
    c.font = SANS(46); c.fillStyle = INK; c.textAlign = "left"; c.fillText(row.bits, x0, y - 18);
    c.font = SANS(40, 600); c.fillStyle = "#475569"; c.textAlign = "right"; c.fillText(row.gb, x0 + wmax + 240, y - 18);
    c.fillStyle = "#e2e8f0"; rrect(c, x0, y, wmax, 64, 14); c.fill();
    c.fillStyle = row.col; rrect(c, x0, y, Math.max(22, wmax * (row.wrong / 40) * easeOut(q)), 64, 14); c.fill();
    c.font = SANS(48); c.fillStyle = row.col; c.textAlign = "left"; c.fillText(`${row.wrong} wrong`, x0 + wmax + 20, y + 50);
    c.restore();
  });
};
// the rule chip (screen space): a title and rows that pop in
const ruleChip = (c: Ctx, W: number, y: number, title: string, rows: [string, string, string][], k: number[]) => {
  c.save(); c.translate(W / 2, y);
  const h = 150 + rows.length * 128;
  c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, -490, -110, 980, h, 30); c.fill();
  c.font = SANS(60); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText(title, 0, -20);
  rows.forEach(([t, bg, fg], i) => {
    const q = k[i] ?? 0; if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 2);
    c.fillStyle = bg; rrect(c, -450, 30 + i * 128, 900, 106, 22); c.fill();
    let fs = 48; c.font = SANS(fs); while (c.measureText(t).width > 820 && fs > 30) { fs -= 2; c.font = SANS(fs); }   // every row fits the chip
    c.fillStyle = fg; c.textAlign = "left"; c.fillText(t, -410, 100 + i * 128);
    c.restore();
  });
  c.restore();
};

// the quiz card (screen space), held in the gap after the line; its 3-2-1 ends as the card leaves
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -480, -380, 960, 720, 30); c.fill();
  c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -300);
  c.font = SANS(64); c.fillStyle = INK; c.fillText("4-BIT: how many wrong?", 0, -205);
  c.font = SANS(40, 600); c.fillStyle = "#475569"; c.fillText("(out of 40 · full size: 1 wrong)", 0, -145);
  c.font = SANS(64);
  [["A", "1"], ["B", "10"], ["C", "20"]].forEach(([l, v], i) => {
    const x = -300 + i * 300;
    c.fillStyle = "#e0e7ff"; rrect(c, x - 125, -100, 250, 130, 22); c.fill();
    c.fillStyle = INK; c.textAlign = "center"; c.fillText(`${l}  ${v}`, x, -14);
  });
  c.font = SANS(44, 600); c.fillStyle = "#475569"; c.fillText("comment A, B or C", 0, 110);
  const t = f - (next - 76), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(0, 240); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
    c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
  }
  c.restore();
};
// two big buttons on the phone: delete the photos or squeeze the AI; `pick` presses the second
const choice = (c: Ctx, W: number, k: number, pick: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.font = SANS(52); c.fillStyle = INK; c.textAlign = "center"; c.fillText("Phone full. Choose:", W / 2, 520);
  const btn = (y: number, t: string, bg: string, press: number) => {
    const sc = 1 - 0.06 * press;
    c.save(); c.translate(W / 2, y); c.scale(sc, sc);
    c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -380 + 8, -80 + 10, 760, 160, 40); c.fill();
    c.fillStyle = bg; rrect(c, -380, -80, 760, 160, 40); c.fill();
    c.font = SANS(62); c.fillStyle = "#fff"; c.fillText(t, 0, 22);
    c.restore();
  };
  btn(720, "DELETE PHOTOS", "#0f766e", 0);
  btn(960, "SQUEEZE THE AI", PURPLE, pick);
  if (pick > 0) { c.font = SANS(40, 600); c.fillStyle = PURPLE; c.fillText("→ 2-bit · 0.75 GB", W / 2, 1110); }
  c.restore();
};
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "phone"], 3: ["shock", "up"], 5: ["confused", "shrug"], 7: ["sus", "fold"], 9: ["sus", "point"], 11: ["hope", "fist"],
  12: ["happy", "thumb"], 13: ["panic", "up"], 15: ["sad", "thumb"], 16: ["yell", "phone"],   // 16 = frame 1's pose, so the loop joins
};
const NUMS = ["0.0371826", "-0.2149930", "0.5617742", "-0.0089311", "0.1294457", "-0.7731020", "0.3302871", "0.0045519", "-0.4410976", "0.2968104"];
const roundTo = (t: string) => { const v = parseFloat(t); return (Math.round(v * 100) / 100).toFixed(2); };

// ---------- the scene ----------
const StSqueeze: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    if (b.shot === "screen" || b.shot === "board") sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("k")} at={at + 1} src="audio/sfx_snap.wav" vol={0.6} />,
      <Sfx key={k("p0")} at={at + 9} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("p1")} at={at + 16} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "squeeze") sfx.push(<Sfx key={k("q")} at={cue(i, 1, 0.45) - 4} src="audio/gag_squish.wav" vol={0.5} />);
    if (b.prop === "board4") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "board2") sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.55) - 36} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("o")} at={cue(i, 1, 0.55)} src="audio/gag_bonk.wav" vol={0.45} />);   // a lift into "Biscuits: free"
    if (b.prop === "quiz") {
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - 76 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - 60} src="reel/sfx_riser.wav" vol={0.7} />, <Sfx key={k("h")} at={nx - 16} src="reel/sfx_boom.wav" vol={0.85} />,
        <Sfx key={k("c")} at={nx - 16} src="audio/sfx_snap.wav" vol={0.5} />);   // half a second early: on the cut it masked "ఒక్కటే"
    }
    if (b.prop === "test") sfx.push(<Sfx key={k("s")} at={at + 12} src="audio/sfx_success.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 7)} src="audio/sfx_snap.wav" vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 8)} src="reel/sfx_boom.wav" vol={0.5} />,
      <Sfx key={k("d")} at={cue(i, 1, 0.55)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "full") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.5) + q * 4} src="audio/sfx_pop.wav" vol={0.2} />));
    if (b.prop === "fine") sfx.push(<Sfx key={k("r")} at={nx - 38} src="reel/sfx_riser.wav" vol={0.55} />);
    if (b.prop === "loop") {
      const c1 = cue(i, 1, 0.6);
      // the hits land in the beat before "ORDER", about 8 frames early (on the word they made it "ready to order")
      sfx.push(<Sfx key={k("q")} at={at - 6} src="audio/gag_squish.wav" vol={0.55} />, <Sfx key={k("g")} at={c1 - 13} src="reel/sfx_glitch.wav" vol={0.6} />,
        <Sfx key={k("h")} at={c1 - 10} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("h2")} at={c1 - 8} src="reel/sfx_boom.wav" vol={0.9} />,
        <Sfx key={k("k")} at={c1 - 10} src="audio/sfx_snap.wav" vol={0.8} />, <Sfx key={k("b")} at={c1 + 22} src="audio/gag_bonk.wav" vol={0.4} />);
    }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9700 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = {
            squeeze: "your phone: storage full", round: "my brain: 150 crore numbers", test: "our real test: the same brain, 40 messages",
            choice: "storage full again",
          };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "squeeze") {
            const c1 = cu(1, 0.45), sq = easeOut(seg(f, c1 - 6, c1 + 6));
            c.fillStyle = RED; rrect(c, 140, 380, W - 280, 90, 20); c.fill();
            c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("⚠ Storage full · 0 GB free", W / 2, 440);
            brainFile(c, W / 2, 800, 1.3, sq, "", r);
            vice(c, W / 2, 780, 1.3, sq, r);
            c.font = SANS(60); c.fillStyle = sq < 0.5 ? GREEN : PURPLE; c.textAlign = "center"; c.fillText(sq < 0.5 ? "4-bit · 1.1 GB" : "2-bit · 0.75 GB", W / 2, 1150);
            c.font = SANS(36, 600); c.fillStyle = "#64748b"; c.fillText("the brain file", W / 2, 1210);
            if (f >= c1 + 4) tag(c, "2-BIT", 790, 560, 70, "#ede9fe", "#4c1d95", 0.05, seg(f, c1 + 4, c1 + 12));
          }
          if (b.prop === "round") {
            const c1 = cu(1, 0.4);
            if (f >= ln.from + 4) tag(c, "QUANTIZATION", W / 2, 400, 70, "#0f172a", "#facc15", -0.01, seg(f, ln.from + 4, ln.from + 12));
            if (f >= c1 - 4) tag(c, "= ROUNDING", W / 2, 500, 70, "#fef3c7", INK, 0.01, seg(f, c1 - 4, c1 + 4));
            const big = seg(f, c1, c1 + 10);   // one number, big: 0.0371826 rounds to 0.04
            c.font = SANS(120); c.textAlign = "center";
            if (big < 1) { c.save(); c.globalAlpha = 1 - big; c.fillStyle = "#334155"; c.fillText("0.0371826", W / 2, 760 + 120 * big * big); c.restore(); }
            if (big > 0) { c.save(); c.globalAlpha = big; c.fillStyle = GREEN; c.fillText("0.04", W / 2, 760); c.restore(); }
            c.font = SANS(36, 600); c.fillStyle = "#64748b"; c.fillText(big > 0.5 ? "0.0371826, rounded" : "one of my numbers", W / 2, 840);
            NUMS.slice(1, 4).forEach((t, q) => {
              const y = 1000 + q * 80, done = seg(f, c1 + 12 + q * 4, c1 + 20 + q * 4);
              c.font = SANS(52, 600); c.fillStyle = done > 0.5 ? GREEN : "#334155";
              c.fillText(done > 0.5 ? roundTo(t) : t, W / 2, y);
            });
            c.font = SANS(46); c.fillStyle = "#334155"; c.fillText("× 150 crore numbers", W / 2, 1330);
            c.font = SANS(36, 600); c.fillStyle = "#475569"; c.fillText("each one like a price on a board", W / 2, 1390);
          }
          if (b.prop === "test") {
            const c1 = cu(1, 0.4);
            testCard(c, 480, [seg(f, ln.from + 2, ln.from + 10), seg(f, ln.from + 6, ln.from + 14), seg(f, ln.from, ln.from + 8), seg(f, ln.from + 10, ln.from + 18)], 2);
            c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 360);
            c.font = SANS(34, 600); c.fillStyle = "#475569"; c.fillText("the same brain · 40 WhatsApp messages", W / 2, 405);
            if (f >= ln.from + 4) { c.save(); c.globalAlpha = seg(f, ln.from + 4, ln.from + 10); c.fillStyle = "#fef3c7"; rrect(c, 360, 760, 240, 62, 16); c.fill();
              c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("quiz: A ✓", 480, 805); c.restore(); }
            if (f >= c1 - 2) tag(c, "⅓ the size", 300, 1170, 62, "#dcfce7", "#14532d", -0.03, seg(f, c1 - 2, c1 + 6));
            if (f >= c1 + 10) tag(c, "2x faster", 760, 1170, 62, "#dcfce7", "#14532d", 0.03, seg(f, c1 + 10, c1 + 18));
            if (f >= c1 + 10) { c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("one reply, 4-core PC, no GPU: 3.4 s vs 7.5 s", W / 2, 1262); }
            if (f >= c1 + 22) { c.save(); c.globalAlpha = seg(f, c1 + 22, c1 + 28); c.fillStyle = "#fef3c7"; rrect(c, 120, 1292, W - 240, 66, 16); c.fill();
              c.font = SANS(40); c.fillStyle = "#78350f"; c.textAlign = "center"; c.fillText("the catch: 20 bills, 13 → 11 right", W / 2, 1338); c.restore(); }
            c.font = SANS(34); c.fillStyle = "#334155"; c.textAlign = "center";
            c.fillText("4-bit = the brain you installed (EP35)", W / 2, 1405);
            c.fillText("(some parts stay at more bits: ⅓, not ¼)", W / 2, 1448);
          }
          if (b.prop === "choice") choice(c, W, seg(f, ln.from, ln.from + 8), seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 6));
        } else if (b.shot === "board") {
          // ---------- the shop's price board, full frame ----------
          c.fillStyle = "#3f2a16"; c.fillRect(0, 0, W, H);
          const c1 = cu(1, 0.45);
          if (b.prop === "board4") priceBoard(c, W, 420, seg(f, c1 - 4, c1 + 8), 0, 0, r);
          if (b.prop === "board2") {
            priceBoard(c, W, 420, 1, seg(f, ln.from + 2, ln.from + 16), seg(f, c1, c1 + 12), r);
            if (f >= c1 + 6) tag(c, "FREE?!", 860, 1250, 90, "#fee2e2", "#991b1b", -0.06, seg(f, c1 + 6, c1 + 14));
          }
        } else {
          // ---------- the shop ----------
          const sh = n === 1 || n === 16 ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.14) || (n === 16 && f >= cu(1, 0.6) - 10 && f < cu(1, 0.6) + 2) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          // screen-space props
          if (n === 1 || (n === 16 && f >= cu(1, 0.6) - 10)) {   // frame 1, and the loop's last beat framed like it
            orderBook(c, 60, 215, W - 120, BOOK, n === 1 ? 1 : seg(f, cu(1, 0.6) - 10, cu(1, 0.6) - 4), n === 1 ? seg(p, 0.25, 0.6) : 1, r);
            c.save(); c.translate(W / 2, 1300); c.rotate(-0.025);
            c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, -420, -54, 840, 100, 22); c.fill();
            c.font = caveat(66); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("2-BIT AI: 20 OF 40 WRONG", 0, 18);
            c.restore();
          }
          if (n === 16 && f < cu(1, 0.6) - 10) {   // the vice closing on the phone's brain, then "Lunch is ready:"
            const sq = easeOut(seg(f, ln.from - 6, ln.from + 6));
            c.fillStyle = "rgba(15,23,42,0.55)"; c.fillRect(0, 0, W, H);
            brainFile(c, W / 2, 640, 1.1, sq, sq < 0.5 ? "4-bit · 1.1 GB" : "2-bit · 0.75 GB", r);
            vice(c, W / 2, 620, 1.1, sq, r);
          }
          if (n === 3) bubble(c, 330, 560, "You squeezed it?!", 74, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 5) bubble(c, 330, 560, "like my prices?", 76, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 7) bubble(c, 330, 560, "and 2-bit?", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 9) bubble(c, 330, 560, "4-bit: how many wrong?", 66, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 11) bubble(c, 330, 560, "which one?", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 12) {
            ruleChip(c, W, 330, "PICK THE Q4 FILE", [
              ["Q4 in the file name = 4-bit ✓", "#dcfce7", "#14532d"], ["Q2 broke our test brain: 20 wrong", "#fee2e2", "#991b1b"],
              ["using the ChatGPT app? nothing to do", "#e2e8f0", INK],
            ], [seg(p, 0.05, 0.15), seg(p, 0.2, 0.3), seg(p, 0.35, 0.45)]);
            const c1 = cu(1, 0.55);
            if (f >= c1) tag(c, "restoring Q4 · 1.1 GB ✓", PH.x - 60, 1140, 50, "#dcfce7", "#166534", 0.02, seg(f, c1, c1 + 8));
          }
          if (n === 13) {
            const c1 = cu(1, 0.5);
            gmGrid(c, 600, 230, 3, 3, 140, 110, 12, seg(f, c1 - 6, c1 + 18));   // right of Ravi's head, above the phone
            fullDialog(c, W / 2, 1200, 1.15, seg(p, 0.05, 0.2), "52 new good-morning photos", "free: 0 GB");   // over the counter, clear of Ravi's face
          }
          if (n === 15) {   // his thumb on the purple button
            c.save(); c.translate(760, 560); c.scale(0.9, 0.9);
            c.fillStyle = PURPLE; rrect(c, -260, -64, 520, 128, 34); c.fill();
            c.font = SANS(50); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SQUEEZE THE AI", 0, 18);
            c.restore();
          }
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
        void handF; void xMark; void headline; void ORANGE; void bitCells; void ruler;
      }} />
    </>
  );
};

export const SQUEEZE_SCENES = { sk_squeeze: StSqueeze };
