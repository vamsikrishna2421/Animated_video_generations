import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 20 "200 cards say Sunday" (series/scripts/creative20_sunday_wednesday.md): a breaking-news parody at home.
// Vijaya atta picked 16 December 2026 for her daughter's engagement because Mohan mama's AI chat said it was a Sunday;
// 200 cards are printed and ₹25,000 paid for the hall. It's a Wednesday. Nephew Tarun plays the anchor. Our test
// (series/scripts/creative20_demo/days_7B.json, read by hand): asked 10 times, Sunday 7, Tuesday 2, Wednesday 1; 20 dates,
// just the day: 6 right; told to count from 1 January: 2 right. The rule: open the calendar. The loop: "once more...
// Sunday, it says!" -> frame 1. Every reveal gets our own news sting (audio/sfx_newssting.wav).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "tarun" | "vijaya" | "mohan"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 30;
const STING = "audio/sfx_newssting.wav", CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#fbbf24";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, sans-serif`;
// our test, read by hand
const TILES: [string, number, boolean][] = [["SUN", 7, false], ["TUE", 2, false], ["WED", 1, true]];
const MOOD: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { tarun: ["excited", "up"], vijaya: ["shock", "up"], mohan: ["worried", "phone"] },
  2: { tarun: ["deadpan", "fold"], vijaya: ["angry", "up"], mohan: ["worried", "phone"] },
  3: { tarun: ["deadpan", "fold"], vijaya: ["angry", "fold"], mohan: ["smug", "phone"] },
  5: { tarun: ["calm", "rest"], vijaya: ["shock", "up"], mohan: ["worried", "phone"] },
  7: { tarun: ["deadpan", "fold"], vijaya: ["deadpan", "fold"], mohan: ["smug", "phone"] },
  9: { tarun: ["calm", "rest"], vijaya: ["worried", "up"], mohan: ["worried", "rest"] },
  11: { tarun: ["shock", "up"], vijaya: ["shock", "up"], mohan: ["excited", "phone"] },
};
const SPOT: Record<string, [number, number, number]> = { vijaya: [230, 1230, 0.62], mohan: [850, 1230, 0.62], tarun: [540, 1150, 0.56] };

