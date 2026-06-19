// 오늘의 학습툰 선택 페이지 - 텍스트 양 축소 및 레이아웃 정리
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, MapPin, Zap } from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import StudentBigButton from '../components/StudentBigButton'
import StudentCard from '../components/StudentCard'

export default function StudentTodayPage() {
  const navigate = useNavigate()

  return (
    <StudentPageShell bgVariant="sky" maxWidth="md">
      
      {/* 상단 헤더 */}
      <div className="flex items-center gap-4 mb-8 pt-6 select-none">
        <button
          onClick={() => navigate('/student/my')}
          className="w-12 h-12 rounded-[1.5rem] bg-white border-4 border-purple-100 flex items-center justify-center text-purple-500 hover:scale-105 transition-transform shadow-sm"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </button>
        <div>
          <span className="text-xs font-jua text-purple-500 bg-purple-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-1">Mission</span>
          <h1 className="text-2xl md:text-3xl font-jua text-slate-800">오늘의 퀘스트 확인!</h1>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* 1. 선생님의 전령 (심플하게 축소) */}
        <div className="card-game p-6 bg-gradient-to-r from-purple-100 to-indigo-50 border-4 border-white shadow-sm text-slate-800 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl animate-float select-none drop-shadow-sm">🐰</span>
            <div>
              <span className="text-xs font-jua text-purple-500 block mb-0.5">교사 메신저</span>
              <h4 className="font-jua text-base text-slate-800">김영희 선생님의 한마디</h4>
            </div>
          </div>
          <div className="bg-white border-2 border-purple-50 rounded-[1.5rem] p-4 text-center shadow-inner">
            <p className="text-sm font-bold text-slate-600">
              "재미있는 분수 연료 이야기를 만화로 완성해보세요! 🚀"
            </p>
          </div>
        </div>

        {/* 2. 임무 요약 단원 정보 (간소화) */}
        <StudentCard padding="lg" className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <h4 className="font-jua text-lg text-slate-800 flex items-center gap-2 select-none">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <span>오늘의 임무 정보</span>
            </h4>
            <span className="bg-purple-100 text-purple-600 text-sm font-jua px-4 py-1.5 rounded-full">
              초등 5학년 수학
            </span>
          </div>

          <div className="bg-purple-50 border-2 border-purple-100 rounded-[1.5rem] p-6 text-center">
            <span className="text-xs font-jua text-purple-400 block mb-2">배울 소단원</span>
            <p className="text-xl md:text-2xl font-jua text-indigo-900 drop-shadow-sm">분수의 덧셈과 뺄셈</p>
          </div>
        </StudentCard>

        {/* 3. 심플 퀘스트 로드맵 */}
        <div className="bg-white border-4 border-purple-50 shadow-sm rounded-[2rem] p-6 md:p-8 text-slate-800">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-5 left-8 right-8 h-1 bg-purple-100 z-0 rounded-full" />
            
            {[
              { label: '단원', active: true },
              { label: '주제', active: false },
              { label: '만화', active: false },
              { label: '퀴즈', active: false },
              { label: '출판', active: false }
            ].map((node, i) => (
              <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                <div 
                  className={`
                    w-10 h-10 rounded-full border-4 flex items-center justify-center font-jua text-sm shadow-sm transition-all
                    ${node.active 
                      ? 'bg-purple-500 border-purple-200 text-white animate-bounce-gentle scale-110' 
                      : 'bg-white border-purple-100 text-purple-300'}
                  `}
                >
                  {i + 1}
                </div>
                <span className={`text-xs font-jua ${node.active ? 'text-purple-600' : 'text-purple-300'}`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 flex items-center justify-between text-xs font-jua text-purple-500 bg-purple-50/50 rounded-xl px-4 py-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>소요시간: 30분</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-yellow-400 stroke-yellow-500" />
              <span className="text-amber-600">보상: ⭐ x 5</span>
            </span>
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="flex justify-center pt-4 select-none">
          <StudentBigButton
            onClick={() => navigate('/student/select-unit')}
            variant="primary"
            size="lg"
            emoji="🚀"
            className="w-full max-w-sm py-5 text-xl shadow-sm"
          >
            미션 시작하기!
          </StudentBigButton>
        </div>

      </div>

    </StudentPageShell>
  )
}