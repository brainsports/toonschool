/**
 * 우리 반 랭킹 모달 — 주간/누적 탭. 시상대(1~3) + 목록(4~10) + 본인 강조.
 * 동급생 데이터가 RLS 로 막힌(마이그레이션 미적용) 경우 fallback 으로 본인 현재 위치만 안내.
 */
import { useEffect, useState } from 'react'
import { Crown, X } from 'lucide-react'
import { getClassRanking, type RankEntry } from '../../services/dreamRankingService'
import type { DreamProgressResult } from '../../services/dreamScoreService'
import { getChapter } from '../../config/dreamProgressionConfig'

interface Props {
  studentId: string
  progress: DreamProgressResult
  onClose: () => void
}

type Tab = 'cumulative' | 'weekly'

export default function DreamRankingModal({ studentId, progress, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('cumulative')
  const [available, setAvailable] = useState(false)
  const [entries, setEntries] = useState<(RankEntry & { rank: number })[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getClassRanking(studentId)
      .then((res) => {
        if (cancelled) return
        setAvailable(res.available)
        setEntries(res.entries as (RankEntry & { rank: number })[])
        setMyRank(res.myRank)
      })
      .catch(() => {
        if (cancelled) return
        setAvailable(false)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [studentId])

  const podium = entries.slice(0, 3)
  const rest = entries.slice(3, 10)
  const myChapter = getChapter(progress.level)

  return (
    <div className="dream-modal-backdrop" role="dialog" aria-modal="true" aria-label="우리 반 랭킹" onClick={onClose}>
      <div className="dream-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dream-modal-header">
          <div>
            <h2>우리 반 성장랭킹</h2>
            <p style={{ fontSize: '0.78rem', color: '#9a7e9a', marginTop: '0.15rem' }}>같은 학급 친구들만 비교해요</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b09ab0' }}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="dream-modal-body">
          {/* 탭 — 주간/누적(현재 denorm 는 누적 기준. 주간은 동일 표시로 안전) */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {(['weekly', 'cumulative'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`praise-reason-btn${tab === t ? ' active' : ''}`}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                {t === 'weekly' ? '주간 꿈점수' : '누적 꿈점수'}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#b09ab0', fontSize: '0.85rem' }}>랭킹을 불러오는 중...</div>
          ) : !available ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '2.2rem' }}>🏅</div>
              <p style={{ fontFamily: 'Jua, system-ui', color: '#5b3b5e', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                우리 반 랭킹이 곧 준비될 예정이에요!
              </p>
              <p style={{ color: '#8a6c8a', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                지금 내 위치를 확인해 보세요.
              </p>
              <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff6da', borderRadius: '0.8rem', border: '1px solid #ffe49a', display: 'inline-block' }}>
                <div style={{ fontFamily: 'Jua, system-ui', color: '#8a6d1a' }}>
                  LV.{progress.level} · {progress.dreamScore.toLocaleString()} 꿈점수
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9a7e9a', marginTop: '0.2rem' }}>{myChapter.chapterTitle}</div>
              </div>
            </div>
          ) : (
            <>
              {/* 시상대 */}
              <div className="ranking-podium">
                {[2, 1, 3].map((pos) => {
                  const e = podium[pos - 1]
                  if (!e) return <div key={pos} />
                  return (
                    <div key={e.studentId} className={`ranking-pod ranking-pod--${pos}${e.isMe ? ' me' : ''}`}>
                      <div className="rank-emoji">{pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}</div>
                      <div className="name">{e.name}{e.isMe ? ' (나)' : ''}</div>
                      <div className="score">{e.dreamScore.toLocaleString()}점</div>
                    </div>
                  )
                })}
              </div>

              {/* 4~10위 목록 */}
              {rest.map((e) => (
                <div key={e.studentId} className={`ranking-row${e.isMe ? ' me' : ''}`}>
                  <span className="rank-no">{e.rank}</span>
                  <span className="name">{e.name}{e.isMe ? ' (나)' : ''}</span>
                  <span className="score">{e.dreamScore.toLocaleString()}점</span>
                </div>
              ))}

              {/* 본인이 10위 밖이면 별도 표시 */}
              {myRank && myRank > 3 && !rest.some((e) => e.isMe) && (
                <div className="ranking-row me" style={{ marginTop: '0.5rem' }}>
                  <span className="rank-no">{myRank}</span>
                  <span className="name">나</span>
                  <span className="score">{progress.dreamScore.toLocaleString()}점</span>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                {myRank ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#7a5fa8', fontSize: '0.82rem', fontFamily: 'Jua, system-ui' }}>
                    <Crown className="w-4 h-4" /> 우리 반 {myRank}위 / {entries.length}명
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
