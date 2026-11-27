import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";

// UC04 "1 Video, 9 of 10" (series/scripts/uc04_up_next.md): Ravi opens the trading video a friend sent; Up next fills with
// "get rich" trading. Our test (series/scripts/uc04_demo, a small recommender on our computer built on the idea in
// Google's 2016 YouTube paper): Up next while that video plays 9/10 trading; autoplay 10 in a row 8/10; his home page
// (the average of his whole history) after those 10: 0/10 (2/10 if recent videos count more); Up next while a
// scam-warning video plays: 9/10 trading tips. The map is drawn simplified (our 384 numbers overlap in 2-D).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Vid = { title: string; topic: string };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.4, x: 480, y: 740 }, ai: { z: 1.8, x: 760, y: 860 }, hook: { z: 1.0, x: 700, y: 820 },
};
const HOLD = 16;
const PRICES = [["Tomatoes", "₹40"], ["Onions", "₹30"], ["Dal", "₹120"], ["Rice", "₹62"]];
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["shock", "phone"], 3: ["confused", "shrug"], 5: ["panic", "up"], 7: ["sus", "fold"], 9: ["happy", "point"], 10: ["smug", "phone"],
};
export const TOPIC: Record<string, [string, string]> = {   // colour, label on the thumbnail
  trading: [RED, "₹"], devotional: ["#f59e0b", "ॐ"], travel: ["#0ea5e9", "TRIP"], cricket: [GREEN, "CRICKET"], comedy: ["#a855f7", "LOL"],
  news: ["#64748b", "NEWS"], savings: ["#ca8a04", "GOLD"], cooking: ["#ea580c", "FOOD"], farming: ["#65a30d", "FARM"], study: ["#2563eb", "STUDY"],
  phone: ["#475569", "TIPS"], health: ["#14b8a6", "HEALTH"], warning: ["#7f1d1d", "!"],
};

