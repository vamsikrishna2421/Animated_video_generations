import React from "react";
import { Ctx, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 41 "Asked for 150 Words" (series/scripts/creative41_150_words.md): a one-question challenge, one narrator.
// Our test (series/scripts/creative41_demo): one small free model on our laptop asked for a 150-word answer, 10 tries:
// 102-128 words (0/10 within 135-165); told to count: 2/10 within; told its real count, it went over 9/10 (162-234).
// Its own tokenizer: the answer's first 12 words = 14 tokens; the whole 102-word answer = 124 tokens. The rule: check the
// count in Docs or Word and fix the last lines yourself.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const RED = "#dc2626", GREEN = "#16a34a", BLUE = "#2563eb", AMBER = "#d97706";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const HAND = (s: number) => `600 ${s}px "Comic Sans MS", "Segoe Print", cursive`;
const MONO = (s: number, w = 600) => `${w} ${s}px 'DejaVu Sans Mono', 'Liberation Mono', monospace`;

// a study table: a warm wall, the desk edge
const desk = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#e0f2fe"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#bae6fd"; for (let q = 0; q < 12; q++) c.fillRect(0, 120 + q * 110, W, 3);
  c.fillStyle = "#a16207"; c.fillRect(0, 1300, W, H - 1300); c.fillStyle = "#ca8a04"; c.fillRect(0, 1300, W, 26);
};
// the notebook page with the homework line
const notebook = (c: Ctx, T: Record<string, any>, x: number, y: number, w: number, h: number, rot = -0.03) => {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); c.translate(-w / 2, -h / 2);
  c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(8, 10, w, h); c.fillStyle = "#fffdf5"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#bfdbfe"; c.lineWidth = 2; for (let q = 0; q < Math.floor(h / 46); q++) { c.beginPath(); c.moveTo(20, 90 + q * 46); c.lineTo(w - 20, 90 + q * 46); c.stroke(); }
  c.strokeStyle = "#fca5a5"; c.beginPath(); c.moveTo(70, 0); c.lineTo(70, h); c.stroke();
  c.textAlign = "left"; c.font = HAND(36); c.fillStyle = "#1e3a8a"; wrap(c, T.q, w - 110).forEach((t, q) => c.fillText(t, 86, 124 + q * 46));
  c.font = HAND(44); c.fillStyle = RED; c.fillText(T.qLimit, 86, 124 + 2 * 46 + 10);
  c.restore();
};
// the phone with the AI's answer and a word-counter badge
const phone = (c: Ctx, T: Record<string, any>, x: number, y: number, w: number, h: number, badge: string, badgeCol: string) => {
  c.fillStyle = "#0b0f17"; rrect(c, x, y, w, h, 44); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x + 18, y + 40, w - 36, h - 70, 28); c.fill();
  c.textAlign = "left"; c.font = SANS(24, 800); c.fillStyle = "#64748b"; c.fillText("✦ free AI · on our laptop", x + 40, y + 86);
  c.font = SANS(28, 500); c.fillStyle = INK; wrap(c, T.answer, w - 90).slice(0, 9).forEach((t, q) => c.fillText(t, x + 40, y + 132 + q * 38));
  c.fillStyle = badgeCol; rrect(c, x + 40, y + h - 120, w - 80, 70, 35); c.fill();
  c.textAlign = "center"; c.font = SANS(40, 900); c.fillStyle = "#fff"; c.fillText(badge, x + w / 2, y + h - 72);
};
const block = (c: Ctx, x: number, y: number, w: number, small: string, big: string, col: string, bg: string, k = 1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.2)"; rrect(c, x + 6, y + 8, w, 210, 22); c.fill();
  c.fillStyle = bg; rrect(c, x, y, w, 210, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, small, w - 40, 36, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(small, x + w / 2, y + 58);
  c.font = SANS(fit(c, big, w - 40, 96, 900), 900); c.fillStyle = col; c.fillText(big, x + w / 2, y + 170);
  c.restore();
};
// bars against the 150 line and the 135-165 band
const bars = (c: Ctx, T: Record<string, any>, vals: number[], k: number, hl: (v: number) => boolean, y0 = 1200, label = "", top = 330) => {
  const x0 = 90, w = 900, scale = (v: number) => y0 - (v / 250) * (y0 - top);
  c.fillStyle = "rgba(22,163,74,0.14)"; c.fillRect(x0, scale(165), w, scale(135) - scale(165));
  c.setLineDash([16, 12]); c.strokeStyle = BLUE; c.lineWidth = 5; c.beginPath(); c.moveTo(x0, scale(150)); c.lineTo(x0 + w, scale(150)); c.stroke(); c.setLineDash([]);
  c.textAlign = "right"; c.font = SANS(34, 900); c.fillStyle = BLUE; c.fillText("150", x0 - 8, scale(150) + 12);
  c.font = SANS(24, 800); c.fillStyle = GREEN; c.textAlign = "left"; c.fillText(T.band, x0 + 10, scale(165) - 10);
  vals.forEach((v, q) => {
    const kk = clamp((k * 10 - q) * 1.2); if (kk <= 0) return;
    const bx = x0 + 20 + q * 88, top2 = y0 - (y0 - scale(v)) * easeOut(kk);
    c.fillStyle = hl(v) ? GREEN : v > 165 ? RED : AMBER; rrect(c, bx, top2, 64, y0 - top2, 10); c.fill();
    if (kk > 0.9) { c.textAlign = "center"; c.font = SANS(28, 900); c.fillStyle = INK; c.fillText(String(v), bx + 32, top2 - 10); }
  });
  if (label) { c.textAlign = "center"; c.font = SANS(fit(c, label, 900, 40, 900), 900); c.fillStyle = INK; c.fillText(label, 540, y0 + 60); }
};

