import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import HalfwayPraiseMessage from '../components/comic/HalfwayPraiseMessage'
import { mockComicCuts } from '../data/studentMockData'
import { getNextCutPath, isHalfwayDone } from '../utils/studentFlowUtils'

import StudentCanvasEditor from '../components/editor/StudentCanvasEditor'
import { loadEditorState, saveEditorState } from '../components/editor/utils/editorStorage'
import type { EditorState, CanvasElement } from '../components/editor/types'
import { v4 as uuidv4 } from 'uuid'

export default function StudentComicCutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cutNumber } = useParams<{ cutNumber: string }>()
  const currentCutNumber = parseInt(cutNumber || '1', 10)

  // 현재 컷 데이터 찾기
  const currentCut = mockComicCuts.find((c) => c.cutNumber === currentCutNumber) || mockComicCuts[0]

  const [showPraise, setShowPraise] = useState(false)

  // 이전 컷 경로
  const backPath = currentCutNumber > 1
    ? `/student/comic/cut/${currentCutNumber - 1}`
    : '/student/front-cover'

  // 다음 장면으로
  const handleNext = () => {
    if (isHalfwayDone(currentCutNumber)) {
      setShowPraise(true)
      setTimeout(() => {
        setShowPraise(false)
        navigate(getNextCutPath(currentCutNumber), { state: location.state })
      }, 2500)
    } else {
      navigate(getNextCutPath(currentCutNumber), { state: location.state })
    }
  }

  const handlePrev = () => {
    navigate(backPath, { state: location.state })
  }

  const storageKey = `canvas_comic_state_cut_${currentCutNumber}`

  const getInitialEditorState = (): EditorState => {
    const saved = loadEditorState(storageKey);
    if (saved) return saved;

    const elements: CanvasElement[] = [];
    
    // 배경 (텍스트/이모지로 대체)
    elements.push({
      id: uuidv4(), type: 'text',
      x: 0, y: 300, width: 1000, height: 1000,
      rotation: 0, zIndex: 1, locked: true, visible: true,
      props: { text: currentCut.backgroundEmoji, fontSize: 400, fill: '#cbd5e1', align: 'center', opacity: 0.3 }
    });

    // 캐릭터 (기본 공식 캐릭터 하나 사용)
    elements.push({
      id: uuidv4(), type: 'image',
      x: 250, y: 400, width: 500, height: 600,
      rotation: 0, zIndex: 5, locked: false, visible: true,
      props: { src: '/images/toonschool/characters/official/hana-teacher.png' }
    });

    // 대사 (가짜 말풍선)
    elements.push({
      id: uuidv4(), type: 'shape',
      x: 50, y: 50, width: 900, height: 250,
      rotation: 0, zIndex: 9, locked: false, visible: true,
      props: { shapeType: 'rect', cornerRadius: 40, fill: '#ffffff', stroke: '#cbd5e1', strokeWidth: 4 }
    });

    elements.push({
      id: 'speech-bubble-text', type: 'text',
      x: 100, y: 100, width: 800, height: 150,
      rotation: 0, zIndex: 10, locked: false, visible: true,
      props: { text: currentCut.speechBubble, fontSize: 50, fill: '#0f172a', fontFamily: 'Pretendard', align: 'center' }
    });

    return {
      version: '1.1',
      elements,
      canvasWidth: 1000,
      canvasHeight: 1000
    };
  };

  return (
    <StudentCreationLayout currentStep="comic" bgVariant="space" maxWidth="full">
      
      <HalfwayPraiseMessage visible={showPraise} />

      <div className="w-full flex-1 flex flex-col min-h-0 animate-fade-in">
        <StudentCanvasEditor 
          initialState={getInitialEditorState()}
          subject={(location.state as any)?.selection?.subjectId || undefined}
          onSave={(state) => saveEditorState(storageKey, state)}
          canvasWidth={1000}
          canvasHeight={1000}
          onPrev={handlePrev}
          onNext={handleNext}
          prevText="이전으로"
          nextText="다음 장면"
        />
      </div>
    </StudentCreationLayout>
  )
}
