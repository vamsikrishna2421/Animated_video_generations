import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { L, clamp } from "./theme";

const KEY = /^(AI|ML|DL|GenAI|machine|learning|deep|generative|neural|networks?|rules|data|layers?|examples?|RAG|LLM|tokens?|quiz|recap|creates?|learns?)$/i;

// Reels-style phrase captions: one short chunk at a time, keywords highlighted.
export const Captions: React.FC<{ captions: { text: string; from: number; to: number }[] }> = ({ captions }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cur = captions.find((c) => f >= c.from && f < Math.max(c.to, c.from + 8));
  if (!cur) return null;
  const pop = spring({ frame: f - cur.from, fps, config: { damping: 14, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 250,
        width: 690,
        top: 1265,
        height: 200,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: L.font,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.18,
          color: L.text,
          textShadow: "0 4px 18px rgba(0,0,0,0.8)",
          transform: `scale(${interpolate(pop, [0, 1], [0.85, 1])})`,
          transformOrigin: "left center",
          opacity: interpolate(pop, [0, 1], [0, 1], clamp),
        }}
      >
        {cur.text.split(" ").map((w, i) => {
          const bare = w.replace(/[^\w]/g, "");
          return (
            <span key={i} style={{ color: KEY.test(bare) ? L.amber : L.text }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};
