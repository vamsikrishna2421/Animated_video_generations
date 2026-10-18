import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx, robot, RobotOpts } from "./DistillCrayon";
import { INK, GREY, caveat, handF, label, stamp, card } from "./WordsCrayon";
import { group, wrap, bubble, crown } from "./MannersCrayon";

// EP32 "How AI finds the right page" (RAG part 2: chunking, vector databases, re-ranking), crayon style. The demo is
// real (our run, pipeline/ep32/rag_demo.py + answer_demo.py; numbers in s.data.n): a made-up 45-section phone manual,
// 30 everyday questions, keyword search vs meaning search vs meaning search + a re-ranker. Content band: y 270..1400.
type Line = { from: number; frames: number; words?: { w: string; from: number; to: number }[] };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Nums = { kw: number; mean: number; rr: number; test: number; w40: number; w40o: number; sent: number; sec: number; miss: number; missm: number; top3: number; chap: number; ratio: number; rrms: number; wchap: number; wsec: number };

const READER: RobotOpts = { body: COL.light, accent: COL.yellow, glasses: true };
const GREEN = "#4ade80", PAPER = "#fffdf4";
const nums = (s: Scene): Nums => s.data.n;

// The frame (scene-relative) where a caption word is spoken: the first match at or after `after`
const wordAt = (s: Scene, re: RegExp, after = 0, fallback = 0) => {
  const w = (s.lines[0]?.words ?? []).find((x) => x.from >= after && re.test(x.w.replace(/[^\w%.-]/g, "")));
  return w ? w.from : fallback;
};

// The made-up manual: a fat book, "K7 USER MANUAL"
const manual = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, p: number, sub = "made-up, 45 sections") => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 14, 16, w, h, 18); c.fill();
  c.fillStyle = "#e5e7eb"; rrect(c, 18, 10, w - 10, h - 6, 14); c.fill();   // page edges
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#d1d5db" : "#f3f4f6"; c.fillRect(w - 6, 24 + i * ((h - 48) / 6), 10, (h - 48) / 6 - 4); }
  c.fillStyle = "#b91c1c"; rrect(c, 0, 0, w - 12, h, 16); c.fill();
  c.fillStyle = "#7f1d1d"; c.fillRect(0, 0, 34, h);
  stroke(c, rrectPts(0, 0, w - 12, h), INK, 4, r, { passes: 1, alpha: 0.5 });
  c.restore();
  c.save(); c.globalAlpha = k;
  label(c, "K7", x + w / 2 + 12, y + h * 0.36, Math.min(110, w * 0.32), COL.cream, caveat);
  label(c, "USER MANUAL", x + w / 2 + 12, y + h * 0.36 + Math.min(70, w * 0.2), Math.min(54, w * 0.15), COL.cream, caveat);
  if (sub) label(c, sub, x + w / 2 + 12, y + h - 40, Math.min(36, w * 0.1), "#fecaca", handF);
  c.restore();
};

// A search box with a magnifier; the question types in with `typed` 0..1
const searchBox = (c: Ctx, x: number, y: number, w: number, text: string, typed: number, r: () => number, p: number, hlWord?: string, hlP = 0) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p * 1.5);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 6, y + 8, w, 104, 52); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, 104, 52); c.fill();
  stroke(c, rrectPts(x, y, w, 104), INK, 4, r, { passes: 1, alpha: 0.5 });
  c.strokeStyle = GREY; c.lineWidth = 7; c.beginPath(); c.arc(x + 58, y + 46, 18, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(x + 71, y + 59); c.lineTo(x + 86, y + 74); c.stroke();
  const shown = text.slice(0, Math.round(text.length * clamp(typed)));
  c.font = handF(44); c.textAlign = "left";
  if (hlWord && hlP > 0 && shown.length === text.length) markWord(c, text, hlWord, x + 110, y + 66, 44, hlP, r);
  c.fillStyle = INK; c.fillText(shown, x + 110, y + 66);
  if (typed < 1 && Math.floor(typed * 40) % 2 === 0) { const tw = c.measureText(shown).width; c.fillRect(x + 114 + tw, y + 28, 4, 50); }
  c.restore();
};

// Yellow highlighter behind `word` inside `text` drawn left-aligned at (x, y) with the current font
const markWord = (c: Ctx, text: string, word: string, x: number, y: number, size: number, p: number, r: () => number) => {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0 || p <= 0) return;
  const x0 = x + c.measureText(text.slice(0, i)).width, ww = c.measureText(text.slice(i, i + word.length)).width;
  c.save(); c.globalAlpha = 0.75;
  stroke(c, [[x0 - 6, y - size * 0.32], [x0 - 6 + (ww + 12) * easeOut(p), y - size * 0.3]], COL.yellow, size * 0.9, r, { passes: 2, alpha: 0.85 });
  c.restore();
};

