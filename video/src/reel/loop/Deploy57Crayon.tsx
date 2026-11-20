import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt, ravi, RV } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// EP57 "₹27,400 or ₹28? Deploy Your AI App" (series/scripts/ep57_deploy.md): a Season 6 screen tutorial, one narrator.
// Frame 1 (Bujji's EP55 read: money first): a GPU-server quote against the same bot the cheap way. Then the laptop that
// sleeps, three monthly bars priced on the companies' own pages (Hugging Face, OpenAI; ₹95.25 a dollar), why the cheap
// one is cheap (our test: the model 8,017 MB, the tiny server 22 MB, 235 tokens a chat), the two catches (the key in
// the host's secrets; free hosts sleep), and the loop. Numbers come from the spec (data.t), measured in
// pipeline/ep57/deploy_demo.py.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;

const bg = (c: Ctx, W: number, H: number) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#1e293b");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};
const block = (c: Ctx, x: number, y: number, w: number, h: number, label: string, val: string, sub: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bgc; rrect(c, x, y, w, h, 24); c.fill();
  c.textAlign = "center";
  c.font = SANS(fit(c, label, w - 40, 36, 900), 900); c.fillStyle = "#e2e8f0"; c.fillText(label, x + w / 2, y + 56);
  c.font = SANS(fit(c, val, w - 40, 100, 900), 900); c.fillStyle = fg; c.fillText(val, x + w / 2, y + h / 2 + 40);
  if (sub) { c.font = SANS(fit(c, sub, w - 40, 32, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(sub, x + w / 2, y + h - 26); }
  c.restore();
};
const phoneChat = (c: Ctx, x: number, y: number, w: number, h: number, rows: [string, boolean][], k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#111827"; rrect(c, x, y, w, h, 34); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, x + 14, y + 14, w - 28, h - 28, 26); c.fill();
  c.fillStyle = "#075e54"; rrect(c, x + 14, y + 14, w - 28, 70, 26); c.fill(); c.fillRect(x + 14, y + 60, w - 28, 24);
  c.font = SANS(30, 900); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText("Ravi's shop bot", x + 40, y + 62);
  let yy = y + 120;
  rows.forEach(([t, me]) => {
    c.font = SANS(32, 800); const tw = Math.min(c.measureText(t).width + 40, w - 80);
    const bx = me ? x + w - 40 - tw : x + 40;
    c.fillStyle = me ? "#dcf8c6" : "#fff"; rrect(c, bx, yy, tw, 60, 16); c.fill();
    c.fillStyle = INK; c.fillText(t, bx + 20, yy + 41); yy += 78;
  });
  c.restore();
};
const smallRavi = (c: Ctx, x: number, y: number, sc: number, m: "worried" | "shock" | "hope" | "happy" | "angry", f: number, r: () => number) => {
  c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-RV.x, -RV.y); ravi(c, m, "phone", false, 0.5, f, r); c.restore();
};
const laptop = (c: Ctx, x: number, y: number, w: number, open: number, f: number) => {
  const h = w * 0.62;
  c.save(); c.translate(x, y);
  c.fillStyle = "#94a3b8"; rrect(c, -w / 2 - 30, 0, w + 60, 28, 8); c.fill();   // the base
  c.save(); c.scale(1, Math.max(0.04, open)); c.fillStyle = "#334155"; rrect(c, -w / 2, -h, w, h, 14); c.fill();
  c.fillStyle = open > 0.5 ? "#0f172a" : "#1e293b"; rrect(c, -w / 2 + 16, -h + 16, w - 32, h - 32, 8); c.fill();
  if (open > 0.5) { c.font = SANS(30, 800); c.fillStyle = "#86efac"; c.textAlign = "left"; c.fillText("$ python bot.py", -w / 2 + 40, -h + 70); c.fillStyle = "#e2e8f0"; c.fillText("bot running...", -w / 2 + 40, -h + 120); if (Math.floor(f / 15) % 2) c.fillRect(-w / 2 + 40, -h + 140, 18, 4); }
  c.restore(); c.restore();
};
const rack = (c: Ctx, x: number, y: number, k: number, f: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#0f172a"; rrect(c, x - 130, y - 300, 260, 340, 16); c.fill();
  for (let q = 0; q < 4; q++) {
    c.fillStyle = "#1e293b"; rrect(c, x - 110, y - 280 + q * 76, 220, 60, 8); c.fill();
    c.fillStyle = Math.floor((f + q * 7) / 10) % 2 ? "#22c55e" : "#14532d"; c.beginPath(); c.arc(x + 80, y - 250 + q * 76, 8, 0, 7); c.fill();
  }
  c.font = SANS(34, 900); c.fillStyle = "#86efac"; c.textAlign = "center"; c.fillText("ALWAYS ON", x, y + 90);
  c.restore();
};

const StDeploy: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const T = s.data.t as Record<string, any>;
  const te = !!s.data.handle;
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`, end = l.from + l.frames;
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.55 : 0.5} />, <Sfx key={k("c")} at={2} src={CLAP} vol={0.45} />, <Sfx key={k("ch")} at={cue(i, 1, 0.5) - 8} src="audio/sfx_chaching.wav" vol={0.4} />);
    if (b.prop === "laptop") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("s")} at={cue(i, 1, 0.3) - 4} src="audio/gag_bonk.wav" vol={0.35} />);
    if (b.prop === "bars") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("p" + n)} at={cue(i, n, 0.3) - 6} src={n === 3 ? "audio/sfx_chaching.wav" : "audio/sfx_pop.wav"} vol={n === 3 ? 0.4 : 0.35} />));
    if (b.prop === "why") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.4) - 6} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "catch") sfx.push(<Sfx key={k("p1")} at={cue(i, 1, 0.3) - 6} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("p2")} at={cue(i, 2, 0.3) - 6} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(5757 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        bg(c, W, H);
        c.textAlign = "left";
        const frame1 = (ask: boolean) => {
          block(c, 50, 300, 480, 300, "GPU SERVER QUOTE", T.gpu, "a month", "#7f1d1d", "#fecaca", 1);
          block(c, 550, 300, 480, 300, "OUR TEST", T.zero, T.zeroSub, "#14532d", "#bbf7d0", 1);
          phoneChat(c, 560, 650, 460, 380, [["Toor dal 1 kg entha?", true], ["₹165", false], ["Is curd available?", true], ["Out of stock.", false]], 1);
          smallRavi(c, 270, 900, 0.62, "shock", f, r);
          c.save(); c.translate(250, 1180); c.rotate(-0.08); c.fillStyle = "#fffdf7"; rrect(c, -150, -70, 300, 140, 10); c.fill();
          c.font = SANS(28, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("QUOTE: GPU SERVER", 0, -24); c.font = SANS(40, 900); c.fillStyle = RED; c.fillText(T.gpu + "/mo", 0, 30); c.restore();
          if (ask) chip(c, T.ask, W / 2, 1310, "#fde68a", INK, 1, 52);
        };
        if (P === "hook") frame1(loopOn);
        else if (P === "loop") {   // the catch (the free box sleeps), then back to frame 1 with the question
          const c1 = cu(1, 0.2);
          if (f < c1 - 4) {
            c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("ONE CATCH", W / 2, 330);
            c.fillStyle = "#1e293b"; rrect(c, 70, 420, W - 140, 620, 26); c.fill();
            c.font = SANS(150, 900); c.fillStyle = "#93c5fd"; c.fillText("z z z", W / 2, 680 - (f % 40));
            c.font = SANS(fit(c, T.sleep, W - 200, 42, 800), 800); c.fillStyle = "#e2e8f0"; c.fillText(T.sleep, W / 2, 840);
            c.font = SANS(fit(c, T.wake, W - 200, 36, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(T.wake, W / 2, 920);
          } else frame1(true);
        } else if (P === "laptop") {
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("DEPLOY = ALWAYS ON", W / 2, 330);
          const close = seg(f, cu(1, 0.3), cu(1, 0.3) + 10);
          laptop(c, 330, 900, 420, 1 - close * 0.96, f);
          c.font = SANS(32, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("Suresh's laptop", 330, 980);
          if (close > 0.9) { c.font = SANS(70, 900); c.fillStyle = "#93c5fd"; c.fillText("z z z", 330, 700 - (f % 40)); }
          if (close > 0.5) {   // a customer waits: one grey tick
            c.fillStyle = "#dcf8c6"; rrect(c, 120, 1060, 430, 70, 16); c.fill();
            c.font = SANS(32, 800); c.fillStyle = INK; c.textAlign = "left"; c.fillText("Rice 5 kg price?", 140, 1106);
            c.fillStyle = "#64748b"; c.fillText("✓", 500, 1108);
          }
          rack(c, 820, 900, seg(f, cu(1, 0.75), cu(1, 0.75) + 8), f);
        } else if (P === "bars") {
          c.font = SANS(fit(c, "A MONTH, 24×7", W - 100, 56, 900), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("A MONTH, 24×7", W / 2, 330);
          c.font = SANS(fit(c, T.src, W - 100, 28, 700), 700); c.fillStyle = "#94a3b8"; c.fillText(T.src, W / 2, 380);
          const bars = T.bars as [string, string, string, number, string][];   // [label, sub, value, fraction of the biggest, colour]
          bars.forEach(([lab, sub, val, frac, col], q) => {
            const st = cu(q + 1, 0.3), k = seg(f, st - 4, st + 14);
            if (k <= 0) return;
            const y = 460 + q * 290;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.font = SANS(fit(c, lab, W - 140, 42, 900), 900); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(lab, 70, y);
            c.fillStyle = "#334155"; rrect(c, 70, y + 24, W - 140, 90, 14); c.fill();
            c.fillStyle = col; rrect(c, 70, y + 24, Math.max(16, (W - 140) * frac * easeOut(k)), 90, 14); c.fill();
            c.font = SANS(64, 900); c.fillStyle = "#fff"; c.textAlign = frac > 0.4 ? "right" : "left"; c.fillText(val, frac > 0.4 ? 70 + (W - 140) * frac * easeOut(k) - 20 : 110, y + 92);
            c.font = SANS(fit(c, sub, W - 140, 32, 700), 700); c.fillStyle = "#cbd5e1"; c.textAlign = "left"; c.fillText(sub, 70, y + 160);
            c.restore();
          });
        } else if (P === "pick") {
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("FOR A SHOP", W / 2, 330);
          const card = (x: number, [t, v, sub]: string[], k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#14532d"; rrect(c, x, 400, 450, 420, 26); c.fill();
            c.font = SANS(fit(c, t, 400, 38, 900), 900); c.fillStyle = "#e2e8f0"; c.textAlign = "center"; c.fillText(t, x + 225, 470);
            c.font = SANS(fit(c, v, 400, 110, 900), 900); c.fillStyle = "#bbf7d0"; c.fillText(v, x + 225, 640);
            c.font = SANS(28, 800); c.fillStyle = "#dcfce7"; wrap(c, sub, 400).forEach((l, q) => c.fillText(l, x + 225, 720 + q * 36)); c.restore();
          };
          card(60, T.pickA, seg(f, ln.from, ln.from + 8));
          card(570, T.pickB, seg(f, ln.from + 18, ln.from + 26));
          const kb = seg(f, cu(1, 0.3) - 4, cu(1, 0.3) + 4);
          if (kb > 0) { c.save(); c.globalAlpha = clamp(kb * 3); c.fillStyle = "#7f1d1d"; rrect(c, 60, 880, W - 120, 200, 24); c.fill();
            c.font = SANS(40, 900); c.fillStyle = "#fecaca"; c.textAlign = "center"; c.fillText("GPU?", W / 2, 950);
            c.font = SANS(fit(c, T.breakeven, W - 180, 44, 900), 900); c.fillStyle = "#fff"; c.fillText(T.breakeven, W / 2, 1030); c.restore(); }
        } else if (P === "steps") {
          c.font = SANS(56, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("3 STEPS", W / 2, 330);
          (T.steps as [string, string][]).forEach(([a, sub], q) => {
            const st = cu(q + 1, 0.3), k = seg(f, st - 6, st + 4);
            if (k <= 0) return;
            const y = 400 + q * 250;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate((1 - easeOut(clamp(k * 1.5))) * 200, 0);
            c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 220, 22); c.fill();
            c.font = SANS(80, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(`${q + 1}`, 100, y + 130);
            c.font = SANS(fit(c, a, W - 300, 54, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(a, 190, y + 90);
            c.fillStyle = "#0f172a"; rrect(c, 190, y + 120, W - 320, 70, 12); c.fill();
            c.font = SANS(fit(c, sub, W - 360, 32, 700), 700); c.fillStyle = "#86efac"; c.fillText(sub, 210, y + 166); c.restore();
          });
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const DEPLOY57_SCENES = { sk_deploy57: StDeploy };
