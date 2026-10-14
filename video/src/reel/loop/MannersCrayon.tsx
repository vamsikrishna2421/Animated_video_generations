import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade, arrow } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx, robot, RobotOpts } from "./DistillCrayon";
import { INK, GREY, caveat, handF, label, stamp, card } from "./WordsCrayon";

// EP30 "How AI learns good manners" (RLHF), in the EP27-EP29 crayon style.
// The chat outputs are real (our run): SmolLM2-360M base vs SmolLM2-360M-Instruct (example answers + preference
// ratings), greedy decoding, prompt "Is my business idea good? I want to sell ice to people in Antarctica."
// Base: repeats "I want to sell ice to people in Antarctica." four times. Instruct: "Yes, your business idea is quite
// unique and intriguing. However, ..." (then permits). Facts: InstructGPT (OpenAI, 2022): ~40 hired raters; outputs of
// the 1.3B model preferred to the 175B GPT-3. OpenAI rolled back a GPT-4o update in ChatGPT (28-29 Apr 2025) as
// "overly flattering or agreeable"; one cause: an added reward signal from thumbs-up/down data (OpenAI, 2 May 2025).
// Content band: y 270..1400 (banner above, captions below; the YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const STUDENT: RobotOpts = { body: COL.light, accent: COL.yellow };
const JUDGE: RobotOpts = { body: "#a78bfa", accent: COL.orange, glasses: true };
const QUESTION = "Is my business idea good? I want to sell ice to people in Antarctica.";
const ECHO = "I want to sell ice to people in Antarctica.";

// Draw a group at opacity a (offscreen, so helpers that set their own alpha fade together). Not nestable.
const OFF: { cv?: HTMLCanvasElement } = {};
const group = (c: Ctx, a: number, fn: (o: Ctx) => void) => {
  if (a <= 0) return;
  if (a >= 1) { fn(c); return; }
  const W = c.canvas.width, H = c.canvas.height;
  if (!OFF.cv || OFF.cv.width !== W || OFF.cv.height !== H) { OFF.cv = document.createElement("canvas"); OFF.cv.width = W; OFF.cv.height = H; }
  const o = OFF.cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.globalAlpha = 1;
  fn(o);
  c.save(); c.globalAlpha = a; c.drawImage(OFF.cv, 0, 0); c.restore();
};

const wrap = (c: Ctx, text: string, maxW: number) => {
  const out: string[] = [];
  let cur = "";
  text.split(" ").forEach((w) => {
    const t = cur ? cur + " " + w : w;
    if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t;
  });
  if (cur) out.push(cur);
  return out;
};

// Chat bubble. `lines` are drawn as given (or wrapped from text); `hl` = index of a line to highlighter-mark;
// `typed` (0..1) reveals characters; returns the bubble's bottom y.
type BubO = { size?: number; bg?: string; fg?: string; typed?: number; hl?: number; hlP?: number; lines?: string[] };
const bubble = (c: Ctx, text: string, x: number, y: number, w: number, side: "me" | "ai", p: number, r: () => number, o: BubO = {}) => {
  if (p <= 0) return y;
  const size = o.size ?? 46, lh = size * 1.22, pad = 26;
  c.save(); c.font = handF(size);
  const lines = o.lines ?? wrap(c, text, w - 2 * pad);
  const h = lines.length * lh + 2 * pad - size * 0.25;
  const e = easeOut(p);
  c.globalAlpha = clamp(p * 1.5);
  c.translate(x + (side === "me" ? w : 0), y); c.scale(e, e); c.translate(-(side === "me" ? w : 0), 0);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 8, 10, w, h, 30); c.fill();
  c.fillStyle = o.bg ?? (side === "me" ? COL.pale : COL.cream); rrect(c, 0, 0, w, h, 30); c.fill();
  c.beginPath();
  if (side === "me") { c.moveTo(w - 40, h - 2); c.lineTo(w + 12, h + 26); c.lineTo(w - 80, h - 2); }
  else { c.moveTo(40, h - 2); c.lineTo(-12, h + 26); c.lineTo(80, h - 2); }
  c.fill();
  const total = lines.join(" ").length;
  let shown = Math.round((o.typed ?? 1) * total);
  lines.forEach((ln, i) => {
    const t = ln.slice(0, Math.max(0, shown));
    shown -= ln.length + 1;
    if (o.hl === i && (o.hlP ?? 0) > 0) {
      const tw = c.measureText(ln).width * easeOut(o.hlP ?? 0);
      c.save(); c.globalAlpha = 0.85; c.fillStyle = COL.yellow; c.fillRect(pad - 8, pad + i * lh - size * 0.05, tw + 16, size * 1.0); c.restore();
    }
    c.fillStyle = o.fg ?? INK; c.textAlign = "left";
    c.fillText(t, pad, pad + i * lh + size * 0.78);
  });
  c.restore();
  void r;
  return y + h * e;
};

