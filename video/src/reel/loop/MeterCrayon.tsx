import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 22 "The Meter Photo" (series/scripts/creative22_meter.md): story mode (Vamsi via Bujji, Nov 6: one character,
// one warm narration, simple pictures, a reveal). Kamala amma, a retired maths teacher, gets a ₹1,60,936 power bill
// (usually ₹960): the app that reads her meter photo read 86111; her meter says 66114. A six is an eight with one line
// missing. Our test (series/scripts/creative22_demo): a small free AI that reads photos read 0 of 24 meter photos right;
// the same numbers printed plainly: PRINTED of 12. The reveal: she corrects the bill in red pen, like an answer sheet:
// "Wrong answer. See me." The rule: match the bill's reading to the meter, digit by digit. Loops to frame 1.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "storyteller" | "kamala"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626", PEN = "#c1121f";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const HANDF = (s: number) => `700 ${s}px Caveat`;
export const PRINTED = { right: 12, of: 12 };   // the printed-digit follow-up (series/scripts/creative22_demo/printed.json)
const KAMALA: Record<number, [BillMood, BillArms]> = {
  1: ["shock", "up"], 2: ["shock", "up"], 10: ["calm", "fold"], 11: ["smug", "rest"], 12: ["smug", "rest"],
};
const SEGS: Record<string, string> = { "0": "abcfed", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };

// ---------- pieces ----------
const fit = (c: Ctx, t: string, max: number, size: number, w = 900, min = 24) => {
  let fs = size; c.font = SANS(fs, w); while (c.measureText(t).width > max && fs > min) { fs -= 2; c.font = SANS(fs, w); }
  return fs;
};
// one seven-segment digit at (x, y), w x h; `lit` overrides which segments are on (for the 6 -> 8 moment)
const segDigit = (c: Ctx, d: string, x: number, y: number, w: number, h: number, on: string, off: string, lit?: string, extra?: { seg: string; col: string; k: number }) => {
  const t = w * 0.17;
  const P: Record<string, [number, number][]> = {
    a: [[x + t, y], [x + w - t, y], [x + w - 2 * t, y + t], [x + 2 * t, y + t]],
    b: [[x + w, y + t], [x + w, y + h / 2 - t / 2], [x + w - t, y + h / 2 - t], [x + w - t, y + 2 * t]],
    c: [[x + w, y + h / 2 + t / 2], [x + w, y + h - t], [x + w - t, y + h - 2 * t], [x + w - t, y + h / 2 + t]],
    d: [[x + t, y + h], [x + w - t, y + h], [x + w - 2 * t, y + h - t], [x + 2 * t, y + h - t]],
    e: [[x, y + h / 2 + t / 2], [x, y + h - t], [x + t, y + h - 2 * t], [x + t, y + h / 2 + t]],
    f: [[x, y + t], [x, y + h / 2 - t / 2], [x + t, y + h / 2 - t], [x + t, y + 2 * t]],
    g: [[x + t, y + h / 2], [x + 2 * t, y + h / 2 - t / 2], [x + w - 2 * t, y + h / 2 - t / 2], [x + w - t, y + h / 2], [x + w - 2 * t, y + h / 2 + t / 2], [x + 2 * t, y + h / 2 + t / 2]],
  };
  const litS = lit ?? SEGS[d];
  "abcdefg".split("").forEach((s) => {
    c.beginPath(); P[s].forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
    c.fillStyle = extra && extra.seg === s && extra.k > 0 ? extra.col : litS.includes(s) ? on : off; c.fill();
  });
};
const lcd = (c: Ctx, x: number, y: number, s: number, reading: string, mark: number[] = [], k = 1) => {
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#e5e7e0"; rrect(c, -40, -60, 640, 340, 30); c.fill(); c.strokeStyle = "#475569"; c.lineWidth = 6; rrect(c, -40, -60, 640, 340, 30); c.stroke();
  c.font = SANS(22, 700); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("ENERGY METER", -10, -22);
  c.fillStyle = "#94ab78"; rrect(c, 0, 0, 560, 200, 8); c.fill(); c.strokeStyle = "#1f2937"; c.lineWidth = 5; c.strokeRect(0, 0, 560, 200);
  [...reading].forEach((d, i) => {
    segDigit(c, d, 26 + i * 106, 26, 78, 148, "#1a1f14", "#8ea173");
    if (mark.includes(i)) { c.strokeStyle = PEN; c.lineWidth = 7; c.beginPath(); c.ellipse(65 + i * 106, 100, 58, 92, 0, 0, 7); c.stroke(); }
  });
  c.font = SANS(26, 800); c.fillStyle = "#1f2937"; c.fillText("kWh", 486, 190);
  c.restore();
};
const bill = (c: Ctx, x: number, y: number, s: number, k: number, red: number, see: number, rot = -0.04) => {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.18)"; rrect(c, -290, -360, 600, 740, 14); c.fill();
  c.fillStyle = "#fffdf6"; rrect(c, -300, -370, 600, 740, 14); c.fill();
  c.fillStyle = "#1e3a8a"; c.fillRect(-300, -370, 600, 90);
  c.font = SANS(36, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("ELECTRICITY BILL", 0, -312);
  c.textAlign = "left"; c.fillStyle = INK; c.font = SANS(30, 700);
  const rows: [string, string][] = [["Name", "Kamala"], ["Previous reading", "65994"], ["Present reading", "86111"], ["Units", "20,117"]];
  rows.forEach(([a, b], i) => { c.fillStyle = "#475569"; c.fillText(a, -260, -210 + i * 62); c.fillStyle = INK; c.textAlign = "right"; c.fillText(b, 260, -210 + i * 62); c.textAlign = "left"; });
  c.fillStyle = "#fee2e2"; rrect(c, -270, 60, 540, 130, 14); c.fill();
  c.font = SANS(30, 800); c.fillStyle = "#991b1b"; c.fillText("AMOUNT DUE", -240, 108);
  c.font = SANS(64, 900); c.textAlign = "right"; c.fillText("₹1,60,936", 250, 170);
  c.textAlign = "left";
  if (red > 0) {   // the teacher's red pen: 86111 struck, 66114 written in, units 120
    c.strokeStyle = PEN; c.lineWidth = 6; c.lineCap = "round";
    const r1 = clamp(red * 3);
    c.beginPath(); c.moveTo(150, -82); c.lineTo(150 + 120 * r1, -82); c.stroke();
    c.font = HANDF(54); c.fillStyle = PEN; c.globalAlpha = clamp(k * 3) * clamp(red * 3 - 1);
    c.fillText("66114", 80, -120); c.fillText("120", 160, -6);
    c.beginPath(); c.moveTo(150, -20); c.lineTo(260, -20); c.stroke();
    c.globalAlpha = clamp(k * 3);
  }
  if (see > 0) {
    c.save(); c.translate(-30, 290); c.rotate(-0.08); c.globalAlpha = clamp(see * 3);
    c.font = HANDF(96); c.fillStyle = PEN; c.textAlign = "center"; c.fillText("See me.", 0, 0);
    c.strokeStyle = PEN; c.lineWidth = 6; c.beginPath(); c.moveTo(-170, 26); c.quadraticCurveTo(0, 46, 170, 22); c.stroke();
    c.restore();
  }
  c.restore();
};
const room = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#f5e6c8"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#e9d4a7"; c.fillRect(0, 1240, W, H - 1240);   // the floor
  c.fillStyle = "#cbb27f"; c.fillRect(0, 1232, W, 12);
  c.fillStyle = "#8b6b3e"; rrect(c, 620, 1050, 380, 30, 8); c.fill(); c.fillRect(650, 1080, 22, 160); c.fillRect(948, 1080, 22, 160);   // a small table
  // a calendar, a clock: home
  c.fillStyle = "#fff7ed"; rrect(c, 820, 330, 170, 200, 10); c.fill(); c.fillStyle = RED; c.fillRect(820, 330, 170, 40);
  c.beginPath(); c.arc(170, 360, 62, 0, 7); c.fillStyle = "#fff"; c.fill(); c.strokeStyle = "#78350f"; c.lineWidth = 8; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(170, 360); c.lineTo(170, 318); c.moveTo(170, 360); c.lineTo(204, 372); c.stroke();
};
const phoneShot = (c: Ctx, W: number, f: number, t0: number, readK: number) => {
  c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#0b1020"; rrect(c, 150, 230, 780, 1240, 60); c.fill();
  c.fillStyle = "#111827"; rrect(c, 180, 300, 720, 1100, 30); c.fill();
  c.font = SANS(34, 800); c.fillStyle = "#e5e7eb"; c.textAlign = "center"; c.fillText("Bill app · photo reading", W / 2, 360);
  lcd(c, 260, 520, 0.95, "66114", [], 1);   // the camera's view of her meter
  c.strokeStyle = "#fde68a"; c.lineWidth = 6; c.setLineDash([24, 14]); c.strokeRect(230, 470, 620, 380); c.setLineDash([]);
  if (readK > 0) {
    c.save(); c.globalAlpha = clamp(readK * 3);
    c.fillStyle = "#14532d"; rrect(c, 210, 950, 660, 230, 26); c.fill();
    c.font = SANS(34, 800); c.fillStyle = "#bbf7d0"; c.fillText("READ ✓", W / 2, 1010);
    c.font = SANS(110, 900); c.fillStyle = "#fff"; c.fillText("86111", W / 2, 1140);
    c.restore();
  }
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], col = "#fde68a") => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  const fs = fit(c, title, W - 80, 58); c.font = SANS(fs, 900); c.fillStyle = col; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; sub.forEach((t, i) => c.fillText(t, W / 2, 386 + i * 50));
};
const miniMeter = (c: Ctx, x: number, y: number, reading: string, ok: boolean, k: number, printed = false) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#94ab78"; rrect(c, x, y, 200, 70, 8); c.fill();
  if (printed) { c.font = SANS(48, 900); c.fillStyle = "#1a1f14"; c.textAlign = "center"; c.fillText(reading, x + 100, y + 54); }
  else [...reading].forEach((d, i) => segDigit(c, d, x + 12 + i * 37, y + 10, 26, 50, "#1a1f14", "#8ea173"));
  c.font = SANS(56, 900); c.fillStyle = ok ? "#4ade80" : "#f87171"; c.textAlign = "left"; c.fillText(ok ? "✓" : "✗", x + 208, y + 56);
  c.restore();
};
const TEST = ["66114", "02733", "86450", "48160", "26357", "86988", "91471", "61373", "45358", "42629", "20699", "65091"];

