import React from "react";
import { Ctx, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 40 "Same Loan, Two Answers" (series/scripts/creative40_same_loan.md): a TV crime-show case board, one
// narrator and the screener's verdicts. One made-up applicant (₹45,000 a month, 4 years in the job, a bike EMI never
// missed, asking ₹2 lakh over 24 months) written different ways; a small free AI on our computer as the loan screener,
// 10 fresh chats each, read by hand (series/scripts/creative40_demo): "low risk" for the letter 5/10, the phone-chat
// message 0/10, Telugu in English letters 0/10 (once "a history of missing payments": false), the builder's "ignore the
// language" 1/10, a plain list 0/10, the AI's own polished letter 1/10. Nature 2024: harsher AI judgments for the same
// words in a different English. RBI (Commercial Banks, Responsible Business Conduct Directions 2025, para 331): banks
// must give the main reasons for a rejected loan in writing.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const STAMP = "brand/audio/brand_stamp.wav";
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#d97706";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const SERIF = (s: number, w = 400) => `${w} ${s}px Georgia, "Times New Roman", serif`;
const BX = 40, BY = 196, BW = 1000, BH = 1150;   // the cork board

// the detective's wall: a dark room, the cork board, a lamp's glow from above
const wall = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#1c1917"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#6b4a2e"; rrect(c, BX - 14, BY - 14, BW + 28, BH + 28, 18); c.fill();
  c.fillStyle = "#c8a165"; rrect(c, BX, BY, BW, BH, 10); c.fill();
  c.save(); c.globalAlpha = 0.18; c.fillStyle = "#7c5a3a";   // cork speckle (fixed)
  for (let q = 0; q < 220; q++) { const x = BX + ((q * 397) % BW), y = BY + ((q * 613) % BH); c.fillRect(x, y, 4, 3); }
  c.restore();
  const g = c.createRadialGradient(540, 120, 40, 540, 300, 900); g.addColorStop(0, "rgba(253,230,138,0.18)"); g.addColorStop(1, "rgba(0,0,0,0.28)");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};
