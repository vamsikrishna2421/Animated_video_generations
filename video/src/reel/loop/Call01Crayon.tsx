import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";

// UC01 "42 Seconds of Silence" (series/scripts/uc01_phone_call_assistant.md): the shop's phone AI took 42 s to answer a
// ₹1,928 phone order and the caller hung up. A phone turn: ears (speech -> text), brain (writes the reply), mouth
// (text -> speech), one after the other. Our test (series/scripts/uc01_demo, on our computer, no GPU, medians of 6):
// ears 1.8 s, brain 29.6 s, mouth 10.1 s = 41.7 s; told to be short: 4 s but 0/6 totals right; a 1.5B model: 1/6;
// speaking the first sentence while the rest is written: 2.5 s, 6/6 right. People: ~0.2 s between turns (PNAS 2009).
// The rule: start talking sooner, never cut the working. The twist: the caller talks while the AI is still reading.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai" | "caller"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.4, x: 480, y: 740 }, ai: { z: 1.8, x: 760, y: 860 }, hook: { z: 0.9, x: 540, y: 860 },
};
const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["shock", "phone"], 3: ["angry", "slam"], 5: ["confused", "shrug"], 7: ["hope", "point"], 10: ["happy", "thumb"], 11: ["happy", "rest"], 12: ["worried", "rest"], 13: ["shock", "rest"], 14: ["panic", "up"],
};

const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 24) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
const chip = (c: Ctx, t: string, x: number, y: number, bg: string, fg: string, k: number, size = 36) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 800);
  const w = c.measureText(t).width + 44;
  c.fillStyle = bg; rrect(c, x - w / 2, y - size, w, size * 1.6, 16); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, x, y + size * 0.18); c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, col: string, k: number, size = 80, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); const z = 1.6 - 0.6 * easeOut(clamp(k * 2)); c.scale(z, z); c.globalAlpha = clamp(k * 3);
  c.font = SANS(size, 900); const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 56); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(36, 700); c.fillStyle = "#cbd5e1"; sub.forEach((t, i) => c.fillText(t, W / 2, 380 + i * 48));
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 36, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 264);
  const fs = fit(c, big, 430, 110); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 388);
};
// a row of six totals from the test, the right one ticked, the wrong ones struck
const totals = (c: Ctx, W: number, y: number, vals: number[], k: number) => {
  vals.forEach((v, q) => {
    const kq = seg(k, q * 0.08, q * 0.08 + 0.2); if (kq <= 0) return;
    const x = 80 + (q % 3) * 315, yy = y + Math.floor(q / 3) * 150, ok = v === 1928;
    c.save(); c.globalAlpha = clamp(kq * 3);
    c.fillStyle = ok ? "#14532d" : "#3f1d1d"; rrect(c, x, yy, 290, 120, 18); c.fill();
    c.font = SANS(56, 900); c.fillStyle = ok ? "#86efac" : "#fca5a5"; c.textAlign = "center"; c.fillText(`₹${v.toLocaleString("en-IN")}`, x + 145, yy + 80);
    if (!ok) { c.strokeStyle = RED; c.lineWidth = 7; c.beginPath(); c.moveTo(x + 24, yy + 62); c.lineTo(x + 266, yy + 62); c.stroke(); }
    else { c.font = SANS(44, 900); c.fillStyle = "#86efac"; c.fillText("✓", x + 262, yy + 44); }
    c.restore();
  });
};

