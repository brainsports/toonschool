# 툰스쿨 플립북 가로형(16:9) 개편 및 실제 데이터 연동 계획서

> 작성일: 2026-07-15 / 개정: 2026-07-15(사용자 결정 사항 확정 반영)
> 성격: **구현 계획서(계획 전용)**. 본 문서 작성 단계에서는 애플리케이션 소스·CSS·DB·Edge Function을 일절 수정하지 않는다.
> 조사 방법: 실제 파일 경로·함수·타입·저장 구조를 근거로 작성(모든 항목에 `파일:라인` 근거 병기).
> 작성 시점 브랜치: `main` (HEAD `b59d424`), 작업 디렉터리는 미추적 파일만 존재(소스 변경 없음).
>
> **사용자 확정(2026-07-15)**: (1) 파스텔 자연 배경의 16:9 가로형 디자인을 최종 기준으로 확정. (2) 화면·공유 이미지·PDF 모두 **1600×900(16:9)** 통일 — 기존 보호 항목 "A4 고정값(PDF 1123×794)"은 승인 하에 폐기.

---

## ✅ 확정된 결정 사항 (사용자 승인, 2026-07-15)

조사 단계에서 발견된 2가지 충돌은 사용자가 **모두 확정**했다. 본 계획서와 구현 단계는 아래 확정 사항을 기준으로 한다.

### 결정 A. 디자인 방향 — "파스텔 자연(16:9)" 최종 채택 ✅

| 구분 | 본 요청(이번에 확정한 디자인) | 기존 v2 목업 / `flipbook.css`(현재 main에 반영됨) |
|---|---|---|
| 톤 | 밝은 하늘색·구름·초록 언덕·들꽃·나비, 파스텔 블루/그린/핑크/옐로 | 코랄→핑크→바이올렛 그라데이션 히어로, "MY TOON BOOK / 비브란트 코믹 매거진" |
| 배경 | 자연풍 장식(구름/언덕/나비) | 보라색 미세 도트 패턴(`flipbook.css:49-50`). **구름/언덕/들꽃/나비 장식 요소 0건** |
| 페이지 비율 | **16:9(1600×900)** | **1400×990 = A4 가로(√2:1)** (`flipbook.css:43-45` 헤더 주석에 명시) |
| 색 토큰 예시 | `--flipbook-sky:#dff4ff`, `--flipbook-green:#79bf55` 등 | `--fb-hero: linear-gradient(135deg,#ff6b5e,#ff2778,#7c3aed)`, `--fb-comic:#2563eb` 등 (`flipbook.css:9-40`) |

- 기존 `feat/flipbook-redesign-comic-magazine` 브랜치는 이미 main에 완전 병합됨(`git rev-list --count main..feat/...` = 0). 즉 "MY TOON BOOK" 개편(commit `c3d060e`)은 **현재 main에 적용된 상태**이고, `docs/design/flipbook-redesign/v2/*.html` 목업과 `src/modules/student/styles/flipbook.css`가 그 산출물이다.
- **확정(사용자 승인)**: 파스텔 자연 배경(밝은 하늘색·구름·초록 언덕·들꽃·나비, 파스텔 블루/그린/핑크/옐로) + 16:9 가로형을 **툰스쿨 플립북 최종 디자인 기준**으로 채택. 기존 v2 코믹 매거진 톤은 **폐기**. 단, 기존 `flipbook.css`의 구조적 클래스(`.fb-page/.fb-chrome/.fb-chip/.fb-progress` 등)와 `Flip*Page` 컴포넌트 골격은 재사용한다(색 토큰·배경·비율만 교체).

### 결정 B. 화면·공유 이미지·PDF 모두 1600×900(16:9) 통일 ✅

- 메모리(`flipbook-architecture.md:21`)와 선행 조사서(`00-investigation-and-plan.md`)는 **"A4 비율 고정값 절대 변경 금지"**를 전제로 작성됨. 현재 PDF는 `jsPDF({orientation:'landscape', format:[1123,794]})` (`StudentComicViewerPage.tsx:524-529`)로 A4 가로 px 고정.
- **확정(사용자 승인)**: 화면(학생 뷰어·공유 뷰어)·공유 캡처 이미지·PDF 출력 모두 **1600×900(16:9)** 논리 크기로 통일. 기존 보호 항목 "A4 고정값(PDF 1123×794)"은 **승인 하에 폐기/오버라이드**한다. PDF는 `jsPDF({orientation:'landscape', format:[1600,900]})` 기준으로 전환.
- A4 인쇄가 필요한 경우만 별도 "A4 인쇄용 내보내기" 옵션으로 보존(선택, 구현 우선순위 P2).

---

# 툰스쿨 플립북 가로형 개편 계획 보고

## 1. 현재 플립북 구조 조사 결과

### 1.1 두 뷰어 분리 구조 (메모리 `flipbook-architecture`와 일치)

| 뷰어 | 라우트 | 파일 | 렌더 방식 |
|---|---|---|---|
| 학생용(본인) | `/student/comic/read` | `src/modules/student/pages/StudentComicViewerPage.tsx` | **DOM/HTML 실시간 렌더** |
| 공유용(공개) | `/book/:slug` | `src/modules/student/pages/SharedComicViewerPage.tsx` | **이미지 URL 전용(`<img>`)** |

- 라우트 정의: `src/app/router.tsx:130`(`/student/comic/read`), `src/app/router.tsx:136`(`/book/:slug`).
- 공유 URL 생성: `StudentComicViewerPage.tsx:92-95` → `${VITE_PUBLIC_SITE_URL||origin}/book/${slug}`.

### 1.2 핵심 제약: "공유 책은 이미지로 굽는다"

- 학생이 "자랑하기(share)" 누른 시점에 `handleShare()`(`StudentComicViewerPage.tsx:572-725`)가 각 페이지를 `html2canvas`로 캡처 → Storage 버킷 `shared-comic-books`에 `${slug}/page-NN.jpg` 업로드(`:619-631`) → `shared_comic_books.pages = [{pageNumber, type, imageUrl}]` 저장(`:643-706`).
- **공유 책은 원본 데이터(JSON)를 저장하지 않고 캡처 이미지만 저장**한다(`SharedComicViewerPage.tsx:8-12` `SharedPage` 타입, `:374` `<img src={page.imageUrl}>`).
- 따라서 (a) 페이지 내용물 디자인 변경은 **새로 공유되는 책부터** 반영, 기존 공유 링크의 이미지는 **불변**. (b) 뷰어 외관(여백·줌·반응형·컨트롤바)은 공유 뷰어에서 즉시 변경 가능(기존 책에도 적용).

### 1.3 페이지 배열 생성 (총 16페이지, 데이터 유무에 따라 가변)

