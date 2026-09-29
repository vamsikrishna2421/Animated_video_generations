import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Icon } from "../lesson/Icon";
import { Mascot } from "../lesson/Mascot";
import { Quiz } from "../lesson/scenes/Quiz";
import { Chintu } from "./Chintu";

// v2 "entertainment" reel: memes, multiple characters, karaoke captions, fast cuts.
const C = {
  bg: "#070A18",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  teal: "#22D3EE",
  amber: "#F59E0B",
  rose: "#F43F5E",
  green: "#34D399",
  text: "#F8FAFC",
  muted: "#94A3B8",
  inter: "Inter, 'DejaVu Sans', sans-serif",
  anton: "Anton, Impact, 'DejaVu Sans', sans-serif",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outline = "0 0 2px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 8px 30px rgba(0,0,0,0.7)";

type Word = { w: string; from: number; to: number };
type Line = { who: string; name: string; color: string; sub?: string | null; audio: string; from: number; frames: number; words: Word[]; cues: Record<string, number> };
type Scene = { id: string; type: string; data: any; from: number; frames: number; lines: Line[] };
export type ReelTimeline = { id: string; title: string; handle: string; label: string; fps: number; totalFrames: number; music: string; scenes: Scene[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const useSp = (at: number, damping = 12) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping } });
};
const Boom: React.FC<{ at: number; vol?: number }> = ({ at, vol = 0.7 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40} layout="none">
    <Audio src={staticFile("reel/sfx_boom.wav")} volume={vol} />
  </Sequence>
);
const Pop: React.FC<{ at: number }> = ({ at }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={10} layout="none">
    <Audio src={staticFile("audio/sfx_pop.wav")} volume={0.6} />
  </Sequence>
);
const shakeXY = (f: number, at: number, amt = 22) => {
  const k = f >= at ? Math.exp(-(f - at) / 5) : 0;
  return `translate(${Math.sin(f * 2.7) * amt * k}px, ${Math.cos(f * 3.3) * amt * k}px)`;
};

// ---------------- backgrounds ----------------
const Rays: React.FC<{ c1: string; c2: string }> = ({ c1, c2 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: "45%", width: 3000, height: 3000, transform: `translate(-50%,-50%) rotate(${f * 0.4}deg)`, background: `repeating-conic-gradient(${c1} 0deg 10deg, ${c2} 10deg 20deg)`, opacity: 0.55 }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, transparent 0%, rgba(7,10,24,0.85) 70%)" }} />
    </AbsoluteFill>
  );
};

