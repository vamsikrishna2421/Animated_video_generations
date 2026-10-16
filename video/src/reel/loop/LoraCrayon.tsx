import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade, arrow } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx, robot, RobotOpts } from "./DistillCrayon";
import { INK, GREY, caveat, handF, label, stamp, card } from "./WordsCrayon";
import { group, wrap, bubble, crown } from "./MannersCrayon";

// EP31 "Teach an AI a new skill without a supercomputer" (LoRA), crayon style. The demo is real (our run, numbers in
// s.data.n from pipeline/ep31/lora_demo.py): SmolLM2-360M-Instruct, zero-shot vs. LoRA-trained on synthetic WhatsApp
// orders, scored on unseen orders. Content band: y 270..1400.
type Line = { from: number; frames: number; words?: { w: string; from: number; to: number }[] };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Nums = { before: number; after: number; test: number; minutes: number; pct: string; adapterMB: string; modelMB: string; params: string };

const STUDENT: RobotOpts = { body: COL.light, accent: COL.yellow };
const WA_GREEN = "#d9fdd3";
const nums = (s: Scene): Nums => s.data.n;

// A paper order slip filled from the model's JSON (rows appear one by one with p 0..1)
const orderSlip = (c: Ctx, x: number, y: number, w: number, slip: { name: string; phone: string; items: string[]; address: string }, p: number, r: () => number) => {
  if (!card(c, x, y, w, 420 + slip.items.length * 46, r, seg(p, 0, 0.15), "#fffdf4")) return;
  label(c, "ORDER SLIP", x + w / 2, y + 62, 54, INK, caveat, seg(p, 0.05, 0.2));
  stroke(c, [[x + 30, y + 84], [x + w - 30, y + 84]], INK, 3, r, { passes: 1, alpha: 0.5 });
  const rows: [string, string][] = [["Name", slip.name], ["Phone", slip.phone], ...slip.items.map((t, i) => [i === 0 ? "Items" : "", t] as [string, string]), ["Address", slip.address]];
  rows.forEach(([k, v], i) => {
    const q = seg(p, 0.15 + i * 0.12, 0.27 + i * 0.12);
    if (q <= 0) return;
    c.save(); c.globalAlpha = q;
    c.font = handF(36); c.fillStyle = GREY; c.textAlign = "left"; c.fillText(k, x + 30, y + 140 + i * 58);
    c.font = handF(40); c.fillStyle = INK;
    const lines = wrap(c, v, w - 210);
    c.fillText(lines[0] + (lines.length > 1 ? "…" : ""), x + 190, y + 140 + i * 58);
    c.restore();
  });
};

const laptop = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number, screen?: (o: Ctx) => void) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(s * k, s * k);
  c.fillStyle = "#1f2937"; rrect(c, -220, -150, 440, 280, 18); c.fill();
  c.fillStyle = "#0b1020"; rrect(c, -200, -132, 400, 244, 10); c.fill();
  if (screen) { c.save(); c.beginPath(); rrect(c, -200, -132, 400, 244, 10); c.clip(); screen(c); c.restore(); }
  c.fillStyle = "#374151"; c.beginPath(); c.moveTo(-260, 130); c.lineTo(260, 130); c.lineTo(290, 162); c.lineTo(-290, 162); c.closePath(); c.fill();
  stroke(c, [[-260, 130], [260, 130], [290, 162], [-290, 162], [-260, 130]], COL.cream, 3, r, { passes: 1, alpha: 0.5 });
  c.restore();
};

const stopwatch = (c: Ctx, x: number, y: number, rad: number, frac: number, txt: string, r: () => number, p: number) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p * 1.5);
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = COL.cream; c.fill();
  stroke(c, circlePts(x, y, rad, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, 50), COL.orange, 14, r, { passes: 2 });
  c.fillStyle = INK; c.fillRect(x - 14, y - rad - 30, 28, 22);
  label(c, txt, x, y + 22, rad * 0.7, INK, caveat);
  c.restore();
};

