import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 21 "Not On The List" (series/scripts/creative21_dotnet.md): a nightclub-bouncer parody at an office door. The
// screening AI is a bouncer bot with a clipboard ("THE LIST: .NET"); Naveen's resume says "dotnet": REJECTED. The job has
// been open 8 months with 0 hires. A hand-drawn whiteboard moment: ".NET" and "dotnet" draw themselves, ≠, the stamp. Our
// test (series/scripts/creative21_demo): an exact ".NET" filter rejected 11 of 20 real .NET skills lines and let 3 of 5
// non-.NET lines in ("Not familiar with .NET"); a small AI reading for meaning let no fake in but said NO to "DotNet" 3
// of 3. The rules: job seekers copy the job post's spelling (write both); hiring, a human reads a sample of the rejects.
// The closer: should a bot reject a resume no human ever sees? "Next! Rejected." and the stamp lands on frame 1 again.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "shalini" | "naveen" | "bouncer"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 14;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626", AMBER = "#d97706";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const HAND = (s: number) => `700 ${s}px Caveat`;
const SHALINI: Record<number, [BillMood, BillArms]> = {
  1: ["shock", "up"], 2: ["worried", "rest"], 3: ["worried", "rest"], 5: ["angry", "shrug"], 8: ["shock", "up"], 10: ["angry", "shrug"],
  12: ["shock", "rest"], 13: ["angry", "fold"], 15: ["calm", "rest"], 16: ["worried", "rest"], 17: ["shock", "up"],
};
const NAVEEN: Record<number, [BillMood, BillArms]> = {
  1: ["worried", "rest"], 2: ["shock", "rest"], 3: ["angry", "up"], 5: ["angry", "rest"], 8: ["smug", "fold"], 10: ["calm", "fold"],
  12: ["smug", "fold"], 13: ["angry", "shrug"], 14: ["happy", "rest"], 16: ["worried", "rest"], 17: ["shock", "rest"],
};

