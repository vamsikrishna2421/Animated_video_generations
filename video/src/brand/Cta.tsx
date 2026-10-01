import { Bell, Bookmark, Check, Heart, MessageCircle, Send } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { LogoMark } from "./Logo";
import { B, cl, easeInOut, F, pop, prog, rand } from "./tokens";

// Reusable calls to action. All timing is in local frames; the parent places the matching SFX
// (see CTA_SFX) so every CTA sounds the same across videos.

/** macOS-style pointer with a click ripple. */
export const Cursor: React.FC<{ x: number; y: number; press: number; ripple: number; scale?: number }> = ({ x, y, press, ripple, scale = 1.6 }) => (
  <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
    {ripple > 0 && ripple < 1 && (
      <div style={{ position: "absolute", left: -60 * ripple, top: -60 * ripple, width: 120 * ripple, height: 120 * ripple, borderRadius: "50%", border: `5px solid rgba(255,255,255,${0.9 * (1 - ripple)})`, boxShadow: `0 0 0 3px rgba(59,107,255,${0.6 * (1 - ripple)})` }} />
    )}
    <svg width={40 * scale} height={52 * scale} viewBox="0 0 40 52" style={{ transform: `scale(${1 - press * 0.15})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
      <path d="M2 2 L2 40 L12 31 L19 48 L26 45 L19 29 L33 29 Z" fill="#fff" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  </div>
);

/** Cursor path helper: glide from `from` to `to` between frames a..b, press at `clickAt`. */
export const cursorAt = (f: number, from: [number, number], to: [number, number], a: number, b: number, clickAt: number) => {
  const t = interpolate(f, [a, b], [0, 1], { ...cl, easing: easeInOut });
  const arc = Math.sin(t * Math.PI) * 60;
  return {
    x: from[0] + (to[0] - from[0]) * t,
    y: from[1] + (to[1] - from[1]) * t - arc,
    press: interpolate(f, [clickAt - 2, clickAt, clickAt + 4], [0, 1, 0], cl),
    ripple: interpolate(f, [clickAt, clickAt + 14], [0, 1], cl),
  };
};

export const CTA_SFX = { follow: { click: 46, heart: 49, chime: 52 }, engage: [70, 78, 86, 94] };

/**
 * Profile card: avatar with story ring, handle, tagline, Follow button. The cursor glides in and taps at
 * frame 46; the button flips to "Following ✓" with a burst. Then (optional) the like/comment/share/save row.
 */
export const FollowCard: React.FC<{ handle: string; tagline?: string; dark?: boolean; engage?: boolean; y?: number }> = ({ handle, tagline = "AI, explained simply.", dark = true, engage = true, y = 0 }) => {
  const f = useCurrentFrame();
  const inS = pop(f, 0, 13);
  const clickAt = CTA_SFX.follow.click;
  const done = f >= clickAt;
  const c = cursorAt(f, [980, 1500 + y], [700, 1010 + y], 18, clickAt - 2, clickAt);
  const btnScale = interpolate(f, [clickAt - 2, clickAt, clickAt + 6], [1, 0.9, 1], cl);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, right: 90, top: 640 + y, transform: `translateY(${(1 - inS) * 260}px) scale(${0.9 + 0.1 * inS})`, opacity: interpolate(inS, [0, 0.4], [0, 1], cl) }}>
        <div style={{ background: dark ? "rgba(17,22,44,0.92)" : B.white, borderRadius: 48, padding: "56px 56px 50px", boxShadow: "0 40px 100px rgba(0,0,0,0.35)", border: dark ? "1.5px solid rgba(255,255,255,0.08)" : "none", textAlign: "center" }}>
          <div style={{ width: 210, height: 210, margin: "0 auto", borderRadius: "50%", padding: 8, background: "conic-gradient(from 200deg, #F9CE34, #EE2A7B, #6228D7, #F9CE34)" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: dark ? "#11162C" : B.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoMark size={150} id="followAvatar" />
            </div>
          </div>
          <div style={{ marginTop: 30, fontFamily: F.inter, fontWeight: 800, fontSize: 58, color: dark ? B.white : B.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            {handle}
            <span style={{ width: 40, height: 40, borderRadius: 20, background: B.igBlue, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Check size={26} color="#fff" strokeWidth={4} /></span>
          </div>
          <div style={{ marginTop: 10, fontFamily: F.inter, fontWeight: 600, fontSize: 38, color: dark ? "rgba(255,255,255,0.65)" : "rgba(10,15,36,0.6)" }}>{tagline}</div>
          <div style={{ marginTop: 40, position: "relative", height: 112, transform: `scale(${btnScale})` }}>
            <div style={{ height: "100%", borderRadius: 26, background: done ? (dark ? "rgba(255,255,255,0.12)" : "#EFEFEF") : B.igBlue, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: F.inter, fontWeight: 800, fontSize: 48, color: done ? (dark ? B.white : B.ink) : B.white }}>
              {done ? <>Following <Check size={44} strokeWidth={3.5} /></> : "Follow"}
            </div>
          </div>
        </div>
      </div>
      {/* burst on tap */}
      {done && f < clickAt + 30 && Array.from({ length: 16 }, (_, i) => {
        const t = (f - clickAt) / 30, a = (i / 16) * Math.PI * 2 + rand(i) * 0.3, r = 120 + 360 * t;
        return <Heart key={i} size={36 + rand(`h${i}`) * 24} fill={[B.rose, B.amber, B.cyan, B.violet][i % 4]} color="transparent" style={{ position: "absolute", left: 540 + Math.cos(a) * r - 24, top: 1066 + y + Math.sin(a) * r - 24 + 200 * t * t, opacity: 1 - t, transform: `rotate(${i * 40}deg)` }} />;
      })}
      {engage && <EngageRow y={1330 + y} at={CTA_SFX.engage[0]} dark={dark} />}
      {f < clickAt + 24 && <Cursor {...c} />}
    </AbsoluteFill>
  );
};

/** Like / Comment / Share / Save, popping one per beat with a tap on each. */
export const EngageRow: React.FC<{ y: number; at: number; dark?: boolean; step?: number }> = ({ y, at, dark = true, step = 8 }) => {
  const f = useCurrentFrame();
  const items = [
    { Icon: Heart, label: "Like", fill: B.rose },
    { Icon: MessageCircle, label: "Comment", fill: B.cyan },
    { Icon: Send, label: "Share", fill: B.violet },
    { Icon: Bookmark, label: "Save", fill: B.amber },
  ];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "space-around" }}>
      {items.map(({ Icon, label, fill }, i) => {
        const t0 = at + i * step;
        const s = pop(f, t0, 9);
        const tapped = f >= t0 + 4;
        const bounce = interpolate(f, [t0 + 4, t0 + 8, t0 + 14], [1, 1.25, 1], cl);
        return (
          <div key={label} style={{ textAlign: "center", transform: `scale(${s})`, opacity: interpolate(s, [0, 0.3], [0, 1], cl) }}>
            <div style={{ width: 150, height: 150, borderRadius: 75, background: dark ? "rgba(255,255,255,0.08)" : B.white, boxShadow: dark ? "none" : "0 12px 30px rgba(10,15,36,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${bounce})` }}>
              <Icon size={72} strokeWidth={2.2} color={tapped ? fill : dark ? B.white : B.ink} fill={tapped ? fill : "transparent"} />
            </div>
            <div style={{ marginTop: 16, fontFamily: F.inter, fontWeight: 800, fontSize: 34, color: dark ? B.white : B.ink }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

/** YouTube subscribe button + bell; cursor taps at 30, bell rings after. Works on 16:9 or 9:16 (centered). */
export const Subscribe: React.FC<{ handle: string; dark?: boolean }> = ({ handle, dark = true }) => {
  const f = useCurrentFrame();
  const inS = pop(f, 0, 12);
  const clickAt = 30;
  const done = f >= clickAt;
  const ring = done ? Math.sin((f - clickAt) / 1.6) * 22 * Math.exp(-(f - clickAt) / 18) : 0;
  const c = cursorAt(f, [1650, 980], [1235, 535], 6, clickAt - 2, clickAt);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "26px 28px 26px 26px", borderRadius: 120, background: dark ? "rgba(17,22,44,0.9)" : B.white, boxShadow: "0 30px 80px rgba(0,0,0,0.35)", transform: `scale(${1.35 * inS})` }}>
        <LogoMark size={120} id="subAvatar" />
        <div style={{ marginRight: 20 }}>
          <div style={{ fontFamily: F.inter, fontWeight: 800, fontSize: 46, color: dark ? B.white : B.ink }}>{handle}</div>
          <div style={{ fontFamily: F.inter, fontWeight: 600, fontSize: 30, color: dark ? "rgba(255,255,255,0.6)" : "rgba(10,15,36,0.55)" }}>New videos every week</div>
        </div>
        <div style={{ padding: "26px 52px", borderRadius: 60, background: done ? (dark ? "rgba(255,255,255,0.14)" : "#EEE") : B.ytRed, color: done ? (dark ? B.white : B.ink) : B.white, fontFamily: F.inter, fontWeight: 800, fontSize: 40, letterSpacing: 1, transform: `scale(${interpolate(f, [clickAt - 2, clickAt, clickAt + 6], [1, 0.9, 1], cl)})` }}>
          {done ? "SUBSCRIBED" : "SUBSCRIBE"}
        </div>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: dark ? "rgba(255,255,255,0.1)" : "#F2F2F2", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${ring}deg)`, opacity: prog(f, clickAt, clickAt + 6) }}>
          <Bell size={52} color={dark ? B.white : B.ink} fill={done ? (dark ? B.white : B.ink) : "transparent"} />
        </div>
      </div>
      {f < clickAt + 20 && <Cursor {...c} />}
    </AbsoluteFill>
  );
};
