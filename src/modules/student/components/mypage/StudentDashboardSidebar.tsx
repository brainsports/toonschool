import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { StudentNotification } from '../../services/notificationService'
import type { TeacherMessage } from '../../services/teacherMessageService'

// 툰어휘사전 캐릭터(기존 에셋 재사용 — 복사/신규 생성 금지).
const VOCAB_MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'
const VOCABULARY_PATH = '/student/vocabulary'

interface AttendanceCalendarDay {
  date: number
  attended: boolean
  isToday: boolean
}

interface StudentDashboardSidebarProps {
  attendanceMonth: {
    year: number
    month: number
  }
  daysOfWeek: string[]
  monthlyAttendance: Array<AttendanceCalendarDay | null>
  attendedDaysCount: number
  latestMessage: TeacherMessage | null
  notifications: StudentNotification[]
  onPreviousMonth: () => void
  onNextMonth: () => void
  onOpenTeacherMessages: () => void
  onOpenNotifications: () => void
}

export default function StudentDashboardSidebar({
  attendanceMonth,
  daysOfWeek,
  monthlyAttendance,
  attendedDaysCount,
  latestMessage,
  notifications,
  onPreviousMonth,
  onNextMonth,
  onOpenTeacherMessages,
  onOpenNotifications,
}: StudentDashboardSidebarProps) {
  const navigate = useNavigate()
  return (
    <aside className="min-w-0 flex flex-col gap-4 xl:gap-5">
      <section className="min-w-0 bg-white rounded-[1.5rem] p-5 xl:p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800">출석 기록</h3>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPreviousMonth}
            aria-label="이전 달"
            className="w-9 h-9 shrink-0 rounded-full bg-slate-50 text-slate-500 hover:bg-pink-50 hover:text-pink-500 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-black text-slate-700 whitespace-nowrap">
            {attendanceMonth.year}년 {attendanceMonth.month}월
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="다음 달"
            className="w-9 h-9 shrink-0 rounded-full bg-slate-50 text-slate-500 hover:bg-pink-50 hover:text-pink-500 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`min-w-0 text-center text-xs font-bold ${
                  index === 0 || index === 6 ? 'text-pink-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {monthlyAttendance.map((item, index) => (
              <div key={index} className="min-w-0 aspect-square flex items-center justify-center">
                {item && (
                  <div
                    className={`relative w-full h-full max-w-8 max-h-8 rounded-full flex flex-col items-center justify-center ${
                      item.isToday ? 'bg-pink-100' : ''
                    }`}
                  >
                    <span
                      className={`text-[11px] sm:text-xs font-medium leading-none ${
                        item.isToday ? 'text-pink-600 font-bold' : 'text-slate-600'
                      } ${item.attended ? '-translate-y-1' : ''}`}
                    >
                      {item.date}
                    </span>
                    {item.attended && (
                      <span className="absolute bottom-0 text-[10px] leading-none" aria-label="출석">
                        😊
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500">이번 달 출석</span>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-2xl font-black text-pink-600">{attendedDaysCount}일</span>
            <span className="text-xl">😊</span>
          </div>
        </div>
      </section>

      {/* 나의 단어장 배너 — 출석 기록과 선생님 말씀 사이. 카드 전체 클릭 시 /student/vocabulary 이동. */}
      <button
        type="button"
        onClick={() => navigate(VOCABULARY_PATH)}
        aria-label="나의 단어장 보기"
        className="group min-w-0 w-full text-left bg-gradient-to-br from-sky-50 to-white rounded-[1.5rem] p-5 xl:p-6 border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 active:scale-[0.99]"
      >
        <img
          src={VOCAB_MASCOT}
          alt=""
          className="w-14 h-14 shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800 whitespace-nowrap">나의 단어장</h3>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5 break-keep">저장한 낱말을 다시 살펴봐요!</p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-sky-600 group-hover:gap-1.5 transition-all">
            단어장 보기 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </button>

      <section className="min-w-0 min-h-[180px] bg-white rounded-[1.5rem] p-5 xl:p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg shrink-0">
              <MessageSquare className="w-4 h-4 fill-pink-500" />
            </div>
            <h3 className="font-bold text-slate-800 whitespace-nowrap">선생님 말씀</h3>
          </div>
          <button
            type="button"
            onClick={onOpenTeacherMessages}
            className="shrink-0 text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md"
          >
            더보기 <ChevronRight className="w-3 h-3 inline" />
          </button>
        </div>

        {latestMessage ? (
          <div className="min-w-0 flex gap-3">
            <div className="w-11 h-11 bg-pink-50 rounded-full overflow-hidden shrink-0">
              <img
                src="/images/toonschool/characters/v2/hana-master/hana-v2-front.png"
                alt="선생님"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-1.5 flex-1">
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="min-w-0 text-sm font-bold text-slate-800 truncate">
                  {latestMessage.title || '선생님 말씀'}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    latestMessage.class_key === 'all-grades'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-sky-100 text-sky-600'
                  }`}
                >
                  {latestMessage.class_key === 'all-grades' ? '전체 학년' : '담당 학급'}
                </span>
              </div>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed line-clamp-3">
                {latestMessage.content}
              </p>
              <span className="text-[10px] text-slate-400 self-end">
                {new Date(latestMessage.message_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
            <span className="text-3xl mb-3">💬</span>
            <p className="text-slate-500 font-medium text-sm">아직 선생님 말씀이 없어요.</p>
            <p className="text-slate-400 text-xs mt-1 break-keep">선생님 말씀이 도착하면 여기에 보여요.</p>
          </div>
        )}
      </section>

      <section className="min-w-0 min-h-[180px] bg-white rounded-[1.5rem] p-5 xl:p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 whitespace-nowrap">알림함</h3>
          </div>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="shrink-0 text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md"
          >
            더보기 <ChevronRight className="w-3 h-3 inline" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
              <span className="text-3xl mb-3">📭</span>
              <p className="text-slate-500 font-medium text-sm">아직 도착한 알림이 없어요.</p>
              <p className="text-slate-400 text-xs mt-1 break-keep">새로운 소식이 생기면 여기에 알려드릴게요.</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="min-w-0 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    notification.category === 'notice'
                      ? 'bg-sky-50 text-sky-500'
                      : notification.category === 'learning'
                        ? 'bg-emerald-50 text-emerald-500'
                        : notification.category === 'event'
                          ? 'bg-purple-50 text-purple-500'
                          : notification.category === 'mission'
                            ? 'bg-pink-50 text-pink-500'
                            : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {notification.category === 'learning' ? (
                    <Star className="w-4 h-4" />
                  ) : notification.category === 'event' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : notification.category === 'mission' ? (
                    <Trophy className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5">
                      {notification.sender_role === 'org_admin' && (
                        <span className="shrink-0 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          기관관리자
                        </span>
                      )}
                      <span className="min-w-0 text-xs font-bold text-slate-800 truncate">
                        {notification.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {new Date(notification.notice_date).toLocaleDateString(undefined, {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-500 truncate">{notification.content}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  )
}