- 페이지 조립: `StudentComicViewerPage.tsx:187-230`의 `useEffect`. `newPages.push` 순서가 곧 페이지 순서.
- 스프레드 배열: 학생용 `getSpreads()`(`:81-83`)은 **항상 단일 페이지**(`[pageIndex, null]`). 공유용 `getSpreads(totalCount, isSingle)`(`SharedComicViewerPage.tsx:16-38`)는 단일/펼침 분기.

### 1.4 렌더링 파이프라인 공유 (중요)

- 실시간 화면(`renderPage`/`renderHalf`, `:479-505`)과 PDF/공유 캡처(`renderPdfPage`, `:491-497`)가 **동일한 `renderFlipPage`(`:373-477`) + 동일 `Flip*Page` 컴포넌트**를 사용.
- 즉 CSS 고정 캔버스 한 벌(현재 1400×990)로 화면·PDF·공유 이미지가 모두 동일 레이아웃으로 생성됨. **이 구조를 16:9로 교체하면 세 경로가 한 번에 전환**된다.

## 2. 현재 데이터 생성·저장·공유 흐름

### 2.1 저장소 계층 (핵심: 편집 데이터는 전량 localStorage)

- `comicStorage.ts`, `projectStorage.ts`는 **둘 다 localStorage(LZString 압축)** (`projectStorage.ts:12-53`, `comicStorage.ts:59,68`).
- localStorage 키 구조(`projectStorage.ts:59-66`):
  - `toonschool:{unit|topic|script|front-cover|comic|summary|quiz|back-cover}:${projectId}`
  - `comic_project_data_${projectId}`(`comicStorage.ts:7`)
  - `toonschool:comic:${topicId}:cut:${cutNumber}`(`comicStorage.ts:148`, 컷별 편집 데이터)
  - 레거시: `comic_master_data_${topicId}`, `canvas_comic_state_${topicId}_cut_${n}`(`comicStorage.ts:81,5`)
- Supabase 사용처: `generation_jobs`(배경 생성 큐), `shared_comic_books`(공유), `toon_projects`(마이페이지/레거시), `profiles/students/classes`, 커리큘럼 테이블, Storage 버킷(`comic_assets`, `shared-comic-books`).

### 2.2 복원 흐름

`StudentComicViewerPage.tsx:187-230`: 전부 localStorage에서 복원 →
1. `currentProjectId` 결정(`:190`)
2. `loadComicProjectData` → ComicProjectData(`:196`)
3. `loadFrontCover` → EditorState(`:199`)
4. `loadSummary` → stories/questions(`:200`)
5. `loadBackCover`(`:201`)
6. `loadComicCutData(id, 1..6)` 매칭(`:209-213`)
7. 페이지 조립: 앞표지 → 만화6 → story3(history/latest/life) → OX5 → 뒤표지(`:205-227`)

### 2.3 handleShare() / 공유 링크 생성

`StudentComicViewerPage.tsx:572-725`:
1. 기존 공유 조회(`project_id` + `is_public=true`) → 있으면 재사용(`:588-598`)
2. 숨겨진 캡처 DOM(`[data-pdf-page="true"]`)을 `html2canvas`(scale 1.5)로 캡처 → JPEG blob(품질 0.85)(`:610-625`)
3. Storage `shared-comic-books` 버킷 `${slug}/page-NN.jpg` 업로드(`:622-631`)
4. `pages=[{pageNumber,type,imageUrl}]`, type=`cover|comic|story|quiz|back-cover|unknown`(`:633-647`). 첫 페이지 → `thumbnailUrl`(`:649-651`)
5. `shared_comic_books` insert(`:694-706`): `{slug, project_id, title, subject, student_name, grade, thumbnail_url, pages, is_public:true}`
6. `createGrowthEvaluationForSharedComic` 호출(`:710-716`)
7. `slug = Math.random().toString(36).substring(2,8)` 6자리(`:606`)

### 2.4 핵심 데이터 타입 (실제 정의)

**ComicProjectData** (`comicStorage.ts:10-18`): `grade, semester?, subject, mainUnit?, subUnit?, topicTitle, selectedStoryDescription, coreConcepts[]` + `cover?:{imageUrl?,updatedAt?}`(`:44-47`), `script`(`:22-35`).

**EditorState(표지)** (`src/modules/student/components/editor/types.ts:17-34`): `version:'1.1', elements:CanvasElement[], background?, coverTemplateId?, canvasWidth, canvasHeight, metadata?:{projectId?, subject?, subjectName?, grade?, topicTitle?, topicId?, lessonTitle?, unitTitle?}`.

**만화 대본 script** (`comicStorage.ts:22-35`):
```ts
script: { version:number; updatedAt:string;
  cuts: Array<{ cutNumber:1|2|3|4|5|6; title:string; sceneDescription:string;
    learningPoint?:string; dialogues:Array<{character:string; text:string}> }> }
```

**만화 컷 편집 데이터 ComicCutEditData** (`comicStorage.ts:130-145`):
```ts
{ cutNumber, backgroundImageUrl?, customBackgroundPrompt?, originalBackgroundPrompt?,
  backgroundInfo?:{sceneTitle?,description?,recommendedCharacterPosition?,recommendedBubblePosition?,caution?},
  backgroundRegenerateCount?, elements:ComicCutElement[], updatedAt }
```
**ComicCutElement** (`comicStorage.ts:97-128`): `{id, type:'character'|'speechBubble'|'image'|'text'|'shape', characterId?, speaker?, text?, bubbleType?, imageUrl?, x,y,width,height, rotation?, flipX?, zIndex, crop?, style?}`.

**세상 속 이야기 WorldStory** (`studentUnitSummaryService.ts:3-7`):
```ts
interface WorldStory { type:'history'|'latest'|'life'; title:string; content:string }
```

**OX 퀴즈 OXQuestion** (`studentUnitSummaryService.ts:9-13`):
```ts
interface OXQuestion { id:string; answer:'O'|'X'; question:string }
```

**뒤표지 저장 객체** (`StudentBackCoverPage.tsx:224-241`): `{projectId, subject, subjectName, grade, topicTitle, topicId, unitTitle, lessonTitle, updatedAt, authorName, gradeClassInfo, unitName, createdDate, bgColor, bgOpacity}`.

### 2.5 ⚠️ 중요: "이미지 안에 텍스트 포함 여부"

- 만화 배경 이미지(`backgroundImageUrl`)는 **"배경 전용(사람/캐릭터/글자/말풍선 금지)"** (`studentComicService.ts:315,710`).
- **말풍선·캐릭터·글자는 `elements[]`(DOM 오버레이)** 로 렌더링(`FlipComicPage.tsx:102-114`). 캐릭터는 `<img>`, 말풍선은 `<div>` 텍스트.
- → 본 요청의 "DOM 말풍선 표시" 요구와 **이미 일치**. 이미지 안 텍스트 중복 우려 없음.
- 단, v2 목업(`v2/comic.html`)의 미리보기 이미지에는 말풍선이 **목업용 일러스트(scene-03-wide.jpg) 자체에 굽혀져 있었음**. 실제 데이터에서는 DOM 오버레이이므로 혼동 주의.

