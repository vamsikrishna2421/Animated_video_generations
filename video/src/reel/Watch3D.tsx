import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Premium watch assembly, built from primitives in code: case back, movement (gears, balance wheel, bridges,
// jewels, blued screws), case, dial (sunburst + sun mandala), applied indices, hands, crystal, crown, straps.
// Every part eases in from an exploded position. Original design ("SURYA"); render with --gl=swangle.
export const WATCH_LEN = 780;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.out(Easing.cubic);
const SERIF = "'DejaVu Serif', Georgia, serif";
const SANS = "Inter, 'DejaVu Sans', sans-serif";

// Assembly schedule (frames): each part lands at `at`, travelling for `dur`.
const T = {
  back: 60, plate: 105, gears: 150, balance: 250, bridges: 270, rotor: 300, caseRing: 345, dial: 400,
  indices: 440, hHour: 480, hMin: 500, hSec: 520, crystal: 555, bezel: 585, crown: 605, straps: 640, hero: 690,
};
const STEPS: [number, string][] = [
  [T.back - 45, "The case back"], [T.plate - 40, "The movement"], [T.caseRing - 40, "The case"], [T.dial - 35, "The dial"],
  [T.hHour - 30, "The hands"], [T.crystal - 30, "Sapphire crystal"], [T.straps - 30, "The strap"],
];

const M = {
  rose: { color: "#e3a47c", metalness: 1, roughness: 0.22 },
  gold: { color: "#d8ab4e", metalness: 1, roughness: 0.2 },
  steel: { color: "#cfd4da", metalness: 1, roughness: 0.18 },
  brass: { color: "#c9a560", metalness: 1, roughness: 0.38 },
  blued: { color: "#2a4db8", metalness: 0.9, roughness: 0.25 },
  ruby: { color: "#b3102c", metalness: 0.2, roughness: 0.05 },
  leather: { color: "#5a3120", metalness: 0, roughness: 0.75 },
};
type Mat = keyof typeof M;
const Mt: React.FC<{ m: Mat }> = ({ m }) => <meshStandardMaterial {...M[m]} />;

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const useTex = () =>
  useMemo(() => {
    const dial = tex(1024, 1024, (g) => {
      const c = 512;
      // deep blue sunburst
      for (let i = 0; i < 720; i++) {
        const a = (i / 720) * Math.PI * 2;
        const v = 0.5 + 0.5 * Math.cos(a * 2 - 0.6);
        g.strokeStyle = `rgb(${14 + v * 26},${30 + v * 40},${80 + v * 70})`;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(c, c);
        g.lineTo(c + Math.cos(a) * 520, c + Math.sin(a) * 520);
        g.stroke();
      }
      const vg = g.createRadialGradient(c, c, 100, c, c, 512);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,20,0.55)");
      g.fillStyle = vg;
      g.fillRect(0, 0, 1024, 1024);
      // minute track
      g.strokeStyle = "#e8d3a0";
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const r0 = i % 5 ? 470 : 455;
        g.lineWidth = i % 5 ? 3 : 6;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
        g.lineTo(c + Math.cos(a) * 492, c + Math.sin(a) * 492);
        g.stroke();
      }
      // sun mandala: two rings of lotus petals + rays around a sun disc
      g.save();
      g.translate(c, c);
      g.strokeStyle = "#e6c479";
      g.fillStyle = "rgba(230,196,121,0.12)";
      g.lineWidth = 4;
      for (let ring = 0; ring < 2; ring++) {
        const n = ring ? 16 : 12, r = ring ? 190 : 130, len = ring ? 70 : 60;
        for (let i = 0; i < n; i++) {
          g.save();
          g.rotate((i / n) * Math.PI * 2 + ring * 0.2);
          g.beginPath();
          g.moveTo(0, -r + len);
          g.bezierCurveTo(-28, -r + len * 0.5, -18, -r, 0, -r - 8);
          g.bezierCurveTo(18, -r, 28, -r + len * 0.5, 0, -r + len);
          g.fill();
          g.stroke();
          g.restore();
        }
      }
      for (let i = 0; i < 48; i++) {
        g.save();
        g.rotate((i / 48) * Math.PI * 2);
        g.beginPath();
        g.moveTo(0, -222);
        g.lineTo(0, -i % 2 ? -250 : -262);
        g.stroke();
        g.restore();
      }
      const sun = g.createRadialGradient(0, 0, 0, 0, 0, 70);
      sun.addColorStop(0, "#f7dc95");
      sun.addColorStop(1, "#b98a35");
      g.fillStyle = sun;
      g.beginPath();
      g.arc(0, 0, 66, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.fillStyle = "#f1dfb1";
      g.textAlign = "center";
      g.font = "600 64px 'DejaVu Serif', serif";
      g.fillText("SURYA", c, 300);
      g.font = "500 26px 'DejaVu Sans', sans-serif";
      g.fillText("A U T O M A T I C", c, 790);
    });
    const perlage = tex(512, 512, (g) => {
      g.fillStyle = "#b8944f";
      g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 22) {
        for (let x = (y / 22) % 2 ? 11 : 0; x < 512; x += 22) {
          const gr = g.createRadialGradient(x, y, 0, x, y, 16);
          gr.addColorStop(0, "rgba(255,240,200,0.55)");
          gr.addColorStop(0.6, "rgba(120,90,40,0.25)");
          gr.addColorStop(1, "rgba(255,240,200,0)");
          g.fillStyle = gr;
          g.beginPath();
          g.arc(x, y, 16, 0, Math.PI * 2);
          g.fill();
        }
      }
    });
    const stripes = tex(512, 512, (g) => {  // Côtes de Genève on the bridges
      for (let x = 0; x < 512; x += 32) {
        const gr = g.createLinearGradient(x, 0, x + 32, 0);
        gr.addColorStop(0, "#9aa1a9");
        gr.addColorStop(0.5, "#eef1f4");
        gr.addColorStop(1, "#9aa1a9");
        g.fillStyle = gr;
        g.fillRect(x, 0, 32, 512);
      }
    });
    const glow = tex(128, 128, (g) => {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.3, "rgba(255,240,210,0.4)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    });
    return { dial, perlage, stripes, glow };
  }, []);

// Toothed gear with spoke windows.
const gearGeo = (teeth: number, r: number, depth: number) => {
  const s = new THREE.Shape();
  const ri = r * 0.88, step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[ri, a], [r, a + step * 0.2], [r, a + step * 0.5], [ri, a + step * 0.7]];
    pts.forEach(([rr, aa], k) => (i === 0 && k === 0 ? s.moveTo(rr * Math.cos(aa), rr * Math.sin(aa)) : s.lineTo(rr * Math.cos(aa), rr * Math.sin(aa))));
  }
  s.closePath();
  const hub = new THREE.Path();
  hub.absarc(0, 0, r * 0.12, 0, Math.PI * 2, true);
  s.holes.push(hub);
  const n = 5;
  for (let i = 0; i < n; i++) {  // spoke windows
    const a0 = (i / n) * Math.PI * 2 + 0.18, a1 = ((i + 1) / n) * Math.PI * 2 - 0.18;
    const w = new THREE.Path();
    w.absarc(0, 0, r * 0.7, a0, a1, false);
    w.absarc(0, 0, r * 0.28, a1, a0, true);
    w.closePath();
    s.holes.push(w);
  }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 24 });
};