// A thick "book" of numbers with a padlock (frozen) and sticky notes stuck to it
const book = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, p: number, frozen: number, notes: number) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p * 1.4);
  c.fillStyle = "#1e3a8a"; rrect(c, x, y, w, h, 18); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x + 26, y + 20, w - 46, h - 40, 10); c.fill();
  c.font = handF(26); c.fillStyle = "#94a3b8";
  const rr = rng(77);
  for (let i = 0; i < 9; i++) {
    let line = "";
    for (let j = 0; j < 9; j++) line += (rr() * 2 - 1).toFixed(2).replace("0.", ".") + " ";
    c.fillText(line, x + 44, y + 64 + i * ((h - 90) / 9));
  }
  if (frozen > 0) {   // ice tint + padlock
    c.save(); c.globalAlpha = 0.35 * frozen; c.fillStyle = "#bae6fd"; rrect(c, x, y, w, h, 18); c.fill(); c.restore();
    const lx = x + w - 40, ly = y + 40, k = easeOut(frozen);
    c.save(); c.translate(lx, ly); c.scale(k, k);
    c.strokeStyle = "#475569"; c.lineWidth = 10; c.beginPath(); c.arc(0, -18, 26, Math.PI, 0); c.stroke();
    c.fillStyle = COL.yellow; rrect(c, -40, -18, 80, 64, 10); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(0, 8, 8, 0, 7); c.fill();
    c.restore();
  }
  const spots = [[0.12, 0.18], [0.55, 0.32], [0.25, 0.62], [0.68, 0.74]];
  spots.forEach(([u, v], i) => {
    const q = seg(notes, i * 0.2, i * 0.2 + 0.3);
    if (q <= 0) return;
    const k = easeOut(q);
    c.save(); c.translate(x + u * w, y + v * h); c.rotate((i % 2 ? 1 : -1) * 0.08); c.scale(k, k);
    c.fillStyle = "rgba(4,8,40,0.3)"; c.fillRect(-56, -40, 120, 92);
    c.fillStyle = "#fde047"; c.fillRect(-60, -46, 120, 92);
    stroke(c, [[-40, -10], [40, -14]], "#a16207", 4, r, { passes: 1, alpha: 0.8 });
    stroke(c, [[-40, 14], [24, 12]], "#a16207", 4, r, { passes: 1, alpha: 0.8 });
    c.restore();
  });
  c.restore();
};

const fileIcon = (c: Ctx, x: number, y: number, w: number, h: number, col: string, title: string, sub: string, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y + h); c.scale(k, k); c.translate(0, -h);
  c.fillStyle = col; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2 - 30, 0); c.lineTo(w / 2, 30); c.lineTo(w / 2, h); c.lineTo(-w / 2, h); c.closePath(); c.fill();
  stroke(c, [[-w / 2, 0], [w / 2 - 30, 0], [w / 2, 30], [w / 2, h], [-w / 2, h], [-w / 2, 0]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.restore();
  label(c, title, x, y + h + 62, 56, COL.cream, caveat, p);
  label(c, sub, x, y + h + 112, 40, COL.pale, handF, p);
};

// ---------- 1 HOOK: the order it couldn't read, then the slip it writes after N minutes of LoRA ----------
const LoHook: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const d = s.data;
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.8} />
      <Sfx at={0} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c1} src="audio/gag_bonk.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.45} />
      {[0, 1, 2, 3, 4, 5].map((k) => <Sfx key={k} at={c2 + 10 + k * 6} src="audio/sfx_tick.wav" vol={0.3} />)}
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={c3} src="audio/sfx_snap.wav" vol={0.55} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(4000 + boil);
        tag(c, "a small free AI · run by us", W / 2, 318, 50, COL.cream, INK, -0.02, 1);
        // [0] the WhatsApp order and the model's real "before" reply; [1] 0 / 30
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          const yb = bubble(o, d.order, 200, 372, 820, "me", 1, r, { size: 44, bg: WA_GREEN });
          robot(o, 170, yb + 250, 0.6, boil, 1, { ...STUDENT, arms: "down", mouth: "o", eyes: "wide" });
          bubble(o, "", 300, yb + 70, 720, "ai", seg(f, 4, 10), r, { size: 38, lines: d.beforeLines, typed: seg(f, 6, 40), bg: "#e5e7eb", fg: "#475569" });
          if (f >= c1) stamp(o, `${n.before} / ${n.test} usable`, W / 2, 1270, 92, COL.red, fade(f, c1, 8), r, -0.06);
        });
        // [2] N minutes on a laptop, no GPU
        if (f >= c2 - 4 && f < c3 + 4) {
          group(c, fade(f, c2 - 4, 8) * (1 - fade(f, c3 - 4, 8)), (o) => {
            laptop(o, W / 2, 820, 1.55, r, seg(f, c2, c2 + 10), (sc) => {
              sc.font = handF(30); sc.fillStyle = "#86efac"; sc.textAlign = "left";
              const steps = Math.min(8, Math.floor((f - c2) / 5));
              for (let i = 0; i < steps; i++) sc.fillText(`step ${(i + 1) * 15}  loss ${(0.9 / (i + 1.4)).toFixed(3)}`, -180, -96 + i * 28);
            });
            stopwatch(o, 820, 470, 110, seg(f, c2 + 6, c3 - 6), `${n.minutes} min`, r, seg(f, c2 + 4, c2 + 12));
            tag(o, "4 CPU cores · no GPU", W / 2, 1180, 56, COL.yellow, INK, -0.03, seg(f, c2 + 14, c2 + 22));
          });
        }
        // [3] the slip it writes now, n.after / n.test
        if (f >= c3 - 4) {
          group(c, fade(f, c3 - 4, 8), (o) => {
            bubble(o, d.order, 200, 372, 820, "me", 1, r, { size: 36, bg: WA_GREEN });
            orderSlip(o, 150, 640, 780, d.slip, seg(f, c3, c3 + 40), r);
            stamp(o, `${n.after} / ${n.test}`, 840, 1300, 120, "#16a34a", fade(f, c3 + 30, 8), r, -0.1);
          });
        }
      }} />
    </>
  );
};

