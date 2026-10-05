import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../lesson/Icon";
import { Backdrop } from "../lesson/Lesson";
import { DAY, Sky } from "./World";

// EP02 "What is an LLM?": phone autocomplete hook, "Happy birthday to…" next-word game, the giant library
// (pre-training), the coach (fine-tuning + human ratings), two words, then the shared quiz / recap scenes.
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399",
  muted: "#94A3B8", inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif", mono: "'DejaVu Sans Mono', monospace",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type ArtP = { d: any; cue: (n: number) => number; frames: number };
type BP = { d: any; cue: (n: number) => number; s: { frames: number } };
const Tick: React.FC<{ at: number; src?: string; vol?: number }> = ({ at, src = "audio/sfx_tick.wav", vol = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={14} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);
const pop = (f: number, at: number) => interpolate(f - at, [0, 7], [0, 1], cl);

// ---------- hook: a phone keyboard suggesting the next word, then the same thing at ChatGPT scale ----------
const Autocomplete: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const big = cue(1), game = cue(2);
  const typed = "Running late, I'll be there in";
  const n = Math.min(typed.length, Math.floor(f / 1.2));
  const sug = ["5 minutes", "a bit", "10"];
  const tapAt = Math.max(n >= typed.length ? typed.length * 1.2 + 10 : 1e9, 0);
  const tapped = f >= tapAt;
  const zoom = spring({ frame: f - big, fps, config: { damping: 16 } });
  const gs = spring({ frame: f - game, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      {/* phone */}
      <div style={{ position: "absolute", left: 240, top: 300, width: 600, height: 1080, borderRadius: 70, background: "#0b0f1d", border: "10px solid #2b3245", boxShadow: "0 40px 90px rgba(0,0,0,0.6)", transform: `scale(${1 - 0.18 * zoom}) translateY(${-120 * zoom}px)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 70, left: 30, right: 30, fontFamily: C.inter, fontWeight: 800, fontSize: 30, color: C.muted }}>Messages</div>
        <div style={{ position: "absolute", right: 30, top: 380, maxWidth: 480, padding: "20px 26px", borderRadius: 30, background: "#2563eb", fontFamily: C.inter, fontWeight: 700, fontSize: 36, color: "white", lineHeight: 1.25 }}>
          {typed.slice(0, n)}{tapped ? " 5 minutes" : ""}<span style={{ opacity: Math.sin(f / 4) > 0 ? 1 : 0 }}>|</span>
        </div>
        {/* suggestion bar */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, height: 90, background: "#1a2033", display: "flex", alignItems: "center" }}>
          {sug.map((w, i) => (
            <div key={w} style={{ flex: 1, textAlign: "center", fontFamily: C.inter, fontWeight: 800, fontSize: 32, color: i === 0 ? C.amber : "white", borderRight: i < 2 ? "2px solid #2b3245" : "none", transform: `scale(${i === 0 && tapped ? 1.15 - 0.15 * pop(f, tapAt) : 1})` }}>{w}</div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 730, bottom: 0, background: "#11162a", display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8, padding: 16 }}>
          {"QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((k, i) => <div key={i} style={{ height: 70, borderRadius: 10, background: "#232a42", color: "#cbd5e1", fontFamily: C.inter, fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", opacity: random(`k${i}${Math.floor(f / 2)}`) > 0.93 && !tapped ? 0.5 : 1 }}>{k}</div>)}
        </div>
        <Tick at={tapAt} src="audio/sfx_pop.wav" />
      </div>
      {f >= big && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1250, textAlign: "center", opacity: zoom }}>
          <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 60, color: "white" }}>ChatGPT = <span style={{ color: C.teal }}>the same trick</span></div>
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 38, color: C.muted, marginTop: 6 }}>trained on way more text</div>
        </div>
      )}
      {f >= game && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 1470, padding: "22px 30px", borderRadius: 26, background: C.amber, textAlign: "center", fontFamily: C.anton, fontSize: 84, color: "#0b0f1d", transform: `scale(${0.6 + 0.4 * gs}) rotate(${-2 * (1 - gs)}deg)`, opacity: gs }}>
          GUESS THE NEXT WORD
        </div>
      )}
      <Tick at={game} src="audio/sfx_pop.wav" vol={0.5} />
    </AbsoluteFill>
  );
};

// ---------- top art: birthday party, someone sings, everyone finishes the line ----------
const Proverb: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const w = 1000, h = 560;
  const say = cue(d.say ?? 1), shout = cue(d.shout ?? 2);
  const person = (x: number, col: string, k: number, s = 1) => (
    <g transform={`translate(${x},${410 + Math.sin(f / 7 + k) * (f >= shout ? 6 : 1)}) scale(${s})`}>
      <rect x={-46} y={-30} width={92} height={140} rx={40} fill={col} />
      <circle cx={0} cy={-80} r={48} fill="#f2c9a5" />
      <path d="M -48,-92 Q 0,-150 48,-92 Q 40,-120 0,-125 Q -40,-120 -48,-92 Z" fill="#2b1d16" />
      <circle cx={-16} cy={-84} r={5} fill="#1f1611" /><circle cx={16} cy={-84} r={5} fill="#1f1611" />
      <ellipse cx={0} cy={-58} rx={f >= shout ? 14 : 9} ry={f >= shout ? 12 : 4} fill="#7a2a2a" />
    </g>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#3b1d5e, #6d2a6b)" }}>
      {/* bunting */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <path d="M 0,40 Q 500,120 1000,40" stroke="#fde68a" strokeWidth={3} fill="none" />
        {Array.from({ length: 14 }, (_, i) => { const x = 35 + i * 70, y = 40 + 80 * 4 * (x / 1000) * (1 - x / 1000) * 0.9; return <path key={i} d={`M ${x - 22},${y} L ${x + 22},${y} L ${x},${y + 40} Z`} fill={["#f43f5e", "#22d3ee", "#facc15", "#34d399"][i % 4]} />; })}
        {/* cake with candles */}
        <rect x={420} y={410} width={160} height={90} rx={12} fill="#f9a8d4" />
        <rect x={420} y={400} width={160} height={24} rx={10} fill="#fff1f2" />
        {[450, 500, 550].map((cx) => <g key={cx}><rect x={cx - 5} y={360} width={10} height={40} fill="#93c5fd" /><ellipse cx={cx} cy={352 + Math.sin(f / 3 + cx) * 2} rx={7} ry={12} fill="#fbbf24" /></g>)}
        {person(170, "#2563eb", 0)}
        {person(830, "#16a34a", 1)}
        {person(300, "#db2777", 2, 0.8)}
        {person(700, "#ea580c", 3, 0.8)}
      </svg>
      {f >= say && (
        <div style={{ position: "absolute", left: 60, top: 110, padding: "16px 24px", borderRadius: 24, background: "white", fontFamily: C.inter, fontWeight: 900, fontSize: 44, color: "#1e1b4b", transform: `scale(${0.7 + 0.3 * pop(f, say)})` }}>
          ♪ Happy birthday to…
        </div>
      )}
      {f >= shout && (
        <div style={{ position: "absolute", right: 60, top: 190, padding: "14px 30px", borderRadius: 24, background: C.amber, fontFamily: C.anton, fontSize: 84, color: "#1e1b4b", transform: `scale(${1.5 - 0.5 * pop(f, shout)}) rotate(4deg)` }}>
          YOU! 🎉
        </div>
      )}
      <Tick at={shout} src="audio/sfx_pop.wav" vol={0.5} />
    </AbsoluteFill>
  );
};

// ---------- top art: a giant library streaming into a brain ----------
const Library: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const w = 1000, h = 560;
  const read = cue(d.read ?? 1), count = cue(d.count ?? 2);
  const n = Math.floor(interpolate(f, [count, count + 60], [0, 1], cl) ** 2 * 15_000_000_000_000);
  const cols = ["#b91c1c", "#1d4ed8", "#047857", "#a16207", "#7c3aed", "#be185d"];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#2a1a12, #120b08)" }}>
      {/* shelves */}
      {Array.from({ length: 4 }, (_, r) => (
        <div key={r} style={{ position: "absolute", left: 0, right: 0, top: 40 + r * 125, height: 115, display: "flex", alignItems: "flex-end", gap: 3, padding: "0 10px", borderBottom: "10px solid #5b3a22", transform: `translateX(${-((f * (0.6 + r * 0.2)) % 60)}px)` }}>
          {Array.from({ length: 48 }, (_, i) => <div key={i} style={{ width: 18 + random(`bw${r}${i}`) * 10, height: 70 + random(`bh${r}${i}`) * 38, background: cols[(i + r) % cols.length], borderRadius: 2 }} />)}
        </div>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 70%)" }} />
      {/* words flying into the model */}
      {f >= read && Array.from({ length: 26 }, (_, i) => {
        const tt = ((f - read) / 40 + random(`wf${i}`)) % 1;
        const sx = random(`sx${i}`) * w, sy = random(`sy${i}`) * h;
        const x = sx + (500 - sx) * tt, y = sy + (300 - sy) * tt;
        return <div key={i} style={{ position: "absolute", left: x, top: y, fontFamily: C.mono, fontWeight: 800, fontSize: 22, color: "#fde68a", opacity: 1 - tt, transform: "translate(-50%,-50%)" }}>{["the", "cat", "def", "river", "love", "<div>", "India", "price", "run"][i % 9]}</div>;
      })}
      {f >= read && (
        <div style={{ position: "absolute", left: 420, top: 220, width: 160, height: 160, borderRadius: 80, background: "rgba(139,92,246,0.25)", border: `5px solid ${C.violet}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${40 + 20 * Math.sin(f / 5)}px ${C.violet}` }}>
          <Icon name="BrainCircuit" size={90} color="white" />
        </div>
      )}
      {f >= count && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", fontFamily: C.mono, fontWeight: 800, fontSize: 46, color: "white", textShadow: "0 3px 12px #000" }}>
          {n.toLocaleString("en-US")} words
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- top art: the coach: replies get thumbs up / down ----------
const Coach: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const ex = cue(d.examples ?? 1), rank = cue(d.rank ?? 2);
  const cards: [string, boolean][] = [["“Here's a 3-step plan…”", true], ["“idk, google it”", false], ["“Sure! Short answer: …”", true]];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky p={DAY} w={1000} h={560} sunX={0.8} sunY={0.2} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(15,23,42,0.35), rgba(15,23,42,0.75))" }} />
      {cards.map(([t, good], i) => {
        const a = ex + i * 8;
        const k = pop(f, a), r = pop(f, rank + i * 10);
        return f >= a ? (
          <div key={i} style={{ position: "absolute", left: 70, right: 200, top: 90 + i * 140, height: 110, borderRadius: 22, background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", padding: "0 28px", fontFamily: C.inter, fontWeight: 800, fontSize: 36, color: "#0f172a", opacity: k, transform: `translateX(${(1 - k) * -60}px)`, boxShadow: f >= rank + i * 10 ? `0 0 0 6px ${good ? C.green : C.rose}` : "none" }}>
            {t}
            {f >= rank + i * 10 && (
              <div style={{ position: "absolute", right: -150, top: 0, width: 110, height: 110, borderRadius: 55, background: good ? C.green : C.rose, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1.4 - 0.4 * r})` }}>
                <Icon name={good ? "ThumbsUp" : "ThumbsDown"} size={60} color="white" />
              </div>
            )}
            <Tick at={rank + i * 10} />
          </div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

// ---------- bottom: next-word probability bars ----------
const NextWord: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const show = cue(d.show ?? 3), pick = cue(d.pick ?? 5);
  const bars: [string, number][] = d.bars;
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 80, fontFamily: C.inter, fontWeight: 900, fontSize: 46, color: "white" }}>
        “{d.context} <span style={{ color: f >= pick ? C.amber : C.muted, borderBottom: `4px solid ${C.amber}` }}>{f >= pick ? bars[0][0] : "___"}</span>”
      </div>
      {bars.map(([w, p], i) => {
        const k = interpolate(f, [show + i * 4, show + i * 4 + 16], [0, 1], cl);
        const win = i === 0 && f >= pick;
        return (
          <div key={w} style={{ position: "absolute", left: 40, right: 40, top: 170 + i * 72, height: 56, display: "flex", alignItems: "center", gap: 18, opacity: 0.25 + 0.75 * k }}>
            <div style={{ width: 150, fontFamily: C.inter, fontWeight: 800, fontSize: 36, color: win ? C.amber : "white" }}>{w}</div>
            <div style={{ flex: 1, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(1.5, p) * k}%`, height: "100%", background: win ? C.amber : `linear-gradient(90deg, ${C.violet}, ${C.teal})` }} />
            </div>
            <div style={{ width: 90, textAlign: "right", fontFamily: C.mono, fontWeight: 800, fontSize: 32, color: "white" }}>{Math.round(p * k)}%</div>
          </div>
        );
      })}
      {d.note && <div style={{ position: "absolute", right: 30, bottom: 16, fontFamily: C.mono, fontSize: 20, color: C.muted, letterSpacing: 2 }}>{String(d.note).toUpperCase()}</div>}
      <Tick at={pick} />
    </>
  );
};

// ---------- bottom: what it read + guess/check/adjust loop ----------
const Corpus: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const loop = cue(d.loop ?? 3);
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 90, display: "flex", gap: 20 }}>
        {(d.items as [string, string, number][]).map(([ic, t, at], i) => {
          const a = cue(at) + i * 6;
          return (
            <div key={t} style={{ flex: 1, height: 150, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: `3px solid ${f >= a ? C.teal : "rgba(255,255,255,0.12)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: f >= a ? 1 : 0.3, transform: `scale(${0.9 + 0.1 * pop(f, a)})` }}>
              <Icon name={ic} size={60} color="white" />
              <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 32, color: "white" }}>{t}</div>
              <Tick at={a} />
            </div>
          );
        })}
      </div>
      {f >= loop && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 290, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {[["Wand2", "guess"], ["CheckCircle2", "check"], ["Wrench", "adjust"]].map(([ic, t], i) => {
            const on = Math.floor((f - loop) / 12) % 3 === i;
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 230, height: 120, borderRadius: 60, background: on ? `${C.amber}33` : "rgba(255,255,255,0.05)", border: `3px solid ${on ? C.amber : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <Icon name={ic} size={44} color={on ? C.amber : "white"} />
                  <span style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 36, color: "white" }}>{t}</span>
                </div>
                {i < 2 && <span style={{ fontFamily: C.anton, fontSize: 44, color: C.muted }}>→</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ---------- bottom: the three stages ----------
const Pipeline: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const stages: [string, string, number][] = d.stages;
  const done = cue(d.done ?? 4);
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 110, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {stages.map(([ic, t, at], i) => {
          const a = at === 0 ? 0 : cue(at);
          const on = f >= a;
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 260, height: 230, borderRadius: 26, background: on ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)", border: `3px solid ${on ? C.teal : "rgba(255,255,255,0.12)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: on ? 1 : 0.35, transform: `scale(${0.92 + 0.08 * pop(f, a)})` }}>
                <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 24, color: C.muted }}>STEP {i + 1}</div>
                <Icon name={ic} size={70} color="white" />
                <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 32, color: "white", textAlign: "center" }}>{t}</div>
              </div>
              {i < stages.length - 1 && <span style={{ fontFamily: C.anton, fontSize: 50, color: C.muted }}>→</span>}
              <Tick at={a} />
            </div>
          );
        })}
      </div>
      {f >= done && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 380, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 44, color: C.green, transform: `scale(${0.8 + 0.2 * pop(f, done)})` }}>
          = a chat assistant ✓
        </div>
      )}
    </>
  );
};

