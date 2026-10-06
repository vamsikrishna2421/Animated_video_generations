import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../lesson/Icon";
import { Board, Pin, Stamp, Tag, Thud, Tick, useSpAt } from "./CaseFile";

// "Case file" scenes for EP26: overfitting vs underfitting.
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399", red: "#DC2626",
  paper: "#FDFBF4", ink: "#1F2937", muted: "#94A3B8",
  inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif", mono: "'DejaVu Sans Mono', monospace",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const Note: React.FC<{ y: number; children: React.ReactNode; rot?: number; bg?: string }> = ({ y, children, rot = -1.5, bg = "#fef08a" }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top: y, background: bg, transform: `rotate(${rot}deg)`, padding: "22px 28px", boxShadow: "0 12px 24px rgba(0,0,0,0.45)", zIndex: 3 }}>
    <Pin x={450} y={4} c={C.blue} />
    {children}
  </div>
);

// ---------- scene 1: the report card ----------
const OfHook: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const exam = cue(1), score = cue(2), why = cue(3);
  const n = Math.round(interpolate(f, [score, score + 16], [100, 52], cl));
  const row = (label: string, val: string, col: string, on: boolean, y: number) => (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: on ? 1 : 0.18 }}>
      <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 46, color: C.ink }}>{label}</div>
      <div style={{ fontFamily: C.anton, fontSize: 120, color: col }}>{val}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="CASE FILE #26 · THE AI THAT MEMORISED" />
      <div style={{ position: "absolute", left: 80, right: 80, top: 360, height: 620, background: C.paper, transform: "rotate(-1deg)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <Pin x={460} y={6} />
        <div style={{ position: "absolute", left: 60, top: 50, display: "flex", alignItems: "center", gap: 18 }}>
          <Icon name="Bot" size={70} color={C.violet} stroke={2.4} />
          <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 34, color: "#78350f", letterSpacing: 3 }}>REPORT CARD · AI MODEL</div>
        </div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 150, height: 3, background: "#e5dccb" }} />
        {row("PRACTICE", "100%", "#15803d", true, 190)}
        {row("REAL EXAM", f >= score ? `${n}%` : "?", f >= score ? C.red : C.muted, f >= exam, 400)}
      </div>
      <Stamp t="FAILED" at={score + 16} x={540} y={1060} size={120} rot={-8} />
      <Note y={1200}>
        {f < why ? (
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 42, color: C.ink }}>Perfect in practice. <span style={{ color: "#b45309" }}>Lost in the exam.</span></div>
        ) : (
          <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 44, color: C.red }}>What went wrong?</div>
        )}
      </Note>
      <Tick at={exam} /><Thud at={why} />
    </AbsoluteFill>
  );
};

