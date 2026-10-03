import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { easeBack, easeInOut, FPose, Fumble, legIK, mix } from "./Fumble";

// Yeshanagula hook step (film 64.4 - 68.5 s), keyed at 24 fps resolution from the footage, every key placed on
// the measured beat grid (64.769, 65.466, 66.186, 66.906, 67.625, 68.345). Feet stay planted in a wide stance;
// weight shifts move the pelvis between them. Accents land with a slight overshoot (easeBack), recoveries ease.
// Times are film seconds so the move drops straight into the song.

/** Wide horse stance with both feet locked at +-110 on the floor; the pelvis moves between them. */
export const stance = (drop: number, hipX = 0, spread = 165): Partial<FPose> => ({
  still: true, hipX, hipY: drop,
  legL: legIK(-spread - (hipX - 34), 395 - drop, -1), legR: legIK(spread - (hipX + 34), 395 - drop, 1),
  toeL: 6, toeR: 6,
});

const SHOUT: Partial<FPose> = { smile: 0.5, mo: 0.7, mw: 0.55, browL: 0.7, browR: 0.7, eyeSize: 1.1 };
const FIERCE: Partial<FPose> = { smile: 0.35, mo: 0.25, knit: 0.4, browL: -0.2, browR: -0.2, lid: 0.15 };
const LAUGH: Partial<FPose> = { smile: 1, mo: 0.6, shut: 0.75, browL: 0.4, browR: 0.4 };

type Key = { t: number; p: FPose; hit?: boolean };
const k = (t: number, drop: number, hipX: number, p: Partial<FPose>, hit = false): Key => ({ t, hit, p: { ...stance(drop + 22, hipX * 2), handL: "fist", handR: "fist", ...p } });