// ---------- 2 WHY IT'S HARD: change every number; big models need racks of chips ----------
const LoHard: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.6} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4100 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "normal training changes EVERY number", W / 2, 350, 56, COL.cream, seg(f, -6, 10), r, -0.02, "center");
          const total = 14 * 10, shown = Math.floor(total * easeOut(seg(f, 4, 40)));
          for (let i = 0; i < shown; i++) {
            const gx = 120 + (i % 14) * 60, gy = 430 + Math.floor(i / 14) * 60;
            o.fillStyle = i % 7 === 0 ? COL.orangeLight : COL.pale; o.fillRect(gx, gy, 50, 50);
          }
          tag(o, `ours: about ${n.params} numbers`, W / 2, 1100, 56, COL.yellow, INK, -0.02, seg(f, 20, 30));
          label(o, "the big ones: hundreds of billions", W / 2, 1230, 52, COL.cream, handF, seg(f, 34, 46));
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            for (let k = 0; k < 3; k++) {   // a rack of GPU boxes
              const x = 200 + k * 240, y = 470;
              o.fillStyle = "#111827"; rrect(o, x, y, 200, 520, 16); o.fill();
              for (let j = 0; j < 6; j++) {
                const on = seg(f, c1 + 4 + (k * 6 + j) * 1.5, c1 + 8 + (k * 6 + j) * 1.5);
                o.fillStyle = on > 0 ? "#22c55e" : "#374151"; rrect(o, x + 20, y + 24 + j * 82, 160, 60, 8); o.fill();
                o.fillStyle = "#0b1020"; o.fillRect(x + 36, y + 44 + j * 82, 90, 20);
              }
            }
            hand(o, "servers full of AI chips", W / 2, 370, 60, COL.yellow, seg(f, c1, c1 + 14), r, -0.02, "center");
            if (f >= c2) tag(o, "a 7B model: 100+ GB of chip memory to train", W / 2, 1150, 48, COL.cream, INK, 0.02, seg(f, c2, c2 + 10));
          });
        }
      }} />
    </>
  );
};

// ---------- 3 THE TRICK: freeze the book, add sticky notes, train only the notes ----------
const LoTrick: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={20} src="audio/sfx_tick.wav" vol={0.4} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c1 + 6 + k * 8} src="audio/sfx_pop.wav" vol={0.3} />)}
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4200 + boil);
        tag(c, "LoRA", W / 2, 330, 72, COL.yellow, INK, -0.03, seg(f, -6, 4));
        group(c, 1 - fade(f, c3 - 4, 8), (o) => {
          hand(o, f < c1 ? "1. freeze the original" : "2. add sticky notes, train only them", W / 2, 440, 54, COL.cream, f < c1 ? seg(f, -4, 10) : seg(f, c1, c1 + 14), r, -0.02, "center");
          book(o, 140, 500, 800, 560, r, seg(f, -6, 6), seg(f, 14, 26), seg(f, c1 + 4, c1 + 40));
          if (f >= c2) {
            stamp(o, `${n.pct}% of the numbers`, W / 2, 1200, 88, "#16a34a", fade(f, c2, 8), r, -0.05);
          }
        });
        if (f >= c3 - 4) {
          group(c, fade(f, c3 - 4, 8), (o) => {
            hand(o, "the new skill = a small file", W / 2, 440, 56, COL.cream, seg(f, c3, c3 + 14), r, -0.02, "center");
            const big = 560, k = Math.sqrt(parseFloat(n.adapterMB) / parseFloat(n.modelMB));   // areas to scale
            fileIcon(o, 300, 560 + big * (1 - k), 300 * k, big * k, "#fde047", `${n.adapterMB} MB`, "the skill", r, seg(f, c3 + 6, c3 + 16));
            fileIcon(o, 700, 560, 300, big, "#93c5fd", `${n.modelMB} MB`, "the model", r, seg(f, c3 + 12, c3 + 22));
          });
        }
      }} />
    </>
  );
};

