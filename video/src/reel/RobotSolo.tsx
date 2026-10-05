import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Fonts } from "../components/Fonts";
import { beatWarp } from "./motionPost";
import { FPose } from "./Fumble";
import bj from "./mocap/bj.json";
import bj3d from "./mocap/bj_3d.json";

// One robot, many moving parts, moving like the human it was captured from (no "robotic" snapping):
//  pelvis + 3 vertebrae that twist progressively into the chest, 2 collarbones (shrugs), 2-segment neck, head aimed
//  by nose/ears, upper arm / forearm / 3D palm with 5 fingers x 3 joints (+ thumb), thigh / shin / heel-foot / toes
//  (toes bend when the heel lifts). Feet are locked while planted (pipeline/export3d.py). Render with --gl=swangle.
// check=true: the reference clip on top (private review only, never published), the robot below, same clock.

type D3 = { frames: number; joints: number[][]; tx: number[]; fing?: number[][][]; yaw?: number };
const D = bj3d as unknown as D3;
const TRK = (bj as unknown as { tracks: { poses: FPose[] }[] }).tracks[0];
const T0 = 0.1, T1 = 40.2;
export const ROBOT_SOLO_LEN = Math.round((T1 - T0) * 30) + 60;
const BEATS = Array.from({ length: 84 }, (_, k) => 0.2 + (k * 60) / 117);
const WARP = beatWarp(TRK, 0, BEATS, 30, 0.22);

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const mid = (a: THREE.Vector3, b: THREE.Vector3, u = 0.5) => a.clone().lerp(b, u);
const jointsAt = (s: number): THREE.Vector3[] => {
  const x = Math.max(0, Math.min(D.frames - 1.001, s * 30)), i = Math.floor(x), u = x - i;
  const A = D.joints[i], B = D.joints[i + 1] ?? A;
  const tx = (D.tx[i] * (1 - u) + (D.tx[i + 1] ?? D.tx[i]) * u) * 0.3;
  const out: THREE.Vector3[] = [];
  for (let j = 0; j < 33; j++) out.push(V(A[j * 3] * (1 - u) + B[j * 3] * u + tx, A[j * 3 + 1] * (1 - u) + B[j * 3 + 1] * u, A[j * 3 + 2] * (1 - u) + B[j * 3 + 2] * u));
  return out;
};
/** Finger curls, smoothed over ±3 frames (the hand model sees each hand only part of the time). */
const fingAt = (s: number): number[][] => {
  const c = Math.round(s * 30), acc = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  let n = 0;
  for (let k = -3; k <= 3; k++) {
    const f = D.fing?.[Math.max(0, Math.min(D.frames - 1, c + k))];
    if (!f) continue;
    n++;
    for (let h = 0; h < 2; h++) for (let i = 0; i < 5; i++) acc[h][i] += f[h][i] ?? 0.3;
  }
  return n ? acc.map((h) => h.map((v) => v / n)) : [[0.3, 0.3, 0.3, 0.3, 0.3], [0.3, 0.3, 0.3, 0.3, 0.3]];
};
const frameQ = (right: THREE.Vector3, up: THREE.Vector3) => {
  const x = right.clone().normalize(), z = new THREE.Vector3().crossVectors(x, up).normalize(), y = new THREE.Vector3().crossVectors(z, x);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};

const M = {
  shell: { color: "#f3f5f8", metalness: 0.25, roughness: 0.22 },
  dark: { color: "#23262d", metalness: 0.85, roughness: 0.32 },
  mid: { color: "#8a93a1", metalness: 0.9, roughness: 0.25 },
};
const GLOW = "#22d3ee";
const glowM = { color: GLOW, emissive: GLOW, emissiveIntensity: 2.2 };

/** Armoured segment a->b: dark core rod, white shell (shorter, offset from the joints), a glowing seam line. */
const Bone: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; shell?: number }> = ({ a, b, r, shell = 0.78 }) => {
  const d = b.clone().sub(a), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
  const m = mid(a, b);
  return (
    <group>
      <mesh position={m} quaternion={q}><cylinderGeometry args={[r * 0.45, r * 0.45, L, 10]} /><meshStandardMaterial {...M.dark} /></mesh>
      <mesh position={m} quaternion={q}><capsuleGeometry args={[r, Math.max(0.005, L * shell - 2 * r), 6, 16]} /><meshStandardMaterial {...M.shell} /></mesh>
      <mesh position={m} quaternion={q}><torusGeometry args={[r * 1.02, r * 0.07, 6, 20]} /><meshStandardMaterial {...glowM} /></mesh>
    </group>
  );
};
const Joint: React.FC<{ p: THREE.Vector3; r: number }> = ({ p, r }) => <mesh position={p}><sphereGeometry args={[r, 16, 12]} /><meshStandardMaterial {...M.mid} /></mesh>;
const Box: React.FC<{ c: THREE.Vector3; q: THREE.Quaternion; s: [number, number, number]; m?: object; children?: React.ReactNode; r?: number }> = ({ c, q, s, m = M.shell, children }) => (
  <group position={c} quaternion={q}><mesh><boxGeometry args={s} /><meshStandardMaterial {...m} /></mesh>{children}</group>
);

