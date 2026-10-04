import React, { createContext, useContext, useId } from "react";
import { interpolate } from "remotion";
import { Part } from "./Mascot";

// "Mr. Fumble": the page's own silent-comedy character (original design). A rubber-faced, stiff-backed gentleman
// in a mustard argyle vest and orange bow tie who acts entirely without words: eyebrows that move on their own,
// a stiff proud walk, the tiptoe sneak, double-takes, smug grins and little hums. The rig is a pose object, so
// any reel can drive him; the mannerism clips at the bottom are the reusable library.

export const FC_ = {
  skin: "#f2c9a5", skinDark: "#dba987", hair: "#3b2a20", brow: "#2e2018", shirt: "#a9cdea", shirtDark: "#86b1d4",
  vest: "#d9a520", vestDark: "#b8860b", argyle: "#2c3e6b", tie: "#ea5a0c", trousers: "#3d4250", trousersDark: "#2c303b",
  sock: "#f4f4f4", shoe: "#6b3e1f", shoeHi: "#8a5530", lip: "#a24a3a", mouth: "#5a1818", ink: "#231815",
};
/** Heroine: the page's original female lead (half-saree, long braid with jasmine, jhumkas). Same skeleton as Mr. Fumble. */
export const HC_: typeof FC_ = {
  skin: "#e3a882", skinDark: "#c98a64", hair: "#16100f", brow: "#1a1210", shirt: "#c2185b", shirtDark: "#9c1149",
  vest: "#0f8b8d", vestDark: "#0b6e70", argyle: "#e8b923", tie: "#e8b923", trousers: "#0f8b8d", trousersDark: "#0b6e70",
  sock: "#e8b923", shoe: "#8a3b12", shoeHi: "#b4552a", lip: "#c2185b", mouth: "#5a1020", ink: "#1a1210",
};
/** "Boss" outfit for Mr. Fumble: open orange jacket over a black tee, brown trousers, white sneakers. */
export const BC_: typeof FC_ = {
  ...FC_, shirt: "#d9822b", shirtDark: "#b0631a", vest: "#1c1c22", vestDark: "#1c1c22", argyle: "#1c1c22",
  trousers: "#5a3b2a", trousersDark: "#45291c", sock: "#ececec", shoe: "#f2f2f2", shoeHi: "#9aa3ad",
};
export type Look = "fumble" | "heroine" | "boss";
const Pal = createContext<{ C: typeof FC_; hero: boolean; braids?: boolean; boss?: boolean }>({ C: FC_, hero: false });
const BonesOnly = createContext(false);
/** A drawable part that disappears in skeleton-only mode. */
const P: React.FC<{ p?: number; children: React.ReactNode }> = (props) => (useContext(BonesOnly) ? null : <Part {...props} />);
const usePal = () => useContext(Pal);

export type Hand = "open" | "fist" | "point" | "thumb" | "paw";
export type FPose = {
  hipX?: number; hipY?: number; lean?: number; hipTilt?: number; bend?: number; twist?: number; shrug?: number; shrugL?: number; shrugR?: number; breath?: number; // pelvis tilt (deg), spine side-bend (deg), chest twist -1..1, shoulders up 0..1, chest breath 0..1 // crouch (px, + = down), torso lean (deg, + = toward screen-right)
  tilt?: number; neck?: number; turn?: number; bodyTurn?: number; // head tilt (deg), neck stretch (px), face turn (-1 left .. 1 right)
  browL?: number; browR?: number; knit?: number; // brow raise -1..1 each (screen-left / screen-right eye), frown 0..1
  lookX?: number; lookY?: number; lid?: number; squint?: number; eyeSize?: number; shut?: number; // shut: 0..1 per both (1 = closed happy arcs)
  winkL?: number; winkR?: number;
  mw?: number; mo?: number; smile?: number; skew?: number; pucker?: number; lipOut?: number; // mouth width/open/smile/skew/pucker/pout
  armL?: [number, number]; armR?: [number, number]; handL?: Hand; handR?: Hand; back?: boolean; wristL?: number; wristR?: number; // wrist bend vs forearm (deg) // arms behind the torso
  legL?: [number, number]; legR?: [number, number]; toeL?: number; toeR?: number; // thigh, knee (deg); toe lift (deg)
  armLs?: [number, number]; armRs?: [number, number]; legLs?: [number, number]; legRs?: [number, number]; spineS?: number; // 3D foreshortening: projected/true length per segment
  armLBack?: boolean; armRBack?: boolean; legLFront?: boolean; // depth order from 3D: arm behind the torso, which leg is nearer
  swayX?: number; // body sideways velocity for hair/cloth follow-through
  footL?: [number, number]; footR?: [number, number]; // captured foot: screen angle of heel->toe (deg, 0 = screen-right, y down), foreshortening 0..1
  fingL?: number[]; fingR?: number[]; palmL?: number; palmR?: number; // per-finger curl [index, middle, ring, pinky, thumb] 0..1; palm -1 back .. 1 front
  phoneL?: number; phoneR?: number; // a phone held in that hand (0..1 visibility)
  hairA?: number; hairB?: number; skirtS?: number; earS?: number; // simulated secondary motion: braid root / tip swing (deg), skirt hem swing (px), earring swing (deg)
  blush?: number; sweat?: number; still?: boolean; // still: no built-in breathing bob (walk cycles drive the hips)
};
export type FReveal = Partial<Record<"shoes" | "legs" | "torso" | "vest" | "tie" | "armL" | "armR" | "head" | "ears" | "hair" | "eyes" | "brows" | "nose" | "mouth", number>>;

const r = (d: number) => (d * Math.PI) / 180;
const pt = (x: number, y: number, a: number, len: number): [number, number] => [x - len * Math.sin(r(a)), y + len * Math.cos(r(a))];

/** Articulated hand from captured finger curls: four fingers that shorten and fold as they curl (knuckles show when
 * closed), a thumb that swings from out to tucked, palm vs back of the hand, and an optional phone held in it. */
const FingerHand: React.FC<{ x: number; y: number; a: number; flip: number; fing: number[]; palm: number; phone?: number }> = ({ x, y, a, flip, fing, palm, phone = 0 }) => {
  const { C, hero } = usePal();
  const side = -flip * (palm >= 0 ? 1 : -1); // thumb side: outward with the palm to camera, inward with the back
  const spread = 1 + 0.25 * (1 - (fing[0] + fing[1] + fing[2] + fing[3]) / 4);
  const th = Math.min(1, Math.max(0, fing[4] ?? 0.3));
  return (
    <g transform={`translate(${x},${y}) rotate(${a}) scale(${hero ? 1.15 : 1.4})`}>
      {[-12, -4, 4, 12].map((d, k) => {
        const c = Math.min(1, Math.max(0, fing[k] ?? 0.3)), L = (k === 3 ? 20 : k === 0 ? 25 : 27) * (1 - 0.72 * c);
        const bx = d * spread, by = 16, tx = bx * (1 + 0.15 * (1 - c)), ty = by + L;
        return (
          <g key={k}>
            <line x1={bx} y1={by} x2={tx} y2={ty} stroke={C.skin} strokeWidth={8.5} strokeLinecap="round" />
            {c > 0.55 && <circle cx={tx} cy={ty} r={4.6} fill={C.skin} stroke={C.skinDark} strokeWidth={1.5} />}
          </g>
        );
      })}
      <ellipse cx={0} cy={9} rx={18} ry={16} fill={C.skin} stroke={C.skinDark} strokeWidth={2} />
      {palm < -0.2 && [-8, 0, 8].map((d) => <line key={d} x1={d * 0.6} y1={2} x2={d} y2={16} stroke={C.skinDark} strokeWidth={1.6} opacity={0.6} />)}
      {palm > 0.2 && <path d="M -10,14 Q 0,20 10,12" stroke={C.skinDark} strokeWidth={1.6} fill="none" opacity={0.55} />}
      <line x1={14 * side} y1={6} x2={side * (14 + 14 * (1 - th)) - side * 10 * th} y2={6 + 14 + 6 * th} stroke={C.skin} strokeWidth={9.5} strokeLinecap="round" />
      {phone > 0 && (
        <g opacity={phone} transform={`rotate(${-8 * flip})`}>
          <rect x={-15} y={-4} width={30} height={56} rx={6} fill="#14141a" stroke="#3a3a46" strokeWidth={2} />
          <rect x={-12} y={0} width={24} height={46} rx={3} fill="#bfe3ff" />
          <circle cx={0} cy={3} r={1.6} fill="#14141a" />
        </g>
      )}
      {hero && [-14, -6, 2].map((d) => <line key={d} x1={-15} y1={d} x2={15} y2={d} stroke={C.argyle} strokeWidth={4} strokeLinecap="round" />)}
    </g>
  );
};

