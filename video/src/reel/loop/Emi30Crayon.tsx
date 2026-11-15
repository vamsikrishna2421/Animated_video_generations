import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block } from "./TutorialCrayon";

// Creative 30 "₹23,405 or ₹34,713? The AI's EMI" (series/scripts/creative30_emi.md): a calm explainer in the Hanuman
// pilot's shape: no characters, one narrator, one picture per beat, a bell on every cut (deep on frame 1 and the loop).
// The same ₹40 lakh home loan, the AI's EMI vs the real one; the AI's own step-by-step working ("calculated using a
// calculator": it had none); our test (0/10, 0/10, 4/10); a calculator, not a chat. Numbers: data.t, from
// series/scripts/creative30_demo/emi.json.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const RED = "#f87171";
const GREEN = "#4ade80";
const AMBER = "#fde68a";
const BG = "#14110f";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "DejaVu Sans Mono", Menlo, monospace`;
const BELL_SOFT = "reel/creative30/bell_soft.wav";
const BELL_DEEP = "reel/creative30/bell_deep.wav";

const title = (c: Ctx, t: string, y: number, col = AMBER, size = 60) => {
  c.font = SANS(fit(c, t, 980, size, 900), 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 540, y);
};
// a house: walls, roof, door, two windows, a nameplate
const house = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#fbbf24"; c.beginPath(); c.moveTo(-230, -40); c.lineTo(0, -230); c.lineTo(230, -40); c.closePath(); c.fill();
  c.fillStyle = "#b45309"; c.fillRect(-230, -52, 460, 22);
  c.fillStyle = "#fef3c7"; c.fillRect(-190, -40, 380, 300);
  c.fillStyle = "#92400e"; rrect(c, -45, 120, 90, 140, 8); c.fill();
  c.fillStyle = "#7dd3fc"; c.fillRect(-160, 20, 80, 70); c.fillRect(80, 20, 80, 70);
  c.strokeStyle = "#78350f"; c.lineWidth = 6; c.strokeRect(-160, 20, 80, 70); c.strokeRect(80, 20, 80, 70);
  c.fillStyle = "#1e293b"; rrect(c, -70, -20, 140, 34, 6); c.fill();
  c.font = SANS(22, 800); c.fillStyle = "#fef3c7"; c.textAlign = "center"; c.fillText("OUR HOME", 0, 5);
  c.restore();
};
const paper = (c: Ctx, x: number, y: number, w: number, h: number, lines = true) => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.4)"; rrect(c, x + 10, y + 12, w, h, 12); c.fill();
  c.fillStyle = "#fffbeb"; rrect(c, x, y, w, h, 12); c.fill();
  if (lines) {
    c.strokeStyle = "rgba(59,130,246,0.25)"; c.lineWidth = 2;
    for (let yy = y + 90; yy < y + h - 20; yy += 62) { c.beginPath(); c.moveTo(x + 20, yy); c.lineTo(x + w - 20, yy); c.stroke(); }
    c.strokeStyle = "rgba(239,68,68,0.45)"; c.beginPath(); c.moveTo(x + 80, y + 20); c.lineTo(x + 80, y + h - 20); c.stroke();
  }
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = "#dc2626", rot = -0.07) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  const sc = 1 + 0.4 * (1 - clamp(k * 2)); c.scale(sc, sc);
  c.font = SANS(fit(c, t, 900, 64, 900), 900); const w = c.measureText(t).width + 60;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2, -62, w, 96, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 8; rrect(c, -w / 2, -62, w, 96, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 8); c.restore();
};
const calculator = (c: Ctx, x: number, y: number, s: number, shown: string, dim = false) => {
  c.save(); c.translate(x, y); c.scale(s, s); if (dim) c.globalAlpha = 0.35;
  c.fillStyle = "#334155"; rrect(c, -170, -250, 340, 500, 30); c.fill();
  c.fillStyle = "#bef264"; rrect(c, -140, -215, 280, 100, 12); c.fill();
  c.font = MONO(56, 800); c.fillStyle = "#1a2e05"; c.textAlign = "right"; c.fillText(shown, 125, -145);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    c.fillStyle = q === 3 ? "#f59e0b" : "#e2e8f0"; rrect(c, -140 + q * 72, -90 + r * 80, 60, 62, 10); c.fill();
  }
  c.restore();
};

const StEmi: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  if (beats[0]?.prop !== "hook") sfx.push(<Sfx key="bell" at={0} src={BELL_SOFT} vol={0.3} />);   // a bell on every cut
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={0} src={BELL_DEEP} vol={0.42} />, <Sfx key={k("p")} at={cue(i, 1, 0.5) - 4} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "gap") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5) + 8} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "steps") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.6)} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("t")} at={cue(i, 2, 0.8) - 4} src={BELL_DEEP} vol={0.45} />   /* script review: one deep bell, in the pause */);
    if (b.prop === "why") sfx.push(<Sfx key={k("p")} at={at + 6} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("1")} at={cue(i, 1, 0.3)} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("2")} at={cue(i, 2, 0.6)} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("3")} at={cue(i, 3, 0.85) + 10} src="audio/gag_ding.wav" vol={0.45} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 30)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src={BELL_DEEP} vol={0.42} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(3030 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        c.fillStyle = BG; c.fillRect(0, 0, W, H);
        c.save(); c.translate(540 * 0.06, 112); c.scale(0.94, 0.94);   // render check: clear the reel's header strip, end above the captions
        const P = loopOn ? "hook" : b.prop;
        if (P === "hook") {
          paper(c, 90, 150, 900, 150, false);
          c.font = SANS(fit(c, T.loan, 820, 48, 900), 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(T.loan, 540, 245);
          block(c, 50, 360, "SMALL FREE AI · NO CALCULATOR", T.ai, RED);   // script review: not "THE AI"
          block(c, 560, 360, "THE REAL EMI · a month", T.real, GREEN);
          const kR = loopOn ? 1 : seg(f, cu(1, 0.5), cu(1, 0.5) + 10);
          if (kR > 0) { c.save(); c.globalAlpha = clamp(kR * 2); c.strokeStyle = GREEN; c.lineWidth = 8; rrect(c, 556, 356, 478, 168, 24); c.stroke(); c.restore(); }
          chip(c, "same home loan · a month", 540, 580, "#1c1917", "#e7e5e4", loopOn ? 1 : seg(f, cu(1, 0.5), cu(1, 0.5) + 8), 40);
          house(c, 540, 1080, 1.35);
        } else if (P === "gap") {
          title(c, "PLAN YOUR BUDGET ON IT:", 200, "#e7e5e4", 52);
          title(c, `${T.short} SHORT, EVERY MONTH`, 275, RED, 64);
          const n = Math.floor(240 * seg(f, ln.from, cu(1, 0.5)));
          for (let q = 0; q < 240; q++) {
            const col = q % 12, row = Math.floor(q / 12), x = 150 + col * 66, y = 330 + row * 40;
            c.fillStyle = q < n ? "#ef4444" : "#292524"; rrect(c, x, y, 56, 32, 6); c.fill();
          }
          c.font = SANS(26, 700); c.fillStyle = "#a8a29e"; c.textAlign = "right";
          for (let row = 0; row < 20; row += 5) c.fillText(`year ${row + 1}`, 138, 355 + row * 40);
          const k2 = seg(f, cu(1, 0.5), cu(1, 0.5) + 10);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.font = SANS(44, 800); c.fillStyle = "#e7e5e4"; c.textAlign = "center"; c.fillText(`${T.short} × ${T.months} months`, 540, 1200);
            c.font = SANS(fit(c, `= ${T.lost}`, 960, 110, 900), 900); c.fillStyle = RED; c.fillText(`= ${T.lost}`, 540, 1330);
            c.restore();
          }
        } else if (P === "steps") {   // script review: the decimals faded, the quote big and alone
          title(c, "ASKED TO GO STEP BY STEP", 230, AMBER, 58);
          const st: string[] = T.steps;
          const kQ = seg(f, cu(1, 0.6), cu(1, 0.6) + 10);
          paper(c, 60, 290, 960, 560);
          const nShow = 6 * seg(f, ln.from + 4, cu(1, 0.6));
          [0, 1, 2, 4, 5].forEach((q, j) => {
            const kk = clamp(nShow - q); if (kk <= 0) return;
            const t = st[q], y = 370 + j * 100;
            c.save(); c.globalAlpha = 1 - 0.65 * clamp(kQ);
            c.font = MONO(fit(c, t, 860, 40, 700), 700); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t.slice(0, Math.ceil(t.length * kk)), 108, y);
            c.restore();
          });
          if (kQ > 0) {   // the AI's own words, alone
            c.save(); c.globalAlpha = clamp(kQ * 2);
            c.fillStyle = "#fef08a"; rrect(c, 60, 880, 960, 250, 22); c.fill();
            c.font = SANS(34, 800); c.fillStyle = "#713f12"; c.textAlign = "center"; c.fillText("the AI wrote:", 540, 935);
            c.font = SANS(54, 900); c.fillStyle = INK;
            wrap(c, "\u201ccalculated using a calculator\u201d", 900).forEach((t, q) => c.fillText(t, 540, 1010 + q * 64));
            const full = "(its full line: \u201cThis value is calculated using a calculator or financial software\u201d)";
            c.font = SANS(fit(c, full, 900, 28, 700), 700); c.fillStyle = "#713f12"; c.fillText(full, 540, 1100);
            c.restore();
          }
          stamp(c, "NO CALCULATOR", 540, 1230, seg(f, cu(2, 0.8), cu(2, 0.8) + 8));
          const kG = seg(f, cu(2, 0.8) + 14, cu(2, 0.8) + 22);
          if (kG > 0) {
            c.save(); c.globalAlpha = clamp(kG * 3);
            c.font = SANS(40, 900); c.fillStyle = "#15803d"; c.textAlign = "right"; c.fillText(T.realPow, 1000, 570);
            c.restore();
            chip(c, `it said ${T.stepsEmi} · real ${T.real}`, 540, 1380, "#1c1917", AMBER, kG, 46);
          }
        } else if (P === "why") {
          title(c, "IT WRITES THE NEXT LIKELY WORD", 260, AMBER, 58);
          const toks = ["The", "EMI", "is", "₹", "2", "3", ",", "4", "0", "5"];
          const nT = toks.length * seg(f, ln.from + 4, cu(1, 0.4));
          let x = 70, y = 470;
          toks.forEach((t, q) => {
            const kk = clamp(nT - q); if (kk <= 0) return;
            c.font = SANS(64, 800); const w = c.measureText(t).width + 40;
            if (x + w > 1010) { x = 70; y += 130; }
            c.save(); c.globalAlpha = clamp(kk * 2);
            c.fillStyle = q >= 3 ? "#7f1d1d" : "#292524"; rrect(c, x, y - 70, w, 100, 16); c.fill();
            c.fillStyle = q >= 3 ? "#fecaca" : "#f5f5f4"; c.textAlign = "left"; c.fillText(t, x + 20, y + 3);
            c.restore();
            x += w + 16;
          });
          chip(c, "each piece: the most likely next one", 540, 800, "#1c1917", "#d6d3d1", seg(f, ln.from + 20, ln.from + 28), 40);
          chip(c, "the hard step: guessed", 540, 900, "#7f1d1d", "#fecaca", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 46);
          const kC = seg(f, cu(1, 0.4), cu(1, 0.4) + 10);
          if (kC > 0) {
            c.save(); c.globalAlpha = clamp(kC * 3); calculator(c, 540, 1130, 0.8, "?", true); c.restore();
            chip(c, "a calculator: not used", 540, 1400, "#292524", RED, kC, 46);
          }
        } else if (P === "test") {
          title(c, "OUR TEST · 10 LOANS", 240, AMBER, 64);
          c.font = SANS(32, 700); c.fillStyle = "#d6d3d1"; c.textAlign = "center"; c.fillText("right = exact to the rupee", 540, 300);
          const rows: [string, string, boolean[], string, number][] = [
            ["asked plainly", "0/10", Array(10).fill(false), "", cu(1, 0.3)],
            ["step by step", "0/10", Array(10).fill(false), "closer: off by ₹32 to ₹1,621 a month", cu(2, 0.6)],
            ["as a formula we worked out", "4/10", T.codeRight, "4 exact · the 6 wrong formulas were far off", cu(3, 0.85) + 10]];
          rows.forEach(([a, v, hits, sub, t0], q) => {
            const k = seg(f, t0 - 2, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 360 + q * 300;
            c.fillStyle = "#1c1917"; rrect(c, 40, y, W - 80, 270, 22); c.fill();
            c.font = SANS(fit(c, a, 700, 44, 800), 800); c.fillStyle = "#f5f5f4"; c.textAlign = "left"; c.fillText(a, 80, y + 66);
            c.font = SANS(72, 900); c.textAlign = "right"; c.fillStyle = v === "0/10" ? RED : GREEN; c.fillText(v, W - 80, y + 76);
            hits.forEach((h, j) => {
              const x = 80 + j * 92, yy = y + 110, kj = seg(f, t0 + j * 2, t0 + j * 2 + 5);
              if (kj <= 0) return;
              c.fillStyle = h ? GREEN : "#ef4444"; rrect(c, x, yy, 76, 76, 12); c.fill();
              c.font = SANS(44, 900); c.fillStyle = "#0c0a09"; c.textAlign = "center"; c.fillText(h ? "✓" : "✗", x + 38, yy + 54);
            });
            if (sub) { c.font = SANS(fit(c, sub, W - 160, 32, 700), 700); c.fillStyle = "#d6d3d1"; c.textAlign = "left"; c.fillText(sub, 80, y + 238); }
            c.restore();
          });
          chip(c, "a small free AI on our computer · no tools", 540, 1330, "#292524", "#e7e5e4", seg(f, ln.from + 6, ln.from + 14), 40);
        } else if (P === "fix") {   // script review: a fix anyone can do, the big apps said aloud
          title(c, "FOR MONEY: A CALCULATOR", 250, GREEN, 64);
          calculator(c, 540, 640, 0.9, "34,713");
          chip(c, T.search, 540, 1010, "#1c1917", AMBER, seg(f, ln.from + 6, ln.from + 14), big(c, T.search, 48));
          chip(c, "big apps can run real code:", 540, 1130, "#1c1917", "#e7e5e4", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 44);   // render check: one long chip was small
          chip(c, "ask them to, then match it with your bank's", 540, 1230, "#1c1917", "#e7e5e4", seg(f, cu(1, 0.3) + 8, cu(1, 0.3) + 16), big(c, "ask them to, then match it with your bank's", 44));
          chip(c, T.formula, 540, 1360, "#fffbeb", INK, seg(f, cu(1, 0.3) + 24, cu(1, 0.3) + 32), big(c, T.formula, 36));
        } else if (P === "loop") {
          const k = seg(f, ln.from, ln.from + 10);
          c.save(); c.globalAlpha = clamp(k * 2);
          paper(c, 90, 520, 900, 520, false);
          c.font = SANS(fit(c, "MONEY MATHS:", 760, 90, 900), 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("MONEY MATHS:", 540, 700);
          c.font = SANS(fit(c, "A CALCULATOR,", 760, 90, 900), 900); c.fillStyle = "#15803d"; c.fillText("A CALCULATOR,", 540, 820);
          c.font = SANS(fit(c, "NOT A CHAT", 760, 90, 900), 900); c.fillStyle = "#b91c1c"; c.fillText("NOT A CHAT", 540, 940);
          c.restore();
        }
        c.restore();
      }} />
    </>
  );
};
const big = (c: Ctx, t: string, size: number) => fit(c, t, 1000, size, 800);

export const EMI30_SCENES = { sk_emi30: StEmi };
