import { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─────────────────────────────────────────────────────────────────────────────
   툰스쿨 LMS 대시보드 v2
   메뉴 구조: 홈 / 학습툰(→/toon) / 내작품 / 관리
   관리 하위: 관리자메인 / 학급관리 / 학생관리 / 선생님관리 / 수업현황 / 수업결과
   역할별 조건부 렌더링: teacher(선생님) / student(학생)
───────────────────────────────────────────────────────────────────────────── */

// ── 타입 ──
type MainTab = 'home' | 'myworks' | 'manage'
type ManageSubTab = 'admin-main' | 'class' | 'student' | 'teacher' | 'progress' | 'result'
type UserRole = 'teacher' | 'student'

// ── 색상 상수 ──
const C = {
  blue:   '#4F7BFF',
  sky:    '#6EDCFF',
  purple: '#8B7CFF',
  mint:   '#7BE7C7',
  yellow: '#FFE58A',
  pink:   '#FF9BB5',
  text:   '#2F3A4A',
  muted:  '#8A96A8',
  card:   '#FFFFFF',
  bgFrom: '#EAF5FF',
  bgTo:   '#F3EFFF',
}

// ── 샘플 데이터 ──
const STUDENTS = [
  { num: 1, name: '권진원', id: 'oksan14', pw: '1234', progress: 75, works: 3 },
  { num: 2, name: '김민준', id: 'oksan16', pw: '1234', progress: 50, works: 2 },
  { num: 3, name: '이예준', id: 'oksan18', pw: '1234', progress: 100, works: 5 },
  { num: 4, name: '박소윤', id: 'oksan20', pw: '1234', progress: 30, works: 1 },
  { num: 5, name: '최지호', id: 'oksan22', pw: '1234', progress: 0, works: 0 },
  { num: 6, name: '정하은', id: 'oksan24', pw: '1234', progress: 90, works: 4 },
]

const MY_WORKS = [
  { id: 1, title: '자연수의 혼합 계산', status: '완성', date: '2026.06.10', thumbnail: '📐', subject: '수학', quizScore: 85 },
  { id: 2, title: '광합성의 비밀', status: '임시저장', date: '2026.06.12', thumbnail: '🌱', subject: '과학', quizScore: null },
  { id: 3, title: '이야기 속 주제 찾기', status: '공유됨', date: '2026.06.08', thumbnail: '📖', subject: '국어', quizScore: 92 },
  { id: 4, title: '우리 지역의 변화', status: '완성', date: '2026.06.05', thumbnail: '🗺️', subject: '사회', quizScore: 78 },
]

const CLASSES = [
  { grade: 5, name: 'oksan team5', students: 6, progress: 72 },
  { grade: 4, name: 'oksan team4', students: 8, progress: 45 },
  { grade: 6, name: 'oksan team6', students: 5, progress: 88 },
]

const TEACHERS = [
  { name: '김지영', id: 'teacher01', email: 'jy@toon.co', classes: '5학년 team5', status: '활성' },
  { name: '박현수', id: 'teacher02', email: 'hs@toon.co', classes: '4학년 team4', status: '활성' },
  { name: '이서연', id: 'teacher03', email: 'sy@toon.co', classes: '6학년 team6', status: '비활성' },
]

// ── 배경 장식 ──
function BgDecorations() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {[
        { x: '5%',  y: '8%',  size: 18, op: 0.2 },
        { x: '90%', y: '5%',  size: 14, op: 0.18 },
        { x: '15%', y: '75%', size: 12, op: 0.15 },
        { x: '80%', y: '60%', size: 16, op: 0.18 },
        { x: '70%', y: '15%', size: 20, op: 0.17 },
        { x: '35%', y: '5%',  size: 11, op: 0.15 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, opacity: s.op }}>
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill={C.blue}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
      ))}
      {[
        { x: '2%',  y: '12%', scale: 0.8, op: 0.1 },
        { x: '75%', y: '3%',  scale: 1.0, op: 0.08 },
        { x: '45%', y: '85%', scale: 0.9, op: 0.08 },
      ].map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, opacity: c.op, transform: `scale(${c.scale})` }}>
          <svg width="80" height="40" viewBox="0 0 80 40">
            <ellipse cx="40" cy="28" rx="38" ry="12" fill={C.purple}/>
            <ellipse cx="25" cy="22" rx="18" ry="14" fill={C.purple}/>
            <ellipse cx="50" cy="20" rx="20" ry="16" fill={C.purple}/>
          </svg>
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: '8%', left: '5%', right: '5%', opacity: 0.05 }}>
        <svg width="100%" height="30" viewBox="0 0 1200 30">
          <line x1="0" y1="15" x2="1200" y2="15" stroke={C.blue} strokeWidth="3" strokeDasharray="20,15"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', right: '2%', top: '38%', opacity: 0.1, transform: 'rotate(-20deg)' }}>
        <svg width="30" height="80" viewBox="0 0 30 80">
          <rect x="8" y="5" width="14" height="55" rx="3" fill={C.yellow}/>
          <polygon points="8,60 22,60 15,75" fill={C.text}/>
          <rect x="8" y="3" width="14" height="8" rx="3" fill={C.pink}/>
        </svg>
      </div>
      {[{ x: '8%', y: '45%' }, { x: '88%', y: '35%' }].map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, opacity: 0.07 }}>
          <svg width="50" height="40" viewBox="0 0 50 40">
            <rect x="0" y="0" width="50" height="30" rx="10" fill={C.mint}/>
            <polygon points="10,28 20,30 15,40" fill={C.mint}/>
          </svg>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 홈 탭 — 역할별 분기
