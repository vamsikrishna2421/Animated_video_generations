import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, handF } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { bubble, xMark, laptop } from "./OwnCrayon";

// EP38 "Not enough memory" (series/scripts/ep38_ram_not_storage.md): Ravi anna bought the shop AI a laptop by the biggest
// number on its box (512 GB). The AI downloaded its full brain (15 GB) and the laptop says NOT ENOUGH MEMORY: 512 GB is
// storage, the godown that keeps things; for every word the AI uses every sack of its brain, so all of them must sit on
// the counter, RAM, 8 GB. One sack = 1 GB. The squeezed 7B (4.7 GB, EP37) needs about 5 GB (our test, series/scripts/
// ep38_demo): it just fits, close the other apps. With the internet cut it still wrote a WhatsApp reply, in 17 s. Rule:
// check RAM, not storage; free apps Ollama / LM Studio. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.5, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 690 },   // hook: frame 1 and the loop's end
};
const GREEN = "#16a34a", RED = "#dc2626", PURPLE = "#7c3aed";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const SACK = "#d6b27a", SACK_D = "#a9844c", PINK = "#f9a8d4", LILAC = "#c4b5fd";
const CELL = 100;   // one GB on the counter

// ---------- pieces ----------
// the app's error window (screen space): red title bar, one line, an OK button; `k` pops it in, `shake` jolts it
const memDialog = (c: Ctx, x: number, y: number, k: number, shake: number, r: () => number) => {
  if (k <= 0) return;
  const w = 900, h = 300;
  c.save(); c.translate(x + (shake ? (r() - 0.5) * shake : 0), y + (shake ? (r() - 0.5) * shake : 0));
  c.scale(0.85 + 0.15 * easeOut(k), 0.85 + 0.15 * easeOut(k)); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.4)"; rrect(c, -w / 2 + 12, 14, w, h, 26); c.fill();
  c.fillStyle = "#fffdf5"; rrect(c, -w / 2, 0, w, h, 26); c.fill();
  c.fillStyle = RED; rrect(c, -w / 2, 0, w, 104, 26); c.fill(); c.fillRect(-w / 2, 70, w, 34);
  c.font = SANS(60); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("⚠ NOT ENOUGH MEMORY", 0, 74);
  c.font = SANS(54, 600); c.fillStyle = INK; c.fillText("This brain needs 15 GB.", 0, 184);
  c.fillStyle = "#e2e8f0"; rrect(c, 300, 214, 120, 62, 14); c.fill();
  c.font = SANS(36); c.fillStyle = INK; c.fillText("OK", 360, 258);
  c.restore();
};
// the laptop's box (world space, on the counter): a starburst "512 GB", "8 GB RAM" under it
const laptopBox = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#c8a165"; rrect(c, -140, -260, 280, 260, 10); c.fill();
  stroke(c, [[-140, -260], [140, -260], [140, 0], [-140, 0], [-140, -260]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.font = SANS(26); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("NEW LAPTOP", 0, -226);
  c.save(); c.translate(0, -138); c.rotate(-0.08);   // the starburst
  c.beginPath();
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, rr = i % 2 ? 66 : 92; c.lineTo(Math.cos(a) * rr * 1.25, Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = "#facc15"; c.fill();
  c.font = SANS(54); c.fillStyle = RED; c.fillText("512 GB", 0, 18);
  c.restore();
  c.fillStyle = "#fffdf5"; rrect(c, -126, -66, 252, 58, 12); c.fill();
  c.font = SANS(42); c.fillStyle = INK; c.fillText("8 GB RAM", 0, -22);
  c.restore();
};
// a gunny sack with an optional label
const sack = (c: Ctx, x: number, y: number, w: number, h: number, col: string, text: string, r: () => number, rot = 0, fs = 30) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = col; c.beginPath();
  c.moveTo(-w * 0.36, -h); c.quadraticCurveTo(-w * 0.62, -h * 0.4, -w * 0.5, 0); c.lineTo(w * 0.5, 0); c.quadraticCurveTo(w * 0.62, -h * 0.4, w * 0.36, -h);
  c.quadraticCurveTo(0, -h * 1.12, -w * 0.36, -h); c.closePath(); c.fill();
  stroke(c, [[-w * 0.3, -h * 0.96], [w * 0.3, -h * 0.96]], SACK_D, Math.max(3, w * 0.04), r, { passes: 1, alpha: 0.8 });   // the tie
  stroke(c, [[-w * 0.5, 0], [w * 0.5, 0]], INK, 3, r, { passes: 1, alpha: 0.4 });
  if (text) {
    c.font = handF(fs); const tw = c.measureText(text).width + 16;
    c.fillStyle = "rgba(255,255,255,0.86)"; rrect(c, -tw / 2, -h * 0.62, tw, fs * 1.4, 8); c.fill();
    c.fillStyle = INK; c.textAlign = "center"; c.fillText(text, 0, -h * 0.62 + fs * 1.04);
  }
  c.restore();
};
// one small brain sack (1 GB): pink (full size) or lilac (squeezed); `part` < 1 draws a smaller, part-full sack
const gbSack = (c: Ctx, x: number, y: number, col: string, r: () => number, rot = 0, part = 1) => {
  const h = 78 * (0.55 + 0.45 * part);
  sack(c, x, y, 82, h, col, "", r, rot);
  c.save(); c.translate(x, y - h * 0.5); c.rotate(rot);
  c.font = SANS(20); c.fillStyle = "#831843"; c.textAlign = "center"; c.fillText(part < 1 ? "0.7" : "1 GB", 0, 6);
  c.restore();
};
// the brain's sacks in a pile (godown): n sacks in rows of `per`
const pile = (c: Ctx, x: number, y: number, n: number, per: number, col: string, r: () => number, glow = 0) => {
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per), k = i % per;
    const sx = x + k * 86 + (row % 2) * 40, sy = y - row * 66;
    const g = clamp(glow * n * 1.2 - i);   // `glow` sweeps across the sacks: one word lights every one of them
    if (g > 0) { c.save(); c.globalAlpha = 0.6 * g; c.fillStyle = "#fde047"; c.beginPath(); c.arc(sx, sy - 36, 54, 0, 7); c.fill(); c.restore(); }
    gbSack(c, sx, sy, col, r, ((i * 37) % 7 - 3) * 0.02);
  }
};
// the godown: a brick room, shelves of sacks (the files); the brain's 15 sacks on the floor at the right
const godown = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, o: { brain?: boolean; glow?: number } = {}) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "#9a3412"; rrect(c, 0, 0, w, h, 24); c.fill();
  c.save(); c.globalAlpha = 0.3; c.strokeStyle = "#fed7aa"; c.lineWidth = 3;
  for (let yy = 30; yy < h; yy += 44) { c.beginPath(); c.moveTo(10, yy); c.lineTo(w - 10, yy); c.stroke();
    for (let xx = (yy / 44) % 2 ? 20 : 60; xx < w; xx += 80) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 44); c.stroke(); } }
  c.restore();
  c.fillStyle = "#fef3c7"; rrect(c, w * 0.6, 18, w * 0.36, 64, 12); c.fill();   // the sign over the door
  c.font = SANS(Math.round(w * 0.05)); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("GODOWN", w * 0.78, 66);
  const labels = [["photos", "songs", "videos"], ["PDFs", "WhatsApp", "movies"]];
  const cols = ["#e9d5a1", "#d6b27a", "#c9a46c", "#e2c48e"];
  const sh = h * 0.3;
  labels.forEach((row, i) => {
    const yy = 30 + (i + 1) * sh;
    c.fillStyle = "#7a4520"; c.fillRect(24, yy, w * 0.52, 16);
    row.forEach((t, j) => sack(c, 90 + j * (w * 0.16), yy, w * 0.14, sh * 0.72, cols[(i + j) % 4], t, r, j % 2 ? 0.03 : -0.03, Math.round(w * 0.024)));
  });
  if (o.brain !== false) {
    const bx = w * 0.6, by = h - 40;
    pile(c, bx, by, 15, 5, PINK, r, o.glow ?? 0);
    c.font = SANS(Math.round(w * 0.042)); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("brain · 15 GB", bx + 180, by - 250);
  }
  c.restore();
};
// the counter (RAM): a wooden top with `slots` 1-GB places and its label
const ramCounter = (c: Ctx, cx: number, y: number, slots: number, title = "RAM · 8 GB") => {
  const w = slots * CELL;
  c.save(); c.translate(cx, y);
  c.fillStyle = "#98592c"; rrect(c, -w / 2 - 40, 0, w + 80, 150, 18); c.fill();
  c.fillStyle = "#b8743f"; rrect(c, -w / 2 - 40, 0, w + 80, 34, 14); c.fill();
  for (let i = 0; i < slots; i++) {
    const x = -w / 2 + i * CELL;
    c.setLineDash([10, 8]); c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 4; c.strokeRect(x + 6, -92, CELL - 12, 84); c.setLineDash([]);
    c.font = SANS(24, 600); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(`${i + 1}`, x + CELL / 2, 26);
  }
  c.font = SANS(54); c.fillStyle = "#fef9c3"; c.textAlign = "center"; c.fillText(title, 0, 110);
  c.restore();
};
// the sack in counter slot i (0..7); `drop` 0..1 falls in from above
const slotX = (cx: number, i: number) => cx - 4 * CELL + i * CELL + CELL / 2;
// the quiz card (screen space), held in the gap after the line; its 3-2-1 ends as the card leaves
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 820); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -490, -420, 980, 800, 30); c.fill();
  c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -340);
  c.font = SANS(62); c.fillStyle = INK; c.fillText("The 4.7 GB brain needs", 0, -252);
  c.fillText("how much RAM?", 0, -176);
  [["A", "4.7 GB"], ["B", "5 GB"], ["C", "all 8 GB"]].forEach(([l, t], i) => {
    const yy = -110 + i * 128;
    c.fillStyle = "#e0e7ff"; rrect(c, -380, yy, 760, 108, 22); c.fill();
    c.font = SANS(60); c.fillStyle = INK; c.textAlign = "left"; c.fillText(l, -340, yy + 76);
    c.font = SANS(58, 600); c.fillText(t, -220, yy + 76);
  });
  c.font = SANS(42, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A, B or C", 0, 300);
  const t = f - (next - 76), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(0, 470); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? COL.red : INK; c.fill();
    c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
  }
  c.restore();
};
// the rule chip (screen space): a title and rows that pop in
const ruleChip = (c: Ctx, W: number, y: number, title: string, rows: [string, string, string][], k: number[]) => {
  c.save(); c.translate(W / 2, y);
  const h = 150 + rows.length * 128;
  c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, -490, -110, 980, h, 30); c.fill();
  c.font = SANS(60); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText(title, 0, -20);
  rows.forEach(([t, bg, fg], i) => {
    const q = k[i] ?? 0; if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 2);
    c.fillStyle = bg; rrect(c, -450, 30 + i * 128, 900, 106, 22); c.fill();
    let fs = 48; c.font = SANS(fs); while (c.measureText(t).width > 840 && fs > 28) { fs -= 2; c.font = SANS(fs); }
    c.fillStyle = fg; c.textAlign = "left"; c.fillText(t, -420, 98 + i * 128);
    c.restore();
  });
  c.restore();
};
// a row on the phone's test card: a label and a big value, fading in by `k`
const row = (c: Ctx, y: number, lab: string, val: string, col: string, k: number, bg = "#f1f5f9") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, 130, y - 70, 820, 112, 22); c.fill();
  c.font = SANS(40, 600); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(lab, 160, y);
  c.font = SANS(58); c.fillStyle = col; c.textAlign = "right"; c.fillText(val, 920, y + 4);
  c.restore();
};
// the offline reply as a WhatsApp bubble (our test's real reply)
const REPLY = ["Sure, Anna! Here's your order:", "- 2 kg rice", "- 1 litre sunflower oil", "- 6 eggs", "- 1 packet of tea powder",
  "Your order will be delivered to flat 302", "within 30 minutes. Thanks for choosing us!"];   // word for word (series/scripts/ep38_demo/7B_q4_k_m.json)