// ---------- glossary: a few terms as big cards ----------
const Glossary: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const terms: [string, string, number, string][] = s.data.terms;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 62, color: "white" }}>
        {terms.length === 2 ? "Two" : terms.length} words <span style={{ color: C.teal }}>you'll hear everywhere</span>
      </div>
      {terms.map(([t, def, at, ic], i) => {
        const a = cue(at), k = pop(f, a);
        return (
          <div key={t} style={{ position: "absolute", left: 70, right: 70, top: 480 + i * 400, height: 340, borderRadius: 32, background: f >= a ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.04)", border: `4px solid ${f >= a ? C.violet : "rgba(255,255,255,0.1)"}`, opacity: 0.25 + 0.75 * k, transform: `translateY(${(1 - k) * 40}px)`, display: "flex", alignItems: "center", gap: 40, padding: "0 50px" }}>
            <div style={{ width: 170, height: 170, borderRadius: 85, background: "rgba(34,211,238,0.15)", border: `4px solid ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={ic} size={96} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 66, color: "white" }}>{t}</div>
              <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 40, color: C.muted, marginTop: 8, lineHeight: 1.2 }}>{def}</div>
            </div>
            <Tick at={a} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const EP02_SCENES: Record<string, React.FC<SP>> = { autocomplete: Autocomplete, glossary: Glossary };
export const EP02_ART: Record<string, React.FC<ArtP>> = { proverb: Proverb, library: Library, coach: Coach };
export const EP02_BOTTOM: Record<string, React.FC<BP>> = { nextword: NextWord, corpus: Corpus, pipeline: Pipeline };
