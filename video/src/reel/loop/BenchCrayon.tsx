import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx, robot, STUDENT } from "./DistillCrayon";
import { INK, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { bubble, laptop, padlock } from "./OwnCrayon";
import { ruleChip, row } from "./LocalCrayon";
import { brainFile, vice } from "./SqueezeCrayon";

// EP40 "73 in maths" (series/scripts/ep40_benchmarks.md): Ravi put the small 1.1 GB brain on the laptop because its
// maker's chart says "maths 73.2%", and it got 9 of his 20 bills wrong. A benchmark is one exam paper, the same for every
// AI (GSM8K: school maths). On Ravi's laptop the same paper scores 60% (18 of 30, the quiz): the 73.2 was the full-size
// brain on the maker's test, Ravi runs it squeezed, on his own. Copied? The same questions with new names and numbers:
// 67%, no drop. Rescue: your own test (20 real bills, the right totals written down): 11 · 15 · 18. Twist: Ravi posts
// his test online, the next brains can study it ("keep your test to yourself"), a new chart: 100% on Ravi anna's bill
// test, the loop. Numbers: our test (series/scripts/ep40_demo, ep38_demo) and Qwen's own chart.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.5, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 600 },   // hook: frame 1 and the loop's end
};
const HOLD = 12;   // frames after the last line before the slam back to frame 1
const QEND = 40;   // the quiz's count ends this many frames before the answer: a dead stop (render review)
const CLAP = "reel/creative09v1/clap.wav";   // a bright clap over the booms (phone speakers barely play 30-60 Hz)
const GREEN = "#16a34a", RED = "#dc2626", ORANGE = "#ea580c", BLUE = "#1d4ed8", GOLD = "#f59e0b";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "up"], 3: ["angry", "point"], 5: ["shock", "up"], 7: ["sus", "point"], 10: ["confused", "shrug"], 13: ["happy", "phone"],
  15: ["yell", "up"],
};
// GSM8K's first test question, word for word (github.com/openai/grade-school-math, MIT), and our rewrite
const Q1 = ["Janet’s ducks lay 16 eggs per day.", "She eats three for breakfast every", "morning and bakes muffins for her", "friends every day with four..."];

