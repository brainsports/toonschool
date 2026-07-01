// ──────────────────────────────────────────────
// 단원설정 모달 - 학년 제한 구조 필수
// ──────────────────────────────────────────────
import { useState } from 'react'
import type { ClassRoom, UnitSetting, CurriculumUnit } from '../types'

interface Props {
  classRoom: ClassRoom
  allUnits: CurriculumUnit[]
  onSave: (setting: UnitSetting) => void
  onClose: () => void
}

export default function UnitSettingModal({ classRoom, allUnits, onSave, onClose }: Props) {
  // 해당 학년 단원만 필터링 (학년 제한)
  const gradeUnits = allUnits.filter(u => u.grade === classRoom.grade)
  const sem1Units = gradeUnits.filter(u => u.semester === 1)
  const sem2Units = gradeUnits.filter(u => u.semester === 2)

  const current = classRoom.unitSetting
  const [semester, setSemester] = useState<1 | 2 | null>(current?.semester ?? null)
  const [fromUnit, setFromUnit] = useState(current?.fromUnit ?? 1)
  const [toUnit, setToUnit] = useState(current?.toUnit ?? ((semester === 1 ? sem1Units.length : sem2Units.length) || 4))

  const displayUnits = semester === 1 ? sem1Units : semester === 2 ? sem2Units : gradeUnits

  const handleSave = () => {
    const label = semester
      ? `${classRoom.grade}학년 ${semester}학기 ${fromUnit}~${toUnit}단원`
      : `${classRoom.grade}학년 전체`
    onSave({
      classId: classRoom.id,
      grade: classRoom.grade,
      semester,
      fromUnit,
      toUnit,
      label,
    })
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

        {/* 적용 학급 */}
        <div style={{ background: '#fff0f6', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#ff2778', fontWeight: 600 }}>적용 학급: </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{classRoom.name}</span>
        </div>

        {/* 현재 설정 */}
        {current && (
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', marginBottom: 20, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>현재 설정: </span>
            <span style={{ fontSize: 13, color: '#333' }}>{current.label}</span>
          </div>
        )}

        {/* 학기 선택 */}
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
                  setToUnit(s === 1 ? sem1Units.length : s === 2 ? sem2Units.length : gradeUnits.length)
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

        {/* 단원 범위 선택 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: '#333', display: 'block', marginBottom: 8 }}>
            단원 범위 ({classRoom.grade}학년{semester ? ` ${semester}학기` : ''})
          </label>
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
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
            선택 범위: {classRoom.grade}학년 {semester ? `${semester}학기 ` : ''}{fromUnit}~{toUnit}단원
          </p>
        </div>

        {/* 버튼 */}
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
