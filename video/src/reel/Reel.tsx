import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Icon } from "../lesson/Icon";
import { Mascot } from "../lesson/Mascot";
import { createContext, useContext } from "react";
import { Backdrop, SCENES as LESSON } from "../lesson/Lesson";
import { Quiz } from "../lesson/scenes/Quiz";
import { Chintu } from "./Chintu";
import { ART, BOTTOM2 } from "./ReelArt";
import { CASE_SCENES } from "./CaseFile";
import { INTRO_SCENES } from "./Intro";
import { EP01_ART, EP01_BOTTOM, EP01_SCENES } from "./Ep01";
import { EP02_ART, EP02_BOTTOM, EP02_SCENES } from "./Ep02";

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
// Opt-in music arc: tl.musicLift = gain reached at the end (rises over the last 12 s into the CTA), plus a hit in the first second.
const musicArc = (tl: ReelTimeline, f: number) => {
  if (!tl.musicLift) return 1;
  const end = tl.totalFrames, lift = 12 * tl.fps;
  const hit = interpolate(f, [0, 0.4 * tl.fps, 1.2 * tl.fps], [1.7, 1.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = interpolate(f, [end - lift, end - 2 * tl.fps], [1, tl.musicLift], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return hit * rise;
};

export type ReelTimeline = { musicLift?: number; id: string; title: string; handle: string; label: string; fps: number; totalFrames: number; music: string; scenes: Scene[]; look?: "rays" | "classic"; topic?: string; banner?: string; musicVol?: number[]; format?: string };
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
// "classic" look = the original lesson backdrop; "rays" = comic sunburst (v2 meme style).
const LookCtx = createContext<"rays" | "classic">("rays");
const Rays: React.FC<{ c1: string; c2: string }> = ({ c1, c2 }) => {
  const f = useCurrentFrame();
  if (useContext(LookCtx) === "classic") return <Backdrop />;
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
      <div style={{ marginTop: 18, display: "inline-block", background: col, color: "#0A0F24", fontFamily: C.inter, fontWeight: 800, fontSize: 40, padding: "6px 26px", borderRadius: 30 }}>{who === "chintu" ? "Chintu" : "Teacher"}</div>
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
  const sadAt = s.lines.length > 1 ? line(1).from : cue(2) + 20;
  const sad = f >= sadAt;
  const sadS = useSp(sadAt, 10);
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
        <div style={{ position: "absolute", top: 1000, left: 350, right: 350, transform: `scale(${sadS})`, borderRadius: 20, overflow: "hidden", border: "5px solid white" }}>
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
        <div style={{ position: "absolute", top: 1190, left: 0, right: 0, textAlign: "center", transform: `scale(${gS}) rotate(-6deg) translateX(${Math.sin(f * 3) * 6}px)`, fontFamily: C.anton, fontSize: 130, color: C.teal, textShadow: outline }}>GOOSEBUMPS!</div>
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
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 70, color: C.amber }}>{s.data.handle ?? "@ai_maastaaru"}</div>
          <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 16, padding: "22px 70px", borderRadius: 26, background: followed ? "rgba(255,255,255,0.15)" : `linear-gradient(135deg, ${C.blue}, ${C.violet})`, fontFamily: C.inter, fontWeight: 800, fontSize: 56, color: "white", transform: `scale(${f >= tap && f < tap + 5 ? 0.9 : 1})` }}>
            {followed ? <><Icon name="Check" size={52} color="white" stroke={3.5} /> Following</> : "Follow"}
          </div>
        </div>
      )}
      <Pop at={tap} />
    </AbsoluteFill>
  );
};

// Original lesson templates inside a reel: data.kind picks the lesson scene; marker [n] -> lesson cue(n-1).
const LessonScene: React.FC<SP> = ({ s, cue }) => {
  const Comp = LESSON[s.data.kind];
  return (
    <AbsoluteFill>
      <Backdrop />
      {Comp ? <Comp data={{ handle: "@ai_maastaaru", ...s.data }} cue={(i) => cue(i + 1)} duration={s.frames} image={undefined as any} /> : null}
    </AbsoluteFill>
  );
};

