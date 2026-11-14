import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 29 "4.8 Stars, but the AI Picked 3.1" (series/scripts/creative29_hidden_line.md): story mode, one narrator.
// Lakshmi garu's avakaya (4.8 stars) vs Royal Spice (3.1 stars); a hidden line on Royal Spice's page makes a small AI
// pick it 10 of 10 times. Our test: series/scripts/creative29_demo/pickle.json. Every reply and count on screen comes
// from the spec (data.t), copied from that test. Lakshmi and both shops are made up.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const RED = "#dc2626", GREEN = "#16a34a", GOLD = "#f59e0b";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;

const block = (c: Ctx, x: number, y: number, top: string, big: string, col: string) => {
  c.save();
  c.fillStyle = "#111827"; rrect(c, x, y, 470, 170, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, top, 430, 32, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(top, x + 235, y + 50);
  c.font = SANS(fit(c, big, 430, 76, 900), 900); c.fillStyle = col; c.fillText(big, x + 235, y + 136);
  c.restore();
};
const stars = (c: Ctx, x: number, y: number, v: number, size: number) => {
  for (let i = 0; i < 5; i++) {
    const fill = clamp(v - i);
    const cx = x + i * size * 1.1;
    c.save(); c.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? size * 0.22 : size * 0.5; c.lineTo(cx + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); c.fillStyle = "#e5e7eb"; c.fill(); c.clip();
    c.fillStyle = GOLD; c.fillRect(cx - size / 2, y - size / 2, size * fill, size); c.restore();
  }
};
const product = (c: Ctx, x: number, y: number, w: number, name: string, rating: number, reviews: string, price: string, hi: string, k = 1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, 250, 20); c.fill();
  c.strokeStyle = hi; c.lineWidth = 6; rrect(c, x, y, w, 250, 20); c.stroke();
  c.fillStyle = "#b45309"; rrect(c, x + 20, y + 24, 120, 150, 16); c.fill();   // the jar
  c.fillStyle = "#dc2626"; c.beginPath(); c.arc(x + 80, y + 110, 36, 0, 7); c.fill(); c.fillStyle = "#fde68a"; c.fillRect(x + 30, y + 30, 100, 18);
  c.fillStyle = INK; c.textAlign = "left"; c.font = SANS(fit(c, name, w - 190, 34, 800), 800); c.fillText(name, x + 160, y + 60);
  stars(c, x + 175, y + 108, rating, 34);
  c.font = SANS(40, 900); c.fillStyle = rating > 4 ? GREEN : RED; c.fillText(rating.toFixed(1), x + 365, y + 122);
  c.font = SANS(26, 700); c.fillStyle = "#475569"; c.fillText(reviews, x + 160, y + 165);
  c.font = SANS(30, 800); c.fillStyle = INK; c.fillText(price, x + 160, y + 212);
  c.restore();
};
const kitchen = (c: Ctx, W: number, r: () => number) => {
  c.fillStyle = "#fef3c7"; c.fillRect(0, 470, W, 1050);
  c.fillStyle = "#92400e"; c.fillRect(0, 1180, W, 40); c.fillStyle = "#b45309"; c.fillRect(0, 1220, W, 300);   // the counter
  [[120, 1050], [270, 1070], [860, 1060]].forEach(([x, y]) => {   // jaadis (ceramic pickle jars)
    c.fillStyle = "#d6b48a"; c.beginPath(); c.ellipse(x, y, 70, 120, 0, 0, 7); c.fill();
    c.fillStyle = "#7c2d12"; c.fillRect(x - 40, y - 140, 80, 30);
    stroke(c, [[x - 55, y - 20], [x + 55, y - 20]], "#92400e", 5, r, { passes: 1 });
  });
  for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? "#65a30d" : "#84cc16"; c.beginPath(); c.ellipse(600 + i * 60, 1160, 34, 24, 0.3, 0, 7); c.fill(); }   // mangoes
};
// Lakshmi garu: a long braid with jasmine, a green saree, a red bindi, glass bangles
const lakshmi = (c: Ctx, x: number, y: number, mood: "proud" | "worried" | "smile", f: number, r: () => number) => {
  const sk = "#a16207";
  c.fillStyle = "#15803d"; c.beginPath(); c.moveTo(x - 130, y + 380); c.quadraticCurveTo(x - 140, y + 110, x, y + 95); c.quadraticCurveTo(x + 140, y + 110, x + 130, y + 380); c.closePath(); c.fill();
  stroke(c, [[x - 60, y + 105], [x + 80, y + 360]], "#facc15", 12, r, { passes: 1 });
  c.fillStyle = sk; c.fillRect(x - 20, y + 60, 40, 40);
  c.fillStyle = sk; c.beginPath(); c.ellipse(x, y, 72, 88, 0, 0, 7); c.fill();
  c.fillStyle = "#1f2937"; c.beginPath(); c.ellipse(x, y - 48, 80, 48, 0, Math.PI, 0); c.fill();   // hair
  c.fillStyle = "#1f2937"; c.fillRect(x + 50, y - 40, 22, 200);   // the braid
  for (let i = 0; i < 4; i++) { c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x + 61, y - 30 + i * 18, 7, 0, 7); c.fill(); }   // jasmine
  c.fillStyle = RED; c.beginPath(); c.arc(x, y - 28, 8, 0, 7); c.fill();
  [[-26, -2], [26, -2]].forEach(([dx, dy]) => { c.fillStyle = "#111827"; c.beginPath(); c.arc(x + dx, y + dy, 7, 0, 7); c.fill(); });
  const m = mood === "worried" ? circlePts(x, y + 52, 20, 10, Math.PI + 0.3, 2 * Math.PI - 0.3, 10) : circlePts(x, y + 30, 24, 16, 0.2, Math.PI - 0.2, 10);
  stroke(c, m as [number, number][], "#7f1d1d", 5, r, { passes: 1 });
  [[-110, 260], [110, 260]].forEach(([dx, dy]) => { c.fillStyle = sk; c.beginPath(); c.arc(x + dx, y + dy, 24, 0, 7); c.fill(); stroke(c, circlePts(x + dx, y + dy - 26, 22, 8, 0, 2 * Math.PI, 14), "#e11d48", 4, r, { passes: 1 }); });
  void f;
};
const bubble = (c: Ctx, x: number, y: number, w: number, text: string, me: boolean, k: number, size = 30, hi = "", hiK = 0) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const lines = wrap(c, text, w - 56);
  const h = lines.length * size * 1.3 + 34;
  c.fillStyle = me ? "#dcf8c6" : "#ffffff"; rrect(c, x, y, w, h, 18); c.fill();
  c.textAlign = "left";
  lines.forEach((l, i) => {
    const yy = y + 20 + (i + 1) * size * 1.3 - size * 0.3;
    if (hi && l.includes(hi) && hiK > 0) { const pre = c.measureText(l.slice(0, l.indexOf(hi))).width; c.save(); c.globalAlpha = 0.6 * clamp(hiK * 3); c.fillStyle = "#fde047"; c.fillRect(x + 24 + pre, yy - size * 0.95, c.measureText(hi).width + 8, size * 1.2); c.restore(); }
    c.fillStyle = INK; c.fillText(l, x + 28, yy);
  });
  c.restore();
  return y + h + 16;
};
const card = (c: Ctx, W: number, k: number) => { c.save(); c.globalAlpha = clamp(k * 3) * 0.94; c.fillStyle = "#0b1220"; c.fillRect(0, 470, W, 1050); c.restore(); };
const tilesRow = (c: Ctx, f: number, t0: number, y: number, label: string, who: "L" | "R", W: number) => {
  const kl = seg(f, t0 - 4, t0 + 4); if (kl <= 0) return;
  c.save(); c.globalAlpha = clamp(kl * 3); c.textAlign = "left"; c.font = SANS(fit(c, label, W - 120, 34, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(label, 60, y); c.restore();
  for (let q = 0; q < 10; q++) {
    const k = seg(f, t0 + q * 2, t0 + q * 2 + 6); if (k <= 0) continue;
    const x = 60 + q * 97;
    c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = who === "L" ? "#dcfce7" : "#fee2e2"; rrect(c, x, y + 20, 86, 110, 14); c.fill();
    c.textAlign = "center"; c.font = SANS(22, 900); c.fillStyle = who === "L" ? GREEN : RED; c.fillText(who === "L" ? "4.8★" : "3.1★", x + 43, y + 70);
    c.font = SANS(18, 800); c.fillText(who === "L" ? "Lakshmi" : "Royal", x + 43, y + 104); c.restore();
  }
  const kc = seg(f, t0 + 22, t0 + 28);
  if (kc > 0) { c.save(); c.globalAlpha = clamp(kc * 3); c.textAlign = "right"; c.font = SANS(40, 900); c.fillStyle = who === "L" ? "#4ade80" : "#f87171"; c.fillText("10/10", W - 60, y); c.restore(); }
};

const StPickle: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("t")} at={cue(i, 1, 0.75) - 6} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "kitchen") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.4} />);
    if (b.prop === "ask") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.1)} src="audio/sfx_pop.wav" vol={0.45} />);
    if (b.prop === "reply") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("z")} at={cue(i, 1, 0.6)} src="reel/sfx_buzz.wav" vol={0.45} />);
    if (b.prop === "why") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.45} />, <Sfx key={k("s")} at={cue(i, 1, 0.6)} src="audio/sfx_snap.wav" vol={0.5} />);
    if (b.prop === "line") sfx.push(<Sfx key={k("b")} at={at + 2} src="reel/sfx_boom.wav" vol={0.8} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("t1")} at={at + 10} src="audio/sfx_tick.wav" vol={0.4} />, <Sfx key={k("t2")} at={cue(i, 1, 0.1)} src="reel/sfx_buzz.wav" vol={0.45} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("r")} at={Math.max(0, at - 22)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 1, 0.1)} src="audio/sfx_success.wav" vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 10)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(2901 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        c.fillStyle = "#1c1410"; c.fillRect(0, 0, W, H);
        block(c, 50, 245, "LAKSHMI'S AVAKAYA", "4.8★", "#4ade80");
        block(c, 560, 245, "THE AI PICKED", "3.1★ · 10/10", "#f87171");
        c.fillStyle = "#fde68a"; c.textAlign = "center"; c.font = SANS(30, 800); c.fillText("the same question, asked 10 times", W / 2, 452);
        if (P === "hook" || P === "kitchen" || P === "loop") {
          kitchen(c, W, r);
          lakshmi(c, 540, P === "hook" ? 940 : 760, P === "kitchen" ? "proud" : P === "loop" ? "smile" : "worried", f, r);
          if (P === "hook") {
            product(c, 40, 500, 500, T.a.name, 4.8, T.a.reviews, T.a.price, GREEN);
            product(c, 560, 500, 480, T.b.name, 3.1, T.b.reviews, T.b.price, RED);
            chip(c, "the AI picked this one: 10 of 10", 800, 790, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 30);
          }
          if (P === "kitchen") chip(c, T.madeUp, W / 2, 1440, "#fde68a", INK, 1, 28);
          if (P === "loop") chip(c, "another shopper is asking...", W / 2, 1440, "#1e293b", "#f8fafc", seg(f, cu(1, 0.05), cu(1, 0.05) + 8), 34);
        } else if (P === "ask" || P === "reply") {
          card(c, W, 1);
          c.fillStyle = "#075e54"; rrect(c, 60, 500, W - 120, 70, 16); c.fill(); c.font = SANS(30, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("a small free AI · reads both shop pages", 90, 546);
          product(c, 60, 600, W - 120, T.a.name, 4.8, T.a.reviews, T.a.price, GREEN);
          product(c, 60, 870, W - 120, T.b.name, 3.1, T.b.reviews, T.b.price, RED);
          let y = bubble(c, 300, 1140, W - 360, T.q, true, P === "ask" ? seg(f, cu(1, 0.0), cu(1, 0.0) + 6) : 1, 30);
          if (P === "reply") {
            y = bubble(c, 60, y, W - 200, T.reply, false, seg(f, ln.from, ln.from + 8), 28, "best-rated", seg(f, cu(1, 0.1), cu(1, 0.1) + 8));
            chip(c, "\"best-rated\"? It's 3.1★", W / 2, 1460, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.6), cu(1, 0.6) + 8), 36);
          }
        } else if (P === "why" || P === "line") {
          card(c, W, 1);
          c.fillStyle = "#ffffff"; rrect(c, 60, 520, W - 120, 860, 20); c.fill();
          c.fillStyle = "#e2e8f0"; rrect(c, 60, 520, W - 120, 70, 20); c.fill(); c.fillStyle = "#334155"; c.textAlign = "left"; c.font = SANS(28, 800); c.fillText("🔒 Royal Spice Avakaya · product page", 90, 566);
          product(c, 90, 620, W - 180, T.b.name, 3.1, T.b.reviews, T.b.price, RED);
          c.fillStyle = "#475569"; c.font = SANS(28, 700); wrap(c, T.b.reviewText, W - 240).forEach((l, q) => c.fillText(l, 100, 920 + q * 38));
          // the hidden line: white on white, until the highlighter sweeps it
          const hy = 1120, kh = P === "why" ? seg(f, cu(1, 0.55), cu(1, 0.95)) : 1;
          c.font = SANS(28, 700); const hl = wrap(c, T.hidden, W - 240);
          if (kh > 0) { c.save(); c.globalAlpha = 0.85; c.fillStyle = "#fde047"; c.fillRect(90, hy - 34, (W - 180) * clamp(kh), hl.length * 40 + 16); c.restore(); }
          hl.forEach((l, q) => { c.fillStyle = P === "line" ? INK : "#ffffff"; c.fillText(l, 100, hy + q * 40); });
          if (P === "why") chip(c, "white text: shoppers can't see it", W / 2, 1440, "#1e293b", "#f8fafc", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 34);
          if (P === "line") chip(c, "we can't see it · the AI reads it, and obeys", W / 2, 1440, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.2), cu(1, 0.2) + 8), 32);
        } else if (P === "test" || P === "rule") {
          card(c, W, 1);
          c.textAlign = "center"; c.font = SANS(fit(c, "OUR TEST · the same question, 10 times each", W - 100, 44), 900); c.fillStyle = "#fde68a"; c.fillText("OUR TEST · the same question, 10 times each", W / 2, 540);
          c.font = SANS(28, 700); c.fillStyle = "#cbd5e1"; c.fillText("a small free AI on our computer, no web search", W / 2, 586);
          tilesRow(c, f, P === "test" ? ln.from + 4 : 0, 660, "no hidden line", "L", W);
          tilesRow(c, f, P === "test" ? cu(1, 0.1) : 0, 860, "with the hidden line", "R", W);
          if (P === "rule") {
            const kr = seg(f, ln.from, ln.from + 8);
            if (kr > 0) { c.save(); c.globalAlpha = clamp(kr * 3); c.fillStyle = "#14532d"; rrect(c, 60, 1040, W - 120, 150, 20); c.fill(); c.fillStyle = "#f0fdf4"; c.textAlign = "left"; c.font = SANS(28, 800); wrap(c, T.rule, W - 180).forEach((l, q) => c.fillText(l, 90, 1090 + q * 36)); c.restore(); }
            tilesRow(c, f, cu(1, 0.05), 1260, "with the hidden line + the rule", "L", W);
          }
        }
      }} />
    </>
  );
};

export const PICKLE_SCENES = { sk_pickle: StPickle };
