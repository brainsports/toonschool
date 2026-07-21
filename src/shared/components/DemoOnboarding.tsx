// 데모 체험 시작 안내 모달. 역할별 체험 동선 3단계 + 시작 버튼.
// profile.is_demo 이고 해당 역할의 "오늘 그만 보기" 플래그가 없을 때 표시.
// 닫기/시작 버튼으로 dismiss 처리. 일반 기능은 그대로 이용 가능.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Rocket, BookOpen, Trophy, Users, ClipboardCheck, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  isDemoOnboardingDismissed,
  dismissDemoOnboarding,
  type DemoRole,
} from '../lib/demoSession'

interface Guide {
  icon: typeof Rocket
  title: string
  desc: string
}
interface Cta {
  label: string
  to: string
  icon: typeof Rocket
}

const STUDENT_GUIDE: Guide[] = [
  { icon: BookOpen, title: '1. 추천 주제 살펴보기', desc: '학년·단원에 맞는 재미있는 만화 주제를 만나요.' },
  { icon: Rocket, title: '2. 툰마인드 만들어 보기', desc: 'AI 와 함께 단원을 마인드맵으로 정리해요.' },
  { icon: Trophy, title: '3. 내 작품·성장 기록 확인', desc: '만화와 꿈동산에서 내가 자란 흔적을 봐요.' },
]
const STUDENT_CTAS: Cta[] = [
  { label: '만화 만들기 체험', to: '/student/select-unit', icon: BookOpen },
  { label: '툰마인드 체험', to: '/student/mindmap', icon: Rocket },
  { label: '마이페이지 둘러보기', to: '/student/mypage', icon: Trophy },
]

const TEACHER_GUIDE: Guide[] = [
  { icon: Users, title: '1. 체험학급 살펴보기', desc: '체험 5학년반 학생 구성을 확인해요.' },
  { icon: ClipboardCheck, title: '2. 체험학생 작품 확인', desc: '학생이 만든 만화·툰마인드를 봐요.' },
  { icon: BarChart3, title: '3. 평가·성장 현황 확인', desc: '평가 화면과 성장 기록을 점검해요.' },
]
const TEACHER_CTAS: Cta[] = [
  { label: '체험학급 보기', to: '/admin/lms/classes', icon: Users },
  { label: '학생 작품 확인', to: '/admin/lms/dream-growth', icon: ClipboardCheck },
  { label: '평가 화면 둘러보기', to: '/admin/lms/assessments', icon: BarChart3 },
]

export default function DemoOnboarding({ role }: { role: DemoRole }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(
    () => !!profile?.is_demo && !isDemoOnboardingDismissed(role)
  )

  if (!open || !profile?.is_demo) return null

  const guide = role === 'student' ? STUDENT_GUIDE : TEACHER_GUIDE
  const ctas = role === 'student' ? STUDENT_CTAS : TEACHER_CTAS

  const close = () => {
    dismissDemoOnboarding(role)
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onClick={close}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-fuchsia-100 mb-3">
            <Sparkle />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800">
            {role === 'student' ? '툰스쿨 학생 체험에 오신 걸 환영해요!' : '툰스쿨 선생님 체험에 오신 걸 환영해요!'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">이렇게 둘러보면 가장 재밌어요.</p>
        </div>

        <ul className="space-y-3 mb-6">
          {guide.map((g) => (
            <li key={g.title} className="flex items-start gap-3 bg-pink-50/60 rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <g.icon className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">{g.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{g.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 gap-2">
          {ctas.map((c) => (
            <button
              key={c.to}
              type="button"
              onClick={() => {
                close()
                navigate(c.to)
              }}
              className="inline-flex items-center justify-center gap-2 w-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-sm py-3 rounded-2xl shadow-sm transition-colors"
            >
              <c.icon className="w-4 h-4" />
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 font-bold py-1"
        >
          나중에 둘러볼게요
        </button>
      </div>
    </div>
  )
}

function Sparkle() {
  return <span className="text-2xl">✨</span>
}
