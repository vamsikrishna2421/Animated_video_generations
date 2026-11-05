import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { COL } from "./scenes";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, tag, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { shop, counter, ravi, phone, cueAt, WALL, Mood, Arms } from "./SkitCrayon";
import { bubble } from "./OwnCrayon";

// HOW TO 03 "Test 3 AIs on your question before you pay" (series/scripts/howto03_test_before_you_pay.md): the same bill,
// two free AIs, ₹428 and ₹518; the shop AI walks Ravi anna through the four steps. Every number comes from our run
// (series/scripts/howto03_demo, read by hand; passed in as s.data.board by pipeline/howto03/make_specs.py). One beat per
// line (s.data.beats); visuals key on the beat's prop, so the Telugu reel uses the same screens.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: "ravi" | "ai"; shot: string; prop: string; n: number };
type AI = { name: string; gb: number; lic: string; per: Record<string, number>; right: number; sec: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const SHOTS: Record<string, { z: number; x: number; y: number }> = {
  wide: { z: 1.0, x: 540, y: 800 }, ravi: { z: 1.55, x: 500, y: 720 },
};
const POSE: Record<string, [Mood, Arms]> = {
  hook: ["yell", "up"], small: ["angry", "point"], biggest: ["hope", "thumb"], which: ["sus", "point"], loop: ["yell", "up"],
};
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, sans-serif`;
const QS: [string, string, string][] = [   // key, Ravi's question (short), the right answer he wrote first
  ["bill", "the bill", "₹518"],
  ["gst", "GST on ₹1,180", "₹1,000 + ₹180"],
  ["reorder", "what to reorder", "sugar, dal"],
  ["telugu", "a Telugu message", "real Telugu"],
  ["honest", "last Tuesday's sales", "\"can't know\""],
];   // script review: the long questions couldn't be read on a phone (the caption has them in full)
const LABEL: Record<string, string> = { bill: "bill", gst: "GST", reorder: "reorder", telugu: "Telugu", honest: "honest" };
const MUST_EXACT = new Set(["bill", "gst"]);
// our run's real Telugu reply (Qwen2.5 7B, try 2) and its own English line
const TE_REPLY = "పిన్ని సోండెడ్ ని క్లెశ్ చేస్తున్నాము. మన కార్యక్లం ఏడ ఏళ్లమే ప్రారంభిస్తుంది!";
const TE_CLAIM = "(Translation: The shop is closed this Sunday. We will open again at 7 am on Monday!)";

// ---------- pieces ----------
const wrapW = (c: Ctx, t: string, w: number) => {
  const out: string[] = []; let cur = "";
  t.split(" ").forEach((word) => { const nx = cur ? `${cur} ${word}` : word; if (c.measureText(nx).width > w && cur) { out.push(cur); cur = word; } else cur = nx; });
  if (cur) out.push(cur);
  return out;
};
// one AI's answer to the bill (frame 1 and the loop)
const answer = (c: Ctx, x: number, y: number, w: number, name: string, total: string, ok: boolean, k: number, lines = true) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "rgba(4,8,40,0.3)"; rrect(c, x + 8, y + 10, w, 430, 28); c.fill();
  c.fillStyle = "#f8fafc"; rrect(c, x, y, w, 430, 28); c.fill();
  c.fillStyle = ok ? "#dcfce7" : "#fee2e2"; rrect(c, x, y, w, 80, 28); c.fill(); c.fillRect(x, y + 50, w, 30);
  c.font = SANS(38, 900); c.fillStyle = ok ? "#14532d" : "#991b1b"; c.textAlign = "left"; c.fillText(name, x + 28, y + 56);
  c.font = SANS(32, 700); c.fillStyle = "#334155";
  if (lines) ["rice: 3 × 62 = 186", "oil: 2 × 145 = 290", "eggs: 6 × 7 = 42"].forEach((t, q) => c.fillText(t, x + 28, y + 130 + q * 46));
  c.font = SANS(lines ? 36 : 44, 800); c.fillStyle = INK; c.fillText("186 + 290 + 42 =", x + 28, lines ? y + 292 : y + 200);
  c.font = SANS(110, 900); c.fillStyle = ok ? GREEN : RED; c.fillText(total, x + 28, y + 402);
  c.font = SANS(110, 900); c.textAlign = "right"; c.fillText(ok ? "✓" : "✗", x + w - 24, y + 402);
  c.restore();
};
const stepHead = (c: Ctx, W: number, n: number | string, t: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = "#facc15"; c.fillRect(0, 250, W, 110);
  c.font = SANS(60, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(typeof n === "number" ? `STEP ${n} · ${t}` : t, W / 2, 328);
  c.restore();
};
const qList = (c: Ctx, W: number, y: number, f: number, f0: number, step: number) => {
  QS.forEach(([, q, a], i) => {
    const k = clamp((f - f0 - i * step) / 6); if (k <= 0) return;
    const yy = y + i * 170, key = QS[i][0];
    c.save(); c.globalAlpha = k;
    c.fillStyle = "#fffdf5"; rrect(c, 60, yy, W - 120, 150, 22); c.fill();
    c.font = SANS(56, 900); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(`${i + 1}`, 90, yy + 96);
    c.font = SANS(48, 800); c.fillStyle = INK; c.fillText(q, 150, yy + 70);
    if (MUST_EXACT.has(key)) { c.font = SANS(28, 900); c.fillStyle = RED; c.fillText("MUST BE EXACT", 150, yy + 124); }
    c.font = SANS(52, 900); c.fillStyle = GREEN; c.textAlign = "right"; c.fillText(a, W - 90, yy + 96);
    c.restore();
  });
};
const chats = (c: Ctx, W: number, y: number, names: string[], k: number[]) => {
  names.forEach((nm, i) => {
    const q = easeOut(clamp(k[i] ?? 0)); if (q <= 0) return;
    const x = 40 + i * 340, w = 320;
    c.save(); c.globalAlpha = clamp(q * 2); c.translate(0, 30 * (1 - q));
    c.fillStyle = "#111827"; rrect(c, x, y, w, 760, 36); c.fill();
    c.fillStyle = "#f8fafc"; rrect(c, x + 14, y + 14, w - 28, 732, 26); c.fill();
    c.font = SANS(28, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(nm, x + w / 2, y + 66);
    c.fillStyle = "#e2e8f0"; rrect(c, x + 40, y + 96, w - 80, 56, 28); c.fill();
    c.font = SANS(26, 800); c.fillStyle = INK; c.fillText("＋ New chat", x + w / 2, y + 134);
    c.font = SANS(28, 700); const rows = wrapW(c, "3 kg rice at Rs 62 a kg, 2 litres oil at Rs 145 a litre and 6 eggs at Rs 7 each. What is the total?", w - 90);
    c.fillStyle = "#dcf8c6"; rrect(c, x + 30, y + 190, w - 60, rows.length * 38 + 30, 18); c.fill();
    c.fillStyle = INK; c.textAlign = "left"; rows.forEach((t, j) => c.fillText(t, x + 46, y + 232 + j * 38));
    c.restore();
  });
};
// the scoreboard: a row per question, a column per AI, right answers of 3, then the total and the seconds
const board = (c: Ctx, W: number, y: number, ais: AI[], f: number, f0: number, step: number, hi = "") => {
  const cx = [470, 680, 890];
  c.save();
  c.font = SANS(32, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center";
  ais.forEach((a, j) => { c.font = SANS(38, 900); c.fillStyle = "#f8fafc"; c.fillText(a.name, cx[j], y); c.font = SANS(26, 700); c.fillStyle = "#94a3b8"; c.fillText(`${a.gb} GB`, cx[j], y + 36); });
  QS.forEach(([key], i) => {
    const k = clamp((f - f0 - i * step) / 6); if (k <= 0) return;
    const yy = y + 80 + i * 118;
    c.globalAlpha = k;
    if (hi === key) { c.fillStyle = "rgba(250,204,21,0.25)"; rrect(c, 60, yy - 6, W - 120, 104, 16); c.fill(); }
    c.font = SANS(44, 900); c.fillStyle = "#e2e8f0"; c.textAlign = "left"; c.fillText(LABEL[key], 90, yy + 64);
    ais.forEach((a, j) => {
      const v = a.per[key], ok = v === 3;
      c.fillStyle = ok ? "#14532d" : v === 0 ? "#7f1d1d" : "#78350f"; rrect(c, cx[j] - 90, yy, 180, 92, 16); c.fill();
      c.font = SANS(60, 900); c.fillStyle = ok ? "#86efac" : v === 0 ? "#fca5a5" : "#fde68a"; c.textAlign = "center"; c.fillText(ok ? "✓" : v === 0 ? "✗" : `${v}/3`, cx[j], yy + 70);   // script review: ticks, not a table of numbers
    });
  });
  const kt = clamp((f - f0 - QS.length * step - 4) / 6);
  if (kt > 0) {
    const yy = y + 80 + QS.length * 118 + 10;
    c.globalAlpha = kt;
    c.fillStyle = "#f8fafc"; c.fillRect(60, yy, W - 120, 4);
    c.font = SANS(44, 900); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText("right", 90, yy + 80);
    c.font = SANS(28, 700); c.fillStyle = "#94a3b8"; c.fillText("of 15 (5 × 3 tries)", 90, yy + 126);
    ais.forEach((a, j) => { c.font = SANS(70, 900); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText(`${a.right}`, cx[j], yy + 92); });   // script review: no seconds (a laptop's, not the apps')
  }
  c.restore();
};
const saveCard = (c: Ctx, W: number, k: number, f0: number, f: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 2);
  c.fillStyle = "rgba(15,23,42,0.6)"; c.fillRect(0, 0, W, 1920);
  c.translate(W / 2, 880); c.scale(0.9 + 0.1 * easeOut(k), 0.9 + 0.1 * easeOut(k));
  c.fillStyle = "#fffdf5"; rrect(c, -500, -620, 1000, 1240, 34); c.fill();
  c.font = SANS(80, 900); c.fillStyle = COL.red; c.textAlign = "center"; c.fillText("SAVE THIS ✓", 0, -510);
  c.font = SANS(36, 700); c.fillStyle = "#475569"; c.fillText("test an AI before you pay", 0, -450);
  const rows: [string, string, string][] = [
    ["1", "5 questions from YOUR work", "write the right answers first"],
    ["2", "the same words to each AI", "a new chat every time"],
    ["3", "mark ✓ ✗ yourself", "and note the seconds"],
    ["4", "keep the one that passes", "none? try the free apps, then pay; test the paid one too"],
  ];
  rows.forEach(([num, head, note], i) => {
    const q = clamp((f - f0 - 6 - i * 6) / 6); if (q <= 0) return;
    const y = -390 + i * 230;   // the full table: the caption
    c.save(); c.globalAlpha = q;
    c.fillStyle = "#0f172a"; rrect(c, -460, y, 920, 200, 22); c.fill();
    c.font = SANS(64, 900); c.fillStyle = "#4ade80"; c.textAlign = "left"; c.fillText(num, -430, y + 86);
    c.font = SANS(50, 900); c.fillStyle = "#f8fafc"; c.fillText(head, -370, y + 84);
    c.font = SANS(36, 700); c.fillStyle = "#93c5fd"; c.fillText(note, -370, y + 146);
    c.restore();
  });
  c.restore();
};

// ---------- the scene ----------
const StTest: React.FC<SP> = ({ s }) => {
  const beats: Beat[] = s.data.beats;
  const ais: AI[] = s.data.board;
  const te = s.data.handle === "@ai_maastaaru_telugu";
  const ls = s.lines;
  const idx = (f: number) => { let i = 0; ls.forEach((l, k) => { if (f >= l.from - 2) i = k; }); return i; };
  const HOLD = 30;
  const sfx: React.ReactNode[] = [];
  beats.forEach((b, i) => {
    const l = ls[i]; if (!l) return;
    const at = l.from, end = l.from + l.frames, k = (key: string) => `${key}${i}`;
    const prev = i > 0 ? beats[i - 1].shot : "";
    const c1 = cueAt(l, 1, /^$/, at + Math.round(l.frames * 0.5));
    if (b.shot === "app" && prev !== "app") sfx.push(<Sfx key={k("w")} at={at - (te ? 16 : 10)} src="audio/sfx_whoosh.wav" vol={0.22} />);
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={1} src="reel/sfx_boom.wav" vol={0.6} />, <Sfx key={k("c")} at={c1 - 6} src="audio/sfx_pop.wav" vol={0.45} />);
    if (["step1", "step2", "step3", "step4"].includes(b.prop)) sfx.push(<Sfx key={k("s")} at={at + 2} src="audio/sfx_snap.wav" vol={0.3} />);
    if (b.prop === "step3") QS.forEach((_, q) => sfx.push(<Sfx key={k("t" + q)} at={c1 + q * 8} src="audio/sfx_tick.wav" vol={0.25} />));
    if (b.prop === "small") sfx.push(<Sfx key={k("b")} at={c1 - 8} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.5} />, <Sfx key={k("z")} at={c1 + 2} src="audio/gag_boing.wav" vol={0.3} />);
    if (b.prop === "telugu") sfx.push(<Sfx key={k("b")} at={c1 - 8} src="reel/sfx_boom.wav" vol={te ? 0.4 : 0.55} />, <Sfx key={k("g")} at={c1 + 40} src="reel/sfx_glitch.wav" vol={0.25} />);
    if (b.prop === "step4") sfx.push(<Sfx key={k("h")} at={c1 - 6} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "save") sfx.push(<Sfx key={k("r")} at={at - 37} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("n")} at={at + 4} src="audio/sfx_snap.wav" vol={0.5} />);
    if (b.prop === "loop") sfx.push(<Sfx key={k("d")} at={c1 - 6} src="audio/gag_ding.wav" vol={0.3} />, <Sfx key={k("h")} at={end + HOLD} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("p")} at={end + HOLD} src="audio/sfx_pop.wav" vol={0.5} />);
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const p = clamp((f - ln.from) / Math.max(1, ln.frames));
        const r = rng(7303 + boil);
        const talking = (ln.words ?? []).some((w) => f >= w.from && f <= w.to);
        const mouth = talking && Math.floor(f / 3) % 2 === 0;
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        if (b.prop === "hook" || loopOn) {
          // ---------- frame 1: the same bill, two free AIs, ₹428 ✗ and ₹518 ✓; Ravi yelling ----------
          c.fillStyle = WALL; c.fillRect(0, 0, W, H);
          c.save(); c.translate(W / 2, 1000); c.translate(-540, -800);
          shop(c, r); ravi(c, "yell", "up", b.prop === "hook" && mouth, p, f, r); counter(c, r);
          c.restore();
          c.save(); c.font = SANS(40, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText("SAME BILL · TWO FREE AIs", W / 2, 230); c.restore();
          answer(c, 40, 260, 490, "FREE AI #1", "₹428", false, 1, false);   // script review: only the two sums, big
          answer(c, 550, 260, 490, "FREE AI #2", "₹518", true, 1, false);
          tag(c, "RAVI LOSES ₹90", W / 2, 780, 76, "#fee2e2", "#991b1b", -0.04, 1);
          if (loopOn) { c.save(); c.globalAlpha = 0.5 * (1 - seg(f, endL + HOLD, endL + HOLD + 8)); c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); c.restore(); }
          return;
        }
        if (b.shot === "app") {
          c.fillStyle = "#1e293b"; c.fillRect(0, 0, W, H);
          const c1 = cu(1, 0.5);
          if (b.prop === "title") {
            stepHead(c, W, "HOW TO 03", "", 1);
            c.save(); c.font = SANS(72, 900); c.fillStyle = "#f8fafc"; c.textAlign = "center";
            c.fillText("BEFORE YOU PAY", W / 2, 560); c.fillText("FOR AN AI PLAN", W / 2, 650);   // script review: "before you pay" after a bill read as paying the bill
            c.font = SANS(40, 700); c.fillStyle = "#93c5fd"; c.fillText("test it on YOUR questions · 4 steps", W / 2, 740);
            c.restore();
            const k = seg(f, c1 - 4, c1 + 6);
            ais.forEach((a, j) => { tag(c, `${a.name} ${a.gb} GB`, 200 + j * 340, 960, 40, "#fef3c7", INK, j % 2 ? 0.03 : -0.03, seg(f, c1 + j * 5, c1 + 6 + j * 5));
              c.save(); c.globalAlpha = seg(f, c1 + j * 5, c1 + 6 + j * 5); c.font = SANS(24, 700); c.fillStyle = "#94a3b8"; c.textAlign = "center"; c.fillText(a.lic, 200 + j * 340, 1030); c.restore(); });
            c.save(); c.globalAlpha = k; c.font = SANS(38, 700); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("3 small free AIs, on our laptop, no internet", W / 2, 1130); c.restore();
          }
          if (b.prop === "step1") { stepHead(c, W, 1, "YOUR 5 QUESTIONS", 1); qList(c, W, 420, f, ln.from + 4, Math.max(6, Math.round(ln.frames / 7))); }
          if (b.prop === "step2") {
            stepHead(c, W, 2, "SAME WORDS, NEW CHAT", 1); chats(c, W, 430, ais.map((a) => `${a.name} ${a.gb} GB`), [seg(p, 0.05, 0.2), seg(p, 0.2, 0.35), seg(p, 0.35, 0.5)]);
            tag(c, "× 3 tries each", W / 2, 1270, 64, "#fef3c7", INK, -0.02, seg(f, c1 - 4, c1 + 4));
            c.save(); c.globalAlpha = seg(f, c1 + 8, c1 + 16); c.font = SANS(40, 800); c.fillStyle = "#cbd5e1"; c.textAlign = "center"; c.fillText("5 questions × 3 tries = 15 answers each", W / 2, 1380); c.restore();   // script review: where 15 comes from
          }
          if (b.prop === "step3") { stepHead(c, W, 3, "MARK EVERY ANSWER", 1); board(c, W, 470, ais, f, ln.from + 6, Math.max(6, Math.round(ln.frames / 8))); }
          if (b.prop === "telugu") {
            stepHead(c, W, 3, "MARK EVERY ANSWER", 1);
            board(c, W, 470, ais, f, -1e9, 1, "telugu");
            const k = seg(f, c1 - 6, c1 + 4);
            if (k > 0) {
              c.save(); c.globalAlpha = clamp(k * 3);
              c.fillStyle = "#f8fafc"; rrect(c, 60, 470, W - 120, 640, 26); c.fill();
              c.font = SANS(30, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText(`${ais[2].name}, the Telugu message:`, 100, 530);
              c.font = "700 44px 'Noto Sans Telugu', 'Gautami', sans-serif"; c.fillStyle = INK; wrapW(c, TE_REPLY, W - 220).forEach((t, j) => c.fillText(t, 100, 600 + j * 62));
              c.font = SANS(34, 700); c.fillStyle = "#1d4ed8"; wrapW(c, TE_CLAIM, W - 220).forEach((t, j) => c.fillText(t, 100, 790 + j * 46));
              c.restore();
              tag(c, "THE TELUGU DOESN'T SAY THIS", W / 2, 1010, 56, "#fee2e2", "#991b1b", -0.03, seg(f, c1 + 30, c1 + 38));
            }
            c.save(); c.globalAlpha = seg(f, c1 + 10, c1 + 18); c.font = SANS(64, 900); c.fillStyle = "#fca5a5"; c.textAlign = "center"; c.fillText("Telugu: 0 of 9", W / 2, 1210); c.font = SANS(36, 700); c.fillStyle = "#cbd5e1"; c.fillText("3 small free AIs × 3 tries", W / 2, 1270); c.restore();
          }
          if (b.prop === "step4") {
            stepHead(c, W, 4, "KEEP THE ONE THAT PASSES", 1);
            [ais[1], ais[2]].forEach((a, j) => {   // script review: v1 picked nothing; no seconds or ₹0 (a laptop's, not the apps')
              const k = seg(f, c1 - 6 + j * 8, c1 + 2 + j * 8); if (k <= 0) return;
              const x = 70 + j * 480;
              c.save(); c.globalAlpha = clamp(k * 2);
              c.fillStyle = "#fffdf5"; rrect(c, x, 450, 460, 330, 26); c.fill();
              c.font = SANS(56, 900); c.fillStyle = INK; c.textAlign = "center"; c.fillText(a.name, x + 230, 530);
              c.font = SANS(30, 700); c.fillStyle = "#475569"; c.fillText(`${a.gb} GB`, x + 230, 574);
              c.font = SANS(100, 900); c.fillStyle = GREEN; c.fillText(`${a.right}/15`, x + 230, 700);
              c.font = SANS(30, 800); c.fillStyle = "#14532d"; c.fillText("bills, GST, stock ✓", x + 230, 752);
              c.restore();
            });
            c.save(); c.globalAlpha = seg(f, c1 + 16, c1 + 24); c.font = SANS(110, 900); c.fillStyle = "#facc15"; c.textAlign = "center"; c.fillText("=", W / 2, 660); c.restore();
            const kt = seg(f, cu(1, 0.75) - 4, cu(1, 0.75) + 4);
            if (kt > 0) {
              c.save(); c.globalAlpha = kt;
              c.fillStyle = "#7f1d1d"; rrect(c, 70, 860, W - 140, 200, 26); c.fill();
              c.font = SANS(52, 900); c.fillStyle = "#fecaca"; c.textAlign = "center"; c.fillText("TELUGU: none passed  ✗ ✗ ✗", W / 2, 940);
              c.font = SANS(36, 700); c.fillStyle = "#fde68a"; c.fillText("→ that's the question for the free apps", W / 2, 1012);
              c.restore();
            }
          }
          return;
        }
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
        c.restore();
        if (b.prop === "small") {
          const c1 = cu(1, 0.5);
          answer(c, 160, 300, 760, `FREE AI #1 · ${ais[0].name} ${ais[0].gb} GB`, "₹428", false, seg(p, 0.02, 0.12));
          tag(c, "every step right · the sum wrong", W / 2, 820, 54, "#fee2e2", "#991b1b", -0.02, seg(f, c1 - 4, c1 + 4));
          tag(c, "tries: ₹428 · ₹418 · ₹428", W / 2, 920, 50, "#fef3c7", INK, 0.02, seg(f, c1 + 8, c1 + 14));
        }
        if (b.prop === "biggest") bubble(c, 330, 560, "Biggest one wins?", 84, seg(p, 0.05, 0.2), COL.yellow);
        if (b.prop === "save") saveCard(c, W, seg(f, ln.from - 4, ln.from + 4), ln.from - 4, f);
        if (b.prop === "which") bubble(c, 330, 560, "Which brain are YOU?", 80, seg(p, 0.05, 0.2), "#e0e7ff");
        if (b.prop === "loop") tag(c, `the shop AI: ${ais[0].name}, ${ais[0].gb} GB · 8 of 15`, W / 2, 470, 56, "#fee2e2", "#991b1b", -0.03, seg(f, cu(1, 0.4) - 4, cu(1, 0.4) + 4));
      }} />
    </>
  );
};

export const TEST_SCENES = { sk_test: StTest };
