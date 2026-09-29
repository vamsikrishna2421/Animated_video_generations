import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

// "World kit": layered, lit, always-moving illustrated environments (parallax depth, atmospheric haze,
// articulated characters). Coordinates are in the parent box (default 1000x560 analogy panel).
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};

export type Palette = { skyTop: string; skyBottom: string; sun: string; haze: string; far: string; near: string; ground: string };
export const DUSK: Palette = { skyTop: "#3b4a7a", skyBottom: "#f4b183", sun: "#fff1c9", haze: "#f8d2b0", far: "#9aa6c4", near: "#4b5a78", ground: "#3a3f4a" };
export const DAY: Palette = { skyTop: "#5aa9e6", skyBottom: "#cfe8f7", sun: "#fffbe6", haze: "#e6f2fa", far: "#9fc3d9", near: "#5f8f6e", ground: "#6b7280" };
export const NIGHT: Palette = { skyTop: "#0b1030", skyBottom: "#2a3470", sun: "#f5f3e6", haze: "#3a4686", far: "#2c3668", near: "#161d45", ground: "#1c2033" };

// Smooth 1D value noise for ridgelines.
const noise = (seed: string, x: number) => {
  const i = Math.floor(x), f = x - i;
  const a = random(`${seed}${i}`), b = random(`${seed}${i + 1}`);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};

export const Sky: React.FC<{ p: Palette; w: number; h: number; sunX?: number; sunY?: number; stars?: boolean }> = ({ p, w, h, sunX = 0.72, sunY = 0.3, stars }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${p.skyTop}, ${p.skyBottom} 78%)` }}>
      {stars && Array.from({ length: 80 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`st${i}`) * w, top: random(`sy${i}`) * h * 0.6, width: 2 + random(`ss${i}`) * 2, height: 2 + random(`ss${i}`) * 2, borderRadius: 2, background: "white", opacity: 0.35 + 0.65 * Math.abs(Math.sin(f / (12 + random(`sp${i}`) * 20) + i)) }} />
      ))}
      <div style={{ position: "absolute", left: sunX * w - 170, top: sunY * h - 170, width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${p.sun}cc 0%, ${p.sun}55 22%, transparent 62%)` }} />
      <div style={{ position: "absolute", left: sunX * w - 34, top: sunY * h - 34, width: 68, height: 68, borderRadius: "50%", background: p.sun, boxShadow: `0 0 60px ${p.sun}` }} />
      {[0, 1, 2].map((i) => {
        const cx = ((random(`cl${i}`) * w + f * (0.3 + i * 0.15)) % (w + 400)) - 200;
        return <div key={i} style={{ position: "absolute", left: cx, top: h * (0.12 + i * 0.09), width: 240 + i * 60, height: 34, borderRadius: 30, background: "white", opacity: 0.18 + i * 0.05, filter: "blur(6px)" }} />;
      })}
    </AbsoluteFill>
  );
};

// A ridgeline layer. depth 0 = far (pale, hazy, slow), 1 = near (dark, fast).
export const Ridge: React.FC<{ p: Palette; w: number; h: number; depth: number; base: number; amp: number; speed: number; seed: string; trees?: boolean }> = ({ p, w, h, depth, base, amp, speed, seed, trees }) => {
  const f = useCurrentFrame();
  const off = (f * speed) / 60;
  const col = mix(p.far, p.near, depth);
  const pts: string[] = [];
  const step = 12;
  for (let x = 0; x <= w + step; x += step) {
    const n = noise(seed, x / 140 + off) * 0.7 + noise(seed + "b", x / 50 + off * 2.2) * 0.3;
    pts.push(`${x},${base - n * amp}`);
  }
  const tree = (x: number, y: number, s: number, k: number) => (
    <g key={k} transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-2} y={-6} width={4} height={10} fill={mix(col, "#000000", 0.35)} />
      <polygon points="0,-46 -14,-10 14,-10" fill={mix(col, "#000000", 0.18)} />
      <polygon points="0,-60 -11,-28 11,-28" fill={mix(col, "#000000", 0.12)} />
    </g>
  );
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`hz${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} />
          <stop offset="100%" stopColor={mix(col, p.haze, 0.35 * (1 - depth))} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w + step},${h}`} fill={`url(#hz${seed})`} />
      {trees && Array.from({ length: 22 }, (_, i) => {
        const gx = ((i * 57 - f * speed * 1.1) % (w + 120) + w + 120) % (w + 120) - 60;
        const n = noise(seed, gx / 140 + off) * 0.7 + noise(seed + "b", gx / 50 + off * 2.2) * 0.3;
        return tree(gx, base - n * amp + 4, 0.6 + random(`${seed}t${i}`) * 0.5, i);
      })}
      <rect x={0} y={0} width={w} height={h} fill={p.haze} opacity={0.18 * (1 - depth)} />
    </svg>
  );
};

