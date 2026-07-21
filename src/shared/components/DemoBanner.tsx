// 데모(체험) 계정일 때 상단에 표시하는 안내 배너.
// profile.is_demo === true 인 경우만 렌더. 학생/교사 화면 모두에서 사용.
// - "내 계정 만들기": /signup 으로 이동(체험 종료 후 가입 유도).
// - "체험 종료": 로그아웃 + 데모 상태 정리 + 홈('/') 이동.
import { useNavigate } from 'react-router-dom'
import { Sparkles, UserPlus, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function DemoBanner() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!profile?.is_demo) return null

  const handleExit = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div
      role="status"
      className="w-full bg-gradient-to-r from-fuchsia-50 via-pink-50 to-amber-50 border-b border-pink-200/70 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2 justify-center text-center"
    >
      <span className="inline-flex items-center gap-1.5 text-pink-700 font-bold text-xs sm:text-sm">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>지금은 툰스쿨 <span className="text-pink-600">체험 계정</span>으로 둘러보는 중이에요. 체험 내용은 자주 초기화될 수 있어요.</span>
      </span>
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 px-3 py-1.5 rounded-full shadow-sm transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          내 계정 만들기
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-pink-700 bg-white hover:bg-pink-50 px-3 py-1.5 rounded-full border border-pink-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          체험 종료
        </button>
      </span>
    </div>
  )
}
