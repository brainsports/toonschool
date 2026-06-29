import { Link } from 'react-router-dom';

export default function LMSPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">관리 LMS</h1>
            <p className="text-xl text-on-surface-variant mb-12">
                학생 추가, 학습현황, 평가서를 한눈에 관리합니다.
            </p>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
