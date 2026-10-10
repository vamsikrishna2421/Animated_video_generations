import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BrandFonts, Grain } from "../brand/Base";
import { Karaoke } from "../brand/Captions";
import { Subscribe } from "../brand/Cta";
import { LogoMark, LogoSting } from "../brand/Logo";
import { B, cl, F, pop, prog, rand } from "../brand/tokens";
import type { NewsTimeline } from "./NewsReel";

// Long-form YouTube edition (16:9) of a news timeline: cinematic cold open (particle field, glitch type, lab
// orbit, warp), brand sting, then one chapter per story with a visual panel, key points, captions and sources.
type Seg = NewsTimeline["segments"][number] & { chapter?: string; points?: string[] };
export const STING = 90, SUB_LEN = 110;
export const ytDuration = (tl: NewsTimeline) => tl.frames + STING;
const A = (f: string) => staticFile(`brand/audio/brand_${f}.wav`);
const W = 1920, H = 1080;

/** 3D star/particle field flying at the camera; `speed` 0.2 = drift, 3 = warp streaks. */
const Field: React.FC<{ speed: number; n?: number; tint?: string }> = ({ speed, n = 260, tint = "#9DB4FF" }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const x = (rand(`px${i}`) - 0.5) * 2, y = (rand(`py${i}`) - 0.5) * 2;
        const z0 = rand(`pz${i}`);
        const z = 0.05 + ((z0 - (f * 0.004 * speed)) % 1 + 1) % 1;
        const zp = Math.min(1.05, z + 0.004 * speed * 3);
        const sx = W / 2 + (x / z) * W * 0.18, sy = H / 2 + (y / z) * H * 0.3;
        const px = W / 2 + (x / zp) * W * 0.18, py = H / 2 + (y / zp) * H * 0.3;
        const a = Math.min(1, (1 - z) * 1.4);
        return speed > 1 ? <line key={i} x1={px} y1={py} x2={sx} y2={sy} stroke={tint} strokeOpacity={a} strokeWidth={1 + (1 - z) * 2.5} />
          : <circle key={i} cx={sx} cy={sy} r={0.6 + (1 - z) * 2.4} fill={tint} opacity={a * 0.8} />;
      })}
    </svg>
  );
};

/** RGB-split glitch text with slice jitter for `dur` frames after `at`. */
const Glitch: React.FC<{ text: string; at: number; size: number; color?: string; dur?: number; spacing?: number; weight?: number }> = ({ text, at, size, color = B.white, dur = 14, spacing = -3, weight = 800 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const on = t < dur;
  const j = on ? (rand(`g${Math.floor(f / 2)}`) - 0.5) * 30 : 0;
  const base: React.CSSProperties = { fontFamily: F.inter, fontWeight: weight, fontSize: size, letterSpacing: spacing, lineHeight: 1, whiteSpace: "nowrap" };
  const slice = on ? `inset(${rand(`s${f}`) * 60}% 0 ${rand(`t${f}`) * 30}% 0)` : undefined;
  return (
    <div style={{ position: "relative", display: "inline-block", opacity: prog(f, at, at + 4) }}>
      {on && <span style={{ ...base, position: "absolute", left: j * 0.6, top: 0, color: "#FF2D55", mixBlendMode: "screen", clipPath: slice }}>{text}</span>}
      {on && <span style={{ ...base, position: "absolute", left: -j * 0.6, top: 0, color: "#22D3EE", mixBlendMode: "screen" }}>{text}</span>}
      <span style={{ ...base, position: "relative", color, transform: `translateX(${j * 0.3}px)`, display: "inline-block" }}>{text}</span>
    </div>
  );
};

/** Lab names on rotating orbits around a glowing core. */
const Orbit: React.FC<{ labs: string[]; at: number }> = ({ labs, at }) => {
  const f = useCurrentFrame();
  const s = prog(f, at, at + 20);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: s }}>
      <circle cx={W / 2} cy={H / 2} r={10} fill="#E0F2FE" />
      <circle cx={W / 2} cy={H / 2} r={40} fill="#22D3EE" opacity={0.15} />
      {[200, 300, 400].map((r, k) => <ellipse key={r} cx={W / 2} cy={H / 2} rx={r * 1.5 * s} ry={r * 0.55 * s} fill="none" stroke="rgba(255,255,255,0.18)" />)}
      {labs.map((l, i) => {
        const ring = [200, 300, 400][i % 3];
        const a = (f - at) / (60 + ring / 5) + (i / labs.length) * Math.PI * 2;
        const x = W / 2 + Math.cos(a) * ring * 1.5 * s, y = H / 2 + Math.sin(a) * ring * 0.55 * s;
        const c = [B.cyan, B.amber, B.violet, "#F472B6", B.green, B.blue][i % 6];
        return (
          <g key={l} opacity={prog(f, at + i * 3, at + i * 3 + 10)}>
            <circle cx={x} cy={y} r={7} fill={c} />
            <text x={x + 16} y={y + 10} fontFamily="'Space Mono', monospace" fontWeight={700} fontSize={30} letterSpacing={4} fill={c}>{l}</text>
          </g>
        );
      })}
    </svg>
  );
};