## 3. 현재 페이지 구성과 최종 페이지 구성 비교

### 3.1 현재 페이지 순서 (코드 하드코딩, `StudentComicViewerPage.tsx:205-227`)

| # | 타입 | 비고 |
|---|---|---|
| 1 | `front-cover` | 앞표지 |
| 2-7 | `comic-cut` 1~6 | 만화 |
| 8 | `story-history` | 역사 이야기 |
| 9 | `story-current` | 최신 이야기(`latest`) |
| 10 | `story-life` | 생활 연결 |
| 11-15 | `ox-quiz` 1~5 | OX 퀴즈 |
| 16 | `back-cover` | 뒤표지 |

### 3.2 최종(본 요청) 페이지 구성 vs 현재

| 최종 순서(요청) | 현재 코드 순서 | 차이 |
|---|---|---|
| 1 표지 | 1 front-cover | 동일 |
| 2-7 만화 1~6 | 2-7 comic-cut | 동일 |
| 8 세상 속 이야기1(역사) | 8 story-history | 동일 |
| 9 세상 속 이야기2(**생활**) | 9 story-**current(최신)** | ⚠️ 순서 다름 |
| 10 세상 속 이야기3(**최신**) | 10 story-**life(생활)** | ⚠️ 순서 다름 |
| 11-15 OX 퀴즈 1~5 | 11-15 ox-quiz | 동일 |
| 16 뒤표지 | 16 back-cover | 동일 |

- **차이점**: 요청은 `역사→생활→최신`, 현재 코드는 `역사→최신→생활`.
- **권장**: 페이지 순서는 매퍼에서 제어하므로, 요청 순서(`역사→생활→최신`)로 맞추되 데이터 키(`history/life/latest`)는 그대로 사용. 표시 라벨/순서만 매퍼에서 지정(기존 데이터 호환 유지).

## 4. 16:9 가로형 전환 시 영향

### 4.1 권장 논리적 페이지 크기

- **권장: 1600×900 (16:9)**. 대안(동일 16:9): 1440×810, 1280×720.
- 현재: **1400×990 (A4 가로 √2:1)** — `LandscapePageLayout.tsx:2-4`, `flipbook.css:43-45`.

### 4.2 현재 1400×990과의 차이 및 영향

| 항목 | 현재(1400×990, √2) | 전환 후(1600×900, 16:9) | 영향 |
|---|---|---|---|
| 종횡비 | 1.414 | 1.778 | 더 넓은 가로형 |
| 페이지 높이 | 990 | 900 | 세로 축소, 콘텐츠 카드 재배치 필요 |
| 표지/뒤표지 grid | 44%/56% | 16:9에 맞춰 재조정 | 레이아웃 재설계 |
| 이중 스케일링 버그 | `BASE_WIDTH=1200` vs `PAGE_WIDTH=1400` 불일치 → zoom=100일 때 0.857배(`StudentComicViewerPage.tsx:234-246` vs `:52`) | **BASE = PAGE = 1600으로 통일** → 버그 근본 해결 | 개선(긍정적) |
| aspect-ratio | 미사용(고정 px), 표지 프레임만 `1/1`(`flipbook.css:287`) | `.fb-page{aspect-ratio:16/9}` 최초 렌더부터 확보 | 최초 로딩 크기 튐 해소 |
| PDF | A4 가로 `[1123,794]`(`:524-529`) | **16:9 `[1600,900]`**(✅ 확정) | 확정(결정 B, 보호항목 승인 폐기) |
| 공유 이미지 | 1400×990 JPEG(scale 1.5) | 1600×900 JPEG(scale 1.5) | 새 공유 책부터 16:9 |
| 기존 공유 이미지 | A4 비율 | 16:9 프레임에 렌터박스 또는 새 크롭 정책 | 호환 처리 필요(§15) |

### 4.3 디바이스 표시

- **PC**: 두 페이지 펼침(좌우 각 16:9). 단일 16:9 페이지 폭 ≈ 화면의 절반.
- **태블릿 가로**: 펼침 가능(현재 `>1024 && 가로형` 분기, `SharedComicViewerPage.tsx:100`).
- **태블릿 세로 / 모바일(≤768 또는 ≤1024 세로)**: 단일 페이지.
- **두 페이지 펼침 전체 비율**: 32:9(좌우 16:9 결합) — 매우 가로로 길어지므로, 펼침 시엔 각 페이지를 화면 높이에 맞춰 축소.
- **한 페이지 모드**: 16:9 단일.

## 5. 대표 템플릿 5종 설계 계획

> 공통: 모든 페이지는 `FlipbookPageFrame`(16:9 고정 캔버스) + `FlipbookBackground`(파스텔 자연 배경) + `FlipbookPageRenderer`(타입 분기)로 구성. 콘텐츠는 DOM 렌더링, 배경만 공통 에셋.

| 템플릿 | 컴포넌트 | 레이아웃(16:9 기준) | 비고 |
|---|---|---|---|
| 표지 | `FlipCoverPage` | 좌측 44%(히어로/타이틀/키워드/작가카드) + 우측 56%(대표 이미지/장식) | 기존 골격 재사용, 색·배경 교체 |
| 만화 6컷 | `FlipComicPage` | 상단 진행바/헤더 + 중앙 만화 프레임(이미지+DOM 말풍선 오버레이) + 하단 핵심카드/컷 인디케이터 | 말풍선은 DOM(이미지 아님) |
| 세상 속 이야기 | `FlipStoryPage` | 좌 메인 카드(본문) 1.45fr + 우 사이드(핵심/생각) 1fr | 본문 1개 → 표시만 3영역 분리(1차) |
| OX 퀴즈 | `FlipQuizPage` | 문제 + O/X 버튼(인터랙티브) + 정답/해설 카드 | 학생뷰 이미 인터랙티브(`onSelect`) |
| 뒤표지 | `FlipBackCoverPage` | **신규 풍부 레이아웃**(오늘의핵심3/낱말3/다짐/만든이/선생님한마디/다음학습) | ⚠️ 현재는 "완료+공유CTA" 페이지 → 대폭 확장 |

## 6. 표지 데이터 연동표

