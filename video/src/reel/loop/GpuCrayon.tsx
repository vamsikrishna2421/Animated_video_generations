import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, PH, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { customers, headline, bubble } from "./OwnCrayon";

// EP36 "The Diwali rush" (series/scripts/ep36_gpus.md): Ravi anna's shop on Diwali evening. The shop AI (EP35's medium
// brain in his phone) is still typing one WhatsApp reply with 23 orders unread. Every word is over a billion
// multiplications; a few fast workers (CPU cores) lose to thousands of small ones at once (a graphics card, a GPU). Our
// test (series/scripts/ep36_demo): the same reply on 1, 2 and 4 CPU cores, 11.5 s / 6.3 s / 3.6 s. A gaming laptop's
// GPU has 3,328 cores and 8 GB (NVIDIA's spec page); the full-size big brain is 15 GB, so it doesn't fit: slow again.
// One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 },
};
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "point"], 3: ["angry", "phone"], 5: ["confused", "shrug"], 7: ["sus", "fold"], 9: ["happy", "up"], 11: ["yell", "point"],
  12: ["happy", "thumb"], 13: ["hope", "fist"], 15: ["confused", "shrug"], 16: ["panic", "up"],
};
const GREEN = "#16a34a", ORANGE = "#ea580c", BLUE = "#2563eb", PURPLE = "#7c3aed";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const LAP = { x: 560, y: 1000 };   // Sunny's gaming laptop on the counter (from line 11)

