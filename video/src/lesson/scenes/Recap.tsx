import { useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, gradText } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const COLORS = [L.violet, L.blue, L.teal, L.amber];

export const Recap: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const n = data.points.length;
  const next = useSpring(cue(n), 11);
  return (
    <>
      <Heading kicker={data.kicker ?? "RECAP"}>In {n} lines</Heading>
      {data.points.map(([k, v]: [string, string], i: number) => {
        const s = useSpring(cue(i), 12);
        return (
          <div key={k} style={{ position: "absolute", top: 480 + i * 135, left: 70, right: 70, display: "flex", alignItems: "center", gap: 26, opacity: s, transform: `translateX(${(1 - s) * -300}px)` }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: COLORS[i], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="Check" size={42} stroke={3.5} />
            </div>
            <div style={{ fontFamily: L.font, fontSize: 44, color: L.text, fontWeight: 600 }}>
              <span style={{ fontWeight: 800, color: COLORS[i] }}>{k}</span> · {v}
            </div>
          </div>
        );
      })}
      <Panel
        style={{
          position: "absolute",
          top: 1030,
          left: 70,
          right: 70,
          padding: "26px 34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: next,
          transform: `translateY(${(1 - next) * 80}px)`,
          borderColor: L.amber,
        }}
      >
        <div>
          <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: L.amber }}>NEXT EPISODE</div>
          <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 44, color: L.text, marginTop: 4 }}>{data.next}</div>
        </div>
        <div
          style={{
            fontFamily: L.font,
            fontWeight: 800,
            fontSize: 32,
            padding: "16px 28px",
            borderRadius: 40,
            background: `linear-gradient(90deg, ${L.violet}, ${L.teal})`,
            color: "white",
            transform: `scale(${1 + 0.05 * Math.sin(f / 5)})`,
          }}
        >
          Follow
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 1190, left: 0, right: 0, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 34, opacity: next, ...gradText(L.amber, L.rose) }}>
        {data.handle}
      </div>
    </>
  );
};
