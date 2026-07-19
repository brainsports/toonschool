import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function PublicLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen]);

    const getLinkClass = (path: string) => {
        const baseClass = "text-lg font-bold transition-colors";
        if (location.pathname === path) {
            return `${baseClass} text-primary border-b-2 border-primary`;
        }
        return `${baseClass} text-on-surface hover:text-primary`;
    };

    return (
        <div className="min-h-screen flex flex-col text-on-surface smooth-scroll font-body-md overflow-x-hidden bg-surface-dim">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 h-20 md:h-24">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-full grid grid-cols-[auto_1fr_auto] items-center relative">
                    <Link to="/" className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-primary text-white flex items-center justify-center font-bold rounded-lg text-lg">TS</div>
                        <span className="hidden sm:inline font-title-md font-extrabold text-2xl tracking-tight text-on-surface">툰스쿨</span>
                    </Link>
                    <nav className="hidden xl:flex justify-center items-center space-x-10 w-full">
                        <Link className={getLinkClass("/")} to="/">툰스쿨</Link>
                        <Link className={getLinkClass("/ai-content")} to="/ai-content">툰마인드</Link>
                        <Link className={getLinkClass("/flipped-learning")} to="/flipped-learning">거꾸로 학습법</Link>
                        <Link className={getLinkClass("/pwa")} to="/pwa">PC·태블릿 버전</Link>
                        <Link className={getLinkClass("/faq")} to="/faq">궁금해요</Link>
                    </nav>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
                        <Link
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-sm shadow-cyan-500/25 transition-all hover:bg-cyan-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 active:bg-cyan-700 md:min-h-12 md:px-7 md:text-lg whitespace-nowrap"
                            to="/login?mode=student&redirect=/student/mypage"
                            aria-label="학생 로그인"
                            title="학생 전용 로그인"
                        >
                            학생툰
                        </Link>
                        <Link
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 active:bg-slate-950 md:min-h-12 md:px-7 md:text-lg whitespace-nowrap"
                            to="/login?mode=admin&redirect=/admin/lms/classes"
                            aria-label="선생님 및 관리자 로그인"
                            title="선생님기관관리자중간관리자슈퍼관리자 로그인"
                        >
                            관리 LMS
                        </Link>
                        <button 
                            aria-label="메뉴 열기"
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                            className="xl:hidden flex items-center justify-center text-on-surface-variant p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <span className="material-symbols-outlined text-3xl" aria-hidden="true">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                            <span className="sr-only">{isMobileMenuOpen ? '메뉴 닫기' : '메뉴'}</span>
                        </button>
                    </div>

                    {/* Mobile Menu Backdrop */}
                    {isMobileMenuOpen && (
                        <div 
                            className="xl:hidden fixed inset-0 top-20 md:top-24 z-40 bg-black/20"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <nav 
                            id="mobile-menu"
                            className="xl:hidden absolute top-full left-0 w-full bg-white shadow-lg border-b border-gray-100 flex flex-col z-50"
                        >
                            <Link onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 text-on-surface font-bold text-lg hover:bg-gray-50 border-b border-gray-50" to="/">툰스쿨</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 text-on-surface font-bold text-lg hover:bg-gray-50 border-b border-gray-50" to="/ai-content">툰마인드</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 text-on-surface font-bold text-lg hover:bg-gray-50 border-b border-gray-50" to="/flipped-learning">거꾸로 학습법</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 text-on-surface font-bold text-lg hover:bg-gray-50 border-b border-gray-50" to="/pwa">PC·태블릿 버전</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 text-on-surface font-bold text-lg hover:bg-gray-50" to="/faq">궁금해요</Link>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full relative z-10">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="w-full px-6 py-12 flex flex-col items-center text-center space-y-6 bg-surface-dim border-t border-outline-variant mt-auto relative z-20">
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
