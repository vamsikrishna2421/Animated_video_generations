import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../lesson/Icon";

// "Case file" scenes: a detective board that investigates an AI (EP25, training data).
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399", red: "#DC2626",
  paper: "#FDFBF4", ink: "#1F2937", muted: "#94A3B8",
  inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif", mono: "'DejaVu Sans Mono', monospace",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const useSpAt = (at: number, damping = 12) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping } });
};
const Tick: React.FC<{ at: number; vol?: number }> = ({ at, vol = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={8} layout="none">
    <Audio src={staticFile("audio/sfx_tick.wav")} volume={vol} />
  </Sequence>
);
const Thud: React.FC<{ at: number }> = ({ at }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={12} layout="none">
    <Audio src={staticFile("audio/sfx_pop.wav")} volume={0.45} />
  </Sequence>
);

// ---------- board + props ----------
export const Board: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #6b4a2b 0%, #4a321c 55%, #25180c 100%)" }}>
    {Array.from({ length: 220 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: random(`k${i}`) * 1080, top: random(`l${i}`) * 1920, width: 3 + random(`m${i}`) * 4, height: 3 + random(`m${i}`) * 4, borderRadius: 3, background: random(`n${i}`) > 0.5 ? "rgba(0,0,0,0.18)" : "rgba(255,220,170,0.08)" }} />
    ))}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
  </AbsoluteFill>
);
const Pin: React.FC<{ x: number; y: number; c?: string }> = ({ x, y, c = C.red }) => (
  <div style={{ position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: 11, background: `radial-gradient(circle at 35% 35%, #fff8, ${c} 45%, #7f1d1d)`, boxShadow: "0 4px 6px rgba(0,0,0,0.5)", zIndex: 5 }} />
);
const Str: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number }> = ({ x1, y1, x2, y2, p }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }}>
    <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={C.red} strokeWidth={5} strokeLinecap="round" />
  </svg>
);
const Stamp: React.FC<{ t: string; at: number; x: number; y: number; c?: string; size?: number; rot?: number; bg?: string }> = ({ t, at, x, y, c = C.red, size = 90, rot = -8, bg = "rgba(255,255,255,0.08)" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = interpolate(f - at, [0, 6], [2.3, 1], cl);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`, border: `7px solid ${c}`, color: c, fontFamily: C.anton, fontSize: size, padding: "0 24px", borderRadius: 14, whiteSpace: "nowrap", background: bg, zIndex: 6, opacity: 0.93 }}>
      {t}
      <Thud at={0} />
    </div>
  );
};
const Tag: React.FC<{ t: string }> = ({ t }) => (
  <div style={{ position: "absolute", top: 262, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div style={{ background: C.paper, color: C.ink, fontFamily: C.mono, fontWeight: 800, fontSize: 30, letterSpacing: 4, padding: "8px 22px", borderRadius: 6, transform: "rotate(-1.5deg)", boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>{t}</div>
  </div>
);

// A canine face: wolf (grey-brown, amber eyes) or husky (dark with white mask, blue eyes). They look alike on purpose.
const Canine: React.FC<{ kind: "wolf" | "husky"; size: number }> = ({ kind, size }) => {
  const w = kind === "wolf";
  const fur = w ? "#7a6f63" : "#374151";
  const light = w ? "#c2b49f" : "#f1f5f9";
  const eye = w ? "#f2c14e" : "#60a5fa";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <polygon points="48,18 82,76 38,88" fill={fur} />
      <polygon points="152,18 162,88 118,76" fill={fur} />
      <polygon points="58,30 76,72 50,80" fill={w ? "#5b534a" : "#fca5a5"} opacity={0.6} />
      <polygon points="142,30 150,80 124,72" fill={w ? "#5b534a" : "#fca5a5"} opacity={0.6} />
      <polygon points="38,82 100,58 162,82 152,142 100,188 48,142" fill={fur} />
      {!w && <polygon points="90,62 110,62 106,112 94,112" fill={light} />}
      {!w && <polygon points="48,120 80,108 86,150 60,150" fill={light} />}
      {!w && <polygon points="152,120 120,108 114,150 140,150" fill={light} />}
      <polygon points="72,122 100,108 128,122 118,168 100,184 82,168" fill={light} />
      <ellipse cx="78" cy="104" rx="9" ry="7" fill={eye} />
      <ellipse cx="122" cy="104" rx="9" ry="7" fill={eye} />
      <circle cx="78" cy="104" r="3.5" fill="#111" />
      <circle cx="122" cy="104" r="3.5" fill="#111" />
      <ellipse cx="100" cy="164" rx="12" ry="8" fill="#111" />
    </svg>
  );
};
type PolP = { x: number; y: number; w: number; rot?: number; bg: "snow" | "grass"; kind: "wolf" | "husky"; label?: string; labelC?: string; heat?: number; pin?: boolean; scale?: number; opacity?: number };
export const Polaroid: React.FC<PolP> = ({ x, y, w, rot = 0, bg, kind, label, labelC = C.ink, heat = 0, pin = true, scale = 1, opacity = 1 }) => {
  const ph = w * 0.86;
  const snow = bg === "snow";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, padding: w * 0.05, paddingBottom: w * 0.2, background: C.paper, boxShadow: "0 14px 30px rgba(0,0,0,0.5)", transform: `rotate(${rot}deg) scale(${scale})`, opacity, zIndex: 3 }}>
      <div style={{ position: "relative", width: "100%", height: ph, overflow: "hidden", background: snow ? "linear-gradient(#b8cfe0 0%, #e8f1f8 45%, #ffffff 100%)" : "linear-gradient(#9ed3f5 0%, #cbe9fb 38%, #7fc47a 40%, #3f8f3b 100%)" }}>
        {snow && Array.from({ length: 26 }, (_, i) => <div key={i} style={{ position: "absolute", left: `${random(`sf${i}${x}`) * 100}%`, top: `${random(`sg${i}${x}`) * 100}%`, width: 6, height: 6, borderRadius: 3, background: "white", opacity: 0.9 }} />)}
        {!snow && Array.from({ length: 14 }, (_, i) => <div key={i} style={{ position: "absolute", left: `${random(`gf${i}${x}`) * 100}%`, top: `${48 + random(`gg${i}${x}`) * 50}%`, width: 4, height: 16, borderRadius: 2, background: "#2f6f2c" }} />)}
        <div style={{ position: "absolute", left: "50%", bottom: "4%", transform: "translateX(-50%)" }}><Canine kind={kind} size={ph * 0.72} /></div>
        {heat > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: heat, mixBlendMode: "multiply" }}>
            <div style={{ position: "absolute", left: "-10%", top: "-5%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(239,68,68,0.95), rgba(250,204,21,0.6) 45%, transparent 70%)" }} />
            <div style={{ position: "absolute", right: "-12%", top: "10%", width: "55%", height: "55%", background: "radial-gradient(circle, rgba(239,68,68,0.9), rgba(250,204,21,0.55) 45%, transparent 70%)" }} />
            <div style={{ position: "absolute", left: "5%", bottom: "-20%", width: "40%", height: "45%", background: "radial-gradient(circle, rgba(250,204,21,0.8), transparent 70%)" }} />
          </div>
        )}
      </div>
      {label && <div style={{ position: "absolute", left: 0, right: 0, bottom: w * 0.035, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: w * 0.085, color: labelC }}>{label}</div>}
      {pin && <Pin x={w / 2} y={6} />}
    </div>
  );
};

// ---------- scene 1: the suspect ----------
const CaseHook: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const mag = cue(1);
  const reveal = cue(2);
  const heat = interpolate(f, [reveal, reveal + 14], [0, 1], cl);
  const mx = interpolate(f, [mag, reveal], [120, 700], cl);
  const my = interpolate(f, [mag, reveal], [420, 470], cl) + Math.sin(f / 5) * 10;
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="CASE FILE #25 · THE AI THAT CHEATED" />
      <Polaroid x={70} y={380} w={440} rot={-4} bg="grass" kind="husky" label={f >= reveal ? "AI looked at: GRASS" : "AI: HUSKY ✓"} labelC={f >= reveal ? C.red : "#15803d"} heat={heat} />
      <Polaroid x={570} y={400} w={440} rot={3} bg="snow" kind="wolf" label={f >= reveal ? "AI looked at: SNOW" : "AI: WOLF ✓"} labelC={f >= reveal ? C.red : "#15803d"} heat={heat} />
      {f >= mag && f < reveal + 20 && (
        <div style={{ position: "absolute", left: mx, top: my, zIndex: 8, opacity: interpolate(f, [reveal + 8, reveal + 20], [1, 0], cl), filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))" }}>
          <Icon name="Search" size={300} color="#fef3c7" stroke={2.2} />
        </div>
      )}
      <div style={{ position: "absolute", left: 90, right: 90, top: 1030, background: "#fef08a", transform: "rotate(-1.5deg)", padding: "22px 28px", boxShadow: "0 12px 24px rgba(0,0,0,0.45)", zIndex: 3 }}>
        <Pin x={470} y={4} c={C.blue} />
        {f < reveal ? (
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 40, color: C.ink }}>Suspect: an AI that gets it right. <span style={{ color: "#b45309" }}>But how?</span></div>
        ) : (
          <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 44, color: C.red }}>Heatmap: it wasn't looking at the animal.</div>
        )}
      </div>
      <Tick at={mag} /><Thud at={reveal} />
    </AbsoluteFill>
  );
};

// ---------- scene 2: the training photos ----------
const CaseReveal: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const wolvesAt = cue(1), huskiesAt = cue(2), ruleAt = cue(3), testAt = cue(4), verdictAt = cue(5);
  const shift = interpolate(f, [testAt - 6, testAt + 10], [0, 1], cl);
  const testS = useSpAt(testAt, 13);
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="EVIDENCE A · THE TRAINING PHOTOS" />
      <div style={{ transform: `translateY(${-10 * shift}px) scale(${1 - 0.2 * shift})`, transformOrigin: "50% 22%" }}>
        {[0, 1, 2].map((i) => (
          <div key={`w${i}`} style={{ opacity: f >= wolvesAt + i * 5 ? 1 : 0 }}>
            <Polaroid x={60 + i * 330} y={360} w={300} rot={[-3, 2, -1][i]} bg="snow" kind="wolf" label="WOLF" />
          </div>
        ))}
        {[0, 1, 2].map((i) => (
          <div key={`h${i}`} style={{ opacity: f >= huskiesAt + i * 5 ? 1 : 0 }}>
            <Polaroid x={60 + i * 330} y={720} w={300} rot={[2, -2, 3][i]} bg="grass" kind="husky" label="HUSKY" />
          </div>
        ))}
        {f >= ruleAt && [0, 1, 2].map((i) => <Str key={i} x1={210 + i * 330} y1={400} x2={540} y2={640} p={interpolate(f, [ruleAt + i * 3, ruleAt + i * 3 + 10], [0, 1], cl)} />)}
        <Stamp t="SNOW = WOLF ?!" at={ruleAt + 8} x={540} y={700} size={84} bg="rgba(253,251,244,0.94)" />
      </div>
      {f >= testAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${(1 - testS) * 500}px)` }}>
          <div style={{ position: "absolute", left: 90, top: 1090, fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: C.paper, letterSpacing: 3 }}>TEST PHOTO:<br />husky, in snow</div>
          <Polaroid x={560} y={960} w={380} rot={-2} bg="snow" kind="husky" label={f >= verdictAt ? "AI: WOLF ✗" : "AI: …"} labelC={f >= verdictAt ? C.red : C.ink} />
        </div>
      )}
      <Stamp t="WRONG" at={verdictAt + 4} x={310} y={1290} size={80} rot={-12} />
      <Tick at={wolvesAt} /><Tick at={huskiesAt} /><Tick at={testAt} />
    </AbsoluteFill>
  );
};

