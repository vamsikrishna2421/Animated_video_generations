import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, Mood, Pose } from "./HomeCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 27 "₹5,000 for 10 Grams, Says the AI" (series/scripts/creative27_gold_rate.md): a jewellery counter, Amma
// (Mom on the English page) and her son Chinnu buying his sister Divya's wedding necklace; the jeweller says nothing,
// his rate board does. Frame 1: "THE AI: ₹5,000" vs "THE BOARD: ₹1,28,150" for 10 g of 22-carat gold. Our test
// (series/scripts/creative27_demo/gold.json): a small free AI with no web search, asked today's price 10 times: 9 gave
// no price, 1 said "as of my last update in October 2023 ... INR 5,000" for 10 g; asked the date: "[current date]".
// Every reply on screen comes from the spec (data.t), copied from that test.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const GOLD = "#d4a017", RED = "#dc2626", GREEN = "#16a34a";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
// [Amma mood, pose, look], [Chinnu mood, pose, look] per line
const POSE: Record<number, [[Mood, Pose, number], [Mood, Pose, number]]> = {
  1: [["shock", "tap", 1], ["worried", "rest", -1]], 2: [["stern", "phone", 1], ["explain", "open", -1]], 3: [["sus", "rest", 1], ["explain", "phone", 2]],
  4: [["stern", "rest", 1], ["puzzled", "phone", -1]], 5: [["puzzled", "rest", 1], ["explain", "open", -1]], 6: [["stern", "tap", 2], ["puzzled", "rest", -1]],
  7: [["shock", "phone", 2], ["smug", "rest", -1]], 8: [["puzzled", "rest", 1], ["explain", "open", -1]], 9: [["worried", "rest", 1], ["explain", "open", -1]],
  10: [["sweet", "rest", 1], ["explain", "open", -1]], 11: [["smug", "tap", 2], ["worried", "rest", -1]],
};

const block = (c: Ctx, x: number, y: number, top: string, big: string, col: string, k = 1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#111827"; rrect(c, x, y, 470, 170, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, top, 430, 34, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(top, x + 235, y + 52);
  c.font = SANS(fit(c, big, 430, 84, 900), 900); c.fillStyle = col; c.fillText(big, x + 235, y + 140);
  c.restore();
};
const shop = (c: Ctx, W: number, r: () => number, rate: string, date: string) => {
  c.fillStyle = "#f6d9a8"; c.fillRect(0, 440, W, 760);   // the wall
  c.fillStyle = "#b45309"; c.fillRect(0, 440, W, 18);
  // the rate board
  c.fillStyle = "#3b1d0a"; rrect(c, 300, 490, 480, 220, 16); c.fill(); c.fillStyle = GOLD; rrect(c, 312, 502, 456, 196, 12); c.fill();
  c.fillStyle = "#3b1d0a"; c.textAlign = "center"; c.font = SANS(28, 900); c.fillText("TODAY'S RATE · " + date, 540, 548);
  c.font = SANS(30, 800); c.fillText("22 CARAT · 10 g", 540, 594); c.font = SANS(60, 900); c.fillText(rate, 540, 668);
  // lamps
  [130, 950].forEach((x) => { c.fillStyle = "#fde68a"; c.beginPath(); c.arc(x, 520, 26, 0, 7); c.fill(); stroke(c, [[x, 458], [x, 494]], "#7c2d12", 4, r, { passes: 1 }); });
};
const counter = (c: Ctx, W: number, r: () => number) => {
  c.fillStyle = "#7c2d12"; c.fillRect(0, 1180, W, 30);   // the counter top
  c.fillStyle = "rgba(186,230,253,0.55)"; c.fillRect(0, 1210, W, 290);   // the glass front
  for (let i = 0; i < 4; i++) {   // necklaces inside
    const x = 150 + i * 260;
    c.fillStyle = "#7f1d1d"; rrect(c, x - 90, 1250, 180, 200, 14); c.fill();
    stroke(c, circlePts(x, 1290, 70, 90, 0.2, Math.PI - 0.2, 16), GOLD, 9, r, { passes: 1 });
    c.fillStyle = GOLD; c.beginPath(); c.arc(x, 1384, 14, 0, 7); c.fill();
  }
  stroke(c, [[0, 1210], [W, 1210]], "#e0f2fe", 4, r, { passes: 1, alpha: 0.8 });
  // the wedding necklace on the velvet tray
  c.fillStyle = "#991b1b"; rrect(c, 380, 1110, 320, 80, 16); c.fill();
  stroke(c, circlePts(540, 1110, 120, 60, 0.15, Math.PI - 0.15, 18), GOLD, 10, r, { passes: 2 });
  c.fillStyle = "#16a34a"; c.beginPath(); c.arc(540, 1170, 12, 0, 7); c.fill();
};
const card = (c: Ctx, W: number, k: number) => {   // a dark card over the shop for inserts
  c.save(); c.globalAlpha = clamp(k * 3) * 0.92; c.fillStyle = "#0b1220"; c.fillRect(0, 440, W, 1060); c.restore();
};
const bubble = (c: Ctx, x: number, y: number, w: number, text: string, me: boolean, k: number, size = 36, hiFrom = -1, hiK = 0) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const lines = wrap(c, text, w - 60);
  const h = lines.length * size * 1.3 + 36;
  c.fillStyle = me ? "#dcf8c6" : "#ffffff"; rrect(c, x, y, w, h, 18); c.fill();
  c.fillStyle = INK; c.textAlign = "left";
  lines.forEach((l, i) => {
    const yy = y + 22 + (i + 1) * size * 1.3 - size * 0.3;
    if (hiFrom >= 0 && i >= hiFrom && hiK > 0) { c.save(); c.globalAlpha = 0.45 * clamp(hiK * 3); c.fillStyle = "#fde047"; c.fillRect(x + 22, yy - size * 0.95, c.measureText(l).width + 10, size * 1.2); c.restore(); }
    c.fillStyle = INK; c.fillText(l, x + 28, yy);
  });
  c.restore();
  return y + h + 18;
};

