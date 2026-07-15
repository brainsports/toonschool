# Stage 4 사전 조사 — 기존 스토리·OX 퀴즈·뒤표지 데이터 구조

> 2026-07-15. 실제 코드·타입·저장 구조 기준. 추측 금지.

## 1. 세상 속 이야기(Story)

### 데이터 타입 (`studentUnitSummaryService.ts:3-7`)
```ts
interface WorldStory { type: 'history' | 'latest' | 'life'; title: string; content: string }
```
- 3종: `history`=역사 이야기, `latest`=최신 이야기, `life`=생활 연결. **이미지 필드 없음**, **본문은 단일 문자열**(핵심사실 3개 아님). 생성 분량 "각 2~3문장"(`:46`).
- 저장: localStorage `toonschool:summary:${projectId}` → `stories:{history,latest,life}`.
- 빈 데이터: `if (storedSummary?.stories?.history) push(...)`(`StudentComicViewerPage.tsx:216-218`) — 없으면 페이지 생략.

### 기존 컴포넌트 (`FlipStoryPage.tsx`)
- props: `subject, unit, chipLabel, icon, title, content, highlightLabel?, highlightText?, questionText?, pageNumber, totalPages`.
- 렌더: FlipPageChrome + 아이콘/제목 헤드 + 메인 본문 카드 + 사이드(핵심 사실 / 생각 질문).

### Stage 1 매퍼 (`flipbookPageMapper.ts` mapStory)
- `WorldStory` → `FlipbookStoryPage { type, category, categoryLabel, title, summary?, imageUrl?, body, facts?, reflection? }`.
- `categoryLabel`/`reflection`: `STORY_PRESETS`(history=역사이야기, latest=최신이야기, life=생활연결). `facts` = 본문 문장 분할(최대 3). `imageUrl`은 항상 없음(데이터에 없음).

### 순서(`StudentComicViewerPage.tsx:216-218`)
story-history(8) → story-current/latest(9) → story-life(10). (요청 순서 역사→생활→최신 과는 다르나 페이지 조립 순서는 매퍼/조립 단에서 제어 가능.)

---

## 2. OX 퀴즈(Quiz)

### 데이터 타입 (`studentUnitSummaryService.ts:9-13`)
```ts
interface OXQuestion { id: string; answer: 'O' | 'X'; question: string }
```
- 5문항 고정. **힌트 필드 없음**, **해설 필드 없음**(저장 데이터상). answer 타입은 `'O'|'X'`이나 안전 정규화(`normalizeOxAnswer`) 적용.
- 저장: `toonschool:summary:${projectId}` → `questions: OXQuestion[]`.

### 기존 컴포넌트 (`FlipQuizPage.tsx`)
- props: `subject, unit, questionNum, totalQuestions, question, correctAnswer:'O'|'X', selectedAnswer?, explanation?, onSelect, pageNumber, totalPages`.
- **정답 노출 정책(핵심)**: `answered = !!selectedAnswer`. 정답/해설 카드는 `answered`일 때만 렌더(`:76-88`). 선택 전에는 O/X 버튼만, 정답 숨김. → **pastel 도 동일 정책(선택 후 정답 노출)**.
- 해설 출처: 운영에서 `explanation` prop은 뷰어가 `buildQuizPageInfo().mission`(프리셋 풀이 팁) 주입.

### Stage 1 매퍼 (`flipbookPageMapper.ts` mapQuiz)
- `OXQuestion` → `FlipbookQuizPage { type, quizNumber, question, hint?, answer, explanation? }`.
- `answer`: (Stage 4에서 `normalizeOxAnswer` 적용으로 보강). `explanation`: `buildQuizPageInfo(project, n).mission`(프리셋). `hint`: 데이터 없음→미제공.

---

## 3. 뒤표지(BackCover)

### 저장 객체 (`StudentBackCoverPage.tsx:224-241`)
```ts
{ projectId, subject(=subjectId), subjectName, grade, topicTitle, topicId,
  unitTitle(=majorUnitName), lessonTitle(=middleUnitName), updatedAt,
  authorName, gradeClassInfo, unitName, createdDate, bgColor, bgOpacity }
```
- **없는 필드(확정)**: 핵심3/낱말3/한줄다짐/선생님한마디/다음학습. (plan §10 참고)
- 학급: DB에 학급/반 필드 없음 → `gradeClassInfo`는 "1반" 하드코딩(`:142`).

### 기존 컴포넌트 (`FlipBackCoverPage.tsx`)
- props: `workTitle, authorName?, gradeClassInfo?, createdDate?, heroImage?, qrImage?`(기본 `/images/toonschool/back-covers/back-cover-sns-default.webp`).
- 렌더: 축하 스탬프 + 완성 타이틀 + 작품정보 + "친구에게 자랑하기" CTA + 대표 만화 + TOONSCHOOL 공유/QR 카드.

### Stage 1 매퍼 (`flipbookPageMapper.ts` mapBackCover)
- → `FlipbookBackCoverPage { keyPoints, keywords, pledge?, studentName, className?, teacherMessage?, nextLearning?, workTitle?, subject?, unit?, createdAt?, heroImage? }`.
- `keyPoints`/`keywords`: `getProjectKeywords(project,3)`(coreConcepts). `studentName`=authorName, `className`=gradeClassInfo, `workTitle`=topicTitle, `subject`=subjectName, `unit`=unitName, `createdAt`=createdDate, `heroImage`=firstComicImageUrl.
- `pledge/teacherMessage/nextLearning`: 데이터 없음 → undefined(빈값 폴백).

### Stage 4 pastel 뒤표지 정책(§5-4)
- **QR 생성 금지, 작동 않는 공유 버튼 금지, 가짜 URL/학교 금지**. 참고 06(마무리 정리 카드형)에 맞춰 QR·공유카드·CTA는 빼고, 실제 데이터 필드만 사용. 빈 필드(다짐/선생님한마디/다음학습)는 자연스러운 안내 placeholder.

---

## 4. 운영 플립북 페이지 조립 순서 (`StudentComicViewerPage.tsx:205-227`)
표지(1) → 만화 1~6(2-7) → story history/latest/life(8-10) → OX 1~5(11-15) → 뒤표지(16). 총 16페이지(데이터 유무에 따라 가변 push).

---

## 5. 매퍼 계층(이미 존재)
Stage 1 `flipbookPageMapper.ts`의 mapStory/mapQuiz/mapBackCover가 이미 운영 데이터 → 파스텔 모델 변환을 담당. **별도 매퍼 파일 중복 생성 안 함**(§6 원칙: 타입 재사용·중복 금지). Stage 4 추가분은 정답 정규화 유틸(`flipbookOxQuiz.ts`)만 추가하고 mapQuiz에 적용.
