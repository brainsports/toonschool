import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, Star, Trophy, Calendar, 
  Bell, MessageSquare, ChevronRight,
  CheckCircle2, Play
} from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import WorkCard from '../components/mypage/WorkCard'
import type { MyWork } from '../components/mypage/WorkCard'
import AllWorksModal from '../components/mypage/AllWorksModal'
import TeacherMessageModal from '../components/mypage/TeacherMessageModal'

import { useAuth } from '../../../shared/contexts/AuthContext'
import { getStudentWorks } from '../services/studentWorkService'
import { getLatestTeacherMessageForClass, getTeacherMessagesForClass, resolveStudentClassKey, type TeacherMessage } from '../services/teacherMessageService'



type RecommendationSource = 'teacher-assigned' | 'in-progress' | 'rotation' | 'default';

interface RecommendedLearning {
  subject: string;
  unitTitle: string;
  description: string;
  source: RecommendationSource;
}

/**
 * 오늘의 추천 학습 로직
 * 
 * 추천 우선순위:
 * A. 교사 지정 과제가 있으면 최우선
 * B. 미완성 작품이 있으면 이어서 추천
 * C. 과목 순환 추천 (국어 → 영어 → 수학 → 사회 → 과학 → 다시 국어)
 * D. 해당 과목에서 다음 중단원 추천
 * E. 해당 과목 기록이 없으면 첫 중단원 추천
 * F. 해당 과목의 모든 중단원을 완료했다면 다음 과목으로 넘어가기
 * G. 모든 데이터가 없을 때 기본 추천
 */
