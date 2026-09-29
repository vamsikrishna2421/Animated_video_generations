import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

// 3D test: a glowing neural network in depth. Emissive nodes with additive halos, signals travelling
// along edges, floating spark particles and a slow camera orbit. Rendered with --gl=swangle (no GPU).
const LAYERS = [4, 6, 6, 3];

const Halo: React.FC<{ pos: THREE.Vector3; color: string; size: number; opacity: number }> = ({ pos, color, size, opacity }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <sprite position={pos} scale={[size, size, size]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
};

const Net: React.FC = () => {
  const f = useCurrentFrame();
  const nodes = useMemo(
    () => LAYERS.flatMap((n, li) => Array.from({ length: n }, (_, j) => ({ li, p: new THREE.Vector3((li - 1.5) * 2.4, (j - (n - 1) / 2) * 1.05, (random(`z${li}${j}`) - 0.5) * 1.6) }))),
    []
  );
  const edges = useMemo(() => {
    const out: [THREE.Vector3, THREE.Vector3, number][] = [];
    nodes.forEach((a) => nodes.forEach((b) => { if (b.li === a.li + 1) out.push([a.p, b.p, random(`e${a.p.x}${a.p.y}${b.p.y}`)]); }));
    return out;
  }, [nodes]);
  const sparks = useMemo(() => Array.from({ length: 160 }, (_, i) => new THREE.Vector3((random(`sx${i}`) - 0.5) * 12, (random(`sy${i}`) - 0.5) * 7, (random(`sz${i}`) - 0.5) * 6)), []);
  const t = f / 30;
  return (
    <group rotation={[0.12, Math.sin(t * 0.35) * 0.45, 0]}>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 4]} intensity={40} color="#a78bfa" />
      {edges.map(([a, b, r], k) => {
        const pts = [a, b];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        return (
          <line key={k}>
            <primitive object={geo} attach="geometry" />
            <lineBasicMaterial color="#38bdf8" transparent opacity={0.12 + r * 0.18} />
          </line>
        );
      })}
      {edges.filter((_, k) => k % 3 === 0).map(([a, b, r], k) => {
        const p = (t * 0.6 + r) % 1;
        const pos = a.clone().lerp(b, p);
        return <Halo key={`s${k}`} pos={pos} color="#fbbf24" size={0.35} opacity={0.9} />;
      })}
      {nodes.map((n, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 2.2 + i);
        const col = n.li === 0 ? "#22d3ee" : n.li === LAYERS.length - 1 ? "#f43f5e" : "#a78bfa";
        return (
          <group key={i} position={n.p}>
            <mesh>
              <sphereGeometry args={[0.2, 32, 32]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.4 * pulse} roughness={0.3} />
            </mesh>
            <Halo pos={new THREE.Vector3(0, 0, 0)} color={col} size={1.3} opacity={0.55 * pulse} />
          </group>
        );
      })}
      {sparks.map((s, i) => {
        const y = ((s.y + 3.5 + t * (0.2 + random(`sv${i}`) * 0.4)) % 7) - 3.5;
        return <Halo key={`p${i}`} pos={new THREE.Vector3(s.x, y, s.z)} color={i % 3 ? "#93c5fd" : "#fde68a"} size={0.12} opacity={0.7} />;
      })}
    </group>
  );
};

export const Scene3DTest: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #1e1b4b 0%, #070a18 75%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 9], fov: 50 }}>
        <Net />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
