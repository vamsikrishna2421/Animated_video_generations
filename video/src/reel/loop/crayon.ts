// Canvas helpers for a hand-drawn crayon / coloured-pencil look.
// Everything is seeded so a frame always redraws identically; the seed changes
// every few frames ("line boil") to give the stop-motion drawn feel.

export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];

export const rng = (seed: number) => {
  let s = (Math.floor(seed) * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 2.2);
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// One crayon stroke: a few jittered passes, low alpha, so edges look waxy.
export const stroke = (c: Ctx, pts: Pt[], color: string, w: number, r: () => number, opts: { passes?: number; jit?: number; alpha?: number } = {}) => {
  const passes = opts.passes ?? 3, jit = opts.jit ?? w * 0.35, alpha = opts.alpha ?? 0.55;
  c.save();
  c.strokeStyle = color; c.lineCap = "round"; c.lineJoin = "round";
  for (let p = 0; p < passes; p++) {
    c.globalAlpha = alpha * (0.7 + 0.3 * r());
    c.lineWidth = w * (0.75 + 0.5 * r());
    c.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = (r() - 0.5) * jit, jy = (r() - 0.5) * jit;
      if (i === 0) c.moveTo(x + jx, y + jy); else c.lineTo(x + jx, y + jy);
    });
    c.stroke();
  }
  c.restore();
};

export const circlePts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, n = 48): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};

// Hatch inside the current clip: parallel strokes with colour jitter.
export const hatch = (c: Ctx, box: [number, number, number, number], colors: string[], r: () => number, opts: { angle?: number; gap?: number; w?: number; alpha?: number; wobble?: number } = {}) => {
  const [x0, y0, x1, y1] = box;
  const ang = opts.angle ?? -0.9, gap = opts.gap ?? 9, w = opts.w ?? 3, alpha = opts.alpha ?? 0.45, wob = opts.wobble ?? 2;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 10;
  c.save(); c.lineCap = "round";
  for (let o = -R; o < R; o += gap * (0.7 + 0.6 * r())) {
    const L = R * (0.6 + 0.4 * r());
    const sx = cx + nx * o - dx * L, sy = cy + ny * o - dy * L;
    const ex = cx + nx * o + dx * L, ey = cy + ny * o + dy * L;
    c.strokeStyle = colors[Math.floor(r() * colors.length)];
    c.globalAlpha = alpha * (0.5 + 0.5 * r());
    c.lineWidth = w * (0.6 + 0.8 * r());
    c.beginPath(); c.moveTo(sx, sy);
    c.quadraticCurveTo((sx + ex) / 2 + (r() - 0.5) * wob * 4, (sy + ey) / 2 + (r() - 0.5) * wob * 4, ex, ey);
    c.stroke();
  }
  c.restore();
};

// Paper grain: built once per size, multiplied over the frame.
const grainCache = new Map<string, HTMLCanvasElement>();
export const grain = (c: Ctx, W: number, H: number, strength = 0.18, shift = 0) => {
  const key = `${W}x${H}`;
  let g = grainCache.get(key);
  if (!g) {
    g = document.createElement("canvas");
    g.width = W / 2; g.height = H / 2;
    const gc = g.getContext("2d")!;
    const img = gc.createImageData(g.width, g.height);
    const r = rng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 255 - Math.pow(r(), 3) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    gc.putImageData(img, 0, 0);
    grainCache.set(key, g);
  }
  c.save();
  c.globalCompositeOperation = "multiply"; c.globalAlpha = strength;
  const ox = (shift * 37) % 40, oy = (shift * 53) % 40;
  c.drawImage(g, -ox, -oy, W + 40, H + 40);
  c.restore();
};

// Soft vignette.
export const vignette = (c: Ctx, W: number, H: number, a = 0.55) => {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, "rgba(0,0,20,0)"); g.addColorStop(1, `rgba(0,0,20,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};

// Handwriting write-on: reveal text left-to-right with a wobbly baseline.
export const writeOn = (c: Ctx, text: string, x: number, y: number, size: number, color: string, p: number, r: () => number, rot = 0) => {
  if (p <= 0) return;
  c.save();
  c.translate(x, y); c.rotate(rot);
  c.font = `700 ${size}px Caveat`;
  const w = c.measureText(text).width;
  c.beginPath(); c.rect(-10, -size, (w + 20) * clamp(p), size * 1.6); c.clip();
  c.fillStyle = color;
  for (let k = 0; k < 2; k++) {
    c.globalAlpha = k ? 0.5 : 0.95;
    c.fillText(text, (r() - 0.5) * 2, (r() - 0.5) * 2);
  }
  c.restore();
};
