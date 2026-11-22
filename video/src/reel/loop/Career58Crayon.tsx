import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// EP58 "+1% or +19%? Your AI Career Roadmap" (series/scripts/ep58_career_roadmap.md): the Season 6 finale as a screen
// tutorial. Three AI jobs, one real task each: EP51's prompt test (4/10 -> 9/10), EP54's tool test (6/10 wrong -> 10/10
// right) and today's scam-SMS filter (series/scripts/ep58_demo: 1.86 s, 1,100 of 1,115 right; 2 of our 3 Indian scams
// missed). Frame 1: Naukri JobSpeak, Sep 2026 (fresher hiring +1%, fresher AI/ML +19%).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", NAVY = "#0f172a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "DejaVu Sans Mono", "Courier New", monospace`;

const bg = (c: Ctx, W: number, H: number) => { c.fillStyle = "#eef2f7"; c.fillRect(0, 0, W, H); };
const head = (c: Ctx, W: number, t: string, sub: string, col: string) => {
  c.fillStyle = col; rrect(c, 40, 250, W - 80, 120, 26); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, t, W - 140, 56, 900), 900); c.fillStyle = "#fff"; c.fillText(t, W / 2, 318);
  if (sub) { c.font = SANS(fit(c, sub, W - 140, 30, 800), 800); c.fillStyle = "rgba(255,255,255,0.85)"; c.fillText(sub, W / 2, 356); }
};
const bigBlock = (c: Ctx, x: number, y: number, w: number, h: number, lab: string, val: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.4))) * 40);
  c.fillStyle = bgc; rrect(c, x, y, w, h, 28); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, lab, w - 40, 34, 900), 900); c.fillStyle = "rgba(255,255,255,0.9)";
  wrap(c, lab, w - 40).slice(0, 2).forEach((t, q) => c.fillText(t, x + w / 2, y + 58 + q * 40));
  c.font = SANS(fit(c, val, w - 40, 150, 900), 900); c.fillStyle = fg; c.fillText(val, x + w / 2, y + h - 50);
  c.restore();
};
const bar = (c: Ctx, x: number, y: number, w: number, lab: string, n: number, of: number, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.textAlign = "left"; c.font = SANS(fit(c, lab, w, 36, 800), 800); c.fillStyle = INK; c.fillText(lab, x, y);
  c.fillStyle = "#cbd5e1"; rrect(c, x, y + 18, w, 70, 16); c.fill();
  c.fillStyle = col; rrect(c, x, y + 18, Math.max(30, w * (n / of) * easeOut(clamp(k * 1.5))), 70, 16); c.fill();
  c.font = SANS(52, 900); c.fillStyle = "#fff"; c.fillText(`${n}/${of}`, x + 20, y + 72);
  c.restore();
};
const sms = (c: Ctx, x: number, y: number, w: number, tag: string, txt: string, verdict: string, ok: boolean, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#fff"; rrect(c, x, y, w, 190, 24); c.fill(); c.strokeStyle = ok ? GREEN : RED; c.lineWidth = 6; rrect(c, x, y, w, 190, 24); c.stroke();
  c.textAlign = "left"; c.font = SANS(30, 900); c.fillStyle = "#64748b"; c.fillText(tag, x + 26, y + 46);
  c.font = SANS(32, 700); c.fillStyle = INK; wrap(c, txt, w - 52).slice(0, 2).forEach((t, q) => c.fillText(t, x + 26, y + 92 + q * 40));
  c.textAlign = "right"; c.font = SANS(40, 900); c.fillStyle = ok ? GREEN : RED; c.fillText(verdict, x + w - 26, y + 50);
  c.restore();
};