| 표시 항목 | 새 모델 필드 | 현재 데이터 필드(근거) | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|---|
| 과목 | `subject` | `ComicProjectData.subject` / `EditorState.metadata.subjectName`(`types.ts:25`) / `topic.selection.subjectName` | ✅ | ❌ |
| 학년 | `grade` | `ComicProjectData.grade` / `students.grade` | ✅ | ❌ |
| 학기 | `semester` | `ComicProjectData.semester?`(`comicStorage.ts:11`) | ✅(옵션) | ❌ |
| 단원 | `unit` | `ComicProjectData.mainUnit?`/`subUnit?` 또는 `selection.majorUnitName`/`middleUnitName` | ✅ | ❌ |
| 주제 | `topic` | `ComicProjectData.topicTitle`(`comicStorage.ts:14`) | ✅ | ❌ |
| 학습 목표 | `learningGoal` | ⚠️ `ComicProjectData`에 **없음**. 원천 `curriculum_subunits.learning_goal`(DB), 생성시 `GeneratedComicScript.learningGoal`(`studentScriptService.ts:34`) | △(조회 필요) | 2차: project에 저장 권장 |
| 부제/키워드 | `keywords` | `ComicProjectData.coreConcepts` → `getProjectKeywords()`(`landscapePageInfo.ts:22-24`) | ✅ | ❌ |
| 대표 그림 | `heroImageUrl` | `state.background \|\| firstComicImage \|\| cover.imageUrl`(`StudentComicViewerPage.tsx:389`) | ✅ | ❌ |
| 이름 | `studentName` | `students.name`(DB) → 뒤표지 `authorName` | ✅ | ❌ |
| 학급 | `className` | ⚠️ DB에 학급/반 필드 **없음**. `gradeClassInfo`에 "1반" 하드코딩(`StudentBackCoverPage.tsx:142`) | △ | ⚠️ `classes` JOIN 또는 `students.classNumber` 추가 검토 |
| 날짜 | `createdAt` | 뒤표지 `createdDate`(사용자 입력) 또는 `toon_projects.updated_at` | ✅ | ❌ |

**1차 구현안(데이터 추가 없이)**: `subject/grade/semester/unit/topic/keywords/heroImage/name/date`는 기존 데이터로 즉시 채움. `learningGoal`은 1차에서 `coreConcepts` 첫 항목 또는 단원 프리셋으로 대체. `className`은 기존 `gradeClassInfo` 그대로 사용(학급 데이터 부족은 별도 이슈).

## 7. 만화 6컷 데이터 연동표

| 표시 항목 | 새 모델 필드 | 현재 데이터 필드(근거) | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|---|
| 컷 번호 | `cutNumber` | `script.cuts[i].cutNumber` / 배열 인덱스(`comicStorage.ts:25`) | ✅ | ❌ |
| 단계명 | `stage` | ⚠️ 저장 필드 **없음**. `cutNumber→stage` 매퍼 필요. 후보 매핑: `getLearningRoleForCut()`(`studentComicService.ts:82-92`), `comicDefaults`(`landscapePageInfo.ts:5-12`), 생성 프롬프트 6컷 전개(`studentScriptService.ts:115-122`) | ✅(매퍼) | ❌(코드 매핑) |
| 단계 설명 | `stageDescription` | 프리셋(`comicDefaults`) | ✅ | ❌ |
| 장면 설명 | `sceneDescription` | `script.cuts[i].sceneDescription`(`comicStorage.ts:27`) | ✅ | ❌ |
| 만화 이미지 | `imageUrl` | `ComicCutEditData.backgroundImageUrl`(public URL 또는 data URL)(`comicStorage.ts:131`) | ✅ | ❌ |
| 대화 내용 | `dialogue[]` | `script.cuts[i].dialogues[{character,text}]`(`comicStorage.ts:28`). DOM 오버레이는 `ComicCutEditData.elements[type=speechBubble]`(`:97-128`) | ✅ | ❌ |
| 핵심체크 | `keyPoint` | `script.cuts[i].learningPoint`(`comicStorage.ts:27`) | ✅ | ❌ |
| 캡션 | `caption` | 파생(`sceneDescription` 요약 또는 프리셋) | △ | ❌ |

**단계명 표준화 제안**(요청의 6단계 ↔ cutNumber):
`1=도입, 2=탐색, 3=핵심 이해, 4=생활 적용, 5=오해 바로잡기, 6=정리`.
현재 `comicDefaults` 프리셋(`이야기의 시작/단서 찾기/규칙 짐작/다른 곳에 적용/헷갈린 생각 바로잡기/정리`)과 유사하나 명칭이 다름. → `flipbookPageMapper.ts`에서 cutNumber→요청 단계명으로 정규화.

## 8. 세상 속 이야기 데이터 연동표

| 표시 항목 | 새 모델 필드 | 현재 데이터 필드(근거) | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|---|
| 분류 | `category` | `WorldStory.type`(`'history'\|'latest'\|'life'`)(`studentUnitSummaryService.ts:5`) | ✅ | ❌ |
| 분류 라벨 | `categoryLabel` | 프리셋(`landscapePageInfo.ts:42-46`: 역사이야기/최신이야기/생활연결) | ✅ | ❌ |
| 제목 | `title` | `WorldStory.title` | ✅ | ❌ |
| 소개 | `summary` | 파생(`content` 첫 문장) | △ | ❌ |
| 대표 이미지 | `imageUrl` | ⚠️ **없음**(WorldStory에 이미지 필드 없음) | ✗ | 2차: AI 스토리 이미지 생성 |
| 본문 | `body` | `WorldStory.content`(단일 본문, 2~3문장)(`studentUnitSummaryService.ts:6,46`) | ✅ | ❌ |
| 핵심 사실 1~3 | `facts[]` | ⚠️ 구조화 안 됨. `content` 하나 | △(분리) | 3차: 구조화 필드 |
| 생각 한 줄 | `reflection` | 프리셋 `questionText`(생각해볼질문) | ✅ | ❌ |

**DB 변경 없이 가능한 1차 구현안**: 본문은 유지하고 화면에서만 3개 영역으로 나누어 표시(옵션 3). 구체적 방법:
- 메인 카드에 `content` 전체 표시
- 사이드 "핵심" 영역은 `content`를 문장 단위로 분할해 최대 3개 표시(정규식 `문장(?=[.!?])` 분리). 분할 불가 시 1개 통째 표시.
- "생각" 영역은 프리셋 질문.
**향후 개선안(2~3차)**: 2차—AI 생성 시 핵심사실 3개 구조화 저장; 3차—DB 필드 추가(별도 승인).

## 9. OX 퀴즈 데이터 연동표

| 표시 항목 | 새 모델 필드 | 현재 데이터 필드(근거) | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|---|
| 퀴즈 번호 | `quizNumber` | 배열 인덱스 | ✅ | ❌ |
| 문제 | `question` | `OXQuestion.question`(`studentUnitSummaryService.ts:11`) | ✅ | ❌ |
| 정답 | `answer` | `OXQuestion.answer`(`'O'\|'X'`)(`:12`) | ✅ | ❌ |
| 해설 | `explanation` | ⚠️ AI 해설 아님. 현재 `quizDefaults.mission`(프리셋, `landscapePageInfo.ts:14-20`) → `FlipQuizPage.explanation`(`StudentComicViewerPage.tsx:459`) | △ | 2차: AI 문항별 해설 |
| 힌트 | `hint` | ⚠️ **없음** | ✗ | 2차: 프롬프트/필드 |
| 선택 결과 | `selectedAnswer` | 학생 로컬 상호작용(`FlipQuizPage` 이미 `onSelect`/`selectedAnswer` 지원, `FlipQuizPage.tsx:10-12`) | ✅ | ❌(로컬) |