// ---------------- scene: meme with labels ----------------
const MemeScene: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const d = s.data;
  const at = cue(d.shakeAt ?? 1);
  const zoom = interpolate(f, [0, s.frames], [1, 1.08]) * (f >= at ? 1 + 0.08 * Math.exp(-(f - at) / 6) : 1);
  return (
    <AbsoluteFill>
      <Rays c1="#1a1f45" c2="#0d1130" />
      <div style={{ position: "absolute", top: 330, left: 50, right: 50, textAlign: "center", fontFamily: C.anton, fontSize: 92, lineHeight: 1.02, color: "white", textTransform: "uppercase", textShadow: outline }}>{d.top}</div>
      <div style={{ position: "absolute", top: 560, left: 40, right: 40, transform: `${shakeXY(f, at)} scale(${zoom})`, borderRadius: 28, overflow: "hidden", border: "6px solid white", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <Img src={staticFile(`reel/memes/${d.img}`)} style={{ width: "100%", display: "block" }} />
        {(d.labels ?? []).map(([t, x, y]: [string, number, number], i: number) => {
          const on = f >= at ? 1 : 0.9;
          return (
            <div key={t} style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%,-50%) scale(${on * (f >= at && f < at + 8 ? 1.25 : 1)}) rotate(${i % 2 ? 4 : -4}deg)`, background: f >= at ? C.rose : "#000", color: "white", fontFamily: C.anton, fontSize: 58, padding: "6px 22px", borderRadius: 14, border: "4px solid white" }}>
              {t}
            </div>
          );
        })}
      </div>
      <Boom at={at} />
    </AbsoluteFill>
  );
};

// ---------------- scene: two-character dialogue ----------------
const Character: React.FC<{ who: "chintu" | "maastaaru"; active: boolean; talking: boolean; x: number }> = ({ who, active, talking, x }) => {
  const f = useCurrentFrame();
  const s = active ? 1.06 : 0.88;
  const col = who === "chintu" ? C.teal : C.amber;
  return (
    <div style={{ position: "absolute", left: x, top: 660, width: 440, textAlign: "center", transform: `scale(${s}) translateY(${active ? Math.sin(f / 4) * 6 : 0}px)`, opacity: active ? 1 : 0.55, transition: "none" }}>
      <div style={{ width: 400, height: 400, margin: "0 auto", borderRadius: "50%", border: `10px solid ${col}`, background: "#1E1B4B", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: active ? `0 0 60px ${col}` : "none" }}>
        {who === "chintu" ? <Chintu size={380} talking={talking} /> : <Mascot size={380} talking={talking} variant="female" />}
      </div>
      <div style={{ marginTop: 18, display: "inline-block", background: col, color: "#0A0F24", fontFamily: C.inter, fontWeight: 800, fontSize: 40, padding: "6px 26px", borderRadius: 30 }}>{who === "chintu" ? "Chintu" : "Maastaaru"}</div>
    </div>
  );
};
const talkingAt = (l: Line | undefined, f: number) => !!l && l.words.some((w) => f >= w.from && f < w.to) && Math.floor(f / 4) % 2 === 0;
const lineAt = (s: Scene, f: number) => s.lines.find((l) => f >= l.from && f < l.from + l.frames + 4);

const Dialogue: React.FC<SP> = ({ s }) => {
  const f = useCurrentFrame();
  const l = lineAt(s, f);
  const who = l?.who ?? s.lines[0].who;
  return (
    <AbsoluteFill>
      <Rays c1="#12305a" c2="#0b1c3a" />
      <Character who="chintu" active={who === "chintu"} talking={who === "chintu" && talkingAt(l, f)} x={40} />
      <Character who="maastaaru" active={who === "maastaaru"} talking={who === "maastaaru" && talkingAt(l, f)} x={600} />
      {who === "chintu" &&
        ["?", "?", "!?"].map((q, i) => (
          <div key={i} style={{ position: "absolute", left: 90 + i * 130, top: 470 + Math.sin(f / 5 + i) * 20, fontFamily: C.anton, fontSize: 120 + i * 20, color: C.teal, textShadow: outline, transform: `rotate(${(i - 1) * 15}deg)` }}>{q}</div>
        ))}
      {who === "maastaaru" && (
        <div style={{ position: "absolute", left: 700, top: 470, transform: `scale(${1 + 0.05 * Math.sin(f / 5)})` }}>
          <Icon name="Lightbulb" size={150} color={C.amber} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------- scene: cricket last ball ----------------
const Cricket: React.FC<SP> = ({ s, cue, line }) => {
  const f = useCurrentFrame();
  const hit = cue(1);
  const out = cue(2);
  const p = interpolate(f, [hit, out], [0, 1], cl);
  const ballX = 540 + p * 330;
  const ballY = 1150 - Math.sin(p * Math.PI) * 650 - p * 120;
  const lost = f >= out;
  const sad = f >= line(1).from;
  const sadS = useSp(line(1).from, 10);
  return (
    <AbsoluteFill style={{ transform: shakeXY(f, out, 28) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 80%, #1f7a3a 0%, #0f4d24 45%, #07210f 80%)" }} />
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`cx${i}`) * 1080, top: 250 + random(`cy${i}`) * 180, width: 8, height: 8, borderRadius: 4, background: ["#fff", C.amber, C.teal, C.rose][i % 4], opacity: 0.5 + 0.5 * Math.sin(f / 3 + i) }} />
      ))}
      <div style={{ position: "absolute", left: 470, top: 900, width: 140, height: 520, background: "linear-gradient(#c9a86a, #a88748)", borderRadius: 10, transform: "perspective(800px) rotateX(55deg)" }} />
      <div style={{ position: "absolute", top: 440, left: 70, right: 70, background: "#050505", border: `5px solid ${lost ? C.rose : C.amber}`, borderRadius: 24, padding: "22px 30px", fontFamily: "'DejaVu Sans Mono', monospace", color: lost ? C.rose : C.amber, fontSize: 52, fontWeight: 800, textAlign: "center", boxShadow: `0 0 40px ${lost ? C.rose : C.amber}66` }}>
        {lost ? "INDIA LOST BY 5 RUNS" : "IND 179/7  ·  NEED 6 OFF 1"}
      </div>
      {f >= hit && f < out + 20 && <div style={{ position: "absolute", left: ballX, top: ballY, width: 46, height: 46, borderRadius: 23, background: "radial-gradient(circle at 35% 35%, #fff, #d33 60%, #800)", boxShadow: "0 0 30px white" }} />}
      {lost && (
        <div style={{ position: "absolute", top: 760, left: 0, right: 0, textAlign: "center", transform: `scale(${interpolate(f - out, [0, 6], [2.5, 1], cl)}) rotate(-8deg)`, fontFamily: C.anton, fontSize: 280, color: C.rose, textShadow: outline }}>OUT!</div>
      )}
      {sad && (
        <div style={{ position: "absolute", top: 1070, left: 220, right: 220, transform: `scale(${sadS})`, borderRadius: 20, overflow: "hidden", border: "5px solid white" }}>
          <Img src={staticFile("reel/memes/fine.png")} style={{ width: "100%", display: "block" }} />
          <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 44, color: "white", textShadow: outline }}>INDIAN FANS RIGHT NOW</div>
        </div>
      )}
      <Boom at={out} vol={0.8} />
    </AbsoluteFill>
  );
};

// ---------------- scene: blame chain (backprop, cricket edition) ----------------
const Blame: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const chain: [string, string, number][] = [...s.data.chain].reverse(); // batsman, captain, selectors
  const start = cue(1);
  const pulseY = interpolate(f, [start, cue(4) + 10], [470, 1260], cl);
  return (
    <AbsoluteFill>
      <Rays c1="#3a1020" c2="#1e0812" />
      <div style={{ position: "absolute", top: 300, left: 60, right: 60, height: 150, borderRadius: 30, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, fontFamily: C.anton, fontSize: 90, color: "white", boxShadow: `0 0 50px ${C.rose}` }}>
        <Icon name="X" size={90} color="white" stroke={4} /> RESULT: LOST
      </div>
      {f >= start && <div style={{ position: "absolute", left: 530, top: 450, width: 20, height: Math.max(0, pulseY - 450), background: `linear-gradient(${C.rose}, ${C.rose}00)`, borderRadius: 10 }} />}
      {f >= start && <div style={{ position: "absolute", left: 510, top: pulseY - 30, width: 60, height: 60, borderRadius: 30, background: C.rose, boxShadow: `0 0 50px ${C.rose}` }} />}
      {chain.map(([role, layer, pct], i) => {
        const at = cue(i + 2);
        const sp = useSp(at, 11);
        const lit = f >= at;
        return (
          <div key={role} style={{ position: "absolute", top: 520 + i * 250, left: 60, right: 60, height: 210, borderRadius: 30, background: "rgba(20,10,20,0.9)", border: `5px solid ${lit ? C.rose : "#555"}`, padding: "20px 34px", transform: `scale(${0.92 + 0.08 * sp})`, opacity: 0.45 + 0.55 * sp }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: C.anton, fontSize: 76, color: "white" }}>
                <Icon name="Pointer" size={60} color={C.amber} /> {role}
              </div>
              <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 40, color: "#0A0F24", background: C.teal, padding: "6px 20px", borderRadius: 20 }}>= {layer}</div>
            </div>
            <div style={{ marginTop: 20, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.1)", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${pct * interpolate(f, [at, at + 20], [0, 1], cl)}%`, height: "100%", background: `linear-gradient(90deg, ${C.amber}, ${C.rose})` }} />
              <div style={{ position: "absolute", right: 16, top: 2, fontFamily: C.inter, fontWeight: 800, fontSize: 34, color: "white" }}>{lit ? `${pct}% blame` : ""}</div>
            </div>
            <Pop at={at} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- scene: neural net backprop + third umpire ----------------
const Net: React.FC<SP> = ({ s, cue, line }) => {
  const f = useCurrentFrame();
  const layers = [3, 4, 4, 1];
  const X = (i: number) => 150 + i * 260;
  const Y = (i: number, j: number) => 820 + (j - (layers[i] - 1) / 2) * 180;
  const back = cue(1);
  const blame = cue(2);
  const umpire = line(1).from;
  const umpS = useSp(umpire, 12);
  const edges: [number, number, number, number, number][] = [];
  layers.forEach((n, i) => {
    if (i === layers.length - 1) return;
    for (let a = 0; a < n; a++) for (let b = 0; b < layers[i + 1]; b++) edges.push([i, a, i + 1, b, random(`e${i}${a}${b}`)]);
  });
  return (
    <AbsoluteFill>
      <Rays c1="#15123a" c2="#0a0922" />
      <div style={{ position: "absolute", top: 320, left: 60, right: 60, textAlign: "center", fontFamily: C.anton, fontSize: 96, color: "white", textShadow: outline }}>
        ERROR FLOWS <span style={{ color: C.rose }}>BACKWARD</span>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {edges.map(([i, a, i2, b, r], k) => {
          const on = f >= back;
          const reach = interpolate(f, [back + (3 - i2) * 12, back + (3 - i2) * 12 + 12], [0, 1], cl);
          const w = f >= blame ? 2 + r * 10 : 3;
          return <line key={k} x1={X(i)} y1={Y(i, a)} x2={X(i2)} y2={Y(i2, b)} stroke={on && reach > 0 ? C.rose : "rgba(255,255,255,0.25)"} strokeWidth={w} opacity={on ? 0.35 + 0.65 * reach : 1} />;
        })}
        {layers.map((n, i) =>
          Array.from({ length: n }, (_, j) => <circle key={`${i}${j}`} cx={X(i)} cy={Y(i, j)} r={i === 3 ? 48 : 38} fill={i === 3 ? C.rose : "#1E1B4B"} stroke={i === 3 ? "white" : C.teal} strokeWidth={6} />)
        )}
        {f >= back &&
          [0, 1, 2].map((k) => {
            const p = ((f - back) / 30 + k / 3) % 1;
            const seg = Math.min(2, Math.floor(p * 3));
            const lt = p * 3 - seg;
            const x = X(3 - seg) + (X(2 - seg) - X(3 - seg)) * lt;
            return <circle key={k} cx={x} cy={820 + Math.sin(p * 9 + k) * 120} r={16} fill={C.amber} opacity={0.9} />;
          })}
      </svg>
      {f >= blame && f < umpire &&
        [0.8, 0.3, 0.6].map((w, i) => (
          <div key={i} style={{ position: "absolute", left: 170 + i * 260, top: 1160, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 40, color: C.amber, textShadow: outline }}>
            {w.toFixed(1)} → {(w - 0.1 * (i + 1)).toFixed(1)}
          </div>
        ))}
      {f >= umpire && (
        <div style={{ position: "absolute", top: 1030, left: 40, right: 40, transform: `translateX(${(1 - umpS) * 1200}px)`, background: "#0b3d1f", border: `6px solid ${C.green}`, borderRadius: 24, padding: "20px 30px", display: "flex", alignItems: "center", gap: 24 }}>
          <Icon name="MonitorPlay" size={90} color={C.green} />
          <div>
            <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: C.green }}>THIRD UMPIRE REVIEW</div>
            <div style={{ fontFamily: C.anton, fontSize: 80, color: "white" }}>FAIR BLAME ✓</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------- scene: drake ----------------
const Drake: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const yes = cue(1);
  const d = s.data;
  const noS = useSp(4, 12);
  const yesS = useSp(yes, 10);
  return (
    <AbsoluteFill style={{ background: "#fff8e1" }}>
      <div style={{ position: "absolute", top: 330, left: 50, width: 480, borderRadius: 20, overflow: "hidden", border: "5px solid #111" }}>
        <Img src={staticFile("reel/memes/drake.png")} style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ position: "absolute", top: 390, left: 560, right: 50, height: 300, display: "flex", alignItems: "center", fontFamily: C.anton, fontSize: 78, lineHeight: 1.05, color: "#111", opacity: noS, transform: `translateX(${(1 - noS) * 300}px)` }}>
        {d.no}
      </div>
      <div style={{ position: "absolute", top: 760, left: 560, right: 50, height: 340, display: "flex", alignItems: "center", fontFamily: C.anton, fontSize: 70, lineHeight: 1.05, color: "#0a7a3a", opacity: yesS, transform: `scale(${0.6 + 0.4 * yesS})` }}>
        {d.yes}
      </div>
      <Pop at={yes} />
    </AbsoluteFill>
  );
};

// ---------------- scene: filmy mass moment ----------------
const Mass: React.FC<SP> = ({ s, line }) => {
  const f = useCurrentFrame();
  const g = line(1).from;
  const gS = useSp(g, 8);
  const zoom = interpolate(f, [0, s.frames], [1.25, 1]);
  const flash = f % 23 < 2 ? 0.5 : 0;
  return (
    <AbsoluteFill style={{ transform: shakeXY(f, 0, 30) }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #7a1010 0%, #2a0505 55%, #000 90%)" }} />
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`m${i}`) * 1080, top: 1900 - ((f * (6 + random(`mv${i}`) * 10) + random(`my${i}`) * 1900) % 1900), width: 6, height: 18, background: C.amber, opacity: 0.6, borderRadius: 3 }} />
      ))}
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center", transform: `scale(${zoom})` }}>
        <Icon name="Search" size={260} color={C.amber} stroke={2.5} />
        <div style={{ fontFamily: C.anton, fontSize: 250, lineHeight: 1, letterSpacing: 6, background: "linear-gradient(180deg, #fff 0%, #ffd27a 45%, #b36b00 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 10px 20px #000)" }}>{s.data.title}</div>
        <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 48, letterSpacing: 10, color: "white", marginTop: 10 }}>{s.data.tag.toUpperCase()}</div>
      </div>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 210, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 250, background: "#000" }} />
      {f >= g && (
        <div style={{ position: "absolute", top: 1010, left: 0, right: 0, textAlign: "center", transform: `scale(${gS}) rotate(-6deg) translateX(${Math.sin(f * 3) * 6}px)`, fontFamily: C.anton, fontSize: 130, color: C.teal, textShadow: outline }}>GOOSEBUMPS!</div>
      )}
    </AbsoluteFill>
  );
};

