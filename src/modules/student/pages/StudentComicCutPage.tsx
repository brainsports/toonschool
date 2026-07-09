import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import HalfwayPraiseMessage from '../components/comic/HalfwayPraiseMessage'
import ComicCutEditor from '../components/comic-editor/ComicCutEditor'
import HiddenItemEncounter from '../components/reward/HiddenItemEncounter'

function getHiddenEncounterSourceId(selectionData: any) {
  const comicId = selectionData?.comicId || selectionData?.comic?.id || selectionData?.projectId
  if (comicId) return `comic:${comicId}`

  const topicId = selectionData?.topic?.id || 'draft'
  const storageKey = `toonschool:hidden-encounter-source:${topicId}`
  const stored = localStorage.getItem(storageKey)
  if (stored) return stored

  const sessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const sourceId = `comic-draft:${topicId}:${sessionId}`
  localStorage.setItem(storageKey, sourceId)
  return sourceId
}
export default function StudentComicCutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
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
  const studentId = profile?.role === 'student' ? profile.id : user?.id
  const hiddenEncounterSourceId = useMemo(
    () => (selectionData ? getHiddenEncounterSourceId(selectionData) : null),
    [selectionData]
  )

  if (!selectionData) return null;

  return (
    <>
      <HalfwayPraiseMessage visible={showPraise} />
      <HiddenItemEncounter
        studentId={studentId}
        sourceId={hiddenEncounterSourceId}
        enabled={Boolean(studentId && hiddenEncounterSourceId)}
      />
      <ComicCutEditor 
        key={`comic-cut-editor-${currentCutNumber}`}
        topicId={topicId}
        cutNumber={currentCutNumber}
        scriptData={scriptData}
      />
    </>
  )
}
