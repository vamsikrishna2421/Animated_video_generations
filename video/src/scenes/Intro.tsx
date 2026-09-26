import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MuseOrb } from "../components/MuseOrb";
import { gradientText, theme } from "../theme";
import { SceneProps } from "./types";

export const Intro: React.FC<SceneProps> = ({ voiceFrom, voiceFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const name = spring({ frame: f - 18, fps, config: { damping: 14 } });
  const sub = interpolate(f, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const talking = f > voiceFrom && f < voiceFrom + voiceFrames;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: theme.font, color: theme.text }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2 + f / 90;
        const r = 330 + ((i * 71) % 160) + Math.sin(f / 20 + i) * 20;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(a) * r * 1.4,
              top: 400 + Math.sin(a) * r * 0.7,
              width: 6 + (i % 4) * 3,
              height: 6 + (i % 4) * 3,
              borderRadius: "50%",
              background: i % 2 ? theme.teal : theme.violet,
              opacity: 0.5 * spring({ frame: f - i, fps }),
              boxShadow: `0 0 14px ${i % 2 ? theme.teal : theme.violet}`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", top: 150 }}>
        <MuseOrb size={320} talking={talking} mood="happy" />
      </div>
      <div style={{ position: "absolute", top: 560, textAlign: "center" }}>
        <div style={{ fontSize: 160, fontWeight: 800, letterSpacing: -4, transform: `scale(${name})`, ...gradientText }}>Muse</div>
        <div style={{ fontSize: 44, fontWeight: 600, color: theme.muted, opacity: sub, marginTop: -10 }}>
          your personal tax assistant
        </div>
      </div>
    </AbsoluteFill>
  );
};
