import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// 3D chariot race in an arena (Three.js via @remotion/three). Everything is a pure function of the frame:
// gallop cycles, wheel spin, cape cloth, whip, dust particles and the camera cuts. Render with --gl=swangle.
const FPS = 30;
const SPEED = 13; // world units per second
const RIVAL = { lead: -3.5, gain: 0.55 }; // rival starts behind and closes in

const C = {
  cream: "#f4ead3", pink: "#e2567c", gold: "#d6a93b", horse: "#f2f0ec", hoof: "#3a3431", steel: "#c9ced6",
  red: "#c8283d", skin: "#e8b48a", sand: "#e3c27e", rival: "#b8233a",
};

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (rep) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep[0], rep[1]);
  }
  t.anisotropy = 8;
  return t;
};

const useTextures = () =>
  useMemo(() => {
    const brick = canvasTex(512, 512, (g) => {
      g.fillStyle = "#b9ab97";
      g.fillRect(0, 0, 512, 512);
      const rows = 12, bw = 128, bh = 512 / rows;
      for (let r = 0; r < rows; r++) {
        for (let k = -1; k < 5; k++) {
          const x = k * bw + (r % 2 ? bw / 2 : 0);
          const v = 190 + Math.floor(random(`b${r}${k}`) * 34) - 17;
          g.fillStyle = `rgb(${v},${v - 12},${v - 28})`;
          g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
        }
      }
    }, [120, 2]);
    const sand = canvasTex(512, 512, (g) => {
      g.fillStyle = C.sand;
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 5000; i++) {
        const v = random(`s${i}`);
        g.fillStyle = v > 0.5 ? "rgba(255,240,200,0.35)" : "rgba(150,110,60,0.25)";
        g.fillRect(random(`sx${i}`) * 512, random(`sy${i}`) * 512, 2, 2);
      }
      for (let i = 0; i < 14; i++) {  // wheel ruts along the track
        g.fillStyle = "rgba(160,120,70,0.18)";
        g.fillRect(0, random(`r${i}`) * 512, 512, 3 + random(`rw${i}`) * 5);
      }
    }, [80, 8]);
    const arches = canvasTex(1024, 256, (g) => {
      g.fillStyle = "#cdbfa8";
      g.fillRect(0, 0, 1024, 256);
      for (let k = 0; k < 8; k++) {
        const x = k * 128 + 24;
        g.fillStyle = "#7d6f5f";
        g.beginPath();
        g.moveTo(x, 256);
        g.lineTo(x, 110);
        g.arc(x + 40, 110, 40, Math.PI, 0);
        g.lineTo(x + 80, 256);
        g.fill();
      }
      g.fillStyle = "#b3a58f";
      g.fillRect(0, 0, 1024, 26);
    }, [40, 1]);
    const sky = canvasTex(4, 256, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "#7fa3c4");
      gr.addColorStop(0.55, "#c9d6df");
      gr.addColorStop(1, "#efe3c8");
      g.fillStyle = gr;
      g.fillRect(0, 0, 4, 256);
    });
    const puff = canvasTex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.4, "rgba(255,255,255,0.55)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    });
    return { brick, sand, arches, sky, puff };
  }, []);

const Std: React.FC<{ c: string; r?: number; m?: number; e?: string; ei?: number }> = ({ c, r = 0.55, m = 0, e, ei = 0 }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000"} emissiveIntensity={ei} />
);

// ---------- Horse ----------
// Rotary gallop: each leg's phase in the stride. Hip/shoulder swing + knee (front) / hock (hind) fold.
const LEGS: { x: number; z: number; front: boolean; ph: number }[] = [
  { x: 0.78, z: 0.17, front: true, ph: 0.55 },
  { x: 0.78, z: -0.17, front: true, ph: 0.65 },
  { x: -0.72, z: 0.17, front: false, ph: 0.0 },
  { x: -0.72, z: -0.17, front: false, ph: 0.1 },
];

