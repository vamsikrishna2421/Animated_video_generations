import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Ctx, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 15 "Ammamma's dream wedding" (series/scripts/creative15_wedding_card.md): a live FM phone-in. Sarojini aunty
// calls RJ Bunny: the AI's English version of her daughter's wedding card reads "our mother's dream wedding with Ch.
// Kalyan" (Swapna, the bride's name, means "dream"; "మా అమ్మాయి", our girl, became "our mother"). Our test (series/scripts/
// creative15_demo): a small free AI, offline, the same card 20 times: Swapna 0 of 20, the mother's wedding 10 of 20,
// "dream" 11 of 20; with "keep the names exactly": Swapna still 0 of 10, Friday wrong 9 of 10, "sunrise at 10:30" 9 of
// 10. The rule: leave blanks for the names, date and day, let the AI do the rest, fill the blanks yourself. The loop:
// "Amma... you already sent it!", the family group floods, frame 1. One beat per line (s.data.beats).
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const SERIF = (s: number, w = 700) => `${w} ${s}px Georgia, "Times New Roman", serif`;
const GREEN = "#16a34a", RED = "#dc2626";
const HOLD = 40;   // frames of the family-group flood before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const MOODS: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  2: { bunny: ["shock", "up"], sarojini: ["worried", "phone"] }, 7: { sarojini: ["angry", "phone"], bunny: ["deadpan", "rest"] },
  10: { sarojini: ["smug", "phone"], bunny: ["happy", "up"] },
};
// the AI's English card: plain try 4 of our test, word for word (series/scripts/creative15_demo/7B.json)
const CARD: [string, string?][] = [["With the blessings of Sri Venkateshwar"], ["Swami, on the occasion of "], ["our mother", "m"], [" Ch.L.Sau's "], ["dream wedding", "d"],
  [" with Ch.Kalyan, the ceremony will take place on Friday, November 20, 2026, at 10:30 AM at Sri Lakshmi Kalyan Mandapam, Kukatpally, Hyderabad."]];
const FLOOD = ["Congratulations Ammamma!! 🎉", "Ammamma is marrying Kalyan??", "😂😂😂", "Who is Mrs. Sau?!", "Sarojini, call me NOW", "Congrats to the couple!! 💐",
  "Wait, where is Swapna?", "Forwarded many times"];

