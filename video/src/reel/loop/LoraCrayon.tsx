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
type Nums = { before: number; after: number; test: number; train: number; minutes: number; pct: string; adapterMB: string; modelMB: string; params: string; miss: string; fewShot?: number };

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

const fileIcon = (c: Ctx, x: number, y: number, w: number, h: number, col: string, title: string, sub: string, r: () => number, p: number, sub2?: string) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y + h); c.scale(k, k); c.translate(0, -h);
  const e = Math.min(30, w * 0.3);   // the folded corner
  c.fillStyle = col; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2 - e, 0); c.lineTo(w / 2, e); c.lineTo(w / 2, h); c.lineTo(-w / 2, h); c.closePath(); c.fill();
  stroke(c, [[-w / 2, 0], [w / 2 - e, 0], [w / 2, e], [w / 2, h], [-w / 2, h], [-w / 2, 0]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.restore();
  label(c, title, x, y + h + 62, 56, COL.cream, caveat, p);
  label(c, sub, x, y + h + 112, 40, COL.pale, handF, p);
  if (sub2) label(c, sub2, x, y + h + 160, 38, COL.yellow, handF, p);
};

// The frame (scene-relative) where a caption word is spoken: the first match at or after `after`
const wordAt = (s: Scene, re: RegExp, after = 0, fallback = 0) => {
  const w = (s.lines[0]?.words ?? []).find((x) => x.from >= after && re.test(x.w.replace(/[^\w%.]/g, "")));
  return w ? w.from : fallback;
};

// ---------- 1 HOOK: plain prompt 0/30 (it copies the order back), two examples 16/30, LoRA 27/30: a scoreboard ----------
const LoHook: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const d = s.data;
  const copied = Math.min(c1 - 6, 46);   // the reply has typed out: stamp it
  const mins = wordAt(s, /^minutes$/i, c3, c3 + 60);   // "14 minutes": the stopwatch lands on the word
  const tick = Math.max(4, (mins - c3 - 12) / 6);
  const rows: { label: string; v: number; at: number; col: string }[] = [
    { label: "plain prompt", v: n.before, at: c1, col: COL.red },
    { label: "prompt + 2 examples", v: n.fewShot ?? 0, at: c2, col: COL.orange },
    { label: `LoRA, ${n.minutes} min`, v: n.after, at: c4, col: "#16a34a" },
  ];
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.8} />
      <Sfx at={0} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={copied} src="audio/gag_bonk.wav" vol={0.4} />
      <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.45} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.45} />
      {[0, 1, 2, 3, 4, 5].map((k) => <Sfx key={k} at={Math.round(c3 + 8 + k * tick)} src="audio/sfx_tick.wav" vol={0.28} />)}
      <Sfx at={mins} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c4} src="reel/sfx_boom.wav" vol={0.75} />
      <Sfx at={c4} src="audio/sfx_snap.wav" vol={0.55} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(4000 + boil);
        tag(c, "SmolLM2-360M by Hugging Face · tested by us", W / 2, 318, 42, COL.cream, INK, -0.02, 1);
        // [0]-[2] our prompt, a WhatsApp order and the model's real reply (the order copied back)
        group(c, 1 - fade(f, c3 - 4, 8), (o) => {
          label(o, "our prompt: “Turn this WhatsApp order into an order slip:", W / 2, 394, 37, COL.cream, handF, 1);
          label(o, "JSON with name, phone, items (item, qty) and address.”", W / 2, 438, 37, COL.cream, handF, 1);
          const yb = bubble(o, d.order, 160, 464, 860, "me", 1, r, { size: 40, bg: WA_GREEN });
          bubble(o, "", 60, yb + 34, 860, "ai", seg(f, 4, 10), r, { size: 38, lines: d.beforeLines, typed: seg(f, 6, copied - 2), bg: "#e5e7eb", fg: "#475569" });
          if (f >= copied) stamp(o, "COPIED BACK", W / 2, 918, 58, COL.red, fade(f, copied, 6), r, -0.05);
        });
        // [3] training: the real log, a stopwatch landing on "minutes"
        if (f >= c3 - 4 && f < c4 + 4) {
          group(c, fade(f, c3 - 4, 8) * (1 - fade(f, c4 - 4, 8)), (o) => {
            o.fillStyle = "#0b1020"; rrect(o, 110, 400, 620, 420, 22); o.fill();
            stroke(o, rrectPts(110, 400, 620, 420), COL.cream, 4, r, { passes: 1, alpha: 0.6 });
            o.font = handF(42); o.textAlign = "left";
            const L: [number, number][] = d.losses;
            const k = Math.min(L.length, Math.floor(seg(f, c3 + 6, mins) * L.length + 0.001));
            const first = Math.max(0, k - 6);
            o.fillStyle = COL.pale; o.fillText("training: error going down", 150, 462);
            o.fillStyle = "#86efac";
            for (let i = first; i < k; i++) o.fillText(`step ${L[i][0]}   error ${L[i][1].toFixed(3)}`, 150, 522 + (i - first) * 50);
            stopwatch(o, 880, 560, 120, seg(f, c3 + 6, mins), `${n.minutes} min`, r, seg(f, c3 + 4, c3 + 12));
            tag(o, "trained on 4 CPU cores · no graphics card", W / 2, 890, 48, COL.yellow, INK, -0.02, seg(f, c3 + 10, c3 + 18));
          });
        }
        // [4] the slip it writes now
        if (f >= c4 - 4) {
          group(c, fade(f, c4 - 4, 8), (o) => {
            orderSlip(o, 180, 372, 720, d.slip, seg(f, c4, c4 + 30), r);
          });
        }
        // the scoreboard: perfect slips out of 30 new orders
        if (f >= c1 - 2) {
          const a0 = fade(f, c1 - 2, 6);
          c.save(); c.globalAlpha = a0;
          label(c, `perfect slips, out of ${n.test} new orders`, W / 2, 982, 42, COL.cream, handF, 1);
          c.restore();
          rows.forEach((row, i) => {
            if (f < row.at - 2) return;
            const q = fade(f, row.at - 2, 6), y = 1030 + i * 90;
            c.save(); c.globalAlpha = q;
            c.font = caveat(46); c.fillStyle = i === 2 ? COL.yellow : COL.cream; c.textAlign = "right"; c.fillText(row.label, 450, y + 44);
            c.fillStyle = "rgba(255,255,255,0.12)"; rrect(c, 470, y, 500, 64, 12); c.fill();
            const wv = 500 * (row.v / n.test) * easeOut(seg(f, row.at, row.at + 12));
            if (wv > 2) { c.fillStyle = row.col; rrect(c, 470, y, wv, 64, 12); c.fill(); }
            c.font = caveat(60); c.fillStyle = COL.cream; c.textAlign = "left";
            c.fillText(String(row.v), 480 + Math.max(wv, 0) + 6, y + 52);
            c.restore();
          });
          if (f >= c4 + 12) {
            tag(c, n.miss, W / 2, 1318, 44, COL.cream, INK, -0.01, seg(f, c4 + 12, c4 + 18));
            c.save(); c.globalAlpha = fade(f, c4 + 18, 8);
            label(c, "made-up orders · real chats are messier", W / 2, 1394, 44, COL.yellow, caveat, 1);
            c.restore();
          }
        }
      }} />
    </>
  );
};

