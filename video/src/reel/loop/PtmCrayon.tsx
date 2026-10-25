import React from "react";
import { Ctx, Pt, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, rrectPts, tag, Sfx } from "./DistillCrayon";
import { INK, caveat, handF, stamp } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";

// Creative 09 "Teach me, don't tell me" (series/scripts/creative09_teach_me.md, script v2): a parent-teacher meeting in
// Class 8-B. Padma ma'am shows a dad his son Kittu's papers: homework 10/10 every day, class test 2/20. The AI did the
// homework. Don't ban it (a study, PNAS 2025: kids who got AI answers did 17% worse in the exam than kids with no AI,
// hints: no drop), change what he types: "Don't give me the answer. Teach me one question at a time." The AI asks, Kittu
// answers, he solves it himself; our test (series/scripts/creative09_demo): "Solve" 10/10 answers, the line 0/10. Then,
// on a new sum, he types "Just tell me the answer." and it gives in (our test's own reply; 7 of 10 times); ma'am: don't
// check his answers, ask step one. The dad asks. Kittu: "Step one is... ask the AI?" The replay's first frame (the papers
// slamming down) is the payoff, so the end has no slam of its own. The AI is an unbranded chat app ("AI chat").
// One beat per line (s.data.beats); n = the line number in the script.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type Mood = "stern" | "calm" | "smile" | "shock" | "yell" | "sheepish" | "happy" | "smug" | "confused" | "sus";
type Arms = "rest" | "papers" | "point" | "fold" | "phone" | "phoneBig" | "type" | "up" | "palm" | "chin";
type Who = "teacher" | "dad" | "kittu";

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const GREEN = "#16a34a", RED = "#dc2626", PURPLE = "#7c3aed", NAVY = "#1e293b";
const LOOK: Record<Who, { skin: string; hair: string; top: string; s: number }> = {
  teacher: { skin: "#a8704a", hair: "#1f1a17", top: "#7f1d1d", s: 1.0 },
  dad: { skin: "#8f5d3d", hair: "#18181b", top: "#e0f2fe", s: 1.02 },
  kittu: { skin: "#a26d47", hair: "#0f0f12", top: "#f8fafc", s: 0.8 },
};
// necks in the classroom wide shot (world = the wide shot)
const AT: Record<Who, Pt> = { teacher: [300, 760], dad: [700, 830], kittu: [925, 905] };
const DESK = 1150;

