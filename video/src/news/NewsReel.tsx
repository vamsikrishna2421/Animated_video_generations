import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Aurora, BrandFonts, Grain } from "../brand/Base";
import { Karaoke } from "../brand/Captions";
import { CTA_SFX, FollowCard } from "../brand/Cta";
import { LogoBug } from "../brand/Logo";
import { Wipe } from "../brand/Transitions";
import { B, cl, F, pop, prog } from "../brand/tokens";

// Daily AI-news reel (9:16). One timeline per episode/language from pipeline/news_build.py.
type W = { w: string; s: number; e: number };
type Card = { k: string; v: string; f: number };
type Seg = {
  name: string; audio: string; lead: number; frames: number; words: W[];
  org?: string; accent?: string; tag?: string; headline?: string[]; sources?: string; cards?: Card[]; lines?: string[][];
};
export type NewsTimeline = { id: string; date: string; range: string; edition: string; lang: string; frames: number; segments: Seg[]; kicker?: string; title?: string; recap?: string };
const A = (f: string) => staticFile(`brand/audio/brand_${f}.wav`);
const FOLLOW_LEN = 140;

const Backdrop: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const sweep = ((f * 12) % 2800) - 700;
  return (
    <AbsoluteFill style={{ background: B.night, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -300, top: 200, width: 1100, height: 1100, borderRadius: "50%", background: `radial-gradient(circle, ${accent}55, transparent 65%)`, transform: `translate(${Math.sin(f / 50) * 60}px, ${Math.cos(f / 60) * 50}px)` }} />
      <div style={{ position: "absolute", right: -400, bottom: -100, width: 1200, height: 1200, borderRadius: "50%", background: `radial-gradient(circle, ${B.blue}33, transparent 65%)` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <div style={{ position: "absolute", top: sweep, left: 0, right: 0, height: 360, background: `linear-gradient(transparent, ${accent}14, transparent)` }} />
    </AbsoluteFill>
  );
};

/** Instagram-stories style progress bars: one per story. */
const StoryBars: React.FC<{ n: number; idx: number; p: number }> = ({ n, idx, p }) => (
  <div style={{ position: "absolute", top: 70, left: 50, right: 50, display: "flex", gap: 10 }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(i < idx ? 1 : i === idx ? p : 0) * 100}%`, background: B.white }} />
      </div>
    ))}
  </div>
);

const Header: React.FC<{ edition: string; date: string }> = ({ edition, date }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 110, left: 60, right: 60, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: B.rose, color: B.white, fontFamily: F.inter, fontWeight: 800, fontSize: 30, letterSpacing: 2, padding: "8px 20px", borderRadius: 10 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: B.white, opacity: f % 30 < 18 ? 1 : 0.3 }} />{edition}
      </div>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2, color: "rgba(255,255,255,0.6)" }}>{date}</div>
    </div>
  );
};

const Story: React.FC<{ seg: Seg; n: number; total: number }> = ({ seg, n, total }) => {
  const f = useCurrentFrame();
  const accent = seg.accent ?? B.cyan;
  const chip = pop(f, 2, 13);
  const cards = seg.cards ?? [];
  const live = cards.filter((c) => f >= c.f - 3).length - 1;
  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />
      <div style={{ position: "absolute", top: 230, left: 60, right: 60, display: "flex", alignItems: "center", gap: 16, transform: `translateX(${(1 - chip) * -120}px)`, opacity: chip }}>
        <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 34, letterSpacing: 2, color: B.night, background: accent, padding: "10px 24px", borderRadius: 12 }}>{seg.org}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: accent, border: `2px solid ${accent}`, padding: "8px 16px", borderRadius: 10 }}>{seg.tag}</div>
        <div style={{ marginLeft: "auto", fontFamily: F.mono, fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.55)" }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", top: 340, left: 60, right: 60 }}>
        {(seg.headline ?? []).map((line, i) => {
          const p = prog(f, 4 + i * 5, 18 + i * 5);
          return (
            <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.inter, fontWeight: 800, fontSize: 92, letterSpacing: -3, lineHeight: 1.04, color: i === (seg.headline ?? []).length - 1 ? accent : B.white }}>{line}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 640, left: 60, right: 60 }}>
        {cards.map((c, i) => {
          const s = pop(f, c.f - 3, 13);
          if (f < c.f - 3) return null;
          const dim = i < live ? 0.55 : 1;
          return (
            <div key={i} style={{ display: "flex", marginBottom: 26, borderRadius: 26, overflow: "hidden", background: "rgba(17,22,44,0.82)", border: `2px solid ${i === live ? accent : "rgba(255,255,255,0.08)"}`, transform: `translateX(${(1 - s) * 140}px) scale(${0.94 + 0.06 * s})`, opacity: interpolate(s, [0, 0.3], [0, 1], cl) * dim, boxShadow: i === live ? `0 18px 50px ${accent}33` : "none" }}>
              <div style={{ width: 14, background: accent }} />
              <div style={{ padding: "22px 30px 26px" }}>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: accent }}>{c.k}</div>
                <div style={{ marginTop: 8, fontFamily: F.inter, fontWeight: 800, fontSize: 50, lineHeight: 1.12, color: B.white }}>{c.v}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1490, left: 60, right: 60, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.5)", opacity: prog(f, 20, 34) }}>SOURCES: {seg.sources?.toUpperCase()}</div>
      <Karaoke words={seg.words} bottom={300} size={86} max={3} />
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ seg: Seg; range: string; kicker?: string; title?: string }> = ({ seg, range, kicker = "YOUR WEEK IN AI", title = "AI NEWS" }) => {
  const f = useCurrentFrame();
  // the last sentence ("Here's your AI news...") swaps to the title card
  const lastStart = seg.words.find((w, i) => i > 0 && /^here/i.test(w.w))?.s ?? seg.frames - 60;
  const tc = prog(f, lastStart - 4, lastStart + 8);
  const shake = f < 14 ? (14 - f) * 1.4 : 0;
  return (
    <AbsoluteFill>
      <Backdrop accent={B.rose} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 70px", opacity: 1 - tc, transform: `translate(${Math.sin(f * 9) * shake}px, 0)` }}>
        {(seg.lines ?? []).map((parts, li) => {
          const p = prog(f, 2 + li * 30, 16 + li * 30);
          return (
            <div key={li} style={{ overflow: "hidden", marginBottom: 20 }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.inter, fontWeight: 800, fontSize: 118, letterSpacing: -5, lineHeight: 1.02, color: B.white }}>
                {parts.map((t, i) => <span key={i} style={{ color: i === 1 ? (li === 0 ? B.rose : B.amber) : undefined }}>{t}</span>)}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: tc, transform: `scale(${0.9 + 0.1 * tc})` }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: B.rose }}>{kicker}</div>
        <div style={{ marginTop: 18, fontFamily: F.inter, fontWeight: 800, fontSize: title.length > 8 ? 120 : 150, letterSpacing: -6, color: B.white, lineHeight: 1, textAlign: "center" }}>{title}</div>
        <div style={{ marginTop: 24, fontFamily: F.inter, fontWeight: 800, fontSize: 56, color: B.cyan }}>{range}</div>
      </AbsoluteFill>
      <Karaoke words={seg.words} bottom={300} size={86} max={3} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ seg: Seg; stories: Seg[]; handle: string; recap?: string }> = ({ seg, stories, handle, recap }) => {
  const f = useCurrentFrame();
  const followAt = seg.frames - FOLLOW_LEN;
  return (
    <AbsoluteFill>
      <Backdrop accent={B.violet} />
      {f < followAt && (
        <div style={{ position: "absolute", top: 240, left: 60, right: 60 }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: B.cyan, marginBottom: 26 }}>{recap ?? `THIS WEEK IN ${stories.length} STORIES`}</div>
          {stories.map((s, i) => {
            const p = prog(f, 4 + i * 4, 16 + i * 4);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 20, opacity: p, transform: `translateX(${(1 - p) * 80}px)` }}>
                <div style={{ width: 16, height: 70, borderRadius: 8, background: s.accent }} />
                <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: B.white }}>{(s.headline ?? []).join(" ")}</div>
              </div>
            );
          })}
        </div>
      )}
      {f >= followAt && (
        <Sequence from={followAt} layout="none">
          <Aurora dark intensity={0.8} />
          <FollowCard handle={handle} />
        </Sequence>
      )}
      {f < followAt && <Karaoke words={seg.words} bottom={300} size={86} max={3} />}
    </AbsoluteFill>
  );
};

export const NewsReel: React.FC<{ tl: NewsTimeline; handle: string }> = ({ tl, handle }) => {
  const f = useCurrentFrame();
  const stories = tl.segments.filter((s) => s.name.startsWith("story"));
  let at = 0;
  const starts = tl.segments.map((s) => { const a = at; at += s.frames; return a; });
  const idx = tl.segments.findIndex((_, i) => f >= starts[i] && f < starts[i] + tl.segments[i].frames);
  const cur = tl.segments[idx] ?? tl.segments[0];
  const storyIdx = stories.indexOf(cur);
  const outroStart = starts[starts.length - 1];
  const followAbs = outroStart + tl.segments[tl.segments.length - 1].frames - FOLLOW_LEN;
  return (
    <AbsoluteFill style={{ background: B.night }}>
      <BrandFonts />
      {tl.segments.map((s, i) => (
        <Sequence key={s.name} from={starts[i]} durationInFrames={s.frames}>
          {s.name === "hook" ? <Hook seg={s} range={tl.range} kicker={tl.kicker} title={tl.title} /> : s.name === "outro" ? <Outro seg={s} stories={stories} handle={handle} recap={tl.recap} /> : <Story seg={s} n={stories.indexOf(s) + 1} total={stories.length} />}
          <Sequence from={s.lead} layout="none"><Audio src={staticFile(s.audio)} /></Sequence>
        </Sequence>
      ))}
      {f < followAbs && <Header edition={tl.edition} date={tl.date} />}
      {f < followAbs && <StoryBars n={stories.length} idx={storyIdx >= 0 ? storyIdx : f >= outroStart ? stories.length : -1} p={storyIdx >= 0 ? (f - starts[idx]) / cur.frames : 0} />}
      {f >= starts[1] && f < followAbs && <LogoBug handle={handle} corner="bl" at={starts[1] + 10} />}
      {starts.slice(1).map((s) => <Wipe key={s} at={s} />)}
      <Grain opacity={0.06} />
      {/* music + SFX */}
      <Audio src={A("loop_120")} volume={(fr) => (fr >= followAbs ? 0.35 : 0.12)} loop />
      {starts.slice(1).map((s) => <Sequence key={`w${s}`} from={s - 8} durationInFrames={30} layout="none"><Audio src={A("whoosh")} volume={0.4} /></Sequence>)}
      {stories.map((s) => (s.cards ?? []).map((c, j) => (
        <Sequence key={`${s.name}${j}`} from={starts[tl.segments.indexOf(s)] + c.f - 3} durationInFrames={20} layout="none"><Audio src={A("pop")} volume={0.35} /></Sequence>
      )))}
      <Sequence from={followAbs + CTA_SFX.follow.click} durationInFrames={30} layout="none"><Audio src={A("click")} volume={0.8} /></Sequence>
      <Sequence from={followAbs + CTA_SFX.follow.heart} durationInFrames={30} layout="none"><Audio src={A("heart")} volume={0.6} /></Sequence>
      <Sequence from={followAbs + CTA_SFX.follow.chime} durationInFrames={60} layout="none"><Audio src={A("chime")} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
