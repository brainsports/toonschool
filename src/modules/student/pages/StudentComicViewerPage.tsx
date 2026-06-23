import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import { loadComicProjectData, loadComicCutData } from '../components/editor/utils/comicStorage'
import type { ComicProjectData, ComicCutEditData, ComicCutElement } from '../components/editor/utils/comicStorage'
import { ArrowLeft, ArrowRight, Home, RefreshCcw } from 'lucide-react'

// 말풍선 등을 간단히 그려주는 렌더러 (읽기 전용)
function ReadonlyElement({ el }: { el: ComicCutElement }) {
  const isBubble = el.type === 'speechBubble'
  const isChar = el.type === 'character'

  return (
    <div
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation || 0}deg) ${el.flipX ? 'scaleX(-1)' : ''}`,
        zIndex: el.zIndex,
        pointerEvents: 'none',
      }}
    >
      {isChar && el.imageUrl && (
        <img src={el.imageUrl} alt="character" className="w-full h-full object-contain" />
      )}
      {isBubble && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-white border-4 border-slate-800 rounded-3xl shadow-md" />
          <p className="relative z-10 text-slate-800 font-bold text-center px-4 leading-snug break-keep"
             style={{ fontSize: el.style?.fontSize || 16 }}>
            {el.text}
          </p>
        </div>
      )}
    </div>
  )
}

export default function StudentComicViewerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [projectData, setProjectData] = useState<ComicProjectData | null>(null)
  const [cutsData, setCutsData] = useState<Record<number, ComicCutEditData | null>>({})
  
  // 0: Cover, 1-6: Cuts, 7: Summary, 8: Quiz, 9: Back Cover
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    let data = location.state
    if (!data) {
      const stored = localStorage.getItem('studentSelectedTopic')
      if (stored) {
        try { data = JSON.parse(stored) } catch(e) {}
      }
    }
    
    if (!data || !data.topic) {
      alert('데이터를 불러올 수 없습니다.')
      navigate('/student/select-unit')
      return
    }

    const topicId = data.topic.id
    const storedProjectData = loadComicProjectData(topicId)
    if (storedProjectData) {
      setProjectData(storedProjectData)
      
      const loadedCuts: Record<number, ComicCutEditData | null> = {}
      for (let i = 1; i <= 6; i++) {
        loadedCuts[i] = loadComicCutData(topicId, i)
      }
      setCutsData(loadedCuts)
    }
  }, [location.state, navigate])

  if (!projectData) {
    return (
      <StudentCreationLayout currentStep="viewer" maxWidth="full" bgVariant="pastel">
        <div className="flex-1 w-full flex items-center justify-center">로딩 중...</div>
      </StudentCreationLayout>
    )
  }

  const handleNext = () => {
    if (currentPage < 9) setCurrentPage(p => p + 1)
  }

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1)
    else navigate('/student/back-cover', { state: location.state })
  }

  const handleRestart = () => {
    setCurrentPage(0)
  }

  const renderContent = () => {
    if (currentPage === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200 text-center">
          <span className="text-purple-600 font-bold mb-4">{projectData.grade} {projectData.subject}</span>
          <h1 className="text-4xl md:text-5xl font-jua text-slate-800 mb-8">{projectData.topicTitle}</h1>
          <p className="text-slate-500 font-bold">앞표지</p>
        </div>
      )
    }

    if (currentPage >= 1 && currentPage <= 6) {
      const cutNum = currentPage
      const cutData = cutsData[cutNum]
      const scriptCut = projectData.script.cuts.find(c => c.cutNumber === cutNum)

      return (
        <div className="w-full h-full flex flex-col bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
          <div className="flex-1 relative bg-slate-100 flex items-center justify-center overflow-hidden">
            {cutData?.backgroundImageUrl ? (
              <div className="relative w-full max-w-2xl aspect-square bg-white shadow-sm border border-slate-200">
                <img src={cutData.backgroundImageUrl} alt={`Cut ${cutNum}`} className="w-full h-full object-cover" />
                {cutData.elements?.map(el => <ReadonlyElement key={el.id} el={el} />)}
              </div>
            ) : (
              <div className="text-slate-400 font-bold">그림이 없습니다.</div>
            )}
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <span className="inline-block bg-purple-500 text-white font-jua px-3 py-1 rounded-lg mb-2">제 {cutNum} 컷</span>
            <p className="text-slate-800 font-bold text-lg">{scriptCut?.sceneDescription}</p>
          </div>
        </div>
      )
    }

    if (currentPage === 7) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200 text-center">
          <h2 className="text-3xl font-jua text-slate-800 mb-6">단원 정리</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {projectData.coreConcepts.map((c, i) => (
              <div key={i} className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-6 py-3 rounded-2xl font-bold text-xl">
                {c}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentPage === 8) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200 text-center">
          <h2 className="text-3xl font-jua text-slate-800 mb-6">팡팡! 퀴즈</h2>
          <p className="text-slate-500 font-bold text-xl">학습한 내용을 바탕으로 한 퀴즈 페이지입니다.</p>
        </div>
      )
    }

    if (currentPage === 9) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200 text-center">
          <h2 className="text-3xl font-jua text-slate-800 mb-4">뒤표지</h2>
          <p className="text-slate-600 font-bold mb-8">수고하셨습니다! 책이 완성되었습니다.</p>
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-8 py-4 bg-purple-100 hover:bg-purple-200 text-purple-700 font-jua text-2xl rounded-full transition-colors"
          >
            <RefreshCcw className="w-6 h-6" />
            처음부터 보기
          </button>
        </div>
      )
    }

    return null
  }

  const getPageLabel = () => {
    if (currentPage === 0) return '표지 1 / 10'
    if (currentPage >= 1 && currentPage <= 6) return `만화 ${currentPage}컷 ${currentPage + 1} / 10`
    if (currentPage === 7) return '단원 정리 8 / 10'
    if (currentPage === 8) return '퀴즈 9 / 10'
    return '뒤표지 10 / 10'
  }

  return (
    <StudentCreationLayout currentStep="viewer" maxWidth="md" bgVariant="default">
      <div className="w-full flex-1 flex flex-col min-h-0 relative bg-slate-900/5 backdrop-blur-sm px-4 py-6 md:py-10">
        
        {/* 상단 진행 표시 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/80 backdrop-blur border border-slate-200 px-6 py-2 rounded-full shadow-sm">
            <span className="font-jua text-slate-700 text-lg">{getPageLabel()}</span>
          </div>
        </div>

        {/* 메인 뷰어 영역 */}
        <div className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center relative min-h-0">
          
          {/* 이전 버튼 (왼쪽) */}
          <button
            onClick={handlePrev}
            className="absolute left-0 md:-left-16 z-10 p-3 md:p-4 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 transition-transform hover:scale-110 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 stroke-[3]" />
          </button>

          {/* 콘텐츠 */}
          <div className="w-full h-full max-h-[800px] aspect-[3/4] md:aspect-auto md:h-[70vh]">
            {renderContent()}
          </div>

          {/* 다음 버튼 (오른쪽) */}
          {currentPage < 9 && (
            <button
              onClick={handleNext}
              className="absolute right-0 md:-right-16 z-10 p-3 md:p-4 bg-white/90 hover:bg-white text-purple-600 rounded-full shadow-lg border border-slate-200 transition-transform hover:scale-110 active:scale-95"
            >
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8 stroke-[3]" />
            </button>
          )}
        </div>

        {/* 모바일 하단 홈 버튼 */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-bold rounded-full shadow-md"
          >
            <Home className="w-4 h-4" />
            홈으로 나가기
          </button>
        </div>

      </div>
    </StudentCreationLayout>
  )
}
