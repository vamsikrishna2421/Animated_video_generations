import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../lesson/Icon";
import { Backdrop } from "../lesson/Lesson";

// Channel introduction scenes (ep00): jargon storm, level-up game HUD, promise cards, Roll Safe CTA.
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399",
  muted: "#94A3B8", inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif", mono: "'DejaVu Sans Mono', monospace",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
const Tick: React.FC<{ at: number; src?: string; vol?: number }> = ({ at, src = "audio/sfx_tick.wav", vol = 0.35 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={14} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

// 1. Jargon storm: AI buzzwords rain down and pile up, then get swept away on cue 2.
const JARGON = ["ChatGPT", "LLM", "RAG", "Agents", "MCP", "Tokens", "Embeddings", "Fine-tuning", "Transformers", "Prompting", "GenAI", "Vector DB", "LoRA", "Hallucination", "Diffusion", "GPU", "Neural nets", "Deep learning"];
const Jargon: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const sweep = cue(2);
  const sw = interpolate(f, [sweep, sweep + 16], [0, 1], cl);
  const q = cue(1);
  return (
    <AbsoluteFill>
      <Backdrop />
      {JARGON.map((w, i) => {
        const start = i * 4;
        const x = 80 + random(`jx${i}`) * 780;
        const endY = 1180 - Math.floor(i / 3) * 90 - random(`jy${i}`) * 40;
        const y = interpolate(f, [start, start + 18], [180, endY], cl);
        const rot = (random(`jr${i}`) - 0.5) * 40;
        return (
          <div key={w} style={{ position: "absolute", left: x + sw * (i % 2 ? 1400 : -1400), top: y, transform: `rotate(${rot}deg)`, opacity: f >= start ? 1 : 0, padding: "10px 22px", borderRadius: 16, background: ["#1e1b4b", "#0c4a6e", "#3b0764", "#422006"][i % 4], border: `3px solid ${[C.violet, C.teal, C.rose, C.amber][i % 4]}`, fontFamily: C.inter, fontWeight: 900, fontSize: 46, color: "white", whiteSpace: "nowrap" }}>
            {w}
          </div>
        );
      })}
      {f >= q && f < sweep + 10 && (
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 150, color: C.amber, transform: `scale(${interpolate(f - q, [0, 6], [1.6, 1], cl)}) rotate(-4deg)`, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>???</div>
      )}
      {f >= sweep + 6 && (
        <div style={{ position: "absolute", top: 640, left: 60, right: 60, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: "white", transform: `scale(${interpolate(f - sweep - 6, [0, 8], [0.7, 1], cl)})` }}>
          Let's make it <span style={{ color: C.amber }}>simple.</span>
        </div>
      )}
      <Tick at={q} src="audio/sfx_pop.wav" /><Tick at={sweep} src="audio/sfx_whoosh.wav" vol={0.5} />
    </AbsoluteFill>
  );
};

// 2. Level-up HUD: the viewer is a player; each quest completes on its cue, XP fills, levels rise.
const LevelUp: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const quests: [string, string, string][] = s.data.quests;
  const done = quests.map((_, i) => f >= cue(i + 2));
  const level = 1 + done.filter(Boolean).length;
  const lastAt = [...quests.keys()].map((i) => cue(i + 2)).filter((a) => f >= a).pop() ?? -100;
  const xp = interpolate(f, [cue(1), cue(quests.length + 1) + 20], [0.04, 1], cl);
  const hud = spring({ frame: f, fps, config: { damping: 14 } });
  const titles = ["AI Beginner", "AI Curious", "AI Explorer", "AI Builder", "AI Pro", "AI Master"];
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 60, right: 60, top: 280, height: 230, borderRadius: 30, background: "rgba(10,14,36,0.85)", border: `4px solid ${C.teal}`, padding: 26, transform: `translateY(${(1 - hud) * -80}px)`, opacity: hud }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 120, height: 120, borderRadius: 26, background: `linear-gradient(135deg, ${C.violet}, ${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="Gamepad2" size={80} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: C.muted, letterSpacing: 3 }}>PLAYER: YOU</div>
            <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 56, color: "white" }}>
              LV {level} · <span style={{ color: C.amber }}>{titles[Math.min(level - 1, titles.length - 1)]}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${xp * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.teal})` }} />
        </div>
      </div>
      {quests.map(([icon, title, sub], i) => {
        const at = cue(i + 2);
        const on = done[i];
        const act = f >= cue(i + 1) && !on;
        return (
          <div key={title} style={{ position: "absolute", left: 60, right: 60, top: 560 + i * 170, height: 150, borderRadius: 24, display: "flex", alignItems: "center", gap: 22, padding: "0 26px", background: on ? "rgba(52,211,153,0.14)" : "rgba(255,255,255,0.05)", border: `3px solid ${on ? C.green : act ? C.amber : "rgba(255,255,255,0.14)"}` }}>
            <Icon name={on ? "CheckCircle2" : icon} size={64} color={on ? C.green : act ? C.amber : C.muted} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 40, color: "white" }}>{title}</div>
              <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 28, color: C.muted }}>{sub}</div>
            </div>
            {on && <div style={{ fontFamily: C.anton, fontSize: 44, color: C.green, transform: `scale(${interpolate(f - at, [0, 6], [1.6, 1], cl)})` }}>+XP</div>}
            <Tick at={at} src="audio/sfx_success.wav" vol={0.3} />
          </div>
        );
      })}
      {f >= lastAt && f < lastAt + 26 && (
        <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: C.anton, fontSize: 120, color: C.amber, transform: `scale(${interpolate(f - lastAt, [0, 6], [1.8, 1], cl)}) rotate(-5deg)`, opacity: interpolate(f - lastAt, [18, 26], [1, 0], cl), textShadow: "0 8px 30px rgba(0,0,0,0.7)", zIndex: 5 }}>LEVEL UP!</div>
      )}
    </AbsoluteFill>
  );
};

