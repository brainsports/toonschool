/**
 * 툰스쿨 학습툰 에디터 v2
 * 상단: 글로벌 헤더(홈/학습툰/내작품/관리) + 에디터 전용 툴바
 * 좌측: 표지/만화/대화/퀴즈 탭 + 5개 섹션 카드형 입력 패널
 * 우측: 탭별 A4 미리보기 (표지=커버, 만화=6컷 그리드, 대화=말풍선, 퀴즈=문제 카드)
 * Supabase: subjects → curriculum_units → curriculum_subunits 연동
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../shared/lib/supabase'
import { geminiClient } from '../../../shared/lib/gemini'
import { TonyFront } from '../../../components/characters/TonySheet'
import { RiaFront } from '../../../components/characters/RiaSheet'
import { HanaFront } from '../../../components/characters/HanaSheet'

// ── 타입 정의 ──────────────────────────────────────────────────────────
type EditorTab = '표지' | '만화' | '대화' | '퀴즈'
const EDITOR_TABS: EditorTab[] = ['표지', '만화', '대화', '퀴즈']

interface ToonCut {
  id: string
  description: string
  dialogue: string
  character: string
}

interface SubjectRow  { id: string; name: string; sort_order: number }
interface UnitRow     { id: string; unit_name: string; unit_number: number; semester: number }
interface SubunitRow  { id: string; subunit_name: string; subunit_number: number; learning_goal: string | null; key_questions: string[] }

type CoverBgType = 'gradient' | 'image'
type CharacterId = 'doyoon' | 'seoa' | 'hana'
type ResolutionOwner = CharacterId | 'all'

interface CoverState {
  title: string
  subtitle: string
  seriesNo: string
  author: string
  illustrator: string
  grade: number
  subjectId: string
  subjectName: string
  unitId: string
  unitName: string
  subunitId: string
  subunitName: string
  topic: string
  keyConcepts: string
  bgType: CoverBgType
  bgGradient: string
  bgImageUrl: string | null
  speechBubble: string
  customResolution: string
  selectedResolution: string
  resolutionOwner: ResolutionOwner
  characters: CharacterId[]
  autoStyle: boolean
  bgPattern: string[]
}

// ── 오늘의 각오 추천 리스트 ─────────────────────────────────────────
const RESOLUTION_OPTIONS = [
  '오늘은 내가 학습툰 작가예요!',
  '오늘도 끝까지 해볼래요!',
  '어려워도 포기하지 않을래요!',
  '재미있게 배우고 싶어요!',
  '내 생각을 만화로 표현할래요!',
  '친구에게 설명하듯 만들어볼래요!',
  '틀려도 다시 도전할래요!',
  '하나씩 차근차근 해볼래요!',
]

// ── 과목별 대표 표지 스타일 ─────────────────────────────────────────
interface SubjectTheme {
  title: string
  bgGradient: string
  decorations: string[]
  resolution: string
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  수학: {
    title: '툰스쿨 수학대소동',
    bgGradient: 'linear-gradient(135deg, #FFE566 0%, #FFB347 100%)', // 밝은 노랑
    decorations: ['1', '2', '3', '+', '-', '×', '÷', '📐', '⭐', '🎈'],
    resolution: '오늘은 내가 학습툰 작가예요!',
  },
  과학: {
    title: '툰스쿨 과학탐험',
    bgGradient: 'linear-gradient(135deg, #E0F2FE 0%, #34D399 100%)', // 밝은 하늘/민트
    decorations: ['⭐', '🪐', '🔬', '💡', '🚀', '🔭', '🎈'],
    resolution: '궁금한 것을 끝까지 탐구해 볼래요!',
  },
  국어: {
    title: '툰스쿨 국어대작전',
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FCA5A5 100%)', // 따뜻한 크림/연분홍
    decorations: ['📚', '✏️', '💬', '가', '나', '📖', '⭐'],
    resolution: '내 생각을 글과 말로 표현해 볼래요!',
  },
  사회: {
    title: '툰스쿨 사회탐험대',
    bgGradient: 'linear-gradient(135deg, #FFEDD5 0%, #F59E0B 100%)', // 연한 주황/베이지
    decorations: ['🗺️', '🌏', '🧭', '🏛️', '🚩', '⛺', '🎈'],
    resolution: '우리 주변 세상을 알아볼래요!',
  },
  영어: {
    title: '툰스쿨 영어모험',
    bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #34D399 100%)', // 밝은 민트/하늘
    decorations: ['A', 'B', 'C', '💬', '📘', '🌍', '⭐'],
    resolution: '영어로 자신 있게 말해볼래요!',
  },
}

// ── 색상 / 스타일 상수 ─────────────────────────────────────────────────
const C = {
  blue:   '#4F7BFF',
  purple: '#8B7CFF',
  mint:   '#7BE7C7',
  yellow: '#FFE58A',
  pink:   '#FF9BB5',
  text:   '#1E2A3A',
  muted:  '#8A96A8',
  border: '#E8EEFF',
  panel:  '#F8FAFF',
}

const GRADIENTS = [
  { label: '노랑', val: 'linear-gradient(135deg,#FFE566 0%,#FFB347 100%)' },
  { label: '블루', val: 'linear-gradient(135deg,#4F7BFF 0%,#8B7CFF 100%)' },
  { label: '핑크', val: 'linear-gradient(135deg,#FF9BB5 0%,#FF6B9D 100%)' },
  { label: '민트', val: 'linear-gradient(135deg,#7BE7C7 0%,#38BDF8 100%)' },
  { label: '주황', val: 'linear-gradient(135deg,#FFB347 0%,#FF6B6B 100%)' },
  { label: '보라', val: 'linear-gradient(135deg,#9B5CDB 0%,#C850C0 100%)' },
]

const CHARACTER_INFO: Record<CharacterId, { emoji: string; name: string; color: string; role: string }> = {
  doyoon: { emoji: '👦', name: '도윤',       color: '#4F7BFF', role: '호기심 탐구' },
  seoa:   { emoji: '👧', name: '서아',       color: '#FF9BB5', role: '핵심 정리' },
  hana:   { emoji: '👩‍🏫', name: '하나 선생님', color: '#8B7CFF', role: '친절한 설명' },
}

const GRADE_OPTIONS = [3, 4, 5, 6]

// ── 초기 커버 상태 ────────────────────────────────────────────────────
const INITIAL_COVER: CoverState = {
  title: '',
  subtitle: '',
  seriesNo: '1',
  author: '툰스쿨',
  illustrator: 'AI',
  grade: 5,
  subjectId: '',
  subjectName: '수학',
  unitId: '',
  unitName: '',
  subunitId: '',
  subunitName: '',
  topic: '',
  keyConcepts: '',
  bgType: 'gradient',
  bgGradient: 'linear-gradient(135deg, #FFE566 0%, #FFB347 100%)',
  bgImageUrl: null,
  speechBubble: '오늘은 내가 학습툰 작가예요!',
  customResolution: '',
  selectedResolution: '오늘은 내가 학습툰 작가예요!',
  resolutionOwner: 'all',
  characters: ['doyoon', 'seoa', 'hana'],
  autoStyle: true,
  bgPattern: ['1', '2', '3', '+', '-', '×', '÷', '⭐', '🎈'],
}

// ════════════════════════════════════════════════════════════
// 메인 에디터 컴포넌트
// ════════════════════════════════════════════════════════════
export default function ToonEditor() {
  const [activeTab, setActiveTab]   = useState<EditorTab>('표지')
  const [cover, setCover]           = useState<CoverState>(INITIAL_COVER)
  const [cuts, setCuts]             = useState<ToonCut[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: `cut-${i + 1}`, description: '', dialogue: '', character: 'doyoon'
    }))
  )
  const [activeCutId, setActiveCutId] = useState('cut-1')

  // Supabase 교과 데이터
  const [subjects,  setSubjects]  = useState<SubjectRow[]>([])
  const [units,     setUnits]     = useState<UnitRow[]>([])
  const [subunits,  setSubunits]  = useState<SubunitRow[]>([])
  const [unitLoading,    setUnitLoading]    = useState(false)
  const [subunitLoading, setSubunitLoading] = useState(false)

  // AI / 저장 상태
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [bgGenLoading, setBgGenLoading] = useState(false)
  const [projectId, setProjectId]     = useState<string | null>(null)
  const [slug, setSlug]               = useState<string | null>(null)
  const [dbStatus, setDbStatus]       = useState<{ type: 'success' | 'local'; msg: string } | null>(null)
  const [dbLoading, setDbLoading]     = useState(false)
  const [shareModal, setShareModal]   = useState(false)
  const [copied, setCopied]           = useState(false)

  // ── 과목 목록 로드 ────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('subjects')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setSubjects(data)
          if (data.length > 0) {
            const math = data.find(s => s.name === '수학') || data[0]
            setCover(p => {
              if (p.subjectId) return p
              const theme = SUBJECT_THEMES[math.name]
              return {
                ...p,
                subjectId: math.id,
                subjectName: math.name,
                bgGradient: theme ? theme.bgGradient : p.bgGradient,
                bgPattern: theme ? [...theme.decorations] : p.bgPattern,
                title: theme ? theme.title : p.title,
                speechBubble: theme ? theme.resolution : p.speechBubble,
              }
            })
          }
        }
      })
  }, [])

  // ── 단원 목록 로드 (학년+과목 변경 시) ───────────────────
  const fetchUnits = useCallback(async (grade: number, subjectId: string) => {
    if (!subjectId) return
    setUnitLoading(true)
    setUnits([]); setSubunits([])
    setCover(p => ({ ...p, unitId: '', unitName: '', subunitId: '', subunitName: '' }))
    const { data } = await supabase
      .from('curriculum_units')
      .select('id, unit_name, unit_number, semester')
      .eq('grade', grade)
      .eq('subject_id', subjectId)
      .order('semester')
      .order('unit_number')
    setUnits(data || [])
    setUnitLoading(false)
  }, [])

  useEffect(() => {
    if (cover.subjectId) {
      Promise.resolve().then(() => {
        fetchUnits(cover.grade, cover.subjectId)
      })
    }
  }, [cover.grade, cover.subjectId, fetchUnits])

  // ── 소단원 목록 로드 (단원 변경 시) ──────────────────────
  const fetchSubunits = useCallback(async (unitId: string) => {
    if (!unitId) return
    setSubunitLoading(true)
    setSubunits([])
    setCover(p => ({ ...p, subunitId: '', subunitName: '' }))
    const { data } = await supabase
      .from('curriculum_subunits')
      .select('id, subunit_name, subunit_number, learning_goal, key_questions')
      .eq('unit_id', unitId)
      .order('subunit_number')
    setSubunits(data || [])
    setSubunitLoading(false)
  }, [])

  useEffect(() => {
    if (cover.unitId) {
      Promise.resolve().then(() => {
        fetchSubunits(cover.unitId)
      })
    }
  }, [cover.unitId, fetchSubunits])

  // ── cover 헬퍼 ────────────────────────────────────────────
  const updateCover = (patch: Partial<CoverState>) =>
    setCover(p => ({ ...p, ...patch }))

  const handleSubjectChange = (subjectId: string, subjectName: string) => {
    const theme = SUBJECT_THEMES[subjectName]
    const patch: Partial<CoverState> = {
      subjectId,
      subjectName,
    }
    if (cover.autoStyle && theme) {
      patch.bgGradient = theme.bgGradient
      patch.bgPattern = [...theme.decorations]
      if (!cover.title || cover.title === '나의 학습툰' || Object.values(SUBJECT_THEMES).some(t => t.title === cover.title)) {
        patch.title = theme.title
      }
      if (!cover.customResolution) {
        patch.selectedResolution = theme.resolution
        patch.speechBubble = theme.resolution
      }
    }
    updateCover(patch)
  }

  const toggleCharacter = (id: CharacterId) =>
    updateCover({
      characters: cover.characters.includes(id)
        ? cover.characters.filter(c => c !== id)
        : [...cover.characters, id]
    })

  // ── AI 대사 추천 ──────────────────────────────────────────
  const getAiDialogue = async () => {
    const cut = cuts.find(c => c.id === activeCutId)
    if (!cut) return
    setAiLoading(true); setAiSuggestions([])
    const prompt = `학습툰 만화 컷 대사 추천:\n- ${cover.grade}학년 ${cover.subjectName}\n- 단원: ${cover.unitName || '미입력'}\n- 주제: ${cover.topic || '미입력'}\n- 이 컷 설명: ${cut.description || '없음'}\n위 상황에 맞는 초등학생 캐릭터 대사를 3가지 줄바꿈으로만 구분해 줘.`
    try {
      const result = await geminiClient.generateText(prompt)
      const lines = result.split('\n').map(l => l.replace(/^[-*•\d.\s]+/g, '').trim()).filter(l => l.length > 2).slice(0, 3)
      setAiSuggestions(lines.length > 0 ? lines : ['핵심 개념을 발견했어!', '이제 이해가 돼!', '같이 알아볼까?'])
    } catch {
      setAiSuggestions(['핵심 개념을 발견했어!', '이제 이해가 돼!', '같이 알아볼까?'])
    } finally { setAiLoading(false) }
  }

  // ── AI 배경 생성 (UI만 — 실제 이미지 API 미연동) ─────────
  const generateBg = async () => {
    setBgGenLoading(true)
    // 실제 이미지 생성 API 미연동 — 샘플 배경으로 대체
    await new Promise(r => setTimeout(r, 1500))
    const sampleGrads = [
      'linear-gradient(135deg,#FFE566 0%,#FFB347 100%)', // 노랑
      'linear-gradient(135deg,#4F7BFF 0%,#8B7CFF 100%)',  // 블루
      'linear-gradient(135deg,#FF9BB5 0%,#FF6B9D 100%)',  // 핑크
    ]
    const random = sampleGrads[Math.floor(Math.random() * sampleGrads.length)]
    updateCover({ bgGradient: random, bgType: 'gradient' })
    setBgGenLoading(false)
  }

  // ── 저장 ─────────────────────────────────────────────────
  const handleSave = async (isDraft: boolean) => {
    setDbLoading(true); setDbStatus(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || 'guest-user'
      const projectData = {
        title: cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '나의 학습툰',
        content: cuts,
        user_id: userId,
        grade: cover.grade,
        subject_id: cover.subjectId || null,
        unit_id: cover.unitId || null,
        subunit_id: cover.subunitId || null,
        topic: cover.topic,
        key_concepts: cover.keyConcepts ? cover.keyConcepts.split(',').map(s => s.trim()) : [],
        status: isDraft ? 'draft' : 'published',
        updated_at: new Date(),
      }
      const query = projectId
        ? supabase.from('toon_projects').update(projectData).eq('id', projectId)
        : supabase.from('toon_projects').insert([projectData]).select()
      const { data, error } = await query
      if (error) throw new Error(error.message)
      if (!projectId && Array.isArray(data) && data[0]?.id) setProjectId(data[0].id)
      setDbStatus({ type: 'success', msg: isDraft ? '임시 저장 완료' : '저장 완료' })
    } catch {
      localStorage.setItem(`toon-editor-${projectId || 'draft'}`, JSON.stringify({ cover, cuts }))
      setDbStatus({ type: 'local', msg: '로컬 백업 완료' })
    } finally {
      setDbLoading(false)
      setTimeout(() => setDbStatus(null), 4000)
    }
  }

  // ── 공유 ─────────────────────────────────────────────────
  const handlePublish = async () => {
    setDbLoading(true)
    const genSlug = slug || Math.random().toString(36).substring(2, 10)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || 'guest-user'
      const projectData = { title: cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '나의 학습툰', content: cuts, user_id: userId, status: 'published', is_public: true, publish_slug: genSlug, updated_at: new Date() }
      const query = projectId
        ? supabase.from('toon_projects').update(projectData).eq('id', projectId)
        : supabase.from('toon_projects').insert([projectData]).select()
      const { data, error } = await query
      if (error) throw new Error(error.message)
      if (!projectId && Array.isArray(data) && data[0]?.id) setProjectId(data[0].id)
    } catch {
      localStorage.setItem(`toon-share-${genSlug}`, JSON.stringify({ cover, cuts }))
    } finally {
      setSlug(genSlug); setShareModal(true); setDbLoading(false)
    }
  }

  const activeCutIdx = cuts.findIndex(c => c.id === activeCutId)
  const activeCut = cuts[activeCutIdx] || cuts[0]

  // AI 표지 생성 프롬프트 동적 생성
  const coverPromptText = `A bright, cheerful, and playful children's comic book cover design for a Korean educational comic series named 'TOONSCHOOL'. Format: Portrait, vertical A4 book cover ratio. Title: Large, thick, 3D bubble-style title text at the top center saying '${cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '툰스쿨 수학대소동'}' with thick outlines, multicolored letters (yellow, pink, mint, purple). Background: Bright yellow background decorated with colorful balloons, floating stars, sparkles, musical notes, and cute ${cover.subjectName || 'subject'} symbols like numbers (1, 2, 3) and operator symbols (+, -, x, =). A cute triangular pennant banner hangs at the very top. Characters: Three cute, rounded, and expressive cartoon characters standing on a light blue oval stage at the bottom: Hana Teacher (center-back, waving), Doyoon (left, young boy, playful pose), Seoa (right, young girl, smiling with a notebook). Art style: Cute, rounded, clean vector-style line art with vibrant colors, thick comic-book outlines, and high-quality illustration style typical of popular Korean children's learning comics. Details at the bottom: A clean sub-badge saying '${cover.grade}학년 ${cover.subjectName}' and small text saying '글: ${cover.author || '툰스쿨'} · 그림: ${cover.illustrator || 'AI'}'.`

  // ════════════════════════════════════════════════════════════
  // 렌더
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Noto Sans KR', sans-serif", background: '#F0F4FF' }}>

        {/* ── 1단: 글로벌 헤더 ─────────────────────────────────── */}
        <header style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
          borderBottom: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(79,123,255,0.08)',
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 0, zIndex: 200
        }}>
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 28, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 4px 10px rgba(79,123,255,0.3)'
            }}>🖼️</div>
            <span style={{ fontWeight: 900, fontSize: 16, color: C.text, letterSpacing: '-0.5px' }}>툰스쿨</span>
          </div>

          {/* 글로벌 nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Link to="/lms" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F0F4FF'; (e.currentTarget as HTMLAnchorElement).style.color = C.blue }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.muted }}>
              🏠 홈
            </Link>
            <div style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#EEF4FF', color: C.blue, boxShadow: `inset 0 0 0 1.5px ${C.blue}30` }}>
              🎨 학습툰 <span style={{ fontSize: 10, opacity: 0.7 }}>편집 중</span>
            </div>
            <Link to="/lms" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F0F4FF'; (e.currentTarget as HTMLAnchorElement).style.color = C.blue }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.muted }}>
              📂 내작품
            </Link>
            <Link to="/lms" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#F0F4FF'; (e.currentTarget as HTMLAnchorElement).style.color = C.blue }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.muted }}>
              ⚙️ 관리
            </Link>
          </nav>

          {/* 우측 사용자 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: C.muted, textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: C.text }}>관리자 선생님</div>
              <div style={{ fontSize: 10 }}>브레인스포츠(주)</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👩‍🏫</div>
          </div>
        </header>

        {/* ── 2단: 에디터 전용 툴바 ────────────────────────────── */}
        <div style={{
          background: '#fff', borderBottom: `1.5px solid ${C.border}`,
          height: 58, flexShrink: 0, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 16, boxShadow: '0 2px 8px rgba(79,123,255,0.06)', zIndex: 100
        }}>
          {/* 나가기 */}
          <Link to="/lms" style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10,
            fontSize: 12, fontWeight: 700, color: C.muted, textDecoration: 'none',
            background: '#F8FAFF', border: `1px solid ${C.border}`, flexShrink: 0
          }}>← 나가기</Link>

          <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

          {/* 편집 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                ✏️ {cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '학습툰 제목'}
              </span>
              {cover.unitName && (
                <span style={{
                  fontSize: 11, color: C.muted, background: '#F0F4FF', borderRadius: 8,
                  padding: '3px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240
                }}>
                  {cover.grade}학년 · {cover.subjectName} · {cover.unitName}
                </span>
              )}
            </div>
          </div>

          {/* 상태 배지 */}
          {dbStatus && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
              background: dbStatus.type === 'success' ? '#D1FAE5' : '#FEF3C7',
              color: dbStatus.type === 'success' ? '#059669' : '#D97706', flexShrink: 0
            }}>{dbStatus.msg}</span>
          )}

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => handleSave(true)}
              disabled={dbLoading}
              style={{
                padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`,
                background: '#F8FAFF', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, opacity: dbLoading ? 0.5 : 1
              }}>
              💾 임시저장
            </button>
            <button
              onClick={handlePublish}
              disabled={dbLoading}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#FF9BB5,#FF6B9D)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, opacity: dbLoading ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(255,107,157,0.3)'
              }}>
              🌍 공유하기
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={dbLoading}
              style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, opacity: dbLoading ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(79,123,255,0.35)'
              }}>
              ✅ 저장하기
            </button>
          </div>
        </div>

        {/* ── 본문 (좌측 패널 + 우측 미리보기) ─────────────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* ── 좌측 입력 패널 ─────────────────────────────────── */}
          <aside style={{
            width: 360, flexShrink: 0, background: '#fff',
            borderRight: `1.5px solid ${C.border}`, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '2px 0 12px rgba(79,123,255,0.04)'
          }}>
            {/* 탭 바 */}
            <div style={{ display: 'flex', borderBottom: `1.5px solid ${C.border}`, background: C.panel, flexShrink: 0 }}>
              {EDITOR_TABS.map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '13px 4px', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, transition: 'all 0.15s',
                  borderBottom: activeTab === tab ? `3px solid ${C.blue}` : '3px solid transparent',
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? C.blue : C.muted,
                }}>
                  {['📄', '🖼️', '💬', '🧠'][i]} {tab}
                </button>
              ))}
            </div>

            {/* 패널 컨텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>

              {/* ══ 표지 탭 ══════════════════════════════════════════ */}
              {activeTab === '표지' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* 섹션 1: 표지 기본정보 */}
                  <SectionCard icon="📌" number={1} title="표지 기본정보">
                    <FieldRow label="작품 제목">
                      <input
                        value={cover.title}
                        onChange={e => {
                          updateCover({ title: e.target.value })
                        }}
                        placeholder={SUBJECT_THEMES[cover.subjectName]?.title || "예: 툰스쿨 수학대소동"}
                        style={inputSt}
                      />
                    </FieldRow>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                      <FieldRow label="부제목 (선택)">
                        <input
                          value={cover.subtitle}
                          onChange={e => updateCover({ subtitle: e.target.value })}
                          placeholder="예: 계산 순서의 비밀"
                          style={inputSt}
                        />
                      </FieldRow>
                      <FieldRow label="시리즈 번호">
                        <input
                          value={cover.seriesNo}
                          onChange={e => updateCover({ seriesNo: e.target.value })}
                          placeholder="1"
                          style={inputSt}
                        />
                      </FieldRow>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <FieldRow label="글 저자">
                        <input value={cover.author} onChange={e => updateCover({ author: e.target.value })} style={inputSt} />
                      </FieldRow>
                      <FieldRow label="그림 저자">
                        <input value={cover.illustrator} onChange={e => updateCover({ illustrator: e.target.value })} style={inputSt} />
                      </FieldRow>
                    </div>
                  </SectionCard>

                  {/* 섹션 2: 학습정보 */}
                  <SectionCard icon="📚" number={2} title="학습정보">
                    {/* 학년 */}
                    <FieldRow label="학년">
                      <div style={{ display: 'flex', gap: 6 }}>
                        {GRADE_OPTIONS.map(g => (
                          <button key={g} onClick={() => updateCover({ grade: g })} style={{
                            flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                            background: cover.grade === g ? C.blue : C.panel,
                            color: cover.grade === g ? '#fff' : C.muted,
                            boxShadow: cover.grade === g ? '0 4px 10px rgba(79,123,255,0.3)' : 'none',
                          }}>{g}학년</button>
                        ))}
                      </div>
                    </FieldRow>

                    {/* 과목 */}
                    <FieldRow label="과목">
                      <select
                        value={cover.subjectId}
                        onChange={e => {
                          const found = subjects.find(s => s.id === e.target.value)
                          handleSubjectChange(e.target.value, found?.name || '')
                        }}
                        style={selectSt}
                      >
                        {subjects.length === 0 && <option value="">로딩 중...</option>}
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </FieldRow>

                    {/* 상세 학습정보 아코디언 */}
                    <details style={{ marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                      <summary style={{ fontSize: 11, fontWeight: 800, color: C.blue, cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        🔍 상세 학습정보 입력 (단원/주제)
                      </summary>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                        {/* 단원명 */}
                        <FieldRow label={`단원명 ${unitLoading ? '(조회 중...)' : `(${units.length}개)`}`}>
                          <select
                            value={cover.unitId}
                            onChange={e => {
                              const found = units.find(u => u.id === e.target.value)
                              updateCover({ unitId: e.target.value, unitName: found?.unit_name || '' })
                            }}
                            disabled={unitLoading || units.length === 0}
                            style={{ ...selectSt, opacity: (unitLoading || units.length === 0) ? 0.5 : 1 }}
                          >
                            <option value="">단원 선택</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.semester}학기 {u.unit_number}단원: {u.unit_name}</option>)}
                          </select>
                        </FieldRow>

                        {/* 소단원 */}
                        {cover.unitId && (
                          <FieldRow label={`소단원 (차시) ${subunitLoading ? '(조회 중...)' : `(${subunits.length}개)`}`}>
                            <select
                              value={cover.subunitId}
                              onChange={e => {
                                const found = subunits.find(s => s.id === e.target.value)
                                updateCover({ subunitId: e.target.value, subunitName: found?.subunit_name || '' })
                              }}
                              disabled={subunitLoading || subunits.length === 0}
                              style={{ ...selectSt, opacity: (subunitLoading || subunits.length === 0) ? 0.5 : 1 }}
                            >
                              <option value="">소단원/차시 선택</option>
                              {subunits.map(s => <option key={s.id} value={s.id}>{s.subunit_number}차시: {s.subunit_name}</option>)}
                            </select>
                          </FieldRow>
                        )}

                        {/* 학습 주제 */}
                        <FieldRow label="학습 주제">
                          <input
                            value={cover.topic}
                            onChange={e => updateCover({ topic: e.target.value })}
                            placeholder="예: 덧셈, 뺄셈, 괄호가 섞인 식의 계산 순서"
                            style={inputSt}
                          />
                        </FieldRow>

                        {/* 핵심 개념 */}
                        <FieldRow label="핵심 개념 (쉼표로 구분)">
                          <input
                            value={cover.keyConcepts}
                            onChange={e => updateCover({ keyConcepts: e.target.value })}
                            placeholder="예: 계산 순서, 괄호, 혼합식"
                            style={inputSt}
                          />
                        </FieldRow>
                      </div>
                    </details>
                  </SectionCard>

                  {/* 섹션 3: 캐릭터 선택 */}
                  <SectionCard icon="🎭" number={3} title="캐릭터 선택">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(Object.keys(CHARACTER_INFO) as CharacterId[]).map(id => {
                        const ch = CHARACTER_INFO[id]
                        const active = cover.characters.includes(id)
                        return (
                          <button key={id} onClick={() => toggleCharacter(id)} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            borderRadius: 14, border: active ? `2px solid ${ch.color}` : `2px solid ${C.border}`,
                            background: active ? ch.color + '12' : C.panel, cursor: 'pointer',
                            transition: 'all 0.15s', textAlign: 'left'
                          }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 12,
                              background: active ? ch.color + '25' : '#F1F5F9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 18, flexShrink: 0
                            }}>{ch.emoji}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: active ? ch.color : C.text }}>{ch.name}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{ch.role}</div>
                            </div>
                            <div style={{
                              width: 20, height: 20, borderRadius: 6,
                              background: active ? ch.color : '#E5EAF5',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {active && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </SectionCard>

                  {/* 섹션 4: 오늘의 각오 */}
                  <SectionCard icon="💬" number={4} title="오늘의 각오">
                    <FieldRow label="각오하는 사람">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                        <button onClick={() => updateCover({ resolutionOwner: 'all' })} style={{
                          padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                          background: cover.resolutionOwner === 'all' ? C.blue + '20' : C.panel,
                          border: cover.resolutionOwner === 'all' ? `2px solid ${C.blue}` : `2px solid ${C.border}`,
                          transition: 'all 0.15s', textAlign: 'center'
                        }}>
                          👥 모두 함께
                        </button>
                        {(Object.keys(CHARACTER_INFO) as CharacterId[]).map(id => {
                          const ch = CHARACTER_INFO[id]
                          return (
                            <button key={id} onClick={() => updateCover({ resolutionOwner: id })} style={{
                              padding: '6px 2px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                              background: cover.resolutionOwner === id ? ch.color + '20' : C.panel,
                              border: cover.resolutionOwner === id ? `2px solid ${ch.color}` : `2px solid ${C.border}`,
                              transition: 'all 0.15s', textAlign: 'center'
                            }}>
                              {ch.name.split(' ')[0]}
                            </button>
                          )
                        })}
                      </div>
                    </FieldRow>

                    <FieldRow label="추천 각오 선택">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                        {RESOLUTION_OPTIONS.map((opt, i) => (
                          <button key={i} onClick={() => {
                            updateCover({ selectedResolution: opt, speechBubble: cover.customResolution || opt })
                          }} style={{
                            padding: '6px 10px', borderRadius: 8, border: cover.selectedResolution === opt ? `1.5px solid ${C.blue}` : `1.5px solid ${C.border}`,
                            background: cover.selectedResolution === opt ? '#EEF4FF' : '#fff',
                            fontSize: 11, textAlign: 'left', cursor: 'pointer', transition: 'all 0.1s', color: C.text
                          }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </FieldRow>

                    <FieldRow label="오늘의 각오 직접 쓰기">
                      <textarea
                        value={cover.customResolution}
                        onChange={e => {
                          const val = e.target.value
                          updateCover({ customResolution: val, speechBubble: val || cover.selectedResolution })
                        }}
                        placeholder="예: 오늘은 계산 순서를 꼭 이해해 볼래요!"
                        rows={2}
                        style={{ ...inputSt, resize: 'none' as const }}
                      />
                    </FieldRow>
                  </SectionCard>

                  {/* 섹션 5: 표지 스타일 */}
                  <SectionCard icon="🎨" number={5} title="표지 스타일">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.text }}>과목별 자동 스타일 사용</span>
                      <input
                        type="checkbox"
                        checked={cover.autoStyle}
                        onChange={e => {
                          const checked = e.target.checked
                          const theme = SUBJECT_THEMES[cover.subjectName]
                          const patch: Partial<CoverState> = { autoStyle: checked }
                          if (checked && theme) {
                            patch.bgGradient = theme.bgGradient
                            patch.bgPattern = [...theme.decorations]
                          }
                          updateCover(patch)
                        }}
                        style={{ cursor: 'pointer', width: 18, height: 18 }}
                      />
                    </div>

                    {/* 그라데이션 선택 */}
                    <FieldRow label="배경 색상 (수동 선택 시 자동 스타일이 꺼집니다)">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                        {GRADIENTS.map(g => (
                          <button key={g.label} onClick={() => updateCover({ bgGradient: g.val, bgType: 'gradient', autoStyle: false })} title={g.label} style={{
                            height: 28, borderRadius: 8, border: cover.bgGradient === g.val ? `2.5px solid ${C.text}` : '2.5px solid transparent',
                            background: g.val, cursor: 'pointer', transition: 'all 0.15s',
                            transform: cover.bgGradient === g.val ? 'scale(1.08)' : 'scale(1)',
                            boxShadow: cover.bgGradient === g.val ? '0 3px 6px rgba(0,0,0,0.15)' : 'none',
                          }} />
                        ))}
                      </div>
                    </FieldRow>

                    {/* 장식 요소 멀티 셀렉트 */}
                    <FieldRow label="표지 장식 요소">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto', padding: '4px', background: C.panel, borderRadius: 10, border: `1px solid ${C.border}` }}>
                        {((SUBJECT_THEMES[cover.subjectName]?.decorations) || ['⭐', '🎈']).map(item => {
                          const isChecked = cover.bgPattern.includes(item)
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                const nextPattern = cover.bgPattern.includes(item)
                                  ? cover.bgPattern.filter(x => x !== item)
                                  : [...cover.bgPattern, item]
                                updateCover({ bgPattern: nextPattern, autoStyle: false })
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 11, fontWeight: 700, transition: 'all 0.1s',
                                background: isChecked ? C.blue : '#fff',
                                color: isChecked ? '#fff' : C.muted,
                                boxShadow: isChecked ? '0 2px 4px rgba(79,123,255,0.2)' : '0 1px 2px rgba(0,0,0,0.05)'
                              }}
                            >
                              {item}
                            </button>
                          )
                        })}
                      </div>
                    </FieldRow>
                  </SectionCard>
                </div>
              )}

              {/* ══ 만화 탭 ══════════════════════════════════════════ */}
              {activeTab === '만화' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, padding: '4px 0 8px' }}>📋 6컷 만화의 각 장면을 입력하세요.</div>
                  {cuts.map((cut, idx) => (
                    <div key={cut.id} onClick={() => setActiveCutId(cut.id)} style={{
                      padding: '14px', borderRadius: 16, cursor: 'pointer',
                      border: activeCutId === cut.id ? `2px solid ${C.blue}` : `2px solid ${C.border}`,
                      background: activeCutId === cut.id ? '#EEF4FF' : '#fff',
                      transition: 'all 0.15s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: activeCutId === cut.id ? `linear-gradient(135deg, ${C.blue}, ${C.purple})` : C.panel,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 900, color: activeCutId === cut.id ? '#fff' : C.muted
                        }}>{idx + 1}</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: activeCutId === cut.id ? C.blue : C.muted }}>컷 {idx + 1}</span>
                      </div>
                      <textarea
                        value={cut.description}
                        onChange={e => {
                          const val = e.target.value
                          setCuts(p => p.map(c => c.id === cut.id ? { ...c, description: val } : c))
                        }}
                        placeholder="이 컷의 배경과 상황을 묘사하세요"
                        rows={2}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: C.text, resize: 'none', lineHeight: 1.6, fontFamily: 'inherit' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ══ 대화 탭 ══════════════════════════════════════════ */}
              {activeTab === '대화' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* 컷 선택 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <button onClick={() => setActiveCutId(cuts[Math.max(0, activeCutIdx - 1)].id)} disabled={activeCutIdx === 0}
                      style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: activeCutIdx === 0 ? '#F1F5F9' : C.panel, opacity: activeCutIdx === 0 ? 0.4 : 1 }}>
                      ←
                    </button>
                    {cuts.map((c, i) => (
                      <button key={c.id} onClick={() => setActiveCutId(c.id)} style={{
                        width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                        background: activeCutId === c.id ? `linear-gradient(135deg, ${C.blue}, ${C.purple})` : C.panel,
                        color: activeCutId === c.id ? '#fff' : C.muted
                      }}>{i + 1}</button>
                    ))}
                    <button onClick={() => setActiveCutId(cuts[Math.min(cuts.length - 1, activeCutIdx + 1)].id)} disabled={activeCutIdx === cuts.length - 1}
                      style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: activeCutIdx === cuts.length - 1 ? '#F1F5F9' : C.panel, opacity: activeCutIdx === cuts.length - 1 ? 0.4 : 1 }}>
                      →
                    </button>
                  </div>

                  {/* 캐릭터 선택 */}
                  <SectionCard icon="🎭" number={activeCutIdx + 1} title={`${activeCutIdx + 1}컷 대사 편집`}>
                    <FieldRow label="말하는 캐릭터">
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(Object.keys(CHARACTER_INFO) as CharacterId[]).map(id => {
                          const ch = CHARACTER_INFO[id]
                          const active = activeCut?.character === id
                          return (
                            <button key={id} onClick={() => setCuts(p => p.map(c => c.id === activeCutId ? { ...c, character: id } : c))} style={{
                              flex: 1, padding: '7px 4px', borderRadius: 10, border: active ? `2px solid ${ch.color}` : `2px solid ${C.border}`,
                              background: active ? ch.color + '15' : C.panel, cursor: 'pointer', textAlign: 'center'
                            }}>
                              <div style={{ fontSize: 16 }}>{ch.emoji}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: active ? ch.color : C.muted, marginTop: 2 }}>{ch.name.split(' ')[0]}</div>
                            </button>
                          )
                        })}
                      </div>
                    </FieldRow>
                    <FieldRow label="대사">
                      <textarea
                        value={activeCut?.dialogue || ''}
                        onChange={e => setCuts(p => p.map(c => c.id === activeCutId ? { ...c, dialogue: e.target.value } : c))}
                        placeholder="이 컷에서 캐릭터가 할 말을 입력하세요."
                        rows={4}
                        style={{ ...inputSt, resize: 'none' as const }}
                      />
                    </FieldRow>
                  </SectionCard>

                  {/* AI 대사 추천 */}
                  <button onClick={getAiDialogue} disabled={aiLoading} style={{
                    width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                    background: aiLoading ? '#F0F4FF' : `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                    color: aiLoading ? C.muted : '#fff', fontSize: 13, fontWeight: 800, cursor: aiLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    ✨ {aiLoading ? 'AI 추천 생성 중...' : 'AI 대사 추천받기'}
                  </button>
                  {aiSuggestions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, paddingLeft: 4 }}>클릭하면 대사창에 입력됩니다</div>
                      {aiSuggestions.map((s, i) => (
                        <button key={i} onClick={() => setCuts(p => p.map(c => c.id === activeCutId ? { ...c, dialogue: s } : c))}
                          style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', fontSize: 12, color: C.text, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; (e.currentTarget as HTMLButtonElement).style.background = '#EEF4FF' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}>
                          → {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ 퀴즈 탭 ══════════════════════════════════════════ */}
              {activeTab === '퀴즈' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <SectionCard icon="🧠" number={1} title="퀴즈 미리보기">
                    <div style={{ background: '#F8FAFF', borderRadius: 14, padding: '16px', border: `1.5px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>
                        Q. {cover.topic ? `${cover.topic}에서 가장 중요한 개념은?` : '주제를 입력하면 퀴즈가 생성됩니다.'}
                      </div>
                      {cover.topic && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            `① ${cover.keyConcepts.split(',')[0]?.trim() || '개념 A'}`,
                            '② 관련 개념 B',
                            '③ 다른 개념 C',
                            '④ 틀린 개념 D',
                          ].map((opt, oi) => (
                            <div key={oi} style={{
                              padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                              background: oi === 0 ? '#D1FAE5' : '#fff',
                              border: `1.5px solid ${oi === 0 ? '#6EE7B7' : C.border}`,
                              color: oi === 0 ? '#059669' : C.muted
                            }}>
                              {opt}{oi === 0 && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                  <div style={{ padding: '12px 14px', background: '#EEF4FF', borderRadius: 12, fontSize: 12, color: C.blue, fontWeight: 600, lineHeight: 1.6 }}>
                    💡 표지 탭에서 학습 주제와 핵심 개념을 먼저 입력하면<br />AI가 자동으로 퀴즈를 생성합니다.
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── 우측 미리보기 ──────────────────────────────────── */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#2D3748' }}>
            {/* 미리보기 레이블 바 */}
            <div style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: C.blue }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>
                  {activeTab === '표지' ? 'A4 표지 미리보기' :
                   activeTab === '만화' ? '6컷 만화 미리보기' :
                   activeTab === '대화' ? '대화 말풍선 미리보기' : '퀴즈 미리보기'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {activeTab === '표지' ? 'A4 세로 · 실시간 반영' : '편집 내용 미리보기'}
              </span>
            </div>

            {/* 미리보기 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px' }}>

              {/* 표지 탭 미리보기 */}
              {activeTab === '표지' && (
                <A4CoverPreview cover={cover} />
              )}

              {/* 만화 탭 미리보기 */}
              {activeTab === '만화' && (
                <div style={{ width: '100%', maxWidth: 680 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16, textAlign: 'center' }}>
                      📖 {cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '학습툰'} — 6컷 만화
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {cuts.map((cut, idx) => (
                        <div key={cut.id} onClick={() => setActiveCutId(cut.id)} style={{
                          background: activeCutId === cut.id ? '#EEF4FF' : '#F8FAFF',
                          borderRadius: 14, padding: '14px',
                          border: activeCutId === cut.id ? `2px solid ${C.blue}` : `2px solid ${C.border}`,
                          cursor: 'pointer', minHeight: 100
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: activeCutId === cut.id ? C.blue : '#E5EAF5',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 900, color: activeCutId === cut.id ? '#fff' : C.muted
                            }}>{idx + 1}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: activeCutId === cut.id ? C.blue : C.muted }}>컷 {idx + 1}</span>
                          </div>
                          <div style={{ fontSize: 20, textAlign: 'center', padding: '8px 0', color: cut.description ? C.text : 'rgba(0,0,0,0.15)', minHeight: 40 }}>
                            {cut.description ? '🖼️' : ''}
                          </div>
                          {cut.description && (
                            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 4 }}>{cut.description}</div>
                          )}
                          {cut.dialogue && (
                            <div style={{ marginTop: 8, background: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: C.text, border: `1px solid ${C.border}` }}>
                              💬 {cut.dialogue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 대화 탭 미리보기 */}
              {activeTab === '대화' && (
                <div style={{ width: '100%', maxWidth: 480 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 20, textAlign: 'center' }}>
                      💬 {activeCutIdx + 1}컷 대화 미리보기
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {activeCut && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: CHARACTER_INFO[activeCut.character as CharacterId]?.color + '25' || '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                              {CHARACTER_INFO[activeCut.character as CharacterId]?.emoji || '🎭'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: CHARACTER_INFO[activeCut.character as CharacterId]?.color || C.blue, marginBottom: 4 }}>
                                {CHARACTER_INFO[activeCut.character as CharacterId]?.name || '캐릭터'}
                              </div>
                              <div style={{
                                background: '#EEF4FF', borderRadius: '0 14px 14px 14px',
                                padding: '12px 14px', fontSize: 13, color: C.text, lineHeight: 1.6,
                                border: `1.5px solid ${C.border}`
                              }}>
                                {activeCut.dialogue || '(대사를 입력해 주세요)'}
                              </div>
                            </div>
                          </div>
                          {activeCut.description && (
                            <div style={{ padding: '10px 14px', background: '#F8FAFF', borderRadius: 10, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                              📋 장면 설명: {activeCut.description}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {/* 컷 내비 */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 20, justifyContent: 'center' }}>
                      {cuts.map((c, i) => (
                        <button key={c.id} onClick={() => setActiveCutId(c.id)} style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800,
                          background: activeCutId === c.id ? `linear-gradient(135deg, ${C.blue}, ${C.purple})` : '#F1F5F9',
                          color: activeCutId === c.id ? '#fff' : C.muted
                        }}>{i + 1}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 퀴즈 탭 미리보기 */}
              {activeTab === '퀴즈' && (
                <div style={{ width: '100%', maxWidth: 480 }}>
                  <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '학습툰'} 퀴즈</div>
                      {cover.topic && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{cover.topic}</div>}
                    </div>
                    <div style={{ background: '#F8FAFF', borderRadius: 14, padding: '18px', border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 14 }}>
                        Q1. {cover.topic ? `${cover.topic}에서 가장 중요한 것은?` : '학습 주제를 입력하면 퀴즈가 자동 생성됩니다.'}
                      </div>
                      {cover.topic && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {[
                            cover.keyConcepts.split(',')[0]?.trim() || '개념 A',
                            '관련 개념 B',
                            '다른 개념 C',
                            '틀린 개념 D',
                          ].map((opt, oi) => (
                            <div key={oi} style={{
                              padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                              background: oi === 0 ? '#D1FAE5' : '#fff',
                              border: `1.5px solid ${oi === 0 ? '#6EE7B7' : C.border}`,
                              color: oi === 0 ? '#059669' : C.muted
                            }}>
                              {String.fromCharCode(9312 + oi)} {opt}{oi === 0 && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>
                      AI가 학습 내용을 바탕으로 문제를 생성합니다
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 상태 바 */}
            <div style={{
              padding: '10px 20px', background: 'rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>편집 중</span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {cover.grade}학년 · {cover.subjectName}{cover.unitName ? ` · ${cover.unitName}` : ''}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>⭐ TOONSCHOOL</div>
            </div>
          </main>
        </div>

        {/* ── 공유 모달 ────────────────────────────────────────── */}
        {shareModal && slug && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '32px', maxWidth: 420, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', position: 'relative' }}>
              <button onClick={() => setShareModal(false)} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F1F5F9', color: C.muted, fontSize: 16 }}>✕</button>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto', boxShadow: '0 8px 24px rgba(79,123,255,0.35)' }}>🎉</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>배포 완료!</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>아래 링크로 누구나 감상할 수 있습니다.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, background: '#F8FAFF', borderRadius: 12, padding: '10px 14px', border: `1.5px solid ${C.border}` }}>
                  <input readOnly value={`${window.location.origin}/p/${slug}`} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: C.text }} />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: copied ? '#059669' : C.blue, color: '#fff'
                  }}>{copied ? '✓ 복사됨' : '복사'}</button>
                </div>
                <a href={`/p/${slug}`} target="_blank" rel="noreferrer" style={{
                  display: 'block', padding: '12px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 14, color: '#fff', textAlign: 'center',
                  background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, boxShadow: '0 6px 20px rgba(79,123,255,0.35)'
                }}>공유 페이지로 이동하기 →</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── 교과별 유니폼 매핑 헬퍼 ───────────────────────────────
const getCostume = (subName: string): 'default' | 'science' | 'social' | 'math' | 'korean' | 'english' => {
  if (subName === '수학') return 'math'
  if (subName === '과학') return 'science'
  if (subName === '사회') return 'social'
  if (subName === '국어') return 'korean'
  if (subName === '영어') return 'english'
  return 'default'
}

// ── 상단 가랜드 장식 ───────────────────────────────────────
const Garland = () => {
  const colors = ['#FF6B9D', '#4F7BFF', '#7BE7C7', '#FFE58A', '#8B7CFF', '#FFB347', '#FF9BB5', '#1FC88A']
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 10px', zIndex: 5, pointerEvents: 'none' }}>
      {colors.map((c, i) => (
        <div key={i} style={{
          width: 0, height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderTop: `22px solid ${c}`,
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))'
        }} />
      ))}
    </div>
  )
}

// A4 커버 미리보기 컴포넌트 (과목별 맞춤형 어린이 학습만화책 커버 스타일)
// ════════════════════════════════════════════════════════════
function A4CoverPreview({ cover }: { cover: CoverState }) {
  const SUBJECT_EMOJI: Record<string, string> = {
    국어: '📖', 수학: '📐', 사회: '🗺️', 과학: '🔬',
    영어: '🌍', 도덕: '💛', 음악: '🎵', 미술: '🎨', 체육: '⚽',
  }

  // 글자별 입체 풍선 글씨용 색상 할당
  const getLetterColor = (idx: number) => {
    const colors = ['#FF6B9D', '#4F7BFF', '#7BE7C7', '#FFE58A', '#8B7CFF', '#FFB347']
    return colors[idx % colors.length]
  }

  const titleText = cover.title || SUBJECT_THEMES[cover.subjectName]?.title || '나의 학습툰'

  // 말풍선 각오 주인공 이름 매핑
  const getResolutionOwnerName = () => {
    if (cover.resolutionOwner === 'all') return '우리의 각오'
    return `${CHARACTER_INFO[cover.resolutionOwner]?.name || '캐릭터'}의 각오`
  }

  return (
    <div style={{
      width: '100%', maxWidth: 420,
      aspectRatio: '1 / 1.414',
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      position: 'relative',
      background: cover.bgType === 'gradient' ? cover.bgGradient : (cover.bgImageUrl ? `url(${cover.bgImageUrl}) center/cover` : cover.bgGradient),
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 상단 가랜드 */}
      <Garland />

      {/* 배경 플로팅 장식 및 기호 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* 원형 은은한 광원 효과 */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        
        {/* 풍선 장식 */}
        <div style={{ position: 'absolute', left: 14, top: 110, fontSize: 32, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.12))', zIndex: 2 }}>🎈</div>
        <div style={{ position: 'absolute', right: 14, top: 130, fontSize: 36, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.12))', zIndex: 2 }}>🎈</div>

        {/* 사용자가 설정한 장식 요소를 absolute로 흩뿌리기 */}
        {cover.bgPattern.map((decor, index) => {
          // 일정한 간격의 좌표로 배치되도록 인덱스 기반 포지셔닝
          const positions = [
            { left: '6%', top: '22%' },
            { right: '8%', top: '25%' },
            { left: '12%', top: '35%' },
            { right: '12%', top: '42%' },
            { left: '8%', top: '48%' },
            { right: '6%', top: '55%' },
            { left: '10%', top: '65%' },
            { right: '10%', top: '70%' },
            { left: '20%', top: '15%' },
            { right: '22%', top: '18%' },
          ]
          const pos = positions[index % positions.length]
          return (
            <div key={index} style={{
              position: 'absolute',
              left: pos.left,
              right: pos.right,
              top: pos.top,
              fontSize: 20,
              fontWeight: 900,
              color: 'rgba(45,27,14,0.18)',
              textShadow: '1px 1px 0 rgba(255,255,255,0.6)',
              userSelect: 'none'
            }}>
              {decor}
            </div>
          )
        })}
      </div>

      {/* 상단 브랜드 배지 */}
      <div style={{ padding: '24px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2D1B0E', borderRadius: 100, padding: '4px 12px', border: '1.5px solid #2D1B0E' }}>
          <span style={{ fontSize: 11 }}>{SUBJECT_EMOJI[cover.subjectName] || '📚'}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{cover.grade}학년 · {cover.subjectName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cover.seriesNo && (
            <div style={{ background: '#FF6B9D', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, border: '1.5px solid #2D1B0E', boxShadow: '1.5px 1.5px 0 #2D1B0E' }}>
              {cover.seriesNo}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, padding: '4px 10px', border: '1.5px solid rgba(255,255,255,0.4)' }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#2D1B0E', letterSpacing: '1px' }}>LEARNING TOON</span>
          </div>
        </div>
      </div>

      {/* 단원명 배지 */}
      {cover.unitName && (
        <div style={{ padding: '8px 16px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ background: '#FFF', borderRadius: 8, padding: '4px 10px', display: 'inline-block', border: '2px solid #2D1B0E', boxShadow: '2px 2px 0 #2D1B0E' }}>
            <span style={{ fontSize: 9.5, color: '#2D1B0E', fontWeight: 900 }}>
              {cover.unitName}{cover.subunitName ? ` › ${cover.subunitName}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 (제목 + 말풍선 + 캐릭터) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px', position: 'relative', zIndex: 2 }}>
        {/* 입체형 메인 타이틀 */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#2D1B0E', letterSpacing: '2px', marginBottom: 6 }}>신나는 교과 학습만화</div>
          <h1 style={{
            fontSize: titleText.length > 12 ? 26 : 32,
            fontWeight: 900,
            lineHeight: 1.25,
            margin: 0,
            fontFamily: 'inherit',
            wordBreak: 'keep-all',
            letterSpacing: '-1.2px',
            textAlign: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1px'
          }}>
            {titleText.split('').map((char, idx) => (
              <span key={idx} style={{
                color: getLetterColor(idx),
                textShadow: `
                  -2.5px -2.5px 0 #2D1B0E,
                   2.5px -2.5px 0 #2D1B0E,
                  -2.5px  2.5px 0 #2D1B0E,
                   2.5px  2.5px 0 #2D1B0E,
                   0px  5px 0 #2D1B0E,
                   0px  7px 10px rgba(45,27,14,0.4)
                `
              }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
          {cover.subtitle && (
            <div style={{
              display: 'inline-block',
              marginTop: 10,
              background: '#FFE566',
              color: '#2D1B0E',
              fontSize: 11,
              fontWeight: 900,
              padding: '3px 12px',
              borderRadius: 8,
              border: '1.5px solid #2D1B0E',
              boxShadow: '1.5px 1.5px 0 #2D1B0E'
            }}>
              {cover.subtitle}
            </div>
          )}
        </div>

        {/* 오늘의 각오 말풍선 */}
        {cover.speechBubble && (
          <div style={{
            position: 'absolute',
            bottom: 162,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '85%',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#fff',
              border: '2.5px solid #2D1B0E',
              borderRadius: 18,
              padding: '8px 12px',
              boxShadow: '0 4px 0 #2D1B0E, 0 6px 12px rgba(45,27,14,0.15)',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* 각오 주인공 이름표 배지 */}
              <div style={{
                position: 'absolute',
                top: -10,
                left: 12,
                background: '#FF6B9D',
                border: '1.5px solid #2D1B0E',
                borderRadius: 6,
                padding: '1px 6px',
                fontSize: 8.5,
                fontWeight: 900,
                color: '#fff',
                boxShadow: '1px 1px 0 #2D1B0E'
              }}>
                📢 {getResolutionOwnerName()}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: '#2D1B0E', lineHeight: 1.35, wordBreak: 'keep-all', paddingTop: 3 }}>
                {cover.speechBubble}
              </div>
              {/* 말풍선 꼬리 */}
              <div style={{ position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '9px solid #2D1B0E' }} />
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff' }} />
            </div>
          </div>
        )}

        {/* 하단 무대 (블루 타원형) */}
        <div style={{
          position: 'absolute',
          bottom: 36,
          left: '5%',
          right: '5%',
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #64B5F6 0%, #1976D2 100%)',
          border: '3.5px solid #2D1B0E',
          boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.4), 0 8px 16px rgba(0,0,0,0.2)',
          zIndex: 1,
        }} />

        {/* 캐릭터 3인방 배치 */}
        <div style={{ position: 'absolute', bottom: 38, left: 0, right: 0, height: 160, zIndex: 2, pointerEvents: 'none' }}>
          {/* 도윤 (좌측) */}
          {cover.characters.includes('doyoon') && (
            <div style={{ position: 'absolute', left: '12%', bottom: 10, width: 85, height: 110 }}>
              <TonyFront expression="happy" costume={getCostume(cover.subjectName)} />
            </div>
          )}
          {/* 하나 선생님 (중앙) */}
          {cover.characters.includes('hana') && (
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 12, width: 115, height: 145, zIndex: 3 }}>
              <HanaFront expression="smile" costume={getCostume(cover.subjectName)} />
            </div>
          )}
          {/* 서아 (우측) */}
          {cover.characters.includes('seoa') && (
            <div style={{ position: 'absolute', right: '12%', bottom: 10, width: 85, height: 110 }}>
              <RiaFront expression="happy" costume={getCostume(cover.subjectName)} />
            </div>
          )}
        </div>
      </div>

      {/* 하단 저작 정보 및 브랜드 로고 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        background: '#2D1B0E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 5
      }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
          글: {cover.author || '툰스쿨'} · 그림: {cover.illustrator || 'AI'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[0, 1, 2].map(i => (
              <svg key={i} width="8" height="8" viewBox="0 0 24 24" fill="#FFD700" opacity={0.9}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 900, color: '#FFE566', letterSpacing: '1px' }}>
            TOONSCHOOL
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 유틸 컴포넌트 ─────────────────────────────────────────
function SectionCard({ icon, number, title, children }: {
  icon: string; number: number; title: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: `1.5px solid ${C.border}`,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(79,123,255,0.05)'
    }}>
      <div style={{
        padding: '12px 16px', background: 'linear-gradient(135deg, #F8FAFF, #F0F4FF)',
        borderBottom: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0
        }}>{number}</div>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{icon} {title}</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── 공통 스타일 ───────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 12,
  border: `1.5px solid ${C.border}`, background: C.panel,
  fontSize: 13, color: C.text, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}

const selectSt: React.CSSProperties = {
  ...inputSt, cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A96A8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  paddingRight: 36,
}
