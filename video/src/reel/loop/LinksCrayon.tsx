import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Ctx, rng, stroke, circlePts, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 14 "Three references, three dead links" (series/scripts/creative14_dead_links.md): a B.Com class, Charan's
// project on the projector; Vasudha ma'am opens his references one by one: page not found, no such website. "The AI gave
// me those!" It writes links like sentences: they only look right ("reservebankofindia.org"; RBI is rbi.org.in). Harsha's
// test (our test, series/scripts/creative14_demo): a small free AI, 150 links, every one opened: of the 78 that opened, 64
// dead, 12 the wrong page, 2 right; "only links you're sure exist" never said "not sure" and gave more dead links (20 to
// 24). The rule: ask for the report's name and who published it, search it yourself, open every link. Scientific
// Reports, 2023: GPT-3.5 55%, GPT-4 18% made-up references. The loop: "Next project: Harsha!", his slide "References
// (from AI)", frame 1. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 600) => `${w} ${s}px "Courier New", monospace`;
const GREEN = "#16a34a", RED = "#dc2626", BLUE = "#1d4ed8";
const HOLD = 12;   // frames after the last line before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const MOODS: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { vasudha: ["deadpan", "fold"], charan: ["shock", "rest"] }, 2: { charan: ["worried", "phone"], vasudha: ["deadpan", "fold"] },
  9: { vasudha: ["calm", "up"], charan: ["worried", "rest"] }, 11: { vasudha: ["smug", "fold"], harsha: ["shock", "rest"] },
};
const LINKS = ["www.gov.in/gst", "reservebankofindia.org/research/...pdf", "ccaid.in/gst/", "mca.gov.in/.../GstHome.htm", "respective.org/gst-in-india/"];

// ---------- the room ----------
const room = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#d9e7d0"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#14532d"; c.fillRect(0, 1180, W, 30);   // a skirting band
  c.fillStyle = "#a16207"; c.fillRect(0, 1210, W, H - 1210);   // the floor
};
// the projector screen (x 70-1010, y 250-860) and what is on it
const screen = (c: Ctx, draw: () => void) => {
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, 80, 262, 940, 610, 10); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 70, 250, 940, 610, 10); c.fill();
  c.save(); rrect(c, 70, 250, 940, 610, 10); c.clip(); draw(); c.restore();
  c.fillStyle = "#334155"; c.fillRect(520, 860, 40, 26);
};
// a browser page: the URL bar, then a body
const browser = (c: Ctx, url: string, body: (x: number, y: number) => void) => {
  c.fillStyle = "#e2e8f0"; c.fillRect(70, 250, 940, 70);
  c.fillStyle = "#fff"; rrect(c, 100, 266, 880, 40, 20); c.fill();
  c.font = SANS(26, 600); c.fillStyle = "#334155"; c.textAlign = "left"; c.fillText("🔒 " + url, 124, 295);
  body(110, 360);
};
const page404 = (c: Ctx, url: string, k: number, noSite = false) => {
  browser(c, url, (x, y) => {
    c.save(); c.globalAlpha = clamp(k * 3);
    c.font = SANS(150, 900); c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText(noSite ? "?" : "404", x, y + 170);
    c.font = SANS(48, 900); c.fillStyle = INK; c.fillText(noSite ? "This site can't be reached" : "This page doesn't exist", x, y + 260);
    c.font = SANS(32, 600); c.fillStyle = "#64748b"; c.fillText(noSite ? "no such website" : "page not found", x, y + 316);
    c.restore();
  });
};
// the references slide beside the browser: ✗ per dead link
const refTally = (c: Ctx, n: number, r: () => number) => {
  c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, 690, 380, 290, n > 3 ? 370 : 300, 18); c.fill();
  c.font = SANS(30, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("REFERENCES", 835, 428);
  for (let q = 0; q < Math.max(3, n); q++) {
    const y = 486 + q * 70;
    c.font = SANS(28, 700); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(`[${q + 1}]`, 720, y + 10);
    if (q < n) { stroke(c, [[800, y - 18], [840, y + 18]], RED, 9, r, { passes: 2 }); stroke(c, [[840, y - 18], [800, y + 18]], RED, 9, r, { passes: 2 }); }
  }
};
// the class, heads from behind (screen space)
const heads = (c: Ctx, W: number, f: number) => {
  const cols = ["#1c1410", "#0f0a08", "#2b1a10", "#120d0a"];
  for (let q = 0; q < 7; q++) {
    const x = 70 + q * 160 + (q % 2) * 20, y = 1640 + (q % 2) * 30, bob = Math.sin((f + q * 17) / 9) * 3;   // stills: big heads hid the two at the front
    c.fillStyle = "#475569"; c.beginPath(); c.ellipse(x, y + 110, 90, 70, 0, 0, 7); c.fill();
    c.fillStyle = cols[q % 4]; c.beginPath(); c.ellipse(x, y + bob, 52, 60, 0, 0, 7); c.fill();
  }
};
const tag = (c: Ctx, t: string, x: number, y: number, s: number, bg: string, fg: string, k: number, rot = 0) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1 + 0.3 * (1 - easeOut(k)); c.scale(z, z);
  c.font = SANS(s); const w = c.measureText(t).width;
  c.fillStyle = bg; rrect(c, -w / 2 - 26, -s * 0.95, w + 52, s * 1.4, 18); c.fill();
  c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, 0, s * 0.05); c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.9)"; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.fill();
  c.strokeStyle = col; c.lineWidth = 12; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// a phone (screen space) with the AI chat
