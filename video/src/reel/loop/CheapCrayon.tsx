import React from "react";
import { Ctx, rng, stroke, circlePts, hatch, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, page, hand, fade, HAND } from "./AttentionCrayon";
import { robot, rrect, tag, Sfx, TEACHER, STUDENT } from "./DistillCrayon";

// "Dead-cheap AI for every job": a price-card per use case, drawn in the crayon style.
// Content band: y 270..1400 (banner above, captions below; the YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const GOLD: typeof TEACHER = { body: "#b8860b", accent: "#ffd34d", glasses: true };

// Largest font size (Caveat 700) at which `text` fits in `maxW`.
const fit = (c: Ctx, text: string, maxW: number, size: number, min = 30) => {
  let s = size;
  for (; s > min; s -= 2) { c.font = `700 ${s}px Caveat`; if (c.measureText(text).width <= maxW) break; }
  return s;
};

// ---------- doodle icons (drawn around 0,0, about 200 px across at s = 1) ----------
const icon = (c: Ctx, kind: string, x: number, y: number, s: number, boil: number) => {
  const r = rng(900 + boil);
  c.save(); c.translate(x, y); c.scale(s, s);
  const ink = COL.ink, w = 9;
  const fillRect = (x0: number, y0: number, ww: number, hh: number, col: string) => { c.save(); rrect(c, x0, y0, ww, hh, 16); c.fillStyle = col; c.fill(); c.restore(); stroke(c, [[x0, y0], [x0 + ww, y0], [x0 + ww, y0 + hh], [x0, y0 + hh], [x0, y0]], ink, w, r, { passes: 2 }); };
  if (kind === "mail") {
    fillRect(-100, -65, 200, 130, COL.cream);
    stroke(c, [[-100, -65], [0, 15], [100, -65]], ink, w, r, { passes: 2 });
    for (let k = 0; k < 3; k++) { c.save(); c.globalAlpha = 0.9; rrect(c, -80 + k * 14, -100 - k * 16, 160, 26, 6); c.fillStyle = k % 2 ? "#e9dfc4" : COL.cream; c.fill(); c.restore(); }
  } else if (kind === "chat") {
    c.beginPath(); c.ellipse(-10, -10, 100, 70, 0, 0, 7); c.fillStyle = COL.cream; c.fill();
    stroke(c, circlePts(-10, -10, 100, 70, 0, Math.PI * 2, 40), ink, w, r, { passes: 2 });
    c.beginPath(); c.moveTo(-60, 45); c.lineTo(-85, 95); c.lineTo(-20, 55); c.fillStyle = COL.cream; c.fill();
    stroke(c, [[-60, 50], [-85, 95], [-20, 57]], ink, w, r, { passes: 2 });
    [-50, -10, 30].forEach((dx) => { c.beginPath(); c.arc(dx, -10, 11, 0, 7); c.fillStyle = ink; c.fill(); });
  } else if (kind === "code") {
    fillRect(-110, -80, 220, 160, "#0b1020");
    c.font = "700 92px Caveat"; c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("</>", 0, 30);
  } else if (kind === "image") {
    fillRect(-110, -80, 220, 160, "#bfdbfe");
    c.beginPath(); c.moveTo(-100, 70); c.lineTo(-30, -10); c.lineTo(20, 40); c.lineTo(55, 5); c.lineTo(100, 70); c.closePath(); c.fillStyle = "#16a34a"; c.fill();
    c.beginPath(); c.arc(55, -40, 20, 0, 7); c.fillStyle = COL.yellow; c.fill();
  } else if (kind === "mic") {
    fillRect(-38, -100, 76, 130, "#cbd5e1");
    stroke(c, circlePts(0, 0, 70, 70, 0.1, Math.PI - 0.1, 20), ink, w, r, { passes: 2 });
    stroke(c, [[0, 70], [0, 105]], ink, w, r, { passes: 2 }); stroke(c, [[-45, 105], [45, 105]], ink, w, r, { passes: 2 });
  } else if (kind === "speaker") {
    c.beginPath(); c.moveTo(-90, -35); c.lineTo(-40, -35); c.lineTo(20, -90); c.lineTo(20, 90); c.lineTo(-40, 35); c.lineTo(-90, 35); c.closePath(); c.fillStyle = "#cbd5e1"; c.fill();
    stroke(c, [[-90, -35], [-40, -35], [20, -90], [20, 90], [-40, 35], [-90, 35], [-90, -35]], ink, w, r, { passes: 2 });
    [45, 80].forEach((rr) => stroke(c, circlePts(20, 0, rr, rr, -0.7, 0.7, 12), ink, w, r, { passes: 2 }));
  } else if (kind === "laptop") {
    fillRect(-100, -85, 200, 125, "#0b1020");
    c.beginPath(); c.moveTo(-130, 45); c.lineTo(130, 45); c.lineTo(110, 80); c.lineTo(-110, 80); c.closePath(); c.fillStyle = "#94a3b8"; c.fill();
    stroke(c, [[-130, 45], [130, 45], [110, 80], [-110, 80], [-130, 45]], ink, w, r, { passes: 2 });
    c.font = "700 54px Caveat"; c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("offline", 0, -10);
  } else if (kind === "search") {
    fillRect(-110, -95, 150, 190, COL.cream);
    for (let k = 0; k < 4; k++) stroke(c, [[-90, -60 + k * 35], [10, -60 + k * 35]], "#94a3b8", 6, r, { passes: 1 });
    c.beginPath(); c.arc(40, 20, 55, 0, 7); c.fillStyle = "rgba(191,219,254,0.85)"; c.fill();
    stroke(c, circlePts(40, 20, 55, 55), ink, w, r, { passes: 2 }); stroke(c, [[80, 60], [125, 105]], ink, 16, r, { passes: 2 });
  } else if (kind === "brain") {
    c.beginPath(); c.ellipse(-35, -10, 70, 80, 0, 0, 7); c.ellipse(35, -10, 70, 80, 0, 0, 7); c.fillStyle = "#f9a8d4"; c.fill();
    stroke(c, circlePts(-35, -10, 70, 80), ink, w, r, { passes: 2 }); stroke(c, circlePts(35, -10, 70, 80), ink, w, r, { passes: 2 });
    stroke(c, [[0, -85], [0, 65]], ink, 6, r, { passes: 1 });
    [[-60, -30, -20, -40], [20, -20, 60, -45], [-55, 25, -15, 15], [15, 30, 55, 20]].forEach(([a, b, cc, d]) => stroke(c, [[a, b], [cc, d]], ink, 6, r, { passes: 1 }));
  }
  c.restore();
};

