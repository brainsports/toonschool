import React from "react";

type Expression = "happy" | "surprised" | "curious" | "confident" | "touched";
type Costume = "default" | "science" | "social" | "math" | "korean" | "english";

const ORANGE = "#FF8C42";
const YELLOW = "#FFD426";
const DARK = "#2D1B0E";
const SKIN = "#FFDCB8";
const SKIN_DARK = "#FFB899";
const PANTS_DEFAULT = "#3A3A5C";

function TonyFace({ expression }: { expression: Expression }) {
  if (expression === "happy") return (
    <>
      <path d="M 46 77 Q 60 90 74 77" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 35 57 Q 42 65 49 57" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M 71 57 Q 78 65 85 57" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </>
  );
  if (expression === "surprised") return (
    <>
      <ellipse cx="60" cy="79" rx="8" ry="10" fill={DARK}/>
      <circle cx="42" cy="57" r="8" fill="#1a6fa0"/>
      <circle cx="42" cy="57" r="5" fill={DARK}/>
      <circle cx="39" cy="54" r="2" fill="white" opacity="0.8"/>
      <circle cx="78" cy="57" r="8" fill="#1a6fa0"/>
      <circle cx="78" cy="57" r="5" fill={DARK}/>
      <circle cx="75" cy="54" r="2" fill="white" opacity="0.8"/>
    </>
  );
  if (expression === "curious") return (
    <>
      <path d="M 49 79 Q 60 85 70 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 36 57 Q 42 62 48 57" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="78" cy="57" r="7" fill="#1a6fa0"/>
      <circle cx="78" cy="57" r="4" fill={DARK}/>
      <circle cx="75" cy="54" r="1.8" fill="white" opacity="0.8"/>
    </>
  );
  if (expression === "confident") return (
    <>
      <path d="M 50 77 Q 62 85 72 77" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 36 59 Q 42 63 48 59" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 72 59 Q 78 63 84 59" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="35" y1="53" x2="49" y2="53" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="71" y1="53" x2="85" y2="53" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"/>
    </>
  );
  // touched
  return (
    <>
      <path d="M 46 76 Q 60 88 74 76" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 36 58 Q 42 65 48 58" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 72 58 Q 78 65 84 58" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="36" cy="67" rx="3" ry="4.5" fill="#B3E0FF" opacity="0.75"/>
      <ellipse cx="84" cy="67" rx="3" ry="4.5" fill="#B3E0FF" opacity="0.75"/>
    </>
  );
}