**인터랙션 정책(호환성 우선)**:
- **학생 본인 뷰어**: O/X 먼저 선택 후 정답 공개(**이미 구현됨**, `FlipQuizPage` 인터랙티브).
- **공유 뷰어**: 현재 이미지 베이크이므로 비인터랙티브(정답이 이미지에 포함되거나 미표시). **2차**에서 공유 뷰어를 DOM 전환하면 클릭 시 정답 공개 가능.
- **PDF**: 정답/해설 하단 표시형(현재 정답 카드 항상 노출 방식과 일치).

## 10. 뒤표지 데이터 연동표

| 표시 항목 | 새 모델 필드 | 현재 데이터 필드(근거) | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|---|
| 오늘의 핵심 3 | `keyPoints[]` | ⚠️ 뒤표지에 **없음**. 후보: `ComicProjectData.coreConcepts`(존재) 상위 3 | ✅(자동) | 1차: 자동채움 |
| 기억할 낱말 3 | `keywords[]` | `coreConcepts` / `getProjectKeywords()`(`landscapePageInfo.ts:22-24`) | ✅(자동) | 1차: 자동채움 |
| 한 줄 다짐 | `pledge` | ⚠️ 학생 플립북에 **없음**. `/toon` 레거시 `CoverState.resolutionOwner/selectedResolution/customResolution`(`cover.ts:29-31`)에만 존재 | △ | 2차: 학생 입력 / 3차: 필드 |
| 만든이 | `studentName` | 뒤표지 `authorName`(`StudentBackCoverPage.tsx:228`) | ✅ | ❌ |
| 학급 | `className` | 뒤표지 `gradeClassInfo`(하드코딩 "1반") | ✅ | ❌(한계 인지) |
| 선생님 한마디 | `teacherMessage` | ⚠️ 뒤표지에 **없음**. `teacher_messages` 테이블 + `teacherMessageService.ts` 존재(별도) | △ | 2차: 서비스 연동 / 3차: 필드 |
| 다음에 더 알아볼 것 | `nextLearning` | ⚠️ **없음**. 후보: 커리큘럼 다음 단원(`curriculum_subunits` 순서) | △ | 2차: 커리큘럼 조회 / 3차: 필드 |

**구현 단계 구분**:
- **1차(데이터 추가 없이 자동 채움)**: `keyPoints`/`keywords`는 `coreConcepts`에서 자동 생성. `pledge`/`teacherMessage`/`nextLearning`은 빈 값 또는 격려 문구 프리셋으로 자리만 확보.
- **2차(입력 연동)**: `pledge` 학생 입력, `teacherMessage`는 `teacherMessageService`에서 해당 학생/작품 메시지 조회, `nextLearning`은 커리큘럼 서비스에서 다음 단원 조회.
- **3차(DB 필드)**: `pledge/teacherMessage/nextLearning` 영구 저장 필드 추가(**별도 승인 필요**, 본 단계에서 미적용).

## 11. 공통 컴포넌트 구조

### 11.1 제안 경로 (기존 `components/viewer/` 폴더 구조에 맞춤)

기존에 이미 `src/modules/student/components/viewer/`(`FlipPageChrome`, `LandscapePageLayout`, `landscapePageInfo`, `pages/Flip*`)가 존재하므로, **새 파일은 신규 추가하고 기존 파일은 점진적 교체**한다.

```
src/modules/student/components/viewer/
├─ (기존) FlipPageChrome.tsx          ← 16:9/새 토큰으로 업데이트
├─ (기존) LandscapePageLayout.tsx     ← 상수 1600×900/16:9로 업데이트
├─ (기존) landscapePageInfo.ts        ← 프리셋/빌더 재사용
├─ (신규) FlipbookPageFrame.tsx       ← 16:9 캔버스 + 단일 scale 계산 + 캡처 고정 크기
├─ (신규) FlipbookBackground.tsx      ← 파스텔 자연 배경(공통 에셋)
├─ (신규) FlipbookSidebar.tsx         ← 만화 페이지 좌측 안내 영역(옵션)
├─ (신규) FlipbookContentCard.tsx     ← 공통 흰 카드(둥근 모서리)
├─ (신규) FlipbookPageRenderer.tsx    ← page.type 스위치(type별 컴포넌트 선택)
├─ pages/
│  ├─ (기존) FlipCoverPage.tsx        ← 새 토큰/배경 적용
│  ├─ (기존) FlipComicPage.tsx        ← 말풍선 DOM 유지, 프레임 16:9 재조정
│  ├─ (기존) FlipStoryPage.tsx        ← 3영역 분리 표시
│  ├─ (기존) FlipQuizPage.tsx         ← 인터랙티브 유지
│  └─ (기존) FlipBackCoverPage.tsx    ← ⚠️ 대폭 확장(새 항목들)
├─ (신규) flipbookPageModel.ts        ← FlipbookPage 유니온 타입(§12)
├─ (신규) flipbookPageMapper.ts       ← 기존 저장 데이터 → 새 모델 변환(단일 변환 계층)
src/modules/student/styles/
├─ (기존) flipbook.css                ← 16:9 + 파스텔 토큰으로 재작성(또는 flipbook-landscape.css 신규)
```

> AGENTS.md §3(파일 600행 제한, 400행 시 분리 검토) 준수. 페이지 파일엔 흐름만, UI는 components, 타입은 types, Supabase 조회는 service 분리(이미 충족).

### 11.2 역할 분리

- **FlipbookPageFrame**: `.fb-page{aspect-ratio:16/9; width:1600px(논리)}`, 공통 배경, 안전 여백, **단일 scale 계산**(이중 스케일링 제거), 캡처용 고정 크기 보장.
- **FlipbookBackground**: 확정된 하늘/구름/언덕/들꽃/나비 배경(공통 에셋). 페이지별 장식 강도 조절 가능(prop).
- **FlipbookPageRenderer**: `switch(page.type){case 'cover'|'comic'|'story'|'quiz'|'back-cover'}`.
- **flipbookPageMapper**: 기존 데이터(`ComicProjectData`/`EditorState`/`ComicCutEditData`/`WorldStory`/`OXQuestion`/back-cover 객체) → `FlipbookPage` 모델. **컴포넌트 곳곳에서 원본 데이터 직접 읽지 않고 변환 계층 1곳에 집중**.

## 12. 공통 페이지 데이터 모델

