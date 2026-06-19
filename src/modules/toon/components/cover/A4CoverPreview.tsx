import type { CoverPreviewProps } from '../../types/cover'
import { TonyFront } from '../../../../components/characters/TonySheet'
import { RiaFront } from '../../../../components/characters/RiaSheet'
import { HanaFront } from '../../../../components/characters/HanaSheet'

// ── 캐릭터별 테마 설정 ────────────────────────────────────────────────
export const RESOLUTION_THEMES: Record<string, { bg: string; border: string; name: string }> = {
  doyoon: { bg: '#EFF6FF', border: '#3B82F6', name: '도윤이' },
  seoa: { bg: '#FFF1F2', border: '#F43F5E', name: '서아' },
  hana: { bg: '#ECFDF5', border: '#10B981', name: '하나 선생님' },
  all: { bg: '#FFFBEB', border: '#F59E0B', name: '우리 모두' },
}

// ── 표지 배경 SVG 컴포넌트 ─────────────────────────────────────────
function MathBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE566"/>
          <stop offset="38%" stopColor="#FFD426"/>
          <stop offset="70%" stopColor="#FFBF3D"/>
          <stop offset="100%" stopColor="#FF9A3D"/>
        </linearGradient>
      </defs>
      <rect width="620" height="877" fill="url(#mBg)"/>
      <circle cx="540" cy="130" r="140" fill="rgba(255,255,255,0.09)"/>
      <circle cx="80" cy="260" r="100" fill="rgba(255,255,255,0.08)"/>
      <circle cx="320" cy="60" r="80" fill="rgba(255,220,50,0.25)"/>
      <circle cx="580" cy="500" r="90" fill="rgba(255,255,255,0.07)"/>
    </svg>
  )
}

function ScienceBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="scBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A0A4C"/>
          <stop offset="55%" stopColor="#2A1870"/>
          <stop offset="100%" stopColor="#1A3A5C"/>
        </linearGradient>
      </defs>
      <rect width="620" height="877" fill="url(#scBg)"/>
      <circle cx="200" cy="200" r="60" fill="none" stroke="#7B9FF5" strokeWidth="2.5" opacity="0.6"/>
      <circle cx="440" cy="320" r="45" fill="none" stroke="#3BAAA0" strokeWidth="2" opacity="0.5"/>
      <circle cx="500" cy="120" r="50" fill="#9B7FD4" opacity="0.8"/>
    </svg>
  )
}

function KoreanBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="620" height="877" fill="#FFF9E8"/>
      <rect x="30" y="30" width="560" height="817" fill="none" stroke="#E2E8F0" strokeWidth="2"/>
    </svg>
  )
}

function EnglishBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="enBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEFF"/>
          <stop offset="60%" stopColor="#C8E8FF"/>
          <stop offset="100%" stopColor="#E8F8FF"/>
        </linearGradient>
      </defs>
      <rect width="620" height="877" fill="url(#enBg)"/>
    </svg>
  )
}

function SocialBg() {
  return (
    <svg viewBox="0 0 620 877" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="620" height="877" fill="#F0F8E8"/>
    </svg>
  )
}

function SubjectBg({ subject }: { subject: string }) {
  switch (subject) {
    case '과학': return <ScienceBg />
    case '국어': return <KoreanBg />
    case '영어': return <EnglishBg />
    case '사회': return <SocialBg />
    default: return <MathBg />
  }
}

// 표지 또는 상단 "오늘의 각오" 말풍선
interface CoverBubbleProps {
  text: string
  borderColor: string
  bg: string
}

function CoverBubble({ text, borderColor, bg }: CoverBubbleProps) {
  return (
    <div className="relative">
      <div 
        style={{ 
          background: bg, 
          border: `3px solid ${borderColor}`, 
          borderRadius: 18, 
          padding: "7px 12px", 
          boxShadow: `3px 4px 0 rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.12)`, 
          maxWidth: 158, 
          minWidth: 96 
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 400, color: "#1E293B", lineHeight: 1.35, textAlign: "center", margin: 0 }}>{text}</p>
      </div>
      <div style={{position: "absolute", bottom: -13, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: `14px solid ${borderColor}`}}/>
    </div>
  )
}