const HandShape: React.FC<{ x: number; y: number; a: number; kind: Hand; flip: number }> = ({ x, y, a, kind, flip }) => {
  const { C, hero } = usePal();
  return (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${hero ? 1.15 : 1.4})`}>
    {kind === "point" && <line x1={0} y1={0} x2={0} y2={46} stroke={C.skin} strokeWidth={12} strokeLinecap="round" />}
    {kind === "thumb" && <line x1={0} y1={0} x2={-30 * flip} y2={-16} stroke={C.skin} strokeWidth={12} strokeLinecap="round" />}
    {kind === "open" && [-12, -4, 4, 12].map((d) => <line key={d} x1={d} y1={8} x2={d * 1.3} y2={34} stroke={C.skin} strokeWidth={9} strokeLinecap="round" />)}
    {kind === "paw" && <path d="M -16,6 Q 0,30 16,6" stroke={C.skin} strokeWidth={12} fill="none" strokeLinecap="round" />}
    <circle cx={0} cy={8} r={kind === "fist" || kind === "thumb" ? 19 : 17} fill={C.skin} stroke={C.skinDark} strokeWidth={2} />
    {kind !== "paw" && kind !== "thumb" && <line x1={-14 * flip} y1={4} x2={-24 * flip} y2={16} stroke={C.skin} strokeWidth={10} strokeLinecap="round" />}
    {hero && [-14, -6, 2].map((d) => <line key={d} x1={-15} y1={d} x2={15} y2={d} stroke={C.argyle} strokeWidth={4} strokeLinecap="round" />)}
  </g>
  );
};

/** One smooth, tapered limb through shoulder->elbow->wrist (rubber-hose style): a quadratic curve that passes
 * through the joint, outlined with a width that tapers from w0 to w1, with round ends. No rigid sticks. */
const Limb: React.FC<{ a: [number, number]; b: [number, number]; c: [number, number]; w0: number; w1: number; fill: string }> = ({ a, b, c, w0, w1, fill }) => {
  const k: [number, number] = [2 * b[0] - (a[0] + c[0]) / 2, 2 * b[1] - (a[1] + c[1]) / 2];
  const N = 14, L: string[] = [], R: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * a[0] + 2 * u * t * k[0] + t * t * c[0], y = u * u * a[1] + 2 * u * t * k[1] + t * t * c[1];
    const dx = 2 * u * (k[0] - a[0]) + 2 * t * (c[0] - k[0]), dy = 2 * u * (k[1] - a[1]) + 2 * t * (c[1] - k[1]);
    const n = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2 * (1 + 0.06 * Math.sin(t * Math.PI));
    L.push(`${(x - (dy / n) * w).toFixed(1)},${(y + (dx / n) * w).toFixed(1)}`);
    R.push(`${(x + (dy / n) * w).toFixed(1)},${(y - (dx / n) * w).toFixed(1)}`);
  }
  return (
    <g fill={fill}>
      <path d={`M ${L.join(" L ")} L ${R.reverse().join(" L ")} Z`} />
      <circle cx={a[0]} cy={a[1]} r={w0 / 2} /><circle cx={c[0]} cy={c[1]} r={w1 / 2} />
    </g>
  );
};

const Arm: React.FC<{ x: number; y: number; a: [number, number]; hand: Hand; flip: number; bones?: boolean; far?: boolean; ls?: [number, number]; wr?: number; fing?: number[]; palm?: number; phone?: number }> = ({ x, y, a, hand, flip, bones, far, ls = [1, 1], wr = 0, fing, palm = 1, phone }) => {
  const Hd: React.FC<{ hx: number; hy: number }> = ({ hx, hy }) => (fing ? <FingerHand x={hx} y={hy} a={a[0] + a[1] + wr} flip={flip} fing={fing} palm={palm} phone={phone} /> : <HandShape x={hx} y={hy} a={a[0] + a[1] + wr} kind={hand} flip={flip} />);
  const [ex, ey] = pt(x, y, a[0], 130 * ls[0]);
  const [hx, hy] = pt(ex, ey, a[0] + a[1], 120 * ls[1]);
  const { C, hero } = usePal();
  if (hero) {
    const [mx, my] = pt(x, y, a[0], 52 * ls[0]);
    return (
      <g>
        <Limb a={[x, y]} b={[ex, ey]} c={[hx, hy]} w0={30} w1={21} fill={far ? C.skinDark : C.skin} />
        <line x1={x} y1={y} x2={mx} y2={my} stroke={far ? C.shirtDark : C.shirt} strokeWidth={40} strokeLinecap="round" />
        <circle cx={mx} cy={my} r={4} fill={C.argyle} />
        <Hd hx={hx} hy={hy} />
        {bones && <Bones pts={[[x, y], [ex, ey], [hx, hy]]} />}
      </g>
    );
  }
  return (
    <g>
      <Limb a={[x, y]} b={[ex, ey]} c={[hx, hy]} w0={40} w1={30} fill={far ? C.shirtDark : C.shirt} />
      <line x1={hx - 15 * Math.cos(r(a[0] + a[1]))} y1={hy - 15 * Math.sin(r(a[0] + a[1]))} x2={hx + 15 * Math.cos(r(a[0] + a[1]))} y2={hy + 15 * Math.sin(r(a[0] + a[1]))} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      <Hd hx={hx} hy={hy} />
      {bones && <Bones pts={[[x, y], [ex, ey], [hx, hy]]} />}
    </g>
  );
};

const Leg: React.FC<{ x: number; y: number; a: [number, number]; toe: number; dir: number; bones?: boolean; p?: number; ps?: number; far?: boolean; ls?: [number, number]; foot?: [number, number] }> = ({ x, y, a, toe, dir: dir0, bones, p, ps, far, ls = [1, 1], foot }) => {
  // a captured foot points where the real one did (screen angle) and shortens when it turns toward the camera
  const fa = foot ? (((foot[0] % 360) + 540) % 360) - 180 : 0;
  const dir = foot ? (Math.abs(fa) <= 90 ? 1 : -1) : dir0;
  const footT = (ax: number, ay: number) => (foot ? `translate(${ax},${ay + 6}) rotate(${dir > 0 ? fa : fa - 180 * Math.sign(fa || 1)}) scale(${Math.max(0.45, foot[1])},1)` : `translate(${ax},${ay + 6}) rotate(${-toe * dir})`);
  const [kx, ky] = pt(x, y, a[0], 200 * ls[0]);
  const [ax, ay] = pt(kx, ky, a[0] + a[1], 195 * ls[1]);
  const [sx, sy] = pt(kx, ky, a[0] + a[1], 170 * ls[1]);
  const { C, hero } = usePal();
  if (hero) {
    return (
      <g>
        <Limb a={[x, y]} b={[kx, ky]} c={[ax, ay]} w0={42} w1={26} fill={far ? C.skinDark : C.skin} />
        {[-10, 0, 10].map((d) => <circle key={d} cx={ax + d} cy={ay - 4} r={4} fill={C.argyle} />)}
        <g transform={footT(ax, ay)}>
          <path d={`M ${-18 * dir},-8 Q ${-22 * dir},12 0,12 L ${50 * dir},12 Q ${64 * dir},10 ${58 * dir},-2 Q ${40 * dir},-12 ${8 * dir},-12 Z`} fill={far ? C.skinDark : C.skin} />
          <line x1={-20 * dir} y1={12} x2={60 * dir} y2={12} stroke={C.shoe} strokeWidth={6} strokeLinecap="round" />
          <path d={`M ${6 * dir},-10 L ${30 * dir},10`} stroke={C.shoe} strokeWidth={5} strokeLinecap="round" />
        </g>
        {bones && <Bones pts={[[x, y], [kx, ky], [ax, ay]]} />}
      </g>
    );
  }
  return (
    <g>
      <P p={p}>
        <Limb a={[x, y]} b={[kx, ky]} c={[sx, sy]} w0={60} w1={46} fill={far ? C.trousersDark : C.trousers} />
        <line x1={sx} y1={sy} x2={ax} y2={ay} stroke={far ? "#d4d4d4" : C.sock} strokeWidth={30} strokeLinecap="round" />
      </P>
      <P p={ps}>
        <g transform={footT(ax, ay)}>
          <path d={`M ${-26 * dir},-14 Q ${-30 * dir},14 ${0},16 L ${58 * dir},16 Q ${78 * dir},14 ${70 * dir},-4 Q ${50 * dir},-20 ${10 * dir},-18 Z`} fill={C.shoe} />
          <path d={`M ${14 * dir},-12 Q ${44 * dir},-14 ${60 * dir},-4`} stroke={C.shoeHi} strokeWidth={5} fill="none" strokeLinecap="round" />
          <line x1={-26 * dir} y1={16} x2={74 * dir} y2={16} stroke="#3a2010" strokeWidth={6} strokeLinecap="round" />
        </g>
      </P>
      {bones && <Bones pts={[[x, y], [kx, ky], [ax, ay]]} />}
    </g>
  );
};

const Bones: React.FC<{ pts: [number, number][] }> = ({ pts }) => {
  const big = useContext(BonesOnly);
  return (
    <g>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} stroke="#22d3ee" strokeWidth={big ? 12 : 5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={big ? 16 : 11} fill={big ? "#f43f5e" : "#0b1022"} stroke={big ? "#fff" : "#22d3ee"} strokeWidth={5} />)}
    </g>
  );
};

/** Heroine eyes: big almond shape, deep brown iris with catch-lights, a thick lash line with a wing. */
const HeroEye: React.FC<{ x: number; s: number; p: FPose; blink: number; wink: number }> = ({ x, s, p, blink, wink }) => {
  const { C } = usePal();
  const out = x < 0 ? -1 : 1;
  const size = (p.eyeSize ?? 1) * s;
  const rx = 27 * size, ry = 23 * size, y = -116;
  const shut = Math.max(p.shut ?? 0, wink);
  const lid = Math.min(1, Math.max(p.lid ?? 0, 1 - blink));
  const lash = (yy: number, k: number) => (
    <g stroke={C.ink} strokeLinecap="round" fill="none">
      {[0.6, 0.9].map((u) => <path key={u} d={`M ${x + out * rx * u},${yy - k * ry * (1.05 - u * 0.75)} q ${out * 4},${-6 * k} ${out * 10},${-8 * k}`} strokeWidth={3} />)}
    </g>
  );
  if (shut > 0.5 || lid > 0.85) {
    // closed: a soft downward arc with lashes (a happy, graceful close)
    return <g><path d={`M ${x - rx},${y} Q ${x},${y + 14} ${x + rx},${y}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />{lash(y + 6, -0.5)}</g>;
  }
  const lx = (p.lookX ?? 0) * rx * 0.35, ly = (p.lookY ?? 0) * ry * 0.3;
  const id = `he${Math.round(x)}`;
  const ix = x - out * rx, iy = y + 3, ox = x + out * rx, oy = y - 5; // inner corner sits lower, outer corner lifts
  const topY = (k: number) => y - ry * k + lid * ry * 2.1;
  const top = `M ${ix},${iy} C ${x - out * rx * 0.6},${topY(1.25)} ${x + out * rx * 0.5},${topY(1.2)} ${ox},${oy}`;
  const shape = `M ${ix},${iy} C ${x - out * rx * 0.6},${y - ry * 1.25} ${x + out * rx * 0.5},${y - ry * 1.2} ${ox},${oy} C ${x + out * rx * 0.5},${y + ry * 0.95} ${x - out * rx * 0.6},${y + ry * 0.95} ${ix},${iy} Z`;
  return (
    <g>
      <defs><clipPath id={id}><path d={shape} /></clipPath></defs>
      <path d={shape} fill="#fffaf5" />
      <g clipPath={`url(#${id})`}>
        <circle cx={x + lx} cy={y + ly} r={ry * 0.86} fill="#4a2a17" />
        <circle cx={x + lx} cy={y + ly} r={ry * 0.86} fill="none" stroke="#2a160b" strokeWidth={4} />
        <circle cx={x + lx} cy={y + ly + 5} r={ry * 0.6} fill="#8a5632" opacity={0.5} />
        <circle cx={x + lx} cy={y + ly} r={ry * 0.42} fill="#150a05" />
        <circle cx={x + lx + 7} cy={y + ly - 7} r={6} fill="#fff" />
        <circle cx={x + lx - 6} cy={y + ly + 8} r={2.6} fill="#fff" opacity={0.85} />
        <path d={`M ${ix - out * 6},${y - ry * 2} L ${ox + out * 6},${y - ry * 2} L ${ox + out * 6},${oy} C ${x + out * rx * 0.5},${topY(1.2)} ${x - out * rx * 0.6},${topY(1.25)} ${ix},${iy} Z`} fill={C.skin} opacity={lid > 0.02 ? 1 : 0} />
      </g>
      <path d={`${top} q ${out * 10},-3 ${out * 20},-13`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${ix + out * 4},${iy + 2} C ${x - out * rx * 0.5},${y + ry * 0.95} ${x + out * rx * 0.5},${y + ry * 0.95} ${ox - out * 2},${oy + 4}`} stroke={C.ink} strokeWidth={2.5} fill="none" opacity={0.5} />
      {lid < 0.4 && lash(y, 1)}
    </g>
  );
};

const Eye: React.FC<{ x: number; s: number; p: FPose; blink: number; wink: number }> = (props) => {
  const { hero } = usePal();
  return hero ? <HeroEye {...props} /> : <ToonEye {...props} />;
};

const ToonEye: React.FC<{ x: number; s: number; p: FPose; blink: number; wink: number }> = ({ x, s, p, blink, wink }) => {
  const { C, hero } = usePal();
  const size = (p.eyeSize ?? 1) * s * (hero ? 0.95 : 1);
  const rx = 23 * size, ry = 28 * size, y = -128;
  const shut = Math.max(p.shut ?? 0, wink);
  if (blink < 0.5 && shut <= 0.5) {
    return <path d={`M ${x - rx},${y + 4} Q ${x},${y + 12} ${x + rx},${y + 4}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
  if (shut > 0.5) {
    return <path d={`M ${x - rx},${y} Q ${x},${y - 18} ${x + rx},${y}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />;
  }
  const lid = Math.min(1, Math.max(p.lid ?? 0, 1 - blink));
  const sq = p.squint ?? 0;
  const lx = p.lookX ?? 0, ly = p.lookY ?? 0;
  const id = `ec${Math.round(x)}`;
  return (
    <g>
      <defs><clipPath id={id}><ellipse cx={x} cy={y} rx={rx} ry={ry} /></clipPath></defs>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" stroke={C.ink} strokeWidth={4} />
      <g clipPath={`url(#${id})`}>
        <circle cx={x + lx * rx * 0.55} cy={y + ly * ry * 0.5} r={11 * Math.min(1.1, size)} fill={C.ink} />
        <circle cx={x + lx * rx * 0.55 + 4} cy={y + ly * ry * 0.5 - 4} r={3.5} fill="#fff" />
        <rect x={x - rx - 2} y={y - ry - 2} width={rx * 2 + 4} height={(ry * 2 + 4) * lid} fill={C.skin} />
        <rect x={x - rx - 2} y={y + ry + 2 - (ry * 2 + 4) * sq * 0.45} width={rx * 2 + 4} height={(ry * 2 + 4) * sq * 0.45} fill={C.skin} />
      </g>
      {lid > 0.05 && <line x1={x - rx} y1={y - ry + (ry * 2) * lid} x2={x + rx} y2={y - ry + (ry * 2) * lid} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />}
      {hero && lid < 0.3 && (() => {
        const out = x < 0 ? -1 : 1; // outer corner side
        return (
          <g stroke={C.ink} strokeLinecap="round" fill="none">
            <path d={`M ${x - rx},${y} A ${rx} ${ry} 0 0 1 ${x + rx},${y}`} strokeWidth={7} />
            <path d={`M ${x + out * rx},${y - 2} q ${out * 10},-4 ${out * 16},-14`} strokeWidth={6} />
            {[0.55, 0.78].map((k) => <path key={k} d={`M ${x + out * rx * k},${y - ry * Math.sqrt(1 - k * k)} l ${out * 6},-11`} strokeWidth={4} />)}
          </g>
        );
      })()}
    </g>
  );
};

const Brow: React.FC<{ x: number; raise: number; knit: number; side: number }> = ({ x, raise, knit, side }) => {
  const { C, hero } = usePal();
  const y = (hero ? -160 : -170) - 26 * raise;
  const inner = y + 14 * knit - 6 * Math.max(0, raise), outer = y - 4 * knit + 4 * Math.max(0, -raise);
  const ix = x - side * 26, ox = x + side * 26;
  return <path d={`M ${ix},${inner} Q ${x},${Math.min(inner, outer) - 12 - 6 * raise} ${ox},${outer}`} stroke={C.brow} strokeWidth={hero ? 5 : 14} fill="none" strokeLinecap="round" />;
};

const Mouth: React.FC<{ p: FPose }> = ({ p }) => {
  const { C, hero } = usePal();
  const w = (hero ? 0.8 : 1) * 18 + 30 * (p.mw ?? 0.6), o = p.mo ?? 0, sm = p.smile ?? 0.2, sk = p.skew ?? 0, pk = p.pucker ?? 0, out = p.lipOut ?? 0;
  if (hero && pk <= 0.5) {
    const hw = 13 + 13 * (p.mw ?? 0.6), lift = -sm * 7;
    if (o < 0.1) {
      return (
        <g>
          <path d={`M ${-hw},${lift + sk * -6} Q ${-hw * 0.45},${-7 + lift * 0.4} ${-2},${-4} L 0,-2 L 2,-4 Q ${hw * 0.45},${-7 + lift * 0.4} ${hw},${lift + sk * 6} Q ${hw * 0.3},${2 + sm * 2} 0,${1} Q ${-hw * 0.3},${2 + sm * 2} ${-hw},${lift + sk * -6} Z`} fill="#d14a6e" />
          <path d={`M ${-hw},${lift + sk * -6} Q 0,${4 + sm * 6} ${hw},${lift + sk * 6} Q ${hw * 0.5},${11 + sm * 4 + out * 6} 0,${12 + sm * 3 + out * 6} Q ${-hw * 0.5},${11 + sm * 4 + out * 6} ${-hw},${lift + sk * -6} Z`} fill="#e45f84" />
          <ellipse cx={-3} cy={7} rx={hw * 0.3} ry={2.2} fill="#fff" opacity={0.35} />
        </g>
      );
    }
    const h = 6 + 30 * o;
    return (
      <g>
        <path d={`M ${-hw},${lift} Q 0,${-6} ${hw},${lift} Q ${hw * 0.7},${h + 4} 0,${h + 6} Q ${-hw * 0.7},${h + 4} ${-hw},${lift} Z`} fill="#5a1626" stroke="#d14a6e" strokeWidth={5} strokeLinejoin="round" />
        {sm > 0.2 && <path d={`M ${-hw * 0.75},${lift + 1} Q 0,${3} ${hw * 0.75},${lift + 1} L ${hw * 0.65},${lift + 8} Q 0,${10} ${-hw * 0.65},${lift + 8} Z`} fill="#fff" />}
      </g>
    );
  }
  if (pk > 0.5) {
    return (
      <g>
        <ellipse cx={0} cy={0} rx={16} ry={14} fill={C.lip} />
        <ellipse cx={0} cy={0} rx={6} ry={6 + 4 * o} fill={C.mouth} />
      </g>
    );
  }
  const yl = -sm * 12 - sk * 14, yr = -sm * 12 + sk * 14;
  if (o < 0.08) {
    return (
      <g>
        {hero ? <path d={`M ${-w},${yl} Q ${-w * 0.5},${-8 + sm * 4} 0,${-3} Q ${w * 0.5},${-8 + sm * 4} ${w},${yr} Q 0,${12 + sm * 14} ${-w},${yl} Z`} fill={C.lip} /> : <path d={`M ${-w},${yl} Q 0,${sm * 16} ${w},${yr}`} stroke={C.lip} strokeWidth={7} fill="none" strokeLinecap="round" />}
        {out > 0 && <path d={`M ${-w * 0.6},${6} Q 0,${6 + 22 * out} ${w * 0.6},${6}`} fill={C.lip} opacity={0.9} />}
      </g>
    );
  }
  const h = 8 + 52 * o;
  return (
    <g>
      <path d={`M ${-w},${yl} Q 0,${-6 + sm * 6} ${w},${yr} Q ${w * 0.8},${h + sm * 8} 0,${h + sm * 10} Q ${-w * 0.8},${h + sm * 8} ${-w},${yl} Z`} fill={C.mouth} stroke={C.lip} strokeWidth={5} strokeLinejoin="round" />
      {sm > 0.3 && <path d={`M ${-w * 0.8},${yl * 0.8 + 2} Q 0,${4} ${w * 0.8},${yr * 0.8 + 2} L ${w * 0.7},${yr * 0.8 + 12} Q 0,${16} ${-w * 0.7},${yl * 0.8 + 12} Z`} fill="#fff" />}
      {o > 0.4 && <ellipse cx={0} cy={h - 4} rx={w * 0.45} ry={h * 0.2} fill="#d9606a" />}
    </g>
  );
};

export const Fumble: React.FC<{ f: number; p: FPose; reveal?: FReveal; bones?: boolean; look?: Look; bonesOnly?: boolean; braids?: boolean }> = ({ look = "fumble", bonesOnly = false, braids = false, ...rest }) => (
  <BonesOnly.Provider value={bonesOnly}>
    <Pal.Provider value={{ C: look === "heroine" ? HC_ : look === "boss" ? BC_ : FC_, hero: look === "heroine", braids, boss: look === "boss" }}><Body {...rest} bones={rest.bones || bonesOnly} /></Pal.Provider>
  </BonesOnly.Provider>
);

const Body: React.FC<{ f: number; p: FPose; reveal?: FReveal; bones?: boolean }> = ({ f, p, reveal = {}, bones }) => {
  const { C, hero, braids, boss } = usePal();
  const blink = f % 110 < 4 || f % 173 < 3 ? 0 : 1;
  const hipY = -410 + (p.hipY ?? 0) - (p.still ? 0 : 2 * Math.sin(f / 16));
  const turn = p.turn ?? 0;
  const dir = Math.abs(p.bodyTurn ?? turn) > 0.35 ? Math.sign(p.bodyTurn ?? turn) : 0;
  const legL = p.legL ?? [6, 0], legR = p.legR ?? [-6, 0];
  const armL = p.armL ?? [14, 18], armR = p.armR ?? [-14, -18];
  const SH = -300; // shoulders above the hip
  const uid = useId().replace(/:/g, "");
  // side-on: hips and shoulders narrow, the far limbs go darker and behind the body
  const bodyTurn = p.bodyTurn ?? turn; // the body can face the camera while the head turns (and vice versa)
  const prof = Math.min(1, Math.max(0, (Math.abs(bodyTurn) - 0.3) / 0.3));
  const farR = bodyTurn < 0 && prof > 0.5, farL = bodyTurn > 0 && prof > 0.5; // facing right we see his left side, so screen-left limbs are far
  // ---- flexible torso: pelvis tilt, curved spine, chest twist, shoulders, breathing ----
  const rad = (d: number) => (d * Math.PI) / 180;
  const ht = rad(p.hipTilt ?? 0), bd = rad(p.bend ?? 0), tw = (p.twist ?? 0) * (1 - prof);
  const br = p.breath ?? 0.5 + 0.5 * Math.sin(f / 22);
  const shL = (p.shrugL ?? 0) + (p.shrug ?? 0), shR = (p.shrugR ?? 0) + (p.shrug ?? 0);
  const Ls = -SH * (p.spineS ?? 1);
  const N: [number, number] = [Ls * Math.sin(bd / 2), -Ls * Math.cos(bd / 2) - 3 * br]; // neck base
  const spine = (u: number): [number, number] => { const q = 1 - u; return [q * q * 0 + 2 * q * u * 0 + u * u * N[0], 2 * q * u * (-Ls / 2) + u * u * N[1]]; };
  const toWorld = (x: number, y: number): [number, number] => [N[0] + x * Math.cos(bd) - y * Math.sin(bd), N[1] + x * Math.sin(bd) + y * Math.cos(bd)];
  const hx = (hero ? 28 : 34) * (1 - 0.7 * prof), sx = (hero ? 74 : 88) * (1 - 0.5 * prof);
  const hipL: [number, number] = [-hx * Math.cos(ht), -hx * Math.sin(ht)], hipR: [number, number] = [hx * Math.cos(ht), hx * Math.sin(ht)];
  const shY = (sh: number) => 22 - 30 * sh - 2 * br;
  const swingX = (p.twist ?? 0) * prof * 34 * Math.sign(turn || 1); // side-on, the chest twist shows as one shoulder forward, the other back
  const shoulderL = toWorld(-sx * (1 + 0.1 * tw) - swingX, shY(shL)), shoulderR = toWorld(sx * (1 - 0.1 * tw) + swingX, shY(shR));
  const width = (u: number) => (u < 0.5 ? 78 + 12 * u : 84 + 16 * (u - 0.5)) * (1 + 0.035 * br * u) * (1 - 0.32 * prof);
  const samples = Array.from({ length: 9 }, (_, i) => i / 8);
  const edge = (side: number) => samples.map((u) => {
    const [cx, cy] = spine(u), th = bd * u + (u === 0 ? ht : 0) * 0, w = width(u) * (1 + side * 0.12 * tw * u);
    const tilt = ht * (1 - u) + th; // the waist follows the pelvis, the chest follows the spine
    return [cx + side * w * Math.cos(tilt), cy + side * w * Math.sin(tilt)] as [number, number];
  });
  const Lp = edge(-1), Rp = edge(1);
  const capL = toWorld(-sx + 6, shY(shL) - 22), capR = toWorld(sx - 6, shY(shR) - 22), nL = toWorld(-56, -6), nR = toWorld(56, -6);
  const pts = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");
  const torsoD = `M ${pts(Lp)} Q ${capL[0].toFixed(1)},${capL[1].toFixed(1)} ${nL[0].toFixed(1)},${nL[1].toFixed(1)} L ${nR[0].toFixed(1)},${nR[1].toFixed(1)} Q ${capR[0].toFixed(1)},${capR[1].toFixed(1)} ${pts([...Rp].reverse())} Z`;
  const mid = spine(0.5);
  const ftx = (u: number) => tw * 26 * u; // chest-front features slide with the twist
  const armRN = <P p={reveal.armR}><Arm x={shoulderR[0]} y={shoulderR[1]} a={armR} hand={p.handR ?? "open"} flip={-1} bones={bones} far={farR || !!p.armRBack} ls={p.armRs} wr={p.wristR} fing={p.fingR} palm={p.palmR} phone={p.phoneR} /></P>;
  const armLN = <P p={reveal.armL}><Arm x={shoulderL[0]} y={shoulderL[1]} a={armL} hand={p.handL ?? "open"} flip={1} bones={bones} far={farL || !!p.armLBack} ls={p.armLs} wr={p.wristL} fing={p.fingL} palm={p.palmL} phone={p.phoneL} /></P>;
  const backR = farR || !!p.armRBack, backL = farL || !!p.armLBack; // 3D depth wins when the capture says an arm is behind the body
  const arms = <>{!backR && armRN}{!backL && armLN}</>;
  const farArm = <>{backL && armLN}{backR && armRN}</>;
  const fx = turn * 34; // face features slide with the turn
  return (
    <g>
      {!useContext(BonesOnly) && <ellipse cx={0} cy={6} rx={170} ry={22} fill="#000" opacity={0.16} />}
      <g transform={`translate(${p.hipX ?? 0},${hipY})`}>
        {(() => {
          const lL = <Leg key="l" x={hipL[0]} y={hipL[1]} a={legL} toe={p.toeL ?? 0} dir={dir || -1} bones={bones} p={reveal.legs} ps={reveal.shoes} far={farL || p.legLFront === false} ls={p.legLs} foot={p.footL} />;
          const lR = <Leg key="r" x={hipR[0]} y={hipR[1]} a={legR} toe={p.toeR ?? 0} dir={dir || 1} bones={bones} p={reveal.legs} ps={reveal.shoes} far={farR || p.legLFront === true} ls={p.legRs} foot={p.footR} />;
          return farR || p.legLFront === true ? [lR, lL] : [lL, lR];
        })()}
        {hero && (() => {
          // flared half-saree skirt: hangs from the tilted waist and flares around wherever the knees and ankles go
          const knee = (h: [number, number], a: [number, number]) => pt(h[0], h[1], a[0], 200);
          const ank = (h: [number, number], a: [number, number]) => { const k = knee(h, a); return pt(k[0], k[1], a[0] + a[1], 195); };
          const kL = knee(hipL, legL), kR = knee(hipR, legR), aL = ank(hipL, legL), aR = ank(hipR, legR);
          const hemY = Math.max(aL[1], aR[1]) - 34, sway = p.skirtS !== undefined ? p.skirtS + 4 * Math.sin(f / 9) : 10 * Math.sin(f / 9);
          const xl = Math.min(kL[0], aL[0], hipL[0]) - 70 + sway, xr = Math.max(kR[0], aR[0], hipR[0]) + 70 + sway;
          const wl: [number, number] = [-72 * Math.cos(ht), -72 * Math.sin(ht) - 6], wr: [number, number] = [72 * Math.cos(ht), 72 * Math.sin(ht) - 6];
          const d = `M ${wl[0]},${wl[1]} Q ${xl + 10},${hemY * 0.5} ${xl},${hemY} Q ${(xl + xr) / 2},${hemY + 22} ${xr},${hemY} Q ${xr - 10},${hemY * 0.5} ${wr[0]},${wr[1]} Z`;
          return (
            <g>
              <path d={d} fill={C.trousers} />
              {[0.2, 0.4, 0.6, 0.8].map((u) => <path key={u} d={`M ${wl[0] + (wr[0] - wl[0]) * u},${wl[1] + (wr[1] - wl[1]) * u} Q ${xl + (xr - xl) * u},${hemY * 0.6} ${xl + (xr - xl) * u},${hemY + 14}`} stroke={C.trousersDark} strokeWidth={5} fill="none" opacity={0.7} />)}
              <path d={`M ${xl + 4},${hemY - 26} Q ${(xl + xr) / 2},${hemY - 4} ${xr - 4},${hemY - 26} L ${xr},${hemY} Q ${(xl + xr) / 2},${hemY + 22} ${xl},${hemY} Z`} fill={C.argyle} />
              <path d={`M ${xl + 2},${hemY - 12} Q ${(xl + xr) / 2},${hemY + 10} ${xr - 2},${hemY - 12}`} stroke="#c2185b" strokeWidth={5} fill="none" />
            </g>
          );
        })()}
        {(backL || backR) && <g transform={`rotate(${p.lean ?? 0})`}>{farArm}</g>}
        <g transform={`rotate(${p.lean ?? 0})`}>
          {p.back && arms}
          <defs><clipPath id={`tc${uid}`}><path d={torsoD} /></clipPath></defs>
          {/* torso: shirt silhouette, argyle vest bent along the spine, waistband on the pelvis */}
          <P p={reveal.torso}>
            <path d={torsoD} fill={C.shirt} />
          </P>
          {hero && (
            <g clipPath={`url(#tc${uid})`}>
              {/* half-saree pallu: a teal drape with a gold border from the right hip over the left shoulder */}
              <path d={`M ${70},${10} L ${150},${-40} L ${shoulderL[0] + 30},${shoulderL[1] - 60} L ${shoulderL[0] - 60},${shoulderL[1] - 10} Z`} fill={C.vest} />
              <path d={`M ${70},${10} L ${shoulderL[0] - 60},${shoulderL[1] - 10}`} stroke={C.argyle} strokeWidth={12} />
              <path d={`M ${150},${-40} L ${shoulderL[0] + 30},${shoulderL[1] - 60}`} stroke={C.argyle} strokeWidth={8} />
              <g transform={`rotate(${p.hipTilt ?? 0})`}><rect x={-110} y={-22} width={220} height={30} fill={C.argyle} /></g>
            </g>
          )}
          {!hero && <P p={reveal.vest}>
            <g clipPath={`url(#tc${uid})`}>
              {boss ? (
                // open jacket: the black tee shows in a band down the middle, the jacket (shirt colour) on both sides
                <path d={`M ${N[0] - 44 + ftx(1)},${N[1] - 6} L ${N[0] + 44 + ftx(1)},${N[1] - 6} L ${62 + ftx(0)},20 L ${-62 + ftx(0)},20 Z`} fill={C.vest} />
              ) : <path d={torsoD} fill={C.vest} />}
              {!boss && <g transform={`translate(${mid[0] + ftx(0.5)},${mid[1] + 150}) rotate(${(p.bend ?? 0) * 0.5})`} opacity={0.85}>
                {[-100, -50, 0, 50, 100].map((cx) => [-70, -170, -270].map((cy) => (
                  <path key={`${cx}${cy}`} d={`M ${cx},${cy - 44} L ${cx + 24},${cy} L ${cx},${cy + 44} L ${cx - 24},${cy} Z`} fill={((cx / 50 + cy / 100) % 2 + 2) % 2 ? C.vestDark : "none"} stroke={C.argyle} strokeWidth={3} />
                )))}
              </g>}
              {!boss && <g transform={`translate(${N[0]},${N[1]}) rotate(${p.bend ?? 0})`}>
                <path d={`M ${-58 + ftx(1)},-10 L ${-54 + ftx(1)},0 L ${ftx(1)},110 L ${54 + ftx(1)},0 L ${58 + ftx(1)},-10 Z`} fill={C.shirt} />
              </g>}
              {boss && [-1, 1].map((sd) => <path key={sd} d={`M ${N[0] + sd * 44 + ftx(1)},${N[1] - 6} L ${sd * 62 + ftx(0)},20`} stroke={C.shirtDark} strokeWidth={7} />)}
              <g transform={`rotate(${p.hipTilt ?? 0})`}>
                <path d="M -110,-8 Q 0,6 110,-8 L 110,40 L -110,40 Z" fill={C.vestDark} opacity={0.35} />
              </g>
            </g>
            {!boss && [0.28, 0.45, 0.62].map((u) => { const [x, y] = spine(u); return <circle key={u} cx={x + ftx(u)} cy={y} r={6} fill={C.argyle} />; })}
          </P>}
          {boss && (() => {
            // jacket tails below the waist swing with the hips (skirtS from the spring pass) and sideways motion
            const sw = (p.skirtS ?? 0) * 1.4 - Math.max(-30, Math.min(30, (p.swayX ?? 0) * 1.5));
            return [-1, 1].map((sd) => (
              <path key={`jt${sd}`} transform={`rotate(${p.hipTilt ?? 0})`} d={`M ${sd * 62},14 L ${sd * 96},0 Q ${sd * (108 + 10 * sd * sw * 0.1) + sw},40 ${sd * 104 + sw},78 L ${sd * 58 + sw * 0.6},70 Z`} fill={C.shirt} stroke={C.shirtDark} strokeWidth={4} />
            ));
          })()}
          {!hero && <P p={reveal.torso}>
            <g transform={`rotate(${p.hipTilt ?? 0})`}>
              <rect x={-82 * (1 - 0.3 * prof)} y={-14} width={164 * (1 - 0.3 * prof)} height={40} rx={10} fill={C.trousers} />
              <rect x={-82 * (1 - 0.3 * prof)} y={-14} width={164 * (1 - 0.3 * prof)} height={10} fill={C.trousersDark} />
            </g>
          </P>}
          {/* collar + bow tie ride on the chest */}
          <g transform={`translate(${N[0] + ftx(1)},${N[1]}) rotate(${p.bend ?? 0})`}>
            {hero && (
              <g>
                <path d="M -40,-14 Q -36,28 0,40 Q 36,28 40,-14" stroke={C.argyle} strokeWidth={7} fill="none" />
                <path d="M -48,-12 Q -44,48 0,62 Q 44,48 48,-12" stroke={C.argyle} strokeWidth={4} fill="none" />
                <path d="M 0,58 L -12,74 L 0,92 L 12,74 Z" fill={C.argyle} /><circle cx={0} cy={76} r={5} fill="#c2185b" />
              </g>
            )}
            {boss && [-1, 1].map((sd) => <path key={`lp${sd}`} d={`M ${sd * 40},-14 L ${sd * 62},-4 L ${sd * 34},52 Z`} fill={C.shirtDark} />)}
            {!hero && !boss && <P p={reveal.tie}>
              <path d="M -34,-6 L 0,30 L 34,-6 L 22,-22 L 0,0 L -22,-22 Z" fill="#fff" stroke={C.shirtDark} strokeWidth={3} />
              <path d="M 0,4 L -34,-12 L -34,20 Z M 0,4 L 34,-12 L 34,20 Z" fill={C.tie} />
              <rect x={-8} y={-4} width={16} height={16} rx={4} fill="#c2410c" />
            </P>}
          </g>
          {/* neck + head: the head counter-tilts to stay level as the spine bends */}
          <g transform={`translate(${N[0] + turn * 6 + ftx(1) * 0.5},${N[1] - 14 - (p.neck ?? 0) + 8 * Math.max(shL, shR)}) rotate(${(p.tilt ?? 0) + (p.bend ?? 0) * 0.35})`}>
            <P p={reveal.head}>
              <rect x={-24} y={-34} width={48} height={50 + (p.neck ?? 0)} fill={C.skinDark} />
            </P>
            <g transform="translate(0,-26) scale(1.2) translate(0,8)">
              {hero && <path d="M -102,-150 Q -116,-60 -96,-20 Q -70,8 -40,-6 L 40,-6 Q 70,8 96,-20 Q 116,-60 102,-150 Q 98,-270 0,-272 Q -98,-270 -102,-150 Z" fill={C.hair} />}
              {braids && !hero && (() => {
                const world = -((p.tilt ?? 0) + (p.bend ?? 0) * 0.35 + (p.lean ?? 0)); // gravity: hang straight down on screen
                return [-1, 1].map((sd) => {
                  const sway = 4 * Math.sin(f / 9 + sd) - Math.max(-25, Math.min(25, (p.swayX ?? 0) * 2.5));
                  const phys = p.hairA !== undefined; // simulated two-mass swing: root follows hairA, tip hairB
                  const segs = Array.from({ length: 13 }, (_, i) => {
                    const u = i / 12, swing = phys ? (p.hairA ?? 0) * Math.min(1, u * 2) + ((p.hairB ?? 0) - (p.hairA ?? 0)) * Math.max(0, u * 2 - 1) + 2 * Math.sin(f / 9 + sd) * u : sway * u;
                    const a = ((world + swing + sd * 4) * Math.PI) / 180;
                    return [sd * (96 + i * 1.2) - Math.sin(a) * 26 * i, -170 + 26 * i * Math.cos(a)] as [number, number];
                  });
                  return (
                    <g key={sd}>
                      {segs.map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx={15 - i * 0.55} ry={16} fill={C.hair} stroke="#24170f" strokeWidth={3} /><path d={`M ${x - 9},${y - 7} Q ${x},${y - 1} ${x + 8},${y - 10}`} stroke="#5a4334" strokeWidth={2.5} fill="none" /></g>)}
                      <rect x={segs[12][0] - 9} y={segs[12][1] + 10} width={18} height={10} rx={4} fill="#c2410c" />
                      <path d={`M ${segs[12][0] - 8},${segs[12][1] + 20} l -3,22 l 22,0 l -3,-22 Z`} fill={C.hair} />
                    </g>
                  );
                });
              })()}
              <P p={reveal.ears}>
                <ellipse cx={-96 + Math.max(0, turn) * 18} cy={-112} rx={18} ry={28} fill={C.skin} stroke={C.skinDark} strokeWidth={3} opacity={hero || turn > 0.6 ? 0 : 1} />
                <ellipse cx={96 + Math.min(0, turn) * 18} cy={-112} rx={18} ry={28} fill={C.skin} stroke={C.skinDark} strokeWidth={3} opacity={hero || turn < -0.6 ? 0 : 1} />
              </P>
              <P p={reveal.head}>
                {hero ? <path d="M -90,-138 Q -96,-252 0,-254 Q 96,-252 90,-138 Q 92,-80 66,-40 Q 36,-2 0,4 Q -36,-2 -66,-40 Q -92,-80 -90,-138 Z" fill={C.skin} /> : <path d="M -94,-140 Q -98,-250 0,-252 Q 98,-250 94,-140 Q 96,-60 64,-14 Q 34,16 0,16 Q -34,16 -64,-14 Q -96,-60 -94,-140 Z" fill={C.skin} />}
                {!hero && <path d="M -20,6 Q 0,14 20,6" stroke={C.skinDark} strokeWidth={4} fill="none" strokeLinecap="round" />}
              </P>
              {hero && (() => {
                // centre-parted hair framing the face, jasmine, jhumkas; the braid comes forward over her left shoulder
                const sw = 4 * Math.sin(f / 11) - Math.max(-20, Math.min(20, (p.swayX ?? 0) * 2)), hang = -((p.tilt ?? 0) + (p.bend ?? 0) * 0.35) * 0.8;
                const phys = p.hairA !== undefined;
                const NB = 15, braid = Array.from({ length: NB }, (_, i) => { const u = i / (NB - 1); const swing = phys ? (p.hairA ?? 0) * Math.min(1, u * 2) + ((p.hairB ?? 0) - (p.hairA ?? 0)) * Math.max(0, u * 2 - 1) + 2 * Math.sin(f / 11) * u : sw * u; const a = ((hang + swing) * Math.PI) / 180; return [-94 - 3 * i - Math.sin(a) * 30 * i, -64 + 33 * i * Math.cos(a)] as [number, number]; });
                const jh = (x: number) => (
                  <g transform={`translate(${x},-88) rotate(${(p.earS !== undefined ? p.earS + 3 * Math.sin(f / 7) : sw * 2) + hang})`}>
                    <circle cx={0} cy={0} r={6} fill={C.argyle} /><line x1={0} y1={0} x2={0} y2={16} stroke={C.argyle} strokeWidth={3} />
                    <path d="M -14,32 Q 0,6 14,32 Z" fill={C.argyle} />{[-10, 0, 10].map((d) => <circle key={d} cx={d} cy={36} r={4} fill="#fff" />)}
                  </g>
                );
                return (
                  <g>
                    <path d={`M -98,-108 Q -110,-252 0,-270 Q 110,-252 98,-108 Q 94,-168 72,-194 Q 40,-218 ${6 + fx * 0.3},-213 L ${-6 + fx * 0.3},-213 Q -40,-218 -72,-194 Q -94,-168 -98,-108 Z`} fill={C.hair} />
                    <path d={`M ${fx * 0.3},-266 L ${fx * 0.3},-216`} stroke="#4a3830" strokeWidth={4} strokeLinecap="round" />
                    <path d={`M -60,-240 Q -20,-258 ${-8 + fx * 0.3},-262 M 60,-240 Q 20,-258 ${8 + fx * 0.3},-262`} stroke="#3a2c26" strokeWidth={3} fill="none" opacity={0.7} />
                    {turn < 0.6 && jh(-96 + Math.max(0, turn) * 18)}{turn > -0.6 && jh(96 + Math.min(0, turn) * 18)}
                    {braid.map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx={24 - i * 0.9} ry={23} fill={C.hair} stroke="#2b201c" strokeWidth={3} /><path d={`M ${x - 12},${y - 10} Q ${x},${y - 2} ${x + 10},${y - 14}`} stroke="#4a3a34" strokeWidth={3} fill="none" opacity={0.8} /></g>)}
                    {braid.map(([x, y], i) => <g key={`j${i}`}>{[[18, -6], [-16, 4]].map(([dx, dy], k) => (i + k) % 2 === 0 ? <circle key={k} cx={x + dx * (1 - i * 0.03)} cy={y + dy} r={6.5} fill="#fffdf2" stroke="#e7e2c8" strokeWidth={2} /> : null)}</g>)}
                    <path d={`M ${braid[NB - 1][0] - 10},${braid[NB - 1][1] + 18} q -4,22 -10,34 q 12,-4 20,0 q -6,-12 -4,-34 Z`} fill="#c2185b" /><circle cx={braid[NB - 1][0] - 9} cy={braid[NB - 1][1] + 54} r={6} fill={C.argyle} />
                  </g>
                );
              })()}
              {!hero && <P p={reveal.hair}>
                <path d={`M -98,-140 Q -104,-238 -40,-262 Q 10,-280 70,-258 Q 104,-240 98,-140 L 86,-170 Q 80,-214 ${30 + fx * 0.3},-222 L ${-20 + fx * 0.3},-210 Q -78,-206 -86,-170 Z`} fill={C.hair} />
                <path d={`M ${-20 + fx * 0.3},-262 L ${-28 + fx * 0.3},-214`} stroke="#5a4334" strokeWidth={4} strokeLinecap="round" />
              </P>}
              <g transform={`translate(${fx},0)`}>
                <P p={reveal.eyes}>
                  <Eye x={-38} s={1 - Math.max(0, turn) * 0.25} p={p} blink={blink} wink={p.winkL ?? 0} />
                  <Eye x={38} s={1 + Math.min(0, turn) * 0.25} p={p} blink={blink} wink={p.winkR ?? 0} />
                </P>
                <P p={reveal.brows}>
                  <Brow x={-38} raise={p.browL ?? 0} knit={p.knit ?? 0} side={-1} />
                  <Brow x={38} raise={p.browR ?? 0} knit={p.knit ?? 0} side={1} />
                </P>
                <P p={reveal.nose}>
                  {hero ? (
                    <g>
                      <path d={`M ${turn * 12 + 2},-96 Q ${turn * 12 + 8},-80 ${turn * 12 + 2},-74 Q ${turn * 12 - 4},-71 ${turn * 12 - 8},-75`} stroke={C.skinDark} strokeWidth={4} fill="none" strokeLinecap="round" />
                      <circle cx={turn * 12 + 10} cy={-76} r={3.5} fill={C.argyle} />
                    </g>
                  ) : (
                    <>
                      <ellipse cx={turn * 12} cy={-84} rx={20} ry={22} fill={C.skinDark} />
                      <ellipse cx={turn * 12 - 6} cy={-90} rx={6} ry={5} fill="#fff" opacity={0.45} />
                    </>
                  )}
                </P>
                {hero && <circle cx={0} cy={-178} r={6} fill="#c2185b" />}
                {(hero || (p.blush ?? 0) > 0) && [-56, 56].map((x) => <ellipse key={x} cx={x} cy={hero ? -76 : -66} rx={hero ? 20 : 22} ry={hero ? 11 : 12} fill={hero ? "#f2788f" : "#f08a7a"} opacity={(hero ? 0.32 : 0) + 0.55 * (p.blush ?? 0)} />)}
                <P p={reveal.mouth}>
                  <g transform={`translate(${turn * 8},${hero ? -40 : -36})`}><Mouth p={p} /></g>
                </P>
              </g>
              {(p.sweat ?? 0) > 0 && <path d="M 100,-200 Q 92,-182 100,-172 Q 108,-182 100,-200 Z" fill="#7dd3fc" opacity={p.sweat} />}
            </g>
            {bones && <Bones pts={[[0, 0], [0, -150]]} />}
          </g>
          {!p.back && arms}
          {bones && <Bones pts={[[0, 0], spine(0.5), N, shoulderL, N, shoulderR]} />}
        </g>
      </g>
    </g>
  );
};

// ---------- mannerism library (t = frames since the clip started) ----------
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const kf = (t: number, keys: [number, number][]) => interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), cl);
const S = (t: number, period: number) => Math.sin((t / period) * Math.PI * 2);

