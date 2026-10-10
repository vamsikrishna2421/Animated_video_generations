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
  label(c, "(real output, run by us)", x + w / 2, y + h - 26, 34, GREY, handF, p);
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
  label(c, "no", cx - rad - 44, cy + 6, 46, COL.pale, caveat, p);
  label(c, "yes", cx + rad + 50, cy + 6, 46, COL.green, caveat, p);
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
        answerCard(c, 560, 380, 460, 420, r, "refund request?", "YES · 94%", seg(f, 18, 28));
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
          label(c, "\"We were billed twice,", 130, 600, 58, INK, caveat, p, "left");
          label(c, "please refund.\"", 150, 660, 58, INK, caveat, p, "left");
          tag(c, "x 1,000 a day", 820, 530, 44, COL.yellow, INK, 0.04, seg(f, c1 + 8, c1 + 16));
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 730, 900, 210, r, p, "#fff6d8");
          label(c, "question (fixed answers)", 130, 790, 40, GREY, caveat, p, "left");
          label(c, "Is this a refund request?", W / 2, 856, 64, INK, caveat, p);
          tag(c, "YES", 420, 912, 44, COL.green, INK, 0, p);
          tag(c, "NO", 660, 912, 44, COL.pale, INK, 0, p);
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          meter(c, W / 2, 1210, 220, 0.94, r, seg(f, c3, c3 + 26));
          label(c, "94% sure it's a refund request", W / 2, 1296, 60, COL.yellow, caveat, seg(f, c3 + 16, c3 + 26));
          label(c, "real output (base model, run by us) · no reply written", W / 2, 1350, 36, COL.pale, handF, p);
        }
      }} />
    </>
  );
};

// ---------- 3 THREE KINDS OF QUESTIONS (real outputs from the base model) ----------
const LhKinds: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      {[c1, c2, c3].map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.4} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3300 + boil);
        hand(c, "3 kinds of questions", W / 2, 350, 80, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        label(c, "real outputs, run by us", W / 2, 400, 40, COL.cream, handF, seg(f, 8, 18));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 70, 430, 940, 290, r, p, COL.cream);
          tag(c, "PICK ONE", 210, 490, 44, COL.orange, "#fff", -0.03, p);
          label(c, "\"App crashes in settings\" → which team?", 110, 576, 46, INK, caveat, p, "left");
          [["billing", "2%"], ["tech support", "95%"], ["sales", "3%"]].forEach(([t, v], i) => {
            const q = seg(f, c1 + 6 + i * 3, c1 + 14 + i * 3);
            tag(c, `${t} ${v}`, 210 + i * 320, 668, 46, i === 1 ? COL.green : "#e5e7eb", INK, 0, q);
          });
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 70, 750, 940, 270, r, p, "#fff6d8");
          tag(c, "SCORE", 190, 810, 44, COL.light, "#fff", -0.03, p);
          label(c, "How urgent? (1 to 5)", 110, 898, 54, INK, caveat, p, "left");
          for (let i = 0; i < 5; i++) {
            const on = i === 1 && f >= c2 + 10;
            c.save(); c.globalAlpha = clamp(p * 1.5);
            c.beginPath(); c.arc(220 + i * 110, 966, 32, 0, 7); c.fillStyle = on ? COL.orange : "#e5e7eb"; c.fill();
            c.restore();
            label(c, String(i + 1), 220 + i * 110, 980, 42, on ? "#fff" : GREY, caveat, p);
          }
          label(c, "→ 2 (58%)", 760, 984, 56, COL.orange, caveat, seg(f, c2 + 10, c2 + 18), "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          card(c, 70, 1050, 940, 280, r, p, "#ecfdf5");
          tag(c, "YES / NO", 210, 1110, 44, GREEN, "#fff", -0.03, p);
          label(c, "\"Click this link to unlock...\" phishing?", 110, 1196, 46, INK, caveat, p, "left");
          c.save(); c.globalAlpha = clamp(p * 1.5); c.fillStyle = "#fff"; c.fillRect(160, 1230, 130, 76); c.restore();
          stroke(c, [[160, 1230], [225, 1272], [290, 1230]], COL.ink, 4, r, { passes: 1, alpha: 0.7 * p });
          stroke(c, [[320, 1200], [320, 1262], [340, 1286], [362, 1266]], GREY, 6, r, { passes: 2, alpha: p });
          stamp(c, "YES · 1.00", 700, 1278, 64, COL.red, seg(f, c3 + 10, c3 + 18), r, -0.05);
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
          c.save(); c.globalAlpha = clamp(p * 1.5);
          c.beginPath(); c.arc(230, 560, 105, 0, 7); c.fillStyle = COL.cream; c.fill();
          c.fillStyle = COL.cream; c.fillRect(210, 432, 40, 30);
          c.restore();
          stroke(c, circlePts(230, 560, 105, 105), COL.ink, 6, r, { passes: 2, alpha: p });
          const a = -Math.PI / 2 + seg(f, c1, c1 + 12) * 0.8;
          stroke(c, [[230, 560], [230 + Math.cos(a) * 80, 560 + Math.sin(a) * 80]], COL.red, 8, r, { passes: 2, alpha: p });
          label(c, "33 ms", 390, 580, 120, COL.yellow, caveat, p, "left");
          label(c, "a question on a cloud GPU (his page)", 396, 636, 36, COL.pale, handF, p, "left");
          label(c, "faster than a blink", 396, 684, 46, COL.cream, caveat, seg(f, c1 + 10, c1 + 20), "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 740, 900, 230, r, p, COL.cream);
          tag(c, "FREE", 230, 820, 64, COL.green, INK, -0.04, p);
          label(c, "open source (Apache-2.0)", 360, 832, 54, INK, caveat, p, "left");
          label(c, "on a 4-core CPU: 0.2 to 0.6 s per question (his page)", 130, 922, 38, GREY, handF, p, "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          card(c, 90, 1010, 430, 300, r, p, COL.cream);
          for (let i = 0; i < 5; i++) stroke(c, [[120, 1060 + i * 46], [480 - (i % 2) * 70, 1060 + i * 46]], "#94a3b8", 7, r, { passes: 1, alpha: p });
          stroke(c, [[110, 1030], [500, 1290]], COL.red, 10, r, { passes: 2, alpha: seg(f, c3 + 6, c3 + 12) });
          stroke(c, [[500, 1030], [110, 1290]], COL.red, 10, r, { passes: 2, alpha: seg(f, c3 + 8, c3 + 14) });
          card(c, 560, 1080, 430, 160, r, p, "#ecfdf5");
          label(c, "YES · 94%", 775, 1180, 76, GREEN, caveat, p);
          label(c, "can be wrong, can't ramble", W / 2, 1360, 52, COL.cream, caveat, seg(f, c3 + 12, c3 + 22));
        }
      }} />
    </>
  );
};

