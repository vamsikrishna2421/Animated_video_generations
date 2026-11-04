import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { room, sofaFront, person, AM, CH, S, Mood, Pose } from "./HomeCrayon";

// EP45 "Deepfakes and how to spot them" (series/scripts/ep45_deepfakes.md): Chinnu paid his phone money, ₹22,000, after a
// Sponsored video of "the Finance Minister" promising ₹5,50,000 in a week. Amma knows by the money; his face test ("her
// lips match!") fails (new fakes get the lips right; MIT Media Lab: no single tell-tale sign); the two tests: the money,
// the source. He checks PIB Fact Check himself (Apr 16, 2026: fake, made with AI), then 1930. The loop: a new ad, "the RBI
// Governor" doubling money: "Money test: fake!" -> frame 1. No real likeness: the faces are blurred ("WE blurred this
// face"), no real voice is imitated. The living room and the two of them come from HomeCrayon.tsx. One beat per line.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "amma" | "chinnu"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const CAM: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, amma: { z: 1.4, x: 360, y: 760 }, chinnu: { z: 1.4, x: 740, y: 770 },
};
const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const AMMA: Record<number, [Mood, Pose, number]> = {
  1: ["shock", "mouth", 1], 2: ["stern", "rest", 1], 3: ["stern", "rest", 1], 4: ["sus", "rest", 1], 6: ["explain", "rest", 1],
  8: ["worried", "rest", 1], 9: ["stern", "rest", 1], 10: ["sus", "rest", 1],
};
const CHINNU: Record<number, [Mood, Pose, number]> = {
  1: ["panic", "open", -1], 2: ["happy", "thumb", -1], 3: ["worried", "rest", -1], 4: ["explain", "point", -1], 6: ["puzzled", "rest", -1],
  8: ["panic", "open", -1], 9: ["worried", "rest", -1], 10: ["smug", "point", -1],
};
const FACE: Record<number, Mood> = { 5: "stern", 7: "explain" };

