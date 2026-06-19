import React from "react";

type Expression = "smile" | "happy" | "surprised" | "explaining" | "encouraging";
type Costume = "default" | "science" | "social" | "math" | "korean" | "english";

/* ─── PALETTE ────────────────────────────────────────────── */
const TEAL      = "#3BAAA0";   // 민트 청록 (메인)
const TEAL_DARK = "#2D8880";
const TEAL_LIGHT= "#6CCFC7";
const CORAL     = "#FF7F6B";   // 코랄 포인트
const CREAM     = "#FFF4DC";
const PANTS     = "#6A5440";   // 따뜻한 브라운 바지
const DARK      = "#1E2440";
const SKIN      = "#FFDCB8";
const SKIN_DARK = "#FFB899";
const HAIR      = "#3D2010";   // 다크 웜브라운
const HAIR_SH   = "#5A3818";
const GLASS     = "#9A7040";   // 금테 안경
const EYE_COL   = "#7A4E2C";   // 따뜻한 브라운 눈

/* ─── ROUND GLASSES ──────────────────────────────────────── */
function HanaGlasses() {
  return (
    <>
      {/* left lens */}
      <circle cx="42" cy="61" r="12" fill="rgba(240,252,250,0.18)" stroke={GLASS} strokeWidth="2.5"/>
      {/* right lens */}
      <circle cx="78" cy="61" r="12" fill="rgba(240,252,250,0.18)" stroke={GLASS} strokeWidth="2.5"/>
      {/* bridge */}
      <path d="M 54 61 L 66 61" stroke={GLASS} strokeWidth="2.5" strokeLinecap="round"/>
      {/* temples */}
      <path d="M 30 60 L 25 62" stroke={GLASS} strokeWidth="2" strokeLinecap="round"/>
      <path d="M 90 60 L 95 62" stroke={GLASS} strokeWidth="2" strokeLinecap="round"/>
    </>
  );
}

/* ─── EXPRESSIONS ────────────────────────────────────────── */
function HanaFace({ expression }: { expression: Expression }) {

  if (expression === "smile") return (
    <>
      {/* Warm gentle eyes — moderate size, not over-sparkled */}
      <ellipse cx="42" cy="61" rx="7.5" ry="8" fill={DARK}/>
      <ellipse cx="42" cy="60" rx="5"   ry="5.5" fill={EYE_COL}/>
      <ellipse cx="39" cy="56" rx="2.2" ry="2.2" fill="white" opacity="0.88"/>
      <ellipse cx="78" cy="61" rx="7.5" ry="8" fill={DARK}/>
      <ellipse cx="78" cy="60" rx="5"   ry="5.5" fill={EYE_COL}/>
      <ellipse cx="75" cy="56" rx="2.2" ry="2.2" fill="white" opacity="0.88"/>
      {/* gentle closed-lip smile */}
      <path d="M 50 77 Q 60 86 70 77" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </>
  );

  if (expression === "happy") return (
    <>
      {/* Squinted warm happy eyes (mature crinkle, not anime arcs) */}
      <ellipse cx="42" cy="62" rx="8" ry="6" fill={DARK}/>
      <ellipse cx="42" cy="62" rx="5.5" ry="4" fill={EYE_COL}/>
      <ellipse cx="39" cy="59" rx="2"  ry="1.5" fill="white" opacity="0.85"/>
      {/* smile lines at eye corners */}
      <path d="M 32 58 Q 33 62 35 60" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 52 58 Q 51 62 49 60" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="78" cy="62" rx="8" ry="6" fill={DARK}/>
      <ellipse cx="78" cy="62" rx="5.5" ry="4" fill={EYE_COL}/>
      <ellipse cx="75" cy="59" rx="2"  ry="1.5" fill="white" opacity="0.85"/>
      <path d="M 68 58 Q 69 62 71 60" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 88 58 Q 87 62 85 60" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* warm open smile */}
      <path d="M 47 75 Q 60 89 73 75" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 47 75 Q 60 89 73 75 Q 71 84 60 86 Q 49 84 47 75 Z" fill="#FF9E7A" opacity="0.32"/>
    </>
  );

  if (expression === "surprised") return (
    <>
      <ellipse cx="42" cy="61" rx="9" ry="10" fill={DARK}/>
      <ellipse cx="42" cy="60" rx="6.5" ry="7" fill={EYE_COL}/>
      <ellipse cx="38" cy="55" rx="3" ry="3" fill="white" opacity="0.9"/>
      <ellipse cx="78" cy="61" rx="9" ry="10" fill={DARK}/>
      <ellipse cx="78" cy="60" rx="6.5" ry="7" fill={EYE_COL}/>
      <ellipse cx="74" cy="55" rx="3" ry="3" fill="white" opacity="0.9"/>
      {/* raised brows */}
      <path d="M 32 49 Q 42 45 52 49" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 68 49 Q 78 45 88 49" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* O mouth */}
      <ellipse cx="60" cy="80" rx="7.5" ry="8" fill={DARK}/>
      <ellipse cx="60" cy="80" rx="5"  ry="5.5" fill="#FF9E7A"/>
    </>
  );

  if (expression === "explaining") return (
    <>
      {/* Focused, earnest eyes — level gaze */}
      <ellipse cx="42" cy="61" rx="7.5" ry="7" fill={DARK}/>
      <ellipse cx="42" cy="61" rx="5"  ry="5" fill={EYE_COL}/>
      <ellipse cx="39" cy="57" rx="2.2" ry="2" fill="white" opacity="0.85"/>
      {/* slight focused brow */}
      <path d="M 32 50 Q 42 47 52 50" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="78" cy="61" rx="7.5" ry="7" fill={DARK}/>
      <ellipse cx="78" cy="61" rx="5"  ry="5" fill={EYE_COL}/>
      <ellipse cx="75" cy="57" rx="2.2" ry="2" fill="white" opacity="0.85"/>
      <path d="M 68 50 Q 78 47 88 50" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* calm straight mouth, slight upturn */}
      <path d="M 51 77 Q 60 82 69 77" stroke={DARK} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </>
  );

  /* encouraging */
  return (
    <>
      <ellipse cx="42" cy="61" rx="7.5" ry="8.5" fill={DARK}/>
      <ellipse cx="42" cy="60" rx="5.5" ry="6" fill={EYE_COL}/>
      <ellipse cx="38" cy="55" rx="2.8" ry="2.8" fill="white" opacity="0.92"/>
      <circle  cx="44" cy="61" r="1.2" fill="white" opacity="0.55"/>
      <ellipse cx="78" cy="61" rx="7.5" ry="8.5" fill={DARK}/>
      <ellipse cx="78" cy="60" rx="5.5" ry="6" fill={EYE_COL}/>
      <ellipse cx="74" cy="55" rx="2.8" ry="2.8" fill="white" opacity="0.92"/>
      <circle  cx="80" cy="61" r="1.2" fill="white" opacity="0.55"/>
      {/* warm sparkle in eye */}
      <text x="37" y="65" fontSize="6" fill="white" opacity="0.65">✦</text>
      <text x="73" y="65" fontSize="6" fill="white" opacity="0.65">✦</text>
      {/* big cheerful encouraging smile */}
      <path d="M 46 75 Q 60 91 74 75" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 46 75 Q 60 91 74 75 Q 72 85 60 87 Q 48 85 46 75 Z" fill="#FF9E7A" opacity="0.3"/>
    </>
  );
}

