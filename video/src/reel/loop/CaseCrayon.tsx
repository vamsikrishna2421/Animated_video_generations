import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 17 "Same Answer, Two Marks" (series/scripts/creative17_same_answer.md): a TV crime-show parody in a tuition
// room. Akhil copied Varsha's answer word for word; Srinivas sir's AI marked his 9/10 and hers 7/10. A chat AI picks each
// word with a little chance, so the same answer can get a new mark each time. Our test (series/scripts/creative17_demo,
// a small offline AI, read by hand): one answer marked ten times: 7 once, 8 seven times, 9 twice; with a marking scheme:
// 7 twice, 8 four times, 9 four times, and three times it gave her first line zero. The rule: the AI points to the lines,
// a person gives the marks. The loop: "Sir, mark mine again!" -> "Akhil: 7/10" -> frame 1. One beat per line.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "varsha" | "akhil" | "srinivas"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 40;   // frames of "7/10" before the slam back to frame 1 (render review: up ~1 s, too short)
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const HAND = (s: number) => `600 ${s}px "Comic Sans MS", "Segoe Print", cursive`;
const PLAIN = [7, 8, 8, 9, 8, 9, 8, 8, 8, 8];     // our test, tries 1-10, read by hand
const SCHEME = [9, 9, 8, 9, 9, 8, 7, 7, 8, 8];
const ANSWER = ["Lightning and thunder happen", "at the same time in the cloud.", "But light travels much faster", "than sound..."];
const MOOD: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { varsha: ["angry", "up"], akhil: ["smug", "fold"], srinivas: ["deadpan", "phone"] },
  2: { varsha: ["angry", "fold"], akhil: ["smug", "up"], srinivas: ["calm", "phone"] },
  3: { varsha: ["worried", "rest"], akhil: ["smug", "fold"], srinivas: ["deadpan", "shrug"] },
  5: { varsha: ["smug", "fold"], akhil: ["angry", "up"], srinivas: ["worried", "phone"] },
  7: { varsha: ["deadpan", "fold"], akhil: ["worried", "rest"], srinivas: ["excited", "up"] },
  9: { varsha: ["smug", "fold"], akhil: ["shock", "up"], srinivas: ["worried", "rest"] },
  10: { varsha: ["calm", "up"], akhil: ["worried", "rest"], srinivas: ["calm", "phone"] },
  11: { varsha: ["smug", "fold"], akhil: ["excited", "up"], srinivas: ["deadpan", "phone"] },
};
const SPOT: Record<BillWho, [number, number, number]> = { varsha: [210, 1200, 0.6], srinivas: [540, 1150, 0.64], akhil: [870, 1200, 0.6] } as any;

