import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Chip, Kid, LEAD, MascotCTA, MascotData, Reveal, SketchStyle, TAIL } from "./Mascot";
import { DAY, Ridge, Sky } from "./World";

// Time-lapse of how the mascot reel was built: real code, the drawing in build order (pencil outline, then
// colour), the real first test frame and its fix, the voice + lip-sync step, then the finished reel.
// All names/labels arrive as props, so the repo holds no branding.
export type BuildProps = {
  label: string; // who built it, shown on screen
  name: string; // character name
  minutes: number; // real build time
  clock: number[]; // real elapsed minutes at the start of each step: [code, draw, fix, voice, done]
  code: string; // the real source, scrolled in the code step
  data: MascotData;
  audio: string;
  handle: string;
  snaps: { before: string; after: string };
  music?: string;
};

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', monospace";
export const SCENES = { hook: 0, code: 105, draw: 300, fix: 720, voice: 870, reveal: 990 };
export const END_LEN = 120;
export const buildDuration = (d: MascotData) => SCENES.reveal + LEAD + d.frames + TAIL + END_LEN;

const STEPS = ["Code", "Draw", "Test & fix", "Voice", "Animate"];
const PARTS: { key: keyof Reveal; label: string; at: [number, number] }[] = [
  { key: "legs", label: "legs", at: [0, -80] },
  { key: "shorts", label: "shorts", at: [0, -200] },
  { key: "kurta", label: "kurta", at: [0, -330] },
  { key: "armR", label: "right arm", at: [150, -330] },
  { key: "armL", label: "left arm", at: [-150, -330] },
  { key: "head", label: "head", at: [0, -570] },
  { key: "hair", label: "hair", at: [0, -700] },
  { key: "eyes", label: "eyes", at: [0, -580] },
  { key: "face", label: "nose + cheeks", at: [0, -530] },
  { key: "mouth", label: "mouth", at: [0, -512] },
];

const Studio: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1e2a5a 0%, #0b1022 70%)" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px", backgroundPosition: `0 ${f * 0.6}px` }} />
      <div style={{ position: "absolute", left: -200, top: 300, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.35), transparent 65%)" }} />
      <div style={{ position: "absolute", right: -250, bottom: 200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 65%)" }} />
    </AbsoluteFill>
  );
};

const Title: React.FC<{ step: number; text: string; from: number }> = ({ step, text, from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - from, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 210, left: 60, right: 60, transform: `translateY(${(1 - s) * -30}px)`, opacity: s }}>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 34, color: "#22d3ee", letterSpacing: 4 }}>STEP {step}</div>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 68, color: "white", lineHeight: 1.1 }}>{text}</div>
    </div>
  );
};

// Real elapsed build time, interpolated between the step milestones.
const Clock: React.FC<{ clock: number[] }> = ({ clock }) => {
  const f = useCurrentFrame();
  const marks = [SCENES.code, SCENES.draw, SCENES.fix, SCENES.voice, SCENES.reveal];
  const m = interpolate(f, marks, clock, cl);
  const mm = Math.floor(m), ss = Math.floor((m - mm) * 60);
  const step = marks.filter((x) => f >= x).length - 1;
  return (
    <>
      <div style={{ position: "absolute", top: 70, right: 60, display: "flex", alignItems: "center", gap: 14, background: "rgba(15,23,42,0.8)", border: "2px solid rgba(34,211,238,0.5)", borderRadius: 24, padding: "12px 26px" }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: "#ef4444", opacity: f % 30 < 18 ? 1 : 0.3 }} />
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: "white" }}>{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", bottom: 90, left: 60, right: 60, display: "flex", gap: 12 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 10, borderRadius: 5, background: i < step ? "#22d3ee" : i === step ? "linear-gradient(90deg, #22d3ee, #7c3aed)" : "rgba(255,255,255,0.15)" }} />
            <div style={{ marginTop: 12, fontFamily: INTER, fontWeight: 700, fontSize: 26, color: i <= step ? "white" : "rgba(255,255,255,0.4)" }}>{s}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const Hook: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 5, fps, config: { damping: 13 } });
  const b = spring({ frame: f - 30, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 330, left: 70, right: 70, textAlign: "center", transform: `scale(${a})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 82, color: "white", lineHeight: 1.1 }}>I asked <span style={{ color: "#22d3ee" }}>{label}</span></div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 82, color: "white", lineHeight: 1.1 }}>to create a cartoon character</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 82, color: "#ffd166", lineHeight: 1.1 }}>from scratch.</div>
      </div>
      <div style={{ position: "absolute", top: 900, width: 760, height: 620, background: "#fbfaf6", borderRadius: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", transform: `scale(${b}) rotate(${(1 - b) * -6}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 36, color: "#9ca3af" }}>empty canvas</div>
        <div style={{ position: "absolute", left: 60, top: 60, width: 5, height: 50, background: "#111827", opacity: f % 20 < 10 ? 1 : 0 }} />
      </div>
    </AbsoluteFill>
  );
};

