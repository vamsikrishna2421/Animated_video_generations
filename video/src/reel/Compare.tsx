import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";

// Same-prompt comparison reel (9:16): intro with the prompt, each entry played in turn with a numbered label,
// then a "which one was better?" card. Landscape entries sit on a blurred copy of themselves.
export type CompareItem = { src: string; label: string; frames: number; landscape: boolean; still?: number };
export type CompareProps = { title: string; prompt: string; items: CompareItem[]; question: string; handle: string };
export const INTRO = 135, OUTRO = 165;
export const compareDuration = (p: CompareProps) => INTRO + p.items.reduce((a, i) => a + i.frames, 0) + OUTRO;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SERIF = "'DejaVu Serif', Georgia, serif";
const SANS = "Inter, 'DejaVu Sans', sans-serif";
const BG = "radial-gradient(ellipse at 50% 40%, #1d1a14 0%, #080707 75%)";

const Label: React.FC<{ n: number; label: string }> = ({ n, label }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", transform: `translateY(${(1 - s) * -40}px)`, opacity: s }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 22, background: "rgba(10,10,10,0.72)", border: "2px solid rgba(214,171,78,0.6)", borderRadius: 60, padding: "16px 40px" }}>
        <span style={{ width: 70, height: 70, borderRadius: 35, background: "#d6ab4e", color: "#111", fontFamily: SANS, fontWeight: 900, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 52, color: "#f4ead3" }}>{label}</span>
      </div>
    </div>
  );
};

const Entry: React.FC<{ item: CompareItem; n: number; total: number }> = ({ item, n, total }) => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 10], [0, 1], cl);
  return (
    <AbsoluteFill style={{ background: "#000", opacity: fadeIn }}>
      {item.landscape ? (
        <>
          <OffthreadVideo src={staticFile(item.src)} muted style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.45)", transform: "scale(1.2)" }} />
          <OffthreadVideo src={staticFile(item.src)} style={{ position: "absolute", top: (1920 - 608) / 2, left: 0, width: 1080, height: 608 }} />
        </>
      ) : (
        <OffthreadVideo src={staticFile(item.src)} style={{ position: "absolute", width: "100%", height: "100%" }} />
      )}
      <Label n={n} label={item.label} />
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 34, color: "rgba(244,234,211,0.75)", letterSpacing: 3 }}>
        {n} / {total}
      </div>
    </AbsoluteFill>
  );
};

const Intro: React.FC<{ title: string; prompt: string; n: number }> = ({ title, prompt, n }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f - 4, fps, config: { damping: 14 } });
  const b = spring({ frame: f - 28, fps, config: { damping: 14 } });
  const out = interpolate(f, [INTRO - 12, INTRO], [1, 0], cl);
  return (
    <AbsoluteFill style={{ background: BG, opacity: out }}>
      <div style={{ position: "absolute", top: 380, left: 70, right: 70, textAlign: "center", transform: `scale(${a})` }}>
        <div style={{ fontFamily: SERIF, fontSize: 92, color: "#f1dfb1", lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: 26, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#d6ab4e", letterSpacing: 6 }}>{n} AI MODELS · 1 PROMPT</div>
      </div>
      <div style={{ position: "absolute", top: 860, left: 80, right: 80, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: "#a8a29e", letterSpacing: 6, marginBottom: 18 }}>THE PROMPT</div>
        <div style={{ fontFamily: SERIF, fontSize: 50, lineHeight: 1.35, color: "#f4ead3", borderLeft: "6px solid #d6ab4e", paddingLeft: 34 }}>“{prompt}”</div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ items: CompareItem[]; question: string; handle: string }> = ({ items, question, handle }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", top: 170, left: 60, right: 60, textAlign: "center", transform: `scale(${s(0)})`, fontFamily: SERIF, fontSize: 84, color: "#f1dfb1", lineHeight: 1.15 }}>{question}</div>
      {items.map((it, i) => (
        <div key={i} style={{ position: "absolute", top: 480 + i * 380, left: 90, right: 90, height: 330, display: "flex", alignItems: "center", gap: 36, transform: `translateX(${(1 - s(10 + i * 8)) * 600}px)` }}>
          <span style={{ flexShrink: 0, width: 96, height: 96, borderRadius: 48, background: "#d6ab4e", color: "#111", fontFamily: SANS, fontWeight: 900, fontSize: 58, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
          <div style={{ width: it.landscape ? 520 : 186, height: 330, overflow: "hidden", borderRadius: 20, border: "3px solid rgba(214,171,78,0.5)", flexShrink: 0 }}>
            <OffthreadVideo src={staticFile(it.src)} muted startFrom={it.still ?? it.frames - 45} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, color: "#f4ead3" }}>{it.label}</span>
        </div>
      ))}
      <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", transform: `scale(${s(40)})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 48, color: "#f4ead3" }}>Comment 1, 2 or 3 👇</div>
        <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: "#a8a29e" }}>{handle}</div>
      </div>
    </AbsoluteFill>
  );
};

export const CompareReel: React.FC<CompareProps> = (p) => {
  let at = INTRO;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <Sequence durationInFrames={INTRO}><Intro title={p.title} prompt={p.prompt} n={p.items.length} /></Sequence>
      {p.items.map((it, i) => {
        const from = at;
        at += it.frames;
        return (
          <Sequence key={i} from={from} durationInFrames={it.frames}>
            <Entry item={it} n={i + 1} total={p.items.length} />
          </Sequence>
        );
      })}
      <Sequence from={at}><Outro items={p.items} question={p.question} handle={p.handle} /></Sequence>
    </AbsoluteFill>
  );
};
