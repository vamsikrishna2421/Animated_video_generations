import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { kid } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, PH, WALL, Mood, Arms } from "./SkitCrayon";

// EP33 "We don't sell headaches" (series/scripts/ep33_hybrid_search.md): Ravi anna's shop from skit 01, and the shop AI
// searching his stock book. Shop lines play in the shop (shots as in skit 01); the AI's search lines open the phone to
// full frame and show what it did, drawn from our real demo (series/scripts/ep33_demo: 114 lines, pages of 8, the AI
// reads 3 pages per order). One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.1, x: 548, y: 790 }, ravi: { z: 1.6, x: 495, y: 715 }, ai: { z: 2.05, x: 800, y: 880 }, book: { z: 1.9, x: 600, y: 985 },
};
// Ravi's face and hands per line (AI lines in the shop: his reaction)
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "slam"], 3: ["angry", "rest"], 5: ["yell", "point"], 7: ["happy", "thumb"], 8: ["sus", "rest"], 9: ["shock", "rest"],
  10: ["angry", "point"], 12: ["confused", "shrug"], 14: ["sus", "fold"], 19: ["sus", "rest"], 21: ["yell", "up"], 23: ["angry", "rest"],
  25: ["smug", "point"], 26: ["smug", "rest"],
};
// the stock book, pages of 8 lines (the demo's own pages); what each page holds, in short
const PAGES: Record<number, string[]> = {
  10: ["B-8840 Potato chips", "B-8863 Chocolate bar", "H-9901 Dishwash bar", "H-9905 Dishwash liquid"],
  11: ["H-9918 Detergent powder", "H-9927 Floor cleaner", "H-9940 Mosquito coil", "H-9957 Camphor"],
  12: ["H-9963 Matchboxes", "H-9968 Candles", "H-9979 Broom", "T-3301 Toothpaste"],
  13: ["T-3322 Shampoo", "T-3340 Shaving blades", "T-3353 Pain relief balm", "T-3360 Hand wash"],
  14: ["E-1201 AA batteries", "E-1203 AAA batteries", "E-1216 Notebook", "E-1223 Ball pens"],
  15: ["E-1240 Clear tape", "E-1252 Torch"],
};
const TOPIC: Record<number, string> = {
  1: "rice", 2: "poha · dal", 3: "dal · oil", 4: "oil · spices", 5: "spices", 6: "pickles", 7: "vegetables", 8: "veg · milk",
  9: "tea · sugar", 10: "snacks · dishwash", 11: "detergent", 12: "candles · paste", 13: "shampoo · balm", 14: "batteries · pens", 15: "tape · torch",
};
// where each page sits in "meaning space" (food top-left, fresh middle, cleaning right, personal care and stationery below)
const MAP: Record<number, [number, number]> = {
  1: [250, 520], 2: [340, 600], 3: [430, 540], 4: [520, 610], 5: [600, 530], 6: [700, 600], 7: [300, 760], 8: [420, 820],
  9: [560, 780], 10: [690, 840], 11: [820, 760], 12: [830, 990], 13: [610, 1000], 14: [280, 1120], 15: [740, 1150],
};
const GREEN = "#16a34a", GREY = "#94a3b8";