// A manual page as a card: a bold title and wrapped body lines; optional tick / cross and a highlighted word
const pageCard = (c: Ctx, x: number, y: number, w: number, title: string, body: string, r: () => number, p: number,
  o: { bg?: string; size?: number; mark?: "tick" | "cross"; markP?: number; hl?: string; hlP?: number; maxLines?: number } = {}) => {
  const size = o.size ?? 40;
  c.save(); c.font = handF(size);
  const lines = wrap(c, body, w - 70).slice(0, o.maxLines ?? 4);
  c.restore();
  const h = 110 + lines.length * size * 1.18 + 26;
  if (!card(c, x, y, w, h, r, p, o.bg ?? PAPER)) return h;
  c.save(); c.globalAlpha = clamp(p * 1.4);
  c.font = caveat(size + 14); c.textAlign = "left";
  if (o.hl && o.hlP) markWord(c, title, o.hl, x + 34, y + 70, size + 14, o.hlP, r);
  c.fillStyle = INK; c.fillText(title, x + 34, y + 70);
  c.font = handF(size); c.fillStyle = GREY;
  lines.forEach((t, i) => {
    if (o.hl && o.hlP && i === 0) markWord(c, t, o.hl, x + 34, y + 124 + i * size * 1.18, size, o.hlP, r);
    c.fillStyle = GREY; c.fillText(t, x + 34, y + 124 + i * size * 1.18);
  });
  c.restore();
  if (o.mark && (o.markP ?? 1) > 0) {
    const q = easeOut(o.markP ?? 1), mx = x + w - 60, my = y + 56;
    c.save(); c.globalAlpha = q; c.beginPath(); c.arc(mx, my, 42 * q, 0, 7); c.fillStyle = o.mark === "tick" ? "#16a34a" : COL.red; c.fill(); c.restore();
    if (o.mark === "tick") stroke(c, [[mx - 20, my], [mx - 5, my + 16], [mx + 22, my - 18]], "#fff", 9, r, { passes: 1, alpha: q });
    else { stroke(c, [[mx - 16, my - 16], [mx + 16, my + 16]], "#fff", 9, r, { passes: 1, alpha: q }); stroke(c, [[mx + 16, my - 16], [mx - 16, my + 16]], "#fff", 9, r, { passes: 1, alpha: q }); }
  }
  return h;
};

// A small shooting-star doodle for the meteor-shower page
const shootingStar = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  stroke(c, [[x - 120 * s, y + 60 * s], [x, y]], "#93c5fd", 8 * s, r, { passes: 2, alpha: 0.8 * p });
  c.save(); c.globalAlpha = p; c.fillStyle = COL.yellow; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = (i % 2 ? 9 : 22) * s; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath(); c.fill(); c.restore();
};

// One scoreboard row: label, bar out of `of`, the number at the bar's end
const scoreRow = (c: Ctx, y: number, text: string, v: number, of: number, col: string, p: number, grow: number, labelCol = COL.cream, lx = 470, bw = 470) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = p;
  c.font = caveat(46); c.fillStyle = labelCol; c.textAlign = "right"; c.fillText(text, lx - 20, y + 46);
  c.fillStyle = "rgba(255,255,255,0.12)"; rrect(c, lx, y, bw, 64, 12); c.fill();
  const wv = bw * (v / of) * easeOut(grow);
  if (wv > 2) { c.fillStyle = col; rrect(c, lx, y, wv, 64, 12); c.fill(); }
  c.font = caveat(60); c.fillStyle = COL.cream; c.textAlign = "left";
  c.fillText(String(Math.round(v * clamp(grow * 1.4))), lx + 10 + Math.max(wv, 0), y + 52);
  c.restore();
};

const scissors = (c: Ctx, x: number, y: number, s: number, open: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  [1, -1].forEach((d) => {
    c.save(); c.rotate(d * 0.35 * open);
    c.fillStyle = "#cbd5e1"; c.beginPath(); c.moveTo(0, -8 * d); c.lineTo(150, -4 * d); c.lineTo(150, 4 * d); c.lineTo(0, 10 * d); c.closePath(); c.fill();
    c.strokeStyle = COL.orange; c.lineWidth = 12; c.beginPath(); c.ellipse(-46, 26 * d, 34, 22, 0, 0, 7); c.stroke();
    c.restore();
  });
  c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fillStyle = INK; c.fill();
  c.restore();
  void r;
};

const magnifier = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = "#7c3aed"; c.lineWidth = 16; c.beginPath(); c.moveTo(40, 40); c.lineTo(96, 96); c.stroke();
  c.fillStyle = "rgba(186,230,253,0.35)"; c.beginPath(); c.arc(0, 0, 56, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 10; c.beginPath(); c.arc(0, 0, 56, 0, 7); c.stroke();
  c.restore();
};

