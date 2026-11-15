import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg, chat, editor } from "./TutorialCrayon";

// EP53 "Build RAG over your PDFs, Part 2" (series/scripts/ep53_rag_pdf_part2.md): a screen tutorial, one narrator.
// A 300-page manual we wrote (a made-up WM-900 washing machine). Sending every page is 15,373 tokens a question and does
// not fit our small AI's 4,096 setting; the 3 pages found by meaning are 247 tokens and give the same answer (drain
// filter, page 141). The steps: embed every page once; embed the question, take the 3 closest; send those pages with
// Part 1's rules. Our test: meaning 8/10, words 7/10, a simple mix 6/10. The miss: child lock, "Not in the document".
// The texts come from the spec (data.t), copied from series/scripts/ep53_demo/.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const GREEN = "#4ade80";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
const big = (c: Ctx, t: string, size: number) => fit(c, t, 1000, size, 800);

// a small page thumbnail with a number
const thumb = (c: Ctx, x: number, y: number, w: number, h: number, n: number, tint = "#ffffff") => {
  c.save();
  c.fillStyle = tint; rrect(c, x, y, w, h, 6); c.fill();
  c.fillStyle = "#cbd5e1"; for (let q = 0; q < 4; q++) c.fillRect(x + 8, y + 12 + q * (h / 6), w - 16 - (q % 2) * 12, 4);
  c.font = SANS(Math.max(12, w / 4), 800); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText(String(n), x + w / 2, y + h - 8);
  c.restore();
};
// a page card: title, text (wrapped), one phrase lit with the highlighter
const pageCard = (c: Ctx, x: number, y: number, w: number, n: number, title: string, text: string, lit: string, kLit: number) => {
  c.save();
  c.font = SANS(30, 600); const lines = wrap(c, text, w - 50); const h = 110 + lines.length * 42 + 40;
  c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, x + 8, y + 10, w, h, 12); c.fill();
  c.fillStyle = "#fefce8"; rrect(c, x, y, w, h, 12); c.fill();
  c.font = SANS(fit(c, title, w - 50, 34, 900), 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(title, x + 25, y + 55);
  let yy = y + 110;
  lines.forEach((t) => {
    c.font = SANS(30, 600);
    const at = t.indexOf(lit);
    if (at >= 0 && kLit > 0) {
      const x0 = c.measureText(t.slice(0, at)).width, wl = c.measureText(lit).width;
      c.save(); c.globalAlpha = 0.65; c.fillStyle = "#fde047"; c.fillRect(x + 22 + x0, yy - 28, wl * clamp(kLit), 38); c.restore();
    }
    c.fillStyle = "#334155"; c.fillText(t, x + 25, yy); yy += 42;
  });
  c.font = SANS(24, 800); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(`page ${n}`, x + w / 2, y + h - 18);
  c.restore();
  return y + h;
};
const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = RED, rot = -0.06) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  c.font = SANS(fit(c, t, 960, 52, 900), 900); const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -52, w, 82, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 7; rrect(c, -w / 2, -52, w, 82, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 8); c.restore();
};
// a horizontal bar against the 4,096 box
const bar = (c: Ctx, y: number, label: string, value: number, col: string, k: number, scale: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = SANS(36, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(label, 60, y - 18);
  const w = Math.min(value * scale, 2000) * clamp(k);
  c.fillStyle = col; rrect(c, 60, y, Math.max(20, w), 70, 12); c.fill();
  c.restore();
};

const StRag: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["title", "test", "habit"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.45} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "part1") sfx.push(<Sfx key={k("z")} at={end - 22} src="reel/sfx_buzz.wav" vol={0.45} />);
    if (["step1", "step2", "step3"].includes(b.prop)) sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("t")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "step2") sfx.push(<Sfx key={k("m")} at={cue(i, 1, 0.5) + 12} src="audio/sfx_whoosh.wav" vol={0.4} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.3) - 2} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={cue(i, 1, 0.3)} src={CLAP} vol={0.4} />, <Sfx key={k("n")} at={cue(i, 2, 0.6)} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("z")} at={cue(i, 3, 0.8) + 16} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "miss") sfx.push(<Sfx key={k("z")} at={at + 6} src="reel/sfx_buzz.wav" vol={0.4} />, <Sfx key={k("d")} at={cue(i, 1, 0.5) + 30} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(5353 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        const code: string[] = T.code;
        if (P === "hook") {
          block(c, 50, 250, "WHOLE MANUAL · 300 PAGES", `${T.whole} tokens`, "#f87171");
          block(c, 560, 250, "3 PAGES, BY MEANING", `${T.top3} tokens`, GREEN);
          const kR = loopOn ? 1 : seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          const y = chat(c, 50, 450, W - 100, "Washing machine help · 300-page manual", [
            { me: true, t: T.q, k: 1 }, { me: false, t: T.reply, k: kR },
          ], 36);
          chip(c, "same answer · page 141", W / 2, y + 60, "#dcfce7", "#14532d", kR, 44);
          chip(c, `${T.whole} tokens don't fit our AI's ${T.ctx}`, W / 2, y + 170, "#1e293b", "#fca5a5", loopOn ? 1 : seg(f, cu(1, 0.6) + 45, cu(1, 0.6) + 53), big(c, `${T.whole} tokens don't fit our AI's ${T.ctx}`, 44));
        } else if (P === "part1") {
          c.font = SANS(fit(c, "PART 1: SEND EVERY PAGE", W - 120, 64), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("PART 1: SEND EVERY PAGE", W / 2, 330);
          const nShow = Math.floor(300 * seg(f, ln.from, cu(1, 0.4)));
          for (let q = 0; q < nShow; q++) { const col = q % 20, row = Math.floor(q / 20); thumb(c, 60 + col * 48, 390 + row * 30, 40, 26, q + 1); }
          const k2 = seg(f, cu(1, 0.3), cu(1, 0.3) + 10);
          const scale = 960 / 4096;
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.strokeStyle = GREEN; c.lineWidth = 6; c.setLineDash([16, 10]); c.strokeRect(56, 1000, 4096 * scale, 230); c.setLineDash([]);
            c.font = SANS(32, 800); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText(`our AI's setting: ${T.ctx} tokens`, 56 + 4096 * scale - 10, 1270);
            c.restore();
          }
          bar(c, 1080, `the whole manual: ${T.whole} tokens, every question`, 15373, "#f87171", k2, scale);
          stamp(c, "✗ DOESN'T FIT", W / 2, 960, seg(f, endL - 22, endL - 14));
        } else if (P === "title") {
          c.font = SANS(fit(c, "PART 2: ONLY THE PAGES THAT ANSWER", W - 100, 66), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("PART 2: ONLY THE PAGES THAT ANSWER", W / 2, 400);
          chip(c, "find them by meaning, not by matching words", W / 2, 490, "#e0e7ff", "#1e3a8a", seg(f, cu(1, 0.1), cu(1, 0.1) + 8), big(c, "find them by meaning, not by matching words", 42));
          ["1 · every page → numbers, once", "2 · the question → numbers: 3 closest pages", "3 · send those 3 pages + the rules"].forEach((t, q) => {
            const k = seg(f, cu(1, 0.3) + 10 + q * 10, cu(1, 0.3) + 18 + q * 10); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 600 + q * 180; c.fillStyle = "#1e293b"; rrect(c, 80, y, W - 160, 140, 22); c.fill();
            c.font = SANS(fit(c, t, W - 220, 46, 900), 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, W / 2, y + 88); c.restore();
          });
        } else if (P === "step1" || P === "step2" || P === "step3") {
          const label = P === "step1" ? "STEP 1 · every page → numbers, once" : P === "step2" ? "STEP 2 · the question → the 3 closest pages" : "STEP 3 · send those pages, with the rules";
          chip(c, label, W / 2, 300, "#fde68a", INK, 1, big(c, label, 40));
          const shown = P === "step1" ? 2 * seg(f, ln.from + 2, cu(1, 0.4)) : P === "step2" ? 2 + 3 * seg(f, ln.from + 2, ln.from + Math.round(ln.frames * 0.35)) : 5 + 4 * seg(f, ln.from + 2, cu(1, 0.5));
          const hi = P === "step1" ? [0, 1] : P === "step2" ? [2, 3, 4] : [5, 6, 7, 8];
          const yE = editor(c, 30, 360, W - 60, code, shown, hi, 25, "manual_bot.py");
          if (P === "step1") {
            chip(c, "page 141 → [0.04, 0.06, 0.09, … 384 numbers]", W / 2, yE + 90, "#1e293b", "#e2e8f0", seg(f, ln.from + 20, ln.from + 28), big(c, "page 141 → [0.04, 0.06, 0.09, … 384 numbers]", 40));   // the real first 3
            chip(c, "300 pages · 3.1 seconds · our computer", W / 2, yE + 200, "#dcfce7", "#14532d", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 44);
            chip(c, "a small free model: all-MiniLM-L6-v2", W / 2, yE + 300, "#e0e7ff", "#1e3a8a", seg(f, cu(1, 0.6) + 30, cu(1, 0.6) + 38), 36);
          }
          if (P === "step2") {
            const k1 = seg(f, cu(1, 0.1), cu(1, 0.1) + 8);
            if (k1 > 0) {
              c.save(); c.globalAlpha = clamp(k1 * 3);
              const y2 = chat(c, 50, yE + 30, W - 100, "the question", [{ me: true, t: T.q5, k: 1 }], 32);
              pageCard(c, 90, y2 + 10, W - 180, 48, "Before first use: transit bolts", T.p48, "knocking", seg(f, cu(1, 0.5) + 15, cu(1, 0.5) + 25));
              c.restore();
            }
            chip(c, "different words, same meaning: found", W / 2, 1400, "#dcfce7", "#14532d", seg(f, cu(1, 0.6) + 35, cu(1, 0.6) + 43), 40);
          }
          if (P === "step3") {
            chip(c, "--- page 48 --- … --- page 113 --- … --- page 77 ---", W / 2, yE + 80, "#e0e7ff", "#1e3a8a", seg(f, ln.from + 16, ln.from + 24), big(c, "--- page 48 --- … --- page 113 --- … --- page 77 ---", 34));
            chip(c, "Part 1's rules: only from it · the page · or \"Not in the document\"", W / 2, yE + 190, "#dcfce7", "#14532d", seg(f, ln.from + 28, ln.from + 36), big(c, "Part 1's rules: only from it · the page · or \"Not in the document\"", 36));
            chip(c, `~230 tokens a question, not ${T.whole}`, W / 2, yE + 310, "#1e293b", "#fde68a", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 48);
          }
        } else if (P === "test") {
          c.font = SANS(fit(c, "OUR TEST · 10 QUESTIONS", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · 10 QUESTIONS", W / 2, 320);
          c.font = SANS(32, 700); c.fillStyle = "#cbd5e1"; c.fillText("is the right page in the top 3?", W / 2, 375);
          const rows: [string, string, string, number][] = [["by meaning", "8/10", GREEN, cu(1, 0.3)], ["Part 1's word search", "7/10", "#fbbf24", cu(2, 0.6)], ["both mixed, the simple way", "6/10", "#f87171", cu(3, 0.85) + 20]];
          rows.forEach(([a, v, col, t0], q) => {
            const k = seg(f, t0 - 2, t0 + 6); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 430 + q * 210;
            c.fillStyle = "#1e293b"; rrect(c, 40, y, W - 80, 180, 22); c.fill();
            c.font = SANS(fit(c, a, 620, 44, 800), 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(a, 80, y + 108);
            c.font = SANS(80, 900); c.textAlign = "right"; c.fillStyle = col; c.fillText(v, W - 80, y + 120); c.restore();
          });
          chip(c, "a small free AI on our computer · every reply read by hand", W / 2, 1110, "#e0e7ff", "#1e3a8a", seg(f, cu(2, 0.6) + 30, cu(2, 0.6) + 38), big(c, "a small free AI on our computer · every reply read by hand", 36));
          chip(c, "mixing isn't automatically better: test it", W / 2, 1230, "#1e293b", "#fca5a5", seg(f, cu(3, 0.85) + 45, cu(3, 0.85) + 53), big(c, "mixing isn't automatically better: test it", 42));
        } else if (P === "miss") {
          const y = chat(c, 50, 300, W - 100, "Washing machine help · 3 pages by meaning", [{ me: true, t: T.qMiss, k: 1 }, { me: false, t: T.missReply, k: seg(f, cu(1, 0.4), cu(1, 0.4) + 6) }], 36);
          chip(c, "the search brought: safety pages 13, 18, 19", W / 2, y + 60, "#1e293b", "#e2e8f0", seg(f, ln.from + 12, ln.from + 20), big(c, "the search brought: safety pages 13, 18, 19", 40));
          stamp(c, "✗ MISSED: CHILD LOCK, PAGE 96", W / 2, y + 200, seg(f, ln.from + 20, ln.from + 28));
          stamp(c, "✓ IT DIDN'T MAKE ONE UP", W / 2, y + 340, seg(f, cu(1, 0.5) + 30, cu(1, 0.5) + 38), "#16a34a", 0.04);
        } else if (P === "habit") {
          c.font = SANS(fit(c, "BEFORE YOU TRUST IT: 10 QUESTIONS", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BEFORE YOU TRUST IT: 10 QUESTIONS", W / 2, 320);
          const hits: boolean[] = T.hits;
          const k0 = seg(f, cu(1, 0.1), cu(1, 0.1) + 8);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3);
            c.font = SANS(30, 800); c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText("question", 80, 410); c.textAlign = "center"; c.fillText("right page", 640, 410); c.fillText("found?", 900, 410);
            c.restore();
          }
          T.rows.forEach((r: [string, number], q: number) => {
            const k = seg(f, cu(1, 0.1) + q * 3, cu(1, 0.1) + q * 3 + 6); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 440 + q * 82;
            c.fillStyle = q % 2 ? "#111827" : "#1e293b"; c.fillRect(50, y, W - 100, 78);
            c.font = SANS(fit(c, r[0], 470, 30, 700), 700); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(r[0], 80, y + 50);
            c.font = SANS(34, 800); c.textAlign = "center"; c.fillStyle = "#e2e8f0"; c.fillText(String(r[1]), 640, y + 52);
            const kH = seg(f, cu(1, 0.7) + 30 + q * 2, cu(1, 0.7) + 34 + q * 2);
            if (kH > 0) { c.font = SANS(44, 900); c.fillStyle = hits[q] ? GREEN : "#f87171"; c.fillText(hits[q] ? "✓" : "✗", 900, y + 56); }
            c.restore();
          });
          chip(c, "ours: 8 of 10", W / 2, 1330, "#dcfce7", "#14532d", seg(f, cu(1, 0.9) + 55, cu(1, 0.9) + 63), 50);
        } else if (P === "loop") {
          c.font = SANS(fit(c, "NEXT · EP54: AN AGENT WITH TOOLS", W - 120, 62), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("NEXT · EP54: AN AGENT WITH TOOLS", W / 2, 400);
          const kf = seg(f, cu(1, 0.02), cu(1, 0.02) + 8);
          if (kf > 0) {
            c.save(); c.globalAlpha = clamp(kf * 3);
            const y = chat(c, 50, 500, W - 100, "Washing machine help · 3 pages by meaning", [{ me: true, t: T.q, k: 1 }, { me: false, t: T.reply, k: 1 }], 36);
            chip(c, `${T.top3} tokens, not ${T.whole}`, W / 2, y + 70, "#dcfce7", "#14532d", 1, 50);
            c.restore();
          }
        }
      }} />
    </>
  );
};

export const RAG53_SCENES = { sk_rag53: StRag };
