export const theme = {
  bg1: "#070B1A",
  bg2: "#141B3D",
  violet: "#8B5CF6",
  teal: "#22D3EE",
  amber: "#F59E0B",
  rose: "#F43F5E",
  green: "#34D399",
  text: "#F8FAFC",
  muted: "#94A3B8",
  card: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.12)",
  font: "Inter, 'DejaVu Sans', sans-serif",
};

export const gradientText = {
  background: `linear-gradient(90deg, ${theme.violet}, ${theme.teal})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