const Leg: React.FC<{ t: number; front: boolean; ph: number }> = ({ t, front, ph }) => {
  const th = 2 * Math.PI * (t * 2.3 + ph);
  const swing = (front ? 0.62 : 0.55) * Math.sin(th);
  const fold = Math.max(0, Math.sin(th + (front ? 1.6 : -1.2)));
  const knee = front ? fold * 1.5 : -fold * 1.0;
  return (
    <group rotation={[0, 0, swing]}>
      <mesh position={[0, -0.27, 0]}>
        <capsuleGeometry args={[front ? 0.085 : 0.11, 0.42, 6, 10]} />
        <Std c={C.horse} r={0.5} />
      </mesh>
      <group position={[0, -0.56, 0]} rotation={[0, 0, knee]}>
        <mesh position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.052, 0.44, 6, 8]} />
          <Std c={C.horse} r={0.5} />
        </mesh>
        <mesh position={[0, -0.53, 0]}>
          <cylinderGeometry args={[0.06, 0.075, 0.09, 12]} />
          <Std c={C.hoof} r={0.8} />
        </mesh>
      </group>
    </group>
  );
};

const Horse: React.FC<{ t: number; seed: number; plume: string }> = ({ t, seed, plume }) => {
  const tt = t + seed * 0.07;
  const cyc = 2 * Math.PI * tt * 2.3;
  const bob = 0.07 * Math.sin(cyc * 2 + 0.5);
  const pitch = 0.06 * Math.sin(cyc + 0.3);
  const neck = 0.12 * Math.sin(cyc + 1.2);
  return (
    <group position={[0, 1.55 + bob, 0]} rotation={[0, 0, pitch]}>
      {/* barrel, chest and rump */}
      <mesh scale={[1.05, 0.42, 0.36]} castShadow>
        <sphereGeometry args={[1, 28, 18]} />
        <Std c={C.horse} r={0.45} />
      </mesh>
      <mesh position={[0.62, 0.05, 0]} scale={[0.42, 0.4, 0.34]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <Std c={C.horse} r={0.45} />
      </mesh>
      <mesh position={[-0.62, 0.06, 0]} scale={[0.45, 0.43, 0.38]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <Std c={C.horse} r={0.45} />
      </mesh>
      {/* harness bands */}
      <mesh position={[0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.37, 0.44, 1]}>
        <torusGeometry args={[1, 0.07, 8, 28]} />
        <Std c={C.gold} m={0.6} r={0.3} />
      </mesh>
      {/* neck + head */}
      <group position={[0.85, 0.22, 0]} rotation={[0, 0, -0.75 + neck]}>
        <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.15, 0.25, 0.9, 16]} />
          <Std c={C.horse} r={0.45} />
        </mesh>
        {/* mane */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.17, 0.1 + i * 0.13, 0]} rotation={[0, 0, 0.5 + 0.2 * Math.sin(cyc * 2 + i)]}>
            <boxGeometry args={[0.16, 0.06, 0.05]} />
            <Std c="#e9e4da" r={0.7} />
          </mesh>
        ))}
        <group position={[0.02, 0.86, 0]} rotation={[0, 0, 0.25 + 0.1 * Math.sin(cyc + 2)]}>
          <mesh position={[0.2, 0, 0]} scale={[0.36, 0.15, 0.13]} castShadow>
            <sphereGeometry args={[1, 18, 12]} />
            <Std c={C.horse} r={0.45} />
          </mesh>
          <mesh position={[0.5, -0.02, 0]} scale={[0.12, 0.11, 0.11]}>
            <sphereGeometry args={[1, 14, 10]} />
            <Std c="#e6ded6" r={0.5} />
          </mesh>
          <mesh position={[0.02, 0.15, 0.05]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.035, 0.14, 8]} />
            <Std c={C.horse} />
          </mesh>
          <mesh position={[0.02, 0.15, -0.05]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.035, 0.14, 8]} />
            <Std c={C.horse} />
          </mesh>
          <mesh position={[0.22, 0.07, 0.12]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <Std c="#1d1a19" r={0.2} />
          </mesh>
          <mesh position={[0.22, 0.07, -0.12]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <Std c="#1d1a19" r={0.2} />
          </mesh>
          {/* bridle + plume */}
          <mesh position={[0.2, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.14, 0.15, 1]}>
            <torusGeometry args={[1, 0.12, 6, 18]} />
            <Std c={C.gold} m={0.6} r={0.3} />
          </mesh>
          <mesh position={[-0.02, 0.24, 0]} rotation={[0, 0, 0.35]}>
            <coneGeometry args={[0.06, 0.3, 10]} />
            <Std c={plume} r={0.7} />
          </mesh>
        </group>
      </group>
      {/* tail */}
      <mesh position={[-1.1, 0.02, 0]} rotation={[0, 0, 1.1 + 0.18 * Math.sin(cyc * 2)]}>
        <coneGeometry args={[0.1, 0.8, 10]} />
        <Std c="#e7e1d6" r={0.8} />
      </mesh>
      {LEGS.map((l, i) => (
        <group key={i} position={[l.x, -0.12, l.z]}>
          <Leg t={tt} front={l.front} ph={l.ph} />
        </group>
      ))}
    </group>
  );
};

