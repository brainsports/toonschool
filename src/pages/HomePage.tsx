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
        <div className="text-on-surface smooth-scroll font-body-md overflow-x-hidden bg-surface-dim">
            
{/* Header */}
<header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 h-20 md:h-24">
<div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
<Link to="/" className="flex items-center gap-3">
<div className="w-10 h-10 bg-primary text-white flex items-center justify-center font-bold rounded-lg text-lg">TS</div>
<span className="font-title-md font-extrabold text-2xl tracking-tight text-on-surface">툰스쿨</span>
</Link>
<nav className="hidden xl:flex items-center space-x-10">
<Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/">툰스쿨</Link>
<Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/ai-content">AI 학습콘텐츠</Link>
<Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/flipped-learning">거꾸로 학습법</Link>
<Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/pwa">PC·태블릿 버전</Link>
<Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/faq">궁금해요</Link>
</nav>
<div className="hidden md:flex items-center space-x-4">
<Link className="bg-[#ff2778] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-pink-600 transition-colors shadow-sm" to="/lms">관리 LMS</Link>
<Link className="bg-[#ff2778] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-pink-600 transition-colors shadow-sm" to="/pricing">이용권 구매</Link>
</div>
<button aria-label="Menu" className="xl:hidden text-on-surface-variant p-2">
<span className="material-symbols-outlined text-3xl">menu</span>
</button>
</div>
</header>
<main className="pt-24 pb-16">
{/* Hero Section */}
<section className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12 justify-center">
<div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
<h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-on-surface">
                    공부하지 말고,<br/>
<span className="text-primary">공부를 만들자.</span>
</h1>
<p className="text-lg text-on-surface-variant max-w-xl mx-auto lg:mx-0">
                    툰스쿨은 초등 교과 단원을 학생이 직접 학습만화로 만드는 AI 수업 플랫폼입니다.<br />단원 선택부터 대본, 6컷 만화, 단원 정리, OX 문제까지 한 번에 완성합니다.
                </p>