/** 3D palm + five fingers (three phalanges each) curling about the knuckle axis. */
const Hand: React.FC<{ w: THREE.Vector3; idx: THREE.Vector3; pk: THREE.Vector3; th: THREE.Vector3; curl: number[] }> = ({ w, idx, pk, th, curl }) => {
  const dir = mid(idx, pk).sub(w), across = idx.clone().sub(pk);
  const q = frameQ(across, dir);
  const L = Math.max(0.06, dir.length());
  const palmLen = L * 0.95, fw = 0.019;
  // fingers in palm-local space: x across (index side +), y along the hand, z palm normal (curl bends toward -z)
  const finger = (x: number, len: number, c: number, key: number) => {
    const a = 1.25 * c;
    let px = 0, py = palmLen / 2, pz = 0, ang = 0;
    const segs = [len * 0.45, len * 0.32, len * 0.25].map((sl, k) => {
      ang += a * [0.9, 1.1, 0.8][k];
      const cy = py + Math.cos(ang) * sl / 2, cz = pz - Math.sin(ang) * sl / 2;
      const el = <mesh key={k} position={[x + px, cy, cz]} rotation={[-ang, 0, 0]}><boxGeometry args={[fw, sl * 0.92, fw * 1.05]} /><meshStandardMaterial {...(k === 2 ? M.dark : M.shell)} /></mesh>;
      py += Math.cos(ang) * sl; pz -= Math.sin(ang) * sl;
      return el;
    });
    return <group key={key}>{segs}</group>;
  };
  const tc = curl[4] ?? 0.3;
  return (
    <group position={mid(w, mid(idx, pk), 0.42)} quaternion={q}>
      <mesh><boxGeometry args={[Math.max(0.07, across.length() * 1.1), palmLen, 0.03]} /><meshStandardMaterial {...M.shell} /></mesh>
      <mesh position={[0, 0, 0.016]}><circleGeometry args={[0.012, 16]} /><meshStandardMaterial {...glowM} /></mesh>
      {finger(0.027, 0.085, curl[0] ?? 0.3, 0)}
      {finger(0.009, 0.095, curl[1] ?? 0.3, 1)}
      {finger(-0.009, 0.09, curl[2] ?? 0.3, 2)}
      {finger(-0.027, 0.072, curl[3] ?? 0.3, 3)}
      {/* thumb: swings across the palm as it tucks */}
      <group position={[0.036, -palmLen * 0.25, 0.005]} rotation={[-0.6 * tc, 0, -0.5 - 0.9 * tc]}>
        <mesh position={[0, 0.025, 0]}><boxGeometry args={[0.021, 0.05, 0.022]} /><meshStandardMaterial {...M.shell} /></mesh>
        <mesh position={[0, 0.062, -0.006 * tc]} rotation={[-0.7 * tc, 0, 0]}><boxGeometry args={[0.019, 0.032, 0.02]} /><meshStandardMaterial {...M.dark} /></mesh>
      </group>
    </group>
  );
};

/** Heel block + toe section hinged at the ball of the foot. */
const Foot: React.FC<{ ankle: THREE.Vector3; heel: THREE.Vector3; toe: THREE.Vector3 }> = ({ ankle, heel, toe }) => {
  const ball = mid(heel, toe, 0.72);
  const fwd = toe.clone().sub(heel), side = new THREE.Vector3().crossVectors(UP, fwd).normalize();
  const qMain = frameQ(side, new THREE.Vector3().crossVectors(fwd, side).normalize());
  const toeDir = toe.clone().sub(ball);
  const qToe = frameQ(side, new THREE.Vector3().crossVectors(toeDir, side).normalize());
  const mainLen = Math.max(0.12, heel.distanceTo(ball) * 1.1);
  return (
    <group>
      <Bone a={ankle} b={mid(heel, ball, 0.45)} r={0.03} shell={0.4} />
      <Box c={mid(heel, ball)} q={qMain} s={[0.085, 0.05, mainLen]}>
        <mesh position={[0, -0.028, 0]}><boxGeometry args={[0.087, 0.008, mainLen]} /><meshStandardMaterial {...glowM} /></mesh>
      </Box>
      <Joint p={ball} r={0.022} />
      <Box c={mid(ball, toe)} q={qToe} s={[0.08, 0.035, Math.max(0.04, toeDir.length())]} m={M.dark} />
    </group>
  );
};

