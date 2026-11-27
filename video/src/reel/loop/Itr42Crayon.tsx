import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 42 "₹18,400 and a Date" (series/scripts/creative42_itr_deadline.md): myth vs fact, one narrator. Kiran (made
// up) has an ₹18,400 refund; the belated-return last date is 31 Dec 2026 (the Income Tax Department's e-filing help);
// a small free AI on our computer, asked 30 times, gave that date 0 times, twice said "no fixed deadline", and invented
// a fee in 9 of 30 (series/scripts/creative42_demo, read by hand). After 31 Dec, the updated return can't claim a refund.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;

const bg = (c: Ctx, W: number, H: number) => { c.fillStyle = "#e0f2fe"; c.fillRect(0, 0, W, H); c.fillStyle = "#bae6fd"; c.fillRect(0, 1180, W, H - 1180); };
const sofa = (c: Ctx) => {   // a plain sofa behind Kiran
  c.fillStyle = "#7c2d12"; rrect(c, 20, 900, 520, 330, 40); c.fill();
  c.fillStyle = "#9a3412"; rrect(c, 40, 1040, 480, 170, 30); c.fill();
};
const block = (c: Ctx, x: number, y: number, w: number, h: number, label: string, val: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, y + 8, w, h, 24); c.fill();
  c.fillStyle = bgc; rrect(c, x, y, w, h, 24); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, label, w - 40, 40, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(label, x + w / 2, y + 62);
  const lines = val.split("\n");
  lines.forEach((t, q) => { c.font = SANS(fit(c, t, w - 40, 92, 900), 900); c.fillStyle = fg; c.fillText(t, x + w / 2, y + 185 + q * 92 - (lines.length - 1) * 30); });
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); const z = 1.6 - 0.6 * easeOut(clamp(k * 2)); c.scale(z, z); c.globalAlpha = clamp(k * 3);
  c.font = SANS(s, 900); while (c.measureText(t).width > 900 && s > 24) { s -= 2; c.font = SANS(s, 900); } const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2, -s * 0.85, w, s * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -s * 0.85, w, s * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.3); c.restore();
};
const phoneCard = (c: Ctx, T: Record<string, any>) => {   // the AI's real line (our test, seed 2 of "I missed July")
  c.save(); c.fillStyle = "#111827"; rrect(c, 580, 740, 440, 400, 32); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, 596, 756, 408, 368, 24); c.fill();
  c.font = SANS(28, 900); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("AI chat", 624, 800);
  c.fillStyle = "#dcf8c6"; rrect(c, 640, 816, 344, 76, 16); c.fill();
  c.font = SANS(fit(c, T.askShort, 316, 28, 800, 18), 800); c.fillStyle = INK; c.fillText(T.askShort, 656, 864);
  c.fillStyle = "#fde047"; rrect(c, 616, 910, 368, 190, 16); c.fill();
  c.font = SANS(36, 900); c.fillStyle = RED; wrap(c, T.aiLine, 336).slice(0, 4).forEach((t, q) => c.fillText(t, 632, 958 + q * 42));
  c.restore();
};

