import { useCurrentFrame } from "remotion";
import { L, SceneProps } from "../theme";
import { Heading, Panel, useSpring } from "./common";

const COL = [L.violet, L.teal, L.amber, L.green];

// Comparison matrix: rows reveal on cue; "✓" / "✗" / text cells.
export const Table: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const cols: string[] = data.cols;
  const rows: string[][] = data.rows;
  const head = useSpring(cue(0) - 4, 14);
  const active = rows.reduce((a, _, i) => (f >= cue(i + 1) ? i : a), -1);
  const noteS = useSpring(cue(rows.length + 1), 12);
  const cell = (v: string) => (v === "✓" ? L.green : v === "✗" ? L.rose : L.text);
  return (
    <>
      <Heading kicker="WHICH ONE WHEN">{data.heading}</Heading>
      <Panel style={{ position: "absolute", top: 470, left: 40, right: 40, padding: "20px 18px" }}>
        <div style={{ display: "flex", opacity: head }}>
          <div style={{ width: 250 }} />
          {cols.map((c, i) => (
            <div key={c} style={{ flex: 1, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 32, color: COL[i % 4], padding: "10px 4px" }}>{c}</div>
          ))}
        </div>
        {rows.map(([label, ...vals], r) => {
          const s = useSpring(cue(r + 1), 13);
          const on = r === active;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", borderTop: `1.5px solid ${L.border}`, background: on ? "rgba(245,158,11,0.1)" : "transparent", borderRadius: 12, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
              <div style={{ width: 250, padding: "22px 12px", fontFamily: L.font, fontWeight: 800, fontSize: 30, color: on ? L.amber : L.text }}>{label}</div>
              {vals.map((v, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: v.length <= 2 ? 48 : 27, color: cell(v), padding: "10px 4px", lineHeight: 1.2 }}>{v}</div>
              ))}
            </div>
          );
        })}
      </Panel>
      {data.note && (
        <div style={{ position: "absolute", top: 1150, left: 60, right: 60, textAlign: "center", fontFamily: L.font, fontWeight: 800, fontSize: 34, color: L.amber, opacity: noteS }}>{data.note}</div>
      )}
    </>
  );
};