const Robot: React.FC<{ J: THREE.Vector3[]; fing: number[][] }> = ({ J, fing }) => {
  const hipC = mid(J[23], J[24]), shC = mid(J[11], J[12]);
  const up = shC.clone().sub(hipC);
  const qP = frameQ(J[23].clone().sub(J[24]), up), qC = frameQ(J[11].clone().sub(J[12]), up);
  const vert = [0.28, 0.46, 0.62].map((u) => ({ c: mid(hipC, shC, u), q: qP.clone().slerp(qC, (u - 0.2) / 0.6) }));
  const chest = mid(hipC, shC, 0.8), neckBase = mid(hipC, shC, 1.02);
  const earC = mid(J[7], J[8]);
  const fwd = J[0].clone().sub(earC);
  const faceUp = mid(J[2], J[5]).sub(mid(J[9], J[10])).normalize().multiplyScalar(0.5).add(up.clone().normalize()).normalize();
  const headC = earC.clone().add(faceUp.clone().multiplyScalar(0.02)).add(fwd.clone().multiplyScalar(0.15));
  const qH = frameQ(J[7].clone().sub(J[8]), faceUp);
  const neckTop = headC.clone().sub(faceUp.clone().multiplyScalar(0.1));
  const neckMid = mid(neckBase, neckTop).add(fwd.clone().setY(0).normalize().multiplyScalar(0.012));
  return (
    <group>
      {/* pelvis, vertebrae, chest */}
      <group position={mid(hipC, shC, 0.06)} quaternion={qP}>
        <mesh scale={[0.16, 0.09, 0.11]}><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial {...M.dark} /></mesh>
        <mesh position={[0, 0.02, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1, 0.7]}><torusGeometry args={[0.15, 0.006, 6, 40]} /><meshStandardMaterial {...glowM} /></mesh>
      </group>
      {vert.map((v, i) => <group key={i} position={v.c} quaternion={v.q}><mesh scale={[0.1 - i * 0.004, 0.04, 0.075]}><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial {...(i % 2 ? M.mid : M.dark)} /></mesh></group>)}
      <group position={chest} quaternion={qC}>
        <mesh scale={[0.165, 0.15, 0.105]}><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial {...M.shell} /></mesh>
        <mesh position={[0, 0.03, 0.104]}><circleGeometry args={[0.035, 24]} /><meshStandardMaterial {...glowM} /></mesh>
        <mesh position={[-0.07, -0.06, 0.092]}><planeGeometry args={[0.05, 0.008]} /><meshStandardMaterial {...glowM} /></mesh>
        <mesh position={[0.07, -0.06, 0.092]}><planeGeometry args={[0.05, 0.008]} /><meshStandardMaterial {...glowM} /></mesh>
      </group>
      {/* collarbones (shrugs show here), shoulders */}
      <Bone a={neckBase.clone().sub(up.clone().normalize().multiplyScalar(0.03))} b={J[11]} r={0.022} shell={0.6} />
      <Bone a={neckBase.clone().sub(up.clone().normalize().multiplyScalar(0.03))} b={J[12]} r={0.022} shell={0.6} />
      {[11, 12].map((s) => <group key={s}><Joint p={J[s]} r={0.05} /><mesh position={J[s]}><sphereGeometry args={[0.062, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial {...M.shell} /></mesh></group>)}
      {/* neck (2 segments) and head */}
      <Joint p={neckBase} r={0.03} />
      <Bone a={neckBase} b={neckMid} r={0.026} shell={0.5} />
      <Bone a={neckMid} b={neckTop} r={0.024} shell={0.5} />
      <group position={headC} quaternion={qH}>
        <mesh><sphereGeometry args={[0.105, 28, 22]} /><meshStandardMaterial {...M.shell} /></mesh>
        <mesh position={[0, 0.0, 0.055]} scale={[1, 0.55, 0.6]}><sphereGeometry args={[0.095, 28, 18, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.5]} /><meshStandardMaterial color="#05060a" metalness={0.9} roughness={0.08} /></mesh>
        <mesh position={[-0.032, 0.01, 0.1]}><circleGeometry args={[0.012, 16]} /><meshStandardMaterial {...glowM} /></mesh>
        <mesh position={[0.032, 0.01, 0.1]}><circleGeometry args={[0.012, 16]} /><meshStandardMaterial {...glowM} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.104, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.02, 20]} /><meshStandardMaterial {...M.dark} /></mesh>)}
        {[-1, 1].map((s) => <mesh key={`g${s}`} position={[s * 0.115, 0, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.022, 0.004, 6, 20]} /><meshStandardMaterial {...glowM} /></mesh>)}
      </group>
      {/* arms */}
      <Bone a={J[11]} b={J[13]} r={0.04} /><Joint p={J[13]} r={0.034} /><Bone a={J[13]} b={J[15]} r={0.034} /><Joint p={J[15]} r={0.026} />
      <Bone a={J[12]} b={J[14]} r={0.04} /><Joint p={J[14]} r={0.034} /><Bone a={J[14]} b={J[16]} r={0.034} /><Joint p={J[16]} r={0.026} />
      <Hand w={J[15]} idx={J[19]} pk={J[17]} th={J[21]} curl={fing[1]} />
      <Hand w={J[16]} idx={J[20]} pk={J[18]} th={J[22]} curl={fing[0]} />
      {/* legs */}
      {[23, 24].map((h) => <Joint key={h} p={J[h]} r={0.055} />)}
      <Bone a={J[23]} b={J[25]} r={0.058} /><Joint p={J[25]} r={0.045} /><Bone a={J[25]} b={J[27]} r={0.048} /><Joint p={J[27]} r={0.034} />
      <Bone a={J[24]} b={J[26]} r={0.058} /><Joint p={J[26]} r={0.045} /><Bone a={J[26]} b={J[28]} r={0.048} /><Joint p={J[28]} r={0.034} />
      <Foot ankle={J[27]} heel={J[29]} toe={J[31]} />
      <Foot ankle={J[28]} heel={J[30]} toe={J[32]} />
      {/* contact shadows under the feet */}
      {[31, 32].map((t, i) => {
        const p = mid(J[t], J[29 + i]);
        const h = Math.min(J[t].y, J[29 + i].y);
        return <mesh key={t} position={[p.x, 0.003, p.z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.11 + h * 0.4, 24]} /><meshBasicMaterial color="#000" transparent opacity={Math.max(0, 0.55 - h * 3)} /></mesh>;
      })}
    </group>
  );
};

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.75;
  }, [gl, scene]);
  return null;
};