// A mini index card: a heading line and scribbles, optional torn edges
const miniCard = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, p: number, o: { head?: boolean; torn?: boolean; text?: string; bg?: string; size?: number } = {}) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.globalAlpha = clamp(p * 1.5); c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(4,8,40,0.3)"; c.fillRect(6, 8, w, h);
  c.fillStyle = o.bg ?? PAPER;
  if (o.torn) {   // zig-zag left and right edges: cut through a sentence
    c.beginPath(); c.moveTo(0, 0);
    for (let t = 0; t <= h; t += 14) c.lineTo((t / 14) % 2 ? 10 : 0, t);
    c.lineTo(w, h);
    for (let t = h; t >= 0; t -= 14) c.lineTo(w - ((t / 14) % 2 ? 10 : 0), t);
    c.closePath(); c.fill();
  } else c.fillRect(0, 0, w, h);
  if (o.text) {
    c.font = handF(o.size ?? 26); c.fillStyle = GREY; c.textAlign = "left";
    wrap(c, o.text, w - 28).slice(0, Math.max(1, Math.floor((h - 16) / ((o.size ?? 26) * 1.15)))).forEach((t, i) => c.fillText(t, 14, 30 + i * (o.size ?? 26) * 1.15));
  } else {
    if (o.head) { c.fillStyle = INK; c.fillRect(14, 14, w * 0.55, 12); }
    for (let i = 0; i < Math.floor((h - (o.head ? 40 : 18)) / 16); i++) { c.fillStyle = "#cbd5e1"; c.fillRect(14, (o.head ? 40 : 16) + i * 16, (w - 28) * (0.6 + 0.4 * ((i * 37) % 10) / 10), 7); }
  }
  c.restore();
  void r;
};

// ---------- 1 HOOK: "Will my phone survive a shower?" -> its search returns the camera's meteor shower mode (stamped by 0:01) ----------
const RgHook: React.FC<SP> = ({ s, cue }) => {
  const d = s.data;
  const c1 = cue(1);
  const found = 12, stampAt = 24;   // the wrong page lands before the voice gets there: the joke reads in the first second
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.7} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={1 + k * 3} src="audio/sfx_tick.wav" vol={0.22} />)}
      <Sfx at={found} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={stampAt} src="reel/sfx_boom.wav" vol={0.75} />
      <Sfx at={stampAt} src="audio/gag_bonk.wav" vol={0.5} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(5000 + boil);
        searchBox(c, 70, 380, 940, d.q, seg(f, 0, 11), r, 1, "shower", seg(f, stampAt, stampAt + 8));
        label(c, "its search found:", 120, 560, 42, COL.pale, handF, seg(f, found - 2, found + 4), "left");
        const h = pageCard(c, 90, 590, 900, d.wrong.title, d.wrong.body, r, seg(f, found, found + 6), { hl: "shower", hlP: seg(f, stampAt, stampAt + 8), maxLines: 3 });
        shootingStar(c, 880, 680, 1, r, seg(f, found + 4, found + 10));
        if (f >= stampAt) stamp(c, "WRONG PAGE", W / 2, 590 + h + 70, 84, COL.red, fade(f, stampAt, 5), r, -0.06);
        if (f >= c1 + 8) hand(c, "the word, not the meaning", W / 2, 1150, 62, COL.yellow, seg(f, c1 + 8, c1 + 24), r, -0.02, "center");
        tag(c, "a made-up phone manual · tested by us", W / 2, 1300, 46, COL.cream, INK, -0.01, seg(f, 8, 16));
      }} />
    </>
  );
};

// ---------- 2 SCORE: 30 questions, right page first: keyword 18, meaning 25 (and the page meaning search found) ----------
const RgScore: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s), d = s.data;
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.5} />
      <Sfx at={c2 - 2} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c2 - 2} src="audio/sfx_snap.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5050 + boil);
        hand(c, `${n.test} everyday questions`, W / 2, 350, 66, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        // thirty little question cards
        for (let k = 0; k < n.test; k++) {
          const q = seg(f, 2 + k * 0.6, 8 + k * 0.6);
          if (q <= 0) continue;
          c.save(); c.globalAlpha = q; c.fillStyle = COL.cream; rrect(c, 90 + (k % 15) * 61, 410 + Math.floor(k / 15) * 62, 48, 48, 8); c.fill();
          c.fillStyle = INK; c.font = caveat(36); c.textAlign = "center"; c.fillText("?", 114 + (k % 15) * 61, 448 + Math.floor(k / 15) * 62); c.restore();
        }
        label(c, `right page first, out of ${n.test}`, W / 2, 610, 46, COL.cream, handF, seg(f, 8, 16));
        scoreRow(c, 650, "keyword search", n.kw, n.test, COL.orange, f >= c1 - 2 ? fade(f, c1 - 2, 6) : 0, seg(f, c1, c1 + 12));
        scoreRow(c, 742, "meaning search", n.mean, n.test, "#16a34a", f >= c2 - 2 ? fade(f, c2 - 2, 6) : 0, seg(f, c2, c2 + 12), COL.yellow);
        if (f >= c2 + 4) {
          pageCard(c, 90, 880, 900, d.right.title, d.right.body, r, seg(f, c2 + 4, c2 + 12), { mark: "tick", markP: seg(f, c2 + 10, c2 + 18), maxLines: 2, bg: "#ecfdf5" });
          tag(c, "what meaning search found for “shower”", W / 2, 872, 38, "#86efac", INK, 0.02, seg(f, c2 + 8, c2 + 16));
          tag(c, "the answer: no showers", W / 2, 1180, 56, COL.yellow, INK, -0.02, seg(f, c2 + 14, c2 + 22));
        }
      }} />
    </>
  );
};

