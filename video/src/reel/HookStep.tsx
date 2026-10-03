import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { easeBack, easeInOut, exaggerate, follow, FPose, Fumble, legIK, mix } from "./Fumble";

// Yeshanagula hook step (film 64.4 - 68.5 s), keyed at 24 fps resolution from the footage, every key placed on
// the measured beat grid (64.769, 65.466, 66.186, 66.906, 67.625, 68.345). Feet stay planted in a wide stance;
// weight shifts move the pelvis between them. Accents land with a slight overshoot (easeBack), recoveries ease.
// Times are film seconds so the move drops straight into the song.

/** Wide horse stance with both feet locked at +-110 on the floor; the pelvis moves between them. */
export const stance = (drop: number, hipX = 0, spread = 215): Partial<FPose> => ({
  still: true, hipX, hipY: drop,
  legL: legIK(-spread - (hipX - 34), 395 - drop, -1), legR: legIK(spread - (hipX + 34), 395 - drop, 1),
  toeL: 6, toeR: 6,
});

const SHOUT: Partial<FPose> = { smile: 0.5, mo: 0.7, mw: 0.55, browL: 0.7, browR: 0.7, eyeSize: 1.1 };
const FIERCE: Partial<FPose> = { smile: 0.35, mo: 0.25, knit: 0.4, browL: -0.2, browR: -0.2, lid: 0.15 };
const LAUGH: Partial<FPose> = { smile: 1, mo: 0.6, shut: 0.75, browL: 0.4, browR: 0.4 };

type Key = { t: number; p: FPose; hit?: boolean };
const k = (t: number, drop: number, hipX: number, p: Partial<FPose>, hit = false): Key => ({ t, hit, p: { ...stance(drop + 22, hipX * 2), handL: "fist", handR: "fist", ...p } });

// Arm/lean values marked (m) are measured from the footage (median of 3 frames, pose tracking on the male lead,
// identity checked on an overlay); the rest are read by eye where tracking lost him (64.71, 64.96, 66.90, 67.10).
export const HOOK_KEYS: Key[] = [
  k(64.42, 50, 10, { armL: [33, 92], armR: [-105, -99], lean: -6, bend: -4, twist: -0.2, tilt: -6, lookY: -0.5, ...FIERCE }), // (m) both arms flexed up
  k(64.71, 52, 12, { armL: [40, 100], armR: [-150, -60], lean: -9, bend: -6, twist: -0.3, shrugR: 0.5, tilt: -12, lookY: -1, wristR: -20, ...SHOUT }, true),
  k(64.96, 56, 6, { armL: [36, 60], armR: [-70, -90], lean: -8, bend: -4, tilt: -2, ...FIERCE }),
  k(65.40, 60, 0, { armL: [15, -134], armR: [-16, 124], lean: -3, tilt: 3, lookY: 0.3, shrug: 0.25, ...FIERCE }, true), // (m) hands at chest
  k(65.60, 58, 8, { armL: [30, -146], armR: [-47, -7], handR: "open", lean: -10, bend: -5, ...FIERCE }), // (m)
  k(65.85, 54, 14, { armL: [49, 141], armR: [-35, -15], handR: "open", lean: -15, bend: -8, twist: -0.25, shrugL: 0.3, tilt: -6, lookY: -0.6, ...SHOUT }, true), // (m) fist rising
  k(66.05, 54, 18, { armL: [115, 84], armR: [-34, -49], lean: -18, bend: -10, shrugL: 0.45, tilt: -8, ...FIERCE }), // (m) flexed fist beside head
  k(66.19, 52, 20, { armL: [113, 98], armR: [-64, -12], handR: "open", lean: -21, bend: -11, shrugL: 0.6, tilt: -11, lookY: -1, wristL: 15, ...SHOUT }, true), // (m)
  k(66.45, 54, 16, { armL: [102, 95], armR: [-70, -5], handR: "open", lean: -16, bend: -9, shrugL: 0.4, ...FIERCE }), // (m)
  k(66.65, 56, 8, { armL: [18, -153], armR: [-32, -67], lean: -12, bend: -6, shrug: 0.2, tilt: -4, ...FIERCE }), // (m) hand back to chest
  k(66.90, 50, 0, { armL: [176, 28], armR: [-176, -28], handL: "open", handR: "open", lean: -4, shrug: 0.7, breath: 1, tilt: -16, lookY: -1, wristL: 25, wristR: -25, ...SHOUT }, true),
  k(67.10, 52, 0, { armL: [150, 50], armR: [-150, -50], lean: -2, shrug: 0.5, tilt: -10, lookY: -0.8, ...SHOUT }),
  k(67.30, 62, -6, { armL: [73, -18], armR: [-7, 75], handL: "open", lean: 2, bend: 3, twist: 0.3, tilt: 5, lookY: 0.4, ...FIERCE }, true), // (m) arm swung out, other across belly
  k(67.45, 58, -4, { armL: [84, 107], armR: [-43, 75], lean: -2, bend: -2, shrugL: 0.35, tilt: -4, ...FIERCE }), // (m) flex up
  k(67.70, 54, 0, { armL: [17, -117], armR: [-23, -170], lean: -5, bend: -3, tilt: -9, lookY: -0.7, ...SHOUT }, true), // (m)
  k(67.92, 58, 0, { armL: [21, -132], armR: [4, 101], handL: "open", handR: "open", lean: -1, tilt: 2, ...FIERCE }, true), // (m) clap at chest
  k(68.05, 58, 4, { armL: [24, -100], armR: [-9, 56], lean: 5, tilt: -2, ...FIERCE }), // (m, right arm only)
  k(68.30, 54, 0, { armL: [38, -10], armR: [-40, 20], handL: "open", handR: "open", shrug: 0.45, breath: 1, lean: -10, tilt: -10, ...LAUGH }, true), // (m, left arm)
  k(68.45, 58, 0, { armL: [14, 6], armR: [-46, -26], handL: "open", handR: "open", shrug: 0.05, lean: -4, tilt: -6, ...LAUGH }), // (m)
];

