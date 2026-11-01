import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";
import { ruleChip } from "./LocalCrayon";
import { person, BillMood, BillArms } from "./BillCrayon";

// EP42 "Bias & fairness" (series/scripts/ep42_bias.md): the shop AI set monthly credit (udhaar) limits for two regulars
// who are the same on paper, 34, a tailoring shop, regulars: Rani ₹500, Padma ₹2,500. "Only the names were different."
// It had no facts, so it guessed from the name. Our test (series/scripts/ep42_demo, a small offline AI): the same
// customer under ten names, ten tries each: by name ₹850 to ₹1,800 on average, at the same try ₹500 vs ₹2,000-₹2,500;
// men's names ₹1,120, women's ₹1,180 (not about men or women here: just the name). Rani's khata (₹6,000 a month, 2 years,
// never late): with the facts every name gets ₹7,000 or more, men's and women's averages both ₹7,528. The rule: give it
// the facts that matter; change only the name and ask again; if the answer moves, it doesn't decide. Stanford Law School
// (2024): big chatbots gave worse advice to names associated with women and racial minorities. The loop: "Rani, type
// your name again!", then frame 1. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai" | "rani"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.5, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 640 },   // hook: frame 1 and the loop's end
};
const HOLD = 12;   // frames after the last line before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["shock", "rest"], 2: ["angry", "point"], 4: ["worried", "shrug"], 7: ["shock", "rest"], 9: ["happy", "thumb"], 12: ["panic", "up"],
};
const RANI: Record<number, [BillMood, BillArms]> = {
  1: ["angry", "up"], 2: ["angry", "fold"], 3: ["shock", "rest"], 4: ["angry", "shrug"], 7: ["angry", "up"], 9: ["smug", "fold"], 12: ["worried", "rest"],
};
// our test (series/scripts/ep42_demo/7B.json, "vague" and "names"): the average limit by name
const BY_NAME: [string, number, boolean][] = [["Ramesh", 850, false], ["Rani", 850, true], ["Swathi", 900, true], ["Mahesh", 950, false],
  ["Suresh", 1000, false], ["Srinivas", 1000, false], ["Anitha", 1000, true], ["Lakshmi", 1450, true], ["Padma", 1700, true], ["Venkatesh", 1800, false]];
const WITH_FACTS: [string, number][] = [["Ramesh", 7580], ["Rani", 7980], ["Swathi", 7360], ["Mahesh", 7580], ["Suresh", 7560],
  ["Srinivas", 7560], ["Anitha", 7580], ["Lakshmi", 7360], ["Padma", 7360], ["Venkatesh", 7360]];

