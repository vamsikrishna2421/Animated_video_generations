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
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.7} />
      {[8, 16, 24].map((a) => <Sfx key={a} at={a} src="audio/sfx_pop.wav" vol={0.35} />)}
      <Sfx at={c1} src="audio/sfx_tick.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4100 + boil);
        const out = 1 - fade(f, c2 - 4, 10);
        if (out > 0) {
          const [sx, sy, sw, sh] = phone(c, 290, 300, 500, 760, r, out);
          eventPic(c, sx, sy, sw, sh, r, out);
          ([["robot?!", 210, 470, COL.red, -0.08, 6], ["alien??", 880, 560, COL.orange, 0.07, 14], ["clone!!", 220, 760, "#7c3aed", 0.05, 22]] as const)
            .forEach(([t, x, y, col, rot, at]) => comment(c, t, x, y, col, seg(f, at, at + 60) * out * (f < c1 ? 1 : 1 - fade(f, c1, 8)), rot));
          const views = lerp(0, 4550000, easeOut(seg(f, 4, 44)));
          label(c, `${fmt(views)} views`, W / 2, 1120, 70, COL.cream, caveat, out);
          label(c, "one post (as of Oct 11)", W / 2, 1166, 36, COL.pale, handF, out);
          if (f >= c1) {
            const p = fade(f, c1, 10) * out;
            card(c, 110, 1200, 860, 190, r, p, COL.cream);
            label(c, "Susan Dell · philanthropist", 150, 1268, 58, INK, caveat, p, "left");
            label(c, "White House event · Oct 7, 2026", 150, 1336, 46, GREY, caveat, p, "left");
            tag(c, "real person", 830, 1250, 42, COL.green, INK, 0.05, seg(f, c1 + 8, c1 + 16) * out);
          }
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          hand(c, "how a normal clip", W / 2, 620, 96, COL.yellow, seg(f, c2, c2 + 14), r, -0.02, "center");
          hand(c, "becomes \"proof\"", W / 2, 740, 96, COL.yellow, seg(f, c2 + 8, c2 + 22), r, -0.02, "center");
          for (let i = 0; i < 4; i++) {
            const q = seg(f, c2 + 12 + i * 4, c2 + 20 + i * 4);
            const x = 225 + i * 210;
            c.save(); c.globalAlpha = clamp(q * 1.5); c.beginPath(); c.arc(x, 950, 76, 0, 7); c.fillStyle = COL.cream; c.fill(); c.restore();
            stroke(c, circlePts(x, 950, 76, 76), COL.ink, 5, r, { passes: 2, alpha: q });
            label(c, String(i + 1), x, 980, 90, COL.orange, caveat, q);
          }
          label(c, "4 tricks", W / 2, 1110, 64, COL.cream, caveat, seg(f, c2 + 26, c2 + 34));
          void p;
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
          stamp(c, "FALSE", 300, 1250, 100, COL.red, seg(f, c2, c2 + 8), r, -0.08);
          label(c, "Lead Stories fact check,", 520, 1226, 44, COL.cream, caveat, p, "left");
          label(c, "Feb 2026: the viral clip", 520, 1276, 44, COL.cream, caveat, p, "left");
          label(c, "was slowed down", 520, 1326, 44, COL.cream, caveat, p, "left");
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
        const a = seg(f, 4, 14);
        const [tx, ty, tw, th] = tv(c, 90, 470, 560, 360, r, a);
        if (a > 0) eventPic(c, tx, ty, tw, th, r, a);
        const pp = seg(f, 12, 24);
        if (pp > 0) {
          c.save(); c.translate(lerp(120, 0, easeOut(pp)), 0);
          const [sx, sy, sw, sh] = phone(c, 690, 470, 300, 440, r, pp);
          pixelated(c, sx, sy + sh * 0.25, sw, sh * 0.5, 7, (o, w, h) => eventPic(o, 0, 0, w, h, rng(5), 1));
          c.save(); c.globalAlpha = clamp(pp * 1.5); c.beginPath(); c.arc(sx + 30, sy + 30, 12, 0, 7); c.fillStyle = f % 30 < 18 ? COL.red : "#7f1d1d"; c.fill(); c.restore();
          label(c, "REC", sx + 52, sy + 42, 34, COL.red, caveat, pp, "left");
          c.restore();
        }
        if (f >= c1) {
          const p = fade(f, c1, 10);
          tag(c, "4.5M views", 260, 1000, 56, COL.yellow, INK, -0.04, p);
          label(c, "= a phone filming a TV", 430, 1016, 56, COL.cream, caveat, p, "left");
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
          label(c, "each copy loses detail", W / 2, 1376, 56, COL.yellow, caveat, seg(f, c2 + 18, c2 + 28));
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
        title(c, "TRICK 3", "AI \"enhance\"", f, r);
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
          label(c, "the filter guesses the missing detail", W / 2, 920, fitSize(c, "the filter guesses the missing detail", 940, 56, caveat), COL.yellow, caveat, p);
          card(c, 110, 950, 860, 110, r, seg(f, c1 + 14, c1 + 24), "#fff6d8");
          label(c, "US judge, 2024: AI-enhanced video not allowed as evidence", W / 2, 1018, fitSize(c, "US judge, 2024: AI-enhanced video not allowed as evidence", 820, 42, caveat), INK, caveat, seg(f, c1 + 14, c1 + 24));
        }
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 110, 1090, 400, 230, r, p, COL.cream);
          card(c, 570, 1090, 400, 230, r, seg(f, c2 + 8, c2 + 18), COL.cream);
          if (p > 0.3) doodleFace(c, 310, 1200, 80, r, 0);
          if (f >= c2 + 12) doodleFace(c, 770, 1200, 80, r, 1);
          label(c, "24.0 s: normal", 310, 1312, 40, GREY, caveat, p);
          label(c, "25.5 s: warped", 770, 1312, 40, COL.red, caveat, seg(f, c2 + 8, c2 + 18));
          label(c, "our frame-by-frame check of one viral compilation", W / 2, 1372, 36, COL.pale, handF, seg(f, c2 + 14, c2 + 24));
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
          const q1 = seg(f, c1, c1 + 8), q2 = seg(f, c1 + 8, c1 + 16), q3 = seg(f, c1 + 16, c1 + 24);
          const fx = 170 + 740 * 0.66, fy = 480 + 500 * 0.36;   // standing figure's head
          stroke(c, [[fx, fy - 70], [fx, fy + 190]], COL.red, 6, r, { passes: 2, alpha: q1 });
          stroke(c, [[fx, fy - 70], [fx + 60, fy + 180]], COL.red, 6, r, { passes: 2, alpha: q1 });
          tag(c, "\"15°\" (made up)", fx + 160, fy + 120, 40, COL.red, "#fff", 0.06, q1);
          if (q2 > 0) {
            card(c, 160, 760, 300, 210, r, q2, "#1f2937");
            label(c, "horror-movie", 310, 850, 48, "#f9fafb", caveat, q2);
            label(c, "still", 310, 904, 48, "#f9fafb", caveat, q2);
          }
          stroke(c, circlePts(fx, fy + 10, 90, 100, -1.2, -1.2 + Math.PI * 2 * q3, 30), COL.red, 9, r, { passes: 2, alpha: 0.95 });
        }
        if (f >= c2) {
          stamp(c, "EDITING, NOT EVIDENCE", W / 2, 1190, 80, COL.yellow, seg(f, c2, c2 + 8), r, -0.05);
        }
      }} />
    </>
  );
};