// ---------- 3 GUESS: with no page, the AI makes up a refund policy; the manual says no ----------
const RgGuess: React.FC<SP> = ({ s, cue }) => {
  const d = s.data.rr;
  const c1 = cue(1), c2 = cue(2), c4 = cue(4), c5 = cue(5);
  const said = wordAt(s, /^refund$/i, c4, c4 + 20);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.35} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={said} src="audio/gag_bonk.wav" vol={0.5} />
      <Sfx at={said} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c5} src="audio/sfx_pop.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(5100 + boil);
        hand(c, "no page? it guesses", W / 2, 350, 72, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        group(c, 1 - 0.55 * fade(f, c2 - 2, 8), (o) => {
          const y1 = bubble(o, d.q, 200, 420, 820, "me", seg(f, c1 - 4, c1 + 4), r, { size: 42 });
          tag(o, `our small AI (${d.model}), no manual given:`, W / 2, y1 + 66, 40, COL.cream, INK, -0.01, seg(f, c4 - 10, c4 - 2));
          const y2 = bubble(o, d.answer.without, 60, y1 + 100, 880, "ai", seg(f, c4 - 2, c4 + 6), r, { size: 40, bg: "#fee2e2", fg: INK });
          if (f >= said) stamp(o, "MADE UP", W / 2 + 160, y2 - 40, 80, COL.red, fade(f, said, 5), r, -0.08);
        });
        if (f >= c2 - 2) {
          const h = pageCard(c, 90, 960, 900, "The manual: Returns", d.manual, r, seg(f, c2 - 2, c2 + 6), { mark: "tick", markP: seg(f, c2 + 4, c2 + 12), maxLines: 2, bg: "#ecfdf5" });
          tag(c, "stick around: a trick for your own PDFs", W / 2, 960 + h + 80, 52, COL.yellow, INK, -0.02, seg(f, c5 - 2, c5 + 6));
        }
      }} />
    </>
  );
};

// ---------- 4 WHY NOT PASTE IT ALL: a short doc, sure; real ones run hundreds of pages; chapters vs headings (our test) ----------
const RgWhy: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s);
  const c1 = cue(1);
  const test = wordAt(s, /^test$/i, c1, c1 + 30), six = wordAt(s, /^six$|^6$/i, test, test + 50);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={16} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={test} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={six} src="audio/sfx_snap.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5150 + boil);
        hand(c, "why not paste the whole manual?", W / 2, 350, 62, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          o.fillStyle = "#e2e8f0"; rrect(o, 300, 460, 480, 420, 30); o.fill();
          stroke(o, rrectPts(300, 460, 480, 420), INK, 4, r, { passes: 1, alpha: 0.5 });
          label(o, "chat", 540, 510, 40, GREY, caveat, 1);
          const sl = easeOut(seg(f, 4, 16));
          miniCard(o, 430, lerp(1000, 560, sl), 220, 260, r, seg(f, 2, 8), { head: true });
          tag(o, "✓ a short doc: just paste it", W / 2, 1000, 56, GREEN, INK, -0.02, seg(f, 16, 24));
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            manual(o, 360, 440, 360, 400, r, seg(f, c1 - 2, c1 + 8), "real ones: 100s of pages");
            // our test: what each question carries to the AI, cut by chapters vs by headings
            const q = seg(f, test - 4, test + 6);
            if (q > 0) {
              label(o, "words sent to the AI with each question (our test)", W / 2, 920, 38, COL.cream, handF, q);
              const bw = 600, mx = Math.max(n.wchap, n.wsec);
              [{ t: "whole chapters", v: n.wchap, col: COL.orange }, { t: "by section", v: n.wsec, col: "#16a34a" }].forEach((row, i) => {
                const y = 960 + i * 110, g = easeOut(seg(f, test + i * 6, test + 14 + i * 6));
                o.save(); o.globalAlpha = q;
                o.font = caveat(46); o.fillStyle = i === 1 ? COL.yellow : COL.cream; o.textAlign = "right"; o.fillText(row.t, 330, y + 46);
                o.fillStyle = "rgba(255,255,255,0.12)"; rrect(o, 350, y, bw, 64, 12); o.fill();
                if (g > 0.01) { o.fillStyle = row.col; rrect(o, 350, y, bw * (row.v / mx) * g, 64, 12); o.fill(); }
                o.font = caveat(52); o.fillStyle = COL.cream; o.textAlign = "left"; o.fillText(`~${row.v}`, 360 + bw * (row.v / mx) * g, y + 50);
                o.restore();
              });
              tag(o, `both found the right page ${n.chap}/${n.test} · chapters sent ${n.ratio}× the text`, W / 2, 1300, 42, COL.cream, INK, -0.01, seg(f, six, six + 8));
            }
          });
        }
      }} />
    </>
  );
};

