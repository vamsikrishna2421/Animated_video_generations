import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Aurora, Grain } from "./Base";
import { B, cl, F, pop, prog } from "./tokens";

// Data + news templates. Rule (from the honesty checklist): illustrative numbers carry `example` so the
// screen says "Example data"; real numbers carry a `source`.

const Tag: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => (
  <div style={{ display: "inline-block", fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 2, padding: "8px 16px", borderRadius: 10, color: dark ? "rgba(255,255,255,0.7)" : "rgba(10,15,36,0.6)", border: `2px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(10,15,36,0.15)"}` }}>{text}</div>
);

/** STAT RINGS: up to 3 gauges filling to their values with count-up numbers. */
export const StatRings: React.FC<{ title: string; stats: { label: string; value: number; color?: string }[]; example?: boolean; source?: string; dark?: boolean }> = ({ title, stats, example, source, dark = false }) => {
  const f = useCurrentFrame();
  const R = 120, C = 2 * Math.PI * R;
  return (
    <AbsoluteFill>
      <Aurora dark={dark} intensity={0.7} />
      <div style={{ position: "absolute", top: 470, left: 80, right: 80, fontFamily: F.inter, fontWeight: 800, fontSize: 84, letterSpacing: -3, lineHeight: 1.05, color: dark ? B.white : B.ink, opacity: prog(f, 0, 14), transform: `translateY(${(1 - prog(f, 0, 14)) * 30}px)` }}>{title}</div>
      <div style={{ position: "absolute", top: 860, left: 50, right: 50, display: "flex", justifyContent: "space-around" }}>
        {stats.map((s, i) => {
          const inS = pop(f, 8 + i * 5, 13);
          const p = prog(f, 12 + i * 5, 50 + i * 5);
          const col = s.color ?? [B.blue, B.violet, B.cyan][i % 3];
          return (
            <div key={i} style={{ width: 300, padding: "34px 0 30px", borderRadius: 40, background: dark ? "rgba(17,22,44,0.85)" : B.white, boxShadow: `0 24px 60px rgba(10,15,36,${dark ? 0.4 : 0.1})`, textAlign: "center", transform: `scale(${inS})` }}>
              <svg width="260" height="260" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={R} fill="none" stroke={dark ? "rgba(255,255,255,0.1)" : "#ECEAF2"} strokeWidth="26" />
                <circle cx="150" cy="150" r={R} fill="none" stroke={col} strokeWidth="26" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (s.value / 100) * p)} transform="rotate(-90 150 150)" />
                <text x="150" y="172" textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize="72" fill={dark ? B.white : B.ink}>{Math.round(s.value * p)}</text>
              </svg>
              <div style={{ marginTop: 10, fontFamily: F.inter, fontWeight: 800, fontSize: 32, color: dark ? "rgba(255,255,255,0.8)" : "rgba(10,15,36,0.75)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1340, left: 80, opacity: prog(f, 40, 54) }}><Tag text={example ? "EXAMPLE DATA" : `SOURCE: ${source ?? "-"}`} dark={dark} /></div>
      <Grain />
    </AbsoluteFill>
  );
};

/** RANK BARS: a ranked list whose bars grow in turn; `highlight` row gets the accent treatment. */
export const RankBars: React.FC<{ title: string; rows: { label: string; value: number }[]; highlight?: number; unit?: string; example?: boolean; source?: string; dark?: boolean }> = ({ title, rows, highlight, unit = "%", example, source, dark = true }) => {
  const f = useCurrentFrame();
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <AbsoluteFill>
      <Aurora dark={dark} intensity={0.5} />
      <div style={{ position: "absolute", top: 330, left: 80, right: 80, fontFamily: F.inter, fontWeight: 800, fontSize: 80, letterSpacing: -3, lineHeight: 1.05, color: dark ? B.white : B.ink, opacity: prog(f, 0, 14) }}>{title}</div>
      <div style={{ position: "absolute", top: 640, left: 70, right: 70 }}>
        {rows.map((r, i) => {
          const inS = prog(f, 6 + i * 4, 20 + i * 4);
          const p = prog(f, 12 + i * 4, 44 + i * 4);
          const hi = i === highlight;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, padding: "22px 28px", marginBottom: 20, borderRadius: 30, background: hi ? "rgba(59,107,255,0.18)" : dark ? "rgba(255,255,255,0.05)" : B.white, border: hi ? `3px solid ${B.blue}` : "3px solid transparent", opacity: inS, transform: `translateX(${(1 - inS) * 80}px)` }}>
              <div style={{ width: 70, fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: hi ? B.amber : dark ? "rgba(255,255,255,0.5)" : "rgba(10,15,36,0.4)" }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: dark ? B.white : B.ink, marginBottom: 14 }}>{r.label}</div>
                <div style={{ height: 22, borderRadius: 11, background: dark ? "rgba(255,255,255,0.08)" : "#ECEAF2" }}>
                  <div style={{ height: "100%", borderRadius: 11, width: `${(r.value / max) * 100 * p}%`, background: hi ? B.grad : dark ? "rgba(255,255,255,0.55)" : B.ink }} />
                </div>
              </div>
              <div style={{ width: 130, textAlign: "right", fontFamily: F.inter, fontWeight: 800, fontSize: 44, color: dark ? B.white : B.ink, fontVariantNumeric: "tabular-nums" }}>{Math.round(r.value * p)}{unit}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 640 + rows.length * 152 + 20, left: 80, opacity: prog(f, 40, 54) }}><Tag text={example ? "EXAMPLE DATA" : `SOURCE: ${source ?? "-"}`} dark={dark} /></div>
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * NEWS FLASH: red "AI NEWS" pill + live dot + date, headline rising line by line, source chip, and a
 * scrolling ticker. For the daily/weekly AI-news format.
 */
export const NewsFlash: React.FC<{ headline: string[]; date: string; source: string; kicker?: string; ticker?: string; example?: boolean }> = ({ headline, date, source, kicker = "AI NEWS", ticker = "Follow for AI news, explained simply", example }) => {
  const f = useCurrentFrame();
  const inS = pop(f, 0, 12);
  const sweep = ((f * 14) % 2600) - 600;
  return (
    <AbsoluteFill style={{ background: B.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <div style={{ position: "absolute", top: sweep, left: 0, right: 0, height: 380, background: "linear-gradient(transparent, rgba(59,107,255,0.10), transparent)" }} />
      <div style={{ position: "absolute", top: 330, left: 80, display: "flex", alignItems: "center", gap: 22, transform: `translateX(${(1 - inS) * -200}px)`, opacity: inS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: B.rose, color: B.white, fontFamily: F.inter, fontWeight: 800, fontSize: 40, letterSpacing: 2, padding: "12px 28px", borderRadius: 14 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: B.white, opacity: f % 30 < 18 ? 1 : 0.25 }} />{kicker}
        </div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: "rgba(255,255,255,0.65)", letterSpacing: 2 }}>{date}</div>
      </div>
      <div style={{ position: "absolute", top: 520, left: 80, right: 80 }}>
        {headline.map((line, i) => {
          const p = prog(f, 8 + i * 6, 24 + i * 6);
          return (
            <div key={i} style={{ overflow: "hidden" }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.inter, fontWeight: 800, fontSize: 104, letterSpacing: -4, lineHeight: 1.05, color: i === headline.length - 1 ? B.cyan : B.white }}>{line}</div>
            </div>
          );
        })}
        <div style={{ marginTop: 50, display: "flex", gap: 18, opacity: prog(f, 30, 44) }}>
          <Tag text={`SOURCE: ${source}`} dark />
          {example && <Tag text="TEMPLATE PREVIEW" dark />}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 330, left: 0, right: 0, height: 92, background: B.white, display: "flex", alignItems: "center", overflow: "hidden", opacity: prog(f, 10, 22) }}>
        <div style={{ flexShrink: 0, height: "100%", padding: "0 30px", background: B.rose, display: "flex", alignItems: "center", fontFamily: F.inter, fontWeight: 800, fontSize: 36, color: B.white, zIndex: 1 }}>LIVE</div>
        <div style={{ whiteSpace: "nowrap", fontFamily: F.inter, fontWeight: 800, fontSize: 40, color: B.ink, transform: `translateX(${1080 - f * 9}px)` }}>
          {Array.from({ length: 4 }, () => `${ticker}   •   `).join("")}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: B.white, opacity: interpolate(f, [0, 3], [0.6, 0], cl) }} />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