const StCareer: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.55} />, <Sfx key={k("h")} at={cue(i, 1, 0.4)} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "rank") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "prompt" || b.prop === "aieng") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("a")} at={cue(i, 1, 0.45)} src="reel/sfx_buzz.wav" vol={0.3} />, <Sfx key={k("d")} at={cue(i, 2, 0.75)} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "ml") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("t")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("b")} at={cue(i, 2, 0.75)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "twist") sfx.push(<Sfx key={k("y")} at={cue(i, 1, 0.3)} src="audio/gag_ding.wav" vol={0.35} />, <Sfx key={k("n")} at={cue(i, 2, 0.55)} src="reel/sfx_buzz.wav" vol={0.45} />, <Sfx key={k("b")} at={cue(i, 3, 0.8)} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "road") sfx.push(<Sfx key={k("s")} at={at + 4} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(5858 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        bg(c, W, H); c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          c.textAlign = "center"; c.font = SANS(44, 900); c.fillStyle = NAVY; c.fillText(T.hookHead, W / 2, 300);
          bigBlock(c, 40, 340, 490, 400, T.blockA, T.valA, "#475569", "#e2e8f0", 1);
          bigBlock(c, 550, 340, 490, 400, T.blockB, T.valB, GREEN, "#dcfce7", 1);
          chip(c, T.src1, W / 2, 790, "#1e293b", "#f8fafc", 1, 30);
          person(c, "akhil" as BillWho, [540, 1030], 0.55, P === "loop" ? "excited" : "worried", "phone", false, r);
          // his résumé
          c.save(); c.translate(760, 1060); c.rotate(0.08); c.fillStyle = "#fff"; rrect(c, 0, 0, 200, 250, 10); c.fill(); c.strokeStyle = "#94a3b8"; c.lineWidth = 3; rrect(c, 0, 0, 200, 250, 10); c.stroke();
          c.font = SANS(26, 900); c.fillStyle = NAVY; c.textAlign = "left"; c.fillText(T.resume, 18, 40); c.fillStyle = "#cbd5e1"; for (let q = 0; q < 6; q++) c.fillRect(18, 64 + q * 28, 160 - (q % 3) * 30, 12); c.restore();
          if (P === "hook") chip(c, T.jobsChip, W / 2, 1380, NAVY, "#fde68a", seg(f, cu(2, 0.7) - 4, cu(2, 0.7) + 6), 38);
        } else if (P === "rank") {
          head(c, W, T.rankHead, T.rankSub, "#0a66c2");
          (T.rank as string[]).forEach((t, q) => {
            const k = q < 2 ? seg(f, cu(1, 0.4) - 4 + q * 10, cu(1, 0.4) + 6 + q * 10) : seg(f, ln.from + 6, ln.from + 14);
            if (k <= 0) return;
            const y = 430 + q * 190, hot = q < 2;
            c.save(); c.globalAlpha = clamp(k * 3) * (hot ? 1 : 0.6); c.fillStyle = hot ? "#fff" : "#e2e8f0"; rrect(c, 60, y, W - 120, 160, 24); c.fill();
            if (hot) { c.strokeStyle = "#0a66c2"; c.lineWidth = 6; rrect(c, 60, y, W - 120, 160, 24); c.stroke(); }
            c.textAlign = "left"; c.font = SANS(80, 900); c.fillStyle = "#0a66c2"; c.fillText(`#${q + 1}`, 100, y + 110);
            c.font = SANS(fit(c, t, W - 420, 60, 900), 900); c.fillStyle = INK; c.fillText(t, 260, y + 102); c.restore();
          });
        } else if (P === "prompt") {
          head(c, W, T.p1Head, T.p1Sub, "#7c3aed");
          c.fillStyle = NAVY; rrect(c, 60, 410, W - 120, 300, 22); c.fill();
          c.textAlign = "left"; c.font = MONO(26, 700); c.fillStyle = "#a5b4fc"; c.fillText(T.p1Label, 90, 455);
          c.font = MONO(30, 600); c.fillStyle = "#e2e8f0"; (T.p1Prompt as string[]).forEach((t, q) => c.fillText(t, 90, 510 + q * 44));
          bar(c, 60, 790, W - 120, T.p1BarA, 4, 10, RED, seg(f, cu(1, 0.45) - 4, cu(1, 0.45) + 8));
          bar(c, 60, 950, W - 120, T.p1BarB, 9, 10, GREEN, seg(f, cu(2, 0.75) - 4, cu(2, 0.75) + 8));
          chip(c, T.p1Src, W / 2, 1130, "#1e293b", "#f8fafc", 1, 30);
        } else if (P === "aieng") {
          head(c, W, T.p2Head, T.p2Sub, "#0e7490");
          // the chat asks, the code looks it up
          const k0 = seg(f, ln.from + 2, ln.from + 12);
          c.save(); c.globalAlpha = clamp(k0 * 3);
          c.fillStyle = "#dcf8c6"; rrect(c, 60, 410, 420, 110, 22); c.fill(); c.textAlign = "left"; c.font = SANS(fit(c, T.p2Ask, 380, 34, 800), 800); c.fillStyle = INK; c.fillText(T.p2Ask, 85, 478);
          c.fillStyle = NAVY; rrect(c, 560, 410, 460, 110, 22); c.fill(); c.font = MONO(fit(c, T.p2Tool, 420, 34, 700), 700); c.fillStyle = "#67e8f9"; c.fillText(T.p2Tool, 585, 478);
          c.strokeStyle = "#0e7490"; c.lineWidth = 8; c.beginPath(); c.moveTo(485, 465); c.lineTo(552, 465); c.stroke();
          c.fillStyle = "#fff"; rrect(c, 560, 545, 460, 100, 22); c.fill(); c.font = SANS(fit(c, T.p2Rec, 420, 32, 800), 800); c.fillStyle = INK; c.fillText(T.p2Rec, 585, 607);
          c.restore();
          bar(c, 60, 760, W - 120, T.p2BarA, 6, 10, RED, seg(f, cu(1, 0.45) - 4, cu(1, 0.45) + 8));
          bar(c, 60, 920, W - 120, T.p2BarB, 10, 10, GREEN, seg(f, cu(2, 0.75) - 4, cu(2, 0.75) + 8));
          chip(c, T.p2Src, W / 2, 1100, "#1e293b", "#f8fafc", 1, 30);
        } else if (P === "ml") {
          head(c, W, T.p3Head, T.p3Sub, "#b45309");
          c.fillStyle = NAVY; rrect(c, 60, 410, W - 120, 470, 22); c.fill();
          c.textAlign = "left"; c.font = MONO(32, 700);
          (T.term as string[]).forEach((t, q) => {
            const st = q === 0 ? ln.from + 2 : q < 3 ? cu(1, 0.4) - 6 + (q - 1) * 8 : cu(2, 0.75) - 4;
            if (f < st) return;
            c.fillStyle = q === 0 ? "#86efac" : q === 3 ? "#fde68a" : "#e2e8f0"; c.fillText(t, 90, 475 + q * 64);
          });
          const kb = seg(f, cu(2, 0.75) - 2, cu(2, 0.75) + 8);
          if (kb > 0) { c.save(); c.globalAlpha = clamp(kb * 3); c.textAlign = "center"; c.font = SANS(170, 900); c.fillStyle = GREEN; c.fillText(T.mlBig, W / 2, 1090); c.font = SANS(fit(c, T.mlBigSub, W - 120, 36, 800), 800); c.fillStyle = INK; c.fillText(T.mlBigSub, W / 2, 1150); c.restore(); }
        } else if (P === "twist") {
          head(c, W, T.twHead, T.twSub, "#b45309");
          (T.sms as [string, string, string, boolean][]).forEach(([tag, txt, verdict, ok], q) => {
            const st = q === 0 ? cu(1, 0.3) - 4 : cu(2, 0.55) - 4 + (q - 1) * 8;
            sms(c, 60, 400 + q * 215, W - 120, tag, txt, verdict, ok, seg(f, st, st + 8));
          });
          const kd = seg(f, cu(3, 0.8) - 4, cu(3, 0.8) + 6);
          if (kd > 0) { c.save(); c.globalAlpha = clamp(kd * 3); c.fillStyle = NAVY; rrect(c, 60, 1060, W - 120, 150, 26); c.fill(); c.textAlign = "center"; c.font = SANS(fit(c, T.twBig, W - 160, 64, 900), 900); c.fillStyle = "#fde68a"; c.fillText(T.twBig, W / 2, 1135); c.font = SANS(fit(c, T.twNote, W - 160, 30, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(T.twNote, W / 2, 1185); c.restore(); }
        } else if (P === "road") {
          c.textAlign = "center"; c.font = SANS(60, 900); c.fillStyle = NAVY; c.fillText(T.roadHead, W / 2, 320);
          (T.road as [string, string, string, string][]).forEach(([job, start, learn, proof], q) => {
            const st = q === 0 ? ln.from + 4 : cu(q, 0.3 + 0.3 * q) - 4;
            const k = seg(f, st, st + 8); if (k <= 0) return;
            const y = 370 + q * 300, col = ["#7c3aed", "#0e7490", "#b45309"][q];
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#fff"; rrect(c, 50, y, W - 100, 270, 24); c.fill(); c.fillStyle = col; rrect(c, 50, y, 26, 270, 12); c.fill();
            c.textAlign = "left"; c.font = SANS(fit(c, job, W - 200, 50, 900), 900); c.fillStyle = col; c.fillText(job, 100, y + 64);
            [["START", start], ["LEARN", learn], ["PROOF", proof]].forEach(([a, bb], j) => { c.font = SANS(28, 900); c.fillStyle = "#64748b"; c.fillText(a, 100, y + 118 + j * 52); c.font = SANS(fit(c, bb, W - 360, 34, 800), 800); c.fillStyle = INK; c.fillText(bb, 240, y + 118 + j * 52); });
            c.restore();
          });
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const CAREER58_SCENES = { sk_career58: StCareer };
