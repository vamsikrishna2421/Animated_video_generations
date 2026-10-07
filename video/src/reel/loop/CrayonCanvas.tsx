import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ctx, grain, vignette } from "./crayon";

// Loads the handwriting fonts once, then re-renders so the canvas draws with them.
export const useCrayonFonts = () => {
  const [handle] = useState(() => delayRender("crayon fonts"));
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const faces = [
      new FontFace("Caveat", `url(${staticFile("fonts/caveat-latin-700-normal.woff2")})`, { weight: "700" }),
      new FontFace("Patrick Hand", `url(${staticFile("fonts/patrick-hand-latin-400-normal.woff2")})`),
    ];
    Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l)))).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

export type Draw = (c: Ctx, W: number, H: number, f: number, boil: number) => void;

// Full-frame canvas; `draw` gets the scene-local frame and a boil seed that changes every 3 frames.
export const CrayonCanvas: React.FC<{ draw: Draw; grainAmt?: number; vig?: number }> = ({ draw, grainAmt = 0.2, vig = 0.45 }) => {
  const ready = useCrayonFonts();
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c || !ready) return;
    const boil = Math.floor(f / 3);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    draw(c, W, H, f, boil);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (vig) vignette(c, W, H, vig);
    if (grainAmt) grain(c, W, H, grainAmt, boil);
  });
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} />
    </AbsoluteFill>
  );
};
