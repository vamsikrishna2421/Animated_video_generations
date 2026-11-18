import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg } from "./TutorialCrayon";

// EP56 "Can a Free Voice Assistant Understand Telugu? Build a Voice Assistant" (series/scripts/ep56_voice_assistant.md):
// a screen tutorial, one narrator. Frame 1 is a question the viewer already has (Bujji's EP53 48h read: the one variable),
// with the customer's Telugu question and what the free ears wrote (Hindi letters). Ears (Whisper) -> brain (EP55's bot +
// order server) -> mouth (a computer voice), one code line each. Our test: English 7/10, Telugu small ears 0/10, the AI
// made up "12345" 8 times in 50, bigger ears translating to English 5/10, ~35 s an answer on our computer.
// Texts from the spec (data.t), copied from series/scripts/ep56_demo/voice.json.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const GREEN = "#4ade80";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Color Emoji", sans-serif`;   // the customer's Telugu and the Hindi-letter transcript (fonts-noto-core)
const MONO = (s: number, w = 700) => `${w} ${s}px "DejaVu Sans Mono", Menlo, monospace`;
const big = (c: Ctx, t: string, size: number) => fit(c, t, 1000, size, 800);

const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = RED, rot = -0.06) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = clamp(k * 3);
  c.font = SANS(fit(c, t, 960, 64, 900), 900); const w = c.measureText(t).width + 60;
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2, -60, w, 94, 14); c.fill();
  c.strokeStyle = col; c.lineWidth = 8; rrect(c, -w / 2, -60, w, 94, 14); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, 10); c.restore();
};
// code on a dark card, typed in line by line; `hi` boxes one piece once it is typed
const codeCard = (c: Ctx, y: number, code: string[], k: number, label: string, hi?: string, kHi = 0, size = 34) => {
  c.save();
  c.font = MONO(size, 700);
  const lines = code.flatMap((l) => (c.measureText(l).width > 940 ? wrap(c, l, 940) : [l]));
  const lh = size * 1.5, h = 70 + lines.length * lh + 26;
  c.fillStyle = "#1e1e2e"; rrect(c, 40, y, 1000, h, 18); c.fill();
  c.fillStyle = "#313244"; rrect(c, 40, y, 1000, 50, 18); c.fill();
  c.font = SANS(26, 800); c.fillStyle = "#cdd6f4"; c.textAlign = "left"; c.fillText(label, 70, y + 34);
  const total = lines.reduce((a, l) => a + l.length, 0); let left = Math.floor(total * clamp(k));
  lines.forEach((l, i) => {
    const t = l.slice(0, Math.max(0, left)); left -= l.length;
    const yy = y + 100 + i * lh;
    c.font = MONO(size, 700);
    if (hi && kHi > 0 && t.length === l.length && l.includes(hi)) {
      const x0 = 70 + c.measureText(l.slice(0, l.indexOf(hi))).width, w = c.measureText(hi).width;
      c.save(); c.globalAlpha = clamp(kHi * 3); c.fillStyle = "rgba(74,222,128,0.28)"; rrect(c, x0 - 8, yy - size, w + 16, size * 1.35, 8); c.fill();
      c.strokeStyle = GREEN; c.lineWidth = 4; rrect(c, x0 - 8, yy - size, w + 16, size * 1.35, 8); c.stroke(); c.restore();
    }
    c.fillStyle = "#f9e2af"; c.fillText(t, 70, yy);
  });
  c.restore();
  return y + h;
};
// a trace box (what went back and forth); `hi` paints one piece in `hiCol`
const traceBox = (c: Ctx, y: number, title: string, lines: string[], col: string, k: number, hi?: string, hiCol = "#f87171") => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = MONO(32, 700); const ws = lines.flatMap((l) => wrap(c, l, 900));
  const h = 60 + ws.length * 46 + 18;
  c.fillStyle = "#0f172a"; rrect(c, 40, y, 1000, h, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 4; rrect(c, 40, y, 1000, h, 16); c.stroke();
  c.font = SANS(30, 900); c.fillStyle = col; c.textAlign = "left"; c.fillText(title, 64, y + 40);
  c.font = MONO(32, 700);
  ws.forEach((t, i) => {
    const yy = y + 92 + i * 46;
    c.fillStyle = "#e2e8f0"; c.fillText(t, 64, yy);
    if (hi && t.includes(hi)) { c.fillStyle = hiCol; c.fillText(hi, 64 + c.measureText(t.slice(0, t.indexOf(hi))).width, yy); }
  });
  c.restore();
  return y + h;
};
const arrowDown = (c: Ctx, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.strokeStyle = "#94a3b8"; c.fillStyle = "#94a3b8"; c.lineWidth = 6;
  c.beginPath(); c.moveTo(540, y); c.lineTo(540, y + 34); c.stroke();
  c.beginPath(); c.moveTo(522, y + 30); c.lineTo(558, y + 30); c.lineTo(540, y + 50); c.closePath(); c.fill(); c.restore();
};
const bigNum = (c: Ctx, t: string, x: number, y: number, col: string, k: number, size = 150, sub = "") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.textAlign = "center";
  c.font = SANS(size, 900); c.fillStyle = col; c.fillText(t, x, y);
  if (sub) { c.font = SANS(fit(c, sub, 480, 38, 800), 800); c.fillStyle = "#cbd5e1"; c.fillText(sub, x, y + 56); }
  c.restore();
};