// Road with scrolling lane dashes and roadside poles (the nearest layer).
export const Road: React.FC<{ p: Palette; w: number; h: number; top: number; speed: number; poles?: boolean }> = ({ p, w, h, top, speed, poles = true }) => {
  const f = useCurrentFrame();
  const sh = f * speed;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <rect x={0} y={top} width={w} height={h - top} fill={p.ground} />
      <rect x={0} y={top} width={w} height={6} fill={mix(p.ground, "#ffffff", 0.25)} />
      {Array.from({ length: 10 }, (_, i) => {
        const x = ((i * 150 - sh) % 1500 + 1500) % 1500 - 150;
        return <rect key={i} x={x} y={top + (h - top) * 0.55} width={80} height={8} rx={4} fill="#f5f5f4" opacity={0.85} />;
      })}
      {poles && Array.from({ length: 4 }, (_, i) => {
        const x = ((i * 380 - sh * 0.8) % 1520 + 1520) % 1520 - 100;
        return (
          <g key={i}>
            <rect x={x} y={top - 170} width={6} height={172} fill="#2b2b33" />
            <rect x={x - 26} y={top - 164} width={58} height={5} fill="#2b2b33" />
          </g>
        );
      })}
    </svg>
  );
};

// Articulated cyclist: spinning spoked wheels, rotating crank, two-bone legs following the pedals.
export const Cyclist: React.FC<{ x: number; y: number; scale?: number; cadence?: number; jersey?: string; lean?: number; skin?: string }> = ({ x, y, scale = 1, cadence = 1, jersey = "#e4572e", lean = 0, skin = "#c68a5e" }) => {
  const f = useCurrentFrame();
  const R = 62;
  const back = { x: -95, y: 0 }, front = { x: 95, y: 0 }, crank = { x: -8, y: -8 };
  const seat = { x: -40, y: -118 }, bar = { x: 70, y: -122 };
  const ang = (f / 30) * Math.PI * 2 * 1.1 * cadence;
  const leg = (phase: number, near: boolean) => {
    const pd = { x: crank.x + Math.cos(ang + phase) * 26, y: crank.y + Math.sin(ang + phase) * 26 };
    const hip = { x: seat.x + 6, y: seat.y - 6 };
    const L1 = 78, L2 = 76;
    const dx = pd.x - hip.x, dy = pd.y - hip.y;
    const d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    const b = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
    const knee = { x: hip.x + Math.cos(a - b) * L1, y: hip.y + Math.sin(a - b) * L1 };
    const c = near ? "#1f2937" : "#111827";
    return (
      <g opacity={near ? 1 : 0.8}>
        <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={c} strokeWidth={17} strokeLinecap="round" />
        <line x1={knee.x} y1={knee.y} x2={pd.x} y2={pd.y} stroke={skin} strokeWidth={12} strokeLinecap="round" />
        <rect x={pd.x - 14} y={pd.y - 4} width={28} height={8} rx={3} fill="#f5f5f4" />
      </g>
    );
  };
  const wheel = (cx: number, k: string) => (
    <g key={k} transform={`translate(${cx},0)`}>
      <circle r={R} fill="none" stroke="#111" strokeWidth={9} />
      <circle r={R - 7} fill="none" stroke="#9ca3af" strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => {
        const t = ang * 1.6 + (i * Math.PI) / 6;
        return <line key={i} x1={0} y1={0} x2={Math.cos(t) * (R - 7)} y2={Math.sin(t) * (R - 7)} stroke="#d1d5db" strokeWidth={1.4} />;
      })}
      <circle r={7} fill="#6b7280" />
    </g>
  );
  return (
    <svg width={420} height={320} viewBox="-190 -270 420 320" style={{ position: "absolute", left: x - 190 * scale, top: y - 270 * scale, width: 420 * scale, height: 320 * scale, overflow: "visible" }}>
      <ellipse cx={0} cy={R + 6} rx={170} ry={10} fill="#000" opacity={0.25} />
      <g transform={`translate(0,0) rotate(${lean})`}>
        {leg(Math.PI, false)}
        {wheel(back.x, "b")}
        {wheel(front.x, "f")}
        <g stroke="#e5e7eb" strokeWidth={7} strokeLinecap="round" fill="none">
          <polyline points={`${back.x},0 ${crank.x},${crank.y} ${seat.x},${seat.y + 22} ${back.x},0`} />
          <polyline points={`${crank.x},${crank.y} ${bar.x - 10},${bar.y + 26} ${seat.x},${seat.y + 22}`} />
          <line x1={bar.x - 10} y1={bar.y + 26} x2={front.x} y2={0} />
          <line x1={bar.x - 10} y1={bar.y + 26} x2={bar.x} y2={bar.y} />
        </g>
        <path d={`M${bar.x},${bar.y} q16,-2 18,12`} stroke="#111" strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={seat.x - 20} y={seat.y + 12} width={36} height={8} rx={4} fill="#111" />
        <circle r={14} cx={crank.x} cy={crank.y} fill="#374151" />
        {/* torso, arm, head */}
        <path d={`M${seat.x + 4},${seat.y - 4} Q${seat.x + 40},${seat.y - 70} ${bar.x - 18},${bar.y - 64}`} stroke={jersey} strokeWidth={34} strokeLinecap="round" fill="none" />
        <path d={`M${bar.x - 22},${bar.y - 60} L${bar.x - 6},${bar.y - 22} L${bar.x + 6},${bar.y - 2}`} stroke={skin} strokeWidth={11} strokeLinecap="round" fill="none" />
        <path d={`M${bar.x - 26},${bar.y - 62} L${bar.x - 12},${bar.y - 28}`} stroke={jersey} strokeWidth={15} strokeLinecap="round" />
        <circle cx={bar.x - 6} cy={bar.y - 92} r={20} fill={skin} />
        <path d={`M${bar.x - 30},${bar.y - 96} Q${bar.x - 6},${bar.y - 130} ${bar.x + 18},${bar.y - 98} Z`} fill="#f5f5f4" stroke="#9ca3af" strokeWidth={2} />
        {leg(0, true)}
      </g>
    </svg>
  );
};

