import React from "react";
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
const C = FC_;

export type Hand = "open" | "fist" | "point" | "thumb" | "paw";
export type FPose = {
  hipY?: number; lean?: number; // crouch (px, + = down), torso lean (deg, + = toward screen-right)
  tilt?: number; neck?: number; turn?: number; // head tilt (deg), neck stretch (px), face turn (-1 left .. 1 right)
  browL?: number; browR?: number; knit?: number; // brow raise -1..1 each (screen-left / screen-right eye), frown 0..1
  lookX?: number; lookY?: number; lid?: number; squint?: number; eyeSize?: number; shut?: number; // shut: 0..1 per both (1 = closed happy arcs)
  winkL?: number; winkR?: number;
  mw?: number; mo?: number; smile?: number; skew?: number; pucker?: number; lipOut?: number; // mouth width/open/smile/skew/pucker/pout
  armL?: [number, number]; armR?: [number, number]; handL?: Hand; handR?: Hand; back?: boolean; // arms behind the torso
  legL?: [number, number]; legR?: [number, number]; toeL?: number; toeR?: number; // thigh, knee (deg); toe lift (deg)
  blush?: number; sweat?: number;
};
export type FReveal = Partial<Record<"shoes" | "legs" | "torso" | "vest" | "tie" | "armL" | "armR" | "head" | "ears" | "hair" | "eyes" | "brows" | "nose" | "mouth", number>>;

const r = (d: number) => (d * Math.PI) / 180;
const pt = (x: number, y: number, a: number, len: number): [number, number] => [x - len * Math.sin(r(a)), y + len * Math.cos(r(a))];

const HandShape: React.FC<{ x: number; y: number; a: number; kind: Hand; flip: number }> = ({ x, y, a, kind, flip }) => (
  <g transform={`translate(${x},${y}) rotate(${a})`}>
    {kind === "point" && <line x1={0} y1={0} x2={0} y2={46} stroke={C.skin} strokeWidth={12} strokeLinecap="round" />}
    {kind === "thumb" && <line x1={0} y1={0} x2={-30 * flip} y2={-16} stroke={C.skin} strokeWidth={12} strokeLinecap="round" />}
    {kind === "open" && [-12, -4, 4, 12].map((d) => <line key={d} x1={d} y1={8} x2={d * 1.3} y2={34} stroke={C.skin} strokeWidth={9} strokeLinecap="round" />)}
    {kind === "paw" && <path d="M -16,6 Q 0,30 16,6" stroke={C.skin} strokeWidth={12} fill="none" strokeLinecap="round" />}
    <circle cx={0} cy={8} r={kind === "fist" || kind === "thumb" ? 19 : 17} fill={C.skin} stroke={C.skinDark} strokeWidth={2} />
    {kind !== "paw" && kind !== "thumb" && <line x1={-14 * flip} y1={4} x2={-24 * flip} y2={16} stroke={C.skin} strokeWidth={10} strokeLinecap="round" />}
  </g>
);

const Arm: React.FC<{ x: number; y: number; a: [number, number]; hand: Hand; flip: number; bones?: boolean }> = ({ x, y, a, hand, flip, bones }) => {
  const [ex, ey] = pt(x, y, a[0], 130);
  const [hx, hy] = pt(ex, ey, a[0] + a[1], 120);
  return (
    <g>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={C.shirt} strokeWidth={38} strokeLinecap="round" />
      <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={C.shirt} strokeWidth={34} strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={15} fill={C.shirtDark} opacity={0.4} />
      <line x1={hx - 15 * Math.cos(r(a[0] + a[1]))} y1={hy - 15 * Math.sin(r(a[0] + a[1]))} x2={hx + 15 * Math.cos(r(a[0] + a[1]))} y2={hy + 15 * Math.sin(r(a[0] + a[1]))} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      <HandShape x={hx} y={hy} a={a[0] + a[1]} kind={hand} flip={flip} />
      {bones && <Bones pts={[[x, y], [ex, ey], [hx, hy]]} />}
    </g>
  );
};

