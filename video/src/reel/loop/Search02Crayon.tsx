import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";

// UC02 "₹168, With a Link" (series/scripts/uc02_web_search.md, v2): the shop AI now searches the web. It told Ravi toor
// dal was ₹168 a kg "with a link"; Begum Bazar's rate today was ₹142; 50 kg cost him ₹1,300 extra. The link was real: an
// old page whose title says "today" and that has no date. Search → read → answer with the link. Our test
// (series/scripts/uc02_demo, a made-up mini web of 6 pages, a small free AI on our computer, 10 fresh chats each): not
// given today's date, 10/10 ₹168 from the old page; given the date, 10/10 ₹142 from today's page. CJR/Tow Center, Mar
// 2025: 8 AI search tools got the source wrong in 60%+ of 1,600 tests. The rule: open the link; "today" is not a date.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
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
  1: ["angry", "slam"], 3: ["confused", "shrug"], 5: ["sus", "point"], 9: ["confused", "rest"], 11: ["happy", "point"], 12: ["shock", "up"],
};

const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 22) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
const wrap = (c: Ctx, text: string, max: number) => {
  const out: string[] = []; let cur = "";
  text.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; });
  if (cur) out.push(cur); return out;
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
  c.font = SANS(34, 700); c.fillStyle = "#cbd5e1"; sub.forEach((t, i) => c.fillText(t, W / 2, 378 + i * 46));
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 34, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 262);
  const fs = fit(c, big, 430, 100); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 385);
};
// a web page card: the link, the title, the line with the price, and the date (or "no date")
const page = (c: Ctx, x: number, y: number, w: number, url: string, title: string, line: string, date: string, dateOk: boolean, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 30);
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, 300, 20); c.fill(); c.strokeStyle = "#94a3b8"; c.lineWidth = 3; rrect(c, x, y, w, 300, 20); c.stroke();
  c.fillStyle = "#e2e8f0"; rrect(c, x, y, w, 56, 20); c.fill(); c.fillRect(x, y + 30, w, 26);
  c.textAlign = "left"; c.font = SANS(fit(c, url, w - 40, 24, 700), 700); c.fillStyle = "#1d4ed8"; c.fillText(url, x + 20, y + 38);
  c.font = SANS(fit(c, title, w - 40, 36, 900), 900); c.fillStyle = INK; c.fillText(title, x + 20, y + 106);
  c.font = SANS(fit(c, line, w - 40, 40, 900), 900); c.fillStyle = "#7c2d12"; c.fillText(line, x + 20, y + 176);
  c.font = SANS(fit(c, date, w - 40, 34, 900), 900); c.fillStyle = dateOk ? GREEN : RED; c.fillText(date, x + 20, y + 252);
  c.restore();
};

