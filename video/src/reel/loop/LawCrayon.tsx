import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, PH, Mood, Arms } from "./SkitCrayon";

// EP48 "AI laws" (series/scripts/ep48_ai_laws.md): a two-character conversation (Bujji taste note #4: no music bed, two
// dry voices, one causal chain, an honesty line). Ravi asked the shop AI if his AI-made ad (a video of him dancing with a
// rice bag) needs a label; it said no. India's label rules have been in force since 20 Feb 2026; the AI learned the world
// before that. Our test (series/scripts/ep48_demo: the phone IS the tested AI, a small free AI from 2024, offline, read by
// hand): 25 asks on AI rules, 2 right. The honesty line: "Some answers were old. Some were just wrong, and I sounded sure."
// The rule: apps that search can look it up; make them show the government's page and its date. "This video gets old too."
// Ravi stamps "MADE WITH AI" on the ad ("The rice is real."). Loops to frame 1 (the two blocks over the unlabelled ad).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.08, x: 600, y: 800 }, ravi: { z: 1.5, x: 520, y: 720 }, ai: { z: 1.9, x: 790, y: 860 }, hook: { z: 0.95, x: 600, y: 640 },
};
const HOLD = 16;   // frames on the last line before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  2: ["sus", "fold"], 3: ["panic", "up"], 5: ["angry", "point"], 6: ["sus", "rest"], 8: ["shock", "up"], 11: ["hope", "rest"], 12: ["hope", "rest"], 13: ["happy", "rest"],
};
const DAY = "20 FEB 2026";

