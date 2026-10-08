import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../../components/Fonts";
import { easeBack, FPose, Fumble, mix } from "../Fumble";
import { Extra, Extras, headTransform } from "../FumbleRasa";

// Mr. Fumble's half of the "Navarasalu rapid fire" recreation (1080 x 960, 30 fps, 54.66 s).
// It is timed frame by frame to the reference clip (host calls a rasa, cut to the guest's face): every face below
// snaps on the same cut. The reference itself is NOT in this file; the user stacks it on top.

export const FB_FPS = 30;
export const FB_LEN = 1640; // 54.66 s
const F = (s: number) => Math.round(s * FB_FPS);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ANTON = "Anton, Impact, 'DejaVu Sans', sans-serif";
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const SKIN = "#f2c9a5", SKIN_D = "#c9946e";

type Prop = "palm" | "palmLow" | "twirl" | "temple" | "thumb" | "cover" | "bite" | "tongue" | "stache";
type Key = { t: number; pose: FPose; extras?: Extra[]; props?: Prop[] };

const base: FPose = { still: true, breath: 0.5 };
const P = (p: FPose): FPose => ({ ...base, ...p });

// ---------- poses (matched to each shot of the reference) ----------
const WATCH = P({ lookY: -0.85, lookX: 0.1, browL: 0.35, browR: 0.35, mw: 0.45, smile: 0.25, neck: 4 }); // looking up at the original
const LISTEN = P({ lookY: -0.6, lookX: 0.25, browL: 0.55, browR: 0.15, mw: 0.4, smile: 0.35, tilt: 5, skew: 0.3 });
const READY = P({ shut: 1, smile: 0.85, mw: 0.8, tilt: -6, browL: 0.5, browR: 0.5, neck: 6 });
const RAUDRAM = P({ eyeSize: 1.38, knit: 0.95, browL: -0.55, browR: -0.55, mo: 0.22, mw: 0.35, smile: -0.5, lookX: 0.4, neck: 6, tilt: -3 });
const KARUNAM = P({ knit: -0.95, browL: 0.65, browR: 0.65, lookY: -0.45, lookX: 0.45, smile: -0.85, mw: 0.45, lipOut: 0.4, tilt: 9, neck: -6 });
const HAASYAM = P({ lid: 0.22, smile: 1, mo: 0.32, mw: 0.95, tilt: -9, browL: 0.55, browR: 0.55, lookX: 0.35 });
const BHAYA1 = P({ eyeSize: 1.3, knit: 0.9, browL: -0.7, browR: -0.7, smile: 0.4, mo: 0.24, mw: 1.0, lookX: 0.3, neck: 4 });
const BHAYA2 = P({ eyeSize: 1.38, browL: 0.7, browR: 0.7, knit: 0.15, mo: 0.55, mw: 0.5, smile: 0.0, lookX: 0.2, neck: 8 });
const ADBHUTAM = P({ eyeSize: 1.48, browL: 1, browR: 1, mo: 0.78, mw: 0.2, smile: -0.1, neck: 10, lookX: 0.2 });
const BHEEBHA = P({ shut: 1, knit: 1, browL: -0.7, browR: -0.7, smile: 0.4, mo: 0.14, mw: 1.0, skew: 0.3, tilt: 10, turn: 0.15 });
const SHAANTAM = P({ lookX: 0.5, lookY: -0.45, browL: 0.35, browR: 0.35, smile: 0.2, mw: 0.4, lid: 0.22 });
const VEERA1 = P({ knit: 0.6, browL: -0.2, browR: -0.2, lid: 0.2, lookX: 0.4, smile: -0.1, mw: 0.5, neck: 6 });
const VEERA3 = P({ knit: 0.75, browL: -0.35, browR: -0.35, lid: 0.35, lookX: 0.45, smile: -0.2, mw: 0.45, tilt: -4 });
const VEERA4 = P({ smile: 0.95, mo: 0.15, mw: 0.85, browL: 0.5, browR: 0.5, tilt: -6, neck: 6 });
const SHY1 = P({ shut: 1, smile: 0.6, mw: 0.5, blush: 1, tilt: 9 });
const SHY2 = P({ lookY: 0.85, neck: -20, tilt: 14, blush: 1, smile: 0.5, mw: 0.45, lid: 0.4 });
const SHY3 = P({ lookX: 0.45, lookY: 0.3, lid: 0.25, blush: 1, smile: 0.55, mw: 0.45, skew: 0.4, tilt: 6 });
const LAUGH = P({ shut: 1, mo: 0.85, smile: 1, mw: 1, tilt: -14, browL: 0.8, browR: 0.8, neck: 4 });
const PROUD = P({ shut: 1, smile: 0.9, mw: 0.85, tilt: -8, browL: 0.5, browR: 0.5, neck: 8 });

