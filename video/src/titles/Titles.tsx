import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import tl from "../titles_timeline.json";

const GOLD = "#E8B04B";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TitleFonts: React.FC = () => (
  <style>{`
    @font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}
    @font-face{font-family:Cormorant;font-style:italic;font-weight:500;src:url(${staticFile("fonts/cormorant-garamond-latin-500-italic.woff2")}) format('woff2');}
  `}</style>
);

// Per-frame film grain + vignette + 2.39:1 letterbox.
const Film: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "screen" }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 60} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 138, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 138, background: "#000" }} />
    </>
  );
};

// Muse as a small ember: an amber orb with two eyes that blink once.
const Ember: React.FC<{ size: number; glow: number; eyes: number }> = ({ size, glow, eyes }) => {
  const f = useCurrentFrame();
  const blink = f > 345 && f < 351 ? 0.1 : 1;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        position: "relative",
        background: `radial-gradient(circle at 38% 32%, #fff4d6 0%, ${GOLD} 30%, #9a5b12 75%, #3a1f05 100%)`,
        boxShadow: `0 0 ${60 * glow}px ${GOLD}, 0 0 ${180 * glow}px rgba(232,176,75,0.45)`,
      }}
    >
      {[-1, 1].map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: size / 2 + s * size * 0.14 - size * 0.045,
            top: size * 0.38,
            width: size * 0.09,
            height: size * 0.17,
            borderRadius: size,
            background: "#fffaf0",
            opacity: eyes,
            transform: `scaleY(${blink})`,
          }}
        />
      ))}
    </div>
  );
};

