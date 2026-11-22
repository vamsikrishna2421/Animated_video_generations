import React from "react";
import { Ctx, rng, clamp, easeOut, seg } from "./crayon";
import { CrayonCanvas } from "./CrayonCanvas";
import { rrect, Sfx } from "./DistillCrayon";
import { INK } from "./WordsCrayon";
import { cueAt } from "./SkitCrayon";
import { person, BillWho } from "./BillCrayon";
import { fit, wrap, chip } from "./TutorialCrayon";

// Creative 37 "5 Reasons, 1 Email" (series/scripts/creative37_leave_email.md, v2): story mode, one storyteller. Five
// leave emails for the same Friday, their manager can approve two, all five asked an AI and say "personal reasons";
// Ramya's is her sister's engagement (all made up). Our test (series/scripts/creative37_demo, read by hand): the vague
// ask, 10 of 10 open "I hope this message/email finds you well", 0 of 10 give a real reason, 4 make up dates; with her
// facts, they come through (back Monday 9 of 10), but all 10 guess a month, 3 give Sravya the invoice report, 1 signs
// off "Qwen". The mini emails on screen are the test's own lines.
type Word = { w: string; from: number; to: number };
type Line = { from: number; frames: number; words?: Word[]; cues?: Record<string, number> };
type Beat = { prop: string; n: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };

const HOLD = 18;
const CLAP = "reel/creative09v1/clap.wav";
const RED = "#dc2626", GREEN = "#16a34a", HL = "#fde047";
const SANS = (s: number, w = 800) => `${w} ${s}px Arial, "Noto Sans Telugu", sans-serif`;
// the hold hit lands as "hold" ends (render review: a buzz on the word made it "unhauled"); Telugu: "హోల్డ్ లో పడింది"
// ends the line, so the hit waits for the line's last syllable (a hit 0.9 s after cue 3 made it "ఫోల్డు")
const holdAt = (ln: Line, c3: number) => { const w = (ln.words ?? []).find((x) => /^hold$/i.test(x.w.replace(/[^A-Za-z]/g, ""))); return w ? w.to - 2 : Math.max(c3 + 26, ln.from + ln.frames - 4); };

