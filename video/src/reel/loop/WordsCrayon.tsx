import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, hatch, clamp, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, page, hand, arrow, fade, kid, thread, layout, drawWords, ring, HAND } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx, dogFace } from "./DistillCrayon";

// EP28 "How AI turns words into numbers" (Transformers, Part 2), drawn in the EP27 crayon style.
// Content band: y 270..1400 (banner above, karaoke captions below; the YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

export const INK = "#16152a";
export const GREY = "#4a4a6a";
export const caveat = (s: number) => `700 ${s}px Caveat`;
export const handF = (s: number) => `${s}px ${HAND}`;

// Largest size at which `text` fits in `maxW`.
export const fitSize = (c: Ctx, text: string, maxW: number, size: number, font: (s: number) => string, min = 24) => {
  let s = size;
  for (; s > min; s -= 2) { c.font = font(s); if (c.measureText(text).width <= maxW) break; }
  return s;
};

export const label = (c: Ctx, text: string, x: number, y: number, size: number, color: string, font = caveat, a = 1, align: CanvasTextAlign = "center") => {
  if (a <= 0) return;
  c.save(); c.globalAlpha = clamp(a); c.font = font(size); c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y); c.restore();
};

// ---------- doodles ----------
type TileO = { word?: string; id?: string; wordP?: number; bg?: string; edge?: string; pop?: number; rot?: number; scale?: number };
// A token card: the ID alone (wordP 0), or the word with its ID underneath (wordP 1).
export const tile = (c: Ctx, cx: number, cy: number, w: number, h: number, r: () => number, o: TileO) => {
  const p = o.pop ?? 1;
  if (p <= 0) return;
  const k = easeOut(p) * (o.scale ?? 1);
  c.save(); c.translate(cx, cy); c.rotate(o.rot ?? 0); c.scale(k, k);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -w / 2 + 8, -h / 2 + 10, w, h, 18); c.fill();
  c.fillStyle = o.bg ?? COL.cream; rrect(c, -w / 2, -h / 2, w, h, 18); c.fill();
  stroke(c, rrectPts(-w / 2, -h / 2, w, h), o.edge ?? COL.ink, 5, r, { passes: 2, alpha: 0.7 });
  const wp = clamp(o.wordP ?? 0);
  c.textAlign = "center";
  if (o.id) {
    const fs = fitSize(c, o.id, w - 26, lerp(h * 0.42, h * 0.24, wp), caveat);
    c.font = caveat(fs); c.fillStyle = wp > 0.5 ? GREY : INK;
    c.fillText(o.id, 0, lerp(fs * 0.36, h * 0.4, wp));
  }
  if (o.word && wp > 0) {
    const fs = fitSize(c, o.word, w - 22, h * (o.id ? 0.34 : 0.42), handF);
    c.globalAlpha = wp; c.font = handF(fs); c.fillStyle = INK;
    c.fillText(o.word, 0, o.id ? fs * 0.18 - h * 0.06 : fs * 0.33);
    c.globalAlpha = 1;
  }
  c.restore();
};

const scissors = (c: Ctx, x: number, y: number, s: number, open: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const a = 0.18 + 0.3 * open;
  [-1, 1].forEach((d) => {
    c.save(); c.rotate(d * a);
    stroke(c, [[0, 0], [78, 0]], "#e2e8f0", 11, r, { passes: 2, alpha: 0.95 });
    stroke(c, [[0, 0], [78, 0]], COL.ink, 3, r, { passes: 1, alpha: 0.6 });
    stroke(c, circlePts(-36, 0, 20, 15), COL.red, 9, r, { passes: 2 });
    c.restore();
  });
  c.beginPath(); c.arc(0, 0, 6, 0, 7); c.fillStyle = COL.ink; c.fill();
  c.restore();
};

const ticket = (c: Ctx, cx: number, cy: number, w: number, h: number, r: () => number, p: number, left: string, right: string) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(cx, cy); c.rotate(-0.03); c.scale(k, k);
  c.fillStyle = "rgba(4,8,40,0.35)"; c.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  c.beginPath(); c.rect(-w / 2, -h / 2, w, h);
  c.arc(-w / 2, 0, 22, Math.PI / 2, -Math.PI / 2, true); c.fillStyle = COL.yellow; c.fill();
  stroke(c, rrectPts(-w / 2, -h / 2, w, h), COL.ink, 5, r, { passes: 2, alpha: 0.7 });
  const split = -w / 2 + w * 0.5;
  c.setLineDash([10, 10]); c.strokeStyle = COL.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(split, -h / 2 + 10); c.lineTo(split, h / 2 - 10); c.stroke(); c.setLineDash([]);
  c.font = caveat(fitSize(c, left, w * 0.46, 76, caveat)); c.fillStyle = INK; c.textAlign = "center"; c.fillText(left, -w / 4, 24);
  c.font = caveat(fitSize(c, right, w * 0.46, 68, caveat)); c.fillStyle = COL.red; c.fillText(right, w / 4, 22);
  c.restore();
};

