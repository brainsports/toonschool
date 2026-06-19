import React from "react";

type Expression = "happy" | "surprised" | "curious" | "confident" | "touched";
type Costume = "default" | "science" | "social" | "math" | "korean" | "english";

const BLUE = "#7B9FF5";
const PURPLE = "#9B7FD4";
const DARK = "#1A1040";
const SKIN = "#FFDCB8";
const SKIN_DARK = "#FFB899";
const HAIR = "#3D2A6E";

function RiaFace({ expression }: { expression: Expression }) {
  if (expression === "happy") return (
    <>
      {/* Happy sparkly eyes */}
      <ellipse cx="42" cy="55" rx="10" ry="11" fill={DARK}/>
      <ellipse cx="42" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="40" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      <ellipse cx="78" cy="55" rx="10" ry="11" fill={DARK}/>
      <ellipse cx="78" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="76" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      {/* Star sparkle in eyes */}
      <text x="37" y="60" fontSize="7" fill="white" opacity="0.8">✦</text>
      <text x="73" y="60" fontSize="7" fill="white" opacity="0.8">✦</text>
      {/* Happy smile */}
      <path d="M 46 74 Q 60 86 74 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  );
  if (expression === "surprised") return (
    <>
      <ellipse cx="42" cy="55" rx="12" ry="13" fill={DARK}/>
      <ellipse cx="42" cy="54" rx="8" ry="9" fill="#6A9FF5"/>
      <ellipse cx="39" cy="50" rx="3.5" ry="3.5" fill="white" opacity="0.9"/>
      <ellipse cx="78" cy="55" rx="12" ry="13" fill={DARK}/>
      <ellipse cx="78" cy="54" rx="8" ry="9" fill="#6A9FF5"/>
      <ellipse cx="75" cy="50" rx="3.5" ry="3.5" fill="white" opacity="0.9"/>
      {/* O mouth */}
      <ellipse cx="60" cy="77" rx="7" ry="8" fill={DARK}/>
      <ellipse cx="60" cy="76" rx="5" ry="6" fill="#FF9E7A"/>
    </>
  );
  if (expression === "curious") return (
    <>
      <ellipse cx="42" cy="55" rx="10" ry="11" fill={DARK}/>
      <ellipse cx="42" cy="54" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="40" cy="51" rx="3" ry="3" fill="white" opacity="0.9"/>
      {/* Right eye looking up */}
      <ellipse cx="78" cy="53" rx="10" ry="10" fill={DARK}/>
      <ellipse cx="79" cy="51" rx="7" ry="7" fill="#6A9FF5"/>
      <ellipse cx="77" cy="48" rx="3" ry="3" fill="white" opacity="0.9"/>
      {/* Curious eyebrow right */}
      <path d="M 70 44 Q 78 40 86 44" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Small questioning smile */}
      <path d="M 48 76 Q 58 82 70 72" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  );
  if (expression === "confident") return (
    <>
      {/* Half-closed knowing eyes */}
      <ellipse cx="42" cy="57" rx="10" ry="8" fill={DARK}/>
      <ellipse cx="42" cy="56" rx="7" ry="5" fill="#6A9FF5"/>
      <ellipse cx="40" cy="53" rx="2.5" ry="2" fill="white" opacity="0.9"/>
      <path d="M 32 49 Q 42 46 52 49" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="78" cy="57" rx="10" ry="8" fill={DARK}/>
      <ellipse cx="78" cy="56" rx="7" ry="5" fill="#6A9FF5"/>
      <ellipse cx="76" cy="53" rx="2.5" ry="2" fill="white" opacity="0.9"/>
      <path d="M 68 49 Q 78 46 88 49" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Confident smile */}
      <path d="M 50 74 Q 62 82 72 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  );
  // touched
  return (
    <>
      {/* Teary sparkly eyes */}
      <ellipse cx="42" cy="55" rx="10" ry="11" fill={DARK}/>
      <ellipse cx="42" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="40" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      <ellipse cx="78" cy="55" rx="10" ry="11" fill={DARK}/>
      <ellipse cx="78" cy="53" rx="7" ry="7.5" fill="#6A9FF5"/>
      <ellipse cx="76" cy="50" rx="3" ry="3" fill="white" opacity="0.9"/>
      {/* Tear drops */}
      <ellipse cx="36" cy="66" rx="3.5" ry="5" fill="#B3D4FF" opacity="0.8"/>
      <ellipse cx="84" cy="66" rx="3.5" ry="5" fill="#B3D4FF" opacity="0.8"/>
      {/* Wobbly smile */}
      <path d="M 46 74 Q 53 82 60 78 Q 67 82 74 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  );
}

function RiaCostumeBody({ costume }: { costume: Costume }) {
  if (costume === "science") return (
    <>
      {/* Lab coat */}
      <path d="M 46 96 L 40 116 L 60 110" fill="#F0F0F0" stroke="#ddd" strokeWidth="1.5"/>
      <path d="M 74 96 L 80 116 L 60 110" fill="#F0F0F0" stroke="#ddd" strokeWidth="1.5"/>
      {/* Tablet/device in hand */}
      <rect x="86" y="114" width="16" height="22" rx="3" fill="#333" stroke={DARK} strokeWidth="1.5"/>
      <rect x="87" y="116" width="14" height="18" rx="2" fill="#7BE8FF"/>
      <text x="94" y="128" textAnchor="middle" fill={DARK} fontSize="6">📊</text>
    </>
  );
  if (costume === "social") return (
    <>
      {/* Explorer vest */}
      <path d="M 46 96 L 42 112 L 58 106" fill="#8B6914" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 74 96 L 78 112 L 62 106" fill="#8B6914" stroke={DARK} strokeWidth="1.5"/>
      {/* Map/compass in hand */}
      <rect x="86" y="114" width="22" height="16" rx="3" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 88 117 L 106 117 M 88 120 L 106 120 M 88 123 L 100 123" stroke="#8B6914" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="86" cy="122" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="108" cy="122" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      {/* Compass brooch */}
      <circle cx="52" cy="108" r="7" fill="#DDD" stroke={DARK} strokeWidth="1.5"/>
      <line x1="52" y1="102" x2="52" y2="106" stroke="#D32F2F" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="52" y1="110" x2="52" y2="114" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="52" cy="108" r="1.5" fill={DARK}/>
    </>
  );
  if (costume === "math") return (
    <>
      {/* Math formula badge */}
      <circle cx="50" cy="106" r="8" fill={BLUE} stroke={DARK} strokeWidth="1.5"/>
      <text x="50" y="109" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">∑</text>
      {/* Tablet with equations */}
      <rect x="86" y="110" width="18" height="24" rx="3" fill="#F5F5F5" stroke={DARK} strokeWidth="1.5"/>
      <rect x="88" y="112" width="14" height="18" rx="2" fill="#E0EAFF"/>
      <text x="95" y="118" textAnchor="middle" fill={DARK} fontSize="5">y=mx+b</text>
      <text x="95" y="124" textAnchor="middle" fill={DARK} fontSize="5">∫f(x)dx</text>
      {/* Ruler in left hand */}
      <rect x="12" y="114" width="6" height="26" rx="2" fill="#FFD426" stroke={DARK} strokeWidth="1.5" transform="rotate(10 15 127)"/>
      <line x1="13" y1="118" x2="17" y2="118" stroke={DARK} strokeWidth="0.8"/>
      <line x1="13" y1="122" x2="17" y2="122" stroke={DARK} strokeWidth="0.8"/>
      <line x1="13" y1="126" x2="17" y2="126" stroke={DARK} strokeWidth="0.8"/>
      <line x1="13" y1="130" x2="17" y2="130" stroke={DARK} strokeWidth="0.8"/>
      <line x1="13" y1="134" x2="17" y2="134" stroke={DARK} strokeWidth="0.8"/>
    </>
  );
  if (costume === "korean") return (
    <>
      {/* Traditional hanbok-style collar */}
      <path d="M 46 96 L 50 104 L 60 99 L 70 104 L 74 96" fill="#9B5E2A" stroke={DARK} strokeWidth="1.5"/>
      {/* Book in hands */}
      <rect x="12" y="114" width="18" height="24" rx="2" fill="#D4A853" stroke={DARK} strokeWidth="1.5"/>
      <rect x="14" y="116" width="14" height="20" rx="1" fill="#F5DDA0"/>
      <line x1="16" y1="119" x2="26" y2="119" stroke={DARK} strokeWidth="1"/>
      <line x1="16" y1="122" x2="26" y2="122" stroke={DARK} strokeWidth="1"/>
      <line x1="16" y1="125" x2="26" y2="125" stroke={DARK} strokeWidth="1"/>
      <line x1="16" y1="128" x2="22" y2="128" stroke={DARK} strokeWidth="1"/>
      {/* Elegant pen */}
      <rect x="89" y="110" width="5" height="26" rx="2.5" fill={PURPLE} stroke={DARK} strokeWidth="1.5" transform="rotate(-15 91 123)"/>
      <polygon points="86,133 91,140 95,132" fill="#C0A020" transform="rotate(-15 91 134)"/>
      {/* Hair ribbon/decoration */}
      <path d="M 44 30 Q 38 24 44 20 Q 50 16 50 24" fill="#D4A853" stroke={DARK} strokeWidth="1"/>
    </>
  );
  if (costume === "english") return (
    <>
      {/* Travel bag strap */}
      <path d="M 48 96 Q 42 106 44 116 L 52 116" stroke="#3AB0D4" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* World globe in right hand */}
      <circle cx="94" cy="126" r="14" fill={BLUE} stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="94" cy="126" rx="14" ry="9" fill="none" stroke={DARK} strokeWidth="1"/>
      <line x1="94" y1="112" x2="94" y2="140" stroke={DARK} strokeWidth="1"/>
      <ellipse cx="88" cy="122" rx="4" ry="3" fill="#7CBA78" opacity="0.85"/>
      <ellipse cx="99" cy="131" rx="3.5" ry="2.5" fill="#7CBA78" opacity="0.85"/>
      {/* English book in left hand */}
      <rect x="10" y="114" width="18" height="22" rx="2" fill="#3AB0D4" stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="116" width="14" height="18" rx="1" fill="white"/>
      <text x="19" y="127" textAnchor="middle" fill={BLUE} fontSize="6" fontWeight="bold">ABC</text>
    </>
  );
  // default
  return (
    <>
      {/* Star badge */}
      <text x="65" y="116" fontSize="16" fill="#FFD700">★</text>
      {/* Book in left arm */}
      <rect x="10" y="114" width="18" height="24" rx="2" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="116" width="14" height="20" rx="1" fill="#E8D5FF"/>
      <line x1="14" y1="119" x2="24" y2="119" stroke={PURPLE} strokeWidth="1"/>
      <line x1="14" y1="123" x2="24" y2="123" stroke={PURPLE} strokeWidth="1"/>
      <line x1="14" y1="127" x2="24" y2="127" stroke={PURPLE} strokeWidth="1"/>
      <line x1="14" y1="131" x2="20" y2="131" stroke={PURPLE} strokeWidth="1"/>
    </>
  );
}