const handGeo = (len: number, w: number, tail = 0.12) => {
  const s = new THREE.Shape();
  s.moveTo(0, -tail);
  s.lineTo(w, 0.08);
  s.lineTo(0, len);
  s.lineTo(-w, 0.08);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
};

// A part flies in from an exploded offset, easing into place; `spin` adds a settling rotation around z.
const Fly: React.FC<{ f: number; at: number; dur?: number; from: [number, number, number]; spin?: number; children: React.ReactNode }> = ({ f, at, dur = 40, from, spin = 0, children }) => {
  const t = interpolate(f, [at - dur, at], [0, 1], { ...cl, easing: OUT });
  if (f < at - dur) return null;
  return (
    <group position={[from[0] * (1 - t), from[1] * (1 - t), from[2] * (1 - t)]} rotation={[0, 0, spin * (1 - t)]}>
      {children}
    </group>
  );
};

const Gear: React.FC<{ f: number; x: number; y: number; z: number; r: number; teeth: number; speed: number; mat: Mat; at: number }> = ({ f, x, y, z, r, teeth, speed, mat, at }) => {
  const geo = useMemo(() => gearGeo(teeth, r, 0.04), [teeth, r]);
  const run = Math.max(0, f - at);
  return (
    <Fly f={f} at={at} dur={28} from={[0, 0, 2.2]} spin={2}>
      <group position={[x, y, z]}>
        <mesh geometry={geo} rotation={[0, 0, run * speed]}>
          <Mt m={mat} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[r * 0.1, r * 0.1, 0.03, 16]} />
          <Mt m="ruby" />
        </mesh>
      </group>
    </Fly>
  );
};

