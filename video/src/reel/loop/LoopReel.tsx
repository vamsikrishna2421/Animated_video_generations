import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { grain, vignette } from "./crayon";
import { shotClock, shotPage } from "./scenes";

// "The loop": procrastination -> feed AI, drawn entirely in code (crayon look).
export const LOOP_FPS = 30;
export const LOOP_TEST_LEN = Math.round(7.4 * LOOP_FPS);

const useFonts = () => {
  const [handle] = useState(() => delayRender("loop fonts"));
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const faces = [
      new FontFace("Caveat", `url(${staticFile("fonts/caveat-latin-700-normal.woff2")})`, { weight: "700" }),
      new FontFace("Patrick Hand", `url(${staticFile("fonts/patrick-hand-latin-400-normal.woff2")})`),
    ];
    Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l)))).then(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};

export const LoopReel: React.FC = () => {
  const ready = useFonts();
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c || !ready) return;
    const t = frame / LOOP_FPS;
    const boil = Math.floor(frame / 3);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    if (t < 3.1) shotClock(c, W, H, t, boil);
    else shotPage(c, W, H, t - 3.1, boil);
    // white flash on the cut
    const fl = Math.max(0, 1 - Math.abs(t - 3.1) / 0.08);
    if (fl > 0) { c.fillStyle = `rgba(255,255,255,${fl * 0.8})`; c.fillRect(0, 0, W, H); }
    vignette(c, W, H, 0.5);
    grain(c, W, H, 0.22, boil);
  });
  return (
    <AbsoluteFill style={{ background: "#081670" }}>
      <canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} />
    </AbsoluteFill>
  );
};
