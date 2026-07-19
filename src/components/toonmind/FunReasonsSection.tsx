import type { CSSProperties, ReactNode } from 'react';
import './FunReasonsSection.css';

/* ===========================================================
   툰마인드 소개 페이지 — 섹션 5
   "툰마인드가 재미있는 3가지 이유" (참고 이미지 기반 3카드형)
   =========================================================== */

// 툰스쿨 v2 캐릭터 원본(투명 배경 PNG) 경로
const CHAR = {
  // 남자아이 도윤: 파란·흰 후드티
  doyoon: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-fullbody.png',
  // 여자아이 서아: 분홍 상의 + 남색 치마 + 분홍 리본
  seoa: '/images/toonschool/characters/v2/seoa-master/seoa-v2-fullbody.png',
  // 하나(선생님 비주얼): 베이지 재킷 + 초록색 책
  hana: '/images/toonschool/characters/v2/hana-master/hana-v2-fullbody.png',
} as const;

type Branch = {
  label: string;
  bg: string;
  ink: string;
};

type CardData = {
  num: number;
  title: ReactNode;
  desc: string[];
  center: { label: string; bg: string; ink: string };
  /** [TL, TR, BL, BR] 순서 */
  branches: [Branch, Branch, Branch, Branch];
  /** 연결선 색상 */
  line: string;
  variant: 'girl' | 'stickers' | 'tablet';
};

const BRANCH_POSITIONS = ['tl', 'tr', 'bl', 'br'] as const;
const CURVES = [
  'M120,93 Q103,80 99,60', // center -> TL
  'M200,93 Q217,80 221,60', // center -> TR
  'M120,137 Q103,150 99,170', // center -> BL
  'M200,137 Q217,150 221,170', // center -> BR
];

const CARDS: CardData[] = [
  {
    num: 1,
    title: (
      <>
        생각이 <span className="em">쑥쑥</span> 정리돼요
      </>
    ),
    desc: ['중심 주제에서 가지를 뻗으며', '생각을 쉽게 정리할 수 있어요.'],
    center: { label: '나의 꿈', bg: '#ffd1e6', ink: '#b3356e' },
    branches: [
      { label: '공부', bg: '#cde4ff', ink: '#2f5b8c' },
      { label: '재미', bg: '#ffe7a8', ink: '#9a6b00' },
      { label: '목표', bg: '#cdeec6', ink: '#3c7a37' },
      { label: '행복', bg: '#ffd6b8', ink: '#b5552a' },
    ],
    line: '#ff7aa8',
    variant: 'girl',
  },
  {
    num: 2,
    title: (
      <>
        꾸미는 <span className="em">재미</span>가 있어요
      </>
    ),
    desc: ['색상, 스티커, 그림으로', '나만의 툰마인드를 예쁘게 꾸밀 수 있어요.'],
    center: { label: '여름방학 계획', bg: '#c6ecd6', ink: '#2f7a4d' },
    branches: [
      { label: '여행', bg: '#ffd8b5', ink: '#b5602a' },
      { label: '독서', bg: '#cde4ff', ink: '#2f5b8c' },
      { label: '운동', bg: '#cdeec6', ink: '#3c7a37' },
      { label: '사진찍기', bg: '#e4d6f4', ink: '#6a4a9a' },
    ],
    line: '#5ec9a0',
    variant: 'stickers',
  },
  {
    num: 3,
    title: (
      <>
        <span className="em">저장</span>하고 <span className="em">공유</span>할 수 있어요
      </>
    ),
    desc: ['완성한 툰마인드를 저장하고', '친구나 선생님과 함께 볼 수 있어요.'],
    center: { label: '환경을 지키는 방법', bg: '#d6e6f7', ink: '#3a5a86' },
    branches: [
      { label: '절전하기', bg: '#ffe7a8', ink: '#9a6b00' },
      { label: '분리수거', bg: '#cdeec6', ink: '#3c7a37' },
      { label: '대중교통 이용하기', bg: '#cde4ff', ink: '#2f5b8c' },
      { label: '일회용품 줄이기', bg: '#ffd6b8', ink: '#b5552a' },
    ],
    line: '#7c9fd0',
    variant: 'tablet',
  },
];

/* ---------------- 번호 배지(핑크 꽃 모양) ---------------- */
function FlowerBadge({ num }: { num: number }) {
  return (
    <div className="fun-card__badge" aria-hidden="true">
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse
            key={i}
            cx="30"
            cy="14"
            rx="9.5"
            ry="13"
            fill="#ff5b94"
            transform={`rotate(${i * 60} 30 30)`}
          />
        ))}
        <circle cx="30" cy="30" r="15" fill="#ff2778" />
      </svg>
      <span className="fun-card__badge-num">{num}</span>
    </div>
  );
}

/* ---------------- 마인드맵 노드 ---------------- */
function MindmapNode({
  label,
  bg,
  ink,
  pos,
  center = false,
}: {
  label: string;
  bg: string;
  ink: string;
  pos: string;
  center?: boolean;
}) {
  return (
    <span
      className={`fun-mindmap__node mm-pos--${pos}${center ? ' fun-mindmap__node--center' : ''}`}
      style={{ '--node-bg': bg, '--node-ink': ink } as CSSProperties}
    >
      {label}
    </span>
  );
}

