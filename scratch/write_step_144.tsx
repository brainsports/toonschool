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
type CharacterId = 'tony' | 'ria' | 'hana'

interface CoverState {
  title: string
  subtitle: string
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
  speechCharacter: CharacterId
  characters: CharacterId[]
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
  { label: '블루', val: 'linear-gradient(135deg,#4F7BFF 0%,#8B7CFF 100%)' },
  { label: '핑크', val: 'linear-gradient(135deg,#FF9BB5 0%,#FF6B9D 100%)' },
  { label: '민트', val: 'linear-gradient(135deg,#7BE7C7 0%,#38BDF8 100%)' },
  { label: '주황', val: 'linear-gradient(135deg,#FFB347 0%,#FF6B6B 100%)' },
  { label: '보라', val: 'linear-gradient(135deg,#9B5CDB 0%,#C850C0 100%)' },
  { label: '초록', val: 'linear-gradient(135deg,#1FC88A 0%,#17BBBE 100%)' },
]

const CHARACTER_INFO: Record<CharacterId, { emoji: string; name: string; color: string; role: string }> = {
  tony:  { emoji: '👦', name: '토니',       color: '#4F7BFF', role: '호기심 탐구' },
  ria:   { emoji: '👧', name: '리아',       color: '#FF9BB5', role: '핵심 정리' },
  hana:  { emoji: '👩‍🏫', name: '하나 선생님', color: '#8B7CFF', role: '친절한 설명' },
}

const GRADE_OPTIONS = [3, 4, 5, 6]

// ── 초기 커버 상태 ────────────────────────────────────────────────────
const INITIAL_COVER: CoverState = {
  title: '나의 학습툰',
  subtitle: '',
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
  bgGradient: GRADIENTS[0].val,
  bgImageUrl: null,
  speechBubble: '6컷 만화로 핵심 개념을 알아봐요! 🎨',
  speechCharacter: 'tony',
  characters: ['tony', 'ria', 'hana'],
}

