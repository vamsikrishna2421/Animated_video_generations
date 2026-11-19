import React, { useLayoutEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt, ravi, RV } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// HOW TO 05 "Fake-video check" (series/scripts/howto05_fake_video_check.md): a screen tutorial, one narrator. The
// forwarded flood video is our own fake (pipeline/howto05/fake_demo.py: AnimateDiff-Lightning on epiCRealism, CPU,
// 3 shots x 16 frames, 4.5 minutes); every frame shown here is the clip's own frame. Check 1 (pause): the sign we
// asked to say AMEERPET (shot 1, the real crop) and shot 3's frames 8 and 9 (one umbrella becomes two). Check 2
// (label): our file scan (label.json) and when YouTube / Meta label a video. Check 3 (ask): PIB Fact Check's WhatsApp
// number, from factcheck.pib.gov.in. Then the save card and the loop back to the forward.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Sans Telugu", "Noto Color Emoji", sans-serif`;
const FR = Array.from({ length: 48 }, (_, k) => `reel/howto05/s${Math.floor(k / 16) + 1}_f${String(k % 16).padStart(2, "0")}.jpg`);

// all 48 frames of the clip, loaded once
const useFrames = (): HTMLImageElement[] => {
  const [handle] = useState(() => delayRender("howto05 frames"));
  const [imgs, setImgs] = useState<HTMLImageElement[]>([]);
  useLayoutEffect(() => {
    let left = FR.length;
    const got: HTMLImageElement[] = [];
    const done = () => { if (--left === 0) { setImgs([...got]); continueRender(handle); } };
    FR.forEach((src, k) => { const im = new Image(); im.onload = () => { got[k] = im; done(); }; im.onerror = done; im.src = staticFile(src); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return imgs;
};

// the phone, a WhatsApp group, one forwarded video (the clip at 8 frames a second) and the relief ask
const PH = { x: 250, y: 560, w: 600, h: 830 };
const VID = { x: PH.x + 70, y: PH.y + 200, w: 300, h: 533 };
const forward = (c: Ctx, im: HTMLImageElement | undefined, playing: boolean, f: number, pay: number) => {
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, PH.x + 12, PH.y + 14, PH.w, PH.h, 50); c.fill();
  c.fillStyle = "#111827"; rrect(c, PH.x, PH.y, PH.w, PH.h, 50); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, PH.x + 18, PH.y + 18, PH.w - 36, PH.h - 36, 36); c.fill();
  c.fillStyle = "#075e54"; rrect(c, PH.x + 18, PH.y + 18, PH.w - 36, 100, 36); c.fill(); c.fillRect(PH.x + 18, PH.y + 80, PH.w - 36, 38);
  c.fillStyle = "#cbd5e1"; c.beginPath(); c.arc(PH.x + 80, PH.y + 70, 28, 0, 7); c.fill();
  c.font = SANS(36, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Family ❤ (47)", PH.x + 124, PH.y + 82);
  c.fillStyle = "#fff"; rrect(c, PH.x + 50, PH.y + 140, PH.w - 100, PH.h - 190, 22); c.fill();
  c.font = SANS(24, 700); c.fillStyle = "#64748b"; c.fillText("↪ Forwarded many times", PH.x + 70, PH.y + 178);
  c.save(); rrect(c, VID.x, VID.y, VID.w, VID.h, 12); c.clip();
  c.fillStyle = "#334155"; c.fillRect(VID.x, VID.y, VID.w, VID.h);
  if (im) c.drawImage(im, VID.x, VID.y, VID.w, VID.h);
  c.restore();
  fakeBand(c, VID.x, VID.y, VID.w, VID.h);
  if (!playing) {   // the pause sign
    c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.arc(VID.x + VID.w / 2, VID.y + VID.h / 2, 54, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.fillRect(VID.x + VID.w / 2 - 22, VID.y + VID.h / 2 - 26, 14, 52); c.fillRect(VID.x + VID.w / 2 + 8, VID.y + VID.h / 2 - 26, 14, 52);
  }
  const tx = VID.x + VID.w + 18, tw = PH.x + PH.w - 60 - tx;
  c.font = SANS(32, 900); c.fillStyle = INK;
  wrap(c, "Ameerpet NOW 🙏 ₹2,000 per family", tw).forEach((t, q) => c.fillText(t, tx, VID.y + 34 + q * 40));
  const s = 1 + 0.05 * Math.sin(pay * 6);   // script review: a forward carries a UPI ID and a QR, not a button (masked: no real ID)
  c.save(); c.translate(tx + tw / 2, VID.y + 330); c.scale(s, s);
  c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 4; rrect(c, -tw / 2, -110, tw, 220, 16); c.fill(); c.stroke();
  const q0 = -60, qs = 120, cell = qs / 7, rq = rng(77);
  for (let a = 0; a < 7; a++) for (let b2 = 0; b2 < 7; b2++) {
    const corner = (a < 2 && b2 < 2) || (a > 4 && b2 < 2) || (a < 2 && b2 > 4);
    if (corner || rq() > 0.55) { c.fillStyle = INK; c.fillRect(q0 + a * cell, -100 + b2 * cell, cell - 2, cell - 2); }
  }
  c.font = SANS(fit(c, "UPI: relief•••@•••", tw - 20, 26, 800), 800); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("UPI: relief•••@•••", 0, 60);
  c.font = SANS(fit(c, "scan & pay ₹2,000", tw - 20, 26, 900), 900); c.fillStyle = RED; c.fillText("scan & pay ₹2,000", 0, 95);
  c.restore();
  c.textAlign = "left";
  void f;
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.08) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// script review: a screen recording of the clip must never pass as a real flood: "FAKE · made by us" on every frame shown
const fakeBand = (c: Ctx, x: number, y: number, w: number, h: number, strip = false) => {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const t = "FAKE · MADE BY US";
  let fs = Math.round(w * 0.12); c.font = SANS(fs, 900);
  while (fs > 16 && c.measureText(t).width > w * 0.82) { fs -= 2; c.font = SANS(fs, 900); }   // render: the band was cut off
  if (strip) { c.translate(x + w / 2, y + h - fs * 0.9); } else { c.translate(x + w / 2, y + h * 0.42); c.rotate(-0.42); }
  const tw = c.measureText(t).width;
  c.fillStyle = "rgba(220,38,38,0.82)"; c.fillRect(-tw / 2 - 40, -fs * 0.85, tw + 80, fs * 1.3);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(t, 0, fs * 0.25); c.restore();
};
const ring = (c: Ctx, x: number, y: number, rx: number, ry: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.strokeStyle = "#facc15"; c.lineWidth = 9; c.beginPath(); c.ellipse(x, y, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOut(clamp(k)));
  c.stroke(); c.restore();
};
const smallRavi = (c: Ctx, x: number, y: number, sc: number, m: "worried" | "shock" | "hope" | "happy", f: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-RV.x, -RV.y); ravi(c, m, "phone", false, 0.5, f, r); c.restore();
};

const StFake: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const te = !!s.data.handle;
  const imgs = useFrames();
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.85} />, <Sfx key={k("z")} at={4} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("p")} at={cue(i, 1, 0.5) - 8} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "pause") sfx.push(<Sfx key={k("t")} at={at} src="audio/sfx_snap.wav" vol={0.5} />, <Sfx key={k("g")} at={cue(i, 1, 0.3) - 8} src="reel/sfx_glitch.wav" vol={0.45} />, <Sfx key={k("b")} at={cue(i, 1, 0.3) - 6} src="reel/sfx_boom.wav" vol={0.55} />, <Sfx key={k("w")} at={cue(i, 2, 0.5) - 8} src="audio/sfx_whoosh.wav" vol={0.35} />);
    if (b.prop === "label") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("p")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("b")} at={cue(i, 2, 0.5) - 8} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "ask") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("p")} at={cue(i, 1, 0.3) - 8} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("d")} at={cue(i, 1, 0.6) - 4} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(5555 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H);
        const play = (ff: number) => imgs[Math.floor((ff / 30) * 8) % 48];   // the clip at its own 8 frames a second
        if (P === "hook") {
          // the reach stack: two numbers on the same video, readable with the sound off
          c.textAlign = "center";
          c.font = SANS(fit(c, "THIS FLOOD VIDEO", W - 100, 46, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText("THIS FLOOD VIDEO", W / 2, 300);
          c.fillStyle = "#7f1d1d"; rrect(c, 60, 330, 470, 190, 24); c.fill();   // script review: the money first, as line 1 says it
          c.fillStyle = "#14532d"; rrect(c, 550, 330, 470, 190, 24); c.fill();
          c.font = SANS(96, 900); c.fillStyle = "#fecaca"; c.fillText("₹2,000", 295, 440);
          c.font = SANS(fit(c, "asked per family", 420, 36, 800), 800); c.fillStyle = "#fee2e2"; c.fillText("asked per family", 295, 494);
          c.font = SANS(96, 900); c.fillStyle = "#86efac"; c.fillText("4.5 MIN", 785, 440);
          c.font = SANS(fit(c, "to make, free AI", 420, 36, 800), 800); c.fillStyle = "#dcfce7"; c.fillText("to make, free AI", 785, 494);
          forward(c, loopOn ? imgs[0] : play(f), true, f, f / 30);
          smallRavi(c, 150, 1150, 0.5, loopOn ? "worried" : "worried", f, r);
          const k1 = loopOn ? 0 : seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          chip(c, "we made this fake ourselves", PH.x + PH.w / 2, PH.y + PH.h - 18, "#fde68a", INK, loopOn ? 1 : k1, 34);
        } else if (P === "pause") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 1: PAUSE IT", W - 100, 66, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 1: PAUSE IT", W / 2, 330);
          const c1 = cu(1, 0.3), c2 = cu(2, 0.5) + 20;
          // render review: the umbrella big, held about 3 s, flipping twice. Shot 3, frame 4 (one umbrella) and frame 7
          // (two umbrellas, 3/8 s later); the split happens over frames 4-6. The FAKE tag sits in a corner, off the evidence.
          const fw = 551, fh = 980, fx = (W - fw) / 2, fy = 380;
          const tag = () => {
            c.save(); c.font = SANS(30, 900); const tg = "FAKE · MADE BY US"; const tw2 = c.measureText(tg).width;
            c.fillStyle = "rgba(220,38,38,0.9)"; rrect(c, fx + fw - tw2 - 36, fy + 14, tw2 + 24, 46, 10); c.fill();
            c.fillStyle = "#fff"; c.textAlign = "right"; c.fillText(tg, fx + fw - 24, fy + 48); c.restore();
          };
          if (f < c2) {
            const pre = f < c1, ph = Math.floor((f - c1) / 15), two = !pre && ph % 2 === 1;
            const n = pre ? 32 + Math.min(3, Math.floor(((f - ln.from) / 30) * 8)) : (two ? 32 + 6 : 32 + 3);
            const im = imgs[n];
            c.fillStyle = "#fbf8f0"; rrect(c, fx - 12, fy - 12, fw + 24, fh + 24, 14); c.fill();
            if (im) c.drawImage(im, fx, fy, fw, fh);
            tag();
            const paused = f >= ln.from + 30;
            if (pre && paused) {   // the pause sign, while the voice says "pause it"
              c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.arc(W / 2, fy + fh * 0.75, 70, 0, 7); c.fill();
              c.fillStyle = "#fff"; c.fillRect(W / 2 - 28, fy + fh * 0.75 - 34, 18, 68); c.fillRect(W / 2 + 10, fy + fh * 0.75 - 34, 18, 68);
            }
            if (!pre) {
              const kr = seg(f, c1 + (two ? ph * 15 : ph * 15), c1 + ph * 15 + 10);
              if (two) ring(c, fx + fw * 0.55, fy + fh * 0.514, fw * 0.32, fh * 0.075, kr);
              else ring(c, fx + fw * 0.585, fy + fh * 0.495, fw * 0.26, fh * 0.065, kr);
              c.save(); c.font = SANS(44, 900); c.textAlign = "center";
              const lab = two ? "3/8 of a second later: 2" : "paused: 1 umbrella";
              const lw = c.measureText(lab).width;
              c.fillStyle = two ? "#7f1d1d" : "#1e293b"; rrect(c, W / 2 - lw / 2 - 24, fy + fh - 90, lw + 48, 70, 16); c.fill();
              c.fillStyle = "#fff"; c.fillText(lab, W / 2, fy + fh - 40); c.restore();
            }
          } else {   // the sign we asked to say AMEERPET (shot 1, the real crop, playing)
            const k = seg(f, c2 - 2, c2 + 8), im = imgs[Math.floor(((f - c2) / 30) * 8) % 16];
            c.save(); c.globalAlpha = clamp(k * 2);
            c.font = SANS(44, 800); c.fillStyle = "#e2e8f0"; c.fillText("we asked for a sign that says", W / 2, 410);
            c.font = SANS(84, 900); c.fillStyle = "#86efac"; c.fillText("AMEERPET", W / 2, 505);
            c.font = SANS(44, 800); c.fillStyle = "#e2e8f0"; c.fillText("we got:", W / 2, 590);
            const bw = 700, bh = 634, bx = (W - bw) / 2, by = 620;   // shot 1's signboard: source (0, 60, 160, 145), same aspect
            c.fillStyle = "#fbf8f0"; rrect(c, bx - 14, by - 14, bw + 28, bh + 28, 18); c.fill();
            if (im) c.drawImage(im, 0, 60, 160, 145, bx, by, bw, bh);
            c.font = SANS(30, 900); const tg = "FAKE · MADE BY US"; const tw2 = c.measureText(tg).width;
            c.fillStyle = "rgba(220,38,38,0.88)"; rrect(c, bx + bw - tw2 - 36, by + 12, tw2 + 24, 44, 10); c.fill();
            c.fillStyle = "#fff"; c.textAlign = "right"; c.fillText(tg, bx + bw - 24, by + 45); c.textAlign = "center";
            c.restore();
            chip(c, "every frame of that shot: not a word", W / 2, 1300, "#fee2e2", "#7f1d1d", seg(f, c2 + 14, c2 + 22), 46);
          }
        } else if (P === "label") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 2: THE LABEL", W - 100, 66, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 2: THE LABEL", W / 2, 330);
          const k1 = seg(f, cu(1, 0.45), cu(1, 0.45) + 8), k3 = seg(f, cu(2, 0.5) - 6, cu(2, 0.5) + 2);
          const row = (y: number, app: string, says: string, col: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * 260, 0);   // slides in
            c.fillStyle = "#f8fafc"; rrect(c, 80, y, W - 160, 200, 24); c.fill();
            c.font = SANS(fit(c, app, W - 240, 52, 900), 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(app, 120, y + 80);
            c.font = SANS(fit(c, says, W - 240, 52, 900), 900); c.fillStyle = col; c.fillText(says, 120, y + 160); c.restore();
          };
          row(400, "Under the video: a label says AI?", "then it's AI", "#15803d", seg(f, ln.from + 6, ln.from + 14));
          row(640, "Our fake, the file itself:", "no AI tag at all", RED, k1);
          const k4 = seg(f, cu(1, 0.45) + 6, cu(1, 0.45) + 14);   // render: our fake's own file, playing, and what the scan found
          if (k4 > 0) {
            c.save(); c.globalAlpha = clamp(k4 * 3);
            const vx = 110, vy = 920, vw = 170, vh = 302;
            c.fillStyle = "#fbf8f0"; rrect(c, vx - 8, vy - 8, vw + 16, vh + 16, 10); c.fill();
            const im = play(f); if (im) c.drawImage(im, vx, vy, vw, vh);
            fakeBand(c, vx, vy, vw, vh);
            c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = "#f8fafc"; c.fillText("our fake's file:", 320, 975);
            (["C2PA credentials: none", "IPTC AI tag: none", "other AI markers: none"]).forEach((t, q) => { c.font = SANS(36, 800); c.fillStyle = "#fca5a5"; c.fillText(t, 320, 1040 + q * 56); });
            c.font = SANS(30, 700); c.fillStyle = "#94a3b8"; c.fillText("so no app gets told it's AI", 320, 1210);
            c.restore(); c.textAlign = "center";
          }
          stamp(c, "NO LABEL? STILL MAYBE FAKE", W / 2, 1320, fit(c, "NO LABEL? STILL MAYBE FAKE", W - 200, 60, 900), RED, k3);
        } else if (P === "ask") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 3 MATTERS MOST", W - 100, 66, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 3 MATTERS MOST", W / 2, 330);
          chip(c, "paid AI: cleaner fakes, fewer clues", W / 2, 410, "#fee2e2", "#7f1d1d", seg(f, ln.from + 4, ln.from + 12), 40);
          const k0 = seg(f, ln.from + 10, ln.from + 18), k1 = seg(f, cu(1, 0.6), cu(1, 0.6) + 8), k2 = seg(f, cu(2, 0.4) - 4, cu(2, 0.4) + 4);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 2);
            c.fillStyle = "#f8fafc"; rrect(c, 80, 470, W - 160, 270, 24); c.fill();
            c.font = SANS(fit(c, "before you forward or pay, send the video to", W - 220, 34, 800), 800); c.fillStyle = "#334155"; c.fillText("before you forward or pay, send the video to", W / 2, 530);
            c.font = SANS(64, 900); c.fillStyle = "#1e3a8a"; c.fillText("PIB FACT CHECK", W / 2, 615);
            c.font = SANS(fit(c, "the central government's fact check · factcheck.pib.gov.in", W - 220, 30, 700), 700); c.fillStyle = "#475569"; c.fillText("the central government's fact check · factcheck.pib.gov.in", W / 2, 690);
            c.restore();
          }
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.fillStyle = "#075e54"; rrect(c, 80, 780, W - 160, 300, 24); c.fill();
            c.font = SANS(48, 900); c.fillStyle = "#dcfce7"; c.fillText("WhatsApp", W / 2, 860);
            c.font = SANS(fit(c, T.pib, W - 220, 116, 900), 900); c.fillStyle = "#fff"; c.fillText(T.pib, W / 2, 1000);
            c.restore();
          }
          if (k2 > 0) chip(c, "📸 screenshot this · it's in the caption", W / 2, 1170, "#fde68a", INK, k2, 44);
        } else if (P === "loop") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "SAVE THIS", W - 100, 66, 900), 900); c.fillStyle = "#fde68a"; c.fillText("SAVE THIS", W / 2, 330);
          const k0 = seg(f, ln.from, ln.from + 8);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = RED; rrect(c, 70, 380, W - 140, 200, 24); c.fill();
            c.font = SANS(fit(c, "never pay a UPI ID", W - 200, 80, 900), 900); c.fillStyle = "#fff"; c.fillText("never pay a UPI ID", W / 2, 470);
            c.font = SANS(fit(c, "that came in a forward", W - 200, 54, 800), 800); c.fillStyle = "#fee2e2"; c.fillText("that came in a forward", W / 2, 545); c.restore();
          }
          const kx = seg(f, ln.from + 6, ln.from + 14) * (1 - seg(f, cu(1, 0.3) - 6, cu(1, 0.3)));   // render: 3.5 s were still
          if (kx > 0) {
            c.save(); c.globalAlpha = clamp(kx * 3);
            const qx = W / 2 - 220, qy = 660;
            c.fillStyle = "#fff"; rrect(c, qx, qy, 440, 520, 24); c.fill();
            const cell = 300 / 9, rq = rng(77);
            for (let a2 = 0; a2 < 9; a2++) for (let b2 = 0; b2 < 9; b2++) {
              const corner = (a2 < 3 && b2 < 3) || (a2 > 5 && b2 < 3) || (a2 < 3 && b2 > 5);
              if (corner || rq() > 0.55) { c.fillStyle = INK; c.fillRect(qx + 70 + a2 * cell, qy + 50 + b2 * cell, cell - 3, cell - 3); }
            }
            c.font = SANS(40, 800); c.fillStyle = "#334155"; c.fillText("UPI: relief•••@•••", W / 2, qy + 420);
            c.font = SANS(40, 900); c.fillStyle = RED; c.fillText("scan & pay ₹2,000", W / 2, qy + 480);
            const kk = seg(f, ln.from + 18, ln.from + 30);   // the cross
            c.strokeStyle = RED; c.lineWidth = 26; c.lineCap = "round";
            c.beginPath(); c.moveTo(qx - 20, qy - 20); c.lineTo(qx - 20 + 480 * easeOut(kk), qy - 20 + 560 * easeOut(kk)); c.stroke();
            if (kk > 0.5) { const k2x = seg(f, ln.from + 26, ln.from + 38); c.beginPath(); c.moveTo(qx + 460, qy - 20); c.lineTo(qx + 460 - 480 * easeOut(k2x), qy - 20 + 560 * easeOut(k2x)); c.stroke(); }
            c.restore();
          }
          const rows: [string, string][] = [["PAUSE", "a sign, a hand, an umbrella"], ["LABEL", "no label? still maybe fake"], ["ASK PIB", T.pib]];
          rows.forEach(([a, t], q) => {
            const st = cu(1, 0.3) + q * 9, k = seg(f, st, st + 8);
            if (k <= 0) return;
            const y = 630 + q * 190;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = "#1e293b"; rrect(c, 70, y, W - 140, 165, 22); c.fill();
            c.font = SANS(70, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(`${q + 1}`, 110, y + 108);
            c.font = SANS(62, 900); c.fillStyle = "#f8fafc"; c.fillText(a, 200, y + 78);
            const big = q === 2;   // render review: the number big on the end card
            c.font = SANS(fit(c, t, W - 330, big ? 50 : 40, big ? 900 : 700), big ? 900 : 700); c.fillStyle = big ? "#86efac" : "#cbd5e1"; c.fillText(t, 200, y + 138); c.restore();
          });
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const FAKECHECK_SCENES = { sk_fakecheck: StFake };