// ════════════════════════════════════════════════════════════
function HomeTab({ role }: { role: UserRole }) {
  if (role === 'teacher') return <TeacherHome />
  return <StudentHome />
}

function TeacherHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 선생님 배너 */}
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.purple} 100%)`,
        borderRadius: 24, padding: '28px 32px', color: '#fff',
        boxShadow: '0 8px 32px rgba(79,123,255,0.25)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👩‍🏫</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>브레인스포츠(주) 관리자 선생님</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>브레인스포츠(주)</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '8px 18px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>🏫 5학년 oksan team5 · 6명</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>▼</span>
          </div>
        </div>
      </div>

      {/* 현황 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { icon: '👥', label: '전체 학생 수', value: '19명', color: C.blue, bg: '#EEF4FF' },
          { icon: '🎨', label: '학습툰 제작 개수', value: '8개', color: C.purple, bg: '#F0EEFF' },
          { icon: '✅', label: '학습툰 완성률', value: '72%', color: C.mint, bg: '#EDFDF8' },
          { icon: '🏫', label: '담당 학급 수', value: '3개', color: '#FF9BB5', bg: '#FFF0F5' },
        ].map(card => (
          <div key={card.label} style={{
            background: C.card, borderRadius: 20, padding: '20px 18px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: `1px solid ${card.bg}`,
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 학습툰 활동 */}
      <div style={{ background: C.card, borderRadius: 20, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          📅 최근 학습툰 활동
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginLeft: 4 }}>최근 14일 기준</span>
        </div>
        <div style={{ textAlign: 'center', padding: '36px 20px', background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, borderRadius: 14 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>최근 14일 내 학습툰 활동이 없습니다.</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>학습툰 메뉴에서 새 학습툰 제작을 시작해 보세요!</div>
        </div>
      </div>

      {/* 학급별 현황 */}
      <div style={{ background: C.card, borderRadius: 20, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>🏫 학급별 현황</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {CLASSES.map(cls => (
            <div key={cls.name} style={{ background: `linear-gradient(135deg, ${C.bgFrom}, ${C.bgTo})`, borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.blue, marginBottom: 4 }}>{cls.grade}학년 {cls.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>학생 {cls.students}명</div>
              <div style={{ background: '#E5EAF5', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, width: `${cls.progress}%`, transition: 'width 0.5s' }}/>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: 'right' }}>진행률 {cls.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 바로가기 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: '🎨', label: '새 학습툰 만들기', color: C.blue, bg: '#EEF4FF', to: '/toon' },
          { icon: '👥', label: '학생 관리', color: C.purple, bg: '#F0EEFF', to: null },
          { icon: '📊', label: '수업 현황', color: C.mint, bg: '#EDFDF8', to: null },
          { icon: '📋', label: '수업 결과', color: '#FF9BB5', bg: '#FFF0F5', to: null },
        ].map(q => (
          q.to ? (
            <Link key={q.label} to={q.to} style={{
              background: C.card, borderRadius: 16, padding: '16px 12px', textAlign: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${q.bg}`,
              textDecoration: 'none', display: 'block'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 8px' }}>{q.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: q.color }}>{q.label}</div>
            </Link>
          ) : (
            <div key={q.label} style={{
              background: C.card, borderRadius: 16, padding: '16px 12px', textAlign: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${q.bg}`
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 8px' }}>{q.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: q.color }}>{q.label}</div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

function StudentHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 학생 배너 */}
      <div style={{
        background: `linear-gradient(135deg, #FF9BB5 0%, ${C.purple} 100%)`,
        borderRadius: 24, padding: '28px 32px', color: '#fff',
        boxShadow: '0 8px 32px rgba(139,124,255,0.25)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎨</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>권진원 학생, 안녕하세요! 👋</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>5학년 oksan team5</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/toon" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.9)', color: C.purple,
              borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 800,
              textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>✨ 새 학습툰 만들기</Link>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12,
              padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>📂 이어서 만들기</button>
          </div>
        </div>
      </div>

      {/* 내 학습 현황 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: '🎨', label: '만든 학습툰', value: '3개', color: C.blue, bg: '#EEF4FF' },
          { icon: '✅', label: '완성한 작품', value: '2개', color: C.mint, bg: '#EDFDF8' },
          { icon: '🌟', label: '퀴즈 평균 점수', value: '88점', color: C.purple, bg: '#F0EEFF' },
        ].map(card => (
          <div key={card.label} style={{
            background: C.card, borderRadius: 20, padding: '22px 18px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: `1px solid ${card.bg}`,
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 작업한 학습툰 */}
      <div style={{ background: C.card, borderRadius: 20, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>🕐 최근 작업한 학습툰</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {MY_WORKS.slice(0, 2).map(w => (
            <div key={w.id} style={{
              background: `linear-gradient(135deg, ${C.bgFrom}, ${C.bgTo})`,
              borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'center',
              cursor: 'pointer'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C.blue + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{w.thumbnail}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{w.subject} · {w.date}</div>
              </div>
              <div style={{
                background: w.status === '완성' ? '#D1FAE5' : w.status === '임시저장' ? '#FEF3C7' : '#DBEAFE',
                color: w.status === '완성' ? '#059669' : w.status === '임시저장' ? '#D97706' : '#1D4ED8',
                borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, flexShrink: 0
              }}>{w.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 내작품 탭 — 역할별 분기
// ════════════════════════════════════════════════════════════
function MyWorksTab({ role }: { role: UserRole }) {
  const [filter, setFilter] = useState<'all' | 'done' | 'draft' | 'shared'>('all')

  const filtered = MY_WORKS.filter(w => {
    if (filter === 'done')   return w.status === '완성'
    if (filter === 'draft')  return w.status === '임시저장'
    if (filter === 'shared') return w.status === '공유됨'
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 헤더 */}
      <div style={{
        background: `linear-gradient(135deg, ${C.mint} 0%, ${C.sky} 100%)`,
        borderRadius: 20, padding: '20px 24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 16
      }}>
        <div style={{ fontSize: 40 }}>📂</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{role === 'teacher' ? '학생 작품 목록' : '내 작품'}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
            {role === 'teacher' ? '담당 학급 학생들의 학습툰 작품을 확인합니다.' : '내가 만든 학습툰을 확인하고 관리합니다.'}
          </div>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'all',    label: '📚 전체',     count: MY_WORKS.length },
          { key: 'done',   label: '✅ 완성',     count: MY_WORKS.filter(w => w.status === '완성').length },
          { key: 'draft',  label: '💾 임시저장', count: MY_WORKS.filter(w => w.status === '임시저장').length },
          { key: 'shared', label: '🌍 공유됨',   count: MY_WORKS.filter(w => w.status === '공유됨').length },
        ].map(btn => (
          <button key={btn.key} onClick={() => setFilter(btn.key as typeof filter)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            background: filter === btn.key ? C.blue : C.card,
            color: filter === btn.key ? '#fff' : C.muted,
            boxShadow: filter === btn.key ? '0 4px 12px rgba(79,123,255,0.3)' : '0 2px 6px rgba(0,0,0,0.06)',
          }}>
            {btn.label}
            <span style={{
              background: filter === btn.key ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              color: filter === btn.key ? '#fff' : C.muted,
              borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 800
            }}>{btn.count}</span>
          </button>
        ))}
      </div>

      {/* 작품 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {filtered.map(w => (
          <div key={w.id} style={{
            background: C.card, borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1.5px solid #F0F4FF',
            transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)' }}
          >
            {/* 썸네일 */}
            <div style={{
              height: 100, background: `linear-gradient(135deg, ${C.bgFrom}, ${C.bgTo})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative'
            }}>
              {w.thumbnail}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: w.status === '완성' ? '#D1FAE5' : w.status === '임시저장' ? '#FEF3C7' : '#DBEAFE',
                color: w.status === '완성' ? '#059669' : w.status === '임시저장' ? '#D97706' : '#1D4ED8',
                borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700
              }}>{w.status === '완성' ? '✅ 완성' : w.status === '임시저장' ? '💾 임시저장' : '🌍 공유됨'}</div>
            </div>
            {/* 정보 */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>📚 {w.subject} · {w.date}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>{w.title}</div>
              {w.quizScore && (
                <div style={{ fontSize: 12, color: C.purple, fontWeight: 700, marginBottom: 12 }}>
                  🧠 퀴즈 점수: {w.quizScore}점
                </div>
              )}
              {/* 액션 버튼 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {w.status === '임시저장' && (
                  <Link to="/toon" style={{
                    padding: '6px 12px', borderRadius: 8, background: C.blue, color: '#fff',
                    fontSize: 11, fontWeight: 700, textDecoration: 'none'
                  }}>✏️ 이어 만들기</Link>
                )}
                <button style={{ padding: '6px 12px', borderRadius: 8, background: '#EEF4FF', color: C.blue, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>👁️ 보기</button>
                {w.status === '완성' && (
                  <button style={{ padding: '6px 12px', borderRadius: 8, background: '#EDF9F4', color: '#059669', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>📥 PDF</button>
                )}
                {w.quizScore && (
                  <button style={{ padding: '6px 12px', borderRadius: 8, background: '#F0EEFF', color: C.purple, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🧠 퀴즈 결과</button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 새 작품 만들기 카드 */}
        <Link to="/toon" style={{
          background: C.card, borderRadius: 20, border: `2px dashed ${C.blue}40`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '32px', textAlign: 'center', minHeight: 200,
          cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s'
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#EEF4FF'; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.blue }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = C.card; (e.currentTarget as HTMLAnchorElement).style.borderColor = `${C.blue}40` }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>새 학습툰 만들기</div>
          <div style={{ fontSize: 11, color: C.muted }}>표지 → 만화 → 대화 → 퀴즈</div>
        </Link>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 관리 탭
// ════════════════════════════════════════════════════════════
function ManageTab() {
  const [sub, setSub] = useState<ManageSubTab>('admin-main')

  const SUB_MENUS: Array<{ id: ManageSubTab; icon: string; label: string }> = [
    { id: 'admin-main', icon: '📊', label: '관리자메인' },
    { id: 'class',      icon: '🏫', label: '학급관리' },
    { id: 'student',    icon: '👧', label: '학생관리' },
    { id: 'teacher',    icon: '👩‍🏫', label: '선생님관리' },
    { id: 'progress',   icon: '📈', label: '수업현황' },
    { id: 'result',     icon: '🏆', label: '수업결과' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 서브 메뉴 탭 바 */}
      <div style={{
        background: C.card, borderRadius: 20, padding: '12px 16px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)', display: 'flex', gap: 6, flexWrap: 'wrap'
      }}>
        {SUB_MENUS.map(m => (
          <button key={m.id} onClick={() => setSub(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            transition: 'all 0.15s',
            background: sub === m.id ? `linear-gradient(135deg, ${C.blue}, ${C.purple})` : '#F8FAFF',
            color: sub === m.id ? '#fff' : C.muted,
            boxShadow: sub === m.id ? '0 4px 12px rgba(79,123,255,0.3)' : 'none',
          }}>
            <span>{m.icon}</span><span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* 서브 콘텐츠 */}
      {sub === 'admin-main' && <AdminMain />}
      {sub === 'class'      && <ClassManage />}
      {sub === 'student'    && <StudentManage />}
      {sub === 'teacher'    && <TeacherManage />}
      {sub === 'progress'   && <ProgressView />}
      {sub === 'result'     && <ResultView />}
    </div>
  )
}

// ── 관리자메인 ──
function AdminMain() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 이용권 */}
      <div style={{
        background: 'linear-gradient(135deg, #EEF4FF, #F0EEFF)',
        borderRadius: 20, padding: '22px 24px', border: '1.5px solid #D6E4FF'
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>🎟️ 이용권 정보</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: '📅', label: '사용 기간', value: '2026.02.26 ~ 2026.12.31', color: C.text },
            { icon: '📦', label: '사용 / 구매', value: '27개 / 100개', color: C.blue },
            { icon: '✨', label: '사용 가능', value: '73개', color: C.purple },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 현황 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { icon: '🏫', label: '전체 학급', value: '3개', color: C.blue, bg: '#EEF4FF' },
          { icon: '👧', label: '전체 학생', value: '19명', color: C.purple, bg: '#F0EEFF' },
          { icon: '👩‍🏫', label: '선생님', value: '3명', color: C.mint, bg: '#EDFDF8' },
          { icon: '🎨', label: '제작 중인 학습툰', value: '8개', color: '#FF9BB5', bg: '#FFF0F5' },
        ].map(card => (
          <div key={card.label} style={{
            background: C.card, borderRadius: 18, padding: '18px 14px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: `1px solid ${card.bg}`,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 학급관리 ──
function ClassManage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['➕ 학급 생성', '✏️ 학급 수정', '🔄 학급 이동', '🗑️ 학급 삭제'].map(btn => (
          <button key={btn} style={{
            padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, background: btn.includes('삭제') ? '#FEF2F2' : C.card,
            color: btn.includes('삭제') ? '#EF4444' : C.blue,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}>{btn}</button>
        ))}
      </div>
      {/* 학년 탭 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1,2,3,4,5,6].map(g => (
          <button key={g} style={{
            padding: '8px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            background: g === 5 ? C.blue : C.card,
            color: g === 5 ? '#fff' : C.muted,
            boxShadow: g === 5 ? '0 4px 10px rgba(79,123,255,0.3)' : '0 2px 6px rgba(0,0,0,0.05)'
          }}>{g}학년</button>
        ))}
      </div>
      {/* 학급 목록 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {CLASSES.map(cls => (
          <div key={cls.name} style={{
            background: C.card, borderRadius: 18, padding: '20px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1.5px solid #F0F4FF'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏫</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>{cls.grade}학년</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{cls.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>학생 {cls.students}명</div>
            <div style={{ background: '#F1F5F9', borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`, width: `${cls.progress}%` }}/>
            </div>
            <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>진행률 {cls.progress}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 학생관리 ──
function StudentManage() {
  const [selected, setSelected] = useState<number[]>([])
  const toggleAll = () => setSelected(p => p.length === STUDENTS.length ? [] : STUDENTS.map(s => s.num))
  const toggle = (n: number) => setSelected(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { label: '📥 명단 내려받기', bg: '#16A34A', color: '#fff' },
          { label: '✏️ 정보 수정',    bg: C.blue,   color: '#fff' },
          { label: '🔄 학급 이동',    bg: C.purple, color: '#fff' },
          { label: '🗑️ 학생 삭제',   bg: '#FEF2F2', color: '#EF4444' },
          { label: '➕ 학생 생성하기', bg: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, color: '#fff' },
        ].map(btn => (
          <button key={btn.label} style={{
            padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, background: btn.bg, color: btn.color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'transform 0.1s'
          }}>{btn.label}</button>
        ))}
      </div>
      {/* 표 */}
      <div style={{ background: C.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #EEF4FF, #F0EEFF)' }}>
              <th style={{ padding: '14px 18px', textAlign: 'left', width: 44 }}>
                <input type="checkbox" checked={selected.length === STUDENTS.length} onChange={toggleAll}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.blue }} />
              </th>
              {['번호', '이름', '아이디', '비밀번호'].map(h => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: C.blue, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STUDENTS.map((s, i) => (
              <tr key={s.num} style={{ background: selected.includes(s.num) ? '#EEF4FF' : i % 2 === 0 ? '#FAFCFF' : '#fff', borderTop: '1.5px solid #F0F4FF' }}>
                <td style={{ padding: '14px 18px' }}>
                  <input type="checkbox" checked={selected.includes(s.num)} onChange={() => toggle(s.num)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.blue }} />
                </td>
                <td style={{ padding: '14px 18px', fontWeight: 700, color: C.muted }}>{s.num}</td>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: C.text, fontSize: 15 }}>{s.name}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 600, color: C.blue }}>{s.id}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: C.muted }}>****</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 선생님관리 ──
function TeacherManage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['➕ 선생님 계정 생성', '✏️ 정보 수정', '🔑 권한 설정', '🗑️ 계정 삭제'].map(btn => (
          <button key={btn} style={{
            padding: '9px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, background: btn.includes('삭제') ? '#FEF2F2' : C.card,
            color: btn.includes('삭제') ? '#EF4444' : C.blue, boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}>{btn}</button>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #EEF4FF, #F0EEFF)' }}>
              {['이름', '아이디', '이메일', '담당 학급', '상태'].map(h => (
                <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: C.blue, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEACHERS.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? '#FAFCFF' : '#fff', borderTop: '1.5px solid #F0F4FF' }}>
                <td style={{ padding: '14px 18px', fontWeight: 800, color: C.text }}>{t.name}</td>
                <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: C.blue }}>{t.id}</td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: C.muted }}>{t.email}</td>
                <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 600, color: C.purple }}>{t.classes}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    background: t.status === '활성' ? '#D1FAE5' : '#FEF2F2',
                    color: t.status === '활성' ? '#059669' : '#EF4444',
                    borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700
                  }}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 수업현황 ──
function ProgressView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>📈 학생별 학습툰 제작 진행 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STUDENTS.map(s => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFF', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎨</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>작품 {s.works}개</div>
                </div>
                <div style={{ background: '#E5EAF5', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    background: s.progress === 100 ? `linear-gradient(90deg, ${C.mint}, #0EA5E9)` :
                      s.progress > 50 ? `linear-gradient(90deg, ${C.blue}, ${C.purple})` : `linear-gradient(90deg, ${C.yellow}, #FF9BB5)`,
                    width: `${s.progress}%`, transition: 'width 0.5s'
                  }}/>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.progress === 100 ? '#059669' : C.blue, flexShrink: 0 }}>{s.progress}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 수업결과 ──
function ResultView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {MY_WORKS.filter(w => w.status !== '임시저장').map(w => (
          <div key={w.id} style={{
            background: C.card, borderRadius: 20, padding: '20px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.07)', border: '1.5px solid #F0F4FF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{w.thumbnail}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{w.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📚 {w.subject} · {w.date}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <div style={{ background: '#EEF4FF', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.blue }}>{w.quizScore ?? '—'}점</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>퀴즈 점수</div>
              </div>
              <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.purple }}>{w.status}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>작품 상태</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 메인 LMS 컴포넌트
// ════════════════════════════════════════════════════════════
export default function LMSDashboard() {
  const [activeTab, setActiveTab] = useState<MainTab>('home')
  const [role, setRole] = useState<UserRole>('teacher')   // 데모용 역할 토글
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const MAIN_TABS: Array<{ id: MainTab; icon: string; label: string; teacherOnly?: boolean }> = [
    { id: 'home',    icon: '🏠', label: '홈' },
    { id: 'myworks', icon: '📂', label: '내작품' },
    { id: 'manage',  icon: '⚙️', label: '관리', teacherOnly: true },
  ]

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`,
        fontFamily: "'Noto Sans KR', sans-serif",
        position: 'relative'
      }}>
        <BgDecorations />

        {/* ── 상단 네비게이션 바 ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
          borderBottom: '1.5px solid rgba(79,123,255,0.1)',
          boxShadow: '0 4px 24px rgba(79,123,255,0.08)'
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* 로고 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32, flexShrink: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, boxShadow: '0 4px 12px rgba(79,123,255,0.35)', position: 'relative'
              }}>
                🖼️
                <div style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, background: C.yellow, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>✨</div>
              </div>
              <span style={{ fontWeight: 900, fontSize: 18, color: C.text, letterSpacing: '-0.5px' }}>툰스쿨</span>
            </div>

            {/* 메인 탭 */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              {/* 홈 */}
              {MAIN_TABS.filter(t => !t.teacherOnly || role === 'teacher').map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                  background: activeTab === tab.id ? '#EEF4FF' : 'transparent',
                  color: activeTab === tab.id ? C.blue : C.muted,
                  boxShadow: activeTab === tab.id ? `inset 0 0 0 1.5px ${C.blue}40, 0 2px 8px rgba(79,123,255,0.12)` : 'none',
                }}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}

              {/* 학습툰 → /toon 링크 */}
              <Link to="/toon" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 12,
                fontSize: 14, fontWeight: 700, color: C.muted,
                background: 'transparent', textDecoration: 'none', transition: 'all 0.15s'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#FFF0F5'; (e.currentTarget as HTMLAnchorElement).style.color = '#FF9BB5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = C.muted }}
              >
                <span>🎨</span><span>학습툰</span>
                <span style={{ fontSize: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>에디터 →</span>
              </Link>
            </nav>

            {/* 오른쪽 정보 + 역할 토글 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {/* 역할 토글 (데모용) */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowRoleMenu(p => !p)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 10, border: `1.5px solid ${role === 'teacher' ? C.blue : C.purple}30`,
                  background: role === 'teacher' ? '#EEF4FF' : '#F0EEFF',
                  color: role === 'teacher' ? C.blue : C.purple,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}>
                  {role === 'teacher' ? '👩‍🏫 선생님' : '👧 학생'} <span style={{ fontSize: 10 }}>▼</span>
                </button>
                {showRoleMenu && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, zIndex: 200,
                    background: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '1.5px solid #F0F4FF', overflow: 'hidden', minWidth: 130
                  }}>
                    {[
                      { key: 'teacher', label: '👩‍🏫 선생님 모드' },
                      { key: 'student', label: '👧 학생 모드' },
                    ].map(r => (
                      <button key={r.key} onClick={() => { setRole(r.key as UserRole); setShowRoleMenu(false); setActiveTab('home') }} style={{
                        width: '100%', padding: '11px 16px', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700, textAlign: 'left',
                        background: role === r.key ? '#EEF4FF' : '#fff',
                        color: role === r.key ? C.blue : C.text,
                        display: 'block'
                      }}>{r.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                  {role === 'teacher' ? '관리자 선생님' : '권진원 학생'}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>브레인스포츠(주)</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${role === 'teacher' ? C.blue : C.purple}, ${role === 'teacher' ? C.purple : C.pink})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                boxShadow: '0 4px 10px rgba(79,123,255,0.3)'
              }}>
                {role === 'teacher' ? '👩‍🏫' : '👧'}
              </div>
              <button style={{
                padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${C.blue}30`,
                background: '#F8FAFF', color: C.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}>로그아웃</button>
            </div>
          </div>
        </header>

        {/* ── 콘텐츠 ── */}
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>
          {activeTab === 'home'    && <HomeTab role={role} />}
          {activeTab === 'myworks' && <MyWorksTab role={role} />}
          {activeTab === 'manage'  && role === 'teacher' && <ManageTab />}
          {activeTab === 'manage'  && role === 'student' && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
              <div style={{ fontSize: 48 }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>접근 권한이 없습니다.</div>
            </div>
          )}
        </main>

        {/* ── 오른쪽 플로팅 버튼 ── */}
        <div style={{ position: 'fixed', right: 24, bottom: 32, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200 }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
            borderRadius: 20, padding: '12px 14px', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(79,123,255,0.4)', textAlign: 'center', color: '#fff', minWidth: 66,
            transition: 'transform 0.15s'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px) scale(1.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
          >
            <div style={{ fontSize: 26, marginBottom: 4 }}>🐻</div>
            <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.3 }}>툰스쿨<br/>도우미</div>
          </div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#fff', color: C.blue, fontSize: 18,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>↑</button>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#fff', color: C.blue, fontSize: 18,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>↓</button>
        </div>
      </div>
    </>
  )
}