// ---------- pieces ----------
const lights = (c: Ctx, f: number) => {   // a string of bulbs along the top of the shop
  const cols = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#ec4899"];
  for (let i = 0; i < 18; i++) {
    const x = -20 + i * 64, y = 205 + Math.sin(i * 0.9) * 14, on = (Math.floor(f / 8) + i) % 3 !== 0;
    c.beginPath(); c.arc(x, y, 13, 0, 7); c.fillStyle = on ? cols[i % 5] : "#78716c"; c.fill();
    if (on) { c.beginPath(); c.arc(x, y, 24, 0, 7); c.fillStyle = "rgba(253,224,71,0.18)"; c.fill(); }
  }
};
const diyas = (c: Ctx, f: number) => {   // two diyas on the counter
  [[150, 1000], [1000, 1000]].forEach(([x, y], i) => {
    c.fillStyle = "#b45309"; c.beginPath(); c.ellipse(x, y, 34, 14, 0, 0, Math.PI); c.fill();
    const fl = 1 + 0.15 * Math.sin(f / 3 + i);
    c.fillStyle = "#facc15"; c.beginPath(); c.ellipse(x, y - 18 * fl, 8, 18 * fl, 0, 0, 7); c.fill();
    c.fillStyle = "#fb923c"; c.beginPath(); c.ellipse(x, y - 12 * fl, 4, 9 * fl, 0, 0, 7); c.fill();
  });
};
// the WhatsApp badges over the counter phone (world coordinates): the unread count and "typing…"
const badges = (c: Ctx, unread: number, typing: boolean, f: number) => {
  c.save(); c.translate(PH.x, PH.y - 230);
  if (typing) {
    c.fillStyle = "#dcf8c6"; rrect(c, -150, -46, 300, 84, 30); c.fill();
    c.font = SANS(36, 600); c.fillStyle = "#166534"; c.textAlign = "center"; c.fillText("typing" + ".".repeat(1 + (Math.floor(f / 8) % 3)), -6, 8);
  }
  if (unread > 0) {
    c.beginPath(); c.arc(140, -46, 52, 0, 7); c.fillStyle = "#dc2626"; c.fill();
    c.font = SANS(48); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(unread), 140, -30);
  }
  c.restore();
};
// a worker (a CPU core): a round head over a desk with a stack of sums
const worker = (c: Ctx, x: number, y: number, s: number, col: string, busy: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col; rrect(c, -34, -10, 68, 70, 22); c.fill();
  c.beginPath(); c.arc(0, -34, 26, 0, 7); c.fillStyle = "#b9774d"; c.fill();
  stroke(c, circlePts(0, -34, 26, 26), INK, 3, r, { passes: 1, alpha: 0.5 });
  c.fillStyle = "#94a3b8"; c.fillRect(-60, 58, 120, 14);
  for (let q = 0; q < 4; q++) { c.fillStyle = "#fff"; c.fillRect(-46 + Math.sin(busy * 9 + q) * 2, 44 - q * 6, 40, 5); }
  c.restore();
};
// thousands of tiny cores: a grid of dots; `done` turns them green
const dotGrid = (c: Ctx, x: number, y: number, cols: number, rows: number, gap: number, k: number, done: number) => {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const q = (i + j * cols) / (cols * rows);
    if (q > k) continue;
    c.fillStyle = done > 0 ? (q < done ? GREEN : "#93c5fd") : "#93c5fd";
    c.fillRect(x + i * gap, y + j * gap, gap * 0.7, gap * 0.7);
  }
};
// a graphics card: a green board, two fans, the memory chips
const gpuCard = (c: Ctx, x: number, y: number, s: number, f: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#15803d"; rrect(c, -330, -120, 660, 240, 20); c.fill();
  c.fillStyle = "#1f2937"; rrect(c, -310, -100, 620, 200, 16); c.fill();
  [-150, 150].forEach((fx) => {
    c.beginPath(); c.arc(fx, 0, 82, 0, 7); c.fillStyle = "#111827"; c.fill();
    for (let b = 0; b < 7; b++) { const a = f / 4 + (b / 7) * Math.PI * 2; stroke(c, [[fx, 0], [fx + Math.cos(a) * 70, Math.sin(a) * 70]], "#6b7280", 10, r, { passes: 1 }); }
    c.beginPath(); c.arc(fx, 0, 18, 0, 7); c.fillStyle = "#9ca3af"; c.fill();
  });
  c.fillStyle = "#ca8a04"; for (let q = 0; q < 14; q++) c.fillRect(-300 + q * 44, 124, 30, 26);   // the gold contacts
  c.restore();
};
// Sunny's gaming laptop on the counter (world coordinates), keys glowing
const gamingLaptop = (c: Ctx, k: number, f: number) => {
  if (k <= 0) return;
  c.save(); c.translate(LAP.x, LAP.y + 40 * (1 - easeOut(k))); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "#111827"; c.beginPath(); c.moveTo(-170, -10); c.lineTo(170, -10); c.lineTo(190, 14); c.lineTo(-190, 14); c.closePath(); c.fill();
  const hue = (f * 6) % 360;
  for (let q = 0; q < 8; q++) { c.fillStyle = `hsl(${(hue + q * 40) % 360}, 90%, 60%)`; c.fillRect(-150 + q * 38, -6, 30, 6); }
  c.fillStyle = "#1f2937"; rrect(c, -160, -210, 320, 200, 14); c.fill();
  c.fillStyle = "#0ea5e9"; rrect(c, -146, -196, 292, 172, 8); c.fill();
  c.font = SANS(26); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("GPU ON", 0, -104);
  c.restore();
};
// the card's memory as a jar (8 GB) and the full-size brain as a block drawn to scale (15 GB): `drop` lowers it in,
// `spill` slides the part that doesn't fit (7 GB) off to the CPU's few workers
const JAR = { x: 400, bottom: 1250, h: 420, w: 340 };
const fitScene = (c: Ctx, drop: number, spill: number, r: () => number, note = false) => {
  const { x, bottom, h, w } = JAR, bh = h * 15 / 8, bw = w - 40;
  c.fillStyle = "rgba(255,255,255,0.85)"; rrect(c, x - w / 2, bottom - h, w, h, 26); c.fill();
  const yTop = bottom - 12 - bh - (1 - easeOut(drop)) * 420;   // the block's top edge
  const cut = bottom - h;                                        // the jar's rim: everything above it doesn't fit
  // the part inside the card
  c.save(); c.beginPath(); c.rect(x - w / 2, cut, w, h); c.clip();
  c.fillStyle = PURPLE; c.globalAlpha = 0.75; rrect(c, x - bw / 2, yTop, bw, bh, 18); c.fill(); c.restore();
  // the part that doesn't fit: above the rim, then sliding to the CPU box
  const above = Math.max(0, cut - yTop);
  if (above > 0) {
    const sx = 370 * easeOut(spill), sy = 520 * easeOut(spill);
    c.save(); c.globalAlpha = 0.75; c.fillStyle = "#a855f7"; rrect(c, x - bw / 2 + sx, yTop + sy, bw, above, 18); c.fill(); c.restore();
    c.save(); c.setLineDash([14, 10]); c.strokeStyle = "#991b1b"; c.lineWidth = 5;
    c.strokeRect(x - bw / 2 + sx, yTop + sy, bw, above); c.restore();
    if (spill < 0.5) { c.font = SANS(40); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("big brain", x, yTop + 56); c.fillText("15 GB", x, yTop + 104); }
    else { c.font = SANS(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("7 GB", x + sx, yTop + sy + above / 2 + 14); }
  }
  stroke(c, [[x - w / 2, bottom - h], [x - w / 2, bottom], [x + w / 2, bottom], [x + w / 2, bottom - h]], INK, 7, r, { passes: 2 });
  c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("card memory: 8 GB", x, bottom + 52);
  if (note) { c.font = SANS(40); c.fillStyle = "#334155"; c.fillText("(not your phone's storage)", x, bottom + 104); }
};
const bars = (c: Ctx, y0: number, rows: [string, number, string, number][]) => {   // [label, seconds, colour, k]
  rows.forEach(([lab, sec, col, k], i) => {
    if (k <= 0) return;
    const y = y0 + i * 200, x0 = 150, wmax = 760, q = easeOut(k);
    c.font = caveat(56); c.fillStyle = INK; c.textAlign = "left"; c.fillText(lab, x0, y - 16);
    c.fillStyle = "#e2e8f0"; rrect(c, x0, y, wmax, 80, 16); c.fill();
    c.fillStyle = col; rrect(c, x0, y, Math.max(20, wmax * (sec / 11.5) * q), 80, 16); c.fill();
    c.font = caveat(66); c.fillStyle = col; c.textAlign = "right"; c.fillText(`${(sec * q).toFixed(1)} s`, x0 + wmax, y - 14);
  });
};
const rule = (c: Ctx, W: number, k: number[]) => {
  const rows: [string, string][] = [["CPU: a few fast cores", "#e2e8f0"], ["GPU: thousands at once", "#dcfce7"]];
  c.save(); c.translate(W / 2, 1060);
  c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, -490, -300, 980, 430, 30); c.fill();
  c.font = SANS(56); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("FOR AI, COUNT THE WORKERS", 0, -210);
  rows.forEach(([t, bg], i) => {
    const q = k[i] ?? 0; if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 2);
    c.fillStyle = bg; rrect(c, -450, -160 + i * 135, 900, 112, 22); c.fill();
    c.font = SANS(54); c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, -410, -86 + i * 135);
    c.restore();
  });
  c.restore();
};