/* ─── COSTUME BODY ELEMENTS ──────────────────────────────── */
function HanaCostumeBody({ costume }: { costume: Costume }) {

  if (costume === "science") return (
    <>
      {/* white coat lapels */}
      <path d="M 46 98 L 40 120 L 58 112" fill="#EEEEEE" stroke="#CCC" strokeWidth="1.5"/>
      <path d="M 74 98 L 80 120 L 62 112" fill="#EEEEEE" stroke="#CCC" strokeWidth="1.5"/>
      {/* clipboard in right hand area */}
      <rect x="86" y="112" width="18" height="26" rx="2" fill="#F0EEE8" stroke={DARK} strokeWidth="1.5"/>
      <rect x="88" y="114" width="14" height="22" rx="1" fill="white"/>
      <rect x="92" y="112" width="6" height="5" rx="2.5" fill="#888" stroke={DARK} strokeWidth="1"/>
      <line x1="90" y1="118" x2="100" y2="118" stroke={DARK} strokeWidth="1"/>
      <line x1="90" y1="122" x2="100" y2="122" stroke={DARK} strokeWidth="1"/>
      <line x1="90" y1="126" x2="100" y2="126" stroke={DARK} strokeWidth="1"/>
      <line x1="90" y1="130" x2="96" y2="130" stroke={DARK} strokeWidth="1"/>
      {/* test tube in pocket */}
      <rect x="63" y="99" width="5" height="14" rx="2.5" fill="#B3EEFF" stroke={DARK} strokeWidth="1"/>
    </>
  );

  if (costume === "social") return (
    <>
      {/* vest pockets */}
      <rect x="37" y="106" width="12" height="10" rx="2" fill="#8B7240" stroke={DARK} strokeWidth="1.5"/>
      <rect x="71" y="106" width="12" height="10" rx="2" fill="#8B7240" stroke={DARK} strokeWidth="1.5"/>
      <line x1="38" y1="111" x2="48" y2="111" stroke={DARK} strokeWidth="1"/>
      <line x1="72" y1="111" x2="82" y2="111" stroke={DARK} strokeWidth="1"/>
      {/* rolled map in right hand */}
      <rect x="86" y="114" width="22" height="16" rx="3" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 88 117 L 106 117 M 88 120 L 106 120 M 88 123 L 100 123" stroke="#8B6914" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="86" cy="122" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="108" cy="122" r="3.5" fill="#E8D5A0" stroke={DARK} strokeWidth="1.5"/>
      {/* compass badge on chest */}
      <circle cx="52" cy="110" r="7" fill="#DDD" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="52" cy="110" r="5" fill="#EEE"/>
      <line x1="52" y1="105" x2="52" y2="109" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round"/>
      <line x1="52" y1="111" x2="52" y2="115" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="52" cy="110" r="1.5" fill={DARK}/>
    </>
  );

  if (costume === "math") return (
    <>
      {/* equation badge */}
      <circle cx="52" cy="110" r="8" fill={TEAL} stroke={DARK} strokeWidth="1.5"/>
      <text x="52" y="114" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">∑</text>
      {/* pointer in right hand */}
      <rect x="91" y="105" width="5" height="30" rx="2.5" fill="#4A2C0E" stroke={DARK} strokeWidth="1.5" transform="rotate(8 93 120)"/>
      <circle cx="91" cy="106" r="3.5" fill={CORAL} stroke={DARK} strokeWidth="1"/>
      {/* mini chalkboard idea */}
      <rect x="10" y="114" width="18" height="20" rx="2" fill="#3A4A3A" stroke={DARK} strokeWidth="1.5"/>
      <text x="19" y="122" textAnchor="middle" fill="white" fontSize="5">y=mx+b</text>
      <text x="19" y="129" textAnchor="middle" fill={TEAL_LIGHT} fontSize="5">a²+b²=c²</text>
    </>
  );

  if (costume === "korean") return (
    <>
      {/* literary ribbon collar */}
      <path d="M 48 98 Q 52 93 60 96 Q 68 93 72 98 Q 68 103 60 101 Q 52 103 48 98 Z" fill="#C4A062" stroke={DARK} strokeWidth="1.5"/>
      <circle cx="60" cy="98" r="3" fill={TEAL} stroke={DARK} strokeWidth="1"/>
      {/* open book */}
      <rect x="10" y="112" width="20" height="24" rx="2" fill="#C4A062" stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="114" width="16" height="20" rx="1" fill="#FFF4DC"/>
      <line x1="14" y1="117" x2="26" y2="117" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="121" x2="26" y2="121" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="125" x2="26" y2="125" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="129" x2="22" y2="129" stroke={DARK} strokeWidth="1"/>
      {/* calligraphy pen */}
      <rect x="91" y="108" width="5" height="26" rx="2.5" fill="#4A2C0E" stroke={DARK} strokeWidth="1.5" transform="rotate(-15 93 121)"/>
      <polygon points="88,130 93,138 97,129" fill="#C4A062" transform="rotate(-15 93 134)"/>
    </>
  );

  if (costume === "english") return (
    <>
      {/* travel scarf */}
      <path d="M 46 97 Q 52 107 58 101 Q 62 109 68 102 Q 74 108 78 97" stroke="#4ABCD4" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* globe in right hand */}
      <circle cx="94" cy="128" r="13" fill="#7B9FF5" stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="94" cy="128" rx="13" ry="8" fill="none" stroke={DARK} strokeWidth="1"/>
      <line x1="94" y1="115" x2="94" y2="141" stroke={DARK} strokeWidth="1"/>
      <ellipse cx="88" cy="124" rx="4" ry="3" fill="#7CBA78" opacity="0.85"/>
      <ellipse cx="100" cy="133" rx="3.5" ry="2.5" fill="#7CBA78" opacity="0.85"/>
      {/* english book left */}
      <rect x="10" y="114" width="18" height="22" rx="2" fill="#4ABCD4" stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="116" width="14" height="18" rx="1" fill="white"/>
      <text x="19" y="127" textAnchor="middle" fill={TEAL} fontSize="6" fontWeight="bold">ABC</text>
    </>
  );

  /* default */
  return (
    <>
      {/* teal headband is already on hair - add chest badge */}
      <circle cx="52" cy="112" r="6.5" fill={CREAM} stroke={DARK} strokeWidth="1.5"/>
      <text x="49.5" y="116" fontSize="8" fill={CORAL}>★</text>
      {/* book at left arm */}
      <rect x="10" y="112" width="16" height="24" rx="2" fill={CORAL} stroke={DARK} strokeWidth="1.5"/>
      <rect x="12" y="114" width="12" height="20" rx="1" fill={CREAM}/>
      <line x1="14" y1="117" x2="22" y2="117" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="121" x2="22" y2="121" stroke={DARK} strokeWidth="1"/>
      <line x1="14" y1="125" x2="22" y2="125" stroke={DARK} strokeWidth="1"/>
    </>
  );
}

