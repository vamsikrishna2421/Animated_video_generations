import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../../components/Fonts";
import { easeBack, FPose, Fumble, mix } from "../Fumble";
import { Extra, Extras, headTransform } from "../FumbleRasa";

// Mr. Fumble's half of the "Navarasalu rapid fire" recreation (1080 x 960, 30 fps).
// Timed frame by frame to the reference clip (host calls a rasa, cut to the guest's face): every face below snaps on
// the same cut. The reference itself is NOT in this file; the user stacks it on top.
// trim = the faster cut: the reference's 2.9-10.6 s (the host explaining the rules) is removed from both halves.

export const FB_FPS = 30;
export const FB_LEN = 1640; // 54.67 s, matches the reference
const F = (s: number) => Math.round(s * FB_FPS);
export const TRIM_A = 2.9, TRIM_B = 10.6;
export const FB_TRIM_LEN = FB_LEN - (F(TRIM_B) - F(TRIM_A));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ANTON = "Anton, Impact, 'DejaVu Sans', sans-serif";
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const SKIN = "#f2c9a5", SKIN_D = "#c9946e", INK = "#231815";

type Prop = "palm" | "palmLow" | "twirl" | "temple" | "thumb" | "cover" | "bite" | "tongue" | "stache" | "fists" | "grit" | "scrunch";
type Key = { t: number; pose: FPose; extras?: Extra[]; props?: Prop[]; wrong?: boolean };

const base: FPose = { still: true, breath: 0.5 };
const P = (p: FPose): FPose => ({ ...base, ...p });

// ---------- poses (matched to each shot of the reference) ----------
const WATCH = P({ lookY: -0.85, lookX: 0.1, browL: 0.35, browR: 0.35, mw: 0.45, smile: 0.25, neck: 4 }); // looking up at the original
const LISTEN = P({ lookY: -0.6, lookX: 0.25, browL: 0.55, browR: 0.15, mw: 0.4, smile: 0.35, tilt: 5, skew: 0.3 });
const WINK = P({ winkR: 1, smile: 0.8, mw: 0.75, browL: 0.6, browR: 0.2, tilt: -6, skew: 0.3 });
const STRETCH = P({ mo: 0.95, mw: 0.3, eyeSize: 1.25, browL: 0.95, browR: 0.95, neck: 10 });
const PUFF = P({ pucker: 1, mo: 0.05, eyeSize: 1.15, blush: 0.5, browL: 0.4, browR: 0.4 });
const WIGGLE = P({ browL: 1, browR: -0.4, skew: 0.8, smile: 0.45, mw: 0.5, lid: 0.2, tilt: 6, lookX: 0.4 });
const NECKROLL = P({ shut: 1, smile: 0.4, mw: 0.45, browL: 0.3, browR: 0.3 });
const READY = P({ smile: 0.75, mw: 0.7, browL: 0.5, browR: 0.5, tilt: -4, neck: 6, knit: 0.2, lookX: 0.2 });
const RAUDRAM = P({ eyeSize: 1.38, knit: 0.95, browL: -0.55, browR: -0.55, mo: 0.22, mw: 0.35, smile: -0.5, lookX: 0.4, neck: 6, tilt: -3 });
const KARUNAM = P({ knit: -0.95, browL: 0.6, browR: 0.6, lid: 0.45, lookY: 0.35, lookX: 0.3, smile: -0.95, mw: 0.45, lipOut: 0.55, tilt: 7, neck: -6 });
const HAASYAM = P({ eyeSize: 1.08, smile: 1, mo: 0.32, mw: 0.95, tilt: -9, browL: 0.6, browR: 0.6, lookX: 0.35 });
const BHAYA1 = P({ eyeSize: 1.3, knit: 0.9, browL: -0.7, browR: -0.7, smile: 0.4, mo: 0.24, mw: 1.0, lookX: 0.3, neck: 4 });
const BHAYA2 = P({ eyeSize: 1.38, browL: 0.7, browR: 0.7, knit: 0.15, mo: 0.55, mw: 0.5, smile: 0.0, lookX: 0.2, neck: 8 });
const ADBHUTAM = P({ eyeSize: 1.48, browL: 1, browR: 1, mo: 0.78, mw: 0.2, smile: -0.1, neck: 10, lookX: 0.2 });
const WRONGFACE = P({ shut: 1, smile: 1, mo: 0.4, mw: 1, tilt: -8, browL: 0.7, browR: 0.7 }); // the fumble: a happy face for "disgust"
const BHEEBHA = P({ knit: 1, browL: -0.75, browR: -0.75, mw: 0.2, mo: 0, smile: -0.3, tilt: 10, turn: 0.12, neck: -4 });
const SHAANTAM = P({ lookX: 0.5, lookY: -0.45, browL: 0.35, browR: 0.35, smile: 0.2, mw: 0.4, lid: 0.22 });
const VEERA1 = P({ knit: 0.6, browL: -0.2, browR: -0.2, lid: 0.2, lookX: 0.4, smile: -0.1, mw: 0.5, neck: 6 });
const VEERA3 = P({ knit: 0.75, browL: -0.35, browR: -0.35, lid: 0.35, lookX: 0.45, smile: -0.2, mw: 0.45, tilt: -4 });
const VEERA4 = P({ smile: 0.95, mo: 0.15, mw: 0.85, browL: 0.5, browR: 0.5, tilt: -6, neck: 6 });
const SHY1 = P({ shut: 1, smile: 0.6, mw: 0.5, blush: 1, tilt: 9 });
const SHY2 = P({ lookY: 0.9, neck: -48, tilt: 24, turn: -0.45, blush: 1, smile: 0.5, mw: 0.45, lid: 0.45 });
const SHY3 = P({ lookX: 0.45, lookY: 0.3, lid: 0.25, blush: 1, smile: 0.55, mw: 0.45, skew: 0.4, tilt: 6 });
const LAUGH = P({ shut: 1, mo: 0.85, smile: 1, mw: 1, tilt: -14, browL: 0.8, browR: 0.8, neck: 4 });
const PROUD = P({ shut: 1, smile: 0.9, mw: 0.85, tilt: -8, browL: 0.5, browR: 0.5, neck: 8 });

