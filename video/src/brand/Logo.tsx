import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Aurora, BrandFonts, Grain } from "./Base";
import { B, cl, F, pop, prog } from "./tokens";

// The AI Maastaaru mark: gradient squircle, "Ai" drawn as strokes, an amber spark for the A's crossbar,
// the i's dot as a glowing amber point, and a graduation cap on the A ("Maastaaru" = teacher).
export type MarkBuild = { box: number; a: number; i: number; spark: number; dot: number; cap: number; shine: number };
const DONE: MarkBuild = { box: 1, a: 1, i: 1, spark: 1, dot: 1, cap: 1, shine: 0 };

let uid = 0;
export const LogoMark: React.FC<{ size: number; build?: Partial<MarkBuild>; id?: string }> = ({ size, build = {}, id }) => {
  const b = { ...DONE, ...build };
  const k = id ?? `m${uid++}`;
  const star = "M0,-16 Q2,-2 16,0 Q2,2 0,16 Q-2,2 -16,0 Q-2,-2 0,-16 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`lg${k}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={B.blue} />
          <stop offset="1" stopColor={B.violet} />
        </linearGradient>
        <radialGradient id={`hl${k}`} cx="0.28" cy="0.18" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`cp${k}`}>
          <rect x="10" y="10" width="180" height="180" rx="56" />
        </clipPath>
      </defs>
      <g transform={`translate(100 100) scale(${b.box}) rotate(${(1 - b.box) * -24}) translate(-100 -100)`}>
        <rect x="10" y="16" width="180" height="180" rx="56" fill="#000" opacity={0.18} />
        <rect x="10" y="10" width="180" height="180" rx="56" fill={`url(#lg${k})`} />
        <rect x="10" y="10" width="180" height="180" rx="56" fill={`url(#hl${k})`} />
        <g clipPath={`url(#cp${k})`}>
          <rect x={-120 + b.shine * 360} y="-20" width="46" height="260" fill="#fff" opacity={b.shine > 0 && b.shine < 1 ? 0.35 : 0} transform="rotate(24 100 100)" />
        </g>
      </g>
      <path d="M 50 152 L 86 60 L 122 152" stroke="#fff" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - b.a} />
      <line x1="153" y1="98" x2="153" y2="152" stroke="#fff" strokeWidth="22" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - b.i} />
      {b.dot > 0 && (
        <g transform={`translate(153 66) scale(${b.dot})`}>
          <circle r="20" fill={B.amber} opacity={0.25} />
          <circle r="12.5" fill={B.amber} />
        </g>
      )}
      {b.spark > 0 && <path d={star} fill={B.amber} transform={`translate(86 121) rotate(${(1 - b.spark) * 120}) scale(${0.72 * b.spark})`} />}
      {b.cap > 0 && (
        <g transform={`translate(86 ${44 - (1 - b.cap) * 150}) rotate(${-14 - (1 - b.cap) * 50})`} opacity={Math.min(1, b.cap * 3)}>
          <path d="M -18 2 L 18 2 L 16 17 Q 0 23 -16 17 Z" fill={B.ink} />
          <polygon points="-48,0 0,-16 48,0 0,16" fill={B.ink} stroke="#26315e" strokeWidth="2" />
          <circle r="3.5" fill={B.amber} />
          <path d="M 0 0 Q 28 4 36 7 L 36 31" stroke={B.amber} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <rect x="32.5" y="29" width="7" height="12" rx="2" fill={B.amber} />
        </g>
      )}
    </svg>
  );
};