// ---------- pieces ----------
const paper = (c: Ctx, x: number, y: number, w: number, h: number, rot: number, k: number) => {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.scale(k, k);
  c.fillStyle = "rgba(4,8,40,0.25)"; rrect(c, -w / 2 + 8, -h / 2 + 10, w, h, 14); c.fill();
  c.fillStyle = "#fffdf4"; rrect(c, -w / 2, -h / 2, w, h, 14); c.fill();
  c.strokeStyle = "rgba(37,99,235,0.18)"; c.lineWidth = 2;
  for (let yy = -h / 2 + 70; yy < h / 2 - 10; yy += 38) { c.beginPath(); c.moveTo(-w / 2 + 14, yy); c.lineTo(w / 2 - 14, yy); c.stroke(); }
  c.restore();
};
const pageCard = (c: Ctx, n: number, x: number, y: number, w: number, rot: number, k: number, r: () => number,
  o: { cross?: number; glow?: number; hl?: string; dim?: boolean; big?: boolean } = {}) => {
  if (k <= 0) return;
  const rows = o.big ? PAGES[n] ?? [TOPIC[n]] : [TOPIC[n]], rh = o.big ? 58 : 60, h = 110 + rows.length * rh;
  c.save(); c.globalAlpha = o.dim ? 0.45 : 1;
  if ((o.glow ?? 0) > 0) { c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 40 * (o.glow ?? 0); c.fillStyle = COL.yellow; rrect(c, x - 10, y - 10, w + 20, h + 20, 20); c.fill(); c.restore(); }
  paper(c, x, y, w, h, rot, easeOut(k));
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.scale(easeOut(k), easeOut(k)); c.translate(-w / 2, -h / 2);
  c.font = caveat(64); c.fillStyle = COL.red; c.textAlign = "left"; c.fillText(`p.${n}`, 18, 64);
  c.font = handF(o.big ? 40 : 42); c.fillStyle = INK;
  rows.forEach((t, i) => {
    if (o.hl && t.startsWith(o.hl)) { c.save(); c.globalAlpha = 0.8; c.fillStyle = COL.yellow; c.fillRect(12, 84 + i * rh, w - 24, rh - 6); c.restore(); c.fillStyle = INK; }
    c.fillText(t, 20, 124 + i * rh);
  });
  c.restore();
  if ((o.cross ?? 0) > 0) {
    const q = o.cross ?? 0;
    stroke(c, [[x + w * 0.55, y + 14], [x + w * 0.55 + 100 * seg(q, 0, 0.5), y + 14 + 100 * seg(q, 0, 0.5)]], COL.red, 14, r, { passes: 2 });
    if (q > 0.5) stroke(c, [[x + w * 0.55 + 100, y + 14], [x + w * 0.55 + 100 - 100 * seg(q, 0.5, 1), y + 14 + 100 * seg(q, 0.5, 1)]], COL.red, 14, r, { passes: 2 });
  }
  c.restore();
};
const chat = (c: Ctx, x: number, y: number, w: number, k: number, rows: { who: "c" | "ai"; t: string; p: number; col?: string }[]) => {
  if (k <= 0) return;
  const h = 120 + rows.length * 96;
  c.save(); c.translate(x + w / 2, y); c.scale(easeOut(k), easeOut(k)); c.translate(-w / 2, 0);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 10, 14, w, h, 30); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, 0, 0, w, h, 30); c.fill();
  c.fillStyle = "#075e54"; rrect(c, 0, 0, w, 72, 30); c.fill(); c.fillRect(0, 40, w, 32);
  c.font = handF(34); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Ravi Kirana · orders", 24, 50);
  rows.forEach((m, i) => {
    if (m.p <= 0) return;
    c.save(); c.globalAlpha = clamp(m.p * 2);
    c.font = handF(40); const tw = Math.min(w - 120, c.measureText(m.t).width + 44);
    const bx = m.who === "c" ? 22 : w - 22 - tw, by = 96 + i * 96;
    c.fillStyle = m.who === "c" ? "#fff" : "#dcf8c6"; rrect(c, bx, by, tw, 74, 18); c.fill();
    c.fillStyle = m.col ?? INK; c.fillText(m.t, bx + 22, by + 50);
    c.font = handF(20); c.fillStyle = "#64748b"; c.fillText(m.who === "c" ? "customer" : "Shop AI", bx + 12, by - 6);
    c.restore();
  });
  c.restore();
};
// the phone opened to full frame: header with the AI's face, white screen below
export const bigPhone = (c: Ctx, W: number, H: number, title: string, r: () => number, f: number) => {
  c.fillStyle = "#0b1220"; rrect(c, 62, 150, W - 124, 1350, 64); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 88, 178, W - 176, 1294, 44); c.fill();
  c.fillStyle = COL.orange; rrect(c, 116, 206, 92, 84, 18); c.fill();
  stroke(c, rrectPts(116, 206, 92, 84), INK, 3, r, { passes: 1, alpha: 0.6 });
  const blink = f % 84 > 79;
  [140, 184].forEach((ex) => {
    if (blink) { stroke(c, [[ex - 9, 244], [ex + 9, 244]], INK, 4, r, { passes: 1 }); return; }
    c.beginPath(); c.arc(ex, 244, 11, 0, 7); c.fillStyle = "#fff"; c.fill(); c.beginPath(); c.arc(ex, 246, 5, 0, 7); c.fillStyle = INK; c.fill();
  });
  stroke(c, [[150, 272], [174, 272]], INK, 4, r, { passes: 1 });
  c.font = caveat(48); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Shop AI", 228, 246);
  c.font = handF(30); c.fillStyle = "#475569"; c.fillText(title, 228, 284);
  stroke(c, [[110, 312], [W - 110, 312]], "#cbd5e1", 3, r, { passes: 1 });
};
const toggle = (c: Ctx, x: number, y: number, name: string, on: number, k: number, sc = 1.25) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 1.5); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y);
  c.fillStyle = "rgba(15,23,42,0.85)"; rrect(c, x, y, 300, 64, 32); c.fill();
  c.font = handF(30); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(name, x + 22, y + 43);
  const kx = x + 222;
  c.fillStyle = on > 0.5 ? GREEN : "#64748b"; rrect(c, kx, y + 12, 64, 40, 20); c.fill();
  c.beginPath(); c.arc(kx + 20 + 24 * on, y + 32, 15, 0, 7); c.fillStyle = "#fff"; c.fill();
  c.font = handF(18); c.fillStyle = on > 0.5 ? "#bbf7d0" : "#cbd5e1"; c.fillText(on > 0.5 ? "ON" : "OFF", kx - 52, y + 40);
  c.restore();
};
const ruleCard = (c: Ctx, x: number, y: number, s: number, k: number, bothOff: number) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s * easeOut(k), s * easeOut(k));
  c.font = caveat(62); c.textAlign = "left";
  const words = ["BOTH.", "TEST.", "WRITE IT DOWN."], gap = 26;
  const ws = words.map((t) => c.measureText(t).width), tw = ws.reduce((a, b) => a + b, 0) + gap * 2;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -tw / 2 - 36 + 10, -64 + 12, tw + 72, 128, 26); c.fill();
  c.fillStyle = COL.yellow; rrect(c, -tw / 2 - 36, -64, tw + 72, 128, 26); c.fill();
  let px = -tw / 2;
  words.forEach((t, i) => {
    c.fillStyle = i === 0 && bothOff > 0 ? `rgba(22,21,42,${1 - 0.7 * bothOff})` : INK;
    c.fillText(t, px, 22);
    if (i === 0 && bothOff > 0) { c.strokeStyle = COL.red; c.lineWidth = 8; c.beginPath(); c.moveTo(px - 6, 2); c.lineTo(px - 6 + (ws[0] + 12) * bothOff, 2); c.stroke(); }
    px += ws[i] + gap;
  });
  c.restore();
};
export const bar = (c: Ctx, y: number, label: string, v: number, col: string, k: number, note?: string) => {
  if (k <= 0) return;
  const x0 = 150, wmax = 640, q = easeOut(k);
  c.font = caveat(52); c.fillStyle = INK; c.textAlign = "left"; c.fillText(label, x0, y - 18);
  c.fillStyle = "#e2e8f0"; rrect(c, x0, y, wmax, 78, 16); c.fill();
  c.fillStyle = col; rrect(c, x0, y, Math.max(20, wmax * (v / 20) * q), 78, 16); c.fill();
  c.font = caveat(70); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`${Math.round(v * q)}/20`, x0 + wmax + 20, y + 60);
  if (note) { c.font = handF(36); c.fillStyle = "#334155"; c.fillText(note, x0 + 12, y + 122); }
};
const houses = (c: Ctx, r: () => number, p: number, boil: number) => {
  const xs = [240, 540, 840], nums = ["No. 12", "No. 7", "No. 31"];
  xs.forEach((x, i) => {
    c.fillStyle = ["#fca5a5", "#93c5fd", "#86efac"][i]; c.fillRect(x - 110, 640, 220, 200);
    c.beginPath(); c.moveTo(x - 130, 640); c.lineTo(x, 540); c.lineTo(x + 130, 640); c.closePath(); c.fillStyle = "#b45309"; c.fill();
    c.fillStyle = "#7c2d12"; c.fillRect(x - 30, 740, 60, 100);
    c.font = caveat(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText(nums[i], x, 700);
    const at = 0.18 + i * 0.25;
    if (p > at + 0.12) {
      c.save(); c.globalAlpha = seg(p, at + 0.12, at + 0.2);
      stroke(c, [[x - 30, 900], [x - 6, 930], [x + 40, 870]], GREEN, 12, r, { passes: 2 });
      c.restore();
    }
  });
  const bx = 120 + 760 * seg(p, 0.05, 0.9);
  kid(c, bx, 940, 64, boil, 5, true);
  c.fillStyle = "#a16207"; c.fillRect(bx + 34, 950, 54, 44);
  c.font = handF(30); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("addresses you already know", 540, 1120);
};
const SHEET: [string, string, boolean][] = [
  ["E-1203", "AAA batteries", true], ["something for a headache", "Pain relief balm", true], ["kothimeera", "coriander leaves", true],
  ["gongura pickle", "Gongura pickle", true], ["D-0313, one kg", "Moong dal", true], ["keep mosquitoes away", "Mosquito coil", true],
  ["25 kilo rice bag", "R-1742 rice", true], ["something to wash vessels", "Dishwash bar", false], ["Ramesh garu's usual", "R-1724 rice", false],
];

// ---------- the scene ----------
const StStock: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const sfx: React.ReactNode[] = [];
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 3} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("b")} at={at + 3} src="audio/gag_bonk.wav" vol={0.5} />,
      <Sfx key={k("c")} at={cue(i, 1, 0.25) - 9} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 2, 0.6) - 9} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.shot === "screen") sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.25} />);   // early: on the cut it masked "Then"
    if (b.prop === "pages") { const c1 = cue(i, 1, 0.3); [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("x" + q)} at={c1 + 4 + q * 5} src="audio/sfx_snap.wav" vol={0.22} />)); sfx.push(<Sfx key={k("d")} at={c1 + 20} src="audio/gag_ding.wav" vol={0.3} />); }
    if (b.prop === "keyword") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.55) - 8} src="audio/gag_ding.wav" vol={0.32} />);   // no typing ticks: they masked "Then use keyword"
    if (b.prop === "order") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.35) - 8} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "zero") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("s")} at={end + 1} src="audio/gag_boing.wav" vol={0.55} />);
    if (b.prop === "balm") sfx.push(<Sfx key={k("p")} at={at + 6} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "words") [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("x" + q)} at={cue(i, 1, 0.55) + 10 + q * 5} src="audio/sfx_snap.wav" vol={0.2} />));
    if (b.prop === "hybrid") sfx.push(<Sfx key={k("m")} at={cue(i, 1, 0.3) - 10} src="audio/sfx_whoosh.wav" vol={0.28} />,   // on "Merge" it read "Worst" <Sfx key={k("p")} at={cue(i, 2, 0.7)} src="audio/sfx_pop.wav" vol={0.5} />,
      <Sfx key={k("c")} at={cue(i, 2, 0.7) + 10} src="audio/watch_click.wav" vol={0.5} />);
    if (b.prop === "delivery") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("d" + q)} at={at + Math.round(l.frames * (0.32 + q * 0.25))} src="audio/gag_ding.wav" vol={0.2} />));
    if (b.prop === "sheet") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 8 + q * 9} src="audio/sfx_tick.wav" vol={0.16} />));
    if (b.prop === "bars") sfx.push(<Sfx key={k("a")} at={at + 4} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 1, 0.6)} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "both") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.45) - 1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("s")} at={cue(i, 1, 0.45) + 4} src="audio/sfx_snap.wav" vol={0.55} />);
    if (b.prop === "rows") sfx.push(<Sfx key={k("a")} at={at - 4} src="audio/sfx_snap.wav" vol={0.3} />, <Sfx key={k("b")} at={cue(i, 1, 0.55) - 8} src="audio/sfx_snap.wav" vol={0.26} />);
    if (b.prop === "booksearch") sfx.push(<Sfx key={k("a")} at={at + 10} src="audio/gag_bonk.wav" vol={0.3} />, <Sfx key={k("b")} at={at + 24} src="audio/gag_bonk.wav" vol={0.3} />,
      <Sfx key={k("c")} at={end - 6} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "write") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * 9} src="audio/sfx_tick.wav" vol={0.16} />));
    if (b.prop === "stamp") sfx.push(<Sfx key={k("a")} at={at + 4} src="audio/sfx_success.wav" vol={0.5} />, <Sfx key={k("b")} at={at + 4} src="audio/sfx_snap.wav" vol={0.5} />);
    if (b.prop === "switchoff") { const c1 = cue(i, 1, 0.3), c2 = cue(i, 2, 0.55); sfx.push(<Sfx key={k("c")} at={c1} src="audio/watch_click.wav" vol={0.7} />,
      <Sfx key={k("r")} at={c2 - 6} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("p")} at={end - 10} src="audio/sfx_pop.wav" vol={0.55} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9300 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = {
            pages: "searching the stock book", meaning: "MEANING search", keyword: "KEYWORD search", words: "KEYWORD search: \"something for a headache\"",
            hybrid: "BOTH searches, merged", delivery: "how to test me", sheet: "our real test", bars: "our real test: 20 orders", both: "our real test: 20 orders",
            rows: "the two misses", booksearch: "your stock book", stamp: "after writing it down",
          };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 316); c.scale(0.92, 0.92); c.translate(-W / 2, -160);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "pages") {
            const c1 = cu(1, 0.3);
            tag(c, "It reads 3 of the book's 15 pages", 540, 410, 52, COL.yellow, INK, -0.02, seg(p, 0.02, 0.15));
            [15, 12, 13].forEach((pg, q) => pageCard(c, pg, 112 + q * 288, 490 + q * 24, 276, (q - 1) * 0.05, seg(f, c1 - 6 + q * 3, c1 + q * 3 + 2), r, { cross: seg(f, c1 + 4 + q * 5, c1 + 10 + q * 5) }));
            const g = seg(f, c1 + 18, c1 + 26);
            pageCard(c, 14, 170, 810, 740, -0.02, g, r, { glow: g, hl: "E-1203", big: true });
            if (g > 0.6) tag(c, "E-1203 is on p.14", 540, 1420, 60, COL.yellow, INK, -0.03, seg(f, c1 + 22, c1 + 30));
          }
          if (b.prop === "meaning") {
            c.font = handF(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("pages placed by what they're about", 540, 400);
            const qx = 720, qy = 1060, c1 = cu(1, 0.45);
            Object.entries(MAP).forEach(([kk, [x, y]], j) => {
              const pg = Number(kk), on = seg(f, ln.from + j, ln.from + j + 6);
              if (on <= 0) return;
              c.save(); c.globalAlpha = on;
              c.beginPath(); c.arc(x, y, pg === 14 ? 24 : 19, 0, 7); c.fillStyle = [15, 12, 13].includes(pg) ? COL.orange : pg === 14 ? GREEN : "#64748b"; c.fill();
              c.font = handF([15, 12, 13, 14].includes(pg) ? 40 : 34); c.fillStyle = INK; c.textAlign = "center"; c.fillText(TOPIC[pg], x, y - 32);
              c.restore();
            });
            const drop = easeOut(seg(f, ln.from + 18, ln.from + 30));
            if (drop > 0) {
              const y = 300 + (qy - 300) * drop;
              c.save(); c.translate(qx, y); c.font = caveat(60); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("★", 0, 18); c.font = caveat(46); c.fillText("E-1203", 0, 70); c.restore();
              if (drop >= 1) [15, 12, 13].forEach((pg, q) => {
                const [x, yy] = MAP[pg];
                stroke(c, [[qx, qy], [qx + (x - qx) * seg(f, ln.from + 30 + q * 4, ln.from + 38 + q * 4), qy + (yy - qy) * seg(f, ln.from + 30 + q * 4, ln.from + 38 + q * 4)]], COL.orange, 6, r, { passes: 2 });
              });
              if (drop >= 1) { stroke(c, circlePts(MAP[14][0], MAP[14][1], 48, 48), GREEN, 5, r, { passes: 2, alpha: seg(f, c1, c1 + 8) });
                c.save(); c.globalAlpha = seg(f, c1, c1 + 8); c.font = handF(38); c.fillStyle = GREEN; c.textAlign = "center"; c.fillText("the right page: too far", MAP[14][0] + 60, MAP[14][1] + 80); c.restore(); }
            }
            c.font = handF(34); c.textAlign = "left";
            c.beginPath(); c.arc(160, 1300, 16, 0, 7); c.fillStyle = COL.orange; c.fill(); c.fillStyle = INK; c.fillText("the 3 pages it reads", 186, 1312);
            c.beginPath(); c.arc(600, 1300, 18, 0, 7); c.fillStyle = GREEN; c.fill(); c.fillStyle = INK; c.fillText("the right page", 628, 1312);
            if (f >= c1) tag(c, "To meaning search, codes look alike", 540, 1420, 50, COL.yellow, INK, -0.02, seg(f, c1, c1 + 8));
          }
          if (b.prop === "keyword") {
            c.fillStyle = "#e2e8f0"; rrect(c, 130, 360, 820, 90, 45); c.fill();
            const typed = "E-1203".slice(0, Math.round(6 * seg(f, ln.from + 2, ln.from + 20)));
            c.font = handF(48); c.fillStyle = INK; c.textAlign = "left"; c.fillText("🔍 " + typed + (Math.floor(f / 8) % 2 ? "|" : ""), 160, 422);
            const c1 = cu(1, 0.55);
            for (let pg = 1; pg <= 15; pg++) {
              const y = 500 + (pg - 1) * 58, hit = pg === 14 && f >= c1 - 6;
              const scan = seg(f, ln.from + 20, c1 - 6) * 15;
              c.fillStyle = hit ? "#bbf7d0" : pg <= scan ? "#f1f5f9" : "#ffffff"; rrect(c, 130, y, 820, 50, 10); c.fill();
              c.font = handF(30); c.fillStyle = hit ? INK : pg <= scan ? GREY : "#cbd5e1"; c.fillText(`p.${pg}  ${TOPIC[pg]}`, 150, y + 36);
              if (hit) { c.font = caveat(40); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("E-1203 AAA batteries ✓", 930, y + 38); c.textAlign = "left"; }
            }
            if (f >= c1) tag(c, "exact match only", 540, 1410, 50, COL.yellow, INK, -0.02, seg(f, c1, c1 + 8));
          }
          if (b.prop === "words") {
            const ws = ["something", "for", "a", "headache"], bk = ["Pain", "relief", "balm"], c1 = cu(1, 0.55);
            c.font = handF(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("the order's words", 540, 430); c.fillText("the stock book's words", 540, 900);
            ws.forEach((t, q) => tag(c, t, 190 + q * 235, 540, 50, "#e0f2fe", INK, 0, seg(f, ln.from + q * 3, ln.from + q * 3 + 8)));
            bk.forEach((t, q) => tag(c, t, 300 + q * 240, 1010, 54, "#fffdf4", INK, 0, seg(f, ln.from + 10 + q * 3, ln.from + 18 + q * 3)));
            ws.forEach((_, q) => { const x = 190 + q * 235, a = seg(f, c1 + q * 5, c1 + q * 5 + 6); if (a > 0) { stroke(c, [[x - 30, 690], [x + 30, 760]], COL.red, 10, r, { passes: 2, alpha: a }); stroke(c, [[x + 30, 690], [x - 30, 760]], COL.red, 10, r, { passes: 2, alpha: a }); } });
            if (f > c1 + 20) tag(c, "no word in common = 0 matches", 540, 1250, 52, COL.yellow, INK, -0.02, seg(f, c1 + 20, c1 + 28));
          }
          if (b.prop === "hybrid") {
            const c1 = cu(1, 0.3), c2 = cu(2, 0.7), m = easeOut(seg(f, c1, c1 + 16));
            c.font = caveat(48); c.textAlign = "center";
            if (m < 1) { c.fillStyle = COL.orange; c.fillText("MEANING", 300 + 240 * m, 420); c.fillStyle = "#2563eb"; c.fillText("KEYWORD", 780 - 240 * m, 420); }
            else { c.fillStyle = GREEN; c.fillText("MERGED: meaning + keyword", 540, 420); }
            const L = [15, 12, 13], K = [14, 15], M = [15, 14, 12];
            if (m < 1) {
              L.forEach((pg, q) => tag(c, `p.${pg} ${TOPIC[pg]}`, 300 + 240 * m, 520 + q * 96, 40, "#ffedd5", INK, 0, seg(f, ln.from + q * 3, ln.from + q * 3 + 8)));
              K.forEach((pg, q) => tag(c, `p.${pg} ${TOPIC[pg]}`, 780 - 240 * m, 520 + q * 96, 40, "#dbeafe", INK, 0, seg(f, ln.from + 6 + q * 3, ln.from + 14 + q * 3)));
            } else {
              M.forEach((pg, q) => tag(c, `${q + 1}.  p.${pg} ${TOPIC[pg]}${pg === 14 ? "  ✓" : ""}`, 540, 560 + q * 110, 48, pg === 14 ? "#bbf7d0" : "#f1f5f9", INK, 0, 1));
              c.font = handF(28); c.fillStyle = "#475569"; c.fillText("high in either list = goes up", 540, 920);
            }
            if (f >= c2) stamp(c, "STILL 3 PAGES", 540, 1120, 84, COL.red, seg(f, c2, c2 + 8), r, -0.05);
            if (f >= c2 + 10) { toggle(c, 130, 1290, "MEANING", 1, seg(f, c2 + 10, c2 + 16)); toggle(c, 650, 1290, "KEYWORD", 1, seg(f, c2 + 12, c2 + 18)); }
          }
          if (b.prop === "delivery") houses(c, r, p, boil);
          if (b.prop === "sheet") {
            c.font = caveat(84); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("OUR REAL TEST", 540, 420);
            c.font = handF(36); c.fillStyle = "#334155"; c.fillText("our small demo: 20 orders, right item known", 540, 476);
            SHEET.forEach(([o, a, ok], q) => {
              const y = 530 + q * 92, on = seg(f, ln.from + 4 + q * 5, ln.from + 10 + q * 5);
              if (on <= 0) return;
              c.save(); c.globalAlpha = on;
              c.fillStyle = q % 2 ? "#f8fafc" : "#f1f5f9"; c.fillRect(120, y, 840, 80);
              c.font = handF(32); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`"${o}"`, 140, y + 50);
              c.textAlign = "right"; c.fillStyle = "#334155"; c.fillText(`→ ${a}`, 940, y + 50);
              c.restore();
              void ok;
            });
            c.font = handF(30); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("… and 11 more", 540, 1400);
          }
          if (b.prop === "bars" || b.prop === "both") {
            const c1 = b.prop === "bars" ? cu(1, 0.6) : 0, bothAt = b.prop === "both" ? cu(1, 0.45) : Infinity;
            c.font = caveat(56); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("OUR REAL TEST", 540, 410);
            c.font = handF(36); c.fillStyle = "#334155"; c.fillText("right page among the 3 pages it reads", 540, 462);
            bar(c, 560, "MEANING only", 15, COL.orange, b.prop === "bars" ? seg(f, ln.from + 2, ln.from + 18) : 1, "3 pages per order");
            bar(c, 800, "KEYWORD only", 13, "#2563eb", b.prop === "bars" ? seg(f, c1 - 4, c1 + 12) : 1, "3 pages per order");
            if (f >= bothAt) {
              bar(c, 1060, "BOTH", 18, GREEN, seg(f, bothAt - 2, bothAt + 10));
              stamp(c, "STILL 3 PAGES", 720, 1238, 46, COL.red, seg(f, bothAt + 6, bothAt + 14), r, -0.05);
              if (f >= bothAt + 20) tag(c, "helps most when codes hide in long pages", 540, 1420, 50, COL.yellow, INK, -0.02, seg(f, bothAt + 20, bothAt + 28));
            }
          }
          if (b.prop === "rows") {
            const c1 = cu(1, 0.55);
            const row = (y: number, o: string, got: string, k: number) => {
              if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 1.5);
              c.fillStyle = "#fee2e2"; rrect(c, 120, y, 840, 200, 22); c.fill();
              c.font = handF(40); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`"${o}"`, 150, y + 70);
              c.font = handF(34); c.fillStyle = "#991b1b"; c.fillText(got, 150, y + 140);
              c.font = caveat(110); c.fillStyle = COL.red; c.textAlign = "right"; c.fillText("✗", 930, y + 130);
              c.restore();
            };
            row(470, "something to wash vessels", "got: Hand wash + Detergent", seg(f, ln.from + 2, ln.from + 10));
            row(760, "Ramesh garu's usual", "got: nothing about Ramesh garu", seg(f, c1, c1 + 8));
          }
          if (b.prop === "booksearch") {
            paper(c, 130, 360, 820, 760, 0, 1);
            c.font = caveat(50); c.fillStyle = COL.red; c.textAlign = "left"; c.fillText("STOCK BOOK", 160, 430);
            c.font = handF(30); c.fillStyle = INK;
            ["H-9901 Dishwash bar, 200 g", "H-9905 Dishwash liquid", "R-1724 Sona Masoori rice, 5 kg", "R-1742 Sona Masoori rice, 25 kg"].forEach((t, q) => c.fillText(t, 170, 520 + q * 76));
            const s1 = seg(f, ln.from, ln.from + 10), s2 = seg(f, ln.from + 14, ln.from + 24);
            c.fillStyle = "#e2e8f0"; rrect(c, 170, 860, 740, 80, 40); c.fill();
            c.font = handF(42); c.fillStyle = INK;
            const word = s2 > 0 ? "Ramesh".slice(0, Math.round(6 * s2)) : "vessels".slice(0, Math.round(7 * s1));
            c.fillText("🔍 " + word, 200, 914);
            if (s1 >= 1 && s2 <= 0) tag(c, "\"vessels\": not found", 540, 1010, 44, "#fee2e2", "#991b1b", 0, 1);
            if (s2 >= 1) tag(c, "\"Ramesh\": not found", 540, 1010, 44, "#fee2e2", "#991b1b", 0, 1);
          }
          if (b.prop === "stamp") {
            stamp(c, "20/20", 540, 680, 280, GREEN, seg(f, ln.from + 2, ln.from + 10), r, -0.06);
            c.font = handF(42); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("after writing the two facts into the book", 540, 950);
            c.font = handF(36); c.fillStyle = "#64748b"; c.fillText("(a fair re-test also uses new orders)", 540, 1012);
            paper(c, 180, 1040, 720, 230, 0.02, seg(f, ln.from + 6, ln.from + 14));
            if (f > ln.from + 12) { c.font = handF(32); c.fillStyle = COL.red; c.textAlign = "left"; c.fillText("Dishwash bar: for washing vessels", 220, 1130); c.fillText("Ramesh garu's usual: R-1724", 220, 1200); }
          }
          if (n === 4) tag(c, "reads 3 of 15 pages", 780, 250, 40, COL.yellow, INK, -0.02, 1);
          c.restore();
        } else {
          // ---------- the shop ----------
          let sh = SHOTS[b.shot] ?? SHOTS.wide;
          if (n === 1) sh = { z: 1.1, x: 500, y: 790 };
          const z = sh.z * (1 + 0.03 * p);
          const shake = n === 1 && p < 0.14 ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          // the hook rack under the price board: AAA batteries (E-1203) and pain balm tins, both "right there"
          c.fillStyle = "#7a4520"; c.fillRect(40, 760, 330, 12);
          [0, 1].forEach((q) => { c.fillStyle = "#1e3a8a"; rrect(c, 60 + q * 70, 780, 58, 96, 8); c.fill(); c.fillStyle = "#fbbf24"; c.fillRect(70 + q * 70, 800, 38, 18); });
          c.font = handF(24); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("AAA", 89, 862); c.fillText("AAA", 159, 862);
          [0, 1].forEach((q) => { c.beginPath(); c.ellipse(260 + q * 66, 840, 28, 18, 0, 0, 7); c.fillStyle = "#dc2626"; c.fill(); });
          c.font = handF(22); c.fillStyle = INK; c.fillText("balm", 293, 885);
          const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
          const lifted = n === 26 && f >= cu(2, 0.55) + 6;
          ravi(c, mood, lifted ? "phone" : armPose, b.who === "ravi" && talking, p, f, r);
          if (n === 1 && f >= cu(2, 0.6) - 4) { stroke(c, circlePts(124, 830, 96, 76), COL.yellow, 9, r, { passes: 2, alpha: seg(f, cu(2, 0.6) - 4, cu(2, 0.6) + 2) }); tag(c, "E-1203", 124, 725, 40, COL.yellow, INK, -0.05, seg(f, cu(2, 0.6) - 4, cu(2, 0.6) + 4)); }
          if (n === 10) { stroke(c, circlePts(293, 842, 92, 56), COL.yellow, 8, r, { passes: 2, alpha: seg(p, 0.1, 0.25) }); tag(c, "Pain relief balm", 250, 728, 46, COL.yellow, INK, -0.05, seg(p, 0.12, 0.3)); }
          counter(c, r);
          // the stock book on the counter
          c.save(); c.translate(600, 1030); c.rotate(-0.04);
          c.fillStyle = "#7c2d12"; rrect(c, -176, -52, 352, 104, 10); c.fill();
          c.fillStyle = "#fffdf4"; rrect(c, -166, -46, 160, 92, 6); c.fill(); rrect(c, 6, -46, 160, 92, 6); c.fill();
          c.font = handF(15); c.fillStyle = "#64748b"; c.textAlign = "left";
          ["R-1724 rice 5kg", "H-9901 Dishwash", "E-1203 AAA batt."].forEach((t, q) => c.fillText(t, -158, -20 + q * 24));
          if (n >= 23) {   // Ravi writes the two facts in (red ink)
            const w1 = n === 23 ? seg(p, 0.05, 0.5) : 1, w2 = n === 23 ? seg(p, 0.5, 0.95) : 1;
            c.font = handF(17); c.fillStyle = COL.red;
            c.fillText("Dishwash: for vessels".slice(0, Math.round(21 * w1)), 12, -14);
            c.fillText("Ramesh garu: R-1724".slice(0, Math.round(19 * w2)), 12, 14);
          }
          c.restore();
          if (n === 23) { const px = 610 + 90 * ((p * 3) % 1); stroke(c, [[px, 1000], [px + 30, 960]], "#1e293b", 7, r, { passes: 1 }); }
          if (!lifted) phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          // screen-space: the order chat (frame 1, the headache order, the last order)
          if (n === 1) chat(c, 600, 560, 440, 1, [{ who: "c", t: "E-1203", p: 1 }, { who: "ai", t: "Out of stock, sorry", p: 1, col: COL.red }]);
          if (n === 8 || n === 9) chat(c, 400, 330, 640, 1, [{ who: "c", t: "something for a headache", p: n === 9 ? 1 : seg(f, cu(1, 0.35), cu(1, 0.35) + 6) },
            ...(n === 9 ? [{ who: "ai" as const, t: "0 matches", p: seg(p, 0.02, 0.15), col: COL.red }] : [])]);
          if (n === 8 && f >= cu(1, 0.35) + 4) tag(c, "Will KEYWORD search find the pain balm?", 540, 1420, 42, COL.yellow, INK, -0.02, seg(f, cu(1, 0.35) + 4, cu(1, 0.35) + 12));
          if (n === 26) chat(c, 520, 470, 520, seg(f, cu(2, 0.55) - 4, cu(2, 0.55) + 4), [{ who: "c", t: "E-1203", p: 1 }, { who: "ai", t: "Out of stock, sorry", p: seg(f, cu(2, 0.55) + 8, cu(2, 0.55) + 14), col: COL.red }]);
          if (n === 1 && f < cu(2, 0.6) + 24) {   // frame 1, readable with the sound off; held until the batteries glow
            c.save(); c.translate(W / 2, 400); c.rotate(-0.03);
            c.fillStyle = "rgba(15,23,42,0.82)"; rrect(c, -400, -62, 800, 158, 24); c.fill();
            c.font = caveat(62); c.textAlign = "center"; c.lineWidth = 12; c.strokeStyle = INK;
            c.strokeText("The AI said OUT OF STOCK.", 0, 0); c.fillStyle = "#fff"; c.fillText("The AI said OUT OF STOCK.", 0, 0);
            c.strokeText("It's RIGHT THERE.", 0, 70); c.fillStyle = COL.yellow; c.fillText("It's RIGHT THERE.", 0, 70);
            c.restore();
          }
        }
        // ---------- chips that stay across lines ----------
        if (n === 3) tag(c, "Reads 3 of 15 pages", W / 2, 380, 46, COL.yellow, INK, -0.02, 1);
        if (n >= 14 && b.shot !== "screen") {   // the two switches, from the merge on; the keyword one flips off at the end
          const off = n === 26 ? seg(f, cu(1, 0.3), cu(1, 0.3) + 4) : 0;
          toggle(c, W - 400, 330, "MEANING", 1, 1); toggle(c, W - 400, 422, "KEYWORD", 1 - off, 1);
          if (n === 26) {   // the flip, big for a second (the corner pill went unnoticed)
            const c1 = cu(1, 0.3), k = seg(f, c1 - 4, c1 + 2) * (1 - seg(f, c1 + 30, c1 + 38));
            if (k > 0) { c.save(); c.fillStyle = `rgba(15,23,42,${0.35 * k})`; c.fillRect(0, 0, W, H); c.restore(); toggle(c, 230, 760, "KEYWORD", 1 - off, k, 2.0); }
          }
        }
        if (n >= 22 && n <= 24) ruleCard(c, W / 2, 1380, 1, n === 22 ? seg(f, ln.from + ln.frames - 10, ln.from + ln.frames - 2) : 1, 0);
        if (n >= 25) ruleCard(c, 290, 362, 0.6, 1, n === 26 ? seg(f, cu(1, 0.3) + 2, cu(1, 0.3) + 10) : 0);
        if (s.id === "st_a" && f < 4) { c.save(); c.globalAlpha = 1 - f / 4; c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const STOCK_SCENES = { sk_stock: StStock };