// ---------- scene 2: the answer key ----------
const OfAnswerKey: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const key = cue(1), practice = cue(2), change = cue(3), lost = cue(4);
  const keyS = useSpAt(0, 13), prS = useSpAt(practice, 13), exS = useSpAt(change, 13);
  const answers = ["Q1: TRUE", "Q2: FALSE", "Q3: FALSE", "Q4: TRUE"];
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="EVIDENCE A · THE ANSWER KEY" />
      <div style={{ position: "absolute", left: 70, top: 360, width: 440, height: 520, background: "#fef3c7", transform: `rotate(-3deg) scale(${0.6 + 0.4 * keyS})`, opacity: 1, boxShadow: "0 14px 28px rgba(0,0,0,0.45)", padding: 30 }}>
        <Pin x={220} y={4} />
        <div style={{ fontFamily: C.anton, fontSize: 52, color: C.ink }}>ANSWER KEY</div>
        <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 32, color: "#92400e", marginBottom: 12 }}>memorised, not understood</div>
        {answers.map((a, i) => (
          <div key={a} style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 40, marginTop: 12, opacity: interpolate(f, [4 + i * 5, 10 + i * 5], [0, 1], cl), color: f >= key ? "#b45309" : C.ink }}>{a}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 560, top: 380, width: 450, height: 500, background: C.paper, transform: `rotate(2deg) scale(${0.6 + 0.4 * prS})`, opacity: f >= practice ? 1 : 0, boxShadow: "0 14px 28px rgba(0,0,0,0.45)", padding: 30 }}>
        <Pin x={225} y={4} c={C.green} />
        <div style={{ fontFamily: C.anton, fontSize: 48, color: C.ink }}>PRACTICE PAPER</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: C.inter, fontWeight: 800, fontSize: 34, color: C.ink, marginTop: 18 }}>
            <span>Question {i + 1}</span><span style={{ color: "#15803d" }}>✓</span>
          </div>
        ))}
        <div style={{ position: "absolute", right: 30, bottom: 24, fontFamily: C.anton, fontSize: 80, color: "#15803d" }}>100%</div>
      </div>
      {f >= change && (
        <div style={{ position: "absolute", left: 110, right: 110, top: 960, background: C.paper, transform: `translateY(${(1 - exS) * 500}px) rotate(-1deg)`, boxShadow: "0 14px 28px rgba(0,0,0,0.45)", padding: "26px 34px" }}>
          <Pin x={430} y={4} c={C.red} />
          <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 32, color: "#b45309", letterSpacing: 1 }}>REAL EXAM · SAME TOPIC, NEW WORDING</div>
          {["The same question, asked a new way", "A new example of the same idea"].map((q, i) => (
            <div key={q} style={{ display: "flex", justifyContent: "space-between", gap: 20, fontFamily: C.inter, fontWeight: 800, fontSize: 34, color: C.ink, marginTop: 18 }}>
              <span>{q}</span><span style={{ color: C.red, opacity: f >= lost + i * 5 ? 1 : 0 }}>✗</span>
            </div>
          ))}
        </div>
      )}
      <Stamp t="OVERFITTING" at={lost + 12} x={540} y={1330} size={100} rot={-6} />
      <Tick at={key} /><Tick at={practice} /><Tick at={change} />
    </AbsoluteFill>
  );
};

// ---------- scene 3: three fits of the same dots ----------
const DOTS = Array.from({ length: 13 }, (_, i) => {
  const x = i / 12;
  const noise = [0.09, -0.12, 0.07, 0.13, -0.1, 0.06, -0.14, 0.1, -0.06, 0.12, -0.09, 0.05, -0.11][i];
  return { x, y: 0.5 + 0.32 * Math.sin(x * Math.PI * 1.6 - 0.4) + noise };
});
const trend = (x: number) => 0.5 + 0.32 * Math.sin(x * Math.PI * 1.6 - 0.4);
const Graph: React.FC<{ y: number; kind: "over" | "under" | "right"; at: number; label: string; sub: string; col: string }> = ({ y, kind, at, label, sub, col }) => {
  const f = useCurrentFrame();
  const W = 600, H = 300, px = (x: number) => 20 + x * (W - 40), py = (v: number) => H - 20 - v * (H - 40);
  const p = interpolate(f, [at, at + 20], [0, 1], cl);
  let pts: [number, number][] = [];
  if (kind === "over") pts = DOTS.map((d) => [px(d.x), py(d.y)]);
  if (kind === "under") pts = [[px(0), py(0.38)], [px(1), py(0.6)]];
  if (kind === "right") pts = Array.from({ length: 41 }, (_, i) => [px(i / 40), py(trend(i / 40))]);
  const path = (kind === "over"
    ? pts.map((q, i) => (i === 0 ? `M${q[0]},${q[1]}` : `C${pts[i - 1][0] + 18},${pts[i - 1][1] - (i % 2 ? 60 : -60)} ${q[0] - 18},${q[1] + (i % 2 ? 60 : -60)} ${q[0]},${q[1]}`)).join(" ")
    : pts.map((q, i) => `${i === 0 ? "M" : "L"}${q[0]},${q[1]}`).join(" "));
  const on = f >= at;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, height: 340, background: C.paper, boxShadow: "0 12px 24px rgba(0,0,0,0.45)", transform: `rotate(${kind === "under" ? 1 : -0.8}deg)`, opacity: on ? 1 : 0.35 }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 10, top: 20 }}>
        <line x1={20} y1={H - 20} x2={W - 10} y2={H - 20} stroke="#cbd5e1" strokeWidth={3} />
        <line x1={20} y1={10} x2={20} y2={H - 20} stroke="#cbd5e1" strokeWidth={3} />
        {DOTS.map((d, i) => <circle key={i} cx={px(d.x)} cy={py(d.y)} r={9} fill="#334155" />)}
        <path d={path} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
      <div style={{ position: "absolute", left: 650, right: 24, top: 70 }}>
        <div style={{ fontFamily: C.anton, fontSize: 56, color: on ? col : C.muted, lineHeight: 1 }}>{label}</div>
        <div style={{ marginTop: 10, fontFamily: C.inter, fontWeight: 800, fontSize: 33, lineHeight: 1.15, color: "#475569", opacity: on ? 1 : 0 }}>{sub}</div>
      </div>
      <Tick at={at} />
    </div>
  );
};
const OfCurves: React.FC<SP> = ({ cue }) => (
  <AbsoluteFill>
    <Board />
    <Tag t="EVIDENCE B · SAME DOTS, THREE FITS" />
    <Graph y={350} kind="over" at={cue(1)} label="OVERFIT" sub="hits every dot, even the random mistakes" col={C.red} />
    <Graph y={730} kind="under" at={cue(2)} label="UNDERFIT" sub="too simple: misses the pattern" col={C.amber} />
    <Graph y={1110} kind="right" at={cue(3)} label="JUST RIGHT" sub="follows the real trend" col="#15803d" />
  </AbsoluteFill>
);