// ---------------- scene: stonks ----------------
const Stonks: React.FC<SP> = ({ s, cue, line }) => {
  const f = useCurrentFrame();
  const st = line(1).from;
  const p = interpolate(f, [cue(1), st], [0, 1], cl);
  const rounds = Math.floor(interpolate(p, [0, 1], [1, 1000000]) ** 1);
  const pts = Array.from({ length: 30 }, (_, i) => [60 + i * 32, 330 - (i / 29) ** 1.3 * 260 + (random(`st${i}`) - 0.5) * 30]);
  const shown = Math.max(2, Math.floor(p * pts.length));
  return (
    <AbsoluteFill>
      <Rays c1="#0b2a4a" c2="#06182c" />
      <div style={{ position: "absolute", top: 320, left: 40, right: 40, borderRadius: 24, overflow: "hidden", border: "6px solid white", transform: shakeXY(f, st, 24) }}>
        <Img src={staticFile("reel/memes/stonks.png")} style={{ width: "100%", display: "block" }} />
        {f >= st && <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 170, color: "white", textShadow: outline, transform: `scale(${interpolate(f - st, [0, 6], [2, 1], cl)})` }}>STONKS</div>}
      </div>
      <div style={{ position: "absolute", top: 1050, left: 60, right: 60, height: 360, borderRadius: 24, background: "rgba(0,0,0,0.6)", border: `3px solid ${C.green}` }}>
        <svg width={960} height={360} style={{ position: "absolute", inset: 0 }}>
          <polyline points={pts.slice(0, shown).map((q) => q.join(",")).join(" ")} fill="none" stroke={C.green} strokeWidth={10} strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", top: 16, left: 26, fontFamily: C.inter, fontWeight: 800, fontSize: 36, color: C.green }}>ACCURACY ↑</div>
        <div style={{ position: "absolute", bottom: 16, right: 26, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 34, color: "white" }}>round {rounds.toLocaleString("en-IN")}</div>
      </div>
      <Boom at={st} />
    </AbsoluteFill>
  );
};