// ---------- pieces (screen space) ----------
const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 24, font = SANS) => {
  let fs = size; c.font = font(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = font(fs, w); }
  return fs;
};
const corridor = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#e0e7ff"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#c7d2fe"; c.fillRect(0, 1180, W, H - 1180);   // the floor
  c.fillStyle = "#1e293b"; rrect(c, 600, 560, 360, 640, 14); c.fill();   // the glass door
  c.fillStyle = "#93c5fd"; rrect(c, 625, 590, 310, 580, 8); c.fill();
  c.fillStyle = "#0f172a"; rrect(c, 640, 640, 280, 70, 10); c.fill();
  c.font = SANS(34, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("VIP: INTERVIEWS", 780, 688);
  // the velvet rope
  [470, 1010].forEach((x) => { c.fillStyle = "#b45309"; rrect(c, x - 12, 1000, 24, 200, 8); c.fill(); c.beginPath(); c.arc(x, 994, 22, 0, 7); c.fillStyle = "#f59e0b"; c.fill(); });
  c.strokeStyle = "#9f1239"; c.lineWidth = 16; c.lineCap = "round"; c.beginPath(); c.moveTo(470, 1010); c.quadraticCurveTo(740, 1110, 1010, 1010); c.stroke();
};
const board = (c: Ctx, k = 1) => {   // frame 1's two numbers
  const b = (x: number, label: string, val: string, col: string) => {
    c.save(); c.globalAlpha = clamp(k * 3);
    c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 8, 218, 470, 220, 24); c.fill();
    c.fillStyle = "#111827"; rrect(c, x, 210, 470, 220, 24); c.fill();
    c.font = SANS(40, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(label, x + 235, 270);
    const fs = fit(c, val, 430, 110); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(val, x + 235, 395);   // stills: "8 MONTHS" ran out of its block
    c.restore();
  };
  b(45, "JOB OPEN", "8 MONTHS", "#fbbf24");
  b(565, "HIRED", "0", "#f87171");
};
const versus = (c: Ctx, W: number, k: number, stampK: number) => {   // frame 1's injustice, big
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, 53, 468, 980, 240, 26); c.fill();
  c.fillStyle = "#fffbeb"; rrect(c, 45, 460, 990, 240, 26); c.fill();
  c.font = SANS(30, 900); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("THE LIST", 260, 506); c.fillText("HIS RESUME", 810, 506);
  c.font = SANS(118, 900); c.fillStyle = "#1d4ed8"; c.fillText(".NET", 260, 640);
  c.fillStyle = "#be123c"; c.fillText("dotnet", 810, 640);
  c.font = SANS(110, 900); c.fillStyle = INK; c.fillText("≠", 520, 636);
  c.restore();
  if (stampK > 0) stamp(c, "REJECTED", 790, 690, RED, stampK, 46, -0.08);   // stills: the stamp hid "dotnet"
};
const story = (c: Ctx, k: number) => {   // script review: the 8 months read as fact without it
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(38, 800);   // render review: too small
  const t = "a made-up company · inspired by a LinkedIn story";
  const w = c.measureText(t).width + 40; c.fillStyle = "rgba(15,23,42,0.85)"; rrect(c, 540 - w / 2, 222, w, 60, 14); c.fill();   // stills: the resume hid it at y 455
  c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, 540, 266); c.restore();
};
const bouncer = (c: Ctx, x: number, y: number, sc: number, talk: boolean, arm: "rest" | "stamp" | "clip", ks: number, f: number) => {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.fillStyle = "#111827"; rrect(c, -150, -40, 300, 420, 60); c.fill();   // the suit
  c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(-40, -40); c.lineTo(0, 60); c.lineTo(40, -40); c.closePath(); c.fill();
  c.fillStyle = RED; c.beginPath(); c.moveTo(-10, -30); c.lineTo(0, 50); c.lineTo(10, -30); c.closePath(); c.fill();
  c.fillStyle = "#94a3b8"; rrect(c, -110, -290, 220, 230, 46); c.fill();   // the robot head
  c.fillStyle = "#64748b"; rrect(c, -16, -330, 32, 46, 8); c.fill(); c.beginPath(); c.arc(0, -336, 14, 0, 7); c.fillStyle = Math.floor(f / 20) % 2 ? RED : "#7f1d1d"; c.fill();
  c.fillStyle = "#020617"; rrect(c, -96, -230, 192, 60, 20); c.fill();   // the sunglasses
  c.fillStyle = "rgba(255,255,255,0.35)"; rrect(c, -80, -222, 50, 14, 6); c.fill();
  c.fillStyle = "#020617"; if (talk) rrect(c, -36, -132, 72, 30, 12); else rrect(c, -40, -118, 80, 10, 5); c.fill();
  c.strokeStyle = "#e2e8f0"; c.lineWidth = 4; c.beginPath(); c.moveTo(108, -190); c.quadraticCurveTo(140, -120, 100, -40); c.stroke();   // the earpiece wire
  // the clipboard in the left hand
  c.save(); c.translate(-170, 140); c.rotate(-0.12);
  c.fillStyle = "#92400e"; rrect(c, -110, -150, 220, 290, 14); c.fill();
  c.fillStyle = "#fffbeb"; rrect(c, -95, -125, 190, 250, 8); c.fill();
  c.font = SANS(26, 900); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("THE LIST", 0, -84);
  c.font = SANS(62, 900); c.fillStyle = INK; c.fillText(".NET", 0, -10);
  c.font = SANS(24, 700); c.fillStyle = "#475569"; c.fillText("must have", 0, 34);
  c.restore();
  // the stamp in the right hand
  const up = arm === "stamp" ? 1 - ks : 0;
  c.save(); c.translate(170, 120 - 120 * up);
  c.fillStyle = "#7f1d1d"; rrect(c, -30, -90, 60, 80, 10); c.fill(); c.fillStyle = RED; rrect(c, -60, -14, 120, 40, 8); c.fill();
  c.restore();
  c.restore();
};
const resume = (c: Ctx, x: number, y: number, s: number, skills: string, k: number, stampK: number, rot = -0.05) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.2)"; rrect(c, -230, -290, 470, 600, 16); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, -240, -300, 470, 600, 16); c.fill();
  c.font = SANS(40, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("NAVEEN K.", -200, -220);
  c.font = SANS(26, 700); c.fillStyle = "#64748b"; c.fillText("Software developer · 5 years", -200, -180);
  c.fillStyle = "#e2e8f0"; [-130, -95, -60].forEach((yy) => { rrect(c, -200, yy, 380, 16, 8); c.fill(); });
  c.font = SANS(28, 900); c.fillStyle = "#334155"; c.fillText("SKILLS", -200, 10);
  let fs = 46; c.font = SANS(fs, 900); while (c.measureText(skills).width > 400 && fs > 26) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#1d4ed8"; c.fillText(skills, -200, 70);
  c.fillStyle = "#e2e8f0"; [120, 155, 190].forEach((yy) => { rrect(c, -200, yy, 380, 16, 8); c.fill(); });
  c.restore();
  if (stampK > 0) stamp(c, "REJECTED", x + 10, y + 60, RED, stampK, 74, -0.2);
};
const stamp = (c: Ctx, t: string, x: number, y: number, col: string, k: number, size = 80, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); const z = 1.7 - 0.7 * easeOut(clamp(k * 2)); c.scale(z, z); c.globalAlpha = clamp(k * 3);
  c.font = SANS(size, 900); const w = c.measureText(t).width + 50;
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#9f1239"; c.fillRect(0, 250, W, 12);
  const fs = fit(c, title, W - 80, 60); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 340);
  c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; sub.forEach((t, i) => c.fillText(t, W / 2, 406 + i * 50));
};
const chip = (c: Ctx, t: string, x: number, y: number, w: number, bg: string, fg: string, k: number, size = 34) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x - w / 2, y - size, w, size * 1.55, 14); c.fill();
  const fs = fit(c, t, w - 24, size, 800); c.font = SANS(fs, 800); c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, x, y + size * 0.18);
  c.restore();
};
const barRow = (c: Ctx, label: string, v: number, of: number, y: number, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = SANS(40, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(label, 90, y - 22);
  c.fillStyle = "#1e293b"; rrect(c, 90, y, 700, 76, 14); c.fill();
  c.fillStyle = col; rrect(c, 90, y, Math.max(16, 700 * (v / of) * easeOut(k)), 76, 14); c.fill();
  c.font = SANS(64, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(`${v} / ${of}`, 1010, y + 62);
  c.restore();
};
// the hand-drawn moment (Vamsi via Bujji: hand-drawn only where it carries the idea): marker on a whiteboard, the words
// drawing themselves stroke by stroke (a dashed outline that grows, then the ink fills in)
const drawn = (c: Ctx, t: string, x: number, y: number, size: number, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.font = HAND(size); c.textAlign = "center"; c.lineJoin = "round"; c.lineCap = "round";
  const len = c.measureText(t).width * 9;
  c.setLineDash([len * easeOut(clamp(k / 0.8)), len]); c.strokeStyle = col; c.lineWidth = 5; c.strokeText(t, x, y);
  c.setLineDash([]);
  const kf = seg(k, 0.7, 1); if (kf > 0) { c.globalAlpha = kf; c.fillStyle = col; c.fillText(t, x, y); }
  c.restore();
};
const line = (c: Ctx, pts: [number, number][], col: string, w: number, k: number) => {   // a marker stroke drawn along its points
  if (k <= 0) return;
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = total * clamp(k);
  c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), q = Math.min(1, left / d);
    c.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q); left -= d;
  }
  c.stroke(); c.restore();
};
const whiteboard = (c: Ctx, W: number, H: number, f: number, t0: number, c1: number) => {
  c.fillStyle = "#f5f5f0"; c.fillRect(0, 0, W, H);
  c.strokeStyle = "#cbd5e1"; c.lineWidth = 10; c.strokeRect(30, 180, W - 60, 1300);
  c.font = HAND(54); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("the list says:", 90, 330);
  drawn(c, ".NET", W / 2, 560, 230, "#1d4ed8", seg(f, t0 + 2, t0 + 30));
  c.font = HAND(54); c.fillStyle = "#64748b"; c.globalAlpha = seg(f, c1 - 8, c1); c.fillText("his resume says:", 90, 760); c.globalAlpha = 1;
  drawn(c, "dotnet", W / 2, 990, 210, "#be123c", seg(f, c1, c1 + 30));
  line(c, [[860, 640], [1000, 640]], INK, 12, seg(f, c1 + 30, c1 + 36));   // ≠, drawn
  line(c, [[860, 690], [1000, 690]], INK, 12, seg(f, c1 + 34, c1 + 40));
  line(c, [[960, 590], [900, 740]], RED, 12, seg(f, c1 + 38, c1 + 44));
  line(c, [[120, 1110], [960, 1110]], "#be123c", 8, seg(f, c1 + 30, c1 + 44));   // the underline
  stamp(c, "REJECTED", W / 2, 1290, RED, seg(f, c1 + 46, c1 + 56), 96, -0.08);
};