// ---------- 5 STEP 1, CUT: every 40 words 13, overlapped 20, at headings 25 ----------
const RgCut: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s), d = s.data;
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const rows = [
    { t: "every 40 words", v: n.w40, at: c1, col: COL.red, kind: "torn" },
    { t: "40 words, overlapping", v: n.w40o, at: c2, col: COL.orange, kind: "overlap" },
    { t: "at headings", v: n.sec, at: c3, col: "#16a34a", kind: "head" },
  ];
  const rowsIn = 26;   // the rows are up before the first number is said
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={6 + k * 6} src="audio/sfx_snap.wav" vol={0.32} />)}
      <Sfx at={c1} src="audio/gag_bonk.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c3 - 44} src="reel/sfx_riser.wav" vol={0.7} />
      <Sfx at={c3 - 8} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={c3 - 8} src="audio/sfx_snap.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5200 + boil);
        hand(c, "step 1: cut it into pieces", W / 2, 350, 66, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        // the scissors' quick cut, then the three ways of cutting
        group(c, 1 - fade(f, rowsIn - 6, 6), (o) => {
          const cut = seg(f, 2, 18);
          manual(o, 360, 470, 360, 470, r, 1, "");
          stroke(o, [[330, 700], [330 + 420 * cut, 700]], COL.cream, 5, r, { passes: 1, alpha: 0.7 });
          scissors(o, 330 + 420 * cut, 700, 1.1, 0.5 + 0.5 * Math.sin(f * 0.9), r);
        });
        if (f >= rowsIn - 6) {
          group(c, fade(f, rowsIn - 6, 6), (o) => {
            label(o, `meaning search, right piece first, out of ${n.test}`, W / 2, 452, 38, COL.cream, handF, 1);
            tag(o, "40 words ≈ one section of this manual", W / 2, 518, 46, COL.cream, INK, -0.01, seg(f, rowsIn, rowsIn + 8));
            rows.forEach((row, i) => {
              const y = 540 + i * 280, q = seg(f, rowsIn - 6 + i * 3, rowsIn + 4 + i * 3);
              if (q <= 0) return;
              label(o, row.t, 60, y + 40, 50, i === 2 ? COL.yellow : COL.cream, caveat, q, "left");
              if (row.kind === "torn") miniCard(o, 60, y + 64, 620, 150, r, q, { torn: true, text: d.cut.w40, size: 30 });
              if (row.kind === "overlap") {
                miniCard(o, 60, y + 64, 420, 150, r, q, { torn: true, text: "…do not take it into the shower, the bathroom while bathing, a…", size: 30 });
                miniCard(o, 300, y + 84, 400, 150, r, q, { torn: true, text: "…the bathroom while bathing, a swimming pool or the sea…", size: 30, bg: "#fef3c7" });
              }
              if (row.kind === "head") miniCard(o, 60, y + 64, 640, 150, r, q, { text: d.cut.sec, size: 28, bg: "#ecfdf5" });
              if (f >= row.at - 2) {
                const g = easeOut(seg(f, row.at, row.at + 10));
                o.save(); o.globalAlpha = fade(f, row.at - 2, 6);
                o.beginPath(); o.arc(870, y + 130, 96 * (0.6 + 0.4 * g), 0, 7); o.fillStyle = row.col; o.fill();
                label(o, String(row.v), 870, y + 150, 100, "#fff", caveat);
                label(o, `/ ${n.test}`, 870, y + 200, 38, "#fff", handF);
                o.restore();
              }
            });
            if (f >= c3 + 8) crown(o, 870, 1120, 0.8, r, seg(f, c3 + 8, c3 + 16));
            label(o, `single sentences: ${n.sent}/${n.test} (a lone sentence loses what “it” means)`, W / 2, 1385, 32, COL.pale, handF, seg(f, c3 + 10, c3 + 18));
          });
        }
      }} />
    </>
  );
};

