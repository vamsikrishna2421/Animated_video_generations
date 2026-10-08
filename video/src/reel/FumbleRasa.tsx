import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { FPose, Fumble } from "./Fumble";

// "AI Navarasalu": Mr. Fumble's nine-emotion face set (original character; the expression-montage format only).
// Each rasa is a face pose plus optional cartoon extras drawn in head space (tears, steam, hearts...).

export type Extra = "tears" | "laughTears" | "steam" | "hearts" | "heartEyes" | "sparkles" | "gloom" | "vein" | "shine" | "halo";
export type Rasa = { key: string; name: string; te: string; sa: string; line: string; pose: FPose; extras?: Extra[] };

const base: FPose = { still: true, breath: 0.5, armL: [14, 18], armR: [-14, -18] };

export const RASAS: Rasa[] = [
  { key: "adbhuta", name: "WONDER", te: "Adbhutam", sa: "Adbhuta", line: "AI writes a poem in 3 seconds",
    pose: { ...base, eyeSize: 1.45, browL: 1, browR: 1, mo: 0.55, mw: 0.25, smile: 0.1, neck: 10, lookY: -0.2 }, extras: ["sparkles"] },
  { key: "shringara", name: "LOVE", te: "Shrungaram", sa: "Shringara", line: "AI fixes your sheet 2 minutes before the deadline",
    pose: { ...base, blush: 1, smile: 0.95, mw: 0.7, tilt: 10, browL: 0.7, browR: 0.7, eyeSize: 1.1 }, extras: ["heartEyes", "hearts"] },
  { key: "raudra", name: "ANGER", te: "Raudram", sa: "Raudra", line: '"You\'re absolutely right!" (same wrong answer)',
    pose: { ...base, knit: 1, browL: -0.9, browR: -0.9, lid: 0.35, mo: 0.45, mw: 0.75, smile: -0.9, blush: 1, shrug: 0.35, neck: 6 }, extras: ["steam", "vein"] },
  { key: "hasya", name: "LAUGHTER", te: "Haasyam", sa: "Hasya", line: "You ask yes or no. It writes six paragraphs.",
    pose: { ...base, shut: 1, mo: 0.8, smile: 1, mw: 0.95, tilt: -12, browL: 0.8, browR: 0.8, neck: -4 }, extras: ["laughTears"] },
  { key: "bhayanaka", name: "FEAR", te: "Bhayanakam", sa: "Bhayanaka", line: 'Manager forwards "AI will take your job": "FYI :)"',
    pose: { ...base, eyeSize: 1.3, browL: 0.9, browR: 0.9, knit: -0.7, mo: 0.3, mw: 0.55, smile: -0.7, sweat: 1, shrug: 0.6, lookX: -0.4, neck: -10 }, extras: ["gloom"] },
  { key: "karuna", name: "SORROW", te: "Karunam", sa: "Karuna", line: '"You\'ve reached your usage limit"',
    pose: { ...base, browL: 0.55, browR: 0.55, knit: -0.95, lid: 0.45, lookY: 0.55, smile: -0.95, mw: 0.5, lipOut: 0.55, tilt: 6, neck: -12, shrug: 0.3 }, extras: ["tears", "gloom"] },
  { key: "bibhatsa", name: "DISGUST", te: "Bheebhatsam", sa: "Bibhatsa", line: '"Certainly! Here\'s a heartfelt post:" left in the post',
    pose: { ...base, squint: 0.7, lid: 0.25, knit: 0.8, browL: -0.5, browR: 0.6, skew: 0.9, lipOut: 0.7, smile: -0.6, mw: 0.45, turn: -0.3, tilt: -9, lookX: 0.6 } },
  { key: "veera", name: "COURAGE", te: "Veeram", sa: "Veera", line: "Sending the AI answer to your boss. Unread.",
    pose: { ...base, tilt: -10, neck: 16, lid: 0.15, knit: 0.5, browL: 0.15, browR: 0.15, mo: 0.12, smile: 0.95, mw: 0.85, skew: 0.2, lookX: 0.35, lookY: -0.2 }, extras: ["shine"] },
  { key: "shanta", name: "PEACE", te: "Shaantam", sa: "Shanta", line: 'Boss: "Perfect, thanks!" Laptop closed.',
    pose: { ...base, shut: 1, smile: 0.3, mw: 0.4, tilt: 4, browL: 0.35, browR: 0.35, neck: 4 }, extras: ["halo"] },
];

// Head-space origin for a pose (matches Fumble's neck/head transform when still with breath 0.5).
export const headTransform = (p: FPose) => {
  const sh = Math.max((p.shrugL ?? 0) + (p.shrug ?? 0), (p.shrugR ?? 0) + (p.shrug ?? 0));
  const y = -410 + (p.hipY ?? 0) - 301.5 - 14 - (p.neck ?? 0) + 8 * sh;
  return `translate(${(p.turn ?? 0) * 6},${y}) rotate(${p.tilt ?? 0})`;
};