// ---------- pieces ----------
// the launch chart (screen space, x 70-520, y 240-640): the maker's 73.2%, or the new brain's 100% on Ravi's test
const chartCard = (c: Ctx, k: number, mode: "73" | "100", r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 70, y = 240, w = 450, h = 400, e = easeOut(k);
  c.translate(x + w / 2, y + h / 2); c.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e); c.rotate(-0.03); c.translate(-(x + w / 2), -(y + h / 2));
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#fffdf5"; rrect(c, x, y, w, h, 26); c.fill();
  c.fillStyle = mode === "73" ? BLUE : "#7c3aed"; rrect(c, x, y, w, 78, 26); c.fill(); c.fillRect(x, y + 50, w, 28);
  c.font = SANS(34); c.fillStyle = "#fff"; c.textAlign = "center";
  c.fillText(mode === "73" ? "LAUNCH CHART" : "NEW BRAIN · LAUNCH", x + w / 2, y + 52);
  c.font = SANS(36); c.fillStyle = INK;
  if (mode === "73") { c.fillText("1.1 GB brain", x + w / 2, y + 132); c.font = SANS(40); c.fillText("MATHS", x + w / 2, y + 190); }
  else { c.font = SANS(32); c.fillText("Ravi anna's", x + w / 2, y + 128); c.fillText("bill test", x + w / 2, y + 170); }
  c.font = SANS(mode === "73" ? 128 : 140); c.fillStyle = mode === "73" ? BLUE : "#7c3aed";
  c.fillText(mode === "73" ? "73.2%" : "100%", x + w / 2, y + 320);
  // a gold star
  c.save(); c.translate(x + w - 60, y + 130); c.rotate(0.2); c.beginPath();
  for (let q = 0; q < 10; q++) { const a = (q / 10) * Math.PI * 2 - Math.PI / 2, rr = q % 2 ? 22 : 50; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = GOLD; c.fill(); c.restore();
  c.font = SANS(24, 600); c.fillStyle = "#64748b"; c.fillText(mode === "73" ? "the maker's chart" : "(it studied the paper)", x + w / 2, y + 372);
  stroke(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], INK, 4, r, { passes: 1, alpha: 0.4 });
  c.restore();
};
// one of Ravi's wrong bills (screen space, x 560-950, y 250-700): the small brain's real reply (series/scripts/ep38_demo)
const billCard = (c: Ctx, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 570, y = 250, w = 370, h = 440;
  c.translate(x + w / 2, y + h / 2); c.rotate(0.04); c.translate(-(x + w / 2), -(y + h / 2));
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 18); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, h, 18); c.fill();
  c.font = SANS(30); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("RAVI KIRANA · bill", x + w / 2, y + 52);
  stroke(c, [[x + 24, y + 74], [x + w - 24, y + 74]], "#cbd5e1", 3, r, { passes: 1 });
  c.font = SANS(40, 600); c.fillStyle = INK; c.textAlign = "left";
  c.fillText("2 bread", x + 34, y + 134); c.fillText("4 biscuits", x + 34, y + 186);
  c.font = SANS(52); c.fillText("TOTAL ₹65", x + 34, y + 276);
  // the red cross and the right total in red pen
  stroke(c, [[x + 30, y + 220], [x + w - 30, y + 300]], RED, 9, r, { passes: 2 });
  stroke(c, [[x + w - 30, y + 220], [x + 30, y + 300]], RED, 9, r, { passes: 2 });
  c.font = SANS(44); c.fillStyle = RED; c.fillText("right: ₹170", x + 34, y + 356);
  c.font = SANS(36); c.fillStyle = "#fff"; c.fillStyle = RED; rrect(c, x + 18, y + h - 70, w - 36, 54, 14); c.fill();
  c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("9 of 20 bills wrong", x + w / 2, y + h - 30);
  c.restore();
};
// the exam paper (screen space): a sheet with a header and the first question
const examPaper = (c: Ctx, x: number, y: number, s: number, k: number, rot: number, r: () => number, title = "GSM8K") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); c.scale(s * (0.9 + 0.1 * easeOut(k)), s * (0.9 + 0.1 * easeOut(k)));
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -290 + 10, -360 + 12, 580, 720, 14); c.fill();
  c.fillStyle = "#fffef5"; rrect(c, -290, -360, 580, 720, 14); c.fill();
  c.font = SANS(54); c.fillStyle = INK; c.textAlign = "center"; c.fillText(title, 0, -270);
  c.font = SANS(28, 600); c.fillStyle = "#475569"; c.fillText("school maths · 1,319 questions", 0, -222);
  stroke(c, [[-250, -196], [250, -196]], "#94a3b8", 3, r, { passes: 1 });
  c.font = SANS(28, 500); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Q1.", -250, -146);
  Q1.forEach((t, i) => c.fillText(t, -250, -104 + i * 40));
  for (let q = 0; q < 5; q++) { c.font = SANS(28, 500); c.fillStyle = "#94a3b8"; c.fillText(`Q${q + 2}. ________________________`, -250, 90 + q * 52); }
  c.restore();
};
// the quiz card (screen space), held in the gap after the line; its 3-2-1 ends as the card leaves
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 820); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -440, 940, 830, 30); c.fill();
  c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -366);
  c.font = SANS(52); c.fillStyle = INK; c.fillText("The same paper on Ravi's laptop.", 0, -290); c.fillText("Its score?", 0, -226);
  [["A", "73%", "like the chart"], ["B", "60%", ""], ["C", "30%", ""]].forEach(([l, t, s2], i) => {
    const yy = -180 + i * 150;
    c.fillStyle = "#e0e7ff"; rrect(c, -400, yy, 800, 128, 22); c.fill();
    c.font = SANS(62); c.fillStyle = INK; c.textAlign = "left"; c.fillText(l, -360, yy + 84);
    c.font = SANS(62); c.fillText(t, -250, yy + (s2 ? 70 : 86));
    if (s2) { c.font = SANS(34, 500); c.fillStyle = "#475569"; c.fillText(s2, -250, yy + 112); }
  });
  c.font = SANS(42, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A, B or C", 0, 330);
  const t = f - (next - QEND - 72), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(0, 470); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? COL.red : "#2563eb"; c.fill();
    c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
  }
  c.restore();
};
// a dark panel with a title (inserts); titles sit below the banner (y 215+)
const panel = (c: Ctx, W: number, H: number, bg: string, title: string, sub = "") => {
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (title) { c.font = SANS(54); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 300); }
  if (sub) { c.font = SANS(32, 500); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(sub, W / 2, 352); }
};
// the pile of books an AI learns from (screen space), with pages dropping in
const studyPile = (c: Ctx, cx: number, y: number, f: number, k: number, r: () => number, extra?: { label: string; col: string; drop: number }) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const cols = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#f87171"];
  for (let q = 0; q < 6; q++) { c.fillStyle = cols[q]; rrect(c, cx - 260 + (q % 2) * 18, y - q * 46, 520, 42, 8); c.fill(); }
  c.font = SANS(34, 600); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("what AIs learn from", cx, y + 90);
  // web pages falling in, one after another
  for (let q = 0; q < 5; q++) {
    const t = ((f + q * 11) % 55) / 55, px = cx - 220 + q * 110, py = y - 520 + t * 260;
    c.save(); c.globalAlpha = clamp(k * 3) * (1 - t * 0.6);
    c.fillStyle = "#e2e8f0"; rrect(c, px - 40, py - 50, 80, 100, 8); c.fill();
    c.fillStyle = "#94a3b8"; for (let l = 0; l < 4; l++) c.fillRect(px - 28, py - 34 + l * 18, 56, 6);
    c.restore();
  }
  if (extra && extra.drop > 0) {   // the named page (the exam, or Ravi's post) drops into the pile
    const t = easeOut(extra.drop), px = cx + 120, py = y - 600 + t * 380;
    c.save(); c.translate(px, py); c.rotate(0.1 - 0.1 * t);
    c.fillStyle = extra.col; rrect(c, -130, -80, 260, 160, 14); c.fill();
    c.font = SANS(32); c.fillStyle = INK; c.textAlign = "center";
    extra.label.split("|").forEach((s2, i, a) => c.fillText(s2, 0, 12 - (a.length - 1) * 20 + i * 40));
    c.restore();
  }
  c.restore();
};
// Ravi's post (screen space, y 240-660)
const postCard = (c: Ctx, f: number, k: number, likes: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 110, y = 240, w = 840, h = 400;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, h, 26); c.fill();
  c.beginPath(); c.arc(x + 70, y + 70, 40, 0, 7); c.fillStyle = "#f59e0b"; c.fill();
  c.font = SANS(36); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Ravi Kirana", x + 130, y + 64);
  c.font = SANS(26, 500); c.fillStyle = "#64748b"; c.fillText("just now · public", x + 130, y + 100);
  c.font = SANS(42); c.fillStyle = INK; c.fillText("My AI bill test! 20 bills", x + 40, y + 190);
  c.fillText("+ the right totals.", x + 40, y + 244);
  c.font = SANS(36, 600); c.fillStyle = BLUE; c.fillText("Test your AI on it!", x + 40, y + 300);
  c.font = SANS(34); c.fillStyle = RED; c.fillText(`♥ ${Math.round(likes).toLocaleString("en-IN")}`, x + 40, y + 370);
  c.fillStyle = "#475569"; c.fillText(`shares ${Math.round(likes * 0.31).toLocaleString("en-IN")}`, x + 280, y + 370);
  c.restore();
};