// ---------- 3 WHY TRAINING IS HEAVY: every number changes; every skill = a whole new copy ----------
const LoHard: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={c1 + 6 + k * 8} src="reel/sfx_boom.wav" vol={0.32} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4100 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "normal training changes EVERY number", W / 2, 350, 56, COL.cream, seg(f, -6, 10), r, -0.02, "center");
          const total = 14 * 10, shown = Math.floor(total * easeOut(seg(f, 4, 30)));
          const rr = rng(Math.floor(f / 3));   // every number keeps changing
          for (let i = 0; i < shown; i++) {
            const gx = 120 + (i % 14) * 60, gy = 430 + Math.floor(i / 14) * 60;
            o.fillStyle = f > 30 && rr() < 0.5 ? COL.orangeLight : COL.pale; o.fillRect(gx, gy, 50, 50);
          }
          tag(o, `${n.params} numbers: every one changes`, W / 2, 1130, 54, COL.yellow, INK, -0.02, seg(f, 18, 28));
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            hand(o, "every new skill = a whole new copy", W / 2, 370, 56, COL.cream, seg(f, c1, c1 + 12), r, -0.02, "center");
            ["orders", "replies", "summaries"].forEach((t, k) => {
              const q = seg(f, c1 + 6 + k * 8, c1 + 14 + k * 8);
              fileIcon(o, 230 + k * 310, 470, 230, 430, "#93c5fd", `${n.modelMB} MB`, t, r, q);
            });
            tag(o, "heavy to train, heavy to store", W / 2, 1230, 50, COL.yellow, INK, 0.02, seg(f, c1 + 30, c1 + 38));
          });
        }
      }} />
    </>
  );
};