// Meme sticker that slaps onto any scene at a cue: pop + wobble + label strip + boom.
type Meme = { img: string; at?: number; line?: number; x: number; y: number; w: number; rot?: number; label?: string; crop?: "right" };
const Sticker: React.FC<{ m: Meme; at: number }> = ({ m, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const classic = useContext(LookCtx) === "classic";
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 9, mass: 0.6 } });
  const wob = Math.sin((f - at) / 3) * 3 * Math.exp(-(f - at) / 20);
  return (
    <div style={{ position: "absolute", left: m.x, top: m.y, width: m.w, transform: `translate(-50%,-50%) scale(${s}) rotate(${(m.rot ?? -5) + wob}deg)`, borderRadius: 18, overflow: "hidden", border: "6px solid white", boxShadow: "0 18px 40px rgba(0,0,0,0.55)", background: "#000" }}>
      <div style={{ overflow: "hidden", aspectRatio: m.crop === "right" ? "340 / 678" : undefined }}>
        <Img src={staticFile(`reel/memes/${m.img}`)} style={m.crop === "right" ? { width: "200%", marginLeft: "-100%", display: "block" } : { width: "100%", display: "block" }} />
      </div>
      {m.label && <div style={{ background: "white", color: "#111", fontFamily: C.anton, fontSize: Math.max(26, m.w / 13), textAlign: "center", padding: "4px 10px", lineHeight: 1.1 }}>{m.label}</div>}
      {classic ? <Pop at={at} /> : <Boom at={at} vol={0.55} />}
    </div>
  );
};


// ---------------- scene: split — real-life analogy (top) in parallel with the AI concept (bottom) ----------------
// data.top: { img, tag, pan?, chips?: [{t, at, x, y, c?}], ticker?, stamp?: {t, at} }
// data.bottom: { kind: "predict"|"layers"|"backflow"|"loss", tag, ... }
const PANEL = { x: 40, w: 1000, topY: 262, topH: 560, botY: 900, botH: 500 };
const Chip: React.FC<{ t: string; at: number; x: number; y: number; c?: string }> = ({ t, at, x, y, c = C.amber }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const sp = spring({ frame: f - at, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${sp})`, background: "rgba(8,10,24,0.86)", border: `3px solid ${c}`, color: "white", fontFamily: C.inter, fontWeight: 800, fontSize: 34, padding: "8px 20px", borderRadius: 16, whiteSpace: "nowrap", boxShadow: "0 10px 26px rgba(0,0,0,0.5)" }}>
      {t}
      <Sequence from={0} durationInFrames={8} layout="none"><Audio src={staticFile("audio/sfx_tick.wav")} volume={0.3} /></Sequence>
    </div>
  );
};
const PanelTag: React.FC<{ icon: string; t: string; c: string }> = ({ icon, t, c }) => (
  <div style={{ position: "absolute", left: 20, top: 18, display: "flex", alignItems: "center", gap: 10, background: c, color: "#0A0F24", fontFamily: C.inter, fontWeight: 800, fontSize: 28, letterSpacing: 3, padding: "6px 18px", borderRadius: 14 }}>
    <Icon name={icon} size={30} color="#0A0F24" stroke={2.8} /> {t}
  </div>
);
const AnalogyPanel: React.FC<{ d: any; s: Scene; cue: (n: number) => number }> = ({ d, s, cue }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, s.frames], [1.04, 1.16]);
  const px = interpolate(f, [0, s.frames], [0, d.pan ?? -30]);
  const stampAt = d.stamp ? cue(d.stamp.at) : 1e9;
  const st = interpolate(f - stampAt, [0, 6], [2.2, 1], cl);
  const dock = interpolate(f - stampAt, [34, 46], [0, 1], cl); // stamp shrinks into the corner so the scene stays visible
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.topY, width: PANEL.w, height: PANEL.topH, borderRadius: 30, overflow: "hidden", border: "4px solid rgba(255,255,255,0.85)", boxShadow: "0 24px 60px rgba(0,0,0,0.55)", background: "#000" }}>
      {d.art && (ART[d.art] || EP01_ART[d.art] || EP02_ART[d.art]) ? (() => { const A = ART[d.art] || EP01_ART[d.art] || EP02_ART[d.art]; return <A d={d} cue={cue} frames={s.frames} />; })() : <Img src={staticFile(d.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z}) translateX(${px}px)` }} />}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.55) 100%)" }} />
      <PanelTag icon={d.icon ?? "Clapperboard"} t={d.tag ?? "REAL LIFE"} c={C.amber} />
      {(d.chips ?? []).map((c: any, i: number) => <Chip key={i} t={c.t} at={cue(c.at)} x={c.x} y={c.y} c={c.c} />)}
      {d.ticker && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70, display: "flex", alignItems: "center", background: "rgba(190,18,60,0.92)", overflow: "hidden" }}>
          <div style={{ background: "white", color: C.rose, fontFamily: C.inter, fontWeight: 900, fontSize: 30, padding: "0 18px", height: "100%", display: "flex", alignItems: "center", letterSpacing: 2 }}>BREAKING</div>
          <div style={{ whiteSpace: "nowrap", fontFamily: C.inter, fontWeight: 800, fontSize: 34, color: "white", transform: `translateX(${40 - f * 4}px)`, paddingLeft: 20 }}>{d.ticker} · {d.ticker}</div>
        </div>
      )}
      {f >= stampAt && (
        <div style={{ position: "absolute", right: 50 - 30 * dock, top: 150 + 215 * dock, transformOrigin: "100% 100%", transform: `scale(${st * (1 - 0.6 * dock)}) rotate(${-10 * (1 - dock)}deg)`, border: `8px solid ${d.stamp?.c ?? C.rose}`, color: d.stamp?.c ?? C.rose, fontFamily: C.anton, fontSize: 110, padding: "0 30px", borderRadius: 18, background: "rgba(0,0,0,0.35)" }}>{d.stamp.t}</div>
      )}
    </div>
  );
};

