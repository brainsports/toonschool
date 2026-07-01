// ──────────────────────────────────────────────
// 평가관리 페이지 (툰스쿨 5대 평가영역 기반)
// 메뉴명: 평가관리 (진단평가 금지)
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import type { AssessmentRecord } from '../types/assessment'
import { AREA_LABELS, AREA_COLORS, GROWTH_STAGE_LABELS, GROWTH_STAGE_DESC, getGrowthStage } from '../types/assessment'
import type { ClassRoom } from '../types'
import { fetchClasses } from '../services/classService'
import { fetchAssessmentsByClass } from '../services/assessmentService'
import StudentDetailModal from '../components/StudentDetailModal'

const GRADES = [1, 2, 3, 4, 5, 6]
const PERIODS = ['이번 단원', '이번 달', '이번 학기', '전체 기간']

const stageConfig = {
  seed:   { emoji: '🌱', label: '씨앗', color: '#f59e0b', bg: '#fef3c7' },
  sprout: { emoji: '🌿', label: '새싹', color: '#10b981', bg: '#d1fae5' },
  tree:   { emoji: '🌳', label: '나무', color: '#3b82f6', bg: '#dbeafe' },
  fruit:  { emoji: '🍎', label: '열매', color: '#ec4899', bg: '#fce7f3' },
}

type AreaKey = keyof typeof AREA_LABELS

