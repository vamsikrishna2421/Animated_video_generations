import { AbsoluteFill, useCurrentFrame } from "remotion";
import { hook } from "./HookStep";
import { exaggerate, idle } from "./Fumble";
import { SolHero, SolHeroine } from "./SolHeroine";

export const SolSheet: React.FC = () => {
  const f = useCurrentFrame();
  const P = [idle(f), exaggerate(hook(64.71)), exaggerate(hook(65.4)), exaggerate(hook(66.19)), exaggerate(hook(66.9)), exaggerate(hook(67.3))];
  return (
    <AbsoluteFill style={{ background: "#2a1d3e" }}>
      <svg width={1080} height={1920}>
        {P.map((p, i) => <g key={i} transform={`translate(${190 + (i % 3) * 350},${880 + Math.floor(i / 3) * 900}) scale(0.62)`}>{i % 2 ? <SolHero f={f} p={p} /> : <SolHeroine f={f} p={p} />}</g>)}
      </svg>
    </AbsoluteFill>
  );
};
