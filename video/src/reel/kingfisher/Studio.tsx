import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildBird, poseBird } from "./bird";

// Turntable check of the model: props pick the view and the wing state.
const Scene: React.FC<{ f: number; view: string }> = ({ f, view }) => {
  const { camera, gl, scene } = useThree();
  const bird = useMemo(() => buildBird(), []);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
  }, [gl, scene]);
  const t = f / 30;
  const perched = view === "perch", glide = view.startsWith("glide");
  poseBird(bird, { phase: glide ? 0.25 : (t * 1.2) % 1, amp: glide ? 0 : 1, folded: perched ? 1 : 0, glide: glide ? 1 : 0, tailSpread: perched ? 0.1 : 0.5, feetDown: perched ? 1 : 0, headPitch: 0, headYaw: 0, billOpen: 0, fish: false, lid: false });
  const ang = view === "front" || view === "glidefront" ? 0.35 : view === "top" ? 0.3 : view === "side" || view === "perch" ? Math.PI / 2 : view === "glide" ? 0.001 : t * 0.6;
  const el = view === "top" ? 1.6 : view === "glide" ? 2.6 : view === "under" ? -0.8 : 0.35;
  const r = 2.3;
  camera.position.set(Math.sin(ang) * r, el, Math.cos(ang) * r);
  camera.lookAt(0, 0.12, 0.2);
  return (
    <>
      <directionalLight position={[2, 3, 2]} intensity={2.6} color="#fff1dc" />
      <directionalLight position={[-2, 1, -2]} intensity={1.2} color="#9bd7ff" />
      <ambientLight intensity={0.15} />
      <primitive object={bird.root} />
    </>
  );
};

export const KingfisherStudio: React.FC<{ view?: string }> = ({ view = "spin" }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #3a4652, #12161c 75%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 35, near: 0.05, far: 100 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <Scene f={f} view={view} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