// ---------- people ----------
const limb = (c: Ctx, pts: Pt[], col: string, r: () => number, w = 42) => {
  stroke(c, pts, col, w, r, { passes: 2, alpha: 1, jit: 1.5 });
  stroke(c, pts, INK, 4, r, { passes: 1, alpha: 0.4 });
};
const palm = (c: Ctx, x: number, y: number, skin: string, r: () => number, rad = 24) => {
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fillStyle = skin; c.fill();
  stroke(c, circlePts(x, y, rad, rad), INK, 3, r, { passes: 1, alpha: 0.55 });
};
const phoneProp = (c: Ctx, x: number, y: number, s: number, rot: number) => {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "#111827"; rrect(c, -48, -86, 96, 172, 16); c.fill();
  c.fillStyle = "#c4b5fd"; rrect(c, -40, -76, 80, 152, 10); c.fill();
  c.font = SANS(40, 900); c.fillStyle = "#4c1d95"; c.textAlign = "center"; c.fillText("AI", 0, -18);
  c.fillStyle = "rgba(255,255,255,0.6)"; rrect(c, -30, 6, 60, 14, 6); c.fill(); rrect(c, -30, 30, 44, 14, 6); c.fill();
  c.restore();
};
const face = (c: Ctx, who: Who, m: Mood, talk: boolean, r: () => number) => {
  const L = LOOK[who], hy = -130;
  if (who === "teacher") { c.fillStyle = L.hair; c.beginPath(); c.arc(0, hy - 104, 46, 0, 7); c.fill(); }   // a bun on top
  [-1, 1].forEach((s) => { c.beginPath(); c.ellipse(s * 92, hy + 6, 16, 26, 0, 0, 7); c.fillStyle = L.skin; c.fill(); });
  c.beginPath(); c.ellipse(0, hy, 94, 112, 0, 0, 7); c.fillStyle = L.skin; c.fill();
  stroke(c, circlePts(0, hy, 94, 112), INK, 4, r, { passes: 2, alpha: 0.55 });
  c.fillStyle = L.hair; c.beginPath();
  if (who === "teacher") {   // parted in the middle, pulled back
    c.ellipse(0, hy - 56, 100, 72, 0, Math.PI, 0); c.lineTo(100, hy + 4); c.quadraticCurveTo(52, hy - 58, 4, hy - 80); c.lineTo(-4, hy - 80); c.quadraticCurveTo(-52, hy - 58, -100, hy + 4);
  } else if (who === "kittu") {   // a neat school cut with a side parting
    c.ellipse(0, hy - 58, 100, 68, 0, Math.PI, 0); c.lineTo(98, hy - 24); c.quadraticCurveTo(10, hy - 90, -40, hy - 70); c.quadraticCurveTo(-80, hy - 52, -98, hy - 20);
  } else {   // dad: short, a touch of grey
    c.ellipse(0, hy - 60, 100, 64, 0, Math.PI, 0); c.lineTo(96, hy - 30); c.quadraticCurveTo(30, hy - 82, -96, hy - 30);
  }
  c.closePath(); c.fill();
  if (who === "dad") { c.fillStyle = "#71717a"; [-1, 1].forEach((sx) => { c.beginPath(); c.ellipse(sx * 90, hy - 20, 9, 22, 0, 0, 7); c.fill(); }); }
  if (who === "teacher") { c.beginPath(); c.arc(0, hy - 46, 9, 0, 7); c.fillStyle = RED; c.fill(); }   // a bindi
  const brow = m === "sheepish" ? [-180, -160] : m === "yell" || m === "stern" ? [-152, -172] : m === "shock" || m === "confused" ? [-184, -182] : [-164, -164];
  [-1, 1].forEach((sx) => {
    let [yi, yo] = brow;
    if (m === "smug" || m === "sus") { yi = sx > 0 ? -176 : -160; yo = sx > 0 ? -170 : -164; }
    stroke(c, [[sx * 14, hy + (yi + 130)], [sx * 62, hy + (yo + 130)]], L.hair, 12, r, { passes: 2 });
  });
  [-36, 36].forEach((ex) => {
    const ey = hy - 4;
    if (m === "shock" || m === "yell") {
      c.beginPath(); c.ellipse(ex, ey, 18, 20, 0, 0, 7); c.fillStyle = "#fff"; c.fill();
      c.beginPath(); c.arc(ex, ey + 2, 8, 0, 7); c.fillStyle = INK; c.fill();
    } else if (m === "happy" || m === "smile") {
      stroke(c, circlePts(ex, ey + 6, 14, 11, Math.PI * 1.1, Math.PI * 1.9, 10), INK, 6, r, { passes: 2 });
    } else if (m === "smug" || m === "sus") {
      stroke(c, [[ex - 15, ey], [ex + 15, ey - 2]], INK, 6, r, { passes: 2 });
    } else if (m === "sheepish") {
      c.beginPath(); c.arc(ex + 6, ey + 6, 8, 0, 7); c.fillStyle = INK; c.fill();   // looking down and away
    } else { c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fillStyle = INK; c.fill(); }
  });
  if (who === "teacher") {   // glasses
    [-36, 36].forEach((ex) => stroke(c, circlePts(ex, hy - 4, 30, 25), INK, 5, r, { passes: 2 }));
    stroke(c, [[-6, hy - 6], [6, hy - 6]], INK, 5, r, { passes: 1 });
  }
  stroke(c, [[2, hy + 4], [12, hy + 32], [-6, hy + 38]], "#7c4a2b", 6, r, { passes: 2 });
  if (who === "dad") { c.fillStyle = "#18181b"; c.beginPath(); c.ellipse(-20, hy + 56, 26, 10, 0.2, 0, 7); c.ellipse(20, hy + 56, 26, 10, -0.2, 0, 7); c.fill(); }   // moustache
  const my = hy + 80, open = talk || m === "yell" || m === "shock";
  if (open) {
    const w = m === "yell" ? 32 : talk ? 21 : 15, h = m === "yell" ? 24 : talk ? 12 : 17;
    c.beginPath(); c.ellipse(0, my, w, h, 0, 0, 7); c.fillStyle = "#3b0d0d"; c.fill();
  } else if (m === "happy" || m === "smile" || m === "calm") {
    stroke(c, circlePts(0, my - 8, m === "happy" ? 30 : 22, m === "happy" ? 16 : 10, 0.25, Math.PI - 0.25, 10), INK, 6, r, { passes: 2 });
  } else if (m === "smug" || m === "sus") stroke(c, [[-20, my + 2], [6, my + 2], [22, my - 10]], INK, 6, r, { passes: 2 });
  else if (m === "sheepish") stroke(c, [[-18, my + 6], [0, my], [18, my + 6]], INK, 6, r, { passes: 2 });
  else if (m === "confused") stroke(c, [[-16, my + 4], [0, my - 2], [16, my + 4]], INK, 6, r, { passes: 2 });
  else stroke(c, [[-16, my], [16, my]], INK, 6, r, { passes: 2 });
  if (m === "sheepish" || m === "shock") { c.beginPath(); c.moveTo(92, hy - 70); c.quadraticCurveTo(112, hy - 40, 92, hy - 30); c.quadraticCurveTo(76, hy - 40, 92, hy - 70); c.fillStyle = "#7dd3fc"; c.fill(); }   // a sweat drop
  if (who === "teacher") [-1, 1].forEach((sx) => { c.beginPath(); c.arc(sx * 94, hy + 28, 7, 0, 7); c.fillStyle = "#facc15"; c.fill(); });
};
const person = (c: Ctx, who: Who, at: Pt, sc: number, m: Mood, a: Arms, talk: boolean, r: () => number) => {
  const L = LOOK[who];
  c.save(); c.translate(at[0], at[1]); c.scale(L.s * sc, L.s * sc);
  c.save();
  c.beginPath(); c.moveTo(-140, 34); c.quadraticCurveTo(0, 6, 140, 34); c.quadraticCurveTo(178, 330, 192, 780); c.lineTo(-192, 780);
  c.quadraticCurveTo(-178, 330, -140, 34); c.closePath();
  c.fillStyle = L.top; c.fill(); c.clip();
  if (who === "teacher") {   // a maroon saree, a gold-bordered pallu over the shoulder
    c.fillStyle = "#9f1239"; c.beginPath(); c.moveTo(-150, 24); c.lineTo(-30, 24); c.lineTo(200, 640); c.lineTo(70, 780); c.closePath(); c.fill();
    stroke(c, [[-30, 24], [200, 640]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 }); stroke(c, [[-150, 24], [70, 780]], "#f59e0b", 14, r, { passes: 2, alpha: 0.9 });
  }
  if (who === "dad") {   // a light office shirt, a pocket and a pen
    stroke(c, rrectPts(40, 120, 72, 70), "#94a3b8", 4, r, { passes: 1 }); stroke(c, [[60, 96], [60, 150]], "#1d4ed8", 7, r, { passes: 1 });
    [90, 190, 290, 390].forEach((y) => { c.beginPath(); c.arc(0, y, 6, 0, 7); c.fillStyle = "#94a3b8"; c.fill(); });
  }
  if (who === "kittu") {   // school uniform: a striped tie, an ID card on a red ribbon
    c.fillStyle = "#1e3a8a"; c.beginPath(); c.moveTo(-18, 30); c.lineTo(18, 30); c.lineTo(30, 300); c.lineTo(0, 340); c.lineTo(-30, 300); c.closePath(); c.fill();
    c.strokeStyle = "#facc15"; c.lineWidth = 8; for (let y = 70; y < 320; y += 50) { c.beginPath(); c.moveTo(-26, y); c.lineTo(26, y + 22); c.stroke(); }
    stroke(c, [[-60, 30], [-80, 230]], "#dc2626", 8, r, { passes: 1 }); c.fillStyle = "#fff"; rrect(c, -130, 220, 96, 120, 10); c.fill();
    stroke(c, rrectPts(-130, 220, 96, 120), "#94a3b8", 3, r, { passes: 1 });
  }
  c.restore();
  stroke(c, [[-140, 34], [-180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 }); stroke(c, [[140, 34], [180, 520]], INK, 4, r, { passes: 2, alpha: 0.5 });
  c.fillStyle = L.skin; c.fillRect(-32, -30, 64, 50);
  const S: Pt = [-132, 60], R: Pt = [132, 60];
  let l: Pt[] = [[-178, 230], [-150, 380]], rr: Pt[] = [[178, 230], [150, 380]];
  if (a === "papers") { l = [[-230, 40], [-260, -150]]; rr = [[230, 40], [260, -150]]; }
  else if (a === "point") rr = [[220, 30], [320, -110]];
  else if (a === "fold") { l = [[-160, 210], [80, 175]]; rr = [[160, 230], [-80, 195]]; }
  else if (a === "phone") rr = [[182, 220], [118, 120]];
  else if (a === "phoneBig") rr = [[180, 200], [120, 70]];
  else if (a === "type") { l = [[-150, 230], [-50, 160]]; rr = [[150, 230], [50, 160]]; }
  else if (a === "up") { l = [[-220, -20], [-112, -196]]; rr = [[220, -20], [112, -196]]; }
  else if (a === "palm") rr = [[200, 120], [250, -20]];
  else if (a === "chin") rr = [[150, 160], [40, -40]];
  limb(c, [S, l[0], l[1]], who === "teacher" ? "#7f1d1d" : L.top, r); palm(c, l[1][0], l[1][1], L.skin, r);
  const front = a === "chin";
  if (!front) { limb(c, [R, rr[0], rr[1]], who === "teacher" ? "#7f1d1d" : L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  if (a === "phone" || a === "type") phoneProp(c, a === "type" ? 0 : 126, a === "type" ? 150 : 60, 1, a === "type" ? 0 : -0.1);
  if (a === "phoneBig") phoneProp(c, 112, -10, 1.55, -0.12);
  face(c, who, m, talk, r);
  if (front) { limb(c, [R, rr[0], rr[1]], L.top, r); palm(c, rr[1][0], rr[1][1], L.skin, r); }
  c.restore();
};

// ---------- the classroom ----------
const room = (c: Ctx, W: number, f: number, r: () => number, sum = "3x + 5 = 20") => {
  c.fillStyle = "#cfe3c4"; c.fillRect(-300, 0, W + 600, 1920);
  // the blackboard
  c.fillStyle = "#6b4423"; rrect(c, 70, 250, 760, 380, 14); c.fill();
  c.fillStyle = "#1f3d2e"; rrect(c, 86, 266, 728, 348, 8); c.fill();
  c.font = caveat(56); c.fillStyle = "rgba(248,250,252,0.92)"; c.textAlign = "left";
  c.fillText("PTM · Class 8-B", 120, 330); c.font = caveat(64); c.fillText(sum, 140, 430);
  c.font = caveat(44); c.fillStyle = "rgba(253,230,138,0.85)"; c.fillText("show your steps!", 150, 520);
  // a wall clock, a chart, the window
  c.beginPath(); c.arc(940, 330, 64, 0, 7); c.fillStyle = "#fff"; c.fill(); stroke(c, circlePts(940, 330, 64, 64), INK, 5, r, { passes: 1 });
  const a = f / 300; stroke(c, [[940, 330], [940 + Math.cos(a) * 40, 330 + Math.sin(a) * 40]], INK, 5, r, { passes: 1 }); stroke(c, [[940, 330], [940, 286]], INK, 6, r, { passes: 1 });
  c.fillStyle = "#fde68a"; rrect(c, 870, 450, 150, 190, 8); c.fill();
  c.font = handF(26); c.fillStyle = INK; c.textAlign = "center"; c.fillText("TIMES", 945, 490); c.fillText("TABLE", 945, 522);
  // the floor line
  c.fillStyle = "#b9a37a"; c.fillRect(-300, 1500, W + 600, 420);
};
const desk = (c: Ctx, W: number, r: () => number) => {
  c.fillStyle = "#8b5a2b"; c.fillRect(-300, DESK, W + 600, 1100);   // down past the frame: the dad's shirt ends below it
  c.fillStyle = "#a0673a"; c.fillRect(-300, DESK, W + 600, 36);
  stroke(c, [[-200, DESK], [W + 200, DESK]], INK, 5, r, { passes: 2, alpha: 0.6 });
  // a stack of notebooks on the desk, a red 10/10 on top
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#60a5fa" : "#f87171"; rrect(c, 90 + (i % 2) * 6, DESK - 28 - i * 22, 260, 22, 4); c.fill(); }
  c.font = caveat(48); c.fillStyle = RED; c.textAlign = "left"; c.fillText("10/10 ✓", 120, DESK - 170);
};
// the two papers (frame 1 and the loop's slam): HOMEWORK 10/10 and CLASS TEST 2/20, big, in screen space, slammed onto the
// desk below the three faces (the faces stay visible: the jaw drop and the sweat are half the joke)
const papers = (c: Ctx, W: number, k: number, shake: number, r: () => number) => {
  if (k <= 0) return;
  const sh = shake ? (r() - 0.5) * shake : 0;
  const sheet = (x: number, y: number, rot: number, head: string, score: string, col: string, sub: string) => {
    c.save(); c.translate(x + sh, y); c.rotate(rot); const q = easeOut(clamp(k)); c.scale(0.68 + 0.17 * q, 0.68 + 0.17 * q); c.globalAlpha = clamp(k * 3);
    c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, -200 + 10, -250 + 14, 400, 500, 18); c.fill();
    c.fillStyle = "#fffdf5"; rrect(c, -200, -250, 400, 500, 18); c.fill();
    c.strokeStyle = "rgba(96,165,250,0.4)"; c.lineWidth = 3; for (let yy = -150; yy < 230; yy += 44) { c.beginPath(); c.moveTo(-170, yy); c.lineTo(170, yy); c.stroke(); }
    c.font = SANS(38, 800); c.fillStyle = NAVY; c.textAlign = "center"; c.fillText(head, 0, -190);
    c.font = caveat(150); c.fillStyle = col; c.fillText(score, 0, 40);
    stroke(c, circlePts(0, 0, 170, 100), col, 8, r, { passes: 2, alpha: 0.9 });
    c.font = SANS(32, 700); c.fillStyle = "#475569"; c.fillText(sub, 0, 190);
    c.restore();
  };
  sheet(W * 0.29, 1180, -0.05, "HOMEWORK", "10/10", GREEN, "every day ✓✓✓");
  sheet(W * 0.71, 1195, 0.05, "CLASS TEST", "2/20", RED, "on his own");
};
// ---------- the phone ----------
const aiAvatar = (c: Ctx, x: number, y: number, s: number, f: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-40, -40, 40, 40); g.addColorStop(0, "#8b5cf6"); g.addColorStop(1, "#ec4899");
  c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fillStyle = g; c.fill();
  c.rotate(f / 40); c.fillStyle = "#fff"; c.beginPath();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, q = k % 2 ? 7 : 24; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.fill(); c.restore();
};
type Ln = [string, boolean][];
const msg = (c: Ctx, W: number, y: number, lines: Ln, me: boolean, k: number, r: () => number, size = 42, col?: string) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const w = Math.max(...lines.map(([t]) => c.measureText(t).width)) + 60, h = lines.length * (size + 16) + 34;
  const x = me ? W - 116 - w : 116;
  c.fillStyle = col ?? (me ? "#dcf8c6" : "#fff"); rrect(c, x, y, w, h, 26); c.fill();
  stroke(c, rrectPts(x, y, w, h), "#cbd5e1", 2, r, { passes: 1 });
  lines.forEach(([t, hi], i) => {
    const ly = y + 30 + size + i * (size + 16) - 8;
    if (hi) { c.fillStyle = "#fde047"; c.fillRect(x + 22, ly - size + 2, c.measureText(t).width + 16, size + 12); }
    c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, x + 30, ly);
  });
  c.restore();
  return y + h + 24;
};
const phoneScreen = (c: Ctx, W: number, H: number, f: number, r: () => number, sub: string) => {
  const g = c.createRadialGradient(W / 2, 800, 100, W / 2, 800, 1200); g.addColorStop(0, "#1e3a8a"); g.addColorStop(1, "#0b1024");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "#0b0b12"; rrect(c, 52, 222, W - 104, 1260, 70); c.fill();
  c.fillStyle = "#f1f5f9"; rrect(c, 76, 246, W - 152, 1212, 50); c.fill();
  aiAvatar(c, 160, 320, 0.9, f);
  c.font = caveat(56); c.fillStyle = INK; c.textAlign = "left"; c.fillText("AI chat", 218, 326);
  c.font = handF(30); c.fillStyle = "#64748b"; c.fillText(sub, 220, 362);
  stroke(c, [[96, 392], [W - 96, 392]], "#cbd5e1", 3, r, { passes: 1 });
};
const SOLVE: Ln = [["Solve: 3x + 5 = 20", false]];
const ANSWER: Ln = [["Subtract 5: 3x = 15", false], ["Divide by 3: x = 5", false], ["So, the answer is x = 5. ✅", false]];
const LINE: Ln = [["Don't give me the answer.", true], ["Teach me one question", true], ["at a time. 3x + 5 = 20", false]];
// the new sum he pushes on: our test's problem 6, its real replies (results.json), shortened only where marked "..."
const LINE2: Ln = [["Don't give me the answer...", true], ["What is 15% of 240?", false]];
const ASK2: Ln = [["Can you try multiplying", false], ["0.15 by 240 on your own?", false]];
const GAVE: Ln = [["I understand you want the", false], ["answer directly.", false], ["15% of 240 is 36. ✅", false]];
// the chat on Kittu's phone, by mode; k = reveal of each bubble
type ChatMode = "copied" | "teach" | "push";
const chat = (c: Ctx, W: number, H: number, f: number, r: () => number, mode: ChatMode, k: number[], D: Demo) => {
  phoneScreen(c, W, H, f, r, mode === "push" ? "Kittu's phone · a new sum" : "Kittu's phone");
  if (mode === "copied") {
    let y = msg(c, W, 430, SOLVE, true, 1, r, 46);
    y = msg(c, W, y, ANSWER, false, k[0] ?? 1, r, 44);
    if ((k[1] ?? 0) > 0) stamp(c, "COPIED", W / 2, Math.min(1300, y + 90), 130, RED, k[1], r, -0.08);
  }
  if (mode === "teach") {
    let y = msg(c, W, 430, LINE, true, 1, r, 42);
    y = msg(c, W, y, [[D.q1a, false], [D.q1b, false]], false, k[0] ?? 0, r, 42, "#ede9fe");
    y = msg(c, W, y, [["Take away the 5... 3x = 15?", false]], true, k[1] ?? 0, r, 44);
    y = msg(c, W, y, [[D.q2a, false], [D.q2b, false]], false, k[2] ?? 0, r, 42, "#ede9fe");
    y = msg(c, W, y, [["Divide by 3... x = 5!", false]], true, k[3] ?? 0, r, 46);
    if ((k[4] ?? 0) > 0) tag(c, "he solved it himself ✓", W / 2, Math.min(1400, y + 40), 60, "#dcfce7", "#14532d", -0.02, k[4]);
  }
  if (mode === "push") {
    let y = msg(c, W, 430, LINE2, true, 1, r, 42);
    y = msg(c, W, y, ASK2, false, 1, r, 42, "#ede9fe");
    y = msg(c, W, y, [["Just tell me the answer.", true]], true, k[0] ?? 0, r, 48);
    y = msg(c, W, y, GAVE, false, k[1] ?? 0, r, 46);
    if ((k[2] ?? 0) > 0) tag(c, `Pushed once: gave in ${D.caved}/${D.n}`, W / 2, Math.min(1390, y + 60), 60, "#0f172a", "#facc15", -0.02, k[2]);
  }
};
const typeThis = (c: Ctx, W: number, r: () => number, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#0f172a"; rrect(c, 70, 330, W - 140, 860, 34); c.fill();
  stroke(c, rrectPts(70, 330, W - 140, 860), "#facc15", 6, r, { passes: 1 });
  c.font = SANS(58, 800); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("TYPE THIS 📋", W / 2, 430);
  c.font = SANS(38, 600); c.fillStyle = "#cbd5e1"; c.fillText("before any homework question:", W / 2, 510);
  c.font = SANS(72, 800); c.fillStyle = "#fff";
  c.fillText("“Don't give me", W / 2, 640); c.fillText("the answer.", W / 2, 730); c.fillText("Teach me one question", W / 2, 840); c.fillText("at a time.”", W / 2, 930);
  c.font = SANS(36, 700); c.fillStyle = "#e2e8f0"; c.fillText("copy it from the caption ↓", W / 2, 1110);
  c.restore();
};
type Demo = { n: number; plain_answer: number; teach_answer: number; teach_asked: number; caved: number; q1a: string; q1b: string; q2a: string; q2b: string };
const testCard = (c: Ctx, W: number, r: () => number, k: number, rows: number[], D: Demo) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(15,23,42,0.55)"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "rgba(255,253,245,0.98)"; rrect(c, 56, 250, W - 112, 1000, 30); c.fill();
  c.font = SANS(58, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("OUR REAL TEST", W / 2, 334);
  c.font = SANS(40, 800); c.fillStyle = NAVY; c.fillText(`a small free AI (Qwen 7B), offline · ${D.n} sums`, W / 2, 398);
  const row = (y: number, head: string, big: string, col: string, ink: string, tail: string, q: number) => {
    if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 3);
    c.fillStyle = col; rrect(c, 90, y, W - 180, 290, 26); c.fill();
    c.font = SANS(46, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText(head, 130, y + 70);
    c.font = SANS(150, 900); c.fillStyle = ink; c.fillText(big, 130, y + 232);
    c.font = SANS(52, 900); c.fillStyle = INK; c.textAlign = "right";   // "gave the / answer", right of the big number
    tail.split("|").forEach((t, k) => c.fillText(t, W - 130, y + 160 + k * 58));
    c.restore();
  };
  row(430, "“Solve: ...”", `${D.plain_answer}/${D.n}`, "#fee2e2", RED, "gave the|answer", rows[0] ?? 0);
  row(740, "+ the TYPE THIS line", `${D.teach_answer}/${D.n}`, "#ede9fe", PURPLE, "gave the|answer", rows[1] ?? 0);
  if ((rows[2] ?? 0) > 0) {
    c.globalAlpha = clamp(rows[2] * 3); c.font = SANS(44, 900); c.fillStyle = GREEN; c.textAlign = "center";
    c.fillText(`it asked a question back: ${D.teach_asked}/${D.n}`, W / 2, 1110);
  }
  c.restore();
  void r;
};
// the study (lines 6-7, the reason not to ban it): one chip, a row per line; a row's label shows with its line (no empty
// box while she talks) and its number on the cue
const studyChip = (c: Ctx, W: number, k: number, labels: number[], rows: number[], r: () => number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.fillStyle = "#0f172a"; rrect(c, 60, 340, W - 120, 780, 30); c.fill();
  stroke(c, rrectPts(60, 340, W - 120, 780), "#facc15", 6, r, { passes: 1 });
  c.font = SANS(46, 800); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("A STUDY OF ~1,000 STUDENTS", W / 2, 430);
  c.font = SANS(34, 700); c.fillStyle = "#cbd5e1"; c.fillText("high-school maths · PNAS, 2025", W / 2, 484);
  const r2 = (y: number, t1: string, big: string, col: string, sub: string, ql: number, q: number) => {
    if (ql > 0) { c.save(); c.globalAlpha = clamp(ql * 3); c.font = SANS(44, 800); c.fillStyle = "#e2e8f0"; c.fillText(t1, W / 2, y); c.restore(); }
    if (q <= 0) return;
    c.save(); c.globalAlpha = clamp(q * 3);
    c.font = SANS(110, 900); c.fillStyle = col; c.fillText(big, W / 2, y + 120);
    if (sub) { c.font = SANS(38, 700); c.fillStyle = "#cbd5e1"; c.fillText(sub, W / 2, y + 180); }
    c.restore();
  };
  r2(590, "kids who got AI answers:", "exam −17%", "#f87171", "vs kids with no AI", labels[0] ?? 0, rows[0] ?? 0);
  r2(880, "kids who got AI hints:", "no drop", "#86efac", "", labels[1] ?? 0, rows[1] ?? 0);
  c.restore();
};
const POSE: Record<number, Partial<Record<Who, [Mood, Arms]>>> = {
  1: { teacher: ["stern", "point"], dad: ["shock", "rest"], kittu: ["sheepish", "phoneBig"] },
  2: { teacher: ["stern", "fold"], dad: ["yell", "point"], kittu: ["sheepish", "phone"] },
  4: { teacher: ["smug", "fold"], dad: ["confused", "rest"], kittu: ["sheepish", "rest"] },
  5: { teacher: ["calm", "fold"], dad: ["yell", "up"], kittu: ["shock", "rest"] },
  6: { teacher: ["calm", "palm"], dad: ["confused", "rest"], kittu: ["confused", "rest"] },
  8: { teacher: ["calm", "point"], dad: ["sus", "rest"], kittu: ["confused", "phone"] },
  13: { teacher: ["smile", "point"], dad: ["happy", "rest"], kittu: ["happy", "rest"] },
  16: { teacher: ["calm", "palm"], dad: ["sus", "fold"], kittu: ["smug", "phone"] },
  17: { teacher: ["sus", "fold"], dad: ["stern", "point"], kittu: ["shock", "phone"] },
  12: { teacher: ["smile", "fold"], dad: ["happy", "rest"], kittu: ["happy", "up"] },
  18: { teacher: ["stern", "fold"], dad: ["stern", "fold"], kittu: ["sheepish", "rest"] },
};
const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 900 }, teacher: { z: 1.45, x: 330, y: 760 }, dad: { z: 1.5, x: 700, y: 820 }, kittu: { z: 1.7, x: 900, y: 880 },
};