export function RiaFront({ expression = "happy", costume = "default" }: { expression?: Expression; costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: BLUE, science: "#F0F0F0", social: "#9C7A2C",
    math: PURPLE, korean: "#9B5E2A", english: "#3AB0D4",
  };
  const pants: Record<Costume, string> = {
    default: PURPLE, science: "#4A4E6E", social: "#5C4010",
    math: "#2D4A6E", korean: "#6E4020", english: "#1A5C7E",
  };
  const shirt = shirts[costume];
  const pant = pants[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* === HAIR === */}
      {/* Main hair shape */}
      <path d="M 26 58 Q 22 30 36 18 Q 50 8 60 10 Q 70 8 84 18 Q 98 30 94 58 Q 88 40 80 36 Q 70 28 60 30 Q 50 28 40 36 Q 32 40 26 58 Z"
        fill={HAIR} stroke="#1A0830" strokeWidth="1.5"/>
      {/* Side hair strands */}
      <path d="M 26 58 Q 20 72 22 85 Q 26 72 32 62" fill={HAIR}/>
      <path d="M 94 58 Q 100 72 98 85 Q 94 72 88 62" fill={HAIR}/>
      {/* Hair detail */}
      <path d="M 36 18 Q 48 14 60 16 Q 72 14 84 18 Q 70 12 60 14 Q 50 12 36 18" fill="#5A3A9E" opacity="0.5"/>

      {/* Star hairpin (upper right) */}
      <text x="76" y="32" fontSize="14" fill="#FFD700" stroke="#C0A000" strokeWidth="0.5">★</text>

      {/* === HEAD === */}
      <circle cx="60" cy="62" r="32" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* === EARS === */}
      <ellipse cx="28" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="29" cy="63" rx="2.8" ry="4.5" fill={SKIN_DARK}/>
      <ellipse cx="92" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="91" cy="63" rx="2.8" ry="4.5" fill={SKIN_DARK}/>

      {/* Eye whites / background */}
      <ellipse cx="42" cy="55" rx="12" ry="13" fill="white"/>
      <ellipse cx="78" cy="55" rx="12" ry="13" fill="white"/>

      {/* === EXPRESSIONS === */}
      <RiaFace expression={expression}/>

      {/* Eye lashes */}
      <line x1="32" y1="47" x2="35" y2="44" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="44" x2="38" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="40" y1="44" x2="41" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="68" y1="44" x2="70" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="72" y1="44" x2="74" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="76" y1="44" x2="79" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Eye outline */}
      <ellipse cx="42" cy="55" rx="12" ry="13" fill="none" stroke={DARK} strokeWidth="2"/>
      <ellipse cx="78" cy="55" rx="12" ry="13" fill="none" stroke={DARK} strokeWidth="2"/>

      {/* === NOSE === */}
      <ellipse cx="60" cy="71" rx="3" ry="2.2" fill="#E8A882"/>

      {/* === CHEEK BLUSH === */}
      <ellipse cx="28" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>
      <ellipse cx="92" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>

      {/* === NECK === */}
      <rect x="50" y="92" width="20" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* === BODY === */}
      <rect x="32" y="96" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>

      {/* Collar / neckline decoration */}
      <path d="M 47 96 Q 60 106 73 96" fill="none" stroke={DARK} strokeWidth="1.5"/>
      {/* Bow/ribbon decoration */}
      {costume === "default" && (
        <>
          <path d="M 52 97 Q 56 92 60 95 Q 64 92 68 97 Q 64 100 60 98 Q 56 100 52 97 Z" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
          <circle cx="60" cy="97" r="3" fill="#FFD700" stroke={DARK} strokeWidth="1"/>
        </>
      )}

      {/* === COSTUME ELEMENTS === */}
      <RiaCostumeBody costume={costume}/>

      {/* === LEFT ARM === */}
      <rect x="15" y="98" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="139" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <path d="M 18 137 Q 24 132 30 137" stroke={DARK} strokeWidth="1" fill="none"/>

      {/* === RIGHT ARM === */}
      <rect x="87" y="98" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="96" cy="139" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* === SKIRT/PANTS === */}
      <rect x="30" y="144" width="60" height="12" rx="6" fill={pant} stroke={DARK} strokeWidth="2"/>
      {/* Skirt/pants legs */}
      <path d="M 30 150 Q 30 172 40 175 L 55 175 Q 58 172 58 160 Q 58 172 62 175 L 77 175 Q 85 172 85 160 Q 85 172 88 175 L 93 175 Q 98 172 90 150" fill={pant} stroke={DARK} strokeWidth="2"/>

      {/* === SHOES === */}
      <ellipse cx="46" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
      <ellipse cx="74" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
      <ellipse cx="42" cy="173" rx="5" ry="2.5" fill="white" opacity="0.3"/>
      <ellipse cx="70" cy="173" rx="5" ry="2.5" fill="white" opacity="0.3"/>
    </svg>
  );
}

