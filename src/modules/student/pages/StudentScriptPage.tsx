import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentScriptEditor from '../components/script/StudentScriptEditor'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation } from '../types/studentTopic'
import type { CoverKeyConcept, CoverDialogue } from '../services/studentScriptService'
import { projectStorage } from '../utils/projectStorage'

export default function StudentScriptPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectionData, setSelectionData] = useState<{
    selection: StudentUnitSelection
    topic: TopicRecommendation
    extraRequest?: string
    selectedKeywords?: string[]
    projectId?: string
  } | null>(null)

  const [projectId] = useState<string>(location.state?.projectId || '')

  useEffect(() => {
    let data = location.state as any
    
    if (!data || !data.selection) {
      if (projectId) {
        const savedData = projectStorage.loadTopic<any>(projectId)
        if (savedData) {
          data = savedData
        }
      }
    }

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
    navigate('/student/front-cover', { state: { ...selectionData, keyConcepts, coverDialogue, projectId } });
  };

  const handlePrev = () => {
    navigate('/student/topic', { state: { ...selectionData, projectId } });
  };

  return (
    <StudentScriptEditor 
      selectionData={selectionData}
      projectId={projectId}
      onPrev={handlePrev}
      onNext={handleNext}
    />
  )
}
