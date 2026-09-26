import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp, gradText } from "../theme";
import { useSpring } from "./common";

// Follow call-to-action: tap on the follow button, then the bell rings.
export const Cta: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const head = useSpring(0, 12);
  const tap = cue(0);
  const followed = f > tap + 6;
  const press = f > tap && f < tap + 6 ? 0.9 : 1;
  const bell = useSpring(cue(1), 10);
  const ring = f > cue(1) ? Math.sin((f - cue(1)) / 1.5) * 18 * Math.exp(-(f - cue(1)) / 25) : 0;
  return (
    <>
      <div style={{ position: "absolute", top: 330, left: 60, right: 60, textAlign: "center", opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 92, lineHeight: 1.05, color: L.text }}>{data.headline}</div>
        <div style={{ fontFamily: L.font, fontWeight: 700, fontSize: 44, marginTop: 20, ...gradText(L.amber, L.rose) }}>{data.sub}</div>
      </div>
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div
          style={{
            position: "relative",
            padding: "30px 80px",
            borderRadius: 60,
            background: followed ? "rgba(255,255,255,0.12)" : `linear-gradient(90deg, ${L.violet}, ${L.teal})`,
            border: `3px solid ${followed ? L.border : "transparent"}`,
            fontFamily: L.font,
            fontWeight: 800,
            fontSize: 54,
            color: "white",
            transform: `scale(${press * (followed ? 1 : 1 + 0.04 * Math.sin(f / 5))})`,
            boxShadow: followed ? "none" : `0 0 60px ${L.violet}`,
          }}
        >
          {followed ? "Following ✓" : "Follow"}
          {f > tap - 12 && f < tap + 16 && (
            <div style={{ position: "absolute", right: 30, bottom: -50, transform: `translate(${interpolate(f, [tap - 12, tap], [120, 0], clamp)}px, ${interpolate(f, [tap - 12, tap], [120, 0], clamp)}px)` }}>
              <Icon name="MousePointer2" size={80} color="white" />
            </div>
          )}
        </div>
        <div style={{ transform: `scale(${bell}) rotate(${ring}deg)`, opacity: bell, transformOrigin: "50% 10%" }}>
          <div style={{ width: 130, height: 130, borderRadius: 65, background: L.amber, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 50px ${L.amber}` }}>
            <Icon name="BellRing" size={70} color="#0A0F24" />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 990, left: 60, right: 60, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 40, color: L.text, opacity: interpolate(f, [cue(2), cue(2) + 12], [0, 1], clamp) }}>
        {data.footer}
      </div>
      <div style={{ position: "absolute", top: 1070, left: 0, right: 0, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 48, opacity: interpolate(f, [cue(2), cue(2) + 12], [0, 1], clamp), ...gradText(L.violet, L.teal) }}>
        {data.handle}
      </div>
    </>
  );
};
