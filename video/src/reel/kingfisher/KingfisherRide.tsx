import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useMemo } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Bird, BirdPose, buildBird, poseBird } from "./bird";
import { IMPACT, PERCH, World, buildWorld, updateSplash, updateWorld } from "./world";

// "Blue lightning": a 36 s cinematic ride with a kingfisher that is built entirely from code.
export const KF_FPS = 30;
export const KF_LEN = 36 * KF_FPS;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Frame = {
  pos: THREE.Vector3; dir: THREE.Vector3; roll: number; pitch: number; pose: BirdPose; visible?: boolean;
  cam: THREE.Vector3; look: THREE.Vector3; fov: number; splashT?: number;
};
const basePose = (o: Partial<BirdPose> = {}): BirdPose => ({ phase: 0, amp: 1, folded: 0, glide: 0, tailSpread: 0.4, feetDown: 0, headPitch: 0, headYaw: 0, billOpen: 0, fish: false, lid: false, ...o });
const perchPose = (o: Partial<BirdPose> = {}) => basePose({ folded: 1, amp: 0, tailSpread: 0.08, feetDown: 1, ...o });
const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);

// bird faces -Z (out over the river, toward the sun) while perched
const PERCH_DIR = V(0.15, 0, -1).normalize();
const PERCH_BODY = PERCH.clone().add(V(0, 0.21, 0));
const HEAD = (p: THREE.Vector3) => p.clone().add(V(0.02, 0.36, -0.42));

const launch = curve([PERCH_BODY, V(-0.6, 2.2, 3.5), V(3, 1.0, 0.2), V(9, 0.65, -3), V(16, 0.6, -5.5)]);
const chaseX0 = 16, chaseSpeed = 12;
const hover = V(IMPACT.x - 0.4, 5.6, IMPACT.z + 0.3);
const climb = curve([V(IMPACT.x - 9, 1.6, -3), V(IMPACT.x - 4, 3.2, -1.2), V(IMPACT.x - 1.4, 5.0, 0), hover]);
const emerge = curve([IMPACT.clone().add(V(0, -0.4, 0)), IMPACT.clone().add(V(-0.6, 1.4, 1.2)), V(1.2, 2.7, 3.6), V(-0.8, 3.6, 5.2), PERCH_BODY.clone().add(V(0.6, 1.1, 0.8))]);

