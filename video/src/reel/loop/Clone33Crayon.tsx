import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 33 "Which One Is Really Kittu?" (series/scripts/creative33_voice_clone.md): a one-question challenge. Amma's
// phone: two voice notes from "Kittu" and a ₹50,000 payment card. Note 1 is Kittu (a computer voice), note 2 a copy made
// by a voice-cloning service from 13 s of his voice note (our test: pipeline/creative33/clone_demo.py). Both notes play
// (the test's own audio), a 3-2-1 countdown, the reveal, the voice-match scores, the twist (Kittu is a computer voice too),
// McAfee's survey, the rule (a family code word; hang up and call back; 1930), and the loop: a new voice note.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { who: string; prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 16;
const CLAP = "reel/creative09v1/clap.wav";
const GREEN = "#16a34a", RED = "#dc2626";
const SANS = (s: number, w = 700) => `${w} ${s}px Arial, "Noto Sans Telugu", "Noto Color Emoji", sans-serif`;

const PH = { x: 300, y: 380, w: 740, h: 880 };
const phone = (c: Ctx, contact: string, buzz = 0) => {
  c.save(); c.translate(Math.sin(buzz * 60) * 8 * buzz, 0);
  c.fillStyle = "rgba(4,8,40,0.35)"; rrect(c, PH.x + 12, PH.y + 14, PH.w, PH.h, 56); c.fill();
  c.fillStyle = "#111827"; rrect(c, PH.x, PH.y, PH.w, PH.h, 56); c.fill();
  c.fillStyle = "#ece5dd"; rrect(c, PH.x + 20, PH.y + 20, PH.w - 40, PH.h - 40, 40); c.fill();
  c.fillStyle = "#075e54"; rrect(c, PH.x + 20, PH.y + 20, PH.w - 40, 110, 40); c.fill(); c.fillRect(PH.x + 20, PH.y + 90, PH.w - 40, 40);
  c.fillStyle = "#cbd5e1"; c.beginPath(); c.arc(PH.x + 90, PH.y + 76, 32, 0, 7); c.fill();
  c.font = SANS(44, 800); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(contact, PH.x + 140, PH.y + 92);
  c.restore();
};
// a voice note bubble: play/pause, a waveform that fills while it plays, a label
const note = (c: Ctx, y: number, label: string, dur: string, prog: number, playing: boolean, seed: number, tint = "#fff") => {
  const x = PH.x + 50, w = PH.w - 140;
  c.fillStyle = tint; rrect(c, x, y, w, 130, 26); c.fill();
  c.fillStyle = playing ? "#075e54" : "#34b7f1"; c.beginPath(); c.arc(x + 70, y + 65, 38, 0, 7); c.fill();
  c.fillStyle = "#fff";
  if (playing) { c.fillRect(x + 56, y + 46, 10, 38); c.fillRect(x + 74, y + 46, 10, 38); }
  else { c.beginPath(); c.moveTo(x + 60, y + 42); c.lineTo(x + 90, y + 65); c.lineTo(x + 60, y + 88); c.closePath(); c.fill(); }
  const r = rng(seed);
  for (let q = 0; q < 34; q++) {
    const bx = x + 130 + q * 12, h = 14 + r() * 50;
    c.fillStyle = q / 34 < prog ? "#075e54" : "#94a3b8"; c.fillRect(bx, y + 65 - h / 2, 7, h);
  }
  c.font = SANS(30, 800); c.fillStyle = "#475569"; c.textAlign = "right"; c.fillText(dur, x + w - 24, y + 112);
  c.font = SANS(34, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(label, x + 130, y + 32);
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.1) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.92)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
const payCard = (c: Ctx, amount: string, pulse: number) => {
  const x = PH.x + 50, y = PH.y + PH.h - 250, w = PH.w - 100;
  c.fillStyle = "#fff"; rrect(c, x, y, w, 200, 26); c.fill();
  c.font = SANS(30, 800); c.fillStyle = "#475569"; c.textAlign = "left"; c.fillText("Pay to: a new number, \"Kittu\"", x + 30, y + 52);
  c.font = SANS(76, 900); c.fillStyle = INK; c.fillText(amount, x + 30, y + 140);
  const s = 1 + 0.06 * Math.sin(pulse * 6);
  c.save(); c.translate(x + w - 130, y + 110); c.scale(s, s);
  c.fillStyle = RED; rrect(c, -100, -46, 200, 92, 46); c.fill();
  c.font = SANS(48, 900); c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("PAY", 0, 16); c.restore();
};

