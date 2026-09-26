import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

// Weak prompt -> meh reply, then prompt parts snap together -> great reply.
export const PromptBuilder: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const parts: [string, string, string][] = data.parts; // [label, text, color]
  const n = parts.length;
  const weak = useSpring(cue(0), 13);
  const built = f >= cue(1);
  const good = useSpring(cue(n + 1), 12);
  return (
    <>
      <Heading kicker="PROMPT RECIPE">{data.heading}</Heading>
      {!built && (
        <div style={{ position: "absolute", top: 490, left: 60, right: 60, opacity: weak }}>
          <Panel style={{ padding: "26px 30px", borderColor: L.rose }}>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: L.rose }}>WEAK PROMPT</div>
            <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 44, color: L.text, marginTop: 8 }}>"{data.bad}"</div>
          </Panel>
          <Panel style={{ padding: "26px 30px", marginTop: 24 }}>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: L.muted }}>AI REPLY</div>
            <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 36, color: L.muted, marginTop: 8, lineHeight: 1.3 }}>{data.badReply}</div>
          </Panel>
        </div>
      )}
      {built && (
        <div style={{ position: "absolute", top: 470, left: 60, right: 60 }}>
          {parts.map(([label, text, color], i) => {
            const s = useSpring(cue(i + 1), 12);
            return (
              <div key={label} style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 12, opacity: s, transform: `translateX(${(1 - s) * (i % 2 ? 500 : -500)}px)` }}>
                <div style={{ width: 170, flexShrink: 0, borderRadius: 16, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: L.font, fontWeight: 800, fontSize: 28, color: "#0A0F24" }}>{label}</div>
                <div style={{ flex: 1, padding: "14px 20px", borderRadius: 16, border: `2px solid ${color}`, background: `${color}1f`, fontFamily: L.font, fontWeight: 600, fontSize: 30, color: L.text, lineHeight: 1.25 }}>{text}</div>
              </div>
            );
          })}
          <Panel style={{ marginTop: 18, padding: "22px 28px", borderColor: L.green, background: "rgba(52,211,153,0.1)", opacity: good, transform: `scale(${0.9 + 0.1 * good})` }}>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: L.green }}>AI REPLY ✓</div>
            <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 32, color: L.text, marginTop: 6, lineHeight: 1.3 }}>{data.goodReply}</div>
          </Panel>
        </div>
      )}
    </>
  );
};
