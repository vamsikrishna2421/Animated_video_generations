import React from "react";
import { Img, staticFile } from "remotion";
import { FPose } from "./Fumble";

// Sol-generated heroine (user-supplied art) as a 2D cutout puppet driven by the same FPose as the vector rig.
// Layers come from pipeline/cutout_heroine.py and share the 800x1024 source canvas, so every part is drawn at
// the origin and rotated about its real joint (pixel coordinates below). Origin of this component = between the
// feet on the floor, scaled so she stands as tall as Mr. Fumble.
const J = { neck: [497, 214], waist: [500, 442], shL: [366, 312], elL: [316, 425], shR: [598, 314], elR: [640, 422], floor: [500, 985] };
const REST = { upL: 22.5, loL: 18.4, upR: -20.3, loR: -14.5 }; // bone angles in the source picture (rig convention)
const L = (n: string) => staticFile(`yesh/sol/${n}.png`);
const Part: React.FC<{ n: string }> = ({ n }) => <image href={L(n)} x={0} y={0} width={800} height={1024} />;
const rot = (deg: number, [x, y]: number[]) => `rotate(${deg} ${x} ${y})`;

export const SolHeroine: React.FC<{ f: number; p: FPose; scale?: number }> = ({ f, p, scale = 1.12 }) => {
  const aL = p.armL ?? [14, 18], aR = p.armR ?? [-14, -18];
  const lean = (p.lean ?? 0) + 0.6 * (p.bend ?? 0);
  const upL = aL[0] - REST.upL, upR = aR[0] - REST.upR; // upper-arm rotation from the picture's rest pose
  const fl = aL[0] + aL[1] - REST.loL - upL, fr = aR[0] + aR[1] - REST.loR - upR; // forearm, relative to the upper arm
  const drop = Math.max(0, p.hipY ?? 0) * 0.55; // crouch: the skirt hides the knees, so sink the whole body a little
  const sway = (p.hipTilt ?? 0) * 0.5 + 3 * Math.sin(f / 11);
  const spin = p.bodyTurn ?? 0;
  const sx = Math.abs(spin) > 0.05 ? Math.max(0.25, Math.cos(Math.asin(Math.min(1, Math.abs(spin))))) * (spin < -0.95 ? -1 : 1) : 1;
  const breath = 1 + 0.008 * Math.sin(f / 22);
  const shrugL = -14 * (p.shrugL ?? 0) - 14 * (p.shrug ?? 0), shrugR = -14 * (p.shrugR ?? 0) - 14 * (p.shrug ?? 0);
  const arm = (s: "L" | "R") => {
    const up = s === "L" ? upL : upR, lo = s === "L" ? fl : fr, sh = s === "L" ? J.shL : J.shR, el = s === "L" ? J.elL : J.elR;
    return (
      <g transform={`translate(0,${s === "L" ? shrugL : shrugR}) ${rot(up, sh)}`}>
        <g transform={rot(lo, el)}><Part n={`arm${s}_lo`} /></g>
        <Part n={`arm${s}_up`} />
      </g>
    );
  };
  return (
    <g transform={`scale(${scale * sx},${scale}) translate(${-J.floor[0]},${-J.floor[1] + drop})`}>
      <ellipse cx={J.floor[0]} cy={J.floor[1] - drop} rx={250} ry={26} fill="#000" opacity={0.25} />
      <g transform={`${rot(sway * 0.4, J.waist)} skewX(${sway * 0.25})`} style={{ transformOrigin: `${J.waist[0]}px ${J.waist[1]}px` }}><Part n="skirt" /></g>
      <g transform={`${rot(lean, J.waist)} translate(${J.waist[0] * (1 - breath)},${J.waist[1] * (1 - breath)}) scale(${breath})`}>
        {arm("R")}
        <Part n="upper" />
        <g transform={rot((p.tilt ?? 0) * 0.7 + (p.turn ?? 0) * 6, J.neck)}><Part n="head" /></g>
        {arm("L")}
      </g>
    </g>
  );
};

// ---------- male lead (Sol art) with legs: same FPose, legs rotate at hip and knee ----------
const M = { neck: [295, 195], hipL: [230, 530], hipR: [352, 530], knL: [195, 720], knR: [435, 720], shL: [167, 250], elL: [120, 420], shR: [428, 250], elR: [485, 415], waist: [291, 470], floor: [295, 975] };
const MR = { upL: 14.8, loL: 21.8, upR: -18.4, loR: -21.8, thL: 10.4, shL: 17.0, thR: -24.1, shR: -22.6 };
const MP: React.FC<{ n: string }> = ({ n }) => <image href={staticFile(`yesh/solm/${n}.png`)} x={0} y={0} width={680} height={1024} />;

export const SolHero: React.FC<{ f: number; p: FPose; scale?: number }> = ({ f, p, scale = 1.0 }) => {
  const aL = p.armL ?? [14, 18], aR = p.armR ?? [-14, -18], lL = p.legL ?? [6, 0], lR = p.legR ?? [-6, 0];
  const upL = aL[0] - MR.upL, upR = aR[0] - MR.upR;
  const foL = aL[0] + aL[1] - MR.loL - upL, foR = aR[0] + aR[1] - MR.loR - upR;
  const thL = lL[0] - MR.thL, thR = lR[0] - MR.thR;
  const knL = lL[0] + lL[1] - MR.shL - thL, knR = lR[0] + lR[1] - MR.shR - thR;
  const drop = (p.hipY ?? 0) * 0.95, hx = (p.hipX ?? 0) * 0.9;
  const lean = (p.lean ?? 0) + 0.6 * (p.bend ?? 0);
  const shL = -14 * ((p.shrugL ?? 0) + (p.shrug ?? 0)), shR = -14 * ((p.shrugR ?? 0) + (p.shrug ?? 0));
  const spin = p.bodyTurn ?? 0;
  const sx = Math.max(0.35, 1 - 0.65 * Math.abs(spin));
  const leg = (s: "L" | "R") => (
    <g transform={rot(s === "L" ? thL : thR, s === "L" ? M.hipL : M.hipR)}>
      <g transform={rot(s === "L" ? knL : knR, s === "L" ? M.knL : M.knR)}><MP n={`leg${s}_sh`} /></g>
      <MP n={`leg${s}_th`} />
    </g>
  );
  const arm = (s: "L" | "R") => (
    <g transform={`translate(0,${s === "L" ? shL : shR}) ${rot(s === "L" ? upL : upR, s === "L" ? M.shL : M.shR)}`}>
      <g transform={rot(s === "L" ? foL : foR, s === "L" ? M.elL : M.elR)}><MP n={`arm${s}_lo`} /></g>
      <MP n={`arm${s}_up`} />
    </g>
  );
  return (
    <g transform={`scale(${scale * sx},${scale}) translate(${-M.floor[0]},${-M.floor[1]})`}>
      <ellipse cx={M.floor[0]} cy={M.floor[1]} rx={230} ry={24} fill="#000" opacity={0.25} />
      <g transform={`translate(${hx},${drop})`}>
        {leg("L")}{leg("R")}
        <g transform={rot(lean, M.waist)}>
          {arm("R")}
          <MP n="torso" />
          <g transform={rot((p.tilt ?? 0) * 0.7 + (p.turn ?? 0) * 6, M.neck)}><MP n="head" /></g>
          {arm("L")}
        </g>
      </g>
    </g>
  );
};
