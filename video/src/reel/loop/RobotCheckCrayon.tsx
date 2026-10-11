import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade, arrow } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, GREY, caveat, handF, fitSize, label, stamp, card } from "./WordsCrayon";

// "Is she a robot?": how a normal clip of a real person gets turned into "proof" (slow motion, copies of copies,
// AI "enhance" filters, an added story), a check-before-you-share list, and the AI angle.
// No footage and no likeness: every person is a faceless doodle silhouette. Content band: y 270..1400.
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SKIN = "#e9c4a0";
const DRESS = "#c2410c";
const SUIT = "#334155";
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Faceless standing figure (head + shoulders + body), the generic "person in the clip".
const figure = (c: Ctx, x: number, y: number, s: number, r: () => number, body = DRESS, a = 1) => {
  if (a <= 0) return;
  c.save(); c.globalAlpha = clamp(a);
  c.beginPath(); c.moveTo(x - 0.62 * s, y + 2.6 * s); c.quadraticCurveTo(x - 0.7 * s, y + 0.8 * s, x - 0.18 * s, y + 0.62 * s);
  c.lineTo(x + 0.18 * s, y + 0.62 * s); c.quadraticCurveTo(x + 0.7 * s, y + 0.8 * s, x + 0.62 * s, y + 2.6 * s); c.closePath();
  c.fillStyle = body; c.fill();
  c.beginPath(); c.arc(x, y, 0.42 * s, 0, 7); c.fillStyle = SKIN; c.fill();
  c.beginPath(); c.ellipse(x, y - 0.16 * s, 0.46 * s, 0.32 * s, 0, Math.PI, 0); c.fillStyle = "#6b4f3a"; c.fill();
  c.restore();
  stroke(c, circlePts(x, y, 0.42 * s, 0.42 * s, 0, Math.PI * 2, 20), COL.ink, Math.max(2, 0.06 * s), r, { passes: 1, alpha: 0.5 * a });
};

// A little press-event picture: a desk, a seated figure from behind, a standing figure behind the desk.
const eventPic = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, a = 1) => {
  if (a <= 0) return;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.globalAlpha = clamp(a);
  c.fillStyle = "#dbeafe"; c.fillRect(x, y, w, h);
  c.fillStyle = "#bfdbfe"; c.fillRect(x, y + h * 0.62, w, h * 0.38);
  c.fillStyle = "#fef3c7"; c.fillRect(x + w * 0.08, y + h * 0.12, w * 0.16, h * 0.36);   // window
  c.fillStyle = "#fef3c7"; c.fillRect(x + w * 0.76, y + h * 0.12, w * 0.16, h * 0.36);
  c.restore();
  figure(c, x + w * 0.66, y + h * 0.36, h * 0.13, r, DRESS, a);
  c.save(); c.globalAlpha = clamp(a);
  c.fillStyle = "#7c4a1e"; c.fillRect(x + w * 0.12, y + h * 0.66, w * 0.76, h * 0.2);   // desk
  c.restore();
  figure(c, x + w * 0.36, y + h * 0.6, h * 0.12, r, SUIT, a);
  c.save(); c.globalAlpha = clamp(a); c.fillStyle = "#5b3714"; c.fillRect(x + w * 0.12, y + h * 0.84, w * 0.76, h * 0.04); c.restore();
};

// Draw `fn` at low resolution and blow it up with hard pixels (a bad copy). block = pixel size in output px.
const pixelated = (c: Ctx, x: number, y: number, w: number, h: number, block: number, fn: (o: Ctx, ow: number, oh: number) => void) => {
  if (block <= 1) { c.save(); c.translate(x, y); fn(c, w, h); c.restore(); return; }
  const ow = Math.max(4, Math.round(w / block)), oh = Math.max(4, Math.round(h / block));
  const off = document.createElement("canvas"); off.width = ow; off.height = oh;
  const o = off.getContext("2d")!;
  o.scale(ow / w, oh / h); fn(o, w, h);
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(off, x, y, w, h); c.restore();
};

