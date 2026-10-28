import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, stamp } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bigPhone } from "./StockCrayon";
import { bubble, laptop } from "./OwnCrayon";
import { ruleChip } from "./LocalCrayon";
import { brainFile } from "./SqueezeCrayon";

// EP41 "The biggest brain" (series/scripts/ep41_choose_model.md): the small 1.1 GB brain answers every WhatsApp order
// with the same "Sure, we'll have those ready for you within 30 minutes."; Ravi grabs the biggest brain. "Biggest for
// which job? Write the pass mark first": 19 of 20 orders right, every reply under 10 s. All three brains take his 20
// orders (the quiz, with a D "none of them"): the middle one passes (19 of 20, under 5 s); the biggest got 16 (it turned
// "2 curd 2 milk" into "2 liters of curd and 2 liters of milk") and one reply took 11 s. Keep the smallest that passes.
// Twist: a customer types Telugu words, "ara kilo panchadara...", and the middle one confirms a kilo; on Telugu-typed
// orders none of the three passes (5 · 14 · 12). "Fix the prompt, or try another brain. Then test again." The loop:
// "Then which brain do I keep?!" Numbers: our test (series/scripts/ep41_demo), every reply read by hand.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.5, x: 500, y: 720 }, hook: { z: 1.0, x: 540, y: 600 },   // hook: frame 1 and the loop's end
};
const HOLD = 12;   // frames after the last line before the slam back to frame 1
const QEND = 42;   // the quiz's count ends this many frames before the answer: a real stop (Creative 11)
const CLAP = "reel/creative09v1/clap.wav";   // a bright clap over the booms (phone speakers barely play 30-60 Hz)
const GREEN = "#16a34a", RED = "#dc2626", ORANGE = "#ea580c", WA = "#075e54";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const RAVI: Record<number, [Mood, Arms]> = {
  1: ["yell", "up"], 3: ["angry", "point"], 5: ["smug", "thumb"], 7: ["shock", "up"], 9: ["shock", "shrug"], 11: ["happy", "thumb"],
  12: ["yell", "slam"], 14: ["panic", "up"], 16: ["confused", "shrug"],
};
// the 1.1 GB's real replies (series/scripts/ep41_demo/1.5B.json, orders 3, 19, 15)
const CANNED: [string, string[]][] = [
  ["3 bath soaps and 1 detergent powder", ["Sure, we'll have those ready for", "you within 30 minutes."]],
  ["1 curd 1 bread 5 biscuits", ["Sure, we'll have those ready for", "you within 30 minutes."]],
  ["4 milk packets and 2 bread", ["Sure, we'll have those ready", "in 30 minutes."]],
];