// Crayon penguin on an iceberg, with an "ICE FOR SALE" sign.
const penguinScene = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y + (1 - k) * 260); c.scale(s, s);
  c.beginPath(); c.moveTo(-330, 60); c.lineTo(-250, -40); c.lineTo(-120, -70); c.lineTo(60, -60); c.lineTo(240, -30); c.lineTo(330, 60); c.closePath();
  c.fillStyle = "#e0f2fe"; c.fill();
  stroke(c, [[-330, 60], [-250, -40], [-120, -70], [60, -60], [240, -30], [330, 60]], "#7dd3fc", 6, r, { passes: 2, alpha: 0.9 });
  stroke(c, [[-200, 10], [-60, -10]], "#bae6fd", 8, r, { passes: 1, alpha: 0.8 });
  c.save(); c.translate(-20, -70);
  c.beginPath(); c.ellipse(0, -120, 72, 120, 0, 0, 7); c.fillStyle = "#111827"; c.fill();
  c.beginPath(); c.ellipse(0, -100, 48, 92, 0, 0, 7); c.fillStyle = "#f8fafc"; c.fill();
  [-20, 20].forEach((ex) => { c.beginPath(); c.arc(ex, -190, 9, 0, 7); c.fillStyle = "#fff"; c.fill(); c.beginPath(); c.arc(ex + 2, -189, 4.5, 0, 7); c.fillStyle = "#111827"; c.fill(); });
  c.beginPath(); c.moveTo(-14, -168); c.lineTo(14, -168); c.lineTo(0, -148); c.closePath(); c.fillStyle = COL.orange; c.fill();
  [-1, 1].forEach((d) => { c.beginPath(); c.ellipse(d * 70, -110, 18, 58, d * 0.35, 0, 7); c.fillStyle = "#111827"; c.fill(); });
  [-24, 24].forEach((fx) => { c.beginPath(); c.ellipse(fx, -2, 22, 9, 0, 0, 7); c.fillStyle = COL.orange; c.fill(); });
  c.restore();
  stroke(c, [[150, -40], [150, -270]], "#7c4a1e", 10, r, { passes: 2 });
  c.save(); c.translate(150, -300); c.rotate(-0.05);
  c.fillStyle = COL.cream; rrect(c, -120, -55, 240, 110, 12); c.fill();
  c.font = caveat(48); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("ICE FOR", 0, -6); c.fillText("SALE", 0, 40);
  c.restore();
  c.restore();
};

const thumbIcon = (c: Ctx, x: number, y: number, s: number, up: boolean, col: string, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p) * s;
  c.save(); c.translate(x, y); c.scale(k, up ? k : -k);
  c.fillStyle = col;
  rrect(c, -34, -8, 68, 64, 16); c.fill();
  rrect(c, -30, -62, 28, 62, 14); c.fill();
  c.fillStyle = COL.navy; c.fillRect(-56, -2, 20, 58);
  c.restore();
};

const crown = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p) * s;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.beginPath(); c.moveTo(-60, 30); c.lineTo(-60, -20); c.lineTo(-30, 5); c.lineTo(0, -40); c.lineTo(30, 5); c.lineTo(60, -20); c.lineTo(60, 30); c.closePath();
  c.fillStyle = COL.yellow; c.fill();
  stroke(c, [[-60, 30], [-60, -20], [-30, 5], [0, -40], [30, 5], [60, -20], [60, 30], [-60, 30]], "#b45309", 4, r, { passes: 1, alpha: 0.8 });
  c.restore();
};

