import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { easeInOut, FPose, Fumble, idle, legIK, mix } from "./Fumble";
import { MocapData } from "./MocapCheck";
import { crouch, FestivalStage, groove, heroine as duetHeroine, lead as duetLead } from "./YeshDance";
import wide1 from "./mocap/yesh_wide1.json";
import nani1 from "./mocap/yesh_nani1.json";
import wide2 from "./mocap/yesh_wide2.json";
import faceK1 from "./mocap/yesh_face_k1.json";
import faceK2 from "./mocap/yesh_face_k2.json";
import audio from "./mocap/yesh_audio.json";

// Yeshanagula, 0:51.0 - 0:82.9 of the song, as a Mr. Fumble x Heroine dance cover.
// Body: motion captured from the male lead where tracking held (wide group shots, solo, duet), with an animator
// cleanup layer of key poses read frame by frame; the heroine is keyed (saree defeats tracking) with her face
// captured from the female lead's close-ups. Faces: captured blendshapes + keyed expressions on every phrase.
// Mouths follow the vocal envelope for the singing character. Camera: close / medium / wide shots cut on beats.
// No song in the file: the track is added from Instagram's music library (start the clip at 0:51).
export const T0 = 51.0, T1 = 82.9;
export const YESH_FULL_LEN = Math.round((T1 - T0) * 30);

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
  [64.5, (t) => {
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
  [64.5, (t) => ({ ...ownFace(soften(mirror(F_SEGS[14][1](t + 0.07)), 0.85)), handL: "open", handR: "open", smile: 0.95, mo: 0.25 * bounce(t), shut: t > 67.9 && t < 68.5 ? 0.7 : 0, turn: 0 })],
  [73.2, (t) => ({ ...idle(t * 30), turn: Math.cos(((t - 73.2) / 0.6) * Math.PI * 2) * 0.7, armL: [160, 20 + 20 * sw(t)], armR: [-160, -20 - 20 * sw(t)], handL: "open", handR: "open", smile: 1, mo: 0.3, bend: 5 * sw(t), breath: 1 })],
  [74.5, (t) => ({ ...duetHeroine(t - 74.5), mo: Math.max(duetHeroine(t - 74.5).mo ?? 0, lipF(t)) })],
  [78.5, (t) => ({ ...ownFace(soften(mirror(F_SEGS[18][1](t + 0.05)), 0.9)), handL: "open", handR: "open", smile: 0.95, mo: 0.3 * bounce(t) + lipF(t), turn: 0 })],
  [82.35, (t) => ({ ...idle(t * 30), armL: [165, 10], armR: [-165, -10], handL: "open", handR: "open", smile: 1, mo: 0.5, shut: 0.6, tilt: 10, shrug: 0.4, hipY: -20 * Math.sin(Math.min(1, (t - 82.35) / 0.4) * Math.PI) })],
];

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
const shotAt = (t: number) => {
  let i = 0;
  while (i < SHOTS.length - 1 && t >= SHOTS[i + 1].t) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
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

export const YeshFull: React.FC<{ title?: boolean }> = ({ title = true }) => {
  const f = useCurrentFrame();
  const t = T0 + f / 30;
  const shot = shotAt(t);
  const pulse = 1 + 0.014 * Math.exp(-sinceBeat(t) * 9);
  const z = shot.zoom * pulse;
  const pos = positions(t);
  const hp = run(H_SEGS, t), fp = run(F_SEGS, t);
  const cam = `translate(540,960) scale(${z}) translate(${-shot.cx},${-shot.cy})`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#140c2e" }}>
      <Fonts />
      <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(540px,960px) scale(${1 + (z - 1) * 0.35}) translate(${-540 - (shot.cx - 540) * 0.35}px,${-960 - (shot.cy - 960) * 0.35}px)` }}>
        <FestivalStage />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={cam}>
          {crowdOn(t) && (
            <g style={{ filter: "brightness(0.12) saturate(0) blur(1.5px)" }} opacity={0.92}>
              {CROWD.map((c, i) => {
                const p = run(F_SEGS, t - c.d / 30);
                return <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.s})`}><Fumble f={f + i * 7} p={{ ...(c.m ? mirror(p) : p), ...GRIN }} /></g>;
              })}
            </g>
          )}
          <g transform={`translate(${pos.h},1640) scale(0.98)`}><Fumble f={f} p={hp} look="heroine" /></g>
          <g transform={`translate(${pos.f},1640) scale(1.02)`}><Fumble f={f} p={fp} /></g>
        </g>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 55%, rgba(10,5,25,0.55))", pointerEvents: "none" }} />
      {title && f < 75 && (
        <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: Math.min(1, f / 6, (75 - f) / 10) }}>
          <span style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 46, color: "#fff", background: "rgba(20,12,46,0.75)", padding: "12px 28px", borderRadius: 24 }}>Mr. Fumble × Yeshanagula</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