const replyBubble = (c: Ctx, x: number, y: number, k: number) => {
  if (k <= 0) return;
  const shown = Math.ceil(REPLY.length * clamp(k));
  c.save(); c.globalAlpha = clamp(k * 4);
  c.fillStyle = "#dcf8c6"; rrect(c, x, y, 760, 60 + REPLY.length * 50, 26); c.fill();
  c.font = SANS(34, 500); c.fillStyle = INK; c.textAlign = "left";
  REPLY.slice(0, shown).forEach((t, i) => c.fillText(t, x + 30, y + 64 + i * 50));
  c.restore();
};
// an app tile (name only, no logos)
const appTile = (c: Ctx, x: number, y: number, name: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.scale(0.9 + 0.1 * easeOut(k), 0.9 + 0.1 * easeOut(k));
  c.fillStyle = "rgba(4,8,40,0.25)"; rrect(c, -190 + 8, -100 + 10, 380, 200, 34); c.fill();
  c.fillStyle = "#0f172a"; rrect(c, -190, -100, 380, 200, 34); c.fill();
  c.font = SANS(58); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(name, 0, 14);
  c.font = SANS(30, 600); c.fillStyle = "#86efac"; c.fillText("free", 0, 66);
  c.restore();
};
// generic app icons on the laptop (no brands): closing them frees the counter
const appIcons = (c: Ctx, cx: number, y: number, k: number, closed: number, r: () => number) => {
  if (k <= 0) return;
  const names = ["browser", "videos", "games"], cols = ["#2563eb", "#dc2626", "#16a34a"];
  names.forEach((t, i) => {
    const x = cx + (i - 1) * 230;
    c.save(); c.globalAlpha = clamp(k * 2) * (1 - 0.6 * seg(closed, i / 3, i / 3 + 0.33));
    c.fillStyle = cols[i]; rrect(c, x - 70, y - 70, 140, 140, 30); c.fill();
    c.font = SANS(30); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(t, x, y + 10);
    c.restore();
    const q = seg(closed, i / 3, i / 3 + 0.33);
    if (q > 0) xMark(c, x, y, 60, q, r);
  });
};
// the 2 TB box Ravi holds up
const diskBox = (c: Ctx, x: number, y: number, s: number, r: () => number) => {
  c.save(); c.translate(x, y); c.rotate(0.06); c.scale(s, s);
  c.fillStyle = "#1e3a8a"; rrect(c, -150, -110, 300, 220, 14); c.fill();
  stroke(c, [[-150, -110], [150, -110], [150, 110], [-150, 110], [-150, -110]], INK, 4, r, { passes: 1, alpha: 0.5 });
  c.font = SANS(78); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("2 TB", 0, 10);
  c.font = SANS(30); c.fillStyle = "#fff"; c.fillText("HARD DISK", 0, 62);
  c.restore();
};
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "up"], 3: ["angry", "point"], 6: ["shock", "up"], 7: ["hope", "point"], 9: ["happy", "thumb"], 11: ["sus", "fold"],
  13: ["confused", "shrug"], 15: ["hope", "point"], 17: ["smug", "fist"], 18: ["happy", "fist"],
};

