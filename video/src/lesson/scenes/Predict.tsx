import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const BAR_COLORS = [L.green, L.teal, L.blue, L.muted];

// Next-word prediction: score candidates, pick one, append, repeat.
export const Predict: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opts: [string, number][] = data.options;
  const cont: string[] = data.continuation;
  const pick = cue(1);
  const loop = cue(2);
  const flown = spring({ frame: f - pick, fps, config: { damping: 14 } });
  const extra = Math.max(0, Math.min(cont.length, Math.floor((f - loop) / 9) + 1));
  const panel = useSpring(4, 15);
  return (
    <>
      <Heading kicker="THE ONE TRICK">Guess the next word</Heading>
      <Panel style={{ position: "absolute", top: 490, left: 60, right: 60, padding: "34px 38px", minHeight: 170, opacity: panel }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 54, lineHeight: 1.3, color: L.text }}>
          {data.prompt}{" "}
          {f >= pick ? (
            <span style={{ color: L.green, display: "inline-block", transform: `translateY(${(1 - flown) * 260}px) scale(${0.6 + 0.4 * flown})` }}>{opts[0][0]}</span>
          ) : (
            <span style={{ display: "inline-block", width: 140, borderBottom: `6px solid ${f % 24 < 12 ? L.amber : "transparent"}` }}>&nbsp;</span>
          )}
          {cont.slice(0, f >= loop ? extra : 0).map((w, i) => (
            <span key={i} style={{ color: i === extra - 1 ? L.amber : L.text }}> {w}</span>
          ))}
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 740, left: 60, right: 60 }}>
        {opts.map(([w, p], i) => {
          const grow = interpolate(f, [cue(0) + i * 5, cue(0) + i * 5 + 18], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const chosen = i === 0 && f >= pick;
          const dim = f >= pick && i !== 0;
          return (
            <div key={w} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26, opacity: (dim ? 0.35 : 1) * interpolate(f, [cue(0) - 6 + i * 5, cue(0) + i * 5], [0, 1], clamp) }}>
              <div style={{ width: 170, fontFamily: L.font, fontWeight: 800, fontSize: 44, color: chosen ? L.green : L.text, textAlign: "right" }}>{w}</div>
              <div style={{ flex: 1, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(p, 2) * grow}%`, height: "100%", borderRadius: 16, background: BAR_COLORS[i], boxShadow: chosen ? `0 0 30px ${L.green}` : "none" }} />
              </div>
              <div style={{ width: 110, fontFamily: L.font, fontWeight: 800, fontSize: 40, color: L.muted }}>{Math.round(p * grow)}%</div>
            </div>
          );
        })}
      </div>
      {f >= loop && (
        <div style={{ position: "absolute", top: 1140, left: 0, right: 0, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 36, color: L.amber, opacity: interpolate(f, [loop, loop + 10], [0, 1], clamp) }}>
          predict → add → repeat ↻
        </div>
      )}
    </>
  );
};
