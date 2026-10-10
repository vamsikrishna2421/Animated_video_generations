import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, GREY, caveat, handF, fitSize, label, stamp, card } from "./WordsCrayon";

// "Laya, hands-on": how the free decision model works, how to try it, and its limits (from its own README).
// Same crayon look as the profile reel. Content band: y 270..1400 (banner above, karaoke captions below).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const GREEN = "#15803d";
const mono = (s: number) => `700 ${s}px "Space Mono", "DejaVu Sans Mono", monospace`;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Chatbot bubble that keeps filling with paragraph scribbles.
const chatBubble = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, fill: number, p: number) => {
  if (!card(c, x, y, w, h, r, p, COL.cream)) return;
  label(c, "AI chatbot", x + 30, y + 58, 44, GREY, caveat, p, "left");
  const rows = Math.floor((h - 110) / 46);
  const n = rows * fill;
  for (let i = 0; i < rows; i++) {
    const t = clamp(n - i);
    if (t <= 0) break;
    const ww = (i % 4 === 3 ? 0.55 : 0.9) * (w - 60) * t;
    const pts: Pt[] = [];
    for (let k = 0; k <= 10; k++) pts.push([x + 30 + ww * (k / 10), y + 104 + i * 46 + Math.sin(k * 1.7 + i) * 4]);
    stroke(c, pts, "#94a3b8", 7, r, { passes: 1, alpha: 0.9 });
  }
};

// Laya's answer card: a question and one number.
const answerCard = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, q: string, ans: string, p: number) => {
  if (!card(c, x, y, w, h, r, p, "#ecfdf5")) return;
  label(c, "Laya", x + w / 2, y + 62, 48, GREEN, caveat, p);
  label(c, q, x + w / 2, y + 150, fitSize(c, q, w - 40, 64, caveat), INK, caveat, p);
  label(c, ans, x + w / 2, y + 270, fitSize(c, ans, w - 40, 110, caveat), GREEN, caveat, p);
  label(c, "(example)", x + w / 2, y + h - 26, 36, GREY, handF, p);
};

// Five-point star, filled.
const star = (c: Ctx, x: number, y: number, rad: number, col: string) => {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? rad * 0.45 : rad;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fillStyle = col; c.fill();
};

// Semicircle meter whose needle swings to `v` (0..1).
const meter = (c: Ctx, cx: number, cy: number, rad: number, v: number, r: () => number, p: number) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p * 1.5);
  stroke(c, circlePts(cx, cy, rad, rad, Math.PI, Math.PI * 2, 30), COL.cream, 16, r, { passes: 2 });
  stroke(c, circlePts(cx, cy, rad, rad, Math.PI * 1.75, Math.PI * 2, 12), COL.green, 18, r, { passes: 2 });
  label(c, "no", cx - rad - 10, cy + 50, 46, COL.pale, caveat, p);
  label(c, "yes", cx + rad + 10, cy + 50, 46, COL.green, caveat, p);
  const a = Math.PI + Math.PI * v * easeOut(p);
  stroke(c, [[cx, cy], [cx + Math.cos(a) * (rad - 30), cy + Math.sin(a) * (rad - 30)]], COL.yellow, 10, r, { passes: 2 });
  c.beginPath(); c.arc(cx, cy, 16, 0, 7); c.fillStyle = COL.yellow; c.fill();
  c.restore();
};

const bar = (c: Ctx, x: number, y: number, w: number, h: number, v: number, col: string, name: string, val: string, p: number, r: () => number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  label(c, name, x, y - 16, 46, COL.cream, caveat, p, "left");
  c.save(); c.globalAlpha = clamp(p * 1.5);
  c.fillStyle = "rgba(255,255,255,0.12)"; rrect(c, x, y, w, h, h / 2); c.fill();
  c.fillStyle = col; rrect(c, x, y, Math.max(h, w * v * k), h, h / 2); c.fill();
  c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 3, r, { passes: 1, alpha: 0.4 });
  label(c, val, x + w + 26, y + h * 0.82, 64, col, caveat, p, "left");
};