// ---------- the timeline (seconds; cuts measured from the reference) ----------
type Seg = { a: number; b: number; keys: Key[]; bg: string; label?: [string, string]; call?: number; n?: number };
const DARK = "#1e293b";
const SEGS: Seg[] = [
  { a: 0, b: 3.0, bg: DARK, keys: [
    { t: 0, pose: WATCH }, { t: 0.4, pose: RAUDRAM }, { t: 0.8, pose: HAASYAM }, { t: 1.2, pose: BHAYA2, props: ["tongue"] },
    { t: 1.6, pose: ADBHUTAM }, { t: 2.0, pose: WINK },
  ] },
  { a: 3.0, b: 4.07, bg: DARK, keys: [{ t: 3.0, pose: READY }] },
  { a: 4.07, b: 8.1, bg: DARK, keys: [
    { t: 4.07, pose: LISTEN }, { t: 4.9, pose: STRETCH }, { t: 5.7, pose: PUFF }, { t: 6.5, pose: WIGGLE }, { t: 7.3, pose: NECKROLL },
  ] },
  { a: 8.1, b: 9.93, bg: DARK, keys: [{ t: 8.1, pose: READY, props: ["fists"] }] },
  { a: 9.93, b: 11.8, bg: DARK, keys: [{ t: 9.93, pose: WATCH }], label: ["RAUDRAM", "anger"], call: 11.0, n: 1 },
  { a: 11.8, b: 14.13, bg: "#b91c1c", keys: [{ t: 11.8, pose: RAUDRAM, extras: ["vein"] }], label: ["RAUDRAM", "anger"], n: 1 },
  { a: 14.13, b: 15.1, bg: DARK, keys: [{ t: 14.13, pose: WATCH }], label: ["KARUNAM", "sorrow"], call: 14.6, n: 2 },
  { a: 15.1, b: 17.5, bg: "#475569", keys: [{ t: 15.1, pose: KARUNAM, props: ["palmLow"], extras: ["tears"] }], label: ["KARUNAM", "sorrow"], n: 2 },
  { a: 17.5, b: 18.5, bg: DARK, keys: [{ t: 17.5, pose: WATCH }], label: ["HAASYAM", "laughter"], call: 17.9, n: 3 },
  { a: 18.5, b: 20.53, bg: "#f59e0b", keys: [{ t: 18.5, pose: HAASYAM }], label: ["HAASYAM", "laughter"], n: 3 },
  { a: 20.53, b: 21.53, bg: DARK, keys: [{ t: 20.53, pose: WATCH }], label: ["BHAYANAKAM", "terror"], call: 20.8, n: 4 },
  { a: 21.53, b: 25.13, bg: "#111827", keys: [{ t: 21.53, pose: BHAYA1 }, { t: 23.55, pose: BHAYA2, props: ["tongue"] }], label: ["BHAYANAKAM", "terror"], n: 4 },
  { a: 25.13, b: 26.7, bg: DARK, keys: [{ t: 25.13, pose: WATCH }], label: ["ADBHUTAM", "wonder"], call: 26.1, n: 5 },
  { a: 26.7, b: 29.07, bg: "#6d28d9", keys: [{ t: 26.7, pose: ADBHUTAM, extras: ["sparkles"] }], label: ["ADBHUTAM", "wonder"], n: 5 },
  { a: 29.07, b: 30.13, bg: DARK, keys: [{ t: 29.07, pose: WATCH }], label: ["BHEEBHATSAM", "disgust"], call: 29.4, n: 6 },
  { a: 30.13, b: 32.73, bg: "#4d7c0f", keys: [{ t: 30.13, pose: WRONGFACE, wrong: true }, { t: 30.8, pose: BHEEBHA, props: ["scrunch", "grit"] }], label: ["BHEEBHATSAM", "disgust"], n: 6 },
  { a: 32.73, b: 34.07, bg: DARK, keys: [{ t: 32.73, pose: WATCH }], label: ["SHAANTAM", "peace"], call: 33.3, n: 7 },
  { a: 34.07, b: 36.63, bg: "#0f766e", keys: [{ t: 34.07, pose: SHAANTAM, props: ["palm"] }], label: ["SHAANTAM", "peace"], n: 7 },
  { a: 36.63, b: 37.83, bg: DARK, keys: [{ t: 36.63, pose: WATCH }], label: ["VEERAM", "heroism"], call: 37.1, n: 8 },
  { a: 37.83, b: 43.13, bg: "#ea580c", label: ["VEERAM", "heroism"], n: 8, keys: [
    { t: 37.83, pose: VEERA1, props: ["palmLow"] },
    { t: 39.0, pose: VEERA1, props: ["twirl", "stache"] },
    { t: 40.6, pose: VEERA3, props: ["temple", "stache"] },
    { t: 42.2, pose: VEERA4, props: ["thumb", "stache"], extras: ["shine"] },
  ] },
  { a: 43.13, b: 44.53, bg: DARK, keys: [{ t: 43.13, pose: WATCH }], label: ["SHRUNGARAM", "romance"], call: 43.1, n: 9 },
  { a: 44.53, b: 48.67, bg: "#f9a8d4", label: ["SHRUNGARAM", "romance"], n: 9, keys: [
    { t: 44.53, pose: SHY1, extras: ["hearts"] },
    { t: 45.5, pose: SHY2, props: ["cover"], extras: ["hearts"] },
    { t: 47.4, pose: SHY3, props: ["bite"], extras: ["hearts"] },
  ] },
  { a: 48.67, b: 50.1, bg: DARK, keys: [{ t: 48.67, pose: SHY3, props: ["bite"] }] },
  { a: 50.1, b: 52.87, bg: "#f59e0b", keys: [{ t: 50.1, pose: LAUGH, extras: ["laughTears"] }] },
  { a: 52.87, b: 54.7, bg: DARK, keys: [{ t: 52.87, pose: PROUD }] },
];