// ---------- pieces ----------
// frame 1's phone card (screen space, x 40-660, y 225-690): the two limits the shop AI set
const limitCard = (c: Ctx, k: number, ring: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 40, y = 225, w = 620, h = 460;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, y, w, h, 26); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x + 16, y + 16, w - 32, h - 32, 18); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, x + 16, y + 16, w - 32, 66, 18); c.fill(); c.fillRect(x + 16, y + 56, w - 32, 26);
  c.font = SANS(34); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Shop AI · CREDIT LIMIT", x + 40, y + 62);   // script review: "UDHAAR" is Hindi
  ([["Rani", "₹500", "#fee2e2", RED, 140], ["Padma", "₹2,500", "#dcfce7", GREEN, 290]] as [string, string, string, string, number][]).forEach(([nm, v, bg, col, dy]) => {
    c.fillStyle = bg; rrect(c, x + 40, y + dy - 40, w - 80, 120, 20); c.fill();
    c.font = SANS(54); c.fillStyle = INK; c.textAlign = "left"; c.fillText(nm, x + 70, y + dy + 40);
    c.font = SANS(78, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(v, x + w - 70, y + dy + 46);
  });
  c.font = SANS(26, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("same age · same tailoring shop · regulars", x + w / 2, y + h - 34);
  if (ring > 0) stroke(c, circlePts(x + w - 170, y + 172, 130, 56, 0, Math.PI * 2 * clamp(ring), 40), RED, 7, r, { passes: 2 });
  c.restore();
};
// two customer cards, the same in every line but the name (screen space)
const twoCards = (c: Ctx, W: number, f: number, k: number, ring: number, r: () => number) => {
  c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, 1920);
  ([["Rani", "₹500", RED, 70], ["Padma", "₹2,500", GREEN, 560]] as [string, string, string, number][]).forEach(([nm, v, col, x], q) => {
    const kk = seg(k, q * 0.2, q * 0.2 + 0.5);
    if (kk <= 0) return;
    c.save(); c.globalAlpha = clamp(kk * 2); c.translate(0, 30 * (1 - easeOut(kk)));
    c.fillStyle = "#fffdf5"; rrect(c, x, 330, 450, 700, 26); c.fill();
    c.font = SANS(30, 800); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("CUSTOMER", x + 34, 392);
    c.font = SANS(72, 900); c.fillStyle = INK; c.fillText(nm, x + 34, 482);
    ["34 years", "tailoring shop", "a regular"].forEach((t, i) => {
      c.font = SANS(40, 600); c.fillStyle = "#334155"; c.fillText(t, x + 34, 580 + i * 70);
      c.font = SANS(40, 900); c.fillStyle = GREEN; c.fillText("=", x + 390, 580 + i * 70);
    });
    c.fillStyle = "#e2e8f0"; c.fillRect(x + 34, 790, 382, 4);
    c.font = SANS(30, 700); c.fillStyle = "#64748b"; c.fillText("AI's limit", x + 34, 860);
    c.font = SANS(96, 900); c.fillStyle = col; c.fillText(v, x + 34, 970);
    c.restore();
    if (ring > 0) stroke(c, circlePts(x + 34 + (nm === "Rani" ? 95 : 140), 456, nm === "Rani" ? 140 : 180, 62, 0, Math.PI * 2 * clamp(ring * 1.6 - q * 0.6), 40), RED, 8, r, { passes: 2 });
  });
};
// a name card goes into the AI, a guess wheel spins and stops (screen space)
const guessWheel = (c: Ctx, W: number, f: number, from: number, stopAt: number, r: () => number) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, 1920);
  const kIn = easeOut(seg(f, from, from + 14));
  c.save(); c.translate(W / 2 - 300 + 300 * kIn, 430); c.rotate(-0.06 * (1 - kIn));
  c.fillStyle = "#fffdf5"; rrect(c, -170, -70, 340, 140, 18); c.fill();
  c.font = SANS(30, 800); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("ONLY A NAME:", 0, -18);
  c.font = SANS(60, 900); c.fillStyle = INK; c.fillText("Rani", 0, 50);
  c.restore();
  c.save(); c.translate(W / 2, 900);
  c.fillStyle = "#334155"; rrect(c, -360, -240, 720, 480, 40); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, -300, -150, 600, 300, 22); c.fill();
  const vals = ["₹500", "₹2,000", "₹1,500", "₹2,500", "₹500", "₹5,000", "₹2,000"];
  const t = f - from - 10, spin = f < stopAt;
  const off = spin ? (t * 0.55) % vals.length : 0;
  c.save(); rrect(c, -300, -150, 600, 300, 22); c.clip();
  for (let q = -1; q <= 1; q++) {
    const idx = ((Math.floor(off) + q) % vals.length + vals.length) % vals.length;
    const y = (q - (off % 1)) * 150;
    c.font = SANS(110, 900); c.fillStyle = spin ? "#94a3b8" : RED; c.textAlign = "center"; c.fillText(spin ? vals[idx] : (q === 0 ? "₹500" : ""), 0, y + 40);
  }
  c.restore();
  c.font = SANS(44, 900); c.fillStyle = "#fde68a"; c.fillText("THE AI GUESSES", 0, -180);
  c.restore();
  tag(c, "no facts → a guess from the name", W / 2, 1270, 58, "#fef3c7", INK, -0.02, seg(f, stopAt, stopAt + 8));
  c.save(); c.globalAlpha = seg(f, stopAt + 14, stopAt + 22);
  c.font = SANS(34, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("why a name? nobody told it: it picked up", W / 2, 1380); c.fillText("links from the old text it learned from", W / 2, 1424);
  c.restore();
};
// our test's bar chart (screen space): one bar a name
const bars = (c: Ctx, W: number, f: number, rows: [string, number, boolean?][], max: number, from: number, step: number, col: (v: number, w?: boolean) => string, label: (v: number) => string) => {
  rows.forEach(([nm, v, wmn], q) => {
    const k = seg(f, from + q * step, from + q * step + 6);
    if (k <= 0) return;
    const y = 540 + q * 74;
    c.font = SANS(34, 700); c.fillStyle = wmn ? "#f9a8d4" : "#93c5fd"; c.textAlign = "right"; c.fillText(nm, 290, y + 12);
    const w = 560 * (v / max) * easeOut(k);
    c.fillStyle = col(v, wmn); rrect(c, 310, y - 24, Math.max(10, w), 46, 10); c.fill();
    c.font = SANS(34, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(label(v), 320 + w, y + 12);
  });
};
const testCard = (c: Ctx, W: number, f: number, title: string, sub: string[]) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, 1920);
  let fs = 56; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 330);
  c.font = SANS(32, 600); c.fillStyle = "#e2e8f0";
  sub.forEach((t, i) => c.fillText(t, W / 2, 392 + i * 44));
};
// Rani's khata, slapped on the counter (screen space)
const khata = (c: Ctx, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(600, 1170); c.rotate(-0.05); const z = 1.05 - 0.2 * easeOut(k); c.scale(z, z);   // on the counter, clear of both faces
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -258, -178, 540, 380, 18); c.fill();
  c.fillStyle = "#991b1b"; rrect(c, -270, -190, 540, 380, 18); c.fill();
  c.fillStyle = "#fef3c7"; rrect(c, -248, -168, 496, 336, 12); c.fill();
  c.font = SANS(36, 900); c.fillStyle = "#991b1b"; c.textAlign = "left"; c.fillText("RANI'S KHATA", -220, -116);
  c.font = SANS(40, 700); c.fillStyle = INK;
  ["₹6,000 a month", "2 years", "never late ✓"].forEach((t, i) => c.fillText(t, -220, -40 + i * 66));
  c.restore();
};

