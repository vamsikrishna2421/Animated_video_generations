import { Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "../Icon";
import { L, SceneProps, clamp } from "../theme";
import { Panel, useSpring } from "./common";

export const Quiz: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = useSpring(0, 9);
  const reveal = cue(1);
  const countFrom = cue(0) + Math.round(0.9 * fps);
  const secondsLeft = Math.max(0, Math.ceil((reveal - f) / fps));
  const counting = f >= countFrom && f < reveal;
  const ring = interpolate(f, [countFrom, reveal], [1, 0], clamp);
  const shown = f >= reveal;
  const ticks = Array.from({ length: Math.max(0, Math.floor((reveal - countFrom) / fps)) }, (_, i) => countFrom + i * fps);
  return (
    <>
      <div style={{ position: "absolute", top: 290, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ display: "inline-block", transform: `scale(${badge}) rotate(${(1 - badge) * -20}deg)`, fontFamily: L.font, fontWeight: 800, fontSize: 64, letterSpacing: 10, color: "#0A0F24", background: L.amber, padding: "14px 44px", borderRadius: 24 }}>
          QUICK QUIZ
        </div>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 60, color: L.text, marginTop: 44, padding: "0 70px", lineHeight: 1.15 }}>{data.question}</div>
      </div>
      {data.options.map((o: string, i: number) => {
        const s = useSpring(10 + i * 6, 12);
        const right = i === data.answer;
        const col = shown ? (right ? L.green : "rgba(255,255,255,0.15)") : L.border;
        return (
          <Panel
            key={o}
            style={{
              position: "absolute",
              top: 620 + i * 160,
              left: 90,
              right: 90,
              height: 130,
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "0 34px",
              borderColor: col,
              borderWidth: 4,
              background: shown && right ? "rgba(52,211,153,0.18)" : L.card,
              opacity: s * (shown && !right ? 0.4 : 1),
              transform: `translateX(${(1 - s) * -600}px) scale(${shown && right ? 1.05 : 1})`,
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 35, background: shown && right ? L.green : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: L.font, fontWeight: 800, fontSize: 36, color: "white" }}>
              {shown && right ? <Icon name="Check" size={44} stroke={3.5} /> : "ABC"[i]}
            </div>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: o.length > 26 ? 36 : 46, color: L.text, lineHeight: 1.15 }}>{o}</div>
          </Panel>
        );
      })}
      {counting && (
        <div style={{ position: "absolute", top: 1100, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <svg width="130" height="130">
            <circle cx="65" cy="65" r="55" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
            <circle cx="65" cy="65" r="55" stroke={L.amber} strokeWidth="10" fill="none" strokeDasharray={2 * Math.PI * 55} strokeDashoffset={2 * Math.PI * 55 * (1 - ring)} transform="rotate(-90 65 65)" strokeLinecap="round" />
            <text x="65" y="82" textAnchor="middle" fill="white" fontFamily="Inter" fontWeight={800} fontSize="52">{secondsLeft}</text>
          </svg>
        </div>
      )}
      {shown && (
        <div style={{ position: "absolute", top: 1115, left: 0, right: 0, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 40, color: L.green, opacity: interpolate(f, [reveal, reveal + 10], [0, 1], clamp) }}>
          Comment your score below!
        </div>
      )}
      {ticks.map((t) => (
        <Sequence key={t} from={t} durationInFrames={6} layout="none">
          <Audio src={staticFile("audio/sfx_tick.wav")} volume={0.6} />
        </Sequence>
      ))}
      <Sequence from={reveal} durationInFrames={45} layout="none">
        <Audio src={staticFile("audio/sfx_success.wav")} volume={0.5} />
      </Sequence>
    </>
  );
};
