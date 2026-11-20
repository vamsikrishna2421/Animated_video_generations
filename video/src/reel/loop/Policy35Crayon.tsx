import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 35 "30 Days or 30 Weeks?" (series/scripts/creative35_policy_telugu.md): myth vs fact, one narrator. Sarojini
// garu (made up) pasted her policy into a small free AI for Telugu; "claim within 30 days" came out "30 weeks" (our
// test's own reply, shown as written). Myth: "if the numbers match, the translation is right"; fact: the number stayed
// and the unit changed. The ask to screenshot: the Customer Information Sheet in Telugu (IRDAI, Sep 2024, on request).
// The test tiles and Telugu snippets come from series/scripts/creative35_demo (read by hand).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const BILL_AT = 45;   // the stake lands at 1.5 s, after the two numbers have been read
const wordAt = (ln: Line, re: RegExp, fb: number) => (ln.words ?? []).find((w) => re.test(w.w.replace(/[^A-Za-z]/g, "")))?.from ?? fb;
const rejAt = (ln: Line) => wordAt(ln, /^rejected$/i, ln.from + ln.frames - 22);
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;

const bg = (c: Ctx, W: number, H: number) => { c.fillStyle = "#fef3c7"; c.fillRect(0, 0, W, H); c.fillStyle = "#fde68a"; c.fillRect(0, 1180, W, H - 1180); };
const block = (c: Ctx, x: number, y: number, w: number, h: number, label: string, val: string, sub: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bgc; rrect(c, x, y, w, h, 24); c.fill();
  c.textAlign = "center";
  c.font = SANS(fit(c, label, w - 40, 34, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(label, x + w / 2, y + 52);
  c.font = SANS(fit(c, val, w - 40, 88, 900), 900); c.fillStyle = fg; c.fillText(val, x + w / 2, y + h / 2 + 38);
  if (sub) { c.font = SANS(fit(c, sub, w - 40, 32, 800), 800); c.fillStyle = "#f1f5f9"; c.fillText(sub, x + w / 2, y + h - 24); }
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
const tile = (c: Ctx, x: number, y: number, w: number, top: string, te: string, gloss: string, verdict: string, ok: boolean, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 60);
  c.fillStyle = "#fffdf7"; rrect(c, x, y, w, 260, 20); c.fill(); c.strokeStyle = ok ? GREEN : RED; c.lineWidth = 6; rrect(c, x, y, w, 260, 20); c.stroke();
  c.textAlign = "left"; c.font = SANS(fit(c, top, w - 40, 40, 900), 900); c.fillStyle = INK; c.fillText(top, x + 24, y + 54);
  c.font = SANS(fit(c, te, w - 40, 50, 800), 800); c.fillStyle = "#7c2d12"; c.fillText(te, x + 24, y + 120);
  c.font = SANS(fit(c, gloss, w - 40, 36, 800), 800); c.fillStyle = "#334155"; c.fillText(gloss, x + 24, y + 174);
  c.font = SANS(fit(c, verdict, w - 40, 50, 900), 900); c.fillStyle = ok ? GREEN : RED; c.fillText(verdict, x + 24, y + 238);
  c.restore();
};

const StPolicy: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.5} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.45} />, <Sfx key={k("m")} at={BILL_AT} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("g")} at={cue(i, 1, 0.4) - 4} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("r")} at={rejAt(l)} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("rc")} at={rejAt(l)} src={CLAP} vol={0.4} />);
    if (b.prop === "myth") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("x")} at={cue(i, 1, 0.3) - 6} src="audio/gag_bonk.wav" vol={0.45} />, <Sfx key={k("d")} at={cue(i, 1, 0.3) + 4} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "test") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("p" + n)} at={cue(i, n, 0.3) - 6} src={n === 3 ? "reel/sfx_boom.wav" : "audio/sfx_pop.wav"} vol={n === 3 ? 0.55 : 0.35} />));
    if (b.prop === "better") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.3} />, <Sfx key={k("b")} at={end - 4} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 4} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("s")} at={cue(i, 1, 0.3) - 4} src="audio/sfx_success.wav" vol={0.3} />, <Sfx key={k("c")} at={cue(i, 2, 0.7) - 4} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3535 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        bg(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          const full = loopOn || P === "loop";
          const kT = full ? 0 : seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 10);   // the AI block shakes as "thirty weeks" is said
          const kB = full ? 1 : seg(f, BILL_AT, BILL_AT + 8);
          if (kB > 0) {
            c.save(); c.globalAlpha = clamp(kB * 3); c.fillStyle = "#1e293b"; rrect(c, 60, 285, W - 120, 80, 18); c.fill();
            c.font = SANS(fit(c, T.bill, W - 160, 44, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(T.bill, W / 2, 342); c.restore();
          }
          block(c, 40, 390, 490, 320, "POLICY: CLAIM WITHIN", T.policy, "", "#14532d", "#bbf7d0", 1);
          c.save(); if (kT > 0 && kT < 1) c.translate(Math.sin(kT * 40) * 14 * (1 - kT), 0);
          block(c, 550, 390, 490, 320, "THE AI'S TELUGU", T.ai, T.aiGloss, "#7f1d1d", "#fecaca", 1); c.restore();
          person(c, "sarojini" as BillWho, [260, 1080], 0.8, f >= cu(1, 0.4) || full ? "shock" : "worried", "phone", false, r);
          c.save(); c.fillStyle = "#111827"; rrect(c, 600, 750, 400, 340, 30); c.fill(); c.fillStyle = "#f8fafc"; rrect(c, 616, 766, 368, 308, 22); c.fill();
          c.font = SANS(28, 900); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("AI · Telugu", 644, 812);
          c.fillStyle = "#fde047"; rrect(c, 636, 850, 328, 110, 16); c.fill();
          c.font = SANS(fit(c, T.teLine, 300, 64, 900), 900); c.fillStyle = RED; c.textAlign = "center"; c.fillText(T.teLine, 800, 928);
          c.font = SANS(30, 800); c.fillStyle = "#334155"; c.fillText("= 30 weeks", 800, 1020);
          c.restore();
          stamp(c, "CLAIM REJECTED", 540, 1250, 58, RED, full ? 1 : seg(f, rejAt(ln), rejAt(ln) + 8));
          if (P === "hook" && !loopOn && f < rejAt(ln)) chip(c, T.story, 800, 1140, "#1e293b", "#f8fafc", 1, 38);
        } else if (P === "myth") {
          c.textAlign = "center";
          const k0 = seg(f, ln.from, ln.from + 8), kx = seg(f, cu(1, 0.3) - 6, cu(1, 0.3) + 2);
          c.save(); c.globalAlpha = clamp(k0 * 3) * (1 - 0.6 * kx);
          c.fillStyle = "#fee2e2"; rrect(c, 70, 300, W - 140, 270, 24); c.fill();
          c.font = SANS(56, 900); c.fillStyle = RED; c.fillText("MYTH", W / 2, 375);
          c.font = SANS(54, 900); c.fillStyle = INK; wrap(c, T.myth, W - 200).slice(0, 2).forEach((t, q) => c.fillText(t, W / 2, 455 + q * 64)); c.restore();
          if (kx > 0) { c.save(); c.strokeStyle = RED; c.lineWidth = 14; c.beginPath(); c.moveTo(100, 330); c.lineTo(100 + (W - 200) * easeOut(kx), 545); c.stroke(); c.restore(); }
          const kf = seg(f, cu(1, 0.3) + 4, cu(1, 0.3) + 12);
          if (kf > 0) {
            c.save(); c.globalAlpha = clamp(kf * 3); c.fillStyle = "#14532d"; rrect(c, 70, 600, W - 140, 590, 24); c.fill();
            c.font = SANS(56, 900); c.fillStyle = "#bbf7d0"; c.fillText("FACT", W / 2, 680);
            c.font = SANS(56, 900); c.fillStyle = "#fff"; wrap(c, T.fact, W - 200).slice(0, 2).forEach((t, q) => c.fillText(t, W / 2, 760 + q * 66));
            const [a, z] = T.factPic as [string, string], kp = seg(f, cu(1, 0.3) + 14, cu(1, 0.3) + 24);
            c.globalAlpha = clamp(kf * 3) * clamp(kp * 2);
            c.fillStyle = "#f0fdf4"; rrect(c, 100, 880, 390, 150, 20); c.fill(); c.fillStyle = "#fef2f2"; rrect(c, 590, 880, 390, 150, 20); c.fill();
            c.font = SANS(fit(c, a, 350, 64, 900), 900); c.fillStyle = GREEN; c.fillText(a, 295, 978);
            c.font = SANS(fit(c, z, 350, 56, 900), 900); c.fillStyle = RED; c.fillText(z, 785, 974);
            c.font = SANS(64, 900); c.fillStyle = "#fde68a"; c.fillText("→", W / 2, 978);
            c.font = SANS(40, 900); c.fillStyle = "#bbf7d0"; c.fillText("same 30 · different unit", W / 2, 1095);
            c.font = SANS(30, 700); c.fillStyle = "#86efac"; c.fillText("from our test's own reply", W / 2, 1150); c.restore();
          }
        } else if (P === "test") {
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#7c2d12"; c.fillText("OUR TEST · 5 CHATS", W / 2, 340);
          c.font = SANS(fit(c, T.model, W - 120, 32, 700), 700); c.fillStyle = "#475569"; c.fillText(T.model, W / 2, 390);
          const kA = seg(f, ln.from + 2, ln.from + 10) * (1 - seg(f, cu(1, 0.3) - 10, cu(1, 0.3) - 2));
          if (kA > 0) {
            c.save(); c.globalAlpha = clamp(kA * 3);
            c.fillStyle = "#dcf8c6"; rrect(c, 120, 520, W - 240, 220, 28); c.fill();
            c.textAlign = "left"; c.font = SANS(28, 800); c.fillStyle = "#475569"; c.fillText("our ask, 5 fresh chats:", 160, 575);
            c.font = SANS(54, 900); c.fillStyle = INK; wrap(c, T.ask, W - 320).slice(0, 2).forEach((t, q) => c.fillText(t, 160, 645 + q * 64));
            c.font = SANS(32, 800); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText(T.askSub, W / 2, 810);
            for (let q = 0; q < 5; q++) { c.fillStyle = "#1e293b"; rrect(c, W / 2 - 230 + q * 96, 860, 76, 60, 14); c.fill(); c.fillStyle = "#fde68a"; c.font = SANS(32, 900); c.fillText(`${q + 1}`, W / 2 - 192 + q * 96, 902); }
            c.restore();
          }
          (T.tiles as [string, string, string, string, boolean][]).forEach(([top, tel, gloss, verdict, ok], q) => tile(c, 60, 430 + q * 290, W - 120, top, tel, gloss, verdict, ok, seg(f, cu(q + 1, 0.3) - 6, cu(q + 1, 0.3) + 4)));
        } else if (P === "better") {
          c.textAlign = "center"; c.font = SANS(fit(c, T.betterAsk, W - 100, 52, 900), 900); c.fillStyle = "#7c2d12"; c.fillText(T.betterAsk, W / 2, 340);
          block(c, 60, 420, 470, 340, T.betterNumLab, T.betterNum, "", "#14532d", "#bbf7d0", seg(f, ln.from + 4, ln.from + 12));
          const kS = seg(f, ln.from + 14, ln.from + 22);
          if (kS > 0) { c.save(); c.globalAlpha = clamp(kS * 3); c.font = SANS(fit(c, T.betterNumSub, 460, 44, 900), 900); c.fillStyle = "#14532d"; c.fillText(T.betterNumSub, 295, 830); c.restore(); }
          block(c, 550, 420, 470, 340, "\"not covered\" kept", T.betterNot, "", "#7f1d1d", "#fecaca", seg(f, cu(1, 0.3) - 6, cu(1, 0.3) + 2));
          if (f >= cu(1, 0.3) + 10) chip(c, T.betterLesson, W / 2, 960, "#1e293b", "#f8fafc", seg(f, cu(1, 0.3) + 10, cu(1, 0.3) + 18), fit(c, T.betterLesson, W - 140, 42, 800));
        } else if (P === "rule") {
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#7c2d12"; c.fillText("ASK FOR THIS", W / 2, 330);
          const k0 = seg(f, ln.from + 4, ln.from + 12), k1 = seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 6), k2 = seg(f, cu(2, 0.7) - 4, cu(2, 0.7) + 6);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.translate(0, (1 - easeOut(clamp(k0 * 1.5))) * 50);
            c.fillStyle = "#ffffff"; rrect(c, 60, 380, W - 120, 390, 28); c.fill(); c.strokeStyle = "#1e293b"; c.lineWidth = 6; rrect(c, 60, 380, W - 120, 390, 28); c.stroke();
            c.textAlign = "left"; c.font = SANS(30, 800); c.fillStyle = "#64748b"; c.fillText("to your agent or customer care:", 100, 446);
            c.font = SANS(60, 900); c.fillStyle = INK; wrap(c, T.card, W - 200).slice(0, 4).forEach((t, q) => c.fillText(t, 100, 532 + q * 74));
            c.restore();
            stamp(c, "SCREENSHOT THIS", 770, 384, 40, "#2563eb", k0, 0.05);
          }
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.fillStyle = "#14532d"; rrect(c, 60, 800, W - 120, 220, 22); c.fill();
            c.textAlign = "center"; c.font = SANS(42, 900); c.fillStyle = "#f0fdf4"; wrap(c, T.cardSrc, W - 180).slice(0, 2).forEach((t, q) => c.fillText(t, W / 2, 866 + q * 52));
            c.font = SANS(fit(c, T.cardNote, W - 180, 32, 700), 700); c.fillStyle = "#bbf7d0"; c.fillText(T.cardNote, W / 2, 990); c.restore();
          }
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3); c.fillStyle = "#7f1d1d"; rrect(c, 60, 1050, W - 120, 190, 22); c.fill();
            c.textAlign = "center"; c.font = SANS(34, 900); c.fillStyle = "#fecaca"; c.fillText(T.checkLab, W / 2, 1106);
            c.font = SANS(fit(c, T.check, W - 170, 56, 900), 900); c.fillStyle = "#fff"; c.fillText(T.check, W / 2, 1190); c.restore();
          }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const POLICY35_SCENES = { sk_policy35: StPolicy };