// ---------- 1 HOOK: flagship vs dirt-cheap, same job ----------
const CmHook: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const d = s.data;
  return (
    <>
    <Sfx at={0} src="reel/sfx_boom.wav" vol={0.85} />
    <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.6} />
    <Sfx at={c2} src="audio/sfx_chaching.wav" vol={0.6} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(2000 + boil);
      // everything that matters is readable on frame 0 (cover), sound off
      hand(c, d.head1 ?? "DIRT-CHEAP AI", W / 2, 360, 104, COL.yellow, 1, r, -0.03, "center");
      hand(c, d.head2 ?? "for every job", W / 2, 452, 74, COL.cream, 1, r, -0.02, "center");
      hand(c, d.job ?? "", W / 2, 580, fit(c, d.job ?? "", 940, 60), COL.orangeLight, 1, r, -0.02, "center");
      const pulse = (at: number) => (f >= at ? 1 + 0.25 * Math.exp(-(f - at) / 5) : 1);
      c.save(); c.translate(270, 700); c.scale(pulse(c1), pulse(c1)); c.translate(-270, -700); tag(c, d.bigPrice ?? "", 270, 700, 104, COL.cream, COL.red, -0.05, 1); c.restore();
      c.save(); c.translate(810, 700); c.scale(pulse(c2), pulse(c2)); c.translate(-810, -700); tag(c, d.smallPrice ?? "", 810, 700, 104, "#86efac", COL.ink, 0.05, 1); c.restore();
      if (f >= c2 + 4 && d.ratio) {
        const p = easeOut(fade(f, c2 + 4, 6));
        c.save(); c.translate(540, 700); c.rotate(-0.12); c.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p); c.globalAlpha = p;
        c.strokeStyle = COL.yellow; c.lineWidth = 7; c.strokeRect(-120, -48, 240, 96);
        c.font = "700 70px Caveat"; c.fillStyle = COL.yellow; c.textAlign = "center"; c.fillText("100x", 0, 22); c.restore();
      }
      if (d.api) hand(c, d.api, W / 2, 805, fit(c, d.api, 960, 44, 32), COL.cream, 1, r, -0.01, "center");
      if (d.note) hand(c, d.note, W / 2, 862, fit(c, d.note, 980, 40, 30), COL.pale, 1, r, -0.01, "center");
      robot(c, 270, 1255, 0.85, boil, 1, { ...GOLD, mouth: "smile", arms: "down" });
      robot(c, 810, 1255, 0.55, boil, 2, { ...STUDENT, eyes: f >= c2 ? "happy" : "open", mouth: f >= c2 ? "grin" : "smile", arms: f >= c2 ? "thumb" : "down" });
      tag(c, d.big ?? "flagship", 270, 1310, 48, "#fde68a", COL.ink, -0.04, 1);
      tag(c, d.small ?? "dirt-cheap", 810, 1310, 48, COL.yellow, COL.ink, 0.04, 1);
      tag(c, d.tease ?? "", W / 2, 1395, fit(c, d.tease ?? "", 900, 60, 40), COL.orangeLight, COL.ink, -0.02, 1);
    }} />
    </>
  );
};

