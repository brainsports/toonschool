import { Link } from 'react-router-dom'
import { Sparkles, BookOpen, FileQuestion, LineChart, Share2, School, Users, User, ArrowRight, Play, Check, Eye } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      title: 'AI 만화 제작',
      desc: '간단한 대사나 콘티 설명만으로 캐릭터와 웹툰 컷 레이아웃을 생성해 주는 스마트 드로잉 툴킷',
      icon: Sparkles,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: '요점 정리',
      desc: '장황한 교재 텍스트를 핵심 요약형 콘티 문구와 툰 시나리오로 변환해 주는 학습 보조 모듈',
      icon: BookOpen,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: '퀴즈 생성',
      desc: '제작된 만화 스토리라인에 맞춰 객관식/주관식 문제를 생성하는 AI 인터랙티브 퀴즈 빌더',
      icon: FileQuestion,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: '학습 진도 관리',
      desc: '학교 및 학원 클래스별 학생 수강 진척도와 만화 과제 제출 여부를 직관적으로 시각화',
      icon: School,
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      title: '학생 성장 분석',
      desc: '학생이 제작한 결과물의 키워드 분석을 통해 창의성 점수 및 취약 학습 영역 피드백 리포트',
      icon: LineChart,
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      title: '공유 링크 배포',
      desc: '완성된 교육용 웹툰을 간편하게 SNS, 외부 웹페이지, 모바일 기기로 볼 수 있는 원클릭 웹 링크 배포',
      icon: Share2,
      gradient: 'from-rose-500 to-red-500',
    }
  ]

  const targets = [
    {
      title: '기관용 안내 (Schools & Academies)',
      desc: '소속 학교 또는 학원의 클래스를 열고 학생 명단을 일괄 등록할 수 있습니다. 강사 임명, 맞춤형 커리큘럼 배포, 단체 요금 혜택 및 기관 전용 종합 분석 대시보드가 제공됩니다.',
      icon: School,
      color: 'text-amber-400 bg-amber-950/40 border-amber-900/50',
      badge: '기관 전용'
    },
    {
      title: '학생용 안내 (Students)',
      desc: '선생님이 부여한 재미있는 만화 시나리오 퀘스트를 깨며 스스로 학습합니다. 나만의 캐릭터 디자인을 통해 창의력을 기르고, 친구들과 합작 웹툰을 연재할 수도 있습니다.',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50',
      badge: '학습 지원'
    },
    {
      title: '무료회원 안내 (Free Users)',
      desc: '가입과 동시에 매월 3회의 AI 웹툰 및 만화 컷 생성권이 무상 지급됩니다. 툰스쿨 고유의 기초 레이아웃 도구를 마음껏 체감해 보시고 유니크한 학습툰을 기획해 보세요.',
      icon: User,
      color: 'text-purple-400 bg-purple-950/40 border-purple-900/50',
      badge: '즉시 가입 가능'
    }
  ]

  const plans = [
    {
      name: 'Free Plan',
      price: '0',
      features: ['월 3회 AI 툰 자동 생성', '기본 컷 분할 레이아웃 에디터', '개인용 웹 공유 링크 발행', '커뮤니티 샘플 라이브러리 조회'],
      cta: '무료 회원가입',
      path: '/signup',
      popular: false
    },
    {
      name: 'Premium Plan',
      price: '19,000',
      features: ['무제한 AI 이미지 및 컷 생성', '프리미엄 캐릭터 에셋 라이브러리', 'AI 스토리-툰 시나리오 추천 모듈', '맞춤형 오답 퀴즈 연동 무제한', '우선 순위 빠른 속도 서버 제공'],
      cta: '지금 시작하기',
      path: '/signup',
      popular: true
    },
    {
      name: 'Institution Plan',
      price: '별도 문의',
      features: ['소속 기관 관리자 대시보드 제공', '클래스 무제한 개설 및 학생 일괄 관리', '통합 학업 평가 리포트 내보내기', '자체 교육 과정 LMS 데이터 서버 연동', '전담 기술 서포트 매니저 배정'],
      cta: '센터 도입 상담 문의',
      path: '/login',
      popular: false
    }
  ]

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 pt-10 relative overflow-hidden">
        <div className="absolute top-[-30%] left-[20%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-semibold animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>에듀테크의 새로운 미래</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
          만화를 만들며 스스로 공부하는<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
            AI 학습툰 플랫폼, 툰스쿨
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          지루한 텍스트 기반의 학습 자료를 단 몇 초 만에 인공지능 스토리텔링 웹툰과 퀴즈로 설계합니다.
          학습 몰입도를 높이고 학생들의 창의성 지표를 체계적으로 분석하는 맞춤형 공간을 경험해 보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link 
            to="/signup" 
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95"
          >
            <span>시작하기</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-all hover:scale-105"
          >
            <Play className="h-3.5 w-3.5 fill-current text-purple-400" />
            <span>데모 체험하기</span>
          </Link>
        </div>
      </section>

      {/* 2. Key Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">툰스쿨의 주요 기능</h2>
          <p className="text-slate-500 text-xs md:text-sm">풍부한 인공지능 툴킷과 학습 도구를 기반으로 웹툰 창작 교육을 주도합니다.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div 
                key={feat.title} 
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-850 hover:bg-slate-900/90 transition-all hover:translate-y-[-2px] group"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${feat.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{feat.title}</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Target Audience Guide */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">대상별 맞춤형 이용 가이드</h2>
          <p className="text-slate-500 text-xs md:text-sm">학교, 학생 및 일반 창작자 모두에게 최적화된 솔루션을 탑재했습니다.</p>
        </div>

        <div className="space-y-4">
          {targets.map((tgt) => {
            const Icon = tgt.icon
            return (
              <div 
                key={tgt.title} 
                className="p-6 rounded-2xl bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all flex flex-col md:flex-row items-start gap-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl bg-slate-950/80 border-l border-b border-slate-850 text-slate-500 text-[10px] font-bold">
                  {tgt.badge}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${tgt.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-200 text-sm">{tgt.title}</h3>
                  <p className="text-slate-450 text-xs leading-relaxed max-w-4xl">{tgt.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Pricing Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">합리적인 플랜 안내</h2>
          <p className="text-slate-500 text-xs md:text-sm">사용 목적에 최적화된 저렴하고 강력한 요금 체계를 선택해 보세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`p-6 rounded-3xl flex flex-col justify-between relative ${
                plan.popular 
                  ? 'bg-slate-900 border-2 border-purple-500 shadow-xl shadow-purple-500/5' 
                  : 'bg-slate-900/60 border border-slate-850'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                  가장 인기 있는 플랜
                </span>
              )}
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-200 text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-100">{plan.price}</span>
                    <span className="text-xs text-slate-500">{plan.price !== '별도 문의' ? '원 / 월' : ''}</span>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-400">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-purple-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                to={plan.path}
                className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-all mt-8 block ${
                  plan.popular 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md' 
                    : 'bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Webtoon Preview Mockup */}
      <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-purple-400" />
              <span>학습용 AI 툰 샘플 캔버스 미리보기</span>
            </h3>
            <p className="text-xs text-slate-500">학생 에디터에서 생성되는 웹툰 카드 시제품을 뷰어 형식으로 감상하세요.</p>
          </div>
          <Link 
            to="/signup" 
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold"
          >
            <span>직접 툰 편집기 실행해보기</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mock Webtoon layout visual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
            <div className="h-40 rounded-xl bg-purple-950/20 border border-purple-900/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent" />
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase px-2 py-1 rounded bg-purple-950/40 border border-purple-900/50">컷 1: 캐릭터 로드</span>
            </div>
            <div>
              <p className="text-xs text-slate-350 font-semibold leading-relaxed">"자, 이번 시간엔 인공지능이 어떻게 동작하는지 설명해 줄게!"</p>
              <span className="text-[9px] text-slate-500 block mt-1">말풍선 대사 활성화됨</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
            <div className="h-40 rounded-xl bg-pink-950/20 border border-pink-900/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent" />
              <span className="text-[10px] font-mono text-pink-400 font-bold uppercase px-2 py-1 rounded bg-pink-950/40 border border-pink-900/50">컷 2: 데이터 매핑</span>
            </div>
            <div>
              <p className="text-xs text-slate-350 font-semibold leading-relaxed">"먼저 컴퓨터에 수많은 사진 데이터를 학습시키는 단계란다!"</p>
              <span className="text-[9px] text-slate-500 block mt-1">AI 요점 정리 반영됨</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
            <div className="h-40 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase px-2 py-1 rounded bg-blue-950/40 border border-blue-900/50">컷 3: 퀴즈 출제</span>
            </div>
            <div>
              <p className="text-xs text-slate-350 font-semibold leading-relaxed">"학습이 끝난 AI는 새로운 사진을 보고 정답을 유추할 수 있지!"</p>
              <span className="text-[9px] text-slate-500 block mt-1">인터랙티브 퀴즈 링크 대기</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
