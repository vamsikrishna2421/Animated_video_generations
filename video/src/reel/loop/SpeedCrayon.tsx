import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { bubble, laptop } from "./OwnCrayon";
import { gbSack, ramCounter, slotX, ruleChip, row } from "./LocalCrayon";
import { gpuCard } from "./GpuCrayon";

// EP39 "The 17-second reply" (series/scripts/ep39_17_second_reply.md): a WhatsApp customer cancels while the shop AI is
// still "typing…" (17 s). Two clocks: it reads the order (4 s: the wait before the first word, latency), then writes one
// token (a word or a piece of one) at a time, and for every token it lifts all five bags of its brain (EP38): 4 a second
// on the laptop. Online AIs on big graphics cards write about 200 a second, but every token costs money, the reply's 4-8x
// the message's. Rescue: "Reply in 2 short lines." (35 tokens, 11.7 s). Twist: a month of old chat read before every
// reply: the quiz, then "Ninety-two seconds" before the first word; he cancels again, the loop. Numbers: our test
// (series/scripts/ep39_demo), the OpenAI and Google price lists, Artificial Analysis.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.5, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 600 },   // hook: frame 1 and the loop's end
};
const HOLD = 36;   // frames the 1:32 is held after "Ninety-two seconds" before the slam (render review: at least 1.2 s)
const CLAP = "reel/creative09v1/clap.wav";   // bright clap over the booms (phone speakers barely play 30-60 Hz)
const GREEN = "#16a34a", RED = "#dc2626", LILAC = "#c4b5fd", ORANGE = "#f97316", GREY = "#94a3b8";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
// our test (series/scripts/ep39_demo/7B.json): seconds to the first token, whole reply
const T = { read: 4.26, whole: 17.62, histRead: 91.83 };
const TOK_S = 4.27;   // writing speed, tokens a second
// the 7B's reply, split by its own tokenizer (58 tokens; "↵" = a line break, "␣" = a space token)
const TOKENS = ["Sure", ",", " Anna", "!", " Here", "'s", " your", " order", ":↵↵", "-", "␣", "2", " kg", " rice", "↵", "-", "␣", "1", " litre",
  " sun", "flower", " oil", "↵", "-", "␣", "6", " eggs", "↵", "-", "␣", "1", " packet", " of", " tea", " powder", "↵↵", "Your", " order", " will",
  " be", " delivered", " to", " flat", "␣", "3", "0", "2", " within", "␣", "3", "0", " minutes", ".", " Thanks", " for", " choosing", " us", "!"];
const CHIP = ["#ddd6fe", "#bbf7d0", "#fed7aa", "#fecaca", "#bae6fd"];
const ORDER = ["Anna, please send 2 kg rice, 1 litre", "sunflower oil, 6 eggs and 1 packet", "of tea powder to flat 302."];
const SHORT = ["Sure, 2 kg rice, 1 litre sunflower oil,", "6 eggs, and 1 packet of tea powder.", "Delivery will be within 30 minutes."];   // word for word
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "up"], 3: ["shock", "up"], 5: ["angry", "point"], 7: ["smug", "point"], 9: ["shock", "shrug"], 11: ["angry", "point"],
  13: ["happy", "phone"], 15: ["shock", "up"],
};

