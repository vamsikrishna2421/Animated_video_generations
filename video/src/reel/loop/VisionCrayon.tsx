import React, { useLayoutEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { Ctx, Pt, rng, stroke, circlePts, clamp, ease, easeOut, seg, lerp } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { background, hand, fade, arrow } from "./AttentionCrayon";
import { rrect, rrectPts, tag, Sfx, dogFace } from "./DistillCrayon";
import { INK, GREY, caveat, handF, label, stamp, card } from "./WordsCrayon";

// EP29 "How AI sees a photo" (computer vision), in the EP27/EP28 crayon style.
// Everything labelled "real" comes from our own runs on one CC0 photo ("Golden Retriever 88.JPG" by Mtlchung,
// Wikimedia Commons), cropped to the 224 x 224 pixels the models were given:
//   ResNet-50 (microsoft/resnet-50, Apache-2.0): golden retriever 99.8%. The same file with 122,204 of its 150,528
//   numbers moved by exactly 1, aimed at "banana" with the model's own gradients: banana > 99.99%. A random change of
//   the same size (5 tries): golden retriever. ViT, ResNet-18, ConvNeXt-T and Swin-T on the banana file: golden
//   retriever; the banana file saved as JPEG (q75-95): golden retriever. Two of its first-layer filters and their real
//   responses (brightened).
// Content band: y 270..1400 (banner above, captions below; the YouTube frame shows y 240..1440).
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const IMG = {
  dog: "reel/photos/ep29_dog_672.png",          // the model's 224 px input, shown 3x (Lanczos)
  banana: "reel/photos/ep29_banana_672.png",    // the aimed change, same 3x upscale
  random: "reel/photos/ep29_random_672.png",    // a random change of the same size, same 3x upscale
  dog224: "reel/photos/ep29_dog_224.png",       // the exact input, for hard-pixel zooms and real numbers
  banana224: "reel/photos/ep29_banana_224.png",
  fV: "reel/photos/ep29_filter_vert.png", fH: "reel/photos/ep29_filter_horiz.png",
  litV: "reel/photos/ep29_lit_vert.png", litH: "reel/photos/ep29_lit_horiz.png",
};
type Key = keyof typeof IMG;
type Imgs = Partial<Record<Key, HTMLImageElement>>;

// Loads a set of images once (one delayRender for the set).
const usePhotos = (keys: Key[]): Imgs => {
  const [handle] = useState(() => delayRender("photos " + keys.join(",")));
  const [imgs, setImgs] = useState<Imgs>({});
  useLayoutEffect(() => {
    let left = keys.length;
    const got: Imgs = {};
    const done = () => { if (--left === 0) { setImgs({ ...got }); continueRender(handle); } };
    keys.forEach((k) => { const im = new Image(); im.onload = () => { got[k] = im; done(); }; im.onerror = done; im.src = staticFile(IMG[k]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return imgs;
};

// Pixel values of a 224 px input (read once from the image itself).
const PIX: Record<string, Uint8ClampedArray> = {};
const pixelsOf = (img?: HTMLImageElement) => {
  if (!img) return undefined;
  if (!PIX[img.src]) {
    const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
    const o = cv.getContext("2d")!; o.drawImage(img, 0, 0);
    PIX[img.src] = o.getImageData(0, 0, img.width, img.height).data;
  }
  return PIX[img.src];
};
const rgbAt = (d: Uint8ClampedArray, x: number, y: number) => { const i = (y * 224 + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };

// Real numbers: a 9 x 9 block of fur by the dog's eye; two fur pixels before/after the aimed change.
const BX = 166, BY = 46, FUR = [179, 142, 102];
const ROW_BEFORE = [179, 142, 102, 184, 146, 107], ROW_AFTER = [178, 143, 102, 185, 147, 108];   // pixels (170,50), (171,50)
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// White-bordered print of a square source window (sx, sy, sw in the image's own pixels) at (x, y), w wide.
type PrintO = { sx?: number; sy?: number; sw?: number; hard?: boolean; border?: number };
const print = (c: Ctx, img: HTMLImageElement | undefined, x: number, y: number, w: number, p: number, rot = -0.015, o: PrintO = {}) => {
  if (!img || p <= 0) return;
  const b = o.border ?? 14, sw = o.sw ?? img.width, sx = o.sx ?? 0, sy = o.sy ?? 0;
  c.save(); c.globalAlpha *= clamp(p * 1.4);
  c.translate(x + w / 2, y + w / 2); c.rotate(rot); c.translate(-w / 2, -w / 2);
  if (b > 0) {
    c.fillStyle = "rgba(4,8,40,0.4)"; c.fillRect(-b + 10, -b + 12, w + 2 * b, w + 2 * b);
    c.fillStyle = "#fbf8f0"; c.fillRect(-b, -b, w + 2 * b, w + 2 * b);
  }
  c.beginPath(); c.rect(0, 0, w, w); c.clip();
  c.imageSmoothingEnabled = !o.hard;
  c.drawImage(img, sx, sy, sw, sw, 0, 0, w, w);
  c.restore();
};

// Draw a group at opacity a (offscreen, so helpers that set their own alpha still fade together). Not nestable.
const OFF: { cv?: HTMLCanvasElement } = {};
const group = (c: Ctx, a: number, fn: (o: Ctx) => void) => {
  if (a <= 0) return;
  if (a >= 1) { fn(c); return; }
  const W = c.canvas.width, H = c.canvas.height;
  if (!OFF.cv || OFF.cv.width !== W || OFF.cv.height !== H) { OFF.cv = document.createElement("canvas"); OFF.cv.width = W; OFF.cv.height = H; }
  const o = OFF.cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.globalAlpha = 1;
  fn(o);
  c.save(); c.globalAlpha = a; c.drawImage(OFF.cv, 0, 0); c.restore();
};


// Crayon banana.
const banana = (c: Ctx, x: number, y: number, s: number, r: () => number, p = 1, rot = -0.3) => {
  if (p <= 0) return;
  const k = easeOut(p) * s;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.beginPath(); c.moveTo(-70, -20); c.quadraticCurveTo(0, 70, 78, -24); c.quadraticCurveTo(0, 30, -70, -20); c.closePath();
  c.fillStyle = COL.yellow; c.fill();
  stroke(c, [[-70, -20], [-30, 22], [10, 34], [50, 18], [78, -24]], "#b45309", 5, r, { passes: 2, alpha: 0.7 });
  c.beginPath(); c.arc(-72, -21, 7, 0, 7); c.fillStyle = "#3f2a12"; c.fill();
  c.restore();
};

// Magnifying glass; `lens` draws inside the lens (clipped, centred at 0,0).
const magnifier = (c: Ctx, x: number, y: number, R: number, r: () => number, p: number, lens?: (c: Ctx) => void) => {
  if (p <= 0) return;
  const k = easeOut(p);
  c.save(); c.translate(x, y); c.scale(k, k);
  stroke(c, [[R * 0.72, R * 0.72], [R * 1.5, R * 1.5]], "#7c4a1e", R * 0.24, r, { passes: 2, alpha: 0.95 });
  c.beginPath(); c.arc(0, 0, R, 0, 7); c.fillStyle = "#f8fbff"; c.fill();
  if (lens) { c.save(); c.beginPath(); c.arc(0, 0, R - 4, 0, 7); c.clip(); lens(c); c.restore(); }
  stroke(c, circlePts(0, 0, R, R), COL.ink, 9, r, { passes: 2, alpha: 0.85 });
  c.restore();
};

// Three crayon bars for one pixel's red, green, blue.
const rgbBars = (c: Ctx, x: number, y: number, w: number, vals: number[], p: number, r: () => number, size = 50) => {
  if (p <= 0) return;
  const cols = ["#ef4444", "#22c55e", "#3b82f6"], names = ["R", "G", "B"];
  vals.forEach((v, i) => {
    const q = clamp(p * 3 - i * 0.7);
    if (q <= 0) return;
    const yy = y + i * (size + 22);
    label(c, names[i], x, yy + size * 0.36, size, cols[i], caveat, q, "left");
    c.save(); c.globalAlpha = clamp(q * 1.5);
    c.fillStyle = "rgba(4,8,40,0.12)"; c.fillRect(x + 50, yy - size * 0.3, w, size * 0.62);
    c.fillStyle = cols[i]; c.fillRect(x + 50, yy - size * 0.3, (w * v / 255) * easeOut(q), size * 0.62);
    c.restore();
    stroke(c, rrectPts(x + 50, yy - size * 0.3, w, size * 0.62), COL.ink, 3, r, { passes: 1, alpha: 0.5 * q });
    label(c, String(Math.round(v * easeOut(q))), x + 66 + w, yy + size * 0.36, size, INK, caveat, q, "left");
  });
};

// Rounded option chip; `state` 1 = right answer (green), -1 = wrong (faded).
const chip = (c: Ctx, text: string, x: number, y: number, w: number, p: number, r: () => number, state = 0) => {
  if (p <= 0) return;
  const k = easeOut(p), h = 112;
  c.save(); c.globalAlpha = state < 0 ? 0.45 : 1; c.translate(x, y); c.scale(k, k);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -w / 2 + 8, -h / 2 + 10, w, h, 56); c.fill();
  c.fillStyle = state > 0 ? "#bbf7d0" : COL.cream; rrect(c, -w / 2, -h / 2, w, h, 56); c.fill();
  c.restore();
  stroke(c, rrectPts(x - (w / 2) * k, y - (h / 2) * k, w * k, h * k), state > 0 ? "#15803d" : COL.ink, state > 0 ? 7 : 4, r, { passes: 2, alpha: state < 0 ? 0.3 : 0.7 });
  label(c, text + (state > 0 ? " ✓" : ""), x, y + 22, 66 * k, state > 0 ? "#15803d" : INK, caveat, state < 0 ? 0.45 : p);
};

// Small "banana?" print pinned top-left: keeps the hook's question in view through the lesson.
const pinBanana = (c: Ctx, img: HTMLImageElement | undefined, r: () => number) => {
  print(c, img, 40, 298, 116, 1, -0.09, { border: 6 });
  tag(c, "banana?", 98, 448, 30, COL.red, "#fff", -0.06, 1);
  void r;
};

// Thumbs up / down doodle (human feedback, for the "next episode" teaser).
const thumb = (c: Ctx, x: number, y: number, s: number, up: boolean, col: string, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p) * s;
  c.save(); c.translate(x, y); c.scale(k, up ? k : -k);
  c.fillStyle = col;
  rrect(c, -34, -8, 68, 64, 16); c.fill();                // fist
  rrect(c, -30, -62, 28, 62, 14); c.fill();               // thumb
  c.fillStyle = COL.navy; c.fillRect(-56, -2, 20, 58);    // cuff
  c.restore();
  stroke(c, [[x - 34 * k, y + (up ? 14 : -14) * k], [x + 30 * k, y + (up ? 14 : -14) * k]], COL.ink, 3, r, { passes: 1, alpha: 0.5 * p });
};

// ---------- 1 HOOK ----------
const CvHook: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const im = usePhotos(["dog", "banana", "banana224"]);
  return (
    <>
      <Sfx at={0} src="reel/sfx_boom.wav" vol={0.85} />
      <Sfx at={2} src="audio/gag_boing.wav" vol={0.35} />
      <Sfx at={c1} src="audio/sfx_whoosh.wav" vol={0.5} />
      <Sfx at={c2} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.5} />
      <Sfx at={c4} src="audio/sfx_whoosh.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(2900 + boil);
        const m = easeOut(seg(f, c1 - 4, c1 + 12));
        // the banana file: centre stage, then moves right
        const bx = lerp(200, 575, m), by = lerp(330, 420, m), bw = lerp(680, 455, m);
        print(c, im.banana, bx, by, bw, 1, 0.02);
        // c3: it turns into its real numbers
        const d = pixelsOf(im.banana224), numb = easeOut(seg(f, c3, c3 + 14));
        if (d && numb > 0) {
          const n = 9, cell = bw / n;
          c.save(); c.globalAlpha = numb * 0.88; c.fillStyle = COL.navy; c.fillRect(bx, by, bw, bw); c.restore();
          c.save(); c.globalAlpha = numb; c.font = caveat(Math.round(cell * 0.4)); c.textAlign = "center";
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
            const [rv] = rgbAt(d, Math.floor((i + 0.5) * 224 / n), Math.floor((j + 0.5) * 224 / n));
            c.fillStyle = rv > 150 ? COL.yellow : COL.pale;
            c.fillText(String(rv), bx + (i + 0.5) * cell, by + (j + 0.5) * cell + cell * 0.14);
          }
          c.restore();
        }
        stamp(c, "BANANA", bx + bw * 0.5, by + bw * 0.42, lerp(150, 100, m), COL.red, clamp(0.4 + f / 8), r, -0.14);
        banana(c, bx + bw - 40, by + 40, lerp(1.3, 0.9, m), r, clamp(0.5 + f / 10));
        tag(c, "AI: 99.99% sure", bx + bw / 2, by + bw + 78, lerp(72, 50, m), COL.yellow, INK, 0.02, 1);
        if (m < 1) label(c, "ResNet-50 · a free photo AI · run by us", W / 2, 1210, 44, COL.pale, handF, clamp(seg(f, 3, 12) - m));
        // c1: the untouched photo
        if (f >= c1 - 4) {
          const ax = lerp(-500, 50, m);
          print(c, im.dog, ax, 420, 455, 1, -0.02);
          tag(c, "before: golden retriever 99.8%", ax + 228, 420 + 455 + 78, 42, COL.cream, INK, -0.02, seg(f, c1 + 4, c1 + 12));
        }
        // c2: one pixel, before and after
        if (f >= c2 && f < c3 + 8) {
          const p = seg(f, c2, c2 + 10);
          magnifier(c, W / 2 - 150, 1160, 104, r, p, (o) => {
            o.fillStyle = "rgb(179,142,102)"; o.fillRect(-104, -104, 104, 208);
            o.fillStyle = "rgb(178,143,102)"; o.fillRect(0, -104, 104, 208);
            o.font = caveat(46); o.textAlign = "center"; o.fillStyle = INK;
            o.fillText("179", -50, 16); o.fillText("178", 50, 16);
          });
          label(c, "red 179 → 178", W / 2 + 170, 1140, 56, COL.yellow, caveat, seg(f, c2 + 6, c2 + 14));
          label(c, "(out of 255) · same colour to you", W / 2 + 170, 1205, 40, COL.cream, handF, seg(f, c2 + 10, c2 + 18));
        }
        if (f >= c3) {
          c.save(); c.globalAlpha = fade(f, c3, 6) * 0.9; c.fillStyle = COL.deep; c.fillRect(0, 1040, W, 300); c.restore();
          group(c, 1 - fade(f, c4 - 2, 6), (o) => {
            hand(o, "it only sees numbers,", W / 2, 1150, 70, COL.yellow, seg(f, c3 + 4, c3 + 18), r, -0.02, "center");
            hand(o, "and we pushed the right ones", W / 2, 1240, 60, COL.cream, seg(f, c3 + 22, c3 + 38), r, -0.02, "center");
          });
        }
        // c4: the open loop, as a sticky note
        if (f >= c4) {
          const p = easeOut(seg(f, c4, c4 + 10));
          c.save(); c.translate(W / 2, 1185); c.rotate(-0.035); c.scale(p, p);
          c.fillStyle = "rgba(4,8,40,0.35)"; c.fillRect(-330 + 10, -95 + 12, 660, 190);
          c.fillStyle = COL.yellow; c.fillRect(-330, -95, 660, 190);
          c.font = caveat(66); c.textAlign = "center"; c.fillStyle = INK; c.fillText("would ChatGPT fall for it?", 0, -8);
          c.font = handF(46); c.fillStyle = "#7c2d12"; c.fillText("→ at the end", 0, 60);
          c.restore();
        }
      }} />
    </>
  );
};

