import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../components/Fonts";
import { Stage } from "./FumbleMaking";
import { FPose, Fumble, Look } from "./Fumble";
import testJp from "./mocap/test_jp.json";
import yeshDuet1 from "./mocap/yesh_duet1.json";
import yeshDuet2 from "./mocap/yesh_duet2.json";
import yeshNani1 from "./mocap/yesh_nani1.json";
import yeshNani1Flat from "./mocap/yesh_nani1_flat.json";
import yeshWide1 from "./mocap/yesh_wide1.json";
import yeshWide2 from "./mocap/yesh_wide2.json";

// Retargeting check: the reference clip (top) and the rig performing the captured motion (bottom).
export type MocapTrack = { x: number[]; poses: FPose[] };
export type MocapData = { fps: number; frames: number; src: { w: number; h: number }; tracks: MocapTrack[] };
export const MOCAP: Record<string, MocapData> = { test_jp: testJp as unknown as MocapData, yesh_duet1: yeshDuet1 as unknown as MocapData, yesh_duet2: yeshDuet2 as unknown as MocapData, yesh_nani1: yeshNani1 as unknown as MocapData, yesh_nani1_flat: yeshNani1Flat as unknown as MocapData, yesh_wide1: yeshWide1 as unknown as MocapData, yesh_wide2: yeshWide2 as unknown as MocapData };

export const MocapCheck: React.FC<{ name: string; look?: Look; track?: number; compare?: string }> = ({ name, look = "fumble", track = 0, compare }) => {
  const f = useCurrentFrame();
  const d = MOCAP[name];
  const tr = d.tracks[track];
  const i = Math.min(tr.poses.length - 1, f);
  return (
    <AbsoluteFill style={{ background: "#0b1022" }}>
      <Fonts />
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 810, overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(`mocap/${name}.mp4`)} style={{ width: 1080, height: 810, objectFit: "contain" }} muted />
      </div>
      <div style={{ position: "absolute", top: 810, left: 0, width: 1080, height: 1110, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -810, left: 0, width: 1080, height: 1920 }}><Stage /></div>
        <svg width={1080} height={1110} style={{ position: "absolute", inset: 0 }}>
          {compare ? (
            <>
              <g transform="translate(300,850) scale(0.62)"><Fumble f={f} p={MOCAP[compare].tracks[track].poses[Math.min(i, MOCAP[compare].tracks[track].poses.length - 1)]} look={look} /></g>
              <g transform="translate(780,850) scale(0.62)"><Fumble f={f} p={tr.poses[i]} look={look} /></g>
              <text x={300} y={1080} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={34} fill="#0f172a">2D (before)</text>
              <text x={780} y={1080} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={34} fill="#0f172a">3D (new)</text>
            </>
          ) : <g transform={`translate(${540 + tr.x[i] * 0.55},${850}) scale(0.72)`}><Fumble f={f} p={tr.poses[i]} look={look} /></g>}
        </svg>
      </div>
      <div style={{ position: "absolute", top: 830, left: 30, fontFamily: "Inter", fontWeight: 900, fontSize: 40, color: "#0f172a" }}>motion capture → Mr. Fumble</div>
    </AbsoluteFill>
  );
};