const bg = (c: Ctx, W: number, H: number) => { c.fillStyle = "#eff6ff"; c.fillRect(0, 0, W, H); c.fillStyle = "#dbeafe"; c.fillRect(0, 1180, W, H - 1180); };
const block = (c: Ctx, x: number, y: number, w: number, h: number, label: string, val: string, sub: string, bgc: string, fg: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3);
  c.fillStyle = bgc; rrect(c, x, y, w, h, 24); c.fill();
  c.textAlign = "center";
  c.font = SANS(fit(c, label, w - 40, 32, 900), 900); c.fillStyle = "#f8fafc"; c.fillText(label, x + w / 2, y + 50);
  c.font = SANS(fit(c, val, w - 40, 92, 900), 900); c.fillStyle = fg; c.fillText(val, x + w / 2, y + h / 2 + 34);
  if (sub) { c.font = SANS(fit(c, sub, w - 40, 32, 800), 800); c.fillStyle = "#f1f5f9"; c.fillText(sub, x + w / 2, y + h - 22); }
  c.restore();
};
const stamp = (c: Ctx, t: string, x: number, y: number, s: number, col: string, k: number, rot = -0.12) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(x, y); c.rotate(rot); const z = 1.5 - 0.5 * easeOut(k); c.scale(z, z);
  c.font = SANS(s, 900); const w = c.measureText(t).width;
  c.fillStyle = "rgba(255,255,255,0.95)"; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.fill();
  c.strokeStyle = col; c.lineWidth = 10; rrect(c, -w / 2 - 26, -s * 0.9, w + 52, s * 1.3, 16); c.stroke();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(t, 0, s * 0.1); c.restore();
};
// the inbox: five rows; `mine` is Ramya's row text (null = the vague one), `lit` lights her row
const inbox = (c: Ctx, x: number, y: number, w: number, T: Record<string, any>, mine: string | null, lit: number, ok: number) => {
  const rows = T.senders as string[];
  c.save(); c.fillStyle = "#ffffff"; rrect(c, x, y, w, 100 + rows.length * 82, 24); c.fill(); c.strokeStyle = "#1e293b"; c.lineWidth = 5; rrect(c, x, y, w, 100 + rows.length * 82, 24); c.stroke();
  c.fillStyle = "#1e293b"; rrect(c, x, y, w, 70, 24); c.fill(); c.fillRect(x, y + 40, w, 30);
  c.textAlign = "left"; c.font = SANS(34, 900); c.fillStyle = "#f8fafc"; c.fillText(T.inboxHead, x + 26, y + 48);
  rows.forEach((name, q) => {
    const ry = y + 86 + q * 82, me = q === 0;
    if (me && lit > 0) { c.save(); c.globalAlpha = clamp(lit * 3); c.fillStyle = ok > 0 ? "#dcfce7" : "#fef9c3"; rrect(c, x + 10, ry - 6, w - 20, 76, 14); c.fill(); c.strokeStyle = ok > 0 ? GREEN : "#ca8a04"; c.lineWidth = 5; rrect(c, x + 10, ry - 6, w - 20, 76, 14); c.stroke(); c.restore(); }
    c.font = SANS(32, 900); c.fillStyle = INK; c.textAlign = "left"; c.fillText(name, x + 28, ry + 28);
    const sub = me && mine ? mine : T.vague;
    c.font = SANS(fit(c, sub, w - 60, 30, 800), 800); c.fillStyle = me && mine ? "#166534" : "#475569"; c.fillText(sub, x + 28, ry + 60);
  });
  c.restore();
};
// one of the ten mini emails from the vague ask (the test's own greeting, opening and dates)
const mini = (c: Ctx, x: number, y: number, w: number, h: number, m: [string, string, string, string], kO: number, kN: number, kD: number, k: number) => {
  if (k <= 0) return;
  const [greet, open, reason, date] = m;
  c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 40);
  c.fillStyle = "#ffffff"; rrect(c, x, y, w, h, 16); c.fill(); c.strokeStyle = "#94a3b8"; c.lineWidth = 3; rrect(c, x, y, w, h, 16); c.stroke();
  c.textAlign = "left";
  c.font = SANS(25, 800); c.fillStyle = INK; c.fillText(greet, x + 16, y + 36);
  c.font = SANS(fit(c, open, w - 36, 24, 700), 700); const ow = c.measureText(open).width;
  if (kO > 0) { c.fillStyle = `rgba(253,224,71,${clamp(kO * 3)})`; rrect(c, x + 12, y + 48, ow + 10, 32, 8); c.fill(); }
  c.fillStyle = "#334155"; c.fillText(open, x + 16, y + 72);
  c.font = SANS(fit(c, reason, w - 36, 24, 700), 700); const rw = c.measureText(reason).width;
  if (kN > 0) { c.fillStyle = `rgba(254,202,202,${clamp(kN * 3)})`; rrect(c, x + 12, y + 84, rw + 10, 32, 8); c.fill(); }
  c.fillStyle = kN > 0 ? RED : "#334155"; c.fillText(reason, x + 16, y + 108);
  if (date && kD > 0) { c.save(); c.globalAlpha = clamp(kD * 3); c.font = SANS(fit(c, date, w - 40, 26, 900), 900); const dw = c.measureText(date).width; c.fillStyle = RED; rrect(c, x + w - dw - 34, y + h - 44, dw + 22, 36, 10); c.fill(); c.fillStyle = "#fff"; c.fillText(date, x + w - dw - 23, y + h - 17); c.restore(); }
  c.restore();
};
const counter = (c: Ctx, W: number, big: string, lab: string, col: string, k: number) => {
  if (k <= 0) return;
  c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = col; rrect(c, 60, 1210, W - 120, 120, 22); c.fill();
  c.textAlign = "left"; c.font = SANS(76, 900); c.fillStyle = "#fff"; c.fillText(big, 96, 1296);
  const bw = c.measureText(big).width; c.font = SANS(fit(c, lab, W - 220 - bw, 44, 900), 900); c.fillStyle = "#fef9c3"; c.fillText(lab, 126 + bw, 1288); c.restore();
};

