import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const C = [L.violet, L.blue, L.teal, L.green, L.amber, L.rose];

// A sentence gets chopped into coloured token chips, then key facts about tokens.
export const Tokens: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const toks: string[] = data.tokens;
  const start = cue(0);
  const shown = Math.max(0, Math.min(toks.length, Math.floor((f - start) / 5) + 1));
  const plain = useSpring(4, 14);
  return (
    <>
      <Heading kicker={data.kicker ?? "HOW AI READS"}>{data.heading}</Heading>
      <Panel style={{ position: "absolute", top: 470, left: 60, right: 60, padding: "26px 32px", opacity: plain }}>
        <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: L.muted }}>YOU TYPE</div>
        <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 46, color: L.text, marginTop: 8 }}>{data.sentence}</div>
      </Panel>
      <div style={{ position: "absolute", top: 700, left: 60, right: 60 }}>
        <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: L.muted, opacity: f >= start ? 1 : 0 }}>
          THE MODEL SEES · <span style={{ color: L.amber }}>{f >= start ? shown : 0} tokens</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {toks.map((t, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                background: `${C[i % C.length]}33`,
                border: `2.5px solid ${C[i % C.length]}`,
                fontFamily: L.mono,
                fontWeight: 700,
                fontSize: 38,
                color: L.text,
                whiteSpace: "pre",
                opacity: f >= start && i < shown ? 1 : 0,
                transform: `translateY(${f >= start && i < shown ? 0 : 20}px)`,
              }}
            >
              {t.replace(/ /g, "·")}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1000, left: 60, right: 60, display: "flex", gap: 20 }}>
        {data.stats.map(([big, small]: [string, string], i: number) => {
          const s = useSpring(cue(i + 1), 12);
          return (
            <Panel key={big} style={{ flex: 1, padding: "20px 18px", textAlign: "center", opacity: s, transform: `scale(${s})` }}>
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 40, color: C[(i + 3) % C.length] }}>{big}</div>
              <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 26, color: L.muted, marginTop: 4 }}>{small}</div>
            </Panel>
          );
        })}
      </div>
    </>
  );
};
