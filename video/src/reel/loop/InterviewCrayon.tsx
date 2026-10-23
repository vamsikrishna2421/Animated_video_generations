import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// Creative 07 "Ten out of ten" (series/scripts/creative07_flattery.md): practice vs the real interview, as a split
// screen. Ramya (a fresh graduate in an Ameerpet PG room) practises with an AI coach on her phone that calls every answer
// perfect; the real HR manager says forty people gave the same answer today. The coach admits it learned to please from
// thumbs-ups; told to be strict (the TYPE THIS card, the prompt we tested), it gives a low score and three real weaknesses;
// she goes back with a specific answer and is shortlisted. It ends on her roommate Divya asking the same coach "AI, how's my
// answer?", and the loop's first line answers her. The AI is an unbranded app. The numbers come from our test (s.data.demo).
// One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "happy" | "grin" | "shock" | "sad" | "stern" | "calm" | "yell" | "confused" | "smug";
type Arms = "rest" | "phone" | "type" | "fold" | "up" | "shrug" | "point" | "chin";
type Who = "ramya" | "divya" | "hr";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", PURPLE = "#7c3aed", PINK = "#ec4899", NAVY = "#1e293b", RED = "#dc2626";
const H2 = 960;   // the split: practice on top (0..960), the real interview below (960..1920)
const LOOK: Record<Who, { skin: string; hair: string; top: string; s: number }> = {
  ramya: { skin: "#a8724c", hair: "#1c1410", top: "#0d9488", s: 1.0 },
  divya: { skin: "#b97a52", hair: "#2b1a12", top: "#eab308", s: 0.96 },
  hr: { skin: "#9a6544", hair: "#27272a", top: "#1e3a5f", s: 1.0 },
};