/* ─── FRONT VIEW ─────────────────────────────────────────── */
export function HanaFront({ expression = "smile", costume = "default" }: { expression?: Expression; costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: TEAL, science: "#F2F2F2", social: "#9C8240",
    math: "#5A8EC4", korean: "#C4A062", english: "#4ABCD4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>

      {/* ── BOB HAIR (short wavy, ends at jaw — very different from Ria's long flowing hair) ── */}
      {/* top dome */}
      <path d="M 28 63 Q 26 38 36 22 Q 46 9 60 9 Q 74 9 84 22 Q 94 38 92 63 Q 86 44 78 39 Q 68 32 60 33 Q 52 32 42 39 Q 34 44 28 63 Z"
        fill={HAIR} stroke="#1A0808" strokeWidth="1.2"/>
      {/* hair shine */}
      <path d="M 44 15 Q 60 9 76 15 Q 65 12 60 13 Q 55 12 44 15" fill={HAIR_SH} opacity="0.5"/>
      {/* left bob side — SHORT, ends at jaw ~y82 */}
      <path d="M 28 63 Q 23 71 24 80 Q 28 78 32 72 Q 28 67 28 63 Z" fill={HAIR}/>
      {/* right bob side */}
      <path d="M 92 63 Q 97 71 96 80 Q 92 78 88 72 Q 92 67 92 63 Z" fill={HAIR}/>
      {/* bob ends curling inward */}
      <path d="M 24 80 Q 26 86 32 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M 96 80 Q 94 86 88 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>

      {/* TEAL HEADBAND — signature teacher accessory (distinct from Ria's star pin) */}
      <path d="M 34 38 Q 60 29 86 38" stroke={TEAL} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M 34 38 Q 60 29 86 38" stroke={TEAL_LIGHT} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* ── HEAD (slightly rounder than Ria: r=33) ── */}
      <circle cx="60" cy="63" r="33" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* ── EARS ── */}
      <ellipse cx="27" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="28" cy="64" rx="3"   ry="4.5" fill={SKIN_DARK}/>
      <ellipse cx="93" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="92" cy="64" rx="3"   ry="4.5" fill={SKIN_DARK}/>

      {/* ── EYEBROWS ── */}
      <path d="M 32 50 Q 42 47 52 50" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 68 50 Q 78 47 88 50" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* ── ROUND GLASSES ── */}
      <HanaGlasses/>

      {/* ── FACE EXPRESSION ── */}
      <HanaFace expression={expression}/>

      {/* ── NOSE ── */}
      <ellipse cx="60" cy="73" rx="3" ry="2.2" fill="#E8A882"/>

      {/* ── BLUSH (warm peach, not pink — less girlish than Ria) ── */}
      <ellipse cx="27" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>
      <ellipse cx="93" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>

      {/* ── NECK ── */}
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* ── BODY (teal cardigan) ── */}
      <rect x="32" y="98" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      {/* white undershirt collar */}
      <path d="M 46 98 L 52 106 L 60 102 L 68 106 L 74 98" fill="white" stroke={DARK} strokeWidth="1.5"/>
      {/* cardigan lapels */}
      {costume === "default" && (
        <>
          <path d="M 47 98 L 43 120 L 58 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
          <path d="M 73 98 L 77 120 L 62 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
        </>
      )}

      {/* ── COSTUME ELEMENTS ── */}
      <HanaCostumeBody costume={costume}/>

      {/* ── ARMS ── */}
      <rect x="15" y="100" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <path d="M 18 139 Q 24 134 30 139" stroke={DARK} strokeWidth="1" fill="none"/>

      <rect x="87" y="100" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="96" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* ── PANTS (not a skirt — clearly different from Ria) ── */}
      <rect x="34" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      {/* belt line */}
      <rect x="32" y="144" width="56" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>

      {/* ── SHOES ── */}
      <ellipse cx="45" cy="174" rx="16" ry="7"   fill="#4A3020"/>
      <ellipse cx="41" cy="171" rx="5.5" ry="2.5" fill="#7A5838" opacity="0.45"/>
      <ellipse cx="75" cy="174" rx="16" ry="7"   fill="#4A3020"/>
      <ellipse cx="71" cy="171" rx="5.5" ry="2.5" fill="#7A5838" opacity="0.45"/>
    </svg>
  );
}