// Falling particles (snow / petals / dust) in front of or behind a layer.
export const Particles: React.FC<{ w: number; h: number; n?: number; color?: string; size?: number; speed?: number; seed?: string }> = ({ w, h, n = 60, color = "white", size = 5, speed = 1.2, seed = "pt" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const y = ((random(`${seed}y${i}`) * h + f * speed * (0.6 + random(`${seed}v${i}`))) % (h + 20)) - 10;
        const x = random(`${seed}x${i}`) * w + Math.sin(f / 20 + i) * 12;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size, background: color, opacity: 0.8 }} />;
      })}
    </AbsoluteFill>
  );
};

// Demo scene: a cyclist riding through a dusk landscape with depth.
export const RideWorld: React.FC<{ w?: number; h?: number; p?: Palette }> = ({ w = 1000, h = 560, p = DUSK }) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 4) * 1.5;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky p={p} w={w} h={h} />
      <Ridge p={p} w={w} h={h} depth={0} base={h * 0.52} amp={190} speed={0.25} seed="m1" />
      <Ridge p={p} w={w} h={h} depth={0.35} base={h * 0.62} amp={110} speed={0.7} seed="m3" />
      <Ridge p={p} w={w} h={h} depth={0.7} base={h * 0.68} amp={50} speed={1.6} seed="m2" trees />
      <Road p={p} w={w} h={h} top={h * 0.7} speed={9} />
      <Cyclist x={w * 0.46} y={h * 0.8 + bob} scale={0.82} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.1, background: `linear-gradient(transparent, ${p.ground})`, opacity: interpolate(f, [0, 1], [1, 1], cl) }} />
    </AbsoluteFill>
  );
};
