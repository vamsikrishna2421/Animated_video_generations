import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { L, clamp } from "../theme";

export const useSpring = (at: number, damping = 13) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping } });
};

export const Heading: React.FC<{ kicker?: string; children: React.ReactNode; top?: number }> = ({ kicker, children, top = L.stageTop }) => {
  const s = useSpring(0, 16);
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, opacity: s, transform: `translateY(${(1 - s) * -30}px)` }}>
      {kicker && (
        <div style={{ fontFamily: L.font, fontSize: 28, fontWeight: 800, letterSpacing: 6, color: L.teal, marginBottom: 6 }}>{kicker}</div>
      )}
      <div style={{ fontFamily: L.font, fontSize: 72, fontWeight: 800, color: L.text, lineHeight: 1.05 }}>{children}</div>
    </div>
  );
};

export const Panel: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: L.card,
      border: `1.5px solid ${L.border}`,
      borderRadius: 36,
      boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Optional generated illustration (e.g. Qwen-Image), with a slow Ken Burns move.
export const SceneImage: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ overflow: "hidden", borderRadius: 36, border: `1.5px solid ${L.border}`, ...style }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + f * 0.0006})` }} />
    </div>
  );
};

export const fadeIn = (f: number, at: number, len = 10) => interpolate(f, [at, at + len], [0, 1], clamp);
