import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel } from "./common";

// A temperature slider that moves between settings; the sample output changes with it.
export const Dial: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const settings: [number, string, string][] = data.settings; // [0..1 value, label, output]
  const idx = settings.reduce((a, _, i) => (f >= cue(i) ? i : a), 0);
  const val = interpolate(
    f,
    settings.flatMap((_, i) => [cue(i), cue(i) + 14]),
    settings.flatMap(([v], i) => [i === 0 ? v : settings[i - 1][0], v]),
    clamp
  );
  const hue = interpolate(val, [0, 0.5, 1], [200, 45, 350]);
  const color = `hsl(${hue} 90% 60%)`;
  return (
    <>
      <Heading kicker={data.kicker ?? "THE CREATIVITY DIAL"}>{data.heading}</Heading>
      <Panel style={{ position: "absolute", top: 480, left: 60, right: 60, padding: "24px 30px" }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: L.muted }}>PROMPT</div>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 38, color: L.text, marginTop: 6 }}>{data.prompt}</div>
      </Panel>
      <div style={{ position: "absolute", top: 690, left: 90, right: 90 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: L.font, fontWeight: 800, fontSize: 28, color: L.muted }}>
          <span>0 · precise</span>
          <span>1 · creative</span>
        </div>
        <div style={{ position: "relative", height: 24, borderRadius: 12, marginTop: 20, background: "linear-gradient(90deg, hsl(200 90% 60%), hsl(45 90% 60%), hsl(350 90% 60%))" }}>
          <div style={{ position: "absolute", left: `calc(${val * 100}% - 34px)`, top: -22, width: 68, height: 68, borderRadius: 34, background: "white", border: `8px solid ${color}`, boxShadow: `0 0 30px ${color}` }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 40, fontFamily: L.font, fontWeight: 800, fontSize: 64, color }}>
          temperature = {val.toFixed(1)}
        </div>
        <div style={{ textAlign: "center", fontFamily: L.font, fontWeight: 700, fontSize: 34, color: L.muted }}>{settings[idx][1]}</div>
      </div>
      <Panel style={{ position: "absolute", top: 1000, left: 60, right: 60, padding: "24px 30px", borderColor: color, minHeight: 150 }}>
        <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 36, color: L.text, lineHeight: 1.3, opacity: interpolate(f, [cue(idx), cue(idx) + 12], [0, 1], clamp) }}>{settings[idx][2]}</div>
      </Panel>
    </>
  );
};
