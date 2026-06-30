import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FlippedLearningPage() {
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
                        <Link className="text-primary text-lg font-bold transition-colors border-b-2 border-primary" to="/flipped-learning">거꾸로 학습법</Link>
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

            <main className="pt-20 md:pt-24">
                {/* Hero Section */}
                <section className="py-12 md:py-24 bg-white relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="md:w-5/12 flex flex-col gap-6 z-20">
                            <span className="text-[#ff2778] font-bold text-xl tracking-wide">거꾸로 학습법</span>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface leading-tight">
                                공부를 듣지 말고,<br />
                                <span className="text-[#ff2778]">만들게 하자</span>
                            </h1>
                            <p className="text-lg text-on-surface-variant leading-relaxed">
                                먼저 보고, 내 말로 설명하고,<br />
                                함께 확인하면 배움이 내 것이 됩니다.
                            </p>
                            <div className="flex gap-4 mt-6">
                                <button className="bg-[#ff2778] text-white px-8 py-3.5 rounded-full font-bold hover:bg-opacity-90 transition-colors shadow-md hover:-translate-y-1 transform text-lg">설명 챌린지</button>
                                <button className="border-2 border-[#ff2778] text-[#ff2778] bg-white px-8 py-3.5 rounded-full font-bold hover:bg-surface transition-colors shadow-sm hover:-translate-y-1 transform text-lg">한 컷 미리보기</button>
                            </div>
                        </div>
                        <div className="md:w-7/12 relative min-h-[500px]">
                            <img className="w-full h-auto object-contain absolute right-[-5%] top-1/2 -translate-y-1/2 scale-110" alt="Hero Illustration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNX0nJguwhw1T5-kFbs5SictKDBE5Pe6brV946z6DESztCnagexdm8I-h4Mt-rKUqhadPIhis0Pw3rhuajkztqxRxaNhV0LHDBIQSnof001w4bb46Qh4Hl_QU_9as49jVAUe7_HKMVwQJxN2Qbhb2BbctkUxF6IOH-kkP1h1c7UQeXkp9uehvfOfqF8dlmdnNOTRfDSlBL2YJgnNG557VA87OniA3uTg6t_0ZpTNMwIZNUIERLI12VVSJjXBRxHUT6Cdmc662SlhA" />
                        </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-10 left-[10%] text-yellow-500 text-3xl">★</div>
                    <div className="absolute top-20 right-[5%] text-[#ff2778] text-2xl">✦</div>
                    <div className="absolute bottom-10 left-[50%] text-blue-400 text-3xl">✦</div>
                    <div className="absolute top-32 left-[40%] text-[#ff2778] opacity-50 text-xl">♥</div>
                </section>

                {/* Second Section (Main Tool) - 거꾸로 5단계 학습법 */}
                <section className="py-24 bg-blue-50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-16">거꾸로 5단계 학습법</h2>
                        <div className="relative w-full mx-auto flex flex-col md:flex-row justify-between items-stretch gap-4 md:gap-2">
                            {/* Step 1 */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col items-center flex-1 border border-blue-100 min-w-0">
                                <div className="bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-full mb-4 flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 먼저 보기
                                </div>
                                <img className="w-24 h-24 object-contain mb-4" alt="Step 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPNOIeIscbu4_Ki6hmVAhKM-0P7u-lqSslVEW99KBbcfljUiO29NKYeyYw1gWqe5HiUaipYM9YTaxTw-C-EOce3OcT0IC6-_t3XXAGAkIPXK215LAsDX5IHMUwQZze_DPpRWvMDcihG1CX7wFWlvpIuT6yrQgPbmSr2cqg787BqKfzdlUb2bceQq0MEMdJXv4WZ_TDGztC3u_ilo2stqWUV4voROF9UHAor8Bf2cRQJ5Zs6lLMlzPctOBgLzdi44mL9oDg4SaBLDwhHQ" />
                                <p className="text-sm font-medium text-on-surface-variant text-center">개념을 보고<br />핵심을 이해해요.</p>
                            </div>
                            <ArrowRight className="hidden md:block text-[#7db5ff] shrink-0 self-center" size={20} strokeWidth={2.5} />
                            {/* Step 2 */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col items-center flex-1 border border-blue-100 min-w-0">
                                <div className="bg-pink-100 text-[#ff2778] font-bold px-3 py-1.5 rounded-full mb-4 flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="bg-[#ff2778] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 설명하기
                                </div>
                                <img className="w-24 h-24 object-contain mb-4" alt="Step 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnXseZ0dLfBwXi-Ff1J0-3IFlhxCckz5QCL8PD3FeXRarRRfPLAQJPfPptw8rvk9fXVviYT5dH53j9FPSzp65LEecee1HLt5GUdss90AK8R5lnxQAijb8Sf8_hJ4lT1RvfF4zY9EwbMl-J6VknpE2EJ40wDBipnTP32xhKXDoCMWJLmOw6lAL9rKbPiYhkHOKs4w4cpqh9jizeY95GrNr1Xs0MZ9cjFJJRBTujHuBlL5j5pJQbzJzqVFt4T2SxlAn5ornZnDeaL_eNBg" />
                                <p className="text-sm font-medium text-on-surface-variant text-center">내 말로 설명하며<br />생각을 꺼내요.</p>
                            </div>
                            <ArrowRight className="hidden md:block text-[#7db5ff] shrink-0 self-center" size={20} strokeWidth={2.5} />
                            {/* Step 3 */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col items-center flex-1 border border-blue-100 min-w-0">
                                <div className="bg-yellow-100 text-yellow-600 font-bold px-3 py-1.5 rounded-full mb-4 flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> 함께 확인
                                </div>
                                <img className="w-24 h-24 object-contain mb-4" alt="Step 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA84WMPayKdLeXDyw1hP9W8aDW2UP2v2nVtnzdzV7MADtXDCUSxOTQFMcCpOK6ePdBc6JnGODPVxu1ldCSVtpEt2sWXMUvX23G-mWINH_B56tQkvHyylObRlUYnx_O48ipN9YWgA8V0-T7T9IsQLbcBqt0WqvO6flEwavQss2TK4_FN-dM3ZDNLfHzUU0N0EUNO_sqi2phM1ir0WhKl5NyasnMytMOFVAa9x4CO7_A_E_HGOgRHE6RB02bstixF4FpRISfREnn2JtoBig" />
                                <p className="text-sm font-medium text-on-surface-variant text-center">친구와 비교하며<br />이해를 넓혀요.</p>
                            </div>
                            <ArrowRight className="hidden md:block text-[#7db5ff] shrink-0 self-center" size={20} strokeWidth={2.5} />
                            {/* Step 4 */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col items-center flex-1 border border-blue-100 min-w-0">
                                <div className="bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-full mb-4 flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span> 다시 정리
                                </div>
                                <img className="w-24 h-24 object-contain mb-4" alt="Step 4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVu4V2T6YjoXypCdYtO0HOSFRYH3O8O8VJRc5ajoZf1RAl60mngBiDm2Gp5Ymh9_ZMk2ygTNBRYW4Oarkpr4JE9gdhkjIn5_RTOOP7kXJc8lxgs73cL8EhEMvQvfakekKNPqME5YdlDTltT5YoniJ49V-1W-mr5In5cBkxDVNwyKMNa_JwYiwCKyUWe3XLPtQ9VTMIY95pp9-Agd0xE3jNjermWQfYmIuFWuHluQVkVVhUrsd9GrHGm45BCs6JeqVKrf-S8YRTv3VGyg" />
                                <p className="text-sm font-medium text-on-surface-variant text-center">다시 정리하며<br />배움을 단단히 해요.</p>
                            </div>
                            <ArrowRight className="hidden md:block text-[#7db5ff] shrink-0 self-center" size={20} strokeWidth={2.5} />
                            {/* Step 5 */}
                            <div className="bg-white p-4 rounded-3xl shadow-md flex flex-col items-center flex-1 border border-blue-100 min-w-0">
                                <div className="bg-purple-100 text-purple-600 font-bold px-3 py-1.5 rounded-full mb-4 flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span> 체크 퀘스트
                                </div>
                                <img className="w-24 h-24 object-contain mb-4" alt="Step 5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZqtkZkTg4EMy3dUUVEMw-ew33o0r5t_3zJ5hq3uCH3ELyjdrb_QCsEOPFchBWgisUICsafq6_SMiTDQnT8kvktiwqBuI2UGQtvI_I6-H2QR1jgyEc-bpv1-QNHZVRCmc-aglnU6bljlxA4Hm10cOJqZFUW--X99lwk5KooXrlxjNmRQNCaXDgnLtCvd0a9gRpXhfIc7pxDtbFBrHVarrtQAgqNGCCYtx2c3g8lyjKVQdadljmc96FQgib59gSOBNGTEdVERgTBmkFJw" />
                                <p className="text-sm font-medium text-on-surface-variant text-center">퀴즈와 미션으로<br />스스로 확인해요.</p>
                            </div>
                        </div>
                    </div>
                    {/* Decos */}
                    <div className="absolute top-20 left-[10%] text-blue-400 text-4xl">★</div>
                    <div className="absolute bottom-20 right-[10%] text-blue-400 text-3xl">★</div>
                </section>

                {/* Third Section - 툰스쿨에서는 이렇게 배워요 */}
                <section className="py-24 bg-green-50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-16">툰스쿨에서는 이렇게 배워요</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            {/* Card 1 */}
                            <div className="bg-white p-6 rounded-3xl shadow-md border border-green-100 flex flex-col items-center w-full">
                                <h3 className="text-green-600 font-bold text-xl mb-4">개념툰</h3>
                                <img className="w-full h-auto rounded-xl mb-4" alt="Concept Toon" src="https://lh3.googleusercontent.com/aida-public/AB6AXuClWUt3FD-3JoGYZmhCi3_mvgEb60NQ-2dMpg-2U8jwvdilmFbzprPFNrGyLRycIVgWxpqthgtRaNPi_I9mWSIYirU0fcvj4F9gzWeZKIzSAtdvlC6hDzWH1WIAOQAOs-dLrQD3aD8fVyawX4CwH8kIO8or43u3ck1cSYe3Jh8eL3TIwIraPb1PhjUCPhfE5QSY0E-rgvPe2759JzikqIC2f1Z7xByFlwn-Fwoay15_ZOIsE7zam6SLokU0addxqXeTlVfKfFGQKdn6HQ" />
                                <p className="text-on-surface-variant font-medium">재미있는 만화로<br />개념을 쉽게 이해해요.</p>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-white p-6 rounded-3xl shadow-md border border-green-100 flex flex-col items-center w-full">
                                <h3 className="text-green-600 font-bold text-xl mb-4">말풍선 미션</h3>
                                <img className="w-full h-auto rounded-xl mb-4" alt="Speech Bubble Mission" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDT__18IACXXpxTSzTozVvQp0hHraMo2k0bE_4NsPPnqvfWJ3BoprFbqNU_0zzeOtH6QIPbFRvfsbZ0eNqtccoR_yGgJ4gvwZyOQCtVlWn291xuZ6PiPXvqbHeNhNho5gIeJeQZUqHTCLIuvxQGbpQaV7BW5L3N-3wcSzEsBYB0NiyYhBZcg9y1CV2wzVkAXxWqsU9GKjULf_7gOEH43ChQb9bZAvjMzhmSOksH7dDnb9DlHMbFbgWtpFCQUfQi9_8mr3pL7ZFGp-aNKA" />
                                <p className="text-on-surface-variant font-medium">말풍선에 내 생각을 적고<br />자신 있게 말해요.</p>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-white p-6 rounded-3xl shadow-md border border-green-100 flex flex-col items-center w-full">
                                <h3 className="text-green-600 font-bold text-xl mb-4">짝토론 카드</h3>
                                <img className="w-full h-auto rounded-xl mb-4" alt="Debate Card" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0sMBgIgkTrYI_15A5zqFbDZjZ_vOQaogC161OrVuyXfihcEDwnQJz38kr_qsKRW2E4c_IDXeFk-A1VhEzBB348rDRqdGl2jJDKeXzDvwNanmRCvpOpQKf7__HtEMY6Ka2C4DTb9zipXkAOlDBHuQHZxUXC7ZdkPzp3ZY_UzVfwy9oYwl13wyalnO06nlTQcfaX3ZFMfdQyqxs4ObONy1bwbvSYzFrFP-rHLSh1b-jNAa7TpH9fgYoguwKR9-BX3UOY0-ARrOQFofsMQ" />
                                <p className="text-on-surface-variant font-medium">친구의 생각을 듣고<br />내 생각을 정리해요.</p>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-white p-6 rounded-3xl shadow-md border border-green-100 flex flex-col items-center w-full">
                                <h3 className="text-green-600 font-bold text-xl mb-4">OX 확인</h3>
                                <img className="w-full h-auto rounded-xl mb-4" alt="OX Check" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeUCCI_adOLlDihYqtDG9y1hx8XUq94FeGWMtXyKSBPDQKJ2YRJwNPxabFs9ZzRDTr75fJnVbRRQByuINgQONYGmGmYKR8vW7Blq5FpNCFEN0jDEJpgvA6J4Vr_BchWNovxHeU1xTkRyk1dyCnp1jBvKxOjb3Y8nt_mhOaBQ-3RT-t1jYcBUNSd907hq3BczTI4uxWS3Q8jQbLOOm1axbPA0ZetMN5ftBv0mRmD0HHCv0eRfo5Vhy1SFlTydqp3ZhQa62qS4P4nvBBSA" />
                                <p className="text-on-surface-variant font-medium">OX 퀴즈로<br />이해를 바로 확인해요.</p>
                            </div>
                        </div>
                    </div>
                    {/* Decos */}
                    <div className="absolute top-10 right-[10%] text-green-300 text-5xl">★</div>
                </section>

                {/* Additional Effects Section - 아는지 모르는지 스스로 보입니다 */}
                <section className="py-24 bg-orange-50 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="md:w-2/3 flex flex-col items-center md:items-start text-center md:text-left w-full">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-12 self-center">아는지 모르는지 스스로 보입니다</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-2">
                                {/* Card 1 */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 flex flex-col items-center text-center w-full">
                                    <img className="w-32 h-32 object-contain mb-4" alt="Self-explanation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPG6lxBR9x090dQ-7kyXeKSOEAFFJarln6ahJOp5MYvog7pjDoV7Q_gFxt7TsB3zBHaDMRUZNHiTnL0YnnOEwkudf_lGi29X1RplfodFtg-sB4uqaUOqWGAcliVZsOGYlwNuoZ8fTk_d8r0VL-decpwv3BwUbNRVPIlZkT4_AIXNna3GuE1K3GCzPbk82EBe8ScEMBoCeABnuq8982vkNF_UZ40SOgqOxwLROaIWpfpZ0pnfeYL2MN60KdLmjKb0_mGCf3EqLyobz-gw" />
                                    <h3 className="text-[#ff2778] font-bold text-lg mb-2">자기설명</h3>
                                    <p className="text-on-surface-variant font-medium text-sm">설명하며 스스로 이해도를<br />확인해요.</p>
                                </div>
                                {/* Card 2 */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 flex flex-col items-center text-center w-full">
                                    <img className="w-32 h-32 object-contain mb-4" alt="Metacognition" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAt4l1-qF16NgIu_JGUOgUedDvmyMT-313XflKinEBH53nHDzTVZJmP6NFZo38INxoQMeBQYey5c_9sj6CQBvxrsT3Mf2JmSYjhQeudkMc3FGq9tdOsxjRs2r6IY-eTp0oglcfOHnnm22MKQUgPcpBuWlWNCHOc3wtmbgJcMymCthkLRmOsjuIcykMPQxjl8bry9ehE9x65yE6Z30lKqS_J1R6hfbbATMDGZ7W2yj8-DTQ2DwAHYUA2R7DOCE1jg0TYwVvlFoGJvkyJJw" />
                                    <h3 className="text-[#ff2778] font-bold text-lg mb-2">메타인지</h3>
                                    <p className="text-on-surface-variant font-medium text-sm">내가 아는 것과 모르는 것을<br />구분하는 힘이 커져요.</p>
                                </div>
                                {/* Card 3 */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 flex flex-col items-center text-center w-full">
                                    <img className="w-32 h-32 object-contain mb-4" alt="Memory Check" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW4hNJmISlYF26gX8V3bT-AIVUiW8MS0W0GJKvdsyW6t4PqbpI7n0YYWywZbWqksDTgjqZhQBZDD9CrxzCr8ceBJI_lfCv1n1l97bl-NUY3w3eY0l_c62k7cGt-RRthIg8cWGpbctv8H9bSS1kc_6AfBNA5O6I_G7YYvxDt3VZMmoD6aeFjhPyiI6qmm7rFVO0vrZSrsZJX8RydO3iJccrV2ujxXIJHVknhDdEkC70ELjXvOIlD6YuvOwX7S14DEQWCTiU-dJ-z-vS8g" />
                                    <h3 className="text-[#ff2778] font-bold text-lg mb-2">기억 확인</h3>
                                    <p className="text-on-surface-variant font-medium text-sm">퀴즈와 복습으로<br />기억이 오래 남아요.</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/3 flex justify-center relative">
                            <img className="w-full max-w-sm object-contain" alt="Happy student character" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUa9JmLpVrgCljHtXapg5IGxC2Skj_q9dOKKIo6y-kcw409Ae4Rd0P0ZzlCUFOLWTVqpjB4KXi8n0MLSIvXqZs9o2F8Gr6Eo1J0dlbGzWdduKLFQC9R_vIgSC5g46MeO2-3YzyrbY7K-oqtwTkISpyETTTrwUQhYqN0RpY4Vlc0tzNVkTkOwLdduuSUKp8MUI9iB4-BfFdg5zkrwWAqnzgRk8a4K7aSWBHAueurIxhImOyXQSR2pOyxhk-bH6pNchevACP81NYmNzpVw" />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="bg-white rounded-[2rem] shadow-xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border border-surface-variant/50 relative overflow-hidden">
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-[#ff2778] font-bold text-3xl shrink-0">TS</div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3 leading-tight">AI와 함께 만드는 <span className="text-[#ff2778]">초등 거꾸로 학습</span></h2>
                                    <p className="text-lg text-on-surface-variant">지금 바로 시작하고, 설명할 수 있는 배움을 경험해 보세요!</p>
                                </div>
                            </div>
                            <button className="bg-[#ff2778] text-white px-10 py-5 rounded-full font-bold hover:bg-opacity-90 transition-colors shadow-lg hover:-translate-y-1 transform flex items-center gap-2 text-lg whitespace-nowrap relative z-10">
                                무료로 시작하기
                                <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
                            </button>
                        </div>
                    </div>
                    {/* Decos */}
                    <div className="absolute bottom-10 right-[15%] text-yellow-500 text-5xl z-0">★</div>
                </section>
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