// ---------- the timeline (seconds; cuts measured from the reference) ----------
// label: the rasa being performed (shown from the host's call); bg: panel colour.
type Seg = { a: number; b: number; keys: Key[]; bg: string; label?: [string, string]; call?: number };
const SEGS: Seg[] = [
  { a: 0, b: 3.0, bg: "#1e293b", keys: [{ t: 0, pose: WATCH }] },
  { a: 3.0, b: 4.07, bg: "#1e293b", keys: [{ t: 3.0, pose: READY }] },
  { a: 4.07, b: 8.1, bg: "#1e293b", keys: [{ t: 4.07, pose: LISTEN }, { t: 6.2, pose: WATCH }] },
  { a: 8.1, b: 9.93, bg: "#1e293b", keys: [{ t: 8.1, pose: READY }] },
  { a: 9.93, b: 11.8, bg: "#1e293b", keys: [{ t: 9.93, pose: WATCH }], label: ["RAUDRAM", "anger"], call: 11.0 },
  { a: 11.8, b: 14.13, bg: "#b91c1c", keys: [{ t: 11.8, pose: RAUDRAM, extras: ["vein"] }], label: ["RAUDRAM", "anger"] },
  { a: 14.13, b: 15.1, bg: "#1e293b", keys: [{ t: 14.13, pose: WATCH }], label: ["KARUNAM", "sorrow"], call: 14.6 },
  { a: 15.1, b: 17.5, bg: "#475569", keys: [{ t: 15.1, pose: KARUNAM, props: ["palmLow"] }], label: ["KARUNAM", "sorrow"] },
  { a: 17.5, b: 18.5, bg: "#1e293b", keys: [{ t: 17.5, pose: WATCH }], label: ["HAASYAM", "laughter"], call: 17.9 },
  { a: 18.5, b: 20.53, bg: "#f59e0b", keys: [{ t: 18.5, pose: HAASYAM }], label: ["HAASYAM", "laughter"] },
  { a: 20.53, b: 21.53, bg: "#1e293b", keys: [{ t: 20.53, pose: WATCH }], label: ["BHAYANAKAM", "terror"], call: 20.8 },
  { a: 21.53, b: 25.13, bg: "#111827", keys: [{ t: 21.53, pose: BHAYA1 }, { t: 23.55, pose: BHAYA2, props: ["tongue"] }], label: ["BHAYANAKAM", "terror"] },
  { a: 25.13, b: 26.7, bg: "#1e293b", keys: [{ t: 25.13, pose: WATCH }], label: ["ADBHUTAM", "wonder"], call: 26.1 },
  { a: 26.7, b: 29.07, bg: "#6d28d9", keys: [{ t: 26.7, pose: ADBHUTAM, extras: ["sparkles"] }], label: ["ADBHUTAM", "wonder"] },
  { a: 29.07, b: 30.13, bg: "#1e293b", keys: [{ t: 29.07, pose: WATCH }], label: ["BHEEBHATSAM", "disgust"], call: 29.4 },
  { a: 30.13, b: 32.73, bg: "#4d7c0f", keys: [{ t: 30.13, pose: BHEEBHA }], label: ["BHEEBHATSAM", "disgust"] },
  { a: 32.73, b: 34.07, bg: "#1e293b", keys: [{ t: 32.73, pose: WATCH }], label: ["SHAANTAM", "peace"], call: 33.3 },
  { a: 34.07, b: 36.63, bg: "#0f766e", keys: [{ t: 34.07, pose: SHAANTAM, props: ["palm"], extras: ["halo"] }], label: ["SHAANTAM", "peace"] },
  { a: 36.63, b: 37.83, bg: "#1e293b", keys: [{ t: 36.63, pose: WATCH }], label: ["VEERAM", "heroism"], call: 37.1 },
  { a: 37.83, b: 43.13, bg: "#ea580c", label: ["VEERAM", "heroism"], keys: [
    { t: 37.83, pose: VEERA1, props: ["palmLow"] },
    { t: 39.0, pose: VEERA1, props: ["twirl", "stache"] },
    { t: 40.6, pose: VEERA3, props: ["temple", "stache"] },
    { t: 42.2, pose: VEERA4, props: ["thumb", "stache"], extras: ["shine"] },
  ] },
  { a: 43.13, b: 44.53, bg: "#1e293b", keys: [{ t: 43.13, pose: WATCH }], label: ["SHRUNGARAM", "romance"], call: 43.1 },
  { a: 44.53, b: 48.67, bg: "#db2777", label: ["SHRUNGARAM", "romance"], keys: [
    { t: 44.53, pose: SHY1, extras: ["hearts"] },
    { t: 45.5, pose: SHY2, props: ["cover"], extras: ["hearts"] },
    { t: 47.4, pose: SHY3, props: ["bite"], extras: ["hearts"] },
  ] },
  { a: 48.67, b: 50.1, bg: "#1e293b", keys: [{ t: 48.67, pose: SHY3, props: ["bite"] }] },
  { a: 50.1, b: 52.87, bg: "#f59e0b", keys: [{ t: 50.1, pose: LAUGH, extras: ["laughTears"] }] },
  { a: 52.87, b: 54.7, bg: "#1e293b", keys: [{ t: 52.87, pose: PROUD }] },
];

