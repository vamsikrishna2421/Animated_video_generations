import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Fonts } from "../components/Fonts";
import { beatWarp } from "./motionPost";
import { FPose } from "./Fumble";
import bj from "./mocap/bj.json";
import bj3d from "./mocap/bj_3d.json";
import steps from "./mocap/mj_steps.json";

// "Robot troupe": an original humanoid robot design (white armour, graphite joints, cyan LED visor and joint rings),
// five units dancing in perfect unison, driven by the 3D world skeleton of the whole-body capture. Because the data
// is 3D, depth, twists and turns are real, and the camera orbits the troupe. Robots dance "popping" style: every
// beat the pose snaps into place (hard ease-out) and ticks, like servo motion. Render with --gl=swangle.

type D3 = { frames: number; joints: number[][]; tx: number[]; tz: number[]; fing?: number[][][] };
const D = bj3d as unknown as D3;
const TRK = (bj as unknown as { tracks: { poses: FPose[] }[] }).tracks[0];
const STEPS = (steps as unknown as { clips: { id: string; t: [number, number]; short: string }[] }).clips;
const T0 = 0.1, T1 = 40.2, END = 75;
export const ROBOT_LEN = Math.round((T1 - T0) * 30) + END;
const BEATS = Array.from({ length: 84 }, (_, k) => 0.2 + (k * 60) / 117); // 117 BPM grid (Billie Jean tempo)
const beatIdx = (t: number) => BEATS.filter((b) => t >= b).length - 1;
const sinceBeat = (t: number) => { const k = beatIdx(t); return k >= 0 ? t - BEATS[k] : 9; };
const WARP = beatWarp(TRK, 0, BEATS, 30, 0.22);
/** Popping time: inside each beat the capture is replayed with a hard ease-out, so moves snap and then hold. */
const popTime = (t: number) => {
  const k = beatIdx(t);
  if (k < 0 || k >= BEATS.length - 1) return WARP(t);
  const a = BEATS[k], b = BEATS[k + 1], u = (t - a) / (b - a);
  const e = 1 - Math.pow(1 - Math.min(1, u * 1.35), 3);
  return WARP(a) + (WARP(b) - WARP(a)) * e;
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Joints at capture time s (seconds), linearly interpolated between frames, with stage travel. */
const jointsAt = (s: number): THREE.Vector3[] => {
  const x = Math.max(0, Math.min(D.frames - 1.001, s * 30)), i = Math.floor(x), u = x - i;
  const A = D.joints[i], B = D.joints[i + 1] ?? A;
  const tx = (D.tx[i] * (1 - u) + (D.tx[i + 1] ?? D.tx[i]) * u) * 0.25; // keep the formation together
  const out: THREE.Vector3[] = [];
  for (let j = 0; j < 33; j++) out.push(V(A[j * 3] * (1 - u) + B[j * 3] * u + tx, A[j * 3 + 1] * (1 - u) + B[j * 3 + 1] * u, A[j * 3 + 2] * (1 - u) + B[j * 3 + 2] * u));
  return out;
};
const fingAt = (s: number) => D.fing?.[Math.max(0, Math.min(D.frames - 1, Math.round(s * 30)))] ?? [[0.3, 0.3, 0.3, 0.3, 0.3], [0.3, 0.3, 0.3, 0.3, 0.3]];

// ---------- robot parts ----------
const MAT = {
  armour: { color: "#eef1f5", metalness: 0.35, roughness: 0.28 },
  gold: { color: "#e2b04a", metalness: 1, roughness: 0.22 },
  joint: { color: "#2a2e36", metalness: 0.9, roughness: 0.35 },
};
const UP = V(0, 1, 0);
/** A limb segment from a to b: armoured capsule + graphite ball joint with a glowing ring at a. */
const Seg: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; lead: boolean; glow: string; ring?: boolean }> = ({ a, b, r, lead, glow, ring = true }) => {
  const d = b.clone().sub(a), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  const m = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group>
      <mesh position={m} quaternion={q}>
        <capsuleGeometry args={[r, Math.max(0.01, L - 2 * r * 0.9), 6, 14]} />
        <meshStandardMaterial {...(lead ? MAT.gold : MAT.armour)} />
      </mesh>
      <mesh position={a}><sphereGeometry args={[r * 1.18, 16, 12]} /><meshStandardMaterial {...MAT.joint} /></mesh>
      {ring && <mesh position={a} quaternion={q}><torusGeometry args={[r * 1.2, r * 0.18, 8, 24]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2.2} /></mesh>}
    </group>
  );
};
/** A box placed by an orthonormal frame (right, up) at a centre. */
const Block: React.FC<{ c: THREE.Vector3; right: THREE.Vector3; up: THREE.Vector3; size: [number, number, number]; mat: object; children?: React.ReactNode }> = ({ c, right, up, size, mat, children }) => {
  const x = right.clone().normalize(), z = new THREE.Vector3().crossVectors(x, up).normalize(), y = new THREE.Vector3().crossVectors(z, x);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return (
    <group position={c} quaternion={q}>
      <mesh><boxGeometry args={size} /><meshStandardMaterial {...mat} /></mesh>
      {children}
    </group>
  );
};

