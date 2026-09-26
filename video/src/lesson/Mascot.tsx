import { useCurrentFrame } from "remotion";

// "Maastaaru": the series host. A friendly teacher with round glasses and a grey moustache.
// Blinks, bobs, and moves his mouth while `talking`.
export const Mascot: React.FC<{ size?: number; talking: boolean; variant?: "male" | "female" }> = ({ size = 200, talking, variant = "male" }) => {
  if (variant === "female") return <MascotFemale size={size} talking={talking} />;
  const f = useCurrentFrame();
  const blink = f % 110 > 103 ? 0.15 : 1;
  const mouth = talking ? 0.35 + 0.65 * Math.abs(Math.sin(f / 2.6)) * (0.6 + 0.4 * Math.sin(f / 7)) : 0.15;
  const bob = Math.sin(f / 14) * 3 + (talking ? Math.sin(f / 3) * 1.5 : 0);
  const tilt = Math.sin(f / 40) * 3;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `translateY(${bob}px) rotate(${tilt}deg)`, overflow: "visible" }}>
      <defs>
        <radialGradient id="mskin" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#F9D2AE" />
          <stop offset="100%" stopColor="#D99A6C" />
        </radialGradient>
        <linearGradient id="mshirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F1FF" />
          <stop offset="100%" stopColor="#B9CCF0" />
        </linearGradient>
      </defs>
      {/* glow disc */}
      <circle cx="100" cy="100" r="98" fill="#1E2A5E" stroke="#F59E0B" strokeWidth="4" />
      <clipPath id="mclip"><circle cx="100" cy="100" r="96" /></clipPath>
      <g clipPath="url(#mclip)">
        {/* shirt */}
        <path d="M30 210 Q40 150 100 145 Q160 150 170 210 Z" fill="url(#mshirt)" />
        <path d="M82 148 L100 172 L118 148" fill="none" stroke="#7A93C9" strokeWidth="4" />
        {[50, 70, 130, 150].map((x) => (
          <circle key={x} cx={x} cy={185} r="3" fill="#7A93C9" opacity="0.6" />
        ))}
        {/* neck */}
        <rect x="86" y="128" width="28" height="24" rx="8" fill="#D99A6C" />
        {/* ears */}
        <ellipse cx="50" cy="92" rx="10" ry="14" fill="#E3A87B" />
        <ellipse cx="150" cy="92" rx="10" ry="14" fill="#E3A87B" />
        {/* head */}
        <ellipse cx="100" cy="88" rx="50" ry="56" fill="url(#mskin)" />
        {/* grey side hair */}
        <path d="M52 70 Q50 50 66 40 Q58 60 60 84 Z" fill="#C9CCD3" />
        <path d="M148 70 Q150 50 134 40 Q142 60 140 84 Z" fill="#C9CCD3" />
        <path d="M70 38 Q100 26 130 38 Q100 33 70 38 Z" fill="#DADDE3" />
        {/* eyebrows */}
        <path d="M68 66 Q80 60 91 65" stroke="#8E8F95" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M109 65 Q120 60 132 66" stroke="#8E8F95" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* eyes */}
        <g transform={`translate(0 ${80 * (1 - blink)}) scale(1 ${blink})`}>
          <ellipse cx="80" cy="80" rx="5" ry="6" fill="#2A1C12" />
          <ellipse cx="120" cy="80" rx="5" ry="6" fill="#2A1C12" />
        </g>
        {/* glasses */}
        <circle cx="80" cy="80" r="16" fill="rgba(255,255,255,0.12)" stroke="#2B2B33" strokeWidth="4" />
        <circle cx="120" cy="80" r="16" fill="rgba(255,255,255,0.12)" stroke="#2B2B33" strokeWidth="4" />
        <path d="M96 80 Q100 76 104 80" stroke="#2B2B33" strokeWidth="4" fill="none" />
        {/* nose */}
        <path d="M100 86 Q106 100 98 104" stroke="#B9774C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* mouth */}
        <ellipse cx="100" cy="120" rx="13" ry={3 + mouth * 9} fill="#6B2A1E" />
        <ellipse cx="100" cy={122 + mouth * 5} rx="8" ry={1 + mouth * 3} fill="#E0736A" />
        {/* moustache */}
        <path d="M76 112 Q88 102 100 110 Q112 102 124 112 Q112 116 100 113 Q88 116 76 112 Z" fill="#A9ABB2" />
        {/* cheeks */}
        <circle cx="68" cy="104" r="7" fill="#F08A7A" opacity="0.35" />
        <circle cx="132" cy="104" r="7" fill="#F08A7A" opacity="0.35" />
      </g>
    </svg>
  );
};