// ---------- pieces (screen space) ----------
const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 26) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
const block = (c: Ctx, x: number, y: number, w: number, h: number, small: string, big: string, bg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 6, y + 8, w, h, 20); c.fill();
  c.fillStyle = bg; rrect(c, x, y, w, h, 20); c.fill();
  c.fillStyle = "#fff"; c.textAlign = "center";
  fit(c, small, w - 30, 40, 800); c.fillText(small, x + w / 2, y + 52);
  fit(c, big, w - 30, 92, 900); c.fillText(big, x + w / 2, y + h - 30);
  c.restore();
};
const bubble = (c: Ctx, x: number, y: number, w: number, lines: string[], mine: boolean, k: number, size = 40, label = "") => {
  if (k <= 0) return 0;
  const h = 34 + lines.length * (size + 12) + (label ? 34 : 0);
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.25)"; rrect(c, x + 5, y + 6, w, h, 22); c.fill();
  c.fillStyle = mine ? "#e0f2fe" : "#ffffff"; rrect(c, x, y, w, h, 22); c.fill();
  c.textAlign = "left";
  if (label) { c.font = SANS(26, 800); c.fillStyle = mine ? "#0369a1" : "#be123c"; c.fillText(label, x + 24, y + 38); }
  c.font = SANS(size, 700); c.fillStyle = INK;
  lines.forEach((t, i) => c.fillText(t, x + 24, y + (label ? 34 : 0) + 22 + (i + 1) * (size + 12) - 10));
  c.restore();
  return h;
};
const chip = (c: Ctx, t: string, x: number, y: number, bg: string, fg: string, k: number, size = 36) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 800);
  const w = c.measureText(t).width + 44;
  c.fillStyle = bg; rrect(c, x - w / 2, y - size, w, size * 1.6, 16); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, x, y + size * 0.18); c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, col: string, k: number, size = 80, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); const z = 1.6 - 0.6 * easeOut(clamp(k * 2)); c.scale(z, z); c.globalAlpha = clamp(k * 3);
  c.font = SANS(size, 900); const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.9)"; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 60); c.font = SANS(fs, 900);
  c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 300);
  c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; sub.forEach((t, i) => c.fillText(t, W / 2, 372 + i * 50));
};
// frame 1's proof: the two blocks and the AI's real reply (also the loop's landing frame)
// frame 1 (also the loop's landing frame): the two blocks over Ravi's unlabelled ad (script review: nothing else)
const hookCard = (c: Ctx, W: number, f: number) => {
  c.fillStyle = "#e2e8f0"; c.fillRect(0, 0, W, 1920);
  adScreen(c, 250, 525, 580, 880, f, 0);
  block(c, 50, 215, 470, 200, "THE AI SAID", "NO LABEL NEEDED", RED, 1);   // render review: the green block must say the rule
  block(c, 560, 215, 470, 200, "THE RULE SINCE 20 FEB 2026", "LABEL IT", GREEN, 1);
  chip(c, "the AI's answer: from our test", 290, 470, "#fde68a", INK, 1, 32);
  chip(c, "▶ Ravi's AI video ad", 790, 470, "#1e293b", "#f8fafc", 1, 32);
};
// Ravi's AI-made ad: a crayon Ravi dancing with a rice bag on a phone screen (screen space)
const adScreen = (c: Ctx, x: number, y: number, w: number, h: number, f: number, label: number) => {
  c.save();
  c.fillStyle = "#111827"; rrect(c, x - 18, y - 18, w + 36, h + 36, 40); c.fill();
  c.beginPath(); rrect(c, x, y, w, h, 26); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#fde68a"); g.addColorStop(1, "#fb923c"); c.fillStyle = g; c.fillRect(x, y, w, h);
  c.font = SANS(40, 900); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("RAVI KIRANA", x + w / 2, y + 70);
  c.font = SANS(34, 800); c.fillText("RICE OFFER · 25 kg", x + w / 2, y + 116);
  // the dancer: a swinging stick figure in Ravi's checked shirt, the rice bag held high
  const t = f / 6, sw = Math.sin(t) * 0.35, cx = x + w / 2, cy = y + h * 0.6;
  c.save(); c.translate(cx, cy); c.scale(1.35, 1.35); c.rotate(sw * 0.4);
  c.strokeStyle = INK; c.lineWidth = 12; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, 60); c.lineTo(-50 - 30 * sw, 190); c.moveTo(0, 60); c.lineTo(50 - 30 * sw, 190); c.stroke();   // legs
  c.fillStyle = "#3b82f6"; rrect(c, -55, -80, 110, 150, 26); c.fill();
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = 4; for (let q = -40; q <= 40; q += 20) { c.beginPath(); c.moveTo(q, -78); c.lineTo(q, 68); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 12;
  c.beginPath(); c.moveTo(-50, -60); c.lineTo(-110, -150 + 30 * sw); c.moveTo(50, -60); c.lineTo(110, -150 - 30 * sw); c.stroke();   // arms up
  c.fillStyle = "#c68642"; c.beginPath(); c.arc(0, -130, 52, 0, 7); c.fill();
  c.fillStyle = INK; c.beginPath(); c.ellipse(0, -168, 52, 22, 0, Math.PI, 0); c.fill();   // hair
  c.beginPath(); c.arc(-18, -136, 6, 0, 7); c.arc(18, -136, 6, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(0, -118, 20, 0.2, Math.PI - 0.2); c.stroke();
  c.fillStyle = INK; c.fillRect(-30, -112, 60, 8);   // the moustache
  c.restore();
  c.save(); c.translate(cx + 160 + 40 * sw, cy - 300); c.scale(1.3, 1.3); c.rotate(-0.3 + sw);
  c.fillStyle = "#e7d7b1"; rrect(c, -70, -50, 140, 110, 30); c.fill(); c.strokeStyle = "#a3865a"; c.lineWidth = 4; rrect(c, -70, -50, 140, 110, 30); c.stroke();
  c.font = SANS(28, 900); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("RICE", 0, 14); c.restore();
  ["♪", "♫"].forEach((nn, q) => { c.font = SANS(64, 900); c.fillStyle = "rgba(124,45,18,0.7)"; c.fillText(nn, x + 90 + q * (w - 180), y + 220 + 30 * Math.sin(t + q * 2)); });
  c.restore();
  if (label > 0) stamp(c, "MADE WITH AI", x + w / 2, y + h - 150, "#7c3aed", label, 74, -0.08);
};

// ---------- inserts ----------
const lawCard = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "INDIA · IN FORCE " + DAY, ["the IT Rules, amended 2026"], "#86efac");
  const k1 = seg(f, t0, t0 + 6), k2 = seg(f, c1, c1 + 8);   // render review: an empty dark card for 2 s
  if (k1 > 0) {
    c.save(); c.globalAlpha = clamp(k1 * 3);
    c.fillStyle = "#dcfce7"; rrect(c, 80, 480, W - 160, 300, 26); c.fill();
    c.font = SANS(60, 900); c.fillStyle = INK; c.textAlign = "center";
    c.fillText("AI video, photo or voice", W / 2, 580); c.fillText("that LOOKS REAL", W / 2, 680);
    c.restore();
  }
  if (k2 > 0) {
    c.save(); c.globalAlpha = clamp(k2 * 3);
    c.font = SANS(90, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("↓", W / 2, 900);
    c.fillStyle = "#fde68a"; rrect(c, 140, 950, W - 280, 170, 26); c.fill();
    c.font = SANS(80, 900); c.fillStyle = INK; c.fillText("A CLEAR LABEL", W / 2, 1065);
    c.restore();
  }
  chip(c, "big apps must ask you: \"Is it made with AI?\"", W / 2, 1250, "#e0e7ff", INK, seg(f, c1 + 14, c1 + 22), 38);
  chip(c, "AI-written text: not covered", W / 2, 1345, "#334155", "#f8fafc", seg(f, c1 + 24, c1 + 32), 34);
};
const timeline = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "WHY I SAID NO", ["an AI learns the world up to a date"], "#fde68a");
  const y = 760, x0 = 90, x1 = W - 90, xd = 560, xl = 880;
  const k = seg(f, t0, t0 + 20);
  c.fillStyle = "#334155"; rrect(c, x0, y, x1 - x0, 20, 10); c.fill();
  if (k > 0) { c.fillStyle = "#60a5fa"; rrect(c, x0, y, (xd - x0) * easeOut(k), 20, 10); c.fill(); }
  c.font = SANS(38, 800); c.textAlign = "left"; c.fillStyle = "#93c5fd"; c.globalAlpha = clamp(k * 3); c.fillText("WHAT I READ", x0, y - 40); c.globalAlpha = 1;
  const kd = seg(f, t0 + 16, t0 + 24);
  if (kd > 0) {
    c.save(); c.globalAlpha = clamp(kd * 3); c.fillStyle = "#93c5fd"; c.fillRect(xd - 4, y - 70, 8, 160);
    c.font = SANS(36, 900); c.textAlign = "center"; c.fillText("MY DATE", xd, y + 140); c.font = SANS(32, 700); c.fillText("(2024)", xd, y + 186); c.restore();
  }
  const kl = seg(f, c1, c1 + 8);
  if (kl > 0) {
    c.save(); c.globalAlpha = clamp(kl * 3); c.fillStyle = GREEN; c.fillRect(xl - 5, y - 110, 10, 240);
    c.font = SANS(40, 900); c.textAlign = "center"; c.fillStyle = "#86efac"; c.fillText("THE RULE", xl, y - 130); c.fillText(DAY, xl, y + 190);
    c.restore();
    tag(c, "I never read it", xl - 60, y + 330, 50, "#fecaca", "#7f1d1d", -0.04, seg(f, c1 + 10, c1 + 18));
  }
};
const ROWS: [string, string, string, string, string][] = [
  ["OLD", "\"no label needed\"", "8 of 10", "the rule came after me", "#fde68a"],
  ["WRONG", "\"takedown in 24 hours\"", "5 of 5", "the rule says 3 hours", "#fca5a5"],
  ["WRONG", "\"hiring-AI rules from May 2024\"", "5 of 5", "never true (moved to 2 Dec 2027)", "#fca5a5"],
];
const testCard = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "OUR TEST: ME", []);
  c.font = SANS(42, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("a small free AI (Qwen2.5 7B, Sep 2024), offline", W / 2, 376); c.fillText("25 asks on AI rules · every reply read by hand", W / 2, 432);
  const q0 = 1 - seg(f, c1 - 4, c1);
  if (q0 > 0) { c.save(); c.globalAlpha = q0; c.font = SANS(66, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("How many right?", W / 2, 820); c.restore(); }
  const kt = seg(f, c1 - 2, c1 + 10);
  if (kt > 0) for (let j = 0; j < 25; j++) {
    const x = 155 + (j % 5) * 160, y = 540 + Math.floor(j / 5) * 128, ok = j === 3 || j === 5;
    c.save(); c.globalAlpha = clamp(kt * 3); c.fillStyle = kt > 0.5 ? (ok ? GREEN : RED) : "#334155"; rrect(c, x, y, 130, 104, 16); c.fill();
    c.font = SANS(60, 900); c.fillStyle = "#fff"; c.textAlign = "center"; if (kt > 0.5) c.fillText(ok ? "✓" : "✗", x + 65, y + 74); c.restore();
  }
  if (kt > 0.5) { c.save(); c.font = SANS(130, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.globalAlpha = seg(f, c1 + 6, c1 + 14); c.fillText("2 / 25", W / 2, 1330); c.restore(); }
  void t0;
};
const rowsCard = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "MY WRONG ANSWERS", ["two kinds: old, and just wrong"], "#fca5a5");
  ROWS.forEach(([kind, said, n, why, col], i) => {
    const s0 = i === 0 ? t0 + 2 : c1 + (i - 1) * 14; const k = seg(f, s0, s0 + 8); if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 3); const y = 470 + i * 250;
    c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 220, 22); c.fill();
    c.fillStyle = col; rrect(c, 90, y + 26, 200, 64, 14); c.fill();
    c.font = SANS(40, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(kind, 190, y + 72);
    c.font = SANS(34, 800); c.fillStyle = "#94a3b8"; c.textAlign = "right"; c.fillText(n, W - 90, y + 70);
    c.font = SANS(44, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(said, 90, y + 146);
    c.font = SANS(36, 700); c.fillStyle = col; c.fillText(why, 90, y + 196);
    c.restore();
  });
  chip(c, "every reply read by hand", W / 2, 1290, "#334155", "#f8fafc", seg(f, c1 + 30, c1 + 38), 34);
};
const euCard = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "EUROPE · THE EU AI ACT", ["banned since 2 Feb 2025:"], "#c7d2fe");
  const k = seg(f, t0 + 4, t0 + 12);
  if (k > 0) {
    c.save(); c.globalAlpha = clamp(k * 3);
    c.fillStyle = "#e0e7ff"; rrect(c, 80, 470, W - 160, 230, 24); c.fill();
    c.font = SANS(54, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("AI that reads emotions", W / 2, 565); c.fillText("at work or in school", W / 2, 645);
    c.restore();
  }
  stamp(c, "I SAID: NOT BANNED", W / 2, 860, RED, seg(f, t0 + 20, t0 + 28), 58, -0.05);
  chip(c, "5 times out of 5", W / 2, 990, "#fecaca", "#7f1d1d", seg(f, t0 + 28, t0 + 36), 40);
  chip(c, "(except for medical or safety reasons)", W / 2, 760, "#334155", "#cbd5e1", seg(f, t0 + 10, t0 + 18), 32);
  chip(c, "the law: 2024 · the ban: since 2 Feb 2025", W / 2, 1150, "#334155", "#f8fafc", seg(f, c1, c1 + 8), 36);
};

