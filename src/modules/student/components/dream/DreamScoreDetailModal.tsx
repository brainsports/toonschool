/**
 * 꿈점수 상세 모달 — 점수 구성/기간 집계/득템·출석보상(이동됨)/최근 내역/다음 레벨까지 남은 점수.
 * 기존 헤더의 '득템 개수/출석보상 개수' 정보는 이 모달로 이동했다(PLAN.md §11).
 */
import { X } from 'lucide-react'
import type { DreamProgressResult } from '../../services/dreamScoreService'
import { getChapter, MAX_LEVEL } from '../../config/dreamProgressionConfig'

interface Props {
  progress: DreamProgressResult
  totalLootCount: number
  attendanceRewardCount: number
  onClose: () => void
}

function Stat({ lbl, val, sub }: { lbl: string; val: string | number; sub?: string }) {
  return (
    <div className="dream-stat-card">
      <div className="lbl">{lbl}</div>
      <div className="val">{val}{sub ? <small> {sub}</small> : null}</div>
    </div>
  )
}

export default function DreamScoreDetailModal({ progress, totalLootCount, attendanceRewardCount, onClose }: Props) {
  const p = progress
  const chapter = getChapter(p.level)
  const isMax = p.level >= MAX_LEVEL

  return (
    <div className="dream-modal-backdrop" role="dialog" aria-modal="true" aria-label="꿈점수 상세" onClick={onClose}>
      <div className="dream-modal dream-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dream-modal-header">
          <div>
            <h2>내 꿈점수 상세</h2>
            <p style={{ fontSize: '0.78rem', color: '#9a7e9a', marginTop: '0.15rem' }}>
              LV.{p.level} · {chapter.chapterTitle}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b09ab0' }}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="dream-modal-body">
          <div className="dream-score-hero">
            <div className="num">{p.dreamScore.toLocaleString()}</div>
            <div className="cap">전체 꿈점수</div>
          </div>

          <div className="dream-stat-grid">
            <Stat lbl="레벨 판정용 활동 점수" val={p.activityScore.toLocaleString()} />
            <Stat lbl="레벨 달성 보너스 점수" val={p.bonusScore.toLocaleString()} />
            <Stat lbl="이번 주 획득" val={`+${p.weeklyPoints.toLocaleString()}`} />
            <Stat lbl="이번 달 획득" val={`+${p.monthlyPoints.toLocaleString()}`} />
            <Stat lbl="출석 점수" val={p.attendancePoints.toLocaleString()} sub={`(${p.attendanceCount}회)`} />
            <Stat lbl="5일 연속 출석 점수" val={p.streak5Points.toLocaleString()} sub={`(${p.streak5Count}회)`} />
            <Stat lbl="작품 완성 점수" val={p.comicCompletePoints.toLocaleString()} sub={`(${p.comicCompleteCount}회)`} />
            <Stat lbl="선생님 칭찬 점수" val={p.teacherPraisePoints.toLocaleString()} sub={`(${p.teacherPraiseCount}회)`} />
            <Stat lbl="아이템 획득 점수" val={p.itemPoints.toLocaleString()} sub={`(${p.itemCount}회)`} />
            <Stat lbl="레벨 달성 점수" val={p.levelBonusPoints.toLocaleString()} />
            <Stat lbl="기존 득템 개수" val={`${totalLootCount}개`} />
            <Stat lbl="기존 출석보상 개수" val={`${attendanceRewardCount}개`} />
          </div>

          <div style={{ marginTop: '1rem', padding: '0.7rem 0.9rem', background: '#faf6fa', borderRadius: '0.8rem', border: '1px solid #f1e6f1' }}>
            {isMax ? (
              <div style={{ fontSize: '0.85rem', color: '#7a5fa8', fontFamily: 'Jua, system-ui' }}>
                최고 레벨(LV.{MAX_LEVEL})을 달성했어요! 🎉
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#6b4a6e' }}>
                다음 레벨까지 <strong style={{ color: '#a8347a' }}>활동 점수 {p.pointsToNextLevel.toLocaleString()}점</strong> 남았어요.
              </div>
            )}
          </div>

          <h3 style={{ fontFamily: 'Jua, system-ui', fontSize: '1rem', color: '#5b3b5e', margin: '1.25rem 0 0.25rem' }}>
            최근 점수 획득 내역
          </h3>
          {p.scoredLogs.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: '#b09ab0', padding: '0.75rem 0', textAlign: 'center' }}>
              아직 획득한 점수 내역이 없어요.
            </div>
          ) : (
            <div className="dream-history-list">
              {p.scoredLogs.slice(0, 12).map((log) => (
                <div key={log.id} className={`dream-history-row${log.isBonus ? ' bonus' : ''}`}>
                  <span>
                    <span style={{ color: '#9a7e9a' }}>{new Date(log.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                    {' · '}
                    <span style={{ color: '#5b3b5e' }}>{log.label}</span>
                  </span>
                  <span className="pts">+{log.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