const StWords: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("t")} at={1} src="audio/sfx_tick.wav" vol={0.5} />, <Sfx key={k("b")} at={2} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("s")} at={cue(i, 1, 0.3)} src="audio/sfx_snap.wav" vol={0.45} />);
    if (b.prop === "tries") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.1) + q * 5} src="audio/sfx_pop.wav" vol={0.14} />));
    if (b.prop === "count") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3)} src="audio/sfx_chime.wav" vol={0.3} />);
    if (b.prop === "question") [0, 10, 20].forEach((d2) => sfx.push(<Sfx key={k("t" + d2)} at={cue(i, 1, 0.1) + d2} src="audio/sfx_tick.wav" vol={0.35} />));
    if (b.prop === "reveal") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.05)} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.65} />, <Sfx key={k("h2")} at={cue(i, 2, 0.05)} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("x")} at={cue(i, 2, 0.05)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "why") sfx.push(<Sfx key={k("p")} at={at + 6} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("h")} at={at + 2} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("ok")} at={cue(i, 1, 0.5)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.85} />); }
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
        desk(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          block(c, 40, 230, 490, T.leftLab, T.leftVal, "#bfdbfe", "#1e3a8a");
          block(c, 550, 230, 490, T.rightLab, T.rightVal, "#fecaca", "#7f1d1d");
          notebook(c, T, 50, 520, 460, 520);
          phone(c, T, 560, 490, 460, 760, T.counter, RED);
        } else if (P === "tries") {
          chip(c, T.triesChip, W / 2, 270, "#0f172a", "#f8fafc", seg(f, ln.from, ln.from + 8), fit(c, T.triesChip, 960, 34, 800));
          bars(c, T, T.plain, seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 30), () => false);
        } else if (P === "count") {
          chip(c, T.countNote, W / 2, 270, "#fef3c7", "#78350f", seg(f, ln.from, ln.from + 8), fit(c, T.countNote, 980, 30, 800));
          bars(c, T, T.count, seg(f, ln.from + 4, ln.from + 34), (v) => v >= 135 && v <= 165);
        } else if (P === "question") {
          c.save(); c.globalAlpha = clamp(seg(f, ln.from, ln.from + 8) * 3);
          c.fillStyle = "#dcf8c6"; rrect(c, 120, 300, 840, 220, 30); c.fill();
          c.textAlign = "left"; c.font = SANS(44, 800); c.fillStyle = INK; wrap(c, T.follow, 760).slice(0, 3).forEach((t, q) => c.fillText(t, 160, 375 + q * 58));
          c.restore();
          const kc = seg(f, cu(1, 0.05) - 2, cu(1, 0.05) + 8);
          (T.choices as string[]).forEach((t, q) => chip(c, t, 540, 680 + q * 150, q === 2 ? "#0f172a" : "#f8fafc", q === 2 ? "#fde68a" : INK, seg(f, cu(1, 0.05) + q * 12, cu(1, 0.05) + q * 12 + 8), 64));
          if (kc > 0) { c.save(); c.globalAlpha = 0.25 + 0.2 * Math.sin(f * 0.4); c.font = SANS(300, 900); c.fillStyle = BLUE; c.textAlign = "center"; c.fillText("?", 540, 1260); c.restore(); }
        } else if (P === "reveal") {
          const t1 = cu(1, 0.05), t2 = cu(2, 0.05);
          const roll = clamp((f - t1) / 16), v = Math.round(102 + (185 - 102) * easeOut(roll));
          const head = "ASKED 150 · TOLD \"YOU WROTE 102\"";   // stills: it ran off both edges
          c.textAlign = "center"; c.font = SANS(fit(c, head, 960, 56, 900), 900); c.fillStyle = INK; c.fillText(head, 540, 320);
          c.font = SANS(260, 900); c.fillStyle = f >= t1 ? RED : "#94a3b8"; c.fillText(f >= t1 ? String(v) : "102", 400, 590);
          if (f >= t2 - 2) {
            const k2 = seg(f, t2 - 2, t2 + 6);
            c.save(); c.globalAlpha = clamp(k2 * 3); c.translate(830, 500); c.rotate(-0.08); c.scale(1.4 - 0.4 * easeOut(k2), 1.4 - 0.4 * easeOut(k2));
            c.fillStyle = "#fff"; rrect(c, -170, -90, 340, 150, 20); c.fill(); c.strokeStyle = RED; c.lineWidth = 10; rrect(c, -170, -90, 340, 150, 20); c.stroke();
            c.font = SANS(110, 900); c.fillStyle = RED; c.fillText(T.reveal2, 0, 30); c.restore();
            bars(c, T, T.feedback, seg(f, t2 + 8, t2 + 38), (x) => x >= 135 && x <= 165, 1210, T.overNote, 700);   // stills: bars under the numbers, not over them
          }
        } else if (P === "why") {
          const k0 = seg(f, ln.from + 2, ln.from + 30);
          c.textAlign = "center"; c.font = SANS(fit(c, T.tokLine, 940, 60, 900), 900); c.fillStyle = INK; c.fillText(T.tokLine, 540, 320);
          let x = 70, y = 400;
          (T.tokens as string[]).forEach((t, q) => {
            const kk = clamp((k0 * 14 - q) * 1.2); if (kk <= 0) return;
            c.font = MONO(40, 700); const tw = c.measureText(t.trim() || "·").width + 30;
            if (x + tw > 1010) { x = 70; y += 90; }
            c.save(); c.globalAlpha = kk; c.fillStyle = ["#fde68a", "#bfdbfe", "#bbf7d0", "#fecaca"][q % 4]; rrect(c, x, y, tw, 70, 14); c.fill();
            c.fillStyle = INK; c.textAlign = "left"; c.fillText(t.trim(), x + 15, y + 50); c.restore();
            x += tw + 12;
          });
          chip(c, T.tokTotal, 540, 820, "#0f172a", "#f8fafc", seg(f, ln.from + 30, ln.from + 38), fit(c, T.tokTotal, 960, 40, 900));
          c.font = SANS(fit(c, T.tokSrc, 960, 26, 700), 700); c.fillStyle = "#475569"; c.textAlign = "center"; if (f > ln.from + 30) c.fillText(T.tokSrc, 540, 900);
          chip(c, T.guessLong, 540, 1080, RED, "#fff", seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 6), fit(c, T.guessLong, 960, 56, 900));
        } else if (P === "rule") {
          const k0 = seg(f, ln.from - 6, ln.from + 4), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          chip(c, T.rule1, 540, 290, "#0f172a", "#fde68a", k0, fit(c, T.rule1, 960, 44, 900));
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(0, (1 - easeOut(clamp(k1 * 1.5))) * 40);
            c.fillStyle = "#dcfce7"; rrect(c, 60, 400, 960, 640, 30); c.fill(); c.strokeStyle = GREEN; c.lineWidth = 6; rrect(c, 60, 400, 960, 640, 30); c.stroke();
            c.textAlign = "center"; c.font = SANS(64, 900); c.fillStyle = "#14532d"; wrap(c, T.rule2, 860).slice(0, 3).forEach((t, q) => c.fillText(t, 540, 510 + q * 76));
            c.font = SANS(fit(c, T.rule3, 880, 36, 800), 800); c.fillStyle = "#166534"; c.fillText(T.rule3, 540, 760);
            c.font = SANS(fit(c, T.rule4, 880, 60, 900), 900); c.fillStyle = "#14532d"; c.fillText(T.rule4, 540, 900);
            c.restore();
          }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const WORDS41_SCENES = { sk_words41: StWords };