// ---------- motion engine: easing, pose blending, two-bone leg IK, planted-foot walk cycles ----------
export const easeInOut = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
/** Ease out with a small overshoot, so arms land with weight instead of snapping. */
export const easeBack = (u: number, k = 1.6) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 + (k + 1) * Math.pow(u - 1, 3) + k * Math.pow(u - 1, 2));
const NUM: (keyof FPose)[] = ["wristL", "wristR", "bodyTurn", "spineS", "hipX", "hipY", "lean", "hipTilt", "bend", "twist", "shrug", "shrugL", "shrugR", "tilt", "neck", "turn", "browL", "browR", "knit", "lookX", "lookY", "lid", "squint", "eyeSize", "shut", "winkL", "winkR", "mw", "mo", "smile", "skew", "pucker", "lipOut", "toeL", "toeR", "blush", "sweat"];
const PAIR: (keyof FPose)[] = ["armL", "armR", "legL", "legR", "armLs", "armRs", "legLs", "legRs"];
const DEF: Partial<Record<keyof FPose, number | [number, number]>> = { spineS: 1, armLs: [1, 1], armRs: [1, 1], legLs: [1, 1], legRs: [1, 1], eyeSize: 1, mw: 0.6, smile: 0.2, armL: [14, 18], armR: [-14, -18], legL: [6, 0], legR: [-6, 0] };
/** Blend two poses (u = 0 -> a, 1 -> b). Hands/flags switch at the halfway point. */
export const mix = (a: FPose, b: FPose, u: number): FPose => {
  const out: FPose = { ...(u < 0.5 ? a : b) };
  const o = out as Record<string, unknown>, A_ = a as Record<string, unknown>, B_ = b as Record<string, unknown>, D = DEF as Record<string, unknown>;
  for (const k of NUM) {
    const x = (A_[k] ?? D[k] ?? 0) as number, y = (B_[k] ?? D[k] ?? 0) as number;
    o[k] = x + (y - x) * u;
  }
  for (const k of PAIR) {
    const x = (A_[k] ?? D[k]) as [number, number], y = (B_[k] ?? D[k]) as [number, number];
    o[k] = [x[0] + (y[0] - x[0]) * u, x[1] + (y[1] - x[1]) * u];
  }
  return out;
};
/** Cartoon exaggeration: push every pose further from rest (arms, wrists, lean, spine, hips, shoulders, crouch)
 * so movements read clearly on a phone. k = 1 leaves the pose unchanged. */
