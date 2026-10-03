import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { CodeLine, Studio, Title } from "./BuildTimelapse";
import { SketchStyle } from "./Mascot";
import { browWiggle, doubleTake, FPose, FReveal, Fumble, idle, innocent, kf, peek, shock, smugGrin, stiffWalk, tiptoe } from "./Fumble";

// Making-of for Mr. Fumble: code -> drawing -> rig -> test & fix -> the mannerism library -> a short silent
// sketch. Who built it and the build time arrive as props, so the repo carries no branding.
export type FumbleMakingProps = {
  label: string; minutes: number;
  clock: number[]; // real elapsed minutes at the start of each step: [code, draw, rig, fix, moves, sketch]
  code: string; handle: string; snaps: { before: string; after: string };
};

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', monospace";
const A = (f: string) => staticFile(`fumble/audio/fumble_${f}.wav`);
export const FM = { hook: 0, code: 105, draw: 285, rig: 735, fix: 945, moves: 1095, sketch: 1995, end: 2475 };
export const FM_LEN = FM.end + 165;
const MOVE = 150; // frames per mannerism clip
const STEPS = ["Code", "Draw", "Rig", "Fix", "Moves", "Sketch"];

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.8 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={45}><Audio src={src} volume={vol} /></Sequence>
);

/** The stage he performs on: a pastel wall, a skirting board, a wooden floor and a soft spotlight. */
export const Stage: React.FC<{ tint?: string }> = ({ tint = "#cfe6e2" }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(${tint}, #f3efe4 70%)` }} />
    <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 60px, transparent 60px 120px)", height: 1560 }} />
    <div style={{ position: "absolute", left: 120, top: 520, width: 230, height: 290, border: "14px solid #8a5530", background: "linear-gradient(#bfe0f5, #f9e3b0)", boxShadow: "0 10px 24px rgba(0,0,0,0.15)" }}>
      <div style={{ position: "absolute", left: 40, bottom: 40, width: 120, height: 120, borderRadius: "50%", background: "#f6b73c" }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1540, height: 30, background: "#e9e1cf", borderTop: "4px solid #d7ccb3" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1570, bottom: 0, background: "repeating-linear-gradient(90deg, #b07a46 0 180px, #a56f3d 180px 360px)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 50% 62%, rgba(255,250,230,0.45), transparent 70%)" }} />
  </AbsoluteFill>
);

const FLOOR = 1660, SC = 1.22;
const Actor: React.FC<{ x: number; p: FPose; s?: number; y?: number; reveal?: FReveal; bones?: boolean }> = ({ x, p, s = SC, y = FLOOR, reveal, bones }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <SketchStyle />
      <g transform={`translate(${x},${y}) scale(${s})`}><Fumble f={f} p={p} reveal={reveal} bones={bones} /></g>
    </svg>
  );
};