/* ─── SIDE VIEW ─────────────────────────────────────────── */
function HanaSide({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: TEAL, science: "#F2F2F2", social: "#9C8240",
    math: "#5A8EC4", korean: "#C4A062", english: "#4ABCD4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 100 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair side */}
      <path d="M 22 64 Q 20 38 30 22 Q 40 9 52 9 Q 66 9 74 20 Q 84 34 82 62 Q 76 44 68 38 Q 58 30 52 31 Q 42 30 34 40 Q 26 46 22 64 Z" fill={HAIR}/>
      {/* Short bob left side (short curl visible from side) */}
      <path d="M 22 64 Q 18 72 20 80 Q 24 78 28 72 Q 24 68 22 64 Z" fill={HAIR}/>
      <path d="M 20 80 Q 22 86 28 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Headband visible from side */}
      <path d="M 30 38 Q 52 29 70 36" stroke={TEAL} strokeWidth="5" fill="none" strokeLinecap="round"/>

      {/* Head */}
      <circle cx="50" cy="63" r="31" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>

      {/* Right ear */}
      <ellipse cx="81" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="80" cy="64" rx="3" ry="4.5" fill={SKIN_DARK}/>

      {/* Eyebrow side */}
      <path d="M 24 50 Q 34 47 44 50" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Glasses side (single round lens) */}
      <circle cx="32" cy="61" r="11" fill="rgba(240,252,250,0.18)" stroke={GLASS} strokeWidth="2.5"/>
      {/* temple to ear */}
      <path d="M 43 61 L 81 62" stroke={GLASS} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>

      {/* Eye inside glasses */}
      <ellipse cx="32" cy="61" rx="7" ry="7.5" fill={DARK}/>
      <ellipse cx="33" cy="60" rx="4.5" ry="5" fill={EYE_COL}/>
      <ellipse cx="30" cy="56" rx="2.2" ry="2.2" fill="white" opacity="0.88"/>

      {/* Nose profile */}
      <path d="M 20 72 Q 16 76 20 80" stroke={DARK} strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Smile */}
      <path d="M 22 84 Q 30 92 36 84" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Blush */}
      <ellipse cx="22" cy="78" rx="7" ry="5" fill="#FFAB8A" opacity="0.28"/>

      {/* Neck */}
      <rect x="40" y="92" width="16" height="10" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body */}
      <rect x="26" y="98" width="50" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <path d="M 36 98 L 42 106 L 51 102 L 60 106 L 66 98" fill="white" stroke={DARK} strokeWidth="1.5"/>

      {/* Book side visible */}
      {costume === "default" && (
        <>
          <rect x="72" y="102" width="12" height="20" rx="2" fill={CORAL} stroke={DARK} strokeWidth="1.5"/>
          <rect x="74" y="104" width="8" height="16" rx="1" fill={CREAM}/>
        </>
      )}

      {/* Arm */}
      <rect x="10" y="100" width="17" height="36" rx="8.5" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="18" cy="139" r="8.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Pants side */}
      <rect x="28" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2"/>
      <rect x="52" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2"/>
      <rect x="26" y="144" width="50" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>

      {/* Shoes */}
      <ellipse cx="39" cy="174" rx="17" ry="7" fill="#4A3020"/>
      <ellipse cx="63" cy="174" rx="15" ry="7" fill="#4A3020"/>
    </svg>
  );
}