// A small answer card: letter, three scribbled lines, optional rank badge.
const answerCard = (c: Ctx, x: number, y: number, letter: string, r: () => number, p: number, rank?: number, rankP = 0) => {
  if (!card(c, x, y, 190, 230, r, p)) return;
  label(c, letter, x + 34, y + 58, 52, GREY, caveat, p);
  for (let i = 0; i < 3; i++) stroke(c, [[x + 30, y + 100 + i * 36], [x + 70, y + 96 + i * 36], [x + 120, y + 102 + i * 36], [x + 160 - i * 20, y + 98 + i * 36]], GREY, 4, r, { passes: 1, alpha: 0.5 * p });
  if (rank !== undefined && rankP > 0) {
    const k = easeOut(rankP);
    c.save(); c.translate(x + 170, y + 14); c.scale(k, k);
    c.beginPath(); c.arc(0, 0, 38, 0, 7); c.fillStyle = rank === 1 ? "#4ade80" : COL.orangeLight; c.fill();
    c.font = caveat(56); c.fillStyle = INK; c.textAlign = "center"; c.fillText(String(rank), 0, 18);
    c.restore();
  }
};

// ---------- 1 HOOK ----------
const RlHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.8} />
      <Sfx at={10} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/gag_boing.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.45} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c3 + 4 + k * 7} src="audio/sfx_tick.wav" vol={0.32} />)}
      <Sfx at={c3 + 34} src="reel/sfx_boom.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(3000 + boil);
        // [0] the trained model's real reply
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          tag(o, "a small free AI · run by us", W / 2, 330, 46, COL.cream, INK, -0.02, 1);
          const yb = bubble(o, QUESTION, 300, 380, 700, "me", 1, r, { size: 44 });
          tag(o, "after manners training", 300, yb + 70, 36, COL.green, INK, -0.03, seg(f, 4, 12));
          bubble(o, "", 80, yb + 110, 760, "ai", seg(f, 4, 10), r, {
            size: 52, lines: ["Yes, your business idea is", "quite unique and intriguing."], typed: seg(f, 6, 26), hl: 1, hlP: seg(f, 26, 36),
          });
          if (f >= c1 - 2) {
            penguinScene(o, W / 2 + 30, 1330, 0.95, r, seg(f, c1 - 2, c1 + 12));
            hand(o, "ice. in Antarctica.", W / 2, 1000, 68, COL.yellow, seg(f, c1 + 8, c1 + 22), r, -0.03, "center");
          }
        });
        // [2] before that training, [3] it just repeated the question
        if (f >= c2 - 4) {
          const p = fade(f, c2 - 4, 8);
          group(c, p, (o) => {
            stamp(o, "BEFORE manners training", W / 2, 360, 66, COL.orangeLight, fade(f, c2, 8), r, -0.04);
            const yb = bubble(o, QUESTION, 300, 450, 700, "me", 1, r, { size: 44 });
            const n = f < c3 ? 0 : Math.min(4, 1 + Math.floor((f - c3) / 7));
            const lines = n === 0 ? ["..."] : Array.from({ length: n }, () => ECHO);
            bubble(o, "", 60, yb + 60, 960, "ai", 1, r, { size: 40, lines, bg: "#e5e7eb" });
            if (f >= c3 + 30) stamp(o, "x4", 900, yb + 330, 110, COL.red, fade(f, c3 + 30, 8), r, -0.12);
          });
          if (f >= c3 + 12) hand(c, "it couldn't even answer", W / 2, 1260, 60, COL.cream, seg(f, c3 + 12, c3 + 26), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 2 RAW: helps you, flatters you; a next-word guesser ----------
const RlRaw: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={4} src="audio/sfx_pop.wav" vol={0.35} />
      <Sfx at={18} src="audio/sfx_pop.wav" vol={0.35} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c1 + 30} src="audio/sfx_pop.wav" vol={0.4} />
      {[0, 1, 2, 3, 4, 5].map((k) => <Sfx key={k} at={c2 + k * 6} src="audio/sfx_tick.wav" vol={0.22} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3100 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "this training is why AI...", W / 2, 360, 66, COL.cream, seg(f, 0, 12), r, -0.02, "center");
          if (card(o, 90, 420, 420, 560, r, seg(f, 4, 12))) {
            robot(o, 300, 900, 0.95, boil, 1, { ...STUDENT, arms: "thumb", mouth: "grin", eyes: "happy" });
            label(o, "helps you", 300, 500, 70, "#15803d", caveat, seg(f, 6, 14));
          }
          if (card(o, 570, 420, 420, 560, r, seg(f, 16, 24), "#ffe4e6")) {
            robot(o, 780, 900, 0.95, boil, 2, { ...STUDENT, arms: "up", mouth: "grin", eyes: "happy" });
            label(o, "flatters you", 780, 500, 70, COL.red, caveat, seg(f, 18, 26));
            crown(o, 780, 525, 0.6, r, seg(f, 22, 30));
          }
          hand(o, "stay till the end: you'll train it yourself", W / 2, 1110, 52, COL.yellow, seg(f, 44, 64), r, -0.02, "center");
        });
        // [1] a raw AI = your phone keyboard's next-word guess; [2] it just keeps writing
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            hand(o, "a raw AI = a next-word guesser", W / 2, 350, 62, COL.yellow, seg(f, c1, c1 + 14), r, -0.02, "center");
            o.save(); o.fillStyle = "#0b1020"; rrect(o, 220, 400, 640, 900, 60); o.fill(); o.restore();
            stroke(o, rrectPts(220, 400, 640, 900), COL.cream, 6, r, { passes: 2, alpha: 0.8 });
            o.save(); o.fillStyle = "#f8fafc"; rrect(o, 250, 440, 580, 620, 24); o.fill(); o.restore();
            o.save(); o.font = handF(40); o.fillStyle = INK;
            const base = "I want to sell ice to";
            let txt = base;
            if (f >= c1 + 30) txt = base + " people";
            if (f >= c2) {
              const extra = Math.min(60, Math.floor((f - c2) * 1.6));
              txt = (base + " people in Antarctica. " + ECHO + " " + ECHO + " " + ECHO).slice(0, base.length + 7 + extra * 2);
            }
            const lines = wrap(o, txt, 530);
            lines.slice(-12).forEach((ln, i) => o.fillText(ln, 275, 500 + i * 48));
            o.restore();
            // suggestion bar
            const chips = ["people", "the", "penguins"];
            chips.forEach((t, i) => {
              const x = 255 + i * 195, hot = i === 0 && f >= c1 + 22 && f < c2;
              o.save(); o.globalAlpha = seg(f, c1 + 8 + i * 3, c1 + 14 + i * 3);
              o.fillStyle = hot ? COL.yellow : "#e5e7eb"; rrect(o, x, 1080, 180, 70, 16); o.fill();
              o.font = handF(38); o.fillStyle = INK; o.textAlign = "center"; o.fillText(t, x + 90, 1128); o.restore();
            });
            o.save(); o.globalAlpha = seg(f, c1 + 8, c1 + 16); o.fillStyle = "#cbd5e1";
            for (let i = 0; i < 3; i++) rrect(o, 255, 1170 + i * 40, 570, 28, 8);
            o.fill(); o.restore();
          });
          if (f >= c2 + 10) hand(c, "it just keeps writing", W / 2, 1365, 58, COL.cream, seg(f, c2 + 10, c2 + 24), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 3 STEPS 1-2 ----------
const RlSteps12: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={30} src="audio/sfx_whoosh.wav" vol={0.3} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c1 + 30 + k * 6} src="audio/sfx_tick.wav" vol={0.3} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3200 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          tag(o, "STEP 1", W / 2, 340, 64, COL.yellow, INK, -0.03, seg(f, 0, 8));
          hand(o, "people write good example answers", W / 2, 440, 54, COL.cream, seg(f, 2, 16), r, -0.02, "center");
          if (card(o, 80, 500, 560, 380, r, seg(f, 4, 12))) {
            o.save(); o.font = handF(42); o.fillStyle = INK;
            o.fillText("Q: How do I make tea?", 110, 570);
            o.fillStyle = "#15803d";
            ["A: Boil water. Add the tea.", "Wait three minutes.", "Add milk if you like."].forEach((t, i) => {
              const p = seg(f, 10 + i * 8, 18 + i * 8);
              o.fillText(t.slice(0, Math.round(t.length * p)), 110, 640 + i * 60);
            });
            o.restore();
          }
          arrow(o, [660, 700], [770, 760], -30, COL.cream, 8, seg(f, 30, 40), r);
          robot(o, 880, 1080, 0.75, boil, 3, { ...STUDENT, arms: "write", look: -0.4 });
          label(o, "the AI copies them", 860, 1200, 52, COL.yellow, caveat, seg(f, 36, 46));
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            tag(o, "STEP 2 · the shortcut", W / 2, 340, 60, COL.yellow, INK, -0.03, seg(f, c1, c1 + 8));
            hand(o, "the AI writes a few answers...", W / 2, 440, 52, COL.cream, seg(f, c1 + 2, c1 + 14), r, -0.02, "center");
            const ranks = [3, 1, 4, 2];
            ["A", "B", "C", "D"].forEach((L, i) => answerCard(o, 70 + i * 240, 520, L, r, seg(f, c1 + 6 + i * 4, c1 + 14 + i * 4), ranks[i], seg(f, c1 + 30 + i * 6, c1 + 38 + i * 6)));
            hand(o, "...people just rank them", W / 2, 870, 56, COL.yellow, seg(f, c1 + 26, c1 + 40), r, -0.02, "center");
            tag(o, "OpenAI, 2022: about 40 hired raters", W / 2, 1010, 44, COL.cream, INK, 0.02, seg(f, c1 + 44, c1 + 54));
            label(o, "picking is faster than writing", W / 2, 1140, 46, COL.pale, handF, seg(f, c1 + 50, c1 + 60));
          });
        }
      }} />
    </>
  );
};