export const exaggerate = (p: FPose, k = 1.45): FPose => {
  const arm = (a: [number, number] | undefined, rest: [number, number]): [number, number] | undefined => {
    if (!a) return a;
    const up = rest[0] + (a[0] - rest[0]) * k, lo = rest[1] + (a[1] - rest[1]) * k;
    return [Math.max(-172, Math.min(172, up)), Math.max(-160, Math.min(160, lo))]; // past vertical, raised arms would cross over the head
  };
  const sc = (v: number | undefined, m = k, lim = 999) => (v === undefined ? v : Math.max(-lim, Math.min(lim, v * m)));
  return {
    ...p, armL: arm(p.armL, [14, 18]), armR: arm(p.armR, [-14, -18]), wristL: sc(p.wristL, 1.6, 80), wristR: sc(p.wristR, 1.6, 80),
    lean: sc(p.lean, k, 32), bend: sc(p.bend, k, 22), hipTilt: sc(p.hipTilt, k, 22), twist: sc(p.twist, k, 1), tilt: sc(p.tilt, 1.25, 30),
    shrug: sc(p.shrug, k, 1), shrugL: sc(p.shrugL, k, 1), shrugR: sc(p.shrugR, k, 1), hipX: sc(p.hipX, 1.2, 60),
  };
};