export const HOOK_KEYS: Key[] = [
  k(64.42, 50, -18, { armR: [-140, -60], armL: [42, 30], lean: -11, bend: -7, twist: -0.25, tilt: -8, lookY: -0.7, ...FIERCE }),
  k(64.71, 52, -22, { armR: [-174, -14], armL: [34, 22], lean: -14, bend: -10, twist: -0.35, shrugR: 0.55, tilt: -14, lookY: -1, wristR: -20, ...SHOUT }, true),
  k(64.96, 56, -12, { armR: [-62, -112], armL: [48, 96], lean: -5, bend: -3, tilt: -2, ...FIERCE }),
  k(65.10, 64, -4, { armL: [40, -116], armR: [-40, 116], lean: 0, bend: 0, tilt: 4, lookY: 0.4, shrug: 0.25, ...FIERCE }, true),
  k(65.40, 58, 6, { armL: [46, 8], armR: [-46, -8], handL: "open", handR: "open", lean: 4, tilt: -3, breath: 1, ...FIERCE }),
  k(65.60, 56, 14, { armL: [74, 92], armR: [-36, -12], lean: 8, bend: 6, twist: 0.2, ...FIERCE }),
  k(65.85, 54, 20, { armL: [166, 24], armR: [-40, -16], lean: 11, bend: 8, twist: 0.3, shrugL: 0.5, tilt: -9, lookY: -0.8, wristL: 18, ...SHOUT }, true),
  k(66.05, 56, 20, { armL: [148, 54], armR: [-62, -10], lean: 10, bend: 7, shrugL: 0.3, tilt: -6, ...FIERCE }),
  k(66.19, 54, 22, { armL: [172, 14], armR: [-74, -8], lean: 12, bend: 8, shrugL: 0.6, tilt: -11, lookY: -1, wristL: 22, ...SHOUT }, true),
  k(66.45, 56, 18, { armL: [150, 50], armR: [-82, -4], lean: 9, bend: 6, shrugL: 0.3, ...FIERCE }),
  k(66.65, 54, 6, { armL: [158, 62], armR: [-150, -62], lean: 2, bend: 0, shrug: 0.4, tilt: -8, ...FIERCE }),
  k(66.90, 50, 0, { armL: [176, 28], armR: [-176, -28], handL: "open", handR: "open", lean: -4, shrug: 0.7, breath: 1, tilt: -16, lookY: -1, wristL: 25, wristR: -25, ...SHOUT }, true),
  k(67.10, 52, 0, { armL: [170, 34], armR: [-170, -34], handL: "open", handR: "open", lean: -3, shrug: 0.6, tilt: -12, lookY: -1, ...SHOUT }),
  k(67.30, 66, -14, { armL: [-32, -62], armR: [-42, -30], lean: 10, bend: 9, twist: 0.5, tilt: 7, lookY: 0.6, ...FIERCE }, true),
  k(67.45, 64, -10, { armL: [-22, -82], armR: [-32, -22], lean: 7, bend: 6, twist: 0.4, tilt: 4, ...FIERCE }),
  k(67.70, 54, 12, { armL: [170, 22], armR: [-40, -22], lean: 7, bend: 5, twist: 0.25, shrugL: 0.55, tilt: -11, lookY: -0.9, wristL: 20, ...SHOUT }, true),
  k(67.92, 60, 4, { armL: [38, -120], armR: [-38, 120], handL: "open", handR: "open", lean: 0, bend: 0, tilt: 2, ...FIERCE }, true),
  k(68.05, 58, 0, { armL: [22, -62], armR: [-22, 62], lean: 0, tilt: -2, ...FIERCE }),
  k(68.30, 54, 0, { armL: [36, -110], armR: [-36, 110], shrug: 0.45, breath: 1, tilt: -10, ...LAUGH }, true),
  k(68.45, 58, 0, { armL: [36, -110], armR: [-36, 110], shrug: 0.05, tilt: -6, ...LAUGH }),
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

const COUNTS: [number, string][] = [[64.71, "1"], [65.10, "&"], [65.85, "2"], [66.19, "&"], [66.90, "3"], [67.30, "&"], [67.70, "4"], [67.92, "&"], [68.30, "5"]];
const CUES: [number, string][] = [[64.42, "lunge, fist up"], [65.0, "hands to chest"], [65.75, "other fist up, pump"], [66.6, "both arms up"], [67.25, "whip down"], [67.65, "up again"], [67.9, "clap"], [68.2, "fists, bounce"]];

export const HookTutorial: React.FC = () => {
  const f = useCurrentFrame();
  let t = HOOK_START, label = "", slow = false;
  if (f < TUT.slow - 20) { t = HOOK_START + f / 30; label = "HOOK STEP"; }
  else if (f < TUT.slow) { t = HOOK_END; label = "now slow"; }
  else if (f < TUT.full2 - 20) { t = HOOK_START + ((f - TUT.slow) / 30) * SLOW; label = "SLOW · 0.5×"; slow = true; }
  else if (f < TUT.full2) { t = HOOK_END; label = "your turn"; }
  else { t = Math.min(HOOK_END, HOOK_START + (f - TUT.full2) / 30); label = "FULL SPEED"; }
  const p = hook(t);
  const count = COUNTS.filter(([c]) => t >= c - 0.03).pop();
  const countAge = count ? t - count[0] : 9;
  const cue = CUES.filter(([c]) => t >= c).pop();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1b1240, #3a1740 60%, #6b2a2a)" }}>
      <Fonts />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1480, bottom: 0, background: "linear-gradient(#7a4a2a, #4a2a18)" }} />
      {[-165, 165].map((x) => <div key={x} style={{ position: "absolute", left: 540 + x * 1.25 - 40, top: 1640, width: 80, height: 14, borderRadius: 7, background: "#ffd166", opacity: 0.5 }} />)}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(540,1650) scale(1.25)"><Fumble f={f} p={p} /></g>
        {slow && <g transform="translate(150,520) scale(0.32)" opacity={0.9}><Fumble f={f} p={p} bonesOnly /></g>}
      </svg>
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 64, color: "#fff" }}>{label}</div>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 34, color: "#ffd166" }}>Yeshanagula · Mr. Fumble</div>
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