// ---------- the scene ----------
const StGpu: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const te = (s.data as { handle?: string }).handle === "@ai_maastaaru_telugu";   // Telugu: crore-style digits, the voice's "compressed"
  const squeezed = te ? "compressed" : "squeezed";
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    if (b.shot === "screen") sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") {
      sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("k")} at={at + 1} src="audio/sfx_snap.wav" vol={0.6} />);
      [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("n" + q)} at={at + 10 + q * 7} src="audio/sfx_pop.wav" vol={0.22} />));   // orders pinging in
    }
    if (b.prop === "billion") for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("t" + q)} at={cue(i, 1, 0.3) + q * 3} src="audio/sfx_tick.wav" vol={0.12} />);
    if (b.prop === "workers") sfx.push(<Sfx key={k("o")} at={cue(i, 1, 0.5)} src="audio/gag_bonk.wav" vol={0.35} />);
    if (b.prop === "gpu") {
      sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.5) - 36} src="reel/sfx_riser.wav" vol={0.35} />);
      [0, 1, 2, 3, 4].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.5) + q * 3} src="audio/sfx_pop.wav" vol={0.2} />));
    }
    if (b.prop === "quiz") {
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("q" + q)} at={nx - 100 + q * 15} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - 75} src="reel/sfx_riser.wav" vol={0.7} />, <Sfx key={k("h")} at={nx - 6} src="reel/sfx_boom.wav" vol={0.6} />,
        <Sfx key={k("c")} at={nx - 6} src="audio/sfx_snap.wav" vol={0.45} />);
    }
    if (b.prop === "test") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.5) - 4} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("s")} at={cue(i, 1, 0.5) + 20} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "card") sfx.push(<Sfx key={k("c")} at={at + 8} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "sunny") {
      const z = cue(i, 1, 0.6) - 6;   // the count hits zero just before "Done already?!"
      for (let q = 0; q < 7; q++) sfx.push(<Sfx key={k("f" + q)} at={z - 20 + q * 3} src="audio/sfx_pop.wav" vol={0.22} />);
      sfx.push(<Sfx key={k("h")} at={z} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("c")} at={z} src="audio/sfx_snap.wav" vol={0.5} />,
        <Sfx key={k("s")} at={z + 2} src="audio/sfx_success.wav" vol={0.4} />);
    }
    // the rule chip's hits land on the cut, before the voice (on the first word they masked "For AI")
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 7)} src="audio/sfx_snap.wav" vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 8)} src="reel/sfx_boom.wav" vol={0.55} />,
      <Sfx key={k("b")} at={at + Math.round(l.frames * 0.4)} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "memory") sfx.push(<Sfx key={k("m")} at={at + 6} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("r")} at={cue(i, 1, 0.5) - 38} src="reel/sfx_riser.wav" vol={0.45} />,
      <Sfx key={k("h")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("k")} at={cue(i, 1, 0.5) - 2} src="audio/sfx_snap.wav" vol={0.5} />,
      <Sfx key={k("o")} at={cue(i, 1, 0.5)} src="audio/gag_bonk.wav" vol={0.4} />);
    if (b.prop === "slow") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_snap.wav" vol={0.35} />, <Sfx key={k("o")} at={cue(i, 1, 0.35)} src="audio/gag_bonk.wav" vol={0.35} />,
      <Sfx key={k("r")} at={cue(i, 2, 0.85) - 40} src="reel/sfx_riser.wav" vol={0.5} />, <Sfx key={k("h")} at={cue(i, 2, 0.85) - 4} src="reel/sfx_boom.wav" vol={0.9} />,
      <Sfx key={k("z")} at={cue(i, 2, 0.85) + 16} src="reel/sfx_buzz.wav" vol={0.3} />, <Sfx key={k("k")} at={cue(i, 2, 0.85) - 8} src="audio/sfx_snap.wav" vol={0.5} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9600 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = {
            billion: "every word I write", workers: "your phone: 8 cores = 8 workers", gpu: "a graphics card (GPU)",
            test: "our real test: the same reply", card: "who needs a graphics card?", memory: "does the big brain fit?", slow: "does the big brain fit?",
          };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "billion") {
            c.font = caveat(150); c.fillStyle = INK; c.textAlign = "center"; c.fillText("rice", W / 2, 520);
            const k = seg(f, cu(1, 0.3) - 6, endL);
            const rr = rng(36);
            for (let q = 0; q < Math.floor(260 * k); q++) {   // the pile of multiplications
              const x = 140 + rr() * (W - 280), y = 1240 - Math.pow(rr(), 0.6) * 560;
              c.font = SANS(24 + Math.floor(rr() * 18)); c.fillStyle = ["#334155", BLUE, ORANGE][q % 3]; c.fillText("×", x, y);
            }
            const v = Math.round(1.5e9 * easeOut(seg(f, cu(1, 0.3) - 6, endL - 25)));
            c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, 140, 1280, W - 280, 150, 24); c.fill();
            c.font = SANS(64); c.fillStyle = "#facc15"; c.fillText(v.toLocaleString(te ? "en-IN" : "en-US") + " ×", W / 2, 1362);
            c.font = SANS(34, 600); c.fillStyle = "#e2e8f0"; c.fillText("150 crore · for one word", W / 2, 1410);
          }
          if (b.prop === "workers") {
            for (let q = 0; q < 8; q++) worker(c, 200 + (q % 4) * 230, 520 + Math.floor(q / 4) * 230, 1.3, BLUE, f / 30, r);
            const c1 = cu(1, 0.5);
            c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("1.5 billion (150 crore) per word", W / 2, 1030);
            c.fillStyle = "#e2e8f0"; rrect(c, 150, 1080, W - 300, 60, 16); c.fill();
            c.fillStyle = BLUE; rrect(c, 150, 1080, 24 + 10 * seg(f, ln.from, endL), 60, 16); c.fill();
            if (f >= c1 - 4) tag(c, "8 workers: way too few", W / 2, 1260, 66, "#fee2e2", "#991b1b", -0.02, seg(f, c1 - 4, c1 + 6));
          }
          if (b.prop === "gpu") {
            const c1 = cu(1, 0.5), done = seg(f, c1, c1 + 20);
            c.font = SANS(40); c.textAlign = "center"; c.fillStyle = BLUE; c.fillText("CPU: a few big cores", W / 2, 400);
            for (let q = 0; q < 8; q++) worker(c, 240 + q * 86, 500, 0.62, BLUE, f / 30, r);
            c.fillStyle = GREEN; c.fillText("GPU: thousands of small cores", W / 2, 680);
            dotGrid(c, 150, 720, 60, 26, 13, 1, done);
            if (f >= c1 + 14) tag(c, "all at once", W / 2, 1150, 72, "#dcfce7", "#14532d", -0.02, seg(f, c1 + 14, c1 + 22));
          }
          if (b.prop === "test") {
            const c1 = cu(1, 0.5);
            bars(c, 470, [["1 core", 11.5, ORANGE, seg(f, ln.from + 4, ln.from + 22)], ["2 cores", 6.3, "#ca8a04", seg(f, ln.from + 14, ln.from + 32)],
              ["4 cores", 3.6, GREEN, seg(f, c1 - 4, c1 + 14)]]);
            if (f >= c1 + 16) tag(c, "3x faster", 760, 1080, 80, "#dcfce7", "#14532d", -0.03, seg(f, c1 + 16, c1 + 24));
            const c2 = cu(2, 0.8);
            if (f >= c1 + 16) tag(c, "quiz: B ✓", 300, 1080, 72, "#fef3c7", INK, 0.03, seg(f, c1 + 16, c1 + 24));
            if (f >= c2 - 4) tag(c, "our 4-core laptop: 23 orders ≈ 83 s", W / 2, 1250, 56, "#fee2e2", "#991b1b", -0.02, seg(f, c2 - 4, c2 + 6));
            c.font = SANS(38, 600); c.fillStyle = "#64748b"; c.textAlign = "center";
            c.fillText("EP35's medium brain · no graphics card", W / 2, 1410);
          }
          if (b.prop === "card") {
            const c1 = cu(1, 0.45);
            if (f < c1 - 4) {   // ChatGPT: a data centre full of graphics cards, not yours
              for (let q = 0; q < 12; q++) gpuCard(c, 230 + (q % 3) * 310, 520 + Math.floor(q / 3) * 160, 0.4, f, r);
              tag(c, "ChatGPT: runs on THEIR graphics cards", W / 2, 1230, 54, "#e0e7ff", INK, -0.02, seg(p, 0.05, 0.15));
              tag(c, "you don't need one to use it", W / 2, 1335, 52, "#dcfce7", "#166534", 0.01, seg(p, 0.12, 0.22));
            } else {
              gpuCard(c, W / 2, 600, 1.2, f, r);
              c.font = SANS(46); c.fillStyle = INK; c.textAlign = "center"; c.fillText("gaming laptop GPU (RTX 5060)", W / 2, 860);
              tag(c, "3,328 cores", 330, 1000, 80, "#dcfce7", "#14532d", -0.03, seg(f, c1 - 4, c1 + 6));
              tag(c, "8 GB memory", 760, 1000, 68, "#ede9fe", "#4c1d95", 0.03, seg(f, c1 + 8, c1 + 18));
              tag(c, "phone CPU: 8 cores", W / 2, 1150, 58, "#e2e8f0", INK, 0.01, seg(f, c1 + 16, c1 + 24));
              tag(c, "our test laptop: 4 cores", W / 2, 1250, 58, "#e2e8f0", INK, -0.01, seg(f, c1 + 22, c1 + 30));
              c.font = SANS(38, 600); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("cores and memory: NVIDIA's spec page", W / 2, 1400);
            }
          }
          if (b.prop === "memory") {
            const c1 = cu(1, 0.5);
            fitScene(c, seg(f, ln.from + 4, c1 - 6), 0, r, true);
            if (f >= c1) tag(c, "7 GB doesn't fit", 775, 640, 54, "#fee2e2", "#991b1b", 0.03, seg(f, c1, c1 + 8));
          }
          if (b.prop === "slow") {
            const c1 = cu(1, 0.35), c2 = cu(2, 0.85);
            tag(c, "MUST FIT IN CARD MEMORY", W / 2, 420, 60, "#0f172a", "#facc15", -0.01, seg(f, ln.from + 2, ln.from + 10));
            if (f >= c1 + 18) tag(c, "medium brain, 1.1 GB: fits ✓", W / 2, 540, 54, "#dcfce7", "#166534", 0.01, seg(f, c1 + 18, c1 + 24));
            if (f >= c1 + 26) tag(c, "big brain, 15 GB: doesn't fit", W / 2, 640, 54, "#fee2e2", "#991b1b", -0.01, seg(f, c1 + 26, c1 + 32));
            if (f >= c1 + 34) tag(c, `${squeezed}, 4.7 GB: fits ✓ (EP37)`, W / 2, 740, 54, "#dcfce7", "#166534", 0.01, seg(f, c1 + 34, c1 + 40));
            c.fillStyle = "#fee2e2"; rrect(c, 600, 955, 360, 420, 20); c.fill();
            c.font = SANS(40); c.fillStyle = "#991b1b"; c.textAlign = "center"; c.fillText("CPU: a few workers", 780, 935);
            fitScene(c, 1, seg(f, c1 - 4, c1 + 22), r);
            if (f >= c2 - 4) {
              const k = seg(f, c2 - 4, c2 + 6);
              c.save(); c.globalAlpha = k; c.fillStyle = "#dcf8c6"; rrect(c, 140, 1340, 340, 90, 30); c.fill();
              c.font = SANS(44, 600); c.fillStyle = "#166534"; c.textAlign = "center"; c.fillText("typing" + ".".repeat(1 + (Math.floor(f / 8) % 3)), 310, 1400);
              c.beginPath(); c.arc(545, 1385, 52, 0, 7); c.fillStyle = "#dc2626"; c.fill();
              c.font = SANS(50); c.fillStyle = "#fff"; c.fillText("23", 545, 1403); c.restore();
            }
          }
        } else {
          // ---------- the shop ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.14) || (n === 16 && p < 0.2) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          lights(c, f);
          const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          diyas(c, f);
          phone(c, b.who === "ai" && talking, f, r, {});
          const lap = n >= 11 ? (n === 11 ? seg(p, 0.05, 0.3) : 1) : 0;
          gamingLaptop(c, lap, f);
          const z11 = n === 11 ? cu(1, 0.6) - 6 : 0;
          const unread = n === 11 ? Math.round(23 * (1 - seg(f, z11 - 20, z11))) : n >= 12 && n <= 15 ? 0 : 23;
          badges(c, n === 11 && f >= z11 - 26 ? 0 : unread, n !== 11 && !(n >= 12 && n <= 15), f);   // the big count takes over
          customers(c, n === 1 ? 4 : n === 11 ? 3 : n >= 12 ? 1 : 0, f, r);
          c.restore();
          // screen-space props
          if (n === 1) headline(c, W, "23 ORDERS WAITING.", "THE AI IS STILL TYPING.", 1);
          if (n === 3) tag(c, "OCTA-CORE · 2.4 GHz", 300, 520, 56, "#e0e7ff", INK, -0.04, seg(p, 0.1, 0.25));
          if (n === 5) bubble(c, 330, 560, "every kid, one rack?", 76, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 7) bubble(c, 320, 560, "a single reply?", 76, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 9) bubble(c, 320, 560, "23 orders = 83 s?!", 72, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 11) {
            const c1 = cu(1, 0.6), z = c1 - 6, left = Math.round(23 * (1 - seg(f, z - 20, z)));
            if (f < c1 - 2) bubble(c, 300, 540, "Sunny! Laptop!", 72, seg(p, 0.02, 0.15), COL.yellow);
            else bubble(c, 300, 540, "Done?!", 104, seg(f, c1 - 2, c1 + 4), COL.yellow);
            if (f >= z - 26) {   // the queue empties on the gaming laptop, big, with a hit at zero
              const k0 = easeOut(seg(f, z - 26, z - 20)), pop = f >= z ? 1 + 0.3 * Math.exp(-(f - z) / 4) : 1;
              c.save(); c.globalAlpha = k0; c.translate(800, 560); c.scale(pop, pop);
              c.beginPath(); c.arc(0, 0, 118, 0, 7); c.fillStyle = left === 0 ? "#16a34a" : "#dc2626"; c.fill();
              c.lineWidth = 8; c.strokeStyle = "#fff"; c.stroke();
              c.font = SANS(112); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(left), 0, 40);
              c.restore();
              tag(c, left === 0 ? "0 waiting" : "orders waiting", 800, 735, 46, left === 0 ? "#dcfce7" : "#fff", left === 0 ? "#166534" : INK, 0.02, k0);
            }
            tag(c, "illustration · we didn't test a GPU", W / 2, 1110, 50, "rgba(255,255,255,0.95)", "#334155", 0, seg(p, 0.1, 0.2));
          }
          if (n === 12) rule(c, W, [seg(p, 0.05, 0.15), seg(p, 0.35, 0.45)]);
          if (n === 13) {
            bubble(c, 320, 560, "FULL SIZE!", 90, seg(p, 0.05, 0.2), "#ede9fe", "#4c1d95");
            tag(c, `${squeezed} copy: 4.7 GB (EP35)`, 700, 380, 48, "#fff", INK, 0.02, seg(p, 0.45, 0.6));
          }
          if (n === 15) bubble(c, 320, 560, "So?", 96, seg(p, 0.05, 0.2), COL.yellow);
        }
        // the quiz card, held after line 7 (screen space); its 3-2-1 ends as the card leaves
        if (b.prop === "quiz" && f > endL + 6) {
          const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
          c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
          c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
          c.fillStyle = "#fffdf5"; rrect(c, -480, -380, 960, 680, 30); c.fill();
          c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -300);
          c.font = SANS(56); c.fillStyle = INK; c.fillText("More cores: is a single reply faster?", 0, -205);
          c.textAlign = "left"; c.font = SANS(60);
          c.fillStyle = "#e0e7ff"; rrect(c, -420, -140, 400, 120, 22); c.fill(); c.fillStyle = INK; c.fillText("A)  no", -370, -62);
          c.fillStyle = "#e0e7ff"; rrect(c, 20, -140, 400, 120, 22); c.fill(); c.fillStyle = INK; c.fillText("B)  yes", 70, -62);
          c.font = SANS(44, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A or B", 0, 60);
          const t = f - (next - 100), q = 3 - Math.floor(t / 30);
          if (t >= 0 && q >= 1) {
            const pop = 1 + 0.25 * (1 - clamp((t % 30) / 6));
            c.save(); c.translate(0, 200); c.scale(pop, pop);
            c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
            c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
          }
          c.restore();
        }
        void handF;
      }} />
    </>
  );
};

export const GPU_SCENES = { sk_gpu: StGpu };
