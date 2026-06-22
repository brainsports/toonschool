import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import { generateFullComic } from '../services/studentComicService'
import type { ComicGenerationState } from '../services/studentComicService'
import { loadComicProjectData, saveComicProjectData } from '../components/editor/utils/comicStorage'
import type { ComicProjectData } from '../components/editor/utils/comicStorage'
import type { GeneratedComicScript } from '../services/studentScriptService'
import { Sparkles, Loader2, ArrowLeft, Save, Download, ZoomIn, ZoomOut, Maximize, ArrowRight } from 'lucide-react'

export default function StudentComicFullViewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectionData, setSelectionData] = useState<any>(null)
  const [scriptData, setScriptData] = useState<GeneratedComicScript | null>(null)
  const [projectData, setProjectData] = useState<ComicProjectData | null>(null)
  const [genState, setGenState] = useState<ComicGenerationState>({ status: 'idle', progress: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [zoomPercent, setZoomPercent] = useState<number | null>(null)

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
    let parsedScript: GeneratedComicScript | null = null;
    if (scriptStored) {
      try {
        parsedScript = JSON.parse(scriptStored)
        setScriptData(parsedScript)
      } catch(e) {}
    }

    if (!parsedScript) return;

    const topicId = data.topic.id
    let storedProjectData = loadComicProjectData(topicId)
    
    if (!storedProjectData) {
      storedProjectData = {
        projectId: topicId,
        grade: data.selection.gradeName,
        subject: data.selection.subjectName,
        topicTitle: parsedScript.title,
        selectedStoryDescription: data.topic.summary || '',
        coreConcepts: parsedScript.keyConcepts?.map((c: any) => c.title) || [],
        script: {
          version: 1,
          updatedAt: new Date().toISOString(),
          cuts: parsedScript.cuts.map((c: any) => ({
            cutNumber: c.cutNumber,
            title: c.role || '',
            sceneDescription: c.scene,
            learningPoint: c.learningPoint,
            dialogues: c.dialogues.map((d: any) => ({ character: d.speaker, text: d.text }))
          })) as any
        },
        characterReferences: { version: 'v2' }
      }
      saveComicProjectData(topicId, storedProjectData)
    }
    setProjectData(storedProjectData)

    if (storedProjectData.fullComic?.imageUrl) {
      setGenState({ 
        status: 'success', 
        progress: 100, 
        fullImageUrl: storedProjectData.fullComic.imageUrl 
      })
    }
  }, [location.state, navigate])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    setTimeout(handleResize, 50)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const SCROLL_PADDING = 40
  const A4_WIDTH = 1400
  const A4_HEIGHT = 1980
  const fitScale = Math.min(
    Math.max(1, (containerSize.width || A4_WIDTH) - SCROLL_PADDING * 2) / A4_WIDTH,
    Math.max(1, (containerSize.height || A4_HEIGHT) - SCROLL_PADDING * 2) / A4_HEIGHT
  )
  const currentZoom = zoomPercent !== null ? zoomPercent : Math.round(fitScale * 100)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -5 : 5
        let newZoom = currentZoom + delta
        newZoom = Math.max(25, Math.min(300, newZoom))
        
        const rect = el.getBoundingClientRect()
        const pointerX = e.clientX - rect.left
        const pointerY = e.clientY - rect.top
        
        const contentX = el.scrollLeft + pointerX - SCROLL_PADDING
        const contentY = el.scrollTop + pointerY - SCROLL_PADDING
        
        const zoomRatio = newZoom / currentZoom
        
        setZoomPercent(newZoom)
        
        requestAnimationFrame(() => {
           el.scrollLeft = contentX * zoomRatio + SCROLL_PADDING - pointerX
           el.scrollTop = contentY * zoomRatio + SCROLL_PADDING - pointerY
        })
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [currentZoom])

  const handleGenerate = async () => {
    if (!projectData || !scriptData || !scriptData.cuts || scriptData.cuts.length !== 6) {
      alert('6컷 대본 정보가 부족합니다. 대본 만들기부터 다시 확인해 주세요.')
      navigate('/student/script', { state: selectionData })
      return
    }

    if (genState.status === 'success' && !confirm('6컷 전체 만화를 다시 만들까요?\\n현재 그림이 새로운 그림으로 바뀝니다.\\n(추가 비용이 발생할 수 있습니다.)')) {
      return
    }

    try {
      const fullComicBase64 = await generateFullComic(
        projectData,
        scriptData,
        setGenState
      )
      
      const updatedProjectData = {
        ...projectData,
        fullComic: {
          imageUrl: fullComicBase64,
          scriptVersion: projectData.script.version,
          createdAt: new Date().toISOString()
        }
      }
      setProjectData(updatedProjectData)
      saveComicProjectData(projectData.projectId, updatedProjectData)
    } catch (err: any) {
      console.error(err)
    }
  }

  const handlePrev = () => {
    navigate('/student/front-cover', { state: selectionData })
  }

  const handleNext = () => {
    if (genState.status !== 'success') {
      alert('6컷 만화를 먼저 완성해 주세요.')
      return
    }
    navigate('/student/summary', { state: selectionData })
  }

  const handleDownload = () => {
    if (!genState.fullImageUrl) return;
    const a = document.createElement('a');
    a.href = genState.fullImageUrl;
    a.download = `toonschool-comic-${projectData?.projectId}.png`;
    a.click();
  }

  if (!selectionData || !scriptData || !projectData) {
    return (
      <StudentCreationLayout currentStep="full" maxWidth="full" bgVariant="default">
        <div className="flex-1 w-full bg-[#f3f4f7] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </StudentCreationLayout>
    )
  }

  return (
    <StudentCreationLayout currentStep="full" maxWidth="full" bgVariant="default">
      <div className="w-full flex-1 flex flex-col min-h-0 bg-[#f3f4f7] animate-fade-in relative">
        <div className="flex-1 flex w-full h-full overflow-hidden relative">
          
          {/* Center Main Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
            
            {/* Top Taskbar */}
            <div className="flex justify-between items-center px-6 py-3 shrink-0 relative z-20 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex justify-start">
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-jua text-base rounded-full border border-slate-300 transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전으로
                </button>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-gray-50 text-slate-700 font-bold rounded-xl shadow-sm border border-slate-300 text-sm transition-all">
                  <Save className="w-4 h-4" />
                  진행사항 저장
                </button>
                <button 
                  onClick={handleGenerate}
                  disabled={genState.status !== 'success'}
                  className={`flex items-center gap-1.5 px-5 py-2.5 font-bold rounded-xl shadow-sm text-sm border transition-all ${genState.status === 'success' ? 'bg-white hover:bg-purple-50 text-purple-600 border-purple-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  6컷 전체 다시 만들기
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={genState.status !== 'success'}
                  className={`flex items-center gap-1.5 px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all text-sm border ${genState.status === 'success' ? 'bg-slate-700/90 hover:bg-slate-600 text-white border-slate-500/50' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                >
                  <Download className="w-4 h-4" />
                  PNG 내보내기
                </button>
                <button
                  onClick={handleNext}
                  className={`flex items-center gap-2 px-6 py-2.5 font-jua text-base rounded-full shadow-lg transition-all ml-2 ${genState.status === 'success' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-purple-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}
                >
                  다음 단계
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 w-full relative min-h-0 min-w-0 overflow-auto overscroll-contain" ref={containerRef}>
              
              <div className="flex items-start justify-center min-w-max min-h-max p-10">
                {/* A4 Document Area */}
                <div 
                  className="relative bg-white shadow-xl flex flex-col"
                  style={{
                    width: A4_WIDTH,
                    height: A4_HEIGHT,
                    transform: `scale(${currentZoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Title Area */}
                  <div className="h-[180px] w-full flex flex-col items-center justify-center border-b-[4px] border-black p-4 text-center shrink-0">
                    <span className="text-xl font-bold text-gray-500 mb-2">{projectData.subject} &gt; {projectData.mainUnit || selectionData.selection.majorUnitName}</span>
                    <h1 className="text-[56px] font-jua text-black leading-tight">{projectData.topicTitle}</h1>
                  </div>

                  {/* Comic Area */}
                  <div className="flex-1 relative border-b-[4px] border-black overflow-hidden bg-white">
                    {genState.status === 'success' && genState.fullImageUrl ? (
                      <>
                        <img 
                          src={genState.fullImageUrl} 
                          alt="Generated Comic" 
                          className="w-full h-full object-fill block"
                        />
                        {/* 2x3 Grid Overlay for Dialogues */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 pointer-events-none">
                          {[1,2,3,4,5,6].map(num => {
                            const cut = projectData.script.cuts.find(c => c.cutNumber === num);
                            return (
                              <div key={num} className="relative w-full h-full p-4 border border-black/10 flex flex-col items-center justify-between">
                                {/* Number Badge */}
                                <div className="absolute top-2 left-2 bg-white/90 border-2 border-black text-black font-jua text-3xl px-4 py-2 z-30 rounded-xl shadow-md">
                                  {num}
                                </div>
                                
                                {/* Dialogues Container */}
                                <div className="w-full h-full flex flex-col gap-2 mt-16 px-4">
                                  {cut?.dialogues.map((d, i) => (
                                    <div key={i} className="self-end bg-white/95 border-2 border-slate-300 rounded-3xl p-4 shadow-lg max-w-[80%] pointer-events-auto">
                                      <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full w-max mb-1">
                                        {d.character}
                                      </div>
                                      <p className="text-slate-800 font-bold text-2xl leading-snug break-keep">
                                        {d.text}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                        <span className="text-3xl font-bold mb-4">백지 (만화를 그려주세요)</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Summary Area */}
                  <div className="h-[220px] w-full bg-gray-50 flex items-center p-8 shrink-0">
                    <div className="bg-purple-100 text-purple-800 font-jua text-3xl px-6 py-3 rounded-2xl mr-8 whitespace-nowrap">핵심 정리</div>
                    <div className="flex gap-4 flex-wrap flex-1">
                      {projectData.script.cuts.filter(c => c.learningPoint && c.learningPoint.length > 0).map((c, i) => (
                        <span key={i} className="bg-white border-2 border-purple-200 px-4 py-2 rounded-full font-bold text-xl text-slate-700 shadow-sm">
                          {c.learningPoint}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Overlay (if not generated) */}
              {(genState.status !== 'success') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                  {genState.status === 'idle' || genState.status === 'error' ? (
                    <div className="flex flex-col items-center gap-6 text-center max-w-lg mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
                      {genState.status === 'error' && (
                        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 w-full mb-2">
                          <p className="font-bold text-xl mb-2 flex items-center justify-center gap-2">
                            <span>🚨</span> 이미지 생성 실패
                          </p>
                          <p className="text-base text-red-500 break-words">{genState.errorMessage}</p>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleGenerate}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-10 py-5 rounded-full font-jua text-3xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-4 border border-purple-300 w-full"
                      >
                        <Sparkles className="w-10 h-10"/> 
                        {genState.status === 'error' ? '전체 다시 시도하기' : '6컷 만화 한 번에 만들기'}
                      </button>
                      
                      {genState.status === 'error' && (
                        <p className="text-slate-400 text-sm mt-2">
                          API 요청 오류일 수 있습니다. 프롬프트 또는 할당량을 확인해 주세요.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center bg-white p-12 rounded-3xl shadow-2xl border-4 border-purple-100">
                      <Loader2 className="w-20 h-20 text-purple-500 animate-spin mb-6" />
                      <h2 className="text-3xl font-jua text-slate-800 mb-6">
                        {genState.message || '만화를 생성하고 있어요...'}
                      </h2>
                      <div className="w-full max-w-md bg-slate-100 rounded-full h-6 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${genState.progress}%` }}
                        />
                      </div>
                      <div className="text-purple-600 font-bold mt-4 text-xl flex flex-col items-center">
                        <span>{genState.progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-xl text-slate-600">
              <button 
                onClick={() => setZoomPercent(Math.max(25, currentZoom - 10))}
                disabled={currentZoom <= 25}
                className="hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                aria-label="축소" title="축소"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-xs md:text-sm font-bold w-[4ch] text-center font-mono text-slate-700">
                {currentZoom}%
              </span>
              
              <input 
                type="range"
                min="25" max="300" step="5"
                value={currentZoom}
                onChange={(e) => setZoomPercent(parseInt(e.target.value))}
                className="w-16 md:w-24 accent-purple-500 cursor-pointer"
              />
              
              <button 
                onClick={() => setZoomPercent(Math.min(300, currentZoom + 10))}
                disabled={currentZoom >= 300}
                className="hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                aria-label="확대" title="확대"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 md:h-5 bg-slate-300 mx-0.5 md:mx-1" />
              
              <button 
                onClick={() => setZoomPercent(null)}
                className={`hover:text-purple-600 transition-colors flex items-center gap-1.5 text-xs font-bold p-1 ${zoomPercent === null ? 'text-purple-600' : 'text-slate-500'}`}
                aria-label="화면 맞춤" title="화면 맞춤"
              >
                <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">맞춤</span>
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </StudentCreationLayout>
  )
}