const KW = /\b(const|let|export|import|from|return|type|if|else|new|for|of|React|FC)\b/;
const CodeLine: React.FC<{ line: string }> = ({ line }) => {
  const parts = line.split(/("[^"]*"|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:const|let|export|import|from|return|type|if|else|new|for|of)\b|\/\/.*$)/);
  return (
    <>
      {parts.map((p, i) => {
        const col = p.startsWith("//") ? "#64748b" : /^["`]/.test(p) ? "#86efac" : /^\d/.test(p) ? "#fdba74" : KW.test(p) && p.length < 8 ? "#c4b5fd" : /^<\/?[A-Z]/.test(p) ? "#67e8f9" : "#e2e8f0";
        return <span key={i} style={{ color: col }}>{p}</span>;
      })}
    </>
  );
};

const CodeStep: React.FC<{ code: string; len: number }> = ({ code, len }) => {
  const f = useCurrentFrame();
  const lines = code.split("\n");
  const shown = Math.floor(interpolate(f, [0, len - 20], [0, lines.length], cl));
  const VIS = 30;
  const first = Math.max(0, shown - VIS);
  return (
    <AbsoluteFill>
      <Title step={1} text="Writes the code" from={0} />
      <div style={{ position: "absolute", top: 420, left: 50, right: 50, height: 1180, background: "#0f172a", borderRadius: 28, border: "2px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ height: 64, background: "#1e293b", display: "flex", alignItems: "center", gap: 14, padding: "0 26px" }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
          <div style={{ marginLeft: 20, fontFamily: MONO, fontSize: 26, color: "#94a3b8" }}>Mascot.tsx · {shown} lines</div>
        </div>
        <div style={{ padding: "18px 24px", fontFamily: MONO, fontSize: 21, lineHeight: 1.6, whiteSpace: "pre", overflow: "hidden" }}>
          {lines.slice(first, shown).map((l, i) => (
            <div key={first + i} style={{ display: "flex" }}>
              <span style={{ width: 60, color: "#475569", flexShrink: 0 }}>{first + i + 1}</span>
              <span style={{ overflow: "hidden", textOverflow: "clip" }}><CodeLine line={l.slice(0, 70)} /></span>
            </div>
          ))}
          <span style={{ display: "inline-block", width: 12, height: 26, background: "#22d3ee", opacity: f % 16 < 8 ? 1 : 0 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DrawStep: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame();
  const PW = 900, PH = 1180;
  const per = 30; // frames per part
  const reveal: Reveal = {};
  PARTS.forEach((p, i) => (reveal[p.key] = interpolate(f, [i * per, (i + 1) * per + 8], [0, 1], cl)));
  const cur = Math.min(PARTS.length - 1, Math.floor(f / per));
  const chipP = interpolate(f, [PARTS.length * per, PARTS.length * per + 30], [0, 1], cl);
  const bgP = interpolate(f, [PARTS.length * per + 30, PARTS.length * per + 75], [0, 1], cl);
  const label = f < PARTS.length * per ? PARTS[cur].label : f < PARTS.length * per + 30 ? "robot buddy" : f < PARTS.length * per + 75 ? "background" : "done";
  const s = 0.9, kx = PW * 0.58, ky = PH - 70;
  const at = PARTS[cur].at;
  const penX = kx + at[0] * s + 60 * Math.sin(f / 2.2), penY = ky + at[1] * s + 40 * Math.cos(f / 1.7);
  return (
    <AbsoluteFill>
      <Title step={2} text="Draws the character" from={0} />
      <div style={{ position: "absolute", top: 420, left: 90, width: PW, height: PH, background: "#fbfaf6", borderRadius: 28, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", inset: 0, opacity: bgP }}>
          <Sky p={DAY} w={PW} h={PH} sunX={0.8} sunY={0.15} />
          <Ridge p={DAY} w={PW} h={PH} depth={0} base={PH * 0.56} amp={220} speed={0} seed="bt1" />
          <Ridge p={DAY} w={PW} h={PH} depth={0.45} base={PH * 0.66} amp={100} speed={0} seed="bt2" trees />
          <div style={{ position: "absolute", left: 0, right: 0, top: PH * 0.7, bottom: 0, background: "linear-gradient(#7cc36b, #4f9a4a)" }} />
        </div>
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }}>
          <SketchStyle />
          {chipP > 0 && (
            <g opacity={chipP} transform={`translate(${200},${720}) scale(${0.6 + 0.4 * chipP})`}>
              <Chip f={f} x={0} y={0} spin={0} />
            </g>
          )}
          <g transform={`translate(${kx},${ky}) scale(${s})`}>
            <Kid f={f} o={0} w={0.5} wave={0} point={0} talk={0} look={0} reveal={reveal} />
          </g>
          {label !== "done" && label !== "background" && (
            <g transform={`translate(${label === "robot buddy" ? 230 : penX},${label === "robot buddy" ? 640 : penY}) rotate(35)`}>
              <rect x={-9} y={-90} width={18} height={80} rx={3} fill="#f59e0b" />
              <polygon points="-9,-10 9,-10 0,12" fill="#fde68a" />
              <polygon points="-3,4 3,4 0,12" fill="#111827" />
              <rect x={-9} y={-100} width={18} height={14} rx={3} fill="#f472b6" />
            </g>
          )}
        </svg>
      </div>
      <div style={{ position: "absolute", top: 1630, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#0f172a", background: "#ffd166", padding: "10px 34px", borderRadius: 40 }}>
          {label === "done" ? "character ready" : `drawing: ${label}`}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const FixStep: React.FC<{ snaps: BuildProps["snaps"] }> = ({ snaps }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 14 } });
  const b = spring({ frame: f - 55, fps, config: { damping: 14 } });
  const card = (src: string, tag: string, col: string, s: number, x: number) => (
    <div style={{ position: "absolute", top: 480, left: x, width: 460, transform: `scale(${s})`, textAlign: "center" }}>
      <div style={{ borderRadius: 22, overflow: "hidden", border: `6px solid ${col}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ marginTop: 20, fontFamily: INTER, fontWeight: 900, fontSize: 42, color: col }}>{tag}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Title step={3} text="Tests it and fixes mistakes" from={0} />
      {card(snaps.before, "Test 1: arm hidden behind head", "#f87171", a, 60)}
      {card(snaps.after, "Fixed: points at the card", "#4ade80", b, 560)}
      {a > 0.9 && f < 60 && (
        <div style={{ position: "absolute", left: 60 + 150, top: 480 + 250, width: 170, height: 170, borderRadius: "50%", border: "8px solid #f87171", opacity: 0.5 + 0.5 * Math.sin(f / 3) }} />
      )}
    </AbsoluteFill>
  );
};

const VoiceStep: React.FC<{ data: MascotData }> = ({ data }) => {
  const f = useCurrentFrame();
  const k = Math.floor(interpolate(f, [0, 120], [0, data.frames - 1], cl));
  const bars = 60;
  return (
    <AbsoluteFill>
      <Title step={4} text="Gives it a voice + lip-sync" from={0} />
      <div style={{ position: "absolute", top: 470, left: 60, right: 60, height: 360, display: "flex", alignItems: "center", gap: 6 }}>
        {Array.from({ length: bars }, (_, i) => {
          const idx = Math.max(0, Math.min(data.frames - 1, k - bars / 2 + i));
          const v = data.open[idx];
          return <div key={i} style={{ flex: 1, height: 20 + v * 300, borderRadius: 6, background: i === bars / 2 ? "#ffd166" : i < bars / 2 ? "#22d3ee" : "rgba(34,211,238,0.35)" }} />;
        })}
      </div>
      <svg width={1080} height={700} style={{ position: "absolute", top: 820, left: 0 }}>
        <g transform="translate(540,1420) scale(1.9)">
          <Kid f={f} o={data.open[k]} w={data.wide[k]} wave={0} point={0} talk={data.open[k]} look={0} />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 1530, left: 60, right: 60, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 36, color: "#cbd5e1" }}>
        free open-source voice model, running locally · mouth shapes computed from the audio
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ label: string; minutes: number; handle: string }> = ({ label, minutes, handle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 460, left: 60, right: 60, transform: `scale(${s(0)})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 52, color: "#cbd5e1" }}>Built from scratch by</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 120, color: "#22d3ee", lineHeight: 1.1 }}>{label}</div>
      </div>
      <div style={{ position: "absolute", top: 800, left: 60, right: 60, transform: `scale(${s(12)})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 96, color: "white" }}>in <span style={{ color: "#ffd166" }}>{minutes} minutes</span></div>
        <div style={{ marginTop: 30, fontFamily: INTER, fontWeight: 700, fontSize: 40, color: "#94a3b8" }}>code · drawing · voice · lip-sync · animation</div>
      </div>
      <div style={{ position: "absolute", top: 1250, left: 0, right: 0, transform: `scale(${s(26)})` }}>
        <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 56, color: "white", background: "#0095f6", padding: "20px 50px", borderRadius: 24 }}>Follow {handle}</span>
      </div>
    </AbsoluteFill>
  );
};

export const BuildTimelapse: React.FC<BuildProps> = (p) => {
  const f = useCurrentFrame();
  const mascotLen = LEAD + p.data.frames + TAIL;
  const endAt = SCENES.reveal + mascotLen;
  const flash = interpolate(f, [SCENES.reveal - 8, SCENES.reveal, SCENES.reveal + 10], [0, 1, 0], cl);
  const musicVol = (fr: number) => (fr < SCENES.reveal - 10 ? 0.35 : fr < endAt ? 0.06 : 0.3);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fonts />
      <Studio />
      <Sequence durationInFrames={SCENES.code}><Hook label={p.label} /></Sequence>
      <Sequence from={SCENES.code} durationInFrames={SCENES.draw - SCENES.code}><CodeStep code={p.code} len={SCENES.draw - SCENES.code} /></Sequence>
      <Sequence from={SCENES.draw} durationInFrames={SCENES.fix - SCENES.draw}><DrawStep len={SCENES.fix - SCENES.draw} /></Sequence>
      <Sequence from={SCENES.fix} durationInFrames={SCENES.voice - SCENES.fix}><FixStep snaps={p.snaps} /></Sequence>
      <Sequence from={SCENES.voice} durationInFrames={SCENES.reveal - SCENES.voice}><VoiceStep data={p.data} /></Sequence>
      {f < SCENES.reveal && <Clock clock={p.clock} />}
      <Sequence from={SCENES.reveal} durationInFrames={mascotLen}>
        <MascotCTA data={p.data} audio={p.audio} handle={p.handle} name={p.name} />
      </Sequence>
      <Sequence from={endAt}><EndCard label={p.label} minutes={p.minutes} handle={p.handle} /></Sequence>
      <AbsoluteFill style={{ background: "white", opacity: flash, pointerEvents: "none" }} />
      {p.music && <Audio src={staticFile(p.music)} volume={musicVol} />}
    </AbsoluteFill>
  );
};