// Phone outline with a screen; returns the screen box.
const phone = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, a = 1): [number, number, number, number] => {
  c.save(); c.globalAlpha = clamp(a);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 40); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, y, w, h, 40); c.fill();
  c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 5, r, { passes: 2, alpha: 0.7 * a });
  return [x + 18, y + 54, w - 36, h - 108];
};

// Old TV with a stand; returns the screen box.
const tv = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, a = 1): [number, number, number, number] => {
  c.save(); c.globalAlpha = clamp(a);
  c.fillStyle = "#4b5563"; c.fillRect(x + w * 0.42, y + h, w * 0.16, 40); c.fillRect(x + w * 0.3, y + h + 36, w * 0.4, 14);
  c.fillStyle = "#1f2937"; rrect(c, x, y, w, h, 24); c.fill();
  c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 5, r, { passes: 2, alpha: 0.7 * a });
  return [x + 22, y + 22, w - 44, h - 44];
};

// An eye whose lid closes by `shut` (0 open .. 1 closed).
const blinkEye = (c: Ctx, x: number, y: number, s: number, r: () => number, shut: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 0, 110, 62, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 0, 110, 62, 0, 0, 7); c.clip();
  c.beginPath(); c.arc(0, 0, 44, 0, 7); c.fillStyle = "#7c5a3a"; c.fill();
  c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fillStyle = COL.ink; c.fill();
  c.beginPath(); c.arc(14, -14, 8, 0, 7); c.fillStyle = "#fff"; c.fill();
  const lid = -62 + 124 * clamp(shut);
  c.fillStyle = SKIN; c.fillRect(-120, -70, 240, lid + 70);
  c.restore();
  stroke(c, circlePts(0, 0, 110, 62, 0, Math.PI * 2, 40), COL.ink, 7, r, { passes: 2 });
  stroke(c, [[-104, lid], [-50, lid + 6], [0, lid + 8], [50, lid + 6], [104, lid]], COL.ink, 6, r, { passes: 1, alpha: shut > 0.05 ? 0.8 : 0 });
  c.restore();
};

// Speed dial from 0.25x to 4x with the needle at `v` (log scale, 1x straight up).
const speedDial = (c: Ctx, cx: number, cy: number, R: number, v: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const ang = (s: number) => Math.PI * 1.5 + (Math.log2(s) / 2) * (Math.PI / 2);
  c.save(); c.globalAlpha = clamp(p * 1.5);
  c.beginPath(); c.arc(cx, cy, R, Math.PI, 0); c.lineTo(cx + R, cy + 20); c.lineTo(cx - R, cy + 20); c.closePath();
  c.fillStyle = COL.cream; c.fill();
  c.restore();
  stroke(c, circlePts(cx, cy, R, R, Math.PI, Math.PI * 2, 30), COL.ink, 6, r, { passes: 2, alpha: p });
  ([[0.25, "0.25x"], [0.5, "0.5x"], [1, "1x"], [2, "2x"], [4, "4x"]] as const).forEach(([s, t]) => {
    const a = ang(s), k = s === 0.25 || s === 4 ? 0.62 : 0.66;
    stroke(c, [[cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10)], [cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)]], COL.ink, 5, r, { passes: 1, alpha: p });
    label(c, t, cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k + (s === 0.25 || s === 4 ? -6 : 14), 42, s === 1 ? "#15803d" : INK, caveat, p);
  });
  const a = ang(v);
  stroke(c, [[cx, cy], [cx + Math.cos(a) * (R - 46), cy + Math.sin(a) * (R - 46)]], COL.red, 10, r, { passes: 2, alpha: p });
  c.save(); c.globalAlpha = clamp(p * 1.5); c.beginPath(); c.arc(cx, cy, 16, 0, 7); c.fillStyle = COL.red; c.fill(); c.restore();
};