// ---------- 1 HOOK ----------
const LhHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={22} src="audio/sfx_pop.wav" vol={0.5} />
      <Sfx at={c1} src="audio/sfx_chaching.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3100 + boil);
        chatBubble(c, 60, 320, 470, 560, r, seg(f, 0, 70), 1);
        answerCard(c, 560, 380, 460, 420, r, "refund?", "YES · 0.97", seg(f, 18, 28));
        if (f >= 18) stamp(c, "1 answer", 790, 880, 54, COL.yellow, seg(f, 24, 32), r, -0.05);
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 90, 950, 900, 190, r, p, COL.cream);
          c.save(); c.globalAlpha = clamp(p * 1.5); star(c, 180, 1045, 52, COL.orange); c.restore();
          label(c, `${fmt(lerp(0, 32138, easeOut(seg(f, c1, c1 + 30))))} stars`, 270, 1068, 96, INK, caveat, p, "left");
          label(c, "on GitHub, in 3 weeks (as of Oct 10)", 274, 1118, 38, GREY, handF, p, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          hand(c, "Laya", W / 2, 1290, 120, COL.yellow, seg(f, c2, c2 + 14), r, -0.02, "center");
          tag(c, "free", 300, 1340, 50, COL.green, INK, -0.05, seg(f, c2 + 10, c2 + 18));
          tag(c, "open source", 790, 1340, 50, COL.pale, INK, 0.04, seg(f, c2 + 14, c2 + 22));
          void p;
        }
      }} />
    </>
  );
};

// ---------- 2 WHAT IT DOES ----------
const LhWhat: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      {[c1, c2].map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.4} />)}
      <Sfx at={c3} src="audio/sfx_tick.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3200 + boil);
        hand(c, "Laya", W / 2, 360, 96, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        label(c, "built by Nandakishor (Kerala)", W / 2, 420, 46, COL.cream, caveat, seg(f, 6, 16));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 90, 470, 900, 220, r, p, COL.cream);
          label(c, "message", 130, 530, 40, GREY, caveat, p, "left");
          label(c, "\"We were billed twice.", 130, 600, 58, INK, caveat, p, "left");
          label(c, "Please refund.\"", 150, 660, 58, INK, caveat, p, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 730, 900, 210, r, p, "#fff6d8");
          label(c, "question (fixed answers)", 130, 790, 40, GREY, caveat, p, "left");
          label(c, "Does the customer want a refund?", W / 2, 856, fitSize(c, "Does the customer want a refund?", 840, 60, caveat), INK, caveat, p);
          tag(c, "YES", 420, 912, 44, COL.green, INK, 0, p);
          tag(c, "NO", 660, 912, 44, COL.pale, INK, 0, p);
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          meter(c, W / 2, 1210, 220, 0.97, r, seg(f, c3, c3 + 26));
          label(c, "P(yes) = 0.97", W / 2, 1290, 64, COL.yellow, caveat, seg(f, c3 + 16, c3 + 26));
          label(c, "(example) · no reply written", W / 2, 1345, 40, COL.pale, handF, p);
        }
      }} />
    </>
  );
};

// ---------- 3 THREE KINDS OF QUESTIONS ----------
const LhKinds: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      {[c1, c2, c3].map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.4} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3300 + boil);
        hand(c, "3 kinds of questions", W / 2, 360, 80, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 70, 410, 940, 290, r, p, COL.cream);
          tag(c, "PICK ONE", 210, 470, 44, COL.orange, "#fff", -0.03, p);
          label(c, "Which team gets this ticket?", 110, 560, 54, INK, caveat, p, "left");
          ["billing", "tech", "sales"].forEach((t, i) => tag(c, t, 230 + i * 300, 650, 52, i === 0 ? COL.green : "#e5e7eb", INK, 0, seg(f, c1 + 6 + i * 3, c1 + 14 + i * 3)));
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 70, 730, 940, 270, r, p, "#fff6d8");
          tag(c, "SCORE", 190, 790, 44, COL.light, "#fff", -0.03, p);
          label(c, "How urgent is it? (1 to 5)", 110, 878, 54, INK, caveat, p, "left");
          for (let i = 0; i < 5; i++) {
            const on = i < 4 && f >= c2 + 8 + i * 4;
            c.save(); c.globalAlpha = clamp(p * 1.5);
            c.beginPath(); c.arc(330 + i * 110, 950, 30, 0, 7); c.fillStyle = on ? COL.orange : "#e5e7eb"; c.fill();
            c.restore();
            label(c, String(i + 1), 330 + i * 110, 964, 40, on ? "#fff" : GREY, caveat, p);
          }
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          card(c, 70, 1030, 940, 290, r, p, "#ecfdf5");
          tag(c, "YES / NO", 210, 1090, 44, GREEN, "#fff", -0.03, p);
          label(c, "Is this email phishing?", 110, 1180, 54, INK, caveat, p, "left");
          // envelope with a fish hook
          c.save(); c.globalAlpha = clamp(p * 1.5);
          c.fillStyle = "#fff"; c.fillRect(160, 1220, 140, 80);
          c.restore();
          stroke(c, [[160, 1220], [230, 1265], [300, 1220]], COL.ink, 4, r, { passes: 1, alpha: 0.7 * p });
          stroke(c, [[330, 1180], [330, 1250], [350, 1275], [372, 1255]], GREY, 6, r, { passes: 2, alpha: p });
          stamp(c, "YES", 760, 1265, 70, COL.red, seg(f, c3 + 10, c3 + 18), r, -0.06);
        }
      }} />
    </>
  );
};

