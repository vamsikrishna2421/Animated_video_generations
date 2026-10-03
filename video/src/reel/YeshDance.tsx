import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { easeInOut, FPose, Fumble, idle, legIK, mix } from "./Fumble";
import duet2 from "./mocap/yesh_duet2.json";
import { MocapData } from "./MocapCheck";

// Yeshanagula duet test (74.5-78.5 s of the song). Mr. Fumble performs the motion captured from the male lead;
// the heroine is keyframed from a frame-by-frame reading of the female lead (her saree defeats pose tracking),
// on the song's beat grid (~83 BPM, beats at 0.28 s + n * 0.717 s in this window).
const D = duet2 as unknown as MocapData; // track 0 = male lead
export const YESH_LEN = 120;
const BEAT = 0.717, B0 = 0.28;
const sw = (t: number) => Math.sin(((t - B0) / BEAT) * Math.PI * 2);

/** Crouched stance with both feet planted (drop = how far the hips sink). */
const crouch = (drop: number): Partial<FPose> => ({ hipY: drop, legL: legIK(-12, 395 - drop, -1), legR: legIK(12, 395 - drop, 1), still: true });

const K: [number, (t: number) => FPose][] = [
  [0.0, (t) => ({ ...idle(t * 30), armL: [160, 12], armR: [-162, -8], handL: "open", handR: "open", tilt: -10, lean: -4, smile: 0.9, mo: 0.35, bend: 5 * sw(t), shrug: 0.25 })],
  [0.55, (t) => ({ ...idle(t * 30), armL: [150, 98], armR: [-150, -98], handL: "open", handR: "open", tilt: 9, smile: 0.7, mo: 0.15, shrug: 0.35, bend: -4 })],
  [0.9, (t) => ({ ...crouch(64), lean: 16, armL: [-18 + 30 * sw(t), 22], armR: [18 + 30 * sw(t), -22], hipTilt: 6 * sw(t), bend: -5 * sw(t), twist: 0.3 * sw(t), smile: 0.75, lookX: 0.4 * sw(t), tilt: 4 * sw(t) })],
  [1.95, (t) => ({ ...crouch(14), turn: 0.6, lookX: 1, armL: [-38, -104], armR: [38, 104], handL: "open", handR: "open", smile: 0.85, mo: 0.2, tilt: -6 })],
  [2.4, (t) => ({ ...crouch(10), turn: Math.cos(((t - 2.4) / 0.45) * Math.PI * 2) * 0.8, armL: [100, 8], armR: [-100, -8], handL: "open", handR: "open", smile: 0.9, shut: 0.6, bend: 4, breath: 1 })],
  [2.9, (t) => ({ ...crouch(10 + 9 * Math.abs(sw(t))), turn: 0.7, lookX: 1, armR: [-78, -12], armL: [24, 34], handR: "open", handL: "open", smile: 0.85, mo: 0.15, twist: 0.25, bend: 3 * sw(t), hipTilt: -4 * sw(t) })],
];
const heroine = (t: number): FPose => {
  let i = 0;
  while (i < K.length - 1 && t >= K[i + 1][0]) i++;
  const cur = K[i][1](t);
  if (i === 0) return cur;
  const u = easeInOut((t - K[i][0]) / 0.16);
  return u >= 1 ? cur : mix(K[i - 1][1](t), cur, u);
};

/** Festival-night set: deep sky, string lights, lanterns, warm dusty floor, a spotlight haze. */
const FestivalStage: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#140c2e, #3a1740 55%, #6b2a2a 72%)" }} />
      {[260, 420].map((y, r) => (
        <svg key={y} width={1080} height={300} style={{ position: "absolute", top: y - 60, left: 0 }}>
          <path d={`M -20,40 Q 540,${150 + r * 30} 1100,40`} stroke="#2b1d14" strokeWidth={3} fill="none" />
          {Array.from({ length: 18 }, (_, i) => {
            const x = -20 + (i / 17) * 1120, tt = x / 1120, yy = 40 + (150 + r * 30 - 40) * 2 * tt * (1 - tt) * 2 * 0.5;
            const on = 0.6 + 0.4 * Math.sin(f / 5 + i * 1.7 + r);
            return <g key={i}><circle cx={x} cy={yy + 14} r={14} fill={["#ffd166", "#f472b6", "#5eead4", "#fb923c"][(i + r) % 4]} opacity={on} /><circle cx={x} cy={yy + 14} r={34} fill={["#ffd166", "#f472b6", "#5eead4", "#fb923c"][(i + r) % 4]} opacity={on * 0.18} /></g>;
          })}
        </svg>
      ))}
      {[150, 930].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 45, top: 560, width: 90, height: 120, borderRadius: 40, background: "radial-gradient(#ffcf6b, #e05d1a)", boxShadow: "0 0 80px #ff9a3c", transform: `rotate(${4 * Math.sin(f / 20 + x)}deg)` }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1480, bottom: 0, background: "linear-gradient(#7a4a2a, #4a2a18)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 40% at 50% 70%, rgba(255,214,140,0.35), transparent 70%)" }} />
    </AbsoluteFill>
  );
};

/** Male lead: captured motion, except the low-groove shot where tracking lost him in the crowd (keyframed from
 * the frames: deep wide crouch, forward lean, arms sweeping low on the beat). Cuts in the film are blended. */
const tr = D.tracks[0];
const capt = (f: number): FPose => {
  const p = tr.poses[Math.max(0, Math.min(tr.poses.length - 1, f))];
  return { ...p, lean: Math.max(-30, Math.min(30, p.lean ?? 0)) };
};
const groove = (t: number): FPose => ({ ...crouch(78), legL: legIK(-40, 395 - 78, -1), legR: legIK(40, 395 - 78, 1), lean: 22, armL: [-30 + 34 * sw(t), 18], armR: [10 + 34 * sw(t), -18], hipTilt: 7 * sw(t), bend: -6 * sw(t), twist: 0.35 * sw(t), shrug: 0.15, tilt: 5 * sw(t), handL: "open", handR: "open" });
const lead = (f: number): FPose => {
  const t = f / 30;
  const G0 = 31, G1 = 59;
  let p = f >= G0 && f < G1 ? groove(t) : capt(f);
  if (f >= G0 - 5 && f < G0 + 5) p = mix(capt(G0 - 5), groove(t), easeInOut((f - G0 + 5) / 10));
  if (f >= G1 - 5 && f < G1 + 5) p = mix(groove(t), capt(G1 + 5), easeInOut((f - G1 + 5) / 10));
  for (const c of [90]) if (f >= c - 4 && f < c + 4) p = mix(capt(c - 4), capt(c + 4), easeInOut((f - c + 4) / 8));
  return p;
};

export const YeshDance: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const i = Math.min(tr.poses.length - 1, f);
  const hero: FPose = { ...lead(f), smile: 0.8, mw: 0.7, browL: 0.3, browR: 0.3 };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Fonts />
      <FestivalStage />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(290,1640) scale(0.98)"><Fumble f={f} p={heroine(t)} look="heroine" /></g>
        <g transform={`translate(${770 + Math.max(-60, Math.min(60, tr.x[i] * 0.3))},1640) scale(1.02)`}><Fumble f={f} p={hero} /></g>
      </svg>
    </AbsoluteFill>
  );
};
