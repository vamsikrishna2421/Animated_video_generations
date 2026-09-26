import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Slow-drifting colour blobs over a deep gradient. Driven by the global frame so it
// stays continuous across scene cuts.
export const Background: React.FC<{ tint?: string }> = ({ tint }) => {
  const f = useCurrentFrame();
  const blob = (color: string, x: number, y: number, size: number, speed: number, phase: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(f * speed + phase) * 120,
        top: y + Math.cos(f * speed * 0.8 + phase) * 80,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(140px)",
        opacity: 0.45,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${theme.bg2}, ${theme.bg1} 70%)` }}>
      {blob(theme.violet, 200, 100, 700, 0.012, 0)}
      {blob(theme.teal, 1200, 500, 650, 0.01, 2)}
      {blob(tint ?? theme.violet, 700, 700, 500, 0.015, 4)}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: interpolate(Math.sin(f / 40), [-1, 1], [0.5, 1]),
        }}
      />
    </AbsoluteFill>
  );
};