const Scene: React.FC<{ s: number; t: number; check: boolean }> = ({ s, t, check }) => {
  const { camera } = useThree();
  const J = jointsAt(s), fing = fingAt(s);
  const hipC = mid(J[23], J[24]);
  const ang = check ? 0 : 0.55 * Math.sin(t * 0.17), r = check ? 2.5 : 2.9;
  const cx = check ? 0 : hipC.x * 0.6;
  camera.position.set(cx + Math.sin(ang) * r, check ? 1.0 : 1.1, Math.cos(ang) * r);
  camera.lookAt(cx, 0.85, 0);
  return (
    <>
      <Env />
      <ambientLight intensity={0.2} />
      <directionalLight position={[2, 5, 4]} intensity={2.2} />
      <pointLight position={[-2.5, 2, 1.5]} intensity={12} color="#7dd3fc" />
      <pointLight position={[2.5, 1.5, -1.5]} intensity={10} color="#f0abfc" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[6, 64]} /><meshStandardMaterial color="#0b0d14" metalness={0.7} roughness={0.3} /></mesh>
      {[1.2, 2.2, 3.2].map((rr) => <mesh key={rr} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}><ringGeometry args={[rr, rr + 0.012, 96]} /><meshBasicMaterial color={GLOW} transparent opacity={0.35} /></mesh>)}
      {/* check view: undo the turn-to-camera so the robot faces where the dancer faces in the footage */}
      <group rotation={[0, check ? (D.yaw ?? 0) : 0, 0]}><Robot J={J} fing={fing} /></group>
    </>
  );
};

export const RobotSolo: React.FC<{ check?: boolean }> = ({ check = false }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = Math.min(T1, T0 + f / 30);
  const s = check ? t : WARP(t); // the check view uses the raw clock so it lines up with the reference
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #182033, #05060a 70%)" }}>
      <Fonts />
      {check && (
        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 960, background: "#000", display: "flex", justifyContent: "center" }}>
          <OffthreadVideo src={staticFile("mocap/bj.mp4")} startFrom={Math.round(T0 * 30)} muted style={{ height: 960 }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 0, top: check ? 960 : 0, width: 1080, height: check ? 960 : 1920 }}>
        <ThreeCanvas width={width} height={check ? 960 : height} camera={{ position: [0, 1.2, 3.4], fov: check ? 46 : 42, near: 0.05, far: 50 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <Scene s={s} t={t} check={check} />
        </ThreeCanvas>
      </div>
    </AbsoluteFill>
  );
};