// ---------- the scene ----------
const StPtm: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const D: Demo = { n: 10, plain_answer: 10, teach_answer: 0, teach_asked: 10, caved: 7, q1a: "What should we do first", q1b: "to get 3x alone? 🤔",
    q2a: "Great! You're on the right track.", q2b: "What should we do next?", ...((s.data as { demo?: object }).demo ?? {}) };
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cueOf = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, nx = ls[i + 1] ? ls[i + 1].from : s.frames;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (b.shot === "phone" && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={at + 1} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("s")} at={at + 1} src="audio/sfx_snap.wav" vol={0.6} />);
    if (b.prop === "copied") sfx.push(<Sfx key={k("c")} at={cueOf(i, 1, 0.7) + 2} src="audio/gag_bonk.wav" vol={0.4} />);
    if (b.prop === "passed") sfx.push(<Sfx key={k("h")} at={cueOf(i, 1, 0.55)} src="reel/sfx_boom.wav" vol={0.75} />, <Sfx key={k("s")} at={cueOf(i, 1, 0.55)} src="audio/sfx_snap.wav" vol={0.5} />);
    if (b.prop === "ban") sfx.push(<Sfx key={k("b")} at={at + 4} src="audio/gag_bonk.wav" vol={0.3} />);
    if (b.prop === "study1" || b.prop === "study2") sfx.push(<Sfx key={k("d")} at={cueOf(i, 1, 0.6)} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "type") sfx.push(<Sfx key={k("d")} at={cueOf(i, 1, 0.4)} src="audio/gag_ding.wav" vol={0.3} />);
    if (b.prop === "ask" || b.prop === "ask2") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "solved") sfx.push(<Sfx key={k("s")} at={cueOf(i, 1, 0.6)} src="audio/sfx_success.wav" vol={0.45} />, <Sfx key={k("h")} at={cueOf(i, 1, 0.6)} src="reel/sfx_boom.wav" vol={0.6} />);
    if (b.prop === "test") sfx.push(<Sfx key={k("r")} at={at - 30} src="reel/sfx_riser.wav" vol={0.3} />, <Sfx key={k("h")} at={cueOf(i, 1, 0.75)} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "push") sfx.push(<Sfx key={k("p")} at={at + 2} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "caved") sfx.push(<Sfx key={k("g")} at={at + 2} src="reel/sfx_glitch.wav" vol={0.35} />, <Sfx key={k("o")} at={at + 12} src="audio/gag_bonk.wav" vol={0.4} />);
    if (b.prop === "explain") sfx.push(<Sfx key={k("r")} at={nx - 34} src="reel/sfx_riser.wav" vol={0.45} />);   // into the drop before his line
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(9900 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const faceCut = b.prop === "solved" && f >= cu(1, 0.6);   // "I got it!" on his face, not the phone
        if (b.shot === "phone" && !faceCut) {
          if (b.prop === "copied") chat(c, W, H, f, r, "copied", [seg(f, ln.from + 4, ln.from + 14), seg(f, cu(1, 0.7), cu(1, 0.7) + 8)], D);
          else if (b.prop === "push" || b.prop === "caved") {
            const k0 = b.prop === "push" ? seg(f, ln.from + 2, ln.from + 10) : 1, k1 = b.prop === "caved" ? seg(f, ln.from + 2, ln.from + 10) : 0;
            chat(c, W, H, f, r, "push", [k0, k1, b.prop === "caved" ? seg(f, ln.from + ln.frames - 6, ln.from + ln.frames + 2) : 0], D);
          } else {   // the teaching chat builds over lines 9-12
            const step = { ask: 0, answer1: 1, ask2: 2, solved: 3 }[b.prop] ?? 0;
            const ks = [0, 1, 2, 3].map((q) => (q < step ? 1 : q === step ? seg(f, ln.from + 2, ln.from + 10) : 0));
            ks.push(b.prop === "solved" ? seg(f, cu(1, 0.6), cu(1, 0.6) + 8) : 0);
            chat(c, W, H, f, r, "teach", ks, D);
          }
        } else {
          // ---------- the classroom ----------
          const sh = n === 1 ? SHOTS.wide : faceCut ? SHOTS.kittu : SHOTS[b.shot] ?? SHOTS.wide;
          const z = sh.z * (1 + 0.03 * p);
          const shake = n === 1 && p < 0.12 ? 9 : 0;
          const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
          c.save(); c.translate(W / 2 + sx, 960 + sy); c.scale(z, z); c.translate(-sh.x, -sh.y);
          room(c, W, f, r, n >= 14 ? "15% of 240 = ?" : "3x + 5 = 20");
          const pose = (who: Who): [Mood, Arms] => POSE[n]?.[who] ?? POSE[Math.max(...Object.keys(POSE).map(Number).filter((q) => q <= n))]?.[who] ?? ["calm", "rest"];
          (["teacher", "dad", "kittu"] as Who[]).forEach((who) => {
            const [m, a] = pose(who);
            person(c, who, AT[who], 1, m, a, b.who === who && talking, r);
          });
          desk(c, W, r);
          c.restore();
          if (n === 1) papers(c, W, 1, shake, r);
          if (b.prop === "type") typeThis(c, W, r, seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 4));
          if (b.prop === "test") testCard(c, W, r, seg(f, ln.from, ln.from + 8), [seg(f, ln.from + 4, ln.from + 12), seg(f, cu(1, 0.75) - 4, cu(1, 0.75) + 4), seg(f, cu(1, 0.75) + 14, cu(1, 0.75) + 22)], D);
          if (b.prop === "study1") studyChip(c, W, seg(f, ln.from, ln.from + 8), [seg(f, ln.from + 4, ln.from + 12), 0], [seg(f, cu(1, 0.6) - 4, cu(1, 0.6) + 4), 0], r);
          if (b.prop === "study2") studyChip(c, W, 1, [1, seg(f, ln.from, ln.from + 8)], [1, seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 4)], r);
          if (b.prop === "ban") tag(c, "NO MORE PHONE!", W / 2, 380, 76, "#fee2e2", "#991b1b", -0.04, seg(p, 0.05, 0.2));
          if (b.prop === "passed") tag(c, "AI: 10/10 · Kittu: 2/20", W / 2, 380, 66, "#0f172a", "#facc15", -0.02, seg(f, cu(1, 0.55) - 3, cu(1, 0.55) + 5));
          if (b.prop === "check") {
            const c1 = cu(1, 0.6);
            if (f < c1) tag(c, `our test: it gave in ${D.caved}/${D.n}`, W / 2, 380, 64, "#0f172a", "#facc15", -0.02, 1);
            else tag(c, "ask step one, not the answer", W / 2, 380, 60, "#fef3c7", INK, -0.03, seg(f, c1, c1 + 6));
          }
          if (b.prop === "explain") tag(c, "explain step one: 15% of 240", W / 2, 380, 60, "#fef3c7", INK, -0.03, seg(p, 0.1, 0.25));
          if (faceCut) tag(c, "he solved it himself ✓", W / 2, 380, 64, "#dcfce7", "#14532d", -0.02, seg(f, cu(1, 0.6), cu(1, 0.6) + 6));
        }
        void stamp; void caveat; void PURPLE; void easeOut;
      }} />
    </>
  );
};

export const PTM_SCENES = { sk_ptm: StPtm };
