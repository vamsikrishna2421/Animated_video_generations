import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 19 "The AI Said We're Both Right" (series/scripts/creative19_both_right.md): a boxing-ring parody on moving-out
// day. Venkat Rao garu (the landlord, the red corner) cut ₹15,000 from Sai's ₹30,000 advance for repainting (4 years:
// faded paint, 30 nail holes, one wall of a child's crayon drawings). He asked an AI: "fair". Sai asked the same AI:
// "unfair". Pinky (his granddaughter, the ring announcer): it agrees with whoever asks. Our test (series/scripts/
// creative19_demo/sides2_7B.json, read by hand): asked by the landlord "fair" 10 of 10, by the tenant "excessive" 9 of
// 10 (8 because a repaint costs ₹18,000); both sides in one message: ₹3,000 to ₹7,500, all 10 under ₹15,000. The fix: don't ask "am I right?", put both sides in one message. The loop:
// both men ask "AI, I'm right, aren't I?", both get "Yes!" -> the bell, frame 1. Every round gets our own ring bell (audio/sfx_ringbell.wav).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "sai" | "venkat" | "pinky"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 30;
const CLAP = "reel/creative09v1/clap.wav", BELL = "audio/sfx_ringbell.wav";
const RED = "#dc2626", BLUE = "#2563eb", AMBER = "#fbbf24";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
// our test, read by hand (pipeline/creative19/side_demo2.py HAND)
export const TEST = { landlord: 10, tenant: 9, both: "₹3,000 – ₹7,500", bothN: 10 };
const QUOTE_L = "\"Yes, it seems fair.\"", QUOTE_T = "\"This seems excessive.\"";
const MOOD: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { sai: ["shock", "up"], venkat: ["smug", "phone"], pinky: ["worried", "rest"] },
  2: { sai: ["angry", "rest"], venkat: ["smug", "phone"], pinky: ["worried", "rest"] },
  3: { sai: ["smug", "phone"], venkat: ["shock", "phone"], pinky: ["worried", "rest"] },
  4: { sai: ["shock", "rest"], venkat: ["shock", "rest"], pinky: ["excited", "up"] },
  5: { sai: ["deadpan", "fold"], venkat: ["angry", "shrug"], pinky: ["calm", "up"] },
  7: { sai: ["worried", "shrug"], venkat: ["deadpan", "fold"], pinky: ["calm", "rest"] },
  6: { sai: ["shock", "phone"], venkat: ["deadpan", "fold"], pinky: ["worried", "rest"] },
  12: { sai: ["deadpan", "fold"], venkat: ["excited", "phone"], pinky: ["deadpan", "fold"] },
  13: { sai: ["excited", "phone"], venkat: ["shock", "phone"], pinky: ["deadpan", "fold"] },
};
const SPOT: Record<string, [number, number, number]> = { venkat: [250, 1200, 0.66], sai: [830, 1200, 0.66], pinky: [540, 1105, 0.5] };

