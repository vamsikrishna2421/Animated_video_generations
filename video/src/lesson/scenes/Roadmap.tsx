import { useCurrentFrame } from "remotion";
import { L, SceneProps } from "../theme";
import { Heading, useSpring } from "./common";

// Course map: one row of tiles per season, highlighted as each season is named.
export const Roadmap: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const seasons: { title: string; color: string; items: string[] }[] = data.seasons;
  let n = 0;
  const active = seasons.reduce((a, _, i) => (f >= cue(i) ? i : a), -1);
  return (
    <>
      <Heading kicker="THE COURSE">{data.heading}</Heading>
      <div style={{ position: "absolute", top: 470, left: 50, right: 50 }}>
        {seasons.map((s, si) => {
          const on = si === active;
          return (
            <div key={s.title} style={{ marginBottom: 26, opacity: active >= si ? 1 : 0.35 }}>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: s.color, marginBottom: 12 }}>{s.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {s.items.map((it) => {
                  const idx = n++;
                  const sp = useSpring(cue(si) + (idx % 6) * 3, 12);
                  return (
                    <div
                      key={it}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 16,
                        background: on ? `${s.color}33` : "rgba(255,255,255,0.06)",
                        border: `2px solid ${on ? s.color : L.border}`,
                        fontFamily: L.font,
                        fontWeight: 700,
                        fontSize: 27,
                        color: L.text,
                        transform: `scale(${0.7 + 0.3 * sp})`,
                        opacity: sp,
                      }}
                    >
                      <span style={{ color: s.color, fontWeight: 800 }}>{String(idx + 1).padStart(2, "0")}</span> {it}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