// ---------- pose at a frame ----------
const live = (p: FPose, ts: number, seg: Seg): FPose => {
  const s = Math.sin;
  if (p === LAUGH) return { ...p, tilt: (p.tilt ?? 0) + 6 * s(ts * 0.9), neck: (p.neck ?? 0) + 5 * s(ts * 1.8) };
  if (p === HAASYAM) return { ...p, tilt: (p.tilt ?? 0) + 3 * s(ts * 0.7) };
  if (p === BHAYA2) return { ...p, tilt: (p.tilt ?? 0) + 2.5 * s(ts * 1.3) };
  if (p === RAUDRAM) return { ...p, tilt: (p.tilt ?? 0) + 0.8 * s(ts * 2.4) };
  if (p === KARUNAM) return { ...p, lipOut: (p.lipOut ?? 0) + 0.1 * s(ts * 1.5), tilt: (p.tilt ?? 0) + 2 * s(ts / 9) };
  if (p === WATCH || p === LISTEN) return { ...p, lookX: (p.lookX ?? 0) + 0.25 * s(ts / 23), tilt: (p.tilt ?? 0) + 2 * s(ts / 31) };
  if (p === SHY2) return { ...p, tilt: (p.tilt ?? 0) + 2 * s(ts / 6) };
  return p;
};
const segAt = (f: number) => SEGS.find((g) => f >= F(g.a) && f < F(g.b)) ?? SEGS[SEGS.length - 1];
const keyAt = (seg: Seg, f: number) => {
  let i = 0;
  for (let k = 0; k < seg.keys.length; k++) if (f >= F(seg.keys[k].t)) i = k;
  return i;
};
const poseAt = (f: number): { p: FPose; key: Key; ts: number; seg: Seg } => {
  const seg = segAt(f), i = keyAt(seg, f), key = seg.keys[i];
  const ts = f - F(key.t);
  // previous pose: the key before, or the last key of the previous segment
  const si = SEGS.indexOf(seg);
  const prevKey = i > 0 ? seg.keys[i - 1] : si > 0 ? SEGS[si - 1].keys[SEGS[si - 1].keys.length - 1] : key;
  const prevSeg = i > 0 ? seg : si > 0 ? SEGS[si - 1] : seg;
  const from = live(prevKey.pose, F(key.t) - F(prevKey.t), prevSeg);
  const to = live(key.pose, ts, seg);
  const snapDur = i === 0 ? 5 : 7; // cuts snap fast, within-shot changes ease
  return { p: mix(from, to, easeBack(clamp(ts / snapDur))), key, ts, seg };
};