// ---------- pieces ----------
// a stopwatch (screen space); `t` seconds
const stopwatch = (c: Ctx, x: number, y: number, R: number, t: number, r: () => number, hot = true, hide = false) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "rgba(4,8,40,0.35)"; c.beginPath(); c.arc(8, 10, R, 0, 7); c.fill();
  c.fillStyle = INK; rrect(c, -R * 0.16, -R - R * 0.3, R * 0.32, R * 0.24, 6); c.fill();
  c.beginPath(); c.arc(0, 0, R, 0, 7); c.fillStyle = hot ? RED : INK; c.fill();
  c.beginPath(); c.arc(0, 0, R * 0.86, 0, 7); c.fillStyle = "#fffdf5"; c.fill();
  for (let q = 0; q < 12; q++) { const a = (q / 12) * Math.PI * 2; c.fillStyle = INK; c.fillRect(Math.sin(a) * R * 0.74 - 3, -Math.cos(a) * R * 0.74 - 3, 6, 6); }
  const a = ((t % 60) / 60) * Math.PI * 2;
  stroke(c, [[0, 0], [Math.sin(a) * R * 0.7, -Math.cos(a) * R * 0.7]], RED, Math.max(5, R * 0.06), r, { passes: 1 });
  const tt = Math.floor(t + 0.2), m = Math.floor(tt / 60), sec = tt % 60;   // 91.83 reads 1:32, 17.62 reads 0:17
  c.font = SANS(Math.round(R * 0.5)); c.fillStyle = INK; c.textAlign = "center";
  c.fillText(hide ? "?:??" : `${m}:${String(sec).padStart(2, "0")}`, 0, R * 0.5);
  c.restore();
};
// frame 1's WhatsApp card (screen space, y 225-745): his order, "Shop AI is typing…" with the stopwatch, "Never mind…"
const waCard = (c: Ctx, f: number, t: number, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 90, y = 225, w = 860, h = 520;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 28); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, x, y, w, h, 28); c.fill();
  c.fillStyle = "#075e54"; rrect(c, x, y, w, 80, 28); c.fill(); c.fillRect(x, y + 50, w, 30);
  c.font = SANS(40); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Suresh", x + 34, y + 54);
  c.font = SANS(28, 500); c.fillStyle = "#d1fae5"; c.fillText("flat 302", x + 200, y + 54);
  c.fillStyle = "#fff"; rrect(c, x + 24, y + 96, 600, 150, 20); c.fill();
  c.font = SANS(32, 500); c.fillStyle = INK; ORDER.forEach((t2, i) => c.fillText(t2, x + 46, y + 142 + i * 42));
  c.fillStyle = "#dcf8c6"; rrect(c, x + 150, y + 266, 470, 84, 22); c.fill();
  c.font = SANS(36, 600); c.fillStyle = "#166534"; c.fillText("Shop AI is typing", x + 176, y + 321);
  [0, 1, 2].forEach((q) => {   // the typing dots
    const on = Math.floor(f / 6) % 3 === q;
    c.beginPath(); c.arc(x + 502 + q * 24, y + 311, on ? 9 : 6, 0, 7); c.fillStyle = on ? "#166534" : "#86efac"; c.fill();
  });
  c.fillStyle = "#fff"; rrect(c, x + 24, y + 370, 640, 124, 20); c.fill();   // he gives up
  c.font = SANS(36); c.fillStyle = "#991b1b"; c.fillText("Never mind. I'll order", x + 48, y + 420);
  c.fillText("from the other shop.", x + 48, y + 470);
  c.restore();
  stopwatch(c, 830, 470, 104, t, r);
};
// one long bar for a reply's time: grey READ, then orange WRITE (screen space); scale = px per second
const timeBar = (c: Ctx, y: number, read: number, write: number, scale: number, kr: number, kw: number) => {
  const x0 = 90, h = 130, rw = read * scale * clamp(kr), ww = write * scale * clamp(kw);
  c.fillStyle = "rgba(255,255,255,0.12)"; rrect(c, x0, y, 860, h, 24); c.fill();
  if (rw > 2) { c.fillStyle = GREY; rrect(c, x0, y, rw, h, 24); c.fill(); }
  if (ww > 2) { c.fillStyle = ORANGE; rrect(c, x0 + rw, y, ww, h, 24); c.fill(); }
  c.font = SANS(46); c.textAlign = "center";
  if (rw > 150) { c.fillStyle = INK; c.fillText("READ", x0 + rw / 2, y + 84); }
  if (ww > 170) { c.fillStyle = "#fff"; c.fillText("WRITE", x0 + rw + ww / 2, y + 84); }
};
// the reply as token chips (screen space); `n` chips shown; `hl` 0..1 rings "sun|flower" and "3|0|2"
const tokenChips = (c: Ctx, y0: number, n: number, hl: number, r: () => number) => {
  let x = 100, y = y0;
  const fs = 42, rowH = 82, spots: Record<string, [number, number, number, number][]> = { sun: [], num: [] };
  c.font = SANS(fs, 600);
  TOKENS.forEach((t, i) => {
    const brk = t.includes("↵"), txt = t.replace(/^ /, "");
    const w = Math.max(30, c.measureText(txt).width) + 22 + (t.startsWith(" ") ? 10 : 0);
    if (x + w > 950) { x = 100; y += rowH; }
    if (i < n) {
      c.fillStyle = CHIP[i % CHIP.length]; rrect(c, x, y, w, 66, 14); c.fill();
      c.fillStyle = INK; c.textAlign = "left"; c.fillText(txt, x + 11 + (t.startsWith(" ") ? 10 : 0), y + 48);
    }
    if (i === 19 || i === 20) spots.sun.push([x, y, w, 66]);
    if (i >= 44 && i <= 46) spots.num.push([x, y, w, 66]);
    x += w + 8;
    if (brk) { x = 100; y += rowH; }
  });
  if (hl > 0) Object.values(spots).forEach((sp) => {
    if (!sp.length) return;
    const xa = sp[0][0] - 10, xb = sp[sp.length - 1][0] + sp[sp.length - 1][2] + 10, ya = sp[0][1] + 33;
    stroke(c, circlePts((xa + xb) / 2, ya, (xb - xa) / 2 + 14, 58), RED, 7, r, { passes: 2, alpha: clamp(hl * 2) });
  });
  return y + rowH;
};
// the quiz card (screen space), held in the gap after the line; its 3-2-1 ends as the card leaves
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 820); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -420, 940, 800, 30); c.fill();
  c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -340);
  c.font = SANS(58); c.fillStyle = INK; c.fillText("How long before its first word?", 0, -250);
  [["A", "4 seconds", "(same as before)"], ["B", "30 seconds", ""], ["C", "over a minute", ""]].forEach(([l, t, s2], i) => {
    const yy = -190 + i * 150;
    c.fillStyle = "#e0e7ff"; rrect(c, -400, yy, 800, 128, 22); c.fill();
    c.font = SANS(62); c.fillStyle = INK; c.textAlign = "left"; c.fillText(l, -360, yy + 84);
    c.font = SANS(52, 600); c.fillText(t, -250, yy + (s2 ? 62 : 82));
    if (s2) { c.font = SANS(36, 500); c.fillStyle = "#475569"; c.fillText(s2, -250, yy + 110); }
  });
  c.font = SANS(42, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A, B or C", 0, 320);
  const t = f - (next - 76), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(0, 470); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fillStyle = q === 1 ? COL.red : "#2563eb"; c.fill();
    c.font = SANS(78); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 28); c.restore();
  }
  c.restore();
};
// a dark panel with a title (inserts)
const panel = (c: Ctx, W: number, H: number, bg: string, title: string, sub = "") => {
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.font = SANS(54); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 300);
  if (sub) { c.font = SANS(32, 500); c.fillStyle = "#cbd5e1"; c.fillText(sub, W / 2, 352); }
};
// a long chat being scrolled (screen space): a month of earlier orders
const chatScroll = (c: Ctx, x: number, y: number, w: number, h: number, f: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 26); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, x, y, w, h, 26); c.fill();
  c.save(); rrect(c, x, y, w, h, 26); c.clip();
  const items = ["2 kg rice", "1 litre oil", "6 eggs", "tea powder", "1 kg sugar", "bread", "milk", "curd", "dal 1 kg", "soap", "salt", "biscuits"];
  const off = (f * 9) % 120;
  for (let q = -1; q < Math.ceil(h / 60) + 2; q++) {
    const day = 30 - ((q + Math.floor(f * 9 / 120)) % 30 + 30) % 30;
    const yy = y + 20 + q * 60 - off + 120;
    const mine = q % 2 === 0;
    c.fillStyle = mine ? "#fff" : "#dcf8c6"; rrect(c, mine ? x + 16 : x + 60, yy, w - 76, 48, 12); c.fill();
    c.font = SANS(24, 500); c.fillStyle = INK; c.textAlign = "left";
    c.fillText(mine ? `day ${day}: please send ${items[day % 12]}…` : `Sure! ${items[day % 12]} will reach…`, (mine ? x + 16 : x + 60) + 14, yy + 32);
  }
  c.restore(); c.restore();
};