// ---------------- scene: quiz (reuses the lesson quiz) ----------------
const QuizScene: React.FC<SP> = ({ s, cue }) => (
  <AbsoluteFill>
    <Rays c1="#1b1440" c2="#0c0a24" />
    <Quiz data={{ ...s.data, badge: "QUICK TEST", commentPrompt: "Got it? Comment below!" }} cue={(i) => cue(i + 1)} duration={s.frames} image={undefined as any} />
  </AbsoluteFill>
);

// ---------------- scene: outro ----------------
const Outro: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const cta = cue(1);
  const ctaS = useSp(cta, 11);
  const tap = cta + 30;
  const followed = f >= tap;
  return (
    <AbsoluteFill>
      <Rays c1="#2a1a05" c2="#140c02" />
      <div style={{ position: "absolute", top: 290, left: 380, right: 380, borderRadius: 24, overflow: "hidden", border: "6px solid white", transform: `scale(${1 - 0.2 * ctaS}) translateY(${-60 * ctaS}px)` }}>
        <div style={{ overflow: "hidden", aspectRatio: "340 / 678" }}>
          <Img src={staticFile(`reel/memes/${s.data.img}`)} style={{ width: "200%", marginLeft: "-100%", display: "block" }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 1030 - 170 * ctaS, opacity: 1 - ctaS, left: 50, right: 50, textAlign: "center", fontFamily: C.anton, fontSize: 84, lineHeight: 1.05, color: "white", textShadow: outline }}>{s.data.label}</div>
      {f >= cta && (
        <div style={{ position: "absolute", top: 1010, left: 0, right: 0, textAlign: "center", opacity: ctaS }}>
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 70, color: C.amber }}>@ai_maastaaru</div>
          <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 16, padding: "22px 70px", borderRadius: 26, background: followed ? "rgba(255,255,255,0.15)" : `linear-gradient(135deg, ${C.blue}, ${C.violet})`, fontFamily: C.inter, fontWeight: 800, fontSize: 56, color: "white", transform: `scale(${f >= tap && f < tap + 5 ? 0.9 : 1})` }}>
            {followed ? <><Icon name="Check" size={52} color="white" stroke={3.5} /> Following</> : "Follow"}
          </div>
        </div>
      )}
      <Pop at={tap} />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<SP>> = { meme: MemeScene, dialogue: Dialogue, cricket: Cricket, blame: Blame, net: Net, drake: Drake, mass: Mass, stonks: Stonks, quiz: QuizScene, outro: Outro };

