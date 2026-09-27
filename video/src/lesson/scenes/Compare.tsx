import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const Box: React.FC<{ label: string; color: string; glow?: number }> = ({ label, color, glow = 0 }) => (
  <div
    style={{
      padding: "18px 26px",
      borderRadius: 20,
      border: `3px solid ${color}`,
      background: `${color}22`,
      fontFamily: L.font,
      fontWeight: 800,
      fontSize: 38,
      color: L.text,
      boxShadow: glow ? `0 0 ${50 * glow}px ${color}` : "none",
      transform: `scale(${1 + 0.12 * glow})`,
    }}
  >
    {label}
  </div>
);

const Row: React.FC<{ side: any; color: string; glowOut: number; children?: React.ReactNode }> = ({ side, color, glowOut, children }) => (
  <>
    <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 40, color, marginBottom: 20 }}>{side.title}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Box label={side.inputs[0]} color={L.muted} />
      <span style={{ fontSize: 44, color: L.muted, fontWeight: 800 }}>+</span>
      <Box label={side.inputs[1]} color={L.muted} />
      <span style={{ fontSize: 50, color, fontWeight: 800 }}>→</span>
      <Box label={side.output} color={color} glow={glowOut} />
    </div>
    {children}
  </>
);

// Spammers keep changing words, so hand-written rules break.
const SPAM = ["lottery", "l0ttery", "L-O-T-T-E-R-Y", "prize$$$"];

// Generic two-column comparison: data.left / data.right = { icon, title, points[] }, revealed on cues 0 and 1.
const Column: React.FC<{ side: any; at: number; color: string; top: number }> = ({ side, at, color, top }) => {
  const f = useCurrentFrame();
  const s = useSpring(at, 12);
  return (
    <Panel style={{ position: "absolute", top, left: 60, right: 60, padding: "28px 34px", borderColor: color, opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: `${color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={side.icon} size={40} color={color} />
        </div>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 44, color }}>{side.title}</div>
      </div>
      {side.points.map((pt: string, i: number) => (
        <div key={i} style={{ display: "flex", gap: 14, fontFamily: L.font, fontWeight: 600, fontSize: 36, color: L.text, lineHeight: 1.3, marginTop: 12, opacity: interpolate(f, [at + 10 + i * 8, at + 20 + i * 8], [0, 1], clamp) }}>
          <span style={{ color, fontWeight: 800 }}>•</span>
          <span>{pt}</span>
        </div>
      ))}
    </Panel>
  );
};

export const Compare: React.FC<SceneProps> = (props) => {
  const { data, cue } = props;
  if (!data.left?.points) return <RulesCompare {...props} />;
  return (
    <>
      <Heading kicker={data.kicker ?? "SIDE BY SIDE"}>{data.heading}</Heading>
      <Column side={data.left} at={cue(0)} color={L.blue} top={470} />
      <Column side={data.right} at={cue(1)} color={L.amber} top={850} />
    </>
  );
};

const RulesCompare: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const top = useSpring(4, 14);
  const bottom = useSpring(cue(1), 12);
  const glow = interpolate(f, [cue(2), cue(2) + 10, cue(2) + 40], [0, 1, 0.6], clamp);
  const spamIdx = Math.min(SPAM.length - 1, Math.max(0, Math.floor((f - cue(0) - 45) / 22)));
  const broken = f > cue(0) + 60;
  return (
    <>
      <Heading kicker={data.kicker ?? "HOW MACHINES LEARN"}>Rules vs Learning</Heading>
      <Panel style={{ position: "absolute", top: 490, left: 60, right: 60, padding: "30px 34px", opacity: top, transform: `translateY(${(1 - top) * 40}px)` }}>
        <Row side={data.left} color={L.rose} glowOut={0}>
          <div style={{ marginTop: 22, fontFamily: L.mono, fontSize: 30, color: L.muted, opacity: f > cue(0) ? 1 : 0.4 }}>
            if <span style={{ color: broken ? L.rose : L.amber, textDecoration: broken && spamIdx > 0 ? "line-through" : "none" }}>"lottery"</span> in email → spam
          </div>
          <div style={{ marginTop: 10, fontFamily: L.mono, fontSize: 30, color: L.text, opacity: fadeFrom(f, cue(0) + 45) }}>
            spammer writes: <span style={{ color: L.amber }}>"{SPAM[spamIdx]}"</span>{" "}
            <span style={{ color: L.rose, fontWeight: 800 }}>{spamIdx > 0 ? "✗ missed" : ""}</span>
          </div>
        </Row>
      </Panel>
      <Panel
        style={{
          position: "absolute",
          top: 850,
          left: 60,
          right: 60,
          padding: "30px 34px",
          opacity: bottom,
          transform: `perspective(1200px) rotateX(${(1 - bottom) * 70}deg)`,
          borderColor: glow > 0 ? L.green : L.border,
        }}
      >
        <Row side={data.right} color={L.green} glowOut={glow}>
          <div style={{ marginTop: 22, fontFamily: L.mono, fontSize: 30, color: L.muted }}>{data.right.note}</div>
        </Row>
      </Panel>
    </>
  );
};

function fadeFrom(f: number, at: number) {
  return interpolate(f, [at, at + 10], [0, 1], clamp);
}