const StClone: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("a")} at={0} src="reel/sfx_boom.wav" vol={te ? 0.9 : 0.85} />, <Sfx key={k("z")} at={4} src="reel/sfx_buzz.wav" vol={0.35} />, <Sfx key={k("p")} at={cue(i, 1, 0.5)} src="audio/sfx_pop.wav" vol={0.3} />);
    if (b.prop === "guess") { const c1 = cue(i, 1, 0.3); [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("t" + q)} at={c1 + q * 14} src="audio/sfx_tick.wav" vol={0.45} />)); }
    if (b.prop === "reveal") sfx.push(<Sfx key={k("b")} at={at} src="reel/sfx_boom.wav" vol={te ? 0.85 : 0.9} />, <Sfx key={k("c")} at={at} src={CLAP} vol={0.4} />, <Sfx key={k("z")} at={at + 4} src="reel/sfx_buzz.wav" vol={0.3} />);
    if (b.prop === "score") (T.scores as any[]).forEach((_, q) => sfx.push(<Sfx key={k("p" + q)} at={(q < (T.scores as any[]).length - 1 ? cue(i, 1, 0.3) + q * 18 : cue(i, 2, 0.75))} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "twist") sfx.push(<Sfx key={k("g")} at={cue(i, 1, 0.3) - 4} src="reel/sfx_glitch.wav" vol={0.45} />, <Sfx key={k("b")} at={cue(i, 1, 0.3)} src="reel/sfx_boom.wav" vol={0.7} />);
    if (b.prop === "fact") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 10)} src="audio/sfx_whoosh.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 1, 0.3)} src="audio/gag_ding.wav" vol={0.35} />);
    if (b.prop === "rule") [0, 1, 2].forEach((q) => sfx.push(<Sfx key={k("p" + q)} at={[at + 2, cue(i, 1, 0.3), cue(i, 1, 0.3) + 50][q]} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("z")} at={cue(i, 1, 0.3)} src="reel/sfx_buzz.wav" vol={0.45} />, <Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.4} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.95} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.45} />); }
  });
  const find = (prop: string) => beats.findIndex((b) => b.prop === prop);
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3333 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        c.fillStyle = "#1f2937"; c.fillRect(0, 0, W, H);
        const inChat = ["hook", "clip1", "clip2", "guess", "reveal", "twist", "loop"].includes(P);
        if (inChat) {
          c.font = SANS(fit(c, "WHICH ONE IS REALLY KITTU?", W - 100, 62), 900); c.fillStyle = "#fde68a"; c.textAlign = "center";
          c.fillText("WHICH ONE IS REALLY KITTU?", W / 2, 330);
          const mood = P === "reveal" || P === "twist" ? "shock" : "worried";
          person(c, "padma" as BillWho, [170, 960], 0.5, mood, "phone", false, r);
          phone(c, T.contact, P === "loop" ? seg(f, cu(1, 0.3), cu(1, 0.3) + 20) * (1 - seg(f, cu(1, 0.3) + 20, cu(1, 0.3) + 24)) : 0);
          const i1 = find("clip1"), i2 = find("clip2");
          const p1 = P === "clip1" ? seg(f, ln.from, endL) : i1 >= 0 && f > ls[i1].from + ls[i1].frames ? 1 : 0;
          const p2 = P === "clip2" ? seg(f, ln.from, endL) : i2 >= 0 && f > ls[i2].from + ls[i2].frames ? 1 : 0;
          const twisted = P === "twist" && seg(f, cu(1, 0.3), cu(1, 0.3) + 1) > 0;
          note(c, PH.y + 170, "voice note 1", "0:03", loopOn ? 0 : p1, P === "clip1", 11, twisted ? "#fee2e2" : "#fff");
          note(c, PH.y + 330, "voice note 2", "0:04", loopOn ? 0 : p2, P === "clip2", 22, P === "reveal" || P === "twist" ? "#fee2e2" : "#fff");
          if (P === "loop") {
            const kN = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
            if (kN > 0) { c.save(); c.globalAlpha = clamp(kN * 3); note(c, PH.y + 490, "voice note 3 · new", "0:04", 0, false, 33, "#dcfce7"); c.restore(); }
          } else payCard(c, T.pay, f / 30);
          if (P === "guess") {
            const c1 = cu(1, 0.3), t = f - c1;
            const n = t < 0 ? 3 : t < 14 ? 3 : t < 28 ? 2 : 1;
            c.save(); c.fillStyle = "rgba(15,23,42,0.72)"; c.beginPath(); c.arc(W / 2 + 130, PH.y + 330, 150, 0, 7); c.fill();
            c.strokeStyle = "#fde68a"; c.lineWidth = 14; c.beginPath(); c.arc(W / 2 + 130, PH.y + 330, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(t / 42)); c.stroke();
            c.font = SANS(170, 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText(String(n), W / 2 + 130, PH.y + 390); c.restore();
          }
          if (P === "reveal") {
            stamp(c, "A COPY", PH.x + PH.w / 2 + 40, PH.y + 395, 70, RED, seg(f, ln.from, ln.from + 6));
            chip(c, `made from ${T.refSecs} of his voice note`, W / 2, PH.y + 560, "#1e293b", "#f8fafc", seg(f, cu(1, 0.4), cu(1, 0.4) + 8), 40);
            chip(c, "by a voice-cloning service · in under 10 s", W / 2, PH.y + 650, "#1e293b", "#f8fafc", seg(f, cu(1, 0.4) + 20, cu(1, 0.4) + 28), 38);
          }
          if (P === "twist") {
            stamp(c, "ALSO A COMPUTER VOICE", PH.x + PH.w / 2 + 20, PH.y + 235, 52, "#7c3aed", seg(f, cu(1, 0.3), cu(1, 0.3) + 6), -0.06);
            chip(c, "Kittu isn't real · we made both · nobody real was copied", W / 2, PH.y + 560, "#ede9fe", "#4c1d95", seg(f, cu(1, 0.3) + 16, cu(1, 0.3) + 24), fit(c, "Kittu isn't real · we made both · nobody real was copied", 980, 36, 800));
          }
        } else if (P === "score") {
          c.font = SANS(fit(c, "HOW CLOSE TO KITTU?", W - 100, 62), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("HOW CLOSE TO KITTU?", W / 2, 330);
          c.font = SANS(fit(c, "a voice-matching program's score (0 = a stranger)", W - 120, 34, 700), 700); c.fillStyle = "#e2e8f0"; c.fillText("a voice-matching program's score (0 = a stranger)", W / 2, 385);
          const rows = T.scores as [string, number][];
          rows.forEach(([name, v], q) => {
            const last = q === rows.length - 1;
            const at = last ? cu(2, 0.75) : cu(1, 0.3) + q * 18;
            const k = seg(f, at, at + 14); if (k <= 0) return;
            const y = 450 + q * 190;
            c.save(); c.globalAlpha = clamp(k * 3);
            c.font = SANS(fit(c, name, 700, 40, 800), 800); c.fillStyle = "#f8fafc"; c.textAlign = "left"; c.fillText(name, 70, y + 40);
            const col = last ? "#94a3b8" : q === 0 ? "#4ade80" : "#f87171";
            c.fillStyle = "#334155"; rrect(c, 70, y + 62, 800, 70, 14); c.fill();
            c.fillStyle = col; rrect(c, 70, y + 62, 800 * (v / 100) * easeOut(k), 70, 14); c.fill();
            c.font = SANS(70, 900); c.fillStyle = col; c.textAlign = "right"; c.fillText(String(v), 1020, y + 122);
            c.restore();
          });
          chip(c, "the copy scores like Kittu himself", W / 2, 1300, "#fee2e2", "#7f1d1d", seg(f, cu(1, 0.3) + 30, cu(1, 0.3) + 38), 42);
        } else if (P === "fact") {
          const k = seg(f, cu(1, 0.3), cu(1, 0.3) + 8);
          c.font = SANS(fit(c, "NOT JUST A TRICK FOR A REEL", W - 100, 56), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("NOT JUST A TRICK FOR A REEL", W / 2, 340);
          c.save(); c.globalAlpha = clamp(k * 3);
          c.font = SANS(260, 900); c.fillStyle = "#f87171"; c.fillText("47%", W / 2, 650);
          c.font = SANS(44, 800); c.fillStyle = "#f8fafc"; wrap(c, "of Indians surveyed had faced an AI voice scam, or knew someone who had", W - 160).forEach((t, q) => c.fillText(t, W / 2, 760 + q * 58));
          c.font = SANS(fit(c, T.mcafeeSrc, W - 140, 34, 700), 700); c.fillStyle = "#94a3b8"; c.fillText(T.mcafeeSrc, W / 2, 960);
          c.restore();
        } else if (P === "rule") {
          const row = (y: number, n: string, t: string, sub: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = "#1e293b"; rrect(c, 60, y, W - 120, 190, 22); c.fill();
            c.font = SANS(76, 900); c.fillStyle = "#fde68a"; c.textAlign = "left"; c.fillText(n, 100, y + 120);
            c.font = SANS(fit(c, t, W - 300, 50, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(t, 190, y + 88);
            c.font = SANS(fit(c, sub, W - 300, 34, 700), 700); c.fillStyle = "#cbd5e1"; c.fillText(sub, 190, y + 145); c.restore();
          };
          c.font = SANS(fit(c, "BEFORE THE CALL COMES", W - 100, 60), 900); c.fillStyle = "#fde68a"; c.textAlign = "center"; c.fillText("BEFORE THE CALL COMES", W / 2, 330);
          row(390, "1", "a family code word", "agree it in person · never post it", seg(f, ln.from + 2, ln.from + 10));
          row(610, "2", "money call? hang up", "call back on the number you saved", seg(f, cu(1, 0.3), cu(1, 0.3) + 8));
          row(830, "3", "report it: 1930", "or cybercrime.gov.in", seg(f, cu(1, 0.3) + 50, cu(1, 0.3) + 58));
        }
      }} />
    </>
  );
};

export const CLONE33_SCENES = { sk_clone33: StClone };