// ---------- pieces ----------
const room = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#fde7c7"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#e7c9a0"; c.fillRect(0, 1120, W, H - 1120);
  c.fillStyle = "#fff7ed"; rrect(c, 820, 900, 180, 160, 8); c.fill();   // the wall calendar
  c.fillStyle = RED; c.fillRect(820, 900, 180, 34); c.font = SANS(22, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("DEC 2026", 910, 926);
  c.font = SANS(18, 700); c.fillStyle = INK; ["M T W T F S S", "14 15 16 17 18 19 20"].forEach((t, q) => c.fillText(t, 910, 980 + q * 30));
  c.strokeStyle = RED; c.lineWidth = 4; c.beginPath(); c.ellipse(897, 1004, 15, 13, 0, 0, 7); c.stroke();   // 16 circled, under W
  c.fillStyle = "#fef3c7"; c.fillRect(40, 950, 260, 70); c.strokeStyle = "#a16207"; c.lineWidth = 3; c.strokeRect(40, 950, 260, 70);   // the card stack (stills: it hid behind her)
  c.font = SANS(36, 900); c.fillStyle = "#a16207"; c.textAlign = "center"; c.fillText("CARDS ×200", 170, 998);
};
const breaking = (c: Ctx, W: number, H: number, f: number) => {   // the red bar and the LIVE bug
  c.fillStyle = RED; c.fillRect(0, 1770, W, 90);   // stills: under the captions, not on them
  c.font = SANS(52, 900); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("BREAKING", 30, 1834);
  c.fillStyle = "#111827"; c.fillRect(300, 1770, W - 300, 90);
  c.font = SANS(38, 800); c.fillStyle = "#fde68a"; c.fillText("16 DEC 2026: SUNDAY? WEDNESDAY!", 330, 1830);
  c.fillStyle = Math.floor(f / 15) % 2 ? RED : "#7f1d1d"; c.beginPath(); c.arc(W - 360, 236, 12, 0, 7); c.fill();   // stills: the bug ran off the edge
  c.font = SANS(30, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("LIVE · LIVING ROOM", W - 340, 247);
};
const block = (c: Ctx, x: number, y: number, w: number, label: string, val: string, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 8, y + 10, w, 230, 24); c.fill();
  c.fillStyle = "#111827"; rrect(c, x, y, w, 230, 24); c.fill();
  c.font = SANS(40, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText(label, x + w / 2, y + 66);
  let fs = 104; c.font = SANS(fs, 900); while (c.measureText(val).width > w - 40 && fs > 50) { fs -= 4; c.font = SANS(fs, 900); }
  c.fillStyle = col; c.fillText(val, x + w / 2, y + 180);
  c.restore();
};
const invite = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.rotate(-0.04); c.scale(s, s);
  c.fillStyle = "#fffbeb"; rrect(c, -300, -150, 600, 300, 18); c.fill();
  c.strokeStyle = "#b45309"; c.lineWidth = 8; rrect(c, -284, -134, 568, 268, 12); c.stroke();
  c.font = SANS(34, 700); c.fillStyle = "#92400e"; c.textAlign = "center"; c.fillText("Sravya's engagement", 0, -70);
  c.font = SANS(56, 900); c.fillStyle = "#7c2d12"; c.fillText("SUNDAY", 0, 4);
  c.font = SANS(46, 900); c.fillText("16 DECEMBER 2026", 0, 70);
  c.restore();
};
const phoneCard = (c: Ctx, x: number, y: number, w: number, title: string, lines: string[], k: number, col = "#fee2e2", fg = "#991b1b") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 104 + lines.length * 60;
  c.fillStyle = "#0f172a"; rrect(c, x - 10, y - 10, w + 20, h + 20, 30); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, h, 22); c.fill();
  c.font = SANS(28, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(title, x + 24, y + 44);
  c.fillStyle = col; rrect(c, x + 18, y + 62, w - 36, h - 80, 18); c.fill();
  lines.forEach((t, q) => { let fs = 46; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 80 && fs > 26) { fs -= 2; c.font = SANS(fs, 900); } c.fillStyle = fg; c.fillText(t, x + 40, y + 122 + q * 60); });
  c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[], f = 0, r?: () => number) => {
  if (r) {   // render review: the parody stays on: TV graphics over the dimmed living room, the BREAKING bar still running
    room(c, W, H);
    (["vijaya", "mohan", "tarun"] as BillWho[]).forEach((who) => { const [x, y, sc] = SPOT[who]; person(c, who, [x, y], sc, who === "vijaya" ? "shock" : "calm", who === "vijaya" ? "up" : "rest", false, r); });
    c.fillStyle = "rgba(15,23,42,0.84)"; c.fillRect(0, 0, W, H);
    breaking(c, W, H, f);
  } else { c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H); }
  c.fillStyle = RED; c.fillRect(0, 250, W, 12);
  let fs = 62; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 340);
  c.font = SANS(40, 800); c.fillStyle = "#f8fafc"; sub.forEach((t, i) => c.fillText(t, W / 2, 410 + i * 54));
};
const card = (c: Ctx, t: string, sub: string, x: number, y: number, w: number, h: number, bg: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x - w / 2, y - h / 2, w, h, 26); c.fill();
  c.textAlign = "center"; c.fillStyle = fg;
  let fs = 56; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 40 && fs > 30) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillText(t, x, y - (sub ? 8 : -18));
  if (sub) { let ss = 38; c.font = SANS(ss, 700); while (c.measureText(sub).width > w - 40 && ss > 24) { ss -= 2; c.font = SANS(ss, 700); } c.fillText(sub, x, y + 46); }
  c.restore();
};
const inset = (c: Ctx, who: BillWho, m: [BillMood, BillArms], talk: boolean, r: () => number) => {
  c.save(); c.beginPath(); rrect(c, 820, 1270, 220, 210, 28); c.clip();
  c.fillStyle = "#334155"; c.fillRect(820, 1270, 220, 210);
  person(c, who, [930, 1420], 0.4, m[0], m[1], talk, r);
  c.restore();
  c.strokeStyle = "#fde68a"; c.lineWidth = 6; rrect(c, 820, 1270, 220, 210, 28); c.stroke();
};