/* ─── BACK VIEW ─────────────────────────────────────────── */
function HanaBack({ costume = "default" }: { costume?: Costume }) {
  const shirts: Record<Costume, string> = {
    default: TEAL, science: "#F2F2F2", social: "#9C8240",
    math: "#5A8EC4", korean: "#C4A062", english: "#4ABCD4",
  };
  const shirt = shirts[costume];

  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Hair back */}
      <path d="M 28 63 Q 26 38 36 22 Q 46 9 60 9 Q 74 9 84 22 Q 94 38 92 63 Q 86 44 78 39 Q 68 32 60 33 Q 52 32 42 39 Q 34 44 28 63 Z" fill={HAIR}/>
      <path d="M 44 15 Q 60 9 76 15 Q 65 12 60 13 Q 55 12 44 15" fill={HAIR_SH} opacity="0.5"/>
      {/* Short bob sides */}
      <path d="M 28 63 Q 23 71 24 80 Q 28 78 32 72 Q 28 67 28 63 Z" fill={HAIR}/>
      <path d="M 92 63 Q 97 71 96 80 Q 92 78 88 72 Q 92 67 92 63 Z" fill={HAIR}/>
      <path d="M 24 80 Q 26 86 32 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M 96 80 Q 94 86 88 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>

      {/* Headband back */}
      <path d="M 34 38 Q 60 29 86 38" stroke={TEAL} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M 34 38 Q 60 29 86 38" stroke={TEAL_LIGHT} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* Head back */}
      <circle cx="60" cy="63" r="33" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
      <ellipse cx="27" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="93" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Glasses temples visible from back */}
      <path d="M 24 61 L 32 59" stroke={GLASS} strokeWidth="2" strokeLinecap="round"/>
      <path d="M 96 61 L 88 59" stroke={GLASS} strokeWidth="2" strokeLinecap="round"/>

      {/* Neck */}
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>

      {/* Body back */}
      <rect x="32" y="98" width="56" height="50" rx="12" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      {costume === "default" && (
        <>
          <path d="M 47 98 L 43 120 L 58 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.7"/>
          <path d="M 73 98 L 77 120 L 62 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.7"/>
        </>
      )}

      {/* Arms */}
      <rect x="15" y="100" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <rect x="87" y="100" width="18" height="38" rx="9" fill={shirt} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="96" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>

      {/* Pants back */}
      <rect x="34" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="32" y="144" width="56" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>

      {/* Shoes back */}
      <ellipse cx="45" cy="174" rx="16" ry="7" fill="#4A3020"/>
      <ellipse cx="75" cy="174" rx="16" ry="7" fill="#4A3020"/>
    </svg>
  );
}