function RiaSide({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: BLUE, science: "#F0F0F0", social: "#9C7A2C",
    math: PURPLE, korean: "#9B5E2A", english: "#3AB0D4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 100 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair side */}
      <path d="M 22 60 Q 18 32 32 18 Q 46 8 56 10 Q 64 8 72 15 Q 82 28 80 58 Q 74 40 68 35 Q 58 28 52 30 Q 42 28 34 38 Q 26 44 22 60 Z" fill={HAIR}/>
      <path d="M 22 60 Q 16 74 18 88 Q 22 74 28 64" fill={HAIR}/>
      {/* Star pin visible from side */}
      <text x="68" y="30" fontSize="12" fill="#FFD700">★</text>

      {/* Head */}
      <circle cx="52" cy="62" r="30" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* Ear */}
      <ellipse cx="82" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="81" cy="63" rx="2.8" ry="4.5" fill={SKIN_DARK}/>

      {/* Eye (side view) */}
      <ellipse cx="36" cy="58" rx="9" ry="10" fill="white" stroke={DARK} strokeWidth="2"/>
      <ellipse cx="37" cy="58" rx="6.5" ry="7" fill={DARK}/>
      <ellipse cx="37" cy="56" rx="4.5" ry="4.5" fill="#6A9FF5"/>
      <ellipse cx="35" cy="53" rx="2.5" ry="2.5" fill="white" opacity="0.9"/>
      {/* Lash */}
      <line x1="28" y1="50" x2="31" y2="47" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="48" x2="34" y2="45" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>

      {/* Nose (profile) */}
      <path d="M 24 70 Q 20 74 24 78" stroke={DARK} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Mouth */}
      <path d="M 26 82 Q 34 89 38 82" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Blush */}
      <ellipse cx="26" cy="76" rx="7" ry="5" fill="#FF9FC0" opacity="0.3"/>

      {/* Neck */}
      <rect x="42" y="90" width="16" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body */}
      <rect x="28" y="96" width="50" height="48" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>

      {/* Book visible from side */}
      <rect x="74" y="100" width="12" height="18" rx="2" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
      <rect x="76" y="102" width="8" height="14" rx="1" fill="#E8D5FF"/>

      {/* Arm */}
      <rect x="12" y="98" width="17" height="36" rx="8.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="20" cy="137" r="8.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Skirt */}
      <path d="M 28 142 Q 26 168 38 175 L 70 175 Q 80 168 78 142 Z" fill={PURPLE} stroke={DARK} strokeWidth="2"/>

      {/* Shoes */}
      <ellipse cx="44" cy="176" rx="16" ry="6.5" fill="#AA88DD"/>
      <ellipse cx="64" cy="176" rx="13" ry="6" fill="#AA88DD"/>
    </svg>
  );
}