const chatPhone = (c: Ctx, x: number, y: number, s: number, ask: string, lines: string[], k: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 12, 14, 640, 900, 50); c.fill();
  c.fillStyle = "#111827"; rrect(c, 0, 0, 640, 900, 50); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 20, 20, 600, 860, 34); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, 20, 20, 600, 90, 34); c.fill(); c.fillRect(20, 70, 600, 40);
  c.font = SANS(36); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", 56, 82);
  c.font = SANS(28, 600); const ls: string[] = []; let cur = "";
  ask.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > 470 && cur) { ls.push(cur); cur = w; } else cur = t; });
  if (cur) ls.push(cur);
  c.fillStyle = BLUE; rrect(c, 90, 140, 500, ls.length * 38 + 30, 22); c.fill();
  c.fillStyle = "#fff"; ls.forEach((t, q) => c.fillText(t, 110, 182 + q * 38));
  const y0 = 140 + ls.length * 38 + 60;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#e5e7eb"; rrect(c, 40, y0, 540, 60 + lines.length * 52, 22); c.fill();
  lines.forEach((t, q) => { c.font = q === 0 ? SANS(28, 700) : SANS(26, 600); c.fillStyle = q === 0 ? INK : BLUE; c.fillText(t, 64, y0 + 48 + q * 52); });
  c.restore();
  c.restore();
};

