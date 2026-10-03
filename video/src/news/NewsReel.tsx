import React from "react";
import * as Icons from "lucide-react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Aurora, BrandFonts, Grain } from "../brand/Base";
import { Karaoke } from "../brand/Captions";
import { CTA_SFX, FollowCard } from "../brand/Cta";
import { LogoBug } from "../brand/Logo";
import { Wipe } from "../brand/Transitions";
import { B, cl, F, pop, prog } from "../brand/tokens";
import { Fumble, FPose, idle, kf, smugGrin } from "../reel/Fumble";

// Daily AI-news reel (9:16). One timeline per episode/language from pipeline/news_build.py.
type W = { w: string; s: number; e: number };
type Card = { k: string; v: string; f: number };
type Demo = { type: "bars" | "route" | "montage" | "chat" | "fumble" | "sort" | "pipe"; variant?: "s1" | "s2"; items?: { t: string; side: 1 | 2 }[]; steps?: string[]; q?: string; title?: string; note?: string; rows?: { label: string; value: number; show: string; hi?: boolean }[]; tiles?: { icon: string; label: string }[]; bins?: string[]; lines?: { who: string; t: string }[] };
type Seg = {
  name: string; audio: string; lead: number; frames: number; words: W[];
  org?: string; accent?: string; tag?: string; headline?: string[]; sources?: string; cards?: Card[]; lines?: string[][]; demo?: Demo; dek?: string;
};
export type NewsTimeline = { id: string; date: string; range: string; edition: string; lang: string; frames: number; segments: Seg[]; kicker?: string; title?: string; recap?: string; look?: "cards" | "broadcast"; music?: string };
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