// ---------- 4 WHY USE IT ----------
const LhWhy: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_chaching.wav" vol={0.45} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3400 + boil);
        hand(c, "why use it?", W / 2, 360, 90, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          // stopwatch
          c.save(); c.globalAlpha = clamp(p * 1.5);
          c.beginPath(); c.arc(230, 560, 105, 0, 7); c.fillStyle = COL.cream; c.fill();
          c.fillStyle = COL.cream; c.fillRect(210, 432, 40, 30);
          c.restore();
          stroke(c, circlePts(230, 560, 105, 105), COL.ink, 6, r, { passes: 2, alpha: p });
          const a = -Math.PI / 2 + seg(f, c1, c1 + 12) * 0.8;
          stroke(c, [[230, 560], [230 + Math.cos(a) * 80, 560 + Math.sin(a) * 80]], COL.red, 8, r, { passes: 2, alpha: p });
          label(c, "33 ms", 390, 590, 120, COL.yellow, caveat, p, "left");
          label(c, "per question (README, T4 cloud GPU)", 396, 650, 38, COL.pale, handF, p, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 720, 900, 250, r, p, COL.cream);
          tag(c, "FREE", 230, 800, 64, COL.green, INK, -0.04, p);
          label(c, "open source (Apache-2.0)", 360, 812, 54, INK, caveat, p, "left");
          // small computer
          c.save(); c.globalAlpha = clamp(p * 1.5);
          c.fillStyle = "#cbd5e1"; c.fillRect(150, 860, 150, 80); c.fillStyle = COL.ink; c.fillRect(160, 870, 130, 60);
          c.restore();
          label(c, "you pay only for the computer", 340, 920, 48, GREY, caveat, p, "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          card(c, 90, 1010, 430, 300, r, p, COL.cream);
          for (let i = 0; i < 5; i++) stroke(c, [[120, 1060 + i * 46], [480 - (i % 2) * 70, 1060 + i * 46]], "#94a3b8", 7, r, { passes: 1, alpha: p });
          stroke(c, [[110, 1030], [500, 1290]], COL.red, 10, r, { passes: 2, alpha: seg(f, c3 + 6, c3 + 12) });
          stroke(c, [[500, 1030], [110, 1290]], COL.red, 10, r, { passes: 2, alpha: seg(f, c3 + 8, c3 + 14) });
          card(c, 560, 1080, 430, 160, r, p, "#ecfdf5");
          label(c, "YES · 0.97", 775, 1180, 76, GREEN, caveat, p);
          label(c, "can be wrong, can't ramble", W / 2, 1360, 52, COL.cream, caveat, seg(f, c3 + 12, c3 + 22));
        }
      }} />
    </>
  );
};

// ---------- 5 TRY IT ----------
const CODE = [
  ["from laya import Router", COL.ink],
  ["msg = {\"body\": \"Billed twice. Refund?\"}", COL.ink],
  ["q = {\"billing\": {\"type\": \"noul\",", COL.ink],
  ["     \"instructions\": \"Refund request?\"}}", COL.ink],
  ["r = Router().predict(msg, q)", COL.ink],
  ["print(r[\"answers\"][\"billing\"][\"noul\"])", "#b45309"],
] as const;
const LhTry: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3500 + boil);
        hand(c, "try it", W / 2, 360, 96, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 70, 420, 940, 150, r, p, "#0f172a");
          const cmd = "pip install laya";
          const n = Math.round(cmd.length * seg(f, c1, c1 + 18));
          label(c, "$ " + cmd.slice(0, n), 110, 515, 56, COL.green, mono, p, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 50, 610, 980, 520, r, p, COL.cream);
          label(c, "Python", 90, 668, 40, GREY, caveat, p, "left");
          CODE.forEach(([t, col], i) => {
            const q = seg(f, c2 + 4 + i * 5, c2 + 12 + i * 5);
            label(c, t, 84, 740 + i * 66, fitSize(c, "     \"instructions\": \"Refund request?\"}}", 900, 36, mono), col, mono, q, "left");
          });
          if (f >= c3) {
            c.save(); c.globalAlpha = 0.25 * fade(f, c3, 8); c.fillStyle = COL.yellow; rrect(c, 70, 1060, 940, 60, 10); c.fill(); c.restore();
          }
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          label(c, "→ 0.97", 360, 1240, 110, COL.yellow, caveat, p, "left");
          label(c, "(example output)", 690, 1236, 40, COL.pale, handF, p, "left");
          label(c, "code adapted from the Laya README", W / 2, 1320, 38, COL.pale, handF, p);
        }
      }} />
    </>
  );
};

