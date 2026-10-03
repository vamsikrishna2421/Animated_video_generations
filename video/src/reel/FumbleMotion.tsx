import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { Stage } from "./FumbleMaking";
import { FPose, Fumble, idle, shrug, stiffWalk, tiptoe, trans, walk, walkDist, wave } from "./Fumble";

// Motion test: natural walk with planted feet, weight-shift idle, march, tiptoe, eased gestures.
export const MOTION_LEN = 600;
const SC = 1.1, FLOOR = 1660;
export const FumbleMotion: React.FC<{ onion?: boolean }> = ({ onion }) => {
  const f = useCurrentFrame();
  const at = (t: number) => {
    let x = 540, p: FPose = idle(t), label = "weight-shift idle";
    if (t < 150) { x = -150 + walkDist(t) * SC; p = walk(t); label = "natural walk"; }
    else if (t < 230) { x = -150 + walkDist(150) * SC; p = trans(t, walk(150), idle(t), 150, 14); }
    else if (t < 300) { x = -150 + walkDist(150) * SC; p = trans(t, idle(t), wave(t - 230), 230, 1); label = "wave"; }
    else if (t < 360) { x = -150 + walkDist(150) * SC; p = trans(t, wave(70), shrug(t - 300), 300, 10); label = "shrug"; }
    else if (t < 480) { const x0 = -150 + walkDist(150) * SC; x = x0 - walkDist(t - 360, "march") * SC; p = stiffWalk(t - 360, -1); label = "stiff march"; }
    else { x = 150 + walkDist(t - 480, "tiptoe") * SC; p = tiptoe(t - 480); label = "tiptoe sneak"; }
    return { x, p, label };
  };
  const cur = at(f);
  return (
    <AbsoluteFill>
      <Fonts />
      <Stage />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {onion && Array.from({ length: 9 }, (_, k) => { const t = 40 + k * 6, a = at(t); return <g key={k} opacity={0.35} transform={`translate(${a.x},${FLOOR}) scale(${SC})`}><Fumble f={t} p={a.p} /></g>; })}
        {!onion && <g transform={`translate(${cur.x},${FLOOR}) scale(${SC})`}><Fumble f={f} p={cur.p} /></g>}
      </svg>
      {!onion && <Audio src={staticFile("fumble/audio/fumble_sneak.wav")} volume={0.25} loop />}
      {!onion && [...Array.from({ length: 9 }, (_, k) => [17 + k * 17, "clunk", 0.25]), ...Array.from({ length: 8 }, (_, k) => [360 + k * 15, "clunk", 0.45]), ...Array.from({ length: 5 }, (_, k) => [502 + k * 22, `tip${k % 4}`, 0.6]), [300, "hum_q", 0.6], [232, "giggle", 0.4]].map(([at, n, v]) => (
        <Sequence key={`${at}${n}`} from={at as number} durationInFrames={40}><Audio src={staticFile(`fumble/audio/fumble_${n}.wav`)} volume={v as number} /></Sequence>
      ))}
      <div style={{ position: "absolute", top: 200, left: 60, fontFamily: "Inter", fontWeight: 900, fontSize: 70, color: "#0f172a" }}>{onion ? "planted-foot check" : cur.label}</div>
    </AbsoluteFill>
  );
};
