import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";

// Website demo reel (9:16): screen recordings of a web template made frame by frame in a browser. Phone recordings
// play full screen; the desktop recording sits in a browser window with camera moves; an end card points to the code.
export type Cam = { t: number; s: number; x: number; y: number };   // seconds into the segment, zoom, focus (0-1)
// A callout labels what the laptop shot is about: a pill pinned to a point on the screen recording (u, v: 0-1 of the
// recording), drawn in screen space so it stays big when the camera pushes in. y = fixed pill height on the canvas.
export type Callout = { t0: number; t1: number; text: string; sub?: string; u: number; v: number; y: number };
export type Seg = { kind: "phone" | "desk" | "deskfull" | "code" | "end" | "laptop" | "laptopcode"; dur: number; src0?: number; src?: string; clip?: string; title?: string; sub?: string; cam?: Cam[]; pos?: "top" | "bottom"; cont?: boolean; tag?: string; y?: number; open?: boolean; lcam?: Cam[]; callouts?: Callout[] };
export type CodeEdit = { file: string; lines: string[]; line: number; from: string; to: string };
export type WebDemoProps = { phone: string; desk: string; audio: string; url: string; handle: string; segs: Seg[]; code?: CodeEdit; end: { big: string; lines: string[]; cta: string } };
export const webDemoDuration = (p: WebDemoProps) => Math.round(p.segs.reduce((a, s) => a + s.dur, 0) * 30);

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SANS = "Inter, 'DejaVu Sans', sans-serif";
const BEBAS = "'Bebas Neue', Impact, sans-serif";
const RED = "#e50914";

