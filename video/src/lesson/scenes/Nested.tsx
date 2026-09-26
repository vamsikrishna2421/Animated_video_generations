import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

export const Nested: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const rings: [string, string][] = data.rings;
  const cx = 540, cy = 760, R = 370;
  const take = useSpring(cue(4), 12);
  return (
    <>
      <Heading kicker="THE BIG PICTURE">How they fit together</Heading>
      <svg width={1080} height={1250} style={{ position: "absolute", left: 0, top: 0 }}>
        {rings.map(([label, color], i) => {
          const s = interpolate(f, [cue(i), cue(i) + 14], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const r = R * (1 - i * 0.22);
          const ry = r * 0.95;
          const y = cy + (R - r) * 0.55; // rings nest toward the bottom so labels stack on top
          const pulse = i === rings.length - 1 ? 1 + 0.03 * Math.sin(f / 6) : 1;
          return (
            <g key={label} opacity={s} transform={`translate(${cx} ${y}) scale(${s * pulse}) translate(${-cx} ${-y})`}>
              <ellipse cx={cx} cy={y} rx={r} ry={ry} fill={`${color}30`} stroke={color} strokeWidth={5} style={{ filter: `drop-shadow(0 0 18px ${color}88)` }} />
              <text x={cx} y={y - ry + (i === rings.length - 1 ? ry + 14 : 58)} textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={i === rings.length - 1 ? 44 : 40}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <Panel style={{ position: "absolute", top: 1105, left: 60, right: 60, padding: "18px 28px", textAlign: "center", opacity: take, transform: `translateY(${(1 - take) * 30}px)`, borderColor: L.amber }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 38, color: L.text }}>{data.takeaway}</div>
      </Panel>
    </>
  );
};
