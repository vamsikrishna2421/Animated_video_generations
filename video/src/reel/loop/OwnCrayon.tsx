import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, PH, WALL, SKIN, Mood, Arms } from "./SkitCrayon";
import { bigPhone, bar } from "./StockCrayon";

// EP34 "Rent a brain or own one?" (series/scripts/ep34_open_vs_closed.md): Ravi anna's shop again. The shop AI is rented
// (a closed model on a company's computers); Ravi wants to own one (open models); our offline bill test (series/scripts/
// ep34_demo: free brains of 1, 3 and 4.7 GB made 1, 9 and 18 of 20 bills). Shop lines play in the shop; the AI's
// explaining lines open the phone to full frame. One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 }, ai: { z: 2.05, x: 800, y: 880 },
};
// Ravi's face and hands per line (the AI's shop lines show his reaction)
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "slam"], 2: ["shock", "rest"], 3: ["yell", "point"], 5: ["hope", "fist"], 7: ["shock", "up"], 9: ["sus", "rest"],
  11: ["happy", "point"], 13: ["sus", "rest"], 15: ["smug", "fist"], 16: ["panic", "rest"], 17: ["hope", "phone"], 19: ["confused", "shrug"],
  20: ["sus", "fold"], 21: ["sus", "fold"], 22: ["yell", "fist"], 24: ["hope", "point"], 25: ["sad", "rest"],
};
const GREEN = "#16a34a", GREY = "#94a3b8", NAVY = "#1e3a8a";

