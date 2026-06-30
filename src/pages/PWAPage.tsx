import { Link } from 'react-router-dom';
import { Monitor, Smartphone, Tablet } from 'lucide-react'; // 아이콘 활용

export default function PWAPage() {
    return (
        <div className="min-h-screen bg-surface-dim font-body-md text-on-surface">
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
                        <Link className="text-primary text-lg font-bold hover:text-primary transition-colors" to="/pwa">PC·태블릿 버전</Link>
                        <Link className="text-on-surface text-lg font-bold hover:text-primary transition-colors" to="/faq">궁금해요</Link>
                    </nav>
                    <div className="hidden md:flex items-center space-x-4">
                        <button 
                            className="bg-[#ff2778] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-pink-600 transition-colors shadow-sm" 
                            onClick={(e) => {
                                e.preventDefault();
                                alert('선생님 관리 기능은 준비 중입니다.');
                            }}
                        >
                            관리 LMS
                        </button>
                        <Link className="bg-[#ff2778] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-pink-600 transition-colors shadow-sm" to="/pricing">이용권 구매</Link>
                    </div>
                    <button aria-label="Menu" className="xl:hidden text-on-surface-variant p-2">
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center">
                <h1 className="text-4xl font-extrabold mb-4 text-on-surface">PC·태블릿 버전</h1>
                <p className="text-lg text-on-surface-variant mb-12">
                    PC와 태블릿에서 툰스쿨을 앱처럼 설치해 사용할 수 있습니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                    {/* 윈도우 PC 카드 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                            <Monitor size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-3">윈도우 PC</h2>
                        <p className="text-gray-600">
                            Chrome 또는 Edge에서<br />
                            주소창 오른쪽 <span className="font-bold">설치 아이콘</span>을<br />
                            눌러 설치해 주세요.
                        </p>
                    </div>

                    {/* 갤럭시탭 카드 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <Smartphone size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-3">갤럭시탭</h2>
                        <p className="text-gray-600">
                            Chrome에서 메뉴(⋮)를 누른 뒤<br />
                            <span className="font-bold">'홈 화면에 추가'</span>를<br />
                            선택해 주세요.
                        </p>
                    </div>

                    {/* 아이패드 카드 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mb-6">
                            <Tablet size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-3">아이패드</h2>
                        <p className="text-gray-600">
                            Safari에서 공유 버튼을 누른 뒤<br />
                            <span className="font-bold">'홈 화면에 추가'</span>를<br />
                            선택해 주세요.
                        </p>
                    </div>
                </div>

                <div className="bg-primary/10 text-primary px-8 py-4 rounded-xl font-bold text-lg mb-12">
                    ✨ 설치하면 툰스쿨을 앱처럼 바로 실행할 수 있어요.
                </div>

                <Link 
                    to="/" 
                    className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-pink-600 transition-colors shadow-sm"
                >
                    메인으로 돌아가기
                </Link>
            </main>
        </div>
    );
}
