import { interpolate, useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, useSpring } from "./common";

const PAIRS: [string, string][] = [[L.blue, L.teal], [L.violet, L.blue], [L.teal, L.green], [L.amber, L.rose], [L.green, L.teal], [L.rose, L.violet]];

// Zig-zag flow: a glowing packet travels node to node as each stage is narrated.
export const Pipeline: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const nodes: [string, string, string][] = data.nodes;
  const n = nodes.length;
  const rowH = Math.min(200, 620 / Math.max(n - 1, 1));
  const pos = (i: number) => ({ x: 150, y: 540 + i * rowH });
  const seg = nodes.reduce((a, _, i) => (f >= cue(i) ? i : a), 0);
  const t = interpolate(f, [cue(seg), cue(seg) + 16], [0, 1], clamp);
  const from = pos(Math.max(seg - 1, 0));
  const to = pos(seg);
  const packet = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  return (
    <>
      <Heading kicker="HOW IT FLOWS">{data.heading}</Heading>
      <svg width={1080} height={1300} style={{ position: "absolute", left: 0, top: 0 }}>
        {nodes.slice(1).map((_, i) => {
          const a = pos(i), b = pos(i + 1);
          const lit = f >= cue(i + 1);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? L.amber : "rgba(255,255,255,0.15)"} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-f * 1.5} />;
        })}
        {f >= cue(0) && <circle cx={packet.x} cy={packet.y} r={20} fill={L.amber} style={{ filter: `drop-shadow(0 0 16px ${L.amber})` }} />}
      </svg>
      {nodes.map(([icon, label, sub], i) => {
        const s = useSpring(cue(i), 12);
        const p = pos(i);
        const left = true;
        return (
          <div key={label} style={{ position: "absolute", top: p.y - 60, left: p.x - 60, right: 60, display: "flex", alignItems: "center", gap: 30, opacity: interpolate(s, [0, 1], [0.3, 1]) }}>
            <div style={{ transform: `scale(${0.8 + 0.2 * s})` }}>
              <IconTile name={icon} size={120} from={PAIRS[i % 6][0]} to={PAIRS[i % 6][1]} glow={seg === i ? 1 : 0.25} />
            </div>
            <div style={{ textAlign: left ? "left" : "right", flex: 1, transform: `translateX(${(1 - s) * 60}px)` }}>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 44, color: seg === i ? L.amber : L.text }}>{label}</div>
              <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 30, color: L.muted, lineHeight: 1.25 }}>{sub}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};