function RiaBack({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: BLUE, science: "#F0F0F0", social: "#9C7A2C",
    math: PURPLE, korean: "#9B5E2A", english: "#3AB0D4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair back */}
      <path d="M 26 60 Q 22 32 36 20 Q 50 10 60 12 Q 70 10 84 20 Q 98 32 94 60 Q 88 42 80 37 Q 70 30 60 32 Q 50 30 40 37 Q 32 42 26 60 Z" fill={HAIR}/>
      <path d="M 26 60 Q 20 74 22 90 Q 26 76 32 66" fill={HAIR}/>
      <path d="M 94 60 Q 100 74 98 90 Q 94 76 88 66" fill={HAIR}/>
      {/* Hair ends flowing down */}
      <path d="M 22 88 Q 25 100 30 98" stroke={HAIR} strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M 98 88 Q 95 100 90 98" stroke={HAIR} strokeWidth="8" strokeLinecap="round" fill="none"/>

      {/* Star pin from back */}
      <text x="74" y="34" fontSize="12" fill="#FFD700">★</text>

      {/* Head */}
      <circle cx="60" cy="63" r="32" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
      <ellipse cx="28" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="92" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Neck */}
      <rect x="50" y="93" width="20" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body back */}
      <rect x="32" y="96" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      {/* Back bow/ribbon if default */}
      {costume === "default" && (
        <>
          <path d="M 48 104 Q 52 98 60 101 Q 68 98 72 104 Q 68 108 60 106 Q 52 108 48 104 Z" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
          <circle cx="60" cy="104" r="3" fill="#FFD700" stroke={DARK} strokeWidth="1"/>
        </>
      )}

      {/* Arms */}
      <rect x="15" y="98" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="139" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <rect x="87" y="98" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="96" cy="139" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Skirt back */}
      <rect x="30" y="144" width="60" height="10" rx="5" fill={PURPLE} stroke={DARK} strokeWidth="2"/>
      <path d="M 30 150 Q 28 174 42 177 L 78 177 Q 92 174 90 150 Z" fill={PURPLE} stroke={DARK} strokeWidth="2"/>

      {/* Shoes */}
      <ellipse cx="46" cy="178" rx="14" ry="6" fill="#AA88DD"/>
      <ellipse cx="74" cy="178" rx="14" ry="6" fill="#AA88DD"/>
    </svg>
  );
}