/** The hook step at film time t (s). Accents (hit) arrive with overshoot; everything else eases. */
export const hook = (t: number): FPose => {
  const K = HOOK_KEYS;
  if (t <= K[0].t) return K[0].p;
  if (t >= K[K.length - 1].t) return K[K.length - 1].p;
  let i = 0;
  while (t > K[i + 1].t) i++;
  const a = K[i], b = K[i + 1];
  const u = (t - a.t) / (b.t - a.t);
  const e = b.hit ? easeBack(u, 1.2) : easeInOut(u);
  const p = mix(a.p, b.p, e);
  // tiny head/shoulder accent on every beat for life between keys
  const pulse = Math.exp(-((t - nearestBeat(t)) ** 2) / 0.002);
  return { ...p, hipY: (p.hipY ?? 0) + 6 * pulse, tilt: (p.tilt ?? 0) + 2 * pulse };
};
const BEATS = [64.05, 64.769, 65.466, 66.186, 66.906, 67.625, 68.345];
const nearestBeat = (t: number) => BEATS.reduce((m, b) => (Math.abs(b - t) < Math.abs(m - t) ? b : m), BEATS[0]);
export const HOOK_START = 64.42, HOOK_END = 68.45;

// ---------- Hook-step tutorial reel: full speed, then slow with counts, then full speed again ----------
const SLOW = 0.5;
const FULL = HOOK_END - HOOK_START; // ~4.03 s
export const TUT = { full1: 0, slow: Math.round(FULL * 30) + 20, full2: Math.round(FULL * 30) + 20 + Math.round((FULL / SLOW) * 30) + 20 };
export const HOOK_TUT_LEN = TUT.full2 + Math.round(FULL * 30) + 60;

const COUNTS: [number, string][] = [[64.71, "1"], [65.40, "&"], [65.85, "2"], [66.19, "&"], [66.90, "3"], [67.30, "&"], [67.70, "4"], [67.92, "&"], [68.30, "5"]];
const CUES: [number, string][] = [[64.42, "flex up, punch"], [65.25, "hands to chest"], [65.75, "lean left, fist beside head"], [66.6, "chest, then both arms up"], [67.25, "swing out, flex"], [67.65, "hand to chest"], [67.9, "clap"], [68.2, "open, laugh"]];

export const HookTutorial: React.FC = () => {
  const f = useCurrentFrame();
  let t = HOOK_START, label = "", slow = false;
  if (f < TUT.slow - 20) { t = HOOK_START + f / 30; label = "HOOK STEP"; }
  else if (f < TUT.slow) { t = HOOK_END; label = "now slow"; }
  else if (f < TUT.full2 - 20) { t = HOOK_START + ((f - TUT.slow) / 30) * SLOW; label = "SLOW · 0.5×"; slow = true; }
  else if (f < TUT.full2) { t = HOOK_END; label = "your turn"; }
  else { t = Math.min(HOOK_END, HOOK_START + (f - TUT.full2) / 30); label = "FULL SPEED"; }
  const p = exaggerate(follow((x) => hook(x), t, slow ? 1 / 60 : 1 / 30), 1.45);
  const count = COUNTS.filter(([c]) => t >= c - 0.03).pop();
  const countAge = count ? t - count[0] : 9;
  const cue = CUES.filter(([c]) => t >= c).pop();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1b1240, #3a1740 60%, #6b2a2a)" }}>
      <Fonts />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1480, bottom: 0, background: "linear-gradient(#7a4a2a, #4a2a18)" }} />
      {[-215, 215].map((x) => <div key={x} style={{ position: "absolute", left: 540 + x * 1.25 - 40, top: 1640, width: 80, height: 14, borderRadius: 7, background: "#ffd166", opacity: 0.5 }} />)}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(540,1650) scale(1.25)"><Fumble f={f} p={p} braids /></g>
        {slow && <g transform="translate(150,520) scale(0.32)" opacity={0.9}><Fumble f={f} p={p} bonesOnly /></g>}
      </svg>
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 64, color: "#fff" }}>{label}</div>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 34, color: "#ffd166" }}>Yeshanagula hook step</div>
      {count && countAge < (slow ? 0.6 : 0.35) && (
        <div style={{ position: "absolute", top: 300, right: 90, fontFamily: "Inter", fontWeight: 900, fontSize: 170, color: count[1] === "&" ? "#5eead4" : "#ffd166", opacity: interpolate(countAge, [0, 0.05, slow ? 0.6 : 0.35], [0, 1, 0]), transform: `scale(${1.2 - 0.4 * Math.min(1, countAge / 0.2)})` }}>{count[1]}</div>
      )}
      {slow && cue && (
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 58, color: "#0f172a", background: "#ffd166", padding: "12px 34px", borderRadius: 30 }}>{cue[1]}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
