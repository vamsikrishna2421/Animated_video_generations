import { interpolate, useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const PAIRS: [string, string][] = [[L.violet, L.teal], [L.amber, L.rose], [L.blue, L.green]];

export const Examples: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const items: [string, string, string][] = data.items;
  const active = items.reduce((a, _, i) => (f >= cue(i) ? i : a), -1);
  return (
    <>
      <Heading kicker={data.kicker ?? "REAL WORLD"}>{data.heading}</Heading>
      {items.map(([icon, title, sub], i) => {
        const s = useSpring(cue(i), 12);
        const on = i === active;
        return (
          <Panel
            key={title}
            style={{
              position: "absolute",
              top: 520 + i * 230,
              left: 60,
              right: 60,
              height: 200,
              padding: "0 36px",
              display: "flex",
              alignItems: "center",
              gap: 34,
              opacity: s * (on || active > i ? 1 : 0.9),
              transform: `translateX(${(1 - s) * 900}px) scale(${on ? 1.03 : 0.97})`,
              borderColor: on ? PAIRS[i % 3][0] : L.border,
              boxShadow: on ? `0 0 50px ${PAIRS[i % 3][0]}55` : "none",
            }}
          >
            <IconTile name={icon} size={130} from={PAIRS[i % 3][0]} to={PAIRS[i % 3][1]} glow={on ? 1 : 0.3} />
            <div>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 50, color: L.text }}>{title}</div>
              <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 32, color: L.muted, marginTop: 6 }}>{sub}</div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontFamily: L.font,
                fontWeight: 800,
                fontSize: 64,
                color: PAIRS[i % 3][0],
                opacity: interpolate(f, [cue(i) + 6, cue(i) + 14], [0, 0.5], clamp),
              }}
            >
              {i + 1}
            </div>
          </Panel>
        );
      })}
    </>
  );
};