const StLeave: React.FC<SP> = ({ s }) => {
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
    if (b.prop === "hook") sfx.push(<Sfx key={k("b")} at={1} src="reel/sfx_boom.wav" vol={te ? 0.8 : 0.5} />, <Sfx key={k("c")} at={2} src={CLAP} vol={te ? 0.7 : 0.45} />, <Sfx key={k("p")} at={cue(i, 1, 0.35) - 4} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("d")} at={cue(i, 2, 0.6) - 4} src="audio/gag_ding.wav" vol={0.3} />, <Sfx key={k("h")} at={holdAt(l, cue(i, 3, 0.9))} src="reel/sfx_buzz.wav" vol={0.45} />, <Sfx key={k("hb")} at={holdAt(l, cue(i, 3, 0.9))} src="reel/sfx_boom.wav" vol={0.5} />);
    if (b.prop === "test") [1, 2, 3].forEach((n) => sfx.push(<Sfx key={k("p" + n)} at={cue(i, n, [0.4, 0.6, 0.85][n - 1]) - 6} src="audio/sfx_pop.wav" vol={0.35} />));
    if (b.prop === "facts") sfx.push(<Sfx key={k("w")} at={Math.max(0, at - 8)} src="audio/sfx_whoosh.wav" vol={0.3} />, <Sfx key={k("s")} at={cue(i, 2, 0.4) - 4} src="audio/sfx_success.wav" vol={0.3} />, <Sfx key={k("m")} at={cue(i, 3, 0.55) - 4} src="audio/sfx_pop.wav" vol={0.35} />, <Sfx key={k("x")} at={cue(i, 4, 0.7) - 4} src="audio/gag_bonk.wav" vol={0.45} />, <Sfx key={k("q")} at={cue(i, 5, 0.85) - 4} src="audio/gag_ding.wav" vol={0.4} />);
    if (b.prop === "rule") sfx.push(...[1, 2, 3].map((n) => <Sfx key={k("p" + n)} at={cue(i, n, 0.2 * n) - 4} src="audio/sfx_pop.wav" vol={0.35} />), <Sfx key={k("s")} at={cue(i, 4, 0.8) - 4} src="audio/sfx_success.wav" vol={0.3} />);
    if (b.prop === "payoff") sfx.push(<Sfx key={k("a")} at={cue(i, 1, 0.5) - 2} src="audio/sfx_success.wav" vol={0.35} />, <Sfx key={k("c")} at={cue(i, 1, 0.5) - 2} src={CLAP} vol={0.35} />);
    if (b.prop === "loop") { const slam = end + HOLD; sfx.push(<Sfx key={k("q")} at={Math.max(0, end - 36)} src="reel/sfx_riser.wav" vol={0.35} />, <Sfx key={k("h")} at={slam} src="reel/sfx_boom.wav" vol={0.9} />, <Sfx key={k("c")} at={slam} src={CLAP} vol={0.5} />); }
  });
  return (
    <>
      {sfx}
      <CrayonCanvas draw={(c, W, H, f, boil) => {
        const i = idx(f), b = beats[i], ln = ls[i];
        const r = rng(3737 + boil);
        const cu = (k: number, frac: number) => cueAt(ln, k, /^$/, ln.from + Math.round(ln.frames * frac));
        const endL = ln.from + ln.frames;
        const loopOn = b.prop === "loop" && f >= endL + HOLD;
        const P = loopOn ? "hook" : b.prop;
        bg(c, W, H);
        c.textAlign = "left";
        if (P === "hook" || P === "loop") {
          const full = loopOn || P === "loop";
          const kLit = full ? 0 : seg(f, cu(2, 0.6) - 4, cu(2, 0.6) + 6), kHold = full ? 1 : seg(f, holdAt(ln, cu(3, 0.9)), holdAt(ln, cu(3, 0.9)) + 8);
          c.save(); c.fillStyle = "#1e293b"; rrect(c, 60, 270, W - 120, 84, 18); c.fill();
          c.font = SANS(fit(c, T.bar, W - 160, 46, 900), 900); c.fillStyle = HL; c.textAlign = "center"; c.fillText(T.bar, W / 2, 328); c.restore();
          block(c, 40, 380, 490, 300, T.leftLab, T.leftVal, T.leftSub, "#14532d", "#bbf7d0", 1);
          block(c, 550, 380, 490, 300, T.rightLab, T.rightVal, T.rightSub, "#7f1d1d", "#fecaca", 1);
          person(c, "ramya" as BillWho, [215, 1150], 0.68, kHold > 0.5 ? "shock" : "worried", "phone", false, r);
          inbox(c, 400, 705, 640, T, null, kLit, 0);
          stamp(c, T.hold, 560, 1270, 62, RED, kHold);
          if (kLit > 0 && !full && kHold < 1) {   // render review: the link "her real reason isn't in her email" must read on a phone
            c.save(); c.globalAlpha = clamp(kLit * 3) * (1 - kHold); c.translate(0, (1 - easeOut(clamp(kLit * 1.5))) * 30);
            c.fillStyle = "#fef9c3"; rrect(c, 420, 870, 600, 230, 22); c.fill(); c.strokeStyle = "#ca8a04"; c.lineWidth = 6; rrect(c, 420, 870, 600, 230, 22); c.stroke();
            c.textAlign = "left"; c.font = SANS(40, 900); c.fillStyle = INK; wrap(c, T.realTag, 540).slice(0, 2).forEach((s2, q) => c.fillText(s2, 450, 930 + q * 50));
            c.font = SANS(50, 900); c.fillStyle = RED; c.fillText(T.realNot, 450, 1070); c.restore();
          }
          if (P === "hook" && !loopOn && f >= cu(1, 0.35) - 4 && f < cu(2, 0.6) - 4) chip(c, T.story, W / 2, 1372, "#1e293b", "#f8fafc", 1, 38);
        } else if (P === "test") {
          c.textAlign = "center"; c.font = SANS(54, 900); c.fillStyle = "#1e3a8a"; c.fillText(T.testHead, W / 2, 330);
          c.font = SANS(fit(c, T.model, W - 100, 34, 800), 800); c.fillStyle = "#475569"; c.fillText(T.model, W / 2, 380);
          const c2 = cu(1, 0.4), c3 = cu(2, 0.6), c4 = cu(3, 0.85);
          const kA = seg(f, ln.from + 2, ln.from + 10) * (1 - seg(f, c2 - 10, c2 - 2));
          if (kA > 0) {
            c.save(); c.globalAlpha = clamp(kA * 3);
            c.fillStyle = "#dcf8c6"; rrect(c, 100, 470, W - 200, 300, 28); c.fill();
            c.textAlign = "left"; c.font = SANS(34, 800); c.fillStyle = "#475569"; c.fillText(T.askLab, 140, 530);
            c.font = SANS(50, 900); c.fillStyle = INK; wrap(c, T.ask, W - 280).slice(0, 4).forEach((t, q) => c.fillText(t, 140, 598 + q * 60));
            for (let q = 0; q < 10; q++) { const kq = seg(f, ln.from + 14 + q * 3, ln.from + 20 + q * 3); if (kq <= 0) continue; c.globalAlpha = clamp(kA * 3) * clamp(kq * 3); c.fillStyle = "#1e293b"; rrect(c, 120 + q * 86, 820, 72, 60, 14); c.fill(); c.fillStyle = HL; c.font = SANS(30, 900); c.textAlign = "center"; c.fillText(`${q + 1}`, 156 + q * 86, 862); }
            c.restore();
          }
          const minis = T.minis as [string, string, string, string][];
          minis.forEach((m, q) => {
            const col = q % 2, row = Math.floor(q / 2);
            mini(c, 50 + col * 500, 420 + row * 156, 480, 144, m, seg(f, c2 - 4, c2 + 6), seg(f, c3 - 4, c3 + 6), seg(f, c4 - 4, c4 + 6), seg(f, c2 - 8 + q, c2 + q));
          });
          if (f >= c4 - 4) counter(c, W, T.cDate[0], T.cDate[1], RED, seg(f, c4 - 4, c4 + 4));
          else if (f >= c3 - 4) counter(c, W, T.cReason[0], T.cReason[1], "#7f1d1d", seg(f, c3 - 4, c3 + 4));
          else if (f >= c2 - 4) counter(c, W, T.cOpen[0], T.cOpen[1], "#1e3a8a", seg(f, c2 - 4, c2 + 4));
        } else if (P === "facts") {
          c.textAlign = "center"; c.font = SANS(fit(c, T.factsHead, W - 100, 50, 900), 900); c.fillStyle = "#1e3a8a"; c.fillText(T.factsHead, W / 2, 330);
          const c1 = cu(1, 0.2), c2 = cu(2, 0.4), c3 = cu(3, 0.55), c4 = cu(4, 0.7), c5 = cu(5, 0.85);
          (T.facts as [string, string][]).forEach(([t, n], q) => {
            const kq = seg(f, c1 + q * 8, c1 + q * 8 + 8); if (kq <= 0) return;
            const x = q === 4 ? 60 : 60 + (q % 2) * 490, y = 370 + Math.floor(q / 2) * 112, w = q === 4 ? W - 120 : 470, ok = f >= c2 - 4;
            c.save(); c.globalAlpha = clamp(kq * 3); c.fillStyle = ok ? "#dcfce7" : "#ffffff"; rrect(c, x, y, w, 96, 20); c.fill(); c.strokeStyle = ok ? GREEN : "#1e293b"; c.lineWidth = 5; rrect(c, x, y, w, 96, 20); c.stroke();
            c.textAlign = "left"; c.font = SANS(fit(c, t, w - 130, 40, 900), 900); c.fillStyle = INK; c.fillText(t, x + 20, y + 62);
            if (ok) { c.textAlign = "right"; c.font = SANS(34, 900); c.fillStyle = GREEN; c.fillText(n, x + w - 22, y + 62); }
            c.restore();
          });
          const card = (y: number, h: number, big: string, lab: string, l2: string, l3: string, k: number) => {
            if (k <= 0) return;
            c.save(); c.globalAlpha = clamp(k * 3); c.translate(0, (1 - easeOut(clamp(k * 1.5))) * 30); c.fillStyle = "#7f1d1d"; rrect(c, 60, y, W - 120, h, 22); c.fill();
            c.textAlign = "left"; c.font = SANS(58, 900); c.fillStyle = "#fff"; c.fillText(big, 92, y + 70);
            const bw = c.measureText(big).width; c.font = SANS(fit(c, lab, W - 220 - bw, 40, 900), 900); c.fillStyle = "#fecaca"; c.fillText(lab, 120 + bw, y + 64);
            c.font = SANS(fit(c, l2, W - 180, 32, 800), 800); c.fillStyle = "#fef9c3"; c.fillText(l2, 92, y + 116);
            if (l3) { c.font = SANS(fit(c, l3, W - 180, 28, 700), 700); c.fillStyle = "#fecaca"; c.fillText(l3, 92, y + 156); }
            c.restore();
          };
          card(706, 150, T.monthN, T.monthLab, T.monthSub, "", seg(f, c3 - 4, c3 + 4));
          const kW = seg(f, c4 - 4, c4 + 4);
          if (kW > 0) {   // render review: the 3/10 quote in large type explains itself
            c.save(); c.globalAlpha = clamp(kW * 3); c.translate(0, (1 - easeOut(clamp(kW * 1.5))) * 30); c.fillStyle = "#7f1d1d"; rrect(c, 60, 870, W - 120, 250, 22); c.fill();
            c.textAlign = "left"; c.font = SANS(58, 900); c.fillStyle = "#fff"; c.fillText(T.wrongN, 92, 940);
            const bw = c.measureText(T.wrongN).width; c.font = SANS(fit(c, T.wrongLab, W - 220 - bw, 42, 900), 900); c.fillStyle = "#fecaca"; c.fillText(T.wrongLab, 120 + bw, 934);
            c.font = SANS(38, 800); c.fillStyle = "#fef9c3"; wrap(c, T.wrongQuote, W - 190).slice(0, 2).forEach((s2, q) => c.fillText(s2, 92, 992 + q * 46));
            c.font = SANS(fit(c, T.wrongSub, W - 180, 32, 800), 800); c.fillStyle = "#fecaca"; c.fillText(T.wrongSub, 92, 1094); c.restore();
          }
          const kQ = seg(f, c5 - 4, c5 + 4);
          if (kQ > 0) {
            c.save(); c.globalAlpha = clamp(kQ * 3); c.translate(0, (1 - easeOut(clamp(kQ * 1.5))) * 40);
            c.fillStyle = "#ffffff"; rrect(c, 60, 1135, 560, 250, 20); c.fill(); c.strokeStyle = "#1e293b"; c.lineWidth = 4; rrect(c, 60, 1135, 560, 250, 20); c.stroke();
            c.textAlign = "left"; c.font = SANS(38, 700); c.fillStyle = "#334155"; c.fillText("Best regards,", 100, 1192);
            c.font = SANS(68, 900); c.fillStyle = RED; c.fillText(T.signName, 100, 1272);
            const nw = c.measureText(T.signName).width;
            c.strokeStyle = RED; c.lineWidth = 7; c.beginPath(); c.ellipse(100 + nw / 2, 1250, nw / 2 + 32, 52, 0, 0, 7); c.stroke();
            c.font = SANS(36, 700); c.fillStyle = "#334155"; c.fillText("[Your Name]", 100, 1356); c.restore();
            stamp(c, T.signTag, 830, 1250, 40, RED, kQ, 0.08);
          }
        } else if (P === "rule") {
          c.textAlign = "center"; c.font = SANS(56, 900); c.fillStyle = "#1e3a8a"; c.fillText(T.ruleHead, W / 2, 330);
          const k0 = seg(f, ln.from + 2, ln.from + 10);
          if (k0 > 0) {
            c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = "#ffffff"; rrect(c, 60, 370, W - 120, 470, 28); c.fill(); c.strokeStyle = "#1e293b"; c.lineWidth = 6; rrect(c, 60, 370, W - 120, 470, 28); c.stroke(); c.restore();
            stamp(c, "SCREENSHOT THIS", 800, 836, 38, "#2563eb", k0, -0.05);
          }
          (T.three as string[]).forEach((t, q) => {
            const kq = seg(f, cu(q + 1, 0.2 * (q + 1)) - 4, cu(q + 1, 0.2 * (q + 1)) + 4); if (kq <= 0) return;
            c.save(); c.globalAlpha = clamp(kq * 3); c.translate((1 - easeOut(clamp(kq * 1.5))) * 40, 0);
            c.fillStyle = "#1e3a8a"; c.beginPath(); c.arc(140, 470 + q * 140, 42, 0, 7); c.fill();
            c.font = SANS(50, 900); c.fillStyle = HL; c.textAlign = "center"; c.fillText(`${q + 1}`, 140, 488 + q * 140);
            c.textAlign = "left"; c.font = SANS(fit(c, t, W - 330, 50, 900), 900); c.fillStyle = INK; c.fillText(t, 210, 488 + q * 140); c.restore();
          });
          const k4 = seg(f, cu(4, 0.8) - 4, cu(4, 0.8) + 6);
          if (k4 > 0) {
            c.save(); c.globalAlpha = clamp(k4 * 3); c.fillStyle = "#7f1d1d"; rrect(c, 60, 880, W - 120, 330, 24); c.fill();
            c.textAlign = "center"; c.font = SANS(44, 900); c.fillStyle = "#fecaca"; c.fillText(T.checkHead, W / 2, 950); c.restore();
            (T.checks as string[]).forEach((t, q) => chip(c, t, W / 2, 1030 + q * 66, "#ffffff", "#7f1d1d", seg(f, cu(4, 0.8) + q * 6, cu(4, 0.8) + q * 6 + 6), fit(c, t, W - 240, 40, 900)));
          }
        } else if (P === "payoff") {
          const kOk = seg(f, cu(1, 0.5) - 2, cu(1, 0.5) + 6);
          c.textAlign = "center"; c.font = SANS(fit(c, T.payHead, W - 100, 50, 900), 900); c.fillStyle = "#1e3a8a"; c.fillText(T.payHead, W / 2, 330);
          const k0 = seg(f, ln.from, ln.from + 8);
          c.save(); c.globalAlpha = clamp(k0 * 3); c.fillStyle = "#ffffff"; rrect(c, 60, 380, W - 120, 560, 26); c.fill(); c.strokeStyle = kOk > 0 ? GREEN : "#1e293b"; c.lineWidth = 6; rrect(c, 60, 380, W - 120, 560, 26); c.stroke();
          (T.mail as [string, string][]).forEach(([k2, v2], q) => {
            const y = 470 + q * 100; c.textAlign = "left"; c.font = SANS(34, 900); c.fillStyle = "#64748b"; c.fillText(k2.toUpperCase(), 100, y);
            c.font = SANS(fit(c, v2, W - 400, 46, 900), 900); c.fillStyle = INK; c.fillText(v2, 300, y);
          });
          c.restore();
          person(c, "ramya" as BillWho, [250, 1350], 0.55, kOk > 0.5 ? "happy" : "calm", "phone", false, r);
          stamp(c, T.approved, 720, 1030, 70, GREEN, kOk, -0.08);
          if (f >= cu(1, 0.5)) chip(c, T.payWhy, 720, 1180, "#14532d", "#f0fdf4", seg(f, cu(1, 0.5) + 4, cu(1, 0.5) + 12), fit(c, T.payWhy, 560, 40, 900));
        }
        c.textAlign = "left";
      }} />
    </>
  );
};

export const LEAVE37_SCENES = { sk_leave37: StLeave };
