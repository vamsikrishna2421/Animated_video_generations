import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, Check } from "../components/Card";
import { theme } from "../theme";
import { SceneProps } from "./types";

const STEPS = ["Pre-filled", "Double-checked", "Filed", "E-verified"];
const CONFETTI = Array.from({ length: 70 }).map((_, i) => ({
  angle: (i / 70) * Math.PI * 2 + (i % 5) * 0.2,
  speed: 14 + ((i * 37) % 13),
  color: [theme.teal, theme.violet, theme.green, theme.amber][i % 4],
  size: 10 + (i % 3) * 6,
}));

export const File: React.FC<SceneProps> = ({ duration }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const tap = 26;
  const stepStart = 40;
  const stepGap = Math.floor((duration * 0.62 - stepStart) / STEPS.length);
  const doneAt = stepStart + STEPS.length * stepGap;
  const line = interpolate(f, [stepStart, doneAt - stepGap / 2], [0, 1], ease);
  const press = f > tap && f < tap + 8 ? 0.92 : 1;
  const success = spring({ frame: f - doneAt, fps, config: { damping: 10 } });
  const stepperFade = interpolate(f, [doneAt, doneAt + 12], [1, 0], ease);

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 70, textAlign: "center" }}>
        <div style={{ fontSize: 30, color: theme.muted, fontWeight: 600, letterSpacing: 6 }}>STEP 3</div>
        <div style={{ fontSize: 70, fontWeight: 800 }}>File your ITR</div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 250,
          transform: `scale(${press * spring({ frame: f, fps })})`,
          opacity: interpolate(f, [tap + 10, tap + 22], [1, 0], ease),
          padding: "30px 90px",
          borderRadius: 60,
          background: `linear-gradient(90deg, ${theme.violet}, ${theme.teal})`,
          fontSize: 44,
          fontWeight: 800,
          boxShadow: `0 0 60px ${theme.violet}`,
        }}
      >
        File ITR
        {f > tap && f < tap + 20 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 40 + (f - tap) * 18,
              height: 40 + (f - tap) * 18,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              border: "4px solid white",
              opacity: 1 - (f - tap) / 20,
            }}
          />
        )}
      </div>

      <Card style={{ position: "absolute", top: 420, width: 1500, height: 240, opacity: stepperFade * interpolate(f, [tap + 10, tap + 22], [0, 1], ease) }}>
        <div style={{ position: "absolute", left: 190, right: 190, top: 88, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ width: `${line * 100}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${theme.teal}, ${theme.green})` }} />
        </div>
        {STEPS.map((s, i) => {
          const t = stepStart + i * stepGap;
          const p = interpolate(f, [t, t + 14], [0, 1], ease);
          return (
            <div key={s} style={{ position: "absolute", left: 190 + i * ((1500 - 380) / 3) - 140, top: 50, width: 280, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", transform: `scale(${1 + 0.25 * Math.sin(p * Math.PI)})` }}>
                <Check size={84} progress={p} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 14, color: p > 0.5 ? theme.text : theme.muted }}>{s}</div>
            </div>
          );
        })}
      </Card>

      {f >= doneAt &&
        CONFETTI.map((c, i) => {
          const t = f - doneAt;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 960 + Math.cos(c.angle) * c.speed * t,
                top: 520 + Math.sin(c.angle) * c.speed * t + 0.35 * t * t,
                width: c.size,
                height: c.size * 0.5,
                background: c.color,
                transform: `rotate(${t * 12 + i * 20}deg)`,
                opacity: interpolate(t, [0, 50], [1, 0], ease),
              }}
            />
          );
        })}
      <div style={{ position: "absolute", top: 380, textAlign: "center", transform: `scale(${success})`, opacity: success }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Check size={220} progress={interpolate(f, [doneAt, doneAt + 18], [0, 1], ease)} />
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 20 }}>ITR filed successfully</div>
        <div style={{ fontSize: 32, fontWeight: 600, color: theme.green }}>Acknowledgement received</div>
      </div>
      <Sequence from={doneAt} durationInFrames={50} layout="none">
        <Audio src={staticFile("audio/sfx_success.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
