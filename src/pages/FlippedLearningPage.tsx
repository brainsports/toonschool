import { Link } from 'react-router-dom';

export default function FlippedLearningPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">거꾸로 학습법</h1>
            <p className="text-xl text-on-surface-variant mb-12">
                먼저 만들고, 설명하며, 배움을 내 것으로 만드는 수업 방식입니다.
            </p>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