// ---------- 2 PIXELS ----------
const CvPixels: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  const im = usePhotos(["dog224", "banana"]);
  return (
    <>
      <Sfx at={2} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2, 3].map((k) => <Sfx key={k} at={c2 + 4 + k * 5} src="audio/sfx_tick.wav" vol={0.3} />)}
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3000 + boil);
        pinBanana(c, im.banana, r);
        const z = ease(seg(f, 4, Math.max(c1 - 6, 40)));
        const sw = Math.exp(lerp(Math.log(224), Math.log(9), z));
        const cx = lerp(112, BX + 4.5, z), cy = lerp(112, BY + 4.5, z);
        const sx = clamp(cx - sw / 2, 0, 224 - sw), sy = clamp(cy - sw / 2, 0, 224 - sw);
        const X = 190, Y = 320, Wd = 700, cell = Wd / sw;
        print(c, im.dog224, X, Y, Wd, 1, 0, { sx, sy, sw, hard: true });
        if (cell > 14) {
          c.save(); c.beginPath(); c.rect(X, Y, Wd, Wd); c.clip();
          c.globalAlpha = clamp((cell - 14) / 30) * 0.8; c.strokeStyle = "rgba(5,12,61,0.55)"; c.lineWidth = 2;
          for (let k = Math.ceil(sx); k < sx + sw; k++) { const xx = X + (k - sx) * cell; c.beginPath(); c.moveTo(xx, Y); c.lineTo(xx, Y + Wd); c.stroke(); }
          for (let k = Math.ceil(sy); k < sy + sw; k++) { const yy = Y + (k - sy) * cell; c.beginPath(); c.moveTo(X, yy); c.lineTo(X + Wd, yy); c.stroke(); }
          c.restore();
        }
        if (f < c3) hand(c, "a photo = a grid of pixels", W / 2, 1100, 66, COL.yellow, seg(f, 8, 22), r, -0.02, "center");
        // c3: every square shows its three real numbers
        const d = pixelsOf(im.dog224);
        if (d && f >= c3) {
          const q = seg(f, c3, c3 + 14);
          c.save(); c.textAlign = "center"; c.font = caveat(Math.round(cell * 0.27));
          for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
            if ((i + j) / 16 > q) continue;
            const v = rgbAt(d, BX + i, BY + j), lum = 0.3 * v[0] + 0.59 * v[1] + 0.11 * v[2];
            c.fillStyle = lum > 120 ? INK : "#ffffff";
            v.forEach((n, k) => c.fillText(String(n), X + (i + 0.5) * cell, Y + j * cell + cell * (0.33 + k * 0.27)));
          }
          c.restore();
          hand(c, "not one says 'dog'", W / 2, 1100, 74, COL.red, seg(f, c3 + 2, c3 + 16), r, -0.02, "center");
          magnifier(c, 905, 395, 100, r, seg(f, c3 + 4, c3 + 14), (o) => { o.font = caveat(64); o.fillStyle = COL.red; o.textAlign = "center"; o.fillText("dog?", 0, 20); });
          if (f >= c3 + 16) stroke(c, [[835, 340], [975, 450]], COL.red, 11, r, { passes: 2, alpha: seg(f, c3 + 16, c3 + 22) });
        }
        // c1: one pixel = three numbers
        if (f >= c1 && f < c2) {
          const p = fade(f, c1, 8);
          stroke(c, rrectPts(X + 4 * cell, Y + 4 * cell, cell, cell), COL.yellow, 9, r, { passes: 2, alpha: p });
          if (card(c, 150, 1135, 780, 250, r, p)) {
            rgbBars(c, 195, 1190, 340, FUR, seg(f, c1 + 2, c1 + 18), r, 46);
            label(c, "each", 820, 1235, 46, GREY, handF, seg(f, c1 + 16, c1 + 26));
            label(c, "0 to 255", 820, 1300, 54, INK, caveat, seg(f, c1 + 18, c1 + 28));
          }
        }
        if (f >= c2) {
          const p = fade(f, c2, 8);
          if (card(c, 150, 1135, 780, 250, r, p)) {
            label(c, "224 × 224 pixels × 3 =", W / 2, 1192, 48, GREY, handF, p);
            const n = 150528 * easeOut(seg(f, c2 + 4, c2 + 22));
            label(c, `${fmt(n)} numbers`, W / 2, 1282, 84, COL.red, caveat, p);
            label(c, "a 12 MP phone photo: about 36 million", W / 2, 1352, 44, INK, handF, seg(f, c2 + 22, c2 + 32));
          }
        }
      }} />
    </>
  );
};

