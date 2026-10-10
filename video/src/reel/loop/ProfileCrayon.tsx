import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, page, hand, arrow, fade, kid } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, GREY, caveat, handF, fitSize, label, stamp, card } from "./WordsCrayon";

// Profile reel "From 1 upvote to 32,000 stars" (Nandakishor Mukkunnoth, Laya), in the EP27/EP28 crayon style.
// Content band: y 270..1400 (banner above, karaoke captions below; the YouTube frame shows y 240..1440).
// No likeness of the person: only his public work, numbers and places.
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HN = "#ff6600";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Hacker News style card: orange bar, a year tag, a big point count.
const hnCard = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, year: string, points: string, sub: string, hot: boolean) => {
  c.save();
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 22); c.fill();
  c.fillStyle = COL.cream; rrect(c, x, y, w, h, 22); c.fill();
  c.save(); rrect(c, x, y, w, h, 22); c.clip(); c.fillStyle = HN; c.fillRect(x, y, w, 64);
  c.fillStyle = "#fff"; c.fillRect(x + 22, y + 14, 36, 36); c.font = caveat(34); c.fillStyle = HN; c.textAlign = "center"; c.fillText("Y", x + 40, y + 44);
  c.font = caveat(40); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Hacker News · tech forum", x + 74, y + 46);
  c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 5, r, { passes: 2, alpha: 0.6 });
  tag(c, year, x + w - 90, y + 50, 48, hot ? COL.yellow : COL.pale, INK, 0.04, 1);
  c.font = caveat(fitSize(c, points, w * 0.62, 124, caveat)); c.fillStyle = hot ? COL.orange : GREY; c.textAlign = "left"; c.fillText(points, x + 40, y + h - 96);
  c.font = handF(44); c.fillStyle = GREY; c.fillText(sub, x + 44, y + h - 28);
  c.restore();
};

const calendar = (c: Ctx, x: number, y: number, s: number, r: () => number, month: string, day: string, year: string, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k * s, k * s); c.rotate(-0.04);
  c.fillStyle = "rgba(4,8,40,0.35)"; c.fillRect(-92, -82, 200, 190);
  c.fillStyle = COL.cream; c.fillRect(-100, -90, 200, 190);
  c.fillStyle = COL.red; c.fillRect(-100, -90, 200, 52);
  stroke(c, rrectPts(-100, -90, 200, 190), COL.ink, 4, r, { passes: 2, alpha: 0.7 });
  c.font = caveat(40); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(month, 0, -52);
  c.font = caveat(96); c.fillStyle = INK; c.fillText(day, 0, 40);
  c.font = caveat(40); c.fillStyle = GREY; c.fillText(year, 0, 88);
  c.restore();
};

const bag = (c: Ctx, x: number, y: number, s: number, r: () => number, text: string, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k * s, k * s);
  c.beginPath(); c.moveTo(-40, -120); c.lineTo(40, -120); c.lineTo(20, -90); c.lineTo(-20, -90); c.closePath(); c.fillStyle = "#a16207"; c.fill();
  c.beginPath(); c.ellipse(0, 0, 120, 110, 0, 0, 7); c.fillStyle = "#ca8a04"; c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 0, 120, 110, 0, 0, 7); c.clip(); hatch(c, [-120, -110, 120, 110], ["#a16207", "#facc15"], r, { gap: 9, alpha: 0.4 }); c.restore();
  stroke(c, circlePts(0, 0, 120, 110), COL.ink, 5, r, { passes: 2 });
  c.font = caveat(76); c.fillStyle = "#fff8dc"; c.textAlign = "center"; c.fillText(text, 0, 26);
  c.restore();
};