const Leg: React.FC<{ x: number; y: number; a: [number, number]; toe: number; dir: number; bones?: boolean; p?: number; ps?: number }> = ({ x, y, a, toe, dir, bones, p, ps }) => {
  const [kx, ky] = pt(x, y, a[0], 200);
  const [ax, ay] = pt(kx, ky, a[0] + a[1], 195);
  const [sx, sy] = pt(kx, ky, a[0] + a[1], 170);
  return (
    <g>
      <Part p={p}>
        <line x1={x} y1={y} x2={kx} y2={ky} stroke={C.trousers} strokeWidth={56} strokeLinecap="round" />
        <line x1={kx} y1={ky} x2={sx} y2={sy} stroke={C.trousers} strokeWidth={50} strokeLinecap="round" />
        <line x1={sx} y1={sy} x2={ax} y2={ay} stroke={C.sock} strokeWidth={30} strokeLinecap="round" />
      </Part>
      <Part p={ps}>
        <g transform={`translate(${ax},${ay + 6}) rotate(${-toe * dir})`}>
          <path d={`M ${-26 * dir},-14 Q ${-30 * dir},14 ${0},16 L ${58 * dir},16 Q ${78 * dir},14 ${70 * dir},-4 Q ${50 * dir},-20 ${10 * dir},-18 Z`} fill={C.shoe} />
          <path d={`M ${14 * dir},-12 Q ${44 * dir},-14 ${60 * dir},-4`} stroke={C.shoeHi} strokeWidth={5} fill="none" strokeLinecap="round" />
          <line x1={-26 * dir} y1={16} x2={74 * dir} y2={16} stroke="#3a2010" strokeWidth={6} strokeLinecap="round" />
        </g>
      </Part>
      {bones && <Bones pts={[[x, y], [kx, ky], [ax, ay]]} />}
    </g>
  );
};

const Bones: React.FC<{ pts: [number, number][] }> = ({ pts }) => (
  <g>
    <polyline points={pts.map((p) => p.join(",")).join(" ")} stroke="#22d3ee" strokeWidth={5} fill="none" />
    {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} fill="#0b1022" stroke="#22d3ee" strokeWidth={5} />)}
  </g>
);

const Eye: React.FC<{ x: number; s: number; p: FPose; blink: number; wink: number }> = ({ x, s, p, blink, wink }) => {
  const size = (p.eyeSize ?? 1) * s;
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
    </g>
  );
};

const Brow: React.FC<{ x: number; raise: number; knit: number; side: number }> = ({ x, raise, knit, side }) => {
  const y = -170 - 26 * raise;
  const inner = y + 14 * knit - 6 * Math.max(0, raise), outer = y - 4 * knit + 4 * Math.max(0, -raise);
  const ix = x - side * 26, ox = x + side * 26;
  return <path d={`M ${ix},${inner} Q ${x},${Math.min(inner, outer) - 12 - 6 * raise} ${ox},${outer}`} stroke={C.brow} strokeWidth={14} fill="none" strokeLinecap="round" />;
};

