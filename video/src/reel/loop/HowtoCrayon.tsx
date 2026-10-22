import React from "react";
import { Ctx, rng, stroke, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK, caveat } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { headline, bubble } from "./OwnCrayon";

// HOW TO 01 (series/scripts/howto01_local_tts.md): Chintu's laptop on Ravi anna's counter talks with the Wi-Fi off; the
// shop AI walks Ravi through it. Every screen is copied from our real run (series/scripts/howto01_demo): Kokoro 0.9.4
// (1.4 s to make 4.0 s of English, 1.2 GB, a 313 MB download) and Indic Parler-TTS (28 s for 5.1 s of Telugu, 4.6 GB,
// 3.75 GB). One beat per line (s.data.beats); visuals key on the beat's prop, so lines can move.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai" | "laptop"; shot: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 },
};
const POSE: Record<string, [Mood, Arms]> = {
  hook: ["shock", "rest"], who: ["shock", "point"], nobody: ["confused", "rest"], pay: ["angry", "fist"], type: ["panic", "up"],
  then: ["confused", "shrug"], after: ["sus", "fold"], telugu: ["yell", "point"], tedemo: ["happy", "rest"], howlong: ["happy", "up"],
  save: ["happy", "thumb"],
};
const GREEN = "#16a34a", BLUE = "#2563eb", PURPLE = "#7c3aed", ORANGE = "#ea580c";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, sans-serif`;
const MONO = (s: number, w = 400) => `${w} ${s}px 'DejaVu Sans Mono', 'Liberation Mono', monospace`;
const TELUGU = (s: number) => `${s}px 'Lohit Telugu', sans-serif`;
const LAP = { x: 560, y: 1000 };   // Chintu's laptop on the counter

// ---------- pieces ----------
// a voice waveform: bars that move while `on`
const wave = (c: Ctx, x: number, y: number, w: number, h: number, f: number, on: boolean, col: string) => {
  const n = 28;
  for (let q = 0; q < n; q++) {
    const a = on ? 0.25 + 0.75 * Math.abs(Math.sin(f * 0.55 + q * 1.7) * Math.sin(f * 0.21 + q * 0.6)) : 0.08;
    const bh = h * a, bx = x - w / 2 + (q + 0.5) * (w / n);
    c.fillStyle = col; rrect(c, bx - w / n * 0.3, y - bh / 2, w / n * 0.6, bh, 4); c.fill();
  }
};
// a Wi-Fi icon struck through
const wifiOff = (c: Ctx, x: number, y: number, s: number) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#fee2e2"; c.beginPath(); c.arc(0, 0, 56, 0, 7); c.fill();
  c.strokeStyle = "#64748b"; c.lineWidth = 7; c.lineCap = "round";
  [36, 24, 12].forEach((rr) => { c.beginPath(); c.arc(0, 18, rr, -Math.PI * 0.78, -Math.PI * 0.22); c.stroke(); });
  c.fillStyle = "#64748b"; c.beginPath(); c.arc(0, 18, 5, 0, 7); c.fill();
  c.strokeStyle = "#dc2626"; c.lineWidth = 9; c.beginPath(); c.moveTo(-34, -30); c.lineTo(34, 38); c.stroke();
  c.restore();
};
// Chintu's laptop on the counter (world coordinates); the screen shows the waveform while it talks
const laptop = (c: Ctx, f: number, talk: boolean, te: boolean) => {
  c.save(); c.translate(LAP.x, LAP.y);
  c.fillStyle = "#94a3b8"; c.beginPath(); c.moveTo(-190, -8); c.lineTo(190, -8); c.lineTo(214, 18); c.lineTo(-214, 18); c.closePath(); c.fill();
  c.fillStyle = "#475569"; rrect(c, -180, -236, 360, 228, 14); c.fill();
  c.fillStyle = "#0f172a"; rrect(c, -166, -222, 332, 200, 8); c.fill();
  c.font = MONO(20); c.fillStyle = "#86efac"; c.textAlign = "left";
  c.fillText(te ? "$ python telugu.py" : "$ python speak.py", -152, -192);
  wave(c, 0, -110, 290, 110, f, talk, talk ? "#a78bfa" : "#475569");
  c.restore();
  wifiOff(c, LAP.x + 250, LAP.y - 190, 0.9);
};
// a full-frame laptop window: title bar, then monospace rows (soft-wrapped at `cols`, a ↪ on the wrapped part).
// rows: [text, colour, k (0..1 shows it), highlight?]
type Row = [string, string, number, boolean?];
const term = (c: Ctx, W: number, title: string, rows: Row[], o: { y0?: number; size?: number; cols?: number; light?: boolean } = {}) => {
  const y0 = o.y0 ?? 330, size = o.size ?? 34, cols = o.cols ?? 44, lh = size * 1.42;
  c.fillStyle = o.light ? "#f8fafc" : "#0f172a"; rrect(c, 50, y0 - 90, W - 100, 1120, 26); c.fill();
  c.fillStyle = o.light ? "#e2e8f0" : "#1e293b"; rrect(c, 50, y0 - 90, W - 100, 72, 26); c.fill();
  ["#f87171", "#fbbf24", "#4ade80"].forEach((col, i) => { c.beginPath(); c.arc(98 + i * 40, y0 - 54, 12, 0, 7); c.fillStyle = col; c.fill(); });
  c.font = SANS(32, 600); c.fillStyle = o.light ? "#334155" : "#cbd5e1"; c.textAlign = "center"; c.fillText(title, W / 2, y0 - 42);
  let y = y0 + 40;
  rows.forEach(([t, col, k, hi]) => {
    const parts: string[] = [];
    let rest = t;
    while (rest.length > cols) { parts.push(rest.slice(0, cols)); rest = rest.slice(cols); }
    parts.push(rest);
    if (k > 0) {
      const shown = Math.ceil(t.length * clamp(k));   // typed out
      let used = 0;
      parts.forEach((p, j) => {
        const vis = p.slice(0, Math.max(0, shown - used)); used += p.length;
        if (hi) { c.fillStyle = "rgba(250,204,21,0.28)"; c.fillRect(70, y + j * lh - size * 0.95, W - 140, lh); }
        c.font = MONO(size); c.fillStyle = col; c.textAlign = "left";
        c.fillText((j > 0 ? "↪ " : "") + vis, 82, y + j * lh);
      });
    }
    y += parts.length * lh + 8;
  });
};
// a big number card: value, what it means, small lines under it
const statCard = (c: Ctx, W: number, y: number, big: string, what: string, small: string[], col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2); c.translate(W / 2, y); c.scale(0.92 + 0.08 * easeOut(k), 0.92 + 0.08 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -460, -200, 920, 400 + small.length * 54, 30); c.fill();
  c.font = SANS(150); c.fillStyle = col; c.textAlign = "center"; c.fillText(big, 0, -40);
  c.font = SANS(50, 600); c.fillStyle = INK; c.fillText(what, 0, 40);
  small.forEach((t, i) => { c.font = SANS(42, 600); c.fillStyle = "#475569"; c.fillText(t, 0, 120 + i * 54); });
  c.restore();
};
// two bars: English (Kokoro) vs Telugu (Indic Parler), seconds to make one sentence
const race = (c: Ctx, W: number, y: number, k: number[]) => {
  const rows: [string, number, string, string][] = [["English · Kokoro", 1.4, GREEN, "1.4 s for 4.0 s of speech"], ["Telugu · Indic Parler", 28, ORANGE, "28 s for 5.1 s of speech"]];
  rows.forEach(([lab, sec, col, note], i) => {
    const q = easeOut(clamp(k[i] ?? 0)); if (q <= 0) return;
    const yy = y + i * 230, wmax = 820;
    c.font = SANS(48); c.fillStyle = INK; c.textAlign = "left"; c.fillText(lab, 130, yy - 22);
    c.fillStyle = "#e2e8f0"; rrect(c, 130, yy, wmax, 84, 18); c.fill();
    c.fillStyle = col; rrect(c, 130, yy, Math.max(24, wmax * (sec / 28) * q), 84, 18); c.fill();
    c.font = SANS(40, 600); c.fillStyle = "#334155"; c.fillText(note, 130, yy + 130);
  });
};
// the save card: the commands as a checklist
const SAVE: [string, string][] = [
  ["pip install kokoro soundfile", "English voice"],
  ["sudo apt install espeak-ng", "Linux · Windows: the .msi"],
  ["python speak.py", "7 lines · in the caption"],
  ["pip install git+https://github.com/huggingface/parler-tts.git", "Telugu"],
  ["huggingface.co/ai4bharat/indic-parler-tts", "free login, accept terms"],
];
const saveCard = (c: Ctx, W: number, k: number, f0: number, f: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.translate(W / 2, 860); c.scale(0.9 + 0.1 * easeOut(k), 0.9 + 0.1 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -500, -560, 1000, 1080, 34); c.fill();
  c.font = SANS(84); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("SAVE THIS ✓", 0, -450);
  c.font = SANS(36, 600); c.fillStyle = "#475569"; c.fillText("free · offline · every command in the caption", 0, -390);
  SAVE.forEach(([cmd, note], i) => {
    const q = clamp((f - f0 - 6 - i * 5) / 6); if (q <= 0) return;
    const y = -300 + i * 160;
    c.save(); c.globalAlpha = q;
    c.fillStyle = "#0f172a"; rrect(c, -460, y, 920, 104, 18); c.fill();
    c.font = SANS(40); c.fillStyle = "#4ade80"; c.textAlign = "left"; c.fillText("✓", -440, y + 66);
    const sz = cmd.length > 40 ? 22 : cmd.length > 30 ? 28 : 34;
    c.font = MONO(sz, 700); c.fillStyle = "#f8fafc"; c.fillText(cmd, -396, y + 50);
    c.font = SANS(28, 600); c.fillStyle = "#93c5fd"; c.fillText(note, -396, y + 88);
    c.restore();
  });
  c.restore();
};

// ---------- the scene ----------
const StHowto: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const te = (s.data as { handle?: string }).handle === "@ai_maastaaru_telugu";
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const cue = (i: number, n: number, frac: number) => cueAt(ls[i], n, /^$/, ls[i].from + Math.round(ls[i].frames * frac));
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, k = (key: string) => `${key}${i}`;
    if (b.shot === "laptop") sfx.push(<Sfx key={k("w")} at={at - 10} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={1} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("c")} at={1} src="audio/sfx_pop.wav" vol={0.5} />);
    if (b.prop === "install" || b.prop === "run") for (let q = 0; q < 8; q++) sfx.push(<Sfx key={k("t" + q)} at={at + 4 + q * 3} src="audio/sfx_tick.wav" vol={0.14} />);
    if (b.prop === "install") sfx.push(<Sfx key={k("s")} at={at + Math.round(l.frames * 0.55)} src="audio/sfx_success.wav" vol={0.25} />);
    if (b.prop === "code") sfx.push(<Sfx key={k("p")} at={at + Math.round(l.frames * 0.6)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "run") sfx.push(<Sfx key={k("s")} at={at + Math.round(l.frames * 0.8)} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "offline") sfx.push(<Sfx key={k("n")} at={at + 2} src="audio/sfx_snap.wav" vol={0.4} />, <Sfx key={k("h")} at={at + Math.round(l.frames * 0.45)} src="reel/sfx_boom.wav" vol={0.55} />);
    if (b.prop === "telugu") sfx.push(<Sfx key={k("o")} at={at + 2} src="audio/gag_bonk.wav" vol={0.35} />);
    if (b.prop === "parler") sfx.push(<Sfx key={k("r")} at={at + l.frames - 30} src="reel/sfx_riser.wav" vol={0.4} />);
    if (b.prop === "tedemo") sfx.push(<Sfx key={k("c")} at={at - 3} src="audio/sfx_pop.wav" vol={0.35} />);
    if (b.prop === "howlong") sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "slow") [0, 1].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={at + 6 + q * 22} src="audio/sfx_pop.wav" vol={0.3} />));
    if (b.prop === "save") sfx.push(<Sfx key={k("r")} at={at - 30} src="reel/sfx_riser.wav" vol={0.5} />, <Sfx key={k("h")} at={at + 4} src="reel/sfx_boom.wav" vol={0.8} />,
      <Sfx key={k("n")} at={at + 4} src="audio/sfx_snap.wav" vol={0.6} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(7100 + boil);
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to);
        const mouth = talking && Math.floor(f / 3) % 2 === 0;
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        if (b.shot === "laptop") {
          // ---------- the laptop screen, full frame ----------
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          if (b.prop === "install") {
            term(c, W, "Terminal", [
              ["$ pip install kokoro soundfile", "#f8fafc", seg(p, 0.0, 0.25)],
              ["Successfully installed ... kokoro-0.9.4 misaki-0.9.4 ...", "#86efac", seg(p, 0.3, 0.4)],
              ["$ sudo apt-get install espeak-ng", "#f8fafc", seg(p, 0.45, 0.65)],
              ["$ espeak-ng --version", "#f8fafc", seg(p, 0.66, 0.72)],
              ["eSpeak NG text-to-speech: 1.51", "#86efac", seg(p, 0.74, 0.8)],
            ]);
            tag(c, "15 s", 820, 1180, 72, "#dcfce7", "#166534", -0.03, seg(p, 0.35, 0.45));
            tag(c, "needs Python 3.10-3.12", 360, 1180, 46, "#e0e7ff", INK, 0.02, seg(p, 0.5, 0.6));
            tag(c, "Windows: the espeak-ng .msi installer", W / 2, 1300, 44, "#fff", "#334155", -0.01, seg(p, 0.7, 0.8));
          }
          if (b.prop === "code") {
            const hi = f >= cu(1, 0.55) - 4;
            term(c, W, "speak.py", [
              ["from kokoro import KPipeline", "#93c5fd", 1], ["import soundfile as sf", "#93c5fd", 1], ["", "#fff", 1],
              ["pipeline = KPipeline(lang_code='a')", "#f8fafc", 1],
              ['text = "Hello! This voice was made on a laptop, with no internet."', "#fde68a", 1, hi],
              ["for i, (gs, ps, audio) in enumerate(pipeline(text, voice='af_heart')):", "#f8fafc", 1],
              ["    print(i, gs, ps)", "#f8fafc", 1], ["    sf.write(f'{i}.wav', audio, 24000)", "#f8fafc", 1],
            ], { size: 30, cols: 50 });
            if (hi) tag(c, "your sentence goes here", W / 2, 1180, 58, "#fef3c7", INK, -0.02, seg(f, cu(1, 0.55) - 4, cu(1, 0.55) + 6));
            tag(c, "'a' = American English · af_heart = the voice", W / 2, 1300, 40, "#fff", "#334155", 0.01, seg(p, 0.2, 0.3));
          }
          if (b.prop === "run") {
            const dl = seg(p, 0.15, 0.5);
            term(c, W, "Terminal", [
              ["$ python speak.py", "#f8fafc", seg(p, 0.0, 0.12)],
              ["0 Hello! This voice was made on a laptop, with no internet. həlˈO! ðˌɪs vˈYs wʌz mˌAd ˌɔn ɐ lˈæptˌɑp, wɪð nˈO ˈɪntəɹnˌɛt.", "#86efac", seg(p, 0.52, 0.6)],
            ], { size: 32, cols: 46 });
            // the first run's download, then the file
            c.fillStyle = "#334155"; rrect(c, 110, 860, W - 220, 50, 25); c.fill();
            c.fillStyle = PURPLE; rrect(c, 110, 860, Math.max(50, (W - 220) * dl), 50, 25); c.fill();
            c.font = SANS(36, 600); c.fillStyle = "#e2e8f0"; c.textAlign = "center";
            c.fillText(dl < 1 ? `first run only: downloading the voice ${Math.round(313 * dl)} MB` : "voice downloaded: 313 MB (once)", W / 2, 960);
            if (p > 0.62) tag(c, "letters → sounds → 0.wav (4.0 s)", W / 2, 1120, 56, "#ede9fe", "#4c1d95", -0.02, seg(p, 0.62, 0.7));
          }
          if (b.prop === "offline") {
            wifiOff(c, W / 2, 400, 1.6);
            c.font = SANS(52); c.fillStyle = "#fecaca"; c.textAlign = "center"; c.fillText("Wi-Fi OFF", W / 2, 560);
            statCard(c, W, 880, "1.4 s", "to make 4 s of speech", ["1.2 GB memory · no graphics card", "our test: a 4-core computer"], GREEN, seg(p, 0.25, 0.4));
          }
          if (b.prop === "parler") {
            term(c, W, "huggingface.co", [
              ["ai4bharat/indic-parler-tts", "#0f172a", 1],
            ], { size: 40, cols: 40, light: true });
            const chips: [string, string][] = [["Apache 2.0", "#dcfce7"], ["21 Indian languages", "#e0e7ff"], ["0.9B · 3.75 GB", "#fef3c7"], ["free login + accept terms", "#fee2e2"]];
            chips.forEach(([t, bg], q) => tag(c, t, q % 2 ? 760 : 320, 520 + Math.floor(q / 2) * 110, 44, bg, INK, q % 2 ? 0.02 : -0.02, seg(p, 0.08 + q * 0.06, 0.16 + q * 0.06)));
            const c1 = cu(1, 0.6);
            c.fillStyle = "#0f172a"; rrect(c, 80, 800, W - 160, 380, 22); c.fill();
            c.font = MONO(30); c.textAlign = "left";
            const desc = 'description = "Lalitha speaks in a clear, friendly voice at a moderate pace. The recording is very clear, with no background noise."';
            const on = f >= c1 - 4;
            for (let q = 0; q * 52 < desc.length; q++) {
              if (on && q < 3) { c.fillStyle = "rgba(250,204,21,0.25)"; c.fillRect(96, 828 + q * 46, W - 192, 44); }
              c.fillStyle = "#fde68a"; c.fillText(desc.slice(q * 52, q * 52 + 52), 110, 862 + q * 46);
            }
            if (on) tag(c, "you describe the voice in words", W / 2, 1290, 58, "#fef3c7", INK, -0.02, seg(f, c1 - 4, c1 + 6));
          }
          if (b.prop === "tedemo") {
            c.fillStyle = "#0f172a"; rrect(c, 60, 300, W - 120, 1000, 28); c.fill();
            c.font = MONO(30); c.fillStyle = "#86efac"; c.textAlign = "left"; c.fillText("$ python telugu.py", 100, 380);
            wave(c, W / 2, 640, W - 220, 300, f, talking, "#a78bfa");
            c.font = TELUGU(54); c.fillStyle = "#f8fafc"; c.textAlign = "center";
            c.fillText("నమస్కారం! ఈ గొంతు ఇంటర్నెట్", W / 2, 920); c.fillText("లేకుండా ఒక ల్యాప్‌టాప్ లో తయారైంది.", W / 2, 1000);
            c.font = SANS(36, 600); c.fillStyle = "#c4b5fd"; c.fillText("Lalitha · Indic Parler-TTS · Wi-Fi off", W / 2, 1110);
            tag(c, "real output of our test", W / 2, 1220, 46, "#fff", "#334155", 0.01, seg(p, 0.05, 0.15));
          }
          if (b.prop === "slow") {
            race(c, W, 520, [seg(p, 0.05, 0.2), seg(p, 0.25, 0.55)]);
            statCard(c, W, 1150, "4.6 GB", "memory for Telugu", ["20 s to load · 3.75 GB download", "free · offline once downloaded"], ORANGE, seg(p, 0.55, 0.7));
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
          laptop(c, f, b.who === "laptop" && talking, b.prop === "tedemo");
          c.restore();
          if (b.prop === "hook") {
            headline(c, W, "MADE ON THIS LAPTOP.", "NO INTERNET. FREE.", 1);
            tag(c, "real voice from our test", 300, 1120, 44, "#fff", "#334155", -0.02, seg(p, 0.1, 0.2));
          }
          if (b.prop === "who") bubble(c, 330, 560, "Who's in there?!", 76, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "nobody") tag(c, "a free voice model, on the laptop itself", W / 2, 520, 50, "#ede9fe", "#4c1d95", -0.02, seg(p, 0.15, 0.3));
          if (b.prop === "pay") bubble(c, 330, 560, "I pay every month!", 72, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (b.prop === "type") bubble(c, 330, 560, "One finger!", 90, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "then") bubble(c, 330, 560, "And then?", 86, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "after") bubble(c, 330, 560, "No internet?", 86, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "telugu") bubble(c, 330, 560, "TELUGU?!", 104, seg(p, 0.05, 0.2), "#fee2e2", "#991b1b");
          if (b.prop === "howlong") bubble(c, 330, 560, "How long?", 90, seg(p, 0.05, 0.2), COL.yellow);
          if (b.prop === "save") saveCard(c, W, seg(f, ln.from + 2, ln.from + 10), ln.from + 2, f);
        }
        void BLUE; void stroke;
      }} />
    </>
  );
};

export const HOWTO_SCENES = { sk_howto: StHowto };
