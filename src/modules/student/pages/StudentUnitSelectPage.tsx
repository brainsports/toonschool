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
import CreativeSetupWorkspace from '../components/unit/CreativeSetupWorkspace'
import type { CreativeStorySettings } from '../data/creativeCategories'

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
  const semesters = allSemesters

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
    '국어': '✏️', '영어': '🌍', '수학': '📐', '사회': '🗺️', '과학': '🔬', '창작': '🎨'
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
      const studentClass = classes.find((c: any) => c.id === classId);
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
      // '창작' 과목은 자유 주제(단원 데이터 없음) — DB subjects 행이 없어도 항상 노출.
      const withCreative = data.some((s) => s.name === '창작')
        ? data
        : [...data, { id: 'creative', name: '창작', code: 'CREATIVE' }]

      setSubjects(withCreative)
      setSubjectLoadState('success')
    }
    fetchSubjects()
  }, [selectedGrade, selectedSemester])

  // 3. 2단계 진입 및 과목 선택 완료 시 대단원 로드
  useEffect(() => {
    const fetchMajorUnits = async () => {
      if (!selectedGrade || !selectedSemester || !selectedSubject || step !== 2) return
      // '창작' 과목은 자유 주제 — 단원/중단원 데이터가 없으므로 조회하지 않는다.
      if (selectedSubject.name === '창작') {
        setMajorUnits([])
        setSelectedMajorUnit(null)
        setSelectedMiddleUnit(null)
        setLoadState('success')
        return
      }
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

  // 3.5. 자동 선택 로직
  useEffect(() => {
    if (grades.length > 0 && classUnitSetting && !selectedGrade) {
      const defaultGrade = grades.find(g => g.value === classUnitSetting.grade)
      if (defaultGrade) setSelectedGrade(defaultGrade)
    }
  }, [grades, classUnitSetting, selectedGrade])

  useEffect(() => {
    if (classUnitSetting && !selectedSemester) {
      const defaultSemester = allSemesters.find(s => s.value === classUnitSetting.semester)
      if (defaultSemester) setSelectedSemester(defaultSemester)
    }
  }, [classUnitSetting, selectedSemester])

  useEffect(() => {
    if (subjects.length > 0 && classUnitSetting && !selectedSubject) {
      let defaultSubject = null;
      if (classUnitSetting.subjects.includes('전체')) {
        defaultSubject = subjects[0]
      } else {
        const firstAllowed = classUnitSetting.subjects[0]
        if (firstAllowed) {
          defaultSubject = subjects.find(s => s.name === firstAllowed)
        }
      }
      if (defaultSubject) setSelectedSubject(defaultSubject)
    }
  }, [subjects, classUnitSetting, selectedSubject])

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
  // '창작' 과목은 자유 주제 — 대단원/중단원 선택 없이 바로 진입 가능.
  const isCreativeSubject = selectedSubject?.name === '창작'
  const isStep2Complete = isCreativeSubject
    ? !!selectedSubject
    : !!(selectedSubject && selectedMajorUnit && selectedMiddleUnit)
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
      // '창작' 과목은 자유 주제 — 가상 단원값을 넣어 하위 파이프라인(주제/대본/만화)이 null-safe 동작.
      majorUnitId: isCreativeSubject ? 'creative-free' : (selectedMajorUnit?.id || null),
      majorUnitName: isCreativeSubject ? '자유 주제' : (selectedMajorUnit?.unitName || null),
      middleUnitId: isCreativeSubject ? 'creative-free' : (selectedMiddleUnit?.id || null),
      middleUnitName: isCreativeSubject ? '자유 주제' : (selectedMiddleUnit?.subunitName || null)
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

  // '창작'은 단원 선택 대신 CreativeSetupWorkspace 에서 분야·세부설정을 받아 주제 만들기로 이동.
  // 이전 단원/학습목표 기반이 아니라 creativeSettings 기반 흐름으로 전환.
  const handleProceedCreative = (creativeSettings: CreativeStorySettings) => {
    const currentProjectId = projectId || uuidv4()
    if (!projectId) setProjectId(currentProjectId)
    const selection: StudentUnitSelection = {
      gradeValue: selectedGrade?.value || null,
      gradeName: selectedGrade?.label || null,
      semesterValue: selectedSemester?.value || null,
      semesterName: selectedSemester?.label || null,
      subjectId: selectedSubject?.id || null,
      subjectName: selectedSubject?.name || null,
      majorUnitId: 'creative-free',
      majorUnitName: '자유 주제',
      middleUnitId: 'creative-free',
      middleUnitName: '자유 주제',
    }
    const success = projectStorage.saveUnit(currentProjectId, selection)
    if (!success) {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.')
      return
    }
    projectStorage.saveCreativeSettings(currentProjectId, creativeSettings)
    showToast('저장되었습니다')
    localStorage.setItem('studentUnitSelection', JSON.stringify(selection))
    navigate('/student/topic', { state: { selection, projectId: currentProjectId, creativeSettings } })
  }

  // '창작'은 CreativeSetupWorkspace 내부 진행 버튼이 주제 만들기를 처리하므로 상단 액션 버튼 숨김.
  const actionButtons = (isCreativeSubject && step === 2)
    ? null
    : step === 1 ? (
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
      title={isCreativeSubject && step === 2 ? '어떤 이야기를 만들어 볼까요?' : '어떤 모험을 떠날까요?'}
      subtitle={step === 1 ? '1단계: 학년·학기 고르기' : isCreativeSubject ? '2단계: 창작 분야와 이야기 설정 고르기' : '2단계: 과목과 단원 고르기'}
      onBack={step === 2 ? handlePrevStep : () => navigate('/student/dashboard')}
      actionButtons={actionButtons ?? undefined}
    >
      <div className="flex-1 w-full h-full overflow-y-auto student-scrollbar">
        {step === 1 ? (
          <div className="w-full pt-8 pb-12 px-4 max-w-[1200px] mx-auto">
            <UnitStep1Selection
              grades={grades}
              semesters={semesters}
              selectedGrade={selectedGrade}
              selectedSemester={selectedSemester}
              loadState={loadState}
              gradeEmojis={gradeEmojis}
              classUnitSetting={classUnitSetting}
              onGradeSelect={handleGradeSelect}
              onSemesterSelect={handleSemesterSelect}
            />
          </div>
        ) : isCreativeSubject ? (
          <CreativeSetupWorkspace
            projectId={projectId}
            gradeName={selectedGrade?.label}
            initial={projectId ? projectStorage.loadCreativeSettings<CreativeStorySettings>(projectId) : null}
            onComplete={handleProceedCreative}
            onBack={handlePrevStep}
          />
        ) : (
          <div className="w-full pt-8 pb-12 px-4 max-w-[1200px] mx-auto">
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
              classUnitSetting={classUnitSetting}
              onSubjectSelect={handleSubjectSelect}
              onMajorUnitSelect={handleMajorUnitSelect}
              onMiddleUnitSelect={handleMiddleUnitSelect}
            />
          </div>
        )}
      </div>
    </StudentWorkspaceLayout>
  )
}