// ---------- 3 PATTERNS ----------
const CvFilters: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const im = usePhotos(["dog", "banana", "fV", "fH", "litV", "litH"]);
  return (
    <>
      <Sfx at={4} src="audio/sfx_whoosh.wav" vol={0.3} />
      <Sfx at={Math.round(c1 + (c2 - c1) * 0.4)} src="audio/sfx_pop.wav" vol={0.45} />
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.4} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(3100 + boil);
        if (f < c2 - 4) pinBanana(c, im.banana, r);
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          const X = 200, Y = 330, Wd = 680;
          print(o, im.dog, X, Y, Wd, 1, -0.01);
          const t = seg(f, 6, Math.max(c2 - 6, 60)), n = 6, cw = Wd / n;
          const pos = t * n * n, row = Math.min(n - 1, Math.floor(pos / n)), colf = pos - row * n;
          const col = row % 2 ? n - 1 - Math.min(n - 1, colf) : Math.min(n - 1, colf);
          const wx = X + col * cw, wy = Y + row * cw;
          o.save(); o.globalAlpha = 0.25; o.fillStyle = COL.yellow; o.fillRect(wx, wy, cw, cw); o.restore();
          stroke(o, rrectPts(wx, wy, cw, cw), COL.yellow, 9, r, { passes: 2, alpha: 0.95 });
          tag(o, "pattern-finder", wx + cw / 2, wy - 22, 38, COL.yellow, INK, -0.03, seg(f, 6, 14));
          hand(o, "tiny pattern-finders slide over it", W / 2, 1100, 60, COL.cream, seg(f, 8, 22), r, -0.02, "center");
          const ce = Math.round(c1 + (c2 - c1) * 0.4);   // "each looking for one thing"
          if (f >= ce) {
            const p = fade(f, ce, 8);
            if (card(o, 150, 1150, 780, 230, r, p)) {
              print(o, im.fV, 195, 1190, 150, p, 0, { hard: true, border: 0 });
              label(o, "each looks for one thing,", 630, 1225, 46, INK, handF, p);
              label(o, "like this edge", 630, 1298, 64, COL.orange, caveat, p);
              label(o, "a real one from this AI (learned, not drawn)", 630, 1352, 30, GREY, handF, seg(f, ce + 10, ce + 20));
            }
          }
        });
        // c2: what two of them light up on the photo (real responses)
        if (f >= c2 - 4) {
          const a = fade(f, c2 - 4, 8);
          const items: [HTMLImageElement | undefined, HTMLImageElement | undefined, string, string, number][] = [[im.litV, im.fV, "vertical edges", "legs, leash", 70], [im.litH, im.fH, "horizontal edges", "pavement, mouth", 560]];
          items.forEach(([lit, fi, name, what, x], i) => {
            const p = a * seg(f, c2 + i * 8, c2 + i * 8 + 12);
            print(c, lit, x, 480, 450, p, i ? 0.015 : -0.015, { border: 10 });
            print(c, fi, x + 18, 400, 64, p, 0, { hard: true, border: 4 });
            label(c, name, x + 100, 450, 50, COL.yellow, caveat, p, "left");
            label(c, what, x + 225, 1005, 56, COL.cream, caveat, p);
          });
          label(c, "real responses on our photo (brightened)", W / 2, 1075, 38, COL.pale, handF, seg(f, c2 + 20, c2 + 30));
          hand(c, "where one matches, it lights up", W / 2, 1210, 64, COL.yellow, seg(f, c2 + 24, c2 + 38), r, -0.02, "center");
        }
      }} />
    </>
  );
};

