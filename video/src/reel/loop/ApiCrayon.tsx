import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// EP50 "Your first AI API call" (series/scripts/ep50_first_api_call.md): Suresh built the shop's WhatsApp AI and posted a
// photo of his code, API key and all, in a help group; the month's bill is ₹8,600 against the ₹47 he promised. An API
// call: the app sends the message and the key to the AI company's computer, which answers and bills the key's owner. Our
// test (series/scripts/ep50_demo): a key-locked AI server on our own computer: no key 401, one letter wrong 401, the right
// key 200 in about 2 s; 20 shop questions, 20 right; about 3 paise a reply at gpt-5.4-mini's price, ₹47 a month at 50 a
// day. The rule: the key is your ATM PIN: a locked setting the app reads, never in code, a photo or a chat; a hard spend
// limit; leaked? delete it, make a new one. The twist: Ravi keeps the new key "safe" in the family WhatsApp group.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai" | "suresh"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.4, x: 480, y: 740 }, suresh: { z: 1.35, x: 300, y: 860 }, ai: { z: 1.8, x: 760, y: 860 }, hook: { z: 0.9, x: 540, y: 860 },
};
const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "Courier New", monospace`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["shock", "up"], 2: ["sus", "fold"], 4: ["confused", "rest"], 6: ["sus", "rest"], 10: ["happy", "up"], 13: ["worried", "rest"], 15: ["happy", "thumb"],
};
const SURESH: Record<number, [BillMood, BillArms]> = {
  1: ["worried", "rest"], 2: ["worried", "rest"], 4: ["worried", "rest"], 8: ["worried", "rest"], 10: ["smug", "rest"], 11: ["worried", "five"], 15: ["shock", "up"],
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
const hookCard = (c: Ctx) => {
  block(c, 50, "EXPECTED", "₹47/month", "#4ade80");
  block(c, 560, "THE BILL", "₹8,600", "#f87171");
};
// Suresh's laptop on the counter (world space)
const laptop = (c: Ctx, x: number, y: number, s: number, glow: boolean) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#334155"; rrect(c, -120, -150, 240, 150, 12); c.fill();
  c.fillStyle = glow ? "#0b1220" : "#1e293b"; rrect(c, -108, -140, 216, 128, 8); c.fill();
  if (glow) { c.font = MONO(18, 700); c.fillStyle = "#86efac"; ["reply = ai.ask(", "  msg, key=KEY)", "send(reply)"].forEach((t, i) => c.fillText(t, -96, -108 + i * 26)); }
  c.fillStyle = "#475569"; c.beginPath(); c.moveTo(-150, 0); c.lineTo(150, 0); c.lineTo(130, 22); c.lineTo(-130, 22); c.closePath(); c.fill();
  c.restore();
};
// the photo of Suresh's code, as it went to the group, with the key in it
const codePhoto = (c: Ctx, x: number, y: number, w: number, circle: number) => {
  c.save(); c.fillStyle = "#0b1220"; rrect(c, x, y, w, 300, 16); c.fill();
  c.font = MONO(30, 700); c.textAlign = "left";
  const rows: [string, string][] = [["# shop WhatsApp bot", "#64748b"], ["from ai_sdk import Client", "#93c5fd"], ['KEY = "sk-proj-7f3b...9c2a"', "#fde68a"], ["client = Client(KEY)", "#e2e8f0"], ["reply = client.ask(msg)", "#e2e8f0"]];
  rows.forEach(([t, col], i) => { c.fillStyle = col; c.fillText(t, x + 28, y + 56 + i * 50); });
  if (circle > 0) { c.strokeStyle = RED; c.lineWidth = 8; c.globalAlpha = clamp(circle * 3); c.beginPath(); c.ellipse(x + 330, y + 145, 300, 40, 0, 0, 7 * clamp(circle * 1.5)); c.stroke(); }
  c.restore();
};
const bubble = (c: Ctx, x: number, y: number, w: number, h: number, mine: boolean, k: number) => {
  if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = mine ? "#dcf8c6" : "#ffffff"; rrect(c, x, y, w, h, 18); c.fill(); c.restore();
};

// ---------- the scene ----------
const StApi: React.FC<SP> = ({ s }) => {
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
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.5} />, <Sfx key={k("m")} at={2} src="audio/sfx_chaching.wav" vol={0.35} />, <Sfx key={k("h")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "leak") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("z")} at={cue(i, 1, 0.4)} src="reel/sfx_buzz.wav" vol={0.28} />, <Sfx key={k("m")} at={cue(i, 1, 0.4) + 8} src="audio/sfx_chaching.wav" vol={0.3} />);
    if (b.prop === "call") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("t")} at={cue(i, 1, 0.4) + 18} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "doors") { [0.2, 0.46].forEach((q, j) => sfx.push(<Sfx key={k("x" + j)} at={l.from + Math.round(l.frames * q)} src="reel/sfx_buzz.wav" vol={0.42} />, <Sfx key={k("y" + j)} at={l.from + Math.round(l.frames * q)} src="audio/sfx_pop.wav" vol={0.3} />)); sfx.push(<Sfx key={k("r")} at={Math.max(0, cue(i, 1, 0.7) - 30)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("d")} at={cue(i, 1, 0.7)} src="audio/gag_ding.wav" vol={0.5} />, <Sfx key={k("n")} at={cue(i, 1, 0.7) - 2} src="reel/sfx_boom.wav" vol={0.85} />); }
    if (b.prop === "cost") sfx.push(<Sfx key={k("n")} at={at + 2} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("c")} at={at + 2} src={CLAP} vol={0.35} />, <Sfx key={k("m")} at={cue(i, 1, 0.5)} src="audio/sfx_chaching.wav" vol={0.45} />);
    if (b.prop === "pin") sfx.push(<Sfx key={k("c")} at={at + 4} src={CLAP} vol={0.35} />);
    if (b.prop === "quiz") sfx.push(<Sfx key={k("q")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "answer") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 12)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 14)} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("s")} at={cue(i, 1, 0.5) + 2} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("t")} at={cue(i, 1, 0.5) + 2} src={CLAP} vol={0.45} />, <Sfx key={k("d")} at={end - 2} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(5050 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "leak") {
          // the help group: Suresh's photo of his code, the key circled; then a stranger's usage climbing
          c.fillStyle = "#e5ddd5"; c.fillRect(0, 0, W, H);
          c.fillStyle = "#075e54"; c.fillRect(0, 200, W, 120);   // stills: the episode banner covered the group's name
          c.font = SANS(44, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Python Help Group", 60, 262);
          c.font = SANS(30, 600); c.fillText("1,204 members", 60, 302);
          const k1 = seg(f, ln.from - 4, ln.from + 6);
          bubble(c, 120, 340, W - 180, 470, true, k1);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); codePhoto(c, 150, 370, W - 240, seg(f, ln.from + 8, ln.from + 22));
            c.font = SANS(36, 700); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Suresh: why is my bot slow?", 150, 730); c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.fillText("seen by 1,204", 150, 780); c.restore();
          }
          const k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.fillStyle = "#111827"; rrect(c, 60, 860, W - 120, 470, 24); c.fill();
            c.font = SANS(40, 900); c.fillStyle = "#fca5a5"; c.textAlign = "center"; c.fillText("SOMEONE ELSE, USING THE KEY", W / 2, 930);
            const amt = Math.round(47 + (8600 - 47) * easeOut(seg(f, cu(1, 0.4) + 6, cu(1, 0.4) + 40)));
            c.font = SANS(150, 900); c.fillStyle = "#f87171"; c.fillText(`₹${amt.toLocaleString("en-IN")}`, W / 2, 1120);
            c.font = SANS(36, 700); c.fillStyle = "#cbd5e1"; c.fillText("billed to Ravi's card", W / 2, 1200); c.fillText("(the story is made up · the risk is real)", W / 2, 1270);
            c.restore();
          }
        } else if (b.shot === "call") {   // script review: the key lives on the shop's laptop, not in a phone app
          dark(c, W, H, "ONE API CALL", ["what happens on every reply"]);
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 10), k3 = seg(f, cu(1, 0.4) + 16, cu(1, 0.4) + 26);
          if (k1 > 0) {   // the customer's WhatsApp message reaches the shop laptop, where the key lives
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.fillStyle = "#dcf8c6"; rrect(c, 50, 450, 340, 150, 18); c.fill(); c.font = SANS(34, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText("customer:", 220, 505); c.fillText("\"sugar 1 kg rate?\"", 220, 565);
            c.fillStyle = "#334155"; rrect(c, 80, 660, 260, 170, 14); c.fill(); c.fillStyle = "#0b1220"; rrect(c, 96, 674, 228, 130, 8); c.fill();
            c.font = SANS(32, 900); c.fillStyle = "#86efac"; c.fillText("SHOP LAPTOP", 210, 722); c.fillStyle = "#fde68a"; c.fillText("KEY HERE", 210, 776);
            c.fillStyle = "#475569"; rrect(c, 60, 830, 300, 22, 8); c.fill();
            c.restore();
          }
          if (k2 > 0) {   // the envelope: message + key -> the AI company's computer
            const x = 380 + 220 * easeOut(k2);
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.fillStyle = "#fde68a"; rrect(c, x, 620, 200, 130, 14); c.fill(); c.font = SANS(28, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("message", x + 100, 670); c.fillStyle = RED; c.fillText("+ KEY", x + 100, 720);
            c.fillStyle = "#334155"; rrect(c, 820, 470, 190, 520, 20); c.fill();
            for (let q = 0; q < 6; q++) { c.fillStyle = q % 2 ? "#22c55e" : "#38bdf8"; c.beginPath(); c.arc(856, 530 + q * 70, 8, 0, 7); c.fill(); }
            c.font = SANS(26, 900); c.fillStyle = "#f8fafc"; c.fillText("AI COMPANY", 915, 1030); c.fillText("COMPUTER", 915, 1066);
            c.restore();
          }
          if (k3 > 0) {   // the reply comes back; the bill goes to the key's owner
            c.save(); c.globalAlpha = clamp(k3 * 3);
            c.fillStyle = "#dcfce7"; rrect(c, 300, 880, 480, 110, 14); c.fill(); c.font = SANS(34, 800); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText("reply: ₹48, in stock", 540, 948);
            c.fillStyle = "#fee2e2"; rrect(c, 170, 1110, W - 340, 150, 20); c.fill(); c.font = SANS(44, 900); c.fillStyle = "#7f1d1d"; c.fillText("BILLED TO: whoever owns the key", W / 2, 1205);
            c.restore();
          }
        } else if (b.shot === "doors") {
          dark(c, W, H, "OUR TEST: OUR OWN AI, LOCKED WITH A KEY", ["on our own computer · the same kind of call"]);
          const rows: [string, string, string, number][] = [
            ["no key", "401 · REFUSED", RED, ln.from + Math.round(ln.frames * 0.2)],
            ["one letter wrong", "401 · REFUSED", RED, ln.from + Math.round(ln.frames * 0.46)],
            ["the right key", "200 · ANSWERED", GREEN, cu(1, 0.7)],
          ];
          rows.forEach(([a, v, col, t0], q) => {
            const k = seg(f, t0 - 2, t0 + 6); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 470 + q * 190;
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 160, 22); c.fill();
            c.font = SANS(46, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(a, 100, y + 98);
            c.font = SANS(50, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(v, W - 100, y + 100);
            c.restore();
          });
          const kr = seg(f, cu(1, 0.7) + 6, cu(1, 0.7) + 14);
          if (kr > 0) { c.save(); c.globalAlpha = clamp(kr * 3); c.fillStyle = "#dcf8c6"; rrect(c, 120, 1060, W - 240, 120, 18); c.fill(); c.font = SANS(46, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText("toor dal 1 kg: \"₹165 (in stock)\"", W / 2, 1136); c.restore(); }
          chip(c, "20 shop questions: 20 right answers", W / 2, 1290, "#fde68a", INK, kr, 36);
        } else if (b.shot === "cost") {
          dark(c, W, H, "WHAT ONE REPLY COSTS", ["about 400 tokens in, 7 out"], "#86efac");
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(1, 0.5), cu(1, 0.5) + 10);
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(k1 * 3); c.font = SANS(180, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("3.1 paise", W / 2, 700); c.restore(); }
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3); c.font = SANS(52, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("× 50 replies a day × 30 days", W / 2, 860);
            c.font = SANS(150, 900); c.fillStyle = "#4ade80"; c.fillText("≈ ₹47", W / 2, 1050); c.font = SANS(52, 800); c.fillText("a month", W / 2, 1130); c.restore();
          }
          c.save(); c.globalAlpha = k1; c.font = SANS(38, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("a small OpenAI model's published price", W / 2, 1260); c.fillText("₹95 a dollar · cheaper models cost less", W / 2, 1320); c.restore();
        } else if (b.shot === "quiz") {
          dark(c, W, H, "WHERE SHOULD THE KEY LIVE?", [b.prop === "quiz" ? "you decide" : ""], "#fde68a");
          const opts: [string, string][] = [["A", "in the code"], ["B", "in a group chat"], ["C", "a locked setting"]];   // script review: short, held ~3 s
          const kAns = b.prop === "answer" ? seg(f, ln.from, ln.from + 8) : 0;
          opts.forEach(([L, t], q) => {
            const t0 = b.prop === "quiz" ? ln.from + 4 + q * 5 : -100; const k = b.prop === "quiz" ? seg(f, t0, t0 + 6) : 1; if (k <= 0) return;
            const right = q === 2, y = 470 + q * 200;
            c.save(); c.globalAlpha = clamp(k * 3) * (kAns > 0 && !right ? 1 - 0.6 * kAns : 1);
            c.fillStyle = kAns > 0 && right ? "#14532d" : "#1e293b"; rrect(c, 70, y, W - 140, 160, 24); c.fill();
            c.font = SANS(64, 900); c.fillStyle = kAns > 0 && right ? "#86efac" : "#fde68a"; c.textAlign = "left"; c.fillText(L, 110, y + 104);
            const fs = fit(c, t, W - 330, 46, 800); c.font = SANS(fs, 800); c.fillStyle = "#f8fafc"; c.fillText(t, 200, y + 100);
            if (kAns > 0 && !right) { c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.moveTo(190, y + 82); c.lineTo(W - 110, y + 82); c.stroke(); }
            c.restore();
          });
          if (kAns > 0) chip(c, "an \"environment variable\" · never commit it", W / 2, 1210, "#dcfce7", "#14532d", kAns, 40);
          if (b.prop === "answer") { const kn = seg(f, cu(1, 0.4), cu(1, 0.4) + 8); chip(c, "never in code, a photo or a chat", W / 2, 1330, "#fee2e2", "#7f1d1d", kn, 40); }
        } else if (b.prop === "rule") {
          dark(c, W, H, "THE API KEY = YOUR ATM PIN", [], "#fde68a");
          ([["The bill: ask support (no promise)", "#fef3c7", ln.from + 2], ["Delete the key, make another", "#fee2e2", cu(1, 0.3)], ["A hard spend limit, not just an alert", "#e0e7ff", cu(1, 0.7)]] as [string, string, number][]).forEach(([a, bg, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 450 + q * 230;
            c.fillStyle = bg; rrect(c, 80, y, W - 160, 190, 24); c.fill();
            const fs = fit(c, a, W - 220, 56, 900); c.font = SANS(fs, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a, W / 2, y + 116);
            c.restore();
          });
          const kl = seg(f, cu(1, 0.7) + 10, cu(1, 0.7) + 18);
          c.save(); c.globalAlpha = kl; c.font = SANS(38, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("alerts only warn · a limit can run a little over", W / 2, 1250); c.restore();
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
          const [mood, armPose] = loopOn ? (["shock", "up"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          laptop(c, 380, 1010, 0.9, true);
          phone(c, b.who === "ai" && talking, f, r, {});
          const [sm, sa] = loopOn ? (["worried", "rest"] as [BillMood, BillArms]) : SURESH[n] ?? ["worried", "rest"];
          person(c, "suresh" as BillWho, [190, 1150], 0.85, sm, sa, b.who === "suresh" && talking, r);
          c.restore();
          if (hookOn) {
            hookCard(c);
            chip(c, "SURESH", 230, 790, "#b45309", "#fff", 1, 34);
            chip(c, "RAVI ANNA", 760, 560, "#2f6fb0", "#fff", 1, 34);
            chip(c, "its API KEY leaked in a photo", W / 2, 474, "#fde68a", INK, 1, 42);
          }
          if (n === 2) chip(c, "Ravi, Suresh and the shop are made up · our test is real", W / 2, 1380, "rgba(15,23,42,0.88)", "#f8fafc", 1, 32);
          if (b.prop === "pin") stamp(c, "API KEY = ATM PIN", W / 2, 360, "#2563eb", seg(f, ln.from + 2, ln.from + 10), 76, -0.06);
          if (b.prop === "loop" && !loopOn) {   // Ravi types the new key into the family group
            const kk = seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6);
            if (kk > 0) {
              c.save(); c.globalAlpha = clamp(kk * 3);
              c.fillStyle = "#075e54"; rrect(c, 120, 200, W - 240, 90, 18); c.fill(); c.font = SANS(40, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Family ❤ (38 members)", 160, 260);
              c.fillStyle = "#dcf8c6"; rrect(c, 160, 310, W - 280, 110, 18); c.fill(); c.font = MONO(34, 700); c.fillStyle = INK; c.fillText("NEW KEY: sk-proj-a91c...", 190, 380);
              c.restore();
            }
          }
        }
      }} />
    </>
  );
};

export const API_SCENES = { sk_api: StApi };
