import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, PH, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { customers, headline, bubble, xMark } from "./OwnCrayon";

// EP35 "The brain that didn't fit" (series/scripts/ep35_small_models.md): Ravi anna's shop again. He wants the free
// brain (EP34) inside his phone, so it works with no internet; the phone is full of good-morning photos. A model's size
// is its parameters; phone-size ones are small language models. Our test (series/scripts/ep35_demo): three sizes of one
// free model sorting 40 shop messages, 14 / 39 / 39 right, the medium one 4x faster than the big one; on 20 bills 19 / 9 /
// 2 wrong. One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 },
};
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "point"], 3: ["hope", "phone"], 5: ["happy", "point"], 7: ["shock", "up"], 9: ["confused", "shrug"], 11: ["happy", "fist"],
  13: ["confused", "shrug"], 14: ["sus", "fold"], 17: ["panic", "up"],
};
const GREEN = "#16a34a", AMBER = "#f59e0b";
const SIZES: { k: string; params: string; gb: string; col: string }[] = [
  { k: "TINY", params: "half a billion", gb: "0.5 GB", col: COL.red }, { k: "MEDIUM", params: "1.5 billion", gb: "1.1 GB", col: GREEN },
  { k: "BIG", params: "7 billion", gb: "4.7 GB", col: AMBER },
];
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;

