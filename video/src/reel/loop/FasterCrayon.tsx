import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// HOW TO 02 "Make AI reply faster: 3 settings" (series/scripts/howto02_faster_replies.md): Ravi anna's AI app takes 71 s
// for a two-line WhatsApp message; the shop AI walks him through three settings. Every number comes from our run
// (series/scripts/howto02_demo, passed in as s.data.nums by pipeline/howto02/make_specs.py): one clock, the whole reply.
// One beat per line (s.data.beats); visuals key on the beat's prop, so the Telugu reel uses the same screens.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type Num = { whole: number; reading: number; ready: string };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 },
};
const POSE: Record<string, [Mood, Arms]> = {
  hook: ["yell", "up"], three: ["shock", "rest"], thinking: ["angry", "fist"], oldname: ["sus", "point"], hard: ["hope", "thumb"],
  save: ["happy", "thumb"],
};
const GREEN = "#16a34a", RED = "#dc2626", PURPLE = "#7c3aed";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const JOB = "Write a WhatsApp message for my shop's customers: the shop is closed this Sunday for a family function, and open again on Monday at 7 am.";
// our run's real replies (results.json): all three settings, seed 1; the long chat's, seed 1
const FAST_REPLY = "We're closed this Sunday for a family event and will reopen Monday at 7 am. Thank you for your understanding!";
const sec = (x: number) => `${Math.round(x)} s`;