// ---------- the scene ----------
const StLocal: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if ((b.shot === "screen" || b.shot === "godown") && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("z")} at={at + 1} src="reel/sfx_buzz.wav" vol={0.5} />);
    if (b.prop === "godown") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "counter") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={cue(i, 1, 0.55) - 6 + q * 5} src="audio/sfx_pop.wav" vol={0.22} />));
    if (b.prop === "nofit") sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.5) - 30} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("o")} at={cue(i, 1, 0.5) + 4} src="audio/gag_bonk.wav" vol={0.5} />,
      <Sfx key={k("x")} at={cue(i, 1, 0.5) + 14} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "sacks") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("b" + q)} at={at + 10 + q * 6} src="audio/gag_bonk.wav" vol={0.22} />));
    if (b.prop === "quiz") {
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - 76 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - 60} src="reel/sfx_riser.wav" vol={0.7} />, <Sfx key={k("h")} at={nx - 16} src="reel/sfx_boom.wav" vol={0.85} />,
        <Sfx key={k("c")} at={nx - 16} src="audio/sfx_snap.wav" vol={0.5} />);   // half a second before "five" (on it, it masks the word)
    }
    if (b.prop === "fits") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) + 4} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "just") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("x" + q)} at={cue(i, 1, 0.4) + 6 + q * 9} src="audio/sfx_pop.wav" vol={0.25} />));
    if (b.prop === "test") sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.5) - 40} src="reel/sfx_riser.wav" vol={0.3} />,   // a lift into "seventeen seconds"
      <Sfx key={k("s")} at={cue(i, 1, 0.5) + 2} src="audio/sfx_success.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 7)} src="audio/sfx_snap.wav" vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 8)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "apps") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("p2")} at={at + 12} src="audio/sfx_pop.wav" vol={0.25} />,
      <Sfx key={k("r")} at={nx - 30} src="reel/sfx_riser.wav" vol={0.4} />);   // a rise into the 2 TB twist
    if (b.prop === "disk") sfx.push(<Sfx key={k("c")} at={at - 4} src="audio/sfx_chaching.wav" vol={0.3} />, <Sfx key={k("r")} at={nx - 34} src="reel/sfx_riser.wav" vol={0.5} />);
    if (b.prop === "loop") {   // the error slams back in after "Same counter" (in the music's drop), into frame 1
      const slam = l.from + l.frames + 2;
      sfx.push(<Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.5} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.55} />);
    }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9800 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        if (b.shot === "godown") {
          // ---------- the godown (storage) and the counter (RAM), full frame ----------
          c.fillStyle = "#3f2a16"; c.fillRect(0, 0, W, H);
          const c1 = cu(1, 0.5), cx = W / 2, cy = 1180;
          if (b.prop === "godown") {
            godown(c, 60, 300, W - 120, 1000, r);
            if (f >= c1 - 4) tag(c, "STORAGE · 512 GB", W / 2, 262, 64, "#0f172a", "#facc15", -0.01, seg(f, c1 - 4, c1 + 4));
            if (f >= c1 + 6) tag(c, "= the godown: it keeps things", W / 2, 1390, 52, "#fef3c7", INK, 0.01, seg(f, c1 + 6, c1 + 14));
          } else {
            const glow = b.prop === "counter" && f < c1 ? seg(f, ln.from + 4, ln.from + 24) : 0;
            godown(c, 140, 240, W - 280, 600, r, { brain: b.prop === "counter" || b.prop === "nofit" ? !(b.prop === "nofit" && f >= c1 - 6) : false, glow });
            c.font = SANS(40); c.fillStyle = "#fed7aa"; c.textAlign = "center"; c.fillText("STORAGE 512 GB = the godown", W / 2, 890);
            ramCounter(c, cx, cy, 8);
            if (b.prop === "counter") {   // every sack lights up for one word; on [1] the counter: RAM
              if (glow > 0) tag(c, "1 word = all 15 bags", W / 2, 990, 56, "#fef9c3", INK, -0.02, seg(f, ln.from + 2, ln.from + 10));
              if (f >= c1 - 2) tag(c, "RAM = the counter: where I think", W / 2, 990, 48, "#fef3c7", INK, -0.01, seg(f, c1 - 2, c1 + 6));
            }
            if (b.prop === "nofit") {   // 8 GB of counter; on [1] 15 sacks land: 8 fit, 7 tumble off the ends
              const k8 = seg(f, ln.from, ln.from + 10);
              if (k8 > 0 && f < c1 + 30) tag(c, "8 GB", 210, 1010, 66, "#0f172a", "#fde68a", -0.04, k8);
              for (let q = 0; q < 15; q++) {
                const t0 = c1 - 6 + q * 1.5, land = easeOut(seg(f, t0, t0 + 6));
                if (land <= 0) continue;
                if (q < 8) gbSack(c, slotX(cx, q), cy - 8 - (1 - land) * 700, PINK, r);
                else {   // the overflow: stacked on top, then tipping off
                  const side = q % 2 ? 1 : -1, tip = seg(f, c1 + 10 + (q - 8) * 2, c1 + 30 + (q - 8) * 2);
                  const x0 = slotX(cx, q % 2 ? 7 - (q - 8) / 2 : (q - 8) / 2);
                  gbSack(c, x0 + side * tip * 320, cy - 92 - (1 - land) * 700 + tip * tip * 520, PINK, r, side * tip * 1.2);
                }
              }
              if (f >= c1 + 14) xMark(c, W / 2, 1395, 60, seg(f, c1 + 14, c1 + 24), r);
              if (f >= c1 + 18) tag(c, "15 GB doesn't fit", W / 2, 1000, 56, "#fee2e2", "#991b1b", 0.03, seg(f, c1 + 18, c1 + 26));
            }
            if (b.prop === "fits" || b.prop === "just") {   // the squeezed 7B on the counter: 4.7 GB + 0.3 to work = 5.0 GB
              const kk = b.prop === "fits" ? seg(f, ln.from + 2, ln.from + 16) : 1;
              for (let q = 0; q < 5; q++) {
                const land = easeOut(seg(kk, q / 6, q / 6 + 0.4));
                if (land > 0) gbSack(c, slotX(cx, q), cy - 8 - (1 - land) * 500, LILAC, r, 0, q === 4 ? 0.7 : 1);
              }
              if (kk > 0.7) { c.fillStyle = "#fde68a"; rrect(c, slotX(cx, 4) + 22, cy - 88, 26, 76, 6); c.fill(); }   // the 0.3 GB to work
              const c2 = b.prop === "fits" ? cu(1, 0.4) : ln.from - 30;
              if (b.prop === "fits" && f < c2 - 4) tag(c, "B ✓  5 GB", W / 2, 980, 96, "#dcfce7", "#14532d", -0.03, seg(f, ln.from, ln.from + 5));   // the reveal, on "five"
              if (b.prop === "fits" && f >= c2 - 4) tag(c, "the 4.7 GB brain needs 5.0 GB (our test)", W / 2, 990, 46, "#ede9fe", "#4c1d95", -0.02, seg(f, c2 - 4, c2 + 4));
              if (b.prop === "just") tag(c, "3 GB left for Windows + apps", W / 2, 990, 56, "#dcfce7", "#14532d", -0.02, seg(f, ln.from, ln.from + 6));
              if (b.prop === "just") {
                c.save(); c.globalAlpha = seg(f, ln.from, ln.from + 8);
                c.fillStyle = "rgba(34,197,94,0.3)"; rrect(c, slotX(cx, 5) - 46, cy - 96, 292, 92, 14); c.fill();
                c.font = SANS(48); c.fillStyle = "#bbf7d0"; c.textAlign = "center"; c.fillText("3 GB", slotX(cx, 6), cy - 34);
                c.restore();
                const c3 = cu(1, 0.4);
                appIcons(c, W / 2, 1408, seg(f, c3 - 10, c3 - 2), seg(f, c3 + 4, c3 + 34), r);
              }
            }
          }
        } else if (b.shot === "screen") {
          // ---------- the phone, full frame ----------
          const titles: Record<string, string> = { test: "our test: the internet cut", apps: "where to get a brain" };
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          bigPhone(c, W, H, titles[b.prop] ?? "", r, f);
          if (b.prop === "test") {
            const c1 = cu(1, 0.5);
            c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 378);
            c.font = SANS(32, 600); c.fillStyle = "#475569"; c.fillText("the 4.7 GB brain (Qwen2.5 7B, 4-bit)", W / 2, 422);
            row(c, 540, "internet", "CUT ✕", RED, seg(f, ln.from, ln.from + 8), "#fee2e2");
            replyBubble(c, 160, 620, seg(f, ln.from + 6, c1 + 4));
            row(c, 1150, "the whole reply", "17 s", INK, seg(f, c1 - 2, c1 + 6), "#fef3c7");
            row(c, 1290, "RAM it needed", "5.0 GB", PURPLE, seg(f, c1 + 8, c1 + 16), "#ede9fe");
            c.font = SANS(30); c.fillStyle = "#334155"; c.textAlign = "center";
            c.fillText("4-core server, no graphics card · word for word", W / 2, 1420);
          }
          if (b.prop === "apps") {
            const c1 = cu(1, 0.5);
            c.font = SANS(54); c.fillStyle = INK; c.textAlign = "center"; c.fillText("FREE APPS · no coding", W / 2, 392);
            appTile(c, 330, 540, "Ollama", seg(f, ln.from + 2, ln.from + 10));
            appTile(c, 750, 540, "LM Studio", seg(f, ln.from + 8, ln.from + 16));
            if (f >= ln.from + 16) {
              c.save(); c.globalAlpha = seg(f, ln.from + 16, ln.from + 24);
              c.fillStyle = "#ede9fe"; rrect(c, 110, 676, 860, 160, 22); c.fill();
              c.font = SANS(44); c.fillStyle = "#4c1d95"; c.textAlign = "center"; c.fillText("Ollama: qwen2.5:7b", W / 2, 738);
              c.font = SANS(36); c.fillText("LM Studio: Qwen2.5 7B, Q4_K_M file", W / 2, 806);
              c.restore();
            }
            if (f >= c1 - 4) {
              c.save(); c.globalAlpha = seg(f, c1 - 4, c1 + 4);
              c.fillStyle = "#e0f2fe"; rrect(c, 130, 860, 820, 110, 22); c.fill();
              c.font = SANS(42); c.fillStyle = INK; c.textAlign = "center"; c.fillText("1 · download once (internet)", W / 2, 932);
              c.restore();
            }
            if (f >= c1 + 8) {
              c.save(); c.globalAlpha = seg(f, c1 + 8, c1 + 16);
              c.fillStyle = "#dcfce7"; rrect(c, 130, 1000, 820, 110, 22); c.fill();
              c.font = SANS(42); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText("2 · then it runs offline", W / 2, 1072);
              c.restore();
            }
            if (f >= c1 + 16) {
              c.font = SANS(34); c.fillStyle = "#334155"; c.textAlign = "center";
              c.fillText("your chats stay on your laptop", W / 2, 1180);
              c.font = SANS(28); c.fillText("(local models; both apps' own docs)", W / 2, 1224);
            }
          }
        } else {
          // ---------- the shop ----------
          const slam = endL + 2, loopOn = n === 18 && f >= slam;   // the loop's last beat: frame 1 again
          const sh = n === 1 || loopOn ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (n === 1 && p < 0.14) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["yell", "up"] as [Mood, Arms]) : RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, p, f, r);
          counter(c, r);
          laptop(c, 250, 1000, 0.72, n === 1 || loopOn ? "NOT ENOUGH\nMEMORY" : n >= 8 ? "4.7 GB brain ✓" : "loading...", r, { err: n === 1 || loopOn || n < 8 });
          if (n === 1 || loopOn) laptopBox(c, 575, 1010, 0.9, r);   // frame 1: the box in front of him, clear of the app's buttons on the right
          phone(c, b.who === "ai" && talking, f, r, {});
          if (n === 6) [0, 1, 2, 3, 4, 5].forEach((q) => {   // rice sacks piled on his counter, sliding off
            const fall = seg(f, ln.from + 8 + q * 4, ln.from + 22 + q * 4);
            sack(c, 560 + (q % 3) * 120 + fall * 80, 1010 - Math.floor(q / 3) * 120 + fall * fall * 420, 130, 120, SACK, "", r, fall * 0.8);
          });
          if (n === 17) diskBox(c, 700, 520, 1.0, r);
          c.restore();
          // screen-space props
          if (n === 1 || loopOn) memDialog(c, W / 2, 222, n === 1 ? 1 : seg(f, slam, slam + 6), shake, r);   // frame 1, and the loop's last beat
          if (n === 3) bubble(c, 330, 560, "the brain's in there!", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 6) bubble(c, 330, 560, "15 on an 8 counter?!", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 7) {   // the squeezed brain: five lilac sacks, 4.7 GB (EP37)
            const kk = seg(p, 0.05, 0.25);
            if (kk > 0) {
              c.save(); c.globalAlpha = clamp(kk * 2);
              c.fillStyle = "rgba(15,23,42,0.8)"; rrect(c, 560, 250, 470, 300, 26); c.fill();
              for (let q = 0; q < 5; q++) gbSack(c, 640 + (q % 3) * 100 + (q > 2 ? 50 : 0), 470 - (q > 2 ? 70 : 0), LILAC, r, 0, q === 4 ? 0.7 : 1);
              c.font = SANS(36); c.fillStyle = "#e9d5ff"; c.textAlign = "center"; c.fillText("squeezed to 4-bit: 4.7 GB", 795, 300);
              c.restore();
            }
          }
          if (n === 9) bubble(c, 330, 560, "5 on an 8 counter!", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 11) bubble(c, 330, 560, "no internet?", 80, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 13) bubble(c, 330, 560, "which one?", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 15) bubble(c, 330, 560, "where do I get it?", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 14) {
            ruleChip(c, W, 330, "CHECK RAM, NOT STORAGE", [
              ["Windows: Settings › System › About", "#e2e8f0", INK],
              ["Mac: Apple menu › About This Mac", "#e2e8f0", INK],
              ["8 GB: 4.7 GB brain, barely · 16 GB: 9 GB (14B)", "#dcfce7", "#14532d"],
            ], [seg(p, 0.05, 0.15), seg(p, 0.3, 0.4), seg(p, 0.45, 0.55)]);
          }
          if (n === 17 && f >= cu(1, 0.45)) tag(c, "the biggest brain!", 700, 360, 60, "#fef3c7", INK, -0.03, seg(f, cu(1, 0.45), cu(1, 0.45) + 8));
          if (n === 18 && !loopOn) {   // "Bigger godown. Same counter.": the two side by side
            const kk = seg(f, ln.from, ln.from + 10);
            if (kk > 0) {
              tag(c, "godown: 2 TB ↑", 300, 380, 58, "#dcfce7", "#14532d", -0.03, kk);
              if (f >= cu(1, 0.55) - 4) tag(c, "counter: still 8 GB", 760, 500, 58, "#fee2e2", "#991b1b", 0.03, seg(f, cu(1, 0.55) - 4, cu(1, 0.55) + 4));
            }
          }
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
        void circlePts; void GREEN;
      }} />
    </>
  );
};

export const LOCAL_SCENES = { sk_local: StLocal };