// ---------- Chariot ----------
const Wheel: React.FC<{ z: number; angle: number; rim: string }> = ({ z, angle, rim }) => (
  <group position={[0, 0.78, z]} rotation={[0, 0, angle]}>
    <mesh castShadow>
      <torusGeometry args={[0.72, 0.075, 12, 40]} />
      <Std c={rim} r={0.4} />
    </mesh>
    <mesh>
      <torusGeometry args={[0.62, 0.03, 8, 40]} />
      <Std c={C.gold} m={0.7} r={0.25} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} rotation={[0, 0, (i / 10) * Math.PI * 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1.36, 6]} />
        <Std c={C.gold} m={0.5} r={0.35} />
      </mesh>
    ))}
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.2, 18]} />
      <Std c={rim} r={0.4} />
    </mesh>
    <mesh position={[0, 0, z > 0 ? 0.12 : -0.12]}>
      <sphereGeometry args={[0.09, 14, 10]} />
      <Std c={C.gold} m={0.8} r={0.2} />
    </mesh>
  </group>
);

const Cape: React.FC<{ t: number; color: string }> = ({ t, color }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(1.1, 0.55, 16, 5), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x0 = base[i * 3], y0 = base[i * 3 + 1];
    const u = (0.55 - x0) / 1.1; // 0 at the shoulders, 1 at the free end
    pos.setX(i, x0);
    pos.setY(i, y0 + u * 0.18 * Math.sin(t * 13 - u * 7) - u * 0.08);
    pos.setZ(i, u * 0.22 * Math.sin(t * 9 - u * 5 + y0 * 3));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={[-0.72, 2.25, 0]} rotation={[0, 0, -0.1]} castShadow>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  );
};