// Female teacher variant: hair in a bun, bindi, round glasses, gold jhumkas, saree with zari border.
const MascotFemale: React.FC<{ size: number; talking: boolean }> = ({ size, talking }) => {
  const f = useCurrentFrame();
  const blink = f % 120 > 113 ? 0.12 : 1;
  const mouth = talking ? 0.3 + 0.7 * Math.abs(Math.sin(f / 2.6)) * (0.6 + 0.4 * Math.sin(f / 7)) : 0.12;
  const bob = Math.sin(f / 14) * 3 + (talking ? Math.sin(f / 3) * 1.5 : 0);
  const tilt = Math.sin(f / 40) * 3;
  const sway = Math.sin(f / 9) * 4;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `translateY(${bob}px) rotate(${tilt}deg)`, overflow: "visible" }}>
      <defs>
        <radialGradient id="fskin" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#F3C29C" />
          <stop offset="100%" stopColor="#C98A5E" />
        </radialGradient>
        <linearGradient id="fsaree" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B0124F" />
          <stop offset="100%" stopColor="#7A0C3A" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="#1E2A5E" stroke="#F59E0B" strokeWidth="4" />
      <clipPath id="fclip"><circle cx="100" cy="100" r="96" /></clipPath>
      <g clipPath="url(#fclip)">
        {/* hair back */}
        <ellipse cx="100" cy="84" rx="58" ry="62" fill="#23150F" />
        {/* blouse + saree drape with zari border */}
        <path d="M28 210 Q40 150 100 146 Q160 150 172 210 Z" fill="#F2B233" />
        <path d="M40 210 Q70 150 150 146 L172 210 Z" fill="url(#fsaree)" />
        <path d="M62 190 Q92 156 150 148" fill="none" stroke="#F5C542" strokeWidth="7" />
        <path d="M62 190 Q92 156 150 148" fill="none" stroke="#FFE08A" strokeWidth="2" strokeDasharray="4 5" />
        {/* neck */}
        <rect x="87" y="126" width="26" height="26" rx="9" fill="#C98A5E" />
        {/* ears + jhumkas */}
        <ellipse cx="51" cy="92" rx="9" ry="13" fill="#D9996C" />
        <ellipse cx="149" cy="92" rx="9" ry="13" fill="#D9996C" />
        <g transform={`rotate(${sway} 51 104)`}>
          <circle cx="51" cy="108" r="4" fill="#F5C542" />
          <path d="M44 112 Q51 124 58 112 Z" fill="#F5C542" />
        </g>
        <g transform={`rotate(${-sway} 149 104)`}>
          <circle cx="149" cy="108" r="4" fill="#F5C542" />
          <path d="M142 112 Q149 124 156 112 Z" fill="#F5C542" />
        </g>
        {/* face */}
        <ellipse cx="100" cy="90" rx="47" ry="53" fill="url(#fskin)" />
        {/* hair front with centre parting */}
        <path d="M53 84 Q52 40 100 36 Q148 40 147 84 Q140 56 104 48 L100 44 L96 48 Q60 56 53 84 Z" fill="#23150F" />
        <path d="M100 38 L100 50" stroke="#B0124F" strokeWidth="2.5" />
        {/* bun */}
        <circle cx="100" cy="30" r="17" fill="#23150F" />
        <path d="M86 26 Q100 18 114 26" stroke="#F5F5F5" strokeWidth="3" fill="none" opacity="0.8" />
        {/* eyebrows */}
        <path d="M70 67 Q80 62 90 66" stroke="#2A1810" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M110 66 Q120 62 130 67" stroke="#2A1810" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* bindi */}
        <circle cx="100" cy="64" r="4" fill="#D61F45" />
        {/* eyes */}
        <g transform={`translate(0 ${82 * (1 - blink)}) scale(1 ${blink})`}>
          <ellipse cx="80" cy="82" rx="5" ry="6" fill="#1E120C" />
          <ellipse cx="120" cy="82" rx="5" ry="6" fill="#1E120C" />
          <path d="M73 77 L70 74 M87 77 L90 74 M113 77 L110 74 M127 77 L130 74" stroke="#1E120C" strokeWidth="2" />
        </g>
        {/* glasses */}
        <circle cx="80" cy="82" r="15" fill="rgba(255,255,255,0.12)" stroke="#7A0C3A" strokeWidth="3.5" />
        <circle cx="120" cy="82" r="15" fill="rgba(255,255,255,0.12)" stroke="#7A0C3A" strokeWidth="3.5" />
        <path d="M95 82 Q100 78 105 82" stroke="#7A0C3A" strokeWidth="3.5" fill="none" />
        {/* nose + nose stud */}
        <path d="M100 88 Q105 100 98 103" stroke="#A96F47" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="94" cy="101" r="2" fill="#F5C542" />
        {/* mouth */}
        <ellipse cx="100" cy="118" rx="11" ry={2.5 + mouth * 8} fill="#7A2233" />
        <path d={`M89 ${117 - mouth * 2} Q100 ${113 - mouth * 3} 111 ${117 - mouth * 2}`} stroke="#B5485A" strokeWidth="3" fill="none" />
        <ellipse cx="100" cy={120 + mouth * 4} rx="6" ry={1 + mouth * 2.5} fill="#E07A7A" />
        {/* cheeks */}
        <circle cx="68" cy="104" r="7" fill="#F08A7A" opacity="0.35" />
        <circle cx="132" cy="104" r="7" fill="#F08A7A" opacity="0.35" />
      </g>
    </svg>
  );
};