// ---------- the scene ----------
const StLaw: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  // Sound (Bujji taste note #4: no bed, two dry voices): only where it carries meaning. A hit on frame 1, the "NO." pop,
  // a boom on "two right", a soft pop as each wrong answer lands, the "not banned" stamp, a ding on the rule card, and the
  // MADE WITH AI stamp as the loudest hit (script review), then the slam back to frame 1.
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.55} />);   // render review: the frame-1 hit didn't carry
    if (b.prop === "chat") sfx.push(<Sfx key={k("p")} at={at + 3} src="audio/sfx_pop.wav" vol={0.22} />, <Sfx key={k("q")} at={cue(i, 1, 0.6)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "law") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.45)} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.6) - 2} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.55} />);
    if (b.prop === "rows") [at + 2, cue(i, 1, 0.5), cue(i, 1, 0.5) + 14].forEach((t, q) => sfx.push(<Sfx key={k("r" + q)} at={t} src="audio/sfx_pop.wav" vol={0.22} />));
    if (b.prop === "eu") sfx.push(<Sfx key={k("s")} at={at + 20} src="reel/sfx_buzz.wav" vol={0.16} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.45) - 2} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "loop") {
      const slam = end + HOLD, st = cue(i, 1, 0.4) - 14;
      sfx.push(<Sfx key={k("r")} at={Math.max(0, st - 40)} src="reel/sfx_riser.wav" vol={0.8} />,   // render review: a rise into the stamp, the loudest hit
        <Sfx key={k("h")} at={st} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("i")} at={st + 1} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("c")} at={st} src={CLAP} vol={1.0} />, <Sfx key={k("p")} at={st + 2} src="audio/sfx_pop.wav" vol={0.8} />,
        <Sfx key={k("z")} at={slam} src="reel/sfx_boom.wav" vol={0.7} />);
    }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4848 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.prop === "hook" || loopOn) {
          const shake = (b.prop === "hook" && p < 0.1) || (loopOn && f < slam + 10) ? 8 : 0;
          c.save(); if (shake) c.translate((r() - 0.5) * shake, (r() - 0.5) * shake);
          hookCard(c, W, f); c.restore();
        } else if (b.shot === "chat") {   // his question and the AI's answer, his ad as the attachment
          c.fillStyle = "#e0f2fe"; c.fillRect(0, 0, W, H);
          c.fillStyle = "#0369a1"; c.fillRect(0, 0, W, 330);
          c.font = SANS(46, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Shop AI", 60, 260);
          c.font = SANS(28, 700); c.fillStyle = "#e0f2fe"; c.fillText("Ravi's question, last week", 60, 305);
          const k1 = seg(f, ln.from, ln.from + 8);
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(k1 * 3); c.translate(560, 380); c.scale(0.5, 0.5); adScreen(c, 0, 0, 580, 900, f, 0); c.restore(); }
          bubble(c, 120, 880, 830, ["Does my AI ad need a label?"], false, seg(f, ln.from + 6, ln.from + 14), 44, "Ravi");
          bubble(c, 120, 1060, 830, ["NO."], true, seg(f, cu(1, 0.6), cu(1, 0.6) + 6), 90, "Shop AI");
        } else if (b.shot === "law") {
          lawCard(c, W, f, ln.from, cu(1, 0.45));
        } else if (b.shot === "date") {
          timeline(c, W, f, ln.from, cu(1, 0.45));
        } else if (b.shot === "test") {
          testCard(c, W, f, ln.from, cu(1, 0.6));
        } else if (b.shot === "rows") {
          rowsCard(c, W, f, ln.from, cu(1, 0.5));
        } else if (b.shot === "eu") {
          euCard(c, W, f, ln.from, cu(1, 0.5));
        } else if (b.shot === "adlabel") {   // he stamps the label on the ad
          c.fillStyle = "#e2e8f0"; c.fillRect(0, 0, W, H);
          adScreen(c, 250, 300, 580, 900, f, seg(f, cu(1, 0.4) - 14, cu(1, 0.4) - 6));
          chip(c, "the rice is real", W / 2, 1330, "#fde68a", INK, seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 46);
        } else {
          // ---------- the shop ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 840); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, { happy: n === 13 && !talking });
          if (!(b.who === "ai" && talking)) {   // render review: the phone said "online"; this AI runs offline
            c.save(); c.translate(PH.x, PH.y); c.rotate(-0.05); c.fillStyle = "#e0f2fe"; c.fillRect(-60, 24, 120, 24);
            c.font = SANS(18, 800); c.fillStyle = "#b91c1c"; c.textAlign = "center"; c.fillText("offline", 0, 41); c.restore();
          }
          c.restore();
          if (b.prop === "rule" || b.prop === "honest") {   // render review: hold the card through the next line, and name the page
            const all = b.prop === "honest";
            c.save(); c.globalAlpha = all ? 1 : clamp(seg(p, 0.0, 0.08) * 3);
            c.fillStyle = "rgba(15,23,42,0.94)"; rrect(c, 60, 240, W - 120, 960, 30); c.fill();
            c.font = SANS(52, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("A RULES QUESTION?", W / 2, 330);
            c.font = SANS(38, 800); c.fillStyle = "#e2e8f0"; c.fillText("an AI can be old, or wrong and sure", W / 2, 390);
            c.restore();
            ([["Use an app that", "searches the web", "#e0e7ff", ln.from + 4], ["Make it show the", "government's page + date", "#dcfce7", cu(1, 0.45) - 2], ["AI video that looks real?", "Label it", "#fde68a", cu(1, 0.45) + 22]] as [string, string, string, number][]).forEach(([a, bb, bg, t0], q) => {
              const k = all ? 1 : seg(f, t0, t0 + 8); if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3); const y = 450 + q * 220;
              c.fillStyle = bg; rrect(c, 110, y, W - 220, 186, 22); c.fill();
              const fs = fit(c, bb, W - 280, 52); c.font = SANS(fs, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a, W / 2, y + 76); c.fillText(bb, W / 2, y + 148);
              c.restore();
            });
            const kp = all ? 1 : seg(f, cu(1, 0.45) + 8, cu(1, 0.45) + 16);
            if (kp > 0) { c.save(); c.globalAlpha = clamp(kp * 3); c.font = SANS(32, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("India: meity.gov.in · EU: the European Commission's AI Act page", W / 2, 1150); c.restore(); }
          }
          if (b.prop === "honest") stamp(c, "THIS VIDEO: NOV 2026", W / 2, 1300, "#475569", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 64, -0.05);
        }
      }} />
    </>
  );
};

export const LAW_SCENES = { sk_law: StLaw };