// ---------- pieces ----------
// customers in the queue, seen from behind (foreground of the shop shot)
export const customers = (c: Ctx, k: number, f: number, r: () => number) => {
  const spots: [number, number, string][] = [[130, 1250, "#be185d"], [330, 1290, "#0f766e"], [560, 1265, "#7c3aed"], [770, 1300, "#b45309"],
    [950, 1260, "#2563eb"], [-40, 1300, "#dc2626"], [1120, 1295, "#4d7c0f"]];
  spots.slice(0, k).forEach(([x, y, col], i) => {
    const bob = Math.sin(f / 9 + i) * 3;
    c.fillStyle = col; rrect(c, x - 95, y + bob, 190, 260, 70); c.fill();
    c.beginPath(); c.arc(x, y - 50 + bob, 62, 0, 7); c.fillStyle = "#1c1410"; c.fill();
    c.beginPath(); c.arc(x, y - 30 + bob, 58, 0.15 * Math.PI, 0.85 * Math.PI); c.fillStyle = SKIN; c.fill();
    stroke(c, circlePts(x, y - 50 + bob, 62, 62), "#000", 3, r, { passes: 1, alpha: 0.35 });
  });
};
// the dark-backed headline over frame 1 (readable with the sound off)
export const headline = (c: Ctx, W: number, a: string, b: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, 380); c.rotate(-0.03);
  c.fillStyle = "rgba(15,23,42,0.85)"; rrect(c, -440, -66, 880, 164, 24); c.fill();
  c.font = caveat(64); c.textAlign = "center"; c.lineWidth = 12; c.strokeStyle = INK;
  c.strokeText(a, 0, 0); c.fillStyle = "#fff"; c.fillText(a, 0, 0);
  c.strokeText(b, 0, 72); c.fillStyle = COL.yellow; c.fillText(b, 0, 72);
  c.restore();
};
export const bubble = (c: Ctx, x: number, y: number, t: string, size: number, k: number, col = "#fff", fg = INK) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.font = caveat(size);
  const w = c.measureText(t).width + size * 0.9, h = size * 1.5;
  c.translate(x, y); c.scale(easeOut(k), easeOut(k));
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -w / 2 + 6, -h / 2 + 8, w, h, h / 2); c.fill();
  c.fillStyle = col; rrect(c, -w / 2, -h / 2, w, h, h / 2); c.fill();
  c.beginPath(); c.moveTo(-20, h / 2 - 4); c.lineTo(-44, h / 2 + 30); c.lineTo(8, h / 2 - 4); c.closePath(); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, 0, size * 0.33);
  c.restore();
};
const cloudShape = (c: Ctx, x: number, y: number, s: number, col: string) => {
  c.fillStyle = col; c.beginPath();
  [[-60, 10, 50], [0, -20, 66], [62, 6, 52], [24, 30, 50], [-30, 34, 46]].forEach(([dx, dy, rr]) => { c.moveTo(x + dx * s + rr * s, y + dy * s); c.arc(x + dx * s, y + dy * s, rr * s, 0, 7); });
  c.fill();
};
export const xMark = (c: Ctx, x: number, y: number, s: number, k: number, r: () => number) => {
  if (k <= 0) return;
  stroke(c, [[x - s, y - s], [x - s + 2 * s * seg(k, 0, 0.5), y - s + 2 * s * seg(k, 0, 0.5)]], COL.red, 16, r, { passes: 2 });
  if (k > 0.5) stroke(c, [[x + s, y - s], [x + s - 2 * s * seg(k, 0.5, 1), y - s + 2 * s * seg(k, 0.5, 1)]], COL.red, 16, r, { passes: 2 });
};
export const padlock = (c: Ctx, x: number, y: number, s: number, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s * easeOut(k), s * easeOut(k));
  stroke(c, circlePts(0, -40, 46, 54, Math.PI, 2 * Math.PI, 14), "#475569", 18, r, { passes: 2 });
  c.fillStyle = "#f59e0b"; rrect(c, -70, -40, 140, 110, 16); c.fill();
  c.beginPath(); c.arc(0, 0, 14, 0, 7); c.fillStyle = INK; c.fill(); c.fillRect(-5, 0, 10, 34);
  c.restore();
};
const building = (c: Ctx, x: number, y: number, r: () => number, f: number) => {
  c.fillStyle = "#cbd5e1"; rrect(c, x - 150, y - 260, 300, 330, 14); c.fill();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    c.fillStyle = "#334155"; rrect(c, x - 125 + j * 85, y - 235 + i * 72, 70, 56, 6); c.fill();
    const on = (Math.floor(f / 6) + i * 3 + j) % 4 === 0;
    c.fillStyle = on ? "#4ade80" : "#22c55e66"; c.beginPath(); c.arc(x - 108 + j * 85, y - 220 + i * 72, 5, 0, 7); c.fill();
  }
  c.font = handF(28); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("the company's computers", x, y + 110);
};
export const laptop = (c: Ctx, x: number, y: number, s: number, screen: string, r: () => number, o: { err?: boolean; brain?: number } = {}) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#1f2937"; rrect(c, -200, -250, 400, 260, 18); c.fill();
  c.fillStyle = o.err ? "#fee2e2" : "#e0f2fe"; rrect(c, -184, -234, 368, 228, 10); c.fill();
  c.fillStyle = "#9ca3af"; c.beginPath(); c.moveTo(-240, 10); c.lineTo(240, 10); c.lineTo(270, 46); c.lineTo(-270, 46); c.closePath(); c.fill();
  if ((o.brain ?? 0) > 0) brain(c, 0, -130, 0.75 * easeOut(o.brain ?? 0), r);
  if (screen) { c.font = handF(30); c.fillStyle = o.err ? "#991b1b" : INK; c.textAlign = "center"; screen.split("\n").forEach((t, i) => c.fillText(t, 0, -150 + i * 40)); }
  c.restore();
};
// a brain made of numbers (the weights)
export const brain = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  if (s <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#f9a8d4"; c.beginPath();
  [[-60, -20, 70], [10, -50, 72], [70, -10, 66], [40, 40, 62], [-40, 40, 62]].forEach(([dx, dy, rr]) => { c.moveTo(dx + rr, dy); c.arc(dx, dy, rr, 0, 7); });
  c.fill();
  stroke(c, [[0, -110], [0, 100]], "#be185d", 5, r, { passes: 1, alpha: 0.6 });
  c.font = handF(26); c.fillStyle = "#831843"; c.textAlign = "center";
  ["0.12 -1.7 0.03", "2.41 0.88 -0.5", "-0.09 1.3 0.77"].forEach((t, i) => c.fillText(t, 0, -40 + i * 36));
  c.restore();
};
const gpuCard = (c: Ctx, x: number, y: number, s: number, r: () => number, f: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#14532d"; rrect(c, -330, -120, 660, 240, 16); c.fill();
  c.fillStyle = "#111827"; rrect(c, -300, -96, 600, 160, 20); c.fill();
  [-150, 150].forEach((fx) => {
    c.beginPath(); c.arc(fx, -16, 64, 0, 7); c.fillStyle = "#374151"; c.fill();
    for (let b = 0; b < 6; b++) { const a = b * Math.PI / 3 + f / 4; stroke(c, [[fx, -16], [fx + Math.cos(a) * 56, -16 + Math.sin(a) * 56]], "#9ca3af", 8, r, { passes: 1 }); }
  });
  c.fillStyle = "#facc15"; for (let i = 0; i < 16; i++) c.fillRect(-250 + i * 26, 120, 16, 30);
  c.font = caveat(46); c.fillStyle = "#e5e7eb"; c.textAlign = "center"; c.fillText("80 GB", 0, 50);
  c.restore();
};
const ruleRows: [string, string, string][] = [["RENT", "needs internet | pay per question", "#dbeafe"], ["OWN", "works offline, data stays home | you buy the computer", "#dcfce7"],
  ["TEST", "on the same 20 bills first", "#fef9c3"]];
