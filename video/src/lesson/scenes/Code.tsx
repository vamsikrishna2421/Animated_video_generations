import { interpolate, useCurrentFrame } from "remotion";
import { L, SceneProps, clamp } from "../theme";
import { Heading, Panel, useSpring } from "./common";

// Code editor: cue n reveals line group n (typed out), cue groups+1 shows the terminal output.
// data: { heading, kicker?, file, lines: string[], groups: number[] (lines per cue), output?: string[] }
const KW = new Set([
  "import", "from", "def", "return", "for", "in", "if", "else", "elif", "while", "with", "as", "print", "class",
  "True", "False", "None", "and", "or", "not", "const", "let", "await", "async", "function", "new", "export",
]);

const tokens = (line: string) => {
  const out: { t: string; c: string }[] = [];
  const re = /(#.*$|\/\/.*$)|("[^"]*"?|'[^']*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [t, com, str, num, call, word] = m;
    const c = com ? L.muted : str ? L.green : num ? L.amber : call ? L.teal : word && KW.has(word) ? L.violet : L.text;
    out.push({ t, c });
  }
  return out;
};

const Line: React.FC<{ text: string; shown: number }> = ({ text, shown }) => {
  let left = shown;
  return (
    <>
      {tokens(text).map((tk, i) => {
        const part = tk.t.slice(0, Math.max(0, left));
        left -= tk.t.length;
        return part ? <span key={i} style={{ color: tk.c }}>{part}</span> : null;
      })}
    </>
  );
};

export const Code: React.FC<SceneProps> = ({ data, cue }) => {
  const f = useCurrentFrame();
  const lines: string[] = data.lines;
  const groups: number[] = data.groups ?? [lines.length];
  const starts = groups.reduce<number[]>((a, n, i) => [...a, (a[i - 1] ?? 0) + (i ? groups[i - 1] : 0)], []);
  const panel = useSpring(cue(0) - 6, 14);
  const outS = useSpring(cue(groups.length + 1), 12);
  const active = groups.reduce((a, _, i) => (f >= cue(i + 1) ? i : a), -1);
  const size = lines.length > 12 ? 27 : 30;
  return (
    <>
      <Heading kicker={data.kicker ?? "HANDS-ON"}>{data.heading}</Heading>
      <Panel style={{ position: "absolute", top: 430, left: 36, right: 36, padding: 0, overflow: "hidden", opacity: panel, transform: `translateY(${(1 - panel) * 40}px)`, background: "rgba(6,10,28,0.92)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: `1px solid ${L.border}`, background: "rgba(255,255,255,0.05)" }}>
          {[L.rose, L.amber, L.green].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
          <div style={{ marginLeft: 14, fontFamily: L.mono, fontSize: 26, color: L.muted }}>{data.file}</div>
        </div>
        <div style={{ padding: "18px 0 22px" }}>
          {lines.map((ln, i) => {
            const g = starts.findIndex((s, k) => i >= s && i < s + groups[k]);
            const at = cue(g + 1);
            if (f < at) return <div key={i} style={{ height: size * 1.4 }} />;
            const before = lines.slice(starts[g], i).reduce((a, l) => a + l.length, 0);
            const shown = Math.floor(interpolate(f, [at + 4, at + 4 + (before + ln.length) * 0.4], [0, before + ln.length], clamp)) - before;
            const on = g === active;
            return (
              <div key={i} style={{ display: "flex", height: size * 1.4, alignItems: "center", background: on ? "rgba(245,158,11,0.10)" : "transparent", borderLeft: `6px solid ${on ? L.amber : "transparent"}`, opacity: on ? 1 : 0.62 }}>
                <div style={{ width: 58, textAlign: "right", paddingRight: 18, fontFamily: L.mono, fontSize: size - 6, color: L.muted }}>{i + 1}</div>
                <div style={{ fontFamily: L.mono, fontSize: size, whiteSpace: "pre" }}><Line text={ln} shown={shown} /></div>
              </div>
            );
          })}
        </div>
      </Panel>
      {data.output && (
        <Panel style={{ position: "absolute", top: 430 + 100 + lines.length * size * 1.4 + 16, left: 36, right: 36, padding: "16px 24px", background: "rgba(0,0,0,0.75)", borderColor: L.green, opacity: outS, transform: `scale(${0.92 + 0.08 * outS})` }}>
          <div style={{ fontFamily: L.font, fontWeight: 800, fontSize: 22, letterSpacing: 3, color: L.green, marginBottom: 6 }}>OUTPUT</div>
          {data.output.map((o: string, i: number) => (
            <div key={i} style={{ fontFamily: L.mono, fontSize: 28, color: L.text, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{o}</div>
          ))}
        </Panel>
      )}
    </>
  );
};