const pin = (c: Ctx, x: number, y: number, col = RED) => { c.beginPath(); c.arc(x, y, 13, 0, 7); c.fillStyle = col; c.fill(); c.beginPath(); c.arc(x - 4, y - 4, 4, 0, 7); c.fillStyle = "rgba(255,255,255,0.6)"; c.fill(); };
const band = (c: Ctx, t: string, y = 262) => {
  c.fillStyle = "#0f172a"; rrect(c, BX + 20, y - 52, BW - 40, 80, 12); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, t, BW - 80, 40, 900), 900); c.fillStyle = "#fde68a"; c.fillText(t, 540, y + 2);
};
const label = (c: Ctx, t: string, x: number, y: number, col = INK) => { c.font = SANS(30, 900); c.fillStyle = col; c.textAlign = "left"; c.fillText(t, x, y); };
// Exhibit A: the letter (paper, serif type)
const letter = (c: Ctx, T: Record<string, any>, x: number, y: number, w: number, h: number, rot: number, tagT: string) => {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(8, 10, w, h); c.fillStyle = "#fffdf5"; c.fillRect(0, 0, w, h);
  label(c, tagT, 24, 50, "#92400e");
  c.font = SERIF(29); c.fillStyle = "#1f2937"; c.textAlign = "left";
  wrap(c, T.letterText, w - 48).slice(0, Math.floor((h - 90) / 38)).forEach((t, q) => c.fillText(t, 24, 100 + q * 38));
  pin(c, w / 2, 16); c.restore();
};
// Exhibit B / C: a phone with one chat bubble
const chatPhone = (c: Ctx, text: string, x: number, y: number, w: number, h: number, rot: number, tagT: string) => {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(0,0,0,0.3)"; rrect(c, 8, 10, w, h, 40); c.fill();
  c.fillStyle = "#0b0f17"; rrect(c, 0, 0, w, h, 40); c.fill();
  c.fillStyle = "#e7ddd3"; rrect(c, 16, 60, w - 32, h - 80, 26); c.fill();
  c.font = SANS(fit(c, tagT, w - 52, 28, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(tagT, 26, 42);
  c.font = SANS(32, 700); const lines = wrap(c, text, w - 110).slice(0, Math.floor((h - 150) / 42));
  c.fillStyle = "#dcf8c6"; rrect(c, 40, 90, w - 70, lines.length * 42 + 40, 22); c.fill();
  c.fillStyle = INK; lines.forEach((t, q) => c.fillText(t, 60, 138 + q * 42));
  pin(c, w / 2, 16); c.restore();
};
// a verdict tag under an exhibit: face down ("?") until it flips (k: 0 -> 1)
const verdictTag = (c: Ctx, x: number, y: number, w: number, top: string, sub: string, col: string, k: number) => {
  const flip = Math.abs(Math.cos(Math.PI * clamp(k)));
  const shown = k >= 0.5;
  c.save(); c.translate(x, y); c.scale(1, Math.max(0.04, flip));
  c.fillStyle = "rgba(0,0,0,0.3)"; rrect(c, -w / 2 + 6, -70, w, 160, 18); c.fill();
  c.fillStyle = shown ? "#fff" : "#334155"; rrect(c, -w / 2, -76, w, 160, 18); c.fill();
  c.textAlign = "center";
  if (shown) {
    c.strokeStyle = col; c.lineWidth = 7; rrect(c, -w / 2, -76, w, 160, 18); c.stroke();
    c.font = SANS(fit(c, top, w - 30, 62, 900), 900); c.fillStyle = col; c.fillText(top, 0, 0);
    c.font = SANS(fit(c, sub, w - 30, 32, 800), 800); c.fillStyle = "#475569"; c.fillText(sub, 0, 52);
  } else { c.font = SANS(96, 900); c.fillStyle = "#fde68a"; c.fillText("?", 0, 34); }
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.08, maxW = 940) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); while (c.measureText(t).width > maxW && s > 28) { s -= 2; c.font = SANS(s, 900); }
  const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
const tiles = (c: Ctx, cols: string[], x: number, y: number, k: number, h = 56, w = 70, gap = 8) => {
  cols.forEach((col, q) => {
    const kk = clamp((k * 10 - q) * 1.5); if (kk <= 0) return;
    c.save(); c.globalAlpha = kk; c.fillStyle = col; rrect(c, x + q * (w + gap), y, w, h, 12); c.fill(); c.restore();
  });
};
const card = (c: Ctx, x: number, y: number, w: number, h: number, bg: string, k: number, rot = 0) => {
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x + w / 2, y + h / 2 + (1 - easeOut(clamp(k * 1.5))) * 40); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(0,0,0,0.3)"; rrect(c, 8, 10, w, h, 18); c.fill(); c.fillStyle = bg; rrect(c, 0, 0, w, h, 18); c.fill();
  pin(c, w / 2, 14);
};
// frame 1: the two exhibits, the same-facts band, the clash, readable with the sound off
const frame1 = (c: Ctx, T: Record<string, any>, kTag: number) => {
  band(c, T.band);
  letter(c, T, 70, 330, 450, 560, -0.025, T.exA);
  chatPhone(c, T.msgB, 570, 330, 440, 560, 0.025, T.exB);
  c.save(); c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); c.moveTo(295, 346); c.quadraticCurveTo(540, 300, 790, 346); c.stroke(); c.restore();
  pin(c, 540, 323, "#facc15");
  verdictTag(c, 295, 1000, 420, T.tagA, T.tagAsub, GREEN, kTag);
  verdictTag(c, 790, 1000, 420, T.tagB, T.tagBsub, RED, kTag);
};
const clash = (c: Ctx, T: Record<string, any>) => {
  c.fillStyle = "#0f172a"; rrect(c, BX + 20, 1116, BW - 40, 214, 16); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, T.clash, BW - 90, 84, 900), 900); c.fillStyle = "#fef2f2"; c.fillText(T.clash, 540, 1212);
  c.font = SANS(fit(c, T.which, BW - 90, 56, 900), 900); c.fillStyle = "#fde68a"; c.fillText(T.which, 540, 1290);
};