const sea = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, p = 1) => {
  if (p <= 0) return;
  c.save(); c.globalAlpha = clamp(p);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#c4e2ff"; rrect(c, x, y, w, h, 26); c.fill();
  c.save(); rrect(c, x, y, w, h, 26); c.clip(); hatch(c, [x, y, x + w, y + h], ["#9fcaf5", "#e3f1ff"], r, { angle: 0.08, gap: 15, w: 3, alpha: 0.35 }); c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 4, r, { passes: 2, alpha: 0.6 });
  c.restore();
};

// Irregular island; the outline is fixed by `seed`, only the crayon line boils.
const island = (c: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, col: string, shade: string[], r: () => number, p = 1) => {
  if (p <= 0) return;
  const rr = rng(seed);
  const N = 26, ks = Array.from({ length: N }, () => 0.84 + 0.26 * rr());
  const pts: Pt[] = [];
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2; const k = ks[i % N]; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  c.save(); c.globalAlpha = clamp(p);
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = col; c.fill();
  c.save(); c.clip(); hatch(c, [cx - rx, cy - ry, cx + rx, cy + ry], shade, r, { gap: 9, w: 3, alpha: 0.35 }); c.restore();
  stroke(c, pts, COL.ink, 4, r, { passes: 2, alpha: 0.5 });
  c.restore();
};

// Map pin with a label on a cream chip.
export const pin = (c: Ctx, x: number, y: number, text: string, col: string, p: number, r: () => number, size = 50, below = true) => {
  if (p <= 0) return;
  const k = easeOut(p), dy = (1 - k) * -70;
  c.save(); c.translate(x, y + dy); c.globalAlpha = clamp(p * 1.5);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-17, -36); c.arc(0, -46, 20, Math.PI * 0.86, Math.PI * 0.14); c.closePath();
  c.fillStyle = col; c.fill(); stroke(c, [[0, 0], [-17, -36]], COL.ink, 3, r, { passes: 1, alpha: 0.6 }); stroke(c, [[0, 0], [17, -36]], COL.ink, 3, r, { passes: 1, alpha: 0.6 });
  c.beginPath(); c.arc(0, -46, 7, 0, 7); c.fillStyle = "#fff"; c.fill();
  c.font = caveat(size); const tw = c.measureText(text).width;
  const ty = below ? 18 : -82;
  c.fillStyle = "rgba(243,234,210,0.92)"; rrect(c, -tw / 2 - 12, ty, tw + 24, size * 1.02, 12); c.fill();
  c.fillStyle = INK; c.textAlign = "center"; c.fillText(text, 0, ty + size * 0.8);
  c.restore();
};

// Two-headed "close" arrow between points.
const near = (c: Ctx, a: Pt, b: Pt, p: number, r: () => number, text = "close") => {
  if (p <= 0) return;
  arrow(c, a, b, -40, COL.red, 5, p, r);
  arrow(c, b, a, -40, COL.red, 5, p, r);
  label(c, text, (a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 52, 46, COL.red, caveat, p);
};

const bubble = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number, txt = "...") => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k * s, k * s);
  c.beginPath(); c.ellipse(0, -52, 46, 32, 0, 0, 7); c.fillStyle = COL.cream; c.fill();
  stroke(c, circlePts(0, -52, 46, 32, 0, Math.PI * 2, 24), COL.ink, 3, r, { passes: 1, alpha: 0.7 });
  [[-8, -12, 9], [-16, 4, 5]].forEach(([bx, by, br]) => { c.beginPath(); c.arc(bx, by, br, 0, 7); c.fillStyle = COL.cream; c.fill(); });
  c.font = caveat(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText(txt, 0, -40);
  c.restore();
};

export const eye = (c: Ctx, x: number, y: number, s: number, r: () => number, look: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 0, 110, 62, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 0, 110, 62, 0, 0, 7); c.clip();
  c.beginPath(); c.arc(look * 30, 0, 44, 0, 7); c.fillStyle = COL.light; c.fill();
  c.beginPath(); c.arc(look * 30, 0, 20, 0, 7); c.fillStyle = COL.ink; c.fill();
  c.beginPath(); c.arc(look * 30 + 14, -14, 8, 0, 7); c.fillStyle = "#fff"; c.fill();
  c.restore();
  stroke(c, circlePts(0, 0, 110, 62, 0, Math.PI * 2, 40), COL.ink, 7, r, { passes: 2 });
  c.restore();
};

// Little layered machine (a transformer in miniature).
export const tower = (c: Ctx, x: number, y: number, s: number, r: () => number, lit = -1) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 4; i++) {
    const yy = -i * 40;
    c.fillStyle = i === lit ? COL.yellow : COL.cream; rrect(c, -70, yy - 34, 140, 34, 8); c.fill();
    stroke(c, rrectPts(-70, yy - 34, 140, 34), COL.ink, 4, r, { passes: 1, alpha: 0.7 });
  }
  c.restore();
};

