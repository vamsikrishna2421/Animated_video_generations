import { AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";
import { Icon } from "../lesson/Icon";
import { Mascot } from "../lesson/Mascot";
import tl from "./story_timeline_te.json";

// Instagram Story channel promo (1080x1920). Content stays inside y 250..1600 (Story UI safe zone).
const C = {
  bg: "#04060F",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  teal: "#22D3EE",
  amber: "#F59E0B",
  rose: "#F43F5E",
  green: "#34D399",
  text: "#F8FAFC",
  muted: "#94A3B8",
  inter: "Inter, 'DejaVu Sans', sans-serif",
  anton: "Anton, Impact, 'DejaVu Sans', sans-serif",
};
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const grad = (a: string, b: string, deg = 90) =>
  ({ background: `linear-gradient(${deg}deg, ${a}, ${b})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }) as const;

type Beat = (typeof tl.beats)[number];
const B = Object.fromEntries(tl.beats.map((b) => [b.id, b])) as Record<string, Beat>;

const useSp = (at: number, damping = 12, mass = 1) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, mass } });
};

// ---------- shared background ----------
const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const blobs = [
    [C.violet, 0.2, 0.25, 0],
    [C.blue, 0.8, 0.45, 2],
    [C.teal, 0.3, 0.8, 4],
  ] as const;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {blobs.map(([c, x, y, ph], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(x + 0.08 * Math.sin(f / 40 + ph)) * 100}%`,
            top: `${(y + 0.06 * Math.cos(f / 50 + ph)) * 100}%`,
            width: 1100,
            height: 1100,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(circle, ${c}55 0%, ${c}00 65%)`,
          }}
        />
      ))}
      {/* synthwave floor grid */}
      <div style={{ position: "absolute", left: -600, right: -600, bottom: -200, height: 900, perspective: 600, opacity: 0.5 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotateX(72deg)",
            backgroundImage: `linear-gradient(${C.violet}88 2px, transparent 2px), linear-gradient(90deg, ${C.violet}88 2px, transparent 2px)`,
            backgroundSize: "120px 120px",
            backgroundPosition: `0px ${(f * 6) % 120}px`,
            maskImage: "linear-gradient(to top, black 30%, transparent 95%)",
            WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 95%)",
          }}
        />
      </div>
      {/* star particles drifting toward camera */}
      {Array.from({ length: 70 }, (_, i) => {
        const life = 90;
        const t = ((f + random(`s${i}`) * life) % life) / life;
        const a = random(`a${i}`) * Math.PI * 2;
        const r = 40 + t * t * 900;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 + Math.cos(a) * r,
              top: 900 + Math.sin(a) * r * 1.4,
              width: 2 + t * 5,
              height: 2 + t * 5,
              borderRadius: 10,
              background: i % 5 === 0 ? C.teal : "white",
              opacity: Math.min(1, t * 3) * 0.7,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// RGB-split headline for a glitchy, high-energy look.
const Glitch: React.FC<{ children: React.ReactNode; style: React.CSSProperties; amount: number }> = ({ children, style, amount }) => (
  <div style={{ position: "relative" }}>
    <div style={{ ...style, position: "absolute", inset: 0, color: C.rose, transform: `translate(${-amount}px, 0)`, mixBlendMode: "screen", opacity: 0.8 }}>{children}</div>
    <div style={{ ...style, position: "absolute", inset: 0, color: C.teal, transform: `translate(${amount}px, 0)`, mixBlendMode: "screen", opacity: 0.8 }}>{children}</div>
    <div style={{ ...style, position: "relative" }}>{children}</div>
  </div>
);

// Word-by-word timing across a voice line.
const wordAt = (b: Beat, i: number, n: number) => b.voiceFrom - b.from + Math.round((i * b.voiceFrames) / n);

// ---------- 1. AI changes every single day ----------
const Fast: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.fast;
  const words = ["changes,", "every", "single", "day."];
  const glitchAmt = f < 6 || (f > 40 && f < 44) || (f > 70 && f < 73) ? 14 : 3;
  const day = Math.min(365, Math.floor(interpolate(f, [0, b.frames - 10], [1, 365], cl) ** 1));
  return (
    <AbsoluteFill>
      {/* speed lines */}
      {Array.from({ length: 26 }, (_, i) => {
        const y = 280 + random(`ly${i}`) * 1300;
        const speed = 40 + random(`lv${i}`) * 60;
        const x = 1200 - ((f * speed + random(`lx${i}`) * 3000) % 3000);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 180 + random(`lw${i}`) * 400, height: 3, background: `linear-gradient(90deg, transparent, ${i % 3 ? "white" : C.teal})`, opacity: 0.35 }} />;
      })}
      <div style={{ position: "absolute", top: 300, right: 80, fontFamily: C.inter, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.amber }}>
        DAY {String(day).padStart(3, "0")}
      </div>
      <div style={{ position: "absolute", top: 420, left: 70, transform: `scale(${interpolate(f, [0, b.frames], [1.04, 1])})`, transformOrigin: "left top" }}>
        <Glitch amount={glitchAmt} style={{ fontFamily: C.anton, fontSize: 470, lineHeight: 0.9, letterSpacing: -4, color: "white" }}>
          AI
        </Glitch>
      </div>
      <div style={{ position: "absolute", top: 880, left: 80, right: 60 }}>
        {words.map((w, i) => {
          const at = wordAt(b, i + 1, words.length + 1);
          const s = useSp(at, 11);
          const last = i === words.length - 1;
          return (
            <div
              key={w}
              style={{
                fontFamily: C.anton,
                fontSize: last ? 200 : 130,
                lineHeight: 1.02,
                textTransform: "uppercase",
                opacity: f >= at ? 1 : 0,
                transform: `scale(${f >= at ? 1 + (1 - s) * 1.3 : 0.5})`,
                transformOrigin: "left center",
                ...(last ? grad(C.amber, C.rose) : { color: C.text }),
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2. flood of new terms ----------
const TERMS = ["Agents", "MCP", "RAG", "Reasoning", "LoRA", "Deepfakes", "Multimodal", "Embeddings", "GPT", "Claude", "Gemini", "Llama", "Qwen", "Diffusion", "Voice AI", "Tokens", "Fine-tuning", "Guardrails", "Copilots", "Vector DB", "RLHF", "Small models"];
const Flood: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.flood;
  const lines = ["New models.", "New tools.", "New words,", "every week."];
  return (
    <AbsoluteFill>
      {TERMS.map((t, i) => {
        const start = i * 4;
        const p = interpolate(f, [start, start + 34], [0, 1], cl);
        if (p <= 0 || p >= 1) return null;
        const a = random(`ta${i}`) * Math.PI * 2;
        const r = 120 + p * p * 820;
        const scale = 0.25 + p * p * 2.6;
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: 540 + Math.cos(a) * r,
              top: 930 + Math.sin(a) * r * 1.2,
              transform: `translate(-50%,-50%) scale(${scale}) rotate(${(random(`tr${i}`) - 0.5) * 20}deg)`,
              opacity: interpolate(p, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
              padding: "10px 24px",
              borderRadius: 40,
              border: `2px solid ${[C.violet, C.teal, C.amber, C.rose][i % 4]}`,
              background: "rgba(10,15,36,0.85)",
              fontFamily: C.inter,
              fontWeight: 800,
              fontSize: 34,
              color: C.text,
              whiteSpace: "nowrap",
            }}
          >
            {t}
            {i % 3 === 0 && <span style={{ marginLeft: 12, fontSize: 20, background: C.rose, color: "white", padding: "3px 10px", borderRadius: 8, verticalAlign: "middle" }}>NEW</span>}
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, textAlign: "center" }}>
        {lines.map((l, i) => {
          const at = wordAt(b, i, lines.length);
          const s = useSp(at, 13);
          return (
            <div
              key={l}
              style={{
                fontFamily: C.anton,
                fontSize: 150,
                lineHeight: 1.05,
                textTransform: "uppercase",
                opacity: s,
                transform: `translateY(${(1 - s) * 80}px)`,
                textShadow: "0 10px 40px rgba(0,0,0,0.8)",
                ...(i === 3 ? grad(C.teal, C.violet) : { color: C.text }),
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3. feeling left behind? ----------
const Lost: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.lost;
  const text = "Feeling left behind?";
  const typed = Math.floor(interpolate(f, [b.voiceFrom - b.from, b.voiceFrom - b.from + b.voiceFrames], [0, text.length], cl));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.55)" }} />
      {TERMS.slice(0, 12).map((t, i) => {
        const t0 = random(`fd${i}`) * 8;
        const tt = Math.max(0, f - t0) / 30;
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              left: 80 + random(`fx${i}`) * 820,
              top: 300 + random(`fy${i}`) * 500 + 90 * tt + 1400 * tt * tt,
              transform: `rotate(${(random(`fr${i}`) - 0.5) * 60 * tt * 3}deg)`,
              padding: "10px 24px",
              borderRadius: 40,
              border: `2px solid ${C.muted}`,
              fontFamily: C.inter,
              fontWeight: 800,
              fontSize: 34,
              color: C.muted,
              opacity: 0.7,
            }}
          >
            {t}
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 820, left: 70, right: 70, textAlign: "center", fontFamily: C.inter, fontWeight: 800, fontSize: 104, lineHeight: 1.1, color: C.text }}>
        {text.slice(0, typed)}
        <span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: C.amber }}>|</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4. logo reveal ----------
const ORBIT = ["Brain", "Bot", "Sparkles", "Cpu", "MessageSquare", "Mic", "Image", "Code"];
const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.reveal;
  const pop = useSp(2, 9);
  const name = "AI FROM SCRATCH";
  const sweep = interpolate(f, [18, 60], [-40, 140], cl);
  return (
    <AbsoluteFill>
      {[0, 6, 12, 18].map((d) => {
        const p = interpolate(f, [d, d + 40], [0, 1], cl);
        return <div key={d} style={{ position: "absolute", left: 540, top: 700, width: 60 + p * 1500, height: 60 + p * 1500, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `${6 - p * 5}px solid ${d % 12 ? C.teal : C.amber}`, opacity: 1 - p }} />;
      })}
      {ORBIT.map((ic, i) => {
        const a = (i / ORBIT.length) * Math.PI * 2 + f / 45;
        const s = useSp(8 + i * 2, 12);
        return (
          <div key={ic} style={{ position: "absolute", left: 540 + Math.cos(a) * 330 * s, top: 700 + Math.sin(a) * 330 * s, transform: `translate(-50%,-50%) scale(${s})`, width: 96, height: 96, borderRadius: 26, background: `linear-gradient(135deg, ${[C.violet, C.blue, C.teal, C.amber][i % 4]}, ${[C.blue, C.teal, C.amber, C.rose][i % 4]})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <Icon name={ic} size={52} color="white" />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 540, top: 700, transform: `translate(-50%,-50%) scale(${pop})`, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.amber}55, ${C.violet}33 60%, transparent 72%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", border: `8px solid ${C.amber}`, overflow: "hidden", background: "#1E1B4B", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mascot size={290} talking={f > b.voiceFrom - b.from && f < b.voiceFrom - b.from + b.voiceFrames && Math.floor(f / 4) % 2 === 0} variant="female" />
        </div>
      </div>
      <div style={{ position: "absolute", top: 1110, left: 0, right: 0, textAlign: "center", whiteSpace: "nowrap" }}>
        {name.split("").map((ch, i) => {
          const s = useSp(14 + i * 1.5, 10);
          return (
            <span key={i} style={{ display: "inline-block", fontFamily: C.anton, fontSize: 120, letterSpacing: 2, transform: `translateY(${(1 - s) * 120}px) rotate(${(1 - s) * 30}deg)`, opacity: s, backgroundImage: `linear-gradient(100deg, ${C.text} ${sweep - 20}%, ${C.amber} ${sweep}%, ${C.text} ${sweep + 20}%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", minWidth: ch === " " ? 40 : undefined }}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 700, fontSize: 50, color: C.teal, opacity: interpolate(f, [34, 46], [0, 1], cl), letterSpacing: 2 }}>
        AI, explained in Telugu.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 5. three pillars ----------
const Pillars: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.pillars;
  const v0 = b.voiceFrom - b.from;
  // sentence starts, proportional to sentence length
  const parts = ["Learn AI from scratch.", "See how real apps use it.", "And stay up to date with the latest in AI."];
  const total = parts.join(" ").length;
  let acc = 0;
  const starts = parts.map((p) => {
    const s = v0 + Math.round((acc / total) * b.voiceFrames);
    acc += p.length + 1;
    return s;
  });
  const cards = [
    { icon: "GraduationCap", title: "Learn from scratch", sub: "58 episodes, zero jargon", c1: C.violet, c2: C.blue },
    { icon: "Smartphone", title: "Real World AI", sub: "How your apps really work", c1: C.teal, c2: C.green },
    { icon: "Zap", title: "Latest AI updates", sub: "New tools, models and news", c1: C.amber, c2: C.rose },
  ];
  const head = useSp(0, 14);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 290, left: 70, fontFamily: C.inter, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.amber, opacity: head }}>ONE PLACE FOR</div>
      <div style={{ position: "absolute", top: 345, left: 66, fontFamily: C.anton, fontSize: 130, lineHeight: 1, opacity: head, transform: `translateX(${(1 - head) * -200}px)`, ...grad(C.text, C.teal) }}>EVERYTHING AI</div>
      {cards.map((c, i) => {
        const s = useSp(starts[i], 12);
        const lf = f - starts[i];
        return (
          <div
            key={c.title}
            style={{
              position: "absolute",
              top: 540 + i * 290,
              left: 60,
              right: 60,
              height: 250,
              borderRadius: 36,
              background: "rgba(15,20,48,0.88)",
              border: `3px solid ${c.c1}`,
              boxShadow: `0 0 ${40 * s}px ${c.c1}66`,
              transform: `translateX(${(1 - s) * (i % 2 ? 1200 : -1200)}px) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg)`,
              display: "flex",
              alignItems: "center",
              gap: 34,
              padding: "0 40px",
              overflow: "hidden",
            }}
          >
            <div style={{ width: 150, height: 150, borderRadius: 36, flexShrink: 0, background: `linear-gradient(135deg, ${c.c1}, ${c.c2})`, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${interpolate(lf, [0, 20], [-90, 0], cl)}deg)` }}>
              <Icon name={c.icon} size={86} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.inter, fontWeight: 800, fontSize: 58, color: C.text, lineHeight: 1.05 }}>{c.title}</div>
              <div style={{ fontFamily: C.inter, fontWeight: 600, fontSize: 36, color: C.muted, marginTop: 10 }}>{c.sub}</div>
              {i === 0 && (
                <div style={{ marginTop: 16, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${interpolate(lf, [8, 50], [0, 100], cl)}%`, height: "100%", background: `linear-gradient(90deg, ${c.c1}, ${c.c2})` }} />
                </div>
              )}
              {i === 1 && (
                <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
                  {["Phone", "Car", "Camera", "CreditCard", "Music"].map((ic, k) => {
                    const ps = interpolate(lf, [8 + k * 4, 16 + k * 4], [0, 1], cl);
                    return <div key={ic} style={{ transform: `scale(${ps})`, opacity: ps }}><Icon name={ic} size={40} color={c.c1} /></div>;
                  })}
                </div>
              )}
              {i === 2 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, fontFamily: C.inter, fontWeight: 800, fontSize: 28, color: C.amber, whiteSpace: "nowrap" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: C.rose, opacity: Math.floor(f / 10) % 2 ? 0.3 : 1 }} />
                  <div style={{ flex: 1, overflow: "hidden" }}><div style={{ transform: `translateX(${-((lf * 4) % 400)}px)` }}>NEW MODEL · NEW TOOL · AI NEWS · NEW MODEL · NEW TOOL · AI NEWS</div></div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 1440, left: 0, right: 0, textAlign: "center", opacity: interpolate(f, [starts[2] + 30, starts[2] + 42], [0, 1], cl) }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "18px 36px", borderRadius: 60, border: `3px solid ${C.teal}`, fontFamily: C.inter, fontWeight: 800, fontSize: 42, color: C.text }}>
          <Icon name="Timer" size={46} color={C.teal} /> Under 3 minutes each
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 6. follow CTA ----------
const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.cta;
  const handle = "@ai_maastaaru_telugu";
  const typed = Math.floor(interpolate(f, [4, 30], [0, handle.length], cl));
  const tapAt = 54;
  const cursorX = interpolate(f, [30, tapAt], [900, 600], cl);
  const cursorY = interpolate(f, [30, tapAt], [1500, 1040], cl);
  const press = f >= tapAt && f < tapAt + 6 ? 0.9 : 1;
  const followed = f >= tapAt + 3;
  const bell = f > tapAt + 8 ? Math.sin((f - tapAt) / 1.6) * 22 * Math.exp(-(f - tapAt - 8) / 18) : 0;
  const logo = useSp(0, 12);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${logo})`, width: 230, height: 230, borderRadius: "50%", border: `7px solid ${C.amber}`, overflow: "hidden", background: "#1E1B4B", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${C.amber}88` }}>
        <Mascot size={220} talking={false} variant="female" />
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 800, fontSize: 96, letterSpacing: -1, ...grad(C.amber, C.rose) }}>
        {handle.slice(0, typed)}
      </div>
      <div style={{ position: "absolute", top: 780, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 700, fontSize: 46, color: C.text, opacity: interpolate(f, [24, 36], [0, 1], cl) }}>
        Your one place for AI
      </div>
      <div style={{ position: "absolute", left: 540, top: 1010, transform: `translate(-50%,-50%) scale(${press * interpolate(f, [26, 38], [0.6, 1], cl)})`, opacity: interpolate(f, [26, 34], [0, 1], cl), display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ padding: "30px 90px", borderRadius: 30, background: followed ? "rgba(255,255,255,0.14)" : `linear-gradient(135deg, ${C.blue}, ${C.violet})`, fontFamily: C.inter, fontWeight: 800, fontSize: 64, color: "white", display: "flex", alignItems: "center", gap: 18, boxShadow: followed ? "none" : `0 0 50px ${C.blue}aa` }}>
          {followed ? <><Icon name="Check" size={60} color="white" stroke={3.5} /> Following</> : "Follow"}
        </div>
        <div style={{ transform: `rotate(${bell}deg)`, transformOrigin: "50% 10%" }}>
          <Icon name="BellRing" size={96} color={followed ? C.amber : C.muted} />
        </div>
      </div>
      {followed &&
        Array.from({ length: 36 }, (_, i) => {
          const t = (f - tapAt - 3) / 30;
          const a = random(`c${i}`) * Math.PI * 2;
          const v = 500 + random(`v${i}`) * 700;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 + Math.cos(a) * v * t,
                top: 1010 + Math.sin(a) * v * t + 900 * t * t,
                width: 18,
                height: 10,
                borderRadius: 3,
                background: [C.amber, C.teal, C.rose, C.violet, C.green][i % 5],
                transform: `rotate(${a * 180 + t * 720}deg)`,
                opacity: Math.max(0, 1 - t * 0.9),
              }}
            />
          );
        })}
      {f < tapAt + 20 && (
        <div style={{ position: "absolute", left: cursorX, top: cursorY, opacity: interpolate(f, [30, 36, tapAt + 12, tapAt + 20], [0, 1, 1, 0], cl), transform: `scale(${f >= tapAt && f < tapAt + 6 ? 0.85 : 1})` }}>
          <Icon name="Pointer" size={110} color="white" />
        </div>
      )}
      <div style={{ position: "absolute", top: 1250, left: 60, right: 60, display: "flex", justifyContent: "center", gap: 20, opacity: interpolate(f, [tapAt + 14, tapAt + 26], [0, 1], cl) }}>
        {[
          ["BookOpen", "Learn"],
          ["Smartphone", "Real apps"],
          ["Zap", "AI updates"],
        ].map(([ic, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: 40, border: `2px solid rgba(255,255,255,0.2)`, fontFamily: C.inter, fontWeight: 800, fontSize: 32, color: C.text }}>
            <Icon name={ic} size={34} color={C.teal} /> {l}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 1400, left: 0, right: 0, textAlign: "center", fontFamily: C.inter, fontWeight: 800, fontSize: 40, color: C.amber, opacity: interpolate(f, [tapAt + 22, tapAt + 34], [0, 1], cl) }}>
        New reels every day
      </div>
    </AbsoluteFill>
  );
};


// ---------- meme: Panik / Kalm / Panik ----------
const Panik: React.FC = () => {
  const f = useCurrentFrame();
  const b = B.panik;
  const v0 = b.voiceFrom - b.from;
  const marks = [0, 0.42, 0.74].map((k) => v0 + Math.round(k * b.voiceFrames));
  const texts = ["A new AI model drops every week", "This page explains it in Telugu", "You haven't followed it yet"];
  const inS = useSp(0, 14);
  const W = 900, H = Math.round((W * 760) / 543);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: (1080 - W) / 2, top: 300, width: W, height: H, transform: `scale(${0.9 + 0.1 * inS})`, borderRadius: 24, overflow: "hidden", border: "6px solid white", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <img src={staticFile("reel/memes/panik-kalm-panik.png")} style={{ width: W, height: H, display: "block" }} />
        {texts.map((t, i) => {
          const on = f >= marks[i];
          const s = interpolate(f - marks[i], [0, 6], [1.25, 1], cl);
          return (
            <div key={t} style={{ position: "absolute", left: 18, top: (H / 3) * i + 18, width: W * 0.44, height: H / 3 - 36, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: C.inter, fontWeight: 900, fontSize: 50, lineHeight: 1.12, color: "#111", opacity: on ? 1 : 0, transform: `scale(${s})` }}>
              {t}
            </div>
          );
        })}
      </div>
      {marks.map((m, i) => (
        <Sequence key={i} from={m} durationInFrames={10} layout="none">
          <Audio src={staticFile("audio/sfx_pop.wav")} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC> = { fast: Fast, flood: Flood, lost: Lost, panik: Panik, reveal: Reveal, pillars: Pillars, cta: Cta };

export const StoryTe: React.FC = () => {
  const f = useCurrentFrame();
  // camera shake + white flash on the big impacts
  const hits = [B.reveal.from, B.cta.from];
  const shake = hits.reduce((acc, h) => acc + (f >= h ? Math.exp(-(f - h) / 6) : 0), 0);
  const sx = Math.sin(f * 2.3) * 18 * shake;
  const sy = Math.cos(f * 3.1) * 14 * shake;
  const flash = Math.max(...hits.map((h) => (f >= h ? interpolate(f - h, [0, 10], [0.85, 0], cl) : 0)));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Fonts />
      <style>{`@font-face{font-family:Anton;src:url(${staticFile("fonts/anton-latin-400-normal.woff2")}) format('woff2');}`}</style>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <Backdrop />
        {tl.beats.map((b, i) => {
          const Comp = SCENES[b.id];
          return (
            <Sequence key={b.id} from={b.from} durationInFrames={b.frames}>
              <BeatWrap first={i === 0} frames={b.frames}>
                <Comp />
              </BeatWrap>
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "white", opacity: flash, pointerEvents: "none" }} />
      <Audio
        src={staticFile(tl.music)}
        volume={(fr) => {
          // Duck the beat under the voice-over so every line stays clear.
          const talking = tl.beats.some((b) => fr >= b.voiceFrom - 3 && fr < b.voiceFrom + b.voiceFrames + 4);
          return talking ? 0.4 : 0.8;
        }}
      />
      {tl.beats.map((b) => (
        <Sequence key={`vo-${b.id}`} from={b.voiceFrom} durationInFrames={b.voiceFrames + 15}>
          <Audio src={staticFile(b.audio)} volume={1} />
        </Sequence>
      ))}
      {tl.beats.slice(1).map((b) => (
        <Sequence key={`wh-${b.id}`} from={Math.max(0, b.from - 8)} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx_whoosh.wav")} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Fast cut transitions: scale-punch in, quick fade/zoom out.
const BeatWrap: React.FC<{ first: boolean; frames: number; children: React.ReactNode }> = ({ first, frames, children }) => {
  const f = useCurrentFrame();
  const inP = first ? 1 : interpolate(f, [0, 7], [0, 1], cl);
  const outP = interpolate(f, [frames - 6, frames], [1, 0], cl);
  return <AbsoluteFill style={{ opacity: Math.min(inP, outP), transform: `scale(${(first ? 1 : 1.15 - 0.15 * inP) * (1 + 0.12 * (1 - outP))})` }}>{children}</AbsoluteFill>;
};
