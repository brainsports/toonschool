import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AIContentPage() {
    const [sec2Tab, setSec2Tab] = useState('step1');
    const [sec3Tab, setSec3Tab] = useState('comic');
    const [sec4Tab, setSec4Tab] = useState('share');

    return (
            <main className="pt-20 md:pt-24 w-full mx-auto flex flex-col">
                {/* Section 1: Hero */}
                <section className="py-24 bg-surface-dim overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6 z-10">
                            <span className="text-primary font-bold tracking-wider uppercase text-sm">AI 학습콘텐츠</span>
                            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-on-surface">
                                교과서가<br/><span className="text-primary">AI 학습툰 제작실</span>이 됩니다.
                            </h1>
                            <p className="text-lg text-on-surface-variant max-w-xl">
                                단원을 고르면 AI가 주제, 대본, 만화, 단원정리까지 이어지는 학습 흐름을 함께 만들어 줍니다.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="px-4 py-1.5 bg-pink-50 text-primary text-sm font-bold rounded-full border border-pink-100">교과 단원 기반</span>
                                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-full border border-blue-100">6컷 학습만화</span>
                                <span className="px-4 py-1.5 bg-green-50 text-green-700 text-sm font-bold rounded-full border border-green-100">단원정리·OX 퀴즈</span>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-6">
                                <Link to="/student/select-unit" className="px-8 py-4 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-600 transition-all shadow-md">
                                    AI 학습콘텐츠 시작하기
                                </Link>
                                <button className="px-8 py-4 rounded-full border-2 border-primary text-primary font-bold text-lg hover:bg-pink-50 transition-all shadow-md">
                                    제작 흐름 보기
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full flex justify-center relative z-10">
                            <div className="relative w-full max-w-2xl h-[450px] flex items-center justify-center">
                                <div className="absolute left-0 top-1/4 w-32 h-40 bg-white rounded-xl shadow-md border border-gray-100 p-4 transform -rotate-12 z-20 flex flex-col items-center justify-center gap-2">
                                    <span className="text-4xl">📖</span>
                                    <span className="text-xs font-bold text-gray-400">교과서</span>
                                </div>
                                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg border-4 border-gray-800 p-6 z-30 aspect-[4/3] flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                                        <span className="text-xs font-bold text-gray-400">STUDIO MODE</span>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 flex-grow">
                                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-300">
                                            <span className="material-symbols-outlined text-primary">list_alt</span>
                                            <span className="text-xs font-bold">단원 선택</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-300">
                                            <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                            <span className="text-xs font-bold">주제 추천</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-300">
                                            <span className="material-symbols-outlined text-primary">auto_stories</span>
                                            <span className="text-xs font-bold">6컷 만화</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-dashed border-gray-300">
                                            <span className="material-symbols-outlined text-primary">quiz</span>
                                            <span className="text-xs font-bold">OX 퀴즈</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="w-3/4 h-full bg-primary"></div>
                                    </div>
                                </div>
                                <img alt="Hana" className="absolute -left-12 bottom-0 h-48 object-contain z-40 transform -scale-x-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBifwpuxuf5E1sYy7O9nKhO4c4M1MlVabyIzmigBKpkKm2qoZ_Qx6GVbQEFdo58OebZP_c-tbNT5w0k3WN1Rbsgq01bEAnZR4FIe6BR3DmOT9BKJH65W2zPVlOu_atcFhary0onxMd24N6cfVv30KaBQxSx1IlMBWAs6n9hhXqOjrqKzzmS1QKhKV9k-0cYhZG-0jXwGYdewe2BZqDZOvsjKVO22txj2lzwW3VX0lfyxjk6VKNP3aotOi4HrxPms9yLrOs6bx99UZk" />
                                <img alt="Doyun" className="absolute -right-8 bottom-4 h-40 object-contain z-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH8l9rquf-KMOFxli984CKo5rg86eDoBzkJbrz7LG0Ax2mLXIz5I1TqXdjs3e6gAZO_dS0CKKoERzH4W8AE3E_Iw5mwjhicmB3l67OGkvCsA4h7URJEVvDHSjK62lMwnA6RRdwQa5gpXi00ZQGFkbpSbpe1E2ciTbxfXcxV6Q45RQacHxXSsoP3S4YWuFmOOO08dRqzYrate9Wel7Ht7CTRv9t721T-QoZiZjyuj03py-XifE5X8GBacXEjPaLBl3MdWLRzZzYPRQ" />
                                <img alt="Seoa" className="absolute right-12 -bottom-4 h-32 object-contain z-40" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfVtlEyxhwmuHFpxMp1-ZDra0uHmxOScYj_-L3rkOoT1rZmapS9VJszlInkbAhWttIbqamE-Hnrj00J0tnAuBBHE_4m8YI_WMqMbjO0T6lFm46ZnjwJ9_O-3oRrsWLCtP-GqdLZpY8fJYQr2RfXYC9_YbP7DNWqwO5sNBLdY-ZxMllUJ5LAdN8RrLnpA_WpKAHtlon7GyFOtm72LSl_1y77xW1rd80rSo5eVvthD8S8FTYPeixi_lkjx_v9Cw0WqRZ9z5IjrSPEfI" />
                                <div className="absolute top-10 right-10 text-yellow-400 animate-pulse"><span className="material-symbols-outlined text-4xl">sparkles</span></div>
                                <div className="absolute bottom-20 left-10 text-primary opacity-20"><span className="material-symbols-outlined text-6xl">chat_bubble</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: 학습콘텐츠 설계 */}
                <section className="py-24 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-16 items-start">
                        <div className="flex-1 z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">학생이 만드는 학습콘텐츠</h2>
                                <p className="text-lg text-on-surface-variant mb-8">
                                    교과 단원을 고르고, AI와 함께<br/>나만의 공부 흐름을 설계해요.
                                </p>
                                <div className="relative w-64 h-64 mt-12">
                                    <img alt="Hana Teacher" className="absolute bottom-0 left-0 w-full h-auto object-cover transform -scale-x-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBifwpuxuf5E1sYy7O9nKhO4c4M1MlVabyIzmigBKpkKm2qoZ_Qx6GVbQEFdo58OebZP_c-tbNT5w0k3WN1Rbsgq01bEAnZR4FIe6BR3DmOT9BKJH65W2zPVlOu_atcFhary0onxMd24N6cfVv30KaBQxSx1IlMBWAs6n9hhXqOjrqKzzmS1QKhKV9k-0cYhZG-0jXwGYdewe2BZqDZOvsjKVO22txj2lzwW3VX0lfyxjk6VKNP3aotOi4HrxPms9yLrOs6bx99UZk" />
                                    <div className="absolute -top-4 right-0 bg-white border border-pink-200 rounded-xl p-3 shadow-sm rounded-bl-none">
                                        <p className="text-primary font-bold text-sm">나만의 공부<br/>흐름을 만들어요!</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-2 w-full max-w-3xl z-10">
                                <div className="flex justify-center gap-4 mb-8">
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec2Tab === 'step1' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec2Tab('step1')}>단원 선택</button>
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec2Tab === 'step2' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec2Tab('step2')}>주제 만들기</button>
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec2Tab === 'step3' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec2Tab('step3')}>대본 만들기</button>
                                </div>
                                {sec2Tab === 'step1' && (
                                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 transition-opacity duration-300">
                                        <h3 className="font-title-md text-[32px] font-bold mb-4 text-center">교과/학년 선택</h3>
                                        <div className="flex justify-center gap-4 mb-6">
                                            <select className="rounded-lg border-gray-300 py-2 px-4 focus:ring-primary focus:border-primary"><option>초등학교</option></select>
                                            <select className="rounded-lg border-gray-300 py-2 px-4 focus:ring-primary focus:border-primary"><option>5학년</option></select>
                                        </div>
                                        <div className="flex justify-center gap-6 mb-8">
                                            <div className="flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl">🌿</div><span>국어</span></div>
                                            <div className="flex flex-col items-center gap-2 cursor-pointer"><div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-2xl border-4 border-yellow-400">🌍</div><span className="font-bold text-yellow-600">사회</span></div>
                                            <div className="flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🔭</div><span>과학</span></div>
                                            <div className="flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">📐</div><span>수학</span></div>
                                        </div>
                                        <div className="flex flex-col items-center gap-4">
                                            <span className="font-bold">단원 선택</span>
                                            <select className="w-full max-w-md rounded-lg border-gray-300 py-3 px-4 focus:ring-primary focus:border-primary"><option>2. 인권 존중과 정의로운 사회</option></select>
                                            <button className="mt-4 px-8 py-3 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-600 shadow-md">선택하기</button>
                                        </div>
                                    </div>
                                )}
                                {sec2Tab === 'step2' && (
                                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-center transition-opacity duration-300">
                                        <h3 className="font-title-md text-[32px] font-bold mb-6">AI 추천 주제</h3>
                                        <div className="space-y-4 max-w-md mx-auto">
                                            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-green-400 text-left flex items-center gap-3"><span className="text-green-500 text-xl">✦</span> 모든 사람은 왜 평등해야 할까요?</div>
                                            <div className="p-4 bg-white rounded-lg border border-primary shadow-sm cursor-pointer text-left flex items-center gap-3 ring-2 ring-pink-100"><span className="text-primary text-xl">✦</span> 다양한 인권 사례 알아보기</div>
                                            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-yellow-400 text-left flex items-center gap-3"><span className="text-yellow-500 text-xl">✦</span> 차별을 없애는 방법은 무엇일까요?</div>
                                        </div>
                                        <button className="mt-6 px-8 py-3 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-600 shadow-md">이 주제로 만들기 ✨</button>
                                    </div>
                                )}
                                {sec2Tab === 'step3' && (
                                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 transition-opacity duration-300">
                                        <h3 className="font-title-md text-[32px] font-bold mb-6 text-center">6컷 대본 미리보기</h3>
                                        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                            {[
                                                '오늘은 인권에 대해 배워볼까요?',
                                                '인권이란 무엇일까요?',
                                                '모든 사람은 평등한 권리를 가져요.',
                                                '인권이 지켜지지 않는다면 어떻게 될까요?',
                                                '우리가 할 수 있는 일은 무엇일까요?',
                                                '모두가 함께 행복한 세상!'
                                            ].map((text, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-sm flex gap-2">
                                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                                                    {text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>
                </section>

                {/* Section 3: 만화 완성 */}
                <section className="py-24 bg-surface-dim overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1 w-full order-2 lg:order-1 relative">
                                <div className="flex justify-center gap-4 mb-8">
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec3Tab === 'comic' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec3Tab('comic')}>6컷 학습만화</button>
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec3Tab === 'summary' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec3Tab('summary')}>단원 정리</button>
                                    <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec3Tab === 'quiz' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec3Tab('quiz')}>OX 퀴즈</button>
                                </div>
                                {sec3Tab === 'comic' && (
                                    <div className="transition-opacity duration-300">
                                        <img alt="Comic Editor Preview" className="w-full rounded-xl shadow-sm border border-gray-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl-mmdpgtCrzN5B7d66abK7EYzRO3gQ1zqyo9ZkOv_kzx3YfxJUp9rf49ytYUjxr43_XZ2LZjnohf3dbjis19SaSBtzWZeQj_gV_TEu2M0zX8h22TWKUR5FdAFljH641rQ4AgIxjSPbD6VnxgfN98F9qCyF9jscaBU0dmlz1uN78A_9Dt5BSH-OZ3xQALKyI2hFnTot_9uOz3VztkzadxPvPJYlD44zUfe79UsI0F0MoiaF1okSuOAsXahsaSDK3rHrpKnQlH4_bc" />
                                    </div>
                                )}
                                {sec3Tab === 'summary' && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 transition-opacity duration-300">
                                        <img alt="Summary Preview" className="w-full max-w-md mx-auto rounded-lg shadow-sm mb-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-UBJCELOGbTwPepWpf_-qtm_jbkSWJdp0DyAMNBU7Xx91kbkkiGMmqsmBJ3mW_-8JwiD6m8uMQuWjj5pK5D42mDjLD8Oue43J2YKs1V_yLgP3eJuFFiOeYBj9E-mpzm1yhTCUf3Y7k1O3Wf4qZ4PMY4qPHcF0EPQx9dr5hgL_Vf7IDh0eWNLlvKPbLZYTp9obytz7p7z4VW8kW5eTlh8E4dfvdTKkIfOJyoxsN3RNXqQOUJ2L5asbsuK50wRq6sPexDShizG3kik" />
                                        <p className="text-lg text-on-surface-variant">6컷으로 정리하는 핵심 내용</p>
                                    </div>
                                )}
                                {sec3Tab === 'quiz' && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 transition-opacity duration-300">
                                        <h3 className="text-3xl font-bold mb-8 font-title-md">도전! OX 퀴즈</h3>
                                        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md mx-auto border border-gray-200">
                                            <p className="text-lg text-on-surface-variant mb-6">모든 사람은 평등한 권리를 가진다.</p>
                                            <div className="flex justify-center gap-8">
                                                <button className="w-20 h-20 rounded-full border-4 border-blue-500 text-blue-500 text-4xl font-bold hover:bg-blue-50 shadow-md">O</button>
                                                <button className="w-20 h-20 rounded-full border-4 border-red-500 text-red-500 text-4xl font-bold hover:bg-red-50 shadow-md">X</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute -right-20 -bottom-10 w-48 h-48 hidden lg:block">
                                    <img alt="Doyoon" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH8l9rquf-KMOFxli984CKo5rg86eDoBzkJbrz7LG0Ax2mLXIz5I1TqXdjs3e6gAZO_dS0CKKoERzH4W8AE3E_Iw5mwjhicmB3l67OGkvCsA4h7URJEVvDHSjK62lMwnA6RRdwQa5gpXi00ZQGFkbpSbpe1E2ciTbxfXcxV6Q45RQacHxXSsoP3S4YWuFmOOO08dRqzYrate9Wel7Ht7CTRv9t721T-QoZiZjyuj03py-XifE5X8GBacXEjPaLBl3MdWLRzZzYPRQ" />
                                </div>
                            </div>
                            <div className="flex-1 order-1 lg:order-2 space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-on-surface">만화로 완성하는 공부</h2>
                                <p className="text-lg text-on-surface-variant">
                                    어려운 개념을 이야기와<br/>그림으로 바꾸면 이해가 쉬워져요.
                                </p>
                                <div className="relative w-48 h-48 mt-8">
                                    <img alt="Seoa" className="absolute bottom-0 left-0 w-full h-auto object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfVtlEyxhwmuHFpxMp1-ZDra0uHmxOScYj_-L3rkOoT1rZmapS9VJszlInkbAhWttIbqamE-Hnrj00J0tnAuBBHE_4m8YI_WMqMbjO0T6lFm46ZnjwJ9_O-3oRrsWLCtP-GqdLZpY8fJYQr2RfXYC9_YbP7DNWqwO5sNBLdY-ZxMllUJ5LAdN8RrLnpA_WpKAHtlon7GyFOtm72LSl_1y77xW1rd80rSo5eVvthD8S8FTYPeixi_lkjx_v9Cw0WqRZ9z5IjrSPEfI" />
                                    <div className="absolute -top-4 -right-12 bg-white border border-blue-200 rounded-xl p-3 shadow-sm rounded-bl-none whitespace-nowrap">
                                        <p className="text-lg text-on-surface-variant">재미있는 만화로<br/>이해가 쏙쏙!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                </section>

                {/* Section 4: 결과물 공유 */}
                <section className="py-24 bg-white relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">공유하고 확인하는 결과물</h2>
                            <p className="text-lg text-on-surface-variant">
                                완성한 작품은 책처럼 꾸미고,<br/>친구와 선생님에게 공유할 수 있어요.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4 mb-8">
                            <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec4Tab === 'share' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec4Tab('share')}>작품 공유</button>
                            <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec4Tab === 'cover' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec4Tab('cover')}>책표지·뒤표지</button>
                            <button className={`px-6 py-2 rounded-full font-bold shadow-sm transition-all border ${sec4Tab === 'check' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`} onClick={() => setSec4Tab('check')}>학습 확인</button>
                        </div>
                        {sec4Tab === 'share' && (
                            <div className="max-w-4xl mx-auto transition-opacity duration-300">
                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex flex-col md:flex-row items-center gap-8 justify-center">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex-1 w-full max-w-sm">
                                        <p className="text-lg text-on-surface-variant mb-4">공유 링크</p>
                                        <div className="bg-green-50 p-4 rounded-lg flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm">🌍</div>
                                            <div>
                                                <p className="text-lg text-on-surface-variant font-bold">인권 존중과<br/>정의로운 사회</p>
                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded inline-block mt-1">5학년 사회</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 bg-gray-100 border-none rounded-lg text-sm text-gray-500 px-3 py-2 outline-none" readOnly type="text" value="https://toonschool.com/share/abc123" />
                                            <button className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-md hover:bg-pink-600">링크 복사</button>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-xl font-bold mb-2">친구에게 자랑하기</p>
                                        <p className="text-lg text-on-surface-variant">내가 만든 학습만화를 링크 하나로 쉽게 공유하세요.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {sec4Tab === 'cover' && (
                            <div className="max-w-4xl mx-auto transition-opacity duration-300">
                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                                    <img alt="Book Covers" className="w-full max-w-2xl mx-auto rounded-lg shadow-sm mb-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCly8wLtGSJAMEn9rtyy3YMURXEDLw3TX1T8vctmhVEgWb-CESfqQMt82YZFcEnB07IZKsK45CXmGJwqeRr27eBIfrMYshemHiLQou3IAMEVP9IWGn8vk4rLM1WMEJdC9rTV8_SClFnAvOYPPSuQyY8Ti8HtKTXjwJfE13WhrOCbWRzYM58jE2zIpEX49wlP39lwnh93dXXERSTXT57G1QlhvkpqBEs97nYJaJ5MzAinNeOhe6tGH6DOPKInN45QgsopzbSL_wLjHA" />
                                    <p className="text-lg text-on-surface-variant font-bold">책처럼 완성하기</p>
                                </div>
                            </div>
                        )}
                        {sec4Tab === 'check' && (
                            <div className="max-w-4xl mx-auto transition-opacity duration-300">
                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex flex-col md:flex-row items-center gap-8 justify-center">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex-1 w-full max-w-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="font-bold">선생님 LMS</span>
                                            <select className="text-sm border-gray-300 rounded px-2 py-1"><option>5학년 1반</option></select>
                                        </div>
                                        <p className="text-sm text-on-surface-variant mb-4">학습 진행 현황</p>
                                        <div className="flex items-center justify-center gap-8">
                                            <div className="relative w-24 h-24 rounded-full border-8 border-green-400 flex items-center justify-center">
                                                <span className="font-bold text-xl">76%</span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span>완료 (19명)</div>
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>학습 중 (5명)</div>
                                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300"></span>미시작 (1명)</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-xl font-bold mb-2">성장 기록 확인</p>
                                        <p className="text-lg text-on-surface-variant">우리 반 학생들의 학습 현황을 한눈에 파악하세요.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-center mt-8 gap-4">
                            <img alt="Characters" className="h-32 object-contain hidden md:block" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBifwpuxuf5E1sYy7O9nKhO4c4M1MlVabyIzmigBKpkKm2qoZ_Qx6GVbQEFdo58OebZP_c-tbNT5w0k3WN1Rbsgq01bEAnZR4FIe6BR3DmOT9BKJH65W2zPVlOu_atcFhary0onxMd24N6cfVv30KaBQxSx1IlMBWAs6n9hhXqOjrqKzzmS1QKhKV9k-0cYhZG-0jXwGYdewe2BZqDZOvsjKVO22txj2lzwW3VX0lfyxjk6VKNP3aotOi4HrxPms9yLrOs6bx99UZk" />
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="py-24 bg-surface-dim relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="bg-white rounded-full border border-outline-variant p-8 text-center flex flex-col md:flex-row items-center justify-center gap-8 shadow-sm">
                            <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-primary font-bold text-2xl font-title-md border border-pink-100">Ts</div>
                            <div className="text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-on-surface">AI와 함께 만드는 <span className="text-primary">초등 학습콘텐츠</span></h2>
                                <p className="text-gray-600 text-lg mt-1">지금 바로 시작하고, 창의적인 공부를 경험해 보세요!</p>
                            </div>
                        </div>
                        <Link className="w-full sm:w-auto bg-[#ff2778] text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 group" to="/login">
                            무료로 시작하기 <span className="material-symbols-outlined">chevron_right</span>
                        </Link>
                        </div>
                    </div>
                </section>
            </main>
    );
}
