import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { DAY, Particles, Ridge, Sky } from "./World";

// "Bittu": the page's own cartoon mascot (original design) with his robot buddy "Chip". Mouth shapes come from
// the voice take (pipeline/mascot_lipsync.py); gestures follow the sentence starts.
export type MascotData = { frames: number; open: number[]; wide: number[]; starts: number[]; subs: string[] };
export const LEAD = 15, TAIL = 50;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const K = { skin: "#b97a52", skinDark: "#9c6340", hair: "#1f1612", kurta: "#22a699", kurtaDark: "#18857a", collar: "#ffd166", shorts: "#2f6fbf", shoe: "#ffffff", cheek: "#e98a7a", lip: "#7a2323" };

// One arm: angles in degrees, 0 = hanging down, +90 = pointing to screen-left, 180 = straight up.
const Arm: React.FC<{ x: number; y: number; up: number; low: number }> = ({ x, y, up, low }) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const ex = x - 92 * Math.sin(r(up)), ey = y + 92 * Math.cos(r(up));
  const hx = ex - 82 * Math.sin(r(low)), hy = ey + 82 * Math.cos(r(low));
  return (
    <g>
      <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={K.skin} strokeWidth={28} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={21} fill={K.skin} />
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={K.kurta} strokeWidth={42} strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={17} fill={K.kurtaDark} opacity={0.35} />
    </g>
  );
};

