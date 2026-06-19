// 학생 로그인 페이지
import { useNavigate } from 'react-router-dom'
import StudentPageShell from '../components/layout/StudentPageShell'
import LoginForm from '../components/forms/LoginForm'
import StudentCard from '../components/StudentCard'

export default function StudentLoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/student/attendance')
  }

  return (
    <StudentPageShell showHUD={false} maxWidth="sm" className="flex items-center justify-center min-h-[90vh]">
      <div className="w-full space-y-6">
        
        {/* 상단 캐릭터 마스코트 영역 */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-purple-200 to-indigo-300 flex items-center justify-center shadow-lg animate-float">
            <span className="text-6xl select-none">🦊</span>
          </div>
          
          <div className="game-bubble max-w-sm text-center">
            <p className="text-base font-jua text-slate-800 leading-relaxed">
              만화 우주선에 탑승할 시간이야!<br/>아이디와 비밀번호를 적어줘! 🌌
            </p>
          </div>
        </div>

        {/* 로그인 카드 */}
        <StudentCard padding="lg" className="w-full">
          <div className="text-center mb-8 border-b-4 border-dotted border-slate-100 pb-6">
            <h2 className="text-3xl font-jua text-purple-600 tracking-wider">우주 대원 로그인</h2>
            <p className="text-sm font-bold text-slate-500 mt-2">대원 정보를 입력해 행성 탐험을 시작하세요</p>
          </div>
          <LoginForm onLogin={handleLogin} />
        </StudentCard>

        {/* 선생님 로그인 링크 */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-jua text-white/70 hover:text-white underline tracking-wider"
          >
            선생님/관리자 모드로 갈래요
          </button>
        </div>

      </div>
    </StudentPageShell>
  )
}
