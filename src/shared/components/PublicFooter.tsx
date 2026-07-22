import { Link } from 'react-router-dom';
import {
    Mail,
    Phone,
    Headset,
    Clock,
    MapPin,
    Download,
    ArrowRight,
    School,
    UsersRound,
    Landmark,
} from 'lucide-react';

/**
 * 툰스쿨 공통 푸터
 * - 기준 이미지: public/images/reference/toonschool-footer-reference.png
 * - 모든 공개 페이지에서 공통으로 사용 (PublicLayout 에서 1회 호출)
 *
 * 설계 메모
 * - 정책 페이지(이용약관/개인정보처리방침/이메일무단수집거부/청소년보호정책)는
 *   현재 프로젝트에 실제 라우트가 없으므로 가짜 경로를 만들지 않고
 *   ‘준비 중’ 안내 처리(클릭 시 안내 문구 + aria-disabled).
 * - SNS 아이콘은 실제 URL이 확인되지 않아 표시하지 않는다(가짜 링크 금지).
 * - 툰스쿨 소개서는 /intro/toonschool-intro.html,
 *   교육기관용 서비스 소개서는 /intro/toonschool-edu-intro.html (모두 인쇄·PDF 저장 가능)을 새 탭으로 연다.
 */

const EXTERNAL_INQUIRY_URL = 'http://page.kmemory.co.kr/toonschool/';

// 디자인 토큰 (기준 이미지에서 추출)
const ACCENT = '#5364e8';
const BORDER = '#e7eaf1';
const HEADING = '#252a37';
const BODY = '#454b59';
const LINK = '#3f4552';
const MUTED = '#565d6d';
const COPYRIGHT = '#9299aa';
const LOGO_GRADIENT = 'linear-gradient(145deg, #4f8cff 0%, #5c54e8 100%)';

// ‘준비 중’ 안내
const showPending = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    window.alert('해당 페이지를 준비하고 있습니다.');
};

/* ---------------- 내부 링크 ---------------- */
function InternalLink({ to, children }: { to: string; children: React.ReactNode }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center text-[17px] leading-[1.7] transition-colors hover:text-[#5364e8]"
            style={{ color: LINK }}
        >
            {children}
        </Link>
    );
}

/* ---------------- 준비 중 링크 (라우트 없음) ---------------- */
function PendingLink({ children }: { children: React.ReactNode }) {
    return (
        <button
            type="button"
            aria-disabled="true"
            title="해당 페이지를 준비하고 있습니다."
            onClick={showPending}
            className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded"
            style={{ color: MUTED, padding: '2px 2px' }}
        >
            {children}
        </button>
    );
}

/* ---------------- 섹션 제목 ---------------- */
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[23px] font-bold leading-tight" style={{ color: HEADING }}>
            {children}
        </h3>
    );
}

