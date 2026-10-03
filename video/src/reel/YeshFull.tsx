import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { easeInOut, exaggerate, FPose, Fumble, idle, legIK, mix } from "./Fumble";
import { MocapData } from "./MocapCheck";
import { crouch, FestivalStage, groove, heroine as duetHeroine, lead as duetLead } from "./YeshDance";
import wide1 from "./mocap/yesh_wide1.json";
import nani1 from "./mocap/yesh_nani1.json";
import wide2 from "./mocap/yesh_wide2.json";
import faceK1 from "./mocap/yesh_face_k1.json";
import faceK2 from "./mocap/yesh_face_k2.json";
import audio from "./mocap/yesh_audio.json";
import { hook, HOOK_END } from "./HookStep";

// Yeshanagula, 0:51.0 - 0:82.9 of the song, as a Mr. Fumble x Heroine dance cover.
// Body: motion captured from the male lead where tracking held (wide group shots, solo, duet), with an animator
// cleanup layer of key poses read frame by frame; the heroine is keyed (saree defeats tracking) with her face
// captured from the female lead's close-ups. Faces: captured blendshapes + keyed expressions on every phrase.
// Mouths follow the vocal envelope for the singing character. Camera: close / medium / wide shots cut on beats.
// No song in the file: the track is added from Instagram's music library (start the clip at 0:51).
export const T0 = 51.0, T1 = 82.9;
export const END_CARD = 75;
export const YESH_FULL_LEN = Math.round((T1 - T0) * 30) + END_CARD;
export const DROP = 64.5; // hook-first cut starts on the drop
export const YESH_DROP_LEN = Math.round((T1 - DROP) * 30) + END_CARD;

type Face = Partial<FPose>;
type Cap = { start: number; data: MocapData; track: number };
const CAPS = {
  wide1: { start: 64.5, data: wide1 as unknown as MocapData, track: 0 },
  nani1: { start: 71.5, data: nani1 as unknown as MocapData, track: 0 },
  wide2: { start: 78.5, data: wide2 as unknown as MocapData, track: 1 },
};
const A = audio as { beats: number[]; env: number[]; sing: number[] };
const BEATS = A.beats;

/** Beat phase from the measured beat list (continuous), and a swing that peaks on every beat. */
const phase = (t: number) => {
  if (t <= BEATS[0]) return (t - BEATS[0]) / 0.72;
  for (let i = 0; i < BEATS.length - 1; i++) if (t < BEATS[i + 1]) return i + (t - BEATS[i]) / (BEATS[i + 1] - BEATS[i]);
  return BEATS.length - 1 + (t - BEATS[BEATS.length - 1]) / 0.72;
};
const sw = (t: number) => Math.sin(phase(t) * Math.PI * 2);
const bounce = (t: number) => Math.abs(Math.cos(phase(t) * Math.PI));
const sinceBeat = (t: number) => { const p = phase(t); return (p - Math.floor(p)) * 0.72; };
const env = (t: number) => A.env[Math.max(0, Math.min(A.env.length - 1, Math.round((t - T0) * 30)))] ?? 0;
const singer = (t: number) => A.sing[Math.max(0, Math.min(A.sing.length - 1, Math.round((t - T0) * 30)))] ?? 0;

const capt = (c: Cap, t: number): FPose => {
  const tr = c.data.tracks[c.track];
  const i = Math.max(0, Math.min(tr.poses.length - 1, Math.round((t - c.start) * 30)));
  const p = tr.poses[i];
  return { ...p, lean: Math.max(-30, Math.min(30, p.lean ?? 0)) };
};
const faceAt = (data: { face: Face[] }, start: number, t: number, lookFix = 0.7): Face => {
  const f = data.face[Math.max(0, Math.min(data.face.length - 1, Math.round((t - start) * 30)))] ?? {};
  return { ...f, lookY: ((f.lookY ?? 0) - lookFix) * 0.6, turn: (f.turn ?? 0) * 0.6, tilt: (f.tilt ?? 0) * 0.8 };
};

