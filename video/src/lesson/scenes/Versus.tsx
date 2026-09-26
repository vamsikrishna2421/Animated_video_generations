import { interpolate, useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const Side: React.FC<{ s: any; at: number; big: boolean; from: string; to: string }> = ({ s, at, big, from, to }) => {
  const sp = useSpring(at, 12);
  return (
    <Panel
      style={{
        flex: 1,
        padding: "36px 26px",
        textAlign: "center",
        opacity: sp,
        transform: `translateY(${(1 - sp) * 80}px) scale(${big ? 1.04 : 0.96})`,
        borderColor: big ? from : L.border,
        boxShadow: big ? `0 0 60px ${from}55` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <IconTile name={s.icon} size={big ? 170 : 120} from={from} to={to} glow={big ? 1 : 0.3} />
      </div>
      <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 40, color: L.text, marginTop: 24 }}>{s.title}</div>
      <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: big ? 54 : 40, color: from, marginTop: 18, lineHeight: 1.1 }}>{s.stat}</div>
      <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 30, color: L.muted, marginTop: 12 }}>{s.label}</div>
    </Panel>
  );
};

export const Versus: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const rightBig = f >= cue(1);
  return (
    <>
      <Heading kicker="SCALE MATTERS">{data.heading}</Heading>
      <div style={{ position: "absolute", top: 500, left: 60, right: 60, display: "flex", gap: 30, alignItems: "center" }}>
        <Side s={data.left} at={cue(0)} big={false} from={L.muted} to="#475569" />
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 48, color: L.amber, opacity: interpolate(f, [cue(1) - 5, cue(1)], [0, 1], clamp) }}>vs</div>
        <Side s={data.right} at={cue(1)} big={rightBig} from={L.amber} to={L.rose} />
      </div>
      {data.bars && (
      <div style={{ position: "absolute", top: 1010, left: 70, right: 70, opacity: interpolate(f, [cue(1), cue(1) + 10], [0, 1], clamp) }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: L.muted, marginBottom: 14 }}>{data.bars.label}</div>
        {[[data.bars.left, data.bars.leftValue, L.muted], [data.bars.right, 1, L.amber]].map(([label, w, c]) => (
          <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
            <div style={{ width: 110, fontFamily: L.font, fontWeight: 800, fontSize: 30, color: c as string }}>{label as string}</div>
            <div style={{ flex: 1, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.07)" }}>
              <div style={{ width: `${Math.max(1.5, (w as number) * 100 * interpolate(f, [cue(1) + 8, cue(1) + 50], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) }))}%`, height: "100%", borderRadius: 10, background: c as string, boxShadow: c === L.amber ? `0 0 24px ${L.amber}` : "none" }} />
            </div>
          </div>
        ))}
      </div>
      )}
    </>
  );
};