// ---------- 4 SWAP: one model, many skill files ----------
const LoSwap: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1);
  const skills = ["orders", "shop's tone", "quizzes from notes"];
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={12 + k * 22} src="audio/sfx_whoosh.wav" vol={0.3} />)}
      <Sfx at={c1} src="audio/sfx_success.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4300 + boil);
        hand(c, "one model, many skill files", W / 2, 360, 60, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        robot(c, W / 2, 1060, 1.0, boil, 3, { ...STUDENT, arms: "up", mouth: "grin", eyes: "happy" });
        const active = Math.min(2, Math.floor(Math.max(0, f - 12) / 22));
        skills.forEach((t, i) => {
          const x = 200 + i * 340, inSlot = i === active;
          const y = inSlot ? lerp(520, 720, easeOut(seg(f, 12 + i * 22, 22 + i * 22))) : 520;
          c.save(); c.translate(x, y); c.rotate((i - 1) * 0.06);
          c.fillStyle = inSlot ? "#fde047" : "#fef9c3"; c.fillRect(-130, -60, 260, 120);
          c.restore();
          label(c, t, x, y + 14, 46, INK, caveat, 1);
        });
        if (f >= c1) tag(c, "swap in a second", W / 2, 1300, 56, COL.cream, INK, 0.02, seg(f, c1, c1 + 10));
      }} />
    </>
  );
};

// ---------- 5 QUIZ: prices change every week; LoRA or hand it the list? ----------
const LoQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={c3 + 4 + k * 13} src="audio/sfx_tick.wav" vol={0.38} />)}
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.7} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={c4} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4400 + boil);
        hand(c, "YOUR TURN", W / 2, 350, 100, COL.yellow, seg(f, -8, 6), r, -0.03, "center");
        tag(c, "your shop's prices change every week", W / 2, 455, 46, COL.cream, INK, -0.02, seg(f, 6, 14));
        const ans = f >= c2;
        const drawCard = (x: number, L: string, lines: string[], p: number, bg: string) => {
          if (!card(c, x, 520, 440, 430, r, p, bg)) return;
          label(c, L, x + 50, 600, 80, GREY, caveat, p);
          c.save(); c.font = handF(44); c.fillStyle = INK; lines.forEach((t, i) => c.fillText(t, x + 40, 690 + i * 60)); c.restore();
        };
        drawCard(70, "A", ["Train a LoRA", "on this week's", "price list"], seg(f, c1, c1 + 10), ans ? "#fee2e2" : COL.cream);
        drawCard(570, "B", ["Hand it the", "price list with", "every question"], seg(f, c1 + 8, c1 + 18), ans ? "#dcfce7" : COL.cream);
        if (f >= c3 && !ans) {
          const q = seg(f, c3 + 2, c2);
          c.save(); c.globalAlpha = 0.85; c.beginPath(); c.arc(W / 2, 1110, 92, 0, 7); c.fillStyle = COL.navy; c.fill(); c.restore();
          stroke(c, circlePts(W / 2, 1110, 92, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 60), COL.yellow, 12, r, { passes: 2 });
          label(c, String(3 - Math.min(2, Math.floor(q * 3))), W / 2, 1156, 130, COL.yellow, caveat);
        }
        if (ans) {
          crown(c, 790, 490, 1.2, r, seg(f, c2, c2 + 8));
          tag(c, "old prices baked in", 290, 1010, 50, COL.red, INK, 0.03, seg(f, c2 + 10, c2 + 18));
          tag(c, "always this week's", 790, 1010, 50, "#4ade80", INK, -0.03, seg(f, c2 + 4, c2 + 12));
        }
        if (f >= c4) {
          hand(c, "skills & style: LoRA", W / 2, 1190, 62, COL.yellow, seg(f, c4, c4 + 12), r, -0.02, "center");
          hand(c, "facts that change: give them each time", W / 2, 1290, 54, COL.cream, seg(f, c4 + 14, c4 + 28), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 6 IT'S REAL: phones, image styles, a 65B model on one GPU ----------
const LoReal: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.65} />
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(4500 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {   // a phone with small adapter cards
          o.fillStyle = "#0b1020"; rrect(o, 340, 420, 400, 760, 50); o.fill();
          stroke(o, rrectPts(340, 420, 400, 760), COL.cream, 6, r, { passes: 2, alpha: 0.8 });
          ["summaries", "writing tools", "replies"].forEach((t, i) => {
            const q = seg(f, 6 + i * 6, 14 + i * 6);
            o.save(); o.globalAlpha = q; o.fillStyle = "#fde047"; o.fillRect(390, 520 + i * 160, 300, 110); o.restore();
            label(o, t, 540, 590 + i * 160, 46, INK, caveat, q);
          });
          tag(o, "Apple: a small adapter per feature", W / 2, 1290, 48, COL.cream, INK, -0.02, seg(f, 10, 20));
        });
        if (f >= c1 - 4 && f < c2 + 4) {
          group(c, fade(f, c1 - 4, 8) * (1 - fade(f, c2 - 4, 8)), (o) => {   // image styles as small files
            ["#f472b6", "#60a5fa", "#facc15", "#34d399"].forEach((col, i) => {
              const q = seg(f, c1 + 2 + i * 4, c1 + 10 + i * 4);
              if (!card(o, 110 + (i % 2) * 440, 440 + Math.floor(i / 2) * 400, 420, 360, r, q, col)) return;
            });
            hand(o, "image AIs learn a style from a small file", W / 2, 360, 50, COL.yellow, seg(f, c1, c1 + 14), r, -0.02, "center");
          });
        }
        if (f >= c2 - 4) {
          group(c, fade(f, c2 - 4, 8), (o) => {
            o.fillStyle = "#111827"; rrect(o, 240, 600, 600, 300, 30); o.fill();
            o.fillStyle = "#22c55e"; for (let i = 0; i < 8; i++) o.fillRect(290 + i * 64, 640, 40, 220);
            label(o, "1 GPU", W / 2, 990, 90, COL.cream, caveat, seg(f, c2 + 4, c2 + 12));
            stamp(o, "65B model, fine-tuned", W / 2, 470, 76, COL.yellow, fade(f, c2 + 8, 8), r, -0.04);
            tag(o, "QLoRA (Dettmers et al., 2023)", W / 2, 1120, 46, COL.cream, INK, 0.02, seg(f, c2 + 14, c2 + 24));
          });
        }
      }} />
    </>
  );
};

