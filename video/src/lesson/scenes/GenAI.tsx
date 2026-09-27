import { interpolate, useCurrentFrame } from "remotion";
import { Icon, IconTile } from "../Icon";
import { L, SceneProps, clamp, gradText } from "../theme";
import { Heading, Panel, useSpring } from "./common";

export const GenAI: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const phone = useSpring(4, 14);
  const prompt: string = data.prompt;
  const reply: string = data.reply;
  const typedP = Math.floor(interpolate(f, [12, 12 + prompt.length * 0.9], [0, prompt.length], clamp));
  const replyStart = 12 + prompt.length * 0.9 + 25;
  const typedR = Math.floor(interpolate(f, [replyStart, replyStart + reply.length * 0.8], [0, reply.length], clamp));
  const thinking = f > replyStart - 22 && f < replyStart;
  const fact = useSpring(cue(5), 12);
  return (
    <>
      <Heading kicker={data.kicker ?? "THE NEWEST LAYER"}>
        Generative <span style={gradText(L.amber, L.rose)}>AI</span>
      </Heading>
      <Panel style={{ position: "absolute", top: 480, left: 90, right: 90, padding: 30, opacity: phone, transform: `translateY(${(1 - phone) * 60}px)` }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: 640, background: L.blue, borderRadius: "28px 28px 6px 28px", padding: "20px 26px", fontFamily: L.font, fontSize: 34, fontWeight: 600, color: "white" }}>
            {prompt.slice(0, typedP)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "flex-start", opacity: f > replyStart - 22 ? 1 : 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${L.amber}, ${L.rose})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="Sparkles" size={34} />
          </div>
          <div style={{ maxWidth: 640, background: "rgba(255,255,255,0.1)", borderRadius: "28px 28px 28px 6px", padding: "20px 26px", fontFamily: L.font, fontSize: 34, fontWeight: 600, color: L.text, minHeight: 50 }}>
            {thinking ? (
              <span style={{ letterSpacing: 8 }}>{".".repeat(1 + (Math.floor(f / 5) % 3))}</span>
            ) : (
              reply.slice(0, typedR)
            )}
          </div>
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 880, left: 60, right: 60, display: "flex", justifyContent: "space-between" }}>
        {data.outputs.map(([icon, label]: [string, string], i: number) => {
          const s = useSpring(cue(i), 10);
          return (
            <div key={label} style={{ textAlign: "center", transform: `scale(${s}) translateY(${Math.sin((f + i * 8) / 10) * 6}px)`, opacity: s }}>
              <IconTile name={icon} size={150} from={[L.amber, L.violet, L.rose, L.blue, L.teal][i]} to={[L.rose, L.blue, L.amber, L.teal, L.green][i]} />
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 30, color: L.text, marginTop: 12 }}>{label}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1120,
          left: 60,
          right: 60,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "16px 26px",
          borderRadius: 24,
          background: "rgba(245,158,11,0.15)",
          border: `2px solid ${L.amber}`,
          opacity: fact,
          transform: `scale(${fact})`,
        }}
      >
        <svg width="90" height="50" viewBox="0 0 90 50">
          {Array.from({ length: 12 }).map((_, k) => {
            const h = 8 + Math.abs(Math.sin(f / 3 + k)) * 36;
            return <rect key={k} x={k * 7.5} y={25 - h / 2} width="4.5" height={h} rx="2" fill={L.amber} />;
          })}
        </svg>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 32, color: L.amber }}>{data.funfact}</div>
      </div>
    </>
  );
};