export function A4CoverPreview({
  cover,
  selectedId: _selectedId,
  scale: _scale = 1,
  onClick
}: CoverPreviewProps) {
  const isImageBg = cover.bgType === 'image'
  const targetBgImage = cover.bgImageUrl || '/images/math_cover_clean.png'

  // 날짜 기본값 포맷팅 (오늘 날짜)
  const displayDate = cover.date || new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/- /g, '.').replace(/\.$/, '') // e.g. 2026.06.18

  // 과목명 오타 수정 ('영서' -> '영어')
  const subjectName = cover.subjectName === '영서' ? '영어' : (cover.subjectName || '수학')

  return (
    <div 
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 680,
        aspectRatio: '210 / 297',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#FFF',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.18)',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. 배경 영역 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: isImageBg ? 'none' : cover.bgGradient,
          zIndex: 1
        }}
      >
        {!isImageBg && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
            <SubjectBg subject={subjectName} />
          </div>
        )}
      </div>

      {/* 2. 표지 이미지 전용 클리핑 및 동적 렌더링 */}
      {isImageBg && (
        <div 
          style={{
            position: 'absolute',
            left: '-28.2%',
            top: '-5.03%',
            width: '156.1%',
            height: '109.5%',
            zIndex: 1
          }}
        >
          <img
            src={targetBgImage}
            alt={`${subjectName} 학습만화 표지`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill'
            }}
          />
        </div>
      )}

      {/* 3. 동적 텍스트 및 오버레이 콘텐츠 레이어 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          boxSizing: 'border-box',
          padding: '6% 7% 5% 7%'
        }}
      >
        {/* 상단 영역: 왼쪽 작품 제목, 오른쪽 날짜 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          {/* 작품 제목 */}
          <h1 
            style={{
              fontSize: 22,
              fontWeight: 950,
              color: '#2D1B0E',
              margin: 0,
              maxWidth: '60%',
              wordBreak: 'keep-all',
              lineHeight: 1.2,
              textShadow: '0 2px 4px rgba(255,255,255,0.8)'
            }}
          >
            {cover.title || '나만의 학습툰'}
          </h1>

          {/* 날짜 */}
          <span 
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#475569',
              background: 'rgba(255,255,255,0.75)',
              padding: '4px 10px',
              borderRadius: 12,
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            {displayDate}
          </span>
        </div>

        {/* 빈 공간 밀어내기 */}
        <div style={{ flex: 1 }} />

        {/* 중앙/하단 캐릭터 장식 및 말풍선 오버레이 영역 */}
        <div 
          style={{
            position: 'relative',
            height: '42%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginBottom: '10%',
            boxSizing: 'border-box'
          }}
        >
          {/* 캐릭터 라이팅 효과 */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: '-10%',
              right: '-10%',
              height: '70%',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(255,255,200,0.3) 0%, transparent 70%)',
              borderRadius: '50% 50% 0 0',
              pointerEvents: 'none'
            }}
          />

          {/* 화자 선택에 따른 대표 캐릭터 렌더링 */}
          <div className="flex flex-col items-center z-10">
            {/* 동적으로 말풍선 렌더링 (오늘의 각오) */}
            {cover.selectedResolution && (
              <div style={{ marginBottom: 4 }}>
                <CoverBubble
                  text={cover.selectedResolution}
                  borderColor={RESOLUTION_THEMES[cover.resolutionOwner]?.border || '#10B981'}
                  bg={RESOLUTION_THEMES[cover.resolutionOwner]?.bg || '#ECFDF5'}
                />
              </div>
            )}
            
            {/* 캐릭터 일러스트 */}
            <div style={{ filter: 'drop-shadow(3px 8px 8px rgba(0,0,0,0.22))' }}>
              {cover.resolutionOwner === 'doyoon' && <div style={{ width: 140 }}><TonyFront /></div>}
              {cover.resolutionOwner === 'seoa' && <div style={{ width: 140 }}><RiaFront /></div>}
              {cover.resolutionOwner === 'hana' && <div style={{ width: 140 }}><HanaFront /></div>}
              {cover.resolutionOwner === 'all' && (
                <div className="flex gap-1.5 items-end">
                  <div style={{ width: 95 }}><TonyFront /></div>
                  <div style={{ width: 105 }}><HanaFront /></div>
                  <div style={{ width: 95 }}><RiaFront /></div>
                </div>
              )}
            </div>

            {/* 캐릭터 이름 배지 */}
            <div 
              style={{
                background: RESOLUTION_THEMES[cover.resolutionOwner]?.border || '#10B981',
                color: 'white',
                padding: '3px 12px',
                borderRadius: 14,
                fontSize: 10.5,
                fontWeight: 900,
                marginTop: -4,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                zIndex: 20
              }}
            >
              {RESOLUTION_THEMES[cover.resolutionOwner]?.name || '하나 선생님'}
            </div>
          </div>
        </div>

        {/* 저자 표시 (글 / 그림) - 표지 오른쪽 하단 */}
        <div 
          style={{
            position: 'absolute',
            bottom: '14%',
            right: '7%',
            fontSize: 12,
            fontWeight: 800,
            color: '#2D1B0E',
            background: 'rgba(255,255,255,0.8)',
            padding: '4px 10px',
            borderRadius: 10,
            border: '1.5px solid #2D1B0E',
            zIndex: 15
          }}
        >
          <span>글: {cover.author || '툰스쿨'} · 그림: {cover.illustrator || 'AI'}</span>
        </div>

        {/* 학년/과목 배지 오버레이 (하단 정중앙에 배치) */}
        <div 
          style={{
            position: 'absolute',
            bottom: '3.1%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '58.4%',
            height: '9.6%',
            background: '#FFFFFF',
            borderRadius: '100px',
            border: '3.5px solid #2D1B0E',
            boxShadow: '0 4px 0 #2D1B0E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <span 
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#2D1B0E',
              fontFamily: 'inherit',
              letterSpacing: '-0.5px'
            }}
          >
            {cover.grade}학년 {subjectName}
          </span>
        </div>

        {/* A4 하단 푸터 영역 */}
        <div 
          style={{
            borderTop: '2px solid rgba(226, 232, 240, 0.7)',
            padding: '12px 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            fontSize: 11,
            fontWeight: 800,
            color: '#64748B',
            boxSizing: 'border-box'
          }}
        >
          <div className="flex items-center gap-1">
            <span style={{ color: '#4F6AF0' }}>✏️</span>
            <span>ToonSchool</span>
          </div>
          <span>학습툰 · AI 에디터</span>
        </div>
      </div>
    </div>
  )
}
