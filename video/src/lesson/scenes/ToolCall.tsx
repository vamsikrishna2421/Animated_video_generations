import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Panel, useSpring } from "./common";

// User asks -> model emits a tool call -> app runs it -> result -> final answer.
export const ToolCall: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const q = useSpring(cue(0) - 6, 13);
  const call = useSpring(cue(1), 12);
  const res = useSpring(cue(2), 12);
  const ans = useSpring(cue(3), 12);
  const json = JSON.stringify(data.call, null, 1).replace(/\n\s*/g, " ");
  const typed = Math.floor(interpolate(f, [cue(1) + 6, cue(1) + 6 + json.length * 0.6], [0, json.length], clamp));
  const label = (t: string, c: string, icon: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: L.font, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: c, marginBottom: 8 }}>
      <Icon name={icon} size={30} color={c} /> {t}
    </div>
  );
  return (
    <>
      <div style={{ position: "absolute", top: 290, left: 70, fontFamily: L.font, fontWeight: 800, fontSize: 66, color: L.text }}>{data.heading}</div>
      <div style={{ position: "absolute", top: 420, left: 60, right: 60 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
          <div style={{ maxWidth: 760, background: L.blue, borderRadius: "28px 28px 6px 28px", padding: "18px 26px", fontFamily: L.font, fontSize: 36, fontWeight: 700, color: "white" }}>{data.question}</div>
        </div>
        <Panel style={{ marginTop: 22, padding: "20px 26px", borderColor: L.violet, opacity: call, transform: `scale(${0.9 + 0.1 * call})` }}>
          {label("AI ASKS YOUR APP", L.violet, "Wrench")}
          <div style={{ fontFamily: L.mono, fontSize: 30, color: L.teal, lineHeight: 1.35, wordBreak: "break-all" }}>{json.slice(0, typed)}</div>
        </Panel>
        <div style={{ textAlign: "center", fontSize: 44, color: L.muted, opacity: res }}>↓</div>
        <Panel style={{ padding: "20px 26px", borderColor: L.green, opacity: res, transform: `scale(${0.9 + 0.1 * res})` }}>
          {label(data.tool, L.green, "Globe")}
          <div style={{ fontFamily: L.mono, fontSize: 30, color: L.text }}>{data.result}</div>
        </Panel>
        <div style={{ display: "flex", gap: 16, marginTop: 26, opacity: ans, transform: `translateY(${(1 - ans) * 30}px)` }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${L.amber}, ${L.rose})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="Sparkles" size={34} />
          </div>
          <div style={{ maxWidth: 780, background: "rgba(255,255,255,0.1)", borderRadius: "28px 28px 28px 6px", padding: "18px 26px", fontFamily: L.font, fontSize: 34, fontWeight: 600, color: L.text, lineHeight: 1.3 }}>{data.answer}</div>
        </div>
      </div>
    </>
  );
};