// ---------- 4 THE TRICK: freeze the book, add sticky notes, train only the notes; a small file per skill; Apple ----------
const LoTrick: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const pct = wordAt(s, /^notes$/i, c1 + 20, c1 + 70) + 12;   // "...train only the notes": the 1.2% stamp
  const feats = ["summaries", "writing tools", "replies"];
  return (
    <>
      <Sfx at={0} src="audio/sfx_whoosh.wav" vol={0.45} />
      <Sfx at={4} src="audio/sfx_snap.wav" vol={0.4} />
      <Sfx at={20} src="audio/sfx_tick.wav" vol={0.4} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c1 + 6 + k * 8} src="audio/sfx_pop.wav" vol={0.3} />)}
      <Sfx at={pct} src="audio/sfx_snap.wav" vol={0.45} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.45} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.4} />
      {[0, 1, 2].map((k) => <Sfx key={"f" + k} at={c3 + 10 + k * 10} src="audio/sfx_pop.wav" vol={0.32} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4200 + boil);
        if (f < c3 + 4) tag(c, "the trick: LoRA", W / 2, 330, 64, COL.yellow, INK, -0.03, seg(f, -6, 4) * (1 - fade(f, c3 - 4, 8)));
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          hand(o, f < c1 ? "1. freeze the original" : "2. stick on notes, train only the notes", W / 2, 440, 54, COL.cream, f < c1 ? seg(f, -4, 10) : seg(f, c1, c1 + 14), r, -0.02, "center");
          book(o, 140, 500, 800, 560, r, seg(f, -6, 6), seg(f, 14, 26), seg(f, c1 + 4, c1 + 40));
          if (f >= pct) stamp(o, `the notes: ${n.pct}% of the numbers`, W / 2, 1200, 60, COL.yellow, fade(f, pct, 8), r, -0.04);
        });
        if (f >= c2 - 4 && f < c3 + 4) {
          group(c, fade(f, c2 - 4, 8) * (1 - fade(f, c3 - 4, 8)), (o) => {
            hand(o, "each skill = its own small file", W / 2, 440, 56, COL.cream, seg(f, c2, c2 + 14), r, -0.02, "center");
            const big = 560, k = Math.sqrt(parseFloat(n.adapterMB) / parseFloat(n.modelMB));   // areas to scale
            fileIcon(o, 290, 540 + big * (1 - k), 300 * k, big * k, "#fde047", `${n.adapterMB} MB`, "the notes", r, seg(f, c2 + 6, c2 + 16), "≈ a short WhatsApp video");
            fileIcon(o, 740, 540, 300, big, "#93c5fd", `${n.modelMB} MB`, "the model", r, seg(f, c2 + 12, c2 + 22), "≈ a movie");
          });
        }
        if (f >= c3 - 4) {
          group(c, fade(f, c3 - 4, 8), (o) => {   // Apple: one model, a small skill file per feature
            hand(o, "Apple: one model, many skill files", W / 2, 360, 58, COL.yellow, seg(f, c3 - 2, c3 + 10), r, -0.02, "center");
            o.fillStyle = "#0b1020"; rrect(o, 300, 430, 480, 780, 54); o.fill();
            stroke(o, rrectPts(300, 430, 480, 780), COL.cream, 6, r, { passes: 2, alpha: 0.8 });
            feats.forEach((t, i) => {
              const q = seg(f, c3 + 8 + i * 10, c3 + 16 + i * 10);
              o.save(); o.globalAlpha = q; o.fillStyle = "#fde047"; o.fillRect(350, 520 + i * 180, 380, 130); o.restore();
              label(o, t, 540, 600 + i * 180, 58, INK, caveat, q);
            });
            tag(o, "Apple Machine Learning Research, 2024", W / 2, 1290, 40, COL.cream, INK, -0.02, seg(f, c3 + 30, c3 + 40));
          });
        }
      }} />
    </>
  );
};