const StGold: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={cue(i, 1, 0.5) - 6} src="audio/sfx_chaching.wav" vol={0.5} />);
    if (b.prop === "line") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.4} />, <Sfx key={k("p")} at={cue(i, 1, 0.4) - 4} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "compare") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.4) - 8} src="reel/sfx_boom.wav" vol={0.8} />);
    if (b.prop === "date") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.5} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.45} />, <Sfx key={k("n")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.6) - 4} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(2701 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const n = loopOn ? 1 : b.n;
        c.fillStyle = "#1f130a"; c.fillRect(0, 0, W, H);
        // the two prices, always on top (frame 1 reads with the sound off)
        block(c, 50, 245, "THE AI says", "₹5,000", "#f87171");
        block(c, 560, 245, "THE BOARD says", T.rate, "#4ade80");
        c.fillStyle = "#fde68a"; c.textAlign = "center"; c.font = SANS(30, 800); c.fillText("for the same thing: 10 g of 22-carat gold · today", W / 2, 455);
        c.save(); c.translate(0, 30);
        shop(c, W, r, T.rate, T.date);
        const [pa, pc] = POSE[n] ?? POSE[1];
        const talkA = b.who === "amma" && !loopOn, talkC = b.who === "chinnu";
        c.save(); c.translate(-20, 150); person(c, "amma", pa[0], pa[1], pa[2], talkA && Math.floor(f / 4) % 2 === 0, 0.5, f, r); c.restore();
        c.save(); c.translate(20, 150); person(c, "chinnu", pc[0], pc[1], pc[2], talkC && Math.floor(f / 4) % 2 === 0, 0.5, f, r); c.restore();
        counter(c, W, r);
        c.restore();
        const P = loopOn ? "hook" : b.prop;
        const chatOn = P === "chat1" || P === "chat2" || (P === "compare" && f < cu(1, 0.35) - 2);
        if (chatOn) {   // the AI's real reply (our test, try 8), the line Chinnu reads lit up
          card(c, W, P === "chat1" ? seg(f, ln.from - 2, ln.from + 4) : 1);
          c.fillStyle = "#075e54"; rrect(c, 60, 480, W - 120, 80, 18); c.fill(); c.font = SANS(34, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("AI chat · a small free AI · no web search", 90, 532);
          let y = bubble(c, 300, 585, W - 360, T.ask, true, 1, 30);
          const lit = P === "chat1" ? 0 : P === "chat2" ? 2 : 1, kl = seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 4);
          c.save(); c.fillStyle = "#ffffff"; rrect(c, 60, y, W - 150, 640, 18); c.fill(); c.restore();
          (T.chunks as string[]).forEach((t, q) => {
            c.font = SANS(31, q === lit ? 800 : 600); const lines = wrap(c, t, W - 230);
            lines.forEach((l, li) => {
              const yy = y + 50 + li * 40;
              if (q === lit && kl > 0) { c.save(); c.globalAlpha = 0.5 * clamp(kl * 3); c.fillStyle = "#fde047"; c.fillRect(84, yy - 30, c.measureText(l).width + 12, 40); c.restore(); }
              c.fillStyle = q === lit ? INK : "#475569"; c.fillText(l, 90, yy);
            });
            y += lines.length * 40 + 22;
          });
        } else if (P === "date") {   // "[current date]", big, held (readable with the sound off)
          card(c, W, seg(f, ln.from - 2, ln.from + 4));
          c.fillStyle = "#075e54"; rrect(c, 60, 480, W - 120, 80, 18); c.fill(); c.font = SANS(34, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("AI chat · a small free AI · no web search", 90, 532);
          bubble(c, 400, 600, W - 460, "What is today's date?", true, 1, 36);
          const kd = seg(f, ln.from + 4, ln.from + 12);
          if (kd > 0) {
            c.save(); c.globalAlpha = clamp(kd * 3); c.fillStyle = "#ffffff"; rrect(c, 60, 760, W - 120, 330, 24); c.fill();
            c.textAlign = "center"; c.font = SANS(48, 800); c.fillStyle = INK; c.fillText("Today's date is", W / 2, 860);
            c.font = SANS(fit(c, "[current date].", W - 200, 96), 900); c.fillStyle = RED; c.fillText("[current date].", W / 2, 990);
            c.restore();
          }
          chip(c, "9 of 10 times, word for word", W / 2, 1180, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.5) + 8, cu(1, 0.5) + 16), 38);
        } else if (P === "label") {
          chip(c, "a small free AI on our computer", W / 2, 1360, "#1e293b", "#f8fafc", seg(f, ln.from, ln.from + 8), 36);
          chip(c, "no internet · no calendar · no live rates", W / 2, 1440, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), 36);
        } else if (P === "compare") {
          card(c, W, 1);
          c.textAlign = "center"; c.font = SANS(50, 900); c.fillStyle = "#fde68a"; c.fillText("10 g of 22-carat gold", W / 2, 560);
          const rows: [string, string, string, number][] = [["Oct 2023 (Business Standard)", "about ₹55,000", "#e2e8f0", ln.from + 4], ["the AI, \"as of Oct 2023\"", "₹5,000", "#f87171", cu(1, 0.3)], ["today, 12 Nov 2026 (Groww)", T.rate, "#4ade80", cu(1, 0.6)]];
          rows.forEach(([a, v, col, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 640 + q * 210;
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 180, 22); c.fill();
            c.font = SANS(fit(c, a, W - 200, 36, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(a, W / 2, y + 60);
            c.font = SANS(80, 900); c.fillStyle = col; c.fillText(v, W / 2, y + 150); c.restore();
          });
          chip(c, "3 years old, and a zero short", W / 2, 1330, "#fee2e2", "#7f1d1d", seg(f, cu(2, 0.8) - 2, cu(2, 0.8) + 6), 44);
        } else if (P === "test") {
          card(c, W, seg(f, ln.from - 2, ln.from + 4));
          c.textAlign = "center"; c.font = SANS(fit(c, "OUR TEST · asked today's gold price 10 times", W - 100, 46), 900); c.fillStyle = "#fde68a"; c.fillText("OUR TEST · asked today's gold price 10 times", W / 2, 560);
          c.font = SANS(32, 700); c.fillStyle = "#cbd5e1"; c.fillText("a small free AI on our computer, no web search", W / 2, 612);
          for (let q = 0; q < 10; q++) {
            const k = seg(f, cu(1, 0.3) + q * 3, cu(1, 0.3) + q * 3 + 6); if (k <= 0) continue;
            const x = 120 + (q % 5) * 210, y = 700 + Math.floor(q / 5) * 230, bad = q === 8;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = bad ? "#fee2e2" : "#dcfce7"; rrect(c, x - 90, y, 180, 190, 20); c.fill();
            c.font = SANS(bad ? 40 : 30, 900); c.fillStyle = bad ? RED : GREEN; c.fillText(bad ? "₹5,000" : "can't", x, y + (bad ? 110 : 90));
            if (!bad) c.fillText("see it", x, y + 130); else { c.font = SANS(24, 800); c.fillText("(2023)", x, y + 150); }
            c.restore();
          }
          chip(c, "9 of 10: \"check today's rate\"", W / 2, 1230, "#dcfce7", "#14532d", seg(f, cu(1, 0.6), cu(1, 0.6) + 8), 40);
          chip(c, "you got the 1", W / 2, 1340, "#fee2e2", "#7f1d1d", seg(f, cu(2, 0.85) - 2, cu(2, 0.85) + 6), 46);
        } else if (P === "rule") {
          card(c, W, seg(f, ln.from - 2, ln.from + 4));
          c.fillStyle = "#fffbeb"; rrect(c, 60, 500, W - 120, 330, 26); c.fill();
          c.textAlign = "center"; c.font = SANS(40, 800); c.fillStyle = "#92400e"; c.fillText("\"as of my last update...\"", W / 2, 590);
          c.font = SANS(fit(c, "= a memory, not a price", W - 160, 66), 900); c.fillStyle = INK; c.fillText("= a memory, not a price", W / 2, 700);
          c.font = SANS(32, 700); c.fillStyle = "#475569"; c.fillText("a price changes every day", W / 2, 776);
          const kb = seg(f, cu(1, 0.6) - 4, cu(1, 0.6) + 6);
          if (kb > 0) {
            c.save(); c.globalAlpha = clamp(kb * 3);
            c.fillStyle = "#1e293b"; rrect(c, 60, 880, 470, 300, 22); c.fill(); c.fillStyle = "#e2e8f0"; c.font = SANS(28, 800); c.fillText("a live rate page", 295, 930);
            c.font = SANS(26, 700); c.fillText("12 Nov 2026 · 22 carat · 10 g", 295, 975); c.font = SANS(60, 900); c.fillStyle = "#4ade80"; c.fillText(T.rate, 295, 1060);
            c.font = SANS(22, 700); c.fillStyle = "#94a3b8"; c.fillText("(Groww, Goodreturns)", 295, 1110);
            c.fillStyle = GOLD; rrect(c, 550, 880, 470, 300, 22); c.fill(); c.fillStyle = "#3b1d0a"; c.font = SANS(28, 900); c.fillText("THE BOARD · " + T.date, 785, 930);
            c.font = SANS(26, 700); c.fillText("22 carat · 10 g", 785, 975); c.font = SANS(60, 900); c.fillText(T.rate, 785, 1060);
            c.font = SANS(fit(c, "✓ same price, same date", W - 200, 52), 900); c.fillStyle = "#4ade80"; c.fillText("✓ same price, same date", W / 2, 1270);
            c.restore();
          }
        }
        if (P === "hook" || P === "plain") {
          if (n === 1) chip(c, "Mom, at the jeweller, with her phone", W / 2, 1400, "#fde68a", INK, 1, 30);
        }
      }} />
    </>
  );
};

export const GOLD_SCENES = { sk_gold: StGold };
