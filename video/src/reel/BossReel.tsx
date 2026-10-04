import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { SongSet } from "./SongSet";
import { exaggerate, follow, FPose, Fumble } from "./Fumble";
import boss from "./mocap/boss.json";
import face from "./mocap/boss_face.json";
import steps from "./mocap/boss_steps.json"; // copy of series/dance/boss_steps.json

// "Boss hook step" reel: Mr. Fumble in the boss outfit, driven frame by frame by the whole-body capture (body,
// feet, wrists, every finger, the phone, the face). Studio, lights and ending are ours; the reference stays private.
type Data = { frames: number; tracks: { x: number[]; poses: FPose[] }[] };
const D = boss as unknown as Data;
const FACE = (face as unknown as { face: Partial<FPose>[] }).face;
const CAP0 = 4.6; // capture start (s, source time)
const T0 = 4.8, T1 = 30.5; // the dance we show
const END = 75; // our end card (frames)
export const BOSS_REEL_LEN = Math.round((T1 - T0) * 30) + END;
const STEPS = (steps as unknown as { clips: { id: string; t: [number, number]; name: string; short: string }[] }).clips;
const BEATS = [0.14, 0.7, 1.25, 1.8, 2.36, 2.91, 3.47, 3.99, 4.57, 5.13, 5.69, 6.25, 6.8, 7.36, 7.92, 8.46, 9.02, 9.58, 10.14, 10.69, 11.25, 11.81, 12.36, 12.92, 13.47, 14.02, 14.58, 15.14, 15.7, 16.25, 16.8, 17.36, 17.91, 18.47, 19.03, 19.59, 20.14, 20.69, 21.25, 21.82, 22.36, 22.92, 23.48, 24.18, 24.86, 25.43, 25.98, 26.53, 27.09, 27.65, 28.2, 28.76, 29.3, 29.87, 30.42, 30.99];
const HITS = STEPS.map((c) => c.t[0]).filter((x) => x > T0 + 0.5);
const beatIdx = (t: number) => BEATS.filter((b) => t >= b).length - 1;
const sinceBeat = (t: number) => { const k = beatIdx(t); return k >= 0 ? t - BEATS[k] : 9; };