function RiaPose({ pose }: { pose: "default" | "excited" | "thinking" }) {
  if (pose === "excited") {
    return (
      <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Hair */}
        <path d="M 26 58 Q 22 30 36 18 Q 50 8 60 10 Q 70 8 84 18 Q 98 30 94 58 Q 88 40 80 36 Q 70 28 60 30 Q 50 28 40 36 Q 32 40 26 58 Z" fill={HAIR}/>
        <path d="M 26 58 Q 20 72 22 85 Q 26 72 32 62" fill={HAIR}/>
        <path d="M 94 58 Q 100 72 98 85 Q 94 72 88 62" fill={HAIR}/>
        <text x="74" y="32" fontSize="14" fill="#FFD700">★</text>
        <circle cx="60" cy="62" r="32" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
        <ellipse cx="28" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="92" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Big excited eyes */}
        <ellipse cx="42" cy="55" rx="12" ry="13" fill="white" stroke={DARK} strokeWidth="2"/>
        <ellipse cx="42" cy="54" rx="9" ry="9.5" fill={DARK}/>
        <ellipse cx="42" cy="52" rx="6" ry="6" fill="#6A9FF5"/>
        <ellipse cx="39" cy="49" rx="3" ry="3" fill="white" opacity="0.9"/>
        <text x="37" y="59" fontSize="7" fill="white" opacity="0.8">✦</text>
        <ellipse cx="78" cy="55" rx="12" ry="13" fill="white" stroke={DARK} strokeWidth="2"/>
        <ellipse cx="78" cy="54" rx="9" ry="9.5" fill={DARK}/>
        <ellipse cx="78" cy="52" rx="6" ry="6" fill="#6A9FF5"/>
        <ellipse cx="75" cy="49" rx="3" ry="3" fill="white" opacity="0.9"/>
        <text x="73" y="59" fontSize="7" fill="white" opacity="0.8">✦</text>
        <line x1="32" y1="47" x2="35" y2="44" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="36" y1="44" x2="38" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="40" y1="44" x2="41" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="68" y1="44" x2="70" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="72" y1="44" x2="74" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="76" y1="44" x2="79" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        {/* Big smile */}
        <path d="M 44 73 Q 60 88 76 73" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="28" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.35"/>
        <ellipse cx="92" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.35"/>
        <ellipse cx="60" cy="71" rx="3" ry="2.2" fill="#E8A882"/>
        <rect x="50" y="92" width="20" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        <rect x="32" y="96" width="56" height="50" rx="12" fill={BLUE} stroke={DARK} strokeWidth="2.5"/>
        <path d="M 47 96 Q 60 106 73 96" fill="none" stroke={DARK} strokeWidth="1.5"/>
        <path d="M 52 97 Q 56 92 60 95 Q 64 92 68 97 Q 64 100 60 98 Q 56 100 52 97 Z" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
        <circle cx="60" cy="97" r="3" fill="#FFD700" stroke={DARK} strokeWidth="1"/>
        {/* Arms raised happily */}
        <rect x="8" y="70" width="18" height="36" rx="9" fill={BLUE} stroke={DARK} strokeWidth="2.5" transform="rotate(-45 8 70)"/>
        <circle cx="3" cy="104" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <rect x="94" y="70" width="18" height="36" rx="9" fill={BLUE} stroke={DARK} strokeWidth="2.5" transform="rotate(45 112 70)"/>
        <circle cx="117" cy="104" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Stars */}
        <text x="4" y="66" fontSize="16" fill="#FFD700">✦</text>
        <text x="98" y="66" fontSize="16" fill="#FFD700">✦</text>
        <text x="56" y="14" fontSize="12" fill="#FFD700">★</text>
        {/* Skirt */}
        <rect x="30" y="144" width="60" height="12" rx="6" fill={PURPLE} stroke={DARK} strokeWidth="2"/>
        <path d="M 30 150 Q 30 172 40 175 L 55 175 Q 58 172 58 160 Q 58 172 62 175 L 77 175 Q 85 172 85 160 Q 85 172 88 175 L 93 175 Q 98 172 90 150" fill={PURPLE} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="46" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
        <ellipse cx="74" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
      </svg>
    );
  }
  if (pose === "thinking") {
    return (
      <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path d="M 26 58 Q 22 30 36 18 Q 50 8 60 10 Q 70 8 84 18 Q 98 30 94 58 Q 88 40 80 36 Q 70 28 60 30 Q 50 28 40 36 Q 32 40 26 58 Z" fill={HAIR}/>
        <path d="M 26 58 Q 20 72 22 85 Q 26 72 32 62" fill={HAIR}/>
        <path d="M 94 58 Q 100 72 98 85 Q 94 72 88 62" fill={HAIR}/>
        <text x="74" y="32" fontSize="14" fill="#FFD700">★</text>
        <circle cx="60" cy="62" r="32" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
        <ellipse cx="28" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="92" cy="62" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="42" cy="55" rx="12" ry="13" fill="white" stroke={DARK} strokeWidth="2"/>
        <ellipse cx="78" cy="55" rx="12" ry="13" fill="white" stroke={DARK} strokeWidth="2"/>
        {/* Curious/thinking eyes - looking up */}
        <ellipse cx="42" cy="53" rx="8" ry="8.5" fill={DARK}/>
        <ellipse cx="42" cy="51" rx="5.5" ry="5.5" fill="#6A9FF5"/>
        <ellipse cx="39" cy="48" rx="2.5" ry="2.5" fill="white" opacity="0.9"/>
        <ellipse cx="78" cy="53" rx="8" ry="8.5" fill={DARK}/>
        <ellipse cx="78" cy="51" rx="5.5" ry="5.5" fill="#6A9FF5"/>
        <ellipse cx="75" cy="48" rx="2.5" ry="2.5" fill="white" opacity="0.9"/>
        <line x1="32" y1="47" x2="35" y2="44" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="36" y1="44" x2="38" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="40" y1="44" x2="41" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="68" y1="44" x2="70" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="72" y1="44" x2="74" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="76" y1="44" x2="79" y2="41" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 49 76 Q 58 82 68 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="60" cy="71" rx="3" ry="2.2" fill="#E8A882"/>
        <ellipse cx="28" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>
        <ellipse cx="92" cy="74" rx="9" ry="6" fill="#FF9FC0" opacity="0.3"/>
        {/* Thought bubbles */}
        <circle cx="90" cy="30" r="14" fill="white" stroke="#DDD" strokeWidth="2"/>
        <circle cx="82" cy="44" r="7" fill="white" stroke="#DDD" strokeWidth="1.5"/>
        <circle cx="78" cy="52" r="4" fill="white" stroke="#DDD" strokeWidth="1.5"/>
        <text x="90" y="34" textAnchor="middle" fontSize="10">💡</text>
        <rect x="50" y="92" width="20" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        <rect x="32" y="96" width="56" height="50" rx="12" fill={BLUE} stroke={DARK} strokeWidth="2.5"/>
        <path d="M 47 96 Q 60 106 73 96" fill="none" stroke={DARK} strokeWidth="1.5"/>
        <path d="M 52 97 Q 56 92 60 95 Q 64 92 68 97 Q 64 100 60 98 Q 56 100 52 97 Z" fill={PURPLE} stroke={DARK} strokeWidth="1.5"/>
        <circle cx="60" cy="97" r="3" fill="#FFD700" stroke={DARK} strokeWidth="1"/>
        {/* Left arm raised to chin */}
        <rect x="10" y="96" width="18" height="36" rx="9" fill={BLUE} stroke={DARK} strokeWidth="2.5" transform="rotate(-55 28 96)"/>
        <circle cx="12" cy="82" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Finger on chin */}
        <ellipse cx="44" cy="88" rx="4" ry="4" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        {/* Right arm at side */}
        <rect x="87" y="98" width="18" height="38" rx="9" fill={BLUE} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="96" cy="139" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <rect x="30" y="144" width="60" height="12" rx="6" fill={PURPLE} stroke={DARK} strokeWidth="2"/>
        <path d="M 30 150 Q 30 172 40 175 L 55 175 Q 58 172 58 160 Q 58 172 62 175 L 77 175 Q 85 172 85 160 Q 85 172 88 175 L 93 175 Q 98 172 90 150" fill={PURPLE} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="46" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
        <ellipse cx="74" cy="176" rx="14" ry="6.5" fill="#AA88DD"/>
      </svg>
    );
  }
  return <RiaFront expression="happy" costume="default"/>;
}

