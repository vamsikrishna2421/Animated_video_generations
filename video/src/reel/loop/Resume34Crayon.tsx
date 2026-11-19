import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho, BillMood, BillArms } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 34 "Team of 15? Real: 0" (series/scripts/creative34_resume.md): a breaking-news parody, one anchor voice, no
// dialogue. Tarun (24, made up by us) asked an AI to make his resume "more impressive" for a sales job; the AI added a
// team he never led, a % he never measured, a certificate he never took and a job he never had. The lines on screen are
// copied from our test's own replies (pipeline/creative34/resume_demo.py, read by hand: HAND), the counts come from the
// spec (data.t). Frame 1 stacks the job's pay, the invented "team of 15" against the real 0, and Tarun's face.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const STING = "audio/sfx_newssting.wav", CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;

// ---------- pieces ----------
const studio = (c: Ctx, W: number, H: number) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0f172a"); g.addColorStop(1, "#1e3a8a");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.08; c.fillStyle = "#93c5fd";
  for (let x = -200; x < W; x += 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 300, H); c.lineTo(x + 330, H); c.lineTo(x + 30, 0); c.fill(); }
  c.globalAlpha = 1;
};
const breaking = (c: Ctx, W: number, f: number, text: string) => {   // the red bar under the captions, and the LIVE bug
  c.fillStyle = RED; c.fillRect(0, 1770, W, 90);
  c.font = SANS(50, 900); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("BREAKING", 26, 1832);
  c.fillStyle = "#111827"; c.fillRect(290, 1770, W - 290, 90);
  c.font = SANS(fit(c, text, W - 330, 38, 800), 800); c.fillStyle = "#fde68a"; c.fillText(text, 316, 1828);
  c.fillStyle = Math.floor(f / 15) % 2 ? RED : "#7f1d1d"; c.beginPath(); c.arc(W - 330, 236, 12, 0, 7); c.fill();
  c.font = SANS(30, 900); c.fillStyle = "#f8fafc"; c.fillText("LIVE · HR CABIN", W - 310, 247);
};
// the resume on paper; `hi` lines get a red marker and a "never did" tag when k > 0
const paper = (c: Ctx, x: number, y: number, w: number, h: number, rows: [string, boolean][], k: number, tagText: string) => {
  c.fillStyle = "rgba(0,0,0,0.3)"; rrect(c, x + 10, y + 12, w, h, 12); c.fill();
  c.fillStyle = "#fffdf7"; rrect(c, x, y, w, h, 12); c.fill();
  c.font = SANS(40, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("TARUN K · RESUME", x + 36, y + 66);
  c.fillStyle = "#cbd5e1"; c.fillRect(x + 36, y + 86, w - 72, 4);
  let yy = y + 140;
  rows.forEach(([t, hi], q) => {
    const lines = wrap(c, "• " + t, w - 90);
    c.font = SANS(32, 700);
    const lh = 42, bh = lines.length * lh + 8;
    if (hi && k > 0) { c.save(); c.globalAlpha = clamp(k * 3) * 0.9; c.fillStyle = "#fecaca"; c.fillRect(x + 28, yy - 34, (w - 56) * easeOut(clamp(k * 2)), bh); c.restore(); }
    c.font = SANS(32, 700); c.fillStyle = hi && k > 0 ? "#991b1b" : "#334155";
    lines.forEach((l, j) => c.fillText(l, x + 40, yy + j * lh));
    yy += bh + 14;
    void q;
  });
  if (k > 0 && tagText) chip(c, tagText, x + w - 170, y + h - 40, RED, "#fff", k, 30);
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
const bigBlock = (c: Ctx, x: number, y: number, w: number, label: string, val: string, col: string, bg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x, y, w, 220, 24); c.fill();
  c.font = SANS(fit(c, label, w - 40, 38, 900), 900); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText(label, x + w / 2, y + 62);
  c.font = SANS(fit(c, val, w - 40, 110, 900), 900); c.fillStyle = col; c.fillText(val, x + w / 2, y + 180);
  c.restore();
};
const who = (c: Ctx, w: BillWho, at: [number, number], sc: number, m: [BillMood, BillArms], r: () => number) => person(c, w, at, sc, m[0], m[1], false, r);

// ---------- the scene ----------
const StResume: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.5} />, <Sfx key={k("s")} at={4} src={STING} vol={0.45} />, <Sfx key={k("c")} at={cue(i, 1, 0.5) - 6} src={CLAP} vol={0.3} />);
    if (b.prop === "ask") [cue(i, 1, 0.3), cue(i, 2, 0.4), cue(i, 3, 0.4)].forEach((t, q) => sfx.push(<Sfx key={k("p" + q)} at={t - 6} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "interview") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("g")} at={cue(i, 1, 0.4) - 6} src="reel/sfx_glitch.wav" vol={0.35} />, <Sfx key={k("h")} at={cue(i, 1, 0.4) - 4} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("s")} at={Math.max(0, at - 20)} src={STING} vol={0.3} />, <Sfx key={k("h")} at={cue(i, 1, 0.4) - 6} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.6} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("d")} at={cue(i, 1, 0.4) - 4} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("s")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("s")} at={slam - 10} src={STING} vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3434 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        studio(c, W, H);
        c.textAlign = "left";
        if (P === "hook") {
          // frame 1: the job's pay, the resume line, the real number
          c.fillStyle = "#111827"; rrect(c, 60, 290, W - 120, 92, 18); c.fill();
          c.font = SANS(fit(c, T.job, W - 160, 44, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(T.job, W / 2, 352);
          bigBlock(c, 60, 410, 470, "HIS RESUME SAYS", T.claim, "#fca5a5", "#7f1d1d", 1);   // script review: thinner frame 1
          bigBlock(c, 550, 410, 470, "REAL TEAM", T.real, "#86efac", "#14532d", 1);
          who(c, "kumar" as BillWho, [540, 1060], 1.15, ["shock", "up"], r);   // render: the frame was half empty
          chip(c, T.madeUp, W / 2, 1395, "#1e293b", "#cbd5e1", 1, 32);
          stamp(c, "ADDED BY AN AI", W / 2, 720, 60, RED, loopOn ? 1 : seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
          breaking(c, W, f, T.ticker);
        } else if (P === "ask") {
          // his ask, and the AI's reply with the added lines marked (copied from reply 1 of our test)
          c.fillStyle = "#dcf8c6"; rrect(c, 140, 290, W - 200, 130, 22); c.fill();
          c.font = SANS(36, 800); c.fillStyle = INK; c.textAlign = "left";
          wrap(c, T.ask, W - 260).forEach((t, q) => c.fillText(t, 170, 342 + q * 44));
          const rows = T.reply as [string, number][];   // [text, which cue marks it (0 = not added)]
          const kk = (n: number) => n === 0 ? 0 : seg(f, cu(n, 0.3), cu(n, 0.3) + 8);
          c.fillStyle = "#fffdf7"; rrect(c, 60, 450, W - 120, 940, 18); c.fill();
          c.font = SANS(34, 900); c.fillStyle = "#64748b"; c.fillText("AI: Here's an enhanced version:", 90, 510);
          let yy = 580;
          rows.forEach(([t, n]) => {   // render: bigger rows, and the NEVER DID tag on its own line (it ran into the text)
            const k = kk(n);
            c.font = SANS(42, 700);
            const lines = wrap(c, t, W - 220), bh = lines.length * 54;
            if (k > 0) { c.save(); c.globalAlpha = 0.9; c.fillStyle = "#fecaca"; c.fillRect(80, yy - 44, (W - 160) * easeOut(clamp(k * 2)), bh + 50); c.restore(); }
            c.font = SANS(42, 700); c.fillStyle = k > 0 ? "#991b1b" : "#334155";
            lines.forEach((l, j) => c.fillText(l, 100, yy + j * 54));
            if (k > 0) { c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(30, 900); c.fillStyle = RED; c.fillText("✗ NEVER DID", 100, yy + bh + 2); c.restore(); }
            yy += bh + (k > 0 || n > 0 ? 60 : 24);
          });
          breaking(c, W, f, T.ticker);
        } else if (P === "interview") {
          // the HR cabin: the interviewer reads the line out
          c.fillStyle = "#e7c9a0"; c.fillRect(0, 760, W, 700);   // render: the desk sat above their heads
          const sweat = f >= cu(1, 0.4);
          who(c, "kumar" as BillWho, [260, 1010], 0.8, sweat ? ["shock", "up"] : ["worried", "rest"], r);
          who(c, "sastry" as BillWho, [830, 1010], 0.8, ["smug", "fold"], r);
          c.fillStyle = "#7c4a1e"; c.fillRect(40, 1180, W - 80, 60); c.fillStyle = "#5b3514"; c.fillRect(40, 1240, W - 80, 160);
          c.fillStyle = "#fffdf7"; c.save(); c.translate(700, 1200); c.rotate(-0.06); c.fillRect(-90, -20, 180, 30); c.restore();   // his resume on the desk
          if (f >= endL - 6) {   // the beat of silence after the question: drops of sweat
            [0, 1, 2].forEach((q) => { const y = 760 + ((f - endL) * 6 + q * 40) % 140; c.fillStyle = "#7dd3fc"; c.beginPath(); c.ellipse(340 + q * 22, y, 9, 13, 0, 0, 7); c.fill(); });
          }
          const k = seg(f, cu(1, 0.4) - 6, cu(1, 0.4) + 4);
          if (k > 0) {
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = "#fff"; rrect(c, 420, 420, 600, 230, 30); c.fill();
            c.beginPath(); c.moveTo(800, 650); c.lineTo(850, 720); c.lineTo(870, 650); c.closePath(); c.fill();
            c.font = SANS(fit(c, T.question, 540, 52, 900), 900); c.fillStyle = INK; c.textAlign = "center";
            wrap(c, T.question, 540).forEach((t, q) => c.fillText(t, 720, 510 + q * 64));
            c.restore();
          }
          c.font = SANS(40, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("INTERVIEW · 10:00 AM", 70, 330);
          c.font = SANS(fit(c, T.job, W - 140, 34, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(T.job, 70, 380);
          breaking(c, W, f, T.ticker);
        } else if (P === "test" || P === "fix") {
          c.textAlign = "center";
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.fillText(P === "test" ? "OUR TEST" : "THE FIX", W / 2, 330);
          c.font = SANS(fit(c, T.model, W - 100, 30, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(T.model, W / 2, 380);
          const ask = P === "test" ? T.askShort : T.fixAsk;
          c.fillStyle = P === "test" ? "#1e293b" : "#14532d"; rrect(c, 70, 420, W - 140, 200, 22); c.fill();
          c.font = SANS(fit(c, ask, W - 220, 40, 800), 800); c.fillStyle = "#f8fafc";
          wrap(c, ask, W - 200).forEach((t, q) => c.fillText(t, W / 2, 495 + q * 50));
          const c1 = cu(1, 0.4), k = seg(f, c1 - 6, c1 + 4);
          if (P === "test") bigBlock(c, 140, 660, W - 280, "added things he never did", `${T.usualAdded} of 10`, "#fca5a5", "#7f1d1d", k);
          else {   // script review: say both halves (4 still added, 5 asked him first)
            bigBlock(c, 60, 660, 470, "still added something", `${T.betterAdded} of 10`, "#fca5a5", "#7f1d1d", k);
            bigBlock(c, 550, 660, 470, "asked him first", `${T.betterAsked} of 10`, "#86efac", "#14532d", seg(f, cu(1, 0.6), cu(1, 0.6) + 8));
          }
          const chips = (P === "test" ? T.usualWhat : T.betterWhat) as string[];
          chips.forEach((t, q) => chip(c, t, W / 2, 970 + q * 92, "#f8fafc", INK, seg(f, c1 + 14 + q * 8, c1 + 22 + q * 8), fit(c, t, W - 180, 44, 800)));
          if (P === "fix") {   // render: the empty bottom; a real question it asked instead (the better ask, run 6)
            const kq = seg(f, cu(1, 0.75), cu(1, 0.75) + 8);
            if (kq > 0) {
              c.save(); c.globalAlpha = clamp(kq * 3); c.fillStyle = "#f8fafc"; rrect(c, 90, 1090, W - 180, 230, 22); c.fill();
              c.font = SANS(32, 900); c.fillStyle = "#15803d"; c.textAlign = "left"; c.fillText("it asked him instead:", 130, 1150);
              c.font = SANS(40, 800); c.fillStyle = INK; wrap(c, T.asked, W - 280).forEach((t, q) => c.fillText(t, 130, 1210 + q * 50));
              c.restore(); c.textAlign = "center";
            }
          }
        } else if (P === "rule") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "BEFORE YOU SEND IT", W - 100, 60, 900), 900); c.fillStyle = "#fde68a"; c.fillText("BEFORE YOU SEND IT", W / 2, 330);
          const rows = T.rule as [string, string][];
          rows.forEach(([a, t], q) => {
            const st = q === 0 ? ln.from + 2 : cu(q, 0.3), k = seg(f, st, st + 8);
            if (k <= 0) return;
            const y = 400 + q * 230;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * 200, 0);
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 200, 22); c.fill();
            c.font = SANS(76, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(`${q + 1}`, 100, y + 125);
            c.font = SANS(fit(c, a, W - 300, 56, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(a, 190, y + 88);
            c.font = SANS(fit(c, t, W - 300, 38, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(t, 190, y + 150); c.restore();
          });
        } else if (P === "loop") {   // the anchor: back to the top story (the resume comes back, the stamp lands)
          paper(c, 195, 420, 690, 520, T.hookRows, seg(f, ln.from + 4, ln.from + 14), "");
          stamp(c, "REAL TEAM: 0", W / 2, 1050, 80, RED, seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
          chip(c, "can you explain it? if not, delete it", W / 2, 1220, "#fde68a", INK, 1, 42);   // review: the rule stays under the last line
          c.font = SANS(52, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BACK TO OUR TOP STORY", W / 2, 340);
          breaking(c, W, f, T.ticker);
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const RESUME34_SCENES = { sk_resume34: StResume };
