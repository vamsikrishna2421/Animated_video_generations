import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx, robot } from "./DistillCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 43 "20% Wrong, 10/10" (series/scripts/creative43_homework_judge.md): a TV talent-show parody, one host and an
// AI judge. Chintu (made up) answers a class-7 profit question wrong (20%, "profit is always on the selling price"; the
// answer is 25%). A small free AI on our computer, asked to check it and give marks, 10 fresh chats: 8 to 10 marks every
// time, average 9, and never once "wrong" (series/scripts/creative43_demo, every reply read by hand).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number; who: string };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const DIR = "reel/creative43v1/";
const RED = "#ef4444", GREEN = "#22c55e", GOLD = "#facc15", INK = "#0f172a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const HAND = (s: number) => `700 ${s}px Caveat, "Noto Sans Telugu", cursive`;

const stage = (c: Ctx, W: number, H: number, f: number, hot = 0) => {
  c.fillStyle = "#1a0b2e"; c.fillRect(0, 0, W, H);
  [[300, -0.18], [780, 0.18]].forEach(([x, tilt], q) => {   // two spotlight cones
    const sway = Math.sin(f / 40 + q * 2) * 30;
    c.save(); c.globalAlpha = 0.16 + 0.1 * hot;
    const g = c.createLinearGradient(0, 200, 0, 1250); g.addColorStop(0, "#fef9c3"); g.addColorStop(1, "rgba(254,249,195,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 40, 200); c.lineTo(x + 40, 200); c.lineTo(x + 260 + sway + tilt * 400, 1250); c.lineTo(x - 260 + sway + tilt * 400, 1250); c.closePath(); c.fill(); c.restore();
  });
  c.fillStyle = "#7f1d1d";   // curtains
  [0, 1].forEach((side) => { for (let k = 0; k < 4; k++) { const x = side ? W - 30 - k * 28 : 30 + k * 28; c.fillStyle = k % 2 ? "#991b1b" : "#7f1d1d"; c.fillRect(side ? x - 14 : x - 30, 0, 44, H); } });
  c.fillStyle = "#3b0764"; c.fillRect(0, 1200, W, H - 1200);
  c.fillStyle = "#581c87"; c.beginPath(); c.ellipse(W / 2, 1210, 470, 40, 0, 0, 7); c.fill();
  for (let k = 0; k < 14; k++) {   // bulbs along the floor edge
    const on = (Math.floor(f / 6) + k) % 3 !== 0;
    c.beginPath(); c.arc(90 + k * 69, 1250, 10, 0, 7); c.fillStyle = on ? GOLD : "#713f12"; c.fill();
  }
};
const neon = (c: Ctx, W: number, t: string, f: number) => {
  c.save(); c.textAlign = "center"; c.font = SANS(fit(c, t, W - 200, 58, 900), 900);
  c.shadowColor = "#f0abfc"; c.shadowBlur = 24 + 6 * Math.sin(f / 5); c.fillStyle = "#fdf4ff"; c.fillText(t, W / 2, 330);
  c.shadowBlur = 0; c.strokeStyle = "#e879f9"; c.lineWidth = 3; rrect(c, 120, 268, W - 240, 86, 20); c.stroke(); c.restore();
};
const live = (c: Ctx, W: number, f: number) => {
  c.save(); c.fillStyle = "#dc2626"; rrect(c, W - 230, 380, 150, 54, 12); c.fill();
  c.globalAlpha = Math.floor(f / 15) % 2 ? 1 : 0.4; c.beginPath(); c.arc(W - 202, 407, 10, 0, 7); c.fillStyle = "#fff"; c.fill(); c.globalAlpha = 1;
  c.font = SANS(30, 900); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("LIVE", W - 182, 418); c.restore();
};
const paddle = (c: Ctx, x: number, y: number, t: string, k: number, col = GOLD) => {   // the judge's score card on a stick
  if (k <= 0) return;
  c.save(); c.translate(x, y); const z = 0.6 + 0.4 * easeOut(clamp(k * 1.6)); c.scale(z, z); c.rotate((1 - easeOut(clamp(k * 1.6))) * 0.5);
  c.fillStyle = "#78350f"; c.fillRect(-8, 60, 16, 130);
  c.beginPath(); c.arc(0, 0, 110, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; c.textAlign = "center"; c.font = SANS(fit(c, t, 190, 96, 900), 900); c.fillText(t, 0, 34); c.restore();
};
const judge = (c: Ctx, f: number, boil: number, up: boolean, happy: boolean) => {   // the AI judge behind its desk
  robot(c, 820, 1160, 0.72, boil, 43, { body: "#334155", accent: GOLD, eyes: happy ? "happy" : "open", mouth: happy ? "grin" : "flat", arms: up ? "up" : "down", bob: Math.sin(f / 9) * 3 });
  c.save(); c.fillStyle = "#b91c1c"; rrect(c, 600, 1090, 440, 140, 16); c.fill(); c.fillStyle = "#7f1d1d"; c.fillRect(600, 1190, 440, 40);
  c.fillStyle = GOLD; rrect(c, 700, 1115, 240, 56, 10); c.fill();
  c.font = SANS(32, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("AI JUDGE", 820, 1155); c.restore();
  // a bow tie
  c.save(); c.fillStyle = "#dc2626"; c.beginPath(); c.moveTo(820, 1005); c.lineTo(790, 990); c.lineTo(790, 1020); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(820, 1005); c.lineTo(850, 990); c.lineTo(850, 1020); c.closePath(); c.fill(); c.restore();
};
const bubble = (c: Ctx, x: number, y: number, w: number, t: string, k: number, col = "#f8fafc", fg = INK, size = 40) => {
  if (k <= 0) return;
  const lines = wrap((c.font = SANS(size, 800), c), t, w - 50);
  const h = 40 + lines.length * (size + 10);
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 30);
  c.fillStyle = col; rrect(c, x, y, w, h, 24); c.fill();
  c.beginPath(); c.moveTo(x + w - 120, y + h - 2); c.lineTo(x + w - 60, y + h + 46); c.lineTo(x + w - 170, y + h - 2); c.fill();
  c.font = SANS(size, 800); c.fillStyle = fg; c.textAlign = "left"; lines.forEach((t2, q) => c.fillText(t2, x + 26, y + 20 + size + q * (size + 10)));
  c.restore();
};
const block = (c: Ctx, x: number, y: number, w: number, h: number, label: string, val: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, x + 6, y + 8, w, h, 24); c.fill();
  c.fillStyle = bgc; rrect(c, x, y, w, h, 24); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, label, w - 40, 40, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(label, x + w / 2, y + 60);
  const lines = val.split("\n");
  lines.forEach((t, q) => { c.font = SANS(fit(c, t, w - 40, 120, 900), 900); c.fillStyle = fg; c.fillText(t, x + w / 2, y + 190 + q * 100 - (lines.length - 1) * 40); });
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
const sheet = (c: Ctx, x: number, y: number, w: number, rows: string[], shown: number, bad: number, k: number, big?: string, kBig = 0, fs = 34) => {   // Chintu's answer sheet
  if (k <= 0) return;
  const h = 90 + rows.length * 62 + (big ? 120 : 0);
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 40);
  c.fillStyle = "#fffbeb"; rrect(c, x, y, w, h, 18); c.fill();
  c.strokeStyle = "#93c5fd"; c.lineWidth = 2; for (let q = 0; q < rows.length + 2; q++) { c.beginPath(); c.moveTo(x + 20, y + 74 + q * 62); c.lineTo(x + w - 20, y + 74 + q * 62); c.stroke(); }
  c.strokeStyle = "#fca5a5"; c.beginPath(); c.moveTo(x + 70, y + 10); c.lineTo(x + 70, y + h - 10); c.stroke();
  rows.forEach((t, q) => {
    const kq = clamp(shown - q); if (kq <= 0) return;
    c.save(); c.globalAlpha = kq; c.font = SANS(fit(c, t, w - 120, fs, 700), 700); c.fillStyle = q === bad ? "#b91c1c" : "#1e3a8a"; c.textAlign = "left"; c.fillText(t, x + 88, y + 62 + q * 62);
    if (q === bad && shown > rows.length) { c.fillStyle = "rgba(250,204,21,0.35)"; c.fillRect(x + 82, y + 30 + q * 62, w - 110, 44); }
    c.restore();
  });
  if (big && kBig > 0) { c.save(); c.globalAlpha = clamp(kBig * 3); c.font = SANS(96, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText(big, x + w / 2, y + h - 34); c.restore(); }
  c.restore();
};
const card = (c: Ctx, x: number, y: number, w: number, h: number, k: number, edge = "#e879f9") => {
  c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, x, y, w, h, 24); c.fill();
  c.strokeStyle = edge; c.lineWidth = 4; rrect(c, x, y, w, h, 24); c.stroke(); c.restore();
};
const confetti = (c: Ctx, W: number, f: number, from: number) => {
  const t = f - from; if (t < 0 || t > 60) return;
  const r = rng(4300 + from);
  for (let q = 0; q < 60; q++) {
    const x = r() * W, v = 6 + r() * 8, y = 620 + t * v + Math.sin(t / 6 + q) * 20, col = ["#f472b6", GOLD, "#60a5fa", "#4ade80"][q % 4];
    c.save(); c.globalAlpha = clamp((60 - t) / 20); c.fillStyle = col; c.translate(x, y); c.rotate(t / 8 + q); c.fillRect(-8, -4, 16, 8); c.restore();
  }
};

const cast = (c: Ctx, f: number, boil: number, r: () => number, mood: string, up: boolean) => {
  robot(c, 960, 1372, 0.38, boil, 43, { body: "#334155", accent: GOLD, eyes: up ? "happy" : "open", mouth: up ? "grin" : "flat", arms: up ? "up" : "down", bob: Math.sin(f / 9) * 2 });
  person(c, "chintu" as BillWho, [130, 1300], 0.34, mood as any, "rest", false, r);
};

const StGrade: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const te = !!s.data.handle;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  const SV = te ? 1 : 0.6;
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={(te ? 0.75 : 0.7) * SV} />, <Sfx key={k("t")} at={cue(i, 1, 0.5) - 2} src={DIR + "tada.wav"} vol={(0.3) * SV} />, <Sfx key={k("a")} at={end - 4} src={DIR + "applause_short.wav"} vol={(0.3) * SV} />);
    if (b.prop === "intro") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 6)} src="audio/sfx_whoosh.wav" vol={(0.3) * SV} />, <Sfx key={k("a")} at={at + 2} src={DIR + "applause.wav"} vol={(0.28) * SV} />, <Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={(0.3) * SV} />);
    if (b.prop === "answer") sfx.push(<Sfx key={k("p0")} at={at + 6} src="audio/sfx_tick.wav" vol={(0.25) * SV} />, <Sfx key={k("x")} at={cue(i, 1, 0.4)} src="reel/sfx_buzz.wav" vol={(0.25) * SV} />, <Sfx key={k("d")} at={cue(i, 2, 0.8)} src="audio/gag_ding.wav" vol={(0.35) * SV} />);
    if (b.prop === "judge") sfx.push(<Sfx key={k("f")} at={cue(i, 1, 0.6) - 2} src={DIR + "flip.wav"} vol={(0.6) * SV} />, <Sfx key={k("t")} at={cue(i, 1, 0.6)} src={DIR + "tada.wav"} vol={(0.3) * SV} />, <Sfx key={k("a")} at={end - 4} src={DIR + "applause_short.wav"} vol={(0.32) * SV} />);
    if (b.prop === "caught") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={(0.32) * SV} />, <Sfx key={k("z")} at={cue(i, 1, 0.1)} src="reel/sfx_buzz.wav" vol={(0.32) * SV} />);
    if (b.prop === "reveal") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_snap.wav" vol={(0.35) * SV} />, <Sfx key={k("h")} at={cue(i, 2, 0.4)} src="reel/sfx_boom.wav" vol={(te ? 0.5 : 0.6) * SV} />, <Sfx key={k("x")} at={cue(i, 2, 0.4)} src="audio/gag_bonk.wav" vol={(0.4) * SV} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("p0")} at={at + 4} src="audio/sfx_pop.wav" vol={(0.28) * SV} />, <Sfx key={k("p1")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={(0.28) * SV} />, <Sfx key={k("z")} at={cue(i, 2, 0.2)} src="reel/sfx_buzz.wav" vol={(0.3) * SV} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={(0.32) * SV} />, <Sfx key={k("s")} at={cue(i, 1, 0.3)} src="audio/sfx_success.wav" vol={(0.28) * SV} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("c")} at={at + 2} src="audio/sfx_chime.wav" vol={(0.3) * SV} />, <Sfx key={k("s")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={(0.3) * SV} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={(0.35) * SV} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={(0.85) * SV} />, <Sfx key={k("t")} at={slam} src={DIR + "tada.wav"} vol={(0.4) * SV} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(4343 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        const onStage = ["hook", "intro", "answer", "judge", "reveal", "loop"].includes(P);
        stage(c, W, H, f, P === "judge" || P === "hook" ? 1 : 0);
        c.textAlign = "left";
        if (P === "hook") {
          const k10 = loopOn ? 1 : seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6);
          block(c, 40, 280, 490, 300, T.leftLab, T.leftVal, "#7f1d1d", "#fecaca", 1);
          c.save(); if (k10 > 0 && k10 < 1) c.translate(Math.sin(k10 * 40) * 14 * (1 - k10), 0);
          block(c, 550, 280, 490, 300, T.rightLab, T.rightVal, "#14532d", "#bbf7d0", 1); c.restore();
          chip(c, T.hookQ, W / 2, 628, "#1e293b", "#fde68a", 1, fit(c, T.hookQ, W - 120, 36, 800));
          person(c, "chintu" as BillWho, [270, 1240], 0.58, k10 > 0.5 ? "happy" : "excited", "up", false, r);
          sheet(c, 70, 680, 400, T.hookRows, 9, -1, 1, T.hookBig, 1, 30);
          judge(c, f, boil, true, true);
          paddle(c, 950, 760, T.ten, 1);
          stamp(c, T.wrongStamp, 590, 880, 46, RED, 1, -0.12);
          if (k10 >= 1) confetti(c, W, f, loopOn ? endL + HOLD : cu(1, 0.5));
        } else if (P === "intro") {
          neon(c, W, T.show, f); live(c, W, f);
          const kq = seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 6);
          person(c, "chintu" as BillWho, [270, 1080], 0.72, "happy", "five", false, r);
          judge(c, f, boil, false, false);
          chip(c, T.contestant, W / 2, 490, "#a21caf", "#fff", seg(f, ln.from + 4, ln.from + 12), 44);
          if (kq > 0) { card(c, 70, 560, W - 140, 330, kq, GOLD); c.save(); c.globalAlpha = clamp(kq * 3); c.textAlign = "center"; c.font = SANS(40, 900); c.fillStyle = GOLD; c.fillText(T.qLab, W / 2, 630);
            c.font = SANS(fit(c, T.q1, W - 200, 58, 900), 900); c.fillStyle = "#fff"; c.fillText(T.q1, W / 2, 730); c.font = SANS(fit(c, T.q2, W - 200, 72, 900), 900); c.fillStyle = "#fde68a"; c.fillText(T.q2, W / 2, 840); c.restore(); }
        } else if (P === "answer") {
          neon(c, W, T.show, f); live(c, W, f);
          const rows = T.steps as string[];
          const shown = clamp(seg(f, ln.from + 2, cu(1, 0.4)) * 2.2, 0, 1) * 2 + seg(f, cu(1, 0.4) - 6, cu(2, 0.5)) * (rows.length - 2) + seg(f, cu(2, 0.5), cu(2, 0.5) + 6);
          person(c, "chintu" as BillWho, [180, 1160], 0.6, "smug", "rest", false, r);
          judge(c, f, boil, false, false);
          sheet(c, 60, 400, W - 120, rows, shown, T.badRow, 1, T.answerBig, seg(f, cu(2, 0.5), cu(2, 0.5) + 6), 44);
        } else if (P === "judge") {
          neon(c, W, T.show, f);
          const k10 = seg(f, cu(1, 0.6) - 4, cu(1, 0.6) + 6);
          person(c, "chintu" as BillWho, [270, 1200], 0.6, k10 > 0 ? "happy" : "worried", "up", false, r);
          judge(c, f, boil, k10 > 0, k10 > 0);
          sheet(c, 70, 640, 400, T.hookRows, 9, -1, 1, T.hookBig, 1, 30);   // his sheet on screen while the judge reads (the verdict comes before the rule now)
          bubble(c, 90, 420, W - 180, T.aiSays, seg(f, ln.from + 2, ln.from + 10), "#f8fafc", INK, 44);
          c.save(); c.globalAlpha = clamp(seg(f, ln.from + 2, ln.from + 10) * 3); c.font = SANS(fit(c, T.aiSrc, W - 200, 34, 800), 800); c.fillStyle = "#e9d5ff"; c.textAlign = "center"; c.fillText(T.aiSrc, W / 2, 400); c.restore();
          paddle(c, 950, 760, T.ten, k10);
          chip(c, T.story, W / 2, 1330, "#1e293b", "#f8fafc", seg(f, ln.from + 10, ln.from + 18), 40);
          if (k10 >= 1) confetti(c, W, f, cu(1, 0.6));
        } else if (P === "reveal") {
          neon(c, W, T.show, f);
          const k1 = seg(f, cu(1, 0.1) - 4, cu(1, 0.1) + 6), k2 = seg(f, cu(2, 0.4) - 4, cu(2, 0.4) + 6);
          person(c, "chintu" as BillWho, [250, 1080], 0.72, k2 > 0 ? "shock" : "worried", "rest", false, r);
          judge(c, f, boil, false, false);
          card(c, 70, 400, W - 140, 470, seg(f, ln.from, ln.from + 8), "#fca5a5");
          c.save(); c.globalAlpha = clamp(seg(f, ln.from, ln.from + 8) * 3); c.textAlign = "center"; c.font = SANS(40, 900); c.fillStyle = "#fca5a5"; c.fillText(T.revLab, W / 2, 470); c.restore();
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(k1 * 3); c.textAlign = "center"; c.font = SANS(fit(c, T.rev1, W - 200, 70, 900), 900); c.fillStyle = "#fff"; c.fillText(T.rev1, W / 2, 590); c.restore(); }
          if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.textAlign = "center"; c.font = SANS(fit(c, T.rev2, W - 200, 130, 900), 900); c.fillStyle = GREEN; c.fillText(T.rev2, W / 2, 740); c.restore(); }
          if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.textAlign = "center"; c.font = SANS(fit(c, T.revNote, W - 180, 40, 800), 800); c.fillStyle = "#fde68a"; c.fillText(T.revNote, W / 2, 830); c.restore(); }
        } else if (P === "test") {
          cast(c, f, boil, r, "happy", true);
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = "#fdf4ff"; c.fillText(T.testHead, W / 2, 330);
          c.font = SANS(fit(c, T.model, W - 80, 36, 800), 800); c.fillStyle = "#e9d5ff"; c.fillText(T.model, W / 2, 380);
          const marks = T.marks as number[];
          const kd = seg(f, ln.from + 2, cu(1, 0.6));
          marks.forEach((m, q) => {   // ten score cards, one per chat
            const kq = clamp(kd * marks.length - q); if (kq <= 0) return;
            const x = 150 + (q % 5) * 195, y = 520 + Math.floor(q / 5) * 230;
            paddle(c, x, y, String(m), kq, m >= 9 ? GOLD : "#fde68a");
          });
          const kn = seg(f, cu(2, 0.1) - 4, cu(2, 0.1) + 6);
          if (kn > 0) { card(c, 70, 1000, W - 140, 230, kn, RED); c.save(); c.globalAlpha = clamp(kn * 3); c.textAlign = "center"; c.font = SANS(fit(c, T.never, W - 200, 64, 900), 900); c.fillStyle = "#fca5a5"; c.fillText(T.never, W / 2, 1100);
            c.font = SANS(fit(c, T.neverSub, W - 200, 36, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(T.neverSub, W / 2, 1175); c.restore(); }
        } else if (P === "caught") {
          cast(c, f, boil, r, "worried", false);
          c.textAlign = "center"; c.font = SANS(fit(c, T.catHead, W - 120, 50, 900), 900); c.fillStyle = "#fdf4ff"; c.fillText(T.catHead, W / 2, 330);
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 4, cu(1, 0.1) + 6);
          ([[T.cat1Lab, T.cat1, T.cat1Sub, GREEN, k0, 400], [T.cat2Lab, T.cat2, T.cat2Sub, RED, k1, 800]] as [string, string, string, string, number, number][]).forEach(([lab, big, sub, col, k, y]) => {
            if (k <= 0) return;
            card(c, 60, y, W - 120, 350, k, col);
            c.save(); c.globalAlpha = clamp(k * 3); c.textAlign = "center";
            c.font = SANS(fit(c, lab, W - 180, 34, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(lab, W / 2, y + 70);
            c.font = SANS(120, 900); c.fillStyle = col; c.fillText(big, W / 2, y + 210);
            c.font = SANS(fit(c, sub, W - 180, 40, 800), 800); c.fillStyle = "#fff"; c.fillText(sub, W / 2, y + 290); c.restore();
          });
        } else if (P === "fix") {
          cast(c, f, boil, r, "shock", false);
          c.textAlign = "center"; c.font = SANS(52, 900); c.fillStyle = "#fdf4ff"; c.fillText(T.fixHead, W / 2, 330);
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6);
          card(c, 70, 390, W - 140, 330, k0, GOLD);
          c.save(); c.globalAlpha = clamp(k0 * 3); c.textAlign = "left"; c.font = SANS(34, 800); c.fillStyle = "#c4b5fd"; c.fillText(T.fixAskLab, 110, 450);
          c.font = SANS(36, 800); c.fillStyle = "#fff"; wrap(c, T.fixAsk, W - 240).slice(0, 4).forEach((t, q) => c.fillText(t, 110, 510 + q * 48)); c.restore();
          if (k1 > 0) { card(c, 70, 760, W - 140, 420, k1, GREEN); c.save(); c.globalAlpha = clamp(k1 * 3); c.textAlign = "center"; c.font = SANS(40, 900); c.fillStyle = "#bbf7d0"; c.fillText(T.fixResLab, W / 2, 830);
            c.font = SANS(fit(c, T.fixRes, W - 200, 120, 900), 900); c.fillStyle = "#fff"; c.fillText(T.fixRes, W / 2, 980);
            c.font = SANS(fit(c, T.fixResSub, W - 200, 38, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(T.fixResSub, W / 2, 1070);
            c.font = SANS(fit(c, T.fixResSub2, W - 200, 38, 800), 800); c.fillStyle = "#fde68a"; c.fillText(T.fixResSub2, W / 2, 1135); c.restore(); }
        } else if (P === "rule") {
          cast(c, f, boil, r, "calm", false);
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#fdf4ff"; c.fillText(T.ruleHead, W / 2, 330);
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6);
          if (k0 > 0) { card(c, 60, 390, W - 120, 280, k0, GOLD); c.save(); c.globalAlpha = clamp(k0 * 3); c.font = SANS(fit(c, T.rule1, W - 180, 62, 900), 900); c.fillStyle = "#fff"; c.fillText(T.rule1, W / 2, 500);
            c.font = SANS(fit(c, T.rule1b, W - 180, 46, 800), 800); c.fillStyle = "#fde68a"; c.fillText(T.rule1b, W / 2, 600); c.restore(); }
          if (k1 > 0) { card(c, 60, 710, W - 120, 300, k1, GREEN); c.save(); c.globalAlpha = clamp(k1 * 3); c.font = SANS(fit(c, T.rule2, W - 180, 80, 900), 900); c.fillStyle = "#fff"; c.fillText(T.rule2, W / 2, 840);
            c.font = SANS(fit(c, T.rule2b, W - 180, 44, 800), 800); c.fillStyle = "#bbf7d0"; c.fillText(T.rule2b, W / 2, 940); c.restore();
            chip(c, T.ruleChip, W / 2, 1100, "#1e293b", "#f8fafc", k1, fit(c, T.ruleChip, W - 100, 38, 800)); }
        } else if (P === "loop") {
          neon(c, W, T.show, f); live(c, W, f);
          person(c, "chintu" as BillWho, [270, 1240], 0.58, "excited", "up", false, r);
          judge(c, f, boil, false, false);
          chip(c, T.next, W / 2, 520, "#a21caf", "#fff", seg(f, ln.from + 2, ln.from + 10), 48);
          chip(c, T.hookQ, W / 2, 628, "#1e293b", "#fde68a", seg(f, ln.from + 4, ln.from + 12), fit(c, T.hookQ, W - 120, 36, 800));
          sheet(c, 70, 680, 400, T.hookRows, seg(f, cu(1, 0.0) - 6, cu(1, 0.0) + 4) * 9, -1, seg(f, ln.from + 4, ln.from + 12), T.hookBig, seg(f, cu(1, 0.0), cu(1, 0.0) + 6), 30);
        }
        if (!onStage) {   // the cards' scenes keep the stage dim behind them
          c.save(); c.globalAlpha = 0.0; c.restore();
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const GRADE43_SCENES = { sk_grade43: StGrade };
