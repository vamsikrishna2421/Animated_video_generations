import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, Check, DocIcon } from "../components/Card";
import { MuseOrb } from "../components/MuseOrb";
import { theme } from "../theme";
import { SceneProps } from "./types";

const ITEMS = [
  ["Form 16", "from your employer"],
  ["AIS / Form 26AS", "auto-fetched"],
  ["Interest certificates", "savings & FDs"],
  ["Rent receipts", "for HRA"],
  ["Investment proofs", "80C: PPF, ELSS, LIC"],
  ["Health insurance", "80D premium"],
];

export const Docs: React.FC<SceneProps> = ({ duration, voiceFrom, voiceFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const firstTick = 70;
  const gap = Math.floor((duration - firstTick - 50) / ITEMS.length);
  const done = ITEMS.filter((_, i) => f >= firstTick + i * gap + 8).length;
  const panel = spring({ frame: f - 6, fps, config: { damping: 15 } });
  const talking = f > voiceFrom && f < voiceFrom + voiceFrames;

  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.text }}>
      <div style={{ position: "absolute", left: 200, top: 250 }}>
        <MuseOrb size={220} talking={talking} />
      </div>
      <Card
        style={{
          position: "absolute",
          left: 110,
          top: 540,
          width: 440,
          padding: "22px 28px",
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.35,
          opacity: interpolate(f, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Snap or upload. <span style={{ color: theme.teal }}>I'll sort the rest.</span>
      </Card>

      <Card
        style={{
          position: "absolute",
          left: 700,
          top: 90,
          width: 1060,
          padding: "36px 44px",
          transform: `translateX(${(1 - panel) * 300}px)`,
          opacity: panel,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 44, fontWeight: 800 }}>Your document checklist</div>
          <div style={{ fontSize: 30, fontWeight: 600, color: theme.teal }}>
            {done}/{ITEMS.length} collected
          </div>
        </div>
        <div style={{ height: 10, borderRadius: 10, background: "rgba(255,255,255,0.1)", margin: "20px 0 22px" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 10,
              width: `${(done / ITEMS.length) * 100}%`,
              background: `linear-gradient(90deg, ${theme.violet}, ${theme.teal})`,
            }}
          />
        </div>
        {ITEMS.map(([title, sub], i) => {
          const t = firstTick + i * gap;
          const row = spring({ frame: f - 12 - i * 5, fps, config: { damping: 16 } });
          const tick = interpolate(f, [t, t + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const active = f >= t - 20 && f < t + 12;
          return (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                padding: "15px 20px",
                marginBottom: 8,
                borderRadius: 18,
                background: active ? "rgba(34,211,238,0.12)" : "transparent",
                opacity: row,
                transform: `translateY(${(1 - row) * 20}px)`,
              }}
            >
              <DocIcon size={32} color={tick > 0 ? theme.green : theme.teal} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 24, color: theme.muted }}>{sub}</div>
              </div>
              <Check progress={tick} />
            </div>
          );
        })}
      </Card>
      {ITEMS.map((_, i) => (
        <Sequence key={i} from={firstTick + i * gap} durationInFrames={10} layout="none">
          <Audio src={staticFile("audio/sfx_pop.wav")} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