const Hook: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 4, fps, config: { damping: 13 } }), b = spring({ frame: f - 34, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 380, left: 70, right: 70, textAlign: "center", transform: `scale(${a})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, color: "white", lineHeight: 1.12 }}>I asked <span style={{ color: "#22d3ee" }}>{label}</span> to build a</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, color: "#ffd166", lineHeight: 1.12 }}>silent-comedy character</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, color: "white", lineHeight: 1.12 }}>from scratch.</div>
      </div>
      <div style={{ position: "absolute", top: 1000, left: 0, right: 0, textAlign: "center", transform: `scale(${b})` }}>
        <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 60, color: "#0f172a", background: "white", padding: "16px 40px", borderRadius: 26 }}>No words. Only mannerisms.</span>
      </div>
    </AbsoluteFill>
  );
};

const CodeStep: React.FC<{ code: string; len: number }> = ({ code, len }) => {
  const f = useCurrentFrame();
  const lines = code.split("\n");
  const shown = Math.floor(interpolate(f, [0, len - 20], [0, lines.length], cl));
  const first = Math.max(0, shown - 30);
  return (
    <AbsoluteFill>
      <Title step={1} text="Writes the code" from={0} />
      <div style={{ position: "absolute", top: 420, left: 50, right: 50, height: 1180, background: "#0f172a", borderRadius: 28, border: "2px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
        <div style={{ height: 64, background: "#1e293b", display: "flex", alignItems: "center", gap: 14, padding: "0 26px" }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
          <div style={{ marginLeft: 20, fontFamily: MONO, fontSize: 26, color: "#94a3b8" }}>Fumble.tsx · {shown} lines</div>
        </div>
        <div style={{ padding: "18px 24px", fontFamily: MONO, fontSize: 21, lineHeight: 1.6, whiteSpace: "pre", overflow: "hidden" }}>
          {lines.slice(first, shown).map((l, i) => (
            <div key={first + i} style={{ display: "flex" }}>
              <span style={{ width: 60, color: "#475569", flexShrink: 0 }}>{first + i + 1}</span>
              <span style={{ overflow: "hidden" }}><CodeLine line={l.slice(0, 70)} /></span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PARTS: { key: keyof FReveal; label: string }[] = [
  { key: "shoes", label: "shoes" }, { key: "legs", label: "trousers + socks" }, { key: "torso", label: "shirt" }, { key: "vest", label: "argyle vest" },
  { key: "tie", label: "bow tie" }, { key: "armR", label: "right arm" }, { key: "armL", label: "left arm" }, { key: "head", label: "head" },
  { key: "ears", label: "ears" }, { key: "hair", label: "side-parted hair" }, { key: "eyes", label: "eyes" }, { key: "brows", label: "the eyebrows" },
  { key: "nose", label: "nose" }, { key: "mouth", label: "mouth" },
];
const DrawStep: React.FC = () => {
  const f = useCurrentFrame();
  const per = 28;
  const reveal: FReveal = {};
  PARTS.forEach((p, i) => (reveal[p.key] = interpolate(f, [i * per, (i + 1) * per + 8], [0, 1], cl)));
  const cur = Math.min(PARTS.length - 1, Math.floor(f / per));
  const done = f >= PARTS.length * per + 8;
  return (
    <AbsoluteFill>
      <Title step={2} text="Draws him, part by part" from={0} />
      <div style={{ position: "absolute", top: 420, left: 90, width: 900, height: 1180, background: "#fbfaf6", borderRadius: 28, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <svg width={900} height={1180}>
          <SketchStyle />
          <g transform="translate(450,1120) scale(0.98)"><Fumble f={done ? f : 0} p={done ? smugGrin(f) : {}} reveal={done ? {} : reveal} /></g>
        </svg>
      </div>
      <div style={{ position: "absolute", top: 1630, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#0f172a", background: "#ffd166", padding: "10px 34px", borderRadius: 40 }}>{done ? "meet Mr. Fumble" : `drawing: ${PARTS[cur].label}`}</span>
      </div>
    </AbsoluteFill>
  );
};

const RigStep: React.FC = () => {
  const f = useCurrentFrame();
  const seq: FPose[] = [idle(f), shock(12), smugGrin(f), doubleTake(40), browWiggle(f)];
  const i = Math.min(seq.length - 1, Math.floor(f / 42));
  return (
    <AbsoluteFill>
      <Title step={3} text="Rigs him like a puppet" from={0} />
      <div style={{ position: "absolute", top: 420, left: 90, width: 900, height: 1180, background: "#0b1022", borderRadius: 28, overflow: "hidden", border: "2px solid rgba(34,211,238,0.4)" }}>
        <svg width={900} height={1180}>
          <g transform="translate(450,1120) scale(0.98)" opacity={0.55}><Fumble f={f} p={seq[i]} /></g>
          <g transform="translate(450,1120) scale(0.98)"><g style={{ mixBlendMode: "screen" }}><Fumble f={f} p={seq[i]} bones /></g></g>
        </svg>
      </div>
      <div style={{ position: "absolute", top: 1630, left: 60, right: 60, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "white" }}>
        37 controls · <span style={{ color: "#ffd166" }}>17 just for the face</span>
      </div>
    </AbsoluteFill>
  );
};

const FixStep: React.FC<{ snaps: FumbleMakingProps["snaps"] }> = ({ snaps }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 14 } }), b = spring({ frame: f - 50, fps, config: { damping: 14 } });
  const card = (src: string, tag: string, col: string, s: number, x: number) => (
    <div style={{ position: "absolute", top: 470, left: x, width: 460, transform: `scale(${s})`, textAlign: "center" }}>
      <div style={{ borderRadius: 22, overflow: "hidden", border: `6px solid ${col}` }}><Img src={staticFile(src)} style={{ width: "100%", display: "block" }} /></div>
      <div style={{ marginTop: 20, fontFamily: INTER, fontWeight: 900, fontSize: 40, color: col, lineHeight: 1.15 }}>{tag}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Title step={4} text="Tests it and fixes mistakes" from={0} />
      {card(snaps.before, "Test 1: elbows bent backwards", "#f87171", a, 60)}
      {card(snaps.after, "Fixed: proper march", "#4ade80", b, 560)}
    </AbsoluteFill>
  );
};

// ---------- the mannerism clips ----------
const MOVES: { name: string; tint: string }[] = [
  { name: "the stiff march", tint: "#cfe6e2" }, { name: "the tiptoe sneak", tint: "#d9d4f0" }, { name: "the eyebrow wiggle", tint: "#f5dcc8" },
  { name: "the double-take", tint: "#d4e6f5" }, { name: "the smug grin", tint: "#f4e3b5" }, { name: "the innocent whistle", tint: "#d8efd2" },
];
const MoveClip: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tag = spring({ frame: f - 2, fps, config: { damping: 14 } });
  let x = 540, p: FPose = idle(f), s = SC, y = FLOOR;
  if (k === 0) { x = kf(f, [[0, -180], [96, 540]]); p = f < 96 ? stiffWalk(f) : { ...smugGrin(f), shut: 0, lid: 0.4, lookX: 0, tilt: -8 }; }
  if (k === 1) { x = kf(f, [[0, -160], [130, 760]]); p = tiptoe(f); }
  if (k === 2) { s = 2.7; y = 960 + 880 * 2.7; p = f < 20 ? idle(f) : browWiggle(f - 20); }
  if (k === 3) { s = 1.6; y = FLOOR + 560; p = doubleTake(Math.max(0, f - 30)); }
  if (k === 4) { p = f < 20 ? idle(f) : smugGrin(f); }
  if (k === 5) { p = innocent(f); }
  return (
    <AbsoluteFill>
      <Stage tint={MOVES[k].tint} />
      <Actor x={x} p={p} s={s} y={y} />
      {k === 5 && [0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        return <div key={i} style={{ position: "absolute", left: 690 + t * 120, top: 330 - t * 160, fontSize: 70, color: "#1e3a8a", opacity: 1 - t }}>♪</div>;
      })}
      <div style={{ position: "absolute", top: 200, left: 60, transform: `translateX(${(1 - tag) * -600}px)` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: "#0f172a", opacity: 0.6 }}>MANNERISM {String(k + 1).padStart(2, "0")}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 76, color: "#0f172a", lineHeight: 1.05 }}>{MOVES[k].name}</div>
      </div>
    </AbsoluteFill>
  );
};
const moveSfx = (base: number) => {
  const out: React.ReactNode[] = [];
  for (let t = 11; t < 96; t += 11) out.push(<Sfx key={`c${t}`} at={base + t} src={A("clunk")} vol={0.45} />);
  out.push(<Sfx key="s0" at={base + 104} src={A("hum_smug")} vol={0.7} />);
  const b1 = base + MOVE;
  for (let t = 18; t < 130; t += 18) out.push(<Sfx key={`t${t}`} at={b1 + t} src={A(`tip${(t / 18) % 4}`)} vol={0.6} />);
  const b2 = base + 2 * MOVE;
  out.push(<Sfx key="q2" at={b2 + 24} src={A("hum_q")} vol={0.6} />, <Sfx key="g2" at={b2 + 90} src={A("giggle")} vol={0.6} />);
  const b3 = base + 3 * MOVE;
  out.push(<Sfx key="u3" at={b3 + 62} src={A("slide_up")} vol={0.55} />, <Sfx key="g3" at={b3 + 64} src={A("gasp")} vol={0.7} />);
  const b4 = base + 4 * MOVE;
  out.push(<Sfx key="s4" at={b4 + 24} src={A("hum_smug")} vol={0.7} />, <Sfx key="g4" at={b4 + 80} src={A("giggle")} vol={0.5} />);
  return out;
};

// ---------- the sketch: Mr. Fumble vs the Follow button (reusable as its own reel) ----------
export const SKETCH_LEN = 480;
export const FumbleSketch: React.FC<{ handle: string; music?: boolean }> = ({ handle, music = true }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const BX = 850, BY = 1170;
  const pressed = f >= 340;
  let x = 300, p: FPose = idle(f);
  if (f < 90) { x = kf(f, [[0, -180], [90, 300]]); p = stiffWalk(f); }
  else if (f < 120) p = { ...idle(f), turn: 0.6, lookX: 1, browL: 0.6, browR: 0.2, mo: 0.2 }; // spots the button
  else if (f < 180) p = doubleTake(f - 120 + 10); // looks at the camera
  else if (f < 225) p = { ...browWiggle(f - 180), turn: -0.3 };
  else if (f < 315) { x = kf(f, [[225, 300], [315, 600]]); p = tiptoe(f - 225); }
  else if (f < 340) { x = kf(f, [[315, 600], [330, 540]]); p = peek(f - 315, 1); }
  else if (f < 360) { x = 540; p = { turn: 0.6, lean: 14, armL: [-112, -8], handL: "point", armR: [-14, -18], browL: 0.8, browR: 0.8, mo: 0.4, eyeSize: 1.2, lookX: 1 }; }
  else if (f < 420) { x = kf(f, [[360, 540], [380, 440]]); p = smugGrin(f); }
  else { x = 440; p = innocent(f); }
  const btnS = spring({ frame: f - 2, fps, config: { damping: 12 } }) * (pressed && f < 352 ? 0.9 : 1);
  return (
    <AbsoluteFill>
      <Fonts />
      <Stage tint="#d4e6f5" />
      {/* the button on a pedestal */}
      <div style={{ position: "absolute", left: BX - 120, top: BY + 105, width: 240, height: 465, background: "linear-gradient(90deg, #e2e8f0, #cbd5e1)", borderRadius: "10px 10px 0 0" }} />
      <div style={{ position: "absolute", left: BX - 190, top: BY - 40, width: 380, textAlign: "center", transform: `scale(${btnS})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, color: "#0f172a", background: "white", borderRadius: "20px 20px 0 0", padding: "10px 0" }}>{handle}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 60, color: pressed ? "#0f172a" : "white", background: pressed ? "#e2e8f0" : "#0095f6", borderRadius: "0 0 20px 20px", padding: "12px 0", whiteSpace: "nowrap", boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>{pressed ? "Following ✓" : "Follow"}</div>
      </div>
      {pressed && f < 400 && Array.from({ length: 30 }, (_, i) => {
        const t = (f - 340) / 60, ang = (i / 30) * Math.PI * 2;
        return <div key={i} style={{ position: "absolute", left: BX + Math.cos(ang) * 480 * t, top: BY + Math.sin(ang) * 380 * t + 500 * t * t, width: 18, height: 26, background: ["#f472b6", "#22d3ee", "#facc15", "#4ade80"][i % 4], transform: `rotate(${f * 12 + i * 30}deg)`, opacity: 1 - t }} />;
      })}
      <Actor x={x} p={p} />
      {f >= 420 && [0, 1, 2].map((i) => {
        const t = ((f - 420 + i * 20) % 60) / 60;
        return <div key={i} style={{ position: "absolute", left: x + 150 + t * 120, top: 330 - t * 160, fontSize: 70, color: "#1e3a8a", opacity: 1 - t }}>♪</div>;
      })}
      {music && <Audio src={A("sneak")} volume={0.3} />}
      {[11, 22, 33, 44, 55, 66, 77, 88].map((t) => <Sfx key={t} at={t} src={A("clunk")} vol={0.45} />)}
      <Sfx at={92} src={A("hum_q")} vol={0.7} />
      <Sfx at={158} src={A("slide_up")} vol={0.5} />
      <Sfx at={186} src={A("giggle")} vol={0.6} />
      {[243, 261, 279, 297].map((t, i) => <Sfx key={t} at={t} src={A(`tip${i}`)} vol={0.6} />)}
      <Sfx at={318} src={A("hmph")} vol={0.5} />
      <Sfx at={340} src={staticFile("audio/gag_ding.wav")} vol={0.7} />
      <Sfx at={362} src={A("hum_smug")} vol={0.8} />
    </AbsoluteFill>
  );
};

