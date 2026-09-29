import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../lesson/Icon";
import { Mascot } from "../lesson/Mascot";
import { Chintu } from "./Chintu";

// Illustrated analogy panels (1000x560) and extra "IN AI" visuals (1000x500) for split scenes.
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399",
  text: "#F8FAFC", muted: "#94A3B8", inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Cue = (n: number) => number;
type ArtP = { d: any; cue: Cue; frames: number };

const useSpAt = (at: number, damping = 13) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping } });
};
const Tick: React.FC<{ at: number; vol?: number }> = ({ at, vol = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={8} layout="none">
    <Audio src={staticFile("audio/sfx_tick.wav")} volume={vol} />
  </Sequence>
);
const Float: React.FC<{ t: string; at: number; x: number; y: number; c: string; size?: number }> = ({ t, at, x, y, c, size = 54 }) => {
  const f = useCurrentFrame();
  if (f < at || f > at + 36) return null;
  const k = (f - at) / 36;
  return <div style={{ position: "absolute", left: x, top: y - k * 70, transform: "translate(-50%,-50%)", opacity: 1 - k * k, fontFamily: C.anton, fontSize: size, color: c, textShadow: "0 4px 14px rgba(0,0,0,0.6)" }}>{t}</div>;
};

// ---------- top panel illustrations ----------
const Tiles: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const items: [string, string, string][] = d.tiles ?? [["GraduationCap", "With a teacher", C.amber], ["Compass", "On your own", C.teal], ["Bike", "Trial & error", C.green]];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1f2a5a, #0b1030 75%)" }}>
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 50, color: "white" }}>
        ChatGPT learned in <span style={{ color: C.amber }}>3 ways</span>
      </div>
      {items.map(([icon, label, col], i) => {
        const at = cue(d.at?.[i] ?? i + 3);
        const on = f >= at;
        const sp = useSpAt(at, 11);
        return (
          <div key={label} style={{ position: "absolute", left: 50 + i * 310, top: 170, width: 280, height: 320, borderRadius: 28, background: on ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: `4px solid ${on ? col : "rgba(255,255,255,0.15)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, transform: `scale(${0.9 + 0.1 * sp})`, boxShadow: on ? `0 0 40px ${col}55` : "none" }}>
            <Icon name={icon} size={130} color={on ? col : "rgba(255,255,255,0.25)"} stroke={1.8} />
            <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 36, color: on ? "white" : "rgba(255,255,255,0.3)", textAlign: "center" }}>{label}</div>
            <Tick at={at} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Tuition: React.FC<ArtP> = ({ d, cue, frames }) => {
  const f = useCurrentFrame();
  const qs: [string, string][] = d.qs ?? [["7 × 8 =", "56"], ["12 + 9 =", "21"], ["15 − 6 =", "9"]];
  const qAt = cue(d.q ?? 1);
  const aAt = cue(d.a ?? 2);
  const z = interpolate(f, [0, frames], [1, 1.06]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 80% 10%, #5a3a12 0%, #2a1a0a 45%, #140c05 90%)", transform: `scale(${z})` }}>
      <div style={{ position: "absolute", right: 90, top: -20, width: 120, height: 90, borderRadius: "0 0 60px 60px", background: "#e7b75b", boxShadow: "0 30px 120px 60px rgba(255,190,90,0.35)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: "linear-gradient(#7a4a22, #5a3416)" }} />
      <div style={{ position: "absolute", left: 20, bottom: 60 }}><Mascot size={330} talking={f >= qAt && f < aAt + 30 && Math.floor(f / 4) % 2 === 0} variant="female" /></div>
      <div style={{ position: "absolute", right: 20, bottom: 70 }}><Chintu size={270} talking={false} mood={f >= aAt ? "happy" : "confused"} /></div>
      <div style={{ position: "absolute", left: 315, top: 105, width: 380, height: 370, background: "#fdfbf4", borderRadius: 10, transform: "rotate(-3deg)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", padding: "26px 26px" }}>
        <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 24, color: "#64748b", letterSpacing: 3 }}>WORKSHEET</div>
        {qs.map(([q, a], i) => {
          const qi = qAt + i * 5;
          const ai = aAt + i * 6;
          return (
            <div key={q} style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 34, whiteSpace: "nowrap", color: "#111", opacity: f >= qi ? 1 : 0.15 }}>
              <span>{q}</span>
              {f >= ai && <span style={{ color: C.rose, transform: `scale(${interpolate(f - ai, [0, 5], [1.6, 1], cl)})` }}>{a} ✓</span>}
            </div>
          );
        })}
        {f >= aAt && <div style={{ position: "absolute", right: -30, bottom: 20, background: C.rose, color: "white", fontFamily: C.inter, fontWeight: 900, fontSize: 24, padding: "6px 14px", borderRadius: 10, transform: "rotate(8deg)" }}>ANSWER KEY</div>}
      </div>
      <Tick at={qAt} /><Tick at={aAt} />
    </AbsoluteFill>
  );
};

const Cupboard: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const start = cue(d.start ?? 2);
  const groups: [string, string, string, number][] = [["Shirt", "Shirts", C.blue, d.g1 ?? 3], ["Footprints", "Socks", C.rose, d.g2 ?? 4], ["BookOpen", "Books", C.amber, d.g3 ?? 5]];
  const items = Array.from({ length: 12 }, (_, i) => ({ g: i % 3, k: Math.floor(i / 3), sx: 60 + random(`cx${i}`) * 440, sy: 230 + random(`cy${i}`) * 260, r: (random(`cr${i}`) - 0.5) * 80 }));
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#2b2440, #17132a)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 110, background: "#3a2c1c" }} />
      <div style={{ position: "absolute", right: 40, top: 40, width: 400, height: 480, borderRadius: 16, background: "#6b4526", border: "10px solid #4a2e17" }}>
        {groups.map(([, label, col, at], gi) => {
          const on = f >= cue(at);
          return (
            <div key={label} style={{ position: "absolute", left: 10, right: 10, top: 12 + gi * 150, height: 138, borderBottom: "10px solid #4a2e17", background: on ? `${col}22` : "transparent" }}>
              {on && <div style={{ position: "absolute", right: 8, top: 6, fontFamily: C.inter, fontWeight: 900, fontSize: 26, color: "white", background: col, padding: "2px 12px", borderRadius: 10 }}>{label}</div>}
            </div>
          );
        })}
      </div>
      {items.map((it, i) => {
        const [icon, , col, at] = groups[it.g];
        const go = cue(at);
        const p = interpolate(f, [Math.max(start, go - 12) + it.k * 2, go + it.k * 2], [0, 1], cl);
        const tx = 610 + 20 + it.k * 82;
        const ty = 52 + 12 + it.g * 150 + 40;
        const x = it.sx + (tx - it.sx) * p;
        const y = it.sy + (ty - it.sy) * p - Math.sin(p * Math.PI) * 90;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `rotate(${it.r * (1 - p)}deg)` }}>
            <Icon name={icon} size={70} color={col} stroke={2.4} />
          </div>
        );
      })}
      {groups.map(([, l, , at]) => <Tick key={l} at={cue(at)} />)}
    </AbsoluteFill>
  );
};

const Cycle: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const fallAt = cue(d.fall ?? 1);
  const rideAt = cue(d.ride ?? 2);
  const falling = f >= fallAt && f < rideAt;
  const wob = f < fallAt ? Math.sin(f / 3) * 6 : 0;
  const tip = falling ? interpolate(f - fallAt, [0, 14], [0, 68], cl) : 0;
  const riding = f >= rideAt;
  const x = riding ? interpolate(f - rideAt, [0, 90], [300, 620], cl) : 300;
  const roadShift = riding ? (f - rideAt) * 14 : 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#7cc4f4, #cde9fb 60%)" }}>
      <div style={{ position: "absolute", left: 80, top: 50, width: 120, height: 120, borderRadius: 60, background: "#ffd66b", boxShadow: "0 0 80px #ffd66b" }} />
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: ((i * 380 - roadShift * 0.2) % 1200 + 1200) % 1200 - 100, top: 90 + i * 30, width: 180, height: 50, borderRadius: 30, background: "white", opacity: 0.9 }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, background: "#4b5563" }} />
      {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ position: "absolute", bottom: 78, left: ((i * 160 - roadShift) % 1280 + 1280) % 1280 - 140, width: 90, height: 12, background: "#f8fafc", borderRadius: 6 }} />)}
      <div style={{ position: "absolute", left: x, bottom: 110, transformOrigin: "50% 100%", transform: `rotate(${tip + wob}deg)` }}>
        <svg width={230} height={230} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d="M112 -18 L100 70 L150 150" stroke="#7C3AED" strokeWidth={22} strokeLinecap="round" fill="none" />
          <path d="M104 10 L160 60" stroke="#7C3AED" strokeWidth={16} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ position: "absolute", left: 42, top: -150 }}><Chintu size={140} talking={false} mood={falling ? "shocked" : riding ? "happy" : "confused"} /></div>
        <Icon name="Bike" size={230} color="#111827" stroke={2.2} />
      </div>
      {riding && Array.from({ length: 4 }, (_, i) => <div key={i} style={{ position: "absolute", left: x - 90 - i * 30, bottom: 170 + i * 26, width: 70, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.8)" }} />)}
      <Float t="−1 OUCH" at={fallAt + 12} x={x + 160} y={250} c={C.rose} />
      {riding && [0, 30, 60].map((o) => <Float key={o} t="+1" at={rideAt + 8 + o} x={x + 180} y={230} c="#16a34a" size={64} />)}
      <Tick at={fallAt + 12} /><Tick at={rideAt + 8} />
    </AbsoluteFill>
  );
};

export const ART: Record<string, React.FC<ArtP>> = { tiles: Tiles, tuition: Tuition, cupboard: Cupboard, cycle: Cycle };

// ---------- bottom "IN AI" visuals (1000x500) ----------
type BP = { d: any; cue: Cue; s: { frames: number } };

const Cards3: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const cards: [string, string, string][] = d.cards ?? [["Supervised", "learns from answers", C.amber], ["Unsupervised", "finds groups alone", C.teal], ["Reinforcement", "learns from rewards", C.green]];
  return (
    <>
      {cards.map(([t, sub, col], i) => {
        const at = cue(d.at?.[i] ?? i + 3);
        const flip = interpolate(f, [at, at + 8], [0, 1], cl);
        const shown = flip > 0.5;
        return (
          <div key={t} style={{ position: "absolute", left: 30 + i * 320, top: 100, width: 300, height: 340, borderRadius: 24, background: shown ? `${col}22` : "rgba(255,255,255,0.05)", border: `4px solid ${shown ? col : "rgba(255,255,255,0.15)"}`, transform: `rotateY(${(1 - Math.abs(flip * 2 - 1)) * 80}deg)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 18 }}>
            {shown ? (
              <>
                <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 38, color: col }}>{t}</div>
                <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 28, color: "white", textAlign: "center" }}>{sub}</div>
              </>
            ) : (
              <div style={{ fontFamily: C.anton, fontSize: 120, color: "rgba(255,255,255,0.2)" }}>?</div>
            )}
          </div>
        );
      })}
    </>
  );
};