// ---------- scene 3: garbage in, garbage out ----------
const Gigo: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const gin = cue(1), gout = cue(2), rule = cue(3);
  const clean = f >= rule + 6;
  const items = Array.from({ length: 7 }, (_, i) => i);
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="THE GOLDEN RULE" />
      <div style={{ position: "absolute", top: 350, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 118, lineHeight: 1.02, color: C.paper }}>
        <span style={{ opacity: f >= gin ? 1 : 0.15 }}>GARBAGE IN</span>
        <br />
        <span style={{ opacity: f >= gout ? 1 : 0.15, color: f >= gout ? "#fca5a5" : C.paper }}>GARBAGE OUT</span>
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 860, height: 18, borderRadius: 9, background: "#1f2937", boxShadow: "inset 0 3px 6px rgba(0,0,0,0.6)" }} />
      {items.map((i) => {
        const x = ((f * 6 + i * 150) % 1050) - 60;
        const before = x < 440;
        const bad = !clean;
        const icon = before ? (bad ? ["Trash2", "FileWarning", "ImageOff", "Copy"][i % 4] : ["FileCheck", "Image", "FileCheck", "Image"][i % 4]) : bad ? "XCircle" : "CheckCircle2";
        const col = before ? (bad ? "#fca5a5" : "#bbf7d0") : bad ? C.red : C.green;
        return (x < 420 || x > 660) ? (
          <div key={i} style={{ position: "absolute", left: x, top: 770, width: 84, height: 84, borderRadius: 16, background: "rgba(0,0,0,0.45)", border: `3px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={54} color={col} />
          </div>
        ) : null;
      })}
      <div style={{ position: "absolute", left: 410, top: 700, width: 260, height: 240, borderRadius: 30, background: "linear-gradient(145deg, #312e81, #1e1b4b)", border: `5px solid ${clean ? C.green : C.violet}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 0 40px ${clean ? C.green : C.violet}66`, zIndex: 3 }}>
        <Icon name="BrainCircuit" size={120} color="white" />
        <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 30, color: "white" }}>MODEL</div>
      </div>
      <div style={{ position: "absolute", left: 60, top: 980, fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: C.paper }}>DATA IN →</div>
      <div style={{ position: "absolute", right: 60, top: 980, fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: C.paper }}>→ ANSWERS OUT</div>
      {f >= rule && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1090, background: C.paper, transform: `rotate(1deg) scale(${interpolate(f - rule, [0, 6], [0.8, 1], cl)})`, padding: "24px 30px", boxShadow: "0 12px 24px rgba(0,0,0,0.45)", fontFamily: C.inter, fontWeight: 900, fontSize: 46, color: C.ink, textAlign: "center" }}>
          A model only learns what its data shows it.
        </div>
      )}
      <Thud at={gin} /><Thud at={gout} /><Tick at={rule} />
    </AbsoluteFill>
  );
};

// ---------- scene 4: what makes data good ----------
const Checklist: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const cards: [string, string, string, string][] = [
    ["Layers", "QUANTITY", "enough examples", C.blue],
    ["BadgeCheck", "QUALITY", "correct labels, no junk", C.green],
    ["Users", "DIVERSITY", "every place, every person", C.amber],
    ["CalendarClock", "FRESHNESS", "the world hasn't moved on", C.violet],
  ];
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="EVIDENCE B · WHAT GOOD DATA NEEDS" />
      {cards.map(([icon, t, sub, col], i) => {
        const at = cue(i + 1);
        const on = f >= at;
        const sp = useSpAt(at, 12);
        const x = 60 + (i % 2) * 500, y = 360 + Math.floor(i / 2) * 520;
        const n = Math.round(interpolate(f, [at, at + 24], [3, 3000], cl));
        return (
          <div key={t} style={{ position: "absolute", left: x, top: y, width: 460, height: 480, background: C.paper, transform: `rotate(${[-2, 1.5, 1, -1.5][i]}deg) scale(${0.85 + 0.15 * sp})`, opacity: on ? 1 : 0.25, boxShadow: "0 14px 28px rgba(0,0,0,0.45)", padding: 26 }}>
            <Pin x={230} y={4} c={col} />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Icon name={icon} size={56} color={col} stroke={2.6} />
              <div style={{ fontFamily: C.anton, fontSize: 54, color: C.ink }}>{t}</div>
            </div>
            <div style={{ marginTop: 6, fontFamily: C.inter, fontWeight: 700, fontSize: 30, color: "#475569" }}>{sub}</div>
            <div style={{ position: "absolute", left: 26, right: 26, bottom: 26, height: 250, borderRadius: 14, background: "#f1ede2", overflow: "hidden" }}>
              {i === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontFamily: C.anton, fontSize: 96, color: col }}>{on ? n.toLocaleString("en-IN") : 3}</div>
                  <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 26, color: "#475569" }}>photos</div>
                </div>
              )}
              {i === 1 && ["wolf ✓", "husky ✓", "blurry ✗", "duplicate ✗"].map((r, k) => (
                <div key={r} style={{ margin: "14px 20px 0", fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: r.includes("✗") ? C.red : "#15803d", textDecoration: r.includes("✗") && f >= at + 10 + k * 3 ? "line-through" : "none" }}>{r}</div>
              ))}
              {i === 2 && (
                <>
                  <div style={{ position: "absolute", left: 20, top: 12, transform: "scale(0.52)", transformOrigin: "0 0" }}>
                    <Polaroid x={0} y={0} w={300} bg="grass" kind="wolf" label="WOLF" pin={false} />
                  </div>
                  <div style={{ position: "absolute", right: 16, top: 30, display: "grid", gridTemplateColumns: "repeat(3, 44px)", gap: 10 }}>
                    {["#f6d7b0", "#e3b58a", "#c68a5e", "#a0673f", "#7a4a2a", "#4e2f1a"].map((c, k) => (
                      <div key={c} style={{ width: 44, height: 44, borderRadius: 22, background: c, transform: `scale(${interpolate(f - at - k * 3, [0, 6], [0, 1], cl)})` }} />
                    ))}
                  </div>
                  <div style={{ position: "absolute", right: 16, bottom: 18, width: 170, fontFamily: C.inter, fontWeight: 800, fontSize: 22, color: "#475569" }}>wolves on grass too · every skin tone</div>
                </>
              )}
              {i === 3 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontFamily: C.anton, fontSize: 70 }}>
                  <span style={{ color: "#9ca3af", textDecoration: on ? "line-through" : "none" }}>2019</span>
                  <span style={{ color: "#475569" }}>→</span>
                  <span style={{ color: col }}>2026</span>
                </div>
              )}
            </div>
            {on && <div style={{ position: "absolute", right: -14, top: 56, transform: `rotate(12deg) scale(${interpolate(f - at - 8, [0, 6], [2, 1], cl)})`, opacity: f >= at + 8 ? 1 : 0, border: `5px solid ${C.green}`, color: C.green, fontFamily: C.anton, fontSize: 34, padding: "0 12px", borderRadius: 8, background: C.paper }}>CHECKED</div>}
            <Tick at={at} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- scene 5: the surprise exam (train / validation / test) ----------
const DataSplit: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const hide = cue(1), train = cue(2), tune = cue(3), test = cue(4), exam = cue(5);
  const bins: [string, string, number, number, number, string, number][] = [
    ["TRAIN", "learns from these", 60, 560, 80, C.blue, train],
    ["TUNE", "adjusts settings", 600, 800, 10, C.amber, tune],
    ["TEST", "never seen", 840, 1020, 10, C.green, test],
  ];
  const cards = Array.from({ length: 100 }, (_, i) => i);
  const binOf = (i: number) => (i < 80 ? 0 : i < 90 ? 1 : 2);
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="EVIDENCE C · THE SURPRISE EXAM" />
      {bins.map(([t, sub, x0, x1, , col, at]) => (
        <div key={t} style={{ position: "absolute", left: x0, top: 900, width: x1 - x0, height: 460, borderRadius: 20, border: `4px dashed ${f >= at ? col : "rgba(255,255,255,0.25)"}`, background: "rgba(0,0,0,0.25)" }}>
          <div style={{ position: "absolute", top: -64, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 46, color: f >= at ? col : "rgba(255,255,255,0.35)" }}>{t}</div>
          <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 800, fontSize: 22, color: C.paper, opacity: f >= at ? 1 : 0 }}>{sub}</div>
        </div>
      ))}
      {cards.map((i) => {
        const b = binOf(i);
        const at = bins[b][6] + (b === 0 ? (i % 20) : (i % 10));
        const p = interpolate(f, [at, at + 14], [0, 1], cl);
        const gx = 140 + (i % 10) * 82, gy = 380 + Math.floor(i / 10) * 44;
        const shuffle = f >= hide && f < train ? Math.sin((f - hide) / 3 + i) * 10 : 0;
        const k = b === 0 ? i : b === 1 ? i - 80 : i - 90;
        const cols = b === 0 ? 8 : 2;
        const [x0, x1] = [bins[b][2], bins[b][3]];
        const cw = (x1 - x0 - 30) / cols;
        const tx = x0 + 15 + (k % cols) * cw, ty = 930 + Math.floor(k / cols) * 36;
        const x = gx + (tx - gx) * p + shuffle, y = gy + (ty - gy) * p - Math.sin(p * Math.PI) * 80;
        const locked = b === 2 && f >= test + 26;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: Math.min(62, cw - 8) + (1 - p) * 8, height: 30, borderRadius: 5, background: p > 0.5 ? bins[b][5] : C.paper, opacity: locked ? 0.35 : 1, boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }} />;
      })}
      {f >= test + 26 && (
        <div style={{ position: "absolute", left: 875, top: 1060, transform: `scale(${interpolate(f - test - 26, [0, 6], [1.8, 1], cl)})`, zIndex: 6 }}>
          <Icon name="Lock" size={110} color={C.green} stroke={2.6} />
        </div>
      )}
      {f < train && <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", fontFamily: C.mono, fontWeight: 800, fontSize: 28, color: C.paper }}>100 labelled photos</div>}
      <Stamp t="SURPRISE EXAM" at={exam} x={540} y={640} size={96} rot={-6} c={C.green} />
      <Tick at={train} /><Tick at={tune} /><Tick at={test} />
    </AbsoluteFill>
  );
};

// ---------- scene 6: case closed ----------
const CaseClosed: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const truth = cue(1), next = cue(2);
  const nextS = useSpAt(next, 12);
  const follow = next + 40;
  return (
    <AbsoluteFill>
      <Board />
      <div style={{ position: "absolute", left: 80, right: 80, top: 330, height: 560, background: "#e7c98f", borderRadius: "10px 10px 18px 18px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", transform: "rotate(-1deg)" }}>
        <div style={{ position: "absolute", left: 0, top: -40, width: 300, height: 50, background: "#e7c98f", borderRadius: "14px 14px 0 0" }} />
        <div style={{ position: "absolute", left: 40, top: 40, fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: "#78350f", letterSpacing: 3 }}>CASE FILE #25 · TRAINING DATA</div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 110, display: "flex", flexDirection: "column", gap: 22 }}>
          {(s.data.points ?? []).map((p: string, i: number) => (
            <div key={p} style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 38, color: C.ink, opacity: interpolate(f, [8 + i * 6, 14 + i * 6], [0, 1], cl) }}>• {p}</div>
          ))}
        </div>
      </div>
      <Stamp t="CASE CLOSED" at={6} x={600} y={800} size={110} rot={-10} />
      {f >= truth && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 940, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 56, color: C.paper, transform: `scale(${interpolate(f - truth, [0, 6], [0.85, 1], cl)})` }}>
          An AI is only as smart as <span style={{ color: C.amber }}>its data.</span>
        </div>
      )}
      {f >= next && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1100, background: C.paper, padding: "20px 28px", transform: `translateY(${(1 - nextS) * 200}px) rotate(1deg)`, boxShadow: "0 12px 24px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 26, color: "#b45309" }}>NEXT CASE<br />EP 26</div>
          <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 36, color: C.ink }}>The AI that memorised every answer… and still failed.</div>
        </div>
      )}
      {f >= follow && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "14px 60px", borderRadius: 22, background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, fontFamily: C.inter, fontWeight: 800, fontSize: 44, color: "white", transform: `scale(${interpolate(f - follow, [0, 6], [0.7, 1], cl)})` }}>{s.data.cta ?? `Follow ${s.data.handle ?? "@ai_maastaaru"}`}</div>
        </div>
      )}
      <Tick at={next} />
    </AbsoluteFill>
  );
};

export const CASE_SCENES: Record<string, React.FC<SP>> = { case_hook: CaseHook, case_reveal: CaseReveal, gigo: Gigo, checklist: Checklist, datasplit: DataSplit, caseclosed: CaseClosed };
