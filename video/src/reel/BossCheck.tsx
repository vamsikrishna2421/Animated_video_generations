import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { FPose, Fumble } from "./Fumble";
import boss from "./mocap/boss.json";

// Side-by-side check for the whole-body capture: the reference clip on top (private, never published), Mr. Fumble
// driven by the capture below, with the small parts (feet, wrists, fingers, phone) switched on.
type Data = { frames: number; tracks: { x: number[]; poses: FPose[] }[] };
const D = boss as unknown as Data;
export const BOSS_LEN = D.frames;

export const BossCheck: React.FC<{ bones?: boolean }> = ({ bones = false }) => {
  const f = useCurrentFrame();
  const tr = D.tracks[0];
  const i = Math.min(tr.poses.length - 1, f);
  const p = tr.poses[i];
  const x = Math.max(-200, Math.min(200, tr.x[i] * 0.5));
  return (
    <AbsoluteFill style={{ background: "#120c26" }}>
      <Fonts />
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 960, display: "flex", justifyContent: "center", background: "#000" }}>
        <OffthreadVideo src={staticFile("mocap/boss.mp4")} muted style={{ height: 960 }} />
      </div>
      <div style={{ position: "absolute", top: 960, left: 0, right: 0, bottom: 0, background: "linear-gradient(#2a1c5a, #3b1f4a 70%, #6b3a26)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${540 + x},1840) scale(0.86)`}><Fumble f={f} p={p} bones={bones} look="boss" /></g>
      </svg>
      <div style={{ position: "absolute", top: 976, left: 24, fontFamily: "Inter", fontWeight: 800, fontSize: 30, color: "#fff", background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: 12 }}>whole-body capture → Mr. Fumble · feet · wrists · fingers · phone</div>
    </AbsoluteFill>
  );
};
