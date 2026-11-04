import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";
import { room, sofaFront, person, AM, CH, S, Mood, Pose } from "./HomeCrayon";

// EP44 "Privacy: what happens to your data" (series/scripts/ep44_privacy.md): Amma pasted her bank statement (account
// number, PAN and all) into an AI chat to ask where her salary goes, then deleted the chat in one tap. Chinnu reads the
// app's own privacy page: a subset of chats is read by human reviewers, and a reviewed copy is kept apart from the account
// for up to three years; deleting the chat doesn't delete it (Google, Gemini Apps Privacy Hub, Oct 2026). Our test
// (series/scripts/ep44_demo): the same statement ten times with her IDs, ten times blanked out: the same help. The rule:
// blank names and numbers before you paste. The loop: she blanks the text, then attaches the passbook photo -> frame 1.
// The living room and the two of them come from HomeCrayon.tsx (skit 02). One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "amma" | "chinnu"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const CAM: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, hook: { z: 1.0, x: 540, y: 800 }, amma: { z: 1.4, x: 360, y: 760 }, chinnu: { z: 1.4, x: 740, y: 770 },
};
const HOLD = 16;   // frames of the photo going out before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const AMMA: Record<number, [Mood, Pose, number]> = {
  1: ["worried", "phone", 2], 2: ["shock", "mouth", 1], 4: ["stern", "tap", 1], 6: ["sus", "phone", 1], 10: ["puzzled", "phone", 1],
  11: ["happy", "tap", 2], 12: ["smug", "tap", 2], 13: ["shock", "phone", 1],
};
const CHINNU: Record<number, [Mood, Pose, number]> = {
  1: ["shock", "point", -1], 2: ["worried", "point", -1], 4: ["sus", "rest", -1], 6: ["smug", "rest", -1], 10: ["happy", "rest", -1],
  11: ["explain", "open", -1], 12: ["shock", "rest", -1], 13: ["panic", "point", -1],
};
const FACE: Record<number, Mood> = { 3: "shock", 5: "worried", 7: "puzzled", 8: "puzzled", 9: "shock" };   // Amma's face on the cards

