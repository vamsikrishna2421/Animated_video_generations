import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { browWiggle, doubleTake, FPose, Fumble, idle, innocent, peek, pout, shock, smugGrin, stiffWalk, tiptoe } from "./Fumble";

// Model sheet: every mannerism side by side (used to check the rig).
const POSES: [string, (t: number) => FPose][] = [
  ["idle", idle], ["stiff walk", (t) => stiffWalk(t)], ["tiptoe", (t) => tiptoe(t)], ["brow wiggle", browWiggle], ["double-take", (t) => doubleTake(t + 36)],
  ["smug grin", smugGrin], ["innocent", innocent], ["peek", (t) => peek(t + 20)], ["shock", (t) => shock(t + 6)], ["pout", pout],
];
export const FumbleSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#eef2f7" }}>
      <Fonts />
      <svg width={1080} height={1920}>
        {POSES.map(([name, fn], i) => (
          <g key={name} transform={`translate(${200 + (i % 3) * 340},${470 + Math.floor(i / 3) * 470})`}>
            <g transform="scale(0.42)"><Fumble f={f} p={fn(f)} /></g>
            <text x={0} y={60} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#0f172a">{name}</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