const Mouth: React.FC<{ p: FPose }> = ({ p }) => {
  const w = 18 + 30 * (p.mw ?? 0.6), o = p.mo ?? 0, sm = p.smile ?? 0.2, sk = p.skew ?? 0, pk = p.pucker ?? 0, out = p.lipOut ?? 0;
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
        <path d={`M ${-w},${yl} Q 0,${sm * 16} ${w},${yr}`} stroke={C.lip} strokeWidth={7} fill="none" strokeLinecap="round" />
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

export const Fumble: React.FC<{ f: number; p: FPose; reveal?: FReveal; bones?: boolean }> = ({ f, p, reveal = {}, bones }) => {
  const blink = f % 110 < 4 || f % 173 < 3 ? 0 : 1;
  const hipY = -410 + (p.hipY ?? 0) - 2 * Math.sin(f / 16);
  const turn = p.turn ?? 0;
  const dir = Math.abs(turn) > 0.35 ? Math.sign(turn) : 0;
  const legL = p.legL ?? [6, 0], legR = p.legR ?? [-6, 0];
  const armL = p.armL ?? [14, 18], armR = p.armR ?? [-14, -18];
  const SH = -300; // shoulders above the hip
  const arms = (
    <>
      <Part p={reveal.armR}><Arm x={88} y={SH + 22} a={armR} hand={p.handR ?? "open"} flip={-1} bones={bones} /></Part>
      <Part p={reveal.armL}><Arm x={-88} y={SH + 22} a={armL} hand={p.handL ?? "open"} flip={1} bones={bones} /></Part>
    </>
  );
  const fx = turn * 34; // face features slide with the turn
  return (
    <g>
      <ellipse cx={0} cy={6} rx={170} ry={22} fill="#000" opacity={0.16} />
      <g transform={`translate(0,${hipY})`}>
        <Leg x={-34} y={0} a={legL} toe={p.toeL ?? 0} dir={dir || -1} bones={bones} p={reveal.legs} ps={reveal.shoes} />
        <Leg x={34} y={0} a={legR} toe={p.toeR ?? 0} dir={dir || 1} bones={bones} p={reveal.legs} ps={reveal.shoes} />
        <g transform={`rotate(${p.lean ?? 0})`}>
          {p.back && arms}
          {/* torso: shirt, argyle vest, waistband */}
          <Part p={reveal.torso}>
            <path d={`M -76,10 L -92,${SH + 30} Q -96,${SH} -60,${SH - 6} L 60,${SH - 6} Q 96,${SH} 92,${SH + 30} L 76,10 Z`} fill={C.shirt} />
            <rect x={-80} y={-14} width={160} height={40} rx={10} fill={C.trousers} />
            <rect x={-80} y={-14} width={160} height={10} fill={C.trousersDark} />
          </Part>
          <Part p={reveal.vest}>
            <path d={`M -80,-8 L -88,${SH + 40} Q -86,${SH + 4} -54,${SH} L 0,${SH + 110} L 54,${SH} Q 86,${SH + 4} 88,${SH + 40} L 80,-8 Q 0,6 -80,-8 Z`} fill={C.vest} />
            <g opacity={0.85}>
              {[-50, 0, 50].map((cx) => [-70, -170].map((cy) => (
                <path key={`${cx}${cy}`} d={`M ${cx},${cy - 44} L ${cx + 24},${cy} L ${cx},${cy + 44} L ${cx - 24},${cy} Z`} fill={(cx / 50 + cy / 100) % 2 ? C.vestDark : "none"} stroke={C.argyle} strokeWidth={3} />
              )))}
            </g>
            <path d={`M -80,-8 Q 0,6 80,-8`} stroke={C.vestDark} strokeWidth={10} fill="none" />
            {[SH + 140, SH + 190, SH + 240].map((y) => <circle key={y} cx={0} cy={y} r={6} fill={C.argyle} />)}
          </Part>
          {/* collar + bow tie */}
          <Part p={reveal.tie}>
            <path d={`M -34,${SH - 6} L 0,${SH + 30} L 34,${SH - 6} L 22,${SH - 22} L 0,${SH} L -22,${SH - 22} Z`} fill="#fff" stroke={C.shirtDark} strokeWidth={3} />
            <path d={`M 0,${SH + 4} L -34,${SH - 12} L -34,${SH + 20} Z M 0,${SH + 4} L 34,${SH - 12} L 34,${SH + 20} Z`} fill={C.tie} />
            <rect x={-8} y={SH - 4} width={16} height={16} rx={4} fill="#c2410c" />
          </Part>
          {/* neck + head */}
          <g transform={`translate(${turn * 6},${SH - 14 - (p.neck ?? 0)}) rotate(${p.tilt ?? 0})`}>
            <Part p={reveal.head}>
              <rect x={-24} y={-34} width={48} height={50 + (p.neck ?? 0)} fill={C.skinDark} />
            </Part>
            <g transform="translate(0,-26) scale(1.2) translate(0,8)">
              <Part p={reveal.ears}>
                <ellipse cx={-96 + Math.max(0, turn) * 18} cy={-112} rx={18} ry={28} fill={C.skin} stroke={C.skinDark} strokeWidth={3} opacity={turn > 0.6 ? 0 : 1} />
                <ellipse cx={96 + Math.min(0, turn) * 18} cy={-112} rx={18} ry={28} fill={C.skin} stroke={C.skinDark} strokeWidth={3} opacity={turn < -0.6 ? 0 : 1} />
              </Part>
              <Part p={reveal.head}>
                <path d="M -94,-140 Q -98,-250 0,-252 Q 98,-250 94,-140 Q 96,-60 64,-14 Q 34,16 0,16 Q -34,16 -64,-14 Q -96,-60 -94,-140 Z" fill={C.skin} />
                <path d="M -20,6 Q 0,14 20,6" stroke={C.skinDark} strokeWidth={4} fill="none" strokeLinecap="round" />
              </Part>
              <Part p={reveal.hair}>
                <path d={`M -98,-140 Q -104,-238 -40,-262 Q 10,-280 70,-258 Q 104,-240 98,-140 L 86,-170 Q 80,-214 ${30 + fx * 0.3},-222 L ${-20 + fx * 0.3},-210 Q -78,-206 -86,-170 Z`} fill={C.hair} />
                <path d={`M ${-20 + fx * 0.3},-262 L ${-28 + fx * 0.3},-214`} stroke="#5a4334" strokeWidth={4} strokeLinecap="round" />
              </Part>
              <g transform={`translate(${fx},0)`}>
                <Part p={reveal.eyes}>
                  <Eye x={-38} s={1 - Math.max(0, turn) * 0.25} p={p} blink={blink} wink={p.winkL ?? 0} />
                  <Eye x={38} s={1 + Math.min(0, turn) * 0.25} p={p} blink={blink} wink={p.winkR ?? 0} />
                </Part>
                <Part p={reveal.brows}>
                  <Brow x={-38} raise={p.browL ?? 0} knit={p.knit ?? 0} side={-1} />
                  <Brow x={38} raise={p.browR ?? 0} knit={p.knit ?? 0} side={1} />
                </Part>
                <Part p={reveal.nose}>
                  <ellipse cx={turn * 12} cy={-84} rx={20} ry={22} fill={C.skinDark} />
                  <ellipse cx={turn * 12 - 6} cy={-90} rx={6} ry={5} fill="#fff" opacity={0.45} />
                </Part>
                {(p.blush ?? 0) > 0 && [-62, 62].map((x) => <ellipse key={x} cx={x} cy={-66} rx={22} ry={12} fill="#f08a7a" opacity={0.55 * (p.blush ?? 0)} />)}
                <Part p={reveal.mouth}>
                  <g transform={`translate(${turn * 8},-36)`}><Mouth p={p} /></g>
                </Part>
              </g>
              {(p.sweat ?? 0) > 0 && <path d="M 100,-200 Q 92,-182 100,-172 Q 108,-182 100,-200 Z" fill="#7dd3fc" opacity={p.sweat} />}
            </g>
            {bones && <Bones pts={[[0, 0], [0, -150]]} />}
          </g>
          {!p.back && arms}
          {bones && <Bones pts={[[0, 0], [0, SH], [-88, SH + 22], [0, SH], [88, SH + 22]]} />}
        </g>
      </g>
    </g>
  );
};

// ---------- mannerism library (t = frames since the clip started) ----------
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const kf = (t: number, keys: [number, number][]) => interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), cl);
const S = (t: number, period: number) => Math.sin((t / period) * Math.PI * 2);