// Card that flips from a word to its token ID (t 0 = word, 1 = ID with the word small underneath).
const flipTile = (c: Ctx, cx: number, cy: number, w: number, h: number, r: () => number, word: string, id: string, t: number, rot = 0) => {
  const showId = t >= 0.5;
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp(t))));
  c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(sx, 1);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -w / 2 + 8, -h / 2 + 10, w, h, 18); c.fill();
  c.fillStyle = showId ? "#fff6d8" : COL.cream; rrect(c, -w / 2, -h / 2, w, h, 18); c.fill();
  stroke(c, rrectPts(-w / 2, -h / 2, w, h), showId ? COL.orange : COL.ink, 5, r, { passes: 2, alpha: 0.75 });
  c.textAlign = "center";
  if (!showId) {
    const fs = fitSize(c, word, w - 20, h * 0.34, handF);
    c.font = handF(fs); c.fillStyle = INK; c.fillText(word, 0, fs * 0.33);
  } else {
    const fs = fitSize(c, id, w - 18, h * 0.38, caveat);
    c.font = caveat(fs); c.fillStyle = INK; c.fillText(id, 0, fs * 0.2);
    const ws = fitSize(c, word, w - 24, h * 0.16, handF);
    c.font = handF(ws); c.fillStyle = GREY; c.fillText(word, 0, h / 2 - 18);
  }
  c.restore();
};

export const stamp = (c: Ctx, t: string, x: number, y: number, size: number, col: string, p: number, r: () => number, rot = -0.07) => {
  if (p <= 0) return;
  const e = easeOut(p);
  c.save(); c.translate(x, y); c.rotate(rot); const k = 1.6 - 0.6 * e; c.scale(k, k); c.globalAlpha = e;
  c.font = caveat(size); const tw = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.10)"; c.fillRect(-tw / 2 - 30, -size * 0.9, tw + 60, size * 1.2);
  stroke(c, rrectPts(-tw / 2 - 30, -size * 0.9, tw + 60, size * 1.2), col, 10, r, { passes: 3, alpha: 0.9 });
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.04); c.restore();
};

export const card = (c: Ctx, x: number, y: number, w: number, h: number, r: () => number, p: number, bg = COL.cream) => {
  if (p <= 0) return false;
  c.save(); c.globalAlpha = clamp(p * 1.4);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 8, y + 10, w, h, 20); c.fill();
  c.fillStyle = bg; rrect(c, x, y, w, h, 20); c.fill();
  c.restore();
  stroke(c, rrectPts(x, y, w, h), COL.ink, 4, r, { passes: 2, alpha: 0.6 * clamp(p * 1.4) });
  return true;
};

