import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, useSpring } from "./common";

const GROUP = [L.violet, L.teal, L.amber, L.green, L.rose];
const X0 = 70, Y0 = 470, W = 940, H = 680;
const px = (x: number) => X0 + x * W;
const py = (y: number) => Y0 + y * H;

// Words plotted as points by meaning; a query lands and links to its nearest neighbours.
export const EmbedMap: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const pts: [string, number, number, number][] = data.points; // [word, x 0..1, y 0..1, group]
  const [qw, qx, qy] = data.query as [string, number, number];
  const near: string[] = data.neighbors;
  const q = useSpring(cue(1), 10);
  const link = interpolate(f, [cue(2), cue(2) + 16], [0, 1], clamp);
  return (
    <>
      <Heading kicker="MEANING AS COORDINATES">{data.heading}</Heading>
      <svg width={1080} height={1250} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={X0} y={Y0} width={W} height={H} rx={30} fill="rgba(255,255,255,0.04)" stroke={L.border} strokeWidth={2} />
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g}>
            <line x1={px(g)} y1={Y0} x2={px(g)} y2={Y0 + H} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
            <line x1={X0} y1={py(g)} x2={X0 + W} y2={py(g)} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
          </g>
        ))}
        {pts
          .filter(([w]) => near.includes(w))
          .map(([w, x, y]) => (
            <line key={`l${w}`} x1={px(qx)} y1={py(qy)} x2={px(qx) + (px(x) - px(qx)) * link} y2={py(qy) + (py(y) - py(qy)) * link} stroke="white" strokeWidth={4} strokeDasharray="10 8" opacity={0.8} />
          ))}
        {pts.map(([w, x, y, g], i) => {
          const s = interpolate(f, [cue(0) + i * 3, cue(0) + i * 3 + 10], [0, 1], clamp);
          const hot = link > 0.5 && near.includes(w);
          return (
            <g key={w} opacity={s} transform={`translate(${px(x)} ${py(y)}) scale(${s * (hot ? 1.25 : 1)})`}>
              <circle r={16} fill={GROUP[g % GROUP.length]} style={{ filter: `drop-shadow(0 0 10px ${GROUP[g % GROUP.length]})` }} />
              <text y={-26} textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={34}>{w}</text>
            </g>
          );
        })}
        <g opacity={q} transform={`translate(${px(qx)} ${py(qy)}) scale(${q})`}>
          <circle r={34} fill="none" stroke="white" strokeWidth={5} opacity={0.6 + 0.4 * Math.sin(f / 5)} />
          <circle r={16} fill="white" />
          <rect x={-10 - qw.length * 10} y={30} width={20 + qw.length * 20} height={50} rx={14} fill="white" />
          <text y={66} textAnchor="middle" fill="#0A0F24" fontFamily="Inter, sans-serif" fontWeight={800} fontSize={32}>{qw}</text>
        </g>
      </svg>
      <div style={{ position: "absolute", top: 1170, left: 60, right: 60, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 34, color: L.text, opacity: link }}>
        {data.note}
      </div>
    </>
  );
};
