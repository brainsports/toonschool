import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { projectStorage } from '../utils/projectStorage'
import { showToast } from '../utils/toast'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import type { 
  StudentGradeOption, 
  StudentSemesterOption,
  StudentSubjectOption, 
  StudentMajorUnitOption, 
  StudentMiddleUnitOption,
  StudentUnitSelection,
  CurriculumLoadState
} from '../types/studentCurriculum'
import { 
  getStudentGrades, 
  getSubjectsByGradeAndSemester, 
  getMajorUnitsByGradeSemesterAndSubject, 
  getMiddleUnitsByMajorUnit 
} from '../services/studentCurriculumService'

import UnitStep1Selection from '../components/unit/UnitStep1Selection'
import UnitStep2Selection from '../components/unit/UnitStep2Selection'

export default function StudentUnitSelectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projectId, setProjectId] = useState<string>(location.state?.projectId || '')
  const [step, setStep] = useState<1 | 2>(1) // 1단계: 학년/과목, 2단계: 대단원/중단원
  
  // Data State
  const [grades, setGrades] = useState<StudentGradeOption[]>([])
  const semesters: StudentSemesterOption[] = [
    { id: 'sem-1', label: '1학기', value: 1 },
    { id: 'sem-2', label: '2학기', value: 2 }
  ]
  const [subjects, setSubjects] = useState<StudentSubjectOption[]>([])
  const [majorUnits, setMajorUnits] = useState<StudentMajorUnitOption[]>([])
  const [middleUnits, setMiddleUnits] = useState<StudentMiddleUnitOption[]>([])

  // Selection State
  const [selectedGrade, setSelectedGrade] = useState<StudentGradeOption | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<StudentSemesterOption | null>(null)
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

  // 2. 학년/학기 선택 시 과목 로드
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedGrade || !selectedSemester) {
        setSubjects([])
        return
      }
      setSubjectLoadState('loading')
      const data = await getSubjectsByGradeAndSemester(selectedGrade.value, selectedSemester.value)
      setSubjects(data)
      setSubjectLoadState('success')
    }
    fetchSubjects()
  }, [selectedGrade, selectedSemester])

  // 3. 2단계 진입 및 과목 선택 완료 시 대단원 로드
  useEffect(() => {
    const fetchMajorUnits = async () => {
      if (!selectedGrade || !selectedSemester || !selectedSubject || step !== 2) return
      setLoadState('loading')
      const data = await getMajorUnitsByGradeSemesterAndSubject(
        selectedGrade.value, 
        selectedSemester.value, 
        selectedSubject.id,
        selectedSubject.code
      )
      setMajorUnits(data)
      setLoadState('success')
    }
    fetchMajorUnits()
  }, [selectedGrade, selectedSemester, selectedSubject, step])

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

  // 5. 숨겨진 중단원이 이미 선택된 상태라면 선택 해제
  useEffect(() => {
    if (selectedMiddleUnit && middleUnits.length > 0) {
      const exists = middleUnits.some(u => u.id === selectedMiddleUnit.id)
      if (!exists) {
        setSelectedMiddleUnit(null)
      }
    }
  }, [middleUnits, selectedMiddleUnit])


  // 핸들러 함수들
  const handleGradeSelect = (g: StudentGradeOption) => {
    setSelectedGrade(g)
    setSelectedSemester(null)
    setSelectedSubject(null)
    setSelectedMajorUnit(null)
    setSelectedMiddleUnit(null)
  }

  const handleSemesterSelect = (s: StudentSemesterOption) => {
    setSelectedSemester(s)
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

  const isStep1Complete = !!(selectedGrade && selectedSemester)
  const isStep2Complete = !!(selectedSubject && selectedMajorUnit && selectedMiddleUnit)
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
      semesterValue: selectedSemester?.value || null,
      semesterName: selectedSemester?.label || null,
      subjectId: selectedSubject?.id || null,
      subjectName: selectedSubject?.name || null,
      majorUnitId: selectedMajorUnit?.id || null,
      majorUnitName: selectedMajorUnit?.unitName || null,
      middleUnitId: selectedMiddleUnit?.id || null,
      middleUnitName: selectedMiddleUnit?.subunitName || null
    }

    const currentProjectId = projectId || uuidv4()
    if (!projectId) {
      setProjectId(currentProjectId)
    }

    const success = projectStorage.saveUnit(currentProjectId, selection)
    if (!success) {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.')
      return
    }
    
    showToast('저장되었습니다')
    
    // 기존 호환성 유지용
    localStorage.setItem('studentUnitSelection', JSON.stringify(selection))

    // state로 데이터 및 projectId 전달
    navigate('/student/topic', { state: { selection, projectId: currentProjectId } })
  }

  return (
    <StudentCreationLayout currentStep="unit" bgVariant="pastel" maxWidth="full">
      <div className="flex-1 w-full h-full overflow-y-auto pr-4 lg:pr-8">
        <div className="w-full pt-[40px] md:pt-[56px] pb-[48px] px-4 max-w-5xl mx-auto">
          {/* 상단 제목 영역 */}
          <div className="text-center">
            <h1 className="text-[2rem] md:text-[2.15rem] font-jua text-[#202330]">
              어떤 모험을 떠날까요?
            </h1>

            <p className="text-base font-bold text-[#626776] mt-[16px] bg-white border border-[rgba(111,78,190,0.18)] inline-block px-5 py-1.5 rounded-full">
              {step === 1 ? '1단계: 학년·학기 고르기' : '2단계: 과목과 단원 고르기'}
            </p>
          </div>

          <div className="mt-[32px]">
          {step === 1 ? (
            <UnitStep1Selection
              grades={grades}
              semesters={semesters}
              selectedGrade={selectedGrade}
              selectedSemester={selectedSemester}
              loadState={loadState}
              gradeEmojis={gradeEmojis}
              onGradeSelect={handleGradeSelect}
              onSemesterSelect={handleSemesterSelect}
              onNextStep={handleNextStep}
              isStep1Complete={isStep1Complete}
            />
          ) : (
            <UnitStep2Selection
              selectedGrade={selectedGrade}
              selectedSemester={selectedSemester}
              subjects={subjects}
              selectedSubject={selectedSubject}
              majorUnits={majorUnits}
              middleUnits={middleUnits}
              selectedMajorUnit={selectedMajorUnit}
              selectedMiddleUnit={selectedMiddleUnit}
              loadState={loadState}
              subjectLoadState={subjectLoadState}
              gradeEmojis={gradeEmojis}
              subjectEmojis={subjectEmojis}
              onSubjectSelect={handleSubjectSelect}
              onMajorUnitSelect={handleMajorUnitSelect}
              onMiddleUnitSelect={handleMiddleUnitSelect}
              onPrevStep={handlePrevStep}
              onProceed={handleProceed}
              canProceed={canProceed}
            />
          )}
          </div>
        </div>
      </div>
    </StudentCreationLayout>
  )
}