/** Mirror a pose left-right (for the heroine following the lead's group choreography, and the crowd). */
const mirror = (p: FPose): FPose => ({
  ...p, armL: p.armR ? [-p.armR[0], -p.armR[1]] : undefined, armR: p.armL ? [-p.armL[0], -p.armL[1]] : undefined,
  legL: p.legR ? [-p.legR[0], -p.legR[1]] : undefined, legR: p.legL ? [-p.legL[0], -p.legL[1]] : undefined,
  armLs: p.armRs, armRs: p.armLs, legLs: p.legRs, legRs: p.legLs, handL: p.handR, handR: p.handL,
  lean: -(p.lean ?? 0), hipTilt: -(p.hipTilt ?? 0), bend: -(p.bend ?? 0), twist: -(p.twist ?? 0), turn: -(p.turn ?? 0), bodyTurn: -(p.bodyTurn ?? 0),
  shrugL: p.shrugR, shrugR: p.shrugL, tilt: -(p.tilt ?? 0), hipX: -(p.hipX ?? 0), armLBack: p.armRBack, armRBack: p.armLBack,
});
const soften = (p: FPose, k: number): FPose => mix({ ...p, armL: [14, 18], armR: [-14, -18], lean: 0 }, p, k);
/** Her own face over a borrowed body pose: drop his eye/brow/mouth settings. */
const ownFace = (p: FPose): FPose => ({ ...p, eyeSize: 1, lid: 0, squint: 0, shut: 0, browL: 0.3, browR: 0.3, knit: 0, pucker: 0, skew: 0, mo: 0 });

type Seg = [number, (t: number) => FPose];
/** Run a segment list with eased blends (0.15 s) between segments. */
const run = (segs: Seg[], t: number, blend = 0.15): FPose => {
  let i = 0;
  while (i < segs.length - 1 && t >= segs[i + 1][0]) i++;
  const cur = segs[i][1](t);
  if (i === 0) return cur;
  const u = easeInOut((t - segs[i][0]) / blend);
  return u >= 1 ? cur : mix(segs[i - 1][1](t), cur, u);
};

// ---------- expressions ----------
const GRIN: Face = { smile: 0.95, mw: 0.75, browL: 0.25, browR: 0.25 };
const LAUGH = (t: number): Face => ({ smile: 1, mo: 0.55 + 0.15 * bounce(t), shut: 0.7, tilt: -12, browL: 0.4, browR: 0.4 });
const SHOUT = (t: number): Face => ({ smile: 0.4, mo: 0.75 + 0.15 * bounce(t), browL: 0.7, browR: 0.7, eyeSize: 1.15 });
const SMUG: Face = { smile: 0.7, skew: 0.6, lid: 0.35, browL: 0.5, browR: -0.1 };
const WHISTLE: Face = { pucker: 1, mo: 0.2, browL: 0.7, browR: 0.7 };
const COY: Face = { smile: 0.6, skew: -0.3, lid: 0.25, lookX: 0.9, blush: 0.6, tilt: 8 };

