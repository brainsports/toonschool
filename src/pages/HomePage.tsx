import { Link } from 'react-router-dom'
import { 
  Sparkles, BookOpen, MessageSquare, PenTool, LayoutTemplate, Share2, 
  Brain, TrendingUp, Users, Presentation, BookA, Calculator, Globe2, 
  Microscope, Languages, CheckCircle2, ChevronDown, UserPlus, FileText,
  MonitorSmartphone, Download, ShieldCheck, Link as LinkIcon
} from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const flowSteps = [
    { icon: BookOpen, title: '단원 선택', desc: '학습할 교과 단원과 목표를 선택합니다.' },
    { icon: MessageSquare, title: '주제 만들기', desc: '만화로 표현할 핵심 주제를 정합니다.' },
    { icon: FileText, title: '대본 만들기', desc: 'AI의 도움을 받아 재미있는 대본을 씁니다.' },
    { icon: PenTool, title: '표지와 6컷 만화 제작', desc: '캐릭터와 배경을 배치해 만화를 완성합니다.' },
    { icon: LayoutTemplate, title: '단원 정리와 OX 문제 만들기', desc: '배운 내용을 정리하고 퀴즈를 출제합니다.' },
    { icon: Share2, title: '친구에게 공유하기', desc: '완성된 결과물을 친구들과 함께 봅니다.' }
  ]

  const learningEffects = [
    { icon: Brain, title: '개념 이해', desc: '어려운 개념을 만화로 그리며 쉽게 이해합니다.' },
    { icon: Languages, title: '어휘력 향상', desc: '상황에 맞는 적절한 대사와 어휘를 고민합니다.' },
    { icon: Presentation, title: '표현력 향상', desc: '자신의 생각을 글과 그림으로 표현하는 능력을 기릅니다.' },
    { icon: TrendingUp, title: '자기주도 학습', desc: '스스로 이야기를 만들며 학습에 대한 흥미를 높입니다.' },
    { icon: Users, title: '친구와 공유', desc: '서로의 작품을 감상하며 소통하고 배웁니다.' }
  ]

  const subjects = [
    { icon: BookA, title: '국어', desc: '이야기 구조와 어휘를 만화로 정리', color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: Calculator, title: '수학', desc: '개념과 풀이 과정을 만화로 설명', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Globe2, title: '사회', desc: '역사와 지역 이야기를 만화로 표현', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Microscope, title: '과학', desc: '실험과 원리를 만화로 이해', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Languages, title: '영어', desc: '상황 대화를 만화로 연습', color: 'text-purple-500', bg: 'bg-purple-50' }
  ]

  const features = [
    { title: '교과 단원 기반', desc: '초등 교육과정과 완벽하게 연계됩니다.', icon: BookOpen },
    { title: '교사용 학생 계정 관리', desc: '학생 개인정보 없이 안전하게 클래스를 운영합니다.', icon: ShieldCheck },
    { title: 'AI 대본 생성', desc: '어려운 스토리텔링을 AI가 친절하게 도와줍니다.', icon: Sparkles },
    { title: '6컷 학습만화 제작', desc: '누구나 쉽게 고품질의 학습만화를 그릴 수 있습니다.', icon: LayoutTemplate },
    { title: '단원 정리 자동 연결', desc: '만화 내용이 자연스럽게 요점 정리로 이어집니다.', icon: FileText },
    { title: 'OX 문제 만들기', desc: '직접 퀴즈를 출제하며 메타인지를 높입니다.', icon: CheckCircle2 },
    { title: 'PDF 다운로드와 링크 공유', desc: '완성된 작품을 인쇄하거나 온라인으로 쉽게 배포합니다.', icon: Download }
  ]

  const faqs = [
    {
      q: '학생도 회원가입을 해야 하나요?',
      a: '학생은 별도 회원가입 없이 교사가 만든 아이디로 접속합니다. 개인정보 보호를 최우선으로 설계되었습니다.'
    },
    {
      q: '태블릿에서도 사용할 수 있나요?',
      a: '네! 툰스쿨은 태블릿 환경을 우선 고려해 설계되어 학교 태블릿으로 원활하게 수업할 수 있습니다.'
    },
    {
      q: '결과물을 공유할 수 있나요?',
      a: '네, 클릭 한 번으로 링크 공유와 PDF 다운로드를 지원하여 학급 게시판이나 가정통신문으로 쉽게 활용할 수 있습니다.'
    },
    {
      q: '교과 단원과 연결되나요?',
      a: '네, 초등 교과 단원을 바탕으로 주제, 대본, 만화, 정리 활동이 유기적으로 연결되도록 커리큘럼이 구성되어 있습니다.'
    }
  ]

  return (
    <div className="fixed inset-0 z-[100] bg-[#f3f4f7] overflow-y-auto font-sans text-slate-800">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#ff2778] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-pink-500/20">
              TS
            </div>
            <span className="text-2xl font-black text-[#ff2778] tracking-tight">툰스쿨</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 font-bold text-slate-600">
            <Link to="/" className="text-[#ff2778]">홈</Link>
            <Link to="#" className="hover:text-[#ff2778] transition-colors">툰스쿨이란</Link>
            <Link to="/toon" className="hover:text-[#ff2778] transition-colors">툰스쿨 에디터</Link>
            <Link to="#" className="hover:text-[#ff2778] transition-colors">수업 활용</Link>
            <Link to="#" className="hover:text-[#ff2778] transition-colors">꺼꾸로 학습법</Link>
            <Link to="#" className="hover:text-[#ff2778] transition-colors">요금제</Link>
            <Link to="/login" className="hover:text-[#ff2778] transition-colors">로그인/회원가입</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden lg:block font-bold text-slate-600 hover:text-[#ff2778] transition-colors">
              로그인
            </Link>
            <Link to="/signup" className="bg-[#ff2778] hover:bg-[#e01f65] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 transition-transform hover:-translate-y-0.5 whitespace-nowrap">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-32">
        {/* 2. Hero Section */}
        <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#f19cdb]/20 rounded-full blur-[80px]" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-[#ff2778]/10 rounded-full blur-[100px]" />
          
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-[#f19cdb]/30 text-[#ff2778] font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI 수업 플랫폼</span>
              </div>
              <h1 className="text-5xl lg:text-[4rem] font-black text-slate-800 leading-[1.15] break-keep">
                공부하지 말고,<br />
                <span className="text-[#ff2778]">공부를 만들자.</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-lg break-keep font-medium">
                툰스쿨은 초등 교과 단원을 학생이 직접 학습만화로 만드는 AI 수업 플랫폼입니다.<br/><br/>
                단원 선택부터 대본, 6컷 만화, 단원 정리, OX 문제까지 한 번에 완성합니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/signup" className="flex justify-center items-center gap-2 px-8 py-4 rounded-full bg-[#ff2778] hover:bg-[#e01f65] text-white font-bold text-lg shadow-xl shadow-pink-500/20 transition-transform hover:-translate-y-1">
                  무료로 시작하기
                </Link>
                <Link to="/toon" className="flex justify-center items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-lg shadow-md border border-slate-200 transition-transform hover:-translate-y-1">
                  툰스쿨 에디터 보기
                </Link>
              </div>
            </div>
            
            {/* Tablet Mockup */}
            <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
              <div className="relative aspect-[4/3] bg-white rounded-[2rem] shadow-2xl border-[12px] border-slate-800 overflow-hidden flex flex-col">
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-[#f8f9fc] p-6 flex items-center justify-center overflow-hidden">
                  {/* Decorative Mockup Cards */}
                  <div className="relative w-full h-full max-w-sm mx-auto perspective-[1000px] transform-style-3d">
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 transform rotate-[-4deg] translate-y-4 translate-x-[-20px] opacity-60 flex flex-col gap-2">
                      <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                      <div className="flex-1 bg-slate-100 rounded-xl"></div>
                    </div>
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 transform rotate-[2deg] translate-y-2 translate-x-[10px] opacity-80 flex flex-col gap-2">
                      <div className="h-4 w-1/2 bg-blue-200 rounded"></div>
                      <div className="flex-1 bg-blue-50 rounded-xl"></div>
                    </div>
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 transform z-10 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f19cdb]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-[#ff2778]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">학습만화 완성!</h3>
                        <p className="text-sm text-slate-500 mt-1">표지부터 OX 문제까지 구성되었습니다.</p>
                      </div>
                      <div className="w-full h-24 bg-slate-50 rounded-xl border border-slate-100 mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -right-6 top-10 bg-white px-4 py-3 rounded-2xl shadow-lg border border-slate-100 font-bold text-sm text-slate-700 flex items-center gap-2 animate-bounce-slow">
                <LayoutTemplate className="w-5 h-5 text-purple-500" />
                6컷 만화 제작
              </div>
              <div className="absolute -left-6 bottom-20 bg-white px-4 py-3 rounded-2xl shadow-lg border border-slate-100 font-bold text-sm text-slate-700 flex items-center gap-2 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                단원 정리 & OX 퀴즈
              </div>
            </div>
          </div>
        </section>

        {/* 3. Flow Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">툰스쿨은 이렇게 만듭니다</h2>
              <p className="text-lg text-slate-500 font-medium">6단계의 체계적인 흐름으로 학습과 창작을 연결합니다.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flowSteps.map((step, idx) => (
                <div key={idx} className="bg-[#f8f9fc] rounded-3xl p-8 border border-slate-100 hover:border-[#f19cdb] transition-colors group relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-9xl font-black text-slate-100/50 group-hover:text-[#f19cdb]/10 transition-colors z-0">
                    {idx + 1}
                  </div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-[#ff2778]">
                      <step.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-[#ff2778]">{idx + 1}.</span> {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Learning Effects Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">학생은 만들면서 배웁니다</h2>
              <p className="text-lg text-slate-500 font-medium">읽기만 하는 공부에서 직접 설명하는 공부로 바뀝니다.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
              {learningEffects.map((effect, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(20%-1.2rem)] hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-[#f3f4f7] flex items-center justify-center mb-4">
                    <effect.icon className="w-8 h-8 text-[#ff2778]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{effect.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed break-keep">{effect.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Teacher Operation Section */}
        <section className="py-20 bg-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-700/50 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black mb-4">교사는 쉽게 운영합니다</h2>
              <p className="text-lg text-slate-400 font-medium">학생은 직접 가입할 필요 없이, 교사가 안전하게 수업을 시작합니다.</p>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 border border-slate-700 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative">
                {/* Connecting Line */}
                <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
                
                {[
                  { icon: UserPlus, title: '교사 가입', desc: '선생님 계정 생성' },
                  { icon: Users, title: '학생 계정 생성', desc: '학생 아이디/비번 발급' },
                  { icon: Presentation, title: '수업 안내', desc: '단원 및 목표 설정' },
                  { icon: PenTool, title: '학생 제작', desc: '에디터로 만화 완성' },
                  { icon: MonitorSmartphone, title: '결과물 확인', desc: '대시보드에서 평가' }
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center w-full lg:w-48 bg-slate-900 lg:bg-transparent p-4 lg:p-0 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center mb-4 text-slate-300">
                      <step.icon className="w-8 h-8" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#ff2778] text-white font-bold flex items-center justify-center mb-3 text-sm absolute top-4 left-4 lg:static lg:mb-3 shadow-lg shadow-pink-500/20">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
                <p className="text-rose-200 font-medium">
                  <span className="font-bold text-white">💡 중요:</span> 학생은 직접 회원가입하지 않습니다. 교사가 생성한 계정 정보로 안전하게 에디터만 사용합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Subject Examples Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">초등 전 과목에 활용할 수 있습니다</h2>
              <p className="text-lg text-slate-500 font-medium">어떤 과목이든 창의적인 학습만화로 표현해 보세요.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {subjects.map((sub, idx) => (
                <div key={idx} className={`${sub.bg} rounded-3xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow`}>
                  <div className={`w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 ${sub.color}`}>
                    <sub.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{sub.title}</h3>
                  <p className="text-sm text-slate-600 break-keep">{sub.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Result Preview Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">학생이 만든 학습만화는 이렇게 완성됩니다</h2>
              <p className="text-lg text-slate-500 font-medium">종이책 같은 구조로 완성도 높은 결과물을 얻을 수 있습니다.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { title: '표지', icon: BookOpen },
                { title: '6컷 만화', icon: LayoutTemplate },
                { title: '세상 속 이야기', icon: Globe2 },
                { title: 'OX 문제', icon: CheckCircle2 },
                { title: '뒤표지', icon: BookA },
                { title: '공유 화면', icon: LinkIcon }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 aspect-[3/4] flex flex-col items-center justify-center text-center group hover:border-[#f19cdb] transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-[#f3f4f7] flex items-center justify-center mb-4 text-slate-400 group-hover:text-[#ff2778] group-hover:bg-pink-50 transition-colors">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-700">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-2">미리보기 영역</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Feature Differentiator Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">툰스쿨은 <span className="text-[#ff2778]">수업을 위해 설계된</span> 학습만화 플랫폼입니다</h2>
              <p className="text-lg text-slate-500 font-medium">단순한 그리기 도구를 넘어, 완벽한 교육용 에듀테크 솔루션을 제공합니다.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-center">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 text-[#ff2778]">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{feat.title}</h3>
                    <p className="text-sm text-slate-500 break-keep">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Pricing Section */}
        <section className="py-20 bg-[#f3f4f7]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-4">수업 규모에 맞게 시작하세요</h2>
              <p className="text-lg text-slate-500 font-medium">합리적인 플랜으로 지금 바로 툰스쿨을 도입해 보세요.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
              {/* Free */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
                <h3 className="text-xl font-bold text-slate-800 mb-2">무료 체험</h3>
                <p className="text-slate-500 mb-6 flex-1 break-keep">기본적인 에디터 기능과 수업 활동을 체험해 볼 수 있습니다.</p>
                <Link to="/signup" className="block text-center py-4 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-colors">
                  무료 체험 신청
                </Link>
              </div>
              
              {/* Teacher (Highlight) */}
              <div className="bg-white rounded-3xl p-8 border-2 border-[#ff2778] shadow-xl relative flex flex-col h-full transform md:-translate-y-4 hover:-translate-y-5 transition-transform">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ff2778] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                  추천 플랜
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">교사용</h3>
                <p className="text-slate-500 mb-6 flex-1 break-keep">1개 학급 운영과 전체 에디터 기능, 학생 관리를 완벽하게 지원합니다.</p>
                <Link to="/login" className="block text-center py-4 rounded-xl bg-[#ff2778] hover:bg-[#e01f65] font-bold text-white shadow-md transition-colors">
                  자세히 보기
                </Link>
              </div>

              {/* Institution */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full hover:-translate-y-1 transition-transform">
                <h3 className="text-xl font-bold text-slate-800 mb-2">기관용</h3>
                <p className="text-slate-500 mb-6 flex-1 break-keep">학교 단위의 대규모 도입 및 관리자 대시보드 연동을 지원합니다.</p>
                <Link to="/login" className="block text-center py-4 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-white transition-colors">
                  기관 도입 문의
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 10. FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-800 mb-4">자주 묻는 질문</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-[#f19cdb] transition-colors">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left px-6 py-5 bg-white hover:bg-slate-50 flex items-center justify-between font-bold text-slate-800 transition-colors"
                  >
                    <span className="text-lg">Q. {faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 pt-1 bg-white text-slate-600 leading-relaxed font-medium">
                      A. {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ff2778] text-white flex items-center justify-center font-black text-sm">
              TS
            </div>
            <span className="text-xl font-black text-white tracking-tight">툰스쿨</span>
          </div>
          <div className="text-sm font-medium">
            © 2026 ToonSchool. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
