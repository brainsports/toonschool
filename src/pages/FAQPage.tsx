import { Link } from 'react-router-dom';

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">궁금해요</h1>
            <p className="text-xl text-on-surface-variant mb-12">
                자주 묻는 질문을 확인하세요.
            </p>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