const Clock: React.FC<{ clock: number[] }> = ({ clock }) => {
  const f = useCurrentFrame();
  const marks = [FM.code, FM.draw, FM.rig, FM.fix, FM.moves, FM.sketch];
  const m = interpolate(f, marks, clock, cl);
  const mm = Math.floor(m), ss = Math.floor((m - mm) * 60);
  const step = marks.filter((x) => f >= x).length - 1;
  const onStage = f >= FM.moves;
  return (
    <>
      <div style={{ position: "absolute", top: 70, right: 60, display: "flex", alignItems: "center", gap: 14, background: "rgba(15,23,42,0.85)", border: "2px solid rgba(34,211,238,0.5)", borderRadius: 24, padding: "12px 26px" }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: "#ef4444", opacity: f % 30 < 18 ? 1 : 0.3 }} />
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, color: "white" }}>{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 50, right: 50, display: "flex", gap: 10, padding: onStage ? "14px 18px" : 0, borderRadius: 22, background: onStage ? "rgba(15,23,42,0.75)" : "none" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 10, borderRadius: 5, background: i < step ? "#22d3ee" : i === step ? "linear-gradient(90deg, #22d3ee, #7c3aed)" : "rgba(255,255,255,0.15)" }} />
            <div style={{ marginTop: 10, fontFamily: INTER, fontWeight: 700, fontSize: 25, color: i <= step ? "white" : "rgba(255,255,255,0.4)" }}>{s}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const EndCard: React.FC<{ label: string; minutes: number; handle: string }> = ({ label, minutes, handle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill>
      <Studio />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540,1880) scale(${0.95 * s(30)})`}><Fumble f={f} p={f < 80 ? smugGrin(f) : browWiggle(f)} /></g>
      </svg>
      <div style={{ position: "absolute", top: 200, left: 60, right: 60, textAlign: "center", transform: `scale(${s(0)})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 48, color: "#cbd5e1" }}>Meet <span style={{ color: "#ffd166" }}>Mr. Fumble</span>. Built from scratch by</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 104, color: "#22d3ee", lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 80, color: "white" }}>in <span style={{ color: "#ffd166" }}>{minutes} minutes</span></div>
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", transform: `scale(${s(16)})` }}>
        <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 52, color: "white", background: "#0095f6", padding: "18px 46px", borderRadius: 24 }}>Follow {handle}</span>
      </div>
    </AbsoluteFill>
  );
};