// ---------- people ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number) => {
  c.beginPath(); c.arc(x, y, 24, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, 24, 24), INK, 3, r, { passes: 1, alpha: 0.55 });
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  if (who === "ramya") { c.fillStyle = L.hair; c.beginPath(); c.ellipse(70, hy + 120, 26, 120, 0.25, 0, 7); c.fill(); }   // her braid over the shoulder
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "divya") { c.ellipse(0, hy - 50, 104, 78, 0, Math.PI, 0); c.lineTo(104, hy + 30); c.lineTo(80, hy + 30); c.quadraticCurveTo(60, hy - 50, 0, hy - 70); c.quadraticCurveTo(-60, hy - 50, -80, hy + 30); c.lineTo(-104, hy + 30); }   // a bob
  else { c.ellipse(0, hy - 58, 100, 70, 0, Math.PI, 0); c.lineTo(98, hy - 10); c.quadraticCurveTo(40, hy - 70, 0, hy - 76); c.quadraticCurveTo(-40, hy - 70, -98, hy - 10); }
  c.closePath(); c.fill();
  if (who === "hr") { c.fillStyle = "#a1a1aa"; [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 90, hy - 34, 12, 30, 0, 0, 7); c.fill(); }); }   // grey temples
  if (who === "ramya") { c.beginPath(); c.arc(0, hy - 46, 7, 0, 7); c.fillStyle = RED; c.fill(); }   // bindi
  [-1, 1].forEach((sx) => {   // brows
    let yi = -164, yo = -164;
    if (m === "yell" || m === "stern") { yi = -152; yo = -170; }
    if (m === "shock" || m === "confused") { yi = -182; yo = -180; }
    if (m === "sad") { yi = -180; yo = -160; }
    if (m === "smug") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {   // eyes
    const ey = hy - 4;
    if (m === "shock" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "grin") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (who === "hr" || who === "divya") {   // glasses
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 26), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  if (who === "hr") { c.fillStyle = L.hair; c.beginPath(); c.ellipse(-17, hy + 57, 22, 9, 0.18, 0, 7); c.ellipse(17, hy + 57, 22, 9, -0.18, 0, 7); c.fill(); }   // a moustache
  const my = hy + 80, open = talk || m === "yell" || m === "shock";
  if (open) {
    const w = m === "yell" ? 32 : talk ? 21 : 15, h = m === "yell" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "grin" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "grin" ? 32 : 24, m === "grin" ? 18 : 12, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "sad") stroke(c, circlePts(0, my + 12, 22, 11, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
};
const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(L.s * sc, L.s * sc);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.lineTo(178, 520); c.lineTo(-178, 520); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "hr") {   // a blazer over a white shirt and a tie
    c.fillStyle = "#f8fafc"; c.beginPath(); c.moveTo(-54, 22); c.lineTo(54, 22); c.lineTo(0, 210); c.closePath(); c.fill();
    c.fillStyle = "#7f1d1d"; c.beginPath(); c.moveTo(-14, 34); c.lineTo(14, 34); c.lineTo(22, 172); c.lineTo(0, 198); c.lineTo(-22, 172); c.closePath(); c.fill();
  }
  if (who === "ramya") { c.fillStyle = "#f9a8d4"; c.beginPath(); c.moveTo(-150, 30); c.lineTo(-70, 30); c.lineTo(10, 520); c.lineTo(-90, 520); c.closePath(); c.fill(); }   // dupatta
  c.restore();
  stroke(c, [[-140, 34], [-178, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [178, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-140, 340]], rr: Pt[] = [[178, 230], [140, 340]];
  if (a === "phone") { rr = [[180, 200], [120, 60]]; }
  else if (a === "type") { l = [[-150, 210], [-50, 150]]; rr = [[150, 210], [50, 150]]; }
  else if (a === "fold") { l = [[-120, 250], [80, 230]]; rr = [[120, 250], [-80, 230]]; }
  else if (a === "up") { l = [[-220, -20], [-190, -170]]; rr = [[220, -20], [190, -170]]; }
  else if (a === "shrug") { l = [[-205, 160], [-260, 100]]; rr = [[205, 160], [260, 100]]; }
  else if (a === "point") { rr = [[220, 30], [320, -110]]; }
  else if (a === "chin") { rr = [[150, 160], [40, -20]]; }
  limb(c, [S, l[0], l[1]], L.top, r); palm(c, l[1][0], l[1][1], L.skin, r);
  limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r);
  if (a === "phone") {   // her phone, screen towards us, glowing
    c.save(); c.translate(130, 0); c.rotate(-0.1);
    c.fillStyle = "#111827"; rrect(c, -48, -86, 96, 172, 16); c.fill();
    c.fillStyle = "#f5d0fe"; rrect(c, -40, -76, 80, 152, 10); c.fill();
    c.restore();
  }
  face(c, who, m, talk, r);
  c.restore();
};

// ---------- the AI coach (an unbranded app) ----------
const coachFace = (c: Ctx, x: number, y: number, s: number, strict: boolean, talk: boolean, f: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-60, -60, 60, 60);
  if (strict) { g.addColorStop(0, "#334155"); g.addColorStop(1, "#0f172a"); } else { g.addColorStop(0, "#f472b6"); g.addColorStop(1, "#8b5cf6"); }
  c.fillStyle = g; rrect(c, -60, -60, 120, 120, 30); c.fill();
  stroke(c, [[-60, -60], [60, -60], [60, 60], [-60, 60], [-60, -60]], INK, 3, r, { passes: 1, alpha: 0.4 });
  if (strict) {   // a stern coach: glasses, flat mouth
    [-24, 24].forEach((ex) => { c.beginPath(); c.arc(ex, -10, 9, 0, 7); c.fillStyle = "#fff"; c.fill(); stroke(c, circlePts(ex, -10, 18, 16), "#e2e8f0", 4, r, { passes: 1 }); });
    stroke(c, [[-20, 26], [20, 26]], "#fff", 6, r, { passes: 1 });
  } else {   // sparkly star eyes and a big smile
    [-24, 24].forEach((ex) => {
      c.save(); c.translate(ex, -12); c.rotate(f / 20);
      c.beginPath(); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, rr = k % 2 ? 6 : 15; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.fillStyle = "#fde047"; c.fill(); c.restore();
    });
    if (talk) { c.beginPath(); c.ellipse(0, 22, 20, 14, 0, 0, Math.PI); c.fillStyle = "#fff"; c.fill(); }
    else stroke(c, circlePts(0, 14, 26, 16, 0.3, Math.PI - 0.3, 10), "#fff", 6, r, { passes: 1 });
  }
  c.restore();
};
const confetti = (c: Ctx, x0: number, y0: number, w: number, h: number, f: number, k: number) => {
  if (k <= 0) return;
  const rr = rng(5), cols = ["#f472b6", "#facc15", "#22c55e", "#60a5fa", "#a78bfa", "#fb923c"];
  for (let i = 0; i < 70; i++) {
    const x = x0 + rr() * w, sp = 2 + rr() * 4, y = y0 + ((rr() * h + f * sp) % h);
    c.save(); c.globalAlpha = k; c.translate(x, y); c.rotate(f / 8 + i);
    c.fillStyle = cols[i % cols.length]; c.fillRect(-7, -4, 14, 8); c.restore();
  }
};
// the TYPE THIS card, word for word as we tested it (pipeline/creative07/flattery_demo.py CARD); yellow = you fill it in
const CARD = ["Act as a strict interviewer who rejects 9 out of 10 candidates.", "Job: [your job]", "Question: [the question]",
  "My answer: [paste it]", "Rate it out of 10. List my 3 biggest weaknesses first."];
const CARD_ROWS: [string, boolean][][] = [
  [["Act as a strict interviewer who", false]], [["rejects 9 out of 10 candidates.", false]],
  [["Job: ", false], ["[your job]", true]], [["Question: ", false], ["[the question]", true]], [["My answer: ", false], ["[paste it]", true]],
  [["Rate it out of 10. List my", false]], [["3 biggest weaknesses first.", false]]];
// the coach's chat screen, full frame or as a card: `mode` picks what it shows
type ChatMode = "praise" | "amazing" | "thumbs" | "strict" | "typing" | "critique";
const chat = (c: Ctx, W: number, f: number, r: () => number, mode: ChatMode, talk: boolean, k: number[], te: boolean, say = "4/10") => {
  const strictMode = mode === "critique";
  c.fillStyle = strictMode ? "#0b1220" : "#2e1065"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#0b1220"; rrect(c, 62, 170, W - 124, 1330, 64); c.fill();
  c.fillStyle = strictMode ? "#e2e8f0" : "#fdf4ff"; rrect(c, 88, 198, W - 176, 1274, 44); c.fill();
  coachFace(c, 170, 290, 0.75, strictMode, talk, f, r);
  c.font = caveat(52); c.fillStyle = INK; c.textAlign = "left"; c.fillText(strictMode ? "AI Coach · strict" : "AI Coach", 240, 282);
  c.font = handF(28); c.fillStyle = "#64748b"; c.fillText(strictMode ? "no sugar-coating" : "your interview buddy ✨", 240, 318);
  stroke(c, [[110, 350], [W - 110, 350]], "#e9d5ff", 3, r, { passes: 1 });
  const msg = (y: number, t: string[], me: boolean, kk: number, size = 46, col?: string) => {
    if (kk <= 0) return;
    c.save(); c.globalAlpha = clamp(kk * 3);
    c.font = SANS(size, 600);
    const w = Math.max(...t.map((s) => c.measureText(s).width)) + 60, h = t.length * (size + 14) + 34;
    const x = me ? W - 120 - w : 120;
    c.fillStyle = col ?? (me ? "#dcf8c6" : "#fff"); rrect(c, x, y, w, h, 26); c.fill();
    stroke(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], "#e2e8f0", 2, r, { passes: 1 });
    c.fillStyle = INK; c.textAlign = "left"; t.forEach((s, i) => c.fillText(s, x + 30, y + 30 + size + i * (size + 14) - 8));
    c.restore();
  };
  if (mode === "praise" || mode === "amazing") {
    msg(400, ["Tell me about yourself:", "\"I'm hardworking, a quick", "learner, a team player.\""], true, 1, 40);
    msg(660, mode === "praise" ? ["PERFECT answer! 🎉"] : ["You're doing AMAZING!", "Believe in yourself!"], false, k[0] ?? 1, 52, "#fce7f3");
    c.font = SANS(150); c.fillStyle = PINK; c.textAlign = "center"; if ((k[0] ?? 1) > 0) c.fillText(mode === "praise" ? "10/10" : "💯", W / 2, 1060);
    c.font = SANS(70); c.fillStyle = "#facc15"; if (mode === "praise") c.fillText("★★★★★", W / 2, 1170);
    confetti(c, 100, 360, W - 200, 1100, f, k[0] ?? 1);
  }
  if (mode === "thumbs") {   // how it learned: people thumbs-up the nice replies
    c.font = SANS(44); c.fillStyle = INK; c.textAlign = "center"; c.fillText("how I learned to talk", W / 2, 430);
    const col = (x: number, title: string[], up: boolean, n: number) => {
      c.fillStyle = up ? "#fce7f3" : "#e2e8f0"; rrect(c, x - 200, 480, 400, 220, 24); c.fill();
      c.font = SANS(36, 600); c.fillStyle = INK; title.forEach((t, i) => c.fillText(t, x, 560 + i * 48));
      for (let q = 0; q < n; q++) thumb(c, x - 150 + (q % 4) * 100, 790 + Math.floor(q / 4) * 110, up, r);
    };
    col(300, ["\"Great answer!", "You'll get it!\""], true, Math.round(12 * (k[0] ?? 1)));
    col(780, ["\"Here are 3", "problems...\""], false, Math.round(2 * (k[0] ?? 1)));
    if ((k[1] ?? 0) > 0) tag(c, te ? "so I learned: praise" : "so I learned: be nice", W / 2, 1240, 64, "#fef3c7", INK, -0.02, k[1]);
  }
  if (mode === "strict" || mode === "typing") {
    msg(400, ["Tell me about yourself:", "\"I'm hardworking, a quick", "learner, a team player.\""], true, 1, 40);
    msg(660, ["PERFECT answer! 🎉"], false, 1, 46, "#fce7f3");
  }
  if (mode === "typing") {   // the prompt, typed into the box and shown big (sound-off viewers)
    const full = CARD.join(" ");
    const n = Math.floor(full.length * (k[0] ?? 1));
    c.fillStyle = "#fff"; rrect(c, 110, 1310, W - 220, 130, 30); c.fill();
    stroke(c, [[110, 1310], [W - 110, 1310], [W - 110, 1440], [110, 1440], [110, 1310]], PURPLE, 4, r, { passes: 1 });
    c.font = SANS(28, 600); c.fillStyle = INK; c.textAlign = "left";
    const words = full.slice(0, n).split(" "); let line = "", ly = 1356;
    words.forEach((w) => { if (c.measureText(line + w).width > W - 300) { c.fillText(line, 140, ly); line = ""; ly += 38; } line += w + " "; });
    c.fillText(line, 140, ly);
    if ((k[1] ?? 0) > 0) {   // the copy-paste card (held through the gap after the line)
      const q = k[1];
      c.save(); c.globalAlpha = clamp(q * 3); c.fillStyle = "rgba(15,23,42,0.97)"; rrect(c, 70, 370, W - 140, 800, 30); c.fill();
      c.font = SANS(50); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("TYPE THIS 📋", W / 2, 460);
      c.textAlign = "left";
      CARD_ROWS.forEach((row, i) => {   // [text, filled-in-by-you]
        let x = 120;
        row.forEach(([t, fill]) => { c.font = SANS(42, fill ? 700 : 600); c.fillStyle = fill ? "#facc15" : "#fff"; c.fillText(t, x, 560 + i * 72); x += c.measureText(t).width; });
      });
      c.font = SANS(30, 600); c.fillStyle = "#94a3b8"; c.textAlign = "center";
      c.fillText("a new chat can forget it: save it in custom instructions", W / 2, 1120);
      c.restore();
    }
  }
  if (mode === "critique") {
    msg(400, ["Act as a strict interviewer who", "rejects 9 out of 10 candidates.", "Job: accounts executive ..."], true, 1, 36);
    c.font = SANS(160); c.fillStyle = "#b91c1c"; c.textAlign = "center"; if ((k[0] ?? 1) > 0) { c.save(); c.globalAlpha = clamp((k[0] ?? 1) * 3); c.fillText(say, W / 2, 840); c.restore(); }
    const rows = te ? ["1. no example of anything you did", "2. everyone says \"hardworking\"", "3. nothing about this job"] : ["1. no example of anything you did", "2. everyone says \"hardworking\"", "3. nothing about this job"];
    rows.forEach((t, i) => {
      const q = k[i + 1] ?? 0; if (q <= 0) return;
      c.save(); c.globalAlpha = clamp(q * 3); c.fillStyle = "#fee2e2"; rrect(c, 120, 920 + i * 140, W - 240, 112, 22); c.fill();
      c.font = SANS(42); c.fillStyle = "#7f1d1d"; c.textAlign = "left"; c.fillText(t, 150, 990 + i * 140); c.restore();
    });
  }
};
const thumb = (c: Ctx, x: number, y: number, up: boolean, r: () => number) => {
  c.save(); c.translate(x, y); if (!up) c.rotate(Math.PI);
  c.fillStyle = up ? "#f59e0b" : "#64748b"; rrect(c, -26, -10, 52, 46, 10); c.fill();
  rrect(c, -10, -46, 22, 40, 10); c.fill();
  stroke(c, [[-26, -10], [26, -10], [26, 36], [-26, 36], [-26, -10]], INK, 3, r, { passes: 1, alpha: 0.5 });
  c.restore();
};

// ---------- the two rooms ----------
const pgRoom = (c: Ctx, y0: number, h: number, r: () => number, f: number) => {
  c.fillStyle = "#fde2e4"; c.fillRect(0, y0, 1080, h);
  // a window with a neem tree and a water tank on the next roof
  c.fillStyle = "#bae6fd"; c.fillRect(700, y0 + 120, 300, 260);
  c.fillStyle = "#16a34a"; c.beginPath(); c.arc(760, y0 + 300, 90, 0, 7); c.fill();
  c.fillStyle = "#334155"; rrect(c, 880, y0 + 250, 80, 90, 10); c.fill();
  stroke(c, [[700, y0 + 120], [1000, y0 + 120], [1000, y0 + 380], [700, y0 + 380], [700, y0 + 120]], "#94a3b8", 12, r, { passes: 2 });
  // coaching flyers on the wall (no brands)
  const fl: [number, number, string, string, number][] = [[80, y0 + 130, "#fef08a", "INTERVIEW\nPREP", -0.06], [260, y0 + 110, "#bbf7d0", "TALLY\n+ GST", 0.05], [440, y0 + 140, "#bfdbfe", "SPOKEN\nENGLISH", -0.03]];
  fl.forEach(([x, y, col, t, rot]) => {
    c.save(); c.translate(x + 70, y + 60); c.rotate(rot); c.fillStyle = col; c.fillRect(-70, -60, 140, 120);
    c.font = SANS(22); c.fillStyle = INK; c.textAlign = "center"; t.split("\n").forEach((s, i) => c.fillText(s, 0, -8 + i * 28)); c.restore();
  });
  // the bed
  c.fillStyle = "#c084fc"; c.fillRect(0, y0 + h - 230, 1080, 230);
  c.fillStyle = "#e9d5ff"; rrect(c, 40, y0 + h - 270, 260, 70, 30); c.fill();   // a pillow
  void f;
};
const office = (c: Ctx, y0: number, h: number, r: () => number) => {
  c.fillStyle = "#e2e8f0"; c.fillRect(0, y0, 1080, h);
  c.fillStyle = "#cbd5e1"; c.fillRect(0, y0, 1080, 60);
  // a framed certificate and a clock
  c.fillStyle = "#fff"; rrect(c, 80, y0 + 110, 200, 150, 8); c.fill(); stroke(c, [[80, y0 + 110], [280, y0 + 110], [280, y0 + 260], [80, y0 + 260], [80, y0 + 110]], "#a16207", 8, r, { passes: 1 });
  c.beginPath(); c.arc(900, y0 + 170, 60, 0, 7); c.fillStyle = "#fff"; c.fill(); stroke(c, circlePts(900, y0 + 170, 60, 60), INK, 5, r, { passes: 1 });
  stroke(c, [[900, y0 + 170], [900, y0 + 130]], INK, 5, r, { passes: 1 }); stroke(c, [[900, y0 + 170], [930, y0 + 182]], INK, 5, r, { passes: 1 });
};
const deskFront = (c: Ctx, y: number, r: () => number, stampK: number, f: number, okK = 0) => {
  c.fillStyle = "#92400e"; c.fillRect(0, y, 1080, 300);
  c.fillStyle = "#b45309"; c.fillRect(0, y, 1080, 26);
  stroke(c, [[0, y], [1080, y]], INK, 5, r, { passes: 1, alpha: 0.5 });
  // the name plate and the file
  c.fillStyle = "#fef3c7"; rrect(c, 690, y - 70, 220, 70, 10); c.fill(); c.font = SANS(34); c.fillStyle = INK; c.textAlign = "center"; c.fillText("HR", 800, y - 24);
  c.save(); c.translate(330, y - 30); c.rotate(-0.04);
  c.fillStyle = "#fde68a"; c.fillRect(-150, -60, 300, 110);
  c.font = SANS(26); c.fillStyle = INK; c.fillText("RAMYA · B.Com 2025", 0, -18);
  if (stampK > 0) {
    const q = easeOut(clamp(stampK)), sc = 1.8 - 0.8 * q;
    c.save(); c.scale(sc, sc); c.rotate(-0.12); c.globalAlpha = clamp(stampK * 2);
    c.strokeStyle = RED; c.lineWidth = 7; c.strokeRect(-130, -2, 260, 56);
    c.font = SANS(44); c.fillStyle = RED; c.fillText("REJECTED", 0, 44); c.restore();
  }
  if (okK > 0) {
    const q = easeOut(clamp(okK)), sc = 1.8 - 0.8 * q;
    c.save(); c.scale(sc, sc); c.rotate(-0.1); c.globalAlpha = clamp(okK * 2);
    c.strokeStyle = GREEN; c.lineWidth = 7; c.strokeRect(-150, -2, 300, 56);
    c.font = SANS(42); c.fillStyle = GREEN; c.fillText("SHORTLISTED", 0, 44); c.restore();
  }
  c.restore();
  void f;
};
const panelLabel = (c: Ctx, x: number, y: number, t: string, col: string) => {
  c.font = SANS(36); const w = c.measureText(t).width + 40;
  c.fillStyle = col; rrect(c, x, y, w, 58, 16); c.fill();
  c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(t, x + 20, y + 41);
};
// the practice panel (top half) and the interview panel (bottom half)
const practicePanel = (c: Ctx, W: number, f: number, r: () => number, who: Who, praiseK: number, talkAI: boolean, talkMe: boolean, strict = false, label = "PRACTICE · with AI", good = "7/10") => {
  c.save(); c.beginPath(); c.rect(0, 0, W, H2); c.clip();
  pgRoom(c, 0, H2, r, f);
  person(c, who, [300, 640], 0.82, talkMe ? "grin" : "happy", "phone", talkMe, r);
  // the phone, big beside her, the coach praising
  c.save(); c.translate(760, 600); c.rotate(0.04);
  c.fillStyle = "#111827"; rrect(c, -170, -300, 340, 560, 40); c.fill();
  c.fillStyle = strict ? "#e2e8f0" : "#fdf4ff"; rrect(c, -150, -280, 300, 520, 28); c.fill();
  coachFace(c, 0, -170, 0.8, strict, talkAI, f, r);
  if (strict) {
    c.font = SANS(30, 600); c.fillStyle = "#475569"; c.textAlign = "center"; c.fillText("her new answer:", 0, -60);
    c.font = SANS(96); c.fillStyle = GREEN; c.fillText(good, 0, 40); c.font = SANS(28, 600); c.fillStyle = INK; c.fillText("✓ one real example", 0, 100);
  }
  else if (praiseK > 0) {
    c.font = SANS(110); c.fillStyle = PINK; c.textAlign = "center"; c.fillText("10/10", 0, 30);
    c.font = SANS(50); c.fillStyle = "#facc15"; c.fillText("★★★★★", 0, 100);
    c.font = SANS(34); c.fillStyle = INK; c.fillText("PERFECT! 🎉", 0, 170);
  }
  c.restore();
  if (!strict) confetti(c, 560, 280, 420, 600, f, praiseK);
  panelLabel(c, 40, 250, label, strict ? NAVY : PURPLE);
  c.restore();
};
const interviewPanel = (c: Ctx, W: number, f: number, r: () => number, m: Mood, a: Arms, talkHR: boolean, stampK: number, tagT: string | null, tagK: number, chip: string | null, okK: number) => {
  c.save(); c.beginPath(); c.rect(0, H2, W, 1920 - H2); c.clip();
  office(c, H2, 1920 - H2, r);
  person(c, "hr", [560, H2 + 330], 0.8, m, a, talkHR, r);
  deskFront(c, H2 + 470, r, stampK, f, okK);
  panelLabel(c, 40, H2 + 90, "REAL INTERVIEW", RED);
  if (chip) {   // the job, so "nothing about this job" has a job
    c.font = SANS(30, 600); const w = c.measureText(chip).width + 32;
    c.fillStyle = "#fff"; rrect(c, 40, H2 + 160, w, 50, 14); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(chip, 56, H2 + 196);
  }
  if (tagT && tagK > 0) tag(c, tagT, 820, H2 + 120, 46, "#fff", INK, 0.03, tagK);
  c.restore();
  // the divider
  c.fillStyle = INK; c.fillRect(0, H2 - 5, W, 10);
};

const MOOD_RAMYA: Record<number, [Mood, Arms]> = { 3: ["yell", "phone"], 5: ["confused", "shrug"], 7: ["sad", "chin"], 9: ["calm", "type"], 11: ["shock", "phone"], 13: ["calm", "rest"] };

// ---------- the scene ----------
const StInterview: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const te = (s.data as { handle?: string }).handle === "@ai_maastaaru_telugu";
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  const D: { plain: string; strict: string; typed: string; good: string; say: string; note: string } =
    { plain: "?/10", strict: "?/10", typed: "?/10", good: "?/10", say: "4/10", note: "", ...((s.data as { demo?: object }).demo ?? {}) };
  const i11 = beats.findIndex((b) => b.n === 11);
  const rowAt = i11 >= 0 ? [ls[i11].from + Math.round(ls[i11].frames * 0.25), ls[i11].from + ls[i11].frames + 4] : [0, 0];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    if (b.shot === "phone") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook" || b.prop === "loop") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 6)} src="reel/sfx_boom.wav" vol={b.prop === "loop" ? 1.0 : 0.9} />,
      <Sfx key={k("c")} at={Math.max(0, at - 6)} src="audio/sfx_chaching.wav" vol={0.35} />, <Sfx key={k("p")} at={at + 10} src="audio/gag_pop.wav" vol={0.35} />);
    if (b.prop === "next") sfx.push(<Sfx key={k("s")} at={end - 6} src="audio/sfx_snap.wav" vol={0.6} />, <Sfx key={k("b")} at={end - 6} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "amazing") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/gag_pop.wav" vol={0.3} />);
    if (b.prop === "thumbs") for (let q = 0; q < 8; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 6 + q * 4} src="audio/sfx_pop.wav" vol={0.18} />);
    if (b.prop === "strict") sfx.push(<Sfx key={k("r")} at={end - 30} src="reel/sfx_riser.wav" vol={0.45} />);
    if (b.prop === "typing") {
      for (let q = 0; q < 8; q++) sfx.push(<Sfx key={k("k" + q)} at={at + q * 5} src="audio/sfx_tick.wav" vol={0.15} />);
      sfx.push(<Sfx key={k("c")} at={at + Math.round(l.frames * 0.3)} src="audio/gag_pop.wav" vol={0.4} />);
    }
    if (b.prop === "critique") sfx.push(<Sfx key={k("h")} at={Math.max(0, at - 8)} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("g")} at={Math.max(0, at - 8)} src="reel/sfx_glitch.wav" vol={0.35} />,
      <Sfx key={k("o")} at={cue(i, 1, 0.4)} src="audio/gag_bonk.wav" vol={0.3} />);
    if (b.prop === "ouch") sfx.push(<Sfx key={k("w2")} at={at} src="audio/sfx_whoosh.wav" vol={0.25} />,
      <Sfx key={k("p1")} at={rowAt[0]} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("p2")} at={rowAt[1]} src="audio/sfx_pop.wav" vol={0.4} />);
    if (b.prop === "specific") sfx.push(<Sfx key={k("d")} at={end - 4} src="audio/sfx_success.wav" vol={0.4} />, <Sfx key={k("s")} at={end - 4} src="audio/sfx_snap.wav" vol={0.4} />);
    if (b.prop === "divya") sfx.push(<Sfx key={k("r")} at={nx - 34} src="reel/sfx_riser.wav" vol={0.5} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9800 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const cardAt = ln.from + Math.round(ln.frames * 0.3);   // the TYPE THIS card (line 9) pops in here
        if (b.shot === "split") {
          const who: Who = n >= 14 ? "divya" : "ramya";
          const strictTop = n === 12 || n === 13;
          practicePanel(c, W, f, r, who, n <= 2 ? 1 : 0, b.who === "coach" && talking, b.who === "divya" && talking, strictTop,
            strictTop ? "PRACTICE · strict AI" : "PRACTICE · with AI", D.good);
          const hrMood: Mood = n >= 13 ? "happy" : n === 12 ? "calm" : "stern";
          const hrArms: Arms = n >= 13 ? "chin" : "fold";
          const stampK = n === 2 ? seg(f, endL - 8, endL) : 0;
          const okAt = n === 13 ? endL - 4 : -1;   // SHORTLISTED lands on the success sting and stays
          const okK = n === 13 ? seg(f, okAt, okAt + 8) : n === 14 ? 1 : 0;
          const chip = n <= 2 ? "accounts executive · interview #5" : "accounts executive · interview #6";
          interviewPanel(c, W, f, r, hrMood, hrArms, b.who === "hr" && talking, stampK, n === 13 ? "\"Go on...\"" : null,
            seg(f, ln.from + 20, ln.from + 30), chip, okK);
          if (n <= 2) {   // her practice answer, the one forty people gave (read in the first second)
            c.save(); c.fillStyle = "#fff"; rrect(c, 30, H2 - 78, W - 60, 128, 22); c.fill();
            stroke(c, [[30, H2 - 78], [W - 30, H2 - 78], [W - 30, H2 + 50], [30, H2 + 50], [30, H2 - 78]], INK, 4, r, { passes: 1, alpha: 0.6 });
            c.font = SANS(26, 600); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("her answer:", 56, H2 - 40);
            c.font = SANS(40); c.fillStyle = INK; c.textAlign = "center"; c.fillText("\u201cI'm hardworking, a quick learner, a team player.\u201d", W / 2, H2 + 18);
            c.restore();
          }
          if (n === 13) {   // Ramya's answer as a bubble over the interview panel
            bubble(c, 540, H2 + 640, "\"I cut billing errors by half.\"", 52, seg(p, 0.05, 0.2), "#dcfce7", "#14532d");
          }
          if (n === 2 && f >= endL - 8) { c.save(); c.globalAlpha = 0.15 * (1 - seg(f, endL - 8, endL + 6)); c.fillStyle = "#fff"; c.fillRect(0, H2, W, H - H2); c.restore(); }
        } else if (b.shot === "phone") {
          const modes: Record<string, ChatMode> = { amazing: "amazing", thumbs: "thumbs", strict: "strict", typing: "typing", critique: "critique" };
          const mode = modes[b.prop] ?? "praise";
          const ks: number[] = mode === "thumbs" ? [seg(p, 0.05, 0.7), seg(f, cu(1, 0.5), cu(1, 0.5) + 10)]
            : mode === "typing" ? [seg(p, 0.0, 0.5), seg(f, cardAt, cardAt + 6)]
            : mode === "critique" ? [seg(p, 0.0, 0.08), seg(f, cu(1, 0.35), cu(1, 0.35) + 8), seg(f, cu(1, 0.35) + 30, cu(1, 0.35) + 38), seg(f, cu(1, 0.35) + 60, cu(1, 0.35) + 68)]
            : [1];
          chat(c, W, f, r, mode, (b.who === "coach" || b.who === "strict") && talking, ks, te, D.say);
        } else {
          // ---------- Ramya at home (full frame) ----------
          pgRoom(c, 0, H, r, f);
          const [m, a] = MOOD_RAMYA[n] ?? ["calm", "phone"];
          if (n === 11) person(c, "ramya", [540, 1290], 0.95, m, a, b.who === "ramya" && talking, r);
          else person(c, "ramya", [470, 980], 1.15, m, a, b.who === "ramya" && talking, r);
          if (n === 3) bubble(c, 330, 520, te ? "5 rejections!" : "5 rejections!", 76, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (n === 5) bubble(c, 330, 520, "why?!", 90, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 7) bubble(c, 330, 520, te ? "the truth?" : "the truth?", 80, seg(p, 0.05, 0.2), COL.yellow);
          if (n === 11) {   // our real test, as a card over her: two numbers, the same copy-paste answer
            const k0 = seg(p, 0.02, 0.12);
            c.save(); c.globalAlpha = clamp(k0 * 2); c.fillStyle = "rgba(255,253,245,0.97)"; rrect(c, 70, 230, W - 140, 760, 30); c.fill();
            c.font = SANS(52); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 312);
            c.font = SANS(32, 600); c.fillStyle = "#475569"; c.fillText("her copy-paste answer · a free AI · 10 tries each", W / 2, 364);
            const row = (y: number, a1: string, a2: string, col: string, ink: string, kk: number) => {
              if (kk <= 0) return;
              c.save(); c.globalAlpha = clamp(kk * 3);
              c.fillStyle = col; rrect(c, 110, y, W - 220, 240, 24); c.fill();
              c.font = SANS(40, 600); c.fillStyle = INK; c.textAlign = "left"; c.fillText(a1, 150, y + 68);
              c.font = SANS(120); c.fillStyle = ink; c.fillText(a2, 150, y + 200); const nw = c.measureText(a2).width;
              c.font = SANS(36, 600); c.fillStyle = "#475569"; c.fillText("average", 150 + nw + 24, y + 196); c.restore();
            };
            row(396, "asked \"How is it?\"", D.plain, "#fce7f3", PINK, seg(f, rowAt[0], rowAt[0] + 6));
            row(660, "asked with TYPE THIS", D.typed, "#e2e8f0", NAVY, seg(f, rowAt[1], rowAt[1] + 6));
            c.font = SANS(30, 600); c.fillStyle = "#475569"; c.textAlign = "center";
            if (f >= rowAt[1]) c.fillText(D.note, W / 2, 950);
            c.restore();
          }
        }
        void handF; void stamp; void GREEN;
      }} />
    </>
  );
};

export const INTERVIEW_SCENES = { sk_interview: StInterview };
