import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation } from '../types/studentTopic'
import { ArrowRight, ArrowLeft } from 'lucide-react'

// 과목 키 변환
const subjectKeyMap: Record<string, string> = {
  '국어': 'korean',
  '수학': 'math',
  '과학': 'science',
  '사회': 'social',
  '영어': 'english'
}

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
  
  const subjectName = selection.subjectName || ''
  const subjectKey = subjectKeyMap[subjectName]

  const todayStr = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date())

  // 임시 캐릭터 이름 - Context에서 가져오는 건 보류 (요청: 전역상태 추가 금지)
  const studentName = '학생' 

  // 지원하지 않는 과목 처리
  if (!subjectKey) {
    return (
      <StudentCreationLayout currentStep="frontCover" bgVariant="space" maxWidth="lg">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <p className="text-xl font-jua text-white">해당 과목('{subjectName}')의 기본 표지가 준비되지 않았습니다.</p>
            <button 
              onClick={() => navigate('/student/topic')}
              className="mt-6 px-6 py-3 bg-purple-500 text-white rounded-2xl font-jua shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              이전으로 돌아가기
            </button>
          </div>
        </div>
      </StudentCreationLayout>
    )
  }

  const coverImageUrl = `/images/toonschool/covers/${subjectKey}/${subjectKey}-cover-default.png`
  
  // 캐릭터 이미지 경로
  const characters = [
    `/images/toonschool/characters/subjects/${subjectKey}/hana-${subjectKey === 'korean' ? 'reading' : subjectKey}.png`,
    `/images/toonschool/characters/subjects/${subjectKey}/doyoon-${subjectKey === 'korean' ? 'reading' : subjectKey}.png`,
    `/images/toonschool/characters/subjects/${subjectKey}/seoa-${subjectKey === 'korean' ? 'writing' : subjectKey}.png`
  ]

  const handleNext = () => {
    navigate('/student/comic/cut/1', { state: selectionData })
  }

  const handlePrev = () => {
    navigate('/student/topic', { state: selectionData })
  }

  return (
    <StudentCreationLayout currentStep="frontCover" bgVariant="space" maxWidth="lg">
      <div className="flex flex-col items-center w-full pb-12 animate-fade-in relative">
        
        {/* 네비게이션 버튼 */}
        <div className="w-full flex justify-between items-center mb-6">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 px-6 py-3.5 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-jua text-lg rounded-[2rem] border border-white/20 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            이전으로
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-jua text-lg rounded-[2rem] shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5"
          >
            만화 만들기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* 표지 컨테이너 - A4 비율 */}
        <div 
          className="relative w-full max-w-[500px] bg-white rounded-lg shadow-2xl overflow-hidden"
          style={{ aspectRatio: '210 / 297' }}
        >
          {/* 1. 배경 이미지 */}
          <img 
            src={coverImageUrl} 
            alt={`${subjectName} 표지 배경`}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* 2. 텍스트 레이어 */}
          <div className="absolute inset-0 p-8 flex flex-col z-10">
            {/* 상단: 학년, 과목, 단원 */}
            <div className="flex flex-col items-center text-center mt-8">
              <div className="bg-white/90 backdrop-blur px-5 py-1.5 rounded-full text-purple-900 font-jua text-base md:text-lg border border-purple-200 mb-3 shadow-sm">
                {selection.gradeName} {selection.subjectName}
              </div>
              <h3 className="font-jua text-xl md:text-2xl text-slate-800 drop-shadow-sm px-2 break-keep">
                {selection.majorUnitName}
              </h3>
              {selection.middleUnitName && (
                <h4 className="font-jua text-lg text-slate-600 mt-1 break-keep">
                  {selection.middleUnitName}
                </h4>
              )}
            </div>

            {/* 중앙: 작품 제목 */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <h1 className="font-jua text-4xl md:text-5xl text-slate-900 drop-shadow-md leading-tight break-keep mb-6">
                {topic.title}
              </h1>
              {topic.learningPoint && (
                <p className="font-jua text-lg md:text-xl text-purple-800 mt-2 bg-white/70 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/60 inline-block shadow-sm break-keep max-w-[90%]">
                  {topic.learningPoint}
                </p>
              )}
            </div>

            {/* 하단: 캐릭터 및 발행 정보 */}
            <div className="relative h-[40%] flex justify-center items-end pb-8">
              {/* 캐릭터 배치 (가운데 하나, 양옆 도윤/서아) */}
              <div className="absolute bottom-0 flex justify-center items-end w-full px-4 mb-2">
                <img src={characters[1]} alt="도윤" className="w-[35%] object-contain -mr-8 z-10 drop-shadow-lg" />
                <img src={characters[0]} alt="하나 선생님" className="w-[45%] object-contain z-20 mb-2 drop-shadow-xl" />
                <img src={characters[2]} alt="서아" className="w-[35%] object-contain -ml-8 z-10 drop-shadow-lg" />
              </div>
              
              {/* 날짜, 지은이 정보 (맨 앞) */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end z-30 font-jua">
                <div className="text-slate-800 text-sm drop-shadow-sm font-medium">
                  발행: {todayStr}
                </div>
                <div className="text-slate-900 text-base md:text-lg mt-1 bg-white/90 px-4 py-1.5 rounded-lg backdrop-blur shadow-md border border-white/50">
                  지은이: {studentName}
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </StudentCreationLayout>
  )
}