// ---------- 4 LAYERS ----------
const CvLayers: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const at = [0, Math.round(c1 * 0.45), c1];
  const im = usePhotos(["dog", "banana", "fV", "fH"]);
  return (
    <>
      <Sfx at={at[1]} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.35} />
      <Sfx at={c3} src="audio/sfx_success.wav" vol={0.4} />
      <Sfx at={c4} src="reel/sfx_boom.wav" vol={0.55} />
      <Sfx at={c4 + 3} src="audio/gag_boing.wav" vol={0.3} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3200 + boil);
        if (f < c2) pinBanana(c, im.banana, r);
        hand(c, "layer by layer", W / 2, 345, 70, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
        const FL: [string, number][] = [["edges", 1060], ["parts", 840], ["face", 620]];
        FL.forEach(([name, y], i) => {
          const p = seg(f, at[i] - 2, at[i] + 8), lit = f >= at[i] && (i === 2 ? f < c2 + 6 : f < at[i + 1] + 4);
          if (p <= 0) return;
          c.save(); c.globalAlpha = clamp(p * 1.4);
          c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 128, y + 10, 840, 185, 22); c.fill();
          c.fillStyle = lit ? "#fff3c4" : COL.cream; rrect(c, 120, y, 840, 185, 22); c.fill();
          c.restore();
          stroke(c, rrectPts(120, y, 840, 185), lit ? COL.orange : COL.ink, lit ? 7 : 4, r, { passes: 2, alpha: 0.7 * p });
          label(c, name, 180, y + 115, 72, INK, caveat, p, "left");
          const ix = 640, iy = y + 92;
          if (i === 0) { print(c, im.fV, ix - 110, iy - 60, 120, p, -0.03, { hard: true, border: 5 }); print(c, im.fH, ix + 70, iy - 60, 120, p, 0.03, { hard: true, border: 5 }); }
          if (i === 1) {
            c.save(); c.globalAlpha = clamp(p);
            c.beginPath(); c.arc(ix - 50, iy - 6, 44, 0, 7); c.fillStyle = "#3f2a12"; c.fill(); c.beginPath(); c.arc(ix - 36, iy - 20, 12, 0, 7); c.fillStyle = "#fff"; c.fill();
            c.beginPath(); c.moveTo(ix + 70, iy + 44); c.lineTo(ix + 118, iy - 58); c.lineTo(ix + 176, iy + 38); c.closePath(); c.fillStyle = "#d6a46b"; c.fill();
            c.restore();
            label(c, "eye", ix - 50, iy + 80, 36, GREY, handF, p); label(c, "ear", ix + 122, iy + 80, 36, GREY, handF, p);
          }
          if (i === 2) { c.save(); c.globalAlpha = clamp(p); dogFace(c, ix + 20, iy - 4, 1.05, r); c.restore(); }
          if (i > 0) arrow(c, [90, FL[i - 1][1] + 140], [90, y + 60], -30, COL.yellow, 7, seg(f, at[i] - 4, at[i] + 6), r);
        });
        // the answer, on top
        if (f >= c2) {
          const p = seg(f, c2, c2 + 8), flip = f >= c4;
          arrow(c, [90, 680], [90, 470], -30, COL.yellow, 7, p, r);
          if (card(c, 120, 400, 840, 170, r, p, flip ? "#ffe4e6" : "#e8f5e1")) {
            print(c, flip ? im.banana : im.dog, 150, 418, 134, p, -0.03, { border: 5 });
            if (f >= c3) {
              const q = flip ? fade(f, c4, 6) : seg(f, c3, c3 + 8);
              label(c, flip ? "banana 99.99%" : "golden retriever 99.8%", 600, 510, flip ? 82 : 66, flip ? COL.red : "#15803d", caveat, q);
              if (flip) banana(c, 905, 452, 0.62, r, q);
            } else label(c, "answer: ?", 600, 510, 66, GREY, caveat, p);
          }
          if (flip) hand(c, "nudge the numbers a shade…", W / 2, 1335, 62, COL.yellow, seg(f, c4 + 4, c4 + 18), r, -0.02, "center");
        }
        label(c, "(simplified)", 1000, 1290, 34, COL.pale, handF, seg(f, 6, 16), "right");
      }} />
    </>
  );
};