// ---------- the scene ----------
const StNews: React.FC<SP> = ({ s }) => {
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
    if (["test", "how", "rule"].includes(b.shot) && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("b0")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.45} />, <Sfx key={k("s")} at={cue(i, 1, 0.5) - 6} src={STING} vol={te ? 0.5 : 0.45} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.35} />);   // render review: the sting on "Wednesday"
    if (b.prop === "hall") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 6} src="audio/sfx_chaching.wav" vol={0.3} />);
    if (b.prop === "asked") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 6} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("s")} at={Math.max(0, at - 24)} src={STING} vol={0.3} />, <Sfx key={k("h")} at={c1 - 4} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.6} />, ...TILES.map((_, q) => <Sfx key={k("t" + q)} at={c1 + q * 22} src="audio/sfx_tick.wav" vol={0.3} />)); }   // render review: a hit on "Sunday: seven"
    if (b.prop === "worse") { const c8 = cue(i, 1, 0.8); sfx.push(<Sfx key={k("n")} at={c8 - 4} src="reel/sfx_boom.wav" vol={te ? 0.5 : 0.65} />, <Sfx key={k("g")} at={c8 + 6} src="reel/sfx_glitch.wav" vol={0.25} />); }   // render review: the hit on "two", not after it
    if (b.prop === "rule") sfx.push(<Sfx key={k("s")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_success.wav" vol={0.3} />, <Sfx key={k("a")} at={cue(i, 1, 0.4) + 24} src={CLAP} vol={0.35} />);
    if (b.prop === "loop") {
      const slam = end + HOLD, c1 = cue(i, 1, 0.6);
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={c1 - 6} src="audio/gag_ding.wav" vol={0.3} />,
        <Sfx key={k("s")} at={slam - 10} src={STING} vol={0.45} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("what") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(2020 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const faceOf = (who: BillWho, md: [BillMood, BillArms]) => inset(c, who, md, b.who === who && talking, r);
        if (b.shot === "test") {
          dark(c, W, H, "OUR TEST", ["a small offline AI, no tools (Qwen2.5 7B)", "big apps may differ: try yours"], f, r);
          const c1 = cu(1, 0.45);
          if (b.prop === "test") {
            c.save(); c.font = SANS(50, 900); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText("\"What day of the week is", W / 2, 560); c.fillText("16 December 2026?\" · 10 asks", W / 2, 624); c.restore();
            TILES.forEach(([d, v, ok], q) => {
              const k = seg(f, c1 + q * 22 - 4, c1 + q * 22 + 4); if (k <= 0) return;
              const x = 90 + q * 320;
              c.save(); c.globalAlpha = clamp(k * 2);
              c.fillStyle = ok ? "#14532d" : "#7f1d1d"; rrect(c, x, 680, 260, 300, 26); c.fill();
              c.font = SANS(64, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(d, x + 130, 780);
              c.font = SANS(120, 900); c.fillStyle = ok ? "#86efac" : "#fca5a5"; c.fillText(`×${v}`, x + 130, 930);
              c.restore();
            });
            c.save(); c.globalAlpha = seg(f, c1 + 60, c1 + 68); c.font = SANS(48, 900); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("the right day: WEDNESDAY", W / 2, 1080); c.restore();
            faceOf("tarun", ["excited", "up"]);
          } else {   // "worse": two numbers
            card(c, "JUST THE DAY: 6/20", "20 dates, Dec 2026 to Jun 2027", W / 2, 640, W - 120, 190, "#fef3c7", INK, seg(f, c1 - 2, c1 + 6));   // render review: 6 of how many? shown when said
            card(c, "TOLD TO COUNT: 2/20", "\"count from 1 January 2026, a Thursday\"", W / 2, 880, W - 120, 190, "#fee2e2", "#991b1b", seg(f, cu(1, 0.8) - 4, cu(1, 0.8) + 4));
            card(c, "a blind guess: about 3/20", "", W / 2, 1090, W - 240, 120, "#1e293b", "#93c5fd", seg(f, cu(1, 0.8) + 14, cu(1, 0.8) + 22));   // render review: a number people can feel
            tag(c, "worse!", W / 2 + 330, 770, 64, AMBER, INK, 0.06, seg(f, cu(1, 0.8) + 2, cu(1, 0.8) + 8));
            faceOf("mohan", ["shock", "phone"]);
          }
          return;
        }
        if (b.shot === "how") {
          dark(c, W, H, "HOW IT ANSWERS", ["a small AI with no tools"], f, r);
          const c1 = cu(1, 0.4);
          card(c, "✗ NO CALENDAR INSIDE", "it doesn't count the days", W / 2, 600, W - 120, 200, "#fee2e2", "#991b1b", seg(f, ln.from + 2, ln.from + 10));
          card(c, "→ THE DAY THAT \"SOUNDS RIGHT\"", "a different one on different asks", W / 2, 860, W - 120, 200, "#fef3c7", INK, seg(f, c1 - 4, c1 + 4));
          faceOf("tarun", ["calm", "rest"]);
          return;
        }
        if (b.shot === "rule") {
          dark(c, W, H, "THE RULE", [], f, r);
          const c1 = cu(1, 0.4);
          card(c, "DATES & DAYS → YOUR PHONE'S CALENDAR", "it counts", W / 2, 560, W - 80, 200, "#dcfce7", "#14532d", seg(f, ln.from, ln.from + 8));   // render review: the card sat empty
          card(c, "THE AI'S DAY: A GUESS", "check it on the calendar", W / 2, 810, W - 120, 200, "#fee2e2", "#991b1b", seg(f, c1 + 20, c1 + 28));
          c.save(); c.globalAlpha = seg(f, c1 + 40, c1 + 48); c.font = SANS(44, 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("building with AI? work dates out in code", W / 2, 1020); c.restore();
          faceOf("tarun", ["happy", "up"]);
          return;
        }
        // ---------- the living room, live ----------
        const hookOn = b.prop === "hook" || loopOn;
        const hitAt = cu(1, 0.5);
        const shake = (b.prop === "hook" && f < hitAt + 8 && f > hitAt) || (loopOn && f < slam + 10) ? 9 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.save(); c.translate(sx, sy);
        room(c, W, H);
        (["vijaya", "mohan", "tarun"] as BillWho[]).forEach((who) => {
          const [x, y, sc] = SPOT[who];
          const md = (loopOn ? MOOD[1] : MOOD[n] ?? MOOD[1])[who] ?? ["calm", "rest"];
          person(c, who, [x, y], sc, md[0], md[1], b.who === who && talking && !loopOn, r);
        });
        if (b.who === "tarun" || hookOn) {   // his mic: a steel ladle
          c.save(); c.translate(610, 1170); c.rotate(-0.4); c.fillStyle = "#cbd5e1"; c.beginPath(); c.ellipse(0, -60, 30, 24, 0, 0, 7); c.fill(); c.fillRect(-6, -40, 12, 120); c.restore();
        }
        c.restore();
        breaking(c, W, H, f);
        if (hookOn) {   // frame 1: the two blocks, the card, the money (readable with the sound off)
          block(c, 40, 290, 490, "AI SAID", "SUNDAY", "#f87171", 1);
          block(c, 550, 290, 490, "CALENDAR", "WEDNESDAY", "#4ade80", 1);
          invite(c, W / 2, 720, 0.95);
          tag(c, "HALL: ₹25,000 PAID", W / 2, 930, 60, "#fee2e2", "#991b1b", 0.03, 1);
        }
        if (b.prop === "hall") {
          c.save(); c.globalAlpha = seg(p, 0.05, 0.2); c.translate(W / 2, 600); c.rotate(0.03);
          c.fillStyle = "#fffdf5"; rrect(c, -420, -190, 840, 380, 18); c.fill(); c.strokeStyle = "#475569"; c.lineWidth = 4; rrect(c, -400, -170, 800, 340, 12); c.stroke();   // render review: the text ran off the paper
          c.font = SANS(36, 800); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("Function hall · advance receipt", 0, -110);
          c.font = SANS(76, 900); c.fillStyle = INK; c.fillText("ADVANCE ₹25,000", 0, 0);
          c.font = SANS(40, 900); c.fillStyle = RED; c.fillText("NON-REFUNDABLE · WED 16 DEC", 0, 90);
          c.restore();
        }
        if (b.prop === "asked") phoneCard(c, 90, 420, 900, "AI Chat · Mohan's phone", ["\"16 December 2026", "is a Sunday.\""], seg(p, 0.25, 0.4));
        if (b.prop === "shock") tag(c, "can't even say what day the 16th is?!", W / 2, 520, 64, "#fef3c7", INK, -0.03, seg(p, 0.1, 0.3));
        if (b.prop === "count") tag(c, "\"count properly!\"", W / 2, 520, 72, "#e0e7ff", "#1e3a8a", 0.03, seg(p, 0.1, 0.3));
        if (b.prop === "what") tag(c, "so what do we do?!", W / 2, 520, 72, "#fef3c7", INK, -0.03, seg(p, 0.1, 0.3));
        if (b.prop === "loop" && !loopOn) {
          const c1 = cu(1, 0.6);
          phoneCard(c, 90, 420, 900, "AI Chat · Mohan's phone", ["\"What day is 16 December 2026?\""], seg(p, 0.05, 0.2), "#e2e8f0", INK);
          phoneCard(c, 90, 660, 900, "AI Chat", ["\"Sunday!\""], seg(f, c1 - 10, c1 - 2));
        }
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const NEWS_SCENES = { sk_news: StNews };