const SHOTS: { t0: number; t1: number; at: (lt: number, d: number, T: number) => Frame }[] = [
  // 1. macro: the perched bird's head, slow push-in, sun on its face
  { t0: 0, t1: 2.5, at: (lt, d) => {
    const k = lt / d;
    const head = HEAD(PERCH_BODY);
    return { pos: PERCH_BODY, dir: PERCH_DIR, roll: 0, pitch: 0.42, pose: perchPose({ headYaw: lerp(0.35, -0.05, ease(k * 1.4)), headPitch: lt > 1.6 ? 0.12 : 0 }),
      cam: head.clone().add(V(lerp(1.15, 0.95, k), lerp(0.18, 0.12, k), lerp(-1.25, -0.95, k))), look: head.clone().add(V(0, -0.02, -0.05)), fov: 30 };
  } },
  // 2. wide: sunrise over the river, the bird a small blue jewel on its branch
  { t0: 2.5, t1: 5.5, at: (lt, d) => {
    const k = lt / d;
    return { pos: PERCH_BODY, dir: PERCH_DIR, roll: 0, pitch: 0.42, pose: perchPose({ headPitch: 0.2, headYaw: Math.sin(lt * 2) * 0.1 }),
      cam: V(lerp(-15, -12.5, k), lerp(1.7, 2.1, k), lerp(-6.5, -5.2, k)), look: V(-0.5, 2.7, 3.5), fov: 44 };
  } },
  // 3. launch: drops off the branch, wings open, swoops down to the water
  { t0: 5.5, t1: 8.5, at: (lt, d) => {
    const k = ease(lt / d * 0.98 + 0.02);
    const pos = launch.getPoint(k), dir = launch.getTangent(k);
    const unfold = clamp01(1 - lt / 0.45);
    return { pos, dir, roll: -0.35 * Math.sin(k * Math.PI), pitch: 0, pose: basePose({ phase: (lt * 2.6) % 1, folded: unfold, feetDown: unfold, tailSpread: 0.6 }),
      cam: pos.clone().add(V(-1.8 - k * 1.5, 0.5, -3.6 + k * 0.6)), look: pos.clone().add(dir.clone().multiplyScalar(0.8)), fov: 40 };
  } },
  // 4. chase: skimming the water past the reeds, camera tight behind
  { t0: 8.5, t1: 13.5, at: (lt) => {
    const x = chaseX0 + lt * chaseSpeed;
    const z = -6.2 + Math.sin(lt * 0.9) * 1.6;
    const y = 0.62 + Math.sin(lt * 2.3) * 0.08;
    const dz = Math.cos(lt * 0.9) * 1.6 * 0.9 / chaseSpeed;
    const dir = V(1, 0, dz).normalize();
    const pos = V(x, y, z);
    const shake = V(Math.sin(lt * 13) * 0.02, Math.sin(lt * 17) * 0.02, 0);
    return { pos, dir, roll: -dz * 6, pitch: 0, pose: basePose({ phase: (lt * 3.2) % 1, tailSpread: 0.35 }),
      cam: pos.clone().add(V(-3.4, 0.45, 1.5)).add(shake), look: pos.clone().add(V(2.2, 0.1, -0.3)), fov: 48 };
  } },
  // 5. slow-motion orbit: every feather on show
  { t0: 13.5, t1: 17, at: (lt, d) => {
    const k = lt / d;
    const pos = V(chaseX0 + 5 * chaseSpeed + lt * 2.5, 1.1, -5.5);
    const ang = lerp(2.5, 1.05, ease(k));
    return { pos, dir: V(1, 0.04, 0), roll: 0.12, pitch: 0, pose: basePose({ phase: (lt * 0.95) % 1, tailSpread: 0.55 }),
      cam: pos.clone().add(V(Math.cos(ang) * 3.7, lerp(1.3, 0.45, ease(k)), Math.sin(ang) * 3.7)), look: pos.clone().add(V(0.15, 0.08, 0)), fov: 32 };
  } },
  // 6. climb and hover against the sun, head locked on the water
  { t0: 17, t1: 19.5, at: (lt, d) => {
    const k = clamp01(lt / (d * 0.62));
    const pos = k < 1 ? climb.getPoint(ease(k)) : hover.clone().add(V(0, Math.sin(lt * 9) * 0.03, 0));
    const dir = k < 1 ? climb.getTangent(ease(k)) : V(0.3, 0, -1).normalize();
    const hovering = clamp01((lt - d * 0.55) / 0.3);
    return { pos, dir, roll: 0, pitch: 0.75 * hovering, pose: basePose({ phase: (lt * (2.6 + hovering * 1.6)) % 1, tailSpread: 0.4 + hovering * 0.5, headPitch: 0.75 * hovering }),
      cam: IMPACT.clone().add(V(-14, 1.0, 3.5)), look: pos.clone().add(V(1.5, -1.2, 0)), fov: 34 };
  } },
  // 7. the dive: wings fold, head first, the third eyelid closes just before impact
  { t0: 19.5, t1: 22, at: (lt, d) => {
    const k = clamp01(lt / d);
    const fall = Math.pow(k, 1.8);
    const pos = hover.clone().lerp(IMPACT.clone().add(V(0, 0.1, 0)), fall);
    const dir = V(0.25, -1, 0).normalize();
    const tuck = clamp01(lt / 0.5);
    const camY = Math.max(0.45, pos.y + 0.2);
    return { pos, dir, roll: 0, pitch: 0, pose: basePose({ phase: 0.3, amp: 1 - tuck, folded: tuck, glide: tuck, tailSpread: 0.1, lid: k > 0.86 }),
      cam: V(pos.x - 0.6, Math.max(0.5, pos.y + 0.4), pos.z + 3.4), look: pos.clone().lerp(IMPACT, 0.2), fov: 40 };
  } },
  // 8. impact, in slow motion at water level
  { t0: 22, t1: 24.5, at: (lt) => ({
    pos: IMPACT.clone().add(V(0, -2, 0)), dir: V(0, -1, 0), roll: 0, pitch: 0, pose: basePose({ folded: 1 }), visible: false,
    cam: IMPACT.clone().add(V(3.4 - lt * 0.3, 0.32, 3.2 - lt * 0.2)), look: IMPACT.clone().add(V(0, 0.9, 0)), fov: 40, splashT: lt * 0.42,
  }) },
  // 9. it bursts out with a fish and flies straight past the camera
  { t0: 24.5, t1: 28, at: (lt, d) => {
    const k = ease(clamp01(lt / d));
    const pos = emerge.getPoint(k), dir = emerge.getTangent(k);
    const open = clamp01(lt / 0.35);
    return { pos, dir, roll: 0.2 * Math.sin(k * 3), pitch: 0, pose: basePose({ phase: (lt * 3) % 1, folded: 1 - open, fish: true, fishWiggle: lt, tailSpread: 0.6 }),
      cam: V(5.6, 1.5, 7.6), look: pos.clone().lerp(V(0.75, 1.6, 3.2), 0.35), fov: 46, splashT: 1.05 + lt * 0.6 };
  } },
  // 10-11. lands on the branch with breakfast; hero shot, backlit by the low sun, then the end card
  { t0: 28, t1: 36, at: (lt) => {
    const land = clamp01(lt / 1.1);
    const from = PERCH_BODY.clone().add(V(0.6, 1.1, 0.8));
    const pos = from.lerp(PERCH_BODY, ease(land));
    const settle = clamp01((lt - 1.0) / 0.4);
    const head = HEAD(PERCH_BODY);
    return { pos, dir: PERCH_DIR.clone().lerp(V(-0.6, 0, -1), 1 - ease(land)).normalize(), roll: 0, pitch: lerp(-0.2, 0.42, settle),
      pose: basePose({ phase: (lt * 3.4) % 1, amp: 1 - settle, folded: settle, feetDown: clamp01(lt / 0.6), tailSpread: lerp(0.8, 0.08, settle), fish: true, fishWiggle: lt, headYaw: settle * Math.sin(lt * 1.5) * 0.25 }),
      cam: PERCH_BODY.clone().add(V(-3.3, lerp(0.75, 0.45, ease(lt / 8)), lerp(-1.3, -0.2, ease(lt / 8)))), look: PERCH_BODY.clone().add(V(0, 0.22, -0.15)), fov: 36 };
  } },
];

