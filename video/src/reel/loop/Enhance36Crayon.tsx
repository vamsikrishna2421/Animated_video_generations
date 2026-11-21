import React, { useLayoutEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 36 "Enhance!" (series/scripts/creative36_enhance.md): a two-character skit in an apartment cellar. Vijaya
// garu's car is dented; her phone's "AI enhance" turns the CCTV blur into a sharp plate that matches her neighbour Mohan
// garu's scooter, and the next try draws a different one. Every plate image on screen is a real input or output of our
// test (series/scripts/creative36_demo, pipeline/creative36/enhance_demo.py): the blur, "…9000", "…9010", the streaks,
// the real plate, and the grid of the 20 sharp-looking far outputs.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number; who: string };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#f59e0b";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const IMGS = ["cctv", "ai_a", "ai_b", "ai_c", "truth", "grid_far"];

const useImgs = (): Record<string, HTMLImageElement> => {
  const [handle] = useState(() => delayRender("creative36 plates"));
  const [imgs, setImgs] = useState<Record<string, HTMLImageElement>>({});
  useLayoutEffect(() => {
    let left = IMGS.length;
    const got: Record<string, HTMLImageElement> = {};
    const done = () => { if (--left === 0) { setImgs({ ...got }); continueRender(handle); } };
    IMGS.forEach((k) => { const im = new Image(); im.onload = () => { got[k] = im; done(); }; im.onerror = done; im.src = staticFile(`reel/c36plates/${k}.png`); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return imgs;
};

const pic = (c: Ctx, im: HTMLImageElement | undefined, x: number, y: number, w: number, h: number, border = "#0f172a") => {
  c.save(); c.fillStyle = border; rrect(c, x - 6, y - 6, w + 12, h + 12, 14); c.fill();
  if (im) c.drawImage(im, x, y, w, h); else { c.fillStyle = "#e5e7eb"; c.fillRect(x, y, w, h); }
  c.restore();
};

// the cellar: wall, a yellow-black pillar, a floor with parking lines
const cellar = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#cbd5e1"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#94a3b8"; c.fillRect(0, 1180, W, H - 1180);
  c.strokeStyle = "#f8fafc"; c.lineWidth = 8; [180, 540, 900].forEach((x) => { c.beginPath(); c.moveTo(x, 1190); c.lineTo(x - 60, H); c.stroke(); });
  c.fillStyle = "#64748b"; c.fillRect(500, 740, 80, 450);
  for (let y = 760; y < 1180; y += 60) { c.fillStyle = "#facc15"; c.fillRect(500, y, 80, 30); c.fillStyle = "#111827"; c.fillRect(500, y + 30, 80, 30); }
};

// her car (side view) with a dent on the door and the repair tag
const car = (c: Ctx, x: number, y: number, tag: string, k: number) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "#1d4ed8"; rrect(c, 0, 60, 440, 130, 40); c.fill();
  c.beginPath(); c.moveTo(80, 64); c.lineTo(140, 0); c.lineTo(320, 0); c.lineTo(380, 64); c.closePath(); c.fill();
  c.fillStyle = "#bfdbfe"; c.beginPath(); c.moveTo(105, 58); c.lineTo(150, 14); c.lineTo(222, 14); c.lineTo(222, 58); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(236, 58); c.lineTo(236, 14); c.lineTo(310, 14); c.lineTo(352, 58); c.closePath(); c.fill();
  c.fillStyle = "#111827"; [90, 350].forEach((wx) => { c.beginPath(); c.arc(wx, 190, 44, 0, Math.PI * 2); c.fill(); });
  c.fillStyle = "#9ca3af"; [90, 350].forEach((wx) => { c.beginPath(); c.arc(wx, 190, 18, 0, Math.PI * 2); c.fill(); });
  // the dent: a crumpled patch with scratch lines
  c.fillStyle = "#1e3a8a"; c.beginPath(); c.ellipse(250, 120, 60, 34, 0.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#e5e7eb"; c.lineWidth = 4; [[205, 100, 290, 130], [215, 130, 300, 108], [230, 92, 270, 150]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  c.restore();
  if (k > 0) chip(c, tag, x + 250, y - 40, RED, "#fff", k, 34);
};

// his scooter with its front plate
const scooter = (c: Ctx, x: number, y: number, plate: string, hot: number) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "#15803d"; rrect(c, 30, 70, 230, 110, 50); c.fill();
  c.fillStyle = "#166534"; c.beginPath(); c.moveTo(230, 80); c.lineTo(290, -40); c.lineTo(320, -40); c.lineTo(270, 110); c.closePath(); c.fill();
  c.fillStyle = "#111827"; rrect(c, 270, -60, 90, 22, 10); c.fill(); rrect(c, 60, 40, 150, 34, 14); c.fill();
  [[70, 190], [280, 190]].forEach(([wx, wy]) => { c.fillStyle = "#111827"; c.beginPath(); c.arc(wx, wy, 40, 0, Math.PI * 2); c.fill(); c.fillStyle = "#9ca3af"; c.beginPath(); c.arc(wx, wy, 15, 0, Math.PI * 2); c.fill(); });
  // the plate, big enough to read
  c.fillStyle = "#ffffff"; rrect(c, 120, 205, 260, 64, 8); c.fill();
  c.strokeStyle = hot > 0 ? RED : "#111827"; c.lineWidth = hot > 0 ? 8 : 4; rrect(c, 120, 205, 260, 64, 8); c.stroke();
  c.fillStyle = "#111827"; c.font = SANS(fit(c, plate, 240, 40, 900), 900); c.textAlign = "center"; c.fillText(plate, 250, 252);
  c.restore();
};

// a milk van with the real plate (the original clip)
const van = (c: Ctx, x: number, y: number, im: HTMLImageElement | undefined, word: string) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "#f8fafc"; rrect(c, 0, 0, 620, 300, 30); c.fill(); c.strokeStyle = "#0f172a"; c.lineWidth = 6; rrect(c, 0, 0, 620, 300, 30); c.stroke();
  c.fillStyle = "#38bdf8"; rrect(c, 40, 40, 400, 120, 20); c.fill();
  c.fillStyle = "#0c4a6e"; c.font = SANS(84, 900); c.textAlign = "center"; c.fillText(word, 240, 130);
  c.fillStyle = "#111827"; [120, 500].forEach((wx) => { c.beginPath(); c.arc(wx, 300, 52, 0, Math.PI * 2); c.fill(); });
  c.restore();
  pic(c, im, x + 90, y + 190, 440, 110, "#0f172a");
};

const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};

const StEnhance: React.FC<SP> = ({ s }) => {
  const imgs = useImgs();
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const te = !!s.data.handle;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.75 : 0.6} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.55} />);
    if (b.prop === "deny") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 4)} src="audio/gag_bonk.wav" vol={0.4} />);
    if (b.prop === "app") sfx.push(<Sfx key={k("g")} at={Math.max(0, at - 6)} src="reel/sfx_glitch.wav" vol={0.5} />, <Sfx key={k("d")} at={at + 6} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "changed") sfx.push(<Sfx key={k("b")} at={at + 2} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "draws") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "test") [1, 2].forEach((n) => sfx.push(<Sfx key={k("p" + n)} at={cue(i, n, 0.3 + 0.3 * n) - 4} src={n === 2 ? "reel/sfx_boom.wav" : "audio/sfx_pop.wav"} vol={n === 2 ? 0.55 : 0.4} />));
    if (b.prop === "court") sfx.push(<Sfx key={k("g")} at={at + 2} src="audio/gag_bonk.wav" vol={0.45} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) - 4} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "real") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 6)} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "loop") { sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3)} src="audio/gag_ding.wav" vol={0.4} />); const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3636 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        c.textAlign = "left";
        if (P === "hook" || P === "deny") {
          cellar(c, W, H);
          // frame 1: the same blur, two "enhanced" plates
          c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, 30, 250, W - 60, 500, 30); c.fill();
          c.textAlign = "center"; c.font = SANS(34, 900); c.fillStyle = "#e2e8f0"; c.fillText(T.blurLab, W / 2, 300);
          pic(c, imgs.cctv, 290, 322, 500, 125);
          c.font = SANS(30, 900); c.fillStyle = AMBER; c.fillText(T.enhLab, W / 2, 500);
          pic(c, imgs.ai_a, 60, 520, 460, 115, RED); pic(c, imgs.ai_b, 560, 520, 460, 115, RED);
          c.font = SANS(66, 900); c.fillStyle = "#fca5a5"; c.fillText(T.numA, 290, 715); c.fillText(T.numB, 790, 715);
          c.font = SANS(28, 800); c.fillStyle = "#cbd5e1"; c.fillText(T.tryA, 290, 672 - 0); c.fillText(T.tryB, 790, 672);
          car(c, 40, 930, T.repair, 1);
          scooter(c, 620, 900, T.plateHis, 1);
          person(c, "vijaya" as BillWho, [230, 1250], 0.5, "angry", "phone", false, r);
          person(c, "mohan" as BillWho, [860, 1250], 0.5, P === "deny" || loopOn ? "shock" : "worried", P === "deny" ? "up" : "rest", false, r);
          if (!loopOn) chip(c, T.story, W / 2, 1470, "#1e293b", "#f8fafc", 1, 30);
        } else if (P === "app" || P === "changed") {
          cellar(c, W, H); c.fillStyle = "rgba(15,23,42,0.55)"; c.fillRect(0, 0, W, H);
          // her phone, big: the plate swaps on "Enhanced."
          const px = 140, py = 300, pw = 800, ph = 1100;
          c.fillStyle = "#0b1020"; rrect(c, px, py, pw, ph, 60); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, px + 24, py + 24, pw - 48, ph - 48, 44); c.fill();
          c.textAlign = "center"; c.font = SANS(36, 900); c.fillStyle = "#475569"; c.fillText(T.appName, W / 2, py + 100);
          pic(c, imgs.cctv, px + 90, py + 150, pw - 180, 155);
          c.font = SANS(34, 900); c.fillStyle = AMBER; c.fillText("↓ " + T.enhLab, W / 2, py + 380);
          const swap = P === "changed" ? 1 : seg(f, ln.from, ln.from + 10);
          const g = P === "app" && swap > 0 && swap < 1;
          pic(c, swap >= 0.5 ? imgs.ai_b : imgs.ai_a, px + 90 + (g ? Math.sin(f * 7) * 18 : 0), py + 420, pw - 180, 155, RED);
          c.font = SANS(110, 900); c.fillStyle = RED; c.fillText(swap >= 0.5 ? T.numB : T.numA, W / 2, py + 720);
          c.font = SANS(32, 800); c.fillStyle = "#475569"; c.fillText(swap >= 0.5 ? T.tryB : T.tryA, W / 2, py + 780);
          if (P === "changed") stamp(c, T.changed, W / 2, py + 930, 72, RED, seg(f, ln.from + 2, ln.from + 10));
        } else if (P === "draws") {
          cellar(c, W, H); c.fillStyle = "rgba(15,23,42,0.85)"; c.fillRect(0, 0, W, H);
          c.textAlign = "center"; c.font = SANS(fit(c, T.drawsHead, W - 100, 70, 900), 900); c.fillStyle = "#fde68a"; c.fillText(T.drawsHead, W / 2, 360);
          c.font = SANS(30, 900); c.fillStyle = "#e2e8f0"; c.fillText(T.blurLab, W / 2, 450);
          pic(c, imgs.cctv, 190, 475, 700, 175);
          const k2 = seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 8);
          c.save(); c.globalAlpha = clamp(k2 * 3);
          c.font = SANS(30, 900); c.fillStyle = AMBER; c.fillText(T.drawsSub, W / 2, 730);
          pic(c, imgs.ai_a, 60, 760, 460, 115, RED); pic(c, imgs.ai_b, 560, 760, 460, 115, RED); pic(c, imgs.ai_c, 310, 920, 460, 115, RED);
          c.font = SANS(28, 800); c.fillStyle = "#fecaca"; c.fillText(T.drawsNote, W / 2, 1110);
          c.restore();
        } else if (P === "test") {
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.textAlign = "center"; c.font = SANS(64, 900); c.fillStyle = "#fde68a"; c.fillText(T.testHead, W / 2, 340);
          c.font = SANS(fit(c, T.testSub, W - 80, 32, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(T.testSub, W / 2, 395);
          const kg = seg(f, ln.from + 4, ln.from + 14);
          c.save(); c.globalAlpha = clamp(kg * 2);
          if (imgs.grid_far) c.drawImage(imgs.grid_far, 30, 430, W - 60, (W - 60) * 370 / 1050);
          c.restore();
          const k1 = seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 6), k2 = seg(f, cu(2, 0.75) - 4, cu(2, 0.75) + 6);
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(k1 * 3); c.fillStyle = "#1e293b"; rrect(c, 60, 820, 460, 220, 26); c.fill(); c.font = SANS(110, 900); c.fillStyle = "#f8fafc"; c.fillText(T.sharpN, 290, 950); c.font = SANS(30, 800); c.fillStyle = "#cbd5e1"; c.fillText(T.sharpLab, 290, 1005); c.restore(); }
          if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.fillStyle = "#14532d"; rrect(c, 560, 820, 460, 220, 26); c.fill(); c.font = SANS(110, 900); c.fillStyle = "#bbf7d0"; c.fillText(T.rightN, 790, 950); c.font = SANS(30, 800); c.fillStyle = "#dcfce7"; c.fillText(T.rightLab, 790, 1005); c.restore(); }
          if (f >= cu(2, 0.75) + 12) { c.font = SANS(fit(c, T.testNote, W - 100, 30, 700), 700); c.fillStyle = "#94a3b8"; c.fillText(T.testNote, W / 2, 1100); }
        } else if (P === "court") {
          c.fillStyle = "#1c1917"; c.fillRect(0, 0, W, H);
          c.textAlign = "center"; c.font = SANS(120, 900); c.fillText("⚖", W / 2, 470);
          (T.court as string[]).forEach((t, q) => {
            const k = q === 0 ? seg(f, ln.from + 2, ln.from + 10) : seg(f, cu(1, 0.5) - 4 + (q - 1) * 10, cu(1, 0.5) + 6 + (q - 1) * 10);
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = q === 2 ? "#fde68a" : "#f5f5f4";
            c.font = SANS(q === 0 ? 34 : 52, 900); wrap(c, t, W - 140).slice(0, 2).forEach((tt, j) => c.fillText(tt, W / 2, 600 + q * 170 + j * 62)); c.restore();
          });
          c.font = SANS(28, 700); c.fillStyle = "#a8a29e"; c.fillText(T.courtSrc, W / 2, 1150);
        } else if (P === "rule") {
          c.fillStyle = "#f8fafc"; c.fillRect(0, 0, W, H);
          c.textAlign = "center"; c.font = SANS(60, 900); c.fillStyle = "#0f172a"; c.fillText(T.ruleHead, W / 2, 340);
          (T.rule as string[]).forEach((t, q) => {
            const k = seg(f, ln.from + 4 + q * 12, ln.from + 12 + q * 12); if (k <= 0) return;
            const y = 400 + q * 190;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#dcfce7"; rrect(c, 60, y, W - 120, 160, 24); c.fill();
            c.textAlign = "left"; c.font = SANS(70, 900); c.fillStyle = GREEN; c.fillText("✓", 100, y + 108);
            c.font = SANS(fit(c, t, W - 320, 54, 900), 900); c.fillStyle = INK; c.fillText(t, 200, y + 100); c.restore();
          });
          const kx = seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6);
          if (kx > 0) {
            const y = 400 + 3 * 190;
            c.save(); c.globalAlpha = clamp(kx * 3); c.fillStyle = "#fee2e2"; rrect(c, 60, y, W - 120, 160, 24); c.fill();
            c.textAlign = "left"; c.font = SANS(70, 900); c.fillStyle = RED; c.fillText("✗", 100, y + 108);
            c.font = SANS(fit(c, T.ruleX, W - 320, 50, 900), 900); c.fillStyle = INK; c.fillText(T.ruleX, 200, y + 100); c.restore();
          }
        } else if (P === "real" || P === "loop") {
          cellar(c, W, H); c.fillStyle = "rgba(15,23,42,0.35)"; c.fillRect(0, 0, W, H);
          c.textAlign = "center"; c.font = SANS(40, 900); c.fillStyle = "#0f172a";
          c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, 40, 250, W - 80, 110, 24); c.fill();
          c.fillStyle = "#f8fafc"; c.font = SANS(fit(c, T.origLab, W - 140, 40, 900), 900); c.fillText(T.origLab, W / 2, 320);
          van(c, 230, 520, imgs.truth, T.van);
          const kr = P === "loop" ? 1 : seg(f, endL - 20, endL - 6);
          if (kr > 0) { c.save(); c.globalAlpha = clamp(kr * 3); c.font = SANS(120, 900); c.fillStyle = GREEN; c.fillText(T.numReal, W / 2, 1040); c.font = SANS(32, 800); c.fillStyle = "#0f172a"; c.fillText(T.realLab, W / 2, 1100); c.restore(); }
          if (P === "loop") {
            person(c, "vijaya" as BillWho, [230, 1250], 0.5, "smug", "phone", false, r);
            person(c, "mohan" as BillWho, [860, 1250], 0.5, "shock", "up", false, r);
            if (f >= cu(1, 0.3)) stamp(c, T.again, W / 2, 1200, 60, AMBER, seg(f, cu(1, 0.3), cu(1, 0.3) + 8), -0.06);
          }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const ENHANCE36_SCENES = { sk_enh36: StEnhance };
