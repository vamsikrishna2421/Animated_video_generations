import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 18 "₹3,100 back? ₹0." (series/scripts/creative18_tatkal.md): a railway-announcement parody at home. Ramesh
// babai asked an AI chat before cancelling 4 confirmed Tatkal tickets: "50% refund, Rs 3,100". IRCTC refunded ₹0 ("No
// refund will be granted on cancellation of confirmed Tatkal tickets"). It wrote what a refund rule usually sounds like.
// Our test (series/scripts/creative18_demo/tatkal_7B.json, read by hand): the plain ask right 1 of 10, a made-up rule 9 of
// 10, refunds ₹930 to ₹4,650; "only the official rule, say if you're not sure": no refund 8 of 10, check IRCTC 10 of 10.
// The rule: ask where it's written, open that page. The loop: "do I at least get the Tatkal charges back?" "50%!" ->
// frame 1. Every reveal gets the station chime (our own synth, audio/sfx_chime.wav). One beat per line.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ramesh" | "keerthi" | "sunny"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 30;
const CLAP = "reel/creative09v1/clap.wav", CHIME = "audio/sfx_chime.wav";
const RED = "#dc2626", AMBER = "#fbbf24";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 800) => `${w} ${s}px "Courier New", monospace`;
const MOOD: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { keerthi: ["shock", "up"], ramesh: ["worried", "phone"], sunny: ["deadpan", "fold"] },
  2: { keerthi: ["worried", "rest"], ramesh: ["angry", "phone"], sunny: ["deadpan", "fold"] },
  3: { keerthi: ["worried", "rest"], ramesh: ["shock", "phone"], sunny: ["calm", "phone"] },
  4: { keerthi: ["deadpan", "fold"], ramesh: ["excited", "up"], sunny: ["smug", "fold"] },
  7: { keerthi: ["deadpan", "fold"], ramesh: ["shock", "up"], sunny: ["smug", "fold"] },
  9: { keerthi: ["happy", "rest"], ramesh: ["calm", "phone"], sunny: ["calm", "up"] },
  10: { keerthi: ["worried", "rest"], ramesh: ["excited", "phone"], sunny: ["shock", "up"] },
};
const SPOT: Record<string, [number, number, number]> = { keerthi: [200, 1220, 0.6], ramesh: [540, 1160, 0.66], sunny: [880, 1230, 0.58] };