const StCall: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "ravi", "ai", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.5} />, <Sfx key={k("h")} at={3} src="reel/sfx_hangup.wav" vol={0.5} />, <Sfx key={k("b")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "stages") { [[0, 0.05], [1, 0.4], [2, 0.7]].forEach(([n, q], j) => sfx.push(<Sfx key={k("p" + j)} at={n === 0 ? at + 4 : cue(i, n, q)} src="audio/sfx_pop.wav" vol={0.32} />)); sfx.push(<Sfx key={k("t")} at={cue(i, 2, 0.7) + 6} src="audio/sfx_tick.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 3, 0.85)} src="audio/gag_ding.wav" vol={0.35} />); }
    if (b.prop === "short" || b.prop === "small") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.32} />, <Sfx key={k("z")} at={cue(i, 1, 0.3) + 18} src="reel/sfx_buzz.wav" vol={0.42} />);   // script review: one buzz, on the score
    if (b.prop === "quiz") sfx.push(<Sfx key={k("q")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "answer") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("s")} at={cue(i, 2, 0.8)} src="audio/sfx_success.wav" vol={0.32} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />);
    if (b.prop === "twist") sfx.push(<Sfx key={k("r")} at={Math.max(0, at - 14)} src="reel/sfx_ring1.wav" vol={0.35} />);
    if (b.prop === "caller") sfx.push(<Sfx key={k("p")} at={Math.max(0, at - 2)} src="audio/sfx_pop.wav" vol={0.45} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("s")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(6401 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "stages") {
          dark(c, W, H, T.stagesHead, [T.stagesSub]);
          const st = T.stages as [string, string, number, string][];   // name, what, seconds, colour
          const t0 = [ln.from + 2, cu(1, 0.4), cu(2, 0.7)];
          st.forEach(([name, what, secs, col], q) => {
            const k = seg(f, t0[q] - 2, t0[q] + 6); if (k <= 0) return;
            const y = 450 + q * 170;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * 40, 0);
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 145, 22); c.fill(); c.fillStyle = col; rrect(c, 60, y, 22, 145, 10); c.fill();
            c.textAlign = "left"; c.font = SANS(50, 900); c.fillStyle = "#f8fafc"; c.fillText(name, 110, y + 64);
            c.font = SANS(fit(c, what, 520, 32, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(what, 110, y + 114);
            c.textAlign = "right"; c.font = SANS(72, 900); c.fillStyle = col; c.fillText(`${secs} s`, W - 100, y + 98);
            c.restore();
          });
          const kB = seg(f, cu(2, 0.7) + 6, cu(2, 0.7) + 40);   // the silence bar fills ears, brain, mouth
          if (kB > 0) {
            const tot = st.reduce((a, x) => a + x[2], 0), bw = W - 120;
            c.save(); c.fillStyle = "#334155"; rrect(c, 60, 980, bw, 60, 14); c.fill();
            let x0 = 60; st.forEach(([, , secs, col]) => { const w = (bw * secs) / tot; const fillW = clamp((kB * bw - (x0 - 60)) / w) * w; if (fillW > 0) { c.fillStyle = col; c.fillRect(x0, 980, fillW, 60); } x0 += w; });
            c.font = SANS(54, 900); c.fillStyle = "#fca5a5"; c.textAlign = "center"; c.fillText(T.silence, W / 2, 1120);
            c.restore();
          }
          const kP = seg(f, cu(3, 0.85) - 2, cu(3, 0.85) + 6);
          if (kP > 0) chip(c, T.bigApps, W / 2, 1230, "#e0e7ff", "#1e1b4b", kP, fit(c, T.bigApps, W - 160, 40, 800));
          c.save(); c.globalAlpha = seg(f, ln.from, ln.from + 10); c.font = SANS(fit(c, T.people, W - 120, 32, 700), 700); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText(T.people, W / 2, 1330); c.restore();
        } else if (b.shot === "short" || b.shot === "small") {
          const short = b.shot === "short";
          dark(c, W, H, short ? T.shortHead : T.smallHead, [short ? T.shortSub : T.smallSub]);
          const kF = seg(f, ln.from + 2, ln.from + 10);
          if (kF > 0) { c.save(); c.globalAlpha = clamp(kF * 3); c.font = SANS(64, 900); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText(short ? T.shortFast : T.smallFast, W / 2, 500); c.restore(); }
          const kT = clamp((f - (cu(1, 0.3) - 4)) / 30);
          totals(c, W, 570, (short ? T.shortVals : T.smallVals) as number[], kT);
          chip(c, `RIGHT: ₹1,928 (1,450 + 310 + 168)`, W / 2, 920, "#fde68a", INK, kT, 38);
          const kV = seg(kT, 0.7, 1);
          if (kV > 0) { c.save(); c.globalAlpha = clamp(kV * 3); c.font = SANS(120, 900); c.fillStyle = "#f87171"; c.textAlign = "center"; c.fillText(short ? T.shortScore : T.smallScore, W / 2, 1110); c.font = SANS(fit(c, short ? T.shortNote : T.smallNote, W - 140, 38, 800), 800); c.fillStyle = "#fecaca"; c.globalAlpha = short ? clamp(seg(f, cu(2, 0.6) - 4, cu(2, 0.6) + 6) * 3) : 1; c.fillText(short ? T.shortNote : T.smallNote, W / 2, 1190); c.restore(); }
        } else if (b.shot === "quiz") {
          dark(c, W, H, T.quizHead, [b.prop === "quiz" ? T.quizSub : ""]);
          const opts = T.opts as [string, string][];
          const kAns = b.prop === "answer" ? seg(f, ln.from, ln.from + 8) : 0;
          const ansEnd = b.prop === "answer" ? ln.from + 30 : 1e9;   // the timeline replaces the options right after "C!"
          if (f < ansEnd) opts.forEach(([L, t], q) => {
            const t0 = b.prop === "quiz" ? cu(1, 0.3) + q * 8 : -100; const k = b.prop === "quiz" ? seg(f, t0, t0 + 6) : 1; if (k <= 0) return;
            const right = q === 2, y = 470 + q * 200;
            c.save(); c.globalAlpha = clamp(k * 3) * (kAns > 0 && !right ? 1 - 0.6 * kAns : 1);
            c.fillStyle = kAns > 0 && right ? "#14532d" : "#1e293b"; rrect(c, 70, y, W - 140, 160, 24); c.fill();
            c.font = SANS(64, 900); c.fillStyle = kAns > 0 && right ? "#86efac" : "#fde68a"; c.textAlign = "left"; c.fillText(L, 110, y + 104);
            const fs = fit(c, t, W - 330, 50, 800); c.font = SANS(fs, 800); c.fillStyle = "#f8fafc"; c.fillText(t, 200, y + 100);
            if (kAns > 0 && !right) { c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.moveTo(190, y + 82); c.lineTo(W - 110, y + 82); c.stroke(); }
            c.restore();
          });
          if (b.prop === "answer" && f >= ansEnd) {   // the timeline: wait for everything vs speak the first sentence
            c.fillStyle = "#0f172a"; c.fillRect(0, 280, W, H - 280);
            c.font = SANS(fit(c, T.streamHead, W - 80, 52), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(T.streamHead, W / 2, 330);
            const k1 = seg(f, ansEnd, ansEnd + 10), k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 10), k3 = seg(f, cu(2, 0.8) - 4, cu(2, 0.8) + 6);
            const bw = W - 160, sc = bw / 41.5;
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.textAlign = "left"; c.font = SANS(40, 800); c.fillStyle = "#fca5a5"; c.fillText(T.waitLab, 80, 470);
            c.fillStyle = "#7f1d1d"; rrect(c, 80, 495, bw * easeOut(k1), 70, 12); c.fill();
            c.font = SANS(54, 900); c.fillStyle = "#fff"; c.textAlign = "right"; c.fillText("41.5 s", 80 + bw - 20, 550);
            c.restore();
            if (k2 > 0) {
              c.save(); c.globalAlpha = clamp(k2 * 3);
              c.textAlign = "left"; c.font = SANS(40, 800); c.fillStyle = "#86efac"; c.fillText(T.firstLab, 80, 680);
              c.fillStyle = "#14532d"; rrect(c, 80, 705, Math.max(30, 2.5 * sc), 70, 12); c.fill();
              c.font = SANS(54, 900); c.fillStyle = "#86efac"; c.fillText("2.5 s", 80 + 2.5 * sc + 20, 760);
              c.fillStyle = "#dcf8c6"; rrect(c, 80, 810, 360, 100, 20); c.fill(); c.font = SANS(48, 900); c.fillStyle = INK; c.fillText("\"Hello!\"", 110, 878);
              c.font = SANS(fit(c, T.restLab, W - 520, 36, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(T.restLab, 470, 870);
              c.restore();
            }
            if (k3 > 0) { c.save(); c.globalAlpha = clamp(k3 * 3); c.fillStyle = "#14532d"; rrect(c, 80, 980, W - 160, 170, 24); c.fill(); c.font = SANS(fit(c, T.streamScore, W - 220, 64, 900), 900); c.fillStyle = "#bbf7d0"; c.textAlign = "center"; c.fillText(T.streamScore, W / 2, 1088); c.restore(); }
            if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.font = SANS(fit(c, T.streamNote, W - 120, 34, 700), 700); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(T.streamNote, W / 2, 1240); c.restore(); }
          }
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["shock", "phone"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          if (hookOn) {
            block(c, 50, T.leftLab, T.leftVal, "#4ade80");
            block(c, 560, T.rightLab, T.rightVal, "#f87171");
            chip(c, T.stake, W / 2, 486, RED, "#fff", 1, 44);
            chip(c, T.ended, 780, 1210, "#111827", "#fca5a5", 1, 34);
          }
          if (n === 2) chip(c, T.story, W / 2, 1380, "rgba(15,23,42,0.88)", "#f8fafc", 1, 32);
          if (b.prop === "rule") {
            const k = seg(f, ln.from + 2, ln.from + 10);
            stamp(c, T.rule1, W / 2, 330, "#2563eb", k, 64, -0.05);
            stamp(c, T.rule2, W / 2, 470, GREEN, seg(f, ln.from + 10, ln.from + 18), 60, 0.04);
          }
          if (b.prop === "caller" || b.prop === "ignore" || (b.prop === "loop" && !loopOn)) {   // the caller talks over the AI
            const k = b.prop === "caller" ? seg(f, ln.from - 2, ln.from + 6) : 1;
            if (k > 0) {
              c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * -60, 0);
              c.fillStyle = "#ffffff"; rrect(c, 60, 230, W - 120, 190, 26); c.fill(); c.strokeStyle = RED; c.lineWidth = 6; rrect(c, 60, 230, W - 120, 190, 26); c.stroke();
              c.font = SANS(32, 800); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText(T.callerLab, 100, 285);
              c.font = SANS(fit(c, T.callerLine, W - 200, 56, 900), 900); c.fillStyle = INK; c.fillText(T.callerLine, 100, 370); c.restore();
            }
            if (b.prop === "loop") chip(c, T.next, W / 2, 500, "#7f1d1d", "#fff", seg(f, ln.from + 2, ln.from + 10), 44);
          }
        }
      }} />
    </>
  );
};

export const CALL01_SCENES = { sk_call01: StCall };