// ---------- the sets ----------
const studio = (c: Ctx, W: number, y0: number, h: number, f: number, live: boolean) => {
  c.fillStyle = "#1e1b4b"; c.fillRect(0, y0, W, h);
  for (let q = 0; q < 9; q++) { c.fillStyle = q % 2 ? "#312e81" : "#272263"; c.fillRect(q * 120, y0, 60, h); }   // acoustic foam
  const glow = live ? 0.75 + 0.25 * Math.sin(f / 4) : 0.25;   // the ON AIR light
  c.fillStyle = `rgba(220,38,38,${glow})`; rrect(c, 70, y0 + 270, 300, 100, 18); c.fill();
  c.font = SANS(58, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("ON AIR", 220, y0 + 340);
  c.font = SANS(34, 800); c.fillStyle = "#fde68a"; c.fillText("KABURLU FM 99.9", 220, y0 + 420);
  c.fillStyle = "#0f172a"; rrect(c, 360, y0 + h - 170, 720, 170, 16); c.fill();   // the desk and mixer
  for (let q = 0; q < 8; q++) { c.fillStyle = "#475569"; c.fillRect(420 + q * 70, y0 + h - 140, 12, 90); c.fillStyle = q % 3 ? "#e2e8f0" : "#f87171"; c.fillRect(408 + q * 70, y0 + h - 110 + ((q * 37) % 50), 36, 18); }
};
const livingRoom = (c: Ctx, W: number, y0: number, h: number) => {
  c.fillStyle = "#fde7c4"; c.fillRect(0, y0, W, h);
  c.fillStyle = "#b45309"; c.fillRect(0, y0 + h - 160, W, 160);   // the floor
  c.fillStyle = "#7c2d12"; rrect(c, 40, y0 + h - 420, 520, 260, 30); c.fill();   // the sofa
  c.fillStyle = "#fef3c7"; rrect(c, 720, y0 + 90, 260, 200, 10); c.fill(); c.strokeStyle = "#92400e"; c.lineWidth = 10; rrect(c, 720, y0 + 90, 260, 200, 10); c.stroke();   // a framed photo
  c.font = SANS(30, 800); c.fillStyle = "#92400e"; c.textAlign = "center"; c.fillText("Ammamma", 850, y0 + 200);
  c.fillStyle = "#a16207"; rrect(c, 640, y0 + h - 300, 360, 40, 8); c.fill();   // the table, with the printed cards
  for (let q = 0; q < 4; q++) { c.fillStyle = q % 2 ? "#dc2626" : "#f59e0b"; rrect(c, 680 + q * 70, y0 + h - 340 - q * 6, 120, 44, 6); c.fill(); }
};
const headphones = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = "#0f172a"; c.lineWidth = 22; c.beginPath(); c.arc(0, -140, 112, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  [-1, 1].forEach((d) => { c.fillStyle = "#0f172a"; rrect(c, d * 104 - 26, -170, 52, 90, 20); c.fill(); });
  c.fillStyle = "#334155"; c.fillRect(150, -60, 14, 150); c.fillStyle = "#0f172a"; rrect(c, 118, -110, 80, 70, 30); c.fill();   // the mic
  c.restore();
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
  c.fillStyle = "rgba(255,255,255,0.94)"; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.fill();
  c.strokeStyle = col; c.lineWidth = 12; rrect(c, -w / 2 - 30, -s * 0.9, w + 60, s * 1.3, 18); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// her phone (screen space) with the AI's English card, word-wrapped; marked runs get red circles once `mark` > 0
const cardPhone = (c: Ctx, x: number, y: number, s: number, mark: number, dreamZoom: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 12, 14, 760, 1020, 50); c.fill();
  c.fillStyle = "#111827"; rrect(c, 0, 0, 760, 1020, 50); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 20, 20, 720, 980, 34); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, 20, 20, 720, 90, 34); c.fill(); c.fillRect(20, 70, 720, 40);
  c.font = SANS(36); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", 56, 82);
  c.fillStyle = "#1d4ed8"; rrect(c, 150, 140, 560, 76, 22); c.fill();
  c.font = SANS(28, 600); c.fillStyle = "#fff"; c.fillText("Translate this wedding invitation into", 172, 176); c.fillText("English: [the Telugu card]", 172, 206);
  c.fillStyle = "#fffbeb"; rrect(c, 40, 250, 680, 700, 22); c.fill();
  c.strokeStyle = "#f59e0b"; c.lineWidth = 6; rrect(c, 52, 262, 656, 676, 18); c.stroke();   // a card border
  c.font = SERIF(40, 700); c.fillStyle = "#92400e"; c.textAlign = "center"; c.fillText("Wedding Invitation", 380, 330);
  // word wrap with marks
  c.font = SERIF(36, 600); c.textAlign = "left";
  let lx = 80, ly = 400; const lh = 52, maxX = 680;
  const boxes: [number, number, number, string][] = [];
  CARD.forEach(([t, m]) => {
    const words = t.split(/(\s+)/);
    let start: [number, number] | null = null;
    words.forEach((w) => {
      if (!w) return;
      const ww = c.measureText(w).width;
      if (/^\s+$/.test(w)) { lx += ww; return; }
      if (lx + ww > maxX) { if (m && start) { boxes.push([start[0], start[1], lx - start[0], m]); start = null; } lx = 80; ly += lh; }
      if (m && !start) start = [lx, ly];
      const z = m === "d" ? 1 + 0.25 * dreamZoom : 1;
      c.save(); c.translate(lx, ly); c.scale(z, z); c.fillStyle = m ? "#7f1d1d" : INK; c.fillText(w, 0, 0); c.restore();
      lx += ww * z;
    });
    if (m && start) boxes.push([start[0], start[1], lx - start[0], m]);
  });
  if (mark > 0) boxes.forEach(([bx, by, bw]) => {
    c.save(); c.globalAlpha = clamp(mark * 3);
    const pts: [number, number][] = [];
    for (let q = 0; q <= 24; q++) { const a = (q / 24) * Math.PI * 2.1; pts.push([bx + bw / 2 + Math.cos(a) * (bw / 2 + 16), by - 12 + Math.sin(a) * 34]); }
    stroke(c, pts, RED, 6, r, { passes: 2 });
    c.restore();
  });
  c.font = SANS(30, 800); c.fillStyle = RED; c.textAlign = "left";
  if (mark > 0) { c.save(); c.globalAlpha = clamp(mark * 3); c.fillText("Swapna? not on the card", 80, 905); c.restore(); }
  c.restore();
};
const bubble = (c: Ctx, t: string, x: number, y: number, k: number, mine: boolean) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); const z = 0.8 + 0.2 * easeOut(k); c.scale(z, z);
  c.font = SANS(40, 700); const w = c.measureText(t).width;
  c.fillStyle = mine ? "#dcf8c6" : "#ffffff"; rrect(c, -w / 2 - 28, -48, w + 56, 80, 22); c.fill();
  c.fillStyle = INK; c.textAlign = "center"; c.fillText(t, 0, 6); c.restore();
};