// ---------- pose at a frame ----------
const live = (p: FPose, ts: number): FPose => {
  const s = Math.sin;
  if (p === LAUGH) return { ...p, tilt: (p.tilt ?? 0) + 6 * s(ts * 0.9), neck: (p.neck ?? 0) + 5 * s(ts * 1.8) };
  if (p === HAASYAM || p === WRONGFACE) return { ...p, tilt: (p.tilt ?? 0) + 3 * s(ts * 0.7) };
  if (p === BHAYA2) return { ...p, tilt: (p.tilt ?? 0) + 2.5 * s(ts * 1.3) };
  if (p === RAUDRAM) return { ...p, tilt: (p.tilt ?? 0) + 0.8 * s(ts * 2.4) };
  if (p === KARUNAM) return { ...p, lipOut: (p.lipOut ?? 0) + 0.12 * s(ts * 1.6), tilt: (p.tilt ?? 0) + 2 * s(ts / 9) };
  if (p === BHEEBHA) return { ...p, tilt: (p.tilt ?? 0) + 1.5 * s(ts * 1.9) };
  if (p === WIGGLE) return { ...p, browL: s(ts / 2.2), browR: -s(ts / 2.2) };
  if (p === NECKROLL) return { ...p, tilt: 12 * s(ts / 5), neck: 6 * Math.cos(ts / 5) };
  if (p === READY) return { ...p, neck: (p.neck ?? 0) + 4 * Math.max(0, s(ts / 4)) };
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
const poseAt = (f: number) => {
  const seg = segAt(f), i = keyAt(seg, f), key = seg.keys[i];
  const ts = f - F(key.t);
  const si = SEGS.indexOf(seg);
  const prevKey = i > 0 ? seg.keys[i - 1] : si > 0 ? SEGS[si - 1].keys[SEGS[si - 1].keys.length - 1] : key;
  const from = live(prevKey.pose, F(key.t) - F(prevKey.t));
  const to = live(key.pose, ts);
  const snapDur = i === 0 ? 5 : 6;
  return { p: mix(from, to, easeBack(clamp(ts / snapDur))), key, ts, seg };
};

// ---------- props drawn in head space ----------
const Finger: React.FC<{ x: number; len: number; a: number; w?: number }> = ({ x, len, a, w = 18 }) => (
  <rect x={x - w / 2} y={-len} width={w} height={len + 10} rx={w / 2} transform={`rotate(${a} ${x} 0)`} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />
);
const Hand: React.FC<{ x: number; y: number; rot: number; s?: number; kind: "palm" | "fist" | "point" | "thumb" }> = ({ x, y, rot, s = 1, kind }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    {kind === "palm" && [-27, -9, 9, 27].map((fx, i) => <Finger key={fx} x={fx} len={[40, 50, 48, 38][i]} a={(i - 1.5) * 5} />)}
    {kind === "point" && <Finger x={-6} len={58} a={0} />}
    {kind === "thumb" && (
      <g>
        <rect x={-46} y={-70} width={30} height={72} rx={15} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />
        <rect x={-41} y={-66} width={20} height={16} rx={7} fill="#fbe3d0" stroke={SKIN_D} strokeWidth={2} />
      </g>
    )}
    <rect x={-40} y={-10} width={80} height={68} rx={26} fill={SKIN} stroke={SKIN_D} strokeWidth={4} />
    {kind === "palm" && <path d="M 34,30 Q 62,8 56,-14" stroke={SKIN_D} strokeWidth={4} fill={SKIN} />}
    {(kind === "fist" || kind === "point" || kind === "thumb") && [-20, 0, 20].map((fx) => <path key={fx} d={`M ${fx - 9},4 Q ${fx},-2 ${fx + 9},4`} stroke={SKIN_D} strokeWidth={3} fill="none" />)}
  </g>
);

const Props: React.FC<{ list?: Prop[]; p: FPose; ts: number }> = ({ list = [], p, ts }) => {
  const turn = p.turn ?? 0, fx = turn * 34, mx = turn * 42, my = -36;
  const has = (k: Prop) => list.includes(k);
  const curl = clamp(ts / 10);
  return (
    <g transform={headTransform(p)}>
      {has("scrunch") && (
        <g>
          {[-38, 38].map((x) => <ellipse key={x} cx={x + fx} cy={-128} rx={30} ry={34} fill={SKIN} />)}
          <path d={`M ${-60 + fx},-144 L ${-20 + fx},-128 L ${-60 + fx},-112 M ${60 + fx},-144 L ${20 + fx},-128 L ${60 + fx},-112`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M ${-16 + turn * 12},-112 q 6,-6 12,0 M ${4 + turn * 12},-112 q 6,-6 12,0`} stroke={SKIN_D} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      )}
      {has("grit") && (
        <g transform={`translate(${mx},${my})`}>
          <path d="M -54,10 Q 0,-14 54,10 L 48,34 Q 0,26 -48,34 Z" fill="#fff" stroke="#a24a3a" strokeWidth={6} strokeLinejoin="round" />
          <path d="M -50,22 Q 0,8 50,22" stroke="#cbd5e1" strokeWidth={3} fill="none" />
          {[-36, -24, -12, 0, 12, 24, 36].map((x) => <line key={x} x1={x} y1={x * x * 0.004 - 3} x2={x} y2={30 - x * x * 0.002} stroke="#cbd5e1" strokeWidth={3} />)}
        </g>
      )}
      {has("stache") && (
        <g transform={`translate(${mx},${my - 18})`}>
          {[-1, 1].map((d) => <path key={d} d={`M 0,0 Q ${d * 26},-14 ${d * 46},-2 Q ${d * (58 + 6 * curl)},${6 - 16 * curl} ${d * (50 + 4 * curl)},${-14 - 8 * curl}`} stroke="#2e2018" strokeWidth={12} fill="none" strokeLinecap="round" />)}
        </g>
      )}
      {has("tongue") && (
        <g transform={`translate(${mx},${my + 12})`}>
          <path d={`M -20,0 L 20,0 L 22,${40 + 5 * Math.sin(ts / 3)} Q 0,${62 + 5 * Math.sin(ts / 3)} -22,${40 + 5 * Math.sin(ts / 3)} Z`} fill="#e05570" stroke="#9f1239" strokeWidth={4} />
          <line x1={0} y1={8} x2={0} y2={36} stroke="#9f1239" strokeWidth={3} />
        </g>
      )}
      {/* hands sit on screen-left, like the reference (and clear of the app's buttons on the right) */}
      {has("palm") && <Hand kind="palm" x={-135} y={-50 - 6 * Math.sin(ts / 8)} rot={8} />}
      {has("palmLow") && <Hand kind="palm" x={-145} y={-10 + 8 * Math.sin(ts / 5)} rot={20 - 10 * Math.sin(ts / 5)} />}
      {has("twirl") && <Hand kind="point" x={mx - 62} y={my - 4} rot={80 - 18 * Math.sin(ts / 2.5)} s={0.85} />}
      {has("temple") && <Hand kind="point" x={-112} y={-150} rot={30} s={0.85} />}
      {has("thumb") && <Hand kind="thumb" x={-140} y={-30} rot={4} s={1.1} />}
      {has("cover") && <Hand kind="palm" x={14} y={-236} rot={168} s={1.05} />}
      {has("bite") && <Hand kind="point" x={mx + 22} y={my + 56} rot={-12} s={0.85} />}
      {has("fists") && [-1, 1].map((d) => <Hand key={d} kind="fist" x={d * 62} y={70 - 6 * Math.max(0, Math.sin(ts / 3))} rot={d * -8} s={0.9} />)}
    </g>
  );
};

// ---------- composition ----------
const Pill: React.FC<{ bg: string; fg: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ bg, fg, children, style }) => (
  <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, color: fg, background: bg, padding: "2px 14px", borderRadius: 10, ...style }}>{children}</div>
);

export const FumbleBrahmi: React.FC<{ handle?: string; lang?: "en" | "te"; trim?: boolean }> = ({ handle = "@ai_maastaaru", lang = "en", trim = false }) => {
  const frame = useCurrentFrame();
  const f = trim && frame >= F(TRIM_A) ? frame + (F(TRIM_B) - F(TRIM_A)) : frame; // reference time
  const { p, key, ts, seg } = poseAt(f);
  const cutAge = f - F(seg.a);
  const performing = !!seg.label && seg.call === undefined;
  const zoom = (performing ? 0.95 : 0.85) + (performing ? 0.06 * (1 - clamp(cutAge / 5)) : 0) + 0.015 * Math.sin(f / 50);
  const vw = 520 / zoom, vh = vw * (960 / 1080);
  const cy = -818;
  const flash = performing && cutAge < 3 ? 1 - cutAge / 3 : 0;
  const labelOn = seg.label && (seg.call === undefined || f >= F(seg.call));
  const labelAge = seg.call !== undefined ? f - F(seg.call) : 99;
  const labelScale = 1 + 0.6 * (1 - easeBack(clamp(labelAge / 6), 2));
  const hookOn = f < F(2.9);
  const endT = f - F(50.1);
  const wrongAge = key.wrong ? ts : -1;
  return (
    <AbsoluteFill style={{ background: seg.bg, overflow: "hidden" }}>
      <Fonts />
      <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>
      {performing && (
        <svg width={1080} height={960} style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
          <g transform={`translate(540,430) rotate(${f * 0.3})`}>
            {Array.from({ length: 20 }, (_, i) => { const a0 = (i / 20) * Math.PI * 2, a1 = a0 + Math.PI / 40; return <path key={i} d={`M ${Math.cos(a0) * 200},${Math.sin(a0) * 200} L ${Math.cos(a0) * 1200},${Math.sin(a0) * 1200} L ${Math.cos(a1) * 1200},${Math.sin(a1) * 1200} Z`} fill="#fff" />; })}
          </g>
        </svg>
      )}
      <svg width={1080} height={960} viewBox={`${-vw / 2} ${cy - vh / 2} ${vw} ${vh}`} style={{ position: "absolute", inset: 0 }}>
        <Fumble f={f} p={p} />
        <Extras list={key.extras} t={ts} p={p} />
        <Props list={key.props} p={p} ts={ts} />
      </svg>
      {/* who is who: 1 = the original above, 2 = Fumble */}
      <div style={{ position: "absolute", top: 14, left: 18 }}>
        <Pill bg="#fde047" fg="#111">2 · MR. FUMBLE</Pill>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 22, color: "rgba(255,255,255,0.85)", marginTop: 4, marginLeft: 4 }}>{handle}</div>
      </div>
      <div style={{ position: "absolute", top: 14, right: 18, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <Pill bg="white" fg="#111">1 · ORIGINAL ↑</Pill>
        {seg.n && labelOn && <Pill bg="rgba(0,0,0,0.55)" fg="white" style={{ fontSize: 34 }}>{seg.n}/9</Pill>}
      </div>
      {labelOn && seg.label && !hookOn && endT < 0 && (
        <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.45)", borderRadius: 22, padding: "6px 26px 10px", transform: `scale(${labelScale}) rotate(-2deg)` }}>
            <div style={{ fontFamily: ANTON, fontSize: 78, lineHeight: 1, color: "#fde047", WebkitTextStroke: "3px #111", letterSpacing: 3 }}>{seg.label[0]}</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 50, lineHeight: 1.1, color: "white" }}>{seg.label[1]}</div>
          </div>
        </div>
      )}
      {hookOn && (
        <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${1 + 0.5 * (1 - easeBack(clamp(f / 6), 2))})` }}>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.6)", borderRadius: 24, padding: "10px 30px 14px" }}>
            <div style={{ fontFamily: ANTON, fontSize: 80, lineHeight: 1, color: "#fde047", WebkitTextStroke: "3px #111" }}>NAVARASALU RAPID FIRE</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "white", marginTop: 6 }}>1 ORIGINAL vs 2 MR. FUMBLE</div>
          </div>
        </div>
      )}
      {wrongAge >= 2 && (
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", transform: `rotate(-8deg) scale(${easeBack(clamp((wrongAge - 2) / 5), 2)})` }}>
          <span style={{ fontFamily: ANTON, fontSize: 120, color: "white", background: "#dc2626", padding: "0 30px", borderRadius: 18, border: "6px solid white" }}>WRONG RASA!</span>
        </div>
      )}
      {endT >= 0 && (
        <div style={{ position: "absolute", top: 64, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: clamp(endT / 5), transform: `scale(${1 + 0.4 * (1 - easeBack(clamp(endT / 7), 2))})` }}>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.78)", borderRadius: 26, padding: "12px 34px 16px", border: "4px solid #fde047" }}>
            <div style={{ fontFamily: ANTON, fontSize: 96, lineHeight: 1, color: "#fde047" }}>{lang === "te" ? "FUMBLE KI ENNI MARKS?" : "RATE FUMBLE OUT OF 9"}</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 50, color: "white", marginTop: 8 }}>{lang === "te" ? "/9 comment cheyyandi" : "Comment your score /9"}</div>
          </div>
        </div>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: "white", opacity: 0.55 * flash }} />}
    </AbsoluteFill>
  );
};