// ---------- 5 QUIZ (before the explanation) ----------
const CvQuiz: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2);
  const im = usePhotos(["random"]);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2, 3, 4].map((k) => <Sfx key={k} at={c1 + 24 + k * 14} src="audio/sfx_tick.wav" vol={0.35} />)}
      <Sfx at={c2} src="audio/sfx_success.wav" vol={0.5} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3600 + boil);
        hand(c, "YOUR TURN", W / 2, 360, 100, COL.yellow, seg(f, 0, 12), r, -0.03, "center");
        print(c, im.random, 290, 420, 500, seg(f, 2, 10), 0.015);
        if (f >= c1) {
          const rr = rng(700 + Math.floor(f / 4));
          c.save(); c.globalAlpha = fade(f, c1, 8) * 0.9;
          for (let k = 0; k < 26; k++) { const x = 300 + rr() * 480, y = 430 + rr() * 480; c.fillStyle = k % 2 ? COL.yellow : "#ffffff"; c.fillRect(x, y, 6, 6); }
          c.restore();
          hand(c, "just as many, just as tiny, but random", W / 2, 1010, 54, COL.cream, seg(f, c1, c1 + 14), r, -0.02, "center");
        }
        const ans = f >= c2;
        chip(c, "dog", 350, 1130, 280, seg(f, c1 + 8, c1 + 16), r, ans ? 1 : 0);
        chip(c, "banana", 730, 1130, 330, seg(f, c1 + 12, c1 + 20), r, ans ? -1 : 0);
        if (f >= c1 + 24 && !ans) {
          const q = seg(f, c1 + 24, c2);
          stroke(c, circlePts(W / 2, 1285, 52, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - q), 40), COL.yellow, 10, r, { passes: 2 });
          label(c, String(3 - Math.min(2, Math.floor(q * 3))), W / 2, 1309, 66, COL.yellow, caveat);
        }
        if (ans) {
          stamp(c, "STILL DOG", W / 2, 690, 96, "#15803d", fade(f, c2, 8), r, -0.06);
          label(c, "we tried 5 random changes: all dog", W / 2, 1290, 44, COL.cream, handF, seg(f, c2 + 10, c2 + 20));
        }
      }} />
    </>
  );
};