// ---------- 2..n PRICE CARD: one job, one pick ----------
const CmCard: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const d = s.data;
  return (
    <>
    <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.5} />
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, d.n % 2 ? COL.deep : COL.blue);
      const r = rng(2100 + d.n * 10 + boil);
      // header: number + job, on screen from frame 0; who it is for (free app vs for builders)
      tag(c, `${d.n} / ${d.of}`, 140, 350, 52, COL.yellow, COL.ink, -0.05, 1);
      hand(c, d.job, W / 2 + 60, 372, fit(c, d.job, 760, 84), COL.cream, 1, r, -0.02, "center");
      if (d.badge) tag(c, d.badge, 260, 870, fit(c, d.badge, 380, 58, 34), d.badge.startsWith("FREE") ? "#86efac" : "#bfdbfe", COL.ink, -0.03, 1);
      // icon
      c.beginPath(); c.arc(260, 640, 170, 0, 7); c.fillStyle = "rgba(255,255,255,0.12)"; c.fill();
      icon(c, d.icon, 260, 640, 1.15 * easeOut(fade(f, 0, 8)) || 0.01, boil);
      // the pick
      if (f >= c1) {
        hand(c, d.pickLabel ?? "use:", 720, 520, 46, COL.pale, 1, r, -0.01, "center");
        const ps = fit(c, d.pick, 560, 76, 40);
        tag(c, d.pick, 720, 610, ps, COL.cream, "#1d3fa8", -0.03, fade(f, c1, 8));
        if (d.pick2) hand(c, d.pick2, 720, 700, fit(c, d.pick2, 560, 52, 38), COL.cream, seg(f, c1 + 6, c1 + 18), r, -0.01, "center");
      }
      // the price (a second price line when a card has two plans)
      if (f >= c2) tag(c, d.price, 720, 790, fit(c, d.price, 560, 74, 40), d.free ? "#86efac" : COL.yellow, COL.ink, 0.03, fade(f, c2, 8));
      if (d.price2 && f >= c2 + 6) tag(c, d.price2, 720, 868, fit(c, d.price2, 560, 60, 40), COL.yellow, COL.ink, -0.02, fade(f, c2 + 6, 8));
      // a real-world example (some cards show it early, so it stays up long enough to read)
      const cx = d.exampleAt === 1 ? c1 + 12 : d.exampleAt === 2 ? c2 + 8 : c3;
      if (f >= cx) {
        page(c, 90, 930, 900, 210, boil, -0.012);
        hand(c, d.example, W / 2, 1020, fit(c, d.example, 820, 66, 40), COL.ink, seg(f, cx, cx + 14), r, -0.02, "center");
        if (d.example2) hand(c, d.example2, W / 2, 1097, fit(c, d.example2, 840, 44, 36), "#475569", seg(f, cx + 10, cx + 24), r, -0.01, "center");
      }
      // a command people can screenshot
      if (d.cmd && f >= c2) {
        c.save(); c.globalAlpha = fade(f, c2, 6); rrect(c, 230, 1165, 760, 70, 14); c.fillStyle = "#0b1020"; c.fill();
        c.font = "600 34px 'DejaVu Sans Mono', monospace"; c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText("Terminal:", 252, 1211);
        c.font = "600 40px 'DejaVu Sans Mono', monospace"; c.fillStyle = "#86efac"; c.fillText(d.cmd, 452, 1213); c.restore();
      }
      // a second pick for the same card (e.g. audio: transcription, then voiceovers)
      if (d.second && f >= c4) {
        c.save(); c.globalAlpha = fade(f, c4, 6); rrect(c, 90, 1160, 900, 120, 22); c.fillStyle = "rgba(255,255,255,0.14)"; c.fill(); c.restore();
        hand(c, d.second.label, 130, 1235, 46, COL.pale, seg(f, c4, c4 + 8), r, -0.01);
        tag(c, d.second.pick, 520, 1222, fit(c, d.second.pick, 380, 50, 32), COL.cream, "#1d3fa8", -0.02, fade(f, c4 + 2, 8));
        tag(c, d.second.price, 850, 1222, fit(c, d.second.price, 230, 50, 30), COL.yellow, COL.ink, 0.03, fade(f, c4 + 8, 8));
      }
      if (d.free) {
        const p = fade(f, c2 + 4, 6);
        if (p > 0) { c.save(); c.translate(900, 470); c.rotate(0.18); c.scale(1 + 0.4 * (1 - easeOut(p)), 1 + 0.4 * (1 - easeOut(p))); c.globalAlpha = p;
          c.strokeStyle = "#16a34a"; c.lineWidth = 8; c.strokeRect(-110, -45, 220, 90); c.font = "700 64px Caveat"; c.fillStyle = "#16a34a"; c.textAlign = "center"; c.fillText(d.free, 0, 20); c.restore(); }
      }
      if (d.try) hand(c, "try: " + d.try, W / 2, d.second || d.cmd ? 1330 : 1225, fit(c, "try: " + d.try, 760, 44, 28), COL.yellow, seg(f, c2 + 6, c2 + 20), r, -0.01, "center");
      if (d.source) hand(c, d.source, W / 2, d.second || d.cmd ? 1380 : 1290, fit(c, d.source, 820, 40, 30), COL.pale, seg(f, c2 + 10, c2 + 26), r, -0.01, "center");
      robot(c, 935, 1420, 0.42, boil, 3, { ...STUDENT, eyes: f >= c2 ? "happy" : "open", mouth: "grin", arms: f >= c3 ? "thumb" : "down" });
    }} />
    </>
  );
};

