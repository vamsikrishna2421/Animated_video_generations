import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillMood, BillArms, BillWho } from "./BillCrayon";

// EP46 "Copyright & AI" (series/scripts/ep46_copyright.md): a college poster contest. Meena drew hers in 40 hours and came
// 2nd (₹0); Rohit's AI poster took 40 seconds and won ₹10,000. Who wins is the contest's rule; who owns it is the law's.
// The US: an AI picture won a digital-art prize at the 2022 Colorado State Fair (624 prompts) and was refused registration
// because he claimed the AI-made parts too; the AI's part has no owner, your own parts can be owned (US Copyright Office,
// Jan 2025). India: the 1957 Act names "the person who causes the work to be created", untested on today's AI; DPIIT
// proposes royalties for training (Dec 2025, a proposal). The rule: say you used it, add your own drawing, keep drafts as
// proof. The loop: an AI-only prize, "I'm the only entry: I win again!", and the notice gives Meena hers -> frame 1.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "meena" | "rohit" | "kumar"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 30;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#15803d";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MOOD: Record<number, Partial<Record<BillWho, [BillMood, BillArms]>>> = {
  1: { meena: ["shock", "up"], rohit: ["smug", "fold"], kumar: ["deadpan", "rest"] },
  2: { meena: ["angry", "fold"], rohit: ["excited", "up"], kumar: ["deadpan", "rest"] },
  3: { meena: ["worried", "rest"], rohit: ["smug", "fold"], kumar: ["calm", "shrug"] },
  4: { meena: ["angry", "fold"], rohit: ["excited", "up"], kumar: ["deadpan", "rest"] },
  6: { meena: ["smug", "fold"], rohit: ["shock", "up"], kumar: ["calm", "rest"] },
  8: { meena: ["worried", "rest"], rohit: ["worried", "rest"], kumar: ["calm", "rest"] },
  11: { meena: ["deadpan", "fold"], rohit: ["worried", "shrug"], kumar: ["calm", "rest"] },
  12: { meena: ["happy", "rest"], rohit: ["calm", "rest"], kumar: ["calm", "up"] },
  13: { meena: ["happy", "up"], rohit: ["worried", "rest"], kumar: ["happy", "rest"] },
  14: { meena: ["deadpan", "fold"], rohit: ["excited", "up"], kumar: ["smug", "fold"] },
};
const SPOT: Record<string, [number, number, number]> = { meena: [200, 1230, 0.6], kumar: [540, 1170, 0.64], rohit: [880, 1230, 0.6] };

// ---------- pieces ----------
const corridor = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#e0e7ff"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#c7d2fe"; c.fillRect(0, 1120, W, H - 1120);
  c.fillStyle = "#8b5a2b"; rrect(c, 40, 190, W - 80, 760, 16); c.fill();   // the notice board
  c.fillStyle = "#d6b38a"; rrect(c, 56, 206, W - 112, 728, 10); c.fill();
};
const results = (c: Ctx, W: number, k: number, final = false) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, 78, 238, W - 148, 680, 14); c.fill();
  c.fillStyle = "#fffdf5"; rrect(c, 70, 230, W - 140, 680, 14); c.fill();
  c.font = SANS(40, 900); c.fillStyle = "#1e3a8a"; c.textAlign = "center"; c.fillText(final ? "NOTICE · NEW RULE" : "FEST POSTER CONTEST · RESULTS", W / 2, 300);
  if (!final) {
    const row = (y: number, place: string, who: string, big: string, how: string, prize: string, col: string) => {
      c.fillStyle = col === RED ? "#fee2e2" : "#dcfce7"; rrect(c, 100, y, W - 200, 270, 18); c.fill();
      c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = INK; c.fillText(`${place}  ${who}`, 130, y + 56);
      c.textAlign = "right"; c.font = SANS(64, 900); c.fillStyle = col; c.fillText(prize, W - 130, y + 66);   // the prize on the name line (stills: it ran into "40 SECONDS")
      c.textAlign = "left"; c.font = SANS(110, 900); c.fillStyle = col; c.fillText(big, 130, y + 180);   // script review: HOURS / SECONDS biggest
      c.font = SANS(50, 900); c.fillStyle = INK; c.fillText(how, 130, y + 240);   // render review: which one is AI? say it big
    };
    row(335, "1st", "ROHIT", "40 SECONDS", "MADE WITH AI", "₹10,000", GREEN);
    row(625, "2nd", "MEENA", "40 HOURS", "DRAWN BY HAND", "₹0", RED);
  } else {
    c.textAlign = "left";
    c.fillStyle = "#e0e7ff"; rrect(c, 100, 360, W - 200, 230, 18); c.fill();
    c.font = SANS(44, 900); c.fillStyle = "#1e3a8a"; c.fillText("AI POSTERS: A SEPARATE PRIZE", 130, 430);
    c.font = SANS(36, 800); c.fillStyle = "#334155"; c.fillText("entries so far: 1 (Rohit)", 130, 500);
    c.fillStyle = "#dcfce7"; rrect(c, 100, 630, W - 200, 230, 18); c.fill();
    c.font = SANS(44, 900); c.fillStyle = GREEN; c.fillText("HAND-DRAWN, 1st: MEENA", 130, 710);   // script review: give Meena her ending
    c.font = SANS(84, 900); c.fillText("₹10,000", 130, 810);
  }
  c.restore();
};
// a one-line card over the board (the people stay visible below)
const fact = (c: Ctx, W: number, head: string, lines: string[], src: string, k: number, bg = "#0f172a") => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  const h = 150 + lines.length * 74 + (src ? 50 : 0);
  c.fillStyle = bg; rrect(c, 50, 220, W - 100, h, 26); c.fill();
  c.font = SANS(44, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(head, W / 2, 296);
  lines.forEach((t, q) => { let fs = 54; c.font = SANS(fs, 900); while (c.measureText(t).width > W - 160 && fs > 32) { fs -= 2; c.font = SANS(fs, 900); } c.fillStyle = "#f8fafc"; c.fillText(t, W / 2, 380 + q * 74); });
  if (src) { c.font = SANS(28, 700); c.fillStyle = "#cbd5e1"; c.fillText(src, W / 2, 220 + h - 34); }
  c.restore();
};