// ---------------- karaoke captions + speaker tag ----------------
const chunks = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (cur.length >= 3 || /[,.!?]$/.test(w.w)) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};
const Captions: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame();
  const l = lineAt(s, f);
  if (!l) return null;
  const cs = chunks(l.words);
  const c = cs.find((ch, i) => f < (cs[i + 1]?.[0].from ?? l.from + l.frames + 4)) ?? cs[cs.length - 1];
  if (!c) return null;
  const pop = interpolate(f - c[0].from, [0, 4], [0.85, 1], cl);
  return (
    <div style={{ position: "absolute", top: 1440, left: 40, right: 40, textAlign: "center" }}>
      {l.name && (
        <div style={{ display: "inline-block", marginBottom: 14, background: l.color, color: "#0A0F24", fontFamily: C.inter, fontWeight: 800, fontSize: 34, padding: "4px 22px", borderRadius: 20 }}>{l.name}</div>
      )}
      <div style={{ transform: `scale(${pop})` }}>
        {c.map((w, i) => {
          const on = f >= w.from;
          return (
            <span key={i} style={{ display: "inline-block", margin: "0 18px", fontFamily: C.anton, fontSize: 96, lineHeight: 1.05, textTransform: "uppercase", color: on ? (f < w.to + 2 ? C.amber : "white") : "rgba(255,255,255,0.45)", textShadow: outline, transform: `scale(${on && f < w.to + 2 ? 1.12 : 1})` }}>
              {w.w}
            </span>
          );
        })}
      </div>
      {l.sub && <div style={{ marginTop: 14, fontFamily: C.inter, fontWeight: 700, fontStyle: "italic", fontSize: 40, color: "white", textShadow: outline }}>"{l.sub}"</div>}
    </div>
  );
};

