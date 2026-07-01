// ──────────────────────────────────────────────
// 학생 평가 상세 모달
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import type { AssessmentRecord, AssessmentReport } from '../types/assessment'
import { AREA_LABELS, AREA_COLORS, GROWTH_STAGE_LABELS, GROWTH_STAGE_DESC } from '../types/assessment'
import { fetchReportByStudent, saveTeacherComment } from '../services/assessmentService'

interface Props {
  record: AssessmentRecord
  onClose: () => void
}

function RadarBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}<span style={{ fontSize: 11, color: '#bbb' }}>/20</span></span>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99 }}>
        <div style={{
          height: '100%', width: `${(score / 20) * 100}%`,
          background: color, borderRadius: 99, transition: 'width 0.6s',
        }} />
      </div>
    </div>
  )
}

export default function StudentDetailModal({ record, onClose }: Props) {
  const [report, setReport] = useState<AssessmentReport | null>(null)
  const [teacherComment, setTeacherComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchReportByStudent(record.studentId).then(r => {
      setReport(r)
      setTeacherComment(r?.teacherComment ?? '')
    })
  }, [record.studentId])

  const handleSave = async () => {
    if (!report) return
    setSaving(true)
    await saveTeacherComment(report.id, teacherComment)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const areaKeys = Object.keys(AREA_LABELS) as (keyof typeof AREA_LABELS)[]
  const stageBg: Record<string, string> = {
    seed: '#fef3c7', sprout: '#d1fae5', tree: '#dbeafe', fruit: '#fce7f3',
  }
  const stageColor: Record<string, string> = {
    seed: '#d97706', sprout: '#059669', tree: '#2563eb', fruit: '#db2777',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      overflowY: 'auto', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 600,
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)', position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* 닫기 버튼 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%',
          border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#666',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: stageBg[record.growthStage] ?? '#fce7f3',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {record.growthStage === 'seed' ? '🌱' : record.growthStage === 'sprout' ? '🌿' : record.growthStage === 'tree' ? '🌳' : '🍎'}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>{record.studentName}</h2>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{record.className} · {record.period}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#ff2778', lineHeight: 1 }}>{record.totalScore}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>/ 100점</div>
          </div>
        </div>

        {/* 성장 단계 배지 */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: stageBg[record.growthStage], borderRadius: 99,
          padding: '6px 16px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: stageColor[record.growthStage] }}>
            {GROWTH_STAGE_LABELS[record.growthStage]}
          </span>
          <span style={{ fontSize: 12, color: stageColor[record.growthStage], opacity: 0.8 }}>
            {GROWTH_STAGE_DESC[record.growthStage]}
          </span>
        </div>

        {/* 초기 vs 현재 성장 */}
        {record.initialScore !== undefined && (
          <div style={{
            background: '#f0fdf4', borderRadius: 12, padding: '10px 16px',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: '#666' }}>📈 성장 변화:</span>
            <span style={{ fontSize: 13, color: '#888' }}>처음 {record.initialScore}점</span>
            <span style={{ color: '#d1d5db' }}>→</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>현재 {record.totalScore}점</span>
            <span style={{ fontSize: 13, color: '#16a34a', background: '#bbf7d0', borderRadius: 99, padding: '2px 10px' }}>
              +{record.totalScore - record.initialScore}점
            </span>
          </div>
        )}

        {/* 5대 영역별 점수 */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 14 }}>5대 평가 영역</h3>
          {areaKeys.map(key => (
            <RadarBar
              key={key}
              label={AREA_LABELS[key]}
              score={record.areas[key]}
              color={AREA_COLORS[key]}
            />
          ))}
        </div>

        {/* AI 300자 성장 평가서 */}
        {report && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              🤖 AI 성장 평가서
            </h3>
            <div style={{
              background: 'linear-gradient(135deg, #fff0f6, #fdf4ff)',
              borderRadius: 12, padding: 16, border: '1px solid #ffc6de',
              fontSize: 14, color: '#444', lineHeight: 1.7,
            }}>
              {report.aiComment}
            </div>
          </div>
        )}

        {/* 선생님 한 줄 의견 */}
        {report && (
          <div style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              ✍️ 선생님 한 줄 의견
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="선생님의 한 줄 의견을 입력해 주세요..."
                value={teacherComment}
                onChange={e => setTeacherComment(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                }} />
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: saved ? '#22c55e' : 'linear-gradient(90deg, #ff2778, #ff6baf)',
                  color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {saved ? '저장됨 ✓' : saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {!report && (
          <div style={{
            background: '#fffbeb', borderRadius: 12, padding: 16,
            border: '1px dashed #fbbf24', fontSize: 13, color: '#92400e', textAlign: 'center',
          }}>
            아직 평가 기록이 없습니다. 학생이 단원 학습을 완료하면 자동으로 생성됩니다.
          </div>
        )}
      </div>
    </div>
  )
}
