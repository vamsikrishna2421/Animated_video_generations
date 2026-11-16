import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 31 "Written by AI: 0. Flagged as AI: 89." (series/scripts/creative31_detector.md): POV, one calm narrator, "you"
// are the student. 91 essays by students (Stanford, 2023): flagged as AI by at least one of 7 detectors: 89. You wrote
// yours yourself, in English, your second language; the detector says AI. Detectors hunt for predictable words; careful
// simple English looks predictable. The study: 61% flagged vs near-perfect on US-born students. Our test: OpenAI's 2019
// detector called the 1776 Declaration AI and 2 of 3 real AI texts human. The makers' own warnings. Keep the drafts.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const RED = "#f87171";
const GREEN = "#4ade80";
const AMBER = "#fde68a";
const BG = "#101418";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
const HAND = (s: number) => `italic 600 ${s}px "Comic Sans MS", "Segoe Print", cursive`;
const big = (c: Ctx, t: string, size: number) => fit(c, t, 1000, size, 800);

const title = (c: Ctx, t: string, y: number, col = AMBER, size = 60) => {
  c.font = SANS(fit(c, t, 980, size, 900), 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 540, y);
};
// 91 essay icons; the first `red` of them red
const grid = (c: Ctx, y0: number, red: number, scale = 1) => {
  for (let q = 0; q < 91; q++) {
    const col = q % 13, row = Math.floor(q / 13), w = 62 * scale, h = 78 * scale;
    const x = 540 - (13 * (w + 12) - 12) / 2 + col * (w + 12), y = y0 + row * (h + 14);
    c.fillStyle = q < red ? "#ef4444" : "#e7e5e4"; rrect(c, x, y, w, h, 6); c.fill();
    c.fillStyle = q < red ? "#7f1d1d" : "#a8a29e";
    for (let l = 0; l < 3; l++) c.fillRect(x + 8 * scale, y + (18 + l * 16) * scale, w - 16 * scale - (l === 2 ? 14 * scale : 0), 4 * scale);
  }
};
const clashBlock = (c: Ctx, x: number, label: string, value: string, col: string, bgc: string) => {
  c.save(); c.fillStyle = bgc; rrect(c, x, 150, 490, 220, 24); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, label, 450, 46, 900), 900); c.fillStyle = "#f5f5f4"; c.fillText(label, x + 245, 215);
  c.font = SANS(120, 900); c.fillStyle = col; c.fillText(value, x + 245, 340); c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = "#dc2626", rot = -0.07) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  const sc = 1 + 0.4 * (1 - clamp(k * 2)); c.scale(sc, sc);
  c.font = SANS(fit(c, t, 900, 60, 900), 900); const w = c.measureText(t).width + 60;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2, -60, w, 92, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 8; rrect(c, -w / 2, -60, w, 92, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 8); c.restore();
};
const card = (c: Ctx, y: number, h: number, bgc = "#1c1f24") => { c.fillStyle = bgc; rrect(c, 40, y, 1000, h, 22); c.fill(); };