// ---------- 6 THE HONEST PART ----------
const LhHonest: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.6} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3600 + boil);
        hand(c, "the honest part", W / 2, 350, 86, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        label(c, "(from his own README)", W / 2, 405, 44, COL.cream, caveat, seg(f, 6, 16));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          label(c, "tough business tasks (typed-decisions test)", 90, 462, 40, COL.pale, handF, p, "left");
          bar(c, 90, 550, 640, 50, 0.36, COL.red, "base model", "36%", seg(f, c1, c1 + 14), r);
          bar(c, 90, 668, 640, 50, 0.77, COL.green, "after training on examples", "77%", seg(f, c1 + 14, c1 + 28), r);
          // simple baseline (majority answer) as a dashed line
          const bx = 90 + 640 * 0.46;
          c.save(); c.globalAlpha = clamp(p * 1.5); c.setLineDash([14, 12]); c.strokeStyle = COL.yellow; c.lineWidth = 5;
          c.beginPath(); c.moveTo(bx, 540); c.lineTo(bx, 728); c.stroke(); c.restore();
          label(c, "simple baseline 46%", bx + 10, 762, 38, COL.yellow, caveat, p, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 800, 900, 140, r, p, COL.cream);
          label(c, "20+ options to choose from?", 130, 862, 52, INK, caveat, p, "left");
          label(c, "→ Jev does better", 600, 916, 50, COL.orange, caveat, p, "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          label(c, "20-option test (random guess: 5%)", 90, 1000, 40, COL.pale, handF, p, "left");
          bar(c, 90, 1080, 640, 54, 0.71, COL.green, "English", "71%", seg(f, c3, c3 + 14), r);
          bar(c, 90, 1210, 640, 54, 0.22, COL.red, "Telugu", "22%", seg(f, c3 + 6, c3 + 20), r);
          tag(c, "not ready yet", 540, 1340, 50, COL.red, "#fff", -0.04, seg(f, c3 + 18, c3 + 26));
        }
      }} />
    </>
  );
};

// ---------- 7 WHICH ONE + CTA ----------
const LhCta: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3700 + boil);
        hand(c, "so which one?", W / 2, 360, 90, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 70, 420, 940, 220, r, p, COL.cream);
          label(c, "need words?", 120, 500, 60, INK, caveat, p, "left");
          label(c, "→ a chatbot", 120, 580, 64, COL.light, caveat, p, "left");
          for (let i = 0; i < 3; i++) stroke(c, [[640, 480 + i * 40], [960 - i * 60, 480 + i * 40]], "#94a3b8", 7, r, { passes: 1, alpha: p });
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 70, 670, 940, 260, r, p, "#ecfdf5");
          label(c, "need a quick yes, no or pick-one,", 120, 750, 50, INK, caveat, p, "left");
          label(c, "thousands of times a day?", 120, 810, 50, INK, caveat, p, "left");
          label(c, "→ a decision model like Laya", 120, 890, 60, GREEN, caveat, p, "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 12);
          // bookmark
          c.save(); c.globalAlpha = easeOut(p);
          c.beginPath(); c.moveTo(150, 990); c.lineTo(250, 990); c.lineTo(250, 1130); c.lineTo(200, 1095); c.lineTo(150, 1130); c.closePath(); c.fillStyle = COL.yellow; c.fill();
          c.restore();
          label(c, "save this for your next project", 290, 1075, 56, COL.cream, caveat, p, "left");
          label(c, "pip install laya · @nandakishor_m", W / 2, 1190, 48, COL.pale, caveat, p);
          c.save(); c.globalAlpha = easeOut(p);
          c.font = caveat(handle.length > 16 ? 78 : 92); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1300);
          c.shadowBlur = 0; c.font = handF(46); c.fillStyle = COL.cream; c.fillText("AI tools, explained simply", W / 2, 1360);
          c.restore();
        }
      }} />
    </>
  );
};

export const LAYA_SCENES = { lh_hook: LhHook, lh_what: LhWhat, lh_kinds: LhKinds, lh_why: LhWhy, lh_try: LhTry, lh_honest: LhHonest, lh_cta: LhCta };
