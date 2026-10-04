import React from "react";
import { AbsoluteFill } from "remotion";

// A celebration set for dance reels, in the spirit of Telugu film song sequences: the whole frame performs with the
// dancer. Everything is driven by the beat grid and by "hits" (step changes / drops):
//  - LED wall behind the stage with patterns that change every bar
//  - moving-head spotlights sweeping on the beat, a strobe flash on each hit
//  - mango-leaf thoranam and marigold garlands across the top, swinging string lights (telugu flavour)
//  - dhol drummers on both wings striking on every beat, a cheering crowd silhouette bouncing in front
//  - spark fountains + flower-petal / confetti bursts on each hit, low fog rolling over the floor
// Pure function of time: no state, deterministic per frame.

type Props = { t: number; beats: number[]; hits: number[]; flavor?: "telugu" | "pop"; palette?: string[] };
const DEF_PAL = ["#ff2d55", "#ffb300", "#00e5ff", "#7c4dff", "#00e676", "#ff6d00"];

const idx = (t: number, b: number[]) => { let k = -1; for (let i = 0; i < b.length && b[i] <= t; i++) k = i; return k; };
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export const SongSet: React.FC<Props & { layer: "back" | "front" }> = ({ t, beats, hits, flavor = "telugu", palette = DEF_PAL, layer }) => {
  const k = idx(t, beats);
  const since = k >= 0 ? t - beats[k] : 9;
  const pulse = Math.exp(-since * 7); // 1 on the beat, decays
  const bar = Math.floor(Math.max(0, k) / 4);
  const c1 = palette[bar % palette.length], c2 = palette[(bar + 2) % palette.length];
  const hk = idx(t, hits), hitAge = hk >= 0 ? t - hits[hk] : 9;

  if (layer === "back") {
    return (
      <AbsoluteFill>
        {/* LED wall: a grid of lamps, pattern per bar */}
        <div style={{ position: "absolute", left: 40, right: 40, top: 560, height: 640, display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 8, opacity: 0.8 }}>
          {Array.from({ length: 96 }, (_, i) => {
            const x = i % 12, y = Math.floor(i / 12);
            const mode = bar % 4;
            const on = mode === 0 ? (x + y + k) % 4 === 0 : mode === 1 ? Math.abs(x - 5.5) + Math.abs(y - 3.5) < ((k % 4) + 1) * 2 : mode === 2 ? (y === (k % 8)) || (x === (k % 12)) : rnd(i + k * 13) > 0.72;
            return <div key={i} style={{ borderRadius: 6, background: on ? (y % 2 ? c1 : c2) : "#16122b", opacity: on ? 0.55 + 0.45 * pulse : 1, boxShadow: on ? `0 0 18px ${y % 2 ? c1 : c2}` : "none" }} />;
          })}
        </div>
        {/* moving-head beams from the truss, sweeping with the beat */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
          <defs>
            <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          </defs>
          {[90, 300, 540, 780, 990].map((x, i) => {
            const a = Math.sin(t * 1.9 + i * 1.3) * 28 + (i % 2 ? 1 : -1) * 10 * pulse;
            const col = palette[(bar + i) % palette.length];
            return (
              <g key={i} transform={`translate(${x},150) rotate(${a})`}>
                <path d="M -14,0 L 14,0 L 170,1350 L -170,1350 Z" fill={col} opacity={0.18 + 0.22 * pulse} />
                <path d="M -6,0 L 6,0 L 60,1350 L -60,1350 Z" fill="url(#beam)" opacity={0.5} />
                <rect x={-22} y={-26} width={44} height={30} rx={6} fill="#111" stroke="#444" strokeWidth={3} />
              </g>
            );
          })}
          <rect x={0} y={118} width={1080} height={18} fill="#2b2b33" />
        </svg>
        {flavor === "telugu" && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {/* thoranam: mango leaves on a rope, swaying slightly */}
            <path d={`M -20,40 Q 540,${110 + 8 * Math.sin(t * 2)} 1100,40`} stroke="#8d6e63" strokeWidth={5} fill="none" />
            {Array.from({ length: 22 }, (_, i) => {
              const x = -10 + i * 52, y = 40 + 70 * Math.sin((Math.PI * (x + 20)) / 1120) * 1 + 8 * Math.sin(t * 2) * Math.sin((Math.PI * (x + 20)) / 1120);
              const sw = 6 * Math.sin(t * 3 + i);
              return <path key={i} transform={`translate(${x},${y}) rotate(${sw})`} d="M 0,0 Q 14,30 0,62 Q -14,30 0,0 Z" fill={i % 2 ? "#2e7d32" : "#43a047"} stroke="#1b5e20" strokeWidth={2} />;
            })}
            {/* marigold garlands hanging at the sides */}
            {[60, 1020].map((gx, s) => Array.from({ length: 14 }, (_, i) => (
              <circle key={`${s}${i}`} cx={gx + 6 * Math.sin(t * 2.5 + i * 0.4 + s)} cy={150 + i * 34} r={17} fill={i % 3 === 0 ? "#ffd54f" : "#ff8f00"} stroke="#e65100" strokeWidth={2} />
            )))}
          </svg>
        )}
        {/* string lights: bulbs chase along the wire */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {[230, 330].map((y0, r) => (
            <g key={r}>
              <path d={`M 0,${y0} Q 540,${y0 + 90} 1080,${y0}`} stroke="#333" strokeWidth={3} fill="none" />
              {Array.from({ length: 18 }, (_, i) => {
                const u = i / 17, x = u * 1080, y = y0 + 4 * 90 * u * (1 - u);
                const on = (i + k + r) % 3 === 0;
                const col = palette[(i + r) % palette.length];
                return <circle key={i} cx={x} cy={y + 10} r={on ? 11 : 8} fill={on ? col : "#3a3346"} style={{ filter: on ? `drop-shadow(0 0 10px ${col})` : "none" }} />;
              })}
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    );
  }

  // ---------- front layer: drummers, crowd, fog, sparks, petals, strobe ----------
  const petals = hitAge < 2.2 ? Array.from({ length: 70 }, (_, i) => {
    const seed = hk * 100 + i;
    const x0 = rnd(seed) * 1080, vx = (rnd(seed + 1) - 0.5) * 260, vy = 220 + rnd(seed + 2) * 380;
    const x = x0 + vx * hitAge + 40 * Math.sin(hitAge * 3 + i), y = -40 + vy * hitAge;
    const col = flavor === "telugu" ? (i % 3 === 0 ? "#ffd54f" : i % 3 === 1 ? "#ff6f00" : "#e91e63") : palette[i % palette.length];
    return <ellipse key={i} cx={x} cy={y} rx={flavor === "telugu" ? 9 : 6} ry={flavor === "telugu" ? 14 : 12} fill={col} transform={`rotate(${hitAge * 300 * (rnd(seed + 3) - 0.5)} ${x} ${y})`} opacity={Math.min(1, (2.2 - hitAge) * 2)} />;
  }) : null;
  const sparks = hitAge < 1.1 ? [130, 950].map((sx, s) => Array.from({ length: 34 }, (_, i) => {
    const seed = hk * 50 + i + s * 17;
    const a = (-90 + (rnd(seed) - 0.5) * 50) * (Math.PI / 180), v = 900 + rnd(seed + 1) * 700;
    const tt = (hitAge * (0.7 + 0.6 * rnd(seed + 2))) % 1.1;
    const x = sx + Math.cos(a) * v * tt, y = 1700 + Math.sin(a) * v * tt + 900 * tt * tt;
    return <circle key={`${s}${i}`} cx={x} cy={y} r={3 + 2 * rnd(seed + 3)} fill={i % 2 ? "#fff59d" : "#ffb300"} opacity={1 - tt / 1.1} />;
  })) : null;
  const drum = (side: number) => {
    const strike = pulse;
    const x = side < 0 ? 100 : 980;
    return (
      <g transform={`translate(${x},1640) scale(${side},1)`} opacity={0.92}>
        <circle cx={0} cy={-210} r={34} fill="#0d0b16" />
        <path d="M -40,-170 Q 0,-190 40,-170 L 48,-40 L -48,-40 Z" fill="#0d0b16" />
        <ellipse cx={30} cy={-80} rx={46} ry={60} fill="#5d4037" stroke="#ffb300" strokeWidth={5} />
        <line x1={-30} y1={-150} x2={10 + 30 * strike} y2={-120 + 30 * strike} stroke="#0d0b16" strokeWidth={14} strokeLinecap="round" />
        <line x1={10 + 30 * strike} y1={-120 + 30 * strike} x2={40 + 24 * strike} y2={-150 + 70 * strike} stroke="#d7ccc8" strokeWidth={6} strokeLinecap="round" />
        <path d="M -30,-40 L -40,60 L -10,60 L 0,-20 L 10,60 L 40,60 L 30,-40 Z" fill="#0d0b16" />
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* fog */}
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse key={i} cx={((i * 260 + t * 40 * (i % 2 ? 1 : -1)) % 1400) - 160} cy={1700 + 30 * Math.sin(t + i)} rx={260} ry={60} fill="#ffffff" opacity={0.07} />
        ))}
        {flavor === "telugu" && <>{drum(-1)}{drum(1)}</>}
        {/* crowd: heads + raised hands bouncing on the beat, at the bottom edge */}
        {Array.from({ length: 13 }, (_, i) => {
          const x = 20 + i * 86, bounce = 14 * Math.exp(-Math.max(0, since - (i % 3) * 0.04) * 7);
          const up = (i + k) % 2 === 0;
          return (
            <g key={i} transform={`translate(${x},${1890 - bounce})`} fill="#06050c">
              <circle cx={0} cy={-70} r={30} />
              <rect x={-36} y={-44} width={72} height={60} rx={20} />
              {up && <path d={`M -28,-50 L ${-46 + 8 * pulse},-150 M 28,-50 L ${46 - 8 * pulse},-150`} stroke="#06050c" strokeWidth={14} strokeLinecap="round" />}
            </g>
          );
        })}
        {sparks}
        {petals}
      </svg>
      <AbsoluteFill style={{ background: c1, mixBlendMode: "screen", opacity: hitAge < 0.12 ? 0.35 * (1 - hitAge / 0.12) : 0 }} />
    </AbsoluteFill>
  );
};
