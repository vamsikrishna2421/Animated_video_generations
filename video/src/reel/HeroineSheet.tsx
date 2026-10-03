import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { Stage } from "./FumbleMaking";
import { Fumble, idle, shrug, walk, wave } from "./Fumble";

// Model sheet: the heroine next to Mr. Fumble, plus a few poses.
export const HeroineSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Fonts />
      <Stage tint="#f3d9e4" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(330,1660) scale(1.05)"><Fumble f={f} p={idle(f)} look="heroine" /></g>
        <g transform="translate(780,1660) scale(1.05)"><Fumble f={f} p={wave(f + 30)} /></g>
      </svg>
    </AbsoluteFill>
  );
};
export const HeroinePoses: React.FC = () => {
  const f = useCurrentFrame();
  const P = [idle(f), wave(f + 30), shrug(f + 30), walk(f)];
  return (
    <AbsoluteFill style={{ background: "#fdf2f6" }}>
      <svg width={1080} height={1920}>
        {P.map((p, i) => <g key={i} transform={`translate(${170 + (i % 2) * 520},${880 + Math.floor(i / 2) * 900}) scale(0.72)`}><Fumble f={f} p={p} look="heroine" /></g>)}
      </svg>
    </AbsoluteFill>
  );
};
