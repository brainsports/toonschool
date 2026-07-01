import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { projectStorage } from '../utils/projectStorage'
import { showToast } from '../utils/toast'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
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
import { useAuth } from '../../../shared/contexts/AuthContext'
import { fetchClasses } from '../../admin-lms/services/classService'
import type { UnitSetting } from '../../admin-lms/types'

import UnitStep1Selection from '../components/unit/UnitStep1Selection'
import UnitStep2Selection from '../components/unit/UnitStep2Selection'

export default function StudentUnitSelectPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projectId, setProjectId] = useState<string>(location.state?.projectId || '')
  const [step, setStep] = useState<1 | 2>(1) // 1단계: 학년/과목, 2단계: 대단원/중단원
  
  // Data State
  const [classUnitSetting, setClassUnitSetting] = useState<UnitSetting | null>(null)
  const [grades, setGrades] = useState<StudentGradeOption[]>([])
  const allSemesters: StudentSemesterOption[] = [
    { id: 'sem-1', label: '1학기', value: 1 },
    { id: 'sem-2', label: '2학기', value: 2 }
  ]
  const semesters = classUnitSetting?.semester 
    ? allSemesters.filter(s => s.value === classUnitSetting.semester)
    : allSemesters

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

  const { user } = useAuth()

  // 0. 학급 단원 설정 조회
  useEffect(() => {
    const fetchClassSetting = async () => {
      // student@test.com은 5학년 1반(cls-7) 소속으로 간주
      let classId = null;
      if (user?.email === 'student@test.com') {
        classId = 'cls-7';
      }
      
      if (!classId) return;

      const classes = await fetchClasses();
      const studentClass = classes.find(c => c.id === classId);
      if (studentClass && studentClass.unitSetting) {
        setClassUnitSetting(studentClass.unitSetting);
      }
    };
    fetchClassSetting();
  }, [user]);

  // 1. 초기 학년 목록 로드
  useEffect(() => {
    const fetchGrades = async () => {
      setLoadState('loading')
      const data = await getStudentGrades()
      
      let filteredData = data
      if (classUnitSetting) {
        filteredData = data.filter(g => g.value === classUnitSetting.grade)
      }
      
      setGrades(filteredData)
      setLoadState('success')
    }
    fetchGrades()
  }, [classUnitSetting])

  // 2. 학년/학기 선택 시 과목 로드
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedGrade || !selectedSemester) {
        setSubjects([])
        return
      }
      setSubjectLoadState('loading')
      const data = await getSubjectsByGradeAndSemester(selectedGrade.value, selectedSemester.value)
      
      let filteredData = data
      if (classUnitSetting && !classUnitSetting.subjects.includes('전체')) {
        filteredData = data.filter(s => classUnitSetting.subjects.includes(s.name))
      }
      
      setSubjects(filteredData)
      setSubjectLoadState('success')
    }
    fetchSubjects()
  }, [selectedGrade, selectedSemester, classUnitSetting])

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
      
      let filteredData = data
      if (classUnitSetting && !classUnitSetting.subjects.includes('전체')) {
        filteredData = data.filter(u => u.unitNumber >= classUnitSetting.fromUnit && u.unitNumber <= classUnitSetting.toUnit)
      }
      
      setMajorUnits(filteredData)
      setLoadState('success')
    }
    fetchMajorUnits()
  }, [selectedGrade, selectedSemester, selectedSubject, step, classUnitSetting])

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

  const actionButtons = step === 1 ? (
    <button
      disabled={!isStep1Complete}
      onClick={handleNextStep}
      className="btn-student btn-student-primary btn-student-md"
    >
      <span>다음 단계 🚀</span>
    </button>
  ) : (
    <button
      disabled={!canProceed}
      onClick={handleProceed}
      className="btn-student btn-student-primary btn-student-md"
    >
      <span>주제 만들기 ✨</span>
    </button>
  )

  return (
    <StudentWorkspaceLayout 
      currentStep="unit" 
      bgVariant="pastel"
      title="어떤 모험을 떠날까요?"
      subtitle={step === 1 ? '1단계: 학년·학기 고르기' : '2단계: 과목과 단원 고르기'}
      onBack={step === 2 ? handlePrevStep : () => navigate('/student/dashboard')}
      actionButtons={actionButtons}
    >
      <div className="flex-1 w-full h-full overflow-y-auto student-scrollbar">
        <div className="w-full pt-8 pb-12 px-4 max-w-[1200px] mx-auto">
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
            />
          )}
        </div>
      </div>
    </StudentWorkspaceLayout>
  )
}