/** Overlapping action + follow-through for any pose function of time (pure: samples the past, no state, so it
 * renders identically in parallel). Forearms trail the upper arms by ~1 frame, hands/wrists by ~2, the head by
 * ~2, and each trailing part overshoots in the direction it was moving (spring-like settle). */
/**
 * Secondary motion as damped springs driven by the body's own movement over the last ~1.2 s: the braid is a
 * two-mass pendulum (root swings with the head's sideways acceleration, the tip lags the root), the skirt hem
 * swings with the pelvis, earrings jiggle fast with the head. Stateless: re-simulated from history every frame.
 */
const secondary = (pf: (t: number) => FPose, t: number, n = 36, dt = 1 / 30) => {
  const R = Math.PI / 180;
  const headX = (q: FPose) => (q.hipX ?? 0) + 300 * Math.sin(((q.lean ?? 0) + 0.5 * (q.bend ?? 0)) * R) + 2.2 * (q.tilt ?? 0);
  const hipX = (q: FPose) => (q.hipX ?? 0) + 1.5 * (q.hipTilt ?? 0);
  const hx: number[] = [], px: number[] = [];
  for (let i = n + 1; i >= 0; i--) { const q = pf(t - i * dt); hx.push(headX(q)); px.push(hipX(q)); }
  let a1 = 0, v1 = 0, a2 = 0, v2 = 0, sk = 0, vs = 0, er = 0, ve = 0;
  const w1 = 9.5, z1 = 0.22, w2 = 7, z2 = 0.3, ws = 13, zs = 0.35, we = 19, ze = 0.12, h = dt / 2;
  for (let i = 1; i < hx.length - 1; i++) {
    const ah = (hx[i + 1] - 2 * hx[i] + hx[i - 1]) / (dt * dt), ap = (px[i + 1] - 2 * px[i] + px[i - 1]) / (dt * dt);
    for (let k = 0; k < 2; k++) { // two substeps, semi-implicit Euler
      v1 += h * (-w1 * w1 * a1 - 2 * z1 * w1 * v1 - 0.55 * ah); a1 += h * v1;
      v2 += h * (-w2 * w2 * (a2 - a1) - 2 * z2 * w2 * (v2 - v1)); a2 += h * v2;
      vs += h * (-ws * ws * sk - 2 * zs * ws * vs - 0.9 * ap); sk += h * vs;
      ve += h * (-we * we * er - 2 * ze * we * ve - 2.2 * ah); er += h * ve;
    }
  }
  const c = (x: number, m: number) => Math.max(-m, Math.min(m, x));
  return { hairA: c(a1, 18), hairB: c(a2, 26), skirtS: c(sk, 30), earS: c(er, 30) };
};