```typescript
// flipbookPageModel.ts
type FlipbookPage =
  | FlipbookCoverPage | FlipbookComicPage | FlipbookStoryPage
  | FlipbookQuizPage | FlipbookBackCoverPage;

interface FlipbookCoverPage {
  type: 'cover';
  subject: string; grade: string; semester?: string;
  unit: string; topic: string; learningGoal?: string;
  keywords?: string[]; heroImageUrl?: string;
  studentName: string; className?: string; createdAt?: string;
}
interface FlipbookComicPage {
  type: 'comic';
  cutNumber: number;
  stage: '도입'|'탐색'|'핵심 이해'|'생활 적용'|'오해 바로잡기'|'정리';
  stageDescription: string;
  sceneDescription?: string; imageUrl: string;
  dialogue?: Array<{ speaker?: string; text: string }>;
  keyPoint?: string; caption?: string;
}
interface FlipbookStoryPage {
  type: 'story';
  category: 'history'|'life'|'latest';
  categoryLabel: string; title: string; summary?: string;
  imageUrl?: string; body: string; facts?: string[]; reflection?: string;
}
interface FlipbookQuizPage {
  type: 'quiz';
  quizNumber: number; question: string; hint?: string;
  answer: 'O'|'X'; explanation?: string;
}
interface FlipbookBackCoverPage {
  type: 'back-cover';
  keyPoints: string[]; keywords: string[];
  pledge?: string; studentName: string; className?: string;
  teacherMessage?: string; nextLearning?: string;
}
```

### 신규 모델 vs 현재 데이터 매핑 요약

| 새 모델 필드 | 현재 데이터 필드 | 변환 가능 | 추가 저장 필요 |
|---|---|---|---|
| cover.learningGoal | (없음; `curriculum_subunits.learning_goal`) | △ 조회 | 2차 권장 |
| cover.className | `gradeClassInfo`(하드코드) | △ | 한계 |
| comic.stage | (없음; cutNumber 매핑) | ✅ 코드 | ❌ |
| comic.dialogue.speaker | `dialogues[].character` | ✅ | ❌ |
| story.imageUrl | (없음) | ✗ | 2차 |
| story.facts[] | `content`(단일) | △ 분할 | 3차 |
| quiz.hint | (없음) | ✗ | 2차 |
| quiz.explanation | 프리셋 mission | △ | 2차(AI) |
| back.keyPoints/keywords | `coreConcepts` | ✅ | ❌(1차 자동) |
| back.pledge/teacherMessage/nextLearning | (없음) | ✗ | 2~3차 |

## 13. 학생용·공유용 뷰어 통합 계획

### 13.1 권장 구조

```
공통 데이터 모델(FlipbookPage)
      ↓ flipbookPageMapper
공통 FlipbookPageRenderer (DOM 컴포넌트)
      ↓
학생용 뷰어 / 공유용 뷰어 / PDF·공유 캡처
```

- **공통 컴포넌트**: `FlipbookPageFrame`, `FlipbookBackground`, `FlipbookPageRenderer`, `Flip*Page` 5종, `flipbookPageModel/Mapper`.
- **학생용 전용**: localStorage 복원, 인터랙티브 OX, 확대/축소, PDF 다운로드, 공유 생성, `createGrowthEvaluation`.
- **공유용 전용**: slug → `shared_comic_books` 조회, 이미지 렌더(1차), 2차 DOM 전환 시 인터랙티브 OX.
- **OX 인터랙션 차이**: 학생 = 인터랙티브(선택 후 정답), 공유 = 비인터랙티브(1차, 이미지) → DOM 전환 후 클릭 정답 공개(2차).
- **공유 이미지 전용 대응**: 기존 공유 책은 `pages[].imageUrl`만 있으므로 **이미지 표시 유지**(내용 불변). 외관(chrome)만 새 디자인 적용(Track A).
- **신규 vs 기존 공유 구분**: `shared_comic_books`에 orientation/version 필드 없음(§15). 2차에서 DOM 전환 시 **새 캡처 이미지 비율(16:9)로 런타임 감지**(`naturalWidth/Height`)하여 구분(기존 isLegacyPortrait 로직 확장).
- **구버전 세로 작품**: `isLegacyPortrait`(`SharedComicViewerPage.tsx:95,113-119`, 이미지 비율 측정) 유지.

## 14. PDF·공유 링크 연동 계획

### 14.1 현황(조사)

- 캡처 대상: 화면 밖 숨겨진 `pdfCaptureRef` 컨테이너(`StudentComicViewerPage.tsx:978-1007`), 각 페이지 `data-pdf-page="true"` div.
- PDF 캡처: `html2canvas(node,{scale:2, useCORS:true, allowTaint:true, backgroundColor:'#fff'})`(`:545-550`). PDF `jsPDF` A4 가로 `[1123,794]`(`:524-529`).
- 공유 캡처: 동일 옵션 `scale:1.5`(`:612-617`).
- 썸네일: 표지(첫 페이지) 캡처 = `thumbnail_url`(`:649-651`).
- ⚠️ **폰트/이미지 로딩 명시 대기 로직 없음**(`document.fonts.ready` 미사용). 숨겨진 컨테이너가 상시 마운트되어 있어 대부분 로드되었다고 가정.

### 14.2 권장 캡처 흐름(개편 후)

```
FlipbookPage 데이터 → flipbookPageMapper → FlipbookPageRenderer 렌더링
→ document.fonts.ready + 이미지 preload 완료 대기 (신규)
→ 고정 1600×900 논리 크기 캡처 (html2canvas scale: PDF=2, 공유=1.5)
→ JPEG 저장(Storage shared-comic-books/${slug}/page-NN.jpg)
→ pages 배열 생성 (동일 구조 유지)
```

### 14.3 변경 범위

- `StudentComicViewerPage.tsx`: `renderPdfPage`가 `FlipbookPageRenderer` 사용, 캡처 노드 1600×900, `document.fonts.ready` 대기 추가, **PDF 포맷 16:9(`[1600,900]`) 전환(✅ 결정 B 확정)**.
- `handleShare`: 캡처 scale/크기만 16:9로 조정, 저장 구조(`pages[].imageUrl`)는 **변경 없음**(하위 호환).
- 썸네일: 표지 캡처 유지(16:9).
- PDF 파일명 로직(`:531-540`) 유지.
- CORS: `useCORS+allowTaint` 유지. data URL 이미지(컷 배경)는 동일 출처라 문제없음.

## 15. 기존 작품 하위 호환 계획

| 작품 유형 | 표시 방식 | 새 디자인 적용 | 데이터 변환 |
|---|---|---|---|
| A. 새 구조화 데이터(localStorage 풀세트) | 학생뷰: `FlipbookPageRenderer` DOM(16:9). 공유: 재공유 시 16:9 캡처 | ✅ 전면 | 매퍼 자동 |
| B. 기존 데이터 있으나 일부 페이지 이미지 누락 | 가변 push(현재 로직 유지, `:209-227` 조건부 push) | ✅(있는 페이지만) | 매퍼 + 폴백 |
| C. 기존 공유 이미지 URL만 있는 책 | 공유뷰: `<img>` 유지(내용 불변) + **외관(크롬/여백/줌)만 16:9 새 외관**(Track A) | ❌(내용) / ✅(외관) | 없음 |
| D. 세로형 레거시 이미지 | `isLegacyPortrait`(비율 측정) 유지, 세로 단일 표시 | ❌ | 없음 |
| E. 일부 페이지 데이터 누락 | 빈 값 폴백(프리셋/격려 문구), 페이지는 생략 또는 자리 표시 | 부분 | 폴백 |