function TonyCostumeBody({ costume, shirtColor, pantsColor }: { costume: Costume; shirtColor: string; pantsColor: string; }) {
  if (costume === "science") return (
    <>
      {/* White coat flap left */}
      <path d="M 46 96 L 40 115 L 58 108" fill="#E8E8E8" stroke="#ccc" strokeWidth="1.5"/>
      {/* White coat flap right */}
      <path d="M 74 96 L 80 115 L 62 108" fill="#E8E8E8" stroke="#ccc" strokeWidth="1.5"/>
      {/* Test tube in right hand */}
      <rect x="94" y="118" width="8" height="24" rx="4" fill="#B3EEFF" stroke={DARK} strokeWidth="1.5"/>
      <rect x="94" y="118" width="8" height="9" rx="0" fill="#7BC8FF" opacity="0.9"/>
      <rect x="92" y="116" width="12" height="5" rx="2.5" fill={DARK}/>
      {/* Bubbles */}
      <circle cx="98" cy="135" r="2" fill="white" opacity="0.6"/>
      <circle cx="96" cy="129" r="1.5" fill="white" opacity="0.5"/>
    </>
  );
  if (costume === "social") return (
    <>
      {/* Explorer vest pockets */}
      <rect x="37" y="102" width="12" height="10" rx="2" fill="#8B6914" stroke={DARK} strokeWidth="1.5"/>
      <rect x="71" y="102" width="12" height="10" rx="2" fill="#8B6914" stroke={DARK} strokeWidth="1.5"/>
      <line x1="38" y1="107" x2="48" y2="107" stroke={DARK} strokeWidth="1"/>
      <line x1="72" y1="107" x2="82" y2="107" stroke={DARK} strokeWidth="1"/>
      {/* Map scroll in right hand */}
      <rect x="89" y="118" width="20" height="13" rx="3" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 91 121 L 107 121 M 91 124 L 107 124 M 91 127 L 102 127" stroke="#8B6914" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="89" cy="124" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="109" cy="124" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      {/* Compass in left hand */}
      <circle cx="22" cy="128" r="10" fill="#DDD" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="22" cy="128" r="7" fill="#EEE"/>
      <line x1="22" y1="121" x2="22" y2="125" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="131" x2="22" y2="135" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="128" r="1.5" fill={DARK}/>
    </>
  );
  if (costume === "math") return (
    <>
      {/* Pi badge on chest */}
      <circle cx="50" cy="108" r="9" fill={YELLOW} stroke={DARK} strokeWidth="1.5"/>
      <text x="50" y="113" textAnchor="middle" fill={DARK} fontSize="9" fontWeight="bold" fontFamily="serif">π</text>
      {/* Calculator in left hand */}
      <rect x="11" y="114" width="20" height="26" rx="3" fill="#DDD" stroke={DARK} strokeWidth="1.5"/>
      <rect x="13" y="116" width="16" height="9" rx="1.5" fill="#B3E0FF"/>
      <text x="21" y="123" textAnchor="middle" fill={DARK} fontSize="5" fontFamily="monospace">1+2</text>
      <circle cx="15" cy="129" r="2.2" fill="#888"/>
      <circle cx="21" cy="129" r="2.2" fill="#888"/>
      <circle cx="27" cy="129" r="2.2" fill="#888"/>
      <circle cx="15" cy="135" r="2.2" fill="#888"/>
      <circle cx="21" cy="135" r="2.2" fill={ORANGE}/>
      <circle cx="27" cy="135" r="2.2" fill="#888"/>
      {/* Number badges on arms */}
      <circle cx="18" cy="108" r="5" fill="#FF6B6B" stroke={DARK} strokeWidth="1"/>
      <text x="18" y="111" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">3</text>
    </>
  );
  if (costume === "korean") return (
    <>
      {/* Traditional writer hat */}
      <rect x="38" y="22" width="44" height="6" rx="3" fill={DARK}/>
      <ellipse cx="60" cy="23" rx="18" ry="5" fill="#4A3520"/>
      <ellipse cx="60" cy="20" rx="10" ry="7" fill="#2D1B0E"/>
      {/* Hanbok-style collar details */}
      <path d="M 46 96 L 52 106 L 60 100 L 68 106 L 74 96" fill="#D4A853" stroke={DARK} strokeWidth="1.5"/>
      {/* Pen/brush in right hand */}
      <rect x="93" y="110" width="6" height="28" rx="3" fill={DARK} transform="rotate(-20 96 124)"/>
      <polygon points="89,134 96,142 99,132" fill={ORANGE} transform="rotate(-20 96 134)"/>
      {/* Book in left hand */}
      <rect x="10" y="116" width="16" height="22" rx="2" fill="#D4A853" stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="118" width="12" height="18" rx="1" fill="#F5DDA0"/>
      <line x1="14" y1="121" x2="22" y2="121" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="124" x2="22" y2="124" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="127" x2="22" y2="127" stroke={DARK} strokeWidth="1"/>
    </>
  );
  if (costume === "english") return (
    <>
      {/* Travel scarf */}
      <path d="M 46 95 Q 52 104 58 98 Q 62 106 68 99 Q 74 105 76 95" stroke="#3AB0D4" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Globe in left hand */}
      <circle cx="20" cy="128" r="13" fill="#3AB0D4" stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="20" cy="128" rx="13" ry="8" fill="none" stroke={DARK} strokeWidth="1"/>
      <line x1="20" y1="115" x2="20" y2="141" stroke={DARK} strokeWidth="1"/>
      <ellipse cx="14" cy="124" rx="4" ry="3" fill="#7CBA78" opacity="0.85"/>
      <ellipse cx="25" cy="132" rx="3.5" ry="2.5" fill="#7CBA78" opacity="0.85"/>
      {/* Passport stamp badge */}
      <circle cx="73" cy="107" r="8" fill="#FF6B6B" stroke={DARK} strokeWidth="1.5" strokeDasharray="2 1"/>
      <text x="73" y="109" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">EN</text>
      <text x="73" y="114" textAnchor="middle" fill="white" fontSize="4">✓</text>
    </>
  );
  // default
  return (
    <>
      {/* Lightbulb pocket logo */}
      <rect x="62" y="104" width="15" height="13" rx="3" fill={YELLOW} stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="69" cy="108" rx="4.5" ry="5" fill={ORANGE}/>
      <ellipse cx="69" cy="106" rx="3.5" ry="3.5" fill={YELLOW}/>
      <rect x="67" y="113" width="4" height="3" rx="1" fill={DARK}/>
      <line x1="69" y1="116" x2="67" y2="119" stroke={DARK} strokeWidth="1.2"/>
      <line x1="69" y1="116" x2="71" y2="119" stroke={DARK} strokeWidth="1.2"/>
      {/* Backpack straps */}
      <path d="M 38 100 L 56 142" stroke="#CC6618" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <path d="M 82 100 L 64 142" stroke="#CC6618" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
    </>
  );
}

