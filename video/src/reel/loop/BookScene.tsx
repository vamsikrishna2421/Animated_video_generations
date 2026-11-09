import React, { useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Sfx } from "./DistillCrayon";
import { cueAt } from "./SkitCrayon";

// Creative 24 "The Same Question, 101 Tokens" (series/scripts/creative24_tokens_book.md): the 3D-textbook format test
// (Vamsi via Bujji, Nov 6). An open book on a desk: the left page holds the words, the right page's diagram lifts off the
// paper into 3D; page turns move to the next idea. Our test (series/scripts/creative24_demo/tokens.json): the same
// question takes 13 tokens in English and 101 in Telugu on an older tokenizer; over five questions Telugu took 7.35x the
// tokens (older), 1.68x (newer, used by today's ChatGPT models per OpenAI's tiktoken), 6.38x (the open Qwen2.5 and Qwen3).
// v3 (render review): the good news before why-it-matters, so the memory bars show the real ratios; the chunks on the right
// page; the left page's words in a column clear of the gutter (no fragments while the camera leans in); the turning page's
// back no longer mirrored; a header in the top third and a saveable table on the bars; the counter on the last page.
// Render with GL=swangle (no GPU).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const PW = 2.5, PH = 3.4;   // one page (x by z)
const CW = 1000, CH = 1360;   // page canvas
const BLUE = "#3b82f6", ORANGE = "#f97316", INK = "#1f2937";
const EN_Q = "Can you explain why my electricity bill is so high this month?";
const TE_Q = "ఈ నెల నా కరెంట్ బిల్లు ఎందుకు ఇంత ఎక్కువ వచ్చిందో చెప్పగలవా?";
const EN_PIECES = ["Can", " you", " explain", " why", " my", " electricity", " bill", " is", " so", " high", " this", " month", "?"];
const RATIOS: [string, number][] = [["older ChatGPT", 7.35], ["today's ChatGPT", 1.68], ["Qwen (open)", 6.38]];
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const spreadOf = (n: number) => (n <= 4 ? 0 : n <= 6 ? 1 : n === 7 ? 2 : 3);
const FIRST = [1, 5, 7, 8];   // the line that opens each spread (its page turn)

