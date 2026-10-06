import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { Water } from "three/examples/jsm/objects/Water.js";

// A golden-hour river, all procedural. Water level y = 0; the river runs along X between banks at z = ±RIVER.
export const RIVER = 11;
export const PERCH = new THREE.Vector3(-2, 3.05, 6.2); // where the bird sits on the branch
export const IMPACT = new THREE.Vector3(3.5, 0, 0.5); // where it hits the water

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const noise2 = (x: number, y: number) => {
  // smooth value noise
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a: number, b: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
};
const fbm = (x: number, y: number) => noise2(x, y) * 0.5 + noise2(x * 2.1, y * 2.1) * 0.25 + noise2(x * 4.3, y * 4.3) * 0.125 + noise2(x * 8.7, y * 8.7) * 0.0625;

// tileable water normal map from summed waves (canvas, no files)
const waterNormals = () => {
  const N = 256, c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!, img = g.createImageData(N, N);
  const H = (x: number, y: number) => {
    let h = 0;
    const waves = [[1, 0, 3, 0.0], [0.6, 0.8, 5, 1.3], [-0.4, 0.9, 7, 2.1], [0.9, -0.4, 11, 0.7], [0.2, 1, 17, 4.2], [-0.8, 0.6, 23, 3.3]];
    for (const [dx, dy, k, ph] of waves) h += Math.sin(((x * dx + y * dy) / N) * Math.PI * 2 * k + ph) / k;
    return h;
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1);
      const n = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize();
      const i = (y * N + x) * 4;
      img.data[i] = (n.x * 0.5 + 0.5) * 255;
      img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const softTex = (kind: "mist" | "glow" | "bark" | "leaf") => {
  const N = kind === "bark" ? 256 : 256, c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  if (kind === "glow") {
    const grd = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    grd.addColorStop(0, "rgba(255,240,210,1)");
    grd.addColorStop(0.15, "rgba(255,210,150,0.55)");
    grd.addColorStop(0.5, "rgba(255,170,90,0.12)");
    grd.addColorStop(1, "rgba(255,150,80,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, N, N);
  } else if (kind === "mist") {
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const edge = Math.sin((x / N) * Math.PI) * Math.sin((y / N) * Math.PI);
        const a = Math.max(0, fbm(x / 40, y / 40) - 0.35) * 1.6 * edge;
        const i = (y * N + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.min(255, a * 255);
      }
    g.putImageData(img, 0, 0);
  } else if (kind === "bark") {
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = fbm(x / 6, y / 60) * 0.7 + fbm(x / 2, y / 10) * 0.3;
        const i = (y * N + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  } else {
    g.fillStyle = "#fff";
    g.beginPath();
    g.ellipse(N / 2, N / 2, N * 0.22, N * 0.46, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const mergeGeos = (parts: THREE.BufferGeometry[]) => {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g0 of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      idx.push(off + i);
    }
    off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
};

export type World = {
  root: THREE.Group; sky: Sky; water: Water; sunDir: THREE.Vector3; sun: THREE.DirectionalLight; glow: THREE.Sprite;
  reeds: THREE.InstancedMesh[]; reedData: { x: number; z: number; h: number; ph: number; lean: number }[][];
  mist: THREE.Mesh[]; motes: THREE.Points; splash: Splash; envScene: THREE.Scene;
};

type Splash = { group: THREE.Group; drops: THREE.InstancedMesh; dropV: THREE.Vector3[]; crown: THREE.Mesh; rings: THREE.Mesh[]; foam: THREE.Mesh };

const buildSplash = (): Splash => {
  const group = new THREE.Group();
  group.position.copy(IMPACT);
  const waterMat = new THREE.MeshStandardMaterial({ color: "#f4fbff", roughness: 0.1, metalness: 0.2, emissive: "#ffe9c8", emissiveIntensity: 0.15, transparent: true, opacity: 0.7 });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), waterMat, 190);
  const r = rng(7), dropV: THREE.Vector3[] = [];
  for (let i = 0; i < 190; i++) {
    const a = r() * Math.PI * 2, up = 1.5 + Math.pow(r(), 2) * 4.2, out = 0.6 + r() * 2.2;
    dropV.push(new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out));
  }
  drops.frustumCulled = false;
  group.add(drops);
  const crownGeo = new THREE.CylinderGeometry(1, 0.55, 1, 64, 4, true);
  { const cp = crownGeo.attributes.position; for (let i = 0; i < cp.count; i++) { const a = Math.atan2(cp.getZ(i), cp.getX(i)), y = cp.getY(i); if (y > 0.2) cp.setY(i, y + (Math.sin(a * 13) * 0.5 + Math.sin(a * 29 + 1) * 0.35) * 0.35); } crownGeo.computeVertexNormals(); }
  const crown = new THREE.Mesh(crownGeo, new THREE.MeshPhysicalMaterial({ color: "#eef8ff", roughness: 0.08, transparent: true, opacity: 0.35, side: THREE.DoubleSide, clearcoat: 1, depthWrite: false }));
  group.add(crown);
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), new THREE.MeshBasicMaterial({ color: "#fff4e0", transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    group.add(m);
    rings.push(m);
  }
  const foam = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6, depthWrite: false, map: softTex("mist") }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.03;
  group.add(foam);
  group.visible = false;
  return { group, drops, dropV, crown, rings, foam };
};

// t = seconds since impact (negative = before). Gravity is scaled for the slow-motion look.
export const updateSplash = (s: Splash, t: number) => {
  s.group.visible = t > -0.05 && t < 6;
  if (!s.group.visible) return;
  const g = 9.8, m = new THREE.Matrix4(), q = new THREE.Quaternion();
  s.dropV.forEach((v, i) => {
    const tt = Math.max(0, t - (i % 5) * 0.03);
    const p = new THREE.Vector3(v.x * tt, v.y * tt - 0.5 * g * tt * tt, v.z * tt);
    const alive = tt > 0 && p.y > -0.05;
    const sc = alive ? 0.007 + (i % 7) * 0.002 : 0;
    m.compose(p, q, new THREE.Vector3(sc, sc * (1 + Math.min(3, Math.abs(v.y - g * tt) * 0.35)), sc));
    s.drops.setMatrixAt(i, m);
  });
  s.drops.instanceMatrix.needsUpdate = true;
  // crown sheet rises and collapses
  const ct = Math.max(0, t);
  const ch = Math.max(0, Math.sin(Math.min(1, ct / 0.9) * Math.PI)) * 2.2;
  s.crown.visible = ct < 0.9;
  s.crown.scale.set(0.22 + ct * 0.9, Math.max(0.01, ch * 0.45), 0.22 + ct * 0.9);
  s.crown.position.y = ch * 0.45 / 2;
  (s.crown.material as THREE.MeshPhysicalMaterial).opacity = 0.35 * (1 - ct / 0.9);
  s.rings.forEach((r, i) => {
    const rt = ct - i * 0.35;
    r.visible = rt > 0;
    const R = 0.4 + rt * 2.6;
    r.scale.set(R, R, R);
    (r.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 * (1 - rt / 3.5));
  });
  const fs = 0.5 + ct * 1.2;
  s.foam.scale.set(fs, fs, fs);
  (s.foam.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.65 * (1 - ct / 3));
};

export const buildWorld = (sunElev = 4, sunAz = 200): World => {
  const root = new THREE.Group();
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - sunElev), THREE.MathUtils.degToRad(sunAz));
  // sky
  const sky = new Sky();
  sky.scale.setScalar(4500);
  const u = sky.material.uniforms;
  u.turbidity.value = 10;
  u.rayleigh.value = 3;
  u.mieCoefficient.value = 0.006;
  u.mieDirectionalG.value = 0.86;
  u.sunPosition.value.copy(sunDir);
  root.add(sky);
  const envScene = new THREE.Scene();
  const sky2 = new Sky();
  sky2.scale.setScalar(4500);
  sky2.material.uniforms.turbidity.value = 10;
  sky2.material.uniforms.rayleigh.value = 3;
  sky2.material.uniforms.mieCoefficient.value = 0.006;
  sky2.material.uniforms.mieDirectionalG.value = 0.86;
  sky2.material.uniforms.sunPosition.value.copy(sunDir);
  envScene.add(sky2);
  // sun light + glow
  const sun = new THREE.DirectionalLight("#ffd2a0", 3.2);
  sun.position.copy(sunDir).multiplyScalar(100);
  root.add(sun);
  root.add(new THREE.HemisphereLight("#a9c8ff", "#3b2a1a", 0.55));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex("glow"), color: "#ffffff", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.setScalar(900);
  glow.position.copy(sunDir).multiplyScalar(3000);
  root.add(glow);
  // water
  const water = new Water(new THREE.PlaneGeometry(4000, 4000), {
    textureWidth: 1024, textureHeight: 1024, waterNormals: waterNormals(), sunDirection: sunDir.clone(), sunColor: 0xffd9a8,
    waterColor: 0x0c2a2c, distortionScale: 0.28, fog: true, alpha: 1,
  });
  water.rotation.x = -Math.PI / 2;
  (water.material as THREE.ShaderMaterial).uniforms.size.value = 7;
  root.add(water);
  // banks: displaced ground rising away from the river on both sides
  const bankMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  for (const side of [1, -1]) {
    const g = new THREE.PlaneGeometry(1600, 260, 400, 80);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, cols: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), zz = p.getZ(i) + 130; // 0 at river edge .. 260 inland
      const z = side * (RIVER + zz);
      const h = Math.min(1, zz / 6) * (1.2 + fbm(x / 30, zz / 30) * 3) + Math.max(0, zz - 40) * 0.05 * fbm(x / 80, 3);
      p.setXYZ(i, x, h - 0.6 + Math.max(0, 1 - zz / 1.5) * -0.4, z);
      const mud = Math.max(0, 1 - zz / 2.5);
      const c = new THREE.Color("#2f3a1c").lerp(new THREE.Color("#4a5a24"), fbm(x / 9, zz / 9)).lerp(new THREE.Color("#3a2c1e"), mud);
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    root.add(new THREE.Mesh(g, bankMat));
  }
  // reeds along both banks (instanced, swaying)
  const blade = new THREE.PlaneGeometry(0.11, 1, 1, 6);
  blade.translate(0, 0.5, 0);
  const bp = blade.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const y = bp.getY(i);
    bp.setX(i, bp.getX(i) * (1 - y * 0.85));
  }
  blade.computeVertexNormals();
  const reedMat = new THREE.MeshStandardMaterial({ color: "#6f7d34", roughness: 0.8, side: THREE.DoubleSide });
  const reeds: THREE.InstancedMesh[] = [], reedData: World["reedData"] = [];
  const r = rng(11);
  for (const side of [1, -1]) {
    const n = 6500, im = new THREE.InstancedMesh(blade, reedMat, n), data: World["reedData"][number] = [];
    const cl = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const cl0 = Math.floor(r() * 260), x = -140 + cl0 * 1.15 + (r() - 0.5) * 1.6, z = side * (RIVER - 0.8 + Math.pow(r(), 1.4) * 4.5), h = 1.4 + r() * 2.4;
      data.push({ x, z, h, ph: r() * 6.28, lean: (r() - 0.5) * 0.4 });
      im.setColorAt(i, cl.set("#56662a").lerp(new THREE.Color("#c2a95a"), Math.pow(r(), 1.5) * 0.85));
    }
    im.frustumCulled = false;
    root.add(im);
    reeds.push(im);
    reedData.push(data);
  }
  // tree lines: layered conifers + lumpy broadleaf crowns, set back so the haze turns them into soft silhouettes
  const treeMat = new THREE.MeshStandardMaterial({ color: "#22301f", roughness: 1, flatShading: false });
  const pine = (() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 4; k++) {
      const c = new THREE.ConeGeometry(1 - k * 0.2, 0.42, 14, 1, true);
      c.translate(0, 0.25 + k * 0.2, 0);
      parts.push(c);
    }
    const trunk = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6);
    trunk.translate(0, 0.12, 0);
    parts.push(trunk);
    return mergeGeos(parts);
  })();
  const crown = (() => {
    const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      v.multiplyScalar(0.8 + fbm(v.x * 2 + 5, v.y * 2 + v.z * 1.7) * 0.5);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  })();
  for (const [geo, count, sx, sy, near] of [[pine, 700, 5.5, 34, 32], [crown, 520, 7, 6, 48]] as [THREE.BufferGeometry, number, number, number, number][]) {
    const im = new THREE.InstancedMesh(geo, treeMat, count);
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = r() > 0.5 ? 1 : -1, x = -600 + r() * 1200, z = side * (RIVER + near + Math.pow(r(), 0.8) * 200);
      const k = 0.65 + r() * 0.8;
      const y = geo === crown ? 6 + sy * k : 0;
      m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.06, r() * 6, (r() - 0.5) * 0.06)), new THREE.Vector3(sx * k, sy * k, sx * k));
      im.setMatrixAt(i, m);
      im.setColorAt(i, new THREE.Color("#22301f").lerp(new THREE.Color("#3a4a26"), r() * 0.6));
    }
    im.frustumCulled = false;
    root.add(im);
  }
  // far hills on the horizon
  const hillG = new THREE.CylinderGeometry(1500, 1500, 1, 256, 1, true);
  const hp = hillG.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    if (hp.getY(i) > 0) {
      const a = Math.atan2(hp.getZ(i), hp.getX(i));
      hp.setY(i, 40 + fbm(a * 3 + 10, 1) * 160);
    } else hp.setY(i, -5);
  }
  hillG.computeVertexNormals();
  root.add(new THREE.Mesh(hillG, new THREE.MeshStandardMaterial({ color: "#3b4636", roughness: 1, side: THREE.BackSide })));
  // the branch over the river (perch), with twigs and leaves
  const barkTex = softTex("bark");
  barkTex.repeat.set(1, 6);
  const barkMat = new THREE.MeshStandardMaterial({ color: "#7a5f42", roughness: 0.95, bumpMap: barkTex, bumpScale: 3 });
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, 1.0, 16), new THREE.Vector3(-3.2, 2.2, 11.5), new THREE.Vector3(-2.4, 2.85, 8.2), new THREE.Vector3(-2, 2.86, 6.2), new THREE.Vector3(-1.6, 2.75, 3.6),
  ]);
  const branch = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 80, 0.13, 12), barkMat);
  const radius = (u: number) => 0.24 - u * 0.17;
  const bpos = branch.geometry.attributes.position;
  // taper the tube toward its tip
  const tubeN = 80, radial = 12;
  for (let i = 0; i <= tubeN; i++) {
    const c = branchCurve.getPoint(i / tubeN);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      const v = new THREE.Vector3(bpos.getX(k), bpos.getY(k), bpos.getZ(k)).sub(c);
      v.multiplyScalar(radius(i / tubeN) / 0.13);
      bpos.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
    }
  }
  branch.geometry.computeVertexNormals();
  root.add(branch);
  const leafMat = new THREE.MeshStandardMaterial({ color: "#4f6a2a", roughness: 0.7, alphaMap: softTex("leaf"), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.28), leafMat, 420);
  const lm = new THREE.Matrix4();
  for (let i = 0; i < 420; i++) {
    const u = 0.02 + r() * 0.36, c = branchCurve.getPoint(u);
    const p = c.add(new THREE.Vector3((r() - 0.5) * 2.6, 0.3 + r() * 2.2, (r() - 0.5) * 2.6));
    lm.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(1, 1, 1));
    leaves.setMatrixAt(i, lm);
    leaves.setColorAt(i, new THREE.Color("#3f5a22").lerp(new THREE.Color("#8a8a30"), r() * 0.5));
  }
  root.add(leaves);
  for (let i = 0; i < 9; i++) {
    const u = 0.06 + i * 0.045, a = branchCurve.getPoint(u);
    const b = a.clone().add(new THREE.Vector3((r() - 0.5) * 1.6, 0.4 + r() * 1.1, (r() - 0.5) * 1.6));
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 4, 0.035, 6), barkMat));
  }
  // mist banks drifting over the water
  const mistTex = softTex("mist");
  const mist: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 14), new THREE.MeshBasicMaterial({ map: mistTex, color: "#ffe0bf", transparent: true, opacity: 0.32, depthWrite: false, fog: true }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(-300 + i * 45, 0.35 + (i % 3) * 0.25, (i % 2 ? 1 : -1) * (3 + (i % 4) * 2.5));
    m.userData.x0 = m.position.x;
    root.add(m);
    mist.push(m);
  }
  // sunlit motes
  const mp: number[] = [];
  for (let i = 0; i < 1400; i++) mp.push(-80 + r() * 160, r() * 9, -12 + r() * 24);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute("position", new THREE.Float32BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: "#ffe7b8", size: 0.05, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(motes);
  const splash = buildSplash();
  root.add(splash.group);
  return { root, sky, water, sunDir, sun, glow, reeds, reedData, mist, motes, splash, envScene };
};

export const updateWorld = (w: World, t: number, camX: number) => {
  (w.water.material as THREE.ShaderMaterial).uniforms.time.value = t * 0.6;
  // reeds near the camera only need exact sway; all are cheap enough to update
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  w.reeds.forEach((im, k) => {
    w.reedData[k].forEach((d, i) => {
      const sway = Math.sin(t * 1.3 + d.ph + d.x * 0.05) * 0.06 + d.lean;
      e.set(sway, d.ph, sway * 0.5);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(d.x, -0.3, d.z), q, new THREE.Vector3(1, d.h, 1));
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  w.mist.forEach((ms, i) => {
    ms.position.x = ms.userData.x0 + t * (0.6 + (i % 3) * 0.25);
  });
  w.motes.position.set(camX * 0.0, Math.sin(t * 0.3) * 0.2, 0);
  w.motes.rotation.y = t * 0.01;
};
