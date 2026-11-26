import React from "react";
import { Ctx, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// HOW TO 06 "A free AI on your laptop, Wi-Fi off" (series/scripts/howto06_free_llm_laptop.md): one narrator, Chintu's
// laptop on Ravi anna's counter. Every command, output and number is copied from our run (series/scripts/howto06_demo):
// llama.cpp (MIT) built at 9c003a9, Qwen2.5-1.5B-Instruct Q4_K_M (1.12 GB, Apache 2.0), 4 CPU cores and no graphics card:
// first start 42 s, then 3 s; ~17 tokens a second; peak RAM 2.8 GB (2.1 GB with -c 4096); the leave letter and 23 x 47
// right, its Telugu nonsense; --offline for no internet. The clash: a paid AI app at ₹1,999 a month (India) vs ₹0.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const RED = "#dc2626", GREEN = "#16a34a", AMBER = "#d97706", BLUE = "#2563eb";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
const MONO = (s: number, w = 400) => `${w} ${s}px 'DejaVu Sans Mono', 'Liberation Mono', monospace`;
const TEL = (s: number) => `600 ${s}px "Noto Sans Telugu", "Lohit Telugu", sans-serif`;

// Ravi anna's shop: a warm wall, shelves, the counter
const shop = (c: Ctx, W: number, H: number) => {
  c.fillStyle = "#fde8c8"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#c2884d"; for (let q = 0; q < 3; q++) c.fillRect(40, 300 + q * 150, W - 80, 14);
  const cols = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  for (let q = 0; q < 3; q++) for (let z = 0; z < 9; z++) { c.fillStyle = cols[(q * 3 + z) % 6]; c.globalAlpha = 0.45; rrect(c, 60 + z * 110, 220 + q * 150, 70, 80, 8); c.fill(); }
  c.globalAlpha = 1;
  c.fillStyle = "#8b5a2b"; c.fillRect(0, 1180, W, H - 1180); c.fillStyle = "#a16a35"; c.fillRect(0, 1180, W, 30);
};
const wifiOff = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.strokeStyle = "#475569"; c.lineWidth = s * 0.09; c.lineCap = "round";
  [0.9, 0.6, 0.3].forEach((r) => { c.beginPath(); c.arc(0, 0, s * r, Math.PI * 1.25, Math.PI * 1.75); c.stroke(); });
  c.beginPath(); c.arc(0, -s * 0.02, s * 0.07, 0, 7); c.fillStyle = "#475569"; c.fill();
  c.strokeStyle = RED; c.lineWidth = s * 0.12; c.beginPath(); c.moveTo(-s * 0.75, -s * 0.95); c.lineTo(s * 0.75, s * 0.15); c.stroke();
  c.restore();
};
// the laptop; draws its screen rect and returns it
const laptop = (c: Ctx, x: number, y: number, w: number, h: number) => {
  c.fillStyle = "#1f2937"; rrect(c, x, y, w, h, 24); c.fill();
  c.fillStyle = "#374151"; c.beginPath(); c.moveTo(x - 60, y + h + 40); c.lineTo(x + w + 60, y + h + 40); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
  return { x: x + 22, y: y + 22, w: w - 44, h: h - 44 };
};
// a terminal: rows of [text, colour]
const term = (c: Ctx, r: { x: number; y: number; w: number; h: number }, title: string, rows: [string, string][], size = 30, k = 1) => {
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#0b1220"; rrect(c, r.x, r.y, r.w, r.h, 16); c.fill();
  c.fillStyle = "#1e293b"; rrect(c, r.x, r.y, r.w, 54, 16); c.fill(); c.fillRect(r.x, r.y + 30, r.w, 24);
  ["#ef4444", "#f59e0b", "#22c55e"].forEach((col, q) => { c.beginPath(); c.arc(r.x + 30 + q * 30, r.y + 27, 9, 0, 7); c.fillStyle = col; c.fill(); });
  c.font = SANS(24, 700); c.fillStyle = "#94a3b8"; c.textAlign = "left"; c.fillText(title, r.x + 130, r.y + 36);
  c.font = MONO(size); let y = r.y + 54 + size * 1.4;
  const cols = Math.floor((r.w - 40) / (size * 0.6));
  rows.forEach(([t, col]) => {
    const parts: string[] = []; let s = t; while (s.length > cols) { parts.push(s.slice(0, cols)); s = s.slice(cols); } parts.push(s);
    parts.forEach((pp) => { if (y > r.y + r.h - 10) return; c.fillStyle = col; c.fillText(pp, r.x + 20, y); y += size * 1.35; });
  });
  c.restore();
};
const block = (c: Ctx, x: number, y: number, w: number, small: string, big: string, col: string, bg: string, k = 1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(0,0,0,0.25)"; rrect(c, x + 6, y + 8, w, 200, 22); c.fill();
  c.fillStyle = bg; rrect(c, x, y, w, 200, 22); c.fill();
  c.textAlign = "center"; c.font = SANS(fit(c, small, w - 40, 34, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(small, x + w / 2, y + 56);
  c.font = SANS(fit(c, big, w - 40, 76, 900), 900); c.fillStyle = col; c.fillText(big, x + w / 2, y + 150);
  c.restore();
};
const stepTag = (c: Ctx, t: string, k: number) => { chip(c, t, 200, 200, "#0f172a", "#fde68a", k, 44); };
const card = (c: Ctx, x: number, y: number, w: number, h: number, bg: string, k: number) => {
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 40);
  c.fillStyle = "rgba(0,0,0,0.2)"; rrect(c, x + 6, y + 8, w, h, 22); c.fill(); c.fillStyle = bg; rrect(c, x, y, w, h, 22); c.fill();
};
// the browser chat page of `llama serve` (from our screenshot, ui_answer.png)
const browser = (c: Ctx, r: { x: number; y: number; w: number; h: number }, T: Record<string, any>, k: number) => {
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#fafafa"; rrect(c, r.x, r.y, r.w, r.h, 16); c.fill();
  c.fillStyle = "#e5e7eb"; rrect(c, r.x, r.y, r.w, 56, 16); c.fill(); c.fillRect(r.x, r.y + 30, r.w, 26);
  c.fillStyle = "#fff"; rrect(c, r.x + 70, r.y + 12, r.w - 100, 34, 17); c.fill();
  c.font = SANS(22, 600); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(T.url, r.x + 88, r.y + 36);
  c.fillStyle = "#f1f5f9"; rrect(c, r.x + r.w * 0.3, r.y + 80, r.w * 0.66, 92, 18); c.fill();
  c.font = SANS(24, 500); c.fillStyle = INK; wrap(c, T.question, r.w * 0.62).slice(0, 3).forEach((t, q) => c.fillText(t, r.x + r.w * 0.32, r.y + 116 + q * 30));
  c.font = SANS(26, 500); c.fillStyle = "#111827"; (T.webReply as string[]).forEach((t, q) => c.fillText(t, r.x + 30, r.y + 230 + q * 40));
  c.font = MONO(22, 600); c.fillStyle = "#64748b"; c.fillText(T.webStats, r.x + 30, r.y + 230 + (T.webReply as string[]).length * 40 + 24);
  c.restore();
};

const StLlm: React.FC<SP> = ({ s }) => {
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
    if (i > 0 && beats[i - 1].prop !== b.prop && b.prop !== "loop") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("c")} at={1} src="audio/sfx_chaching.wav" vol={0.5} />, <Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={0.8} />, <Sfx key={k("o")} at={cue(i, 1, 0.4)} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "result") sfx.push(<Sfx key={k("d")} at={at + 6} src="audio/sfx_chime.wav" vol={0.3} />);
    if (["install", "model", "chat"].includes(b.prop)) [0, 4, 8, 12, 16, 20, 24, 28].forEach((d2) => sfx.push(<Sfx key={k("t" + d2)} at={at + 6 + d2} src="audio/sfx_tick.wav" vol={0.16} />));
    if (b.prop === "model") sfx.push(<Sfx key={k("dl")} at={cue(i, 1, 0.2)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("ok")} at={cue(i, 1, 0.6)} src="audio/sfx_success.wav" vol={0.25} />);
    if (b.prop === "chat") sfx.push(<Sfx key={k("d")} at={cue(i, 1, 0.1)} src="audio/sfx_chime.wav" vol={0.25} />);
    if (b.prop === "honest") sfx.push(<Sfx key={k("p1")} at={at + 6} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("p2")} at={at + 16} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("x")} at={cue(i, 1, 0.3)} src="reel/sfx_buzz.wav" vol={0.32} />);
    if (b.prop === "needs") sfx.push(<Sfx key={k("p")} at={at + 4} src="audio/sfx_pop.wav" vol={0.25} />, <Sfx key={k("t")} at={cue(i, 1, 0.3)} src="audio/sfx_tick.wav" vol={0.25} />);
    if (b.prop === "save") sfx.push(<Sfx key={k("h")} at={at + 2} src="reel/sfx_boom.wav" vol={te ? 0.45 : 0.55} />, <Sfx key={k("ok")} at={cue(i, 1, 0.3)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.85} />, <Sfx key={k("c")} at={slam} src="audio/sfx_chaching.wav" vol={0.45} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        shop(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          const r = laptop(c, 170, 560, 740, 470);
          c.fillStyle = "#f8fafc"; rrect(c, r.x, r.y, r.w, r.h, 10); c.fill();
          c.font = SANS(24, 800); c.fillStyle = "#64748b"; c.fillText(T.lapTitle, r.x + 24, r.y + 40);
          c.fillStyle = INK;
          (T.letter as string[]).forEach((t, q) => { c.font = SANS(fit(c, t, r.w - 48, 30, 600), 600); c.fillText(t, r.x + 24, r.y + 100 + q * 46); });
          wifiOff(c, 840, 640, 56);
          block(c, 40, 210, 490, T.leftLab, T.leftVal, "#fecaca", "#7f1d1d");
          block(c, 550, 210, 490, T.rightLab, T.rightVal, "#bbf7d0", "#14532d");
          chip(c, T.tag, W / 2, 1110, "#0f172a", "#fde68a", 1, 40);
        } else if (P === "result") {
          const r = laptop(c, 90, 330, 900, 640);
          c.fillStyle = "#f8fafc"; rrect(c, r.x, r.y, r.w, r.h, 10); c.fill();
          c.font = SANS(28, 800); c.fillStyle = "#64748b"; c.fillText(T.lapTitle, r.x + 30, r.y + 50);
          (T.letter as string[]).forEach((t, q) => { c.font = SANS(fit(c, t, r.w - 60, 40, 600), 600); c.fillStyle = INK; c.fillText(t, r.x + 30, r.y + 130 + q * 62); });
          c.font = MONO(30, 700); c.fillStyle = GREEN; c.fillText(T.letterStats, r.x + 30, r.y + r.h - 40);
          wifiOff(c, 900, 420, 46);
          chip(c, T.noNet, W / 2, 1110, "#14532d", "#f0fdf4", seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 6), 44);
        } else if (P === "install") {
          stepTag(c, T.step1, seg(f, ln.from, ln.from + 6));
          term(c, { x: 50, y: 300, w: 980, h: 520 }, T.termTitle, T.installRows, 30, seg(f, ln.from + 2, ln.from + 8));
          const k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          if (k1 > 0) { card(c, 80, 860, 920, 220, "#fffdf5", k1); c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = INK; c.fillText(T.installHead, 110, 930);
            c.font = SANS(fit(c, T.installSub, 860, 32, 700), 700); c.fillStyle = "#475569"; c.fillText(T.installSub, 110, 990);
            c.font = SANS(fit(c, T.installNote, 860, 28, 700), 700); c.fillStyle = "#92400e"; c.fillText(T.installNote, 110, 1040); c.restore(); }
        } else if (P === "model") {
          stepTag(c, T.step2, seg(f, ln.from, ln.from + 6));
          const kT = seg(f, ln.from + 2, ln.from + 8);
          const n = Math.round((T.modelRows as [string, string][]).length * clamp((f - ln.from) / 30));
          term(c, { x: 50, y: 300, w: 980, h: 420 }, T.termTitle, (T.modelRows as [string, string][]).slice(0, Math.max(1, n)), 30, kT);
          const kD = clamp((f - cu(1, 0.1)) / 40);
          if (f >= cu(1, 0.1) - 2) {
            c.fillStyle = "#e2e8f0"; rrect(c, 100, 760, 880, 50, 25); c.fill(); c.fillStyle = BLUE; rrect(c, 100, 760, Math.max(50, 880 * kD), 50, 25); c.fill();
            c.textAlign = "center"; c.font = SANS(34, 900); c.fillStyle = INK; c.fillText(`${(1.12 * kD).toFixed(2)} GB / 1.12 GB`, 540, 860);
          }
          const kS = seg(f, cu(1, 0.6) - 2, cu(1, 0.6) + 8);
          if (kS > 0) { block(c, 60, 920, 470, T.first, T.firstVal, "#fde68a", "#1e293b", kS); block(c, 550, 920, 470, T.after, T.afterVal, "#bbf7d0", "#14532d", kS); }
          chip(c, T.modelLic, W / 2, 1165, "#334155", "#f8fafc", seg(f, cu(1, 0.6), cu(1, 0.6) + 8), 30);
        } else if (P === "chat") {
          stepTag(c, T.step3, seg(f, ln.from, ln.from + 6));
          term(c, { x: 40, y: 290, w: 1000, h: 470 }, T.cliTitle, T.cliRows, 26, seg(f, ln.from + 2, ln.from + 8));
          browser(c, { x: 140, y: 690, w: 900, h: 420 }, T, seg(f, cu(1, 0.1) - 6, cu(1, 0.1) + 4));
          chip(c, T.speed, W / 2, 1160, "#0f172a", "#bbf7d0", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), fit(c, T.speed, 940, 40, 900));
        } else if (P === "honest") {
          const rows = T.tiles as [string, string, boolean][];
          rows.forEach(([head, sub, ok], q) => {
            const t0 = q < 2 ? ln.from + 4 + q * 10 : cu(1, 0.2);
            const k = seg(f, t0 - 2, t0 + 8); if (k <= 0) return;
            const y = 300 + q * 270;
            card(c, 70, y, 940, 240, ok ? "#f0fdf4" : "#fef2f2", k);
            c.textAlign = "left"; c.font = SANS(fit(c, head, 760, 54, 900), 900); c.fillStyle = ok ? "#14532d" : "#7f1d1d"; c.fillText(head, 110, y + 80);
            c.font = q === 2 ? TEL(fit(c, sub, 760, 34, 600)) : SANS(fit(c, sub, 760, 32, 600), 600); c.fillStyle = "#334155"; c.fillText(sub, 110, y + 150);
            if (q === 2) { c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); c.moveTo(100, y + 140); c.lineTo(110 + Math.min(780, c.measureText(sub).width + 20), y + 140); c.stroke();
              c.font = SANS(30, 700); c.fillStyle = "#7f1d1d"; c.fillText(T.teluguNote, 110, y + 205); }
            c.textAlign = "right"; c.font = SANS(110, 900); c.fillStyle = ok ? GREEN : RED; c.fillText(ok ? "✓" : "✗", 980, y + 150);
            c.restore();
          });
        } else if (P === "needs") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          if (k0 > 0) { card(c, 70, 300, 940, 420, "#fffdf5", k0); c.textAlign = "left";
            (T.needRows as [string, string][]).forEach(([a, bb], q) => { c.font = SANS(44, 900); c.fillStyle = "#92400e"; c.fillText(a, 110, 390 + q * 110); c.font = SANS(fit(c, bb, 640, 44, 800), 800); c.fillStyle = INK; c.fillText(bb, 330, 390 + q * 110); });
            c.restore(); }
          if (k1 > 0) { const typed = (T.offlineCmd as string).slice(0, Math.round((T.offlineCmd as string).length * clamp((f - cu(1, 0.1)) / 30)));
            term(c, { x: 50, y: 780, w: 980, h: 300 }, T.termTitle, [["$ " + typed, "#e2e8f0"], [f > cu(1, 0.1) + 34 ? T.offlineNote : "", "#86efac"]], 30, k1); }
        } else if (P === "save") {
          const k0 = seg(f, ln.from + 2, ln.from + 10), k1 = seg(f, cu(1, 0.1) - 2, cu(1, 0.1) + 8);
          if (k0 > 0) { card(c, 50, 270, 980, 600, "#0b1220", k0); c.textAlign = "left"; c.font = SANS(44, 900); c.fillStyle = "#fde68a"; c.fillText(T.saveHead, 90, 340);
            (T.saveRows as [string, string][]).forEach(([lab, cmd], q) => { c.font = SANS(fit(c, lab, 900, 30, 800), 800); c.fillStyle = "#94a3b8"; c.fillText(lab, 90, 410 + q * 112);
              let fs = 30; c.font = MONO(fs, 700); while (c.measureText(cmd).width > 900 && fs > 18) { fs -= 1; c.font = MONO(fs, 700); }
              c.fillStyle = "#e2e8f0"; c.fillText(cmd, 90, 452 + q * 112); });
            c.restore(); }
          if (k1 > 0) { card(c, 70, 890, 940, 250, "#dcfce7", k1); c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#14532d";
            wrap(c, T.share, 860).slice(0, 3).forEach((t, q) => c.fillText(t, 540, 980 + q * 66)); c.restore(); }
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const LLM06_SCENES = { sk_llm06: StLlm };
