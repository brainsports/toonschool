import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import type { 
  StudentGradeOption, 
  StudentSubjectOption, 
  StudentMajorUnitOption, 
  StudentMiddleUnitOption,
  StudentUnitSelection,
  CurriculumLoadState
} from '../types/studentCurriculum'
import { 
  getStudentGrades, 
  getSubjectsByGrade, 
  getMajorUnitsByGradeAndSubject, 
  getMiddleUnitsByMajorUnit 
} from '../services/studentCurriculumService'

import UnitStep1Selection from '../components/unit/UnitStep1Selection'
import UnitStep2Selection from '../components/unit/UnitStep2Selection'

export default function StudentUnitSelectPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1) // 1단계: 학년/과목, 2단계: 대단원/중단원
  
  // Data State
  const [grades, setGrades] = useState<StudentGradeOption[]>([])
  const [subjects, setSubjects] = useState<StudentSubjectOption[]>([])
  const [majorUnits, setMajorUnits] = useState<StudentMajorUnitOption[]>([])
  const [middleUnits, setMiddleUnits] = useState<StudentMiddleUnitOption[]>([])

  // Selection State
  const [selectedGrade, setSelectedGrade] = useState<StudentGradeOption | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<StudentSubjectOption | null>(null)
  const [selectedMajorUnit, setSelectedMajorUnit] = useState<StudentMajorUnitOption | null>(null)
  const [selectedMiddleUnit, setSelectedMiddleUnit] = useState<StudentMiddleUnitOption | null>(null)

  // Loading States
  const [loadState, setLoadState] = useState<CurriculumLoadState>('idle')
  const [subjectLoadState, setSubjectLoadState] = useState<CurriculumLoadState>('idle')

  const gradeEmojis: Record<string, string> = {
    '초3': '🎒', '초4': '🏫', '초5': '🚀', '초6': '🎓'
  }

  const subjectEmojis: Record<string, string> = {
    '국어': '✏️', '영어': '🌍', '수학': '📐', '사회': '🗺️', '과학': '🔬'
  }

  // 1. 초기 학년 목록 로드
  useEffect(() => {
    const fetchGrades = async () => {
      setLoadState('loading')
      const data = await getStudentGrades()
      setGrades(data)
      setLoadState('success')
    }
    fetchGrades()
  }, [])

  // 2. 학년 선택 시 과목 로드
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedGrade) {
        setSubjects([])
        return
      }
      setSubjectLoadState('loading')
      const data = await getSubjectsByGrade(selectedGrade.value)
      setSubjects(data)
      setSubjectLoadState('success')
    }
    fetchSubjects()
  }, [selectedGrade])

  // 3. 2단계 진입 및 과목 선택 완료 시 대단원 로드
  useEffect(() => {
    const fetchMajorUnits = async () => {
      if (!selectedGrade || !selectedSubject || step !== 2) return
      setLoadState('loading')
      const data = await getMajorUnitsByGradeAndSubject(selectedGrade.value, selectedSubject.id)
      setMajorUnits(data)
      setLoadState('success')
    }
    fetchMajorUnits()
  }, [selectedGrade, selectedSubject, step])

  // 4. 대단원 선택 시 중단원 로드
  useEffect(() => {
    const fetchMiddleUnits = async () => {
      if (!selectedMajorUnit) {
        setMiddleUnits([])
        return
      }
      setLoadState('loading')
      const data = await getMiddleUnitsByMajorUnit(selectedMajorUnit.id)
      setMiddleUnits(data)
      setLoadState('success')
    }
    fetchMiddleUnits()
  }, [selectedMajorUnit])


  // 핸들러 함수들
  const handleGradeSelect = (g: StudentGradeOption) => {
    setSelectedGrade(g)
    setSelectedSubject(null)
    setSelectedMajorUnit(null)
    setSelectedMiddleUnit(null)
  }

  const handleSubjectSelect = (s: StudentSubjectOption) => {
    setSelectedSubject(s)
    setSelectedMajorUnit(null)
    setSelectedMiddleUnit(null)
  }

  const handleMajorUnitSelect = (id: string) => {
    const mu = majorUnits.find(u => u.id === id) || null
    setSelectedMajorUnit(mu)
    setSelectedMiddleUnit(null)
  }

  const handleMiddleUnitSelect = (id: string) => {
    const mu = middleUnits.find(u => u.id === id) || null
    setSelectedMiddleUnit(mu)
  }

  const isStep1Complete = !!(selectedGrade && selectedSubject)
  const isStep2Complete = !!(selectedMajorUnit && selectedMiddleUnit)
  const canProceed = isStep1Complete && isStep2Complete

  const handleNextStep = () => {
    if (step === 1 && isStep1Complete) {
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleProceed = () => {
    if (!canProceed) return
    const selection: StudentUnitSelection = {
      gradeValue: selectedGrade?.value || null,
      gradeName: selectedGrade?.label || null,
      subjectId: selectedSubject?.id || null,
      subjectName: selectedSubject?.name || null,
      majorUnitId: selectedMajorUnit?.id || null,
      majorUnitName: selectedMajorUnit?.unitName || null,
      middleUnitId: selectedMiddleUnit?.id || null,
      middleUnitName: selectedMiddleUnit?.subunitName || null
    }
    
    // localStorage에 저장 (새로고침 시 유지하기 위함)
    localStorage.setItem('studentUnitSelection', JSON.stringify(selection))

    // state로도 전달
    navigate('/student/topic', { state: { selection } })
  }

  return (
    <StudentCreationLayout currentStep="unit" bgVariant="space" maxWidth="full">
      <div className="w-full">
        {/* 상단 제목 영역 */}
        <div className="text-center mb-8">
          <h1 className="text-[2rem] md:text-[2.15rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            어떤 모험을 떠날까요?
          </h1>

          <p className="text-base font-bold text-slate-200 mt-3 bg-white/10 backdrop-blur-md border border-white/20 inline-block px-5 py-1.5 rounded-full">
            {step === 1 ? '1단계: 학년과 과목 고르기' : '2단계: 단원 고르기'}
          </p>
        </div>

        {step === 1 ? (
          <UnitStep1Selection
            grades={grades}
            subjects={subjects}
            selectedGrade={selectedGrade}
            selectedSubject={selectedSubject}
            loadState={loadState}
            subjectLoadState={subjectLoadState}
            gradeEmojis={gradeEmojis}
            subjectEmojis={subjectEmojis}
            onGradeSelect={handleGradeSelect}
            onSubjectSelect={handleSubjectSelect}
            onNextStep={handleNextStep}
            isStep1Complete={isStep1Complete}
          />
        ) : (
          <UnitStep2Selection
            selectedGrade={selectedGrade}
            selectedSubject={selectedSubject}
            majorUnits={majorUnits}
            middleUnits={middleUnits}
            selectedMajorUnit={selectedMajorUnit}
            selectedMiddleUnit={selectedMiddleUnit}
            loadState={loadState}
            gradeEmojis={gradeEmojis}
            subjectEmojis={subjectEmojis}
            onMajorUnitSelect={handleMajorUnitSelect}
            onMiddleUnitSelect={handleMiddleUnitSelect}
            onPrevStep={handlePrevStep}
            onProceed={handleProceed}
            canProceed={canProceed}
          />
        )}
      </div>
    </StudentCreationLayout>
  )
}