/** Rotating dot sphere (chapter backdrop). */
const DotSphere: React.FC<{ cx: number; cy: number; r: number; color: string }> = ({ cx, cy, r, color }) => {
  const f = useCurrentFrame();
  const n = 240, rot = f / 150;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963 + rot;
        const x = Math.cos(th) * rr, z = Math.sin(th) * rr;
        return <circle key={i} cx={cx + x * r} cy={cy + y * r} r={1.2 + (z + 1) * 1.4} fill={color} opacity={0.15 + (z + 1) * 0.3} />;
      })}
    </svg>
  );
};

const ColdOpen: React.FC<{ seg: Seg; tl: NewsTimeline }> = ({ seg, tl }) => {
  const f = useCurrentFrame();
  const L = seg.frames;
  const p1 = L * 0.28, p2 = L * 0.62;
  const speed = f < p2 ? 0.4 : interpolate(f, [p2, p2 + 20], [0.4, 3.2], cl);
  return (
    <AbsoluteFill style={{ background: "#03040A" }}>
      <Field speed={speed} />
      {f < p1 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          <Glitch text="AI IS MOVING" at={4} size={70} spacing={2} />
          <Glitch text="FAST" at={14} size={260} spacing={-6} />
        </AbsoluteFill>
      )}
      {f >= p1 && f < p2 && <Orbit labs={tl.labs ?? ["OPENAI", "GOOGLE", "ANTHROPIC", "META", "NVIDIA", "XAI", "TYPESAFE", "FERMION"]} at={p1} />}
      {f >= p2 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 14, color: B.rose, opacity: prog(f, p2 + 6, p2 + 14) }}>{tl.kicker ?? "THIS WEEK IN AI"}</div>
          <Glitch text={tl.edition} at={p2 + 10} size={tl.edition.length > 12 ? 150 : 190} />
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: B.cyan, opacity: prog(f, p2 + 22, p2 + 32) }}>{tl.range}</div>
        </AbsoluteFill>
      )}
      <Karaoke words={seg.words} bottom={60} size={64} max={4} />
    </AbsoluteFill>
  );
};