const ruleCard = (c: Ctx, x: number, y: number, s: number, rows: number[], r: () => number) => {
  if (rows[0] <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -500 + 10, -40 + 12, 1000, 420, 26); c.fill();
  c.fillStyle = "#fffdf4"; rrect(c, -500, -40, 1000, 420, 26); c.fill();
  ruleRows.forEach(([a, b, col], i) => {
    const k = rows[i] ?? 0; if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 2);
    c.fillStyle = col; rrect(c, -480, -24 + i * 134, 960, 122, 18); c.fill();
    c.font = caveat(76); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a, -456, 58 + i * 134);
    c.font = handF(44); b.split(" | ").forEach((t, j, all) => c.fillText(t, -250, (all.length > 1 ? 30 + j * 50 : 52) + i * 134));
    c.restore();
  });
  c.restore();
};
const calculator = (c: Ctx, x: number, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOut(k), easeOut(k)); c.rotate(0.08);
  c.fillStyle = "#334155"; rrect(c, -80, -110, 160, 220, 18); c.fill();
  c.fillStyle = "#bbf7d0"; rrect(c, -64, -94, 128, 50, 8); c.fill();
  c.font = caveat(40); c.fillStyle = INK; c.textAlign = "right"; c.fillText("258", 56, -56);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { c.fillStyle = "#e2e8f0"; rrect(c, -60 + j * 42, -30 + i * 42, 34, 34, 6); c.fill(); }
  c.restore();
};
const stopwatch = (c: Ctx, x: number, y: number, p: number, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(easeOut(k), easeOut(k));
  c.beginPath(); c.arc(0, 0, 110, 0, 7); c.fillStyle = "#fff"; c.fill();
  stroke(c, circlePts(0, 0, 110, 110), INK, 8, r, { passes: 2 });
  c.fillStyle = INK; c.fillRect(-18, -140, 36, 26);
  const a = -Math.PI / 2 + p * 2 * Math.PI * 3;
  stroke(c, [[0, 0], [Math.cos(a) * 84, Math.sin(a) * 84]], COL.red, 8, r, { passes: 1 });
  c.font = caveat(52); c.fillStyle = INK; c.textAlign = "center"; c.fillText("15 s", 0, 60);
  c.restore();
};
// the 3 GB brain's real bill for "1 kg rice, 1 kg toor dal, 2 milk packets" (series/scripts/ep34_demo)
const BILL: [string, string, boolean][] = [["Tomato 1 kg", "40", true], ["Onion 1 kg", "35", true], ["Potato 1 kg", "30", true], ["Rice 1 kg", "62", false],
  ["Toor dal 1 kg", "140", false], ["Milk x 2", "56", false]];
