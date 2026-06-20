import { useState, useRef } from "react";
import {
  Save, Share2, FileDown, Pencil, MessageCircle, CheckCircle,
  BookOpen, Sparkles, ImageIcon, RefreshCw, Sun, Contrast, Moon,
  Eye, Upload, HelpCircle,
} from "lucide-react";
const toast = Object.assign((...args: any[]) => console.log(args), { success: (...args: any[]) => console.log(args), error: (...args: any[]) => console.log(args) });
import { HanaSheet } from "../../components/characters/HanaSheet";
import { TonySheet } from "../../components/characters/TonySheet";
import { RiaSheet } from "../../components/characters/RiaSheet";

/* ═══════════════════════════════════════════════
   CHARACTER SVGs  (palette-faithful to each file)
═══════════════════════════════════════════════ */
function HanaChar({ w }: { w: number }) {
  const h = Math.round(w * 178 / 120);
  return (
    <svg viewBox="0 0 120 178" width={w} height={h} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <path d="M28 63Q26 38 36 22Q46 9 60 9Q74 9 84 22Q94 38 92 63Q86 44 78 39Q68 32 60 33Q52 32 42 39Q34 44 28 63Z" fill="#3D2010" stroke="#1A0808" strokeWidth="1.2"/>
      <path d="M28 63Q23 71 24 80Q28 78 32 72Q28 67 28 63Z" fill="#3D2010"/>
      <path d="M92 63Q97 71 96 80Q92 78 88 72Q92 67 92 63Z" fill="#3D2010"/>
      <path d="M24 80Q26 86 32 84" stroke="#3D2010" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M96 80Q94 86 88 84" stroke="#3D2010" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M34 38Q60 29 86 38" stroke="#3BAAA0" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M34 38Q60 29 86 38" stroke="#6CCFC7" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
      <circle cx="60" cy="63" r="33" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2.5"/>
      <ellipse cx="27" cy="63" rx="5.5" ry="7.5" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2"/>
      <ellipse cx="93" cy="63" rx="5.5" ry="7.5" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2"/>
      <path d="M32 50Q42 47 52 50" stroke="#3D2010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M68 50Q78 47 88 50" stroke="#3D2010" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="42" cy="61" r="12" fill="rgba(240,252,250,0.18)" stroke="#9A7040" strokeWidth="2.5"/>
      <circle cx="78" cy="61" r="12" fill="rgba(240,252,250,0.18)" stroke="#9A7040" strokeWidth="2.5"/>
      <path d="M54 61L66 61" stroke="#9A7040" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M30 60L25 62" stroke="#9A7040" strokeWidth="2" strokeLinecap="round"/>
      <path d="M90 60L95 62" stroke="#9A7040" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="42" cy="61" rx="7.5" ry="7" fill="#1E2440"/>
      <ellipse cx="42" cy="61" rx="5" ry="5" fill="#7A4E2C"/>
      <ellipse cx="39" cy="57" rx="2.2" ry="2" fill="white" opacity="0.85"/>
      <ellipse cx="78" cy="61" rx="7.5" ry="7" fill="#1E2440"/>
      <ellipse cx="78" cy="61" rx="5" ry="5" fill="#7A4E2C"/>
      <ellipse cx="75" cy="57" rx="2.2" ry="2" fill="white" opacity="0.85"/>
      <path d="M51 77Q60 82 69 77" stroke="#1E2440" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="60" cy="73" rx="3" ry="2.2" fill="#E8A882"/>
      <ellipse cx="27" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>
      <ellipse cx="93" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>
      <rect x="50" y="94" width="20" height="11" rx="5" fill="#FFDCB8" stroke="#1E2440" strokeWidth="1.5"/>
      <rect x="32" y="98" width="56" height="50" rx="12" fill="#3BAAA0" stroke="#1E2440" strokeWidth="2.5"/>
      <path d="M46 98L52 106L60 102L68 106L74 98" fill="white" stroke="#1E2440" strokeWidth="1.5"/>
      <path d="M47 98L43 120L58 112" fill="#2D8880" stroke="#1E2440" strokeWidth="1.5" opacity="0.8"/>
      <path d="M73 98L77 120L62 112" fill="#2D8880" stroke="#1E2440" strokeWidth="1.5" opacity="0.8"/>
      <circle cx="52" cy="112" r="6.5" fill="#FFF4DC" stroke="#1E2440" strokeWidth="1.5"/>
      <text x="49.5" y="116" fontSize="8" fill="#FF7F6B">★</text>
      <rect x="15" y="100" width="18" height="38" rx="9" fill="#3BAAA0" stroke="#1E2440" strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2"/>
      <rect x="8" y="110" width="18" height="24" rx="2" fill="#FF7F6B" stroke="#1E2440" strokeWidth="1.5"/>
      <rect x="10" y="112" width="14" height="20" rx="1" fill="#FFF4DC"/>
      <rect x="90" y="80" width="17" height="32" rx="8.5" fill="#3BAAA0" stroke="#1E2440" strokeWidth="2.5" transform="rotate(-32 98 80)"/>
      <circle cx="104" cy="72" r="8" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2"/>
      <ellipse cx="104" cy="62" rx="4.5" ry="7.5" fill="#FFDCB8" stroke="#1E2440" strokeWidth="2"/>
      <circle cx="104" cy="54" r="4.5" fill="#FF7F6B" stroke="#CC4433" strokeWidth="1.5"/>
      <line x1="111" y1="49" x2="115" y2="45" stroke="#FF7F6B" strokeWidth="2" strokeLinecap="round"/>
      <rect x="34" y="146" width="22" height="26" rx="7" fill="#6A5440" stroke="#1E2440" strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill="#6A5440" stroke="#1E2440" strokeWidth="2.5"/>
      <rect x="32" y="144" width="56" height="6" rx="3" fill="#2D8880" stroke="#1E2440" strokeWidth="1.5"/>
      <ellipse cx="45" cy="174" rx="16" ry="7" fill="#4A3020"/>
      <ellipse cx="75" cy="174" rx="16" ry="7" fill="#4A3020"/>
    </svg>
  );
}

function TonyChar({ w }: { w: number }) {
  const h = Math.round(w * 178 / 120);
  return (
    <svg viewBox="0 0 120 178" width={w} height={h} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <path d="M32 40Q34 20 40 14L45 28Q46 11 52 7L56 22Q58 5 64 3L67 18Q70 4 77 7L74 23Q78 11 85 14L80 36Q68 29 60 33Q50 26 44 31Z" fill="#2D1B0E" stroke="#1A0E05" strokeWidth="1"/>
      <path d="M52 7L56 22Q57 6 62 3L64 16" fill="#FFD426" opacity="0.7"/>
      <path d="M70 4L73 17Q75 5 80 8" fill="#FFD426" opacity="0.5"/>
      <circle cx="60" cy="62" r="34" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="2.5"/>
      <ellipse cx="26" cy="62" rx="6" ry="8" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="2"/>
      <ellipse cx="94" cy="62" rx="6" ry="8" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="2"/>
      <rect x="22" y="51" width="76" height="17" rx="8" fill="#555" stroke="#2D1B0E" strokeWidth="1.5" opacity="0.77"/>
      <circle cx="42" cy="59" r="14" fill="#FFD426" stroke="#2D1B0E" strokeWidth="2.5"/>
      <circle cx="42" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
      <circle cx="37" cy="54" r="3.2" fill="white" opacity="0.82"/>
      <circle cx="78" cy="59" r="14" fill="#FFD426" stroke="#2D1B0E" strokeWidth="2.5"/>
      <circle cx="78" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
      <circle cx="73" cy="54" r="3.2" fill="white" opacity="0.82"/>
      <path d="M56 59L64 59" stroke="#FFD426" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M35 57Q42 65 49 57" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M71 57Q78 65 85 57" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="60" cy="72" rx="3.2" ry="2.5" fill="#E8A882"/>
      <path d="M44 75Q60 92 76 75" stroke="#2D1B0E" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="29" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>
      <ellipse cx="91" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>
      <rect x="50" y="94" width="20" height="11" rx="5" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="1.5"/>
      <rect x="32" y="98" width="56" height="50" rx="12" fill="#FF8C42" stroke="#2D1B0E" strokeWidth="2.5"/>
      <path d="M47 98L60 112L73 98" fill="#FF8C42" stroke="#2D1B0E" strokeWidth="1.5"/>
      <rect x="62" y="104" width="15" height="13" rx="3" fill="#FFD426" stroke="#2D1B0E" strokeWidth="1.5"/>
      <ellipse cx="69" cy="108" rx="4.5" ry="5" fill="#FF8C42"/>
      <rect x="8" y="72" width="19" height="38" rx="9.5" fill="#FF8C42" stroke="#2D1B0E" strokeWidth="2.5" transform="rotate(-40 8 72)"/>
      <circle cx="5" cy="108" r="9" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="2"/>
      <rect x="93" y="72" width="19" height="38" rx="9.5" fill="#FF8C42" stroke="#2D1B0E" strokeWidth="2.5" transform="rotate(40 112 72)"/>
      <circle cx="115" cy="108" r="9" fill="#FFDCB8" stroke="#2D1B0E" strokeWidth="2"/>
      <text x="8" y="68" fontSize="14" fill="#FFD426">✦</text>
      <text x="102" y="68" fontSize="14" fill="#FFD426">✦</text>
      <rect x="34" y="144" width="22" height="25" rx="7" fill="#3A3A5C" stroke="#2D1B0E" strokeWidth="2.5"/>
      <rect x="64" y="144" width="22" height="25" rx="7" fill="#3A3A5C" stroke="#2D1B0E" strokeWidth="2.5"/>
      <ellipse cx="45" cy="172" rx="17" ry="7.5" fill="#2D1B0E"/>
      <ellipse cx="75" cy="172" rx="17" ry="7.5" fill="#2D1B0E"/>
    </svg>
  );
}

