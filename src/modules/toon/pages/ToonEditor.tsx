import { useState } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import { geminiClient } from '../../../shared/lib/gemini'
import { Sparkles, Save, Clipboard, Plus, Trash2, ChevronRight, AlertCircle, CheckCircle, Globe, Copy, X } from 'lucide-react'

interface ToonCut {
  id: string
  description: string
  dialogue: string
}

export default function ToonEditor() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('나의 첫 우주 모험 만화')
  const [cuts, setCuts] = useState<ToonCut[]>([
    { id: 'cut-1', description: '우주선 조종실 안, 깜짝 놀란 얼굴을 하고 있는 주인공 캐릭터', dialogue: '우주선 연료가 얼마 안 남았잖아?! 어쩌지?' },
    { id: 'cut-2', description: '창밖으로 외계 행성의 황량한 붉은 흙 대지가 펼쳐지는 모습', dialogue: '저기 붉은 행성에 비상 착륙해야 할 것 같아.' }
  ])
  const [activeCutId, setActiveCutId] = useState<string>('cut-1')
  
  // AI states
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // DB states
  const [dbLoading, setDbLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ type: 'success' | 'error' | 'local'; msg: string } | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeCutIndex = cuts.findIndex(c => c.id === activeCutId)
  const activeCut = cuts[activeCutIndex] || cuts[0]

  // Add a new cut panel
  const addCut = () => {
    const newId = `cut-${Date.now()}`
    const newCut: ToonCut = {
      id: newId,
      description: '',
      dialogue: ''
    }
    setCuts(prev => [...prev, newCut])
    setActiveCutId(newId)
  }

  // Delete current cut
  const deleteCut = () => {
    if (cuts.length <= 1) {
      alert('최소 1개 이상의 컷이 있어야 합니다.')
      return
    }
    const filtered = cuts.filter(c => c.id !== activeCutId)
    setCuts(filtered)
    // Select the previous cut
    const prevIdx = Math.max(0, activeCutIndex - 1)
    setActiveCutId(filtered[prevIdx]?.id || filtered[0].id)
  }

  // Update field of a cut
  const updateCutField = (id: string, field: keyof ToonCut, value: string) => {
    setCuts(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  // Call Gemini for speech ideas
  const getAiDialogue = async () => {
    if (!activeCut) return
    setAiLoading(true)
    setAiError(null)
    setAiSuggestions([])

    const prompt = `
      만화 컷 제작 대사 및 아이디어 추천:
      - 현재 만화 컷 설명: "${activeCut.description || '대사 없이 컷만 생성됨'}"
      - 작성된 기존 대사: "${activeCut.dialogue || '비어 있음'}"
      
      위 상황에 알맞은 캐릭터의 재치 있고 몰입도 높은 대사 또는 다음 컷으로 이어갈 스토리 아이디어를 3가지 제안해 줘.
      반드시 각 제안은 번호 없이 한 줄씩 작성해 주고, 각각의 제안은 줄바꿈(\n) 문자로만 구분해 줘.
    `

    try {
      const result = await geminiClient.generateText(prompt)
      
      // Parse suggestions by split
      const lines = result
        .split('\n')
        .map(l => l.replace(/^[-*•\d.\s]+/g, '').trim()) // Clean prefixes
        .filter(l => l.length > 2)
        .slice(0, 3)

      if (lines.length > 0) {
        setAiSuggestions(lines)
      } else {
        setAiSuggestions([
          '여긴 너무 어두워... 전등을 찾아보자!',
          '저 멀리 기지처럼 보이는 불빛이 깜빡이고 있어.',
          '어쩌면 외계 생명체가 우릴 보고 있을지도 몰라.'
        ])
      }
    } catch (err) {
      console.error('Failed to query Gemini:', err)
      setAiError('Gemini API 호출에 실패하여 기본 템플릿 대사를 추천합니다.')
      setAiSuggestions([
        '연료가 완전히 멈췄어! 산소 유지를 최대로 올려!',
        '어떻게든 통신 장치를 복구해서 지구 본부에 알리자.',
        '내 생각엔 행성 지표면 아래에 에너지 광물이 매장되어 있을 것 같아.'
      ])
    } finally {
      setAiLoading(false)
    }
  }

  // Database Save (Supabase Auth and profiles check)
  const handleSave = async (isDraft: boolean) => {
    setDbLoading(true)
    setDbStatus(null)

    try {
      // Fetch current session for creator relation
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || 'guest-user'

      const projectData = {
        title,
        content: cuts, // Save panel cuts arrays as JSON
        user_id: userId,
        status: isDraft ? 'draft' : 'published',
        ...(slug ? { slug, is_public: !isDraft } : {}),
        updated_at: new Date()
      }

      // Check if project is already saved in DB
      let query
      if (projectId) {
        query = supabase
          .from('toon_projects')
          .update(projectData)
          .eq('id', projectId)
      } else {
        query = supabase
          .from('toon_projects')
          .insert([projectData])
          .select()
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // If insert select succeeded, store generated ID
      if (!projectId && Array.isArray(data) && data[0]?.id) {
        setProjectId(data[0].id)
      }

      setDbStatus({
        type: 'success',
        msg: isDraft ? '임시 저장이 완료되었습니다.' : '성공적으로 저장되었습니다.'
      })
    } catch (err) {
      console.warn('Database write failed, fallback to local storage:', err)
      
      // Save locally to localStorage so offline testing still succeeds
      localStorage.setItem(`toon-project-${projectId || 'draft'}`, JSON.stringify({ title, cuts }))
      
      setDbStatus({
        type: 'local',
        msg: `수퍼베이스 toon_projects 테이블 연결 실패로 로컬 저장소(localStorage)에 안전하게 백업되었습니다. (${err instanceof Error ? err.message : '네트워크 상태 확인 요망'})`
      })
    } finally {
      setDbLoading(false)
      setTimeout(() => setDbStatus(null), 5000)
    }
  }

  // Publish flow with random slug generation
  const handlePublish = async () => {
    setDbLoading(true)
    setDbStatus(null)

    const generatedSlug = slug || Math.random().toString(36).substring(2, 10)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || 'guest-user'

      const projectData = {
        title,
        content: cuts, // Save panels as JSON
        user_id: userId,
        status: 'published',
        is_public: true,
        slug: generatedSlug,
        updated_at: new Date()
      }

      let query
      if (projectId) {
        query = supabase
          .from('toon_projects')
          .update(projectData)
          .eq('id', projectId)
      } else {
        query = supabase
          .from('toon_projects')
          .insert([projectData])
          .select()
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      if (!projectId && Array.isArray(data) && data[0]?.id) {
        setProjectId(data[0].id)
      }

      setSlug(generatedSlug)
      setIsShareModalOpen(true)
      setDbStatus({
        type: 'success',
        msg: '성공적으로 배포되었습니다!'
      })
    } catch (err) {
      console.warn('Database publish failed, fallback to local storage:', err)

      // Save locally to localStorage so viewer can query it via the slug
      const fallbackProject = {
        id: projectId || `fallback-${generatedSlug}`,
        title,
        content: cuts,
        user_id: 'guest-user',
        creator_email: 'guest@toonschool.net',
        status: 'published',
        is_public: true,
        slug: generatedSlug,
        updated_at: new Date().toISOString()
      }
      localStorage.setItem(`toon-project-${generatedSlug}`, JSON.stringify(fallbackProject))

      setSlug(generatedSlug)
      setIsShareModalOpen(true)
      setDbStatus({
        type: 'local',
        msg: `수퍼베이스 toon_projects 테이블 배포 실패로 로컬 저장소(localStorage)에 안전하게 배포되었습니다.`
      })
    } finally {
      setDbLoading(false)
      setTimeout(() => setDbStatus(null), 5000)
    }
  }

  const handleCopyLink = () => {
    if (!slug) return
    const shareUrl = `${window.location.origin}/p/${slug}`
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
      })
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-5">
        <div className="space-y-1.5 w-full sm:max-w-md">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="웹툰 제목을 입력하세요"
            className="w-full bg-transparent text-xl font-black text-slate-100 hover:bg-slate-900/40 focus:bg-slate-900 border border-transparent focus:border-slate-850 rounded-xl px-2.5 py-1 transition-all outline-none"
          />
          <p className="text-[10px] text-slate-500 pl-2.5">툰스쿨 AI 드로잉 에디터 캔버스 툴킷</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSave(true)}
            disabled={dbLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <Clipboard className="h-4 w-4" />
            <span>임시 저장</span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={dbLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>최종 저장</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={dbLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50"
          >
            <Globe className="h-4 w-4" />
            <span>배포하기</span>
          </button>
        </div>
      </div>

      {/* Database notification banners */}
      {dbStatus && (
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
          dbStatus.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-450' 
            : 'bg-amber-950/40 border-amber-900/50 text-amber-450'
        }`}>
          {dbStatus.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />}
          <span>{dbStatus.msg}</span>
        </div>
      )}

      {/* 2. Main 2-Column Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Canvas Panels list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Canvas Sub-toolbar */}
          <div className="flex justify-between items-center p-3.5 bg-slate-900 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-450 font-bold">
              총 만화 컷 수: <span className="text-purple-400">{cuts.length}개</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={addCut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-950 border border-slate-850 text-slate-350 text-[10px] font-bold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>컷 추가</span>
              </button>
              <button
                onClick={deleteCut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-850 hover:border-rose-900/50 text-slate-450 hover:text-rose-400 text-[10px] font-bold cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>컷 삭제</span>
              </button>
            </div>
          </div>

          {/* Canvas Scrollable space */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {cuts.map((cut, index) => (
              <div
                key={cut.id}
                onClick={() => setActiveCutId(cut.id)}
                className={`p-5 rounded-3xl bg-slate-900 border transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row gap-5 ${
                  activeCutId === cut.id
                    ? 'border-purple-500 shadow-xl shadow-purple-500/5'
                    : 'border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="absolute top-0 left-0 px-3.5 py-1.5 rounded-br-2xl bg-slate-950/80 border-r border-b border-slate-850 text-slate-500 text-[10px] font-bold">
                  컷 #{index + 1}
                </div>

                {/* Draw panel visual placeholder */}
                <div className="w-full md:w-56 h-36 rounded-2xl bg-slate-950 border border-slate-850 flex flex-col items-center justify-center shrink-0 text-center gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent" />
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">AI 이미지 매핑 공간</span>
                </div>

                {/* Edit fields */}
                <div className="flex-1 space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">컷 시각 묘사 (AI 그림용 프롬프트)</label>
                    <textarea
                      value={cut.description}
                      onChange={(e) => updateCutField(cut.id, 'description', e.target.value)}
                      placeholder="예: 우주복을 입은 귀여운 외계인이 손을 흔들며 환하게 웃고 있다."
                      className="w-full h-12 px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 focus:border-purple-600 text-xs text-slate-200 placeholder-slate-650 resize-none outline-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500">캐릭터 말풍선 대사 (Dialogue)</label>
                    <input
                      type="text"
                      value={cut.dialogue}
                      onChange={(e) => updateCutField(cut.id, 'dialogue', e.target.value)}
                      placeholder="이 컷에 들어갈 대사를 작성해 주세요."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 focus:border-purple-600 text-xs text-slate-200 placeholder-slate-655 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Assistant Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>제미나이 AI 대사 추천기</span>
            </h3>

            <div className="text-[10px] text-slate-500 bg-slate-950 border border-slate-850/60 p-3 rounded-xl">
              <p className="font-semibold text-slate-400">선택된 컷: <span className="text-purple-400 font-bold">컷 #{activeCutIndex + 1}</span></p>
              <p className="mt-1 font-medium leading-relaxed">작성하신 컷 묘사와 대사 맥락을 분석하여 어울리는 말풍선 멘트와 아이디어를 생성합니다.</p>
            </div>

            <button
              onClick={getAiDialogue}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{aiLoading ? 'AI 대사 분석 중...' : 'AI 대사 추천받기'}</span>
            </button>

            {/* AI Error notification */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-455 text-[10px] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Clickable AI Suggestion Items list */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">클릭 시 대사창에 바로 입력</h4>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                  {aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateCutField(activeCutId, 'dialogue', s)}
                      className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-950 border border-slate-850 hover:border-purple-600/40 text-[11px] text-slate-350 hover:text-slate-100 transition-all font-medium leading-normal flex items-start gap-2 group"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share URL Modal */}
      {isShareModalOpen && slug && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[40px] pointer-events-none" />
            
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="h-12 w-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/5">
                <Globe className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-100">만화 배포 성공!</h3>
                <p className="text-xs text-slate-450 leading-relaxed">
                  작성하신 웹툰이 전 세계에 공개되었습니다.<br />
                  아래 고유 주소를 통해 로그인 없이 누구나 감상할 수 있습니다.
                </p>
              </div>

              <div className="w-full flex items-center gap-2 p-2 bg-slate-950 border border-slate-850 rounded-2xl mt-2 select-all">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/p/${slug}`}
                  className="bg-transparent border-none text-[11px] text-purple-300 font-semibold px-2 flex-1 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
              </div>

              <a
                href={`/p/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer block mt-2 text-center"
              >
                공유 페이지로 이동하여 확인하기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