const Whip: React.FC<{ t: number }> = ({ t }) => {
  const crack = Math.sin(t * 5.5);
  const geo = useMemo(() => {
    const pts = Array.from({ length: 8 }, (_, i) => {
      const u = i / 7;
      return new THREE.Vector3(-u * 1.2 + 0.1, u * 1.1 + 0.25 * Math.sin(u * 4 - t * 11) * u + crack * u * u * 0.5, 0.1 * Math.sin(u * 5 + t * 7));
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 5, false);
  }, [t, crack]);
  return (
    <mesh geometry={geo}>
      <Std c="#5b3a22" r={0.8} />
    </mesh>
  );
};

const Driver: React.FC<{ t: number; plume: string; cape: string }> = ({ t, plume, cape }) => {
  const arm = -0.6 + 0.5 * Math.sin(t * 5.5);
  const sway = 0.05 * Math.sin(t * 2.3 * Math.PI * 2);
  return (
    <group position={[-0.05, 0.95, 0]} rotation={[sway, 0, 0.12]}>
      {/* legs + tunic */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.6, 16]} />
        <Std c="#f1ece2" r={0.8} />
      </mesh>
      {/* armoured torso */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.55, 18]} />
        <Std c={C.steel} m={0.85} r={0.28} />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <sphereGeometry args={[0.16, 18, 14]} />
        <Std c={C.skin} r={0.6} />
      </mesh>
      {/* helmet + crest */}
      <mesh position={[0, 1.43, 0]}>
        <sphereGeometry args={[0.175, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Std c={C.gold} m={0.8} r={0.25} />
      </mesh>
      <mesh position={[-0.02, 1.62, 0]} scale={[0.26, 0.12, 0.05]}>
        <sphereGeometry args={[1, 14, 10]} />
        <Std c={plume} r={0.8} />
      </mesh>
      {/* whip arm (raised) and rein arm */}
      <group position={[0.05, 1.18, 0.26]} rotation={[0, 0, arm]}>
        <mesh position={[0.2, 0.18, 0]} rotation={[0, 0, -0.9]}>
          <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
          <Std c={C.skin} r={0.6} />
        </mesh>
        <group position={[0.38, 0.38, 0]}>
          <Whip t={t} />
        </group>
      </group>
      <mesh position={[0.25, 1.02, -0.24]} rotation={[0, 0, -1.2]}>
        <capsuleGeometry args={[0.05, 0.42, 4, 8]} />
        <Std c={C.skin} r={0.6} />
      </mesh>
      <group position={[0.05, -0.95, 0]}>
        <Cape t={t} color={cape} />
      </group>
    </group>
  );
};

const Chariot: React.FC<{ t: number; x: number; rim: string; body: string; plume: string; cape: string }> = ({ t, x, rim, body, plume, cape }) => {
  const angle = -x / 0.72;
  const jolt = 0.025 * Math.sin(t * 31) + 0.015 * Math.sin(t * 17);
  return (
    <group position={[0, jolt, 0]}>
      <Wheel z={0.62} angle={angle} rim={rim} />
      <Wheel z={-0.62} angle={angle} rim={rim} />
      <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 10]} />
        <Std c="#6b4a2b" />
      </mesh>
      {/* floor */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.9, 0.08, 1.0]} />
        <Std c="#8a5a33" />
      </mesh>
      {/* curved front shell: a half cylinder standing up */}
      <mesh position={[0.1, 1.35, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.5, 0.8, 32, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={body} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 1.75, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <torusGeometry args={[0.52, 0.045, 10, 32, Math.PI]} />
        <Std c={rim} r={0.4} />
      </mesh>
      <mesh position={[0.1, 1.35, 0.52]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.02, 0.8, 0.02]} />
        <Std c={C.gold} m={0.7} r={0.25} />
      </mesh>
      {/* side medallion + gold scroll */}
      {[0.53, -0.53].map((z) => (
        <mesh key={z} position={[0.1, 1.35, z]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.13, 0.03, 8, 24]} />
          <Std c={C.gold} m={0.7} r={0.25} />
        </mesh>
      ))}
      {/* pole to the yoke */}
      <mesh position={[1.9, 1.05, 0]} rotation={[0, 0, Math.PI / 2 - 0.06]}>
        <cylinderGeometry args={[0.045, 0.045, 3.6, 10]} />
        <Std c="#7a5230" />
      </mesh>
      <mesh position={[3.7, 1.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 10]} />
        <Std c={C.gold} m={0.6} r={0.3} />
      </mesh>
      <Driver t={t} plume={plume} cape={cape} />
    </group>
  );
};