// ---------- 6 STEP 2, VECTOR DATABASE: pieces -> numbers for meaning -> a library sorted by meaning; the question finds its shelf ----------
const RgShelf: React.FC<SP> = ({ s, cue }) => {
  const d = s.data;
  const c1 = cue(1);
  const shelves = [{ t: "water & care", col: "#38bdf8" }, { t: "battery", col: COL.yellow }, { t: "camera", col: "#f472b6" }, { t: "warranty", col: "#a78bfa" }];
  const lib = wordAt(s, /^library$/i, 20, 60);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={10 + k * 6} src="audio/sfx_tick.wav" vol={0.3} />)}
      <Sfx at={lib} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.45} />
      <Sfx at={c1 + 22} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c1 + 28} src="audio/sfx_success.wav" vol={0.3} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(5300 + boil);
        hand(c, "step 2: a vector database", W / 2, 350, 66, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        // a piece becomes a list of numbers for its meaning
        const rr = rng(9);
        group(c, 1 - fade(f, lib - 6, 8) * 0.0, (o) => {
          miniCard(o, 70, 420, 260, 110, r, seg(f, 0, 8), { head: true });
          const q = seg(f, 6, 14);
          if (q > 0) {
            o.save(); o.globalAlpha = q;
            const nums = Array.from({ length: 4 }, () => (rr() * 2 - 1).toFixed(2));
            o.font = handF(38); o.fillStyle = COL.yellow; o.textAlign = "left"; o.fillText(`→ [${nums.join(", ")} …]`, 350, 488);
            o.restore();
          }
          tag(o, "numbers for meaning (EP 06)", 760, 560, 38, "#86efac", INK, 0.03, seg(f, 10, 18));
        });
        // the library sorted by meaning: four labelled shelves; pieces file in by topic
        const shelfP = seg(f, 12, 24);
        shelves.forEach((sh, k) => {
          const y = 680 + k * 150;
          c.save(); c.globalAlpha = shelfP;
          c.fillStyle = "#7a4520"; c.fillRect(140, y + 90, 640, 16);
          c.font = caveat(46); c.fillStyle = COL.cream; c.textAlign = "right"; c.fillText(sh.t, 1000, y + 80);
          c.restore();
          for (let j = 0; j < 7; j++) {
            const q = seg(f, 16 + k * 4 + j * 1.5, 24 + k * 4 + j * 1.5);
            if (q <= 0) continue;
            const glow = k === 0 && f >= c1 + 24 && j < 3;
            c.save(); c.globalAlpha = q; c.fillStyle = sh.col; rrect(c, 160 + j * 86, y + 90 - 70 * easeOut(q), 64, 70, 6); c.fill();
            if (glow) { c.strokeStyle = COL.yellow; c.lineWidth = 8; rrect(c, 156 + j * 86, y + 16, 72, 78, 8); c.stroke(); }
            c.restore();
          }
        });
        tag(c, "a library sorted by meaning", W / 2, 1300, 50, COL.cream, INK, -0.02, seg(f, lib, lib + 8));
        if (f >= c1 - 4) {
          // the question becomes numbers and flies to its shelf
          const fly = easeOut(seg(f, c1 + 6, c1 + 22));
          searchBox(c, 90, 1180, 900, d.q, 1, r, 1 - seg(f, c1 + 4, c1 + 10));
          const qx = lerp(W / 2, 470, fly), qy = lerp(1230, 735, fly);
          c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 30; c.beginPath(); c.arc(qx, qy, 22, 0, 7); c.fillStyle = "#fff"; c.fill(); c.restore();
          if (fly >= 1) tag(c, "nearest pieces come out", 470, 650, 42, COL.yellow, INK, -0.02, seg(f, c1 + 24, c1 + 32));
          label(c, "vector databases like FAISS (Meta) search millions of pieces", W / 2, 1385, 32, COL.pale, handF, seg(f, c1 + 30, c1 + 38));
        }
      }} />
    </>
  );
};