// Plain doodle face (generic, not anyone): `warp` 0 = normal, 1 = over-sharpened, warped "AI enhance" look.
const doodleFace = (c: Ctx, cx: number, cy: number, s: number, r: () => number, warp: number, blur = 0) => {
  c.save();
  if (blur > 0) c.filter = `blur(${blur}px)`;
  const pts: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const k = 1 + warp * (0.09 * Math.sin(a * 3 + 0.6) + 0.05 * Math.sin(a * 7));
    pts.push([cx + Math.cos(a) * 0.8 * s * k, cy + Math.sin(a) * s * k]);
  }
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = SKIN; c.fill();
  c.beginPath(); c.ellipse(cx, cy - 0.55 * s, 0.86 * s, 0.55 * s, 0, Math.PI, 0); c.fillStyle = "#6b4f3a"; c.fill();
  const ex = 0.3 * s, ey = -0.08 * s, er = 0.09 * s * (1 + warp * 0.6);
  [[-ex + warp * 0.05 * s, ey], [ex, ey - warp * 0.06 * s]].forEach(([dx, dy]) => {
    c.beginPath(); c.ellipse(cx + dx, cy + dy, er * 1.5, er, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
    c.beginPath(); c.arc(cx + dx, cy + dy, er * 0.7, 0, 7); c.fillStyle = COL.ink; c.fill();
  });
  c.strokeStyle = "#9a3412"; c.lineWidth = 0.05 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(cx - 0.25 * s, cy + 0.4 * s); c.quadraticCurveTo(cx, cy + (0.5 + 0.12 * warp) * s, cx + 0.25 * s, cy + (0.4 - 0.08 * warp) * s); c.stroke();
  c.restore();
  if (warp > 0) {   // halo outlines and crunchy contrast: what over-sharpening does to edges
    stroke(c, pts, "#000", 0.035 * s * (1 + 2 * warp), r, { passes: 2, alpha: 0.9 * warp, jit: 1 });
    stroke(c, pts.map(([x, y]) => [cx + (x - cx) * 1.06, cy + (y - cy) * 1.05] as Pt), "#fff", 0.03 * s, r, { passes: 1, alpha: 0.7 * warp, jit: 1 });
  } else if (blur === 0) {
    stroke(c, pts, COL.ink, 0.03 * s, r, { passes: 1, alpha: 0.5 });
  }
};

// Speech-bubble comment that pops in and drifts up.
const comment = (c: Ctx, text: string, x: number, y: number, col: string, p: number, rot: number) => {
  if (p <= 0) return;
  c.save(); c.translate(x, y - 60 * p); c.rotate(rot); const k = easeOut(clamp(p * 4)); c.scale(k, k);
  c.font = caveat(60); const w = c.measureText(text).width;
  c.fillStyle = "#fff"; rrect(c, -w / 2 - 26, -58, w + 52, 84, 24); c.fill();
  c.beginPath(); c.moveTo(-20, 24); c.lineTo(-38, 50); c.lineTo(4, 24); c.fill();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(text, 0, 2); c.restore();
};

const tick = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  c.save(); c.globalAlpha = 1; c.fillStyle = "#fff"; rrect(c, x - s / 2, y - s / 2, s, s, 10); c.fill(); c.restore();
  stroke(c, rrectPts(x - s / 2, y - s / 2, s, s), COL.ink, 5, r, { passes: 1, alpha: 0.8 });
  if (p <= 0) return;
  const pts: Pt[] = [[x - s * 0.3, y], [x - s * 0.05, y + s * 0.28], [x + s * 0.42, y - s * 0.38]];
  const n = p < 0.5 ? [pts[0], [lerp(pts[0][0], pts[1][0], p * 2), lerp(pts[0][1], pts[1][1], p * 2)] as Pt]
    : [pts[0], pts[1], [lerp(pts[1][0], pts[2][0], (p - 0.5) * 2), lerp(pts[1][1], pts[2][1], (p - 0.5) * 2)] as Pt];
  stroke(c, n, "#15803d", 12, r, { passes: 2, alpha: 0.95 });
};

