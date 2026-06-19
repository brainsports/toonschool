function A4CoverPreview({ cover }: { cover: CoverState }) {
  const SUBJECT_EMOJI: Record<string, string> = {
    국어: '📖', 수학: '📐', 사회: '🗺️', 과학: '🔬',
    영어: '🌍', 도덕: '💛', 음악: '🎵', 미술: '🎨', 체육: '⚽',
  }

  // 글자별 입체 풍선 글씨용 색상 할당
  const getLetterColor = (idx: number) => {
    const colors = ['#FF6B9D', '#4F7BFF', '#7BE7C7', '#FFE58A', '#8B7CFF', '#FFB347']
    return colors[idx % colors.length]
  }

  const titleText = cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '나의 학습툰'

  // 말풍선 각오 주인공 이름 매핑
  const getResolutionOwnerName = () => {
    if (cover.resolutionOwner === 'all') return '우리의 각오'
    return `${CHARACTER_INFO[cover.resolutionOwner]?.name || '캐릭터'}의 각오`
  }

  // 폴백 이미지 경로 지정 (기존 저장 데이터에 bgImageUrl이 누락되어 있어도 과목 테마를 통해 보완)
  const targetBgImage = cover.bgImageUrl || SUBJECT_THEMES[cover.subjectName]?.bgImageUrl
  const isImageBg = !!targetBgImage
  const isTitleModified = cover.title && cover.title !== SUBJECT_THEMES[cover.subjectName]?.title

  return (
    <div style={{
      width: '100%', maxWidth: 420,
      aspectRatio: '1 / 1.414',
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      position: 'relative',
      background: cover.bgGradient || '#FFE566',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 실제 고화질 표지 이미지 배경 적용 (Vite public 경로 대응 및 브라우저 캐싱 호환성을 위해 <img> 태그 사용) */}
      {isImageBg && (
        <img
          src={targetBgImage}
          alt={`${cover.subjectName} 학습만화 표지 배경`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 상단 가랜드 */}
      {!isImageBg && <Garland />}

      {/* 배경 플로팅 장식 및 기호 */}
      {!isImageBg && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          {/* 원형 은은한 광원 효과 */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ position: 'absolute', bottom: 60, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          
          {/* 풍선 장식 */}
          <div style={{ position: 'absolute', left: 14, top: 110, fontSize: 32, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.12))', zIndex: 2 }}>🎈</div>
          <div style={{ position: 'absolute', right: 14, top: 130, fontSize: 36, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.12))', zIndex: 2 }}>🎈</div>

          {/* 사용자가 설정한 장식 요소를 absolute로 흩뿌리기 */}
          {cover.bgPattern.map((decor, index) => {
            const positions = [
              { left: '6%', top: '22%' },
              { right: '8%', top: '25%' },
              { left: '12%', top: '35%' },
              { right: '12%', top: '42%' },
              { left: '8%', top: '48%' },
              { right: '6%', top: '55%' },
              { left: '10%', top: '65%' },
              { right: '10%', top: '70%' },
              { left: '20%', top: '15%' },
              { right: '22%', top: '18%' },
            ]
            const pos = positions[index % positions.length]
            return (
              <div key={index} style={{
                position: 'absolute',
                left: pos.left,
                right: pos.right,
                top: pos.top,
                fontSize: 20,
                fontWeight: 900,
                color: 'rgba(45,27,14,0.18)',
                textShadow: '1px 1px 0 rgba(255,255,255,0.6)',
                userSelect: 'none'
              }}>
                {decor}
              </div>
            )
          })}
        </div>
      )}

      {/* 상단 브랜드 배지 */}
      <div style={{ padding: '24px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2D1B0E', borderRadius: 100, padding: '4px 12px', border: '1.5px solid #2D1B0E' }}>
          <span style={{ fontSize: 11 }}>{SUBJECT_EMOJI[cover.subjectName] || '📚'}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{cover.grade}학년 · {cover.subjectName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cover.seriesNo && (
            <div style={{ background: '#FF6B9D', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, border: '1.5px solid #2D1B0E', boxShadow: '1.5px 1.5px 0 #2D1B0E' }}>
              {cover.seriesNo}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '4px 10px', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#2D1B0E', letterSpacing: '1px' }}>LEARNING TOON</span>
          </div>
        </div>
      </div>

      {/* 단원명 배지 */}
      {cover.unitName && (
        <div style={{ padding: '8px 16px 0', position: 'relative', zIndex: 3 }}>
          <div style={{ background: '#FFF', borderRadius: 8, padding: '4px 10px', display: 'inline-block', border: '2px solid #2D1B0E', boxShadow: '2px 2px 0 #2D1B0E' }}>
            <span style={{ fontSize: 9.5, color: '#2D1B0E', fontWeight: 900 }}>
              {cover.unitName}{cover.subunitName ? ` › ${cover.subunitName}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 (제목 + 말풍선 + 캐릭터) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px', position: 'relative', zIndex: 3 }}>
        {/* 입체형 메인 타이틀 (이미지 배경이고 제목 수정을 안했다면 이미지 자체 타이틀 노출을 위해 렌더링 안함) */}
        {(!isImageBg || isTitleModified) && (
          <div style={{
            width: '100%',
            textAlign: 'center',
            marginTop: 10,
            marginBottom: 10,
            ...(isImageBg && {
              background: 'rgba(255, 249, 219, 0.96)',
              border: '3px solid #2D1B0E',
              borderRadius: 20,
              padding: '16px 8px',
              boxShadow: '0 8px 24px rgba(45,27,14,0.25)',
              zIndex: 10,
              position: 'relative'
            })
          }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#2D1B0E', letterSpacing: '2px', marginBottom: 6 }}>신나는 교과 학습만화</div>
            <h1 style={{
              fontSize: titleText.length > 12 ? 26 : 32,
              fontWeight: 900,
              lineHeight: 1.25,
              margin: 0,
              fontFamily: 'inherit',
              wordBreak: 'keep-all',
              letterSpacing: '-1.2px',
              textAlign: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1px'
            }}>
              {titleText.split('').map((char, idx) => (
                <span key={idx} style={{
                  color: getLetterColor(idx),
                  textShadow: `
                    -2.5px -2.5px 0 #2D1B0E,
                     2.5px -2.5px 0 #2D1B0E,
                    -2.5px  2.5px 0 #2D1B0E,
                     2.5px  2.5px 0 #2D1B0E,
                     0px  5px 0 #2D1B0E,
                     0px  7px 10px rgba(45,27,14,0.4)
                  `
                }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            {cover.subtitle && (
              <div style={{
                display: 'inline-block',
                marginTop: 10,
                background: '#FFE566',
                color: '#2D1B0E',
                fontSize: 11,
                fontWeight: 900,
                padding: '3px 12px',
                borderRadius: 8,
                border: '1.5px solid #2D1B0E',
                boxShadow: '1.5px 1.5px 0 #2D1B0E'
              }}>
                {cover.subtitle}
              </div>
            )}
          </div>
        )}

        {/* 오늘의 각오 말풍선 */}
        {cover.speechBubble && (
          <div style={{
            position: 'absolute',
            bottom: isImageBg ? 210 : 162,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '85%',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#fff',
              border: '2.5px solid #2D1B0E',
              borderRadius: 18,
              padding: '8px 12px',
              boxShadow: '0 4px 0 #2D1B0E, 0 6px 12px rgba(45,27,14,0.15)',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* 각오 주인공 이름표 배지 */}
              <div style={{
                position: 'absolute',
                top: -10,
                left: 12,
                background: '#FF6B9D',
                border: '1.5px solid #2D1B0E',
                borderRadius: 6,
                padding: '1px 6px',
                fontSize: 8.5,
                fontWeight: 900,
                color: '#fff',
                boxShadow: '1px 1px 0 #2D1B0E'
              }}>
                📢 {getResolutionOwnerName()}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: '#2D1B0E', lineHeight: 1.35, wordBreak: 'keep-all', paddingTop: 3 }}>
                {cover.speechBubble}
              </div>
              {/* 말풍선 꼬리 */}
              <div style={{ position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '9px solid #2D1B0E' }} />
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff' }} />
            </div>
          </div>
        )}

        {/* 하단 무대 (블루 타원형) */}
        {!isImageBg && (
          <div style={{
            position: 'absolute',
            bottom: 36,
            left: '5%',
            right: '5%',
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #64B5F6 0%, #1976D2 100%)',
            border: '3.5px solid #2D1B0E',
            boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.2)',
            zIndex: 1,
          }} />
        )}

        {/* 캐릭터 3인방 배치 */}
        {!isImageBg && (
          <div style={{ position: 'absolute', bottom: 38, left: 0, right: 0, height: 160, zIndex: 2, pointerEvents: 'none' }}>
            {/* 도윤 (좌측) */}
            {cover.characters.includes('doyoon') && (
              <div style={{ position: 'absolute', left: '12%', bottom: 10, width: 85, height: 110 }}>
                <TonyFront expression="happy" costume={getCostume(cover.subjectName)} />
              </div>
            )}
            {/* 하나 선생님 (중앙) */}
            {cover.characters.includes('hana') && (
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 12, width: 115, height: 145, zIndex: 3 }}>
                <HanaFront expression="smile" costume={getCostume(cover.subjectName)} />
              </div>
            )}
            {/* 서아 (우측) */}
            {cover.characters.includes('seoa') && (
              <div style={{ position: 'absolute', right: '12%', bottom: 10, width: 85, height: 110 }}>
                <RiaFront expression="happy" costume={getCostume(cover.subjectName)} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 저작 정보 및 브랜드 로고 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        background: '#2D1B0E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 5
      }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
          글: {cover.author || '툰스쿨'} · 그림: {cover.illustrator || 'AI'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[0, 1, 2].map(i => (
              <svg key={i} width="8" height="8" viewBox="0 0 24 24" fill="#FFD700" opacity={0.9}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 900, color: '#FFE566', letterSpacing: '1px' }}>
            TOONSCHOOL
          </span>
        </div>
      </div>
    </div>
  )
}