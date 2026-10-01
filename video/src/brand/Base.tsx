import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { B, F, prog } from "./tokens";

// Shared building blocks: fonts, animated aurora backgrounds, film grain, corner meta labels.
export const BrandFonts: React.FC = () => (
  <>
    <Fonts />
    <style>{[
      ["Anton", "anton-latin-400-normal", 400, "normal"],
      ["Archivo Black", "archivo-black-latin-400-normal", 400, "normal"],
      ["Playfair Display", "playfair-display-latin-900-italic", 900, "italic"],
      ["Playfair Display", "playfair-display-latin-700-normal", 700, "normal"],
      ["Space Mono", "space-mono-latin-700-normal", 700, "normal"],
      ["Bebas Neue", "bebas-neue-latin-400-normal", 400, "normal"],
      ["Permanent Marker", "permanent-marker-latin-400-normal", 400, "normal"],
    ].map(([fam, file, w, st]) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url(${staticFile(`fonts/${file}.woff2`)}) format('woff2');}`).join("\n")}</style>
  </>
);

/** Slow-drifting soft colour blobs. `dark` = night base with blue/violet glow; light = warm paper with pastels. */
export const Aurora: React.FC<{ dark?: boolean; seed?: number; intensity?: number }> = ({ dark = false, seed = 0, intensity = 1 }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const blobs = dark
    ? [[B.blue, 0.55], [B.violet, 0.45], [B.cyan, 0.22], [B.amber, 0.08]]
    : [["#9DB4FF", 0.55], ["#C9B6FF", 0.5], ["#A5F3FC", 0.45], ["#FFE1A8", 0.35]];
  return (
    <AbsoluteFill style={{ background: dark ? B.night : B.paper, overflow: "hidden" }}>
      {blobs.map(([c, a], i) => {
        const t = f / 90 + i * 1.7 + seed;
        const x = W * (0.5 + 0.38 * Math.sin(t * 0.7 + i));
        const y = H * (0.45 + 0.32 * Math.cos(t * 0.5 + i * 2));
        const r = Math.max(W, H) * (0.42 + 0.08 * Math.sin(t + i));
        return (
          <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${c} 0%, transparent 62%)`, opacity: (a as number) * intensity }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Animated film grain (a noise tile shifted every frame). Cheap and kills the flat "AI gradient" look. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const f = useCurrentFrame();
  const ox = ((f * 73) % 256) - 128, oy = ((f * 151) % 256) - 128;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay", backgroundImage: `url(${staticFile("brand/grain.png")})`, backgroundPosition: `${ox}px ${oy}px` }} />
  );
};

/** Tiny editorial corner labels + a thin progress line, like premium motion reels. */
export const Meta: React.FC<{ left?: string; right?: string; dark?: boolean; progress?: number }> = ({ left = "AI MAASTAARU", right = "", dark = true, progress }) => {
  const f = useCurrentFrame();
  const col = dark ? "rgba(255,255,255,0.55)" : "rgba(10,15,36,0.5)";
  const a = prog(f, 0, 12);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: a }}>
      <div style={{ position: "absolute", top: 64, left: 64, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: col }}>{left}</div>
      <div style={{ position: "absolute", top: 64, right: 64, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: col }}>{right}</div>
      {progress !== undefined && (
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 70, height: 3, background: dark ? "rgba(255,255,255,0.15)" : "rgba(10,15,36,0.12)" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: dark ? "rgba(255,255,255,0.7)" : B.ink }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Shot: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => <Img src={staticFile(src)} style={style} />;