const Labels: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const show = cue(d.show ?? 4);
  const rows: [string, string[], number][] = [["Mail", ["SPAM", "NOT SPAM", "SPAM"], d.r1 ?? 6], ["Cat", ["CAT", "DOG", "CAT"], d.r2 ?? 7]];
  const iconsRow2 = ["Cat", "Dog", "Cat"];
  const newAt = cue(d.pred ?? 8);
  const lblAt = cue(d.lbl ?? 5);
  return (
    <>
      {rows.map(([icon, labels, at], r) =>
        labels.map((lab, i) => {
          const a = show + (r * 3 + i) * 3;
          const on = f >= a;
          const lab_on = f >= cue(at) + i * 4 || (r === 0 && i === 0 && f >= lblAt);
          const good = !/NOT|DOG/.test(lab);
          return (
            <div key={`${r}${i}`} style={{ position: "absolute", left: 30 + i * 200, top: 90 + r * 195, width: 180, height: 170, borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "3px solid rgba(255,255,255,0.18)", opacity: on ? 1 : 0, transform: `scale(${on ? interpolate(f - a, [0, 6], [0.7, 1], cl) : 0.7})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Icon name={r === 0 ? icon : iconsRow2[i]} size={70} color="white" />
              <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 24, padding: "4px 10px", borderRadius: 10, background: lab_on ? (good ? C.amber : C.teal) : "rgba(255,255,255,0.1)", color: lab_on ? "#0A0F24" : "rgba(255,255,255,0.4)" }}>{lab_on ? lab : "?"}</div>
            </div>
          );
        })
      )}
      {f >= lblAt && f < cue(d.r1 ?? 6) + 20 && (
        <div style={{ position: "absolute", left: 60, top: 60, fontFamily: C.inter, fontWeight: 800, fontSize: 26, color: C.amber }}>↓ the right answer = a “label”</div>
      )}
      <div style={{ position: "absolute", left: 640, top: 150, width: 16, height: 250, borderRadius: 8, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", left: 690, top: 90, width: 280, height: 365, borderRadius: 24, border: `4px dashed ${f >= newAt ? C.green : "rgba(255,255,255,0.2)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 26, color: C.muted, letterSpacing: 3 }}>NEW PHOTO</div>
        <Icon name="Cat" size={110} color="white" />
        {f >= newAt && <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 32, color: "#0A0F24", background: C.green, padding: "6px 16px", borderRadius: 12, transform: `scale(${interpolate(f - newAt, [0, 6], [1.5, 1], cl)})` }}>AI: CAT ✓</div>}
      </div>
      <Tick at={cue(d.r1 ?? 6)} /><Tick at={cue(d.r2 ?? 7)} /><Tick at={newAt} />
    </>
  );
};

const Clusters: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const groupAt = cue(d.group ?? 7);
  const labelAt = cue(d.label ?? 8);
  const newAt = cue(d.newer ?? 9);
  const centers: [number, number, string, string, string][] = [[210, 290, C.green, "Dumbbell", "Fitness"], [500, 200, C.violet, "Gamepad2", "Gamers"], [790, 300, C.amber, "UtensilsCrossed", "Foodies"]];
  const dots = Array.from({ length: 36 }, (_, i) => {
    const g = i % 3;
    const a = random(`ga${i}`) * Math.PI * 2;
    const rr = 25 + random(`gr${i}`) * 65;
    return { g, sx: 60 + random(`sx${i}`) * 880, sy: 90 + random(`sy${i}`) * 370, tx: centers[g][0] + Math.cos(a) * rr, ty: centers[g][1] + Math.sin(a) * rr * 0.8 };
  });
  const p = interpolate(f, [groupAt, groupAt + 24], [0, 1], cl);
  const e = p * p * (3 - 2 * p);
  const np = interpolate(f, [newAt, newAt + 24], [0, 1], cl);
  return (
    <>
      <svg width={1000} height={500} style={{ position: "absolute", inset: 0 }}>
        {dots.map((o, i) => (
          <circle key={i} cx={o.sx + (o.tx - o.sx) * e} cy={o.sy + (o.ty - o.sy) * e} r={13} fill={p > 0 ? centers[o.g][2] : "#cbd5e1"} opacity={0.9} />
        ))}
        {f >= newAt && <circle cx={960 + (centers[0][0] + 40 - 960) * np} cy={60 + (centers[0][1] - 20 - 60) * np} r={18} fill="white" stroke={C.green} strokeWidth={6} />}
      </svg>
      {f >= labelAt && centers.map(([x, y, col, icon, name], i) => (
        <div key={name} style={{ position: "absolute", left: x, top: y + 110, transform: `translate(-50%,0) scale(${interpolate(f - labelAt - i * 4, [0, 6], [0, 1], cl)})`, display: "flex", alignItems: "center", gap: 8, background: col, color: "#0A0F24", fontFamily: C.inter, fontWeight: 900, fontSize: 28, padding: "4px 14px", borderRadius: 12 }}>
          <Icon name={icon} size={30} color="#0A0F24" stroke={2.6} /> {name}
        </div>
      ))}
      {f < groupAt && <div style={{ position: "absolute", right: 30, top: 24, fontFamily: C.inter, fontWeight: 800, fontSize: 26, color: C.muted }}>shoppers · no labels</div>}
      {np >= 1 && <div style={{ position: "absolute", left: 60, top: 60, background: "white", color: "#0A0F24", fontFamily: C.inter, fontWeight: 900, fontSize: 28, padding: "6px 16px", borderRadius: 12 }}>New shopper → suggest sports gear</div>}
      <Tick at={groupAt} /><Tick at={labelAt} /><Tick at={newAt + 24} />
    </>
  );
};

const Reward: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const start = cue(d.start ?? 4);
  const usesAt = cue(d.uses ?? 5);
  const G = 88, ox = 110, oy = 80;
  const walls = [[3, 0], [3, 1], [5, 2], [5, 3]];
  const coins = [[2, 3], [4, 1]];
  const goal = [7, 0];
  const tries: number[][][] = [
    [[0, 1], [1, 1], [2, 1], [3, 1]], // crash into wall
    [[0, 1], [0, 2], [1, 2], [2, 3], [2, 2], [3, 2], [4, 2], [5, 2]], // coin, then wall
    [[0, 1], [0, 2], [1, 2], [2, 3], [3, 3], [4, 3], [4, 2], [4, 1], [5, 1], [6, 1], [6, 0], [7, 0]], // coins + goal
  ];
  const stepF = 5;
  let t0 = start, which = -1, local = 0;
  for (let k = 0; k < tries.length; k++) {
    const len = tries[k].length * stepF + 16;
    if (f >= t0 && f < t0 + len) { which = k; local = f - t0; break; }
    if (f >= t0 + len) { which = k; local = len; }
    t0 += len;
  }
  const path = which >= 0 ? tries[which] : [[0, 1]];
  const idx = Math.min(path.length - 1, Math.floor(local / stepF));
  const [cx, cy] = path[idx];
  const crashed = which >= 0 && idx === path.length - 1 && walls.some(([a, b]) => a === cx && b === cy);
  const won = which === 2 && idx === path.length - 1;
  let score = 0;
  for (let k = 0; k <= which; k++) {
    const p = tries[k];
    const upto = k < which ? p.length - 1 : idx;
    for (let j = 0; j <= upto; j++) {
      if (coins.some(([a, b]) => a === p[j][0] && b === p[j][1])) score += 1;
      if (walls.some(([a, b]) => a === p[j][0] && b === p[j][1])) score -= 1;
      if (p[j][0] === goal[0] && p[j][1] === goal[1]) score += 10;
    }
  }
  return (
    <>
      <div style={{ position: "absolute", left: ox, top: oy, width: 8 * G, height: 4 * G, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.12)" }} />
      {walls.map(([a, b], i) => <div key={i} style={{ position: "absolute", left: ox + a * G + 6, top: oy + b * G + 6, width: G - 12, height: G - 12, borderRadius: 12, background: "#475569" }} />)}
      {coins.map(([a, b], i) => <div key={i} style={{ position: "absolute", left: ox + a * G + 24, top: oy + b * G + 24, width: G - 48, height: G - 48, borderRadius: 30, background: C.amber, boxShadow: `0 0 20px ${C.amber}` }} />)}
      <div style={{ position: "absolute", left: ox + goal[0] * G + 8, top: oy + goal[1] * G + 8 }}><Icon name="Flag" size={G - 16} color={C.green} /></div>
      <div style={{ position: "absolute", left: ox + cx * G + 14, top: oy + cy * G + 14, width: G - 28, height: G - 28, borderRadius: 30, background: crashed ? C.rose : C.teal, boxShadow: `0 0 26px ${crashed ? C.rose : C.teal}` }} />
      <div style={{ position: "absolute", left: 40, top: 430, fontFamily: C.inter, fontWeight: 800, fontSize: 30, color: C.muted }}>try {Math.max(1, which + 1)}</div>
      <div style={{ position: "absolute", right: 40, top: 30, fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 800, fontSize: 36, color: score < 0 ? C.rose : C.green }}>score {score > 0 ? "+" : ""}{score}</div>
      {crashed && <div style={{ position: "absolute", left: ox + cx * G, top: oy + cy * G - 40, fontFamily: C.anton, fontSize: 44, color: C.rose }}>−1</div>}
      {won && <div style={{ position: "absolute", left: ox + cx * G - 40, top: oy + cy * G + 70, fontFamily: C.anton, fontSize: 44, color: C.green }}>+10</div>}
      {f >= usesAt && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 432, display: "flex", justifyContent: "center", gap: 16 }}>
          {[["Gamepad2", "Game AIs"], ["Bot", "Robots"], ["Car", "Self-driving"]].map(([ic, t], i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: `2px solid ${C.green}`, borderRadius: 12, padding: "4px 14px", fontFamily: C.inter, fontWeight: 800, fontSize: 26, color: "white", transform: `scale(${interpolate(f - usesAt - i * 5, [0, 6], [0, 1], cl)})` }}>
              <Icon name={ic} size={28} color={C.green} /> {t}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const BOTTOM2: Record<string, React.FC<BP>> = { cards3: Cards3, labels: Labels, clusters: Clusters, reward: Reward };