// ---------- Mr. Fumble (male lead) ----------
const lipM = (t: number) => (singer(t) === 2 ? 0 : Math.max(0, env(t) - 0.35) * 0.9); // light lip-sync on male lines
const F_SEGS: Seg[] = [
  [51.0, (t) => ({ ...idle(t * 30), turn: -0.45, lookX: -1, ...GRIN, armL: [78, 40], handL: "open", armR: [-18, -24], bend: -6, lean: -3, mo: lipM(t) })],
  [51.8, (t) => ({ ...idle(t * 30), turn: -0.3, armL: [78, 40], armR: [-18, -24], bend: -5, ...LAUGH(t) })],
  [52.5, (t) => ({ ...idle(t * 30), turn: -0.2, armL: [70, 36], armR: [-24, 168], handR: "fist", ...WHISTLE, tilt: 4 })],
  [53.15, (t) => ({ ...idle(t * 30), turn: -0.4, lookX: -1, armL: [72, 40], armR: [-22, -26], ...SMUG, browL: 0.5 * Math.max(0, Math.sin(t * 22)), bend: -4 })],
  [54.4, (t) => ({ ...crouch(14 + 10 * bounce(t)), armL: [30 + 18 * sw(t), -40], armR: [-30 + 18 * sw(t), 40], handL: "fist", handR: "fist", hipTilt: 5 * sw(t), twist: 0.3 * sw(t), tilt: 4 * sw(t), ...GRIN, mo: lipM(t) })],
  [56.0, (t) => ({ ...crouch(8), armL: [22, -112], armR: [-22, 112], handL: "open", handR: "open", lookY: 1, lookX: 0.2, tilt: 10, ...SMUG, lid: 0.4, bend: 3 * sw(t) })],
  [57.25, (t) => ({ ...idle(t * 30), turn: -0.5, lookX: -1, armL: [12, 16], armR: [-30, -110], handR: "fist", browL: Math.sin(t * 26), browR: -Math.sin(t * 26), smile: 0.8, skew: 0.5 })],
  [58.0, (t) => ({ ...crouch(6 + 12 * bounce(t)), armL: [72, -8], armR: [-72, 8], handL: "open", handR: "open", lean: -6, breath: 1, smile: 0.75, lid: 0.35, tilt: -6, shrugL: 0.2 * Math.max(0, sw(t)), shrugR: 0.2 * Math.max(0, -sw(t)) })],
  [58.75, (t) => ({ ...idle(t * 30), turn: -0.5, lookX: -1, lean: -9, armL: [10, 12], armR: [-26, -100], handR: "fist", smile: 1, mo: 0.2, browL: 0.6, browR: 0.6 })],
  [59.6, (t) => ({ ...idle(t * 30), turn: -0.6, lookX: -1, lean: 12, bend: -8, armL: [60, 20], armR: [-20, -20], mo: 0.6, smile: -0.1, eyeSize: 1.3, browL: 1, browR: 1 })],
  [60.75, (t) => ({ ...idle(t * 30), turn: -0.3, armL: [30, -100], armR: [-30, 100], handL: "fist", handR: "fist", ...LAUGH(t), tilt: -16, lean: -5 })],
  [61.5, (t) => ({ ...idle(t * 30), turn: -0.55, bend: -6 + 4 * sw(t), lean: -2 + 2 * sw(t), armL: [70, 30], armR: [-18, -20], smile: 1, shut: 1, tilt: -8 + 4 * sw(t), blush: 0.5 })],
  [62.5, (t) => ({ ...idle(t * 30), turn: -0.6, lookX: -1, smile: 0.8, blush: 0.7, browL: 0.4, browR: 0.1, armL: [40, 60], armR: [-18, -22], winkR: t > 62.7 && t < 62.85 ? 1 : 0 })],
  [63.0, (t) => ({ ...idle(t * 30), turn: -0.55, lookX: -1, smile: 0.95, mo: 0.3, armL: [16, 20], armR: [-30, -95], handR: "fist", lean: -3 })],
  [64.5, (t) => ({ ...hook(t), turn: 0 })],
  [HOOK_END, (t) => {
    const c = capt(CAPS.wide1, t);
    const key: FPose = { ...crouch(40), legL: legIK(-60, 395 - 40, -1), legR: legIK(60, 395 - 40, 1), lean: 8 * sw(t), armL: [150 * Math.max(0, sw(t)) + 20, -20], armR: [-40, -30], handL: "fist", handR: "fist", twist: 0.4 * sw(t) };
    const w = t < 66.3 ? 0.75 : 0.35; // before 66.3 the crowd confused the tracker: lean on the key pose
    return { ...mix(c, key, w), ...(t > 67.9 && t < 68.5 ? LAUGH(t) : t % 1.44 < 0.5 ? SHOUT(t) : GRIN), handL: "fist", handR: "fist", turn: 0, bodyTurn: c.bodyTurn };
  }],
  [71.5, (t) => {
    const c = capt(CAPS.nani1, t);
    const fist = t > 71.95 && t < 72.45;
    const key: FPose = fist ? { ...crouch(46), legL: legIK(-70, 395 - 46, -1), legR: legIK(40, 395 - 46, 1), armR: [-30, 165], handR: "fist", armL: [40, 30], lean: 6 } : { ...crouch(50 + 12 * bounce(t)), armL: [20, -70], armR: [-20, 70], handL: "fist", handR: "fist" };
    return { ...mix(c, key, 0.6), ...(fist ? WHISTLE : { smile: 0.65, skew: 0.5, knit: 0.35, lid: 0.25 }), handR: "fist", turn: 0.1 };
  }],
  [73.2, (t) => ({ ...crouch(20 + 14 * bounce(t)), turn: -0.5, lookX: -1, armL: [40 + 30 * sw(t), 20], armR: [-40, -60], ...GRIN, mo: 0.2 + lipM(t) })],
  [74.5, (t) => ({ ...duetLead(Math.round((t - 74.5) * 30)), mo: lipM(t), smile: 0.85 })],
  [78.5, (t) => {
    const c = capt(CAPS.wide2, t);
    const s = sw(t);
    const key: FPose = { ...crouch(92), legL: legIK(-120, 395 - 92, -1), legR: legIK(120, 395 - 92, 1), lean: 18 * s, bend: 8 * s, armL: [96 + 30 * s, 10], armR: [-96 + 30 * s, -10], handL: "open", handR: "open", hipTilt: 8 * s, twist: 0.5 * s, tilt: 6 * s };
    return { ...mix(c, key, 0.8), ...SHOUT(t), smile: 0.7, handL: "open", handR: "open", turn: 0.2 * s };
  }],
  [82.35, (t) => {
    const j = Math.sin(Math.min(1, (t - 82.35) / 0.4) * Math.PI);
    return { hipY: -70 * j, still: true, legL: [30 * j, -60 * j], legR: [-30 * j, 60 * j], armL: [165, 10], armR: [-165, -10], handL: "open", handR: "open", ...LAUGH(t), tilt: -10, shrug: 0.5 };
  }],
];