const title = (c: Ctx, n: string, t: string, f: number, r: () => number) => {
  if (n) tag(c, n, 540, 300, 44, COL.orange, "#fff", -0.03, seg(f, 0, 8));
  hand(c, t, 540, 392, 84, COL.yellow, seg(f, 2, 16), r, -0.02, "center");
};

// ---------- 1 HOOK ----------
const RcHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={1} />
      <Sfx at={0} src="audio/sfx_whoosh.wav" vol={0.55} />
      {[8, 14, 20].map((a) => <Sfx key={a} at={a} src="audio/sfx_pop.wav" vol={0.3} />)}
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4100 + boil);
        const out = 1 - fade(f, c3 - 4, 10);
        if (out > 0) {
          tag(c, "FACT CHECK", W / 2, 296, 40, COL.orange, "#fff", -0.03, seg(f, 0, 6) * out);
          c.save(); c.globalAlpha = out; hand(c, "NOT A ROBOT", W / 2, 408, 110, COL.yellow, seg(f, 0, 12), r, -0.02, "center"); c.restore();
          const [sx, sy, sw, sh] = phone(c, 330, 450, 420, 600, r, out);
          eventPic(c, sx, sy, sw, sh, r, out);
          ([["robot?!", 190, 560, COL.red, -0.08, 6], ["alien??", 890, 650, COL.orange, 0.07, 12], ["clone!!", 200, 860, "#7c3aed", 0.05, 18]] as const).forEach(([t, x, y, col, rot, at], i) => {
            const p = seg(f, at, at + 40) * out;
            comment(c, t, x, y, col, Math.min(p, 0.5), rot);
            const k = seg(f, c1 + i * 4, c1 + 8 + i * 4);   // crossed out when the voice says "not a robot"
            if (k > 0) stroke(c, [[x - 110, y - 20 - 30], [x - 110 + 220 * k, y - 20 - 30 - 10 * k]], COL.red, 12, r, { passes: 2, alpha: 0.95 * out });
          });
          if (f >= c2) {
            const p = fade(f, c2, 10) * out;
            card(c, 90, 1080, 900, 290, r, p, COL.cream);
            label(c, "Susan Dell", 130, 1162, 84, INK, caveat, p, "left");
            label(c, "charity co-founder, married to Dell's founder", 130, 1236, fitSize(c, "charity co-founder, married to Dell's founder", 820, 52, caveat), INK, caveat, p, "left");
            label(c, "Source: White House · Oct 7, 2026", 130, 1310, 42, GREY, caveat, p, "left");
            tag(c, "real video, not AI", 790, 1130, 42, COL.green, INK, 0.05, seg(f, c2 + 8, c2 + 16) * out);
          }
        }
        if (f >= c3) {
          hand(c, "4 tricks turned a", W / 2, 600, 92, COL.yellow, seg(f, c3, c3 + 14), r, -0.02, "center");
          hand(c, "normal clip into \"proof\"", W / 2, 720, 92, COL.yellow, seg(f, c3 + 8, c3 + 22), r, -0.02, "center");
          for (let i = 0; i < 4; i++) {
            const q = seg(f, c3 + 12 + i * 4, c3 + 20 + i * 4);
            const x = 225 + i * 210;
            c.save(); c.globalAlpha = clamp(q * 1.5); c.beginPath(); c.arc(x, 940, 76, 0, 7); c.fillStyle = COL.cream; c.fill(); c.restore();
            stroke(c, circlePts(x, 940, 76, 76), COL.ink, 5, r, { passes: 2, alpha: q });
            label(c, String(i + 1), x, 970, 90, COL.orange, caveat, q);
          }
        }
      }} />
    </>
  );
};