const bubbleSay = (c: Ctx, x: number, y: number, w: number, h: number, text: string, who: string, col: string, tail: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = COL.cream; rrect(c, -w / 2, -h / 2, w, h, 30); c.fill();
  c.beginPath(); c.moveTo(tail * 60 - 20, h / 2 - 2); c.lineTo(tail * 110, h / 2 + 50); c.lineTo(tail * 60 + 30, h / 2 - 2); c.closePath(); c.fill();
  stroke(c, rrectPts(-w / 2, -h / 2, w, h), col, 6, r, { passes: 2 });
  c.font = caveat(fitSize(c, text, w - 50, 58, caveat)); c.fillStyle = INK; c.textAlign = "center"; c.fillText(text, 0, 14);
  c.restore();
  label(c, who, x, y - h / 2 - 16, 44, col, caveat, p);
};

// Green road sign on a pole, with two palm trees: "Kasaragod, Kerala, India". (No map outlines.)
const signpost = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k * s, k * s);
  c.fillStyle = "#8b5a2b"; c.fillRect(-12, -40, 24, 380);
  c.fillStyle = "#15803d"; rrect(c, -240, -180, 480, 160, 18); c.fill();
  stroke(c, rrectPts(-226, -166, 452, 132), "#ffffff", 5, r, { passes: 2, alpha: 0.9 });
  c.font = caveat(80); c.fillStyle = "#ffffff"; c.textAlign = "center"; c.fillText("KASARAGOD", 0, -86);
  c.font = caveat(42); c.fillText("Kerala, India", 0, -42);
  c.restore();
};
const palm = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p * 1.5); c.translate(x, y); c.scale(s, s);
  stroke(c, [[0, 0], [10, -90], [26, -180], [48, -260]], "#8b5a2b", 18, r, { passes: 2 });
  [[-150, -230], [-90, -320], [40, -350], [150, -300], [170, -220]].forEach(([dx, dy]) => {
    stroke(c, [[48, -260], [48 + dx * 0.5, -260 + (dy + 260) * 0.2 - 40], [48 + dx, dy + 20]], "#16a34a", 16, r, { passes: 2 });
  });
  c.restore();
};

const counter = (c: Ctx, y: number, icon: (x: number, y: number) => void, value: number, suffix: string, sub: string, p: number, r: () => number) => {
  if (p <= 0) return;
  const e = easeOut(p);
  card(c, 70, y - 90, 940, 170, r, p);
  icon(150, y);
  c.save(); c.globalAlpha = clamp(p * 1.5);
  c.font = caveat(96); c.fillStyle = INK; c.textAlign = "left"; c.fillText(fmt(value * e) + suffix, 250, y + 22);
  c.font = handF(40); c.fillStyle = GREY; c.fillText(sub, 254, y + 66);
  c.restore();
};

// ---------- 1 HOOK ----------
const PfHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={24} src="reel/sfx_boom.wav" vol={0.7} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_chaching.wav" vol={0.5} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(2100 + boil);
        hnCard(c, 90, 320, 900, 300, r, "2025", "1 upvote", "0 comments", false);
        if (f >= c1) {
          tag(c, "his own", 760, 500, 60, COL.red, COL.cream, -0.06, seg(f, c1, c1 + 8));
          arrow(c, [650, 485], [470, 470], -30, COL.red, 6, seg(f, c1 + 4, c1 + 12), r);
        }
        const slam = seg(f, 24, 32);
        if (slam > 0) {
          const k = 1.6 - 0.6 * easeOut(slam);
          c.save(); c.translate(540, 830); c.scale(k, k); c.translate(-540, -830); c.globalAlpha = clamp(slam * 2);
          hnCard(c, 90, 680, 900, 300, r, "2026", `${fmt(lerp(1, 1363, easeOut(seg(f, 26, 44))))} upvotes`, "his Laya post", true);
          c.restore();
        }
        if (f >= c2) {
          c.save(); c.shadowColor = COL.yellow; c.shadowBlur = 40 * (1 - seg(f, c2 + 18, c2 + 40));
          stroke(c, rrectPts(90, 680, 900, 300), COL.yellow, 8, r, { passes: 2, alpha: 0.9 * (1 - seg(f, c2 + 30, c2 + 50)) });
          c.restore();
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          card(c, 120, 1060, 840, 230, r, p, "#fff6d8");
          label(c, "Nandakishor Mukkunnoth", W / 2, 1150, fitSize(c, "Nandakishor Mukkunnoth", 780, 76, caveat), INK, caveat, p);
          label(c, "builder from Kerala, India", W / 2, 1230, 50, COL.orange, caveat, p);
        }
      }} />
    </>
  );
};