// ---------- 7 STEP 3, RE-RANK: reads the question beside each top piece and reorders; first-place misses 5 -> 3 ----------
const RgRerank: React.FC<SP> = ({ s, cue }) => {
  const n = nums(s), d = s.data.rr;
  const c1 = cue(1), c2 = cue(2);
  const pair: string[] = [d.quick[0], d.reranked[0]];   // meaning search's #1 (wrong) and the re-ranker's #1 (right)
  const swapAt = c1 + Math.max(20, Math.round((c2 - c1) * 0.5));
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.4} />
      {[0, 1].map((k) => <Sfx key={k} at={8 + k * 5} src="audio/sfx_tick.wav" vol={0.3} />)}
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={swapAt} src="audio/sfx_whoosh.wav" vol={0.45} />
      <Sfx at={swapAt + 12} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c2 - 46} src="reel/sfx_riser.wav" vol={0.7} />
      <Sfx at={c2 - 10} src="reel/sfx_boom.wav" vol={0.65} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5400 + boil);
        hand(c, "step 3: a re-ranker", W / 2, 350, 66, COL.yellow, seg(f, -6, 8), r, -0.02, "center");
        searchBox(c, 70, 410, 940, d.q, 1, r, seg(f, 0, 6));
        label(c, "meaning search's top pieces:", 110, 590, 40, COL.pale, handF, seg(f, 4, 10), "left");
        const swap = easeOut(seg(f, swapAt, swapAt + 12));
        pair.forEach((t, i) => {
          const right = i === 1;
          const y = lerp(620 + i * 120, 620 + (right ? 0 : 1) * 120, swap);
          const q = seg(f, 6 + i * 4, 14 + i * 4);
          if (q <= 0) return;
          c.save(); c.globalAlpha = clamp(q * 1.5);
          c.fillStyle = right && swap > 0.5 ? "#dcfce7" : PAPER; rrect(c, 200, y, 660, 100, 16); c.fill();
          c.font = caveat(50); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, 230, y + 64);
          c.font = caveat(56); c.fillStyle = COL.cream; c.textAlign = "right";
          c.fillText(`#${right ? Math.round(lerp(2, 1, swap)) : Math.round(lerp(1, 2, swap))}`, 180, y + 66);
          c.restore();
          if (right && swap >= 1) {
            const mx = 820, my = y + 50;
            c.beginPath(); c.arc(mx, my, 32, 0, 7); c.fillStyle = "#16a34a"; c.fill();
            stroke(c, [[mx - 15, my], [mx - 3, my + 13], [mx + 17, my - 13]], "#fff", 7, r, { passes: 1 });
          }
        });
        if (f >= c1 - 2) {
          const q = seg(f, c1 - 2, c1 + 6), sweep = seg(f, c1 + 4, swapAt);
          robot(c, 960, 960, 0.7, boil, 5, { ...READER, eyes: "open", arms: "point" });
          if (swap < 1) magnifier(c, 420 + 260 * Math.sin(sweep * Math.PI * 3), 640 + 120 * sweep, 0.85 * q);
          tag(c, "reads your question beside each piece", W / 2, 920, 44, COL.yellow, INK, 0.01, seg(f, c1 + 2, c1 + 10));
        }
        if (f >= c2 - 6) {
          c.save(); c.globalAlpha = fade(f, c2 - 6, 6);
          label(c, `first-place misses, out of ${n.test}:`, W / 2, 1030, 46, COL.cream, handF, 1);
          c.font = caveat(120); c.textAlign = "center"; c.fillStyle = COL.orangeLight; c.fillText(String(n.missm), 380, 1160);
          c.fillStyle = COL.cream; c.fillText("→", 540, 1160);
          c.restore();
          if (f >= c2 - 2) { c.save(); c.globalAlpha = fade(f, c2 - 2, 6); c.font = caveat(130); c.textAlign = "center"; c.fillStyle = GREEN; c.fillText(String(n.miss), 700, 1165); c.restore(); }
          label(c, "(2 more right first time, out of 30: a small test)", W / 2, 1205, 34, COL.pale, handF, seg(f, c2 + 6, c2 + 14));
          tag(c, "slower: ~80 ms vs under 1 ms a question", W / 2, 1262, 40, COL.cream, INK, -0.01, seg(f, c2 + 10, c2 + 18));
          tag(c, `if the AI reads the top 3: meaning search alone had it ${n.top3}/${n.test}`, W / 2, 1330, 38, COL.cream, INK, 0.01, seg(f, c2 + 18, c2 + 26));
        }
      }} />
    </>
  );
};

// ---------- 8 QUIZ: the bot reads only the first piece and the right page keeps coming second. A: bigger AI, B: re-ranker ----------
const RgQuiz: React.FC<SP> = ({ s, cue }) => {
  const g = s.data.rr.g;
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2].map((k) => <Sfx key={k} at={Math.round(c3 + 4 + k * Math.max(10, (c2 - c3 - 16) / 3))} src="audio/sfx_tick.wav" vol={0.38} />)}
      <Sfx at={c2 - 8} src="audio/sfx_snap.wav" vol={0.6} />
      <Sfx at={c2 - 8} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c2 + 30} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2 + 42} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5500 + boil);
        hand(c, "YOUR TURN", W / 2, 340, 100, COL.yellow, seg(f, -8, 6), r, -0.03, "center");
        tag(c, "your AI reads only the first piece", W / 2, 440, 44, COL.cream, INK, -0.02, seg(f, 6, 14));
        tag(c, "the right page keeps coming 2nd", W / 2, 510, 44, COL.cream, INK, 0.02, seg(f, 12, 20));
        const ans = f >= c2 - 8;   // the reveal hits just before the voice says the answer
        const drawCard = (x: number, L: string, lines: string[], p: number, bg: string) => {
          if (!card(c, x, 570, 440, 330, r, p, bg)) return;
          label(c, L, x + 50, 650, 80, GREY, caveat, p);
          c.save(); c.font = caveat(88); c.fillStyle = INK; c.textAlign = "center"; lines.forEach((t, i) => c.fillText(t, x + 220, 790 + i * 90)); c.restore();
        };
        drawCard(70, "A", ["a bigger AI"], seg(f, c1, c1 + 10), ans ? "#fee2e2" : COL.cream);
        drawCard(570, "B", ["a re-ranker"], seg(f, c1 + 8, c1 + 18), ans ? "#dcfce7" : COL.cream);
        if (f >= c3 && !ans) {
          const q = seg(f, c3 + 2, c2);
          c.save(); c.globalAlpha = 0.85; c.beginPath(); c.arc(W / 2, 1080, 92, 0, 7); c.fillStyle = COL.navy; c.fill(); c.restore();
          stroke(c, circlePts(W / 2, 1080, 92, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 60), COL.yellow, 12, r, { passes: 2 });
          label(c, String(3 - Math.min(2, Math.floor(q * 3))), W / 2, 1126, 130, COL.yellow, caveat);
        }
        if (ans) {
          crown(c, 900, 580, 1.1, r, seg(f, c2, c2 + 8));
          tag(c, "a bigger AI still reads the wrong page", W / 2, 960, 50, COL.red, "#fff", -0.02, seg(f, c2 + 6, c2 + 14));
          // the real example: "How long is the guarantee?"
          label(c, `“${g.q}”`, W / 2, 1040, 46, COL.cream, handF, seg(f, c2 + 14, c2 + 22));
          const sw = easeOut(seg(f, c2 + 30, c2 + 42));
          [g.quick[0], g.quick[1]].forEach((t: string, i: number) => {
            const right = t === g.reranked[0];
            const y = lerp(1080 + i * 100, 1080 + (right ? 0 : 1) * 100, sw);
            c.save(); c.globalAlpha = seg(f, c2 + 18 + i * 4, c2 + 26 + i * 4);
            c.fillStyle = right && sw > 0.5 ? "#dcfce7" : PAPER; rrect(c, 230, y, 620, 84, 14); c.fill();
            c.font = caveat(44); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, 260, y + 56);
            c.font = caveat(48); c.fillStyle = COL.cream; c.textAlign = "right";
            c.fillText(`#${right ? Math.round(lerp(2, 1, sw)) : Math.round(lerp(1, 2, sw))}`, 210, y + 58);
            c.restore();
          });
        }
      }} />
    </>
  );
};