// ---------- props drawn in head space ----------
const Hand: React.FC<{ x: number; y: number; rot: number; s?: number; kind: "palm" | "fist" | "point" | "thumb" }> = ({ x, y, rot, s = 1, kind }) => {
  const finger = (fx: number, len: number, a: number) => <rect key={fx} x={fx - 9} y={-len} width={18} height={len + 10} rx={9} transform={`rotate(${a} ${fx} 0)`} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      {kind === "palm" && <>{[-27, -9, 9, 27].map((fx, i) => finger(fx, [40, 50, 48, 38][i], (i - 1.5) * 5))}</>}
      {kind === "point" && finger(-6, 58, 0)}
      {kind === "thumb" && <rect x={-12} y={-70} width={24} height={60} rx={12} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />}
      <rect x={-36} y={-10} width={72} height={66} rx={26} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />
      {kind === "palm" && <path d="M 30,30 Q 58,8 52,-12" stroke={SKIN_D} strokeWidth={4} fill={SKIN} />}
      {(kind === "fist" || kind === "point") && [-18, 0, 18].map((fx) => <path key={fx} d={`M ${fx - 8},6 Q ${fx},0 ${fx + 8},6`} stroke={SKIN_D} strokeWidth={3} fill="none" />)}
    </g>
  );
};

const Props: React.FC<{ list?: Prop[]; p: FPose; ts: number }> = ({ list = [], p, ts }) => {
  const turn = p.turn ?? 0, mx = turn * 42, my = -36;
  const has = (k: Prop) => list.includes(k);
  const curl = clamp(ts / 10);
  return (
    <g transform={headTransform(p)}>
      {has("stache") && (
        <g transform={`translate(${mx},${my - 18})`}>
          {[-1, 1].map((d) => <path key={d} d={`M 0,0 Q ${d * 26},-14 ${d * 46},-2 Q ${d * (58 + 6 * curl)},${6 - 16 * curl} ${d * (50 + 4 * curl)},${-14 - 8 * curl}`} stroke="#2e2018" strokeWidth={12} fill="none" strokeLinecap="round" />)}
        </g>
      )}
      {has("tongue") && (
        <g transform={`translate(${mx},${my + 12})`}>
          <path d={`M -20,0 L 20,0 L 22,${44 + 6 * Math.sin(ts / 3)} Q 0,${70 + 6 * Math.sin(ts / 3)} -22,${44 + 6 * Math.sin(ts / 3)} Z`} fill="#e05570" stroke="#9f1239" strokeWidth={4} />
          <line x1={0} y1={8} x2={0} y2={40} stroke="#9f1239" strokeWidth={3} />
        </g>
      )}
      {has("palm") && <Hand kind="palm" x={130} y={-40 - 6 * Math.sin(ts / 8)} rot={-8} />}
      {has("palmLow") && <Hand kind="palm" x={150} y={-5 + 8 * Math.sin(ts / 5)} rot={-20 + 10 * Math.sin(ts / 5)} />}
      {has("twirl") && <Hand kind="point" x={mx + 62} y={my - 4} rot={-80 + 18 * Math.sin(ts / 2.5)} s={0.85} />}
      {has("temple") && <Hand kind="point" x={112} y={-150} rot={-30} s={0.85} />}
      {has("thumb") && <Hand kind="thumb" x={135} y={10} rot={-6} />}
      {has("cover") && <Hand kind="palm" x={14} y={-236} rot={168} s={1.05} />}
      {has("bite") && <Hand kind="point" x={mx + 22} y={my + 56} rot={-12} s={0.85} />}
    </g>
  );
};