const EXPRESSIONS: Array<{ key: Expression; label: string; emoji: string }> = [
  { key: "happy", label: "웃음", emoji: "😊" },
  { key: "surprised", label: "놀람", emoji: "😲" },
  { key: "curious", label: "궁금함", emoji: "🤔" },
  { key: "confident", label: "자신감", emoji: "😎" },
  { key: "touched", label: "감동", emoji: "🥺" },
];

const COSTUMES: Array<{ key: Costume; label: string; icon: string }> = [
  { key: "science", label: "과학", icon: "🔬" },
  { key: "social", label: "사회", icon: "🗺️" },
  { key: "math", label: "수학", icon: "🔢" },
  { key: "korean", label: "국어", icon: "📝" },
  { key: "english", label: "영어", icon: "🌍" },
];

const POSES: Array<{ key: "default" | "excited" | "thinking"; label: string }> = [
  { key: "default", label: "기본 포즈" },
  { key: "excited", label: "신남 포즈" },
  { key: "thinking", label: "생각 포즈" },
];

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{ width: "4px", height: "22px", background: color, borderRadius: "2px" }}/>
      <span style={{ fontSize: "13px", fontWeight: "800", color: "#333", letterSpacing: "1px", textTransform: "uppercase" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: `${color}40` }}/>
    </div>
  );
}

