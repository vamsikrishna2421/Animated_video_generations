import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";

// Creative 25 "Which wish did the AI write?" (series/scripts/creative25_which_wish.md): a one-question challenge, phone
// screens and one narrator (the format rotation: not a dialogue skit). Ammamma turns 80; Teja typed his wish for ten
// minutes, Sai tapped an AI once. Which is the AI's? B: it could be for any grandmother. Our test (series/scripts/
// creative25_demo: a small free AI, offline, ten tries each way, read by hand): with no details, nothing only her family
// would know; with two real details, it used them, and sometimes made up a memory. The rule: give it two real details,
// cut what isn't true, sign it yourself. The loop: "Ammamma replied to only one. Guess which." -> frame 1.
// The texts and numbers come from the spec (data.texts, data.nums), so the picture can't drift from the test.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626", WALLC = "#f3e8d2";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;

const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 24) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
const wrap = (c: Ctx, text: string, max: number) => {
  const out: string[] = []; let cur = "";
  text.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; });
  if (cur) out.push(cur);
  return out;
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
// a chat bubble with its text; `marks` are phrases to highlight (yellow marker) or circle (red)
const bubble = (c: Ctx, x: number, y: number, w: number, label: string, text: string, k: number, opt: { marks?: string[]; circles?: string[]; mk?: number; ck?: number; size?: number; markRgb?: string } = {}) => {
  if (k <= 0) return 0;
  const size = opt.size ?? 38, lh = size * 1.32;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const lines = wrap(c, text, w - 60);
  const h = 70 + lines.length * lh + 20;
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, h, 22); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.08)"; c.lineWidth = 3; rrect(c, x, y, w, h, 22); c.stroke();
  c.fillStyle = "#0f766e"; c.font = SANS(34, 900); c.textAlign = "left"; c.fillText(label, x + 28, y + 50);
  c.font = SANS(size, 600);
  lines.forEach((ln, i) => {
    const ty = y + 70 + (i + 1) * lh - size * 0.32;
    (opt.marks ?? []).forEach((m) => {   // a highlighter stroke under every stock phrase in this line
      const at = ln.toLowerCase().indexOf(m.toLowerCase()); if (at < 0 || !opt.mk) return;
      const x0 = x + 30 + c.measureText(ln.slice(0, at)).width, wd = c.measureText(ln.slice(at, at + m.length)).width;
      c.fillStyle = `rgba(${opt.markRgb ?? "250,204,21"},${0.55 * clamp(opt.mk * 2)})`; c.fillRect(x0 - 4, ty - size * 0.9, (wd + 8) * clamp(opt.mk * 2), size * 1.15);
    });
    (opt.circles ?? []).forEach((m) => {   // a red ring round every real detail in this line
      const at = ln.toLowerCase().indexOf(m.toLowerCase()); if (at < 0 || !opt.ck) return;
      const x0 = x + 30 + c.measureText(ln.slice(0, at)).width, wd = c.measureText(ln.slice(at, at + m.length)).width;
      c.strokeStyle = GREEN; c.lineWidth = 6; c.beginPath(); c.ellipse(x0 + wd / 2, ty - size * 0.3, wd / 2 + 16, size * 0.75, 0, 0, 7 * clamp(opt.ck * 1.5)); c.stroke();
    });
    c.fillStyle = INK; c.fillText(ln, x + 30, ty);
  });
  c.restore();
  return h;
};
const phoneTop = (c: Ctx, W: number) => {   // the family group's header
  c.fillStyle = "#075e54"; c.fillRect(0, 232, W, 120);   // stills: below the channel label and the progress bar
  c.fillStyle = "#fde68a"; c.beginPath(); c.arc(100, 292, 42, 0, 7); c.fill();
  c.font = SANS(44, 900); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("80", 100, 308);
  c.font = SANS(42, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Grandma turns 80 · family", 165, 286);
  c.font = SANS(30, 600); c.fillText("Teja, Sai, Grandma + 23 others", 165, 328);
};
const block = (c: Ctx, x: number, y: number, small: string, big: string, col: string) => {
  c.fillStyle = "#111827"; rrect(c, x, y, 470, 150, 22); c.fill();
  const f1 = fit(c, small, 430, 34, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, y + 50);
  const fs = fit(c, big, 430, 64); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, y + 120);
};

