import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Chip, Kid, Pose } from "./Mascot";
import { DAY, Particles, Ridge, Sky } from "./World";

// Silent physical comedy with the mascot (no dialogue): trip, sheepish look at the camera, the Follow button
// that is just out of reach, standing on the robot, and the robot getting its revenge. SFX + music only.
export const GAG_LEN = 870;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const EASE = Easing.inOut(Easing.cubic);
const kf = (f: number, keys: [number, number][], easing = EASE) => interpolate(f, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...cl, easing });
const GROUND = 1760, S = 1.2, BTN = { x: 540, y: 590 };

type Act = { x: number; y: number; rot: number; sy: number; pose: Pose; seat: number };

function act(f: number): Act {
  const walk = (a: number, b: number) => (f >= a && f < b ? 1 : 0);
  const stride = Math.sin(f / 3.2);
  let pose: Pose = { eyes: "normal", mouth: "smile", lookX: 0.4, legL: 0, legR: 0 };
  let x = kf(f, [[20, -260], [120, 230], [140, 262], [370, 262], [410, 540]]);
  let y = 0, rot = 0, sy = 1, seat = 0;
  // 1. stroll in, whistling
  if (walk(20, 120) || walk(370, 410)) {
    pose = { ...pose, legL: 22 * stride, legR: -22 * stride, lUp: 20 - 25 * stride, lLow: 25, rUp: -20 - 25 * stride, rLow: -25, mouth: f < 120 ? "o" : "smile", lookX: 0.8, tilt: 4 * stride };
    y = -Math.abs(Math.sin(f / 3.2)) * 18;
  }
  // 2. trip on the pebble and face-plant
  if (f >= 120 && f < 212) {
    rot = f < 140 ? kf(f, [[120, 0], [140, 88]], Easing.in(Easing.quad)) : f < 190 ? 88 : kf(f, [[190, 88], [212, 0]], Easing.out(Easing.back(1.4)));
    y = f >= 190 ? -Math.sin(((f - 190) / 22) * Math.PI) * 90 : 0;
    sy = f >= 140 && f < 150 ? 1 - 0.12 * Math.sin(((f - 140) / 10) * Math.PI) : 1;
    pose = f < 140
      ? { eyes: "wide", mouth: "o", lUp: 165, lLow: 175, rUp: -165, rLow: -175, legL: -30, legR: 20, lookX: 0 }
      : f < 190 ? { eyes: "dizzy", mouth: "wobble", lUp: 90, lLow: 95, rUp: -90, rLow: -95, legL: 8, legR: -8 } : { eyes: "wide", mouth: "o", lUp: 60, rUp: -60 };
  }
  // 3. dust off, look around, sheepish side-eye to the camera
  if (f >= 212 && f < 252) pose = { eyes: "squint", mouth: "flat", tilt: 10, lUp: 15, lLow: -30 + 30 * Math.sin(f / 1.8), rUp: -15, rLow: 30 - 30 * Math.sin(f / 1.8) };
  if (f >= 252 && f < 300) pose = { eyes: "normal", mouth: "flat", lookX: f < 276 ? -1 : 1, tilt: f < 276 ? -8 : 8, lUp: 12, rUp: -12 };
  if (f >= 300 && f < 345) pose = { eyes: "side", mouth: "grin", lookX: -0.2, blush: 1, brow: -16, tilt: -5, lUp: 25, lLow: -110, rUp: -12 };
  // 4. spot the Follow button
  if (f >= 345 && f < 370) pose = { eyes: "wide", mouth: "o", lookX: 0.8, lookY: -1, lUp: 150, lLow: 150, rUp: -12, brow: -20 };
  if (f >= 410 && f < 435) {
    pose = { eyes: "squint", mouth: "flat", lookY: -1, lUp: 172, lLow: 178, rUp: -172, rLow: -178, tilt: 3 * Math.sin(f / 2) };
    y = -kf(f, [[410, 0], [420, 26]]);
  }
  // 5. three jumps, each one short
  if (f >= 435 && f < 525) {
    const j = Math.floor((f - 435) / 30), t = ((f - 435) % 30) / 30;
    y = -Math.sin(t * Math.PI) * [120, 160, 190][j];
    sy = t < 0.12 || t > 0.88 ? 0.93 : 1.04;
    pose = { eyes: j === 2 ? "wide" : "squint", mouth: j === 2 ? "o" : "flat", lookY: -1, lUp: 172, lLow: 178, rUp: -172, rLow: -178, legL: t > 0.1 && t < 0.9 ? -12 : 0, legR: t > 0.1 && t < 0.9 ? 12 : 0 };
  }
  if (f >= 525 && f < 550) pose = { eyes: "closed", mouth: "wobble", tilt: 12, lUp: 4, lLow: 4, rUp: -4, rLow: -4 };
  // 6. idea! the robot comes over, he climbs on it
  if (f >= 550 && f < 615) pose = { eyes: "wide", mouth: "grin", lUp: 168, lLow: 190, rUp: -20, lookX: f > 580 ? -0.8 : 0, lookY: f > 580 ? 0.6 : -0.6, brow: -20 };
  if (f >= 615) {
    const onChip = 118;
    y = f < 635 ? -onChip * Math.min(1, (f - 615) / 20) - Math.sin(((f - 615) / 20) * Math.PI) * 80 : -onChip;
  }
  if (f >= 635 && f < 665) {
    rot = 9 * Math.sin((f - 635) / 3);
    pose = { eyes: "wide", mouth: "o", lUp: 95, lLow: 80, rUp: -95, rLow: -80, legL: 6 * Math.sin(f / 2), legR: -6 * Math.sin(f / 2) };
  }
  // 7. tiptoe hop and press
  if (f >= 665 && f < 705) {
    y = -118 - Math.sin(Math.min(1, (f - 665) / 20) * Math.PI) * 165;
    // his hands never get above his big head, so the button gets a headbutt
    pose = f < 674 ? { eyes: "squint", mouth: "flat", lookY: -1, lUp: 172, lLow: 178, rUp: -172, rLow: -178 } : { eyes: "closed", mouth: "o", tilt: -6, lUp: 120, lLow: 130, rUp: -120, rLow: -130 };
    if (f >= 688) pose = { eyes: "closed", mouth: "grin", lUp: 150, lLow: 170, rUp: -150, rLow: -170, blush: 0.6 };
  }
  // 8. the robot pops out: launched, lands on his bottom, then thumbs up to camera
  if (f >= 705) {
    const t = Math.min(1, (f - 705) / 32);
    x = 540 + 170 * t;
    y = f < 737 ? -118 * (1 - t) - Math.sin(t * Math.PI) * 260 : 0;
    rot = f < 737 ? -25 * Math.sin(t * Math.PI) : 0;
    seat = f >= 737 ? 1 : 0;
    pose = f < 737 ? { eyes: "wide", mouth: "o", lUp: 170, lLow: 175, rUp: -170, rLow: -175, legL: -35, legR: 35 }
      : f < 760 ? { eyes: "dizzy", mouth: "wobble", legL: 70, legR: -70, lUp: 60, rUp: -60 }
      : { eyes: "normal", mouth: "grin", legL: 70, legR: -70, lUp: 30, lLow: 20, rUp: -130, rLow: -175, lookX: 0, blush: 0.4 };
  }
  return { x, y, rot, sy, pose, seat };
}