/* ─── REUSABLE HEAD BLOCK ────────────────────────────────── */
function HanaHeadBlock({ expression }: { expression: Expression }) {
  return (
    <>
      <path d="M 28 63 Q 26 38 36 22 Q 46 9 60 9 Q 74 9 84 22 Q 94 38 92 63 Q 86 44 78 39 Q 68 32 60 33 Q 52 32 42 39 Q 34 44 28 63 Z" fill={HAIR} stroke="#1A0808" strokeWidth="1.2"/>
      <path d="M 28 63 Q 23 71 24 80 Q 28 78 32 72 Q 28 67 28 63 Z" fill={HAIR}/>
      <path d="M 92 63 Q 97 71 96 80 Q 92 78 88 72 Q 92 67 92 63 Z" fill={HAIR}/>
      <path d="M 24 80 Q 26 86 32 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M 96 80 Q 94 86 88 84" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M 34 38 Q 60 29 86 38" stroke={TEAL} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="60" cy="63" r="33" fill={SKIN} stroke={DARK} strokeWidth="2.5"/>
      <ellipse cx="27" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="28" cy="64" rx="3" ry="4.5" fill={SKIN_DARK}/>
      <ellipse cx="93" cy="63" rx="5.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <ellipse cx="92" cy="64" rx="3" ry="4.5" fill={SKIN_DARK}/>
      <path d="M 32 50 Q 42 47 52 50" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 68 50 Q 78 47 88 50" stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <HanaGlasses/>
      <HanaFace expression={expression}/>
      <ellipse cx="60" cy="73" rx="3" ry="2.2" fill="#E8A882"/>
      <ellipse cx="27" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>
      <ellipse cx="93" cy="77" rx="9" ry="6" fill="#FFAB8A" opacity="0.28"/>
    </>
  );
}