function RiaChar({ w }: { w: number }) {
  const h = Math.round(w * 178 / 120);
  return (
    <svg viewBox="0 0 120 178" width={w} height={h} xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
      <path d="M26 58Q22 30 36 18Q50 8 60 10Q70 8 84 18Q98 30 94 58Q88 40 80 36Q70 28 60 30Q50 28 40 36Q32 40 26 58Z" fill="#3D2A6E" stroke="#1A0830" strokeWidth="1.5"/>
      <path d="M26 58Q20 72 22 85Q26 72 32 62" fill="#3D2A6E"/>
      <path d="M94 58Q100 72 98 85Q94 72 88 62" fill="#3D2A6E"/>
      <path d="M36 18Q48 14 60 16Q72 14 84 18Q70 12 60 14Q50 12 36 18" fill="#5A3A9E" opacity="0.5"/>
      <text x="76" y="32" fontSize="14" fill="#FFD700" stroke="#C0A000" strokeWidth="0.5">★</text>
      <circle cx="60" cy="62" r="32" fill="#FFDCB8" stroke="#1A1040" strokeWidth="2.5"/>
      <ellipse cx="28" cy="62" rx="5.5" ry="7.5" fill="#FFDCB8" stroke="#1A1040" strokeWidth="2"/>
      <ellipse cx="92" cy="62" rx="5.5" ry="7.5" fill="#FFDCB8" stroke="#1A1040" strokeWidth="2"/>
      <ellipse cx="42" cy="55" rx="12" ry="13" fill="white"/>
      <ellipse cx="78" cy="55" rx="12" ry="13" fill="white"/>
      <ellipse cx="42" cy="55" rx="10" ry="11" fill="#1A1040"/>
      <ellipse cx="42" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="40" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      <text x="37" y="60" fontSize="7" fill="white" opacity="0.8">✦</text>
      <ellipse cx="78" cy="55" rx="10" ry="11" fill="#1A1040"/>
      <ellipse cx="78" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="76" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      <text x="73" y="60" fontSize="7" fill="white" opacity="0.8">✦</text>
      <ellipse cx="42" cy="55" rx="12" ry="13" fill="none" stroke="#1A1040" strokeWidth="2"/>
      <ellipse cx="78" cy="55" rx="12" ry="13" fill="none" stroke="#1A1040" strokeWidth="2"/>
      <line x1="32" y1="47" x2="35" y2="44" stroke="#1A1040" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="44" x2="38" y2="41" stroke="#1A1040" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="68" y1="44" x2="70" y2="41" stroke="#1A1040" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="72" y1="44" x2="74" y2="41" stroke="#1A1040" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="60" cy="71" rx="3" ry="2.2" fill="#E8A882"/>
      <path d="M46 74Q60 86 74 74" stroke="#1A1040" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="28" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>
      <ellipse cx="92" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>
      <rect x="50" y="92" width="20" height="10" rx="5" fill="#FFDCB8" stroke="#1A1040" strokeWidth="1.5"/>
      <rect x="32" y="96" width="56" height="50" rx="12" fill="#7B9FF5" stroke="#1A1040" strokeWidth="2.5"/>
      <path d="M47 96Q60 106 73 96" fill="none" stroke="#1A1040" strokeWidth="1.5"/>
      <path d="M52 97Q56 92 60 95Q64 92 68 97Q64 100 60 98Q56 100 52 97Z" fill="#9B7FD4" stroke="#1A1040" strokeWidth="1.5"/>
      <circle cx="60" cy="97" r="3" fill="#FFD700" stroke="#1A1040" strokeWidth="1"/>
      <text x="65" y="116" fontSize="16" fill="#FFD700">★</text>
      <rect x="8" y="70" width="18" height="36" rx="9" fill="#7B9FF5" stroke="#1A1040" strokeWidth="2.5" transform="rotate(-45 8 70)"/>
      <circle cx="3" cy="104" r="9" fill="#FFDCB8" stroke="#1A1040" strokeWidth="2"/>
      <rect x="94" y="70" width="18" height="36" rx="9" fill="#7B9FF5" stroke="#1A1040" strokeWidth="2.5" transform="rotate(45 112 70)"/>
      <circle cx="117" cy="104" r="9" fill="#FFDCB8" stroke="#1A1040" strokeWidth="2"/>
      <text x="4" y="66" fontSize="16" fill="#FFD700">✦</text>
      <text x="98" y="66" fontSize="16" fill="#FFD700">✦</text>
      <rect x="30" y="144" width="60" height="12" rx="6" fill="#9B7FD4" stroke="#1A1040" strokeWidth="2"/>
      <path d="M30 150Q30 172 40 175L55 175Q58 172 58 160Q58 172 62 175L77 175Q85 172 85 160Q85 172 88 175L93 175Q98 172 90 150" fill="#9B7FD4" stroke="#1A1040" strokeWidth="2"/>
      <ellipse cx="46" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
      <ellipse cx="74" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   SUBJECT BACKGROUNDS
═══════════════════════════════════════════════ */
function MathBg() {
  const flagColors = ["#FF5C5C","#4F6AF0","#FFD426","#10B981","#FF8C42","#9B7FD4","#FF5C5C","#4F6AF0","#FFD426"];
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE566"/>
          <stop offset="38%"  stopColor="#FFD426"/>
          <stop offset="70%"  stopColor="#FFBF3D"/>
          <stop offset="100%" stopColor="#FF9A3D"/>
        </linearGradient>
        <filter id="fs"><feDropShadow dx="3" dy="4" stdDeviation="5" floodColor="rgba(0,0,0,0.2)"/></filter>
      </defs>
      <rect width="620" height="877" fill="url(#mBg)"/>
      <circle cx="540" cy="130" r="140" fill="rgba(255,255,255,0.09)"/>
      <circle cx="80"  cy="260" r="100" fill="rgba(255,255,255,0.08)"/>
      <circle cx="320" cy="60"  r="80"  fill="rgba(255,220,50,0.25)"/>
      <circle cx="580" cy="500" r="90"  fill="rgba(255,255,255,0.07)"/>
      {/* Pennant banner */}
      <line x1="0" y1="32" x2="620" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="3"/>
      {flagColors.map((c,i)=>{const x=i*73-6;return(<g key={i}><polygon points={`${x},2 ${x+62},2 ${x+31},50`} fill={c} opacity="0.92"/><polygon points={`${x},2 ${x+62},2 ${x+31},50`} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5"/></g>);})}
      {/* Balloons */}
      {[{cx:80,cy:170,r:42,c:"#FF5C5C"},{cx:550,cy:140,r:36,c:"#4F6AF0"},{cx:30,cy:400,r:30,c:"#10B981"},{cx:590,cy:380,r:34,c:"#9B7FD4"},{cx:310,cy:105,r:28,c:"#FF8C42"}].map(({cx,cy,r,c},i)=>(
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r*1.15} fill={c} filter="url(#fs)" opacity="0.88"/>
          <ellipse cx={cx-r*0.28} cy={cy-r*0.3} rx={r*0.25} ry={r*0.35} fill="white" opacity="0.32"/>
          <line x1={cx} y1={cy+r*1.15} x2={cx+8} y2={cy+r*1.15+30} stroke={c} strokeWidth="2" strokeLinecap="round"/>
        </g>
      ))}
      {/* Number / operator circles */}
      <circle cx="160" cy="210" r="44" fill="#4F6AF0" filter="url(#fs)"/>
      <text x="160" y="228" textAnchor="middle" fill="white" fontWeight="900" fontSize="46">5</text>
      <circle cx="490" cy="270" r="38" fill="#FF5C5C" filter="url(#fs)"/>
      <text x="490" y="286" textAnchor="middle" fill="white" fontWeight="900" fontSize="40">+</text>
      <circle cx="80"  cy="490" r="32" fill="#3BAAA0" filter="url(#fs)"/>
      <text x="80"  y="505" textAnchor="middle" fill="white" fontWeight="900" fontSize="34">÷</text>
      <circle cx="560" cy="490" r="30" fill="#9B7FD4" filter="url(#fs)"/>
      <text x="560" y="505" textAnchor="middle" fill="white" fontWeight="900" fontSize="32">×</text>
      <circle cx="340" cy="440" r="28" fill="#FF8C42" filter="url(#fs)"/>
      <text x="340" y="454" textAnchor="middle" fill="white" fontWeight="900" fontSize="30">9</text>
      {/* Math cards */}
      <rect x="390" y="175" width="150" height="60" rx="18" fill="rgba(255,255,255,0.82)" filter="url(#fs)"/>
      <text x="465" y="214" textAnchor="middle" fill="#4F6AF0" fontFamily="monospace" fontWeight="900" fontSize="28">3 + 4 = 7</text>
      <rect x="30"  y="320" width="180" height="52" rx="16" fill="rgba(255,255,255,0.78)" filter="url(#fs)"/>
      <text x="120" y="353" textAnchor="middle" fill="#FF5C5C" fontFamily="monospace" fontWeight="800" fontSize="22">(3+4) × 2 = 14</text>
      {/* Chalkboard */}
      <rect x="430" y="400" width="148" height="95" rx="6" fill="#1E3A2A" filter="url(#fs)" opacity="0.88"/>
      <rect x="436" y="406" width="136" height="83" rx="4" fill="#2E5A42"/>
      <text x="504" y="432" textAnchor="middle" fill="white" fontFamily="monospace" fontSize="14" opacity="0.9">3 + 4 = 7</text>
      <text x="504" y="452" textAnchor="middle" fill="#7FF0D0" fontFamily="monospace" fontSize="13" opacity="0.88">2×(3+1) = ?</text>
      <text x="504" y="472" textAnchor="middle" fill="#FFD426" fontFamily="monospace" fontSize="13">12 ÷ 3 + 5 = ?</text>
      <rect x="430" y="493" width="148" height="7" rx="3" fill="#5A3A20" opacity="0.7"/>
      <rect x="440" y="494" width="20" height="5" rx="2" fill="white" opacity="0.85"/>
      {/* Pencil */}
      <g transform="rotate(-22 72 540)">
        <rect x="60" y="510" width="22" height="88" rx="4" fill="#FFD426"/>
        <rect x="60" y="510" width="22" height="14" rx="4" fill="#FF8C42"/>
        <polygon points="60,596 82,596 71,618" fill="#FFDCB8"/>
        <rect x="60" y="592" width="22" height="8" rx="0" fill="#FFB0B0"/>
      </g>
      {/* Stars */}
      {[[230,58,28],[390,48,22],[170,128,18],[570,155,20],[280,235,16],[32,272,14],[598,348,16],[96,375,12],[310,420,13],[490,402,17]].map(([x,y,fs],i)=>(
        <text key={i} x={x} y={y} fontSize={fs} fill="white" opacity="0.75">★</text>
      ))}
      {/* Confetti */}
      {[["#FF5C5C",268,162,6],["#4F6AF0",356,282,8],["#10B981",188,344,5],["#9B7FD4",555,318,6],["#FF8C42",318,476,7],["#3BAAA0",148,498,5]].map(([c,x,y,r],i)=>(
        <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} opacity="0.55"/>
      ))}
      <ellipse cx="310" cy="877" rx="380" ry="130" fill="rgba(255,200,80,0.25)"/>
    </svg>
  );
}

function ScienceBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="scBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A0A4C"/><stop offset="55%" stopColor="#2A1870"/><stop offset="100%" stopColor="#1A3A5C"/></linearGradient></defs>
      <rect width="620" height="877" fill="url(#scBg)"/>
      {[...Array(45)].map((_,i)=><circle key={i} cx={(i*53+13)%610} cy={(i*83+7)%760} r={Math.sin(i)*1.5+1} fill="white" opacity={0.3+Math.sin(i*2)*0.4}/>)}
      <circle cx="200" cy="200" r="60" fill="none" stroke="#7B9FF5" strokeWidth="2.5" opacity="0.6"/>
      <ellipse cx="200" cy="200" rx="60" ry="28" fill="none" stroke="#7B9FF5" strokeWidth="2" opacity="0.5" transform="rotate(60 200 200)"/>
      <circle cx="200" cy="200" r="12" fill="#FFD426"/>
      <circle cx="440" cy="320" r="45" fill="none" stroke="#3BAAA0" strokeWidth="2" opacity="0.5"/>
      <ellipse cx="440" cy="320" rx="45" ry="20" fill="none" stroke="#3BAAA0" strokeWidth="2" opacity="0.45" transform="rotate(45 440 320)"/>
      <circle cx="440" cy="320" r="10" fill="#10B981"/>
      <circle cx="500" cy="120" r="50" fill="#9B7FD4" opacity="0.8"/>
      <ellipse cx="500" cy="120" rx="80" ry="16" fill="none" stroke="#C4A0FF" strokeWidth="4" opacity="0.7"/>
      <ellipse cx="310" cy="840" rx="340" ry="80" fill="rgba(30,60,100,0.4)"/>
    </svg>
  );
}

function KoreanBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="620" height="877" fill="#FFF9E8"/>
      <rect x="30" y="60" width="80" height="110" rx="4" fill="#FF8C42" stroke="#CC5500" strokeWidth="2"/>
      <rect x="35" y="65" width="70" height="100" rx="2" fill="#FFA050"/>
      <rect x="120" y="70" width="70" height="100" rx="4" fill="#4F6AF0" stroke="#2233AA" strokeWidth="2"/>
      <rect x="200" y="75" width="65" height="95" rx="4" fill="#10B981" stroke="#007755" strokeWidth="2"/>
      <rect x="270" y="110" width="150" height="65" rx="20" fill="white" stroke="#9B7FD4" strokeWidth="2.5" opacity="0.9"/>
      <text x="345" y="150" textAnchor="middle" fill="#9B7FD4" fontWeight="800" fontSize="20">안녕하세요!</text>
      <polygon points="290,175 315,175 300,195" fill="white" stroke="#9B7FD4" strokeWidth="2"/>
      <text x="80" y="270" fontSize="70" fill="#4F6AF0" opacity="0.1" fontWeight="900">가나다</text>
      <ellipse cx="310" cy="840" rx="340" ry="80" fill="rgba(255,240,200,0.4)"/>
    </svg>
  );
}

function EnglishBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="enBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#87CEFF"/><stop offset="60%" stopColor="#C8E8FF"/><stop offset="100%" stopColor="#E8F8FF"/></linearGradient></defs>
      <rect width="620" height="877" fill="url(#enBg)"/>
      <g opacity="0.85"><ellipse cx="100" cy="70" rx="70" ry="40" fill="white"/><ellipse cx="150" cy="58" rx="52" ry="32" fill="white"/><ellipse cx="50" cy="75" rx="46" ry="28" fill="white"/></g>
      <circle cx="480" cy="180" r="90" fill="#3BAAA0" stroke="#2D8880" strokeWidth="3" opacity="0.85"/>
      <ellipse cx="480" cy="180" rx="90" ry="45" fill="none" stroke="#1E6660" strokeWidth="2.5" opacity="0.7"/>
      <line x1="480" y1="90" x2="480" y2="270" stroke="#1E6660" strokeWidth="2.5" opacity="0.7"/>
      {[["A",80,200,"#FF5C5C"],["B",200,150,"#FF8C42"],["C",300,280,"#FFD426"],["D",150,380,"#10B981"],["E",400,140,"#9B7FD4"]].map(([l,x,y,c])=>(
        <text key={l as string} x={x as number} y={y as number} fill={c as string} fontSize="62" fontWeight="900" opacity="0.18">{l}</text>
      ))}
      <ellipse cx="310" cy="840" rx="340" ry="80" fill="rgba(200,235,255,0.3)"/>
    </svg>
  );
}

function SocialBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="620" height="877" fill="#F0F8E8"/>
      {[100,200,300,400,500].map(x=><line key={x} x1={x} y1="0" x2={x} y2="877" stroke="#8BC34A" strokeWidth="1" opacity="0.2"/>)}
      {[100,200,300,400,500,600,700].map(y=><line key={y} x1="0" y1={y} x2="620" y2={y} stroke="#8BC34A" strokeWidth="1" opacity="0.2"/>)}
      <ellipse cx="200" cy="250" rx="130" ry="90" fill="#8BC34A" opacity="0.35" transform="rotate(-10 200 250)"/>
      <ellipse cx="430" cy="300" rx="110" ry="75" fill="#8BC34A" opacity="0.3" transform="rotate(15 430 300)"/>
      <circle cx="520" cy="150" r="55" fill="white" stroke="#8BC34A" strokeWidth="3" opacity="0.9"/>
      <circle cx="520" cy="150" r="40" fill="#F5F5F5"/>
      <line x1="520" y1="115" x2="520" y2="125" stroke="#FF5C5C" strokeWidth="4" strokeLinecap="round"/>
      <line x1="520" y1="165" x2="520" y2="175" stroke="#555" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="520" cy="150" r="6" fill="#333"/>
      <ellipse cx="310" cy="840" rx="340" ry="80" fill="rgba(200,230,200,0.3)"/>
    </svg>
  );
}

