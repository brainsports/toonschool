// ──────────────────────────────────────────────
// 발송 대상 선택 공통 컴포넌트
// 선생님 말씀 / 알림함 쓰기 양쪽에서 재사용.
// 전체(담당 학생 전체) · 학년 · 학급 범위를 본문에서 먼저 선택하고
// 예상 수신 인원을 안내한 뒤 선택 결과를 부모로 전달한다.
// ──────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import type { ClassRoom, Student } from '../types'
import { fetchClassesByTeacher } from '../services/classService'
import { fetchStudentsByTeacher } from '../services/studentService'

export type RecipientScope = 'all' | 'grade' | 'class'

export interface Recipient {
  scope: RecipientScope
  grade?: number
  classId?: string
  classRoom?: ClassRoom
  count: number
  label: string            // '담당 학생 전체' | '5학년' | '5학년 TestClass'
  targetKey: string        // 'all-grades' | 'grade-5' | classId
  summary: string          // 안내 문구
}

export interface TeacherRecipientSelectorProps {
  teacherId: string
  accent: 'pink' | 'purple'
  onChange: (recipient: Recipient | null) => void
}

const ACCENT = {
  pink: { primary: '#ff2778', softBg: '#fff0f6', softBorder: '#ffc6de', grad: 'linear-gradient(90deg,#ff2778,#ff6baf)' },
  purple: { primary: '#8b5cf6', softBg: '#f5f3ff', softBorder: '#ddd6fe', grad: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
}

export default function TeacherRecipientSelector({ teacherId, accent, onChange }: TeacherRecipientSelectorProps) {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [scope, setScope] = useState<RecipientScope>('all')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetchClassesByTeacher(teacherId),
      fetchStudentsByTeacher(0), // 0 -> 학년 필터 없이 담당 학생 전체
    ])
      .then(([cls, sts]) => {
        if (!alive) return
        setClasses(cls)
        setStudents(sts)
        if (cls.length > 0) setSelectedClassId(cls[0].id)
      })
      .catch((err) => {
        if (!alive) return
        console.error('[TeacherRecipientSelector] load error:', err)
        setLoadError('담당 학급/학생 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (alive) setIsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [teacherId])

  // 담당 학생 또는 학급이 존재하는 학년만 노출.
  const availableGrades = useMemo(() => {
    const set = new Set<number>()
    students.forEach((s) => set.add(s.grade))
    classes.forEach((c) => set.add(c.grade))
    return Array.from(set).sort((a, b) => a - b)
  }, [students, classes])

  // 선택된 학급 객체 (selectedClassId 가 유효할 때)
  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId],
  )

  // 현재 선택에 대한 Recipient 계산.
  const recipient = useMemo<Recipient | null>(() => {
    if (loadError || isLoading) return null

    if (scope === 'all') {
      const count = students.length
      return {
        scope: 'all',
        count,
        label: '담당 학생 전체',
        targetKey: 'all-grades',
        summary:
          count > 0
            ? `담당 학생 전체 ${count}명에게 보냅니다.`
            : '선택한 대상에 소속된 학생이 없습니다.',
      }
    }

    if (scope === 'grade') {
      if (selectedGrade == null) return null
      const count = students.filter((s) => s.grade === selectedGrade).length
      return {
        scope: 'grade',
        grade: selectedGrade,
        count,
        label: `${selectedGrade}학년`,
        targetKey: `grade-${selectedGrade}`,
        summary:
          count > 0
            ? `현재 선생님이 담당하는 ${selectedGrade}학년 학생 ${count}명에게 보냅니다.`
            : '선택한 대상에 소속된 학생이 없습니다.',
      }
    }

    // scope === 'class'
    if (!selectedClass) return null
    const count = students.filter((s) => s.classId === selectedClass.id).length
    return {
      scope: 'class',
      classId: selectedClass.id,
      classRoom: selectedClass,
      count,
      label: `${selectedClass.grade}학년 ${selectedClass.name}`,
      targetKey: selectedClass.id,
      summary:
        count > 0
          ? `${selectedClass.grade}학년 ${selectedClass.name} 학생 ${count}명에게 보냅니다.`
          : '이 학급에 소속된 학생이 없습니다.',
    }
  }, [scope, selectedGrade, selectedClass, students, isLoading, loadError])

  // 부모로 선택 결과 전달.
  useEffect(() => {
    onChange(recipient)
  }, [recipient, onChange])

  const a = ACCENT[accent]

  // 완전 빈 상태: 학급·학생 모두 없음.
  const hasNothing = !isLoading && !loadError && classes.length === 0 && students.length === 0

  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: active ? 'default' : 'pointer',
    border: `1.5px solid ${active ? a.primary : '#e5e7eb'}`,
    background: active ? a.grad : 'white',
    color: active ? 'white' : '#666',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  })

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #e5e7eb',
    fontSize: 14,
    cursor: 'pointer',
    background: 'white',
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* 발송 범위 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>발송 범위</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={segBtn(scope === 'all')} onClick={() => setScope('all')} disabled={hasNothing}>전체</button>
          <button style={segBtn(scope === 'grade')} onClick={() => setScope('grade')} disabled={hasNothing || availableGrades.length === 0}>학년</button>
          <button style={segBtn(scope === 'class')} onClick={() => setScope('class')} disabled={hasNothing || classes.length === 0}>학급</button>
        </div>
      </div>

      {isLoading && <div style={{ fontSize: 14, color: '#999' }}>담당 학급/학생 정보를 불러오는 중...</div>}

      {loadError && <div style={{ fontSize: 14, color: '#ef4444', background: '#fee2e2', padding: '10px 14px', borderRadius: 8 }}>{loadError}</div>}

      {hasNothing && (
        <div style={{ fontSize: 14, color: '#888', background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          담당 학생이 없습니다.<br />
          학생을 먼저 등록하거나 학급에 배정한 뒤 이용해 주세요.
        </div>
      )}

      {!isLoading && !loadError && !hasNothing && (
        <>
          {/* 세부 대상 선택 */}
          {scope === 'grade' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>선택 대상</div>
              <select
                value={selectedGrade ?? ''}
                onChange={(e) => setSelectedGrade(e.target.value ? Number(e.target.value) : null)}
                style={selectStyle}
              >
                {availableGrades.length === 0 && <option value="">담당 학년 없음</option>}
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}학년</option>
                ))}
              </select>
            </div>
          )}

          {scope === 'class' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 }}>선택 대상</div>
              <select
                value={selectedClassId ?? ''}
                onChange={(e) => setSelectedClassId(e.target.value || null)}
                style={selectStyle}
              >
                {classes.length === 0 && <option value="">담당 학급 없음</option>}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.grade}학년 {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 예상 수신 인원 안내 */}
          {recipient && (
            <div style={{
              fontSize: 14,
              color: recipient.count > 0 ? '#333' : '#999',
              background: recipient.count > 0 ? a.softBg : '#f8fafc',
              border: `1px solid ${recipient.count > 0 ? a.softBorder : '#e2e8f0'}`,
              padding: '12px 14px',
              borderRadius: 10,
              fontWeight: 600,
            }}>
              {recipient.summary}
            </div>
          )}
        </>
      )}
    </div>
  )
}