// ---------- 4 STEPS 3-4, RLHF, 100x ----------
const RlSteps34: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c1 + 34} src="audio/sfx_success.wav" vol={0.35} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.95} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3300 + boil);
        // [0] step 3: the robot judge learns from the rankings
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          tag(o, "STEP 3", W / 2, 340, 64, COL.yellow, INK, -0.03, seg(f, 0, 8));
          hand(o, "a second AI learns what people like", W / 2, 440, 52, COL.cream, seg(f, 2, 16), r, -0.02, "center");
          [[2, 1], [4, 2], [1, 3], [3, 4]].forEach(([L, rank], i) => answerCard(o, 60 + (i % 2) * 210, 520 + Math.floor(i / 2) * 260, "ABCD"[L - 1], r, seg(f, 4 + i * 3, 12 + i * 3), rank, 1));
          arrow(o, [500, 780], [600, 780], -20, COL.cream, 8, seg(f, 18, 28), r);
          robot(o, 800, 1150, 0.95, boil, 4, { ...JUDGE, arms: "up", mouth: "flat" });
          tag(o, "a robot judge", 800, 1250, 54, COL.orangeLight, INK, 0.03, seg(f, 26, 36));
        });
        // [1] step 4: practise, get scored, repeat
        if (f >= c1 - 4 && f < c2 + 4) {
          group(c, fade(f, c1 - 4, 8) * (1 - fade(f, c2 - 4, 8)), (o) => {
            tag(o, "STEP 4", W / 2, 340, 64, COL.yellow, INK, -0.03, seg(f, c1, c1 + 8));
            robot(o, 280, 1050, 0.8, boil, 5, { ...STUDENT, arms: "write", mouth: "smile" });
            robot(o, 800, 1050, 0.8, boil, 6, { ...JUDGE, arms: "point", mouth: "flat" });
            arrow(o, [420, 560], [660, 560], -60, COL.cream, 8, seg(f, c1 + 6, c1 + 16), r);
            arrow(o, [660, 1120], [420, 1120], -60, COL.cream, 8, seg(f, c1 + 16, c1 + 26), r);
            label(o, "answer", 540, 500, 44, COL.pale, handF, seg(f, c1 + 8, c1 + 16));
            const score = f < c1 + 34 ? "6/10" : "9/10";
            if (card(o, 690, 380, 220, 120, r, seg(f, c1 + 18, c1 + 26))) label(o, score, 800, 465, 70, f < c1 + 34 ? COL.orange : "#15803d", caveat, 1);
            hand(o, "high score? do more of that", W / 2, 1250, 56, COL.yellow, seg(f, c1 + 30, c1 + 44), r, -0.02, "center");
          });
        }
        // [2] RLHF
        if (f >= c2 - 4 && f < c3 + 4) {
          group(c, fade(f, c2 - 4, 8) * (1 - fade(f, c3 - 4, 8)), (o) => {
            stamp(o, "RLHF", W / 2, 640, 190, COL.yellow, fade(f, c2, 8), r, -0.04);
            ["Reinforcement", "Learning from", "Human", "Feedback"].forEach((t, i) => label(o, t, W / 2, 860 + i * 84, 70, i === 2 ? COL.yellow : COL.cream, caveat, seg(f, c2 + 6 + i * 5, c2 + 14 + i * 5)));
          });
        }
        // [3] OpenAI's own tests: a small trained model beat a raw one 100x bigger
        if (f >= c3 - 4) {
          group(c, fade(f, c3 - 4, 8), (o) => {
            hand(o, "people preferred...", W / 2, 350, 62, COL.cream, seg(f, c3, c3 + 12), r, -0.02, "center");
            const base = 1260, big = 760, gp = easeOut(seg(f, c3 + 2, c3 + 20));
            o.save(); o.fillStyle = "#94a3b8"; o.fillRect(180, base - big * gp, 300, big * gp); o.restore();
            stroke(o, rrectPts(180, base - big * gp, 300, big * gp), COL.ink, 4, r, { passes: 1, alpha: 0.6 });
            label(o, "raw: 175B", 330, base + 60, 54, COL.pale, caveat, seg(f, c3 + 6, c3 + 14));
            const sp = seg(f, c3 + 12, c3 + 20);
            o.save(); o.globalAlpha = sp; o.fillStyle = "#4ade80"; o.fillRect(660, base - 8, 220, 8); o.restore();
            label(o, "trained: 1.3B", 770, base + 60, 54, "#4ade80", caveat, sp);
            crown(o, 770, base - 70, 1.0, r, seg(f, c3 + 22, c3 + 32));
            label(o, "this one", 770, base - 140, 50, COL.yellow, caveat, seg(f, c3 + 26, c3 + 34));
            tag(o, "OpenAI's own tests, 2022", W / 2, 1385, 40, COL.cream, INK, 0.02, seg(f, c3 + 30, c3 + 40));
          });
        }
      }} />
    </>
  );
};