// ---------- pieces ----------
const face = (c: Ctx, who: "amma" | "chinnu", m: Mood, x: number, y: number, rad: number, talk: boolean, f: number, r: () => number) => {
  const nk = who === "amma" ? AM : CH;
  c.save();
  c.beginPath(); c.arc(x, y, rad + 8, 0, 7); c.fillStyle = "#fde68a"; c.fill();
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = "#d6ebe3"; c.fill(); c.clip();
  const k = rad / (125 * S);
  c.translate(x, y + rad * 0.15); c.scale(k, k); c.translate(-nk[0], -(nk[1] - 135 * S));
  person(c, who, m, "rest", 0, talk, 1, f, r);
  c.restore();
};
// a blurred "famous face" in a blazer (no real likeness): the face is a soft blur with a label
const vip = (c: Ctx, x: number, y: number, s: number, f: number, talk: boolean) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#1e3a8a"; c.beginPath(); c.moveTo(-150, 260); c.quadraticCurveTo(-140, 60, 0, 50); c.quadraticCurveTo(140, 60, 150, 260); c.closePath(); c.fill();   // blazer
  c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(-40, 60); c.lineTo(0, 140); c.lineTo(40, 60); c.closePath(); c.fill();
  c.fillStyle = "#111827"; c.beginPath(); c.ellipse(0, -40, 92, 104, 0, 0, 7); c.fill();   // hair
  c.save(); c.filter = "blur(10px)"; c.fillStyle = "#c08457"; c.beginPath(); c.ellipse(0, -20, 74, 90, 0, 0, 7); c.fill();   // the face, blurred by us
  c.fillStyle = "#7c2d12"; c.beginPath(); c.ellipse(0, 26, talk && Math.floor(f / 3) % 2 === 0 ? 22 : 16, talk && Math.floor(f / 3) % 2 === 0 ? 12 : 5, 0, 0, 7); c.fill(); c.restore();
  c.restore();
};
// the Sponsored ad on Chinnu's phone (screen space)
const ad = (c: Ctx, x: number, y: number, w: number, h: number, head: string, sub: string, f: number, talk: boolean, fake: number) => {
  c.save();
  c.fillStyle = "#0f172a"; rrect(c, x - 10, y - 10, w + 20, h + 20, 30); c.fill();
  c.fillStyle = "#f1f5f9"; rrect(c, x, y, w, h, 22); c.fill();
  c.save(); c.beginPath(); rrect(c, x, y, w, h, 22); c.clip();
  c.fillStyle = "#cbd5e1"; c.fillRect(x, y + 60, w, h - 60);
  vip(c, x + w / 2, y + h * 0.42, w / 520, f, talk);
  c.restore();
  c.font = SANS(26, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("Sponsored", x + 22, y + 40);
  c.fillStyle = "rgba(15,23,42,0.88)"; rrect(c, x + 16, y + h - 170, w - 32, 150, 16); c.fill();
  let fs = 44; c.font = SANS(fs, 900); while (c.measureText(head).width > w - 64 && fs > 26) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde047"; c.textAlign = "center"; c.fillText(head, x + w / 2, y + h - 112);
  fs = 40; c.font = SANS(fs, 900); while (c.measureText(sub).width > w - 64 && fs > 24) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#f8fafc"; c.fillText(sub, x + w / 2, y + h - 56);
  c.font = SANS(22, 800); c.fillStyle = "#334155"; c.textAlign = "right"; c.fillText("WE blurred this face", x + w - 20, y + 40);
  if (fake > 0) {   // the FAKE stamp (the cover must not sell the scheme)
    c.save(); c.globalAlpha = clamp(fake * 2); c.translate(x + w / 2, y + h * 0.36); c.rotate(-0.2);
    c.strokeStyle = RED; c.lineWidth = 9; rrect(c, -170, -56, 340, 112, 14); c.stroke();
    c.font = SANS(76, 900); c.fillStyle = RED; c.textAlign = "center"; c.fillText("FAKE AD", 0, 26); c.restore();
  }
  c.restore();
};
// his UPI receipt (frame 1's proof)
const receipt = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.rotate(0.03); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, -282, -132, 580, 280, 26); c.fill();
  c.fillStyle = "#ffffff"; rrect(c, -290, -140, 580, 280, 26); c.fill();
  c.beginPath(); c.arc(-210, -50, 44, 0, 7); c.fillStyle = GREEN; c.fill();
  c.strokeStyle = "#fff"; c.lineWidth = 10; c.beginPath(); c.moveTo(-232, -50); c.lineTo(-214, -30); c.lineTo(-186, -72); c.stroke();
  c.font = SANS(40, 800); c.fillStyle = "#334155"; c.textAlign = "left"; c.fillText("Paid", -140, -64);
  c.font = SANS(96, 900); c.fillStyle = INK; c.fillText("₹22,000", -140, 24);
  c.font = SANS(34, 800); c.fillStyle = RED; c.fillText("his phone money", -140, 90);
  c.restore();
};
const clash = (c: Ctx, W: number) => {
  const box = (x: number, top: string, big: string, sub: string, bg: string, fg: string) => {
    const y0 = 1010;
    c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, x + 8, y0 + 8, 452, 290, 28); c.fill();
    c.fillStyle = bg; rrect(c, x, y0, 452, 290, 28); c.fill();
    c.textAlign = "center"; c.fillStyle = fg;
    c.font = SANS(40, 900); c.fillText(top, x + 226, y0 + 60);
    let fs = 100; c.font = SANS(fs, 900); while (c.measureText(big).width > 420 && fs > 60) { fs -= 4; c.font = SANS(fs, 900); }
    c.fillText(big, x + 226, y0 + 172);
    c.font = SANS(36, 800); c.fillText(sub, x + 226, y0 + 244);
  };
  box(60, "PAID", "₹22,000", "his savings", "#fee2e2", "#991b1b");
  box(W - 512, "PROMISED", "₹5,50,000", "in 1 week", "#fef9c3", "#854d0e");
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[]) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  let fs = 60; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(38, 700); c.fillStyle = "#f8fafc"; sub.forEach((t, i) => c.fillText(t, W / 2, 390 + i * 52));
};
const card = (c: Ctx, t: string, sub: string, x: number, y: number, w: number, h: number, bg: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x - w / 2, y - h / 2, w, h, 26); c.fill();
  c.textAlign = "center"; c.fillStyle = fg;
  let fs = 50; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 40 && fs > 30) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillText(t, x, y - (sub ? 8 : -16));
  if (sub) { let ss = 36; c.font = SANS(ss, 700); while (c.measureText(sub).width > w - 40 && ss > 24) { ss -= 2; c.font = SANS(ss, 700); } c.fillText(sub, x, y + 46); }
  c.restore();
};
const arrow = (c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string, k: number) => {
  if (k <= 0) return;
  const x = x0 + (x1 - x0) * easeOut(k), y = y0 + (y1 - y0) * easeOut(k);
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 12; c.lineCap = "round";
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke();
  if (k > 0.9) { const a = Math.atan2(y1 - y0, x1 - x0); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 34 * Math.cos(a - 0.5), y1 - 34 * Math.sin(a - 0.5)); c.lineTo(x1 - 34 * Math.cos(a + 0.5), y1 - 34 * Math.sin(a + 0.5)); c.closePath(); c.fill(); }
  c.restore();
};
// how a deepfake is made (line 5's insert): t0 the second take's start
const how = (c: Ctx, W: number, H: number, f: number, t0: number, from: number) => {
  dark(c, W, H, "HOW A DEEPFAKE IS MADE", []);
  card(c, "HER REAL SPEECHES", "public videos, hours of them", W / 2, 470, W - 160, 150, "#e0e7ff", "#1e3a8a", seg(f, t0, t0 + 8));
  arrow(c, W / 2, 550, W / 2, 640, "#93c5fd", seg(f, t0 + 8, t0 + 16));
  card(c, "AI LEARNS HER FACE AND VOICE", "", W / 2, 720, W - 160, 130, "#ffedd5", "#9a3412", seg(f, t0 + 14, t0 + 22));
  arrow(c, W / 2, 790, W / 2, 880, "#f87171", seg(f, t0 + 22, t0 + 30));
  card(c, "NEW WORDS IN HER MOUTH", "\"invest ₹22,000, get ₹5,50,000\"", W / 2, 970, W - 160, 160, "#fee2e2", "#991b1b", seg(f, t0 + 28, t0 + 36));
  tag(c, "the face test is weak: new fakes get the lips right", W / 2, 1150, 40, "#fde68a", INK, -0.02, seg(f, from, from + 8));
  c.save(); c.globalAlpha = seg(f, from + 8, from + 16); c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "center";
  c.fillText("\"there's no single tell-tale sign\": MIT Media Lab, Detect Fakes", W / 2, 1236); c.restore();
};