// ---------- 6 CHECK BEFORE YOU SHARE ----------
const RcCheck: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const row = (c: Ctx, y: number, t1: string, t2: string, p: number, done: number, r: () => number) => {
    if (!card(c, 70, y, 940, 230, r, p, COL.cream)) return;
    tick(c, 160, y + 115, 90, r, done);
    label(c, t1, 240, y + 100, fitSize(c, t1, 740, 62, caveat), INK, caveat, p, "left");
    label(c, t2, 240, y + 166, fitSize(c, t2, 740, 44, caveat), GREY, caveat, p, "left");
  };
  return (
    <>
      {[c1, c2, c3].map((a, i) => <Sfx key={i} at={a + 10} src="audio/sfx_tick.wav" vol={0.45} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4600 + boil);
        hand(c, "before you share", W / 2, 360, 92, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        if (f >= c1) row(c, 430, "find the full original", "C-SPAN posts White House events", fade(f, c1, 10), seg(f, c1 + 10, c1 + 20), r);
        if (f >= c2) row(c, 690, "is it slowed down?", "compare it with the original", fade(f, c2, 10), seg(f, c2 + 10, c2 + 20), r);
        if (f >= c3) row(c, 950, "TikTok logo on an X post?", "it's a re-upload, not the source", fade(f, c3, 10), seg(f, c3 + 10, c3 + 20), r);
      }} />
    </>
  );
};