const StDetector: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["study", "makers", "fix", "teachers"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.4} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("z")} at={cue(i, 1, 0.5) + 30} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "pov") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5) + 6} src="reel/sfx_buzz.wav" vol={0.45} />);
    if (b.prop === "study") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.4)} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("d")} at={cue(i, 2, 0.6)} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "teachers") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.45} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.45} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 30)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(3131 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        c.fillStyle = BG; c.fillRect(0, 0, W, H);
        c.save(); c.translate(540 * 0.06, 112); c.scale(0.94, 0.94);   // clear the reel's header strip; end above the captions
        const P = loopOn ? "hook" : b.prop;
        if (P === "hook" || P === "loop") {
          const hook = P === "hook";
          clashBlock(c, 40, "WRITTEN BY AI", "0", GREEN, "#123320");
          clashBlock(c, 550, "FLAGGED AS AI", "89", RED, "#3f1414");
          c.font = SANS(fit(c, "91 STUDENT ESSAYS · ENGLISH AS A 2ND LANGUAGE", 980, 44, 900), 900); c.fillStyle = "#f5f5f4"; c.textAlign = "center";
          c.fillText("91 STUDENT ESSAYS · ENGLISH AS A 2ND LANGUAGE", 540, 440);
          const red = hook && !loopOn ? Math.floor(89 * seg(f, cu(1, 0.5), cu(1, 0.5) + 40)) : 89;
          grid(c, 480, red);
          chip(c, "flagged by AT LEAST ONE of 7 detectors", 540, 1290, "#3f1414", "#fecaca", 1, big(c, "flagged by AT LEAST ONE of 7 detectors", 46));   // script review: say which count
          chip(c, "Stanford study, 2023", 540, 1395, "#1c1f24", "#d6d3d1", 1, 38);
        } else if (P === "pov") {
          title(c, "POV: YOU WROTE EVERY WORD", 250, AMBER, 60);
          c.save(); c.fillStyle = "#fffbeb"; rrect(c, 70, 320, 460, 600, 14); c.fill();
          c.strokeStyle = "rgba(59,130,246,0.3)"; c.lineWidth = 2; for (let y = 400; y < 900; y += 52) { c.beginPath(); c.moveTo(90, y); c.lineTo(510, y); c.stroke(); }
          c.font = HAND(40); c.fillStyle = "#1e3a8a"; c.textAlign = "left"; c.fillText("My essay", 100, 385);
          ["My village has a small", "library. Every evening", "I go there with my", "brother to read..."].forEach((t, q) => { c.font = HAND(32); c.fillText(t, 100, 442 + q * 52); });
          c.restore();
          c.save(); c.fillStyle = "#334155"; rrect(c, 580, 400, 440, 300, 16); c.fill(); c.fillStyle = "#0f172a"; rrect(c, 600, 420, 400, 260, 10); c.fill();
          c.fillStyle = "#475569"; c.beginPath(); c.moveTo(550, 700); c.lineTo(1050, 700); c.lineTo(1010, 740); c.lineTo(590, 740); c.closePath(); c.fill();
          c.font = SANS(30, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("AI DETECTOR", 800, 480);
          const kD = seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          if (kD > 0) { c.globalAlpha = clamp(kD * 3); c.font = SANS(fit(c, "AI-GENERATED", 360, 56, 900), 900); c.fillStyle = "#ef4444"; c.fillText("AI-GENERATED", 800, 580); }
          c.restore();
          chip(c, "English: your second language", 540, 1010, "#1c1f24", "#e7e5e4", seg(f, ln.from + 10, ln.from + 18), 44);
          stamp(c, "BUT YOU WROTE IT", 540, 1170, seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22));
        } else if (P === "why") {
          title(c, "WHAT DETECTORS HUNT FOR", 250, AMBER, 60);
          card(c, 320, 300);
          c.font = SANS(fit(c, "plain, predictable words", 900, 64, 900), 900); c.fillStyle = "#f5f5f4"; c.textAlign = "center"; c.fillText("plain, predictable words", 540, 420);
          c.font = SANS(44, 800); c.fillStyle = RED; c.fillText("predictable → \"AI\"", 540, 540);
          const k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3); card(c, 680, 360, "#14261a");
            c.font = SANS(fit(c, "careful, simple English", 900, 60, 900), 900); c.fillStyle = "#f5f5f4"; c.fillText("careful, simple English", 540, 775);
            c.font = HAND(40); c.fillStyle = "#bbf7d0"; c.fillText("\"Every evening I go there", 540, 860); c.fillText("with my brother to read.\"", 540, 915);
            c.font = SANS(44, 800); c.fillStyle = RED; c.fillText("looks predictable too", 540, 1000); c.restore();
          }
        } else if (P === "study") {
          title(c, "A STANFORD STUDY, 2023 · 7 DETECTORS", 250, AMBER, 52);
          const bar = (y: number, label: string, val: string, frac: number, col: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); card(c, y, 260);
            c.font = SANS(fit(c, label, 900, 42, 900), 900); c.fillStyle = "#f5f5f4"; c.textAlign = "left"; c.fillText(label, 80, y + 70);
            c.fillStyle = "#292524"; rrect(c, 80, y + 110, 920, 70, 12); c.fill();
            c.fillStyle = col; rrect(c, 80, y + 110, Math.max(20, 920 * frac * clamp(k * 1.5)), 70, 12); c.fill();
            c.font = SANS(fit(c, val, 900, 50, 900), 900); c.fillStyle = col; c.fillText(val, 80, y + 235); c.restore();
          };
          bar(330, "English as a 2nd language: each detector, on average", "6 in 10 flagged (61%)", 0.61, RED, seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 8));
          bar(640, "US-born students' essays", "almost none flagged", 0.03, GREEN, seg(f, cu(2, 0.6), cu(2, 0.6) + 8));   // script review: not "near-perfect"
          chip(c, "any one of the 7: 89 of 91", 540, 980, "#3f1414", "#fecaca", seg(f, cu(1, 0.4) + 20, cu(1, 0.4) + 28), 46);
        } else if (P === "makers") {
          title(c, "EVEN THE MAKERS WARN", 250, AMBER, 64);
          (T.makers as string[][]).forEach(([who, what], q) => {
            const k = seg(f, ln.from + 6 + q * Math.max(30, cu(1, 0.4) - ln.from - 6), ln.from + 14 + q * Math.max(30, cu(1, 0.4) - ln.from - 6)); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 330 + q * 330; card(c, y, 290);
            c.font = SANS(64, 900); c.fillStyle = "#f5f5f4"; c.textAlign = "left"; c.fillText(who, 80, y + 95);
            c.font = SANS(40, 800); c.fillStyle = AMBER; wrap(c, what, 900).forEach((t, j) => c.fillText(t, 80, y + 170 + j * 52));
            c.restore();
          });
        } else if (P === "fix") {   // script review: stay with "you"; from day one; offer to explain
          title(c, "FROM DAY ONE, KEEP", 250, AMBER, 64);
          (T.keep as string[]).forEach((t, q) => {
            const k = seg(f, ln.from + 10 + q * 14, ln.from + 18 + q * 14); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 330 + q * 190;
            c.fillStyle = "#f59e0b"; rrect(c, 120, y, 220, 50, 10); c.fill();
            c.fillStyle = "#fbbf24"; rrect(c, 120, y + 30, 840, 130, 14); c.fill();
            c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, 160, y + 115); c.restore();
          });
          chip(c, "flagged? show them", 540, 790, "#1c1f24", "#e7e5e4", seg(f, cu(1, 0.5), cu(1, 0.5) + 8), 52);
          chip(c, "offer to explain your essay out loud", 540, 900, "#14261a", "#bbf7d0", seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22), big(c, "offer to explain your essay out loud", 50));
        } else if (P === "teachers") {
          title(c, "TEACHERS", 300, AMBER, 80);
          const k = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          if (k > 0) {
            c.save(); c.globalAlpha = clamp(k * 3); card(c, 400, 420, "#14261a");
            c.font = SANS(fit(c, "a score is a reason to talk,", 900, 64, 900), 900); c.fillStyle = "#f5f5f4"; c.textAlign = "center"; c.fillText("a score is a reason to talk,", 540, 560);
            c.font = SANS(fit(c, "not proof", 900, 110, 900), 900); c.fillStyle = GREEN; c.fillText("not proof", 540, 720);
            c.restore();
          }
        }
        c.restore();
      }} />
    </>
  );
};

export const DETECTOR31_SCENES = { sk_detector31: StDetector };