// ---------- pieces ----------
const wall = (c: Ctx, W: number, H: number, r: () => number) => {
  c.fillStyle = "#f3e7c9"; c.fillRect(0, 0, W, H);
  const pr = rng(1919);   // the faded paint: pale blotches that don't boil
  for (let q = 0; q < 14; q++) { c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(pr() * W, 560 + pr() * 560, 60 + pr() * 90, 30 + pr() * 60, pr(), 0, 7); c.fill(); }
  [[120, 640, 170, 130], [380, 600, 120, 160], [700, 650, 150, 110]].forEach(([x, y, w, h]) => {   // where the photo frames hung
    c.strokeStyle = "rgba(120,90,40,0.25)"; c.lineWidth = 6; c.strokeRect(x, y, w, h);
    c.fillStyle = "#3f2a12"; c.beginPath(); c.arc(x + w / 2, y - 14, 5, 0, 7); c.fill();
  });
  for (let q = 0; q < 12; q++) { c.fillStyle = "#3f2a12"; c.beginPath(); c.arc(80 + pr() * (W - 160), 560 + pr() * 520, 4, 0, 7); c.fill(); }   // nail holes
  // the crayon wall (right): a child's sun, house and three stick people
  stroke(c, [[860, 900], [1000, 900], [1000, 1040], [860, 1040], [860, 900]], "#ef4444", 7, r, { passes: 2 });
  stroke(c, [[850, 905], [930, 840], [1010, 905]], "#f97316", 7, r, { passes: 2 });
  c.strokeStyle = "#facc15"; c.lineWidth = 7; c.beginPath(); c.arc(960, 780, 34, 0, 7); c.stroke();
  for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4; stroke(c, [[960 + Math.cos(a) * 44, 780 + Math.sin(a) * 44], [960 + Math.cos(a) * 64, 780 + Math.sin(a) * 64]], "#facc15", 6, r, { passes: 1 }); }
  [[780, 960], [820, 975], [745, 990]].forEach(([x, y], q) => { const col = ["#22c55e", "#a855f7", "#0ea5e9"][q]; c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.arc(x, y - 40, 14, 0, 7); c.stroke(); stroke(c, [[x, y - 26], [x, y + 20], [x - 14, y + 44]], col, 6, r, { passes: 1 }); stroke(c, [[x, y + 20], [x + 14, y + 44]], col, 6, r, { passes: 1 }); stroke(c, [[x - 18, y - 6], [x + 18, y - 6]], col, 6, r, { passes: 1 }); });
  c.fillStyle = "#c9a36b"; c.fillRect(0, 1120, W, H - 1120);   // the floor
  c.fillStyle = "#b9894f"; for (let q = 0; q < 6; q++) c.fillRect(0, 1160 + q * 130, W, 5);
  [[20, 1000, 150, 130], [40, 890, 120, 110]].forEach(([x, y, w, h]) => { c.fillStyle = "#d6a86a"; c.fillRect(x, y, w, h); c.strokeStyle = "#8a6233"; c.lineWidth = 4; c.strokeRect(x, y, w, h); c.fillStyle = "#8a6233"; c.fillRect(x, y + h / 2 - 6, w, 12); });   // moving boxes
};
// the ring: corner posts and three ropes in front of the people
const ring = (c: Ctx, W: number, r: () => number) => {
  [[46, RED], [W - 46, BLUE]].forEach(([x, col]) => { c.fillStyle = "#475569"; c.fillRect((x as number) - 14, 1180, 28, 420); c.fillStyle = col as string; rrect(c, (x as number) - 26, 1200, 52, 90, 12); c.fill(); });
  [1330, 1410, 1490].forEach((y, q) => stroke(c, [[46, y], [W / 2, y + 10], [W - 46, y]], q === 1 ? "#f8fafc" : q === 0 ? RED : BLUE, 14, r, { passes: 2 }));
};
// the AI referee: a phone on a stick in a striped shirt; arms up = it calls a winner
const referee = (c: Ctx, x: number, y: number, up: number, side: "both" | "left" | "none", r: () => number) => {
  c.save(); c.translate(x, y);
  c.fillStyle = "#111827"; rrect(c, -46, 20, 92, 120, 14); c.fill();   // the shirt
  c.fillStyle = "#f8fafc"; for (let q = 0; q < 4; q++) c.fillRect(-46 + q * 24, 20, 12, 120);
  c.fillStyle = "#0f172a"; rrect(c, -56, -130, 112, 160, 18); c.fill();   // the phone face
  c.fillStyle = "#bfdbfe"; rrect(c, -46, -120, 92, 140, 12); c.fill();
  c.font = SANS(40, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText("AI", 0, -38);
  c.font = SANS(20, 800); c.fillText("REF", 0, -8);
  const arm = (s: number, raised: boolean) => {
    const a = raised ? -Math.PI / 2 + s * (0.55 - 0.35 * (1 - up)) : Math.PI / 2 - s * 0.6;   // raised: up and outwards
    const len = raised ? 90 + 80 * up : 90;
    const sx0 = s * 50, sy0 = raised ? -60 : 40;
    const ex = sx0 + Math.cos(a) * len, ey = sy0 + Math.sin(a) * len;
    stroke(c, [[sx0, sy0], [ex, ey]], "#f8fafc", 14, r, { passes: 2 });
    c.fillStyle = s < 0 ? RED : BLUE; c.beginPath(); c.arc(ex, ey, raised ? 30 : 20, 0, 7); c.fill();
  };
  arm(-1, side !== "none" && up > 0); arm(1, side === "both" && up > 0);
  c.restore();
};
// a scoreboard (screen space): rows of [label, value, colour]
const board = (c: Ctx, W: number, y: number, head: string, rows: [string, string, string][], k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 100 + rows.length * 150;
  c.fillStyle = "rgba(0,0,0,0.3)"; rrect(c, 48, y + 8, W - 96, h, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, 40, y, W - 96, h, 22); c.fill();
  c.fillStyle = RED; rrect(c, 40, y, (W - 96) / 2, 14, 6); c.fill(); c.fillStyle = BLUE; rrect(c, 40 + (W - 96) / 2, y, (W - 96) / 2, 14, 6); c.fill();
  c.font = SANS(28, 800); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(head, W / 2 - 8, y + 56);   // script review: the header small, the numbers huge
  rows.forEach(([lab, val, col], q) => {
    const yy = y + 80 + q * 150;
    c.font = SANS(40, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(lab, 80, yy + 84);
    let fs = 130; c.font = SANS(fs, 900); while (c.measureText(val).width > W - 520 && fs > 50) { fs -= 4; c.font = SANS(fs, 900); }
    c.fillStyle = col; c.textAlign = "right"; c.fillText(val, W - 90, yy + 92);
  });
  c.restore();
};
// a phone held up (screen space): the AI's verdict
const phoneCard = (c: Ctx, x: number, y: number, w: number, title: string, lines: string[], k: number, edge: string, col = "#dbeafe", fg = "#1e3a8a") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 104 + lines.length * 56;
  c.fillStyle = edge; rrect(c, x - 10, y - 10, w + 20, h + 20, 30); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, h, 22); c.fill();
  c.font = SANS(28, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(title, x + 24, y + 44);
  c.fillStyle = col; rrect(c, x + 18, y + 62, w - 36, h - 80, 18); c.fill();
  c.font = SANS(40, 900); c.fillStyle = fg;
  lines.forEach((t, q) => { let fs = 40; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 80 && fs > 26) { fs -= 2; c.font = SANS(fs, 900); } c.fillText(t, x + 40, y + 116 + q * 56); });
  c.restore();
};
const dark = (c: Ctx, W: number, H: number, round: string, title: string, sub: string[]) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  c.fillStyle = RED; c.fillRect(0, 0, W / 2, 16); c.fillStyle = BLUE; c.fillRect(W / 2, 0, W / 2, 16);
  c.font = SANS(36, 900); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(round, W / 2, 290);   // stills: under the banner at 230
  let fs = 62; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.fillText(title, W / 2, 360);
  c.font = SANS(34, 700); c.fillStyle = "#f8fafc"; sub.forEach((t, i) => c.fillText(t, W / 2, 425 + i * 48));
};
const card = (c: Ctx, t: string, sub: string, x: number, y: number, w: number, h: number, bg: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x - w / 2, y - h / 2, w, h, 26); c.fill();
  c.textAlign = "center"; c.fillStyle = fg;
  let fs = 54; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 40 && fs > 30) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillText(t, x, y - (sub ? 8 : -18));
  if (sub) { let ss = 38; c.font = SANS(ss, 700); while (c.measureText(sub).width > w - 40 && ss > 24) { ss -= 2; c.font = SANS(ss, 700); } c.fillText(sub, x, y + 46); }
  c.restore();
};
const barRow = (c: Ctx, label: string, v: number, of: number, y: number, col: string, k: number) => {
  if (k <= 0) return;
  c.font = SANS(40, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(label, 90, y - 22);
  c.fillStyle = "#1e293b"; rrect(c, 90, y, 620, 76, 14); c.fill();
  c.fillStyle = col; rrect(c, 90, y, Math.max(16, 620 * (v / of) * easeOut(k)), 76, 14); c.fill();
  c.font = SANS(64, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(`${v} of ${of}`, 1010, y + 62);
};
const inset = (c: Ctx, who: BillWho, m: [BillMood, BillArms], talk: boolean, r: () => number) => {
  c.save(); c.beginPath(); rrect(c, 820, 1270, 220, 210, 28); c.clip();
  c.fillStyle = "#334155"; c.fillRect(820, 1270, 220, 210);
  person(c, who, [930, 1420], 0.4, m[0], m[1], talk, r);
  c.restore();
  c.strokeStyle = "#fde68a"; c.lineWidth = 6; rrect(c, 820, 1270, 220, 210, 28); c.stroke();
};

// ---------- the scene ----------
const StSides: React.FC<SP> = ({ s }) => {
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
    if (["study", "test", "fix"].includes(b.shot) && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("wr")} at={Math.max(0, at - 26)} src="reel/sfx_riser.wav" vol={0.16} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={0} src={BELL} vol={te ? 0.45 : 0.4} />, <Sfx key={k("a")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.85} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.35} />);
    if (b.prop === "fair") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 6} src="audio/gag_ding.wav" vol={0.22} />, <Sfx key={k("p")} at={cue(i, 1, 0.5) - 8} src="audio/sfx_whoosh.wav" vol={0.25} />);
    if (b.prop === "unfair") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 6} src="audio/gag_ding.wav" vol={0.22} />, <Sfx key={k("p")} at={cue(i, 1, 0.5) - 8} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "both") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.5) - 10} src={BELL} vol={0.4} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.4} />);
    if (b.prop === "study") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.4) - 4} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />);
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("b")} at={Math.max(0, at - 20)} src={BELL} vol={0.3} />, <Sfx key={k("n")} at={c1 - 4} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />, <Sfx key={k("g")} at={c1 + 30} src="reel/sfx_glitch.wav" vol={0.2} />); }
    if (b.prop === "fix") sfx.push(<Sfx key={k("b")} at={Math.max(0, at - 20)} src={BELL} vol={0.3} />, <Sfx key={k("h")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "middle") sfx.push(<Sfx key={k("h")} at={cue(i, 1, 0.4) - 8} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />, <Sfx key={k("a")} at={cue(i, 1, 0.4) + 20} src={CLAP} vol={0.35} />);
    if (b.prop === "loop1") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.6) - 6} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "echo") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5) + 4} src="audio/gag_boing.wav" vol={0.3} />);
    if (b.prop === "fair") sfx.push(<Sfx key={k("r1")} at={Math.max(0, at - 6)} src={BELL} vol={0.2} />);
    if (b.prop === "loop") {
      const slam = end + HOLD, c1 = cue(i, 1, 0.6);
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={c1 - 6} src="audio/gag_ding.wav" vol={0.3} />,
        <Sfx key={k("b")} at={slam - 8} src={BELL} vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />);
    }
  });
  const iLoop = first("loop1") >= 0 ? first("loop1") : first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("fix") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(1919 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const faceOf = (who: BillWho, md: [BillMood, BillArms]) => inset(c, who, md, b.who === who && talking, r);
        if (b.shot === "study") {
          dark(c, W, H, "BETWEEN ROUNDS", "WHY IT SAID YES TO BOTH", []);
          const c1 = cu(1, 0.3);
          card(c, "STANFORD STUDY", "Science journal · March 2026 · 11 chatbots", W / 2, 520, W - 160, 170, "#e0e7ff", "#1e3a8a", seg(f, c1 - 10, c1 - 2));
          card(c, "SIDED WITH THE USER", "~1.5× as often as people (49% more)", W / 2, 760, W - 160, 170, "#fee2e2", "#991b1b", seg(f, c1 + 4, c1 + 12));   // script review: "49% more" vs our 10 of 10 confused
          card(c, "ON A CLOSE CALL, IT LEANS TO THE ASKER", "", W / 2, 990, W - 160, 120, "#fef3c7", INK, seg(f, ln.from + 4, ln.from + 12));
          faceOf("pinky", ["calm", "up"]);
          return;
        }
        if (b.shot === "test") {
          dark(c, W, H, "ROUND 2", "OUR TEST", ["a small AI on our laptop, no internet (Qwen2.5 7B)", "the same flat, the same ₹15,000 cut · 10 tries each"]);
          const c1 = cu(1, 0.45);
          barRow(c, "asked by the landlord: \"fair\"", TEST.landlord, 10, 620, "#f87171", seg(f, c1 - 2, c1 + 10));
          barRow(c, "asked by the tenant: \"excessive\"", TEST.tenant, 10, 800, "#60a5fa", seg(f, c1 + 22, c1 + 34));   // script review: the AI's own word
          c.save(); c.globalAlpha = seg(f, c1 + 40, c1 + 48); c.font = SANS(44, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("same AI · same flat · it leaned to the asker", W / 2, 990); c.restore();
          c.save(); c.font = SANS(36, 800); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("a small AI with no internet: try yours", W / 2, 1150); c.restore();
          faceOf(b.who as BillWho, b.who === "venkat" ? ["angry", "shrug"] : ["calm", "up"]);
          return;
        }
        if (b.shot === "fix") {
          dark(c, W, H, "ROUND 3", "THE FIX", []);
          const k0 = seg(f, ln.from - 4, ln.from + 6), c1 = cu(1, 0.3);
          card(c, "✗ \"I'M RIGHT, AREN'T I?\"", "", W / 2, 440, W - 160, 130, "#fee2e2", "#991b1b", k0);
          if (b.prop === "fix") {
            const k1 = seg(f, c1 - 4, c1 + 6);
            if (k1 > 0) {
              c.save(); c.globalAlpha = clamp(k1 * 3);
              c.fillStyle = "#f8fafc"; rrect(c, 70, 560, W - 140, 400, 26); c.fill();
              c.font = SANS(32, 900); c.fillStyle = "#15803d"; c.textAlign = "left"; c.fillText("✓ BOTH SIDES, ONE MESSAGE:", 110, 620);
              c.font = SANS(40, 800); c.fillStyle = INK;
              ["\"Two people disagree.", "Landlord: ...   Tenant: ...", "Give the best case for each,", "then say what is fair.\""].forEach((t, q) => c.fillText(t, 110, 690 + q * 62));
              c.font = SANS(34, 900); c.fillStyle = "#1d4ed8"; c.fillText("each of you writes your own side", 110, 935);   // script review: if one writes both, theirs comes out stronger
              c.restore();
            }
          } else {
            card(c, "THE AI, GIVEN BOTH SIDES:", "", W / 2, 600, W - 160, 120, "#dcfce7", "#14532d", 1);   // script review: not a "FAIR CUT" box
            const k2 = seg(f, c1 - 6, c1 + 4);
            card(c, TEST.both, `all ${TEST.bothN} tries under ₹15,000 · "for the small damage, not a full repaint"`, W / 2, 820, W - 120, 200, "#fef3c7", INK, k2);
            card(c, "A SUGGESTION, NOT A VERDICT", "you two decide", W / 2, 1040, W - 200, 150, "#e0e7ff", "#1e3a8a", seg(f, c1 + 40, c1 + 48));
          }
          faceOf("pinky", ["smug", "up"]);
          return;
        }
        // ---------- the ring ----------
        const hookOn = b.prop === "hook" || loopOn;
        const hitAt = cu(1, 0.5);
        const shake = (b.prop === "hook" && f < hitAt + 8 && f > hitAt) || (loopOn && f < slam + 10) ? 9 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.save(); c.translate(sx, sy);
        wall(c, W, H, r);
        (["pinky", "venkat", "sai"] as BillWho[]).forEach((who) => {
          const [x, y, sc] = SPOT[who];
          const md = (loopOn ? MOOD[1] : MOOD[n] ?? MOOD[1])[who] ?? ["calm", "rest"];
          person(c, who, [x, y], sc, md[0], md[1], b.who === who && talking && !loopOn, r);
        });
        if (b.who === "pinky" && !loopOn) {   // her mic: a rolled-up newspaper
          c.save(); c.translate(600, 1150); c.rotate(-0.5); c.fillStyle = "#e5e7eb"; rrect(c, -14, -70, 28, 110, 8); c.fill(); c.strokeStyle = "#94a3b8"; c.lineWidth = 3; for (let q = 0; q < 4; q++) { c.beginPath(); c.moveTo(-14, -50 + q * 22); c.lineTo(14, -50 + q * 22); c.stroke(); } c.restore();
        }
        ring(c, W, r);
        const both = b.prop === "both" ? easeOut(seg(f, cu(1, 0.5) - 14, cu(1, 0.5) - 2)) : 0;
        const refL = b.prop === "loop1" ? easeOut(seg(f, cu(1, 0.6) - 8, cu(1, 0.6) + 4)) : 0;
        const refB = b.prop === "loop" && !loopOn ? easeOut(seg(f, cu(1, 0.6) - 8, cu(1, 0.6) + 4)) : 0;
        referee(c, 540, 1300, Math.max(both, refL, refB), both > 0 || refB > 0 ? "both" : refL > 0 ? "left" : "none", r);
        c.restore();
        if (hookOn || b.prop === "fair" || b.prop === "unfair") {   // frame 1: the board (readable with the sound off)
          board(c, W, 240, hookOn ? "MOVING-OUT DAY · 4 YEARS" : "ROUND 1 · MOVING-OUT DAY · 4 YEARS", [["ADVANCE PAID", "₹30,000", "#f8fafc"], ["ADVANCE BACK", "₹15,000", "#f87171"]], 1);   // stills: the banner covered it at 170
          phoneCard(c, 50, 670, 470, "His AI", [QUOTE_L], 1, RED, "#fee2e2", "#991b1b");
          if (b.prop === "unfair") phoneCard(c, 560, 670, 470, "Sai's AI", [QUOTE_T], seg(f, cu(1, 0.5) - 10, cu(1, 0.5) - 2), BLUE);
        }
        if (b.prop === "fair") {   // script review: set up the ₹18,000 (and the damage) before Sai reads it back
          const c1 = cu(1, 0.5);
          tag(c, "FADED PAINT", 230, 900, 58, "#fef3c7", INK, -0.04, seg(f, ln.from + 2, ln.from + 8));
          tag(c, "NAIL HOLES", 560, 860, 58, "#fef3c7", INK, 0.03, seg(f, ln.from + 10, ln.from + 16));
          tag(c, "CRAYON WALL", 880, 1060, 58, "#fef3c7", INK, -0.03, seg(f, ln.from + 18, ln.from + 24));
          tag(c, "REPAINT: ₹18,000", W / 2, 990, 84, AMBER, INK, 0.02, seg(f, ln.from + 6, ln.from + 12) * (1 - seg(f, c1 + 30, c1 + 36)));
        }
        if (b.prop === "both") {
          phoneCard(c, 50, 300, 470, "His AI", [QUOTE_L], 1, RED, "#fee2e2", "#991b1b");
          phoneCard(c, 560, 300, 470, "Sai's AI", [QUOTE_T], 1, BLUE);
          tag(c, "WINNER: BOTH?!", W / 2, 680, 120, AMBER, INK, -0.03, seg(f, cu(1, 0.5) - 14, cu(1, 0.5) - 4));
        }
        if (b.prop === "how") tag(c, "how can both be right?!", W / 2, 520, 80, "#fef3c7", INK, -0.03, seg(p, 0.1, 0.3));
        if (b.prop === "echo") {   // his phone, zoomed: the reason it gave him
          phoneCard(c, 60, 300, W - 120, "Sai's AI", ["\"₹15,000 seems excessive", "given the actual cost", "of ₹18,000.\""], seg(p, 0.0, 0.12), BLUE);
          tag(c, "15 < 18 ?!", W / 2, 760, 120, "#fee2e2", "#991b1b", -0.05, seg(f, cu(1, 0.5) + 4, cu(1, 0.5) + 12));
        }
        if (b.prop === "loop1") {
          const c1 = cu(1, 0.6);
          phoneCard(c, 50, 360, 500, "His AI", ["\"I'm right, aren't I?\""], seg(p, 0.05, 0.2), RED, "#e2e8f0", INK);
          phoneCard(c, 50, 580, 500, "His AI", ["\"Yes, you're right!\""], seg(f, c1 - 10, c1 - 2), RED, "#fee2e2", "#991b1b");
        }
        if (b.prop === "loop" && !loopOn) {   // script review: both of them ask again, both get a yes
          const c1 = cu(1, 0.6);
          phoneCard(c, 50, 580, 500, "His AI", ["\"Yes, you're right!\""], 1, RED, "#fee2e2", "#991b1b");
          phoneCard(c, 530, 360, 500, "Sai's AI", ["\"I'm right, aren't I?\""], seg(p, 0.05, 0.2), BLUE, "#e2e8f0", INK);
          phoneCard(c, 530, 800, 500, "Sai's AI", ["\"Yes, you're right!\""], seg(f, c1 - 10, c1 - 2), BLUE);
        }
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const SIDES_SCENES = { sk_sides: StSides };