// Four horses abreast + reins, the chariot behind.
const Team: React.FC<{ t: number; x: number; z: number; rim: string; body: string; plume: string; cape: string; seed: number }> = ({ t, x, z, rim, body, plume, cape, seed }) => {
  const HZ = [0.95, 0.32, -0.32, -0.95];
  const reins = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    HZ.forEach((hz) => {
      pts.push(new THREE.Vector3(0.35, 2.05, 0.1), new THREE.Vector3(4.9, 2.55, hz));
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  return (
    <group position={[x, 0, z]}>
      <Chariot t={t} x={x} rim={rim} body={body} plume={plume} cape={cape} />
      {HZ.map((hz, i) => (
        <group key={i} position={[4.3 + (i % 2) * 0.15, 0, hz]}>
          <Horse t={t} seed={seed * 4 + i} plume={plume} />
        </group>
      ))}
      <lineSegments geometry={reins}>
        <lineBasicMaterial color="#d8b25a" />
      </lineSegments>
    </group>
  );
};

// ---------- Dust: particles born at the wheels/hooves at fixed times, so any frame can be computed alone ----------
const Dust: React.FC<{ t: number; teamX: (t: number) => number; z: number; tex: THREE.Texture; n: number }> = ({ t, teamX, z, tex, n }) => {
  const LIFE = 1.7, RATE = 120;
  const out: JSX.Element[] = [];
  const first = Math.max(0, Math.floor((t - LIFE) * RATE));
  for (let k = first; k <= Math.floor(t * RATE); k++) {
    const b = k / RATE, age = t - b;
    if (age < 0 || age > LIFE) continue;
    const u = age / LIFE;
    const src = random(`src${n}${k}`);
    const ex = teamX(b) + (src < 0.5 ? -0.1 : 4.3 + random(`hx${n}${k}`) * 1.2);
    const ez = z + (src < 0.5 ? (src < 0.25 ? 0.62 : -0.62) : (random(`hz${n}${k}`) - 0.5) * 2.2);
    const x = ex - age * (1.5 + random(`vx${n}${k}`) * 2);
    const y = 0.15 + age * (0.6 + random(`vy${n}${k}`) * 0.9);
    const zz = ez + (random(`vz${n}${k}`) - 0.5) * age * 2.2;
    const s = 0.5 + u * (1.8 + random(`sz${n}${k}`) * 1.4);
    out.push(
      <sprite key={k} position={[x, y, zz]} scale={[s, s, s]}>
        <spriteMaterial map={tex} color="#d9b574" transparent opacity={0.6 * (1 - u) * Math.min(1, age * 8)} depthWrite={false} />
      </sprite>
    );
  }
  return <>{out}</>;
};

// ---------- Arena ----------
const Arena: React.FC<{ tx: ReturnType<typeof useTextures> }> = ({ tx }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[150, 0, 0]} receiveShadow>
      <planeGeometry args={[700, 80]} />
      <meshStandardMaterial map={tx.sand} roughness={1} />
    </mesh>
    <mesh position={[150, 3.5, -16]} receiveShadow>
      <boxGeometry args={[700, 7, 1]} />
      <meshStandardMaterial map={tx.brick} roughness={0.95} />
    </mesh>
    <mesh position={[150, 7.2, -16.4]}>
      <boxGeometry args={[700, 0.5, 1.6]} />
      <Std c="#d8ccb6" r={0.9} />
    </mesh>
    <mesh position={[150, 11.5, -22]}>
      <planeGeometry args={[700, 8.5]} />
      <meshStandardMaterial map={tx.arches} roughness={1} />
    </mesh>
    {/* pillars with banners along the wall */}
    {Array.from({ length: 30 }, (_, i) => {
      const x = -60 + i * 22;
      return (
        <group key={i} position={[x, 0, -15]}>
          <mesh position={[0, 4.2, 0]} castShadow>
            <boxGeometry args={[1.4, 8.4, 1.4]} />
            <Std c="#d9cfbd" r={0.9} />
          </mesh>
          <mesh position={[0, 5, 0.75]}>
            <planeGeometry args={[1.0, 3.2]} />
            <meshStandardMaterial color={i % 2 ? C.red : C.pink} roughness={0.9} />
          </mesh>
          <mesh position={[0, 6.2, 0.77]}>
            <circleGeometry args={[0.3, 20]} />
            <Std c={C.gold} m={0.6} r={0.3} />
          </mesh>
        </group>
      );
    })}
    {/* foreground posts on the spina: strong parallax as they pass the camera */}
    {Array.from({ length: 16 }, (_, i) => (
      <group key={`p${i}`} position={[-20 + i * 30, 0, 7]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.6, 1.8, 1.6]} />
          <Std c={C.pink} r={0.6} />
        </mesh>
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[1.8, 0.3, 1.8]} />
          <Std c={C.gold} m={0.5} r={0.35} />
        </mesh>
      </group>
    ))}
  </group>
);