// 3. The promise: three cards that land on cues.
const Promise: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards: [string, string, string][] = s.data.cards;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 70, color: "white" }}>Every episode is</div>
      {cards.map(([icon, t, col], i) => {
        const at = cue(i + 1);
        const sp = spring({ frame: f - at, fps, config: { damping: 12 } });
        return (
          <div key={t} style={{ position: "absolute", left: 90, right: 90, top: 440 + i * 250, height: 210, borderRadius: 30, display: "flex", alignItems: "center", gap: 30, padding: "0 40px", background: "rgba(10,14,36,0.85)", border: `4px solid ${col}`, opacity: f >= at ? 1 : 0.15, transform: `translateX(${(1 - sp) * (i % 2 ? 300 : -300)}px)` }}>
            <Icon name={icon} size={100} color={col} />
            <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 60, color: "white" }}>{t}</div>
            <Tick at={at} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// 4. Roll Safe meme + follow CTA.
const RollSafe: React.FC<SP> = ({ s, cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bottom = cue(1);
  const follow = cue(2);
  const inS = spring({ frame: f, fps, config: { damping: 13 } });
  const followed = f >= follow + 30;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 40, right: 40, top: 300, borderRadius: 26, overflow: "hidden", border: "6px solid white", transform: `scale(${0.9 + 0.1 * inS})`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <Img src={staticFile("reel/memes/rollsafe.jpg")} style={{ width: "100%", display: "block" }} />
        <div style={{ position: "absolute", top: 14, left: 20, right: 20, textAlign: "center", fontFamily: C.anton, fontSize: 60, lineHeight: 1.05, color: "white", textTransform: "uppercase", textShadow: "3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000" }}>{s.data.top}</div>
        {f >= bottom && <div style={{ position: "absolute", bottom: 14, left: 20, right: 20, textAlign: "center", fontFamily: C.anton, fontSize: 60, lineHeight: 1.05, color: "white", textTransform: "uppercase", textShadow: "3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000", transform: `scale(${interpolate(f - bottom, [0, 6], [1.3, 1], cl)})` }}>{s.data.bottom}</div>}
      </div>
      {f >= follow && (
        <div style={{ position: "absolute", top: 1000, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 64, color: C.amber }}>{s.data.handle}</div>
          <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 16, padding: "22px 80px", borderRadius: 26, background: followed ? "rgba(255,255,255,0.15)" : `linear-gradient(135deg, ${C.blue}, ${C.violet})`, fontFamily: C.inter, fontWeight: 800, fontSize: 56, color: "white" }}>
            {followed ? <><Icon name="Check" size={52} color="white" stroke={3.5} /> Following</> : "Follow"}
          </div>
        </div>
      )}
      <Tick at={bottom} src="audio/sfx_pop.wav" /><Tick at={follow + 30} src="audio/sfx_pop.wav" />
    </AbsoluteFill>
  );
};

export const INTRO_SCENES: Record<string, React.FC<SP>> = { jargon: Jargon, levelup: LevelUp, promise: Promise, rollsafe: RollSafe };
