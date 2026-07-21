/**
 * 툰스쿨 플립북 가로형(16:9) 공통 페이지 데이터 모델.
 *
 * flipbookPageMapper 가 기존 저장 데이터(ComicProjectData / EditorState /
 * ComicCutEditData / WorldStory / OXQuestion / 뒤표지 객체)를 이 모델로 변환한다.
 * 모든 페이지 컴포넌트(Flip*Page)와 렌더러(FlipbookPageRenderer)는 이 모델만 소비한다.
 *
 * 설계 기준(사용자 확정 2026-07-15):
 *  - 파스텔 자연 배경(하늘/구름/언덕/들꽃/나비) + 16:9(1600×900)
 *  - 화면·공유 이미지·PDF 모두 1600×900(16:9) 통일
 */
import type { ComicCutElement } from '../editor/utils/comicStorage'

/** 만화 6컷 학습 단계. cutNumber 1~6 에 순서대로 1:1 대응한다. */
export type ComicStage =
  | '도입'
  | '탐색'
  | '핵심 이해'
  | '생활 적용'
  | '오해 바로잡기'
  | '정리'

/** 세상 속 이야기 3종(history=역사, latest=최신, life=생활 연결). */
export type StoryCategory = 'history' | 'life' | 'latest'

/**
 * 표지 페이지.
 * learningGoal 은 현재 저장 데이터에 없다(원천: curriculum_subunits.learning_goal).
 *   - 1차: 미제공 또는 coreConcepts 기반 대체
 *   - 2차: 커리큘럼 조회/프로젝트 저장
 */
export interface FlipbookCoverPage {
  type: 'cover'
  subject: string
  grade: string
  semester?: string
  unit: string
  topic: string
  learningGoal?: string
  keywords: string[]
  heroImageUrl?: string
  studentName: string
  className?: string
  createdAt?: string
}

/**
 * 만화 컷 페이지(1~6 컷 공통 레이아웃).
 * 말풍선·캐릭터·글자는 이미지 안이 아니라 elements[](DOM 오버레이)로 렌더링된다.
 */
export interface FlipbookComicPage {
  type: 'comic'
  cutNumber: number
  stage: ComicStage
  stageDescription: string
  sceneTitle?: string
  sceneDescription?: string
  imageUrl?: string
  dialogue?: Array<{ speaker?: string; text: string }>
  keyPoint?: string
  caption?: string
  /** 만화 프레임 위에 겹쳐 그리는 캐릭터/말풍선/글자 DOM 오버레이 요소(배경 이미지에 포함되지 않음). */
  elements?: ComicCutElement[]
}

/**
 * 세상 속 이야기 페이지.
 * 본문(body)은 단일 문자열이며, facts[] 는 1차에서 본문을 문장 단위로 분할해 표시용으로만 사용.
 *   - 1차: content 를 3문장으로 분할 표시(DB 변경 없음)
 *   - 2~3차: AI 가 구조화된 핵심사실 3개를 생성/저장
 * imageUrl 은 현재 데이터에 없다(2차: AI 스토리 이미지).
 */
export interface FlipbookStoryPage {
  type: 'story'
  category: StoryCategory
  categoryLabel: string
  title: string
  summary?: string
  imageUrl?: string
  body: string
  facts?: string[]
  reflection?: string
}

/**
 * OX 퀴즈 페이지.
 * hint/explanation 은 현재 데이터에 없다.
 *   - 1차: explanation 은 기존 quizDefaults 풀이 팁 프리셋 사용, hint 미제공
 *   - 2차: AI 문항별 해설/힌트 생성
 */
export interface FlipbookQuizPage {
  type: 'quiz'
  quizNumber: number
  question: string
  hint?: string
  answer: 'O' | 'X'
  explanation?: string
  /**
   * 원본 데이터의 정답 값이 'O'/'X' 로 신뢰 가능했는지 여부.
   * false 이면 정답을 확정할 수 없어 학생에게 잘못된 정답을 보여주지 않는다.
   * (매퍼가 isKnownOxAnswer(data.answer) 로 채운다. 값이 없으면 true 로 간주)
   */
  answerReliable?: boolean
}

/**
 * 뒤표지 페이지.
 * keyPoints/keywords 는 1차에서 coreConcepts 로 자동 채움.
 * pledge/teacherMessage/nextLearning 은 현재 학생 플립북에 없다.
 *   - 1차: 자동 채움/빈값 폴백
 *   - 2차: 학생 입력(pledge) · teacherMessageService 연동(teacherMessage) · 커리큘럼 조회(nextLearning)
 *   - 3차: DB 저장 필드 추가(별도 승인)
 */
export interface FlipbookBackCoverPage {
  type: 'back-cover'
  keyPoints: string[]
  keywords: string[]
  pledge?: string
  studentName: string
  className?: string
  teacherMessage?: string
  nextLearning?: string
  /** 기존 뒤표지 호환 필드(작품명/과목/단원/완성일/히어로 이미지). */
  workTitle?: string
  subject?: string
  unit?: string
  createdAt?: string
  heroImage?: string
}

/** 16:9 플립북의 단일 페이지 모델. */
export type FlipbookPage =
  | FlipbookCoverPage
  | FlipbookComicPage
  | FlipbookStoryPage
  | FlipbookQuizPage
  | FlipbookBackCoverPage
