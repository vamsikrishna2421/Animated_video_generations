import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MuseOrb } from "../components/MuseOrb";
import { gradientText, theme } from "../theme";
import { SceneProps } from "./types";

const PILLARS = ["Collect", "Plan", "File"];

export const Cta: React.FC<SceneProps> = ({ voiceFrom, voiceFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = spring({ frame: f - 8, fps, config: { damping: 13 } });
  const talking = f > voiceFrom && f < voiceFrom + voiceFrames;
  const glow = 30 + 20 * Math.sin(f / 6);

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 110 }}>
        <MuseOrb size={260} talking={talking} mood="happy" />
      </div>
      <div style={{ position: "absolute", top: 430, textAlign: "center" }}>
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 1, transform: `scale(${word})`, ...gradientText }}>Muse</div>
        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 16, opacity: interpolate(f, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          From documents to done.
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 34 }}>
          {PILLARS.map((p, i) => (
            <div
              key={p}
              style={{
                transform: `scale(${spring({ frame: f - 30 - i * 8, fps, config: { damping: 12 } })})`,
                padding: "14px 34px",
                borderRadius: 40,
                border: `2px solid ${theme.cardBorder}`,
                fontSize: 30,
                fontWeight: 600,
                color: theme.muted,
              }}
            >
              {i + 1}. {p}
            </div>
          ))}
          <div
            style={{
              transform: `scale(${spring({ frame: f - 60, fps, config: { damping: 12 } })})`,
              padding: "14px 40px",
              borderRadius: 40,
              background: `linear-gradient(90deg, ${theme.violet}, ${theme.teal})`,
              boxShadow: `0 0 ${glow}px ${theme.violet}`,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            Get started
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
