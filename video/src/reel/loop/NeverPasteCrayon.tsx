import React from "react";
import { Ctx, rng, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip, block, bg } from "./TutorialCrayon";

// HOW TO 04 "What to never paste into an AI chat" (series/scripts/howto04_never_paste.md): a screen tutorial, one
// narrator. Ravi pastes his customers' dues list into an AI chat; Google's own page: a person may read some chats and
// keeps those up to three years, 72 hours with Keep Activity off. The never-paste list, the companies' own warnings, the
// Gemini and ChatGPT switches, and the tip (the switch covers new chats: delete the old one, paste "Customer 1").
// Every quote on screen comes from the spec (data.t), copied from the pages read on Nov 12, 2026.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;
const MONO = (s: number, w = 700) => `${w} ${s}px "Courier New", monospace`;

// the pasted dues list (made-up names; phone numbers masked)
const dues = (c: Ctx, x: number, y: number, w: number, rows: string[][], k: number, masked = true) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 96 + rows.length * 62;
  c.fillStyle = "#dcf8c6"; rrect(c, x, y, w, h, 22); c.fill();
  c.font = SANS(34, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(masked ? "Make this list neat:" : "Make this list neat:", x + 28, y + 52);
  rows.forEach((r, i) => {
    const yy = y + 110 + i * 62;
    c.font = MONO(34, 700); c.fillStyle = "#0f172a";
    c.fillText(r[0], x + 28, yy); c.fillText(r[1], x + 300, yy);
    c.fillStyle = "#b91c1c"; c.textAlign = "right"; c.fillText(r[2], x + w - 28, yy); c.textAlign = "left";
  });
  c.restore();
  return y + h;
};
const block2 = (c: Ctx, x: number, y: number, l1: string, l2: string, big: string, small: string, col: string) => {
  c.fillStyle = "#111827"; rrect(c, x, y, 470, 230, 22); c.fill();
  c.textAlign = "center";
  c.font = SANS(fit(c, l1, 430, 30, 900), 900); c.fillStyle = "#93c5fd"; c.fillText(l1, x + 235, y + 44);
  c.font = SANS(fit(c, l2, 440, 36, 900), 900); c.fillStyle = "#fde68a"; c.fillText(l2, x + 235, y + 88);   // render review: the qualifier was the smallest text
  c.font = SANS(fit(c, big, 430, 74), 900); c.fillStyle = col; c.fillText(big, x + 235, y + 162);
  c.font = SANS(26, 700); c.fillStyle = "#94a3b8"; c.fillText(small, x + 235, y + 206);
};
const toggle = (c: Ctx, x: number, y: number, on: number) => {   // on: 1 = on, 0 = off (animated between)
  const w = 130, h = 70;
  c.fillStyle = on > 0.5 ? "#16a34a" : "#94a3b8"; rrect(c, x, y, w, h, h / 2); c.fill();
  c.beginPath(); c.arc(x + h / 2 + (w - h) * on, y + h / 2, h / 2 - 7, 0, 7); c.fillStyle = "#fff"; c.fill();
};
const screen = (c: Ctx, x: number, y: number, w: number, h: number, title: string, crumb: string) => {
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, h, 28); c.fill();
  c.fillStyle = "#1e293b"; rrect(c, x, y, w, 96, 28); c.fill(); c.fillRect(x, y + 60, w, 36);
  c.font = SANS(38, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(title, x + 30, y + 62);
  if (crumb) { c.font = SANS(30, 700); c.fillStyle = "#475569"; c.fillText(crumb, x + 30, y + 150); }
};
const quote = (c: Ctx, x: number, y: number, w: number, text: string, src: string, k: number, size = 40) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 800);
  const lines = wrap(c, `“${text}”`, w - 80);
  const h = 70 + lines.length * size * 1.3 + 50;
  c.fillStyle = "#fffbeb"; rrect(c, x, y, w, h, 24); c.fill();
  c.fillStyle = "#f59e0b"; c.fillRect(x, y + 20, 10, h - 40);
  c.fillStyle = INK; c.textAlign = "left"; lines.forEach((l, i) => c.fillText(l, x + 40, y + 60 + i * size * 1.3));
  c.font = SANS(28, 700); c.fillStyle = "#92400e"; c.fillText(src, x + 40, y + h - 30);
  c.restore();
  return y + h;
};
const eye = (c: Ctx, x: number, y: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y);
  c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-90, 0); c.quadraticCurveTo(0, -70, 90, 0); c.quadraticCurveTo(0, 70, -90, 0); c.fill();
  c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fillStyle = "#1d4ed8"; c.fill(); c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fillStyle = INK; c.fill();
  c.restore();
};
const cross = (c: Ctx, x: number, y: number, s = 30) => { c.save(); c.strokeStyle = RED; c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.moveTo(x - s, y - s); c.lineTo(x + s, y + s); c.moveTo(x + s, y - s); c.lineTo(x - s, y + s); c.stroke(); c.restore(); };