// ---------- 5 QUIZ: prices change every week; LoRA or hand it the list? ----------
const LoQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = c2 + 45;   // the rule shows under the answer
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={Math.round(c3 + 4 + k * Math.max(10, (c2 - c3 - 16) / 3))} src="audio/sfx_tick.wav" vol={0.38} />)}
      <Sfx at={c2 - 8} src="audio/sfx_snap.wav" vol={0.6} />
      <Sfx at={c2 - 8} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c4} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4400 + boil);
        hand(c, "YOUR TURN", W / 2, 350, 100, COL.yellow, seg(f, -8, 6), r, -0.03, "center");
        tag(c, "your shop's prices change every week", W / 2, 455, 46, COL.cream, INK, -0.02, seg(f, 6, 14));
        const ans = f >= c2 - 8;   // the reveal hits just before the voice says the answer
        const drawCard = (x: number, L: string, lines: string[], p: number, bg: string) => {
          if (!card(c, x, 520, 440, 430, r, p, bg)) return;
          label(c, L, x + 50, 600, 80, GREY, caveat, p);
          c.save(); c.font = handF(44); c.fillStyle = INK; lines.forEach((t, i) => c.fillText(t, x + 40, 690 + i * 60)); c.restore();
        };
        drawCard(70, "A", ["Train LoRA notes", "on this week's", "prices"], seg(f, c1, c1 + 10), ans ? "#fee2e2" : COL.cream);
        drawCard(570, "B", ["Give it the", "price list with", "every question"], seg(f, c1 + 8, c1 + 18), ans ? "#dcfce7" : COL.cream);
        if (f >= c3 && !ans) {
          const q = seg(f, c3 + 2, c2);
          c.save(); c.globalAlpha = 0.85; c.beginPath(); c.arc(W / 2, 1110, 92, 0, 7); c.fillStyle = COL.navy; c.fill(); c.restore();
          stroke(c, circlePts(W / 2, 1110, 92, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 60), COL.yellow, 12, r, { passes: 2 });
          label(c, String(3 - Math.min(2, Math.floor(q * 3))), W / 2, 1156, 130, COL.yellow, caveat);
        }
        if (ans) {
          crown(c, 900, 530, 1.1, r, seg(f, c2, c2 + 8));
          tag(c, "retrain every week", 290, 1010, 50, COL.red, INK, 0.03, seg(f, c2 + 10, c2 + 18));
          tag(c, "always this week's", 790, 1010, 50, "#4ade80", INK, -0.03, seg(f, c2 + 4, c2 + 12));
        }

      }} />
    </>
  );
};

// ---------- 2 WHY A TINY MODEL: free, on your own computer, customer details stay with you ----------
const LoWhy: React.FC<SP> = ({ s }) => {
  const t = [wordAt(s, /^free$/i, 0, 30), wordAt(s, /^runs$/i, 0, 45), wordAt(s, /^customers/i, 0, 60)];
  const items = ["free", "runs on your own computer", "customer details stay with you"];
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      {t.map((x, k) => <Sfx key={k} at={x} src="audio/sfx_pop.wav" vol={0.42} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(4500 + boil);
        hand(c, "why not just ask ChatGPT?", W / 2, 360, 66, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        laptop(c, W / 2, 660, 1.2, r, seg(f, -4, 6), (sc) => {
          sc.strokeStyle = COL.yellow; sc.lineWidth = 12; sc.beginPath(); sc.arc(0, -30, 34, Math.PI, 0); sc.stroke();
          sc.fillStyle = COL.yellow; rrect(sc, -52, -30, 104, 84, 12); sc.fill();
          sc.fillStyle = INK; sc.beginPath(); sc.arc(0, 4, 11, 0, 7); sc.fill();
        });
        items.forEach((txt, k) => {
          const q = seg(f, t[k] - 2, t[k] + 6);
          if (q <= 0) return;
          tag(c, "\u2713 " + txt, W / 2, 1000 + k * 120, 52, k === 2 ? "#4ade80" : COL.cream, INK, (k - 1) * 0.02, q);
        });
      }} />
    </>
  );
};

// ---------- 6 CLOSE: prompt first, facts in the prompt, LoRA for a skill the prompt can't nail, check its work; next; follow ----------
const LoClose: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2);
  const steps = ["prompt first", "changing facts? put them in the prompt", "a skill it can't nail? a small LoRA"];
  const at = [4, wordAt(s, /^Facts$/i, 0, 40), wordAt(s, /^skill$/i, 30, 90)];
  const chk = wordAt(s, /^check$/i, 60, c1 - 50);
  return (
    <>
      {at.map((x, k) => <Sfx key={"s" + k} at={x} src="audio/sfx_pop.wav" vol={0.4} />)}
      <Sfx at={chk} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4600 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "before you train anything:", W / 2, 360, 62, COL.cream, seg(f, -6, 8), r, -0.02, "center");
          steps.forEach((t, i) => {
            const q = seg(f, at[i] - 2, at[i] + 8);
            if (!card(o, 110, 450 + i * 250, 860, 200, r, q, i === 2 ? "#fde047" : COL.cream)) return;
            label(o, String(i + 1), 180, 575 + i * 250, 90, GREY, caveat, q);
            label(o, t, 590, i === 0 ? 545 : 568 + i * 250, t.length > 30 ? 46 : 56, INK, caveat, q);
            if (i === 0 && n.fewShot !== undefined) label(o, `2 examples took ours from ${n.before} to ${n.fewShot}`, 590, 612, 42, GREY, caveat, q);
          });
          stamp(o, `check its work: ours got ${n.test - n.after} wrong`, W / 2, 1290, 60, "#16a34a", fade(f, chk, 8), r, -0.04);
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
  lo_hook: LoHook, lo_why: LoWhy, lo_hard: LoHard, lo_trick: LoTrick, lo_quiz: LoQuiz, lo_close: LoClose,
};
void arrow;
