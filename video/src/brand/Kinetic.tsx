import { ArrowUp, Search, Sparkles } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Aurora, Grain } from "./Base";
import { B, cl, F, pop, prog, rand, typeTimes } from "./tokens";

// Kinetic-type templates. Each fills the frame, takes plain props, and is a pure function of the local frame.
// Text segments: [{ t: "Does ChatGPT know ", }, { t: "you", accent: true }]
export type Seg = { t: string; accent?: boolean };
const segText = (segs: Seg[]) => segs.map((s) => s.t).join("");

/** Render the first `n` characters of segments, accent segments in the accent colour. */
const Typed: React.FC<{ segs: Seg[]; n: number; accent: string }> = ({ segs, n, accent }) => {
  let left = n;
  return (
    <>
      {segs.map((s, i) => {
        const part = s.t.slice(0, Math.max(0, left));
        left -= s.t.length;
        return <span key={i} style={{ color: s.accent ? accent : undefined }}>{part}</span>;
      })}
    </>
  );
};

/**
 * HOOK: a search bar types a question (the AI-search motif). Caret blinks, Enter at `enterAt` pulses the bar
 * and skeleton results shimmer in. Key SFX frames: typeTimes(text, start).
 */
export const SearchHook: React.FC<{ segs: Seg[]; label?: string; start?: number; enterAt?: number; dark?: boolean }> = ({ segs, label = "Asked to AI", start = 10, enterAt, dark = false }) => {
  const f = useCurrentFrame();
  const text = segText(segs);
  const times = typeTimes(text, start);
  const n = times.filter((t) => f >= t).length;
  const enter = enterAt ?? times[times.length - 1] + 12;
  const pulse = interpolate(f, [enter, enter + 4, enter + 14], [1, 1.035, 1], cl);
  const rise = prog(f, enter + 4, enter + 20);
  const inS = pop(f, -10, 14); // already on screen at frame 0: the first frame of a reel is its thumbnail
  return (
    <AbsoluteFill>
      <Aurora dark={dark} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 980, transform: `translateY(${-rise * 170}px)` }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: dark ? "rgba(255,255,255,0.55)" : "rgba(10,15,36,0.5)", marginBottom: 26, marginLeft: 16, opacity: inS }}>{label.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 30, minHeight: 190, padding: "36px 44px", borderRadius: 100, background: dark ? "rgba(17,22,44,0.9)" : B.white, boxShadow: `0 30px 80px rgba(10,15,36,${dark ? 0.5 : 0.14}), 0 0 0 ${f >= enter ? 6 * (1 - rise) : 0}px rgba(59,107,255,0.35)`, transform: `scale(${(0.92 + 0.08 * inS) * pulse})`, opacity: inS }}>
            <div style={{ width: 108, height: 108, borderRadius: 54, background: B.grad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={58} color="#fff" />
            </div>
            <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 82, letterSpacing: -2, lineHeight: 1.1, color: dark ? B.white : B.ink, flex: 1 }}>
              <Typed segs={segs} n={n} accent={B.blue} />
              {f < enter && <span style={{ display: "inline-block", width: 6, height: 84, marginLeft: 4, background: B.blue, verticalAlign: "middle", opacity: f % 20 < 11 ? 1 : 0 }} />}
            </div>
            <Search size={64} color={dark ? "rgba(255,255,255,0.5)" : "rgba(10,15,36,0.35)"} />
          </div>
          {/* skeleton answer lines */}
          <div style={{ marginTop: 50, padding: "0 30px", opacity: rise }}>
            {[0.92, 0.78, 0.86, 0.55].map((w, i) => (
              <div key={i} style={{ height: 30, borderRadius: 15, marginBottom: 26, width: `${w * 100 * prog(f, enter + 8 + i * 4, enter + 22 + i * 4)}%`, background: dark ? "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.22), rgba(255,255,255,0.08))" : "linear-gradient(90deg, #E7E5E0, #F6F4EF, #E7E5E0)", backgroundSize: "200% 100%", backgroundPosition: `${-f * 4}% 0` }} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * PROMPT: an AI chat input with a rotating rainbow glow, the prompt typed in, send pressed at `sendAt`,
 * then a "thinking" shimmer. Use whenever a video shows the prompt it was made from.
 */
export const PromptBox: React.FC<{ prompt: string; model?: string; start?: number; sendAt?: number; dark?: boolean }> = ({ prompt, model = "Any AI model", start = 8, sendAt, dark = true }) => {
  const f = useCurrentFrame();
  const times = typeTimes(prompt, start, 1.3);
  const n = times.filter((t) => f >= t).length;
  const send = sendAt ?? times[times.length - 1] + 10;
  const inS = pop(f, 0, 14);
  const sent = f >= send;
  return (
    <AbsoluteFill>
      <Aurora dark={dark} intensity={0.8} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 940, transform: `scale(${0.9 + 0.1 * inS})`, opacity: inS }}>
          <div style={{ position: "absolute", inset: -14, borderRadius: 64, background: `conic-gradient(from ${f * 4}deg, ${B.blue}, ${B.violet}, ${B.rose}, ${B.amber}, ${B.cyan}, ${B.blue})`, filter: "blur(26px)", opacity: sent ? 0.95 : 0.7 }} />
          <div style={{ position: "absolute", inset: -3, borderRadius: 54, background: `conic-gradient(from ${f * 4}deg, ${B.blue}, ${B.violet}, ${B.rose}, ${B.amber}, ${B.cyan}, ${B.blue})` }} />
          <div style={{ position: "relative", borderRadius: 52, background: dark ? "#0E1330" : B.white, padding: "46px 48px 34px", minHeight: 360 }}>
            <div style={{ fontFamily: F.inter, fontWeight: 600, fontSize: 50, lineHeight: 1.3, color: dark ? B.white : B.ink, minHeight: 200 }}>
              {prompt.slice(0, n)}
              {!sent && <span style={{ display: "inline-block", width: 4, height: 54, marginLeft: 3, background: B.cyan, verticalAlign: "middle", opacity: f % 20 < 11 ? 1 : 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26 }}>
              <div style={{ fontFamily: F.inter, fontWeight: 600, fontSize: 30, color: dark ? "rgba(255,255,255,0.55)" : "rgba(10,15,36,0.5)", padding: "10px 22px", borderRadius: 30, border: `2px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(10,15,36,0.12)"}` }}>{model} ▾</div>
              <div style={{ width: 96, height: 96, borderRadius: 48, background: n > 0 ? B.white : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${interpolate(f, [send - 2, send, send + 6], [1, 0.85, 1], cl)})` }}>
                <ArrowUp size={54} color={B.ink} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
        {sent && (
          <div style={{ marginTop: 70, display: "flex", gap: 22, opacity: prog(f, send + 4, send + 14) }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 30, height: 30, borderRadius: 15, background: dark ? B.white : B.ink, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((f - send) / 4 - i * 0.9)) }} />)}
          </div>
        )}
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

/** BIG NUMBER: counts up with the brand ease, label rises under it. `note` = source/"est." footnote. */
export const BigNumber: React.FC<{ value: number; prefix?: string; suffix?: string; label: string; note?: string; dur?: number; dark?: boolean; decimals?: number }> = ({ value, prefix = "", suffix = "", label, note, dur = 40, dark = true, decimals = 0 }) => {
  const f = useCurrentFrame();
  const p = prog(f, 4, 4 + dur);
  const v = (value * p).toFixed(decimals);
  const punch = interpolate(f, [4 + dur, 4 + dur + 4, 4 + dur + 12], [1, 1.06, 1], cl);
  return (
    <AbsoluteFill style={{ background: dark ? B.night : B.paper, alignItems: "center", justifyContent: "center" }}>
      <Aurora dark={dark} intensity={0.35} />
      <div style={{ textAlign: "center", transform: `scale(${punch})` }}>
        <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 300, letterSpacing: -12, lineHeight: 1, color: dark ? B.white : B.ink, fontVariantNumeric: "tabular-nums" }}>
          {prefix}{v}<span style={{ background: B.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{suffix}</span>
        </div>
        <div style={{ marginTop: 26, fontFamily: F.inter, fontWeight: 600, fontSize: 58, color: dark ? "rgba(255,255,255,0.8)" : "rgba(10,15,36,0.75)", opacity: prog(f, 16, 30), transform: `translateY(${(1 - prog(f, 16, 30)) * 24}px)` }}>{label}</div>
      </div>
      {note && <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: dark ? "rgba(255,255,255,0.45)" : "rgba(10,15,36,0.45)", opacity: prog(f, 30, 44) }}>{note}</div>}
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * STATEMENT: big lines rise out of a mask one by one; accent words get a marker sweep behind them.
 * lines: [[{t:"Learn "},{t:"AI",accent:true}], [{t:"from scratch."}]]
 */
export const Statement: React.FC<{ lines: Seg[][]; dark?: boolean; size?: number; step?: number; align?: "left" | "center" }> = ({ lines, dark = false, size = 130, step = 7, align = "left" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Aurora dark={dark} intensity={0.6} />
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px" }}>
        {lines.map((segs, li) => {
          const p = prog(f, 4 + li * step, 18 + li * step);
          return (
            <div key={li} style={{ overflow: "hidden", textAlign: align, paddingBottom: size * 0.08 }}>
              <div style={{ transform: `translateY(${(1 - p) * 110}%)`, fontFamily: F.inter, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.04, lineHeight: 1.02, color: dark ? B.white : B.ink }}>
                {segs.map((s, si) =>
                  s.accent ? (
                    <span key={si} style={{ position: "relative", display: "inline-block", color: B.blue }}>
                      <span style={{ position: "absolute", left: -8, right: -8, bottom: size * 0.06, height: size * 0.32, background: B.amber, opacity: 0.55, transformOrigin: "left", transform: `scaleX(${prog(f, 16 + li * step, 30 + li * step)})`, zIndex: -1, borderRadius: 8 }} />
                      {s.t}
                    </span>
                  ) : <span key={si}>{s.t}</span>
                )}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

/**
 * RANSOM STAMP: each word is a cut-paper scrap (random font, colour, tilt) stamped on its frame with a
 * small screen shake. Meme-energy punchlines. stampEvery: frames between words (7-8 = half a beat).
 */
const PAPERS = [
  { bg: B.white, fg: B.ink }, { bg: B.ink, fg: B.white }, { bg: "#FFE14D", fg: B.ink }, { bg: B.rose, fg: B.white },
  { bg: B.blue, fg: B.white }, { bg: "#F3EAD3", fg: "#B4232C" }, { bg: B.lime, fg: B.ink },
];
const FONTS = [F.anton, F.archivo, F.playfair, F.mono, F.bebas];
export const stampTimes = (words: string[], start = 6, every = 8) => words.map((_, i) => start + i * every);
export const RansomStamp: React.FC<{ words: string[]; bg?: string; start?: number; every?: number; size?: number }> = ({ words, bg = B.violet, start = 6, every = 8, size = 120 }) => {
  const f = useCurrentFrame();
  const times = stampTimes(words, start, every);
  const last = times.filter((t) => f >= t).length - 1;
  const shakeT = last >= 0 ? f - times[last] : 99;
  const shake = shakeT < 6 ? (6 - shakeT) * 2.2 : 0;
  return (
    <AbsoluteFill style={{ background: bg, backgroundImage: "radial-gradient(rgba(0,0,0,0.18) 1.6px, transparent 1.8px)", backgroundSize: "26px 26px" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px", transform: `translate(${Math.sin(f * 7) * shake}px, ${Math.cos(f * 9) * shake}px)` }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "26px 22px" }}>
          {words.map((w, i) => {
            if (f < times[i]) return <span key={i} style={{ visibility: "hidden", fontSize: size }}>{w}</span>;
            const s = interpolate(pop(f, times[i], 14, 0.4, 320), [0, 1], [1.7, 1]);
            const p = PAPERS[Math.floor(rand(`p${w}${i}`) * PAPERS.length)];
            const font = FONTS[Math.floor(rand(`f${w}${i}`) * FONTS.length)];
            const rot = (rand(`r${w}${i}`) - 0.5) * 12;
            return (
              <span key={i} style={{ display: "inline-block", background: p.bg, color: p.fg, fontFamily: font, fontWeight: font === F.playfair ? 900 : 700, fontStyle: font === F.playfair ? "italic" : "normal", fontSize: size * (0.85 + rand(`s${w}${i}`) * 0.35), lineHeight: 1, padding: "10px 22px 14px", transform: `scale(${s}) rotate(${rot}deg)`, boxShadow: "6px 8px 0 rgba(0,0,0,0.35)", clipPath: `polygon(0% ${rand(`a${i}`) * 8}%, 100% 0%, ${100 - rand(`b${i}`) * 3}% 100%, ${rand(`c${i}`) * 4}% ${100 - rand(`d${i}`) * 6}%)` }}>
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/** LETTER ASSEMBLE: letters fly in from scattered positions and lock; letter `late` drops in last with a bounce. */
export const LetterAssemble: React.FC<{ word: string; late?: number; dark?: boolean; size?: number; sub?: string }> = ({ word, late, dark = true, size = 230, sub }) => {
  const f = useCurrentFrame();
  const lateIdx = late ?? word.length - 1;
  return (
    <AbsoluteFill style={{ background: dark ? B.night : B.paper, alignItems: "center", justifyContent: "center" }}>
      <Aurora dark={dark} intensity={0.35} />
      <div style={{ display: "flex", fontFamily: F.anton, fontSize: size, color: dark ? B.white : B.ink, letterSpacing: 4 }}>
        {word.split("").map((ch, i) => {
          const isLate = i === lateIdx;
          const at = isLate ? 26 : 2 + i * 2;
          const p = isLate ? pop(f, at, 8, 0.7, 260) : prog(f, at, at + 16);
          const dx = isLate ? 0 : (rand(`x${i}`) - 0.5) * 900, dy = isLate ? -900 : (rand(`y${i}`) - 0.5) * 1400, rot = isLate ? 0 : (rand(`r${i}`) - 0.5) * 140;
          return (
            <span key={i} style={{ display: "inline-block", transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) rotate(${rot * (1 - p)}deg)`, color: isLate ? B.amber : undefined, opacity: interpolate(p, [0, 0.2], [0, 1], cl) }}>
              {ch === " " ? " " : ch}
            </span>
          );
        })}
      </div>
      {sub && <div style={{ position: "absolute", top: "60%", fontFamily: F.inter, fontWeight: 600, fontSize: 48, color: dark ? "rgba(255,255,255,0.75)" : "rgba(10,15,36,0.7)", opacity: prog(f, 34, 48) }}>{sub}</div>}
      <Grain />
    </AbsoluteFill>
  );
};

