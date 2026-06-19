export type SpeechBubbleShape = 'rounded' | 'square' | 'cloud' | 'burst';

export type Speaker = 'doyoon' | 'seoa' | 'seoa_angry' | 'seoa_smile' | 'tony' | 'hana' | 'none';

export interface SpeechBubble {
  id: string
  x: number // % 단위 (0 ~ 100)
  y: number // % 단위 (0 ~ 100)
  width: number // % 단위
  height: number // % 단위
  text: string
  shape: SpeechBubbleShape
  speaker: Speaker
  fontSize: number
  color: string
  bgColor: string
}

export type CoverBgType = 'gradient' | 'image';
export type CharacterId = 'doyoon' | 'seoa' | 'hana' | 'all';

export interface CoverState {
  title: string
  grade: number
  subjectId: string
  subjectName: string
  topic?: string
  coreConcepts?: string
  resolutionOwner: CharacterId
  selectedResolution: string
  customResolution?: string
  bgType: CoverBgType
  bgGradient: string
  bgImageUrl: string | null
  author: string
  illustrator: string
  date: string | null
}

export interface ToonCut {
  id: string
  description: string
  dialogue: string
  character?: string
}

export interface CoverPreviewProps {
  cover: CoverState
  selectedId?: string
  scale?: number
  onClick?: () => void
}