/* ─── POSES ─────────────────────────────────────────────── */
function HanaPose({ pose }: { pose: "explaining" | "waving" | "pointing" }) {

  if (pose === "waving") return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <HanaHeadBlock expression="happy"/>
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
      <rect x="32" y="98" width="56" height="50" rx="12" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <path d="M 46 98 L 52 106 L 60 102 L 68 106 L 74 98" fill="white" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 47 98 L 43 120 L 58 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <path d="M 73 98 L 77 120 L 62 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <circle cx="52" cy="112" r="6.5" fill={CREAM} stroke={DARK} strokeWidth="1.5"/>
      <text x="49.5" y="116" fontSize="8" fill={CORAL}>★</text>
      {/* left arm normal */}
      <rect x="15" y="100" width="18" height="38" rx="9" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* right arm raised — waving! */}
      <rect x="92" y="72" width="18" height="38" rx="9" fill={TEAL} stroke={DARK} strokeWidth="2.5" transform="rotate(-48 101 74)"/>
      <circle cx="116" cy="88" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* wave sparkles */}
      <path d="M 110 78 Q 114 72 118 78 Q 122 72 126 78" stroke={CORAL} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <text x="102" y="56" fontSize="14" fill={TEAL_LIGHT}>✦</text>
      <text x="112" y="46" fontSize="10" fill={CORAL}>✦</text>
      <rect x="34" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="32" y="144" width="56" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="45" cy="174" rx="16" ry="7" fill="#4A3020"/>
      <ellipse cx="75" cy="174" rx="16" ry="7" fill="#4A3020"/>
    </svg>
  );

  if (pose === "pointing") return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <HanaHeadBlock expression="smile"/>
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
      <rect x="32" y="98" width="56" height="50" rx="12" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <path d="M 46 98 L 52 106 L 60 102 L 68 106 L 74 98" fill="white" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 47 98 L 43 120 L 58 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <path d="M 73 98 L 77 120 L 62 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <circle cx="52" cy="112" r="6.5" fill={CREAM} stroke={DARK} strokeWidth="1.5"/>
      <text x="49.5" y="116" fontSize="8" fill={CORAL}>★</text>
      {/* left arm holds book */}
      <rect x="15" y="100" width="18" height="38" rx="9" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <rect x="8" y="112" width="16" height="22" rx="2" fill={CORAL} stroke={DARK} strokeWidth="1.5"/>
      <rect x="10" y="114" width="12" height="18" rx="1" fill={CREAM}/>
      <line x1="12" y1="117" x2="20" y2="117" stroke={DARK} strokeWidth="1"/>
      <line x1="12" y1="121" x2="20" y2="121" stroke={DARK} strokeWidth="1"/>
      {/* right arm extended pointing right */}
      <rect x="87" y="108" width="33" height="16" rx="8" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="120" cy="116" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* extended index finger */}
      <ellipse cx="120" cy="107" rx="4.5" ry="7" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* star at tip */}
      <circle cx="120" cy="100" r="4" fill={CORAL} stroke="#CC4433" strokeWidth="1.5"/>
      <text x="117" y="104" fontSize="5" fill="white">★</text>
      {/* directional dashes */}
      <line x1="6" y1="116" x2="0" y2="116" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2"/>
      <rect x="34" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="32" y="144" width="56" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="45" cy="174" rx="16" ry="7" fill="#4A3020"/>
      <ellipse cx="75" cy="174" rx="16" ry="7" fill="#4A3020"/>
    </svg>
  );

  /* explaining — index finger raised */
  return (
    <svg viewBox="0 0 120 178" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <HanaHeadBlock expression="explaining"/>
      <rect x="50" y="94" width="20" height="11" rx="5" fill={SKIN} stroke={DARK} strokeWidth="1.5"/>
      <rect x="32" y="98" width="56" height="50" rx="12" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <path d="M 46 98 L 52 106 L 60 102 L 68 106 L 74 98" fill="white" stroke={DARK} strokeWidth="1.5"/>
      <path d="M 47 98 L 43 120 L 58 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <path d="M 73 98 L 77 120 L 62 112" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5" opacity="0.8"/>
      <circle cx="52" cy="112" r="6.5" fill={CREAM} stroke={DARK} strokeWidth="1.5"/>
      <text x="49.5" y="116" fontSize="8" fill={CORAL}>★</text>
      {/* left arm: book */}
      <rect x="15" y="100" width="18" height="38" rx="9" fill={TEAL} stroke={DARK} strokeWidth="2.5"/>
      <circle cx="24" cy="141" r="9" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      <rect x="8" y="110" width="18" height="24" rx="2" fill={CORAL} stroke={DARK} strokeWidth="1.5"/>
      <rect x="10" y="112" width="14" height="20" rx="1" fill={CREAM}/>
      <line x1="12" y1="115" x2="22" y2="115" stroke={DARK} strokeWidth="1"/>
      <line x1="12" y1="119" x2="22" y2="119" stroke={DARK} strokeWidth="1"/>
      <line x1="12" y1="123" x2="22" y2="123" stroke={DARK} strokeWidth="1"/>
      {/* right arm: index finger raised */}
      <rect x="90" y="80" width="17" height="32" rx="8.5" fill={TEAL} stroke={DARK} strokeWidth="2.5" transform="rotate(-32 98 80)"/>
      <circle cx="104" cy="72" r="8" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* raised index finger */}
      <ellipse cx="104" cy="62" rx="4.5" ry="7.5" fill={SKIN} stroke={DARK} strokeWidth="2"/>
      {/* coral glow at fingertip */}
      <circle cx="104" cy="54" r="4.5" fill={CORAL} stroke="#CC4433" strokeWidth="1.5"/>
      <text x="101.5" y="58" fontSize="5.5" fill="white">💡</text>
      {/* radiating lines */}
      <line x1="111" y1="49" x2="115" y2="45" stroke={CORAL} strokeWidth="2" strokeLinecap="round"/>
      <line x1="113" y1="55" x2="118" y2="53" stroke={CORAL} strokeWidth="2" strokeLinecap="round"/>
      <line x1="110" y1="45" x2="110" y2="41" stroke={CORAL} strokeWidth="2" strokeLinecap="round"/>
      <rect x="34" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="64" y="146" width="22" height="26" rx="7" fill={PANTS} stroke={DARK} strokeWidth="2.5"/>
      <rect x="32" y="144" width="56" height="6" rx="3" fill={TEAL_DARK} stroke={DARK} strokeWidth="1.5"/>
      <ellipse cx="45" cy="174" rx="16" ry="7" fill="#4A3020"/>
      <ellipse cx="75" cy="174" rx="16" ry="7" fill="#4A3020"/>
    </svg>
  );
}

/* ─── DATA ARRAYS ────────────────────────────────────────── */
const EXPRESSIONS: Array<{ key: Expression; label: string; emoji: string }> = [
  { key: "smile",       label: "기본 미소", emoji: "🙂" },
  { key: "happy",       label: "기쁨",     emoji: "😄" },
  { key: "surprised",   label: "놀람",     emoji: "😲" },
  { key: "explaining",  label: "설명 중",  emoji: "🧐" },
  { key: "encouraging", label: "격려",     emoji: "💪" },
];

