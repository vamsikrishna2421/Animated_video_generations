import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

// Quiz-reel ending: score bands reveal on cues [1..n], then the comment prompt on cue n+1.
// data: { heading, kicker?, bands: [range, label, icon][], prompt }
const COL = [L.green, L.teal, L.amber];

export const Score: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const bands: string[][] = data.bands;
  const promptS = useSpring(cue(bands.length), 11);
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, f - cue(bands.length)) / 6);
  return (
    <>
      <Heading kicker={data.kicker ?? "YOUR SCORE"}>{data.heading}</Heading>
      {bands.map(([range, label, icon], i) => {
        const s = useSpring(cue(i), 12);
        const c = COL[i % COL.length];
        return (
          <Panel key={range} style={{ position: "absolute", top: 480 + i * 170, left: 70, right: 70, height: 140, display: "flex", alignItems: "center", gap: 30, padding: "0 36px", borderColor: c, opacity: s, transform: `translateX(${(1 - s) * 500}px)` }}>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 60, color: c, width: 170 }}>{range}</div>
            <Icon name={icon} size={52} color={c} />
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 40, color: L.text, lineHeight: 1.2 }}>{label}</div>
          </Panel>
        );
      })}
      <div style={{ position: "absolute", top: 480 + bands.length * 170 + 30, left: 70, right: 70, textAlign: "center", opacity: promptS, transform: `scale(${(0.8 + 0.2 * promptS) * pulse})` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 18, background: L.amber, color: "#0A0F24", borderRadius: 28, padding: "22px 40px", fontFamily: L.font, fontWeight: 800, fontSize: 46 }}>
          <Icon name="MessageCircle" size={48} color="#0A0F24" /> {data.prompt}
        </div>
      </div>
    </>
  );
};
