import { useCurrentFrame } from "remotion";
import { B, F, pop } from "./tokens";

// Karaoke captions (the high-retention reel style): 2-3 words at a time, big condensed caps, the word
// being spoken turns amber and pops. words: [{ w: "learn", s: 12, e: 20 }] in local frames.
export type Word = { w: string; s: number; e: number };

export const chunk = (words: Word[], max = 3, gap = 9) => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length >= max || (prev && w.s - prev.e > gap) || (prev && /[.!?]$/.test(prev.w))) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) groups.push(cur);
  return groups;
};

export const Karaoke: React.FC<{ words: Word[]; bottom?: number; size?: number; max?: number; accent?: string }> = ({ words, bottom = 420, size = 104, max = 3, accent = B.amber }) => {
  const f = useCurrentFrame();
  const groups = chunk(words, max);
  const g = groups.find((grp) => f >= grp[0].s - 2 && f < grp[grp.length - 1].e + 6);
  if (!g) return null;
  const inS = pop(f, g[0].s - 2, 14, 0.5, 260);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom, textAlign: "center", transform: `scale(${0.85 + 0.15 * inS})` }}>
      {g.map((w, i) => {
        const active = f >= w.s && f < w.e + 2;
        const p = active ? pop(f, w.s, 10, 0.4, 300) : 0;
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 14px", fontFamily: F.anton, fontSize: size * (1 + 0.1 * p), lineHeight: 1.05, textTransform: "uppercase", color: active ? accent : B.white, WebkitTextStroke: "3px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,0.85), 0 0 30px rgba(0,0,0,0.5)" }}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
