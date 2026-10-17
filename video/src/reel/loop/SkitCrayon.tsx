import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { hand, fade, kid } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, label, stamp } from "./WordsCrayon";
import { bubble } from "./MannersCrayon";

// Skit 01 "The AI that remembered the wrong price" (series/scripts/skit01_wrong_price.md): a kirana counter, Ravi anna,
// and the shop's AI on a phone propped against the till. Shot/reverse-shot: every line cuts to its speaker (or the wide
// shot); each beat brings its prop (s.data.beats, one per line). World coordinates = the wide shot.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[] };
type Beat = { who: "ravi" | "ai"; shot: "ravi" | "ai" | "wide"; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SKIN = "#b9774d", HAIR = "#1c1410", SHIRT = "#2f6fb0", WALL = "#f2d7a0", WOOD = "#98592c";
const PH = { x: 800, y: 905 };   // the phone on the counter
const RV = { x: 485, y: 700 };   // Ravi's neck
const COUNTER = 1010;

type Mood = "yell" | "angry" | "sus" | "confused" | "shock" | "worried" | "sad" | "hope" | "smug" | "panic" | "happy";
type Arms = "rest" | "slam" | "point" | "fist" | "shrug" | "up" | "thumb" | "phone" | "fold" | "lunge";
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "slam"], 2: ["angry", "rest"], 3: ["sus", "rest"], 4: ["angry", "fist"], 5: ["yell", "point"], 6: ["angry", "rest"],
  7: ["confused", "shrug"], 8: ["shock", "rest"], 9: ["shock", "up"], 10: ["happy", "thumb"], 11: ["worried", "rest"],
  12: ["sad", "rest"], 13: ["sad", "rest"], 14: ["sad", "rest"], 15: ["hope", "rest"], 16: ["hope", "phone"], 17: ["sad", "rest"],
  18: ["smug", "fold"], 19: ["smug", "fold"], 20: ["panic", "lunge"],
};
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.1, x: 548, y: 790 }, ravi: { z: 1.6, x: 495, y: 715 }, ai: { z: 2.05, x: 800, y: 880 }, board: { z: 1.25, x: 390, y: 700 },
  lunge: { z: 1.32, x: 640, y: 790 },
};

// ---------- the shop ----------
const shop = (c: Ctx, r: () => number) => {
  c.fillStyle = WALL; c.fillRect(-400, 100, 1880, 1400);
  hatch(c, [-200, 100, 1280, COUNTER], ["#e6c27f", "#f7e2b6"], r, { gap: 14, w: 3, alpha: 0.35 });
  // shelves with jars and sacks (right)
  for (let k = 0; k < 3; k++) {
    const y = 470 + k * 170;
    c.fillStyle = "#7a4520"; c.fillRect(560, y, 520, 18);
    for (let j = 0; j < 6; j++) {
      const x = 590 + j * 80, col = ["#e05a47", "#f5b83d", "#5bb26a", "#e9e2cf", "#c97b3a", "#8fb3e8"][(j + k * 2) % 6];
      c.fillStyle = col; rrect(c, x, y - 92, 58, 92, 12); c.fill();
      c.fillStyle = "rgba(255,255,255,0.55)"; c.fillRect(x + 8, y - 70, 42, 22);
    }
  }
  // the price board (left)
  c.fillStyle = "#6b4423"; rrect(c, 20, 320, 370, 390, 14); c.fill();
  c.fillStyle = "#1f3a2e"; rrect(c, 36, 336, 338, 358, 8); c.fill();
  c.font = caveat(38); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("TODAY'S PRICES", 205, 390);
  c.font = caveat(44); c.textAlign = "left";
  [["Tomatoes", "₹40"], ["Onions", "₹30"], ["Rice", "₹60"], ["Dal", "₹120"]].forEach(([a, b], i) => {
    c.fillStyle = "#f8fafc"; c.fillText(a, 58, 458 + i * 62);
    c.fillStyle = "#fde68a"; c.fillText(b, 232, 458 + i * 62);
  });
};