const SceneWrap: React.FC<{ s: Scene; first: boolean }> = ({ s, first }) => {
  const f = useCurrentFrame();
  const cue = (n: number) => {
    for (const l of s.lines) if (l.cues[String(n)] !== undefined) return l.cues[String(n)];
    return Math.round(s.frames * (n / 5));
  };
  const line = (i: number) => s.lines[Math.min(i, s.lines.length - 1)];
  const Comp = SCENES[s.type];
  const inP = first ? 1 : interpolate(f, [0, 5], [0, 1], cl);
  return (
    <AbsoluteFill style={{ opacity: inP, transform: `scale(${first ? 1 : 1.12 - 0.12 * inP})` }}>
      {Comp ? <Comp s={s} cue={cue} line={line} /> : null}
      <Captions s={s} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{ tl: ReelTimeline }> = ({ tl }) => {
  const f = useCurrentFrame();
  const talking = tl.scenes.some((s) => s.lines.some((l) => f >= s.from + l.from - 2 && f < s.from + l.from + l.frames + 3));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Fonts />
      <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>
      {tl.scenes.map((s, i) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.frames + 1}>
          <SceneWrap s={s} first={i === 0} />
        </Sequence>
      ))}
      {/* retention progress bar + series tag */}
      <div style={{ position: "absolute", top: 222, left: 60, right: 60, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.15)" }}>
        <div style={{ width: `${(f / tl.totalFrames) * 100}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${C.amber}, ${C.rose})` }} />
      </div>
      <div style={{ position: "absolute", top: 150, left: 60, fontFamily: C.inter, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: "white", background: "rgba(0,0,0,0.45)", padding: "8px 20px", borderRadius: 30 }}>
        AI FROM SCRATCH <span style={{ color: C.amber }}>· {tl.label}</span>
      </div>
      <Audio src={staticFile(tl.music)} volume={() => (talking ? 0.22 : 0.55)} />
      {tl.scenes.flatMap((s) =>
        s.lines.map((l, k) => (
          <Sequence key={`${s.id}-${k}`} from={s.from + l.from} durationInFrames={l.frames + 20} layout="none">
            <Audio src={staticFile(l.audio)} volume={1} />
          </Sequence>
        ))
      )}
      {tl.scenes.slice(1).map((s) => (
        <Sequence key={`w-${s.id}`} from={Math.max(0, s.from - 6)} durationInFrames={16} layout="none">
          <Audio src={staticFile("audio/sfx_whoosh.wav")} volume={0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
