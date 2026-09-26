import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Panel, useSpring } from "./common";

// Myth card gets stamped "BUSTED", then the fact slides in.
export const Myth: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const myth = useSpring(cue(0) - 4, 13);
  const stamp = useSpring(cue(1), 8);
  const fact = useSpring(cue(1) + 12, 13);
  const tip = interpolate(f, [cue(1) + 60, cue(1) + 72], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", top: 290, left: 70, fontFamily: L.font, fontWeight: 800, fontSize: 72, color: L.text }}>
        Myth <span style={{ color: L.muted }}>vs</span> <span style={{ color: L.green }}>Fact</span>
      </div>
      <Panel style={{ position: "absolute", top: 440, left: 60, right: 60, padding: "34px 36px", borderColor: L.rose, opacity: myth * (f > cue(1) ? 0.7 : 1), transform: `scale(${myth})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: L.font, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: L.rose }}>
          <Icon name="XCircle" size={40} color={L.rose} /> MYTH
        </div>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 48, color: L.text, marginTop: 14, lineHeight: 1.2 }}>"{data.myth}"</div>
        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: -30,
            background: "#1a1433",
            transform: `rotate(-14deg) scale(${interpolate(stamp, [0, 1], [2.2, 1])})`,
            opacity: stamp,
            border: `6px solid ${L.rose}`,
            color: L.rose,
            fontFamily: L.font,
            fontWeight: 800,
            fontSize: 46,
            letterSpacing: 6,
            padding: "4px 18px",
            borderRadius: 12,
          }}
        >
          BUSTED
        </div>
      </Panel>
      <Panel style={{ position: "absolute", top: 780, left: 60, right: 60, padding: "34px 36px", borderColor: L.green, background: "rgba(52,211,153,0.1)", opacity: fact, transform: `translateY(${(1 - fact) * 100}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: L.font, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: L.green }}>
          <Icon name="CheckCircle2" size={40} color={L.green} /> FACT
        </div>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 44, color: L.text, marginTop: 14, lineHeight: 1.25 }}>{data.fact}</div>
      </Panel>
      <div style={{ position: "absolute", top: 1120, left: 0, right: 0, textAlign: "center", opacity: tip }}>
        <span style={{ fontFamily: L.font, fontWeight: 800, fontSize: 34, color: "#0A0F24", background: L.amber, padding: "12px 28px", borderRadius: 30 }}>Tip: {data.tip}</span>
      </div>
    </>
  );
};