export const Titles: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = f / fps;
  const impact = tl.impact;

  // Act 1: a thread of light.
  const lineW = interpolate(s, [0.3, 1.9], [0, 1400], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const lineO = interpolate(s, [0.3, 0.8, 6.6, 7.2], [0, 1, 1, 0], clamp);

  // Act 2: fragments flicker in on each hit.
  const frag = tl.fragments
    .map(([at, word], i) => ({ at: at as number, word: word as string, i }))
    .filter(({ at }, i, arr) => s >= at && s < (arr[i + 1]?.at ?? impact - 1.2) + 0.12);

  // Act 3: converge into the ember, silence, impact flash.
  const converge = interpolate(s, [6.8, impact - 0.25], [0, 1], { ...clamp, easing: (x) => x * x });
  const flash = interpolate(s, [impact, impact + 0.05, impact + 0.35], [0, 1, 0], clamp);

  // Act 4: title card.
  const t = s - impact;
  const titleO = interpolate(t, [0, 0.15, 6.3, 6.9], [0, 1, 1, 0], clamp);
  const tracking = interpolate(t, [0, 7], [90, 34]);
  const scale = interpolate(t, [0, 7], [1.08, 1]);
  const sweep = interpolate(t, [0.15, 2.6], [-30, 130], { ...clamp, easing: (x) => x * (2 - x) });
  // Title emerges from the dark: near-black to warm grey as the light passes.
  const lum = interpolate(t, [0.2, 3.5], [0, 1], clamp);
  const base = `rgb(${Math.round(20 + lum * 134)},${Math.round(20 + lum * 126)},${Math.round(20 + lum * 112)})`;
  const taglineO = interpolate(s, [9.6, 10.4, 14.2, 14.8], [0, 1, 1, 0], clamp);
  const smallO = interpolate(s, [12.3, 12.9, 14.2, 14.8], [0, 1, 1, 0], clamp);
  const emberSize = interpolate(converge, [0, 1], [0, 90]);
  const emberGlow = 0.6 + 0.4 * Math.sin(f / 9);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <Fonts />
      <TitleFonts />

      {/* Act 1 + 2 backdrop: faint cascading figures */}
      {s > 1.8 && s < impact &&
        Array.from({ length: 16 }).map((_, c) => (
          <div
            key={c}
            style={{
              position: "absolute",
              left: 60 + c * 118,
              top: -400 + ((f * (3 + (c % 4)) + c * 97) % 1400),
              fontFamily: "'DejaVu Sans Mono', monospace",
              fontSize: 18,
              lineHeight: 1.6,
              color: GOLD,
              opacity: 0.07 * (1 - converge),
              whiteSpace: "pre",
            }}
          >
            {Array.from({ length: 14 })
              .map((__, r) => Math.floor(random(`n${c}-${r}`) * 900000 + 10000).toLocaleString("en-IN"))
              .join("\n")}
          </div>
        ))}

      <div
        style={{
          position: "absolute",
          left: 960 - lineW / 2,
          top: 539,
          width: lineW,
          height: 2,
          opacity: lineO * (1 - converge),
          background: `linear-gradient(90deg, transparent, ${GOLD}, #fff, ${GOLD}, transparent)`,
          boxShadow: `0 0 18px ${GOLD}`,
        }}
      />

      {frag.map(({ at, word, i }) => {
        const age = s - at;
        const flicker = age < 0.06 ? random(`fl${i}-${f}`) : 1;
        const size = 110 + random(`sz${i}`) * 150;
        const x = 560 + random(`x${i}`) * 800;
        const y = 330 + random(`y${i}`) * 420;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%,-50%) scale(${1 + age * 0.25})`,
              fontFamily: "Anton, sans-serif",
              fontSize: size,
              letterSpacing: 6,
              color: i % 5 === 3 ? GOLD : "#e7e2d6",
              opacity: 0.85 * flicker * (1 - converge),
              textShadow: "0 0 30px rgba(0,0,0,0.9)",
              whiteSpace: "nowrap",
            }}
          >
            {word}
          </div>
        );
      })}

      {/* Converging particles */}
      {converge > 0 && converge < 1 &&
        Array.from({ length: 60 }).map((_, i) => {
          const a = random(`a${i}`) * Math.PI * 2;
          const r = (1 - converge) * (300 + random(`r${i}`) * 700);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 960 + Math.cos(a) * r,
                top: 470 + Math.sin(a) * r * 0.6,
                width: 3 + converge * 3,
                height: 3 + converge * 3,
                borderRadius: "50%",
                background: GOLD,
                opacity: 0.4 + converge * 0.6,
                boxShadow: `0 0 10px ${GOLD}`,
              }}
            />
          );
        })}

      {/* Ember (Muse): born from the convergence, sits above the title */}
      {s > 6.8 && (
        <div
          style={{
            position: "absolute",
            left: 960 - (t > 0 ? 55 : emberSize / 2),
            top: t > 0 ? 250 : 470 - emberSize / 2,
            opacity: t > 0 ? titleO : 1,
          }}
        >
          <Ember
            size={t > 0 ? 110 : Math.max(emberSize, 1)}
            glow={t > 0 ? emberGlow : converge * 1.5}
            eyes={interpolate(t, [2.4, 3], [0, 1], clamp)}
          />
        </div>
      )}

      {/* Title card */}
      <div
        style={{
          position: "absolute",
          top: 395,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleO,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: 250,
            lineHeight: 1,
            letterSpacing: tracking,
            paddingLeft: tracking,
            background: `linear-gradient(100deg, ${base} ${sweep - 22}%, ${GOLD} ${sweep - 6}%, #fffaf0 ${sweep}%, ${GOLD} ${sweep + 6}%, ${base} ${sweep + 22}%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          MUSE
        </div>
        <div
          style={{
            fontFamily: "Cormorant, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 50,
            color: "#b9b0a0",
            marginTop: 26,
            opacity: taglineO,
            transform: `translateY(${interpolate(taglineO, [0, 1], [12, 0])}px)`,
          }}
        >
          From the first document to the filed return.
        </div>
        <div
          style={{
            fontFamily: "Inter, 'DejaVu Sans', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 14,
            color: "#7d7466",
            marginTop: 26,
            opacity: smallO,
          }}
        >
          YOUR PERSONAL TAX ASSISTANT &nbsp;·&nbsp; FILING SEASON 2026
        </div>
      </div>

      <AbsoluteFill style={{ background: "#fff6dd", opacity: flash * 0.85 }} />
      <Film />

      <Audio src={staticFile(tl.score)} volume={0.62} />
      {tl.vo.map((v) => (
        <Sequence key={v.audio} from={Math.round(v.at * fps)} layout="none">
          <Audio src={staticFile(v.audio)} volume={0.72} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
