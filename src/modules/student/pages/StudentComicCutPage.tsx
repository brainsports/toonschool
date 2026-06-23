import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import HalfwayPraiseMessage from '../components/comic/HalfwayPraiseMessage'
import ComicCutEditor from '../components/comic-editor/ComicCutEditor'

export default function StudentComicCutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cutNumber } = useParams<{ cutNumber: string }>()
  const currentCutNumber = parseInt(cutNumber || '1', 10)

  const [selectionData, setSelectionData] = useState<any>(null)
  const [scriptData, setScriptData] = useState<any>(null)
  const showPraise = false;

  useEffect(() => {
    let data = location.state
    if (!data) {
      const stored = localStorage.getItem('studentSelectedTopic')
      if (stored) {
        try { data = JSON.parse(stored) } catch(e) {}
      }
    }
    
    if (!data || !data.selection || !data.topic) {
      alert('학습 정보가 없습니다. 단원 선택부터 다시 진행해주세요.')
      navigate('/student/select-unit')
      return
    }
    setSelectionData(data)

    const scriptStored = localStorage.getItem('studentScript')
    if (scriptStored) {
      try {
        setScriptData(JSON.parse(scriptStored))
      } catch(e) {}
    }
  }, [location.state, navigate])

  const topicId = selectionData?.topic?.id || 'default'

  if (!selectionData) return null;

  return (
    <StudentCreationLayout currentStep="comic" bgVariant="space" maxWidth="full">
      <HalfwayPraiseMessage visible={showPraise} />

      <div className="w-full flex-1 flex flex-col min-h-0 animate-fade-in relative">
        <ComicCutEditor 
          key={`comic-cut-editor-${currentCutNumber}`}
          topicId={topicId}
          cutNumber={currentCutNumber}
          scriptData={scriptData}
        />
      </div>
    </StudentCreationLayout>
  )
}
