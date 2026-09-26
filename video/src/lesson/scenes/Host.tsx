import { interpolate, useCurrentFrame } from "remotion";
import { Mascot } from "../Mascot";
import { L, SceneProps, clamp, gradText } from "../theme";
import { useSpring } from "./common";

// Big host introduction. The global corner mascot is hidden during this scene.
export const Host: React.FC<SceneProps & { talking?: boolean }> = ({ data, cue, talking = true }) => {
  const f = useCurrentFrame();
  const pop = useSpring(0, 10);
  return (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${pop})` }}>
        <Mascot size={500} talking={talking} />
      </div>
      <div style={{ position: "absolute", top: 850, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 104, lineHeight: 1, ...gradText(L.amber, L.rose), opacity: interpolate(f, [8, 20], [0, 1], clamp) }}>{data.name}</div>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 40, color: L.muted, marginTop: 10, opacity: interpolate(f, [16, 28], [0, 1], clamp) }}>{data.role}</div>
      </div>
      {data.bubbles.map((b: string, i: number) => {
        const s = useSpring(cue(i), 11);
        const left = i % 2 === 0;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              top: 330 + i * 150,
              [left ? "left" : "right"]: 40,
              maxWidth: 380,
              padding: "18px 26px",
              borderRadius: left ? "30px 30px 30px 6px" : "30px 30px 6px 30px",
              background: [L.violet, L.blue, L.teal, L.amber][i % 4],
              fontFamily: L.font,
              fontWeight: 800,
              fontSize: 34,
              color: "white",
              transform: `scale(${s}) rotate(${left ? -3 : 3}deg)`,
              opacity: s,
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
          >
            {b}
          </div>
        );
      })}
    </>
  );
};
