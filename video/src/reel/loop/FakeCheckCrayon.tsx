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
  if (!playing) {   // the pause sign
    c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.arc(VID.x + VID.w / 2, VID.y + VID.h / 2, 54, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.fillRect(VID.x + VID.w / 2 - 22, VID.y + VID.h / 2 - 26, 14, 52); c.fillRect(VID.x + VID.w / 2 + 8, VID.y + VID.h / 2 - 26, 14, 52);
  }
  const tx = VID.x + VID.w + 18, tw = PH.x + PH.w - 60 - tx;
  c.font = SANS(28, 800); c.fillStyle = INK;
  wrap(c, "Ameerpet RIGHT NOW 🙏 water up to the doors.", tw).forEach((t, q) => c.fillText(t, tx, VID.y + 30 + q * 36));
  c.font = SANS(26, 700); c.fillStyle = "#334155";
  wrap(c, "Send ₹2,000 per family for relief.", tw).forEach((t, q) => c.fillText(t, tx, VID.y + 220 + q * 34));
  const s = 1 + 0.06 * Math.sin(pay * 6);   // the pay button
  c.save(); c.translate(tx + tw / 2, VID.y + VID.h - 60); c.scale(s, s);
  c.fillStyle = RED; rrect(c, -tw / 2, -40, tw, 80, 40); c.fill();
  c.font = SANS(fit(c, "PAY ₹2,000", tw - 20, 34, 900), 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("PAY ₹2,000", 0, 12); c.restore();
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
    if (b.prop === "pause") sfx.push(<Sfx key={k("t")} at={at} src="audio/sfx_snap.wav" vol={0.5} />, <Sfx key={k("w")} at={cue(i, 1, 0.3) - 8} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("g")} at={cue(i, 2, 0.7) - 6} src="reel/sfx_glitch.wav" vol={0.4} />);
    if (b.prop === "label") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("b")} at={cue(i, 2, 0.8) - 8} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "ask") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 1, 0.4) - 6} src="audio/gag_ding.wav" vol={0.35} />);
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
          c.fillStyle = "#14532d"; rrect(c, 60, 330, 470, 190, 24); c.fill();
          c.fillStyle = "#7f1d1d"; rrect(c, 550, 330, 470, 190, 24); c.fill();
          c.font = SANS(96, 900); c.fillStyle = "#86efac"; c.fillText("4.5 MIN", 295, 440);
          c.font = SANS(fit(c, "to make, free AI", 420, 36, 800), 800); c.fillStyle = "#dcfce7"; c.fillText("to make, free AI", 295, 494);
          c.font = SANS(96, 900); c.fillStyle = "#fecaca"; c.fillText("₹2,000", 785, 440);
          c.font = SANS(fit(c, "asked per family", 420, 36, 800), 800); c.fillStyle = "#fee2e2"; c.fillText("asked per family", 785, 494);
          forward(c, loopOn ? imgs[0] : play(f), true, f, f / 30);
          smallRavi(c, 150, 1150, 0.5, loopOn ? "worried" : "worried", f, r);
          const k1 = loopOn ? 0 : seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          chip(c, "we made this fake ourselves", PH.x + PH.w / 2, PH.y + PH.h - 18, "#fde68a", INK, loopOn ? 1 : k1, 34);
        } else if (P === "pause") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 1: PAUSE IT", W - 100, 66, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 1: PAUSE IT", W / 2, 330);
          const c1 = cu(1, 0.3), c2 = cu(2, 0.7);
          if (f < c1) { forward(c, imgs[0], false, f, f / 30); }
          else if (f < c2) {   // the sign we asked for, and what came out (the real crop of shot 1, frame 1)
            const k = seg(f, c1, c1 + 10), im = imgs[Math.floor(((f - c1) / 30) * 8) % 16];
            c.save(); c.globalAlpha = clamp(k * 2);
            c.font = SANS(44, 800); c.fillStyle = "#e2e8f0"; c.fillText("we asked for a sign that says", W / 2, 410);
            c.font = SANS(84, 900); c.fillStyle = "#86efac"; c.fillText("AMEERPET", W / 2, 505);
            c.font = SANS(44, 800); c.fillStyle = "#e2e8f0"; c.fillText("we got:", W / 2, 590);
            const bw = 700, bh = 634, bx = (W - bw) / 2, by = 620;   // shot 1's signboard: source (0, 60, 160, 145), same aspect
            c.fillStyle = "#fbf8f0"; rrect(c, bx - 14, by - 14, bw + 28, bh + 28, 18); c.fill();
            if (im) c.drawImage(im, 0, 60, 160, 145, bx, by, bw, bh);
            c.restore();
            chip(c, "48 of 48 frames: not a word", W / 2, 1300, "#fee2e2", "#7f1d1d", seg(f, c1 + 30, c1 + 38), 48);
          } else {   // shot 3, frames 8 and 9: one umbrella becomes two
            const k = seg(f, c2, c2 + 8);
            c.save(); c.globalAlpha = clamp(k * 2);
            const fw = 430, fh = 764, y0 = 400;
            [[32 + 7, 70, "frame 8"], [32 + 8, 580, "frame 9"]].forEach(([n, x, t]) => {
              const im = imgs[n as number];
              c.fillStyle = "#fbf8f0"; rrect(c, (x as number) - 10, y0 - 10, fw + 20, fh + 20, 14); c.fill();
              if (im) c.drawImage(im, x as number, y0, fw, fh);
              c.font = SANS(40, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(t as string, (x as number) + fw / 2, y0 + fh + 60);
            });
            c.restore();
            ring(c, 70 + fw * 0.6, y0 + fh * 0.5, 90, 60, seg(f, c2 + 10, c2 + 26));
            ring(c, 580 + fw * 0.5, y0 + fh * 0.5, 175, 75, seg(f, c2 + 18, c2 + 34));
            chip(c, "1 umbrella → 2", W / 2, 1290, "#fee2e2", "#7f1d1d", seg(f, c2 + 20, c2 + 28), 52);
          }
        } else if (P === "label") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 2: LOOK FOR A LABEL", W - 100, 62, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 2: LOOK FOR A LABEL", W / 2, 330);
          const k0 = seg(f, ln.from, ln.from + 8), k1 = seg(f, cu(1, 0.3), cu(1, 0.3) + 8), k2 = seg(f, cu(2, 0.8) - 8, cu(2, 0.8));
          c.save(); c.globalAlpha = clamp(k0 * 2);
          c.fillStyle = "#f8fafc"; rrect(c, 80, 390, W - 160, 400, 24); c.fill();
          c.font = SANS(40, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("our fake: fake_flood.mp4", 120, 460);
          (T.scan as string[][]).forEach(([a, v], q) => {
            const y = 540 + q * 80;
            c.font = SANS(fit(c, a, 600, 38, 700), 700); c.fillStyle = "#334155"; c.fillText(a, 120, y);
            c.font = SANS(42, 900); c.fillStyle = RED; c.textAlign = "right"; c.fillText(v, W - 120, y); c.textAlign = "left";
          });
          c.restore();
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 2);
            c.fillStyle = "#1e293b"; rrect(c, 80, 830, W - 160, 330, 24); c.fill();
            c.font = SANS(40, 900); c.fillStyle = "#fde68a"; c.fillText("Instagram, YouTube label a video when:", 120, 895);
            (T.when as string[]).forEach((t, q) => { c.font = SANS(fit(c, "· " + t, W - 260, 38, 700), 700); c.fillStyle = "#f8fafc"; c.fillText("· " + t, 130, 965 + q * 60); });
            c.font = SANS(fit(c, T.whenSrc, W - 260, 26, 700), 700); c.fillStyle = "#94a3b8"; c.fillText(T.whenSrc, 120, 1140);
            c.restore();
          }
          stamp(c, "NO LABEL ≠ REAL", W / 2, 1290, 72, RED, k2);
        } else if (P === "ask") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "CHECK 3: ASK BEFORE YOU FORWARD", W - 80, 58, 900), 900); c.fillStyle = "#fde68a"; c.fillText("CHECK 3: ASK BEFORE YOU FORWARD", W / 2, 330);
          const k0 = seg(f, ln.from, ln.from + 8), k1 = seg(f, cu(1, 0.4) - 10, cu(1, 0.4) - 2);
          c.save(); c.globalAlpha = clamp(k0 * 2);
          c.fillStyle = "#f8fafc"; rrect(c, 80, 400, W - 160, 300, 24); c.fill();
          c.font = SANS(56, 900); c.fillStyle = "#1e3a8a"; c.fillText("PIB FACT CHECK", W / 2, 490);
          c.font = SANS(fit(c, "the Government of India's fact-check unit", W - 220, 34, 700), 700); c.fillStyle = "#334155"; c.fillText("the Government of India's fact-check unit", W / 2, 545);
          c.font = SANS(fit(c, "factcheck.pib.gov.in", W - 220, 32, 700), 700); c.fillStyle = "#64748b"; c.fillText("factcheck.pib.gov.in", W / 2, 600);
          c.restore();
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.fillStyle = "#075e54"; rrect(c, 80, 740, W - 160, 300, 24); c.fill();
            c.font = SANS(48, 900); c.fillStyle = "#dcfce7"; c.fillText("WhatsApp", W / 2, 820);
            c.font = SANS(fit(c, T.pib, W - 220, 110, 900), 900); c.fillStyle = "#fff"; c.fillText(T.pib, W / 2, 950);
            c.restore();
          }
          chip(c, "before you forward · before you pay", W / 2, 1110, "#fee2e2", "#7f1d1d", seg(f, ln.from + 6, ln.from + 14), 44);
          smallRavi(c, 170, 1180, 0.4, "hope", f, r);
        } else if (P === "loop") {
          c.textAlign = "center";
          c.font = SANS(fit(c, "SAVE THIS: NEXT FLOOD VIDEO", W - 80, 58, 900), 900); c.fillStyle = "#fde68a"; c.fillText("SAVE THIS: NEXT FLOOD VIDEO", W / 2, 330);
          const rows: [string, string][] = [["PAUSE", "a sign, a hand, an umbrella"], ["LABEL", "no label ≠ real"], ["ASK", T.pibShort]];
          rows.forEach(([a, t], q) => {
            const st = q === 0 ? ln.from : cu(1, 0.3) + (q - 1) * 10, k = seg(f, st, st + 8);
            if (k <= 0) return;
            const y = 400 + q * 200;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = "#1e293b"; rrect(c, 70, y, W - 140, 170, 22); c.fill();
            c.font = SANS(70, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(`${q + 1}`, 110, y + 110);
            c.font = SANS(66, 900); c.fillStyle = "#f8fafc"; c.fillText(a, 200, y + 82);
            c.font = SANS(fit(c, t, W - 330, 38, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(t, 200, y + 138); c.restore();
          });
          chip(c, "paid AI video: cleaner, fewer clues to pause on", W / 2, 1060, "#fee2e2", "#7f1d1d", seg(f, ln.from + 4, ln.from + 12), fit(c, "paid AI video: cleaner, fewer clues to pause on", 960, 38, 800));
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const FAKECHECK_SCENES = { sk_fakecheck: StFake };