const getTodayRecommendedLearning = (): RecommendedLearning => {
  // TODO: 실제 Supabase 학습 기록 데이터와 연동 (studentMockData 등 활용 가능)
  const mockTeacherAssignedTask: any = null; // ex: { subject: '국어', unitTitle: '...', description: '...' }
  const mockInProgressWork: any = null;      // ex: { subject: '과학', unitTitle: '...', description: '...' }
  const mockLastWorkedSubject = '과학';        // 순환 테스트를 위해 '과학'으로 임시 설정 (다음은 '국어')

  // A. 교사 지정 과제가 있으면 최우선
  if (mockTeacherAssignedTask) {
    return {
      subject: mockTeacherAssignedTask.subject || '국어',
      unitTitle: mockTeacherAssignedTask.unitTitle || '과제 단원',
      description: mockTeacherAssignedTask.description || '선생님이 지정하신 과제를 시작하세요.',
      source: 'teacher-assigned',
    };
  }

  // B. 미완성 작품이 있으면 이어서 추천
  if (mockInProgressWork) {
    return {
      subject: mockInProgressWork.subject || '국어',
      unitTitle: mockInProgressWork.unitTitle || '미완성 단원',
      description: mockInProgressWork.description || '만들던 작품을 이어서 완성해보세요.',
      source: 'in-progress',
    };
  }

  // C. 과목 순환 추천 기준
  const subjectRotation = ['국어', '영어', '수학', '사회', '과학'];
  let startIndex = subjectRotation.indexOf(mockLastWorkedSubject);
  if (startIndex === -1) startIndex = -1;

  // 과목별 학습 기록 Mock (실제로는 API 연동)
  const mockRecords: Record<string, { lastCompletedUnit: number; totalUnits: number }> = {
    '국어': { lastCompletedUnit: 3, totalUnits: 10 },
    '영어': { lastCompletedUnit: 0, totalUnits: 10 },
    '수학': { lastCompletedUnit: 5, totalUnits: 10 },
    '사회': { lastCompletedUnit: 2, totalUnits: 10 },
    '과학': { lastCompletedUnit: 4, totalUnits: 10 },
  };

  // 최대 5과목을 순환하며 (F)
  for (let i = 1; i <= subjectRotation.length; i++) {
    const nextIndex = (startIndex + i) % subjectRotation.length;
    const subject = subjectRotation[nextIndex];
    const record = mockRecords[subject];

    // E. 기록이 아예 없는 경우
    if (!record) {
      return {
        subject,
        unitTitle: '1단원',
        description: '새로운 과목의 학습을 시작해보세요.',
        source: 'rotation',
      };
    }

    // D. 다음 중단원 추천
    if (record.lastCompletedUnit < record.totalUnits) {
      const nextUnit = record.lastCompletedUnit + 1;
      
      let description = '다음 단원을 학습해보세요.';
      // 기존 예시 화면과 비슷한 출력을 위해 하드코딩된 예외 처리
      if (subject === '국어' && nextUnit === 4) {
        description = '만화로 마음 표현하기';
        return {
          subject,
          unitTitle: `${nextUnit}단원. 마음을 전해요`,
          description,
          source: 'rotation',
        };
      }

      return {
        subject,
        unitTitle: `${nextUnit}단원`,
        description,
        source: 'rotation',
      };
    }
  }

  // G. 기본 추천
  return {
    subject: '국어',
    unitTitle: '1단원. 마음을 전해요',
    description: '만화로 마음 표현하기',
    source: 'default',
  };
};

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

  // Mock data for attendance
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  // 2026년 7월 1일은 수요일(인덱스 3), 총 31일.
  const monthlyAttendance = Array.from({ length: 35 }, (_, i) => {
    const date = i - 2; // i=3일 때 date=1
    if (date > 0 && date <= 31) {
      return { 
        date, 
        attended: [1, 2, 3].includes(date),
        isToday: date === 3
      };
    }
    return null;
  });
  const attendedDaysCount = 3;

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

    async function loadTeacherMessage() {
      const classKey = resolveStudentClassKey(profile, user);
      const msg = await getLatestTeacherMessageForClass(classKey);
      setLatestMessage(msg);
    }

    loadWorks();
    loadTeacherMessage();
  }, [user, profile]);

  const handleOpenTeacherMessages = async () => {
    setIsTeacherMessageModalOpen(true);
    const classKey = resolveStudentClassKey(profile, user);
    const msgs = await getTeacherMessagesForClass(classKey);
    setAllMessages(msgs);
  };

  const recommendedLearning = getTodayRecommendedLearning()
  // Evaluation areas data
  const growthAreas = [
    { label: '단원 이해력', score: 19, maxScore: 20, color: 'bg-pink-500', bg: 'bg-pink-50' },
    { label: '요약·정리력', score: 18, maxScore: 20, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: '이야기 표현력', score: 17, maxScore: 20, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '문제해결·퀴즈 활용력', score: 19, maxScore: 20, color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { label: '성장·공유 태도', score: 20, maxScore: 20, color: 'bg-yellow-400', bg: 'bg-yellow-50' },
  ];
  const growthScoreTotal = growthAreas.reduce((sum, area) => sum + area.score, 0);

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 오늘의 학습 Main Card */}
            <div className="bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-[2rem] p-8 flex items-center justify-between border border-pink-100 relative overflow-hidden min-h-[260px] shadow-sm">
              <div className="z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-pink-600">오늘의 추천 학습</h2>
                  <span className="text-2xl">☀️</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-pink-500 text-white text-sm font-bold rounded-full">{recommendedLearning.subject}</span>
                    <span className="font-bold text-slate-700 text-lg">{recommendedLearning.unitTitle}</span>
                  </div>
                  <p className="text-slate-500 font-medium ml-1">{recommendedLearning.description}</p>
                </div>

                <button 
                  onClick={() => navigate('/student/select-unit')}
                  className="mt-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-md shadow-pink-500/20 hover:shadow-lg transition-all flex items-center gap-2 w-fit active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{recommendedLearning.source === 'teacher-assigned' ? '과제 시작' : '툰스쿨 에디터'}</span>
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
                  <span className="text-xs font-bold text-slate-500">출석</span>
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
                  2026년 7월
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
                      <span className="text-sm font-bold text-slate-800">
                        {latestMessage.title || '선생님 말씀'}
                      </span>
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
    </StudentPageShell>
  )
}