// the dancer is long-limbed and Mr. Fumble is not: stretch the limbs for this dance and keep foreshortening readable,
// then re-solve the pelvis height so the lower foot still lands on the floor
const KL = 1.2, KA = 1.12;
const R = (d: number) => (d * Math.PI) / 180;
const drop = (a?: [number, number], s: [number, number] = [1, 1]) => (a ? 200 * s[0] * Math.cos(R(a[0])) + 195 * s[1] * Math.cos(R(a[0] + a[1])) : 395);
const legShape = (a: [number, number] | undefined, crouch: number): [number, number] | undefined => {
  if (!a) return a;
  if (crouch > 140) { // deep squat: baggy trousers fool the tracker into tucking the feet in; shins stay near vertical
    const shin = (a[0] + a[1]) * 0.45;
    return [a[0], shin - a[0]];
  }
  return [a[0] * 1.3, a[1]]; // standing: a wider, clearer stance
};
const proportions = (p0: FPose): FPose => {
  const p = { ...p0, legL: legShape(p0.legL, p0.hipY ?? 0), legR: legShape(p0.legR, p0.hipY ?? 0) };
  const ls = (v?: [number, number], k = KL, lo = 0.8): [number, number] => [Math.max(lo, v?.[0] ?? 1) * k, Math.max(lo, v?.[1] ?? 1) * k];
  const legLs = ls(p.legLs), legRs = ls(p.legRs);
  const before = Math.max(drop(p0.legL, p0.legLs ?? [1, 1]), drop(p0.legR, p0.legRs ?? [1, 1]));
  const after = Math.max(drop(p.legL, legLs), drop(p.legR, legRs));
  return { ...p, legLs, legRs, armLs: ls(p.armLs, KA, 0.75), armRs: ls(p.armRs, KA, 0.75), hipY: (p.hipY ?? 0) - (after - before) };
};
const at = (t: number): FPose => {
  const i = Math.max(0, Math.min(D.tracks[0].poses.length - 1, Math.round((t - CAP0) * 30)));
  const p = proportions(D.tracks[0].poses[i]);
  const fc = FACE[i] ?? {};
  return {
    ...p, ...fc, tilt: Math.max(-14, Math.min(14, (p.tilt ?? 0) * 0.5 + ((fc.tilt as number) ?? 0) * 0.3)), turn: p.turn, // big head + bend read as a broken neck: keep it small
    browL: ((fc.browL as number) ?? 0) * 1.4 + 0.35 * Math.exp(-sinceBeat(t) * 8), browR: ((fc.browR as number) ?? 0) * 1.4 + 0.35 * Math.exp(-sinceBeat(t) * 8),
    smile: Math.max(0.15, (fc.smile as number) ?? 0.4), mo: Math.min(0.9, ((fc.mo as number) ?? 0) * 1.2),
    // the face is tiny in a full-body shot, so blink/squint read high: cap them (no sleepy look), keep real blinks short
    lid: Math.min(0.25, (fc.lid as number) ?? 0), squint: Math.min(0.25, (fc.squint as number) ?? 0),
  };
};
const xAt = (t: number) => {
  const i = Math.max(0, Math.min(D.tracks[0].x.length - 1, Math.round((t - CAP0) * 30)));
  return Math.max(-170, Math.min(170, D.tracks[0].x[i] * 0.45));
};
const HUES = ["#2563eb", "#db2777", "#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#4f46e5", "#be185d", "#0e7490"];
const hueAt = (t: number) => HUES[Math.floor(Math.max(0, beatIdx(t)) / 4) % HUES.length]; // lights change on every bar (4 beats)

const Studio: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const c = hueAt(t), flash = beatIdx(t) % 4 === 0 ? Math.max(0, 1 - sinceBeat(t) / 0.12) * 0.5 : 0; // light hit on each bar
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 30%, ${c}cc, #0b0a18 75%)` }} />
      {/* neon sign: ours */}
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 70, letterSpacing: 6, color: "#fff", textShadow: `0 0 18px ${c}, 0 0 46px ${c}, 0 0 80px ${c}`, opacity: 0.92 + 0.08 * Math.sin(f / 3) }}>AI MAASTAARU</div>
      <div style={{ position: "absolute", top: 486, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 30, letterSpacing: 14, color: c, textShadow: `0 0 12px ${c}` }}>DANCE STUDIO</div>
      {/* wooden floor in perspective */}
      <div style={{ position: "absolute", left: -200, right: -200, top: 1240, bottom: 0, background: "repeating-linear-gradient(90deg, #7a4a2b 0 90px, #8e5a35 90px 180px, #6d3f23 180px 270px)", transform: "perspective(900px) rotateX(58deg)", transformOrigin: "50% 0%" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, height: 260, background: "linear-gradient(rgba(11,10,24,0.7), transparent)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.55 }} />
    </AbsoluteFill>
  );
};

/** Camera: wide and medium framings swap every two bars on the beat; a close-up on the phone hand during the torch step
 * pays off "every finger"; a small push on every beat. */