// ---------- 1 HOOK ----------
const SENT = ["The", "Statue", "of", "Liberty", "is", "in"];
const SIDS = ["976", "160801", "328", "51868", "382", "306"];
const WnHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.8} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.5} />
      <Sfx at={c2} src="reel/sfx_boom.wav" vol={0.6} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(1100 + boil);
        page(c, 50, 300, 980, 600, boil, -0.01);
        if (f < c1 + 6) hand(c, "you type:", W / 2, 412, 78, COL.ink, 1, r, -0.02, "center");
        else hand(c, "ChatGPT sees:", W / 2, 412, 78, COL.red, seg(f, c1 + 6, c1 + 16), r, -0.02, "center");
        const w = 150, h = 210, gap = 10, x0 = (W - (6 * w + 5 * gap)) / 2 + w / 2;
        SENT.forEach((word, i) => flipTile(c, x0 + i * (w + gap), 600, w, h, r, word, SIDS[i], seg(f, c1 + i * 3, c1 + i * 3 + 10), i % 2 ? 0.02 : -0.015));
        label(c, "real token IDs · OpenAI tokenizer", W / 2, 785, 42, GREY, handF, seg(f, c1 + 22, c1 + 32));
        if (f >= c2) {
          stamp(c, "NUMBERS ONLY", W / 2, 1010, 104, COL.red, fade(f, c2, 8), r);
          hand(c, "not words", W / 2, 1115, 66, COL.cream, seg(f, c2 + 8, c2 + 22), r, -0.02, "center");
        }
        if (f >= c3) {
          const p = easeOut(fade(f, c3, 10));
          c.save(); c.globalAlpha = p; c.beginPath(); c.ellipse(W / 2, 1275, 320, 90, 0, 0, 7); c.fillStyle = COL.cream; c.fill(); c.restore();
          if (p > 0.05) stroke(c, circlePts(W / 2, 1275, 320, 90), COL.ink, 4, r, { passes: 2, alpha: 0.6 * p });
          hand(c, "numbers → answer?", W / 2, 1302, 82, COL.orange, seg(f, c3 + 4, c3 + 18), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 2 TOKENS ----------
const WnTokens: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={4} src="audio/sfx_whoosh.wav" vol={0.3} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2 + 10} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(1200 + boil);
        hand(c, "step 1: cut into tokens", W / 2, 360, 78, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        const sx = 70, sy = 410, sw = 940, sh = 120;
        const cut = seg(f, 8, Math.max(c1 - 4, 40));
        const fly = seg(f, c1, c1 + 16);
        const fsz = fitSize(c, SENT.join(" "), 860, 74, handF);
        c.font = handF(fsz);
        const space = c.measureText(" ").width;
        const widths = SENT.map((w) => c.measureText(w).width);
        const total = widths.reduce((a, b) => a + b, 0) + space * (SENT.length - 1);
        let x = W / 2 - total / 2;
        const starts = widths.map((wd) => { const s0 = x; x += wd + space; return s0; });
        if (fly < 1) {
          c.save(); c.globalAlpha = 1 - fly;
          c.fillStyle = COL.cream; c.fillRect(sx, sy, sw, sh);
          stroke(c, rrectPts(sx, sy, sw, sh), COL.ink, 4, r, { passes: 2, alpha: 0.6 });
          c.font = handF(fsz); c.fillStyle = INK; c.textAlign = "left";
          SENT.forEach((w, i) => c.fillText(w, starts[i], sy + 84));
          for (let i = 1; i < SENT.length; i++) {
            const cx = starts[i] - space / 2;
            if ((cx - sx) / sw < cut) { c.setLineDash([12, 10]); c.strokeStyle = COL.red; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, sy - 14); c.lineTo(cx, sy + sh + 14); c.stroke(); c.setLineDash([]); }
          }
          c.restore();
          if (cut > 0 && cut < 1) scissors(c, sx + sw * cut, sy - 26, 1, Math.abs(Math.sin(f * 0.6)), r);
        }
        const w = 150, h = 170, gap = 10, x0 = (W - (6 * w + 5 * gap)) / 2 + w / 2, ty = 625;
        SENT.forEach((word, i) => {
          const p = seg(f, c1 + i * 3, c1 + i * 3 + 14);
          if (p <= 0) return;
          const e = easeOut(p);
          tile(c, lerp(starts[i] + widths[i] / 2, x0 + i * (w + gap), e), lerp(sy + 60, ty, e), w, h, r, { word, id: SIDS[i], wordP: 1, rot: (i % 2 ? 0.02 : -0.02) * e });
        });
        if (f >= c1 + 12) hand(c, "words, or pieces of words", W / 2, 795, 64, COL.cream, seg(f, c1 + 12, c1 + 28), r, -0.02, "center");
        if (f >= c2) {
          const sp = easeOut(seg(f, c2 + 10, c2 + 22));
          c.font = handF(120);
          const a = "You", b = "Tube";
          const wa = c.measureText(a).width, wb = c.measureText(b).width;
          const y = 960, gx = 80 * sp, xa = W / 2 - (wa + wb + gx) / 2;
          c.save(); c.globalAlpha = easeOut(fade(f, c2, 8)); c.textAlign = "left";
          c.fillStyle = COL.cream; c.fillText(a, xa, y); c.fillStyle = COL.red; c.fillText(b, xa + wa + gx, y);
          c.restore();
          if (f >= c2 + 4 && f < c2 + 16) scissors(c, xa + wa + gx / 2, y - 118, 0.9, Math.abs(Math.sin(f * 0.8)), r);
          if (sp > 0) {
            tag(c, "1608", xa + wa / 2, y + 88, 56, COL.yellow, INK, -0.03, sp);
            tag(c, "13151", xa + wa + gx + wb / 2, y + 88, 56, COL.yellow, INK, 0.03, sp);
          }
          hand(c, "1 word = 2 tokens", W / 2, 1125, 66, COL.orangeLight, seg(f, c2 + 22, c2 + 36), r, -0.02, "center");
        }
        if (f >= c3) {
          ticket(c, W / 2, 1250, 640, 140, r, fade(f, c3, 10), "No. 51868", "meaning: ?");
          hand(c, "an ID is just a label", W / 2, 1385, 62, COL.cream, seg(f, c3 + 10, c3 + 24), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 3 EMBEDDINGS ----------
const ROWS: [string, string][] = [["51866", "0.12  -0.41  0.07  ..."], ["51867", "-0.33  0.18  0.52  ..."], ["51868", "0.21  -0.70  0.93  ..."], ["51869", "0.64  0.02  -0.15  ..."], ["51870", "-0.08  0.47  0.30  ..."]];
const WnEmbed: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c1 + 26} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c3} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c4} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(1300 + boil);
        hand(c, "step 2: IDs → embeddings", W / 2, 350, 72, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        tile(c, 160, 530, 190, 150, r, { word: "Liberty", id: "51868", wordP: 1, pop: seg(f, 2, 12), rot: -0.03 });
        // the giant table
        const tx = 300, ty = 400, tw = 710, rh = 48;
        if (f >= c1 - 4) {
          const p = easeOut(fade(f, c1 - 4, 10));
          if (card(c, tx, ty, tw, rh * 5 + 60, r, p, COL.cream)) {
            c.save(); c.globalAlpha = p;
            label(c, "giant table", tx + tw / 2, ty + 42, 44, COL.red, caveat, 1);
            ROWS.forEach(([id, nums], i) => {
              const y = ty + 60 + i * rh, hit = i === 2 && f >= c1 + 10;
              if (hit) { c.fillStyle = COL.yellow; c.fillRect(tx + 10, y + 4, tw - 20, rh - 6); }
              c.font = caveat(40); c.fillStyle = INK; c.textAlign = "left"; c.fillText(id, tx + 24, y + 37);
              c.font = handF(38); c.fillStyle = hit ? INK : GREY; c.fillText(nums, tx + 170, y + 37);
            });
            c.restore();
            arrow(c, [262, 530], [tx + 6, ty + 60 + 2 * rh + 26], 0, COL.orange, 7, seg(f, c1 + 4, c1 + 12), r);
          }
        }
        // the row slides out into an embedding strip
        if (f >= c1 + 16) {
          const p = easeOut(seg(f, c1 + 16, c1 + 30));
          const y = lerp(ty + 60 + 2 * rh, 728, p);
          c.save(); c.globalAlpha = clamp(p * 2);
          c.fillStyle = COL.yellow; rrect(c, 70, y, 940, 72, 14); c.fill();
          c.font = handF(46); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Liberty = [0.21, -0.70, 0.93, 0.05, ...]", 96, y + 52);
          c.restore();
          tag(c, "embedding", 860, y + 122, 54, COL.orange, COL.cream, -0.03, seg(f, c1 + 28, c1 + 38));
        }
        // Google Maps: 2 numbers
        if (f >= c2) {
          const p = fade(f, c2, 10);
          if (card(c, 70, 880, 440, 220, r, p, "#e8f5e1")) {
            c.save(); c.globalAlpha = clamp(p * 1.4);
            stroke(c, [[90, 1010], [490, 960]], "#fde68a", 14, r, { passes: 1 }); stroke(c, [[180, 900], [300, 1090]], "#fde68a", 12, r, { passes: 1 });
            c.restore();
            pin(c, 180, 990, "Statue of Liberty", COL.red, p, r, 30);
            label(c, "40.69, -74.04", 345, 950, 50, INK, caveat, p);
            label(c, "2 numbers", 345, 1070, 50, "#15803d", caveat, p);
          }
        }
        // an embedding: thousands
        if (f >= c3) {
          const p = fade(f, c3, 10);
          if (card(c, 570, 880, 440, 220, r, p, COL.cream)) {
            c.save(); c.globalAlpha = clamp(p * 1.4);
            const rr = rng(77);
            for (let i = 0; i < 120; i++) { c.fillStyle = rr() > 0.5 ? COL.orange : COL.light; c.fillRect(590 + (i % 30) * 13.5, 900 + Math.floor(i / 30) * 16, 8, 10); }
            c.restore();
            label(c, "2,880 numbers", 790, 1040, 58, COL.red, caveat, p);
            label(c, "per token (gpt-oss)", 790, 1084, 36, GREY, handF, p);
          }
        }
        // map of meaning
        if (f >= c4) {
          const mp = easeOut(fade(f, c4, 10));
          sea(c, 70, 1130, 940, 270, r, mp);
          island(c, 300, 1265, 200, 95, 51, "#a6e3a1", ["#6cc56f", "#d4f7cf"], r, mp);
          island(c, 770, 1265, 200, 95, 52, "#f5d78e", ["#e0b85a", "#fff1c4"], r, mp);
          label(c, "animals", 300, 1195, 40, INK, caveat, mp);
          label(c, "places", 770, 1195, 40, INK, caveat, mp);
          pin(c, 250, 1300, "cat", COL.orange, seg(f, c4 + 4, c4 + 14), r, 40);
          pin(c, 360, 1300, "dog", COL.orange, seg(f, c4 + 10, c4 + 20), r, 40);
          pin(c, 720, 1300, "Paris", "#7c3aed", seg(f, c4 + 14, c4 + 24), r, 40);
          pin(c, 840, 1300, "New York", "#7c3aed", seg(f, c4 + 18, c4 + 28), r, 40);
        }
      }} />
    </>
  );
};

