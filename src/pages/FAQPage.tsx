import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-surface-dim flex flex-col items-center py-24 p-6">
            <div className="max-w-3xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-on-surface">궁금해요</h1>
                    <p className="text-xl text-on-surface-variant mb-12">자주 묻는 질문을 확인하세요.</p>
                </div>
                
                <div className="space-y-4 mb-12">
                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer open:bg-white transition-colors">
                        <summary className="flex justify-between items-center font-bold p-6 text-gray-900 list-none">
                            학생은 어떻게 가입하나요?
                            <ChevronDown className="w-6 h-6 transition-transform group-open:rotate-180 text-gray-500" />
                        </summary>
                        <div className="p-6 pt-0 text-gray-600 text-sm border-t border-gray-100 mt-2">
                            학생들은 교사 계정으로 로그인한 뒤 클래스를 생성하고 학생 계정(아이디/비밀번호)을 일괄 생성하여 배포할 수 있습니다. 학생은 개인정보 입력 없이 발급받은 계정으로 바로 로그인할 수 있습니다.
                        </div>
                    </details>
                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer open:bg-white transition-colors">
                        <summary className="flex justify-between items-center font-bold p-6 text-gray-900 list-none">
                            태블릿에서도 사용할 수 있나요?
                            <ChevronDown className="w-6 h-6 transition-transform group-open:rotate-180 text-gray-500" />
                        </summary>
                        <div className="p-6 pt-0 text-gray-600 text-sm border-t border-gray-100 mt-2">
                            네! 툰스쿨은 PC, 크롬북, 아이패드, 갤럭시탭 등 다양한 기기에서 웹 브라우저로 원활하게 사용할 수 있도록 최적화되어 있습니다.
                        </div>
                    </details>
                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer open:bg-white transition-colors">
                        <summary className="flex justify-between items-center font-bold p-6 text-gray-900 list-none">
                            만든 만화는 어떻게 공유하나요?
                            <ChevronDown className="w-6 h-6 transition-transform group-open:rotate-180 text-gray-500" />
                        </summary>
                        <div className="p-6 pt-0 text-gray-600 text-sm border-t border-gray-100 mt-2">
                            제작이 완료된 만화는 고유 링크(URL)가 생성되어 친구들이나 부모님에게 공유할 수 있으며, PDF 파일로 다운로드하여 인쇄물로도 활용 가능합니다.
                        </div>
                    </details>
                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer open:bg-white transition-colors">
                        <summary className="flex justify-between items-center font-bold p-6 text-gray-900 list-none">
                            어떤 교과 과정이 포함되어 있나요?
                            <ChevronDown className="w-6 h-6 transition-transform group-open:rotate-180 text-gray-500" />
                        </summary>
                        <div className="p-6 pt-0 text-gray-600 text-sm border-t border-gray-100 mt-2">
                            현재 초등학교 전 학년, 전 과목의 성취기준을 기반으로 한 단원 정보가 기본 제공되며, 학생들이 직접 필요한 단원이나 주제를 추가하여 수업을 구성할 수도 있습니다.
                        </div>
                    </details>
                </div>

                <div className="text-center">
                    <Link to="/" className="text-primary font-bold hover:underline">
                        메인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