const Robot: React.FC<{ J: THREE.Vector3[]; fing: number[][]; lead?: boolean; glow: string; pulse: number }> = ({ J, fing, lead = false, glow, pulse }) => {
  const hipC = J[23].clone().add(J[24]).multiplyScalar(0.5), shC = J[11].clone().add(J[12]).multiplyScalar(0.5);
  const spine = shC.clone().sub(hipC);
  const headC = J[7].clone().add(J[8]).multiplyScalar(0.5).add(spine.clone().normalize().multiplyScalar(0.03));
  const em = { color: glow, emissive: glow, emissiveIntensity: 1.6 + 1.6 * pulse };
  const hand = (w: number, idx: number, pk: number, f: number[]) => {
    const dir = J[idx].clone().add(J[pk]).multiplyScalar(0.5).sub(J[w]);
    const across = J[idx].clone().sub(J[pk]);
    const c = J[w].clone().add(dir.clone().multiplyScalar(0.55));
    const curl = (f[0] + f[1] + f[2] + f[3]) / 4;
    return (
      <Block c={c} right={across} up={dir} size={[0.085, 0.09, 0.035]} mat={MAT.joint}>
        {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
          <mesh key={i} position={[x, 0.045 + 0.04 * (1 - curl), 0.012 * curl]} rotation={[-1.2 * (f[i] ?? curl), 0, 0]}>
            <boxGeometry args={[0.016, 0.07 * (1 - 0.45 * (f[i] ?? curl)), 0.018]} /><meshStandardMaterial {...MAT.armour} />
          </mesh>
        ))}
      </Block>
    );
  };
  const foot = (heel: number, toe: number) => {
    const d = J[toe].clone().sub(J[heel]);
    const c = J[heel].clone().add(d.clone().multiplyScalar(0.5));
    return <Block c={c} right={d} up={UP} size={[Math.max(0.16, d.length() * 1.15), 0.07, 0.1]} mat={lead ? MAT.gold : MAT.armour}><mesh position={[0, -0.04, 0]}><boxGeometry args={[Math.max(0.16, d.length() * 1.15), 0.015, 0.1]} /><meshStandardMaterial {...em} /></mesh></Block>;
  };
  return (
    <group>
      {/* torso: pelvis block, chest plate with a glowing core, abdomen spine */}
      <Block c={hipC.clone().add(spine.clone().multiplyScalar(0.05))} right={J[23].clone().sub(J[24])} up={spine} size={[0.3, 0.14, 0.2]} mat={MAT.joint} />
      <Seg a={hipC.clone().add(spine.clone().multiplyScalar(0.12))} b={hipC.clone().add(spine.clone().multiplyScalar(0.5))} r={0.07} lead={false} glow={glow} ring={false} />
      <Block c={hipC.clone().add(spine.clone().multiplyScalar(0.72))} right={J[11].clone().sub(J[12])} up={spine} size={[0.32, 0.26, 0.17]} mat={lead ? MAT.gold : MAT.armour}>
        <mesh position={[0, 0.02, 0.087]}><circleGeometry args={[0.045, 24]} /><meshStandardMaterial {...em} /></mesh>
        <mesh position={[0, -0.085, 0.087]}><planeGeometry args={[0.2, 0.012]} /><meshStandardMaterial {...em} /></mesh>
      </Block>
      {/* neck + head with a wrap-around LED visor */}
      <Seg a={shC.clone().add(spine.clone().multiplyScalar(0.02))} b={headC.clone().sub(spine.clone().normalize().multiplyScalar(0.09))} r={0.035} lead={false} glow={glow} ring={false} />
      <Block c={headC} right={new THREE.Vector3().crossVectors(spine, J[0].clone().sub(J[7].clone().add(J[8]).multiplyScalar(0.5)).setY(0).normalize())} up={spine} size={[0.2, 0.22, 0.2]} mat={lead ? MAT.gold : MAT.armour}>
        <mesh position={[0, 0.02, 0.101]}><planeGeometry args={[0.17, 0.055]} /><meshStandardMaterial {...em} /></mesh>
        <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.008, 0.008, 0.07, 6]} /><meshStandardMaterial {...MAT.joint} /></mesh>
        <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.02, 10, 8]} /><meshStandardMaterial {...em} /></mesh>
      </Block>
      {/* shoulder pads, arms, hands */}
      {[11, 12].map((s) => <mesh key={s} position={J[s]}><sphereGeometry args={[0.075, 16, 12]} /><meshStandardMaterial {...(lead ? MAT.gold : MAT.armour)} /></mesh>)}
      <Seg a={J[11]} b={J[13]} r={0.045} lead={lead} glow={glow} />
      <Seg a={J[13]} b={J[15]} r={0.04} lead={lead} glow={glow} />
      <Seg a={J[12]} b={J[14]} r={0.045} lead={lead} glow={glow} />
      <Seg a={J[14]} b={J[16]} r={0.04} lead={lead} glow={glow} />
      {hand(15, 19, 17, fing[1])}
      {hand(16, 20, 18, fing[0])}
      {/* legs + feet */}
      <Seg a={J[23]} b={J[25]} r={0.065} lead={lead} glow={glow} />
      <Seg a={J[25]} b={J[27]} r={0.055} lead={lead} glow={glow} />
      <Seg a={J[24]} b={J[26]} r={0.065} lead={lead} glow={glow} />
      <Seg a={J[26]} b={J[28]} r={0.055} lead={lead} glow={glow} />
      {foot(29, 31)}
      {foot(30, 32)}
    </group>
  );
};

