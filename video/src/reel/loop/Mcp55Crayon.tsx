import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg, chat } from "./TutorialCrayon";

// EP55 "1 Right or 10? Build Your Own MCP Server" (series/scripts/ep55_mcp_server.md): a screen tutorial, one narrator.
// EP54's order tool moves into an MCP server (11 lines, the official Python SDK); the bot finds it with list_tools and
// calls it. Our test: the small AI sent the order number as a number, the server's schema said text and refused every
// call (1 of 10 right; the bot blamed the customer); the fix (accept a number or text, show the AI the types): 10 of 10;
// the second bot 7 of 10 (broken JSON); one change on the server reached the bot with no change to the bot. One code
// line per step (EP54's middle); the full code in the pinned comment. Texts from the spec (data.t), copied from
// series/scripts/ep55_demo/mcp.json and mcp_fix.json.
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
  c.font = SANS(fit(c, t, 960, 64, 900), 900); const w = c.measureText(t).width + 60;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -60, w, 94, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 8; rrect(c, -w / 2, -60, w, 94, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 10); c.restore();
};
// code on a dark card, typed in line by line; `hi` boxes one piece once it is typed
const codeCard = (c: Ctx, y: number, code: string[], k: number, label: string, hi?: string, kHi = 0, size = 34) => {
  c.save();
  c.font = MONO(size, 700);
  const lines = code.flatMap((l) => (c.measureText(l).width > 940 ? wrap(c, l, 940) : [l]));
  const lh = size * 1.5, h = 70 + lines.length * lh + 26;
  c.fillStyle = "#1e1e2e"; rrect(c, 40, y, 1000, h, 18); c.fill();
  c.fillStyle = "#313244"; rrect(c, 40, y, 1000, 50, 18); c.fill();
  c.font = SANS(26, 800); c.fillStyle = "#cdd6f4"; c.textAlign = "left"; c.fillText(label, 70, y + 34);
  const total = lines.reduce((a, l) => a + l.length, 0); let left = Math.floor(total * clamp(k));
  lines.forEach((l, i) => {
    const t = l.slice(0, Math.max(0, left)); left -= l.length;
    const yy = y + 100 + i * lh;
    c.font = MONO(size, 700);
    if (hi && kHi > 0 && t.length === l.length && l.includes(hi)) {
      const x0 = 70 + c.measureText(l.slice(0, l.indexOf(hi))).width, w = c.measureText(hi).width;
      c.save(); c.globalAlpha = clamp(kHi * 3); c.fillStyle = "rgba(74,222,128,0.28)"; rrect(c, x0 - 8, yy - size, w + 16, size * 1.35, 8); c.fill();
      c.strokeStyle = GREEN; c.lineWidth = 4; rrect(c, x0 - 8, yy - size, w + 16, size * 1.35, 8); c.stroke(); c.restore();
    }
    c.fillStyle = "#f9e2af"; c.fillText(t, 70, yy);
  });
  c.restore();
  return y + h;
};
// a trace box (what went back and forth); `hi` paints one piece in `hiCol`
const traceBox = (c: Ctx, y: number, title: string, lines: string[], col: string, k: number, hi?: string, hiCol = "#f87171") => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = MONO(32, 700); const ws = lines.flatMap((l) => wrap(c, l, 900));
  const h = 60 + ws.length * 46 + 18;
  c.fillStyle = "#0f172a"; rrect(c, 40, y, 1000, h, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 4; rrect(c, 40, y, 1000, h, 16); c.stroke();
  c.font = SANS(30, 900); c.fillStyle = col; c.textAlign = "left"; c.fillText(title, 64, y + 40);
  c.font = MONO(32, 700);
  ws.forEach((t, i) => {
    const yy = y + 92 + i * 46;
    c.fillStyle = "#e2e8f0"; c.fillText(t, 64, yy);
    if (hi && t.includes(hi)) { c.fillStyle = hiCol; c.fillText(hi, 64 + c.measureText(t.slice(0, t.indexOf(hi))).width, yy); }
  });
  c.restore();
  return y + h;
};
const arrowDown = (c: Ctx, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.strokeStyle = "#94a3b8"; c.fillStyle = "#94a3b8"; c.lineWidth = 6;
  c.beginPath(); c.moveTo(540, y); c.lineTo(540, y + 34); c.stroke();
  c.beginPath(); c.moveTo(522, y + 30); c.lineTo(558, y + 30); c.lineTo(540, y + 50); c.closePath(); c.fill(); c.restore();
};
const bigNum = (c: Ctx, t: string, x: number, y: number, col: string, k: number, size = 150, sub = "") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.textAlign = "center";
  c.font = SANS(size, 900); c.fillStyle = col; c.fillText(t, x, y);
  if (sub) { c.font = SANS(fit(c, sub, 480, 38, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(sub, x, y + 56); }
  c.restore();
};

const StMcp: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["what", "step1", "bug", "loop"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.45} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("z")} at={cue(i, 1, 0.3) + 30} src="reel/sfx_buzz.wav" vol={0.4} />,
      <Sfx key={k("b")} at={cue(i, 2, 0.75) - 2} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={cue(i, 2, 0.75)} src={CLAP} vol={0.4} />);
    if (b.prop === "what") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.4) + q * 8} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "who") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("q")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.4} />);
    if (["step1", "step2"].includes(b.prop)) sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />, <Sfx key={k("t")} at={cue(i, 1, 0.5)} src="audio/sfx_whoosh.wav" vol={0.35} />);
    if (b.prop === "bug") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("z")} at={cue(i, 2, 0.65) + 10} src="reel/sfx_buzz.wav" vol={0.45} />, <Sfx key={k("d")} at={cue(i, 3, 0.85)} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 1, 0.45) - 2} src="reel/sfx_boom.wav" vol={0.85} />,
      <Sfx key={k("d")} at={cue(i, 1, 0.45)} src="audio/gag_ding.wav" vol={0.5} />, <Sfx key={k("z")} at={cue(i, 2, 0.75) + 24} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "update") sfx.push(<Sfx key={k("s")} at={at + 16} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("p1")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("p2")} at={cue(i, 2, 0.55)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(5555 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        if (P === "hook") {
          const k2 = loopOn ? 1 : seg(f, cu(2, 0.75), cu(2, 0.75) + 6);
          block(c, 50, 250, "PLUGGED IN", "1/10 right", "#f87171");
          block(c, 560, 250, "AFTER FIXING THE INPUT", "10/10", GREEN);   // script review: it was not one word
          if (k2 > 0 && k2 < 1) { c.save(); c.globalAlpha = 0.5 * (1 - k2); c.strokeStyle = GREEN; c.lineWidth = 10; rrect(c, 556, 246, 478, 168, 24); c.stroke(); c.restore(); }
          const y = chat(c, 50, 450, W - 100, "Kiran Mobiles · WhatsApp bot + our server", [{ me: true, t: T.q, k: 1, sz: 34 }, { me: false, t: T.blame, k: 1, red: true, sz: 46 }], 40);
          chip(c, "the bot blamed the customer", W / 2, y + 50, "#fee2e2", "#7f1d1d", 1, 40);
          chip(c, "a made-up shop · a small free AI · our own test", W / 2, y + 150, "#1e293b", "#cbd5e1", 1, 34);
        } else if (P === "what") {
          c.font = SANS(fit(c, "MCP = A STANDARD PLUG FOR AI APPS", W - 100, 62), 900); c.fillStyle = "#fde68a"; c.textAlign = "center";
          c.fillText("MCP = A STANDARD PLUG FOR AI APPS", W / 2, 330);
          c.font = SANS(fit(c, "Model Context Protocol", W - 120, 40, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText("Model Context Protocol", W / 2, 390);
          c.fillStyle = "#14532d"; rrect(c, 240, 470, 600, 190, 26); c.fill();
          c.font = SANS(52, 900); c.fillStyle = "#f8fafc"; c.fillText("MCP SERVER", W / 2, 548);
          c.font = MONO(40, 700); c.fillStyle = "#bbf7d0"; c.fillText("get_order", W / 2, 618);
          const apps: [string, number][] = [["website bot", 190], ["WhatsApp bot", 540], ["other MCP apps", 890]];
          apps.forEach(([t, x], q) => {
            const k = seg(f, cu(1, 0.4) + q * 8, cu(1, 0.4) + q * 8 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.strokeStyle = "#94a3b8"; c.lineWidth = 7; c.beginPath(); c.moveTo(W / 2 + (q - 1) * 160, 660); c.bezierCurveTo(W / 2 + (q - 1) * 160, 760, x, 760, x, 860); c.stroke();
            c.fillStyle = "#1e3a8a"; rrect(c, x - 165, 860, 330, 150, 22); c.fill();
            c.font = SANS(fit(c, t, 300, 42, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(t, x, 948);
            c.restore();
          });
          chip(c, "write the tool once · every app can find it and use it", W / 2, 1110, "#fde68a", INK, seg(f, cu(1, 0.4) + 24, cu(1, 0.4) + 32), big(c, "write the tool once · every app can find it and use it", 40));
        } else if (P === "who") {
          const card = (y: number, who: string, what: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 230, 22); c.fill();
            c.font = SANS(64, 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText(who, W / 2, y + 95);
            c.font = SANS(fit(c, what, W - 180, 44, 800), 800); c.fillStyle = "#f8fafc"; c.fillText(what, W / 2, y + 170); c.restore();
          };
          c.font = SANS(fit(c, "WHO BACKS IT", W - 120, 64), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("WHO BACKS IT", W / 2, 340);
          const [a, o] = T.who as string[][];
          card(400, a[0], a[1], seg(f, ln.from + 2, ln.from + 10));
          card(680, o[0], o[1], seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
          chip(c, "an open standard: anyone can build a server", W / 2, 1020, "#1e293b", "#cbd5e1", seg(f, cu(1, 0.5) + 16, cu(1, 0.5) + 24), big(c, "an open standard: anyone can build a server", 38));
        } else if (P === "step1" || P === "step2") {
          const label = P === "step1" ? "STEP 1 · the server (12 lines)" : "STEP 2 · the bot asks: what tools?";
          chip(c, label, W / 2, 300, "#fde68a", INK, 1, big(c, label, 44));
          if (P === "step1") {
            const yC = codeCard(c, 360, T.server, seg(f, ln.from + 2, cu(1, 0.45)), "orders_server.py · the key lines", "order_id: str", seg(f, cu(1, 0.45) + 20, cu(1, 0.45) + 28), 32);
            chip(c, "one function · a one-line description · its input", W / 2, yC + 70, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.45), cu(1, 0.45) + 8), big(c, "one function · a one-line description · its input", 40));
            chip(c, "order_id: str = the order number, as text", W / 2, yC + 170, "#dcfce7", "#14532d", seg(f, cu(1, 0.45) + 20, cu(1, 0.45) + 28), big(c, "order_id: str = the order number, as text", 40));
            chip(c, "the official Python SDK (mcp)", W / 2, yC + 270, "#1e293b", "#94a3b8", seg(f, cu(1, 0.45) + 28, cu(1, 0.45) + 36), 34);
          } else {
            const yC = codeCard(c, 360, [T.list], seg(f, ln.from + 2, ln.from + 20), "bot.py · one line");
            arrowDown(c, yC + 8, seg(f, ln.from + 22, ln.from + 30));
            const y1 = traceBox(c, yC + 64, "THE SERVER ANSWERS", [T.listing], GREEN, seg(f, ln.from + 26, ln.from + 34));
            chip(c, "nothing about orders written in the bot", W / 2, y1 + 80, "#dcfce7", "#14532d", seg(f, cu(1, 0.5), cu(1, 0.5) + 8), big(c, "nothing about orders written in the bot", 44));
            chip(c, "our 2 bots · the same client code", W / 2, y1 + 190, "#1e293b", "#cbd5e1", seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22), 38);
            chip(c, "our client code showed the name, not the type", W / 2, y1 + 290, "#fef3c7", "#78350f", seg(f, cu(1, 0.5) + 30, cu(1, 0.5) + 38), big(c, "our client code showed the name, not the type", 38));   // script review: the setup for the bug
          }
        } else if (P === "bug") {
          c.font = SANS(fit(c, "OUR TEST · 10 CUSTOMERS", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · 10 CUSTOMERS", W / 2, 320);
          c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.fillText("a made-up shop · a small free AI on our computer", W / 2, 370);
          bigNum(c, "1/10", 270, 540, "#f87171", 1, 140, "right, plugged in");
          const kA = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          const y1 = traceBox(c, 640, "THE AI SENT", [T.call], "#93c5fd", kA, "4388", "#fbbf24");
          if (kA > 0) chip(c, "4388 = a number", 790, 500, "#fef3c7", "#78350f", kA, 42);
          const kE = seg(f, cu(2, 0.65), cu(2, 0.65) + 8);
          const y2 = traceBox(c, y1 + 30, "THE SERVER SAID", [T.error], "#f87171", kE);
          stamp(c, "REFUSED · EVERY NUMBER", W / 2, y2 + 100, seg(f, cu(2, 0.65) + 10, cu(2, 0.65) + 16));
          chip(c, "its form (the schema) said: text", W / 2, y2 + 230, "#1e293b", "#fde68a", seg(f, cu(2, 0.65) + 22, cu(2, 0.65) + 30), 40);
          const k3 = seg(f, cu(3, 0.85), cu(3, 0.85) + 8);   // script review: the one right was the one text request
          if (k3 > 0) traceBox(c, y2 + 300, "THE 1 RIGHT: THE AI SENT TEXT", [T.right], GREEN, k3, "\"4502\"", GREEN);
        } else if (P === "fix") {
          chip(c, "THE FIX · accept a number or text", W / 2, 300, "#fde68a", INK, 1, big(c, "THE FIX · accept a number or text", 44));
          const yC = codeCard(c, 360, [T.fixLine], seg(f, ln.from + 2, ln.from + 20), "orders_server.py · the one change", "| int", seg(f, ln.from + 20, ln.from + 28));
          const k1 = seg(f, cu(1, 0.45), cu(1, 0.45) + 6), k2 = seg(f, cu(2, 0.75), cu(2, 0.75) + 8);
          if (k2 <= 0) {
            const y1 = traceBox(c, yC + 30, "AND THE BOT NOW SHOWS THE AI THE TYPE", [T.fixList], "#93c5fd", seg(f, ln.from + 26, ln.from + 34), "string or integer", GREEN);
            bigNum(c, "10/10", W / 2, y1 + 220, GREEN, k1, 170, "");
            if (k1 > 0) chip(c, "WhatsApp bot · the same 10 customers · was 1/10", W / 2, y1 + 300, "#dcfce7", "#14532d", k1, big(c, "WhatsApp bot · the same 10 customers · was 1/10", 40));
          } else {
            bigNum(c, "10/10", 290, yC + 190, GREEN, 1, 130, "WhatsApp bot · was 1/10");
            bigNum(c, "7/10", 790, yC + 190, "#fbbf24", k2, 130, "website bot · was 0/10");
            const y1 = traceBox(c, yC + 300, "3 TIMES THE AI WROTE BROKEN JSON", [T.broken], "#fbbf24", seg(f, cu(2, 0.75) + 12, cu(2, 0.75) + 20), "4417\"", "#f87171");
            chip(c, "a stray quote · no call made", W / 2, y1 + 70, "#fef3c7", "#78350f", seg(f, cu(2, 0.75) + 24, cu(2, 0.75) + 32), 42);
          }
        } else if (P === "update") {
          c.font = SANS(fit(c, "ONE CHANGE, ON THE SERVER", W - 100, 64), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("ONE CHANGE, ON THE SERVER", W / 2, 330);
          c.fillStyle = "#1e293b"; rrect(c, 60, 390, W - 120, 260, 22); c.fill();
          c.font = SANS(40, 900); c.fillStyle = "#93c5fd"; c.textAlign = "left"; c.fillText("ORDER 4417 · refund", 100, 460);
          const kS = seg(f, ln.from + 14, ln.from + 22);
          c.font = SANS(48, 900); c.fillStyle = "#f87171"; c.fillText("not started", 100, 540);
          if (kS > 0) {
            c.save(); c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.moveTo(96, 524); c.lineTo(96 + 270 * clamp(kS), 524); c.stroke(); c.restore();
            c.save(); c.globalAlpha = clamp(kS * 3); c.font = SANS(48, 900); c.fillStyle = GREEN; c.fillText("Rs 1,299 approved", 100, 610); c.restore();
          }
          const kB = seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          const y = chat(c, 50, 700, W - 100, "the WhatsApp bot · asked again", [{ me: true, t: "Where is my refund? Order 4417.", k: kB, sz: 32 }, { me: false, t: T.update, k: kB, sz: 40 }], 38);
          chip(c, "no change to the bot", W / 2, y + 60, "#dcfce7", "#14532d", seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22), 50);
          chip(c, "(the website bot: broken JSON again)", W / 2, y + 160, "#1e293b", "#94a3b8", seg(f, cu(1, 0.5) + 22, cu(1, 0.5) + 30), 34);
        } else if (P === "loop") {
          const row = (y: number, n: string, t: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 150, 22); c.fill();
            c.font = SANS(70, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(n, 100, y + 100);
            c.font = SANS(fit(c, t, W - 300, 50, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(t, 190, y + 95); c.restore();
          };
          const r3 = ["1 app: a plain tool is enough", "2+ apps: make it an MCP server", "accept what the AI sends · test 10 questions"];
          const at3 = [ln.from + 2, cu(1, 0.3), cu(2, 0.55)];   // script review: "so which one do I use?"
          r3.forEach((t, q) => row(300 + q * 180, String(q + 1), t, seg(f, at3[q], at3[q] + 8)));
          chip(c, T.full, W / 2, 900, "#fde68a", INK, seg(f, cu(2, 0.55) + 16, cu(2, 0.55) + 24), 44);
          const kN = seg(f, cu(3, 0.85), cu(3, 0.85) + 8);
          if (kN > 0) {
            c.save(); c.globalAlpha = clamp(kN * 3);
            c.font = SANS(fit(c, "NEXT · EP56: A VOICE ASSISTANT", W - 120, 64), 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("NEXT · EP56: A VOICE ASSISTANT", W / 2, 1060);
            c.restore();
          }
        }
      }} />
    </>
  );
};

export const MCP55_SCENES = { sk_mcp55: StMcp };
