import React from "react";
import { Ctx, rng, stroke, circlePts, clamp, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 28 "₹3,000 a Month, Says the AI" (series/scripts/creative28_fake_scheme.md): myth vs fact, one narrator.
// Grandma asks a chatbot about the "Digital Dadi Pension Yojana" (a name we made up): it says up to ₹3,000 a month.
// Our test (series/scripts/creative28_demo/schemes.json): a small free AI with no web search, 10 fake schemes and 2 real
// ones, every reply read by hand. Every reply and count on screen comes from the spec (data.t), copied from that test.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#f59e0b";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Color Emoji", sans-serif`;

const block = (c: Ctx, x: number, y: number, top: string, big: string, col: string, k = 1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#111827"; rrect(c, x, y, 470, 170, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, top, 430, 32, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(top, x + 235, y + 50);
  c.font = SANS(fit(c, big, 430, 76, 900), 900); c.fillStyle = col; c.fillText(big, x + 235, y + 136);
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, k: number, col = RED, rot = -0.1, size = 64) => {
  if (k <= 0) return;
  const s = 1 + 0.6 * (1 - clamp(k * 2));   // slams in
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = clamp(k * 3);
  c.font = SANS(fit(c, t, 900, size, 900), 900); const w = c.measureText(t).width + 56;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2, -size, w, size * 1.5, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 8; rrect(c, -w / 2, -size, w, size * 1.5, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, size * 0.32); c.restore();
};
const room = (c: Ctx, W: number, r: () => number) => {
  c.fillStyle = "#fde7c7"; c.fillRect(0, 480, W, 1040);   // the wall
  c.fillStyle = "#93c5fd"; rrect(c, 640, 540, 330, 260, 10); c.fill();   // the window
  stroke(c, [[805, 540], [805, 800]], "#78350f", 8, r, { passes: 1 }); stroke(c, [[640, 670], [970, 670]], "#78350f", 8, r, { passes: 1 });
  c.fillStyle = "#a16207"; c.fillRect(0, 1380, W, 140);   // the floor
  c.fillStyle = "#7c2d12"; rrect(c, 40, 1030, 620, 330, 40); c.fill();   // the sofa
  c.fillStyle = "#9a3412"; rrect(c, 70, 1150, 560, 140, 30); c.fill();
};
// Grandma: white hair in a bun, round glasses, a bindi, a maroon cotton saree with a gold border
const grandma = (c: Ctx, x: number, y: number, mood: "ask" | "worried" | "happy", f: number, r: () => number) => {
  const sk = "#c68642";
  c.fillStyle = "#7f1d1d"; c.beginPath(); c.moveTo(x - 140, y + 360); c.quadraticCurveTo(x - 150, y + 110, x, y + 90); c.quadraticCurveTo(x + 150, y + 110, x + 140, y + 360); c.closePath(); c.fill();   // saree
  stroke(c, [[x - 70, y + 100], [x + 90, y + 330]], "#d4a017", 14, r, { passes: 1 });   // the pallu's border
  c.fillStyle = sk; c.fillRect(x - 22, y + 60, 44, 40);   // neck
  c.fillStyle = sk; c.beginPath(); c.ellipse(x, y, 78, 92, 0, 0, 7); c.fill();   // face
  c.fillStyle = "#f1f5f9"; c.beginPath(); c.ellipse(x, y - 52, 84, 52, 0, Math.PI, 0); c.fill();   // white hair
  c.beginPath(); c.arc(x + 70, y - 70, 34, 0, 7); c.fill();   // the bun
  c.fillStyle = RED; c.beginPath(); c.arc(x, y - 30, 7, 0, 7); c.fill();   // bindi
  [[-30, -2], [30, -2]].forEach(([dx, dy]) => { c.strokeStyle = "#1f2937"; c.lineWidth = 5; c.beginPath(); c.arc(x + dx, y + dy, 22, 0, 7); c.stroke(); c.fillStyle = "#111827"; c.beginPath(); c.arc(x + dx + (mood === "worried" ? 0 : 3), y + dy + 2, 6, 0, 7); c.fill(); });
  stroke(c, [[x - 8, y - 2], [x + 8, y - 2]], "#1f2937", 4, r, { passes: 1 });
  const m = mood === "happy" ? circlePts(x, y + 38, 26, 16, 0.2, Math.PI - 0.2, 10) : mood === "worried" ? circlePts(x, y + 58, 22, 12, Math.PI + 0.3, 2 * Math.PI - 0.3, 10) : [[x - 16, y + 44], [x + 16, y + 44]] as [number, number][];
  stroke(c, m as [number, number][], "#7f1d1d", 5, r, { passes: 1 });
  // the phone in her hands
  c.fillStyle = sk; c.beginPath(); c.arc(x - 30, y + 210, 22, 0, 7); c.arc(x + 30, y + 210, 22, 0, 7); c.fill();
  c.fillStyle = "#111827"; rrect(c, x - 40, y + 140, 80, 120, 10); c.fill(); c.fillStyle = "#38bdf8"; rrect(c, x - 32, y + 150, 64, 96, 6); c.fill();
  if (Math.floor(f / 20) % 2 === 0) { c.fillStyle = "#ffffff"; c.fillRect(x - 24, y + 166, 48, 6); c.fillRect(x - 24, y + 180, 36, 6); }
};
const bubble = (c: Ctx, x: number, y: number, w: number, text: string, me: boolean, k: number, size = 32, hi = "", hiK = 0) => {
  if (k <= 0) return y;
  c.save(); c.globalAlpha = clamp(k * 3); c.font = SANS(size, 600);
  const lines = wrap(c, text, w - 56);
  const h = lines.length * size * 1.3 + 34;
  c.fillStyle = me ? "#dcf8c6" : "#ffffff"; rrect(c, x, y, w, h, 18); c.fill();
  c.textAlign = "left";
  lines.forEach((l, i) => {
    const yy = y + 20 + (i + 1) * size * 1.3 - size * 0.3;
    if (hi && l.includes(hi) && hiK > 0) { const pre = c.measureText(l.slice(0, l.indexOf(hi))).width; c.save(); c.globalAlpha = 0.6 * clamp(hiK * 3); c.fillStyle = "#fde047"; c.fillRect(x + 26 + pre - 4, yy - size * 0.95, c.measureText(hi).width + 8, size * 1.2); c.restore(); }
    c.fillStyle = INK; c.fillText(l, x + 28, yy);
  });
  c.restore();
  return y + h + 16;
};
const card = (c: Ctx, W: number, k: number) => { c.save(); c.globalAlpha = clamp(k * 3) * 0.94; c.fillStyle = "#0b1220"; c.fillRect(0, 470, W, 1050); c.restore(); };
const tiles = (c: Ctx, W: number, f: number, t0: number, names: [string, string][], res: string[], y0: number) => {
  const col: Record<string, [string, string, string]> = { R: ["#fee2e2", RED, "AS REAL"], B: ["#fef3c7", "#b45309", "BACKED OFF"], N: ["#e2e8f0", "#334155", "NOT SURE"] };
  names.forEach(([nm, kind], q) => {
    const k = seg(f, t0 + q * 3, t0 + q * 3 + 6); if (k <= 0) return;
    const x = 118 + (q % 5) * 211, y = y0 + Math.floor(q / 5) * 250, [bgc, fg, lab] = col[res[q]];
    c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = bgc; rrect(c, x - 98, y, 196, 226, 18); c.fill();
    c.textAlign = "center"; c.fillStyle = kind === "viral_fake" ? "#7c2d12" : "#1e3a8a"; c.font = SANS(fit(c, kind === "viral_fake" ? "VIRAL FAKE" : "MADE UP BY US", 180, 24, 900), 900); c.fillText(kind === "viral_fake" ? "VIRAL FAKE" : "MADE UP BY US", x, y + 32);
    c.fillStyle = INK; c.font = SANS(25, 800); wrap(c, nm, 176).slice(0, 3).forEach((l, i) => c.fillText(l, x, y + 72 + i * 30));
    c.fillStyle = fg; c.font = SANS(fit(c, lab, 176, 30, 900), 900); c.fillText(lab, x, y + 200); c.restore();
  });
};

const StScheme: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={cue(i, 1, 0.7) - 8} src="audio/sfx_chaching.wav" vol={0.5} />);
    if (b.prop === "made") sfx.push(<Sfx key={k("z")} at={Math.max(0, at - 6)} src="reel/sfx_buzz.wav" vol={0.5} />, <Sfx key={k("s")} at={cue(i, 1, 0.1) - 4} src="audio/gag_bonk.wav" vol={0.5} />, <Sfx key={k("p")} at={cue(i, 1, 0.65) - 4} src="audio/sfx_pop.wav" vol={0.45} />);
    if (b.prop.startsWith("myth")) sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.45} />, <Sfx key={k("m")} at={at + 4} src={b.prop === "myth1" ? "audio/gag_bonk.wav" : b.prop === "myth2" ? "audio/gag_boing.wav" : "audio/sfx_snap.wav"} vol={0.55} />);
    if (b.prop === "myth2") sfx.push(<Sfx key={k("b")} at={cue(i, 1, 0.7) - 8} src="reel/sfx_boom.wav" vol={0.85} />);
    if (b.prop === "myth1" || b.prop === "myth2") sfx.push(<Sfx key={k("t")} at={cue(i, 1, 0.3)} src="audio/sfx_tick.wav" vol={0.4} />, <Sfx key={k("x")} at={end - 6} src="reel/sfx_buzz.wav" vol={0.4} />);
    if (b.prop === "myth3") sfx.push(<Sfx key={k("x")} at={cue(i, 1, 0.6)} src="reel/sfx_buzz.wav" vol={0.4} />, <Sfx key={k("b")} at={cue(i, 2, 0.1) - 8} src="reel/sfx_boom.wav" vol={0.9} />);
    if (b.prop === "fact") sfx.push(<Sfx key={k("r")} at={Math.max(0, at - 22)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("d")} at={at + 2} src="audio/gag_ding.wav" vol={0.5} />, <Sfx key={k("e")} at={cue(i, 1, 0.5)} src="audio/sfx_success.wav" vol={0.35} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 10)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={1.0} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(2801 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        c.fillStyle = "#1c1410"; c.fillRect(0, 0, W, H);
        // the two numbers, always on top (frame 1 reads with the sound off)
        block(c, 50, 245, "THE AI says", "up to ₹3,000/month", "#f87171");
        block(c, 560, 245, "THE SCHEME", "₹0 · doesn't exist", "#f8fafc");
        c.fillStyle = "#fde68a"; c.textAlign = "center"; c.font = SANS(fit(c, T.name, W - 120, 34, 800), 800); c.fillText(T.name, W / 2, 452);
        if (P === "hook" || P === "made" || P === "loop") {
          room(c, W, r);
          grandma(c, 300, 760, P === "loop" ? "happy" : P === "made" ? "worried" : "ask", f, r);
          // her chat with the AI (our test's real reply, cut with "...")
          c.fillStyle = "#075e54"; rrect(c, 470, 500, 580, 64, 16); c.fill(); c.font = SANS(fit(c, "a small free AI · no web search", 540, 28, 800), 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("a small free AI · no web search", 494, 542);
          let y = bubble(c, 560, 580, 490, T.ask, true, 1, 28);
          const hk = P === "hook" ? seg(f, cu(1, 0.7) - 6, cu(1, 0.7) + 2) : 1;
          y = bubble(c, 470, y, 560, T.reply, false, 1, 28, "₹500 to ₹3,000 per month", hk);
          if (P === "made") {
            card(c, W, seg(f, ln.from + 4, ln.from + 10) * 0.85);
            c.save(); c.globalAlpha = clamp(seg(f, ln.from + 4, ln.from + 10) * 3);
            c.fillStyle = "#dcf8c6"; rrect(c, 90, 560, W - 180, 300, 22); c.fill();
            c.fillStyle = INK; c.textAlign = "left"; c.font = SANS(30, 800); c.fillText("Forwarded · family group", 120, 610);
            c.font = SANS(40, 800); wrap(c, T.forward, W - 260).forEach((l, q) => c.fillText(l, 120, 670 + q * 50));
            c.restore();
            stamp(c, "NAME MADE UP BY US", W / 2, 890, seg(f, cu(1, 0.05), cu(1, 0.05) + 6));
            chip(c, T.onlyName, W / 2, 1390, "#fde68a", INK, seg(f, cu(1, 0.35), cu(1, 0.35) + 8), fit(c, T.onlyName, 1000, 34, 800));
            const kd = seg(f, cu(1, 0.6), cu(1, 0.6) + 8);
            if (kd > 0) {
              c.save(); c.globalAlpha = clamp(kd * 3); c.fillStyle = "#ffffff"; rrect(c, 90, 980, W - 180, 330, 22); c.fill();
              c.fillStyle = "#475569"; c.font = SANS(28, 800); c.textAlign = "left"; c.fillText("THE AI, on what to bring:", 120, 1030);
              c.fillStyle = INK; c.font = SANS(32, 700); wrap(c, T.docs, W - 260).forEach((l, q) => c.fillText(l, 120, 1085 + q * 44));
              c.restore();
            }
          }
          if (P === "loop") {
            const kc = seg(f, cu(1, 0.1), cu(1, 0.1) + 8);
            chip(c, "✓ she checks first now", W / 2, 1300, "#dcfce7", "#14532d", kc, 44);
          }
          if (P === "hook") chip(c, "Grandma, a forward, and an AI chat", W / 2, 1420, "#fde68a", INK, 1, 30);
        } else if (P === "myth1" || P === "myth2") {
          card(c, W, 1);
          const m1 = P === "myth1";
          stamp(c, m1 ? "MYTH 1" : "MYTH 2", 190, 560, seg(f, ln.from + 2, ln.from + 8), AMBER, -0.08, 50);
          c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.font = SANS(40, 800); wrap(c, m1 ? T.myth1 : T.myth2, 660).forEach((l, q) => c.fillText(l, 380, 548 + q * 48));
          if (!m1) chip(c, T.ruleChip, W / 2, 700, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.05), cu(1, 0.05) + 8), 26);
          tiles(c, W, f, cu(1, 0.15), T.names, m1 ? T.plain : T.rule, 760);
          const kc = seg(f, cu(1, 0.7), cu(1, 0.7) + 8);
          chip(c, m1 ? T.count1 : T.count2, W / 2, 1300, "#fee2e2", "#7f1d1d", kc, fit(c, m1 ? T.count1 : T.count2, 1000, 42, 800));
          if (m1) chip(c, T.laptop, W / 2, 1400, "#1e293b", "#fde68a", seg(f, cu(1, 0.85), cu(1, 0.85) + 8), fit(c, T.laptop, 1000, 36, 800));
          else chip(c, T.vayas, W / 2, 1400, "#1e293b", "#fde68a", seg(f, cu(1, 0.85), cu(1, 0.85) + 8), fit(c, T.vayas, 1000, 38, 800));
          stamp(c, "✗ MYTH", 860, 640, seg(f, endL - 10, endL - 4), RED, -0.12, 60);
        } else if (P === "myth3") {
          card(c, W, 1);
          stamp(c, "MYTH 3", 190, 560, seg(f, ln.from + 2, ln.from + 8), AMBER, -0.08, 50);
          c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.font = SANS(40, 800); wrap(c, T.myth3, 660).forEach((l, q) => c.fillText(l, 380, 548 + q * 48));
          c.textAlign = "center"; c.font = SANS(54, 900); c.fillStyle = "#fde68a"; c.fillText("PM-KISAN", W / 2 - 120, 720);
          chip(c, "✓ REAL SCHEME", W / 2 + 200, 708, "#dcfce7", "#14532d", 1, 34);
          const ka = seg(f, cu(1, 0.3), cu(1, 0.3) + 8), kb = seg(f, cu(2, 0.1), cu(2, 0.1) + 8);
          if (ka > 0) { c.save(); c.globalAlpha = clamp(ka * 3); c.fillStyle = "#1e293b"; rrect(c, 60, 780, W - 120, 200, 22); c.fill(); c.font = SANS(36, 800); c.fillStyle = "#cbd5e1"; c.fillText("THE AI", W / 2, 840); c.font = SANS(fit(c, "₹2,000 a month = ₹24,000 a year ✗", W - 180, 64, 900), 900); c.fillStyle = "#f87171"; c.fillText("₹2,000 a month = ₹24,000 a year ✗", W / 2, 935); c.restore(); }
          if (kb > 0) { c.save(); c.globalAlpha = clamp(kb * 3); c.fillStyle = "#1e293b"; rrect(c, 60, 1010, W - 120, 240, 22); c.fill(); c.font = SANS(36, 800); c.fillStyle = "#cbd5e1"; c.fillText("THE REAL FIGURE", W / 2, 1070); c.font = SANS(84, 900); c.fillStyle = "#4ade80"; c.fillText("₹6,000 a year ✓", W / 2, 1172); c.font = SANS(26, 700); c.fillStyle = "#94a3b8"; c.fillText("(Digital India, PIB)", W / 2, 1222); c.restore(); }
          chip(c, T.apy, W / 2, 1340, "#1e293b", "#e2e8f0", seg(f, cu(2, 0.5), cu(2, 0.5) + 8), fit(c, T.apy, 1000, 36, 800));
        } else if (P === "fact") {
          card(c, W, 1);
          stamp(c, "FACT", 160, 560, seg(f, ln.from + 2, ln.from + 8), GREEN, -0.08, 54);
          c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.font = SANS(40, 800); wrap(c, T.fact, 700).forEach((l, q) => c.fillText(l, 330, 548 + q * 48));
          const k1 = seg(f, cu(1, 0.1), cu(1, 0.1) + 8), k2 = seg(f, cu(1, 0.6), cu(1, 0.6) + 8);
          if (k1 > 0) {
            c.save(); c.globalAlpha = clamp(k1 * 3);
            c.fillStyle = "#f8fafc"; rrect(c, 60, 720, W - 120, 300, 22); c.fill();
            c.fillStyle = "#e2e8f0"; rrect(c, 60, 720, W - 120, 70, 22); c.fill(); c.fillStyle = "#334155"; c.textAlign = "left"; c.font = SANS(32, 800); c.fillText("🔒 myscheme.gov.in", 100, 768);
            c.fillStyle = INK; c.font = SANS(30, 900); c.fillText("1 · search it on the government's scheme finder", 100, 840);
            c.strokeStyle = "#334155"; c.lineWidth = 4; rrect(c, 100, 870, W - 200, 90, 16); c.stroke();
            const typed = T.name.slice(0, Math.floor(clamp((f - cu(1, 0.1)) / 30) * T.name.length));
            c.font = SANS(fit(c, T.name, W - 260, 34, 700), 700); c.fillText(typed + (Math.floor(f / 8) % 2 ? "|" : ""), 125, 928);
            c.restore();
          }
          if (k2 > 0) {
            c.save(); c.globalAlpha = clamp(k2 * 3);
            c.fillStyle = "#14532d"; rrect(c, 60, 1060, W - 120, 220, 22); c.fill(); c.fillStyle = "#f0fdf4"; c.textAlign = "center";
            c.font = SANS(44, 900); c.fillText("2 · not there? send it to PIB Fact Check", W / 2, 1130); c.font = SANS(40, 800); c.fillText("WhatsApp +91 87997 11259", W / 2, 1195);
            c.font = SANS(26, 700); c.fillText("(the government's fact-check unit)", W / 2, 1245); c.restore();
          }
          chip(c, T.pension, W / 2, 1355, "#1e293b", "#e2e8f0", seg(f, cu(1, 0.3), cu(1, 0.3) + 8), fit(c, T.pension, 1000, 36, 800));
        }
      }} />
    </>
  );
};

export const SCHEME_SCENES = { sk_scheme: StScheme };