const Balance: React.FC<{ f: number }> = ({ f }) => {
  const spiral = useMemo(() => {
    const pts = Array.from({ length: 120 }, (_, i) => {
      const a = (i / 120) * Math.PI * 8, r = 0.04 + (i / 120) * 0.2;
      return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.004, 4, false);
  }, []);
  const osc = Math.max(0, f - T.balance) > 0 ? Math.sin((f / 30) * Math.PI * 2 * 3) * 3.2 : 0; // 3 Hz, ~ +/-180°
  return (
    <Fly f={f} at={T.balance} dur={28} from={[0, 0, 2]} spin={1}>
      <group position={[-0.72, -0.62, 0.3]}>
        <group rotation={[0, 0, osc]}>
          <mesh>
            <torusGeometry args={[0.34, 0.03, 12, 48]} />
            <Mt m="gold" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI]}>
              <boxGeometry args={[0.68, 0.025, 0.02]} />
              <Mt m="gold" />
            </mesh>
          ))}
        </group>
        <mesh geometry={spiral} position={[0, 0, 0.03]} rotation={[0, 0, osc * 0.3]}>
          <Mt m="steel" />
        </mesh>
      </group>
    </Fly>
  );
};

// Leather strap: box segments laid along a curve that wraps down behind the wrist, with cream stitching.
const Strap: React.FC<{ side: 1 | -1 }> = ({ side }) => {
  const segs = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([[0, 2.0, 0.2], [0, 2.8, 0.05], [0, 3.5, -0.4], [0, 3.95, -1.2], [0, 4.1, -2.1]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const n = 16;
    return Array.from({ length: n }, (_, i) => {
      const a = curve.getPoint(i / n), b = curve.getPoint((i + 1) / n);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const ang = Math.atan2(b.z - a.z, b.y - a.y);  // tilt around x
      return { y: mid.y, z: mid.z, len: len * 1.04, ang, w: 1.36 - (i / n) * 0.18 };
    });
  }, []);
  return (
    <group scale={[1, side, 1]}>
      {segs.map((g, i) => (
        <group key={i} position={[0, g.y, g.z]} rotation={[g.ang, 0, 0]}>
          <mesh>
            <boxGeometry args={[g.w, g.len, 0.14]} />
            <Mt m="leather" />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * (g.w / 2 - 0.09), 0, 0.075]}>
              <boxGeometry args={[0.025, g.len * 0.55, 0.01]} />
              <meshStandardMaterial color="#eadcbf" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environmentIntensity = 0.9;
  }, [gl, scene]);
  return null;
};