const StNeverPaste: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (["title", "never", "quotes"].includes(b.prop)) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 11)} src="audio/sfx_whoosh.wav" vol={0.45} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("p")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "review") sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.5) - 6} src="reel/sfx_buzz.wav" vol={0.4} />, <Sfx key={k("d")} at={cue(i, 2, 0.8) - 6} src="audio/gag_ding.wav" vol={0.5} />);
    if (b.prop === "never") [at + 4, cue(i, 1, 0.35) - 4, cue(i, 2, 0.65) - 4].forEach((t, q) => sfx.push(<Sfx key={k("x" + q)} at={t} src="audio/sfx_pop.wav" vol={0.5} />));
    if (b.prop === "quotes") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.3) - 8} src="reel/sfx_boom.wav" vol={0.75} />);
    if (b.prop === "gemini" || b.prop === "chatgpt") sfx.push(<Sfx key={k("t")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.6} />);
    if (b.prop === "delete") sfx.push(<Sfx key={k("d")} at={at + 18} src="audio/gag_ding.wav" vol={0.45} />, <Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 24)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        void rng(1204 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        bg(c, W, H);
        const P = loopOn ? "hook" : b.prop;
        const rows: string[][] = T.rows;
        if (P === "hook" || P === "review") {
          block2(c, 50, 245, "GEMINI · Keep Activity ON", "if a reviewer reads the chat", "up to 3 YEARS", "even if you delete it", "#f87171");
          block2(c, 560, 245, "GEMINI · Keep Activity OFF", "every chat", "72 HOURS", "3 days", "#4ade80");
          if (P === "hook") {
            c.fillStyle = "#075e54"; rrect(c, 50, 510, W - 100, 76, 18); c.fill(); c.font = SANS(34, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Gemini", 76, 560);
            dues(c, 150, 620, W - 200, rows, 1);
            chip(c, "Ravi's customers: names, phone numbers, what they owe", W / 2, 1110, "#fde68a", INK, 1, 32);
          } else {
            quote(c, 50, 500, W - 100, T.gReview, "Google · Gemini Apps Privacy Hub", seg(f, ln.from, ln.from + 8), 40);
            quote(c, 50, 790, W - 100, T.gYears, "Google · the same page (deleting your activity doesn't delete them)", seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 6), 44);
            dues(c, 100, 1120, W - 200, rows.slice(0, 2), 1);   // full width: the masked numbers ran into the amounts
            eye(c, 900, 1100, seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
            const k72 = seg(f, cu(2, 0.8) - 4, cu(2, 0.8) + 6);
            if (k72 > 0) { c.save(); c.globalAlpha = 0.6 * Math.sin(k72 * Math.PI); c.strokeStyle = "#4ade80"; c.lineWidth = 12; rrect(c, 552, 237, 486, 246, 26); c.stroke(); c.restore(); }
          }
        } else if (P === "title") {
          c.font = SANS(fit(c, "WHAT TO NEVER PASTE", W - 120, 84), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("WHAT TO NEVER PASTE", W / 2, 560);
          c.font = SANS(52, 800); c.fillStyle = "#e2e8f0"; c.fillText("into an AI chat", W / 2, 640);
          chip(c, "+ the one switch to check", W / 2, 820, "#dcfce7", "#14532d", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 48);
          ["Gemini", "ChatGPT"].forEach((t, q) => chip(c, t, W / 2 + (q ? 170 : -170), 1000, "#1e293b", "#f8fafc", seg(f, cu(1, 0.4) + 8 + q * 6, cu(1, 0.4) + 16 + q * 6), 44));
        } else if (P === "never") {
          c.font = SANS(64, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("NEVER PASTE", W / 2, 330);
          const items: [string, string, number][] = [["Passwords and OTPs", "", ln.from + 4], ["Aadhaar, PAN, bank numbers", "", cu(1, 0.35) - 4], ["Other people's details", "phone numbers · dues · medical reports", cu(2, 0.65) - 4]];
          items.forEach(([a, sub, t0], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 420 + q * 280;
            c.fillStyle = "#fee2e2"; rrect(c, 60, y, W - 120, 230, 26); c.fill();
            cross(c, 150, y + 115, 38);
            c.font = SANS(fit(c, a, W - 330, 56), 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a, 230, y + (sub ? 105 : 135));
            if (sub) { c.font = SANS(fit(c, sub, W - 330, 38, 700), 700); c.fillStyle = "#7f1d1d"; c.fillText(sub, 230, y + 168); }
            c.restore();
          });
        } else if (P === "quotes") {
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("GOOGLE'S OWN WORDS", W / 2, 330);
          quote(c, 50, 480, W - 100, T.gNever, "Google · Gemini Apps Privacy Hub", seg(f, cu(1, 0.3) - 6, cu(1, 0.3) + 4), 54);
        } else if (P === "gemini" || P === "chatgpt") {
          const gem = P === "gemini";
          screen(c, 60, 260, W - 120, 760, gem ? "Gemini · on the WEBSITE" : "ChatGPT", gem ? "" : "Settings  ›  Data controls");
          if (gem) {   // render review: the path is the website's (Google's help page); big numbered steps
            [["1", "gemini.google.com"], ["2", "Settings & help  ›  Activity"]].forEach(([nn, t], q) => {
              c.font = SANS(40, 900); c.fillStyle = "#1d4ed8"; c.textAlign = "left"; c.fillText(nn + ".", 110, 1080 + q * 70);
              c.font = SANS(fit(c, t, W - 330, 40, 800), 800); c.fillStyle = "#f8fafc"; c.fillText(t, 170, 1080 + q * 70);
            });
            c.font = SANS(40, 900); c.fillStyle = "#1d4ed8"; c.fillText("3.", 110, 1220); c.font = SANS(40, 800); c.fillStyle = "#f8fafc"; c.fillText("click On  ›  Turn off", 170, 1220);
          }
          const on = 1 - seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          c.fillStyle = "#ffffff"; rrect(c, 100, 420, W - 200, 200, 20); c.fill();
          const label = gem ? "Keep Activity" : "Improve the model for everyone";
          c.font = SANS(fit(c, label, W - 440, 46, 800), 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(label, 140, 505);
          c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.fillText(gem ? "click On, then Turn off" : "your chats can be used to train models", 140, 560);
          if (gem) {   // Google's page: an "On" button near the top, then "Turn off"
            c.fillStyle = on > 0.5 ? "#dbeafe" : "#e2e8f0"; rrect(c, W - 330, 468, 210, 76, 38); c.fill();
            c.font = SANS(38, 900); c.fillStyle = on > 0.5 ? "#1d4ed8" : "#475569"; c.textAlign = "center"; c.fillText(on > 0.5 ? "On ▾" : "Off", W - 225, 520); c.textAlign = "left";
          } else toggle(c, W - 270, 470, on);
          if (on < 0.5) { c.font = SANS(fit(c, gem ? "OFF: kept 72 hours, not used to train" : "OFF: new chats not used to train", W - 240, 38, 800), 800); c.fillStyle = GREEN; c.fillText(gem ? "OFF: kept 72 hours, not used to train" : "OFF: new chats not used to train", 120, 700); }
          if (gem) {
            chip(c, "the catch: your chat history stops saving", W / 2, 820, "#fef3c7", "#78350f", seg(f, cu(2, 0.6), cu(2, 0.6) + 8), 36);
            chip(c, "or: Temporary chat (next to New chat)", W / 2, 940, "#e0e7ff", "#1e3a8a", seg(f, cu(2, 0.85), cu(2, 0.85) + 8), 36);
            chip(c, "or: myactivity.google.com/product/gemini", W / 2, 1320, "#1e293b", "#e2e8f0", 1, 30);
          } else {
            chip(c, "ON by default (Free, Plus, Pro)", W / 2, 840, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.8), cu(1, 0.8) + 8), 40);
            chip(c, "or: Temporary Chat · not used to train", W / 2, 960, "#e0e7ff", "#1e3a8a", seg(f, cu(2, 0.8), cu(2, 0.8) + 8), 38);
          }
          void fit;
        } else if (P === "delete") {
          c.font = SANS(fit(c, "THE SWITCH COVERS NEW CHATS", W - 120, 52), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("THE SWITCH COVERS NEW CHATS", W / 2, 330);
          const kd = seg(f, ln.from + 10, ln.from + 22);
          c.fillStyle = "#1e293b"; rrect(c, 60, 400, W - 120, 120, 20); c.fill();
          c.font = SANS(38, 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText("“Make this list neat: Lakshmi…”", 100, 475);
          chip(c, "already reviewed? it stays", W / 2, 600, "#fee2e2", "#7f1d1d", kd, 40);
          const kn = seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6);
          if (kn > 0) {
            c.save(); c.globalAlpha = clamp(kn * 3);
            dues(c, 150, 680, W - 200, (T.anon as string[][]), 1, false);
            chip(c, "✓ the real fix: no names, no phone numbers", W / 2, 1120, "#dcfce7", "#14532d", 1, 40);
            c.restore();
          }
        } else if (P === "loop") {
          c.font = SANS(fit(c, "Open your settings now", W - 120, 76), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("Open your settings now", W / 2, 640);
          c.font = SANS(110, 900); c.fillStyle = "#f87171"; c.fillText("ON", W / 2 - 200, 900); c.fillStyle = "#94a3b8"; c.font = SANS(60, 800); c.fillText("or", W / 2, 890); c.font = SANS(110, 900); c.fillStyle = "#4ade80"; c.fillText("OFF?", W / 2 + 210, 900);
          toggle(c, W / 2 - 65, 1000, 0.5 + 0.5 * Math.sin(f / 6));
        }
      }} />
    </>
  );
};

export const NEVERPASTE_SCENES = { sk_neverpaste: StNeverPaste };