// ---------- the scene ----------
const StCard: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") {   // the ring and a hit before her first word; a scratch on "into my mother's"
      sfx.push(<Sfx key={k("r")} at={0} src="reel/sfx_ring1.wav" vol={0.35} />, <Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.7} />,
        <Sfx key={k("g")} at={cue(i, 1, 0.6) - 3} src="reel/sfx_glitch.wav" vol={te ? 0.18 : 0.3} />);
    }
    if (b.prop === "onair") sfx.push(<Sfx key={k("d")} at={at - 6} src="audio/gag_ding.wav" vol={0.25} />);
    if (b.prop === "dream") sfx.push(<Sfx key={k("d")} at={at + 10} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "girl") sfx.push(<Sfx key={k("b")} at={end + 1} src="audio/gag_boing.wav" vol={0.2} />);
    if (b.prop === "test") {   // the bed out before "Swapna: zero", then a boom on it
      const c1 = cue(i, 1, 0.5);
      sfx.push(<Sfx key={k("n")} at={c1 - (te ? 12 : 3)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />, <Sfx key={k("c")} at={end + 2} src={CLAP} vol={0.3} />);
    }
    if (b.prop === "worse") sfx.push(<Sfx key={k("z")} at={at + 6} src="reel/sfx_buzz.wav" vol={0.25} />, <Sfx key={k("g")} at={end + 1} src="reel/sfx_glitch.wav" vol={0.25} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 30)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 32)} src="reel/sfx_boom.wav" vol={0.4} />);
    if (b.prop === "loop") {   // the flood: pings piling up, then the slam back to frame 1
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 37)} src="reel/sfx_riser.wav" vol={0.35} />);
      FLOOD.forEach((_, q) => sfx.push(<Sfx key={k("p" + q)} at={end + 2 + q * 4} src="audio/sfx_pop.wav" vol={0.22} />));
      sfx.push(<Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("r")} at={slam + 2} src="reel/sfx_ring1.wav" vol={0.3} />);
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("rule") === 0 && percEnd > 30 && (   // the last scene builds: hats and claps up to the last line
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.08 + 0.16 * clamp(fr / percEnd) : 0.12 + 0.3 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const r = rng(5500 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const mood = (who: BillWho, dm: BillMood, da: BillArms): [BillMood, BillArms] => MOODS[n]?.[who] ?? [dm, da];
        const live = (y: number) => { c.font = SANS(30, 900); c.fillStyle = "#fff"; c.fillStyle = "rgba(220,38,38,0.95)"; rrect(c, 40, y, 330, 56, 14); c.fill(); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("● LIVE · CALLER 1", 62, y + 39); };
        if (b.shot === "card" || loopOn) {
          // ---------- her phone: the AI's English card ----------
          c.fillStyle = "#fde7c4"; c.fillRect(0, 0, W, H);
          const hook = b.prop === "hook" || loopOn;
          const mark = hook ? 1 : b.prop === "dream" ? seg(f, ln.from, ln.from + 8) : 1;
          cardPhone(c, 213, 430, 0.86, mark, b.prop === "dream" ? seg(f, cu(1, 0.5) - 20, cu(1, 0.5)) : 0, r);
          if (hook) {   // sound-off: the headline over frame 1
            c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, 60, 262, W - 120, 140, 26); c.fill();
            c.font = SANS(66, 900); c.fillStyle = "#fde047"; c.textAlign = "center"; c.fillText("AI MARRIED OFF AMMAMMA", W / 2, 356);
          } else { live(230); }
          if (b.prop === "name") tag(c, "Swapna = \"dream\"", W / 2, 1370, 64, "#fee2e2", "#991b1b", seg(f, ln.from + 2, ln.from + 10), -0.03);
          if (b.prop === "name") tag(c, "it translated her name", W / 2, 1475, 50, "#0f172a", "#fde68a", seg(f, cu(1, 0.4), cu(1, 0.4) + 8));
          if (b.prop === "girl") {
            tag(c, "\"maa ammayi\" = \"our girl\"", W / 2, 1370, 60, "#dcfce7", "#14532d", seg(f, ln.from + 2, ln.from + 10));
            tag(c, "→ \"our mother\"", W / 2, 1475, 60, "#fee2e2", "#991b1b", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), -0.04);
          }
          if (!hook) {   // the caller, small, in the corner
            c.save(); c.beginPath(); c.rect(0, 1600, 520, 320); c.clip();
            person(c, "sarojini", [240, 1820], 0.62, b.who === "sarojini" ? "worried" : "shock", "phone", b.who === "sarojini" && talking, r);
            c.restore();
          }
          if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
        } else if (b.shot === "split") {
          // ---------- the studio over her living room ----------
          studio(c, W, 0, 960, f, true);
          c.save(); c.beginPath(); c.rect(0, 0, W, 960); c.clip();
          const [bm, ba] = mood("bunny", "excited", "rest");
          person(c, "bunny", [700, 640], 0.62, bm, ba, b.who === "bunny" && talking, r);
          headphones(c, 700, 640, 0.62);
          c.restore();
          livingRoom(c, W, 960, 960);
          c.save(); c.beginPath(); c.rect(0, 960, W, 960); c.clip();
          const [sm, sa] = mood("sarojini", "worried", "phone");
          person(c, "sarojini", [330, 1390], 0.6, sm, sa, b.who === "sarojini" && talking, r);
          c.restore();
          c.fillStyle = "#0f172a"; c.fillRect(0, 952, W, 16);
          live(990);
          if (b.prop === "keep") tag(c, "\"Keep the names exactly!\"", 700, 1180, 50, "#e0e7ff", "#1e3a8a", seg(f, ln.from + 4, ln.from + 12));
          if (b.prop === "check") tag(c, "Swapna checks it first", 700, 1180, 50, "#dcfce7", "#14532d", seg(f, cu(1, 0.3), cu(1, 0.3) + 8));
        } else if (b.shot === "test") {
          // ---------- our test: the same card, 20 tries ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(60, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST", W / 2, 300);
          c.font = SANS(36, 600); c.fillStyle = "#e2e8f0"; c.fillText("a small free AI, offline · not the big apps", W / 2, 366);
          c.font = SANS(40, 800); c.fillStyle = "#f8fafc"; c.fillText("the same Telugu card, translated 20 times", W / 2, 426);
          if (b.prop === "test") {
            const c1 = cu(1, 0.5);
            stamp(c, "Swapna's name: 0 of 20", W / 2, 640, 74, RED, seg(f, c1 - 2, c1 + 6), -0.04);
            tag(c, "Grandma (Ammamma) was the bride: 10 of 20", W / 2, 880, 54, "#fee2e2", "#991b1b", seg(f, c1 + 16, c1 + 24));
            tag(c, "\"dream\": 11 of 20", W / 2, 1040, 50, "#334155", "#f8fafc", seg(f, c1 + 26, c1 + 34));
          } else {
            c.font = SANS(44, 900); c.fillStyle = "#93c5fd"; c.fillText("+ \"keep every name exactly\" · 10 tries", W / 2, 620);
            const c1 = cu(1, 0.3);
            const rows: [string, string, number][] = [["Swapna's name", "still 0 of 10", ln.from + 4], ["Friday", "wrong 9 of 10", c1], ["10:30 AM", "\"sunrise at 10:30\": 9 of 10", c1 + 22]];
            rows.forEach(([a, v, t0], q) => {
              const k = seg(f, t0 - 2, t0 + 6);
              if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3);
              c.fillStyle = "#1e293b"; rrect(c, 90, 690 + q * 200, 900, 160, 24); c.fill();
              c.font = SANS(40, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(a, 130, 750 + q * 200);
              c.font = SANS(52, 900); c.fillStyle = "#f87171"; c.fillText(v, 130, 818 + q * 200);
              c.restore();
            });
            stamp(c, "WORSE", W / 2, 530, 60, RED, seg(f, ln.from + 2, ln.from + 10), 0.12);
          }
        } else if (b.shot === "rule") {
          // ---------- the rule: blanks you fill yourself ----------
          c.fillStyle = "#fffbeb"; c.fillRect(0, 0, W, H);
          c.font = SANS(52, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("BEFORE AN AI TRANSLATES A CARD", W / 2, 300);
          c.fillStyle = "#fff"; rrect(c, 70, 380, 940, 560, 26); c.fill(); c.strokeStyle = "#f59e0b"; c.lineWidth = 6; rrect(c, 70, 380, 940, 560, 26); c.stroke();
          const fill = seg(f, cu(1, 0.6), cu(1, 0.6) + 20);   // the blanks fill in, in green, as he says "fill them in yourself"
          const rows: [string, string, string][] = [["Our daughter ", "Swapna", " weds"], ["", "Kalyan", ""], ["on ", "Friday, 20 Nov 2026", ","], ["at ", "10:30 AM", ","], ["", "Sri Lakshmi Kalyana Mandapam", ""]];
          c.font = SERIF(46, 700); c.textAlign = "left";
          rows.forEach(([a, blank, z], q) => {
            const y = 470 + q * 96;
            let x = 120;
            c.fillStyle = INK; c.fillText(a, x, y); x += c.measureText(a).width;
            c.font = SERIF(46, 700); const bw = Math.max(260, c.measureText(blank).width);
            stroke(c, [[x, y + 12], [x + bw, y + 12]], "#94a3b8", 5, r, { passes: 1 });
            if (fill > 0) { c.save(); c.globalAlpha = clamp(fill * 2 - q * 0.25); c.fillStyle = GREEN; c.fillText(blank, x, y); c.restore(); }
            c.fillStyle = INK; c.fillText(z, x + bw + 6, y);
          });
          tag(c, "1  YOU type the names, date, day and time", W / 2, 1060, 46, "#dcfce7", "#14532d", seg(f, ln.from, ln.from + 8));
          tag(c, "2  the AI translates only the rest", W / 2, 1210, 46, "#e0e7ff", "#1e3a8a", seg(f, cu(1, 0.1), cu(1, 0.1) + 8));
          tag(c, "3  someone who reads both checks it", W / 2, 1360, 46, "#fef3c7", "#92400e", seg(f, cu(1, 0.6) + 22, cu(1, 0.6) + 30));
        } else if (b.shot === "home") {
          // ---------- the living room: Swapna in the doorway, then the family group floods ----------
          livingRoom(c, W, 0, H);
          c.fillStyle = "#78350f"; c.fillRect(640, 260, 360, 1500);   // the doorway
          c.save(); c.beginPath(); c.rect(640, 260, 360, 1500); c.clip();
          person(c, "swapna", [820, 900], 0.82, f > endL ? "shock" : "deadpan", "phone", b.who === "swapna" && talking, r);
          c.restore();
          person(c, "sarojini", [300, 1200], 0.82, f > ln.from + 10 ? "shock" : "smug", "phone", false, r);
          if (f > endL) {   // the flood
            c.save(); c.globalAlpha = 0.6 * seg(f, endL, endL + 6); c.fillStyle = "#075e54"; c.fillRect(0, 0, W, H); c.restore();
            c.font = SANS(44, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.globalAlpha = seg(f, endL, endL + 4);
            c.fillText("Family 👨‍👩‍👧 (243)", W / 2, 320); c.globalAlpha = 1;
            FLOOD.forEach((t, q) => bubble(c, t, q % 2 ? 640 : 440, 430 + q * 140, seg(f, endL + 2 + q * 4, endL + 6 + q * 4), q % 3 === 0));
          }
        }
        void SERIF;
      }} />
    </>
  );
};

export const CARD_SCENES = { sk_card: StCard };