// ---------- 6 WHY ----------
const CvWhy: React.FC<SP> = ({ cue }) => {
  const c1 = cue(1), c2 = cue(2), c3 = cue(3);
  return (
    <>
      <Sfx at={c1} src="audio/sfx_pop.wav" vol={0.45} />
      {[0, 1, 2, 3, 4, 5].map((k) => <Sfx key={k} at={c2 + 2 + k * 4} src="audio/sfx_tick.wav" vol={0.28} />)}
      <Sfx at={c3} src="reel/sfx_boom.wav" vol={0.6} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil, COL.deep);
        const r = rng(3500 + boil);
        hand(c, "why?", W / 2, 355, 96, COL.yellow, seg(f, 0, 10), r, -0.03, "center");
        // c1: free to download -> we looked inside; which way should each number move?
        if (f >= c1) {
          const p = fade(f, c1, 8);
          if (card(c, 70, 420, 940, 330, r, p)) {
            label(c, "free to download → we looked inside it", W / 2, 482, 46, GREY, handF, p);
            const cw = 140, x0 = W / 2 - 3 * cw;
            ROW_BEFORE.forEach((v, i) => {
              const q = seg(f, c1 + 4 + i * 2, c1 + 12 + i * 2), up = ROW_AFTER[i] > v, same = ROW_AFTER[i] === v;
              const moved = seg(f, c2 + 2 + i * 4, c2 + 6 + i * 4);
              const x = x0 + (i + 0.5) * cw, col = ["#ef4444", "#16a34a", "#2563eb"][i % 3];
              if (!same && q > 0) arrow(c, [x, up ? 592 : 544], [x, up ? 544 : 592], 0, up ? "#16a34a" : COL.red, 6, q, r);
              if (same && q > 0) label(c, "=", x, 586, 44, GREY, caveat, q);
              label(c, String(moved >= 1 ? ROW_AFTER[i] : v), x, 660, 70, col, caveat, q);
            });
            label(c, "which way for 'banana'?", W / 2, 722, 44, INK, handF, seg(f, c1 + 14, c1 + 24) * (1 - seg(f, c2, c2 + 4)));
            label(c, "122,204 numbers moved by just 1", W / 2, 722, 48, COL.red, caveat, seg(f, c2 + 4, c2 + 12));
          }
        }
        // c3: aimed pushes add up; random ones cancel
        if (f >= c3 - 2) {
          const p = fade(f, c3 - 2, 8);
          [["aimed at 'banana'", 290, true], ["random", 790, false]].forEach(([name, cx, aimed], j) => {
            const x = cx as number, q = seg(f, c3 + j * 10, c3 + j * 10 + 16);
            label(c, name as string, x, 840, 58, aimed ? COL.yellow : COL.pale, caveat, p);
            const rr = rng(900 + j * 7);
            for (let k = 0; k < 9; k++) {
              const ang = aimed ? 0 : rr() * Math.PI * 2, y = 890 + (k % 3) * 46, xx = x - 120 + Math.floor(k / 3) * 90;
              const a: Pt = [xx, y], b: Pt = [xx + Math.cos(ang) * 60, y + Math.sin(ang) * 24];
              arrow(c, a, b, 0, aimed ? COL.yellow : COL.pale, 5, clamp(q * 1.6 - k * 0.08), r);
            }
            const qq = seg(f, c3 + 20 + j * 10, c3 + 34 + j * 10);
            if (aimed) { arrow(c, [x - 180, 1100], [x + 180, 1100], 0, COL.orange, 18, qq, r); label(c, "→ banana", x, 1200, 70, COL.orange, caveat, qq); }
            else { c.save(); c.globalAlpha = qq; c.beginPath(); c.arc(x, 1100, 12, 0, 7); c.fillStyle = COL.pale; c.fill(); c.restore(); label(c, "cancel out → dog", x, 1200, 62, COL.cream, caveat, qq); }
          });
          label(c, "every push aimed at 'banana', so they add up", W / 2, 1310, 44, COL.cream, handF, seg(f, c3 + 30, c3 + 42));
        }
      }} />
    </>
  );
};

