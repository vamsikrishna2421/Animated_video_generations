import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Band, Title } from "./KingfisherRide";

// The 30 s Blender (Cycles) kingfisher film with titles and the original score.
// film.mp4 = Blender frames (720x1280, 24 fps) upscaled to 1080x1920 by ffmpeg.
export const KFF_FPS = 24;
export const KFF_LEN = 30 * KFF_FPS;

export const KingfisherFilm: React.FC<{ handle?: string }> = ({ handle = "@ai_maastaaru" }) => {
  const f = useCurrentFrame();
  const T = f / KFF_FPS;
  const endDim = interpolate(T, [26.4, 27.0], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(T, [0, 0.35], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("kingfisher/film.mp4")} muted />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(0,0,0,0.45) 100%)" }} />
      <Band T={T} a={0.15} b={2.4} top={1390}>
        <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.2 }}>AI wrote every line of code<br />for this film.</div>
        <div style={{ fontSize: 34, fontWeight: 600, marginTop: 14, color: "#7dd3fc" }}>No 3D models. No stock footage.</div>
      </Band>
      <Band T={T} a={2.7} b={4.9} top={250} dark={0.55}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 96, fontWeight: 700, letterSpacing: 10 }}>KINGFISHER</div>
        <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: 4, marginTop: 8, fontStyle: "italic", color: "#ffe2b8" }}>Alcedo atthis</div>
      </Band>
      <Band T={T} a={11.3} b={13.8} top={1460}>
        <div style={{ fontSize: 40, fontWeight: 700 }}>Path-traced in Blender.<br />Every feather placed by code.</div>
      </Band>
      <Band T={T} a={16.3} b={18.2} top={1460}><div style={{ fontSize: 40, fontWeight: 700 }}>A third eyelid shuts as it enters the water.</div></Band>
      <Band T={T} a={24.2} b={26.4} top={1460}><div style={{ fontSize: 44, fontWeight: 700 }}>One dive. One fish. Breakfast.</div></Band>
      <AbsoluteFill style={{ background: "black", opacity: endDim }} />
      <Title T={T} a={26.9} b={30.6} top={1040} size={50}>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: 3, lineHeight: 1.25 }}>AI-WRITTEN CODE.<br />RENDERED IN BLENDER.</div>
        <div style={{ marginTop: 34, fontSize: handle.length > 16 ? 60 : 80, fontWeight: 800, color: "#7dd3fc" }}>{handle}</div>
        <div style={{ marginTop: 18, fontSize: 34, opacity: 0.9 }}>Follow for more AI builds</div>
      </Title>
      <AbsoluteFill style={{ background: "black", opacity: fadeIn }} />
      <Audio src={staticFile("kingfisher/film_audio.wav")} />
    </AbsoluteFill>
  );
};