const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 20) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
const clip1 = (c: Ctx, t: string, max: number) => {   // one line, cut with "..." to fit
  if (c.measureText(t).width <= max) return t;
  let s = t; while (s.length > 4 && c.measureText(s + "...").width > max) s = s.slice(0, -1);
  return s.trimEnd() + "...";
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
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 9; rrect(c, -w / 2, -size * 0.85, w, size * 1.35, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.3); c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 56); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.fillStyle = "#cbd5e1"; sub.forEach((t, i) => { c.font = SANS(fit(c, t, W - 80, 34, 700, 26), 700); c.fillText(t, W / 2, 376 + i * 42); });
};
const block = (c: Ctx, x: number, small: string, big: string, col: string) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 470, 200, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, 210, 470, 200, 22); c.fill();
  const f1 = fit(c, small, 430, 34, 900); c.font = SANS(f1, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(small, x + 235, 262);
  const fs = fit(c, big, 430, 104); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(big, x + 235, 385);
};
// a video thumbnail: the topic colour and its mark
const thumb = (c: Ctx, x: number, y: number, w: number, h: number, topic: string) => {
  c.save(); thumb0(c, x, y, w, h, topic); c.restore();
};
const thumb0 = (c: Ctx, x: number, y: number, w: number, h: number, topic: string) => {
  const [col, lab] = TOPIC[topic] ?? ["#94a3b8", "?"];
  c.fillStyle = col; rrect(c, x, y, w, h, 10); c.fill();
  if (topic === "trading") {   // a ₹ and an arrow up
    c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = Math.max(3, h * 0.06); c.beginPath();
    c.moveTo(x + w * 0.52, y + h * 0.82); c.lineTo(x + w * 0.68, y + h * 0.58); c.lineTo(x + w * 0.78, y + h * 0.68); c.lineTo(x + w * 0.92, y + h * 0.2); c.stroke();
    c.font = SANS(h * 0.62, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("₹", x + w * 0.3, y + h * 0.72);
  } else {
    c.font = SANS(fit(c, lab, w - 10, h * (lab.length > 2 ? 0.34 : 0.6), 900), 900); c.fillStyle = "#fff"; c.textAlign = "center";
    c.fillText(lab, x + w / 2, y + h * (lab.length > 2 ? 0.62 : 0.72));
  }
};
// the made-up video app: what's playing, and the Up next list under it
const app = (c: Ctx, x: number, y: number, w: number, h: number, playing: string, playTopic: string, list: Vid[], k: number, head: string, f: number) => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.35)"; rrect(c, x + 8, y + 10, w, h, 34); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, y, w, h, 34); c.fill();
  const ix = x + 14, iw = w - 28; let yy = y + 18;
  c.fillStyle = "#f8fafc"; rrect(c, ix, yy, iw, h - 36, 22); c.fill();
  // the player
  const ph = 190; c.fillStyle = playTopic === "trading" ? "#450a0a" : "#1f2937"; rrect(c, ix, yy, iw, ph, 22); c.fill();
  thumb(c, ix + 16, yy + 18, 130, 90, playTopic);
  c.textAlign = "left"; c.fillStyle = "#fff";
  const words = playing.split(" "); let l1 = "", l2 = ""; c.font = SANS(28, 800);
  words.forEach((wd) => { const t = l1 ? l1 + " " + wd : wd; if (!l2 && c.measureText(t).width < iw - 190) l1 = t; else l2 = l2 ? l2 + " " + wd : wd; });
  c.fillText(l1, ix + 160, yy + 52); c.fillText(clip1(c, l2, iw - 190), ix + 160, yy + 90);
  c.fillStyle = "#475569"; c.fillRect(ix + 16, yy + ph - 34, iw - 32, 8); c.fillStyle = RED; c.fillRect(ix + 16, yy + ph - 34, (iw - 32) * (0.15 + 0.5 * ((f % 300) / 300)), 8);
  c.beginPath(); c.arc(ix + 16 + (iw - 32) * (0.15 + 0.5 * ((f % 300) / 300)), yy + ph - 30, 11, 0, 7); c.fill();
  yy += ph + 44;
  c.font = SANS(32, 900); c.fillStyle = INK; c.fillText(head, ix + 18, yy); yy += 18;
  const rh = (y + h - 30 - yy) / list.length;
  list.forEach((v, q) => {
    const kq = clamp(k * list.length - q); if (kq <= 0) return;
    c.save(); c.globalAlpha = clamp(kq * 2); c.translate((1 - easeOut(kq)) * 40, 0);
    const ry = yy + q * rh;
    if (v.topic === "trading") { c.fillStyle = "#fee2e2"; rrect(c, ix + 6, ry + 3, iw - 12, rh - 6, 10); c.fill(); }
    thumb(c, ix + 14, ry + 7, rh * 1.5, rh - 14, v.topic);
    c.font = SANS(Math.min(28, rh * 0.42), 800); c.fillStyle = v.topic === "trading" ? "#7f1d1d" : INK; c.textAlign = "left";
    c.fillText(clip1(c, v.title, iw - rh * 1.5 - 44), ix + 28 + rh * 1.5, ry + rh * 0.62);
    c.restore();
  });
  c.restore();
};
// the map (simplified): islands of videos; trading sits together
const ISLES: [string, string, number, number][] = [
  ["CRICKET", "cricket", 230, 610], ["COMEDY", "comedy", 560, 580], ["PRAYER", "devotional", 870, 640], ["FOOD", "cooking", 250, 870],
  ["NEWS", "news", 600, 830], ["TRAVEL", "travel", 880, 930], ["SAVINGS", "savings", 790, 1170], ["TRADING", "trading", 360, 1130],
];
const dots = (cx: number, cy: number, seed: number, n = 12, rad = 92) => {
  const r = rng(seed); const out: [number, number][] = [];
  for (let q = 0; q < n; q++) { const a = r() * Math.PI * 2, d = rad * Math.sqrt(0.15 + 0.85 * r()); out.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8]); }
  return out;
};

