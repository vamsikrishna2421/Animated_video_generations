import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { SongSet } from "./SongSet";
import { exaggerate, follow, FPose, Fumble } from "./Fumble";
import { beatWarp } from "./motionPost";
import bj from "./mocap/bj.json";
import steps from "./mocap/mj_steps.json"; // copy of series/dance/mj_steps.json

// King-of-Pop moves reel (English page): Mr. Fumble in his own outfit, driven by whole-body capture of a rehearsal
// clip (reference only, private). The clip has no music, so every accent is beat-snapped onto a 117 BPM grid
// (Billie Jean's tempo; the song is added in Instagram). Stage, light-up floor and ending are ours.
type Data = { frames: number; tracks: { x: number[]; poses: FPose[] }[] };
const D = bj as unknown as Data;
const CAP0 = 0; // capture start (s, source time)
const T0 = 0.1, T1 = 40.2; // the dance we show
const END = 75; // our end card (frames)
export const MJ_REEL_LEN = Math.round((T1 - T0) * 30) + END;
const STEPS = (steps as unknown as { clips: { id: string; t: [number, number]; name: string; short: string }[] }).clips;
const BEATS = Array.from({ length: 84 }, (_, k) => 0.2 + (k * 60) / 117); // Billie Jean, 117 BPM
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
const WARP = beatWarp(D.tracks[0], CAP0, BEATS, 30, 0.22);
const at = (t: number): FPose => {
  const i = Math.max(0, Math.min(D.tracks[0].poses.length - 1, Math.round((WARP(t) - CAP0) * 30)));
  const p = proportions(D.tracks[0].poses[i]);
  const hit = Math.exp(-sinceBeat(t) * 8);
  // face hidden under the hat in the reference: a cool, keyed performance face that pops on the beat
  return {
    ...p, tilt: Math.max(-14, Math.min(14, (p.tilt ?? 0) * 0.5)), smile: 0.6, skew: 0.35, lid: 0.18, mo: 0.12 + 0.25 * hit,
    browL: 0.2 + 0.4 * hit, browR: 0.2 + 0.4 * hit, eyeSize: 1 + 0.1 * hit,
  };
};
const xAt = (t: number) => {
  const i = Math.max(0, Math.min(D.tracks[0].x.length - 1, Math.round((WARP(t) - CAP0) * 30)));
  return Math.max(-170, Math.min(170, D.tracks[0].x[i] * 0.45));
};
const HUES = ["#2563eb", "#db2777", "#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#4f46e5", "#be185d", "#0e7490"];
const hueAt = (t: number) => HUES[Math.floor(Math.max(0, beatIdx(t)) / 4) % HUES.length]; // lights change on every bar (4 beats)

const Studio: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const c = hueAt(t), k = Math.max(0, beatIdx(t)), hit = Math.exp(-sinceBeat(t) * 7);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at 50% 34%, ${c}88, #07060f 72%)` }} />
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 70, letterSpacing: 6, color: "#fff", textShadow: `0 0 18px ${c}, 0 0 46px ${c}`, opacity: 0.9 + 0.1 * Math.sin(f / 3) }}>AI MAASTAARU</div>
      <div style={{ position: "absolute", top: 486, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 800, fontSize: 30, letterSpacing: 14, color: c }}>LIVE ON STAGE</div>
      {/* light-up floor: tiles flash on the beat in a travelling pattern */}
      <div style={{ position: "absolute", left: -260, right: -260, top: 1250, height: 900, transform: "perspective(900px) rotateX(60deg)", transformOrigin: "50% 0%", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10 }}>
        {Array.from({ length: 48 }, (_, i) => {
          const on = (i * 7 + k * 3) % 5 === 0 || (i % 8 === k % 8);
          return <div key={i} style={{ background: on ? c : "#1a1730", opacity: on ? 0.55 + 0.45 * hit : 1, boxShadow: on ? `0 0 30px ${c}` : "none" }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, height: 220, background: "linear-gradient(rgba(7,6,15,0.85), transparent)" }} />
    </AbsoluteFill>
  );
};

