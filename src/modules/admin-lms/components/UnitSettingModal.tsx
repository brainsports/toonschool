// ──────────────────────────────────────────────
// 단원설정 모달 - 학년/과목 제한 구조 필수
// ──────────────────────────────────────────────
import { useState } from 'react'
import type { ClassRoom, UnitSetting, CurriculumUnit } from '../types'

interface Props {
  classRoom: ClassRoom
  allUnits: CurriculumUnit[]
  onSave: (setting: UnitSetting) => void
  onClose: () => void
}

const SUBJECTS = ['전체', '국어', '수학', '사회', '과학', '영어']

export default function UnitSettingModal({ classRoom, allUnits, onSave, onClose }: Props) {
  const current = classRoom.unitSetting

  const [subjects, setSubjects] = useState<string[]>(current?.subjects || ['전체'])
  const [semester, setSemester] = useState<1 | 2 | null>(current?.semester ?? null)
  const [fromUnit, setFromUnit] = useState(current?.fromUnit ?? 1)
  const [toUnit, setToUnit] = useState(current?.toUnit ?? 4)

  const singleSubject = subjects.length === 1 && subjects[0] !== '전체' ? subjects[0] : null
  const gradeSubjectUnits = singleSubject ? allUnits.filter(u => u.grade === classRoom.grade && u.subject === singleSubject) : []
  const sem1Units = gradeSubjectUnits.filter(u => u.semester === 1)
  const sem2Units = gradeSubjectUnits.filter(u => u.semester === 2)

  const displayUnits = semester === 1 ? sem1Units : semester === 2 ? sem2Units : gradeSubjectUnits

  const handleSubjectToggle = (s: string) => {
    if (s === '전체') {
      setSubjects(['전체'])
      setSemester(null)
      setFromUnit(1)
      setToUnit(99)
      return
    }
    
    let next = subjects.filter(x => x !== '전체')
    if (next.includes(s)) {
      next = next.filter(x => x !== s)
    } else {
      next.push(s)
    }
    if (next.length === 0) next = ['전체']
    
    setSubjects(next)
    
    if (next.length > 1) {
      setFromUnit(1)
      setToUnit(99)
    } else {
      setFromUnit(1)
      setToUnit(4)
    }
  }

  const handleSave = () => {
    let label = '전체 허용'
    const hasAll = subjects.includes('전체')
    const subjStr = hasAll ? '전체' : subjects.join('·')

    if (!hasAll) {
      if (semester === null) {
        label = `${subjStr} 전체 허용`
      } else {
        if (subjects.length > 1) {
          label = `${subjStr} ${semester}학기 전체`
        } else {
          label = `${subjStr} ${semester}학기 ${fromUnit}~${toUnit}단원`
        }
      }
    }
    
    onSave({
      classId: classRoom.id,
      grade: classRoom.grade,
      subjects: hasAll ? ['전체'] : subjects,
      semester,
      fromUnit: subjects.length > 1 ? 1 : fromUnit,
      toUnit: subjects.length > 1 ? 99 : toUnit,
      label,
    })
  }

  const getSelectedRangeText = () => {
    const hasAll = subjects.includes('전체')
    const subjStr = hasAll ? '전체' : subjects.join('·')

    if (hasAll) return '전체 허용'
    if (semester === null) return `${classRoom.grade}학년 / ${subjStr} / 전체 허용`
    if (subjects.length > 1) return `${classRoom.grade}학년 / ${subjStr} / ${semester}학기 / 전체 단원`
    return `${classRoom.grade}학년 / ${subjStr} / ${semester}학기 / ${fromUnit}단원 ~ ${toUnit}단원`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>단원 설정</h2>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            ⚠️ {classRoom.grade}학년 단원만 선택할 수 있습니다
          </p>
        </div>

        {/* 1. 적용 학급 & 2. 적용 학년 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#fff0f6', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#ff2778', fontWeight: 600, marginBottom: 4 }}>적용 학급</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{classRoom.name}</div>
          </div>
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>적용 학년</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{classRoom.grade}학년</div>
          </div>
        </div>

        {/* 3. 과목 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: '#333', display: 'block', marginBottom: 8 }}>
            과목 선택 (다중 선택 가능)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => handleSubjectToggle(s)}
                style={{
                  flex: '1 1 calc(33.333% - 10px)',
                  padding: '10px 0', borderRadius: 10, border: '2px solid',
                  borderColor: subjects.includes(s) ? '#ff2778' : '#e5e7eb',
                  background: subjects.includes(s) ? '#fff0f6' : 'white',
                  color: subjects.includes(s) ? '#ff2778' : '#555',
                  fontWeight: subjects.includes(s) ? 700 : 500,
                  fontSize: 14, cursor: 'pointer',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 4. 학기 선택 */}
        {!subjects.includes('전체') && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#333', display: 'block', marginBottom: 8 }}>
              학기 선택
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([null, 1, 2] as (null | 1 | 2)[]).map(s => (
                <button
                  key={String(s)}
                  onClick={() => {
                    setSemester(s)
                    setFromUnit(1)
                    if (singleSubject) {
                      const targetUnits = s === 1 ? sem1Units : s === 2 ? sem2Units : gradeSubjectUnits;
                      setToUnit(targetUnits.length > 0 ? Math.max(...targetUnits.map(u => u.unitNumber)) : 4)
                    } else {
                      setToUnit(99)
                    }
                  }}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
                    borderColor: semester === s ? '#ff2778' : '#e5e7eb',
                    background: semester === s ? '#fff0f6' : 'white',
                    color: semester === s ? '#ff2778' : '#555',
                    fontWeight: semester === s ? 700 : 500,
                    fontSize: 14, cursor: 'pointer',
                  }}>
                  {s === null ? '전체' : `${s}학기`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. 단원 범위 선택 */}
        {singleSubject && semester !== null && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#333', display: 'block', marginBottom: 8 }}>
              단원 범위
            </label>
            {displayUnits.length === 0 ? (
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', fontSize: 13, border: '1px solid #e2e8f0' }}>
                해당 과목/학기의 단원 데이터가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select
                  value={fromUnit}
                  onChange={e => setFromUnit(Number(e.target.value))}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, cursor: 'pointer' }}>
                  {displayUnits.map(u => (
                    <option key={u.unitNumber} value={u.unitNumber}>
                      {u.unitNumber}단원 - {u.unitName}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#888', fontWeight: 700 }}>~</span>
                <select
                  value={toUnit}
                  onChange={e => setToUnit(Number(e.target.value))}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, cursor: 'pointer' }}>
                  {displayUnits.filter(u => u.unitNumber >= fromUnit).map(u => (
                    <option key={u.unitNumber} value={u.unitNumber}>
                      {u.unitNumber}단원 - {u.unitName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* 선택 범위 표시 */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#ff2778', fontWeight: 600, background: '#fff0f6', padding: '12px 14px', borderRadius: 8, margin: 0 }}>
            선택 범위: {getSelectedRangeText()}
          </p>
        </div>

        {/* 6. 닫기 / 저장하기 버튼 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb',
            background: 'white', color: '#555', fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}>닫기</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
            background: 'linear-gradient(90deg, #ff2778, #ff6baf)',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,39,120,0.3)',
          }}>저장하기</button>
        </div>
      </div>
    </div>
  )
}