export const FumbleMaking: React.FC<FumbleMakingProps> = (p) => {
  const f = useCurrentFrame();
  const flash = Math.max(...[FM.moves, FM.sketch].map((at) => interpolate(f, [at - 8, at, at + 10], [0, 1, 0], cl)));
  const musicVol = (fr: number) => (fr < FM.moves ? 0.32 : fr < FM.sketch ? 0.22 : fr < FM.end ? 0 : 0.3);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0b1022" }}>
      <Fonts />
      <Studio />
      <Sequence durationInFrames={FM.code}><Hook label={p.label} /></Sequence>
      <Sequence from={FM.code} durationInFrames={FM.draw - FM.code}><CodeStep code={p.code} len={FM.draw - FM.code} /></Sequence>
      <Sequence from={FM.draw} durationInFrames={FM.rig - FM.draw}><DrawStep /></Sequence>
      <Sequence from={FM.rig} durationInFrames={FM.fix - FM.rig}><RigStep /></Sequence>
      <Sequence from={FM.fix} durationInFrames={FM.moves - FM.fix}><FixStep snaps={p.snaps} /></Sequence>
      {MOVES.map((_, k) => <Sequence key={k} from={FM.moves + k * MOVE} durationInFrames={MOVE}><MoveClip k={k} /></Sequence>)}
      <Sequence from={FM.sketch} durationInFrames={FM.end - FM.sketch}>
        <FumbleSketch handle={p.handle} music={false} />
        <div style={{ position: "absolute", top: 200, left: 60, opacity: interpolate(useCurrentFrame() - FM.sketch, [0, 10, 70, 85], [0, 1, 1, 0], cl) }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: "#0f172a", opacity: 0.6 }}>STEP 6 · FIRST SKETCH</div>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 70, color: "#0f172a", lineHeight: 1.05 }}>Mr. Fumble vs<br />the Follow button</div>
        </div>
      </Sequence>
      {f < FM.end && <Clock clock={p.clock} />}
      <Sequence from={FM.end}><EndCard label={p.label} minutes={p.minutes} handle={p.handle} /></Sequence>
      <AbsoluteFill style={{ background: "white", opacity: flash, pointerEvents: "none" }} />
      <Audio src={A("sneak")} volume={musicVol} loop />
      {moveSfx(FM.moves)}
      <Sfx at={FM.end + 2} src={staticFile("audio/gag_ding.wav")} vol={0.5} />
    </AbsoluteFill>
  );
};
