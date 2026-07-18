import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Users,
  Archive,
  LayoutDashboard,
  BarChart2,
  FileDown,
  Share2,
  ChevronDown,
  CheckCircle,
  Calculator,
  Building2,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

// 공통 기능 카드 데이터
const commonFeatures = [
  { icon: BookOpen, label: '만화 창작', desc: '학생 1명당 월 8회', color: 'bg-pink-50 text-pink-600' },
  { icon: Brain, label: '툰마인드 무제한', desc: '횟수 제한 없이 이용', color: 'bg-purple-50 text-purple-600' },
  { icon: Users, label: '학생·학급 관리', desc: '계정과 학급 통합 관리', color: 'bg-blue-50 text-blue-600' },
  { icon: Archive, label: '작품 저장', desc: '작품 저장 및 다시 보기', color: 'bg-emerald-50 text-emerald-600' },
  { icon: LayoutDashboard, label: '교사 대시보드', desc: '편리한 수업 관리', color: 'bg-orange-50 text-orange-600' },
  { icon: BarChart2, label: '학습 현황', desc: '학생별 활동 현황 확인', color: 'bg-cyan-50 text-cyan-600' },
  { icon: FileDown, label: 'PDF 다운로드', desc: '완성 작품 활용', color: 'bg-violet-50 text-violet-600' },
  { icon: Share2, label: '공유 링크', desc: '가족과 친구에게 공유', color: 'bg-amber-50 text-amber-600' },
];

// 요금 카드 데이터
type PlanBtnAction = 'calculator' | 'contact';
interface PlanData {
  id: string;
  name: string;
  range: string;
  priceLabel: string;
  priceNote: string;
  highlight: boolean;
  badge: string | null;
  features: string[];
  btnLabel: string;
  btnStyle: string;
  btnAction: PlanBtnAction;
}

const plans: PlanData[] = [
  {
    id: 'basic',
    name: '기본형',
    range: '10~29명',
    priceLabel: '12,000원',
    priceNote: '학생 1명당 / 월',
    highlight: false,
    badge: null,
    features: ['월 8회 만화 창작', '툰마인드 무제한', '소규모 기관 추천'],
    btnLabel: '예상 요금 계산하기',
    btnStyle: 'border-2 border-primary text-primary hover:bg-pink-50',
    btnAction: 'calculator',
  },
  {
    id: 'growth',
    name: '성장형',
    range: '30~59명',
    priceLabel: '기관 할인 적용',
    priceNote: '계약 학생 수와 운영 조건에 따라 할인',
    highlight: false,
    badge: null,
    features: ['월 8회 만화 창작', '툰마인드 무제한', '정기 수업 기관 추천'],
    btnLabel: '기관 할인 확인하기',
    btnStyle: 'border-2 border-primary text-primary hover:bg-pink-50',
    btnAction: 'contact',
  },
  {
    id: 'institution',
    name: '기관형',
    range: '60~99명',
    priceLabel: '맞춤 할인',
    priceNote: '여러 학급을 운영하는 기관을 위한 맞춤 견적',
    highlight: true,
    badge: '가장 많이 선택해요',
    features: ['월 8회 만화 창작', '툰마인드 무제한', '여러 학급 및 교사 관리'],
    btnLabel: '맞춤 견적 받기',
    btnStyle: 'bg-primary text-white hover:bg-pink-700',
    btnAction: 'contact',
  },
  {
    id: 'partner',
    name: '파트너형',
    range: '100명 이상',
    priceLabel: '별도 견적',
    priceNote: '교육업체·총판·다기관 운영을 위한 별도 협약',
    highlight: false,
    badge: null,
    features: ['다기관 통합 관리', '운영 현황 확인', '교육 지원 협의'],
    btnLabel: '제휴 상담하기',
    btnStyle: 'border-2 border-primary text-primary hover:bg-pink-50',
    btnAction: 'contact',
  },
];

