import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 23 "Three Lakhs on the Screen" (series/scripts/creative23_profit_bot.md): Sastry garu, a retired headmaster, put
// ₹2,00,000 into "AI Profit Bot" (a made-up app) from a WhatsApp group. It shows ₹3,11,593 after 15 days and wants an 18%
// "tax" (₹56,087) before he can withdraw. His daughter Pallavi, a chartered accountant, says it's a scam in the first
// seconds (Bujji, Skit 18 48h: the verdict first), then proves it: the balance is 2,00,000 × 1.03, fifteen times, to the
// rupee: a calculator painted green. If it were real, ₹2 lakh would be ~₹970 crore in a year. The fee is the product.
// The rule: a fixed daily profit or a fee to withdraw = scam; don't pay; check SEBI; call 1930. The loop: he asks the
// app to take the tax from his balance; "Tax must be paid separately." Back to frame 1.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "sastry" | "pallavi"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "Courier New", monospace`;
const BAL = 311593, TAX = 56087;   // 2,00,000 × 1.03^15 and 18% of it
const inr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
const SASTRY: Record<number, [BillMood, BillArms]> = {
  1: ["shock", "phone"], 3: ["excited", "phone"], 6: ["shock", "up"], 9: ["angry", "phone"], 12: ["worried", "phone"],
};
const PALLAVI: Record<number, [BillMood, BillArms]> = {
  1: ["worried", "fold"], 2: ["calm", "fold"], 4: ["smug", "calc"], 5: ["calm", "calc"], 7: ["smug", "fold"], 8: ["calm", "rest"],
  10: ["calm", "fold"], 11: ["calm", "five"], 12: ["deadpan", "fold"],
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
const room = (c: Ctx, W: number, H: number, hook = false) => {
  c.fillStyle = "#e8eef5"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#d6c3a3"; c.fillRect(0, 1240, W, H - 1240); c.fillStyle = "#b9a27c"; c.fillRect(0, 1232, W, 12);   // the floor
  c.fillStyle = "#fff7ed"; rrect(c, 800, 330, 180, 210, 10); c.fill(); c.fillStyle = RED; c.fillRect(800, 330, 180, 40);   // a calendar
  if (!hook) { c.fillStyle = "#7c5a34"; rrect(c, 90, 330, 230, 170, 8); c.fill(); } if (!hook) { c.fillStyle = "#cbd5e1"; rrect(c, 104, 344, 202, 142, 6); c.fill(); c.font = SANS(22, 800); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("RETIREMENT, 2025", 205, 425); }   // a framed photo (render review: it peeked under frame 1's blocks)
};
// the app (screen space): "AI Profit Bot", made up; dayK animates the balance climbing day by day
const appScreen = (c: Ctx, x: number, y: number, w: number, h: number, day: number, wiggle: number, popup: number, f: number) => {
  c.save();
  c.fillStyle = "#0b1020"; rrect(c, x - 22, y - 22, w + 44, h + 44, 54); c.fill();
  c.beginPath(); rrect(c, x, y, w, h, 34); c.clip();
  c.fillStyle = "#052e16"; c.fillRect(x, y, w, h);
  c.fillStyle = "#14532d"; c.fillRect(x, y, w, 120);
  // a robot face icon + the name
  c.fillStyle = "#4ade80"; rrect(c, x + 30, y + 26, 70, 70, 16); c.fill();
  c.fillStyle = "#052e16"; [x + 52, x + 78].forEach((ex) => { c.beginPath(); c.arc(ex, y + 56, 8, 0, 7); c.fill(); }); c.fillRect(x + 50, y + 74, 30, 6);
  c.font = SANS(40, 900); c.fillStyle = "#f0fdf4"; c.textAlign = "left"; c.fillText("AI Profit Bot", x + 118, y + 74);
  const d = Math.max(0, Math.min(15, day)), bal = 200000 * Math.pow(1.03, d);
  c.font = SANS(30, 700); c.fillStyle = "#86efac"; c.fillText(`Balance · day ${Math.round(d)}`, x + 36, y + 180);
  const fs = fit(c, inr(bal), w - 72, 96); c.font = SANS(fs, 900); c.fillStyle = "#f0fdf4"; c.fillText(inr(bal), x + 36, y + 280);
  c.font = SANS(34, 800); c.fillStyle = "#4ade80"; c.fillText("▲ +3.00% today · AI trading", x + 36, y + 336);
  // the curve: a perfect 3%-a-day line; `wiggle` overlays a real market's line for contrast
  const gx = x + 36, gy = y + 380, gw = w - 72, gh = 300;
  c.strokeStyle = "rgba(134,239,172,0.2)"; c.lineWidth = 2; for (let q = 0; q <= 4; q++) { c.beginPath(); c.moveTo(gx, gy + (gh * q) / 4); c.lineTo(gx + gw, gy + (gh * q) / 4); c.stroke(); }
  const yOf = (v: number) => gy + gh - ((v - 200000) / (BAL - 200000)) * (gh - 20);
  c.strokeStyle = "#4ade80"; c.lineWidth = 8; c.beginPath();
  for (let t = 0; t <= d; t += 0.25) { const px = gx + (gw * t) / 15, py = yOf(200000 * Math.pow(1.03, t)); t ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
  if (wiggle > 0) {
    c.save(); c.globalAlpha = clamp(wiggle * 3); c.strokeStyle = "#fbbf24"; c.lineWidth = 9; c.beginPath();
    const R = rng(77);
    let v = 230000; for (let t = 0; t <= 15; t++) { v *= 1 + (R() - 0.45) * 0.14; const px = gx + (gw * t) / 15, py = Math.min(gy + gh, Math.max(gy, yOf(v))); t ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    c.font = SANS(40, 900); c.fillStyle = "#fbbf24"; c.fillText("a real market: up AND down", gx, gy + gh + 54); c.restore();
  }
  c.fillStyle = "#4ade80"; rrect(c, x + 36, y + h - 140, w - 72, 96, 20); c.fill();
  c.font = SANS(42, 900); c.fillStyle = "#052e16"; c.textAlign = "center"; c.fillText("WITHDRAW", x + w / 2, y + h - 78);
  if (popup > 0) {   // the "tax" wall
    c.fillStyle = `rgba(0,0,0,${0.55 * clamp(popup * 3)})`; c.fillRect(x, y, w, h);
    c.save(); c.globalAlpha = clamp(popup * 3); const py = y + 200, ph = 560;
    c.fillStyle = "#fff"; rrect(c, x + 28, py, w - 56, ph, 26); c.fill();
    c.fillStyle = RED; rrect(c, x + 28, py, w - 56, 96, 26); c.fill(); c.fillRect(x + 28, py + 60, w - 56, 36);
    c.font = SANS(38, 900); c.fillStyle = "#fff"; c.fillText("WITHDRAWAL ON HOLD", x + w / 2, py + 62);
    c.font = SANS(44, 800); c.fillStyle = INK; c.fillText("Pay 18% tax first", x + w / 2, py + 165);
    c.font = SANS(96, 900); c.fillStyle = RED; c.fillText(inr(TAX), x + w / 2, py + 300);
    c.fillStyle = RED; rrect(c, x + 80, py + 380, w - 160, 100, 20); c.fill();
    c.font = SANS(44, 900); c.fillStyle = "#fff"; c.fillText("PAY NOW", x + w / 2, py + 446);
    c.font = SANS(26, 700); c.fillStyle = "#64748b"; c.fillText("offer ends in 23:59", x + w / 2, py + 528);
    c.restore();
  }
  c.restore();
  void f;
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 36, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 264);
  const fs = fit(c, big, 430, 100); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 384);
};

// ---------- the scene ----------
const StProfit: React.FC<SP> = ({ s }) => {
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
    if (!["wide", "hook"].includes(b.shot) && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.18} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.8} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.35} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.2} />, <Sfx key={k("h")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "verdict") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.4)} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "app") [0, 6, 12, 18, 24].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q} src="audio/sfx_tick.wav" vol={0.22} />));
    if (b.prop === "trick") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "calc") { const c1 = cue(i, 1, 0.5); [0, 4, 8, 12, 16, 20].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 6 + q * 2} src="audio/sfx_tick.wav" vol={0.25} />)); sfx.push(<Sfx key={k("n")} at={c1 - 3} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.75} />, <Sfx key={k("d")} at={c1 + 14} src="audio/gag_ding.wav" vol={0.3} />); }
    if (b.prop === "same") sfx.push(<Sfx key={k("c")} at={at} src={CLAP} vol={0.3} />);
    if (b.prop === "peel") sfx.push(<Sfx key={k("g")} at={cue(i, 1, 0.5) - 4} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "crore") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("r")} at={Math.max(0, c1 - 30)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("n")} at={c1} src="reel/sfx_boom.wav" vol={te ? 0.65 : 0.8} />); }
    if (b.prop === "fee") sfx.push(<Sfx key={k("z")} at={at + 2} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "cases") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.25} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 12)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 14)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.55} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.2)} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("z")} at={cue(i, 1, 0.3)} src="reel/sfx_buzz.wav" vol={0.25} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(2323 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "app") {   // the app, the balance climbing day by day
          c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H);
          const day = b.prop === "app" ? 15 * easeOut(seg(f, ln.from, ln.from + 30)) : 15;
          appScreen(c, 200, 240, 680, 1180, day, b.prop === "trick" ? seg(f, cu(1, 0.4), cu(1, 0.4) + 10) : 0, 0, f);
          if (b.prop === "trick") stamp(c, "EVERY DAY: EXACTLY +3.00%", W / 2, 1130, "#f59e0b", seg(f, cu(1, 0.5), cu(1, 0.5) + 8), 50, -0.05);
          chip(c, "AI Profit Bot: a made-up app", W / 2, 1470, "#334155", "#f8fafc", 1, 36);
        } else if (b.shot === "calc") {   // Pallavi's calculator against the app
          dark(c, W, H, "PALLAVI'S CALCULATOR", ["₹2,00,000 · +3% a day · 15 days"], "#fde68a");
          const steps = Math.floor(15 * seg(f, ln.from + 2, ln.from + 32));
          c.font = MONO(50, 700); c.fillStyle = "#e2e8f0"; c.textAlign = "left";
          c.fillText("2,00,000", 110, 520);
          for (let q = 0; q < steps; q++) { c.fillText("×1.03", 110 + (q % 5) * 176, 600 + Math.floor(q / 5) * 68); }
          const kr = seg(f, Math.min(cu(1, 0.5), ln.from + 36), Math.min(cu(1, 0.5), ln.from + 36) + 8);   // render review: the answer was up under 4 s
          if (kr > 0) {
            c.save(); c.globalAlpha = clamp(kr * 3);
            c.fillStyle = "#fde68a"; rrect(c, 100, 820, W - 200, 170, 24); c.fill();
            c.font = SANS(40, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText("= ", W / 2 - 230, 930);
            c.font = SANS(110, 900); c.fillText(inr(BAL), W / 2 + 40, 945);
            c.restore();
          }
          const ks = seg(f, Math.min(cu(1, 0.5), ln.from + 36) + 10, Math.min(cu(1, 0.5), ln.from + 36) + 18);
          if (ks > 0) {
            c.save(); c.globalAlpha = clamp(ks * 3);
            c.fillStyle = "#052e16"; rrect(c, 100, 1060, W - 200, 170, 24); c.fill();
            c.font = SANS(36, 800); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("the app's balance, day 15", W / 2, 1115);
            c.font = SANS(80, 900); c.fillStyle = "#f0fdf4"; c.fillText(inr(BAL) + "  ✓", W / 2, 1200);
            c.restore();
            chip(c, "to the rupee", W / 2, 1330, "#4ade80", "#052e16", ks, 46);
          }
        } else if (b.shot === "peel") {   // the green paint comes off: a calculator underneath
          c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H);
          const kp = seg(f, cu(1, 0.4), cu(1, 0.4) + 14);
          // the calculator underneath
          c.fillStyle = "#334155"; rrect(c, 200, 240, 680, 1180, 50); c.fill();
          c.fillStyle = "#a3b18a"; rrect(c, 250, 300, 580, 220, 16); c.fill();
          c.font = MONO(74, 900); c.fillStyle = INK; c.textAlign = "right"; c.fillText("311593", 800, 450);
          for (let q = 0; q < 16; q++) { const bx = 260 + (q % 4) * 145, by = 580 + Math.floor(q / 4) * 190; c.fillStyle = q % 4 === 3 ? "#f59e0b" : "#e2e8f0"; rrect(c, bx, by, 120, 150, 18); c.fill(); c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(["7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "=", "%"][q], bx + 60, by + 96); }
          // the app as a sheet sliding off
          c.save(); c.translate(1100 * easeOut(kp), -200 * easeOut(kp)); c.rotate(0.35 * kp);
          appScreen(c, 200, 240, 680, 1180, 15, 0, 0, f);
          c.restore();
          stamp(c, "A CALCULATOR, PAINTED GREEN", W / 2, 560, "#f59e0b", seg(f, cu(1, 0.4) + 10, cu(1, 0.4) + 18), 50, -0.04);
        } else if (b.shot === "crore") {
          dark(c, W, H, "IF +3% A DAY WERE REAL", ["₹2,00,000, every day, for one year"], "#fde68a");
          const c1 = cu(1, 0.5);
          const days = Math.round(365 * easeOut(seg(f, ln.from + 6, c1)));
          const v = 200000 * Math.pow(1.03, days);
          c.font = SANS(44, 800); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(`day ${days}`, W / 2, 620);
          const txt = days >= 365 ? "₹970 CRORE" : inr(v);
          const fs = fit(c, txt, W - 120, 140); c.font = SANS(fs, 900); c.fillStyle = days >= 365 ? "#4ade80" : "#f8fafc"; c.fillText(txt, W / 2, 800);
          tag(c, "no market on earth does this", W / 2, 1000, 50, "#fecaca", "#7f1d1d", -0.03, seg(f, c1 + 10, c1 + 18));
        } else if (b.shot === "popup") {
          c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H);
          appScreen(c, 200, 240, 680, 1180, 15, 0, 1, f);
        } else if (b.shot === "cases") {
          dark(c, W, H, "THE \"TAX\" IS THE PRODUCT", ["fake trading apps, police cases in 2026:"], "#fca5a5");
          ([["Mumbai", "₹5 lakh \"to activate\" a withdrawal"], ["Mumbai", "a 5% \"tax\" before withdrawing"], ["Hyderabad", "\"AI\" platform: charge after charge"]] as [string, string][]).forEach(([a, bb], q) => {
            const k = seg(f, ln.from + 4 + q * 8, ln.from + 12 + q * 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 470 + q * 190;
            c.fillStyle = "#1e293b"; rrect(c, 70, y, W - 140, 160, 22); c.fill();
            c.font = SANS(34, 900); c.fillStyle = "#fca5a5"; c.textAlign = "left"; c.fillText(a, 110, y + 56); c.font = SANS(42, 800); c.fillStyle = "#f8fafc"; c.fillText(bb, 110, y + 120);
            c.restore();
          });
          chip(c, "no real platform makes you pay tax to withdraw", W / 2, 1100, "#fde68a", INK, seg(f, ln.from + 8, ln.from + 16), 40);   // render review: some platforms deduct TDS; none asks you to pay first
          stamp(c, "THAT \"TAX\" IS THE SCAM", W / 2, 1230, RED, seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 56, -0.04);
          c.save(); c.globalAlpha = seg(f, ln.from + 20, ln.from + 28); c.font = SANS(30, 700); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText("as reported by the Free Press Journal and Etemaad Daily", W / 2, 1370); c.restore();
        } else if (b.shot === "rule") {
          dark(c, W, H, "TWO SIGNS OF A SCAM", ["AI or not"], "#fde68a");
          const c1 = cu(1, 0.4);
          ([["THE SAME EXACT % EVERY DAY", "#fecaca", ln.from - 30], ["A \"TAX\" OR FEE TO WITHDRAW", "#fecaca", ln.from - 22]] as [string, string, number][]).forEach(([a, bg, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 450 + q * 170;
            c.fillStyle = bg; rrect(c, 80, y, W - 160, 140, 22); c.fill();
            const fs = fit(c, a, W - 220, 54); c.font = SANS(fs, 900); c.fillStyle = "#7f1d1d"; c.textAlign = "center"; c.fillText(a, W / 2, y + 90);
            c.restore();
          });
          ([["Don't pay more", ""], ["Call 1930 now", "report fast: money may still be held"], ["Before you invest: sebi.gov.in", "SEBI, the market regulator"]] as [string, string][]).forEach(([a, bb], q) => {   // script review: 1930 first for a dad who already paid
            const k = seg(f, q < 2 ? ln.from + 4 + q * 16 : c1, (q < 2 ? ln.from + 12 + q * 16 : c1 + 8)); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 820 + q * 150;
            c.fillStyle = "#dcfce7"; rrect(c, 80, y, W - 160, 128, 22); c.fill();
            c.font = SANS(48, 900); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText(a, W / 2, y + (bb ? 58 : 82)); if (bb) { c.font = SANS(36, 800); c.fillText(bb, W / 2, y + 108); }
            c.restore();
          });
        } else if (b.shot === "chat" && !loopOn) {   // he asks the app to take the tax from his balance
          c.fillStyle = "#e5ddd5"; c.fillRect(0, 0, W, H);
          c.fillStyle = "#14532d"; c.fillRect(0, 0, W, 370);
          c.font = SANS(46, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("AI Profit Bot · support", 60, 320);   // stills: it sat under the title bar
          const bub = (x: number, y: number, w: number, ls2: string[], mine: boolean, k: number) => {
            if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3); const hh = 40 + ls2.length * 58;
            c.fillStyle = mine ? "#dcf8c6" : "#fff"; rrect(c, x, y, w, hh, 22); c.fill();
            c.font = SANS(44, 700); c.fillStyle = INK; c.textAlign = "left"; ls2.forEach((t, q) => c.fillText(t, x + 26, y + 66 + q * 58)); c.restore();
          };
          bub(240, 420, 780, ["Please cut the tax from", "my ₹3,11,593 balance."], true, seg(f, ln.from + 2, ln.from + 10));
          bub(60, 640, 820, ["Sorry sir, tax must be", "paid separately."], false, seg(f, cu(1, 0.2), cu(1, 0.2) + 8));
        } else {
          // ---------- the living room ----------
          const hookOn = b.prop === "hook" || loopOn;
          const z = 1 + 0.025 * p;
          const shake = (b.prop === "hook" && p < 0.1) || (loopOn && f < slam + 10) ? 8 : 0;
          c.save(); c.translate(W / 2 + (shake ? (r() - 0.5) * shake : 0), H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
          room(c, W, H, hookOn);
          const [sm, sa] = hookOn ? (["shock", "phone"] as [BillMood, BillArms]) : SASTRY[n] ?? ["worried", "phone"];
          const [pm, pa] = hookOn ? (["worried", "fold"] as [BillMood, BillArms]) : PALLAVI[n] ?? ["calm", "fold"];
          const sc = hookOn ? 0.6 : 0.72, yy = hookOn ? 1250 : 1330;
          person(c, "sastry" as BillWho, [hookOn ? 200 : 300, yy], sc, sm, sa, b.who === "sastry" && talking, r);   // frame 1: either side of the phone
          person(c, "pallavi" as BillWho, [hookOn ? 885 : 790, yy], sc, pm, pa, b.who === "pallavi" && talking, r);
          c.restore();
          if (hookOn) {
            block(c, 50, "THE AI APP SAYS HE HAS", inr(BAL), "#4ade80");   // script review: frame 1 never said "AI"
            block(c, 560, "HE CAN TAKE OUT", "₹0", "#f87171");
            c.save(); c.translate(540, 450); c.scale(0.64, 0.64); appScreen(c, -340, 0, 680, 1180, 15, 0, 1, f); c.restore();   // stills: at 0.7 it covered both faces
          }
          if (b.prop === "verdict") stamp(c, "SCAM", 540, 560, RED, seg(f, cu(1, 0.4) - 6, cu(1, 0.4) + 2), 120, -0.1);
          if (b.prop === "verdict") chip(c, "profit every single day = a scam, AI or not", 540, 760, "#fde68a", INK, seg(f, cu(1, 0.4) + 6, cu(1, 0.4) + 14), 38);
          if (n === 2) { chip(c, "a made-up family", 540, 880, "rgba(15,23,42,0.88)", "#f8fafc", 1, 38); chip(c, "the pattern: real 2026 police cases", 540, 960, "rgba(15,23,42,0.88)", "#f8fafc", 1, 38); }   // stills: they sat on Sastry's head
        }
      }} />
    </>
  );
};

export const PROFIT_SCENES = { sk_profit: StProfit };
