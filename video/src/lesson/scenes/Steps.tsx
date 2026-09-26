import { interpolate, useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const PAIRS: [string, string][] = [[L.violet, L.blue], [L.blue, L.teal], [L.amber, L.rose], [L.teal, L.green]];

// Vertical numbered process with a connector that fills as each step is spoken.
export const Steps: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const steps: [string, string, string][] = data.steps;
  const gap = Math.min(250, 720 / steps.length);
  return (
    <>
      <Heading kicker="STEP BY STEP">{data.heading}</Heading>
      <div style={{ position: "absolute", left: 130, top: 560, width: 8, height: gap * (steps.length - 1), borderRadius: 4, background: "rgba(255,255,255,0.12)" }}>
        <div
          style={{
            width: "100%",
            borderRadius: 4,
            background: `linear-gradient(${L.violet}, ${L.amber})`,
            height: `${interpolate(f, steps.map((_, i) => cue(i)), steps.map((_, i) => (i / Math.max(steps.length - 1, 1)) * 100), clamp)}%`,
          }}
        />
      </div>
      {steps.map(([icon, title, sub], i) => {
        const s = useSpring(cue(i), 12);
        const active = f >= cue(i) && (i === steps.length - 1 || f < cue(i + 1));
        return (
          <div key={title} style={{ position: "absolute", top: 490 + i * gap, left: 70, right: 60, display: "flex", gap: 30, alignItems: "center", opacity: interpolate(s, [0, 1], [0.25, 1]) }}>
            <div style={{ transform: `scale(${0.8 + 0.2 * s})` }}>
              <IconTile name={icon} size={130} from={PAIRS[i % 4][0]} to={PAIRS[i % 4][1]} glow={active ? 1 : 0.2} />
            </div>
            <Panel style={{ flex: 1, padding: "22px 30px", borderColor: active ? PAIRS[i % 4][0] : L.border, transform: `translateX(${(1 - s) * 80}px)` }}>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: PAIRS[i % 4][0] }}>STEP {i + 1}</div>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 46, color: L.text }}>{title}</div>
              <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 29, color: L.muted, marginTop: 4, lineHeight: 1.3 }}>{sub}</div>
            </Panel>
          </div>
        );
      })}
    </>
  );
};
