import { Link } from 'react-router-dom';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">이용권 구매</h1>
            <p className="text-xl text-on-surface-variant mb-12">
                교사와 기관을 위한 이용권을 준비하고 있습니다.
            </p>
            <Link to="/" className="text-primary font-bold hover:underline">
                메인으로 돌아가기
            </Link>
        </div>
    );
}