const counter = (c: Ctx, r: () => number) => {
  c.fillStyle = WOOD; c.fillRect(-400, COUNTER, 1880, 560);
  c.fillStyle = "#b8743f"; c.fillRect(-400, COUNTER, 1880, 34);
  hatch(c, [-200, COUNTER + 40, 1280, 1500], ["#7a4520", "#b8743f"], r, { angle: 0.04, gap: 22, w: 4, alpha: 0.45 });
  stroke(c, [[-200, COUNTER], [1280, COUNTER]], INK, 5, r, { passes: 2, alpha: 0.6 });
};

// ---------- Ravi anna ----------
const limb = (c: Ctx, pts: Pt[], r: () => number, col = SHIRT) => {
  stroke(c, pts, col, 46, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.45 });
};
const fist = (c: Ctx, x: number, y: number, r: () => number, extra?: "point" | "thumb" | "palm") => {
  c.beginPath(); c.arc(x, y, 27, 0, 7); c.fillStyle = SKIN; c.fill();
  stroke(c, circlePts(x, y, 27, 27), INK, 3, r, { passes: 1, alpha: 0.6 });
  if (extra === "point") stroke(c, [[x - 8, y - 18], [x - 30, y - 52]], SKIN, 16, r, { passes: 2 });
  if (extra === "thumb") stroke(c, [[x, y - 18], [x + 2, y - 54]], SKIN, 16, r, { passes: 2 });
};

const arms = (c: Ctx, a: Arms, p: number, f: number, r: () => number) => {
  const L: Pt = [-140, 55], R: Pt = [140, 55];
  const rest = { l: [[-190, 200], [-150, 300]] as Pt[], r: [[190, 200], [150, 300]] as Pt[] };
  let l = rest.l, rr = rest.r, lx: "point" | "thumb" | "palm" | undefined, rx: "point" | "thumb" | "palm" | undefined;
  if (a === "slam") {
    const q = easeOut(seg(p, 0.02, 0.1));
    rr = [[210, 140 - 160 * (1 - q)], [175, -110 + 410 * q]];
  } else if (a === "point") { l = [[-235, 40], [-330, -120]]; lx = "point"; }
  else if (a === "fist") { rr = [[215, 70], [205 + 10 * Math.sin(f * 1.3), -95]]; }
  else if (a === "shrug") { l = [[-215, 170], [-270, 110]]; rr = [[215, 170], [270, 110]]; lx = rx = "palm"; }
  else if (a === "up") { l = [[-230, -20], [-200, -175]]; rr = [[230, -20], [200, -175]]; lx = rx = "palm"; }
  else if (a === "thumb") { rr = [[210, 120], [215, -40]]; rx = "thumb"; }
  else if (a === "phone") { l = [[-200, 60], [-150, -150]]; }
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  else if (a === "lunge") { l = [[200, 120], [330, 110]]; rr = [[190, 170], [320, 175]]; }
  limb(c, [L, l[0], l[1]], r); fist(c, l[1][0], l[1][1], r, lx);
  limb(c, [R, rr[0], rr[1]], r); fist(c, rr[1][0], rr[1][1], r, rx);
  if (a === "phone") {   // his own phone, raised to photograph the board
    c.save(); c.translate(-150, -190); c.rotate(-0.3);
    c.fillStyle = "#111827"; rrect(c, -34, -58, 68, 116, 10); c.fill();
    c.fillStyle = "#94a3b8"; c.beginPath(); c.arc(0, -36, 9, 0, 7); c.fill();
    c.restore();
  }
};

