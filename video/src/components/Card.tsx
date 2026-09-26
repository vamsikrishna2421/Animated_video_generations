import { theme } from "../theme";

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: theme.card,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 28,
      boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
      backdropFilter: "blur(10px)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const DocIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = theme.teal }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 40 50">
    <path d="M4 2h22l10 10v34a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="rgba(255,255,255,0.08)" stroke={color} strokeWidth="2.5" />
    <path d="M26 2v10h10" fill="none" stroke={color} strokeWidth="2.5" />
    <path d="M9 22h20M9 30h20M9 38h12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const Check: React.FC<{ size?: number; progress: number; color?: string }> = ({ size = 44, progress, color = theme.green }) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill={progress > 0 ? color : "transparent"} opacity={Math.min(progress * 2, 1)} stroke={progress > 0 ? color : theme.cardBorder} strokeWidth="2.5" />
    <path d="M12 23l7 7 13-15" fill="none" stroke="#06281d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="36" strokeDashoffset={36 * (1 - progress)} />
  </svg>
);
