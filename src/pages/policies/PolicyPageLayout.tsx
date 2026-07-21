import { useEffect, useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import './policy-page.css';

/**
 * 정책 페이지 렌더링용 블록 타입
 * - 각 문서의 원문 구조(장·조·항·목록·표)를 블록 배열로 표현한다.
 * - id 는 렌더 시 헤딩 순서대로 자동 부여되므로 페이지 쪽에서 지정하지 않는다.
 */
export type PolicyBlock =
    | { kind: 'h2'; title: string }
    | { kind: 'h3'; title: string }
    | { kind: 'p'; text: string }
    | { kind: 'ol'; items: string[] }
    | { kind: 'table'; head: string[]; rows: string[][] };

type PolicyPageLayoutProps = {
    title: string;
    /** 공고일자/시행일자 등 상단 메타 정보 (ReactNode) */
    meta?: React.ReactNode;
    /** 검토용 문서 안내 문구. 전달하면 상단에 안내 상자로 표시 */
    notice?: string;
    /** 문서 본문 블록 배열 */
    blocks: PolicyBlock[];
};

/** 헤딩 블록에 순서대로 id 를 부여해 목차와 본문의 앵커를 일치시킨다. */
function withHeadingIds(blocks: PolicyBlock[]): (PolicyBlock & { id?: string })[] {
    let n = 0;
    return blocks.map((b) => {
        if (b.kind === 'h2' || b.kind === 'h3') {
            n += 1;
            return { ...b, id: `policy-sec-${n}` } as PolicyBlock & { id: string };
        }
        return b as PolicyBlock & { id: undefined };
    });
}

type TocItem = { id: string; title: string; sub: { id: string; title: string }[] };

/** 블록 배열에서 목차(h2 아래 h3 중첩)를 만든다. */
function buildToc(blocks: (PolicyBlock & { id?: string })[]): TocItem[] {
    const toc: TocItem[] = [];
    let current: TocItem | null = null;
    for (const b of blocks) {
        if (b.kind === 'h2' && b.id) {
            current = { id: b.id, title: b.title, sub: [] };
            toc.push(current);
        } else if (b.kind === 'h3' && b.id) {
            if (current) {
                current.sub.push({ id: b.id, title: b.title });
            } else {
                // h2 없이 h3 이 먼저 나오는 경우 최상위로 승격
                const item: TocItem = { id: b.id, title: b.title, sub: [] };
                toc.push(item);
                current = item;
            }
        }
    }
    return toc;
}

function PolicyToc({ items }: { items: TocItem[] }) {
    if (items.length === 0) return null;
    return (
        <nav className="policy-toc" aria-label="목차">
            <p className="policy-toc-title">목차</p>
            <ul className="policy-toc-list">
                {items.map((item) => (
                    <li key={item.id}>
                        <a href={`#${item.id}`}>{item.title}</a>
                        {item.sub.length > 0 && (
                            <ul className="policy-toc-sub">
                                {item.sub.map((s) => (
                                    <li key={s.id}>
                                        <a href={`#${s.id}`}>{s.title}</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function PolicyBody({ blocks }: { blocks: (PolicyBlock & { id?: string })[] }) {
    return (
        <div className="policy-body">
            {blocks.map((b, i) => {
                switch (b.kind) {
                    case 'h2':
                        return (
                            <h2 key={i} id={b.id} className="policy-h2">
                                {b.title}
                            </h2>
                        );
                    case 'h3':
                        return (
                            <h3 key={i} id={b.id} className="policy-h3">
                                {b.title}
                            </h3>
                        );
                    case 'p':
                        return (
                            <p key={i} className="policy-p">
                                {b.text}
                            </p>
                        );
                    case 'ol':
                        return (
                            <ol key={i} className="policy-ol">
                                {b.items.map((item, j) => (
                                    <li key={j}>{item}</li>
                                ))}
                            </ol>
                        );
                    case 'table':
                        return (
                            <div key={i} className="policy-table-scroll">
                                <table className="policy-table">
                                    <thead>
                                        <tr>
                                            {b.head.map((h, j) => (
                                                <th key={j} scope="col">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {b.rows.map((row, r) => (
                                            <tr key={r}>
                                                {row.map((cell, c) => (
                                                    <td key={c}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
}

export default function PolicyPageLayout({ title, meta, notice, blocks }: PolicyPageLayoutProps) {
    const [showTop, setShowTop] = useState(false);

    // SEO: 페이지 제목 설정 (기존 라이브러리 없음 → document.title 최소 처리, 언마운트 시 복원)
    useEffect(() => {
        const prev = document.title;
        document.title = `${title} | ToonSchool`;
        return () => {
            document.title = prev;
        };
    }, [title]);

    // 스크롤 시 맨 위로 버튼 표시
    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const prepared = useMemo(() => withHeadingIds(blocks), [blocks]);
    const tocItems = useMemo(() => buildToc(prepared), [prepared]);

    return (
        <div className="policy-page">
            <div className="policy-container">
                <article className="policy-card">
                    <header className="policy-header">
                        <h1 className="policy-title">{title}</h1>
                        {meta ? <div className="policy-meta">{meta}</div> : null}
                    </header>

                    {notice ? <div className="policy-notice" role="note">{notice}</div> : null}

                    <PolicyToc items={tocItems} />

                    <PolicyBody blocks={prepared} />
                </article>
            </div>

            {showTop ? (
                <button
                    type="button"
                    className="policy-to-top"
                    aria-label="맨 위로 이동"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <ArrowUp className="h-5 w-5" aria-hidden="true" />
                </button>
            ) : null}
        </div>
    );
}
