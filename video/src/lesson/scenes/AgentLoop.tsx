import { interpolate, useCurrentFrame } from "remotion";
import { Icon, IconTile } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { useSpring } from "./common";

const COL = [L.violet, L.teal, L.amber, L.green];

// Agent loop: stages around a ring, a highlight orbits; the activity log fills on cue.
export const AgentLoop: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const stages: [string, string][] = data.stages;
  const log: string[] = data.log;
  const cx = 540, cy = 730, R = 200;
  const n = stages.length;
  const spin = f >= cue(0) ? ((f - cue(0)) / 30) % n : 0;
  const cur = Math.floor(spin);
  const goal = useSpring(0, 13);
  return (
    <>
      <div style={{ position: "absolute", top: 280, left: 60, right: 60, opacity: goal }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 28, letterSpacing: 5, color: L.teal }}>{data.goalLabel ?? "GOAL"}</div>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 46, color: L.text, lineHeight: 1.15 }}>{data.goal}</div>
      </div>
      <svg width={1080} height={1000} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} strokeDasharray="4 16" />
        {f >= cue(0) && (
          <circle
            cx={cx + R * Math.cos((spin / n) * 2 * Math.PI - Math.PI / 2)}
            cy={cy + R * Math.sin((spin / n) * 2 * Math.PI - Math.PI / 2)}
            r={18}
            fill={L.amber}
            style={{ filter: `drop-shadow(0 0 16px ${L.amber})` }}
          />
        )}
      </svg>
      <div style={{ position: "absolute", left: cx - 80, top: cy - 80, width: 160, height: 160, borderRadius: 80, background: "rgba(255,255,255,0.08)", border: `3px solid ${L.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="Bot" size={90} color={L.text} />
      </div>
      {stages.map(([icon, label], i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const on = f >= cue(0) && cur === i;
        return (
          <div key={label} style={{ position: "absolute", left: cx + R * Math.cos(a) - 90, top: cy + R * Math.sin(a) - 70, width: 180, textAlign: "center", transform: `scale(${on ? 1.12 : 1})` }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <IconTile name={icon} size={104} from={COL[i % 4]} to={COL[(i + 1) % 4]} glow={on ? 1 : 0.2} />
            </div>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 32, color: on ? COL[i % 4] : L.text, marginTop: 8, textShadow: "0 2px 10px #000" }}>{label}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 1030, left: 60, right: 60 }}>
        {log.map((l, i) => (
          <div key={i} style={{ fontFamily: L.mono, fontSize: 28, color: i === log.length - 1 ? L.green : L.text, marginBottom: 8, opacity: interpolate(f, [cue(i + 1), cue(i + 1) + 8], [0, 1], clamp) }}>
            <span style={{ color: L.amber }}>{String(i + 1).padStart(2, "0")}</span> {l}
          </div>
        ))}
      </div>
    </>
  );
};