// ---------- Heroine (female lead) ----------
/** Her own folk-dance phrases, four beats each, locked to the measured beats: clap-bounce, arms-up sway,
 * full spin, and the lead's step done with her own flourish. */
const folk = (t: number, from: number): FPose => {
  const p = phase(t) - phase(from), k = Math.floor(p / 4) % 4, u = p - Math.floor(p);
  const s1 = Math.sin(p * Math.PI * 2), b = Math.abs(Math.cos(p * Math.PI));
  const face: Face = { smile: 0.95, mw: 0.7, mo: 0.15 + 0.25 * b, browL: 0.35, browR: 0.35, blush: 0.4 };
  if (k === 0) { // clap on every beat, knees bouncing, hips swaying
    const c = Math.pow(Math.abs(Math.cos(p * Math.PI)), 3);
    return { ...crouch(10 + 18 * b), hipX: 14 * s1, hipTilt: 9 * s1, bend: -6 * s1, armL: [70 - 30 * c, 60 + 40 * c], armR: [-70 + 30 * c, -60 - 40 * c], handL: "open", handR: "open", tilt: 7 * s1, ...face };
  }
  if (k === 1) { // arms up, wrists circling, swaying side to side
    return { ...crouch(8 + 10 * b), hipX: 18 * s1, hipTilt: 10 * s1, bend: 8 * s1, armL: [158 + 8 * s1, 30 + 30 * Math.sin(p * 9)], armR: [-158 + 8 * s1, -30 - 30 * Math.cos(p * 9)], handL: "open", handR: "open", tilt: -6 * s1, ...face, shut: 0.5 };
  }
  if (k === 2) { // full turn over four beats, arms out, skirt flaring
    const turn = Math.cos(((p % 4) / 4) * Math.PI * 2);
    return { ...crouch(12), bodyTurn: Math.sin(((p % 4) / 4) * Math.PI * 2) * 0.9, turn: Math.sin(((p % 4) / 4) * Math.PI * 2) * 0.9, armL: [96 + 10 * turn, 20], armR: [-96 - 10 * turn, -20], handL: "open", handR: "open", breath: 1, ...face, mo: 0.35 };
  }
  // his step, mirrored, with her hands at the waist and a head tilt on each beat
  const m = ownFace(mirror(run(F_SEGS, t)));
  return { ...m, armL: [38, -84], armR: [-38, 84], handL: "fist", handR: "fist", tilt: 9 * s1, shrugL: 0.3 * Math.max(0, s1), shrugR: 0.3 * Math.max(0, -s1), ...face, eyeSize: 1, lid: 0 };
};

