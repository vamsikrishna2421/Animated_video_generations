import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg, chat, editor } from "./TutorialCrayon";

// EP52 "Build RAG over your PDFs, Part 1" (series/scripts/ep52_rag_pdf_part1.md): a screen tutorial, one narrator.
// A 5-page warranty card we wrote (a made-up MG-750 mixer). Our first bot searched for "the best page", read the cover
// and said "Not in the document" about a motor covered for 5 years (₹1,450 vs ₹0). The steps: read the PDF page by
// page; a short PDF: send every page with its number; the rules (only from the document, the page, "not in the
// document"). Our test: no PDF 0/10, the first search 1/10, all 5 pages 9/10. The miss: "not in the document", but page
// 4 had it. The texts come from the spec (data.t), copied from series/scripts/ep52_demo/.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;

// a PDF page thumbnail: a title, a few lines, an optional lit line
const pdfPage = (c: Ctx, x: number, y: number, w: number, h: number, n: number, title: string, lines: string[], lit = -1, kLit = 0, tint = "#ffffff") => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, x + 8, y + 10, w, h, 10); c.fill();
  c.fillStyle = tint; rrect(c, x, y, w, h, 10); c.fill();
  c.font = SANS(fit(c, title, w - 30, 26, 900), 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(title, x + 16, y + 40);
  let yy = y + 78;
  lines.forEach((l, i) => {
    c.font = SANS(20, 600);
    wrap(c, l, w - 32).forEach((t) => {
      if (i === lit && kLit > 0) { c.save(); c.globalAlpha = 0.6 * clamp(kLit * 3); c.fillStyle = "#fde047"; c.fillRect(x + 12, yy - 18, c.measureText(t).width + 8, 25); c.restore(); }
      c.fillStyle = i === lit ? INK : "#475569"; c.fillText(t, x + 16, yy); yy += 27;
    });
  });
  c.font = SANS(18, 700); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(`page ${n}`, x + w / 2, y + h - 14);
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, k: number, rot = -0.08) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  c.font = SANS(52, 900); const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -52, w, 82, 14); c.fill();
  c.strokeStyle = RED; c.lineWidth = 7; rrect(c, -w / 2, -52, w, 82, 14); c.stroke();
  c.fillStyle = RED; c.textAlign = "center"; c.fillText(t, 0, 8); c.restore();
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
    if (["title", "test"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.45} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "cover") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.5} />, <Sfx key={k("z")} at={cue(i, 1, 0.4)} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (["step1", "step2", "step2b", "step3"].includes(b.prop)) sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("t")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.5} />, <Sfx key={k("b")} at={cue(i, 2, 0.75) - 8} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={cue(i, 2, 0.75) - 4} src={CLAP} vol={0.45} />);
    if (b.prop === "miss") sfx.push(<Sfx key={k("z")} at={at + 6} src="reel/sfx_buzz.wav" vol={0.45} />, <Sfx key={k("d")} at={cue(i, 1, 0.4) - 4} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(5252 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        const pg: string[][] = T.pages;   // [title, line, line...] per page
        if (P === "hook") {
          block(c, 50, 250, "OUR FIRST BOT", "pay ₹1,450", "#f87171");
          block(c, 560, 250, "PAGE 3 OF YOUR PDF", "₹0", "#4ade80");
          const y = chat(c, 50, 450, W - 100, "Warranty bot · reads your PDF", [
            { me: true, t: T.q1, k: 1 }, { me: false, t: T.firstReply, k: 1, red: true },
          ], 36);
          stamp(c, "✗ IT READ THE COVER", W / 2, y + 60, loopOn ? 1 : seg(f, cu(1, 0.6), cu(1, 0.6) + 8));
          pdfPage(c, 300, y + 140, 480, 330, 3, pg[2][0], pg[2].slice(1), 0, 1, "#fefce8");
        } else if (P === "cover") {
          pdfPage(c, 60, 300, 450, 560, 1, pg[0][0], pg[0].slice(1), -1, 0);
          pdfPage(c, 570, 300, 450, 560, 3, pg[2][0], pg[2].slice(1), 0, seg(f, ln.from, ln.from + 10), "#fefce8");
          chip(c, "what the bot read", 285, 930, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 34);
          chip(c, "where the answer was", 795, 930, "#dcfce7", "#14532d", 1, 34);
        } else if (P === "title") {
          c.font = SANS(fit(c, "BUILD IT RIGHT", W - 120, 76), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BUILD IT RIGHT", W / 2, 420);
          c.font = SANS(40, 800); c.fillStyle = "#e2e8f0"; c.fillText("answers from your own PDF, with the page", W / 2, 490);
          ["1 · read the PDF, page by page", "2 · give it the right pages", "3 · the rules"].forEach((t, q) => {
            const k = seg(f, cu(1, 0.2) + q * 8, cu(1, 0.2) + q * 8 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 600 + q * 180; c.fillStyle = "#1e293b"; rrect(c, 100, y, W - 200, 140, 22); c.fill();
            c.font = SANS(fit(c, t, W - 260, 46, 900), 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, W / 2, y + 88); c.restore();
          });
        } else if (P === "step1" || P === "step2b" || P === "step3") {
          const code: string[] = T.code;
          const label = P === "step1" ? "STEP 1 · read the PDF" : P === "step2b" ? "STEP 2 · short PDF: send every page" : "STEP 3 · the rules";
          chip(c, label, W / 2, 300, "#fde68a", INK, 1, 40);
          const shown = P === "step1" ? 2 * seg(f, ln.from + 2, cu(1, 0.6)) : P === "step2b" ? 2 + seg(f, ln.from + 2, cu(1, 0.6)) : 3 + 3 * seg(f, ln.from + 2, cu(1, 0.7));
          const hi = P === "step1" ? [0, 1] : P === "step2b" ? [2] : [3, 4, 5];
          const yE = editor(c, 30, 360, W - 60, code, shown, hi, 25, "warranty_bot.py");
          if (P === "step2b") {
            chip(c, "--- page 1 --- ... --- page 5 ---", W / 2, yE + 70, "#e0e7ff", "#1e3a8a", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 34);
            chip(c, "5 pages ≈ 450 tokens a question", W / 2, yE + 170, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.7), cu(1, 0.7) + 8), 34);
          }
          if (P === "step3") chip(c, "answer only from it · say the page · or \"Not in the document\"", W / 2, yE + 80, "#dcfce7", "#14532d", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 30);
        } else if (P === "step2") {   // the first try: "the page with the most words in common" picked the cover
          chip(c, "STEP 2 · our first try: search for the best page", W / 2, 300, "#fde68a", INK, 1, 36);
          pg.forEach((p, q) => { const x = 40 + q * 205; pdfPage(c, x, 380, 190, 270, q + 1, p[0], [], -1, 0, q === 0 ? "#fee2e2" : "#ffffff"); });
          const k9 = seg(f, cu(1, 0.4), cu(1, 0.4) + 10);
          if (k9 > 0) {
            c.save(); c.globalAlpha = clamp(k9 * 3); c.font = SANS(fit(c, "it picked the cover: 9 of 10 questions", W - 100, 52), 900); c.fillStyle = "#f87171"; c.textAlign = "center";
            c.fillText("it picked the cover: 9 of 10 questions", W / 2, 760); c.restore();
            for (let q = 0; q < 10; q++) { c.fillStyle = q === 5 ? "#4ade80" : "#f87171"; c.beginPath(); c.arc(170 + q * 82, 860, 26, 0, 7); c.fill(); c.font = SANS(22, 900); c.fillStyle = "#0b1220"; c.textAlign = "center"; c.fillText(q === 5 ? "p5" : "p1", 170 + q * 82, 868); }
          }
          chip(c, "every question said \"MG-750\": only the cover did too", W / 2, 1000, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.75), cu(1, 0.75) + 8), 32);
        } else if (P === "test") {
          c.font = SANS(fit(c, "OUR TEST · 10 QUESTIONS ON THE PDF", W - 100, 54), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · 10 QUESTIONS ON THE PDF", W / 2, 320);
          c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.fillText("a small free AI on our computer · every reply read by hand", W / 2, 370);
          const rows: [string, string, string, number][] = [["no PDF", "0/10", "#f87171", cu(1, 0.2)], ["first search (read the cover)", "1/10", "#f87171", cu(1, 0.6)], ["all 5 pages, with page numbers", "9/10", "#4ade80", cu(2, 0.75)]];
          rows.forEach(([a, v, col, t0], q) => {
            const k = seg(f, t0 - 2, t0 + 6); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 430 + q * 210;
            c.fillStyle = "#1e293b"; rrect(c, 40, y, W - 80, 180, 22); c.fill();
            c.font = SANS(fit(c, a, 600, 40, 800), 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(a, 80, y + 108);
            c.font = SANS(76, 900); c.textAlign = "right"; c.fillStyle = col; c.fillText(v, W - 80, y + 118); c.restore();
          });
          chip(c, "the page right on 7 of 8 answers that gave one", W / 2, 1150, "#e0e7ff", "#1e3a8a", seg(f, cu(2, 0.9), cu(2, 0.9) + 8), 32);
        } else if (P === "miss") {
          const y = chat(c, 50, 300, W - 100, "Warranty bot · all 5 pages", [{ me: true, t: T.q3, k: 1 }, { me: false, t: "Not in the document.", k: 1, red: true }], 36);
          pdfPage(c, 260, y + 30, 560, 380, 4, pg[3][0], pg[3].slice(1), 0, seg(f, cu(1, 0.3), cu(1, 0.3) + 8), "#fefce8");
          chip(c, "it says \"not there\"? open the PDF yourself", W / 2, y + 480, "#dcfce7", "#14532d", seg(f, cu(1, 0.7), cu(1, 0.7) + 8), 36);
        } else if (P === "loop") {
          c.font = SANS(fit(c, "300 pages? That's Part 2.", W - 120, 70), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("300 pages? That's Part 2.", W / 2, 620);
          c.font = SANS(40, 800); c.fillStyle = "#e2e8f0"; c.fillText("search by meaning", W / 2, 700);
          c.font = SANS(fit(c, "₹1,450, or free?", W - 120, 90), 900); c.fillStyle = "#f8fafc"; c.fillText("₹1,450, or free?", W / 2, 950);
        }
      }} />
    </>
  );
};

export const RAG52_SCENES = { sk_rag52: StRag };