const StLoan: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const te = !!s.data.handle;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (i > 0 && beats[i - 1].prop !== b.prop && b.prop !== "loop") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("s1")} at={2} src={STAMP} vol={0.7} />, <Sfx key={k("s1c")} at={2} src="audio/sfx_snap.wav" vol={0.3} />, <Sfx key={k("s2")} at={cue(i, 1, 0.5)} src={STAMP} vol={0.7} />, <Sfx key={k("s2c")} at={cue(i, 1, 0.5)} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "reveal") sfx.push(<Sfx key={k("f")} at={cue(i, 1, 0.1)} src="audio/sfx_snap.wav" vol={0.35} />, <Sfx key={k("h")} at={cue(i, 1, 0.1)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />, <Sfx key={k("x")} at={cue(i, 2, 0.2)} src="reel/sfx_buzz.wav" vol={0.28} />, <Sfx key={k("st")} at={cue(i, 2, 0.2) + 16} src={STAMP} vol={0.6} />, <Sfx key={k("stc")} at={cue(i, 2, 0.2) + 16} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "method") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "telugu") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("x")} at={cue(i, 1, 0.3)} src="reel/sfx_glitch.wav" vol={0.25} />, <Sfx key={k("h")} at={cue(i, 2, 0.2)} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.65} />, <Sfx key={k("st")} at={cue(i, 2, 0.2)} src={STAMP} vol={0.85} />, <Sfx key={k("stc")} at={cue(i, 2, 0.2)} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "fixes") (T.fixes as [string, number, string, number, number][]).forEach(([, , , cq, off], q) => { const t = (cq === 0 ? at + 2 : cue(i, cq, 0.3)) + off; sfx.push(<Sfx key={k("p" + q)} at={t} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("z" + q)} at={t + 10} src="reel/sfx_buzz.wav" vol={0.16} />); });
    if (b.prop === "meaning") { [0, 1].forEach((q) => sfx.push(<Sfx key={k("s" + q)} at={cue(i, 1, 0.2) + q * 14 + 4} src={STAMP} vol={0.4} />, <Sfx key={k("sc" + q)} at={cue(i, 1, 0.2) + q * 14 + 4} src="audio/sfx_snap.wav" vol={0.25} />)); [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("m" + q)} at={cue(i, 2, 0.1) + q * 8 + 3} src={STAMP} vol={0.45} />, <Sfx key={k("mc" + q)} at={cue(i, 2, 0.1) + q * 8 + 3} src="audio/sfx_snap.wav" vol={0.25} />)); sfx.push(<Sfx key={k("h")} at={cue(i, 2, 0.1)} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />); }
    if (b.prop === "big") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("c")} at={cue(i, 1, 0.3)} src="audio/sfx_chime.wav" vol={0.22} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.1)} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("st")} at={cue(i, 1, 0.1)} src={STAMP} vol={0.6} />, <Sfx key={k("stc")} at={cue(i, 1, 0.1)} src="audio/sfx_snap.wav" vol={0.3} />, <Sfx key={k("ok")} at={cue(i, 1, 0.7)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("st")} at={slam} src={STAMP} vol={0.7} />, <Sfx key={k("stc")} at={slam} src="audio/sfx_snap.wav" vol={0.3} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        wall(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          frame1(c, T, 0); clash(c, T);
          if (P === "hook" && !loopOn) {   // the screener's two verdicts stamp in on the voice
            stamp(c, T.v1, 540, 560, 76, GREEN, seg(f, 2, 8), -0.08, 400);
            stamp(c, T.v2, 540, 720, 76, AMBER, seg(f, cu(1, 0.5), cu(1, 0.5) + 6), 0.06, 400);
          }
        } else if (P === "question") {
          frame1(c, T, 0); clash(c, T);
        } else if (P === "reveal") {
          const kA = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 10), kB = seg(f, cu(2, 0.2) - 2, cu(2, 0.2) + 10);
          band(c, T.band);
          letter(c, T, 70, 330, 450, 560, -0.025, T.exA);
          chatPhone(c, T.msgB, 570, 330, 440, 560, 0.025, T.exB);
          verdictTag(c, 295, 1000, 420, T.tagA, T.tagAsub, GREEN, kA);
          verdictTag(c, 790, 1000, 420, T.tagB, T.tagBsub, RED, kB);
          stamp(c, T.sameFacts, 540, 1220, 84, RED, seg(f, cu(2, 0.2) + 16, cu(2, 0.2) + 24), -0.05);
        } else if (P === "method") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          band(c, T.band);
          if (k0 > 0) {
            card(c, 90, 340, 900, 470, "#fffdf5", k0, -0.015);
            c.textAlign = "left"; c.font = SANS(fit(c, T.appHead, 820, 54, 900), 900); c.fillStyle = "#92400e"; c.fillText(T.appHead, 40, 100);
            c.font = SANS(48, 800); c.fillStyle = INK; (T.appLines as string[]).forEach((t, q) => { c.font = SANS(fit(c, t, 820, 48, 800), 800); c.fillText(t, 40, 190 + q * 80); });
            c.restore();
          }
          if (k1 > 0) {
            card(c, 90, 870, 900, 340, "#e0f2fe", k1, 0.012);
            c.textAlign = "left"; c.font = SANS(fit(c, T.scrHead, 820, 50, 900), 900); c.fillStyle = "#075985"; c.fillText(T.scrHead, 40, 96);
            (T.scrLines as string[]).forEach((t, q) => { c.font = SANS(fit(c, t, 820, 46, 800), 800); c.fillStyle = INK; c.fillText(t, 40, 180 + q * 74); });
            c.restore();
          }
        } else if (P === "telugu") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8), k2 = seg(f, cu(2, 0.2), cu(2, 0.2) + 8);
          band(c, T.band);
          if (k0 > 0) { c.save(); c.globalAlpha = clamp(k0 * 3); chatPhone(c, T.msgC, 70, 330, 560, 470, -0.02, T.exC); c.restore(); verdictTag(c, 820, 520, 330, T.tagC, T.tagCsub, RED, seg(f, ln.from + 10, ln.from + 22)); }
          if (k1 > 0) {
            card(c, 70, 860, 940, 300, "#f8fafc", k1, 0.01);
            c.textAlign = "left"; c.font = SANS(30, 900); c.fillStyle = "#64748b"; c.fillText(T.replyLab, 36, 60);
            c.font = SANS(40, 800); const ws = wrap(c, T.reply, 860).slice(0, 4);
            ws.forEach((t, q) => {
              const at = t.indexOf(T.replyHit.split(" ")[0]);
              if (q >= 1 && (t.includes("history") || t.includes("missing") || t.includes("payments"))) { c.fillStyle = "rgba(252,165,165,0.8)"; c.fillRect(30, 76 + q * 52, c.measureText(t).width + 14, 50); }
              void at; c.fillStyle = INK; c.fillText(t, 36, 116 + q * 52);
            });
            c.restore();
          }
          stamp(c, T.falseT, 800, 760, 130, RED, k2, -0.12, 440);
          chip(c, T.record, 540, 1262, "#14532d", "#f0fdf4", k2, fit(c, T.record, 900, 48, 900));
        } else if (P === "fixes") {
          band(c, T.band);
          const rows = T.fixes as [string, number, string, number, number][];
          rows.forEach(([t, n, sub, cq, off], q) => {
            const t0 = (cq === 0 ? ln.from + 2 : cu(cq, 0.3)) + off;
            const k = seg(f, t0 - 2, t0 + 8);
            if (k <= 0) return;
            const y = 330 + q * 250;
            card(c, 70, y, 940, 220, "#fffdf5", k, q % 2 ? 0.01 : -0.01);
            c.textAlign = "left"; c.font = SANS(fit(c, t, 860, 44, 900), 900); c.fillStyle = INK; c.fillText(t, 36, 74);
            c.font = SANS(34, 700); c.fillStyle = "#475569"; c.fillText(sub, 36, 120);
            c.restore();
            tiles(c, Array(10).fill(0).map((_, z) => (z < n ? GREEN : RED)), 110, y + 140, seg(f, t0 + 6, t0 + 26), 52, 60, 8);
            c.save(); c.globalAlpha = clamp(k * 3); c.textAlign = "right"; c.font = SANS(70, 900); c.fillStyle = n > 0 ? AMBER : RED; c.fillText(`${n}/10`, 990, y + 196); c.restore();
          });
          c.textAlign = "center"; c.font = SANS(fit(c, T.fixFoot, 940, 34, 800), 800); c.fillStyle = "#1c1917"; c.fillText(T.fixFoot, 540, 1330);
        } else if (P === "meaning") {
          band(c, T.lettersHead);
          const t1 = cu(2, 0.1), tf = cu(1, 0.2);   // the question, then the two letters' counts [1], then the stamps [2]
          if (f < t1) {   // the three formal letters we wrote, each with its count (the script review: was it that one letter?)
            (T.letters as [string, number, string][]).forEach(([name, n], q) => {
              const k = seg(f, ln.from + 2 + q * 10, ln.from + 10 + q * 10); if (k <= 0) return;
              card(c, 70 + q * 320, 360, 300, 420, "#fffdf5", k, (q - 1) * 0.03);
              c.textAlign = "center"; c.font = SANS(34, 900); c.fillStyle = "#92400e"; c.fillText(name, 150, 70);
              c.font = SERIF(30); c.fillStyle = "#1f2937"; c.textAlign = "left";
              wrap(c, (T.letters as [string, number, string][])[q][2], 250).slice(0, 7).forEach((tt, z) => c.fillText(tt, 26, 126 + z * 40));
              c.restore();
              verdictTag(c, 220 + q * 320, 900, 280, `LOW ${n}/10`, "same facts", n >= 5 ? GREEN : n > 0 ? AMBER : RED, q === 0 ? 1 : seg(f, tf + (q - 1) * 14, tf + (q - 1) * 14 + 10));
            });
            c.textAlign = "center"; c.font = SANS(fit(c, T.which2, 940, 44, 900), 900); c.fillStyle = "#1c1917"; c.fillText(T.which2, 540, 1110);
          } else {
            const lines = T.meaning as string[];
            lines.forEach((t, q) => stamp(c, t, 540, 470 + q * 210, 92, q === 2 ? RED : "#0f172a", seg(f, t1 + q * 8, t1 + 6 + q * 8), q % 2 ? 0.04 : -0.04));
            const kC = seg(f, cu(2, 0.6) - 2, cu(2, 0.6) + 8);
            if (kC > 0) chip(c, T.meaningSub, 540, 1180, "#0f172a", "#fde68a", kC, fit(c, T.meaningSub, 900, 46, 900));
          }
        } else if (P === "big") {
          const k0 = seg(f, ln.from + 2, ln.from + 12), k1 = seg(f, cu(1, 0.2) - 2, cu(1, 0.2) + 8);
          band(c, T.bigBand);
          if (k0 > 0) {
            card(c, 80, 340, 920, 820, "#f8fafc", k0, -0.01);
            c.fillStyle = "#0f172a"; rrect(c, 0, 0, 920, 110, 18); c.fill(); c.fillRect(0, 60, 920, 50);
            c.textAlign = "left"; c.font = SANS(44, 900); c.fillStyle = "#f8fafc"; c.fillText(T.bigHead, 40, 74);
            c.font = SANS(54, 900); c.fillStyle = INK; wrap(c, T.bigTitle, 840).slice(0, 4).forEach((t, q) => c.fillText(t, 40, 200 + q * 66));
            c.restore();
          }
          if (k1 > 0) {
            (T.bigChips as string[]).forEach((t, q) => chip(c, t, 540, 820 + q * 120, q === 0 ? "#fee2e2" : "#ffedd5", "#7f1d1d", seg(f, cu(1, 0.2) + q * 6, cu(1, 0.2) + q * 6 + 6), fit(c, t, 800, 50, 800)));
            c.save(); c.globalAlpha = clamp(k1 * 3); c.textAlign = "center"; c.font = SANS(fit(c, T.bigSrc, 860, 36, 700), 700); c.fillStyle = "#475569"; c.fillText(T.bigSrc, 540, 1110); c.restore();
          }
        } else if (P === "rule") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8), k2 = seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          chip(c, T.here, 540, 300, "#334155", "#f8fafc", k0, fit(c, T.here, 900, 46, 900));
          stamp(c, T.rule1, 540, 520, 84, RED, k1, -0.04);
          if (k2 > 0) {
            card(c, 70, 680, 940, 420, "#dcfce7", k2, 0.008);
            c.textAlign = "center"; c.font = SANS(fit(c, T.rule2, 860, 66, 900), 900); c.fillStyle = "#14532d"; c.fillText(T.rule2, 470, 140);
            c.font = SANS(46, 800); c.fillStyle = "#166534"; wrap(c, T.rule3, 860).slice(0, 2).forEach((t, q) => c.fillText(t, 470, 226 + q * 58));
            c.font = SANS(fit(c, T.ruleSrc, 880, 34, 700), 700); c.fillStyle = "#475569"; c.fillText(T.ruleSrc, 470, 372);
            c.restore();
          }
          chip(c, T.builder, 540, 1230, "#0f172a", "#93c5fd", seg(f, cu(1, 0.8), cu(1, 0.8) + 8), fit(c, T.builder, 900, 50, 800));
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const LOAN40_SCENES = { sk_loan40: StLoan };
