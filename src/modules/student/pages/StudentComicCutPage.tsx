// 만화 컷 말풍선 완성 페이지 - 1컷~6컷 장면별 편집 퀘스트
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import ComicScenePreview from '../components/comic/ComicScenePreview'
import SpeechBubbleEditor from '../components/forms/SpeechBubbleEditor'
import ComicCutActionButtons from '../components/comic/ComicCutActionButtons'
import HalfwayPraiseMessage from '../components/comic/HalfwayPraiseMessage'
import { mockComicCuts } from '../data/studentMockData'
import { getNextCutPath, isHalfwayDone } from '../utils/studentFlowUtils'

export default function StudentComicCutPage() {
  const navigate = useNavigate()
  const { cutNumber } = useParams<{ cutNumber: string }>()
  const currentCutNumber = parseInt(cutNumber || '1', 10)

  // 현재 컷 데이터 찾기
  const currentCut = mockComicCuts.find((c) => c.cutNumber === currentCutNumber) || mockComicCuts[0]

  // 말풍선 대사 상태
  const [speechText, setSpeechText] = useState(currentCut.speechBubble)
  const [showPraise, setShowPraise] = useState(false)

  // 컷 번호가 변경될 때마다 입력 필드 값을 새 컷 데이터로 초기화
  useEffect(() => {
    setSpeechText(currentCut.speechBubble)
  }, [currentCutNumber, currentCut])

  // 이전 컷 경로
  const backPath = currentCutNumber > 1
    ? `/student/comic/cut/${currentCutNumber - 1}`
    : '/student/front-cover'

  // 다음 장면으로
  const handleNext = () => {
    if (isHalfwayDone(currentCutNumber)) {
      setShowPraise(true)
      // 2.5초간 칭찬 팝업을 띄운 뒤 다음 경로로
      setTimeout(() => {
        setShowPraise(false)
        navigate(getNextCutPath(currentCutNumber))
      }, 2500)
    } else {
      navigate(getNextCutPath(currentCutNumber))
    }
  }

  const handleKeep = () => {
    handleNext()
  }

  const handleAiRewrite = () => {
    const aiSuggestions = [
      '앗! 연료가 3/8밖에 없잖아? 서둘러 계산해야 해!',
      '목표 행성까지 거리를 통분해서 계산해보자!',
      '통분을 하면 분모가 같아져서 덧셈이 무척 쉬워져!',
      '야호! 연료 충전 100% 완료! 출발해볼까?',
    ]
    const random = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)]
    setSpeechText(random)
  }

  return (
    <StudentCreationLayout currentStep="comic" bgVariant="space" maxWidth="lg">
      
      {/* 절반 완성 축하 오버레이 */}
      <HalfwayPraiseMessage visible={showPraise} />

      <div className="flex flex-col gap-6 w-full animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">만화를 만들어요</h1>
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 px-4 py-1.5 rounded-full text-sm font-jua shadow-sm">
              {currentCutNumber} / 6 컷
            </span>
          </div>
        </div>

        {/* 태블릿 최적화: 좌우 2컬럼 배치 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* 좌측: 만화 컷 미리보기 프레임 */}
          <div className="space-y-4">
            <ComicScenePreview cut={{ ...currentCut, speechBubble: speechText }} />
          </div>

          {/* 우측: 말풍선 텍스트 수정 및 액션 버튼 */}
          <div className="space-y-6">
            <SpeechBubbleEditor
              text={speechText}
              onChange={setSpeechText}
              cutNumber={currentCutNumber}
            />

            <ComicCutActionButtons
              cutNumber={currentCutNumber}
              totalCuts={6}
              onKeep={handleKeep}
              onEdit={() => {}}
              onAiRewrite={handleAiRewrite}
              onNext={handleNext}
              onBack={() => navigate(backPath)}
            />
          </div>

        </div>
      </div>

    </StudentCreationLayout>
  )
}
