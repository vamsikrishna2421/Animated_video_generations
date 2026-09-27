import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading } from "./common";

const ROW = 92;

// Chat messages stack into a fixed-size window; the oldest slide out and are "forgotten".
export const ContextWindow: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const msgs: [string, string][] = data.messages; // [who, text]
  const cap: number = data.capacity;
  const start = cue(0);
  const every = Math.max(10, Math.floor((cue(1) - start) / msgs.length));
  const count = Math.max(0, Math.min(msgs.length, Math.floor((f - start) / every) + 1));
  const overflow = Math.max(0, count - cap);
  const shift = interpolate(f - start - (count - 1) * every, [0, 10], [overflow - (count > cap ? 1 : 0), overflow], clamp);
  const boxTop = 560;
  return (
    <>
      <Heading kicker={data.kicker ?? "MEMORY LIMIT"}>{data.heading}</Heading>
      <div style={{ position: "absolute", top: 480, left: 60, right: 60, display: "flex", justifyContent: "space-between", fontFamily: L.font, fontWeight: 800, fontSize: 28, letterSpacing: 3 }}>
        <span style={{ color: L.rose, opacity: overflow > 0 ? 1 : 0.3 }}>↑ FORGOTTEN</span>
        <span style={{ color: L.amber }}>{data.label}</span>
      </div>
      <div style={{ position: "absolute", top: boxTop, left: 60, right: 60, height: cap * ROW + 24, borderRadius: 30, border: `4px solid ${L.amber}`, boxShadow: `0 0 40px ${L.amber}44`, overflow: "hidden", background: "rgba(0,0,0,0.25)" }}>
        {msgs.slice(0, count).map(([who, text], i) => {
          const y = 12 + (i - shift) * ROW;
          const user = who === "you";
          return (
            <div key={i} style={{ position: "absolute", top: y, left: 16, right: 16, display: "flex", justifyContent: user ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: 760,
                  padding: "14px 22px",
                  borderRadius: 22,
                  background: user ? L.blue : "rgba(255,255,255,0.12)",
                  fontFamily: L.font,
                  fontWeight: 600,
                  fontSize: 30,
                  color: L.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: interpolate(f, [start + i * every, start + i * every + 6], [0, 1], clamp),
                }}
              >
                {text}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: boxTop + cap * ROW + 50, left: 60, right: 60, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 36, color: L.text, opacity: interpolate(f, [cue(1), cue(1) + 12], [0, 1], clamp) }}>
        {data.note}
      </div>
    </>
  );
};
