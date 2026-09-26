import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, DocIcon } from "../components/Card";
import { theme } from "../theme";
import { SceneProps } from "./types";

const PAPERS = [
  "Form 16", "Salary slips", "Bank statement", "Rent receipts",
  "Form 26AS", "LIC premium", "Home loan", "PPF passbook", "Interest cert.",
];

// Chaos: documents rain in and pile up while the deadline pulses.
export const Hook: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: f, fps, config: { damping: 14 } });
  const pulse = 1 + 0.06 * Math.max(0, Math.sin(f / 5));
  const daysLeft = Math.max(1, 9 - Math.floor(f / 26));

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text }}>
      {PAPERS.map((label, i) => {
        const s = spring({ frame: f - 8 - i * 9, fps, config: { damping: 11, mass: 0.8 } });
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 180 + col * 290 + ((i * 53) % 60);
        const y = 250 + row * 200 + ((i * 37) % 40);
        const fromX = i % 2 ? -600 : 2400;
        const rot = ((i * 47) % 30) - 15 + Math.sin((f + i * 10) / 12) * 3;
        const shake = f > 150 ? Math.sin(f * 1.7 + i) * 4 : 0;
        return (
          <Card
            key={label}
            style={{
              position: "absolute",
              left: interpolate(s, [0, 1], [fromX, x]) + shake,
              top: interpolate(s, [0, 1], [-300, y]),
              width: 250,
              padding: "22px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              transform: `rotate(${rot}deg)`,
              background: "rgba(255,255,255,0.09)",
            }}
          >
            <DocIcon size={34} color={i % 3 === 0 ? theme.amber : theme.teal} />
            <span style={{ fontSize: 26, fontWeight: 600 }}>{label}</span>
          </Card>
        );
      })}

      <div style={{ position: "absolute", left: 140, top: 90, transform: `translateY(${(1 - title) * -40}px)`, opacity: title }}>
        <div style={{ fontSize: 30, color: theme.muted, fontWeight: 600, letterSpacing: 6 }}>IT'S THAT TIME AGAIN</div>
        <div style={{ fontSize: 92, fontWeight: 800 }}>Tax season.</div>
      </div>

      <Card
        style={{
          position: "absolute",
          right: 170,
          top: 260,
          width: 420,
          padding: 0,
          overflow: "hidden",
          transform: `scale(${spring({ frame: f - 40, fps }) * pulse}) rotate(4deg)`,
          boxShadow: `0 0 ${60 * (pulse - 1) * 10}px ${theme.rose}`,
        }}
      >
        <div style={{ background: theme.rose, padding: "18px 0", textAlign: "center", fontSize: 34, fontWeight: 800, letterSpacing: 6 }}>
          DEADLINE
        </div>
        <div style={{ textAlign: "center", padding: "26px 0 10px", fontSize: 150, fontWeight: 800, lineHeight: 1 }}>31</div>
        <div style={{ textAlign: "center", fontSize: 40, fontWeight: 600, color: theme.muted }}>JULY</div>
        <div style={{ textAlign: "center", padding: "22px 0 30px", fontSize: 30, fontWeight: 600, color: theme.rose }}>
          {daysLeft} day{daysLeft > 1 ? "s" : ""} left
        </div>
      </Card>
    </AbsoluteFill>
  );
};
