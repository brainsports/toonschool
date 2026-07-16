/**
 * 레벨업 모달 — 새 레벨을 최초 달성했을 때 1회 표시.
 * 중복 표시/중복 지급은 useDreamProgress + ensureLevelBonuses 가 이미 방지한다.
 */
import { Map } from 'lucide-react'
import { getChapter, LEVEL_BONUS_POINTS } from '../../config/dreamProgressionConfig'

interface LevelUpModalProps {
  level: number
  onGoToScene: () => void
  onLater: () => void
}

export default function LevelUpModal({ level, onGoToScene, onLater }: LevelUpModalProps) {
  const chapter = getChapter(level)
  return (
    <div className="dream-modal-backdrop" role="dialog" aria-modal="true" aria-label="레벨업">
      <div className="dream-modal">
        <div className={`dream-bg--${chapter.themeKey} levelup-modal`} style={{ borderRadius: '1.75rem' }}>
          <span className="levelup-badge">레벨업!</span>
          <div className="levelup-emoji">{chapter.symbolEmoji}</div>
          <div className="levelup-title">LV.{chapter.level}</div>
          <div className="levelup-loc">{chapter.chapterTitle}</div>
          <div className="levelup-symbol">상징 아이템 · {chapter.symbolName}</div>
          <div className="levelup-bonus">레벨 달성 보너스 +{LEVEL_BONUS_POINTS}점</div>
          <p style={{ color: '#7a5f7a', fontSize: '0.82rem', marginTop: '0.5rem' }}>{chapter.nextChapterHint}</p>
          <div className="levelup-actions">
            <button type="button" className="levelup-btn-ghost" onClick={onLater}>나중에 보기</button>
            <button type="button" className="levelup-btn-primary" onClick={onGoToScene}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                <Map className="w-4 h-4" /> 새로운 장면으로 가기
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
