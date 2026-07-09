import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, MessageSquare, PencilLine } from 'lucide-react';

const worldStoryCards = [
    { id: 0, title: '역사 이야기', image: '/images/main/main-img-6.png' },
    { id: 1, title: '최신 이야기', image: '/images/main/main-img-7.png' },
    { id: 2, title: '생활 발견', image: '/images/main/main-img-8.png' },
];

export default function HomePage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % worldStoryCards.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-on-surface smooth-scroll font-body-md overflow-x-hidden bg-surface-dim selection:bg-primary/20">
            
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 h-20 md:h-24">
                <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        <div className="w-10 h-10 bg-primary text-white flex items-center justify-center font-bold rounded-xl text-lg shadow-sm">TS</div>
                        <span className="font-title-md font-extrabold text-2xl tracking-tight text-on-surface">툰스쿨</span>
                    </Link>
                    <nav className="hidden xl:flex items-center space-x-10">
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-2 py-1" to="/">툰스쿨</Link>
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-2 py-1" to="/ai-content">AI 학습콘텐츠</Link>
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-2 py-1" to="/flipped-learning">거꾸로 학습법</Link>
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-2 py-1" to="/pwa">PC·태블릿 버전</Link>
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md px-2 py-1" to="/faq">궁금해요</Link>
                    </nav>
                    <div className="hidden md:flex items-center space-x-4">
                        <Link 
                            className="bg-primary text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-primary-container transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30" 
                            to="/login?redirect=/student/select-unit"
                        >
                            툰스쿨
                        </Link>
                        <Link 
                            className="bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200" 
                            to="/login?redirect=/admin/lms/classes"
                        >
                            관리 LMS
                        </Link>
                    </div>
                    <button aria-label="메뉴 열기" className="xl:hidden text-on-surface-variant p-3 -mr-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12 justify-center">
                    <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-on-surface tracking-tight">
                            공부하지 말고,<br/>
                            <span className="text-primary relative inline-block mt-2">
                                공부를 만들자.
                                <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -z-10 rounded-full"></div>
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            툰스쿨은 초등 교과 단원을 학생이 직접 학습만화로 만드는 AI 수업 플랫폼입니다.<br className="hidden md:block" />단원 선택부터 대본, 6컷 만화, 단원 정리, OX 문제까지 한 번에 완성합니다.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-8">
                            <Link className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-container focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1 text-center flex items-center justify-center gap-2" to="/login">
                                무료로 시작하기 <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            </Link>
                            <Link className="w-full sm:w-auto bg-white text-gray-600 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200 transition-all text-center flex items-center justify-center" to="/student/select-unit">
                                툰스쿨 에디터 보기
                            </Link>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center perspective-1000">
                        {/* Tablet Frame Mockup */}
                        <div className="w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-blue-500/10 rounded-[24px] blur-2xl transform scale-105 -z-10"></div>
                            <img alt="ToonSchool Interface" className="w-full h-auto aspect-[16/9] object-cover rounded-[24px] shadow-2xl border border-gray-100/50" src="/images/main/main-img-1.png"/>
                        </div>
                    </div>
                </section>

                {/* Flow Bar - 반응형 Grid로 개선 (가로스크롤 제거) */}
                <section className="bg-white border-y border-outline-variant py-10 md:py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-4 text-center">
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">1</div>
                                <span className="font-bold text-sm text-gray-800">단원 선택</span>
                                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-gray-200"></div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">2</div>
                                <span className="font-bold text-sm text-gray-800">내가 만든 학습만화</span>
                                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-gray-200"></div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">3</div>
                                <span className="font-bold text-sm text-gray-800">완성작 공유</span>
                                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-gray-200"></div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">4</div>
                                <span className="font-bold text-sm text-gray-800">OX 퀴즈</span>
                                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-gray-200"></div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">5</div>
                                <span className="font-bold text-sm text-gray-800">책표지 만들기</span>
                                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-px bg-gray-200"></div>
                            </div>
                            <div className="flex flex-col items-center gap-3 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-2xl shadow-sm group-hover:scale-110 transition-transform">6</div>
                                <span className="font-bold text-sm text-gray-800">친구에게 자랑하기</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content Sections (Zigzag) */}
                <div className="space-y-0">
                    {/* Section 1: Cover */}
                    <section className="py-24 bg-surface-dim">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16">
                            <div className="w-full md:w-1/2 flex justify-center order-2 md:order-1">
                                <img alt="ToonSchool Book Covers" className="w-11/12 h-auto object-contain drop-shadow-xl" src="/images/main/main-img-2.png"/>
                            </div>
                            <div className="w-full md:w-1/2 space-y-6 order-1 md:order-2 text-center md:text-left">
                                <span className="inline-block text-primary font-bold tracking-wider uppercase text-sm bg-primary/10 px-3 py-1 rounded-full">STEP 1. COVER</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">배움의 시작,<br/>나만의 표지 만들기</h2>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium">학습할 교과 단원을 선택하고 나만의 표지를 만듭니다.<br className="hidden md:block"/>내가 직접 만드는 교과서로 학습 동기를 부여하세요.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: 6-cut Toon */}
                    <section className="py-24 bg-white">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="text-center mb-16 space-y-4">
                                <span className="inline-block text-[#2563ff] font-bold tracking-wider uppercase text-sm bg-blue-50 px-3 py-1 rounded-full">STEP 2. CARTOON</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">AI와 함께 내가 만드는 학습 만화</h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">배경을 만들고 대사를 내 말투로 바꾸고 수업도구를 더해 나만의 만화를 완성합니다.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Card 1: 배경 생성 */}
                                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all p-8 flex flex-col gap-8 group">
                                    <div className="aspect-[1/1.2] overflow-hidden rounded-2xl bg-gray-50 p-4 flex items-center justify-center">
                                        <img alt="배경 생성 예시" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" src="/images/main/main-img-3.png"/>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Image className="w-7 h-7 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2 text-gray-900">배경 생성</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed font-medium">학습 내용을 바탕으로 친근한 화면을 만들어요.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Card 2: 대사 작성 */}
                                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all p-8 flex flex-col gap-8 group">
                                    <div className="aspect-[1/1.2] overflow-hidden rounded-2xl bg-gray-50 p-4 flex items-center justify-center">
                                        <img alt="대사 작성 예시" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" src="/images/main/main-img-4.png"/>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-7 h-7 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2 text-gray-900">대사 작성</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed font-medium">대본을 짧은 대사로 바꾸어 자연스럽게 채워요.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Card 3: 수업도구 */}
                                <div className="bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all p-8 flex flex-col gap-8 group">
                                    <div className="aspect-[1/1.2] overflow-hidden rounded-2xl bg-gray-50 p-4 flex items-center justify-center">
                                        <img alt="수업도구 활용 예시" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" src="/images/main/main-img-5.png"/>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                            <PencilLine className="w-7 h-7 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2 text-gray-900">수업도구</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed font-medium">캐릭터와 말풍선을 고치고, 내 만화를 더 멋지게 꾸며요.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: World Story */}
                    <section className="py-24 bg-surface-dim">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2 flex justify-center order-2 md:order-1">
                                <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm aspect-[1/1.4] border border-gray-100 relative overflow-hidden group">
                                    {worldStoryCards.map((card, index) => (
                                        <div 
                                            key={card.id}
                                            className={`absolute inset-0 p-6 pb-16 flex items-center justify-center transition-all duration-700 ease-in-out ${
                                                index === currentSlide 
                                                    ? 'opacity-100 translate-y-0 scale-100' 
                                                    : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                                            }`}
                                        >
                                            <div className="w-full h-full overflow-visible">
                                                <img alt={card.title} className="w-full h-full object-contain object-center" src={card.image}/>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Dots Indicator - 접근성 향상 (터치 영역 최소 44px) */}
                                    <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-2 z-10">
                                        {worldStoryCards.map((card, index) => (
                                            <button
                                                key={card.id}
                                                onClick={() => setCurrentSlide(index)}
                                                className="p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full group/btn"
                                                aria-label={`${index + 1}번째 슬라이드로 이동`}
                                            >
                                                <div className={`h-2.5 rounded-full transition-all duration-300 ${
                                                    index === currentSlide 
                                                        ? 'bg-primary w-8' 
                                                        : 'bg-gray-300 w-2.5 group-hover/btn:bg-gray-400'
                                                }`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-6 order-1 md:order-2 text-center md:text-left">
                                <span className="inline-block text-green-600 font-bold tracking-wider uppercase text-sm bg-green-50 px-3 py-1 rounded-full">STEP 3. WORLD STORY</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">세상 속 이야기로<br/>넓히는 배움</h2>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium">학습한 개념이 실제 세상에서 어떻게 쓰이는지 원리를 이해합니다.<br className="hidden md:block"/>워크시트 형태의 페이지로 생각을 체계화합니다.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: OX Quiz */}
                    <section className="py-24 bg-white">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                                <span className="inline-block text-yellow-600 font-bold tracking-wider uppercase text-sm bg-yellow-50 px-3 py-1 rounded-full">STEP 4. OX QUIZ</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">OX 퀴즈로 개념 확인하기</h2>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium">중요한 개념을 OX 문제로 만들어 봅니다.<br className="hidden md:block"/>문제를 직접 내면서 핵심 내용을 다시 한번 기억에 남깁니다.</p>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[2rem] shadow-xl w-full max-w-md p-8 md:p-10 border border-yellow-100/50 text-center relative overflow-hidden transform hover:-translate-y-1 transition-transform">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-yellow-500 font-bold text-2xl">Q</div>
                                    <h3 className="text-xl md:text-2xl font-bold mb-10 text-gray-900 leading-snug">태양계에서 가장 큰 행성은<br/>목성이다.</h3>
                                    <div className="flex justify-center gap-8">
                                        <button className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-blue-500 flex items-center justify-center text-blue-500 text-5xl font-extrabold hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">O</button>
                                        <button className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-red-500 flex items-center justify-center text-red-500 text-5xl font-extrabold hover:bg-red-50 hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300">X</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Back Cover */}
                    <section className="py-24 bg-surface-dim">
                        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/2 flex justify-center order-2 md:order-1">
                                <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm aspect-[1/1.4] border border-gray-100 flex flex-col justify-end overflow-hidden transform hover:-translate-y-1 transition-transform">
                                    <img alt="Back Cover Design" className="w-full h-full object-contain" src="/images/main/main-img-9.png"/>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-6 order-1 md:order-2 text-center md:text-left">
                                <span className="inline-block text-purple-600 font-bold tracking-wider uppercase text-sm bg-purple-50 px-3 py-1 rounded-full">STEP 5. BACK COVER</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">책의 마지막,<br/>뒤표지 꾸미기</h2>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium">책의 마지막을 장식합니다.<br className="hidden md:block"/>지은이 이름과 발행 학년을 적어 나만의 학습 만화책을 완성하는 뿌듯함을 느낍니다.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Sharing */}
                    <section className="py-24 bg-white overflow-hidden relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[80%] h-[120%] bg-gradient-to-l from-primary/5 to-transparent rounded-full -z-10 blur-3xl pointer-events-none"></div>
                        
                        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
                            {/* Left Content */}
                            <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                                <div className="space-y-6">
                                    <span className="inline-block text-gray-600 font-bold tracking-wider uppercase text-sm bg-gray-100 px-3 py-1 rounded-full">STEP 6. SHARE</span>
                                    <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900">
                                        완성한 작품을 전용뷰어로 보고<br/>친구에게 자랑해요
                                    </h2>
                                    <p className="text-lg text-gray-600 leading-relaxed font-medium">
                                        완성한 학습만화를 툰스쿨 전용뷰어로 넘겨 보고,<br className="hidden md:block"/>링크 하나로 친구나 가족에게 쉽게 공유할 수 있어요.
                                    </p>
                                </div>
                                {/* Function Badges */}
                                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                                    <span className="px-5 py-2.5 bg-primary/10 text-primary rounded-full text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-sm">visibility</span> 전용뷰어 감상</span>
                                    <span className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-sm">link</span> 링크 공유</span>
                                    <span className="px-5 py-2.5 bg-purple-50 text-purple-600 rounded-full text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-sm">download</span> PDF 다운로드</span>
                                </div>
                            </div>

                            {/* Right Content (Visual Area with safe characters) */}
                            <div className="w-full lg:w-1/2 relative mt-12 lg:mt-0 flex justify-center">
                                {/* Tablet Mockup */}
                                <div className="relative z-10 bg-gray-900 p-3 md:p-4 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-gray-800 w-full max-w-[500px]">
                                    <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[4/3] relative flex flex-col">
                                        {/* Viewer UI */}
                                        <div className="w-full p-3 md:p-4 flex justify-between items-center bg-white border-b border-gray-100 z-20 shrink-0">
                                            <span className="font-bold text-sm text-gray-800">나만의 우주 탐험</span>
                                            <div className="flex gap-2">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300" aria-label="확대"><span className="material-symbols-outlined text-lg">zoom_in</span></button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300" aria-label="다운로드"><span className="material-symbols-outlined text-lg">download</span></button>
                                            </div>
                                        </div>
                                        {/* Comic Preview */}
                                        <div className="w-full flex-1 p-6 md:p-8 flex items-center justify-center bg-gray-50/50 overflow-hidden">
                                            <img alt="Comic Preview" className="h-full w-auto object-contain shadow-md rounded border border-gray-200/50" src="/images/main/main-img-10.png"/>
                                        </div>
                                        {/* Viewer Controls */}
                                        <div className="w-full p-3 md:p-4 flex justify-between items-center bg-white border-t border-gray-100 z-20 shrink-0">
                                            <button className="flex items-center gap-1.5 text-primary font-bold text-xs hover:bg-primary/5 px-2 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                                                <span className="material-symbols-outlined text-sm">share</span> <span className="hidden sm:inline">친구에게 공유</span>
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <button className="material-symbols-outlined text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-full p-1" aria-label="이전 페이지">chevron_left</button>
                                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">1 / 12</span>
                                                <button className="material-symbols-outlined text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-full p-1" aria-label="다음 페이지">chevron_right</button>
                                            </div>
                                            <button className="flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> <span className="hidden sm:inline">PDF 저장</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Character: Doyun (Boy) - 안전한 위치 조정 */}
                                    <div className="absolute -bottom-6 -left-4 sm:-left-8 z-30 w-24 sm:w-32 md:w-36 drop-shadow-xl transition-transform hover:-translate-y-2 duration-300">
                                        <div className="relative">
                                            <div className="absolute -top-14 left-2 sm:-top-16 sm:-left-4 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 text-[10px] sm:text-xs font-bold whitespace-nowrap z-40 text-gray-800">
                                                내 만화책을 보낼 수 있어!
                                                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
                                            </div>
                                            <img alt="Doyun" className="w-full h-auto object-contain relative z-30" src="/images/main/main-img-11.png"/>
                                        </div>
                                    </div>

                                    {/* Character: Seoa (Girl) - 안전한 위치 조정 */}
                                    <div className="absolute -top-6 -right-4 sm:-right-8 z-30 w-20 sm:w-28 md:w-32 drop-shadow-xl transition-transform hover:-translate-y-2 duration-300">
                                        <div className="relative">
                                            <div className="absolute -top-12 right-2 sm:-top-16 sm:-right-4 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-100 text-[10px] sm:text-xs font-bold whitespace-nowrap z-40 text-gray-800">
                                                링크를 누르면 바로 보여!
                                                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
                                            </div>
                                            <img alt="Seoa" className="w-full h-auto object-contain relative z-30" src="/images/main/main-img-12.png"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

            </main>
            
            {/* Footer */}
            <footer className="w-full px-6 py-16 flex flex-col items-center text-center space-y-8 bg-surface-dim border-t border-outline-variant">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 bg-gray-400 text-white flex items-center justify-center font-bold rounded-lg text-sm">TS</div>
                        <span className="font-title-md font-extrabold text-xl text-gray-600">ToonSchool</span>
                    </div>
                    <p className="text-gray-500 font-bold">공부하지 말고, 공부를 만들자.</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-bold text-gray-500 max-w-2xl">
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/">홈</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/about">툰스쿨이란</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/student/select-unit">툰스쿨 에디터</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/classroom">수업 활용</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/flipped-learning">거꾸로 학습법</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/share">공유 링크</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/pricing">요금제</Link>
                    <Link className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2" to="/contact">고객센터</Link>
                </div>
                
                <div className="pt-8 border-t border-gray-200/60 w-full max-w-4xl">
                    <p className="text-sm text-gray-400 font-medium">© 2024 ToonSchool. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}