function TonyFront({ expression = "happy", costume = "default" }: { expression?: Expression; costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: ORANGE, science: "#F5F5F5", social: "#9C7A2C",
    math: "#4A90D9", korean: "#D4A853", english: "#3AB0D4",
  };
  const pants: Record<Costume, string> = {
    default: PANTS_DEFAULT, science: PANTS_DEFAULT, social: "#5C4010",
    math: "#2D4A6E", korean: "#6E3820", english: "#1A5C7E",
  };
  const shirt = shirts[costume];
  const pant = pants[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* === HAIR === */}
      <path d="M 32 40 Q 34 20 40 14 L 45 28 Q 46 11 52 7 L 56 22 Q 58 5 64 3 L 67 18 Q 70 4 77 7 L 74 23 Q 78 11 85 14 L 80 36 Q 68 29 60 33 Q 50 26 44 31 Z"
        fill="#2D1B0E" stroke="#1A0E05" strokeWidth="1"/>
      {/* Lightning highlights */}
      <path d="M 52 7 L 56 22 Q 57 6 62 3 L 64 16" fill={YELLOW} stroke="none" opacity="0.7"/>
      <path d="M 70 4 L 73 17 Q 75 5 80 8" fill={YELLOW} stroke="none" opacity="0.5"/>

      {/* === HEAD === */}
      <circle cx="60" cy="62" r="34" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* === EARS === */}
      <ellipse cx="26" cy="62" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="27" cy="63" rx="3.2" ry="5" fill={SKIN_DARK}/>
      <ellipse cx="94" cy="62" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="93" cy="63" rx="3.2" ry="5" fill={SKIN_DARK}/>

      {/* === GOGGLE BAND === */}
      <rect x="22" y="51" width="76" height="17" rx="8" fill="#555" stroke={DARK} strokeWidth="1.5" opacity="0.77"/>

      {/* === LEFT GOGGLE === */}
      <circle cx="42" cy="59" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="42" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
      <circle cx="37" cy="54" r="3.2" fill="white" opacity="0.82"/>
      <circle cx="41" cy="50" r="1.8" fill="white" opacity="0.65"/>

      {/* === RIGHT GOGGLE === */}
      <circle cx="78" cy="59" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="78" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
      <circle cx="73" cy="54" r="3.2" fill="white" opacity="0.82"/>
      <circle cx="77" cy="50" r="1.8" fill="white" opacity="0.65"/>

      {/* Goggle bridge */}
      <path d="M 56 59 L 64 59" stroke={YELLOW} strokeWidth="3.5" strokeLinecap="round"/>

      {/* === NOSE === */}
      <ellipse cx="60" cy="72" rx="3.2" ry="2.5" fill="#E8A882"/>

      {/* === EXPRESSION (mouth + goggle eyes) === */}
      <TonyFace expression={expression}/>

      {/* === CHEEK BLUSH === */}
      <ellipse cx="29" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>
      <ellipse cx="91" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>

      {/* === NECK === */}
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* === BODY === */}
      <rect x="32" y="98" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <path d="M 47 98 L 60 112 L 73 98" fill={costume === "science" ? "#E8E8E8" : shirt} stroke={DARK} strokeWidth="1.5"/>

      {/* === COSTUME ELEMENTS === */}
      <TonyCostumeBody costume={costume} shirtColor={shirt} pantsColor={pant}/>

      {/* === LEFT ARM === */}
      <rect x="14" y="100" width="19" height="40" rx="9.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      {/* Left hand */}
      <circle cx="23" cy="143" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <path d="M 17 141 Q 23 135 29 141" stroke={DARK} strokeWidth="1" fill="none"/>

      {/* === RIGHT ARM === */}
      <rect x="87" y="100" width="19" height="40" rx="9.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      {/* Right hand */}
      <circle cx="96" cy="143" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* === PANTS === */}
      <rect x="34" y="146" width="22" height="25" rx="7" fill={pant} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="25" rx="7" fill={pant} stroke={DARK} strokeWidth="2.5"/>

      {/* === SHOES === */}
      <ellipse cx="45" cy="173" rx="17" ry="7.5" fill="#2D1B0E"/>
      <ellipse cx="41" cy="169" rx="6.5" ry="3" fill="#555" opacity="0.4"/>
      <ellipse cx="75" cy="173" rx="17" ry="7.5" fill="#2D1B0E"/>
      <ellipse cx="71" cy="169" rx="6.5" ry="3" fill="#555" opacity="0.4"/>
    </svg>
  );
}