// ---------- 7 CLOSE ----------
const OTHERS = ["ViT", "ResNet-18", "ConvNeXt", "Swin"];
const lock = (c: Ctx, x: number, y: number, s: number, r: () => number, p: number) => {
  if (p <= 0) return;
  const k = easeOut(p) * s;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.lineWidth = 12; c.strokeStyle = "#cbd5e1"; c.beginPath(); c.arc(0, -22, 26, Math.PI, 0); c.stroke();
  c.fillStyle = COL.yellow; rrect(c, -40, -22, 80, 62, 10); c.fill();
  c.fillStyle = COL.ink; c.beginPath(); c.arc(0, 4, 8, 0, 7); c.fill(); c.fillRect(-3, 6, 6, 18);
  c.restore();
  void r;
};
const CvClose: React.FC<SP> = ({ s, cue }) => {
  const handle: string = s.data.handle ?? "@ai_maastaaru";
  const c1 = cue(1), c2 = cue(2), c3 = cue(3), c4 = cue(4);
  const span = c2 - c1, ca = Math.round(c1 + span * 0.14), cm = Math.round(c1 + span * 0.44), cj = Math.round(c1 + span * 0.76);   // aimed/closed, models, JPEG
  const im = usePhotos(["banana"]);
  return (
    <>
      <Sfx at={c1} src="reel/sfx_boom.wav" vol={0.45} />
      <Sfx at={ca} src="audio/sfx_pop.wav" vol={0.35} />
      {OTHERS.map((_, i) => <Sfx key={i} at={cm + i * 4} src="audio/sfx_pop.wav" vol={0.28} />)}
      <Sfx at={cj} src="audio/sfx_pop.wav" vol={0.4} />
      <Sfx at={c2} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c3} src="audio/sfx_whoosh.wav" vol={0.4} />
      <Sfx at={c4} src="audio/sfx_success.wav" vol={0.3} />
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        background(c, W, H, boil);
        const r = rng(3700 + boil);
        // [1] probably not: aimed at one AI, ChatGPT is closed, 4 others said dog, a JPEG save broke it
        group(c, 1 - fade(f, c2 - 4, 8), (o) => {
          hand(o, "would ChatGPT fall for it?", W / 2, 350, 70, COL.yellow, seg(f, 0, 12), r, -0.02, "center");
          stamp(o, "PROBABLY NOT", W / 2, 488, 92, "#4ade80", fade(f, c1, 8), r, -0.04);
          if (f >= ca) {
            const p = seg(f, ca, ca + 10);
            print(o, im.banana, 120, 570, 104, p, -0.04, { border: 5 });
            label(o, "aimed at this one AI", 250, 640, 46, COL.cream, caveat, p, "left");
            lock(o, 690, 625, 0.8, r, seg(f, ca + 6, ca + 14));
            label(o, "ChatGPT: closed", 740, 640, 46, COL.cream, caveat, seg(f, ca + 8, ca + 16), "left");
          }
          OTHERS.forEach((name, i) => {
            const p = seg(f, cm + i * 4, cm + i * 4 + 10), x = 110 + (i % 2) * 450, y = 720 + Math.floor(i / 2) * 165;
            if (!card(o, x, y, 410, 145, r, p)) return;
            print(o, im.banana, x + 16, y + 16, 112, p, -0.02, { border: 4 });
            label(o, name, x + 268, y + 58, 40, GREY, handF, p);
            label(o, "dog ✓", x + 268, y + 118, 58, "#15803d", caveat, p);
          });
          label(o, "4 other photo AIs, same banana file", W / 2, 1090, 40, COL.cream, handF, seg(f, cm + 18, cm + 28));
          tag(o, "saved as a JPEG → dog again", W / 2, 1180, 50, COL.cream, INK, -0.02, seg(f, cj, cj + 10));
        });
        // [2] sure isn't right; chatbots show no number at all
        if (f >= c2 - 4) {
          group(c, fade(f, c2 - 4, 8) * (1 - fade(f, c3 - 4, 8)), (o) => {
            print(o, im.banana, 340, 380, 400, 1, 0.02);
            tag(o, "banana 99.99%", W / 2, 870, 56, COL.yellow, INK, 0.02, 1);
            stamp(o, "SURE ≠ RIGHT", W / 2, 640, 104, COL.red, fade(f, c2 + 4, 8), r, -0.06);
            hand(o, "chatbots don't even show a number", W / 2, 1010, 58, COL.cream, seg(f, c2 + 16, c2 + 30), r, -0.02, "center");
            hand(o, "double-check what matters", W / 2, 1110, 70, COL.yellow, seg(f, c2 + 34, c2 + 50), r, -0.02, "center");
          });
        }
        if (f >= c3 - 4) {
          hand(c, "NEXT:", W / 2, 640, 80, COL.orangeLight, seg(f, c3, c3 + 10), r, -0.02, "center");
          thumb(c, W / 2 - 200, 630, 1.0, true, "#4ade80", r, seg(f, c3 + 4, c3 + 12));
          thumb(c, W / 2 + 200, 610, 1.0, false, COL.red, r, seg(f, c3 + 8, c3 + 16));
          hand(c, "how AI learns good manners", W / 2, 790, 72, COL.cream, seg(f, c3 + 6, c3 + 22), r, -0.02, "center");
        }
        if (f >= c4) {
          const hp = easeOut(fade(f, c4, 12));
          c.save(); c.globalAlpha = hp;
          c.font = caveat(handle.length > 16 ? 84 : 98); c.textAlign = "center"; c.fillStyle = COL.yellow;
          c.shadowColor = COL.orange; c.shadowBlur = 24; c.fillText(handle, W / 2, 1040);
          c.shadowBlur = 0; c.font = handF(58); c.fillStyle = COL.cream; c.fillText("Follow for the next episode", W / 2, 1125);
          c.restore();
        }
      }} />
    </>
  );
};

export const VISION_SCENES = { cv_hook: CvHook, cv_pixels: CvPixels, cv_filters: CvFilters, cv_layers: CvLayers, cv_quiz: CvQuiz, cv_why: CvWhy, cv_close: CvClose };
