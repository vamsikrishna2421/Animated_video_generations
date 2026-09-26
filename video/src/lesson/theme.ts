export const L = {
  W: 1080,
  H: 1920,
  bg: "#0A0F24",
  bg2: "#151C44",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  teal: "#22D3EE",
  amber: "#F59E0B",
  green: "#34D399",
  rose: "#F43F5E",
  text: "#F8FAFC",
  muted: "#94A3B8",
  card: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.14)",
  font: "Inter, 'DejaVu Sans', sans-serif",
  mono: "'DejaVu Sans Mono', monospace",
  // Instagram Reels safe area: keep content inside this box.
  stageTop: 270,
  stageBottom: 1230,
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;

export const gradText = (a: string, b: string) =>
  ({
    background: `linear-gradient(90deg, ${a}, ${b})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  }) as const;

export type SceneData = {
  type: string;
  data: any;
  from: number;
  durationInFrames: number;
  voiceFrom: number;
  audio: string;
  cues: (number | null)[];
  captions: { text: string; from: number; to: number }[];
  image: string | null;
};

export type SceneProps = {
  data: any;
  cue: (i: number) => number; // frame of cue i (0-based); falls back to a spread if missing
  duration: number;
  image: string | null;
};
