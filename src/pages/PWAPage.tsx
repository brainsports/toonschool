import { Link } from 'react-router-dom';

export default function PWAPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">PC·태블릿 버전</h1>
            <p className="text-xl text-on-surface-variant mb-8 max-w-2xl">
                PC와 태블릿에서 툰스쿨을 앱처럼 설치해 사용할 수 있습니다.
            </p>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left max-w-lg space-y-4 mb-12 border border-gray-100">
                <p className="text-lg text-gray-700 font-medium">✨ 윈도우 PC는 Chrome 또는 Edge에서 설치할 수 있어요.</p>
                <p className="text-lg text-gray-700 font-medium">✨ 갤럭시탭은 Chrome에서 홈 화면에 추가해 사용할 수 있어요.</p>
                <p className="text-lg text-gray-700 font-medium">✨ 아이패드는 Safari에서 공유 버튼을 누른 뒤 '홈 화면에 추가'를 선택해 주세요.</p>
                <p className="text-lg text-primary font-bold pt-4 border-t border-gray-100 mt-4">설치하면 툰스쿨을 앱처럼 바로 실행할 수 있어요.</p>
            </div>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