const Chapter: React.FC<{ seg: Seg; n: number; total: number; edition: string }> = ({ seg, n, total, edition }) => {
  const f = useCurrentFrame();
  const accent = seg.accent ?? B.cyan;
  const cards = seg.cards ?? [];
  const card = interpolate(f, [0, 6, 34, 46], [0, 1, 1, 0], cl); // full-screen chapter card at the top of the chapter
  const live = cards.filter((c) => f >= c.f - 3).length - 1;
  const pts = seg.points ?? [];
  return (
    <AbsoluteFill style={{ background: "#05060C" }}>
      <div style={{ position: "absolute", left: -200, top: -100, width: 1100, height: 1100, borderRadius: "50%", background: `radial-gradient(circle, ${accent}30, transparent 62%)` }} />
      <DotSphere cx={1560} cy={560} r={330} color={accent} />
      <Field speed={0.15} n={90} tint={accent} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      {/* header */}
      <div style={{ position: "absolute", top: 46, left: 90, right: 90, display: "flex", alignItems: "center", gap: 18 }}>
        <LogoMark size={52} id={`yt${n}`} />
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.7)" }}>{edition}</div>
        <div style={{ marginLeft: "auto", fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: accent }}>CHAPTER {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      </div>
      {/* left: story */}
      <div style={{ position: "absolute", top: 150, left: 90, width: 1040, opacity: prog(f, 30, 44) }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <span style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 28, letterSpacing: 2, color: "#05060C", background: accent, padding: "8px 20px", borderRadius: 10 }}>{seg.org}</span>
          <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: accent, border: `2px solid ${accent}`, padding: "6px 14px", borderRadius: 10 }}>{seg.tag}</span>
        </div>
        {(seg.headline ?? []).map((line, i) => {
          const p = prog(f, 34 + i * 5, 48 + i * 5);
          return (
            <div key={i} style={{ overflow: "hidden" }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.inter, fontWeight: 800, fontSize: 76, letterSpacing: -3, lineHeight: 1.05, color: i === (seg.headline ?? []).length - 1 ? accent : B.white }}>{line}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {cards.map((c, i) => {
            if (f < c.f - 3) return <div key={i} />;
            const s = pop(f, c.f - 3, 13);
            return (
              <div key={i} style={{ display: "flex", borderRadius: 20, overflow: "hidden", background: "rgba(17,22,44,0.85)", border: `2px solid ${i === live ? accent : "rgba(255,255,255,0.08)"}`, transform: `translateY(${(1 - s) * 40}px) scale(${0.95 + 0.05 * s})`, opacity: interpolate(s, [0, 0.3], [0, 1], cl) * (i < live ? 0.7 : 1), gridColumn: cards.length % 2 === 1 && i === cards.length - 1 ? "1 / span 2" : undefined }}>
                <div style={{ width: 10, background: accent }} />
                <div style={{ padding: "16px 22px 18px" }}>
                  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: accent }}>{c.k}</div>
                  <div style={{ marginTop: 6, fontFamily: F.inter, fontWeight: 800, fontSize: 34, lineHeight: 1.15, color: B.white }}>{c.v}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* right: key points + sources */}
      <div style={{ position: "absolute", top: 230, left: 1260, width: 570, padding: "34px 36px", borderRadius: 28, background: "rgba(5,6,12,0.72)", border: "2px solid rgba(255,255,255,0.08)", opacity: prog(f, 40, 54) }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: accent, marginBottom: 22 }}>KEY POINTS</div>
        {pts.map((p, i) => {
          const at = 50 + (i / Math.max(1, pts.length)) * (seg.frames - 90);
          const s = prog(f, at, at + 14);
          return (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 22, opacity: s, transform: `translateX(${(1 - s) * 30}px)` }}>
              <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: F.inter, fontWeight: 600, fontSize: 32, lineHeight: 1.25, color: B.white }}>{p}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.12)", fontFamily: F.mono, fontWeight: 700, fontSize: 18, letterSpacing: 2, lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>SOURCES: {seg.sources?.toUpperCase()}</div>
      </div>
      <Karaoke words={seg.words} bottom={46} size={58} max={4} />
      {/* chapter card */}
      {card > 0 && (
        <AbsoluteFill style={{ background: "#03040A", opacity: card, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
          <Field speed={2.4} n={120} tint={accent} />
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 40, letterSpacing: 12, color: accent }}>CHAPTER {String(n).padStart(2, "0")}</div>
          <Glitch text={seg.chapter ?? ""} at={2} size={(seg.chapter ?? "").length > 26 ? 80 : 104} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ seg: Seg; stories: Seg[] }> = ({ seg, stories }) => {
  const f = useCurrentFrame();
  const subAt = seg.frames - SUB_LEN;
  return (
    <AbsoluteFill style={{ background: "#03040A" }}>
      <Field speed={0.3} />
      {f < subAt ? (
        <div style={{ position: "absolute", top: 110, left: 110, right: 110 }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 8, color: B.cyan, marginBottom: 34 }}>THE WEEK IN {stories.length} STORIES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "22px 34px" }}>
            {stories.map((s, i) => {
              const p = prog(f, 4 + i * 3, 16 + i * 3);
              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                  <div style={{ width: 10, height: 64, borderRadius: 5, background: s.accent }} />
                  <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 30, lineHeight: 1.15, color: B.white }}>{(s.headline ?? []).join(" ")}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Sequence from={subAt} layout="none"><Subscribe handle="AI Maastaaru" /></Sequence>
      )}
      {f < subAt && <Karaoke words={seg.words} bottom={46} size={58} max={4} />}
    </AbsoluteFill>
  );
};

export const NewsYT: React.FC<{ tl: NewsTimeline }> = ({ tl }) => {
  const f = useCurrentFrame();
  const segs = tl.segments as Seg[];
  const stories = segs.filter((s) => s.name.startsWith("story"));
  let at = 0;
  const starts = segs.map((s, i) => { const a = at; at += s.frames + (i === 0 ? STING : 0); return a; });
  const total = at;
  const subAbs = starts[starts.length - 1] + segs[segs.length - 1].frames - SUB_LEN;
  const chapterStarts = starts.slice(1, -1);
  const dropAt = stories.flatMap((s) => (s.cards ?? []).filter((c) => c.drop).map((c) => starts[segs.indexOf(s)] + c.f));
  return (
    <AbsoluteFill style={{ background: "#03040A" }}>
      <BrandFonts />
      {segs.map((s, i) => (
        <Sequence key={s.name} from={starts[i]} durationInFrames={s.frames}>
          {s.name === "hook" ? <ColdOpen seg={s} tl={tl} /> : s.name === "outro" ? <Outro seg={s} stories={stories} /> : <Chapter seg={s} n={stories.indexOf(s) + 1} total={stories.length} edition={tl.edition} />}
          <Sequence from={s.lead} layout="none"><Audio src={staticFile(s.audio)} /></Sequence>
        </Sequence>
      ))}
      <Sequence from={segs[0].frames} durationInFrames={STING}><LogoSting dark tagline="AI, explained simply." /></Sequence>
      {/* chapter progress */}
      {f > starts[1] && f < subAbs && (
        <div style={{ position: "absolute", left: 90, right: 90, bottom: 18, height: 4, display: "flex", gap: 6 }}>
          {chapterStarts.map((s, i) => {
            const e = i + 1 < chapterStarts.length ? chapterStarts[i + 1] : starts[starts.length - 1];
            return <div key={i} style={{ flex: e - s, background: "rgba(255,255,255,0.15)" }}><div style={{ height: "100%", width: `${Math.min(1, Math.max(0, (f - s) / (e - s))) * 100}%`, background: B.white }} /></div>;
          })}
        </div>
      )}
      <Grain opacity={0.05} />
      {/* music arc: up under the cold open, back for the chapters with a swell at each chapter cut and a dip before
          a `drop` card's number, rising through the last chapter into the subscribe card */}
      <Audio src={A(tl.music ?? "loop_120")} loop volume={(fr) => {
        const base = tl.musicBaseYT ?? 0.08, outroS = starts[starts.length - 1], lastS = starts[starts.length - 2];
        if (fr >= subAbs) return tl.musicBaseYT ? Math.min(1, base * 3) : 0.3;
        if (fr < segs[0].frames) return tl.musicBaseYT ? base * 1.4 : 0.22;
        const v = fr >= outroS ? Math.min(1, interpolate(fr, [outroS, subAbs], [base * 2, base * 3], cl)) : fr >= lastS ? interpolate(fr, [lastS, outroS], [base * 1.2, base * 2], cl) : base;
        const swell = chapterStarts.reduce((g, s) => Math.max(g, interpolate(fr, [s - 16, s - 2, s + 10], [1, 2.2, 1], cl)), 1);
        return Math.min(1, v * swell * dropAt.reduce((g, d) => g * interpolate(fr, [d - 16, d - 7, d - 1, d + 5], [1, 0.25, 0.25, 1], cl), 1));
      }} />
      {dropAt.map((d) => <Sequence key={`d${d}`} from={d - 2} durationInFrames={40} layout="none"><Audio src={A("impact")} volume={0.3} /></Sequence>)}
      {(segs[0].hits ?? []).map((h) => <Sequence key={`h${h}`} from={h - 2} durationInFrames={40} layout="none"><Audio src={A("impact")} volume={0.4} /></Sequence>)}
      {chapterStarts.map((s) => <Sequence key={`w${s}`} from={s} durationInFrames={30} layout="none"><Audio src={A("whoosh")} volume={0.45} /></Sequence>)}
      {stories.map((s) => (s.cards ?? []).map((c, j) => (
        <Sequence key={`${s.name}${j}`} from={starts[segs.indexOf(s)] + c.f - 3} durationInFrames={20} layout="none"><Audio src={A("pop")} volume={0.3} /></Sequence>
      )))}
      <Sequence from={subAbs + 30} durationInFrames={30} layout="none"><Audio src={A("click")} volume={0.8} /></Sequence>
      <Sequence from={subAbs + 32} durationInFrames={60} layout="none"><Audio src={A("bell")} volume={0.5} /></Sequence>
      {total < 0 && null}
    </AbsoluteFill>
  );
};