const COSTUMES: Array<{ key: Costume; label: string; icon: string }> = [
  { key: "science", label: "과학", icon: "🔬" },
  { key: "social",  label: "사회", icon: "🗺️" },
  { key: "math",    label: "수학", icon: "🔢" },
  { key: "korean",  label: "국어", icon: "📝" },
  { key: "english", label: "영어", icon: "🌍" },
];

const POSES: Array<{ key: "explaining" | "waving" | "pointing"; label: string }> = [
  { key: "explaining", label: "설명 포즈" },
  { key: "waving",     label: "인사 포즈" },
  { key: "pointing",   label: "가리키기 포즈" },
];

/* ─── LAYOUT HELPERS ─────────────────────────────────────── */
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

/* ─── SHEET EXPORT ───────────────────────────────────────── */
export function HanaSheet() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Profile Header */}
      <div style={{
        background: "linear-gradient(135deg, #E6F8F6 0%, #FFF4E8 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        border: `3px solid ${TEAL}`,
        display: "flex",
        gap: "32px",
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: "20px", top: "10px", fontSize: "80px", opacity: 0.06, fontWeight: "900" }}>HANA</div>

        <div style={{ width: "130px", flexShrink: 0 }}>
          <HanaFront expression="smile" costume="default"/>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "38px", fontWeight: "900", color: TEAL, letterSpacing: "-1px" }}>하나</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: TEAL_DARK, letterSpacing: "3px" }}>HANA</span>
          </div>
          <div style={{ display: "inline-block", background: TEAL, color: "white", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", fontWeight: "800", marginBottom: "6px" }}>
            🌟 학습 안내자 · 선생님 캐릭터
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px", fontWeight: "600" }}>
            아이들과 함께 배우고 차근차근 설명해 주는 따뜻한 선생님
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>성격</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {["친절함", "차분함", "설명을 잘함", "배려심", "격려함", "따뜻함"].map(t => (
                  <span key={t} style={{ background: "#E6F8F6", border: `1.5px solid ${TEAL}`, borderRadius: "8px", padding: "2px 8px", fontSize: "10px", color: TEAL_DARK, fontWeight: "700" }}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" }}>상징</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["📚 책", "✏️ 연필", "💬 말풍선", "✔️ 체크", "☀️ 햇살"].map(t => (
                  <span key={t} style={{ fontSize: "12px" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10px", color: "#888", fontWeight: "700", letterSpacing: "1px", marginBottom: "6px" }}>대표 컬러</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[["#3BAAA0", "민트청록"], ["#FF7F6B", "코랄"], ["#FFF4DC", "크림"], ["#6A5440", "웜브라운"]].map(([c, n]) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: c, border: "2px solid rgba(0,0,0,0.15)" }}/>
                  <span style={{ fontSize: "9px", color: "#666", fontWeight: "700" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Design Differentiator Note */}
      <div style={{ background: "#F8F8F0", borderRadius: "12px", padding: "14px 20px", border: "1px solid #E0DDD0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {[
          { label: "실루엣", value: "단발 웨이브 — 긴 머리 리아와 확연히 다름" },
          { label: "상징 소품", value: "청록 헤어밴드 + 둥근 금테 안경" },
          { label: "컬러 계열", value: "민트/청록/코랄 (리아의 하늘/보라와 완전 분리)" },
          { label: "의상 포인트", value: "바지 착용 — 치마 리아와 구분" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: TEAL, whiteSpace: "nowrap" }}>{label}</span>
            <span style={{ fontSize: "10px", color: "#666" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* 3 Views */}
      <div>
        <SectionHeader title="캐릭터 3면도" color={TEAL}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <CharCard label="정면" sublabel="Front View"><HanaFront expression="smile" costume="default"/></CharCard>
          <CharCard label="측면" sublabel="Side View"><HanaSide costume="default"/></CharCard>
          <CharCard label="후면" sublabel="Back View"><HanaBack costume="default"/></CharCard>
        </div>
      </div>

      {/* Expressions */}
      <div>
        <SectionHeader title="기본 표정 5종" color={TEAL}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {EXPRESSIONS.map(({ key, label, emoji }) => (
            <CharCard key={key} label={`${emoji} ${label}`} bg="#F2FAFA">
              <HanaFront expression={key} costume="default"/>
            </CharCard>
          ))}
        </div>
      </div>

      {/* Poses */}
      <div>
        <SectionHeader title="대표 포즈 3종" color={TEAL}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {POSES.map(({ key, label }) => (
            <CharCard key={key} label={label} bg="#F0FAF8">
              <HanaPose pose={key}/>
            </CharCard>
          ))}
        </div>
      </div>

      {/* Costumes */}
      <div>
        <SectionHeader title="과목별 변신 시스템" color={TEAL}/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
          {COSTUMES.map(({ key, label, icon }) => (
            <CharCard key={key} label={`${icon} ${label}`} bg="#F2FAFA">
              <HanaFront expression="smile" costume={key}/>
            </CharCard>
          ))}
        </div>
      </div>

    </div>
  );
}
