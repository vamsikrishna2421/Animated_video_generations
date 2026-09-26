import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, useSpring } from "./common";

const COLS = [4, 6, 6, 3];
const X0 = 150, X1 = 930, Y0 = 520, Y1 = 1000;
const colX = (c: number) => X0 + (c * (X1 - X0)) / (COLS.length - 1);
const nodeY = (c: number, r: number) => Y0 + ((r + 0.5) * (Y1 - Y0)) / COLS[c];

// Tiny visuals for what each layer "sees".
const LayerArt: React.FC<{ i: number }> = ({ i }) => {
  const c = [L.muted, L.teal, L.violet, L.amber][i];
  if (i === 0)
    return (
      <svg width="110" height="110" viewBox="0 0 6 6">
        {Array.from({ length: 36 }).map((_, k) => (
          <rect key={k} x={k % 6} y={Math.floor(k / 6)} width="0.9" height="0.9" fill={c} opacity={[0.2, 0.5, 0.9][(k * 7) % 3]} />
        ))}
      </svg>
    );
  if (i === 1)
    return (
      <svg width="110" height="110" viewBox="0 0 110 110" stroke={c} strokeWidth="7" strokeLinecap="round">
        <path d="M15 20 L50 20" /><path d="M70 15 L95 45" /><path d="M20 60 L20 95" /><path d="M55 90 L95 80" />
      </svg>
    );
  if (i === 2)
    return (
      <svg width="110" height="110" viewBox="0 0 110 110" fill="none" stroke={c} strokeWidth="7">
        <circle cx="35" cy="38" r="22" /><path d="M65 88 L85 48 L105 88 Z" /><rect x="10" y="70" width="36" height="30" rx="4" />
      </svg>
    );
  return (
    <svg width="120" height="110" viewBox="0 0 120 110">
      <path d="M20 40 L30 5 L50 30 L70 30 L90 5 L100 40 Q108 95 60 100 Q12 95 20 40 Z" fill={c} />
      <circle cx="44" cy="55" r="7" fill="#0A0F24" /><circle cx="76" cy="55" r="7" fill="#0A0F24" />
      <path d="M54 70 L66 70 L60 77 Z" fill="#0A0F24" />
      <path d="M60 77 Q52 86 44 82 M60 77 Q68 86 76 82" stroke="#0A0F24" strokeWidth="3" fill="none" />
    </svg>
  );
};

export const Neural: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const net = useSpring(cue(0) - 10, 16);
  const layerOn = (c: number) => (c === 0 ? cue(0) : cue(c));
  return (
    <>
      <Heading kicker="INSPIRED BY THE BRAIN">{data.heading}</Heading>
      <svg width={1080} height={1250} style={{ position: "absolute", left: 0, top: 0, opacity: net }}>
        {COLS.slice(0, -1).map((n, c) =>
          Array.from({ length: n }).flatMap((_, r) =>
            Array.from({ length: COLS[c + 1] }).map((__, r2) => {
              const lit = f > layerOn(c + 1);
              return (
                <line
                  key={`${c}-${r}-${r2}`}
                  x1={colX(c)} y1={nodeY(c, r)} x2={colX(c + 1)} y2={nodeY(c + 1, r2)}
                  stroke={lit ? L.teal : "rgba(255,255,255,0.12)"}
                  strokeWidth={lit ? 2 : 1.5}
                  opacity={lit ? 0.35 + 0.25 * Math.sin((f + r * 7 + r2 * 3) / 6) : 1}
                />
              );
            })
          )
        )}
        {/* signal pulses travelling through lit layers */}
        {COLS.slice(0, -1).map((n, c) =>
          f > layerOn(c + 1)
            ? Array.from({ length: 5 }).map((_, k) => {
                const p = ((f - layerOn(c + 1) + k * 9) % 36) / 36;
                const r = (k * 3 + c) % n;
                const r2 = (k * 5 + c * 2) % COLS[c + 1];
                return (
                  <circle key={`p${c}${k}`} cx={colX(c) + (colX(c + 1) - colX(c)) * p} cy={nodeY(c, r) + (nodeY(c + 1, r2) - nodeY(c, r)) * p} r={7} fill={L.amber} opacity={0.9} />
                );
              })
            : null
        )}
        {COLS.map((n, c) =>
          Array.from({ length: n }).map((_, r) => {
            const on = interpolate(f, [layerOn(c), layerOn(c) + 8], [0, 1], clamp);
            return (
              <circle
                key={`n${c}${r}`}
                cx={colX(c)} cy={nodeY(c, r)} r={24}
                fill={on > 0.5 ? [L.muted, L.teal, L.violet, L.amber][c] : "#1C2550"}
                stroke="rgba(255,255,255,0.4)" strokeWidth={3}
                style={{ filter: on > 0.5 ? `drop-shadow(0 0 12px ${[L.muted, L.teal, L.violet, L.amber][c]})` : "none" }}
              />
            );
          })
        )}
      </svg>
      {data.layers.map((label: string, i: number) => {
        const s = useSpring(layerOn(i), 11);
        return (
          <div key={label} style={{ position: "absolute", top: 1040, left: colX(i) - 90, width: 180, textAlign: "center", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
            <div style={{ height: 115, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
              <LayerArt i={i} />
            </div>
            <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 34, color: [L.muted, L.teal, L.violet, L.amber][i], marginTop: 6 }}>{label}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 455, left: 0, right: 0, textAlign: "center", fontFamily: L.font, fontSize: 30, fontWeight: 700, color: L.muted, opacity: net }}>
        input &nbsp;→&nbsp; layer &nbsp;→&nbsp; layer &nbsp;→&nbsp; output
      </div>
    </>
  );
};
