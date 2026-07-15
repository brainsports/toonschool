/**
 * 툰스쿨 플립북 16:9 — 만화 컷 페이지(파스텔 자연 디자인).
 * 03-comic-reference.png 기준. Stage 2 공통 프레임/배경/카드를 재사용하고,
 * 만화 씬(배경 이미지 + 캐릭터/말풍선/이미지/텍스트/도형 DOM 오버레이)을 렌더링한다.
 *
 * 핵심: 만화 편집 요소(ComicCutElement)는 1400×1025 좌표계에 저장되어 있다.
 * 이 좌표계를 그대로 보존해 운영 뷰어(FlipComicPage)와 동일한 요소 배치를 유지한다.
 * 말풍선은 이미지가 아닌 DOM(빈 말풍선은 숨김). 단계명은 모델(stage) 기준.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { ComicCutElement } from '../../editor/utils/comicStorage'
import type { FlipbookComicPage, ComicStage } from '../flipbookPageModel'
import FlipbookContentCard from '../FlipbookContentCard'
import {
  SOURCE_COMIC_WIDTH,
  SOURCE_COMIC_HEIGHT,
  computeComicFrameWidth,
  computeComicScale,
} from '../flipbookComicCoords'

const STAGE_INSTRUCTION: Record<ComicStage, string> = {
  도입: '이 장면에서는 인물, 배경, 상황을 소개하고 이야기의 시작을 보여 주세요.',
  탐색: '문제를 자세히 살펴보고 숨은 단서를 찾아보는 장면이에요.',
  '핵심 이해': '이 단원의 가장 중요한 개념을 이해하는 장면이에요.',
  '생활 적용': '배운 내용을 생활 속 사례에 연결해 보는 장면이에요.',
  '오해 바로잡기': '자주 틀리는 생각과 오해를 바르게 고쳐 보는 장면이에요.',
  정리: '오늘 배운 핵심을 다시 정리하고 마무리하는 장면이에요.',
}

const KEY_FALLBACK: Record<ComicStage, string> = {
  도입: '이 장면에서 무엇이 궁금한지 생각해 보세요.',
  탐색: '반복되거나 달라지는 부분을 찾아보세요.',
  '핵심 이해': '이 단원의 가장 중요한 개념이 무엇인지 말해 보세요.',
  '생활 적용': '배운 내용을 생활 속에서 찾아보세요.',
  '오해 바로잡기': '자주 틀리는 부분을 바르게 고쳐 보세요.',
  정리: '오늘 배운 핵심을 한 문장으로 정리해 보세요.',
}

type PosProps = Pick<ComicCutElement, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'flipX' | 'zIndex'>

function positionStyle(el: PosProps): CSSProperties {
  return {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    transform: `rotate(${el.rotation || 0}deg)${el.flipX ? ' scaleX(-1)' : ''}`,
    zIndex: el.zIndex,
    pointerEvents: 'none',
  }
}

/** 읽기 전용 만화 요소 렌더러. 운영 ReadonlyElement 에서 좌표/변형/말풍선 스타일 보존 + pastel. */
function ComicOverlayElement({ el }: { el: ComicCutElement }) {
  if (el.type === 'speechBubble') {
    const text = el.text?.trim()
    if (!text) return null // 빈 말풍선 미표시
    const bg = el.style?.backgroundColor || '#ffffff'
    const borderColor = el.style?.borderColor || '#4a6b8a'
    const color = el.style?.textColor || '#24466f'
    const fontSize = el.style?.fontSize || 16
    return (
      <div style={positionStyle(el)}>
        <div className={`flp-bubble flp-bubble--${el.bubbleType || 'basic'}`} style={{ background: bg, borderColor, color }}>
          {el.speaker && <span className="flp-bubble-speaker">{el.speaker}</span>}
          <span className="flp-bubble-text" style={{ fontSize }}>
            {el.text}
          </span>
        </div>
      </div>
    )
  }
  if (el.type === 'character') {
    if (!el.imageUrl) return null
    return (
      <div style={positionStyle(el)}>
        <img className="flp-char-img" src={el.imageUrl} alt={el.speaker || '캐릭터'} />
      </div>
    )
  }
  if (el.type === 'image') {
    if (!el.imageUrl) return null
    return (
      <div style={positionStyle(el)}>
        <img className="flp-elem-img" src={el.imageUrl} alt="" />
      </div>
    )
  }
  if (el.type === 'text') {
    const text = el.text?.trim()
    if (!text) return null
    return (
      <div
        style={{
          ...positionStyle(el),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: el.style?.textColor || '#24466f',
          fontSize: el.style?.fontSize || 18,
          fontWeight: 700,
          textAlign: 'center',
          background: el.style?.backgroundColor,
        }}
      >
        {el.text}
      </div>
    )
  }
  if (el.type === 'shape') {
    return (
      <div
        style={{
          ...positionStyle(el),
          background: el.style?.backgroundColor || 'rgba(121,191,85,0.35)',
          border: `2px solid ${el.style?.borderColor || 'rgba(121,191,85,0.6)'}`,
          borderRadius: 12,
        }}
      />
    )
  }
  return null
}

