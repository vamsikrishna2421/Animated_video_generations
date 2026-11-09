import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// EP49 "AI and jobs: what really changes" (series/scripts/ep49_ai_jobs.md): Suresh, Ravi's helper for eight years at
// ₹15,000 a month, hears Ravi tested a free AI app on his work. Our test (series/scripts/ep49_demo: a small free AI,
// offline, five paper tasks from a shop helper's day, five tries each, read by hand): 18 of 25 right; sums and GST 10/10;
// every offer message a good draft that needed a fix before sending. The AI does the paper part, not the sacks, the
// deliveries or knowing who pays late. ILO (May 2025): one job in four has some GenAI exposure; most change rather than
// vanish; clerical jobs the most. The rule: AI takes tasks, not jobs: it drafts and adds, you check and send. The twist:
// "Teach me this app." "Fifteen thousand a month." Loops to frame 1.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai" | "suresh"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.4, x: 480, y: 740 }, suresh: { z: 1.35, x: 300, y: 860 }, ai: { z: 1.8, x: 760, y: 860 }, hook: { z: 0.92, x: 540, y: 640 },
};
const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["worried", "rest"], 2: ["sus", "up"], 4: ["shock", "rest"], 7: ["sus", "fold"], 12: ["happy", "thumb"], 13: ["hope", "rest"], 14: ["shock", "rest"],
};
const SURESH: Record<number, [BillMood, BillArms]> = {
  1: ["shock", "up"], 2: ["angry", "rest"], 4: ["shock", "up"], 6: ["angry", "five"], 10: ["worried", "rest"], 12: ["happy", "rest"], 13: ["smug", "fold"], 14: ["smug", "fold"],
};

// ---------- pieces ----------
const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 24) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
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
  c.fillStyle = "rgba(255,255,255,0.92)"; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 58); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(38, 700); c.fillStyle = "#e2e8f0"; sub.forEach((t, i) => c.fillText(t, W / 2, 388 + i * 52));
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 36, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 264);
  const fs = fit(c, big, 430, 100); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 384);
};
// the rice sack on Suresh's shoulder (world space)
const sack = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.rotate(-0.25); c.scale(s, s);
  c.fillStyle = "#e7d7b1"; rrect(c, -95, -70, 190, 150, 40); c.fill();
  c.strokeStyle = "#a3865a"; c.lineWidth = 5; rrect(c, -95, -70, 190, 150, 40); c.stroke();
  c.font = SANS(34, 900); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("RICE", 0, -5); c.font = SANS(28, 800); c.fillText("25 kg", 0, 35);
  c.restore();
};
const hookCard = (c: Ctx) => {
  block(c, 50, "SURESH: 8 YEARS", "₹15,000/month", "#4ade80");
  block(c, 560, "THE AI APP", "₹0", "#f87171");
};
const ROWS: [string, string, string][] = [
  ["Sums and GST", "10/10", GREEN], ["Reorder list", "4/5", GREEN], ["Replies to a customer", "4/5", GREEN], ["Offer messages, ready to send", "0/5", RED],
];

