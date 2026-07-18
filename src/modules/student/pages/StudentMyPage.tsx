import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, Trophy, Calendar, ChevronRight,
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
import { getLatestTeacherMessageForStudent, getTeacherMessagesForStudent, type TeacherMessage } from '../services/teacherMessageService'
import { getNotificationsForStudent, type StudentNotification } from '../services/notificationService'
import { ensureTodayAttendance, getCurrentAttendanceMonth, getMonthlyAttendance, getTotalAttendanceCount } from '../services/studentAttendanceService'
import { getStudentGrowthDashboard } from '../services/studentGrowthService'
import { grantAttendanceReward } from '../services/dreamGardenService'
import type { StudentGrowthDashboardData } from '../types/studentGrowth'
import DreamPalaceDashboardCard from '../components/dream/DreamPalaceDashboardCard'
import MindmapWorksSection from '../components/mindmap/MindmapWorksSection'
import StudentDashboardSidebar from '../components/mypage/StudentDashboardSidebar'



export default function StudentMyPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [isAllWorksModalOpen, setIsAllWorksModalOpen] = useState(false);
  const [workTab, setWorkTab] = useState<'comic' | 'mindmap'>('comic');
  const [isTeacherMessageModalOpen, setIsTeacherMessageModalOpen] = useState(false);
  const [myWorks, setMyWorks] = useState<MyWork[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(true);
  const [worksError, setWorksError] = useState<string | null>(null);
  
  const [latestMessage, setLatestMessage] = useState<TeacherMessage | null>(null);
  const [allMessages, setAllMessages] = useState<TeacherMessage[]>([]);

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isAllNotificationsModalOpen, setIsAllNotificationsModalOpen] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [totalAttendanceCount, setTotalAttendanceCount] = useState(0);
  const [growthData, setGrowthData] = useState<StudentGrowthDashboardData | null>(null);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(true);
  const [attendanceMonth, setAttendanceMonth] = useState(() => getCurrentAttendanceMonth());
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
      // 학생 본인의 담당 선생님(created_by) 기준으로 격리 조회.
      const msg = await getLatestTeacherMessageForStudent(user?.id);
      setLatestMessage(msg);

      const notis = await getNotificationsForStudent(user?.id, profile);
      setNotifications(notis);
    }

    async function loadAttendance() {
      if (!user?.id) return;

      try {
        await ensureTodayAttendance(user.id);
      } catch (err) {
        console.error('[StudentMyPage] 오늘 출석 기록 실패:', err);
      }
      
      try {
        const rewardResult = await grantAttendanceReward(user.id);
        if (rewardResult.status === 'granted') {
          window.dispatchEvent(new Event('attendanceRewardGranted'));
        }
      } catch (err) {
        console.error('[StudentMyPage] 출석 보상 지급 실패:', err);
      }

      try {
        const records = await getMonthlyAttendance(user.id);
        setAttendanceDates(records.map((record) => record.attendance_date));
      } catch (err) {
        console.error('[StudentMyPage] 이번 달 출석 내역 조회 실패:', err);
      }

      try {
        const totalCount = await getTotalAttendanceCount(user.id);
        setTotalAttendanceCount(totalCount);
      } catch (err) {
        console.error('[StudentMyPage] 총 출석일수 조회 실패:', err);
      }
    }

    async function loadGrowthData() {
      if (!user?.id) return;
      setIsLoadingGrowth(true);
      try {
        const data = await getStudentGrowthDashboard(user.id);
        setGrowthData(data);
      } catch (err) {
        console.error('[StudentMyPage] 성장기록 조회 실패:', err);
      } finally {
        setIsLoadingGrowth(false);
      }
    }

    loadWorks();
    loadTeacherMessageAndNotifications();
    loadAttendance();
    loadGrowthData();
  }, [user, profile]);

  const refreshMessagesAndNotifications = async () => {
    // 학생 본인의 담당 선생님(created_by) 기준으로 격리 조회.
    const [msg, notis] = await Promise.all([
      getLatestTeacherMessageForStudent(user?.id),
      getNotificationsForStudent(user?.id, profile),
    ]);

    setLatestMessage(msg);
    setNotifications(notis);
  };

  const handleOpenTeacherMessages = async () => {
    setIsTeacherMessageModalOpen(true);
    const msgs = await getTeacherMessagesForStudent(user?.id);
    setAllMessages(msgs);
  };

  const handleMoveAttendanceMonth = async (offset: number) => {
    if (!user?.id) return;

    const targetDate = new Date(attendanceMonth.year, attendanceMonth.month - 1 + offset, 1);
    const targetMonth = getCurrentAttendanceMonth(targetDate);
    setAttendanceMonth(targetMonth);

    try {
      const records = await getMonthlyAttendance(user.id, targetDate);
      setAttendanceDates(records.map((record) => record.attendance_date));
    } catch (err) {
      console.error('[StudentMyPage] 월별 출석 내역 조회 실패:', err);
    }
  };

  const completedWorksCount = myWorks.filter(work => work.status === 'completed' || work.status === 'shared').length;

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6 overflow-y-auto">
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

                <button
                  onClick={() => navigate('/student/mindmap')}
                  className="mt-2 ml-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center gap-2 w-fit active:scale-95"
                >
                  <span className="text-lg leading-none">🧠</span>
                  <span>마인드맵 만들기</span>
                </button>
              </div>
              <img
                src="/images/toonschool/login-hero.png"
                alt="Study Hero"
                className="absolute right-0 bottom-0 h-[90%] md:h-[95%] object-contain object-right-bottom transform translate-x-4 opacity-90"
              />
            </div>

          {/* 꿈의 궁전 요약 카드 (레벨/점수/진행/바로가기) */}
          <DreamPalaceDashboardCard studentId={profile?.id ?? user?.id} />

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] gap-5 xl:gap-6 items-start">
            <main className="min-w-0 flex flex-col gap-6">
              {/* Stats Cards & Growth Chart */}
              <div className="grid grid-cols-1 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4">
              {/* Card 1: 완성 작품 */}
              <div className="bg-white rounded-[20px] px-6 py-5 flex items-center gap-4 border border-slate-100 shadow-sm min-h-[112px]">
                <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 mb-0.5">완성 작품</span>
                  {completedWorksCount > 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-700">{completedWorksCount}</span>
                      <span className="text-sm font-bold text-slate-500">개</span>
                    </div>
                  ) : (
                    <Heart className="w-6 h-6 text-pink-400 fill-pink-400 mt-1" />
                  )}
                </div>
              </div>

              {/* Card 2: 총 출석일수 */}
              <div className="bg-white rounded-[20px] px-6 py-5 flex items-center gap-4 border border-slate-100 shadow-sm min-h-[112px]">
                <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 mb-0.5">총 출석일수</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-sky-500">{totalAttendanceCount}</span>
                    <span className="text-sm font-bold text-sky-500">일</span>
                  </div>
                </div>
              </div>

              {/* Card 3: 성장 점수 */}
              <div className="bg-white rounded-[20px] px-6 py-5 flex items-center gap-4 border border-slate-100 shadow-sm min-h-[112px]">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 mb-0.5">성장 점수</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-500">{growthData?.latest?.total_score || 0}</span>
                    <span className="text-sm font-bold text-emerald-500">점</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">성장 기록</h3>
                <div className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  {growthData?.latest ? `최근 작품 점수 ${growthData.latest.total_score}점` : '기록 없음'}
                </div>
              </div>

              {isLoadingGrowth ? (
                 <div className="flex-1 flex items-center justify-center py-10">
                   <span className="text-slate-400 text-sm font-medium">불러오는 중...</span>
                 </div>
              ) : !growthData?.latest ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                   <span className="text-2xl mb-2">🌱</span>
                   <p className="text-slate-600 font-bold text-sm mb-1">아직 성장기록이 없어요.</p>
                   <p className="text-slate-400 text-xs break-keep mt-1">만화를 완성하면 AI 선생님이 작품을 보고 성장 피드백을 남겨 줄게요.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] gap-6 items-stretch">
                  <div className="flex flex-col">
                    <div className="mb-3.5 text-[13px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-2.5 rounded-lg">
                      <span className="text-lg">{growthData.delta && growthData.delta > 0 ? '🚀' : growthData.delta !== null ? '💪' : '🌟'}</span>
                      {growthData.delta !== null ? (
                        growthData.delta > 0 
                          ? `지난 작품보다 +${growthData.delta}점 성장했어요!` 
                          : `이번에는 지난 작품보다 ${Math.abs(growthData.delta)}점 낮지만, 다시 좋아질 수 있어요!`
                      ) : (
                        '첫 성장기록이에요. 다음 작품에서 얼마나 자랄지 기대돼요!'
                      )}
                    </div>
                    
                    <div className="w-full flex flex-col gap-3">
                      {[
                        { label: '배운 내용 이해', score: growthData.latest.understanding_score, maxScore: 20, color: 'bg-pink-500', bg: 'bg-pink-50' },
                        { label: '핵심 정리', score: growthData.latest.summary_score, maxScore: 20, color: 'bg-purple-500', bg: 'bg-purple-50' },
                        { label: '창의적 표현', score: growthData.latest.expression_score, maxScore: 20, color: 'bg-blue-500', bg: 'bg-blue-50' },
                        { label: '생각 확장', score: growthData.latest.thinking_score, maxScore: 20, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
                        { label: '완성 태도', score: growthData.latest.completion_score, maxScore: 20, color: 'bg-yellow-400', bg: 'bg-yellow-50' },
                      ].map((area, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[13px] font-bold">
                            <span className="text-slate-700">{area.label}</span>
                            <span className="text-slate-700">{area.score}<span className="text-slate-400 font-medium"> / {area.maxScore}</span></span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${area.bg}`}>
                            <div 
                              className={`h-full rounded-full ${area.color}`} 
                              style={{ width: `${(area.score / area.maxScore) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 h-full">
                    <div className="bg-sky-50 rounded-[14px] p-4 border border-sky-100 flex-1 flex flex-col">
                      <div className="text-xs font-black text-sky-600 mb-1.5">이번 작품에서 잘한 점</div>
                      <p className="text-[13px] text-slate-700 font-medium break-keep leading-[1.6]">
                        {growthData.latest.strength_feedback}
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-[14px] p-4 border border-pink-100 flex-1 flex flex-col">
                      <div className="text-xs font-black text-pink-600 mb-1.5">다음에 더 좋아질 점</div>
                      <p className="text-[13px] text-slate-700 font-medium break-keep leading-[1.6]">
                        {growthData.latest.improvement_feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                <button
                  onClick={() => workTab === 'comic' ? setIsAllWorksModalOpen(true) : navigate('/student/mindmaps')}
                  className="text-xs font-bold text-pink-500 hover:bg-pink-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                >
                  모두보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5">
                <button onClick={() => setWorkTab('comic')} className={`min-h-11 rounded-xl text-sm font-black transition ${workTab === 'comic' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>만화 작품</button>
                <button onClick={() => setWorkTab('mindmap')} className={`min-h-11 rounded-xl text-sm font-black transition ${workTab === 'mindmap' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>마인드맵</button>
              </div>

              {workTab === 'comic' ? (isLoadingWorks ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-slate-400 font-medium text-sm">작품을 불러오는 중입니다...</span>
                </div>
              ) : worksError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-red-50 rounded-xl border border-red-100 border-dashed">
                  <p className="text-red-500 font-medium text-sm">{worksError}</p>
                </div>
              ) : myWorks.length > 0 ? (
                <div className="grid grid-cols-1 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-4 gap-4">
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
              )) : (
                <MindmapWorksSection studentId={profile?.id ?? user?.id ?? ''} />
              )}
            </div>
          </main>

          <StudentDashboardSidebar
                attendanceMonth={attendanceMonth}
                daysOfWeek={daysOfWeek}
                monthlyAttendance={monthlyAttendance}
                attendedDaysCount={attendedDaysCount}
                latestMessage={latestMessage}
                notifications={notifications}
                onPreviousMonth={() => void handleMoveAttendanceMonth(-1)}
                onNextMonth={() => void handleMoveAttendanceMonth(1)}
                onOpenTeacherMessages={() => void handleOpenTeacherMessages()}
                onOpenNotifications={() => setIsAllNotificationsModalOpen(true)}
          />
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
          onHidden={refreshMessagesAndNotifications}
        />
        <AllNotificationsModal
          isOpen={isAllNotificationsModalOpen}
          onClose={() => setIsAllNotificationsModalOpen(false)}
          notifications={notifications}
          onDeleted={refreshMessagesAndNotifications}
        />
    </StudentPageShell>
  )
}