// ---------- pieces ----------
// a face in a circle on the cards (Creative 16's render review: the family stays on screen through the cards)
const face = (c: Ctx, who: "amma" | "chinnu", m: Mood, x: number, y: number, rad: number, talk: boolean, f: number, r: () => number) => {
  const nk = who === "amma" ? AM : CH;
  c.save();
  c.beginPath(); c.arc(x, y, rad + 8, 0, 7); c.fillStyle = "#fde68a"; c.fill();
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = "#d6ebe3"; c.fill(); c.clip();
  const k = rad / (125 * S);
  c.translate(x, y + rad * 0.15); c.scale(k, k); c.translate(-nk[0], -(nk[1] - 135 * S));
  person(c, who, m, "rest", 0, talk, 1, f, r);
  c.restore();
};
// the AI chat on Amma's phone (screen space, top): her pasted statement, the delete, the blanked version, the photo
type Chat = "deleted" | "ring" | "blanked" | "photo";
const ROWS_FULL = ["Account holder: Saroja Devi Kolli", "Account no: 0123 4567 8901", "PAN: ABCDE1234F", "01 Oct  Salary credit  48,500"];
const ROWS_BLANK = ["Account holder: [NAME]", "Account no: [ACCOUNT]", "PAN: [PAN]", "01 Oct  Salary credit  48,500"];
const chat = (c: Ctx, W: number, mode: Chat, f: number, t0: number, r: () => number) => {
  const x = 90, y = 250, w = W - 180, h = 430;
  c.save();
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, x + 8, y + 10, w, h, 34); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, h, 34); c.fill();
  c.fillStyle = "#0f172a"; rrect(c, x, y, w, 70, 34); c.fill(); c.fillRect(x, y + 40, w, 30);
  c.font = SANS(34, 800); c.fillStyle = "#e0f2fe"; c.textAlign = "left"; c.fillText("AI Chat", x + 34, y + 48);
  c.font = SANS(26, 600); c.fillStyle = "#94a3b8"; c.textAlign = "right"; c.fillText("Amma's phone", x + w - 34, y + 46);
  const rows = mode === "blanked" || mode === "photo" ? ROWS_BLANK : ROWS_FULL;
  const gone = mode === "deleted";
  // her message: the ask and the pasted statement
  c.save(); c.globalAlpha = gone ? 0.42 : 1;
  c.fillStyle = "#dbeafe"; rrect(c, x + 40, y + 96, w - 80, 250, 22); c.fill();
  c.font = SANS(32, 800); c.fillStyle = "#1e3a8a"; c.textAlign = "left"; c.fillText("Where is my money going? What can I cut?", x + 64, y + 142);
  rows.forEach((t, q) => {
    c.font = SANS(q === 1 || q === 2 ? 40 : 32, q === 1 || q === 2 ? 900 : 600);
    c.fillStyle = (q === 1 || q === 2) && !rows[q].includes("[") ? "#7f1d1d" : q === 1 || q === 2 ? GREEN : "#334155";
    c.fillText(t, x + 64, y + 196 + q * 46);
  });
  c.restore();
  if (gone) {   // the delete: a strike through the message and the toast
    c.save(); c.strokeStyle = "rgba(15,23,42,0.5)"; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 50, y + 330); c.lineTo(x + w - 50, y + 110); c.stroke(); c.restore();
    c.fillStyle = "#0f172a"; rrect(c, x + w / 2 - 230, y + h - 74, 460, 60, 30); c.fill();
    c.font = SANS(32, 800); c.fillStyle = "#bbf7d0"; c.textAlign = "center"; c.fillText("Chat deleted ✓", x + w / 2, y + h - 33);
  }
  if (mode === "ring") {   // her account number and PAN circled in red
    const k = seg(f, t0, t0 + 10);
    c.save(); c.strokeStyle = RED; c.lineWidth = 8; c.globalAlpha = clamp(k * 2);
    [1, 2].forEach((q) => { const yy = y + 196 + q * 46 - 14; c.beginPath(); c.ellipse(x + 330, yy, 300 * easeOut(k), 30, -0.02, 0, 7); c.stroke(); });
    c.restore();
  }
  if (mode === "blanked" || mode === "photo") {
    c.font = SANS(28, 700); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("sent ✓", x + w - 56, y + 336);
    const k = mode === "photo" ? 1 : seg(f, t0, t0 + 10);
    if (k > 0) {   // the passbook photo, attached
      c.save(); c.globalAlpha = clamp(k * 2);
      c.fillStyle = "#e2e8f0"; rrect(c, x + w - 420, y + 352, 380, 70, 16); c.fill();
      c.fillStyle = "#fef3c7"; c.fillRect(x + w - 408, y + 360, 90, 54);
      c.fillStyle = "#7f1d1d"; c.font = SANS(13, 800); c.textAlign = "left"; c.fillText("A/C 0123 4567", x + w - 404, y + 382); c.fillText("8901", x + w - 404, y + 398);
      c.font = SANS(28, 800); c.fillStyle = "#0f172a"; c.fillText("passbook.jpg", x + w - 300, y + 398);
      c.restore();
    }
  }
  c.restore();
  void r;
};
// frame 1's clash, readable in the grid with the sound off
const clash = (c: Ctx, W: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  const box = (x: number, top: string, big: string, sub: string, bg: string, fg: string) => {
    const y0 = 1000;   // over their laps: clear of the captions (1500) and inside the grid's 3:4 crop
    c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, x + 8, y0 + 8, 452, 300, 28); c.fill();
    c.fillStyle = bg; rrect(c, x, y0, 452, 300, 28); c.fill();
    c.textAlign = "center"; c.fillStyle = fg;
    c.font = SANS(40, 900); c.fillText(top, x + 226, y0 + 62);
    c.font = SANS(108, 900); c.fillText(big, x + 226, y0 + 180);
    c.font = SANS(32, 800); c.fillText(sub, x + 226, y0 + 250);
  };
  box(60, "DELETED IN", "1 tap", "she thinks it's gone", "#dcfce7", "#14532d");   // script review: "a reviewed copy" read as a movie review
  box(W - 512, "KEPT UP TO", "3 years", "if Gemini's reviewers read it", "#fee2e2", "#991b1b");
  c.fillStyle = "rgba(255,253,245,0.95)"; rrect(c, W / 2 - 400, 1316, 800, 62, 31); c.fill();   // render review: the source unreadable on a phone
  c.font = SANS(36, 800); c.fillStyle = "#1e293b"; c.textAlign = "center"; c.fillText("Gemini's own privacy page (Google, Oct 2026)", W / 2, 1360);
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
  if (sub) { let ss = 36; c.font = SANS(ss, 700); while (c.measureText(sub).width > w - 40 && ss > 24) { ss -= 2; c.font = SANS(ss, 700); } c.fillText(sub, x, y + 46); }
  c.restore();
};
const arrow = (c: Ctx, x0: number, y0: number, x1: number, y1: number, col: string, k: number) => {
  if (k <= 0) return;
  const x = x0 + (x1 - x0) * easeOut(k), y = y0 + (y1 - y0) * easeOut(k);
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 12; c.lineCap = "round";
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke();
  if (k > 0.9) { const a = Math.atan2(y1 - y0, x1 - x0); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 34 * Math.cos(a - 0.5), y1 - 34 * Math.sin(a - 0.5)); c.lineTo(x1 - 34 * Math.cos(a + 0.5), y1 - 34 * Math.sin(a + 0.5)); c.closePath(); c.fill(); }
  c.restore();
};
// where your chat goes (line 3's insert): t0 the line's start, c1 its cue ("Deleting doesn't delete their copy")
const where = (c: Ctx, W: number, H: number, f: number, t0: number, c1: number) => {
  dark(c, W, H, "WHERE YOUR CHAT GOES", []);
  card(c, "YOUR CHAT", "account no. · PAN · salary", W / 2, 470, 620, 150, "#e0e7ff", "#1e3a8a", seg(f, t0, t0 + 8));
  arrow(c, W / 2 - 120, 550, 280, 690, "#4ade80", seg(f, t0 + 8, t0 + 18));
  arrow(c, W / 2 + 120, 550, 800, 690, "#fb923c", seg(f, t0 + 14, t0 + 24));
  card(c, "SAVED IN YOUR ACCOUNT", "delete it: gone ✓", 280, 790, 440, 170, "#dcfce7", "#14532d", seg(f, t0 + 14, t0 + 22));
  card(c, "SOME CHATS", "a person reads them", 800, 790, 440, 170, "#ffedd5", "#9a3412", seg(f, t0 + 20, t0 + 28));
  arrow(c, 800, 885, 800, 1010, "#f87171", seg(f, c1 - 10, c1));
  card(c, "THAT COPY: KEPT UP TO 3 YEARS", "even after you delete yours", W / 2, 1110, W - 120, 180, "#fee2e2", "#991b1b", seg(f, c1, c1 + 8));
  c.save(); c.globalAlpha = seg(f, c1 + 8, c1 + 16); c.font = SANS(28, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "left";
  c.fillText("Google, Gemini Apps Privacy Hub, Oct 2026", 80, 1290);
  c.fillText("(ChatGPT: deleted chats go within 30 days)", 80, 1332); c.restore();   // render review: "ChatGPT also 3 years?"
};
const barRow = (c: Ctx, label: string, v: number, of: number, y: number, col: string, k: number) => {
  if (k <= 0) return;
  c.font = SANS(38, 800); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(label, 100, y - 22);
  c.fillStyle = "#1e293b"; rrect(c, 100, y, 600, 76, 14); c.fill();
  c.fillStyle = col; rrect(c, 100, y, Math.max(16, 600 * (v / of) * easeOut(k)), 76, 14); c.fill();
  c.font = SANS(64, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(`${v} of ${of}`, 1010, y + 62);
};

// ---------- the scene ----------
const StPrivacy: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const res: { full: number; blank: number } = s.data.result ?? { full: 0, blank: 0 };
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
    const insert = ["where", "test"].includes(b.shot);
    if (insert && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.32} />, <Sfx key={k("wr")} at={Math.max(0, at - 26)} src="reel/sfx_riser.wav" vol={0.18} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("p")} at={0} src="audio/sfx_tick.wav" vol={0.3} />, <Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 1.0 : 1.0} />, <Sfx key={k("c")} at={0} src={CLAP} vol={te ? 0.4 : 0.45} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("y")} at={cueAt(l, 99, /^(three|3|మూడేళ్ళ)/i, end - 22)} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.4} />);   // script review: a hit on "three years"
    if (b.prop === "ring") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.45) - 2} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "where") { const c1 = cue(i, 1, 0.55); sfx.push(<Sfx key={k("p")} at={at + 16} src="audio/sfx_pop.wav" vol={0.18} />, <Sfx key={k("n")} at={c1 - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.5} />); }
    if (b.prop === "quote") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.4)} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.2} />);
    if (b.prop === "result") { const c1 = cue(i, 1, 0.45); sfx.push(<Sfx key={k("n")} at={at - (te ? 6 : 2)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />, <Sfx key={k("c")} at={c1 + 2} src={CLAP} vol={0.3} />); }
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - (te ? 24 : 12))} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - (te ? 26 : 14))} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />);
    if (b.prop === "photo") sfx.push(<Sfx key={k("w2")} at={cue(i, 1, 0.4) - 6} src="audio/sfx_whoosh.wav" vol={0.2} />, <Sfx key={k("d")} at={cue(i, 1, 0.4) + 4} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "loop") {   // the photo goes out, then the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.55} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("rule") === 0 && percEnd > 30 && (   // the last scene builds: hats and claps up to his last line
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.1 + 0.2 * clamp(fr / percEnd) : 0.14 + 0.34 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4444 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        if (b.shot === "where") {
          where(c, W, H, f, ln.from - 4, cu(1, 0.55));
          face(c, "amma", FACE[n] ?? "shock", 900, 1420, 110, false, f, r);
        } else if (b.shot === "test") {
          dark(c, W, H, "OUR TEST", ["a small free AI on a laptop, offline (Qwen2.5 7B)", "10 tries each way"]);   // render review: "Qwen2.5 7B, what is that?"   // script review: half the words
          const t0 = b.prop === "test" ? cu(1, 0.5) : -1e9;   // the blanked one lands on "ten times with them blanked out"
          card(c, "HER STATEMENT + IDs", "0123 4567 8901 · ABCDE1234F (made up)", W / 2, 540, W - 140, 150, "#fee2e2", "#991b1b", b.prop === "test" ? seg(f, ln.from, ln.from + 8) : 1);
          card(c, "THE SAME, BLANKED", "[ACCOUNT] · [PAN]", W / 2, 720, W - 140, 150, "#dcfce7", "#14532d", seg(f, t0, t0 + 8));
          if (b.prop === "and") {   // script review: say the right answer before the result
            c.save(); c.font = SANS(40, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("the right answer: cut the", W / 2, 920);
            c.font = SANS(72, 900); c.fillStyle = "#fde68a"; c.fillText("14 food orders", W / 2, 1010); c.font = SANS(40, 800); c.fillStyle = "#cbd5e1"; c.fillText("(₹7,380 this month)", W / 2, 1070); c.restore();
          }
          if (b.prop === "result") {
            const c0 = ln.from - 2;
            c.save(); c.font = SANS(36, 800); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("said \"cut the food orders\":", 100, 900); c.restore();
            barRow(c, "with her IDs", res.full, 10, 980, "#93c5fd", seg(f, c0, c0 + 10));   // render review: one colour (8 vs 10 is a tie, not a win)
            barRow(c, "blanked", res.blank, 10, 1130, "#93c5fd", seg(f, c0 + 6, c0 + 16));
            tag(c, "no worse without her IDs", W / 2, 1290, 56, "#fde68a", INK, -0.02, seg(f, cu(1, 0.45), cu(1, 0.45) + 8));
            c.save(); c.globalAlpha = seg(f, c0 + 20, c0 + 28); c.font = SANS(36, 800); c.fillStyle = "#fca5a5"; c.textAlign = "left";
            c.fillText("its totals: wrong every time (0 of 20)", 70, 1385); c.fillStyle = "#cbd5e1"; c.font = SANS(32, 700); c.fillText("check an AI's maths yourself", 70, 1430); c.restore();   // render review: the footnote was unreadable
          }
          face(c, "amma", FACE[n] ?? "puzzled", 900, 1420, 110, b.who === "amma" && talking, f, r);
        } else {
          // ---------- the living room ----------
          const hookOn = b.prop === "hook" || loopOn;
          const cam = CAM[hookOn ? "hook" : b.shot] ?? CAM.wide;
          const z = cam.z * (1 + 0.03 * p);
          const shake = (b.prop === "hook" && p < 0.12) || (loopOn && f < slam + 10) ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.fillStyle = "#d6ebe3"; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2 + sx, 960 + sy); c.scale(z, z); c.translate(-cam.x, -cam.y);
          room(c, r, false);
          const [am, ap, al] = loopOn ? (["worried", "phone", 2] as [Mood, Pose, number]) : AMMA[n] ?? ["worried", "phone", 1];
          const [cm, cp, cl] = loopOn ? (["shock", "point", -1] as [Mood, Pose, number]) : CHINNU[n] ?? ["explain", "open", -1];
          person(c, "amma", am, ap, al, b.who === "amma" && talking && !loopOn, p, f, r, { glow: true });
          person(c, "chinnu", cm, cp, cl, b.who === "chinnu" && talking && !loopOn, p, f, r, { bite: true });
          sofaFront(c, r);
          c.restore();
          // screen-space: her chat, the clash, the quote, the rule
          if (hookOn) { chat(c, W, "deleted", f, 0, r); clash(c, W, 1); }
          if (b.prop === "ring") chat(c, W, "ring", f, cu(1, 0.45) - 30, r);
          if (b.prop === "salary") bubble(c, 540, 330, "I only asked: where does my salary go?", 50, seg(p, 0.05, 0.2), COL.yellow);   // render review: cut off at the left
          if (b.prop === "quote") {
            const k0 = seg(f, ln.from, ln.from + 8), k1 = seg(f, cu(1, 0.4), cu(1, 0.4) + 8);
            c.save(); c.globalAlpha = clamp(k0 * 3);
            c.fillStyle = "#fffdf5"; rrect(c, 70, 220, W - 140, 520, 28); c.fill();
            c.strokeStyle = "#1e3a8a"; c.lineWidth = 6; rrect(c, 86, 236, W - 172, 488, 20); c.stroke();
            c.font = SANS(38, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText("THE APP'S OWN PRIVACY PAGE:", W / 2, 312);
            c.globalAlpha = clamp(k0 * 3) * clamp(k1 * 3);
            c.font = SANS(56, 900); c.fillStyle = INK;
            ["\"Please don't enter", "confidential information", "that you wouldn't want", "a reviewer to see.\""].forEach((t, q) => c.fillText(t, W / 2, 406 + q * 70));
            c.font = SANS(26, 700); c.fillStyle = "#475569"; c.fillText("Google, Gemini Apps Privacy Hub", W / 2, 700);
            c.restore();
          }
          if (b.prop === "needs") bubble(c, 520, 380, "It needs my details to help!", 54, seg(p, 0.05, 0.2), "#fff");
          if (b.prop === "rule") {   // the rule card (sound-off viewers)
            const k0 = b.prop === "rule" ? seg(p, 0.0, 0.08) : 1;
            c.save(); c.globalAlpha = clamp(k0 * 3);
            c.fillStyle = "rgba(15,23,42,0.94)"; rrect(c, 60, 200, W - 120, 1000, 30); c.fill();
            c.font = SANS(52, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BEFORE YOU PASTE, BLANK:", W / 2, 290);
            c.restore();
            const t1 = b.prop === "rule" ? cu(1, 0.4) : -1e9;
            ([["your name", "[NAME]", ln.from + 2], ["account number", "[ACCOUNT]", ln.from + 8], ["PAN", "[PAN]", ln.from + 14], ["Aadhaar", "[AADHAAR]", ln.from + 20]] as [string, string, number][]).forEach(([a, bb, t0], q) => {
              const k = b.prop === "rule" ? seg(f, Math.min(t0, t1), Math.min(t0, t1) + 8) : 1; if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3);
              const y = 330 + q * 138;
              c.fillStyle = "#f8fafc"; rrect(c, 100, y, W - 200, 116, 20); c.fill();
              c.font = SANS(48, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a, 140, y + 80);
              c.font = SANS(50, 900); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText("→ " + bb, W - 140, y + 80);
              c.restore();
            });
            const t2 = b.prop === "rule" ? cu(2, 0.7) : -1e9;   // on "And in Gemini, switch off Keep Activity" (render review: say it, hold it)
            const ks = seg(f, t2, t2 + 8);
            if (ks > 0) {
              c.save(); c.globalAlpha = clamp(ks * 3);
              c.font = SANS(44, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("AND SWITCH OFF:", 110, 935);
              c.font = SANS(42, 800); c.fillStyle = "#f8fafc"; c.fillText("Gemini → Keep Activity", 110, 995);
              c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.fillText("(no human review of your next chats)", 110, 1035);
              c.font = SANS(36, 800); c.fillStyle = "#f8fafc"; c.fillText("ChatGPT → \"Improve the model for everyone\"", 110, 1100);
              c.font = SANS(30, 700); c.fillStyle = "#cbd5e1"; c.fillText("(stops training on your chats, not review)", 110, 1140);
              c.restore();
            }
          }
          if (b.prop === "photo") chat(c, W, "blanked", f, cu(1, 0.4), r);
          if (b.prop === "loop" && !loopOn) chat(c, W, "photo", f, 0, r);
          if (b.prop === "loop" && !loopOn) {   // render review: the photo full-width, its account number circled (sound-off viewers saw nothing)
            const k = easeOut(seg(f, ln.from + 2, ln.from + 12));
            if (k > 0) {
              c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, 760); c.rotate(-0.03); c.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k);
              c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -392, -232, 800, 480, 18); c.fill();
              c.fillStyle = "#fef3c7"; rrect(c, -400, -240, 800, 480, 18); c.fill();
              c.fillStyle = "#1e3a8a"; c.fillRect(-400, -240, 800, 70);
              c.font = SANS(40, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SAVINGS PASSBOOK", 0, -192);
              c.textAlign = "left"; c.fillStyle = INK; c.font = SANS(40, 700);
              c.fillText("Name: Saroja Devi Kolli", -350, -100); c.fillText("Branch: Kukatpally", -350, 130);
              c.font = SANS(54, 900); c.fillStyle = "#7f1d1d"; c.fillText("A/C No: 0123 4567 8901", -350, 20);
              c.font = SANS(26, 700); c.fillStyle = "#475569"; c.fillText("passbook.jpg · sent", -350, 210);
              const kr = seg(f, ln.from + 14, ln.from + 22);
              if (kr > 0) { c.strokeStyle = RED; c.lineWidth = 9; c.globalAlpha = kr; c.beginPath(); c.ellipse(-10, 2, 380 * easeOut(kr), 64, -0.02, 0, 7); c.stroke(); }
              c.restore();
            }
          }
        }
      }} />
    </>
  );
};

export const PRIVACY_SCENES = { sk_privacy: StPrivacy };
