import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Word-by-word karaoke caption, paced linearly across the narration window.
export const Caption: React.FC<{ text: string; from: number; frames: number }> = ({ text, from, frames }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  const totalChars = text.length;
  let acc = 0;
  const opacity = interpolate(f, [from - 6, from + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "18px 34px",
          borderRadius: 22,
          background: "rgba(7,11,26,0.72)",
          border: `1px solid ${theme.cardBorder}`,
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1.35,
          textAlign: "center",
          fontFamily: theme.font,
        }}
      >
        {words.map((w, i) => {
          const start = from + (acc / totalChars) * frames;
          acc += w.length + 1;
          const lit = interpolate(f, [start - 2, start + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span key={i} style={{ color: lit > 0.5 ? theme.text : "rgba(248,250,252,0.35)" }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};