// ---------- THE RULE: start cheap, test, move up only if it fails ----------
const CmRule: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const d = s.data;
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil, COL.deep);
      const r = rng(2600 + boil);
      hand(c, d.title ?? "the rule", W / 2, 370, 92, COL.yellow, 1, r, -0.03, "center");
      const steps: [string, number][] = [[d.s1 ?? "start with the cheap one", c1], [d.s2 ?? "test 20 real examples", c2], [d.s3 ?? "move up only if it fails", c3]];
      steps.forEach(([txt, at], i) => {
        const x = 110 + i * 60, y = 560 + i * 230;
        if (f < at) return;
        c.save(); rrect(c, x, y - 80, 820 - i * 60, 130, 22); c.fillStyle = i === 2 ? "rgba(253,186,116,0.25)" : "rgba(255,255,255,0.12)"; c.fill(); c.restore();
        tag(c, String(i + 1), x + 50, y, 70, [COL.yellow, "#86efac", COL.orangeLight][i], COL.ink, -0.05, fade(f, at, 6));
        hand(c, txt, x + 110, y + 22, fit(c, txt, 640 - i * 60, 64, 36), COL.cream, seg(f, at + 2, at + 16), r, -0.02);
      });
      const climb = f >= c3 ? 2 : f >= c2 ? 1 : f >= c1 ? 0 : -1;
      if (climb >= 0) robot(c, 900, 700 + climb * 230, 0.42, boil, 3, { ...STUDENT, eyes: "happy", mouth: "grin", arms: "up" });
    }} />
  );
};

