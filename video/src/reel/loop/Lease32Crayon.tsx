import React from "react";
import { Ctx, Pt, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";
import { fit, wrap, block, chip } from "./TutorialCrayon";

// Creative 32 "₹36,000, Said the AI. ₹44,000, Said Clause 11." (series/scripts/creative32_tenant.md): a nature-documentary
// parody (Creative 13's look: a hushed narrator, a REC viewfinder, a lower third). Anusha, a tenant packing for a job in
// Pune, asks an AI what moving out after 4 months will cost. It says ₹36,000 (the lock-in); clause 11 also takes ₹8,000
// for painting: ₹44,000, so ₹10,000 of her ₹54,000 deposit comes back, not ₹18,000. Our test (a made-up agreement, a small
// free AI): ₹36,000 10/10, the painting 0/10; asked for every amount with its clause number: the painting 10/10.
// Texts from the spec (data.t), copied from series/scripts/creative32_demo/summary.json.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "narrator" | "anusha"; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const JUNGLE = "reel/creative13v1/jungle.wav";
const GREEN = "#16a34a", RED = "#dc2626", AMBER = "#f59e0b";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const SERIF = (s: number, w = 700) => `${w} ${s}px Georgia, "Times New Roman", serif`;
const MOOD: Record<string, [BillMood, BillArms]> = {
  hook: ["worried", "phone"], wild: ["calm", "up"], ask: ["worried", "phone"], reply: ["calm", "phone"], relief: ["happy", "five"],
  shock: ["shock", "up"], loop: ["worried", "phone"],
};

// ---------- the documentary look ----------
const timecode = (f: number) => { const t = 11 * 30 + f; return `00:32:${String(Math.floor(t / 30) % 60).padStart(2, "0")}:${String(t % 30).padStart(2, "0")}`; };
const docFrame = (c: Ctx, f: number) => {
  c.save(); c.fillStyle = "#14532d"; c.globalAlpha = 0.9;
  [[-30, 1220, 150, 250, 0.5], [50, 1340, 110, 180, 0.9], [1100, 230, 160, 240, -0.6], [1020, 150, 100, 170, -0.2], [-30, 200, 110, 190, 0.3]].forEach(([x, y, rx, ry, rot]) => {
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill();
  });
  c.restore();
  c.save(); c.strokeStyle = "#ffffff"; c.lineWidth = 7; c.globalAlpha = 0.85;
  [[60, 230, 1, 1], [1020, 230, -1, 1], [60, 1340, 1, -1], [1020, 1340, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * 70); c.lineTo(x, y); c.lineTo(x + sx * 70, y); c.stroke();
  });
  c.restore();
  c.fillStyle = "rgba(0,0,0,0.55)"; rrect(c, 84, 250, 150, 54, 14); c.fill(); rrect(c, 716, 250, 290, 54, 14); c.fill();
  if (Math.floor(f / 15) % 2 === 0) { c.beginPath(); c.arc(112, 277, 14, 0, 7); c.fillStyle = "#ef4444"; c.fill(); }
  c.font = SANS(32, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("REC", 136, 289);
  c.font = `700 30px "Courier New", monospace`; c.textAlign = "right"; c.fillText(timecode(f), 990, 288);
};
const lowerThird = (c: Ctx, title: string, sub: string, k: number, r: () => number, y = 1170) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(-40 * (1 - easeOut(k)), 0);
  c.fillStyle = "rgba(10,20,12,0.85)"; rrect(c, 40, y, 860, sub ? 160 : 110, 14); c.fill();
  c.fillStyle = "#84cc16"; c.beginPath(); c.ellipse(100, y + 55, 22, 38, 0.6, 0, 7); c.fill();
  stroke(c, [[84, y + 82], [116, y + 28]], "#365314", 4, r, { passes: 1 });
  c.font = SERIF(fit(c, title, 720, 56)); c.fillStyle = "#f7fee7"; c.textAlign = "left"; c.fillText(title, 150, y + 76);
  if (sub) { c.font = SERIF(fit(c, sub, 720, 38, 400), 400); c.fillStyle = "#d9f99d"; c.fillText(sub, 150, y + 134); }
  c.restore();
};
// the flat: a wall, a window, a floor, taped boxes
const room = (c: Ctx, W: number, H: number, r: () => number) => {
  c.fillStyle = "#e7dcc8"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#cbb89a"; c.fillRect(0, 1180, W, H - 1180);
  c.fillStyle = "#bae6fd"; rrect(c, 640, 560, 330, 380, 10); c.fill();
  c.strokeStyle = "#78716c"; c.lineWidth = 12; rrect(c, 640, 560, 330, 380, 10); c.stroke();
  c.beginPath(); c.moveTo(805, 560); c.lineTo(805, 940); c.moveTo(640, 750); c.lineTo(970, 750); c.stroke();
  const box = (x: number, y: number, w: number, h: number, label: string, rot = 0) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = "#c08a4e"; rrect(c, -w / 2, -h, w, h, 6); c.fill();
    c.fillStyle = "#a16207"; c.fillRect(-w / 2, -h, w, 18);
    c.fillStyle = "rgba(254,243,199,0.85)"; c.fillRect(-14, -h, 28, h);
    c.font = SANS(fit(c, label, w - 30, 34, 900), 900); c.fillStyle = "#1c1917"; c.textAlign = "center"; c.fillText(label, 0, -h / 2 + 12);
    stroke(c, [[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w / 2, 0], [-w / 2, -h]] as Pt[], "#78350f", 4, r, { passes: 1, alpha: 0.6 });
    c.restore();
  };
  box(150, 1250, 230, 200, "KITCHEN"); box(150, 1050, 200, 170, "BOOKS", -0.04); box(940, 1260, 240, 210, "CLOTHES"); box(910, 1050, 180, 150, "FRAGILE", 0.05);
};
const SUM = (c: Ctx, x: number, y: number, rows: [string, string][], total: string, totalCol: string, k: number, strike = "") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(-0.03);
  const h = 120 + rows.length * 72 + 110;
  c.fillStyle = "#fef08a"; rrect(c, -330, 0, 660, h, 10); c.fill();
  c.fillStyle = "rgba(0,0,0,0.08)"; c.fillRect(-330, 0, 660, 34);
  rows.forEach(([a, b], q) => {
    c.font = SANS(52, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a, -290, 110 + q * 72);
    c.font = SANS(fit(c, b, 300, 34, 700), 700); c.fillStyle = "#57534e"; c.textAlign = "right"; c.fillText(b, 300, 108 + q * 72);
  });
  const yt = 110 + rows.length * 72;
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(-290, yt - 40); c.lineTo(300, yt - 40); c.stroke();
  c.font = SANS(78, 900); c.fillStyle = totalCol; c.textAlign = "left"; c.fillText(total, -290, yt + 50);
  if (strike) { c.font = SANS(52, 800); c.fillStyle = "#78716c"; c.textAlign = "right"; c.fillText(strike, 300, yt + 40); c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.moveTo(300 - c.measureText(strike).width - 8, yt + 22); c.lineTo(308, yt + 22); c.stroke(); }
  c.restore();
};
// the phone (screen space): the chat
const PH = { x: 150, y: 330, w: 780, h: 840 };
const phone = (c: Ctx) => {
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, PH.x + 12, PH.y + 14, PH.w, PH.h, 56); c.fill();
  c.fillStyle = "#111827"; rrect(c, PH.x, PH.y, PH.w, PH.h, 56); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, PH.x + 22, PH.y + 22, PH.w - 44, PH.h - 44, 40); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, PH.x + 22, PH.y + 22, PH.w - 44, 100, 40); c.fill(); c.fillRect(PH.x + 22, PH.y + 80, PH.w - 44, 42);
  c.font = SANS(40, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", PH.x + 64, PH.y + 90);
  c.font = SANS(32, 800); c.fillStyle = "#e0e7ff"; c.textAlign = "right"; c.fillText("small free AI", PH.x + PH.w - 60, PH.y + 90);
};
const bubble = (c: Ctx, text: string, y: number, me: boolean, typed: number, lit = "", size = 38) => {
  c.font = SANS(size, 600);
  const shown = text.slice(0, Math.round(text.length * clamp(typed)));
  const ls = wrap(c, shown || " ", 560);
  const lh = size * 1.32, h = ls.length * lh + 36, x = me ? PH.x + PH.w - 50 - 620 : PH.x + 50;
  c.fillStyle = me ? "#2563eb" : "#e5e7eb"; rrect(c, x, y, 620, h, 28); c.fill();
  ls.forEach((t, q) => {
    const yy = y + 22 + lh * 0.78 + q * lh;
    c.textAlign = "left";
    if (lit && !me) {   // paint the lit words yellow behind
      const words = lit.split(" ");
      const i = t.indexOf(words[0]);
      if (i >= 0 || words.some((w) => t.startsWith(w))) {
        const start = Math.max(0, i), end = Math.min(t.length, (t.indexOf(words[words.length - 1]) >= 0 ? t.indexOf(words[words.length - 1]) + words[words.length - 1].length : t.length));
        if (end > start && (lit.includes(t.slice(start, end)) || t.slice(start, end).includes(words[0]))) {
          const pre = c.measureText(t.slice(0, start)).width, w = c.measureText(t.slice(start, end)).width;
          c.fillStyle = "#fde047"; c.fillRect(x + 24 + pre - 4, yy - size * 0.95, w + 8, size * 1.25);
        }
      }
    }
    c.fillStyle = me ? "#fff" : INK; c.fillText(t, x + 24, yy);
  });
  return y + h;
};
const paper = (c: Ctx, x: number, y: number, w: number, h: number, rot: number, lines: string[], hiFrom = -1) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "rgba(0,0,0,0.18)"; rrect(c, -w / 2 + 10, 10, w, h, 8); c.fill();
  c.fillStyle = "#fffdf7"; rrect(c, -w / 2, 0, w, h, 8); c.fill();
  c.font = SERIF(30, 700); c.fillStyle = INK; c.textAlign = "center"; c.fillText("RENTAL AGREEMENT", 0, 56);
  c.font = SERIF(24, 400); c.textAlign = "left";
  lines.forEach((t, q) => { if (q >= hiFrom && hiFrom >= 0) return; c.fillStyle = "#57534e"; c.fillText(t, -w / 2 + 34, 100 + q * 34); });
  c.restore();
};
const grass = (c: Ctx, y: number, part: number, f: number) => {
  c.save();
  for (let q = 0; q < 46; q++) {
    const x = 20 + q * 23.5, side = x < 540 ? -1 : 1, d = Math.abs(x - 540) < 330 ? part : 0;
    const sway = Math.sin(f / 9 + q) * 10, lean = side * d * 260 * (1 - Math.abs(x - 540) / 520);
    c.strokeStyle = q % 3 ? "#3f6212" : "#4d7c0f"; c.lineWidth = 16; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, y + 420); c.quadraticCurveTo(x + sway / 2, y + 200, x + sway + lean, y - 60 - (q % 4) * 30); c.stroke();
  }
  c.restore();
};

