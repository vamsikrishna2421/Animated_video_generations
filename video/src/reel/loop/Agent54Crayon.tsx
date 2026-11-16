import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg, chat } from "./TutorialCrayon";

// EP54 "Build an AI Agent with Tools" (series/scripts/ep54_agent_tools.md): a screen tutorial, one narrator. A made-up
// shop's bot told a customer "your refund of Rs 1,299 has been processed"; the shop's record: not started (₹0). Give it
// one tool: describe get_order; the AI replies with one JSON line; your code looks the order up and sends the result
// back; it answers from the record. Our test: no tool 10/10 answered without checking, 6 wrong; one tool 10/10 looked
// up, 10/10 right. One code line per step on screen (EP52's code middle lost everyone); the full code in the pinned
// comment. The texts come from the spec (data.t), copied from series/scripts/ep54_demo/agent.json.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const GREEN = "#4ade80";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "DejaVu Sans Mono", Menlo, monospace`;
const big = (c: Ctx, t: string, size: number) => fit(c, t, 1000, size, 800);

const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = RED, rot = -0.06) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  c.font = SANS(fit(c, t, 960, 52, 900), 900); const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -52, w, 82, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 7; rrect(c, -w / 2, -52, w, 82, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 8); c.restore();
};
// one big code line on a dark card, typed in
const codeCard = (c: Ctx, y: number, code: string, k: number, label: string) => {
  c.save();
  c.font = MONO(36, 700); const lines = wrap(c, code.replace(/ /g, " ").replace(/, /g, ", ").replace(/ /g, " "), 920);
  const h = 70 + lines.length * 52 + 26;
  c.fillStyle = "#1e1e2e"; rrect(c, 40, y, 1000, h, 18); c.fill();
  c.fillStyle = "#313244"; rrect(c, 40, y, 1000, 50, 18); c.fill();
  c.font = SANS(26, 800); c.fillStyle = "#cdd6f4"; c.textAlign = "left"; c.fillText(label, 70, y + 34);
  const total = lines.reduce((a, l) => a + l.length, 0); let left = Math.floor(total * clamp(k));
  lines.forEach((l, i) => {
    const t = l.slice(0, Math.max(0, left)); left -= l.length;
    c.font = MONO(36, 700); c.fillStyle = "#f9e2af"; c.fillText(t, 70, y + 104 + i * 52);
  });
  c.restore();
  return y + h;
};
// a trace box (what went back and forth), small mono text
const traceBox = (c: Ctx, y: number, title: string, lines: string[], col: string, k: number) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = MONO(28, 700); const ws = lines.flatMap((l) => wrap(c, l, 900));
  const h = 56 + ws.length * 40 + 18;
  c.fillStyle = "#0f172a"; rrect(c, 40, y, 1000, h, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 4; rrect(c, 40, y, 1000, h, 16); c.stroke();
  c.font = SANS(26, 900); c.fillStyle = col; c.textAlign = "left"; c.fillText(title, 64, y + 38);
  c.font = MONO(28, 700); c.fillStyle = "#e2e8f0"; ws.forEach((t, i) => c.fillText(t, 64, y + 84 + i * 40));
  c.restore();
  return y + h;
};
const arrowDown = (c: Ctx, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.strokeStyle = "#94a3b8"; c.fillStyle = "#94a3b8"; c.lineWidth = 6;
  c.beginPath(); c.moveTo(540, y); c.lineTo(540, y + 34); c.stroke();
  c.beginPath(); c.moveTo(522, y + 30); c.lineTo(558, y + 30); c.lineTo(540, y + 50); c.closePath(); c.fill(); c.restore();
};