/** "AI Maastaaru" wordmark; letters rise in from `at` (local frame). */
export const Wordmark: React.FC<{ size: number; dark?: boolean; at?: number; f: number }> = ({ size, dark = true, at = 0, f }) => {
  const text = "AI Maastaaru";
  return (
    <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.03, lineHeight: 1, whiteSpace: "nowrap", display: "flex" }}>
      {text.split("").map((ch, i) => {
        const p = prog(f, at + i * 1.4, at + i * 1.4 + 12);
        const accent = i < 2;
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - p) * 0.6 * size}px)`, opacity: p, color: accent ? undefined : dark ? B.white : B.ink, background: accent ? B.grad : undefined, WebkitBackgroundClip: accent ? "text" : undefined, backgroundClip: accent ? "text" : undefined, WebkitTextFillColor: accent ? "transparent" : undefined, width: ch === " " ? size * 0.28 : undefined }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Mark build timing used by the sting (local frames). */
export const stingBuild = (f: number): MarkBuild => ({
  box: pop(f, 4, 11),
  a: prog(f, 8, 22),
  i: prog(f, 14, 24),
  dot: pop(f, 23, 9),
  spark: pop(f, 27, 10),
  cap: pop(f, 26, 9, 0.7, 200),
  shine: prog(f, 36, 56),
});

/**
 * 3 s sonic + visual logo: squircle pops, "Ai" draws, cap drops on the school bell, wordmark rises, tagline.
 * Use at the END of reels (hook first) or after the cold open on YouTube.
 */
export const LogoSting: React.FC<{ dark?: boolean; tagline?: string; cta?: string; sound?: boolean }> = ({ dark = true, tagline = "AI, explained simply.", cta, sound = true }) => {
  const f = useCurrentFrame();
  const up = prog(f, 40, 60);
  const markSize = 380 - up * 90;
  return (
    <AbsoluteFill>
      <BrandFonts />
      <Aurora dark={dark} intensity={0.9} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${-up * 190}px)` }}>
          <div style={{ width: markSize, height: markSize, margin: "0 auto" }}>
            <LogoMark size={markSize} build={stingBuild(f)} id="sting" />
          </div>
        </div>
        <div style={{ position: "absolute", top: "52%", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          {f >= 42 && <Wordmark size={110} dark={dark} at={42} f={f} />}
          <div style={{ fontFamily: F.inter, fontWeight: 600, fontSize: 44, color: dark ? "rgba(255,255,255,0.75)" : "rgba(10,15,36,0.65)", opacity: prog(f, 58, 72), transform: `translateY(${(1 - prog(f, 58, 72)) * 20}px)` }}>{tagline}</div>
          {cta && (
            <div style={{ marginTop: 18, transform: `scale(${pop(f, 66, 12)})`, fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: B.white, background: dark ? B.grad : B.ink, padding: "18px 44px", borderRadius: 60 }}>{cta}</div>
          )}
        </div>
      </AbsoluteFill>
      <Grain opacity={dark ? 0.07 : 0.05} />
      {sound && <Audio src={staticFile("brand/audio/brand_sting.wav")} volume={0.9} />}
    </AbsoluteFill>
  );
};

/** Corner watermark: small mark + handle, slides in at local frame `at`. */
export const LogoBug: React.FC<{ handle: string; dark?: boolean; at?: number; corner?: "tl" | "tr" | "bl" | "br" }> = ({ handle, dark = true, at = 0, corner = "tl" }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 14);
  const pos: React.CSSProperties = { [corner[0] === "t" ? "top" : "bottom"]: 60, [corner[1] === "l" ? "left" : "right"]: 50 };
  return (
    <div style={{ position: "absolute", ...pos, display: "flex", alignItems: "center", gap: 14, padding: "10px 26px 10px 10px", borderRadius: 60, background: dark ? "rgba(10,15,36,0.6)" : "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", transform: `translateX(${(1 - s) * (corner[1] === "l" ? -60 : 60)}px)`, opacity: interpolate(s, [0, 0.3], [0, 1], cl) }}>
      <LogoMark size={58} id={`bug${corner}`} />
      <span style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 28, color: dark ? B.white : B.ink }}>{handle}</span>
    </div>
  );
};

export const StingComp: React.FC<{ dark?: boolean; tagline?: string; cta?: string }> = (p) => (
  <Sequence>
    <LogoSting {...p} />
  </Sequence>
);