/* ---------------- 마인드맵(공통) ---------------- */
function Mindmap({ card }: { card: CardData }) {
  return (
    <div className="fun-mindmap" role="img" aria-label={`${card.center.label}을(를) 중심으로 한 마인드맵`}>
      <svg className="fun-mindmap__svg" viewBox="0 0 320 230" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {CURVES.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={card.line}
            strokeWidth={3.4}
            strokeLinecap="round"
            opacity={0.65}
          />
        ))}
      </svg>
      <MindmapNode label={card.center.label} bg={card.center.bg} ink={card.center.ink} pos="c" center />
      {card.branches.map((b, i) => (
        <MindmapNode key={i} label={b.label} bg={b.bg} ink={b.ink} pos={BRANCH_POSITIONS[i]} />
      ))}
    </div>
  );
}

/* ---------------- 카드2 장식 스티커 ---------------- */
function Stickers() {
  return (
    <div className="fun-stickers" aria-hidden="true">
      <span className="fun-sticker fun-sticker--star">
        <svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" fill="#ffce3d" stroke="#f3b400" strokeWidth="0.8" strokeLinejoin="round" /></svg>
      </span>
      <span className="fun-sticker fun-sticker--rainbow">
        <svg viewBox="0 0 48 30">
          <path d="M4 28a20 20 0 0 1 40 0" fill="none" stroke="#ff6b6b" strokeWidth="4" />
          <path d="M9 28a15 15 0 0 1 30 0" fill="none" stroke="#ffce3d" strokeWidth="4" />
          <path d="M14 28a10 10 0 0 1 20 0" fill="none" stroke="#5ec9a0" strokeWidth="4" />
          <path d="M19 28a5 5 0 0 1 10 0" fill="none" stroke="#6aa6e8" strokeWidth="4" />
        </svg>
      </span>
      <span className="fun-sticker fun-sticker--heart">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.3-9C1.2 9 2.6 5.5 6 5.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.4 0 4.8 3.5 3.3 6.5C19 16.5 12 21 12 21z" fill="#ff7aa8" stroke="#ff5b94" strokeWidth="0.8" /></svg>
      </span>
      <span className="fun-sticker fun-sticker--smile">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ffe07a" stroke="#f3b400" strokeWidth="0.8" /><circle cx="9" cy="10" r="1.2" fill="#7a5b00" /><circle cx="15" cy="10" r="1.2" fill="#7a5b00" /><path d="M8 14a4.5 4.5 0 0 0 8 0" fill="none" stroke="#7a5b00" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </span>
      <span className="fun-sticker fun-sticker--crayon">
        <svg viewBox="0 0 60 18">
          <rect x="6" y="3" width="44" height="12" rx="2" fill="#ff6b6b" />
          <rect x="6" y="3" width="44" height="12" rx="2" fill="url(#cg)" opacity="0.35" />
          <polygon points="50,3 58,9 50,15" fill="#e85555" />
          <rect x="2" y="3" width="6" height="12" rx="1.5" fill="#7a5b00" />
          <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient></defs>
        </svg>
      </span>
      <span className="fun-sticker fun-sticker--sparkle1">
        <svg viewBox="0 0 24 24"><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z" fill="#6aa6e8" /></svg>
      </span>
      <span className="fun-sticker fun-sticker--sparkle2">
        <svg viewBox="0 0 24 24"><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z" fill="#c9a8f0" /></svg>
      </span>
    </div>
  );
}

/* ---------------- 캐릭터 ---------------- */
function Character({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <span className={`fun-char ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </span>
  );
}

/* ---------------- 카드3: 태블릿 + 캐릭터 3종 ---------------- */
function TabletScene({ card }: { card: CardData }) {
  return (
    <>
      <div className="fun-tablet">
        <span className="fun-tablet__badge">💾 저장 완료!</span>
        <span className="fun-tablet__cam" />
        <div className="fun-tablet__screen">
          <Mindmap card={card} />
        </div>
        <span className="fun-tablet__home" />
      </div>
      <div className="fun-trio">
        <Character src={CHAR.doyoon} alt="툰마인드를 저장하며 엄지를 치켜세우는 도윤" className="fun-char--doyoon" />
        <Character src={CHAR.seoa} alt="손을 흔들며 인사하는 서아" className="fun-char--seoa" />
        <Character src={CHAR.hana} alt="초록색 책을 든 선생님(하나)" className="fun-char--hana" />
      </div>
    </>
  );
}

/* ---------------- 카드 공통 외곽 ---------------- */
function ReasonCard({ card }: { card: CardData }) {
  return (
    <article className={`fun-card fun-card--${card.variant}`}>
      <FlowerBadge num={card.num} />
      <div className="fun-card__header">
        <h3 className="fun-card__title">{card.title}</h3>
        <p className="fun-card__desc">
          {card.desc.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
      <div className="fun-card__scene">
        {card.variant === 'tablet' ? (
          <TabletScene card={card} />
        ) : (
          <>
            {card.variant === 'stickers' && <Stickers />}
            <Mindmap card={card} />
          </>
        )}
        {/* 카드1: 마인드맵 중심을 가리키는 여자아이 */}
        {card.variant === 'girl' && (
          <Character
            src={CHAR.seoa}
            alt="마인드맵 중심 노드를 가리키며 설명하는 서아"
            className="fun-char--seoa"
          />
        )}
      </div>
    </article>
  );
}

/* ---------------- 섹션 메인 ---------------- */
export default function FunReasonsSection() {
  return (
    <section className="fun-reasons" aria-labelledby="fun-reasons-title">
      <div className="fun-reasons__inner">
        <h2 id="fun-reasons-title" className="fun-reasons__title">
          툰마인드가 <span className="em">재미있는</span> 3가지 이유
        </h2>
        <p className="fun-reasons__subtitle">
          마인드맵으로 생각을 정리하고, 꾸미고, 나누는 즐거움까지!
        </p>
        <div className="fun-reasons__grid">
          {CARDS.map((card) => (
            <ReasonCard key={card.num} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