const Rig: React.FC<{ f: number }> = ({ f }) => {
  const { camera } = useThree();
  // closer during the movement build, pulls back for the case/dial, orbits for the hero
  const dist = interpolate(f, [0, T.plate, T.bridges + 20, T.caseRing, T.straps, T.hero, WATCH_LEN], [18, 14.5, 13, 15, 17.5, 19, 17], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const orbit = interpolate(f, [0, WATCH_LEN], [-0.5, 0.55]) + (f > T.hero ? Math.sin((f - T.hero) / 45) * 0.15 : 0);
  const elev = interpolate(f, [0, T.hero, WATCH_LEN], [0.75, 0.55, 0.35], cl);
  camera.position.set(Math.sin(orbit) * dist * Math.cos(elev), Math.sin(elev) * dist * 0.9, Math.cos(orbit) * dist * Math.cos(elev));
  camera.lookAt(0, f > T.straps ? 0.1 : 0, 0);
  return null;
};

const Watch: React.FC = () => {
  const f = useCurrentFrame();
  const tx = useTex();
  const gears = [
    { x: 0.35, y: 0.45, r: 0.42, teeth: 60, speed: 0.02, mat: "gold" as Mat, at: T.gears },
    { x: -0.25, y: 0.62, r: 0.22, teeth: 32, speed: -0.04, mat: "gold" as Mat, at: T.gears + 18 },
    { x: 0.62, y: -0.28, r: 0.3, teeth: 44, speed: -0.03, mat: "brass" as Mat, at: T.gears + 36 },
    { x: 0.05, y: -0.3, r: 0.18, teeth: 26, speed: 0.06, mat: "gold" as Mat, at: T.gears + 54 },
    { x: -0.62, y: 0.12, r: 0.16, teeth: 24, speed: 0.08, mat: "brass" as Mat, at: T.gears + 72 },
  ];
  const sec = (f / 30) * 6; // degrees; the seconds hand sweeps once assembled
  const hands = { h: -(10 + 10 / 60) * 30, m: -10 * 6 - Math.max(0, f - T.hMin) * 0.02, s: -(f > T.hSec ? sec : 0) };
  const d = (x: number) => (x * Math.PI) / 180;
  const glint = interpolate(f, [T.crystal, T.crystal + 30], [-2.5, 2.5], cl);
  const tilt = interpolate(f, [0, T.hero, WATCH_LEN], [-0.95, -0.75, -0.55], cl);
  return (
    <group rotation={[tilt, 0, 0]}>
      {/* case back (exhibition window rim) */}
      <Fly f={f} at={T.back} dur={45} from={[0, 0, -3]} spin={1.5}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
          <cylinderGeometry args={[1.72, 1.72, 0.12, 96]} />
          <Mt m="rose" />
        </mesh>
        {[1.2, 1.45, 1.6].map((r) => (
          <mesh key={r} position={[0, 0, -0.01]}>
            <torusGeometry args={[r, 0.012, 8, 96]} />
            <Mt m="gold" />
          </mesh>
        ))}
      </Fly>
      {/* movement */}
      <Fly f={f} at={T.plate} dur={40} from={[0, 0, 2.5]} spin={-1}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
          <cylinderGeometry args={[1.5, 1.5, 0.14, 96]} />
          <meshStandardMaterial map={tx.perlage} metalness={1} roughness={0.35} color="#e0c080" />
        </mesh>
      </Fly>
      {gears.map((g, i) => <Gear key={i} f={f} {...g} z={0.19} />)}
      <Balance f={f} />
      {/* bridges with blued screws */}
      {[{ x: 0.3, y: 0.2, w: 1.5, h: 0.32, r: 0.5 }, { x: -0.1, y: -0.75, w: 1.1, h: 0.26, r: -0.35 }].map((b, i) => (
        <Fly key={i} f={f} at={T.bridges + i * 12} dur={26} from={[i ? -2 : 2, 0, 1.5]}>
          <group position={[b.x, b.y, 0.32]} rotation={[0, 0, b.r]}>
            <mesh>
              <boxGeometry args={[b.w, b.h, 0.05]} />
              <meshStandardMaterial map={tx.stripes} metalness={1} roughness={0.2} />
            </mesh>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * (b.w / 2 - 0.12), 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.03, 16]} />
                <Mt m="blued" />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.035]}>
              <sphereGeometry args={[0.04, 12, 10]} />
              <Mt m="ruby" />
            </mesh>
          </group>
        </Fly>
      ))}
      {/* automatic rotor: half disc sweeping over the movement */}
      <Fly f={f} at={T.rotor} dur={30} from={[0, 0, 1.8]}>
        <group position={[0, 0, 0.4]} rotation={[0, 0, f > T.rotor ? Math.sin((f - T.rotor) / 25) * 1.4 : 0]}>
          <mesh>
            <ringGeometry args={[0.18, 1.35, 64, 1, 0, Math.PI]} />
            <meshStandardMaterial color="#d8ab4e" metalness={1} roughness={0.2} side={THREE.DoubleSide} transparent opacity={f < T.caseRing ? 1 : 0} />
          </mesh>
        </group>
      </Fly>
      {/* case ring + lugs */}
      <Fly f={f} at={T.caseRing} dur={40} from={[0, 0, 3]} spin={0.8}>
        <mesh position={[0, 0, 0.3]}>
          <torusGeometry args={[1.66, 0.2, 32, 128]} />
          <Mt m="rose" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
          <cylinderGeometry args={[1.84, 1.84, 0.34, 128, 1, true]} />
          <meshStandardMaterial {...M.rose} side={THREE.DoubleSide} />
        </mesh>
        {[[0.72, 1], [-0.72, 1], [0.72, -1], [-0.72, -1]].map(([x, s], i) => (
          <mesh key={i} position={[x, s * 1.92, 0.24]} rotation={[s * 0.25, 0, 0]}>
            <boxGeometry args={[0.22, 0.55, 0.24]} />
            <Mt m="rose" />
          </mesh>
        ))}
      </Fly>
      {/* dial */}
      <Fly f={f} at={T.dial} dur={40} from={[0, 0, 2.6]} spin={-1.2}>
        <mesh position={[0, 0, 0.46]}>
          <circleGeometry args={[1.5, 96]} />
          <meshStandardMaterial map={tx.dial} metalness={0.55} roughness={0.35} />
        </mesh>
      </Fly>
      {/* applied gold indices */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2, big = i % 3 === 0;
        return (
          <Fly key={i} f={f} at={T.indices + i * 2} dur={20} from={[0, 0, 1.2]}>
            <mesh position={[Math.sin(a) * 1.18, Math.cos(a) * 1.18, 0.49]} rotation={[0, 0, -a]}>
              <boxGeometry args={[big ? 0.09 : 0.06, big ? 0.26 : 0.18, 0.04]} />
              <Mt m="gold" />
            </mesh>
          </Fly>
        );
      })}
      {/* hands */}
      <Fly f={f} at={T.hHour} dur={24} from={[0, 0, 1.5]} spin={2}>
        <mesh geometry={useMemo(() => handGeo(0.72, 0.075), [])} position={[0, 0, 0.53]} rotation={[0, 0, d(hands.h)]}><Mt m="gold" /></mesh>
      </Fly>
      <Fly f={f} at={T.hMin} dur={24} from={[0, 0, 1.5]} spin={-2}>
        <mesh geometry={useMemo(() => handGeo(1.1, 0.06), [])} position={[0, 0, 0.56]} rotation={[0, 0, d(hands.m)]}><Mt m="gold" /></mesh>
      </Fly>
      <Fly f={f} at={T.hSec} dur={20} from={[0, 0, 1.5]}>
        <group position={[0, 0, 0.6]} rotation={[0, 0, d(hands.s)]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.018, 1.25, 0.012]} />
            <meshStandardMaterial color="#c9302c" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.03, 20]} />
            <Mt m="gold" />
          </mesh>
        </group>
      </Fly>
      {/* crystal with a travelling glint */}
      <Fly f={f} at={T.crystal} dur={36} from={[0, 0, 2.4]}>
        <mesh position={[0, 0, 0.66]}>
          <circleGeometry args={[1.56, 96]} />
          <meshStandardMaterial color="#dfe8ff" metalness={0} roughness={0.02} transparent opacity={0.12} />
        </mesh>
        {f >= T.crystal && f < T.crystal + 34 && (
          <sprite position={[glint, glint * 0.4, 0.7]} scale={[1.6, 1.6, 1.6]}>
            <spriteMaterial map={tx.glow} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        )}
      </Fly>
      {/* bezel */}
      <Fly f={f} at={T.bezel} dur={26} from={[0, 0, 1.8]} spin={1}>
        <mesh position={[0, 0, 0.62]}>
          <torusGeometry args={[1.6, 0.08, 20, 128]} />
          <Mt m="rose" />
        </mesh>
      </Fly>
      {/* crown screws in */}
      <Fly f={f} at={T.crown} dur={30} from={[1.4, 0, 0]}>
        <group position={[1.98, 0, 0.3]} rotation={[0, 0, Math.PI / 2]}>
          <group rotation={[0, interpolate(f, [T.crown - 30, T.crown], [12, 0], cl), 0]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.22, 32]} />
              <Mt m="rose" />
            </mesh>
            {Array.from({ length: 20 }, (_, i) => (
              <mesh key={i} position={[Math.cos((i / 20) * Math.PI * 2) * 0.2, 0, Math.sin((i / 20) * Math.PI * 2) * 0.2]}>
                <boxGeometry args={[0.03, 0.2, 0.03]} />
                <Mt m="gold" />
              </mesh>
            ))}
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.06, 12, 10]} />
              <Mt m="ruby" />
            </mesh>
          </group>
        </group>
      </Fly>
      {/* straps */}
      <Fly f={f} at={T.straps} dur={36} from={[0, 3, 0]}><Strap side={1} /></Fly>
      <Fly f={f} at={T.straps + 8} dur={36} from={[0, -3, 0]}><Strap side={-1} /></Fly>
    </group>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const key = interpolate(f, [0, 40], [0, 1], cl);
  return (
    <>
      <Env />
      <Rig f={f} />
      <ambientLight intensity={0.08} />
      <spotLight position={[4, 8, 6]} angle={0.5} penumbra={0.8} intensity={120 * key} color="#fff1dc" />
      <pointLight position={[-5, 2, 3]} intensity={25 * key} color="#9ec5ff" />
      <pointLight position={[0, -4, 4]} intensity={10} color="#ffcf9e" />
      <Watch />
    </>
  );
};

