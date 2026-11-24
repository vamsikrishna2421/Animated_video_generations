import React from "react";
import { Ctx, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 39 "₹4,999 in a Mango Email" (series/scripts/creative39_mango_mail.md): a POV reel, one narrator and the
// phone's AI. A mango-sale email (made up) carries one line hidden in white text; the AI's summary tells you to pay a
// ₹4,999 electricity bill at a link. Our test (series/scripts/creative39_demo, a small free AI on our computer, 10 fresh
// chats each, read by hand): plain summary 10/10 said pay; the builder's guard 8/10 still gave the link; asked who is
// asking for the money, 10/10 named the mango shop or "an admin note". July 2025: a researcher showed Gemini's email
// summary repeating a hidden fake warning (BleepingComputer, SecurityWeek). The rule: never pay from a summary.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#d97706";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const PX = 150, PY = 470, PW = 780, PH = 1000;   // the phone's screen

// night in the living room: a dark wall, a lamp's glow, the sofa arm, your hands round the phone
const room = (c: Ctx, W: number, H: number, flick: number) => {
  c.fillStyle = "#172033"; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(900, 260, 20, 900, 260, 520); g.addColorStop(0, `rgba(253,224,71,${0.35 * (1 - flick)})`); g.addColorStop(1, "rgba(253,224,71,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "#3f2a1d"; rrect(c, -40, 1560, W + 80, 420, 60); c.fill();          // the sofa arm
  c.fillStyle = "#5b3a26"; rrect(c, -40, 1600, W + 80, 60, 30); c.fill();
};
const phoneBody = (c: Ctx) => {
  c.fillStyle = "#0b0f17"; rrect(c, PX - 26, PY - 60, PW + 52, PH + 110, 70); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, PX, PY, PW, PH, 44); c.fill();
  c.fillStyle = "#0b0f17"; rrect(c, PX + PW / 2 - 70, PY - 40, 140, 22, 11); c.fill();
  // thumbs at the sides (your hands)
  c.fillStyle = "#c68642"; rrect(c, PX - 80, PY + 560, 110, 300, 55); c.fill(); rrect(c, PX + PW - 30, PY + 600, 110, 280, 55); c.fill();
};
const block = (c: Ctx, x: number, w: number, small: string, big: string, col: string, bg: string) => {
  c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, x + 6, 214, w, 210, 22); c.fill();
  c.fillStyle = bg; rrect(c, x, 206, w, 210, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, small, w - 40, 34, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(small, x + w / 2, 258);
  c.font = SANS(fit(c, big, w - 40, 74, 900), 900); c.fillStyle = col; c.fillText(big, x + w / 2, 360);
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.08) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); while (c.measureText(t).width > 900 && s > 28) { s -= 2; c.font = SANS(s, 900); }
  const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.96)"; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2 - 24, -s * 0.9, w + 48, s * 1.3, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// the AI summary card on the phone