// ---------- 5 QUIZ: your idea, A flatters, B helps ----------
const RlQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={c3 + 4 + k * 13} src="audio/sfx_tick.wav" vol={0.38} />)}
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3400 + boil);
        hand(c, "YOUR TURN", W / 2, 350, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
        tag(c, "your idea · months of work", W / 2, 455, 48, COL.cream, INK, -0.02, seg(f, 6, 14) * (1 - fade(f, cue(2), 6)));
        const ans = f >= c2;
        const cardsP = seg(f, c1, c1 + 10);
        const drawCard = (x: number, L: string, lines: string[], p: number, bg: string) => {
          if (!card(c, x, 520, 440, 470, r, p, bg)) return;
          label(c, L, x + 50, 600, 80, GREY, caveat, p);
          c.save(); c.font = handF(46); c.fillStyle = INK; lines.forEach((t, i) => c.fillText(t, x + 40, 690 + i * 62)); c.restore();
        };
        drawCard(70, "A", ["\"This is really", "strong.", "Go for it!\""], cardsP, ans ? "#fef9c3" : COL.cream);
        drawCard(570, "B", ["\"Your price is too", "low. You'll lose", "money in three", "months.\""], seg(f, c1 + 8, c1 + 18), ans ? "#dcfce7" : COL.cream);
        thumbIcon(c, 290, 1100, 0.9, true, "#4ade80", seg(f, c1 + 30, c1 + 38));
        thumbIcon(c, 790, 1100, 0.9, true, "#4ade80", seg(f, c1 + 34, c1 + 42));
        if (f >= c1 + 30 && !ans) label(c, "which one gets your thumbs up?", W / 2, 1250, 52, COL.cream, handF, seg(f, c1 + 30, c1 + 40));
        if (f >= c3 && !ans) {
          const q = seg(f, c3 + 2, c2);
          stroke(c, circlePts(W / 2, 1330, 46, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 40), COL.yellow, 9, r, { passes: 2 });
          label(c, String(3 - Math.min(2, Math.floor(q * 3))), W / 2, 1352, 60, COL.yellow, caveat);
        }
        if (ans) {
          tag(c, "helps you", 790, 1000, 56, "#4ade80", INK, -0.03, seg(f, c2, c2 + 8));
          tag(c, "feels nicer", 290, 1000, 56, COL.yellow, INK, 0.03, seg(f, c2 + 12, c2 + 20));
          crown(c, 290, 490, 1.0, r, seg(f, c2 + 24, c2 + 34));
          label(c, "the judge's pick", 290, 430, 50, COL.yellow, caveat, seg(f, c2 + 28, c2 + 36));
          hand(c, "it learns what we like, not what's true", W / 2, 1270, 52, COL.cream, seg(f, c2 + 40, c2 + 56), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 6 IT REALLY HAPPENED (April 2025) ----------
const RlReal: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={26} src="reel/sfx_boom.wav" vol={0.55} />
      {[0, 1, 2, 3, 4].map((k) => <Sfx key={k} at={c1 + 8 + k * 6} src="audio/sfx_pop.wav" vol={0.22} />)}
      <Sfx at={c2 + 20} src="audio/sfx_pop.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(3500 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          if (card(o, 90, 380, 900, 640, r, seg(f, 0, 10))) {
            label(o, "APRIL 2025", W / 2, 470, 72, INK, caveat, 1);
            stroke(o, [[150, 500], [930, 500]], INK, 4, r, { passes: 1, alpha: 0.6 });
            o.save(); o.font = handF(60); o.fillStyle = INK; o.textAlign = "center";
            o.fillText("ChatGPT update", W / 2, 590); o.fillText("rolled back", W / 2, 660); o.restore();
            label(o, "OpenAI: \"overly flattering or agreeable\"", W / 2, 760, 42, GREY, handF, seg(f, 10, 20));
            o.save(); o.globalAlpha = seg(f, 6, 14); o.fillStyle = "#cbd5e1";
            for (let i = 0; i < 4; i++) rrect(o, 170, 820 + i * 44, 740 - (i % 2) * 120, 22, 6);
            o.fill(); o.restore();
          }
          stamp(o, "TOO FLATTERING", W / 2, 900, 96, COL.red, fade(f, 24, 8), r, -0.08);
          tag(o, "OpenAI, 29 April & 2 May 2025", W / 2, 1110, 40, COL.cream, INK, 0.02, seg(f, 30, 40));
        });
        // [1] thumbs-up/down clicks added to the training; [2] the buttons you click
        if (f >= c1 - 4 && f < c2 + 4) {
          group(c, fade(f, c1 - 4, 8) * (1 - fade(f, c2 - 4, 8)), (o) => {
            hand(o, "one reason: clicks in the training", W / 2, 360, 58, COL.yellow, seg(f, c1, c1 + 14), r, -0.02, "center");
            robot(o, 760, 1180, 0.95, boil, 7, { ...JUDGE, arms: "up", mouth: "o" });
            for (let k = 0; k < 7; k++) {
              const t = clamp((f - c1 - 6 - k * 6) / 30);
              if (t <= 0) continue;
              const x = lerp(140 + (k % 3) * 60, 700, easeOut(t)), y = lerp(520 + k * 70, 860, easeOut(t));
              thumbIcon(o, x, y, 0.55 * (1 - 0.5 * t), k % 3 !== 2, k % 3 !== 2 ? "#4ade80" : COL.red, 1);
            }
            tag(o, "thumbs up · thumbs down", 300, 1250, 46, COL.cream, INK, -0.02, seg(f, c1 + 20, c1 + 30));
          });
        }
        if (f >= c2 - 4) {
          group(c, fade(f, c2 - 4, 8), (o) => {
            o.save(); o.fillStyle = "#0b1020"; rrect(o, 220, 380, 640, 820, 60); o.fill(); o.restore();
            stroke(o, rrectPts(220, 380, 640, 820), COL.cream, 6, r, { passes: 2, alpha: 0.8 });
            bubble(o, "", 260, 450, 560, "ai", 1, r, { size: 40, lines: ["Great idea! You're", "absolutely right,", "it will work."] });
            const tp = f >= c2 + 20 ? 1 : 0;
            o.save(); o.fillStyle = tp ? "#4ade80" : "#334155"; rrect(o, 280, 760, 130, 90, 20); o.fill(); o.fillStyle = "#334155"; rrect(o, 430, 760, 130, 90, 20); o.fill(); o.restore();
            thumbIcon(o, 345, 815, 0.55, true, "#f8fafc", 1);
            thumbIcon(o, 495, 800, 0.55, false, "#f8fafc", 1);
            if (f >= c2 + 14) { o.save(); o.globalAlpha = clamp((c2 + 30 - f) / 12); o.beginPath(); o.arc(345, 805, 30 + (f - c2 - 14) * 2, 0, 7); o.strokeStyle = COL.yellow; o.lineWidth = 6; o.stroke(); o.restore(); }
            hand(o, "the buttons you click", W / 2, 1000, 56, COL.cream, seg(f, c2 + 4, c2 + 16), r, -0.02, "center");
            hand(o, "can favour answers that agree", W / 2, 1290, 56, COL.yellow, seg(f, c2 + 36, c2 + 52), r, -0.02, "center");
          });
        }
      }} />
    </>
  );
};

