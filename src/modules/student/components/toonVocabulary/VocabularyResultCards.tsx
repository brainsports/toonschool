// 툰어휘사전 결과 카드 목록.
// 선택한 뜻(sense) 하나에 대해 5개 카드(사전뜻/쉬운뜻/생활예문/교과예문/한마디)를 시안 색상으로 렌더.
// 다의어/동음이의어(결과가 여러 개)일 땐 상단 탭으로 뜻을 전환해 한 뜻씩 본다(시안 단일 카드셋 인상 유지).
// AI 실패(unavailable) 시 쉬운 설명 영역은 안내 카드로 대체, 사전 뜻은 유지.
import { BookOpen, MessageCircle, Home, FlaskConical, Star, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import type { VocabularyResult, VocabularyAiStatus } from '../../types/vocabulary'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'

function Card({
  variant,
  icon,
  label,
  text,
}: {
  variant: 'blue' | 'green' | 'pink' | 'purple' | 'yellow'
  icon: ReactNode
  label: string
  text: string
}) {
  return (
    <div className={`tv-card tv-card--${variant}`}>
      <div className="tv-card__icon">{icon}</div>
      <div className="tv-card__body">
        <div className="tv-card__label">{label}</div>
        <div className="tv-card__text">{text}</div>
      </div>
    </div>
  )
}

const ICON_SIZE = 18

// 한 뜻(sense) 블록 — 5개 카드.
function SenseBlock({ result, aiStatus }: { result: VocabularyResult; aiStatus: VocabularyAiStatus }) {
  const aiUnavailable = aiStatus === 'unavailable' || !result.easyDefinition
  return (
    <div className="tv-sense">
      <div className="tv-sense__meta">
        <span className="tv-sense__chip">{result.partOfSpeech || '낱말'}</span>
        {result.pronunciation ? <span>발음 · {result.pronunciation}</span> : null}
      </div>

      {/* 1. 사전 뜻 — 항상 표시 */}
      <Card variant="blue" icon={<BookOpen size={ICON_SIZE} />} label="사전 뜻" text={result.officialDefinition} />

      {/* 2~5. AI 생성 항목 */}
      {aiUnavailable ? (
        <div className="tv-ai-notice">
          <Info className="tv-ai-notice__icon" size={18} />
          <span>쉬운 설명을 잠시 불러오지 못했어요. 사전 뜻은 정상적으로 확인할 수 있어요.</span>
        </div>
      ) : (
        <>
          <Card variant="green" icon={<MessageCircle size={ICON_SIZE} />} label="쉬운 뜻" text={result.easyDefinition || ''} />
          {result.dailyExample ? (
            <Card variant="pink" icon={<Home size={ICON_SIZE} />} label="생활 예문" text={result.dailyExample} />
          ) : null}
          {result.schoolExample ? (
            <Card variant="purple" icon={<FlaskConical size={ICON_SIZE} />} label="교과 예문" text={result.schoolExample} />
          ) : null}
          {result.keyPoint ? (
            <Card variant="yellow" icon={<Star size={ICON_SIZE} />} label="한마디 정리" text={result.keyPoint} />
          ) : null}
        </>
      )}
    </div>
  )
}

export default function VocabularyResultCards({
  results,
  aiStatus,
  sel,
  onSelChange,
}: {
  results: VocabularyResult[]
  aiStatus: VocabularyAiStatus
  sel: number
  onSelChange: (i: number) => void
}) {
  const word = results[0]?.word ?? ''
  const current = results[Math.min(sel, results.length - 1)]
  const multi = results.length > 1

  return (
    <div>
      <div className="tv-section-label">
        '{word}' 검색 결과{multi ? ` · ${results.length}개 뜻` : ''}
      </div>

      {multi ? (
        <div className="tv-tabs" role="tablist" aria-label="뜻 선택">
          {results.map((r, i) => (
            <button
              key={`${r.targetCode}-${r.senseOrder}`}
              className={`tv-tab${i === sel ? ' tv-tab--active' : ''}`}
              onClick={() => onSelChange(i)}
              role="tab"
              aria-selected={i === sel}
            >
              <span className="tv-tab__no">{i + 1}</span>
              {r.partOfSpeech ? ` · ${r.partOfSpeech}` : ''}
            </button>
          ))}
        </div>
      ) : null}

      {current ? <SenseBlock result={current} aiStatus={aiStatus} /> : null}

      <div className="tv-state" style={{ padding: '14px 8px 2px', gap: 6 }}>
        <img src={MASCOT} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        <p className="tv-state__text">모르는 단어가 또 있으면 찾아줄게!</p>
      </div>
    </div>
  )
}