// ---------- pieces ----------
// soft-wrapped text lines inside a width (canvas measure)
const wrapW = (c: Ctx, t: string, w: number) => {
  const out: string[] = []; let cur = "";
  t.split(" ").forEach((word) => { const nx = cur ? `${cur} ${word}` : word; if (c.measureText(nx).width > w && cur) { out.push(cur); cur = word; } else cur = nx; });
  if (cur) out.push(cur);
  return out;
};
// Ravi's AI app on a big phone (screen space): the job he typed, then "Thinking..." or a reply; a mode chip on top
const appPhone = (c: Ctx, x: number, y: number, s: number, f: number, o: { mode: string; reply?: string; typed?: string; fresh?: boolean; kept?: number }) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -330, -560, 680, 1150, 60); c.fill();
  c.fillStyle = "#111827"; rrect(c, -340, -580, 680, 1150, 60); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, -312, -540, 624, 1070, 40); c.fill();
  c.fillStyle = "#e2e8f0"; rrect(c, -312, -540, 624, 104, 40); c.fillRect(-312, -480, 624, 44);
  c.font = SANS(34); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", -270, -474);
  c.font = SANS(28, 700); const mw = c.measureText(o.mode + " ▾").width + 36;
  c.fillStyle = o.mode.startsWith("Think") ? "#ede9fe" : "#dcfce7"; rrect(c, 270 - mw, -512, mw, 52, 26); c.fill();
  c.fillStyle = o.mode.startsWith("Think") ? PURPLE : "#166534"; c.textAlign = "center"; c.fillText(o.mode + " ▾", 270 - mw / 2, -476);
  let yy = -400;
  if (!o.fresh) {   // his message (right)
    c.font = SANS(30, 600); const rows = wrapW(c, JOB, 430);
    const h = rows.length * 40 + 36;
    c.fillStyle = "#dcf8c6"; rrect(c, 290 - 470, yy, 470, h, 24); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; rows.forEach((t, i) => c.fillText(t, 290 - 450, yy + 46 + i * 40));
    yy += h + 34;
  }
  if (o.reply) {   // the AI's reply (left)
    c.font = SANS(32, 600); const rows = wrapW(c, o.reply, 440);
    const h = rows.length * 42 + 36;
    c.fillStyle = "#e0e7ff"; rrect(c, -290, yy, 480, h, 24); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; rows.forEach((t, i) => c.fillText(t, -270, yy + 48 + i * 42));
  } else if (!o.fresh) {   // "Thinking..." with moving dots (no timer: one clock in the reel, the whole reply)
    c.fillStyle = "#ede9fe"; rrect(c, -290, yy, 330, 84, 24); c.fill();
    c.font = SANS(34); c.fillStyle = PURPLE; c.textAlign = "left"; c.fillText("Thinking", -264, yy + 54);
    [0, 1, 2].forEach((q) => { const a = 0.3 + 0.7 * (Math.floor(f / 6) % 3 === q ? 1 : 0); c.globalAlpha = a; c.beginPath(); c.arc(-90 + q * 26, yy + 44, 8, 0, 7); c.fillStyle = PURPLE; c.fill(); });
    c.globalAlpha = 1;
  }
  // the message box at the bottom (what he types)
  c.fillStyle = "#e2e8f0"; rrect(c, -290, 420, 580, 84, 42); c.fill();
  if (o.typed) {
    const shown = o.typed.slice(0, Math.ceil(o.typed.length * clamp(o.kept ?? 1)));
    c.font = SANS(32, 600); c.fillStyle = INK; c.textAlign = "left"; c.fillText(shown + (Math.floor(f / 8) % 2 ? "▍" : ""), -260, 474);
  } else { c.font = SANS(30, 600); c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText("Message", -260, 474); }
  c.restore();
};
// the result stamp: "SAME MESSAGE: 71 s → 5 s"
const stamp = (c: Ctx, W: number, y: number, a: number, b: number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, y); c.rotate(-0.04); const z = 1.25 - 0.25 * easeOut(k); c.scale(z, z);
  c.fillStyle = "#fffdf5"; rrect(c, -470, -118, 940, 236, 30); c.fill();
  c.strokeStyle = RED; c.lineWidth = 10; rrect(c, -456, -104, 912, 208, 24); c.stroke();
  c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("SAME MESSAGE", 0, -42);
  c.font = SANS(108, 900); c.fillStyle = RED; c.textAlign = "right"; c.fillText(sec(a), -60, 70);
  c.fillStyle = INK; c.textAlign = "center"; c.fillText("→", 0, 64);
  c.fillStyle = GREEN; c.textAlign = "left"; c.fillText(sec(b), 60, 70);
  c.restore();
};
// a step header across the top
const stepHead = (c: Ctx, W: number, n: number, t: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#facc15"; c.fillRect(0, 250, W, 110);
  c.font = SANS(62, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(`STEP ${n} · ${t}`, W / 2, 328);
  c.restore();
};
// seconds bars (one clock: the whole reply), longest = the widest
const bars = (c: Ctx, W: number, y: number, rows: [string, number, string][], k: number[], max: number) => {
  rows.forEach(([lab, s, col], i) => {
    const q = easeOut(clamp(k[i] ?? 0)); if (q <= 0) return;
    const yy = y + i * 210, wmax = 760;
    c.save(); c.globalAlpha = clamp(q * 2);
    c.font = SANS(46); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(lab, 110, yy - 24);
    c.fillStyle = "#334155"; rrect(c, 110, yy, wmax, 96, 20); c.fill();
    c.fillStyle = col; rrect(c, 110, yy, Math.max(40, wmax * (s / max) * q), 96, 20); c.fill();
    c.font = SANS(64, 900); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(sec(s * q), 110 + wmax + 24, yy + 72);
    c.restore();
  });
};
// one app row: name → what to tap
const appRow = (c: Ctx, W: number, y: number, app: string, tap: string, small: string, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(0, 30 * (1 - easeOut(k)));
  c.fillStyle = "#fffdf5"; rrect(c, 80, y, W - 160, small ? 190 : 150, 26); c.fill();
  c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(app, 120, y + 92);
  c.font = SANS(56, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(`→ ${tap}`, W - 120, y + 92);
  if (small) { c.font = SANS(34, 600); c.fillStyle = "#475569"; c.textAlign = "right"; c.fillText(small, W - 120, y + 150); }
  c.restore();
};
// the save card: the three settings as a checklist
const saveCard = (c: Ctx, W: number, k: number, f0: number, f: number, n: Record<string, Num>) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.translate(W / 2, 900); c.scale(0.9 + 0.1 * easeOut(k), 0.9 + 0.1 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -500, -600, 1000, 1220, 34); c.fill();
  c.font = SANS(84); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("SAVE THIS ✓", 0, -490);
  c.font = SANS(36, 600); c.fillStyle = "#475569"; c.fillText("3 settings for a faster AI reply", 0, -428);
  const rows: [string, string, string][] = [
    ["1", "Less thinking", "ChatGPT: Instant (free: don't tap Think) · Gemini: Flash · Claude: Effort Low"],
    ["2", "\"Keep it to 2 short lines.\"", "type it with your question"],
    ["3", "New topic → New chat", "and type the one detail it needs"],
  ];
  rows.forEach(([num, head, note], i) => {
    const q = clamp((f - f0 - 6 - i * 6) / 6); if (q <= 0) return;
    const y = -360 + i * 250;
    c.save(); c.globalAlpha = q;
    c.fillStyle = "#0f172a"; rrect(c, -460, y, 920, 210, 22); c.fill();
    c.font = SANS(64, 900); c.fillStyle = "#4ade80"; c.textAlign = "left"; c.fillText(num, -430, y + 86);
    c.font = SANS(52); c.fillStyle = "#f8fafc"; c.fillText(head, -370, y + 84);
    c.font = SANS(30, 600); c.fillStyle = "#93c5fd";
    wrapW(c, note, 800).forEach((t, j) => c.fillText(t, -370, y + 134 + j * 38));
    c.restore();
  });
  const q = clamp((f - f0 - 26) / 8);
  if (q > 0) {
    c.globalAlpha = q;
    c.font = SANS(46, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(`our test: ${sec(n.default.whole)} → ${sec(n.all3.whole)}`, 0, 430);
    c.font = SANS(32, 600); c.fillStyle = "#475569"; c.fillText("a small free AI, offline · apps are faster", 0, 486);
  }
  c.restore();
};

// ---------- the scene ----------
const StFaster: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const n: Record<string, Num> = s.data.nums;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const prev = i > 0 ? beats[i - 1].shot : "";
    if (b.shot === "app" && prev !== "app" && b.prop !== "hook") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={1} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("c")} at={1} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "step1n" || b.prop === "step3") sfx.push(<Sfx key={k("n")} at={end + 1} src="audio/sfx_snap.wav" vol={0.35} />);   // after the number, off the words
    if (b.prop === "step2") sfx.push(<Sfx key={k("s")} at={end + 1} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "typename") sfx.push(<Sfx key={k("p")} at={Math.max(0, at - 4)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "save") sfx.push(<Sfx key={k("r")} at={at - 30} src="reel/sfx_riser.wav" vol={0.45} />, <Sfx key={k("h")} at={end + 2} src="reel/sfx_boom.wav" vol={0.7} />,
      <Sfx key={k("n")} at={end + 2} src="audio/sfx_snap.wav" vol={0.5} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(7300 + boil);
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to);
        const mouth = talking && Math.floor(f / 3) % 2 === 0;
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        if (b.prop === "hook") {
          // ---------- frame 1: Ravi behind the counter, his phone still "Thinking...", the result stamp ----------
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 840); c.scale(1.0, 1.0); c.translate(-540, -800);
          shop(c, r); ravi(c, "yell", "up", mouth, p, f, r); counter(c, r);
          c.restore();
          appPhone(c, 760, 1130, 0.62, f, { mode: "Thinking" });
          stamp(c, W, 430, n.default.whole, n.all3.whole, 1);
          tag(c, "OUR TEST · a small free AI, offline", W / 2, 640, 50, "#0f172a", "#f8fafc", 0.01, 1);
        } else if (b.shot === "app") {
          // ---------- the steps, full frame ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          if (b.prop === "step1") {
            stepHead(c, W, 1, "LESS THINKING", 1);
            appRow(c, W, 460, "ChatGPT", "Instant", "free plan: don't tap Think", GREEN, seg(p, 0.25, 0.35));
            appRow(c, W, 700, "Gemini", "Flash", "", GREEN, seg(p, 0.5, 0.6));
            const c1 = cu(1, 0.75);
            appRow(c, W, 900, "Claude", "Effort: Low", "", GREEN, seg(f, c1 - 4, c1 + 4));
            c.font = SANS(34, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("in the model menu · names checked Oct 29, 2026", W / 2, 1160);
          }
          if (b.prop === "step1n") {
            stepHead(c, W, 1, "LESS THINKING", 1);
            const c1 = cu(1, 0.5);
            bars(c, W, 560, [["thinking on", n.default.whole, RED], ["less thinking", n.nothink.whole, GREEN]], [seg(p, 0.02, 0.3), seg(f, c1 - 2, c1 + 10)], n.default.whole);
            c.font = SANS(36, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("the whole reply · our test, the same message", W / 2, 1060);
          }
          if (b.prop === "step2") {
            stepHead(c, W, 2, "SHORT REPLY", 1);
            const c1 = cu(1, 0.6);
            appPhone(c, W / 2, 770, 0.5, f, { mode: "Instant", typed: "Keep it to 2 short lines.", kept: seg(p, 0.15, 0.45), reply: f >= c1 ? FAST_REPLY : undefined });
            bars(c, W, 1150, [["long reply", n.nothink.whole, "#94a3b8"], ["short reply", n.all3.whole, GREEN]], [seg(f, c1 - 4, c1 + 4), seg(f, c1, c1 + 10)], n.default.whole);
            tag(c, `all ${n.all3.ready.split("/")[0]} ready to paste`, W / 2, 440, 54, "#dcfce7", "#166534", -0.02, seg(f, c1 + 8, c1 + 14));   // above the phone: captions sit from y 1500
          }
          if (b.prop === "step3") {
            stepHead(c, W, 3, "NEW CHAT", 1);
            c.fillStyle = "#fffdf5"; rrect(c, W / 2 - 240, 440, 480, 120, 60); c.fill();
            c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("＋ New chat", W / 2, 520);
            const c1 = cu(1, 0.5);
            bars(c, W, 760, [["fresh chat", n.default.whole, GREEN], ["month-long chat (90 messages)", n.long.whole, RED]], [seg(f, c1 - 4, c1 + 4), seg(f, c1, c1 + 12)], n.long.whole);
            c.font = SANS(34, 600); c.fillStyle = "#cbd5e1"; c.textAlign = "center";
            c.fillText("the same job, thinking on · our test", W / 2, 1230);
            c.fillText("apps keep long chats faster, but they eat your limit", W / 2, 1290);
          }
          if (b.prop === "typename") {
            stepHead(c, W, 3, "NEW CHAT", 1);
            appPhone(c, W / 2, 1000, 0.62, f, { mode: "Instant", fresh: true, typed: "My shop: Ravi Kirana.", kept: seg(p, 0.05, 0.4) });
            tag(c, "one line beats a month of chat", W / 2, 450, 58, "#fef3c7", INK, -0.02, seg(f, cu(1, 0.5) - 4, cu(1, 0.5) + 6));
          }
        } else {
          // ---------- the shop ----------
          const sh = SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 840); c.scale(z, z); c.translate(-sh.x, -sh.y);
          shop(c, r);
          const [mood, armPose] = POSE[b.prop] ?? ["confused", "rest"];
          ravi(c, mood, armPose, b.who === "ravi" && mouth, p, f, r);
          counter(c, r);
          phone(c, b.who === "ai" && mouth, f, r, {});
          c.restore();
          if (b.prop === "three") {
            stamp(c, W, 430, n.default.whole, n.all3.whole, 1);
            const c1 = cu(1, 0.5);
            ["1 less thinking", "2 short reply", "3 new chat"].forEach((t, q) => tag(c, t, 260 + q * 280, 640, 44, "#fef3c7", INK, q % 2 ? 0.02 : -0.02, seg(f, c1 + q * 5, c1 + 6 + q * 5)));
            tag(c, "OUR TEST · a small free AI, offline", W / 2, 1180, 44, "#0f172a", "#f8fafc", 0.01, 1);
          }
          if (b.prop === "thinking") bubble(c, 330, 560, "For \"shop closed\"?!", 80, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (b.prop === "oldname") {
            bubble(c, 330, 560, "It knew my shop!", 84, seg(p, 0.05, 0.2), COL.yellow);
            c.save(); c.globalAlpha = seg(p, 0.3, 0.45); c.translate(760, 330); c.rotate(0.03);
            c.fillStyle = "#e0e7ff"; rrect(c, -250, -70, 500, 150, 22); c.fill();
            c.font = SANS(30, 600); c.fillStyle = INK; c.textAlign = "left";
            c.fillText("...open again on Monday at 7 am.", -226, -16); c.font = SANS(32, 900); c.fillText("Ravi Kirana Team", -226, 40);
            c.restore();
            tag(c, "the old chat's reply", 760, 470, 40, "#fff", "#334155", -0.02, seg(p, 0.35, 0.5));
          }
          if (b.prop === "hard") {
            const c1 = cu(1, 0.5);
            tag(c, "THINKING: hard sums, planning", W / 2, 420, 62, "#ede9fe", "#4c1d95", -0.02, seg(p, 0.05, 0.18));
            tag(c, "FAST: messages, replies", W / 2, 560, 62, "#dcfce7", "#166534", 0.02, seg(f, c1 - 4, c1 + 6));
          }
          if (b.prop === "save") saveCard(c, W, seg(f, endL - 4, endL + 4), endL - 4, f, n);
        }
      }} />
    </>
  );
};

export const FASTER_SCENES = { sk_faster: StFaster };