const Mouth: React.FC<{ o: number; w: number; smile: number }> = ({ o, w, smile }) => {
  const W = 26 + 14 * w - 6 * o, H = 3 + 40 * o;
  if (H < 7) {
    return <path d={`M ${-W - 4},-4 Q 0,${10 + 8 * smile} ${W + 4},-4`} stroke={K.lip} strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
  return (
    <g>
      <path d={`M ${-W},0 Q 0,${-6 - H * 0.15} ${W},0 Q ${W * 0.9},${H + 8} 0,${H + 10} Q ${-W * 0.9},${H + 8} ${-W},0 Z`} fill="#4a1010" stroke={K.lip} strokeWidth={5} />
      {o > 0.2 && <rect x={-W * 0.62} y={-2} width={W * 1.24} height={Math.min(10, H * 0.3)} rx={4} fill="#fff" />}
      {o > 0.35 && <ellipse cx={0} cy={H + 3} rx={W * 0.55} ry={H * 0.25} fill="#e0646b" />}
    </g>
  );
};

const Kid: React.FC<{ f: number; o: number; w: number; wave: number; point: number; talk: number; look: number }> = ({ f, o, w, wave, point, talk, look }) => {
  const blink = f % 96 < 4 || f % 157 < 3 ? 0.12 : 1;
  const tilt = Math.sin(f / 13) * 3 + talk * Math.sin(f / 5) * 2.5;
  const brow = -6 - 10 * Math.max(0, o - 0.55);
  // Screen-left arm: rest -> wave (sentence 1) -> point up at the follow card (sentence 3).
  const waveUp = 150, waveLow = 150 + 28 * Math.sin(f / 3.2);
  const restUp = 18 + talk * 10 * Math.sin(f / 7), restLow = 30 + talk * 25 * Math.sin(f / 6);
  const lUp = restUp + (waveUp - restUp) * wave + (135 - restUp) * point * (1 - wave);
  const lLow = restLow + (waveLow - restLow) * wave + (150 - restLow) * point * (1 - wave);
  // Screen-right arm: hand on hip, pops out for emphasis while talking.
  const rUp = -25 - talk * 30 * Math.max(0, Math.sin(f / 9)), rLow = -110 + talk * 60 * Math.max(0, Math.sin(f / 9));
  return (
    <g>
      <ellipse cx={0} cy={4} rx={150} ry={22} fill="#000" opacity={0.18} />
      {/* legs + shoes */}
      {[-38, 38].map((x) => (
        <g key={x}>
          <rect x={x - 17} y={-165} width={34} height={150} rx={16} fill={K.skin} />
          <ellipse cx={x + (x > 0 ? 14 : -14)} cy={-12} rx={38} ry={20} fill={K.shoe} stroke="#d9d9d9" strokeWidth={4} />
        </g>
      ))}
      <path d="M -88,-250 L 88,-250 L 96,-150 L 8,-150 L 0,-190 L -8,-150 L -96,-150 Z" fill={K.shorts} />
      <Arm x={95} y={-410} up={rUp} low={rLow} />
      {/* kurta */}
      <path d="M -92,-425 Q 0,-445 92,-425 L 118,-215 Q 0,-195 -118,-215 Z" fill={K.kurta} />
      <path d="M -40,-432 L 0,-360 L 40,-432" fill="none" stroke={K.collar} strokeWidth={12} strokeLinejoin="round" />
      {[-330, -295, -260].map((y) => <circle key={y} cx={0} cy={y} r={6} fill={K.collar} />)}
      <path d="M -118,-215 Q 0,-195 118,-215" stroke={K.kurtaDark} strokeWidth={8} fill="none" />
      <Arm x={-95} y={-410} up={lUp} low={lLow} />
      {/* head */}
      <g transform={`translate(0,-440) rotate(${tilt})`}>
        <rect x={-26} y={-30} width={52} height={40} fill={K.skinDark} />
        <circle cx={-118} cy={-125} r={26} fill={K.skin} />
        <circle cx={118} cy={-125} r={26} fill={K.skin} />
        <ellipse cx={0} cy={-130} rx={122} ry={118} fill={K.skin} />
        {/* hair: messy top with a cowlick */}
        <path d="M -124,-150 Q -130,-250 -30,-262 Q 40,-275 100,-235 Q 132,-200 124,-150 Q 95,-205 40,-212 Q 60,-190 20,-196 Q -30,-222 -60,-200 Q -95,-190 -124,-150 Z" fill={K.hair} />
        <path d="M 10,-258 Q 30,-310 70,-300 Q 40,-290 38,-262 Z" fill={K.hair} />
        {/* brows, eyes, nose, cheeks, mouth */}
        {[-44, 44].map((x) => (
          <g key={x}>
            <rect x={x - 26} y={-190 + brow} width={52} height={11} rx={6} fill={K.hair} transform={`rotate(${x < 0 ? -6 : 6} ${x} ${-185 + brow})`} />
            <ellipse cx={x} cy={-140} rx={26} ry={32 * blink} fill="#fff" />
            {blink > 0.5 && <circle cx={x + 6 * look} cy={-136 - 8 * Math.abs(look)} r={14} fill="#231815" />}
            {blink > 0.5 && <circle cx={x + 6 * look + 5} cy={-142 - 8 * Math.abs(look)} r={5} fill="#fff" />}
          </g>
        ))}
        <path d="M -6,-112 Q 0,-96 10,-104" stroke={K.skinDark} strokeWidth={6} fill="none" strokeLinecap="round" />
        <ellipse cx={-78} cy={-92} rx={20} ry={12} fill={K.cheek} opacity={0.55} />
        <ellipse cx={78} cy={-92} rx={20} ry={12} fill={K.cheek} opacity={0.55} />
        <g transform="translate(0,-72)">
          <Mouth o={o} w={w} smile={1 - o} />
        </g>
      </g>
    </g>
  );
};

const Chip: React.FC<{ f: number; x: number; y: number; spin: number }> = ({ f, x, y, spin }) => {
  const glow = 0.5 + 0.5 * Math.sin(f / 4);
  return (
    <g transform={`translate(${x},${y + Math.sin(f / 9) * 14}) rotate(${spin})`}>
      <ellipse cx={0} cy={150 - Math.sin(f / 9) * 14} rx={60} ry={12} fill="#000" opacity={0.12} />
      <line x1={0} y1={-78} x2={0} y2={-112} stroke="#9aa3b2" strokeWidth={6} />
      <circle cx={0} cy={-118} r={12} fill="#22d3ee" opacity={0.6 + 0.4 * glow} />
      <circle cx={0} cy={-118} r={24} fill="#22d3ee" opacity={0.18 * glow} />
      <circle cx={-86} cy={0} r={16} fill="#cbd5e1" />
      <circle cx={86} cy={0} r={16} fill="#cbd5e1" />
      <circle cx={0} cy={0} r={82} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={6} />
      <rect x={-56} y={-38} width={112} height={66} rx={26} fill="#1e293b" />
      <path d="M -34,-2 Q -24,-16 -14,-2" stroke="#22d3ee" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M 14,-2 Q 24,-16 34,-2" stroke="#22d3ee" strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M -12,12 Q 0,20 12,12" stroke="#22d3ee" strokeWidth={5} fill="none" strokeLinecap="round" />
      <text x={0} y={60} textAnchor="middle" fontFamily={INTER} fontWeight={900} fontSize={24} fill="#64748b">AI</text>
    </g>
  );
};

export const MascotCTA: React.FC<{ data: MascotData; audio: string; handle: string }> = ({ data, audio, handle }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const k = f - LEAD; // frame into the voice take
  const o = k >= 0 && k < data.frames ? data.open[k] : 0;
  const w = k >= 0 && k < data.frames ? data.wide[k] : 0.5;
  const st = data.starts;
  const sent = k < 0 ? -1 : st.filter((s) => s <= k).length - 1;
  const end = data.frames;
  const within = (a: number, b: number, ramp = 6) => interpolate(k, [a, a + ramp, b - ramp, b], [0, 1, 1, 0], cl);
  const wave = within(st[0] - 4, st[1] ?? end);
  const point = within(st[2] - 4, st[3] ?? end, 8);
  const talk = Math.min(1, o * 1.6);
  const enter = spring({ frame: f, fps, config: { damping: 11, mass: 0.7 } });
  const kidX = W * 0.6, kidY = H - 110 + (1 - enter) * 700 - Math.max(0, Math.sin(k / 4)) * 10 * talk;
  // Follow card: brand pill first, then the handle drops in when he says "Follow".
  const cardIn = spring({ frame: k - st[2], fps, config: { damping: 12 } });
  const tapAt = end + 14;
  const tapped = k >= tapAt;
  const chipT = interpolate(k, [end - 6, tapAt], [0, 1], cl);
  const chipX = interpolate(chipT, [0, 1], [230, W / 2 + 190]), chipY = interpolate(chipT, [0, 1], [1230, 520]);
  const bubbleIn = sent >= 0 ? spring({ frame: k - st[sent], fps, config: { damping: 14 } }) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fonts />
      <Sky p={DAY} w={W} h={H} sunX={0.78} sunY={0.16} />
      <Ridge p={DAY} w={W} h={H} depth={0} base={H * 0.56} amp={260} speed={0.15} seed="mm1" />
      <Ridge p={DAY} w={W} h={H} depth={0.45} base={H * 0.66} amp={120} speed={0.3} seed="mm2" trees />
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.7, bottom: 0, background: "linear-gradient(#7cc36b, #4f9a4a)" }} />
      <Particles w={W} h={H} n={24} color="rgba(255,255,255,0.5)" size={6} speed={0.6} seed="mp" />
      {/* brand + follow card */}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {k < st[2] ? (
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: "#0f172a", background: "rgba(255,255,255,0.85)", padding: "16px 40px", borderRadius: 50, transform: `scale(${spring({ frame: f - 6, fps, config: { damping: 12 } })})` }}>
            AI From Scratch
          </div>
        ) : (
          <div style={{ transform: `scale(${cardIn}) rotate(${(1 - cardIn) * -8}deg)`, background: "white", borderRadius: 40, padding: "30px 44px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ width: 120, height: 120, borderRadius: 60, background: "conic-gradient(#f9ce34, #ee2a7b, #6228d7, #f9ce34)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 104, height: 104, borderRadius: 52, background: "#0f172a", color: "white", fontFamily: INTER, fontWeight: 900, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>AI</div>
            </div>
            <div>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 50, color: "#0f172a" }}>{handle}</div>
              <div style={{ marginTop: 14, display: "inline-block", fontFamily: INTER, fontWeight: 800, fontSize: 38, color: tapped ? "#0f172a" : "white", background: tapped ? "#e2e8f0" : "#0095f6", padding: "10px 40px", borderRadius: 16, transform: `scale(${tapped ? 1 : 1 + 0.05 * Math.sin(f / 4)})` }}>
                {tapped ? "Following ✓" : "Follow"}
              </div>
            </div>
          </div>
        )}
      </div>
      {tapped && k - tapAt < 18 && (
        <div style={{ position: "absolute", left: W / 2 + 120 - (k - tapAt) * 6, top: 470 - (k - tapAt) * 6, width: 60 + (k - tapAt) * 12, height: 60 + (k - tapAt) * 12, borderRadius: "50%", border: "6px solid #0095f6", opacity: 1 - (k - tapAt) / 18 }} />
      )}
      {/* speech bubble with the English line */}
      {sent >= 0 && k < end + 8 && (
        <div style={{ position: "absolute", left: 60, right: 330, top: 560, transform: `scale(${bubbleIn})`, transformOrigin: "80% 100%" }}>
          <div style={{ background: "white", borderRadius: 44, padding: "30px 38px", fontFamily: INTER, fontWeight: 800, fontSize: 52, lineHeight: 1.2, color: "#0f172a", boxShadow: "0 14px 40px rgba(0,0,0,0.18)" }}>
            {data.subs[sent]}
          </div>
          <div style={{ position: "absolute", right: 60, bottom: -36, width: 0, height: 0, borderLeft: "30px solid transparent", borderRight: "30px solid transparent", borderTop: "44px solid white" }} />
        </div>
      )}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Chip f={f} x={chipX} y={chipY} spin={sent === 1 ? Math.sin(k / 3) * 12 : 0} />
        <g transform={`translate(${kidX},${kidY}) scale(1.45)`}>
          <Kid f={f} o={o} w={w} wave={wave} point={point} talk={talk} look={point > 0.3 ? -0.8 : Math.sin(f / 40) * 0.3} />
        </g>
      </svg>
      <Sequence from={LEAD}>
        <Audio src={staticFile(audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};