const heart = (x: number, y: number, s: number) => `M ${x},${y + 6 * s} C ${x - 14 * s},${y - 4 * s} ${x - 8 * s},${y - 16 * s} ${x},${y - 8 * s} C ${x + 8 * s},${y - 16 * s} ${x + 14 * s},${y - 4 * s} ${x},${y + 6 * s} Z`;
const star = (x: number, y: number, s: number) => `M ${x},${y - 14 * s} Q ${x + 2 * s},${y - 2 * s} ${x + 14 * s},${y} Q ${x + 2 * s},${y + 2 * s} ${x},${y + 14 * s} Q ${x - 2 * s},${y + 2 * s} ${x - 14 * s},${y} Q ${x - 2 * s},${y - 2 * s} ${x},${y - 14 * s} Z`;

// Cartoon extras in head space (eyes at (+-38, -128), mouth at (0, -36), head top at y -252). t = frames into the beat.
export const Extras: React.FC<{ list?: Extra[]; t: number; p: FPose }> = ({ list = [], t, p }) => (
  <g transform={headTransform(p)}>
    {list.includes("tears") && [-38, 38].map((x) => {
      const L = Math.min(1, t / 14);
      return <path key={x} d={`M ${x + (x < 0 ? -6 : 6)},-104 Q ${x + (x < 0 ? -16 : 16)},${-70} ${x + (x < 0 ? -12 : 12)},${-104 + 90 * L}`} stroke="#7dd3fc" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.9} />;
    })}
    {list.includes("laughTears") && [-1, 1].map((d) => [0, 1].map((k) => {
      const u = ((t / 10 + k * 0.5) % 1);
      return <ellipse key={`${d}${k}`} cx={d * (70 + 60 * u)} cy={-132 - 30 * Math.sin(u * Math.PI)} rx={6} ry={9} fill="#7dd3fc" opacity={1 - u} />;
    }))}
    {list.includes("steam") && [-1, 1].map((d) => [0, 1, 2].map((k) => {
      const u = ((t / 18 + k / 3) % 1);
      return <circle key={`${d}${k}`} cx={d * (96 + 26 * u)} cy={-230 - 70 * u} r={14 + 16 * u} fill="#f8fafc" opacity={0.85 * (1 - u)} />;
    }))}
    {list.includes("vein") && <path d="M 44,-222 l 14,10 l -14,10 M 70,-222 l -14,10 l 14,10" stroke="#e11d48" strokeWidth={6} fill="none" strokeLinecap="round" />}
    {list.includes("hearts") && [0, 1, 2].map((k) => {
      const u = ((t / 30 + k / 3) % 1);
      return <path key={k} d={heart(-150 + k * 150, -250 - 80 * u - (k === 1 ? 60 : 0), 1.4)} fill="#f43f5e" opacity={1 - u} />;
    })}
    {list.includes("sparkles") && [[-130, -230], [130, -200], [-120, -60], [125, -70]].map(([x, y], k) => (
      <path key={k} d={star(x, y, 0.9 + 0.5 * Math.abs(Math.sin(t / 6 + k)))} fill="#fde047" />
    ))}
    {list.includes("gloom") && [-50, -25, 0, 25, 50].map((x, k) => (
      <line key={k} x1={x} y1={-245} x2={x} y2={-200 + 6 * Math.sin(t / 5 + k)} stroke="#6366f1" strokeWidth={5} opacity={0.55} strokeLinecap="round" />
    ))}
    {list.includes("shine") && <path d={star(78, -150, 1.1 + 0.4 * Math.abs(Math.sin(t / 5)))} fill="#ffffff" />}
    {list.includes("heartEyes") && [-38, 38].map((x) => {
      const s = 2.6 + 0.25 * Math.sin(t / 4);
      return <path key={x} d={heart(x, -126, s)} fill="#e11d48" stroke="#9f1239" strokeWidth={3} />;
    })}
    {list.includes("halo") && <ellipse cx={0} cy={-292} rx={78} ry={16} fill="none" stroke="#fde047" strokeWidth={9} opacity={0.9 + 0.1 * Math.sin(t / 8)} />}
  </g>
);

// Close-up of Mr. Fumble's face for one rasa (crop of the full rig).
export const FumbleFace: React.FC<{ rasa: Rasa; f: number; t: number; w: number; h: number; zoom?: number }> = ({ rasa, f, t, w, h, zoom = 1 }) => {
  const vw = 400 / zoom, vh = vw * (h / w);
  const cx = 0, cy = -845;
  return (
    <svg width={w} height={h} viewBox={`${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`}>
      <Fumble f={f} p={rasa.pose} />
      <Extras list={rasa.extras} t={t} p={rasa.pose} />
    </svg>
  );
};

// Model sheet: all nine faces (rig check).
export const FumbleRasaSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0f172a" }}>
      <Fonts />
      <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 64, color: "#fde047", letterSpacing: 4 }}>AI NAVARASALU</div>
      {RASAS.map((r, i) => (
        <div key={r.key} style={{ position: "absolute", left: 20 + (i % 3) * 350, top: 170 + Math.floor(i / 3) * 580, width: 340 }}>
          <div style={{ borderRadius: 24, overflow: "hidden", background: "#e2e8f0" }}>
            <FumbleFace rasa={r} f={f} t={f} w={340} h={400} />
          </div>
          <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 34, color: "white", marginTop: 10, textAlign: "center" }}>{r.name}</div>
          <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 22, color: "#cbd5e1", textAlign: "center", lineHeight: 1.2 }}>{r.line}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