export type FlipComicPagePastelProps = {
  model: FlipbookComicPage
  totalCuts?: number
}

export default function FlipComicPagePastel({ model, totalCuts = 6 }: FlipComicPagePastelProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [frameW, setFrameW] = useState(0)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      setFrameW(computeComicFrameWidth(el.clientWidth, el.clientHeight))
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const scale = computeComicScale(frameW)
  const stage = model.stage
  const elements = model.elements ?? []

  // 왼쪽 대화 목록: 스크립트 대사 우선, 없으면 말풍선 텍스트에서 추출(최대 4)
  const scriptDialogue = (model.dialogue ?? []).filter((d) => d.text?.trim())
  const bubbleDialogue = elements
    .filter((e) => e.type === 'speechBubble' && e.text?.trim())
    .map((e) => ({ speaker: e.speaker, text: e.text ?? '' }))
  const sideDialogue = (scriptDialogue.length ? scriptDialogue : bubbleDialogue).slice(0, 4)

  const headerInstruction = model.sceneDescription?.trim() || STAGE_INSTRUCTION[stage]
  const captionText = model.caption?.trim() || model.stageDescription?.trim() || ''
  const keyPoint = model.keyPoint?.trim() || KEY_FALLBACK[stage]
  const bg = model.imageUrl?.trim()

  return (
    <div className="flp-comic">
      <aside className="flp-comic-side">
        <div className="flp-stage-head">
          <span className="flp-stage-icon" aria-hidden="true">🦋</span>
          <span className="flp-stage-name flp-title-font">{stage}</span>
        </div>
        <p className="flp-stage-desc">{model.stageDescription}</p>

        <FlipbookContentCard tone="blue" className="flp-side-card">
          <div className="flp-side-title">
            <span aria-hidden="true">💬</span> 대화 내용
          </div>
          {sideDialogue.length ? (
            <ul className="flp-dialogue">
              {sideDialogue.map((d, i) => (
                <li key={i} className="flp-dialogue-item">
                  {d.speaker && <span className="flp-dialogue-speaker">{d.speaker}</span>}
                  <span className="flp-dialogue-text">{d.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flp-dialogue-empty">이 장면의 대화를 만화에서 확인해 보세요.</p>
          )}
        </FlipbookContentCard>

        <FlipbookContentCard tone="yellow" className="flp-side-card">
          <div className="flp-side-title">
            <span aria-hidden="true">★</span> 핵심체크
          </div>
          <p className="flp-keypoint">{keyPoint}</p>
        </FlipbookContentCard>
      </aside>

      <section className="flp-comic-main">
        <FlipbookContentCard soft className="flp-comic-header">
          <span className="flp-cut-badge flp-title-font">
            {model.cutNumber}컷. {stage}
          </span>
          <span className="flp-comic-instr">{headerInstruction}</span>
        </FlipbookContentCard>

        <div className="flp-comic-stage" ref={stageRef}>
          {frameW > 0 && (
            <div
              className="flp-comic-frame"
              style={{ width: frameW, height: (frameW * SOURCE_COMIC_HEIGHT) / SOURCE_COMIC_WIDTH }}
            >
              {bg ? (
                <img className="flp-scene-img" src={bg} alt={`${model.cutNumber}컷 만화 장면`} />
              ) : (
                <div className="flp-scene-empty" aria-label="만화 장면 이미지 없음">
                  <span aria-hidden="true">🖼️</span>
                  <span>이 컷의 만화 장면을 준비 중이에요.</span>
                </div>
              )}
              <div className="flp-scene-overlay">
                {scale > 0 && (
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                      width: SOURCE_COMIC_WIDTH,
                      height: SOURCE_COMIC_HEIGHT,
                    }}
                  >
                    {elements.map((el) => (
                      <ComicOverlayElement key={el.id} el={el} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <FlipbookContentCard soft className="flp-comic-caption">
          <span className="flp-caption-icon" aria-hidden="true">✏️</span>
          <span className="flp-caption-text">{captionText || '장면 설명을 간단히 적어 보세요.'}</span>
          <span className="flp-cut-dots" aria-hidden="true">
            {Array.from({ length: totalCuts }).map((_, i) => (
              <span key={i} className={`flp-dot${i < model.cutNumber ? ' is-on' : ''}`} />
            ))}
          </span>
        </FlipbookContentCard>
      </section>
    </div>
  )
}