/* ---------------- 상단 정책 메뉴 ---------------- */
function PolicyNav() {
    return (
        <nav
            aria-label="약관 및 정책"
            className="w-full border-b"
            style={{ borderColor: BORDER }}
        >
            <div
                className="mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 xl:max-w-[1740px] xl:gap-x-0 xl:divide-x xl:px-[72px]"
                style={{ borderColor: BORDER, minHeight: 88, paddingTop: 30, paddingBottom: 30 }}
            >
                <span className="xl:px-8">
                    <Link
                        to="/terms-of-service"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        이용약관
                    </Link>
                </span>
                <span className="xl:px-8">
                    <Link
                        to="/privacy-policy"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        개인정보처리방침
                    </Link>
                </span>
                <span className="xl:px-8"><PendingLink>이메일무단수집거부</PendingLink></span>
                <span className="xl:px-8">
                    <Link
                        to="/youth-protection-policy"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        청소년보호정책
                    </Link>
                </span>
                <span className="xl:px-8">
                    <Link
                        to="/pricing"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        이용요금
                    </Link>
                </span>
                <span className="xl:px-8">
                    <a
                        href={EXTERNAL_INQUIRY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        광고·협업 문의
                    </a>
                </span>
                <span className="xl:px-8">
                    <a
                        href={EXTERNAL_INQUIRY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[15px] font-medium leading-none transition-colors hover:opacity-70"
                        style={{ color: MUTED, padding: '2px 2px' }}
                    >
                        제휴 문의
                    </a>
                </span>
            </div>
        </nav>
    );
}

/* ---------------- 1열: 브랜드 영역 ---------------- */
function BrandColumn() {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div
                    className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[18px] text-white shadow-sm"
                    style={{ background: LOGO_GRADIENT }}
                    aria-hidden="true"
                >
                    <span className="text-[30px] font-extrabold tracking-tight">TS</span>
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[33px] font-bold tracking-tight" style={{ color: HEADING }}>
                        ToonSchool
                    </span>
                    <span className="mt-1.5 text-[21px] font-medium" style={{ color: BODY }}>
                        툰스쿨
                    </span>
                </div>
            </div>

            <p className="text-[19px] font-bold" style={{ color: ACCENT }}>
                공부하지 말고, 공부를 만들자.
            </p>

            <div className="flex flex-col gap-1 text-[16px]" style={{ color: BODY, lineHeight: 1.8 }}>
                <p>AI와 웹툰으로 배우는 초등 창작 학습 플랫폼</p>
                <p>툰스쿨 에디터 · 툰마인드 · 툰어휘사전 · 꿈의 궁전</p>
            </div>

            {/* SNS: 실제 URL 확인 전까지 표시하지 않음 */}
        </div>
    );
}

/* ---------------- 소개서 보기(인쇄·PDF 저장 가능) ---------------- */
function IntroDownloadLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={`${label} — 새 탭에서 열려요. 상단의 ‘PDF로 저장하기’를 누르면 PDF로 저장됩니다.`}
            className="flex h-[56px] w-full max-w-[370px] items-center justify-between rounded-[11px] px-5 text-[15px] font-semibold transition-all hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ background: ACCENT, color: '#fff' }}
        >
            <span>{label}</span>
            <Download className="h-5 w-5" aria-hidden="true" />
        </a>
    );
}

/* ---------------- 2열: 서비스 소개·자료 ---------------- */
function ServiceColumn() {
    return (
        <div className="flex flex-col gap-4">
            <SectionTitle>서비스 소개 · 자료</SectionTitle>
            <nav className="flex flex-col gap-1" aria-label="서비스 소개">
                <InternalLink to="/">툰스쿨 소개</InternalLink>
                <InternalLink to="/student/select-unit">툰스쿨 에디터</InternalLink>
                <InternalLink to="/ai-content">툰마인드</InternalLink>
                <InternalLink to="/lms">수업 활용</InternalLink>
            </nav>
            <div className="mt-2 flex flex-col gap-3">
                <IntroDownloadLink href="/intro/toonschool-intro.html" label="툰스쿨 소개서 다운로드" />
                <IntroDownloadLink href="/intro/toonschool-edu-intro.html" label="교육기관용 서비스 소개서 다운로드" />
            </div>
        </div>
    );
}