const cam = (t: number, x: number) => {
  const k = Math.max(0, beatIdx(t)), bar = Math.floor(k / 8);
  let z = bar % 2 ? 1.22 : 1.0, cx = 540 + x * (bar % 2 ? 1 : 0), cy = bar % 2 ? 1180 : 1000;
  if (t >= 14.02 && t < 15.7) { z = 1.75; cx = 470 + x; cy = 1010; } // phone + fingers close-up (C5, counts 2-4)
  z *= 1 + 0.018 * Math.exp(-sinceBeat(t) * 9);
  return `translate(540,960) scale(${z}) translate(${-cx},${-cy})`;
};
export const BossReel: React.FC<{ handle?: string }> = ({ handle = "@ai_maastaaru_telugu" }) => {
  const f = useCurrentFrame();
  const t = Math.min(T1, T0 + f / 30);
  const ended = f >= Math.round((T1 - T0) * 30);
  const p = exaggerate(follow(at, t, 1 / 30, true), 1.2);
  const step = [...STEPS].reverse().find((s) => t >= s.t[0] - 0.15);
  const stepAge = step ? t - step.t[0] : 9;
  const endAge = (f - Math.round((T1 - T0) * 30)) / 30;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0b0a18" }}>
      <Fonts />
      <Studio t={t} f={f} />
      <SongSet layer="back" t={t} beats={BEATS} hits={HITS} flavor="telugu" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={cam(t, xAt(t))}>
        <ellipse cx={540 + xAt(t)} cy={1790} rx={190} ry={26} fill="rgba(0,0,0,0.45)" />
        <g transform={`translate(${540 + xAt(t)},1790) scale(1.0)`} opacity={ended ? Math.max(0, 1 - endAge * 4) : 1}><Fumble f={f} p={p} look="boss" /></g>
        </g>
      </svg>
      <SongSet layer="front" t={t} beats={BEATS} hits={HITS} flavor="telugu" />
      {/* proof panel: the tracked skeleton, first 3.5 s */}
      {!ended && (
        <div style={{ position: "absolute", left: 22, top: 640, width: 230, height: 380, borderRadius: 22, background: "rgba(11,16,34,0.86)", border: "3px solid #22d3ee", opacity: Math.min(1, f / 5) }}>
          <svg width={230} height={380}><g transform="translate(115,360) scale(0.33)"><Fumble f={f} p={p} bonesOnly /></g></svg>
          <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 30, color: "#22d3ee" }}>AI TRACKING</div>
        </div>
      )}
      {f < 90 && (
        <div style={{ position: "absolute", top: 120, left: 40, right: 40, textAlign: "center", opacity: Math.min(1, f / 4, (90 - f) / 10) }}>
          <div style={{ display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 64, lineHeight: 1.1, color: "#fff", background: "rgba(11,10,24,0.82)", padding: "16px 28px", borderRadius: 26 }}>AI copied the <span style={{ color: "#fbbf24" }}>Boss hook step</span><br />down to every finger 👀</div>
        </div>
      )}
      {step && !ended && f >= 90 && (
        <div style={{ position: "absolute", left: 32, top: 150, opacity: Math.min(1, Math.max(0.15, stepAge) / 0.15), transform: `translateX(${Math.max(0, 1 - stepAge / 0.2) * -40}px)` }}>
          <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 34, color: "#0b0a18", background: "#fbbf24", padding: "6px 16px", borderRadius: 12, display: "inline-block" }}>STEP {step.id.slice(1)}/11</div>
          <div style={{ marginTop: 10, fontFamily: "Inter", fontWeight: 900, fontSize: 60, lineHeight: 1.0, color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.7)", maxWidth: 520 }}>{step.short}</div>
        </div>
      )}
      <div style={{ position: "absolute", right: 28, top: 52, fontFamily: "Inter", fontWeight: 800, fontSize: 36, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "8px 18px", borderRadius: 14 }}>● AI motion capture</div>
      {ended && (
        <AbsoluteFill style={{ background: `rgba(11,10,24,${Math.min(0.96, endAge * 4)})`, alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: Math.min(1, endAge * 4), transform: `scale(${0.9 + 0.1 * Math.min(1, endAge * 4)})` }}>
            <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.15 }}>Body · feet · wrists<br />every finger · the phone</div>
            <div style={{ marginTop: 16, fontFamily: "Inter", fontWeight: 800, fontSize: 48, color: "#cbd5e1" }}>tracked by AI, frame by frame</div>
            <div style={{ marginTop: 40, display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 48, color: "#fff", background: "#0095f6", padding: "16px 40px", borderRadius: 22 }}>Follow {handle}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