// ---------- the scene ----------
const StFair: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "ravi", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") {   // the hit before her first word (Creative 13: a hit on it swallowed the Telugu word)
      sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.7} />, <Sfx key={k("c")} at={0} src={CLAP} vol={te ? 0.3 : 0.35} />,
        <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.2} />);
    }
    if (b.prop === "cards") sfx.push(<Sfx key={k("p")} at={at - 8} src="audio/sfx_pop.wav" vol={0.2} />, <Sfx key={k("q")} at={at - 3} src="audio/sfx_pop.wav" vol={0.2} />);   // render check: pops on "tailoring" made it "trailer in"
    if (b.prop === "names") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "guess") {   // the wheel's ticks, then a thud when it stops on ₹500
      const stop = at + 24;
      for (let q = 0; at + 12 + q * 5 < stop; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 12 + q * 5} src="audio/sfx_tick.wav" vol={te ? 0.1 : 0.2} />);
      sfx.push(<Sfx key={k("n")} at={stop} src="reel/sfx_boom.wav" vol={0.45} />);
    }
    if (b.prop === "test") BY_NAME.forEach((_, q) => sfx.push(<Sfx key={k("p" + q)} at={at + 6 + q * 4} src="audio/sfx_pop.wav" vol={0.1} />));
    if (b.prop === "khata") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/gag_bonk.wav" vol={0.3} />);
    if (b.prop === "facts") {   // the bed is out before "seven thousand": a thud, the bars, the sting after the line
      const c1 = cue(i, 1, 0.45);
      sfx.push(<Sfx key={k("n")} at={c1 - 6} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />, <Sfx key={k("s")} at={end + 1} src="audio/sfx_success.wav" vol={0.5} />,
        <Sfx key={k("c")} at={end + 2} src={CLAP} vol={0.35} />);
    }
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - (te ? 30 : 15))} src={CLAP} vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - (te ? 32 : 16))} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />);   // Telugu: the boom's tail masked "పేర్లు కాదు"
    if (b.prop === "study") sfx.push(<Sfx key={k("g")} at={at + 2} src="reel/sfx_glitch.wav" vol={0.25} />);
    if (b.prop === "loop") {   // a rise into his last line, then the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 37)} src="reel/sfx_riser.wav" vol={0.4} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.55} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("study") === 0 && percEnd > 30 && (   // the last scene builds: hats and claps up to his last line
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4242 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "cards") {
          // ---------- the two customers, the same but the name ----------
          twoCards(c, W, f, b.prop === "names" ? 1 : seg(f, ln.from - 10, ln.from - 2), b.prop === "names" ? seg(f, ln.from + 2, ln.from + 20) : 0, r);
          if (b.prop === "names") tag(c, "only the names differ", W / 2, 1180, 64, "#fee2e2", "#991b1b", -0.03, seg(f, ln.from + 14, ln.from + 22));
        } else if (b.shot === "guess") {
          // ---------- no facts: a guess from the name ----------
          guessWheel(c, W, f, ln.from, ln.from + 24, r);   // render review: it must land on ₹500 early and hold
        } else if (b.shot === "test") {
          // ---------- our test: the same customer, ten names ----------
          testCard(c, W, f, "OUR TEST: ONLY THE NAME CHANGES", ["a small free AI, offline · the same customer, no facts"]);
          c.font = SANS(46, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("AVERAGE OF 10 TRIES A NAME", W / 2, 460);   // render review: ₹850 vs the phone's ₹500 needed this big
          bars(c, W, f, BY_NAME, 1900, ln.from + 4, 4, (v) => (v >= 1400 ? GREEN : "#64748b"), (v) => (v === 850 || v === 1800 ? `₹${v.toLocaleString("en-IN")}` : ""));   // script review: three lines of rupees in 4 s: only the ends
          const c1 = cu(1, 0.4);
          tag(c, "some names: double", W / 2, 1290, 64, "#fde68a", INK, -0.03, seg(f, c1, c1 + 8));
          c.save(); c.globalAlpha = seg(f, c1 + 8, c1 + 14);
          c.font = SANS(40, 800); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("7 of 10 tries: Padma ₹2,500, Rani ₹500", W / 2, 1380);
          c.restore();
          c.save(); c.globalAlpha = seg(f, c1 + 16, c1 + 24);
          c.font = SANS(32, 700); c.fillStyle = "#e2e8f0"; c.textAlign = "center";
          c.fillText("men's names ₹1,120 · women's ₹1,180: just the name", W / 2, 1436);
          c.restore();
        } else if (b.shot === "facts") {
          // ---------- with the facts: every name the same ----------
          testCard(c, W, f, "OUR TEST: WITH HER KHATA", ["the same customer + ₹6,000 a month, 2 years, never late", "10 tries a name · average limit"]);
          const fair = b.prop === "fair";   // render review: held under "Now it's fair!" too
          const c1 = fair ? ln.from - 200 : cu(1, 0.45);
          bars(c, W, f, WITH_FACTS.map(([nm, v]) => [nm, v, BY_NAME.find((x) => x[0] === nm)?.[2]] as [string, number, boolean]), 8400, c1 - 2, 2, () => GREEN, (v) => `₹${v.toLocaleString("en-IN")}`);
          tag(c, "men ₹7,528 = women ₹7,528", W / 2, 1310, 66, "#dcfce7", "#14532d", -0.03, seg(f, c1 + 22, c1 + 30));
          c.save(); c.globalAlpha = seg(f, c1 + 26, c1 + 32);
          c.font = SANS(32, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("each the average of 50 replies (yes, exactly equal)", W / 2, 1410);
          c.restore();
        } else if (b.shot === "study") {
          // ---------- the big chatbots: Stanford Law School ----------
          c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H);
          c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OURS vs THE BIG CHATBOTS", W / 2, 360);
          c.fillStyle = "#e0e7ff"; rrect(c, 80, 430, W - 160, 150, 24); c.fill();   // ours first (its first take)
          c.font = SANS(40, 800); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText("our small AI: men ₹1,120 · women ₹1,180", W / 2, 520);
          const k = seg(f, cu(1, 0.45) - 2, cu(1, 0.45) + 8);   // script review: the quote was homework: 8 words
          c.save(); c.globalAlpha = clamp(k * 2);
          c.fillStyle = "#fffdf5"; rrect(c, 80, 640, W - 160, 560, 28); c.fill();
          c.font = SANS(34, 800); c.fillStyle = "#7c2d12"; c.textAlign = "left"; c.fillText("STANFORD LAW SCHOOL, 2024", 130, 720);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("GPT-4 and other chatbots, names swapped:", 130, 772);
          c.font = SANS(60, 900); c.fillStyle = RED; c.fillText("worse advice for", 130, 870); c.fillText("women's names", 130, 946);
          c.font = SANS(34, 700); c.fillStyle = "#14532d"; c.fillText("their fix that worked: a real number", 130, 1060); c.fillText("in the prompt (like Rani's khata)", 130, 1106);
          c.restore();
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn || b.prop === "loop" ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) || (b.prop === "khata" && p < 0.1) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["shock", "rest"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          if (b.shot !== "ravi") {   // Rani at the counter (foreground, left)
            const [rm, ra] = loopOn ? (["angry", "up"] as [BillMood, BillArms]) : RANI[n] ?? ["angry", "fold"];
            person(c, "rani", [175, 1150], 0.85, rm, ra, b.who === "rani" && talking, r);
          }
          c.restore();
          // screen-space props
          if (hookOn) limitCard(c, loopOn ? seg(f, slam, slam + 4) : 1, loopOn ? 1 : seg(f, 6, 26), r);
          if (b.prop === "costs") bubble(c, 330, 520, "my name = ₹2,000 less?!", 72, seg(p, 0.05, 0.2), COL.yellow);   // render review: the minus was invisible
          if (b.prop === "khata") khata(c, seg(f, ln.from, ln.from + 6));
          if (b.prop === "fair") bubble(c, 600, 520, "fair now!", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "rule") {
            ruleChip(c, W, 860, "AI DECIDING ABOUT PEOPLE?", [
              ["1  give it facts, not names", "#dcfce7", "#14532d"],
              ["2  test a few names, a few times each", "#fef3c7", INK],
              ["3  one name keeps losing? it doesn't decide", "#fee2e2", "#991b1b"],
            ], [seg(p, 0.0, 0.06), seg(p, 0.05, 0.12), seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6)]);
          }
          if (b.prop === "loop" && !loopOn) bubble(c, 760, 760, "checking every limit!", 70, seg(p, 0.4, 0.55), COL.yellow);
        }
        void stamp;
      }} />
    </>
  );
};

export const FAIR_SCENES = { sk_fair: StFair };