// ════════════════════════════════════════════════════════════
// 메인 에디터 컴포넌트
// ════════════════════════════════════════════════════════════
export default function ToonEditor() {
  const [activeTab, setActiveTab]   = useState<EditorTab>('표지')
  const [cover, setCover]           = useState<CoverState>(INITIAL_COVER)
  const [cuts, setCuts]             = useState<ToonCut[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: `cut-${i + 1}`, description: '', dialogue: '', character: 'tony'
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

  // 핵심 개념 태그
  const [conceptInput, setConceptInput] = useState('')

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
          if (!cover.subjectId && data.length > 0) {
            const math = data.find(s => s.name === '수학') || data[0]
            setCover(p => ({ ...p, subjectId: math.id, subjectName: math.name }))
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
    if (cover.subjectId) fetchUnits(cover.grade, cover.subjectId)
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
    if (cover.unitId) fetchSubunits(cover.unitId)
  }, [cover.unitId, fetchSubunits])

  // ── cover 헬퍼 ────────────────────────────────────────────
  const updateCover = (patch: Partial<CoverState>) =>
    setCover(p => ({ ...p, ...patch }))

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
      'linear-gradient(135deg,#4F7BFF 20%,#8B7CFF 100%)',
      'linear-gradient(135deg,#7BE7C7 0%,#4F7BFF 100%)',
      'linear-gradient(135deg,#FF9BB5 0%,#8B7CFF 100%)',
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
        title: cover.title,
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
      const projectData = { title: cover.title, content: cuts, user_id: userId, status: 'published', is_public: true, publish_slug: genSlug, updated_at: new Date() }
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
                ✏️ {cover.title || '학습툰 제목'}
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
                        onChange={e => updateCover({ title: e.target.value })}
                        placeholder="예: 덧셈과 뺄셈의 혼합 계산 배우기"
                        style={inputSt}
                      />
                    </FieldRow>
                    <FieldRow label="부제목 (선택)">
                      <input
                        value={cover.subtitle}
                        onChange={e => updateCover({ subtitle: e.target.value })}
                        placeholder="예: 계산 순서의 비밀"
                        style={inputSt}
                      />
                    </FieldRow>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <FieldRow label="글">
                        <input value={cover.author} onChange={e => updateCover({ author: e.target.value })} style={inputSt} />
                      </FieldRow>
                      <FieldRow label="그림">
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
                          updateCover({ subjectId: e.target.value, subjectName: found?.name || '' })
                        }}
                        style={selectSt}
                      >
                        {subjects.length === 0 && <option value="">로딩 중...</option>}
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </FieldRow>

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
                      {cover.keyConcepts && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {cover.keyConcepts.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                            <span key={tag} style={{
                              background: '#EEF4FF', color: C.blue, borderRadius: 8,
                              padding: '3px 10px', fontSize: 11, fontWeight: 700
                            }}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </FieldRow>
                  </SectionCard>

                  {/* 섹션 3: 표지 배경 */}
                  <SectionCard icon="🖌️" number={3} title="표지 배경">
                    {/* 그라데이션 선택 */}
                    <FieldRow label="배경 색상">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                        {GRADIENTS.map(g => (
                          <button key={g.label} onClick={() => updateCover({ bgGradient: g.val, bgType: 'gradient' })} title={g.label} style={{
                            height: 32, borderRadius: 10, border: cover.bgGradient === g.val ? `2.5px solid ${C.text}` : '2.5px solid transparent',
                            background: g.val, cursor: 'pointer', transition: 'all 0.15s',
                            transform: cover.bgGradient === g.val ? 'scale(1.12)' : 'scale(1)',
                            boxShadow: cover.bgGradient === g.val ? '0 4px 10px rgba(0,0,0,0.2)' : 'none',
                          }} />
                        ))}
                      </div>
                    </FieldRow>

                    {/* AI 생성 */}
                    <button
                      onClick={generateBg}
                      disabled={bgGenLoading}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                        background: bgGenLoading ? '#F0F4FF' : `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                        color: bgGenLoading ? C.muted : '#fff',
                        fontSize: 13, fontWeight: 800, cursor: bgGenLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: bgGenLoading ? 'none' : '0 4px 14px rgba(79,123,255,0.3)',
                        transition: 'all 0.2s'
                      }}>
                      {bgGenLoading ? '⏳ AI 배경 생성 중...' : '✨ AI 표지 배경 만들기'}
                    </button>

                    {/* 이미지 업로드 */}
                    <FieldRow label="이미지 업로드 (선택)">
                      <div style={{
                        border: `2px dashed ${C.border}`, borderRadius: 12, padding: '20px',
                        textAlign: 'center', cursor: 'pointer', background: C.panel
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
                        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                          클릭하여 이미지 업로드
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>PNG, JPG, GIF 지원</div>
                      </div>
                    </FieldRow>
                  </SectionCard>

                  {/* 섹션 4: 말풍선 */}
                  <SectionCard icon="💬" number={4} title="말풍선">
                    <FieldRow label="말풍선 주인공">
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(Object.keys(CHARACTER_INFO) as CharacterId[]).map(id => {
                          const ch = CHARACTER_INFO[id]
                          return (
                            <button key={id} onClick={() => updateCover({ speechCharacter: id })} style={{
                              flex: 1, padding: '8px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
                              background: cover.speechCharacter === id ? ch.color + '20' : C.panel,
                              border: cover.speechCharacter === id ? `2px solid ${ch.color}` : `2px solid ${C.border}`,
                              transition: 'all 0.15s', textAlign: 'center'
                            } as React.CSSProperties}>
                              <div style={{ fontSize: 18 }}>{ch.emoji}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: cover.speechCharacter === id ? ch.color : C.muted, marginTop: 2 }}>{ch.name}</div>
                            </button>
                          )
                        })}
                      </div>
                    </FieldRow>
                    <FieldRow label="말풍선 문구">
                      <textarea
                        value={cover.speechBubble}
                        onChange={e => updateCover({ speechBubble: e.target.value })}
                        placeholder="예: 계산 순서의 비밀을 함께 알아봐요!"
                        rows={3}
                        style={{ ...inputSt, resize: 'none' as const }}
                      />
                    </FieldRow>
                  </SectionCard>

                  {/* 섹션 5: 캐릭터 표시 */}
                  <SectionCard icon="🎭" number={5} title="캐릭터 표시">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(Object.keys(CHARACTER_INFO) as CharacterId[]).map(id => {
                        const ch = CHARACTER_INFO[id]
                        const active = cover.characters.includes(id)
                        return (
                          <button key={id} onClick={() => toggleCharacter(id)} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            borderRadius: 14, border: active ? `2px solid ${ch.color}` : `2px solid ${C.border}`,
                            background: active ? ch.color + '12' : C.panel, cursor: 'pointer',
                            transition: 'all 0.15s', textAlign: 'left'
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 14,
                              background: active ? ch.color + '25' : '#F1F5F9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 22, flexShrink: 0
                            }}>{ch.emoji}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: active ? ch.color : C.text }}>{ch.name}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{ch.role}</div>
                            </div>
                            <div style={{
                              width: 22, height: 22, borderRadius: 6,
                              background: active ? ch.color : '#E5EAF5',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {active && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 8, padding: '10px 12px', background: '#EEF4FF', borderRadius: 10, fontSize: 11, color: C.blue, fontWeight: 600 }}>
                      💡 캐릭터는 표지 하단에 표시됩니다. 여러 명 선택 가능합니다.
                    </div>
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
                      📖 {cover.title || '학습툰'} — 6컷 만화
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
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{cover.title || '학습툰'} 퀴즈</div>
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

// ════════════════════════════════════════════════════════════
// A4 커버 미리보기 컴포넌트
// ════════════════════════════════════════════════════════════
function A4CoverPreview({ cover }: { cover: CoverState }) {
  const SUBJECT_EMOJI: Record<string, string> = {
    국어: '📖', 수학: '📐', 사회: '🗺️', 과학: '🔬',
    영어: '🌍', 도덕: '💛', 음악: '🎵', 미술: '🎨', 체육: '⚽',
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
      {/* 배경 장식 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* 원 장식 */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        {/* 별 장식 */}
        {[[80, 40], [85, 18], [12, 60], [65, 92]].map(([x, y], i) => (
          <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, opacity: 0.6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
        ))}
      </div>

      {/* 상단 배지 줄 */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: 100, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.3)' }}>
          <span style={{ fontSize: 14 }}>{SUBJECT_EMOJI[cover.subjectName] || '📚'}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{cover.grade}학년 · {cover.subjectName}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.25)' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>TOONSCHOOL</span>
        </div>
      </div>

      {/* 단원명 배지 */}
      {cover.unitName && (
        <div style={{ padding: '8px 16px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 10px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
              {cover.unitName}{cover.subunitName ? ` › ${cover.subunitName}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* 메인 제목 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', position: 'relative', zIndex: 2, gap: 8 }}>
        <div style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
          borderRadius: 20, padding: '20px 18px', width: '100%',
          border: '1.5px solid rgba(255,255,255,0.3)',
          textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '2px', marginBottom: 6, textTransform: 'uppercase' }}>학습툰 TOONSCHOOL</div>
          <h1 style={{ fontSize: cover.title.length > 16 ? 16 : 20, fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)', wordBreak: 'keep-all' }}>
            {cover.title || '제목을 입력해 주세요'}
          </h1>
          {cover.subtitle && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: 600 }}>{cover.subtitle}</p>
          )}
        </div>

        {/* 핵심 개념 태그 */}
        {cover.keyConcepts && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {cover.keyConcepts.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map(tag => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700,
                borderRadius: 100, padding: '3px 10px', border: '1px solid rgba(255,255,255,0.3)'
              }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* 말풍선 */}
        {cover.speechBubble && (
          <div style={{ position: 'relative', maxWidth: '90%' }}>
            <div style={{
              background: '#fff', borderRadius: '20px 20px 20px 6px',
              padding: '10px 14px', boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{CHARACTER_INFO[cover.speechCharacter].emoji}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{cover.speechBubble}</span>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -7, left: 14, width: 0, height: 0, borderTop: '8px solid #fff', borderRight: '8px solid transparent' }} />
          </div>
        )}
      </div>

      {/* 캐릭터 영역 */}
      {cover.characters.length > 0 && (
        <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'center', gap: 8, position: 'relative', zIndex: 2 }}>
          {cover.characters.map(id => {
            const ch = CHARACTER_INFO[id]
            return (
              <div key={id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'rgba(255,255,255,0.18)', borderRadius: 16,
                padding: '10px 12px', border: '1.5px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontSize: 28 }}>{ch.emoji}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{ch.name.split(' ')[0]}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* 하단 바 */}
      <div style={{
        padding: '10px 16px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
          글: {cover.author} · 그림: {cover.illustrator}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => (
            <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#FFD700" opacity={0.9}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 유틸 컴포넌트
// ════════════════════════════════════════════════════════════
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
