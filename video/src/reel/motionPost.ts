import { FPose } from "./Fumble";

// Post-passes that make captured dance read as performed rather than traced (research notes items 5 and 6):
//  - beatWarp: retime a capture so each movement accent (a fast move coming to a stop) lands exactly on the
//    nearest musical beat, with a two-frame hold on the hit.
//  - footLock: find the supporting foot every frame and slide the pelvis so that foot stays put on the floor,
//    instead of the whole body hovering in place while the legs skate.

type Track = { poses: FPose[] };
const LIMBS: (keyof FPose)[] = ["armL", "armR", "legL", "legR"];

/** Per-frame limb speed (deg/frame summed over shoulders, elbows, hips, knees). */
const speeds = (poses: FPose[]) =>
  poses.map((p, i) => {
    if (i === 0) return 0;
    const q = poses[i - 1];
    let s = 0;
    for (const k of LIMBS) {
      const a = p[k] as [number, number] | undefined, b = q[k] as [number, number] | undefined;
      if (a && b) s += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
    return s;
  });

/**
 * Returns a time map for one capture: render time (s) -> capture time (s). Hits are local speed minima that end a
 * fast move; each hit within `reach` of a beat is pinned to it. Capture start and end stay fixed so segment blends
 * line up. Between anchors time runs linearly (slightly faster or slower), so nothing jumps.
 */
export const beatWarp = (tr: Track, start: number, beats: number[], fps = 30, reach = 0.2, hold = 2 / 30) => {
  const sp = speeds(tr.poses);
  const n = sp.length, end = start + (n - 1) / fps;
  const hits: number[] = [];
  for (let i = 3; i < n - 2; i++) {
    const before = Math.max(...sp.slice(Math.max(1, i - 6), i));
    if (sp[i] <= sp[i - 1] && sp[i] <= sp[i + 1] && before > 12 && before > 2.5 * (sp[i] + 1)) hits.push(start + i / fps);
  }
  const anchors: [number, number][] = [[start, start]];
  for (const b of beats) {
    if (b <= start + 0.1 || b >= end - 0.1) continue;
    const h = hits.reduce((m, x) => (Math.abs(x - b) < Math.abs(m - b) ? x : m), Infinity);
    if (Math.abs(h - b) > reach) continue;
    const last = anchors[anchors.length - 1];
    if (b <= last[0] + 0.05 || h <= last[1] + 0.03) continue; // keep both axes strictly increasing
    anchors.push([b, h], [b + hold, h + 0.001]);
  }
  if (end > anchors[anchors.length - 1][0] + 0.05) anchors.push([end, end]);
  return (t: number) => {
    if (t <= anchors[0][0]) return t;
    for (let i = 0; i < anchors.length - 1; i++) {
      const [t0, s0] = anchors[i], [t1, s1] = anchors[i + 1];
      if (t <= t1) return s0 + ((t - t0) / (t1 - t0)) * (s1 - s0);
    }
    return t;
  };
};

const R = (d: number) => (d * Math.PI) / 180;
/** Foot position in rig units relative to the stage anchor (matches Fumble's Leg/hip geometry). */
const foot = (p: FPose, side: -1 | 1, hero: boolean): [number, number] => {
  const a = (side < 0 ? p.legL : p.legR) ?? (side < 0 ? [6, 0] : [-6, 0]);
  const ls = (side < 0 ? p.legLs : p.legRs) ?? [1, 1];
  const hx = (hero ? 28 : 34) * side, ht = R(p.hipTilt ?? 0);
  const x = (p.hipX ?? 0) + hx * Math.cos(ht) - 200 * ls[0] * Math.sin(R(a[0])) - 195 * ls[1] * Math.sin(R(a[0] + a[1]));
  const y = hx * Math.sin(ht) + 200 * ls[0] * Math.cos(R(a[0])) + 195 * ls[1] * Math.cos(R(a[0] + a[1]));
  return [x, y];
};

/**
 * Precompute a pelvis offset (rig units) over [t0, t1] that keeps the supporting foot from sliding. The supporting
 * foot is the lower one; when both are level the last one keeps support (double support), so a weight shift moves
 * the body over the planted foot. The offset drifts back to centre slowly (so the dancer never wanders off the mark)
 * and resets on camera cuts.
 */
export const footLock = (pose: (t: number) => FPose, t0: number, t1: number, opts: { hero?: boolean; cuts?: number[]; decay?: number; limit?: number } = {}) => {
  const { hero = false, cuts = [], decay = 0.97, limit = 70 } = opts;
  const fps = 30, n = Math.ceil((t1 - t0) * fps) + 1;
  const out = new Float32Array(n);
  let corr = 0, stance: -1 | 1 = -1, prev: [number, number] | null = null, prevStance: -1 | 1 = -1;
  const cutFrames = new Set(cuts.map((c) => Math.round((c - t0) * fps)));
  for (let i = 0; i < n; i++) {
    const p = pose(t0 + i / fps);
    const L = foot(p, -1, hero), Rt = foot(p, 1, hero);
    if (Math.abs(L[1] - Rt[1]) > 10) stance = L[1] > Rt[1] ? -1 : 1; // larger y = lower on screen = on the floor
    const cur = stance < 0 ? L : Rt;
    const step = prev ? cur[0] - prev[0] : 0;
    if (cutFrames.has(i)) corr = 0;
    else if (prev && stance === prevStance && Math.abs(step) < 22) corr -= step; // bigger jumps are capture cuts, not steps
    corr = Math.max(-limit, Math.min(limit, corr * decay));
    out[i] = corr;
    prev = cur;
    prevStance = stance;
  }
  return (t: number) => {
    const x = (t - t0) * fps;
    if (x <= 0) return out[0];
    if (x >= n - 1) return out[n - 1];
    const i = Math.floor(x), u = x - i;
    return out[i] * (1 - u) + out[i + 1] * u;
  };
};
