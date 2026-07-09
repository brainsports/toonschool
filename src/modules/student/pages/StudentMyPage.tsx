import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, Star, Trophy, Calendar, 
  Bell, MessageSquare, ChevronRight,
  CheckCircle2, Play, Heart
} from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import WorkCard from '../components/mypage/WorkCard'
import type { MyWork } from '../components/mypage/WorkCard'
import AllWorksModal from '../components/mypage/AllWorksModal'
import TeacherMessageModal from '../components/mypage/TeacherMessageModal'
import AllNotificationsModal from '../components/mypage/AllNotificationsModal'

import { useAuth } from '../../../shared/contexts/AuthContext'
import { getStudentWorks } from '../services/studentWorkService'
import { getLatestTeacherMessageForClass, getTeacherMessagesForClass, resolveStudentClassKey, type TeacherMessage } from '../services/teacherMessageService'
import { getNotificationsForTarget, type StudentNotification } from '../services/notificationService'
import { ensureTodayAttendance, getCurrentAttendanceMonth, getMonthlyAttendance } from '../services/studentAttendanceService'



export default function StudentMyPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isAllWorksModalOpen, setIsAllWorksModalOpen] = useState(false);
  const [isTeacherMessageModalOpen, setIsTeacherMessageModalOpen] = useState(false);
  const [myWorks, setMyWorks] = useState<MyWork[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(true);
  const [worksError, setWorksError] = useState<string | null>(null);
  
  const [latestMessage, setLatestMessage] = useState<TeacherMessage | null>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isAllNotificationsModalOpen, setIsAllNotificationsModalOpen] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const attendanceMonth = useMemo(() => getCurrentAttendanceMonth(), []);
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  const monthlyAttendance = useMemo(() => {
    const attendedSet = new Set(attendanceDates);
    const firstDay = new Date(attendanceMonth.year, attendanceMonth.month - 1, 1).getDay();
    const lastDate = new Date(attendanceMonth.year, attendanceMonth.month, 0).getDate();
    const cellCount = Math.ceil((firstDay + lastDate) / 7) * 7;

    return Array.from({ length: cellCount }, (_, index) => {
      const date = index - firstDay + 1;
      if (date < 1 || date > lastDate) return null;

      const dateKey = `${attendanceMonth.year}-${String(attendanceMonth.month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      return {
        date,
        attended: attendedSet.has(dateKey),
        isToday: dateKey === attendanceMonth.today,
      };
    });
  }, [attendanceDates, attendanceMonth]);

  const attendedDaysCount = attendanceDates.length;

  useEffect(() => {
    async function loadWorks() {
      // auth user가 없으면 조회 불가
      if (!user?.id) {
        setIsLoadingWorks(false);
        return;
      }

      setIsLoadingWorks(true);
      setWorksError(null);

      try {
        // profiles.id = students.id = auth.user.id (동일 UUID 구조)
        // profile이 로딩됐으면 profile.id, 아직 없으면 user.id를 student_id로 사용
        const profileId = profile?.id ?? user.id;
        const authUserId = user.id;
        const profileName = profile?.name;

        const works = await getStudentWorks({ profileId, authUserId, profileName });
        setMyWorks(works);
      } catch (err) {
        console.error('[StudentMyPage] 작품 조회 실패:', err);
        setWorksError('작품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoadingWorks(false);
      }
    }

    async function loadTeacherMessageAndNotifications() {
      const classKey = resolveStudentClassKey(profile, user);
      
      const msg = await getLatestTeacherMessageForClass(classKey);
      setLatestMessage(msg);

      const notis = await getNotificationsForTarget(classKey, profile);
      setNotifications(notis);
    }

    async function loadAttendance() {
      if (!user?.id) return;

      try {
        await ensureTodayAttendance(user.id);
        const records = await getMonthlyAttendance(user.id);
        setAttendanceDates(records.map((record) => record.reward_date));
      } catch (err) {
        console.error('[StudentMyPage] 출석 기록 조회 실패:', err);
      }
    }

    loadWorks();
    loadTeacherMessageAndNotifications();
    loadAttendance();
  }, [user, profile]);

  const refreshNotifications = async () => {
    const classKey = resolveStudentClassKey(profile, user);
    const notis = await getNotificationsForTarget(classKey, profile);
    setNotifications(notis);
  };


  const handleOpenTeacherMessages = async () => {
    setIsTeacherMessageModalOpen(true);
    const classKey = resolveStudentClassKey(profile, user);
    const msgs = await getTeacherMessagesForClass(classKey);
    setAllMessages(msgs);
  };

  // Evaluation areas data
  const growthAreas = [
    { label: '단원 이해력', score: 19, maxScore: 20, color: 'bg-pink-500', bg: 'bg-pink-50' },
    { label: '요약·정리력', score: 18, maxScore: 20, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: '이야기 표현력', score: 17, maxScore: 20, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '문제해결·퀴즈 활용력', score: 19, maxScore: 20, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { label: '성장·공유 태도', score: 20, maxScore: 20, color: 'bg-yellow-400', bg: 'bg-yellow-50' },
  ];
  const growthScoreTotal = growthAreas.reduce((sum, area) => sum + area.score, 0);

  const completedWorksCount = myWorks.filter(work => work.status === 'completed' || work.status === 'shared').length;

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 학생 격려 배너 */}
            <div className="bg-gradient-to-r from-pink-50 to-sky-50 rounded-[2rem] p-8 flex items-center justify-between border border-pink-100 relative overflow-hidden min-h-[260px] shadow-sm">
              <div className="z-10 flex flex-col gap-4 max-w-xl">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-pink-600">오늘도 툰스쿨과 함께 출발해요!</h2>
                  <span className="text-2xl">🚀</span>
                </div>

                <p className="text-slate-600 font-bold text-lg leading-relaxed">
                  내가 배운 내용을 멋진 만화로 만들어 볼까요?
                </p>

                <button 
                  onClick={() => navigate('/student/select-unit')}
                  className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-md shadow-pink-500/20 hover:shadow-lg transition-all flex items-center gap-2 w-fit active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>툰스쿨 에디터 입장</span>
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
                  {completedWorksCount > 0 ? (
                    <span className="text-2xl font-black text-slate-700">{completedWorksCount}</span>
                  ) : (
                    <Heart className="w-7 h-7 text-pink-400 fill-pink-400" />
                  )}
                </div>
                <div className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-1">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">이번 달 출석</span>
                  <span className="text-2xl font-black text-sky-500">{attendedDaysCount}일</span>
                </div>
                <div className="bg-white rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-2 border border-slate-100 shadow-sm text-center">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">성장 점수</span>
                  <span className="text-2xl font-black text-emerald-500">{growthScoreTotal}점</span>
                </div>
              </div>

              {/* Chart Column */}
              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">성장 기록</h3>
                </div>
                <div className="w-full flex flex-col gap-3 mt-1">
                  {growthAreas.map((area, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{area.label}</span>
                        <span className="text-slate-700">{area.score}<span className="text-slate-400 font-medium"> / {area.maxScore}</span></span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full ${area.bg}`}>
                        <div 
                          className={`h-full rounded-full ${area.color}`} 
                          style={{ width: `${(area.score / area.maxScore) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* My Works */}
            <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800">내 작품</h3>
                </div>
                {myWorks.length > 0 && (
                  <button 
                    onClick={() => setIsAllWorksModalOpen(true)}
                    className="text-xs font-bold text-pink-500 hover:bg-pink-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                  >
                    만드는 중 <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isLoadingWorks ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-slate-400 font-medium text-sm">작품을 불러오는 중입니다...</span>
                </div>
              ) : worksError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-red-50 rounded-xl border border-red-100 border-dashed">
                  <p className="text-red-500 font-medium text-sm">{worksError}</p>
                </div>
              ) : myWorks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {myWorks.slice(0, 4).map(work => (
                    <WorkCard key={work.id} work={work} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-slate-600 font-medium mb-4 text-sm">아직 만든 작품이 없어요.<br/>툰스쿨 에디터에서 첫 작품을 만들어 보세요.</p>
                  <button 
                    onClick={() => navigate('/student/select-unit')}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-full shadow-sm transition-all text-sm flex items-center gap-1"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    툰스쿨 에디터
                  </button>
                </div>
              )}
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
                <div className="text-sm font-bold text-slate-700">
                  {attendanceMonth.year}년 {attendanceMonth.month}월
                </div>
              </div>

              {/* Monthly Calendar */}
              <div className="mt-2">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day, idx) => (
                    <div key={day} className={`text-center text-xs font-bold ${idx === 0 || idx === 6 ? 'text-pink-400' : 'text-slate-400'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {monthlyAttendance.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center h-10">
                      {item ? (
                        <div className={`relative flex flex-col items-center justify-center w-8 h-8 rounded-full ${item.isToday ? 'bg-pink-100' : ''}`}>
                          <span className={`text-xs font-medium ${item.isToday ? 'text-pink-600 font-bold' : 'text-slate-600'} ${item.attended ? 'mb-2' : ''}`}>
                            {item.date}
                          </span>
                          {item.attended && (
                            <div className="absolute bottom-0 text-[12px] leading-none">
                              😊
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                <span className="text-xs font-medium text-slate-500">이번 달 출석</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-pink-600">{attendedDaysCount}일</span>
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
                <button 
                  onClick={handleOpenTeacherMessages}
                  className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md"
                >
                  더보기 <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>

              {latestMessage ? (
                <div className="flex gap-4 mt-2">
                  <div className="w-12 h-12 bg-pink-50 rounded-full overflow-hidden shrink-0 relative">
                    <img src="/images/toonschool/characters/v2/hana-master/hana-v2-front.png" alt="Teacher" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          {latestMessage.title || '선생님 말씀'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          latestMessage.class_key === 'all-grades' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-sky-100 text-sky-600'
                        }`}>
                          {latestMessage.class_key === 'all-grades' ? '전체 학년' : '5학년 전체'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed line-clamp-3">
                      {latestMessage.content}
                    </p>
                    <span className="text-[10px] text-slate-400 self-end mt-1">
                      {new Date(latestMessage.message_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-3">💬</span>
                  <p className="text-slate-500 font-medium text-sm">아직 선생님 말씀이 없어요.</p>
                  <p className="text-slate-400 text-xs mt-1">선생님 말씀이 도착하면 이곳에 보여요.</p>
                </div>
              )}
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
                <button 
                  onClick={() => setIsAllNotificationsModalOpen(true)}
                  className="text-xs font-medium text-slate-500 hover:bg-slate-50 px-2 py-1 rounded-md"
                >
                  더보기 <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="text-3xl mb-3">📭</span>
                    <p className="text-slate-500 font-medium text-sm">아직 도착한 알림이 없어요.</p>
                    <p className="text-slate-400 text-xs mt-1">새로운 소식이 생기면 이곳에 알려드릴게요!</p>
                  </div>
                ) : (
                  notifications.slice(0, 3).map((noti) => (
                    <div key={noti.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        noti.category === 'notice' ? 'bg-sky-50 text-sky-500' :
                        noti.category === 'learning' ? 'bg-emerald-50 text-emerald-500' :
                        noti.category === 'event' ? 'bg-purple-50 text-purple-500' :
                        noti.category === 'mission' ? 'bg-pink-50 text-pink-500' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {noti.category === 'notice' ? <Bell className="w-4 h-4" /> :
                         noti.category === 'learning' ? <Star className="w-4 h-4" /> :
                         noti.category === 'event' ? <MessageSquare className="w-4 h-4" /> :
                         noti.category === 'mission' ? <Trophy className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            {noti.sender_role === 'org_admin' && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">기관관리자</span>
                            )}
                            <span className="text-xs font-bold text-slate-800 truncate">{noti.title}</span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0">
                            {new Date(noti.notice_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate">{noti.content}</span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

        <AllWorksModal 
          isOpen={isAllWorksModalOpen} 
          onClose={() => setIsAllWorksModalOpen(false)} 
          works={myWorks} 
        />
        <TeacherMessageModal
          isOpen={isTeacherMessageModalOpen}
          onClose={() => setIsTeacherMessageModalOpen(false)}
          messages={allMessages}
        />
        <AllNotificationsModal
          isOpen={isAllNotificationsModalOpen}
          onClose={() => setIsAllNotificationsModalOpen(false)}
          notifications={notifications}
          onDeleted={refreshNotifications}
        />
    </StudentPageShell>
  )
}
