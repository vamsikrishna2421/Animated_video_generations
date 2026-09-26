import { useCurrentFrame } from "remotion";
import { IconTile } from "../Icon";
import { L, SceneProps } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const PAIRS: [string, string][] = [[L.violet, L.teal], [L.blue, L.green], [L.amber, L.rose], [L.teal, L.violet]];

// 2x2 glossary cards that flip in as each term is spoken.
export const Terms: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const terms: [string, string, string][] = data.terms;
  const active = terms.reduce((a, _, i) => (f >= cue(i) ? i : a), -1);
  return (
    <>
      <Heading kicker="GLOSSARY">{data.heading}</Heading>
      <div style={{ position: "absolute", top: 480, left: 60, right: 60, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {terms.map(([icon, term, def], i) => {
          const s = useSpring(cue(i), 13);
          const on = i === active;
          return (
            <Panel
              key={term}
              style={{
                height: 330,
                padding: "30px 28px",
                transform: `perspective(1000px) rotateY(${(1 - s) * 90}deg) scale(${on ? 1.04 : 1})`,
                opacity: s,
                borderColor: on ? PAIRS[i % 4][0] : L.border,
                boxShadow: on ? `0 0 50px ${PAIRS[i % 4][0]}55` : "none",
              }}
            >
              <IconTile name={icon} size={96} from={PAIRS[i % 4][0]} to={PAIRS[i % 4][1]} glow={on ? 1 : 0.3} />
              <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 44, color: L.text, marginTop: 20 }}>{term}</div>
              <div style={{ fontFamily: L.font, fontWeight: 600, fontSize: 29, color: L.muted, marginTop: 8, lineHeight: 1.3 }}>{def}</div>
            </Panel>
          );
        })}
      </div>
    </>
  );
};