// ---------- 4 POSITION ----------
const WnPos: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const rows: [string[], number, number][] = [[["dog", "bites", "man"], 520, 0], [["man", "bites", "dog"], 735, 10]];
  return (
    <>
      <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.35} />
      {[0, 1, 2].map((i) => <Sfx key={i} at={c2 + i * 7} src="audio/sfx_tick.wav" vol={0.5} />)}
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.35} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(1400 + boil);
        hand(c, "word order?", W / 2, 370, 86, COL.orangeLight, seg(f, 0, 12), r, -0.02, "center");
        const w = 240, h = 140, gap = 30, x0 = (W - (3 * w + 2 * gap)) / 2 + w / 2;
        rows.forEach(([row, y, at], ri) => row.forEach((word, i) => {
          const x = x0 + i * (w + gap);
          tile(c, x, y, w, h, r, { word, wordP: 1, pop: seg(f, at + i * 4, at + i * 4 + 10), bg: word === "dog" ? "#ffe2bf" : COL.cream, rot: (i + ri) % 2 ? 0.02 : -0.02 });
          if (word === "dog") label(c, "[0.4, -0.2, ...]", x, y + h / 2 + 40, 38, COL.orangeLight, handF, seg(f, 14 + at, 26 + at));
          const bp = seg(f, c2 + i * 7, c2 + i * 7 + 8);
          if (bp > 0) {
            const k = easeOut(bp);
            c.save(); c.translate(x - w / 2 + 6, y - h / 2 + 4); c.scale(k, k);
            c.beginPath(); c.arc(0, 0, 36, 0, 7); c.fillStyle = COL.yellow; c.fill();
            stroke(c, circlePts(0, 0, 36, 36), COL.ink, 4, r, { passes: 2 });
            c.font = caveat(54); c.fillStyle = INK; c.textAlign = "center"; c.fillText(String(i + 1), 0, 18);
            c.restore();
          }
        }));
        if (f >= 20 && f < c1) hand(c, "same list, first or last", W / 2, 925, 58, COL.orangeLight, seg(f, 20, 36), r, -0.02, "center");
        if (f >= c1) {
          stamp(c, "LOOKS THE SAME?!", W / 2, 935, 70, COL.red, fade(f, c1, 8), r, -0.04);
        }
        if (f >= c2) hand(c, "+ a position for every token", W / 2, 1035, 60, COL.yellow, seg(f, c2 + 18, c2 + 34), r, -0.02, "center");
        if (f >= c3) {
          const p = easeOut(fade(f, c3, 10));
          c.save(); c.globalAlpha = p;
          dogFace(c, 290, 1205, 0.8, r);
          kid(c, 420, 1135, 60, boil, 3, true);
          stroke(c, [[340, 1228], [360, 1208], [376, 1232], [392, 1210]], COL.red, 5, r, { passes: 2 });
          kid(c, 660, 1135, 60, boil, 5, true);
          dogFace(c, 800, 1205, 0.8, r);
          stroke(c, [[696, 1170], [714, 1152], [728, 1176], [744, 1154]], COL.red, 5, r, { passes: 2 });
          c.restore();
          label(c, "dog bit man", 350, 1325, 50, COL.cream, caveat, p);
          label(c, "man bit dog?!", 735, 1325, 50, COL.orangeLight, caveat, p);
          hand(c, "who bit whom ✓", W / 2, 1392, 62, COL.yellow, seg(f, c3 + 10, c3 + 24), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 5 LAYERS ----------
const LCOL = [COL.pale, COL.orange, COL.pale, COL.green, COL.pale, COL.yellow];
const WnLayers: React.FC<SP> = ({ s, cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(1500 + boil);
        tag(c, "gpt-oss-120b: 36 layers", W / 2, 372, 64, COL.yellow, INK, -0.02, seg(f, 4, 14));
        const n = 5, bx = 100, bw = 670, top = 460, bot = 1385, fh = (bot - top) / n;
        const pos = seg(f, 6, Math.max(c2 + 10, s.frames - 20)) * (n - 1);
        const fi = Math.min(n - 1, Math.floor(pos)), ph = pos - Math.floor(pos);
        for (let i = 0; i < n; i++) {
          const y0 = bot - (i + 1) * fh;
          c.fillStyle = i === fi ? "#fff6d8" : COL.cream; c.fillRect(bx, y0, bw, fh);
          stroke(c, rrectPts(bx, y0, bw, fh), COL.ink, 4, r, { passes: 1, alpha: 0.65 });
          const lab = i < 3 ? `layer ${i + 1}` : i === 3 ? "⋮" : "layer 36";
          label(c, lab, bx + 16, y0 + 44, 36, GREY, caveat, 1, "left");
        }
        stroke(c, [[bx - 20, top], [bx + bw / 2, top - 46], [bx + bw + 20, top]], COL.ink, 6, r, { passes: 2 });
        const fy = (i: number) => bot - (i + 0.58) * fh;
        const yy = lerp(fy(fi), fy(Math.min(n - 1, fi + 1)), clamp((ph - 0.72) / 0.28));
        const pts: Pt[] = SENT.map((_, k) => [168 + k * 107, yy + Math.sin(f * 0.15 + k) * 3]);
        const looking = f >= c1 && ph < 0.72;
        if (looking) {
          for (let k = 1; k < 6; k++) for (let j = 0; j < k; j++) {
            const strong = k === 5 && (j === 1 || j === 3);
            thread(c, pts[k], pts[j], strong ? 0.55 : 0.1, seg(ph, 0, 0.3), r, strong ? COL.orange : COL.pale);
          }
        }
        pts.forEach(([x, y], k) => {
          const R = 22;
          if (k === 5) {
            if (f >= c1 + 20) stroke(c, circlePts(x, y, R + 8, R + 8), COL.orange, 6, r, { passes: 2 });
            if (f >= c1 + 44) stroke(c, circlePts(x, y, R + 16, R + 16), COL.green, 6, r, { passes: 2 });
          }
          c.beginPath(); c.arc(x, y, R, 0, 7); c.fillStyle = LCOL[k]; c.fill();
          stroke(c, circlePts(x, y, R, R), COL.ink, 3, r, { passes: 1 });
          label(c, SENT[k], x, y + 58, 32, INK, caveat);
        });
        label(c, "each word", 925, 620, 50, COL.orangeLight, caveat, seg(f, c1, c1 + 10));
        label(c, "looks back", 925, 672, 50, COL.orangeLight, caveat, seg(f, c1 + 4, c1 + 14));
        label(c, "& soaks up", 925, 760, 50, COL.cream, caveat, seg(f, c1 + 12, c1 + 22));
        label(c, "what matters", 925, 812, 50, COL.cream, caveat, seg(f, c1 + 16, c1 + 26));
        if (f >= c2) {
          const p = fade(f, c2, 10);
          card(c, 790, 930, 260, 250, r, p, "#fff6d8");
          label(c, "'in' now", 920, 990, 48, INK, caveat, p);
          label(c, "knows:", 920, 1040, 48, INK, caveat, p);
          label(c, "Statue", 920, 1100, 50, COL.orange, caveat, p);
          label(c, "+ Liberty", 920, 1152, 50, "#15803d", caveat, p);
        }
      }} />
    </>
  );
};