export default function AssessmentPage() {
  const [allClasses, setAllClasses] = useState<ClassRoom[]>([])
  const [selectedGrade, setSelectedGrade] = useState(5)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('이번 학기')
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [selectedStudent, setSelectedStudent] = useState<AssessmentRecord | null>(null)

  useEffect(() => {
    fetchClasses().then(list => {
      setAllClasses(list)
      const grade5 = list.filter(c => c.grade === 5)
      if (grade5.length > 0) setSelectedClassId(grade5[0].id)
    })
  }, [])

  useEffect(() => {
    const gradeClasses = allClasses.filter(c => c.grade === selectedGrade)
    if (gradeClasses.length > 0) {
      setSelectedClassId(gradeClasses[0].id)
    } else {
      setSelectedClassId('')
      setAssessments([])
    }
  }, [selectedGrade, allClasses])

  useEffect(() => {
    if (selectedClassId) {
      fetchAssessmentsByClass(selectedClassId).then(setAssessments)
    }
  }, [selectedClassId])

  const gradeClasses = allClasses.filter(c => c.grade === selectedGrade)

  // 학급 평균 계산
  const avg = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.totalScore, 0) / assessments.length)
    : 0

  const areaAvg = (key: AreaKey) =>
    assessments.length > 0
      ? Math.round(assessments.reduce((s, a) => s + a.areas[key], 0) / assessments.length)
      : 0

  // 성장 단계 분포
  const stageDist = (['seed', 'sprout', 'tree', 'fruit'] as const).map(stage => ({
    stage,
    count: assessments.filter(a => a.growthStage === stage).length,
  }))

  const areaKeys = Object.keys(AREA_LABELS) as AreaKey[]

  return (
    <div>
      {/* 상단 선택 영역 */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 6 }}>학년 선택</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {GRADES.map(g => (
              <button key={g} onClick={() => setSelectedGrade(g)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '2px solid', borderColor: selectedGrade === g ? '#ff2778' : '#e5e7eb',
                background: selectedGrade === g ? '#fff0f6' : 'white',
                color: selectedGrade === g ? '#ff2778' : '#777',
              }}>{g}학년</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 6 }}>학급 선택</div>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, cursor: 'pointer',
          }}>
            {gradeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 6 }}>평가 기간</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)} style={{
                padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1.5px solid', borderColor: selectedPeriod === p ? '#a78bfa' : '#e5e7eb',
                background: selectedPeriod === p ? '#f5f3ff' : 'white',
                color: selectedPeriod === p ? '#7c3aed' : '#777',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 학급 평균 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* 학급 평균 점수 */}
        <div style={{
          background: 'linear-gradient(135deg,#fff0f6,#fdf4ff)',
          border: '1.5px solid #ffc6de', borderRadius: 16, padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(255,39,120,0.08)',
        }}>
          <div style={{ fontSize: 12, color: '#ff2778', fontWeight: 700, marginBottom: 8 }}>학급 평균 점수</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#ff2778', lineHeight: 1 }}>{avg}</div>
          <div style={{ fontSize: 13, color: '#bbb', marginTop: 4 }}>/ 100점</div>
          <div style={{
            marginTop: 8, display: 'inline-block',
            ...stageConfig[getGrowthStage(avg)],
            padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: stageConfig[getGrowthStage(avg)].bg,
            color: stageConfig[getGrowthStage(avg)].color,
          }}>
            {stageConfig[getGrowthStage(avg)].emoji} {GROWTH_STAGE_LABELS[getGrowthStage(avg)]}
          </div>
        </div>

        {/* 성장 단계 분포 */}
        <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 12 }}>성장 단계 분포</div>
          {stageDist.map(({ stage, count }) => (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{stageConfig[stage].emoji}</span>
              <span style={{ fontSize: 13, color: '#444', fontWeight: 600, width: 40 }}>{stageConfig[stage].label}</span>
              <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 99 }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: assessments.length > 0 ? `${(count / assessments.length) * 100}%` : '0%',
                  background: stageConfig[stage].color, transition: 'width 0.5s',
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, width: 24, textAlign: 'right' }}>{count}명</span>
            </div>
          ))}
        </div>

        {/* 최근 평가일 */}
        <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, marginBottom: 12 }}>최근 평가일</div>
          {assessments.length > 0 ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>
              {assessments.sort((a, b) => b.lastAssessedAt.localeCompare(a.lastAssessedAt))[0].lastAssessedAt}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#bbb' }}>아직 평가 없음</div>
          )}
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 8 }}>평가 완료: {assessments.length}명 / {assessments.length}명</div>
        </div>
      </div>

      {/* 5대 평가영역 카드 */}
      <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px' }}>5대 평가영역 학급 평균</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {areaKeys.map(key => (
            <div key={key} style={{
              background: `${AREA_COLORS[key]}12`,
              border: `1.5px solid ${AREA_COLORS[key]}40`,
              borderRadius: 12, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 6 }}>{AREA_LABELS[key]}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: AREA_COLORS[key], lineHeight: 1 }}>
                {areaAvg(key)}
              </div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>/ 20점</div>
              <div style={{ marginTop: 8, height: 6, background: '#f3f4f6', borderRadius: 99 }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${(areaAvg(key) / 20) * 100}%`,
                  background: AREA_COLORS[key],
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 학생별 평가 목록 */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>학생별 평가 현황</h3>
          <span style={{ fontSize: 13, color: '#aaa' }}>클릭하면 상세 평가서를 볼 수 있어요</span>
        </div>

        {/* 표 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 70px 80px repeat(5, 1fr) 80px',
          padding: '12px 24px', background: '#fafafa',
          borderBottom: '1px solid #f0f0f0', fontSize: 12, fontWeight: 700, color: '#888',
        }}>
          <div>이름</div>
          <div style={{ textAlign: 'center' }}>총점</div>
          <div style={{ textAlign: 'center' }}>단계</div>
          <div style={{ textAlign: 'center' }}>이해력</div>
          <div style={{ textAlign: 'center' }}>요약력</div>
          <div style={{ textAlign: 'center' }}>표현력</div>
          <div style={{ textAlign: 'center' }}>문제해결</div>
          <div style={{ textAlign: 'center' }}>공유태도</div>
          <div style={{ textAlign: 'center' }}>상세보기</div>
        </div>

        {assessments.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            아직 평가 데이터가 없습니다.<br />
            학생들이 단원 학습을 완료하면 자동으로 생성됩니다.
          </div>
        ) : (
          assessments.map((asr, idx) => {
            const stage = stageConfig[asr.growthStage]
            return (
              <div key={asr.id} style={{
                display: 'grid',
                gridTemplateColumns: '100px 70px 80px repeat(5, 1fr) 80px',
                padding: '13px 24px',
                borderBottom: idx < assessments.length - 1 ? '1px solid #f9f9f9' : 'none',
                alignItems: 'center', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onClick={() => setSelectedStudent(asr)}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{asr.studentName}</div>
                <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#ff2778' }}>{asr.totalScore}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    background: stage.bg, color: stage.color, padding: '3px 8px',
                    borderRadius: 99, fontSize: 11, fontWeight: 700,
                  }}>{stage.emoji} {stage.label}</span>
                </div>
                {areaKeys.map(key => (
                  <div key={key} style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: AREA_COLORS[key] }}>
                    {asr.areas[key]}
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>
                  <button style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: '#fff0f6', color: '#ff2778', border: '1px solid #ffc6de', cursor: 'pointer',
                  }}>평가서 보기</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 성장 단계 설명 */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {(Object.keys(stageConfig) as (keyof typeof stageConfig)[]).map(stage => (
          <div key={stage} style={{
            background: stageConfig[stage].bg,
            borderRadius: 12, padding: '12px 16px',
            border: `1px solid ${stageConfig[stage].color}30`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: stageConfig[stage].color, marginBottom: 4 }}>
              {stageConfig[stage].emoji} {GROWTH_STAGE_LABELS[stage]}
            </div>
            <div style={{ fontSize: 12, color: '#555' }}>{GROWTH_STAGE_DESC[stage]}</div>
          </div>
        ))}
      </div>

      {/* 학생 상세 모달 */}
      {selectedStudent && (
        <StudentDetailModal record={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}