/* 과목 → 이미지 파일명 매핑
   실제 이미지는 public/images/covers/{filename} 에 저장하세요.
   이미지가 없으면 SVG 일러스트 배경이 자동으로 표시됩니다. */
const SUBJECT_IMAGE_MAP: Record<string, string> = {
  수학:  "/images/covers/math-background.jpg",
  과학:  "/images/covers/science-background.jpg",
  국어:  "/images/covers/korean-background.jpg",
  사회:  "/images/covers/social-background.jpg",
  영어:  "/images/covers/english-background.jpg",
};

function SubjectBg({ subject, useImage = false }: { subject: string; useImage?: boolean }) {
  const imageUrl = SUBJECT_IMAGE_MAP[subject] || "/images/covers/math-background.jpg";

  if (useImage) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #FFF3A8 0%, #FFE07A 42%, #DDF7FF 100%)",
        }}
      >
        {/* 업로드 이미지는 메인 배경이 아니라 은은한 패턴 배경으로 사용 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${imageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.22,
          }}
        />

        {/* 표지 아래쪽을 조금 더 만화책 표지처럼 밝게 */}
        <div
          style={{
            position: "absolute",
            left: "-10%",
            right: "-10%",
            bottom: "-4%",
            height: "38%",
            background: "radial-gradient(ellipse at center, rgba(135, 220, 255, 0.75) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
      </div>
    );
  }

  switch (subject) {
    case "과학":
      return <ScienceBg />;
    case "국어":
      return <KoreanBg />;
    case "영어":
      return <EnglishBg />;
    case "사회":
      return <SocialBg />;
    default:
      return <MathBg />;
  }
}

/* ═══════════════════════════════════════════════
   COMIC SPEECH BUBBLE
═══════════════════════════════════════════════ */
type TailDir = "down-left"|"down-center"|"down-right";