// ---------- pieces ----------
// a "good morning" forward: a sunflower or a sunrise, the words in a curly script (drawn, no real photos)
const gm = (c: Ctx, x: number, y: number, w: number, h: number, kind: number) => {
  const bgs = ["#fde68a", "#fbcfe8", "#bfdbfe", "#bbf7d0", "#fed7aa"];
  c.save(); c.beginPath(); rrect(c, x, y, w, h, 10); c.clip();
  c.fillStyle = bgs[kind % bgs.length]; c.fillRect(x, y, w, h);
  if (kind % 2 === 0) {   // a sunflower
    const cx = x + w / 2, cy = y + h * 0.45, rr = Math.min(w, h) * 0.22;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.ellipse(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rr * 0.55, rr * 0.25, a, 0, 7); c.fillStyle = "#facc15"; c.fill(); }
    c.beginPath(); c.arc(cx, cy, rr * 0.7, 0, 7); c.fillStyle = "#78350f"; c.fill();
  } else {   // a sunrise over hills
    c.beginPath(); c.arc(x + w / 2, y + h * 0.62, Math.min(w, h) * 0.24, Math.PI, 0); c.fillStyle = "#f97316"; c.fill();
    c.fillStyle = "#15803d"; c.beginPath(); c.moveTo(x, y + h * 0.62); c.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x + w * 0.6, y + h * 0.62); c.quadraticCurveTo(x + w * 0.8, y + h * 0.55, x + w, y + h * 0.62); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
  }
  c.font = `700 ${Math.round(h * 0.17)}px Caveat`; c.fillStyle = "#be185d"; c.textAlign = "center"; c.fillText("Good Morning", x + w / 2, y + h * 0.9);
  c.restore();
};
const gmGrid = (c: Ctx, x: number, y: number, cols: number, rows: number, w: number, h: number, gap: number, k = 1) => {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const q = clamp(k * cols * rows - (j * cols + i)); if (q <= 0) continue;
    c.save(); c.globalAlpha = q; gm(c, x + i * (w + gap), y + j * (h + gap), w, h, i + j * 3); c.restore();
  }
};
// the phone's own "storage full" dialog
const fullDialog = (c: Ctx, x: number, y: number, s: number, k: number, needs = "the free brain needs 4.7 GB", free = "free: 1 GB") => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(s * (0.85 + 0.15 * easeOut(k)), s * (0.85 + 0.15 * easeOut(k))); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, -300 + 8, -120 + 10, 600, 240, 28); c.fill();
  c.fillStyle = "#fff"; rrect(c, -300, -120, 600, 240, 28); c.fill();
  c.fillStyle = "#dc2626"; rrect(c, -300, -120, 600, 86, 28); c.fill(); c.fillRect(-300, -60, 600, 26);
  c.font = SANS(52); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("⚠ Storage full", 0, -60);
  c.font = SANS(34, 600); c.fillStyle = INK; c.fillText(needs, 0, 22);
  c.font = SANS(34, 600); c.fillStyle = "#dc2626"; c.fillText(free, 0, 76);
  c.restore();
};
// the storage bar: photos, WhatsApp, apps, the installed brain, free. The numbers add up across the reel: 1 GB free, the
// good mornings deleted (1.2 free), the medium brain in (0.1 free), 52 more photos (full).
const gb = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
const storageBar = (c: Ctx, y: number, photos: number, label = true, brain = 0) => {
  const x0 = 140, w = 800, total = 96;
  const parts: [string, number, string][] = [["Photos", photos, COL.orange], ["WhatsApp", 22, GREEN], ["Apps", 12, "#3b82f6"], ["Brain", brain, "#a855f7"]];
  c.fillStyle = "#e2e8f0"; rrect(c, x0, y, w, 70, 18); c.fill();
  let x = x0;
  parts.forEach(([, v, col]) => { const ww = w * (v / total); c.fillStyle = col; c.fillRect(x, y, ww, 70); x += ww; });
  if (!label) return;
  c.font = SANS(30, 600); c.textAlign = "left";
  c.fillStyle = COL.orange; c.fillText(`Photos ${gb(photos)} GB`, x0, y + 112);
  c.fillStyle = GREEN; c.fillText("WhatsApp 22", x0 + 265, y + 112);
  c.fillStyle = "#3b82f6"; c.fillText("Apps 12", x0 + 490, y + 112);
  const free = total - photos - 34 - brain;
  c.fillStyle = free <= 1.05 ? "#dc2626" : GREEN; c.textAlign = "right"; c.fillText(`free ${gb(free)} GB`, x0 + w, y + 112);
};
// a jar of numbers (a model's parameters): taller = more numbers
const jar = (c: Ctx, x: number, yBase: number, h: number, w: number, title: string, sub: string, col: string, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(255,255,255,0.7)"; rrect(c, x - w / 2, yBase - h, w, h, 26); c.fill();
  c.save(); c.beginPath(); rrect(c, x - w / 2 + 8, yBase - h + 30, w - 16, h - 38, 20); c.clip();
  c.fillStyle = col; c.globalAlpha = 0.25; c.fillRect(x - w / 2, yBase - h, w, h); c.globalAlpha = 1;
  const rr = rng(Math.round(h));
  c.font = SANS(22, 700); c.fillStyle = col;
  for (let yy = yBase - 18; yy > yBase - h + 40; yy -= 24) for (let xx = x - w / 2 + 16; xx < x + w / 2 - 10; xx += 20) c.fillText(String(Math.floor(rr() * 10)), xx, yy);
  c.restore();
  stroke(c, [[x - w / 2, yBase - h + 20], [x - w / 2, yBase], [x + w / 2, yBase], [x + w / 2, yBase - h + 20]], INK, 6, r, { passes: 2 });
  c.fillStyle = "#94a3b8"; rrect(c, x - w / 2 - 8, yBase - h, w + 16, 26, 8); c.fill();
  c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText(title, x, yBase + 52);
  c.font = SANS(32, 600); c.fillStyle = "#334155"; sub.split(" · ").forEach((t, i) => c.fillText(t, x, yBase + 92 + i * 38));
  c.restore();
};
// the four trays the messages are sorted into
const TRAYS = ["ORDER", "PAYMENT", "COMPLAINT", "OTHER"];
const trays = (c: Ctx, y: number, counts: number[], hl = -1) => {
  TRAYS.forEach((t, i) => {
    const x = 150 + i * 200;
    c.fillStyle = i === hl ? "#fee2e2" : "#e2e8f0"; rrect(c, x, y, 180, 150, 18); c.fill();
    c.fillStyle = "#94a3b8"; rrect(c, x, y + 110, 180, 40, 12); c.fill();
    c.font = SANS(26); c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, x + 90, y + 138);
    for (let q = 0; q < Math.min(counts[i], 8); q++) { c.fillStyle = ["#dcf8c6", "#fef9c3", "#fee2e2", "#e0e7ff"][i]; rrect(c, x + 20, y + 92 - q * 10, 140, 22, 6); c.fill(); }
  });
};
const chipMsg = (c: Ctx, x: number, y: number, t: string, k: number, bg = "#dcf8c6") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.font = SANS(30, 600);
  const w = c.measureText(t).width + 50;
  c.fillStyle = bg; rrect(c, x - w / 2, y - 34, w, 64, 18); c.fill();
  c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, x, y + 9); c.restore();
};
// a result bar out of `of`
const sizeBar = (c: Ctx, y: number, label: string, v: number, of: number, col: string, k: number, note?: string, unit?: string) => {
  if (k <= 0) return;
  const x0 = 150, wmax = unit ? 780 : 600, q = easeOut(k);
  c.font = caveat(54); c.fillStyle = INK; c.textAlign = "left"; c.fillText(label, x0, y - 16);
  c.fillStyle = "#e2e8f0"; rrect(c, x0, y, wmax, 80, 16); c.fill();
  c.fillStyle = col; rrect(c, x0, y, Math.max(20, wmax * (v / of) * q), 80, 16); c.fill();
  if (unit) { c.font = caveat(66); c.fillStyle = col; c.textAlign = "right"; c.fillText(`${Math.round(v * q)} ${unit}`, x0 + wmax, y - 14); }
  else { c.font = caveat(72); c.fillStyle = INK; c.textAlign = "left"; c.fillText(`${Math.round(v * q)}/${of}`, x0 + wmax + 22, y + 62); }
  if (note) { c.font = handF(34); c.fillStyle = "#334155"; c.fillText(note, x0 + 12, y + 122); }
};
const rule = (c: Ctx, x: number, y: number, k: number[]) => {
  const rows: [string, string, string][] = [["SORTING: 1 miss OK", "→ MEDIUM ✓", "#dcfce7"], ["BILLS: 0 misses", "→ none passed → CALCULATOR", "#fee2e2"],
    ["Test each size on YOUR job.", "Keep the smallest that passes.", "#fef9c3"]];
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(15,23,42,0.88)"; rrect(c, -490, -250, 980, 500, 30); c.fill();
  rows.forEach(([a, b, bg], i) => {
    const q = k[i] ?? 0; if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 2);
    c.fillStyle = bg; rrect(c, -460, -226 + i * 160, 920, 140, 22); c.fill();
    c.font = SANS(46); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a, -430, -166 + i * 160);
    c.font = SANS(42, 600); c.fillStyle = i === 1 ? "#991b1b" : i === 0 ? "#14532d" : INK; c.fillText(b, -430, -110 + i * 160);
    c.restore();
  });
  c.restore();
};
const bin = (c: Ctx, x: number, y: number, r: () => number) => {
  c.fillStyle = "#64748b"; c.beginPath(); c.moveTo(x - 70, y - 80); c.lineTo(x + 70, y - 80); c.lineTo(x + 55, y + 80); c.lineTo(x - 55, y + 80); c.closePath(); c.fill();
  c.fillStyle = "#475569"; rrect(c, x - 82, y - 100, 164, 26, 8); c.fill();
  [-30, 0, 30].forEach((dx) => stroke(c, [[x + dx, y - 50], [x + dx * 0.8, y + 60]], "#94a3b8", 6, r, { passes: 1 }));
};