**안전 원칙**: 기존 작품을 **강제 일괄 변환/DB 수정 없음**. 학생 뷰어는 항상 localStorage에서 실시간 렌더하므로 새 매퍼만으로 자동 적용. 기존 공유 링크는 이미지가 불변이므로 깨지지 않음(외관만 개선). **DB 마이그레이션 불필요**(1차).

## 16. 반응형 및 크기 튐 해결 계획

### 16.1 현황 문제(조사 확인)

- 컨테이너 초기 `{width:0,height:0}`(`StudentComicViewerPage.tsx:114`, 공유 `:81`).
- 50ms 재측정 타이머(`:182`, 공유 `:173`).
- **이중 스케일링**: 외부 `currentZoom`(BASE_WIDTH=1200, `:234-246`) vs PageWrapper 내부 `scale=clientWidth/1400`(`:52`) vs FlipComicPage 3번째 scale(`FlipComicPage.tsx:79-85`). zoom=100일 때 1200/1400≈0.857로 항상 축소.
- ResizeObserver 3곳(학생 `:56-57`, 공유 `:52-53`, FlipComicPage `:79-80`) 중복 관측.
- aspect-ratio 사실상 미사용.

### 16.2 해결 방안

- **`FlipbookPageFrame`에서 scale 1회 계산**: `BASE_WIDTH = FLIPBOOK_PAGE_WIDTH = 1600`으로 통일 → 이중 스케일링 근본 제거.
- **`aspect-ratio:16/9` 최초 렌더부터 확보**(`.fb-page{aspect-ratio:16/9}`) → 0×0 시에도 비율 유지, 크기 튐 제거.
- `useLayoutEffect`로 동기 측정(필요 시), 50ms 타이머 제거 또는 축소.
- ResizeObserver는 Frame 1곳으로 통합, 쓰로틀링.
- 외부 줌(currentZoom)과 내부 scale 역할 통합: 외부는 화면 배율만, 내부 고정 캔버스는 항상 1600×900.
- 학생/공유 뷰어가 **동일 `FlipbookPageFrame` scale 로직 공유**.
- 이미지 로딩과 무관하게 페이지 크기 유지(배경색 먼저 표시).

**변경 대상 파일/함수**: `StudentComicViewerPage.tsx`(PageWrapper `:44-68`, currentZoom `:234-246`, handleResize `:173-185`), `SharedComicViewerPage.tsx`(PageWrapper `:40-60`, checkMode `:92-111`, handleResize `:164-176`), `FlipComicPage.tsx`(`:79-85` 3번째 scale 제거/통합), 신규 `FlipbookPageFrame.tsx`.

## 17. 단계별 구현 순서

각 단계: 작업 파일 / 핵심 변경 / 예상 위험 / 검증 / 난이도 / 선행.

| 단계 | 작업 파일 | 핵심 변경 | 위험 | 검증 | 난이도 | 선행 |
|---|---|---|---|---|---|---|
| 1. 데이터·구조 정리 | `flipbookPageModel.ts`(신), `flipbookPageMapper.ts`(신) | 유니온 타입 + 기존→새 변환 | 타입 불일치 | tsc, 단위 테스트 | 중 | 없음 |
| 2. 디자인 시스템 | `flipbook.css`(또는 `flipbook-landscape.css`), `FlipbookBackground.tsx`(신), `FlipbookPageFrame.tsx`(신) | 16:9 캔버스 + 파스텔 토큰 + 배경 에셋 | 배경 에셋 용량/로딩 | 시각 목업 비교 | 중 | 1 |
| 3. 템플릿 5종 | `pages/Flip*Page.tsx` | 새 토큰/배경, 뒤표지 확장 | 레이아웃 깨짐 | 각 페이지 스크린샷 | 중상(뒤표지) | 2 |
| 4. 페이지 배열 연동 | `StudentComicViewerPage.tsx`(`:205-227`) + 매퍼 | 16페이지 순서/타입 연결 | 순서·누락 | 전체 16페이지 확인 | 중 | 1,3 |
| 5. 뷰어 통합 | `StudentComicViewerPage.tsx`, `SharedComicViewerPage.tsx`, `FlipbookPageRenderer.tsx`(신) | 단일 렌더러, 단일 scale, 반응형 | 크기 튐, flip 애니 | 반응형 테스트 | 상 | 2,3,4 |
| 6. 공유·PDF | `StudentComicViewerPage.tsx`(handleShare/PDF, `:512-725`) | 16:9 캡처, 폰트 대기, PDF 16:9 | 캡처 품질/CORS | PDF/공유 링크 확인 | 중상 | 5 |
| 7. 레거시 호환 | `SharedComicViewerPage.tsx`(Track A 외관) | 기존 이미지 책 외관 개선 | 기존 이미지 왜곡 | 기존 공유 링크 회귀 | 중 | 5,6 |
| 8. 검증·배포 | build, 브라우저 테스트, PR | 기능 브랜치→검증→main 병합 | 배포 회귀 | Vercel main 확인 | 중 | 1-7 |

## 18. 수정 대상 파일 목록

> 본 단계(계획서)에서는 미수정. 향후 구현 시 예상 대상(모두 `/student` 영역 내, AGENTS.md 준수).

**신규 파일(7)**:
- `src/modules/student/components/viewer/FlipbookPageFrame.tsx`
- `src/modules/student/components/viewer/FlipbookBackground.tsx`
- `src/modules/student/components/viewer/FlipbookSidebar.tsx`(옵션)
- `src/modules/student/components/viewer/FlipbookContentCard.tsx`
- `src/modules/student/components/viewer/FlipbookPageRenderer.tsx`
- `src/modules/student/components/viewer/flipbookPageModel.ts`
- `src/modules/student/components/viewer/flipbookPageMapper.ts`
- (배경 에셋) `src/assets/flipbook/background-landscape.webp` 등

**수정 파일**:
- `src/modules/student/styles/flipbook.css`(16:9 + 파스텔 토큰 재작성)
- `src/modules/student/components/viewer/LandscapePageLayout.tsx`(상수 1600×900/16:9)
- `src/modules/student/components/viewer/FlipPageChrome.tsx`(새 토큰)
- `src/modules/student/components/viewer/landscapePageInfo.ts`(프리셋/라벨 조정, 타입 보존)
- `src/modules/student/components/viewer/pages/Flip{Cover,Comic,Story,Quiz,BackCover}Page.tsx`
- `src/modules/student/pages/StudentComicViewerPage.tsx`(렌더러 교체, scale 통합, 캡처/PDF 16:9)
- `src/modules/student/pages/SharedComicViewerPage.tsx`(Track A 외관, 2차 DOM 전환)