const K1 = faceK1 as { face: Face[] }, K2 = faceK2 as { face: Face[] };
const lipF = (t: number) => (singer(t) === 2 ? Math.min(0.9, env(t) * 1.1) : 0);
const H_SEGS: Seg[] = [
  [51.0, (t) => ({ ...idle(t * 30), armL: [38, -84], armR: [-16, -40], handL: "fist", ...faceAt(K1, 51.0, t), mo: Math.max(faceAt(K1, 51.0, t).mo ?? 0, lipF(t)) })],
  [53.45, (t) => ({ ...idle(t * 30), armL: [38, -84], armR: [-30, -100], handR: "open", ...faceAt(K1, 51.0, t), tilt: -12, lid: 0.55, smile: 0.5, skew: -0.4, bend: 4 })],
  [53.75, (t) => ({ ...idle(t * 30), turn: -0.5, twist: -0.6, armL: [38, -84], armR: [-38, 84], handL: "fist", handR: "fist", shrugL: 0.4 * Math.max(0, Math.sin(t * 40)), shrugR: 0.4 * Math.max(0, -Math.sin(t * 40)), smile: 0.7, skew: -0.4, lid: 0.3, tilt: 6, mo: lipF(t) })],
  [54.4, (t) => ({ ...idle(t * 30), armL: [38, -84], armR: [-38, 84], handL: "fist", handR: "fist", hipTilt: 8 * sw(t), bend: -5 * sw(t), hipX: 10 * sw(t), tilt: 6 * sw(t), smile: 0.85, mo: lipF(t), lookX: 0.3 * sw(t) })],
  [56.0, (t) => ({ ...idle(t * 30), turn: 0.5, ...COY, armL: [14, 18], armR: [-24, -150], handR: "point" })],
  [57.4, (t) => ({ ...idle(t * 30), turn: 0.6, lookX: 1, smile: 0.95, mw: 0.7, armL: [38, -84], armR: [-16, -20], handL: "fist", blush: 0.4 })],
  [58.0, (t) => ({ ...idle(t * 30), turn: 0.5, lookX: 1, armL: [26, -118 + 14 * bounce(t)], armR: [-26, 118 - 14 * bounce(t)], handL: "open", handR: "open", smile: 0.9, mo: 0.2 + 0.2 * bounce(t) })],
  [58.75, (t) => ({ ...idle(t * 30), turn: 0.6, lookX: 1, lean: 6, armR: [-86, -8], handR: "point", armL: [38, -84], handL: "fist", smile: 0.8, skew: 0.4, lid: 0.2, browL: 0.5, browR: 0.2 })],
  [59.6, (t) => { const pull = Math.min(1, (t - 59.6) / 0.5); return { ...idle(t * 30), turn: 0.6, lookX: 1, lean: -8 * pull, armL: [92 - 40 * pull, 10], armR: [-92 + 30 * pull, -30 * pull], handL: "fist", handR: "fist", smile: 0.9, skew: 0.5, mo: 0.2 }; }],
  [60.75, (t) => ({ ...idle(t * 30), turn: 0.6, ...COY, armL: [30, -150], armR: [-30, 150], handL: "open", handR: "open" })],
  [61.5, (t) => ({ ...idle(t * 30), turn: 0.55, bend: 6 + 4 * sw(t), lean: 2 + 2 * sw(t), armL: [14, 18], armR: [-60, -40], smile: 1, shut: 1, tilt: 8 + 4 * sw(t), blush: 0.6, mo: lipF(t) })],
  [62.5, (t) => ({ ...idle(t * 30), turn: 0.6, lookX: 1, smile: 0.8, blush: 0.8, browL: 0.3, browR: 0.3, armL: [30, -130], armR: [-16, -20], handL: "open" })],
  [63.0, (t) => ({ ...idle(t * 30), ...faceAt(K2, 62.9, t), smile: 1, mo: 0.55 + 0.2 * bounce(t), shut: 0.7, tilt: -12, armL: [24, -140], armR: [-16, -24], handL: "open", lean: -4 })],
  [64.5, (t) => ({ ...ownFace(mirror(hook(t + 0.04))), smile: 0.95, mo: 0.3 * bounce(t), handL: "fist", handR: "fist" })],
  [HOOK_END, (t) => folk(t, HOOK_END)],
  [73.2, (t) => ({ ...idle(t * 30), turn: Math.cos(((t - 73.2) / 0.6) * Math.PI * 2) * 0.7, armL: [160, 20 + 20 * sw(t)], armR: [-160, -20 - 20 * sw(t)], handL: "open", handR: "open", smile: 1, mo: 0.3, bend: 5 * sw(t), breath: 1 })],
  [74.5, (t) => ({ ...duetHeroine(t - 74.5), mo: Math.max(duetHeroine(t - 74.5).mo ?? 0, lipF(t)) })],
  [78.5, (t) => ({ ...mix(ownFace(mirror(F_SEGS[18][1](t + 0.05))), folk(t, 78.5), 0.35), smile: 0.95, mo: 0.3 * bounce(t) + lipF(t), turn: 0 })],
  [82.35, (t) => ({ ...idle(t * 30), armL: [165, 10], armR: [-165, -10], handL: "open", handR: "open", smile: 1, mo: 0.5, shut: 0.6, tilt: 10, shrug: 0.4, hipY: -20 * Math.sin(Math.min(1, (t - 82.35) / 0.4) * Math.PI) })],
];

