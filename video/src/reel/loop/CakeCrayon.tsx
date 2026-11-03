import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// Creative 16 "Happy Dad 60th Bir" (series/scripts/creative16_cake.md): Thathayya's 60th, the cake comes out: "HAPPY DAD
// 60TH BIR", "THDAY!" dripped off the edge. Harish mama told the AI "15 letters"; its message, "Happy dad 60th birthday!",
// is 21. Bindu: it doesn't see letters, it sees chunks (the model's real tokens of the cake text: H·APP·Y·␣D·AD·␣·6·0·TH·␣B·
// IRTH·DAY·!). Our test (series/scripts/creative16_demo, a small offline AI): a 15-letter message, 0 of 10 fit (17-24);
// "how many letters in HAPPY 60TH BIRTHDAY NANNA?" 14 or 15 every time (22); spelled out first: 0 of 10 ("BIRTHARDAY").
// The rule: ask the AI for the words, count the letters yourself. The loop: "Bindu, read it again!", frame 1.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const SERIF = (s: number, w = 700) => `${w} ${s}px Georgia, "Times New Roman", serif`;
const GREEN = "#16a34a", RED = "#dc2626";
const HOLD = 20;   // frames after the last line before the slam back to frame 1
const CLAP = "reel/creative09v1/clap.wav";
const MOODS: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { bindu: ["shock", "up"], harish: ["worried", "rest"], thathayya: ["deadpan", "fold"] }, 3: { thathayya: ["smug", "fold"], harish: ["worried", "rest"], bindu: ["happy", "rest"] },
  4: { bindu: ["smug", "five"], harish: ["shock", "rest"], thathayya: ["calm", "fold"] }, 5: { harish: ["worried", "phone"], bindu: ["deadpan", "fold"] },
  8: { harish: ["angry", "phone"], bindu: ["smug", "fold"] }, 11: { thathayya: ["happy", "up"], harish: ["calm", "rest"], bindu: ["happy", "rest"] },
};
// the model's own tokens of the cake text (Qwen2.5-7B-Instruct's tokenizer, read on this machine)
const CHUNKS = ["H", "APP", "Y", "␣D", "AD", "␣", "6", "0", "TH", "␣B", "IRTH", "DAY", "!"];

// ---------- pieces ----------
const party = (c: Ctx, W: number, H: number, f: number) => {
  c.fillStyle = "#3b2f5c"; c.fillRect(0, 0, W, H);   // the lights are down
  for (let q = 0; q < 14; q++) {   // fairy lights
    const x = 40 + q * 78, y = 230 + Math.sin(q * 0.9) * 26, on = (Math.floor(f / 8) + q) % 3 !== 0;
    c.beginPath(); c.arc(x, y, 12, 0, 7); c.fillStyle = on ? ["#fde047", "#f472b6", "#60a5fa", "#4ade80"][q % 4] : "#64748b"; c.fill();
  }
  c.strokeStyle = "#94a3b8"; c.lineWidth = 3; c.beginPath(); for (let q = 0; q < 14; q++) { const x = 40 + q * 78, y = 230 + Math.sin(q * 0.9) * 26; if (q) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
  c.font = SANS(54, 900); c.fillStyle = "#fbcfe8"; c.textAlign = "center"; c.fillText("HAPPY 60th THATHAYYA", W / 2, 360);   // the banner on the wall (the family's, spelled right)
  c.fillStyle = "#7c2d12"; c.fillRect(0, 1080, W, H - 1080);   // the table (stills: the cake sat under the captions)
  c.fillStyle = "#fef3c7"; c.fillRect(0, 1080, W, 18);
};
// the cake (screen space), its icing cut at the edge, "THDAY!" dripped onto the board
const cake = (c: Ctx, x: number, y: number, s: number, drip: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#e5e7eb"; c.beginPath(); c.ellipse(0, 150, 420, 70, 0, 0, 7); c.fill();   // the board
  c.fillStyle = "#f9a8d4"; c.fillRect(-300, -40, 600, 170); c.beginPath(); c.ellipse(0, 130, 300, 50, 0, 0, 7); c.fill();
  c.fillStyle = "#fdf2f8"; c.beginPath(); c.ellipse(0, -40, 300, 70, 0, 0, 7); c.fill();   // the top
  for (let q = 0; q < 6; q++) { c.fillStyle = "#fde047"; c.fillRect(-150 + q * 60, -150, 14, 90); c.fillStyle = "#f97316"; c.beginPath(); c.ellipse(-143 + q * 60, -165, 9, 16, 0, 0, 7); c.fill(); }   // candles
  c.fillStyle = "#be185d"; c.textAlign = "center";
  c.font = SERIF(64, 800); c.fillText("HAPPY DAD", 0, -50);
  c.save(); c.translate(0, 10); c.font = SERIF(64, 800); c.fillText("60TH BIR", 0, 0); c.restore();
  c.save(); c.globalAlpha = clamp(drip * 2); c.translate(250, 225); c.rotate(0.08);
  c.font = SERIF(84, 800); c.fillStyle = "#be185d"; c.fillText("THDAY!", 0, 0); c.restore();   // fell off the edge (render review: bigger, on the board)
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
const chatPhone = (c: Ctx, x: number, y: number, s: number, ask: string, reply: string, k: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, 12, 14, 640, 820, 50); c.fill();
  c.fillStyle = "#111827"; rrect(c, 0, 0, 640, 820, 50); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, 20, 20, 600, 780, 34); c.fill();
  c.fillStyle = "#4338ca"; rrect(c, 20, 20, 600, 90, 34); c.fill(); c.fillRect(20, 70, 600, 40);
  c.font = SANS(36); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("✦ AI chat", 56, 82);
  c.font = SANS(30, 600); const ls: string[] = []; let cur = "";
  ask.split(" ").forEach((w) => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width > 470 && cur) { ls.push(cur); cur = w; } else cur = t; });
  if (cur) ls.push(cur);
  c.fillStyle = "#1d4ed8"; rrect(c, 90, 140, 500, ls.length * 40 + 30, 22); c.fill();
  c.fillStyle = "#fff"; ls.forEach((t, q) => c.fillText(t, 110, 184 + q * 40));
  const y0 = 140 + ls.length * 40 + 70;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#e5e7eb"; rrect(c, 40, y0, 540, 120, 22); c.fill();
  c.font = SANS(40, 800); c.fillStyle = INK; c.fillText(reply, 64, y0 + 76);
  c.restore();
  c.restore();
};