const Caption: React.FC<{ title?: string; sub?: string; dur: number; pos?: "top" | "bottom"; y?: number; instant?: boolean }> = ({ title, sub, dur, pos = "bottom", y, instant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!title) return null;
  const s = instant ? 1 : spring({ frame: f - 4, fps, config: { damping: 16, mass: 0.7 } });   // the hook caption is up on frame 0
  const out = interpolate(f, [dur * fps - 8, dur * fps], [1, 0], cl);
  const style: React.CSSProperties = y != null ? { top: y } : pos === "top" ? { top: 170 } : { bottom: 250 };
  return (
    <div style={{ position: "absolute", left: 60, right: 60, textAlign: "center", ...style, opacity: s * out, transform: `translateY(${(1 - s) * 30}px)` }}>
      <div style={{ display: "inline-block", background: "rgba(8,8,8,0.72)", borderRadius: 22, padding: "18px 34px 20px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: BEBAS, fontSize: 92, lineHeight: 0.95, color: "#fff", letterSpacing: 1, whiteSpace: "pre-line" }}>{title}</div>
        {sub ? <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, color: "#f0f0f0", marginTop: 10 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

const camAt = (cam: Cam[] | undefined, t: number) => {
  if (!cam || cam.length === 0) return { s: 1, x: 0.5, y: 0.5 };
  const ts = cam.map((c) => c.t);
  const opt = { ...cl, easing: Easing.inOut(Easing.cubic) };
  return { s: interpolate(t, ts, cam.map((c) => c.s), opt), x: interpolate(t, ts, cam.map((c) => c.x), opt), y: interpolate(t, ts, cam.map((c) => c.y), opt) };
};

const Desk: React.FC<{ seg: Seg; src: string; url: string }> = ({ seg, src, url }) => {   // cont: same shot continues, no entrance
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // A square camera window onto the 16:9 desktop recording: at zoom 1 it shows the full height and pans across.
  const W = 1040, H = 1000, X = 20, Y = 520;
  const SH = H, SW = (H * 1920) / 1080;
  const { s, x, y } = camAt(seg.cam, f / fps);
  const tx = Math.min(0, Math.max(W - SW * s, W / 2 - x * SW * s));
  const ty = Math.min(0, Math.max(H - SH * s, H / 2 - y * SH * s));
  const start = Math.round((seg.src0 ?? 0) * fps);
  const rise = seg.cont ? 1 : spring({ frame: f, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <OffthreadVideo src={staticFile(src)} startFrom={start} muted style={{ position: "absolute", height: 1920, width: 3413, left: -1166, top: 0, filter: "blur(38px) brightness(0.3) saturate(1.2)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920, background: "radial-gradient(ellipse at 50% 52%, rgba(229,9,20,0.16), rgba(0,0,0,0) 60%)" }} />
      <div style={{ position: "absolute", left: X, top: Y - 46, width: W, transform: `translateY(${(1 - rise) * 60}px) scale(${0.96 + 0.04 * rise})`, opacity: rise, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.12)" }}>
        <div style={{ height: 46, background: "#202020", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
          <span style={{ marginLeft: 18, flex: 1, height: 28, borderRadius: 14, background: "#121212", color: "#a0a0a0", fontFamily: SANS, fontSize: 18, display: "flex", alignItems: "center", paddingLeft: 16 }}>{url}</span>
        </div>
        <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "#141414" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
            <OffthreadVideo src={staticFile(src)} startFrom={start} muted style={{ width: SW, height: SH }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};


// Full-screen close-up of the desktop recording (9:16 crop that pans and zooms), with a small "laptop view" tag.
const DeskFull: React.FC<{ seg: Seg; src: string }> = ({ seg, src }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 1080, H = 1920, SH = H, SW = (H * 1920) / 1080;
  const { s, x, y } = camAt(seg.cam, f / fps);
  const tx = Math.min(0, Math.max(W - SW * s, W / 2 - x * SW * s));
  const ty = Math.min(0, Math.max(H - SH * s, H / 2 - y * SH * s));
  return (
    <AbsoluteFill style={{ background: "#141414", overflow: "hidden" }}>
      {seg.clip ? (
        // pre-cropped along the camera path by pipeline/web_demo/closeups.py (sharp, and light for the renderer)
        <OffthreadVideo src={staticFile(seg.clip)} muted style={{ width: W, height: H }} />
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
          <OffthreadVideo src={staticFile(src)} startFrom={Math.round((seg.src0 ?? 0) * fps)} muted style={{ width: SW, height: SH }} />
        </div>
      )}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.45) 100%)" }} />
      <Tag seg={seg} />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ seg: Seg }> = ({ seg }) => {
  if (!seg.tag) return null;
  const phone = seg.tag.startsWith("PHONE");
  const top = seg.y != null ? seg.y - 100 : 440;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(229,9,20,0.92)", borderRadius: 999, padding: "10px 26px", boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
        {phone
          ? <svg width="22" height="34" viewBox="0 0 22 34"><rect x="2" y="2" width="18" height="30" rx="4" fill="none" stroke="#fff" strokeWidth="3" /><circle cx="11" cy="27" r="1.8" fill="#fff" /></svg>
          : <svg width="40" height="30" viewBox="0 0 40 30"><rect x="6" y="2" width="28" height="19" rx="2" fill="none" stroke="#fff" strokeWidth="3" /><path d="M1 25h38l-3 4H4z" fill="#fff" /></svg>}
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 32, color: "#fff", letterSpacing: 2 }}>{seg.tag}</span>
      </div>
    </div>
  );
};

// The one-line edit: config.js in a code editor, the name is deleted and retyped.
const Code: React.FC<{ seg: Seg; code: CodeEdit }> = ({ seg, code }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const del0 = 0.7, del1 = del0 + 0.05 * code.from.length, typ1 = del1 + 0.25 + 0.09 * code.to.length;
  let shown = code.from;
  if (t >= del0 && t < del1) shown = code.from.slice(0, Math.max(0, code.from.length - Math.floor((t - del0) / 0.05)));
  else if (t >= del1) shown = code.to.slice(0, Math.max(0, Math.min(code.to.length, Math.floor((t - del1 - 0.25) / 0.09) + 1)));
  const saved = t > typ1 + 0.35;
  const blink = Math.floor(t * 2.4) % 2 === 0 || (t > del0 && t < typ1);
  const rise = spring({ frame: f, fps, config: { damping: 18 } });
  const MONO = "'DejaVu Sans Mono', 'Space Mono', monospace";
  const colour = (ln: string) => {
    if (ln.trim().startsWith("//")) return <span style={{ color: "#6a9955" }}>{ln}</span>;
    return ln.split(/("[^"]*")/).map((part, i) => <span key={i} style={{ color: part.startsWith('"') ? "#ce9178" : /^\s*[a-z]+:/.test(part) ? "#9cdcfe" : "#d4d4d4" }}>{part}</span>);
  };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1c1c24 0%, #050505 70%)" }}>
      <div style={{ position: "absolute", left: 40, right: 40, top: 560, borderRadius: 20, overflow: "hidden", background: "#1e1e1e", boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)", transform: `translateY(${(1 - rise) * 50}px)`, opacity: rise }}>
        <div style={{ height: 64, background: "#2d2d2d", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <span style={{ marginLeft: 20, fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#ddd" }}>{code.file}{saved ? "" : " ●"}</span>
          {saved ? <span style={{ marginLeft: "auto", fontFamily: SANS, fontWeight: 800, fontSize: 26, color: "#46d369" }}>saved</span> : null}
        </div>
        <div style={{ padding: "30px 26px 38px", fontFamily: MONO, fontSize: 33, lineHeight: 1.6, whiteSpace: "pre" }}>
          {code.lines.map((ln, i) => {
            const hot = i === code.line;
            const body = hot ? ln.replace(`"${code.from}"`, `"${shown}${blink ? "|" : " "}"`) : ln;
            return (
              <div key={i} style={{ display: "flex", background: hot ? "rgba(229,9,20,0.18)" : "transparent", borderLeft: hot ? "6px solid #e50914" : "6px solid transparent", paddingLeft: 12 }}>
                <span style={{ width: 52, color: "#5a5a5a", flexShrink: 0 }}>{i + 1}</span>
                <span>{colour(body)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// A laptop on a dark stage; the screen plays a desktop recording (or the config.js edit). `open` swings the lid up
// at the start; `lcam` pushes the camera in (s = zoom, x/y = focus point on the 1080 x 1920 canvas, 0-1).
const LW = 920, LH = 518, LX = 80, LY = 700;     // screen (inside the bezel) on the canvas
const LaptopFrame: React.FC<{ seg: Seg; children: React.ReactNode }> = ({ seg, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const lid = seg.open ? interpolate(t, [0, 0.75], [88, 0], { ...cl, easing: Easing.out(Easing.cubic) }) : 0;
  const glow = seg.open ? interpolate(t, [0.1, 0.8], [0, 1], cl) : 1;
  const leak = seg.open ? interpolate(t, [0, 0.35, 0.9], [1, 1, 0], cl) : 0;   // red light from the gap under the lid, frame 1 on
  const { s, x, y } = camAt(seg.lcam, t);
  const tx = 540 - x * 1080 * s, ty = 960 - y * 1920 * s;
  const B = 30;   // bezel
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, #2a1013 0%, #0a0607 55%, #050505 100%)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        {/* floor glow and shadow; on a closed lid the red light leaks out along the hinge */}
        <div style={{ position: "absolute", left: 60, top: LY + LH + 40, width: 960, height: 160, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 40%, rgba(229,9,20,0.28), rgba(0,0,0,0) 70%)", filter: "blur(10px)", opacity: Math.max(glow, 0.8 * leak) }} />
        <div style={{ position: "absolute", left: 40, top: LY + LH + B - 150, width: 1000, height: 260, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 60%, rgba(255,40,50,0.85), rgba(229,9,20,0.35) 35%, rgba(0,0,0,0) 70%)", filter: "blur(16px)", opacity: leak }} />
        <div style={{ position: "absolute", left: 30, top: LY + LH + B + 46, width: 1020, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.75)", filter: "blur(18px)" }} />
        {/* base: deck seen from slightly above, then the front edge */}
        <div style={{ position: "absolute", left: 0, top: LY + LH + B + 4, width: 1080, height: 42, background: "linear-gradient(180deg, #3a3d44 0%, #23252b 100%)", clipPath: "polygon(5% 0, 95% 0, 100% 70%, 0 70%)" }} />
        <div style={{ position: "absolute", left: 0, top: LY + LH + B + 33, width: 1080, height: 14, background: "linear-gradient(180deg, #5a5f6a, #1b1c20)", borderRadius: "0 0 18px 18px", boxShadow: "0 -1px 0 rgba(255,255,255,0.18)" }} />
        <div style={{ position: "absolute", left: 470, top: LY + LH + B + 4, width: 140, height: 10, background: "#16171b", borderRadius: "0 0 10px 10px" }} />
        {/* lid */}
        <div style={{ position: "absolute", left: LX - B, top: LY - B, width: LW + 2 * B, height: LH + 2 * B + 4, perspective: 1600, perspectiveOrigin: "50% 100%" }}>
          <div style={{ width: "100%", height: "100%", transformOrigin: "50% 100%", transform: `rotateX(${lid}deg)`, background: "linear-gradient(180deg, #34363d, #17181c)", borderRadius: 26, boxShadow: "0 0 0 2px #4a4d56 inset, 0 2px 0 0 rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(255,255,255,0.14), 0 0 60px rgba(229,9,20,0.22), 0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ position: "absolute", left: B, top: B, width: LW, height: LH, background: "#000", overflow: "hidden", borderRadius: 6, opacity: glow }}>
              {children}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%)", pointerEvents: "none" }} />
            </div>
            <div style={{ position: "absolute", left: "50%", top: 11, width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: "#0d0e10", boxShadow: "0 0 0 2px #2c2e33" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Callouts: React.FC<{ seg: Seg }> = ({ seg }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (!seg.callouts) return null;
  const { s, x, y } = camAt(seg.lcam, t);
  const tx = 540 - x * 1080 * s, ty = 960 - y * 1920 * s;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {seg.callouts.map((c, i) => {
        if (t < c.t0 - 0.05 || t > c.t1 + 0.3) return null;
        const k = spring({ frame: f - Math.round(c.t0 * fps), fps, config: { damping: 14, mass: 0.6 } });
        const out = interpolate(t, [c.t1, c.t1 + 0.25], [1, 0], cl);
        const ax = tx + (LX + c.u * LW) * s, ay = ty + (LY + c.v * LH) * s;   // the anchor on screen
        const cx = 540 + Math.max(-300, Math.min(300, ax - 540)), above = c.y < ay;   // pill centre (kept on screen)
        const y0 = above ? c.y + (c.sub ? 148 : 98) : c.y, y1 = above ? ay - 18 : ay + 18;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: out }}>
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1={cx} y1={y0} x2={cx + (ax - cx) * k} y2={y0 + (y1 - y0) * k} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
              <circle cx={ax} cy={ay} r={18 * k} fill="none" stroke="#fff" strokeWidth={6} />
            </svg>
            <div style={{ position: "absolute", top: c.y, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateX(${cx - 540}px) scale(${0.6 + 0.4 * k})`, opacity: k }}>
              <div style={{ background: RED, borderRadius: 18, padding: "10px 30px 12px", boxShadow: "0 10px 30px rgba(0,0,0,0.55)", textAlign: "center" }}>
                <div style={{ fontFamily: BEBAS, fontSize: 76, lineHeight: 1, color: "#fff", letterSpacing: 1 }}>{c.text}</div>
                {c.sub ? <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, color: "#fff", marginTop: 4 }}>{c.sub}</div> : null}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const LaptopVideo: React.FC<{ seg: Seg; src: string }> = ({ seg, src }) => {
  const { fps } = useVideoConfig();
  return (
    <LaptopFrame seg={seg}>
      <OffthreadVideo src={staticFile(src)} startFrom={Math.round((seg.src0 ?? 0) * fps)} muted style={{ width: LW, height: LH }} />
    </LaptopFrame>
  );
};

// The config.js edit, drawn at screen size on the laptop.
const LaptopCode: React.FC<{ seg: Seg; code: CodeEdit }> = ({ seg, code }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const del0 = 0.7, del1 = del0 + 0.05 * code.from.length, typ1 = del1 + 0.25 + 0.09 * code.to.length;
  let shown = code.from;
  if (t >= del0 && t < del1) shown = code.from.slice(0, Math.max(0, code.from.length - Math.floor((t - del0) / 0.05)));
  else if (t >= del1) shown = code.to.slice(0, Math.max(0, Math.min(code.to.length, Math.floor((t - del1 - 0.25) / 0.09) + 1)));
  const saved = t > typ1 + 0.35;
  const blink = Math.floor(t * 2.4) % 2 === 0 || (t > del0 && t < typ1);
  const MONO = "'DejaVu Sans Mono', 'Space Mono', monospace";
  const colour = (ln: string) => {
    if (ln.trim().startsWith("//")) return <span style={{ color: "#6a9955" }}>{ln}</span>;
    return ln.split(/("[^"]*")/).map((part, i) => <span key={i} style={{ color: part.startsWith('"') ? "#ce9178" : /^\s*[a-z]+:/.test(part) ? "#9cdcfe" : "#d4d4d4" }}>{part}</span>);
  };
  return (
    <LaptopFrame seg={seg}>
      <div style={{ width: LW, height: LH, background: "#1e1e1e" }}>
        <div style={{ height: 40, background: "#2d2d2d", display: "flex", alignItems: "center", padding: "0 16px", gap: 9 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <span style={{ marginLeft: 14, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: "#ddd" }}>{code.file}{saved ? "" : " ●"}</span>
          {saved ? <span style={{ marginLeft: "auto", fontFamily: SANS, fontWeight: 800, fontSize: 19, color: "#46d369" }}>saved</span> : null}
        </div>
        <div style={{ padding: "22px 20px", fontFamily: MONO, fontSize: 27, lineHeight: 1.6, whiteSpace: "pre" }}>
          {code.lines.map((ln, i) => {
            const hot = i === code.line;
            const body = hot ? ln.replace(`"${code.from}"`, `"${shown}${blink ? "|" : " "}"`) : ln;
            return (
              <div key={i} style={{ display: "flex", background: hot ? "rgba(229,9,20,0.2)" : "transparent", borderLeft: hot ? "5px solid #e50914" : "5px solid transparent", paddingLeft: 10 }}>
                <span style={{ width: 40, color: "#5a5a5a", flexShrink: 0 }}>{i + 1}</span>
                <span>{colour(body)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </LaptopFrame>
  );
};

const Phone: React.FC<{ seg: Seg; src: string }> = ({ seg, src }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <OffthreadVideo src={staticFile(src)} startFrom={Math.round((seg.src0 ?? 0) * fps)} muted style={{ width: 1080, height: 1920 }} />
      <Tag seg={seg} />
    </AbsoluteFill>
  );
};

const End: React.FC<{ end: WebDemoProps["end"]; handle: string; dur: number }> = ({ end, handle, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = [...end.big];
  const mid = (letters.length - 1) / 2;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 38%, #2a0306 0%, #000 62%)", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 520, display: "flex", fontFamily: BEBAS, fontSize: 210, color: RED, lineHeight: 1, filter: "drop-shadow(0 0 30px rgba(229,9,20,0.55))" }}>
        {letters.map((ch, i) => {
          const d = Math.abs(i - mid);
          const k = spring({ frame: f - 3 - d * 2, fps, config: { damping: 15, mass: 0.8 } });
          const sy = 1 + 0.22 * Math.pow(d / Math.max(1, mid), 2);
          return <span key={i} style={{ display: "inline-block", opacity: k, transform: `scale(${1.8 - 0.8 * k}) scaleY(${sy})`, filter: `blur(${(1 - k) * 14}px)` }}>{ch === " " ? " " : ch}</span>;
        })}
      </div>
      <div style={{ position: "absolute", top: 820, left: 80, right: 80, textAlign: "center" }}>
        {end.lines.map((l, i) => {
          const k = spring({ frame: f - 14 - i * 5, fps, config: { damping: 18 } });
          return <div key={i} style={{ fontFamily: SANS, fontWeight: i === 0 ? 800 : 600, fontSize: i === 0 ? 64 : 42, color: i === 0 ? "#fff" : "#cfcfcf", marginTop: i === 0 ? 0 : 18, opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>{l}</div>;
        })}
      </div>
      <div style={{ position: "absolute", top: 1180, opacity: spring({ frame: f, fps, config: { damping: 14 } }), transform: `scale(${1.25 - 0.25 * spring({ frame: f, fps, config: { damping: 12 } })})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 54, color: "#000", background: "#fff", borderRadius: 999, padding: "22px 52px" }}>{end.cta}</div>
      </div>
      <div style={{ position: "absolute", top: 1330, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: "#fff", opacity: spring({ frame: f - 6, fps, config: { damping: 18 } }) }}>{handle}</div>
    </AbsoluteFill>
  );
};

export const WebDemo: React.FC<WebDemoProps> = (p) => {
  const { fps } = useVideoConfig();
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      <style>{`@font-face{font-family:'Bebas Neue';src:url(${staticFile("fonts/bebas-neue-latin-400-normal.woff2")}) format('woff2');}`}</style>
      {p.segs.map((seg, i) => {
        const from = Math.round(at * fps), len = Math.round(seg.dur * fps);
        at += seg.dur;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Cut first={i === 0 || !!seg.cont}>
              {seg.kind === "phone" ? <Phone seg={seg} src={seg.src ?? p.phone} />
                : seg.kind === "desk" ? <Desk seg={seg} src={p.desk} url={p.url} />
                : seg.kind === "deskfull" ? <DeskFull seg={seg} src={p.desk} />
                : seg.kind === "code" && p.code ? <Code seg={seg} code={p.code} />
                : seg.kind === "laptop" ? <LaptopVideo seg={seg} src={seg.src ?? p.desk} />
                : seg.kind === "laptopcode" && p.code ? <LaptopCode seg={seg} code={p.code} />
                : <End end={p.end} handle={p.handle} dur={seg.dur} />}
            </Cut>
            <Callouts seg={seg} />
            <Caption title={seg.title} sub={seg.sub} dur={seg.dur} pos={seg.pos} y={seg.y} instant={i === 0} />
          </Sequence>
        );
      })}
      <Audio src={staticFile(p.audio)} />
    </AbsoluteFill>
  );
};

// Each segment arrives with a short punch-in (scale 1.06 -> 1) and a flash, on the beat hit in the soundtrack.
const Cut: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  if (first) return <AbsoluteFill>{children}</AbsoluteFill>;
  const s = interpolate(f, [0, 7], [1.035, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(f, [0, 5], [0.35, 0], cl);
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      {children}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