// ---------- 2 MARCH 2025 ----------
const PfY2025: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_tick.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(2200 + boil);
        calendar(c, 200, 420, 1, r, "MARCH", "2025", "his paper", seg(f, 0, 10));
        hand(c, "an AI that picks,", 640, 400, 66, COL.cream, seg(f, 4, 18), r, -0.02, "center");
        hand(c, "not writes", 640, 480, 66, COL.yellow, seg(f, 12, 26), r, -0.02, "center");
        // crossed-out paragraph vs a single answer
        card(c, 90, 590, 420, 300, r, seg(f, 8, 18));
        for (let i = 0; i < 6; i++) stroke(c, [[130, 650 + i * 38], [130 + 340 * (i === 5 ? 0.5 : 1), 650 + i * 38]], GREY, 6, r, { passes: 1, alpha: 0.6 });
        if (f >= 18) { stroke(c, [[110, 610], [490, 870]], COL.red, 10, r, { passes: 2 }); stroke(c, [[490, 610], [110, 870]], COL.red, 10, r, { passes: 2 }); }
        label(c, "paragraphs", 300, 935, 48, COL.pale, caveat, seg(f, 18, 26));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 570, 590, 420, 300, r, p, "#fff6d8");
          label(c, "will this customer buy?", 780, 660, fitSize(c, "will this customer buy?", 380, 46, caveat), INK, caveat, p);
          const v = 0.72 * easeOut(seg(f, c1 + 6, c1 + 26));
          c.save(); c.globalAlpha = clamp(p * 1.4);
          c.fillStyle = "rgba(0,0,0,0.08)"; c.fillRect(610, 720, 340, 56); c.fillStyle = COL.orange; c.fillRect(610, 720, 340 * v / 0.72 * 0.72, 56);
          c.restore();
          stroke(c, rrectPts(610, 720, 340, 56), COL.ink, 3, r, { passes: 1, alpha: 0.6 * p });
          label(c, `${Math.round(v * 100)}% yes`, 780, 840, 64, COL.orange, caveat, p);
          label(c, "(example)", 940, 880, 30, GREY, handF, p, "right");
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 170, 1010, 740, 230, r, p);
          c.save(); c.globalAlpha = clamp(p * 1.4); c.fillStyle = HN; c.fillRect(170, 1010, 740, 50); c.restore();
          label(c, "Hacker News · May 2025", 540, 1047, 38, "#fff", caveat, p);
          label(c, "1 point · 0 comments", 540, 1150, 70, GREY, caveat, p);
          hand(c, "almost nobody noticed", W / 2, 1330, 68, COL.cream, seg(f, c2 + 10, c2 + 26), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 3 JEV ----------
const PfJev: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c1} src="audio/sfx_chaching.wav" vol={0.45} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(2300 + boil);
        calendar(c, 200, 430, 1, r, "SEPTEMBER", "15", "2026", seg(f, 0, 10));
        hand(c, "Jev launches", 660, 440, 70, COL.cream, seg(f, 4, 20), r, -0.02, "center");
        bag(c, 290, 760, 1, r, "$40M", seg(f, c1, c1 + 10));
        if (f >= c1) {
          const p = fade(f, c1 + 4, 10);
          card(c, 520, 640, 460, 250, r, p, "#e0f2fe");
          label(c, "Jev", 750, 740, 96, INK, caveat, p);
          label(c, "by TypeSafe AI", 750, 805, 46, GREY, handF, p);
          label(c, "$40M seed round", 750, 862, 46, "#0369a1", caveat, p);
        }
        if (f >= c2) {
          tag(c, "\"billing\" · 92% sure", W / 2, 990, 60, COL.yellow, INK, -0.02, seg(f, c2, c2 + 10));
          label(c, "also picks answers, not paragraphs", W / 2, 1068, 52, COL.pale, caveat, seg(f, c2 + 6, c2 + 16));
        }
        if (f >= c3) {
          ["heise", "SiliconANGLE", "VKTR"].forEach((n, i) => {
            const p = seg(f, c3 + i * 6, c3 + i * 6 + 10);
            if (p <= 0) return;
            const x = 230 + i * 310, y = 1230 + (i % 2) * 30, k = easeOut(p);
            c.save(); c.translate(x, y); c.rotate((i - 1) * 0.06); c.scale(k, k);
            c.fillStyle = "#f8fafc"; c.fillRect(-140, -90, 280, 170);
            stroke(c, rrectPts(-140, -90, 280, 170), COL.ink, 4, r, { passes: 1, alpha: 0.6 });
            c.font = caveat(fitSize(c, n, 240, 44, caveat)); c.fillStyle = INK; c.textAlign = "center"; c.fillText(n, 0, -40);
            for (let j = 0; j < 3; j++) stroke(c, [[-110, -5 + j * 26], [110 - j * 30, -5 + j * 26]], GREY, 5, r, { passes: 1, alpha: 0.5 });
            c.restore();
          });
        }
      }} />
    </>
  );
};