// FAQ 데이터
const faqs = [
  {
    q: '월 8회는 무엇을 기준으로 하나요?',
    a: 'AI와 함께 새 만화를 생성하는 횟수 기준입니다. 학생 1인 기준으로 매월 초기화되며, 기존 작품을 다시 보거나 대사·내용을 수정하는 경우에는 차감되지 않습니다.',
  },
  {
    q: '기존 작품을 수정해도 횟수가 차감되나요?',
    a: '아니요. 이미 완성된 작품의 대사 수정, 내용 편집, 임시 저장, PDF 다운로드, 공유 링크 생성은 모두 횟수 차감 없이 자유롭게 사용할 수 있습니다.',
  },
  {
    q: '툰마인드도 이용 횟수 제한이 있나요?',
    a: '없습니다. 툰마인드는 모든 요금제에서 횟수 제한 없이 자유롭게 이용할 수 있습니다. 만화 창작 횟수를 모두 사용한 후에도 툰마인드 학습은 계속할 수 있습니다.',
  },
  {
    q: '학생 수가 달라지면 요금제도 변경되나요?',
    a: '네. 계약 기간 중 학생 수가 달라지면 담당자와 협의를 통해 요금제를 조정할 수 있습니다. 자세한 내용은 도입 상담을 통해 안내해 드립니다.',
  },
  {
    q: '월 8회를 초과하면 어떻게 하나요?',
    a: '월 8회를 모두 사용한 후에는 학생 1명당 추가 1회 1,000원으로 만화 창작 횟수를 추가할 수 있습니다. 추가 횟수는 언제든 신청 가능합니다.',
  },
  {
    q: '시스템 오류로 생성에 실패하면 차감되나요?',
    a: '아니요. 서버·네트워크 등 시스템 오류로 만화 생성이 실패한 경우에는 차감된 횟수가 자동으로 복구됩니다.',
  },
  {
    q: '교육청이나 여러 기관이 함께 계약할 수 있나요?',
    a: '가능합니다. 교육청·지자체·학교 연합 등 여러 기관이 함께 계약하는 대규모 도입의 경우 별도 협약을 통해 맞춤 견적을 제공합니다. 대규모 도입 문의를 통해 자세한 안내를 받아보세요.',
  },
];

// 추가 만화 창작 예시
const addExamples = [
  { students: 20, times: 1, cost: 20000 },
  { students: 50, times: 1, cost: 50000 },
  { students: 100, times: 1, cost: 100000 },
];

// 유틸: 천 단위 콤마
const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

// 추천 유형
function getPlanType(students: number): string {
  if (students < 10) return '별도 상담';
  if (students < 30) return '기본형';
  if (students < 60) return '성장형';
  if (students < 100) return '기관형';
  return '파트너형';
}