export const follow = (pf: (t: number) => FPose, t: number, dt = 1 / 30, phys = false): FPose => {
  const p = pf(t), a = pf(t - dt), b = pf(t - 2 * dt), c = pf(t - 3 * dt);
  const lag = (cur?: [number, number], p1?: [number, number], p2?: [number, number]): [number, number] | undefined => {
    if (!cur || !p1 || !p2) return cur;
    const vel = cur[0] - p1[0]; // upper arm speed (deg/frame)
    // forearm: delayed by one frame relative to the upper arm, plus overshoot opposite to the upper arm's motion
    const lo = 0.4 * p1[1] + 0.6 * cur[1] - Math.max(-22, Math.min(22, vel * 0.35)); // capped: a fast raise must not fold the hand onto the face
    return [cur[0], Math.max(-170, Math.min(170, lo))];
  };
  const head = (x?: number, y?: number, z?: number) => (x === undefined ? x : 0.55 * x + 0.3 * (y ?? x) + 0.15 * (z ?? x));
  return {
    ...p, armL: lag(p.armL, a.armL, b.armL), armR: lag(p.armR, a.armR, b.armR),
    wristL: (p.wristL ?? 0) - 0.6 * ((p.armL?.[1] ?? 0) - (a.armL?.[1] ?? 0)) - 0.4 * ((a.armL?.[1] ?? 0) - (b.armL?.[1] ?? 0)),
    wristR: (p.wristR ?? 0) - 0.6 * ((p.armR?.[1] ?? 0) - (a.armR?.[1] ?? 0)) - 0.4 * ((a.armR?.[1] ?? 0) - (b.armR?.[1] ?? 0)),
    tilt: head(a.tilt, b.tilt, c.tilt), turn: head(a.turn, b.turn, c.turn),
    swayX: ((p.hipX ?? 0) - (a.hipX ?? 0)) * 4 + ((p.lean ?? 0) - (b.lean ?? 0)) * 1.2, // feeds the braid pendulum
    ...(phys ? secondary(pf, t) : {}),
  };
};