// ---------- 4 LAYA ----------
const PfLaya: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_success.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c4} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(2400 + boil);
        calendar(c, 200, 430, 1, r, "SEPTEMBER", "18", "2026", seg(f, 0, 10));
        hand(c, "3 days later", 660, 440, 70, COL.yellow, seg(f, 4, 18), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 140, 580, 800, 300, r, p, COL.cream);
          label(c, "Laya", W / 2, 690, 116, COL.orange, caveat, p);
          tag(c, "FREE", 280, 770, 58, COL.green, INK, -0.05, p);
          label(c, "open source · Apache-2.0", 630, 780, 46, INK, caveat, p);
          label(c, "for quick yes / no / pick-one answers", W / 2, 840, 46, COL.red, caveat, p);
        }
        bubbleSay(c, 300, 1010, 460, 110, "I had the core idea first", "he says", COL.orange, 0.6, r, seg(f, c2, c2 + 10));
        bubbleSay(c, 640, 1160, 600, 110, "his 2025 model only did sales", "critics (Startup Fortune)", COL.light, -0.4, r, seg(f, c3, c3 + 10));
        if (f >= c4) {
          const p = seg(f, c4, c4 + 20);
          arrow(c, [200, 1360], [880, 1250], -40, COL.yellow, 9, p, r);
          hand(c, "the world noticed", 560, 1380, 62, COL.yellow, seg(f, c4 + 10, c4 + 26), r, -0.03, "center");
        }
      }} />
    </>
  );
};