// ---------- YOUR TURN + CTA ----------
const CmAsk: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const d = s.data;
  const handle: string = d.handle ?? "@ai_maastaaru";
  return (
    <CrayonCanvas draw={(c, W, H, f, boil) => {
      background(c, W, H, boil);
      const r = rng(2700 + boil);
      hand(c, "YOUR TURN", W / 2, 370, 100, COL.yellow, seg(f, 0, 10), r, -0.03, "center");
      const kinds = ["chat", "code", "image", "mic", "laptop"];
      kinds.forEach((k, i) => icon(c, k, 160 + i * 190, 590, 0.62 * easeOut(fade(f, i * 3, 8)) || 0.01, boil));
      hand(c, d.q1 ?? "which job do you use AI for most?", W / 2, 960, fit(c, d.q1 ?? "", 960, 62, 36), COL.cream, seg(f, 8, 24), r, -0.02, "center");
      if (d.recap) {   // the line people screenshot: the biggest on the end frame
        tag(c, d.recap, W / 2, 800, fit(c, d.recap, 960, 64, 40), COL.yellow, COL.ink, -0.02, fade(f, 2, 8));
      }
      if (f >= c1) {
        tag(c, d.q2 ?? "comment it", W / 2, 1075, 70, COL.orangeLight, COL.ink, -0.03, fade(f, c1, 8));
        if (d.q3) hand(c, d.q3, W / 2, 1150, fit(c, d.q3, 960, 46, 30), COL.pale, seg(f, c1 + 8, c1 + 22), r, -0.01, "center");
      }
      if (f >= c2) {
        const hp = easeOut(fade(f, c2, 10));
        c.save(); c.globalAlpha = hp;
        c.fillStyle = "rgba(5,10,40,0.6)"; c.fillRect(0, 1185, W, 235);
        c.font = `700 ${handle.length > 16 ? 80 : 96}px Caveat`; c.textAlign = "center"; c.fillStyle = COL.yellow;
        c.fillText(handle, W / 2, 1285);
        c.font = `52px ${HAND}`; c.fillStyle = COL.cream; c.fillText(d.follow ?? "Follow for more AI, explained simply", W / 2, 1370);
        c.restore();
      }
    }} />
  );
};

export const CHEAP_SCENES = { cm_hook: CmHook, cm_card: CmCard, cm_rule: CmRule, cm_ask: CmAsk };
// keep tree-shaking honest for helpers only used in some scenes
void hatch; void clamp; void TEACHER;
