import { Link } from 'react-router-dom';

export default function AIContentPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">AI 학습콘텐츠</h1>
            <p className="text-xl text-on-surface-variant mb-12">
                AI로 단원 선택부터 학습만화, 단원정리까지 완성해요.
            </p>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