// ---------- 5 NUMBERS ----------
const PfNumbers: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      {[0, c1, c2, c3].map((a, i) => <Sfx key={i} at={a + 2} src="audio/sfx_pop.wav" vol={0.4} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(2500 + boil);
        hand(c, "three weeks later", W / 2, 350, 72, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        const ic = (draw: (x: number, y: number) => void) => draw;
        counter(c, 500, ic((x, y) => { c.fillStyle = HN; c.fillRect(x - 40, y - 40, 80, 80); c.font = caveat(64); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("Y", x, y + 22); }), 1363, "", "upvotes on Hacker News (tech forum)", seg(f, 2, 22), r);
        counter(c, 700, ic((x, y) => { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 22 : 48; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = COL.yellow; c.fill(); }), 32100, "", "stars on GitHub", seg(f, c1, c1 + 20), r);
        counter(c, 900, ic((x, y) => { stroke(c, [[x, y - 40], [x, y + 20]], COL.green, 14, r, { passes: 2 }); stroke(c, [[x - 30, y - 5], [x, y + 28], [x + 30, y - 5]], COL.green, 14, r, { passes: 2 }); stroke(c, [[x - 40, y + 44], [x + 40, y + 44]], COL.green, 10, r, { passes: 2 }); }), 317000, "", "downloads in 3 weeks (PyPI)", seg(f, c2, c2 + 20), r);
        counter(c, 1100, ic((x, y) => { for (let k = 0; k < 3; k++) { c.fillStyle = k === 2 ? "#fff" : "#e2e8f0"; c.fillRect(x - 34 + k * 8, y - 44 + k * 8, 62, 78); stroke(c, rrectPts(x - 34 + k * 8, y - 44 + k * 8, 62, 78), COL.ink, 3, r, { passes: 1, alpha: 0.6 }); } }), 10, "+", "research papers cite or test it", seg(f, c3, c3 + 16), r);
        label(c, "as of Oct 10, 2026 · GitHub, PyPI stats, Hacker News, arXiv", W / 2, 1270, 34, COL.pale, handF, seg(f, c3 + 10, c3 + 20));
      }} />
    </>
  );
};

// ---------- 6 WHO ----------
const PfWho: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={4} src="audio/sfx_pop.wav" vol={0.35} />
      <Sfx at={c2 + 20} src="reel/sfx_boom.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(2600 + boil);
        palm(c, 120, 980, 1, r, seg(f, 0, 12));
        palm(c, 470, 1010, 0.8, r, seg(f, 4, 16));
        signpost(c, 300, 560, 0.95, r, seg(f, 2, 14));
        label(c, "CEO, Convai Innovations", 760, 400, 48, COL.cream, caveat, seg(f, 8, 18));
        label(c, "(an AI startup)", 760, 452, 42, COL.pale, handF, seg(f, 10, 20));
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 560, 520, 420, 250, r, p, "#fff6d8");
          label(c, "2008:", 770, 590, 50, INK, caveat, p);
          label(c, "₹200-300 a day", 770, 660, 58, COL.orange, caveat, p);
          label(c, "(a few dollars)", 770, 714, 42, GREY, handF, p);
          tag(c, "he said, in an interview", 770, 812, 42, COL.pale, INK, -0.03, p);
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 560, 880, 420, 230, r, p, COL.cream);
          label(c, "Admitted ✓", 770, 950, 54, "#15803d", caveat, p);
          label(c, "top science institute", 770, 1000, 42, GREY, handF, p);
          label(c, "but couldn't afford it", 770, 1070, 46, INK, caveat, seg(f, c2 + 16, c2 + 26));
        }
        if (f >= c3) {
          const p = fade(f, c3, 10);
          hand(c, "→ engineering in Kannur", W / 2, 1270, 66, COL.yellow, seg(f, c3, c3 + 16), r, -0.02, "center");
          label(c, "(he said)", W / 2, 1330, 42, COL.pale, handF, p);
        }
      }} />
    </>
  );
};