const Stars: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const a = f / 5 + (i * Math.PI) / 2;
      return <text key={i} x={x + Math.cos(a) * 110} y={y + Math.sin(a) * 36} fontSize={54} textAnchor="middle" fill="#facc15">★</text>;
    })}
  </g>
);

const Bulb: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle cx={0} cy={0} r={90} fill="#fde68a" opacity={0.35} />
    <circle cx={0} cy={0} r={50} fill="#facc15" stroke="#eab308" strokeWidth={6} />
    <rect x={-22} y={44} width={44} height={30} rx={6} fill="#94a3b8" />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      return <line key={i} x1={Math.cos(a) * 66} y1={Math.sin(a) * 66} x2={Math.cos(a) * 92} y2={Math.sin(a) * 92} stroke="#facc15" strokeWidth={8} strokeLinecap="round" />;
    })}
  </g>
);

const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.8 }) => (
  <Sequence from={at} durationInFrames={60}><Audio src={staticFile(src)} volume={vol} /></Sequence>
);

export const GagReel: React.FC<{ handle: string }> = ({ handle }) => {
  const f = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const a = act(f);
  const pressed = f >= 674;
  // robot: idles at the left, flies over at 580, squashed while stood on, springs out at 705
  const chipX = kf(f, [[580, 180], [612, 540]]), chipY = kf(f, [[580, 1330], [612, GROUND - 70]]);
  const squash = f >= 628 && f < 705 ? 1 : 0;
  const chipPop = f >= 705 ? spring({ frame: f - 705, fps, config: { damping: 7 } }) : 0;
  const btnPop = spring({ frame: f - 8, fps, config: { damping: 12 } });
  const endIn = spring({ frame: f - 790, fps, config: { damping: 13 } });
  const headX = a.x + Math.sin((a.rot * Math.PI) / 180) * 570 * S, headY = GROUND + a.y - Math.cos((a.rot * Math.PI) / 180) * 570 * S;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fonts />
      <Sky p={DAY} w={W} h={H} sunX={0.8} sunY={0.14} />
      <Ridge p={DAY} w={W} h={H} depth={0} base={H * 0.56} amp={260} speed={0.1} seed="gg1" />
      <Ridge p={DAY} w={W} h={H} depth={0.45} base={H * 0.66} amp={120} speed={0.2} seed="gg2" trees />
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.7, bottom: 0, background: "linear-gradient(#7cc36b, #4f9a4a)" }} />
      <Particles w={W} h={H} n={18} color="rgba(255,255,255,0.45)" size={6} speed={0.5} seed="gp" />
      {/* the Follow button, hanging just out of reach */}
      <div style={{ position: "absolute", left: BTN.x - 210, top: BTN.y - 250, width: 420, textAlign: "center", transform: `scale(${btnPop * (pressed && f < 690 ? 0.9 : 1)})` }}>
        <div style={{ width: 6, height: 140, margin: "0 auto", background: "#475569" }} />
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 38, color: "#0f172a", background: "white", borderRadius: "22px 22px 0 0", padding: "12px 0" }}>{handle}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: pressed ? "#0f172a" : "white", background: pressed ? "#e2e8f0" : "#0095f6", borderRadius: "0 0 22px 22px", padding: "14px 0", boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
          {pressed ? "Following ✓" : "Follow"}
        </div>
      </div>
      {pressed && f < 740 && Array.from({ length: 36 }, (_, i) => {
        const t = (f - 674) / 64, ang = (i / 36) * Math.PI * 2;
        return <div key={i} style={{ position: "absolute", left: BTN.x + Math.cos(ang) * 520 * t, top: BTN.y + Math.sin(ang) * 420 * t + 500 * t * t, width: 18, height: 26, background: ["#f472b6", "#22d3ee", "#facc15", "#4ade80"][i % 4], transform: `rotate(${f * 12 + i * 30}deg)`, opacity: 1 - t }} />;
      })}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* pebble */}
        <ellipse cx={330} cy={GROUND - 6} rx={26} ry={16} fill="#78716c" />
        <ellipse cx={322} cy={GROUND - 12} rx={9} ry={5} fill="#a8a29e" />
        <Chip f={f} x={f < 705 ? chipX : kf(f, [[705, 540], [722, 760], [790, 180]])} y={f < 705 ? chipY : kf(f, [[705, GROUND - 70], [722, 1050], [790, 1330]])} spin={f >= 705 && f < 745 ? (f - 705) * 18 : 0} squash={squash} hover={f < 580 || f >= 705} />
        <g transform={`translate(${a.x},${GROUND + a.y + a.seat * 110}) rotate(${a.rot}) scale(${S},${S * a.sy * (1 - a.seat * 0.06)})`}>
          <Kid f={f} o={0} w={0.5} wave={0} point={0} talk={0} look={0} pose={a.pose} />
        </g>
        {f >= 140 && f < 190 && <Stars f={f} x={headX} y={headY - 60} />}
        {f >= 737 && f < 760 && <Stars f={f} x={a.x} y={GROUND - 760} />}
        {f >= 552 && f < 600 && <Bulb x={a.x} y={GROUND + a.y - 930} s={spring({ frame: f - 552, fps, config: { damping: 9 } })} />}
        {f >= 140 && f < 175 && [0, 1, 2, 3, 4].map((i) => {
          const t = (f - 140) / 35;
          return <circle key={i} cx={a.x + 200 + i * 110 + t * 40 * (i - 2)} cy={GROUND - 30 - t * 90} r={30 + t * 50} fill="#d6c7a1" opacity={0.7 * (1 - t)} />;
        })}
        {/* whistle notes while strolling */}
        {f >= 25 && f < 120 && [0, 1, 2].map((i) => {
          const t = ((f - 25 + i * 20) % 60) / 60;
          return <text key={i} x={a.x + 60 + t * 90} y={GROUND + a.y - 560 * S - t * 160} fontSize={60} fill="#1e3a8a" opacity={1 - t}>♪</text>;
        })}
      </svg>
      {/* end card */}
      {f >= 790 && (
        <div style={{ position: "absolute", top: 780, left: 60, right: 60, textAlign: "center", transform: `scale(${endIn})` }}>
          <div style={{ display: "inline-block", fontFamily: INTER, fontWeight: 900, fontSize: 66, color: "#0f172a", background: "#ffd166", padding: "18px 44px", borderRadius: 34, lineHeight: 1.2, boxShadow: "0 14px 40px rgba(0,0,0,0.2)" }}>Even he managed it.<br />Your turn!</div>
        </div>
      )}
      <Audio src={staticFile("audio/gag_music.wav")} volume={0.35} />
      <Sfx at={25} src="audio/gag_whistle.wav" vol={0.5} />
      <Sfx at={138} src="audio/gag_bonk.wav" />
      <Sfx at={190} src="audio/gag_boing.wav" vol={0.6} />
      <Sfx at={300} src="audio/gag_pop.wav" vol={0.5} />
      {[435, 465, 495].map((t) => <Sfx key={t} at={t} src="audio/gag_boing.wav" vol={0.55} />)}
      <Sfx at={552} src="audio/gag_ding.wav" vol={0.6} />
      <Sfx at={628} src="audio/gag_squish.wav" vol={0.7} />
      <Sfx at={672} src="audio/gag_bonk.wav" vol={0.6} />
      <Sfx at={676} src="audio/gag_ding.wav" vol={0.7} />
      <Sfx at={705} src="audio/gag_boing.wav" vol={0.8} />
      <Sfx at={737} src="audio/gag_bonk.wav" vol={0.7} />
    </AbsoluteFill>
  );
};
