/**
 * 툰마인드 포스터(고정 비율 렌더링).
 * 미리보기 · 공유 뷰어 · PNG/PDF/공유 이미지 캡처가 **모두 이 컴포넌트**를 사용한다
 * (요구: 미리보기와 실제 공유 이미지의 배치가 동일해야 한다).
 *
 *  - mode='fixed': width×height(기본 1200×628 = 1.91:1) 프레임에 툰마인드를 자동 맞춤.
 *  - mode='fill' : 부모 컨텐츠 영역을 가득 채우고(ResizeObserver) 그 안에 자동 맞춤.
 *
 * 배경/장식/노드 모두 인라인 hex → html2canvas 로 안전. 편집 도구/선택 테두리/줌 버튼은
 * 이 컴포넌트 밖(에디터)에 있으므로 캡처에 포함되지 않는다.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import type { MindmapProject } from '../../types/mindmap';
import { getTheme, type MindmapTheme } from '../../data/mindmapConfig';
import { worldSize } from '../../utils/mindmapEngine';
import { V2_CHARACTER_EXPRESSIONS } from '../../data/characterAssets';
import MindmapNodesLayer from './MindmapNodesLayer';

export const POSTER_W = 1200;
export const POSTER_H = 628;
const PAD = 56;
const MIN_FIT = 0.2;
const MAX_FIT = 1.4;

export interface MindmapArtworkProps {
  project: MindmapProject;
  themeId?: string;
  mode?: 'fixed' | 'fill';
  width?: number;
  height?: number;
  interactive?: boolean;
  selectedId?: string | null;
  editingId?: string | null;
  artworkRef?: Ref<HTMLDivElement>;
  onSelect?: (id: string | null) => void;
  onDoubleClick?: (id: string) => void;
  onDragStart?: (id: string, e: ReactPointerEvent<HTMLDivElement>) => void;
  onAddChild?: (parentId: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onFinishEditing?: () => void;
}

export default function MindmapArtwork(props: MindmapArtworkProps) {
  const {
    project, themeId, mode = 'fixed', width = POSTER_W, height = POSTER_H,
    interactive = false, selectedId, editingId, artworkRef,
    onSelect, onDoubleClick, onDragStart, onAddChild, onTitleChange, onFinishEditing,
  } = props;

  const theme: MindmapTheme = getTheme(themeId || project.themeId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<{ w: number; h: number }>(
    mode === 'fixed' ? { w: width, h: height } : { w: width, h: height }
  );

  // fill 모드: 부모 영역 측정(캔버스 자체가 아니라 컨테이너를 재서 순환 측정 방지).
  useEffect(() => {
    if (mode !== 'fill') return;
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setMeasured({ w: el.clientWidth, h: el.clientHeight });
    const onResize = () => { measure(); };
    measure();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const { w: worldW, h: worldH } = worldSize(project.nodes);
  const frameW = measured.w;
  const frameH = measured.h;
  const scale = Math.max(MIN_FIT, Math.min(MAX_FIT, Math.min((frameW - PAD * 2) / worldW, (frameH - PAD * 2) / worldH)));
  const tx = (frameW - worldW * scale) / 2;
  const ty = (frameH - worldH * scale) / 2;

  const frameStyle: CSSProperties = {
    position: 'relative',
    width: mode === 'fixed' ? width : '100%',
    height: mode === 'fixed' ? height : '100%',
    background: theme.palette.background,
    borderRadius: 24,
    overflow: 'hidden',
    fontFamily: '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif',
  };

  return (
    <div className="mm-world" ref={artworkRef} style={frameStyle} data-mm-world="true">
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }}>
        <MindmapDecorations theme={theme} />
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: '0 0' }}>
          <MindmapNodesLayer
            nodes={project.nodes}
            theme={theme}
            interactive={interactive}
            selectedId={selectedId}
            editingId={editingId}
            onSelect={onSelect}
            onDoubleClick={onDoubleClick}
            onDragStart={onDragStart}
            onAddChild={onAddChild}
            onTitleChange={onTitleChange}
            onFinishEditing={onFinishEditing}
          />
        </div>
      </div>
    </div>
  );
}

/** 배경 장식(구름/별/꽃). 인라인 hex/emoji. 포스터와 에디터 캔버스가 공유. */
export function MindmapDecorations({ theme }: { theme: MindmapTheme }) {
  const decos = theme.decorations;
  const spots = [
    { left: '4%', top: '6%', size: 40 },
    { left: '88%', top: '5%', size: 34 },
    { left: '12%', top: '78%', size: 30 },
    { left: '82%', top: '84%', size: 38 },
    { left: '46%', top: '3%', size: 28 },
  ];
  return (
    <>
      <div style={{ position: 'absolute', left: '6%', top: '10%', width: 120, height: 60, background: theme.palette.cloud, borderRadius: 999, opacity: 0.7, filter: 'blur(2px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', right: '8%', top: '14%', width: 150, height: 70, background: theme.palette.cloud, borderRadius: 999, opacity: 0.65, filter: 'blur(2px)', zIndex: 0 }} />
      {spots.map((s, i) => (
        <span key={i} style={{ position: 'absolute', left: s.left, top: s.top, fontSize: s.size, opacity: 0.85, zIndex: 0, pointerEvents: 'none' }}>
          {decos[i % decos.length]}
        </span>
      ))}
    </>
  );
}

/**
 * 좌/우 패널용 컴팩트 캐릭터 안내(캔버스 작업영역 침범 금지).
 * 좁은 패널에 세로로 나란히 들어가도록 작게. pointer-events:none.
 */
export function MindmapPanelHints() {
  const hints = [
    { img: V2_CHARACTER_EXPRESSIONS.hana.explain, bubble: '주제를 중심에 두고 양옆으로 가지를 뻗어요!', bg: '#fff3e6' },
    { img: V2_CHARACTER_EXPRESSIONS.doyoon.thinking, bubble: '더 궁금한 점은 가지의 + 를 눌러 추가해요.', bg: '#eaf3ff' },
    { img: V2_CHARACTER_EXPRESSIONS.seoa.smile, bubble: '“나의 생각”도 꼭 직접 적어요.', bg: '#ffeaf2' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, pointerEvents: 'none' }}>
      {hints.map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={h.img} alt="안내 캐릭터" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ background: h.bg, border: '2px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '5px 7px', fontSize: 10.5, fontWeight: 700, color: '#4a3a2a', lineHeight: 1.3, wordBreak: 'keep-all' }}>
            {h.bubble}
          </div>
        </div>
      ))}
    </div>
  );
}