<div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
<Link className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-container transition-colors shadow-md text-center" to="/student/select-unit">무료로 시작하기</Link>
<Link className="w-full sm:w-auto bg-white text-primary border-2 border-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors text-center" to="/student/select-unit">툰스쿨 에디터 보기</Link>
</div>
</div>
<div className="w-full lg:w-1/2 flex justify-center">
{/* Tablet Frame Mockup */}
<img alt="ToonSchool Interface" className="w-full h-auto aspect-[16/9] object-cover rounded-[20px] shadow-lg" src="/images/main/main-img-1.png"/>
</div>
</section>
{/* Flow Bar */}
<section className="bg-white border-y border-outline-variant py-8 overflow-x-auto hide-scroll-mobile">
<div className="max-w-7xl mx-auto px-6">
<div className="flex items-center justify-between min-w-[800px] text-center">
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
<span className="font-bold text-sm">단원 선택</span>
</div>
<div className="w-8 h-px bg-gray-300"></div>
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
<span className="font-bold text-sm">내가 만든 학습만화</span>
</div>
<div className="w-8 h-px bg-gray-300"></div>
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">3</div>
<span className="font-bold text-sm">완성한 작품을 공유해요</span>
</div>
<div className="w-8 h-px bg-gray-300"></div>
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">4</div>
<span className="font-bold text-sm">OX 퀴즈</span>
</div>
<div className="w-8 h-px bg-gray-300"></div>
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">5</div>
<span className="font-bold text-sm">책표지 만들기</span>
</div>
<div className="w-8 h-px bg-gray-300"></div>
<div className="flex flex-col items-center gap-2 flex-1">
<div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">6</div>
<span className="font-bold text-sm">친구에게 자랑하기</span>
</div>
</div>
</div>
</section>
{/* Main Content Sections (Zigzag) */}
<div className="space-y-0">
{/* Section 1: Cover */}
<section className="py-24 bg-surface-dim">
<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
<div className="w-full md:w-1/2 flex justify-center">
<img alt="ToonSchool Book Covers" className="w-11/12 h-auto object-contain shadow-sm" src="/images/main/main-img-2.png"/>
</div>
<div className="w-full md:w-1/2 space-y-6">
<span className="text-primary font-bold tracking-wider uppercase text-sm">STEP 1. COVER</span>
<h2 className="text-3xl md:text-4xl font-bold">배움의 시작,<br/>나만의 표지 만들기</h2>
<p className="text-lg text-gray-600">학습할 교과 단원을 선택하고 나만의 표지를 만듭니다. 내가 직접 만드는 교과서로 학습 동기를 부여하세요.</p>
</div>
</div>
</section>
{/* Section 2: 6-cut Toon */}
<section className="py-24 bg-white"><div className="max-w-7xl mx-auto px-6">
<div className="text-center mb-16 space-y-4">
<span className="text-[#2563ff] font-bold tracking-wider uppercase text-sm">STEP 2. CARTOON</span>
<h2 className="text-3xl md:text-4xl font-bold text-gray-900">AI와 함께 내가 만드는 학습 만화</h2>
<p className="text-lg text-gray-600 max-w-2xl mx-auto">배경을 만들고 대사를 내 말투로 바꾸고 수업도구를 더해 나만의 만화를 완성합니다.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{/* Card 1: 배경 생성 */}
<div className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
<div className="aspect-[1/1.4] overflow-hidden rounded-xl bg-white p-4 flex items-center justify-center">
<img alt="배경 생성" className="w-full h-full object-contain" src="/images/main/main-img-3.png"/>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
<Image className="w-6 h-6 text-primary" />
</div>
<div>
<h3 className="font-bold text-xl mb-2">배경 생성</h3>
<p className="text-gray-600 text-sm leading-relaxed">학습 내용을 바탕으로 친근한 화면을 만들어요.</p>
</div>
</div>
</div>
{/* Card 2: 대사 작성 */}
<div className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
<div className="aspect-[1/1.4] overflow-hidden rounded-xl bg-white p-4 flex items-center justify-center">
<img alt="대사 작성" className="w-full h-full object-contain" src="/images/main/main-img-4.png"/>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
<MessageSquare className="w-6 h-6 text-primary" />
</div>
<div>
<h3 className="font-bold text-xl mb-2">대사 작성</h3>
<p className="text-gray-600 text-sm leading-relaxed">대본을 짧은 대사로 바꾸어 자연스럽게 채워요.</p>
</div>
</div>
</div>
{/* Card 3: 수업도구 */}
<div className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
<div className="aspect-[1/1.4] overflow-hidden rounded-xl bg-white p-4 flex items-center justify-center">
<img alt="수업도구" className="w-full h-full object-contain" src="/images/main/main-img-5.png"/>
</div>
<div className="flex items-start gap-4">
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
<PencilLine className="w-6 h-6 text-primary" />
</div>
<div>
<h3 className="font-bold text-xl mb-2">수업도구</h3>
<p className="text-gray-600 text-sm leading-relaxed">캐릭터와 말풍선을 고치고, 내 만화를 더 멋지게 꾸며요.</p>
</div>
</div>
</div>
</div>
</div></section>
{/* Section 3: World Story */}
<section className="py-24 bg-surface-dim">
<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
<div className="w-full md:w-1/2 flex justify-center">
<div className="bg-white rounded-lg shadow-lg w-full max-w-sm aspect-[1/1.4] border border-gray-100 relative overflow-hidden group">
    {worldStoryCards.map((card, index) => (
        <div 
            key={card.id}
            className={`absolute inset-0 p-6 pb-12 flex items-center justify-center transition-all duration-700 ease-in-out ${
                index === currentSlide 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
        >
            <div className="w-full h-full overflow-visible">
                <img alt={card.title} className="w-full h-full object-contain object-center" src={card.image}/>
            </div>
        </div>
    ))}

    {/* Dots Indicator */}
    <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-2 z-10">
        {worldStoryCards.map((card, index) => (
            <button
                key={card.id}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                        ? 'bg-primary w-6' 
                        : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`${index + 1}번째 슬라이드로 이동`}
            />
        ))}
    </div>
</div>
</div>
<div className="w-full md:w-1/2 space-y-6">
<span className="text-green-500 font-bold tracking-wider uppercase text-sm">STEP 3. WORLD STORY</span>
<h2 className="text-3xl md:text-4xl font-bold">세상 속 이야기로<br/>넓히는 배움</h2>
<p className="text-lg text-gray-600">학습한 개념이 실제 세상에서 어떻게 쓰이는지 원리를 이해합니다. 워크시트 형태의 페이지로 생각을 체계화합니다.</p>
</div>
</div>
</section>
{/* Section 4: OX Quiz */}
<section className="py-24 bg-white">
<div className="max-w-7xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center gap-16">
<div className="w-full md:w-1/2 space-y-6">
<span className="text-yellow-500 font-bold tracking-wider uppercase text-sm">STEP 4. OX QUIZ</span>
<h2 className="text-3xl md:text-4xl font-bold">OX 퀴즈로 개념 확인하기</h2>
<p className="text-lg text-gray-600">중요한 개념을 OX 문제로 만들어 봅니다. 문제를 직접 내면서 핵심 내용을 다시 한번 기억에 남깁니다.</p>
</div>
<div className="w-full md:w-1/2 flex justify-center">
<div className="bg-yellow-50 rounded-2xl shadow-lg w-full max-w-md p-8 border border-yellow-100 text-center relative overflow-hidden">
<h3 className="text-xl font-bold mb-8">Q. 태양계에서 가장 큰 행성은 목성이다.</h3>
<div className="flex justify-center gap-6">
<button className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-blue-500 flex items-center justify-center text-blue-500 text-4xl font-bold hover:bg-blue-50 transition-colors">O</button>
<button className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-red-500 flex items-center justify-center text-red-500 text-4xl font-bold hover:bg-red-50 transition-colors">X</button>
</div>
</div>
</div>
</div>
</section>
{/* Section 5: Back Cover */}
<section className="py-24 bg-surface-dim">
<div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
<div className="w-full md:w-1/2 flex justify-center">
<div className="bg-white rounded-lg shadow-lg w-full max-w-sm aspect-[1/1.4] border border-gray-100 flex flex-col justify-end overflow-hidden"><img alt="Back Cover Design" className="w-full h-full object-contain" src="/images/main/main-img-9.png"/></div>
</div>
<div className="w-full md:w-1/2 space-y-6">
<span className="text-purple-500 font-bold tracking-wider uppercase text-sm">STEP 5. BACK COVER</span>
<h2 className="text-3xl md:text-4xl font-bold">책의 마지막,<br/>뒤표지 꾸미기</h2>
<p className="text-lg text-gray-600">책의 마지막을 장식합니다. 지은이 이름과 발행 학년을 적어 나만의 학습 만화책을 완성하는 뿌듯함을 느낍니다.</p>
</div>
</div>
</section>
{/* Section 6: Sharing */}
<section className="py-24 bg-white overflow-hidden">
<div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
{/* Left Content */}
<div className="w-full lg:w-1/2 space-y-8">
<div className="space-y-4">
<span className="text-gray-500 font-bold tracking-wider uppercase text-sm">STEP 6. SHARE</span>
<h2 className="text-3xl md:text-4xl font-bold leading-tight">
          완성한 작품을 전용뷰어로 보고<br/>친구에게 자랑해요
        </h2>
<p className="text-lg text-gray-600 leading-relaxed">
          완성한 학습만화를 툰스쿨 전용뷰어로 넘겨 보고,<br/>링크 하나로 친구나 가족에게 쉽게 공유할 수 있어요.
        </p>
</div>
{/* Function Badges */}
<div className="flex flex-wrap gap-3">
<span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">전용뷰어 감상</span>
<span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">링크 공유</span>
<span className="px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">PDF 다운로드</span>
</div>
</div>
{/* Right Content (Visual Area) */}
<div className="w-full lg:w-1/2 relative">
{/* Tablet Mockup */}
<div className="relative z-10 bg-gray-900 p-3 rounded-[2.5rem] shadow-2xl border-4 border-gray-800">
<div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[4/3] relative">
{/* Viewer UI */}
<div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-white/90 border-b border-gray-100 z-20">
<span className="font-bold text-sm">나만의 우주 탐험</span>
<div className="flex gap-2">
<button className="p-1 rounded hover:bg-gray-100"><span className="material-symbols-outlined text-lg">zoom_in</span></button>
<button className="p-1 rounded hover:bg-gray-100"><span className="material-symbols-outlined text-lg">download</span></button>
</div>
</div>
{/* Comic Preview */}
<div className="w-full h-full pt-12 pb-16 px-8 flex items-center justify-center bg-gray-50">
<img alt="Comic Preview" className="h-full w-auto shadow-lg rounded-sm" src="/images/main/main-img-10.png"/>
</div>
{/* Viewer Controls */}
<div className="absolute bottom-0 left-0 w-full p-4 flex justify-between items-center bg-white/90 border-t border-gray-100 z-20">
<button className="flex items-center gap-1 text-primary font-bold text-xs">
<span className="material-symbols-outlined text-sm">share</span> 친구에게 공유
            </button>
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-gray-400">chevron_left</button>
<span className="text-xs font-medium text-gray-600">1 / 12</span>
<button className="material-symbols-outlined text-gray-400">chevron_right</button>
</div>
<button className="flex items-center gap-1 text-blue-600 font-bold text-xs">
<span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF 저장            </button>
</div>
</div>
</div>
{/* Character: Doyun (Boy) */}
<div className="absolute -left-12 -bottom-8 z-20 w-40 md:w-48">
<div className="relative">
<div className="absolute -top-12 left-0 bg-white p-3 rounded-2xl shadow-md border border-gray-100 text-xs font-bold whitespace-nowrap">
            내 만화책을 친구에게 보낼 수 있어!
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
</div>
<div className="w-full aspect-square overflow-hidden">
<img alt="Doyun" className="w-full h-full object-contain scale-150 translate-y-4" src="/images/main/main-img-11.png"/>
</div>
</div>
</div>
{/* Character: Seoa (Girl) */}
<div className="absolute -right-8 -top-8 z-20 w-32 md:w-40">
<div className="relative">
<div className="absolute -top-12 right-0 bg-white p-3 rounded-2xl shadow-md border border-gray-100 text-xs font-bold whitespace-nowrap">
            링크를 누르면 바로 볼 수 있어!
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"></div>
</div>
<div className="w-full aspect-square overflow-hidden">
<img alt="Seoa" className="w-full h-full object-contain scale-125" src="/images/main/main-img-12.png"/>
</div>
</div>
</div>
{/* Decorative Background Elements */}
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full -z-10 blur-3xl"></div>
</div>
</div>
</section>
</div>

</main>
{/* Footer */}
<footer className="w-full px-6 py-12 flex flex-col items-center text-center space-y-6 bg-surface-dim border-t border-outline-variant">
<div className="flex items-center gap-2 mb-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
<div className="w-6 h-6 bg-gray-400 text-white flex items-center justify-center font-bold rounded text-xs">TS</div>
<span className="font-title-md font-bold text-gray-500">ToonSchool</span>
</div>
<p className="text-gray-500 font-medium text-sm">공부하지 말고, 공부를 만들자.</p>
<div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
<Link className="hover:text-primary transition-colors" to="/">홈</Link>
<Link className="hover:text-primary transition-colors" to="/about">툰스쿨이란</Link>
<Link className="hover:text-primary transition-colors" to="/student/select-unit">툰스쿨 에디터</Link>
<Link className="hover:text-primary transition-colors" to="/classroom">수업 활용</Link>
<Link className="hover:text-primary transition-colors" to="/flipped-learning">거꾸로 학습법</Link>
<Link className="hover:text-primary transition-colors" to="/share">공유 링크</Link>
<Link className="hover:text-primary transition-colors" to="/pricing">요금제</Link>
<Link className="hover:text-primary transition-colors" to="/contact">고객센터</Link>
</div>
<p className="text-sm text-gray-400 mt-4">© 2024 ToonSchool. All rights reserved.</p>
</footer>

        </div>
    );
}