// ---------- 9 CLOSE: short doc? paste it. Big one? cut at headings, search by meaning, re-rank if it reads one piece; quote the lines; next ----------
const RgClose: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2);
  const steps = ["short doc? paste it", "big one: cut at headings", "search by meaning", "re-rank if it reads 1 piece"];
  const at = [2, wordAt(s, /^headings$/i, 0, 40), wordAt(s, /^meaning$/i, 20, 60), wordAt(s, /^re-rank$|^rerank$/i, 30, 80)];
  const tip = cue(3);
  return (
    <>
      {at.map((x, k) => <Sfx key={"s" + k} at={x} src="audio/sfx_pop.wav" vol={0.4} />)}
      <Sfx at={tip} src="audio/sfx_snap.wav" vol={0.5} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(5600 + boil);
        group(c, 1 - fade(f, c1 - 4, 8), (o) => {
          hand(o, "make your AI find the right page", W / 2, 350, 58, COL.cream, seg(f, -6, 8), r, -0.02, "center");
          steps.forEach((t, i) => {
            const q = seg(f, at[i] - 2, at[i] + 8);
            if (!card(o, 110, 420 + i * 160, 860, 136, r, q, i === 0 ? "#dcfce7" : COL.cream)) return;
            label(o, String(i + 1), 180, 512 + i * 160, 76, GREY, caveat, q);
            label(o, t, 590, 508 + i * 160, 58, INK, caveat, q);
          });
          if (card(o, 110, 1080, 860, 230, r, seg(f, tip - 2, tip + 8), "#fde047")) {
            label(o, "chatbot + your PDF?", 540, 1160, 58, INK, caveat, seg(f, tip - 2, tip + 8));
            label(o, "ask it to quote the lines it used", 540, 1240, 54, INK, caveat, seg(f, tip + 4, tip + 12));
          }
        });
        if (f >= c1 - 4) {
          group(c, fade(f, c1 - 4, 8), (o) => {
            hand(o, "NEXT:", W / 2, 540, 80, COL.orangeLight, seg(f, c1 - 2, c1 + 8), r, -0.02, "center");
            hand(o, "when meaning search misses", W / 2, 670, 64, COL.cream, seg(f, c1 + 2, c1 + 16), r, -0.02, "center");
            hand(o, "exact codes, like “E-42”", W / 2, 770, 64, COL.yellow, seg(f, c1 + 10, c1 + 24), r, -0.02, "center");
            hand(o, "+ how to test your search", W / 2, 870, 52, COL.pale, seg(f, c1 + 18, c1 + 30), r, -0.02, "center");
          });
        }
        if (f >= c2) {
          const hp = easeOut(fade(f, c2, 12));
          c.save(); c.globalAlpha = hp;
          c.font = caveat(handle.length > 16 ? 84 : 98); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1060);
          c.shadowBlur = 0; c.font = handF(58); c.fillStyle = COL.cream; c.fillText("Follow for the next episode", W / 2, 1145);
          c.restore();
        }
      }} />
    </>
  );
};

export const RAG_SCENES = {
  rg_hook: RgHook, rg_score: RgScore, rg_guess: RgGuess, rg_why: RgWhy, rg_cut: RgCut, rg_shelf: RgShelf, rg_rerank: RgRerank,
  rg_quiz: RgQuiz, rg_close: RgClose,
};