// ---------- the scene ----------
const StSpeed: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "ravi", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") {
      sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={at + 1} src={CLAP} vol={0.55} />,
        <Sfx key={k("z")} at={at + 1} src="reel/sfx_buzz.wav" vol={0.45} />);
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 14 + q * 30} src="audio/sfx_tick.wav" vol={0.5} />));   // the stopwatch
    }
    if (b.prop === "clock") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "tokens") [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={at + 4 + q * 9} src="audio/sfx_pop.wav" vol={0.16} />));
    if (b.prop === "bags") for (let q = 0; at + 6 + q * 30 / TOK_S < nx - 4; q++) sfx.push(<Sfx key={k("b" + q)} at={at + 6 + Math.round(q * 30 / TOK_S)} src="audio/gag_bonk.wav" vol={0.14} />);   // one per token: 4 a second
    if (b.prop === "cloud") sfx.push(<Sfx key={k("c")} at={cue(i, 1, 0.5) + 2} src="audio/sfx_chaching.wav" vol={0.32} />);
    if (b.prop === "quiz") {   // render review: nothing silent before "Ninety-two": the ticks and riser stop on the count's "1"
      [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - 76 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - 66} src="reel/sfx_riser.wav" vol={0.45} />);
    }
    if (b.prop === "price") sfx.push(<Sfx key={k("c")} at={cue(i, 1, 0.5)} src="audio/sfx_chaching.wav" vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 7)} src={CLAP} vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 8)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) + 2} src="audio/sfx_success.wav" vol={0.32} />);
    if (b.prop === "history") sfx.push(<Sfx key={k("s")} at={at + 4} src="audio/sfx_whoosh.wav" vol={0.25} />, <Sfx key={k("r")} at={nx - 34} src="reel/sfx_riser.wav" vol={0.4} />);
    if (b.prop === "wait") for (let q = 0; q < 8; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * 12} src="audio/sfx_tick.wav" vol={0.35} />);
    if (b.prop === "loop") {   // a hit just after "Ninety-two seconds" (on silence), the 1:32 held, then the chat slams back in = frame 1
      const end = l.from + l.frames, slam = end + HOLD;
      sfx.push(<Sfx key={k("n")} at={end + 1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("m")} at={end + 1} src={CLAP} vol={0.55} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.5} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.6} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.5} />);
    }
  });
  const iWait = first("wait");
  // the last scene builds: hats and claps on the bed's 88 BPM grid from its cut (on the beat) to the count's "1", ramping up
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("history") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => 0.14 + 0.26 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9900 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;   // the loop's last beat: frame 1 again
        if ((b.shot === "clock" || b.shot === "wait") && !loopOn) {
          // ---------- the two clocks: READ, then WRITE ----------
          const waitShot = b.shot === "wait";
          panel(c, W, H, "#0f172a", waitShot ? "AFTER A MONTH OF OLD CHAT" : "ONE REPLY, TWO CLOCKS", "our test: the 4.7 GB brain on a 4-core laptop");
          if (!waitShot) {
            const c1 = cu(1, 0.5);
            const kr = seg(f, ln.from + 2, c1 - 2), kw = seg(f, c1, endL);
            const tt = kr < 1 ? T.read * kr : T.read + (T.whole - T.read) * kw;
            stopwatch(c, W / 2, 600, 170, tt, r, false);
            timeBar(c, 900, T.read, T.whole - T.read, 860 / T.whole, kr, kw);
            if (kr > 0) {
              tag(c, "1 · read the order: 4 s", 330, 1130, 52, "#e2e8f0", INK, -0.02, seg(f, ln.from + 2, ln.from + 10));
              c.font = SANS(32, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText("LATENCY = the wait before the first word", 90, 870);
            }
            if (kw > 0) tag(c, "2 · write the reply: 13 s", 620, 1250, 52, "#ffedd5", "#9a3412", 0.02, seg(f, c1, c1 + 8));
          } else {
            // from the start of the wait beat to "Ninety-two": the grey READ bar (the wait before the first word) grows from
            // 4 s to 92 s, the bar rescales to fit; the stopwatch times the first word only
            const a0 = ls[iWait].from, aEnd = ls[iWait + 2] ? ls[iWait + 2].from + 4 : a0 + 120;
            const grow = seg(f, a0 + 6, aEnd);
            const read = T.read + (T.histRead - T.read) * grow;
            const reveal = b.prop === "loop";
            stopwatch(c, W / 2, 600, 170, read, r, true, !reveal);   // render review: the running clock gave the quiz away
            c.font = SANS(40); c.fillStyle = "#fecaca"; c.textAlign = "center"; c.fillText("before the first word", W / 2, 830);
            timeBar(c, 900, read, 0, 860 / Math.max(T.whole, read), 1, 0);   // fills the width past 17.6 s: long, but no number
            if (b.prop === "wait") tag(c, "30 old orders: 1,788 tokens, 20× the order", W / 2, 1130, 44, "#e2e8f0", INK, -0.02, seg(f, ln.from + 2, ln.from + 10));
            if (b.prop === "quiz") tag(c, "still reading…", W / 2, 1130, 56, "#e2e8f0", INK, 0.02, seg(f, ln.from, ln.from + 6));
            if (reveal) {
              tag(c, "C ✓  92 s", W / 2, 1150, 90, "#fee2e2", "#991b1b", -0.02, seg(f, ln.from, ln.from + 5));
              tag(c, "first word: 4 s → 92 s", W / 2, 1290, 56, "#fef3c7", INK, 0.01, seg(f, ln.from + 8, ln.from + 14));
              c.save(); c.globalAlpha = seg(f, ln.from + 14, ln.from + 20);
              c.font = SANS(36); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("LATENCY: the wait before the first word", W / 2, 1380);
              c.restore();
              if (f >= endL + 4) {   // the fix, held with the 1:32 before the slam
                const kf = seg(f, endL + 4, endL + 10);
                c.save(); c.globalAlpha = clamp(kf * 2);
                c.fillStyle = "#dcfce7"; rrect(c, 110, 1406, 860, 84, 20); c.fill();
                c.font = SANS(36); c.fillStyle = "#14532d"; c.textAlign = "center"; c.fillText("fix: a 2-line note about him, not the month", W / 2, 1460);
                c.restore();
              }
            }
          }
        } else if (b.shot === "tokens") {
          // ---------- the reply, token by token ----------
          panel(c, W, H, "#1e293b", "THE REPLY, ONE TOKEN AT A TIME");
          const c1 = cu(1, 0.5);
          const shown = Math.min(TOKENS.length, Math.floor(TOKENS.length * seg(f, ln.from + 2, ln.from + ln.frames * 0.8)));
          const yEnd = tokenChips(c, 380, shown, seg(f, c1 + 2, c1 + 12), r);
          c.font = SANS(44); c.fillStyle = "#fde68a"; c.textAlign = "right"; c.fillText(`${shown} tokens`, 940, 370);
          if (f >= c1 - 2) tag(c, "1 token = a word, or a piece of one", W / 2, Math.min(1300, yEnd + 50), 56, "#fef3c7", INK, -0.02, seg(f, c1 - 2, c1 + 6));
          if (f >= c1 + 6) tag(c, "sun·flower = 2 tokens", 290, Math.min(1430, yEnd + 160), 64, "#fecaca", "#7f1d1d", -0.03, seg(f, c1 + 6, c1 + 12));
          if (f >= c1 + 12) tag(c, "3·0·2 = 3 tokens", 770, Math.min(1430, yEnd + 160), 64, "#fecaca", "#7f1d1d", 0.03, seg(f, c1 + 12, c1 + 18));
        } else if (b.shot === "bags") {
          // ---------- every token lifts every bag (EP38's counter) ----------
          c.fillStyle = "#3f2a16"; c.fillRect(0, 0, W, H);
          const cx = W / 2, cy = 1180, c1 = cu(1, 0.5), per = 30 / TOK_S;
          const tk = Math.max(0, (f - ln.from - 6) / per), ph = tk % 1, done = Math.floor(tk);
          const hop = f >= ln.from + 6 ? Math.sin(Math.min(1, ph * 2) * Math.PI) : 0;
          ramCounter(c, cx, cy, 8);
          for (let q = 0; q < 5; q++) {
            if (hop > 0.2) { c.save(); c.globalAlpha = 0.5 * hop; c.fillStyle = "#fde047"; c.beginPath(); c.arc(slotX(cx, q), cy - 46 - hop * 40, 56, 0, 7); c.fill(); c.restore(); }
            gbSack(c, slotX(cx, q), cy - 8 - hop * 46, LILAC, r, 0, q === 4 ? 0.7 : 1);
          }
          // the reply above, growing by one token per lift
          const txt = TOKENS.slice(0, Math.min(TOKENS.length, done)).join("").replace(/↵+/g, " ").replace(/␣/g, " ");
          c.fillStyle = "#dcf8c6"; rrect(c, 90, 330, 860, 270, 26); c.fill();
          c.font = SANS(42, 600); c.fillStyle = INK; c.textAlign = "left";
          const words = txt.split(" "); let lineT = "", yy = 400;
          words.forEach((w) => { const tr = lineT ? `${lineT} ${w}` : w; if (c.measureText(tr).width > 800) { c.fillText(lineT, 120, yy); yy += 56; lineT = w; } else lineT = tr; });
          if (yy < 600) c.fillText(lineT + (Math.floor(f / 8) % 2 ? "▍" : ""), 120, yy);
          tag(c, "every token: lift all 5 bags", W / 2, 760, 58, "#fef9c3", INK, -0.02, seg(f, ln.from, ln.from + 8));
          if (f >= c1 - 2) {
            tag(c, "4 tokens a second", W / 2, 900, 80, "#dcfce7", "#14532d", 0.02, seg(f, c1 - 2, c1 + 6));
            c.font = SANS(32, 600); c.fillStyle = "#fed7aa"; c.textAlign = "center"; c.fillText("our test: 4.3 a second on this laptop", W / 2, 1420);
          }
        } else if (b.shot === "cloud") {
          // ---------- the online AI: big graphics cards, a bill for every token ----------
          panel(c, W, H, "#0b1220", "ONLINE AI · big graphics cards");
          const c1 = cu(1, 0.5);
          c.fillStyle = "#1f2937"; rrect(c, 150, 400, 780, 700, 30); c.fill();
          [0, 1, 2].forEach((q) => gpuCard(c, 540, 520 + q * 230, 0.95, f * 3, r));
          tag(c, "about 200 tokens a second", W / 2, 1200, 72, "#dcfce7", "#14532d", -0.02, seg(f, ln.from + 2, ln.from + 10));
          c.font = SANS(30, 600); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText("Gemini 2.5 Flash · Artificial Analysis, Oct 2026", W / 2, 1262);
          if (f >= c1 - 2) {
            const kk = seg(f, c1 - 2, c1 + 6), billed = Math.floor(clamp((f - c1) / 24) * 58);
            c.save(); c.globalAlpha = clamp(kk * 2);
            c.fillStyle = "#fffdf5"; rrect(c, 230, 1300, 620, 150, 22); c.fill();
            c.font = SANS(46); c.fillStyle = RED; c.textAlign = "center"; c.fillText("online: every token costs", W / 2, 1365);
            c.font = SANS(36, 600); c.fillStyle = INK; c.fillText(`tokens billed: ${billed}`, W / 2, 1422);
            c.restore();
          }
        } else if (b.shot === "price") {
          // ---------- both cost; the reply's tokens 4-8x the message's (online) ----------
          panel(c, W, H, "#fffdf5", "");
          const c1 = cu(1, 0.5);
          tag(c, "online, you pay for BOTH", W / 2, 330, 64, "#e0e7ff", "#3730a3", -0.02, seg(f, ln.from, ln.from + 6));
          const kk = seg(f, c1 - 4, c1 + 4);
          c.save(); c.globalAlpha = clamp(seg(f, ln.from + 4, ln.from + 10) * 2);
          c.fillStyle = "#0f172a"; rrect(c, 90, 420, 860, 900, 30); c.fill();
          c.font = SANS(40); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("price of ONE token", W / 2, 492);
          c.fillStyle = "#1e293b"; rrect(c, 120, 530, 800, 150, 20); c.fill();
          c.font = SANS(46); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText("a token you send", 150, 622);
          c.font = SANS(90); c.textAlign = "right"; c.fillText("1×", 890, 640);
          c.restore();
          if (kk > 0) {
            c.save(); c.globalAlpha = clamp(kk * 2);
            [["a token it writes", "Gemini 2.5 Flash", "8×", "$0.30 → $2.50"], ["a token it writes", "GPT-4.1 mini", "4×", "$0.40 → $1.60"]].forEach(([a2, m, x2, pr], q) => {
              const yy = 720 + q * 200, kq = seg(f, c1 - 2 + q * 8, c1 + 6 + q * 8);
              if (kq <= 0) return;
              c.save(); c.globalAlpha = clamp(kq * 2);
              c.fillStyle = "#431407"; rrect(c, 120, yy, 800, 170, 20); c.fill();
              c.font = SANS(46); c.fillStyle = "#fed7aa"; c.textAlign = "left"; c.fillText(a2, 150, yy + 70);
              c.font = SANS(30, 600); c.fillStyle = "#fdba74"; c.fillText(m, 150, yy + 116);
              c.font = SANS(24, 500); c.fillStyle = "#cbd5e1"; c.fillText(`per million: ${pr}`, 150, yy + 152);
              c.font = SANS(120); c.fillStyle = "#fb923c"; c.textAlign = "right"; c.fillText(x2, 890, yy + 128);
              c.restore();
            });
            c.restore();
          }
          if (f >= c1 + 20) tag(c, "1,000 replies: about ₹10-16", W / 2, 1240, 56, "#dcfce7", "#14532d", -0.02, seg(f, c1 + 20, c1 + 28));
          c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.textAlign = "center"; c.fillText("OpenAI and Google price lists, Oct 2026", W / 2, 1380);
        } else if (b.shot === "screen") {
          // ---------- our test: short replies ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          bigPhone(c, W, H, "our test: short replies", r, f);
          const c1 = cu(1, 0.5);
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 378);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("the 4.7 GB brain · 4-core laptop · offline", W / 2, 420);
          row(c, 580, "before", "58 tokens · 17.6 s", RED, seg(f, ln.from, ln.from + 8), "#fee2e2");
          row(c, 760, "2 short lines", "35 tokens · 11.7 s", GREEN, seg(f, c1 - 2, c1 + 6), "#dcfce7");
          if (f >= c1 + 14) {   // render review: this line was too small to read
            c.save(); c.globalAlpha = seg(f, c1 + 14, c1 + 22);
            c.fillStyle = "#fef3c7"; rrect(c, 130, 900, 820, 200, 24); c.fill();
            c.font = SANS(52); c.fillStyle = INK; c.textAlign = "center";
            c.fillText("still slow on a laptop", W / 2, 978);
            c.fillText("online: about 1 s", W / 2, 1056);
            c.restore();
          }
          if (f >= c1 + 24) {
            c.save(); c.globalAlpha = seg(f, c1 + 24, c1 + 32);
            c.font = SANS(32, 600); c.fillStyle = "#334155"; c.textAlign = "center";
            c.fillText("a small 1.1 GB brain: 2.2 s,", W / 2, 1170);
            c.fillText("but it dropped the quantities", W / 2, 1214);
            c.restore();
          }
          c.font = SANS(26, 600); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("the 4.7 GB brain = Qwen2.5 7B, squeezed (EP37) · offline", W / 2, 1430);
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
          const [mood, armPose] = loopOn ? (["yell", "up"] as [Mood, Arms]) : RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          laptop(c, 250, 1000, 0.72, "4.7 GB brain ✓", r, {});
          phone(c, b.who === "ai" && talking, f, r, {});
          c.restore();
          // screen-space props
          if (hookOn) waCard(c, f, 17.4, loopOn ? seg(f, slam, slam + 4) : 1, r);   // frame 1, and the loop's last beat
          if (b.prop === "reply") {   // the 13-second reply, word for word
            const kk = seg(p, 0.02, 0.15);
            if (kk > 0) {
              c.save(); c.globalAlpha = clamp(kk * 2);
              c.fillStyle = "#dcf8c6"; rrect(c, 140, 240, 800, 420, 26); c.fill();
              c.font = SANS(34, 500); c.fillStyle = INK; c.textAlign = "left";
              ["Sure, Anna! Here's your order:", "- 2 kg rice", "- 1 litre sunflower oil", "- 6 eggs", "- 1 packet of tea powder",
                "Your order will be delivered to flat 302", "within 30 minutes. Thanks for choosing us!"].forEach((t2, q) => c.fillText(t2, 170, 300 + q * 50));
              c.restore();
              tag(c, "13 s to write", 760, 700, 56, "#ffedd5", "#9a3412", 0.04, seg(p, 0.2, 0.32));
            }
          }
          if (b.prop === "faster") bubble(c, 330, 560, "write faster!", 84, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "online") bubble(c, 330, 560, "online AI: 1 second!", 70, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "money") bubble(c, 330, 560, "my message or its reply?", 62, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "rule") {
            ruleChip(c, W, 980, "ASK FOR SHORT REPLIES", [
              ["type: Reply in 2 short lines.", "#dcfce7", "#14532d"],
              ["fewer tokens: faster here", "#e2e8f0", INK],
              ["and a smaller bill online", "#fef3c7", INK],
            ], [seg(p, 0.05, 0.15), seg(p, 0.35, 0.45), seg(p, 0.55, 0.65)]);
          }
          if (b.prop === "history") {
            chatScroll(c, 520, 240, 430, 640, f, seg(p, 0.02, 0.12));
            tag(c, "30 old orders = 1,788 tokens (20× the order)", 560, 960, 44, "#fef3c7", INK, -0.02, seg(p, 0.3, 0.42));
          }
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
      }} />
    </>
  );
};

export const SPEED_SCENES = { sk_speed: StSpeed };
