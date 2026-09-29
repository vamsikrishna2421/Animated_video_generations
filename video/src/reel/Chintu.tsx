import { useCurrentFrame } from "remotion";

// "Chintu": the curious, dramatic student. Spiky hair, backwards cap, big eyes, hoodie + earphones.
export const Chintu: React.FC<{ size?: number; talking: boolean; mood?: "confused" | "shocked" | "happy" }> = ({ size = 200, talking, mood = "confused" }) => {
  const f = useCurrentFrame();
  const blink = f % 95 > 89 ? 0.12 : 1;
  const mouth = talking ? 0.3 + 0.7 * Math.abs(Math.sin(f / 2.3)) : mood === "shocked" ? 0.8 : 0.1;
  const bob = Math.sin(f / 10) * 3 + (talking ? Math.sin(f / 2.5) * 2 : 0);
  const brow = mood === "confused" ? 6 : mood === "shocked" ? -6 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `translateY(${bob}px)`, overflow: "visible" }}>
      <defs>
        <radialGradient id="kskin" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#E9B88F" />
          <stop offset="100%" stopColor="#B87A4F" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="#0E3B4A" stroke="#22D3EE" strokeWidth="4" />
      <clipPath id="kclip"><circle cx="100" cy="100" r="96" /></clipPath>
      <g clipPath="url(#kclip)">
        {/* hoodie */}
        <path d="M22 210 Q34 146 100 142 Q166 146 178 210 Z" fill="#7C3AED" />
        <path d="M70 146 Q100 170 130 146" fill="none" stroke="#5B21B6" strokeWidth="8" />
        <line x1="88" y1="160" x2="86" y2="195" stroke="#E9D5FF" strokeWidth="3" />
        <line x1="112" y1="160" x2="114" y2="195" stroke="#E9D5FF" strokeWidth="3" />
        {/* neck */}
        <rect x="87" y="124" width="26" height="24" rx="9" fill="#B87A4F" />
        {/* ears + earphones */}
        <ellipse cx="53" cy="92" rx="9" ry="13" fill="#C98B5E" />
        <ellipse cx="147" cy="92" rx="9" ry="13" fill="#C98B5E" />
        <circle cx="53" cy="95" r="5" fill="#fff" />
        <circle cx="147" cy="95" r="5" fill="#fff" />
        <path d="M53 100 Q60 140 88 160" stroke="#fff" strokeWidth="2" fill="none" />
        <path d="M147 100 Q140 140 112 160" stroke="#fff" strokeWidth="2" fill="none" />
        {/* face */}
        <ellipse cx="100" cy="90" rx="46" ry="52" fill="url(#kskin)" />
        {/* spiky hair */}
        <path d="M54 76 L58 44 L70 58 L76 32 L88 52 L98 26 L108 50 L120 30 L126 54 L140 40 L146 76 Q130 56 100 56 Q70 56 54 76 Z" fill="#141018" />
        {/* backwards cap */}
        <path d="M60 58 Q100 22 140 58 Q100 46 60 58 Z" fill="#F43F5E" />
        <rect x="92" y="30" width="16" height="8" rx="3" fill="#BE123C" />
        {/* eyebrows */}
        <path d={`M70 ${66 + brow} Q80 ${60} 90 ${66 - brow / 2}`} stroke="#141018" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d={`M110 ${66 - brow / 2} Q120 ${60 - brow} 130 ${66}`} stroke="#141018" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* big eyes */}
        <g transform={`translate(0 ${82 * (1 - blink)}) scale(1 ${blink})`}>
          <ellipse cx="80" cy="82" rx="11" ry="12" fill="#fff" />
          <ellipse cx="120" cy="82" rx="11" ry="12" fill="#fff" />
          <circle cx={81 + Math.sin(f / 20) * 2} cy="83" r="6" fill="#1E120C" />
          <circle cx={121 + Math.sin(f / 20) * 2} cy="83" r="6" fill="#1E120C" />
          <circle cx="83" cy="80" r="2" fill="#fff" />
          <circle cx="123" cy="80" r="2" fill="#fff" />
        </g>
        {/* nose */}
        <path d="M100 90 Q104 100 97 102" stroke="#9A6440" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* mouth */}
        {mood === "happy" && !talking ? (
          <path d="M84 114 Q100 130 116 114" stroke="#6B2A1E" strokeWidth="5" fill="#fff" strokeLinecap="round" />
        ) : (
          <ellipse cx="100" cy="118" rx={10 + mouth * 3} ry={2.5 + mouth * 10} fill="#6B2A1E" />
        )}
        {/* cheeks */}
        <circle cx="68" cy="104" r="7" fill="#F08A7A" opacity="0.3" />
        <circle cx="132" cy="104" r="7" fill="#F08A7A" opacity="0.3" />
      </g>
    </svg>
  );
};