const useFonts = () => {
  const [handle] = useState(() => delayRender("book fonts"));
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const faces = [
      new FontFace("BookTe", `url(${staticFile("fonts/noto-sans-telugu-telugu-700-normal.woff2")})`, { weight: "700" }),
      new FontFace("BookSans", `url(${staticFile("fonts/inter-latin-800-normal.woff2")})`, { weight: "800" }),
      new FontFace("BookSans", `url(${staticFile("fonts/inter-latin-600-normal.woff2")})`, { weight: "600" }),
      new FontFace("BookHand", `url(${staticFile("fonts/caveat-latin-700-normal.woff2")})`, { weight: "700" }),
    ];
    Promise.all(faces.map((x) => x.load().then((l) => document.fonts.add(l)))).then(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};
const wrap = (g: CanvasRenderingContext2D, text: string, max: number) => {
  const out: string[] = []; let cur = "";
  text.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; });
  if (cur) out.push(cur);
  return out;
};
const paper = (g: CanvasRenderingContext2D, left: boolean) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, CW, CH);
  const gr = g.createLinearGradient(left ? CW : 0, 0, left ? CW - 120 : 120, 0);   // the gutter shade
  gr.addColorStop(0, "rgba(120,90,50,0.28)"); gr.addColorStop(1, "rgba(120,90,50,0)");
  g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
};
const leftPage = (title: string, body: [string, string][]) => canvasTex(CW, CH, (g) => {
  paper(g, true);
  g.fillStyle = "#b45309"; g.font = "700 80px BookHand"; g.textAlign = "left"; g.fillText(title, 70, 150);
  g.fillStyle = "#b45309"; g.fillRect(70, 180, 640, 6);
  let y = 290;
  body.forEach(([t, kind]) => {
    const te = kind === "te";
    g.font = te ? "700 70px BookTe" : kind === "label" ? "600 54px BookSans" : "800 76px BookSans";
    g.fillStyle = kind === "label" ? "#6b7280" : te ? "#c2410c" : INK;
    wrap(g, t, 640).forEach((ln) => { g.fillText(ln, 60, y); y += te ? 106 : kind === "label" ? 74 : 96; });
    y += 30;
  });
});
const rightPage = (caption: string) => canvasTex(CW, CH, (g) => {
  paper(g, false);
  g.strokeStyle = "rgba(59,130,246,0.12)"; g.lineWidth = 2;
  for (let x = 100; x < CW; x += 100) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x, CH - 160); g.stroke(); }
  for (let y = 100; y < CH - 150; y += 100) { g.beginPath(); g.moveTo(60, y); g.lineTo(CW - 60, y); g.stroke(); }
  g.fillStyle = "#6b7280"; g.font = "600 54px BookSans"; g.textAlign = "center"; g.fillText(caption, CW / 2, CH - 70);
});
// the last right page: the free counter, drawn like the page it names
const counterPage = () => canvasTex(CW, CH, (g) => {
  paper(g, false);
  g.textAlign = "left";
  g.fillStyle = "#b45309"; g.font = "700 84px BookHand"; g.fillText("Try it (free):", 90, 170);
  g.fillStyle = "#111827"; g.beginPath(); g.roundRect(70, 220, 860, 120, 24); g.fill();
  g.fillStyle = "#f9fafb"; g.font = "800 50px BookSans"; g.fillText("platform.openai.com/tokenizer", 100, 300);
  g.fillStyle = "#6b7280"; g.font = "600 46px BookSans"; g.fillText("OpenAI's Tokenizer page (its models)", 90, 410);
  const box = (y: number, txt: string, te: boolean, n: string, col: string) => {
    g.strokeStyle = "#d1d5db"; g.lineWidth = 4; g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(70, y, 860, 150, 18); g.fill(); g.stroke();
    g.fillStyle = INK; g.font = te ? "700 50px BookTe" : "800 50px BookSans"; g.fillText(txt, 100, y + 92);
    g.fillStyle = col; g.font = "800 64px BookSans"; g.textAlign = "right"; g.fillText(n, 900, y + 98); g.textAlign = "left";
  };
  g.fillStyle = "#6b7280"; g.font = "600 44px BookSans"; g.fillText("1. paste your English sentence", 90, 520);
  box(550, "Can you explain why my…", false, "13", BLUE);
  g.fillStyle = "#6b7280"; g.font = "600 44px BookSans"; g.fillText("2. paste it in Telugu", 90, 790);
  box(820, "ఈ నెల నా కరెంట్ బిల్లు…", true, "23", ORANGE);
  g.fillStyle = "#14532d"; g.font = "800 50px BookSans"; g.fillText("3. comment both numbers", 90, 1080);
  g.fillStyle = "#6b7280"; g.font = "600 38px BookSans"; g.fillText("(today's ChatGPT tokenizer: 13 and 23)", 90, 1150);
});
const label = (text: string, col: string, size = 120, te = false) => canvasTex(1024, 256, (g) => {
  g.font = te ? `700 ${size}px BookTe` : `800 ${size}px BookSans`; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineWidth = 18; g.strokeStyle = "rgba(255,255,255,0.95)"; g.strokeText(text, 512, 128);
  g.fillStyle = col; g.fillText(text, 512, 128);
});

// the camera: the whole spread (k = 1), or leaning in on the page that's talking (x = its centre, k < 1)
const Cam: React.FC<{ x: number; k: number }> = ({ x, k }) => {
  const { camera } = useThree();
  camera.position.set(x, 9.0 * k + 0.5 * (1 - k), 13.6 * k);
  camera.lookAt(x, 0.5 - 0.15 * (1 - k), 1.0 * (1 - k));   // stills: zoomed, the page ran under the captions
  camera.updateProjectionMatrix();
  return null;
};
const Sprite: React.FC<{ map: THREE.Texture; pos: [number, number, number]; w: number; o?: number }> = ({ map, pos, w, o = 1 }) =>
  o <= 0 ? null : (
    <sprite position={pos} scale={[w, w / 4, 1]}>
      <spriteMaterial map={map} transparent opacity={o} depthTest={false} />
    </sprite>
  );
