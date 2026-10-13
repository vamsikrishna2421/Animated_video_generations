import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fonts } from "../components/Fonts";

// Website demo reel (9:16): screen recordings of a web template made frame by frame in a browser. Phone recordings
// play full screen; the desktop recording sits in a browser window with camera moves; an end card points to the code.
export type Cam = { t: number; s: number; x: number; y: number };   // seconds into the segment, zoom, focus (0-1)
export type Seg = { kind: "phone" | "desk" | "end"; dur: number; src0?: number; title?: string; sub?: string; cam?: Cam[]; pos?: "top" | "bottom"; cont?: boolean };
export type WebDemoProps = { phone: string; desk: string; audio: string; url: string; handle: string; segs: Seg[]; end: { big: string; lines: string[]; cta: string } };
export const webDemoDuration = (p: WebDemoProps) => Math.round(p.segs.reduce((a, s) => a + s.dur, 0) * 30);

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SANS = "Inter, 'DejaVu Sans', sans-serif";
const BEBAS = "'Bebas Neue', Impact, sans-serif";
const RED = "#e50914";

const Caption: React.FC<{ title?: string; sub?: string; dur: number; pos?: "top" | "bottom" }> = ({ title, sub, dur, pos = "bottom" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!title) return null;
  const s = spring({ frame: f - 4, fps, config: { damping: 16, mass: 0.7 } });
  const out = interpolate(f, [dur * fps - 8, dur * fps], [1, 0], cl);
  const style: React.CSSProperties = pos === "top" ? { top: 170 } : { bottom: 250 };
  return (
    <div style={{ position: "absolute", left: 60, right: 60, textAlign: "center", ...style, opacity: s * out, transform: `translateY(${(1 - s) * 30}px)` }}>
      <div style={{ display: "inline-block", background: "rgba(8,8,8,0.72)", borderRadius: 22, padding: "18px 34px 20px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: BEBAS, fontSize: 92, lineHeight: 0.95, color: "#fff", letterSpacing: 1 }}>{title}</div>
        {sub ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: "#d0d0d0", marginTop: 8 }}>{sub}</div> : null}
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
  const W = 1000, H = 563, X = 40, Y = 700;
  const { s, x, y } = camAt(seg.cam, f / fps);
  const tx = Math.min(0, Math.max(W - W * s, W / 2 - x * W * s));
  const ty = Math.min(0, Math.max(H - H * s, H / 2 - y * H * s));
  const start = Math.round((seg.src0 ?? 0) * fps);
  const rise = seg.cont ? 1 : spring({ frame: f, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <OffthreadVideo src={staticFile(src)} startFrom={start} muted style={{ position: "absolute", height: 1920, width: 3413, left: -1166, top: 0, filter: "blur(38px) brightness(0.32) saturate(1.2)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920, background: "radial-gradient(ellipse at 50% 52%, rgba(229,9,20,0.16), rgba(0,0,0,0) 60%)" }} />
      <div style={{ position: "absolute", left: X, top: Y - 46, width: W, transform: `translateY(${(1 - rise) * 60}px) scale(${0.96 + 0.04 * rise})`, opacity: rise, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.12)" }}>
        <div style={{ height: 46, background: "#202020", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
          <span style={{ marginLeft: 18, flex: 1, height: 28, borderRadius: 14, background: "#121212", color: "#a0a0a0", fontFamily: SANS, fontSize: 18, display: "flex", alignItems: "center", paddingLeft: 16 }}>{url}</span>
        </div>
        <div style={{ position: "relative", width: W, height: H, overflow: "hidden", background: "#141414" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
            <OffthreadVideo src={staticFile(src)} startFrom={start} muted style={{ width: W, height: H }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ seg: Seg; src: string }> = ({ seg, src }) => {
  const { fps } = useVideoConfig();
  return <OffthreadVideo src={staticFile(src)} startFrom={Math.round((seg.src0 ?? 0) * fps)} muted style={{ width: 1080, height: 1920 }} />;
};

const End: React.FC<{ end: WebDemoProps["end"]; handle: string; dur: number }> = ({ end, handle, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = [...end.big];
  const mid = (letters.length - 1) / 2;
  const fadeOut = interpolate(f, [dur * fps - 10, dur * fps], [1, 0.9], cl);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 38%, #2a0306 0%, #000 62%)", alignItems: "center", opacity: fadeOut }}>
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
      <div style={{ position: "absolute", top: 1180, opacity: spring({ frame: f - 30, fps, config: { damping: 18 } }) }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, color: "#000", background: "#fff", borderRadius: 999, padding: "20px 46px" }}>{end.cta}</div>
      </div>
      <div style={{ position: "absolute", bottom: 300, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: "#fff", opacity: spring({ frame: f - 38, fps, config: { damping: 18 } }) }}>{handle}</div>
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
              {seg.kind === "phone" ? <Phone seg={seg} src={p.phone} /> : seg.kind === "desk" ? <Desk seg={seg} src={p.desk} url={p.url} /> : <End end={p.end} handle={p.handle} dur={seg.dur} />}
            </Cut>
            <Caption title={seg.title} sub={seg.sub} dur={seg.dur} pos={seg.pos} />
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
  const s = interpolate(f, [0, 7], [1.06, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(f, [0, 5], [0.35, 0], cl);
  return (
    <AbsoluteFill style={{ transform: `scale(${s})` }}>
      {children}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