// ---------- the scene ----------
const StDeepfake: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (b.shot === "how" && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.32} />, <Sfx key={k("wr")} at={Math.max(0, at - 26)} src="reel/sfx_riser.wav" vol={0.18} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("u")} at={0} src="audio/gag_ding.wav" vol={0.35} />, <Sfx key={k("a")} at={2} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.45} />, <Sfx key={k("z")} at={4} src="reel/sfx_buzz.wav" vol={0.2} />,
      <Sfx key={k("y")} at={cue(i, 1, 0.5) + 10} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.4} />);   // the UPI ting, then the hit; a second hit on "a WEEK"
    if (b.prop === "deepfake") sfx.push(<Sfx key={k("g")} at={cue(i, 1, 0.5)} src="reel/sfx_glitch.wav" vol={0.35} />);
    if (b.prop === "lips") sfx.push(<Sfx key={k("w")} at={at + 2} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "tests") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.2} />, <Sfx key={k("e")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "pib") sfx.push(<Sfx key={k("n")} at={at - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.6} />, <Sfx key={k("z")} at={at} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "call") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - (te ? 24 : 12))} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - (te ? 26 : 14))} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />);
    if (b.prop === "loop") {
      const slam = end + HOLD, c1 = cue(i, 1, 0.6);
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={c1} src="reel/sfx_buzz.wav" vol={0.3} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.55} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("call") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4545 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "how") {
          how(c, W, H, f, cu(1, 0.4) - 4, ln.from);
          face(c, "chinnu", "shock", 900, 1420, 110, false, f, r);
          return;
        }
        // ---------- the living room ----------
        const hookOn = b.prop === "hook" || loopOn;
        const cam = hookOn ? { z: 1.0, x: 540, y: 680 } : CAM[b.shot] ?? CAM.wide;   // frame 1: the two of them lower, under the receipt
        const z = cam.z * (1 + 0.03 * p);
        const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.fillStyle = "#d6ebe3"; c.fillRect(0, 0, W, H);
        c.save(); c.translate(W / 2 + sx, 960 + sy); c.scale(z, z); c.translate(-cam.x, -cam.y);
        room(c, r, false);
        const [am, ap, al] = loopOn ? AMMA[1] : AMMA[n] ?? ["stern", "rest", 1];
        const [cm, cp, cl] = loopOn ? CHINNU[1] : CHINNU[n] ?? ["worried", "rest", -1];
        person(c, "amma", am, ap, al, b.who === "amma" && talking && !loopOn, p, f, r, {});
        person(c, "chinnu", cm, cp, cl, b.who === "chinnu" && talking && !loopOn, p, f, r, { glow: true });
        sofaFront(c, r);
        c.restore();
        // screen-space: the ad, the receipt, the chips, the cards
        if (hookOn) {   // frame 1: the receipt and the clash first, the ad smaller behind
          ad(c, 600, 200, 400, 520, "INVEST ₹22,000", "GET ₹5,50,000 IN 1 WEEK", f, false, 1);
          receipt(c, 340, 520, 0.95);
          clash(c, W);
        }
        if (b.prop === "video") ad(c, 200, 220, 680, 760, "INVEST ₹22,000", "GET ₹5,50,000 IN 1 WEEK", f, true, 0);
        if (b.prop === "deepfake") {
          ad(c, 560, 230, 430, 560, "INVEST ₹22,000", "GET ₹5,50,000 IN 1 WEEK", f, false, seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
          tag(c, "lakhs in a week? ✗", 300, 420, 58, "#fee2e2", "#991b1b", -0.04, seg(p, 0.05, 0.2));
        }
        if (b.prop === "lips") {   // he zooms in on the face
          const k = easeOut(seg(p, 0, 0.25));
          ad(c, 200 - 120 * k, 220, 680 + 240 * k, 760 + 120 * k, "INVEST ₹22,000", "GET ₹5,50,000 IN 1 WEEK", f, true, 0);
          tag(c, "\"her lips match!\"", W / 2, 1150, 56, "#fef3c7", INK, -0.03, seg(p, 0.2, 0.35));
        }
        if (b.prop === "tests") {   // the two tests (sound-off viewers)
          const k0 = seg(p, 0.0, 0.08), t1 = cu(1, 0.4);
          c.save(); c.globalAlpha = clamp(k0 * 3);
          c.fillStyle = "rgba(15,23,42,0.95)"; rrect(c, 50, 210, W - 100, 830, 30); c.fill();
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("SPOT A DEEPFAKE: TWO TESTS", W / 2, 296);
          c.restore();
          ([["1  THE MONEY", "quick, sure, huge returns", "= a scam, whatever the face", ln.from + 4, "#fee2e2", "#991b1b"],
            ["2  THE SOURCE", "the verified page · PIB Fact Check", "not an ad, not a forward", t1 - 2, "#dcfce7", "#14532d"]] as [string, string, string, number, string, string][]).forEach(([a, bb, cc, t0, bg, fg], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3);
            const y = 340 + q * 330;
            c.fillStyle = bg; rrect(c, 90, y, W - 180, 290, 24); c.fill();
            c.font = SANS(50, 900); c.fillStyle = fg; c.textAlign = "left"; c.fillText(a, 130, y + 74);
            c.font = SANS(44, 800); c.fillStyle = INK; c.fillText(bb, 130, y + 160); c.fillText(cc, 130, y + 226);
            c.restore();
          });
        }
        if (b.prop === "pib") {   // he checks it himself: the verdict only
          const k = seg(f, ln.from - 2, ln.from + 8);
          c.save(); c.globalAlpha = clamp(k * 3); c.translate(W / 2, 560); c.rotate(-0.02);
          c.fillStyle = "#fffdf5"; rrect(c, -420, -260, 840, 520, 28); c.fill();
          c.strokeStyle = "#1e3a8a"; c.lineWidth = 6; rrect(c, -404, -244, 808, 488, 20); c.stroke();
          c.font = SANS(44, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText("PIB FACT CHECK · Apr 16, 2026", 0, -170);
          c.font = SANS(40, 800); c.fillStyle = INK; c.fillText("\"₹22,000 → ₹5.5 lakh in a week\"", 0, -90);
          c.save(); c.rotate(-0.08); c.strokeStyle = RED; c.lineWidth = 10; rrect(c, -220, -40, 440, 130, 16); c.stroke();
          c.font = SANS(110, 900); c.fillStyle = RED; c.fillText("FAKE", 0, 66); c.restore();
          c.font = SANS(40, 800); c.fillStyle = "#334155"; c.fillText("made with AI", 0, 190);
          c.restore();
        }
        if (b.prop === "call") {
          const k = seg(p, 0, 0.1);
          c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#dc2626"; rrect(c, 90, 260, W - 180, 420, 30); c.fill();
          c.font = SANS(50, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("ALREADY PAID?", W / 2, 360);
          c.font = SANS(170, 900); c.fillText("1930", W / 2, 540);
          c.font = SANS(38, 800); c.fillText("or cybercrime.gov.in · the sooner, the better", W / 2, 630); c.restore();
        }
        if (b.prop === "loop" && !loopOn) {   // the next fake: he runs the money test himself
          const c1 = cu(1, 0.6);
          ad(c, 200, 220, 680, 760, "RBI GOVERNOR:", "DOUBLE YOUR MONEY IN 30 DAYS", f, f < c1, seg(f, c1, c1 + 8));
          c.save(); c.globalAlpha = seg(f, c1 + 4, c1 + 12); c.fillStyle = "rgba(255,253,245,0.95)"; rrect(c, 60, 1000, W - 120, 64, 32); c.fill();
          c.font = SANS(30, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText("RBI warned about fake videos of its Governor (Nov 2024)", W / 2, 1042); c.restore();
        }
        if (FACE[n] && b.shot === "how") face(c, "amma", FACE[n], 900, 1420, 110, false, f, r);
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const DEEPFAKE_SCENES = { sk_deepfake: StDeepfake };