const StItr: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.8 : 0.6} />, <Sfx key={k("m")} at={3} src="audio/sfx_chaching.wav" vol={0.35} />, <Sfx key={k("z")} at={end - 2} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "myth") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("x")} at={cue(i, 1, 0.1)} src="audio/gag_bonk.wav" vol={0.45} />, <Sfx key={k("h")} at={cue(i, 1, 0.75)} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.65} />, <Sfx key={k("c")} at={cue(i, 1, 0.75)} src={CLAP} vol={0.4} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("p0")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("p1")} at={at + 14} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("z")} at={cue(i, 1, 0.1)} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "fact") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.35} />, <Sfx key={k("p")} at={cue(i, 1, 0.2)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "after") sfx.push(<Sfx key={k("t")} at={at + 6} src="audio/sfx_tick.wav" vol={0.25} />, <Sfx key={k("h")} at={cue(i, 1, 0.0) - 4} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.6} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src={CLAP} vol={0.35} />, <Sfx key={k("s")} at={cue(i, 1, 0.3)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(4242 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        bg(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          const full = loopOn || P === "loop";
          const kAi = full ? 1 : seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6);
          c.save(); c.fillStyle = "#713f12"; rrect(c, 60, 285, W - 120, 84, 18); c.fill();
          c.font = SANS(fit(c, T.refund, W - 160, 48, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(T.refund, W / 2, 344); c.restore();
          block(c, 40, 395, 490, 300, T.leftLab, T.leftVal, "#14532d", "#bbf7d0", 1);
          c.save(); if (kAi > 0 && kAi < 1) c.translate(Math.sin(kAi * 40) * 14 * (1 - kAi), 0);
          block(c, 550, 395, 490, 300, T.rightLab, T.rightVal, "#7f1d1d", "#fecaca", 1); c.restore();
          sofa(c);
          person(c, "kiran" as BillWho, [270, 1060], 0.8, f >= cu(1, 0.2) || full ? "shock" : "calm", "phone", false, r);
          phoneCard(c, T);
          if (P === "hook" && !loopOn) chip(c, T.story, W / 2, 1300, "#1e293b", "#f8fafc", seg(f, cu(1, 0.8), cu(1, 0.8) + 8), 34);
        } else if (P === "myth") {
          c.textAlign = "center";
          const k0 = seg(f, ln.from, ln.from + 8), kx = seg(f, cu(1, 0.05) - 6, cu(1, 0.05) + 2);
          c.save(); c.globalAlpha = clamp(k0 * 3) * (1 - 0.6 * kx);
          c.fillStyle = "#fee2e2"; rrect(c, 70, 300, W - 140, 270, 24); c.fill();
          c.font = SANS(56, 900); c.fillStyle = RED; c.fillText("MYTH", W / 2, 375);
          c.font = SANS(50, 900); c.fillStyle = INK; wrap(c, T.myth, W - 200).slice(0, 2).forEach((t, q) => c.fillText(t, W / 2, 455 + q * 62)); c.restore();
          if (kx > 0) { c.save(); c.strokeStyle = RED; c.lineWidth = 14; c.beginPath(); c.moveTo(100, 330); c.lineTo(100 + (W - 200) * easeOut(kx), 545); c.stroke(); c.restore(); }
          const kf = seg(f, cu(1, 0.05) + 4, cu(1, 0.05) + 12);
          if (kf > 0) {
            c.save(); c.globalAlpha = clamp(kf * 3); c.fillStyle = "#14532d"; rrect(c, 70, 600, W - 140, 640, 24); c.fill();
            c.font = SANS(56, 900); c.fillStyle = "#bbf7d0"; c.fillText("FACT", W / 2, 680);
            c.font = SANS(fit(c, T.factLine, W - 200, 46, 900), 900); c.fillStyle = "#fff"; c.fillText(T.factLine, W / 2, 760);
            const kn = seg(f, cu(1, 0.75) - 2, cu(1, 0.75) + 6);
            if (kn > 0) { const z = 1.4 - 0.4 * easeOut(kn); c.save(); c.translate(W / 2, 960); c.scale(z, z); c.font = SANS(220, 900); c.fillStyle = "#fca5a5"; c.fillText(T.zero, 0, 70); c.restore(); }
            c.font = SANS(fit(c, T.zeroSub, W - 200, 38, 800), 800); c.fillStyle = "#bbf7d0"; c.globalAlpha = clamp(kf * 3) * clamp(kn * 3); c.fillText(T.zeroSub, W / 2, 1130);
            c.font = SANS(fit(c, T.model, W - 200, 30, 700), 700); c.fillStyle = "#86efac"; c.fillText(T.model, W / 2, 1190); c.restore();
          }
        } else if (P === "test") {
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = "#0c4a6e"; c.fillText(T.testHead, W / 2, 340);
          c.font = SANS(fit(c, T.model, W - 100, 32, 800), 800); c.fillStyle = "#475569"; c.fillText(T.model, W / 2, 388);
          (T.tiles as [string, string, string][]).forEach(([top, body, stat], q) => {
            const a0 = q < 2 ? ln.from + 2 + q * 12 : cu(1, 0.1) - 4;
            const k = seg(f, a0, a0 + 8); if (k <= 0) return;
            const y = 430 + q * 260, bad = q === 2;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * 60, 0);
            c.fillStyle = bad ? "#fee2e2" : "#ffffff"; rrect(c, 60, y, W - 120, 230, 24); c.fill(); c.strokeStyle = bad ? RED : "#0c4a6e"; c.lineWidth = 5; rrect(c, 60, y, W - 120, 230, 24); c.stroke();
            c.textAlign = "left"; c.font = SANS(36, 900); c.fillStyle = "#475569"; c.fillText(top, 96, y + 56);
            c.font = SANS(fit(c, body, W - 420, 52, 900), 900); c.fillStyle = bad ? RED : INK; c.fillText(body, 96, y + 140);
            c.textAlign = "right"; c.font = SANS(fit(c, stat, 260, 60, 900), 900); c.fillStyle = RED; c.fillText(stat, W - 96, y + 140);
            c.restore();
          });
          chip(c, T.feeChip, W / 2, 1240, "#14532d", "#fff", seg(f, cu(1, 0.8), cu(1, 0.8) + 8), fit(c, T.feeChip, W - 140, 38, 800));
        } else if (P === "fact") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6);
          c.save(); c.globalAlpha = clamp(k0 * 3); c.translate(0, (1 - easeOut(clamp(k0 * 1.5))) * 40);
          c.fillStyle = "#ffffff"; rrect(c, 50, 300, W - 100, 900, 28); c.fill(); c.strokeStyle = "#1e3a8a"; c.lineWidth = 6; rrect(c, 50, 300, W - 100, 900, 28); c.stroke();
          c.fillStyle = "#1e3a8a"; rrect(c, 50, 300, W - 100, 110, 28); c.fill(); c.fillRect(50, 360, W - 100, 50);
          c.textAlign = "left"; c.font = SANS(fit(c, T.siteHead, W - 160, 40, 900), 900); c.fillStyle = "#fff"; c.fillText(T.siteHead, 90, 372);
          c.font = SANS(36, 800); c.fillStyle = "#475569"; c.fillText(T.siteSub, 90, 470);
          c.font = SANS(fit(c, T.belatedLab, W - 180, 50, 900), 900); c.fillStyle = INK; c.fillText(T.belatedLab, 90, 570);
          c.font = SANS(fit(c, T.belatedVal, W - 180, 120, 900), 900); c.fillStyle = GREEN; c.fillText(T.belatedVal, 90, 710);
          c.restore();
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.textAlign = "left"; c.font = SANS(50, 900); c.fillStyle = INK; c.fillText(T.feeLab, 90, 820);
            c.font = SANS(fit(c, T.fee1, W - 180, 72, 900), 900); c.fillStyle = "#b45309"; c.fillText(T.fee1, 90, 920);
            c.font = SANS(fit(c, T.fee2, W - 180, 52, 900), 900); c.fillStyle = "#b45309"; c.fillText(T.fee2, 90, 1000);
            c.font = SANS(fit(c, T.siteSrc, W - 180, 30, 700), 700); c.fillStyle = "#64748b"; c.fillText(T.siteSrc, 90, 1150);
            c.restore();
          }
        } else if (P === "after") {
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = "#0c4a6e"; c.fillText(T.afterHead, W / 2, 340);
          const pts: [string, string, string, number][] = [[T.p1, T.p1sub, "#64748b", 0], [T.p2, T.p2sub, GREEN, 1], [T.p3, T.p3sub, RED, 2]];
          const kL = seg(f, ln.from + 2, cu(1, 0.1));
          c.strokeStyle = "#0c4a6e"; c.lineWidth = 10; c.beginPath(); c.moveTo(160, 470); c.lineTo(160, 470 + 680 * easeOut(kL)); c.stroke();
          pts.forEach(([lab, sub, col, q]) => {
            const k = seg(f, ln.from + 2 + q * 10, ln.from + 10 + q * 10); if (k <= 0) return;
            const y = 480 + q * 300;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = col; c.beginPath(); c.arc(160, y, 34, 0, 7); c.fill();
            c.textAlign = "left"; c.font = SANS(64, 900); c.fillStyle = col; c.fillText(lab, 230, y + 22);
            c.font = SANS(fit(c, sub, W - 300, 40, 800), 800); c.fillStyle = INK; wrap(c, sub, W - 300).slice(0, 2).forEach((t, z) => c.fillText(t, 230, y + 84 + z * 48));
            c.restore();
          });
          stamp(c, T.afterStamp, W / 2, 1290, 50, RED, seg(f, cu(1, 0.3), cu(1, 0.3) + 8), -0.05);
        } else if (P === "rule") {
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#0c4a6e"; c.fillText(T.ruleHead, W / 2, 340);
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = "#7f1d1d"; rrect(c, 60, 390, W - 120, 250, 24); c.fill();
            c.font = SANS(fit(c, T.rule1, W - 180, 56, 900), 900); c.fillStyle = "#fff"; c.fillText(T.rule1, W / 2, 490);
            c.font = SANS(fit(c, T.rule1b, W - 180, 38, 800), 800); c.fillStyle = "#fecaca"; c.fillText(T.rule1b, W / 2, 580); c.restore();
          }
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.fillStyle = "#14532d"; rrect(c, 60, 680, W - 120, 330, 24); c.fill();
            c.font = SANS(fit(c, T.rule2, W - 180, 60, 900), 900); c.fillStyle = "#fff"; wrap(c, T.rule2, W - 180).slice(0, 2).forEach((t, q) => c.fillText(t, W / 2, 790 + q * 72));
            c.font = SANS(fit(c, T.rule2b, W - 180, 44, 900), 900); c.fillStyle = "#bbf7d0"; c.fillText(T.rule2b, W / 2, 960); c.restore();
            chip(c, T.ruleChip, W / 2, 1110, "#1e293b", "#f8fafc", k1, fit(c, T.ruleChip, W - 140, 34, 800));
          }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const ITR42_SCENES = { sk_itr42: StItr };