// ---------- 2 TRICK 1: SLOW IT DOWN ----------
const RcSlow: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.45} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4200 + boil);
        title(c, "TRICK 1", "slow it down", f, r);
        const v = f < 18 ? 1 : lerp(1, 0.35, easeOut(seg(f, 18, 34)));
        speedDial(c, W / 2, 700, 210, v, r, seg(f, 4, 14));
        label(c, "(example)", W / 2 + 250, 690, 38, COL.pale, handF, seg(f, 30, 40), "left");
        if (f >= c1) {
          const p = fade(f, c1, 10), t = f - c1;
          const quick = t % 36 < 5 ? Math.sin((t % 36) / 5 * Math.PI) : 0;          // a normal blink: ~0.15 s
          const slow = Math.sin(clamp((t % 72) / 40) * Math.PI);                   // the same blink at 1/4 speed
          card(c, 70, 780, 450, 330, r, p, COL.cream);
          card(c, 560, 780, 450, 330, r, p, COL.cream);
          if (p > 0.3) { blinkEye(c, 295, 930, 1.3, r, quick); blinkEye(c, 785, 930, 1.3, r, slow); }
          label(c, "normal speed", 295, 1068, 50, INK, caveat, p);
          label(c, "slowed down", 785, 1068, 50, COL.red, caveat, p);
          label(c, "\"robot blink\"", 785, 840, 44, GREY, caveat, seg(f, c1 + 20, c1 + 30));
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          stamp(c, "SLOWED DOWN", 330, 1214, 76, COL.red, seg(f, c2, c2 + 8), r, -0.07);
          tag(c, "original: normal", 790, 1206, 50, COL.green, INK, 0.04, seg(f, c2 + 14, c2 + 22));
          label(c, "Lead Stories fact check, Feb 2026: a Dec 2025 White House clip,", W / 2, 1310, fitSize(c, "Lead Stories fact check, Feb 2026: a Dec 2025 White House clip,", 940, 40, caveat), COL.cream, caveat, p);
          label(c, "compared with the C-SPAN original", W / 2, 1358, 40, COL.cream, caveat, p);
        }
      }} />
    </>
  );
};

// ---------- 3 TRICK 2: COPIES OF COPIES ----------
const RcCopies: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      {[0, 6, 12].map((d) => <Sfx key={d} at={c2 + d} src="audio/sfx_tick.wav" vol={0.35} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4300 + boil);
        title(c, "TRICK 2", "copies of copies", f, r);
        label(c, "like a WhatsApp forward", W / 2, 452, 50, COL.cream, caveat, seg(f, 8, 18));
        const a = seg(f, 4, 14);
        const [tx, ty, tw, th] = tv(c, 90, 500, 560, 340, r, a);
        if (a > 0) eventPic(c, tx, ty, tw, th, r, a);
        const pp = seg(f, 12, 24);
        if (pp > 0) {
          c.save(); c.translate(lerp(120, 0, easeOut(pp)), 0);
          const [sx, sy, sw, sh] = phone(c, 690, 490, 300, 430, r, pp);
          pixelated(c, sx, sy + sh * 0.25, sw, sh * 0.5, 7, (o, w, h) => eventPic(o, 0, 0, w, h, rng(5), 1));
          c.save(); c.globalAlpha = clamp(pp * 1.5); c.beginPath(); c.arc(sx + 30, sy + 30, 12, 0, 7); c.fillStyle = f % 30 < 18 ? COL.red : "#7f1d1d"; c.fill(); c.restore();
          label(c, "REC", sx + 52, sy + 42, 34, COL.red, caveat, pp, "left");
          c.restore();
        }
        if (f >= c1) {
          const p = fade(f, c1, 10);
          tag(c, "4.5M views (Oct 11)", 280, 1000, 50, COL.yellow, INK, -0.04, p);
          label(c, "= a phone filming a TV", 520, 1016, 54, COL.cream, caveat, p, "left");
        }
        if (f >= c2) {
          [3, 9, 20].forEach((b, i) => {
            const q = seg(f, c2 + i * 6, c2 + 8 + i * 6);
            if (q <= 0) return;
            const x = 80 + i * 320, y = 1070;
            c.save(); c.globalAlpha = clamp(q * 1.5);
            pixelated(c, x, y, 280, 200, b, (o, w, h) => eventPic(o, 0, 0, w, h, rng(5), 1));
            c.restore();
            stroke(c, rrectPts(x, y, 280, 200), COL.ink, 4, r, { passes: 1, alpha: 0.6 * q });
            label(c, `copy ${i + 1}`, x + 140, y + 240, 46, COL.cream, caveat, q);
          });
          label(c, "each copy smears detail", W / 2, 1376, 56, COL.yellow, caveat, seg(f, c2 + 18, c2 + 28));
        }
      }} />
    </>
  );
};

