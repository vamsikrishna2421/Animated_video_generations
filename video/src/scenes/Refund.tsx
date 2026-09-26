import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MuseOrb } from "../components/MuseOrb";
import { inr, theme } from "../theme";
import { SceneProps } from "./types";

const REFUND = 18450;

export const Refund: React.FC<SceneProps> = ({ voiceFrom, voiceFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(f, [10, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const R = 250;
  const C = 2 * Math.PI * R;
  const talking = f > voiceFrom && f < voiceFrom + voiceFrames;
  const chip = (label: string, d: number) => (
    <div
      style={{
        transform: `scale(${spring({ frame: f - d, fps, config: { damping: 12 } })})`,
        padding: "14px 30px",
        borderRadius: 40,
        background: "rgba(52,211,153,0.12)",
        border: `2px solid ${theme.green}`,
        fontSize: 30,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text, alignItems: "center" }}>
      <div style={{ position: "absolute", left: 230, top: 330 }}>
        <MuseOrb size={200} talking={talking} mood="happy" />
      </div>
      <svg width={600} height={600} style={{ position: "absolute", top: 110 }}>
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.teal} />
            <stop offset="100%" stopColor={theme.green} />
          </linearGradient>
        </defs>
        <circle cx={300} cy={300} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={26} />
        <circle
          cx={300}
          cy={300}
          r={R}
          fill="none"
          stroke="url(#ring)"
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          transform="rotate(-90 300 300)"
        />
      </svg>
      <div style={{ position: "absolute", top: 300, textAlign: "center" }}>
        <div style={{ fontSize: 34, color: theme.muted, fontWeight: 600 }}>Estimated refund</div>
        <div style={{ fontSize: 96, fontWeight: 800, color: theme.green, lineHeight: 1.1 }}>{inr(REFUND * p)}</div>
      </div>
      <div style={{ position: "absolute", top: 760, display: "flex", gap: 24 }}>
        {chip("Before you file", 70)}
        {chip("No guesswork", 85)}
        {chip("No surprises", 100)}
      </div>
    </AbsoluteFill>
  );
};
