import { interpolate, random, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp, gradText } from "../theme";
import { SceneImage, useSpring } from "./common";

const COLORS = [L.violet, L.blue, L.teal, L.amber];

export const Banner: React.FC<SceneProps> = ({ data, cue, image }) => {
  const f = useCurrentFrame();
  const kick = useSpring(2, 14);
  const titles: string[] = data.title;
  const settle = useSpring(cue(1), 9);
  return (
    <>
      {data.buzzwords.map((w: string, i: number) => {
        const x = 80 + random(`bx${i}`) * 820;
        const y = 330 + ((random(`by${i}`) * 800 - f * (1 + random(`bs${i}`) * 1.5)) % 820 + 820) % 820;
        return (
          <div
            key={w}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: L.font,
              fontWeight: 700,
              fontSize: 30 + random(`bz${i}`) * 16,
              color: L.muted,
              opacity: 0.14 * interpolate(f, [0, 20], [0, 1], clamp),
              padding: "8px 18px",
              border: `1.5px solid ${L.border}`,
              borderRadius: 40,
            }}
          >
            {w}
          </div>
        );
      })}
      {image && <SceneImage src={image} style={{ position: "absolute", left: 90, right: 90, top: 300, height: 380, opacity: kick }} />}
      <div style={{ position: "absolute", left: 80, right: 80, top: image ? 720 : 420 }}>
        <div
          style={{
            display: "inline-block",
            fontFamily: L.font,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 8,
            color: "#0A0F24",
            background: L.amber,
            padding: "10px 24px",
            borderRadius: 12,
            transform: `scale(${kick})`,
            transformOrigin: "left",
          }}
        >
          {data.kicker}
        </div>
        <div style={{ marginTop: 26 }}>
          {titles.map((t, i) => {
            const s = useSpring(8 + i * 9, 10);
            return (
              <div
                key={t}
                style={{
                  fontFamily: L.font,
                  fontWeight: 800,
                  fontSize: Math.min(titles.length <= 2 ? 190 : t.length > 6 ? 118 : 150, 1480 / t.length),
                  lineHeight: 1.02,
                  letterSpacing: -3,
                  transform: `translateX(${(1 - s) * (i % 2 ? 400 : -400)}px) scale(${1 + 0.04 * Math.sin(settle * Math.PI)})`,
                  opacity: s,
                  ...gradText(COLORS[i % 4], COLORS[(i + 1) % 4]),
                }}
              >
                {t}
                {data.vs && i < titles.length - 1 && <span style={{ fontSize: 60, WebkitTextFillColor: L.muted, marginLeft: 20 }}>vs</span>}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: L.font,
            fontWeight: 700,
            fontSize: 52,
            color: L.text,
            opacity: interpolate(f, [cue(0), cue(0) + 12], [0, 1], clamp),
          }}
        >
          {data.subtitle}
        </div>
      </div>
    </>
  );
};
