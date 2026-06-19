import type { SpeechBubble } from '../types/cover'

export const createDefaultBubble = (): SpeechBubble => ({
  id: `bubble-${Date.now()}`,
  x: 30,
  y: 30,
  width: 40,
  height: 12,
  text: '대사를 더블클릭하여 수정하세요.',
  shape: 'rounded',
  speaker: 'none',
  fontSize: 12,
  color: '#475569',
  bgColor: '#FFFFFF'
})

export const constrainBubblePosition = (
  bx: number,
  by: number,
  bw: number,
  bh: number,
  dxPercent: number,
  dyPercent: number
): { x: number; y: number } => {
  const nextX = Math.max(0, Math.min(100 - bw, bx + dxPercent))
  const nextY = Math.max(0, Math.min(100 - bh, by + dyPercent))
  return { x: nextX, y: nextY }
}

export const constrainBubbleSize = (
  bx: number,
  by: number,
  bw: number,
  bh: number,
  dxPercent: number,
  dyPercent: number
): { width: number; height: number } => {
  const nextWidth = Math.max(10, Math.min(100 - bx, bw + dxPercent))
  const nextHeight = Math.max(4, Math.min(100 - by, bh + dyPercent))
  return { width: nextWidth, height: nextHeight }
}

export const intVal = (val: string): number => {
  const parsed = parseInt(val, 10)
  return isNaN(parsed) ? 0 : parsed
}