// ---------- 6 NEXT TOKEN ----------
const R1: [string, number][] = [["New", 0.78], ["the", 0.09], ["Manhattan", 0.06], ["America", 0.03], ["a", 0.02]];
const R2: [string, number][] = [["York", 0.97], ["Jersey", 0.02], ["England", 0.006], ["Orleans", 0.003], ["Delhi", 0.001]];
const WnPredict: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_success.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.4} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c3 + 40 + k * 6} src="audio/sfx_tick.wav" vol={0.3} />)}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(1600 + boil);
        hand(c, "step 4: score every next token", W / 2, 350, 70, COL.yellow, seg(f, 0, 14), r, -0.02, "center");
        c.fillStyle = COL.cream; c.fillRect(60, 400, 960, 120);
        stroke(c, rrectPts(60, 400, 960, 120), COL.ink, 4, r, { passes: 2, alpha: 0.6 });
        const base = "The Statue of Liberty is in";
        const fs = fitSize(c, base + " New York", 900, 64, handF);
        c.font = handF(fs); c.fillStyle = INK; c.textAlign = "left";
        c.fillText(base, 84, 482);
        const x1 = 84 + c.measureText(base + " ").width, x2 = x1 + c.measureText("New ").width;
        const newIn = f >= c1 + 14, yorkIn = f >= c3 + 14;
        if (newIn) { c.fillStyle = COL.orange; c.fillText("New", x1, 482); }
        else stroke(c, [[x1, 494], [x1 + 110, 494]], COL.red, 5, r, { passes: 2 });
        if (yorkIn) { c.fillStyle = COL.orange; c.fillText("York", x2, 482); }
        else if (newIn) stroke(c, [[x2, 494], [x2 + 110, 494]], COL.red, 5, r, { passes: 2 });
        const second = f >= c2 + 8;
        const cands = second ? R2 : R1;
        const p = second ? seg(f, c2 + 8, Math.max(c3 - 4, c2 + 30)) : seg(f, 6, Math.max(c1 - 4, 30));
        const lx = 330, bx0 = 350, bw = 520;
        cands.forEach(([t, v], i) => {
          const y = 615 + i * 92, q = clamp(p * cands.length - i * 0.6);
          if (q <= 0) return;
          label(c, t, lx, y + 20, 56, i === 0 ? COL.yellow : COL.cream, caveat, q, "right");
          c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(bx0, y - 25, bw, 50);
          c.fillStyle = i === 0 ? COL.orange : COL.light; c.fillRect(bx0, y - 25, Math.max(3, bw * v * easeOut(q)), 50);
          stroke(c, rrectPts(bx0, y - 25, bw, 50), COL.cream, 3, r, { passes: 1, alpha: 0.6 });
          label(c, v >= 0.01 ? `${Math.round(v * 100 * easeOut(q))}%` : "<1%", bx0 + bw + 14, y + 18, 48, COL.yellow, caveat, q, "left");
        });
        label(c, "(illustration)", 1010, 1100, 38, COL.pale, handF, p, "right");
        const ringAt = second ? c3 : c1;
        if (f >= ringAt && (second || f < c2 + 8)) {
          const q = seg(f, ringAt, ringAt + 10);
          const pts: Pt[] = [[150, 572], [1000, 572], [1000, 658], [150, 658], [150, 572]];
          const n = Math.max(2, Math.round(pts.length * q));
          stroke(c, pts.slice(0, n), COL.yellow, 7, r, { passes: 3 });
          if (q >= 1) label(c, "picked", 1000, 560, 46, COL.yellow, caveat, 1, "right");
        }
        const fly = (at: number, word: string, tx: number) => {
          if (f < at || f >= at + 14) return;
          const t = easeOut(seg(f, at, at + 14));
          tile(c, lerp(lx - 70, tx + 60, t), lerp(615, 462, t), 190, 92, r, { word, wordP: 1, bg: COL.orangeLight });
        };
        fly(c1, "New", x1); fly(c3, "York", x2);
        if (f >= c2) {
          const lp = seg(f, c2, c2 + 18);
          tower(c, 190, 1290, 0.85, r, Math.floor(f / 6) % 4);
          stroke(c, circlePts(190, 1210, 115, 115, -Math.PI * 0.9, -Math.PI * 0.9 + Math.PI * 1.7 * lp, 36), COL.yellow, 8, r, { passes: 3 });
          hand(c, "climb again", 640, 1200, 64, COL.cream, seg(f, c2 + 4, c2 + 18), r, -0.02, "center");
        }
        if (f >= c3 + 24) {
          hand(c, "1 trip = 1 token", 640, 1290, 64, COL.yellow, seg(f, c3 + 24, c3 + 38), r, -0.02, "center");
          hand(c, "answers appear piece by piece", 640, 1372, 52, COL.pale, seg(f, c3 + 40, c3 + 56), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 7 QUIZ ----------
const Q1 = "I sat on the river bank.", Q2 = "I opened a bank account.";
const WnQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2, 3, 4].map((k) => <Sfx key={k} at={c1 + 30 + k * 24} src="audio/sfx_tick.wav" vol={0.35} />)}
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.45} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(1700 + boil);
        hand(c, "YOUR TURN", W / 2, 350, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
        card(c, 70, 400, 940, 150, r, seg(f, 2, 10));
        card(c, 70, 590, 940, 150, r, seg(f, 8, 16));
        const A = layout(c, Q1, 110, 500, 880, 72, 1.3), B = layout(c, Q2, 110, 690, 880, 72, 1.3);
        if (f >= 4) drawWords(c, A, boil, { color: (i) => (i === 5 ? COL.red : INK) });
        if (f >= 10) drawWords(c, B, boil, { color: (i) => (i === 3 ? COL.red : INK) });
        ring(c, A[5], COL.red, seg(f, 14, 26), r, 5);
        ring(c, B[3], COL.red, seg(f, 20, 32), r, 5);
        if (f >= c1) hand(c, "same ID for 'bank'?", W / 2, 850, 78, COL.yellow, seg(f, c1, c1 + 14), r, -0.02, "center");
        if (f >= c1 + 24 && f < c2) {
          const q = seg(f, c1 + 24, c2);
          stroke(c, circlePts(W / 2, 1000, 58, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 40), COL.yellow, 10, r, { passes: 2 });
          hand(c, "pause & comment your answer", W / 2, 1130, 58, COL.cream, seg(f, c1 + 24, c1 + 38), r, -0.02, "center");
        }
        if (f >= c2) {
          const p = seg(f, c2, c2 + 10);
          tag(c, "6922", A[5].x + A[5].wd / 2, A[5].y + 58, 46, COL.yellow, INK, -0.03, p);
          tag(c, "6922", B[3].x + B[3].wd / 2, B[3].y + 58, 46, COL.yellow, INK, 0.03, p);
          stamp(c, "SAME ID ✓", W / 2, 960, 92, COL.green, fade(f, c2 + 6, 8), r, -0.04);
          const lp = seg(f, c2 + 24, c2 + 40);
          tower(c, W / 2, 1200, 0.8, r, Math.floor(f / 6) % 4);
          label(c, "layers", W / 2, 1245, 40, COL.cream, caveat, lp);
          arrow(c, [W / 2 - 90, 1120], [250, 1240], -40, COL.light, 6, lp, r);
          arrow(c, [W / 2 + 90, 1120], [830, 1240], -40, COL.orangeLight, 6, lp, r);
          label(c, "river side", 230, 1310, 58, COL.pale, caveat, seg(f, c2 + 36, c2 + 46));
          label(c, "money", 850, 1310, 58, COL.orangeLight, caveat, seg(f, c2 + 40, c2 + 50));
          hand(c, "the layers add context", W / 2, 1390, 60, COL.yellow, seg(f, c2 + 48, c2 + 62), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 8 OUTRO ----------
const CHAIN = ["text", "tokens", "IDs", "embeddings", "layers", "next token"];
const WnOutro: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const at = [0, cue(1), cue(2), cue(3), cue(4), cue(5)];
  const c6 = cue(6);
  return (
    <>
      {at.slice(1).map((a, i) => <Sfx key={i} at={a} src="audio/sfx_pop.wav" vol={0.3} />)}
      <Sfx at={c6} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(1800 + boil);
        CHAIN.forEach((t, i) => {
          const y = 378 + i * 110, p = seg(f, at[i], at[i] + 10);
          tag(c, t, W / 2, y, 70, i === 5 ? COL.orange : COL.cream, i === 5 ? COL.cream : INK, i % 2 ? 0.02 : -0.02, p);
          if (i > 0 && p > 0) arrow(c, [W / 2, y - 98], [W / 2, y - 66], 0, COL.yellow, 6, p, r);
        });
        if (f >= c6) {
          hand(c, "NEXT:", W / 2, 1040, 80, COL.orangeLight, seg(f, c6, c6 + 10), r, -0.02, "center");
          const ep = easeOut(fade(f, c6 + 4, 10));
          if (ep > 0) { c.save(); c.globalAlpha = ep; eye(c, 250, 1135, 0.62, r, Math.sin(f * 0.08)); c.restore(); }
          hand(c, "how AI sees images", 640, 1157, 76, COL.cream, seg(f, c6 + 8, c6 + 24), r, -0.02, "center");
          const hp = easeOut(fade(f, c6 + 34, 12));
          if (hp > 0) {
            c.save(); c.globalAlpha = hp;
            c.font = caveat(handle.length > 16 ? 78 : 92); c.textAlign = "center"; c.fillStyle = COL.yellow;
            c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1282);
            c.shadowBlur = 0; c.font = handF(56); c.fillStyle = COL.cream; c.fillText("Follow for the next episode", W / 2, 1360);
            c.restore();
          }
        }
      }} />
    </>
  );
};

export const WORDS_SCENES = { wn_hook: WnHook, wn_tokens: WnTokens, wn_embed: WnEmbed, wn_pos: WnPos, wn_layers: WnLayers, wn_predict: WnPredict, wn_quiz: WnQuiz, wn_outro: WnOutro };