/** Camera: wide and medium framings swap every two bars on the beat; a close-up on the phone hand during the torch step
 * pays off "every finger"; a small push on every beat. */
const cam = (t: number, x: number) => {
  const k = Math.max(0, beatIdx(t)), bar = Math.floor(k / 8);
  let z = bar % 2 ? 1.12 : 0.96, cx = 540 + x * (bar % 2 ? 0.8 : 0), cy = bar % 2 ? 1120 : 1040; // whole body incl. raised head always in frame
  z *= 1 + 0.018 * Math.exp(-sinceBeat(t) * 9);
  return `translate(540,960) scale(${z}) translate(${-cx},${-cy})`;
};
export const MJReel: React.FC<{ handle?: string }> = ({ handle = "@ai_maastaaru" }) => {
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
      <SongSet layer="back" t={t} beats={BEATS} hits={HITS} flavor="pop" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={cam(t, xAt(t))}>
        <ellipse cx={540 + xAt(t)} cy={1790} rx={190} ry={26} fill="rgba(0,0,0,0.45)" />
        <g transform={`translate(${540 + xAt(t)},1790) scale(1.0)`} opacity={ended ? Math.max(0, 1 - endAge * 4) : 1}><Fumble f={f} p={p} /></g>
        </g>
      </svg>
      <SongSet layer="front" t={t} beats={BEATS} hits={HITS} flavor="pop" />
      {/* proof panel: the tracked skeleton, first 3.5 s */}
      {!ended && (
        <div style={{ position: "absolute", right: 22, top: 1500, width: 230, height: 380, borderRadius: 22, background: "rgba(11,16,34,0.86)", border: "3px solid #22d3ee", opacity: Math.min(1, f / 5) }}>
          <svg width={230} height={380}><g transform="translate(115,360) scale(0.33)"><Fumble f={f} p={p} bonesOnly /></g></svg>
          <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 30, color: "#22d3ee" }}>AI TRACKING</div>
        </div>
      )}
      {f < 90 && (
        <div style={{ position: "absolute", top: 120, left: 40, right: 40, textAlign: "center", opacity: Math.min(1, f / 4, (90 - f) / 10) }}>
          <div style={{ display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 64, lineHeight: 1.1, color: "#fff", background: "rgba(11,10,24,0.82)", padding: "16px 28px", borderRadius: 26 }}>AI copied the <span style={{ color: "#fbbf24" }}>King of Pop's</span><br />moves, step by step 🕺</div>
        </div>
      )}
      {step && !ended && f >= 90 && (
        <div style={{ position: "absolute", left: 32, top: 150, opacity: Math.min(1, Math.max(0.15, stepAge) / 0.15), transform: `translateX(${Math.max(0, 1 - stepAge / 0.2) * -40}px)` }}>
          <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 34, color: "#0b0a18", background: "#fbbf24", padding: "6px 16px", borderRadius: 12, display: "inline-block" }}>STEP {step.id.slice(1)}/14</div>
          <div style={{ marginTop: 10, fontFamily: "Inter", fontWeight: 900, fontSize: 60, lineHeight: 1.0, color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.7)", maxWidth: 520 }}>{step.short}</div>
        </div>
      )}
      <div style={{ position: "absolute", right: 28, top: 52, fontFamily: "Inter", fontWeight: 800, fontSize: 36, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "8px 18px", borderRadius: 14 }}>● AI motion capture</div>
      {ended && (
        <AbsoluteFill style={{ background: `rgba(11,10,24,${Math.min(0.96, endAge * 4)})`, alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: Math.min(1, endAge * 4), transform: `scale(${0.9 + 0.1 * Math.min(1, endAge * 4)})` }}>
            <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.15 }}>14 moves · moonwalk to toe stand</div>
            <div style={{ marginTop: 16, fontFamily: "Inter", fontWeight: 800, fontSize: 48, color: "#cbd5e1" }}>tracked by AI, frame by frame</div>
            <div style={{ marginTop: 40, display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 48, color: "#fff", background: "#0095f6", padding: "16px 40px", borderRadius: 22 }}>Follow {handle}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