// ---------- pieces ----------
const wall = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#fde7c7"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#e7c9a0"; c.fillRect(0, 1120, W, H - 1120);
  c.fillStyle = "#fff7ed"; rrect(c, 820, 930, 180, 150, 8); c.fill();   // the calendar
  c.fillStyle = RED; c.fillRect(820, 930, 180, 34); c.font = SANS(22, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("NOVEMBER", 910, 956);
  c.font = SANS(60, 900); c.fillStyle = INK; c.fillText("4", 910, 1050);
};
// a split-flap board (screen space): rows of [label, value, colour]
const flaps = (c: Ctx, W: number, y: number, head: string, rows: [string, string, string][], k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 130 + rows.length * 176;
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 48, y + 8, W - 96, h, 22); c.fill();
  c.fillStyle = "#111827"; rrect(c, 40, y, W - 96, h, 22); c.fill();
  c.font = SANS(40, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText(head, W / 2 - 8, y + 70);
  rows.forEach(([lab, val, col], q) => {
    const yy = y + 110 + q * 176;
    c.font = SANS(36, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(lab, 80, yy + 34);
    // the value in flap tiles
    let fs = 104; c.font = MONO(fs, 900); while ((c.measureText("M").width + 10) * val.length > W - 180 && fs > 40) { fs -= 4; c.font = MONO(fs, 900); }   // as big as fits: read in the grid
    const cw = c.measureText("M").width + 10; let x = 80;
    for (const ch of val) {
      c.fillStyle = "#1f2937"; rrect(c, x, yy + 48, cw - 6, fs + 18, 6); c.fill();
      c.strokeStyle = "#0b0f19"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, yy + 48 + (fs + 18) / 2); c.lineTo(x + cw - 6, yy + 48 + (fs + 18) / 2); c.stroke();
      c.fillStyle = col; c.textAlign = "center"; c.fillText(ch, x + (cw - 6) / 2, yy + 48 + fs - 2);
      x += cw;
    }
  });
  c.restore();
};
// his phone (screen space, bottom-centre or big): a chat bubble or an SMS
const phoneCard = (c: Ctx, x: number, y: number, w: number, title: string, lines: string[], k: number, col = "#dbeafe", fg = "#1e3a8a") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 110 + lines.length * 56;
  c.fillStyle = "#0f172a"; rrect(c, x - 10, y - 10, w + 20, h + 20, 30); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, h, 22); c.fill();
  c.font = SANS(30, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(title, x + 26, y + 46);
  c.fillStyle = col; rrect(c, x + 20, y + 66, w - 40, h - 86, 18); c.fill();
  c.font = SANS(40, 800); c.fillStyle = fg; lines.forEach((t, q) => c.fillText(t, x + 44, y + 120 + q * 56));
  c.restore();
};
const dark = (c: Ctx, W: number, H: number, title: string, sub: string[]) => {
  c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
  let fs = 60; c.font = SANS(fs, 900); while (c.measureText(title).width > W - 80 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(title, W / 2, 320);
  c.font = SANS(38, 700); c.fillStyle = "#f8fafc"; sub.forEach((t, i) => c.fillText(t, W / 2, 390 + i * 52));
};
const card = (c: Ctx, t: string, sub: string, x: number, y: number, w: number, h: number, bg: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bg; rrect(c, x - w / 2, y - h / 2, w, h, 26); c.fill();
  c.textAlign = "center"; c.fillStyle = fg;
  let fs = 50; c.font = SANS(fs, 900); while (c.measureText(t).width > w - 40 && fs > 30) { fs -= 2; c.font = SANS(fs, 900); }
  c.fillText(t, x, y - (sub ? 8 : -16));
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
const StTatkal: React.FC<SP> = ({ s }) => {
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
    if (["how", "test"].includes(b.shot) && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("wr")} at={Math.max(0, at - 26)} src="reel/sfx_riser.wav" vol={0.16} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("ch")} at={0} src={CHIME} vol={0.5} />, <Sfx key={k("a")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={te ? 0.8 : 0.9} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.35} />, <Sfx key={k("z")} at={cue(i, 1, 0.5) + 2} src="reel/sfx_buzz.wav" vol={0.25} />);
    if (b.prop === "asked") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "irctc") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.5) - 6} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "announce") sfx.push(<Sfx key={k("ch")} at={Math.max(0, at - 22)} src={CHIME} vol={0.5} />, <Sfx key={k("n")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.7} />);   // script review: the announcer joke
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />, <Sfx key={k("g")} at={c1 + 14} src="reel/sfx_glitch.wav" vol={0.2} />); }
    if (b.prop === "official") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - 2} src="audio/sfx_success.wav" vol={0.3} />); }
    if (b.prop === "rule") sfx.push(<Sfx key={k("h")} at={Math.max(0, at - 14)} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />, <Sfx key={k("a")} at={at + 30} src={CLAP} vol={0.35} />);
    if (b.prop === "loop") {
      const slam = end + HOLD, c1 = cue(i, 1, 0.6);
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={c1 - 6} src="audio/gag_ding.wav" vol={0.3} />,
        <Sfx key={k("ch")} at={slam - 24} src={CHIME} vol={0.5} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
    }
  });
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
        const r = rng(1818 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const faceOf = (who: BillWho, md: [BillMood, BillArms]) => inset(c, who, md, b.who === who && talking, r);
        if (b.shot === "how") {
          dark(c, W, H, "HOW IT ANSWERED", []);
          const t0 = ln.from - 4, c1 = cu(1, 0.4);
          card(c, "NO LOOKUP", "", W / 2, 470, W - 200, 140, "#e0e7ff", "#1e3a8a", seg(f, t0, t0 + 8));   // script review: a paragraph -> three words
          card(c, "A MADE-UP RULE", "\"50% if 48 hours before\"", W / 2, 690, W - 200, 160, "#ffedd5", "#9a3412", seg(f, c1 - 4, c1 + 4));
          card(c, "A NUMBER: ₹3,100", "", W / 2, 910, W - 200, 140, "#fee2e2", "#991b1b", seg(f, c1 + 14, c1 + 22));
          faceOf("ramesh", ["shock", "phone"]);
          return;
        }
        if (b.shot === "test") {
          dark(c, W, H, "OUR TEST", ["a small free AI on a laptop, offline (Qwen2.5 7B)", "\"4 confirmed Tatkal tickets, ₹6,200. Refund?\" · 10 tries"]);
          const off = b.prop === "official";
          if (!off) {
            const c1 = b.prop === "test" ? cu(1, 0.5) : -1e9;
            barRow(c, "right: no refund", 1, 10, 600, "#4ade80", seg(f, c1 - 2, c1 + 8));
            barRow(c, "made up a refund rule", 9, 10, 760, "#f87171", seg(f, c1 + 2, c1 + 12));
            const kc = seg(f, c1 + 16, c1 + 24);
            if (kc > 0) {
              c.save(); c.globalAlpha = kc; c.font = SANS(36, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("its refunds:", W / 2, 940);
              ["₹930", "₹1,550", "₹3,100", "₹4,650"].forEach((t, q) => { c.fillStyle = "#fde68a"; rrect(c, 70 + q * 240, 970, 220, 96, 16); c.fill(); c.font = SANS(50, 900); c.fillStyle = INK; c.fillText(t, 180 + q * 240, 1036); });
              c.restore();
            }
            c.save(); c.font = SANS(40, 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("a small AI with no internet: try yours", W / 2, 1180); c.restore();
            faceOf(b.who === "ramesh" ? "ramesh" : "sunny", b.who === "ramesh" ? ["shock", "up"] : ["smug", "fold"]);
          } else {
            c.save(); c.fillStyle = "#1e293b"; rrect(c, 60, 500, W - 120, 120, 20); c.fill();
            c.font = SANS(38, 800); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("+ \"ONLY THE OFFICIAL RULE.", W / 2, 548); c.fillText("NOT SURE? SAY SO.\"", W / 2, 596); c.restore();
            const c1 = cu(1, 0.4);
            barRow(c, "no refund (right)", 8, 10, 740, "#4ade80", seg(f, c1 - 2, c1 + 8));
            barRow(c, "still a refund: ₹3,100 · ₹5,890", 2, 10, 900, "#f87171", seg(f, c1 + 20, c1 + 30));   // script review: say the misses
            c.save(); c.globalAlpha = seg(f, c1 + 34, c1 + 42); c.font = SANS(40, 900); c.fillStyle = "#93c5fd"; c.textAlign = "center"; c.fillText("all 10: \"check the official site\"", W / 2, 1080); c.restore();
            faceOf("keerthi", ["happy", "rest"]);
          }
          return;
        }
        // ---------- the room ----------
        const hookOn = b.prop === "hook" || loopOn;
        const shake = (b.prop === "hook" && f < cu(1, 0.5) + 8 && f > cu(1, 0.5)) || (loopOn && f < slam + 10) ? 9 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.save(); c.translate(sx, sy);
        wall(c, W, H);
        (["keerthi", "ramesh", "sunny"] as BillWho[]).forEach((who) => {
          const [x, y, sc] = SPOT[who];
          const md = (loopOn ? MOOD[1] : MOOD[n] ?? MOOD[1])[who] ?? ["calm", "rest"];
          person(c, who, [x, y], sc, md[0], md[1], b.who === who && talking && !loopOn, r);
        });
        c.restore();
        if (hookOn || b.prop === "asked") {   // frame 1: the board (readable with the sound off)
          flaps(c, W, 210, "4 TATKAL TICKETS · ₹6,200", [["AI SAID (50%):", "₹3,100 BACK", AMBER], ["IRCTC REFUND:", "₹0", "#f87171"]], 1);   // script review: the fare, so the numbers add up; ₹0 once
        }
        if (b.prop === "asked") phoneCard(c, 90, 690, 900, "AI Chat · 2 days ago", ["\"...eligible for a 50% refund:", "50% of Rs 6,200 = Rs 3,100\""], seg(p, 0.3, 0.45));
        if (b.prop === "irctc") {
          const k = seg(f, cu(1, 0.5) - 16, cu(1, 0.5) - 6);
          c.save(); c.globalAlpha = clamp(k * 3);
          c.fillStyle = "#fffdf5"; rrect(c, 60, 230, W - 120, 470, 26); c.fill();
          c.strokeStyle = "#1e3a8a"; c.lineWidth = 6; rrect(c, 76, 246, W - 152, 438, 18); c.stroke();
          c.font = SANS(36, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText("IRCTC · e-ticket cancellation rules", W / 2, 320);
          c.font = SANS(58, 900); c.fillStyle = INK; ["\"No refund will be granted", "on cancellation of", "confirmed Tatkal tickets.\""].forEach((t, q) => c.fillText(t, W / 2, 420 + q * 76));
          c.font = SANS(28, 700); c.fillStyle = "#475569"; c.fillText("contents.irctc.co.in", W / 2, 660); c.restore();
        }
        if (b.prop === "announce") flaps(c, W, 210, "PASSENGERS, KINDLY NOTE", [["RAMESH GARU'S REFUND:", "₹0", "#f87171"]], seg(p, 0, 0.1));
        if (b.prop === "again") tag(c, "a different refund every time?!", W / 2, 520, 56, "#fef3c7", INK, -0.03, seg(p, 0.1, 0.3));
        if (b.prop === "rule") flaps(c, W, 210, "MONEY RULES: REFUNDS · FEES · FINES", [["THE AI'S NUMBER:", "A GUESS", AMBER], ["ASK IT:", "WHERE WRITTEN?", "#93c5fd"], ["THEN:", "OPEN THAT PAGE", "#4ade80"]], seg(p, 0, 0.1));
        if (b.prop === "loop" && !loopOn) {
          const c1 = cu(1, 0.6);
          phoneCard(c, 90, 600, 900, "AI Chat", ["\"Are you sure?\""], seg(p, 0.05, 0.2), "#e2e8f0", INK);
          phoneCard(c, 90, 820, 900, "AI Chat", ["\"Yes, I'm sure! Refund: Rs 3,100.\""], seg(f, c1 - 10, c1 - 2), "#dcfce7", "#14532d");
        }
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const TATKAL_SCENES = { sk_tatkal: StTatkal };