export const idle = (t: number): FPose => ({ browL: 0.05 * S(t, 90), browR: 0.05 * S(t + 20, 90), lookX: 0.15 * S(t, 140), tilt: 2 * S(t, 120) });

/** Stiff, proud march: barely-bent legs, chin up, elbows locked at 90 degrees, swinging. ~22-frame stride. */
export const stiffWalk = (t: number, dir = 1): FPose => {
  const s = S(t, 22);
  return {
    turn: 0.55 * dir, tilt: -4 * dir, hipY: -6 * Math.abs(s), lean: -3 * dir,
    legL: [24 * s * dir, 4], legR: [-24 * s * dir, 4], toeL: Math.max(0, 14 * s), toeR: Math.max(0, -14 * s),
    armL: [-30 * s * dir, -85 * dir], armR: [30 * s * dir, -85 * dir], handL: "fist", handR: "fist",
    browL: 0.35, browR: 0.35, lid: 0.35, mw: 0.4, smile: 0.1, lookX: 0.6 * dir,
  };
};

/** Exaggerated tiptoe sneak: hunched, knees high, hands up like paws, eyes darting. ~36-frame cycle. */
export const tiptoe = (t: number, dir = 1): FPose => {
  const ph = (t % 36) / 36, s = S(t, 36);
  const upL = ph < 0.5 ? Math.sin(ph * 2 * Math.PI) : 0, upR = ph >= 0.5 ? Math.sin((ph - 0.5) * 2 * Math.PI) : 0;
  return {
    turn: 0.6 * dir, lean: 14 * dir, hipY: 34 - 10 * Math.abs(s), neck: -10, tilt: 6 * dir,
    legL: [(-10 - 60 * upL) * dir, (10 + 100 * upL) * dir], legR: [(10 - 60 * upR) * dir, (10 + 100 * upR) * dir], toeL: -26, toeR: -26,
    armL: [(-100) * dir, 120 * dir], armR: [(-80) * dir, 120 * dir], handL: "paw", handR: "paw",
    lookX: Math.sign(S(t, 48)) * 0.9, browL: 0.6, browR: 0.6, eyeSize: 1.15, mw: 0.3, mo: 0, smile: -0.2, skew: 0.4 * dir,
  };
};

