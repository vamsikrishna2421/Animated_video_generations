import { Easing, interpolate, spring } from "remotion";

// AI Maastaaru brand tokens: one source for colours, type, timing and motion so every video feels like the channel.
export const FPS = 30;
export const BPM = 120; // the brand music runs at 120 BPM: 1 beat = 15 frames, 1 bar = 60 frames
export const BEAT = (60 / BPM) * FPS;
export const beat = (n: number) => Math.round(n * BEAT);

export const B = {
  night: "#070A18", // dark base
  ink: "#0A0F24", // text on light
  paper: "#F6F4EF", // light base (warm off-white)
  white: "#FFFFFF",
  blue: "#3B6BFF", // primary accent
  violet: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FFB020", // highlight / spark
  rose: "#F43F5E",
  lime: "#C6F432",
  green: "#22C55E",
  muted: "#94A3B8",
  igBlue: "#0095F6",
  ytRed: "#FF0033",
  grad: "linear-gradient(135deg, #3B6BFF 0%, #8B5CF6 100%)",
};

export const F = {
  inter: "Inter, 'DejaVu Sans', sans-serif",
  anton: "Anton, Impact, 'DejaVu Sans', sans-serif",
  archivo: "'Archivo Black', Anton, sans-serif",
  playfair: "'Playfair Display', 'DejaVu Serif', serif",
  mono: "'Space Mono', 'DejaVu Sans Mono', monospace",
  bebas: "'Bebas Neue', Anton, sans-serif",
  marker: "'Permanent Marker', 'Comic Sans MS', cursive",
};

export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1); // expo-out: fast start, long settle
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 -> 1 between frames a and b with the brand ease. */
export const prog = (f: number, a: number, b: number, e = easeOut) => interpolate(f, [a, b], [0, 1], { ...cl, easing: e });

/** Damped spring that starts at frame `at` (overshoots a hair, settles: motion with mass). */
export const pop = (f: number, at: number, damping = 12, mass = 0.6, stiffness = 170) =>
  spring({ frame: f - at, fps: FPS, config: { damping, mass, stiffness } });

/** Deterministic pseudo-random in [0,1) from a seed string/number. */
export const rand = (seed: string | number) => {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

/** Frames at which each character of `text` appears when typed from `start` (for caret + key SFX). */
export const typeTimes = (text: string, start: number, perChar = 2) => {
  const out: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    out.push(Math.round(t));
    const ch = text[i];
    t += perChar * (ch === " " ? 1.6 : ch === "," || ch === "." || ch === "?" ? 3 : 0.7 + rand(`${text}${i}`) * 0.6);
  }
  return out;
};
