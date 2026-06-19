// 학생 시작페이지 - 우주 배경, 캐릭터, 게임 시작
import { useNavigate } from 'react-router-dom'
import StudentPageShell from '../components/layout/StudentPageShell'
import StudentBigButton from '../components/StudentBigButton'

export default function StudentStartPage() {
  const navigate = useNavigate()

  return (
    <StudentPageShell showHUD={false} maxWidth="md">
      <div className="min-h-[90vh] flex flex-col items-center justify-between py-8">
        
        {/* 상단: 툰스쿨 타이틀 */}
        <div className="text-center pt-8">
          <div className="inline-block px-10 py-4 bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 border-4 border-white rounded-[2rem] shadow-lg transform -rotate-2">
            <h1 className="text-5xl md:text-6xl font-jua text-white tracking-widest drop-shadow-md">
              일프로 툰스쿨
            </h1>
          </div>
          <p className="text-lg font-jua text-yellow-300 tracking-wider mt-6 drop-shadow-sm">
            🚀 우주 최강 AI 학습만화 모험! 🪐
          </p>
        </div>

        {/* 중앙: 우주 행성 위에 돔 우주선을 탄 캐릭터 */}
        <div className="relative my-8 flex flex-col items-center justify-center w-full max-w-sm aspect-square">
          {/* 뒤쪽 후광 효과 */}
          <div className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
          
          {/* 큰 행성 (바닥) */}
          <div className="absolute bottom-4 w-80 h-32 bg-sky-200/90 border-4 border-white rounded-[100px] shadow-sm flex flex-col items-center justify-start pt-2 overflow-hidden">
            {/* 크레이터 효과 */}
            <div className="absolute top-4 left-8 w-10 h-6 bg-sky-300 rounded-full opacity-60" />
            <div className="absolute top-8 right-12 w-16 h-8 bg-sky-300 rounded-full opacity-60" />
            <div className="absolute bottom-2 left-20 w-12 h-6 bg-sky-300 rounded-full opacity-60" />
          </div>

          {/* 둥실둥실 우주선 & 캐릭터 */}
          <div className="absolute bottom-16 flex flex-col items-center animate-float">
            {/* 유리 돔 헬멧 */}
            <div className="relative w-48 h-48 rounded-full border-4 border-white/60 bg-sky-300/30 backdrop-blur-xs flex items-center justify-center shadow-inner">
              {/* 캐릭터 */}
              <span className="text-[110px] select-none leading-none filter drop-shadow-lg">🦊</span>
              
              {/* 돔 글로우 반사 광택 */}
              <div className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/40 blur-xs" />
            </div>

            {/* UFO 하부 비행선 받침대 */}
            <div className="w-52 h-12 bg-pink-400 border-4 border-white rounded-[50px] -mt-6 shadow-sm relative z-10 flex items-center justify-around px-5">
              <div className="w-4 h-4 rounded-full bg-yellow-300 border-2 border-white animate-ping" />
              <div className="w-4 h-4 rounded-full bg-yellow-300 border-2 border-white" />
              <div className="w-4 h-4 rounded-full bg-yellow-300 border-2 border-white animate-ping" />
            </div>

            {/* 학생 정보 박스 */}
            <div className="mt-4 bg-white/90 border-2 border-slate-100 px-6 py-2 rounded-2xl shadow-sm backdrop-blur-sm">
              <span className="font-jua text-slate-600 text-xl tracking-wider">kmemory</span>
            </div>
          </div>
        </div>

        {/* 하단: 거대한 시작 버튼 */}
        <div className="w-full max-w-xs flex flex-col items-center gap-6">
          <StudentBigButton 
            onClick={() => navigate('/student/login')} 
            variant="success" 
            size="lg"
            fullWidth
            emoji="✨"
            className="py-6 text-3xl shadow-sm"
          >
            시작
          </StudentBigButton>
          
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-jua text-white/70 hover:text-white underline tracking-wider"
          >
            선생님/관리자 모드로 전환
          </button>
        </div>

      </div>
    </StudentPageShell>
  )
}