// ---------- the scene ----------
const StCake: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") {   // party claps under frame 1, a hit on "BIR?!"
      sfx.push(<Sfx key={k("c")} at={0} src={CLAP} vol={te ? 0.3 : 0.4} />, <Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={0.6} />,
        <Sfx key={k("h")} at={cue(i, 1, 0.6) - 3} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.55} />, <Sfx key={k("b")} at={cue(i, 1, 0.6) + 2} src="audio/gag_boing.wav" vol={0.25} />);
    }
    if (b.prop === "told") sfx.push(<Sfx key={k("d")} at={at - 4} src="audio/gag_ding.wav" vol={0.22} />);
    if (b.prop === "counted") [0, 3, 6, 9, 12, 15].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q} src="audio/sfx_tick.wav" vol={0.15} />));
    if (b.prop === "chunks") CHUNKS.forEach((_, q) => sfx.push(<Sfx key={k("p" + q)} at={at + 6 + q * 3} src="audio/sfx_pop.wav" vol={0.12} />));
    if (b.prop === "test") { const c1 = cue(i, 1, 0.5); sfx.push(<Sfx key={k("n")} at={c1 - (te ? 16 : 3)} src="reel/sfx_boom.wav" vol={te ? 0.25 : 0.55} />); }   // Telugu: the boom masked "ఒక్కటి కూడా"
    if (b.prop === "count2") sfx.push(<Sfx key={k("z")} at={end - 8} src="reel/sfx_buzz.wav" vol={0.25} />, <Sfx key={k("c")} at={end + 2} src={CLAP} vol={0.3} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("a")} at={Math.max(0, at - 30)} src={CLAP} vol={0.4} />, <Sfx key={k("h")} at={Math.max(0, at - 32)} src="reel/sfx_boom.wav" vol={0.35} />);
    if (b.prop === "loop") {
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 20)} src="reel/sfx_riser.wav" vol={te ? 0.2 : 0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />);   // render review: the riser buried the rule's last words
    }
  });
  const iLoop = first("loop"), percEnd = iLoop >= 0 ? ls[iLoop].from - 30 : 0;
  return (
    <>
      {sfx}
      {first("rule") === 0 && percEnd > 30 && (
        <Sequence from={0} durationInFrames={percEnd} layout="none">
          <Audio src={staticFile("reel/creative09v1/perc.wav")} volume={(fr) => te ? 0.08 + 0.16 * clamp(fr / percEnd) : 0.12 + 0.3 * clamp(fr / percEnd)} />
        </Sequence>
      )}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i], n = b.n;
        const r = rng(6600 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const mood = (who: BillWho, dm: BillMood, da: BillArms): [BillMood, BillArms] => (loopOn ? MOODS[1] : MOODS[n])?.[who] ?? [dm, da];
        if (b.shot === "cake" || loopOn) {
          // ---------- the party around the cake ----------
          party(c, W, H, f);
          const [tm, ta] = mood("thathayya", "calm", "fold"), [hm, ha] = mood("harish", "worried", "rest"), [bm, ba] = mood("bindu", "happy", "rest");
          person(c, "harish", [210, 740], 0.66, hm, ha, b.who === "harish" && talking, r);
          person(c, "thathayya", [540, 680], 0.7, tm, ta, b.who === "thathayya" && talking, r);
          person(c, "bindu", [880, 790], 0.56, bm, ba, b.who === "bindu" && talking, r);
          cake(c, W / 2, 1150, 1.05, 1);
          if (b.prop === "hook" || loopOn) tag(c, "the cake fits 15 letters", W / 2, 1440, 44, "#0f172a", "#fde68a", 1);
          if (b.prop === "counted") {
            tag(c, "21!", 880, 460, 90, "#fde047", INK, seg(f, cu(1, 0.2), cu(1, 0.2) + 8), -0.06);
            c.save(); c.globalAlpha = seg(f, cu(1, 0.2) + 8, cu(1, 0.2) + 16);
            c.font = SANS(34, 700); c.fillStyle = "#f8fafc"; c.textAlign = "center"; c.fillText("H·A·P·P·Y·D·A·D·6·0·T·H·B·I·R·T·H·D·A·Y·!", W / 2, 1440); c.restore();
          }
        } else if (b.shot === "phone") {
          // ---------- his AI chat ----------
          c.fillStyle = "#3b2f5c"; c.fillRect(0, 0, W, H);
          chatPhone(c, 220, 300, 1.0, "Write a message for my father's 60th birthday cake. The cake fits only 15 letters.", "Happy dad 60th birthday!", seg(f, ln.from + 4, ln.from + 12));
          stamp(c, "21, not 15", W / 2, 1300, 74, RED, seg(f, cu(1, 0.5), cu(1, 0.5) + 8), -0.05);
        } else if (b.shot === "chunks") {
          // ---------- what the AI sees: chunks, not letters ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(54, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("WHAT THE AI SEES", W / 2, 330);
          c.font = SANS(36, 600); c.fillStyle = "#e2e8f0"; c.fillText("the cake text, cut into the model's own chunks", W / 2, 396);
          let x = 80, y = 560;
          CHUNKS.forEach((t, q) => {
            const k = seg(f, ln.from + 6 + q * 3, ln.from + 10 + q * 3);
            c.font = SANS(64, 900); const w = c.measureText(t).width + 40;
            if (x + w > W - 60) { x = 80; y += 140; }
            if (k > 0) {
              const hot = t === "IRTH" && f >= cu(1, 0.3);
              c.save(); c.globalAlpha = clamp(k * 3);
              c.fillStyle = hot ? "#fde047" : ["#e0e7ff", "#dcfce7", "#fee2e2", "#fef3c7"][q % 4]; rrect(c, x, y - 70, w, 100, 18); c.fill();
              c.fillStyle = INK; c.textAlign = "left"; c.fillText(t, x + 20, y + 4); c.restore();
            }
            x += w + 16;
          });
          tag(c, "13 chunks · 21 characters", W / 2, 1060, 54, "#334155", "#f8fafc", seg(f, ln.from + 48, ln.from + 56));
          tag(c, "IRTH is one sticker: it never sees I-R-T-H", W / 2, 1200, 44, "#fde047", INK, seg(f, cu(1, 0.4), cu(1, 0.4) + 8), -0.02);
        } else if (b.shot === "test") {
          // ---------- our test ----------
          c.fillStyle = "#0f172a"; c.fillRect(0, 0, W, H);
          c.font = SANS(60, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("OUR TEST", W / 2, 300);
          c.font = SANS(38, 700); c.fillStyle = "#f8fafc"; c.fillText("a small free AI, offline · not the big apps", W / 2, 370);
          if (b.prop === "test" || b.prop === "count") {
            c.font = SANS(42, 800); c.fillStyle = "#93c5fd"; c.fillText("\"...the cake fits only 15 letters\" · 10 tries", W / 2, 470);
            const c1 = b.prop === "count" ? ln.from - 300 : cu(1, 0.5);
            const q0 = 1 - seg(f, c1 - 4, c1);   // stills: an empty card until the number
            if (q0 > 0) { c.save(); c.globalAlpha = q0; c.font = SANS(68, 900); c.fillStyle = "#fde68a"; c.fillText("How many fit", W / 2, 700); c.fillText("in 15 letters?", W / 2, 790); c.restore(); }
            stamp(c, "0 of 10 fit", W / 2, 720, 110, RED, seg(f, c1 - 2, c1 + 6), -0.05);
            tag(c, "they ran 17 to 24 characters", W / 2, 940, 50, "#334155", "#f8fafc", seg(f, c1 + 14, c1 + 22));
          } else {
            c.font = SANS(42, 800); c.fillStyle = "#93c5fd"; c.fillText("\"How many letters in", W / 2, 450); c.fillText("HAPPY 60TH BIRTHDAY NANNA?\"", W / 2, 504);
            const c1 = cu(1, 0.3);
            const rows: [string, string, string, number][] = [["it said (wrong, 10 of 10)", "14 or 15", RED, ln.from + 4], ["the real count", "22", GREEN, c1], ["spelled out first: still wrong", "17 to 30 · \"BIRTHARDAY\"", RED, c1 + 26]];
            rows.forEach(([a, v, col, t0], q) => {
              const k = seg(f, t0 - 2, t0 + 6); if (k <= 0) return;
              c.save(); c.globalAlpha = clamp(k * 3);
              c.fillStyle = "#1e293b"; rrect(c, 90, 590 + q * 220, 900, 180, 24); c.fill();
              c.font = SANS(40, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(a, 130, 652 + q * 220);
              c.font = SANS(66, 900); c.fillStyle = col; c.fillText(v, 130, 734 + q * 220);
              c.restore();
            });
          }
        } else if (b.shot === "rule") {
          // ---------- the rule ----------
          c.fillStyle = "#fffbeb"; c.fillRect(0, 0, W, H);
          c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("A CAKE, A FORM, A BIO?", W / 2, 320);
          tag(c, "the AI: the words", W / 2, 520, 70, "#e0e7ff", "#1e3a8a", seg(f, ln.from, ln.from + 8));
          tag(c, "YOU: the count", W / 2, 720, 70, "#dcfce7", "#14532d", seg(f, cu(1, 0.1), cu(1, 0.1) + 8));
          const k = seg(f, cu(1, 0.5), cu(1, 0.5) + 8);
          if (k > 0) {
            c.save(); c.globalAlpha = clamp(k * 3);
            c.fillStyle = "#fff"; rrect(c, 90, 860, 900, 300, 26); c.fill(); c.strokeStyle = "#f59e0b"; c.lineWidth = 6; rrect(c, 90, 860, 900, 300, 26); c.stroke();
            c.font = SERIF(64, 800); c.fillStyle = "#be185d"; c.fillText("HAPPY 60TH NANNA", W / 2, 980);
            c.font = SANS(52, 900); c.fillStyle = GREEN; c.fillText("14 ✓ fits", W / 2, 1090);
            c.restore();
          }
          tag(c, "count it: your fingers, or a character counter", W / 2, 1260, 40, "#0f172a", "#fde68a", seg(f, cu(1, 0.5) + 14, cu(1, 0.5) + 22));
        }
        if (!loopOn && ["chunks", "test", "rule"].includes(b.shot)) {   // render review: 27 s of cards with no family: a face reacts in the corner
          const who: BillWho = b.who === "bindu" ? (b.prop === "count2" || b.prop === "test" ? "harish" : "bindu") : (b.who as BillWho);
          const md: [BillMood, BillArms] = who === "harish" ? (b.prop === "count" ? ["angry", "phone"] : ["shock", "rest"]) : who === "thathayya" ? ["smug", "fold"] : ["smug", "fold"];
          c.save(); c.beginPath(); rrect(c, 40, 1240, 240, 230, 28); c.clip();   // below the cards, above the captions
          c.fillStyle = "#3b2f5c"; c.fillRect(40, 1240, 240, 230);
          person(c, who, [160, 1395], 0.42, md[0], md[1], b.who === who && talking, r);
          c.restore();
          c.strokeStyle = "#fde68a"; c.lineWidth = 6; rrect(c, 40, 1240, 240, 230, 28); c.stroke();
        }
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const CAKE_SCENES = { sk_cake: StCake };