// ---------- pieces ----------
// the tuition room wall and the cork board (the crime show's evidence board)
const wall = (c: Ctx, W: number, H: number, grey: number) => {
  c.fillStyle = "#cbd5e1"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#94a3b8"; c.fillRect(0, 1120, W, H - 1120);
  c.fillStyle = "#7c5a3a"; rrect(c, 40, 200, W - 80, 700, 16); c.fill();
  c.fillStyle = "#c8a165"; rrect(c, 56, 216, W - 112, 668, 10); c.fill();
  if (grey > 0) { c.save(); c.globalAlpha = 0.18 * grey; c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); c.restore(); }
};
const sheet = (c: Ctx, x: number, y: number, name: string, mark: string, ex: string, k: number, rot: number) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = "rgba(4,8,40,0.3)"; c.fillRect(-206, -246, 420, 520);
  c.fillStyle = "#fffdf5"; c.fillRect(-210, -250, 420, 520);
  c.strokeStyle = "#93c5fd"; c.lineWidth = 2; for (let q = 0; q < 9; q++) { c.beginPath(); c.moveTo(-190, -150 + q * 46); c.lineTo(190, -150 + q * 46); c.stroke(); }
  c.font = SANS(30, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(name, -190, -200);
  ANSWER.forEach((t, q) => {   // the same words on both sheets, highlighted
    c.fillStyle = "rgba(253,224,71,0.75)"; c.fillRect(-194, -146 + q * 46, 388, 36);
    c.font = HAND(24); c.fillStyle = "#1e3a8a"; c.fillText(t, -188, -118 + q * 46);
  });
  c.font = HAND(24); c.fillStyle = "#1e3a8a"; c.fillText("...", -188, 72);
  if (k > 0) {   // the red mark
    c.save(); c.globalAlpha = clamp(k * 2); c.translate(90, 170); c.rotate(-0.12); c.scale(0.6 + 0.4 * easeOut(k), 0.6 + 0.4 * easeOut(k));
    c.strokeStyle = RED; c.lineWidth = 8; c.beginPath(); c.ellipse(0, 0, 120, 72, 0, 0, 7); c.stroke();
    c.font = SANS(92, 900); c.fillStyle = RED; c.textAlign = "center"; c.fillText(mark, 0, 32); c.restore();
  }
  c.save(); c.translate(-60, 0); c.rotate(-0.18);   // script review: who copied whom, readable with the sound off
  c.strokeStyle = ex === "ORIGINAL" ? "#15803d" : RED; c.lineWidth = 7; rrect(c, -150, -46, 300, 84, 10); c.stroke();
  c.font = SANS(58, 900); c.fillStyle = ex === "ORIGINAL" ? "#15803d" : RED; c.textAlign = "center"; c.fillText(ex, 0, 16); c.restore();
  c.beginPath(); c.arc(0, -236, 14, 0, 7); c.fillStyle = RED; c.fill();   // the pin
  c.restore();
};
// frame 1: the board, readable in the grid with the sound off
const board = (c: Ctx, W: number, f: number, k: number, akhilMark = "9/10") => {
  sheet(c, 290, 560, "Varsha", "7/10", "ORIGINAL", k, -0.04);
  sheet(c, 790, 560, "Akhil", akhilMark, "COPIED", k, 0.04);
  c.save(); c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); c.moveTo(290, 330); c.quadraticCurveTo(540, 420, 790, 330); c.stroke(); c.restore();   // the red string
  c.save(); c.translate(540, 400); c.rotate(-0.02);   // the string's label, and who marked it, as big as the marks
  c.fillStyle = "#0f172a"; rrect(c, -190, -44, 380, 150, 12); c.fill();
  c.font = SANS(44, 900); c.fillStyle = "#fef08a"; c.textAlign = "center"; c.fillText("SAME ANSWER", 0, 6);
  c.font = SANS(44, 900); c.fillStyle = "#f87171"; c.fillText("MARKED BY AI", 0, 74); c.restore();
  c.save(); c.fillStyle = "#0f172a"; rrect(c, 210, 872, 660, 56, 10); c.fill(); c.font = SANS(34, 900); c.fillStyle = "#f87171"; c.textAlign = "center";   // render review: the crime show didn't show
  c.fillText("● CASE FILE: THE SAME ANSWER", 540, 912); c.restore();
  void f;
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[]) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  let fs = 60; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(38, 700); c.fillStyle = "#f8fafc"; sub.forEach((t, i) => c.fillText(t, W / 2, 390 + i * 52));
};
// ten marks as tiles (one per try), then the count per mark
const tiles = (c: Ctx, W: number, y: number, marks: number[], f: number, t0: number, label: string) => {
  c.font = SANS(36, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(label, W / 2, y - 24);
  marks.forEach((m, q) => {
    const k = seg(f, t0 + q * 2, t0 + q * 2 + 6); if (k <= 0) return;
    const x = 70 + q * 96, col = m === 7 ? "#f87171" : m === 8 ? "#fbbf24" : "#4ade80";
    c.save(); c.globalAlpha = clamp(k * 2); c.fillStyle = col; rrect(c, x, y, 84, 100, 14); c.fill();
    c.font = SANS(64, 900); c.fillStyle = "#0f172a"; c.fillText(String(m), x + 42, y + 74); c.restore();
  });
  const kc = seg(f, t0 + 24, t0 + 32);
  if (kc > 0) {
    c.save(); c.globalAlpha = kc; c.font = SANS(44, 900); c.textAlign = "center";
    [7, 8, 9].forEach((m, q) => { const n = marks.filter((x) => x === m).length; c.fillStyle = m === 7 ? "#f87171" : m === 8 ? "#fbbf24" : "#4ade80"; c.fillText(`${m}: ${n}×`, 220 + q * 320, y + 170); });
    c.restore();
  }
};
// the odds wheel (line 4): segments sized by our test, the needle lands on a new mark each spin
const wheel = (c: Ctx, W: number, f: number, t0: number, c1: number) => {
  dark(c, W, 1920, "HOW A CHAT AI ANSWERS", ["each next word has odds:", "it rolls for it"]);
  const cx = W / 2, cy = 820, R = 280;
  const segs: [number, number, string][] = [[7, 0.1, "#f87171"], [8, 0.7, "#fbbf24"], [9, 0.2, "#4ade80"]];
  let a0 = -Math.PI / 2;
  segs.forEach(([m, p, col]) => {
    const a1 = a0 + p * Math.PI * 2;
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath(); c.fillStyle = col; c.fill();
    c.strokeStyle = "#0f172a"; c.lineWidth = 6; c.stroke();
    const am = (a0 + a1) / 2; c.font = SANS(84, 900); c.fillStyle = "#0f172a"; c.textAlign = "center"; c.fillText(String(m), cx + Math.cos(am) * R * 0.62, cy + Math.sin(am) * R * 0.62 + 30);
    a0 = a1;
  });
  // the needle: spins once at the start, again on "Ask again"
  const land = (tt: number) => (tt < c1 ? -Math.PI / 2 + 0.2 * Math.PI * 2 + 0.6 : -Math.PI / 2 + 0.85 * Math.PI * 2);   // first on 8, then on 9
  const spin = (from: number, to: number, a: number, b: number) => a + (b - a) * easeOut(seg(f, from, to));
  const ang = f < c1 ? spin(t0, t0 + 24, land(t0) - Math.PI * 4, land(t0)) : spin(c1, c1 + 24, land(t0), land(c1) + Math.PI * 4);
  c.save(); c.translate(cx, cy); c.rotate(ang);
  c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(0, -14); c.lineTo(R - 30, 0); c.lineTo(0, 14); c.closePath(); c.fill();
  c.restore(); c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.fillStyle = "#f8fafc"; c.fill();
  const l1 = seg(f, t0 + 24, t0 + 28) * (f < c1 ? 1 : 0), l2 = seg(f, c1 + 24, c1 + 28);   // render review: where did it land?
  if (l1 > 0 || l2 > 0) { c.save(); c.globalAlpha = Math.max(l1, l2); c.font = SANS(60, 900); c.fillStyle = l2 > 0 ? "#4ade80" : "#fbbf24"; c.textAlign = "center"; c.fillText(l2 > 0 ? "this time: 9" : "this time: 8", cx, cy + R + 66); c.restore(); }
  c.font = SANS(32, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("the odds our test showed for one answer: 7 · 8 · 9", W / 2, 1226);
  tag(c, "ask again → a new roll → maybe a new mark", W / 2, 1290, 44, "#fde68a", INK, -0.02, seg(f, c1, c1 + 8));
};
// a face in a corner of the cards (Creative 16's render review: the people stay on screen through the cards)
const inset = (c: Ctx, who: BillWho, m: [BillMood, BillArms], talk: boolean, r: () => number, y = 1240) => {
  c.save(); c.beginPath(); rrect(c, 820, y, 220, 210, 28); c.clip();
  c.fillStyle = "#334155"; c.fillRect(820, y, 220, 210);
  person(c, who, [930, y + 150], 0.4, m[0], m[1], talk, r);
  c.restore();
  c.strokeStyle = "#fde68a"; c.lineWidth = 6; rrect(c, 820, y, 220, 210, 28); c.stroke();
};

// ---------- the scene ----------
const StCase: React.FC<SP> = ({ s }) => {
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
    const insert = !["wide", "hook"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("wr")} at={Math.max(0, at - 26)} src="reel/sfx_riser.wav" vol={0.16} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.4} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.25} />,
      <Sfx key={k("m")} at={cue(i, 1, 0.5)} src="audio/sfx_tick.wav" vol={0.35} />, <Sfx key={k("n")} at={cue(i, 1, 0.5) + 14} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.45} />);
    if (b.prop === "impossible") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.2} />);
    if (b.prop === "wheel") { const c1 = cue(i, 1, 0.55); [0, 4, 8, 12, 16, 20].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + q} src="audio/sfx_tick.wav" vol={0.2} />, <Sfx key={k("u" + q)} at={c1 + q} src="audio/sfx_tick.wav" vol={0.2} />)); sfx.push(<Sfx key={k("d")} at={c1 + 24} src="audio/gag_ding.wav" vol={0.2} />); }
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />); [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={ln0(i) + q} src="audio/sfx_pop.wav" vol={0.12} />)); }
    if (b.prop === "scheme") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />, <Sfx key={k("g")} at={c1 + 20} src="reel/sfx_glitch.wav" vol={0.25} />); }
    if (b.prop === "lottery") sfx.push(<Sfx key={k("c")} at={end + 2} src={CLAP} vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - (te ? 24 : 12))} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - (te ? 26 : 14))} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />);
    if (b.prop === "loop") {   // the new mark, then the slam back to frame 1
      const slam = end + HOLD, c1 = cue(i, 1, 0.6);
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={c1 - 6} src="audio/gag_ding.wav" vol={0.25} />, <Sfx key={k("s")} at={c1} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.6} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.55} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
    }
  });
  function ln0(i: number) { return ls[i].from; }
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("rule") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(1717 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const faceOf = (who: BillWho, md: [BillMood, BillArms], y = 1240) => inset(c, who, md, b.who === who && talking, r, y);
        if (b.shot === "wheel") {
          wheel(c, W, f, ln.from - 4, cu(1, 0.55));
          faceOf("akhil", ["shock", "rest"], 1286);
        } else if (b.shot === "test") {
          dark(c, W, H, "OUR TEST", ["a small free AI on a laptop, offline (Qwen2.5 7B)", "ONE answer, marked 10 times · try it on yours"]);
          const scheme = b.prop === "scheme" || b.prop === "lottery";
          if (!scheme) {
            tiles(c, W, 560, PLAIN, f, b.prop === "test" ? cu(1, 0.5) - 10 : -1e9, "\"Mark this answer out of 10.\"");
            if (b.prop === "test") tag(c, "mostly 8, but 7 and 9 came up", W / 2, 900, 56, "#fde68a", INK, -0.02, seg(f, cu(1, 0.5) + 30, cu(1, 0.5) + 38));
            if (b.prop !== "scheme0") { c.save(); c.font = SANS(46, 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("a small AI on a laptop: try it on yours", W / 2, 1080); c.restore(); }   // render review: the caveat was grey micro-text
          } else {
            tiles(c, W, 560, SCHEME, f, b.prop === "scheme" ? ln.from - 8 : -1e9, "+ a 4-point marking scheme");
            const c1 = b.prop === "scheme" ? cu(1, 0.5) : -1e9;
            const k1 = seg(f, c1, c1 + 8);
            if (k1 > 0) {   // her first line, and what the AI said about it
              c.save(); c.globalAlpha = clamp(k1 * 3);
              c.fillStyle = "#fffdf5"; rrect(c, 70, 860, W - 140, 150, 20); c.fill();
              c.font = SANS(30, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("HER FIRST LINE", 100, 902);
              c.font = HAND(40); c.fillStyle = "#1e3a8a"; c.fillText("\"...happen at the same time in the cloud.\"", 100, 962);
              c.fillStyle = "#fee2e2"; rrect(c, 70, 1030, W - 140, 170, 20); c.fill();
              c.font = SANS(30, 800); c.fillStyle = "#991b1b"; c.fillText("THE AI, 3 TIMES OUT OF 10:  0/2", 100, 1072);
              c.font = SANS(36, 700); c.fillStyle = INK; c.fillText("\"The student did not mention that", 100, 1124); c.fillText("lightning and thunder happen at the same time.\"", 100, 1170);
              c.restore();
            }
          }
          faceOf(b.who === "srinivas" ? "srinivas" : b.who === "akhil" ? "akhil" : "varsha", b.prop === "lottery" ? ["shock", "up"] : b.who === "srinivas" ? ["excited", "up"] : ["smug", "fold"]);
        } else {
          // ---------- the tuition room ----------
          const hookOn = b.prop === "hook" || loopOn;
          const grey = hookOn ? 0 : 1;   // the "reconstruction" goes grey after frame 1
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.save(); c.translate(sx, sy);
          wall(c, W, H, grey);
          board(c, W, f, 1);
          (["varsha", "srinivas", "akhil"] as BillWho[]).forEach((who) => {
            const [x, y, sc] = SPOT[who];
            const md = (loopOn ? MOOD[1] : MOOD[n] ?? MOOD[1])[who] ?? ["calm", "rest"];
            person(c, who, [x, y], sc, md[0], md[1], b.who === who && talking && !loopOn, r);
          });
          c.restore();
          if (!hookOn) { c.save(); c.font = SANS(28, 900); c.fillStyle = "#f8fafc"; c.globalAlpha = 0.85; c.fillStyle = "#0f172a"; rrect(c, 40, 226, 230, 46, 8); c.fill(); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("DRAMATISED", 155, 259); c.restore(); }
          if (b.prop === "rule") {   // the rule card (sound-off viewers)
            const k0 = seg(p, 0.0, 0.08);
            c.save(); c.globalAlpha = clamp(k0 * 3);
            c.fillStyle = "rgba(15,23,42,0.95)"; rrect(c, 50, 210, W - 100, 860, 30); c.fill();
            c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("AI MARKING: THE RULE", W / 2, 300);
            c.restore();
            const t1 = cu(1, 0.4);
            ([["THE AI", "flags the lines", ln.from + 2, "#e0e7ff", "#1e3a8a"], ["A PERSON", "checks, gives the mark", t1 - 2, "#dcfce7", "#14532d"]] as [string, string, number, string, string][]).forEach(([a, bb, t0, bg, fg], q) => {
              const k = seg(f, t0, t0 + 8); if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3);
              const y = 350 + q * 180;
              c.fillStyle = bg; rrect(c, 100, y, W - 200, 150, 22); c.fill();
              c.font = SANS(40, 900); c.fillStyle = fg; c.textAlign = "left"; c.fillText(a, 140, y + 62);
              c.font = SANS(54, 900); c.fillText(bb, 140, y + 124);
              c.restore();
            });
            const kt = seg(f, t1, t1 + 8);   // script review: something to test tonight; render review: up 4 s+
            if (kt > 0) {
              c.save(); c.globalAlpha = clamp(kt * 3); c.fillStyle = "#fef3c7"; rrect(c, 100, 730, W - 200, 290, 22); c.fill();
              c.font = SANS(40, 900); c.fillStyle = "#7c2d12"; c.textAlign = "left"; c.fillText("GOT AN AI MARK? TEST IT:", 140, 790);
              c.font = SANS(44, 800); c.fillStyle = INK; c.fillText("same answer, 3 new chats.", 140, 860); c.fillText("The mark changes?", 140, 920); c.fillText("Show your teacher.", 140, 980);
              c.restore();
            }
          }
          if (b.prop === "loop" && !loopOn) {   // his re-mark on the AI marker
            const c1 = cu(1, 0.6), k = seg(f, c1 - 8, c1);
            if (k > 0) {
              c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, 640); c.scale(0.7 + 0.3 * easeOut(k), 0.7 + 0.3 * easeOut(k));
              c.fillStyle = "#0f172a"; rrect(c, -330, -230, 660, 460, 40); c.fill();
              c.fillStyle = "#f8fafc"; rrect(c, -300, -200, 600, 400, 24); c.fill();
              c.font = SANS(34, 800); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("AI marker · re-marked", 0, -130);
              c.font = SANS(60, 900); c.fillStyle = INK; c.fillText("Akhil:", 0, -30);
              c.font = SANS(150, 900); c.fillStyle = RED; c.fillText("7/10", 0, 140);
              c.restore();
            }
          }
          if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
        }
      }} />
    </>
  );
};

export const CASE_FILE_SCENES = { sk_case: StCase };