// --- bottom "IN AI" visuals, drawn in a 1000x500 panel ---
const Predict: React.FC<{ d: any; cue: (n: number) => number }> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const wrong = d.wrongAt !== undefined ? cue(d.wrongAt) : 8;
  const on = f >= wrong;
  const err = interpolate(f, [wrong, wrong + 18], [0, d.error ?? 0.92], cl);
  const box = (x: number, icon: string, label: string, c: string, sub?: string) => (
    <div style={{ position: "absolute", left: x, top: 110, width: 260, height: 230, borderRadius: 24, background: "rgba(255,255,255,0.06)", border: `3px solid ${c}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Icon name={icon} size={90} color={c} />
      <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 40, color: "white" }}>{label}</div>
      {sub && <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 26, color: C.muted }}>{sub}</div>}
    </div>
  );
  return (
    <>
      {box(40, d.inIcon ?? "Image", d.input ?? "Cat photo", C.teal, "input")}
      <div style={{ position: "absolute", left: 318, top: 200, fontFamily: C.anton, fontSize: 60, color: C.muted }}>→</div>
      {box(370, "BrainCircuit", "AI", C.violet, "billions of weights")}
      <div style={{ position: "absolute", left: 648, top: 200, fontFamily: C.anton, fontSize: 60, color: C.muted }}>→</div>
      {box(700, on ? "XCircle" : "HelpCircle", on ? (d.output ?? "\"Dog\"") : "…", on ? C.rose : C.muted, on ? `answer: ${d.truth ?? "cat"}` : "output")}
      <div style={{ position: "absolute", left: 40, right: 40, top: 380, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${err * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.amber}, ${C.rose})` }} />
        <div style={{ position: "absolute", left: 24, top: 6, fontFamily: C.inter, fontWeight: 800, fontSize: 30, color: "white" }}>ERROR {err.toFixed(2)}</div>
      </div>
    </>
  );
};
const Layers: React.FC<{ d: any; cue: (n: number) => number }> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const rows: [string, number, number][] = d.rows; // [label, pct, cue]
  const start = cue(d.start ?? 1);
  const arrowY = interpolate(f, [start, cue(rows[rows.length - 1][2]) + 10], [95, 440], cl);
  return (
    <>
      <div style={{ position: "absolute", left: 40, top: 90, width: 14, height: 360, borderRadius: 7, background: "rgba(255,255,255,0.1)" }} />
      {f >= start && <div style={{ position: "absolute", left: 30, top: arrowY - 17, width: 34, height: 34, borderRadius: 17, background: C.rose, boxShadow: `0 0 26px ${C.rose}` }} />}
      {rows.map(([label, pct, at], i) => {
        const a = cue(at);
        const p = interpolate(f, [a, a + 16], [0, 1], cl);
        return (
          <div key={label} style={{ position: "absolute", left: 90, right: 40, top: 90 + i * 125, height: 100, opacity: 0.4 + 0.6 * Math.min(1, p * 2) }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.inter, fontWeight: 800, fontSize: 36, color: "white" }}>
              <span>{label}</span>
              <span style={{ color: C.amber }}>{Math.round(pct * p)}%</span>
            </div>
            <div style={{ marginTop: 10, height: 38, borderRadius: 19, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${pct * p}%`, height: "100%", background: `linear-gradient(90deg, ${C.violet}, ${C.rose})` }} />
            </div>
          </div>
        );
      })}
    </>
  );
};
const Backflow: React.FC<{ d: any; cue: (n: number) => number }> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const layers = [3, 4, 4, 1];
  const X = (i: number) => 110 + i * 260;
  const Y = (i: number, j: number) => 270 + (j - (layers[i] - 1) / 2) * 100;
  const back = cue(d.back ?? 1);
  const blame = cue(d.blame ?? 2);
  const edges: [number, number, number, number, number][] = [];
  layers.forEach((n, i) => {
    if (i === layers.length - 1) return;
    for (let a = 0; a < n; a++) for (let b = 0; b < layers[i + 1]; b++) edges.push([i, a, i + 1, b, random(`bf${i}${a}${b}`)]);
  });
  return (
    <svg width={1000} height={500} style={{ position: "absolute", inset: 0 }}>
      {edges.map(([i, a, i2, b, r], k) => {
        const reach = interpolate(f, [back + (3 - i2) * 10, back + (3 - i2) * 10 + 10], [0, 1], cl);
        return <line key={k} x1={X(i)} y1={Y(i, a)} x2={X(i2)} y2={Y(i2, b)} stroke={reach > 0 ? C.rose : "rgba(255,255,255,0.22)"} strokeWidth={f >= blame ? 1.5 + r * 8 : 2.5} opacity={0.35 + 0.65 * reach} />;
      })}
      {layers.map((n, i) => Array.from({ length: n }, (_, j) => <circle key={`${i}${j}`} cx={X(i)} cy={Y(i, j)} r={i === 3 ? 38 : 28} fill={i === 3 ? C.rose : "#1E1B4B"} stroke={i === 3 ? "white" : C.teal} strokeWidth={5} />))}
      {f >= back && [0, 1].map((k) => {
        const p = ((f - back) / 28 + k / 2) % 1;
        return <circle key={k} cx={X(3) - p * (X(3) - X(0))} cy={270 + Math.sin(p * 8 + k) * 70} r={13} fill={C.amber} />;
      })}
      <text x={X(3)} y={470} fill={C.rose} fontFamily="Inter" fontWeight={800} fontSize={28} textAnchor="middle">error</text>
      <text x={X(0)} y={470} fill={C.teal} fontFamily="Inter" fontWeight={800} fontSize={28} textAnchor="middle">input</text>
      {f >= blame && <text x={500} y={60} fill={C.amber} fontFamily="DejaVu Sans Mono" fontWeight={800} fontSize={34} textAnchor="middle">thicker line = more blame</text>}
    </svg>
  );
};
const Loss: React.FC<{ d: any; s: Scene; cue: (n: number) => number }> = ({ d, s, cue }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [cue(d.start ?? 1), s.frames - 10], [0, 1], cl);
  const pts = Array.from({ length: 40 }, (_, i) => [60 + i * 22.5, 110 + (1 - Math.exp(-i / 9)) * 280 + (random(`ls${i}`) - 0.5) * 26 * Math.exp(-i / 20)]);
  const shown = Math.max(2, Math.floor(p * pts.length));
  const rounds = Math.round(1 + p ** 3 * 999999);
  return (
    <>
      <svg width={1000} height={500} style={{ position: "absolute", inset: 0 }}>
        <line x1={60} y1={420} x2={960} y2={420} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <line x1={60} y1={90} x2={60} y2={420} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <polyline points={pts.slice(0, shown).map((q) => q.join(",")).join(" ")} fill="none" stroke={C.green} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 80, top: 70, fontFamily: C.inter, fontWeight: 800, fontSize: 32, color: C.green }}>MISTAKES ↓</div>
      <div style={{ position: "absolute", right: 40, top: 70, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 32, color: "white" }}>round {rounds.toLocaleString("en-IN")}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", fontFamily: C.inter, fontWeight: 700, fontSize: 28, color: C.muted }}>blame → nudge weights → try again</div>
    </>
  );
};
const BOTTOM: Record<string, React.FC<any>> = { predict: Predict, layers: Layers, backflow: Backflow, loss: Loss, ...BOTTOM2, ...EP01_BOTTOM, ...EP02_BOTTOM };
const Split: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const d = s.data;
  const B = BOTTOM[d.bottom.kind];
  const bIn = useSp(s.from === 0 ? -30 : 4, 14);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AnalogyPanel d={d.top} s={s} cue={cue} />
      <div style={{ position: "absolute", left: 0, right: 0, top: PANEL.topY + PANEL.topH + 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
        <div style={{ width: 150, height: 3, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: "white", opacity: 0.9 }}>{d.bridge ?? "SAME IDEA IN AI"}</div>
        <div style={{ width: 150, height: 3, background: "rgba(255,255,255,0.3)" }} />
      </div>
      <div style={{ position: "absolute", left: PANEL.x, top: PANEL.botY, width: PANEL.w, height: PANEL.botH, borderRadius: 30, background: "rgba(10,14,36,0.82)", border: `3px solid ${C.teal}88`, overflow: "hidden", opacity: bIn, transform: `translateY(${(1 - bIn) * 40}px)` }}>
        <PanelTag icon="Cpu" t={d.bottom.tag ?? "IN AI"} c={C.teal} />
        {B ? <B d={d.bottom} s={s} cue={cue} /> : null}
      </div>
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<SP>> = {
  ...(CASE_SCENES as Record<string, React.FC<SP>>), ...(INTRO_SCENES as Record<string, React.FC<SP>>), ...(EP01_SCENES as Record<string, React.FC<SP>>), ...(EP02_SCENES as Record<string, React.FC<SP>>), split: Split, lesson: LessonScene, meme: MemeScene, dialogue: Dialogue, cricket: Cricket, blame: Blame, net: Net, drake: Drake, mass: Mass, stonks: Stonks, quiz: QuizScene, outro: Outro };

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
  const classic = useContext(LookCtx) === "classic";
  const l = lineAt(s, f);
  if (!l) return null;
  const cs = chunks(l.words);
  const c = cs.find((ch, i) => f < (cs[i + 1]?.[0].from ?? l.from + l.frames + 4)) ?? cs[cs.length - 1];
  if (!c) return null;
  const pop = interpolate(f - c[0].from, [0, 4], [0.85, 1], cl);
  return (
    <div style={{ position: "absolute", top: 1440, left: 40, right: 40, textAlign: "center" }}>
      {l.name && !(classic && l.who === "maastaaru") && (
        <div style={{ display: "table", margin: "0 auto 14px", background: l.color, color: "#0A0F24", fontFamily: C.inter, fontWeight: 800, fontSize: 34, padding: "4px 22px", borderRadius: 20 }}>{l.name}</div>
      )}
      <div style={{ transform: `scale(${pop})`, display: classic ? "inline-block" : "block", background: classic ? "rgba(6,8,20,0.78)" : "transparent", borderRadius: 26, padding: classic ? "10px 18px" : 0 }}>
        {c.map((w, i) => {
          const on = f >= w.from;
          return (
            <span key={i} style={{ display: "inline-block", margin: classic ? "0 15px" : "0 18px", fontFamily: classic ? C.inter : C.anton, fontWeight: classic ? 900 : undefined, fontSize: classic ? 70 : 96, lineHeight: 1.05, textTransform: classic ? "none" : "uppercase", color: on ? (f < w.to + 2 ? C.amber : "white") : "rgba(255,255,255,0.45)", textShadow: outline, transform: `scale(${on && f < w.to + 2 ? (classic ? 1.04 : 1.12) : 1})` }}>
              {w.w}
            </span>
          );
        })}
      </div>
      {l.sub && <div style={{ marginTop: 14, fontFamily: C.inter, fontWeight: 700, fontStyle: "italic", fontSize: 40, color: "white", textShadow: outline }}>"{l.sub}"</div>}
    </div>
  );
};

const SceneWrap: React.FC<{ s: Scene; first: boolean; noCaptions?: boolean }> = ({ s, first, noCaptions }) => {
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
      {(s.data.memes ?? []).map((m: Meme, i: number) => (
        <Sticker key={i} m={m} at={m.line !== undefined ? line(m.line).from + 4 : m.at !== undefined ? cue(m.at) : 0} />
      ))}
      {!noCaptions && <Captions s={s} />}
    </AbsoluteFill>
  );
};

// ---------------- YouTube (16:9, long-form) ----------------
// Left: the reel's visual (portrait area y 240..1440, scaled 0.8). Right: chapter, title, notes that
// appear on cues, and large subtitles. data.yt = { chapter, title, notes: [[text, cue]] }.
const YTSubs: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame();
  const l = lineAt(s, f);
  if (!l) return null;
  const groups: Word[][] = [];
  let cur: Word[] = [];
  l.words.forEach((w) => {
    cur.push(w);
    if (cur.length >= 7 || /[.!?]$/.test(w.w)) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  const g = groups.find((gr, i) => f < (groups[i + 1]?.[0].from ?? l.from + l.frames + 4)) ?? groups[groups.length - 1];
  if (!g) return null;
  return (
    <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 46, lineHeight: 1.3, color: "white" }}>
      {g.map((w, i) => (
        <span key={i} style={{ color: f >= w.from && f < w.to + 2 ? C.amber : f >= w.from ? "white" : "rgba(255,255,255,0.5)" }}>{w.w} </span>
      ))}
    </div>
  );
};
const YTNotes: React.FC<{ s: Scene; idx: number }> = ({ s, idx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = s.data.yt ?? {};
  const cue = (n: number) => {
    for (const l of s.lines) if (l.cues[String(n)] !== undefined) return l.cues[String(n)];
    return Math.round(s.frames * (n / 5));
  };
  const head = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", left: 1000, right: 70, top: 110, bottom: 60 }}>
      <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: C.teal, opacity: head }}>CHAPTER {idx + 1}{y.chapter ? ` · ${String(y.chapter).toUpperCase()}` : ""}</div>
      <div style={{ marginTop: 10, fontFamily: C.inter, fontWeight: 900, fontSize: 70, lineHeight: 1.06, color: "white", opacity: head, transform: `translateX(${(1 - head) * 40}px)` }}>{y.title ?? ""}</div>
      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
        {(y.notes ?? []).map(([t, at]: [string, number], i: number) => {
          const a = cue(at);
          const p = spring({ frame: f - a, fps, config: { damping: 14 } });
          return f >= a ? (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
              <div style={{ marginTop: 20, width: 16, height: 16, borderRadius: 8, background: C.amber, flexShrink: 0 }} />
              <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 48, lineHeight: 1.25, color: "#E2E8F0" }}>{t}</div>
            </div>
          ) : null;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 20, padding: "22px 28px", borderRadius: 22, background: "rgba(6,8,20,0.72)", border: "2px solid rgba(255,255,255,0.08)" }}>
        <YTSubs s={s} />
      </div>
    </div>
  );
};
export const ReelYT: React.FC<{ tl: ReelTimeline }> = ({ tl }) => {
  const f = useCurrentFrame();
  const talking = tl.scenes.some((s) => s.lines.some((l) => f >= s.from + l.from - 2 && f < s.from + l.from + l.frames + 3));
  return (
    <LookCtx.Provider value={tl.look ?? "classic"}>
      <AbsoluteFill style={{ background: C.bg }}>
        <Fonts />
        <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>
        <Backdrop />
        <div style={{ position: "absolute", left: 1000, right: 70, top: 40, fontFamily: C.inter, fontWeight: 800, fontSize: 32, letterSpacing: 3, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          AI FROM SCRATCH <span style={{ color: C.amber }}>· {tl.label}</span>{tl.banner ? <span style={{ color: C.muted }}> · {tl.banner}</span> : null}
        </div>
        {tl.scenes.map((s, i) => (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames + 1}>
            <div style={{ position: "absolute", left: 70, top: 60, width: 864, height: 960, borderRadius: 30, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: "3px solid rgba(255,255,255,0.12)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: "scale(0.8) translateY(-240px)" }}>
                <SceneWrap s={{ ...s, data: { ...s.data, cta: "Subscribe for the next case" } }} first={i === 0} noCaptions />
              </div>
            </div>
            <YTNotes s={s} idx={i} />
          </Sequence>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ width: `${(f / tl.totalFrames) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.amber}, ${C.rose})` }} />
        </div>
        <Audio src={staticFile(tl.music)} volume={(af) => Math.min(1, (talking ? (tl.musicVol ?? [0.22, 0.55])[0] : (tl.musicVol ?? [0.22, 0.55])[1]) * musicArc(tl, af))} />
        {tl.scenes.flatMap((s) =>
          s.lines.map((l, k) => (
            <Sequence key={`${s.id}-${k}`} from={s.from + l.from} durationInFrames={l.frames + 20} layout="none">
              <Audio src={staticFile(l.audio)} volume={1} />
            </Sequence>
          ))
        )}
      </AbsoluteFill>
    </LookCtx.Provider>
  );
};

export const Reel: React.FC<{ tl: ReelTimeline }> = ({ tl }) => {
  const f = useCurrentFrame();
  const talking = tl.scenes.some((s) => s.lines.some((l) => f >= s.from + l.from - 2 && f < s.from + l.from + l.frames + 3));
  return (
    <LookCtx.Provider value={tl.look ?? "rays"}>
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
      {tl.banner ? (
        <div style={{ position: "absolute", top: 118, left: 50, right: 50, height: 88, borderRadius: 22, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {tl.label && <span style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 30, color: "#0A0F24", background: C.amber, padding: "4px 14px", borderRadius: 12, whiteSpace: "nowrap" }}>{tl.label}</span>}
            <span style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 40, color: "#0A0F24", whiteSpace: "nowrap" }}>{tl.banner}</span>
          </span>
          <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 32, color: "#fff", background: "#0A0F24", padding: "4px 14px", borderRadius: 12 }}>
            {(() => { const r = Math.max(0, Math.ceil((tl.totalFrames - f) / tl.fps)); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; })()}
          </span>
        </div>
      ) : (
      <div style={{ position: "absolute", top: 150, left: 60, fontFamily: C.inter, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: "white", background: "rgba(0,0,0,0.45)", padding: "8px 20px", borderRadius: 30 }}>
        AI FROM SCRATCH <span style={{ color: C.amber }}>· {tl.label}</span>
      </div>
      )}
      {tl.topic && !tl.banner && (
        <div style={{ position: "absolute", top: 150, right: 60, display: "flex", alignItems: "center", gap: 12, fontFamily: C.inter, fontWeight: 800, fontSize: 30, color: "white", background: "rgba(0,0,0,0.45)", padding: "8px 20px", borderRadius: 30 }}>
          <span style={{ letterSpacing: 3 }}>{tl.topic}</span>
          <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", color: C.amber }}>
            {(() => { const r = Math.max(0, Math.ceil((tl.totalFrames - f) / tl.fps)); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`; })()}
          </span>
        </div>
      )}
      <Audio src={staticFile(tl.music)} volume={(af) => Math.min(1, (talking ? (tl.musicVol ?? [0.22, 0.55])[0] : (tl.musicVol ?? [0.22, 0.55])[1]) * musicArc(tl, af))} />
      {tl.scenes.flatMap((s) =>
        s.lines.map((l, k) => (
          <Sequence key={`${s.id}-${k}`} from={s.from + l.from} durationInFrames={l.frames + 20} layout="none">
            <Audio src={staticFile(l.audio)} volume={1} />
          </Sequence>
        ))
      )}
      {tl.scenes.slice(1).map((s) => (
        <Sequence key={`w-${s.id}`} from={Math.max(0, s.from - 6)} durationInFrames={16} layout="none">
          <Audio src={staticFile("audio/sfx_whoosh.wav")} volume={tl.look === "classic" ? 0.25 : 0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </LookCtx.Provider>
  );
};