// ---------- 7 CLOSE: prompt first, look facts up, LoRA for skills; next; follow ----------
const LoClose: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2);
  const steps = ["try a good prompt", "facts that change? give them each time", "a skill or a style? a small LoRA"];
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.35} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={8 + k * 16} src="audio/sfx_pop.wav" vol={0.35} />)}
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.3} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4600 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "before you train anything:", W / 2, 360, 62, COL.cream, seg(f, -6, 8), r, -0.02, "center");
          steps.forEach((t, i) => {
            const q = seg(f, 8 + i * 16, 18 + i * 16);
            if (!card(o, 110, 450 + i * 250, 860, 200, r, q, i === 2 ? "#fde047" : COL.cream)) return;
            label(o, String(i + 1), 180, 575 + i * 250, 90, GREY, caveat, q);
            label(o, t, 590, 568 + i * 250, t.length > 30 ? 44 : 50, INK, caveat, q);
          });
          stamp(o, `ours: ${n.minutes} min · ${n.adapterMB} MB`, W / 2, 1290, 66, "#16a34a", fade(f, 64, 8), r, -0.04);
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            hand(o, "NEXT:", W / 2, 560, 80, COL.orangeLight, seg(f, c1 - 2, c1 + 8), r, -0.02, "center");
            hand(o, "how AI finds the right page", W / 2, 690, 66, COL.cream, seg(f, c1 + 2, c1 + 16), r, -0.02, "center");
            hand(o, "in your documents", W / 2, 790, 66, COL.yellow, seg(f, c1 + 10, c1 + 24), r, -0.02, "center");
          });
        }
        if (f >= c2) {
          const hp = easeOut(fade(f, c2, 12));
          c.save(); c.globalAlpha = hp;
          c.font = caveat(handle.length > 16 ? 84 : 98); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1040);
          c.shadowBlur = 0; c.font = handF(58); c.fillStyle = COL.cream; c.fillText("Follow for the next episode", W / 2, 1125);
          c.restore();
        }
      }} />
    </>
  );
};

export const LORA_SCENES = {
  lo_hook: LoHook, lo_hard: LoHard, lo_trick: LoTrick, lo_swap: LoSwap, lo_quiz: LoQuiz, lo_real: LoReal, lo_close: LoClose,
};
void arrow;
