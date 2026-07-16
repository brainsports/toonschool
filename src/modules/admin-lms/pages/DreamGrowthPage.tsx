/**
 * 교사 — 학생 꿈 성장 현황 + 칭찬 지급.
 * 라우트: /admin/lms/dream-growth (AdminPortalLayout 하위).
 *
 * - 담당 학생만 표시(student-by-teacher EF 격리).
 * - 레벨/꿈점수/장면/남은점수/월간칭찬 표시. 점수는 additive 마이그레이션 적용 전엔 fallback.
 * - 이름 검색 / 학급·학년·레벨 필터 / 점수 정렬.
 * - 학생별 칭찬(50점, 월 3회) 지급.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { getTeacherStudentsDream, type StudentDreamRow } from '../services/dreamTeacherService'
import {
  createPraise,
  getMonthlyPraiseCountForStudent,
  PRAISE_MONTHLY_LIMIT,
  PRAISE_REASONS,
} from '../../student/services/teacherPraiseService'
import { MAX_LEVEL } from '../../student/config/dreamProgressionConfig'
import '../../student/styles/dream-progression.css'

type SortKey = 'score-desc' | 'score-asc' | 'weekly-desc' | 'praise-desc'

export default function DreamGrowthPage() {
  const { profile } = useAuth()
  const teacherId = profile?.id ?? null
  const [rows, setRows] = useState<StudentDreamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('score-desc')

  const [praiseTarget, setPraiseTarget] = useState<StudentDreamRow | null>(null)
  const [praiseReason, setPraiseReason] = useState<string>(PRAISE_REASONS[0])
  const [praiseRemaining, setPraiseRemaining] = useState<number>(PRAISE_MONTHLY_LIMIT)
  const [praiseSending, setPraiseSending] = useState(false)
  const [praiseMsg, setPraiseMsg] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudentDreamRow | null>(null)

  const load = useCallback(async () => {
    if (!teacherId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTeacherStudentsDream(teacherId, 0)
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '학생 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    void load()
  }, [load])

  const classOptions = useMemo(() => {
    const set = new Map<string, string>()
    for (const r of rows) {
      if (r.student.classId) set.set(r.student.classId, r.student.className || r.student.classId)
    }
    return Array.from(set.entries())
  }, [rows])

  const gradeOptions = useMemo(() => {
    const set = new Set<number>()
    for (const r of rows) set.add(r.student.grade)
    return Array.from(set).sort((a, b) => a - b)
  }, [rows])

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (search && !r.student.name?.toLowerCase().includes(search.toLowerCase())) return false
      if (classFilter !== 'all' && r.student.classId !== classFilter) return false
      if (gradeFilter !== 'all' && r.student.grade !== gradeFilter) return false
      if (levelFilter !== 'all' && (r.level ?? 0) < levelFilter) return false
      return true
    })
    const score = (r: StudentDreamRow) => r.dreamScore ?? -1
    switch (sort) {
      case 'score-desc':
        list = [...list].sort((a, b) => score(b) - score(a))
        break
      case 'score-asc':
        list = [...list].sort((a, b) => score(a) - score(b))
        break
      case 'weekly-desc':
        list = [...list].sort((a, b) => b.monthlyPraiseCount - a.monthlyPraiseCount)
        break
      case 'praise-desc':
        list = [...list].sort((a, b) => b.monthlyPraiseCount - a.monthlyPraiseCount)
        break
    }
    return list
  }, [rows, search, classFilter, gradeFilter, levelFilter, sort])

  const anyScoreAvailable = rows.some((r) => r.available)

  async function openPraise(row: StudentDreamRow) {
    setPraiseTarget(row)
    setPraiseReason(PRAISE_REASONS[0])
    setPraiseMsg(null)
    if (!teacherId) return
    const used = await getMonthlyPraiseCountForStudent(teacherId, row.student.id)
    setPraiseRemaining(Math.max(0, PRAISE_MONTHLY_LIMIT - used))
  }

  async function sendPraise() {
    if (!teacherId || !praiseTarget) return
    setPraiseSending(true)
    setPraiseMsg(null)
    const res = await createPraise({ teacherId, studentId: praiseTarget.student.id, reason: praiseReason })
    setPraiseSending(false)
    if (res.ok) {
      setPraiseRemaining(res.remaining)
      setPraiseMsg(res.message)
      void load() // 목록 새로고침(칭찬 카운트 반영)
    } else {
      setPraiseMsg(res.message)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">학생 꿈 성장 현황</h1>
        <p className="text-slate-500 text-sm mt-1">담당 학생의 레벨·꿈점수를 확인하고 칭찬을 보낼 수 있어요.</p>
        {!anyScoreAvailable && (
          <p className="text-amber-600 text-xs mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
            ℹ️ 학생별 레벨/점수 표시는 DB 권한 설정(운영 마이그레이션) 적용 후 표시돼요. 칭찬 지급은 지금 바로 가능합니다.
          </p>
        )}
      </div>

      {/* 필터/정렬 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm min-w-[8rem]"
        />
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">전체 학급</option>
          {classOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">전체 학년</option>
          {gradeOptions.map((g) => (
            <option key={g} value={g}>{g}학년</option>
          ))}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">전체 레벨</option>
          {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => (
            <option key={l} value={l}>LV.{l} 이상</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="score-desc">꿈점수 높은순</option>
          <option value="score-asc">꿈점수 낮은순</option>
          <option value="praise-desc">이번달 칭찬 많은순</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400">담당 학생이 없어요.</div>
      ) : (
        <>
          {/* 데스크톱 표 */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">이름</th>
                  <th className="text-left px-3 py-2 font-medium">학년/반</th>
                  <th className="text-center px-3 py-2 font-medium">레벨</th>
                  <th className="text-left px-3 py-2 font-medium">현재 장면</th>
                  <th className="text-right px-3 py-2 font-medium">꿈점수</th>
                  <th className="text-right px-3 py-2 font-medium">다음 레벨까지</th>
                  <th className="text-center px-3 py-2 font-medium">월 칭찬</th>
                  <th className="text-center px-3 py-2 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.student.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.student.name}</td>
                    <td className="px-3 py-2 text-slate-500">{r.student.grade}학년 · {r.student.className || '-'}</td>
                    <td className="px-3 py-2 text-center">{r.level ? `LV.${r.level}` : '-'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{r.chapterTitle ?? '-'}</td>
                    <td className="px-3 py-2 text-right font-bold text-pink-600">{r.dreamScore !== null ? r.dreamScore.toLocaleString() : '-'}</td>
                    <td className="px-3 py-2 text-right text-slate-500 text-xs">{r.pointsToNextLevel !== null ? `${r.pointsToNextLevel.toLocaleString()}점` : '-'}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{r.monthlyPraiseCount}/{PRAISE_MONTHLY_LIMIT}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openPraise(r)} className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs hover:bg-amber-200 disabled:opacity-40" disabled={r.monthlyPraiseCount >= PRAISE_MONTHLY_LIMIT}>
                          칭찬
                        </button>
                        <button onClick={() => setDetail(r)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200">상세</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="md:hidden flex flex-col gap-2">
            {filtered.map((r) => (
              <div key={r.student.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-800">{r.student.name}</div>
                    <div className="text-xs text-slate-500">{r.student.grade}학년 · {r.student.className || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-pink-600 font-bold">{r.dreamScore !== null ? r.dreamScore.toLocaleString() : '-'}</div>
                    <div className="text-xs text-slate-400">{r.level ? `LV.${r.level}` : '-'} · 칭찬 {r.monthlyPraiseCount}/{PRAISE_MONTHLY_LIMIT}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">{r.chapterTitle ?? ''}</div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => openPraise(r)} className="flex-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs" disabled={r.monthlyPraiseCount >= PRAISE_MONTHLY_LIMIT}>칭찬</button>
                  <button onClick={() => setDetail(r)} className="flex-1 px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs">상세</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 칭찬 모달 */}
      {praiseTarget && (
        <div className="dream-modal-backdrop" onClick={() => setPraiseTarget(null)}>
          <div className="dream-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dream-modal-header">
              <div>
                <h2>칭찬 보내기</h2>
                <p className="text-xs text-slate-500 mt-0.5">{praiseTarget.student.name} 학생에게 50점</p>
              </div>
              <button onClick={() => setPraiseTarget(null)} className="text-slate-400 text-xl px-2">×</button>
            </div>
            <div className="dream-modal-body">
              <div className="praise-remaining">이번 달 남은 칭찬: <strong>{praiseRemaining}/{PRAISE_MONTHLY_LIMIT}</strong>회</div>
              <div className="praise-reason-grid">
                {PRAISE_REASONS.map((r) => (
                  <button key={r} className={`praise-reason-btn${praiseReason === r ? ' active' : ''}`} onClick={() => setPraiseReason(r)}>
                    {r}
                  </button>
                ))}
              </div>
              {praiseMsg && <div className="text-sm text-center mt-2 text-slate-600">{praiseMsg}</div>}
              <button
                onClick={sendPraise}
                disabled={praiseSending || praiseRemaining <= 0}
                className="w-full mt-3 py-2.5 rounded-xl text-white font-bold disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg,#f59ec0,#c879ff)', fontFamily: 'Jua, system-ui' }}
              >
                {praiseSending ? '보내는 중...' : praiseRemaining <= 0 ? '이번 달 칭찬 완료' : '칭찬 보내기 (+50점)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detail && (
        <div className="dream-modal-backdrop" onClick={() => setDetail(null)}>
          <div className="dream-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dream-modal-header">
              <div>
                <h2>{detail.student.name} 학생</h2>
                <p className="text-xs text-slate-500 mt-0.5">{detail.student.grade}학년 · {detail.student.className || '-'}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 text-xl px-2">×</button>
            </div>
            <div className="dream-modal-body">
              <div className="dream-stat-grid">
                <div className="dream-stat-card"><div className="lbl">레벨</div><div className="val">{detail.level ? `LV.${detail.level}` : '-'}</div></div>
                <div className="dream-stat-card"><div className="lbl">현재 장면</div><div className="val" style={{ fontSize: '0.85rem' }}>{detail.chapterTitle ?? '-'}</div></div>
                <div className="dream-stat-card"><div className="lbl">전체 꿈점수</div><div className="val">{detail.dreamScore !== null ? detail.dreamScore.toLocaleString() : '-'}</div></div>
                <div className="dream-stat-card"><div className="lbl">활동 점수</div><div className="val">{detail.activityScore !== null ? detail.activityScore.toLocaleString() : '-'}</div></div>
                <div className="dream-stat-card"><div className="lbl">다음 레벨까지</div><div className="val">{detail.pointsToNextLevel !== null ? `${detail.pointsToNextLevel.toLocaleString()}점` : '-'}</div></div>
                <div className="dream-stat-card"><div className="lbl">월간 칭찬</div><div className="val">{detail.monthlyPraiseCount}/{PRAISE_MONTHLY_LIMIT}</div></div>
              </div>
              {detail.available === false && (
                <p className="text-xs text-amber-600 mt-3">상세 점수는 DB 권한 설정 적용 후 표시돼요.</p>
              )}
              <button onClick={() => { setDetail(null); openPraise(detail); }} className="w-full mt-3 py-2.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(90deg,#f59ec0,#c879ff)', fontFamily: 'Jua, system-ui' }}>
                칭찬 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