// ---------- 7 CLOSE: manners, not proof; the prompt; next; follow ----------
const RlClose: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.35} />
      <Sfx at={14} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.3} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3600 + boil);
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          const top = lerp(400, 330, easeOut(seg(f, c1 - 6, c1 + 6)));
          bubble(o, "", 140, top, 800, "ai", seg(f, 0, 8), r, { size: 48, lines: ["Yes, your idea is", "quite unique and intriguing."], hl: 1, hlP: 1 });
          stamp(o, "MANNERS, NOT PROOF", W / 2, top + 120, 84, COL.red, fade(f, 12, 8), r, -0.06);
          if (f >= c1 - 4) {
            const p = seg(f, c1 - 2, c1 + 10);
            o.save(); o.globalAlpha = clamp(p * 1.5); o.translate(W / 2, 880); o.rotate(-0.025); o.scale(easeOut(p), easeOut(p));
            o.fillStyle = "rgba(4,8,40,0.35)"; o.fillRect(-392, -232, 800, 480);
            o.fillStyle = COL.yellow; o.fillRect(-400, -240, 800, 480);
            o.font = caveat(52); o.fillStyle = "#7c2d12"; o.textAlign = "left"; o.fillText("Ask it:", -350, -160);
            o.font = handF(52); o.fillStyle = INK;
            ["\"What are the 3 biggest", "reasons this will fail?\""].forEach((t, i) => o.fillText(t, -350, -80 + i * 70));
            o.font = handF(44); o.fillStyle = "#7c2d12"; o.fillText("or say it's a friend's idea", -350, 150);
            o.restore();
          }
        });
        if (f >= c2 - 4) {
          group(c, fade(f, c2 - 4, 8), (o) => {
            hand(o, "NEXT:", W / 2, 560, 80, COL.orangeLight, seg(f, c2, c2 + 10), r, -0.02, "center");
            hand(o, "teach an AI a new skill", W / 2, 690, 72, COL.cream, seg(f, c2 + 6, c2 + 20), r, -0.02, "center");
            hand(o, "without a supercomputer", W / 2, 790, 66, COL.yellow, seg(f, c2 + 14, c2 + 28), r, -0.02, "center");
          });
        }
        if (f >= c3) {
          const hp = easeOut(fade(f, c3, 12));
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

export const MANNERS_SCENES = {
  rl_hook: RlHook, rl_raw: RlRaw, rl_steps12: RlSteps12, rl_steps34: RlSteps34, rl_quiz: RlQuiz, rl_real: RlReal, rl_close: RlClose,
};