// 5x7 dot-matrix glyphs for episode numbers and short labels.
const GLYPH: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"], "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"], "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"], "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"], "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"], ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
};

/** DOT MATRIX: LED-style text (EP 01, 5.5 ...) lighting up column by column. */
export const DotMatrix: React.FC<{ text: string; color?: string; dot?: number; sub?: string }> = ({ text, color = "#FF6B4A", dot = 26, sub }) => {
  const f = useCurrentFrame();
  const chars = text.toUpperCase().split("");
  const cols = chars.length * 6;
  return (
    <AbsoluteFill style={{ background: "#0B0B0D", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: dot * 0.9 }}>
        {chars.map((ch, ci) => (
          <div key={ci} style={{ display: "grid", gridTemplateColumns: `repeat(5, ${dot}px)`, gap: dot * 0.28 }}>
            {(GLYPH[ch] ?? GLYPH[" "]).flatMap((row, r) => row.split("").map((v, c) => {
              const col = ci * 6 + c;
              const lit = v === "1" && f >= 4 + (col / cols) * 22 + rand(`${ci}${r}${c}`) * 3;
              return <div key={`${r}${c}`} style={{ width: dot, height: dot, borderRadius: dot * 0.22, background: lit ? color : "rgba(255,255,255,0.05)", boxShadow: lit ? `0 0 ${dot * 0.8}px ${color}` : "none" }} />;
            }))}
          </div>
        ))}
      </div>
      {sub && <div style={{ position: "absolute", top: "62%", fontFamily: F.mono, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: "rgba(255,255,255,0.7)", opacity: prog(f, 26, 40) }}>{sub}</div>}
    </AbsoluteFill>
  );
};
