import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { B, cl, easeInOut } from "./tokens";

// Cut-point overlays. Place one so its middle lands exactly on the cut (and on a beat).

/** Three brand-colour diagonal bars sweep across; fully covered at `at`, gone by at + dur/2. */
export const Wipe: React.FC<{ at: number; dur?: number; colors?: string[] }> = ({ at, dur = 16, colors = [B.blue, B.violet, B.amber] }) => {
  const f = useCurrentFrame();
  if (f < at - dur / 2 - 4 || f > at + dur / 2 + 6) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {colors.map((c, i) => {
        const t = interpolate(f, [at - dur / 2 + i * 2, at + dur / 2 + i * 2], [0, 1], { ...cl, easing: easeInOut });
        return <div key={i} style={{ position: "absolute", top: -400, bottom: -400, left: "-10%", width: "120%", background: c, transform: `translateX(${-110 + t * 220}%) skewX(-18deg)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Hard white flash on the cut (3-6 frames), the classic beat hit. */
export const Flash: React.FC<{ at: number; len?: number; color?: string }> = ({ at, len = 6, color = B.white }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + len], [0, 0.9, 0], cl);
  return o > 0 ? <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} /> : null;
};

/** Scale punch for a whole scene on a beat: wrap children. */
export const Punch: React.FC<{ at: number[]; amount?: number; children: React.ReactNode }> = ({ at, amount = 0.05, children }) => {
  const f = useCurrentFrame();
  const s = 1 + at.reduce((acc, t) => acc + interpolate(f, [t, t + 2, t + 10], [0, amount, 0], cl), 0);
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};