// ---------- stage ----------
const PAL = ["#22d3ee", "#f43f5e", "#a855f7", "#facc15", "#34d399", "#fb923c"];
const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
  }, [gl, scene]);
  return null;
};
const Stage: React.FC<{ t: number; pulse: number; col: string; k: number }> = ({ t, pulse, col, k }) => (
  <group>
    {/* glossy black floor + light-up tiles */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#07070c" metalness={0.85} roughness={0.22} /></mesh>
    {Array.from({ length: 81 }, (_, i) => {
      const x = (i % 9) - 4, z = Math.floor(i / 9) - 4;
      const on = (Math.abs(x) + Math.abs(z) + k) % 4 === 0;
      return on ? <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x * 1.1, 0.002, z * 1.1 - 1]}><planeGeometry args={[1.0, 1.0]} /><meshStandardMaterial color="#000" emissive={col} emissiveIntensity={0.2 + 0.6 * pulse} transparent opacity={0.6} /></mesh> : null;
    })}
    {/* LED wall: vertical bars that bounce like an equaliser */}
    {Array.from({ length: 24 }, (_, i) => {
      const h = 0.8 + 3.2 * Math.abs(Math.sin(i * 1.7 + t * 3.1)) * (0.5 + 0.5 * pulse);
      return <mesh key={i} position={[(i - 11.5) * 0.52, h / 2, -6]}><boxGeometry args={[0.36, h, 0.05]} /><meshStandardMaterial color="#000" emissive={PAL[(i + k) % PAL.length]} emissiveIntensity={0.75} /></mesh>;
    })}
    {/* lasers from the back corners, sweeping on the beat */}
    {[-1, 1].map((s) => Array.from({ length: 5 }, (_, i) => {
      const a = s * (0.25 + i * 0.16) + 0.25 * Math.sin(t * 2 + i);
      const len = 14, o = V(s * 6, 5.5, -5.5), d = V(-s * Math.cos(a) * 0.6 + Math.sin(a), -0.55, 1).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d);
      return <mesh key={`${s}${i}`} position={o.clone().add(d.clone().multiplyScalar(len / 2))} quaternion={q}><cylinderGeometry args={[0.012, 0.012, len, 6]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={3 * (0.4 + 0.6 * pulse)} transparent opacity={0.8} /></mesh>;
    }))}
  </group>
);

