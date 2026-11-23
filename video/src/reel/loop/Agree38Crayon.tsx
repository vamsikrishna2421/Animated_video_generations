import React from "react";
import { Ctx, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 38 "Great Decision, Right?" (series/scripts/creative38_agree.md): a calm explainer, one narrator. The same
// car (₹12 lakh, a 5-year loan) on the same salary (₹40,000): asked excited ("Great decision, right?"), a small free AI
// opened 10 of 10 replies with praise; asked plainly, 0 of 10 (series/scripts/creative38_demo, read by hand). The EMI:
// ₹24,910, 62% of the salary. Why: chat AIs are tuned on thumbs-up; OpenAI rolled back a ChatGPT update in April 2025
// for being "overly flattering or agreeable". The rule: ask it flat, or "don't just agree with me, work out the payment".
// The reply openings on screen are the test's own.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", GOLD = "#ca8a04";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;

const bg = (c: Ctx, W: number, H: number) => { c.fillStyle = "#fff7ed"; c.fillRect(0, 0, W, H); c.fillStyle = "#ffedd5"; c.fillRect(0, 1200, W, H - 1200); };
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// one phone chat: a label, the person's bubble, the AI's bubble, a stat under it
const chat = (c: Ctx, x: number, y: number, w: number, lab: string, labCol: string, ask: string, reply: string, stat: string, statCol: string, dim: number, party: number) => {
  c.save(); c.globalAlpha = 1 - 0.55 * dim;
  c.fillStyle = "#111827"; rrect(c, x, y, w, 760, 36); c.fill(); c.fillStyle = "#f1f5f9"; rrect(c, x + 14, y + 14, w - 28, 732, 26); c.fill();
  c.fillStyle = labCol; rrect(c, x + 14, y + 14, w - 28, 74, 26); c.fill(); c.fillRect(x + 14, y + 60, w - 28, 28);
  c.font = SANS(fit(c, lab, w - 70, 36, 900), 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(lab, x + w / 2, y + 64);
  if (party > 0) {   // a little confetti, behind the bubbles (stills: it covered the text)
    const cols = ["#f59e0b", "#ec4899", "#22c55e", "#3b82f6"];
    for (let q = 0; q < 18; q++) { const px = x + 30 + ((q * 97) % (w - 60)), py = y + 100 + ((q * 53 + party * 120) % 420); c.fillStyle = cols[q % 4]; c.globalAlpha = (1 - 0.55 * dim) * 0.8; c.fillRect(px, py, 12, 22); }
  }
  c.textAlign = "left";
  const aw = w - 90;
  c.font = SANS(34, 800); const askL = wrap(c, ask, aw - 40).slice(0, 5);
  c.fillStyle = "#dcf8c6"; rrect(c, x + 70, y + 110, aw, 30 + askL.length * 42, 20); c.fill();
  c.fillStyle = INK; askL.forEach((t, q) => c.fillText(t, x + 92, y + 152 + q * 42));
  const ry = y + 160 + askL.length * 42;
  c.font = SANS(38, 900); const repL = wrap(c, reply, aw - 40).slice(0, 4);
  c.fillStyle = "#ffffff"; rrect(c, x + 30, ry, aw, 34 + repL.length * 46, 20); c.fill(); c.strokeStyle = "#cbd5e1"; c.lineWidth = 3; rrect(c, x + 30, ry, aw, 34 + repL.length * 46, 20); c.stroke();
  c.fillStyle = INK; repL.forEach((t, q) => c.fillText(t, x + 52, ry + 48 + q * 46));
  c.font = SANS(fit(c, stat, w - 50, 76, 900), 900); c.fillStyle = statCol; c.textAlign = "center"; c.fillText(stat, x + w / 2, y + 715);
  c.restore();
};

const StAgree: React.FC<SP> = ({ s }) => {
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
    if (i > 0) sfx.push(<Sfx key={k("bell")} at={Math.max(0, at - 6)} src="audio/gag_ding.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.9} />, <Sfx key={k("c")} at={2} src={CLAP} vol={te ? 0.6 : 0.4} />, <Sfx key={k("t")} at={cue(i, 1, 0.4)} src="audio/sfx_success.wav" vol={0.35} />, <Sfx key={k("x")} at={cue(i, 2, 0.75)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "stake") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "test") { for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("c" + q)} at={cue(i, 1, 0.3) + q * 3} src="audio/sfx_pop.wav" vol={0.18} />); sfx.push(<Sfx key={k("g")} at={cue(i, 2, 0.6)} src="reel/sfx_glitch.wav" vol={0.3} />); }
    if (b.prop === "why") sfx.push(<Sfx key={k("u")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("o")} at={cue(i, 1, 0.5)} src="audio/gag_bonk.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("x")} at={at + 6} src="reel/sfx_buzz.wav" vol={0.3} />, <Sfx key={k("s")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("ok")} at={cue(i, 2, 0.8)} src="audio/sfx_success.wav" vol={0.32} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
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
        bg(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          const full = loopOn || P === "loop";
          const kPlain = full ? 0 : seg(f, cu(2, 0.75) - 4, cu(2, 0.75) + 6);
          c.save(); c.fillStyle = "#1e293b"; rrect(c, 50, 260, W - 100, 100, 18); c.fill();
          c.font = SANS(fit(c, T.bar, W - 140, 44, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(T.bar, W / 2, 326); c.restore();
          chat(c, 40, 390, 490, T.leftLab, GOLD, T.leftAsk, T.leftReply, T.leftStat, "#b45309", kPlain * 0.6, full ? 1 : clamp((f - ln.from) / 60));
          chat(c, 550, 390, 490, T.rightLab, "#334155", T.rightAsk, T.rightReply, T.rightStat, "#334155", 0, 0);
          if (P === "hook" && !loopOn && f >= cu(2, 0.75)) chip(c, T.story, W / 2, 1210, "#1e293b", "#f8fafc", seg(f, cu(2, 0.75), cu(2, 0.75) + 8), 34);   // render review: off frame 1
        } else if (P === "stake") {
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = INK; c.fillText(T.salaryHead, W / 2, 350);
          c.font = SANS(fit(c, T.loanSub, W - 100, 38, 800), 800); c.fillStyle = "#475569"; c.fillText(T.loanSub, W / 2, 410);
          const k0 = seg(f, ln.from + 2, ln.from + 12), k1 = seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 26);
          const bx = 60, by = 540, bw = W - 120, bh = 200;
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3);
            c.fillStyle = "#bbf7d0"; rrect(c, bx, by, bw, bh, 24); c.fill();
            c.font = SANS(64, 900); c.fillStyle = "#14532d"; c.fillText("₹40,000", W / 2, by - 30);
            if (k1 > 0) {
              const rw = bw * 0.62 * easeOut(k1);
              c.fillStyle = "#ef4444"; rrect(c, bx, by, Math.max(30, rw), bh, 24); c.fill();
              if (k1 > 0.6) {
                c.font = SANS(56, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(T.emi, bx + bw * 0.31, by + 92);
                c.font = SANS(40, 900); c.fillText("62%", bx + bw * 0.31, by + 152);
                c.fillStyle = "#14532d"; c.font = SANS(36, 900); c.fillText(T.left1, bx + bw * 0.81, by + 92); c.font = SANS(30, 800); c.fillText(T.left2, bx + bw * 0.81, by + 140);
              }
            }
            c.restore();
          }
          if (k1 > 0.8) chip(c, T.emiNote, W / 2, 860, "#1e293b", "#f8fafc", 1, fit(c, T.emiNote, W - 160, 36, 800));
        } else if (P === "test") {
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = INK; c.fillText(T.testHead, W / 2, 330);
          c.font = SANS(fit(c, T.testSub, W - 100, 34, 800), 800); c.fillStyle = "#475569"; c.fillText(T.testSub, W / 2, 380);
          const kHow = seg(f, cu(2, 0.6) - 4, cu(2, 0.6) + 8);
          (T.cards as [string, string, boolean?][]).forEach(([open, rest, cheer], q) => {
            const kq = seg(f, cu(1, 0.3) + q * 3, cu(1, 0.3) + q * 3 + 6), k0 = seg(f, ln.from, ln.from + 8);   // render review: no empty page
            if (k0 <= 0) return;
            const lit = cheer !== false, x = 40 + (q % 2) * 510, y = 420 + Math.floor(q / 2) * 165, w = 490;
            c.save(); c.globalAlpha = clamp(k0 * 3) * (0.45 + 0.55 * kq);
            c.fillStyle = "#ffffff"; rrect(c, x, y, w, 150, 18); c.fill(); c.strokeStyle = lit ? "#cbd5e1" : "#94a3b8"; c.lineWidth = 3; rrect(c, x, y, w, 150, 18); c.stroke();
            c.textAlign = "left"; c.font = SANS(fit(c, open, w - 40, 34, 900), 900); const ow = c.measureText(open).width;
            if (lit && kq > 0) { c.fillStyle = `rgba(253,224,71,${clamp(kq * 3)})`; rrect(c, x + 14, y + 24, ow + 12, 50, 10); c.fill(); }
            c.fillStyle = lit ? INK : "#64748b"; c.fillText(open, x + 20, y + 61);
            if (!lit && kq > 0) { c.font = SANS(28, 900); c.fillStyle = "#64748b"; c.fillText("no cheer", x + 20, y + 120); }
            if (rest) { c.globalAlpha = clamp(k0 * 3) * (0.35 + 0.65 * kHow); c.font = SANS(fit(c, rest, w - 40, 30, 700), 700); c.fillStyle = "#475569"; c.fillText(rest, x + 20, y + 120); }
            c.restore();
          });
          if (kHow > 0) chip(c, T.firstLine, W / 2, 1300, "#1e293b", "#fde68a", kHow, fit(c, T.firstLine, W - 140, 44, 900));
        } else if (P === "why") {
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = INK; c.fillText(T.whyHead, W / 2, 330);
          const k0 = seg(f, ln.from + 2, ln.from + 12), k1 = seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6);
          if (k0 > 0) {   // a big thumbs-up, and agreeing replies getting more of them
            c.save(); c.globalAlpha = clamp(k0 * 3); c.translate(W / 2, 560); c.scale(0.9 + 0.1 * easeOut(k0), 0.9 + 0.1 * easeOut(k0));
            c.fillStyle = "#2563eb"; rrect(c, -110, -40, 150, 190, 30); c.fill(); rrect(c, -150, -10, 60, 160, 18); c.fill();
            c.beginPath(); c.moveTo(-60, -40); c.lineTo(-10, -170); c.lineTo(40, -150); c.lineTo(20, -40); c.closePath(); c.fill();
            c.restore();
            c.save(); c.globalAlpha = clamp(k0 * 3); c.font = SANS(fit(c, T.whyLine, W - 120, 42, 800), 800); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText(T.whyLine, W / 2, 800); c.restore();
          }
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(0, (1 - easeOut(clamp(k1 * 1.5))) * 40);
            c.fillStyle = "#1e293b"; rrect(c, 60, 860, W - 120, 330, 24); c.fill();
            c.textAlign = "left"; c.font = SANS(fit(c, T.oaHead, W - 200, 34, 900), 900); c.fillStyle = "#fde68a"; c.fillText(T.oaHead, 100, 920);
            c.font = SANS(48, 900); c.fillStyle = "#fff"; wrap(c, T.oaQuote, W - 220).slice(0, 2).forEach((t, q) => c.fillText(t, 100, 990 + q * 58));
            c.font = SANS(fit(c, T.oaSub, W - 200, 30, 700), 700); c.fillStyle = "#cbd5e1"; wrap(c, T.oaSub, W - 200).slice(0, 2).forEach((t, q) => c.fillText(t, 100, 1120 + q * 38));
            c.restore();
          }
        } else if (P === "rule") {
          c.textAlign = "center"; c.font = SANS(60, 900); c.fillStyle = INK; c.fillText(T.ruleHead, W / 2, 340);
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6), k2 = seg(f, cu(2, 0.8) - 4, cu(2, 0.8) + 6);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3) * (1 - 0.5 * k1);
            c.fillStyle = "#dcf8c6"; rrect(c, 120, 400, W - 240, 120, 22); c.fill();
            c.font = SANS(46, 900); c.fillStyle = INK; c.fillText(T.bad, W / 2, 478);
            c.strokeStyle = RED; c.lineWidth = 10; c.beginPath(); c.moveTo(140, 462); c.lineTo(140 + (W - 280) * easeOut(clamp(k0 * 2)), 462); c.stroke();
            c.restore();
          }
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(0, (1 - easeOut(clamp(k1 * 1.5))) * 40);
            c.fillStyle = "#ffffff"; rrect(c, 60, 570, W - 120, 380, 28); c.fill(); c.strokeStyle = "#1e293b"; c.lineWidth = 6; rrect(c, 60, 570, W - 120, 380, 28); c.stroke();
            c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = "#2563eb"; c.fillText(T.goodLab, 100, 636);
            c.font = SANS(54, 900); c.fillStyle = INK; wrap(c, T.good, W - 200).slice(0, 4).forEach((t, q) => c.fillText(t, 100, 710 + q * 66));
            c.restore();
            stamp(c, "SCREENSHOT THIS", 800, 950, 36, "#2563eb", k1, -0.05);
          }
          if (k2 > 0) chip(c, T.goodStat, W / 2, 1090, "#14532d", "#f0fdf4", k2, fit(c, T.goodStat, W - 140, 44, 900));
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const AGREE38_SCENES = { sk_agree38: StAgree };