// ---------- 4 TRICK 3: AI "ENHANCE" ----------
const RcEnhance: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={16} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_tick.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4400 + boil);
        title(c, "TRICK 3", "AI \"enhance\" filters", f, r);
        const a = seg(f, 4, 12);
        if (a > 0) {
          card(c, 70, 460, 300, 330, r, a, COL.cream);
          c.save(); c.globalAlpha = clamp(a * 1.5);
          pixelated(c, 90, 480, 260, 290, 16, (o, w, h) => doodleFace(o, w / 2, h / 2 + 10, 110, rng(9), 0));
          c.restore();
          label(c, "blurry", 220, 840, 46, COL.cream, caveat, a);
        }
        const b = seg(f, 14, 24);
        tag(c, "ENHANCE", W / 2, 640, 54, COL.light, "#fff", 0, b);
        arrow(c, [380, 700], [700, 700], -30, COL.yellow, 8, b, r);
        const d = seg(f, 22, 34);
        if (d > 0) {
          card(c, 710, 460, 300, 330, r, d, COL.cream);
          doodleFace(c, 860, 635, 110, r, d);
          label(c, "\"sharp\"", 860, 840, 46, COL.cream, caveat, d);
        }
        if (f >= c1) {
          const p = fade(f, c1, 10);
          label(c, "the filter guesses the missing detail", W / 2, 910, fitSize(c, "the filter guesses the missing detail", 940, 58, caveat), COL.yellow, caveat, p);
          const q = seg(f, c1 + 14, c1 + 24);
          card(c, 90, 940, 900, 130, r, q, "#fff6d8");
          label(c, "US court (2024):", W / 2, 994, 48, INK, caveat, q);
          label(c, "AI-enhanced video not allowed as evidence", W / 2, 1046, fitSize(c, "AI-enhanced video not allowed as evidence", 860, 48, caveat), INK, caveat, q);
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 110, 1096, 400, 220, r, p, COL.cream);
          card(c, 570, 1096, 400, 220, r, seg(f, c2 + 8, c2 + 18), COL.cream);
          if (p > 0.3) doodleFace(c, 310, 1196, 74, r, 0);
          if (f >= c2 + 12) doodleFace(c, 770, 1196, 74, r, 1);
          label(c, "normal shot (0:24)", 310, 1302, 42, GREY, caveat, p);
          label(c, "filtered close-up (0:25)", 770, 1302, 42, COL.red, caveat, seg(f, c2 + 8, c2 + 18));
          label(c, "what we saw in one viral compilation", W / 2, 1368, 40, COL.pale, caveat, seg(f, c2 + 14, c2 + 24));
        }
      }} />
    </>
  );
};

// ---------- 5 TRICK 4: ADD A STORY ----------
const RcStory: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      {[0, 8, 16].map((d) => <Sfx key={d} at={c1 + d} src="audio/sfx_pop.wav" vol={0.4} />)}
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4500 + boil);
        title(c, "TRICK 4", "add a story", f, r);
        const a = seg(f, 4, 14);
        if (a > 0) {
          card(c, 140, 450, 800, 560, r, a, COL.cream);
          eventPic(c, 170, 480, 740, 500, r, a);
        }
        if (f >= c1) {
          const q1 = seg(f, c1, c1 + 10), q2 = seg(f, c1 + 10, c1 + 20);
          const fx = 170 + 740 * 0.66, fy = 480 + 500 * 0.36;   // standing figure's head
          stroke(c, circlePts(fx, fy + 10, 90, 100, -1.2, -1.2 + Math.PI * 2 * q1, 30), COL.red, 9, r, { passes: 2, alpha: 0.95 });
          arrow(c, [fx - 330, fy - 60], [fx - 100, fy], -40, COL.red, 9, q1, r);
          if (q2 > 0) {   // a narrator telling you what to see
            c.save(); c.globalAlpha = clamp(q2 * 1.5);
            c.fillStyle = "#374151"; rrect(c, 196, 800, 54, 90, 26); c.fill(); c.fillRect(218, 890, 10, 40); c.fillRect(196, 926, 54, 10);
            c.restore();
            comment(c, "\"look closely...\"", 470, 860, INK, Math.min(q2, 0.5), -0.04);
          }
        }
        if (f >= c2) {
          stamp(c, "EDITING, NOT PROOF", W / 2, 1190, 84, COL.yellow, seg(f, c2, c2 + 8), r, -0.05);
        }
      }} />
    </>
  );
};

