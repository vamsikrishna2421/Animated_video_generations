import { interpolate, useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps, clamp, gradText } from "../theme";
import { Panel, useSpring } from "./common";

export const Definition: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const big = useSpring(0, 11);
  const def: string = data.definition;
  const typed = Math.floor(interpolate(f, [cue(0), cue(0) + def.length * 1.1], [0, def.length], clamp));
  return (
    <>
      <div style={{ position: "absolute", top: 280, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: Math.min(260, 1500 / Math.max(data.short.length, 1)), lineHeight: 1, transform: `scale(${big})`, ...gradText(L.violet, L.teal) }}>
          {data.short}
        </div>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 50, color: L.muted, opacity: big }}>{data.term}</div>
      </div>
      <Panel style={{ position: "absolute", top: 640, left: 70, right: 70, padding: "34px 40px", opacity: interpolate(f, [cue(0) - 8, cue(0)], [0, 1], clamp) }}>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: L.text, minHeight: 120 }}>
          {def.slice(0, typed)}
          <span style={{ opacity: f % 20 < 10 && typed < def.length ? 1 : 0, color: L.amber }}>|</span>
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 900, left: 70, right: 70, display: "flex", gap: 24 }}>
        {data.chips.map(([icon, label]: [string, string], i: number) => {
          const s = useSpring(cue(i + 1), 11);
          return (
            <div key={label} style={{ flex: 1, textAlign: "center", transform: `scale(${s})`, opacity: s }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <IconTile name={icon} size={130} from={[L.violet, L.blue, L.amber][i]} to={[L.teal, L.teal, L.rose][i]} />
              </div>
              <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 32, color: L.text, marginTop: 16 }}>{label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};