// ---------- the scene ----------
const StLinks: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const first = (prop: string) => beats.findIndex((b) => b.prop === prop);
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const prevShot = i > 0 ? beats[i - 1].shot : "";
    if (i > 0 && prevShot !== b.shot) sfx.push(<Sfx key={k("w")} at={at - 12} src="audio/sfx_whoosh.wav" vol={0.2} />);
    if (b.prop === "hook") {   // the hit before her first word; a buzz per dead link
      sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("c")} at={0} src={CLAP} vol={te ? 0.3 : 0.4} />, <Sfx key={k("z")} at={2} src="reel/sfx_buzz.wav" vol={0.25} />);   // render review: no first-second hit above the kick
    }
    if (b.prop === "phone") sfx.push(<Sfx key={k("p")} at={at - 6} src="audio/sfx_pop.wav" vol={0.2} />);
    if (b.prop === "typing") [0, 1, 2, 3].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 6 + q * 9} src="audio/sfx_tick.wav" vol={0.18} />));
    if (b.prop === "domain") sfx.push(<Sfx key={k("z")} at={end + 1} src="reel/sfx_buzz.wav" vol={0.22} />, <Sfx key={k("d")} at={end + 6} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "test2") {   // the bed out before "and two right": a thud, then the sting after
      const c1 = cue(i, 1, 0.7);
      if (!te) sfx.push(<Sfx key={k("n")} at={c1 - 4} src="reel/sfx_boom.wav" vol={0.5} />);
      sfx.push(<Sfx key={k("s")} at={end + 1} src="reel/sfx_buzz.wav" vol={0.25} />, <Sfx key={k("c")} at={end + 3} src={CLAP} vol={0.3} />);
    }
    if (b.prop === "sure2") sfx.push(<Sfx key={k("g")} at={end + 1} src="reel/sfx_glitch.wav" vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 30)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 32)} src="reel/sfx_boom.wav" vol={0.4} />);
    if (b.prop === "study") sfx.push(<Sfx key={k("d")} at={at - 4} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "loop") {   // a rise into the last line, then the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 37)} src="reel/sfx_riser.wav" vol={0.4} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />,
        <Sfx key={k("z")} at={slam + 2} src="reel/sfx_buzz.wav" vol={0.3} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("study") === 0 && percEnd > 30 && (   // the last scene opens on the study   // the last scene builds: hats and claps up to the last line
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.08 + 0.16 * clamp(fr / percEnd) : 0.12 + 0.3 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(4400 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const mood = (who: BillWho, dm: BillMood, da: BillArms): [BillMood, BillArms] => MOODS[n]?.[who] ?? [dm, da];
        if (b.shot === "class") {
          // ---------- the class: the projector, ma'am, Charan, the heads ----------
          room(c, W, H);
          const hookOn = b.prop === "hook" || loopOn;
          screen(c, () => {
            if (hookOn) { page404(c, loopOn ? "mca.gov.in/.../GstHome.htm" : "reservebankofindia.org/research/journal/2019/...pdf", 1); refTally(c, loopOn ? 4 : 3, r); }   // the loop: his reference 4, dead too
            else if (b.prop === "rule") {
              c.fillStyle = "#f8fafc"; c.fillRect(70, 250, 940, 610);
              c.font = SANS(48, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("BEFORE YOU CITE AN AI LINK", W / 2, 340);
            } else if (b.prop === "loop") {   // his reference 4, about to be clicked
              c.fillStyle = "#f8fafc"; c.fillRect(70, 250, 940, 610);
              c.font = SANS(48, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText("References", 120, 340);
              LINKS.slice(0, 4).forEach((t, q) => { c.font = SANS(34, 600); c.fillStyle = q < 3 ? "#94a3b8" : BLUE; c.fillText(`[${q + 1}] ${t}`, 120, 430 + q * 80); if (q < 3) { c.fillStyle = RED; c.fillText("✗", 940, 430 + q * 80); } });
              const kc = seg(f, endL + 2, endL + 6);   // the click
              if (kc > 0) { c.beginPath(); c.arc(640, 670, 30 * kc, 0, 7); c.fillStyle = "rgba(37,99,235,0.35)"; c.fill(); }
            } else { page404(c, "reservebankofindia.org/research/journal/2019/...pdf", 1); refTally(c, 3, r); }
          });
          {
            const [vm, va] = loopOn ? (["deadpan", "fold"] as [BillMood, BillArms]) : mood("vasudha", "calm", "fold");
            person(c, "vasudha", [880, 1120], 0.78, vm, va, b.who === "vasudha" && talking, r);
            const [cm, ca] = loopOn ? (["shock", "rest"] as [BillMood, BillArms]) : mood("charan", "worried", "rest");
            person(c, "charan", [210, 1140], 0.78, cm, ca, b.who === "charan" && talking, r);
          }
          heads(c, W, f);
          if (b.prop === "rule") {   // the rule card over the screen
            const kr = seg(f, ln.from - 4, ln.from + 6), k2 = seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6);
            const rows: [string[], string, string, number][] = [[["1  type: \"Give me 5 reports on GST:", "    name and publisher. No links.\""], "#fef3c7", INK, kr],
              [["2  search for each one yourself"], "#e0e7ff", "#1e3a8a", k2], [["3  open every link before you cite it"], "#dcfce7", "#14532d", seg(f, cu(1, 0.5) + 6, cu(1, 0.5) + 14)]];
            let yy = 390;
            rows.forEach(([ts, bg, fg, k]) => {   // stills: the ask in one line shrank to 28 px
              const h = 40 + ts.length * 50;
              if (k > 0) {
                c.save(); c.globalAlpha = clamp(k * 2);
                c.fillStyle = bg; rrect(c, 100, yy, 880, h, 22); c.fill();
                c.font = SANS(42); c.fillStyle = fg; c.textAlign = "left";
                ts.forEach((t, q) => c.fillText(t, 130, yy + 62 + q * 50));
                c.restore();
              }
              yy += h + 18;
            });
            c.save(); c.globalAlpha = seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22);
            c.fillStyle = "rgba(15,23,42,0.9)"; rrect(c, 120, 836, 840, 80, 20); c.fill();
            c.font = SANS(40, 800); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("web search on? open the links anyway", W / 2, 890);
            c.restore();
          }
          if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
        } else if (b.shot === "phone") {
          // ---------- Charan's phone: the AI's five links ----------
          room(c, W, H);
          const sure = b.prop === "sure" || b.prop === "sure2";
          chatPhone(c, 180, 300, 1.1, sure ? "Give me 5 links for my GST project. Only give links you are sure exist. If you are not sure, say so." : "Give me 5 links to sources for my GST project.",
            ["Here are 5 links to sources you can cite:", ...LINKS], 1);
          if (b.prop === "sure2") {
            stamp(c, "\"not sure\": 0 of 10 replies", W / 2, 1210, 58, RED, seg(f, ln.from + 4, ln.from + 12), -0.06);
            tag(c, "no fewer dead links", 400, 1370, 54, "#fee2e2", "#991b1b", seg(f, cu(1, 0.5), cu(1, 0.5) + 8));
          }
        } else if (b.shot === "typing") {
          // ---------- how the AI writes a link: one piece at a time ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("THE AI WRITES A LINK LIKE A SENTENCE", W / 2, 360);
          c.font = SANS(34, 600); c.fillStyle = "#cbd5e1"; c.fillText("one likely piece after another", W / 2, 420);
          const parts = ["www.", "reservebank", "ofindia", ".org"];
          let x = 60;
          parts.forEach((t, q) => {
            const kq = seg(f, ln.from + 6 + q * 9, ln.from + 10 + q * 9);
            c.font = MONO(50, 800); const w = c.measureText(t).width;
            if (kq > 0) { c.save(); c.globalAlpha = clamp(kq * 2); c.fillStyle = "#1e293b"; rrect(c, x - 8, 560, w + 16, 96, 14); c.fill(); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(t, x, 628); c.restore(); }
            x += w + 18;
          });
          tag(c, "looks right · doesn't exist", W / 2, 860, 62, "#fee2e2", "#991b1b", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), -0.03);
        } else if (b.shot === "domain") {
          // ---------- the fake address vs the real one ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          ([["reservebankofindia.org", "no such website", RED, "#fee2e2", 470, ln.from], ["rbi.org.in", "RBI's real website", GREEN, "#dcfce7", 840, cu(1, 0.3)]] as [string, string, string, string, number, number][]).forEach(([t, sub, col, bg, y, t0]) => {
            const k = seg(f, t0 - 2, t0 + 6);
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = bg; rrect(c, 90, y - 120, 900, 230, 26); c.fill();
            c.font = MONO(54, 800); c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, W / 2, y - 20);
            c.font = SANS(44, 900); c.fillStyle = col; c.fillText((col === RED ? "✗ " : "✓ ") + sub, W / 2, y + 60);
            c.restore();
          });
          c.save(); c.globalAlpha = seg(f, cu(1, 0.3) + 10, cu(1, 0.3) + 16);
          c.font = SANS(42, 800); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("in our test it wrote the fake one 8 times", W / 2, 1140);
          c.restore();
        } else if (b.shot === "test") {
          // ---------- our test: 150 links, every one opened ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(60, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST", W / 2, 330);
          c.font = SANS(36, 600); c.fillStyle = "#e2e8f0"; c.fillText("a small AI, offline, no internet · 30 asks × 5 links", W / 2, 396);
          c.font = SANS(40, 800); c.fillStyle = "#f8fafc"; c.fillText("150 links · we opened all 150", W / 2, 452);
          const c5 = b.prop === "test" ? cu(1, 0.5) : -1e9;   // render review: the 72 said and shown big
          if (b.prop === "test") {
            const k72 = seg(f, c5 - 2, c5 + 6);
            if (k72 > 0) {
              c.save(); c.globalAlpha = clamp(k72 * 3);
              c.fillStyle = "#334155"; rrect(c, 110, 560, 860, 170, 24); c.fill();
              c.font = SANS(64, 900); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("72 blocked our test", W / 2, 640);
              c.font = SANS(36, 700); c.fillText("(sites that block programs: not counted)", W / 2, 700);
              c.fillStyle = "#1e3a8a"; rrect(c, 110, 780, 860, 150, 24); c.fill();
              c.font = SANS(64, 900); c.fillStyle = "#fde68a"; c.fillText("78 we could check", W / 2, 878);
              c.restore();
            }
          }
          const two = b.prop === "test2";
          const c1 = two ? cu(1, 0.7) : 0;
          const rows: [string, number, string, number][] = [["dead (404 / no such site)", 64, RED, two ? ln.from : 1e9], ["wrong or empty page", 12, "#f59e0b", two ? ln.from + 16 : 1e9], ["right", 2, GREEN, two ? c1 : 1e9]];
          c.save(); c.globalAlpha = two ? 1 : 0;
          c.font = SANS(40, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText("we could check 78:", 110, 560);
          c.restore();
          rows.forEach(([lab, v, col, t0], q) => {
            const k = seg(f, t0, t0 + 8);
            if (k <= 0) return;
            const y = 650 + q * 150;
            c.font = SANS(38, 700); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(lab, 110, y - 20);
            c.fillStyle = col; rrect(c, 110, y, Math.max(16, 760 * (v / 64) * easeOut(k)), 64, 12); c.fill();
            c.font = SANS(60, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(String(v), 990, y + 54);
          });
          c.save(); c.globalAlpha = two ? seg(f, endL - 6, endL + 2) : 0;
          c.font = SANS(36, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("+ 72 links the sites blocked: not counted", W / 2, 1200);
          c.restore();
        } else if (b.shot === "study") {
          // ---------- the big chatbots too ----------
          c.fillStyle = "#1e1b4b"; c.fillRect(0, 0, W, H);
          c.font = SANS(48, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("NOT JUST SMALL AIs", W / 2, 350);
          c.fillStyle = "#fffdf5"; rrect(c, 80, 430, W - 160, 620, 28); c.fill();
          c.font = SANS(34, 800); c.fillStyle = "#7c2d12"; c.textAlign = "left"; c.fillText("A 2025 STUDY", 130, 510);
          c.font = SANS(38, 700); c.fillStyle = "#475569"; c.fillText("8 free chatbots, 400 references:", 130, 566);
          ([["fully right", 26.5, GREEN, ln.from + 4], ["partly right", 33.8, "#f59e0b", ln.from + 10], ["wrong or made up", 39.8, RED, cu(1, 0.2) - 8]] as [string, number, string, number][]).forEach(([m, v, col, t0], q) => {
            const k = seg(f, t0, t0 + 8);
            if (k <= 0) return;
            const y = 610 + q * 130;   // render review: the other third (partly right) was missing
            c.font = SANS(40, 700); c.fillStyle = INK; c.textAlign = "left"; c.fillText(m, 130, y + 44);
            c.fillStyle = col; rrect(c, 130, y + 64, Math.max(16, 560 * (v / 40) * easeOut(k)), 56, 12); c.fill();
            c.font = SANS(52, 900); c.fillStyle = col; c.textAlign = "left"; c.fillText(`${v}%`, 150 + 560 * (v / 40) * easeOut(k), y + 110);
          });
          c.font = SANS(28, 600); c.fillStyle = "#64748b"; c.textAlign = "left"; c.fillText("Cabezas-Clavijo & Sidorenko-Bautista, 2025", 130, 1036);
        }
        if (b.who === "harsha" && ["domain", "test", "phone"].includes(b.shot)) {   // Harsha, turned round in his seat
          c.save(); c.beginPath(); c.rect(680, 1220, 400, 280); c.clip();
          person(c, "harsha", [900, 1450], 0.72, b.prop === "sure2" ? "smug" : "calm", "rest", talking, r);
          c.restore();
          c.font = SANS(30, 800); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("HARSHA", 900, 1250);
        }
        void stroke; void circlePts;
      }} />
    </>
  );
};

export const LINKS_SCENES = { sk_links: StLinks };