function TonySide({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: ORANGE, science: "#F5F5F5", social: "#9C7A2C",
    math: "#4A90D9", korean: "#D4A853", english: "#3AB0D4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 100 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair side view */}
      <path d="M 38 38 Q 30 20 38 12 L 44 26 Q 46 10 53 8 L 55 22 Q 58 6 65 7 L 63 24 Q 68 12 73 16 L 68 36 Q 60 28 56 30 Q 46 25 40 32 Z"
        fill={DARK} stroke="#1A0E05" strokeWidth="1"/>
      <path d="M 53 8 L 55 22 Q 57 7 63 7" fill={YELLOW} opacity="0.6"/>

      {/* Head */}
      <circle cx="54" cy="62" r="32" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* Right ear (visible from side) */}
      <ellipse cx="86" cy="62" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="85" cy="63" rx="3" ry="5" fill={SKIN_DARK}/>

      {/* Goggle band (side) */}
      <path d="M 24 56 Q 50 52 86 55" stroke="#555" strokeWidth="14" strokeLinecap="round" opacity="0.75" fill="none"/>

      {/* Goggle (side - ellipse) */}
      <ellipse cx="36" cy="58" rx="8" ry="13" fill={YELLOW} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="38" cy="58" rx="5" ry="9" fill="#B3E0FF" opacity="0.85"/>
      <ellipse cx="36" cy="53" rx="2.5" ry="1.5" fill="white" opacity="0.75"/>

      {/* Nose */}
      <path d="M 24 70 Q 20 73 24 76" stroke={DARK} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Mouth */}
      <path d="M 28 80 Q 36 86 40 80" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Blush */}
      <ellipse cx="28" cy="76" rx="7" ry="5" fill="#FF9E7A" opacity="0.3"/>

      {/* Neck */}
      <rect x="44" y="92" width="18" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body */}
      <rect x="30" y="98" width="50" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>

      {/* Backpack visible from side */}
      {costume === "default" && (
        <>
          <rect x="76" y="100" width="14" height="36" rx="7" fill="#CC6618" stroke={DARK} strokeWidth="2"/>
          <rect x="77" y="108" width="12" height="10" rx="3" fill="#FF8C42"/>
          <rect x="77" y="104" width="12" height="4" rx="2" fill="#FFD426"/>
        </>
      )}

      {/* Arm (one visible from side) */}
      <rect x="14" y="100" width="17" height="38" rx="8.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="22" cy="141" r="8.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Pants */}
      <rect x="32" y="146" width="20" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
      <rect x="56" y="146" width="20" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>

      {/* Shoes */}
      <ellipse cx="42" cy="173" rx="18" ry="7" fill={DARK}/>
      <ellipse cx="66" cy="173" rx="15" ry="7" fill={DARK}/>
    </svg>
  );
}