// ---------- the scene ----------
const StGuess: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.texts as { a: string; b: string; of: string; aDetails: string[]; bDetails: string[]; bGuess: string[] };
  const N = s.data.nums as Record<string, string>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["test", "twist", "rule"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.4} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("p")} at={2} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("q")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "quiz") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={end - 2 + q * 20} src="audio/sfx_pop.wav" vol={0.5} />));
    if (b.prop === "reveal") sfx.push(<Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={at} src={CLAP} vol={0.45} />, <Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "tells") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3)} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.8} />);
    if (b.prop === "twist") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("c")} at={at} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  void te;
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(2525 + boil); void r;
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.prop === "test" || b.prop === "twist") {
          const tw = b.prop === "twist";
          dark(c, W, H, tw ? "WITH THE 2 REAL DETAILS" : "OUR TEST: A SMALL FREE AI", [tw ? "the same AI, 10 more tries" : "on our laptop, not ChatGPT · 10 tries, no details"], tw ? "#86efac" : "#fde68a");
          const rows: [string, string, string, number][] = tw
            ? [["used both details", N.both, GREEN, ln.from + 4], ["guessed \"I miss you\"", N.miss, RED, cu(1, 0.5)]]
            : [["said \"May this special day\"", N.stock, "#fbbf24", cu(1, 0.3)]];
          rows.forEach(([a, v, col, t0], q) => {
            const k = seg(f, t0 - 2, t0 + 6); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 470 + q * 190;
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 160, 22); c.fill();
            const fs = fit(c, a, W - 420, 46, 800); c.font = SANS(fs, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(a, 100, y + 98);
            c.font = SANS(70, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(v, W - 100, y + 106);
            c.restore();
          });
          if (!tw) {   // a real reply from our test (try 6), its first line
            const ko = seg(f, cu(1, 0.65), cu(1, 0.65) + 8);
            if (ko > 0) { c.save(); c.globalAlpha = clamp(ko * 3); c.font = SANS(34, 800); c.fillStyle = "#fca5a5"; c.textAlign = "center"; c.fillText("one reply began:", W / 2, 740); c.restore(); }
            bubble(c, 90, 770, W - 180, "AI", T.of, ko, { size: 40, marks: ["Of course!"], mk: ko, markRgb: "248,113,113" });
            chip(c, "Qwen2.5 7B, offline · every reply read by hand", W / 2, 1300, "#fde68a", INK, seg(f, ln.from + 4, ln.from + 12), 32);
          }
        } else if (b.prop === "rule") {
          dark(c, W, H, "BEFORE YOU SEND AN AI WISH", [], "#fde68a");
          ([["Tell it the facts that matter", "#dcfce7", ln.from + 2], ["Read every line", "#e0e7ff", cu(1, 0.3)], ["Fix what isn't true", "#fee2e2", cu(1, 0.7)]] as [string, string, number][]).forEach(([a, bg, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 450 + q * 230;
            c.fillStyle = bg; rrect(c, 80, y, W - 160, 190, 24); c.fill();
            const fs = fit(c, a, W - 220, 60, 900); c.font = SANS(fs, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a, W / 2, y + 116);
            c.restore();
          });
        } else {
          // ---------- the family group ----------
          c.fillStyle = "#e5ddd5"; c.fillRect(0, 0, W, H);
          phoneTop(c, W);
          const hookOn = b.prop === "hook" || loopOn;
          if (hookOn || b.prop === "quiz") {   // frame 1: who wrote what, sound-off readable
            block(c, 50, 372, "ONE GRANDSON TYPED", "10 minutes", "#4ade80");
            block(c, 560, 372, "ONE ASKED AN AI", "1 tap", "#f87171");
          }
          const y0 = hookOn || b.prop === "quiz" ? 545 : 380;
          const reveal = ["reveal", "tells"].includes(b.prop);
          const ha = bubble(c, 50, y0, W - 100, reveal ? "1 · Teja" : "1", T.a, 1, { size: 38 });
          const kGuess = b.prop === "reveal" ? seg(f, cu(1, 0.2), cu(1, 0.2) + 10) : b.prop === "tells" ? seg(f, cu(1, 0.3), cu(1, 0.3) + 12) : 0;
          const hb = bubble(c, 50, y0 + ha + 30, W - 100, reveal ? "2 · Sai's AI" : "2", T.b, 1, {
            circles: b.prop === "tells" ? T.bDetails : [], ck: b.prop === "tells" ? seg(f, ln.from + 2, ln.from + 16) : 0,
            marks: b.prop === "reveal" ? ["miss you dearly"] : b.prop === "tells" ? T.bGuess : [], mk: kGuess, markRgb: "248,113,113", size: 38 });
          if (hookOn) chip(c, "both grandsons live next door · ONE IS AI. WHICH?", W / 2, Math.min(1480, y0 + ha + hb + 110), "#fde68a", INK, 1, 40);
          if (b.prop === "quiz") {   // 3, 2, 1 in the hold
            const t0 = endL - 2; const q = Math.floor((f - t0) / 20);
            if (f >= t0 && q < 3) { c.save(); c.font = SANS(200, 900); c.fillStyle = "rgba(220,38,38,0.9)"; c.textAlign = "center"; c.fillText(String(3 - q), W / 2, Math.min(1560, y0 + ha + hb + 250)); c.restore(); }
            chip(c, "1 or 2?", W / 2, Math.min(1480, y0 + ha + hb + 90), "#fde68a", INK, 1, 52);
          }
          if (reveal) {
            stamp(c, "AI", W - 170, y0 + ha + 80, RED, b.prop === "reveal" ? seg(f, ln.from, ln.from + 8) : 1, 90, -0.12);
            if (b.prop === "reveal") chip(c, "he lives next door", W / 2, Math.min(1480, y0 + ha + hb + 100), "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.6), cu(1, 0.6) + 8), 44);
            if (b.prop === "tells") { chip(c, "real details", 300, Math.min(1480, y0 + ha + hb + 100), "#dcfce7", "#14532d", seg(f, ln.from + 6, ln.from + 14), 40); chip(c, "guesses", 780, Math.min(1480, y0 + ha + hb + 100), "#fee2e2", "#7f1d1d", kGuess, 40); }
          }
          if (b.prop === "fixed") {   // the AI's wish with the two details, from our test
            chip(c, "the same AI, given 2 real details:", W / 2, y0 + ha + hb + 80, "#dcfce7", "#14532d", 1, 34);
          }
          if (b.prop === "loop" && !loopOn) {   // Ammamma replies to one of them
            const kk = seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 6);
            if (kk > 0) bubble(c, 120, 1180, W - 170, "Grandma → Sai", "Miss me? You're 10 steps away. Come and eat! 😄", kk, { size: 42 });
          }
        }
      }} />
    </>
  );
};

export const GUESS_SCENES = { sk_guess: StGuess };
