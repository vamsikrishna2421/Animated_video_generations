import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

type Props = {
  size: number;
  delay?: number;
  mood?: "calm" | "happy";
  talking?: boolean;
};

// Muse: a glowing orb with a face. Floats, blinks, pulses halos, and "talks" by
// modulating its glow.
export const MuseOrb: React.FC<Props> = ({ size, delay = 0, mood = "calm", talking = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 120 } });
  const float = Math.sin(frame / 18) * size * 0.04;
  const blinkPhase = frame % 96;
  const eyeScale = blinkPhase > 88 && blinkPhase < 94 ? 0.15 : 1;
  const talk = talking ? 0.5 + 0.5 * Math.abs(Math.sin(frame / 3.2)) : 0;
  const glow = size * (0.25 + talk * 0.12);

  const halo = (i: number) => {
    const t = ((frame + i * 30) % 90) / 90;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          inset: -size * 0.5 * t,
          borderRadius: "50%",
          border: `2px solid ${i % 2 ? theme.teal : theme.violet}`,
          opacity: (1 - t) * 0.5,
        }}
      />
    );
  };

  const eyeW = size * 0.1;
  const eyeH = size * 0.18;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: `translateY(${float}px) scale(${enter})`,
      }}
    >
      {[0, 1, 2].map(halo)}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${theme.teal} 22%, ${theme.violet} 62%, #3b1d8f 100%)`,
          boxShadow: `0 0 ${glow}px ${theme.violet}, 0 0 ${glow * 2}px rgba(34,211,238,0.45), inset 0 -${size * 0.08}px ${size * 0.2}px rgba(0,0,0,0.25)`,
        }}
      />
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: size / 2 + side * size * 0.14 - eyeW / 2,
            top: size * 0.36,
            width: eyeW,
            height: eyeH,
            borderRadius: eyeW,
            background: "white",
            transform: `scaleY(${eyeScale})`,
            boxShadow: "0 0 12px rgba(255,255,255,0.8)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: size * 0.39,
          top: size * 0.62,
          width: size * 0.22,
          height: mood === "happy" ? size * 0.1 : size * 0.05 + talk * size * 0.05,
          borderBottomLeftRadius: size,
          borderBottomRightRadius: size,
          borderTopLeftRadius: mood === "happy" ? 0 : size,
          borderTopRightRadius: mood === "happy" ? 0 : size,
          background: "rgba(255,255,255,0.9)",
          opacity: interpolate(enter, [0.6, 1], [0, 1], { extrapolateLeft: "clamp" }),
        }}
      />
    </div>
  );
};
