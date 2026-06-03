import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../../shared/lib/supabase'
import { User, ArrowLeft, HelpCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ToonCut {
  id: string
  description: string
  dialogue: string
}

interface ToonProject {
  id: string
  title: string
  content: ToonCut[] | string
  user_id: string
  creator_email?: string
  status: string
  is_public: boolean
  slug: string
  updated_at: string
}

export default function ToonViewer() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<ToonProject | null>(null)
  const [creatorEmail, setCreatorEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) {
        setError('유효하지 않은 링크입니다.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 1. Fetch from Supabase by slug
        const { data, error: dbError } = await supabase
          .from('toon_projects')
          .select('*')
          .eq('slug', slug)
          .eq('is_public', true)
          .single()

        if (dbError) {
          throw dbError
        }

        if (data) {
          const fetchedProject = data as ToonProject
          setProject(fetchedProject)
          
          // Fetch creator email safely from profile
          if (fetchedProject.user_id && fetchedProject.user_id !== 'guest-user') {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', fetchedProject.user_id)
              .single()

            if (profileData?.email) {
              setCreatorEmail(profileData.email)
            }
          }
        } else {
          throw new Error('프로젝트를 찾을 수 없습니다.')
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to localStorage:', err)
        
        // 2. Fallback to localStorage
        const localDataStr = localStorage.getItem(`toon-project-${slug}`)
        if (localDataStr) {
          try {
            const parsed = JSON.parse(localDataStr) as ToonProject
            setProject(parsed)
            setCreatorEmail(parsed.creator_email || 'guest@toonschool.net')
          } catch (parseErr) {
            console.error('Failed to parse local project:', parseErr)
            setError('웹툰 데이터를 불러오는 데 실패했습니다.')
          }
        } else {
          setError('해당 주소의 웹툰을 찾을 수 없거나 비공개 상태입니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-450 font-medium">웹툰 콘텐츠를 불러오고 있습니다...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center space-y-6">
        <div className="inline-flex p-4 bg-rose-950/30 border border-rose-900/50 text-rose-400 rounded-3xl mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100">조회 실패</h2>
          <p className="text-xs text-slate-450 leading-relaxed">{error || '존재하지 않는 페이지입니다.'}</p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 text-xs font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>메인 페이지로 이동</span>
          </Link>
        </div>
      </div>
    )
  }

  // Normalize cuts content
  const cuts: ToonCut[] = Array.isArray(project.content)
    ? project.content
    : typeof project.content === 'string'
    ? JSON.parse(project.content)
    : []

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-16">
      {/* Viewer Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <Link
          to="/"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          TOONSCHOOL VIEWER
        </span>
        <div className="w-8 h-8" /> {/* Balance spacer */}
      </div>

      {/* Webtoon Title banner */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl font-black text-slate-100 px-4">{project.title}</h1>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-semibold">
          <User className="h-3.5 w-3.5" />
          <span>제작자: {creatorEmail || '비회원'}</span>
        </div>
      </div>

      {/* Webtoon scroll space */}
      <div className="space-y-12">
        {cuts.map((cut, index) => (
          <div key={cut.id || index} className="space-y-6 flex flex-col items-center">
            {/* Cartoon frame mapping */}
            <div className="w-full aspect-[4/3] rounded-3xl bg-slate-900 border border-slate-850 shadow-inner flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              {/* Artistic diagonal grids representing comic sketching */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-pink-500/5" />
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
              
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-850 text-slate-500 text-[10px] font-bold">
                Panel #{index + 1}
              </div>

              {/* Panel illustration text */}
              <div className="max-w-md px-4 space-y-2 z-10">
                <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Visual Scenario</span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                  &ldquo;{cut.description || '시각 묘사가 정의되지 않은 컷입니다.'}&rdquo;
                </p>
              </div>
            </div>

            {/* Speach bubble */}
            {cut.dialogue && (
              <div className="relative max-w-sm mx-auto z-10 px-4">
                <div className="bg-white text-slate-950 text-xs font-extrabold px-5 py-3 rounded-2xl shadow-xl shadow-slate-950/30 border border-slate-200 relative text-center leading-relaxed">
                  {cut.dialogue}
                  {/* Bubble pointer triangle */}
                  <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Viewer Footer */}
      <div className="pt-8 border-t border-slate-850 mt-12 text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium">재미있게 보셨나요? 만화의 핵심 개념을 퀴즈로 복습해 보세요!</p>
        </div>

        {/* Quiz Link Button */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-pink-400" />
            <span className="text-sm font-bold text-slate-200">배운 내용 퀴즈 풀기</span>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed">
            AI가 만화의 맥락에 맞추어 자동으로 생성한 맞춤형 학습 퀴즈를 풀어보세요.
          </p>
          <Link
            to={`/p/${project.slug}/quiz`}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-505 text-white font-bold text-xs shadow-md shadow-purple-500/10 transition-all cursor-pointer block text-center"
          >
            퀴즈 풀러 가기
          </Link>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-450 hover:text-slate-350 text-xs font-bold transition-all"
          >
            홈으로 가기
          </Link>
          {project.user_id === 'guest-user' && (
            <Link
              to="/toon"
              className="px-4 py-2 rounded-xl bg-purple-650 hover:bg-purple-600 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/5"
            >
              나도 만화 만들기
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