function TonyBack({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: ORANGE, science: "#F5F5F5", social: "#9C7A2C",
    math: "#4A90D9", korean: "#D4A853", english: "#3AB0D4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair back */}
      <path d="M 30 42 Q 32 22 40 14 L 45 30 Q 47 13 54 9 L 57 24 Q 59 7 65 5 L 67 20 Q 70 6 77 9 L 74 25 Q 79 13 86 16 L 80 40 Q 68 32 60 36 Q 50 29 42 34 Z"
        fill={DARK}/>

      {/* Head back */}
      <circle cx="60" cy="63" r="34" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* Ears */}
      <ellipse cx="26" cy="63" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="94" cy="63" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Back hair detail */}
      <path d="M 38 95 Q 60 92 82 95 Q 75 85 60 88 Q 45 85 38 95" fill={DARK} opacity="0.4"/>

      {/* Neck */}
      <rect x="50" y="95" width="20" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body back */}
      <rect x="32" y="98" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>

      {/* Backpack */}
      {costume === "default" && (
        <>
          <rect x="40" y="103" width="40" height="38" rx="8" fill="#CC6618" stroke={DARK} strokeWidth="2"/>
          <rect x="43" y="106" width="34" height="25" rx="6" fill="#E07020" stroke={DARK} strokeWidth="1"/>
          <circle cx="60" cy="119" r="6" fill="#FFD426" stroke={DARK} strokeWidth="1.5"/>
          <line x1="44" y1="103" x2="44" y2="96" stroke="#CC6618" strokeWidth="4" strokeLinecap="round"/>
          <line x1="76" y1="103" x2="76" y2="96" stroke="#CC6618" strokeWidth="4" strokeLinecap="round"/>
        </>
      )}
      {costume === "science" && (
        <>
          <path d="M 36 98 L 30 115" stroke="#ccc" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 84 98 L 90 115" stroke="#ccc" strokeWidth="3" strokeLinecap="round"/>
        </>
      )}

      {/* Arms */}
      <rect x="14" y="100" width="19" height="40" rx="9.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="23" cy="143" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <rect x="87" y="100" width="19" height="40" rx="9.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="96" cy="143" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Pants */}
      <rect x="34" y="146" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>

      {/* Shoes */}
      <ellipse cx="45" cy="173" rx="17" ry="7.5" fill={DARK}/>
      <ellipse cx="75" cy="173" rx="17" ry="7.5" fill={DARK}/>
    </svg>
  );
}