const head = (c: Ctx, m: Mood, talk: boolean, r: () => number) => {
  const hy = -135;
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 98, hy + 5, 18, 28, 0, 0, 7); c.fillStyle = SKIN; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 100, 118, 0, 0, 7); c.fillStyle = SKIN; c.fill();
  stroke(c, circlePts(0, hy, 100, 118), INK, 4, r, { passes: 2, alpha: 0.6 });
  // hair
  c.beginPath(); c.ellipse(0, hy - 62, 104, 70, 0, Math.PI, 0); c.lineTo(104, hy - 30); c.lineTo(84, hy - 40); c.lineTo(-84, hy - 40); c.lineTo(-104, hy - 30); c.closePath();
  c.fillStyle = HAIR; c.fill();
  // brows
  const brow = (sx: number) => {
    const inner = sx * 16, outer = sx * 66;
    let yi = -168, yo = -168;
    if (m === "angry" || m === "yell" || m === "panic" || m === "sus") { yi = -154; yo = -176; }
    if (m === "shock" || m === "confused" || m === "hope") { yi = -186; yo = -184; }
    if (m === "sad" || m === "worried") { yi = -184; yo = -164; }
    if (m === "confused" && sx > 0) { yi = -170; yo = -166; }
    stroke(c, [[inner, hy + (yi + 135)], [outer, hy + (yo + 135)]], HAIR, 13, r, { passes: 2 });
  };
  brow(-1); brow(1);
  // eyes
  [-38, 38].forEach((ex) => {
    const ey = hy - 2;
    if (m === "shock" || m === "panic" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 19, 21, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "sus" || m === "smug") {
      stroke(c, [[ex - 16, ey], [ex + 16, ey - 2]], INK, 6, r, { passes: 2 });
      c.beginPath(); c.arc(ex + 4, ey + 4, 5, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy") {
      stroke(c, circlePts(ex, ey + 6, 15, 12, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else {
      c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill();
    }
  });
  // nose, mustache
  stroke(c, [[2, hy + 6], [12, hy + 34], [-6, hy + 40]], "#8a4f2c", 6, r, { passes: 2 });
  c.beginPath(); c.moveTo(-58, hy + 66); c.quadraticCurveTo(-30, hy + 40, 0, hy + 52); c.quadraticCurveTo(30, hy + 40, 58, hy + 66);
  c.quadraticCurveTo(30, hy + 62, 0, hy + 66); c.quadraticCurveTo(-30, hy + 62, -58, hy + 66); c.fillStyle = HAIR; c.fill();
  // mouth
  const my = hy + 86;
  const open = talk || m === "yell" || m === "panic" || m === "shock";
  if (open) {
    const w = m === "yell" || m === "panic" ? 34 : talk ? 22 : 16, h = m === "yell" || m === "panic" ? 26 : talk ? 13 : 18;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
    if (m === "yell" || m === "panic") { c.fillStyle = "#fff"; c.fillRect(-20, my - h + 2, 40, 7); }
  } else if (m === "smug") {
    stroke(c, [[-22, my + 2], [6, my + 2], [24, my - 10]], INK, 6, r, { passes: 2 });
  } else if (m === "happy" || m === "hope") {
    stroke(c, circlePts(0, my - 8, 26, 14, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "sad" || m === "worried" || m === "angry") {
    stroke(c, circlePts(0, my + 12, 24, 12, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  } else {
    stroke(c, [[-18, my], [18, my]], INK, 6, r, { passes: 2 });
  }
  if (m === "panic" || m === "worried" || m === "shock") {   // a sweat drop
    c.beginPath(); c.moveTo(92, hy - 70); c.quadraticCurveTo(112, hy - 40, 92, hy - 30); c.quadraticCurveTo(76, hy - 40, 92, hy - 70); c.fillStyle = "#7dd3fc"; c.fill();
  }
};

const ravi = (c: Ctx, m: Mood, a: Arms, talk: boolean, p: number, f: number, r: () => number) => {
  const lean = a === "lunge" ? easeOut(seg(p, 0, 0.3)) * 80 : 0;
  const bob = a === "slam" ? Math.max(0, 1 - Math.abs(p - 0.1) * 12) * 14 : 0;
  c.save(); c.translate(RV.x + lean, RV.y + bob); c.rotate(lean / 900);
  c.save();
  c.beginPath(); c.moveTo(-150, 35); c.quadraticCurveTo(0, 5, 150, 35); c.lineTo(190, 430); c.lineTo(-190, 430); c.closePath();
  c.fillStyle = SHIRT; c.fill(); c.clip();
  hatch(c, [-210, 0, 210, 440], ["#ffffff"], r, { angle: 0, gap: 28, w: 3, alpha: 0.3 });
  hatch(c, [-210, 0, 210, 440], ["#ffffff"], r, { angle: Math.PI / 2, gap: 28, w: 3, alpha: 0.3 });
  c.restore();
  stroke(c, [[-150, 35], [-190, 430]], INK, 4, r, { passes: 2, alpha: 0.6 }); stroke(c, [[150, 35], [190, 430]], INK, 4, r, { passes: 2, alpha: 0.6 });
  c.fillStyle = SKIN; c.fillRect(-34, -30, 68, 50);
  c.fillStyle = "#e8eef8"; c.beginPath(); c.moveTo(-52, 16); c.lineTo(0, 74); c.lineTo(52, 16); c.lineTo(30, 6); c.lineTo(0, 42); c.lineTo(-30, 6); c.closePath(); c.fill();
  arms(c, a, p, f, r);
  head(c, m, talk, r);
  c.restore();
};

// ---------- the shop AI on a phone ----------
const phone = (c: Ctx, talk: boolean, f: number, r: () => number, o: { train?: number; forever?: number; happy?: boolean } = {}) => {
  c.save(); c.translate(PH.x, PH.y); c.rotate(-0.05);
  c.fillStyle = "#475569"; c.beginPath(); c.moveTo(-44, 118); c.lineTo(44, 118); c.lineTo(70, 152); c.lineTo(-70, 152); c.closePath(); c.fill();
  c.fillStyle = "#111827"; rrect(c, -86, -150, 172, 290, 24); c.fill();
  c.fillStyle = "#e0f2fe"; rrect(c, -73, -132, 146, 254, 15); c.fill();
  c.font = handF(20); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("Shop AI", 0, -110);
  // the face
  c.fillStyle = COL.orange; rrect(c, -50, -92, 100, 92, 18); c.fill();
  stroke(c, rrectPts(-50, -92, 100, 92), INK, 3, r, { passes: 1, alpha: 0.6 });
  const blink = f % 84 > 79;
  [-22, 22].forEach((ex) => {
    if (blink || o.happy) { stroke(c, o.happy ? circlePts(ex, -50, 10, 8, Math.PI * 1.1, Math.PI * 1.9, 8) : [[ex - 10, -50], [ex + 10, -50]], INK, 4, r, { passes: 1 }); return; }
    c.beginPath(); c.arc(ex, -50, 12, 0, 7); c.fillStyle = "#fff"; c.fill();
    c.beginPath(); c.arc(ex, -48, 5.5, 0, 7); c.fillStyle = INK; c.fill();
  });
  if (talk) { c.beginPath(); c.ellipse(0, -20, 14, 7, 0, 0, 7); c.fillStyle = INK; c.fill(); }
  else stroke(c, [[-14, -20], [14, -20]], INK, 4, r, { passes: 1 });
  if (o.train !== undefined) {   // "Training new notes..." progress bar
    c.font = handF(17); c.fillStyle = "#0f172a"; c.fillText("Training new notes...", 0, 34);
    c.fillStyle = "#cbd5e1"; rrect(c, -60, 46, 120, 16, 8); c.fill();
    c.fillStyle = "#16a34a"; rrect(c, -60, 46, Math.max(10, 120 * o.train), 16, 8); c.fill();
  } else {
    c.font = handF(17); c.fillStyle = "#475569"; c.fillText(talk ? "speaking..." : "online", 0, 40);
  }
  c.restore();
  if (talk) {   // sound waves from the phone speaker
    [0, 1].forEach((k) => {
      const q = ((f / 8 + k * 0.5) % 1);
      stroke(c, circlePts(PH.x + 100, PH.y - 40, 20 + q * 40, 26 + q * 50, -0.8, 0.8, 10), COL.navy, 4, r, { passes: 1, alpha: 0.5 * (1 - q) });
    });
  }
  if (o.forever !== undefined && o.forever > 0) {   // the sticky note slapped on the screen
    const k = easeOut(o.forever);
    c.save(); c.translate(PH.x + 6, PH.y + 26); c.rotate(0.12); c.scale(k * 1.4 - 0.4 * k * k + (1 - k), k * 1.4 - 0.4 * k * k + (1 - k));
    c.fillStyle = "rgba(4,8,40,0.3)"; c.fillRect(-82, -50, 170, 110);
    c.fillStyle = "#fde047"; c.fillRect(-86, -56, 170, 110);
    c.font = caveat(38); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("₹40", 0, -12); c.fillText("FOREVER", 0, 30);
    c.restore();
  }
};

// ---------- props ----------
const sticky = (c: Ctx, x: number, y: number, rot: number, lines: string[], p: number) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.fillStyle = "rgba(4,8,40,0.3)"; c.fillRect(-64, -46, 136, 100);
  c.fillStyle = "#fde047"; c.fillRect(-68, -52, 136, 100);
  c.font = caveat(30); c.fillStyle = INK; c.textAlign = "center";
  lines.forEach((t, i) => c.fillText(t, 0, -16 + i * 34));
  c.restore();
};
const slip = (c: Ctx, x: number, y: number, w: number, h: number, rows: [string, string][], p: number, r: () => number, red = -1) => {
  if (p <= 0) return;
  const hh = h * easeOut(p);
  c.save(); c.beginPath(); c.rect(x - 10, y, w + 20, hh); c.clip();
  c.fillStyle = "#fffdf4"; c.fillRect(x, y, w, h);
  c.font = handF(30); c.textAlign = "left";
  rows.forEach(([a, b], i) => {
    c.fillStyle = INK; c.fillText(a, x + 14, y + 44 + i * 40);
    c.textAlign = "right"; c.fillStyle = i === red ? COL.red : INK; c.fillText(b, x + w - 14, y + 44 + i * 40); c.textAlign = "left";
  });
  c.restore();
  if (red >= 0 && p > 0.7) stroke(c, circlePts(x + w - 50, y + 34 + red * 40, 46, 26), COL.red, 5, r, { passes: 2, alpha: seg(p, 0.7, 0.9) });
};

const wordFrame = (ln: Line, re: RegExp, fallback: number) => {
  const w = (ln.words ?? []).find((x) => re.test(x.w.replace(/[^\w]/g, "")));
  return w ? w.from : fallback;
};

// ---------- the scene (all three parts of the skit use it) ----------
const SkShop: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from;
    if (b.prop === "slam") sfx.push(<Sfx key={"a" + i} at={at + 3} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={"b" + i} at={at + 3} src="audio/gag_bonk.wav" vol={0.5} />);
    if (b.prop === "bill") sfx.push(<Sfx key={"a" + i} at={at} src="audio/sfx_tick.wav" vol={0.45} />);
    if (b.prop === "board") sfx.push(<Sfx key={"a" + i} at={at + 2} src="audio/sfx_pop.wav" vol={0.45} />);
    if (b.prop === "notes") [0, 1, 2].forEach((k) => sfx.push(<Sfx key={"n" + i + k} at={at + 6 + k * 7} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "flashback") sfx.push(<Sfx key={"a" + i} at={at - 2} src="audio/sfx_whoosh.wav" vol={0.5} />);
    if (b.prop === "bills") { const e = wordFrame(l, /^Everyone$/i, at + Math.round(l.frames * 0.55)); sfx.push(<Sfx key={"a" + i} at={e} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={"b" + i} at={e} src="audio/sfx_whoosh.wav" vol={0.5} />); }
    if (b.prop === "mondays") [0, 1, 2].forEach((k) => sfx.push(<Sfx key={"m" + i + k} at={at + 8 + k * 9} src="audio/sfx_tick.wav" vol={0.35} />));
    if (b.prop === "pin") { const fl = at + Math.round(l.frames * 0.35); sfx.push(<Sfx key={"a" + i} at={fl} src="audio/sfx_snap.wav" vol={0.6} />, <Sfx key={"b" + i} at={fl + 10} src="audio/sfx_pop.wav" vol={0.45} />); }
    if (b.prop === "refunds") [0, 1, 2, 3].forEach((k) => sfx.push(<Sfx key={"r" + i + k} at={at + 10 + k * 8} src="audio/sfx_tick.wav" vol={0.3} />));
    if (b.prop === "training") { const e = wordFrame(l, /^Forever$/i, at + Math.round(l.frames * 0.8)); sfx.push(<Sfx key={"a" + i} at={at} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={"b" + i} at={e} src="audio/sfx_snap.wav" vol={0.6} />); }
    if (b.prop === "freeze") { const fz = at + Math.round(l.frames * 0.45); sfx.push(<Sfx key={"a" + i} at={fz} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={"b" + i} at={fz} src="audio/sfx_snap.wav" vol={0.7} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f0, boil0) => {
        let i = idx(f0);
        const b0 = beats[i], l0 = ls[i];
        const freezeAt = b0.prop === "freeze" ? l0.from + Math.round(l0.frames * 0.45) : Infinity;
        const f = Math.min(f0, freezeAt), boil = f0 >= freezeAt ? 0 : boil0;
        i = idx(f);
        const b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(7100 + boil);
        const talkOf = (who: string) => b.who === who && (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        // camera: cut to the speaker's shot each line, slow push-in, shake on the slam / the freeze
        const sh = SHOTS[b.prop === "board" ? "board" : b.prop === "freeze" ? "lunge" : b.shot] ?? SHOTS.wide;
        const z = sh.z * (1 + 0.035 * p);
        const shake = (b.prop === "slam" && p < 0.16 ? 9 : 0) + (f0 >= freezeAt ? Math.max(0, 1 - (f0 - freezeAt) / 12) * 14 : 0);
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.fillStyle = WALL; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
        shop(c, r);
        const n = b.n;
        // the price board's tomato line lights up while Ravi points at it
        if (n === 5) stroke(c, circlePts(170, 444, 150, 36), COL.yellow, 7, r, { passes: 2, alpha: seg(p, 0.15, 0.3) });
        // Ravi (flashback: June, with the nephew and a laptop)
        const [mood, armPose] = RAVI[n] ?? ["angry", "rest"];
        ravi(c, mood, armPose, talkOf("ravi"), p, f, r);
        if (n === 10) {
          kid(c, 210, 760, 150, boil, 3, true);
          c.fillStyle = "#334155"; rrect(c, 120, 900, 190, 110, 8); c.fill(); c.fillStyle = "#93c5fd"; rrect(c, 132, 910, 166, 86, 6); c.fill();
          bubble(c, "Train it once. It'll remember!", 300, 296, 640, "me", seg(p, 0.1, 0.25), r, { size: 54 });
        }
        counter(c, r);
        // persistent props on the counter
        if (n >= 8 && n <= 16) {
          const out = n === 16 ? 1 - seg(p, 0.5, 0.75) : 1;
          c.save(); c.globalAlpha = out;
          if (n !== 14) sticky(c, 680, 760, -0.12, ["JUNE", "PRICES"], n === 8 ? seg(p, 0.15, 0.3) : 1);
          sticky(c, 930, 780, 0.1, ["Tomato", "₹60"], n === 8 ? seg(p, 0.25, 0.4) : 1);
          sticky(c, 935, 980, -0.06, ["Onion", "₹45"], n === 8 ? seg(p, 0.35, 0.5) : 1);
          c.restore();
        }
        const pinned = n > 16 || (n === 16 && p > 0.45);
        if (pinned) {   // the price board photo pinned above the AI
          const k = n === 16 ? easeOut(seg(p, 0.45, 0.6)) : 1;
          c.save(); c.translate(800, 690); c.rotate(-0.06); c.scale(k, k);
          c.fillStyle = "#fff"; c.fillRect(-90, -70, 180, 150);
          c.fillStyle = "#1f3a2e"; c.fillRect(-78, -58, 156, 108);
          c.font = caveat(22); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("TODAY'S PRICES", 0, -32);
          c.fillStyle = "#fde68a"; c.fillText("Tomatoes ₹40", 0, -4); c.fillText("Onions ₹30", 0, 22);
          c.beginPath(); c.arc(0, -64, 9, 0, 7); c.fillStyle = COL.red; c.fill();
          c.restore();
        }
        if (n === 4) {
          const q = seg(p, 0.05, 0.35);
          if (q > 0) {
            c.save(); c.beginPath(); c.rect(880, 700, 190, 200 * easeOut(q)); c.clip();
            c.fillStyle = "#fffdf4"; c.fillRect(890, 700, 160, 200);
            c.font = handF(30); c.fillStyle = INK; c.textAlign = "left"; c.fillText("TOMATO 1kg", 900, 744);
            c.font = caveat(66); c.fillStyle = COL.red; c.fillText("₹60", 920, 812);
            c.font = handF(26); c.fillStyle = INK; c.fillText("bill #4,213", 900, 868);
            c.restore();
            if (q > 0.8) stroke(c, circlePts(966, 792, 62, 40), COL.red, 5, r, { passes: 2, alpha: seg(p, 0.3, 0.4) });
          }
        }
        if (n === 12) {   // bills since June: the stack shoots up past the ceiling
          const e = wordFrame(ln, /^Everyone$/i, ln.from + Math.round(ln.frames * 0.55));
          const q = easeOut(seg(f, e - 2, e + 14));
          for (let k = 0; k < 40; k++) {
            const y = COUNTER - 14 - k * 22 * q * 1.6;
            if (y < 120) break;
            c.fillStyle = k % 2 ? "#fffdf4" : "#f1f5f9"; c.fillRect(600 + Math.sin(k * 1.7) * 8, y, 120, 16);
          }
          if (q > 0.6) tag(c, "since June", 660, 400, 40, COL.yellow, INK, -0.05, seg(f, e + 8, e + 14));
        }
        if (n === 14) {   // a calendar flipping Mondays
          c.save(); c.translate(640, 830); c.rotate(-0.05);
          c.fillStyle = "#fff"; c.fillRect(-80, -80, 160, 170); c.fillStyle = COL.red; c.fillRect(-80, -80, 160, 40);
          c.font = caveat(34); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("MON", 0, -48);
          const d = 3 + 7 * Math.min(4, Math.floor(seg(p, 0.05, 0.7) * 5));
          c.font = caveat(64); c.fillStyle = INK; c.fillText(String(d), 0, 30);
          c.restore();
          if (p > 0.55) stamp(c, "₹60?", 640, 930, 52, COL.red, seg(p, 0.55, 0.65), r, -0.15);
        }
        if (n === 17) {   // refund slips spewing out of the phone
          const q = seg(p, 0.1, 1);
          for (let k = 0; k < Math.floor(q * 12); k++) {
            const x = 650 + (k % 4) * 100, y = 1110 - Math.floor(k / 4) * 34;
            c.save(); c.translate(x, y); c.rotate((k % 2 ? 1 : -1) * 0.12);
            c.fillStyle = "#fffdf4"; c.fillRect(-60, -18, 120, 36);
            c.font = handF(22); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("REFUND ₹20", 0, 8);
            c.restore();
          }
        }
        // the AI
        const train = n === 19 ? seg(p, 0.05, 0.75) : undefined;
        const forever = n === 19 ? seg(f, wordFrame(ln, /^Forever$/i, ln.from + Math.round(ln.frames * 0.8)), wordFrame(ln, /^Forever$/i, ln.from + Math.round(ln.frames * 0.8)) + 8) : n === 20 ? 1 : undefined;
        phone(c, talkOf("ai"), f, r, { train: n === 20 ? 1 : train, forever, happy: n === 19 && p > 0.8 });
        c.restore();
        // screen-space overlays
        if (n === 10) {   // the flashback: a warm sepia wash and a frame
          c.save(); c.globalAlpha = 0.32; c.fillStyle = "#a16207"; c.fillRect(0, 0, W, H); c.restore();
          c.save(); c.strokeStyle = "#fff7e6"; c.lineWidth = 26; c.strokeRect(30, 250, W - 60, 1180); c.restore();
          tag(c, "JUNE", W / 2, 1380, 64, "#fff7e6", INK, -0.03, seg(p, 0.05, 0.15));
        }
        if (n === 16) {   // the camera flash
          const fl = seg(p, 0.33, 0.36) * (1 - seg(p, 0.36, 0.48));
          if (fl > 0) { c.save(); c.globalAlpha = fl; c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
        }
        if (f0 >= freezeAt) {   // the freeze frame
          c.save(); c.globalAlpha = 0.28; c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H); c.restore();
          const k = easeOut(seg(f0, freezeAt, freezeAt + 6));
          c.save(); c.translate(W / 2, 560); c.rotate(-0.08); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
          c.font = caveat(190); c.textAlign = "center"; c.lineWidth = 16; c.strokeStyle = INK; c.strokeText("NOOOO!", 0, 0);
          c.fillStyle = COL.red; c.fillText("NOOOO!", 0, 0);
          c.restore();
        }
        if (s.id === "sk_a" && f0 < 4) { c.save(); c.globalAlpha = 1 - f0 / 4; c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
        void fade; void hand; void label; void stroke;
      }} />
    </>
  );
};

export const SKIT_SCENES = { sk_shop: SkShop };
