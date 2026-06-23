import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import StudentScriptEditor from '../components/script/StudentScriptEditor'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation } from '../types/studentTopic'
import type { CoverKeyConcept, CoverDialogue } from '../services/studentScriptService'

export default function StudentScriptPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectionData, setSelectionData] = useState<{
    selection: StudentUnitSelection
    topic: TopicRecommendation
    extraRequest?: string
    selectedKeywords?: string[]
  } | null>(null)

  useEffect(() => {
    let data = location.state as any
    if (!data) {
      const stored = localStorage.getItem('studentSelectedTopic')
      if (stored) {
        try {
          data = JSON.parse(stored)
        } catch(e) {}
      }
    }
    
    if (!data || !data.selection || !data.topic) {
      alert('학습 정보가 없습니다. 단원 선택부터 다시 진행해주세요.')
      navigate('/student/select-unit')
      return
    }
    
    setSelectionData(data)
  }, [location.state, navigate])

  if (!selectionData) return null

  const handleNext = (keyConcepts?: CoverKeyConcept[], coverDialogue?: CoverDialogue) => {
    navigate('/student/front-cover', { state: { ...selectionData, keyConcepts, coverDialogue } });
  };

  const handlePrev = () => {
    navigate('/student/topic', { state: selectionData });
  };

  return (
    <StudentCreationLayout currentStep="script" bgVariant="space" maxWidth="full">
      <div className="w-full flex-1 flex flex-col min-h-0 animate-fade-in">
        <StudentScriptEditor 
          selectionData={selectionData}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>
    </StudentCreationLayout>
  )
}