const fakeBill = (c: Ctx, x: number, y: number, k: number, circles: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.rotate(-0.02);
  c.fillStyle = "rgba(4,8,40,0.25)"; rrect(c, 8, 10, 600, 470, 14); c.fill();
  c.fillStyle = "#fffdf4"; rrect(c, 0, 0, 600, 470, 14); c.fill();
  c.font = handF(28); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("order: 1 kg rice, 1 kg dal, 2 milk", 24, 44);
  c.font = handF(34); c.fillStyle = INK;
  BILL.forEach(([t, v], i) => { c.textAlign = "left"; c.fillText(t, 30, 104 + i * 50); c.textAlign = "right"; c.fillText(v, 570, 104 + i * 50); });
  c.font = caveat(48); c.fillStyle = COL.red; c.textAlign = "left"; c.fillText("TOTAL ₹363", 30, 432);
  c.font = handF(30); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("right: ₹258", 570, 430);
  BILL.forEach(([, , bad], i) => { if (bad) stroke(c, circlePts(150, 92 + i * 50, 140, 26), COL.red, 5, r, { passes: 2, alpha: seg(circles, i / 3, i / 3 + 0.34) }); });
  c.restore();
};

// ---------- the scene ----------
const StOwn: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.shot === "screen") sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 3} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("b")} at={at + 3} src="audio/gag_bonk.wav" vol={0.7} />,
      <Sfx key={k("k")} at={at + 3} src="audio/sfx_snap.wav" vol={0.5} />,   // a mid-range crack: phone speakers drop the boom's low end
      <Sfx key={k("c")} at={at + 1} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "rented") sfx.push(<Sfx key={k("s")} at={at + Math.round(l.frames * 0.55)} src="audio/sfx_snap.wav" vol={0.4} />);
    if (b.prop === "cloud") sfx.push(<Sfx key={k("o")} at={cue(i, 1, 0.35) - 6} src="audio/sfx_whoosh.wav" vol={0.28} />, <Sfx key={k("m")} at={cue(i, 2, 0.7) - 4} src="audio/sfx_chaching.wav" vol={0.45} />);
    if (b.prop === "open") sfx.push(<Sfx key={k("d")} at={at + 14} src="audio/gag_ding.wav" vol={0.3} />, ...[0, 1, 2].map((q) => <Sfx key={k("p" + q)} at={cue(i, 1, 0.5) - 6 + q * 6} src="audio/sfx_pop.wav" vol={0.3} />));
    if (b.prop === "skull") sfx.push(<Sfx key={k("c")} at={cue(i, 1, 0.5) - 6} src="audio/sfx_chaching.wav" vol={0.4} />);
    if (b.prop === "test") [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 6 + q * 8} src="audio/sfx_tick.wav" vol={0.16} />));
    if (b.prop === "guess") sfx.push(<Sfx key={k("q")} at={at - 4} src="audio/gag_pop.wav" vol={0.35} />);
    if (b.prop === "bars") sfx.push(<Sfx key={k("a")} at={at + 4} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.4} />,
      <Sfx key={k("s")} at={end + 1} src="audio/gag_boing.wav" vol={0.75} />);
    if (b.prop === "eighteen") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.5) - 1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("s")} at={cue(i, 1, 0.5) + 4} src="audio/sfx_success.wav" vol={0.45} />);
    if (b.prop === "stopwatch") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * 7} src="audio/sfx_tick.wav" vol={0.2} />));
    if (b.prop === "nodelivery") sfx.push(<Sfx key={k("l")} at={at + 8} src="audio/watch_click.wav" vol={0.5} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src="audio/sfx_snap.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 1, 0.35) - 4} src="audio/sfx_snap.wav" vol={0.35} />,
      <Sfx key={k("c")} at={cue(i, 2, 0.75) - 4} src="audio/sfx_snap.wav" vol={0.35} />);
    if (b.prop === "calc") sfx.push(<Sfx key={k("c")} at={cue(i, 1, 0.5) - 4} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "gpu") sfx.push(<Sfx key={k("c")} at={at + 10} src="audio/sfx_chaching.wav" vol={0.5} />);
    if (b.prop === "again") sfx.push(<Sfx key={k("r")} at={at - 6} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("b")} at={end - 4} src="reel/sfx_buzz.wav" vol={0.3} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9400 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = {
            rented: "no internet", cloud: "where my brain lives", open: "OPEN models", skull: "free to download", test: "our real test",
            bars: "our real test: 20 bills", eighteen: "our real test: 20 bills", nodelivery: "CLOSED model", gpu: "a big free brain needs...",
          };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 316); c.scale(0.92, 0.92); c.translate(-W / 2, -160);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "rented") {
            cloudShape(c, 540, 640, 1.6, "#cbd5e1"); xMark(c, 540, 640, 90, seg(p, 0.05, 0.3), r);
            c.font = caveat(70); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("No internet", 540, 860);
            c.font = handF(40); c.fillStyle = "#475569"; c.fillText("my brain isn't in this phone", 540, 930);
            if (p > 0.5) stamp(c, "RENTED", 540, 1120, 120, COL.red, seg(p, 0.5, 0.62), r, -0.08);
          }
          if (b.prop === "cloud") {
            const c1 = cu(1, 0.35), c2 = cu(2, 0.7);
            c.fillStyle = "#111827"; rrect(c, 150, 760, 120, 210, 18); c.fill(); c.fillStyle = "#e0f2fe"; rrect(c, 162, 774, 96, 170, 10); c.fill();
            c.font = handF(26); c.fillStyle = INK; c.textAlign = "center"; c.fillText("your shop", 210, 1010);
            stroke(c, [[370, 960], [400, 700], [430, 960]], "#475569", 8, r, { passes: 2 }); stroke(c, [[385, 840], [415, 840]], "#475569", 6, r, { passes: 1 });
            building(c, 780, 900, r, f);
            for (let q = 0; q < 9; q++) { const t = q / 9; if (seg(p, 0, 0.25) > t) { c.beginPath(); c.arc(280 + t * 340, 860 - Math.sin(t * Math.PI) * 120, 6, 0, 7); c.fillStyle = GREY; c.fill(); } }
            const fly = seg(f, c1 - 4, c1 + 14);
            if (fly > 0 && fly < 1) tag(c, "2 kg tomato, 1 dozen eggs", 230 + fly * 520, 820 - Math.sin(fly * Math.PI) * 170, 30, "#dcf8c6", INK, 0, 1);
            if (fly >= 1) tag(c, "every order goes to them", 540, 560, 44, COL.yellow, INK, -0.02, seg(f, c1 + 14, c1 + 20));
            if (f >= c2 - 4) {
              const k = seg(f, c2 - 4, c2 + 4);
              c.save(); c.globalAlpha = k; c.fillStyle = "#111827"; rrect(c, 300, 1150, 480, 130, 18); c.fill();
              c.font = caveat(66); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("₹ per question", 540, 1236); c.restore();
              padlock(c, 780, 600, 0.8, k, r);
              tag(c, "CLOSED: its brain stays secret", 540, 1380, 42, "#fee2e2", "#991b1b", 0, k);
            }
          }
          if (b.prop === "open") {
            const c1 = cu(1, 0.5), dl = easeOut(seg(p, 0.05, 0.55));
            brain(c, 540, 470 + dl * 360, 1 - 0.25 * dl, r);
            if (dl < 1) stroke(c, [[540, 600], [540, 780]], GREEN, 10, r, { passes: 2, alpha: 0.6 });
            laptop(c, 540, 1180, 1.1, "", r, { brain: seg(p, 0.5, 0.6) });
            tag(c, "OPEN: the brain (its weights) is published", 540, 400, 42, "#dcfce7", INK, -0.01, seg(p, 0.02, 0.12));
            [["Llama · Meta", 230], ["Gemma · Google", 540], ["gpt-oss · OpenAI", 850]].forEach(([t, x], q) => tag(c, t as string, x as number, 1290, 36, COL.yellow, INK, 0, seg(f, c1 - 6 + q * 6, c1 + 2 + q * 6)));
            if (f >= c1 + 12) tag(c, "ChatGPT's maker, not ChatGPT", 850, 1370, 34, "#fee2e2", "#991b1b", 0, seg(f, c1 + 12, c1 + 18));
          }
          if (b.prop === "skull") {
            const c1 = cu(1, 0.5);
            brain(c, 300, 640, 0.9, r); tag(c, "FREE", 300, 800, 54, "#dcfce7", GREEN, -0.05, seg(p, 0.02, 0.15));
            laptop(c, 740, 760, 0.85, "", r);
            if (f >= c1 - 6) { tag(c, "₹₹₹", 760, 540, 70, COL.yellow, INK, 0.08, seg(f, c1 - 6, c1 + 2)); c.font = handF(34); c.fillStyle = INK; c.textAlign = "center"; c.fillText("the computer: sold separately", 740, 900); }
            tag(c, "free to download ≠ free to run", 540, 1150, 46, "#fef3c7", INK, -0.02, seg(f, c1, c1 + 8));
          }
          if (b.prop === "test") {
            const c1 = cu(1, 0.35);
            [["anna 2 kg tomato, 1 dozen eggs pls", "158"], ["3 bath soaps and 1 detergent powder", "234"], ["half kg sugar and one tea powder", "148"], ["2 curd 2 milk", "126"], ["5 kg rice please", "310"]]
              .forEach(([o, t], q) => {
                const k = seg(f, ln.from + q * 4, ln.from + q * 4 + 6); if (k <= 0) return;
                c.save(); c.globalAlpha = k; c.fillStyle = "#dcf8c6"; rrect(c, 130, 380 + q * 96, 640, 76, 16); c.fill();
                c.font = handF(30); c.fillStyle = INK; c.textAlign = "left"; c.fillText(o, 150, 428 + q * 96);
                c.font = caveat(40); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText(`₹${t} ✓`, 940, 430 + q * 96); c.restore();
              });
            c.font = handF(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("... 20 orders, every total known", 540, 900);
            if (f >= c1 - 4) {
              const k = seg(f, c1 - 4, c1 + 4);
              c.save(); c.globalAlpha = k;
              [0, 1, 2].forEach((q) => stroke(c, circlePts(300, 1110, 40 + q * 26, 40 + q * 26, -2.4, -0.7, 10), "#64748b", 7, r, { passes: 1 }));
              xMark(c, 300, 1070, 50, 1, r);
              c.font = handF(36); c.fillStyle = INK; c.textAlign = "left"; c.fillText("internet: OFF", 380, 1060); c.fillText("4 cores, no graphics card", 380, 1112);
              c.fillText("3 free brains: 1 GB · 3 GB · 4.7 GB", 160, 1220); c.restore();
            }
          }
          if (b.prop === "bars" || b.prop === "eighteen") {
            const c1 = cu(1, b.prop === "bars" ? 0.4 : 0.5);
            bar(c, 470, "1 GB free brain", 1, COL.red, b.prop === "bars" ? seg(p, 0.02, 0.15) : 1, "1.4 s a bill");
            bar(c, 690, "3 GB free brain", 9, COL.orange, b.prop === "bars" ? seg(f, c1, c1 + 10) : 1, "14 s a bill");
            if (b.prop === "bars") fakeBill(c, 240, 880, seg(f, cu(2, 0.55) - 6, cu(2, 0.55) + 2), seg(f, cu(2, 0.55), cu(2, 0.55) + 24), r);
            if (b.prop === "eighteen") bar(c, 910, "≈5 GB free brain (4.7 GB)", 18, "#f59e0b", seg(f, c1, c1 + 12), "15 s a bill, 2 bills wrong");
            c.font = handF(28); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("our test, internet off, a plain computer (small demo)", 540, 1360);
          }
          if (b.prop === "nodelivery") {
            padlock(c, 540, 640, 1.6, seg(p, 0, 0.2), r);
            tag(c, "CLOSED: you can't download it", 540, 900, 50, "#fee2e2", "#991b1b", -0.02, seg(p, 0.1, 0.25));
            c.font = caveat(60); c.fillStyle = INK; c.textAlign = "center"; c.fillText("🛵 home delivery", 540, 1110); xMark(c, 540, 1090, 70, seg(p, 0.35, 0.6), r);
          }
          if (b.prop === "gpu") {
            gpuCard(c, 540, 700, 1.15, r, f);
            tag(c, "about ₹25 lakh", 540, 1000, 84, COL.yellow, INK, -0.04, seg(p, 0.1, 0.25));
            c.font = handF(42); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("one 80 GB card (an H100)", 540, 1140);
            c.fillText("runs a big free brain like gpt-oss-120b", 540, 1196);
            tag(c, "120 billion numbers (ours: 7 billion)", 540, 1300, 44, "#e2e8f0", INK, 0, seg(p, 0.3, 0.45));
          }
          c.restore();
        } else {
          // ---------- the shop ----------
          let sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = n === 1 && p < 0.14 ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          if (n === 22 || n === 24) laptop(c, 470, 990, 0.62, n === 22 ? "downloading the\nbiggest free brain..." : "", r);
          phone(c, b.who === "ai" && talking, f, r, {});
          if (n === 1 || n === 25) {   // the phone can't think: no internet (a label big enough to read on a phone)
            c.save(); c.globalAlpha = n === 25 ? seg(p, 0.5, 0.7) : 1;
            c.fillStyle = "#fee2e2"; rrect(c, PH.x - 70, PH.y - 20, 140, 60, 10); c.fill();
            c.font = handF(22); c.fillStyle = "#991b1b"; c.textAlign = "center"; c.fillText("No internet ✕", PH.x, PH.y + 18);
            c.fillStyle = "#dc2626"; rrect(c, PH.x - 150, PH.y - 250, 300, 76, 18); c.fill();
            c.beginPath(); c.moveTo(PH.x - 16, PH.y - 176); c.lineTo(PH.x + 16, PH.y - 176); c.lineTo(PH.x, PH.y - 150); c.closePath(); c.fill();
            c.font = caveat(48); c.fillStyle = "#fff"; c.fillText("NO INTERNET ✕", PH.x, PH.y - 196); c.restore();
          }
          customers(c, n === 1 ? 5 : n === 16 ? 5 + Math.round(2 * seg(p, 0.2, 0.8)) : n === 25 ? 5 : 0, f, r);
          c.restore();
          // screen-space props
          if (n === 1 && f < ln.from + 92) headline(c, W, "HE DOESN'T OWN HIS AI.", "HE RENTS IT.", 1);
          if (n === 3) tag(c, "RAVI KIRANA · own shop since 2016", W / 2, 420, 52, "#7c2d12", "#fef3c7", -0.03, seg(p, 0.4, 0.55));
          if (n === 3) tag(c, "net back ✓", 880, 1010, 46, "#bbf7d0", "#14532d", 0.03, seg(p, 0.05, 0.2));   // so the AI can talk again
          if (n === 7) tag(c, "FREE?!", 300, 420, 90, COL.yellow, INK, -0.08, seg(p, 0.05, 0.2));
          if (n === 11) {
            c.save(); c.fillStyle = "rgba(15,23,42,0.82)"; rrect(c, 120, 300, 840, 170, 26); c.fill();
            c.font = caveat(56); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("How many bills right, out of 20?", 540, 370);
            c.font = handF(40); c.fillStyle = COL.yellow; c.fillText("Your guess?", 540, 435); c.restore();
            bubble(c, 300, 600, "20!", 90, seg(p, 0.05, 0.2), COL.yellow);
          }
          if (n === 15) bubble(c, 300, 560, "2 wrong?!", 80, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 16) {   // the 18/20 brain's worst bill, then the queue time (15 s a bill x 10 customers)
            c.save();
            c.fillStyle = "#fffdf4"; rrect(c, 140, 330, 800, 210, 20); c.fill();
            c.font = handF(36); c.fillStyle = INK; c.textAlign = "left"; c.fillText("3 biscuits, 1 tea powder, 1 kg sugar", 170, 395);
            c.font = caveat(60); c.fillStyle = COL.red; c.fillText("billed ₹566", 170, 480); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("right ₹231", 910, 480);
            c.restore();
          }
          if (n === 17) bubble(c, 330, 520, "come into my laptop", 50, seg(p, 0.05, 0.2));
          if (n === 20 || n === 21) ruleCard(c, W / 2, 1010, 1,
            n === 20 ? [seg(p, 0.02, 0.1), seg(f, cu(1, 0.35) - 4, cu(1, 0.35) + 4), 0] : [1, 1, seg(p, 0.15, 0.3)], r);
          if (n === 21) { tag(c, "your bills: RENT + TEST", 540, 420, 58, COL.yellow, INK, -0.03, seg(p, 0.05, 0.2)); calculator(c, 900, 700, seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 4)); }
          if (n === 25 && p > 0.3) stamp(c, "RENTED", 540, 520, 110, COL.red, seg(p, 0.3, 0.45), r, -0.08);
        }
        // ---------- chips that stay across lines ----------
        if (n >= 4 && n <= 9) tag(c, "real test ahead: 20 bills", W - 300, 1430, 44, "#e2e8f0", INK, 0, 1);   // the script review: give a reason to stay
        if (s.id === "st_a" && f < 4) { c.save(); c.globalAlpha = 1 - f / 4; c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const OWN_SCENES = { sk_own: StOwn };