// ---------- the scene ----------
const StJobs: React.FC<SP> = ({ s }) => {
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
    const insert = !["wide", "ravi", "suresh", "ai", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.8} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.35} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.2} />, <Sfx key={k("h")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - 3} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.75} />, <Sfx key={k("p")} at={c1 + 10} src="audio/sfx_pop.wav" vol={0.25} />); }
    if (b.prop === "eighteen") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.22} />);
    if (b.prop === "rows") { [0, 8, 16].forEach((q) => sfx.push(<Sfx key={k("r" + q)} at={at + 4 + q} src="audio/sfx_pop.wav" vol={0.22} />)); sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.25} />); }
    if (b.prop === "me") sfx.push(<Sfx key={k("c")} at={at + 4} src={CLAP} vol={0.3} />);
    if (b.prop === "day") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "ilo") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />);
    if (b.prop === "clerks") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.22} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 12)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 14)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.55} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("d")} at={end - 2} src="audio/gag_ding.wav" vol={0.3} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4949 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "test") {
          dark(c, W, H, "OUR TEST: SURESH'S PAPER WORK", ["a small free AI (Qwen2.5 7B), offline", "5 tasks × 5 tries · every reply read by hand"]);
          const c1 = cu(1, 0.5);
          const q0 = 1 - seg(f, c1 - 4, c1);
          if (q0 > 0) { c.save(); c.globalAlpha = q0; c.font = SANS(66, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("How many right?", W / 2, 840); c.restore(); }
          const kt = seg(f, c1 - 2, c1 + 10);
          if (kt > 0) for (let j = 0; j < 25; j++) {
            const x = 155 + (j % 5) * 160, y = 520 + Math.floor(j / 5) * 128, ok = j < 18;
            c.save(); c.globalAlpha = clamp(kt * 3); c.fillStyle = kt > 0.5 ? (ok ? GREEN : RED) : "#334155"; rrect(c, x, y, 130, 104, 16); c.fill();
            c.font = SANS(60, 900); c.fillStyle = "#fff"; c.textAlign = "center"; if (kt > 0.5) c.fillText(ok ? "✓" : "✗", x + 65, y + 74); c.restore();
          }
          if (kt > 0.5) { c.save(); c.font = SANS(130, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.globalAlpha = seg(f, c1 + 6, c1 + 14); c.fillText("18 / 25", W / 2, 1330); c.restore(); }
        } else if (b.shot === "rows") {
          dark(c, W, H, "WHAT IT GOT RIGHT", ["5 paper tasks, 5 tries each"], "#86efac");
          ROWS.forEach(([a, v, col], q) => {
            const t0 = q < 3 ? ln.from + 2 + q * 8 : cu(1, 0.4); const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 440 + q * 140;
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 118, 20); c.fill();
            c.font = SANS(44, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(a, 96, y + 74);
            c.font = SANS(60, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(v, W - 96, y + 80);
            c.restore();
          });
          const kd = seg(f, cu(1, 0.4) + 8, cu(1, 0.4) + 16);
          if (kd > 0) {   // a real draft from our test, with what needed fixing circled
            c.save(); c.globalAlpha = clamp(kd * 3); const y = 1020;
            c.fillStyle = "#dcf8c6"; rrect(c, 80, y, W - 160, 230, 22); c.fill();
            c.font = SANS(30, 800); c.fillStyle = "#15803d"; c.textAlign = "left"; c.fillText("a real draft from our test", 110, y + 46);
            c.font = SANS(38, 700); c.fillStyle = INK;
            c.fillText("Reminder! 10% off on all rice this", 110, y + 104); c.fillText("Sunday only at [Your Shop Name]! ... ice", 110, y + 156);
            c.strokeStyle = RED; c.lineWidth = 6;
            c.beginPath(); c.ellipse(560, y + 144, 225, 34, 0, 0, 7); c.stroke();
            c.beginPath(); c.ellipse(870, y + 144, 62, 32, 0, 0, 7); c.stroke();
            c.restore();
            chip(c, "a good draft, not ready to send", W / 2, 1330, "#fde68a", INK, seg(f, cu(1, 0.4) + 16, cu(1, 0.4) + 24), 40);
          }
        } else if (b.shot === "day") {
          dark(c, W, H, "SURESH'S DAY", [], "#fde68a");
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
          const col = (x: number, title: string, items: string[], bg: string, fg: string, k: number, tagT: string) => {
            if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = bg; rrect(c, x, 400, 440, 860, 26); c.fill();
            c.font = SANS(44, 900); c.fillStyle = fg; c.textAlign = "center"; c.fillText(title, x + 220, 470);
            c.font = SANS(38, 700); items.forEach((t, q) => c.fillText(t, x + 220, 560 + q * 80));
            c.font = SANS(34, 900); c.fillText(tagT, x + 220, 1210); c.restore();
          };
          col(70, "PAPER", ["sums, GST", "reorder list", "offer messages", "replies"], "#dcfce7", "#14532d", k1, "AI drafts · he checks");
          col(570, "HANDS & PEOPLE", ["the sacks", "deliveries", "who pays late", "the supplier"], "#fee2e2", "#7f1d1d", k2, "his");
        } else if (b.shot === "ilo") {
          dark(c, W, H, "WORLDWIDE (ILO, MAY 2025)", ["generative AI and jobs"], "#c7d2fe");
          const k1 = seg(f, ln.from + 4, ln.from + 12), k2 = seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            for (let q = 0; q < 4; q++) { const x = 170 + q * 200; c.fillStyle = q === 0 ? "#f59e0b" : "#475569"; c.beginPath(); c.arc(x + 50, 560, 46, 0, 7); c.fill(); rrect(c, x, 620, 100, 160, 30); c.fill(); }
            c.font = SANS(54, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("1 job in 4: some AI exposure", W / 2, 880);
            c.font = SANS(40, 700); c.fillStyle = "#e2e8f0"; c.fillText("3.3%: the highest exposure", W / 2, 950);
            c.restore();
          }
          stamp(c, "MOST WILL CHANGE, NOT VANISH", W / 2, 1110, GREEN, k2, 46, -0.03);
          c.save(); c.globalAlpha = k1; c.font = SANS(30, 700); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText("potential exposure, not job losses · ILO Working Paper 140", W / 2, 1250); c.restore();
        } else if (b.shot === "clerks") {
          dark(c, W, H, "THE MOST EXPOSED: CLERICAL JOBS", ["(ILO, May 2025)"], "#fca5a5");
          const k1 = seg(f, ln.from + 2, ln.from + 10);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            ["data entry", "typing and filing", "billing desks"].forEach((t, q) => { c.fillStyle = "#1e293b"; rrect(c, 160, 470 + q * 130, W - 320, 106, 20); c.fill(); c.font = SANS(46, 800); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, W / 2, 540 + q * 130); });
            c.restore();
          }
          tag(c, "a job that's ALL paper changes the most", W / 2, 950, 46, "#fde68a", INK, -0.02, seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["worried", "rest"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          const [sm, sa] = loopOn ? (["shock", "up"] as [BillMood, BillArms]) : SURESH[n] ?? ["worried", "rest"];
          person(c, "suresh" as BillWho, [190, 1150], 0.85, sm, sa, b.who === "suresh" && talking, r);
          if (hookOn || n <= 2) sack(c, 300, 1000, 0.62);
          c.restore();
          if (hookOn) hookCard(c);
          if (n === 1 && !loopOn) chip(c, "Suresh and the shop are made up · the test is real", W / 2, 470, "rgba(15,23,42,0.85)", "#f8fafc", 1, 30);
          if (b.prop === "rule") {
            const k0 = seg(p, 0.0, 0.08);
            if (k0 > 0) {
              c.save(); c.globalAlpha = clamp(k0 * 3);
              c.fillStyle = "rgba(15,23,42,0.94)"; rrect(c, 60, 240, W - 120, 900, 30); c.fill();
              c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("AI TAKES TASKS, NOT JOBS", W / 2, 330);
              c.restore();
            }
            ([["AI: drafts and sums", "#dcfce7", ln.from + 4], ["You: check, then send", "#e0e7ff", ln.from + 16], ["Hands and people: yours", "#fde68a", cu(1, 0.45)], ["Learn the tool", "#f8fafc", cu(1, 0.45) + 16]] as [string, string, number][]).forEach(([a, bg, t0], q) => {
              const k = seg(f, t0, t0 + 8); if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3); const y = 400 + q * 180;
              c.fillStyle = bg; rrect(c, 110, y, W - 220, 150, 22); c.fill();
              c.font = SANS(54, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a, W / 2, y + 95);
              c.restore();
            });
          }
          if (b.prop === "loop" && !loopOn) chip(c, "₹15,000 a month", 300, 560, "#4ade80", "#052e16", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 52);
        }
      }} />
    </>
  );
};

export const JOBS_SCENES = { sk_jobs: StJobs };