// ---------- 6 HOW TO CHECK (one sign per trick) ----------
const RcCheck: React.FC<SP> = ({ cue }) => {
  const cs = [cue(1), cue(2), cue(3), cue(4)];
  const ROWS = [["1 · slowed?", "everyone moves like they're underwater"], ["2 · a copy?", "blur, glare, another app's logo"],
    ["3 · a filter?", "waxy skin, eyes that change shape"], ["4 · just the story?", "mute it, ignore the circle: still weird?"]];
  return (
    <>
      {cs.map((a, i) => <Sfx key={i} at={a + 10} src="audio/sfx_tick.wav" vol={0.45} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4600 + boil);
        hand(c, "next time it lands in your group", W / 2, 360, 72, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        ROWS.forEach(([t1, t2], i) => {
          if (f < cs[i]) return;
          const y = 410 + i * 238, p = fade(f, cs[i], 10);
          if (!card(c, 60, y, 960, 214, r, p, COL.cream)) return;
          tick(c, 140, y + 107, 84, r, seg(f, cs[i] + 10, cs[i] + 20));
          label(c, t1, 220, y + 92, 66, INK, caveat, p, "left");
          label(c, t2, 220, y + 164, fitSize(c, t2, 770, 50, caveat), GREY, caveat, p, "left");
        });
      }} />
    </>
  );
};

// ---------- 7 VERDICT + CTA ----------
const RcClose: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.55} />
      <Sfx at={c2 + 30} src="audio/sfx_success.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4700 + boil);
        hand(c, "so, is she a robot?", W / 2, 420, 92, COL.cream, seg(f, 0, 14), r, -0.02, "center");
        if (f >= c1) {
          stamp(c, "REAL PERSON", W / 2, 640, 120, COL.green, seg(f, c1, c1 + 8), r, -0.05);
          label(c, "edited clips", W / 2, 770, 70, COL.yellow, caveat, seg(f, c1 + 10, c1 + 20));
        }
        if (f >= c2) {
          const p = fade(f, c2, 12);
          label(c, "AI didn't fake her:", W / 2, 910, 64, COL.cream, caveat, p);
          label(c, "copies, filters and a voice-over", W / 2, 984, 60, COL.cream, caveat, seg(f, c2 + 8, c2 + 20));
          label(c, "made the \"proof\"", W / 2, 1056, 60, COL.cream, caveat, seg(f, c2 + 16, c2 + 28));
          label(c, "originals: links in the caption", W / 2, 1140, 44, COL.pale, handF, seg(f, c2 + 24, c2 + 34));
          c.save(); c.globalAlpha = easeOut(seg(f, c2 + 30, c2 + 42));
          c.font = caveat(handle.length > 16 ? 76 : 88); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1276);
          c.shadowBlur = 0; c.font = handF(44); c.fillStyle = COL.cream; c.fillText("AI, explained simply", W / 2, 1336);
          c.restore();
        }
      }} />
    </>
  );
};

export const ROBOT_SCENES = { rc_hook: RcHook, rc_slow: RcSlow, rc_copies: RcCopies, rc_enhance: RcEnhance, rc_story: RcStory, rc_check: RcCheck, rc_close: RcClose };