// ---------- composition ----------
export const FumbleBrahmi: React.FC<{ handle?: string }> = ({ handle = "@ai_maastaaru" }) => {
  const f = useCurrentFrame();
  const { p, key, ts, seg } = poseAt(f);
  const segStart = F(seg.a);
  const cutAge = f - segStart;
  const performing = !!seg.label && seg.call === undefined; // a rasa shot (not the host's call)
  const zoomBase = performing ? 1.28 : 1.1;
  const zoom = zoomBase + (performing ? 0.06 * (1 - clamp(cutAge / 5)) : 0) + 0.02 * Math.sin(f / 50);
  const vw = 520 / zoom, vh = vw * (960 / 1080);
  const cy = -880;
  const flash = performing && cutAge < 3 ? 1 - cutAge / 3 : 0;
  const labelOn = seg.label && (seg.call === undefined || f >= F(seg.call));
  const labelAge = seg.call !== undefined ? f - F(seg.call) : cutAge + 99;
  const labelScale = seg.call !== undefined ? 1 + 0.6 * (1 - easeBack(clamp(labelAge / 6), 2)) : 1;
  const endT = f - F(52.87);
  return (
    <AbsoluteFill style={{ background: seg.bg, overflow: "hidden" }}>
      <Fonts />
      <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>
      {performing && (
        <svg width={1080} height={960} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
          <g transform={`translate(540,560) rotate(${f * 0.3})`}>
            {Array.from({ length: 20 }, (_, i) => { const a0 = (i / 20) * Math.PI * 2, a1 = a0 + Math.PI / 40; return <path key={i} d={`M ${Math.cos(a0) * 200},${Math.sin(a0) * 200} L ${Math.cos(a0) * 1200},${Math.sin(a0) * 1200} L ${Math.cos(a1) * 1200},${Math.sin(a1) * 1200} Z`} fill="#fff" />; })}
          </g>
        </svg>
      )}
      <svg width={1080} height={960} viewBox={`${-vw / 2} ${cy - vh / 2} ${vw} ${vh}`} style={{ position: "absolute", inset: 0 }}>
        <Fumble f={f} p={p} />
        <Extras list={key.extras} t={ts} p={p} />
        <Props list={key.props} p={p} ts={ts} />
      </svg>
      {/* seam tag */}
      <div style={{ position: "absolute", top: 14, left: 18, fontFamily: INTER, fontWeight: 800, fontSize: 30, color: "#111", background: "#fde047", padding: "2px 14px", borderRadius: 10 }}>MR. FUMBLE</div>
      {labelOn && seg.label && (
        <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center", transform: `scale(${labelScale}) rotate(-2deg)` }}>
          <div style={{ fontFamily: ANTON, fontSize: 84, lineHeight: 1, color: "#fde047", WebkitTextStroke: "3px #111", textShadow: "0 6px 0 rgba(0,0,0,0.5)", letterSpacing: 3 }}>{seg.label[0]}</div>
          <div style={{ display: "inline-block", fontFamily: INTER, fontWeight: 800, fontSize: 32, color: "#111", background: "#fde047", padding: "0 14px", borderRadius: 10, marginTop: 4 }}>{seg.label[1]}</div>
        </div>
      )}
      {endT >= 0 && (
        <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", opacity: clamp(endT / 6) }}>
          <div style={{ fontFamily: ANTON, fontSize: 70, color: "#fde047", WebkitTextStroke: "3px #111", lineHeight: 1.05 }}>WHO NAILED IT?</div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 34, color: "white", marginTop: 6 }}>Comment 1 for the original, 2 for Fumble</div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 14, right: 18, fontFamily: INTER, fontWeight: 800, fontSize: 26, color: "rgba(255,255,255,0.8)" }}>{handle}</div>
      {flash > 0 && <AbsoluteFill style={{ background: "white", opacity: 0.55 * flash }} />}
    </AbsoluteFill>
  );
};