// ---------- 5 THE CATCH (from his own page) ----------
const LhHonest: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3600 + boil);
        hand(c, "the catch", W / 2, 345, 90, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        label(c, "(from his own page)", W / 2, 400, 44, COL.cream, caveat, seg(f, 6, 16));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          tag(c, "trained on spam: 99% right", 300, 462, 40, COL.green, INK, -0.03, p);
          label(c, "new business tasks (typed-decisions test):", 90, 530, 38, COL.pale, handF, seg(f, c1 + 10, c1 + 18), "left");
          bar(c, 90, 600, 640, 48, 0.36, COL.red, "out of the box", "36%", seg(f, c1 + 10, c1 + 24), r);
          bar(c, 90, 716, 640, 48, 0.77, COL.green, "after training (his reported number)", "77%", seg(f, c1 + 24, c1 + 38), r);
          const bx = 90 + 640 * 0.46, q = seg(f, c1 + 16, c1 + 26);
          c.save(); c.globalAlpha = clamp(q * 1.5); c.setLineDash([14, 12]); c.strokeStyle = COL.yellow; c.lineWidth = 5;
          c.beginPath(); c.moveTo(bx, 592); c.lineTo(bx, 654); c.moveTo(bx, 712); c.lineTo(bx, 772); c.stroke(); c.restore();
          label(c, "always guess the most common answer: 46%", bx - 200, 808, 36, COL.yellow, caveat, q, "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 840, 900, 130, r, p, COL.cream);
          label(c, "20+ answer options?", 130, 898, 52, INK, caveat, p, "left");
          label(c, "→ Jev (paid, by TypeSafe) does better", 300, 950, 44, COL.orange, caveat, p, "left");
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          label(c, "20-option test (random guess: 5%)", 90, 1030, 38, COL.pale, handF, p, "left");
          bar(c, 90, 1100, 640, 52, 0.71, COL.green, "English", "71%", seg(f, c3, c3 + 14), r);
          bar(c, 90, 1226, 640, 52, 0.22, COL.orange, "Telugu", "22%", seg(f, c3 + 6, c3 + 20), r);
          label(c, "about 1 in 5", 560, 1356, 50, COL.orange, caveat, seg(f, c3 + 18, c3 + 26), "left");
        }
      }} />
    </>
  );
};

