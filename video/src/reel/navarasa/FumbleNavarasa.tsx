import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Fonts } from "../../components/Fonts";
import { easeBack, FPose, Fumble, mix } from "../Fumble";
import { Extras, FumbleFace, RASAS, Rasa } from "../FumbleRasa";
import TL from "./timeline.json";

// "AI NAVARASALU": Mr. Fumble's nine emotions of every AI user. Silent comedy: top = his laptop screen (the trigger),
// bottom = his face snapping into the emotion with a punch-zoom, a colour flash, a label stamp and a sting.
// Beat timing lives in timeline.json (shared with pipeline/navarasa_audio.py).

export const NAV_FPS = TL.fps;
export const NAV_LEN = Math.round(TL.total * TL.fps);
const F = (s: number) => Math.round(s * TL.fps);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
const ANTON = "Anton, Impact, 'DejaVu Sans', sans-serif";
const INTER = "Inter, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', monospace";

const COL: Record<string, [string, string]> = {
  adbhuta: ["#6d28d9", "#fde047"], shringara: ["#db2777", "#ffe4e6"], hasya: ["#f59e0b", "#fffbeb"],
  bhayanaka: ["#1e3a8a", "#bfdbfe"], bibhatsa: ["#4d7c0f", "#ecfccb"], raudra: ["#b91c1c", "#fee2e2"],
  karuna: ["#475569", "#e2e8f0"], veera: ["#ea580c", "#fff7ed"], shanta: ["#0f766e", "#ccfbf1"],
};
const rasaOf = (k: string) => RASAS.find((r) => r.key === k) as Rasa;

// Reading the screen: looking up, eyes sweeping along the lines.
const NEUTRAL: FPose = { still: true, breath: 0.5, lookY: -0.7, browL: 0.2, browR: 0.2, mw: 0.45, smile: 0.08, lid: 0.12 };
const reading = (tb: number): FPose => ({ ...NEUTRAL, lookX: -0.45 + 0.9 * ((tb % 24) / 24) });

// Per-emotion life after the snap (ts = frames since the snap).
const live = (key: string, ts: number, p: FPose): FPose => {
  const g = clamp(ts / 20), s = Math.sin;
  switch (key) {
    case "adbhuta": return { ...p, neck: (p.neck ?? 0) + 6 * g, eyeSize: (p.eyeSize ?? 1) + 0.05 * s(ts / 3) };
    case "shringara": return { ...p, tilt: (p.tilt ?? 0) + 6 * s(ts / 7) };
    case "hasya": return { ...p, tilt: (p.tilt ?? 0) + 7 * s(ts * 0.9), neck: (p.neck ?? 0) + 5 * s(ts * 1.8) };
    case "bhayanaka": return { ...p, tilt: (p.tilt ?? 0) + 1.8 * s(ts * 2.6), lookX: -0.5 + 0.9 * (s(ts / 4) > 0 ? 1 : 0) };
    case "bibhatsa": return { ...p, turn: (p.turn ?? 0) - 0.15 * g, tilt: (p.tilt ?? 0) - 5 * g };
    case "raudra": return { ...p, tilt: (p.tilt ?? 0) + 2.4 * s(ts * 2.2), blush: 0.75 + 0.25 * s(ts / 2) };
    case "karuna": return { ...p, lipOut: (p.lipOut ?? 0) + 0.12 * s(ts * 1.6), neck: (p.neck ?? 0) - 6 * clamp(ts / 30) };
    case "veera": return { ...p, neck: (p.neck ?? 0) + 4 * g };
    case "shanta": return { ...p, tilt: (p.tilt ?? 0) + 2 * s(ts / 14) };
    default: return p;
  }
};
const finalPose = (b: (typeof TL.beats)[number]) => live(b.key, F(b.end - b.snap), rasaOf(b.key).pose);