// FAQ 아코디언 아이템
function FAQItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  const answerId = `faq-answer-${idx}`;
  const btnId = `faq-btn-${idx}`;
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        id={btnId}
        aria-expanded={open}
        aria-controls={answerId}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-bold text-on-surface text-base md:text-lg hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <ChevronDown
          className={`shrink-0 text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          size={20}
        />
      </button>
      {open && (
        <div
          id={answerId}
          role="region"
          aria-labelledby={btnId}
          className="px-6 pb-5 text-on-surface-variant text-base leading-relaxed border-t border-gray-100 pt-4"
        >
          {a}
        </div>
      )}
    </div>
  );
}

// 계산기 컴포넌트
function PricingCalculator() {
  const [students, setStudents] = useState<number | ''>('');
  const [extraTimes, setExtraTimes] = useState(0);
  const navigate = useNavigate();

  const studentsNum = typeof students === 'number' ? students : 0;
  const planType = getPlanType(studentsNum);
  const baseMonthly = studentsNum * 12000;
  const extraCost = studentsNum * extraTimes * 1000;
  const totalMonthly = baseMonthly + extraCost;
  const totalComics = studentsNum * (8 + extraTimes);
  const hasStudents = studentsNum > 0;
  const needConsult = studentsNum >= 30;
  const belowMin = studentsNum > 0 && studentsNum < 10;

  const handleConsult = () => {
    const params = new URLSearchParams();
    if (planType !== '별도 상담') params.set('plan', planType);
    if (studentsNum > 0) params.set('students', String(studentsNum));
    navigate(`/contact?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 입력 영역 */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="calc-students">
              이용 학생 수 (명)
            </label>
            <input
              id="calc-students"
              type="number"
              min={1}
              max={9999}
              value={students}
              onChange={(e) => {
                const v = e.target.value;
                setStudents(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0));
              }}
              placeholder="학생 수를 입력하세요"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 기본 제공량 안내 박스 */}
          <div className="flex items-center gap-2.5 bg-pink-50 border border-pink-100 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-primary shrink-0" />
            <p className="text-sm text-on-surface">
              기본 제공:{' '}
              <span className="font-bold text-primary">학생 1명당 월 8작품</span>
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-on-surface mb-1">
              학생 1명당 월 추가 작품 횟수
            </p>
            <p className="text-xs text-on-surface-variant mb-3">
              기본 월 8작품을 초과하여 추가할 횟수를 선택해 주세요.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setExtraTimes(n)}
                  className={`min-h-[44px] rounded-xl font-bold text-sm border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    extraTimes === n
                      ? 'bg-primary text-white border-primary shadow'
                      : 'bg-white text-on-surface border-gray-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  +{n}회
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 영역 */}
        <div className={`rounded-2xl p-6 space-y-4 ${hasStudents ? 'bg-pink-50 border border-pink-100' : 'bg-gray-50 border border-gray-100'}`}>
          {hasStudents ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">
                  추천
                </span>
                <span className="font-bold text-primary text-lg">{planType}</span>
              </div>
              {belowMin && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  10명 미만 이용은 도입 상담을 통해 운영 가능 여부를 확인해 주세요.
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">기본 이용료</span>
                  <span className="font-bold">{fmt(baseMonthly)}</span>
                </div>
                {extraTimes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">추가 만화 창작 비용</span>
                    <span className="font-bold">{fmt(extraCost)}</span>
                  </div>
                )}
                <div className="border-t border-pink-200 pt-2 flex justify-between text-base font-bold">
                  <span className="text-on-surface">예상 월 이용료</span>
                  <span className="text-primary">{fmt(totalMonthly)}</span>
                </div>
                <div className="space-y-1 border-t border-pink-100 pt-2">
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>학생 1명당 월 이용 가능 작품 수</span>
                    <span className="font-bold text-on-surface">{(8 + extraTimes)}작품/월</span>
                  </div>
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>기관 전체 월 이용 가능 작품 수</span>
                    <span className="font-bold text-on-surface">{totalComics.toLocaleString()}작품/월</span>
                  </div>
                </div>
              </div>
              {needConsult && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                  기관 할인 적용 전 예상 금액입니다. 실제 계약 시 학생 수와 운영 조건에 따라 할인된 견적을 안내해 드립니다.
                </p>
              )}
              <button
                onClick={handleConsult}
                className="w-full min-h-[44px] mt-2 bg-primary text-white rounded-xl font-bold hover:bg-pink-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                상담 신청하기
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
              <Calculator size={40} className="text-gray-300" />
              <p className="text-on-surface-variant text-center text-sm">
                학생 수를 입력하면<br />예상 이용료가 계산됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 메인 페이지
export default function PricingPage() {
  const calculatorRef = useRef<HTMLElement>(null);
  const contactPath = '/contact';

  const scrollToCalculator = useCallback(() => {
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToPlans = useCallback(() => {
    document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <main className="pt-20 md:pt-24 w-full flex flex-col">
      {/* 1. 히어로 섹션 */}
      <section className="bg-white py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 z-10">
            <span className="inline-block text-primary font-bold text-sm tracking-widest uppercase">
              TOONSCHOOL PRICING
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-on-surface">
              학생 수에 맞춰<br />
              <span className="text-primary">선택하는 툰스쿨</span> 요금제
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl">
              월 8회 AI 학습만화 창작과 툰마인드 무제한 이용을 한 번에 만나보세요.
            </p>
            <p className="text-base text-on-surface-variant">
              학생 수와 운영 방식에 맞는 요금제를 확인해 보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={scrollToPlans}
                className="min-h-[44px] px-8 py-3 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-700 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                요금제 살펴보기
              </button>
              <Link
                to={contactPath}
                className="min-h-[44px] px-8 py-3 rounded-full border-2 border-primary text-primary font-bold text-lg hover:bg-pink-50 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                도입 상담하기
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative z-10">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 border border-pink-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">TS</span>
                </div>
                <span className="font-extrabold text-on-surface text-lg">툰스쿨 서비스</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '🎨', label: '6컷 학습만화', sub: 'AI 자동 생성' },
                  { emoji: '🧠', label: '툰마인드', sub: '마인드맵 학습' },
                  { emoji: '📊', label: '교사 대시보드', sub: '학습 현황 한눈에' },
                  { emoji: '🏅', label: '꿈의 정원', sub: '보상 시스템' },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-2xl p-4 shadow-sm border border-white/80 flex flex-col gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="font-bold text-sm text-on-surface">{item.label}</p>
                    <p className="text-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-pink-100">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-on-surface">모든 요금제 PDF·공유 링크 포함</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 공통 기능 */}
      <section className="py-16 bg-surface-dim">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
              모든 요금제에 기본으로 제공됩니다
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {commonFeatures.map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <p className="font-bold text-on-surface text-sm md:text-base">{label}</p>
                <p className="text-xs text-on-surface-variant leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 요금제 카드 */}
      <section id="pricing-plans" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3">요금제 안내</h2>
            <p className="text-on-surface-variant text-base">기관 규모에 맞는 요금제를 선택하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col gap-4 border transition-all ${
                  plan.highlight
                    ? 'bg-pink-50 border-primary shadow-md'
                    : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1">{plan.range}</p>
                  <h3 className="text-xl font-extrabold text-on-surface">{plan.name}</h3>
                </div>
                <div>
                  <p className={`text-2xl font-extrabold ${plan.highlight ? 'text-primary' : 'text-on-surface'}`}>
                    {plan.priceLabel}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{plan.priceNote}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                      <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.btnAction === 'calculator' ? (
                  <button
                    onClick={scrollToCalculator}
                    className={`min-h-[44px] w-full rounded-xl font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${plan.btnStyle}`}
                  >
                    {plan.btnLabel}
                  </button>
                ) : (
                  <Link
                    to={contactPath}
                    className={`min-h-[44px] w-full rounded-xl font-bold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center ${plan.btnStyle}`}
                  >
                    {plan.btnLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
            표시 내용은 권장 기준이며, 실제 이용료는 계약 학생 수·계약 기간·기관 수·지원 범위에 따라 달라질 수 있습니다.
          </p>
        </div>
      </section>

      {/* 4. 예상 이용료 계산기 */}
      <section className="py-16 bg-surface-dim" ref={calculatorRef}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3">
              우리 기관의 예상 이용료를 계산해 보세요
            </h2>
            <p className="text-on-surface-variant">학생 수를 입력하면 추천 유형과 예상 금액을 바로 확인할 수 있습니다.</p>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* 5. 추가 만화 창작 안내 */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3">
              월 8회를 모두 사용해도 필요한 만큼 추가할 수 있어요
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-base leading-relaxed">
              기본 제공되는 월 8회를 모두 사용한 뒤에는 학생 1명당 추가 1회{' '}
              <span className="font-bold text-primary">1,000원</span>으로 만화 창작 횟수를 추가할 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {addExamples.map((ex) => (
              <div key={ex.students} className="bg-pink-50 rounded-2xl p-5 border border-pink-100 text-center">
                <p className="text-sm text-on-surface-variant mb-1">
                  학생 {ex.students}명 × 추가 {ex.times}회
                </p>
                <p className="text-2xl font-extrabold text-primary">{fmt(ex.cost)}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="font-bold text-on-surface mb-3">횟수가 차감되지 않는 활동</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                '기존 작품 다시 보기',
                '대사와 내용 수정',
                '임시 저장',
                'PDF 다운로드',
                '공유 링크 생성',
                '시스템 오류로 생성 실패 (자동 복구)',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              서버·네트워크 등 시스템 오류로 만화 생성이 실패한 경우에는 차감된 횟수가 자동으로 복구됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 6. 툰마인드 무제한 강조 */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-purple-100 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                툰마인드 무제한
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface leading-snug">
                만화 창작 횟수를 모두 사용해도<br />
                <span className="text-purple-600">학습은 계속됩니다</span>
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed">
                툰마인드는 모든 요금제에서 횟수 제한 없이 이용할 수 있습니다.
                학생들은 교과 내용을 마인드맵으로 정리하고 복습할 수 있습니다.
              </p>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                {['마인드맵으로 교과 개념 정리', '저장·공유 무제한', '만화 창작 횟수와 독립 운영'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-purple-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-32 h-32 bg-purple-100 rounded-3xl flex items-center justify-center">
                <Brain size={56} className="text-purple-600" />
              </div>
              <p className="text-xs font-bold text-purple-600">툰마인드</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 대규모 계약 안내 */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1 space-y-4">
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  대규모 도입
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold leading-snug">
                  교육청·지자체·대규모 기관은<br />
                  <span className="text-pink-400">별도 협약</span>이 가능합니다
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/80">
                  {[
                    '교육청 및 교육지원청',
                    '지방자치단체',
                    '학교 연합',
                    '다수 지역아동센터 통합 계약',
                    '대형 복지법인',
                    '대형 교육업체',
                    '학생 500명 이상 계약',
                    '별도 기능 개발이 필요한 계약',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Building2 size={14} className="text-pink-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-white/70 text-sm leading-relaxed">
                  학생 수, 계약 기간, 참여 기관 수, 교육 지원 범위에 따라 맞춤 견적을 제공합니다.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  to={contactPath}
                  className="inline-flex min-h-[44px] items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-pink-700 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 text-base"
                >
                  대규모 도입 문의
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-16 bg-surface-dim">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-3">자주 묻는 질문</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <FAQItem key={idx} q={item.q} a={item.a} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. 마지막 상담 유도 영역 */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center">
              <MessageCircle size={32} className="text-primary" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
            우리 기관에 맞는 요금제가<br />궁금하신가요?
          </h2>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            학생 수와 수업 운영 방식을 알려 주시면<br />
            가장 알맞은 요금제를 안내해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to={contactPath}
              className="min-h-[44px] px-10 py-4 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-700 transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-center"
            >
              도입 상담 신청
            </Link>
            <Link
              to="/"
              className="min-h-[44px] px-10 py-4 rounded-full border-2 border-gray-200 text-on-surface font-bold text-lg hover:bg-gray-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 text-center"
            >
              서비스 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
