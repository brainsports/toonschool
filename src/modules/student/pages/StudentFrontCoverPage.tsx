import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation } from '../types/studentTopic'

import StudentCanvasEditor from '../components/editor/StudentCanvasEditor'
import type { EditorState, CanvasElement } from '../components/editor/types'
import { SUBJECT_COVER_MAPPING } from '../data/coverTemplates'
import { projectStorage } from '../utils/projectStorage'
import { showToast } from '../utils/toast'

export default function StudentFrontCoverPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectionData, setSelectionData] = useState<{
    selection: StudentUnitSelection
    topic: TopicRecommendation
    extraRequest?: string
    keyConcepts?: any[]
    coverDialogue?: any
  } | null>(null)

  const [projectId, setProjectId] = useState<string>(location.state?.projectId || '')
  const [isCoverCompleted, setIsCoverCompleted] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)

  useEffect(() => {
    let data = location.state as any
    let currentProjectId = data?.projectId || projectId;

    if ((!data || !data.selection || !data.topic) && currentProjectId) {
      const topicData = projectStorage.loadTopic<any>(currentProjectId)
      if (topicData && topicData.selection && topicData.topic) {
        data = { ...data, ...topicData }
      }
    }

    if (!data || !data.selection || !data.topic || !currentProjectId) {
      setErrorState('현재 작품 정보를 불러오지 못했어요. 이전 단계에서 다시 이동해 주세요.')
      return
    }

    setProjectId(currentProjectId);

    if (data && currentProjectId) {
      const scriptData = projectStorage.loadScript<any>(currentProjectId)
      if (scriptData) {
        const scriptSubject = scriptData.subject || scriptData.selection?.subjectName
        const currentSubject = data.selection?.subjectName
        const scriptTopicTitle = scriptData.storyTitle || scriptData.title
        const currentTopicTitle = data.topic?.title

        const isSubjectMatch = !scriptSubject || scriptSubject === currentSubject
        const isTopicMatch = !scriptTopicTitle || scriptTopicTitle === currentTopicTitle

        if (isSubjectMatch && isTopicMatch) {
          if (!data.keyConcepts && scriptData.keyConcepts) {
            data = { ...data, keyConcepts: scriptData.keyConcepts }
          }
          if (!data.coverDialogue && scriptData.coverDialogue) {
            data = { ...data, coverDialogue: scriptData.coverDialogue }
          }
        } else {
          console.warn('[FrontCover] scriptData 과목/주제 불일치 — keyConcepts/coverDialogue 보강 건너뜀', {
            scriptSubject, currentSubject, scriptTopicTitle, currentTopicTitle
          })
        }
      }
    }
    
    setSelectionData(data)
  }, [location.state])

  useEffect(() => {
    if (!selectionData || !projectId) return;
    const saved = projectStorage.loadFrontCover<EditorState>(projectId);
    
    let isSavedValid = false;
    if (saved && saved.metadata) {
      const meta = saved.metadata;
      const projectIdMatch = meta.projectId === projectId;
      const subjectMatch = meta.subject === selectionData.selection.subjectId || meta.subjectName === selectionData.selection.subjectName;
      const gradeMatch = meta.grade === selectionData.selection.gradeName;
      const topicMatch = meta.topicTitle === selectionData.topic.title || meta.topicId === selectionData.topic.id;
      isSavedValid = projectIdMatch && subjectMatch && gradeMatch && topicMatch;
    } else if (saved) {
      let topicMatch = false;
      const topicElement = saved.elements.find(el => el.id === 'cover-topic');
      if (topicElement && topicElement.type === 'text' && topicElement.props.text === selectionData.topic.title) {
        topicMatch = true;
      }
      let backgroundMatch = false;
      const expectedBg = selectionData.selection.subjectName ? SUBJECT_COVER_MAPPING[selectionData.selection.subjectName] : undefined;
      if (saved.background === expectedBg || saved.coverTemplateId === 'common-01') {
        backgroundMatch = true;
      }
      isSavedValid = topicMatch && backgroundMatch;
    }

    if (saved && isSavedValid && saved.elements.some(el => el.id.startsWith('cover-'))) {
      setIsCoverCompleted(true);
    }
  }, [projectId, selectionData]);

  if (errorState) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 min-h-screen">
        <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{errorState}</h2>
          <button onClick={() => navigate('/student/select-unit')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
            단원 선택으로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!selectionData) return null

  const { selection } = selectionData
  
  const handleNext = (state: EditorState) => {
    if (!isCoverCompleted) {
      alert('먼저 표지 완성하기 버튼을 눌러주세요.');
      return;
    }
    const success = projectStorage.saveFrontCover(projectId, state);
    if (!success) {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.');
      return;
    }
    showToast('저장되었습니다');
    navigate('/student/comic/full', { state: { ...selectionData, projectId } });
  };

  const handlePrev = () => {
    navigate('/student/topic', { state: { ...selectionData, projectId } });
  };

  const getInitialEditorState = (): EditorState => {
    const saved = projectStorage.loadFrontCover<EditorState>(projectId);
    
    let isSavedValid = false;
    if (saved && selectionData) {
      if (saved.metadata) {
        const meta = saved.metadata;
        const projectIdMatch = meta.projectId === projectId;
        const subjectMatch = meta.subject === selectionData.selection.subjectId || meta.subjectName === selectionData.selection.subjectName;
        const gradeMatch = meta.grade === selectionData.selection.gradeName;
        const topicMatch = meta.topicTitle === selectionData.topic.title || meta.topicId === selectionData.topic.id;
        isSavedValid = projectIdMatch && subjectMatch && gradeMatch && topicMatch;
        if (!isSavedValid) console.warn('[FrontCover] 저장된 표지의 메타데이터가 현재 작품과 다릅니다. 초기화합니다.');
      } else {
        let topicMatch = false;
        const topicElement = saved.elements.find(el => el.id === 'cover-topic');
        if (topicElement && topicElement.type === 'text' && topicElement.props.text === selectionData.topic.title) {
          topicMatch = true;
        }
        let backgroundMatch = false;
        const expectedBg = selectionData.selection.subjectName ? SUBJECT_COVER_MAPPING[selectionData.selection.subjectName] : undefined;
        if (saved.background === expectedBg || saved.coverTemplateId === 'common-01') {
          backgroundMatch = true;
        }
        isSavedValid = topicMatch && backgroundMatch;
        if (!isSavedValid) console.warn('[FrontCover] 저장된 표지 내용이 현재 작품과 다릅니다. 초기화합니다.');
      }
    }

    if (saved && isSavedValid) {
      // 🚨 MIGRATION: Convert existing bubble dialogs to text dialogs, and inject saved text if empty
      const updatedElements = saved.elements.map(el => {
        if (el.id.startsWith('cover-dialogue-')) {
          let updatedText = el.props.text;
          const speaker = el.id.replace('cover-dialogue-', '');
          if ((!updatedText || updatedText.trim() === '') && selectionData && selectionData.coverDialogue && selectionData.coverDialogue[speaker]) {
            updatedText = selectionData.coverDialogue[speaker];
          }

          if (el.type === 'bubble') {
            const migratedProps = { ...el.props };
            delete migratedProps.tailPosition;
            delete migratedProps.stroke;
            delete migratedProps.strokeWidth;
            delete migratedProps.padding;

            return {
              ...el,
              type: 'text' as const,
              visible: true,
              opacity: 1,
              props: {
                ...migratedProps,
                text: updatedText,
                fill: '#222222',
                backgroundColor: 'transparent',
                align: 'center',
                fontSize: 24,
                fontFamily: 'Pretendard'
              }
            };
          } else if (el.type === 'text') {
            if (!el.props.text || el.props.text.trim() === '') {
              return {
                ...el,
                props: {
                  ...el.props,
                  text: updatedText
                }
              };
            }
          }
        }
        return el;
      });

      return {
        ...saved,
        elements: updatedElements
      };
    }

    const elements: CanvasElement[] = [];
    
    // ✅ 현재 작품의 과목명으로 표지 이미지 결정 (하드코딩 금지)
    let backgroundUrl = '';
    if (selection && selection.subjectName) {
      backgroundUrl = SUBJECT_COVER_MAPPING[selection.subjectName] || '';
      
      if (!backgroundUrl) {
        console.warn(`과목 [${selection.subjectName}]에 대한 매핑된 표지 이미지가 없습니다.`);
      } else {
        console.log(`[FrontCover] 과목 [${selection.subjectName}] → 표지 이미지: ${backgroundUrl}`);
      }
    } else {
      console.error('[FrontCover] 과목 정보가 없습니다. 기본 표지를 사용합니다.');
    }
    
    return {
      version: '1.1',
      elements,
      ...(backgroundUrl ? { background: backgroundUrl } : { coverTemplateId: 'common-01' }),
      canvasWidth: 1400,
      canvasHeight: 1980
    };
  };

  const handleCompleteCover = (currentState: EditorState) => {
    if (!selectionData) return;

    const { selection, topic, coverDialogue, keyConcepts } = selectionData;

    if (!coverDialogue || !coverDialogue.hana || !coverDialogue.doyoon || !coverDialogue.seoa) {
      alert('앞표지 대화문이 없습니다. 대본 만들기에서 대화문을 먼저 저장해 주세요.');
      return;
    }

    const missing = [];
    if (!selection || !selection.gradeName) missing.push('학년·학기 정보');
    if (!topic || !topic.title) missing.push('학습 주제');
    if (!keyConcepts || keyConcepts.length !== 3) missing.push('핵심 개념 3가지');

    if (missing.length > 0) {
      alert(`다음 데이터가 누락되어 표지를 완성할 수 없습니다:\n- ${missing.join('\n- ')}\n\n대본 화면으로 돌아가서 내용을 확인해 주세요.`);
      return;
    }

    const newElements = [...currentState.elements];
    let maxZIndex = currentState.elements.length > 0 ? Math.max(...currentState.elements.map(e => e.zIndex)) : 0;

    const addIfNotExists = (id: string, el: any) => {
      if (!newElements.some(e => e.id === id)) {
        newElements.push({ id, ...el });
      }
    };

    const gradeSemesterText = selection.semesterName && selection.semesterName !== '공통' 
      ? `${selection.gradeName} ${selection.semesterName}` 
      : selection.gradeName;

    addIfNotExists('cover-grade-semester', {
      type: 'text', x: 500, y: 80, width: 400, height: 60, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
      props: { text: gradeSemesterText, layerName: '학년·학기', fontSize: 36, fill: '#ffffff', fontFamily: 'SCoreDream', fontWeight: 800, textStrokeColor: '#064E3B', textStrokeWidth: 2, lineHeight: 1.0, align: 'center', verticalAlign: 'middle' }
    });

    addIfNotExists('cover-topic', {
      type: 'text', x: 200, y: 400, width: 1000, height: 150, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
      props: { text: topic.title, layerName: '학습 주제', fontSize: 64, fill: '#303442', fontFamily: 'Jua', align: 'center' }
    });

    addIfNotExists('cover-dialogue-hana', {
      type: 'text', x: 100, y: 800, width: 340, height: 180, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
      props: { text: coverDialogue.hana, layerName: '하나 선생님 대화', fontSize: 24, fill: '#222222', fontFamily: 'Pretendard', align: 'center', backgroundColor: 'transparent' }
    });

    addIfNotExists('cover-dialogue-doyoon', {
      type: 'text', x: 530, y: 800, width: 340, height: 180, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
      props: { text: coverDialogue.doyoon, layerName: '도윤 대화', fontSize: 24, fill: '#222222', fontFamily: 'Pretendard', align: 'center', backgroundColor: 'transparent' }
    });

    addIfNotExists('cover-dialogue-seoa', {
      type: 'text', x: 960, y: 800, width: 340, height: 180, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
      props: { text: coverDialogue.seoa, layerName: '서아 대화', fontSize: 24, fill: '#222222', fontFamily: 'Pretendard', align: 'center', backgroundColor: 'transparent' }
    });

    const conceptWidth = 340;
    const positionsX = [130, 530, 930];
    const baseY = 1580;

    keyConcepts?.forEach((concept: any, i: number) => {
      addIfNotExists(`cover-concept-${i+1}`, {
        type: 'text', x: positionsX[i], y: baseY, width: conceptWidth, height: 180, rotation: 0, zIndex: ++maxZIndex, locked: false, visible: true,
        props: { text: `${concept.title}\n\n${concept.description}`, layerName: `핵심 개념 ${i+1}`, fontSize: 24, fill: '#303442', fontFamily: 'Pretendard', align: 'center' }
      });
    });

    const meta = {
      projectId: projectId,
      subject: selection?.subjectId || '',
      subjectName: selection?.subjectName || '',
      grade: selection?.gradeName || '',
      topicTitle: topic?.title || '',
      topicId: topic?.id || '',
      lessonTitle: selection?.middleUnitName || '',
      unitTitle: selection?.majorUnitName || ''
    };

    const newState: EditorState = {
      ...currentState,
      elements: newElements,
      metadata: meta
    };

    const success = projectStorage.saveFrontCover(projectId, newState);
    if (success) {
      setIsCoverCompleted(true);
      alert('표지가 완성되었습니다');
    } else {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.');
    }

    return newState;
  };

  return (
    <StudentCanvasEditor 
      mode="front-cover"
      subject={selection?.subjectId || undefined}
      initialState={getInitialEditorState()}
      onSave={(state) => {
        const meta = {
          projectId: projectId,
          subject: selection?.subjectId || '',
          subjectName: selection?.subjectName || '',
          grade: selection?.gradeName || '',
          topicTitle: selectionData?.topic?.title || '',
          topicId: selectionData?.topic?.id || '',
          lessonTitle: selection?.middleUnitName || '',
          unitTitle: selection?.majorUnitName || ''
        };
        const stateWithMeta: EditorState = { ...state, metadata: meta };
        const success = projectStorage.saveFrontCover(projectId, stateWithMeta);
        if (success) showToast('저장되었습니다');
        else alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.');
      }}
      onPrev={handlePrev}
      onNext={handleNext}
      onCompleteCover={handleCompleteCover}
      isCoverCompleted={isCoverCompleted}
      prevText="이전으로"
      nextText="만화 만들기"
      topicTitle={selectionData?.topic?.title}
    />
  )
}
