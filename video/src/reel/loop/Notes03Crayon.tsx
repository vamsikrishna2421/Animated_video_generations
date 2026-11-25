import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";

// UC03 "$14.50 a Bag" (series/scripts/uc03_meeting_notes.md): the shop AI takes notes of Ravi's supplier calls. Ears
// (speech-to-text) → who spoke (names on the turns) → notes. Our test (series/scripts/uc03_demo): speech-to-text wrote
// "fourteen fifty a bag" (₹1,450) as "$14 .50"; 7/10 notes copied it and priced the order at "$580" (real: ₹58,000);
// no names on the turns: 6/10 notes gave Ravi's job (keep 3 empty sacks ready) to Suresh; names: 10/10 right. Google
// Meet's notes: 8 languages, no Telugu, "can be incomplete, inaccurate"; Zoom's summary lists Telugu. The rule: notes
// are a draft; check every number and every name.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.4, x: 480, y: 740 }, ai: { z: 1.8, x: 760, y: 860 }, hook: { z: 0.9, x: 540, y: 860 },
};
const HOLD = 16;
const PRICES = [["Tomatoes", "₹40"], ["Onions", "₹30"], ["Dal", "₹120"], ["Rice bag", "?"]];   // the rice price is the story
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["angry", "slam"], 3: ["confused", "shrug"], 6: ["happy", "point"], 7: ["shock", "up"],
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
  c.font = SANS(size, 900); while (c.measureText(t).width > 960 && size > 30) { size -= 2; c.font = SANS(size, 900); } const w = c.measureText(t).width + 50;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 56); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.fillStyle = "#cbd5e1"; sub.forEach((t, i) => { c.font = SANS(fit(c, t, W - 80, 40, 700), 700); c.fillText(t, W / 2, 384 + i * 50); });
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 34, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 262);
  const fs = fit(c, big, 430, 100); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 385);
};
// a notes card: a title, lines, one line marked
const notes = (c: Ctx, x: number, y: number, w: number, h: number, title: string, lines: string[], mark: number, markCol: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 30);
  c.fillStyle = "#fffbea"; rrect(c, x, y, w, h, 20); c.fill(); c.strokeStyle = "#a16207"; c.lineWidth = 3; rrect(c, x, y, w, h, 20); c.stroke();
  c.textAlign = "left"; c.font = SANS(fit(c, title, w - 40, 34, 900), 900); c.fillStyle = "#713f12"; c.fillText(title, x + 20, y + 50);
  lines.forEach((t, q) => {
    const yy = y + 110 + q * 58;
    if (q === mark) { c.fillStyle = markCol; rrect(c, x + 12, yy - 40, w - 24, 54, 10); c.fill(); }
    c.font = SANS(fit(c, t, w - 50, 36, 800), 800); c.fillStyle = q === mark ? "#fff" : INK; c.fillText(t, x + 24, yy);
  });
  c.restore();
};

