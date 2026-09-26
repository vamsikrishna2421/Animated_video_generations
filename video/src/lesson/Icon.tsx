import * as Lucide from "lucide-react";
import { L } from "./theme";

export const Icon: React.FC<{ name: string; size?: number; color?: string; stroke?: number }> = ({
  name,
  size = 56,
  color = "white",
  stroke = 2.2,
}) => {
  const C = (Lucide as any)[name] ?? Lucide.Sparkles;
  return <C size={size} color={color} strokeWidth={stroke} />;
};

// Icon inside a glowing gradient tile.
export const IconTile: React.FC<{ name: string; size?: number; from?: string; to?: string; glow?: number }> = ({
  name,
  size = 120,
  from = L.violet,
  to = L.teal,
  glow = 1,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 ${40 * glow}px ${from}88, inset 0 2px 0 rgba(255,255,255,0.35)`,
      flexShrink: 0,
    }}
  >
    <Icon name={name} size={size * 0.5} />
  </div>
);