const StSearch: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.5} />, <Sfx key={k("m")} at={3} src="audio/sfx_chaching.wav" vol={0.35} />, <Sfx key={k("b")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "real") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "steps") { sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("z")} at={cue(i, 2, 0.4) + 14} src="reel/sfx_buzz.wav" vol={0.32} />, <Sfx key={k("h")} at={cue(i, 4, 0.8)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />); }
    if (b.prop === "test") sfx.push(<Sfx key={k("r")} at={cue(i, 1, 0.4)} src="reel/sfx_buzz.wav" vol={0.32} />, <Sfx key={k("g")} at={cue(i, 2, 0.7)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "quiz") { sfx.push(<Sfx key={k("q")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.3} />); [0, 15, 30, 45].forEach((dd) => sfx.push(<Sfx key={k("t" + dd)} at={end + 4 + dd} src="audio/sfx_tick.wav" vol={0.4} />)); }
    if (b.prop === "answer") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("z")} at={cue(i, 1, 0.3) + 6} src="reel/sfx_buzz.wav" vol={0.28} />);
    if (b.prop === "study") sfx.push(<Sfx key={k("x")} at={cue(i, 1, 0.6)} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />, <Sfx key={k("c")} at={cue(i, 2, 0.75)} src={CLAP} vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("s")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(6502 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "steps") {
          dark(c, W, H, T.stepsHead, [T.stepsSub]);
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(2, 0.4) - 4, cu(2, 0.4) + 6), k3 = seg(f, cu(3, 0.6) - 4, cu(3, 0.6) + 6);
          const box = (y: number, num: string, lab: string, k: number) => { if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e3a8a"; c.beginPath(); c.arc(110, y, 40, 0, 7); c.fill(); c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(num, 110, y + 17); c.textAlign = "left"; c.font = SANS(44, 900); c.fillStyle = "#f8fafc"; c.fillText(lab, 170, y + 15); c.restore(); };
          box(470, "1", T.step1, k1);
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 6) * 3); c.fillStyle = "#1e293b"; rrect(c, 170, 515, W - 230, 80, 14); c.fill(); c.font = SANS(fit(c, T.topResult, W - 270, 32, 800), 800); c.fillStyle = "#93c5fd"; c.textAlign = "left"; c.fillText(T.topResult, 190, 566); c.restore(); }
          box(680, "2", T.step2, k2);
          if (k2 > 0) page(c, 170, 720, W - 230, T.oldUrl, T.oldTitle, T.oldLine, T.noDate, false, seg(f, cu(2, 0.4), cu(2, 0.4) + 8));
          box(1110, "3", T.step3, k3);
          chip(c, T.noToday, W / 2, 1250, "#7f1d1d", "#fff", seg(f, cu(4, 0.8) - 2, cu(4, 0.8) + 6), fit(c, T.noToday, W - 140, 44, 900));
        } else if (b.shot === "test") {
          dark(c, W, H, T.testHead, [T.testSub]);
          const kA = seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 6), kB = seg(f, cu(2, 0.7) - 4, cu(2, 0.7) + 6);
          const card = (y: number, lab: string, big: string, sub: string, bg: string, fg: string, k: number) => {   // shown dim from the cut, lit on its cue
            const kk = clamp(k * 3); c.save(); c.globalAlpha = 0.35 + 0.65 * kk;
            c.fillStyle = kk > 0 ? bg : "#1e293b"; rrect(c, 60, y, W - 120, 330, 26); c.fill();
            c.textAlign = "center"; c.font = SANS(fit(c, lab, W - 180, 46, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(lab, W / 2, y + 70);
            c.font = SANS(140, 900); c.fillStyle = kk > 0 ? fg : "#64748b"; c.fillText(kk > 0 ? big : "?", W / 2, y + 220);
            if (kk > 0) { c.font = SANS(fit(c, sub, W - 180, 40, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(sub, W / 2, y + 296); }
            c.restore();
          };
          card(430, T.aLab, T.aBig, T.aSub, "#7f1d1d", "#fecaca", kA);
          card(800, T.bLab, T.bBig, T.bSub, "#14532d", "#bbf7d0", kB);
          chip(c, T.builder, W / 2, 1230, "#fde68a", INK, seg(f, cu(2, 0.7) + 24, cu(2, 0.7) + 32), fit(c, T.builder, W - 120, 34, 800));
        } else if (b.shot === "quiz") {
          dark(c, W, H, T.quizHead, [b.prop === "quiz" ? T.quizSub : ""]);
          const opts = T.opts as [string, string][];
          const kAns = b.prop === "answer" ? seg(f, ln.from, ln.from + 8) : 0;
          opts.forEach(([L, t], q) => {
            const t0 = b.prop === "quiz" ? cu(q + 1, 0.3 + q * 0.2) - 2 : -100; const k = b.prop === "quiz" ? seg(f, t0, t0 + 6) : 1; if (k <= 0) return;
            const right = q === 2, y = 460 + q * 190;
            c.save(); c.globalAlpha = clamp(k * 3) * (kAns > 0 && !right ? 1 - 0.6 * kAns : 1);
            c.fillStyle = kAns > 0 && right ? "#14532d" : "#1e293b"; rrect(c, 70, y, W - 140, 160, 24); c.fill();
            c.font = SANS(64, 900); c.fillStyle = kAns > 0 && right ? "#86efac" : "#fde68a"; c.textAlign = "left"; c.fillText(L, 110, y + 104);
            const fs = fit(c, t, W - 330, 48, 800); c.font = SANS(fs, 800); c.fillStyle = "#f8fafc"; c.fillText(t, 200, y + 100);
            if (kAns > 0 && !right) { c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.moveTo(190, y + 82); c.lineTo(W - 110, y + 82); c.stroke(); }
            c.restore();
          });
          if (b.prop === "answer") { chip(c, T.askAgain, W / 2, 1100, "#7f1d1d", "#fff", seg(f, cu(1, 0.3) - 2, cu(1, 0.3) + 6), fit(c, T.askAgain, W - 140, 42, 900)); chip(c, T.whereNotWhen, W / 2, 1220, "#fde68a", INK, seg(f, cu(2, 0.6) - 2, cu(2, 0.6) + 6), fit(c, T.whereNotWhen, W - 140, 42, 900)); }
        } else if (b.shot === "study") {
          dark(c, W, H, T.studyHead, [T.studySub]);
          const k1 = seg(f, ln.from + 2, ln.from + 10), k2 = seg(f, cu(1, 0.6) - 4, cu(1, 0.6) + 6);
          if (k1 > 0) { c.save(); c.globalAlpha = clamp(k1 * 3); c.font = SANS(48, 900); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; (T.studyRows as string[]).forEach((t, q) => c.fillText(t, W / 2, 520 + q * 70)); c.restore(); }
          if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.font = SANS(190, 900); c.fillStyle = "#f87171"; c.textAlign = "center"; c.fillText(T.studyBig, W / 2, 920); c.font = SANS(fit(c, T.studyLab, W - 120, 52, 900), 900); c.fillStyle = "#fecaca"; c.fillText(T.studyLab, W / 2, 1000); c.font = SANS(fit(c, T.studySpread, W - 120, 38, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(T.studySpread, W / 2, 1090); c.restore(); }
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
          const [mood, armPose] = loopOn ? (["angry", "slam"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          if (hookOn) {
            block(c, 50, T.leftLab, T.leftVal, "#f87171");
            block(c, 560, T.rightLab, T.rightVal, "#4ade80");
            chip(c, T.stake, W / 2, 486, RED, "#fff", 1, 44);
          }
          if (b.prop === "real") {   // the phone's answer and the page it cited
            page(c, 60, 230, W - 120, T.oldUrl, T.oldTitle, T.oldLine, T.noDate, false, seg(f, ln.from + 2, ln.from + 10));
            chip(c, T.reallySays, W / 2, 580, "#14532d", "#f0fdf4", seg(f, cu(1, 0.4) - 2, cu(1, 0.4) + 6), fit(c, T.reallySays, W - 140, 38, 900));
            chip(c, T.story, W / 2, 1380, "rgba(15,23,42,0.88)", "#f8fafc", 1, 30);
          }
          if (b.prop === "rule") {
            stamp(c, T.rule1, W / 2, 260, "#2563eb", seg(f, ln.from + 2, ln.from + 10), 56, -0.05);
            stamp(c, T.rule2, W / 2, 400, "#7c2d12", seg(f, cu(1, 0.35) - 2, cu(1, 0.35) + 6), 52, 0.03);
            stamp(c, T.rule3, W / 2, 540, RED, seg(f, cu(2, 0.75) - 2, cu(2, 0.75) + 6), 64, -0.04);
          }
        }
      }} />
    </>
  );
};

export const SEARCH02_SCENES = { sk_search02: StSearch };