// ---------- the scene ----------
const StPoster: React.FC<SP> = ({ s }) => {
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
    const prevCard = i > 0 && beats[i - 1].shot === "card";
    if (b.shot === "card" && !prevCard) sfx.push(<Sfx key={k("w")} at={at - 11} src="audio/sfx_whoosh.wav" vol={0.3} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("z")} at={0} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("a")} at={2} src="reel/sfx_boom.wav" vol={1.0} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.4} />,
      <Sfx key={k("n")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={te ? 0.35 : 0.45} />);
    if (b.prop === "rules") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.3) - 10} src="audio/gag_ding.wav" vol={0.2} />);
    if (b.prop === "allen") sfx.push(<Sfx key={k("n")} at={cue(i, 1, 0.5)} src="reel/sfx_boom.wav" vol={te ? 0.7 : 0.9} />, <Sfx key={k("z")} at={cue(i, 1, 0.5) + 2} src="reel/sfx_buzz.wav" vol={0.2} />);
    if (b.prop === "india" && b.shot === "card") sfx.push(<Sfx key={k("d")} at={at + 4} src="audio/gag_ding.wav" vol={0.18} />);
    if (b.prop === "rule") sfx.push(<Sfx key={k("r")} at={Math.max(0, at - 28)} src="reel/sfx_riser.wav" vol={0.2} />, <Sfx key={k("h")} at={Math.max(0, at - 6)} src="reel/sfx_boom.wav" vol={te ? 0.3 : 0.45} />, <Sfx key={k("a")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.35} />);
    if (b.prop === "notice") sfx.push(<Sfx key={k("h")} at={Math.max(0, at - 4)} src="reel/sfx_boom.wav" vol={te ? 0.6 : 0.75} />, <Sfx key={k("s")} at={cue(i, 1, 0.5)} src="audio/sfx_success.wav" vol={0.4} />, <Sfx key={k("c")} at={cue(i, 1, 0.5)} src={CLAP} vol={0.4} />);   // render review: Meena's win heard
    if (b.prop === "loop") {
      const slam = end + HOLD;
      sfx.push(<Sfx key={k("q")} at={Math.max(0, at - 30)} src="reel/sfx_riser.wav" vol={te ? 0.25 : 0.35} />, <Sfx key={k("d")} at={cue(i, 1, 0.5)} src="audio/sfx_success.wav" vol={0.3} />,
        <Sfx key={k("g")} at={slam - 8} src="reel/sfx_glitch.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />,
        <Sfx key={k("c")} at={slam} src={CLAP} vol={0.55} />, <Sfx key={k("z")} at={slam} src="reel/sfx_buzz.wav" vol={0.35} />);
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
        const r = rng(4646 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to) && Math.floor(f / 3) % 2 === 0;
        const endL = ln.from + ln.frames;
        const slam = endL + HOLD, loopOn = b.prop === "loop" && f >= slam;
        const shake = (b.prop === "hook" && p < 0.1) || (loopOn && f < slam + 10) ? 9 : 0;
        const sx = shake ? (r() - 0.5) * shake : 0, sy = shake ? (r() - 0.5) * shake : 0;
        c.save(); c.translate(sx, sy);
        corridor(c, W, H);
        (["meena", "kumar", "rohit"] as BillWho[]).forEach((who) => {
          const [x, y, sc] = SPOT[who];
          const md = (loopOn ? MOOD[1] : MOOD[n] ?? MOOD[8])[who] ?? ["calm", "rest"];
          person(c, who, [x, y], sc, md[0], md[1], b.who === who && talking && !loopOn, r);
        });
        c.restore();
        const hookOn = b.prop === "hook" || loopOn;
        if (hookOn || ["who", "mine", "copy", "cant"].includes(b.prop) || (b.prop === "india" && b.shot === "wide")) results(c, W, 1);   // render review: blank boards at 0:35 and 0:47
        if (b.prop === "rules") {
          results(c, W, 1);
          c.save(); c.translate(W / 2, 760); c.rotate(-0.03); c.globalAlpha = seg(p, 0.1, 0.25);
          c.fillStyle = "#fef3c7"; rrect(c, -380, -110, 760, 220, 16); c.fill();
          c.font = SANS(34, 800); c.fillStyle = "#7c2d12"; c.textAlign = "center"; c.fillText("CONTEST RULES, point 3:", 0, -40);
          c.font = SANS(56, 900); c.fillStyle = INK; c.fillText("\"Entries must be original.\"", 0, 40); c.restore();
        }
        if (b.prop === "who") {   // contest rules vs the law
          c.save(); c.globalAlpha = seg(p, 0.05, 0.2); c.fillStyle = "rgba(15,23,42,0.92)"; rrect(c, 70, 560, W - 140, 330, 22); c.fill();
          c.font = SANS(48, 900); c.textAlign = "left"; c.fillStyle = "#fde68a"; c.fillText("WHO WINS:", 110, 650); c.fillStyle = "#f8fafc"; c.fillText("the contest's rules", 140 + c.measureText("WHO WINS:").width, 650);
          c.globalAlpha = seg(f, cu(1, 0.4), cu(1, 0.4) + 8); c.fillStyle = "#fde68a"; c.fillText("WHO OWNS IT:", 110, 760); c.fillStyle = "#f8fafc"; c.fillText("the law", 140 + c.measureText("WHO OWNS IT:").width, 760);
          c.restore();
        }
        if (b.prop === "allen") fact(c, W, "A REAL CASE (USA)", ["an AI picture won a digital-art contest", "2022 Colorado State Fair · 624 prompts"], "", seg(f, ln.from, ln.from + 8));
        if (b.prop === "allen") { const k2 = seg(f, cu(1, 0.4), cu(1, 0.4) + 8); if (k2 > 0) { c.save(); c.globalAlpha = clamp(k2 * 3); c.translate(W / 2, 640); c.rotate(-0.05); c.strokeStyle = RED; c.lineWidth = 9; rrect(c, -440, -64, 880, 128, 16); c.stroke(); c.font = SANS(52, 900); c.fillStyle = RED; c.textAlign = "center"; c.fillText("COPYRIGHT: REFUSED", 0, -2); c.font = SANS(30, 800); c.fillText("he claimed the AI-made parts too", 0, 44); c.restore(); } }
        if (b.prop === "us") fact(c, W, "USA: WHO OWNS IT?", ["typing prompts: not yours", "the parts you made: yours"], "US Copyright Office, Jan 2025: \"prompts alone\" are not authorship", seg(f, ln.from, ln.from + 8));
        if (b.prop === "india" && b.shot === "card") fact(c, W, "INDIA: COPYRIGHT ACT, 1957", ["\"the person who causes", "the work to be created\"", "untested on today's AI"], "Sec 2(d)(vi) · the government's paper on AI outputs: not out yet", seg(f, ln.from, ln.from + 8));
        if (b.prop === "learned") fact(c, W, "A GOVERNMENT PANEL PROPOSES (Dec 2025)", ["AI companies pay artists", "for training on their work", "A PROPOSAL, NOT LAW YET"], "DPIIT committee, India", seg(f, ln.from, ln.from + 8), "#1e293b");   // render review: "proposal" big
        if (b.prop === "rule") {
          const k0 = seg(p, 0.0, 0.08), t1 = cu(1, 0.4);
          c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = "rgba(15,23,42,0.95)"; rrect(c, 50, 210, W - 100, 720, 30); c.fill();
          c.font = SANS(52, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("AI IN YOUR WORK", W / 2, 290); c.restore();
          ([["1  SAY YOU USED IT", ln.from + 2, "#e0e7ff", "#1e3a8a"], ["2  ADD YOUR OWN DRAWING", t1 - 2, "#dcfce7", "#14532d"], ["3  KEEP DRAFTS AS PROOF", t1 + 14, "#fef3c7", INK]] as [string, number, string, string][]).forEach(([a, t0, bg, fg], q) => {
            const k = seg(f, t0, t0 + 8); if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); const y = 340 + q * 190;
            c.fillStyle = bg; rrect(c, 100, y, W - 200, 160, 22); c.fill();
            let fs = 58; c.font = SANS(fs, 900); while (c.measureText(a).width > W - 280 && fs > 36) { fs -= 2; c.font = SANS(fs, 900); }
            c.fillStyle = fg; c.textAlign = "left"; c.fillText(a, 140, y + 102); c.restore();
          });
        }
        if (b.prop === "notice") results(c, W, seg(p, 0.0, 0.1), true);
        if (b.prop === "loop" && !loopOn) results(c, W, 1, true);
        if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, slam, slam + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
      }} />
    </>
  );
};

export const POSTER_SCENES = { sk_poster: StPoster };