// a stack of cubes, `n` of them, 3 x 3 a layer, risen by `k` (0..1), cubes landing one after another
const Tower: React.FC<{ n: number; x: number; z: number; col: string; k: number }> = ({ n, x, z, col, k }) => {
  const s = 0.15, gap = 0.012;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }, (_, i) => {
        const layer = Math.floor(i / 9), a = i % 9, cx = (a % 3) - 1, cz = Math.floor(a / 3) - 1;
        const t = ease(clamp(k * (n + 8) / 8 - i / 8));
        if (t <= 0) return null;
        return (
          <mesh key={i} position={[cx * (s + gap), 0.08 + layer * (s + gap) + (1 - t) * 1.2, cz * (s + gap)]} scale={[t, t, t]}>
            <boxGeometry args={[s, s, s]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

const StBook: React.FC<SP> = ({ s }) => {
  const ready = useFonts();
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const tx = useMemo(() => {
    if (!ready) return null;
    return {
      L: [
        leftPage("1 · The same question", [["In English", "label"], [EN_Q, "en"], ["In Telugu", "label"], [TE_Q, "te"]]),
        leftPage("2 · Our test", [["5 everyday questions", "en"], ["English and Telugu, the same meaning", "label"], ["3 real token counters", "en"], ["Nov 2026, every token counted", "label"]]),
        leftPage("3 · Why it matters", [["An AI holds only so many tokens of a chat.", "en"], ["More tokens a message:", "label"], ["a long Telugu chat loses its start sooner.", "en"]]),
        leftPage("4 · What you can do", [["Long Telugu chat forgetting?", "label"], ["Ask for a short summary, paste it into a new chat.", "en"], ["Building with AI?", "label"], ["Count Telugu tokens, compare models.", "en"]]),
      ],
      R: [rightPage("the same question, in tokens"), rightPage("Telugu tokens ÷ English tokens"), rightPage("the same long chat: room used"), counterPage()],
      en13: label("13", BLUE, 150), te101: label("101", ORANGE, 150), enL: label("English", BLUE, 90), teL: label("Telugu", ORANGE, 90),
      pieces: EN_PIECES.map((p) => label(p.trim(), "#1e3a8a", p.trim().length > 6 ? 120 : 150)), cur: label("current", BLUE, 100), curTe: label("కరెంట్", ORANGE, 110, true),
      one: label("1 token", BLUE, 90), twelve: label("12 tokens", ORANGE, 90),
      ratios: ["7.4×", "1.7×", "6.4×"].map((r) => label(r, "#374151", 150)),   // 7.35 rounds to 7.4 (toFixed gave 7.3)
      names: RATIOS.map(([nm]) => label(nm, "#4b5563", 96)),
      memNames: [label("English", BLUE, 80), label("Telugu · today's ChatGPT", ORANGE, 72), label("Telugu · Qwen (open)", "#dc2626", 76)],
      memX: [label("1×", BLUE, 200), label("1.7×", ORANGE, 200), label("6.4×", "#dc2626", 200)],
      te23: label("23", ORANGE, 150),
    };
  }, [ready]);
  // where we are: the line playing now (scene-local), its number in the script, its progress
  const idx = (() => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; })();
  const b = beats[idx], ln = ls[idx], n = b.n;
  const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
  const endL = ln.from + ln.frames;
  // the page turn into this spread (on the spread's first line), or the flip back to spread 1 after the last line
  const sp = spreadOf(n);
  let turn = 0, from = sp, to = sp;
  if (FIRST.includes(n) && n !== 1) { turn = ease(seg(f, ln.from - 14, ln.from + 8)); from = sp - 1; to = sp; }
  const back = b.prop === "loop" ? ease(seg(f, endL + 4, endL + 18)) : 0;   // the loop: the book flips back to spread 1
  if (back > 0) { from = 3; to = 0; }
  const leftShown = back > 0 ? (back > 0.5 ? 0 : 3) : turn >= 1 || !(FIRST.includes(n) && n !== 1) ? to : from;
  const rightShown = back > 0 ? 0 : to;
  // 3D content: each spread's diagram rises after its turn and sinks before the next
  const rise = (a: number, d = 14) => ease(seg(f, a, a + d));
  const sinkBefore = (FIRST.includes(n) && n !== 1 && turn < 1) || (back > 0 && back < 1) ? 0 : 1;   // v3: the loop's landing keeps its towers
  const k1 = n === 1 || (back > 0 && back >= 1) ? 1 : 0;   // frame 1 (and the loop's landing): the towers stand
  const towersK = b.prop === "hook" ? 1 : b.prop === "loop" ? rise(endL + 16, 10) : 0;
  const chunksK = b.prop === "chunks" ? rise(cu(1, 0.4)) : 0;
  const curK = b.prop === "telugu" ? rise(ln.from + 2) : b.prop === "why" ? 1 : 0;
  const burst = b.prop === "telugu" ? ease(seg(f, cu(1, 0.45), cu(1, 0.45) + 16)) : b.prop === "why" ? 1 : 0;
  const memK = b.prop === "memory" ? rise(ln.from + 8) : 0;
  const memFill = b.prop === "memory" ? ease(seg(f, cu(1, 0.2), cu(1, 0.2) + 45)) : 0;
  const shrink = b.prop === "newer" ? ease(seg(f, ln.from + 20, ln.from + 50)) : 0;   // the 101 tower becomes 23
  const newerTowers = b.prop === "newer" && f < cu(1, 0.35) ? rise(ln.from + 6, 10) : 0;
  const barsK = b.prop === "newer" ? (f >= cu(1, 0.35) ? rise(cu(1, 0.35)) : 0) : b.prop === "fair" ? 1 : 0;
  const barsShown = b.prop === "newer" ? 2 : 3;
  void k1;
  const turnAngle = back > 0 ? Math.PI * (1 - back) : Math.PI * turn;
  // stills: the book was small on a phone: lean in on the right page for the 3D beats, on the left page for the tips;
  // the whole spread on frame 1, the chunk row, and around every page turn
  const lean = (side: number, a: number) => side * ease(seg(f, a, a + 16));
  const near = ["chunks", "telugu", "why", "newer", "fair", "memory"].includes(b.prop);
  const turning = FIRST.includes(n) && n !== 1 ? 1 - ease(seg(f, ln.from + 8, ln.from + 24)) : 0;
  const endOut = 1 - ease(seg(f, endL - 6, endL + 6));   // out again before the next line's page turn
  const nextTurns = ["why", "fair", "memory"].includes(b.prop);
  // the tips: lean in on the left page's tips, then across to the counter on the right page at [2], out before the flip back
  const c2 = b.prop === "loop" ? cu(2, 0.55) : 0;
  const outEnd = 1 - ease(seg(f, endL - 2, endL + 6));
  const tipR = b.prop === "loop" ? ease(seg(f, c2 - 4, c2 + 12)) * outEnd : 0;
  const leanR = near ? lean(1, ["telugu", "chunks"].includes(b.prop) ? ln.from + 2 : ln.from) * (1 - turning) * (nextTurns ? endOut : 1) : tipR;
  const leanL = b.prop === "loop" ? ease(seg(f, ln.from + 16, ln.from + 32)) * (1 - ease(seg(f, c2 - 4, c2 + 12))) * outEnd : 0;
  const camX = 1.25 * leanR - 1.25 * leanL, camK = 1 - 0.36 * Math.max(leanR, leanL);
  // sounds: a page turn on every turn, a pop as things land, a boom on the clash numbers
  const sfx: React.ReactNode[] = [];
  beats.forEach((bb, i) => {
    const l = ls[i]; if (!l) return; const k = (x: string) => `${x}${i}`;
    if (FIRST.includes(bb.n) && bb.n !== 1) sfx.push(<Sfx key={k("t")} at={Math.max(0, l.from - 14)} src="audio/sfx_whoosh.wav" vol={0.75} />);
    if (bb.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={cueAt(l, 1, /^$/, l.from + Math.round(l.frames * 0.5)) - 2} src="reel/sfx_boom.wav" vol={0.8} />);
    if (bb.prop === "telugu") sfx.push(<Sfx key={k("g")} at={cueAt(l, 1, /^$/, l.from + Math.round(l.frames * 0.45))} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (bb.prop === "why") sfx.push(<Sfx key={k("s")} at={cueAt(l, 1, /^$/, l.from + Math.round(l.frames * 0.3))} src="audio/sfx_pop.wav" vol={0.3} />);
    if (bb.prop === "memory") sfx.push(<Sfx key={k("z")} at={cueAt(l, 1, /^$/, l.from + Math.round(l.frames * 0.2)) + 38} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (bb.prop === "newer") sfx.push(<Sfx key={k("d")} at={l.from + 48} src="audio/gag_ding.wav" vol={0.45} />, <Sfx key={k("n")} at={cueAt(l, 1, /^$/, l.from + Math.round(l.frames * 0.35)) - 2} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.7} />);
    if (bb.prop === "fair") sfx.push(<Sfx key={k("d")} at={cueAt(l, 2, /^$/, l.from + Math.round(l.frames * 0.8))} src="reel/sfx_boom.wav" vol={0.75} />);
    if (bb.prop === "loop") sfx.push(<Sfx key={k("p")} at={cueAt(l, 2, /^$/, l.from + Math.round(l.frames * 0.55)) - 4} src="audio/sfx_pop.wav" vol={0.35} />);
    if (bb.prop === "loop") { const e = l.from + l.frames; sfx.push(<Sfx key={k("w")} at={e + 4} src="audio/sfx_whoosh.wav" vol={0.75} />, <Sfx key={k("h")} at={e + 18} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  const showBlocks = b.prop === "hook" || (b.prop === "loop" && back >= 1);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, #3a2a1c 0%, #140d08 80%)" }}>
      {sfx}
      {tx && (
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 9.0, 13.6], fov: 34, near: 0.1, far: 100 }} gl={{ antialias: true }}>
          <Cam x={camX} k={camK} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[3, 9, 6]} intensity={1.6} />
          <group rotation={[0.42, 0, 0]}>
            {/* the desk and the cover */}
            <mesh position={[0, -0.12, 0]}><boxGeometry args={[2 * PW + 0.35, 0.1, PH + 0.3]} /><meshStandardMaterial color="#7f1d1d" roughness={0.7} /></mesh>
            {/* the static pages */}
            <mesh position={[-PW / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[PW, PH]} /><meshStandardMaterial map={tx.L[leftShown]} roughness={0.9} /></mesh>
            <mesh position={[PW / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[PW, PH]} /><meshStandardMaterial map={tx.R[rightShown]} roughness={0.9} /></mesh>
            {/* the turning page: front = the old right page, back = the new left page */}
            {(turnAngle > 0.001 && turnAngle < Math.PI - 0.001) && (
              <group rotation={[0, 0, turnAngle]} position={[0, 0.004, 0]}>
                <mesh position={[PW / 2, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[PW, PH]} /><meshStandardMaterial map={tx.R[back > 0 ? 0 : from]} side={THREE.FrontSide} roughness={0.9} /></mesh>
                {/* the back: turned over about z so that, once the page lies on the left, it reads like the left page (not mirrored) */}
                <group position={[PW / 2, -0.001, 0]} rotation={[0, 0, Math.PI]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[PW, PH]} /><meshStandardMaterial map={tx.L[back > 0 ? 3 : to]} side={THREE.FrontSide} roughness={0.9} /></mesh>
                </group>
              </group>
            )}
            {/* spread 1: the two towers; the English chunks; "current" vs "కరెంట్" */}
            {towersK > 0 && sinkBefore > 0 && (
              <>
                <Tower n={13} x={0.7} z={0.3} col={BLUE} k={towersK} />
                <Tower n={101} x={1.85} z={0.3} col={ORANGE} k={towersK} />
                <Sprite map={tx.en13} pos={[0.7, 0.75, 0.3]} w={1.4} o={towersK} />
                <Sprite map={tx.te101} pos={[1.85, 2.45, 0.3]} w={1.4} o={towersK} />
                <Sprite map={tx.enL} pos={[0.7, 0.1, 1.25]} w={1.3} o={towersK} />
                <Sprite map={tx.teL} pos={[1.85, 0.1, 1.25]} w={1.3} o={towersK} />
              </>
            )}
            {chunksK > 0 && EN_PIECES.map((p, i) => {   // the right page only (they covered the question on the left page)
              const t = ease(clamp(chunksK * 2 - i / 13)); const x = 0.42 + (i % 3) * 0.83, z = -1.0 + Math.floor(i / 3) * 0.56;
              return (
                <group key={i} position={[x, 0.08 + t * 0.3, z]}>
                  <mesh scale={[t, t, t]}><boxGeometry args={[0.7, 0.14, 0.3]} /><meshStandardMaterial color="#bfdbfe" roughness={0.5} /></mesh>
                  <Sprite map={tx.pieces[i]} pos={[0, 0.24, 0]} w={0.82} o={t} />
                </group>
              );
            })}
            {curK > 0 && (
              <>
                <mesh position={[0.55, 0.1 + curK * 0.5, 0]} scale={[curK, curK, curK]}><boxGeometry args={[0.85, 0.3, 0.5]} /><meshStandardMaterial color="#bfdbfe" /></mesh>
                <Sprite map={tx.cur} pos={[0.55, 1.05, 0]} w={1.3} o={curK} />
                <Sprite map={tx.one} pos={[0.55, 0.2, 0.9]} w={1.2} o={curK} />
                {Array.from({ length: 12 }, (_, i) => {
                  const cx = 1.8 + (burst > 0 ? ((i % 4) - 1.5) * 0.3 * burst : 0), cz = burst > 0 ? (Math.floor(i / 4) - 1) * 0.42 * burst : 0;
                  const sz = burst > 0 ? 0.22 : 0.001;
                  return <mesh key={i} position={[cx, 0.1 + curK * 0.5 + (burst > 0 ? Math.sin(i * 1.7) * 0.15 * burst : 0), cz]}><boxGeometry args={[sz, sz, sz]} /><meshStandardMaterial color={ORANGE} /></mesh>;
                })}
                {burst < 0.2 && <mesh position={[1.8, 0.1 + curK * 0.5, 0]} scale={[curK, curK, curK]}><boxGeometry args={[0.95, 0.3, 0.5]} /><meshStandardMaterial color="#fed7aa" /></mesh>}
                <Sprite map={tx.curTe} pos={[1.8, 1.15, 0]} w={1.4} o={curK} />
                <Sprite map={tx.twelve} pos={[1.8, 0.2, 1.0]} w={1.3} o={burst} />
              </>
            )}
            {newerTowers > 0 && (
              <>
                <Tower n={13} x={0.7} z={0.3} col={BLUE} k={newerTowers} />
                <Tower n={Math.round(101 - 78 * shrink)} x={1.85} z={0.3} col={ORANGE} k={newerTowers} />
                <Sprite map={tx.en13} pos={[0.7, 0.75, 0.3]} w={1.4} o={newerTowers} />
                <Sprite map={shrink > 0.95 ? tx.te23 : tx.te101} pos={[1.85, 0.75 + 1.7 * (1 - shrink), 0.3]} w={1.4} o={newerTowers} />
              </>
            )}
            {/* spread 3: the same long chat, memory used: English 1x, today's ChatGPT 1.7x, a free open model 6.4x */}
            {memK > 0 && [0.15, 0.15 * 1.68, 0.15 * 6.38].map((fill, q) => {
              const col = [BLUE, ORANGE, "#dc2626"][q], z = -1.05 + q * 0.95;
              return (
                <group key={q}>
                  <group position={[1.25, 0.1, z]} scale={[memK, memK, memK]}>
                    <mesh><boxGeometry args={[2.0, 0.16, 0.3]} /><meshStandardMaterial color="#e5e7eb" transparent opacity={0.65} /></mesh>
                    <mesh position={[-1.0 + fill * memFill, 0.01, 0]}><boxGeometry args={[Math.max(0.001, 2 * fill * memFill), 0.19, 0.32]} /><meshStandardMaterial color={col} /></mesh>
                  </group>
                  <Sprite map={tx.memNames[q]} pos={[1.0, 0.18, z - 0.36]} w={1.75} o={memK} />
                  <Sprite map={tx.memX[q]} pos={[2.2, 0.2, z - 0.36]} w={0.95} o={memFill} />
                </group>
              );
            })}
            {/* spread 3: Telugu tokens / English tokens, three tokenizers */}
            {barsK > 0 && RATIOS.map(([, r], q) => {
              if (q >= barsShown) return null;
              const x = 0.5 + q * 0.75, h = 0.24 * r * barsK;
              return (
                <group key={q}>
                  <mesh position={[x - 0.14, 0.12, 0.2]}><boxGeometry args={[0.22, 0.24 * barsK, 0.22]} /><meshStandardMaterial color={BLUE} /></mesh>
                  <mesh position={[x + 0.14, h / 2, 0.2]}><boxGeometry args={[0.22, h, 0.22]} /><meshStandardMaterial color={q === 1 ? "#16a34a" : ORANGE} /></mesh>
                  <Sprite map={tx.ratios[q]} pos={[x, Math.max(h, 0.5) + 0.22, 0.2]} w={0.85} o={barsK} />
                  <Sprite map={tx.names[q]} pos={[x, 0.05, 0.85]} w={0.95} o={barsK} />
                </group>
              );
            })}
          </group>
        </ThreeCanvas>
      )}
      {showBlocks && (
        <div style={{ position: "absolute", top: 205, left: 50, right: 50, display: "flex", gap: 30 }}>
          {[["ENGLISH", "13", "#60a5fa"], ["TELUGU", "101", "#fb923c"]].map(([a, v, col]) => (
            <div key={a} style={{ flex: 1, background: "#111827", borderRadius: 22, padding: "12px 10px", textAlign: "center", boxShadow: "6px 8px 0 rgba(0,0,0,0.3)" }}>
              <div style={{ fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 38, color: "#cbd5e1" }}>{a}</div>
              <div style={{ fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 120, lineHeight: 1.05, color: col }}>{v}</div>
              <div style={{ fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 36, color: "#cbd5e1" }}>TOKENS</div>
            </div>
          ))}
        </div>
      )}
      {showBlocks && (
        <div style={{ position: "absolute", top: 500, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ background: "#fde68a", color: INK, fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 40, padding: "6px 24px", borderRadius: 16 }}>THE SAME QUESTION · older ChatGPT model</span>
        </div>
      )}
      {/* the top third (render review: empty brown after 0:07): the stake stays up on spread 1, a chapter header after it */}
      {["chunks", "telugu", "why"].includes(b.prop) && (
        <div style={{ position: "absolute", top: 285, left: 0, right: 0, textAlign: "center", fontFamily: "BookSans, Arial", fontWeight: 800 }}>
          <span style={{ background: "#111827", color: "#60a5fa", fontSize: 54, padding: "8px 26px", borderRadius: 18 }}>ENGLISH 13</span>
          <span style={{ color: "#e7d8c3", fontSize: 46, margin: "0 18px" }}>vs</span>
          <span style={{ background: "#111827", color: "#fb923c", fontSize: 54, padding: "8px 26px", borderRadius: 18 }}>TELUGU 101</span>
          <div style={{ color: "#e7d8c3", fontWeight: 600, fontSize: 32, marginTop: 20 }}>tokens · the same question · older ChatGPT model</div>
        </div>
      )}
      {b.prop === "why" && (
        <div style={{ position: "absolute", top: 455, left: 0, right: 0, textAlign: "center", opacity: seg(f, cu(1, 0.3), cu(1, 0.3) + 6) }}>
          <span style={{ border: "7px solid #b45309", color: "#b45309", background: "rgba(255,255,255,0.94)", fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 46, padding: "4px 20px", borderRadius: 14, display: "inline-block", whiteSpace: "nowrap", transform: "rotate(-3deg)" }}>BUILT MOSTLY FROM ENGLISH TEXT</span>
          <div style={{ marginTop: 14 }}><span style={{ background: "rgba(17,24,39,0.85)", padding: "4px 16px", borderRadius: 10, fontFamily: "BookSans, Arial", fontWeight: 600, fontSize: 28, color: "#e7d8c3" }}>research: Petrov et al., NeurIPS 2023</span></div>
        </div>
      )}
      {b.prop === "newer" && f < cu(1, 0.35) && (
        <div style={{ position: "absolute", top: 320, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ background: "#dcfce7", color: "#14532d", fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 56, padding: "10px 28px", borderRadius: 18 }}>today's ChatGPT: 101 → 23</span>
        </div>
      )}
      {/* the saveable frame (Priya): all three ratios, the model names, the date */}
      {((b.prop === "newer" && f >= cu(1, 0.35)) || b.prop === "fair") && (
        <div style={{ position: "absolute", top: 262, left: 50, right: 50, background: "rgba(17,24,39,0.92)", borderRadius: 24, padding: "18px 28px", fontFamily: "BookSans, Arial", color: "#f3f4f6", opacity: seg(f, b.prop === "newer" ? cu(1, 0.35) : 0, (b.prop === "newer" ? cu(1, 0.35) : 0) + 8) }}>
          <div style={{ fontWeight: 800, fontSize: 36, color: "#fde68a" }}>TELUGU ÷ ENGLISH TOKENS</div>
          <div style={{ fontWeight: 600, fontSize: 26, color: "#9ca3af", marginBottom: 8 }}>our test: 5 everyday questions · Nov 2026 · models per OpenAI's tiktoken</div>
          {[["older ChatGPT (GPT-4, GPT-3.5)", "7.4×", "#fb923c", 0], ["today's ChatGPT (GPT-4o to GPT-5)", "1.7×", "#4ade80", 0], ["Qwen2.5 / Qwen3 (free, open)", "6.4×", "#fb923c", 1]].map(([nm, v, col, late]) => (
            <div key={String(nm)} style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 38, lineHeight: 1.35, opacity: late && b.prop !== "fair" ? 0.25 : 1 }}>
              <span>{nm}</span><span style={{ color: String(col) }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      {b.prop === "fair" && (
        <div style={{ position: "absolute", top: 552, left: 0, right: 0, textAlign: "center", opacity: seg(f, cu(2, 0.8) - 1, cu(2, 0.8) + 4) }}>
          <span style={{ border: "9px solid #dc2626", color: "#dc2626", background: "rgba(255,255,255,0.94)", fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 76, padding: "4px 26px", borderRadius: 14, display: "inline-block", transform: "rotate(-6deg)" }}>NOT FAIR YET</span>
        </div>
      )}
      {(b.prop === "memory" || (b.prop === "loop" && back <= 0)) && (
        <div style={{ position: "absolute", top: 280, left: 0, right: 0, textAlign: "center", fontFamily: "BookSans, Arial", fontWeight: 800, fontSize: 60, color: "#fde68a", letterSpacing: 2 }}>
          {b.prop === "memory" ? "WHY IT MATTERS" : "WHAT YOU CAN DO"}
          <div style={{ fontWeight: 600, fontSize: 32, color: "#e7d8c3", letterSpacing: 0, marginTop: 10 }}>{b.prop === "memory" ? "the same long chat: how much room it takes" : "OpenAI's free counter: platform.openai.com/tokenizer"}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const BOOK_SCENES = { sk_book: StBook };