function TonyPose({ pose }: { pose: "default" | "excited" | "thinking" }) {
  if (pose === "excited") {
    return (
      <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Hair */}
        <path d="M 32 38 Q 34 18 40 12 L 45 26 Q 46 9 52 5 L 56 20 Q 58 3 64 1 L 67 16 Q 70 2 77 5 L 74 21 Q 78 9 85 12 L 80 34 Q 68 27 60 31 Q 50 24 44 29 Z" fill={DARK}/>
        <path d="M 52 5 L 56 20 Q 57 4 62 1 L 64 14" fill={YELLOW} opacity="0.7"/>
        {/* Jump - slight bounce, feet not on ground */}
        <circle cx="60" cy="60" r="34" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
        <ellipse cx="26" cy="60" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="94" cy="60" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <rect x="22" y="49" width="76" height="17" rx="8" fill="#555" stroke={DARK} strokeWidth="1.5" opacity="0.77"/>
        <circle cx="42" cy="57" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="42" cy="57" r="10" fill="#B3E0FF" opacity="0.88"/>
        <circle cx="37" cy="52" r="3.2" fill="white" opacity="0.82"/>
        <circle cx="78" cy="57" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="78" cy="57" r="10" fill="#B3E0FF" opacity="0.88"/>
        <circle cx="73" cy="52" r="3.2" fill="white" opacity="0.82"/>
        <path d="M 56 57 L 64 57" stroke={YELLOW} strokeWidth="3.5" strokeLinecap="round"/>
        <ellipse cx="60" cy="71" rx="3.2" ry="2.5" fill="#E8A882"/>
        {/* Excited mouth - wide open smile */}
        <path d="M 44 75 Q 60 92 76 75" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 44 75 Q 60 92 76 75" fill="#FF9E7A" opacity="0.3"/>
        {/* Excited eyes (curved) */}
        <path d="M 35 55 Q 42 63 49 55" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 71 55 Q 78 63 85 55" stroke="#1a6fa0" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <ellipse cx="29" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.35"/>
        <ellipse cx="91" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.35"/>
        {/* Neck */}
        <rect x="50" y="92" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        {/* Body */}
        <rect x="32" y="96" width="56" height="50" rx="12" fill={ORANGE} stroke={DARK} strokeWidth="2.5"/>
        <path d="M 47 96 L 60 110 L 73 96" fill={ORANGE} stroke={DARK} strokeWidth="1.5"/>
        <rect x="62" y="103" width="15" height="13" rx="3" fill={YELLOW} stroke={DARK} strokeWidth="1.5"/>
        {/* Arms raised! */}
        <rect x="8" y="72" width="19" height="38" rx="9.5" fill={ORANGE} stroke={DARK} strokeWidth="2.5" transform="rotate(-40 8 72)"/>
        <circle cx="5" cy="108" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <rect x="93" y="72" width="19" height="38" rx="9.5" fill={ORANGE} stroke={DARK} strokeWidth="2.5" transform="rotate(40 112 72)"/>
        <circle cx="115" cy="108" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Stars around */}
        <text x="8" y="68" fontSize="14" fill={YELLOW}>✦</text>
        <text x="102" y="68" fontSize="14" fill={YELLOW}>✦</text>
        <text x="55" y="12" fontSize="12" fill={YELLOW}>★</text>
        {/* Pants */}
        <rect x="34" y="144" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
        <rect x="64" y="144" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
        {/* Shoes (slightly lifted) */}
        <ellipse cx="45" cy="172" rx="17" ry="7.5" fill={DARK}/>
        <ellipse cx="75" cy="172" rx="17" ry="7.5" fill={DARK}/>
      </svg>
    );
  }
  if (pose === "thinking") {
    return (
      <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Hair */}
        <path d="M 32 40 Q 34 20 40 14 L 45 28 Q 46 11 52 7 L 56 22 Q 58 5 64 3 L 67 18 Q 70 4 77 7 L 74 23 Q 78 11 85 14 L 80 36 Q 68 29 60 33 Q 50 26 44 31 Z" fill={DARK}/>
        <path d="M 52 7 L 56 22 Q 57 6 62 3 L 64 16" fill={YELLOW} opacity="0.7"/>
        {/* Head tilted slightly */}
        <circle cx="58" cy="62" r="34" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
        <ellipse cx="24" cy="62" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <ellipse cx="92" cy="62" rx="6" ry="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        <rect x="20" y="51" width="76" height="17" rx="8" fill="#555" stroke={DARK} strokeWidth="1.5" opacity="0.77"/>
        <circle cx="40" cy="59" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="40" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
        <circle cx="35" cy="54" r="3.2" fill="white" opacity="0.82"/>
        <circle cx="76" cy="59" r="14" fill={YELLOW} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="76" cy="59" r="10" fill="#B3E0FF" opacity="0.88"/>
        <circle cx="71" cy="54" r="3.2" fill="white" opacity="0.82"/>
        <path d="M 54 59 L 62 59" stroke={YELLOW} strokeWidth="3.5" strokeLinecap="round"/>
        <ellipse cx="58" cy="72" rx="3.2" ry="2.5" fill="#E8A882"/>
        {/* Thinking expression */}
        <path d="M 48 78 Q 58 82 68 74" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 34 59 Q 40 63 46 59" stroke="#1a6fa0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="76" cy="59" r="7" fill="#1a6fa0"/>
        <circle cx="76" cy="59" r="3.5" fill={DARK}/>
        <circle cx="73" cy="56" r="1.8" fill="white" opacity="0.8"/>
        {/* Question marks */}
        <text x="88" y="32" fontSize="14" fill={ORANGE} fontWeight="bold">?</text>
        <text x="95" y="22" fontSize="10" fill={YELLOW}>?</text>
        <ellipse cx="27" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>
        <ellipse cx="89" cy="74" rx="9" ry="6" fill="#FF9E7A" opacity="0.32"/>
        <rect x="48" y="92" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        <rect x="30" y="96" width="56" height="50" rx="12" fill={ORANGE} stroke={DARK} strokeWidth="2.5"/>
        <path d="M 45 96 L 58 110 L 71 96" fill={ORANGE} stroke={DARK} strokeWidth="1.5"/>
        {/* Left arm up to chin (thinking pose) */}
        <rect x="12" y="98" width="19" height="38" rx="9.5" fill={ORANGE} stroke={DARK} strokeWidth="2.5" transform="rotate(-60 30 98)"/>
        <circle cx="14" cy="86" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Finger to chin */}
        <ellipse cx="46" cy="90" rx="4" ry="4" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
        {/* Right arm at side */}
        <rect x="85" y="98" width="19" height="40" rx="9.5" fill={ORANGE} stroke={DARK} strokeWidth="2.5"/>
        <circle cx="94" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
        {/* Pants */}
        <rect x="32" y="144" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
        <rect x="62" y="144" width="22" height="25" rx="7" fill={PANTS_DEFAULT} stroke={DARK} strokeWidth="2.5"/>
        {/* Shoes */}
        <ellipse cx="43" cy="171" rx="17" ry="7.5" fill={DARK}/>
        <ellipse cx="73" cy="171" rx="17" ry="7.5" fill={DARK}/>
      </svg>
    );
  }
  // default pose
  return <TonyFront expression="happy" costume="default"/>;
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