// ---------- the scene ----------
const StBench: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const te = s.data.handle === "@ai_maastaaru_telugu";   // the Telugu mix keeps a softer build (render review 2: the rule line blurred)
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "ravi", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={i === 1 ? 0.32 : 0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.45} />,
      <Sfx key={k("z")} at={0} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "paper") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "quiz") {   // the papers slap down on the cut; the count's ticks and riser stop on its "1"
      sfx.push(<Sfx key={k("s")} at={at - 4} src="audio/sfx_snap.wav" vol={0.35} />);
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - QEND - 72 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - QEND - 36} src="reel/sfx_riser.wav" vol={0.45} />);   // 1.2 s: ends on the count's "1"
    }
    if (b.prop === "reveal") sfx.push(<Sfx key={k("n")} at={end + 1} src="reel/sfx_boom.wav" vol={0.75} />, <Sfx key={k("m")} at={end + 1} src={CLAP} vol={0.5} />);   // just after "Sixty percent"
    if (b.prop === "sizes") sfx.push(<Sfx key={k("v")} at={cue(i, 1, 0.55) - 6} src="audio/gag_squish.wav" vol={0.25} />);
    if (b.prop === "copied") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.5) - 8} src="reel/sfx_boom.wav" vol={0.35} />, <Sfx key={k("q")} at={cue(i, 1, 0.5) - 8} src={CLAP} vol={0.3} />);   // the stamp
    if (b.prop === "leak") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.4) - 8} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "nocopy") sfx.push(<Sfx key={k("s")} at={end + 1} src="audio/sfx_success.wav" vol={0.24} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 15)} src={CLAP} vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 16)} src="reel/sfx_boom.wav" vol={0.5} />);   // half a second early: a boom on the cut masked "మీ"
    if (b.prop === "bills") sfx.push(<Sfx key={k("c")} at={end + 1} src="audio/sfx_chaching.wav" vol={0.28} />);
    if (b.prop === "post") [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={at + 10 + q * 8} src="audio/sfx_pop.wav" vol={0.12} />));
    if (b.prop === "study") sfx.push(<Sfx key={k("w2")} at={at + 2} src="audio/sfx_whoosh.wav" vol={0.25} />, <Sfx key={k("r")} at={nx - 46} src="reel/sfx_riser.wav" vol={0.55} />);   // into the 100%
    if (b.prop === "loop") {   // the new chart slams in before the line (out of silence); after it, the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("h")} at={at - 10} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={at - 10} src={CLAP} vol={0.7} />,
        <Sfx key={k("s")} at={at - 10} src="audio/sfx_success.wav" vol={0.45} />, <Sfx key={k("g0")} at={at - 12} src="reel/sfx_glitch.wav" vol={0.35} />,   // render review: the 100% landed like every cut
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.5} />, <Sfx key={k("h2")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("c2")} at={slam} src={CLAP} vol={0.6} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.5} />);
    }
  });
  // the last scene builds: hats and claps on the bed's grid from its cut to the drop before the last line, ramping up
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("trust") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.15 + 0.4 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9900 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;   // the loop's last beat: frame 1 again
        if (b.shot === "paper") {
          // ---------- a benchmark: one exam paper, the same for every AI ----------
          panel(c, W, H, "#1e293b", "THE FAMOUS MATHS EXAM");
          const c1 = cu(1, 0.5), kk = seg(f, c1 - 2, c1 + 8);
          if (kk < 1) examPaper(c, W / 2, 800, 1.0 - 0.3 * kk, seg(f, ln.from, ln.from + 8), -0.02, r);
          if (kk > 0) {
            c.save(); c.globalAlpha = clamp(kk * 2);
            [220, 540, 860].forEach((x, q) => {
              c.fillStyle = "#7a4520"; c.fillRect(x - 140, 1000, 280, 22);   // a desk
              examPaper(c, x, 930, 0.28, 1, 0.05 * (q - 1), r);
              robot(c, x, 1240, 0.62, boil, 40 + q, { ...STUDENT, arms: "write", eyes: "open", mouth: "flat" });
            });
            c.restore();
            tag(c, "BENCHMARK", W / 2, 520, 96, "#fef3c7", INK, -0.02, seg(f, c1, c1 + 8));
            tag(c, "= the same exam for every AI", W / 2, 640, 56, "#e0e7ff", "#1e3a8a", 0.01, seg(f, c1 + 6, c1 + 14));
          }
        } else if (b.shot === "screen") {
          // ---------- our test: the famous paper on Ravi's laptop ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, 50);
          bigPhone(c, W, H, "our test: the famous paper", r, f);
          const c1 = cu(1, 0.5);
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 378);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("the 1.1 GB brain · 30 questions · offline", W / 2, 420);
          row(c, 580, "the paper: right", "18 of 30", INK, seg(f, ln.from, ln.from + 6), "#e2e8f0");
          if (f >= c1 - 2) {
            const kk = seg(f, c1 - 2, c1 + 6);
            c.save(); c.globalAlpha = clamp(kk * 2); c.translate(W / 2, 800); c.scale(0.8 + 0.2 * easeOut(kk), 0.8 + 0.2 * easeOut(kk));
            c.font = SANS(190); c.fillStyle = ORANGE; c.textAlign = "center"; c.fillText("60%", 0, 60);
            c.restore();
            tag(c, "B ✓", 820, 760, 80, "#dcfce7", "#14532d", 0.06, seg(f, c1 + 4, c1 + 10));
          }
          if (f >= c1 + 8) {
            c.save(); c.globalAlpha = seg(f, c1 + 8, c1 + 16);
            c.fillStyle = "#f1f5f9"; rrect(c, 130, 960, 820, 170, 22); c.fill();
            c.font = SANS(40, 600); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("the maker's chart", 160, 1026);
            c.font = SANS(44); c.fillStyle = "#9a3412"; c.fillText("its FULL-SIZE brain", 160, 1090);
            c.font = SANS(72); c.fillStyle = BLUE; c.textAlign = "right"; c.fillText("73.2%", 920, 1062);
            c.restore();
          }
          c.font = SANS(30, 600); c.fillStyle = "#334155"; c.textAlign = "center";
          c.fillText("Qwen2.5 1.5B, squeezed to 4-bit (EP37) · GSM8K Q1-30", W / 2, 1396);
          c.restore();
        } else if (b.shot === "sizes") {
          // ---------- one score = one brain, tested one way ----------
          panel(c, W, H, "#0f172a", "WHO GOT 73.2%?");
          const c1 = cu(1, 0.55);
          // the maker's lab: the full-size brain
          c.fillStyle = "#1e3a8a"; rrect(c, 90, 360, 900, 470, 30); c.fill();
          c.font = SANS(36); c.fillStyle = "#bfdbfe"; c.textAlign = "left"; c.fillText("THE MAKER'S LAB", 130, 420);
          brainFile(c, 300, 600, 0.85, 0, "full size", r);
          tag(c, "73.2%", 720, 560, 110, "#dbeafe", BLUE, -0.03, seg(f, ln.from, ln.from + 8));
          tag(c, "the maker's test", 720, 680, 48, "#e0e7ff", "#1e3a8a", 0.02, seg(f, ln.from + 6, ln.from + 14));
          // Ravi's laptop: the squeezed copy, his own test
          const k2 = seg(f, c1 - 4, c1 + 6);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 2);
            c.fillStyle = "#7c2d12"; rrect(c, 90, 880, 900, 470, 30); c.fill();
            c.font = SANS(36); c.fillStyle = "#fed7aa"; c.textAlign = "left"; c.fillText("RAVI'S LAPTOP", 130, 940);
            vice(c, 300, 1120, 0.62, seg(f, c1, c1 + 10), r);
            brainFile(c, 300, 1110, 0.62, seg(f, c1, c1 + 10), "squeezed", r);
            tag(c, "60%", 720, 1080, 110, "#ffedd5", ORANGE, 0.03, seg(f, c1 + 4, c1 + 10));
            tag(c, "his test", 720, 1200, 48, "#fed7aa", "#7c2d12", -0.02, seg(f, c1 + 8, c1 + 14));
            c.restore();
          }
          tag(c, "a score = one brain, tested one way", W / 2, 1420, 60, "#fef3c7", INK, -0.01, seg(f, c1 + 14, c1 + 22));
        } else if (b.shot === "leak") {
          // ---------- contamination, and the copy check ----------
          const nocopy = b.prop === "nocopy";
          const c1 = nocopy ? ln.from : cu(1, 0.4) + 24;   // render review: the definition card went by unseen
          panel(c, W, H, "#111827", nocopy || f >= c1 ? "THE COPY CHECK" : "CONTAMINATION");
          if (!nocopy) {
            const kOut = seg(f, c1 - 2, c1 + 6);
            if (kOut < 1) {   // studyPile sets its own alpha: fade it through k, not the context
              studyPile(c, W / 2, 880, f, (1 - kOut) / 3, r, { label: "GSM8K|exam questions", col: "#fde68a", drop: seg(f, ln.from + 4, ln.from + 24) });
              c.save(); c.globalAlpha = 1 - kOut;
              tag(c, "exam questions leak into", W / 2, 1100, 58, "#fee2e2", "#7f1d1d", -0.01, seg(f, ln.from + 8, ln.from + 16));
              tag(c, "what AIs learn from", W / 2, 1190, 58, "#fee2e2", "#7f1d1d", 0.01, seg(f, ln.from + 10, ln.from + 18));
              c.restore();
            }
          }
          // the swap: the same question, new name, new numbers
          const ky = nocopy ? 0 : 1 - easeOut(seg(f, c1, c1 + 10));
          const kc = nocopy ? 1 : seg(f, c1, c1 + 8);
          if (kc > 0) {
            c.save(); c.globalAlpha = clamp(kc * 2); c.translate(0, 120 * ky);
            c.fillStyle = "#fffef5"; rrect(c, 90, 380, 900, 420, 26); c.fill();
            c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("same questions, new names and numbers", W / 2, 450);
            c.font = SANS(44, 600); c.textAlign = "left";
            c.fillStyle = "#64748b"; c.fillText("Janet’s ducks lay 16 eggs...", 140, 550);
            c.font = SANS(60); c.fillStyle = INK; c.textAlign = "center"; c.fillText("↓", W / 2, 630);
            c.font = SANS(44, 600); c.textAlign = "left"; c.fillStyle = INK;
            const sw = seg(f, c1 + 6, c1 + 14);
            c.fillText("’s ducks lay", 140 + c.measureText("Lakshmi").width, 720);
            c.fillStyle = sw > 0.5 ? RED : INK; c.fillText("Lakshmi", 140, 720);
            const w1 = c.measureText("Lakshmi’s ducks lay ").width;
            c.fillStyle = sw > 0.5 ? RED : INK; c.fillText("22", 140 + w1, 720);
            c.fillStyle = INK; c.fillText(" eggs...", 140 + w1 + c.measureText("22").width, 720);
            c.restore();
          }
          if (nocopy) {
            const cc = cu(1, 0.5);
            row(c, 960, "the paper", "60%", ORANGE, seg(f, ln.from, ln.from + 6), "#e2e8f0");
            row(c, 1110, "new names and numbers", "67%", GREEN, seg(f, ln.from + 2, ln.from + 10), "#dcfce7");
            tag(c, "no drop: no sign of copying ✓", W / 2, 1290, 62, "#dcfce7", "#14532d", -0.02, seg(f, cc, cc + 8));
            c.save(); c.globalAlpha = seg(f, cc + 6, cc + 14);
            c.font = SANS(36, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("18 vs 20 right: two questions apart", W / 2, 1390);
            c.restore();
          }
        } else if (b.shot === "bills") {
          // ---------- Ravi's own test: 20 bills ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, 50);
          bigPhone(c, W, H, "our test: Ravi's 20 bills", r, f);
          const c1 = cu(1, 0.4);
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("RAVI'S 20 BILLS", W / 2, 378);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("right totals written down first · offline", W / 2, 420);
          c.font = SANS(30, 600); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("brain · its chart", 150, 500);
          c.textAlign = "right"; c.fillText("Ravi's bills", 930, 500);
          ([["1.1 GB", "73%", "11 of 20", "9 wrong", RED, "#fee2e2", ln.from], ["2.1 GB", "87%", "15 of 20", "5 wrong", ORANGE, "#ffedd5", ln.from + 6],
            ["4.7 GB", "92%", "18 of 20", "2 wrong", GREEN, "#dcfce7", c1 - 2]] as [string, string, string, string, string, string, number][]).forEach(([gb, ch, v, w, col, bg, t0], q) => {
            const kk = seg(f, t0, t0 + 6), y = 590 + q * 170;
            if (kk <= 0) return;
            c.save(); c.globalAlpha = clamp(kk * 3);
            c.fillStyle = bg; rrect(c, 130, y - 76, 820, 140, 22); c.fill();
            c.font = SANS(44); c.fillStyle = INK; c.textAlign = "left"; c.fillText(gb, 160, y - 10);
            c.font = SANS(44); c.fillStyle = BLUE; c.fillText(`chart ${ch}`, 160, y + 46);
            c.font = SANS(62); c.fillStyle = col; c.textAlign = "right"; c.fillText(v, 920, y + 2);
            c.font = SANS(32, 600); c.fillText(w, 920, y + 46);
            c.restore();
          });
          if (f >= c1 + 4) stroke(c, [[120, 846], [960, 846], [960, 1002], [120, 1002], [120, 846]], GREEN, 7, r, { passes: 2, alpha: seg(f, c1 + 4, c1 + 10) });
          if (f >= c1 + 12) {
            c.save(); c.globalAlpha = seg(f, c1 + 12, c1 + 20);
            c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.fillText("same order as the chart,", W / 2, 1170);
            c.fillText("but only YOUR test", W / 2, 1230); c.fillText("shows the wrong bills", W / 2, 1290);
            c.restore();
          }
          c.font = SANS(26, 600); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("EP38's bill test: 20 orders, the 15-line price board", W / 2, 1400);
          c.restore();
        } else if (b.shot === "study") {
          // ---------- the post goes into what the next AIs learn from ----------
          panel(c, W, H, "#111827", "WHAT THE NEXT AIs LEARN FROM");
          const c1 = cu(1, 0.5);
          studyPile(c, W / 2, 980, f, 1, r, { label: "Ravi anna's|bill test", col: "#bbf7d0", drop: seg(f, ln.from + 2, c1 - 4) });
          if (f >= c1 - 2) {
            const kk = seg(f, c1 - 2, c1 + 6);
            c.save(); c.globalAlpha = clamp(kk * 2); c.translate(W / 2, 1250); c.scale(0.9 + 0.1 * easeOut(kk), 0.9 + 0.1 * easeOut(kk));
            c.fillStyle = "#fef3c7"; rrect(c, -430, -80, 860, 150, 26); c.fill();
            c.font = SANS(56); c.fillStyle = INK; c.textAlign = "center"; c.fillText("KEEP YOUR TEST PRIVATE", 50, 18);
            c.restore();
            padlock(c, 140, 1236, 0.5, kk, r);
          }
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn || b.prop === "loop" ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (b.prop === "loop" && (f < ln.from + 8 || (loopOn && f < slam + 10))) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["yell", "up"] as [Mood, Arms]) : RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          laptop(c, 250, 1000, 0.72, "1.1 GB brain", r, {});
          phone(c, b.who === "ai" && talking, f, r, {});
          if (b.prop === "quiz") {   // thirty sheets slapped on the counter by the laptop
            const kk = seg(f, ln.from - 2, ln.from + 4);
            if (kk > 0) {
              c.save(); c.translate(470, 985 - 60 * (1 - easeOut(kk))); c.rotate(-0.06);
              for (let q = 0; q < 6; q++) { c.fillStyle = q % 2 ? "#fffef5" : "#f1f5f9"; rrect(c, -110 + q * 2, -20 - q * 6, 220, 40, 6); c.fill(); }
              c.font = SANS(26); c.fillStyle = INK; c.textAlign = "center"; c.fillText("GSM8K · 30 Qs", 0, -36);
              c.restore();
            }
          }
          c.restore();
          // screen-space props
          if (hookOn) { chartCard(c, loopOn ? seg(f, slam, slam + 4) : 1, "73", r); billCard(c, loopOn ? seg(f, slam, slam + 4) : 1, r); }
          if (b.prop === "loop" && !loopOn) {   // the new chart, slammed in before the line
            chartCard(c, seg(f, ln.from - 10, ln.from - 4), "100", r);
            tag(c, "it studied the paper!", W / 2, 720, 80, "#fee2e2", "#991b1b", -0.03, seg(p, 0.4, 0.55));
          }
          if (b.prop === "quiz") bubble(c, 330, 560, "30 questions!", 84, seg(p, 0.35, 0.5), COL.yellow);
          if (b.prop === "not73") bubble(c, 330, 560, "not 73?!", 96, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "copied") {
            bubble(c, 330, 560, "copied?!", 90, seg(p, 0.05, 0.2), COL.yellow);
            stamp(c, "ONLINE SINCE 2021", 600, 360, 64, RED, seg(p, 0.5, 0.6), r);
          }
          if (b.prop === "trust") {
            [["73.2%", 220, 330, BLUE], ["60%", 520, 290, ORANGE], ["67%", 800, 350, GREEN], ["11 of 20", 640, 470, RED]].forEach(([t, x, y, col], q) =>
              tag(c, t as string, x as number, y as number, 66, "#fffdf5", col as string, (q - 1.5) * 0.06, seg(p, 0.05 + q * 0.08, 0.15 + q * 0.08)));
          }
          if (b.prop === "rule") {
            ruleChip(c, W, 960, "TEST IT ON YOUR OWN WORK", [
              ["20 real bills, right totals written down", "#dcfce7", "#14532d"],
              ["the same test for every brain", "#e2e8f0", INK],
              ["your copy, your settings", "#fef3c7", INK],
            ], [seg(p, 0.1, 0.2), seg(p, 0.4, 0.5), seg(p, 0.65, 0.75)]);
          }
          if (b.prop === "post") postCard(c, f, seg(p, 0.3, 0.42), 1204 * seg(p, 0.42, 1.0));
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
      }} />
    </>
  );
};

export const BENCH_SCENES = { sk_bench: StBench };