// ---------- 7 CLOSE + CTA ----------
const RcClose: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(4700 + boil);
        const tilt = f < c1 ? -0.12 * easeOut(seg(f, 6, 20)) : lerp(-0.12, 0, easeOut(seg(f, c1, c1 + 14)));
        const cx = W / 2, cy = 560, arm = 330;
        const lx = cx - Math.cos(tilt) * arm, ly = cy - Math.sin(tilt) * arm, rx = cx + Math.cos(tilt) * arm, ry = cy + Math.sin(tilt) * arm;
        const a = seg(f, 0, 10);
        stroke(c, [[cx, cy], [cx, 900]], COL.cream, 12, r, { passes: 2, alpha: a });
        stroke(c, [[cx - 120, 900], [cx + 120, 900]], COL.cream, 12, r, { passes: 2, alpha: a });
        stroke(c, [[lx, ly], [rx, ry]], COL.cream, 10, r, { passes: 2, alpha: a });
        const pan = (x: number, y: number, t1: string, t2: string, col: string, p: number) => {
          stroke(c, [[x, y], [x - 120, y + 160]], COL.pale, 4, r, { passes: 1, alpha: p });
          stroke(c, [[x, y], [x + 120, y + 160]], COL.pale, 4, r, { passes: 1, alpha: p });
          stroke(c, circlePts(x, y + 160, 140, 34, 0, Math.PI, 16), COL.cream, 8, r, { passes: 2, alpha: p });
          label(c, t1, x, y + 262, 64, col, caveat, p);
          label(c, t2, x, y + 326, 64, col, caveat, p);
        };
        pan(lx, ly, "AI fakes", "real people", COL.orange, a);
        pan(rx, ry, "real people", "called fake", COL.yellow, seg(f, c1, c1 + 10));
        if (f >= c2) {
          const p = fade(f, c2, 12);
          stamp(c, "NO EVIDENCE", W / 2, 1060, 96, COL.green, seg(f, c2, c2 + 8), r, -0.06);
          label(c, "she's a real person", W / 2, 1150, 54, COL.cream, caveat, p);
          c.save(); c.globalAlpha = easeOut(seg(f, c2 + 16, c2 + 28));
          c.font = caveat(handle.length > 16 ? 76 : 88); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1290);
          c.shadowBlur = 0; c.font = handF(44); c.fillStyle = COL.cream; c.fillText("AI, explained simply", W / 2, 1350);
          c.restore();
        }
      }} />
    </>
  );
};

export const ROBOT_SCENES = { rc_hook: RcHook, rc_slow: RcSlow, rc_copies: RcCopies, rc_enhance: RcEnhance, rc_story: RcStory, rc_check: RcCheck, rc_close: RcClose };