const StNotes: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "steps") { [[1, 0.2], [2, 0.2], [3, 0.2]].forEach(([n, q], j) => sfx.push(<Sfx key={k("p" + j)} at={cue(i, n, q)} src="audio/sfx_pop.wav" vol={0.3} />)); sfx.push(<Sfx key={k("h")} at={cue(i, 4, 0.3)} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />, <Sfx key={k("z")} at={cue(i, 4, 0.3) + 6} src="reel/sfx_buzz.wav" vol={0.3} />); }
    if (b.prop === "names") sfx.push(<Sfx key={k("x")} at={ln0(i) + 6} src="reel/sfx_buzz.wav" vol={0.3} />, <Sfx key={k("g")} at={cue(i, 1, 0.4)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "apps") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.3} />, <Sfx key={k("q")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={at + 2} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.4} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("s")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  function ln0(i: number) { return ls[i].from; }
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(6503 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "steps") {
          dark(c, W, H, T.stepsHead, [T.stepsSub]);
          const ks = [seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 6), seg(f, cu(2, 0.2) - 4, cu(2, 0.2) + 6), seg(f, cu(3, 0.2) - 4, cu(3, 0.2) + 6)];
          const kMiss = seg(f, cu(4, 0.3) - 4, cu(4, 0.3) + 8);
          (T.steps as [string, string, string][]).forEach(([lab, sub, body], q) => {
            const k = ks[q]; if (k <= 0) return;
            const y = 440 + q * 280;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = "#1e3a8a"; c.beginPath(); c.arc(110, y + 40, 40, 0, 7); c.fill();
            c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(String(q + 1), 110, y + 57);
            c.textAlign = "left"; c.font = SANS(46, 900); c.fillStyle = "#f8fafc"; c.fillText(lab, 170, y + 36);
            c.font = SANS(fit(c, sub, W - 240, 32, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(sub, 170, y + 80);
            c.fillStyle = "#f8fafc"; rrect(c, 170, y + 100, W - 230, 120, 16); c.fill();
            c.font = SANS(fit(c, body, W - 280, 38, 800), 800); c.fillStyle = INK; c.fillText(body, 192, y + 175);
            if (q !== 1 && kMiss > 0) {   // the dollars, circled, on the ears and on the notes
              c.strokeStyle = RED; c.lineWidth = 7; c.beginPath(); c.ellipse(q === 0 ? T.circleX0 : T.circleX2, y + 162, 120, 46, 0, 0, Math.PI * 2 * clamp(kMiss * 1.2)); c.stroke();
            }
            c.restore();
          });
          chip(c, T.copied, W / 2, 1300, RED, "#fff", seg(f, cu(4, 0.7) - 2, cu(4, 0.7) + 6), fit(c, T.copied, W - 120, 44, 900));
        } else if (b.shot === "names") {
          dark(c, W, H, T.namesHead, [T.namesSub]);
          notes(c, 40, 440, 490, 560, T.noNames, T.noNamesLines, 2, RED, seg(f, ln.from + 2, ln.from + 10));
          notes(c, 550, 440, 490, 560, T.withNames, T.withNamesLines, 2, GREEN, seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 6));
          chip(c, T.noNamesStat, 285, 1090, "#7f1d1d", "#fff", seg(f, ln.from + 10, ln.from + 18), 40);
          chip(c, T.withNamesStat, 795, 1090, "#14532d", "#fff", seg(f, cu(1, 0.3) + 6, cu(1, 0.3) + 14), 40);
        } else if (b.shot === "apps") {
          dark(c, W, H, T.appsHead, [T.appsSub]);
          const card = (y: number, head: string, rows: string[], k: number) => {
            if (k <= 0) return; c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 30);
            c.fillStyle = "#f8fafc"; rrect(c, 60, y, W - 120, 330, 24); c.fill();
            c.textAlign = "left"; c.font = SANS(fit(c, head, W - 200, 42, 900), 900); c.fillStyle = "#1e3a8a"; c.fillText(head, 100, y + 64);
            rows.forEach((t, q) => { c.font = SANS(fit(c, t, W - 200, 38, 800), 800); c.fillStyle = INK; c.fillText(t, 100, y + 134 + q * 62); });
            c.restore();
          };
          card(440, T.meetHead, T.meetRows, seg(f, ln.from + 2, ln.from + 10));
          card(810, T.zoomHead, T.zoomRows, seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 6));
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r, PRICES);
          const [mood, armPose] = loopOn ? (["angry", "slam"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          if (hookOn) {
            block(c, 50, T.leftLab, T.leftVal, "#4ade80");
            block(c, 560, T.rightLab, T.rightVal, "#f87171");
            chip(c, T.stake, W / 2, 486, RED, "#fff", b.prop === "hook" && !loopOn ? seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6) : 1, 44);
          }
          if (b.prop === "rule") {
            stamp(c, T.rule1, W / 2, 330, "#2563eb", seg(f, ln.from + 2, ln.from + 10), 72, -0.05);
            stamp(c, T.rule2, W / 2, 490, RED, seg(f, cu(1, 0.35) - 2, cu(1, 0.35) + 6), 56, 0.03);
            chip(c, T.builder, W / 2, 640, "#1e293b", "#f8fafc", seg(f, cu(1, 0.6), cu(1, 0.6) + 8), fit(c, T.builder, W - 120, 36, 800));
          }
          if (b.prop === "hook" && !loopOn) chip(c, T.story, W / 2, 1380, "rgba(15,23,42,0.88)", "#f8fafc", seg(f, cu(1, 0.9), cu(1, 0.9) + 8), fit(c, T.story, W - 140, 36, 800));
        }
        if (["steps", "names", "apps"].includes(b.shot)) {   // UC02's render review: keep Ravi / the phone on screen on the cards
          const iw = 250, ih = 175, ix = W - iw - 36, iy = 1360, who = b.who;
          const [cx, cy, zs] = who === "ravi" ? [495, 690, 0.45] : [800, 880, 0.6];
          c.save(); c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, ix + 5, iy + 6, iw, ih, 20); c.fill();
          rrect(c, ix, iy, iw, ih, 20); c.clip(); c.fillStyle = WALL; c.fillRect(ix, iy, iw, ih);
          c.translate(ix + iw / 2, iy + ih / 2); c.scale(zs, zs); c.translate(-cx, -cy);
          shop(c, r, PRICES);
          const [mood, armPose] = RAVI[n] ?? (["sus", "rest"] as [Mood, Arms]);
          ravi(c, mood, armPose, who === "ravi" && talking, 1, f, r); counter(c, r); phone(c, who === "ai" && talking, f, r, {});
          c.restore();
          c.save(); c.strokeStyle = "#f8fafc"; c.lineWidth = 5; rrect(c, ix, iy, iw, ih, 20); c.stroke(); c.restore();
        }
      }} />
    </>
  );
};

export const NOTES03_SCENES = { sk_notes03: StNotes };