function ComicBubble({ text, borderColor, tailDir = "down-center", style = {} }: {
  text: string; borderColor: string; tailDir?: TailDir; style?: React.CSSProperties;
}) {
  const tOff = tailDir === "down-left" ? "left-[18px]" : tailDir === "down-right" ? "right-[18px]" : "left-1/2 -translate-x-1/2";
  return (
    <div className="relative" style={style}>
      <div style={{ background:"#FFFEF5", border:`3px solid ${borderColor}`, borderRadius:18, padding:"7px 12px", boxShadow:`3px 4px 0 rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.12)`, maxWidth:158, minWidth:96 }}>
        {/* 말풍선 전용 폰트: SchoolSafeSpringVacation → Gaegu fallback */}
        <p style={{ fontFamily:"var(--font-bubble)", fontSize:13, fontWeight:400, color:"#1E293B", lineHeight:1.35, textAlign:"center", margin:0 }}>{text}</p>
      </div>
      <div className={`absolute -bottom-[13px] ${tOff}`} style={{width:0,height:0,borderLeft:"10px solid transparent",borderRight:"10px solid transparent",borderTop:`14px solid ${borderColor}`}}/>
      <div className={`absolute -bottom-[10px] ${tOff}`} style={{width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"10px solid #FFFEF5"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TITLE HELPER
═══════════════════════════════════════════════ */
const TITLE_LINE_COLORS = ["#4F6AF0","#FF5C5C","#10B981","#9B7FD4","#FF8C42"];

function splitTitle(t: string): string[] {
  const words = t.trim().split(" ");
  if (words.length <= 2) return [t];
  if (words.length <= 4) {
    const m = Math.ceil(words.length / 2);
    return [words.slice(0, m).join(" "), words.slice(m).join(" ")].filter(Boolean);
  }
  const m1 = Math.ceil(words.length * 0.42);
  const m2 = Math.ceil(words.length * 0.75);
  return [words.slice(0, m1).join(" "), words.slice(m1, m2).join(" "), words.slice(m2).join(" ")].filter(Boolean);
}

type BgStatus = "idle"|"generating"|"done"|"error";
type OverlayT = "bright"|"default"|"dark";
type BgSource = "svg"|"image";  /* svg: SVG 일러스트 / image: /images/covers/ 실제 이미지 */

/* 배경 밝기 오버레이 색상 */
const OVERLAY_SVG: Record<OverlayT, string> = {
  bright:  "rgba(255,255,255,0.08)",
  default: "rgba(0,0,0,0.06)",
  dark:    "rgba(0,0,0,0.28)",
};
/* 이미지 배경: 원본 이미지가 밝게 보이도록 오버레이를 최소화 */
const OVERLAY_IMG: Record<OverlayT, string> = {
  bright: "rgba(255,255,255,0.06)",
  default: "rgba(255,255,255,0.02)",
  dark: "rgba(0,0,0,0.08)",
};

/* 하위 호환을 위한 단순 alias */
export const OVERLAY = OVERLAY_SVG;

/* ═══════════════════════════════════════════════
   A4 COVER CARD  — children's comic book style
   Ratio 1240:1754 (A4 portrait)
═══════════════════════════════════════════════ */
function A4CoverCard({
  title, grade, subject, unit, topic, concept, author, illustrator,
  bgStatus, bgOverlay, bgSource = "svg",
  bubbleHana, bubbleTony, bubbleRia,
  showHana, showTony, showRia,
}: {
  title:string; grade:string; subject:string; unit:string; topic:string;
  concept:string; author:string; illustrator:string;
  bgStatus:BgStatus; bgOverlay:OverlayT; bgSource?:BgSource;
  bubbleHana:string; bubbleTony:string; bubbleRia:string;
  showHana:boolean; showTony:boolean; showRia:boolean;
}) {
  const tags = concept ? concept.split(/[,，、\n]/).map(t=>t.trim()).filter(Boolean) : ["계산 순서","괄호","혼합식"];
  const titleLines = splitTitle(title || "학습툰 제목");
  const flagColors = ["#FF5C5C","#4F6AF0","#FFD426","#10B981","#FF8C42","#9B7FD4","#FF5C5C","#4F6AF0","#FFD426"];

  /* 오버레이: 이미지 배경일 때 가독성 강화 */
  const overlayColor = bgSource === "image"
    ? OVERLAY_IMG[bgOverlay]
    : OVERLAY_SVG[bgOverlay];

  return (
    <div style={{
      position:"relative", width:"100%", aspectRatio:"1240/1754",
      overflow:"hidden", borderRadius:16,
      boxShadow:"0 28px 70px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.25)",
      fontFamily:"'Pretendard',sans-serif",
    }}>
      {/* ── 배경 레이어 ──
          bgStatus=done + bgSource=image → /images/covers/{subject} 이미지
          bgStatus=done + bgSource=svg  → SVG 일러스트
          bgStatus≠done                → 기본 그라데이션 */}
      <div style={{position:"absolute",inset:0}}>
        {bgStatus === "done" ? (
          <SubjectBg subject={subject} useImage={bgSource === "image"}/>
        ) : (
          /* 생성 전·실패 시 기본 warm 그라데이션 */
          <div style={{
            width:"100%", height:"100%",
            background:"linear-gradient(160deg,#FFE566 0%,#FFD426 40%,#FFBF3D 70%,#FF9A3D 100%)"
          }}/>
        )}
      </div>

      {/* ── 오버레이 (밝기 조절 + 가독성 확보) ── */}
      <div style={{position:"absolute",inset:0,background:overlayColor}}/>

      {/* ── PENNANT BANNER ── */}
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"7%"}} viewBox="0 0 620 55" preserveAspectRatio="xMidYMin slice">
        <line x1="0" y1="12" x2="620" y2="12" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5"/>
        {flagColors.map((c,i)=>{const x=i*73-6;return(<g key={i}><polygon points={`${x},2 ${x+62},2 ${x+31},50`} fill={c} opacity="0.92"/><polygon points={`${x},2 ${x+62},2 ${x+31},50`} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/></g>);})}
      </svg>

      {/* ── CONTENT ── */}
      <div style={{position:"absolute",inset:"7% 3% 0 3%",display:"flex",flexDirection:"column"}}>

        {/* Info row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2%"}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[grade,subject,unit].filter(Boolean).map((v,i)=>{
              const bgs=["#4F6AF0","#3BAAA0","rgba(255,255,255,0.8)"];
              const tcs=["white","white","#333"];
              return <span key={i} style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(8px,1.5%,12px)",fontWeight:800,background:bgs[i],color:tcs[i],boxShadow:"1px 2px 4px rgba(0,0,0,0.2)",border:i===2?"1px solid rgba(0,0,0,0.12)":"none"}}>{v}</span>;
            })}
          </div>
          {/* VOL badge */}
          <div style={{width:"clamp(36px,8%,56px)",height:"clamp(36px,8%,56px)",borderRadius:"50%",background:"linear-gradient(135deg,#FF5C5C,#FF8C42)",border:"3px solid white",boxShadow:"2px 3px 8px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <div style={{textAlign:"center",lineHeight:1}}>
              <div style={{fontSize:"clamp(5px,1%,8px)",fontWeight:900,color:"white"}}>VOL</div>
              <div style={{fontSize:"clamp(10px,2.2%,18px)",fontWeight:900,color:"white"}}>1</div>
            </div>
          </div>
        </div>

        {/* ── TITLE STICKER (comic-book stamp style) ── */}
        <div style={{
          background:"white",
          borderRadius:20,
          border:"5px solid #1E2440",
          boxShadow:"6px 8px 0 #1E2440, 0 4px 20px rgba(0,0,0,0.2)",
          padding:"clamp(10px,2%,18px) clamp(12px,2.5%,20px)",
          marginBottom:"2%",
        }}>
          {titleLines.map((line,i)=>(
            /* 표지 제목: S-Core Dream (weight 900) → Pretendard fallback */
            <div key={i} style={{
              fontFamily:"var(--font-title)",
              fontSize:"clamp(22px,6.5%,50px)",
              fontWeight:900,
              color:TITLE_LINE_COLORS[i%TITLE_LINE_COLORS.length],
              lineHeight:1.1,
              textShadow:"2px 2px 0 rgba(0,0,0,0.12)",
            }}>
              {line}
            </div>
          ))}
          {/* 글/그림 정보: Pretendard (기본 UI 폰트) */}
          <div style={{marginTop:8,paddingTop:6,borderTop:"2px dashed #E2E8F0",fontSize:"clamp(9px,1.6%,13px)",color:"#64748B",fontWeight:600,fontFamily:"var(--font-ui)"}}>
            글: {author||"툰스쿨"}&nbsp;&nbsp;·&nbsp;&nbsp;그림: {illustrator||"AI"}
          </div>
        </div>

        {/* Topic — Pretendard (기본 UI 폰트) */}
        {topic && <p style={{fontFamily:"var(--font-ui)",fontSize:"clamp(9px,1.6%,13px)",fontWeight:600,color:"rgba(30,36,64,0.82)",textShadow:"1px 1px 4px rgba(255,255,255,0.7)",marginBottom:"1.5%",paddingLeft:2}}>📖 {topic}</p>}

        {/* Concept tags */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:"1%"}}>
          {tags.slice(0,5).map(tag=>(
            <span key={tag} style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(8px,1.4%,12px)",fontWeight:700,background:"rgba(255,255,255,0.85)",border:"2.5px solid rgba(79,106,240,0.5)",color:"#4F6AF0",boxShadow:"1px 2px 6px rgba(0,0,0,0.12)"}}>#{tag}</span>
          ))}
        </div>

        <div style={{flex:1,minHeight:"2%"}}/>

        {/* ── CHARACTER STAGE (bottom 48%) ── */}
        <div style={{position:"relative",height:"48%",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          {/* Ground glow */}
          <div style={{position:"absolute",bottom:0,left:"-5%",right:"-5%",height:"50%",background:"radial-gradient(ellipse at 50% 100%, rgba(255,255,200,0.4) 0%, transparent 68%)",borderRadius:"50% 50% 0 0"}}/>

          {/* TONY */}
          {showTony && (
            <div style={{position:"absolute",bottom:0,left:"0%",display:"flex",flexDirection:"column",alignItems:"center",zIndex:10}}>
              <ComicBubble text={bubbleTony||"그냥 앞에서부터 하면 안 돼요?"} borderColor="#FF8C42" tailDir="down-right" style={{marginBottom:8}}/>
              <div style={{filter:"drop-shadow(4px 8px 10px rgba(0,0,0,0.28))"}}>
                <TonyChar w={100}/>
              </div>
              <div style={{padding:"2px 8px",borderRadius:12,background:"#FF8C42",marginTop:-3,boxShadow:"2px 3px 6px rgba(0,0,0,0.2)"}}>
                <span style={{fontSize:"clamp(7px,1.2%,10px)",fontWeight:900,color:"white"}}>토니</span>
              </div>
            </div>
          )}

          {/* HANA — center, largest */}
          {showHana && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",zIndex:20,marginBottom:0}}>
              <ComicBubble text={bubbleHana||"괄호가 있으면 무엇부터 계산할까요?"} borderColor="#3BAAA0" tailDir="down-center" style={{marginBottom:10}}/>
              <div style={{filter:"drop-shadow(5px 10px 12px rgba(0,0,0,0.30))"}}>
                <HanaChar w={142}/>
              </div>
              <div style={{padding:"3px 12px",borderRadius:14,background:"#3BAAA0",marginTop:-4,boxShadow:"2px 3px 6px rgba(0,0,0,0.22)"}}>
                <span style={{fontSize:"clamp(7px,1.2%,11px)",fontWeight:900,color:"white"}}>하나 선생님</span>
              </div>
            </div>
          )}

          {/* RIA */}
          {showRia && (
            <div style={{position:"absolute",bottom:0,right:"0%",display:"flex",flexDirection:"column",alignItems:"center",zIndex:10}}>
              <ComicBubble text={bubbleRia||"6컷 만화로 계산 순서를 알아봐요!"} borderColor="#9B7FD4" tailDir="down-left" style={{marginBottom:8}}/>
              <div style={{filter:"drop-shadow(4px 8px 10px rgba(0,0,0,0.28))"}}>
                <RiaChar w={100}/>
              </div>
              <div style={{padding:"2px 8px",borderRadius:12,background:"#9B7FD4",marginTop:-3,boxShadow:"2px 3px 6px rgba(0,0,0,0.2)"}}>
                <span style={{fontSize:"clamp(7px,1.2%,10px)",fontWeight:900,color:"white"}}>리아</span>
              </div>
            </div>
          )}
        </div>

        {/* Publisher bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1.5% 0 1%",marginTop:4,borderTop:"1.5px solid rgba(255,255,255,0.4)"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:"clamp(14px,2.5%,18px)",height:"clamp(14px,2.5%,18px)",borderRadius:5,background:"#4F6AF0",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Pencil style={{width:"65%",height:"65%",color:"white"}}/>
            </div>
            <span style={{fontSize:"clamp(8px,1.4%,12px)",fontWeight:900,color:"#4F6AF0"}}>ToonSchool</span>
          </div>
          <span style={{fontSize:"clamp(7px,1.2%,10px)",fontWeight:500,color:"rgba(30,36,64,0.55)"}}>학습툰 · AI 에디터</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB PREVIEW PANELS
═══════════════════════════════════════════════ */
const PANEL_COLORS = ["#4F6AF0","#10B981","#F59E0B","#8B5CF6","#EF4444","#0EA5E9"];
const SCENE_PROMPTS = [
  "수업 도입 — 오늘 배울 내용 소개","개념 설명 — 핵심 개념을 쉽게 풀어 설명",
  "예시 1 — 쉬운 예시 문제 풀이","예시 2 — 응용 예시 문제",
  "정리 — 핵심 내용 요약","마무리 — 오늘 배운 것 확인",
];

function ComicPreview({ scenes, generated }: { scenes:string[]; generated:boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-[#4F6AF0] rounded-full"/>
        <p className="text-[15px] font-bold text-[#1E293B]">6컷 학습툰</p>
        {generated && <span className="px-2 py-0.5 bg-[#D1FAE5] text-[#10B981] text-[12px] font-bold rounded-full">생성 완료</span>}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({length:6}).map((_,i)=>{
          const c=PANEL_COLORS[i];
          return (
            <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#E2E8F0] hover:border-[#4F6AF0] cursor-pointer transition-all">
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 relative" style={{background:`${c}12`}}>
                <div className="absolute top-2 left-2 w-7 h-7 rounded-xl text-[12px] font-black text-white flex items-center justify-center" style={{background:c}}>{i+1}</div>
                {generated ? (<>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${c}25`}}><MessageCircle className="w-6 h-6" style={{color:c}}/></div>
                  <div className="bg-white/80 rounded-xl px-2 py-1 w-full text-center"><p className="text-[11px] text-[#64748B] truncate">{scenes[i]||SCENE_PROMPTS[i]}</p></div>
                </>) : (<>
                  <div className="w-12 h-12 rounded-2xl border-2 border-dashed flex items-center justify-center" style={{borderColor:`${c}50`}}><ImageIcon className="w-5 h-5" style={{color:`${c}60`}}/></div>
                  <p className="text-[11px] text-[#CBD5E1]">{i+1}컷 비어 있음</p>
                </>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] rounded-2xl p-5 border border-[#FCD34D]">
        <p className="text-[14px] font-bold text-[#92400E] mb-3">📌 오늘의 핵심 요점</p>
        <ul className="space-y-2">
          {["덧셈과 뺄셈의 혼합 계산 순서를 익혔어요","앞에서부터 차례로 계산해요","괄호가 있으면 괄호 안을 먼저 계산해요"].map((pt,i)=>(
            <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#92400E]">
              <span className="w-5 h-5 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>{pt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DialogPreview({ generated }: { generated: boolean }) {
  const [dlg, setDlg] = useState<string[]>(Array(6).fill(""));
  if (!generated) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#EDE9FE] flex items-center justify-center"><MessageCircle className="w-10 h-10 text-[#8B5CF6]"/></div>
      <p className="text-[16px] font-bold text-[#64748B]">먼저 만화 탭에서 6컷을 생성해주세요</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({length:6}).map((_,i)=>{
        const c=PANEL_COLORS[i];
        return (
          <div key={i} className="rounded-2xl overflow-hidden border-2" style={{borderColor:`${c}40`}}>
            <div className="h-24 flex items-center justify-center relative" style={{background:`${c}12`}}>
              <div className="absolute top-2 left-2 w-6 h-6 rounded-lg text-[11px] font-black text-white flex items-center justify-center" style={{background:c}}>{i+1}</div>
              <MessageCircle className="w-10 h-10" style={{color:`${c}60`}}/>
            </div>
            <div className="p-3 bg-white">
              <textarea value={dlg[i]} onChange={e=>{const n=[...dlg];n[i]=e.target.value;setDlg(n);}}
                className="w-full border border-[#E2E8F0] rounded-xl p-2.5 text-[12px] resize-none focus:outline-none focus:border-[#4F6AF0]"
                rows={2} placeholder={`${i+1}컷 대사 입력…`} style={{fontFamily:"var(--font-bubble)"}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuizPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-5 bg-[#10B981] rounded-full"/>
        <p className="text-[15px] font-bold text-[#1E293B]">퀴즈 미리보기</p>
        <span className="ml-auto text-[12px] text-[#94A3B8]">3문제</span>
      </div>
      {[
        {q:"Q1. 3 + 4 - 2를 계산하면?",opts:["① 3","② 5","③ 7","④ 9"],ans:1},
        {q:"Q2. (3 + 4) × 2를 계산하면?",opts:["① 10","② 14","③ 11","④ 12"],ans:1},
        {q:"Q3. 12 ÷ 3 + 5를 계산하면?",opts:["① 7","② 9","③ 8","④ 6"],ans:1},
      ].map((quiz,qi)=>(
        <div key={qi} className="bg-white rounded-2xl border border-[#D1FAE5] p-5 shadow-sm">
          <p className="text-[14px] font-bold text-[#1E293B] mb-3">{quiz.q}</p>
          <div className="grid grid-cols-2 gap-2">
            {quiz.opts.map((opt,oi)=>(
              <div key={oi} className={`py-3 px-4 rounded-xl text-[13px] font-semibold border-2 ${oi===quiz.ans?"bg-[#D1FAE5] text-[#10B981] border-[#6EE7B7]":"bg-white text-[#64748B] border-[#E2E8F0]"}`}>
                {opt}{oi===quiz.ans&&" ✓"}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LEFT PANEL INPUT COMPONENTS
═══════════════════════════════════════════════ */
const IC = "w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] text-[#1E293B] focus:outline-none focus:border-[#4F6AF0] focus:ring-2 focus:ring-[#4F6AF0]/10 transition-all placeholder:text-[#CBD5E1]";

function Grp({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function F({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-semibold text-[#475569]">{label}</label>
      {children}
    </div>
  );
}

function CoverInputPanel({
  title,setTitle,author,setAuthor,illustrator,setIllustrator,
  grade,setGrade,subject,setSubject,unit,setUnit,topic,setTopic,concept,setConcept,
  bgStatus,setBgStatus,bgOverlay,setBgOverlay,bgSource,setBgSource,
  bubbleHana,setBubbleHana,bubbleTony,setBubbleTony,bubbleRia,setBubbleRia,
  showHana,setShowHana,showTony,setShowTony,showRia,setShowRia,
  showCharRef,setShowCharRef,
}: {
  title:string;setTitle:(v:string)=>void;author:string;setAuthor:(v:string)=>void;
  illustrator:string;setIllustrator:(v:string)=>void;
  grade:string;setGrade:(v:string)=>void;subject:string;setSubject:(v:string)=>void;
  unit:string;setUnit:(v:string)=>void;topic:string;setTopic:(v:string)=>void;
  concept:string;setConcept:(v:string)=>void;
  bgStatus:BgStatus;setBgStatus:(v:BgStatus)=>void;
  bgOverlay:OverlayT;setBgOverlay:(v:OverlayT)=>void;
  bgSource:BgSource;setBgSource:(v:BgSource)=>void;
  bubbleHana:string;setBubbleHana:(v:string)=>void;
  bubbleTony:string;setBubbleTony:(v:string)=>void;
  bubbleRia:string;setBubbleRia:(v:string)=>void;
  showHana:boolean;setShowHana:(v:boolean)=>void;
  showTony:boolean;setShowTony:(v:boolean)=>void;
  showRia:boolean;setShowRia:(v:boolean)=>void;
  showCharRef:string|null;setShowCharRef:(v:string|null)=>void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleGenBg = () => {
    setBgStatus("generating");
    setBgSource("svg"); // AI 생성 → SVG 일러스트 배경
    setTimeout(()=>setBgStatus("done"), 1600);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgSource("image");
      setBgStatus("done");
      toast.success("이미지 업로드 완료", { description:`${file.name}이(가) 표지 배경으로 설정되었어요.` });
    }
  };
  const statusMsg: Record<BgStatus,{text:string;color:string}> = {
    idle:       {text:"아직 배경 이미지가 없어요.",color:"#94A3B8"},
    generating: {text:"학습 주제에 맞는 배경을 만들고 있어요…",color:"#F59E0B"},
    done:       {text:"AI 배경이 적용되었어요. ✓",color:"#10B981"},
    error:      {text:"배경 생성에 실패했어요. 다시 시도해주세요.",color:"#EF4444"},
  };
  return (
    <div className="space-y-4">
      <Grp label="1. 표지 기본 정보">
        <F label="작품 제목"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 덧셈과 뺄셈의 혼합 계산 배우기" className={IC}/></F>
        <div className="grid grid-cols-2 gap-2">
          <F label="글"><input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="예: 툰스쿨" className={IC}/></F>
          <F label="그림"><input value={illustrator} onChange={e=>setIllustrator(e.target.value)} placeholder="예: AI" className={IC}/></F>
        </div>
      </Grp>

      <Grp label="2. 학습 정보">
        <div className="grid grid-cols-2 gap-2">
          <F label="학년"><select value={grade} onChange={e=>setGrade(e.target.value)} className={IC}>{["1학년","2학년","3학년","4학년","5학년","6학년"].map(g=><option key={g}>{g}</option>)}</select></F>
          <F label="과목"><select value={subject} onChange={e=>setSubject(e.target.value)} className={IC}>{["수학","국어","과학","사회","영어"].map(s=><option key={s}>{s}</option>)}</select></F>
        </div>
        <F label="단원명"><input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="예: 자연수의 혼합 계산" className={IC}/></F>
        <F label="학습 주제"><textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="예: 덧셈, 뺄셈, 괄호가 섞인 식의 계산 순서" className={`${IC} resize-none`} rows={2}/></F>
        <F label="핵심 개념 (쉼표 구분)"><input value={concept} onChange={e=>setConcept(e.target.value)} placeholder="예: 계산 순서, 괄호, 혼합식" className={IC}/></F>
      </Grp>

      <Grp label="3. 표지 배경">
        <p className="text-[11px] text-[#94A3B8]">학년, 과목, 단원, 학습 주제를 바탕으로 표지 배경을 만들어요.</p>
        <p className="text-[12px] font-semibold" style={{color:statusMsg[bgStatus].color}}>
          {bgStatus==="generating"&&<span className="inline-block mr-1 animate-spin">⟳</span>}
          {statusMsg[bgStatus].text}
        </p>
        {bgStatus==="done" && (
          <div className="relative rounded-xl overflow-hidden border border-[#E2E8F0]" style={{height:72}}>
            <div style={{transform:"scale(0.12)",transformOrigin:"top left",width:"833%",height:"833%",pointerEvents:"none"}}><SubjectBg subject={subject}/></div>
            <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{background:"#4F6AF0"}}>AI 배경</span>
          </div>
        )}
        <button onClick={handleGenBg} disabled={bgStatus==="generating"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white active:scale-95 transition-all disabled:opacity-60"
          style={{background:"linear-gradient(135deg,#4F6AF0,#8B5CF6)",boxShadow:"0 3px 12px rgba(79,106,240,0.3)"}}>
          <Sparkles className="w-4 h-4"/>{bgStatus==="generating"?"배경 생성 중…":"AI 배경 만들기"}
        </button>
        {bgStatus==="done"&&(
          <button onClick={handleGenBg} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium text-[#4F6AF0] border border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-all">
            <RefreshCw className="w-3.5 h-3.5"/>배경 다시 만들기
          </button>
        )}
        <button onClick={()=>fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
          <Upload className="w-3.5 h-3.5"/>내 이미지 업로드
        </button>
        <p className="text-[11px] text-[#94A3B8] text-center">
          PNG, JPG 권장 · 저장 경로: <code className="bg-[#F1F5F9] px-1 rounded text-[10px] text-[#64748B]">public/images/covers/</code>
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>

        {/* 배경 종류 배지 */}
        {bgStatus === "done" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
            <div className="flex-1 text-[12px] font-medium text-[#64748B]">현재 배경</div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${bgSource==="image"?"bg-[#D1FAE5] text-[#10B981]":"bg-[#EEF2FF] text-[#4F6AF0]"}`}>
              {bgSource === "image" ? "📷 직접 업로드" : "🎨 AI 일러스트"}
            </span>
          </div>
        )}

        {/* 이미지 경로 안내 */}
        <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
          <p className="text-[11px] font-semibold text-[#92400E] mb-1">📁 이미지 파일 경로</p>
          <code className="text-[10px] text-[#B45309] block leading-relaxed">
            public/images/covers/<br/>
            ├ math-background.jpg<br/>
            ├ science-background.jpg<br/>
            ├ korean-background.jpg<br/>
            ├ social-background.jpg<br/>
            └ english-background.jpg
          </code>
        </div>

        <div>
          <p className="text-[12px] font-semibold text-[#475569] mb-2">배경 밝기 조절</p>
          <div className="grid grid-cols-3 gap-2">
            {([["bright","밝게",Sun],["default","기본",Contrast],["dark","어둡게",Moon]] as const).map(([k,l,Icon])=>(
              <button key={k} onClick={()=>setBgOverlay(k)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-[12px] font-semibold transition-all ${bgOverlay===k?"border-[#4F6AF0] bg-[#EEF2FF] text-[#4F6AF0]":"border-[#E2E8F0] text-[#64748B] hover:border-[#C7D2FE]"}`}>
                <Icon className="w-4 h-4"/>{l}
              </button>
            ))}
          </div>
        </div>
      </Grp>

      <Grp label="4. 말풍선 문구">
        {[
          {label:"🌿 하나 선생님",val:bubbleHana,set:setBubbleHana,ph:"괄호가 있으면 무엇부터 계산할까요?"},
          {label:"🧡 토니",       val:bubbleTony,set:setBubbleTony,ph:"그냥 앞에서부터 하면 안 돼요?"},
          {label:"💜 리아",       val:bubbleRia, set:setBubbleRia, ph:"6컷 만화로 계산 순서를 알아봐요!"},
        ].map(({label,val,set,ph})=>(
          <F key={label} label={label}>
            <textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph} className={`${IC} resize-none text-[12px]`} rows={2} style={{fontFamily:"var(--font-bubble)"}}/>
          </F>
        ))}
      </Grp>

      <Grp label="5. 캐릭터 표시">
        <div className="space-y-2">
          {[
            {key:"하나",show:showHana,set:setShowHana,color:"#3BAAA0",emoji:"👩‍🏫",label:"하나 선생님"},
            {key:"토니",show:showTony,set:setShowTony,color:"#FF8C42",emoji:"🧒", label:"토니"},
            {key:"리아",show:showRia, set:setShowRia, color:"#7B9FF5",emoji:"👧", label:"리아"},
          ].map(c=>(
            <div key={c.key} className="flex items-center gap-2">
              <button onClick={()=>c.set(!c.show)}
                className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                style={{borderColor:c.show?c.color:"#E2E8F0",background:c.show?`${c.color}12`:"#F8FAFC"}}>
                <span className="text-lg">{c.emoji}</span>
                <span className="text-[13px] font-bold text-[#1E293B] flex-1">{c.label}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:c.show?c.color:"#F1F5F9",color:c.show?"white":"#94A3B8"}}>{c.show?"표시":"숨김"}</span>
              </button>
              <button onClick={()=>setShowCharRef(showCharRef===c.key?null:c.key)}
                className={`p-2.5 rounded-xl border-2 transition-all ${showCharRef===c.key?"border-[#4F6AF0] bg-[#EEF2FF]":"border-[#E2E8F0] hover:border-[#C7D2FE]"}`}>
                <Eye className="w-4 h-4 text-[#64748B]"/>
              </button>
            </div>
          ))}
        </div>
        {showCharRef && (
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden bg-white mt-2">
            <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#475569]">{showCharRef} 디자인 시트</p>
              <button onClick={()=>setShowCharRef(null)} className="text-[#94A3B8] text-xs">✕ 닫기</button>
            </div>
            <div className="p-2 overflow-y-auto" style={{maxHeight:180}}>
              <div style={{transform:"scale(0.5)",transformOrigin:"top left",width:"200%",pointerEvents:"none"}}>
                {showCharRef==="하나"&&<HanaSheet/>}
                {showCharRef==="토니"&&<TonySheet/>}
                {showCharRef==="리아"&&<RiaSheet/>}
              </div>
            </div>
          </div>
        )}
      </Grp>
    </div>
  );
}

function ComicInputPanel({scenes,setScenes,generating,generated,onGenerate}:{scenes:string[];setScenes:(v:string[])=>void;generating:boolean;generated:boolean;onGenerate:()=>void}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-gradient-to-r from-[#EEF2FF] to-[#EDE9FE] rounded-2xl border border-[#C7D2FE]">
        <p className="text-[12px] font-semibold text-[#4F6AF0] mb-0.5">AI 자동 생성</p>
        <p className="text-[11px] text-[#6366F1]">각 컷 장면 설명을 입력하면 AI가 만화를 만들어요</p>
      </div>
      {scenes.map((s,i)=>(
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg text-[11px] font-bold text-white flex items-center justify-center" style={{background:PANEL_COLORS[i]}}>{i+1}</div>
            <p className="text-[12px] font-semibold text-[#475569]">{i+1}컷 장면</p>
          </div>
          <textarea value={s} onChange={e=>{const n=[...scenes];n[i]=e.target.value;setScenes(n);}} placeholder={SCENE_PROMPTS[i]} className={`${IC} resize-none text-[12px]`} rows={2}/>
        </div>
      ))}
      <button onClick={onGenerate} disabled={generating} className="w-full py-4 bg-gradient-to-r from-[#4F6AF0] to-[#8B5CF6] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md">
        <Sparkles className="w-5 h-5"/>{generating?"AI가 생성 중…":"AI로 6컷 만화 생성"}
      </button>
      {generated&&<div className="flex items-center gap-2 p-3 bg-[#D1FAE5] rounded-xl border border-[#6EE7B7]"><CheckCircle className="w-4 h-4 text-[#10B981]"/><span className="text-[13px] text-[#10B981] font-bold">만화 생성 완료!</span></div>}
    </div>
  );
}

function DialogInputPanel({generated}:{generated:boolean}) {
  const [dlg,setDlg]=useState<string[]>(Array(6).fill(""));
  if(!generated) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="w-16 h-16 rounded-full bg-[#EDE9FE] flex items-center justify-center"><MessageCircle className="w-8 h-8 text-[#8B5CF6]"/></div>
      <p className="text-[14px] font-bold text-[#64748B]">만화 탭에서 먼저 생성해주세요</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="p-3 bg-[#EDE9FE] rounded-2xl"><p className="text-[12px] font-bold text-[#8B5CF6]">말풍선 대사 편집</p></div>
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg text-[11px] font-bold text-white flex items-center justify-center" style={{background:PANEL_COLORS[i]}}>{i+1}</div>
            <p className="text-[12px] font-semibold text-[#475569]">{i+1}컷 대사</p>
          </div>
          <textarea value={dlg[i]} onChange={e=>{const n=[...dlg];n[i]=e.target.value;setDlg(n);}} placeholder={`${i+1}컷 대사`} className={`${IC} resize-none text-[12px]`} rows={2} style={{fontFamily:"var(--font-bubble)"}}/>
        </div>
      ))}
    </div>
  );
}

function QuizInputPanel() {
  const [qs,setQs]=useState([{q:"",opts:["","","",""],ans:0},{q:"",opts:["","","",""],ans:1},{q:"",opts:["","","",""],ans:0}]);
  const updQ=(i:number,v:string)=>setQs(qs.map((q,j)=>j===i?{...q,q:v}:q));
  const updO=(i:number,oi:number,v:string)=>setQs(qs.map((q,j)=>j===i?{...q,opts:q.opts.map((o,k)=>k===oi?v:o)}:q));
  const setA=(i:number,ai:number)=>setQs(qs.map((q,j)=>j===i?{...q,ans:ai}:q));
  return (
    <div className="space-y-5">
      <div className="p-3 bg-[#D1FAE5] rounded-2xl border border-[#6EE7B7]"><p className="text-[12px] font-bold text-[#10B981]">학습 퀴즈 편집</p></div>
      {qs.map((quiz,qi)=>(
        <div key={qi} className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0]">
          <p className="text-[12px] font-bold text-[#475569] mb-2">문제 {qi+1}</p>
          <input value={quiz.q} onChange={e=>updQ(qi,e.target.value)} placeholder="퀴즈 문제를 입력하세요" className={`${IC} mb-3`}/>
          <div className="space-y-2">
            {["①","②","③","④"].map((l,oi)=>(
              <div key={oi} className="flex items-center gap-2">
                <button onClick={()=>setA(qi,oi)} className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold border-2 transition-all ${quiz.ans===oi?"bg-[#10B981] border-[#10B981] text-white":"bg-white border-[#CBD5E1] text-[#94A3B8] hover:border-[#10B981]"}`}>{quiz.ans===oi?"✓":l}</button>
                <input value={quiz.opts[oi]} onChange={e=>updO(qi,oi,e.target.value)} placeholder={`${l} 보기`} className={`flex-1 ${IC} text-[12px]`}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="w-full py-3 border-2 border-dashed border-[#CBD5E1] rounded-2xl text-[13px] font-medium text-[#94A3B8] hover:border-[#10B981] hover:text-[#10B981] transition-colors">+ 문제 추가</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
type EditorTab = "표지"|"만화"|"대화"|"퀴즈";
const TAB_CFG: {key:EditorTab;icon:React.ElementType;desc:string}[] = [
  {key:"표지",icon:BookOpen,      desc:"작품 정보 & 배경 & 캐릭터"},
  {key:"만화",icon:ImageIcon,     desc:"6컷 장면 구성"},
  {key:"대화",icon:MessageCircle, desc:"컷별 말풍선 대사"},
  {key:"퀴즈",icon:CheckCircle,   desc:"학습 퀴즈 편집"},
];

export function EditorPreview() {
  const [activeTab, setActiveTab] = useState<EditorTab>("표지");
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [showCharRef, setShowCharRef] = useState<string|null>(null);

  const [title,       setTitle]       = useState("덧셈과 뺄셈의 혼합 계산 배우기");
  const [author,      setAuthor]      = useState("툰스쿨");
  const [illustrator, setIllustrator] = useState("AI");
  const [grade,       setGrade]       = useState("5학년");
  const [subject,     setSubject]     = useState("수학");
  const [unit,        setUnit]        = useState("자연수의 혼합 계산");
  const [topic,       setTopic]       = useState("덧셈, 뺄셈, 괄호가 섞인 식의 계산 순서");
  const [concept,     setConcept]     = useState("계산 순서, 괄호, 혼합식");
  const [bgStatus,    setBgStatus]    = useState<BgStatus>("done");
  const [bgOverlay,   setBgOverlay]   = useState<OverlayT>("default");
  const [bgSource,    setBgSource]    = useState<BgSource>("image");
  const [bubbleHana,  setBubbleHana]  = useState("괄호가 있으면 무엇부터 계산할까요?");
  const [bubbleTony,  setBubbleTony]  = useState("그냥 앞에서부터 하면 안 돼요?");
  const [bubbleRia,   setBubbleRia]   = useState("6컷 만화로 계산 순서를 알아봐요!");
  const [showHana,    setShowHana]    = useState(true);
  const [showTony,    setShowTony]    = useState(true);
  const [showRia,     setShowRia]     = useState(true);
  const [scenes,      setScenes]      = useState<string[]>(SCENE_PROMPTS.map(()=>""));

  const handleGenerate = () => { setGenerating(true); setTimeout(()=>{setGenerating(false);setGenerated(true);},1800); };
  const handleSave  = () => toast.success("저장 완료!",{description:"학습툰이 저장되었습니다."});
  const handleShare = () => toast.success("공유 링크 복사됨",{description:"링크를 붙여넣어 공유하세요."});
  const handlePDF   = () => toast("PDF 내보내기",{description:"A4 PDF 파일을 생성 중입니다…"});

  const previewLabel =
    activeTab==="표지"?"A4 표지 미리보기":
    activeTab==="만화"?"6컷 만화 미리보기":
    activeTab==="대화"?"말풍선 대사 미리보기":"퀴즈 미리보기";

  return (
    <div className="flex flex-col" style={{height:"calc(100vh - 116px)",background:"#E8EAF0"}}>
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL */}
        <aside className="w-[320px] bg-white border-r border-[#E2E8F0] flex flex-col flex-shrink-0">
          <div className="grid grid-cols-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {TAB_CFG.map(({key,icon:Icon})=>(
              <button key={key} onClick={()=>setActiveTab(key)}
                className={`flex flex-col items-center justify-center gap-1 py-4 transition-all relative ${activeTab===key?"text-[#4F6AF0] bg-white":"text-[#94A3B8] hover:text-[#64748B] hover:bg-white/60"}`}>
                <Icon className="w-5 h-5" style={{color:activeTab===key?"#4F6AF0":undefined}}/>
                <span className="text-[11px] font-semibold">{key}</span>
                {activeTab===key&&<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#4F6AF0] rounded-full"/>}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-[#FAFBFF] border-b border-[#F1F5F9]">
            <p className="text-[11px] text-[#94A3B8]">{TAB_CFG.find(t=>t.key===activeTab)?.desc}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab==="표지"&&<CoverInputPanel title={title} setTitle={setTitle} author={author} setAuthor={setAuthor} illustrator={illustrator} setIllustrator={setIllustrator} grade={grade} setGrade={setGrade} subject={subject} setSubject={setSubject} unit={unit} setUnit={setUnit} topic={topic} setTopic={setTopic} concept={concept} setConcept={setConcept} bgStatus={bgStatus} setBgStatus={setBgStatus} bgOverlay={bgOverlay} setBgOverlay={setBgOverlay} bgSource={bgSource} setBgSource={setBgSource} bubbleHana={bubbleHana} setBubbleHana={setBubbleHana} bubbleTony={bubbleTony} setBubbleTony={setBubbleTony} bubbleRia={bubbleRia} setBubbleRia={setBubbleRia} showHana={showHana} setShowHana={setShowHana} showTony={showTony} setShowTony={setShowTony} showRia={showRia} setShowRia={setShowRia} showCharRef={showCharRef} setShowCharRef={setShowCharRef}/>}
            {activeTab==="만화"&&<ComicInputPanel scenes={scenes} setScenes={setScenes} generating={generating} generated={generated} onGenerate={handleGenerate}/>}
            {activeTab==="대화"&&<DialogInputPanel generated={generated}/>}
            {activeTab==="퀴즈"&&<QuizInputPanel/>}
          </div>
        </aside>

        {/* RIGHT PREVIEW */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-[#E2E8F0] px-5 py-3 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F6AF0] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                <Pencil className="w-3.5 h-3.5 text-white"/>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1E293B] truncate">{previewLabel}</p>
                <p className="text-[11px] text-[#94A3B8]">{grade} · {subject} · {title||"제목 없음"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handlePDF} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] active:scale-95 transition-all">
                <FileDown className="w-4 h-4 text-[#94A3B8]"/>PDF
              </button>
              <button onClick={handleShare} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-[13px] font-medium text-[#4F6AF0] hover:bg-[#E0E7FF] active:scale-95 transition-all">
                <Share2 className="w-4 h-4"/>공유하기
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4F6AF0] text-white text-[13px] font-semibold hover:bg-[#3451D1] active:scale-95 transition-all shadow-sm shadow-[#4F6AF0]/30">
                <Save className="w-4 h-4"/>저장하기
              </button>
            </div>
          </div>

          {/* Preview area — dark "desk" background makes paper feel real */}
          <div className="flex-1 overflow-y-auto" style={{background:"#3A3D4A",padding:"32px 24px 40px"}}>

            {/* 표지 tab: A4 cover centered, alone */}
            {activeTab==="표지" && (
              <div className="flex flex-col items-center gap-5" style={{maxWidth:480,margin:"0 auto"}}>
                <A4CoverCard
                  title={title} grade={grade} subject={subject} unit={unit}
                  topic={topic} concept={concept} author={author} illustrator={illustrator}
                  bgStatus={bgStatus} bgOverlay={bgOverlay} bgSource={bgSource}
                  bubbleHana={bubbleHana} bubbleTony={bubbleTony} bubbleRia={bubbleRia}
                  showHana={showHana} showTony={showTony} showRia={showRia}
                />
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{background:"rgba(255,255,255,0.1)"}}>
                  <FileDown className="w-4 h-4 flex-shrink-0" style={{color:"rgba(255,255,255,0.55)"}}/>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.55)",fontWeight:500}}>표지는 A4 PDF 첫 장으로 출력됩니다.</p>
                </div>
              </div>
            )}

            {/* Other tabs: light card */}
            {activeTab!=="표지" && (
              <div style={{maxWidth:680,margin:"0 auto",background:"#F0F2F8",borderRadius:20,padding:24}}>
                {activeTab==="만화"&&<ComicPreview scenes={scenes} generated={generated}/>}
                {activeTab==="대화"&&<DialogPreview generated={generated}/>}
                {activeTab==="퀴즈"&&<QuizPreview/>}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="bg-white border-t border-[#E2E8F0] px-5 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bgStatus==="done"?"bg-[#10B981]":"bg-[#F59E0B]"}`}/>
                <span className="text-[12px] text-[#64748B]">{bgStatus==="done"?"배경 완료":"배경 없음"}</span>
              </div>
              <span className="text-[#E2E8F0]">|</span>
              <span className="text-[12px] text-[#94A3B8]">A4 표지 · 6컷 · 퀴즈 3문제</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-[#94A3B8] hover:text-[#4F6AF0]"><HelpCircle className="w-4 h-4"/></button>
              <span className="text-[11px] text-[#CBD5E1]">마지막 저장: 방금 전</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