// ---------- 7 WORK ----------
const PfWork: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      {[c1, c2, c3].map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.4} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(2700 + boil);
        hand(c, "before all this", W / 2, 350, 80, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        if (f >= c1) {
          const p = fade(f, c1, 10);
          card(c, 90, 410, 900, 300, r, p, COL.cream);
          const pts: Pt[] = [];
          for (let i = 0; i <= 60; i++) {
            const t = i / 60, x = 130 + t * 820, ph = (t * 4) % 1;
            const yv = ph > 0.42 && ph < 0.46 ? -70 : ph > 0.46 && ph < 0.5 ? 40 : ph > 0.6 && ph < 0.7 ? -14 : 0;
            pts.push([x, 515 + yv]);
          }
          const n = Math.max(2, Math.round(pts.length * seg(f, c1, c1 + 24)));
          stroke(c, pts.slice(0, n), COL.red, 6, r, { passes: 2 });
          label(c, "peer-reviewed: AI that reads ECGs", W / 2, 620, 50, INK, caveat, p);
          label(c, "BMJ Digital Health & AI, 2025", W / 2, 666, 40, GREY, handF, p);
          label(c, "+ 6 more papers on arXiv in 2025 (preprints)", W / 2, 770, 42, COL.pale, caveat, seg(f, c1 + 20, c1 + 30));
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 90, 840, 430, 300, r, p, "#fff6d8");
          label(c, "हिन्दी", 305, 980, 96, COL.orange, (sz) => `700 ${sz}px sans-serif`, p);
          label(c, "AI models for Hindi", 305, 1080, 46, INK, caveat, p);
        }
        if (f >= c3) {
          const q = fade(f, c3, 10);
          card(c, 560, 840, 430, 300, r, q, "#e0f2fe");
          c.save(); c.globalAlpha = clamp(q * 1.4);
          c.beginPath(); c.moveTo(775, 880); c.lineTo(850, 908); c.lineTo(840, 976); c.quadraticCurveTo(775, 1020, 710, 976); c.lineTo(700, 908); c.closePath(); c.fillStyle = COL.light; c.fill();
          c.font = caveat(44); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("offline", 775, 960);
          c.restore();
          label(c, "code-security app", 775, 1070, 46, INK, caveat, q);
          label(c, "(Nadhi Audit)", 775, 1115, 40, GREY, handF, q);
        }
      }} />
    </>
  );
};

// ---------- 8 CTA ----------
const PfCta: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(2800 + boil);
        hand(c, "builders like him", W / 2, 370, 80, COL.cream, seg(f, 0, 14), r, -0.02, "center");
        hand(c, "are everywhere", W / 2, 460, 80, COL.yellow, seg(f, 8, 22), r, -0.02, "center");
        const rr = rng(91);
        for (let i = 0; i < 14; i++) {
          const x = 140 + rr() * 800, y = 560 + rr() * 330, p = seg(f, 10 + i * 3, 18 + i * 3);
          if (p <= 0) continue;
          const k = easeOut(p);
          c.save(); c.translate(x, y - (1 - k) * 40); c.globalAlpha = k;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(-11, -24); c.arc(0, -32, 14, Math.PI * 0.86, Math.PI * 0.14); c.closePath(); c.fillStyle = i === 0 ? COL.red : COL.orangeLight; c.fill();
          c.restore();
        }
        if (f >= c1) {
          hand(c, "tag a friend who's building", W / 2, 990, 66, COL.cream, seg(f, c1, c1 + 14), r, -0.02, "center");
          hand(c, "something nobody has noticed yet", W / 2, 1070, 58, COL.cream, seg(f, c1 + 10, c1 + 26), r, -0.02, "center");
          const p = fade(f, c1 + 24, 12);
          label(c, "Laya is free: pip install laya", W / 2, 1160, 52, COL.cream, caveat, p);
          label(c, "@nandakishor_m", W / 2, 1218, 46, COL.pale, caveat, p);
          c.save(); c.globalAlpha = easeOut(p);
          c.font = caveat(handle.length > 16 ? 78 : 92); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1305);
          c.shadowBlur = 0; c.font = handF(50); c.fillStyle = COL.cream; c.fillText("Follow for more builders", W / 2, 1370);
          c.restore();
        }
      }} />
    </>
  );
};

export const PROFILE_SCENES = { pf_hook: PfHook, pf_2025: PfY2025, pf_jev: PfJev, pf_laya: PfLaya, pf_numbers: PfNumbers, pf_who: PfWho, pf_work: PfWork, pf_cta: PfCta };