const StUp: React.FC<SP> = ({ s }) => {
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
    const insert = !["wide", "ravi", "ai", "hook", "rule"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("d")} at={2} src="audio/sfx_chime.wav" vol={0.35} />, <Sfx key={k("b")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "map") {
      sfx.push(<Sfx key={k("t")} at={cue(i, 1, 0.2)} src="audio/sfx_pop.wav" vol={0.3} />);
      for (let j = 0; j < 4; j++) sfx.push(<Sfx key={k("l" + j)} at={cue(i, 2, 0.45) + j * 8} src="audio/sfx_tick.wav" vol={0.14} />);
      sfx.push(<Sfx key={k("n")} at={cue(i, 2, 0.45) + 36} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.45} />);
    }
    if (b.prop === "chain") {
      const a0 = at + 2, a1 = cue(i, 1, 0.8) - 4;
      for (let j = 0; j < 10; j += 2) sfx.push(<Sfx key={k("c" + j)} at={Math.round(a0 + (a1 - a0) * j / 10)} src="audio/sfx_tick.wav" vol={0.13} />);
      sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.1)} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("z")} at={cue(i, 1, 0.1) + 5} src="reel/sfx_buzz.wav" vol={0.3} />);
    }
    if (b.prop === "home") sfx.push(<Sfx key={k("p")} at={at + 10} src="reel/sfx_buzz.wav" vol={0.25} />, <Sfx key={k("h")} at={cue(i, 1, 0.45)} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("ok")} at={cue(i, 1, 0.45)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "avg") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.1)} src="audio/sfx_whoosh.wav" vol={0.25} />, <Sfx key={k("h")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("h")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />, <Sfx key={k("s")} at={at + 14} src="audio/sfx_snap.wav" vol={0.45} />, <Sfx key={k("c")} at={cue(i, 1, 0.1)} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("t")} at={cue(i, 1, 0.4)} src={CLAP} vol={0.4} />);
    if (b.prop === "safe") sfx.push(<Sfx key={k("q")} at={Math.max(0, at + 4)} src="reel/sfx_riser.wav" vol={0.35} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.0)} src="reel/sfx_boom.wav" vol={te ? 0.7 : 0.8} />, <Sfx key={k("b")} at={cue(i, 1, 0.1)} src="reel/sfx_buzz.wav" vol={0.3} />, <Sfx key={k("s")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(6504 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "map") {
          dark(c, W, H, T.mapHead, T.mapSub);
          const kT = seg(f, cu(1, 0.2) - 4, cu(1, 0.2) + 8), kL = seg(f, cu(2, 0.45), cu(2, 0.45) + 34);
          ISLES.forEach(([lab, topic, cx, cy], j) => {
            const k = seg(f, ln.from + 2 + j * 4, ln.from + 10 + j * 4); if (k <= 0) return;
            const tr = topic === "trading", grow = tr ? 1 + 0.25 * easeOut(kT) : 1;
            c.save(); c.globalAlpha = clamp(k * 2) * (tr || kT <= 0 ? 1 : 1 - 0.45 * kT);
            if (tr && kT > 0) { c.fillStyle = `rgba(220,38,38,${0.22 * kT})`; c.beginPath(); c.ellipse(cx, cy, 150 * grow, 120 * grow, 0, 0, 7); c.fill(); }
            const col = TOPIC[topic][0];
            dots(cx, cy, 77 + j, 12, tr ? 80 : 92).forEach(([x, y]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); });
            c.font = SANS(tr ? 44 : 36, 900); c.fillStyle = tr ? "#fca5a5" : "#e2e8f0"; c.textAlign = "center"; c.fillText(lab, cx, cy - 112);
            c.restore();
          });
          if (kT > 0 && kL < 1) chip(c, T.close, W / 2, 1300, RED, "#fff", kT, 40);
          // the friend's video, and lines to the ten closest (nine trading, one prayer)
          const [, , tx, ty] = ISLES[7];
          const near = dots(tx, ty, 77 + 7, 12, 80);
          const star = near[0];
          if (seg(f, cu(2, 0.1), cu(2, 0.1) + 6) > 0) {
            const pulse = 1 + 0.2 * Math.sin(f / 3);
            c.fillStyle = "#fde68a"; c.beginPath(); c.arc(star[0], star[1], 26 * pulse, 0, 7); c.fill();
            c.fillStyle = INK; c.beginPath(); c.moveTo(star[0] - 8, star[1] - 12); c.lineTo(star[0] + 13, star[1]); c.lineTo(star[0] - 8, star[1] + 12); c.closePath(); c.fill();
          }
          const tgts: [number, number][] = [...near.slice(1, 10), dots(ISLES[2][2], ISLES[2][3], 77 + 2, 12, 92)[3]];
          tgts.forEach(([x, y], q) => {
            const kq = clamp(kL * 10 - q); if (kq <= 0) return;
            c.strokeStyle = q < 9 ? "#fca5a5" : "#fde68a"; c.lineWidth = 5; c.beginPath(); c.moveTo(star[0], star[1]);
            c.lineTo(star[0] + (x - star[0]) * easeOut(kq), star[1] + (y - star[1]) * easeOut(kq)); c.stroke();
          });
          if (kL >= 1) chip(c, T.upNine, W / 2, 1300, "#fde68a", INK, seg(f, cu(2, 0.45) + 34, cu(2, 0.45) + 42), 46);
        } else if (b.shot === "chain") {
          dark(c, W, H, T.chainHead, T.chainSub);
          const a0 = ln.from + 2, a1 = cu(1, 0.8) - 4;
          (T.chain as Vid[]).forEach((v, q) => {
            const k = seg(f, a0 + (a1 - a0) * q / 10, a0 + (a1 - a0) * q / 10 + 6); if (k <= 0) return;
            const col = q % 2, row = Math.floor(q / 2), x = 40 + col * 510, y = 470 + row * 166;
            c.save(); c.globalAlpha = clamp(k * 2); c.translate(0, (1 - easeOut(k)) * 24);
            c.fillStyle = v.topic === "trading" ? "#fee2e2" : "#f8fafc"; rrect(c, x, y, 490, 150, 18); c.fill();
            c.font = SANS(34, 900); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText(String(q + 1), x + 16, y + 52);
            thumb(c, x + 62, y + 22, 140, 106, v.topic);
            c.fillStyle = v.topic === "trading" ? "#7f1d1d" : INK; c.font = SANS(28, 800);
            const ws = v.title.split(" "); let l1 = "", l2 = "";
            ws.forEach((wd) => { const t = l1 ? l1 + " " + wd : wd; if (!l2 && c.measureText(t).width < 260) l1 = t; else l2 = l2 ? l2 + " " + wd : wd; });
            c.fillText(l1, x + 216, y + 62); c.fillText(clip1(c, l2, 260), x + 216, y + 100);
            c.restore();
          });
          stamp(c, T.chainStat, W / 2, 860, RED, seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 6), 100, -0.05);
        } else if (b.shot === "home") {
          dark(c, W, H, T.homeHead, T.homeSub);
          const col = (x: number, head: string, sub: string, list: Vid[], k: number, stat: string, statCol: string, kS: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.font = SANS(52, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(head, x + 240, 492);
            c.font = SANS(fit(c, sub, 470, 32, 700), 700); c.fillStyle = "#fde68a"; c.fillText(sub, x + 240, 534);
            list.forEach((v, q) => {
              const kq = clamp(k * 14 - q); if (kq <= 0) return;
              const y = 560 + q * 66;
              c.fillStyle = v.topic === "trading" ? "#fee2e2" : "#f8fafc"; rrect(c, x, y, 480, 58, 10); c.fill();
              thumb(c, x + 6, y + 5, 70, 48, v.topic);
              c.font = SANS(22, 800); c.fillStyle = v.topic === "trading" ? "#7f1d1d" : INK; c.textAlign = "left"; c.fillText(clip1(c, v.title, 384), x + 86, y + 38);
            });
            c.restore();
            stamp(c, stat, x + 240, 1270, statCol, kS, 84, -0.04);
          };
          col(40, T.upCol, T.upColSub, T.upList, seg(f, ln.from + 2, ln.from + 22), T.upStat, RED, seg(f, ln.from + 22, ln.from + 30));
          col(560, T.homeCol, T.homeColSub, T.home, seg(f, ln.from + 18, cu(1, 0.4)), T.homeStat, GREEN, seg(f, cu(1, 0.45) - 2, cu(1, 0.45) + 6));
        } else if (b.shot === "avg") {
          dark(c, W, H, T.avgHead, T.avgSub);
          const hist = T.history as string[];
          const kH = seg(f, ln.from + 2, ln.from + 14);
          c.font = SANS(36, 900); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText(T.histLab, W / 2, 470);
          const lit: Record<string, number> = {};   // topic -> the frame its word is said
          (ln.words ?? []).forEach((w) => { const key = w.w.toLowerCase().replace(/[^a-z\u0C00-\u0C7F]/g, ""); const tp = (T.avgWords as Record<string, string>)[key]; if (tp && lit[tp] === undefined) lit[tp] = w.from; });
          let li = 0, ri = 0;
          const pos = hist.map((tp) => {   // his own videos on the left, the trading ones on the right
            if (tp === "trading") { const q = ri++; return [640 + (q % 3) * 118, 510 + Math.floor(q / 3) * 118]; }
            const q = li++; return [60 + (q % 4) * 118, 510 + Math.floor(q / 4) * 118];
          });
          const ax = pos.reduce((a2, p2) => a2 + p2[0], 0) / pos.length + 45, ay = 1090;
          const pull = easeOut(seg(f, cu(1, 0.05) - 10, cu(1, 0.05) + 10));
          hist.forEach((tp, q) => {
            const kq = clamp(kH * hist.length - q); if (kq <= 0) return;
            const [x, y] = pos[q];
            if (pull > 0) { c.save(); c.globalAlpha = 0.5 * pull; c.strokeStyle = TOPIC[tp]?.[0] ?? "#94a3b8"; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 45, y + 90); c.lineTo(x + 45 + (ax - x - 45) * pull, y + 90 + (ay - y - 90) * pull); c.stroke(); c.restore(); }
            const on = lit[tp] !== undefined && f >= lit[tp] - 2;
            const z = on ? 1 + 0.18 * clamp((f - lit[tp] + 2) / 4) : 1;
            if (on) { c.save(); c.fillStyle = "rgba(253,230,138,0.85)"; rrect(c, x + 45 - 52 * z, y + 45 - 52 * z, 104 * z, 104 * z, 14); c.fill(); c.restore(); }
            c.globalAlpha = clamp(kq * 2); thumb(c, x + 45 - 45 * z, y + 45 - 45 * z, 90 * z, 90 * z, tp); c.globalAlpha = 1;
          });
          if (pull >= 1) {
            c.fillStyle = "#fde68a"; c.beginPath(); c.arc(ax, ay, 70, 0, 7); c.fill();
            c.font = SANS(46, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(T.youLab, ax, ay + 16);
          }
          stamp(c, T.avgStat, W / 2, 1250, "#2563eb", seg(f, cu(1, 0.45) - 2, cu(1, 0.45) + 6), 62, -0.03);
          const kN = seg(f, cu(1, 0.6), cu(1, 0.6) + 8);
          if (kN > 0) {   // two lines, inside the margins (final check: one long chip ran off both edges)
            c.save(); c.globalAlpha = clamp(kN * 3);
            c.fillStyle = "#1e293b"; rrect(c, 70, 1318, W - 140, 104, 16); c.fill();
            (T.avgNote as string[]).forEach((ln2, q) => { c.font = SANS(fit(c, ln2, W - 190, 34, 800), 800); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(ln2, W / 2, 1360 + q * 44); });
            c.restore();
          }
        } else if (b.shot === "rulecard") {
          dark(c, W, H, T.ruleHead, []);
          // A: the autoplay switch, ON -> OFF
          const kA = seg(f, ln.from + 2, ln.from + 10), off = seg(f, ln.from + 12, ln.from + 18);
          if (kA > 0) {
            c.save(); c.globalAlpha = clamp(kA * 3);
            c.fillStyle = "#f8fafc"; rrect(c, 60, 420, W - 120, 330, 28); c.fill();
            c.font = SANS(70, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(T.ruleA, 110, 540);
            const tx = 700, ty = 470, tw = 250, th = 110;
            c.fillStyle = off > 0.5 ? "#94a3b8" : RED; rrect(c, tx, ty, tw, th, th / 2); c.fill();
            const kx = tx + th / 2 + (tw - th) * (1 - off);
            c.fillStyle = "#fff"; c.beginPath(); c.arc(kx, ty + th / 2, th / 2 - 10, 0, 7); c.fill();
            c.font = SANS(40, 900); c.fillStyle = off > 0.5 ? "#475569" : RED; c.textAlign = "center"; c.fillText(off > 0.5 ? "OFF" : "ON", tx + tw / 2, ty + th + 56);
            c.font = SANS(fit(c, T.ruleASub, W - 220, 36, 700), 700); c.fillStyle = "#334155"; c.textAlign = "left"; c.fillText(T.ruleASub, 110, 710);
            c.restore();
          }
          // B: the ⋮ menu, "Not interested" tapped
          const kB = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          if (kB > 0) {
            c.save(); c.globalAlpha = clamp(kB * 3);
            c.fillStyle = "#f8fafc"; rrect(c, 60, 790, W - 120, 520, 28); c.fill();
            c.font = SANS(fit(c, T.ruleB, W - 220, 70, 900), 900); c.fillStyle = RED; c.textAlign = "left"; c.fillText(T.ruleB, 110, 900);
            ["Save to Watch later", "Share", "Not interested"].forEach((t, q) => {
              const y = 950 + q * 92, hi = q === 2;
              c.fillStyle = hi ? "#fee2e2" : "#e2e8f0"; rrect(c, 110, y, W - 220, 78, 14); c.fill();
              c.font = SANS(40, hi ? 900 : 700); c.fillStyle = hi ? "#7f1d1d" : "#334155"; c.fillText(t, 140, y + 54);
            });
            const tap = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
            if (tap > 0) { c.strokeStyle = "#2563eb"; c.lineWidth = 8; c.beginPath(); c.arc(W - 220, 950 + 2 * 92 + 39, 30 + 40 * tap, 0, 7); c.stroke(); }
            c.font = SANS(fit(c, T.ruleBSub, W - 220, 34, 700), 700); c.fillStyle = "#334155"; c.fillText(T.ruleBSub, 110, 1280);
            c.restore();
          }
        } else {
          // ---------- the shop ----------
          const twistOn = b.shot === "twist" && !loopOn;
          const hookOn = b.prop === "hook" || loopOn || twistOn;
          const sh = hookOn ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r, PRICES);
          const [mood, armPose] = loopOn || twistOn ? (["shock", "phone"] as [Mood, Arms]) : RAVI[n] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          if (hookOn) {
            app(c, 520, 445, 530, 860, twistOn ? T.warning : T.friend, twistOn ? "warning" : "trading", twistOn ? T.warnList : T.upList, 1, T.upHead, f);
            block(c, 50, twistOn ? T.twLeftLab : T.leftLab, twistOn ? T.twLeftVal : T.leftVal, twistOn ? "#fbbf24" : "#60a5fa");
            block(c, 560, twistOn ? T.twRightLab : T.rightLab, twistOn ? T.twRightVal : T.rightVal, "#f87171");
            if (twistOn) chip(c, T.ourTest, W / 2, 1372, "rgba(15,23,42,0.92)", "#f8fafc", 1, fit(c, T.ourTest, W - 120, 32, 800));
            if (!twistOn) chip(c, T.story, 285, 470, "rgba(15,23,42,0.9)", "#f8fafc", b.prop === "hook" && !loopOn ? seg(f, 8, 16) : 1, 28);
          }
          if (b.prop === "rule") {
            stamp(c, T.rule1, W / 2, 300, "#2563eb", seg(f, ln.from + 2, ln.from + 10), 52, -0.02);
            stamp(c, T.rule2, W / 2, 470, RED, seg(f, ln.from + 8, ln.from + 16), 84, 0.02);
            stamp(c, T.rule3, W / 2, 650, "#111827", seg(f, cu(1, 0.3) - 2, cu(1, 0.3) + 6), 76, -0.02);
          }
          if (b.prop === "safe") chip(c, T.warnChip, W / 2, 330, "#7f1d1d", "#fff", seg(f, cu(1, 0.2), cu(1, 0.2) + 8), fit(c, T.warnChip, W - 120, 44, 800));
        }
      }} />
    </>
  );
};

export const UP04_SCENES = { sk_up04: StUp };