**보호(수정 금지)**: `router.tsx` 라우트/slug 형식, DB 스키마/RLS/Storage 경로, `coverTemplates`, `SNSBackCoverPreview`, `studentUnitSummaryService`의 `WorldStory`/`OXQuestion` 타입, `html2canvas` 캡처 흐름 원칙, `/toon` 에디터 보호 파일들(`AGENTS.md §1`).

## 19. 예상 위험과 대응책

| 위험 | 대응 |
|---|---|
| 16:9 전환 시 기존 공유 이미지(A4비) 왜곡/레터박스 | 공유뷰는 비율 감지 후 `object-contain` 유지, 새 외관만 적용(내용 불변) |
| "A4 고정값" 보호 항목 충돌(결정 B) | PDF 16:9 전환을 별도 승인 항목으로 분리, A4 인쇄 옵션 병행 제공 |
| 디자인 방향 충돌(결정 A) | 파스텔 자연+16:9를 새 기준 확정, 기존 v2 토큰 폐기 명시 |
| 폰트/배경 미로딩 캡처 깨짐 | `document.fonts.ready` + 이미지 preload 대기 후 캡처(신규) |
| 배경 에셋 용량/깜빡임 | WebP/AVIF 단일 에셋, 배경색 선표시, 프리로드 |
| 단일 scale 통합 시 flip 애니메이션 회귀 | CSS 3D rotateY 흐름 유지, scale은 Frame 내부만 |
| 뒤표지 새 항목 데이터 부재 | 1차 자동채움/폴백, 2~3차 입력·DB 분리 |
| 학급 데이터 부재("1반" 하드코드) | 별도 이슈로 분리, 1차는 기존값 유지 |
| 파일 분할(600행) | 매퍼/모델/렌더러 분리로 대형 페이지 파일 경량화 |

## 20. 테스트 계획

**화면**: 1920×1080, 1440×900, 1024×768, 390×844.
**페이지**: 표지, 만화 1/3/6컷, 역사·생활·최신 이야기, OX 퀴즈, 뒤표지.
**데이터**: 정상 / 긴 제목 / 긴 대사 / 이미지 누락 / 핵심체크 누락 / 학습목표 누락 / 학생·학급 누락 / 해설 누락 / 기존 공유 작품 / 세로형 레거시.
**기능**: 첫 로딩 크기 튐 없음 / 다음·이전 / 두 페이지 펼침 / 모바일 한 페이지 / 확대축소 / 전체화면 / PDF 다운로드 / 공유 링크 / 새로고침 / 공유 페이지 직접 진입.
**검증 자동화**: `npm run build`, `npm run lint`(있다면), `tsc --noEmit`. 수동 브라우저(Chrome/Edge) 캡처 비교.

## 21. DB 변경 필요 여부

- **1차 구현: DB 변경 불필요.** 모든 신규 표시 항목은 기존 localStorage 데이터 + 매퍼 + 프리셋 + 자동채움으로 해결. `shared_comic_books.pages` 구조 유지(하위 호환).
- **✅ 승인 완료(코드 변경, DB 아님)**: PDF 포맷 16:9(`[1600,900]`) 전환 — 보호 항목 "A4 1123×794" 오버라이드는 **사용자가 승인**(결정 B). 구현 단계에서 적용.
- **별도 승인 필요 항목(본 단계 미적용)**:
  1. 뒤표지 `pledge/teacherMessage/nextLearning` 영구 저장 필드(3차).
  2. 스토리 `facts[]`/이미지, 퀴즈 `hint/explanation(AI)` 구조화 저장(2~3차).
  3. 학급 데이터 정합성(`students`↔`classes` 또는 classNumber).
  4. orientation/version 컬럼(2차 공유 DOM 전환 시, 선택적).
- **절차**: DB 변경은 본 계획서에서 제안만 하고, **별도 승인 없이 마이그레이션/`db push`/RLS 수정 금지**(메모리·AGENTS.md §5 일관).

## 22. 예상 작업 범위 및 우선순위

- **P0(핵심, 1차)**: 모델+매퍼(1), 16:9 프레임+배경+파스텔 토큰(2), 템플릿 5종(3), 페이지 배열(4), 뷰어 통합+크기 튐 해결(5).
- **P1(연동)**: 16:9 캡처/PDF(6, PDF 포맷 16:9 전환은 ✅ 승인 완료), 레거시 외관 호환(7).
- **P2(개선, 2~3차·승인 필요)**: 뒤표지 입력 항목, AI 해설/힌트, 스토리 구조화/이미지, 학급 정합성, 공유 DOM 전환.
- **범위 추정**: 1차(P0+P1) = 신규 7~8파일 + 수정 ~10파일. 2~3차는 DB/서비스 추가 포함.

## 23. 생성한 계획 문서 경로

- 본 문서: `docs/flipbook-landscape-redesign-plan.md`(단일 종합 계획서).
- 보조 문서 분리는 필요 시 `docs/flipbook-redesign/0X-*.md`로 확장 가능(본 단계에서는 미생성, 단일 문서로 충분).
- 참조 기존 산출물(수정 금지, 참고용): `docs/design/flipbook-redesign/00-investigation-and-plan.md`, `docs/design/flipbook-redesign/v2/*.html`, `src/modules/student/styles/flipbook.css`.

## 24. 최종 Git 상태

- 본 단계(계획서 작성)에서는 애플리케이션 소스를 일절 수정하지 않았다.
- 유일한 변경: 본 계획서 신규 파일 추가(`docs/flipbook-landscape-redesign-plan.md`).
- 작업 전과 동일하게 미추적 파일(scratch_*, reports/, manual-captures/ 등)만 존재하며, 추적 중인 소스는 변경 없음.
- 본 단계에서 Git commit / push / main 병합 수행하지 않음(요청 §8 준수).
- 최종 확인은 본 보고 직전 `git status`로 수행(아래 실행 결과는 구현 단계 진입 시 재확인).

```bash
# 구현 단계 진입 전 확인 명령(참고용, 본 단계 미실행)
npm run build
git status
git diff
```

---

## 부록: 이후 구현 단계 Git/배포 원칙 (요청 §20 반영)

이후 실제 구현 단계에서는 아래 흐름을 따른다(본 계획서 단계가 아님).

```bash
npm run build          # 빌드 선행
git status
git diff
# 기능 브랜치에서 커밋·push 후 검증 완료 시
git checkout main
git pull origin main
git merge <기능브랜치>
git push origin main   # Vercel main 기준 배포
```

- DB 마이그레이션, `supabase db push`, Edge Function 배포는 본 요청 범위 외. DB 변경이 필요한 경우 본 계획서 §21에 명시된 대로 **별도 승인**을 받은 후에만 진행.