// ---------- scene 4: the alarm (training vs validation score) ----------
const OfGap: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const two = cue(1), train = cue(2), val = cue(3), stop = cue(4);
  const W = 900, H = 640, px = (x: number) => 80 + x * (W - 110), py = (v: number) => H - 60 - v * (H - 110);
  const tr = (x: number) => 0.5 + 0.5 * (1 - Math.exp(-4 * x));
  const va = (x: number) => (x < 0.42 ? 0.5 + 0.3 * Math.sin((x / 0.42) * Math.PI / 2) : 0.8 - 0.55 * Math.pow((x - 0.42) / 0.58, 1.4) * 0.6);
  const N = 60;
  const ptr = Array.from({ length: N + 1 }, (_, i) => [px(i / N), py(tr(i / N))]);
  const pva = Array.from({ length: N + 1 }, (_, i) => [px(i / N), py(va(i / N))]);
  const d = (pts: number[][]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0]},${q[1]}`).join(" ");
  const pT = interpolate(f, [two, train + 10], [0, 1], cl), pV = interpolate(f, [val, val + 24], [0, 1], cl);
  const gap = interpolate(f, [stop, stop + 12], [0, 1], cl);
  const area = `M${px(0.42)},${py(tr(0.42))} ` + ptr.filter((q) => q[0] >= px(0.42)).map((q) => `L${q[0]},${q[1]}`).join(" ") + " " + [...pva].reverse().filter((q) => q[0] >= px(0.42)).map((q) => `L${q[0]},${q[1]}`).join(" ") + " Z";
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="EVIDENCE C · THE ALARM" />
      <div style={{ position: "absolute", left: 60, top: 360, width: 960, height: 760, background: C.paper, boxShadow: "0 14px 28px rgba(0,0,0,0.45)" }}>
        <Pin x={480} y={6} />
        <svg width={W} height={H} style={{ position: "absolute", left: 30, top: 60 }}>
          <line x1={80} y1={H - 60} x2={W - 20} y2={H - 60} stroke="#94a3b8" strokeWidth={3} />
          <line x1={80} y1={30} x2={80} y2={H - 60} stroke="#94a3b8" strokeWidth={3} />
          <text x={W / 2} y={H - 14} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={28} fill="#475569">training time →</text>
          <text x={30} y={40} fontFamily="Inter" fontWeight={800} fontSize={26} fill="#475569">score</text>
          <path d={area} fill={C.red} opacity={0.22 * gap} />
          <path d={d(ptr)} fill="none" stroke={C.blue} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pT} strokeLinecap="round" />
          <path d={d(pva)} fill="none" stroke={C.green} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pV} strokeLinecap="round" />
          {gap > 0 && <line x1={px(0.42)} y1={30} x2={px(0.42)} y2={H - 60} stroke={C.red} strokeWidth={5} strokeDasharray="14 10" opacity={gap} />}
        </svg>
        <div style={{ position: "absolute", right: 40, top: 70, fontFamily: C.inter, fontWeight: 900, fontSize: 32, color: C.blue, opacity: pT }}>TRAINING (practice)</div>
        <div style={{ position: "absolute", right: 40, top: 560, fontFamily: C.inter, fontWeight: 900, fontSize: 32, color: "#15803d", opacity: pV }}>VALIDATION (unseen data)</div>
        {gap > 0 && <div style={{ position: "absolute", left: 30 + px(0.42) - 110, top: 20, fontFamily: C.anton, fontSize: 40, color: C.red, opacity: gap }}>STOP HERE</div>}
      </div>
      <Note y={1200} rot={1} bg={C.paper}>
        <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 40, color: C.ink, textAlign: "center" }}>
          {f < stop ? "Two scores: practice vs unseen data" : <>When the unseen score <span style={{ color: C.red }}>starts falling</span>, stop.</>}
        </div>
      </Note>
      <Tick at={train} /><Tick at={val} /><Thud at={stop} />
    </AbsoluteFill>
  );
};

// ---------- scene 5: the fixes ----------
const OfFixes: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const cards: [string, string, string, string][] = [
    ["Database", "MORE DATA", "more examples, more variety", C.blue],
    ["Minimize2", "SIMPLER MODEL", "fewer ways to memorise", C.violet],
    ["Hand", "STOP EARLY", "when unseen scores drop", C.green],
    ["TrendingUp", "BIGGER MODEL", "+ train longer", C.amber],
  ];
  const under = cue(4);
  return (
    <AbsoluteFill>
      <Board />
      <Tag t="THE FIXES" />
      <div style={{ position: "absolute", left: 60, top: 350, fontFamily: C.anton, fontSize: 52, color: "#fca5a5" }}>OVERFITTING?</div>
      {cards.slice(0, 3).map(([icon, t, sub, col], i) => {
        const at = cue(i + 1);
        const sp = useSpAt(at, 12);
        return (
          <div key={t} style={{ position: "absolute", left: 60, right: 60, top: 430 + i * 200, height: 170, background: C.paper, transform: `rotate(${[-1.2, 1, -0.8][i]}deg) scale(${0.85 + 0.15 * sp})`, opacity: f >= at ? 1 : 0.2, boxShadow: "0 12px 24px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", gap: 30, padding: "0 36px" }}>
            <Pin x={480} y={4} c={col} />
            <Icon name={icon} size={90} color={col} stroke={2.6} />
            <div>
              <div style={{ fontFamily: C.anton, fontSize: 60, color: C.ink }}>{t}</div>
              <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 36, color: "#475569" }}>{sub}</div>
            </div>
            <Tick at={at} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 60, top: 1060, fontFamily: C.anton, fontSize: 52, color: "#fcd34d", opacity: f >= under ? 1 : 0.2 }}>UNDERFITTING? DO THE OPPOSITE</div>
      {(() => {
        const [icon, t, sub, col] = cards[3];
        const sp = useSpAt(under, 12);
        return (
          <div style={{ position: "absolute", left: 60, right: 60, top: 1140, height: 170, background: "#fef3c7", transform: `rotate(1deg) scale(${0.85 + 0.15 * sp})`, opacity: f >= under ? 1 : 0.2, boxShadow: "0 12px 24px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", gap: 30, padding: "0 36px" }}>
            <Pin x={480} y={4} c={col} />
            <Icon name={icon} size={90} color={col} stroke={2.6} />
            <div>
              <div style={{ fontFamily: C.anton, fontSize: 60, color: C.ink }}>{t}</div>
              <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 36, color: "#475569" }}>{sub}</div>
            </div>
            <Thud at={under} />
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

export const OVERFIT_SCENES: Record<string, React.FC<SP>> = { of_hook: OfHook, of_answerkey: OfAnswerKey, of_curves: OfCurves, of_gap: OfGap, of_fixes: OfFixes };
