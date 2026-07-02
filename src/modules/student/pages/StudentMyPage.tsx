import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, Star, Trophy, Calendar, 
  Bell, MessageSquare, ChevronRight,
  CheckCircle2, Play
} from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import StudentPageShell from '../components/layout/StudentPageShell'

const getSubjectDefaultThumbnail = (subject: string) => {
  switch (subject) {
    case '국어': return '/images/toonschool/thumbnails/subjects/korean-default.png';
    case '수학': return '/images/toonschool/thumbnails/subjects/math-default.png';
    case '과학': return '/images/toonschool/thumbnails/subjects/science-default.png';
    case '사회': return '/images/toonschool/thumbnails/subjects/social-default.png';
    case '영어': return '/images/toonschool/thumbnails/subjects/english-default.png';
    case '미술': return '/images/toonschool/thumbnails/subjects/art-default.png';
    default: return '/images/toonschool/thumbnails/subjects/korean-default.png';
  }
};

const WorkThumbnail = ({ src, alt, subject, borderClass }: { src?: string, alt: string, subject: string, fallbackBgClass?: string, borderClass: string }) => {
  const [error, setError] = useState(false);
  const defaultThumbnail = getSubjectDefaultThumbnail(subject);
  const displaySrc = (!src || error) ? defaultThumbnail : src;

  return (
    <div className={`aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer ${borderClass} transition-colors relative group`}>
      <img 
        src={displaySrc} 
        alt={alt} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
        onError={(e) => {
          if (!error) {
            setError(true);
          } else {
            // Prevent infinite loop if the default image also fails
            (e.target as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }
        }}
      />
    </div>
  )
}

export default function StudentMyPage() {
  const navigate = useNavigate()


  // Chart data
  const growthData = [
    { name: '5주 전', score: 20 },
    { name: '4주 전', score: 45 },
    { name: '3주 전', score: 60 },
    { name: '2주 전', score: 75 },
    { name: '지난 주', score: 85 },
    { name: '이번 주', score: 100 },
  ]

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 오늘의 학습 Main Card */}
            <div className="bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-[2rem] p-8 flex items-center justify-between border border-pink-100 relative overflow-hidden min-h-[260px] shadow-sm">
              <div className="z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-pink-600">오늘의 학습</h2>
                  <span className="text-2xl">☀️</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-pink-500 text-white text-sm font-bold rounded-full">국어</span>
                    <span className="font-bold text-slate-700 text-lg">4단원. 마음을 전해요</span>
                  </div>
                  <p className="text-slate-500 font-medium ml-1">만화로 마음 표현하기</p>
                </div>

                <button 
                  onClick={() => navigate('/student/today')}
                  className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-md shadow-pink-500/20 hover:shadow-lg transition-all flex items-center gap-2 w-fit active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>이어서 만들기</span>
                </button>
              </div>
              <img 
                src="/images/toonschool/login-hero.png" 
                alt="Study Hero" 
                className="absolute right-0 bottom-0 h-[90%] md:h-[95%] object-contain object-right-bottom transform translate-x-4 opacity-90"
              />
            </div>

            {/* Stats Cards & Growth Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stats Column */}
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-1">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">완성 작품</span>
                  <span className="text-2xl font-black text-slate-700">8</span>
                </div>
                <div className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-1">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">출석률</span>
                  <span className="text-2xl font-black text-sky-500">92%</span>
                </div>
                <div className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">OX 정답률</span>
                  <span className="text-2xl font-black text-emerald-500">85%</span>
                </div>
              </div>

              {/* Chart Column */}
              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">성장 기록</h3>
                  <button className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1">
                    최근 6주 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* My Works (4 Cards) */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">내 작품</h3>
                </div>
                <button className="text-xs font-bold text-pink-500 hover:bg-pink-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
                  만드는 중 <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1 */}
                <div className="flex flex-col gap-2">
                  <WorkThumbnail 
                    src=""
                    alt="용기 있는 한 걸음"
                    subject="국어"
                    fallbackBgClass="bg-pink-400"
                    borderClass="hover:border-pink-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-pink-500 px-1.5 py-0.5 rounded">국어</span>
                    <span className="text-xs font-bold text-slate-700 truncate">용기 있는 한 걸음</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 w-[80%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">80%</span>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex flex-col gap-2">
                  <WorkThumbnail 
                    src=""
                    alt="바다 속 친구들"
                    subject="과학"
                    fallbackBgClass="bg-sky-400"
                    borderClass="hover:border-sky-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-sky-500 px-1.5 py-0.5 rounded">과학</span>
                    <span className="text-xs font-bold text-slate-700 truncate">바다 속 친구들</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 w-[65%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">65%</span>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex flex-col gap-2">
                  <WorkThumbnail 
                    src=""
                    alt="우리 동네 탐험기"
                    subject="사회"
                    fallbackBgClass="bg-amber-400"
                    borderClass="hover:border-amber-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded">사회</span>
                    <span className="text-xs font-bold text-slate-700 truncate">우리 동네 탐험기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[40%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">40%</span>
                  </div>
                </div>

                {/* 4 */}
                <div className="flex flex-col gap-2">
                  <WorkThumbnail 
                    src=""
                    alt="재미있는 알파벳"
                    subject="영어"
                    fallbackBgClass="bg-emerald-400"
                    borderClass="hover:border-emerald-300"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded">영어</span>
                    <span className="text-xs font-bold text-slate-700 truncate">재미있는 알파벳</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[30%] rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">30%</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column (4/12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* 출석 기록 */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">출석 기록</h3>
                </div>
                <button className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 rotate-180" /> 이번 주 <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Weekly Calendar */}
              <div className="grid grid-cols-7 gap-1 mt-2">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold ${idx >= 5 ? 'text-pink-400' : 'text-slate-400'}`}>{day}</span>
                    <div className="text-sm font-medium text-slate-600">{19 + idx}</div>
                    {idx < 5 ? (
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-sm mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 mt-1"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                <span className="text-xs font-medium text-slate-500">이번 주 출석률</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-pink-600">92%</span>
                  <span className="text-xl">😊</span>
                </div>
              </div>
            </div>

            {/* 선생님 말씀 */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                    <MessageSquare className="w-4 h-4 fill-pink-500" />
                  </div>
                  <h3 className="font-bold text-slate-800">선생님 말씀</h3>
                </div>
                <button className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md">
                  더보기 <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>

              <div className="flex gap-4 mt-2">
                <div className="w-12 h-12 bg-pink-50 rounded-full overflow-hidden shrink-0 relative">
                  <img src="/images/toonschool/characters/official/hana-teacher.png" alt="Teacher" className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] max-w-[180%] h-auto pt-1 object-top" />
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                    <span>정말 잘했어요! 👏🏻</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    스토리가 점점 더 풍성해지고 표현도 아주 멋져요!
                  </p>
                  <span className="text-[10px] text-slate-400 self-end mt-1">2024.05.23</span>
                </div>
              </div>
            </div>

            {/* 알림함 */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">알림함</h3>
                </div>
                <button className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md">
                  더보기 <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">새 미션이 도착했어요!</span>
                    <span className="text-[10px] text-slate-400">30분 전</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">선생님이 댓글을 남겼어요.</span>
                    <span className="text-[10px] text-slate-400">2시간 전</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">작품이 추천 작품으로 선정되었어요!</span>
                    <span className="text-[10px] text-slate-400">1일 전</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                </div>
              </div>
            </div>

          </div>

        </div>
    </StudentPageShell>
  )
}
