import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../lesson/Icon";
import { Backdrop } from "../lesson/Lesson";
import { DAY, NIGHT, Particles, Ridge, RideWorld, Sky } from "./World";

// EP01 "AI vs ML vs DL vs GenAI" — the address analogy (India > Telangana > Hyderabad > HITEC City).
const C = {
  violet: "#8B5CF6", blue: "#3B82F6", teal: "#22D3EE", amber: "#F59E0B", rose: "#F43F5E", green: "#34D399",
  muted: "#94A3B8", inter: "Inter, 'DejaVu Sans', sans-serif", anton: "Anton, Impact, 'DejaVu Sans', sans-serif", mono: "'DejaVu Sans Mono', monospace",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Line = { from: number; frames: number };
type Scene = { id: string; data: any; frames: number; lines: Line[] };
type SP = { s: Scene; cue: (n: number) => number; line: (i: number) => Line };
type ArtP = { d: any; cue: (n: number) => number; frames: number };
type BP = { d: any; cue: (n: number) => number; s: { frames: number } };
const Tick: React.FC<{ at: number; src?: string; vol?: number }> = ({ at, src = "audio/sfx_tick.wav", vol = 0.3 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={14} layout="none"><Audio src={staticFile(src)} volume={vol} /></Sequence>
);
const pop = (f: number, at: number) => interpolate(f - at, [0, 7], [0, 1], cl);
const LEVELS: [string, string, string][] = [["AI", "India", C.violet], ["Machine Learning", "Telangana", C.blue], ["Deep Learning", "Hyderabad", C.teal], ["Generative AI", "HITEC City", C.amber]];

// ---------- hook: postal address card ----------
const Address: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = cue(1), card = cue(2);
  const cs = spring({ frame: f - card, fps, config: { damping: 14 } });
  const rows = [...LEVELS].reverse(); // HITEC City on top, like a real address
  return (
    <AbsoluteFill>
      <Backdrop />
      {f < card + 4 && (
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: 1 - pop(f, card) }}>
          {LEVELS.map(([t, , col], i) => (
            <div key={t} style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 84, color: col, opacity: pop(f, i * 6), transform: `translateY(${(1 - pop(f, i * 6)) * 40}px)` }}>{t}</div>
          ))}
          {f >= q && <div style={{ marginTop: 20, fontFamily: C.anton, fontSize: 130, color: "white", transform: `scale(${interpolate(f - q, [0, 6], [1.6, 1], cl)})` }}>SAME THING?</div>}
        </div>
      )}
      {f >= card && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 330, height: 900, borderRadius: 18, background: "#fdfaf1", boxShadow: "0 30px 70px rgba(0,0,0,0.55)", transform: `rotate(-2deg) scale(${0.85 + 0.15 * cs})`, opacity: cs, padding: "50px 56px" }}>
          <div style={{ position: "absolute", right: 40, top: 36, width: 130, height: 150, border: "4px dashed #b45309", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="Cpu" size={80} color="#b45309" />
          </div>
          <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 30, color: "#92400e", letterSpacing: 4 }}>ADDRESS</div>
          <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 38, color: "#334155", marginTop: 8 }}>To: Every AI app you use</div>
          <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34 }}>
            {rows.map(([term, place, col], i) => {
              const at = cue(6 - i);
              const on = f >= at;
              return (
                <div key={place} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: on ? 1 : 0.12, transform: `translateX(${on ? 0 : -30}px)` }}>
                  <span style={{ fontFamily: C.inter, fontStyle: "italic", fontWeight: 800, fontSize: 64, color: "#1e293b" }}>{place}{i < 3 ? "," : "."}</span>
                  <span style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 32, color: "white", background: col, padding: "8px 18px", borderRadius: 14 }}>{term}</span>
                  <Tick at={at} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Tick at={q} src="audio/sfx_pop.wav" />
    </AbsoluteFill>
  );
};