// ---------- 6 VERDICT ----------
const LhVerdict: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const row = (c: Ctx, y: number, need: string, need2: string, pick: string, col: string, bg: string, p: number, r: () => number) => {
    if (!card(c, 70, y, 940, 230, r, p, bg)) return;
    label(c, need, 110, y + 70, 50, INK, caveat, p, "left");
    if (need2) label(c, need2, 110, y + 126, 50, INK, caveat, p, "left");
    label(c, pick, 970, y + 196, 70, col, caveat, p, "right");
  };
  return (
    <>
      {[c1, c2, c3].map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.4} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3650 + boil);
        hand(c, "so which one?", W / 2, 360, 90, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) row(c, 420, "English, a few options,", "examples to train it on?", "→ Laya", GREEN, "#ecfdf5", fade(f, c1, 10), r);
        if (f >= c2) row(c, 680, "many options,", "or no time to train?", "→ Jev (paid)", COL.orange, COL.cream, fade(f, c2, 10), r);
        if (f >= c3) row(c, 940, "Telugu?", "", "→ not yet", COL.red, "#fff6d8", fade(f, c3, 10), r);
      }} />
    </>
  );
};

// ---------- 7 TRY IT + CTA ----------
const CODE = [
  ["from laya import Router", COL.ink],
  ["msg = {\"body\": \"We were billed \"", COL.ink],
  ["               \"twice, please refund.\"}", COL.ink],
  ["q = {\"refund\": {\"type\": \"noul\",", COL.ink],
  ["     \"instructions\":", COL.ink],
  ["     \"Is this a refund request?\"}}", COL.ink],
  ["r = Router().predict(msg, q)", COL.ink],
  ["print(r[\"answers\"][\"refund\"][\"noul\"])", "#b45309"],
] as const;
const LhTry: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3700 + boil);
        hand(c, "developers: try it", W / 2, 340, 80, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 50, 380, 980, 110, r, p, "#0f172a");
          const cmd = "pip install laya";
          label(c, "$ " + cmd.slice(0, Math.round(cmd.length * seg(f, c1, c1 + 16))), 90, 456, 52, COL.green, mono, p, "left");
          card(c, 50, 520, 980, 590, r, p, COL.cream);
          const sz = fitSize(c, "               \"twice, please refund.\"}", 920, 36, mono);
          CODE.forEach(([t, col], i) => label(c, t, 80, 584 + i * 62, sz, col, mono, seg(f, c1 + 6 + i * 3, c1 + 14 + i * 3), "left"));
          tag(c, "noul = yes / no", 820, 548, 38, COL.yellow, INK, 0.03, seg(f, c1 + 20, c1 + 28));
          label(c, "→ 0.94", 820, 1086, 56, "#b45309", caveat, seg(f, c1 + 34, c1 + 42), "left");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          label(c, "not a coder? send this to whoever runs AI at your company", W / 2, 1168, fitSize(c, "not a coder? send this to whoever runs AI at your company", 960, 44, caveat), COL.cream, caveat, p);
        }
        if (f >= c3) {
          const p = fade(f, c3, 12);
          label(c, "github.com/NandhaKishorM/laya", W / 2, 1234, 46, COL.pale, mono, p);
          c.save(); c.globalAlpha = easeOut(p);
          c.font = caveat(handle.length > 16 ? 76 : 88); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1320);
          c.shadowBlur = 0; c.font = handF(44); c.fillStyle = COL.cream; c.fillText("free AI tools, explained simply", W / 2, 1376);
          c.restore();
        }
      }} />
    </>
  );
};

export const LAYA_SCENES = { lh_hook: LhHook, lh_what: LhWhat, lh_kinds: LhKinds, lh_why: LhWhy, lh_honest: LhHonest, lh_verdict: LhVerdict, lh_try: LhTry };