// ---------- pieces ----------
// frame 1's WhatsApp (screen space, x 40-640, y 225-700): three orders, the same reply each time
const chatCard = (c: Ctx, k: number, ring: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const x = 40, y = 225, w = 600, h = 478;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 10, y + 12, w, h, 24); c.fill();
  c.save(); rrect(c, x, y, w, h, 24); c.clip();
  c.fillStyle = "#ece5dd"; c.fillRect(x, y, w, h);
  c.fillStyle = WA; c.fillRect(x, y, w, 56);
  c.font = SANS(30); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Ravi Kirana · WhatsApp", x + 24, y + 39);
  CANNED.forEach(([order, rep], q) => {
    const by = y + 70 + q * 136;
    c.font = SANS(25, 500); const ow = c.measureText(order).width;
    c.fillStyle = "#fff"; rrect(c, x + 16, by, ow + 32, 40, 12); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(order, x + 32, by + 28);
    const rx = x + w - 16 - 470, ry = by + 46;
    c.fillStyle = "#dcf8c6"; rrect(c, rx, ry, 470, 80, 14); c.fill();
    c.font = SANS(27, 600); c.fillStyle = INK; rep.forEach((t, i) => c.fillText(t, rx + 18, ry + 32 + i * 33));
    if (ring > 0) stroke(c, circlePts(rx + 235, ry + 40, 258, 52, 0, Math.PI * 2 * clamp(ring * 3 - q), 40), RED, 6, r, { passes: 2 });
  });
  c.restore(); c.restore();
};
// frame 1's biggest brain, held up (screen space, x 660-1040, y 240-650)
const bigCard = (c: Ctx, k: number, r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const e = easeOut(clamp(k)); c.translate(850, 440); c.rotate(0.05); c.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e); c.translate(-850, -440);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 680, 252, 360, 400, 24); c.fill();
  c.fillStyle = "#fffdf5"; rrect(c, 670, 240, 360, 400, 24); c.fill();
  brainFile(c, 850, 410, 0.95, 0, "4.7 GB", r);
  c.restore();
  tag(c, "BIGGEST", 850, 640, 56, "#fde68a", INK, -0.04, k);
};
// the pass-mark notepad (screen space), the two marks filling in
const notepad = (c: Ctx, W: number, f: number, k1: number, k2: number, r: () => number) => {
  c.save(); c.translate(W / 2, 760); c.rotate(-0.015);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -410 + 12, -330 + 14, 820, 660, 18); c.fill();
  c.fillStyle = "#fef9c3"; rrect(c, -410, -330, 820, 660, 18); c.fill();
  for (let q = 0; q < 8; q++) { c.fillStyle = "#cbd5e1"; c.fillRect(-370, -170 + q * 66, 740, 2); }
  c.fillStyle = "#475569"; for (let q = 0; q < 9; q++) { c.beginPath(); c.arc(-330 + q * 82, -330, 12, 0, 7); c.fill(); }
  c.font = SANS(66); c.fillStyle = INK; c.textAlign = "center"; c.fillText("PASS MARK", 0, -230);
  c.font = SANS(32, 600); c.fillStyle = "#854d0e"; c.fillText("written BEFORE the test", 0, -184);
  const mark = (t: string[], y: number, k: number) => {
    if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 2);
    c.font = SANS(48); c.fillStyle = "#1e3a8a"; c.textAlign = "left";
    t.forEach((s, i) => c.fillText(s, -340, y + i * 58));
    stroke(c, [[-385, y - 28], [-370, y - 8], [-350, y - 46]], GREEN, 7, r, { passes: 2 });
    c.restore();
  };
  mark(["19 of 20 orders right:", "every item + quantity"], -80, k1);
  mark(["every reply under", "10 seconds"], 120, k2);
  c.restore();
};
// the quiz card (screen space), held in the gap after the line; the count inside the card; then a stop (QEND)
const quizCard = (c: Ctx, W: number, H: number, f: number, endL: number, next: number) => {
  const k = easeOut(seg(f, endL + 6, endL + 12)) * (1 - seg(f, next - 10, next - 2));
  if (k <= 0) return;
  c.save(); c.globalAlpha = 0.55 * k; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalAlpha = k; c.translate(W / 2, 800); c.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -530, 940, 1000, 30); c.fill();
  c.font = SANS(46); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("YOUR CALL", 0, -456);
  c.font = SANS(52); c.fillStyle = INK; c.fillText("Which brain passes", 0, -380); c.fillText("Ravi's pass mark?", 0, -318);
  [["A", "1.1 GB", "the fast one"], ["B", "2.1 GB", ""], ["C", "4.7 GB", "the biggest"], ["D", "none of them", ""]].forEach(([l, t, s2], i) => {
    const yy = -270 + i * 140;
    c.fillStyle = "#e0e7ff"; rrect(c, -400, yy, 800, 120, 22); c.fill();
    c.font = SANS(60); c.fillStyle = INK; c.textAlign = "left"; c.fillText(l, -360, yy + 80);
    c.font = SANS(58); c.fillText(t, -250, yy + (s2 ? 66 : 80));
    if (s2) { c.font = SANS(32, 500); c.fillStyle = "#475569"; c.fillText(s2, -250, yy + 104); }
  });
  c.font = SANS(42, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("comment A, B, C or D", 0, 330);
  const t = f - (next - QEND - 72), q = 3 - Math.floor(t / 24);
  if (t >= 0 && q >= 1) {
    const pop = 1 + 0.25 * (1 - clamp((t % 24) / 6));
    c.save(); c.translate(360, -476); c.scale(pop, pop);
    c.beginPath(); c.arc(0, 0, 56, 0, 7); c.fillStyle = q === 1 ? COL.red : "#2563eb"; c.fill();
    c.font = SANS(76); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(String(q), 0, 27); c.restore();
  }
  c.restore();
};
// a dark panel with a title (inserts); titles sit below the banner (y 215+)
const panel = (c: Ctx, W: number, H: number, bg: string, title: string) => {
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (title) { c.font = SANS(54); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 300); }
};
// one brain's row on a test card: the size, then its result (or "?"), a pass/fail mark
const brainRow = (c: Ctx, y: number, gb: string, val: string, note: string, col: string, bg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, 130, y - 78, 820, 136, 22); c.fill();
  c.font = SANS(50); c.fillStyle = INK; c.textAlign = "left"; c.fillText(gb, 160, y + 4);
  c.font = SANS(58); c.fillStyle = col; c.textAlign = "right"; c.fillText(val, 920, y - 6);
  if (note) { c.font = SANS(32, 600); c.fillText(note, 920, y + 40); }
  c.restore();
};
// a WhatsApp exchange on the big phone (screen space): the customer's order, the shop's reply
const waPair = (c: Ctx, y: number, order: string, reply: string[], k1: number, k2: number) => {
  if (k1 > 0) {
    c.save(); c.globalAlpha = clamp(k1 * 3);
    c.font = SANS(40, 500); const ow = Math.min(760, c.measureText(order).width);
    c.fillStyle = "#fff"; rrect(c, 130, y, ow + 60, 76, 18); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(order, 160, y + 52);
    c.restore();
  }
  if (k2 > 0) {
    c.save(); c.globalAlpha = clamp(k2 * 3);
    const h = 40 + reply.length * 54;
    c.fillStyle = "#dcf8c6"; rrect(c, 290, y + 110, 660, h, 18); c.fill();
    c.font = SANS(44, 600); c.fillStyle = INK; c.textAlign = "left";
    reply.forEach((t, i) => c.fillText(t, 320, y + 166 + i * 54));
    c.restore();
  }
};

