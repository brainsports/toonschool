import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation } from '../types/studentTopic'

import StudentCanvasEditor from '../components/editor/StudentCanvasEditor'
import { loadEditorState, saveEditorState } from '../components/editor/utils/editorStorage'
import type { EditorState, CanvasElement } from '../components/editor/types'
import { v4 as uuidv4 } from 'uuid'

// Removed subjectKeyMap

export default function StudentFrontCoverPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectionData, setSelectionData] = useState<{
    selection: StudentUnitSelection
    topic: TopicRecommendation
    extraRequest?: string
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

  const { selection, topic } = selectionData
  
  const studentName = '학생';

  const handleNext = () => {
    navigate('/student/comic/cut/1', { state: selectionData });
  };

  const handlePrev = () => {
    navigate('/student/topic', { state: selectionData });
  };

  const storageKey = `canvas_cover_state_${topic?.id || 'default'}`;

  const getInitialEditorState = (): EditorState => {
    const saved = loadEditorState(storageKey);
    if (saved) return saved;

    const elements: CanvasElement[] = [];
    
    // 학년, 과목
    elements.push({
      id: uuidv4(), type: 'text',
      x: 100, y: 200, width: 1200, height: 100,
      rotation: 0, zIndex: 10, locked: false, visible: true,
      props: { text: `${selection.gradeName} ${selection.subjectName}`, fontSize: 60, fill: '#4c1d95', fontFamily: 'Pretendard', align: 'center' }
    });

    // 대단원명
    elements.push({
      id: uuidv4(), type: 'text',
      x: 100, y: 300, width: 1200, height: 100,
      rotation: 0, zIndex: 11, locked: false, visible: true,
      props: { text: selection.majorUnitName, fontSize: 80, fill: '#1e293b', fontFamily: 'Pretendard', align: 'center' }
    });

    // 작품 제목
    elements.push({
      id: uuidv4(), type: 'text',
      x: 100, y: 600, width: 1200, height: 200,
      rotation: 0, zIndex: 12, locked: false, visible: true,
      props: { text: topic.title, fontSize: 120, fill: '#0f172a', fontFamily: 'Pretendard', align: 'center' }
    });

    // 지은이
    elements.push({
      id: uuidv4(), type: 'text',
      x: 800, y: 1700, width: 500, height: 100,
      rotation: 0, zIndex: 13, locked: false, visible: true,
      props: { text: `지은이: ${studentName}`, fontSize: 50, fill: '#1e293b', fontFamily: 'Pretendard', align: 'right' }
    });

    return {
      version: '1.1',
      elements,
      coverTemplateId: 'common-01',
      canvasWidth: 1400,
      canvasHeight: 1980
    };
  };

  return (
    <StudentCreationLayout currentStep="frontCover" bgVariant="space" maxWidth="full">
      {/* 
        h-[calc(100vh-80px)] or something to fill the screen. 
        Since StudentCreationLayout adds pt-6 md:pt-12, let's use h-[calc(100vh-140px)] or h-[80vh] min-h-[600px] 
      */}
      <div className="w-full flex-1 flex flex-col min-h-0 animate-fade-in">
        <StudentCanvasEditor 
          mode="front-cover"
          subject={selection?.subjectId || undefined}
          initialState={getInitialEditorState()}
          onSave={(state) => saveEditorState(storageKey, state)}
          onPrev={handlePrev}
          onNext={handleNext}
          prevText="이전으로"
          nextText="만화 만들기"
        />
      </div>
    </StudentCreationLayout>
  )
}