// ---------- the scene ----------
const StSize: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    if (b.shot === "screen" && b.prop !== "bars") sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 2} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("b")} at={at + 1} src="reel/sfx_buzz.wav" vol={0.35} />,
      <Sfx key={k("k")} at={at + 2} src="audio/sfx_snap.wav" vol={0.45} />);
    if (b.prop === "storage") sfx.push(<Sfx key={k("x")} at={cue(i, 1, 0.5) - 4} src="audio/gag_bonk.wav" vol={0.45} />);
    if (b.prop === "jars") sfx.push(<Sfx key={k("c")} at={cue(i, 1, 0.55) - 4} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "test") {
      [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 8 + q * 9} src="audio/sfx_tick.wav" vol={0.15} />));
      sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.6) - 40} src="reel/sfx_riser.wav" vol={0.32} />, <Sfx key={k("o")} at={cue(i, 1, 0.6) + 2} src="audio/gag_bonk.wav" vol={0.32} />);
    }
    if (b.prop === "bills") sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.35) - 40} src="reel/sfx_riser.wav" vol={0.3} />,
      <Sfx key={k("o")} at={cue(i, 1, 0.35)} src="audio/gag_bonk.wav" vol={0.3} />, <Sfx key={k("v")} at={cue(i, 2, 0.7)} src="audio/gag_bonk.wav" vol={0.26} />);
    if (b.prop === "diwali") sfx.push(<Sfx key={k("p")} at={at + Math.round(l.frames * 0.55)} src="audio/gag_pop.wav" vol={0.45} />);
    if (b.prop === "quiz") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("q" + q)} at={end + 6 + q * 24} src="audio/sfx_tick.wav" vol={0.38} />));
    if (b.prop === "bars") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.02) - 6} src="reel/sfx_boom.wav" vol={0.75} />, <Sfx key={k("s")} at={cue(i, 3, 0.75) - 4} src="audio/sfx_success.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src="audio/sfx_snap.wav" vol={0.35} />, <Sfx key={k("b")} at={cue(i, 1, 0.5) - 4} src="audio/sfx_snap.wav" vol={0.35} />);
    if (b.prop === "delete") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) + 4} src="audio/sfx_whoosh.wav" vol={0.35} />);
    if (b.prop === "installed") sfx.push(<Sfx key={k("i")} at={at + 6} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "flood") for (let q = 0; q < 9; q++) sfx.push(<Sfx key={k("n" + q)} at={at - 14 + Math.round(30 * Math.sqrt(q / 9) * 2)} src="audio/sfx_pop.wav" vol={0.22} />);
    if (b.prop === "full") sfx.push(<Sfx key={k("f")} at={cue(i, 1, 0.55) - 6} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("z")} at={cue(i, 1, 0.55) - 6} src="reel/sfx_buzz.wav" vol={0.3} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9500 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = {
            storage: "storage", jars: "brain sizes", test: "our real test: 40 messages", diwali: "our real test: 40 messages",
            bars: "our real test: 40 messages", bills: "20 bills (EP34's test)", delete: "storage", installed: "storage", full: "sorting your messages",
          };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 316); c.scale(0.92, 0.92); c.translate(-W / 2, -160);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "storage") {
            storageBar(c, 380, 61);
            gmGrid(c, 140, 560, 4, 3, 185, 150, 20, easeOut(seg(p, 0, 0.3)));
            const c1 = cu(1, 0.5);
            const drop = easeOut(seg(p, 0.05, 0.4)), bounce = seg(f, c1 - 6, c1 + 10);
            const by = 1120 - (drop < 1 ? (1 - drop) * 300 : 0) + (bounce > 0 ? -Math.sin(bounce * Math.PI) * 160 : 0);
            c.save(); c.fillStyle = "#334155"; rrect(c, 340, by - 70, 400, 140, 24); c.fill();
            c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("free brain · 4.7 GB", 540, by + 16); c.restore();
            if (f >= c1 - 4) { xMark(c, 540, by, 90, seg(f, c1 - 4, c1 + 6), r); tag(c, "you have 1 GB free", 540, 1330, 54, "#fee2e2", "#991b1b", -0.02, seg(f, c1, c1 + 8)); }
          }
          if (b.prop === "jars") {
            const c1 = cu(1, 0.55);
            jar(c, 260, 960, 200, 170, "TINY", "½ billion · 0.5 GB", COL.red, seg(f, 0, 8), r);
            jar(c, 540, 960, 330, 210, "MEDIUM", "1.5 billion · 1.1 GB", GREEN, seg(f, 3, 11), r);
            jar(c, 820, 960, 520, 250, "BIG", "7 billion · 4.7 GB", AMBER, seg(f, 6, 14), r);
            tag(c, "parameters = the numbers a brain is made of", 540, 400, 38, COL.yellow, INK, -0.01, seg(f, 0, 8));
            c.font = handF(30); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("(the three we tested: Qwen2.5, 4-bit files)", 540, 1160);
            if (f >= c1 - 4) {
              const k = seg(f, c1 - 4, c1 + 6);
              c.save(); c.globalAlpha = k; c.fillStyle = "#0f172a"; rrect(c, 130, 1190, 820, 220, 24); c.fill();
              c.font = SANS(44); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("Phone-size brains =", 540, 1258);
              c.fillText("SMALL LANGUAGE MODELS", 540, 1314);
              c.font = SANS(32, 600); c.fillStyle = "#e2e8f0"; c.fillText("e.g. Llama 3.2 1B · Gemma 3 1B · Qwen2.5 1.5B", 540, 1372); c.restore();
            }
          }
          if (b.prop === "test" || b.prop === "diwali") {
            const msgs = ["anna 2 kg rice and 1 litre oil pls", "sent 450 on UPI, pls check", "the milk you sent yesterday was sour", "are you open on Sunday?"];
            const counts = b.prop === "test" ? [0, 1, 2, 3].map((q) => Math.round(2 + 6 * seg(p, 0.1 + q * 0.05, 0.5 + q * 0.05))) : [8, 3, 2, 7];
            trays(c, 960, counts, b.prop === "diwali" && p > 0.5 ? 0 : -1);
            if (b.prop === "test") {
              msgs.forEach((m, q) => {
                const t0 = 0.04 + q * 0.12, k = seg(p, t0, t0 + 0.1), fall = easeOut(seg(p, t0 + 0.1, t0 + 0.2));
                if (k <= 0 || fall >= 1) return;
                chipMsg(c, 540 + (q - 1.5) * 40 * fall, 520 + q * 90 + fall * (960 - 520 - q * 90), m, k * (1 - fall * 0.6), ["#dcf8c6", "#fef9c3", "#fee2e2", "#e0e7ff"][q]);
              });
              c.font = handF(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("40 messages · the right tray written down first", 540, 460);
              const c1 = cu(1, 0.6);
              if (f >= c1 - 6) sizeBar(c, 1240, "TINY (0.5 GB)", 14, 40, COL.red, seg(f, c1 - 6, c1 + 12), f >= c1 + 14 ? "guessing at random gets about 10" : undefined);
            } else {
              const k = seg(p, 0.05, 0.25), land = easeOut(seg(p, 0.3, 0.55));
              chipMsg(c, 540 - 290 * land, 600 + 400 * land, "happy diwali anna and family", k * (1 - 0.3 * land), "#fde68a");
              if (land >= 1) { xMark(c, 240, 1030, 70, seg(p, 0.55, 0.7), r); stamp(c, "ORDER?!", 640, 760, 110, COL.red, seg(p, 0.55, 0.68), r, -0.08); }
              c.font = handF(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("a real miss from our test (the tiny one)", 540, 1250);
            }
          }
          if (b.prop === "bars") {
            const c1 = cu(1, 0.02), c2 = cu(2, 0.4), c3 = cu(3, 0.75);
            sizeBar(c, 470, "TINY · 0.5 GB", 14, 40, COL.red, 1);
            sizeBar(c, 690, "MEDIUM · 1.1 GB", 39, 40, GREEN, seg(f, c1 - 2, c1 + 14));
            sizeBar(c, 910, "BIG · 4.7 GB", 39, 40, AMBER, seg(f, c2 - 4, c2 + 12));
            if (f >= c3 - 4) tag(c, "4x FASTER", 840, 640, 64, GREEN, "#fff", -0.06, seg(f, c3 - 4, c3 + 6));
            if (f >= c2 + 8) tag(c, "= same", 900, 860, 46, "#e2e8f0", INK, 0.04, seg(f, c2 + 8, c2 + 14));
            c.font = handF(28); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("our test: laptop CPU, no graphics card, 4-bit files", 540, 1150);
          }
          if (b.prop === "bills") {
            const c1 = cu(1, 0.35), c2 = cu(2, 0.7);
            c.font = SANS(48); c.fillStyle = "#991b1b"; c.textAlign = "center"; c.fillText("MISTAKES, out of 20 bills", 540, 425);
            sizeBar(c, 560, "TINY", 19, 20, COL.red, seg(p, 0.02, 0.15), undefined, "wrong");
            sizeBar(c, 780, "MEDIUM", 9, 20, COL.red, seg(f, c1 - 4, c1 + 12), undefined, "wrong");
            sizeBar(c, 1000, "BIG", 2, 20, COL.red, seg(f, c2 - 4, c2 + 12), undefined, "wrong");
            if (f >= c2 + 10) tag(c, "a wrong bill = a cheated customer", 540, 1220, 44, "#fee2e2", "#991b1b", -0.02, seg(f, c2 + 10, c2 + 18));
          }
          if (b.prop === "delete" || b.prop === "installed") {
            const c1 = cu(1, 0.45);
            const gone = b.prop === "delete" ? easeOut(seg(f, c1, endL)) : 1;
            storageBar(c, 380, 61 - 0.2 * gone, true, b.prop === "installed" ? 1.1 : 0);
            if (b.prop === "delete") {
              gmGrid(c, 140, 560, 4, 3, 185, 150, 20, 1 - gone);
              for (let q = 0; q < 6; q++) {   // photos flying into the bin
                const t = seg(f, c1 + q * 3, c1 + q * 3 + 14);
                if (t <= 0 || t >= 1) continue;
                gm(c, 300 + q * 60 + t * (540 - 300 - q * 60), 700 + t * 420 - Math.sin(t * Math.PI) * 200, 120, 96, q);
              }
              bin(c, 540, 1200, r);
              if (f < c1) tag(c, "MEDIUM needs 1.1 GB · free 1 GB", 540, 1360, 44, "#fee2e2", "#991b1b", -0.01, seg(p, 0.05, 0.15));
            } else {
              c.save(); c.fillStyle = "#dcfce7"; rrect(c, 190, 640, 700, 300, 30); c.fill();
              c.font = SANS(64); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText("MEDIUM ✓", 540, 760);
              c.font = SANS(40, 600); c.fillText("1.1 GB · works offline", 540, 840); c.restore();
            }
          }
          if (b.prop === "full") {
            const c1 = cu(1, 0.55);
            trays(c, 960, [8, 3, 2, 8], 3);
            for (let q = 0; q < 7; q++) {   // the good mornings pour into OTHER
              const t = seg(p, q * 0.06, q * 0.06 + 0.3);
              if (t <= 0 || t >= 1) continue;
              gm(c, 300 + q * 50 + t * (790 - 300 - q * 50), 420 + t * 540, 110, 88, q);
            }
            tag(c, "52 good mornings → OTHER ✓", 540, 840, 46, "#e0e7ff", INK, -0.02, seg(p, 0.2, 0.32));
            if (f >= c1 - 4) fullDialog(c, 540, 680, 1.1, seg(f, c1 - 4, c1 + 6), "52 new photos", "free: 0 GB");
          }
          c.restore();
        } else {
          // ---------- the shop ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.14) || (n === 17 && p < 0.2) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          if (n === 1 || n === 17) {   // the phone's red label, big enough to read on a phone
            c.save(); c.fillStyle = "#dc2626"; rrect(c, PH.x - 170, PH.y - 250, 340, 76, 18); c.fill();
            c.beginPath(); c.moveTo(PH.x - 16, PH.y - 176); c.lineTo(PH.x + 16, PH.y - 176); c.lineTo(PH.x, PH.y - 150); c.closePath(); c.fill();
            c.font = caveat(48); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("STORAGE FULL ✕", PH.x, PH.y - 196); c.restore();
          }
          customers(c, n === 1 ? 5 : n === 14 || n === 17 ? 4 : 0, f, r);
          c.restore();
          // screen-space props
          if (n === 1) {   // frame 1: the sticker and the phone's screen, good mornings under the dialog
            headline(c, W, "HE WANTS AI WITHOUT INTERNET.", "IT DOESN'T FIT.", 1);
            c.save(); c.translate(560, 520); c.rotate(0.03);
            c.fillStyle = "#0b1220"; rrect(c, 0, 0, 440, 520, 40); c.fill();
            c.fillStyle = "#f8fafc"; rrect(c, 18, 18, 404, 484, 28); c.fill();
            gmGrid(c, 34, 40, 3, 4, 118, 104, 10, 1);
            c.restore();
            fullDialog(c, 780, 800, 0.62, 1);
          }
          if (n === 3) bubble(c, 300, 560, "Blessings!", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 5) bubble(c, 320, 560, "TINY!", 90, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 7) bubble(c, 300, 560, "14 / 40?!", 90, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 9) {
            if (f < cu(1, 0.6)) bubble(c, 330, 560, "₹ per kilo?!", 70, seg(p, 0.05, 0.2), COL.yellow);
            if (f > endL + 1) {   // the quiz, held after the line: one question and a 3-2-1 (the music drops out on the 1)
              const k = easeOut(seg(f, endL + 1, endL + 7));
              c.save(); c.globalAlpha = 0.5 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
              c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
              c.fillStyle = "#fffdf5"; rrect(c, -460, -300, 920, 600, 30); c.fill();
              c.font = SANS(48); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR GUESS", 0, -205);
              c.font = SANS(104); c.fillStyle = INK; c.fillText("MEDIUM: ?/40", 0, -60);
              c.font = SANS(40, 600); c.fillStyle = "#475569"; c.fillText("(tiny got 14)", 0, 30);
              const t = f - endL - 6, q = 3 - Math.floor(t / 24);   // 3, 2, 1: 0.8 s each, with the ticks
              if (t >= 0 && q >= 1) {
                const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
                c.save(); c.translate(0, 175); c.scale(pop, pop);
                c.beginPath(); c.arc(0, 0, 72, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
                c.font = SANS(96); c.fillStyle = "#fff"; c.fillText(String(q), 0, 34); c.restore();
              }
              c.restore();
            }
          }
          if (n === 11) bubble(c, 320, 560, "MEDIUM!", 90, seg(p, 0.05, 0.2), "#dcfce7", "#14532d");
          if (n === 13) bubble(c, 300, 560, "Which one?!", 80, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 14) rule(c, W / 2, 1000, [seg(p, 0.02, 0.1), seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 4), seg(f, cu(1, 0.5) + 20, cu(1, 0.5) + 28)]);   // all three rows up for about 3 s
          if (n === 17) {   // 52 good mornings arrive
            const k = seg(p, 0, 0.5);
            for (let q = 0; q < 8; q++) {
              const t = clamp(k * 8 - q); if (t <= 0) continue;
              c.save(); c.globalAlpha = t; gm(c, 120 + (q % 4) * 220, 300 + Math.floor(q / 4) * 190, 190, 160, q); c.restore();
            }
            tag(c, "Family group: 52 new photos", W / 2, 475, 50, GREEN, "#fff", -0.02, seg(p, 0.05, 0.2));
          }
        }
      }} />
    </>
  );
};

export const SIZE_SCENES = { sk_size: StSize };