// ---------- the scene ----------
const StChoose: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const te = s.data.handle === "@ai_maastaaru_telugu";   // the Telugu mix keeps a softer build (EP40 render review 2)
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    const insert = !["wide", "ravi", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") {
      sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.45} />,
        <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.25} />);
      [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={6 + q * 6} src="audio/sfx_pop.wav" vol={0.2} />));
      sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.45) - 4} src="audio/gag_boing.wav" vol={0.2} />);   // the big brain pops up
    }
    if (b.prop === "pass") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.5) - 4} src="audio/sfx_snap.wav" vol={0.28} />);
    if (b.prop === "marks") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.16} />, <Sfx key={k("e")} at={cue(i, 1, 0.5) + 2} src="audio/gag_ding.wav" vol={0.16} />);
    if (b.prop === "quiz") {   // the count's ticks and riser stop on its "1", then a real stop
      [0, 1, 2, 3, 4, 5].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={nx - QEND - 72 + q * 12} src="audio/sfx_tick.wav" vol={q % 2 ? 0.45 : 0.9} />));
      sfx.push(<Sfx key={k("r")} at={nx - QEND - 36} src="reel/sfx_riser.wav" vol={0.45} />);
    }
    if (b.prop === "reveal") sfx.push(<Sfx key={k("n")} at={Math.max(0, at - 2)} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("m")} at={Math.max(0, at - 2)} src={CLAP} vol={0.6} />,
      <Sfx key={k("o")} at={end + 1} src="audio/sfx_success.wav" vol={0.22} />);
    if (b.prop === "curd") sfx.push(<Sfx key={k("z")} at={at + 4} src="reel/sfx_buzz.wav" vol={0.18} />, <Sfx key={k("h")} at={cue(i, 1, 0.5) - 10} src="audio/gag_bonk.wav" vol={0.25} />);
    if (b.prop === "cups") sfx.push(<Sfx key={k("q")} at={at + 2} src="audio/gag_boing.wav" vol={0.22} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 15)} src={CLAP} vol={0.45} />, <Sfx key={k("h")} at={Math.max(0, at - 16)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "done") sfx.push(<Sfx key={k("d")} at={end + 4} src="audio/gag_ding.wav" vol={0.3} />);   // the next order arrives
    if (b.prop === "sugar") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.3) - 6} src="reel/sfx_buzz.wav" vol={0.22} />);
    if (b.prop === "none") sfx.push(<Sfx key={k("g")} at={cue(i, 1, 0.5) - 6} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_snap.wav" vol={0.25} />);
    if (b.prop === "loop") {   // a rise in the gap into his last line, then the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 37)} src="reel/sfx_riser.wav" vol={0.3} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.6} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.4} />);
    }
  });
  // the last scene builds: hats and claps on the bed's grid from its cut to his last line, ramping up
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("none") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.36 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4140 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const next = ls[i + 1] ? ls[i + 1].from : s.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;   // the loop's last beat: frame 1 again
        if (b.shot === "pass") {
          // ---------- the pass mark, written first ----------
          panel(c, W, H, "#1e293b", "");
          const marks = b.prop === "marks";
          notepad(c, W, f, marks ? seg(f, ln.from, ln.from + 8) : 0, marks ? seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6) : 0, r);
          c.save(); c.globalAlpha = marks ? 1 : seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          c.font = SANS(30, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center";
          c.fillText("OpenAI's model guide: \"Choose acceptance criteria", W / 2, 1210); c.fillText("before comparing models\"", W / 2, 1250);
          c.restore();
        } else if (b.shot === "test") {
          // ---------- our test: the same 20 orders for all three brains ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, 50);
          bigPhone(c, W, H, "our test: Ravi's 20 orders", r, f);
          const c1 = cu(1, 0.45);
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 378);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("the same 20 orders · offline · every reply read", W / 2, 420);
          c.font = SANS(30, 700); c.fillStyle = "#1e3a8a"; c.fillText("pass: 19 of 20 right · every reply under 10 s", W / 2, 470);
          const setup = b.prop === "test", rev = b.prop === "reveal", curd = b.prop === "curd";
          const k0 = setup ? seg(f, c1 - 2, c1 + 8) : 1;
          // rows: 2.1 GB first (it passed), then the biggest, then the small one
          const kB = rev ? seg(f, ln.from + 2, ln.from + 8) : curd ? 1 : 0;
          const kC = curd ? seg(f, ln.from, ln.from + 6) : 0, kC2 = curd ? seg(f, c1 - 2, c1 + 6) : 0, kA = curd ? seg(f, endL - 14, endL - 6) : 0;
          brainRow(c, 590, "2.1 GB", kB > 0 ? "19 of 20 ✓" : "?", kB > 0 ? "slowest 4.5 s · PASS" : "", kB > 0 ? GREEN : "#94a3b8", kB > 0 ? "#dcfce7" : "#f1f5f9", Math.max(k0, kB));
          brainRow(c, 760, "4.7 GB", kC > 0 ? "16 of 20 ✗" : "?", kC2 > 0 ? "slowest 11.1 s ✗" : "", kC > 0 ? RED : "#94a3b8", kC > 0 ? "#fee2e2" : "#f1f5f9", Math.max(k0, kC));
          brainRow(c, 930, "1.1 GB", kA > 0 ? "8 of 20 ✗" : "?", kA > 0 ? "skips the items" : "", kA > 0 ? RED : "#94a3b8", kA > 0 ? "#fee2e2" : "#f1f5f9", Math.max(k0, kA));
          if (rev) tag(c, "B ✓", 860, 470 + 120, 80, "#dcfce7", "#14532d", 0.06, seg(f, ln.from + 8, ln.from + 14));
          if (curd) {   // the biggest brain's real reply to "2 curd 2 milk" (series/scripts/ep41_demo/7B.json, order 7)
            const kq = seg(f, ln.from + 4, ln.from + 12);
            if (kq > 0) {
              c.save(); c.globalAlpha = clamp(kq * 3);
              c.fillStyle = "#fffdf5"; rrect(c, 130, 1040, 820, 250, 22); c.fill();
              c.font = SANS(34, 600); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("order: \"2 curd 2 milk\"   4.7 GB:", 160, 1094);
              c.font = SANS(42, 600); c.fillStyle = INK; c.fillText("\"Sure, we'll deliver 2 liters of", 160, 1160); c.fillText("curd and 2 liters of milk...\"", 160, 1214);
              c.restore();
              if (f >= ln.from + 10) stroke(c, circlePts(548, 1188, 300, 60, 0, Math.PI * 2 * seg(f, ln.from + 10, ln.from + 20), 44), RED, 7, r, { passes: 2 });
            }
          }
          c.font = SANS(26, 600); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("Qwen2.5 1.5B · 3B · 7B, 4-bit, this laptop · EP34's 20 orders", W / 2, 1396);
          c.restore();
        } else if (b.shot === "chat") {
          // ---------- a customer types Telugu words ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, 50);
          bigPhone(c, W, H, "WhatsApp · 2.1 GB brain", r, f);
          c.fillStyle = "#ece5dd"; rrect(c, 110, 330, W - 220, 1100, 30); c.fill();
          waPair(c, 400, "ara kilo panchadara and okati tea podi", ["Kilo panchadara confirmed.", "Tea podi confirmed."], seg(f, ln.from - 8, ln.from - 2), seg(f, ln.from + 2, ln.from + 8));
          if (f >= ln.from + 6) stroke(c, circlePts(255, 446, 115, 42, 0, Math.PI * 2 * seg(f, ln.from + 6, ln.from + 14), 36), GREEN, 6, r, { passes: 2 });   // "ara kilo"
          if (f >= ln.from + 10) stroke(c, circlePts(410, 566, 110, 42, 0, Math.PI * 2 * seg(f, ln.from + 10, ln.from + 18), 36), RED, 6, r, { passes: 2 });   // "Kilo"
          tag(c, "ara kilo = ½ kg", W / 2, 880, 70, "#dcfce7", "#14532d", -0.03, seg(f, ln.from + 8, ln.from + 14));
          tag(c, "it confirmed 1 kg ✗", W / 2, 1010, 70, "#fee2e2", "#991b1b", 0.02, seg(f, cu(1, 0.3), cu(1, 0.3) + 8));
          c.font = SANS(28, 600); c.fillStyle = "#334155"; c.textAlign = "center"; c.fillText("our test's real reply (Telugu-typed order 4)", W / 2, 1396);
          c.restore();
        } else if (b.shot === "telugu") {
          // ---------- Telugu-typed orders: a new job, a new test ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(0, 50);
          bigPhone(c, W, H, "our test: Telugu-typed orders", r, f);
          const c1 = cu(1, 0.45);
          c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("TELUGU-TYPED ORDERS", W / 2, 378);
          c.font = SANS(30, 600); c.fillStyle = "#475569"; c.fillText("the same 20 orders in Telugu words · pass: 19", W / 2, 420);
          ([["1.1 GB", "5 of 20", ln.from], ["2.1 GB", "14 of 20", ln.from + 4], ["4.7 GB", "12 of 20", ln.from + 8]] as [string, string, number][]).forEach(([gb, v, t0], q) =>
            brainRow(c, 540 + q * 160, gb, v + " ✗", "", RED, "#fee2e2", seg(f, t0, t0 + 6)));
          if (f >= c1 - 2) stamp(c, "NONE PASSES", W / 2, 1060, 96, RED, seg(f, c1 - 2, c1 + 6), r, -0.05);
          const ke = seg(f, c1 + 10, c1 + 18);
          if (ke > 0) {
            c.save(); c.globalAlpha = clamp(ke * 3);
            c.fillStyle = "#fffdf5"; rrect(c, 130, 1150, 820, 200, 22); c.fill();
            c.font = SANS(34, 600); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("4.7 GB, order \"2 perugu 2 paalu\":", 160, 1206);
            c.font = SANS(48); c.fillStyle = RED; c.fillText("\"2 eggs and 2 bananas\"", 160, 1290);
            c.restore();
          }
          c.restore();
        } else {
          // ---------- the shop ----------
          const hookOn = b.prop === "hook" || loopOn;
          const sh = hookOn || b.prop === "loop" ? SHOTS.hook : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) || (b.prop === "sugar" && p < 0.1) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 840 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = loopOn ? (["yell", "up"] as [Mood, Arms]) : RAVI[n] ?? ["angry", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && talking, hookOn ? 1 : p, f, r);
          counter(c, r);
          laptop(c, 250, 1000, 0.72, n >= 11 && !loopOn ? "2.1 GB brain ✓" : "1.1 GB brain", r, {});
          phone(c, b.who === "ai" && talking, f, r, {});
          if (b.prop === "cups") {   // two small curd cups, one in each hand
            [[215, 790], [755, 790]].forEach(([x, y]) => {
              c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(x - 44, y - 50); c.lineTo(x + 44, y - 50); c.lineTo(x + 34, y + 30); c.lineTo(x - 34, y + 30); c.closePath(); c.fill();
              c.fillStyle = "#38bdf8"; c.fillRect(x - 46, y - 62, 92, 16);
              c.font = SANS(22); c.fillStyle = INK; c.textAlign = "center"; c.fillText("CURD", x, y - 4); c.fillText("500 g", x, y + 20);
            });
          }
          c.restore();
          // screen-space props
          if (hookOn) {
            const kk = loopOn ? seg(f, slam, slam + 4) : 1;
            chatCard(c, kk, loopOn ? 1 : seg(f, 4, 26), r);
            bigCard(c, loopOn ? kk : seg(f, cu(1, 0.45) - 6, cu(1, 0.45) + 2), r);
            tag(c, "WHICH items??", 340, 728, 50, "#fee2e2", "#991b1b", -0.03, loopOn ? kk : seg(f, 24, 30));
          }
          if (b.prop === "quiz") bubble(c, 330, 560, "biggest wins!", 84, seg(p, 0.35, 0.5), COL.yellow);
          if (b.prop === "notbig") bubble(c, 330, 560, "not the biggest?!", 80, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "cups") bubble(c, 540, 480, "litres?!", 96, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "eggs") bubble(c, 330, 560, "perugu = eggs?!", 80, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "rule") {
            ruleChip(c, W, 880, "CHOOSE A BRAIN", [
              ["1  write the pass mark first", "#fef3c7", INK],
              ["2  one test for every brain", "#e2e8f0", INK],
              ["3  keep the smallest that passes", "#dcfce7", "#14532d"],
            ], [seg(p, 0.02, 0.12), seg(p, 0.15, 0.25), seg(p, 0.3, 0.4)]);
            c.save(); c.globalAlpha = seg(p, 0.55, 0.7);
            c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, 70, 1330, W - 140, 130, 24); c.fill();
            c.font = SANS(36, 600); c.fillStyle = "#fde68a"; c.textAlign = "center";
            c.fillText("a different job, a different winner:", W / 2, 1384); c.fillText("on bills, the 4.7 GB is best (18 of 20)", W / 2, 1432);
            c.restore();
          }
          if (b.prop === "fix") {
            ruleChip(c, W, 880, "NONE PASSES?", [
              ["change the prompt", "#e2e8f0", INK],
              ["or try another brain", "#e2e8f0", INK],
              ["then test again", "#fef3c7", INK],
            ], [seg(p, 0.02, 0.12), seg(p, 0.25, 0.35), seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6)]);
          }
        }
        if (b.prop === "quiz" && f > endL + 6) quizCard(c, W, H, f, endL, next);
      }} />
    </>
  );
};

export const CHOOSE_SCENES = { sk_choose: StChoose };