// ---------- the scene ----------
const StMeter: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (!["wide", "hook"].includes(b.shot) && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.18} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.85 : 0.75} />, <Sfx key={k("c")} at={0} src={CLAP} vol={0.3} />, <Sfx key={k("h")} at={cue(i, 1, 0.5) - 2} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "app") sfx.push(<Sfx key={k("s")} at={at + 10} src="audio/sfx_tick.wav" vol={0.35} />);
    if (b.prop === "read") sfx.push(<Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "meter") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5)} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "segs") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - 3} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.8} />, <Sfx key={k("g")} at={c1 + 2} src="reel/sfx_buzz.wav" vol={0.25} />); }
    if (b.prop === "printed") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "pen") sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={0.3} />, ...[0, 8, 16, 24].map((q) => <Sfx key={k("t" + q)} at={at + 12 + q} src="audio/sfx_tick.wav" vol={0.2} />));
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 12)} src={CLAP} vol={0.35} />, <Sfx key={k("h")} at={Math.max(0, at - 14)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.4)} src="reel/sfx_boom.wav" vol={0.7} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(2222 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "phone") {
          phoneShot(c, W, f, ln.from, b.prop === "read" ? seg(f, ln.from, ln.from + 8) : 0);
        } else if (b.shot === "meter") {
          c.fillStyle = "#f5e6c8"; c.fillRect(0, 0, W, H);
          c.font = SANS(40, 900); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("HER METER", W / 2, 300);
          lcd(c, 240, 380, 1.0, "66114", [0, 4], 1);
          const k2 = seg(f, ln.from + 4, ln.from + 12);
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.font = SANS(40, 900); c.fillStyle = "#475569"; c.fillText("THE APP READ", W / 2, 830);
            c.font = SANS(150, 900); [..."86111"].forEach((d, q) => { c.fillStyle = q === 0 || q === 4 ? RED : INK; c.fillText(d, 250 + q * 145, 1000); });
            c.restore();
          }
          tag(c, "+20,000 units", W / 2, 1160, 76, "#fee2e2", "#991b1b", -0.03, seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
          c.save(); c.globalAlpha = seg(f, cu(1, 0.4) + 10, cu(1, 0.4) + 18); c.font = SANS(34, 700); c.fillStyle = "#475569"; c.textAlign = "center";
          c.fillText("1st digit: 6 → 8 (+20,000) · 5th: 4 → 1", W / 2, 1260); c.restore();
        } else if (b.shot === "segs") {
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("A SIX AND AN EIGHT", W / 2, 320);
          c.fillStyle = "#94ab78"; rrect(c, 140, 420, 800, 520, 24); c.fill();
          const c1 = cu(1, 0.4), kk = seg(f, c1, c1 + 10);
          segDigit(c, "6", 220, 470, 220, 420, "#1a1f14", "#8ea173");
          segDigit(c, "8", 640, 470, 220, 420, "#1a1f14", "#8ea173");
          segDigit(c, "6", 220, 470, 220, 420, "#1a1f14", "#8ea173", undefined, { seg: "b", col: "#facc15", k: kk });
          tag(c, "one line apart", W / 2, 1100, 66, "#fde68a", INK, -0.02, seg(f, c1 + 8, c1 + 16));
          c.save(); c.globalAlpha = seg(f, c1 + 16, c1 + 24); c.font = SANS(38, 700); c.fillStyle = "#e2e8f0"; c.fillText("a little glare on that line, and a 6 reads as an 8", W / 2, 1220); c.restore();
        } else if (b.shot === "test") {
          const printed = b.prop === "printed";
          dark(c, W, H, printed ? "THE SAME 12 READINGS, PRINTED PLAINLY" : "OUR TEST: 24 METER PHOTOS WE DREW",
            printed ? ["the same small free AI"] : ["12 readings × 2 styles (clean, phone-like)", "a small free AI that reads photos, offline"]);
          if (!printed) {
            const c1 = cu(1, 0.4);
            TEST.forEach((t, q) => miniMeter(c, 110 + (q % 3) * 300, 520 + Math.floor(q / 3) * 110, t, false, seg(f, ln.from + q * 2, ln.from + q * 2 + 6)));
            c.save(); c.globalAlpha = seg(f, c1, c1 + 8); c.font = SANS(120, 900); c.fillStyle = "#f87171"; c.textAlign = "center"; c.fillText("0 / 24", W / 2, 1110); c.restore();
            c.save(); c.globalAlpha = seg(f, c1 + 14, c1 + 22); c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("clean: 0 of 12 · phone-like: 0 of 12", W / 2, 1200); c.restore();
          } else {
            const c1 = cu(1, 0.4);
            TEST.forEach((t, q) => miniMeter(c, 110 + (q % 3) * 300, 520 + Math.floor(q / 3) * 110, t, q < PRINTED.right, seg(f, ln.from + q * 2, ln.from + q * 2 + 6), true));
            c.save(); c.globalAlpha = seg(f, c1, c1 + 8); c.font = SANS(120, 900); c.fillStyle = "#4ade80"; c.textAlign = "center"; c.fillText(`${PRINTED.right} / ${PRINTED.of}`, W / 2, 1110); c.restore();
            tag(c, "it reads print; meter digits fool it", W / 2, 1230, 50, "#fde68a", INK, -0.02, seg(f, c1 + 12, c1 + 20));
          }
        } else if (b.shot === "rule") {
          room(c, W, H);
          c.fillStyle = "rgba(15,23,42,0.9)"; c.fillRect(0, 0, W, H);
          const rows: [string, string, number][] = [["THE APP SHOWS A READING", "before you tap OK:", ln.from + 2], ["Check it against", "your meter, digit by digit", cu(1, 0.4)], ["Already billed?", "complain with a dated meter photo", cu(2, 0.7)]];
          rows.forEach(([a, bb, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 330 + q * 280;
            c.fillStyle = q === 0 ? "#fde68a" : "#f8fafc"; rrect(c, 90, y, W - 180, 230, 26); c.fill();
            c.font = SANS(58, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a, W / 2, y + 96); c.font = SANS(42, 700); c.fillText(bb, W / 2, y + 168);
            c.restore();
          });
        } else {
          // ---------- her room ----------
          const hookOn = b.prop === "hook" || loopOn;
          const z = 1 + 0.025 * p;
          const shake = (b.prop === "hook" && p < 0.1) || (loopOn && f < slam + 10) ? 8 : 0;
          c.save(); c.translate(W / 2 + (shake ? (r() - 0.5) * shake : 0), H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
          room(c, W, H);
          lcd(c, 90, 600, 0.42, "66114", [], 1);   // the meter on the wall
          const [m, a] = loopOn ? (["smug", "rest"] as [BillMood, BillArms]) : KAMALA[n] ?? ["calm", "rest"];
          person(c, "kamala" as BillWho, [360, 1330], 0.72, m, a, b.who === "kamala" && talking, r);
          c.restore();
          if (n === 2) {   // script review: say the story is made up
            c.save(); c.font = SANS(32, 800); const tt = "a made-up story · \"86111\" is a real answer from our test"; const tw = c.measureText(tt).width + 40;
            c.fillStyle = "rgba(15,23,42,0.85)"; rrect(c, 540 - tw / 2, 220, tw, 56, 14); c.fill(); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(tt, 540, 259); c.restore();
          }
          if (hookOn) {
            const blk = (x: number, k: string, v: string, col: string) => {
              c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, 218, 460, 200, 22); c.fill();
              c.fillStyle = "#111827"; rrect(c, x, 210, 460, 200, 22); c.fill();
              c.font = SANS(34, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(k, x + 230, 262);
              const fs = fit(c, v, 420, 96); c.font = SANS(fs, 900); c.fillStyle = col; c.fillText(v, x + 230, 380);
            };
            blk(55, "HER USUAL BILL", "₹960", "#4ade80"); blk(565, "THIS MONTH", "₹1,60,936", "#f87171");
          }
          const billK = hookOn || ["shock", "teacher", "pen", "loop"].includes(b.prop) ? 1 : 0;
          const red = b.prop === "pen" ? seg(f, ln.from + 8, ln.from + 40) : b.prop === "loop" || loopOn ? 1 : 0;
          const see = loopOn ? 0 : b.prop === "loop" ? seg(f, cu(1, 0.3), cu(1, 0.3) + 10) : 0;
          const big = !hookOn && ["pen", "loop"].includes(b.prop);   // stills: the red pen was too small to read
          if (billK) bill(c, big ? 690 : 760, big ? 800 : hookOn ? 900 : 860, big ? 0.98 : hookOn ? 0.62 : 0.7, 1, hookOn ? 0 : red, see);
        }
      }} />
    </>
  );
};

export const METER_SCENES = { sk_meter: StMeter };
