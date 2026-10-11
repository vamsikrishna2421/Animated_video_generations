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

// Phrase captions for translated subtitles (English text over a Telugu voice): whole clauses at a time, no
// per-word highlight, because the caption's word order does not follow the spoken word order.
export const phraseGroups = (words: Word[]) => {
  const len = (ws: Word[]) => ws.reduce((n, w) => n + w.w.length + 1, 0);
  const out: Word[][] = [];
  let cur: Word[] = [];
  const end = (w: Word) => /[.!?]["'”’)]*$/.test(w.w);
  words.forEach((w, i) => {
    cur.push(w);
    const rest = words.length - i - 1, next = words[i + 1];
    let left = 0;   // words still to come in this sentence
    for (let k = i + 1; k < words.length; k++) { left++; if (end(words[k])) break; }
    if (end(w) || (/[,:;]$/.test(w.w) && len(cur) >= 16 && rest > 2 && left > 2) || (next && len(cur) + next.w.length + 1 > 42 && rest > 2 && left > 2)) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) {
    if (cur.length <= 2 && out.length) out[out.length - 1].push(...cur);
    else out.push(cur);
  }
  return out;
};

export const PhraseCaptions: React.FC<{ words: Word[]; bottom?: number; size?: number }> = ({ words, bottom = 420, size = 58 }) => {
  const f = useCurrentFrame();
  const gs = phraseGroups(words);
  const i = gs.findIndex((g, k) => f >= g[0].s - 2 && f < (gs[k + 1]?.[0].s ?? g[g.length - 1].e + 8));
  if (i < 0) return null;
  const g = gs[i];
  const inS = pop(f, g[0].s - 2, 10, 0.5, 260);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom, textAlign: "center", transform: `scale(${0.92 + 0.08 * inS})` }}>
      <span style={{ fontFamily: F.inter, fontWeight: 800, fontSize: size, lineHeight: 1.2, color: B.white, textShadow: "0 3px 10px rgba(0,0,0,0.8), 0 0 2px #000" }}>
        {g.map((w) => w.w).join(" ")}
      </span>
    </div>
  );
};