// ---------------- screens (inner area ~924 x 414) ----------------
const typed = (txt: string, t: number, cps = 2.2) => txt.slice(0, Math.max(0, Math.floor(t * cps)));
const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; op?: number; fs?: number }> = ({ me, children, op = 1, fs = 38 }) => (
  <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: fs < 38 ? "96%" : "82%", background: me ? "#2563eb" : "#e2e8f0", color: me ? "white" : "#0f172a", borderRadius: 26, padding: "14px 22px", fontFamily: INTER, fontWeight: 600, fontSize: fs, lineHeight: 1.25, opacity: op }}>{children}</div>
);
const Chat: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24, height: "100%", boxSizing: "border-box", background: "#f8fafc" }}>{children}</div>
);
const Check: React.FC<{ s?: number }> = ({ s = 40 }) => (
  <svg width={s} height={s} viewBox="0 0 40 40" style={{ verticalAlign: "middle" }}><circle cx={20} cy={20} r={19} fill="#16a34a" /><path d="M 11,21 L 18,28 L 30,13" stroke="white" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const POEM = ["Steam curls up like a morning thought,", "ginger and cardamom, sugar caught.", "One sip and the day turns kind,", "chai is a hug for the mind."];
const ScrWonder: React.FC<{ t: number }> = ({ t }) => (
  <Chat>
    <Bubble me>{typed("Write a poem about chai", t, 3)}</Bubble>
    {t > 9 && <Bubble fs={33}>{POEM.map((l, i) => <div key={i}>{typed(l, t - 9 - i * 3.5, 9)}</div>)}</Bubble>}
    {t > 22 && <div style={{ position: "absolute", right: 26, bottom: 22, background: "#f97316", color: "white", fontFamily: ANTON, fontSize: 46, padding: "2px 20px", borderRadius: 14, transform: `rotate(-5deg) scale(${easeBack(clamp((t - 22) / 6))})` }}>DONE IN 0:03</div>}
  </Chat>
);

const ScrLove: React.FC<{ t: number }> = ({ t }) => {
  const fixed = t > 14;
  const left = 118 - Math.floor(t / 30);
  const cell = (v: string, bad?: boolean) => (
    <div style={{ border: "2px solid #cbd5e1", padding: "8px 10px", fontFamily: MONO, fontSize: 40, textAlign: "center", color: bad && !fixed ? "#dc2626" : bad ? "#16a34a" : "#0f172a", background: bad && !fixed ? "#fee2e2" : bad ? "#dcfce7" : "white", fontWeight: bad ? 700 : 400 }}>{bad && !fixed ? "#N/A" : v}</div>
  );
  return (
    <div style={{ height: "100%", background: "#f8fafc", padding: 22, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ background: "#dc2626", color: "white", fontFamily: ANTON, fontSize: 40, padding: "0 16px", borderRadius: 10 }}>DEADLINE</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, color: "#dc2626" }}>{`0:0${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", width: "100%" }}>
        {cell("1,240")}{cell("980", true)}{cell("2,310", true)}{cell("870")}{cell("1,455", true)}{cell("3,020")}
      </div>
      {fixed && <Bubble><Check s={36} /> Fixed it.</Bubble>}
    </div>
  );
};

const Hand7: React.FC<{ n: number }> = ({ n }) => {
  const fingers = Array.from({ length: 7 }, (_, i) => -66 + i * 22);
  return (
    <svg width={330} height={300} viewBox="-165 -170 330 300">
      {fingers.map((a, i) => (
        <g key={i} transform={`rotate(${a})`}>
          <rect x={-15} y={-150} width={30} height={110} rx={15} fill="#f2c9a5" stroke="#b07a55" strokeWidth={4} />
          {i < n && <g transform={`translate(0,-170) rotate(${-a})`}><circle r={17} fill="#ef4444" /><text y={8} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={22} fill="white">{i + 1}</text></g>}
        </g>
      ))}
      <ellipse cx={0} cy={0} rx={92} ry={78} fill="#f2c9a5" stroke="#b07a55" strokeWidth={4} />
      <rect x={-50} y={60} width={100} height={70} fill="#f2c9a5" stroke="#b07a55" strokeWidth={4} />
    </svg>
  );
};
const WALL = "Great question! The answer depends on several important factors. First, let's consider the broader context. Historically, experts have debated this topic at length. On one hand, there are compelling arguments in favour. On the other hand, it is worth noting several considerations. Additionally, individual circumstances may vary. Furthermore, it is essential to weigh the pros and cons carefully. In many cases, the best approach is nuanced. Ultimately, the right answer depends on your specific goals, preferences and situation. In conclusion, ".repeat(3);
const ScrLaugh: React.FC<{ t: number; ts: number }> = ({ t, ts }) => (
  <Chat>
    <Bubble me fs={44}>Yes or no?</Bubble>
    {t > 5 && (
      <div style={{ alignSelf: "flex-start", width: "100%", height: 300, overflow: "hidden", background: "#e2e8f0", borderRadius: 22, padding: "10px 16px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 21, lineHeight: 1.25, color: "#334155", transform: `translateY(${-Math.max(0, t - 8) * 9}px)` }}>{WALL}</div>
      </div>
    )}
    {ts > 3 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center" }}><span style={{ background: "#dc2626", color: "white", fontFamily: ANTON, fontSize: 50, padding: "2px 20px", borderRadius: 12, display: "inline-block", transform: `rotate(-3deg) scale(${easeBack(clamp((ts - 3) / 6))})` }}>IT WAS A YES/NO QUESTION</span></div>}
  </Chat>
);

const ScrFear: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ height: "100%", background: "#f8fafc", padding: "20px 26px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 60, height: 60, borderRadius: 30, background: "linear-gradient(135deg,#0f766e,#14b8a6)" }} /><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#0f172a" }}>Manager</div></div>
    <div style={{ alignSelf: "flex-start", background: "#0b1020", borderRadius: 20, padding: "14px 22px", width: "86%", boxSizing: "border-box" }}>
      <span style={{ background: "#dc2626", color: "white", fontFamily: ANTON, fontSize: 28, padding: "0 10px", letterSpacing: 1 }}>BREAKING</span>
      <div style={{ fontFamily: ANTON, fontSize: 64, lineHeight: 1.0, color: "white", marginTop: 6 }}>AI WILL TAKE YOUR JOB</div>
    </div>
    {t > 11 && <div style={{ alignSelf: "flex-start", background: "#e2e8f0", borderRadius: 26, padding: "8px 26px", fontFamily: INTER, fontWeight: 800, fontSize: 64, color: "#0f172a", transform: `scale(${easeBack(clamp((t - 11) / 6))})`, transformOrigin: "0% 50%" }}>FYI :)</div>}
  </div>
);

const ScrDisgust: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ height: "100%", background: "#f8fafc", padding: "22px 28px", boxSizing: "border-box", position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg,#f59e0b,#db2777)" }} />
      <div><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 34, color: "#0f172a" }}>Growth Guru</div><div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, color: "#64748b" }}>Thought Leader</div></div>
    </div>
    <div style={{ marginTop: 16, display: "inline-block", background: "#fde047", fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#0f172a", padding: "2px 10px", borderRadius: 6 }}>Certainly! Here's a heartfelt post:</div>
    {t > 6 && <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#0f172a", lineHeight: 1.15, marginTop: 14 }}>{typed("Humbled & honoured to announce...", t - 6, 7)}</div>}
    {t > 14 && <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 38, color: "#2563eb", marginTop: 10 }}>#blessed #synergy</div>}
  </div>
);

const ScrAnger: React.FC<{ t: number; ts: number }> = ({ t, ts }) => (
  <Chat>
    <Bubble fs={36}>Australia's capital is Sydney.</Bubble>
    {t > 13 && <Bubble me fs={36}>Wrong.</Bubble>}
    {t > 22 && (
      <Bubble fs={36}>
        {typed("You're absolutely right! It's ", t - 22, 6)}
        {t > 22 + 31 / 6 && <span>Sydney.</span>}
      </Bubble>
    )}
    {ts > 6 && <div style={{ position: "absolute", right: 26, bottom: 20, background: "#dc2626", color: "white", fontFamily: ANTON, fontSize: 52, padding: "2px 20px", borderRadius: 12, transform: `rotate(-4deg) scale(${easeBack(clamp((ts - 6) / 6))})` }}>(IT'S CANBERRA)</div>}
  </Chat>
);

const ScrSorrow: React.FC<{ t: number }> = ({ t }) => {
  const left = 4 * 3600 - 1 - Math.floor(t / 30);
  const hh = Math.floor(left / 3600), mm = Math.floor((left % 3600) / 60), ss = left % 60;
  return (
    <div style={{ height: "100%", background: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 720, background: "white", borderRadius: 26, padding: "26px 32px", boxShadow: "0 20px 40px rgba(0,0,0,0.35)", transform: `scale(${0.9 + 0.1 * easeOut(t / 8)})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#0f172a" }}>Usage limit reached</div>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 36, color: "#334155", marginTop: 10, lineHeight: 1.28 }}>You've reached your usage limit. Try again in 4 hours.</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 30, color: "#64748b" }}>{`${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}</div>
          <div style={{ marginLeft: "auto", background: "#cbd5e1", color: "#64748b", fontFamily: INTER, fontWeight: 800, fontSize: 28, padding: "8px 30px", borderRadius: 14 }}>OK</div>
        </div>
      </div>
    </div>
  );
};
const PROMPT = ["Act as a senior chef.", "Explain step by step.", "Give 3 examples.", "Answer in a table."];
const ScrCourage: React.FC<{ t: number; ts: number }> = ({ t, ts }) => {
  const sent = ts >= 0;
  const cx = 860 - 200 * (1 - clamp(t / 26)), cy = 330 - 120 * (1 - clamp(t / 26));
  return (
    <div style={{ height: "100%", background: "#f8fafc", padding: "18px 26px", boxSizing: "border-box", position: "relative", fontFamily: INTER }}>
      <div style={{ fontSize: 34, fontWeight: 600, color: "#64748b", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>To: <span style={{ color: "#0f172a", fontWeight: 800 }}>Boss</span></div>
      <div style={{ fontSize: 34, fontWeight: 600, color: "#64748b", borderBottom: "2px solid #e2e8f0", padding: "8px 0" }}>Subject: <span style={{ color: "#0f172a", fontWeight: 800 }}>Final report</span></div>
      <div style={{ marginTop: 12, background: "#eef2ff", borderRadius: 14, padding: "12px 16px", fontSize: 34, fontWeight: 600, color: "#4338ca", fontStyle: "italic" }}>[AI answer, pasted]</div>
      <div style={{ position: "absolute", left: 26, bottom: 20, background: "#dc2626", color: "white", fontFamily: ANTON, fontSize: 58, padding: "0 18px", borderRadius: 12, transform: "rotate(-5deg)", opacity: clamp((t - 8) / 4) }}>DIDN'T READ IT</div>
      <div style={{ position: "absolute", right: 30, bottom: 24, background: sent ? "#16a34a" : "#2563eb", color: "white", fontFamily: ANTON, fontSize: 48, padding: "4px 34px", borderRadius: 14, transform: `scale(${sent && ts < 4 ? 0.9 : 1})` }}>{sent ? "SENT ✓" : "SEND"}</div>
      {!sent && <svg width={44} height={56} style={{ position: "absolute", left: cx, top: cy }} viewBox="0 0 44 56"><path d="M 4,4 L 4,46 L 15,36 L 23,54 L 31,50 L 23,32 L 38,32 Z" fill="white" stroke="#111" strokeWidth={4} strokeLinejoin="round" /></svg>}
    </div>
  );
};

const ScrPeace: React.FC<{ t: number; ts: number }> = ({ t, ts }) => (
  <Chat>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(135deg,#334155,#64748b)" }} /><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#0f172a" }}>Boss</div></div>
    {ts < -1 ? (
      <div style={{ alignSelf: "flex-start", background: "#e2e8f0", borderRadius: 30, padding: "24px 32px", display: "flex", gap: 16, marginTop: 10 }}>
        {[0, 1, 2].map((k) => <div key={k} style={{ width: 26, height: 26, borderRadius: 13, background: "#64748b", opacity: 0.35 + 0.65 * (Math.floor(t / 5) % 3 === k ? 1 : 0) }} />)}
      </div>
    ) : (
      <div style={{ alignSelf: "flex-start", background: "#e2e8f0", color: "#0f172a", borderRadius: 26, padding: "16px 26px", fontFamily: INTER, fontWeight: 800, fontSize: 54, transform: `scale(${easeBack(clamp((ts + 1) / 6))})`, transformOrigin: "0% 50%" }}>Perfect, thanks!</div>
    )}
  </Chat>
);

const Screen: React.FC<{ k: string; t: number; ts: number }> = ({ k, t, ts }) => {
  switch (k) {
    case "adbhuta": return <ScrWonder t={t} />;
    case "shringara": return <ScrLove t={t} />;
    case "hasya": return <ScrLaugh t={t} ts={ts} />;
    case "bhayanaka": return <ScrFear t={t} />;
    case "bibhatsa": return <ScrDisgust t={t} />;
    case "raudra": return <ScrAnger t={t} ts={ts} />;
    case "karuna": return <ScrSorrow t={t} />;
    case "veera": return <ScrCourage t={t} ts={ts} />;
    case "shanta": return <ScrPeace t={t} ts={ts} />;
    default: return null;
  }
};

// ---------------- face close-up ----------------
const FACE_TOP = 640, FACE_H = 1100, CY = -840;
const Face: React.FC<{ f: number; p: FPose; extras?: Rasa["extras"]; et: number; zoom: number; shake?: number }> = ({ f, p, extras, et, zoom, shake = 0 }) => {
  const vw = 520 / zoom, vh = vw * (FACE_H / 1080);
  const jx = shake * Math.sin(f * 2.7) * 6, jy = shake * Math.cos(f * 3.1) * 4;
  return (
    <svg width={1080} height={FACE_H} viewBox={`${-vw / 2 + jx} ${CY - vh / 2 + jy} ${vw} ${vh}`} style={{ position: "absolute", left: 0, top: FACE_TOP }}>
      <Fumble f={f} p={p} />
      <Extras list={extras} t={et} p={p} />
    </svg>
  );
};

const Burst: React.FC<{ color: string; a: number; rot: number }> = ({ color, a, rot }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
    <g transform={`translate(540,1190) rotate(${rot})`}>
      {Array.from({ length: 24 }, (_, i) => {
        const a0 = (i / 24) * Math.PI * 2, a1 = a0 + Math.PI / 48;
        return <path key={i} d={`M ${Math.cos(a0) * 240},${Math.sin(a0) * 240} L ${Math.cos(a0) * 1500},${Math.sin(a0) * 1500} L ${Math.cos(a1) * 1500},${Math.sin(a1) * 1500} Z`} fill={color} />;
      })}
    </g>
  </svg>
);

const Header: React.FC<{ n?: number; title: string }> = ({ n, title }) => (
  <div style={{ position: "absolute", top: 86, left: 50, right: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div style={{ fontFamily: ANTON, fontSize: 56, color: "#fde047", letterSpacing: 2, WebkitTextStroke: "2px #111", textShadow: "0 4px 0 #000" }}>{title}</div>
    {n !== undefined && <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "white", background: "rgba(0,0,0,0.45)", padding: "4px 20px", borderRadius: 24 }}>{n}/9</div>}
  </div>
);

const Label: React.FC<{ r: Rasa; ts: number; accent: string; te: boolean }> = ({ r, ts, accent, te }) => {
  if (ts < 0) return null;
  const s = 1 + 1.2 * (1 - easeBack(clamp(ts / 7), 2.2));
  return (
    <div style={{ position: "absolute", top: 650, left: 0, right: 0, textAlign: "center", transform: `rotate(-3deg) scale(${s})`, opacity: clamp(ts / 2) }}>
      <div style={{ fontFamily: ANTON, fontSize: 124, lineHeight: 1, color: accent, letterSpacing: 4, WebkitTextStroke: "4px #111", textShadow: "0 8px 0 rgba(0,0,0,0.55)" }}>{r.name}</div>
      <div style={{ display: "inline-block", marginTop: 6, fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#111", background: accent, padding: "2px 18px", borderRadius: 14 }}>{te ? r.te : r.sa}</div>
    </div>
  );
};

// ---------------- end card ----------------
const EndCard: React.FC<{ f: number; handle: string }> = ({ f, handle }) => {
  const t0 = F(TL.endcard[0]), t = f - t0;
  const pulse = 1 + 0.06 * Math.max(0, 1 - Math.abs(f - F(TL.total - 0.9)) / 6);
  return (
    <AbsoluteFill style={{ background: "#0f172a" }}>
      <div style={{ position: "absolute", top: 96, width: "100%", textAlign: "center", fontFamily: ANTON, fontSize: 78, lineHeight: 1.12, color: "white" }}>WHICH ONE ARE YOU<br />RIGHT NOW?</div>
      {TL.beats.map((bt) => rasaOf(bt.key)).map((r, i) => {
        const p = easeBack(clamp((t + 2 - i * 2) / 6));
        if (p <= 0) return null;
        const x = 30 + (i % 3) * 345, y = 300 + Math.floor(i / 3) * 370;
        return (
          <div key={r.key} style={{ position: "absolute", left: x, top: y, width: 330, height: 350, transform: `scale(${p})`, borderRadius: 26, overflow: "hidden", background: COL[r.key][0] }}>
            <FumbleFace rasa={r} f={f} t={t} w={330} h={300} zoom={1.15} />
            <div style={{ position: "absolute", left: 14, top: 10, width: 64, height: 64, borderRadius: 32, background: "#fde047", fontFamily: ANTON, fontSize: 44, lineHeight: "64px", textAlign: "center", color: "#111" }}>{i + 1}</div>
            <div style={{ position: "absolute", bottom: 8, width: "100%", textAlign: "center", fontFamily: ANTON, fontSize: 40, color: COL[r.key][1], letterSpacing: 2 }}>{r.name}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 1405, width: "100%", textAlign: "center", opacity: clamp((t - 16) / 6), transform: `scale(${pulse})` }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 60, color: "#fde047" }}>Comment your number</div>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, color: "white", marginTop: 4 }}>Tag the friend who's always #8</div>
        <div style={{ fontFamily: ANTON, fontSize: handle.length > 16 ? 66 : 78, color: "white", marginTop: 12 }}>{handle}</div>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 36, color: "#cbd5e1", marginTop: 6 }}>Follow for more AI fun</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- main ----------------
export const FumbleNavarasa: React.FC<{ handle?: string; lang?: "en" | "te" }> = ({ handle = "@ai_maastaaru", lang = "en" }) => {
  const title = lang === "te" ? "AI NAVARASALU" : "AI NAVARASA";
  const frame = useCurrentFrame();
  const drop0 = F(TL.drop[0]), drop1 = F(TL.drop[1]);
  const f = frame >= drop0 && frame < drop1 ? drop0 - 1 : frame; // freeze during the drop
  const anton = <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>;
  return (
    <AbsoluteFill>
      <Audio key="audio" src={staticFile("navarasa/audio.wav")} />
      <Fonts />{anton}
      <Body frame={frame} f={f} handle={handle} title={title} te={lang === "te"} />
    </AbsoluteFill>
  );
};

const Body: React.FC<{ frame: number; f: number; handle: string; title: string; te: boolean }> = ({ frame, f, handle, title, te }) => {
  if (frame >= F(TL.endcard[0])) return <EndCard f={frame} handle={handle} />;

  // hook: title slam + all nine faces flickering
  if (f < F(TL.hook[1])) {
    const fl = TL.flick, k = Math.floor((f - fl.start) / fl.step);
    const flick = k >= 0 && k < fl.keys.length ? rasaOf(fl.keys[k]) : null;
    const back = clamp((f - fl.start - fl.step * fl.keys.length) / 8);
    const p = flick ? flick.pose : mix(rasaOf(fl.keys[fl.keys.length - 1]).pose, NEUTRAL, easeOut(back));
    const titleS = 1 + 0.9 * (1 - easeBack(clamp(f / 7), 2));
    return (
      <AbsoluteFill style={{ background: flick ? COL[flick.key][0] : "#111827" }}>
        <Face f={f} p={p} extras={flick?.extras} et={f} zoom={1.15} />
        <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", transform: `scale(${titleS})` }}>
          <div style={{ fontFamily: ANTON, fontSize: 150, color: "#fde047", lineHeight: 1, WebkitTextStroke: "5px #111", textShadow: "0 10px 0 rgba(0,0,0,0.5)" }}>{title}</div>
          <div style={{ display: "inline-block", marginTop: 18, fontFamily: INTER, fontWeight: 800, fontSize: 50, color: "white", background: "rgba(0,0,0,0.55)", padding: "6px 24px", borderRadius: 18, opacity: clamp((f - 9) / 6) }}>9 emotions of every AI user</div>
        </div>
      </AbsoluteFill>
    );
  }

  // beats
  const bi = Math.max(0, TL.beats.findIndex((b, i) => f >= F(b.start) && (i === TL.beats.length - 1 || f < F(TL.beats[i + 1].start))));
  const b = TL.beats[bi], r = rasaOf(b.key);
  const tb = f - F(b.start), ts = f - F(b.snap), len = F(b.end - b.start);
  let p: FPose;
  if (ts < 0) {
    const prev = bi > 0 ? finalPose(TL.beats[bi - 1]) : NEUTRAL;
    p = tb < 6 ? mix(prev, reading(tb), easeOut(tb / 6)) : reading(tb);
  } else {
    p = live(b.key, ts, mix(NEUTRAL, r.pose, easeBack(clamp(ts / 7))));
  }
  const [bg, accent] = COL[b.key];
  const zoom = ts < 0 ? 1 + 0.05 * (tb / len) : 1 + 0.06 * (tb / len) + 0.24 * easeOut(ts / 6) + 0.03 * (ts / 60);
  const shake = (b.key === "raudra" || b.key === "bhayanaka") && ts >= 0 ? 1 : 0;
  const flash = ts >= 0 && ts < 3 ? 1 - ts / 3 : 0;
  const slide = easeOut(tb / 6);
  // last beat: the laptop lid closes after the snap
  const lid = b.key === "shanta" ? clamp((ts - 20) / 12) : 0;
  return (
    <AbsoluteFill style={{ background: ts >= 0 ? bg : "#111827" }}>
      {ts >= 0 && <Burst color={accent} a={0.12 + 0.25 * Math.max(0, 1 - ts / 15)} rot={ts * 0.4} />}
      <Face f={f} p={p} extras={ts >= 0 ? r.extras : undefined} et={Math.max(0, ts)} zoom={zoom} shake={shake} />
      <div style={{ position: "absolute", top: 200, left: 60, width: 960, height: 450, borderRadius: 34, background: "#0b1020", padding: 18, boxSizing: "border-box", boxShadow: "0 24px 50px rgba(0,0,0,0.45)", transform: `translateY(${(1 - slide) * -60}px) scaleY(${1 - 0.97 * easeOut(lid)})`, transformOrigin: "50% 100%", opacity: slide }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 18, overflow: "hidden", position: "relative" }}>
          <Screen k={b.key} t={tb} ts={ts} />
        </div>
      </div>
      {lid > 0.9 && <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 56, color: "white", opacity: clamp((ts - 34) / 8) }}>Good night.</div>}
      <Header n={bi + 1} title={title} />
      <Label r={r} ts={ts} accent={accent} te={te} />
      {flash > 0 && <AbsoluteFill style={{ background: "white", opacity: 0.7 * flash }} />}
    </AbsoluteFill>
  );
};
