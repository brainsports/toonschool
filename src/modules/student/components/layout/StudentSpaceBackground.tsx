export default function StudentSpaceBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none !z-0 select-none">
      {/* 기본 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]" />

      {/* 성운 효과 (흐릿한 블러) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/20 blur-[100px]" />
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[40%] rounded-full bg-violet-800/10 blur-[80px]" />

      {/* SVG 별/점 패턴 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 별 패턴 */}
        <g fill="rgba(255,255,255,0.6)">
          <circle cx="50"  cy="80"  r="1.2" />
          <circle cx="180" cy="40"  r="1.5" />
          <circle cx="320" cy="120" r="1"   />
          <circle cx="460" cy="60"  r="1.5" />
          <circle cx="600" cy="100" r="1.2" />
          <circle cx="740" cy="50"  r="1"   />
          <circle cx="900" cy="80"  r="1.5" />
          <circle cx="1060" cy="30" r="1.2" />
          <circle cx="1150" cy="110" r="1"  />
        </g>
        <g fill="rgba(255,255,255,0.4)">
          <circle cx="100" cy="200" r="1"   />
          <circle cx="250" cy="280" r="1.5" />
          <circle cx="400" cy="220" r="1"   />
          <circle cx="550" cy="300" r="1.5" />
          <circle cx="700" cy="240" r="1.2" />
          <circle cx="850" cy="280" r="1"   />
          <circle cx="1000" cy="200" r="1.5"/>
          <circle cx="1150" cy="260" r="1"  />
        </g>
        <g fill="rgba(255,255,255,0.25)">
          <circle cx="80"  cy="400" r="1"   />
          <circle cx="220" cy="450" r="1.2" />
          <circle cx="370" cy="380" r="1"   />
          <circle cx="510" cy="460" r="1.5" />
          <circle cx="660" cy="410" r="1"   />
          <circle cx="810" cy="470" r="1.2" />
          <circle cx="960" cy="390" r="1"   />
          <circle cx="1110" cy="440" r="1.5"/>
        </g>
        <g fill="rgba(255,255,255,0.2)">
          <circle cx="130" cy="600" r="1"   />
          <circle cx="280" cy="650" r="1.2" />
          <circle cx="430" cy="580" r="1"   />
          <circle cx="580" cy="660" r="1.5" />
          <circle cx="730" cy="610" r="1"   />
          <circle cx="880" cy="670" r="1.2" />
          <circle cx="1030" cy="590" r="1"  />
          <circle cx="1180" cy="640" r="1.5"/>
        </g>
        <g fill="rgba(255,255,255,0.15)">
          <circle cx="60"  cy="730" r="1"   />
          <circle cx="210" cy="770" r="1.2" />
          <circle cx="360" cy="720" r="1"   />
          <circle cx="510" cy="780" r="1.5" />
          <circle cx="660" cy="740" r="1"   />
          <circle cx="810" cy="790" r="1.2" />
          <circle cx="960" cy="730" r="1"   />
          <circle cx="1110" cy="770" r="1.5"/>
        </g>

        {/* 미세한 삼각형 패턴 */}
        <g fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8">
          <path d="M 200 150 L 220 120 L 240 150 Z" />
          <path d="M 500 300 L 520 270 L 540 300 Z" />
          <path d="M 800 180 L 820 150 L 840 180 Z" />
          <path d="M 1100 350 L 1120 320 L 1140 350 Z" />
          <path d="M 350 500 L 370 470 L 390 500 Z" />
          <path d="M 650 600 L 670 570 L 690 600 Z" />
          <path d="M 950 450 L 970 420 L 990 450 Z" />
        </g>

        {/* 빛나는 별 포인트 */}
        <g fill="rgba(255,255,255,0.8)">
          <circle cx="460" cy="60" r="2.5" />
          <circle cx="900" cy="80" r="2"   />
          <circle cx="250" cy="280" r="2.5"/>
          <circle cx="700" cy="240" r="2"  />
        </g>
      </svg>
    </div>
  )
}