export function TonySheet() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Profile Header */}
      <div style={{
        background: "linear-gradient(135deg, #FFF0E0 0%, #FFE0C0 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        border: "3px solid #FF8C42",
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: "20px", top: "10px", fontSize: "80px", opacity: 0.08, fontWeight: "900" }}>TONY</div>
        <div style={{ width: "130px", flexShrink: 0 }}>
          <TonyFront expression="happy" costume="default"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "38px", fontWeight: "900", color: "#FF8C42", letterSpacing: "-1px" }}>토니</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#CC6618", letterSpacing: "3px" }}>TONY</span>
          </div>
          <div style={{ display: "inline-block", background: "#FF8C42", color: "white", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "800", marginBottom: "14px" }}>
            ⚡ 아이디어 발명가
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>성격</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {["호기심 폭발", "실험 좋아함", "엉뚱함", "두려움 없음", "리더"].map(t => (
                  <span key={t} style={{ background: "#FFF0E0", border: "1.5px solid #FF8C42", borderRadius: "8px", padding: "2px 8px", fontSize: "10px", color: "#CC6618", fontWeight: "700" }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>상징</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["💡 전구", "🚀 로켓", "⚙️ 기어", "⚡ 번개"].map(t => (
                  <span key={t} style={{ fontSize: "12px" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px" }}>대표 컬러</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[["#FF8C42", "오렌지"], ["#FFD426", "노랑"], ["#2D1B0E", "다크브라운"], ["#3A3A5C", "네이비"]].map(([c, n]) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: c, border: "2px solid rgba(0,0,0,0.15)" }}/>
                  <span style={{ fontSize: "9px", color: "#666", fontWeight: "700" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Views */}
      <div>
        <SectionHeader title="캐릭터 3면도" color={ORANGE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <CharCard label="정면" sublabel="Front View">
            <TonyFront expression="happy" costume="default"/>
          </CharCard>
          <CharCard label="측면" sublabel="Side View">
            <TonySide costume="default"/>
          </CharCard>
          <CharCard label="후면" sublabel="Back View">
            <TonyBack costume="default"/>
          </CharCard>
        </div>
      </div>

      {/* Expressions */}
      <div>
        <SectionHeader title="기본 표정 5종" color={ORANGE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {EXPRESSIONS.map(({ key, label, emoji }) => (
            <CharCard key={key} label={`${emoji} ${label}`} bg="#FFFBF8">
              <TonyFront expression={key} costume="default"/>
            </CharCard>
          ))}
        </div>
      </div>

      {/* Poses */}
      <div>
        <SectionHeader title="대표 포즈 3종" color={ORANGE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {POSES.map(({ key, label }) => (
            <CharCard key={key} label={label} bg="#FFF8F3">
              <TonyPose pose={key}/>
            </CharCard>
          ))}
        </div>
      </div>

      {/* Costumes */}
      <div>
        <SectionHeader title="과목별 변신 시스템" color={ORANGE}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {COSTUMES.map(({ key, label, icon }) => (
            <CharCard key={key} label={`${icon} ${label}`} bg="#FFFAF5">
              <TonyFront expression="happy" costume={key}/>
            </CharCard>
          ))}
        </div>
      </div>
    </div>
  );
}
