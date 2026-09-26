import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Card } from "../components/Card";
import { MuseOrb } from "../components/MuseOrb";
import { inr, theme } from "../theme";
import { SceneProps } from "./types";

const NEW_TAX = 124800;
const OLD_TAX = 78000;
const DEDUCTIONS = [
  ["80C", "₹1.5L"],
  ["80D", "₹25K"],
  ["HRA", "₹96K"],
  ["NPS 80CCD(1B)", "₹50K"],
  ["Home loan 24(b)", "₹2L"],
];

export const Plan: React.FC<SceneProps> = ({ duration, voiceFrom, voiceFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const grow = (d: number) => spring({ frame: f - d, fps, config: { damping: 20, mass: 1.2 } });
  const newH = grow(20) * 400;
  const oldH = interpolate(f, [60, 150], [NEW_TAX, OLD_TAX], ease) / NEW_TAX * 400 * grow(30);
  const oldVal = interpolate(f, [60, 150], [NEW_TAX, OLD_TAX], ease) * grow(30);
  const pick = spring({ frame: f - 160, fps, config: { damping: 10 } });
  const save = interpolate(f, [170, 230], [0, NEW_TAX - OLD_TAX], ease);
  const talking = f > voiceFrom && f < voiceFrom + voiceFrames;

  const bar = (label: string, h: number, val: number, color: string, winner: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
      <div style={{ height: 520, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 12 }}>{inr(val)}</div>
        <div
          style={{
            width: 160,
            height: h,
            borderRadius: "18px 18px 6px 6px",
            background: color,
            boxShadow: winner ? `0 0 ${50 * pick}px ${theme.green}` : "none",
            position: "relative",
          }}
        >
          {winner && (
            <div
              style={{
                position: "absolute",
                top: -110,
                left: "50%",
                transform: `translateX(-50%) scale(${pick})`,
                background: theme.green,
                color: "#052e1f",
                fontSize: 22,
                fontWeight: 800,
                padding: "8px 18px",
                borderRadius: 30,
                whiteSpace: "nowrap",
              }}
            >
              BEST FOR YOU
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: theme.muted, marginTop: 16 }}>{label}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text }}>
      <div style={{ position: "absolute", left: 140, top: 70 }}>
        <div style={{ fontSize: 30, color: theme.muted, fontWeight: 600, letterSpacing: 6 }}>STEP 2</div>
        <div style={{ fontSize: 70, fontWeight: 800 }}>Plan your savings</div>
      </div>

      <Card style={{ position: "absolute", left: 140, top: 230, width: 760, height: 620, padding: "30px 60px", display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
        {bar("New regime", newH, NEW_TAX * grow(20), "linear-gradient(180deg,#64748B,#334155)", false)}
        {bar("Old regime", oldH, oldVal, `linear-gradient(180deg, ${theme.teal}, ${theme.violet})`, pick > 0.05)}
      </Card>

      <div style={{ position: "absolute", left: 1000, top: 230, width: 780 }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: theme.muted, marginBottom: 20 }}>Deductions found</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
          {DEDUCTIONS.map(([k, v], i) => {
            const s = spring({ frame: f - 50 - i * 14, fps, config: { damping: 11 } });
            return (
              <div
                key={k}
                style={{
                  transform: `scale(${s})`,
                  padding: "16px 26px",
                  borderRadius: 40,
                  border: `2px solid ${theme.teal}`,
                  background: "rgba(34,211,238,0.1)",
                  fontSize: 30,
                  fontWeight: 600,
                }}
              >
                {k} <span style={{ color: theme.teal, marginLeft: 8 }}>{v}</span>
              </div>
            );
          })}
        </div>
        <Card
          style={{
            marginTop: 50,
            padding: "34px 40px",
            display: "flex",
            alignItems: "center",
            gap: 30,
            opacity: interpolate(f, [160, 180], [0, 1], ease),
            transform: `translateY(${interpolate(f, [160, 180], [30, 0], ease)}px)`,
          }}
        >
          <MuseOrb size={120} talking={talking} mood="happy" />
          <div>
            <div style={{ fontSize: 30, color: theme.muted, fontWeight: 600 }}>You save</div>
            <div style={{ fontSize: 96, fontWeight: 800, color: theme.green, lineHeight: 1 }}>{inr(save)}</div>
          </div>
        </Card>
        <div style={{ marginTop: 18, fontSize: 20, color: theme.muted, opacity: 0.7 }}>Illustrative figures</div>
      </div>
    </AbsoluteFill>
  );
};