/** Move from one pose to another over `dur` frames starting at `at`, with overshoot. */
export const trans = (t: number, from: FPose, to: FPose, at: number, dur = 12) => mix(from, to, easeBack((t - at) / dur));

const L1 = 200, L2 = 195; // thigh, shin (hip joint -> knee -> ankle)
/** Two-bone IK: angles that put the ankle at (dx, dy) from the hip joint (dy down), knee pointing toward `dir`. */
export const legIK = (dx: number, dy: number, dir = 1): [number, number] => {
  const d = Math.min(L1 + L2 - 0.5, Math.max(40, Math.hypot(dx, dy)));
  const base = (Math.atan2(-dx, dy) * 180) / Math.PI;
  const a = (Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)) * 180) / Math.PI;
  const g = (Math.acos((L2 * L2 + d * d - L1 * L1) / (2 * L2 * d)) * 180) / Math.PI;
  return [base - a * dir, (a + g) * dir];
};
const fr = (x: number) => x - Math.floor(x);

type Gait = { P: number; S: number; H: number; base: number; bob: number; stance: number; heel: number; arm: number; elbow: number; lean: number; tiltA: number; twistA: number; hunch: number; tip?: boolean };
const GAIT: Record<"walk" | "march" | "tiptoe", Gait> = {
  walk: { P: 34, S: 95, H: 46, base: 14, bob: 9, stance: 0.6, heel: 18, arm: 20, elbow: 16, lean: 4, tiltA: 5, twistA: 0.35, hunch: 0 },
  march: { P: 30, S: 110, H: 30, base: 5, bob: 5, stance: 0.58, heel: 26, arm: 34, elbow: 85, lean: -3, tiltA: 7, twistA: 0.18, hunch: -0.05 },
  tiptoe: { P: 44, S: 62, H: 120, base: 44, bob: 8, stance: 0.55, heel: 0, arm: 8, elbow: 125, lean: 15, tiltA: 6, twistA: 0.25, hunch: 0.4, tip: true },
};
/** Distance travelled after t frames, in rig units (multiply by the render scale). Keeps the planted foot still. */
export const walkDist = (t: number, kind: keyof typeof GAIT = "walk") => (2 * GAIT[kind].S * t) / GAIT[kind].P;

/** One foot through the cycle: forward offset, lift and toe angle at phase ph (0 = heel strike). */
const foot = (ph: number, g: Gait) => {
  const a = g.S * g.stance;
  if (ph < g.stance) {
    const u = ph / g.stance;
    const heelUp = g.tip ? 1 : Math.max(0, (u - 0.72) / 0.28);
    const toe = g.tip ? -32 : u < 0.2 ? g.heel * (1 - u / 0.2) : -26 * heelUp;
    return { x: a * (1 - 2 * u), lift: (g.tip ? 22 : 0) + 20 * heelUp * (g.tip ? 0 : 1), toe };
  }
  const u = (ph - g.stance) / (1 - g.stance);
  const toe = g.tip ? -32 : u < 0.35 ? -26 * (1 - u / 0.35) : g.heel * ((u - 0.35) / 0.65);
  return { x: -a + 2 * a * easeInOut(u), lift: (g.tip ? 22 : 0) + g.H * Math.sin(Math.PI * u) + (g.tip ? 0 : 20 * (1 - u) * (1 - u) * 0.5), toe };
};

/** Gait pose with planted feet, hip bob, counter-swinging arms with elbow lag. dir: 1 = walking right. */
const gait = (t: number, dir: number, kind: keyof typeof GAIT): FPose => {
  const g = GAIT[kind];
  const ph = fr(t / g.P);
  const L = foot(ph, g), R = foot(fr(ph + 0.5), g);
  const down = g.base + g.bob * Math.cos(2 * Math.PI * 2 * (ph - 0.08));
  const reach = (fx: number, lift: number): [number, number] => legIK(fx * dir, L1 + L2 - down - lift, dir);
  // arms swing against the same-side leg; the forearm trails the upper arm a little
  const swing = (p0: number, lag: number) => -Math.cos(2 * Math.PI * (p0 - lag));
  const arm = (p0: number): [number, number] => {
    const up = swing(p0, 0), lo = swing(p0, 0.07);
    return kind === "walk" ? [-dir * g.arm * up, -dir * (g.elbow + 14 * Math.max(0, lo))] : kind === "march" ? [-dir * g.arm * up, -dir * g.elbow] : [-dir * (42 + 6 * up), -dir * (78 - 8 * lo)];
  };
  return {
    still: true, turn: 0.6 * dir, hipY: down,
    hipTilt: -g.tiltA * Math.cos(2 * Math.PI * (ph - 0.8)), bend: 0.55 * g.tiltA * Math.cos(2 * Math.PI * (ph - 0.86)), twist: g.twistA * Math.sin(2 * Math.PI * ph),
    shrugL: g.hunch + 0.07 * Math.max(0, -Math.cos(2 * Math.PI * ph)), shrugR: g.hunch + 0.07 * Math.max(0, Math.cos(2 * Math.PI * ph)), lean: dir * (g.lean + 1.2 * Math.cos(4 * Math.PI * ph)), tilt: -dir * 1.5 * Math.cos(4 * Math.PI * ph),
    legL: reach(L.x, L.lift), legR: reach(R.x, R.lift), toeL: L.toe, toeR: R.toe,
    armL: arm(fr(ph + 0.5)), armR: arm(ph), handL: kind === "march" ? "fist" : kind === "tiptoe" ? "paw" : "open", handR: kind === "march" ? "fist" : kind === "tiptoe" ? "paw" : "open",
    lookX: 0.6 * dir,
  };
};