/** Festival street at night (user-supplied art): scaled to frame height, vanishing point centred, flickering
 * lantern glow and drifting dust on top. */
const StreetStage: React.FC = () => {
  const f = useCurrentFrame();
  const flick = 0.5 + 0.25 * Math.sin(f / 4.3) + 0.15 * Math.sin(f / 1.7);
  return (
    <AbsoluteFill>
      <Img src={staticFile("yesh/bg_street.png")} style={{ position: "absolute", top: 0, left: -1399, height: 1920, width: 3412 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 62%, rgba(255,190,110,${0.12 + 0.08 * flick}), transparent 70%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(10,20,40,0.15), transparent 40%, rgba(40,15,5,0.25))" }} />
      {Array.from({ length: 26 }, (_, i) => {
        const x = (i * 397 + f * (0.6 + (i % 5) * 0.2)) % 1180 - 50, y = 1450 - ((f * (0.8 + (i % 3) * 0.3) + i * 211) % 900);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, borderRadius: 6, background: "rgba(255,210,140,0.55)", filter: "blur(1px)" }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- staging: where they stand, camera shots, crowd ----------
type Shot = { t: number; zoom: number; cx: number; cy: number; cut?: boolean };
const SHOTS: Shot[] = [
  { t: 51.0, zoom: 1.55, cx: 545, cy: 760, cut: true },
  { t: 52.5, zoom: 1.68, cx: 600, cy: 740, cut: true },
  { t: 53.75, zoom: 1.46, cx: 500, cy: 780, cut: true },
  { t: 54.4, zoom: 1.25, cx: 540, cy: 1080, cut: true },
  { t: 56.0, zoom: 1.63, cx: 650, cy: 760, cut: true },
  { t: 57.25, zoom: 1.38, cx: 560, cy: 820, cut: true },
  { t: 58.0, zoom: 1.12, cx: 560, cy: 1150, cut: true },
  { t: 58.75, zoom: 1.59, cx: 545, cy: 760, cut: true },
  { t: 60.75, zoom: 1.46, cx: 560, cy: 780, cut: true },
  { t: 61.5, zoom: 1.72, cx: 540, cy: 740, cut: true },
  { t: 62.5, zoom: 1.55, cx: 540, cy: 760, cut: true },
  { t: 63.0, zoom: 1.5, cx: 440, cy: 780, cut: true },
  { t: 64.5, zoom: 1.0, cx: 540, cy: 1000, cut: true },
  { t: 66.5, zoom: 1.15, cx: 600, cy: 1080, cut: true },
  { t: 68.5, zoom: 1.0, cx: 540, cy: 1000, cut: true },
  { t: 70.5, zoom: 1.2, cx: 640, cy: 1060, cut: true },
  { t: 71.5, zoom: 1.45, cx: 690, cy: 1040, cut: true },
  { t: 73.2, zoom: 1.05, cx: 540, cy: 1020, cut: true },
  { t: 74.5, zoom: 1.12, cx: 540, cy: 1060, cut: true },
  { t: 78.5, zoom: 0.98, cx: 540, cy: 1000, cut: true },
  { t: 81.5, zoom: 1.0, cx: 540, cy: 1000 },
  { t: 82.35, zoom: 1.25, cx: 640, cy: 1000 },
];
const beatAfter = (x: number) => BEATS.find((b) => b >= x) ?? x;
const COVER: [number, number, number][] = [[1.0, 540, 1000], [1.45, 720, 980], [1.55, 360, 960], [2.05, 600, 760], [1.15, 540, 1060], [1.5, 380, 820], [1.7, 720, 800]];
/** Second half: a new angle every two beats (wide / medium on him / medium on her / faces / push-in). */
const coverage = (a: number, b: number, offset = 0, drop = 0): Shot[] => {
  const out: Shot[] = [];
  let t = beatAfter(a), i = offset;
  while (t < b) {
    const [zoom, cx, cy] = COVER[i % COVER.length];
    const yy = cy + (cy < 900 ? drop : drop * 0.4); // follow the heads down when the dancers squat
    out.push({ t, zoom: Math.min(zoom, drop ? 1.6 : 2.1), cx, cy: yy, cut: true });
    out.push({ t: t + 1.38, zoom: Math.min(zoom, drop ? 1.6 : 2.1) * 1.08, cx, cy: yy - 20 }); // slow push within the shot
    const n = BEATS.indexOf(t);
    t = n >= 0 && BEATS[n + 2] ? BEATS[n + 2] : t + 1.44;
    i++;
  }
  return out;
};
const ALL_SHOTS: Shot[] = [
  ...SHOTS.filter((s) => s.t < 64.5),
  { t: 64.5, zoom: 1.0, cx: 540, cy: 1000, cut: true }, ...coverage(64.6, 71.4, 1),
  ...SHOTS.filter((s) => s.t >= 71.5 && s.t < 78.5),
  { t: 78.5, zoom: 0.98, cx: 540, cy: 1000, cut: true }, ...coverage(78.6, 82.2, 3, 140),
  { t: 82.2, zoom: 1.0, cx: 560, cy: 1000, cut: true }, { t: 82.35, zoom: 1.15, cx: 560, cy: 920, cut: true },
].sort((x, y) => x.t - y.t);
const shotAt = (t: number) => {
  let i = 0;
  while (i < ALL_SHOTS.length - 1 && t >= ALL_SHOTS[i + 1].t) i++;
  const a = ALL_SHOTS[i], b = ALL_SHOTS[i + 1];
  if (!b || b.cut) return a; // hold until the next cut
  const u = easeInOut((t - a.t) / (b.t - a.t));
  return { ...a, zoom: a.zoom + (b.zoom - a.zoom) * u, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u };
};
const positions = (t: number): { h: number; f: number } => {
  if (t < 64.5) return t >= 61.5 && t < 62.5 ? { h: 395, f: 700 } : { h: 380, f: 710 };
  if (t < 74.5) return { h: 330, f: 730 };
  if (t < 78.5) return { h: 290, f: 770 };
  return { h: 320, f: 740 };
};
const CROWD = [
  { x: 130, y: 1500, s: 0.62, d: 3, m: false }, { x: 330, y: 1470, s: 0.58, d: 5, m: true }, { x: 540, y: 1480, s: 0.6, d: 2, m: false },
  { x: 760, y: 1470, s: 0.58, d: 4, m: true }, { x: 960, y: 1500, s: 0.62, d: 6, m: false }, { x: 230, y: 1420, s: 0.5, d: 7, m: true },
  { x: 440, y: 1410, s: 0.48, d: 3, m: false }, { x: 650, y: 1410, s: 0.48, d: 6, m: true }, { x: 860, y: 1420, s: 0.5, d: 2, m: false },
];
const crowdOn = (t: number) => (t >= 64.5 && t < 74.5) || t >= 78.5;

export const YeshFull: React.FC<{ title?: boolean; handle?: string; from?: number }> = ({ title = true, handle = "@ai_maastaaru_telugu", from = T0 }) => {
  const f = useCurrentFrame();
  const raw = from + f / 30;
  const lf = f; // frames since the reel started (for on-screen text)
  const t = raw >= 82.18 && raw < 82.36 ? 82.18 : Math.min(raw, T1 - 0.01); // a held beat before the final jump
  const flash = Math.max(0, 1 - Math.abs(raw - 82.38) / 0.12);
  const endIn = Math.max(0, Math.min(1, (raw - T1) / 0.25));
  const shot = from === DROP && lf < 105 ? { zoom: 1.22, cx: 520, cy: 1000 } : shotAt(t);
  const pulse = 1 + 0.014 * Math.exp(-sinceBeat(t) * 9);
  const z = shot.zoom * pulse;
  const pos = positions(t);
  const hp = exaggerate(run(H_SEGS, t), 1.35), fp = exaggerate(run(F_SEGS, t), 1.45);
  const cam = `translate(540,960) scale(${z}) translate(${-shot.cx},${-shot.cy})`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#140c2e" }}>
      <Fonts />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(540px,960px) scale(${1 + (z - 1) * 0.35}) translate(${-540 - (shot.cx - 540) * 0.35}px,${-960 - (shot.cy - 960) * 0.35}px)` }}>
        <StreetStage />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: "sepia(0.1) saturate(1.08) drop-shadow(0 0 14px rgba(255,170,80,0.35))" }}>
        <g transform={cam}>
          {crowdOn(t) && (
            <g style={{ filter: "brightness(0.16) saturate(0) blur(3.5px)" }} opacity={0.8}>
              {CROWD.map((c, i) => {
                const p = exaggerate(run(F_SEGS, t - (c.d * 2) / 30), 1.3);
                return <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}><Fumble f={f + i * 7} p={{ ...(c.m ? mirror(p) : p), ...GRIN }} braids /></g>;
              })}
            </g>
          )}
          <g transform={`translate(${pos.h},1640) scale(0.98)`}><Fumble f={f} p={hp} look="heroine" /></g>
          <g transform={`translate(${pos.f},1640) scale(1.02)`}><Fumble f={f} p={fp} braids /></g>
        </g>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 55%, rgba(10,5,25,0.55))", pointerEvents: "none" }} />
      {raw >= 64.5 && raw < 71.5 && !(from === DROP && lf < 105) && (
        <div style={{ position: "absolute", top: 230, right: 30, width: 300, height: 400, borderRadius: 22, background: "rgba(11,16,34,0.88)", border: "2px solid #22d3ee", overflow: "hidden", opacity: Math.min(1, (raw - 64.5) / 0.3, (71.5 - raw) / 0.3) }}>
          <svg width={300} height={400}><g transform="translate(150,380) scale(0.33)"><Fumble f={f} p={fp} bonesOnly /></g></svg>
          <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 26, color: "#22d3ee", letterSpacing: 1 }}>AI POSE TRACKING</div>
        </div>
      )}
      {title && from === DROP && lf < 105 && (
        <div style={{ position: "absolute", left: 30, top: 330, width: 460, height: 720, borderRadius: 30, background: "rgba(11,16,34,0.92)", border: "3px solid #22d3ee", opacity: Math.min(1, lf / 4, (105 - lf) / 12) }}>
          <svg width={460} height={700}><g transform="translate(230,670) scale(0.58)"><Fumble f={f} p={fp} bonesOnly /></g></svg>
          <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 32, color: "#22d3ee" }}>AI POSE TRACKING</div>
          <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 700, fontSize: 22, color: "#cbd5e1" }}>Google MediaPipe → cartoon rig</div>
        </div>
      )}
      {title && from === DROP && lf < 105 && (
        <div style={{ position: "absolute", top: 150, left: 40, right: 40, textAlign: "center", opacity: Math.min(1, lf / 3, (105 - lf) / 10) }}>
          <div style={{ display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 58, lineHeight: 1.12, color: "#fff", background: "rgba(20,12,46,0.85)", padding: "16px 28px", borderRadius: 26 }}>AI copied this dance <span style={{ color: "#ffd166" }}>from the film</span> 👀</div>
        </div>
      )}
      {title && from !== DROP && f < 84 && (
        <div style={{ position: "absolute", top: 210, left: 50, right: 50, textAlign: "center", opacity: Math.min(1, f / 4, (84 - f) / 10), transform: `scale(${1 + 0.06 * Math.max(0, 1 - f / 8)})` }}>
          <div style={{ display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 64, lineHeight: 1.12, color: "#fff", background: "rgba(20,12,46,0.82)", padding: "18px 30px", borderRadius: 28 }}>AI copied this dance<br /><span style={{ color: "#ffd166" }}>step by step</span> 👀</div>
        </div>
      )}
      {raw < T1 && (
        <div style={{ position: "absolute", top: 70, left: 40, display: "flex", alignItems: "center", gap: 10, background: "rgba(11,16,34,0.8)", border: "2px solid rgba(34,211,238,0.6)", borderRadius: 18, padding: "8px 16px" }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#f43f5e", opacity: f % 30 < 18 ? 1 : 0.3 }} />
          <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 34, color: "#fff" }}>AI motion capture</span>
        </div>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.8, pointerEvents: "none" }} />
      {raw >= T1 && (
        <AbsoluteFill style={{ background: `rgba(20,12,46,${0.85 * endIn})`, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ transform: `scale(${0.85 + 0.15 * endIn})`, opacity: endIn }}>
            <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 64, color: "#fff", lineHeight: 1.15 }}>Dance tracked by AI<br />from the film</div><div style={{ marginTop: 18, fontFamily: "Inter", fontWeight: 700, fontSize: 34, color: "#cbd5e1" }}>MediaPipe pose tracking + hand-polished keyframes</div>
            <div style={{ marginTop: 40, display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 48, color: "#fff", background: "#0095f6", padding: "16px 40px", borderRadius: 22 }}>Follow {handle}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