const frameAt = (T: number): Frame => {
  const s = SHOTS.find((x) => T >= x.t0 && T < x.t1) ?? SHOTS[SHOTS.length - 1];
  return s.at(T - s.t0, s.t1 - s.t0, T);
};

const orient = (dir: THREE.Vector3, roll: number, pitch: number) => {
  const z = dir.clone().normalize();
  const x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), z);
  if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pitch));
  return q;
};

const Scene: React.FC<{ T: number }> = ({ T }) => {
  const { camera, gl, scene } = useThree();
  const { bird, world } = useMemo(() => ({ bird: buildBird(), world: buildWorld(5, 90) }), []) as { bird: Bird; world: World };
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(world.envScene, 0.02).texture;
    scene.environmentIntensity = 0.7;
    scene.fog = new THREE.FogExp2("#d9b48c", 0.0055);
    gl.toneMappingExposure = 0.78;
  }, [gl, scene, world]);
  const F = frameAt(T);
  poseBird(bird, F.pose);
  bird.root.visible = F.visible !== false;
  bird.root.position.copy(F.pos);
  bird.root.quaternion.copy(orient(F.dir, F.roll, F.pitch));
  bird.root.scale.setScalar(1);
  updateWorld(world, T, F.cam.x);
  updateSplash(world.splash, F.splashT ?? -1);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(F.cam);
  cam.fov = F.fov;
  cam.near = 0.03;
  cam.far = 6000;
  cam.updateProjectionMatrix();
  cam.lookAt(F.look);
  return (
    <>
      <primitive object={world.root} />
      <primitive object={bird.root} />
    </>
  );
};

const Title: React.FC<{ T: number; a: number; b: number; children: React.ReactNode; top?: number; size?: number }> = ({ T, a, b, children, top = 1500, size = 44 }) => {
  const o = interpolate(T, [a, a + 0.5, b - 0.5, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(T, [a, a + 0.8], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, textAlign: "center", opacity: o, transform: `translateY(${y}px)`, color: "white", fontFamily: "Inter, 'DejaVu Sans', sans-serif", fontSize: size, fontWeight: 600, letterSpacing: 2, textShadow: "0 2px 18px rgba(0,0,0,0.6)" }}>
      {children}
    </div>
  );
};

export const KingfisherRide: React.FC<{ handle?: string; credit?: string }> = ({ handle = "@ai_maastaaru", credit = "" }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const T = f / KF_FPS;
  const cutFlash = [2.5, 5.5, 8.5, 13.5, 17, 19.5, 22, 24.5, 28].some((c) => T >= c && T < c + 0.08) ? 0.12 : 0;
  const endDim = interpolate(T, [32.6, 33.6], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(T, [0, 0.4], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: "contrast(1.08) saturate(1.12)" }}>
        <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.03, far: 6000 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <Scene T={T} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* lens: vignette + warm bloom at the top where the sun sits */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,90,0.10), transparent 35%, transparent 75%, rgba(0,0,0,0.25))", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "white", opacity: cutFlash, mixBlendMode: "overlay" }} />
      <Title T={T} a={2.8} b={5.4} top={300} size={92}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: 10 }}>KINGFISHER</div>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: 6, opacity: 0.85, marginTop: 10, fontStyle: "italic" }}>Alcedo atthis</div>
      </Title>
      <Title T={T} a={14.0} b={16.8}>No 3D model. No textures. Every feather is code.</Title>
      <Title T={T} a={20.0} b={22.0}>A third eyelid shuts before it hits the water.</Title>
      <Title T={T} a={29.6} b={32.8}>One dive. One fish. Breakfast.</Title>
      <AbsoluteFill style={{ background: "black", opacity: endDim }} />
      <Title T={T} a={33.4} b={36.5} top={760} size={50}>
        <div style={{ fontSize: 34, letterSpacing: 6, opacity: 0.85 }}>BUILT FROM SCRATCH IN CODE</div>
        <div style={{ marginTop: 26, fontSize: 64, fontWeight: 800, color: "#7dd3fc" }}>{handle}</div>
        {credit ? <div style={{ marginTop: 22, fontSize: 30, opacity: 0.8 }}>{credit}</div> : null}
      </Title>
      <AbsoluteFill style={{ background: "black", opacity: fadeIn }} />
      <Audio src={staticFile("kingfisher/score.wav")} />
    </AbsoluteFill>
  );
};