/** Relaxed natural walk. ~34-frame cycle, foot down every 17 frames. */
export const walk = (t: number, dir = 1): FPose => ({ ...gait(t, dir, "walk"), mw: 0.5, smile: 0.25 });

/** Standing idle with a slow weight shift (one leg straight, the other knee soft) and breathing. */
export const idle = (t: number): FPose => {
  const w = 0.5 + 0.5 * Math.sin((t / 210) * Math.PI * 2); // 0 = weight on left, 1 = on right
  const hipX = -8 + 16 * w;
  const lean = (d: number) => (Math.atan2(d, 395) * 180) / Math.PI; // keeps each foot where it stands
  return {
    hipX, lean: (w - 0.5) * -3, hipTilt: -(w - 0.5) * 10, bend: (w - 0.5) * 7, twist: 0.12 * Math.sin(t / 70),
    legL: [lean(hipX + 6) - 5 * w, 10 * w], legR: [lean(hipX - 6) + 5 * (1 - w), -10 * (1 - w)], toeL: -6 * w, toeR: -6 * (1 - w),
    armL: [10 + 2 * Math.sin(t / 30), 14 + 3 * Math.sin(t / 30 - 0.6)], armR: [-10 - 2 * Math.sin(t / 30), -14 - 3 * Math.sin(t / 30 - 0.6)],
    browL: 0.05 * S(t, 90), browR: 0.05 * S(t + 20, 90), lookX: 0.15 * S(t, 140), tilt: 2 * S(t, 120) - (w - 0.5) * 3,
  };
};

/** Stiff, proud march: long straight-legged strides, chin up, elbows locked at 90 degrees. ~30-frame cycle. */
export const stiffWalk = (t: number, dir = 1): FPose => ({ ...gait(t, dir, "march"), tilt: -5 * dir, browL: 0.35, browR: 0.35, lid: 0.35, mw: 0.4, smile: 0.1 });

/** Exaggerated tiptoe sneak: on the balls of the feet, knees high, hunched, hands up like paws, eyes darting. */
export const tiptoe = (t: number, dir = 1): FPose => ({
  ...gait(t, dir, "tiptoe"), neck: -10, tilt: 6 * dir,
  lookX: Math.sign(S(t, 52)) * 0.9, browL: 0.6, browR: 0.6, eyeSize: 1.15, mw: 0.3, mo: 0, smile: -0.2, skew: 0.4 * dir,
});

/** The independent eyebrow wiggle, with a sideways smirk. */
export const browWiggle = (t: number): FPose => ({
  browL: S(t, 14), browR: -S(t, 14), lookX: 0.3, tilt: 5, skew: 0.8, smile: 0.4, mw: 0.5, lid: 0.25, shrugL: 0.12 * Math.max(0, S(t, 14)), shrugR: 0.12 * Math.max(0, -S(t, 14)), bend: 3, twist: -0.15,
  armL: [20, 160], handL: "point", armR: [-14, -18],
});

/** Casual glance away, then the head snaps back with a stretched neck, wide eyes, brows up. 60 frames. */
export const doubleTake = (t: number): FPose => {
  const snap = kf(t, [[30, 0], [34, 1]]);
  const look = t < 30 ? kf(t, [[0, 0], [10, 1]]) : 1 - snap;
  return {
    turn: 0.7 * look, lookX: look, neck: 36 * snap * kf(t, [[34, 1], [56, 0.4]]), tilt: -6 * snap,
    eyeSize: 1 + 0.35 * snap, browL: snap ? 1 : 0.1, browR: snap ? 1 : 0.1, mo: 0.5 * snap, mw: 0.35, smile: 0.2 - 0.4 * snap,
    hipY: -10 * snap, shrug: 0.55 * snap * kf(t, [[34, 1], [56, 0.5]]), twist: 0.35 * look, bend: -4 * snap, armL: [14 + 60 * snap, 18 + 70 * snap], armR: [-14 - 60 * snap, -18 - 70 * snap],
  };
};

/** Chin up, eyes shut, smug closed grin, hands on hips, a satisfied bounce. */
export const smugGrin = (t: number): FPose => ({
  tilt: -8 + 2 * S(t, 30), shut: 1, smile: 0.9, mw: 0.85, mo: 0, skew: 0.15, browL: 0.5, browR: 0.5, neck: 8, hipY: -4 * Math.abs(S(t, 30)), breath: 1, lean: -3, bend: 2.5 * S(t, 60), hipTilt: -2.5 * S(t, 60), shrug: -0.08,
  armL: [38, -82], armR: [-38, 82], handL: "fist", handR: "fist", blush: 0.4,
});

/** Hands behind the back, rocking heel-to-toe, looking up, whistling. */
export const innocent = (t: number): FPose => {
  const s = S(t, 40);
  return {
    back: true, armL: [-24, -20], armR: [24, 20], handL: "fist", handR: "fist", lookY: -0.9, lookX: 0.4 * S(t, 80),
    pucker: 1, mo: 0.2, browL: 0.7, browR: 0.7, tilt: 6 * S(t, 80), twist: 0.2 * S(t, 80), bend: 3 * S(t, 80), hipTilt: -2 * S(t, 80), shrug: 0.1, toeL: 12 * Math.max(0, s), toeR: 12 * Math.max(0, s), hipY: -8 * Math.max(0, s),
  };
};

/** Lean sideways and peek, one eye squinting. */
export const peek = (t: number, dir = 1): FPose => ({
  lean: 12 * dir * kf(t, [[0, 0], [14, 1]]), bend: 18 * dir * kf(t, [[0, 0], [16, 1]]), hipTilt: -5 * dir * kf(t, [[0, 0], [14, 1]]), shrug: 0.3, turn: 0.5 * dir, lookX: dir, winkL: dir > 0 ? 1 : 0, winkR: dir < 0 ? 1 : 0,
  browL: 0.8, browR: -0.4, knit: 0.2, mw: 0.25, skew: -0.6 * dir, armL: [40, 120], armR: [-40, -120], handL: "paw", handR: "paw",
});

/** Startled jump back: O mouth, wide eyes, arms flung up. */
export const shock = (t: number): FPose => {
  const j = kf(t, [[0, 0], [6, 1], [20, 0.6]]);
  return { hipY: -40 * Math.sin(Math.min(1, t / 14) * Math.PI), lean: -6 * j, bend: -4 * j, shrug: 0.9 * j, breath: 1, eyeSize: 1.4, browL: 1, browR: 1, mo: 0.8, mw: 0.3, smile: -0.3, armL: [150 * j, 20], armR: [-150 * j, -20], handL: "open", handR: "open", neck: 20 * j };
};

/** Arms crossed, lower lip out, brows knitted, head turned away. */
export const pout = (t: number): FPose => ({
  turn: -0.5, tilt: 8, knit: 1, browL: -0.6, browR: -0.6, lookX: 0.9, lipOut: 0.8, smile: -0.6, mw: 0.35, shrug: 0.25 + 0.03 * S(t, 40), twist: -0.35, bend: -3, hipTilt: 3,
  armL: [6, -102], armR: [-6, 102], handL: "fist", handR: "fist", lid: 0.3 + 0.05 * S(t, 30),
});

/** Friendly wave: arm swings up with overshoot, forearm waves from the elbow, hand trails. */
export const wave = (t: number): FPose => {
  const up = easeBack(t / 14);
  return { ...idle(t), armL: [14 + 136 * up, 18 + (12 + 28 * Math.sin(t / 3.5)) * up], handL: "open", smile: 0.7, mw: 0.7, browL: 0.4, browR: 0.4, tilt: 6 * up, bend: 5 * up + 1.5 * Math.sin(t / 3.5) * up, shrugL: 0.35 * up, twist: -0.15 * up };
};

/** "Who, me?" shrug: forearms out, palms up, head tilt, brows up, flat mouth. */
/** "This one... or that one?": hand on chin, gaze dwells on one side then swings to the other, head tilts and brows
 *  trade with each swing, mouth skews into a "hmm". One full this/that cycle = period frames. */
export const ponder = (t: number, period = 56): FPose => {
  const ph = (t / period) % 1;
  const sm = (x: number) => x * x * (3 - 2 * x);
  // dwell, quick swing, dwell, quick swing back: side -1 (screen-left) .. 1 (screen-right)
  const side = ph < 0.38 ? -1 : ph < 0.5 ? -1 + 2 * sm((ph - 0.38) / 0.12) : ph < 0.88 ? 1 : 1 - 2 * sm((ph - 0.88) / 0.12);
  const tap = Math.max(0, Math.sin((t / 9) * Math.PI)); // finger tapping the chin
  return {
    ...idle(t), turn: 0.45 * side, lookX: 0.9 * side, lookY: -0.15, neck: -18, tilt: 9 * side, twist: 0.12 * side, lean: 2 * side, bend: 2 * side,
    browL: side < 0 ? 0.8 : -0.2, browR: side < 0 ? -0.2 : 0.8, knit: 0.3, lid: 0.2, squint: 0.2,
    mw: 0.25, mo: 0.08, smile: -0.1, skew: -0.7 * side, pucker: 0.35,
    armR: [14, 150 + 4 * tap], handR: "fist", wristR: -10, armL: [22, -110], handL: "fist", shrugR: 0.4,
  };
};
export const shrug = (t: number): FPose => {
  const u = easeBack(t / 12);
  return { ...idle(t), hipY: 6 - 10 * u, armL: [14 + 22 * u, 18 + 52 * u], armR: [-14 - 22 * u, -18 - 52 * u], handL: "open", handR: "open", tilt: 10 * u, browL: 0.9 * u, browR: 0.6 * u, mw: 0.35, smile: -0.2 * u, skew: 0.3 * u, shrug: 0.95 * u, bend: 3 * u, breath: 0.5 + 0.5 * u };
};