/** The independent eyebrow wiggle, with a sideways smirk. */
export const browWiggle = (t: number): FPose => ({
  browL: S(t, 14), browR: -S(t, 14), lookX: 0.3, tilt: 5, skew: 0.8, smile: 0.4, mw: 0.5, lid: 0.25,
  armL: [20, 160], handL: "point", armR: [-14, -18],
});

/** Casual glance away, then the head snaps back with a stretched neck, wide eyes, brows up. 60 frames. */
export const doubleTake = (t: number): FPose => {
  const snap = kf(t, [[30, 0], [34, 1]]);
  const look = t < 30 ? kf(t, [[0, 0], [10, 1]]) : 1 - snap;
  return {
    turn: 0.7 * look, lookX: look, neck: 36 * snap * kf(t, [[34, 1], [56, 0.4]]), tilt: -6 * snap,
    eyeSize: 1 + 0.35 * snap, browL: snap ? 1 : 0.1, browR: snap ? 1 : 0.1, mo: 0.5 * snap, mw: 0.35, smile: 0.2 - 0.4 * snap,
    hipY: -10 * snap, armL: [14 + 60 * snap, 18 + 70 * snap], armR: [-14 - 60 * snap, -18 - 70 * snap],
  };
};

/** Chin up, eyes shut, smug closed grin, hands on hips, a satisfied bounce. */
export const smugGrin = (t: number): FPose => ({
  tilt: -8 + 2 * S(t, 30), shut: 1, smile: 0.9, mw: 0.85, mo: 0, skew: 0.15, browL: 0.5, browR: 0.5, neck: 8, hipY: -4 * Math.abs(S(t, 30)),
  armL: [38, -82], armR: [-38, 82], handL: "fist", handR: "fist", blush: 0.4,
});

/** Hands behind the back, rocking heel-to-toe, looking up, whistling. */
export const innocent = (t: number): FPose => {
  const s = S(t, 40);
  return {
    back: true, armL: [-24, -20], armR: [24, 20], handL: "fist", handR: "fist", lookY: -0.9, lookX: 0.4 * S(t, 80),
    pucker: 1, mo: 0.2, browL: 0.7, browR: 0.7, tilt: 6 * S(t, 80), toeL: 12 * Math.max(0, s), toeR: 12 * Math.max(0, s), hipY: -8 * Math.max(0, s),
  };
};

/** Lean sideways and peek, one eye squinting. */
export const peek = (t: number, dir = 1): FPose => ({
  lean: 26 * dir * kf(t, [[0, 0], [14, 1]]), turn: 0.5 * dir, lookX: dir, winkL: dir > 0 ? 1 : 0, winkR: dir < 0 ? 1 : 0,
  browL: 0.8, browR: -0.4, knit: 0.2, mw: 0.25, skew: -0.6 * dir, armL: [40, 120], armR: [-40, -120], handL: "paw", handR: "paw",
});

/** Startled jump back: O mouth, wide eyes, arms flung up. */
export const shock = (t: number): FPose => {
  const j = kf(t, [[0, 0], [6, 1], [20, 0.6]]);
  return { hipY: -40 * Math.sin(Math.min(1, t / 14) * Math.PI), lean: -10 * j, eyeSize: 1.4, browL: 1, browR: 1, mo: 0.8, mw: 0.3, smile: -0.3, armL: [150 * j, 20], armR: [-150 * j, -20], handL: "open", handR: "open", neck: 20 * j };
};

/** Arms crossed, lower lip out, brows knitted, head turned away. */
export const pout = (t: number): FPose => ({
  turn: -0.5, tilt: 8, knit: 1, browL: -0.6, browR: -0.6, lookX: 0.9, lipOut: 0.8, smile: -0.6, mw: 0.35,
  armL: [6, -102], armR: [-6, 102], handL: "fist", handR: "fist", lid: 0.3 + 0.05 * S(t, 30),
});
