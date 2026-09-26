import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Captions } from "./Captions";
import { Mascot } from "./Mascot";
import { Banner } from "./scenes/Banner";
import { Compare } from "./scenes/Compare";
import { Definition } from "./scenes/Definition";
import { Examples } from "./scenes/Examples";
import { GenAI } from "./scenes/GenAI";
import { Nested } from "./scenes/Nested";
import { Neural } from "./scenes/Neural";
import { Quiz } from "./scenes/Quiz";
import { Recap } from "./scenes/Recap";
import { Myth } from "./scenes/Myth";
import { Predict } from "./scenes/Predict";
import { Steps } from "./scenes/Steps";
import { Terms } from "./scenes/Terms";
import { Versus } from "./scenes/Versus";
import { Host } from "./scenes/Host";
import { Roadmap } from "./scenes/Roadmap";
import { Cta } from "./scenes/Cta";
import { Tokens } from "./scenes/Tokens";
import { ContextWindow } from "./scenes/ContextWindow";
import { PromptBuilder } from "./scenes/PromptBuilder";
import { Dial } from "./scenes/Dial";
import { EmbedMap } from "./scenes/EmbedMap";
import { Pipeline } from "./scenes/Pipeline";
import { Table } from "./scenes/Table";
import { ToolCall } from "./scenes/ToolCall";
import { AgentLoop } from "./scenes/AgentLoop";
import { L, SceneData, SceneProps, clamp } from "./theme";

const SCENES: Record<string, React.FC<SceneProps>> = {
  banner: Banner,
  definition: Definition,
  compare: Compare,
  examples: Examples,
  neural: Neural,
  genai: GenAI,
  nested: Nested,
  quiz: Quiz,
  recap: Recap,
  predict: Predict,
  versus: Versus,
  steps: Steps,
  terms: Terms,
  myth: Myth,
  host: Host,
  roadmap: Roadmap,
  cta: Cta,
  tokens: Tokens,
  window: ContextWindow,
  prompt: PromptBuilder,
  dial: Dial,
  embedmap: EmbedMap,
  pipeline: Pipeline,
  table: Table,
  toolcall: ToolCall,
  agentloop: AgentLoop,
};

export type LessonTimeline = {
  id: string;
  episode: number;
  series: string;
  handle: string;
  title: string;
  fps: number;
  totalFrames: number;
  music: { bpm: number; volume: number; duckedVolume: number; audio: string };
  scenes: SceneData[];
};

const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const blob = (c: string, x: number, y: number, s: number, sp: number, ph: number) => (
    <div style={{ position: "absolute", left: x - s / 2 + Math.sin(f * sp + ph) * 140, top: y - s / 2 + Math.cos(f * sp + ph) * 120, width: s * 2, height: s * 2, background: `radial-gradient(circle, ${c}66 0%, ${c}22 35%, transparent 65%)` }} />
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${L.bg2}, ${L.bg} 70%)` }}>
      {blob(L.violet, -100, 200, 700, 0.008, 0)}
      {blob(L.teal, 600, 900, 650, 0.007, 2)}
      {blob(L.amber, 100, 1400, 500, 0.01, 4)}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </AbsoluteFill>
  );
};

const Header: React.FC<{ tl: LessonTimeline }> = ({ tl }) => {
  const f = useCurrentFrame();
  const idx = tl.scenes.findIndex((s) => f >= s.from && f < s.from + s.durationInFrames);
  return (
    <>
      <div style={{ position: "absolute", top: 150, left: 70, right: 70, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: L.font }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 5, color: L.text, background: "rgba(255,255,255,0.08)", border: `1.5px solid ${L.border}`, padding: "10px 20px", borderRadius: 30 }}>
          {tl.series} <span style={{ color: L.amber }}>· {tl.episode === 0 ? "TRAILER" : `EP ${String(tl.episode).padStart(2, "0")}`}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tl.scenes.map((s, i) => (
            <div key={i} style={{ width: i === idx ? 34 : 12, height: 12, borderRadius: 6, background: i <= idx ? L.amber : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </>
  );
};

const SceneWrap: React.FC<{ s: SceneData; handle: string }> = ({ s, handle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Comp = SCENES[s.type];
  const inS = spring({ frame: f, fps, config: { damping: 18 } });
  const out = interpolate(f, [s.durationInFrames - 8, s.durationInFrames], [1, 0], clamp);
  const n = Math.max(s.cues.length, 1);
  const cue = (i: number) => s.cues[i] ?? Math.round(s.voiceFrom + ((i + 1) * (s.durationInFrames - s.voiceFrom)) / (n + 2));
  return (
    <AbsoluteFill style={{ opacity: Math.min(inS, out), transform: `translateY(${(1 - inS) * 60 - (1 - out) * 40}px)` }}>
      {Comp ? <Comp data={{ ...s.data, handle }} cue={cue} duration={s.durationInFrames} image={s.image} /> : null}
    </AbsoluteFill>
  );
};

export const Lesson: React.FC<LessonTimeline> = (tl) => {
  const f = useCurrentFrame();
  const scene = tl.scenes.find((s) => f >= s.from && f < s.from + s.durationInFrames);
  const local = scene ? f - scene.from : 0;
  const talking = !!scene?.captions.some((c) => local >= c.from && local < c.to);
  const musicVolume = (fr: number) => {
    const sc = tl.scenes.find((s) => fr >= s.from && fr < s.from + s.durationInFrames);
    const lf = sc ? fr - sc.from : 0;
    const speaking = sc?.captions.some((c) => lf >= c.from - 6 && lf < c.to + 6);
    const end = interpolate(fr, [tl.totalFrames - 45, tl.totalFrames], [1, 0], clamp);
    return (speaking ? tl.music.duckedVolume : tl.music.volume) * interpolate(fr, [0, 15], [0, 1], clamp) * end;
  };
  return (
    <AbsoluteFill style={{ background: L.bg, color: L.text, overflow: "hidden" }}>
      <Fonts />
      <Backdrop />
      <Header tl={tl} />
      <Audio src={staticFile(tl.music.audio)} volume={musicVolume} />
      {tl.scenes.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.durationInFrames} name={`${i + 1}-${s.type}`}>
          <SceneWrap s={s} handle={tl.handle} />
          <Captions captions={s.captions} />
          <Sequence from={s.voiceFrom} layout="none">
            <Audio src={staticFile(s.audio)} />
          </Sequence>
          {i > 0 && (
            <Sequence durationInFrames={14} layout="none">
              <Audio src={staticFile("audio/sfx_whoosh.wav")} volume={0.35} />
            </Sequence>
          )}
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 40, top: 1265, opacity: scene?.type === "host" ? 0 : 1 }}>
        <Mascot size={195} talking={talking} />
      </div>
    </AbsoluteFill>
  );
};