/* ---------------- 3열: 광고·협업 ---------------- */
function PartnershipColumn() {
    const items = [
        { label: '교육기관 도입 문의', Icon: School },
        { label: '총판·지사·강사 파트너 문의', Icon: UsersRound },
        { label: '공공기관·지자체 사업 문의', Icon: Landmark },
    ];

    return (
        <div className="flex flex-col gap-4">
            <SectionTitle>광고 · 협업</SectionTitle>
            <div
                className="w-full max-w-[320px] overflow-hidden rounded-[10px] border bg-white p-2.5 shadow-[0_3px_12px_rgba(55,65,120,0.06)]"
                style={{ borderColor: '#e8eaf5' }}
            >
                <div className="grid grid-cols-[38%_62%] items-stretch">
                    <div className="mr-2.5 overflow-hidden rounded-lg bg-[#f2f0ff]">
                        <img
                            src="/images/footer/toonschool-partnership-guide.png"
                            alt="툰스쿨 도입과 제휴 문의 안내"
                            className="h-full min-h-[144px] w-full object-cover object-[52%_18%]"
                        />
                    </div>

                    <div className="flex min-w-0 items-center">
                        <ul className="flex w-full flex-col gap-1" aria-label="툰스쿨 도입 및 제휴 문의 분야">
                            {items.map(({ label, Icon }) => (
                                <li
                                    key={label}
                                    className="flex min-h-10 items-center gap-2 px-1 text-[14px] font-medium leading-[1.45] text-[#343b4d]"
                                >
                                    <Icon className="h-4 w-4 shrink-0 text-[#6674e9]" aria-hidden="true" />
                                    <span className="min-w-0 flex-1">{label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <a
                    href={EXTERNAL_INQUIRY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex min-h-[38px] w-full items-center justify-between rounded-[7px] border border-transparent bg-[#f2f2ff] px-3 text-[13px] font-semibold text-[#5365ec] transition-colors hover:border-[#d9dcff] hover:bg-[#e9eaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5365ec] focus-visible:ring-offset-1"
                >
                    <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        <span>광고 및 협업 문의하기</span>
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
            </div>
        </div>
    );
}

/* ---------------- 4열: 고객센터 + 운영사 ---------------- */
function ContactColumn() {
    return (
        <div className="flex flex-col gap-3">
            <SectionTitle>고객센터</SectionTitle>

            <a
                href="mailto:contact@kmemory.org"
                className="inline-flex items-center gap-2 text-[17px] font-semibold transition-opacity hover:opacity-75"
                style={{ color: ACCENT }}
            >
                <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                contact@kmemory.org
            </a>

            <div className="flex items-center gap-2 text-[15px]" style={{ color: BODY }}>
                <Phone className="h-[17px] w-[17px]" aria-hidden="true" style={{ color: ACCENT }} />
                <span style={{ color: MUTED }}>문의 · 상담</span>
                <a href="tel:15992479" className="font-semibold transition-opacity hover:opacity-75" style={{ color: HEADING }}>
                    1599-2479
                </a>
            </div>

            <div className="flex items-center gap-2 text-[15px]" style={{ color: BODY }}>
                <Headset className="h-[17px] w-[17px]" aria-hidden="true" style={{ color: ACCENT }} />
                <span style={{ color: MUTED }}>기술 지원</span>
                <a href="tel:0269567975" className="font-semibold transition-opacity hover:opacity-75" style={{ color: HEADING }}>
                    02-6956-7975
                </a>
            </div>

            <div className="flex items-center gap-2 text-[15px]" style={{ color: MUTED }}>
                <Clock className="h-[17px] w-[17px]" aria-hidden="true" style={{ color: ACCENT }} />
                <span>평일 09:00~18:00</span>
            </div>

            {/* 운영사 */}
            <div className="mt-3 flex flex-col gap-1.5 border-t pt-4" style={{ borderColor: BORDER }}>
                <p className="text-[15px] font-semibold" style={{ color: HEADING }}>
                    운영사
                </p>
                <p className="text-[16px] font-medium" style={{ color: HEADING }}>
                    브레인스포츠
                </p>
                <p className="flex items-start gap-2 text-[15px]" style={{ color: MUTED }}>
                    <MapPin className="mt-[2px] h-[16px] w-[16px] shrink-0" aria-hidden="true" style={{ color: ACCENT }} />
                    <span>서울특별시 금천구 가산디지털2로 169-16</span>
                </p>
                <a
                    href="mailto:contact@kmemory.org"
                    className="flex items-center gap-2 text-[15px] transition-opacity hover:opacity-75"
                    style={{ color: ACCENT }}
                >
                    <Mail className="h-[16px] w-[16px]" aria-hidden="true" />
                    contact@kmemory.org
                </a>
            </div>
        </div>
    );
}

/* ---------------- 푸터 본체 ---------------- */
export default function PublicFooter() {
    return (
        <footer
            className="w-full"
            style={{ background: '#fbfcff' }}
            aria-label="사이트 하단 정보"
        >
            <PolicyNav />

            <div className="mx-auto w-full px-6 xl:max-w-[1740px] xl:px-[72px]">
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-12 md:grid-cols-2 md:gap-x-10 xl:grid-cols-[1.25fr_1fr_1fr_1fr] xl:py-14">
                    <BrandColumn />
                    <ServiceColumn />
                    <PartnershipColumn />
                    <ContactColumn />
                </div>
            </div>

            <div className="border-t" style={{ borderColor: BORDER }}>
                <div
                    className="mx-auto flex w-full items-center justify-center px-6 xl:max-w-[1740px] xl:px-[72px]"
                    style={{ minHeight: 92 }}
                >
                    <p className="text-center text-[14px] font-normal" style={{ color: COPYRIGHT }}>
                        © 2026 ToonSchool. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