// ---------- top art: night city with smart abilities ----------
const NightCity: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const w = 1000, h = 560;
  const bld = (layer: number) =>
    Array.from({ length: layer ? 16 : 12 }, (_, i) => {
      const bw = 50 + random(`bw${layer}${i}`) * 50, bh = (layer ? 120 : 200) + random(`bh${layer}${i}`) * (layer ? 120 : 160);
      const x = ((i * (layer ? 68 : 90) - f * (layer ? 0.8 : 0.3)) % (w + 200) + w + 200) % (w + 200) - 100;
      return (
        <div key={`${layer}${i}`} style={{ position: "absolute", left: x, bottom: 0, width: bw, height: bh, background: layer ? "#0d1230" : "#1b2350" }}>
          {Array.from({ length: Math.floor(bh / 26) * 3 }, (_, k) => {
            const lit = random(`wl${layer}${i}${k}`) > 0.55 && Math.sin(f / (25 + random(`wt${i}${k}`) * 40) + k) > -0.6;
            return <div key={k} style={{ position: "absolute", left: 8 + (k % 3) * (bw / 3.2), top: 12 + Math.floor(k / 3) * 26, width: bw / 5, height: 12, background: lit ? "#fcd97a" : "#2a3366", opacity: lit ? 0.9 : 0.6 }} />;
          })}
        </div>
      );
    });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky p={NIGHT} w={w} h={h} stars sunX={0.18} sunY={0.22} />
      {bld(0)}
      {bld(1)}
      {(d.pops ?? []).map(([icon, label, at]: [string, string, number], i: number) => {
        const a = cue(at);
        const k = pop(f, a);
        const x = 200 + i * 300, y = 170 + Math.sin(f / 12 + i) * 8;
        return f >= a ? (
          <div key={label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * k})`, opacity: k, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 110, height: 110, borderRadius: 55, background: "rgba(34,211,238,0.18)", border: `4px solid ${C.teal}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${C.teal}` }}>
              <Icon name={icon} size={60} color="white" />
            </div>
            <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 28, color: "white", background: "rgba(0,0,0,0.5)", padding: "3px 12px", borderRadius: 10 }}>{label}</div>
            <Tick at={a} />
          </div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

// ---------- top art: mango stall (learning from examples) ----------
const Mango: React.FC<ArtP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const w = 1000, h = 560;
  const seen = cue(d.seen ?? 3), learned = cue(d.learned ?? 4), norule = cue(d.norule ?? 2);
  const mangoes = Array.from({ length: 30 }, (_, i) => ({ ripe: random(`mr${i}`) > 0.45, x: 150 + (i % 10) * 70 + (Math.floor(i / 10) % 2) * 34, y: 360 - Math.floor(i / 10) * 40 }));
  const shown = Math.floor(interpolate(f, [seen, seen + 40], [0, 30], cl));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Sky p={DAY} w={w} h={h} sunX={0.85} sunY={0.18} />
      <Ridge p={DAY} w={w} h={h} depth={0.2} base={h * 0.5} amp={80} speed={0.1} seed="mk" trees />
      {/* stall */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 150, height: 70, background: "repeating-linear-gradient(90deg, #dc2626 0 70px, #fef3c7 70px 140px)", borderRadius: "10px 10px 0 0", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }} />
      <div style={{ position: "absolute", left: 110, width: 16, top: 220, height: 260, background: "#7c4a21" }} />
      <div style={{ position: "absolute", right: 110, width: 16, top: 220, height: 260, background: "#7c4a21" }} />
      <div style={{ position: "absolute", left: 100, right: 100, top: 400, height: 90, background: "linear-gradient(#a16207, #713f12)", borderRadius: 8 }} />
      {mangoes.map((m, i) => (
        <div key={i} style={{ position: "absolute", left: m.x, top: m.y, width: 58, height: 42, borderRadius: "50% 55% 50% 45%", background: m.ripe ? "radial-gradient(circle at 35% 35%, #fde047, #f59e0b 60%, #c2410c)" : "radial-gradient(circle at 35% 35%, #bef264, #65a30d 60%, #3f6212)", transform: `rotate(${(random(`ma${i}`) - 0.5) * 40}deg)`, boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
          {i < shown && <div style={{ position: "absolute", right: -8, top: -14, fontFamily: C.inter, fontWeight: 900, fontSize: 24, color: m.ripe ? "#15803d" : "#b91c1c", textShadow: "0 1px 0 #fff" }}>{m.ripe ? "✓" : "✗"}</div>}
        </div>
      ))}
      {f >= norule && f < learned && (
        <div style={{ position: "absolute", left: 60, top: 40, transform: `rotate(-6deg) scale(${0.7 + 0.3 * pop(f, norule)})`, background: "white", border: "5px solid #b91c1c", borderRadius: 12, padding: "6px 18px", fontFamily: C.inter, fontWeight: 900, fontSize: 34, color: "#b91c1c" }}>
          <Icon name="BookX" size={34} color="#b91c1c" /> No rulebook
        </div>
      )}
      {f >= learned && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "rgba(21,128,61,0.92)", color: "white", fontFamily: C.inter, fontWeight: 900, fontSize: 36, padding: "8px 22px", borderRadius: 14, transform: `scale(${0.7 + 0.3 * pop(f, learned)})` }}>Learned: yellow + soft = ripe</span>
        </div>
      )}
      <Tick at={norule} /><Tick at={learned} src="audio/sfx_success.wav" />
    </AbsoluteFill>
  );
};

// ---------- top art: creation studio (generative AI) ----------
const Studio: React.FC<ArtP> = ({ cue }) => {
  const f = useCurrentFrame();
  const at = [1, 2, 3, 4].map((n) => cue(n));
  const txt = "Once upon a time, a robot learned to paint...";
  const typed = txt.slice(0, Math.max(0, Math.floor((f - at[0]) * 1.4)));
  const code = ["def hello():", "    print('Namaste!')", "hello()"];
  const box = (i: number, icon: string, label: string, col: string, body: React.ReactNode) => (
    <div style={{ position: "absolute", left: 30 + (i % 2) * 480, top: 30 + Math.floor(i / 2) * 260, width: 460, height: 240, borderRadius: 20, background: "rgba(10,14,36,0.85)", border: `3px solid ${f >= at[i] ? col : "rgba(255,255,255,0.1)"}`, overflow: "hidden", opacity: f >= at[i] ? 1 : 0.3 }}>
      <div style={{ position: "absolute", left: 14, top: 10, display: "flex", alignItems: "center", gap: 8, fontFamily: C.inter, fontWeight: 900, fontSize: 24, color: col }}><Icon name={icon} size={26} color={col} /> {label}</div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 50, bottom: 12 }}>{f >= at[i] ? body : null}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #312e81, #0b1030 75%)" }}>
      <Particles w={1000} h={560} n={40} color="#fde68a" size={3} speed={0.5} seed="st" />
      {box(0, "Type", "TEXT", C.teal, <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 30, color: "white", lineHeight: 1.3 }}>{typed}<span style={{ opacity: f % 20 < 10 ? 1 : 0 }}>|</span></div>)}
      {box(1, "Image", "IMAGE", C.amber, (
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", clipPath: `inset(0 ${100 - Math.min(100, (f - at[1]) * 4)}% 0 0)` }}>
          <div style={{ width: 1000, height: 560, transform: "scale(0.432)", transformOrigin: "0 0" }}><RideWorld /></div>
        </div>
      ))}
      {box(2, "Music", "MUSIC", C.rose, (
        <div style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 16 }, (_, k) => {
            const hgt = 20 + Math.abs(Math.sin((f - at[2]) / 5 + k * 0.7)) * 120;
            return <div key={k} style={{ position: "absolute", left: k * 27, bottom: 0, width: 18, height: hgt, borderRadius: 6, background: `linear-gradient(${C.rose}, ${C.violet})` }} />;
          })}
        </div>
      ))}
      {box(3, "Code2", "CODE", C.green, (
        <div style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 28, color: "#86efac", lineHeight: 1.5 }}>
          {code.map((c, k) => <div key={k} style={{ opacity: f >= at[3] + k * 8 ? 1 : 0 }}>{c}</div>)}
        </div>
      ))}
      {at.map((a, i) => <Tick key={i} at={a} src="audio/sfx_pop.wav" />)}
    </AbsoluteFill>
  );
};

// ---------- bottom: row of icon cards lighting on cues ----------
const IconRow: React.FC<BP> = ({ d, cue }) => {
  const f = useCurrentFrame();
  const items: [string, string, number][] = d.items;
  const n = items.length;
  const W = (940 - (n - 1) * 20) / n;
  return (
    <>
      {d.headline && <div style={{ position: "absolute", left: 30, right: 30, top: 70, fontFamily: C.inter, fontWeight: 900, fontSize: 38, color: "white", lineHeight: 1.2 }}>{d.headline}</div>}
      {items.map(([icon, label, at], i) => {
        const on = f >= cue(at);
        return (
          <div key={label} style={{ position: "absolute", left: 30 + i * (W + 20), top: d.headline ? 200 : 110, width: W, height: 250, borderRadius: 22, background: on ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)", border: `3px solid ${on ? C.teal : "rgba(255,255,255,0.12)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, transform: `scale(${on ? 1 : 0.94})` }}>
            <Icon name={icon} size={n > 3 ? 64 : 80} color={on ? "white" : "rgba(255,255,255,0.3)"} />
            <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: n > 3 ? 28 : 32, color: on ? "white" : "rgba(255,255,255,0.35)", textAlign: "center" }}>{label}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------- deep learning: glowing 2D network (user preferred 2D over 3D) ----------
const Net2D: React.FC<{ lit: number[]; w: number; h: number }> = ({ lit, w, h }) => {
  const f = useCurrentFrame();
  const L = [4, 6, 6, 3];
  const X = (i: number) => w * 0.14 + i * ((w * 0.72) / 3);
  const Y = (i: number, j: number) => h / 2 + (j - (L[i] - 1) / 2) * (h / 7.2);
  const cols = ["#22d3ee", "#a78bfa", "#a78bfa", "#f43f5e"];
  const edges: [number, number, number, number, number][] = [];
  L.forEach((n, i) => { if (i < 3) for (let a = 0; a < n; a++) for (let b = 0; b < L[i + 1]; b++) edges.push([i, a, i + 1, b, random(`ne${i}${a}${b}`)]); });
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {cols.map((c, i) => (
          <radialGradient key={i} id={`glow${i}`}>
            <stop offset="0%" stopColor={c} stopOpacity={0.9} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {edges.map(([i, a, i2, b, r], k) => (
        <line key={k} x1={X(i)} y1={Y(i, a)} x2={X(i2)} y2={Y(i2, b)} stroke={lit[i2] > 0 ? "#38bdf8" : "#334155"} strokeWidth={1.5 + r * 2} opacity={0.18 + 0.5 * lit[i2] * r} />
      ))}
      {edges.filter((_, k) => k % 3 === 0).map(([i, a, i2, b, r], k) => {
        if (!(lit[i2] > 0)) return null;
        const t = ((f / 30) * 0.8 + r) % 1;
        return <circle key={`p${k}`} cx={X(i) + (X(i2) - X(i)) * t} cy={Y(i, a) + (Y(i2, b) - Y(i, a)) * t} r={6} fill="#fbbf24" opacity={0.9} />;
      })}
      {L.map((n, i) => Array.from({ length: n }, (_, j) => {
        const k = 0.3 + 0.7 * lit[i];
        const pulse = 1 + 0.08 * Math.sin(f / 6 + i + j);
        return (
          <g key={`${i}${j}`}>
            <circle cx={X(i)} cy={Y(i, j)} r={44 * pulse} fill={`url(#glow${i})`} opacity={0.7 * lit[i]} />
            <circle cx={X(i)} cy={Y(i, j)} r={20} fill={cols[i]} opacity={k} stroke="white" strokeWidth={lit[i] > 0.5 ? 3 : 1} />
          </g>
        );
      }))}
    </svg>
  );
};
const Deep: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const net = cue(1), e = cue(2), sh = cue(3), cat = cue(4);
  const lit = [pop(f, net), pop(f, e), pop(f, sh), pop(f, cat)].map((v, i) => (i === 0 ? Math.max(v, pop(f, e)) : v));
  const labels: [string, string, number, string][] = [["Layer 1", "edges", e, "Slash"], ["Layer 2", "shapes", sh, "Shapes"], ["Layer 3", "a cat!", cat, "Cat"]];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1e1b4b 0%, #070a18 75%)" }} />
      <div style={{ position: "absolute", left: 0, top: 260, width: 1080, height: 820 }}>
        <Net2D lit={lit} w={1080} h={820} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 280, textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 58, color: "white" }}>
        DEEP LEARNING <span style={{ color: C.teal }}>= many layers</span>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 1110, display: "flex", gap: 20 }}>
        {labels.map(([l, t, at, icon]) => (
          <div key={l} style={{ flex: 1, height: 220, borderRadius: 22, background: f >= at ? "rgba(167,139,250,0.16)" : "rgba(255,255,255,0.04)", border: `3px solid ${f >= at ? C.violet : "rgba(255,255,255,0.12)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: f >= at ? 1 : 0.35, transform: `scale(${0.9 + 0.1 * pop(f, at)})` }}>
            <div style={{ fontFamily: C.mono, fontWeight: 800, fontSize: 24, color: C.muted }}>{l}</div>
            <Icon name={icon} size={72} color="white" />
            <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: 34, color: "white" }}>{t}</div>
            <Tick at={at} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- nested address: zoom out from HITEC City to India ----------
const Nested: React.FC<SP> = ({ cue }) => {
  const f = useCurrentFrame();
  const ats = [cue(1), cue(2), cue(3), cue(4)];
  const rule = cue(5);
  const sizes = [860, 640, 430, 230];
  const shown = ats.map((a) => pop(f, a));
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 540, top: 780 }}>
        {LEVELS.map(([term, place, col], i) => {
          const sz = sizes[i];
          return (
            <div key={term} style={{ position: "absolute", left: -sz / 2, top: -sz / 2 + i * 40, width: sz, height: sz, borderRadius: "50%", background: `${col}22`, border: `6px solid ${col}`, opacity: shown[i], transform: `scale(${0.7 + 0.3 * shown[i]})`, boxShadow: `0 0 50px ${col}55` }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: i === 3 ? sz / 2 - 60 : 26, textAlign: "center" }}>
                <div style={{ fontFamily: C.inter, fontWeight: 900, fontSize: i === 3 ? 38 : 40, color: "white" }}>{term}</div>
                <div style={{ fontFamily: C.inter, fontWeight: 700, fontSize: 28, color: col }}>{place}</div>
              </div>
              <Tick at={ats[i]} />
            </div>
          );
        })}
      </div>
      {f >= rule && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1250, padding: "20px 28px", borderRadius: 22, background: "rgba(10,14,36,0.9)", border: `3px solid ${C.amber}`, fontFamily: C.inter, fontWeight: 900, fontSize: 40, color: "white", textAlign: "center", transform: `scale(${0.85 + 0.15 * pop(f, rule)})` }}>
          Every GenAI is AI. <span style={{ color: C.amber }}>Not every AI is GenAI.</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const EP01_SCENES: Record<string, React.FC<SP>> = { address: Address, deep: Deep, nested: Nested };
export const EP01_ART: Record<string, React.FC<ArtP>> = { nightcity: NightCity, mango: Mango, studio: Studio };
export const EP01_BOTTOM: Record<string, React.FC<BP>> = { iconrow: IconRow };