const summary = (c: Ctx, T: Record<string, any>, k: number) => {
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#ede9fe"; rrect(c, PX + 30, PY + 60, PW - 60, 90, 20); c.fill();
  c.textAlign = "left"; c.font = SANS(36, 900); c.fillStyle = "#5b21b6"; c.fillText(T.sumTitle, PX + 60, PY + 120);
  c.font = SANS(34, 700); c.fillStyle = "#475569"; wrap(c, T.sumMango, PW - 120).slice(0, 2).forEach((t, q) => c.fillText(t, PX + 60, PY + 220 + q * 44));
  c.fillStyle = "#fee2e2"; rrect(c, PX + 30, PY + 330, PW - 60, 360, 24); c.fill(); c.strokeStyle = RED; c.lineWidth = 5; rrect(c, PX + 30, PY + 330, PW - 60, 360, 24); c.stroke();
  c.font = SANS(44, 900); c.fillStyle = "#7f1d1d"; wrap(c, T.sumBill, PW - 140).slice(0, 4).forEach((t, q) => c.fillText(t, PX + 60, PY + 400 + q * 56));
  c.font = SANS(fit(c, T.link, PW - 140, 38, 800), 800); c.fillStyle = "#1d4ed8"; c.fillText(T.link, PX + 60, PY + 650);
  c.fillStyle = RED; rrect(c, PX + 90, PY + 740, PW - 180, 110, 55); c.fill();
  c.font = SANS(48, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(T.payBtn, PX + PW / 2, PY + 812);
  c.restore();
};
// the email as you see it (and, with `hidden`, the line the AI reads)
const email = (c: Ctx, T: Record<string, any>, k: number, hidden: number, x = PX, y = PY, w = PW, scale = 1) => {
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.scale(scale, scale);
  const ww = w / scale;
  c.textAlign = "left"; c.font = SANS(30, 800); c.fillStyle = "#64748b"; c.fillText(T.from, 36, 70);
  c.font = SANS(fit(c, T.subject, ww - 72, 38, 900), 900); c.fillStyle = INK; c.fillText(T.subject, 36, 124);
  // the mango basket
  c.fillStyle = "#a16207"; rrect(c, ww / 2 - 170, 300, 340, 120, 30); c.fill();
  [[-110, 260, "#f59e0b"], [-30, 240, "#facc15"], [60, 255, "#f97316"], [130, 275, "#eab308"], [-150, 290, "#fbbf24"], [10, 280, "#fb923c"]].forEach(([dx, yy, col]) => {
    c.fillStyle = col as string; c.beginPath(); c.ellipse(ww / 2 + (dx as number), yy as number, 52, 42, 0.3, 0, 7); c.fill();
  });
  c.textAlign = "center"; c.font = SANS(fit(c, T.offer, ww - 72, 62, 900), 900); c.fillStyle = "#c2410c"; c.fillText(T.offer, ww / 2, 500);
  c.font = SANS(32, 700); c.fillStyle = "#334155"; (T.body as string[]).forEach((t, q) => c.fillText(t, ww / 2, 570 + q * 44));
  if (hidden > 0) {   // the highlighter finds the white line
    const hw = (ww - 72) * easeOut(clamp(hidden * 1.4));
    c.fillStyle = "rgba(253,224,71,0.85)"; rrect(c, 36, 760, hw, 190, 12); c.fill();
    c.save(); c.beginPath(); c.rect(36, 760, hw, 190); c.clip();
    c.textAlign = "left"; c.font = SANS(28, 900); c.fillStyle = RED; wrap(c, T.hiddenLine, ww - 110).slice(0, 5).forEach((t, q) => c.fillText(t, 54, 796 + q * 36));
    c.restore();
  }
  c.restore();
};
const tiles = (c: Ctx, cols: string[], x: number, y: number, k: number, h = 80) => {
  cols.forEach((col, q) => {
    const kk = clamp((k * 10 - q) * 1.5); if (kk <= 0) return;
    c.save(); c.globalAlpha = kk; c.fillStyle = col; rrect(c, x + q * 92, y, 80, h, 14); c.fill(); c.restore();
  });
};

const StMango: React.FC<SP> = ({ s }) => {
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
    if (i > 0 && beats[i - 1].prop !== b.prop) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("z")} at={3} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("g")} at={cue(i, 1, 0.5)} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "reveal") { const v0 = cue(i, 1, 0.2) + 8; for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("t" + q)} at={v0 + q * 3} src="audio/sfx_pop.wav" vol={0.16} />); sfx.push(<Sfx key={k("h")} at={v0 + 30} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />); }
    if (b.prop === "verdict") sfx.push(<Sfx key={k("m")} at={at + 2} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "guard") { for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("t" + q)} at={cue(i, 1, 0.4) + q * 3} src="audio/sfx_pop.wav" vol={0.16} />); sfx.push(<Sfx key={k("x")} at={cue(i, 1, 0.4) + 32} src="reel/sfx_buzz.wav" vol={0.32} />, <Sfx key={k("ok")} at={cue(i, 2, 0.3)} src="audio/sfx_success.wav" vol={0.3} />); }
    if (b.prop === "real") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "ask") { [0, 5, 10, 15, 20, 25, 30, 35].forEach((d2) => sfx.push(<Sfx key={k("k" + d2)} at={at + 2 + d2} src="audio/sfx_tick.wav" vol={0.2} />)); sfx.push(<Sfx key={k("x")} at={cue(i, 1, 0.3)} src="reel/sfx_buzz.wav" vol={0.28} />, <Sfx key={k("s")} at={cue(i, 2, 0.2) + 24} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />); }
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("ok")} at={cue(i, 1, 0.6)} src="audio/sfx_success.wav" vol={0.3} />);
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
        const flick = (P === "hook" && f - ln.from < 10 && (f % 4 < 2)) || (loopOn && f - endL - HOLD < 10 && f % 4 < 2) ? 1 : 0;
        room(c, W, H, flick);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          phoneBody(c); summary(c, T, 1);
          block(c, 40, 490, T.leftLab, T.leftVal, "#86efac", "#14532d");
          block(c, 550, 490, T.rightLab, T.rightVal, "#fecaca", "#7f1d1d");
          if (P === "hook" && !loopOn) chip(c, T.stake, W / 2, 1530, RED, "#fff", seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6), 44);
        } else if (P === "reveal") {
          phoneBody(c);
          const kE = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 8);
          if (kE < 1) summary(c, T, 1 - kE);
          email(c, T, kE, 0);
          chip(c, T.story, W / 2, 400, "#1e293b", "#f8fafc", seg(f, cu(1, 0.1), cu(1, 0.1) + 8), fit(c, T.story, W - 140, 34, 800));
          const kV = seg(f, cu(1, 0.2) + 8, cu(1, 0.2) + 36);   // the verdict on screen by ~8 s (Bujji, Creative 28's 7-day read)
          if (kV > 0) { c.textAlign = "center"; c.font = SANS(fit(c, T.verdict, W - 80, 52, 900), 900); c.fillStyle = "#fecaca"; c.fillText(T.verdict, W / 2, 290); tiles(c, Array(10).fill(RED), (W - 908) / 2, 306, kV, 58); }
        } else if (P === "verdict") {
          phoneBody(c); email(c, T, 1, seg(f, ln.from + 2, ln.from + 22));   // the highlighter finds the line at once
          const kT = 1;   // the tiles came in on the line before
          c.textAlign = "center"; c.font = SANS(fit(c, T.verdict, W - 80, 52, 900), 900); c.fillStyle = kT > 0 ? "#fecaca" : "rgba(0,0,0,0)"; c.fillText(T.verdict, W / 2, 290);   // stills: clear of the header
          tiles(c, Array(10).fill(RED), (W - 908) / 2, 306, kT, 58);
          const kS = seg(f, cu(1, 0.2) - 2, cu(1, 0.2) + 6);
          if (kS > 0) { c.save(); c.globalAlpha = clamp(kS * 3); c.font = SANS(fit(c, T.smallAI, W - 80, 36, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(T.smallAI, W / 2, 400); c.restore(); }
        } else if (P === "why") {
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 8);
          c.textAlign = "center"; c.font = SANS(44, 900); c.fillStyle = "#e2e8f0"; c.fillText(T.seeLab, 280, 330); c.fillText(T.readLab, 800, 330);
          [[40, 0, k1], [560, 1, k2]].forEach(([x, hid, kk]) => {
            if ((kk as number) <= 0) return;
            c.save(); c.globalAlpha = clamp((kk as number) * 3); c.fillStyle = "#f8fafc"; rrect(c, x as number, 370, 480, 860, 30); c.fill(); c.restore();
            email(c, T, kk as number, hid ? 1 : 0, x as number, 370, 480, 0.615);
          });
          if (k2 > 0) chip(c, T.whyChip, W / 2, 1340, "#1e293b", "#fde68a", seg(f, cu(1, 0.7) - 2, cu(1, 0.7) + 6), fit(c, T.whyChip, W - 120, 40, 900));
        } else if (P === "guard") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), kT = seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 28);
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = "#e2e8f0"; c.fillText(T.guardHead, W / 2, 330);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = "#1e293b"; rrect(c, 60, 390, W - 120, 300, 26); c.fill();
            c.textAlign = "left"; c.font = SANS(32, 800); c.fillStyle = "#93c5fd"; c.fillText(T.guardLab, 100, 450);
            c.font = SANS(44, 900); c.fillStyle = "#f8fafc"; wrap(c, T.guardText, W - 220).slice(0, 4).forEach((t, q) => c.fillText(t, 100, 520 + q * 54));
            c.restore();
          }
          tiles(c, [RED, RED, RED, RED, RED, RED, RED, RED, AMBER, GREEN], (W - 908) / 2, 760, kT);
          if (kT > 0.9) { c.textAlign = "center"; c.font = SANS(fit(c, T.guardStat, W - 100, 58, 900), 900); c.fillStyle = "#fecaca"; c.fillText(T.guardStat, W / 2, 960);
            c.font = SANS(fit(c, T.guardNote, W - 80, 46, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(T.guardNote, W / 2, 1020); }
          chip(c, T.stripStat, W / 2, 1180, "#14532d", "#f0fdf4", seg(f, cu(2, 0.1) - 2, cu(2, 0.1) + 6), fit(c, T.stripStat, W - 100, 50, 900));
        } else if (P === "real") {
          const k0 = seg(f, ln.from + 2, ln.from + 12), k1 = seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 8);
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.fillText(T.realHead, W / 2, 330);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.translate(0, (1 - easeOut(clamp(k0 * 1.5))) * 40);
            c.fillStyle = "#f8fafc"; rrect(c, 60, 400, W - 120, 700, 28); c.fill();
            c.fillStyle = "#0f172a"; rrect(c, 60, 400, W - 120, 100, 28); c.fill(); c.fillRect(60, 460, W - 120, 40);
            c.textAlign = "left"; c.font = SANS(36, 900); c.fillStyle = "#f8fafc"; c.fillText(T.realDate, 100, 466);
            c.font = SANS(50, 900); c.fillStyle = INK; wrap(c, T.realTitle, W - 220).slice(0, 3).forEach((t, q) => c.fillText(t, 100, 570 + q * 60));
            c.restore();
          }
          if (k1 > 0) {   // render review: the card sat still for 10 s; the warning drops in on the cue
            c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(0, (1 - easeOut(clamp(k1 * 1.5))) * 30);
            c.fillStyle = "#fee2e2"; rrect(c, 90, 720, W - 180, 130, 18); c.fill(); c.strokeStyle = RED; c.lineWidth = 5; rrect(c, 90, 720, W - 180, 130, 18); c.stroke();
            c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = "#7f1d1d"; wrap(c, T.realWarn, W - 240).slice(0, 2).forEach((t, q) => c.fillText(t, 120, 774 + q * 48)); c.restore();
          }
          const kG = seg(f, cu(1, 0.7) - 4, cu(1, 0.7) + 6);
          if (kG > 0) {
            c.save(); c.globalAlpha = clamp(kG * 3); c.textAlign = "left"; c.font = SANS(46, 800); c.fillStyle = "#334155";
            wrap(c, T.realGoogle, W - 220).slice(0, 2).forEach((t, q) => c.fillText(t, 100, 935 + q * 56));
            c.font = SANS(fit(c, T.realSrc, W - 200, 36, 700), 700); c.fillStyle = "#64748b"; c.fillText(T.realSrc, 100, 1070); c.restore();
          }
        } else if (P === "ask") {
          phoneBody(c);
          const k1 = seg(f, ln.from + 2, ln.from + 8), k2 = seg(f, cu(2, 0.2) - 2, cu(2, 0.2) + 20);
          c.save(); c.textAlign = "left";
          const typed = (T.question as string).slice(0, Math.round((T.question as string).length * clamp((f - ln.from) / 40)));
          if (k1 > 0) { c.fillStyle = "#dcf8c6"; rrect(c, PX + 60, PY + 50, PW - 90, 230, 24); c.fill(); c.font = SANS(38, 900); c.fillStyle = INK; wrap(c, typed || " ", PW - 150).slice(0, 4).forEach((t, q) => c.fillText(t, PX + 90, PY + 104 + q * 48)); }
          chip(c, T.stillLink, W / 2, PY + 340, RED, "#fff", seg(f, cu(1, 0.3) - 2, cu(1, 0.3) + 6), 40);
          (T.answers as string[]).forEach((a, q) => {
            const kk = clamp((k2 * 10 - q) * 1.5); if (kk <= 0) return;
            const x = PX + 40 + (q % 2) * 360, y = PY + 400 + Math.floor(q / 2) * 100;
            const mango = a.startsWith("Green");
            c.globalAlpha = kk; c.fillStyle = mango ? "#ffedd5" : "#e0e7ff"; rrect(c, x, y, 340, 84, 18); c.fill();
            c.font = SANS(fit(c, a, 300, 36, 900), 900); c.fillStyle = mango ? "#9a3412" : "#3730a3"; c.fillText(a, x + 20, y + 54);
          });
          c.restore();
          if (k2 >= 1) stamp(c, T.notPower, W / 2, PY + 930, 56, RED, seg(f, cu(2, 0.2) + 22, cu(2, 0.2) + 30));
        } else if (P === "rule") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, ln.from + 10, ln.from + 20);   // render review: both halves on the card
          stamp(c, T.rule1, W / 2, 520, 96, RED, k0, -0.05);   // render review: the rule was too small
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(0, (1 - easeOut(clamp(k1 * 1.5))) * 40);
            c.fillStyle = "#dcfce7"; rrect(c, 80, 700, W - 160, 300, 28); c.fill(); c.strokeStyle = GREEN; c.lineWidth = 6; rrect(c, 80, 700, W - 160, 300, 28); c.stroke();
            c.textAlign = "center"; c.font = SANS(72, 900); c.fillStyle = "#14532d"; wrap(c, T.rule2, W - 240).slice(0, 3).forEach((t, q) => c.fillText(t, W / 2, 820 + q * 86));
            c.restore();
          }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const MANGO39_SCENES = { sk_mango39: StMango };
