import React, { useRef, useCallback } from 'react'
import type { SpeechBubble } from '../../types/cover'
import { constrainBubblePosition, constrainBubbleSize } from '../../utils/coverLayout'

interface SpeechBubbleOverlayProps {
  bubbles: SpeechBubble[]
  setBubbles: React.Dispatch<React.SetStateAction<SpeechBubble[]>>
  selectedBubbleId: string | null
  setSelectedBubbleId: (id: string | null) => void
}

// ── 오늘의 각오 화자별 색상 ─────────────────────────────────────────
const SPEAKER_THEMES: Record<string, { border: string; text: string }> = {
  doyoon: { border: '#3B82F6', text: '#1E3A8A' },
  seoa: { border: '#EC4899', text: '#881337' },
  seoa_angry: { border: '#EC4899', text: '#881337' },
  seoa_smile: { border: '#EC4899', text: '#881337' },
  hana: { border: '#10B981', text: '#064E3B' },
  none: { border: '#475569', text: '#0F172A' },
}

export default function SpeechBubbleOverlay({
  bubbles,
  setBubbles,
  selectedBubbleId,
  setSelectedBubbleId
}: SpeechBubbleOverlayProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{
    x: number
    y: number
    bx: number
    by: number
    bw: number
    bh: number
    mode: 'drag' | 'resize'
    handle?: string
  } | null>(null)

  // 드래그/리사이즈 연산 (마우스 무브)
  const onDrag = useCallback((e: MouseEvent) => {
    const dragStart = dragStartRef.current
    if (!dragStart || !selectedBubbleId || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    // px 변위를 % 변위로 환산
    const dxPercent = (dx / rect.width) * 100
    const dyPercent = (dy / rect.height) * 100

    setBubbles(prev => prev.map(b => {
      if (b.id !== selectedBubbleId) return b

      if (dragStart.mode === 'drag') {
        const { x, y } = constrainBubblePosition(dragStart.bx, dragStart.by, dragStart.bw, dragStart.bh, dxPercent, dyPercent)
        return { ...b, x, y }
      } else {
        const { width, height } = constrainBubbleSize(dragStart.bx, dragStart.by, dragStart.bw, dragStart.bh, dxPercent, dyPercent)
        return { ...b, width, height }
      }
    }))
  }, [selectedBubbleId, setBubbles])

  // 드래그/리사이즈 중지 (마우스)
  const stopDrag = useCallback(() => {
    dragStartRef.current = null
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }, [onDrag])

  // 말풍선 드래그/리사이즈 시작 핸들링 (마우스용)
  const startDrag = (e: React.MouseEvent, type: 'drag' | 'resize', bubbleId: string, handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedBubbleId(bubbleId)
    
    const bubble = bubbles.find(b => b.id === bubbleId)
    if (!bubble || !canvasRef.current) return

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bx: bubble.x,
      by: bubble.y,
      bw: bubble.width,
      bh: bubble.height,
      mode: type,
      handle
    }

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  // 터치 기반 드래그/리사이즈 연산
  const onTouchDrag = useCallback((e: TouchEvent) => {
    const dragStart = dragStartRef.current
    if (!dragStart || !selectedBubbleId || !canvasRef.current) return
    e.preventDefault() // 스크롤 차단
    
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const dx = touch.clientX - dragStart.x
    const dy = touch.clientY - dragStart.y

    const dxPercent = (dx / rect.width) * 100
    const dyPercent = (dy / rect.height) * 100

    setBubbles(prev => prev.map(b => {
      if (b.id !== selectedBubbleId) return b

      if (dragStart.mode === 'drag') {
        const { x, y } = constrainBubblePosition(dragStart.bx, dragStart.by, dragStart.bw, dragStart.bh, dxPercent, dyPercent)
        return { ...b, x, y }
      } else {
        const { width, height } = constrainBubbleSize(dragStart.bx, dragStart.by, dragStart.bw, dragStart.bh, dxPercent, dyPercent)
        return { ...b, width, height }
      }
    }))
  }, [selectedBubbleId, setBubbles])

  // 터치 드래그 중지
  const stopTouchDrag = useCallback(() => {
    dragStartRef.current = null
    document.removeEventListener('touchmove', onTouchDrag)
    document.removeEventListener('touchend', stopTouchDrag)
  }, [onTouchDrag])

  // 말풍선 터치 드래그/리사이즈 시작 핸들링 (태블릿/모바일 터치 대응)
  const startTouchDrag = (e: React.TouchEvent, type: 'drag' | 'resize', bubbleId: string, handle?: string) => {
    e.stopPropagation()
    setSelectedBubbleId(bubbleId)

    const bubble = bubbles.find(b => b.id === bubbleId)
    if (!bubble || !canvasRef.current) return

    const touch = e.touches[0]
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      bx: bubble.x,
      by: bubble.y,
      bw: bubble.width,
      bh: bubble.height,
      mode: type,
      handle
    }

    document.addEventListener('touchmove', onTouchDrag, { passive: false })
    document.addEventListener('touchend', stopTouchDrag)
  }

  return (
    <div 
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 30
      }}
    >
      {bubbles.map(bubble => {
        const isSelected = selectedBubbleId === bubble.id
        
        // % 단위를 실제 px로 변환 (미리보기 크기 680 * 961.5 기준)
        const left = (bubble.x / 100) * 680
        const top = (bubble.y / 100) * 961.5
        const width = (bubble.width / 100) * 680
        const height = (bubble.height / 100) * 961.5

        const spStyles = SPEAKER_THEMES[bubble.speaker] || SPEAKER_THEMES.none
        const strokeColor = bubble.color || spStyles.border
        const bgColor = bubble.bgColor || '#FFFFFF'

        // 말풍선 꼬리 렌더링
        const renderTail = () => {
          if (bubble.speaker === 'none') return null
          return (
            <div 
              style={{
                position: 'absolute',
                bottom: -12,
                left: '30%',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `12px solid ${strokeColor}`,
                zIndex: 1
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  bottom: 3,
                  left: -6,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `10px solid ${bgColor}`,
                  zIndex: 2
                }}
              />
            </div>
          )
        }

        // 모양별 border-radius 등 스타일
        const getShapeStyles = (): React.CSSProperties => {
          switch (bubble.shape) {
            case 'square': return { borderRadius: 4 }
            case 'cloud': return { borderRadius: '50% 50% 40% 40% / 40% 40% 50% 50%' }
            case 'burst': return { borderRadius: 8, clipPath: 'polygon(0% 15%, 15% 15%, 18% 2%, 35% 15%, 50% 5%, 62% 16%, 80% 2%, 85% 15%, 100% 15%, 95% 45%, 100% 70%, 85% 75%, 80% 98%, 62% 80%, 50% 95%, 35% 80%, 18% 98%, 15% 78%, 0% 70%, 5% 45%)' }
            default: return { borderRadius: 16 } // rounded
          }
        }

        return (
          <div
            key={bubble.id}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedBubbleId(bubble.id)
            }}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              cursor: isSelected ? 'move' : 'pointer',
              userSelect: 'none',
              zIndex: isSelected ? 40 : 30,
              touchAction: 'none'
            }}
            onMouseDown={(e) => startDrag(e, 'drag', bubble.id)}
            onTouchStart={(e) => startTouchDrag(e, 'drag', bubble.id)}
          >
            {/* 말풍선 몸체 */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: bgColor,
                border: `2.5px solid ${strokeColor}`,
                padding: '6px 10px',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxSizing: 'border-box',
                ...getShapeStyles()
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: bubble.fontSize || 12,
                  color: spStyles.text,
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.35,
                  width: '100%',
                  overflow: 'hidden',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {bubble.text}
              </p>
              {renderTail()}
            </div>

            {/* 선택 시 드래그/리사이즈 핸들 오버레이 */}
            {isSelected && (
              <>
                {/* 파란색 포커스 테두리 */}
                <div 
                  style={{
                    position: 'absolute',
                    inset: -4,
                    border: '2px dashed #3B82F6',
                    borderRadius: 8,
                    pointerEvents: 'none'
                  }}
                />
                {/* 우하단 리사이즈 핸들 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    right: -16,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'se-resize',
                    zIndex: 50,
                    touchAction: 'none'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    startDrag(e, 'resize', bubble.id, 'se')
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    startTouchDrag(e, 'resize', bubble.id, 'se')
                  }}
                >
                  <div 
                    style={{
                      width: 10,
                      height: 10,
                      background: '#3B82F6',
                      border: '2px solid white',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