// three boxes: ears -> brain -> mouth
const pieces = (c: Ctx, y: number, k: number[], hot = -1) => {
  const P: [string, string, string][] = [["EARS", "speech -> text", "#1e3a8a"], ["BRAIN", "EP55's bot + server", "#14532d"], ["MOUTH", "text -> speech", "#713f12"]];
  P.forEach(([t, sub, col], q) => {
    const kq = k[q] ?? 1; if (kq <= 0) return;
    const x = 50 + q * 340;
    c.save(); c.globalAlpha = clamp(kq * 3) * (hot >= 0 && hot !== q ? 0.45 : 1);
    c.fillStyle = col; rrect(c, x, y, 300, 200, 22); c.fill();
    if (hot === q) { c.strokeStyle = "#fde68a"; c.lineWidth = 8; rrect(c, x, y, 300, 200, 22); c.stroke(); }
    c.font = SANS(54, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(t, x + 150, y + 92);
    c.font = SANS(fit(c, sub, 270, 30, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(sub, x + 150, y + 150);
    if (q < 2) { c.fillStyle = "#94a3b8"; c.beginPath(); c.moveTo(x + 306, y + 85); c.lineTo(x + 334, y + 100); c.lineTo(x + 306, y + 115); c.closePath(); c.fill(); }
    c.restore();
  });
};
const bubble = (c: Ctx, x: number, y: number, w: number, title: string, text: string, col: string, fg: string, k: number, size = 40) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.font = SANS(size, 700); const ls = wrap(c, text, w - 60);
  const h = 70 + ls.length * size * 1.3 + 20;
  c.fillStyle = col; rrect(c, x, y, w, h, 24); c.fill();
  c.font = SANS(28, 900); c.fillStyle = fg; c.globalAlpha *= 0.8; c.textAlign = "left"; c.fillText(title, x + 30, y + 44); c.globalAlpha = clamp(k * 3);
  c.font = SANS(size, 700); c.fillStyle = fg; ls.forEach((t, q) => c.fillText(t, x + 30, y + 98 + q * size * 1.3));
  c.restore();
  return y + h;
};

const StVoice: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const ln0 = (i: number) => ls[i].from + 2;
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["pieces", "test", "loop"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.4} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("g")} at={8} src="reel/sfx_glitch.wav" vol={0.35} />,
      <Sfx key={k("p")} at={cue(i, 1, 0.5) + 20} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 2, 0.8) - 2} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("z")} at={cue(i, 2, 0.8)} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "pieces") [ln0(i), cue(i, 1, 0.45), cue(i, 2, 0.3)].forEach((t, q) => sfx.push(<Sfx key={k("p" + q)} at={t} src="audio/sfx_pop.wav" vol={0.4} />));
    if (b.prop === "test") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3) + 6} src="audio/gag_ding.wav" vol={0.3} />, <Sfx key={k("b")} at={cue(i, 2, 0.75) - 2} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("z")} at={cue(i, 2, 0.75) + 2} src="reel/sfx_buzz.wav" vol={0.35} />);
    if (b.prop === "madeup") sfx.push(<Sfx key={k("g")} at={cue(i, 1, 0.4)} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 1, 0.4) + 2} src="reel/sfx_boom.wav" vol={0.7} />);
    if (b.prop === "fix") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.45)} src="audio/gag_ding.wav" vol={0.45} />, ...[0, 1, 2].map((q) => <Sfx key={k("t" + q)} at={cue(i, 2, 0.75) + q * 10} src="audio/sfx_tick.wav" vol={0.3} />));
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.4} />, <Sfx key={k("p1")} at={cue(i, 1, 0.3)} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("p2")} at={cue(i, 1, 0.3) + 45} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(5656 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        if (P === "hook") {   // script review: the bubble first, then what the ears wrote; the scores on the voice
          const q = T.question as string;
          c.font = SANS(64, 900); const qs = wrap(c, q, W - 120);
          c.fillStyle = "#fde68a"; c.textAlign = "center"; qs.forEach((t, n) => c.fillText(t, W / 2, 300 + n * 74));
          const y0 = 300 + qs.length * 74 - 20;
          const y1 = bubble(c, 60, y0, W - 120, "A CUSTOMER SAYS, IN TELUGU", T.said, "#dcfce7", "#14532d", 1, 36);
          c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(T.gloss, 80, y1 + 40);
          const y2 = bubble(c, 60, y1 + 64, W - 120, "WHAT THE SMALL FREE MODEL WROTE: HINDI LETTERS", T.heardHi, "#fee2e2", "#7f1d1d", loopOn ? 1 : seg(f, 16, 24), 38);
          const k1 = loopOn ? 1 : seg(f, cu(1, 0.5) + 20, cu(1, 0.5) + 28), k2 = loopOn ? 1 : seg(f, cu(2, 0.8), cu(2, 0.8) + 6);
          block(c, 50, y2 + 26, "ENGLISH · RIGHT ORDER NUMBER", "7/10", GREEN, k1);
          block(c, 560, y2 + 26, "TELUGU · SMALL FREE MODEL", "0/10", "#f87171", k2);
        } else if (P === "pieces") {   // script review: one beat, three boxes, one code line each
          const rows: [string, string, string, string][] = [["EARS", "speech -> text · Whisper (OpenAI, open source, 2022)", T.ears, "#1e3a8a"], ["BRAIN", "EP55's bot + order server", T.brain, "#14532d"], ["MOUTH", "text -> speech", T.mouth, "#713f12"]];
          const at3 = [ln.from + 2, cu(1, 0.45), cu(2, 0.3)];
          c.font = SANS(fit(c, "3 PIECES · 1 LINE EACH", W - 100, 64), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("3 PIECES · 1 LINE EACH", W / 2, 320);
          rows.forEach(([t, sub, code, col], q) => {
            const k = seg(f, at3[q], at3[q] + 8); if (k <= 0) return;
            const y = 360 + q * 300;   // render check: the wrapped ears line ran into the brain row
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = col; rrect(c, 40, y, 1000, 76, 18); c.fill();
            c.font = SANS(44, 900); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(t, 70, y + 54);
            c.font = SANS(fit(c, sub, 760, 32, 800), 800); c.fillStyle = "#e2e8f0"; c.textAlign = "right"; c.fillText(sub, 1010, y + 52);
            c.restore();
            codeCard(c, y + 84, [code], seg(f, at3[q] + 4, at3[q] + 20), "voice.py", undefined, 0, 30);
          });
          chip(c, "full code: in the pinned comment", W / 2, 1290, "#fde68a", INK, seg(f, cu(2, 0.3) + 16, cu(2, 0.3) + 24), 36);
        } else if (P === "test") {
          c.font = SANS(fit(c, "OUR TEST · 10 CUSTOMERS", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST · 10 CUSTOMERS", W / 2, 320);
          c.font = SANS(32, 700); c.fillStyle = "#e2e8f0"; c.fillText("computer voices · a made-up shop · a small free model", W / 2, 372);
          const k1 = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3); c.fillStyle = "#1e293b"; rrect(c, 50, 410, W - 100, 330, 22); c.fill();
            c.font = SANS(44, 900); c.fillStyle = "#86efac"; c.textAlign = "left"; c.fillText("ENGLISH · right order number", 90, 480);
            c.font = SANS(110, 900); c.textAlign = "right"; c.fillText("7/10", 990, 510);
            c.font = SANS(32, 800); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("3 numbers came out like prices:", 90, 580);
            c.font = MONO(fit(c, (T.enBad as string[]).join("  "), 880, 34), 700); c.fillStyle = "#fca5a5"; c.fillText((T.enBad as string[]).join("  "), 90, 640);
            c.restore();
          }
          const k2 = seg(f, cu(2, 0.75), cu(2, 0.75) + 8);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3); c.fillStyle = "#3f1d1d"; rrect(c, 50, 770, W - 100, 400, 22); c.fill();
            c.font = SANS(44, 900); c.fillStyle = "#fca5a5"; c.textAlign = "left"; c.fillText("TELUGU · small free model", 90, 840);
            c.font = SANS(110, 900); c.textAlign = "right"; c.fillText("0/10", 990, 870);
            c.font = SANS(32, 800); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("what the ears wrote for order 4417:", 90, 950);
            c.font = SANS(40, 700); c.fillStyle = "#fee2e2"; wrap(c, T.heardHi, 880).slice(0, 2).forEach((t, q) => c.fillText(t, 90, 1010 + q * 52));
            c.font = SANS(32, 800); c.fillStyle = "#fde68a"; c.fillText("Telugu words in Hindi letters (6 of 10; 4 more: junk)", 90, 1130);
            c.restore();
          }
        } else if (P === "madeup") {
          c.font = SANS(fit(c, "WHEN IT COULDN'T READ THE NUMBER", W - 100, 56), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("WHEN IT COULDN'T READ THE NUMBER", W / 2, 340);
          const y1 = traceBox(c, 400, "THE AI SENT THE SHOP'S SYSTEM", [T.madeup], "#f87171", seg(f, ln.from + 2, ln.from + 10), "12345", "#fbbf24");
          const kB = seg(f, cu(1, 0.4), cu(1, 0.4) + 6);
          if (kB > 0) { c.save(); c.globalAlpha = clamp(kB * 3); c.font = SANS(220, 900); c.fillStyle = "#fbbf24"; c.textAlign = "center"; c.fillText("12345", W / 2, y1 + 260); c.restore(); }
          stamp(c, "MADE UP · 8 OF 50 TRIES", W / 2, y1 + 400, seg(f, cu(1, 0.4) + 14, cu(1, 0.4) + 20));
          chip(c, "50 tries = 10 questions × 5 ways of listening", W / 2, y1 + 530, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.4) + 24, cu(1, 0.4) + 32), big(c, "50 tries = 10 questions × 5 ways of listening", 38));
          chip(c, "the customer never said it", W / 2, y1 + 630, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.4) + 30, cu(1, 0.4) + 38), 40);
        } else if (P === "fix") {
          c.font = SANS(fit(c, "BEST FREE RESULT · TELUGU", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BEST FREE RESULT · TELUGU", W / 2, 330);
          c.font = SANS(fit(c, "a bigger model (Whisper large-v3), translating to English first", W - 120, 32, 700), 700); c.fillStyle = "#e2e8f0"; c.fillText("a bigger model (Whisper large-v3), translating to English first", W / 2, 380);
          const k1 = seg(f, cu(1, 0.45), cu(1, 0.45) + 6);
          bigNum(c, "5/10", W / 2, 560, "#fbbf24", k1, 170, "");
          bubble(c, 60, 610, W - 120, "IT HEARD (order 4611) · it answers in English", T.heardE, "#dcfce7", "#14532d", seg(f, cu(1, 0.45) + 10, cu(1, 0.45) + 18), 38);
          const k2 = seg(f, cu(2, 0.75), cu(2, 0.75) + 8);
          if (k2 > 0) {   // the time bar
            c.save(); c.globalAlpha = clamp(k2 * 3);
            const tt = T.times as [string, number][]; const tot = tt.reduce((a, [, v]) => a + v, 0);
            let x = 60; const cols = ["#1e3a8a", "#14532d", "#713f12"];
            tt.forEach(([nm, v], q) => {
              const w = (W - 120) * v / tot, kq = seg(f, cu(2, 0.75) + q * 10, cu(2, 0.75) + q * 10 + 8);
              c.fillStyle = cols[q]; rrect(c, x, 860, Math.max(4, w * clamp(kq)), 110, 12); c.fill();
              if (kq > 0.5) { c.font = SANS(fit(c, `${nm} ${Math.round(v)} s`, w - 16, 36, 900), 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(`${nm} ${Math.round(v)} s`, x + w / 2, 928); }
              x += w;
            });
            c.font = SANS(64, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("≈ 35 s an answer · the mouth: 20", W / 2, 1060);
            c.font = SANS(32, 700); c.fillStyle = "#cbd5e1"; c.fillText("on our computer (4 CPU cores, no graphics card)", W / 2, 1110);
            c.restore();
          }
        } else if (P === "loop") {
          const row = (y: number, n: string, t: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 150, 22); c.fill();
            c.font = SANS(70, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(n, 100, y + 100);
            c.font = SANS(fit(c, t, W - 300, 48, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(t, 190, y + 95); c.restore();
          };
          const at3 = [ln.from + 2, cu(1, 0.3), cu(1, 0.3) + 45];   // cueAt ignores the fraction once a cue exists
          ["these were computer voices: try yours", "until it's better: read the number back", "or let customers type it"].forEach((t, q) => row(300 + q * 180, String(q + 1), t, seg(f, at3[q], at3[q] + 8)));
          chip(c, T.full, W / 2, 900, "#fde68a", INK, seg(f, ln.from + 60, ln.from + 68), 44);
          const kN = seg(f, cu(2, 0.85), cu(2, 0.85) + 8);
          if (kN > 0) {
            c.save(); c.globalAlpha = clamp(kN * 3);
            c.font = SANS(fit(c, "NEXT · EP57: DEPLOY YOUR AI APP", W - 120, 64), 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("NEXT · EP57: DEPLOY YOUR AI APP", W / 2, 1060);
            c.restore();
          }
        }
      }} />
    </>
  );
};

export const VOICE56_SCENES = { sk_voice56: StVoice };