const StAgent: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["title", "test", "rule"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.45} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("z")} at={cue(i, 1, 0.4) + 6} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "why") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) + 4} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (["step1", "step2", "step3"].includes(b.prop)) sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("t")} at={cue(i, 1, 0.5)} src="audio/sfx_whoosh.wav" vol={0.35} />);
    if (b.prop === "step3") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) + 10} src="audio/gag_ding.wav" vol={0.45} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.4) + 20} src="reel/sfx_buzz.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 2, 0.6) - 2} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={cue(i, 2, 0.6)} src={CLAP} vol={0.4} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3) + 4} src="audio/gag_ding.wav" vol={0.5} />, <Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(5454 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        if (P === "hook" || P === "why") {
          block(c, 50, 250, "THE BOT SAID: REFUNDED", "₹1,299", "#f87171");
          block(c, 560, 250, "THE SHOP'S RECORD", "₹0", "#fbbf24");   // script review: a green ₹0 read as good news
          chip(c, "refund not started", 795, 470, "#fef3c7", "#78350f", P === "why" || loopOn ? 1 : seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 34);
          chip(c, "asked: has my ₹1,299 refund for order 4417 come?", W / 2, 560, "#1e293b", "#cbd5e1", 1, 32);   // script review: one bubble
          const y = chat(c, 50, 610, W - 100, T.shop, [{ me: false, t: T.plain, k: 1, red: true, sz: 40 }], 40);
          if (P === "hook") chip(c, "a made-up shop · a small free AI · a real test", W / 2, y + 60, "#1e293b", "#cbd5e1", 1, 36);
          if (P === "why") {
            stamp(c, "IT HAD NO WAY TO LOOK", W / 2, y + 80, seg(f, ln.from + 2, ln.from + 10));
            chip(c, "so it wrote the usual refund reply", W / 2, y + 210, "#1e293b", "#fde68a", seg(f, cu(1, 0.5), cu(1, 0.5) + 8), 44);
          }
        } else if (P === "title") {
          c.font = SANS(fit(c, "THE SIMPLEST AGENT", W - 120, 84), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("THE SIMPLEST AGENT", W / 2, 360);
          c.font = SANS(fit(c, "an AI that can ask your code to do one thing", W - 120, 44, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText("an AI that can ask your code to do one thing", W / 2, 430);
          const boxes: [string, number, number, string][] = [["AI", 300, 600, "#1e3a8a"], ["YOUR CODE", 780, 600, "#14532d"], ["SHOP'S SYSTEM", 780, 960, "#334155"], ["RESULT", 300, 960, "#713f12"]];
          const labels = ["one JSON line", "looks it up", "the record", "back to the AI"];
          boxes.forEach(([t, x, y, col], q) => {
            const k = seg(f, cu(1, 0.2) + q * 8, cu(1, 0.2) + q * 8 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = col; rrect(c, x - 200, y - 80, 400, 160, 24); c.fill();
            c.font = SANS(fit(c, t, 360, 46, 900), 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, x, y + 16);
            const [nx, ny] = [boxes[(q + 1) % 4][1], boxes[(q + 1) % 4][2]];
            c.strokeStyle = "#94a3b8"; c.lineWidth = 6; c.beginPath();
            const mx = (x + nx) / 2, my = (y + ny) / 2;
            if (ny === y) { c.moveTo(x + (nx > x ? 205 : -205), y); c.lineTo(nx + (nx > x ? -205 : 205), y); } else { c.moveTo(x, y + (ny > y ? 85 : -85)); c.lineTo(x, ny + (ny > y ? -85 : 85)); }
            c.stroke();
            c.font = SANS(30, 800); c.fillStyle = "#cbd5e1"; c.fillText(labels[q], mx + (ny === y ? 0 : (x > 540 ? 130 : -130)), my + (ny === y ? -100 : 10));
            c.restore();
          });
        } else if (P === "step1" || P === "step2" || P === "step3") {
          const label = P === "step1" ? "STEP 1 · describe the tool" : P === "step2" ? "STEP 2 · your code runs it" : "STEP 3 · send the result back";
          chip(c, label, W / 2, 300, "#fde68a", INK, 1, big(c, label, 44));
          const yC = codeCard(c, 360, T.code[P], seg(f, ln.from + 2, cu(1, 0.4)), "agent.py · one line");
          const kT = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
          if (P === "step1") {
            const y1 = traceBox(c, yC + 40, "THE AI ASKS (order 4417)", [T.call], "#93c5fd", kT);
            chip(c, "the AI only writes this line; it runs nothing", W / 2, y1 + 70, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.4) + 16, cu(1, 0.4) + 24), big(c, "the AI only writes this line; it runs nothing", 40));
          } else if (P === "step2") {   // script review: the code that ran (find the JSON line), and the beat it earned
            const kG = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
            if (kG <= 0) {
              const y1 = traceBox(c, yC + 30, "THE AI ASKED", [T.call], "#93c5fd", 1);
              arrowDown(c, y1 + 8, seg(f, ln.from + 20, ln.from + 28));
              traceBox(c, y1 + 64, "YOUR CODE FOUND, IN THE SHOP'S SYSTEM", T.result, GREEN, seg(f, ln.from + 20, ln.from + 28));
            } else {
              const y1 = traceBox(c, yC + 30, "ORDER 4388: THE AI WROTE", [T.guessCall, T.guess], "#fca5a5", kG);
              c.save(); c.globalAlpha = clamp(kG * 3); c.strokeStyle = "#dc2626"; c.lineWidth = 6;
              c.beginPath(); c.moveTo(60, y1 - 60); c.lineTo(1020, y1 - 30); c.stroke(); c.restore();   // the guess, struck out
              chip(c, T.guessReal, W / 2, y1 + 70, "#dcfce7", "#14532d", seg(f, cu(1, 0.4) + 12, cu(1, 0.4) + 20), big(c, T.guessReal, 38));
            }
          } else {
            const y1 = traceBox(c, yC + 30, "SENT BACK: THE RECORD", T.result.slice(2), GREEN, 1);
            arrowDown(c, y1 + 8, kT);
            const y2 = chat(c, 50, y1 + 64, W - 100, "the AI's answer now", [{ me: false, t: T.final, k: kT }], 36);
            chip(c, T.docs, W / 2, y2 + 50, "#e0e7ff", "#1e3a8a", seg(f, cu(1, 0.4) + 20, cu(1, 0.4) + 28), big(c, T.docs, 34));
          }
        } else if (P === "test") {
          c.font = SANS(fit(c, "OUR TEST · 10 CUSTOMERS", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · 10 CUSTOMERS", W / 2, 320);
          c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.fillText("a made-up shop · a small free AI on our computer", W / 2, 370);
          const k1 = seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 6);
          if (k1 > 0) {   // script review: two big examples, the rest counted
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.fillStyle = "#1e293b"; rrect(c, 40, 420, W - 80, 560, 22); c.fill();
            c.font = SANS(fit(c, "WITHOUT THE TOOL: 10 answers, no checking", 900, 44, 900), 900); c.fillStyle = "#fca5a5"; c.textAlign = "left";
            c.fillText("WITHOUT THE TOOL: 10 answers, no checking", 70, 485);
            (T.wrongBig as string[][]).forEach(([o, said, real], q) => {
              const kq = seg(f, cu(1, 0.4) + 10 + q * 8, cu(1, 0.4) + 16 + q * 8); if (kq <= 0) return;
              const y = 560 + q * 150;
              c.font = SANS(34, 800); c.fillStyle = "#94a3b8"; c.fillText(o, 70, y);
              c.font = SANS(fit(c, said, 900, 46, 900), 900); c.fillStyle = "#f87171"; c.fillText(said, 70, y + 56);
              c.font = SANS(36, 800); c.fillStyle = GREEN; c.fillText("the record: " + real, 70, y + 104);
            });
            const k3 = seg(f, cu(1, 0.4) + 30, cu(1, 0.4) + 36);
            if (k3 > 0) { c.font = SANS(fit(c, T.wrongMore, 900, 34, 800), 800); c.fillStyle = "#fde68a"; c.fillText(T.wrongMore, 70, 930); }
            c.restore();
          }
          const k2 = seg(f, cu(2, 0.6), cu(2, 0.6) + 8);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.fillStyle = "#14532d"; rrect(c, 40, 1010, W - 80, 200, 22); c.fill();
            c.font = SANS(fit(c, "WITH THE TOOL: 10 lookups", 900, 46, 900), 900); c.fillStyle = "#dcfce7"; c.textAlign = "center";
            c.fillText("WITH THE TOOL: 10 lookups", W / 2, 1090);
            c.font = SANS(64, 900); c.fillStyle = GREEN; c.fillText("10/10 right", W / 2, 1175);
            c.restore();
          }
        } else if (P === "rule") {
          const card = (y: number, top: string, sub: string, col: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 220, 22); c.fill();
            c.font = SANS(fit(c, top, W - 180, 48, 900), 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(top, W / 2, y + 85);
            c.font = SANS(fit(c, sub, W - 180, 40, 800), 800); c.fillStyle = "#f8fafc"; c.fillText(sub, W / 2, y + 160); c.restore();
          };
          card(340, "IF YOU BUILD ONE", "the AI asks · your code decides what runs", "#93c5fd", seg(f, ln.from + 2, ln.from + 10));
          card(620, "IF YOU USE ONE", "check the refund on the shop's own order page", GREEN, seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
          chip(c, "full code: in the pinned comment", W / 2, 960, "#fde68a", INK, seg(f, cu(1, 0.5) + 20, cu(1, 0.5) + 28), 44);
          chip(c, T.owner, W / 2, 1080, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.5) + 34, cu(1, 0.5) + 42), big(c, T.owner, 36));   // script review: the shop owner
        } else if (P === "loop") {
          c.font = SANS(fit(c, "NEXT · EP55: YOUR OWN MCP SERVER", W - 120, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("NEXT · EP55: YOUR OWN MCP SERVER", W / 2, 330);
          const kf = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          const y = chat(c, 50, 400, W - 100, T.shop + " · with the tool", [{ me: true, t: T.q, k: 1 }, { me: false, t: T.final, k: kf }], 36);
          chip(c, "₹0 so far · refund not started", W / 2, y + 70, "#dcfce7", "#14532d", seg(f, cu(1, 0.3) + 12, cu(1, 0.3) + 20), 50);
        }
      }} />
    </>
  );
};

export const AGENT54_SCENES = { sk_agent54: StAgent };