/** Animated demo panels for spotlight sections; steps follow the section's card cues. */
const DemoPanel: React.FC<{ d: Demo; cues: number[]; accent: string }> = ({ d, cues, accent }) => {
  const f = useCurrentFrame();
  const step = (i: number) => cues[Math.min(i, cues.length - 1)] ?? 10 + i * 20;
  const box: React.CSSProperties = { position: "absolute", top: 640, left: 60, right: 60, height: 720, borderRadius: 36, background: "rgba(17,22,44,0.82)", border: "2px solid rgba(255,255,255,0.08)", padding: "40px 44px", overflow: "hidden" };
  const title = d.title && <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: accent, marginBottom: 30 }}>{d.title}</div>;
  const note = d.note && <div style={{ position: "absolute", bottom: 30, left: 44, fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 2, color: "rgba(255,255,255,0.45)" }}>{d.note}</div>;
  if (d.type === "bars") {
    const rows = d.rows ?? [];
    const max = Math.max(...rows.map((r) => r.value));
    return (
      <div style={box}>
        {title}
        {rows.map((r, i) => {
          const st = Math.min(step(i), 20 + i * 14);
          const p = prog(f, st - 3, st + 22);
          return (
            <div key={i} style={{ marginBottom: 44, opacity: prog(f, st - 6, st) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: B.white, marginBottom: 14 }}>
                <span>{r.label}</span><span style={{ color: r.hi ? accent : "rgba(255,255,255,0.8)" }}>{r.show}</span>
              </div>
              <div style={{ height: 46, borderRadius: 23, background: "rgba(255,255,255,0.07)" }}>
                <div style={{ height: "100%", borderRadius: 23, width: `${Math.max(1.5, (r.value / max) * 100) * p}%`, background: r.hi ? accent : "rgba(255,255,255,0.45)", boxShadow: r.hi ? `0 0 30px ${accent}88` : "none" }} />
              </div>
            </div>
          );
        })}
        {note}
      </div>
    );
  }
  if (d.type === "route") {
    const bins = d.bins ?? ["BILLING", "TECH", "SALES"];
    return (
      <div style={box}>
        {title}
        <div style={{ position: "absolute", left: 44, right: 44, bottom: 60, display: "flex", gap: 20 }}>
          {bins.map((b, i) => <div key={b} style={{ flex: 1, height: 150, borderRadius: 24, border: `3px dashed ${accent}88`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: accent }}>{b}</div>)}
        </div>
        {Array.from({ length: 8 }, (_, k) => {
          const t0 = step(0) - 6 + k * 9, t = prog(f, t0, t0 + 16);
          if (f < t0) return null;
          const bin = [0, 1, 2, 1, 0, 2, 1, 0][k] % bins.length, conf = [92, 88, 97, 81, 95, 90, 86, 99][k];
          const nb = bins.length, slot = (840 - 20 * (nb - 1)) / nb, pile = [0, 1, 2, 1, 0, 2, 1, 0].slice(0, k).filter((b) => b % nb === bin).length;
          const x = interpolate(t, [0, 1], [390, 44 + bin * (slot + 20) + slot / 2 - 100]), y = interpolate(t, [0, 1], [130, 360 - pile * 34]);
          return (
            <div key={k} style={{ position: "absolute", left: x, top: y, width: 200, padding: "12px 16px", borderRadius: 16, background: B.white, color: B.ink, fontFamily: F.inter, fontWeight: 800, fontSize: 24, boxShadow: "0 10px 24px rgba(0,0,0,0.35)" }}>
              {d.q ?? "Ticket"} #{1040 + k}
              <div style={{ fontFamily: F.mono, fontSize: 20, color: accent === "#38BDF8" ? "#0369A1" : B.blue }}>{bins[bin]} · {conf}%</div>
            </div>
          );
        })}
        {note}
      </div>
    );
  }
  if (d.type === "montage") {
    const tiles = d.tiles ?? [];
    return (
      <div style={box}>
        {title}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
          {tiles.map((t, i) => {
            const s = pop(f, step(i) - 3, 12);
            const Ic = (Icons as unknown as Record<string, React.FC<{ size: number; color: string }>>)[t.icon] ?? Icons.Sparkles;
            return (
              <div key={i} style={{ height: 250, borderRadius: 28, background: `linear-gradient(135deg, ${accent}33, rgba(255,255,255,0.04))`, border: `2px solid ${accent}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, transform: `scale(${s})`, opacity: interpolate(s, [0, 0.3], [0, 1], cl) }}>
                <Ic size={88} color={B.white} />
                <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 36, color: B.white, textAlign: "center", padding: "0 16px" }}>{t.label}</div>
              </div>
            );
          })}
        </div>
        {note}
      </div>
    );
  }
  if (d.type === "fumble") return <FumbleDemo d={d} step={step} accent={accent} box={box} title={title} note={note} />;
  if (d.type === "sort") {
    const items = d.items ?? [];
    const col = (side: 1 | 2) => (side === 1 ? accent : B.violet);
    return (
      <div style={box}>
        {title}
        <div style={{ position: "absolute", left: 44, right: 44, top: 110, display: "flex", gap: 24 }}>
          {([1, 2] as const).map((sd) => (
            <div key={sd} style={{ flex: 1, height: 560, borderRadius: 26, border: `3px solid ${col(sd)}66`, background: `${col(sd)}12` }}>
              <div style={{ textAlign: "center", padding: "18px 0 6px", fontFamily: F.inter, fontWeight: 800, fontSize: 36, color: col(sd) }}>SYSTEM {sd}</div>
              <div style={{ textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: "rgba(255,255,255,0.55)" }}>{sd === 1 ? "FAST · ONE DECISION" : "SLOW · MANY STEPS"}</div>
            </div>
          ))}
        </div>
        {items.map((it, i) => {
          const t0 = step(i), p = prog(f, t0 - 2, t0 + 12);
          if (f < t0 - 2) return null;
          const k = items.slice(0, i).filter((o) => o.side === it.side).length;
          const x = interpolate(p, [0, 1], [190, it.side === 1 ? 20 : 452]), y = interpolate(p, [0, 1], [40, 230 + k * 96]);
          return (
            <div key={i} style={{ position: "absolute", left: 44 + x, top: y, width: 400, padding: "14px 18px", borderRadius: 18, background: B.white, color: B.ink, fontFamily: F.inter, fontWeight: 800, fontSize: 28, lineHeight: 1.15, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", borderLeft: `10px solid ${col(it.side)}`, transform: `scale(${0.9 + 0.1 * p})` }}>{it.t}</div>
          );
        })}
        {note}
      </div>
    );
  }
  if (d.type === "pipe") {
    const items = d.items ?? [];
    return (
      <div style={box}>
        {title}
        <div style={{ position: "absolute", left: 300, top: 250, width: 300, height: 170, borderRadius: 28, background: `${accent}22`, border: `4px solid ${accent}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: accent }}>SYSTEM 1</div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: "rgba(255,255,255,0.7)" }}>DECIDES IN MS</div>
        </div>
        <div style={{ position: "absolute", left: 600, top: 470, width: 300, height: 170, borderRadius: 28, background: `${B.violet}22`, border: `4px solid ${B.violet}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: B.violet }}>SYSTEM 2</div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, color: "rgba(255,255,255,0.7)" }}>THINKS IN SECONDS</div>
        </div>
        <div style={{ position: "absolute", left: 40, top: 520, width: 300, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: B.green }}>ANSWERED INSTANTLY</div>
        {items.map((it, i) => {
          const t0 = step(0) + i * 14, p = prog(f, t0, t0 + 16), q = prog(f, t0 + 18, t0 + 34);
          if (f < t0) return null;
          const hard = it.side === 2;
          const x = p < 1 ? interpolate(p, [0, 1], [0, 330]) : hard ? interpolate(q, [0, 1], [330, 630]) : interpolate(q, [0, 1], [330, 70]);
          const y = p < 1 ? interpolate(p, [0, 1], [130, 300]) : interpolate(q, [0, 1], [300, hard ? 650 : 570]);
          return <div key={i} style={{ position: "absolute", left: 44 + x - 30, top: y, width: 240, padding: "10px 14px", borderRadius: 14, background: B.white, color: B.ink, fontFamily: F.inter, fontWeight: 800, fontSize: 22, opacity: 1 - prog(f, t0 + 50, t0 + 60), borderLeft: `8px solid ${hard ? B.violet : accent}` }}>{it.t}</div>;
        })}
        {note}
      </div>
    );
  }
  // chat replay with a waiting timer
  const lines = d.lines ?? [];
  const waitFrom = step(1), waitTo = step(2);
  const secs = Math.max(0, Math.min(10, ((f - waitFrom) / Math.max(1, waitTo - waitFrom)) * 10));
  return (
    <div style={box}>
      {title}
      {lines.map((l, i) => {
        const s = pop(f, step(i) - 3, 13);
        if (f < step(i) - 3) return null;
        const me = l.who === "user";
        return (
          <div key={i} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", marginBottom: 24, transform: `scale(${s})`, transformOrigin: me ? "right" : "left" }}>
            <div style={{ maxWidth: "78%", padding: "22px 28px", borderRadius: 30, background: me ? B.igBlue : "rgba(255,255,255,0.1)", fontFamily: F.inter, fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: B.white }}>{l.t}</div>
          </div>
        );
      })}
      {f >= waitFrom && f < waitTo + 20 && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10, fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: B.amber }}>
          <div style={{ display: "flex", gap: 10 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 16, height: 16, borderRadius: 8, background: B.amber, opacity: 0.3 + 0.7 * Math.max(0, Math.sin(f / 4 - i)) }} />)}</div>
          silence · {secs.toFixed(1)} s
        </div>
      )}
      {note}
    </div>
  );
};

/** Mr. Fumble acts out the two systems: s1 = instant catch, s2 = working through a sum step by step. */
const FumbleDemo: React.FC<{ d: Demo; step: (i: number) => number; accent: string; box: React.CSSProperties; title: React.ReactNode; note: React.ReactNode }> = ({ d, step, accent, box, title, note }) => {
  const f = useCurrentFrame();
  const t0 = step(0);
  const s1 = d.variant !== "s2";
  let p: FPose = idle(f), clock = 0;
  if (s1) {
    const hit = t0 + 18;
    p = f < hit ? { ...idle(f), lookX: -0.8 } : f < hit + 8 ? { eyeSize: 1.3, browL: 1, browR: 1, mo: 0.5, armL: [150, 10], armR: [-14, -18], handL: "open", lookX: -0.6, lookY: -0.6 } : { ...smugGrin(f), armL: [150, 10], handL: "fist", shut: 0, lid: 0.3 };
    clock = Math.min(0.3, Math.max(0, (f - hit + 6) / 30));
  } else {
    const steps = d.steps ?? [];
    const n = steps.filter((_, i) => f >= step(i + 1) - 2).length;
    p = n < steps.length ? { tilt: 8 + 4 * Math.sin(f / 20), lookY: -0.8, lookX: 0.5, browL: 0.8, browR: -0.4, knit: 0.5, mw: 0.3, skew: 0.5, armL: [30, 150], handL: "point", armR: [-40, -110], handR: "fist", lid: 0.2 } : { ...smugGrin(f), shut: 0, lid: 0.35 };
    clock = Math.max(0, (Math.min(f, step(steps.length) + 10) - t0) / 30);
  }
  const ballT = (f - t0) / 18;
  return (
    <div style={box}>
      {title}
      <div style={{ position: "absolute", right: 44, top: 36, fontFamily: F.mono, fontWeight: 700, fontSize: 46, color: s1 ? accent : B.violet }}>{clock.toFixed(1)} s</div>
      <svg width={960} height={720} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform="translate(300,690) scale(0.5)"><Fumble f={f} p={p} /></g>
        {s1 && ballT > -0.2 && ballT < 1 && <circle cx={kf(ballT, [[0, 960], [1, 190]])} cy={kf(ballT, [[0, 200], [0.5, 120], [1, 270]])} r={30} fill="#F43F5E" stroke="#fff" strokeWidth={5} />}
        {s1 && ballT >= 1 && <circle cx={176} cy={250} r={30} fill="#F43F5E" stroke="#fff" strokeWidth={5} />}
      </svg>
      {!s1 && (
        <div style={{ position: "absolute", left: 520, top: 130, width: 380 }}>
          <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 64, color: B.white, marginBottom: 20 }}>{d.q}</div>
          {(d.steps ?? []).map((st, i) => {
            const a = prog(f, step(i + 1) - 2, step(i + 1) + 8);
            return <div key={i} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: i === (d.steps ?? []).length - 1 ? B.green : "rgba(255,255,255,0.85)", opacity: a, transform: `translateY(${(1 - a) * 20}px)`, marginBottom: 14 }}>{st}</div>;
          })}
        </div>
      )}
      {note}
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
      {seg.demo && <DemoPanel d={seg.demo} cues={cards.map((c) => c.f)} accent={accent} />}
      <div style={{ position: "absolute", top: 640, left: 60, right: 60, display: seg.demo ? "none" : "block" }}>
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
      <div style={{ position: "absolute", top: 1385, left: 60, right: 60, fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 1, color: "rgba(255,255,255,0.65)", opacity: prog(f, 20, 34) }}>SOURCES: {seg.sources?.toUpperCase()}</div>
      <Karaoke words={seg.words} bottom={300} size={86} max={3} />
    </AbsoluteFill>
  );
};


/** Broadcast lower-third: label + headline band + scrolling ticker of the other stories. */
const LowerThird: React.FC<{ label: string; headline: string; ticker: string; accent: string }> = ({ label, headline, ticker, accent }) => {
  const f = useCurrentFrame();
  const s = prog(f, 6, 18);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: `translateY(${(1 - s) * 100}%)` }}>
      <div style={{ display: "flex", alignItems: "stretch", marginLeft: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: B.rose, color: B.white, fontFamily: F.inter, fontWeight: 800, fontSize: 22, letterSpacing: 2, padding: "6px 16px", borderRadius: "10px 10px 0 0" }}>
          <span style={{ width: 11, height: 11, borderRadius: 6, background: B.white, opacity: f % 30 < 18 ? 1 : 0.3 }} />{label}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", background: "linear-gradient(90deg, #FFFFFF, #E9EEFF)", padding: "12px 22px", borderLeft: `12px solid ${accent}` }}>
        <div style={{ fontFamily: F.archivo, fontSize: headline.length > 30 ? 30 : headline.length > 24 ? 34 : 40, lineHeight: 1.05, color: B.ink, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", clipPath: `inset(0 ${(1 - prog(f, 10, 26)) * 100}% 0 0)` }}>{headline}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", height: 46, background: "#0A1030", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, height: "100%", padding: "0 16px", display: "flex", alignItems: "center", background: accent, color: B.night, fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2, zIndex: 1 }}>AI MAASTAARU</div>
        <div style={{ whiteSpace: "nowrap", fontFamily: F.inter, fontWeight: 600, fontSize: 24, color: "rgba(255,255,255,0.9)", transform: `translateX(${900 - f * 5}px)` }}>
          {Array.from({ length: 3 }, () => ticker).join("   •   ")}
        </div>
      </div>
    </div>
  );
};

/** Broadcast story layout: numbered heading banner, dek, framed "on-air" panel with lower third, stat chips. */
const BroadcastStory: React.FC<{ seg: Seg; n: number; total: number; ticker: string }> = ({ seg, n, total, ticker }) => {
  const f = useCurrentFrame();
  const accent = seg.accent ?? B.cyan;
  const cards = seg.cards ?? [];
  const live = Math.max(0, cards.filter((c) => f >= c.f - 3).length - 1);
  const shown = cards.filter((c) => f >= c.f - 3);
  const ban = prog(f, 0, 14);
  const words = seg.words.map((w) => w.w).join(" ");
  const dek = (seg.dek as string | undefined) ?? (words.match(/^.*?[.!?](\s|$)/)?.[0] ?? words).slice(0, 140);
  const cur = cards[live];
  const curIn = cur ? pop(f, cur.f - 3, 12) : 0;
  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />
      {/* heading banner */}
      <div style={{ position: "absolute", top: 210, left: 56, right: 56, display: "flex", gap: 26, opacity: ban, transform: `translateY(${(1 - ban) * -24}px)` }}>
        <div style={{ fontFamily: F.playfair, fontStyle: "italic", fontWeight: 900, fontSize: 170, lineHeight: 0.9, color: accent }}>{String(n).padStart(2, "0")}</div>
        <div style={{ flex: 1, paddingTop: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: "rgba(255,255,255,0.75)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 17, background: accent, color: B.night, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: F.inter, fontWeight: 800, fontSize: 18 }}>{(seg.org ?? "?")[0]}</span>
            {seg.org} · {seg.tag}
            <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.45)" }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          </div>
          {(seg.headline ?? []).map((line, i) => {
            const p = prog(f, 4 + i * 5, 18 + i * 5);
            return (
              <div key={i} style={{ overflow: "hidden" }}>
                <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.archivo, fontSize: Math.max(...(seg.headline ?? [""]).map((l) => l.length)) > 19 ? 52 : Math.max(...(seg.headline ?? [""]).map((l) => l.length)) > 16 ? 60 : 70, letterSpacing: -2, lineHeight: 1.04, color: B.white, whiteSpace: "nowrap" }}>{line}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", top: 455, left: 60, right: 60, fontFamily: F.inter, fontWeight: 600, fontSize: 34, lineHeight: 1.3, color: "rgba(255,255,255,0.82)", opacity: prog(f, 14, 26), display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{dek}</div>
      <div style={{ position: "absolute", top: 600, left: 60, right: 60, fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: "rgba(255,255,255,0.45)", opacity: prog(f, 20, 32) }}>SOURCES: {seg.sources?.toUpperCase()}</div>
      {seg.demo ? (
        <DemoPanel d={seg.demo} cues={cards.map((c) => c.f)} accent={accent} />
      ) : (
        <div style={{ position: "absolute", top: 650, left: 50, right: 50, height: 640, borderRadius: 26, overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", background: `radial-gradient(ellipse at 30% 30%, ${accent}55, #070A18 70%)`, opacity: prog(f, 4, 16), transform: `scale(${0.96 + 0.04 * prog(f, 4, 16)})` }}>
          <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px", backgroundPosition: `0 ${f * 0.8}px` }} />
          <div style={{ position: "absolute", top: 30, left: 34, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: accent }}>{seg.org}</div>
          {!shown.length && (
            <div style={{ position: "absolute", top: 150, left: 40, right: 40, fontFamily: F.archivo, fontSize: 120, lineHeight: 1, color: "rgba(255,255,255,0.12)", opacity: prog(f, 6, 18) }}>{seg.org}</div>
          )}
          {shown.length > 0 && cur && (
            <div style={{ position: "absolute", top: 120, left: 40, right: 40, transform: `translateY(${(1 - curIn) * 50}px)`, opacity: interpolate(curIn, [0, 0.3], [0, 1], cl) }}>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: accent }}>{cur.k}</div>
              <div style={{ marginTop: 14, fontFamily: F.archivo, fontSize: cur.v.length > 26 ? 66 : 84, lineHeight: 1.05, color: B.white }}>{cur.v}</div>
            </div>
          )}
          <LowerThird label={seg.tag ?? "NEWS"} headline={(seg.headline ?? []).join(" ")} ticker={ticker} accent={accent} />
        </div>
      )}
      {false && (
        <div style={{ position: "absolute", top: 1316, left: 56, right: 56, display: "flex", flexWrap: "wrap", gap: 14 }}>
          {shown.map((c, i) => {
            const s = pop(f, c.f - 3, 13);
            return (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "12px 20px", borderRadius: 16, background: i === live ? `${accent}26` : "rgba(255,255,255,0.06)", border: `2px solid ${i === live ? accent : "rgba(255,255,255,0.08)"}`, transform: `scale(${s})` }}>
                <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: 2, color: accent }}>{c.k}</span>
                <span style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 28, color: B.white }}>{c.v}</span>
              </div>
            );
          })}
        </div>
      )}
      <Karaoke words={seg.words} bottom={300} size={80} max={3} />
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
          {s.name === "hook" ? <Hook seg={s} range={tl.range} kicker={tl.kicker} title={tl.title} /> : s.name === "outro" ? <Outro seg={s} stories={stories} handle={handle} recap={tl.recap} /> : tl.look === "broadcast" ? <BroadcastStory seg={s} n={stories.indexOf(s) + 1} total={stories.length} ticker={stories.filter((o) => o !== s).map((o) => (o.headline ?? []).join(" ")).join("   •   ")} /> : <Story seg={s} n={stories.indexOf(s) + 1} total={stories.length} />}
          <Sequence from={s.lead} layout="none"><Audio src={staticFile(s.audio)} /></Sequence>
        </Sequence>
      ))}
      {f < followAbs && <Header edition={tl.edition} date={tl.date} />}
      {f < followAbs && <StoryBars n={stories.length} idx={storyIdx >= 0 ? storyIdx : f >= outroStart ? stories.length : -1} p={storyIdx >= 0 ? (f - starts[idx]) / cur.frames : 0} />}
      {f >= starts[1] && f < followAbs && <LogoBug handle={handle} corner="bl" at={starts[1] + 10} />}
      {starts.slice(1).map((s) => <Wipe key={s} at={s} />)}
      <Grain opacity={0.06} />
      {/* music + SFX */}
      <Audio src={A(tl.music ?? (tl.look === "broadcast" ? "news_120" : "loop_120"))} volume={(fr) => (fr >= followAbs ? 0.35 : tl.look === "broadcast" ? 0.15 : 0.08)} loop />
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
