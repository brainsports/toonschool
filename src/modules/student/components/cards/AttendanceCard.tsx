// 출석 정보를 보여주는 게임 캘린더 컴포넌트
import { Check, Star, Lock, Gift } from 'lucide-react'
import type { AttendanceStatus } from '../../types/studentFlow'

interface AttendanceCardProps {
  attendance: AttendanceStatus
  onClaimReward?: () => void
}

export default function AttendanceCard({ attendance, onClaimReward }: AttendanceCardProps) {
  // 6월 달력 데이터 생성 (금요일이 19일이라고 가정)
  // 6월 1일은 월요일
  const daysInMonth = 30
  const calendarCells = []
  
  // 1일(월)부터 30일(화)까지
  // 월요일이 1일이므로 요일 오프셋: 일요일은 비어둠 (오프셋 1)
  const offset = 1
  for (let i = 0; i < offset; i++) {
    calendarCells.push({ day: null, checked: false, emoji: '' })
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    // 18일, 19일(오늘) 등 가짜 출석 도장 설정
    let checked = false
    let stampEmoji = ''
    if (d < 19) {
      checked = d === 15 || d === 16 || d === 17 || d === 18
      stampEmoji = checked ? ['🐱', '🦊', '🐼', '🐯'][d % 4] : ''
    } else if (d === 19) {
      checked = true // 오늘은 출석 완료
      stampEmoji = '🐰' // 핑크 토끼 도장
    }
    
    calendarCells.push({
      day: d,
      checked,
      emoji: stampEmoji
    })
  }

  // 월간 누적 보상 아이템들
  const milestones = [
    { target: 10, stars: 30, achieved: attendance.streakDays >= 10 },
    { target: 20, stars: 60, achieved: attendance.streakDays >= 20 },
    { target: 30, stars: 100, achieved: attendance.streakDays >= 30 }
  ]

  return (
    <div className="card-game p-6 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-4 border-white text-slate-800 w-full shadow-sm rounded-[2.5rem]">
      <div className="grid grid-cols-12 gap-8">
        
        {/* 1. 좌측 패널 (월 정보 & 캐릭터 말풍선) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col items-center justify-between border-b-4 lg:border-b-0 lg:border-r-4 border-dotted border-purple-100 pb-8 lg:pb-0 lg:pr-8">
          <div className="text-center w-full">
            <div className="bg-white border-4 border-purple-100 text-purple-600 font-jua text-xl px-8 py-3 rounded-[2rem] inline-flex flex-col items-center shadow-sm">
              <span className="text-sm text-purple-400 tracking-widest">CALENDAR</span>
              <span className="text-3xl mt-1">6 월</span>
            </div>
          </div>

          {/* 캐릭터와 말풍선 */}
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="relative bg-white text-slate-700 border-2 border-purple-100 p-5 rounded-[1.5rem] text-sm font-bold leading-relaxed shadow-sm text-center max-w-[200px]">
              <p>연속 출석 {attendance.streakDays}일째!</p>
              <p className="text-purple-600 font-jua mt-1 text-base">정말 대단해요! 🎉</p>
              {/* 말풍선 꼬리 */}
              <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-purple-100" />
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
            </div>
            
            <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-b from-pink-100 to-pink-200 flex items-center justify-center shadow-sm animate-float">
              <span className="text-6xl select-none">🐰</span>
            </div>
          </div>
        </div>

        {/* 2. 중앙 패널 (출석 캘린더 달력) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between">
          <div className="bg-white/60 border-2 border-purple-100 rounded-[2rem] p-6 shadow-sm">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-2 text-center font-jua text-base text-purple-400 mb-4 border-b-2 border-purple-100 pb-3">
              <span className="text-pink-400">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-sky-400">토</span>
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                const isToday = cell.day === 19
                return (
                  <div
                    key={idx}
                    className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-150
                      ${cell.day ? 'bg-white shadow-sm border-2 border-purple-50' : 'bg-transparent border-none'}
                      ${isToday ? 'ring-4 ring-pink-300 ring-offset-2 bg-pink-50' : ''}
                      ${cell.checked ? 'bg-gradient-to-br from-purple-100/50 to-indigo-100/50' : ''}
                    `}
                  >
                    {cell.day && (
                      <>
                        <span className={`absolute top-1.5 left-2 text-xs font-jua ${isToday ? 'text-pink-500' : 'text-slate-400'}`}>
                          {cell.day}
                        </span>
                        
                        {cell.checked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-purple-50/30 rounded-2xl overflow-hidden">
                            {cell.emoji ? (
                              <span className="text-3xl animate-bounce-gentle select-none drop-shadow-sm">{cell.emoji}</span>
                            ) : (
                              <Check className="w-6 h-6 text-purple-400 stroke-[3]" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 연속 출석 진척도 바 */}
          <div className="mt-6 bg-white border-2 border-purple-100 p-5 rounded-[1.5rem] flex items-center justify-between gap-6 shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between text-sm font-jua text-slate-500 mb-2 px-1">
                <span>연속 출석 달성도</span>
                <span className="text-amber-500">{attendance.streakDays}일 / 7일</span>
              </div>
              <div className="h-6 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden relative shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-all duration-500" 
                  style={{ width: `${Math.min((attendance.streakDays / 7) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <button 
              onClick={onClaimReward}
              className="px-6 py-3 bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900 font-jua text-sm rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              보상 받기 💎
            </button>
          </div>
        </div>

        {/* 3. 우측 패널 (누적 출석 보상 단계) */}
        <div className="col-span-12 lg:col-span-2 flex flex-col justify-between border-t-4 lg:border-t-0 lg:border-l-4 border-dotted border-purple-100 pt-8 lg:pt-0 lg:pl-8 text-center">
          <span className="font-jua text-sm text-purple-500 tracking-wider block mb-4">월간 누적 보상</span>
          
          <div className="flex lg:flex-col justify-around items-center gap-6 flex-1">
            {milestones.map((ms, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div 
                  className={`
                    w-16 h-16 rounded-2xl border-4 flex flex-col items-center justify-center relative shadow-sm
                    ${ms.achieved 
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-white text-amber-500' 
                      : 'bg-slate-50 text-slate-300 border-slate-100'}
                  `}
                >
                  {ms.achieved ? (
                    <Gift className="w-8 h-8 animate-bounce-gentle drop-shadow-sm text-amber-500" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}
                  
                  {/* 조각 수치 */}
                  <span className="absolute -top-3 -right-3 bg-pink-400 text-white border-2 border-white font-jua text-xs px-2 py-0.5 rounded-full shadow-sm">
                    {ms.target}일
                  </span>
                </div>
                
                <div className="flex items-center gap-1 font-jua text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-yellow-400 stroke-amber-500 stroke-[2]" />
                  <span>+{ms.stars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