const StLease: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, string>;
  const te = !!s.data.handle;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("j")} at={0} src={JUNGLE} vol={0.28} />, <Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.85} />, <Sfx key={k("z")} at={cue(i, 1, 0.5) - 3} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "wild") sfx.push(<Sfx key={k("w")} at={cue(i, 1, 0.4)} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "ask") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "reply") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "relief") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) + 10} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "lurk") sfx.push(<Sfx key={k("j")} at={at} src={JUNGLE} vol={0.25} />, <Sfx key={k("b")} at={cue(i, 1, 0.6) - 2} src="reel/sfx_boom.wav" vol={te ? 0.7 : 0.8} />);
    if (b.prop === "shock") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5) + 6} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "test") { const c1 = cue(i, 1, 0.4), c2 = cue(i, 2, 0.75); for (let q = 0; q < 10; q++) sfx.push(<Sfx key={k("t" + q)} at={c1 + q * 2} src="audio/sfx_tick.wav" vol={0.2} />); sfx.push(<Sfx key={k("b")} at={c2 - 2} src="reel/sfx_boom.wav" vol={0.75} />, <Sfx key={k("z")} at={c2 + 2} src="reel/sfx_buzz.wav" vol={0.3} />); }
    if (b.prop === "fix") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("d")} at={cue(i, 1, 0.45)} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("c")} at={cue(i, 2, 0.75)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3232 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        const talking = b.who === "anusha" && (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const her = (x: number, y: number, sc: number, key: string) => { const [m, a] = MOOD[key] ?? ["calm", "rest"]; person(c, "anusha" as BillWho, [x, y], sc, m, a, talking, r); };
        if (["hook", "wild", "relief", "shock", "loop"].includes(P)) room(c, W, H, r); else { c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H); }
        if (P === "hook") {
          her(540, 760, 0.62, "hook");
          block(c, 50, 330, "THE AI: MOVING OUT COSTS", "₹36,000", "#f87171");
          block(c, 560, 330, "HER AGREEMENT", "₹44,000", "#fbbf24");
          if (!loopOn) { const k1 = seg(f, cu(1, 0.5) - 3, cu(1, 0.5) + 7); if (k1 > 0 && k1 < 1) { c.save(); c.globalAlpha = 0.6 * (1 - k1); c.strokeStyle = AMBER; c.lineWidth = 10 + 10 * k1; rrect(c, 556 - 8 * k1, 326 - 8 * k1, 478 + 16 * k1, 168 + 16 * k1, 24); c.stroke(); c.restore(); } }
          chip(c, "a made-up agreement · a small free AI · our test", W / 2, 1290, "#1e293b", "#e2e8f0", 1, 36);
        } else if (P === "wild") {
          her(540, 780, 0.62, "wild");
          const kM = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
          if (kM > 0) {
            c.save(); c.globalAlpha = clamp(kM * 3); c.fillStyle = "#fffdf7"; rrect(c, 90, 340, 900, 200, 18); c.fill();
            c.font = SANS(54, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("HYDERABAD", 130, 430); c.textAlign = "right"; c.fillText("PUNE", 950, 430);
            c.strokeStyle = RED; c.lineWidth = 8; c.setLineDash([18, 14]); c.beginPath(); c.moveTo(470, 412); c.lineTo(470 + 220 * clamp(kM * 2), 412); c.stroke(); c.setLineDash([]);
            c.font = SANS(40, 800); c.fillStyle = "#7c3aed"; c.textAlign = "center"; c.fillText("MONTH 4 OF 11 · a new job", 540, 500);
            c.restore();
          }
          lowerThird(c, "WILD HYDERABAD", "the tenant, preparing to migrate", seg(f, ln.from + 4, ln.from + 14), r);
        } else if (P === "ask" || P === "reply") {
          docFrame(c, f);
          phone(c);
          const y1 = bubble(c, T.ask, PH.y + 160, true, P === "ask" ? seg(f, ln.from + 2, cu(1, 0.6)) : 1);
          if (P === "reply") {
            c.save(); c.globalAlpha = 0.9; [0, 1, 2].forEach((q) => { c.save(); c.translate(-30 + q * 14, 0); paper(c, 120, 1180 - q * 6, 200, 120, -0.2 + q * 0.06, []); c.restore(); }); c.restore();
            const kR = seg(f, ln.from + 4, cu(1, 0.4));
            bubble(c, T.reply, y1 + 30, false, kR, seg(f, cu(1, 0.4), cu(1, 0.4) + 4) > 0 ? T.lit : "", 38);
            chip(c, "14 clauses · all in the chat", 300, 1250, "#fffdf7", INK, seg(f, ln.from + 2, ln.from + 10), 34);
            chip(c, "its real reply", 780, 1250, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 34);
          } else chip(c, "her question, word for word", W / 2, 1250, "#1e293b", "#e2e8f0", seg(f, ln.from + 6, ln.from + 14), 36);
        } else if (P === "relief") {
          her(330, 820, 0.56, "relief");
          SUM(c, 700, 420, [["₹54,000", "deposit"], ["− ₹36,000", "lock-in (cl. 10)"]], "₹18,000 back", GREEN, seg(f, ln.from + 2, ln.from + 10));
          const kT = seg(f, cu(1, 0.5), cu(1, 0.5) + 6);
          if (kT > 0) { c.save(); c.globalAlpha = clamp(kT * 3); c.font = SANS(110, 900); c.fillStyle = GREEN; c.textAlign = "center"; c.fillText("✓", 940, 760); c.restore(); }
        } else if (P === "lurk") {
          c.fillStyle = "#14532d"; c.fillRect(0, 0, W, H);
          const zoom = 1 + 0.15 * seg(f, ln.from, endL);
          c.save(); c.translate(540, 760); c.scale(zoom, zoom); c.translate(-540, -760);
          const lines = ["1. Property: Flat 302 ...", "2. Term: 11 months ...", "3. Rent: Rs 18,000 per month ...", "5. Security deposit: Rs 54,000 ...", "9. Notice: one month's notice ...", "10. Lock-in: ... Rs 36,000 ...", "12. Renewal: ... 5%", "13. Access ...", "14. Keys ..."];
          paper(c, 540, 330, 860, 760, 0, lines);
          const kP = seg(f, cu(1, 0.6) - 6, cu(1, 0.6) + 10);
          if (kP > 0) {
            c.save(); c.globalAlpha = clamp(kP * 2);
            c.fillStyle = "#fde68a"; rrect(c, 140, 700, 800, 250, 14); c.fill();
            c.strokeStyle = AMBER; c.lineWidth = 6; rrect(c, 140, 700, 800, 250, 14); c.stroke();
            c.font = SERIF(34, 700); c.fillStyle = INK; c.textAlign = "left";
            wrap(c, T.c11, 740).forEach((t, q) => c.fillText(t, 170, 760 + q * 46));
            c.restore();
          }
          grass(c, 760, seg(f, cu(1, 0.6) - 10, cu(1, 0.6) + 10), f);
          c.restore();
          docFrame(c, f);
          lowerThird(c, "CLAUSE 11", "rarely seen · Rs 8,000 · repainting", seg(f, cu(1, 0.6) + 10, cu(1, 0.6) + 20), r);
        } else if (P === "shock") {
          her(300, 820, 0.56, "shock");
          SUM(c, 690, 380, [["₹54,000", "deposit"], ["− ₹36,000", "lock-in (cl. 10)"], ["− ₹8,000", "painting (cl. 11)"]], "₹10,000 back", RED, 1,
            seg(f, cu(1, 0.5), cu(1, 0.5) + 6) > 0 ? "₹18,000" : "");
          chip(c, "she pays ₹44,000, not ₹36,000", W / 2, 1290, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.5) + 10, cu(1, 0.5) + 18), 44);
        } else if (P === "test") {
          docFrame(c, f);
          c.font = SANS(fit(c, "OUR TEST · THE SAME QUESTION, 10 TIMES", W - 140, 54), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · THE SAME QUESTION, 10 TIMES", W / 2, 390);
          c.font = SANS(32, 700); c.fillStyle = "#e2e8f0"; c.fillText("a made-up agreement · a small free AI on our computer", W / 2, 440);
          const row = (y: number, label: string, ok: boolean, k0: number) => {
            c.font = SANS(44, 900); c.fillStyle = ok ? "#86efac" : "#fca5a5"; c.textAlign = "left"; c.fillText(label, 90, y);
            for (let q = 0; q < 10; q++) {
              const k = seg(f, k0 + q * 2, k0 + q * 2 + 4); if (k <= 0) continue;
              const x = 90 + (q % 5) * 182, yy = y + 30 + Math.floor(q / 5) * 120;
              c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = ok ? "#14532d" : "#7f1d1d"; rrect(c, x, yy, 164, 100, 16); c.fill();
              c.font = SANS(64, 900); c.fillStyle = ok ? "#86efac" : "#fca5a5"; c.textAlign = "center"; c.fillText(ok ? "✓" : "✗", x + 82, yy + 72); c.restore();
            }
          };
          row(540, "said ₹36,000 (the lock-in)", true, cu(1, 0.4));
          row(860, "named the ₹8,000 painting", false, cu(2, 0.75) - 20);
          const kZ = seg(f, cu(2, 0.75), cu(2, 0.75) + 6);
          if (kZ > 0) { c.save(); c.globalAlpha = clamp(kZ * 3); c.font = SANS(96, 900); c.fillStyle = "#f87171"; c.textAlign = "right"; c.fillText("0/10", 990, 858); c.restore(); }
          if (seg(f, cu(1, 0.4) + 20, cu(1, 0.4) + 26) > 0) { c.font = SANS(96, 900); c.fillStyle = "#4ade80"; c.textAlign = "right"; c.fillText("10/10", 990, 538); }
        } else if (P === "fix") {
          docFrame(c, f);
          chip(c, "ASK IT THIS", W / 2, 380, "#fde68a", INK, 1, 46);
          c.save(); c.fillStyle = "#2563eb"; rrect(c, 80, 430, 920, 230, 28); c.fill();
          c.font = SANS(38, 700); c.fillStyle = "#fff"; c.textAlign = "left";
          const typed = T.better.slice(0, Math.round(T.better.length * seg(f, ln.from + 2, cu(1, 0.45) - 6)));
          wrap(c, typed || " ", 860).forEach((t, q) => c.fillText(t, 110, 488 + q * 50)); c.restore();
          const k1 = seg(f, cu(1, 0.45), cu(1, 0.45) + 8);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.fillStyle = "#e5e7eb"; rrect(c, 80, 690, 920, 170, 28); c.fill();
            c.font = SANS(36, 700); c.fillStyle = INK; c.textAlign = "left"; wrap(c, T.found, 860).forEach((t, q) => c.fillText(t, 110, 746 + q * 48));
            c.font = SANS(64, 900); c.fillStyle = "#4ade80"; c.textAlign = "center"; c.fillText("10/10 found the painting", W / 2, 950); c.restore();
          }
          const k2 = seg(f, cu(2, 0.75), cu(2, 0.75) + 8);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3); c.fillStyle = "#fef08a"; rrect(c, 140, 1000, 800, 170, 14); c.fill();
            c.font = SANS(fit(c, "₹36,000 (cl. 10) + ₹8,000 (cl. 11) = ₹44,000", 740, 48, 900), 900); c.fillStyle = INK; c.textAlign = "center";
            c.fillText("₹36,000 (cl. 10) + ₹8,000 (cl. 11) = ₹44,000", W / 2, 1070);
            c.font = SANS(36, 800); c.fillStyle = "#57534e"; c.fillText("open those clauses · add them up yourself", W / 2, 1130); c.restore();
          }
        } else if (P === "loop") {
          c.fillStyle = "#d6cbb5"; c.fillRect(0, 0, W, H);
          c.fillStyle = "#7c2d12"; rrect(c, 300, 420, 480, 860, 12); c.fill();
          c.fillStyle = "#fde68a"; c.beginPath(); c.arc(720, 860, 18, 0, 7); c.fill();
          c.fillStyle = "#fffdf7"; rrect(c, 430, 480, 220, 90, 10); c.fill(); c.font = SANS(54, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("303", 540, 545);
          const kB = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          if (kB > 0) {
            c.save(); c.globalAlpha = clamp(kB * 3); c.fillStyle = "#2563eb"; rrect(c, 120, 640, 840, 150, 28); c.fill();
            c.font = SANS(38, 700); c.fillStyle = "#fff"; c.textAlign = "left"; wrap(c, "Moving out early. What will it cost me?", 780).forEach((t, q) => c.fillText(t, 150, 700 + q * 50)); c.restore();
          }
          docFrame(c, f);
          lowerThird(c, "WILD HYDERABAD", "flat 303 · another tenant", seg(f, ln.from + 4, ln.from + 14), r);
        }
        if (P === "hook" || P === "wild" || P === "relief" || P === "shock") docFrame(c, f);
        if (P === "hook") lowerThird(c, "WILD HYDERABAD", "", 1, r, 1180);
      }} />
    </>
  );
};

export const LEASE32_SCENES = { sk_lease32: StLease };