// ---------- Camera: four shots ----------
type Shot = { until: number; pos: (t: number, x: number) => [number, number, number]; look: (t: number, x: number) => [number, number, number]; fov: number };
const SHOTS: Shot[] = [
  { until: 4.5, pos: (t, x) => [x + 2.5 - t * 0.3, 3.2, 15], look: (t, x) => [x + 3, 1.6, 0], fov: 38 },
  { until: 7.5, pos: (t, x) => [x - 2.2, 0.9, 3.2], look: (t, x) => [x + 3.5, 1.3, 0], fov: 50 },
  { until: 11, pos: (t, x) => [x + 13 - (t - 7.5) * 1.2, 2.0, 5.2], look: (t, x) => [x + 2.5, 1.5, -1], fov: 42 },
  { until: 99, pos: (t, x) => [x + 1 + (t - 11) * 0.5, 4 + (t - 11) * 0.6, 17 + (t - 11) * 1.5], look: (t, x) => [x + 1, 1.5, -3], fov: 40 },
];

const Rig: React.FC<{ t: number; x: number }> = ({ t, x }) => {
  const { camera, scene } = useThree();
  const shot = SHOTS.find((s) => t < s.until)!;
  const shake = 0.03 * Math.sin(t * 23) + 0.02 * Math.sin(t * 37);
  const [px, py, pz] = shot.pos(t, x);
  camera.position.set(px, py + shake, pz);
  (camera as THREE.PerspectiveCamera).fov = shot.fov;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  camera.lookAt(...shot.look(t, x));
  scene.fog = new THREE.Fog("#e4d9c3", 30, 110);
  return null;
};

// Soft studio reflections so gold and steel read as metal instead of dark grey.
const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.4;
  }, [gl, scene]);
  return null;
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const tx = useTextures();
  const heroX = (tt: number) => tt * SPEED;
  const rivalX = (tt: number) => tt * SPEED + RIVAL.lead + Math.min(tt, 10) * RIVAL.gain * 0.5;
  const x = heroX(t);
  const sun = useMemo(() => {
    const l = new THREE.DirectionalLight("#fff4e0", 2.0);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    Object.assign(l.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 60 });
    l.shadow.bias = -0.0005;
    return l;
  }, []);
  sun.position.set(x - 6, 18, 12);
  sun.target.position.set(x + 2, 0, -2);
  sun.target.updateMatrixWorld();
  return (
    <>
      <Rig t={t} x={x} />
      <primitive object={tx.sky} attach="background" />
      <Env />
      <hemisphereLight args={["#dfe9f2", "#c9a86a", 0.7]} />
      <primitive object={sun} />
      <primitive object={sun.target} />
      <Arena tx={tx} />
      <Team t={t} x={rivalX(t)} z={-4.2} rim={C.rival} body="#f0e2c4" plume={C.rival} cape="#7c1d2a" seed={2} />
      <Team t={t} x={x} z={0} rim={C.pink} body={C.cream} plume={C.red} cape={C.red} seed={0} />
      <Dust t={t} teamX={rivalX} z={-4.2} tex={tx.puff} n={1} />
      <Dust t={t} teamX={heroX} z={0} tex={tx.puff} n={0} />
    </>
  );
};

export const ChariotRace: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#e4d9c3" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ position: [0, 3, 15], fov: 38, near: 0.1, far: 400 }} gl={{ antialias: true }}>
        <World />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