// ---------- the scene ----------
const StBouncer: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.8} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.4} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.22} />, <Sfx key={k("h")} at={cue(i, 1, 0.4) - 2} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />);
    if (b.prop === "stamp" || b.prop === "loop") sfx.push(<Sfx key={k("s")} at={b.prop === "loop" ? end + HOLD : at + 4} src="reel/sfx_boom.wav" vol={b.prop === "loop" ? 1.0 : 0.9} />, <Sfx key={k("c")} at={b.prop === "loop" ? end + HOLD : at + 4} src={CLAP} vol={0.55} />, <Sfx key={k("g")} at={b.prop === "loop" ? end + HOLD : at + 4} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "resume") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "hand") { [0, 6, 12, 18, 24].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 2 + q} src="audio/sfx_tick.wav" vol={0.18} />)); const c1 = cue(i, 1, 0.5); [0, 6, 12, 18, 24].forEach((q) => sfx.push(<Sfx key={k("u" + q)} at={c1 + q} src="audio/sfx_tick.wav" vol={0.18} />)); sfx.push(<Sfx key={k("s")} at={c1 + 48} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={c1 + 48} src={CLAP} vol={0.4} />); }
    if (b.prop === "letters") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "test") { const c2 = cue(i, 2, 0.75); sfx.push(<Sfx key={k("n")} at={c2 - 3} src="reel/sfx_boom.wav" vol={te ? 0.7 : 0.95} />, <Sfx key={k("c")} at={c2 + 6} src={CLAP} vol={0.4} />, <Sfx key={k("z")} at={c2 + 2} src="reel/sfx_buzz.wav" vol={0.3} />); }
    if (b.prop === "eleven") sfx.push(<Sfx key={k("g")} at={at + 2} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "fakes") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "ai") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("p")} at={at + 10} src="audio/sfx_pop.wav" vol={0.25} />, ...[0, 10, 20].map((q) => <Sfx key={k("x" + q)} at={c1 + 6 + q} src="reel/sfx_buzz.wav" vol={0.3} />), <Sfx key={k("b")} at={at + 30} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.7} />); }   // the NO stamps; a hit on 13 of 60
    if (b.prop === "asked") sfx.push(<Sfx key={k("z")} at={end} src="reel/sfx_buzz.wav" vol={0.2} />);
    if (b.prop === "seek" || b.prop === "hire") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 10)} src={CLAP} vol={0.35} />, <Sfx key={k("h")} at={Math.max(0, at - 12)} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />);
    if (b.prop === "question") sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 6)} src="reel/sfx_riser.wav" vol={0.35} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(2121 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "hand") {
          whiteboard(c, W, H, f, ln.from - 4, cu(1, 0.45));
        } else if (b.shot === "letters") {
          dark(c, W, H, "A KEYWORD FILTER", ["it checks the letters, one by one"], "#fda4af");
          const row = (t: string, y: number, col: string, k: number, bad: number[]) => {
            if (k <= 0) return;
            [...t].forEach((ch, j) => {
              const x = 110 + j * 145; c.save(); c.globalAlpha = clamp((k - j * 0.08) * 4);
              c.fillStyle = bad.includes(j) && k > 0.9 ? "#7f1d1d" : "#1e293b"; rrect(c, x, y, 125, 150, 16); c.fill();
              c.font = SANS(88, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(ch, x + 62, y + 110); c.restore();
            });
          };
          row(".NET", 520, "#93c5fd", seg(f, ln.from + 2, ln.from + 20), []);
          row("dotnet", 760, "#fda4af", seg(f, ln.from + 10, ln.from + 30), [0, 1, 2, 3, 4, 5]);
          c.save(); c.globalAlpha = seg(f, ln.from + 30, ln.from + 38); c.font = SANS(54, 900); c.fillStyle = "#f87171"; c.textAlign = "center"; c.fillText("no match → REJECTED", W / 2, 1020); c.restore();
          tag(c, "letters, not meaning", W / 2, 1200, 70, "#fde68a", INK, -0.02, seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
        } else if (b.shot === "test") {
          dark(c, W, H, "OUR TEST: 20 WAYS TO WRITE .NET", ["an exact \".NET\" filter (code, no AI)"]);
          const SP = ["dotnet", "DotNet", "DOTNET", ".Net", "dot net", "Dotnet Core", "NET 6", "dotnet CLI", "dot-net", "DotNet 7", "ASP.Net API",
            ".NET", "ASP.NET Core", "C# / .NET 8", "VB.NET", ".NET MAUI", "Blazor (.NET)", "Microsoft .NET", ".NET 4.8", "ASP.NET MVC"];
          const fakes = b.prop === "fakes";
          const c2 = fakes ? ln.from - 600 : cu(2, 0.75);
          SP.forEach((t, j) => {
            const x = 168 + (j % 4) * 248, y = 520 + Math.floor(j / 4) * 100, bad = j < 11;   // render review: the grid was too small
            const k = seg(f, (fakes ? ln.from - 600 : ln.from) + j * 1.5, (fakes ? ln.from - 600 : ln.from) + j * 1.5 + 6);
            const red = bad && f >= c2;
            chip(c, (red ? "✗ " : "") + t, x, y, 236, red ? "#7f1d1d" : "#334155", red ? "#fecaca" : "#e2e8f0", k, 38);
          });
          barRow(c, "real .NET skills, bounced", 11, 20, 1060, RED, seg(f, c2, c2 + 10));
          if (fakes) {
            const c1 = cu(1, 0.4);
            chip(c, "✓ LET IN: \"Not familiar with .NET\"", W / 2, 1260, 900, "#14532d", "#bbf7d0", seg(f, ln.from + 2, ln.from + 10), 40);
            barRow(c, "lines with NO .NET, let in", 3, 5, 1390, "#f97316", seg(f, c1, c1 + 10));
          }
        } else if (b.shot === "ai") {
          dark(c, W, H, "A SMALL FREE AI THAT READS MEANING", ["offline, 3 tries per line"], "#86efac");
          chip(c, "✓ nobody without .NET got in", W / 2, 560, 900, "#14532d", "#bbf7d0", seg(f, ln.from + 2, ln.from + 10), 44);
          const c0 = cu(1, 0.3);
          barRow(c, "real .NET answers it bounced", 13, 60, 760, RED, seg(f, ln.from + 30, ln.from + 40));
          c.save(); c.globalAlpha = seg(f, ln.from + 40, ln.from + 48); c.font = SANS(38, 800); c.fillStyle = "#fecaca"; c.textAlign = "center"; c.fillText("about 1 in 5", W / 2, 900); c.restore();
          c.save(); c.globalAlpha = seg(f, ln.from + 4, ln.from + 12); c.fillStyle = "#1e293b"; rrect(c, 90, 960, W - 180, 330, 26); c.fill();
          c.font = SANS(48, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText("Skills: \"DotNet\" (one word)", 140, 1040); c.restore();
          [0, 1, 2].forEach((q) => stamp(c, "NO", 270 + q * 270, 1180, RED, seg(f, c0 + 6 + q * 10, c0 + 14 + q * 10), 84, -0.1 + q * 0.06));
        } else if (b.shot === "rule") {
          corridor(c, W, H);
          c.fillStyle = "rgba(15,23,42,0.88)"; c.fillRect(0, 0, W, H);
          const kL = seg(f, (b.prop === "seek" ? ln.from : -1e9) + 2, (b.prop === "seek" ? ln.from : -1e9) + 10);
          const kR = b.prop === "hire" ? seg(f, ln.from + 2, ln.from + 10) : 0.3;   // the hiring panel waits, dimmed
          const panel = (x: number, head: string, rows: string[], bg: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = k === 0.3 ? 0.3 : clamp(k * 3);
            c.fillStyle = bg; rrect(c, x, 300, 450, 940, 30); c.fill();
            c.font = SANS(48, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(head, x + 225, 380);
            c.font = SANS(40, 800); rows.forEach((t, q) => c.fillText(t, x + 225, 480 + q * 64));
            c.restore();
          };
          panel(70, "JOB HUNTING?", ["Copy the job", "post's exact words.", "", "It says .NET?", "write .NET", "", "It says B.Com?", "write B.Com"], "#dcfce7", kL);
          panel(560, "HIRING?", ["Every week:", "read 20", "REJECTS", "yourself.", "", "Add every", "spelling to", "the list."], "#e0e7ff", kR);
        } else {
          // ---------- the door ----------
          const hookOn = b.prop === "hook" || loopOn;
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) || (b.prop === "stamp" && p < 0.1) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.save(); c.translate(sx, sy);
          corridor(c, W, H);
          const [sm, sa] = loopOn ? (["shock", "up"] as [BillMood, BillArms]) : SHALINI[n] ?? ["worried", "rest"];
          person(c, "shalini" as BillWho, [190, 1300], 0.62, sm, sa, b.who === "shalini" && talking, r);
          const [nm, na] = loopOn ? (["shock", "rest"] as [BillMood, BillArms]) : NAVEEN[n] ?? ["worried", "rest"];
          person(c, "naveen" as BillWho, [440, 1330], 0.6, nm, na, b.who === "naveen" && talking, r);
          const stampNow = hookOn || b.prop === "stamp";
          const ks = hookOn ? (b.prop === "hook" ? seg(f, 0, 6) : seg(f, slam, slam + 6)) : b.prop === "stamp" ? seg(f, ln.from, ln.from + 6) : b.prop === "loop" ? 0 : 1;
          bouncer(c, 840, 1010, 0.8, b.who === "bouncer" && talking, stampNow ? "stamp" : "rest", ks, f);   // render review: the frame-1 card hid his face
          c.restore();
          if (n <= 6 || n === 12 || n === 16) {
            const lab = (t: string, x: number, y: number, bg: string) => { c.save(); c.font = SANS(34, 900); const w = c.measureText(t).width + 30; c.fillStyle = bg; rrect(c, x - w / 2, y - 34, w, 48, 12); c.fill(); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(t, x, y); c.restore(); };
            lab("HR: SHALINI", 190, 1000, "#0f766e"); lab("CANDIDATE: NAVEEN", 450, 1060, "#b45309");
          }
          if (hookOn) { board(c); versus(c, W, 1, b.prop === "hook" ? seg(f, 0, 8) : seg(f, slam, slam + 8)); }
          if (!hookOn && (n === 2 || n === 3)) story(c, 1);
          if (b.prop === "stamp") resume(c, 560, 640, 0.62, "C#, dotnet (5 yrs)", 1, seg(f, ln.from + 2, ln.from + 10));
          if (b.prop === "resume") resume(c, 540, 600, 0.9, "C#, dotnet (5 yrs)", seg(p, 0, 0.12), 0, 0.02);
          if (b.prop === "question") {
            const k = seg(p, 0.0, 0.1);
            if (k > 0) {
              c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, 60, 220, W - 120, 440, 30); c.fill();
              c.font = SANS(58, 900); c.fillStyle = "#fde68a"; c.textAlign = "center";
              ["A bot that reads you", "in 1 second...", "or a human, in 3 weeks?"].forEach((t, q) => c.fillText(t, W / 2, 360 + q * 92));
              c.restore();
            }
          }
          if (b.prop === "loop" && !loopOn) resume(c, 560, 640, 0.62, "C#, dotnet (5 yrs)", seg(p, 0, 0.15), 0);
        }
      }} />
    </>
  );
};

export const BOUNCER_SCENES = { sk_bouncer: StBouncer };
