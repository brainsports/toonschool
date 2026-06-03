import { Link } from 'react-router-dom'
import { Sparkles, Trophy, BookOpen, Clock, ChevronRight, MessageSquare, LineChart, BarChart } from 'lucide-react'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

export default function StudentDashboard() {
  // Mock data for student's custom courses
  const courses = [
    {
      id: '1',
      title: '우주 탐사선과 인공지능의 모험',
      progress: 75,
      lastActive: '3분 전',
      status: '진행 중',
      statusColor: 'text-amber-400 bg-amber-950/40 border-amber-900/50',
      btnText: '이어서 만들기',
      thumbnail: 'bg-purple-950/30 border-purple-900/30'
    },
    {
      id: '2',
      title: '기승전결 만화 뼈대 세우기',
      progress: 100,
      lastActive: '1시간 전',
      status: '완료됨',
      statusColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50',
      btnText: '다시 보기',
      thumbnail: 'bg-emerald-950/30 border-emerald-900/30'
    },
    {
      id: '3',
      title: '내 캐릭터 대사 꾸미기',
      progress: 0,
      lastActive: '시작 전',
      status: '대기 중',
      statusColor: 'text-slate-500 bg-slate-900/60 border-slate-850',
      btnText: '시작하기',
      thumbnail: 'bg-slate-950/30 border-slate-850'
    }
  ]

  // Mock evaluation scores
  const scoreData = [
    { name: '어휘력', 점수: 85, color: '#60a5fa' },
    { name: '표현력', 점수: 90, color: '#f472b6' },
    { name: '스토리', 점수: 75, color: '#34d399' },
    { name: '창의성', 점수: 80, color: '#fbbf24' },
    { name: '집중도', 점수: 95, color: '#a78bfa' }
  ]

  const aiComment = "철수 학생은 기승전결 만화 컷 구성 능력이 탁월하며 특히 우주 비행사 철수 시나리오에서 논리적 흐름이 뛰어납니다. 후반부 결말 전개가 한층 더 탄탄해진다면 더욱 매력적인 웹툰이 될 것입니다."
  const teacherComment = "스토리 후반부에 반전을 추가하는 방법을 함께 지도했습니다. 전반적인 과제 집착력과 집중도가 대단히 우수합니다."

  return (
    <div className="space-y-10">
      {/* 1. Playful Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-orange-600/10 border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-purple-400/10 pointer-events-none">
          <Trophy className="h-44 w-44" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>오늘도 멋진 하루예요!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            반가워요, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">김철수</span> 학생!<br />
            오늘도 재미있는 나만의 만화를 만들어 볼까요?
          </h1>
          
          {/* Main overall progress bar */}
          <div className="max-w-md pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">나의 총 학습 이수율</span>
              <span className="text-purple-400">65% 완료</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid of Comic Assignments */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          <span>내가 만드는 웹툰 공부방</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-850 hover:border-slate-750 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Visual thumbnail mockup */}
                <div className={`h-36 rounded-xl border flex items-center justify-center relative overflow-hidden ${course.thumbnail}`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent" />
                  <span className="text-[10px] text-slate-500 font-mono">THUMBNAIL IMAGE</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase ${course.statusColor}`}>
                      {course.status}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.lastActive}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 leading-snug line-clamp-1">{course.title}</h3>
                </div>
              </div>

              {/* Progress and Link */}
              <div className="space-y-4 mt-6 pt-4 border-t border-slate-850">
                {course.progress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500">진행도</span>
                      <span className="text-purple-400 font-semibold">{course.progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>
                )}
                <Link 
                  to="/toon"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all ${
                    course.progress === 100
                      ? 'bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-[1.01]'
                  }`}
                >
                  <span>{course.btnText}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. My Growth Report Widget */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-3">
          <LineChart className="h-4.5 w-4.5 text-purple-400" />
          <span>나의 학업 성취 피드백 리포트</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-450 uppercase flex items-center gap-1.5">
              <BarChart className="h-4 w-4 text-purple-400" />
              <span>5대 학습 역량 분석 지표</span>
            </h4>
            
            {/* Simple Bar Chart */}
            <div className="h-48 w-full text-xs bg-slate-950/50 rounded-2xl border border-slate-850 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={scoreData} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#475569" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="점수" radius={[0, 4, 4, 0]} barSize={10}>
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Text feedback */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
              <h4 className="text-[10px] font-bold text-purple-400 flex items-center gap-1.5 uppercase">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>AI 학습 코칭 가이드</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {aiComment}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
              <h4 className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span>선생님의 응원 한마디</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {teacherComment}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