// troupe: lead in front (gold), four behind in a V, all in perfect unison
const TROUPE: { x: number; z: number; lead?: boolean }[] = [{ x: 0, z: 0.6, lead: true }, { x: -1.1, z: -0.5 }, { x: 1.1, z: -0.5 }, { x: -2.2, z: -1.6 }, { x: 2.2, z: -1.6 }];

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const { camera } = useThree();
  const s = popTime(t), J0 = jointsAt(s), fing = fingAt(s);
  const k = Math.max(0, beatIdx(t)), pulse = Math.exp(-sinceBeat(t) * 7), bar = Math.floor(k / 4);
  const col = PAL[bar % PAL.length];
  // camera: a slow orbit (shows the depth), closer on alternate 2-bar phrases, a push on every beat
  const close = Math.floor(k / 8) % 2 === 1;
  const ang = 0.5 * Math.sin(t * 0.22) + (close ? 0.2 : 0), r = (close ? 3.9 : 5.4) * (1 - 0.025 * pulse);
  const lookY = close ? 1.0 : 0.95;
  camera.position.set(Math.sin(ang) * r, close ? 1.35 : 1.7, Math.cos(ang) * r + 0.6);
  camera.lookAt(0, lookY, close ? 0.5 : -0.2);
  return (
    <>
      <Env />
      <ambientLight intensity={0.15} />
      <spotLight position={[0, 7, 4]} angle={0.55} penumbra={0.7} intensity={110} color="#ffffff" />
      <pointLight position={[-4, 3, 2]} intensity={30 * (0.5 + 0.5 * pulse)} color={col} />
      <pointLight position={[4, 3, 2]} intensity={30 * (0.5 + 0.5 * pulse)} color={PAL[(bar + 2) % PAL.length]} />
      <Stage t={t} pulse={pulse} col={col} k={k} />
      {TROUPE.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]}>
          <Robot J={J0} fing={fing} lead={m.lead} glow={m.lead ? "#22d3ee" : col} pulse={pulse} />
        </group>
      ))}
    </>
  );
};

export const Robot3D: React.FC<{ handle?: string }> = ({ handle = "@ai_maastaaru" }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = Math.min(T1, T0 + f / 30);
  const ended = f >= Math.round((T1 - T0) * 30);
  const endAge = (f - Math.round((T1 - T0) * 30)) / 30;
  const step = [...STEPS].reverse().find((c) => t >= c.t[0] - 0.1);
  const stepAge = step ? t - step.t[0] : 9;
  return (
    <AbsoluteFill style={{ background: "#05050a" }}>
      <Fonts />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 2, 7], fov: 36, near: 0.1, far: 80 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <Scene t={t} />
      </ThreeCanvas>
      {f < 90 && (
        <div style={{ position: "absolute", top: 150, left: 40, right: 40, textAlign: "center", opacity: Math.min(1, f / 4, (90 - f) / 10) }}>
          <div style={{ display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 64, lineHeight: 1.1, color: "#fff", background: "rgba(5,5,10,0.78)", padding: "16px 28px", borderRadius: 26 }}>5 AI robots dance the<br /><span style={{ color: "#22d3ee" }}>King of Pop's</span> moves 🤖</div>
        </div>
      )}
      {step && !ended && f >= 90 && (
        <div style={{ position: "absolute", left: 32, top: 150, opacity: Math.min(1, Math.max(0.15, stepAge) / 0.15) }}>
          <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 34, color: "#05050a", background: "#22d3ee", padding: "6px 16px", borderRadius: 12, display: "inline-block" }}>MOVE {step.id.slice(1)}/14</div>
          <div style={{ marginTop: 10, fontFamily: "Inter", fontWeight: 900, fontSize: 60, color: "#fff", textShadow: "0 3px 14px rgba(0,0,0,0.8)" }}>{step.short}</div>
        </div>
      )}
      <div style={{ position: "absolute", right: 28, top: 52, fontFamily: "Inter", fontWeight: 800, fontSize: 34, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "8px 18px", borderRadius: 14 }}>● 3D motion capture</div>
      {ended && (
        <AbsoluteFill style={{ background: `rgba(5,5,10,${Math.min(0.92, endAge * 4)})`, alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", opacity: Math.min(1, endAge * 4) }}>
            <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.15 }}>A human danced once.<br />AI taught 5 robots.</div>
            <div style={{ marginTop: 16, fontFamily: "Inter", fontWeight: 800, fontSize: 44, color: "#94a3b8" }}>3D pose tracking → robot rig</div>
            <div style={{ marginTop: 40, display: "inline-block", fontFamily: "Inter", fontWeight: 900, fontSize: 48, color: "#fff", background: "#0095f6", padding: "16px 40px", borderRadius: 22 }}>Follow {handle}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