export const WatchAssembly: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const step = STEPS.filter(([at]) => f >= at).length - 1;
  const stepAt = step >= 0 ? STEPS[step][0] : 0;
  const stepA = interpolate(f, [stepAt, stepAt + 12, stepAt + 60, stepAt + 75], [0, 1, 1, 0], cl);
  const hero = interpolate(f, [T.hero + 10, T.hero + 40], [0, 1], cl);
  const intro = interpolate(f, [5, 25, 55, 70], [0, 1, 1, 0], cl);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1b1712 0%, #070606 70%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 5, 10], fov: 30, near: 0.1, far: 100 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <Scene />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, textAlign: "center", opacity: intro, fontFamily: SERIF, fontSize: 64, color: "#f1e2bf", letterSpacing: 6 }}>From scratch.</div>
      {step >= 0 && f < T.hero && (
        <div style={{ position: "absolute", bottom: 260, left: 0, right: 0, textAlign: "center", opacity: stepA }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#c9a560", letterSpacing: 10 }}>{String(step + 1).padStart(2, "0")}</div>
          <div style={{ marginTop: 8, fontFamily: SERIF, fontSize: 56, color: "#f4ead3", letterSpacing: 3 }}>{STEPS[step][1]}</div>
        </div>
      )}
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", opacity: hero }}>
        <div style={{ fontFamily: SERIF, fontSize: 110, color: "#f1dfb1", letterSpacing: 18 }}>SURYA</div>
        <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 500, fontSize: 30, color: "#c9a560", letterSpacing: 12 }}>AUTOMATIC · ROSE GOLD</div>
      </div>
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, textAlign: "center", opacity: interpolate(f, [T.hero + 40, T.hero + 70], [0, 1], cl), fontFamily: SANS, fontWeight: 500, fontSize: 30, color: "#a8a29e", letterSpacing: 4 }}>
        designed &amp; animated entirely in code
      </div>
      <Audio src={staticFile("audio/watch_score.wav")} volume={0.55} />
      {[T.back, T.plate, ...[0, 18, 36, 54, 72].map((k) => T.gears + k), T.balance, T.bridges, T.bridges + 12, T.rotor, T.caseRing, T.dial, T.hHour, T.hMin, T.hSec, T.crystal, T.bezel, T.crown, T.straps, T.straps + 8].map((at, i) => (
        <Sequence key={i} from={at - 2} durationInFrames={30}>
          <Audio src={staticFile("audio/watch_click.wav")} volume={0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