function CharCard({ label, sublabel, children, bg = "#fff" }: { label: string; sublabel?: string; children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ background: bg, border: "2px solid #E8E0D8", borderRadius: "12px", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "100%", aspectRatio: "3/4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: "#333" }}>{label}</div>
        {sublabel && <div style={{ fontSize: "10px", color: "#888" }}>{sublabel}</div>}
      </div>
    </div>
  );
}

export function RiaSheet() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Profile Header */}
      <div style={{
        background: "linear-gradient(135deg, #EEF2FF 0%, #E0D8FF 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        border: "3px solid #7B9FF5",
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: "20px", top: "10px", fontSize: "80px", opacity: 0.07, fontWeight: "900" }}>RIA</div>
        <div style={{ width: "130px", flexShrink: 0 }}>
          <RiaFront expression="happy" costume="default"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "38px", fontWeight: "900", color: BLUE, letterSpacing: "-1px" }}>리아</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: PURPLE, letterSpacing: "3px" }}>RIA</span>
          </div>
          <div style={{ display: "inline-block", background: BLUE, color: "white", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "800", marginBottom: "14px" }}>
            ⭐ 지식 탐험가
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>성격</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {["똑똑함", "차분함", "관찰력 우수", "설명을 잘함", "팀의 브레인"].map(t => (
                  <span key={t} style={{ background: "#EEF2FF", border: `1.5px solid ${BLUE}`, borderRadius: "8px", padding: "2px 8px", fontSize: "10px", color: "#5570C0", fontWeight: "700" }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>상징</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["⭐ 별", "🗺️ 지도", "🧭 나침반"].map(t => (
                  <span key={t} style={{ fontSize: "12px" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px" }}>대표 컬러</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[["#7B9FF5", "하늘색"], ["#9B7FD4", "보라색"], ["#3D2A6E", "다크퍼플"], ["#AA88DD", "라벤더"]].map(([c, n]) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: c, border: "2px solid rgba(0,0,0,0.15)" }}/>
                  <span style={{ fontSize: "9px", color: "#666", fontWeight: "700" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="캐릭터 3면도" color={BLUE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <CharCard label="정면" sublabel="Front View"><RiaFront expression="happy" costume="default"/></CharCard>
          <CharCard label="측면" sublabel="Side View"><RiaSide costume="default"/></CharCard>
          <CharCard label="후면" sublabel="Back View"><RiaBack costume="default"/></CharCard>
        </div>
      </div>

      <div>
        <SectionHeader title="기본 표정 5종" color={BLUE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {EXPRESSIONS.map(({ key, label, emoji }) => (
            <CharCard key={key} label={`${emoji} ${label}`} bg="#F8F6FF">
              <RiaFront expression={key} costume="default"/>
            </CharCard>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="대표 포즈 3종" color={BLUE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {POSES.map(({ key, label }) => (
            <CharCard key={key} label={label} bg="#F5F2FF">
              <RiaPose pose={key}/>
            </CharCard>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="과목별 변신 시스템" color={BLUE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {COSTUMES.map(({ key, label, icon }) => (
            <CharCard key={key} label={`${icon} ${label}`} bg="#F8F5FF">
              <RiaFront expression="happy" costume={key}/>
            </CharCard>
          ))}
        </div>
      </div>
    </div>
  );
}
